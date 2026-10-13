package com.rooyesh.study;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/** Persistent study-calendar notification and daily start reminder. */
public final class StudyNotifications {
    static final String PREFS = "rooyesh_notifications";
    static final String CHANNEL_CALENDAR = "rooyesh-study-calendar";
    static final String CHANNEL_REMINDER = "rooyesh-study-reminders";
    static final int CALENDAR_ID = 37101;
    static final int REMINDER_ID = 37102;
    static final String EXTRA_KIND = "kind";
    static final String KIND_MIDNIGHT = "midnight";
    static final String KIND_REMINDER = "reminder";
    private static final int ALARM_MIDNIGHT = 37111;
    private static final int ALARM_REMINDER = 37112;

    private StudyNotifications() {}

    public static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        if (manager.getNotificationChannel("rooyesh-study-timer") == null) {
            NotificationChannel timer = new NotificationChannel(
                    "rooyesh-study-timer", "رویش | اعلان‌های مطالعه", NotificationManager.IMPORTANCE_DEFAULT);
            timer.setDescription("اعلان پایان زمان مطالعه");
            manager.createNotificationChannel(timer);
        }
        if (manager.getNotificationChannel(CHANNEL_CALENDAR) == null) {
            NotificationChannel calendar = new NotificationChannel(
                    CHANNEL_CALENDAR, "رویش | تقویم همیشگی", NotificationManager.IMPORTANCE_LOW);
            calendar.setDescription("نمایش پیوستهٔ تاریخ و پیشرفت مطالعهٔ امروز");
            calendar.setSound(null, null);
            calendar.enableVibration(false);
            manager.createNotificationChannel(calendar);
        }
        if (manager.getNotificationChannel(CHANNEL_REMINDER) == null) {
            NotificationChannel reminder = new NotificationChannel(
                    CHANNEL_REMINDER, "رویش | یادآوری مطالعه", NotificationManager.IMPORTANCE_DEFAULT);
            reminder.setDescription("یادآوری ملایم در روزهایی که هنوز مطالعه شروع نشده است");
            manager.createNotificationChannel(reminder);
        }
    }

    private static boolean canPost(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        return manager != null && manager.areNotificationsEnabled();
    }

    private static Notification.Builder builder(Context context, String channel) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return new Notification.Builder(context, channel);
        }
        return new Notification.Builder(context).setPriority(Notification.PRIORITY_DEFAULT);
    }

    private static PendingIntent openAppIntent(Context context) {
        Intent open = new Intent(context, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, 37100, open, flags);
    }

    private static String todayKey() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    private static String todayLabel() {
        return new SimpleDateFormat("EEEE، d MMMM yyyy", new Locale("fa", "IR")).format(new Date());
    }

    private static String todaySolarLabel() {
        Date now = new Date();
        android.icu.util.PersianCalendar persian = new android.icu.util.PersianCalendar(new Locale("fa", "IR"));
        persian.setTime(now);
        android.icu.text.SimpleDateFormat format =
                new android.icu.text.SimpleDateFormat("d MMMM yyyy", new Locale("fa", "IR"));
        format.setCalendar(persian);
        format.setTimeZone(android.icu.util.TimeZone.getDefault());
        return format.format(now);
    }

    private static String number(int value) {
        return String.format(Locale.US, "%d", value);
    }

    public static void refreshCalendarFromPrefs(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String today = todayKey();
        int goal = Math.max(1, Math.min(1440, prefs.getInt("goal", 120)));
        int minutes = prefs.getString("date", "").equals(today) ? Math.max(0, prefs.getInt("minutes", 0)) : 0;
        updateProgress(context, minutes, goal);
    }

    public static void updateProgress(Context context, int minutes, int goal) {
        ensureChannels(context);
        int safeGoal = Math.max(1, Math.min(1440, goal));
        int safeMinutes = Math.max(0, Math.min(1440 * 30, minutes));
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString("date", todayKey()).putInt("minutes", safeMinutes).putInt("goal", safeGoal).apply();
        showCalendar(context, safeMinutes, safeGoal);
        maybePostDailyReminder(context, safeMinutes);
    }

    static void showCalendar(Context context, int minutes, int goal) {
        if (!canPost(context)) return;
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        int safeGoal = Math.max(1, Math.min(1440, goal));
        int safeMinutes = Math.max(0, Math.min(1440 * 30, minutes));
        String title = "رویش | " + todayLabel() + " · " + todaySolarLabel();
        String content = "مطالعهٔ امروز: " + number(safeMinutes) + " از " + number(safeGoal) + " دقیقه";
        String expanded = safeMinutes >= safeGoal
                ? content + " — هدف امروز کامل شد 🌱"
                : content + "؛ هر وقت آماده‌ای، یک قدم کوچک بردار.";
        Notification notification = builder(context, CHANNEL_CALENDAR)
                .setSmallIcon(R.drawable.ic_stat_rooyesh)
                .setColor(Color.rgb(71, 123, 98))
                .setContentTitle(title)
                .setContentText(content)
                .setStyle(new Notification.BigTextStyle().bigText(expanded))
                .setContentIntent(openAppIntent(context))
                .setCategory(Notification.CATEGORY_STATUS)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(true)
                .setProgress(safeGoal, Math.min(safeMinutes, safeGoal), false)
                .build();
        manager.notify(CALENDAR_ID, notification);
    }

    static void maybePostDailyReminder(Context context, int minutes) {
        if (minutes > 0 || !canPost(context)) return;
        Calendar now = Calendar.getInstance();
        if (now.get(Calendar.HOUR_OF_DAY) < 13) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String today = todayKey();
        if (today.equals(prefs.getString("lastReminderDate", ""))) return;
        String[] messages = new String[] {
                "هنوز شروع نکردی؟ پنج دقیقه هم شروع حساب می‌شود.",
                "قرار نیست یک روز کامل را جبران کنی؛ فقط از یک کار کوچک شروع کن.",
                "یک صفحه، یک تمرین یا پنج دقیقه مرور؛ انتخاب با توست."
        };
        int index = Math.abs(Calendar.getInstance().get(Calendar.DAY_OF_YEAR)) % messages.length;
        Notification reminder = builder(context, CHANNEL_REMINDER)
                .setSmallIcon(R.drawable.ic_stat_rooyesh)
                .setColor(Color.rgb(71, 123, 98))
                .setContentTitle("رویش | وقت یک شروع کوچک")
                .setContentText(messages[index])
                .setStyle(new Notification.BigTextStyle().bigText(messages[index]))
                .setContentIntent(openAppIntent(context))
                .setCategory(Notification.CATEGORY_REMINDER)
                .setAutoCancel(true)
                .setOnlyAlertOnce(true)
                .build();
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(REMINDER_ID, reminder);
            prefs.edit().putString("lastReminderDate", today).apply();
        }
    }

    public static void scheduleDailyAlarms(Context context) {
        scheduleNextAlarm(context, KIND_MIDNIGHT);
        scheduleNextAlarm(context, KIND_REMINDER);
    }

    static void scheduleNextAlarm(Context context, String kind) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return;
        boolean midnight = KIND_MIDNIGHT.equals(kind);
        Calendar when = Calendar.getInstance();
        if (midnight) {
            when.set(Calendar.HOUR_OF_DAY, 0);
            when.set(Calendar.MINUTE, 5);
        } else {
            when.set(Calendar.HOUR_OF_DAY, 13);
            when.set(Calendar.MINUTE, 0);
        }
        when.set(Calendar.SECOND, 0);
        when.set(Calendar.MILLISECOND, 0);
        if (when.getTimeInMillis() <= System.currentTimeMillis()) when.add(Calendar.DAY_OF_YEAR, 1);
        Intent intent = new Intent(context, DailyReminderReceiver.class);
        intent.putExtra(EXTRA_KIND, kind);
        int requestCode = midnight ? ALARM_MIDNIGHT : ALARM_REMINDER;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pending = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), pending);
        } else {
            manager.set(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), pending);
        }
    }
}
