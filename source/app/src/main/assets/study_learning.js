(function () {
'use strict';

const STORAGE_KEY = 'rooyeshFlashcardsV1';
const DAY_MS = 86400000;
const $ = (id) => document.getElementById(id);
const pageId = 'learningPage';
const navId = 'learningShortcut';
let demoMode = false;
let view = 'cards';
let sessionQueue = [];
let sessionIndex = 0;
let showingAnswer = false;
let lastLanguage = document.documentElement.lang || 'fa';
let toastMessage = '';

function isEnglish() { return document.documentElement.lang === 'en'; }
function tr(fa, en) { return isEnglish() ? en : fa; }
function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}
function readCards() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function (c) {
      return c && typeof c.question === 'string' && typeof c.answer === 'string' && c.question.trim() && c.answer.trim();
    }).map(function (c) {
      return {
        id: String(c.id || (Date.now() + Math.random())),
        subject: String(c.subject || '').slice(0, 50),
        question: c.question.slice(0, 500),
        answer: c.answer.slice(0, 3000),
        createdAt: Number(c.createdAt) || Date.now(),
        dueAt: Number(c.dueAt) || 0,
        intervalDays: Math.max(0, Number(c.intervalDays) || 0),
        reviews: Math.max(0, Number(c.reviews) || 0),
        lastReviewedAt: Number(c.lastReviewedAt) || 0
      };
    });
  } catch (_) { return []; }
}
let cards = readCards();
function persistCards() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    return true;
  } catch (_) {
    toastMessage = tr('ذخیره‌سازی در دسترس نیست؛ فضای گوشی را بررسی کن.', 'Storage is unavailable; check device storage.');
    return false;
  }
}

const demoCards = [
  { id: 'demo-1', subject: 'جامعه‌شناسی', question: 'جامعه‌پذیری چیست؟', answer: 'فرایندی که طی آن فرد هنجارها، ارزش‌ها، نقش‌ها و شیوه‌های زندگی در جامعه را یاد می‌گیرد.', dueAt: 0, intervalDays: 0, reviews: 0 },
  { id: 'demo-2', subject: 'روان‌شناسی', question: 'تقویت در یادگیری چه نقشی دارد؟', answer: 'پیامدی که احتمال تکرار یک رفتار را افزایش می‌دهد، تقویت‌کننده است؛ نوع و زمان‌بندی آن می‌تواند بر یادگیری اثر بگذارد.', dueAt: 0, intervalDays: 0, reviews: 0 },
  { id: 'demo-3', subject: 'عربی', question: 'فعل ماضی معمولاً به چه زمانی اشاره می‌کند؟', answer: 'به انجام شدن کار در گذشته؛ برای تشخیص دقیق باید صیغه و ساخت فعل را هم بررسی کرد.', dueAt: 0, intervalDays: 0, reviews: 0 },
  { id: 'demo-4', subject: 'علوم و فنون', question: 'برای یادگیری پایدار، فقط دوباره‌خوانی کافی است؟', answer: 'نه لزوماً. تلاش برای به‌یادآوردن پاسخ و مرور فاصله‌دار هم می‌توانند به تثبیت یادگیری کمک کنند.', dueAt: 0, intervalDays: 0, reviews: 0 }
];
let demoProgress = {};
function activeCards() { return demoMode ? demoCards : cards; }
function isDue(card) {
  const dueAt = demoMode ? (demoProgress[card.id] && demoProgress[card.id].dueAt) : card.dueAt;
  return !dueAt || dueAt <= Date.now();
}
function dueCards() { return activeCards().filter(isDue); }
function fmtNumber(n) {
  return new Intl.NumberFormat(isEnglish() ? 'en-US' : 'fa-IR', { maximumFractionDigits: 1 }).format(n);
}
function fmtMinutes(minutes) {
  const n = Math.max(0, Math.round(minutes || 0));
  const hours = Math.floor(n / 60);
  const mins = n % 60;
  if (isEnglish()) return hours ? hours + 'h ' + mins + 'm' : mins + 'm';
  return hours ? fmtNumber(hours) + ' ساعت و ' + fmtNumber(mins) + ' دقیقه' : fmtNumber(mins) + ' دقیقه';
}
function localDateKey(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}
function actualReport() {
  let records = [];
  try {
    const raw = JSON.parse(localStorage.getItem('rooyeshRecords') || '[]');
    if (Array.isArray(raw)) records = raw.filter(function (r) { return r && Number.isFinite(Number(r.minutes)) && Number(r.minutes) > 0; });
  } catch (_) {}
  const now = new Date();
  const today = localDateKey(now);
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
  const week = records.filter(function (r) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.date || ''))) return false;
    const d = new Date(String(r.date) + 'T12:00:00').getTime();
    return d >= from && d <= now.getTime() + DAY_MS;
  });
  const minutes = week.reduce(function (sum, r) { return sum + Number(r.minutes || 0); }, 0);
  const subjects = {};
  week.forEach(function (r) {
    const s = String(r.subject || tr('بدون عنوان', 'Untitled')).trim();
    subjects[s] = (subjects[s] || 0) + Number(r.minutes || 0);
  });
  let topSubject = '';
  Object.keys(subjects).forEach(function (s) { if (!topSubject || subjects[s] > subjects[topSubject]) topSubject = s; });
  const activeDays = new Set(week.map(function (r) { return String(r.date); })).size;
  return { minutes: minutes, sessions: week.length, activeDays: activeDays, topSubject: topSubject, totalCards: cards.length, today: today };
}
function demoReport() {
  return { minutes: 500, sessions: 11, activeDays: 5, topSubject: 'جامعه‌شناسی', totalCards: 4 };
}

function ensureUI() {
  const nav = document.querySelector('.bottom-nav');
  const home = $('homePage');
  const settings = $('settingsPage');
  if (!nav || !home || !settings) return false;

  if (!$('learningShortcut')) {
    const shortcut = document.createElement('section');
    shortcut.id = 'learningShortcut';
    shortcut.className = 'panel rl-shortcut';
    shortcut.innerHTML =
      '<div class="rl-shortcut-mark" aria-hidden="true">✦</div>' +
      '<div class="rl-shortcut-copy"><span class="rl-eyebrow">' + esc(tr('یک قدم فراتر از ثبت ساعت', 'Beyond tracking hours')) + '</span>' +
      '<h3>' + esc(tr('آزمایشگاه یادگیری', 'Learning lab')) + '</h3>' +
      '<p>' + esc(tr('با فلش‌کارت مرور کن، فاصله مرورها را بسپار به رویش و رشدت را ببین.', 'Review with flashcards, schedule spaced reviews and see your progress.')) + '</p></div>' +
      '<div class="rl-shortcut-actions"><button class="btn btn-primary" type="button" data-rl-open>' + esc(tr('باز کردن', 'Open')) + ' ↗</button>' +
      '<button class="btn btn-soft" type="button" data-rl-demo>' + esc(tr('حالت آزمایشی', 'Experimental mode')) + '</button></div>';
    const hero = home.querySelector('.hero');
    if (hero && hero.parentNode) hero.parentNode.insertBefore(shortcut, hero.nextSibling);
    shortcut.addEventListener('click', function (event) {
      if (event.target.closest('[data-rl-demo]')) { demoMode = true; view = 'cards'; sessionQueue = []; renderPage(); openPage(); }
      else if (event.target.closest('[data-rl-open]')) { demoMode = false; view = 'cards'; sessionQueue = []; renderPage(); openPage(); }
    });
  }

  if (!$('learningPage')) {
    const page = document.createElement('div');
    page.id = pageId;
    page.className = 'page hidden';
    page.innerHTML = '<section class="panel rl-page-panel" id="rlRoot" aria-live="polite"></section>';
    settings.parentNode.insertBefore(page, settings.nextSibling);
  }
  if (!$('rlStyle')) {
    const style = document.createElement('style');
    style.id = 'rlStyle';
    style.textContent =
      '.rl-shortcut{display:grid;grid-template-columns:auto minmax(0,1fr);gap:13px;align-items:center;margin:15px 0;position:relative;overflow:hidden}' +
      '.rl-shortcut-mark{width:46px;height:46px;border-radius:16px;display:grid;place-items:center;background:var(--green2);color:var(--green);font-size:25px}' +
      '.rl-shortcut-copy{min-width:0}.rl-eyebrow{font-size:10px;font-weight:800;letter-spacing:.2px;color:var(--green)}' +
      '.rl-shortcut h3{font-size:16px;margin:3px 0}.rl-shortcut p{font-size:12px;line-height:1.8;color:var(--muted);margin:0}' +
      '.rl-shortcut-actions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}.rl-shortcut-actions .btn{flex:1 1 130px}' +
      '.rl-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.rl-head h2{font-size:20px;margin:0 0 4px}.rl-head p{font-size:12px;line-height:1.8;color:var(--muted);margin:0}' +
      '.rl-badge{display:inline-flex;align-items:center;gap:5px;background:var(--green2);color:var(--green);border-radius:999px;padding:5px 9px;font-size:10px;font-weight:800;white-space:nowrap}' +
      '.rl-banner{border:1px solid var(--line);border-radius:17px;padding:12px 14px;margin:0 0 14px;background:rgba(220,235,224,.25)}' +
      '.rl-banner strong{display:block;font-size:13px;margin-bottom:3px}.rl-banner p{font-size:11px;line-height:1.8;color:var(--muted);margin:0}' +
      '.rl-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 16px}.rl-stat{background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:11px;min-width:0}.rl-stat span{display:block;font-size:10px;color:var(--muted)}.rl-stat strong{display:block;font-size:19px;margin-top:4px;overflow-wrap:anywhere}' +
      '.rl-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:4px;border-radius:13px;background:var(--bg);margin:0 0 15px}.rl-tabs button{border:0;border-radius:10px;background:transparent;color:var(--muted);min-height:39px;font:inherit;font-size:12px;font-weight:750}.rl-tabs button.active{background:var(--paper);color:var(--green);box-shadow:0 2px 8px rgba(20,40,25,.08)}' +
      '.rl-subhead{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:12px 0}.rl-subhead h3{font-size:14px;margin:0}.rl-subhead small{color:var(--muted);font-size:10px}' +
      '.rl-form{display:grid;gap:10px;margin-bottom:18px}.rl-form .field{margin:0}.rl-form textarea{min-height:82px;resize:vertical;line-height:1.8}.rl-card-list{display:grid;gap:9px}.rl-card-item{border:1px solid var(--line);border-radius:15px;padding:12px;background:var(--paper);min-width:0}.rl-card-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.rl-card-item h4{font-size:13px;margin:0 0 6px;line-height:1.8;overflow-wrap:anywhere}.rl-card-item p{font-size:11px;color:var(--muted);line-height:1.85;margin:7px 0 0;overflow-wrap:anywhere;white-space:pre-wrap}.rl-card-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.rl-card-actions button{font-size:11px;min-height:34px;padding:7px 10px}.rl-empty{border:1px dashed var(--line);border-radius:15px;padding:19px 14px;text-align:center;color:var(--muted);font-size:12px;line-height:1.9}.rl-session{border:1px solid var(--line);border-radius:21px;padding:18px;background:linear-gradient(145deg,var(--paper),var(--bg));min-height:205px;display:flex;flex-direction:column;justify-content:center;text-align:center;margin:12px 0}.rl-session .rl-eyebrow{margin-bottom:8px}.rl-session h3{font-size:19px;line-height:1.8;margin:0;overflow-wrap:anywhere;white-space:pre-wrap}.rl-session-answer{font-size:13px;line-height:2;color:var(--muted);margin-top:14px;white-space:pre-wrap;overflow-wrap:anywhere}.rl-session-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:12px 0}.rl-grade{border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);padding:9px 3px;min-height:54px;font:inherit;font-size:11px;font-weight:800}.rl-grade small{display:block;font-size:9px;font-weight:500;color:var(--muted);margin-top:3px}.rl-grade.again{border-color:#e7c6bd}.rl-grade.easy{border-color:#bdd9c4}.rl-report-bar{height:9px;background:var(--bg);border-radius:999px;overflow:hidden;margin:8px 0 4px}.rl-report-bar span{display:block;height:100%;background:var(--green);border-radius:inherit}.rl-note{font-size:11px;line-height:1.8;color:var(--muted);margin:8px 0}.rl-toast{font-size:12px;color:var(--green);min-height:21px;margin-top:8px}.rl-demo-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}.rl-demo-actions .btn{flex:1 1 140px}.rl-back{margin-inline-start:auto}.rl-danger{color:#a85747}' +
      'body.dark-mode .rl-shortcut{background:rgba(27,37,30,.84);border-color:var(--line)}body.dark-mode .rl-card-item{background:rgba(27,37,30,.84)}body.dark-mode .rl-session{background:linear-gradient(145deg,rgba(27,37,30,.95),rgba(16,23,19,.9))}' +
      '@media(max-width:420px){.rl-stats{gap:5px}.rl-stat{padding:9px}.rl-stat strong{font-size:16px}.rl-head h2{font-size:18px}.rl-card-top{flex-direction:column}.rl-session-actions{gap:4px}.rl-grade{font-size:10px}}';
    document.head.appendChild(style);
  }
  return true;
}

function openPage() {
  document.querySelectorAll('.page').forEach(function (page) { page.classList.toggle('hidden', page.id !== pageId); });
  document.querySelectorAll('.nav-button').forEach(function (button) { button.classList.remove('active'); });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function closePage() {
  const homeButton = document.querySelector('.nav-button[data-page="homePage"]');
  if (homeButton) homeButton.click();
}

function renderPage() {
  const root = $('rlRoot');
  if (!root) return;
  const list = activeCards();
  const dueCount = list.filter(isDue).length;
  const report = demoMode ? demoReport() : actualReport();
  const modeLabel = demoMode ? tr('حالت آزمایشی • داده‌های ساختگی', 'Experimental mode • sample data') : tr('حالت شخصی • داده‌های همین گوشی', 'Personal mode • on-device data');
  let html = '';
  html += '<div class="rl-head"><div><h2>' + esc(tr('آزمایشگاه یادگیری', 'Learning lab')) + '</h2><p>' + esc(tr('مرور فعال و فاصله‌دار؛ در کنار ثبت زمان مطالعه.', 'Active recall and spaced review alongside study tracking.')) + '</p></div>';
  html += '<button class="btn btn-quiet rl-back" type="button" data-rl-close aria-label="' + esc(tr('بازگشت به خانه', 'Back home')) + '">← ' + esc(tr('خانه', 'Home')) + '</button></div>';
  html += '<div class="rl-banner"><strong>' + esc(modeLabel) + '</strong><p>' + esc(demoMode ? tr('این بخش فقط دادهٔ آزمایشی دارد؛ کارت‌ها و پیشرفت واقعی تو تغییر نمی‌کنند.', 'This section uses sample data only; your real cards and progress remain unchanged.') : tr('کارت‌ها فقط روی همین گوشی ذخیره می‌شوند. برای مصاحبه می‌توانی حالت نمایشی را روشن کنی.', 'Cards stay on this device. Use demo mode for the interview presentation.')) + '</p></div>';
  if (demoMode) {
    html += '<div class="rl-demo-actions"><button class="btn btn-primary" type="button" data-rl-exit-demo>' + esc(tr('خروج از نمایش', 'Exit demo')) + '</button><button class="btn btn-soft" type="button" data-rl-demo-review>' + esc(tr('اجرای مرور نمونه', 'Try sample review')) + '</button></div>';
  } else {
    html += '<div class="rl-demo-actions"><button class="btn btn-soft" type="button" data-rl-enter-demo>✦ ' + esc(tr('اجرای حالت آزمایشی', 'Enter experimental mode')) + '</button></div>';
  }
  html += '<div class="rl-stats"><div class="rl-stat"><span>' + esc(tr('کل کارت‌ها', 'Total cards')) + '</span><strong>' + fmtNumber(list.length) + '</strong></div>';
  html += '<div class="rl-stat"><span>' + esc(tr('آماده مرور', 'Due to review')) + '</span><strong>' + fmtNumber(dueCount) + '</strong></div>';
  html += '<div class="rl-stat"><span>' + esc(tr('مطالعه هفتگی', 'Weekly study')) + '</span><strong>' + esc(fmtMinutes(report.minutes)) + '</strong></div></div>';
  html += '<div class="rl-tabs" role="tablist"><button type="button" data-rl-view="cards" class="' + (view === 'cards' ? 'active' : '') + '" role="tab" aria-selected="' + (view === 'cards') + '">' + esc(tr('کارت‌ها', 'Cards')) + '</button><button type="button" data-rl-view="review" class="' + (view === 'review' ? 'active' : '') + '" role="tab" aria-selected="' + (view === 'review') + '">' + esc(tr('مرور', 'Review')) + '</button><button type="button" data-rl-view="report" class="' + (view === 'report' ? 'active' : '') + '" role="tab" aria-selected="' + (view === 'report') + '">' + esc(tr('گزارش رشد', 'Progress')) + '</button></div>';
  if (view === 'cards') html += renderCardsView(list);
  else if (view === 'review') html += renderReviewView(list);
  else html += renderReportView(report);
  html += '<div class="rl-toast" role="status" aria-live="polite">' + esc(toastMessage) + '</div>';
  root.innerHTML = html;
}

function renderCardsView(list) {
  let html = '';
  if (!demoMode) {
    html += '<div class="rl-subhead"><h3>' + esc(tr('کارت جدید بساز', 'Create a flashcard')) + '</h3><small>' + esc(tr('سؤال کوتاه، جواب روشن', 'A clear question and answer')) + '</small></div>';
    html += '<form class="rl-form" id="rlCardForm"><div class="field"><label for="rlSubject">' + esc(tr('درس', 'Subject')) + '</label><input class="input" id="rlSubject" name="subject" maxlength="50" placeholder="' + esc(tr('مثلاً جامعه‌شناسی', 'e.g. Sociology')) + '" required></div>';
    html += '<div class="field"><label for="rlQuestion">' + esc(tr('روی کارت: سؤال', 'Front: question')) + '</label><textarea class="input" id="rlQuestion" name="question" maxlength="500" required placeholder="' + esc(tr('یک سؤال که بتوانی بدون نگاه کردن پاسخ بدهی…', 'A question you can answer from memory…')) + '"></textarea></div>';
    html += '<div class="field"><label for="rlAnswer">' + esc(tr('پشت کارت: پاسخ', 'Back: answer')) + '</label><textarea class="input" id="rlAnswer" name="answer" maxlength="3000" required placeholder="' + esc(tr('پاسخ را با زبان ساده بنویس…', 'Write the answer in your own words…')) + '"></textarea></div>';
    html += '<button class="btn btn-primary btn-wide" type="submit">＋ ' + esc(tr('ذخیره کارت', 'Save card')) + '</button></form>';
  } else {
    html += '<div class="rl-subhead"><h3>' + esc(tr('کارت‌های نمونه', 'Sample study cards')) + '</h3><small>' + esc(tr('حالت آزمایشی', 'Experimental mode')) + '</small></div>';
  }
  html += '<div class="rl-subhead"><h3>' + esc(tr('مجموعه کارت‌ها', 'Your deck')) + '</h3><small>' + fmtNumber(list.length) + ' ' + esc(tr('کارت', 'cards')) + '</small></div>';
  if (!list.length) {
    html += '<div class="rl-empty">🌱 ' + esc(tr('هنوز کارتی نساختی. یک سؤال از درس امروزت وارد کن تا مرورش را شروع کنیم.', 'No cards yet. Add a question from today’s lesson to start reviewing.')) + '</div>';
  } else {
    html += '<div class="rl-card-list">';
    list.forEach(function (card) {
      const due = isDue(card);
      html += '<article class="rl-card-item"><div class="rl-card-top"><div><h4>' + esc(card.question) + '</h4><span class="rl-badge">' + esc(card.subject) + '</span></div><span class="rl-badge">' + esc(due ? tr('آماده مرور', 'Due now') : tr('مرور زمان‌بندی‌شده', 'Scheduled')) + '</span></div>';
      html += '<p>' + esc(card.answer.length > 170 ? card.answer.slice(0, 170) + '…' : card.answer) + '</p><div class="rl-card-actions"><button class="btn btn-soft" type="button" data-rl-practice="' + esc(card.id) + '">' + esc(tr('تمرین این کارت', 'Practice card')) + '</button>';
      if (!demoMode) html += '<button class="btn btn-quiet rl-danger" type="button" data-rl-delete="' + esc(card.id) + '">' + esc(tr('حذف', 'Delete')) + '</button>';
      html += '</div></article>';
    });
    html += '</div>';
  }
  return html;
}

function renderReviewView(list) {
  let html = '<div class="rl-subhead"><h3>' + esc(tr('مرور با یادآوری فعال', 'Active recall')) + '</h3><small>' + esc(tr('اول پاسخ را به خاطر بیاور', 'Recall before revealing')) + '</small></div>';
  if (sessionQueue.length && sessionIndex < sessionQueue.length) {
    const id = sessionQueue[sessionIndex];
    const card = list.find(function (c) { return c.id === id; });
    if (!card) { sessionQueue = []; sessionIndex = 0; return renderReviewView(list); }
    html += '<div class="rl-note">' + esc(tr('کارت ', 'Card ')) + fmtNumber(sessionIndex + 1) + ' / ' + fmtNumber(sessionQueue.length) + (demoMode ? ' · ' + esc(tr('نمونه', 'sample')) : '') + '</div>';
    html += '<div class="rl-session"><span class="rl-eyebrow">' + esc(card.subject || tr('درس', 'Subject')) + '</span><h3>' + esc(card.question) + '</h3>';
    if (showingAnswer) html += '<div class="rl-session-answer">' + esc(card.answer) + '</div>';
    html += '</div>';
    if (!showingAnswer) {
      html += '<button class="btn btn-primary btn-wide" type="button" data-rl-flip>' + esc(tr('نمایش پاسخ', 'Reveal answer')) + '</button>';
      html += '<p class="rl-note">' + esc(tr('پیش از دیدن پاسخ، سعی کن آن را با زبان خودت توضیح بدهی.', 'Try explaining the answer in your own words before revealing it.')) + '</p>';
    } else {
      html += '<p class="rl-note">' + esc(tr('پاسخت چطور بود؟ پاسخ را با صداقت ارزیابی کن تا زمان مرور بعدی منطقی بماند.', 'How well did you recall it? Rate honestly to schedule the next review.')) + '</p>';
      html += '<div class="rl-session-actions"><button class="rl-grade again" type="button" data-rl-grade="again">' + esc(tr('دوباره', 'Again')) + '<small>' + esc(tr('خیلی سخت', 'Forgot')) + '</small></button><button class="rl-grade" type="button" data-rl-grade="hard">' + esc(tr('سخت', 'Hard')) + '<small>' + esc(tr('با زحمت', 'Difficult')) + '</small></button><button class="rl-grade" type="button" data-rl-grade="good">' + esc(tr('خوب', 'Good')) + '<small>' + esc(tr('یادم بود', 'Recalled')) + '</small></button><button class="rl-grade easy" type="button" data-rl-grade="easy">' + esc(tr('آسان', 'Easy')) + '<small>' + esc(tr('روان بود', 'Easy recall')) + '</small></button></div>';
    }
    html += '<button class="btn btn-quiet btn-wide" type="button" data-rl-stop>' + esc(tr('پایان این مرور', 'End review')) + '</button>';
    return html;
  }
  const dueCount = list.filter(isDue).length;
  html += '<div class="rl-empty">' + esc(dueCount ? tr('برای شروع آماده‌ای. کارت‌های سررسید را مرور کن؛ اگر خواستی می‌توانی همه کارت‌ها را هم تمرین کنی.', 'Ready when you are. Review due cards, or practise the whole deck.') : tr('فعلاً کارتی برای مرور زمان‌بندی نشده؛ می‌توانی برای تمرین، همه کارت‌ها را مرور کنی.', 'Nothing is due yet. You can still practise all cards.')) + '</div>';
  html += '<div class="rl-demo-actions"><button class="btn btn-primary" type="button" data-rl-start="due" ' + (list.length ? '' : 'disabled') + '>' + esc(tr('شروع مرور سررسیدها', 'Review due cards')) + ' (' + fmtNumber(dueCount) + ')</button><button class="btn btn-soft" type="button" data-rl-start="all" ' + (list.length ? '' : 'disabled') + '>' + esc(tr('مرور همه کارت‌ها', 'Review all cards')) + '</button></div>';
  return html;
}

function renderReportView(report) {
  const goal = demoMode ? 600 : readGoal();
  const pct = Math.min(100, Math.round(report.minutes / goal * 100));
  let html = '<div class="rl-subhead"><h3>' + esc(tr('جمع‌بندی هفت روز اخیر', 'Last seven days')) + '</h3><small>' + esc(demoMode ? tr('گزارش آزمایشی', 'Experimental report') : tr('از سوابق همین گوشی', 'From this device’s records')) + '</small></div>';
  html += '<div class="rl-stats"><div class="rl-stat"><span>' + esc(tr('زمان مطالعه', 'Study time')) + '</span><strong>' + esc(fmtMinutes(report.minutes)) + '</strong></div><div class="rl-stat"><span>' + esc(tr('جلسه ثبت‌شده', 'Sessions')) + '</span><strong>' + fmtNumber(report.sessions) + '</strong></div><div class="rl-stat"><span>' + esc(tr('روزهای فعال', 'Active days')) + '</span><strong>' + fmtNumber(report.activeDays) + '/7</strong></div></div>';
  html += '<div class="rl-card-item"><div class="rl-card-top"><h4>' + esc(tr('پیشرفت نسبت به هدف هفتگی', 'Weekly goal progress')) + '</h4><strong>' + fmtNumber(pct) + '٪'.replace('٪', isEnglish() ? '%' : '٪') + '</strong></div><div class="rl-report-bar"><span style="width:' + pct + '%"></span></div><p>' + esc(tr('هدف نمونه: ', 'Illustrative goal: ')) + fmtMinutes(goal) + '</p></div>';
  html += '<div class="rl-card-item" style="margin-top:9px"><h4>' + esc(tr('درس پرتکرار', 'Most-studied subject')) + '</h4><p>' + esc(report.topSubject || tr('هنوز داده‌ای برای این بازه ثبت نشده است.', 'No subject data recorded for this period yet.')) + '</p></div>';
  html += '<p class="rl-note">' + esc(demoMode ? tr('این اعداد ساختگی‌اند و فقط روش گزارش‌دهی را نشان می‌دهند.', 'These sample numbers only demonstrate the report layout.') : tr('این گزارش توصیفی است و به‌تنهایی کیفیت یادگیری یا میزان تسلط را ثابت نمی‌کند. برای سنجش یادگیری، مرور کارت‌ها و تمرین هم مهم‌اند.', 'This is a descriptive report, not proof of mastery. Flashcard reviews and practice help assess learning too.')) + '</p>';
  return html;
}
function readGoal() {
  try { return Math.max(1, Math.min(1440, Number(localStorage.getItem('rooyeshGoal')) || 120)) * 7; }
  catch (_) { return 840; }
}
function beginSession(which, specificId) {
  const list = activeCards();
  let chosen;
  if (specificId) chosen = list.filter(function (card) { return card.id === specificId; });
  else chosen = list.filter(function (card) { return which === 'all' || isDue(card); });
  sessionQueue = chosen.map(function (card) { return card.id; });
  sessionIndex = 0;
  showingAnswer = false;
  view = 'review';
  if (!sessionQueue.length) toastMessage = tr('کارتی برای این مرور پیدا نشد.', 'No cards found for this review.');
  renderPage();
}
function scheduleCard(card, grade) {
  const prior = Math.max(0, Number(card.intervalDays) || 0);
  let days;
  if (grade === 'again') days = 10 / 1440;
  else if (grade === 'hard') days = Math.max(1, Math.ceil((prior || 1) * 1.2));
  else if (grade === 'easy') days = prior < 1 ? 4 : Math.max(4, Math.round(prior * 2.5));
  else days = prior < 1 ? 1 : (prior < 2 ? 3 : Math.round(prior * 2));
  card.intervalDays = days;
  card.dueAt = Date.now() + days * DAY_MS;
  card.lastReviewedAt = Date.now();
  card.reviews = (Number(card.reviews) || 0) + 1;
}
function gradeCurrent(grade) {
  const list = activeCards();
  const id = sessionQueue[sessionIndex];
  const card = list.find(function (c) { return c.id === id; });
  if (!card) return;
  if (demoMode) {
    demoProgress[id] = demoProgress[id] || { dueAt: 0, intervalDays: 0, reviews: 0 };
    scheduleCard(demoProgress[id], grade);
  } else {
    scheduleCard(card, grade);
    persistCards();
  }
  sessionIndex++;
  showingAnswer = false;
  if (sessionIndex >= sessionQueue.length) {
    sessionQueue = [];
    sessionIndex = 0;
    toastMessage = tr('مرور تمام شد؛ عالیه که برای یادآوری وقت گذاشتی.', 'Review complete. Great job making time to recall.');
  }
  renderPage();
}

function handleClick(event) {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.hasAttribute('data-rl-close')) { closePage(); return; }
  if (target.hasAttribute('data-rl-enter-demo')) { demoMode = true; view = 'cards'; sessionQueue = []; toastMessage = ''; renderPage(); return; }
  if (target.hasAttribute('data-rl-exit-demo')) { demoMode = false; view = 'cards'; sessionQueue = []; toastMessage = ''; renderPage(); return; }
  if (target.hasAttribute('data-rl-demo-review')) { beginSession('all'); return; }
  if (target.hasAttribute('data-rl-view')) { view = target.getAttribute('data-rl-view'); sessionQueue = []; sessionIndex = 0; showingAnswer = false; toastMessage = ''; renderPage(); return; }
  if (target.hasAttribute('data-rl-start')) { beginSession(target.getAttribute('data-rl-start')); return; }
  if (target.hasAttribute('data-rl-practice')) { beginSession('all', target.getAttribute('data-rl-practice')); return; }
  if (target.hasAttribute('data-rl-flip')) { showingAnswer = true; renderPage(); return; }
  if (target.hasAttribute('data-rl-grade')) { gradeCurrent(target.getAttribute('data-rl-grade')); return; }
  if (target.hasAttribute('data-rl-stop')) { sessionQueue = []; sessionIndex = 0; showingAnswer = false; view = 'review'; toastMessage = tr('این مرور را پایان دادی.', 'Review ended.'); renderPage(); return; }
  if (target.hasAttribute('data-rl-delete')) {
    const id = target.getAttribute('data-rl-delete');
    if (!demoMode && window.confirm(tr('این کارت حذف شود؟', 'Delete this flashcard?'))) {
      cards = cards.filter(function (card) { return card.id !== id; });
      persistCards(); renderPage();
    }
  }
}
function handleSubmit(event) {
  if (event.target.id !== 'rlCardForm') return;
  event.preventDefault();
  if (demoMode) return;
  const form = event.target;
  const subject = String(form.elements.subject.value || '').trim().slice(0, 50);
  const question = String(form.elements.question.value || '').trim().slice(0, 500);
  const answer = String(form.elements.answer.value || '').trim().slice(0, 3000);
  if (!subject || !question || !answer) {
    toastMessage = tr('درس، سؤال و پاسخ را کامل کن.', 'Complete the subject, question and answer.');
    renderPage();
    return;
  }
  cards.unshift({ id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8), subject: subject, question: question, answer: answer, createdAt: Date.now(), dueAt: 0, intervalDays: 0, reviews: 0, lastReviewedAt: 0 });
  persistCards();
  view = 'cards';
  toastMessage = tr('کارت ذخیره شد؛ هر زمان آماده بودی مرورش کن.', 'Card saved. Review it whenever you are ready.');
  renderPage();
}

window.RooyeshLearningBridge = {
  getCards: function () {
    return cards.map(function (c) {
      return { id: c.id, subject: c.subject, question: c.question, answer: c.answer, dueAt: c.dueAt, intervalDays: c.intervalDays, reviews: c.reviews };
    });
  },
  addCard: function (input) {
    if (demoMode) return { ok: false, message: 'Exit experimental mode before editing real cards.' };
    if (!input || !String(input.subject || '').trim() || !String(input.question || '').trim() || !String(input.answer || '').trim()) return { ok: false, message: 'Subject, question, and answer are required.' };
    cards.unshift({
      id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8),
      subject: String(input.subject).trim().slice(0, 50),
      question: String(input.question).trim().slice(0, 500),
      answer: String(input.answer).trim().slice(0, 3000),
      createdAt: Date.now(), dueAt: 0, intervalDays: 0, reviews: 0, lastReviewedAt: 0
    });
    persistCards();
    if ($('rlRoot')) renderPage();
    return { ok: true, message: 'Flashcard created.' };
  }
};

function init() {
  if (!ensureUI()) return;
  const root = $('rlRoot');
  root.addEventListener('click', handleClick);
  root.addEventListener('submit', handleSubmit);
  renderPage();
  const observer = new MutationObserver(function () {
    const lang = document.documentElement.lang || 'fa';
    if (lang !== lastLanguage) {
      lastLanguage = lang;
      renderPage();
      const shortcut = $('learningShortcut');
      if (shortcut) {
        const copy = shortcut.querySelector('.rl-shortcut-copy');
        const actions = shortcut.querySelector('.rl-shortcut-actions');
        if (copy) copy.innerHTML = '<span class="rl-eyebrow">' + esc(tr('یک قدم فراتر از ثبت ساعت', 'Beyond tracking hours')) + '</span><h3>' + esc(tr('آزمایشگاه یادگیری', 'Learning lab')) + '</h3><p>' + esc(tr('با فلش‌کارت مرور کن، فاصله مرورها را بسپار به رویش و رشدت را ببین.', 'Review with flashcards, schedule spaced reviews and see your progress.')) + '</p>';
        if (actions) actions.innerHTML = '<button class="btn btn-primary" type="button" data-rl-open>' + esc(tr('باز کردن', 'Open')) + ' ↗</button><button class="btn btn-soft" type="button" data-rl-demo>' + esc(tr('حالت آزمایشی', 'Experimental mode')) + '</button>';
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();