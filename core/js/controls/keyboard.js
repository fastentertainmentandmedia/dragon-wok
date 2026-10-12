// ============================================================
// [FILE: core/js/controls/keyboard.js]
// ============================================================

const ARROW_TO_DIR = {
  ArrowUp:    'UP',
  ArrowDown:  'DOWN',
  ArrowLeft:  'LEFT',
  ArrowRight: 'RIGHT',
};

const ACTION_KEYS = new Set([
  ' ',
  'Enter',
  'r',
  'R',
  'к',
  'К',
]);


export function createKeyboard(callbacks) {

  const onDirection = callbacks.onDirection;
  const onAction    = callbacks.onAction;

  let enabled = false;


  function handleKeydown(e) {

    const key = e.key;

    if (key.startsWith('Arrow') || key === ' ') {
      e.preventDefault();
    }

    if (!enabled) return;

    if (ACTION_KEYS.has(key)) {
      if (key === 'Enter' || key === 'r' || key === 'R') {
        e.preventDefault();
      }
      onAction();
      return;
    }

    const dir = ARROW_TO_DIR[key];
    if (dir) {
      onDirection(dir);
    }
  }


  window.addEventListener('keydown', handleKeydown);


  return {
    enable()  { enabled = true; },
    disable() { enabled = false; },
    isEnabled: () => enabled,

    destroy() {
      window.removeEventListener('keydown', handleKeydown);
    },
  };
}