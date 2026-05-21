package com.lumen.mobile;

import android.content.Intent;

import androidx.annotation.Nullable;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.ForwardingPlayer;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

/**
 * Foreground service that owns the ExoPlayer + MediaSession.
 *
 * Lives independently of the Capacitor Activity so playback keeps running once
 * the WebView is paused (screen off, app backgrounded). MediaSessionService
 * also gives us the system lock-screen / notification controls for free via
 * Media3's default MediaNotification.Provider.
 *
 * The activity-side {@link AudioEnginePlugin} talks to this service through a
 * MediaController, which Android auto-starts when the controller connects.
 */
public class LumenMediaSessionService extends MediaSessionService {

    private static final AudioAttributes MUSIC_ATTRS = new AudioAttributes.Builder()
        .setUsage(C.USAGE_MEDIA)
        .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
        .build();

    // Mirrors the user-facing toggle. Read on player creation, kept in sync
    // when the plugin pushes a change at runtime.
    private static volatile boolean audioFocusEnabled = true;
    private static volatile LumenMediaSessionService instance;

    /** Bluetooth / lock-screen skip → callback into the plugin → JS queue. */
    public interface SkipListener {
        void onNext();
        void onPrevious();
    }
    private static volatile SkipListener skipListener;
    public static void setSkipListener(SkipListener listener) {
        skipListener = listener;
    }

    private ExoPlayer player;
    private MediaSession session;

    /** Called from {@link AudioEnginePlugin} when the user flips the setting. */
    public static void applyAudioFocusEnabled(boolean enabled) {
        audioFocusEnabled = enabled;
        LumenMediaSessionService self = instance;
        if (self != null && self.player != null) {
            ExoPlayer p = self.player;
            // Always handle becoming-noisy (headphones unplug → pause). It's
            // independent of audio focus and there's no reason to disable it.
            p.setAudioAttributes(MUSIC_ATTRS, enabled);
            p.setHandleAudioBecomingNoisy(true);
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        player = new ExoPlayer.Builder(this)
            .setAudioAttributes(MUSIC_ATTRS, audioFocusEnabled)
            .setHandleAudioBecomingNoisy(true)
            .build();
        // Wrap the player so the lock-screen / headset / Bluetooth "skip"
        // controls flow back into JS instead of trying (and failing) to
        // advance a single-item ExoPlayer timeline. The JS-side queue then
        // calls loadTrack() with the next song.
        Player wrapped = new SkipForwardingPlayer(player);
        session = new MediaSession.Builder(this, wrapped).build();
        instance = this;
    }

    /**
     * Forwards everything to the wrapped player except next/previous, which we
     * always advertise as available so external transport controls show the
     * skip buttons, and which we redirect to {@link #skipListener} so the JS
     * queue stays the source of truth.
     */
    private static final class SkipForwardingPlayer extends ForwardingPlayer {
        SkipForwardingPlayer(Player player) {
            super(player);
        }

        @Override
        public Commands getAvailableCommands() {
            return super.getAvailableCommands().buildUpon()
                .add(Player.COMMAND_SEEK_TO_NEXT)
                .add(Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM)
                .add(Player.COMMAND_SEEK_TO_PREVIOUS)
                .add(Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM)
                .build();
        }

        @Override
        public boolean isCommandAvailable(int command) {
            if (command == Player.COMMAND_SEEK_TO_NEXT
                || command == Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM
                || command == Player.COMMAND_SEEK_TO_PREVIOUS
                || command == Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM) {
                return true;
            }
            return super.isCommandAvailable(command);
        }

        @Override
        public boolean hasNextMediaItem() {
            return true;
        }

        @Override
        public boolean hasPreviousMediaItem() {
            return true;
        }

        @Override
        public void seekToNext() {
            SkipListener l = skipListener;
            if (l != null) l.onNext();
        }

        @Override
        public void seekToNextMediaItem() {
            SkipListener l = skipListener;
            if (l != null) l.onNext();
        }

        @Override
        public void seekToPrevious() {
            SkipListener l = skipListener;
            if (l != null) l.onPrevious();
        }

        @Override
        public void seekToPreviousMediaItem() {
            SkipListener l = skipListener;
            if (l != null) l.onPrevious();
        }
    }

    @Nullable
    @Override
    public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) {
        return session;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // User swiped Lumen away from recents — treat that as "I'm done",
        // stop playback and release the service. Background playback while
        // the app is just minimized / screen-locked still works because that
        // path doesn't trigger onTaskRemoved.
        if (player != null) {
            player.stop();
            player.clearMediaItems();
        }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        if (instance == this) instance = null;
        if (session != null) {
            session.release();
            session = null;
        }
        if (player != null) {
            player.release();
            player = null;
        }
        super.onDestroy();
    }
}
