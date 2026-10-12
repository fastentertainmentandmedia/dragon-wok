// ============================================================
// [FILE: core/js/controls/swipe.js]
// ============================================================

const MIN_SWIPE_DISTANCE = 20;


export function createSwipe(target, callbacks) {

  const onDirection = callbacks.onDirection;
  const onTap       = callbacks.onTap ?? (() => {});

  let enabled = false;

  let startX = 0;
  let startY = 0;
  let startTime = 0;


  function handleTouchStart(e) {
    e.preventDefault();

    if (!enabled) return;
    if (e.touches.length === 0) return;

    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startTime = Date.now();
  }


  function handleTouchEnd(e) {
    e.preventDefault();

    if (!enabled) return;
    if (e.changedTouches.length === 0) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const maxDelta = Math.max(absDx, absDy);

    if (maxDelta < MIN_SWIPE_DISTANCE) {
      onTap();
      return;
    }

    let dir;
    if (absDx > absDy) {
      dir = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      dir = dy > 0 ? 'DOWN' : 'UP';
    }

    onDirection(dir);
  }


  function handleTouchCancel(e) {
    e.preventDefault();
    startX = 0;
    startY = 0;
  }


  function handleTouchMove(e) {
    e.preventDefault();
  }


  target.addEventListener('touchstart',  handleTouchStart,  { passive: false });
  target.addEventListener('touchend',    handleTouchEnd,    { passive: false });
  target.addEventListener('touchcancel', handleTouchCancel, { passive: false });
  target.addEventListener('touchmove',   handleTouchMove,   { passive: false });


  return {
    enable()  { enabled = true; },
    disable() { enabled = false; },
    isEnabled: () => enabled,

    destroy() {
      target.removeEventListener('touchstart',  handleTouchStart);
      target.removeEventListener('touchend',    handleTouchEnd);
      target.removeEventListener('touchcancel', handleTouchCancel);
      target.removeEventListener('touchmove',   handleTouchMove);
    },
  };
}