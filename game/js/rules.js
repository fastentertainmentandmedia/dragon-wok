// ============================================================
// [FILE: game/js/rules.js]
// ============================================================

import { config } from './config.js';

const DIRS = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};


export function createRules() {

  const GRID = config.GRID_SIZE;

  let snake = [];
  let food = null;
  let currentDir = 'RIGHT';
  let nextDir = 'RIGHT';
  let score = 0;
  let over = false;
  let win = false;


  function reset() {
    snake = [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
    ];
    currentDir = 'RIGHT';
    nextDir = 'RIGHT';
    score = 0;
    over = false;
    win = false;

    generateFood();
    return getState();
  }


  function tick() {
    if (over) return { event: null };

    const cannotReverse =
      (currentDir === 'UP'    && nextDir === 'DOWN')  ||
      (currentDir === 'DOWN'  && nextDir === 'UP')    ||
      (currentDir === 'LEFT'  && nextDir === 'RIGHT') ||
      (currentDir === 'RIGHT' && nextDir === 'LEFT');
    if (!cannotReverse) currentDir = nextDir;

    const move = DIRS[currentDir];
    const head = snake[0];
    const newHead = {
      x: head.x + move.x,
      y: head.y + move.y,
    };

    if (newHead.x < 0 || newHead.x >= GRID ||
        newHead.y < 0 || newHead.y >= GRID) {
      over = true;
      return { event: 'gameover', win: false, score };
    }

    const willEat = (newHead.x === food.x && newHead.y === food.y);

    const bodyToCheck = willEat ? snake : snake.slice(0, -1);
    const selfCollision = bodyToCheck.some(
      s => s.x === newHead.x && s.y === newHead.y
    );
    if (selfCollision) {
      over = true;
      return { event: 'gameover', win: false, score };
    }

    snake.unshift(newHead);

    if (willEat) {
      score++;

      if (snake.length === GRID * GRID) {
        over = true;
        win = true;
        return { event: 'gameover', win: true, score };
      }

      generateFood();
      return { event: 'eat', score };
    } else {
      snake.pop();
    }

    return { event: null };
  }


  function setDirection(dir) {
    nextDir = dir;
  }


  function isOver() {
    return over;
  }


  function getScore() {
    return score;
  }


  function getState() {
    return { snake, food, score, over, win, dir: currentDir };
  }


  function generateFood() {
    const occupied = new Set(snake.map(c => `${c.x},${c.y}`));
    const free = [];

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (!occupied.has(`${x},${y}`)) free.push({ x, y });
      }
    }

    if (free.length === 0) return;

    food = free[Math.floor(Math.random() * free.length)];
  }


  function showPreview() {
    snake = [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
    ];
    food = { x: 9, y: 7 };
    currentDir = 'RIGHT';
    nextDir = 'RIGHT';
    score = 0;
    over = false;
    win = false;
    return getState();
  }


  return {
    reset,
    tick,
    setDirection,
    isOver,
    getScore,
    getState,
    showPreview,
  };
}