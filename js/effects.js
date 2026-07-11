/* ============================================
   EFFECTS.JS — Post-Processing Visual Effects
   Film grain, vignette, chromatic aberration
   ============================================ */

const Effects = (() => {
  let canvas, ctx;
  let grainCanvas, grainCtx;
  let animId;
  let enabled = true;
  let vignetteIntensity = 0.4;
  let grainIntensity = 0.04;
  let chromaticIntensity = 0.3;

  function init() {
    canvas = document.getElementById('postOverlay');
    if (!canvas) return;

    // Create grain canvas
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = 256;
    grainCanvas.height = 256;
    grainCtx = grainCanvas.getContext('2d');

    generateGrain();
    applyOverlayCSS();
    startGrainAnimation();
  }

  function generateGrain() {
    const w = grainCanvas.width;
    const h = grainCanvas.height;
    const imageData = grainCtx.createImageData(w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }

    grainCtx.putImageData(imageData, 0, 0);
  }

  function applyOverlayCSS() {
    if (!canvas) return;

    canvas.style.background = `
      radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignetteIntensity}) 100%)
    `;

    // Add grain layer
    const grainEl = document.createElement('div');
    grainEl.id = 'grainLayer';
    grainEl.style.cssText = `
      position: fixed; inset: 0; z-index: 999; pointer-events: none;
      opacity: ${grainIntensity};
      mix-blend-mode: overlay;
    `;
    document.body.appendChild(grainEl);
  }

  function startGrainAnimation() {
    const grainLayer = document.getElementById('grainLayer');
    if (!grainLayer) return;

    let lastTime = 0;
    const interval = 80; // ~12fps for grain

    function animate(time) {
      if (!enabled) return;

      if (time - lastTime > interval) {
        generateGrain();
        grainLayer.style.backgroundImage = `url(${grainCanvas.toDataURL()})`;
        grainLayer.style.backgroundSize = '256px 256px';
        lastTime = time;
      }

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);
  }

  function setVignette(value) {
    vignetteIntensity = value;
    if (canvas) {
      canvas.style.background = `
        radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignetteIntensity}) 100%)
      `;
    }
  }

  function setGrain(value) {
    grainIntensity = value;
    const grainLayer = document.getElementById('grainLayer');
    if (grainLayer) grainLayer.style.opacity = value;
  }

  function toggle() {
    enabled = !enabled;
    const grainLayer = document.getElementById('grainLayer');
    if (grainLayer) grainLayer.style.display = enabled ? 'block' : 'none';
    if (canvas) canvas.style.display = enabled ? 'block' : 'none';
  }

  function destroy() {
    cancelAnimationFrame(animId);
  }

  return { init, setVignette, setGrain, toggle, destroy };
})();
