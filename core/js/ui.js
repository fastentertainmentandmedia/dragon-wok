// ============================================================
// [FILE: core/js/ui.js]
// ============================================================

import { state } from './state.js';
import { $ } from './dom.js';
import { getBestScore, getRemainingMs } from './player-limits.js';


export function createUI() {

  let timerInterval = null;


  function render() {
    $.score.textContent     = ' ' + state.score;
    $.bestScore.textContent = ' ' + state.bestScore;

    if ($.limitBestScore) {
      $.limitBestScore.textContent = getBestScore();
    }

    document.body.dataset.hint =
      state.hintVisible ? state.hintKind : 'none';

    if ($.pauseButton) {
      let label = 'Играть';
      let visible = state.gameUnlocked && !state.limitReached;

      if (state.gameActive && !state.gameOver) {
        // Игра идёт: Пауза или Возобновить
        label = state.paused ? 'Продолжить' : 'Пауза';
      } else {
        // Игра не активна: Играть (стартовый экран или после проигрыша)
        label = 'Играть';
      }

      $.pauseButton.textContent = label;
      $.pauseButton.classList.toggle('hidden', !visible);
    }
  }


  function updateTimer() {
    const ms = getRemainingMs();
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;

    $.timeLeft.textContent =
      `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

    $.timerBox.classList.remove('warning', 'danger');
    if (ms <= 30000) {
      $.timerBox.classList.add('danger');
    } else if (ms <= 60000) {
      $.timerBox.classList.add('warning');
    }
  }


  function startTimer(onTick) {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      onTick();
      updateTimer();
    }, 1000);
    updateTimer();
  }


  return {
    render,
    updateTimer,
    startTimer,
  };
}