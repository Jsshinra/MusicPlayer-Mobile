package com.lumen.mobile;

import android.content.ComponentName;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.common.util.concurrent.MoreExecutors;

/**
 * Bridge between the Capacitor JS world and our {@link LumenMediaSessionService}.
 *
 * The plugin itself no longer owns an ExoPlayer; instead it connects a Media3
 * MediaController to the foreground service so playback survives the WebView
 * being paused or the activity being destroyed. The controller proxies the
 * Player API onto the service's ExoPlayer.
 *
 * Threading: MediaController must be used on the main thread, so every method
 * posts to mainHandler. The connection is async — commands invoked before the
 * controller is ready are queued via the future's completion listener.
 */
@CapacitorPlugin(name = "AudioEngine")
public class AudioEnginePlugin extends Plugin {

    private static final long POSITION_INTERVAL_MS = 250;

    private MediaController controller;
    private ListenableFuture<MediaController> controllerFuture;
    private Handler mainHandler;
    private Runnable positionUpdater;

    @Override
    public void load() {
        super.load();
        mainHandler = new Handler(Looper.getMainLooper());
        mainHandler.post(this::connectController);
        LumenMediaSessionService.setSkipListener(new LumenMediaSessionService.SkipListener() {
            @Override
            public void onNext() {
                notifyListeners("skipNext", new JSObject());
            }
            @Override
            public void onPrevious() {
                notifyListeners("skipPrevious", new JSObject());
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        stopPositionUpdates();
        LumenMediaSessionService.setSkipListener(null);
        if (mainHandler != null) {
            mainHandler.post(() -> {
                if (controller != null) {
                    controller.release();
                    controller = null;
                }
                if (controllerFuture != null) {
                    MediaController.releaseFuture(controllerFuture);
                    controllerFuture = null;
                }
            });
        }
        super.handleOnDestroy();
    }

    private void connectController() {
        SessionToken token = new SessionToken(
            getContext(),
            new ComponentName(getContext(), LumenMediaSessionService.class)
        );
        controllerFuture = new MediaController.Builder(getContext(), token).buildAsync();
        controllerFuture.addListener(() -> {
            try {
                MediaController c = controllerFuture.get();
                controller = c;
                attachPlayerListener(c);
                startPositionUpdates();
            } catch (Exception e) {
                JSObject data = new JSObject();
                data.put("code", -1);
                data.put("message", "Failed to connect to media session: " + e.getMessage());
                notifyListeners("error", data);
            }
        }, mainHandler::post);
    }

    private void attachPlayerListener(MediaController c) {
        c.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                JSObject data = new JSObject();
                data.put("state", mapState(playbackState));
                notifyListeners("stateChanged", data);
            }

            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                JSObject data = new JSObject();
                data.put("isPlaying", isPlaying);
                notifyListeners("playingChanged", data);
            }

            @Override
            public void onPlayerError(PlaybackException error) {
                JSObject data = new JSObject();
                data.put("code", error.errorCode);
                data.put("message", error.getMessage() != null ? error.getMessage() : "Unknown playback error");
                notifyListeners("error", data);
            }
        });
    }

    /** Runs {@code task} once the controller is ready, then resolves the call. */
    private void runOnController(PluginCall call, ControllerTask task) {
        mainHandler.post(() -> {
            if (controller != null) {
                executeTask(call, task);
                return;
            }
            if (controllerFuture == null) {
                call.reject("Audio engine not initialized");
                return;
            }
            controllerFuture.addListener(
                () -> mainHandler.post(() -> {
                    if (controller != null) {
                        executeTask(call, task);
                    } else {
                        call.reject("Audio engine not ready");
                    }
                }),
                MoreExecutors.directExecutor()
            );
        });
    }

    private void executeTask(PluginCall call, ControllerTask task) {
        try {
            task.run(controller);
            call.resolve();
        } catch (Exception e) {
            call.reject("operation failed", e);
        }
    }

    @FunctionalInterface
    private interface ControllerTask {
        void run(MediaController c) throws Exception;
    }

    @PluginMethod
    public void loadTrack(PluginCall call) {
        final String uri = call.getString("uri");
        final String title = call.getString("title");
        final String artist = call.getString("artist");
        final String album = call.getString("album");
        final String artworkUri = call.getString("artworkUri");
        if (uri == null || uri.isEmpty()) {
            call.reject("Missing uri");
            return;
        }
        runOnController(call, c -> {
            MediaMetadata.Builder meta = new MediaMetadata.Builder();
            if (title != null) meta.setTitle(title);
            if (artist != null) meta.setArtist(artist);
            if (album != null) meta.setAlbumTitle(album);
            if (artworkUri != null && !artworkUri.isEmpty()) {
                meta.setArtworkUri(Uri.parse(artworkUri));
            }
            MediaItem item = new MediaItem.Builder()
                .setUri(Uri.parse(uri))
                .setMediaMetadata(meta.build())
                .build();
            c.setMediaItem(item);
            c.prepare();
            c.setPlayWhenReady(false);
        });
    }

    @PluginMethod
    public void play(PluginCall call) {
        runOnController(call, MediaController::play);
    }

    @PluginMethod
    public void pause(PluginCall call) {
        runOnController(call, MediaController::pause);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        runOnController(call, c -> {
            c.stop();
            c.clearMediaItems();
        });
    }

    @PluginMethod
    public void seek(PluginCall call) {
        final long positionMs = call.getLong("positionMs", 0L);
        runOnController(call, c -> c.seekTo(positionMs));
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        Double v = call.getDouble("volume");
        final float volume = v != null ? Math.max(0f, Math.min(1f, v.floatValue())) : 1f;
        runOnController(call, c -> c.setVolume(volume));
    }

    @PluginMethod
    public void setAudioFocusEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        final boolean value = enabled == null ? true : enabled;
        mainHandler.post(() -> {
            LumenMediaSessionService.applyAudioFocusEnabled(value);
            call.resolve();
        });
    }

    @PluginMethod
    public void getState(PluginCall call) {
        mainHandler.post(() -> {
            if (controller == null) {
                JSObject ret = new JSObject();
                ret.put("isPlaying", false);
                ret.put("positionMs", 0);
                ret.put("durationMs", 0);
                ret.put("state", "idle");
                call.resolve(ret);
                return;
            }
            try {
                JSObject ret = new JSObject();
                ret.put("isPlaying", controller.isPlaying());
                ret.put("positionMs", Math.max(0, controller.getCurrentPosition()));
                long duration = controller.getDuration();
                ret.put("durationMs", duration > 0 ? duration : 0);
                ret.put("state", mapState(controller.getPlaybackState()));
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("getState failed", e);
            }
        });
    }

    private void startPositionUpdates() {
        if (positionUpdater != null) return;
        positionUpdater = new Runnable() {
            @Override
            public void run() {
                if (controller != null && controller.isPlaying()) {
                    JSObject data = new JSObject();
                    data.put("positionMs", Math.max(0, controller.getCurrentPosition()));
                    long duration = controller.getDuration();
                    data.put("durationMs", duration > 0 ? duration : 0);
                    notifyListeners("position", data);
                }
                if (mainHandler != null) {
                    mainHandler.postDelayed(this, POSITION_INTERVAL_MS);
                }
            }
        };
        mainHandler.postDelayed(positionUpdater, POSITION_INTERVAL_MS);
    }

    private void stopPositionUpdates() {
        if (mainHandler != null && positionUpdater != null) {
            mainHandler.removeCallbacks(positionUpdater);
        }
        positionUpdater = null;
    }

    private static String mapState(int state) {
        switch (state) {
            case Player.STATE_IDLE:
                return "idle";
            case Player.STATE_BUFFERING:
                return "loading";
            case Player.STATE_READY:
                return "ready";
            case Player.STATE_ENDED:
                return "ended";
            default:
                return "idle";
        }
    }
}
