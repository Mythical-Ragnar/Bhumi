/* ============================================
   ENDING.JS — Cinematic Sunrise Ending
   Moon set, stars fade, golden light, final line
   ============================================ */

const Ending = (() => {
  let shown = false;
  let sunriseGradient = null;

  function init() {
    // Create sunrise gradient element
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

    // Phase 1: Fade out letter
    setTimeout(() => {
      if (letterScene) {
        const paper = document.getElementById('letterPaper');
        if (paper) {
          paper.classList.add('paper-fold');
        }

        setTimeout(() => {
          letterScene.classList.remove('active');
          letterScene.style.opacity = '0';

          // Phase 2: Fade stars
          fadeStars();
        }, 1200);
      }
    }, 500);

    // Phase 3: Sunrise
    setTimeout(() => {
      scene.classList.add('active');

      // Start sunrise gradient
      if (sunriseGradient) {
        sunriseGradient.classList.add('active');
      }

      // Fade moon
      fadeMoon();

      // Birds singing
      if (typeof AudioEngine !== 'undefined') {
        AudioEngine.playCrickets(0.02);
      }
    }, 2500);

    // Phase 4: Golden light fills
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
    // Animate Three.js moon glow
    if (typeof ThreeScene !== 'undefined') {
      const scene = ThreeScene.getScene();
      if (scene) {
        scene.children.forEach(child => {
          if (child.isSprite || (child.isMesh && child.geometry?.type === 'SphereGeometry')) {
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
        // Final state
        setTimeout(() => {
          // Could reload or show restart option
        }, 2000);
      },
    });
  }

  function isShown() {
    return shown;
  }

  return { init, show, isShown };
})();
