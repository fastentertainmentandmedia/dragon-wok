// ============================================================
// [FILE: core/js/controls/dpad.js]
// ============================================================

export function createDpad(root, callbacks) {

  const onDirection = callbacks.onDirection;
  const onAnyPress  = callbacks.onAnyPress ?? (() => {});

  const buttons = root.querySelectorAll('.dpad-btn');

  let enabled = false;

  const listeners = [];


  function handlePress(btn) {
    if (!enabled) return;

    const dir = btn.dataset.dir;
    if (!dir) return;

    btn.classList.add('pressed');
    onAnyPress(dir);
    onDirection(dir);
  }


  function handleRelease(btn) {
    btn.classList.remove('pressed');
  }


  function bindButton(btn) {

    if (window.PointerEvent) {

      const onDown = e => {
        e.preventDefault();
        e.stopPropagation();
        handlePress(btn);
      };
      const onUp = e => {
        e.preventDefault();
        handleRelease(btn);
      };
      const onCancel = () => handleRelease(btn);

      btn.addEventListener('pointerdown', onDown);
      btn.addEventListener('pointerup', onUp);
      btn.addEventListener('pointercancel', onCancel);
      btn.addEventListener('pointerleave', onCancel);

      listeners.push(
        () => btn.removeEventListener('pointerdown', onDown),
        () => btn.removeEventListener('pointerup', onUp),
        () => btn.removeEventListener('pointercancel', onCancel),
        () => btn.removeEventListener('pointerleave', onCancel),
      );

      return;
    }

    const onTouchStart = e => {
      e.preventDefault();
      handlePress(btn);
    };
    const onTouchEnd = e => {
      e.preventDefault();
      handleRelease(btn);
    };
    const onMouseDown = e => {
      e.preventDefault();
      handlePress(btn);
    };
    const onMouseUp = () => handleRelease(btn);

    btn.addEventListener('touchstart', onTouchStart, { passive: false });
    btn.addEventListener('touchend',   onTouchEnd,   { passive: false });
    btn.addEventListener('touchcancel', onTouchEnd,  { passive: false });
    btn.addEventListener('mousedown',  onMouseDown);
    btn.addEventListener('mouseup',    onMouseUp);
    btn.addEventListener('mouseleave', onMouseUp);

    listeners.push(
      () => btn.removeEventListener('touchstart', onTouchStart),
      () => btn.removeEventListener('touchend', onTouchEnd),
      () => btn.removeEventListener('touchcancel', onTouchEnd),
      () => btn.removeEventListener('mousedown', onMouseDown),
      () => btn.removeEventListener('mouseup', onMouseUp),
      () => btn.removeEventListener('mouseleave', onMouseUp),
    );
  }


  buttons.forEach(bindButton);


  function preventContextMenu(e) {
    e.preventDefault();
  }
  root.addEventListener('contextmenu', preventContextMenu);
  listeners.push(() => root.removeEventListener('contextmenu', preventContextMenu));


  return {
    enable()  { enabled = true; },
    disable() { enabled = false; },
    isEnabled: () => enabled,

    destroy() {
      listeners.forEach(off => off());
      listeners.length = 0;
    },
  };
}