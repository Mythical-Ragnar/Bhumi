/* ============================================
   AUDIO.JS — Howler.js Spatial Audio System
   Ambient sounds, music, reactive volume
   ============================================ */

const AudioEngine = (() => {
  let isInitialized = false;
  let isMuted = true; // Start muted until user interacts
  let masterVolume = 0.6;

  // Sound objects
  let ambient = null;
  let wind = null;
  let crickets = null;
  let piano = null;
  let strings = null;
  let leaves = null;
  let birds = null;
  let heartbeat = null;
  let engine = null;
  let sealSound = null;
  let sparkSound = null;
  let pageTurn = null;
  let penScratch = null;

  // We'll use tone synthesis fallback since we can't host audio files
  let audioCtx = null;
  let masterGain = null;

  function init() {
    if (isInitialized) return;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(audioCtx.destination);
      isInitialized = true;
    } catch (e) {
      console.warn('Audio not supported');
    }
  }

  function resume() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  /* ---- Synthesized Sounds ---- */

  function playWind(volume = 0.08) {
    if (!audioCtx || isMuted) return;
    resume();

    // Brown noise via buffer
    const bufferSize = audioCtx.sampleRate * 3;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gain = audioCtx.createGain();
    gain.gain.value = volume;
    gain.gain.setTargetAtTime(volume, audioCtx.currentTime, 2);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();

    return { source, gain, filter };
  }

  function playCrickets(volume = 0.04) {
    if (!audioCtx || isMuted) return;
    resume();

    // Cricket chirps using oscillators
    const chirpInterval = setInterval(() => {
      if (isMuted || !audioCtx) {
        clearInterval(chirpInterval);
        return;
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.frequency.value = 4000 + Math.random() * 2000;
      osc.type = 'sine';

      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.005);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.06);

      // Second chirp
      setTimeout(() => {
        if (isMuted || !audioCtx) return;
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.frequency.value = osc.frequency.value + 200;
        osc2.type = 'sine';
        const now2 = audioCtx.currentTime;
        gain2.gain.setValueAtTime(0, now2);
        gain2.gain.linearRampToValueAtTime(volume * 0.25, now2 + 0.005);
        gain2.gain.linearRampToValueAtTime(0, now2 + 0.04);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now2);
        osc2.stop(now2 + 0.05);
      }, 80);
    }, 2000 + Math.random() * 3000);

    return { stop: () => clearInterval(chirpInterval) };
  }

  function playHeartbeat(callback) {
    if (!audioCtx || isMuted) {
      if (callback) setTimeout(callback, 1200);
      return;
    }
    resume();

    const beats = [0, 200, 600, 800];
    const now = audioCtx.currentTime;

    beats.forEach(delay => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = 50 + Math.random() * 5;
      osc.type = 'sine';

      const t = now + delay / 1000;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });

    if (callback) setTimeout(callback, 1200);
  }

  function playSealCrack() {
    if (!audioCtx || isMuted) return;
    resume();

    // Cracking sound: filtered noise burst
    const bufferSize = audioCtx.sampleRate * 0.3;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.12;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
  }

  function playEngineStart() {
    if (!audioCtx || isMuted) return;
    resume();

    // Engine rumble: low frequency oscillator with modulation
    const osc = audioCtx.createOscillator();
    osc.frequency.value = 60;
    osc.type = 'sawtooth';

    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 8;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.8);
    gain.gain.linearRampToValueAtTime(0, now + 2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    lfo.start();
    osc.start();
    osc.stop(now + 2);
    lfo.stop(now + 2);
  }

  function playPenScratch() {
    if (!audioCtx || isMuted) return;
    resume();

    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (bufferSize * 0.3));
      data[i] = (Math.random() * 2 - 1) * env * 0.1;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.05;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
  }

  function playPageTurn() {
    if (!audioCtx || isMuted) return;
    resume();

    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / audioCtx.sampleRate;
      const env = Math.sin(Math.PI * t / 0.5);
      data[i] = (Math.random() * 2 - 1) * env * 0.08;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 1;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.1;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
  }

  function playSparkle() {
    if (!audioCtx || isMuted) return;
    resume();

    const now = audioCtx.currentTime;
    [800, 1200, 1600].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';

      const t = now + i * 0.05;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  /* ---- Volume Control ---- */
  function setVolume(value) {
    masterVolume = value;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(
        isMuted ? 0 : value,
        audioCtx.currentTime,
        0.3
      );
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(
        isMuted ? 0 : masterVolume,
        audioCtx.currentTime,
        0.3
      );
    }
    return isMuted;
  }

  function getMuted() {
    return isMuted;
  }

  function destroy() {
    if (audioCtx) {
      audioCtx.close();
    }
  }

  return {
    init, resume, setVolume, toggleMute, getMuted, destroy,
    playWind, playCrickets, playHeartbeat, playSealCrack,
    playEngineStart, playPenScratch, playPageTurn, playSparkle,
  };
})();
