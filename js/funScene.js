/* ============================================
   FUNSCENE.JS — Pop to Reveal + Would You Rather
   Mobile-friendly, uses callbacks for transitions
   ============================================ */

const FunScene = (() => {
  let popCount = 0;
  let ratherCount = 0;
  const POP_TOTAL = 6;
  const RATHER_TOTAL = 3;
  let onPopComplete = null;
  let onRatherComplete = null;

  const ratherResponses = {
    talk: "good choice. some of my best memories are from those 3am conversations.",
    message: "I'll make sure it's worth waking up to.",
    cook: "deal. hope you like whatever I attempt.",
    order: "even better. less cooking, more talking.",
    road: "pack your bags. I'll handle the playlist.",
    playlist: "I'll make it a good one. promise.",
  };

  function init(opts = {}) {
    onPopComplete = opts.onPopComplete || null;
    onRatherComplete = opts.onRatherComplete || null;
    setupBalloons();
    setupRather();
  }

  /* ---- Pop to Reveal ---- */
  function setupBalloons() {
    const grid = document.getElementById('balloonsGrid');
    if (!grid) return;

    grid.querySelectorAll('.balloon').forEach(balloon => {
      const text = balloon.dataset.text;

      const textEl = document.createElement('div');
      textEl.className = 'balloon-text';
      textEl.textContent = text;
      balloon.appendChild(textEl);

      let touched = false;

      const handlePop = (e) => {
        e.preventDefault();
        if (touched) return;
        touched = true;
        popBalloon(balloon);
        setTimeout(() => { touched = false; }, 300);
      };

      balloon.addEventListener('click', handlePop);
    });
  }

  function popBalloon(balloon) {
    if (balloon.classList.contains('popped')) return;
    balloon.classList.add('popped');
    popCount++;

    const rect = balloon.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    spawnConfetti(cx, cy);

    if (typeof AudioEngine !== 'undefined') {
      AudioEngine.playSparkle();
    }

    const progress = document.getElementById('popProgress');
    if (progress) {
      progress.textContent = `${popCount} of ${POP_TOTAL} revealed`;
    }

    if (popCount === POP_TOTAL) {
      setTimeout(() => {
        const progress = document.getElementById('popProgress');
        if (progress) {
          progress.textContent = 'you know me well enough to keep reading :)';
          progress.style.color = 'var(--gold-light)';
          progress.style.opacity = '1';
        }
        setTimeout(() => {
          if (onPopComplete) onPopComplete();
        }, 2000);
      }, 800);
    }
  }

  function spawnConfetti(x, y) {
    const colors = ['#e08890', '#c49850', '#f0b8a0', '#fff4b0', '#d88088', '#e8c878'];
    for (let i = 0; i < 16; i++) {
      const el = document.createElement('div');
      el.style.cssText = `
        position: fixed; left: ${x}px; top: ${y}px;
        width: ${4 + Math.random() * 6}px; height: ${4 + Math.random() * 6}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        pointer-events: none; z-index: 100;
      `;
      document.body.appendChild(el);

      const angle = (Math.PI * 2 / 16) * i + Math.random() * 0.5;
      const dist = 40 + Math.random() * 80;
      const duration = 0.6 + Math.random() * 0.5;

      gsap.to(el, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 30,
        rotation: Math.random() * 360,
        opacity: 0,
        duration: duration,
        ease: 'power2.out',
        onComplete: () => el.remove(),
      });
    }
  }

  /* ---- Would You Rather ---- */
  function setupRather() {
    const questions = document.querySelectorAll('.rather-q');
    questions.forEach((q) => {
      q.querySelectorAll('.rather-btn').forEach(btn => {
        let handled = false;
        btn.addEventListener('click', () => {
          if (handled) return;
          handled = true;
          handleRatherChoice(q, btn);
        });
      });
    });
  }

  function handleRatherChoice(q, btn) {
    const choice = btn.dataset.choice;
    const siblings = q.querySelectorAll('.rather-btn');
    const result = q.querySelector('.rather-result');

    siblings.forEach(s => {
      if (s === btn) {
        s.classList.add('chosen');
      } else {
        s.classList.add('not-chosen');
      }
    });

    if (result) {
      result.textContent = ratherResponses[choice] || 'good choice.';
      setTimeout(() => result.classList.add('in'), 100);
    }

    ratherCount++;

    if (typeof AudioEngine !== 'undefined') {
      AudioEngine.playSparkle();
    }

    if (ratherCount === RATHER_TOTAL) {
      setTimeout(() => {
        if (onRatherComplete) onRatherComplete();
      }, 2500);
    }
  }

  /* ---- Show / Hide with collapse ---- */
  function showPop() {
    const scene = document.getElementById('scenePop');
    if (!scene) return;

    setTimeout(() => {
      scene.querySelectorAll('.reveal-text').forEach((el, i) => {
        setTimeout(() => el.classList.add('in'), i * 200);
      });
    }, 300);
  }

  /** Hide pop scene and collapse it, then call onComplete */
  function hidePop(sceneId, onComplete) {
    const scene = document.getElementById(sceneId);
    if (!scene) { if (onComplete) onComplete(); return; }

    gsap.to(scene, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        scene.classList.remove('active');
        scene.style.display = 'none';
        if (onComplete) onComplete();
      },
    });
  }

  function showRather() {
    const scene = document.getElementById('sceneRather');
    if (!scene) return;

    setTimeout(() => {
      scene.querySelectorAll('.reveal-text').forEach((el, i) => {
        setTimeout(() => el.classList.add('in'), i * 200);
      });

      const questions = scene.querySelectorAll('.rather-q');
      questions.forEach((q, i) => {
        setTimeout(() => q.classList.add('in'), 600 + i * 400);
      });
    }, 300);
  }

  /** Hide rather scene and collapse it, then call onComplete */
  function hideRather(sceneId, onComplete) {
    const scene = document.getElementById(sceneId);
    if (!scene) { if (onComplete) onComplete(); return; }

    gsap.to(scene, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        scene.classList.remove('active');
        scene.style.display = 'none';
        if (onComplete) onComplete();
      },
    });
  }

  function reset() {
    popCount = 0;
    ratherCount = 0;

    document.querySelectorAll('.balloon').forEach(b => b.classList.remove('popped'));
    document.querySelectorAll('.rather-btn').forEach(b => b.classList.remove('chosen', 'not-chosen'));
    document.querySelectorAll('.rather-result').forEach(r => r.classList.remove('in'));
    document.querySelectorAll('.rather-q').forEach(q => q.classList.remove('in'));

    const progress = document.getElementById('popProgress');
    if (progress) {
      progress.textContent = '0 of 6 revealed';
      progress.style.color = '';
      progress.style.opacity = '';
    }
  }

  return { init, showPop, hidePop, showRather, hideRather, reset };
})();
