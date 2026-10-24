# رویش ۳.۱۱.۱ — رکورد مطالعه و ترجمهٔ آفلاین

این مخزن سورس اصلی و گردش‌کار ساخت و بررسی APK برنامهٔ رویش را نگه می‌دارد.

## دانلود برنامه
از بخش [Releases](https://github.com/RM007-UI/Rooyesh-Study-Record-MLKit/releases) آخرین نسخهٔ پایدار با نام **Rooyesh_3.11.1.apk** را دانلود کن. فایل‌های Debug با برچسب آزمایشی مشخص‌اند و جایگزین نسخهٔ اصلی نصب‌شده نمی‌شوند.

## سورس و ساخت
- پوشهٔ source/ مرجع اصلی کد است.
- فایل rooyesh-source.tar.gz آرشیو قابل‌دانلود و همگام‌سازی‌شدهٔ همین سورس است.
- گردش‌کار [Build and release](https://github.com/RM007-UI/Rooyesh-Study-Record-MLKit/actions) نحو JavaScript، پل ML Kit و اتصال اعلان بومی را پیش از ساخت بررسی می‌کند.
- در صورت تنظیم چهار GitHub Actions Secret مربوط به **کلید امضای اصلی قبلی**، APK نسخهٔ اصلی و قابل‌به‌روزرسانی ساخته و در Release پایدار منتشر می‌شود. اگر کلید امضا در دسترس نباشد، فقط APK آزمایشی Debug منتشر می‌شود؛ از کلید جدید برای جایگزینی نسخهٔ قبلی استفاده نکن.

## نکته‌ها
مترجم آفلاین انگلیسی↔فارسی برای بار اول باید مدل ML Kit را با اینترنت دانلود کند. پس از دانلود، ترجمه روی خود گوشی انجام می‌شود.
## تغییرات نسخهٔ ۳.۱۱.۱
- وضعیت تایمر به‌صورت دوره‌ای ذخیره می‌شود و پس از بازگشت به برنامه بازیابی می‌شود.
- مدت زمان سپری‌شده هنگام بسته بودن برنامه در بازیابی تایمر محاسبه می‌شود.
- پایان تایمر به اعلان بومی اندروید متصل شده و در Android 13 و جدیدتر مجوز اعلان درخواست می‌شود.


## آخرین نسخه، منبع و ابزارهای تازه

- **دانلود مستقیم آخرین نسخهٔ پایدار:** https://github.com/RM007-UI/Rooyesh-Study-Record-MLKit/releases/latest/download/Rooyesh.apk
- **سازنده و کد منبع:** https://github.com/RM007-UI/Rooyesh-Study-Record-MLKit
- قواعد عربی در دو دستهٔ «عربی عمومی متوسطهٔ دوم» و «عربی انسانی متوسطهٔ دوم» قرار دارند؛ هر درس توضیح ساده، مثال، نکته و تمرین دارد.
- از تنظیمات می‌توان یک زنگ روزانه با انتخاب ساعت، تکرار روزانه و شدت صدای زنگ تنظیم کرد.

## آزمایشگاه یادگیری (نسخهٔ در حال بررسی)

- ساخت فلش‌کارت سؤال/پاسخ برای هر درس و مرور فعال با ارزیابی «دوباره / سخت / خوب / آسان».
- زمان‌بندی مرور بعدی بر اساس ارزیابی دانش‌آموز و نمایش کارت‌های سررسید.
- گزارش هفتگی از زمان مطالعه، تعداد جلسه‌ها، روزهای فعال و درس پرتکرار؛ گزارش صرفاً توصیفی است و جای سنجش تسلط را نمی‌گیرد.
- حالت آزمایشی با داده‌های نمونه که از سوابق واقعی و کارت‌های شخصی جداست.
- قابلیت‌های این شاخه هنوز باید روی گوشی آزمایش شوند؛ تا پایان بررسی، APK نسخهٔ اصلی جایگزین نمی‌شود.

## Rooyesh AI — Google sign-in + DeepSeek (experimental)

The experimental assistant is being migrated from a student-entered OpenRouter key to native Google sign-in and a server-side DeepSeek proxy.

- Students sign in with Google in the Android app; the Google ID token is held in memory and sent to the proxy for verification.
- The DeepSeek API key is intended to be stored only as a Cloudflare Worker secret, never in the APK or local WebView storage.
- The assistant uses the `deepseek-flash` model with tool calling enabled and thinking disabled for compatibility with tool calls.
- The Worker source and setup instructions are in [ai-proxy/README.md](ai-proxy/README.md).
- Android configuration placeholders are in `source/app/src/main/res/values/ai_config.xml`. Until a real Google Web OAuth client ID and deployed Worker URL are configured there, cloud AI will not connect.
- The owner must configure a DeepSeek API key and spending limits. Google login does not itself grant free DeepSeek usage; requests may incur charges and availability depends on the user's network and DeepSeek's service.
- Recent conversation history (up to 24 messages) and up to 40 user-managed memory notes are stored locally. When memory is enabled, relevant memory and recent chat context may be sent with a cloud request. The user must acknowledge the privacy notice. Local WebView storage is not separately encrypted.

This is not ready for general student distribution until OAuth, the Worker secret, the proxy URL, usage limits, and the built APK have all been configured and tested on target networks.
