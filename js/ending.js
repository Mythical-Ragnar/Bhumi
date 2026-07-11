/* ============================================
   ENDING.JS — Cinematic Sunrise Ending
   Collapses ALL previous scenes, shows ending full-screen
   ============================================ */

const Ending = (() => {
  let shown = false;
  let sunriseGradient = null;

  function init() {
    sunriseGradient = document.createElement('div');
    sunriseGradient.className = 'sunrise-gradient';
    document.body.appendChild(sunriseGradient);
  }

  function show() {
    if (shown) return;
    shown = true;

    const scene = document.getElementById('sceneEnding');
    const letterScene = document.getElementById('sceneLetter');
    const endingContent = document.querySelector('.ending-content');

    if (!scene) return;

    // Stop letter animations
    Letter.hide();

    // Phase 1: Fold letter paper
    setTimeout(() => {
      if (letterScene) {
        const paper = document.getElementById('letterPaper');
        if (paper) {
          paper.classList.add('paper-fold');
        }

        // Phase 2: Collapse letter scene
        setTimeout(() => {
          letterScene.classList.remove('active');
          letterScene.style.display = 'none';

          // Also collapse ALL other hidden scenes so they don't take up space
          ['sceneNight', 'scenePop', 'sceneRather'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
          });

          // Show ending scene — it's now the only thing in the document flow
          scene.style.display = '';
          scene.classList.add('active');
          window.scrollTo(0, 0);

          fadeStars();
          // Fade out particles so they don't cover the ending
          if (typeof Particles !== 'undefined' && Particles.fadeOut) {
            Particles.fadeOut(4);
          }
        }, 1200);
      }
    }, 500);

    // Phase 3: Sunrise gradient fades in
    setTimeout(() => {
      if (sunriseGradient) {
        gsap.to(sunriseGradient, {
          opacity: 1,
          duration: 3,
          ease: 'power2.inOut',
        });
      }
      fadeMoon();
    }, 3000);

    // Phase 4: Final line appears
    setTimeout(() => {
      if (endingContent) {
        endingContent.classList.add('in');
      }
    }, 4500);

    // Phase 5: Fade to white
    setTimeout(() => {
      fadeToWhite();
    }, 10000);
  }

  function fadeStars() {
    const canvas = document.getElementById('threeCanvas');
    if (canvas) {
      gsap.to(canvas, {
        opacity: 0.1,
        duration: 4,
        ease: 'power2.inOut',
      });
    }
  }

  function fadeMoon() {
    if (typeof ThreeScene === 'undefined') return;
    const threeScene = ThreeScene.getScene();
    if (!threeScene) return;

    threeScene.children.forEach(child => {
      if (child.material) {
        gsap.to(child.material, {
          opacity: 0,
          duration: 4,
          ease: 'power2.inOut',
        });
      }
    });
  }

  function fadeToWhite() {
    const whiteOverlay = document.createElement('div');
    whiteOverlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9998;
      background: #fff8ec; opacity: 0;
      pointer-events: none;
    `;
    document.body.appendChild(whiteOverlay);

    gsap.to(whiteOverlay, {
      opacity: 1,
      duration: 4,
      ease: 'power2.inOut',
    });
  }

  function isShown() {
    return shown;
  }

  return { init, show, isShown };
})();
