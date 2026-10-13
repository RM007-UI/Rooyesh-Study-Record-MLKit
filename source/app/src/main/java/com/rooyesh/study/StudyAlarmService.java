package com.rooyesh.study;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.Icon;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

/** Plays a short melodic chime in alarm audio mode and provides a stop action. */
public final class StudyAlarmService extends Service {
    public static final String ACTION_RING = "com.rooyesh.study.ALARM_RING";
    public static final String ACTION_PREVIEW = "com.rooyesh.study.ALARM_PREVIEW";
    public static final String ACTION_STOP = "com.rooyesh.study.ALARM_STOP";
    private static final String CHANNEL_ID = "rooyesh-daily-alarm";
    private static final int NOTIFICATION_ID = 37131;
    private static final int SAMPLE_RATE = 44100;
    private static final long MAX_RING_MILLIS = 8 * 60 * 1000L;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private AudioTrack track;
    private PowerManager.WakeLock wakeLock;
    private final Runnable timeout = this::stopPlayback;

    public static void start(Context context, String action, int volumePercent) {
        Intent intent = new Intent(context, StudyAlarmService.class);
        intent.setAction(action);
        intent.putExtra("volume", Math.max(35, Math.min(100, volumePercent)));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopPlayback();
            return START_NOT_STICKY;
        }
        boolean preview = intent != null && ACTION_PREVIEW.equals(intent.getAction());
        int volume = intent == null ? 100 : intent.getIntExtra("volume", 100);
        startForeground(NOTIFICATION_ID, makeNotification(preview));
        handler.removeCallbacks(timeout);
        releaseAudio();
        playChime(volume);
        acquireWakeLock(preview ? 15_000L : MAX_RING_MILLIS);
        handler.postDelayed(timeout, preview ? 12_000L : MAX_RING_MILLIS);
        return START_NOT_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "رویش | زنگ شخصی", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("اعلان کنترل زنگ روزانه");
        channel.setSound(null, null);
        channel.enableVibration(false);
        manager.createNotificationChannel(channel);
    }

    private Notification makeNotification(boolean preview) {
        Intent open = new Intent(this, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent openPending = PendingIntent.getActivity(this, 37130, open, flags);

        Intent stop = new Intent(this, StudyAlarmService.class);
        stop.setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(this, 37132, stop, flags);
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this).setPriority(Notification.PRIORITY_LOW);
        builder.setSmallIcon(R.drawable.ic_stat_rooyesh)
                .setColor(Color.rgb(71, 123, 98))
                .setContentTitle(preview ? "رویش | پیش‌نمایش زنگ" : "رویش | وقتشه 🌱")
                .setContentText(preview
                        ? "این فقط پیش‌نمایش صداست."
                        : "آروم شروع کن؛ همین یک قدم کافیه.")
                .setContentIntent(openPending)
                .setCategory(Notification.CATEGORY_ALARM)
                .setOnlyAlertOnce(true)
                .setOngoing(!preview)
                .addAction(new Notification.Action.Builder(
                        Icon.createWithResource(this, R.drawable.ic_stat_rooyesh),
                        "خاموش‌کردن زنگ", stopPending).build());
        return builder.build();
    }

    private void acquireWakeLock(long timeoutMillis) {
        PowerManager manager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (manager == null) return;
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
            wakeLock = manager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Rooyesh:StudyAlarm");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(timeoutMillis);
        } catch (Exception ignored) {
            wakeLock = null;
        }
    }

    private void playChime(int volumePercent) {
        short[] samples = makeChimeSamples();
        try {
            track = new AudioTrack(AudioManager.STREAM_ALARM, SAMPLE_RATE,
                    AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT,
                    samples.length * 2, AudioTrack.MODE_STATIC);
            int written = track.write(samples, 0, samples.length);
            if (written < 0) {
                releaseAudio();
                return;
            }
            track.setLoopPoints(0, samples.length, -1);
            track.setVolume(Math.max(0.35f, Math.min(1.0f, volumePercent / 100.0f)));
            track.play();
        } catch (Exception ignored) {
            releaseAudio();
        }
    }

    /** A gentle consonant bell-like arpeggio; it makes no medical or therapeutic claims. */
    private short[] makeChimeSamples() {
        double[] notes = {523.25, 659.25, 783.99, 1046.50, 783.99, 659.25};
        int noteSamples = (int) (SAMPLE_RATE * 0.34);
        int gapSamples = (int) (SAMPLE_RATE * 0.055);
        int tailSamples = (int) (SAMPLE_RATE * 0.55);
        short[] result = new short[notes.length * (noteSamples + gapSamples) + tailSamples];
        int index = 0;
        for (double frequency : notes) {
            for (int n = 0; n < noteSamples; n++) {
                double t = n / (double) SAMPLE_RATE;
                double attack = Math.min(1.0, t / 0.018);
                double envelope = attack * Math.exp(-3.1 * t);
                double wave = Math.sin(2.0 * Math.PI * frequency * t)
                        + 0.25 * Math.sin(2.0 * Math.PI * frequency * 2.01 * t)
                        + 0.07 * Math.sin(2.0 * Math.PI * frequency * 3.0 * t);
                double value = Math.max(-0.98, Math.min(0.98, wave * envelope * 0.56));
                result[index++] = (short) (value * 32767);
            }
            for (int n = 0; n < gapSamples; n++) result[index++] = 0;
        }
        // The extra tail provides a small pause before the chime loops again.
        return result;
    }

    private void stopPlayback() {
        handler.removeCallbacks(timeout);
        releaseAudio();
        if (wakeLock != null) {
            try {
                if (wakeLock.isHeld()) wakeLock.release();
            } catch (Exception ignored) { }
            wakeLock = null;
        }
        stopForeground(true);
        stopSelf();
    }

    private void releaseAudio() {
        if (track == null) return;
        try {
            if (track.getPlayState() == AudioTrack.PLAYSTATE_PLAYING) track.stop();
        } catch (Exception ignored) { }
        try { track.release(); } catch (Exception ignored) { }
        track = null;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(timeout);
        releaseAudio();
        if (wakeLock != null) {
            try { if (wakeLock.isHeld()) wakeLock.release(); } catch (Exception ignored) { }
            wakeLock = null;
        }
        stopForeground(true);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}