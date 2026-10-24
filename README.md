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

## Rooyesh AI (experimental)

The app now has an optional cloud study assistant using OpenRouter's free-model router (`openrouter/free`). It requires the user to create and enter their own API key. No shared key is bundled in the APK or repository. Free model capacity is rate-limited and may be unavailable at times.

The assistant can read selected study records, goals, notes, plans, flashcards and mood check-ins through app tools; open the translator, Arabic lessons or periodic table; and propose local changes. Every write operation requires an explicit confirmation inside the app. Recent conversation history (up to 24 messages) and up to 40 user-managed memory notes can be saved locally between app launches. Memory can be toggled off; saved notes can be listed, edited and deleted, and the chat history can be cleared separately. Memory items requested by the AI are only saved after explicit user approval. When enabled, recent conversation context and relevant saved memory may be sent with a cloud request. Study data and messages selected for a response are sent to OpenRouter and its routed model provider, so the user must acknowledge the privacy notice before sending anything. The key and memory are stored in the app's local WebView storage, not encrypted by this JavaScript module. Do not use a valuable/shared key and do not store sensitive personal data or secrets.
