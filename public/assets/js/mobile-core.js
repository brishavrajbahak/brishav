(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const home = document.getElementById('home');
  document.getElementById('heroTerminal')?.setAttribute('aria-hidden', 'true');

  document.getElementById('loading-screen')?.classList.add('hidden');
  body.classList.add('page-loaded');
  home?.classList.add('hero-revealed');

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const nav = document.querySelector('nav[aria-label="Main navigation"]');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');
  const hamburger = document.getElementById('hamburgerBtn');
  const backToTop = document.getElementById('back-to-top');
  const scrollProgress = document.getElementById('scroll-progress');
  const scrollIndicator = document.getElementById('scrollIndicator');
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const navTargets = sections.map(section => ({
    section,
    desktop: document.querySelector(`nav ul a[href="#${section.id}"]`),
    drawer: document.querySelector(`.mobile-nav a[href="#${section.id}"]`),
    bottom: document.querySelector(`.mobile-bottom-nav a[href="#${section.id}"]`),
  }));

  let scrollFrame = 0;
  function updateScrollUi() {
    scrollFrame = 0;
    const top = window.scrollY;
    const available = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollProgress) scrollProgress.style.width = `${available > 0 ? (top / available) * 100 : 0}%`;
    backToTop?.classList.toggle('visible', top > 400);
    nav?.classList.toggle('scrolled', top > 60);
    scrollIndicator?.classList.toggle('hidden', top > 100);

    const marker = top + 120;
    navTargets.forEach(({ section, desktop, drawer, bottom }) => {
      const active = marker >= section.offsetTop && marker < section.offsetTop + section.offsetHeight;
      desktop?.classList.toggle('active', active);
      drawer?.classList.toggle('active', active);
      bottom?.classList.toggle('active', active);
    });
  }

  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollUi);
  }, { passive: true });
  updateScrollUi();

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  function closeMobileNav() {
    mobileNav?.classList.remove('open');
    mobileNavBackdrop?.classList.remove('open');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
  }

  hamburger?.addEventListener('click', () => {
    const open = mobileNav?.classList.toggle('open') ?? false;
    mobileNavBackdrop?.classList.toggle('open', open);
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });
  mobileNavBackdrop?.addEventListener('click', closeMobileNav);

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      closeMobileNav();
    });
  });

  const openProjectCard = card => {
    const url = card.dataset.projectUrl;
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  };
  document.querySelectorAll('.project-card[data-project-url]').forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest('a, button')) return;
      openProjectCard(card);
    });
    card.addEventListener('keydown', event => {
      if ((event.key !== 'Enter' && event.key !== ' ') || event.target.closest('a, button')) return;
      event.preventDefault();
      openProjectCard(card);
    });
  });
  const observed = document.querySelectorAll('.fade-up, .stat-item, .section-header, section[id]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        if (entry.target.tagName === 'SECTION') entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '80px 0px' });

    observed.forEach(element => {
      if (element.closest('#home')) {
        element.classList.add('visible');
      } else {
        revealObserver.observe(element);
      }
    });
  } else {
    observed.forEach(element => element.classList.add('visible'));
  }

  document.querySelectorAll('.stat-number').forEach(element => {
    element.dataset.animated = 'true';
  });
  const role = document.getElementById('role-text');
  if (role) role.textContent = 'Data Analyst / Data Science Aspirant';

  function updateClock() {
    const time = document.getElementById('navTime');
    if (!time) return;
    time.textContent = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kathmandu',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  }
  updateClock();
  window.setInterval(updateClock, 1000);

  window.showToast = (message, type = 'error') => {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const text = document.getElementById('toastMsg');
    if (!toast || !icon || !text) return;
    icon.textContent = type === 'error' ? '✕' : '✓';
    text.textContent = message;
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'} show`;
    window.setTimeout(() => toast.classList.remove('show'), 5000);
  };

  const codeSection = document.querySelector('pre code');
  if (codeSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      loadHighlighting();
    }, { rootMargin: '300px 0px' });
    observer.observe(codeSection);
  }

  function loadHighlighting() {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
    document.head.appendChild(stylesheet);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
    script.onload = () => window.hljs?.highlightAll();
    document.head.appendChild(script);
  }
})();
