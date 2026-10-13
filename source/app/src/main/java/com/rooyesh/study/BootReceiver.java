package com.rooyesh.study;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Rebuilds the daily alarms after device startup, time changes or an app update. */
public final class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        StudyNotifications.ensureChannels(context);
        StudyNotifications.scheduleDailyAlarms(context);
        StudyNotifications.refreshCalendarFromPrefs(context);
        StudyAlarmManager.restoreIfEnabled(context);
    }
}
