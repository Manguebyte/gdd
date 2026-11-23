// Efeitos sonoros do Orbitfall, sintetizados na hora com a Web Audio API (sem arquivos de áudio).
// POR QUE: o jogo é 8-bit; ondas quadradas, triangulares e ruído dão o som de console retrô
// sem custo de geração nem arquivos a publicar. Cada som é uma "receita" curta, fácil de
// ajustar no playtest (tom, duração, volume).
// ESTRATÉGIA: SFX.play('nome') toca a receita. Um intervalo mínimo por som (gap) evita que
// dezenas de tiros no mesmo frame virem barulho, e cada toque varia o tom em ±4%.
// O navegador só libera áudio depois de um toque, então o contexto nasce no primeiro pointerdown.
const SFX = (() => {
  let ac = null, master = null, noiseBuf = null;
  const last = {};

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain();
      master.connect(ac.destination);
      // 1 s de ruído branco, reaproveitado por todas as explosões.
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
  }
  addEventListener('pointerdown', ensure, true);
  addEventListener('keydown', ensure, true);

  // Volume vem do save do jogo (Settings): som desligado = 0.
  function volume() {
    const s = typeof save !== 'undefined' && save && save.settings;
    if (!s) return 0.7;
    return s.sound === false ? 0 : (s.volume ?? 0.7);
  }

  // Envelope: sobe rápido e cai exponencialmente até quase zero no fim da nota.
  function env(g, t, dur, gain, attack = 0.004) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  // Uma nota com tom deslizando de f0 para f1.
  function tone(t0, { type = 'square', f0, f1 = f0, dur, gain = 0.2, at = 0, k = 1 }) {
    const t = t0 + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0 * k, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1 * k, t + dur);
    env(g, t, dur, gain);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // Ruído passando por um filtro cuja frequência desliza de f0 para f1 (explosões, impactos).
  function noise(t0, { dur, gain = 0.3, f0 = 3000, f1 = f0, filter = 'lowpass', q = 0.7, at = 0 }) {
    const t = t0 + at, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = filter; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, dur, gain);
    s.connect(f).connect(g).connect(master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  // gap: segundos mínimos entre dois toques do mesmo som.
  const RECIPES = {
    shoot:     { gap: 0.045, play: (t, k) => tone(t, { f0: 900, f1: 420, dur: 0.07, gain: 0.07, k }) },
    crit:      { gap: 0.06,  play: (t, k) => { tone(t, { f0: 1300, f1: 1900, dur: 0.05, gain: 0.08, k }); tone(t, { type: 'triangle', f0: 2400, dur: 0.12, gain: 0.1, at: 0.04, k }); } },
    expSmall:  { gap: 0.04,  play: (t, k) => { noise(t, { dur: 0.18, gain: 0.22, f0: 3500 * k, f1: 300 }); tone(t, { f0: 220, f1: 55, dur: 0.12, gain: 0.08, k }); } },
    expBig:    { gap: 0.08,  play: (t, k) => { noise(t, { dur: 0.4, gain: 0.35, f0: 2200 * k, f1: 150 }); tone(t, { f0: 130, f1: 35, dur: 0.32, gain: 0.14, k }); } },
    expMother: { gap: 0.5,   play: (t, k) => {
      noise(t, { dur: 1.6, gain: 0.5, f0: 2800, f1: 70 });
      noise(t, { dur: 1.0, gain: 0.35, f0: 1800, f1: 90, at: 0.35 });
      tone(t, { type: 'triangle', f0: 95, f1: 25, dur: 1.3, gain: 0.35, k });
      for (let i = 0; i < 4; i++) tone(t, { f0: 600 - i * 110, f1: 80, dur: 0.18, gain: 0.07, at: 0.1 + i * 0.22, k });
    } },
    planetHit: { gap: 0.08,  play: (t, k) => { tone(t, { type: 'triangle', f0: 170, f1: 45, dur: 0.24, gain: 0.4, k }); noise(t, { dur: 0.12, gain: 0.2, f0: 900, f1: 200 }); } },
    // Aviso do laser: 6 bipes subindo ao longo do 1,5 s de telegrafia.
    laserWarn: { gap: 1,     play: (t) => { for (let i = 0; i < 6; i++) tone(t, { f0: 480 + i * 80, dur: 0.11, gain: 0.07, at: i * 0.25 }); } },
    laserFire: { gap: 0.3,   play: (t, k) => { tone(t, { type: 'sawtooth', f0: 1400, f1: 180, dur: 0.45, gain: 0.12, k }); noise(t, { dur: 0.45, gain: 0.2, f0: 1500, filter: 'bandpass', q: 2 }); } },
    reflect:   { gap: 0.05,  play: (t, k) => { tone(t, { f0: 1800, dur: 0.1, gain: 0.07, k }); tone(t, { type: 'triangle', f0: 2700, dur: 0.14, gain: 0.09, k }); } },
    shield:    { gap: 0.1,   play: (t, k) => { tone(t, { type: 'triangle', f0: 300, f1: 950, dur: 0.22, gain: 0.25, k }); tone(t, { f0: 1200, f1: 600, dur: 0.12, gain: 0.05, at: 0.05, k }); } },
    waveWarn:  { gap: 0.5,   play: (t) => { tone(t, { f0: 660, dur: 0.1, gain: 0.08 }); tone(t, { f0: 880, dur: 0.14, gain: 0.08, at: 0.14 }); } },
    // Boss Wave: sirene alternando dois tons.
    bossWarn:  { gap: 1,     play: (t) => { for (let i = 0; i < 4; i++) tone(t, { type: 'sawtooth', f0: i % 2 ? 330 : 440, dur: 0.16, gain: 0.08, at: i * 0.2 }); } },
    buy:       { gap: 0.05,  play: (t) => { tone(t, { f0: 988, dur: 0.06, gain: 0.08 }); tone(t, { f0: 1319, dur: 0.14, gain: 0.08, at: 0.06 }); } },
    launch:    { gap: 0.08,  play: (t, k) => { tone(t, { f0: 200, f1: 800, dur: 0.15, gain: 0.08, k }); noise(t, { dur: 0.15, gain: 0.08, f0: 600, f1: 3000, filter: 'bandpass' }); } },
    click:     { gap: 0.03,  play: (t) => tone(t, { f0: 1200, dur: 0.03, gain: 0.05 }) },
    gameOver:  { gap: 2,     play: (t) => {
      [440, 370, 311, 220].forEach((f, i) => tone(t, { f0: f, f1: i === 3 ? 110 : f, dur: i === 3 ? 0.7 : 0.2, gain: 0.1, at: i * 0.22 }));
    } },
  };

  function play(name) {
    const r = RECIPES[name];
    if (!r || !ac || ac.state !== 'running') return;
    const v = volume();
    if (v <= 0) return;
    const t = ac.currentTime;
    if (t - (last[name] ?? -9) < r.gap) return;
    last[name] = t;
    master.gain.setValueAtTime(v, t);
    r.play(t, 1 + (Math.random() - 0.5) * 0.08);
  }

  return { play };
})();
