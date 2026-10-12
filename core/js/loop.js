// ============================================================
// [FILE: core/js/loop.js]
// Общий игровой цикл. Связывает rules + renderer + player-limits.
// Не знает о специфике конкретной игры.
// ============================================================

import {
  isLimitReached,
  startSession,
  endSession,
  tickSession,
} from './player-limits.js';


export function createLoop({ rules, renderer, config, callbacks }) {

  let interval = null;
  let active = false;
  let started = false;
  let over = false;
  let limitHit = false;

  let currentInterval = config.TICK_INTERVAL_MS;
  let paused = false;


  // ==========================================================
  // [BLOCK: speed]
  // ==========================================================
  function getInterval(score) {
    const raw = config.TICK_INTERVAL_MS - score * config.TICK_STEP_MS;
    return Math.max(config.TICK_MIN_MS, raw);
  }

  function restartInterval(score) {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    currentInterval = getInterval(score);
    interval = setInterval(tick, currentInterval);
  }


  function init() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }

    if (isLimitReached()) {
      callbacks.onLimit({ score: 0 });
      return;
    }

    rules.reset();

    over = false;
    active = true;
    started = true;
    limitHit = false;
    paused = false;

    callbacks.onScore(0);
    callbacks.onStart();

    renderer.render(rules.getState());

    startSession();
    restartInterval(0);
  }


  function pause() {
    if (!active || paused) return;
    paused = true;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    renderer.render({ ...rules.getState(), paused: true });
  }

  function resume() {
    if (!active || !paused) return;
    paused = false;
    interval = setInterval(tick, currentInterval);
    renderer.render({ ...rules.getState(), paused: false });
  }


  function isPaused() {
    return paused;
  }


  function tick() {
    if (!active || paused) return;

    if (isLimitReached()) {
      end('limit');
      return;
    }

    const result = rules.tick();

    if (result.event === 'gameover') {
      renderer.render(rules.getState());
      end('gameover', { win: result.win, score: result.score });
      return;
    }

    if (result.event === 'eat') {
      callbacks.onScore(result.score);
      restartInterval(result.score);
    }

    renderer.render(rules.getState());
  }


  function end(reason, payload) {
    if (!active && reason !== 'limit') return;

    active = false;
    over = true;
    paused = false;

    if (interval) {
      clearInterval(interval);
      interval = null;
    }

    // Сброс накопленной скорости на стартовую.
    // К моменту отрисовки game-over currentInterval уже сброшен.
    currentInterval = config.TICK_INTERVAL_MS;

    endSession();
    renderer.render(rules.getState());

    if (reason === 'limit') {
      limitHit = true;
      callbacks.onLimit({ score: rules.getScore() });
    } else {
      callbacks.onGameOver(payload);
    }
  }


  function setDirection(dir) {
    rules.setDirection(dir);
  }


  function render() {
    renderer.render(rules.getState());
  }


  function resize(w, h) {
    renderer.resize(w, h, config.GRID_SIZE);
    renderer.render(rules.getState());
  }


  function showPreview() {
    rules.showPreview();

    active = false;
    over = false;
    started = false;
    limitHit = false;
    paused = false;
    currentInterval = config.TICK_INTERVAL_MS;

    callbacks.onScore(0);
    renderer.render(rules.getState());
  }


  return {
    init,
    render,
    resize,
    showPreview,
    setDirection,
    pause,
    resume,
    isPaused,

    isActive:   () => active,
    isStarted:  () => started,
    isOver:     () => over,
    isLimitHit: () => limitHit,

    tickSession: () => {
      if (active && started && !limitHit && !paused) tickSession();
    },

    flushSession: () => {
      if (active) endSession();
    },
  };
}