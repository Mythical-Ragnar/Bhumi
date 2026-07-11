/* ============================================
   ANIMATIONS.JS — Main Orchestrator
   Scene flow: Night → Pop → Rather → Letter → End
   ============================================ */

const App = (() => {
  let currentScene = 'night';
  let sealChargeCount = 0;
  let lanternActive = false;
  let seasonOrder = ['normal', 'winter', 'autumn', 'spring'];
  let seasonIndex = 0;
  let lenis = null;

  /* Konami Code */
  const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  let konamiIndex = 0;

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
      bootstrap();
    }
  }

  function bootstrap() {
    /* Lenis Smooth Scroll */
    try {
      if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smooth: true,
        });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
      }
    } catch (e) { /* not critical */ }

    /* Init all modules */
    ThreeScene.init();
    Effects.init();
    Particles.init({ onFireflyCaught: handleFireflyCaught });
    AudioEngine.init();
    FunScene.init({
      onPopComplete: transitionToRather,
      onRatherComplete: transitionToLetter,
    });
    Letter.init();
    Ending.init();
    Letter.setupLongPress();

    /* Interactions */
    setupEnvelopeInteraction();
    setupKeyboardShortcuts();
    setupAudioToggle();
    setupMoonInteraction();
    setupSealInteraction();

    /* Hide loader */
    setTimeout(() => {
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('hidden');
      const audioToggle = document.getElementById('audioToggle');
      if (audioToggle) audioToggle.classList.add('visible');
    }, 2200);

    /* Start ambient audio */
    setTimeout(() => {
      AudioEngine.playWind(0.06);
      AudioEngine.playCrickets(0.03);
    }, 3500);
  }

  /* ========================================
     SCENE 1: Night + Envelope
     ======================================== */
  function setupEnvelopeInteraction() {
    const envelope = document.getElementById('envelope');
    if (!envelope) return;

    document.addEventListener('mousemove', (e) => {
      if (currentScene !== 'night') return;
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 5;
      envelope.style.transform = `
        perspective(800px) rotateY(${x}deg) rotateX(${-y}deg)
      `;
    });

    const fireflyZone = document.getElementById('fireflyZone');
    Particles.createFireflies(fireflyZone);
  }

  function setupSealInteraction() {
    const seal = document.getElementById('seal');
    if (!seal) return;
    seal.addEventListener('dblclick', () => showToast('B for Bhumika'));
    seal.addEventListener('mouseenter', () => { seal.style.filter = 'brightness(1.2)'; });
    seal.addEventListener('mouseleave', () => { seal.style.filter = ''; });
  }

  function handleFireflyCaught(count) {
    sealChargeCount = count;
    const seal = document.getElementById('seal');
    const hint = document.getElementById('hint');

    if (seal) {
      const intensity = count / 3;
      seal.classList.add('charged');
      seal.style.boxShadow = `
        0 3px 10px rgba(0,0,0,0.35),
        inset 0 1px 2px rgba(255,255,255,0.2),
        0 0 ${15 + intensity * 20}px ${3 + intensity * 8}px var(--wax-glow)
      `;
    }

    if (hint) hint.textContent = count < 3 ? `${count} of 3 caught` : '';
    AudioEngine.playSparkle();

    if (count === 3) setTimeout(openEnvelope, 900);
  }

  function openEnvelope() {
    const envelope = document.getElementById('envelope');
    const seal = document.getElementById('seal');
    const hint = document.getElementById('hint');
    if (hint) hint.textContent = '';

    AudioEngine.playHeartbeat(() => {
      if (seal) seal.classList.add('melting');
      AudioEngine.playSealCrack();

      setTimeout(() => {
        if (envelope) envelope.classList.add('opening');
        AudioEngine.playPageTurn();
        setTimeout(transitionToPop, 1600);
      }, 1100);
    });
  }

  /* ========================================
     TRANSITION: Night → Pop to Reveal
     ======================================== */
  function transitionToPop() {
    currentScene = 'pop';
    const nightScene = document.getElementById('sceneNight');
    if (!nightScene) return;

    gsap.to(nightScene, {
      opacity: 0, scale: 0.97, filter: 'blur(4px)',
      duration: 1, ease: 'power2.inOut',
      onComplete: () => {
        nightScene.classList.remove('active');
        nightScene.style.cssText = '';
        FunScene.showPop();
      },
    });
  }

  /* ========================================
     TRANSITION: Pop → Would You Rather
     ======================================== */
  function transitionToRather() {
    currentScene = 'rather';
    FunScene.hidePop();
    setTimeout(() => FunScene.showRather(), 900);
  }

  /* ========================================
     TRANSITION: Would You Rather → Letter
     ======================================== */
  function transitionToLetter() {
    currentScene = 'letter';
    FunScene.hideRather();
    setTimeout(() => Letter.show(), 900);
  }

  /* ========================================
     Keyboard Shortcuts
     ======================================== */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const key = e.key;

      /* Konami */
      if (key.toLowerCase() === konamiSequence[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiSequence.length) {
          konamiIndex = 0;
          showToast('Secret ending unlocked');
        }
      } else {
        konamiIndex = 0;
      }

      /* L: Lantern */
      if (key === 'l' || key === 'L') {
        lanternActive = !lanternActive;
        document.body.classList.toggle('lantern-active', lanternActive);
        showToast(lanternActive ? 'Lantern on' : 'Lantern off');
      }

      /* S: Season (not during letter) */
      if ((key === 's' || key === 'S') && !e.ctrlKey && !e.metaKey) {
        if (currentScene !== 'letter' && currentScene !== 'ending') {
          seasonIndex = (seasonIndex + 1) % seasonOrder.length;
          const season = seasonOrder[seasonIndex];
          Particles.setSeason(season);
          showToast(season === 'normal' ? 'Season: normal' : `Season: ${season}`);
        }
      }
    });
  }

  /* ========================================
     Moon Interaction
     ======================================== */
  function setupMoonInteraction() {
    document.addEventListener('dblclick', (e) => {
      if (currentScene !== 'night') return;
      if (e.clientX > window.innerWidth * 0.65 && e.clientY < window.innerHeight * 0.25) {
        ThreeScene.triggerMoonClick();
      }
    });
  }

  /* ========================================
     Audio Toggle
     ======================================== */
  function setupAudioToggle() {
    const btn = document.getElementById('audioToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      AudioEngine.resume();
      const muted = AudioEngine.toggleMute();
      btn.classList.toggle('muted', muted);
      showToast(muted ? 'Sound off' : 'Sound on');
    });
  }

  /* ========================================
     Toast Helper
     ======================================== */
  let toastTimeout = null;
  function showToast(text) {
    const toast = document.getElementById('hintToast');
    if (!toast) return;
    clearTimeout(toastTimeout);
    toast.textContent = text;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  init();
  return { init, showToast };
})();
