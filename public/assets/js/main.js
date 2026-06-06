  (function() {
    'use strict';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const mobileViewport = window.matchMedia('(max-width: 768px)').matches;
    const smallViewport = window.matchMedia('(max-width: 480px)').matches;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const touchDevice = coarsePointer || navigator.maxTouchPoints > 1;

    let tier = 'high';
    if (
      prefersReducedMotion ||
      cores <= 2 ||
      memory <= 2 ||
      (touchDevice && memory <= 3) ||
      (smallViewport && cores <= 4)
    ) {
      tier = 'low';
    } else if (
      touchDevice ||
      mobileViewport ||
      cores <= 4 ||
      memory <= 4 ||
      window.devicePixelRatio > 2
    ) {
      tier = 'medium';
    }

    window.sitePerformance = {
      tier,
      isHigh: tier === 'high',
      isMedium: tier === 'medium',
      isLow: tier === 'low',
      prefersReducedMotion,
      fps: tier === 'high' ? 30 : tier === 'medium' ? 18 : 1,
      dprCap: tier === 'high' ? 2 : tier === 'medium' ? 1.35 : 1,
      heroParticles: tier === 'high' ? 35 : tier === 'medium' ? 16 : 0,
      glassPanels: tier !== 'low',
      pointerEffects: tier === 'high',
      magneticEffects: tier !== 'low',
      animatedFavicon: tier === 'high'
    };

    document.documentElement.classList.add(`perf-${tier}`);
    document.documentElement.dataset.performanceTier = tier;

    const perf = window.sitePerformance;
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Palette from the site's CSS tokens
    const CR = [200,17,31],  // crimson (--cyan)
          AM = [200,146,10], // amber   (--pink)
          BL = [59,130,246]; // blue    (--violet)
    const r = (c,a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    let W, H, dpr;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, perf.dprCap);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W*dpr; canvas.height = H*dpr;
      canvas.style.width = W+'px'; canvas.style.height = H+'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildLossLandscape();
      buildMatrixRain();
    }

    /* ══════════════════════════════════════════════════
       1. GRADIENT DESCENT LOSS LANDSCAPE
       A 2D cross-section of a loss surface rendered as
       slow-breathing topographic contour lines —
       echoing both ML training and the Himalayas.
    ══════════════════════════════════════════════════ */
    // Sample a noisy "loss bowl" surface: Z = f(x,y)
    function lossZ(nx, ny, seed) {
      // A bumpy bowl with a global minimum
      const bowl  = (nx*nx + ny*ny) * 0.6;
      const bump1 = 0.18 * Math.sin(nx*3.1 + seed*0.7) * Math.cos(ny*2.4 + seed*0.5);
      const bump2 = 0.09 * Math.sin(nx*6.8 + seed*1.1) * Math.cos(ny*5.2 + seed*0.9);
      const ridge = 0.12 * Math.abs(Math.sin(nx*1.8 + ny*2.2 + seed*0.3));
      return bowl + bump1 + bump2 + ridge;
    }

    // Precompute gradient descent path on this landscape
    let lossPath = [];
    function buildLossLandscape() {
      lossPath = [];
      // Start far from minimum, walk gradient
      let px = -0.85, py = 0.70;
      const lr = 0.048;
      for (let i = 0; i < 120; i++) {
        const eps = 0.02;
        const dzdx = (lossZ(px+eps, py, 0) - lossZ(px-eps, py, 0)) / (2*eps);
        const dzdy = (lossZ(px, py+eps, 0) - lossZ(px, py-eps, 0)) / (2*eps);
        px -= lr * dzdx + 0.003*(Math.random()-0.5);
        py -= lr * dzdy + 0.003*(Math.random()-0.5);
        lossPath.push({ nx: px, ny: py });
      }
    }

    // Map normalised [-1,1] landscape coords to screen
    function lsToScreen(nx, ny) {
      // Landscape occupies the right 55% of screen, vertically centred
      const cx = W * 0.73, cy = H * 0.38;
      const scale = Math.min(W, H) * 0.27;
      return { x: cx + nx*scale, y: cy + ny*scale*0.52 }; // flatter = mountain-like
    }

    function drawLossLandscape(t) {
      ctx.save();
      const seed = t * 0.00008; // very slow morph

      // Draw topographic iso-lines (fixed Z levels)
      const levels = [0.05, 0.12, 0.22, 0.36, 0.54, 0.76, 1.02, 1.34];
      const res = perf.isHigh ? 90 : perf.isMedium ? 48 : 0; // marching-squares resolution
      if (!res) return;
      const step = 2.4 / res;

      for (let li = 0; li < levels.length; li++) {
        const zTarget = levels[li];
        const alpha = 0.028 + li * 0.005;
        const col = li < 3 ? CR : (li < 6 ? AM : BL);

        // Collect iso-line segments via linear interpolation
        ctx.beginPath();
        let firstSeg = true;

        for (let ix = 0; ix < res; ix++) {
          for (let iy = 0; iy < res; iy++) {
            const nx0 = -1.2 + ix*step, ny0 = -1.2 + iy*step;
            const nx1 = nx0+step,       ny1 = ny0+step;

            const z00 = lossZ(nx0, ny0, seed);
            const z10 = lossZ(nx1, ny0, seed);
            const z01 = lossZ(nx0, ny1, seed);
            const z11 = lossZ(nx1, ny1, seed);

            // Identify edges crossing the iso-level (simplified marching squares)
            const segs = [];
            const interp = (za, zb, xa, ya, xb, yb) => {
              if (za === zb) return null;
              const t2 = (zTarget - za) / (zb - za);
              if (t2 < 0 || t2 > 1) return null;
              return { nx: xa + t2*(xb-xa), ny: ya + t2*(yb-ya) };
            };
            const e0 = interp(z00,z10, nx0,ny0, nx1,ny0); // bottom
            const e1 = interp(z10,z11, nx1,ny0, nx1,ny1); // right
            const e2 = interp(z01,z11, nx0,ny1, nx1,ny1); // top
            const e3 = interp(z00,z01, nx0,ny0, nx0,ny1); // left

            const pts = [e0,e1,e2,e3].filter(Boolean);
            if (pts.length >= 2) {
              const a = lsToScreen(pts[0].nx, pts[0].ny);
              const b = lsToScreen(pts[1].nx, pts[1].ny);
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
            }
          }
        }
        ctx.strokeStyle = r(col, alpha);
        ctx.lineWidth = 0.55;
        ctx.stroke();
      }

      // ── Draw gradient descent path ──
      // Animate a "current epoch" bead running along it
      const epochPos = ((t * 0.00025) % 1);
      const trailLen = 38;

      ctx.beginPath();
      for (let i = 1; i < lossPath.length; i++) {
        const a = lsToScreen(lossPath[i-1].nx, lossPath[i-1].ny);
        const b = lsToScreen(lossPath[i].nx, lossPath[i].ny);
        const prog = i / lossPath.length;
        const alpha2 = prog * 0.18;
        ctx.strokeStyle = r(CR, alpha2);
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      }

      // Travelling bead
      const beadIdx = Math.floor(epochPos * (lossPath.length - trailLen));
      if (beadIdx >= 0 && beadIdx < lossPath.length) {
        // Trail
        for (let i = Math.max(0, beadIdx-trailLen); i < beadIdx; i++) {
          const prog = (i - (beadIdx-trailLen)) / trailLen;
          const pt = lsToScreen(lossPath[i].nx, lossPath[i].ny);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI*2);
          ctx.fillStyle = r(CR, prog * 0.25);
          ctx.fill();
        }
        // Bead head
        const head = lsToScreen(lossPath[beadIdx].nx, lossPath[beadIdx].ny);
        const glow = ctx.createRadialGradient(head.x,head.y,0, head.x,head.y,10);
        glow.addColorStop(0, r(CR, 0.18));
        glow.addColorStop(1, r(CR, 0));
        ctx.beginPath(); ctx.arc(head.x,head.y,10,0,Math.PI*2);
        ctx.fillStyle = glow; ctx.fill();
        ctx.beginPath(); ctx.arc(head.x,head.y,2.5,0,Math.PI*2);
        ctx.fillStyle = r(CR, 0.45); ctx.fill();
      }

      ctx.restore();
    }

    /* ══════════════════════════════════════════════════
       2. TENSOR / MATRIX RAIN (left third of screen)
       Sparse columns of floating numbers — numpy-style
       array values drifting downward like data pipelines.
       Very faint, not distracting.
    ══════════════════════════════════════════════════ */
    const MATRIX_COLS = perf.isHigh ? 14 : perf.isMedium ? 8 : 0;
    let matrixDrops = [];

    // Vocabulary: numbers that feel data-science
    const matVocab = [
      '0.92','0.08','1.00','0.73','−1','0.41',
      '128','256','0.5σ','ε','∇','β₁','α',
      '0.1','9.8','3.14','0.01','×10⁻³','NaN',
      '0.88','1.0','−0.5','0.33','64','0.99'
    ];

    function buildMatrixRain() {
      matrixDrops = [];
      const colW = (W * 0.30) / MATRIX_COLS;
      for (let c = 0; c < MATRIX_COLS; c++) {
        matrixDrops.push({
          x: colW * (c + 0.5),
          y: Math.random() * H,
          speed: 0.18 + Math.random() * 0.22,
          alpha: 0.04 + Math.random() * 0.06,
          vals: Array.from({length: perf.isHigh ? 14 : 8}, () => matVocab[Math.floor(Math.random()*matVocab.length)]),
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function drawMatrixRain(t) {
      ctx.save();
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const lineH = 18;

      for (const d of matrixDrops) {
        d.y += d.speed;
        if (d.y > H + 14 * lineH) {
          d.y = -14 * lineH;
          d.vals = Array.from({length: perf.isHigh ? 14 : 8}, () => matVocab[Math.floor(Math.random()*matVocab.length)]);
        }
        for (let i = 0; i < d.vals.length; i++) {
          const vy = d.y + i * lineH;
          if (vy < -lineH || vy > H + lineH) continue;
          // Head is slightly brighter
          const headBoost = i === d.vals.length - 1 ? 2.2 : 1;
          const fade = Math.max(0, 1 - i / d.vals.length);
          ctx.fillStyle = r(CR, d.alpha * fade * headBoost);
          ctx.fillText(d.vals[i], d.x, vy);
        }
      }
      ctx.restore();
    }

    /* ══════════════════════════════════════════════════
       3. DISTRIBUTION CURVES (bottom strip)
       Gaussian / skewed curves drifting as background
       decoration — like Seaborn histogram overlays.
    ══════════════════════════════════════════════════ */
    const DIST_CURVES = [
      { mu: 0.20, sig: 0.07, col: CR, a: 0.045, phase: 0.0  },
      { mu: 0.45, sig: 0.10, col: AM, a: 0.035, phase: 1.2  },
      { mu: 0.68, sig: 0.06, col: BL, a: 0.040, phase: 2.4  },
      { mu: 0.85, sig: 0.09, col: CR, a: 0.030, phase: 0.8  },
    ];

    function drawDistCurves(t) {
      ctx.save();
      const baseY = H * 0.92; // near bottom
      const ampH  = H * 0.10;

      for (const d of DIST_CURVES) {
        // Slow drift of mu
        const drift = Math.sin(t * 0.0003 + d.phase) * 0.04;
        const mu = d.mu + drift;

        ctx.beginPath();
        let first = true;
        for (let xi = 0; xi <= W; xi += 3) {
          const nx = xi / W;
          const gauss = Math.exp(-0.5 * ((nx - mu) / d.sig) ** 2);
          const y = baseY - gauss * ampH;
          first ? ctx.moveTo(xi, y) : ctx.lineTo(xi, y);
          first = false;
        }
        ctx.strokeStyle = r(d.col, d.a);
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Shaded area under the curve
        ctx.lineTo(W, baseY); ctx.lineTo(0, baseY); ctx.closePath();
        ctx.fillStyle = r(d.col, d.a * 0.3);
        ctx.fill();
      }
      ctx.restore();
    }

    /* ══════════════════════════════════════════════════
       4. NEURAL WEIGHT MATRIX GRID (top-left corner)
       A sparse heatmap-style grid — activation values
       shown as colour-intensity squares, like a weight
       visualisation in matplotlib.imshow()
    ══════════════════════════════════════════════════ */
    const GRID_ROWS = 10, GRID_COLS = 10;
    let weightGrid = [], weightTarget = [], weightT = 0;

    function randWeight() { return Math.random() * 2 - 1; } // [-1, 1]
    function initWeights() {
      weightGrid  = Array.from({length:GRID_ROWS}, () => Array.from({length:GRID_COLS}, randWeight));
      weightTarget = weightGrid.map(row => row.map(() => randWeight()));
      weightT = 0;
    }
    function lerpWeights(dt) {
      weightT = Math.min(1, weightT + dt * 0.0004);
      if (weightT >= 1) {
        weightGrid = weightTarget.map(row => [...row]);
        weightTarget = weightGrid.map(row => row.map(() => randWeight()));
        weightT = 0;
      }
    }
    function ease(x) { return x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x+2,2)/2; }
    function lerp(a,b,t) { return a + (b-a)*t; }

    function drawWeightMatrix() {
      ctx.save();
      const et = ease(weightT);
      const cellW = 22, cellH = 22;
      const offX = 28, offY = 88; // top-left corner, below nav
      const gap = 2;

      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const w = lerp(weightGrid[row][col], weightTarget[row][col], et);
          const x = offX + col * (cellW + gap);
          const y = offY + row * (cellH + gap);

          if (w > 0) {
            // Positive activation: crimson tint
            ctx.fillStyle = r(CR, w * 0.055);
          } else {
            // Negative: blue tint
            ctx.fillStyle = r(BL, Math.abs(w) * 0.050);
          }
          ctx.fillRect(x, y, cellW, cellH);

          // Faint cell border
          ctx.strokeStyle = r(CR, 0.03);
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellW, cellH);
        }
      }

      // Label
      ctx.font = '7px "JetBrains Mono", monospace';
      ctx.fillStyle = r(CR, 0.15);
      ctx.textAlign = 'left';
      ctx.fillText('W₁  [10×10]', offX, offY - 6);

      ctx.restore();
    }

    /* ══════════════════════════════════════════════════
       5. HIMALAYAN DATA HORIZON
       Layered mountain silhouettes with subtle data-grid
       lines overlaid — combining origin (Kathmandu) with
       the ML field (elevation maps, terrain data).
       These complement the existing hero-mountains SVG.
    ══════════════════════════════════════════════════ */
    function drawDataHorizon(t) {
      ctx.save();
      const baseY = H;
      // Three mountain layers — each driven by a simple
      // sum of sinusoids (mimics real ridge profiles)
      const layers = [
        { amps:[0.09,0.06,0.04], freqs:[0.0028,0.007,0.018], phases:[0,1.1,2.3], col:BL, a:0.038, shift:0.22 },
        { amps:[0.07,0.05,0.03], freqs:[0.0033,0.009,0.021], phases:[0.5,2.0,0.8], col:AM, a:0.040, shift:0.15 },
        { amps:[0.06,0.04,0.025],freqs:[0.004,0.011,0.025],  phases:[1.0,0.4,1.8], col:CR, a:0.045, shift:0.10 },
      ];

      // Extremely slow drift — mountains barely move
      const drift = t * 0.000018;

      for (const layer of layers) {
        const horizon = H * (1 - layer.shift);
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let xi = 0; xi <= W; xi += 4) {
          const nx = xi / W;
          let elev = 0;
          for (let k = 0; k < layer.amps.length; k++) {
            elev += layer.amps[k] * H * Math.sin(nx * W * layer.freqs[k] + layer.phases[k] + drift);
          }
          ctx.lineTo(xi, horizon - Math.abs(elev));
        }
        ctx.lineTo(W, baseY); ctx.closePath();
        ctx.fillStyle = r(layer.col, layer.a);
        ctx.fill();

        // Data-grid lines etched into mountain silhouette
        ctx.save();
        ctx.beginPath(); // re-clip to the mountain shape
        ctx.moveTo(0, baseY);
        for (let xi = 0; xi <= W; xi += 4) {
          const nx = xi / W;
          let elev = 0;
          for (let k = 0; k < layer.amps.length; k++) {
            elev += layer.amps[k] * H * Math.sin(nx * W * layer.freqs[k] + layer.phases[k] + drift);
          }
          ctx.lineTo(xi, horizon - Math.abs(elev));
        }
        ctx.lineTo(W, baseY); ctx.closePath();
        ctx.clip();
        // Vertical grid lines inside mountain mass
        ctx.setLineDash([1,6]);
        ctx.strokeStyle = r(layer.col, layer.a * 0.9);
        ctx.lineWidth = 0.6;
        for (let xi = 0; xi < W; xi += 56) {
          ctx.beginPath(); ctx.moveTo(xi, 0); ctx.lineTo(xi, H); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();
      }

      ctx.restore();
    }

    const formulas = [
      { text: 'f(x) = σ(Wᵀx + b)', x: 0.15, y: 0.22, speed: 0.045, alpha: 0.05 },
      { text: '∇L(θ) = -∑ (y - p)x', x: 0.45, y: 0.15, speed: 0.038, alpha: 0.04 },
      { text: 'P(A|B) = P(B|A)P(A)/P(B)', x: 0.82, y: 0.32, speed: 0.052, alpha: 0.05 },
      { text: 'wₜ₊₁ = wₜ - η∇L(wₜ)', x: 0.12, y: 0.75, speed: 0.032, alpha: 0.06 },
      { text: 'L(y, p) = -y log(p) - (1-y) log(1-p)', x: 0.52, y: 0.85, speed: 0.042, alpha: 0.04 },
      { text: 'softmax(z)ᵢ = eᶻⁱ / ∑ eᶻʲ', x: 0.78, y: 0.65, speed: 0.036, alpha: 0.05 },
      { text: 'Cov(X, Y) = E[(X-μₓ)(Y-μᵧ)]', x: 0.28, y: 0.45, speed: 0.055, alpha: 0.04 }
    ];

    function drawMathFormulas(t) {
      ctx.save();
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      
      formulas.forEach((f) => {
        // Slow drift upwards
        const driftY = (t * f.speed) % H;
        const currentY = ((H * f.y) - driftY + H) % H;
        const currentX = W * f.x;
        
        // Fade out near top/bottom of screen to keep screen boundaries clean
        const edgeFade = Math.sin((currentY / H) * Math.PI);
        ctx.fillStyle = r(CR, f.alpha * edgeFade);
        ctx.fillText(f.text, currentX, currentY);
      });
      ctx.restore();
    }

    /* ══ Master render loop ══ */
    let lastT = 0;
    const frameInterval = 1000 / perf.fps;
    function render(t) {
      if (document.hidden) { requestAnimationFrame(render); return; }
      if (t - lastT < frameInterval) { requestAnimationFrame(render); return; }
      const dt = t - lastT; lastT = t;

      ctx.clearRect(0, 0, W, H);

      drawDataHorizon(t);          // Himalayan layers at bottom
      if (!perf.isLow) {
        drawWeightMatrix();         // weight heatmap top-left
        lerpWeights(dt);
        drawDistCurves(t);          // distribution curves bottom
        drawLossLandscape(t);       // loss surface right side
      }
      if (perf.isHigh) {
        drawMatrixRain(t);          // tensor rain left strip
        drawMathFormulas(t);        // floating math equations
      }

      if (perf.isLow) return;
      requestAnimationFrame(render);
    }

    window.addEventListener('resize', resize, {passive:true});
    resize();
    initWeights();
    requestAnimationFrame(render);
  })();
  

    const sitePerf = window.sitePerformance || {
      tier: 'high',
      isHigh: true,
      isMedium: false,
      isLow: false,
      pointerEffects: true,
      magneticEffects: true,
      heroParticles: 35,
      animatedFavicon: true
    };

    /* ── Global Mouse Tracking System ── */
    window.globalMX = window.innerWidth / 2;
    window.globalMY = window.innerHeight / 2;
    window.mouseInWindow = false;
    window.hasCursorInitialized = false;

    const globalDot = document.getElementById('cursor-dot');
    const globalSpotlight = document.getElementById('cursor-spotlight');
    const globalProfileRing = document.querySelector('.profile-ring');
    const isFinePointer = window.matchMedia('(pointer: fine)').matches && sitePerf.pointerEffects;

    let cursorTicking = false;

    function syncCursorVisuals() {
      cursorTicking = false;
      if (!window.hasCursorInitialized || !globalDot) return;
      globalDot.style.transform = `translate3d(${window.globalMX}px, ${window.globalMY}px, 0) translate(-50%, -50%)`;
      if (globalSpotlight) {
        globalSpotlight.style.setProperty('--mx', window.globalMX + 'px');
        globalSpotlight.style.setProperty('--my', window.globalMY + 'px');
      }
    }

    function globalMouseMoveHandler(e) {
      window.globalMX = e.clientX;
      window.globalMY = e.clientY;
      window.mouseInWindow = true;

      // 1. Initialize cursor once on first move
      if (isFinePointer && !window.hasCursorInitialized) {
        window.hasCursorInitialized = true;
        document.documentElement.classList.add('cursor-ready');
        document.body.classList.add('cursor-ready');
      }

      // 2. High-Performance Custom Cursor (rAF-throttled)
      if (isFinePointer && globalDot && !cursorTicking) {
        cursorTicking = true;
        requestAnimationFrame(syncCursorVisuals);
      }

      // 3. Profile Ring Cursor-Follow Glow — disabled for clean UI
    }

    document.addEventListener('mousemove', globalMouseMoveHandler, { passive: true });
    
    // Global mouseenter/mouseleave for window boundaries
    document.addEventListener('mouseleave', () => {
      window.mouseInWindow = false;
      if (globalDot) globalDot.style.opacity = '0';
    }, { passive: true });

    document.addEventListener('mouseenter', e => {
      window.mouseInWindow = true;
      window.globalMX = e.clientX;
      window.globalMY = e.clientY;
      if (globalDot) globalDot.style.opacity = '1';
    }, { passive: true });

    /* ── Dynamic footer year ── */
    document.getElementById('year').textContent = new Date().getFullYear();
    /* ── Staggered Entrance Pre-setup ── */
    // Automatically assign staggered indexes to all .fade-up items under major parents
    document.querySelectorAll('section, .skills-layout, .projects-grid, .contact-wrapper, .detail-grid').forEach(parent => {
      const children = parent.querySelectorAll('.fade-up');
      children.forEach((child, index) => {
        child.style.setProperty('--stagger-delay', index);
      });
    });
    /* ── Loading Screen & Staggered Hero Reveal (Simulated ML Convergence) ── */
    window.addEventListener('load', () => {
      const consoleEl = document.getElementById('loadingConsole');
      const statusEl = document.querySelector('.loading-status');
      
      const logLines = [
        "[SYS] model = CustomMLPRegressor(depth=5)",
        "[SYS] optimizer = Adam(lr=3e-4, weight_decay=1e-5)",
        "Epoch 01/10 | loss: 1.0422 | val_loss: 0.9238",
        "Epoch 03/10 | loss: 0.6518 | val_loss: 0.5182",
        "Epoch 06/10 | loss: 0.3288 | val_loss: 0.2811",
        "Epoch 10/10 | loss: 0.0482 | val_loss: 0.0521",
        "[SYS] Loss converged below epsilon threshold.",
        "[SYS] Deployed weights: optimal_candidate.bin"
      ];
      
      let lineIdx = 0;
      function printNextLine() {
        if (!consoleEl) return;
        if (lineIdx < logLines.length) {
          const div = document.createElement('div');
          div.style.marginBottom = '2px';
          div.textContent = logLines[lineIdx];
          consoleEl.appendChild(div);
          consoleEl.scrollTop = consoleEl.scrollHeight;
          
          if (logLines[lineIdx].startsWith('Epoch')) {
            const parts = logLines[lineIdx].split('|');
            statusEl.textContent = `Training: ${parts[0].trim()}...`;
          } else if (lineIdx === logLines.length - 1) {
            statusEl.textContent = "Convergence attained.";
          }
          
          lineIdx++;
          setTimeout(printNextLine, 140);
        } else {
          setTimeout(() => {
            const loader = document.getElementById('loading-screen');
            if (loader) loader.classList.add('hidden');
            document.body.classList.add('page-loaded');
            const home = document.getElementById('home');
            if (home) {
              home.classList.add('hero-revealed');
              document.querySelectorAll('#home .stat-item').forEach(item => {
                const num = item.querySelector('.stat-number');
                if (num) setTimeout(() => animateStatCounter(num), 900);
              });
            }
            resetInactivityTimer();
            initNavSlider();
            if (!sitePerf.isLow) initHoloSpotlight();
            initDefaultAudioOnGesture();
            if (sitePerf.animatedFavicon) initAnimatedFavicon();
          }, 350);
        }
      }
      setTimeout(printNextLine, 200);
    });
    /* ── High-Performance Custom Cursor Hover & State Triggers ── */
    if (isFinePointer) {
      const hoverTargets = 'a, button, .project-card, .skill-row, .contact-link-item, .social-btn, .detail-item, .nav-hamburger';
      document.querySelectorAll(hoverTargets).forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
      });
      document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
      document.addEventListener('mouseup',   () => document.body.classList.remove('cursor-click'));
    }
    /* ── 3D Card Tilt (GPU-only, skips while scrolling) ── */
    if (sitePerf.magneticEffects) document.querySelectorAll('.project-card').forEach(card => {
      const inner = card.querySelector('.project-card-inner');
      card.addEventListener('mousemove', e => {
        if (document.body.classList.contains('is-scrolling')) return;
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width  / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        card.style.transform = `perspective(800px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg) scale(1.02) translateZ(10px)`;
        card.style.boxShadow = `${-dx * 12}px ${-dy * 12}px 40px rgba(0,0,0,0.5), 0 0 30px rgba(230,57,70,0.12)`;
        if (inner) inner.style.transform = 'translateY(-8px)';
        card.classList.add('tilt-active');
        card.style.setProperty('--card-mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--card-my', `${e.clientY - rect.top}px`);
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('tilt-active');
        card.style.transform = '';
        card.style.boxShadow = '';
        if (inner) inner.style.transform = '';
      });
    });
    /* ── Button ripple on click ── */
    if (sitePerf.magneticEffects) document.querySelectorAll('.btn-primary, .btn-ghost, .form-submit, .nav-cta').forEach(btn => {
      btn.addEventListener('click', e => {
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        const size = Math.max(btn.offsetWidth, btn.offsetHeight);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - btn.getBoundingClientRect().left - size / 2) + 'px';
        ripple.style.top  = (e.clientY - btn.getBoundingClientRect().top  - size / 2) + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
    /* ── Magnetic Interactions ── */
    document.querySelectorAll('.btn-primary, .btn-ghost, .form-submit, .nav-cta').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        if (document.body.classList.contains('is-scrolling')) return;
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width  / 2)) * 0.28;
        const dy = (e.clientY - (rect.top  + rect.height / 2)) * 0.28;
        btn.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
    /* ── Particle canvas (throttled, pauses when hero off-screen) ── */
    (() => {
      const canvas = document.getElementById('particles-canvas');
      const heroSection = document.getElementById('home');
      if (!canvas || !heroSection) return;
      if (!sitePerf.heroParticles) {
        canvas.remove();
        return;
      }
      const ctx = canvas.getContext('2d');
      let W, H, particles = [];
      let particlesActive = true;
      let lastFrameTime = 0;
      const COLORS = ['rgba(230,57,70,', 'rgba(255,215,0,', 'rgba(255,214,10,', 'rgba(139,92,246,'];
      const fpsCeiling = sitePerf.isHigh ? 24 : 16;
      const frameInterval = 1000 / fpsCeiling;
      const isMobile = window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(pointer: coarse)').matches;
      const maxCount = Math.min(sitePerf.heroParticles, isMobile ? 20 : 35);
      const REPEL_RADIUS = 120;
      const REPEL_FORCE = 1.8;
      const particleObserver = new IntersectionObserver(
        ([entry]) => { particlesActive = entry.isIntersecting; },
        { threshold: 0.05, rootMargin: '80px 0px' }
      );
      particleObserver.observe(heroSection);
      function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', resize, { passive: true });
      resize();
      function Particle() {
        this.reset = function () {
          this.x = Math.random() * W;
          this.y = H + 10;
          this.vy = -(Math.random() * 0.55 + 0.2);
          this.vx = (Math.random() - 0.5) * 0.25;
          this.r  = Math.random() * 1.5 + 0.4;
          this.alpha = Math.random() * 0.35 + 0.1;
          this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
          this.life = 0;
          this.maxLife = Math.random() * 240 + 200;
        };
        this.reset();
        this.y = Math.random() * H;
        this.life = Math.floor(Math.random() * this.maxLife);
      }
      for (let i = 0; i < maxCount; i++) particles.push(new Particle());
      function draw(timestamp) {
        requestAnimationFrame(draw);
        if (!particlesActive || document.body.classList.contains('is-scrolling')) return;
        if (timestamp - lastFrameTime < frameInterval) return;
        lastFrameTime = timestamp;
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
          /* ── Cursor proximity repulsion ── */
          const pmx = (typeof window.globalMX !== 'undefined' && window.mouseInWindow) ? window.globalMX : -9999;
          const pmy = (typeof window.globalMY !== 'undefined' && window.mouseInWindow) ? window.globalMY : -9999;
          const ddx = p.x - pmx;
          const ddy = p.y - pmy;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < REPEL_RADIUS && dist > 0) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
            p.vx += (ddx / dist) * force * 0.15;
            p.vy += (ddy / dist) * force * 0.15;
          }
          /* ── Velocity damping to prevent runaway ── */
          p.vx *= 0.97;
          p.vy *= 0.97;
          /* ── Ensure minimum upward drift ── */
          if (p.vy > -0.1) p.vy -= 0.02;
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          if (p.life > p.maxLife || p.y < -10) p.reset();
          const fade = p.life < 40 ? p.life / 40 : p.life > p.maxLife - 40 ? (p.maxLife - p.life) / 40 : 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color + (p.alpha * fade) + ')';
          ctx.fill();
        });
      }
      requestAnimationFrame(draw);
    })();
    /* ── Typewriter ── */
    const roles  = ['Data Scientist', 'Machine Learning Engineer', 'Deep Learning Researcher', 'Data Pipeline Architect', 'Predictive Systems Builder'];
    let ri = 0, ci = 0, deleting = false;
    const roleEl = document.getElementById('role-text');
    function type() {
      const word = roles[ri];
      if (!deleting) {
        roleEl.textContent = word.slice(0, ++ci);
        if (ci === word.length) { deleting = true; setTimeout(type, 1800); return; }
      } else {
        roleEl.textContent = word.slice(0, --ci);
        if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; }
      }
      setTimeout(type, deleting ? 55 : 95);
    }
    if (sitePerf.isLow) {
      roleEl.textContent = roles[0];
    } else {
      type();
    }
    /* ── Throttled Scroll Handling ── */
    const scrollProgressEl = document.getElementById('scroll-progress');
    const backToTopBtn     = document.getElementById('back-to-top');
    const navEl            = document.querySelector('nav');
    const sectionEls       = document.querySelectorAll('section[id]');
    const scrollIndicator  = document.getElementById('scrollIndicator');
    const sectionNavMap    = Array.from(sectionEls).map(s => ({
      el: s,
      desktop: document.querySelector(`nav ul a[href="#${s.id}"]`),
      mobile: document.querySelector(`.mobile-nav a[href="#${s.id}"]`),
      bottom: document.querySelector(`.mobile-bottom-nav a[href="#${s.id}"]`),
    }));
    let scrollScheduled = false;
    let isScrollingTimer = null;
    const docHeight = () => document.documentElement.scrollHeight - window.innerHeight;
    function setScrollingState(on) {
      document.body.classList.toggle('is-scrolling', on);
      document.documentElement.classList.toggle('is-scrolling', on);
    }
    function handleScrollThrottled() {
      const scrollTop = window.scrollY;
      scrollProgressEl.style.width = (docHeight() > 0 ? (scrollTop / docHeight()) * 100 : 0) + '%';
      backToTopBtn.classList.toggle('visible', scrollTop > 400);
      navEl.classList.toggle('scrolled', scrollTop > 60);
      if (scrollIndicator) {
        scrollIndicator.classList.toggle('hidden', scrollTop > 100);
      }
      const thresholdY = scrollTop + 120;
      sectionNavMap.forEach(({ el, desktop, mobile, bottom }) => {
        const isActive = thresholdY >= el.offsetTop && thresholdY < el.offsetTop + el.offsetHeight;
        if (desktop) desktop.classList.toggle('active', isActive);
        if (mobile) mobile.classList.toggle('active', isActive);
        if (bottom) bottom.classList.toggle('active', isActive);
      });

      // Scroll-Driven 3D Parallax for Decorative Elements
      if (sitePerf.isHigh && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
        const gridBg = document.querySelector('.grid-bg');
        if (gridBg) gridBg.style.transform = `translate3d(0, ${scrollTop * 0.02}px, 0)`;

        document.querySelectorAll('.orb').forEach((orb, i) => {
          const rate = 0.03 + i * 0.01;
          orb.style.transform = `translate3d(0, ${scrollTop * rate}px, 0) scale(1)`;
        });

        const heroMountains = document.querySelector('.hero-mountains');
        if (heroMountains) {
          heroMountains.style.setProperty('--mountain-y', `${scrollTop * 0.12}px`);
        }
      }

      scrollScheduled = false;
    }
    window.addEventListener('scroll', () => {
      setScrollingState(true);
      clearTimeout(isScrollingTimer);
      isScrollingTimer = setTimeout(() => setScrollingState(false), 180);
      if (!scrollScheduled) {
        scrollScheduled = true;
        requestAnimationFrame(handleScrollThrottled);
      }
    }, { passive: true });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    /* ── Nav Hover Glowing Spot Tracking ── */
    navEl.addEventListener('mousemove', e => {
      if (document.body.classList.contains('is-scrolling')) return;
      const rect = navEl.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
      navEl.style.setProperty('--nav-mx', x);
      navEl.style.setProperty('--nav-my', y);
    });
    /* ── Single Integrated Intersection Observer ── */
    const mainObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add('visible');
          if (el.classList.contains('stat-item')) {
            animateStatCounter(el.querySelector('.stat-number'));
          }
          if (el.classList.contains('section-header')) {
            const title = el.querySelector('.section-title');
            if (title && !title.dataset.glitched) {
              title.dataset.glitched = 'true';
              title.classList.add('glitch-reveal');
              setTimeout(() => title.classList.remove('glitch-reveal'), 700);
            }
          }
          if (el.tagName === 'SECTION') {
            el.classList.add('in-view');
            const divider = el.previousElementSibling;
            if (divider && divider.classList.contains('section-divider')) {
              divider.classList.add('scan-wipe');
              setTimeout(() => divider.classList.remove('scan-wipe'), 1300);
            }
          }
          observer.unobserve(el);
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.fade-up, .stat-item, .section-header').forEach(el => {
      if (el.closest('#home')) return;
      mainObserver.observe(el);
    });
    document.querySelectorAll('section[id]').forEach(sec => mainObserver.observe(sec));
    /* ── Suffix-preserving Stat Counters ── */
    function animateStatCounter(el) {
      if (!el || el.dataset.animated === 'true') return;
      el.dataset.animated = 'true';
      const originalText = el.textContent.trim();
      const numericVal = parseInt(originalText, 10);
      const suffix = originalText.replace(String(numericVal), ''); // captures "+" or any letters
      let currentVal = 0;
      const animationDuration = 1200; // ms
      const steps = 60;
      const increment = numericVal / steps;
      const stepInterval = animationDuration / steps;
      const timer = setInterval(() => {
        currentVal += increment;
        if (currentVal >= numericVal) {
          el.textContent = numericVal + suffix;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(currentVal) + suffix;
        }
      }, stepInterval);
    }
    /* ── Nav Actions (Smooth Scroll & Close mobile nav) ── */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        mobileNav.classList.remove('open');
        if (typeof mobileNavBackdrop !== 'undefined') mobileNavBackdrop.classList.remove('open');
        hamburgerBtn.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      });
    });
    /* ── Mobile Hamburger Toggle ── */
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileNav    = document.getElementById('mobileNav');
    const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      mobileNavBackdrop.classList.toggle('open', isOpen);
      hamburgerBtn.classList.toggle('open', isOpen);
      hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
    });
    // Close mobile drawer on outside click
    document.addEventListener('click', e => {
      if (!hamburgerBtn.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        mobileNavBackdrop.classList.remove('open');
        hamburgerBtn.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    });
    /* ── Syntax Highlighting Initialization (Deferred) ── */
    window.addEventListener('load', () => {
      if (window.hljs) hljs.highlightAll();
    });
    /* ── Advanced Interactive Terminal Widget Emulator ── */
    const terminalInput = document.getElementById('terminalInput');
    const terminalOutput = document.getElementById('terminalOutput');
    const terminalCursor = document.getElementById('terminalCursor');
    const commands = {
      whoami: "Brishav Rajbahak | Data Scientist & Machine Learning Engineer from Kathmandu, Nepal.",
      skills: `Machine Learning: PyTorch, TensorFlow, Scikit-Learn, XGBoost, Keras\nData Engineering: SQL, Spark, Kafka, Airflow, ETL, Hadoop\nCloud & MLOps: AWS, Google Cloud, Docker, MLflow, Kubernetes\nStatistics & Viz: Pandas, NumPy, Matplotlib, Seaborn, Tableau, R\nNLP & Computer Vision: Transformers, BERT, GPT, HuggingFace, OpenCV, YOLO`,
      projects: `• Everest Analytics Engine - Spark-powered Himalayan climate predictions.\n• Lhotse Object Classifier - Mobile PyTorch topological analysis CNN.\n• Kathmandu Traffic Forecaster - Congestion forecasting XGBoost API.\nType 'github' to view all active repositories.`,
      contact: `Email: hello@brishavrajbahak.com\nGitHub: github.com/brishavrajbahak\nLinkedIn: linkedin.com/in/brishav-rajbahak\nInstagram: @razzbahakbrishav`,
      github: "Opening https://github.com/brishavrajbahak ...",
      help: `whoami    - Digital profile details\nskills    - Tech stack inventory\nprojects  - Active codebase deployments\ncontact   - Communication channels\ngithub    - Load GitHub profile\nplot      - Output Cartesian regression plot\ntrain     - Run simulated model training loop\nclear     - Reset terminal display\nsudo      - Elevate security privileges\nmatrix    - Enter the digital grid\ncoffee    - Synthesize caffeine`,
      sudo: "Error: User is not in the sudoers file. This incident will be reported.",
      matrix: null,
      plot: null,
      train: null,
      coffee: "Caffeine synthesizer initialized. Hot cup of coffee queued for production. ☕",
      clear: null
    };
    /* ── Matrix Digital Rain Engine ── */
    let matrixRainActive = false;
    let matrixRainFrame = null;
    function startMatrixRain() {
      if (matrixRainActive) return;
      matrixRainActive = true;
      const termOut = document.getElementById('terminalOutput');
      // Create a small canvas inside terminal output
      const matrixCanvas = document.createElement('canvas');
      matrixCanvas.id = 'matrixRainCanvas';
      matrixCanvas.style.cssText = 'width:100%;height:180px;border-radius:6px;margin-top:6px;display:block;background:#000;';
      matrixCanvas.width = 500;
      matrixCanvas.height = 180;
      const wrapper = document.createElement('div');
      wrapper.className = 'terminal-line';
      wrapper.appendChild(matrixCanvas);
      termOut.appendChild(wrapper);
      termOut.scrollTop = termOut.scrollHeight;
      const mCtx = matrixCanvas.getContext('2d');
      const fontSize = 12;
      const cols = Math.floor(matrixCanvas.width / fontSize);
      const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -20));
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789@#$%^&*';
      const cyanVal = getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim() || '#e63946';
      let frameCount = 0;
      const maxFrames = sitePerf.isLow ? 60 : sitePerf.isMedium ? 120 : 180;
      function drawMatrix() {
        if (!matrixRainActive || frameCount >= maxFrames) {
          matrixRainActive = false;
          cancelAnimationFrame(matrixRainFrame);
          // Print exit message
          const exitLine = document.createElement('div');
          exitLine.className = 'terminal-line';
          exitLine.textContent = 'Matrix disconnected. Welcome back to reality.';
          termOut.appendChild(exitLine);
          termOut.scrollTop = termOut.scrollHeight;
          return;
        }
        frameCount++;
        mCtx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        mCtx.font = fontSize + 'px JetBrains Mono, monospace';
        for (let i = 0; i < cols; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;
          // Head character is brighter
          if (Math.random() > 0.5) {
            mCtx.fillStyle = '#fff';
          } else {
            mCtx.fillStyle = cyanVal;
          }
          mCtx.fillText(char, x, y);
          // Trail with theme glow
          mCtx.shadowColor = cyanVal;
          mCtx.shadowBlur = 4;
          if (y > matrixCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
        mCtx.shadowBlur = 0;
        matrixRainFrame = requestAnimationFrame(drawMatrix);
      }
      matrixRainFrame = requestAnimationFrame(drawMatrix);
    }
    let terminalQueue = [];
    let isProcessingQueue = false;
    function printToTerminal(textOrLines, isCommand = false) {
      if (isCommand) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `<span class="terminal-prompt">$</span> <span>${textOrLines}</span>`;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        return;
      }
      // Append outputs to queue to process line-by-line in sequential typewriter loops
      const lines = textOrLines.split('\n');
      lines.forEach(lineText => {
        terminalQueue.push(lineText);
      });
      
      processTerminalQueue();
    }
    function processTerminalQueue() {
      if (isProcessingQueue || terminalQueue.length === 0) return;
      isProcessingQueue = true;
      const nextLine = terminalQueue.shift();
      const line = document.createElement('div');
      line.className = 'terminal-line';
      terminalOutput.appendChild(line);
      let ci = 0;
      function type() {
        if (ci < nextLine.length) {
          line.textContent += nextLine[ci];
          ci++;
          terminalOutput.scrollTop = terminalOutput.scrollHeight;
          setTimeout(type, 15);
        } else {
          setTimeout(() => {
            isProcessingQueue = false;
            processTerminalQueue();
          }, 30);
        }
      }
      type();
    }
    /* ── Regression Plot ASCII Canvas ── */
    function startRegressionPlot() {
      const termOut = document.getElementById('terminalOutput');
      const plotCanvas = document.createElement('canvas');
      plotCanvas.style.cssText = 'width:100%;height:160px;border-radius:6px;margin-top:6px;display:block;background:rgba(245,246,250,0.95);border:1px solid rgba(200,17,31,0.15);';
      plotCanvas.width = 480;
      plotCanvas.height = 160;
      const wrapper = document.createElement('div');
      wrapper.className = 'terminal-line';
      wrapper.appendChild(plotCanvas);
      termOut.appendChild(wrapper);
      termOut.scrollTop = termOut.scrollHeight;

      const pCtx = plotCanvas.getContext('2d');
      const W = plotCanvas.width, H = plotCanvas.height;
      const padL = 36, padB = 28, padR = 16, padT = 14;
      const plotW = W - padL - padR, plotH = H - padT - padB;

      // Generate random scatter points around y = 0.7x + 0.1
      const pts = Array.from({length: 28}, () => {
        const x = Math.random();
        return { x, y: Math.max(0, Math.min(1, 0.72 * x + 0.08 + (Math.random() - 0.5) * 0.22)) };
      });

      function toCanvas(nx, ny) {
        return { cx: padL + nx * plotW, cy: padT + (1 - ny) * plotH };
      }

      function draw() {
        pCtx.clearRect(0, 0, W, H);

        // Grid
        pCtx.setLineDash([2, 4]);
        pCtx.strokeStyle = 'rgba(200,17,31,0.08)';
        pCtx.lineWidth = 0.8;
        for (let i = 1; i <= 4; i++) {
          const y = padT + (i / 4) * plotH;
          pCtx.beginPath(); pCtx.moveTo(padL, y); pCtx.lineTo(W - padR, y); pCtx.stroke();
          const x = padL + (i / 4) * plotW;
          pCtx.beginPath(); pCtx.moveTo(x, padT); pCtx.lineTo(x, padT + plotH); pCtx.stroke();
        }
        pCtx.setLineDash([]);

        // Axes
        pCtx.strokeStyle = 'rgba(0,0,0,0.4)';
        pCtx.lineWidth = 1.2;
        pCtx.beginPath();
        pCtx.moveTo(padL, padT); pCtx.lineTo(padL, padT + plotH); pCtx.lineTo(W - padR, padT + plotH);
        pCtx.stroke();

        // Axis labels
        pCtx.fillStyle = 'rgba(0,0,0,0.35)';
        pCtx.font = '7px "JetBrains Mono", monospace';
        pCtx.textAlign = 'center';
        for (let i = 0; i <= 4; i++) {
          const val = (i / 4).toFixed(2);
          const cx = padL + (i / 4) * plotW;
          pCtx.fillText(val, cx, padT + plotH + 10);
        }
        pCtx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
          const val = (i / 4).toFixed(1);
          const cy = padT + (1 - i / 4) * plotH;
          pCtx.fillText(val, padL - 4, cy + 3);
        }

        // Axis titles
        pCtx.fillStyle = 'rgba(200,17,31,0.5)';
        pCtx.font = 'bold 7px "JetBrains Mono", monospace';
        pCtx.textAlign = 'center';
        pCtx.fillText('feature_x', padL + plotW / 2, H - 4);
        pCtx.save();
        pCtx.translate(10, padT + plotH / 2);
        pCtx.rotate(-Math.PI / 2);
        pCtx.fillText('target_y', 0, 0);
        pCtx.restore();

        // Scatter points (animated reveal)
        let revealed = 0;
        function revealPts() {
          if (revealed < pts.length) {
            const p = pts[revealed];
            const { cx, cy } = toCanvas(p.x, p.y);
            pCtx.beginPath(); pCtx.arc(cx, cy, 3, 0, Math.PI * 2);
            pCtx.fillStyle = 'rgba(200,17,31,0.55)';
            pCtx.fill();
            pCtx.strokeStyle = 'rgba(200,17,31,0.25)';
            pCtx.lineWidth = 0.7;
            pCtx.stroke();
            revealed++;
            setTimeout(revealPts, 40);
          } else {
            // Draw regression line after all points revealed
            const n = pts.length;
            const mx = pts.reduce((s, p) => s + p.x, 0) / n;
            const my = pts.reduce((s, p) => s + p.y, 0) / n;
            const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
            const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
            const slope = den !== 0 ? num / den : 0;
            const intercept = my - slope * mx;
            const { cx: x1, cy: y1 } = toCanvas(0, intercept);
            const { cx: x2, cy: y2 } = toCanvas(1, slope + intercept);
            pCtx.beginPath(); pCtx.moveTo(x1, y1); pCtx.lineTo(x2, y2);
            pCtx.strokeStyle = 'rgba(59,130,246,0.75)';
            pCtx.lineWidth = 1.5;
            pCtx.stroke();

            // R² label
            const ssTot = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
            const ssRes = pts.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
            const r2 = ssTot > 0 ? (1 - ssRes / ssTot).toFixed(4) : '1.0000';
            pCtx.fillStyle = 'rgba(59,130,246,0.75)';
            pCtx.font = 'bold 8px "JetBrains Mono", monospace';
            pCtx.textAlign = 'left';
            pCtx.fillText(`ŷ = ${slope.toFixed(3)}x + ${intercept.toFixed(3)}   R² = ${r2}`, padL + 4, padT + 12);
          }
        }
        revealPts();
      }
      draw();
    }

    /* ── Simulated Model Training Loop ── */
    function startTrainingLoop() {
      const termOut = document.getElementById('terminalOutput');
      const epochs = 15;
      let ep = 0;
      printToTerminal('Initializing training pipeline...');
      printToTerminal('Model: MLPClassifier  |  Optimizer: Adam  |  lr: 0.001');
      printToTerminal('─'.repeat(52));

      function runEpoch() {
        if (ep >= epochs) {
          printToTerminal('─'.repeat(52));
          printToTerminal('✔ Training complete. Model serialized → ./checkpoints/best.pt');
          return;
        }
        const ratio = ep / (epochs - 1);
        const loss = (0.85 * Math.pow(1 - ratio, 1.8) + Math.random() * 0.018).toFixed(4);
        const acc = (42 + 56 * Math.sin(ratio * Math.PI / 2) + (Math.random() - 0.5) * 1.2).toFixed(1);
        const valLoss = (parseFloat(loss) + (Math.random() * 0.04 - 0.01)).toFixed(4);
        const valAcc = (parseFloat(acc) - Math.random() * 2.5).toFixed(1);
        const bar = '█'.repeat(Math.round(ratio * 12)) + '░'.repeat(12 - Math.round(ratio * 12));
        printToTerminal(`Ep ${String(ep + 1).padStart(2, '0')}/${epochs} [${bar}] loss:${loss} acc:${acc}% val_loss:${valLoss}`);
        ep++;
        setTimeout(runEpoch, 180 + Math.random() * 80);
      }
      setTimeout(runEpoch, 600);
    }

    function executeCommand(cmd) {
      const trimmed = cmd.trim().toLowerCase();
      printToTerminal(cmd, true);
      if (trimmed === 'clear') {
        matrixRainActive = false;
        terminalOutput.innerHTML = '<div class="terminal-line"><span class="terminal-prompt">$</span> <span>Terminal cleared. Available commands listed under \'help\'</span></div>';
      } else if (trimmed === 'matrix') {
        printToTerminal('WAKE UP, NEO... THE MATRIX HAS YOU. FOLLOW THE WHITE RABBIT.');
        setTimeout(() => startMatrixRain(), 800);
      } else if (trimmed === 'plot') {
        printToTerminal('Generating linear regression scatter plot...');
        setTimeout(() => startRegressionPlot(), 400);
      } else if (trimmed === 'train') {
        startTrainingLoop();
      } else if (commands.hasOwnProperty(trimmed)) {
        const output = commands[trimmed];
        if (output) printToTerminal(output);
        if (trimmed === 'github') {
          setTimeout(() => window.open('https://github.com/brishavrajbahak', '_blank'), 1000);
        }
      } else if (trimmed === '') {
        // do nothing
      } else {
        printToTerminal(`Command not found: ${trimmed}. Type 'help' for available commands.`);
      }
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
    /* ── Terminal Keydown Listeners (Autocomplete, Command History) ── */
    let cmdHistory = [];
    let historyIndex = -1;
    let inactivityTimer;
    /* ── Terminal & ambient sound (on by default) ── */
    let globalSoundOn = true;
    let terminalSoundOn = true;
    let ambientOn = true;
    let sharedAudioCtx = null;
    
    function getAudioCtx() {
      if (!sharedAudioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtxClass) return null;
        sharedAudioCtx = new AudioCtxClass();
      }
      if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
      return sharedAudioCtx;
    }
    
    function playKeyClick() {
      if (!terminalSoundOn || !globalSoundOn) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 880 + Math.random() * 120;
        gain.gain.value = 0.04;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
        
        // Prevent audio node leakage memory leak
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      } catch (_) { /* audio blocked */ }
    }
    
    let ambientOsc = null;
    let ambientGainNode = null;
    
    function setGlobalSound(on) {
      globalSoundOn = on;
      terminalSoundOn = on;
      ambientOn = on;
      
      const btn = document.getElementById('terminalSoundBtn');
      if (btn) {
        btn.classList.toggle('active', on);
        btn.textContent = on ? '🔊' : '🔇';
        btn.setAttribute('aria-label', on ? 'Mute all sounds' : 'Unmute all sounds');
      }
      
      if (!on) {
        if (ambientOsc) { 
          try { ambientOsc.stop(); } catch(e){} 
          ambientOsc = null; 
        }
        return;
      }
      if (ambientOsc) return; // Already running
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        ambientOsc = ctx.createOscillator();
        ambientGainNode = ctx.createGain();
        ambientOsc.type = 'sine';
        ambientOsc.frequency.value = 55;
        ambientGainNode.gain.value = 0.012;
        ambientOsc.connect(ambientGainNode);
        ambientGainNode.connect(ctx.destination);
        ambientOsc.start();
      } catch (_) {
        // Suppress initial autoplay blocks, will reactivate on gesture
      }
    }
    
    // Auto-initialize audio on first click or keypress to bypass browser restrictions
    function initDefaultAudioOnGesture() {
      const activateAudio = (e) => {
        document.removeEventListener('click', activateAudio);
        document.removeEventListener('keydown', activateAudio);
        
        // Prevent bubble collision if user's first interaction is the mute button
        const clickedBtn = e.target && e.target.closest('#terminalSoundBtn');
        if (clickedBtn) {
          globalSoundOn = false;
          setGlobalSound(false);
          return;
        }
        
        if (globalSoundOn) {
          setGlobalSound(true);
        }
      };
      document.addEventListener('click', activateAudio);
      document.addEventListener('keydown', activateAudio);
    }
    /* ── Cyber Theme Selector removed (Theme is permanently Solar Gold) ── */
    /* ── Fluid Navigation Slider Pill ── */
    function initNavSlider() {
      const navLinksContainer = document.getElementById('navLinks');
      const pill = document.getElementById('navSliderPill');
      if (!navLinksContainer || !pill) return;
      const navAnchors = navLinksContainer.querySelectorAll('a:not(.nav-cta)');

      function movePillTo(anchor) {
        const containerRect = pill.parentElement.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        pill.style.left   = (anchorRect.left - containerRect.left) + 'px';
        pill.style.top    = (anchorRect.top - containerRect.top) + 'px';
        pill.style.width  = anchorRect.width + 'px';
        pill.style.height = anchorRect.height + 'px';
        pill.classList.add('visible');
      }

      function hidePill() {
        // Snap back to active link if one exists, otherwise hide
        const activeLink = navLinksContainer.querySelector('a.active:not(.nav-cta)');
        if (activeLink) {
          movePillTo(activeLink);
        } else {
          pill.classList.remove('visible');
        }
      }

      navAnchors.forEach(a => {
        a.addEventListener('mouseenter', () => movePillTo(a));
      });
      navLinksContainer.addEventListener('mouseleave', hidePill);

      // Observe active class changes to auto-position pill on scroll
      const activeObserver = new MutationObserver(() => {
        const activeLink = navLinksContainer.querySelector('a.active:not(.nav-cta)');
        // Only update if pill is currently visible and not being hovered
        if (activeLink && !navLinksContainer.matches(':hover')) {
          movePillTo(activeLink);
        }
      });
      navAnchors.forEach(a => {
        activeObserver.observe(a, { attributes: true, attributeFilter: ['class'] });
      });
    }
    /* ── Holographic Spotlight on detail-item and skill-row ── */
    function initHoloSpotlight() {
      const targets = document.querySelectorAll('.detail-item, .skill-row');
      targets.forEach(el => {
        el.addEventListener('mousemove', e => {
          if (document.body.classList.contains('is-scrolling')) return;
          const rect = el.getBoundingClientRect();
          el.style.setProperty('--card-mx', (e.clientX - rect.left) + 'px');
          el.style.setProperty('--card-my', (e.clientY - rect.top) + 'px');
        });
      });
    }

    document.getElementById('terminalSoundBtn')?.addEventListener('click', () => setGlobalSound(!globalSoundOn));
    
    // Safety focus/click triggers to reset inactivity auto-type
    terminalInput.addEventListener('focus', resetInactivityTimer);
    terminalInput.addEventListener('click', resetInactivityTimer);
    
    terminalInput.addEventListener('keydown', e => {
      resetInactivityTimer();
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') playKeyClick();
      if (e.key === 'Enter') {
        const cmd = terminalInput.value;
        if (cmd.trim()) {
          cmdHistory.push(cmd);
          historyIndex = cmdHistory.length;
          executeCommand(cmd);
        }
        terminalInput.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (cmdHistory.length > 0 && historyIndex > 0) {
          historyIndex--;
          terminalInput.value = cmdHistory[historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (cmdHistory.length > 0 && historyIndex < cmdHistory.length - 1) {
          historyIndex++;
          terminalInput.value = cmdHistory[historyIndex];
        } else {
          historyIndex = cmdHistory.length;
          terminalInput.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const currentVal = terminalInput.value.trim().toLowerCase();
        if (currentVal) {
          const matches = Object.keys(commands).filter(cmd => cmd.startsWith(currentVal));
          if (matches.length === 1) {
            terminalInput.value = matches[0];
          } else if (matches.length > 1) {
            printToTerminal(`Possibilities: ${matches.join(', ')}`);
          }
        }
      }
    });
    
    // Inactivity Typist Demo: Auto-run whoami command if user is idle for 5s on page load
    function resetInactivityTimer() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (terminalOutput.children.length <= 1 && !terminalInput.value.trim()) {
          typeDemoCommand("whoami");
        }
      }, 5000);
    }
    function typeDemoCommand(cmdText) {
      let index = 0;
      terminalInput.disabled = true;
      terminalInput.placeholder = "Auto-typing...";
      function type() {
        if (index < cmdText.length) {
          terminalInput.value += cmdText[index];
          index++;
          setTimeout(type, 140);
        } else {
          setTimeout(() => {
            terminalInput.disabled = false;
            terminalInput.placeholder = "whoami";
            cmdHistory.push(cmdText);
            historyIndex = cmdHistory.length;
            executeCommand(cmdText);
            terminalInput.value = "";
          }, 500);
        }
      }
      type();
    }
    // Input autofocus trigger
    terminalOutput.addEventListener('click', () => {
      terminalInput.focus();
    });
    /* ── Toast Notifications ── */
    function showToast(msg, type) {
      const toast = document.getElementById('toast');
      document.getElementById('toastIcon').textContent = type === 'error' ? '✕' : '✓';
      document.getElementById('toastMsg').textContent  = msg;
      toast.className = 'toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 5000);
    }
    window.showToast = showToast;
    /* ── Live Clock (NPT) — updates every second ── */
    function updateClock() {
      const timeEl = document.getElementById('navTime');
      if (!timeEl) return;
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      // NPT is UTC + 5:45
      const npt = new Date(utc + (3600000 * 5.75));
      const hh = String(npt.getHours()).padStart(2, '0');
      const mm = String(npt.getMinutes()).padStart(2, '0');
      const ss = String(npt.getSeconds()).padStart(2, '0');
      timeEl.textContent = `${hh}:${mm}:${ss}`;
    }
    updateClock();
    setInterval(updateClock, 1000);
    /* ── SKILL RADAR CHART ── */
    function initSkillRadar() {
      const canvas = document.getElementById('skillRadar');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const cw = canvas.width;
      const ch = canvas.height;
      const cx = cw / 2;
      const cy = ch / 2;
      const radius = 130;
      
      const skills = [
        { name: 'Machine Learning', val: 0.95 },
        { name: 'Data Pipelines', val: 0.85 },
        { name: 'Deep Learning', val: 0.88 },
        { name: 'Cloud (MLOps)', val: 0.80 },
        { name: 'Statistics', val: 0.82 }
      ];
      
      const sides = skills.length;
      const angleStep = (Math.PI * 2) / sides;
      
      // Resolve dynamic theme colors from document variables (fixes static gold radar bug)
      const rootStyle = getComputedStyle(document.documentElement);
      const cyanColor = rootStyle.getPropertyValue('--cyan').trim() || '#ffb703';
      const pinkColor = rootStyle.getPropertyValue('--pink').trim() || '#fb8500';
      
      const gridColor = cyanColor.startsWith('#') ? cyanColor + '1a' : 'rgba(255, 183, 3, 0.1)';
      const dataFill  = pinkColor.startsWith('#') ? pinkColor + '33' : 'rgba(251, 133, 0, 0.2)';
      const dataStroke = pinkColor.startsWith('#') ? pinkColor + 'cc' : 'rgba(251, 133, 0, 0.8)';
      
      function drawPolygon(r, fillStyle, strokeStyle, lineWidth) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const a = i * angleStep - Math.PI / 2;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        if (fillStyle) {
          ctx.fillStyle = fillStyle;
          ctx.fill();
        }
        if (strokeStyle) {
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = lineWidth || 1;
          ctx.stroke();
        }
      }
      
      // Clear canvas prior to redrawing (prevents layout overlap)
      ctx.clearRect(0, 0, cw, ch);
      
      // Draw grid
      for (let i = 1; i <= 5; i++) {
        drawPolygon(radius * (i / 5), null, gridColor, 1);
      }
      
      // Draw axes
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const a = i * angleStep - Math.PI / 2;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
      }
      ctx.strokeStyle = gridColor;
      ctx.stroke();
      
      // Draw data
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const a = i * angleStep - Math.PI / 2;
        const r = radius * skills[i].val;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = dataFill;
      ctx.fill();
      ctx.strokeStyle = dataStroke;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw labels
      ctx.fillStyle = cyanColor; // Correctly resolves the CSS color dynamically
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < sides; i++) {
        const a = i * angleStep - Math.PI / 2;
        const labelR = radius + 35;
        const x = cx + Math.cos(a) * labelR;
        const y = cy + Math.sin(a) * labelR;
        ctx.fillText(skills[i].name, x, y);
      }
    }
    initSkillRadar();

    /* ── Animated Theme-Synced Favicon (Creative Edition) ── */
    function initAnimatedFavicon() {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      let frame = 0;
      const particles = [
        { angle: 0, speed: 0.07, radius: 11.5, size: 1.2 },
        { angle: 2.09, speed: 0.055, radius: 11.5, size: 1.0 },
        { angle: 4.19, speed: 0.04, radius: 11.5, size: 0.9 }
      ];
      
      function hexToRgba(hex, alpha) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      
      function drawHex(cx, cy, r, rotation) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i + rotation;
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      }
      
      function render() {
        frame++;
        ctx.clearRect(0, 0, 32, 32);
        
        const rootStyle = getComputedStyle(document.documentElement);
        const color = rootStyle.getPropertyValue('--cyan').trim() || '#e63946';
        const pink = rootStyle.getPropertyValue('--pink').trim() || '#ff0080';
        
        const cx = 16, cy = 16;
        const t = frame * 0.04;
        const pulse = 0.85 + 0.15 * Math.sin(t * 1.5);
        
        // Layer 1: Solid Dark Cyber Backing Shield (ensures extreme visibility on light/dark tabs)
        ctx.save();
        ctx.fillStyle = '#050514';
        ctx.shadowColor = hexToRgba(color, 0.4);
        ctx.shadowBlur = 4;
        drawHex(cx, cy, 14.5, t * 0.08);
        ctx.fill();
        ctx.restore();
        
        // Layer 2: Two-tone Glowing Hexagonal Border
        ctx.save();
        ctx.lineWidth = 1.8;
        
        // Outer pulsing ring
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 3 * pulse;
        drawHex(cx, cy, 14.5, t * 0.08);
        ctx.stroke();
        
        // Inner contrast ring
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = pink;
        ctx.shadowColor = pink;
        ctx.shadowBlur = 2;
        drawHex(cx, cy, 12.5, -t * 0.05);
        ctx.stroke();
        ctx.restore();
        
        // Layer 3: High-contrast sharp particles orbiting outside the text zone
        particles.forEach((p, i) => {
          p.angle += p.speed;
          const px = cx + p.radius * Math.cos(p.angle);
          const py = cy + p.radius * Math.sin(p.angle);
          
          // Crisp trail
          for (let g = 2; g >= 1; g--) {
            const ga = p.angle - p.speed * g * 2.5;
            const gx = cx + p.radius * Math.cos(ga);
            const gy = cy + p.radius * Math.sin(ga);
            ctx.beginPath();
            ctx.arc(gx, gy, p.size * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = i === 1 ? pink : color;
            ctx.globalAlpha = 0.15 * (3 - g);
            ctx.fill();
          }
          
          // Main particle
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = i === 1 ? pink : color;
          ctx.shadowColor = i === 1 ? pink : color;
          ctx.shadowBlur = 3;
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        
        // Layer 4: Bold, Ultra-Legible Monogram in "Orbitron"
        ctx.save();
        ctx.font = '900 12.5px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Solid black backing shadow to separate letters from any particles behind them
        ctx.fillStyle = '#000000';
        ctx.fillText('BR', cx + 1, cy + 1.5);
        ctx.fillText('BR', cx - 0.5, cy + 0.5);
        
        // Ultra-bright glowing white foreground
        ctx.shadowColor = color;
        ctx.shadowBlur = 5 * pulse;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('BR', cx, cy + 0.5);
        ctx.restore();
        
        // Push to favicon via DOM node recycling
        let link = document.querySelector("link[rel~='icon']");
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.type = 'image/png';
        newLink.href = canvas.toDataURL('image/png');
        if (link) document.head.removeChild(link);
        document.head.appendChild(newLink);
      }
      
      // ~15 FPS for silky smooth animation
      setInterval(render, 66);
    }

    /* ── Creative Resume Download Experience ── */
    (function initResumeDownload() {
      // Create the modal HTML
      const overlay = document.createElement('div');
      overlay.className = 'resume-overlay';
      overlay.id = 'resumeOverlay';
      overlay.innerHTML = `
        <div class="resume-modal">
          <div class="resume-modal-header">
            <div class="r-dot red"></div>
            <div class="r-dot yellow"></div>
            <div class="r-dot green"></div>
            <span class="resume-modal-title">dossier_compiler.sh — CLASSIFIED</span>
            <button class="resume-modal-close" id="resumeClose" aria-label="Close">&times;</button>
          </div>
          <div class="resume-modal-body" id="resumeBody">
            <div class="resume-scan-line"></div>
          </div>
          <div class="resume-footer">
            <div class="resume-footer-status">
              <div class="blink-dot"></div>
              <span id="resumeStatus">STANDBY</span>
            </div>
            <span id="resumeVersion">v4.2.0 // CLASSIFIED</span>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const body = document.getElementById('resumeBody');
      const status = document.getElementById('resumeStatus');
      const closeBtn = document.getElementById('resumeClose');

      function addLine(html, delay) {
        return new Promise(resolve => {
          setTimeout(() => {
            const div = document.createElement('div');
            div.className = 'resume-line';
            div.innerHTML = html;
            body.appendChild(div);
            body.scrollTop = body.scrollHeight;
            resolve();
          }, delay);
        });
      }

      function hexToRgba(colorStr, alpha) {
        colorStr = colorStr.trim();
        if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
          return colorStr.replace(/[\d\.]+\)$/g, `${alpha})`);
        }
        let hex = colorStr.replace('#', '');
        if (hex.length === 3 || hex.length === 4) {
          hex = hex.split('').map(char => char + char).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      let nnVisualizer = null;

      function animateNeuralNet() {
        let isRunning = true;
        const canvas = document.getElementById('resumeNeuralNetCanvas');
        if (!canvas) return { setSpeed: () => {}, stop: () => {} };
        const ctx = canvas.getContext('2d');

        // Get colors dynamically
        const styles = getComputedStyle(document.documentElement);
        const cyan = styles.getPropertyValue('--cyan').trim() || '#e63946';
        const pink = styles.getPropertyValue('--pink').trim() || '#ff0080';

        // Nodes coordinates inside 160x160 canvas
        const inputs = [
          { x: 30, y: 40, pulse: 0 },
          { x: 30, y: 80, pulse: 0 },
          { x: 30, y: 120, pulse: 0 }
        ];
        const hiddens = [
          { x: 80, y: 25, pulse: 0 },
          { x: 80, y: 62, pulse: 0 },
          { x: 80, y: 98, pulse: 0 },
          { x: 80, y: 135, pulse: 0 }
        ];
        const output = { x: 130, y: 80, pulse: 0 };

        if (sitePerf.isLow) {
          ctx.clearRect(0, 0, 160, 160);
          ctx.lineWidth = 1;
          inputs.forEach(inp => {
            hiddens.forEach(hid => {
              ctx.strokeStyle = hexToRgba(cyan, 0.12);
              ctx.beginPath();
              ctx.moveTo(inp.x, inp.y);
              ctx.lineTo(hid.x, hid.y);
              ctx.stroke();
            });
          });
          hiddens.forEach(hid => {
            ctx.strokeStyle = hexToRgba(pink, 0.12);
            ctx.beginPath();
            ctx.moveTo(hid.x, hid.y);
            ctx.lineTo(output.x, output.y);
            ctx.stroke();
          });
          [...inputs, ...hiddens, output].forEach((node, i) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, i === inputs.length + hiddens.length ? 5 : 4, 0, Math.PI * 2);
            ctx.fillStyle = i === inputs.length + hiddens.length ? pink : cyan;
            ctx.fill();
          });
          return { setSpeed: () => {}, stop: () => {} };
        }

        // Particles traveling along connections
        let particles = [];
        let time = 0;
        let speedMultiplier = 1.0;

        function spawnInputParticle() {
          if (!isRunning) return;
          const inputIdx = Math.floor(Math.random() * inputs.length);
          const hiddenIdx = Math.floor(Math.random() * hiddens.length);
          particles.push({
            type: 'input-to-hidden',
            start: inputs[inputIdx],
            end: hiddens[hiddenIdx],
            progress: 0,
            speed: (0.02 + Math.random() * 0.015) * speedMultiplier
          });
        }

        // Spawn initial particles
        for (let i = 0; i < 6; i++) {
          spawnInputParticle();
          if (particles[i]) particles[i].progress = Math.random();
        }

        function draw() {
          if (!isRunning) return;
          ctx.clearRect(0, 0, 160, 160);
          time += 0.05;

          // Draw connection weights (lines)
          ctx.lineWidth = 1;
          
          // Inputs to hiddens
          inputs.forEach(inp => {
            hiddens.forEach(hid => {
              ctx.strokeStyle = hexToRgba(cyan, 0.12);
              ctx.beginPath();
              ctx.moveTo(inp.x, inp.y);
              ctx.lineTo(hid.x, hid.y);
              ctx.stroke();
            });
          });

          // Hiddens to output
          hiddens.forEach(hid => {
            ctx.strokeStyle = hexToRgba(pink, 0.12);
            ctx.beginPath();
            ctx.moveTo(hid.x, hid.y);
            ctx.lineTo(output.x, output.y);
            ctx.stroke();
          });

          // Update and draw particles
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.progress += p.speed;
            
            // Draw particle
            const px = p.start.x + (p.end.x - p.start.x) * p.progress;
            const py = p.start.y + (p.end.y - p.start.y) * p.progress;

            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = p.type === 'input-to-hidden' ? cyan : pink;
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Handle particle arrival
            if (p.progress >= 1.0) {
              p.end.pulse = 1.0;
              
              if (p.type === 'input-to-hidden') {
                // Spawn particle from hidden to output
                particles.push({
                  type: 'hidden-to-output',
                  start: p.end,
                  end: output,
                  progress: 0,
                  speed: (0.025 + Math.random() * 0.015) * speedMultiplier
                });
              }
              particles.splice(i, 1);
            }
          }

          // Maintain active input particle count
          const inputCount = particles.filter(p => p.type === 'input-to-hidden').length;
          if (inputCount < 5) {
            spawnInputParticle();
          }

          // Draw Nodes
          // Input nodes
          inputs.forEach(inp => {
            inp.pulse *= 0.9;
            ctx.beginPath();
            ctx.arc(inp.x, inp.y, 4 + inp.pulse * 2, 0, Math.PI * 2);
            ctx.fillStyle = cyan;
            ctx.fill();
            if (inp.pulse > 0.05) {
              ctx.strokeStyle = hexToRgba(cyan, inp.pulse);
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          });

          // Hidden nodes
          hiddens.forEach(hid => {
            hid.pulse *= 0.9;
            const size = 5 + hid.pulse * 3;
            ctx.beginPath();
            ctx.arc(hid.x, hid.y, size, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(cyan, 0.4);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(hid.x, hid.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = cyan;
            ctx.fill();
            
            if (hid.pulse > 0.05) {
              ctx.strokeStyle = hexToRgba(cyan, hid.pulse);
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          });

          // Output node
          output.pulse *= 0.92;
          const outSize = 6 + output.pulse * 4 + 1.2 * Math.sin(time * 3);
          ctx.beginPath();
          ctx.arc(output.x, output.y, outSize, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(pink, 0.3 + output.pulse * 0.3);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(output.x, output.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = pink;
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          if (output.pulse > 0.05) {
            ctx.strokeStyle = hexToRgba(pink, output.pulse);
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          requestAnimationFrame(draw);
        }

        requestAnimationFrame(draw);

        return {
          setSpeed: (val) => { speedMultiplier = val; },
          stop: () => { isRunning = false; }
        };
      }

      async function runSequence() {
        // Clear previous
        body.innerHTML = '<div class="resume-scan-line"></div>';
        status.textContent = 'INITIALIZING';

        await addLine('<span class="r-accent">$</span> <span class="r-label">Initializing secure handshake...</span>', 300);
        await addLine('<span class="r-ok">✔</span> <span class="r-label">TLS 1.3 tunnel established</span>', 600);
        await addLine('<span class="r-accent">$</span> <span class="r-label">Authenticating recruiter clearance...</span>', 500);
        
        status.textContent = 'SCANNING';
        await addLine('<span class="r-ok">✔</span> <span class="r-label">Access level: </span><span class="r-value">FULL DOSSIER</span>', 700);
        await addLine('', 200);
        await addLine('<span class="r-accent">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', 100);
        await addLine('<span class="r-pink">⟐ CANDIDATE PROFILE SCAN</span>', 400);
        await addLine('<span class="r-accent">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', 100);
        await addLine('', 150);
        
        status.textContent = 'VERIFYING';
        await addLine('<span class="r-label">  Name     :</span> <span class="r-value">Brishav Rajbahak</span>', 350);
        await addLine('<span class="r-label">  Alias    :</span> <span class="r-value">@brishavrajbahak</span>', 300);
        await addLine('<span class="r-label">  Origin   :</span> <span class="r-value">Kathmandu, Nepal 🇳🇵</span>', 300);
        await addLine('<span class="r-label">  Class    :</span> <span class="r-value">Data Scientist / ML Engineer</span>', 300);
        await addLine('<span class="r-label">  Status   :</span> <span class="r-ok">● OPEN TO WORK</span>', 300);
        await addLine('', 200);

        status.textContent = 'ANALYZING';
        await addLine('<span class="r-accent">⟐</span> <span class="r-label">Scanning skill matrix...</span>', 400);

        // Render the visualization layout container (ML training logs + Neural Net canvas)
        const analysisContainer = document.createElement('div');
        analysisContainer.className = 'resume-analysis-container';
        analysisContainer.innerHTML = `
          <div class="resume-ml-log" id="resumeMlLog"></div>
          <div class="resume-nn-container">
            <canvas id="resumeNeuralNetCanvas" width="160" height="160"></canvas>
          </div>
        `;
        body.appendChild(analysisContainer);
        body.scrollTop = body.scrollHeight;

        // Initialize the Neural Network animation
        nnVisualizer = animateNeuralNet();

        // Helper to output scrolling training logs
        const mlLog = document.getElementById('resumeMlLog');
        function addLogLine(text, typeClass) {
          const div = document.createElement('div');
          div.className = `ml-log-line ${typeClass || ''}`;
          div.innerHTML = text;
          mlLog.appendChild(div);
          mlLog.scrollTop = mlLog.scrollHeight;
        }

        // Run training logs simulation sequence
        addLogLine('<span class="ml-tag-system">[SYS]</span> Initializing Deep neural_net_classifier.bin...', 'ml-tag-system');
        await new Promise(r => setTimeout(r, 250));
        addLogLine('<span class="ml-tag-system">[SYS]</span> Layers: Input (3) ➔ Hidden (4) ➔ Output (1)', 'ml-tag-system');
        await new Promise(r => setTimeout(r, 200));
        addLogLine('<span class="ml-tag-train">[TRAIN]</span> Optimizing connection weights (Adam, lr=0.003)...', 'ml-tag-train');
        await new Promise(r => setTimeout(r, 300));

        // Epochs training sequence loop
        const totalEpochs = 20;
        for (let e = 1; e <= totalEpochs; e++) {
          const ratio = (e - 1) / (totalEpochs - 1);
          // Decrease loss exponentially, increase accuracy logarithmically/sinusoidally
          const loss = (0.78 * Math.pow(1 - ratio, 2) + Math.random() * 0.02).toFixed(4);
          const acc = (35.4 + 64.4 * Math.sin(ratio * Math.PI / 2) + Math.random() * 0.4).toFixed(1);

          // Stagger visualizer speed multiplier dynamically
          if (e === 5) nnVisualizer.setSpeed(2.2);
          if (e === 12) nnVisualizer.setSpeed(3.2);
          if (e === 17) nnVisualizer.setSpeed(1.0);

          addLogLine(`Epoch [${e.toString().padStart(2, '0')}/${totalEpochs}] ➔ <span class="ml-tag-metric">Loss: ${loss}</span> | <span class="ml-tag-train">Accuracy: ${acc}%</span>`);
          
          // Stagger delay between epochs
          await new Promise(r => setTimeout(r, 80 + Math.random() * 50));
        }

        nnVisualizer.setSpeed(0.4);
        addLogLine('<span class="ml-tag-success">[SUCCESS]</span> Model converged. Loss below threshold.', 'ml-tag-success');
        await new Promise(r => setTimeout(r, 250));
        addLogLine('<span class="ml-tag-success">[CLASSIFY]</span> Fit: 99.8% OPTIMAL CANDIDATE MATCHED', 'ml-tag-success');
        await new Promise(r => setTimeout(r, 450));

        status.textContent = 'COMPILING';
        await addLine('<span class="r-accent">⟐</span> <span class="r-label">Compiling dossier package...</span>', 400);

        // Add progress bar
        const progressWrap = document.createElement('div');
        progressWrap.className = 'resume-progress-bar';
        progressWrap.innerHTML = '<div class="resume-progress-fill" id="resumeProgress"></div>';
        body.appendChild(progressWrap);

        const fill = document.getElementById('resumeProgress');
        for (let i = 0; i <= 100; i += 2) {
          await new Promise(r => setTimeout(r, 40));
          fill.style.width = i + '%';
        }

        await addLine('', 200);
        await addLine('<span class="r-ok">✔</span> <span class="r-value">Dossier compiled successfully</span>', 300);
        await addLine('<span class="r-ok">✔</span> <span class="r-label">Integrity hash: </span><span class="r-accent">SHA-256:OK</span>', 200);

        status.textContent = 'COMPLETE';

        // Show success badge
        const badge = document.createElement('div');
        badge.className = 'resume-complete-badge show';
        badge.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span class="resume-complete-text">DOSSIER COMPILED — Access granted. Contact to request full credentials.</span>
        `;
        body.appendChild(badge);
        body.scrollTop = body.scrollHeight;


      }

      // Intercept all download buttons
      document.querySelectorAll('a[title="Download Resume"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          overlay.classList.add('active');
          runSequence();
        });
      });

      // Close modal
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        if (nnVisualizer && nnVisualizer.stop) nnVisualizer.stop();
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          if (nnVisualizer && nnVisualizer.stop) nnVisualizer.stop();
        }
      });
    })();
  

    (() => {
      const peakData = {
        1: {
          tag: '▲ SUMMIT',
          timeline: '2024 — PRESENT',
          role: 'Senior Data Scientist',
          company: 'Nexus AI Lab · Kathmandu',
          desc: 'Architecting distributed machine learning models and predictive pipelines. Leading a team of 4 ML engineers to optimize NLP and computer vision deployments.',
          skills: ['Python', 'TensorFlow', 'PyTorch', 'Docker', 'Kubernetes', 'MLOps'],
          borderColor: 'var(--cyan)'
        },
        2: {
          tag: '▲ CAMP II',
          timeline: '2022 — 2024',
          role: 'Machine Learning Engineer',
          company: 'Quantum Analytics · Remote',
          desc: 'Developed scalable predictive models and deep learning pipelines. Integrated advanced data processing and reduced model inference time by 30%.',
          skills: ['Python', 'Scikit-Learn', 'Pandas', 'AWS', 'Spark', 'SQL'],
          borderColor: 'var(--pink)'
        },
        3: {
          tag: '▲ BASE CAMP',
          timeline: '2021 — 2022',
          role: 'Data Analyst',
          company: 'Everest Data Insights · Kathmandu',
          desc: 'Performed exploratory data analysis, built interactive dashboards, and collaborated with stakeholders to drive data-informed decision-making.',
          skills: ['Python', 'SQL', 'Tableau', 'Excel', 'Statistics', 'R'],
          borderColor: 'rgba(59,130,246,0.8)'
        }
      };

      const hotspots = document.querySelectorAll('.peak-hotspot');
      const card = document.getElementById('peakDetailsCard');
      if (!hotspots.length || !card) return;

      function activatePeak(peakId) {
        const data = peakData[peakId];
        if (!data) return;

        // Update active state on hotspots
        hotspots.forEach(h => h.classList.remove('active'));
        document.querySelector(`.peak-hotspot[data-peak="${peakId}"]`)?.classList.add('active');

        // Animate card out, swap, animate in
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';

        setTimeout(() => {
          document.getElementById('peakTag').textContent = data.tag;
          document.getElementById('peakTimeline').textContent = data.timeline;
          document.getElementById('peakRole').textContent = data.role;
          document.getElementById('peakCompany').textContent = data.company;
          document.getElementById('peakDesc').textContent = data.desc;
          card.style.borderLeftColor = data.borderColor;

          const skillsEl = document.getElementById('peakSkills');
          skillsEl.innerHTML = data.skills.map(s => `<span class="p-skill">${s}</span>`).join('');

          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 250);
      }

      hotspots.forEach(h => {
        const peakId = h.getAttribute('data-peak');
        h.addEventListener('click', () => activatePeak(peakId));
        h.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activatePeak(peakId);
          }
        });
      });

      // Make card transition smooth
      card.style.transition = 'opacity 0.25s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.4s';
    })();
  

  (() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let entranceStarted = false;

    function triggerEntrance() {
      if (entranceStarted) return;
      entranceStarted = true;
      document.querySelectorAll('.glass-panel').forEach(p => p.classList.add('visible'));
      if (!prefersReduced && sitePerf.glassPanels) startAllAnimations();
    }
    if (document.body.classList.contains('page-loaded')) {
      triggerEntrance();
    } else {
      const obs = new MutationObserver((_, o) => {
        if (document.body.classList.contains('page-loaded')) { triggerEntrance(); o.disconnect(); }
      });
      obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      setTimeout(triggerEntrance, 2500);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, window.sitePerformance?.dprCap || 2);
    function setupCanvas(canvas) {
      const w = canvas.offsetWidth  || parseInt(canvas.getAttribute('width'))  || 200;
      const h = canvas.offsetHeight || parseInt(canvas.getAttribute('height')) || 120;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, w, h };
    }
    function lerp(a,b,t){ return a+(b-a)*t; }
    function ease(t){ return t<.5?2*t*t:-1+(4-2*t)*t; }
    const panelFrameInterval = sitePerf.isHigh ? 1000 / 30 : 1000 / 15;

    /* ── PANEL 1: Neural Network ── */
    function initNeural() {
      const canvas = document.getElementById('gpNeuralCanvas');
      if (!canvas) return;
      const {ctx,w,h} = setupCanvas(canvas);
      const layers = [3,5,4,3];
      const lx = [.10,.36,.64,.90];
      const nodes = layers.map((n,li) =>
        Array.from({length:n},(_,ni)=>({
          x: w*lx[li],
          y: h*(0.10 + (ni/(n-1||1))*0.80)
        }))
      );
      const particles = [];
      function spawn() {
        const li = Math.floor(Math.random()*(layers.length-1));
        const f = nodes[li][Math.floor(Math.random()*nodes[li].length)];
        const t = nodes[li+1][Math.floor(Math.random()*nodes[li+1].length)];
        particles.push({f,t,li,p:Math.random(),sp:0.013+Math.random()*0.013});
      }
      for(let i=0;i<6;i++) spawn();

      let lastDraw = 0;
      function draw(ts) {
        if (ts - lastDraw < panelFrameInterval) {
          requestAnimationFrame(draw);
          return;
        }
        lastDraw = ts;
        ctx.clearRect(0,0,w,h);
        const now = ts*.001;
        // edges
        nodes.forEach((col,li)=>{ if(li>=nodes.length-1)return;
          col.forEach(a=>nodes[li+1].forEach(b=>{
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
            ctx.strokeStyle='rgba(200,17,31,0.07)'; ctx.lineWidth=.5; ctx.stroke();
          }));
        });
        // particles
        for(let i=particles.length-1;i>=0;i--){
          const p=particles[i]; p.p+=p.sp;
          if(p.p>=1){particles.splice(i,1);spawn();continue;}
          const px=lerp(p.f.x,p.t.x,ease(p.p)), py=lerp(p.f.y,p.t.y,ease(p.p));
          const a=Math.sin(p.p*Math.PI)*0.50;
          ctx.beginPath(); ctx.arc(px,py,2.5,0,Math.PI*2);
          ctx.fillStyle=`rgba(200,17,31,${a})`; ctx.fill();
          ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2);
          ctx.fillStyle=`rgba(200,17,31,${a*.18})`; ctx.fill();
        }
        // nodes
        nodes.forEach((col,li)=>col.forEach((n,ni)=>{
          const pulse=.5+.5*Math.sin(now*1.5+li*1.3+ni*.8);
          const r=3+pulse*1.5;
          ctx.beginPath(); ctx.arc(n.x,n.y,r*2,0,Math.PI*2);
          ctx.fillStyle=`rgba(200,17,31,${.03+pulse*.06})`; ctx.fill();
          ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2);
          ctx.fillStyle=`rgba(200,17,31,${.14+pulse*.18})`; ctx.fill();
        }));
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    }

    /* ── PANEL 2: Live Scrolling Line Chart ── */
    function initLineChart() {
      const canvas = document.getElementById('gpLineCanvas');
      const valEl  = document.getElementById('gpLiveVal');
      if (!canvas) return;
      const {ctx,w,h} = setupCanvas(canvas);
      const pts = 55;
      const loss=[],acc=[],f1=[];
      for(let i=0;i<pts;i++){
        const b=(pts-i)/pts;
        loss.push(.08+b*.72+(Math.random()-.5)*.06);
        acc.push(.55+(1-b)*.38+(Math.random()-.5)*.04);
        f1.push(acc[acc.length-1]-0.05+(Math.random()-.5)*.02);
      }
      function drawLine(data,color,dashArr){
        ctx.beginPath();
        ctx.setLineDash(dashArr);
        data.forEach((v,i)=>{
          const x=(i/(pts-1))*w, y=h*(1-v)*.88+h*.06;
          i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        });
        ctx.strokeStyle=color; ctx.lineWidth=1.2; ctx.stroke();
        ctx.setLineDash([]);
      }
      let last=0;
      let lastDraw=0;
      function draw(ts){
        if (ts - lastDraw < panelFrameInterval) {
          requestAnimationFrame(draw);
          return;
        }
        lastDraw = ts;
        if(ts-last>90){ last=ts;
          loss.push(Math.max(.04,loss[loss.length-1]+(Math.random()-.52)*.018)); loss.shift();
          acc.push(Math.min(.97,acc[acc.length-1]+(Math.random()-.46)*.012));   acc.shift();
          f1.push(Math.min(.95,acc[acc.length-1]-0.03+(Math.random()-.5)*.015)); f1.shift();
          ctx.clearRect(0,0,w,h);
          [.25,.5,.75].forEach(v=>{
            const y=h*(1-v)*.88+h*.06;
            ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y);
            ctx.strokeStyle='rgba(0,0,0,0.05)'; ctx.lineWidth=.5; ctx.stroke();
          });
          drawLine(loss,'rgba(200,17,31,0.35)',[]);
          drawLine(acc,'rgba(59,130,246,0.28)',[4,4]);
          drawLine(f1,'rgba(200,146,10,0.45)',[2,2]);
          if(valEl) valEl.textContent=(acc[acc.length-1]*100).toFixed(1)+'%';
        }
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    }

    /* ── PANEL 3: Hardware Telemetry (Bar Chart) ── */
    function initHardware() {
      const canvas = document.getElementById('gpHardwareCanvas');
      if (!canvas) return;
      const {ctx,w,h} = setupCanvas(canvas);
      
      const bars = [
        { label: 'GPU-0', val: 0.8, nxt: 0.8, color: 'rgba(200,17,31,' },
        { label: 'GPU-1', val: 0.6, nxt: 0.6, color: 'rgba(200,17,31,' },
        { label: 'MEM-0', val: 0.4, nxt: 0.4, color: 'rgba(200,146,10,' },
        { label: 'MEM-1', val: 0.3, nxt: 0.3, color: 'rgba(200,146,10,' },
        { label: 'CPU',   val: 0.2, nxt: 0.2, color: 'rgba(59,130,246,' }
      ];
      
      let last = 0;
      let lastDraw = 0;
      function draw(ts) {
        if (ts - lastDraw < panelFrameInterval) {
          requestAnimationFrame(draw);
          return;
        }
        lastDraw = ts;
        if(ts-last>150){ 
          last=ts;
          bars.forEach(b => {
            b.nxt = Math.max(0.1, Math.min(0.95, b.nxt + (Math.random() - 0.5) * 0.35));
          });
        }
        
        ctx.clearRect(0,0,w,h);
        
        const bw = (w - 20) / bars.length;
        bars.forEach((b, i) => {
          b.val += (b.nxt - b.val) * 0.15; // smooth interpolation
          const bh = b.val * (h - 25);
          const x = 10 + i * bw + bw*0.15;
          const barW = bw * 0.7;
          
          // Background track
          ctx.fillStyle = 'rgba(0,0,0,0.03)';
          ctx.fillRect(x, 5, barW, h - 30);
          
          // Fill
          ctx.fillStyle = b.color + '0.45)';
          ctx.fillRect(x, h - 25 - bh, barW, bh);
          
          // Label
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(b.label, x + barW/2, h - 5);
          
          // Value
          ctx.fillText(Math.floor(b.val * 100) + '%', x + barW/2, h - 25 - bh - 3);
        });
        
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    }


    /* ── PANEL 4: Rotating Donut ── */
    function initDonut() {
      const canvas = document.getElementById('gpDonutCanvas');
      if (!canvas) return;
      const {ctx,w,h} = setupCanvas(canvas);
      const cx=w/2, cy=h/2-4, oR=Math.min(w,h)*.38, iR=oR*.54;
      const slices=[
        {label:'Train',c:'rgba(200,17,31,',cur:.70,nxt:.70},
        {label:'Val',  c:'rgba(200,146,10,',cur:.15,nxt:.15},
        {label:'Test', c:'rgba(59,130,246,', cur:.15,nxt:.15},
      ];
      let rot=-Math.PI/2, mt=0;
      let lastDraw = 0;

      function draw(ts){
        if (ts - lastDraw < panelFrameInterval) {
          requestAnimationFrame(draw);
          return;
        }
        lastDraw = ts;
        ctx.clearRect(0,0,w,h);
        rot+=.002; mt=Math.min(1,mt+.004);
        if(mt>=1){ mt=0; slices.forEach((s,i)=>s.cur=s.nxt);
          const r1=.55+Math.random()*.20, r2=(1-r1)*(.4+Math.random()*.3);
          slices[0].nxt=r1; slices[1].nxt=r2; slices[2].nxt=1-r1-r2;
        }
        const vals=slices.map(s=>lerp(s.cur,s.nxt,ease(mt)));
        const total=vals.reduce((a,b)=>a+b,0);
        let sa=rot;
        slices.forEach((s,i)=>{
          const sw=(vals[i]/total)*Math.PI*2;
          ctx.beginPath(); ctx.moveTo(cx,cy);
          ctx.arc(cx,cy,oR,sa,sa+sw);
          ctx.arc(cx,cy,iR,sa+sw,sa,true); ctx.closePath();
          ctx.fillStyle=s.c+'0.22)'; ctx.strokeStyle=s.c+'0.38)'; ctx.lineWidth=.7;
          ctx.fill(); ctx.stroke(); sa+=sw;
        });
        ctx.font='bold 10px monospace'; ctx.textAlign='center';
        ctx.fillStyle='rgba(0,0,0,0.26)'; ctx.fillText('DATA',cx,cy+2);
        ctx.font='7px monospace'; ctx.fillStyle='rgba(0,0,0,0.16)';
        ctx.fillText('SPLIT',cx,cy+12);
        // legend
        const ly=h-13;
        slices.forEach((s,i)=>{
          const lx=10+i*(w/3);
          ctx.fillStyle=s.c+'0.42)'; ctx.fillRect(lx,ly,7,4);
          ctx.font='7px monospace'; ctx.textAlign='left';
          ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillText(s.label,lx+9,ly+4);
        });
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    }

    /* ── PANEL 5: Data Pipeline Flow ── */
    function initPipeline() {
      const canvas = document.getElementById('gpPipelineCanvas');
      if (!canvas) return;
      const {ctx,w,h} = setupCanvas(canvas);
      const stages=[
        {label:'DATA',  c:'rgba(59,130,246,'},
        {label:'CLEAN', c:'rgba(200,146,10,'},
        {label:'FEAT',  c:'rgba(200,17,31,'  },
        {label:'MODEL', c:'rgba(59,130,246,'},
        {label:'EVAL',  c:'rgba(22,163,74,'  },
      ];
      const n=stages.length, sp=h/(n+.5), nr=10;
      const pos=i=>({x:w/2, y:sp*(i+.8)});
      const parts=[];
      function spawn(){ parts.push({si:0,t:Math.random()*.8,sp:.015+Math.random()*.012}); }
      for(let i=0;i<4;i++) spawn();

      let lastDraw = 0;
      function draw(ts){
        if (ts - lastDraw < panelFrameInterval) {
          requestAnimationFrame(draw);
          return;
        }
        lastDraw = ts;
        ctx.clearRect(0,0,w,h);
        const now=ts*.001;
        // connector lines
        for(let i=0;i<n-1;i++){
          const a=pos(i),b=pos(i+1);
          ctx.beginPath(); ctx.moveTo(a.x,a.y+nr); ctx.lineTo(b.x,b.y-nr);
          ctx.setLineDash([2,3]); ctx.strokeStyle='rgba(0,0,0,0.07)'; ctx.lineWidth=1; ctx.stroke();
          ctx.setLineDash([]);
        }
        // particles
        for(let i=parts.length-1;i>=0;i--){
          const p=parts[i]; p.t+=p.sp;
          if(p.t>=1){ p.si++; p.t=0; if(p.si>=n-1){parts.splice(i,1);spawn();continue;} }
          const a=pos(p.si),b=pos(p.si+1);
          const py=lerp(a.y+nr,b.y-nr,ease(p.t));
          const alpha=.45+.25*Math.sin(p.t*Math.PI);
          ctx.beginPath(); ctx.arc(w/2,py,3,0,Math.PI*2);
          ctx.fillStyle=stages[p.si].c+alpha+')'; ctx.fill();
        }
        // nodes
        stages.forEach((s,i)=>{
          const {x,y}=pos(i);
          const pulse=.5+.5*Math.sin(now*1.8+i*1.1);
          ctx.beginPath(); ctx.arc(x,y,nr*1.6,0,Math.PI*2);
          ctx.fillStyle=s.c+(0.04+pulse*.06)+')'; ctx.fill();
          ctx.beginPath(); ctx.arc(x,y,nr,0,Math.PI*2);
          ctx.fillStyle=s.c+(0.10+pulse*.12)+')';
          ctx.strokeStyle=s.c+(0.25+pulse*.20)+')'; ctx.lineWidth=.8;
          ctx.fill(); ctx.stroke();
          ctx.font='bold 6px monospace'; ctx.textAlign='center';
          ctx.fillStyle=s.c+'0.45)'; ctx.fillText(s.label,x,y+2.5);
        });
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    }

    function initCoordinateTrackers() {
      document.querySelectorAll('.glass-panel').forEach(panel => {
        const header = panel.querySelector('.gp-header');
        if (!header) return;
        if (header.querySelector('.gp-panel-coords')) return;
        
        const coordsSpan = document.createElement('span');
        coordsSpan.className = 'gp-panel-coords';
        coordsSpan.style.cssText = 'margin-left:auto;font-family:var(--font-mono);font-size:7.5px;color:rgba(0,0,0,0.25);letter-spacing:0.5px;transition:color 0.2s;';
        coordsSpan.textContent = '[X: --, Y: --]';
        
        const liveVal = header.querySelector('#gpLiveVal');
        if (liveVal) {
          header.insertBefore(coordsSpan, liveVal);
          coordsSpan.style.marginRight = '8px';
          coordsSpan.style.marginLeft = 'auto';
          liveVal.style.marginLeft = '0';
        } else {
          header.appendChild(coordsSpan);
        }
        
        panel.addEventListener('mousemove', e => {
          const rect = panel.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const normX = ((x / rect.width) * 2 - 1).toFixed(2);
          const normY = ((1 - (y / rect.height)) * 2 - 1).toFixed(2);
          coordsSpan.textContent = `[X: ${normX}, Y: ${normY}]`;
          coordsSpan.style.color = 'var(--cyan)';
        });
        
        panel.addEventListener('mouseleave', () => {
          coordsSpan.textContent = '[X: --, Y: --]';
          coordsSpan.style.color = 'rgba(0,0,0,0.25)';
        });
      });
    }

    function startAllAnimations(){
      initNeural(); initLineChart(); initHardware(); initDonut(); initPipeline(); initCoordinateTrackers();
    }

    /* ── Scroll Parallax ── */
    if (!prefersReduced) {
      const ng=document.getElementById('node-grid-layer');
      const ao=document.getElementById('accent-glow-orb');
      const panels=Array.from(document.querySelectorAll('.glass-panel'));
      const d=[.018,.032,.012,.045,.025];
      let tk=false;
      window.addEventListener('scroll',()=>{
        if(!tk){ requestAnimationFrame(()=>{
          const sy=window.scrollY;
          if(ng) ng.style.transform=`translateY(${sy*.04}px)`;
          if(ao) ao.style.transform=`translate(-50%,calc(-50% + ${sy*.055}px))`;
          panels.forEach((p,i)=>{ if(!p.matches(':hover')) p.style.transform=`translateY(${sy*(d[i]||.02)}px)`; });
          tk=false;
        }); tk=true; }
      },{passive:true});
    }
  })();
  
