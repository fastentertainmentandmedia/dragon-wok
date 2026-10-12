// ============================================================
// [FILE: core/js/player-limits.js]
// ============================================================

import { config, DEBUG_DISABLE_LIMIT } from '../../game/js/config.js';

const LIMIT_MS       = config.PLAY_LIMIT_MINUTES * 60 * 1000;
const RESET_WINDOW_MS = config.LIMIT_RESET_HOURS * 60 * 60 * 1000;

let player = null;
let sessionStart = null;
let lastTick = null;


function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function save() {
  if (!player) return;
  try {
    localStorage.setItem(config.STORAGE_KEY, JSON.stringify(player));
  } catch (e) {}
}


// ============================================================
// [BLOCK: reset-window]
// Проверяет, прошло ли RESET_WINDOW_MS с момента windowStart.
// Если да — обнуляет usedMs и ставит новое окно.
// ============================================================
function refreshWindow() {
  if (!player) return false;

  const now = Date.now();

  // Первый заход или старые данные без windowStart
  if (!player.windowStart) {
    player.windowStart = now;
    save();
    return false;
  }

  const elapsed = now - player.windowStart;

  if (elapsed >= RESET_WINDOW_MS) {
    // Прошло больше 4 часов — новый лимит
    player.usedMs = 0;
    player.windowStart = now;
    save();
    return true;
  }

  return false;
}


export function initPlayer() {
  let p = null;

  try {
    const raw = localStorage.getItem(config.STORAGE_KEY);
    if (raw) p = JSON.parse(raw);
  } catch (e) {}

  if (!p || typeof p !== 'object' || !p.id) {
    p = {
      id: uuidv4(),
      createdAt: Date.now(),
      usedMs: 0,
      windowStart: Date.now(),   // ← вместо lastDate
      totalGames: 0,
      totalPlayMs: 0,
      bestScore: 0,
    };
  }

  // Миграция: если в старых данных есть lastDate без windowStart —
  // конвертируем в windowStart = начало текущего дня
  if (!p.windowStart) {
    const d = p.lastDate ? new Date(p.lastDate) : new Date();
    p.windowStart = d.getTime();
  }

  // Миграция: если остался lastDate — удалим его, он больше не нужен
  if (p.lastDate) {
    delete p.lastDate;
  }

  if (typeof p.bestScore !== 'number') {
    p.bestScore = 0;
  }

  player = p;

  // Сброс, если прошло 4 часа
  refreshWindow();

  save();
  return p;
}


export function getRemainingMs() {
  if (DEBUG_DISABLE_LIMIT) return LIMIT_MS;
  if (!player) return LIMIT_MS;

  refreshWindow();

  return Math.max(0, LIMIT_MS - player.usedMs);
}

export function isLimitReached() {
  if (DEBUG_DISABLE_LIMIT) return false;
  return getRemainingMs() <= 0;
}


export function getBestScore() {
  if (!player) return 0;
  return player.bestScore || 0;
}

export function updateBestScore(score) {
  if (!player) return false;
  if (typeof score !== 'number' || score <= 0) return false;
  if (score <= (player.bestScore || 0)) return false;

  player.bestScore = score;
  save();
  return true;
}


// ============================================================
// [BLOCK: session]
// ============================================================

export function startSession() {
  if (!player) return;
  sessionStart = Date.now();
  lastTick = null;
  player.totalGames++;
  save();
}

export function endSession() {
  sessionStart = null;
  lastTick = null;
  save();
}

export function tickSession() {
  if (!player || !sessionStart) {
    lastTick = null;
    return;
  }

  const now = Date.now();

  if (lastTick !== null) {
    const delta = now - lastTick;
    if (delta > 0 && delta < 10000) {
      player.usedMs += delta;
      player.totalPlayMs += delta;
      save();
    }
  }

  lastTick = now;
}

export function flushSession() {
  if (sessionStart && player && lastTick) {
    const delta = Date.now() - lastTick;
    if (delta > 0 && delta < 2000) {
      player.usedMs += delta;
      player.totalPlayMs += delta;
    }
  }

  sessionStart = null;
  lastTick = null;
  save();
}


export function getPlayerStats() {
  if (!player) return null;
  return {
    id: player.id,
    usedMs: player.usedMs,
    remainingMs: getRemainingMs(),
    limitMs: LIMIT_MS,
    resetInMs: player.windowStart
      ? Math.max(0, RESET_WINDOW_MS - (Date.now() - player.windowStart))
      : RESET_WINDOW_MS,
    totalGames: player.totalGames,
    totalPlayMs: player.totalPlayMs,
    bestScore: player.bestScore,
  };
}

// ============================================================
// [BLOCK: returning-player]
// Проверяет, играл ли уже этот игрок.
// ============================================================

export function isReturning() {
  try {
    const key = config.STORAGE_KEY + '_intro_accepted';
    return localStorage.getItem(key) === '1';
  } catch (e) {
    return false;
  }
}