// ============================================================
// [FILE: core/js/dom.js]
// ============================================================

export const $ = {
  canvas:      document.getElementById('gameCanvas'),
  container:   document.getElementById('canvasContainer'),

  bestScore:   document.getElementById('bestScore'),
  score:       document.getElementById('scoreDisplay'),

  timerBox:    document.getElementById('timerBox'),
  timeLeft:    document.getElementById('timeLeft'),

  startHint:   document.getElementById('startHint'),

  introModal:  document.getElementById('introModal'),
  introAccept: document.getElementById('introAccept'),

  dpad:        document.getElementById('dpad'),
  bottomRight: document.getElementById('bottomRight'),

  limitBestScore: document.getElementById('limitBestScore'),

  pauseButton: document.getElementById('pauseButton'),

  introLimitMinutes: document.getElementById('introLimitMinutes'),


};


if (typeof console !== 'undefined') {
  for (const [name, el] of Object.entries($)) {
    if (!el) {
      console.warn(`[dom.js] Элемент "${name}" не найден в DOM`);
    }
  }
}