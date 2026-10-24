(function () {
'use strict';

const KEY_STORE = 'rooyeshOpenRouterApiKey';
const CONSENT_STORE = 'rooyeshOpenRouterConsent';
const MODEL = 'openrouter/free';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const $ = function (id) { return document.getElementById(id); };
let history = [];
let pendingActions = [];
let busy = false;
let conversationId = 0;
let lastLanguage = document.documentElement.lang || 'fa';
const sectionNames = {
  home: 'خانه / Home', records: 'سوابق مطالعه / Study records', notes: 'یادداشت‌ها / Notes',
  planner: 'برنامه‌ریز / Planner', calendar: 'تقویم مطالعه / Study calendar',
  translator: 'مترجم فارسی و انگلیسی / Translator', learning: 'آزمایشگاه یادگیری و فلش‌کارت / Learning lab and flashcards',
  settings: 'تنظیمات / Settings'
};
function en() { return document.documentElement.lang === 'en'; }
function tr(fa, english) { return en() ? english : fa; }
function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}
function formatMessage(value) {
  let safe = esc(value);
  safe = safe.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return safe.replace(/\n/g, '<br>');
}
function getBridge() { return window.RooyeshAssistantBridge || null; }
function getState() {
  const bridge = getBridge();
  if (!bridge || typeof bridge.getState !== 'function') throw new Error(tr('اتصال دستیار به داده‌های رویش آماده نیست؛ برنامه را یک‌بار ببند و باز کن.', 'The assistant bridge is not ready. Reopen Rooyesh and try again.'));
  return bridge.getState();
}
function safeParse(value, fallback) { try { return JSON.parse(value); } catch (_) { return fallback; } }
function localCards() {
  const bridge = window.RooyeshLearningBridge;
  try { return bridge && bridge.getCards ? bridge.getCards() : safeParse(localStorage.getItem('rooyeshFlashcardsV1') || '[]', []); }
  catch (_) { return []; }
}
function dueDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) ? new Date(d + 'T12:00:00').getTime() : NaN; }
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dateLabel(date) {
  if (!date) return '';
  try { return new Date(String(date).slice(0, 10) + 'T12:00:00').toLocaleDateString(en() ? 'en-US' : 'fa-IR'); }
  catch (_) { return String(date); }
}
const systemPrompt = [
  'You are Rooyesh AI, the built-in study assistant for the Rooyesh Android study app.',
  'Reply in the user’s language, usually Persian. Be practical, kind, concise and age-appropriate.',
  'Your purpose is to help a student learn, manage study time, understand progress, make plans, organise notes and flashcards, use the translator and school tools, and understand the app.',
  'Rooyesh components: study timer and manual study records; daily study goal; weekly progress and growth tree; calendar; notes; study planner with day/part slots; Persian-English translation (offline model download or online service); Arabic grammar learning cards for general/humanities high school; searchable 118-element periodic table; daily reminder/alarm; mood check-in; local backup; and learning lab with spaced flashcards.',
  'Use get_app_overview to explain the app. Use the read/search tools whenever a question depends on the user’s actual records, notes, goals, plans, flashcards or mood. Never pretend you read data unless the corresponding tool returned it.',
  'Data comes from this device only when you call a relevant tool. Mood information is separate and potentially personal: call get_mood_summary only when the user asks about it.',
  'You may propose edits only with propose_app_action. All changes require the user to approve an explicit confirmation card in the app. Never claim a proposed action has already been completed.',
  'Never request or reveal API keys, passwords, authentication secrets, or private credentials. Do not put API keys into notes, records, tool arguments, or responses.',
  'Do not make up study history, grades, quiz results or progress. Explain that time spent is not the same as mastery. If data is missing, say so.',
  'Never say your answer is medical or psychological diagnosis. A mood log can help reflection, but it is not a diagnosis.',
  'Tool use is local app functionality, not unrestricted device access. You can only read the data and perform actions provided by the available tools.',
  'Respect the student’s autonomy. Suggestions should be realistic and non-shaming; rest is allowed and a missed day is not a failure.'
].join('\n');

const tools = [
  { type: 'function', function: { name: 'get_app_overview', description: 'Explain the purpose of Rooyesh and list the app sections and capabilities. Use when the user asks what this app can do or where a feature is.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_study_summary', description: 'Read and summarize actual study records for the requested recent period. Includes minutes, sessions, active days, subject totals, daily goal, and plan status.', parameters: { type: 'object', properties: { range_days: { type: 'integer', description: 'Number of recent days, 1 to 90; default 7.' }, subject: { type: 'string', description: 'Optional subject filter.' } } } } },
  { type: 'function', function: { name: 'search_local_content', description: 'Search local study records, notes, planned study tasks and flashcards for matching words. Does not search private mood logs.', parameters: { type: 'object', properties: { query: { type: 'string', description: 'Words to search for.' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'get_notes', description: 'Read local notes, optionally filtered by a search query. Note bodies may contain personal information; return only the most relevant entries.', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', description: '1 to 10 entries; default 5.' } } } } },
  { type: 'function', function: { name: 'get_planner', description: 'Read the current local study plan, including task slots for upcoming days. Use when the user asks about or wants help with their plan.', parameters: { type: 'object', properties: { days_ahead: { type: 'integer', description: 'Number of plan days to return, 1 to 30; default 7.' } } } } },
  { type: 'function', function: { name: 'get_flashcards', description: 'Read local flashcards, optionally searching question, answer or subject. Use to help quiz the student or improve cards.', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', description: '1 to 20; default 10.' } } } } },
  { type: 'function', function: { name: 'get_mood_summary', description: 'Read only the student’s saved mood check-ins, if any. Use only when they specifically ask to reflect on their mood log or ask what is saved there. Do not diagnose.', parameters: { type: 'object', properties: { range_days: { type: 'integer', description: '1 to 90 recent days; default 14.' } } } } },
  { type: 'function', function: { name: 'navigate_to_section', description: 'Open an existing section of Rooyesh on the user’s device. This is a navigation action, not a data modification.', parameters: { type: 'object', properties: { section: { type: 'string', enum: ['home', 'records', 'notes', 'planner', 'calendar', 'translator', 'learning', 'settings'] } }, required: ['section'] } } },
  { type: 'function', function: { name: 'open_study_tool', description: 'Open a specific built-in tool panel: translator, Arabic grammar lessons/practice, or the periodic table. This is navigation only.', parameters: { type: 'object', properties: { tool: { type: 'string', enum: ['translate', 'arabic', 'periodic'] } }, required: ['tool'] } } },
  { type: 'function', function: { name: 'propose_app_action', description: 'Propose a local change. The app will show the exact change and wait for the student to tap Confirm; you must not claim success until the app reports execution. Supported actions: add_study_record, create_note, create_flashcard, set_daily_goal, create_study_plan.', parameters: { type: 'object', properties: {
    action: { type: 'string', enum: ['add_study_record', 'create_note', 'create_flashcard', 'set_daily_goal', 'create_study_plan'] },
    subject: { type: 'string' }, minutes: { type: 'integer' }, date: { type: 'string', description: 'Date in YYYY-MM-DD, if relevant.' }, note: { type: 'string' },
    title: { type: 'string' }, body: { type: 'string' }, question: { type: 'string' }, answer: { type: 'string' },
    daily_goal_minutes: { type: 'integer' }, days: { type: 'integer' }, parts_per_day: { type: 'integer' }, start_date: { type: 'string', description: 'Start date YYYY-MM-DD, if known.' }, tasks: { type: 'array', items: { type: 'string' }, description: 'Optional ordered study tasks to place in the plan.' }
  }, required: ['action'] } } }
];

function overview() {
  const state = getState();
  const cards = localCards();
  const areas = [
    { id: 'records', purpose: 'Timer/manual logging of subject, duration, date and a short note; aggregate study history.' },
    { id: 'goal', purpose: 'Daily target in minutes; drives the progress bar and growth tree.' },
    { id: 'planner', purpose: 'A saved plan with dates and session/part slots; can produce a PDF.' },
    { id: 'notes', purpose: 'Local notes with title, date and body.' },
    { id: 'calendar', purpose: 'Calendar of daily study records.' },
    { id: 'translator', purpose: 'Persian-English translation; offline mode requires downloading the language model once, online mode sends text to its service.' },
    { id: 'learning', purpose: 'Offline flashcards and spaced repetition.' },
    { id: 'tools', purpose: 'Arabic grammar lessons/practice and a searchable periodic table.' },
    { id: 'mood', purpose: 'Private daily mood check-in and trends; queried only when asked.' },
    { id: 'reminder', purpose: 'Native daily reminder and configurable alarm.' },
    { id: 'backup', purpose: 'Export/restore a local data backup.' },
    { id: 'assistant', purpose: 'This AI helper: explain, analyse chosen app data, suggest study strategies, and propose approved edits.' }
  ];
  return { app: 'Rooyesh', language: state.language, dailyGoalMinutes: state.dailyGoalMinutes, studyRecordCount: state.records.length, noteCount: state.notes.length, flashcardCount: cards.length, hasStudyPlan: !!state.studyPlan, areas: areas };
}

function getSummary(args) {
  const state = getState();
  const days = Math.max(1, Math.min(90, Math.round(Number(args.range_days) || 7)));
  const filter = String(args.subject || '').trim().toLocaleLowerCase();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  const from = start.getTime();
  const entries = state.records.filter(function (r) {
    const time = dueDate(r.date);
    return Number.isFinite(time) && time >= from && (!filter || String(r.subject || '').toLocaleLowerCase().includes(filter));
  });
  const subjectMinutes = {};
  const dailyMinutes = {};
  entries.forEach(function (r) {
    const subject = String(r.subject || tr('مطالعه آزاد', 'General study'));
    subjectMinutes[subject] = (subjectMinutes[subject] || 0) + Number(r.minutes || 0);
    dailyMinutes[r.date] = (dailyMinutes[r.date] || 0) + Number(r.minutes || 0);
  });
  const totalMinutes = entries.reduce(function (sum, r) { return sum + Number(r.minutes || 0); }, 0);
  let bestSubject = null;
  Object.keys(subjectMinutes).forEach(function (key) { if (!bestSubject || subjectMinutes[key] > subjectMinutes[bestSubject]) bestSubject = key; });
  return {
    rangeDays: days, totalMinutes: totalMinutes, formattedTotal: Math.floor(totalMinutes / 60) + 'h ' + (totalMinutes % 60) + 'm',
    sessionCount: entries.length, activeDays: Object.keys(dailyMinutes).length, dailyGoalMinutes: state.dailyGoalMinutes,
    subjectMinutes: subjectMinutes, dailyMinutes: dailyMinutes, mostStudiedSubject: bestSubject,
    planTitle: state.studyPlan ? state.studyPlan.title : null,
    note: 'Study time is a behaviour metric, not proof of mastery. The app’s records may be incomplete.'
  };
}
function getPlanner(args) {
  const state = getState();
  if (!state.studyPlan) return { hasPlan: false, message: 'No saved study plan.' };
  const limit = Math.max(1, Math.min(30, Math.round(Number(args.days_ahead) || 7)));
  return {
    hasPlan: true, title: state.studyPlan.title, startDate: state.studyPlan.startDate,
    daysCount: state.studyPlan.days.length, partsPerDay: state.studyPlan.partsPerDay,
    days: state.studyPlan.days.slice(0, limit).map(function (d) { return { date: d.date, tasks: d.parts }; })
  };
}
function getNotes(args) {
  const state = getState();
  const query = String(args.query || '').trim().toLocaleLowerCase();
  const limit = Math.max(1, Math.min(10, Math.round(Number(args.limit) || 5)));
  return state.notes.slice().reverse().filter(function (n) {
    return !query || (String(n.title || '') + ' ' + String(n.body || '')).toLocaleLowerCase().includes(query);
  }).slice(0, limit).map(function (n) {
    return { title: n.title, date: n.date, body: String(n.body || '').slice(0, 1800) };
  });
}
function searchContent(args) {
  const state = getState();
  const cards = localCards();
  const query = String(args.query || '').trim().toLocaleLowerCase();
  if (!query) return { results: [], message: 'Provide a non-empty search query.' };
  const results = [];
  function add(type, title, content, date) {
    const combined = String(title || '') + ' ' + String(content || '');
    if (combined.toLocaleLowerCase().includes(query) && results.length < 12) results.push({ type: type, title: String(title || '').slice(0, 140), date: date || '', snippet: String(content || '').slice(0, 500) });
  }
  state.records.slice(-120).forEach(function (r) { add('study_record', r.subject, (r.minutes + ' minutes. ' + (r.note || '')), r.date); });
  state.notes.slice(-60).forEach(function (n) { add('note', n.title, n.body, n.date); });
  cards.forEach(function (c) { add('flashcard', c.subject + ': ' + c.question, c.answer, ''); });
  if (state.studyPlan) state.studyPlan.days.forEach(function (day) { (day.parts || []).forEach(function (part) { add('planned_task', state.studyPlan.title, part, day.date); }); });
  return { query: query, results: results, note: 'Search excludes mood logs. No result does not prove the information is absent from the whole app.' };
}
function getMood(args) {
  const range = Math.max(1, Math.min(90, Math.round(Number(args.range_days) || 14)));
  const raw = safeParse(localStorage.getItem('rooyeshMoodRatings') || 'null', null);
  if (!raw) return { savedMoodData: false, message: 'No mood check-ins are available in the expected local storage key.' };
  const items = Array.isArray(raw) ? raw : Object.keys(raw).map(function (k) {
    const value = raw[k];
    return typeof value === 'object' && value ? Object.assign({ date: k }, value) : { date: k, value: value };
  });
  const from = Date.now() - range * 86400000;
  const clean = items.filter(function (item) {
    if (!item || typeof item !== 'object') return false;
    const dateValue = item.date || item.day || item.createdAt || item.timestamp;
    const t = typeof dateValue === 'number' ? dateValue : dueDate(String(dateValue || ''));
    return Number.isFinite(t) && t >= from;
  }).slice(-45).map(function (item) {
    return { date: String(item.date || item.day || ''), mood: String(item.mood || item.key || item.value || item.rating || ''), note: String(item.note || '').slice(0, 160) };
  });
  return { rangeDays: range, count: clean.length, checkIns: clean, note: 'Reflection only; not a diagnosis. The current mood module may store more detailed ratings in a different schema.' };
}
function executeReadTool(name, args) {
  if (name === 'get_app_overview') return overview();
  if (name === 'get_study_summary') return getSummary(args);
  if (name === 'search_local_content') return searchContent(args);
  if (name === 'get_notes') return getNotes(args);
  if (name === 'get_planner') return getPlanner(args);
  if (name === 'get_flashcards') {
    const query = String(args.query || '').trim().toLocaleLowerCase();
    const limit = Math.max(1, Math.min(20, Math.round(Number(args.limit) || 10)));
    return { cards: localCards().filter(function (c) { return !query || (String(c.subject) + ' ' + String(c.question) + ' ' + String(c.answer)).toLocaleLowerCase().includes(query); }).slice(0, limit).map(function (c) { return { subject: c.subject, question: c.question, answer: c.answer, reviews: c.reviews, nextReviewAt: c.dueAt ? new Date(c.dueAt).toISOString() : 'due now' }; }) };
  }
  if (name === 'get_mood_summary') return getMood(args);
  if (name === 'navigate_to_section') {
    const bridge = getBridge();
    return bridge ? bridge.navigateTo(args.section) : { ok: false, message: 'App bridge is not ready.' };
  }
  if (name === 'open_study_tool') {
    const bridge = getBridge();
    if (!bridge) return { ok: false, message: 'App bridge is not ready.' };
    const nav = bridge.navigateTo('translator');
    if (!nav || nav.ok === false) return nav;
    const button = document.querySelector('[data-study-tool="' + String(args.tool || '') + '"]');
    if (!button) return { ok: false, message: 'Tool panel is unavailable.' };
    button.click();
    return { ok: true, tool: args.tool };
  }
  if (name === 'propose_app_action') return proposeAction(args);
  return { error: 'Unknown tool.' };
}
function describeAction(a) {
  if (a.action === 'add_study_record') return tr('ثبت ' + (a.minutes || '?') + ' دقیقه مطالعه برای «' + (a.subject || 'مطالعه') + '» در تاریخ ' + (a.date || 'امروز'), 'Add a ' + (a.minutes || '?') + '-minute study record for "' + (a.subject || 'study') + '" on ' + (a.date || 'today'));
  if (a.action === 'create_note') return tr('ساخت یادداشت «' + (a.title || 'یادداشت دستیار') + '»', 'Create note "' + (a.title || 'AI study note') + '"');
  if (a.action === 'create_flashcard') return tr('ساخت فلش‌کارت برای درس «' + (a.subject || '') + '»', 'Create a flashcard for "' + (a.subject || '') + '"');
  if (a.action === 'set_daily_goal') return tr('تغییر هدف روزانه به ' + a.daily_goal_minutes + ' دقیقه', 'Set daily goal to ' + a.daily_goal_minutes + ' minutes');
  if (a.action === 'create_study_plan') return tr('ساخت برنامه «' + (a.title || 'برنامه درسی') + '» برای ' + a.days + ' روز با ' + a.parts_per_day + ' پارت روزانه', 'Create plan "' + (a.title || 'Study plan') + '" for ' + a.days + ' days, ' + a.parts_per_day + ' parts/day');
  return tr('تغییر پیشنهادی رویش', 'Proposed change in Rooyesh');
}
function proposeAction(args) {
  const a = Object.assign({}, args || {});
  const action = String(a.action || '');
  const allowed = ['add_study_record', 'create_note', 'create_flashcard', 'set_daily_goal', 'create_study_plan'];
  if (allowed.indexOf(action) < 0) return { ok: false, message: 'Unsupported action.' };
  if (action === 'add_study_record') {
    a.subject = String(a.subject || '').trim().slice(0, 100);
    a.minutes = Number(a.minutes);
    a.date = String(a.date || todayISO()).slice(0, 10);
    a.note = String(a.note || '').slice(0, 1000);
    if (!a.subject || !Number.isInteger(a.minutes) || a.minutes < 1 || a.minutes > 1440 || !/^\d{4}-\d{2}-\d{2}$/.test(a.date)) return { ok: false, message: 'Study record needs subject, 1–1440 whole minutes and YYYY-MM-DD date.' };
  } else if (action === 'create_note') {
    a.title = String(a.title || '').trim().slice(0, 120);
    a.body = String(a.body || '').trim().slice(0, 12000);
    a.date = String(a.date || todayISO()).slice(0, 10);
    if (!a.body || !/^\d{4}-\d{2}-\d{2}$/.test(a.date)) return { ok: false, message: 'Note body and valid date are required.' };
  } else if (action === 'create_flashcard') {
    a.subject = String(a.subject || '').trim().slice(0, 50);
    a.question = String(a.question || '').trim().slice(0, 500);
    a.answer = String(a.answer || '').trim().slice(0, 3000);
    if (!a.subject || !a.question || !a.answer) return { ok: false, message: 'Subject, question and answer are required.' };
  } else if (action === 'set_daily_goal') {
    a.daily_goal_minutes = Number(a.daily_goal_minutes);
    if (!Number.isInteger(a.daily_goal_minutes) || a.daily_goal_minutes < 1 || a.daily_goal_minutes > 1440) return { ok: false, message: 'Daily goal must be 1–1440 whole minutes.' };
  } else if (action === 'create_study_plan') {
    a.title = String(a.title || '').trim().slice(0, 100);
    a.days = Number(a.days);
    a.parts_per_day = Number(a.parts_per_day);
    a.start_date = String(a.start_date || todayISO()).slice(0, 10);
    a.tasks = Array.isArray(a.tasks) ? a.tasks.map(function (x) { return String(x || '').trim().slice(0, 200); }).filter(Boolean).slice(0, 480) : [];
    if (!Number.isInteger(a.days) || a.days < 1 || a.days > 60 || !Number.isInteger(a.parts_per_day) || a.parts_per_day < 1 || a.parts_per_day > 16 || a.days * a.parts_per_day > 480 || !/^\d{4}-\d{2}-\d{2}$/.test(a.start_date)) return { ok: false, message: 'Plan must have 1–60 days, 1–16 parts/day, at most 480 slots and a valid YYYY-MM-DD start date.' };
    const current = getState().studyPlan;
    if (current) a.warning = tr('این کار محتوای برنامه فعلی را جایگزین می‌کند.', 'This will replace the existing plan.');
  }
  const id = 'proposal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  pendingActions.push({ id: id, args: a, status: 'pending', description: describeAction(a) });
  return { pendingApproval: true, proposalId: id, description: describeAction(a), requiresUserConfirmation: true, note: 'The app has NOT executed this action yet.' };
}
function runAction(action) {
  const bridge = getBridge();
  if (!bridge) throw new Error('App bridge is unavailable.');
  const a = action.args;
  if (a.action === 'add_study_record') return bridge.addStudyRecord({ subject: a.subject, minutes: a.minutes, date: a.date, note: a.note });
  if (a.action === 'create_note') return bridge.createNote({ title: a.title, body: a.body, date: a.date });
  if (a.action === 'create_flashcard') {
    const cardBridge = window.RooyeshLearningBridge;
    return cardBridge && cardBridge.addCard ? cardBridge.addCard({ subject: a.subject, question: a.question, answer: a.answer }) : { ok: false, message: 'Learning module is not ready.' };
  }
  if (a.action === 'set_daily_goal') return bridge.setDailyGoal(a.daily_goal_minutes);
  if (a.action === 'create_study_plan') return bridge.createStudyPlan({ title: a.title, days: a.days, partsPerDay: a.parts_per_day, startDate: a.start_date, tasks: a.tasks });
  return { ok: false, message: 'Unsupported action.' };
}
function actionCard(action) {
  const pending = action.status === 'pending';
  const outcome = action.status === 'success' ? tr('انجام شد', 'Completed') : action.status === 'rejected' ? tr('لغو شد', 'Cancelled') : action.status === 'error' ? tr('خطا در اجرا', 'Action failed') : tr('منتظر تأیید تو', 'Awaiting your approval');
  const details = action.args.action === 'create_flashcard'
    ? '<p><b>' + esc(tr('سؤال:', 'Question:')) + '</b> ' + esc(action.args.question) + '<br><b>' + esc(tr('پاسخ:', 'Answer:')) + '</b> ' + esc(action.args.answer) + '</p>'
    : action.args.action === 'create_note'
      ? '<p>' + esc(String(action.args.body || '').slice(0, 350)) + '</p>'
      : action.args.action === 'create_study_plan'
        ? '<p>' + esc(tr('تاریخ شروع: ', 'Start date: ') + action.args.start_date) + (action.args.warning ? '<br>' + esc(action.args.warning) : '') + '</p>'
        : action.args.action === 'add_study_record'
          ? '<p>' + esc(action.args.date + ' · ' + action.args.minutes + ' ' + tr('دقیقه', 'minutes') + (action.args.note ? ' · ' + action.args.note : '')) + '</p>'
          : '';
  return '<article class="ra-action"><div class="ra-action-head"><strong>' + esc(action.description) + '</strong><span class="ra-status">' + esc(outcome) + '</span></div>' + details +
    (pending ? '<div class="ra-actions"><button type="button" class="btn btn-primary" data-ra-approve="' + esc(action.id) + '">' + esc(tr('تأیید و اجرا', 'Confirm and apply')) + '</button><button type="button" class="btn btn-quiet" data-ra-reject="' + esc(action.id) + '">' + esc(tr('لغو', 'Cancel')) + '</button></div>' : action.message ? '<p class="ra-action-result">' + esc(action.message) + '</p>' : '') + '</article>';
}

function ensureUI() {
  const home = $('homePage');
  const settings = $('settingsPage');
  if (!home || !settings) return false;
  if (!$('assistantHomeCard')) {
    const card = document.createElement('section');
    card.id = 'assistantHomeCard';
    card.className = 'panel ra-home';
    card.innerHTML = '<div class="ra-orb" aria-hidden="true">✧</div><div class="ra-home-copy"><span class="ra-eyebrow">' + esc(tr('دستیار درسی', 'Study assistant')) + '</span><h3>' + esc(tr('هوش مصنوعی رویش', 'Rooyesh AI')) + '</h3><p>' + esc(tr('از گزارش مطالعه تا برنامه‌ریزی، یادداشت و فلش‌کارت؛ یک دستیار آگاه از امکانات رویش.', 'A study assistant that understands your records, planner, notes and flashcards.')) + '</p></div><button type="button" class="btn btn-primary btn-wide" data-ra-open>' + esc(tr('گفت‌وگو با رویش AI', 'Chat with Rooyesh AI')) + ' ↗</button>';
    const learning = $('learningShortcut');
    const hero = home.querySelector('.hero');
    if (learning && learning.parentNode) learning.parentNode.insertBefore(card, learning.nextSibling);
    else if (hero && hero.parentNode) hero.parentNode.insertBefore(card, hero.nextSibling);
    card.addEventListener('click', function (event) { if (event.target && event.target.closest('[data-ra-open]')) openPage(); });
  }
  if (!$('assistantPage')) {
    const page = document.createElement('div');
    page.id = 'assistantPage';
    page.className = 'page hidden';
    page.innerHTML = '<section class="panel ra-panel"><div class="ra-top"><div class="ra-orb" aria-hidden="true">✧</div><div><h2>' + esc(tr('هوش مصنوعی رویش', 'Rooyesh AI')) + '</h2><p>' + esc(tr('دستیار آموزشی با دسترسی کنترل‌شده به بخش‌های رویش', 'A learning assistant with controlled access to Rooyesh sections')) + '</p></div><button type="button" class="btn btn-quiet ra-home-button" data-ra-home>← ' + esc(tr('خانه', 'Home')) + '</button></div><div id="raSetup"></div><div class="ra-examples" id="raExamples"><span>' + esc(tr('مثال:', 'Try:')) + '</span><button type="button" data-ra-prompt="' + esc(tr('این هفته چطور درس خواندم؟', 'How did I study this week?')) + '">' + esc(tr('تحلیل مطالعه‌ام', 'Analyse my study')) + '</button><button type="button" data-ra-prompt="' + esc(tr('برای درس جامعه‌شناسی چند فلش‌کارت بساز.', 'Help me create a sociology flashcard.')) + '">' + esc(tr('ساخت فلش‌کارت', 'Create flashcard')) + '</button><button type="button" data-ra-prompt="' + esc(tr('امکانات رویش را توضیح بده.', 'Explain Rooyesh features.')) + '">' + esc(tr('راهنمای برنامه', 'App guide')) + '</button></div><div id="raMessages" class="ra-messages" aria-live="polite"></div><div id="raPending"></div><form id="raComposer" class="ra-composer"><textarea id="raInput" maxlength="2500" rows="2" placeholder="' + esc(tr('از رویش چیزی بپرس…', 'Ask Rooyesh anything…')) + '" aria-label="' + esc(tr('پیام به دستیار', 'Message the assistant')) + '"></textarea><button type="submit" class="btn btn-primary" id="raSend">' + esc(tr('ارسال', 'Send')) + ' ↑</button></form><p class="ra-footnote">' + esc(tr('مدل رایگان ابری است؛ برای پاسخ‌گویی، پیام و فقط داده‌هایی که از رویش درخواست می‌شود به OpenRouter و مدل انتخابی آن ارسال می‌شوند. از ارسال اطلاعات خیلی خصوصی خودداری کن.', 'The free model runs in the cloud. Your message and the app data you ask it to use are sent to OpenRouter and its selected model provider. Avoid sharing highly sensitive information.')) + '</p></section>';
    const learningPage = $('learningPage');
    if (learningPage && learningPage.parentNode) learningPage.parentNode.insertBefore(page, learningPage.nextSibling);
    else settings.parentNode.insertBefore(page, settings.nextSibling);
  }
  if (!$('raStyle')) {
    const style = document.createElement('style');
    style.id = 'raStyle';
    style.textContent =
      '.ra-home{display:grid;grid-template-columns:auto minmax(0,1fr);gap:11px;align-items:center;margin:15px 0}.ra-orb{width:46px;height:46px;flex:0 0 46px;border-radius:16px;background:linear-gradient(145deg,#e4f0e5,#ece7f8);display:grid;place-items:center;color:#477b62;font-size:27px}.ra-home-copy{min-width:0}.ra-eyebrow{font-size:10px;font-weight:850;color:var(--green)}.ra-home h3{font-size:16px;margin:2px 0}.ra-home p{font-size:12px;color:var(--muted);line-height:1.8;margin:0}.ra-home>[data-ra-open]{grid-column:1/-1}.ra-panel{padding:14px!important}.ra-top{display:flex;align-items:center;gap:10px;margin-bottom:13px}.ra-top>div:nth-child(2){flex:1;min-width:0}.ra-top h2{font-size:19px;margin:0}.ra-top p{font-size:11px;color:var(--muted);line-height:1.7;margin:2px 0 0}.ra-home-button{white-space:nowrap;padding:7px 9px;font-size:11px}.ra-setup{border:1px solid var(--line);border-radius:16px;background:var(--bg);padding:13px;margin:0 0 13px}.ra-setup h3{font-size:14px;margin:0 0 6px}.ra-setup p{font-size:11px;line-height:1.85;color:var(--muted);margin:0 0 10px}.ra-key-row{display:flex;gap:7px;align-items:center}.ra-key-row input{min-width:0;flex:1}.ra-consent{display:flex;gap:8px;align-items:flex-start;font-size:11px;line-height:1.8;margin:10px 0;color:var(--ink)}.ra-consent input{margin-top:4px;accent-color:var(--green);flex:0 0 auto}.ra-setup-actions{display:flex;gap:7px;flex-wrap:wrap}.ra-setup-actions .btn{flex:1 1 110px}.ra-free-pill{display:inline-flex;padding:3px 7px;border-radius:999px;background:var(--green2);font-size:10px;color:var(--green);font-weight:800;margin-inline-start:5px}.ra-examples{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 12px}.ra-examples span{font-size:10px;color:var(--muted)}.ra-examples button{border:1px solid var(--line);border-radius:999px;padding:6px 9px;background:var(--paper);color:var(--ink);font:inherit;font-size:10px}.ra-messages{display:flex;flex-direction:column;gap:10px;min-height:90px;max-height:42vh;overflow:auto;padding:4px 0 12px;scroll-behavior:smooth}.ra-msg{max-width:94%;padding:11px 13px;border:1px solid var(--line);border-radius:15px;line-height:1.95;font-size:13px;overflow-wrap:anywhere;white-space:normal}.ra-msg.user{align-self:flex-start;background:var(--green2);border-end-start-radius:5px}.ra-msg.assistant{align-self:flex-end;background:var(--paper);border-end-end-radius:5px}.ra-msg.system{align-self:stretch;max-width:none;font-size:11px;color:var(--muted);background:var(--bg)}.ra-msg code{font-size:11px;background:var(--bg);padding:1px 4px;border-radius:4px;direction:ltr}.ra-composer{display:flex;align-items:flex-end;gap:7px;position:sticky;bottom:5px;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:7px;margin-top:6px;box-shadow:0 6px 24px rgba(28,45,32,.08)}.ra-composer textarea{flex:1;min-width:0;max-height:120px;resize:vertical;border:0;outline:0;background:transparent;color:var(--ink);font:inherit;font-size:13px;line-height:1.7;padding:7px}.ra-composer button{min-height:42px}.ra-footnote{font-size:10px;line-height:1.85;color:var(--muted);margin:10px 1px 0}.ra-action{border:1px solid var(--line);border-radius:14px;padding:11px;margin:8px 0;background:var(--bg)}.ra-action-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.ra-action-head strong{font-size:12px;line-height:1.8}.ra-status{white-space:nowrap;color:var(--green);font-size:10px}.ra-action p{font-size:11px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0;color:var(--muted)}.ra-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.ra-actions .btn{flex:1 1 115px;font-size:11px}.ra-action-result{color:var(--green)!important}.ra-busy{align-self:center;color:var(--muted);font-size:11px;padding:8px}.ra-error{color:#b55443}.ra-status-line{font-size:11px;color:var(--muted);min-height:20px;margin:5px 0}.ra-link{color:var(--green);text-decoration:underline}.ra-key-row .input{min-height:42px;padding:8px}.ra-model-label{font-size:11px;color:var(--muted);margin-bottom:5px}' +
      'body.dark-mode .ra-orb{background:linear-gradient(145deg,rgba(43,77,52,.8),rgba(66,54,86,.8));color:#a4d8b2}body.dark-mode .ra-setup,body.dark-mode .ra-action{background:rgba(18,27,21,.8);border-color:var(--line)}body.dark-mode .ra-examples button{background:rgba(27,37,30,.9);border-color:var(--line)}body.dark-mode .ra-composer{background:rgba(27,37,30,.97)}' +
      '@media(max-width:390px){.ra-panel{padding:10px!important}.ra-top h2{font-size:17px}.ra-home-button{font-size:10px}.ra-msg{max-width:98%;font-size:12px}.ra-setup{padding:10px}}';
    document.head.appendChild(style);
  }
  return true;
}
function openPage() {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.toggle('hidden', p.id !== 'assistantPage'); });
  document.querySelectorAll('.nav-button').forEach(function (b) { b.classList.remove('active'); });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderSetup();
  renderConversation();
  $('raInput').focus();
}
function goHome() {
  const home = document.querySelector('.nav-button[data-page="homePage"]');
  if (home) home.click();
}
function renderSetup() {
  const root = $('raSetup');
  if (!root) return;
  const hasKey = !!localStorage.getItem(KEY_STORE);
  const consent = localStorage.getItem(CONSENT_STORE) === 'yes';
  root.innerHTML = '<section class="ra-setup"><h3>' + esc(tr('اتصال مدل رایگان', 'Connect free model')) + '<span class="ra-free-pill">FREE</span></h3><p>' + esc(tr('مدل از مسیر OpenRouter Free انتخاب می‌شود و از ابزارهای برنامه پشتیبانی می‌کند. کلید API را خودت ایجاد کن؛ کلید مشترکی داخل APK قرار نداده‌ایم. کلید روی همین دستگاه ذخیره می‌شود، نه در مخزن گیت‌هاب.', 'The OpenRouter Free router chooses a free model with tool support. Create your own API key; no shared key is bundled in the APK. Your key is saved on this device, not in the GitHub repository.')) + '</p><div class="ra-model-label">Model: <b>openrouter/free</b></div><div class="ra-key-row"><input id="raKeyInput" class="input" type="password" autocomplete="off" spellcheck="false" maxlength="240" placeholder="' + esc(hasKey ? tr('کلید ذخیره شده؛ برای تغییر، کلید جدید وارد کن', 'Key saved; enter a new key to replace it') : tr('کلید OpenRouter را وارد کن', 'Enter your OpenRouter API key')) + '" aria-label="' + esc(tr('کلید API', 'API key')) + '"><button type="button" class="btn btn-quiet" data-ra-reveal>' + esc(tr('نمایش', 'Show')) + '</button></div><label class="ra-consent"><input id="raConsent" type="checkbox" ' + (consent ? 'checked' : '') + '><span>' + esc(tr('می‌دانم متن پیام‌ها و داده‌های برنامه که دستیار برای پاسخ انتخاب می‌کند، از اینترنت به OpenRouter و تأمین‌کننده مدلی که انتخاب می‌شود ارسال خواهد شد. اطلاعات بسیار خصوصی را نمی‌فرستم.', 'I understand messages and app data the assistant chooses for a response are sent over the internet to OpenRouter and its selected model provider. I will not send highly sensitive information.')) + '</span></label><div class="ra-setup-actions"><button type="button" class="btn btn-primary" data-ra-save-key>' + esc(tr('ذخیره و فعال‌سازی', 'Save and enable')) + '</button><button type="button" class="btn btn-soft" data-ra-key-help>' + esc(tr('گرفتن کلید رایگان', 'Get free API key')) + ' ↗</button><button type="button" class="btn btn-quiet" data-ra-clear-key>' + esc(tr('حذف کلید', 'Remove key')) + '</button></div><p class="ra-status-line" id="raSetupStatus">' + esc(hasKey && consent ? tr('اتصال تنظیم شده است؛ برای ادامه پیام بفرست.', 'Connection is configured. Send a message to continue.') : tr('برای شروع به کلید خودت و تأیید اطلاعیه حریم خصوصی نیاز است.', 'Enter your own key and acknowledge the privacy notice to begin.')) + '</p></section>';
}
function renderConversation() {
  const root = $('raMessages');
  const pendingRoot = $('raPending');
  if (!root || !pendingRoot) return;
  root.innerHTML = history.slice(-18).map(function (m) {
    return '<div class="ra-msg ' + esc(m.role) + '">' + formatMessage(m.content) + '</div>';
  }).join('');
  if (!history.length) root.innerHTML = '<div class="ra-msg system">' + esc(tr('می‌توانم بخش‌های رویش را توضیح بدهم، داده‌های انتخابی را تحلیل کنم و برای تغییرات قبل از اجرا از تو تأیید بگیرم. برای شروع، کلید رایگان را تنظیم کن.', 'I can explain app sections, analyse selected data and ask before making changes. Set up the free key to start.')) + '</div>';
  pendingRoot.innerHTML = pendingActions.slice(-8).map(actionCard).join('');
  root.scrollTop = root.scrollHeight;
}
function setStatus(message, isError) {
  const el = $('raSetupStatus');
  if (el) { el.textContent = message; el.classList.toggle('ra-error', !!isError); }
}
function saveKey() {
  const input = $('raKeyInput');
  const consent = $('raConsent');
  const existing = localStorage.getItem(KEY_STORE) || '';
  const key = String(input && input.value || '').trim() || existing;
  if (!key || key.length < 12) { setStatus(tr('کلید API معتبر وارد کن.', 'Enter a valid API key.'), true); return; }
  if (!consent || !consent.checked) { setStatus(tr('برای استفاده از مدل ابری باید اطلاعیه ارسال داده را تأیید کنی.', 'Acknowledge the cloud data-sharing notice to enable the model.'), true); return; }
  try {
    localStorage.setItem(KEY_STORE, key);
    localStorage.setItem(CONSENT_STORE, 'yes');
    if (input) input.value = '';
    renderSetup();
    setStatus(tr('کلید ذخیره شد. حالا یک سؤال بپرس.', 'Key saved. You can now ask a question.'), false);
  } catch (_) { setStatus(tr('ذخیره‌سازی در دسترس نیست؛ کلید را در تنظیمات مرورگر بررسی کن.', 'Local storage is unavailable; check device storage settings.'), true); }
}
function keyHelp() {
  const url = 'https://openrouter.ai/settings/keys';
  const w = window.open(url, '_blank');
  if (!w) setStatus(tr('این صفحه را در مرورگر باز کن: https://openrouter.ai/settings/keys', 'Open this URL in your browser: https://openrouter.ai/settings/keys'), false);
}
function removeKey() {
  try { localStorage.removeItem(KEY_STORE); localStorage.removeItem(CONSENT_STORE); }
  catch (_) {}
  renderSetup();
  setStatus(tr('کلید حذف شد.', 'API key removed.'), false);
}
function toolResultText(value) {
  try { return JSON.stringify(value); } catch (_) { return '{"error":"Tool result could not be serialized."}'; }
}
async function callModel(messages) {
  const key = localStorage.getItem(KEY_STORE);
  if (!key) throw new Error(tr('ابتدا کلید OpenRouter را تنظیم کن.', 'Set up your OpenRouter API key first.'));
  if (localStorage.getItem(CONSENT_STORE) !== 'yes') throw new Error(tr('برای استفاده از مدل ابری باید اطلاعیه حریم خصوصی را تأیید کنی.', 'Acknowledge the cloud data-sharing notice first.'));
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = controller ? setTimeout(function () { controller.abort(); }, 45000) : null;
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/RM007-UI/Rooyesh-Study-Record-MLKit',
        'X-Title': 'Rooyesh Study Assistant'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        parallel_tool_calls: false,
        temperature: 0.25,
        max_tokens: 1400
      }),
      signal: controller ? controller.signal : undefined
    });
  } catch (error) {
    if (error && error.name === 'AbortError') throw new Error(tr('پاسخ مدل بیش از حد طول کشید. دوباره تلاش کن.', 'The model took too long. Please try again.'));
    throw new Error(tr('ارتباط با مدل برقرار نشد. اینترنت، محدودیت سرویس یا اتصال WebView را بررسی کن.', 'Could not reach the model. Check internet, provider limits, or WebView connectivity.'));
  } finally { if (timeout) clearTimeout(timeout); }
  const text = await response.text();
  const data = safeParse(text, null);
  if (!response.ok) {
    const message = data && data.error && (data.error.message || data.error.code);
    if (response.status === 401 || response.status === 403) throw new Error(tr('کلید رد شد یا اجازه دسترسی ندارد. کلید را در OpenRouter بررسی کن.', 'The API key was rejected or lacks access. Check it in OpenRouter.'));
    if (response.status === 429) throw new Error(tr('سهمیه رایگان موقتاً تمام شده یا درخواست‌ها زیاد شده‌اند. کمی بعد دوباره امتحان کن.', 'The free route is temporarily rate-limited. Try again later.'));
    throw new Error((message ? String(message).slice(0, 300) + ' — ' : '') + 'HTTP ' + response.status);
  }
  const choice = data && data.choices && data.choices[0];
  if (!choice || !choice.message) throw new Error(tr('مدل پاسخ قابل خواندن نداد؛ دوباره تلاش کن.', 'The model returned no readable message. Try again.'));
  return choice.message;
}
async function handleToolCalls(messages, assistantMessage) {
  const calls = assistantMessage.tool_calls || [];
  messages.push(assistantMessage);
  for (const call of calls) {
    let args = {};
    try { args = JSON.parse(call.function && call.function.arguments || '{}'); }
    catch (_) { args = {}; }
    let result;
    try { result = executeReadTool(call.function.name, args); }
    catch (error) { result = { error: String(error && error.message || error).slice(0, 250) }; }
    messages.push({ role: 'tool', tool_call_id: call.id, name: call.function.name, content: toolResultText(result) });
  }
}
async function sendMessage(text) {
  if (busy || !String(text || '').trim()) return;
  const userText = String(text).trim().slice(0, 2500);
  if (!localStorage.getItem(KEY_STORE) || localStorage.getItem(CONSENT_STORE) !== 'yes') {
    setStatus(tr('برای ارسال پیام، اول مدل رایگان را تنظیم کن.', 'Set up the free model before sending messages.'), true);
    renderSetup();
    return;
  }
  busy = true;
  conversationId++;
  const currentId = conversationId;
  $('raSend').disabled = true;
  $('raInput').disabled = true;
  history.push({ role: 'user', content: userText });
  renderConversation();
  $('raMessages').insertAdjacentHTML('beforeend', '<div class="ra-busy" id="raBusy">' + esc(tr('رویش داره فکر می‌کنه…', 'Rooyesh is thinking…')) + '</div>');
  try {
    const messages = [{ role: 'system', content: systemPrompt }].concat(history.slice(-12).map(function (m) { return { role: m.role, content: m.content }; }));
    let finalMessage = null;
    for (let loop = 0; loop < 5; loop++) {
      const modelMessage = await callModel(messages);
      if (modelMessage.tool_calls && modelMessage.tool_calls.length) {
        await handleToolCalls(messages, modelMessage);
        continue;
      }
      finalMessage = String(modelMessage.content || '').trim();
      break;
    }
    if (!finalMessage) finalMessage = tr('به سقف تعداد گام‌های ابزار رسیدم. سؤال را کمی محدودتر کن و دوباره بپرس.', 'I reached the tool-step limit. Narrow the request and try again.');
    if (currentId !== conversationId) return;
    history.push({ role: 'assistant', content: finalMessage });
    if (history.length > 24) history = history.slice(-24);
    renderConversation();
  } catch (error) {
    if (currentId !== conversationId) return;
    const message = String(error && error.message || error);
    history.push({ role: 'assistant', content: tr('مشکلی پیش اومد: ', 'Something went wrong: ') + message });
    renderConversation();
    setStatus(message, true);
  } finally {
    if (currentId === conversationId) {
      busy = false;
      $('raSend').disabled = false;
      $('raInput').disabled = false;
      $('raInput').focus();
      const wait = $('raBusy'); if (wait) wait.remove();
    }
  }
}
function handleApproval(actionId, approve) {
  const action = pendingActions.find(function (a) { return a.id === actionId; });
  if (!action || action.status !== 'pending') return;
  if (!approve) {
    action.status = 'rejected';
    action.message = tr('تغییری در داده‌های برنامه ایجاد نشد.', 'No app data was changed.');
    renderConversation();
    return;
  }
  try {
    const result = runAction(action);
    if (!result || result.ok === false) throw new Error(result && result.message || 'Action failed.');
    action.status = 'success';
    action.message = tr('تغییر با تأیید تو انجام شد.', 'Applied with your confirmation.');
    renderConversation();
  } catch (error) {
    action.status = 'error';
    action.message = String(error && error.message || error);
    renderConversation();
  }
}
function handleClick(event) {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.hasAttribute('data-ra-open')) { openPage(); return; }
  if (target.hasAttribute('data-ra-home')) { goHome(); return; }
  if (target.hasAttribute('data-ra-save-key')) { saveKey(); return; }
  if (target.hasAttribute('data-ra-key-help')) { keyHelp(); return; }
  if (target.hasAttribute('data-ra-clear-key')) { removeKey(); return; }
  if (target.hasAttribute('data-ra-reveal')) {
    const input = $('raKeyInput'); if (input) input.type = input.type === 'password' ? 'text' : 'password';
    target.textContent = input && input.type === 'text' ? tr('پنهان', 'Hide') : tr('نمایش', 'Show'); return;
  }
  if (target.hasAttribute('data-ra-prompt')) {
    $('raInput').value = target.getAttribute('data-ra-prompt');
    if (!localStorage.getItem(KEY_STORE) || localStorage.getItem(CONSENT_STORE) !== 'yes') { openPage(); setStatus(tr('کلید و تأیید اطلاعیه را ثبت کن؛ پیام هنوز ارسال نشده.', 'Save a key and accept the notice; the message has not been sent.'), false); return; }
    sendMessage($('raInput').value); $('raInput').value = ''; return;
  }
  if (target.hasAttribute('data-ra-approve')) { handleApproval(target.getAttribute('data-ra-approve'), true); return; }
  if (target.hasAttribute('data-ra-reject')) { handleApproval(target.getAttribute('data-ra-reject'), false); return; }
}
function handleSubmit(event) {
  if (event.target.id !== 'raComposer') return;
  event.preventDefault();
  if (busy) return;
  const input = $('raInput');
  const value = String(input.value || '').trim();
  if (!value) return;
  if (!localStorage.getItem(KEY_STORE) || localStorage.getItem(CONSENT_STORE) !== 'yes') {
    renderSetup();
    setStatus(tr('اول کلید API و رضایت ارسال داده را ثبت کن؛ متن پیام باقی مانده و هنوز ارسال نشده است.', 'Set up your API key and consent first; your message remains here and has not been sent.'), false);
    return;
  }
  input.value = '';
  sendMessage(value);
}
function init() {
  if (!ensureUI()) return;
  document.addEventListener('click', handleClick);
  $('raComposer').addEventListener('submit', handleSubmit);
  $('raInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('raComposer').requestSubmit ? $('raComposer').requestSubmit() : $('raSend').click(); }
  });
  renderSetup();
  renderConversation();
  const observer = new MutationObserver(function () {
    const lang = document.documentElement.lang || 'fa';
    if (lang !== lastLanguage) { lastLanguage = lang; renderSetup(); renderConversation(); }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();