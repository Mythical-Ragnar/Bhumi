/* ============================================
   LETTER.JS — Handcrafted Letter Experience
   Ink reveal, cursor candlelight, paper reactions
   Stops animation loops when scene is hidden
   ============================================ */

const Letter = (() => {
  let revealed = false;
  let revealIndex = 0;
  let paragraphs = [];
  let cursorLight = null;
  let letterPaper = null;
  let mouseX = 0, mouseY = 0;
  let lightAnimId = null;

  function init() {
    cursorLight = document.getElementById('cursorLight');
    letterPaper = document.getElementById('letterPaper');
    paragraphs = document.querySelectorAll('.ink-reveal');

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
  }

  function show() {
    const scene = document.getElementById('sceneLetter');
    if (!scene) return;

    revealed = false;
    revealIndex = 0;

    // Reset all ink-reveal elements
    paragraphs.forEach(el => {
      el.classList.remove('revealed', 'glow', 'settled', 'in');
    });

    scene.style.display = '';
    scene.classList.add('active');

    // Scroll to top so letter is visible
    window.scrollTo(0, 0);

    // Init letter dust
    Particles.initLetterDust(letterPaper);

    // Start cursor light (desktop only — no cursor on mobile)
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (!isMobile) {
      startCursorLight();
    }

    // Begin ink reveal sequence
    setTimeout(() => {
      startInkReveal();
    }, 800);
  }

  function startCursorLight() {
    if (!cursorLight) return;

    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;

    function updateLight() {
      cx += (mouseX - cx) * 0.08;
      cy += (mouseY - cy) * 0.08;

      cursorLight.style.left = cx + 'px';
      cursorLight.style.top = cy + 'px';

      // Paper reaction to light
      if (letterPaper) {
        const rect = letterPaper.getBoundingClientRect();
        const relX = (cx - rect.left) / rect.width;
        const relY = (cy - rect.top) / rect.height;

        const shadowX = (0.5 - relX) * 8;
        const shadowY = (0.5 - relY) * 8;
        letterPaper.style.boxShadow = `
          ${shadowX}px ${shadowY}px 4px rgba(60,40,20,0.04),
          ${shadowX * 2}px ${shadowY * 2}px 40px rgba(60,40,20,0.08),
          ${shadowX * 3}px ${shadowY * 3}px 80px rgba(60,40,20,0.06)
        `;
      }

      lightAnimId = requestAnimationFrame(updateLight);
    }

    updateLight();
  }

  function startInkReveal() {
    revealNext();
  }

  function revealNext() {
    if (revealIndex >= paragraphs.length) {
      onRevealComplete();
      return;
    }

    const el = paragraphs[revealIndex];
    el.classList.add('revealed');

    // Play pen scratch
    if (typeof AudioEngine !== 'undefined' && AudioEngine.playPenScratch) {
      AudioEngine.playPenScratch();
    }

    // Highlight word shimmer
    const highlights = el.querySelectorAll('.highlight-word');
    highlights.forEach((h, i) => {
      setTimeout(() => {
        h.classList.add('shimmer');
        setTimeout(() => h.classList.remove('shimmer'), 2000);
      }, 600 + i * 400);
    });

    // Divider animation
    if (el.classList.contains('letter-divider')) {
      setTimeout(() => el.classList.add('in'), 400);
    }

    // Glow then settle
    setTimeout(() => {
      el.classList.add('glow');
      setTimeout(() => el.classList.add('settled'), 1200);
    }, 800);

    revealIndex++;

    // Delay between paragraphs
    const delay = el.tagName === 'P' ? 2200 : 1200;
    setTimeout(revealNext, delay);
  }

  function onRevealComplete() {
    revealed = true;

    // Page turn sound
    if (typeof AudioEngine !== 'undefined' && AudioEngine.playPageTurn) {
      setTimeout(() => AudioEngine.playPageTurn(), 500);
    }

    // Trigger ending after a pause
    setTimeout(() => {
      if (typeof Ending !== 'undefined') {
        Ending.show();
      }
    }, 3000);
  }

  /* ---- Hidden features ---- */
  function setupLongPress() {
    if (!letterPaper) return;
    let pressTimer = null;

    const startPress = () => {
      pressTimer = setTimeout(() => { showHiddenNote(); }, 2000);
    };
    const endPress = () => { clearTimeout(pressTimer); };

    letterPaper.addEventListener('mousedown', startPress);
    letterPaper.addEventListener('mouseup', endPress);
    letterPaper.addEventListener('mouseleave', endPress);
    letterPaper.addEventListener('touchstart', startPress, { passive: true });
    letterPaper.addEventListener('touchend', endPress);
    letterPaper.addEventListener('touchcancel', endPress);
  }

  function showHiddenNote() {
    const existing = letterPaper.querySelector('.hidden-note');
    if (existing) return;

    const note = document.createElement('div');
    note.className = 'hidden-note ink-reveal revealed';
    note.style.cssText = `
      position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
      font-family: 'Caveat', cursive; font-size: 1.1rem; color: var(--ink-faint);
      font-style: italic; opacity: 0; transition: opacity 1s ease;
      text-align: center; max-width: 400px;
    `;
    note.textContent = 'You found the hidden note. That means you looked closer. I like that about you.';
    letterPaper.appendChild(note);

    requestAnimationFrame(() => { note.style.opacity = '0.6'; });

    setTimeout(() => {
      note.style.opacity = '0';
      setTimeout(() => note.remove(), 1000);
    }, 5000);
  }

  function hide() {
    // Stop cursor light animation
    if (lightAnimId) {
      cancelAnimationFrame(lightAnimId);
      lightAnimId = null;
    }
    // Hide cursor light element
    if (cursorLight) {
      cursorLight.style.display = 'none';
    }
  }

  function isRevealed() {
    return revealed;
  }

  return { init, show, hide, isRevealed, setupLongPress };
})();
