package com.rooyesh.study;

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
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
    private static final int REQUEST_WRITE_STORAGE = 555;
    private WebView webView;
    private final Map<String, Translator> translators = new HashMap<>();

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
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
