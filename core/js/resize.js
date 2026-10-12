// ============================================================
// [FILE: core/js/resize.js]
// Синхронизация внутренних размеров canvas с CSS-размером.
// ResizeObserver + requestAnimationFrame для батчинга.
// ============================================================

export function createResize({ canvas, onResize }) {

  let raf = null;
  let observer = null;


  function sync() {
    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    if (w <= 0 || h <= 0) return;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
      onResize(w, h);
    }
  }


  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      sync();
    });
  }


  observer = new ResizeObserver(schedule);
  observer.observe(canvas.parentElement);

  sync();
  requestAnimationFrame(sync);
  setTimeout(sync, 100);


  return {
    sync,
    destroy() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    },
  };
}