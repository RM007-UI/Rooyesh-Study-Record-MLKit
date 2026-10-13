package com.rooyesh.study;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONObject;

import java.util.Calendar;

/** Saves and schedules a daily alarm chosen by the user. */
public final class StudyAlarmManager {
    private static final String PREFS = "rooyesh_user_alarm";
    private static final int REQUEST_ALARM = 37121;

    private StudyAlarmManager() {}

    public static boolean isValidTime(String time) {
        return time != null && time.matches("([01][0-9]|2[0-3]):[0-5][0-9]");
    }

    public static boolean canScheduleExact(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        return manager != null && manager.canScheduleExactAlarms();
    }

    public static void saveAndSchedule(Context context, String time, boolean repeatDaily, int volumePercent) {
        if (!isValidTime(time)) return;
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putBoolean("enabled", true)
                .putString("time", time)
                .putBoolean("repeatDaily", repeatDaily)
                .putInt("volume", Math.max(35, Math.min(100, volumePercent)))
                .apply();
        schedule(context);
    }

    public static String configJson(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONObject json = new JSONObject();
        try {
            json.put("enabled", prefs.getBoolean("enabled", false));
            json.put("time", prefs.getString("time", "08:00"));
            json.put("repeatDaily", prefs.getBoolean("repeatDaily", true));
            json.put("volume", prefs.getInt("volume", 100));
            json.put("exactPermission", canScheduleExact(context));
            return json.toString();
        } catch (Exception ignored) {
            return "{\"enabled\":false,\"time\":\"08:00\",\"repeatDaily\":true,\"volume\":100,\"exactPermission\":false}";
        }
    }

    public static void restoreIfEnabled(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (prefs.getBoolean("enabled", false)) schedule(context);
    }

    public static void schedule(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!prefs.getBoolean("enabled", false)) return;
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return;

        String time = prefs.getString("time", "08:00");
        if (!isValidTime(time)) time = "08:00";
        String[] parts = time.split(":");
        Calendar when = Calendar.getInstance();
        when.set(Calendar.HOUR_OF_DAY, Integer.parseInt(parts[0]));
        when.set(Calendar.MINUTE, Integer.parseInt(parts[1]));
        when.set(Calendar.SECOND, 0);
        when.set(Calendar.MILLISECOND, 0);
        if (when.getTimeInMillis() <= System.currentTimeMillis()) {
            when.add(Calendar.DAY_OF_YEAR, 1);
        }

        Intent intent = new Intent(context, StudyAlarmReceiver.class);
        PendingIntent pending = alarmPendingIntent(context, intent);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !canScheduleExact(context)) {
                manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), pending);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), pending);
            } else {
                manager.setExact(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), pending);
            }
        } catch (SecurityException ignored) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), pending);
            } else {
                manager.set(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), pending);
            }
        }
    }

    static void onAlarmTriggered(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!prefs.getBoolean("enabled", false)) return;
        boolean repeatDaily = prefs.getBoolean("repeatDaily", true);
        int volume = Math.max(35, Math.min(100, prefs.getInt("volume", 100)));
        if (repeatDaily) {
            schedule(context);
        } else {
            prefs.edit().putBoolean("enabled", false).apply();
        }
        StudyAlarmService.start(context, StudyAlarmService.ACTION_RING, volume);
    }

    public static void cancel(Context context) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager != null) {
            manager.cancel(alarmPendingIntent(context, new Intent(context, StudyAlarmReceiver.class)));
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putBoolean("enabled", false).apply();
        context.stopService(new Intent(context, StudyAlarmService.class));
    }

    private static PendingIntent alarmPendingIntent(Context context, Intent intent) {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, REQUEST_ALARM, intent, flags);
    }
}