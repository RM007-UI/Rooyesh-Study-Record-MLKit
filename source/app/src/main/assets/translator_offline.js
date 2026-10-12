/* Rooyesh lightweight offline bilingual English↔Persian phrasebook and glossary.
 * This is a local, rule/lexicon-based helper, not a neural machine-translation model.
 */
(function () {
  'use strict';
  const phrases = {
    'hello':'سلام','hi':'سلام','hey':'سلام','good morning':'صبح بخیر','good afternoon':'عصر بخیر','good evening':'عصر بخیر','good night':'شب بخیر',
    'how are you':'حالت چطوره','how are you doing':'اوضاعت چطوره','how is it going':'اوضاع چطوره','what is up':'چه خبر','what\'s up':'چه خبر','how have you been':'این مدت چطور بودی',
    'i am fine':'خوبم','i\'m fine':'خوبم','i am doing well':'حالم خوبه','i\'m doing well':'حالم خوبه','very nice to meet you':'از آشنایی باهات خیلی خوشحالم','nice to meet you':'از آشنایی باهات خوشحالم',
    'thank you':'ممنون','thank you very much':'خیلی ممنون','thanks a lot':'خیلی ممنون','many thanks':'خیلی ممنون','you are welcome':'خواهش می‌کنم','you\'re welcome':'خواهش می‌کنم','no problem':'مشکلی نیست','that is okay':'اشکالی نداره','that\'s okay':'اشکالی نداره',
    'excuse me':'ببخشید','i am sorry':'ببخشید','i\'m sorry':'ببخشید','i apologize':'عذر می‌خوام','please help me':'لطفاً کمکم کن','could you help me':'میشه کمکم کنی','can you help me':'می‌تونی کمکم کنی','please speak slowly':'لطفاً آروم‌تر صحبت کن',
    'what is your name':'اسمت چیه','what\'s your name':'اسمت چیه','my name is':'اسم من اینه','where are you from':'اهل کجایی','where do you live':'کجا زندگی می‌کنی','how old are you':'چند سالته','what does this mean':'این یعنی چی','what do you mean':'منظورت چیه','could you repeat that':'میشه دوباره بگی',
    'i do not know':'نمی‌دونم','i don\'t know':'نمی‌دونم','i have no idea':'هیچ ایده‌ای ندارم','i understand':'می‌فهمم','i do not understand':'متوجه نمی‌شم','i don\'t understand':'متوجه نمی‌شم','i get it':'فهمیدم','i got it':'متوجه شدم','i see':'آها، فهمیدم','i am not sure':'مطمئن نیستم','i\'m not sure':'مطمئن نیستم','are you sure':'مطمئنی','of course':'حتماً','maybe later':'شاید بعداً','not yet':'هنوز نه','right now':'همین الان',
    'do not worry':'نگران نباش','don\'t worry':'نگران نباش','calm down':'آروم باش','it does not matter':'مهم نیست','it doesn\'t matter':'مهم نیست','never mind':'بی‌خیال','just kidding':'شوخی کردم','i am just kidding':'فقط شوخی کردم','i\'m just kidding':'فقط شوخی کردم','what happened':'چی شده','what is wrong':'مشکلی پیش اومده','what\'s wrong':'چی شده','everything is okay':'همه‌چی خوبه','everything is fine':'همه‌چی خوبه','it is okay':'اشکالی نداره','it\'s okay':'اشکالی نداره','no worries':'نگران نباش','take your time':'عجله نکن','let me know':'خبرم کن','see you later':'بعداً می‌بینمت','see you soon':'به‌زودی می‌بینمت','see you tomorrow':'فردا می‌بینمت','take care':'مراقب خودت باش','have a nice day':'روز خوبی داشته باشی','good luck':'موفق باشی','congratulations':'تبریک می‌گم','happy birthday':'تولدت مبارک','i will be back':'برمی‌گردم','i\'ll be back':'برمی‌گردم','i will be right back':'الان برمی‌گردم','i\'ll be right back':'الان برمی‌گردم','i am on my way':'توی راهم','i\'m on my way':'توی راهم','i will call you later':'بعداً بهت زنگ می‌زنم','i\'ll call you later':'بعداً بهت زنگ می‌زنم',
    'i am tired':'خسته‌ام','i\'m tired':'خسته‌ام','i am hungry':'گرسنه‌ام','i\'m hungry':'گرسنه‌ام','i am thirsty':'تشنمه','i\'m thirsty':'تشنمه','i am busy right now':'الان سرم شلوغه','i\'m busy right now':'الان سرم شلوغه','i need more time':'به زمان بیشتری نیاز دارم','i forgot':'یادم رفت','i remember':'یادمه','i miss you':'دلم برات تنگ شده','i love you':'دوستت دارم','i like it':'ازش خوشم میاد','i do not like it':'ازش خوشم نمیاد','i don\'t like it':'ازش خوشم نمیاد','that is a good idea':'ایدهٔ خوبیه','that\'s a good idea':'ایدهٔ خوبیه','i agree with you':'با تو موافقم','i do not agree':'موافق نیستم','i don\'t agree':'موافق نیستم','i think so':'فکر کنم همین‌طوره','i do not think so':'فکر نکنم','i don\'t think so':'فکر نکنم','i hope so':'امیدوارم همین‌طور باشه','it is too late':'خیلی دیر شده','it\'s too late':'خیلی دیر شده',
    'the weather is nice':'هوا خوبه','the weather is nice today':'امروز هوا خوبه','it is raining':'داره بارون میاد','it\'s raining':'داره بارون میاد','it is cold today':'امروز هوا سرده','it\'s cold today':'امروز هوا سرده','it is hot today':'امروز هوا گرمه','it\'s hot today':'امروز هوا گرمه','where is the bathroom':'دستشویی کجاست','how much is it':'قیمتش چقدره','how much does it cost':'چقدر قیمت داره','i need help':'کمک لازم دارم','i need your help':'به کمکت نیاز دارم','i want to learn english':'می‌خوام انگلیسی یاد بگیرم','i am learning english':'دارم انگلیسی یاد می‌گیرم','i\'m learning english':'دارم انگلیسی یاد می‌گیرم','i speak a little english':'یه کم انگلیسی حرف می‌زنم',
    'i have to study':'باید درس بخونم','i need to study':'باید درس بخونم','let us study':'بیا درس بخونیم','let\'s study':'بیا درس بخونیم','study every day':'هر روز درس بخون','study hard':'با جدیت درس بخون','keep going':'ادامه بده','do not give up':'تسلیم نشو','don\'t give up':'تسلیم نشو','one step at a time':'قدم‌به‌قدم','small steps make a big difference':'قدم‌های کوچیک تغییر بزرگی ایجاد می‌کنن','practice makes perfect':'با تمرین بهتر می‌شی','time is up':'وقت تمومه','break time':'وقت استراحته','daily goal':'هدف روزانه','study plan':'برنامهٔ درسی','study session':'جلسهٔ مطالعه','my goal is':'هدفم اینه که','i reached my goal':'به هدفم رسیدم','i finished my homework':'تکالیفم رو تموم کردم','i am preparing for an exam':'دارم برای امتحان آماده می‌شم','i have an exam tomorrow':'فردا امتحان دارم','i need a break':'به استراحت نیاز دارم','let us take a break':'بیا یه استراحت کنیم','let\'s take a break':'بیا یه استراحت کنیم','i learned something new today':'امروز یه چیز جدید یاد گرفتم','read it out loud':'با صدای بلند بخونش','write it down':'یادداشتش کن','pay attention':'دقت کن','focus on your work':'روی کارت تمرکز کن','keep practicing':'به تمرین ادامه بده','you can do it':'از پسش برمیای','do not be afraid to make mistakes':'از اشتباه کردن نترس','don\'t be afraid to make mistakes':'از اشتباه کردن نترس','mistakes help us learn':'اشتباه‌ها بهمون یاد می‌دن','hard work pays off':'تلاش نتیجه می‌ده','i will try again':'دوباره تلاش می‌کنم','i\'ll try again':'دوباره تلاش می‌کنم','i am proud of myself':'به خودم افتخار می‌کنم','i\'m proud of myself':'به خودم افتخار می‌کنم','i made progress today':'امروز پیشرفت کردم','i did my best':'تمام تلاشم رو کردم','i need motivation':'به انگیزه نیاز دارم','you are doing great':'عالی پیش می‌ری','you\'re doing great':'عالی پیش می‌ری','well done':'آفرین','keep up the good work':'همین‌طور خوب ادامه بده',
    'i am going to school':'دارم می‌رم مدرسه','i\'m going to school':'دارم می‌رم مدرسه','i go to school every day':'هر روز می‌رم مدرسه','i read a book':'یه کتاب می‌خونم','i am reading a book':'دارم کتاب می‌خونم','i\'m reading a book':'دارم کتاب می‌خونم','i finished reading':'خوندن رو تموم کردم','i want to sleep':'می‌خوام بخوابم','i want to eat':'می‌خوام غذا بخورم','i am going home':'دارم می‌رم خونه','i\'m going home':'دارم می‌رم خونه','i have to go':'باید برم','i have to leave':'باید برم','what time is it':'ساعت چنده','what day is it today':'امروز چه روزیه','today is a good day':'امروز روز خوبیه','tomorrow is another day':'فردا یه روز دیگه‌ست','i will do my best':'تمام تلاشم رو می‌کنم','i\'ll do my best':'تمام تلاشم رو می‌کنم','this is important':'این مهمه','that is important':'اون مهمه','this is very important':'این خیلی مهمه','i am happy':'خوشحالم','i\'m happy':'خوشحالم','i am sad':'ناراحتم','i\'m sad':'ناراحتم','i feel better':'حالم بهتره','i feel sick':'حالم خوب نیست','i need some water':'یه کم آب می‌خوام','can i ask you a question':'می‌تونم یه سؤال بپرسم','may i ask a question':'می‌تونم یه سؤال بپرسم','what should i do':'باید چیکار کنم','what can i do':'چیکار می‌تونم بکنم','that sounds good':'خوبه','sounds good to me':'به نظرم خوبه'
  };
  const words = {
    'i':'من','me':'من','my':'مال من','mine':'مال من','myself':'خودم','you':'تو','your':'مال تو','yours':'مال تو','yourself':'خودت','he':'او','him':'او','his':'مال او','she':'او','her':'او','hers':'مال او','it':'آن','its':'مال آن','we':'ما','us':'ما','our':'مال ما','ours':'مال ما','they':'آن‌ها','them':'آن‌ها','their':'مال آن‌ها','theirs':'مال آن‌ها','this':'این','that':'آن','these':'این‌ها','those':'آن‌ها','who':'چه کسی','whom':'چه کسی را','whose':'مال چه کسی','what':'چه','which':'کدام','where':'کجا','when':'چه وقت','why':'چرا','how':'چطور','whose':'مال چه کسی',
    'am':'هستم','is':'است','are':'هستند','was':'بود','were':'بودند','be':'بودن','been':'بوده','being':'بودن','have':'دارم','has':'دارد','had':'داشت','do':'انجام دادن','does':'انجام می‌دهد','did':'انجام داد','done':'انجام‌شده','can':'می‌توانم','could':'می‌توانستم','will':'خواهم','would':'می‌خواستم','should':'باید','must':'باید','may':'شاید','might':'شاید','not':'نه','no':'نه','yes':'بله','okay':'باشه','ok':'باشه','please':'لطفاً','thanks':'ممنون','thank':'تشکر کردن','sorry':'ببخشید','hello':'سلام','hi':'سلام','bye':'خداحافظ','goodbye':'خداحافظ','welcome':'خوش اومدی',
    'a':'یک','an':'یک','the':'','and':'و','or':'یا','but':'اما','because':'چون','so':'پس','if':'اگر','then':'بعد','than':'از','as':'به‌عنوان','of':'ِ','to':'به','for':'برای','from':'از','with':'با','without':'بدون','in':'در','on':'روی','at':'در','by':'با','about':'دربارهٔ','into':'به داخل','over':'روی','under':'زیر','between':'بین','through':'از طریق','during':'در طول','before':'قبل از','after':'بعد از','around':'اطراف','against':'علیه','up':'بالا','down':'پایین','out':'بیرون','off':'خاموش','near':'نزدیک','here':'اینجا','there':'آنجا','also':'هم','too':'هم','very':'خیلی','really':'واقعاً','just':'فقط','only':'فقط','more':'بیشتر','most':'بیشترین','less':'کمتر','least':'کمترین','much':'زیاد','many':'زیاد','few':'تعداد کم','little':'کم','some':'چند','any':'هر','all':'همه','each':'هر','every':'هر','both':'هر دو','another':'یکی دیگر','other':'دیگر','same':'همان','different':'متفاوت','such':'چنین','own':'خود','again':'دوباره','always':'همیشه','usually':'معمولاً','often':'اغلب','sometimes':'گاهی','never':'هرگز','ever':'تا حالا','already':'قبلاً','still':'هنوز','yet':'هنوز','now':'الان','today':'امروز','tonight':'امشب','tomorrow':'فردا','yesterday':'دیروز','morning':'صبح','afternoon':'بعدازظهر','evening':'عصر','night':'شب','day':'روز','week':'هفته','month':'ماه','year':'سال','time':'زمان','hour':'ساعت','minute':'دقیقه','second':'ثانیه',
    'person':'شخص','people':'مردم','man':'مرد','woman':'زن','child':'بچه','children':'بچه‌ها','friend':'دوست','family':'خانواده','mother':'مادر','father':'پدر','brother':'برادر','sister':'خواهر','name':'اسم','life':'زندگی','world':'جهان','home':'خانه','house':'خانه','school':'مدرسه','university':'دانشگاه','class':'کلاس','teacher':'معلم','student':'دانش‌آموز','book':'کتاب','books':'کتاب‌ها','page':'صفحه','lesson':'درس','subject':'درس','study':'درس خواندن','studying':'درس خواندن','learn':'یاد گرفتن','learning':'یادگیری','teach':'آموزش دادن','read':'خواندن','reading':'خواندن','write':'نوشتن','writing':'نوشتن','word':'کلمه','sentence':'جمله','language':'زبان','english':'انگلیسی','persian':'فارسی','translation':'ترجمه','translate':'ترجمه کردن','dictionary':'فرهنگ لغت','meaning':'معنی','grammar':'دستور زبان','question':'سؤال','answer':'جواب','example':'مثال','test':'آزمون','exam':'امتحان','homework':'تکلیف','practice':'تمرین','plan':'برنامه','goal':'هدف','progress':'پیشرفت','result':'نتیجه','success':'موفقیت','mistake':'اشتباه','problem':'مشکل','idea':'ایده','reason':'دلیل','reasoning':'استدلال','answering':'پاسخ دادن','focus':'تمرکز','attention':'توجه','memory':'حافظه','mind':'ذهن','brain':'مغز','knowledge':'دانش','skill':'مهارت','work':'کار','job':'شغل','task':'وظیفه','break':'استراحت','rest':'استراحت','free':'آزاد','busy':'مشغول','important':'مهم','easy':'آسان','hard':'سخت','difficult':'دشوار','simple':'ساده','possible':'ممکن','impossible':'غیرممکن','right':'درست','wrong':'اشتباه','correct':'صحیح','true':'درست','false':'غلط',
    'good':'خوب','better':'بهتر','best':'بهترین','bad':'بد','worse':'بدتر','great':'عالی','nice':'خوب','beautiful':'زیبا','pretty':'قشنگ','ugly':'زشت','new':'جدید','old':'قدیمی','young':'جوان','big':'بزرگ','small':'کوچک','long':'بلند','short':'کوتاه','high':'بلند','low':'پایین','fast':'سریع','slow':'آهسته','early':'زود','late':'دیر','hot':'گرم','cold':'سرد','warm':'گرم','cool':'خنک','clean':'تمیز','dirty':'کثیف','strong':'قوی','weak':'ضعیف','happy':'خوشحال','sad':'ناراحت','angry':'عصبانی','afraid':'ترسیده','tired':'خسته','hungry':'گرسنه','thirsty':'تشنه','sick':'بیمار','healthy':'سالم','ready':'آماده','sure':'مطمئن','kind':'مهربان','polite':'مودب','funny':'بامزه','interesting':'جالب','boring':'خسته‌کننده','exciting':'هیجان‌انگیز','amazing':'فوق‌العاده','beautifully':'به زیبایی',
    'go':'رفتن','goes':'می‌رود','went':'رفت','gone':'رفته','come':'آمدن','comes':'می‌آید','came':'آمد','get':'گرفتن','gets':'می‌گیرد','got':'گرفت','make':'ساختن','makes':'می‌سازد','made':'ساخت','take':'گرفتن','takes':'می‌گیرد','took':'گرفت','give':'دادن','gives':'می‌دهد','gave':'داد','put':'گذاشتن','keep':'نگه داشتن','keeps':'نگه می‌دارد','kept':'نگه داشت','start':'شروع کردن','starts':'شروع می‌کند','started':'شروع کرد','stop':'متوقف شدن','stopped':'متوقف شد','finish':'تمام کردن','finished':'تمام کرد','begin':'آغاز کردن','began':'شروع کرد','continue':'ادامه دادن','help':'کمک کردن','helps':'کمک می‌کند','helped':'کمک کرد','want':'خواستن','wants':'می‌خواهد','wanted':'خواست','need':'نیاز داشتن','needs':'نیاز دارد','needed':'نیاز داشت','like':'دوست داشتن','likes':'دوست دارد','liked':'دوست داشت','love':'عشق / دوست داشتن','loves':'دوست دارد','loved':'دوست داشت','hate':'متنفر بودن','think':'فکر کردن','thinks':'فکر می‌کند','thought':'فکر کرد','know':'دانستن','knows':'می‌داند','knew':'می‌دانست','understand':'فهمیدن','understands':'می‌فهمد','understood':'فهمید','see':'دیدن','sees':'می‌بیند','saw':'دید','look':'نگاه کردن','watch':'تماشا کردن','find':'پیدا کردن','found':'پیدا کرد','try':'تلاش کردن','tries':'تلاش می‌کند','tried':'تلاش کرد','use':'استفاده کردن','used':'استفاده کرد','ask':'پرسیدن','asked':'پرسید','tell':'گفتن','told':'گفت','say':'گفتن','said':'گفت','speak':'صحبت کردن','spoke':'صحبت کرد','talk':'حرف زدن','talked':'حرف زد','call':'زنگ زدن','called':'زنگ زد','feel':'احساس کردن','feels':'احساس می‌کند','felt':'احساس کرد','hope':'امیدوار بودن','wish':'آرزو کردن','believe':'باور کردن','remember':'به یاد داشتن','forgot':'فراموش کرد','forget':'فراموش کردن','wait':'صبر کردن','meet':'ملاقات کردن','met':'ملاقات کرد','live':'زندگی کردن','lives':'زندگی می‌کند','move':'حرکت کردن','play':'بازی کردن','played':'بازی کرد','run':'دویدن','walk':'راه رفتن','eat':'خوردن','ate':'خورد','drink':'نوشیدن','drank':'نوشید','sleep':'خوابیدن','slept':'خوابید','wake':'بیدار شدن','buy':'خریدن','bought':'خرید','pay':'پرداخت کردن','paid':'پرداخت کرد','open':'باز کردن','close':'بستن','closed':'بست','change':'تغییر دادن','changed':'تغییر داد','create':'ساختن','build':'ساختن','improve':'بهبود دادن','improved':'بهبود داد','grow':'رشد کردن','grew':'رشد کرد','happen':'اتفاق افتادن','happened':'اتفاق افتاد','work':'کار کردن','works':'کار می‌کند','worked':'کار کرد','study':'درس خواندن','studied':'درس خواند','read':'خواندن','wrote':'نوشت','write':'نوشتن','written':'نوشته‌شده','listen':'گوش دادن','hear':'شنیدن','heard':'شنید','win':'برنده شدن','won':'برنده شد','lose':'باختن','lost':'باخت','choose':'انتخاب کردن','chose':'انتخاب کرد','decide':'تصمیم گرفتن','decided':'تصمیم گرفت','plan':'برنامه‌ریزی کردن','planned':'برنامه‌ریزی کرد',
    'water':'آب','food':'غذا','bread':'نان','tea':'چای','coffee':'قهوه','milk':'شیر','money':'پول','price':'قیمت','shop':'مغازه','store':'فروشگاه','street':'خیابان','city':'شهر','country':'کشور','place':'مکان','room':'اتاق','door':'در','window':'پنجره','phone':'تلفن','computer':'رایانه','internet':'اینترنت','message':'پیام','email':'ایمیل','music':'موسیقی','movie':'فیلم','game':'بازی','car':'ماشین','bus':'اتوبوس','train':'قطار','road':'جاده','weather':'هوا','rain':'باران','sun':'خورشید','tree':'درخت','flower':'گل','apple':'سیب','animal':'حیوان','dog':'سگ','cat':'گربه','bird':'پرنده','color':'رنگ','red':'قرمز','blue':'آبی','green':'سبز','white':'سفید','black':'سیاه','number':'عدد','one':'یک','two':'دو','three':'سه','four':'چهار','five':'پنج','six':'شش','seven':'هفت','eight':'هشت','nine':'نه','ten':'ده','first':'اول','second':'دوم','last':'آخر','next':'بعدی','previous':'قبلی','left':'چپ','right':'راست','top':'بالا','bottom':'پایین','inside':'داخل','outside':'بیرون','enough':'کافی','together':'با هم','alone':'تنها','maybe':'شاید','probably':'احتمالاً','certainly':'قطعاً','exactly':'دقیقاً','almost':'تقریباً','especially':'به‌خصوص','instead':'به‌جای آن','however':'بااین‌حال','therefore':'بنابراین','finally':'در نهایت','actually':'در واقع','especially':'به‌خصوص','because':'چون','while':'درحالی‌که','although':'با اینکه','until':'تا','unless':'مگر اینکه','and':'و','or':'یا','but':'اما','if':'اگر','not':'نه','never':'هرگز','always':'همیشه','again':'دوباره','together':'با هم'
  };
  const exactPhrases = new Map(Object.entries(phrases).map(([k,v]) => [normalize(k), v]));
  function normalize(s) { return String(s || '').toLowerCase().replace(/[’‘]/g,"'").replace(/[\u200b\u200c\u200d]/g,' ').replace(/\s+/g,' ').trim().replace(/[.!?،,;:]+$/,''); }
  function normalizeFa(s) {
    return String(s || '').normalize ? String(s || '').normalize('NFC').toLowerCase()
      .replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/ـ/g,'')
      .replace(/[\u064B-\u065F\u0670]/g,'').replace(/[\u200b\u200c\u200d]/g,' ')
      .replace(/\s+/g,' ').trim().replace(/[.!?؟،,;:]+$/,'') : String(s || '').toLowerCase()
      .replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200b\u200c\u200d]/g,' ').replace(/\s+/g,' ').trim();
  }
  const reverseWords = new Map();
  const reversePhrases = new Map();
  // Multiword dictionary meanings are matched before individual Persian words.
  for (const [en, fa] of Object.entries(words)) {
    const key = normalizeFa(fa);
    if (!key) continue;
    if (key.includes(' ')) { if (!reversePhrases.has(key)) reversePhrases.set(key, en); }
    else if (!reverseWords.has(key)) reverseWords.set(key, en);
  }
  for (const [en, fa] of Object.entries(phrases)) {
    const key = normalizeFa(fa);
    if (key) reversePhrases.set(key, en);
  }
  // Prefer the most natural/common equivalent when several entries share a Persian result.
  const reverseOverrides = {
    'سلام':'hello','صبح بخیر':'good morning','عصر بخیر':'good evening','شب بخیر':'good night',
    'ممنون':'thank you','خیلی ممنون':'thank you very much','خواهش می کنم':"you're welcome",
    'حالت چطوره':'how are you','اوضاعت چطوره':'how are you doing','چه خبر':"what's up",
    'خوبم':"i'm fine",'حالم خوبه':"i'm doing well",'اسمت چیه':"what's your name",
    'نمی دونم':"i don't know",'متوجه نمی شم':"i don't understand",'مطمئن نیستم':"i'm not sure",
    'نگران نباش':"don't worry",'مهم نیست':"it doesn't matter",'شوخی کردم':'just kidding',
    'دوستت دارم':'i love you','دلم برات تنگ شده':'i miss you','خسته ام':"i'm tired",
    'گرسنه ام':"i'm hungry",'تشنمه':"i'm thirsty",'موفق باشی':'good luck',
    'بیا درس بخونیم':"let's study",'باید درس بخونم':'i have to study',
    'می خوام انگلیسی یاد بگیرم':'i want to learn english','هر روز می رم مدرسه':'i go to school every day',
    'هدف روزانه':'daily goal','برنامه درسی':'study plan','جلسه مطالعه':'study session',
    'قدم های کوچیک تغییر بزرگی ایجاد می کنن':'small steps make a big difference'
  };
  for (const [fa, en] of Object.entries(reverseOverrides)) reversePhrases.set(normalizeFa(fa), en);
  const reverseOrdered = Array.from(reversePhrases.entries()).filter(([fa]) => fa.includes(' ')).sort((a,b)=>b[0].length-a[0].length);
  function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
  function translatePersianToEnglish(input) {
    const raw = String(input || '');
    if (!raw.trim()) return { text:'', missing:[], missingCount:0, translated:0 };
    const normalized = normalizeFa(raw);
    const exact = reversePhrases.get(normalized) || reverseWords.get(normalized);
    if (exact) {
      const punctuation = (raw.match(/[.!?؟،,;:]+\s*$/) || [''])[0];
      return { text: exact + punctuation.replace(/؟/g,'?'), missing:[], missingCount:0, translated:raw.trim().split(/\s+/).length };
    }
    let work = raw;
    const protectedValues = [];
    for (const [phrase, en] of reverseOrdered) {
      const pattern = phrase.split(' ').map(escapeRe).join('[\\s\\u200c\\u200d]+');
      const re = new RegExp('(^|[^\\u0600-\\u06FFA-Za-z0-9])' + pattern + '(?=$|[^\\u0600-\\u06FFA-Za-z0-9])','g');
      work = work.replace(re, (full, prefix) => {
        const marker='\uE000'+protectedValues.length+'\uE001';
        protectedValues.push(en);
        return prefix + marker;
      });
    }
    const missing = new Set();
    let translated = 0;
    work = work.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+(?:[\u200c\u200d][\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+)*/g, token => {
      const key = normalizeFa(token);
      if (reverseWords.has(key)) { translated++; return reverseWords.get(key); }
      missing.add(token);
      return token;
    });
    work = work.replace(/\uE000(\d+)\uE001/g, (_, n) => protectedValues[Number(n)] || '');
    work = work.replace(/\s+([,.!?;:])/g,'$1').replace(/؟/g,'?').replace(/ {2,}/g,' ').replace(/(^|\n) +/g,'$1').trim();
    return { text:work, missing:Array.from(missing).slice(0,25), missingCount:missing.size, translated };
  }
  const ordered = Object.entries(phrases).filter(([k])=>k.includes(' ')).sort((a,b)=>b[0].length-a[0].length);
  function translate(input, direction) {
    if (direction === 'fa-en') return translatePersianToEnglish(input);
    const raw=String(input||'');
    if (!raw.trim()) return { text:'', missing:[], translated:0 };
    const norm=normalize(raw);
    const exact=exactPhrases.get(norm);
    if (exact) {
      const punctuation=(raw.match(/[.!?]+\s*$/)||[''])[0];
      return {text:exact+punctuation,missing:[],missingCount:0,translated:raw.trim().split(/\s+/).length};
    }
    let work=raw; const protectedValues=[];
    for (const [phrase,fa] of ordered) {
      const re=new RegExp('(^|[^A-Za-z])'+phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^A-Za-z])','gi');
      work=work.replace(re,(full,prefix)=>{const marker='\uE000'+protectedValues.length+'\uE001';protectedValues.push(fa);return prefix+marker;});
    }
    const missing=new Set();let translated=0;
    work=work.replace(/[A-Za-z]+(?:['’][A-Za-z]+)?/g,token=>{
      const key=token.toLowerCase().replace(/’/g,"'");
      if (Object.prototype.hasOwnProperty.call(words,key)) { translated++; return words[key]; }
      // Small productive heuristics for common plural and -ed forms; leave ambiguous forms intact.
      if (/s$/.test(key) && key.length>3 && words[key.slice(0,-1)]) { translated++; return words[key.slice(0,-1)]+'ها'; }
      if (/ed$/.test(key) && key.length>4 && words[key.slice(0,-2)]) { translated++; return words[key.slice(0,-2)]+' کرد'; }
      missing.add(token);return token;
    });
    work=work.replace(/\uE000(\d+)\uE001/g,(_,n)=>protectedValues[Number(n)]||'');
    // Clean spaces around Persian punctuation and dropped articles.
    work=work.replace(/\s+([،.!?؛:])/g,'$1').replace(/ {2,}/g,' ').replace(/(^|\n) +/g,'$1').trim();
    return {text:work,missing:Array.from(missing).slice(0,25),missingCount:missing.size,translated};
  }
  window.RooyeshOfflineTranslator = { translate, phraseCount:Object.keys(phrases).length, wordCount:Object.keys(words).length, reversePhraseCount:reversePhrases.size, reverseWordCount:reverseWords.size, kind:'bidirectional-lightweight-glossary' };
})();
