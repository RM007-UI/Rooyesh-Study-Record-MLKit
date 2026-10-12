#!/usr/bin/env python3
"""Static checks that prevent an HTML-only/mock ML Kit build being shipped."""
from pathlib import Path
import re, sys
root = Path(__file__).resolve().parents[1]
html = (root / "app/src/main/assets/index.html").read_text(encoding="utf-8")
java = (root / "app/src/main/java/com/rooyesh/study/MainActivity.java").read_text(encoding="utf-8")
gradle = (root / "app/build.gradle").read_text(encoding="utf-8")
manifest = (root / "app/src/main/AndroidManifest.xml").read_text(encoding="utf-8")
checks = {
    "real ML Kit Gradle dependency": "com.google.mlkit:translate:17.0.3" in gradle,
    "native Translator implementation": "Translation.getClient(options)" in java and "translator.translate(text)" in java,
    "download-model native bridge": "downloadTranslationModel" in java and "downloadModelIfNeeded" in java,
    "on-device result callback": "__rooyeshMLKitResult" in html and "translateWithMLKit" in html,
    "offline model download button": "translatorDownloadModel" in html,
    "offline and online directions": "en-fa" in html and "fa-en" in html,
    "network permission": "android.permission.INTERNET" in manifest,
    "latest full-backup feature preserved": "پشتیبان کامل رویش" in html and "rooyesh-full-backup" in html,
    "existing application ID preserved": "com.rooyesh.study.app" in gradle,
    "release signing kept local/secrets-only": "keystore.properties" in gradle,
}
for label, ok in checks.items():
    print(("OK" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
