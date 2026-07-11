/* ============================================
   PARTICLES.JS — Fireflies, Petals, Embers, Dust
   Mobile-aware: reduced counts, fixed bounds
   ============================================ */

const Particles = (() => {
  let canvas, ctx;
  let fireflies = [];
  let petals = [];
  let embers = [];
  let dustMotes = [];
  let pointerX = -9999, pointerY = -9999;
  let windX = 0, windY = 0;
  let animId;
  let active = true;
  let season = 'normal';

  const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;
  const FIREFLY_COUNT = 3;
  let onFireflyCaught = null;

  const PETAL_COUNT = isMobile ? 6 : 18;
  const EMBER_COUNT = isMobile ? 4 : 12;
  const DUST_COUNT = isMobile ? 10 : 30;

  const petalChars = ['✿', '❀', '❁', '·'];
  const petalColors = {
    normal: ['#e08890', '#f0b8a0', '#d88088'],
    winter: ['#e0e8f0', '#c8d8e8', '#d0dce8'],
    autumn: ['#d4723c', '#c86030', '#e08040'],
    spring: ['#e8a0b0', '#f0c0c8', '#d89098'],
  };

  function init(opts = {}) {
    onFireflyCaught = opts.onFireflyCaught || null;

    canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: fixed; inset: 0; z-index: 4;
      pointer-events: none; width: 100vw; height: 100vh;
      touch-action: none;
    `;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();

    createPetals();
    createEmbers();
    createDust();

    addEventListener('resize', resize);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('touchmove', onPointerMove, { passive: true });

    animate();
  }

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onPointerMove(e) {
    if (e.touches) {
      if (e.touches[0]) {
        pointerX = e.touches[0].clientX;
        pointerY = e.touches[0].clientY;
      }
    } else {
      pointerX = e.clientX;
      pointerY = e.clientY;
    }
  }

  /* ---- Fireflies ---- */
  function createFireflies(container) {
    fireflies = [];
    if (!container) return;

    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const el = document.createElement('div');
      el.className = 'firefly';
      el.style.position = 'absolute';
      el.style.pointerEvents = 'all';

      const firefly = {
        el,
        x: 0.2 + Math.random() * 0.6,
        y: 0.1 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.01,
        vy: (Math.random() - 0.5) * 0.01,
        targetX: 0,
        targetY: 0,
        phase: Math.random() * Math.PI * 2,
        caught: false,
      };

      firefly.targetX = firefly.x + (Math.random() - 0.5) * 0.1;
      firefly.targetY = firefly.y + (Math.random() - 0.5) * 0.1;

      el.style.left = (firefly.x * 100) + '%';
      el.style.top = (firefly.y * 100) + '%';

      const handleCatch = (e) => {
        e.preventDefault();
        e.stopPropagation();
        catchFirefly(firefly, container);
      };

      el.addEventListener('click', handleCatch);
      el.addEventListener('touchend', handleCatch, { passive: false });

      container.appendChild(el);
      fireflies.push(firefly);
    }
  }

  function catchFirefly(ff, container) {
    if (ff.caught) return;
    ff.caught = true;
    ff.el.classList.add('caught');

    const ffRect = ff.el.getBoundingClientRect();
    const spark = document.createElement('div');
    spark.className = 'spark';
    spark.style.left = (ffRect.left + ffRect.width / 2) + 'px';
    spark.style.top = (ffRect.top + ffRect.height / 2) + 'px';
    document.body.appendChild(spark);

    const seal = document.getElementById('seal');
    if (seal) {
      const sealRect = seal.getBoundingClientRect();
      requestAnimationFrame(() => {
        spark.style.left = (sealRect.left + sealRect.width / 2) + 'px';
        spark.style.top = (sealRect.top + sealRect.height / 2) + 'px';
        spark.style.transform = 'scale(0.3)';
        spark.style.opacity = '0.2';
      });
      setTimeout(() => spark.remove(), 800);

      const ring = document.createElement('div');
      ring.className = 'energy-ring';
      ring.style.left = '50%';
      ring.style.top = '50%';
      seal.appendChild(ring);
      setTimeout(() => ring.remove(), 900);
    }

    spawnCatchParticles(ffRect.left + ffRect.width / 2, ffRect.top + ffRect.height / 2);

    if (onFireflyCaught) onFireflyCaught(fireflies.filter(f => f.caught).length);
  }

  function spawnCatchParticles(x, y) {
    for (let i = 0; i < (isMobile ? 6 : 12); i++) {
      const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.3;
      const speed = 1 + Math.random() * 3;
      embers.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        size: 2 + Math.random() * 3,
        color: '#fff4b0',
      });
    }
  }

  function updateFireflies(time) {
    const container = document.getElementById('fireflyZone');
    if (!container) return;

    fireflies.forEach((ff, i) => {
      if (ff.caught) return;

      ff.phase += 0.02;

      const dx = ff.targetX - ff.x;
      const dy = ff.targetY - ff.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.01 || Math.random() < 0.01) {
        ff.targetX = 0.1 + Math.random() * 0.8;
        ff.targetY = 0.05 + Math.random() * 0.6;
      }

      ff.vx += (dx / dist) * 0.0004 + Math.sin(ff.phase) * 0.0008;
      ff.vy += (dy / dist) * 0.0004 + Math.cos(ff.phase * 0.7) * 0.0008;

      // Separation
      fireflies.forEach((other, j) => {
        if (i === j || other.caught) return;
        const ox = ff.x - other.x;
        const oy = ff.y - other.y;
        const od = Math.sqrt(ox * ox + oy * oy);
        if (od < 0.08) {
          ff.vx += (ox / od) * 0.001;
          ff.vy += (oy / od) * 0.001;
        }
      });

      // Bounds (0-1 range)
      const pad = 0.04;
      if (ff.x < pad) ff.vx += 0.002;
      if (ff.x > 1 - pad) ff.vx -= 0.002;
      if (ff.y < pad) ff.vy += 0.002;
      if (ff.y > 1 - pad) ff.vy -= 0.002;

      ff.vx *= 0.95;
      ff.vy *= 0.95;

      const speed = Math.sqrt(ff.vx * ff.vx + ff.vy * ff.vy);
      if (speed > 0.015) {
        ff.vx = (ff.vx / speed) * 0.015;
        ff.vy = (ff.vy / speed) * 0.015;
      }

      ff.x += ff.vx;
      ff.y += ff.vy;

      const pulse = Math.sin(time * 2 + ff.phase) * 0.3 + 0.7;
      ff.el.style.left = (ff.x * 100) + '%';
      ff.el.style.top = (ff.y * 100) + '%';
      ff.el.style.opacity = pulse;
      ff.el.style.boxShadow = `
        0 0 ${8 + pulse * 10}px ${3 + pulse * 4}px rgba(255, 244, 176, ${0.5 + pulse * 0.3}),
        0 0 ${20 + pulse * 15}px ${8 + pulse * 6}px rgba(255, 240, 160, ${0.2 + pulse * 0.15})
      `;
    });
  }

  /* ---- Petals ---- */
  function createPetals() {
    petals = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.push({
        x: Math.random() * w,
        y: Math.random() * -h,
        vy: 0.3 + Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 1.2,
        size: 8 + Math.random() * 10,
        char: petalChars[Math.floor(Math.random() * petalChars.length)],
        opacity: 0.4 + Math.random() * 0.4,
        wobblePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  function updatePetals(time) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const colors = petalColors[season] || petalColors.normal;

    ctx.save();
    petals.forEach(p => {
      p.y += p.vy;
      p.x += p.vx + Math.sin(time * 0.5 + p.wobblePhase) * 0.3;
      p.rot += p.rotSpeed;
      p.x += windX * 0.5;

      const dx = p.x - pointerX;
      const dy = p.y - pointerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100 && dist > 0.1) {
        const force = (1 - dist / 100) * 4;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.globalAlpha = p.opacity;
      ctx.font = `${p.size}px serif`;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillText(p.char, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  /* ---- Embers ---- */
  function createEmbers() {
    embers = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < EMBER_COUNT; i++) {
      embers.push({
        x: Math.random() * w,
        y: h + Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.2 + Math.random() * 0.6),
        life: 1,
        decay: 0.002 + Math.random() * 0.003,
        size: 1 + Math.random() * 2.5,
        color: `hsl(${20 + Math.random() * 20}, ${70 + Math.random() * 30}%, ${50 + Math.random() * 30}%)`,
      });
    }
  }

  function updateEmbers(time) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    embers = embers.filter(e => e.life > 0);

    while (embers.length < EMBER_COUNT) {
      embers.push({
        x: Math.random() * w,
        y: h + 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.2 + Math.random() * 0.6),
        life: 1,
        decay: 0.002 + Math.random() * 0.003,
        size: 1 + Math.random() * 2.5,
        color: `hsl(${20 + Math.random() * 20}, ${70 + Math.random() * 30}%, ${50 + Math.random() * 30}%)`,
      });
    }

    ctx.save();
    embers.forEach(e => {
      e.x += e.vx + Math.sin(time + e.x * 0.01) * 0.2;
      e.y += e.vy;
      e.life -= e.decay;

      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * e.life, 0, Math.PI * 2);
      ctx.fillStyle = e.color;
      ctx.globalAlpha = e.life * 0.6;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * e.life * 3, 0, Math.PI * 2);
      ctx.fillStyle = e.color;
      ctx.globalAlpha = e.life * 0.1;
      ctx.fill();
    });
    ctx.restore();
  }

  /* ---- Dust ---- */
  function createDust() {
    dustMotes = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < DUST_COUNT; i++) {
      dustMotes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.1,
        size: 0.5 + Math.random() * 1.5,
        opacity: 0.1 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function updateDust(time) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.save();
    dustMotes.forEach(d => {
      d.x += d.vx + Math.sin(time * 0.3 + d.phase) * 0.1;
      d.y += d.vy + Math.cos(time * 0.2 + d.phase) * 0.05;

      if (d.x < -10) d.x = w + 10;
      if (d.x > w + 10) d.x = -10;
      if (d.y < -10) d.y = h + 10;
      if (d.y > h + 10) d.y = -10;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240, 230, 210, ${d.opacity})`;
      ctx.fill();
    });
    ctx.restore();
  }

  /* ---- Letter Dust ---- */
  let letterDust = [];
  let letterDustCanvas, letterDustCtx;

  function initLetterDust(paperEl) {
    if (!paperEl) return;
    letterDustCanvas = document.getElementById('dustCanvas');
    if (!letterDustCanvas) return;

    letterDustCtx = letterDustCanvas.getContext('2d');
    letterDustCanvas.width = paperEl.offsetWidth * 2;
    letterDustCanvas.height = paperEl.offsetHeight * 2;
    letterDustCanvas.style.width = paperEl.offsetWidth + 'px';
    letterDustCanvas.style.height = paperEl.offsetHeight + 'px';

    letterDust = [];
    const count = isMobile ? 8 : 20;
    for (let i = 0; i < count; i++) {
      letterDust.push({
        x: Math.random() * letterDustCanvas.width,
        y: Math.random() * letterDustCanvas.height * 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.05 + Math.random() * 0.15),
        size: 1 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function updateLetterDust(time) {
    if (!letterDustCtx) return;
    const w = letterDustCanvas.width;
    const h = letterDustCanvas.height;

    letterDustCtx.clearRect(0, 0, w, h);
    letterDustCtx.save();
    letterDustCtx.scale(2, 2);

    const sw = w / 2;
    const sh = h / 2;

    letterDust.forEach(d => {
      d.x += d.vx + Math.sin(time * 0.4 + d.phase) * 0.2;
      d.y += d.vy;
      if (d.y < -10) { d.y = sh * 0.5; d.x = Math.random() * sw; }

      letterDustCtx.beginPath();
      letterDustCtx.arc(d.x / 2, d.y / 2, d.size, 0, Math.PI * 2);
      letterDustCtx.fillStyle = `rgba(200, 180, 140, ${d.opacity})`;
      letterDustCtx.fill();
    });

    letterDustCtx.restore();
  }

  /* ---- Animation Loop ---- */
  let startTime = performance.now();

  function animate() {
    if (!active) return;
    animId = requestAnimationFrame(animate);

    const time = (performance.now() - startTime) / 1000;

    if (ctx) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    updatePetals(time);
    updateEmbers(time);
    updateDust(time);
    updateFireflies(time);
    updateLetterDust(time);
  }

  function setSeason(s) {
    season = s;
    document.body.classList.remove('season-normal', 'season-winter', 'season-autumn', 'season-spring');
    if (s !== 'normal') {
      document.body.classList.add('season-' + s);
    }
  }

  function setWind(x, y) {
    windX = x;
    windY = y;
  }

  function destroy() {
    active = false;
    cancelAnimationFrame(animId);
    if (canvas) canvas.remove();
    removeEventListener('resize', resize);
  }

  return { init, createFireflies, setSeason, setWind, initLetterDust, destroy };
})();
