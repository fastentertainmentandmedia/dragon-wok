// ============================================================
// [FILE: core/js/analytics.js]
// Обёртка над Яндекс.Метрикой и GoatCounter.
// Отправляет события в оба счётчика независимо.
// Автоматически добавляет название игры (document.title).
// Client (?ref=) устанавливается как параметр визита Метрики.
// Экспортирует: trackGoal, getClient, setCounterId, setClient
// ============================================================

// ID счётчика Метрики. Устанавливается извне через setCounterId().
// Дефолта нет.
let COUNTER_ID = null;

// Client (?ref=) — параметр визита Метрики.
let CLIENT = null;
let clientApplied = false;

const ymQueue = [];
const gcQueue = [];

let ymReady = false;
let gcReady = false;


// Раз в 500 мс проверяем готовность счётчиков
const checkInterval = setInterval(() => {
  if (!ymReady && typeof window.ym === 'function') {
    ymReady = true;
    applyClientToYm();
    flushYmQueue();
  }
  if (!gcReady && window.goatcounter && typeof window.goatcounter.count === 'function') {
    gcReady = true;
    flushGcQueue();
  }
  if (ymReady && gcReady) clearInterval(checkInterval);
}, 500);


// ============================================================
// [BLOCK: setCounterId]
// ============================================================

export function setCounterId(id) {
  const num = Number(id);
  if (Number.isFinite(num) && num > 0) {
    COUNTER_ID = num;
  }
}


// ============================================================
// [BLOCK: setClient]
// Устанавливает client как параметр визита Метрики.
// ============================================================

export function setClient(client) {
  if (!client || client === 'direct') return;
  CLIENT = client;
  if (ymReady) applyClientToYm();
}

function applyClientToYm() {
  if (clientApplied) return;
  if (!COUNTER_ID || !CLIENT) return;
  if (typeof window.ym !== 'function') return;

  try {
    window.ym(COUNTER_ID, 'params', { client: CLIENT });
    clientApplied = true;
  } catch (e) {}
}


// ============================================================
// [BLOCK: game-id]
// ============================================================

function getGameTitle() {
  return (document.title || 'unknown').trim();
}

function getGameSlug() {
  return getGameTitle()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'unknown';
}


// ============================================================
// [BLOCK: senders]
// ============================================================

function sendToYm(goal, params) {
  if (!COUNTER_ID) return;

  applyClientToYm();

  try {
    window.ym(COUNTER_ID, 'reachGoal', goal, {
      game: getGameTitle(),
      ...params,
    });
  } catch (e) {}
}

function sendToGoatCounter(goal, params) {
  try {
    const parts = [getGameSlug(), goal];
    if (params?.score !== undefined) parts.push('score-' + params.score);
    if (params?.win !== undefined) parts.push('win-' + params.win);
    if (params?.type) parts.push('type-' + params.type);
    if (params?.number !== undefined) parts.push('num-' + params.number);

    window.goatcounter.count({
      path: parts.join('_'),
      title: goal,
      event: true,
    });
  } catch (e) {}
}

function flushYmQueue() {
  for (const [goal, params] of ymQueue) sendToYm(goal, params);
  ymQueue.length = 0;
}

function flushGcQueue() {
  for (const [goal, params] of gcQueue) sendToGoatCounter(goal, params);
  gcQueue.length = 0;
}


// ============================================================
// [BLOCK: trackGoal]
// ============================================================

export function trackGoal(goal, params) {
  if (ymReady) sendToYm(goal, params);
  else ymQueue.push([goal, params]);

  if (gcReady) sendToGoatCounter(goal, params);
  else gcQueue.push([goal, params]);
}


// ============================================================
// [BLOCK: getClient]
// Читает ?ref= (приоритет) или ?client=.
// ============================================================

export function getClient() {
  try {
    const params = new URLSearchParams(location.search);
    const client = params.get('ref') || params.get('client');
    if (!client) return 'direct';
    return client.slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, '');
  } catch (e) {
    return 'direct';
  }
}