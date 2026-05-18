package com.lumen.mobile;

import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native audio engine for Lumen Mobile.
 *
 * Wraps ExoPlayer to provide gapless, buffered playback that survives the
 * WebView (unlike HTMLAudioElement, which Android suspends/stutters once the
 * app goes background). Phase 1: foreground playback only; MediaSession +
 * foreground service for background playback follows in a separate phase.
 *
 * Threading: ExoPlayer must be touched on the application's main thread, so
 * every method posts to mainHandler. The position-update poll runs there too.
 */
@CapacitorPlugin(name = "AudioEngine")
public class AudioEnginePlugin extends Plugin {

    private static final long POSITION_INTERVAL_MS = 250;

    private ExoPlayer player;
    private Handler mainHandler;
    private Runnable positionUpdater;

    @Override
    public void load() {
        super.load();
        mainHandler = new Handler(Looper.getMainLooper());
        mainHandler.post(this::initPlayer);
    }

    @Override
    protected void handleOnDestroy() {
        stopPositionUpdates();
        if (mainHandler != null) {
            mainHandler.post(() -> {
                if (player != null) {
                    player.release();
                    player = null;
                }
            });
        }
        super.handleOnDestroy();
    }

    private void initPlayer() {
        player = new ExoPlayer.Builder(getContext()).build();
        player.addListener(new Player.Listener() {
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
        startPositionUpdates();
    }

    @PluginMethod
    public void loadTrack(PluginCall call) {
        final String uri = call.getString("uri");
        if (uri == null || uri.isEmpty()) {
            call.reject("Missing uri");
            return;
        }
        mainHandler.post(() -> {
            try {
                player.setMediaItem(MediaItem.fromUri(Uri.parse(uri)));
                player.prepare();
                player.setPlayWhenReady(false);
                call.resolve();
            } catch (Exception e) {
                call.reject("loadTrack failed", e);
            }
        });
    }

    @PluginMethod
    public void play(PluginCall call) {
        mainHandler.post(() -> {
            try {
                player.play();
                call.resolve();
            } catch (Exception e) {
                call.reject("play failed", e);
            }
        });
    }

    @PluginMethod
    public void pause(PluginCall call) {
        mainHandler.post(() -> {
            try {
                player.pause();
                call.resolve();
            } catch (Exception e) {
                call.reject("pause failed", e);
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        mainHandler.post(() -> {
            try {
                player.stop();
                player.clearMediaItems();
                call.resolve();
            } catch (Exception e) {
                call.reject("stop failed", e);
            }
        });
    }

    @PluginMethod
    public void seek(PluginCall call) {
        final long positionMs = call.getLong("positionMs", 0L);
        mainHandler.post(() -> {
            try {
                player.seekTo(positionMs);
                call.resolve();
            } catch (Exception e) {
                call.reject("seek failed", e);
            }
        });
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        Double v = call.getDouble("volume");
        final float volume = v != null ? Math.max(0f, Math.min(1f, v.floatValue())) : 1f;
        mainHandler.post(() -> {
            try {
                player.setVolume(volume);
                call.resolve();
            } catch (Exception e) {
                call.reject("setVolume failed", e);
            }
        });
    }

    @PluginMethod
    public void getState(PluginCall call) {
        mainHandler.post(() -> {
            try {
                JSObject ret = new JSObject();
                ret.put("isPlaying", player.isPlaying());
                ret.put("positionMs", Math.max(0, player.getCurrentPosition()));
                long duration = player.getDuration();
                ret.put("durationMs", duration > 0 ? duration : 0);
                ret.put("state", mapState(player.getPlaybackState()));
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("getState failed", e);
            }
        });
    }

    private void startPositionUpdates() {
        positionUpdater = new Runnable() {
            @Override
            public void run() {
                if (player != null && player.isPlaying()) {
                    JSObject data = new JSObject();
                    data.put("positionMs", Math.max(0, player.getCurrentPosition()));
                    long duration = player.getDuration();
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
