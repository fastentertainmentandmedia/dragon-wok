// ============================================================
// [FILE: core/js/analytics.js]
// Обёртка над Яндекс.Метрикой. Буферизует события, пока
// счётчик не загружен, потом отправляет.
// Экспортирует: trackGoal, trackPageview
// ============================================================

const COUNTER_ID = 113332587;

// Очередь событий до загрузки Метрики
const queue = [];
let ready = false;


// Раз в 500 мс проверяем, готов ли window.ym.
// Как только готов — отправляем всё, что накопилось.
const checkInterval = setInterval(() => {
  if (typeof window.ym === 'function') {
    ready = true;
    clearInterval(checkInterval);

    for (const [goal, params] of queue) {
      try {
        window.ym(COUNTER_ID, 'reachGoal', goal, params);
      } catch (e) {}
    }
    queue.length = 0;
  }
}, 500);


export function trackGoal(goal, params) {
  if (ready && typeof window.ym === 'function') {
    try {
      window.ym(COUNTER_ID, 'reachGoal', goal, params);
    } catch (e) {}
  } else {
    queue.push([goal, params]);
  }
}

// ============================================================
// [BLOCK: client]
// Извлекает параметр client из URL (?client=xxx).
// Возвращает 'direct', если параметра нет.
// ============================================================

export function getClient() {
  try {
    const params = new URLSearchParams(location.search);
    const client = params.get('client');
    if (!client) return 'direct';
    return client.slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, '');
  } catch (e) {
    return 'direct';
  }
}