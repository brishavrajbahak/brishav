(async () => {
  const root = document.documentElement;
  const mobile = root.classList.contains('mobile-mode');

  installScrollLock();
  installContactNavGuard();
  wireProfileImageFallback();

  if (mobile) {
    revealMobilePage();
    await loadScript('assets/js/mobile-core.js?v=6').catch(error => {
      console.error('Mobile core failed to load.', error);
      revealMobilePage();
    });
    await loadScript('assets/js/build-meta.js?v=1').catch(() => {});
    await loadScript('assets/js/mobile-advanced.js?v=1').catch(error => {
      console.error('Mobile advanced bundle failed to load.', error);
    });
    return;
  }

  loadStylesheet(
    'https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap',
    { crossOrigin: 'anonymous' },
  );

  await loadScript('assets/js/main.js?v=5');
  await loadScript('assets/js/build-meta.js?v=1').catch(() => {});
  await loadScript('assets/js/advanced.js?v=1').catch(error => {
    console.error('Advanced desktop bundle failed to load.', error);
  });

  lazyLoadHighlight();
})();

function installScrollLock() {
  if (window.__scrollLock) return;

  const owners = new Set();
  let lockedY = 0;

  window.__scrollLock = {
    lock(owner = 'default') {
      owners.add(owner);
      if (owners.size > 1) return;

      lockedY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.classList.add('scroll-locked');
      document.body.classList.add('scroll-locked');
      document.body.style.top = `-${lockedY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    },
    unlock(owner = 'default') {
      const hadOwner = owner === '__force__' ? owners.size > 0 : owners.delete(owner);
      if (!hadOwner) return;
      if (owners.size) return;
      if (
        !document.documentElement.classList.contains('scroll-locked') &&
        !document.body.classList.contains('scroll-locked')
      ) {
        return;
      }

      document.documentElement.classList.remove('scroll-locked');
      document.body.classList.remove('scroll-locked');
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, lockedY);
    },
    clear() {
      this.unlock('__force__');
    },
  };
}

function revealMobilePage() {
  document.getElementById('loading-screen')?.classList.add('hidden');
  document.body.classList.add('page-loaded');
  document.getElementById('home')?.classList.add('hero-revealed');
}

function wireProfileImageFallback() {
  const image = document.querySelector('.profile-img-wrap img');
  const fallback = document.querySelector('.profile-img-fallback');
  if (!image || !fallback) return;

  image.addEventListener(
    'error',
    () => {
      image.style.display = 'none';
      fallback.style.display = 'flex';
    },
    { once: true },
  );
}

function installContactNavGuard() {
  const bottomNav = document.getElementById('mobileBottomNav');
  const contactSection = document.getElementById('contact');
  const contactForm = document.getElementById('contactForm');
  if (!bottomNav || !contactSection) return;

  let contactInView = false;
  let formActive = false;

  const syncState = () => {
    const shouldHide = contactInView || formActive;
    bottomNav.classList.toggle('is-hidden-for-contact', shouldHide);
    bottomNav.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        contactInView = entries.some(entry => entry.isIntersecting);
        syncState();
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -12% 0px',
      },
    );
    observer.observe(contactSection);
  } else {
    const updateFromScroll = () => {
      const rect = contactSection.getBoundingClientRect();
      contactInView = rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.18;
      syncState();
    };
    updateFromScroll();
    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll);
  }

  if (contactForm) {
    contactForm.addEventListener('focusin', () => {
      formActive = true;
      syncState();
    });

    contactForm.addEventListener('focusout', () => {
      window.setTimeout(() => {
        formActive = contactForm.contains(document.activeElement);
        syncState();
      }, 0);
    });
  }

  syncState();
}

function loadScript(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function loadStylesheet(href, options = {}) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  if (options.crossOrigin) link.crossOrigin = options.crossOrigin;
  document.head.appendChild(link);
}

function lazyLoadHighlight() {
  const codeBlocks = document.querySelectorAll('pre code[class*="language-"]');
  if (!codeBlocks.length || document.documentElement.classList.contains('mobile-mode')) return;

  const loadHighlight = async () => {
    if (window.hljs) {
      window.hljs.highlightAll();
      return;
    }

    loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js');
    window.hljs?.highlightAll();
  };

  if (!('IntersectionObserver' in window)) {
    void loadHighlight().catch(error => console.error('Highlight.js failed to load.', error));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      void loadHighlight().catch(error => console.error('Highlight.js failed to load.', error));
    },
    { rootMargin: '220px 0px' },
  );

  codeBlocks.forEach(block => observer.observe(block));
}
