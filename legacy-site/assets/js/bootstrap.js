(() => {
  const breakpoint = 768;
  const root = document.documentElement;
  const viewportWidth = window.visualViewport?.width || window.innerWidth || screen.width;
  const initialMobile = viewportWidth <= breakpoint;

  root.classList.add(initialMobile ? 'mobile-mode' : 'desktop-mode');
  root.dataset.viewportMode = initialMobile ? 'mobile' : 'desktop';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('reduced-motion');
  }

  let resizeTimer;
  window.addEventListener(
    'resize',
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const currentWidth = window.visualViewport?.width || window.innerWidth || screen.width;
        if ((currentWidth <= breakpoint) !== initialMobile) {
          window.location.reload();
        }
      }, 300);
    },
    { passive: true },
  );
})();
