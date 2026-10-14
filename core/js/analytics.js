// ============================================================
// [FILE: core/js/analytics.js]
// Метрика: client передаётся в событиях через trackGoal.
// GoatCounter: ref читается автоматически из URL.
// ============================================================

const COUNTER_ID = 113332587;

const ymQueue = [];
const gcQueue = [];

let ymReady = false;
let gcReady = false;


const checkInterval = setInterval(() => {
  if (!ymReady && typeof window.ym === 'function') {
    ymReady = true;
    flushYmQueue();
  }
  if (!gcReady && window.goatcounter && typeof window.goatcounter.count === 'function') {
    gcReady = true;
    flushGcQueue();
  }
  if (ymReady && gcReady) clearInterval(checkInterval);
}, 500);


function sendToYm(goal, params) {
  try {
    window.ym(COUNTER_ID, 'reachGoal', goal, params);
  } catch (e) {}
}

function sendToGoatCounter(goal, params) {
  try {
    // ref GoatCounter читает из URL сам — здесь только параметры события.
    const parts = [goal];
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


export function trackGoal(goal, params) {
  if (ymReady) sendToYm(goal, params);
  else ymQueue.push([goal, params]);

  if (gcReady) sendToGoatCounter(goal, params);
  else gcQueue.push([goal, params]);
}


// ============================================================
// [BLOCK: getClient]
// Возвращает client из URL для передачи в Метрику.
// ============================================================

export function getClient() {
  try {
    const params = new URLSearchParams(location.search);
    const client = params.get('client') || params.get('ref');  // ← fallback
    if (!client) return 'direct';
    return client.slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, '');
  } catch (e) {
    return 'direct';
  }
}