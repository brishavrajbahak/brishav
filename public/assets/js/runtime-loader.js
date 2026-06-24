(() => {
  const mobile = document.documentElement.classList.contains('mobile-mode');

  const revealPage = () => {
    document.getElementById('loading-screen')?.classList.add('hidden');
    document.body.classList.add('page-loaded');
    document.getElementById('home')?.classList.add('hero-revealed');
  };

  const loadScript = source => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

  if (mobile) {
    revealPage();
    loadScript('assets/js/mobile-core.js?v=6').catch(error => {
      console.error('Mobile core failed to load.', error);
      revealPage();
    });
    return;
  }

  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap';
  fonts.crossOrigin = 'anonymous';
  document.head.appendChild(fonts);

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
  document.head.appendChild(stylesheet);

  loadScript('assets/js/main.js?v=5').catch(error => {
    console.error('Desktop runtime failed to load.', error);
    revealPage();
  });

  loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js')
    .then(() => window.hljs?.highlightAll())
    .catch(error => {
      console.error('Highlight.js failed to load.', error);
    });
})();
