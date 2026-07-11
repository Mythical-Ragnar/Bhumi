/* ============================================
   ENDING.JS — Cinematic Sunrise Ending
   Moon set, stars fade, golden light, final line
   Mobile-aware: collapses letter scene, scrolls to top
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
    const finalLine = document.getElementById('finalLine');
    const endingContent = document.querySelector('.ending-content');

    if (!scene) return;

    // Phase 1: Fold letter paper
    setTimeout(() => {
      if (letterScene) {
        const paper = document.getElementById('letterPaper');
        if (paper) {
          paper.classList.add('paper-fold');
        }

        // Phase 2: Collapse letter scene from layout, scroll to ending
        setTimeout(() => {
          letterScene.classList.remove('active');
          letterScene.style.cssText = 'display:none;';

          // Force scroll to top so ending scene is visible
          window.scrollTo(0, 0);

          // Fade stars
          fadeStars();
        }, 1200);
      }
    }, 500);

    // Phase 3: Show ending scene
    setTimeout(() => {
      scene.classList.add('active');
      window.scrollTo(0, 0);

      if (sunriseGradient) {
        sunriseGradient.classList.add('active');
      }

      fadeMoon();

      if (typeof AudioEngine !== 'undefined') {
        AudioEngine.playCrickets(0.02);
      }
    }, 2500);

    // Phase 4: Sunrise gradient fills
    setTimeout(() => {
      if (sunriseGradient) {
        gsap.to(sunriseGradient, {
          opacity: 1,
          duration: 3,
          ease: 'power2.inOut',
        });
      }
    }, 3500);

    // Phase 5: Final line appears
    setTimeout(() => {
      if (endingContent) {
        endingContent.classList.add('in');
      }
    }, 5000);

    // Phase 6: Fade to white
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
    if (typeof ThreeScene !== 'undefined') {
      const threeScene = ThreeScene.getScene();
      if (threeScene) {
        threeScene.children.forEach(child => {
          if (child.isSprite || (child.isMesh && child.geometry && child.geometry.type === 'SphereGeometry')) {
            gsap.to(child.material, {
              opacity: 0,
              duration: 4,
              ease: 'power2.inOut',
            });
          }
        });
      }
    }
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
      onComplete: () => {
        setTimeout(() => {}, 2000);
      },
    });
  }

  function isShown() {
    return shown;
  }

  return { init, show, isShown };
})();
