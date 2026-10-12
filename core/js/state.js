// ============================================================
// [FILE: core/js/state.js]
// ============================================================

export const state = {
  score: 0,
  bestScore: 0,
  gameActive: false,
  gameStarted: false,
  gameOver: false,
  win: false,
  limitReached: false,

  hintVisible: true,
  hintKind: 'start',

  gameUnlocked: false,
  cookiesAccepted: false,

  paused: false,
};


export function updateState(patch, ui) {
  Object.assign(state, patch);
  if (ui && typeof ui.render === 'function') {
    ui.render();
  }
}


export function resetGameState() {
  state.score = 0;
  state.gameActive = true;
  state.gameStarted = true;
  state.gameOver = false;
  state.win = false;
  state.limitReached = false;
  state.hintVisible = false;
  state.paused = false;
}