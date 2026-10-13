package com.rooyesh.study;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Refreshes the pinned study calendar daily and sends a gentle 13:00 reminder when needed. */
public final class DailyReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        StudyNotifications.ensureChannels(context);
        SharedPreferences prefs = context.getSharedPreferences(StudyNotifications.PREFS, Context.MODE_PRIVATE);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        String savedDate = prefs.getString("date", "");
        if (!today.equals(savedDate)) {
            prefs.edit().putString("date", today).putInt("minutes", 0).apply();
        }
        int minutes = Math.max(0, prefs.getInt("minutes", 0));
        int goal = Math.max(1, Math.min(1440, prefs.getInt("goal", 120)));
        StudyNotifications.showCalendar(context, minutes, goal);

        String kind = intent == null ? StudyNotifications.KIND_MIDNIGHT
                : intent.getStringExtra(StudyNotifications.EXTRA_KIND);
        if (StudyNotifications.KIND_REMINDER.equals(kind)) {
            StudyNotifications.maybePostDailyReminder(context, minutes);
            StudyNotifications.scheduleNextAlarm(context, StudyNotifications.KIND_REMINDER);
        } else {
            StudyNotifications.scheduleNextAlarm(context, StudyNotifications.KIND_MIDNIGHT);
        }
    }
}
