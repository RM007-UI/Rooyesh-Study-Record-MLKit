package com.rooyesh.study;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Delivers the scheduled user alarm. */
public final class StudyAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        StudyAlarmManager.onAlarmTriggered(context);
    }
}