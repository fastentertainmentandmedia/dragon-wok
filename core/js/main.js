// ============================================================
// [FILE: core/js/main.js]
// Точка входа. Собирает core + game.
// ============================================================

import {
  initPlayer,
  isLimitReached,
  flushSession,
  getBestScore,
  updateBestScore,
  isReturning,
} from './player-limits.js';

import { trackGoal, getClient, setCounterId, setClient } from './analytics.js';

import { state, updateState, resetGameState } from './state.js';
import { $ } from './dom.js';
import { createUI }         from './ui.js';
import { createLoop }       from './loop.js';
import { createResize }     from './resize.js';
import { createLifecycle }  from './lifecycle.js';
import { createIntro }      from './intro.js';
import { createDpad }       from './controls/dpad.js';
import { createKeyboard }   from './controls/keyboard.js';
import { createSwipe }      from './controls/swipe.js';

import { config }         from '../../game/js/config.js';
import { createRules }    from '../../game/js/rules.js';
import { createRenderer } from '../../game/js/render.js';


// ============================================================
// [BLOCK: disable-double-tap-zoom]
// ============================================================

let lastTouchEnd = 0;

document.addEventListener('touchend', (event) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });


// ============================================================
// [BLOCK: preloader]
// ============================================================

function hidePreloader() {
  document.documentElement.classList.add('ready');
}


// ============================================================
// [BLOCK: analytics-config]
// Загружаем внешний config.json ДО инициализации счётчиков.
// ============================================================

async function loadAnalyticsConfig() {
  try {
    const res = await fetch('./config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('config.json not found');
    const json = await res.json();

    return {
      yandexMetrikaId: Number(json.yandexMetrikaId) || null,
      goatcounterUrl: json.goatcounterUrl ? String(json.goatcounterUrl) : null,
    };
  } catch (e) {
    console.warn('[analytics-config] config.json not loaded:', e.message);
    return {
      yandexMetrikaId: null,
      goatcounterUrl: null,
    };
  }
}


// ============================================================
// [BLOCK: goatcounter]
// ============================================================

function loadGoatCounter(goatcounterUrl) {
  if (!goatcounterUrl) return;

  window.goatcounter = {
    allow_local: true,
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = 'game/assets/goatcounter/count.js';
  script.setAttribute('data-goatcounter', goatcounterUrl);
  script.setAttribute('data-goatcounter-settings', '{"allow_local": true}');

  document.head.appendChild(script);
}


// ============================================================
// [BLOCK: metrika]
// ============================================================

function loadMetrika(metrikaId) {
  if (!metrikaId) return;

  let loaded = false;

  function init() {
    if (loaded) return;
    loaded = true;

    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) { return; }
      }
      k=e.createElement(t), a=e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + metrikaId;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + metrikaId, 'ym');

    window.ym(metrikaId, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });
  }

  const onInteraction = () => {
    document.removeEventListener('pointerdown', onInteraction);
    document.removeEventListener('keydown', onInteraction);
    setTimeout(init, 500);
  };
  document.addEventListener('pointerdown', onInteraction, { once: true });
  document.addEventListener('keydown', onInteraction, { once: true });

  window.addEventListener('load', () => {
    setTimeout(init, 5000);
  }, { once: true });
}


// ============================================================
// [BLOCK: session-counter]
// ============================================================

let gamesThisSession = 0;


// ============================================================
// [BLOCK: init]
// ============================================================

async function init() {
  // 1. Загружаем конфиг аналитики
  const analyticsConfig = await loadAnalyticsConfig();

  // 2. Устанавливаем ID Метрики и client
  setCounterId(analyticsConfig.yandexMetrikaId);

  const client = getClient();
  setClient(client);

  // 3. Запускаем счётчики
  loadGoatCounter(analyticsConfig.goatcounterUrl);
  loadMetrika(analyticsConfig.yandexMetrikaId);

  // 4. Дальше — обычная инициализация игры
  initPlayer();

  state.bestScore = getBestScore();

  const isReturningPlayer = isReturning();

  trackGoal('game_loaded', {
    type: isReturningPlayer ? 'returning' : 'new',
    client: client,
  });

  const ui = createUI();
  const rules = createRules();
  const renderer = createRenderer($.canvas, {
    onImageReady: () => game.render(),
  });

  const game = createLoop({
    rules,
    renderer,
    config,
    callbacks: {
      onScore: score => updateState({ score }, ui),

      onStart: () => {
        gamesThisSession++;

        trackGoal('game_start', {
          number: gamesThisSession,
        });

        updateState({
          gameStarted: true,
          gameActive: true,
          gameOver: false,
          hintVisible: false,
        }, ui);
      },

      onGameOver: ({ win, score }) => {
        const isNewRecord = updateBestScore(score);

        trackGoal('game_over', {
          score,
          win: win ? 1 : 0,
          number: gamesThisSession,
        });

        updateState({
          gameActive: false,
          gameStarted: true,
          gameOver: true,
          win,
          ...(isNewRecord ? { bestScore: score } : {}),
        }, ui);
      },

      onLimit: ({ score = 0 } = {}) => {
        const isNewRecord = score > 0 && updateBestScore(score);

        trackGoal('daily_limit_reached', {
          score,
          number: gamesThisSession,
        });

        updateState({
          limitReached: true,
          hintVisible: true,
          hintKind: 'limit',
          ...(isNewRecord ? { bestScore: score } : {}),
        }, ui);
      },
    },
  });


  createResize({
    canvas: $.canvas,
    onResize: (w, h) => {
      renderer.resize(w, h, config.GRID_SIZE);
      game.render();
    },
  });


  function handleDirection(dir) {
    if (!state.gameUnlocked) return;
    if (state.limitReached) return;
    if (!state.gameStarted || state.gameOver) return;

    game.setDirection(dir);
  }

  function handleAction() {
    // Space / Enter / R больше не запускают игру.
  }

  function handleTap() {
    if (!state.gameUnlocked) return;
    if (state.limitReached) {
      updateState({ hintVisible: true, hintKind: 'limit' }, ui);
      return;
    }
    if (!state.gameStarted || state.gameOver) {
      if (state.gameActive) flushSession();
      resetGameState();
      state.paused = false;
      ui.render();
      game.init();
    }
  }


  const dpad = createDpad(document.body, {
    onDirection: handleDirection,
  });

  const keyboard = createKeyboard({
    onDirection: handleDirection,
    onAction:    handleAction,
  });

  const swipe = createSwipe($.canvas, {
    onDirection: dir => {
      if (!state.gameUnlocked) return;
      if (state.limitReached) return;
      if (!state.gameStarted || state.gameOver) return;
      game.setDirection(dir);
    },
    onTap: handleTap,
  });


  $.canvas.addEventListener('click', e => {
    e.preventDefault();
    handleTap();
  });


  $.pauseButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!state.gameUnlocked) return;
    if (state.limitReached) return;

    if (!state.gameActive || state.gameOver) {
      if (state.gameActive) flushSession();
      resetGameState();
      ui.render();
      game.init();
      return;
    }

    if (game.isPaused()) {
      game.resume();
      updateState({ paused: false }, ui);
    } else {
      game.pause();
      updateState({ paused: true }, ui);
    }
  });


  function unlockGame() {
    if (state.gameUnlocked) return;

    updateState({
      gameUnlocked: true,
      cookiesAccepted: true,
    }, ui);

    dpad.enable();
    keyboard.enable();
    swipe.enable();

    if (isLimitReached()) {
      updateState({
        limitReached: true,
        hintVisible: true,
        hintKind: 'limit',
      }, ui);
    } else {
      game.showPreview();
      updateState({
        hintVisible: true,
        hintKind: 'start',
        gameStarted: false,
        gameActive: false,
        gameOver: false,
      }, ui);
    }

    ui.startTimer(() => game.tickSession());
    ui.updateTimer();
  }


  const intro = createIntro({
    onAccept: unlockGame,
  });

  hidePreloader();

  intro.init();


  createLifecycle({
    isActive: () => state.gameActive,
    onFlush: flushSession,
    onHide: () => {
      game.flushSession();
      game.render();
    },
  });


  setInterval(() => {
    if (!state.gameUnlocked) return;

    if (!state.gameActive && !state.gameStarted && isLimitReached()) {
      updateState({
        limitReached: true,
        hintVisible: true,
        hintKind: 'limit',
      }, ui);
    }
    ui.updateTimer();
  }, 30000);


  $.canvas.addEventListener('contextmenu', e => e.preventDefault());


  (function debugResetLimit() {
    const isDev =
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      location.protocol === 'file:';

    if (!isDev) return;

    const params = new URLSearchParams(location.search);
    if (params.get('resetLimit') === '1') {
      try { localStorage.removeItem(config.STORAGE_KEY); } catch (e) {}

      params.delete('resetLimit');
      const newUrl = location.pathname + (params.toString() ? '?' + params : '');
      history.replaceState({}, '', newUrl);

      console.log('limit dropped',
        'color:#ff6b1a;font-weight:bold;font-size:14px');

      location.reload();
    }
  })();
}


// ============================================================
// Запуск
// ============================================================

init();