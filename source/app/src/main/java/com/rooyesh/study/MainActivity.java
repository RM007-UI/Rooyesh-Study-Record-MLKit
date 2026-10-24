package com.rooyesh.study;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.mlkit.common.model.RemoteModelManager;
import com.google.mlkit.common.model.DownloadConditions;
import com.google.mlkit.nl.translate.TranslateLanguage;
import com.google.mlkit.nl.translate.TranslateRemoteModel;
import com.google.mlkit.nl.translate.Translation;
import com.google.mlkit.nl.translate.Translator;
import com.google.mlkit.nl.translate.TranslatorOptions;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Native Android host for the Rooyesh WebView UI, PDF export and Google ML Kit offline translation.
 * Application ID remains com.rooyesh.study.app; Activity class remains com.rooyesh.study.MainActivity.
 */
public final class MainActivity extends Activity {
    private static final int REQUEST_GOOGLE_SIGN_IN = 557;
    private static final int REQUEST_WRITE_STORAGE = 555;
    private static final int REQUEST_POST_NOTIFICATIONS = 556;
    private static final String TIMER_NOTIFICATION_CHANNEL = "rooyesh-study-timer";
    private WebView webView;
    private GoogleSignInClient googleSignInClient;
    private String googleIdToken = "";
    private String googleEmail = "";
    private final Map<String, Translator> translators = new HashMap<>();

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        String webClientId = getString(R.string.rooyesh_google_web_client_id);
        if (!webClientId.trim().isEmpty() && !webClientId.startsWith("REPLACE_")) {
            GoogleSignInOptions signInOptions = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(webClientId.trim())
                    .requestEmail()
                    .build();
            googleSignInClient = GoogleSignIn.getClient(this, signInOptions);
        }
        StudyNotifications.ensureChannels(this);
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setDefaultTextEncodingName("UTF-8");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }
        webView.addJavascriptInterface(new RooyeshNative(), "RooyeshNative");
        webView.setWebChromeClient(new WebChromeClient());
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
        StudyNotifications.scheduleDailyAlarms(this);
        requestNotificationsOnStartup();
    }

    private void requestNotificationsOnStartup() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQUEST_POST_NOTIFICATIONS);
        } else {
            StudyNotifications.refreshCalendarFromPrefs(this);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_POST_NOTIFICATIONS) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                    || (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED)) {
                StudyNotifications.refreshCalendarFromPrefs(this);
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        StudyAlarmManager.restoreIfEnabled(this);
        if (webView != null) {
            webView.post(() -> webView.evaluateJavascript(
                    "window.RooyeshAlarmUI && window.RooyeshAlarmUI.onResume()", null));
        }
    }

    @Override
    protected void onDestroy() {
        for (Translator translator : translators.values()) {
            try { translator.close(); } catch (Exception ignored) { }
        }
        translators.clear();
        if (webView != null) {
            webView.removeJavascriptInterface("RooyeshNative");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private synchronized Translator getTranslator(String sourceCode, String targetCode) {
        String source = mapLanguage(sourceCode);
        String target = mapLanguage(targetCode);
        if (source.equals(target)) throw new IllegalArgumentException("Source and target languages must differ.");
        String key = source + "-" + target;
        Translator existing = translators.get(key);
        if (existing != null) return existing;
        TranslatorOptions options = new TranslatorOptions.Builder()
                .setSourceLanguage(source)
                .setTargetLanguage(target)
                .build();
        Translator created = Translation.getClient(options);
        translators.put(key, created);
        return created;
    }

    private String mapLanguage(String code) {
        if ("en".equalsIgnoreCase(code) || "english".equalsIgnoreCase(code)) return TranslateLanguage.ENGLISH;
        if ("fa".equalsIgnoreCase(code) || "persian".equalsIgnoreCase(code)) return TranslateLanguage.PERSIAN;
        throw new IllegalArgumentException("Only English and Persian are enabled in Rooyesh.");
    }

    private boolean needsPersianModel(String sourceCode, String targetCode) {
        return "fa".equalsIgnoreCase(sourceCode) || "persian".equalsIgnoreCase(sourceCode)
                || "fa".equalsIgnoreCase(targetCode) || "persian".equalsIgnoreCase(targetCode);
    }

    private interface ModelStatusCallback {
        void onStatus(boolean ready, Exception error);
    }

    private void checkModelStatus(String source, String target, ModelStatusCallback callback) {
        try {
            mapLanguage(source);
            mapLanguage(target);
            if (!needsPersianModel(source, target)) {
                callback.onStatus(true, null);
                return;
            }
            RemoteModelManager.getInstance()
                    .getDownloadedModels(TranslateRemoteModel.class)
                    .addOnSuccessListener(models -> {
                        TranslateRemoteModel persian = new TranslateRemoteModel.Builder(TranslateLanguage.PERSIAN).build();
                        callback.onStatus(models.contains(persian), null);
                    })
                    .addOnFailureListener(error -> callback.onStatus(false, error));
        } catch (Exception e) {
            callback.onStatus(false, e);
        }
    }

    private void ensureTimerNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager == null || manager.getNotificationChannel(TIMER_NOTIFICATION_CHANNEL) != null) return;
        NotificationChannel channel = new NotificationChannel(
                TIMER_NOTIFICATION_CHANNEL, "رویش | اعلان‌های مطالعه", NotificationManager.IMPORTANCE_DEFAULT);
        channel.setDescription("یادآوری پایان تایمر مطالعه");
        manager.createNotificationChannel(channel);
    }

    private boolean showTimerNotification(String subject) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                    && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager == null) return false;
            String label = subject == null || subject.trim().isEmpty() ? "مطالعه" : subject.trim();
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, pendingFlags);
            String message = "جلسهٔ " + label + " به پایان رسید.";
            Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? new Notification.Builder(this, TIMER_NOTIFICATION_CHANNEL)
                    : new Notification.Builder(this);
            builder.setSmallIcon(R.drawable.ic_stat_rooyesh)
                    .setContentTitle("رویش | پایان زمان مطالعه")
                    .setContentText(message)
                    .setStyle(new Notification.BigTextStyle().bigText(message))
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);
            int notificationId = (int) (System.currentTimeMillis() & 0x7fffffffL);
            manager.notify(notificationId, builder.build());
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private void sendResult(String requestId, String action, boolean success, String message,
                            String text, Boolean modelReady, String errorCode) {
        JSONObject event = new JSONObject();
        try {
            event.put("requestId", requestId == null ? "" : requestId);
            event.put("action", action == null ? "" : action);
            event.put("success", success);
            event.put("message", message == null ? "" : message);
            event.put("text", text == null ? "" : text);
            if (modelReady != null) event.put("modelReady", modelReady);
            if (errorCode != null) event.put("errorCode", errorCode);
        } catch (Exception ignored) { }
        final String payload = JSONObject.quote(event.toString());
        runOnUiThread(() -> {
            if (webView == null) return;
            String js = "if(window.__rooyeshMLKitResult){window.__rooyeshMLKitResult(" + payload + ");}";
            webView.evaluateJavascript(js, null);
        });
    }

    private String safePdfName(String value) {
        String name = value == null ? "rooyesh-study-plan.pdf" : value.trim();
        name = name.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "-");
        if (name.isEmpty()) name = "rooyesh-study-plan.pdf";
        if (!name.toLowerCase(java.util.Locale.ROOT).endsWith(".pdf")) name += ".pdf";
        if (name.length() > 120) name = name.substring(0, 116) + ".pdf";
        return name;
    }

    private String savePdfFile(String base64, String filename) {
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            if (bytes.length == 0 || bytes.length > 30 * 1024 * 1024) return "error";
            String name = safePdfName(filename);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return "error";
                try (OutputStream output = getContentResolver().openOutputStream(uri)) {
                    if (output == null) return "error";
                    output.write(bytes);
                    output.flush();
                }
                return "ok";
            }
            if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQUEST_WRITE_STORAGE));
                return "permission_requested";
            }
            File folder = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (!folder.exists() && !folder.mkdirs()) return "error";
            File file = new File(folder, name);
            try (FileOutputStream output = new FileOutputStream(file)) {
                output.write(bytes);
                output.flush();
            }
            return "ok";
        } catch (Exception e) {
            return "error";
        }
    }

    public final class RooyeshNative {
        RooyeshNative() { /* Keep a native bridge instance per WebView. */ }

        /** Returns the configured HTTPS DeepSeek proxy URL; no provider key is stored in the APK. */
        @JavascriptInterface
        public String getAiProxyUrl() {
            return getString(R.string.rooyesh_deepseek_proxy_url);
        }

        /** Opens the native Google account picker. */
        @JavascriptInterface
        public void beginGoogleSignIn() {
            runOnUiThread(() -> {
                if (googleSignInClient == null) {
                    sendGoogleAuthResult("", "", "Google OAuth client ID is not configured in this build.");
                    return;
                }
                try {
                    startActivityForResult(googleSignInClient.getSignInIntent(), REQUEST_GOOGLE_SIGN_IN);
                } catch (Exception error) {
                    sendGoogleAuthResult("", "", "Could not open Google sign-in.");
                }
            });
        }

        /** Restores a previously selected Google account without showing a picker. */
        @JavascriptInterface
        public void restoreGoogleSignIn() {
            if (googleSignInClient == null) {
                sendGoogleAuthResult("", "", "Google OAuth client ID is not configured in this build.");
                return;
            }
            googleSignInClient.silentSignIn().addOnCompleteListener(this, task -> {
                if (task.isSuccessful() && task.getResult() != null) {
                    GoogleSignInAccount account = task.getResult();
                    googleIdToken = account.getIdToken() == null ? "" : account.getIdToken();
                    googleEmail = account.getEmail() == null ? "" : account.getEmail();
                    sendGoogleAuthResult(googleIdToken, googleEmail, "");
                } else {
                    googleIdToken = "";
                    googleEmail = "";
                    sendGoogleAuthResult("", "", "");
                }
            });
        }

        /** Signs out locally from the selected Google account. */
        @JavascriptInterface
        public void signOutGoogle() {
            googleIdToken = "";
            googleEmail = "";
            if (googleSignInClient != null) googleSignInClient.signOut();
        }

        /** Requests Android 13+ notification permission after an explicit tap in the UI. */
        @JavascriptInterface
        public String requestNotificationPermission() {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                    || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                return "granted";
            }
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                        && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQUEST_POST_NOTIFICATIONS);
                }
            });
            return "requested";
        }

        /** Keeps the persistent calendar notification in sync with the current day. */
        @JavascriptInterface
        public void studyProgress(int minutes, int dailyGoal) {
            final int safeMinutes = Math.max(0, Math.min(1440 * 30, minutes));
            final int safeGoal = Math.max(1, Math.min(1440, dailyGoal));
            runOnUiThread(() -> StudyNotifications.updateProgress(MainActivity.this, safeMinutes, safeGoal));
        }

        /** Reads the saved daily alarm settings for the settings page. */
        @JavascriptInterface
        public String getStudyAlarmConfig() {
            return StudyAlarmManager.configJson(MainActivity.this);
        }

        /** Stores the user's daily alarm and requests exact-alarm access when needed. */
        @JavascriptInterface
        public String scheduleStudyAlarm(String time, boolean repeatDaily, int volumePercent) {
            if (!StudyAlarmManager.isValidTime(time)) return "invalid";
            StudyAlarmManager.saveAndSchedule(MainActivity.this, time, repeatDaily, volumePercent);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                    && !StudyAlarmManager.canScheduleExact(MainActivity.this)) {
                runOnUiThread(() -> {
                    try {
                        Intent settingsIntent = new Intent(
                                android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                                Uri.parse("package:" + getPackageName()));
                        startActivity(settingsIntent);
                    } catch (Exception ignored) { }
                });
                return "permission_required";
            }
            return "scheduled";
        }

        /** Plays the short built-in chime for preview. */
        @JavascriptInterface
        public String previewStudyAlarm(int volumePercent) {
            StudyAlarmService.start(MainActivity.this, StudyAlarmService.ACTION_PREVIEW, volumePercent);
            return "playing";
        }

        /** Disables the alarm and stops currently playing audio. */
        @JavascriptInterface
        public void cancelStudyAlarm() {
            StudyAlarmManager.cancel(MainActivity.this);
        }

        /** Opens the newest stable APK download from the official repository. */
        @JavascriptInterface
        public void openGitHubUpdates() {
            openExternalPage("https://github.com/RM007-UI/Rooyesh-Study-Record-MLKit/releases/latest/download/Rooyesh.apk");
        }

        /** Opens the project's source repository. */
        @JavascriptInterface
        public void openGitHubSource() {
            openExternalPage("https://github.com/RM007-UI/Rooyesh-Study-Record-MLKit");
        }

        private void openExternalPage(String address) {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(address)));
                } catch (Exception ignored) { }
            });
        }

        /** Posts a system notification when the study countdown ends. */
        @JavascriptInterface
        public boolean timerFinished(String subject) {
            return showTimerNotification(subject);
        }

        /** Saves a generated PDF in the public Downloads folder. */
        @JavascriptInterface
        public String savePdf(String base64, String fileName) {
            return savePdfFile(base64, fileName);
        }

        /** Checks if the required on-device translation model is installed. */
        @JavascriptInterface
        public void getTranslationModelStatus(String source, String target, String requestId) {
            checkModelStatus(source, target, (ready, error) -> {
                if (error != null) {
                    sendResult(requestId, "status", false,
                            "Could not inspect the on-device model. Check Google Play services and try again.",
                            "", false, "model_status_error");
                } else {
                    sendResult(requestId, "status", true,
                            ready ? "The offline model is ready." : "The offline model has not been downloaded.",
                            "", ready, null);
                }
            });
        }

        /** Downloads required ML Kit language files after the user explicitly taps Download in the UI. */
        @JavascriptInterface
        public void downloadTranslationModel(String source, String target, String requestId) {
            final Translator translator;
            try {
                translator = getTranslator(source, target);
            } catch (Exception e) {
                sendResult(requestId, "download", false, "Unsupported language pair.", "", false, "unsupported_language");
                return;
            }
            DownloadConditions conditions = new DownloadConditions.Builder().build();
            translator.downloadModelIfNeeded(conditions)
                    .addOnSuccessListener(unused -> sendResult(requestId, "download", true,
                            "The offline translation model is ready.", "", true, null))
                    .addOnFailureListener(error -> sendResult(requestId, "download", false,
                            "Could not download the model. Check the internet connection and available storage.",
                            "", false, "model_download_failed"));
        }

        /** Translates with the model stored locally. This method does not start a download silently. */
        @JavascriptInterface
        public void translateWithMLKit(String text, String source, String target, String requestId) {
            if (text == null || text.trim().isEmpty() || text.length() > 5000) {
                sendResult(requestId, "translate", false, "Enter text up to 5000 characters.", "", false, "invalid_text");
                return;
            }
            final Translator translator;
            try {
                translator = getTranslator(source, target);
            } catch (Exception e) {
                sendResult(requestId, "translate", false, "Unsupported language pair.", "", false, "unsupported_language");
                return;
            }
            checkModelStatus(source, target, (ready, error) -> {
                if (error != null) {
                    sendResult(requestId, "translate", false, "Could not inspect the language model.", "", false, "model_status_error");
                    return;
                }
                if (!ready) {
                    sendResult(requestId, "translate", false, "Download the offline model first.", "", false, "model_missing");
                    return;
                }
                translator.translate(text)
                        .addOnSuccessListener(translated -> sendResult(requestId, "translate", true,
                                "Translated on this device.", translated, true, null))
                        .addOnFailureListener(failure -> sendResult(requestId, "translate", false,
                                "On-device translation failed. Check that the model is downloaded, then try again.",
                                "", false, "translation_failed"));
            });
        }
    }
}
