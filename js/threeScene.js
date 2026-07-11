/* ============================================
   THREESCENE.JS — Cinematic Night Sky
   Stars, Milky Way, Moon, Clouds, Fog, Parallax
   Mobile-aware: reduces complexity on small screens
   ============================================ */

const ThreeScene = (() => {
  let scene, camera, renderer;
  let starField, milkyWay, moonMesh, moonGlow;
  let clouds = [];
  let fog;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let clock;
  let shootingStars = [];
  let animId;
  let initialized = false;

  const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;

  const CONFIG = {
    starCount: isMobile ? 400 : 2000,
    starSpread: isMobile ? 400 : 500,
    shootingStarInterval: isMobile ? 8000 : 4000,
    parallaxStrength: isMobile ? 10 : 30,
    moonSize: 15,
    moonPosition: { x: 120, y: 80, z: -200 },
    cloudCount: isMobile ? 3 : 8,
    fogNear: 100,
    fogFar: 600,
  };

  function init() {
    if (initialized) return;
    initialized = true;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.002);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 200);

    const canvas = document.getElementById('threeCanvas');
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isMobile,
      alpha: true,
      powerPreference: isMobile ? 'low-power' : 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    createStarField();
    createMilkyWay();
    createMoon();
    createClouds();
    createAmbientFog();
    createShootingStars();

    addEventListener('resize', onResize);

    if (!isMobile) {
      addEventListener('mousemove', onMouseMove);
    } else {
      addEventListener('touchmove', onTouchMove, { passive: true });
    }

    animate();
  }

  function onTouchMove(e) {
    if (e.touches[0]) {
      targetMouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    }
  }

  /* ---- Stars ---- */
  function createStarField() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(CONFIG.starCount * 3);
    const sizes = new Float32Array(CONFIG.starCount);
    const colors = new Float32Array(CONFIG.starCount * 3);
    const twinklePhases = new Float32Array(CONFIG.starCount);

    for (let i = 0; i < CONFIG.starCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = CONFIG.starSpread * (0.3 + Math.random() * 0.7);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi) - 100;

      sizes[i] = Math.random() * 2.5 + 0.5;

      const temp = Math.random();
      if (temp > 0.85) {
        colors[i3] = 0.85; colors[i3 + 1] = 0.9; colors[i3 + 2] = 1.0;
      } else if (temp > 0.7) {
        colors[i3] = 1.0; colors[i3 + 1] = 0.95; colors[i3 + 2] = 0.8;
      } else {
        colors[i3] = 0.98; colors[i3 + 1] = 0.98; colors[i3 + 2] = 0.98;
      }

      twinklePhases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));

    const vertexShader = `
      attribute float size;
      attribute float twinklePhase;
      uniform float uTime;
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        vColor = color;
        float twinkle = sin(uTime * 0.8 + twinklePhase * 6.28) * 0.3 + 0.7;
        vOpacity = twinkle;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z) * twinkle;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d);
        float glow = exp(-d * 4.0) * 0.5;
        gl_FragColor = vec4(vColor, (alpha + glow) * vOpacity);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    starField = new THREE.Points(geometry, material);
    scene.add(starField);
  }

  /* ---- Milky Way ---- */
  function createMilkyWay() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, 'rgba(60,50,80,0)');
    gradient.addColorStop(0.3, 'rgba(80,70,100,0.15)');
    gradient.addColorStop(0.5, 'rgba(100,85,120,0.2)');
    gradient.addColorStop(0.7, 'rgba(80,70,100,0.15)');
    gradient.addColorStop(1, 'rgba(60,50,80,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);

    const noiseCount = isMobile ? 1000 : 3000;
    for (let i = 0; i < noiseCount; i++) {
      ctx.fillStyle = `rgba(180,170,200,${Math.random() * 0.08})`;
      ctx.fillRect(Math.random() * 512, 80 + Math.random() * 96, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(800, 200);
    const material = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });

    milkyWay = new THREE.Mesh(geometry, material);
    milkyWay.position.set(0, 40, -300);
    milkyWay.rotation.z = -0.2;
    scene.add(milkyWay);
  }

  /* ---- Moon ---- */
  function createMoon() {
    const moonGeo = new THREE.SphereGeometry(CONFIG.moonSize, isMobile ? 16 : 32, isMobile ? 16 : 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfff4d6 });
    moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(CONFIG.moonPosition.x, CONFIG.moonPosition.y, CONFIG.moonPosition.z);
    scene.add(moonMesh);

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const gCtx = glowCanvas.getContext('2d');
    const grad = gCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 244, 210, 0.6)');
    grad.addColorStop(0.3, 'rgba(255, 230, 180, 0.25)');
    grad.addColorStop(0.7, 'rgba(255, 220, 160, 0.08)');
    grad.addColorStop(1, 'rgba(255, 210, 140, 0)');
    gCtx.fillStyle = grad;
    gCtx.fillRect(0, 0, 256, 256);

    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTexture, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7,
    });

    moonGlow = new THREE.Sprite(glowMat);
    moonGlow.scale.set(120, 120, 1);
    moonGlow.position.copy(moonMesh.position);
    scene.add(moonGlow);

    const moonLight = new THREE.PointLight(0xffeedd, 0.4, 400);
    moonLight.position.copy(moonMesh.position);
    scene.add(moonLight);
  }

  /* ---- Clouds ---- */
  function createClouds() {
    for (let i = 0; i < CONFIG.cloudCount; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = isMobile ? 256 : 512;
      canvas.height = isMobile ? 64 : 128;
      const ctx = canvas.getContext('2d');

      const alpha = 0.03 + Math.random() * 0.05;
      const cloudW = 200 + Math.random() * 200;
      const circleCount = isMobile ? 6 : 12;

      for (let j = 0; j < circleCount; j++) {
        const cx = 100 + Math.random() * (cloudW - 100);
        const cy = 40 + Math.random() * 48;
        const rx = 40 + Math.random() * 80;
        const ry = 15 + Math.random() * 25;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
        grad.addColorStop(0, `rgba(160,150,180,${alpha})`);
        grad.addColorStop(1, 'rgba(160,150,180,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      const geo = new THREE.PlaneGeometry(300 + Math.random() * 200, 60 + Math.random() * 40);
      const mat = new THREE.MeshBasicMaterial({
        map: texture, transparent: true, depthWrite: false,
        opacity: 0.5 + Math.random() * 0.5,
      });

      const cloud = new THREE.Mesh(geo, mat);
      cloud.position.set(
        (Math.random() - 0.5) * 500,
        30 + Math.random() * 60,
        -150 - Math.random() * 150
      );
      cloud.userData.speed = 0.02 + Math.random() * 0.04;
      cloud.userData.baseX = cloud.position.x;

      clouds.push(cloud);
      scene.add(cloud);
    }
  }

  /* ---- Fog ---- */
  function createAmbientFog() {
    const count = isMobile ? 20 : 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = -40 + Math.random() * 20;
      positions[i * 3 + 2] = Math.random() * 200 - 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x8888aa, transparent: true, opacity: 0.04,
      size: 30, depthWrite: false, blending: THREE.AdditiveBlending,
    });

    fog = new THREE.Points(geometry, mat);
    scene.add(fog);
  }

  /* ---- Shooting Stars ---- */
  function createShootingStars() {
    function spawn() {
      if (!initialized) return;

      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(6);

      const startX = (Math.random() - 0.3) * 300;
      const startY = 50 + Math.random() * 80;
      const angle = -0.5 - Math.random() * 0.8;
      const length = 30 + Math.random() * 40;

      positions[0] = startX;
      positions[1] = startY;
      positions[2] = -200;
      positions[3] = startX + Math.cos(angle) * length;
      positions[4] = startY + Math.sin(angle) * length;
      positions[5] = -200;

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 1, linewidth: 1,
      });

      const star = new THREE.Line(geo, mat);
      star.userData = { progress: 0, startX, startY, angle, length };

      scene.add(star);
      shootingStars.push(star);

      setTimeout(() => {
        scene.remove(star);
        geo.dispose();
        mat.dispose();
        shootingStars = shootingStars.filter(s => s !== star);
      }, 1200);
    }

    function scheduleNext() {
      setTimeout(() => {
        if (!initialized) return;
        spawn();
        scheduleNext();
      }, CONFIG.shootingStarInterval + Math.random() * 6000);
    }

    scheduleNext();
  }

  function onMouseMove(e) {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    if (!initialized) return;
    animId = requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    mouseX += (targetMouseX - mouseX) * 0.03;
    mouseY += (targetMouseY - mouseY) * 0.03;

    camera.position.x = mouseX * CONFIG.parallaxStrength;
    camera.position.y = -mouseY * CONFIG.parallaxStrength * 0.5;
    camera.lookAt(0, 0, -100);

    if (starField) {
      starField.material.uniforms.uTime.value = time;
      starField.rotation.y = time * 0.003;
    }

    clouds.forEach(cloud => {
      cloud.position.x = cloud.userData.baseX + Math.sin(time * cloud.userData.speed) * 40;
      cloud.position.x += time * cloud.userData.speed * 2;
      if (cloud.position.x > 350) cloud.position.x = -350;
    });

    if (moonGlow) {
      moonGlow.material.opacity = 0.5 + Math.sin(time * 0.5) * 0.15;
    }

    shootingStars.forEach(star => {
      star.userData.progress += 0.02;
      const p = Math.min(star.userData.progress, 1);
      const opacity = p < 0.3 ? p / 0.3 : (1 - p) / 0.7;
      star.material.opacity = Math.max(0, opacity);

      const positions = star.geometry.attributes.position.array;
      positions[3] = star.userData.startX + Math.cos(star.userData.angle) * star.userData.length * p;
      positions[4] = star.userData.startY + Math.sin(star.userData.angle) * star.userData.length * p;
      star.geometry.attributes.position.needsUpdate = true;
    });

    if (fog) {
      const pos = fog.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += Math.sin(time * 0.1 + i) * 0.02;
      }
      fog.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  function triggerMoonClick() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(6);
        const startX = CONFIG.moonPosition.x + (Math.random() - 0.5) * 30;
        const startY = CONFIG.moonPosition.y + (Math.random() - 0.5) * 20;
        positions[0] = startX;
        positions[1] = startY;
        positions[2] = CONFIG.moonPosition.z;
        const angle = -Math.PI / 4 - Math.random() * 0.5;
        const length = 50 + Math.random() * 60;
        positions[3] = startX + Math.cos(angle) * length;
        positions[4] = startY + Math.sin(angle) * length;
        positions[5] = CONFIG.moonPosition.z;
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
        const star = new THREE.Line(geo, mat);
        star.userData = { progress: 0, startX, startY, angle, length };
        scene.add(star);
        shootingStars.push(star);
        setTimeout(() => {
          scene.remove(star);
          geo.dispose();
          mat.dispose();
          shootingStars = shootingStars.filter(s => s !== star);
        }, 1200);
      }, i * 150);
    }
  }

  function getScene() { return scene; }
  function getCamera() { return camera; }

  function destroy() {
    initialized = false;
    cancelAnimationFrame(animId);
    removeEventListener('mousemove', onMouseMove);
    removeEventListener('touchmove', onTouchMove);
    removeEventListener('resize', onResize);
    if (renderer) renderer.dispose();
  }

  return { init, triggerMoonClick, getScene, getCamera, destroy };
})();
