(function () {
'use strict';
const STORE='rooyeshMoodRatings', HISTORY='rooyeshMoodMessageHistory';
const options=[
 {key:'great',emoji:'😁',fa:'عالی',en:'Great',rank:4},
 {key:'good',emoji:'😊',fa:'خوب',en:'Good',rank:3},
 {key:'okay',emoji:'🙂',fa:'معمولی',en:'Okay',rank:2},
 {key:'bad',emoji:'☹️',fa:'سخت',en:'Hard',rank:1},
 {key:'verybad',emoji:'😭',fa:'خیلی سخت',en:'Very hard',rank:0}
];
const lines={
great:[
['great-0','امروز تلاشت به نتیجه رسید؛ از همین حس خوب برای شروع فردا استفاده کن.','Your effort showed today; carry that good feeling into tomorrow.'],
['great-1','روز خوبی ساختی؛ لازم نیست فردا از امروز هم بیشتر فشار بیاوری.','You made a good day. Tomorrow does not need to be harder than today.'],
['great-2','به خودت بابت پیوستگی‌ات اعتبار بده؛ این عادت از یک روز مهم‌تر است.','Give yourself credit for showing up; the habit matters beyond one day.'],
['great-3','امروز شاهدی داری که برنامه وقتی ساده باشد، شدنی است.','Today is proof that a simple plan can work.'],
['great-4','این رضایت را نگه دار، اما فردا را با توقعی واقع‌بینانه شروع کن.','Keep the satisfaction, and start tomorrow with realistic expectations.'],
['great-5','پیشرفت امروزت ارزشمند است؛ استراحت خوب هم بخشی از ادامه دادن است.','Today mattered. Good rest is part of continuing well.'],
['great-6','امروز مسیرت روشن بود؛ فردا هم با قدم اول شروع می‌شود.','Your path felt clear today; tomorrow still begins with one step.'],
['great-7','از کاری که انجام دادی خوشحال باش، نه از کامل بودن همه‌چیز.','Be glad for what you did, not for everything being perfect.']
],
good:[
['good-0','روزت بد پیش نرفت؛ همین روند آرام را با خودت به فردا ببر.','Today went well enough; take this steady pace into tomorrow.'],
['good-1','لازم نیست هر روز عالی باشد؛ یک روز خوب معمولی هم پایهٔ محکمی است.','Not every day must be great; an ordinary good day is a solid base.'],
['good-2','چند قدم درست برداشتی؛ فردا فقط قدم بعدی را مشخص کن.','You took a few useful steps; choose the next one tomorrow.'],
['good-3','از امروز یک چیز را که جواب داد یادداشت کن و فردا دوباره امتحانش کن.','Notice what worked today and try it again tomorrow.'],
['good-4','پیشرفت آرام شاید هیجان‌انگیز نباشد، اما قابل تکرار است.','Steady progress may be quiet, but it is repeatable.'],
['good-5','امروز کافی بود؛ فردا با همان شروع ساده دوباره راه بیفت.','Today was enough; use the same simple start tomorrow.'],
['good-6','روز خوب با یک تصمیم کوچک ساخته شد؛ آن تصمیم را به یاد بسپار.','A small decision shaped today; remember which one helped.'],
['good-7','از نتیجه‌ات راضی باش و انرژی‌ات را برای روز بعد نگه دار.','Appreciate today and save some energy for the next day.']
],
okay:[
['okay-0','همهٔ روزها قرار نیست درخشان باشند؛ همین که جلو رفتی مهم است.','Not every day needs to shine; moving forward still counts.'],
['okay-1','امروز معمولی بود؛ فردا می‌توانی فقط یک بخش کوچک را بهتر کنی.','Today was ordinary; tomorrow you can improve just one small part.'],
['okay-2','به جای قضاوت کل روز، ببین کدام کار کوچک انجام شد.','Instead of judging the whole day, notice the small task you completed.'],
['okay-3','یک روز متوسط شکست نیست؛ داده‌ای است برای شناختن ریتم خودت.','An average day is not failure; it helps you learn your pace.'],
['okay-4','فردا قرار نیست همه‌چیز را جبران کنی؛ فقط شروع را آسان‌تر کن.','Tomorrow is not for making up everything; just make starting easier.'],
['okay-5','اگر امروز معمولی گذشت، یک خواب خوب و برنامهٔ کوچک می‌تواند کافی باشد.','If today felt average, good rest and a small plan may be enough.'],
['okay-6','یک کار مشخص برای فردا انتخاب کن تا تصمیم گرفتن سخت نباشد.','Pick one clear task for tomorrow so starting takes less effort.'],
['okay-7','به خودت فرصت بده؛ عادت‌ها با تکرار ساخته می‌شوند، نه با روزهای بی‌نقص.','Give yourself time; habits grow through repetition, not flawless days.']
],
bad:[
['bad-0','امروز سخت بود؛ لازم نیست سختی‌اش را انکار کنی تا فردا دوباره تلاش کنی.','Today was hard; you do not have to deny it to try again tomorrow.'],
['bad-1','یک روز دشوار ارزش تو را تعیین نمی‌کند؛ فردا را با کار کوچک‌تری شروع کن.','A hard day does not define you; start tomorrow with a smaller task.'],
['bad-2','امشب به جای سرزنش، فقط مشخص کن چه چیزی شروع فردا را آسان‌تر می‌کند.','Instead of blame tonight, decide what would make tomorrow easier to start.'],
['bad-3','اگر انرژی کم بود، هدف کوچک‌تر انتخاب کن؛ ادامه دادن مهم‌تر از فشار آوردن است.','When energy is low, choose a smaller goal; continuing beats forcing it.'],
['bad-4','امروز آن‌طور که می‌خواستی نشد؛ این یعنی برنامه نیاز به تنظیم دارد، نه سرزنش.','Today did not go as hoped; adjust the plan rather than blame yourself.'],
['bad-5','به خودت کمی فرصت بده؛ فردا می‌تواند فقط با پنج دقیقه شروع شود.','Give yourself room; tomorrow can begin with just five minutes.'],
['bad-6','روز سخت را ثبت کردی؛ حالا لازم نیست تمام شب دوباره در ذهنت مرورش کنی.','You recorded a tough day; you do not need to replay it all night.'],
['bad-7','اول استراحت، بعد یک قدم مشخص؛ فردا لازم نیست یک‌باره همه‌چیز درست شود.','Rest first, then one clear step; tomorrow need not fix everything at once.']
],
verybad:[
['verybad-0','متأسفم امروز این‌قدر سنگین گذشت؛ فعلاً با خودت مهربان باش و فردا را کوچک شروع کن.','I’m sorry today felt so heavy; be gentle with yourself and start small tomorrow.'],
['verybad-1','امروز لازم نیست به زور مثبت باشی؛ استراحت کن و فردا فقط اولین قدم را بردار.','You do not have to force positivity today; rest and take one first step tomorrow.'],
['verybad-2','یک روز خیلی سخت، پیش‌بینی فردا نیست؛ فردا را با توقعی سبک‌تر آغاز کن.','A very hard day does not predict tomorrow; begin with lighter expectations.'],
['verybad-3','اگر امروز از توانت بیشتر بود، فردا هدف کوچک‌تری بگذار؛ این عقب‌نشینی نیست، تنظیم مسیر است.','If today asked too much, set a smaller goal tomorrow; that is adjusting, not quitting.'],
['verybad-4','فعلاً لازم نیست جواب همه‌چیز را پیدا کنی؛ یک استراحت واقعی و یک کار کوچک کافی است.','You do not need every answer right now; rest and one small task are enough.'],
['verybad-5','به‌هم‌ریختن یک روز به معنی خراب شدن مسیر نیست؛ فردا را از یک نقطهٔ ساده شروع کن.','One difficult day does not ruin the path; begin again from a simple point tomorrow.'],
['verybad-6','امروز را همان‌طور که بود ثبت کردی؛ فردا فرصت تازه‌ای است، نه امتحان دوبارهٔ امروز.','You recorded today honestly; tomorrow is a fresh chance, not a retest of today.'],
['verybad-7','امشب از خودت انتظار حل همه‌چیز را نداشته باش؛ فقط قدم بعدی را برای فردا نگه دار.','Do not expect yourself to solve everything tonight; save one next step for tomorrow.']
]
};
const css='.mood-extras-overlay{position:fixed;inset:0;z-index:120;background:rgba(20,32,24,.58);backdrop-filter:blur(6px);display:grid;place-items:center;padding:16px}.mood-extras-dialog{width:min(470px,100%);max-height:90vh;overflow:auto;background:var(--paper,#fff);color:var(--ink,#25362f);border:1px solid var(--line,#e4e9de);border-radius:24px;padding:22px 18px;box-shadow:0 22px 70px #0004;text-align:center;font-family:inherit}.mood-extras-dialog h3{font-size:18px;margin:0 0 7px}.mood-extras-dialog>div>p{font-size:12px;line-height:1.9;color:var(--muted,#78847b);margin:0 0 15px}.mood-extras-options{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.mood-extras-option{border:1px solid var(--line,#e4e9de);border-radius:14px;background:rgba(220,235,224,.25);color:inherit;padding:9px 2px;min-height:82px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font:inherit}.mood-extras-emoji{font-size:27px;line-height:1.3}.mood-extras-label{font-size:10px;font-weight:700}.mood-extras-message{font-size:14px;line-height:2;margin:0 0 16px!important;color:var(--ink,#25362f)!important}.mood-extras-hidden{display:none!important}.mood-extras-btn{width:100%;min-height:43px;border:0;border-radius:12px;padding:11px;background:var(--green,#477b62);color:#fff;font:inherit;font-weight:800}.mood-extras-detail{margin:0 0 10px;padding:11px 13px;background:rgba(220,235,224,.28);border:1px solid var(--line,#e4e9de);border-radius:14px;font-size:12px;line-height:1.9;color:var(--muted,#78847b);white-space:pre-wrap}.mood-extras-detail strong{color:var(--ink,#25362f)}.mood-extras-reports{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.mood-extras-report{border:1px solid var(--line,#e4e9de);border-radius:15px;padding:12px;background:rgba(255,255,255,.22)}.mood-extras-report h4{font-size:13px;margin:0 0 7px}.mood-extras-report p{font-size:12px;color:var(--muted,#78847b);margin:0;line-height:2}.cal-mood-mark{font-size:10px;line-height:1.1}.calendar-day.has-mood{border-color:rgba(112,96,148,.5)}.study-mood-report-panel{margin-bottom:14px}@media(max-width:520px){.mood-extras-dialog{padding:18px 12px}.mood-extras-options{gap:4px}.mood-extras-option{min-height:74px;padding:7px 1px}.mood-extras-emoji{font-size:24px}.mood-extras-label{font-size:9px}.mood-extras-reports{grid-template-columns:1fr}}body.dark-mode .mood-extras-option,body.dark-mode .mood-extras-report{background:rgba(25,36,29,.55)}';
const style=document.createElement('style');style.id='rooyeshMoodStyles';style.textContent=css;document.head.appendChild(style);
const lang=()=>document.documentElement.lang==='en';
const tr=(fa,en)=>lang()?en:fa;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function addDays(iso,n){const p=iso.split('-').map(Number),d=new Date(p[0],p[1]-1,p[2],12);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function readRatings(){try{const v=JSON.parse(localStorage.getItem(STORE)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(e){return {}}}
function readHistory(){try{const v=JSON.parse(localStorage.getItem(HISTORY)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(-100):[]}catch(e){return []}}
let ratings=readRatings(), history=readHistory(), records=[], dailyGoal=120, overlay=null, promptVisible=false, promptQueued=false, progressSignature='';
function persist(){try{localStorage.setItem(STORE,JSON.stringify(ratings));localStorage.setItem(HISTORY,JSON.stringify(history.slice(-100)))}catch(e){}}
function getEntry(date){ratings=readRatings();const e=ratings[date];return e&&options.some(o=>o.key===e.key)&&typeof e.message==='string'?e:null}
function ensureModal(){
 if(overlay)return;
 overlay=document.createElement('div');overlay.className='mood-extras-overlay mood-extras-hidden';overlay.id='rooyeshMoodOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','rooyeshMoodTitle');
 overlay.innerHTML='<section class="mood-extras-dialog"><div id="rooyeshMoodSurvey"><h3 id="rooyeshMoodTitle">'+tr('امروزت چطور گذشت؟','How did today feel?')+'</h3><p>'+tr('هدفت رو کامل کردی؛ حال‌وهوای امروزت رو برای خودت ثبت کن.','You reached your goal. Save how today felt for you.')+'</p><div class="mood-extras-options">'+options.map(o=>'<button type="button" class="mood-extras-option" data-mood-choice="'+o.key+'"><span class="mood-extras-emoji">'+o.emoji+'</span><span class="mood-extras-label">'+(lang()?o.en:o.fa)+'</span></button>').join('')+'</div></div><div id="rooyeshMoodResponse" class="mood-extras-hidden"><div class="mood-extras-emoji" id="rooyeshMoodResponseEmoji" style="font-size:42px;margin:3px 0 8px">🌱</div><h3>'+tr('حال‌وهوای امروز ثبت شد','Today’s mood is saved')+'</h3><p class="mood-extras-message" id="rooyeshMoodResponseMessage"></p><button type="button" class="mood-extras-btn" id="rooyeshMoodClose">'+tr('ادامه','Continue')+'</button></div></section>';
 document.body.appendChild(overlay);
 overlay.querySelectorAll('[data-mood-choice]').forEach(b=>b.addEventListener('click',()=>chooseMood(b.getAttribute('data-mood-choice'))));
 overlay.querySelector('#rooyeshMoodClose').addEventListener('click',closeModal);
}
function openModal(){ensureModal();if(promptVisible||getEntry(today()))return;promptQueued=false;promptVisible=true;overlay.querySelector('#rooyeshMoodSurvey').classList.remove('mood-extras-hidden');overlay.querySelector('#rooyeshMoodResponse').classList.add('mood-extras-hidden');overlay.classList.remove('mood-extras-hidden')}
function closeModal(){if(!overlay)return;overlay.classList.add('mood-extras-hidden');promptVisible=false;promptQueued=false}
function chooseMood(key){
 const option=options.find(o=>o.key===key);if(!option)return;
 if(getEntry(today())){closeModal();return}
 let pool=(lines[key]||[]).filter(x=>history.indexOf(x[0])<0);if(!pool.length){history=[];pool=lines[key]||[]}
 const line=pool[Math.floor(Math.random()*pool.length)];
 history.push(line[0]);if(history.length>100)history=history.slice(-100);
 ratings=readRatings();ratings[today()]={key:option.key,emoji:option.emoji,label:lang()?option.en:option.fa,message:line[lang()?2:1],messageId:line[0],savedAt:Date.now()};
 persist();ensureModal();overlay.querySelector('#rooyeshMoodSurvey').classList.add('mood-extras-hidden');overlay.querySelector('#rooyeshMoodResponse').classList.remove('mood-extras-hidden');overlay.querySelector('#rooyeshMoodResponseEmoji').textContent=option.emoji;overlay.querySelector('#rooyeshMoodResponseMessage').textContent=ratings[today()].message;overlay.classList.remove('mood-extras-hidden');renderReports();decorateCalendar();updateSelectedMood(findSelectedDate());
}
function dayTotal(date){return records.reduce((sum,r)=>sum+(r.date===date?Math.max(0,Number(r.minutes)||0):0),0)}
function syncNative(){const bridge=window.RooyeshNative;if(!bridge||typeof bridge.studyProgress!=='function')return;const sig=today()+'|'+dayTotal(today())+'|'+dailyGoal;if(sig===progressSignature)return;progressSignature=sig;try{bridge.studyProgress(dayTotal(today()),dailyGoal)}catch(e){}}
function maybePrompt(){if(dayTotal(today())<dailyGoal||getEntry(today())||promptVisible||promptQueued)return;promptQueued=true;setTimeout(openModal,160)}
function calcStats(dates){
 const moods=dates.map(d=>getEntry(d)).filter(Boolean),total=dates.reduce((sum,d)=>sum+dayTotal(d),0),active=dates.filter(d=>dayTotal(d)>0).length,goals=dates.filter(d=>dayTotal(d)>=dailyGoal).length;
 const ranked=moods.map(m=>{const x=options.find(o=>o.key===m.key);return x?x.rank:2});const avg=ranked.length?ranked.reduce((a,b)=>a+b,0)/ranked.length:null;
 return{moodDays:moods.length,total,active,goals,avg,icon:avg===null?'—':avg>=3.5?'😁':avg>=2.5?'😊':avg>=1.5?'🙂':avg>=.5?'☹️':'😭'};
}
function reportHtml(title,s,days){return '<h4>'+title+'</h4><p>'+esc(s.icon)+' · '+tr('ثبت حال‌وهوا: ','Mood ratings: ')+s.moodDays+'<br>'+tr('مطالعهٔ ثبت‌شده: ','Study logged: ')+esc(formatDuration(s.total))+'<br>'+tr('روزهای فعال: ','Active days: ')+s.active+' / '+days+'<br>'+tr('تکمیل هدف: ','Goal met: ')+s.goals+'</p>'}
function formatDuration(value){const m=Math.max(0,Math.round(value)),h=Math.floor(m/60),r=m%60;if(lang())return h?(h+' hr'+(h===1?'':'s')+(r?' '+r+' min':'')):r+' min';return h?(h+' ساعت'+(r?' و '+r+' دقیقه':'')):r+' دقیقه'}
function currentPersianMonthDates(){
 let cur;try{cur=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'numeric'}).formatToParts(new Date())}catch(e){cur=[]}
 const get=k=>{const x=cur.find(p=>p.type===k);return x?x.value:''};
 if(!get('year')||!get('month'))return Array.from({length:30},(_,i)=>addDays(today(),-29+i));
 const dates=[];for(let i=34;i>=0;i--){const date=addDays(today(),-i),d=new Date(date+'T12:00:00');let p=[];try{p=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'numeric'}).formatToParts(d)}catch(e){}const y=(p.find(x=>x.type==='year')||{}).value,m=(p.find(x=>x.type==='month')||{}).value;if(y===get('year')&&m===get('month'))dates.push(date)}return dates;
}
function renderReports(){
 const wk=Array.from({length:7},(_,i)=>addDays(today(),i-6));const mo=currentPersianMonthDates();
 const week=document.getElementById('rooyeshWeekMoodReport'),month=document.getElementById('rooyeshMonthMoodReport');
 if(week)week.innerHTML=reportHtml(tr('۷ روز اخیر','Last 7 days'),calcStats(wk),7);
 if(month)month.innerHTML=reportHtml(tr('ماه جاری تا امروز','Current month so far'),calcStats(mo),mo.length);
}
function findSelectedDate(){const el=document.querySelector('#calendarGrid .calendar-day.selected[data-calendar-date]');return el?el.getAttribute('data-calendar-date'):today()}
function updateSelectedMood(date){
 const box=document.getElementById('rooyeshMoodDayDetail');if(!box)return;
 const entry=getEntry(date);
 if(!entry){box.innerHTML='<strong>'+esc(tr('حال‌وهوای ','Mood on ')+date)+'</strong><br>'+tr('برای این روز هنوز حال‌وهوایی ثبت نشده.','No mood has been saved for this day yet.');return}
 box.innerHTML='<strong>'+entry.emoji+' '+esc(entry.label||((options.find(o=>o.key===entry.key)||{}).fa||''))+'</strong><br>'+esc(entry.message);
}
function decorateCalendar(){
 const grid=document.getElementById('calendarGrid');if(!grid)return;
 ratings=readRatings();
 grid.querySelectorAll('.calendar-day[data-calendar-date]').forEach(cell=>{
  const date=cell.getAttribute('data-calendar-date'),entry=getEntry(date);
  let marker=cell.querySelector('.cal-mood-mark');
  if(entry){cell.classList.add('has-mood');if(!marker){marker=document.createElement('span');marker.className='cal-mood-mark';marker.setAttribute('aria-hidden','true');cell.appendChild(marker)}marker.textContent=entry.emoji;cell.setAttribute('title',date+' · '+entry.emoji+' '+(entry.label||''))}
  else{cell.classList.remove('has-mood');if(marker)marker.remove()}
 });
 updateSelectedMood(findSelectedDate());renderReports();
}
function initCalendarExtras(){
 const cal=document.getElementById('calendarPage');if(!cal)return;
 if(!document.getElementById('rooyeshMoodReportPanel')){
  const panel=document.createElement('section');panel.className='panel study-mood-report-panel';panel.id='rooyeshMoodReportPanel';
  panel.innerHTML='<div class="panel-title"><h3>'+tr('🌿 گزارش حال‌وهوای مطالعه','🌿 Study mood summary')+'</h3><span class="hint">'+tr('هفته و ماه جاری','This week and month')+'</span></div><div class="mood-extras-reports"><article class="mood-extras-report" id="rooyeshWeekMoodReport"><h4>'+tr('۷ روز اخیر','Last 7 days')+'</h4><p></p></article><article class="mood-extras-report" id="rooyeshMonthMoodReport"><h4>'+tr('ماه جاری تا امروز','Current month so far')+'</h4><p></p></article></div>';
  const selected=cal.querySelector('.selected-day-panel');cal.insertBefore(panel,selected||null);
 }
 const selectedPanel=cal.querySelector('.selected-day-panel');
 if(selectedPanel&&!document.getElementById('rooyeshMoodDayDetail')){
  const detail=document.createElement('div');detail.className='mood-extras-detail';detail.id='rooyeshMoodDayDetail';const heading=selectedPanel.querySelector('h4');if(heading)heading.insertAdjacentElement('afterend',detail);else selectedPanel.insertBefore(detail,selectedPanel.firstChild);
 }
 const grid=document.getElementById('calendarGrid');if(grid&&!grid.__rooyeshMoodListener){grid.__rooyeshMoodListener=true;grid.addEventListener('click',e=>{const cell=e.target.closest('.calendar-day[data-calendar-date]');if(!cell)return;setTimeout(()=>{updateSelectedMood(cell.getAttribute('data-calendar-date'));decorateCalendar()},0)})}
 ['calendarPrev','calendarNext','calendarToday'].forEach(id=>{const b=document.getElementById(id);if(b&&!b.__rooyeshMoodListener){b.__rooyeshMoodListener=true;b.addEventListener('click',()=>setTimeout(decorateCalendar,0))}});
 renderReports();decorateCalendar();
}
function onDataUpdated(nextRecords,nextGoal){
 records=Array.isArray(nextRecords)?nextRecords:records;dailyGoal=Math.max(1,Math.min(1440,Number(nextGoal)||120));
 syncNative();initCalendarExtras();maybePrompt();
}
window.RooyeshStudyExtras={
 onStudyDataUpdated:onDataUpdated,
 getRatings:()=>readRatings(),
 getMessageHistory:()=>readHistory(),
 applyImportedData:(raw)=>{if(raw&&typeof raw==='object'){if(raw.moodRatings&&typeof raw.moodRatings==='object'&&!Array.isArray(raw.moodRatings)){ratings=raw.moodRatings;try{localStorage.setItem(STORE,JSON.stringify(ratings))}catch(e){}}if(Array.isArray(raw.moodMessageHistory)){history=raw.moodMessageHistory.filter(x=>typeof x==='string').slice(-100);try{localStorage.setItem(HISTORY,JSON.stringify(history))}catch(e){}}initCalendarExtras()}},
 refresh:()=>{ratings=readRatings();decorateCalendar();renderReports();maybePrompt()}
};
function syncBackup(){
 const field=document.getElementById('backupText');if(!field)return;
 try{const data=JSON.parse(field.value);data.moodRatings=readRatings();data.moodMessageHistory=readHistory();field.value=JSON.stringify(data,null,2)}catch(e){}
}
const exportButton=document.getElementById('exportBtn');if(exportButton)exportButton.addEventListener('click',()=>setTimeout(syncBackup,0));
const importButton=document.getElementById('backupApply');if(importButton)importButton.addEventListener('click',()=>{const raw=(document.getElementById('backupText')||{}).value||'';setTimeout(()=>{const overlay=document.getElementById('backupOverlay');if(overlay&&overlay.classList.contains('hidden')){try{const data=JSON.parse(raw);if(data&&typeof data==='object'&&!Array.isArray(data))window.RooyeshStudyExtras.applyImportedData(data)}catch(e){}}},0)});
const watch=document.getElementById('calendarGrid');if(watch){const observer=new MutationObserver(()=>{decorateCalendar()});observer.observe(watch,{childList:true,subtree:true})}
initCalendarExtras();
})();