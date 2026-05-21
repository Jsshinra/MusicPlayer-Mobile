package com.lumen.mobile;

import android.content.Intent;

import androidx.annotation.Nullable;
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

    private ExoPlayer player;
    private MediaSession session;

    @Override
    public void onCreate() {
        super.onCreate();
        player = new ExoPlayer.Builder(this).build();
        session = new MediaSession.Builder(this, player).build();
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
