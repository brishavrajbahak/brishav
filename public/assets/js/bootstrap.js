(() => {
  const breakpoint = 768;
  const root = document.documentElement;
  const getViewportWidth = () => window.visualViewport?.width || window.innerWidth || screen.width;
  const initialMobile = getViewportWidth() <= breakpoint;

  root.classList.add(initialMobile ? 'mobile-mode' : 'desktop-mode');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('reduced-motion');
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if ((getViewportWidth() <= breakpoint) !== initialMobile) {
        window.location.reload();
      }
    }, 300);
  }, { passive: true });
})();
