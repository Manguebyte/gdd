// game.js — Caderno de Aventuras: o RPG de caderno da escola.
//
// POR QUE: o herói anda pela folha e o "mestre" vai desenhando o mapa com
// canetas coloridas à medida que ele chega perto. Monstros, vilas e baús
// aparecem desenhados; brigar é rolar dados: cada item equipado dá dados
// (a espada de madeira dá 1d6, a melhor lâmina dá 5d20), a soma é o dano, e
// o monstro faz o mesmo de volta. Escudo e armadura rolam dados de defesa
// que descontam do dano recebido.
//
// ESTRATÉGIA: o mapa revelado é "assado" em pedaços de canvas (chunks) e só
// os quadrados novos são desenhados a cada quadro, aos poucos, com a caneta
// do mestre na ponta do traço. Menus e luta são HTML por cima, em folha
// pautada; dados e monstros são desenhados em canvas pequenos.
(function () {
  'use strict';
  const S = Sketch, C = S.C, A = Art, Wd = World;
  const T = 64, CH = 8, BAKE = 1.5;
  const SAVE_KEY = 'caderno-aventuras-save-v1';
  const $ = id => document.getElementById(id);
  const qs = new URLSearchParams(location.search);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- dados do jogo (números são proposta) ----------
  const ITEMS = {
    espada_madeira: { nome: 'Espada de madeira', slot: 'arma', dado: [1, 6], preco: 10, icon: 'sword', cor: C.BROWN, vila: 1 },
    espada_curta: { nome: 'Espada curta', slot: 'arma', dado: [1, 8], preco: 30, icon: 'sword', cor: C.GRAY, vila: 1 },
    espada_ferro: { nome: 'Espada de ferro', slot: 'arma', dado: [2, 6], preco: 70, icon: 'sword', cor: C.INK, vila: 1 },
    machado: { nome: 'Machado de guerra', slot: 'arma', dado: [2, 8], preco: 140, icon: 'axe', cor: C.GRAY, vila: 2 },
    espada_prata: { nome: 'Espada de prata', slot: 'arma', dado: [3, 8], preco: 260, icon: 'sword', cor: C.LBLUE, vila: 2 },
    montante: { nome: 'Montante', slot: 'arma', dado: [3, 12], preco: 480, icon: 'sword', cor: C.BLUE, vila: 3 },
    espada_runica: { nome: 'Espada rúnica', slot: 'arma', dado: [4, 12], preco: 800, icon: 'sword', cor: C.PURPLE, vila: 3 },
    lamina_dragao: { nome: 'Lâmina do Dragão', slot: 'arma', dado: [5, 20], preco: 1200, icon: 'sword', cor: C.RED, vila: 3 },
    tampa_panela: { nome: 'Tampa de panela', slot: 'escudo', dado: [1, 4], preco: 12, icon: 'shield', cor: C.GRAY, vila: 1 },
    escudo_madeira: { nome: 'Escudo de madeira', slot: 'escudo', dado: [1, 6], preco: 40, icon: 'shield', cor: C.BROWN, vila: 1 },
    escudo_ferro: { nome: 'Escudo de ferro', slot: 'escudo', dado: [2, 6], preco: 160, icon: 'shield', cor: C.INK, vila: 2 },
    escudo_torre: { nome: 'Escudo de torre', slot: 'escudo', dado: [3, 6], preco: 420, icon: 'shield', cor: C.BLUE, vila: 3 },
    roupa_couro: { nome: 'Roupa de couro', slot: 'armadura', dado: [1, 4], preco: 25, icon: 'armor', cor: C.BROWN, vila: 1 },
    cota_malha: { nome: 'Cota de malha', slot: 'armadura', dado: [2, 4], preco: 110, icon: 'armor', cor: C.GRAY, vila: 2 },
    placas: { nome: 'Armadura de placas', slot: 'armadura', dado: [2, 8], preco: 380, icon: 'armor', cor: C.INK, vila: 2 },
    armadura_dragao: { nome: 'Armadura de dragão', slot: 'armadura', dado: [3, 10], preco: 950, icon: 'armor', cor: C.RED, vila: 3 },
    pocao_vida: { nome: 'Poção de vida', slot: 'pocao', dado: [3, 6], preco: 12, icon: 'potion', cor: C.RED, vila: 1, efeito: 'hp' },
    pocao_mana: { nome: 'Poção de magia', slot: 'pocao', dado: [2, 4], preco: 15, icon: 'potion', cor: C.BLUE, vila: 1, efeito: 'pm' },
  };
  // Feitiço gasta Magia (PM) e ignora a defesa do monstro.
  const SPELLS = {
    faisca: { nome: 'Faísca', pm: 1, dado: [2, 4], tipo: 'dano', cor: C.YELLOW, preco: 30, vila: 1 },
    cura: { nome: 'Cura', pm: 2, dado: [2, 6], tipo: 'cura', cor: C.GREEN, preco: 45, vila: 1 },
    bola_fogo: { nome: 'Bola de fogo', pm: 3, dado: [3, 8], tipo: 'dano', cor: C.ORANGE, preco: 150, vila: 2 },
    raio: { nome: 'Raio', pm: 5, dado: [4, 10], tipo: 'dano', cor: C.PURPLE, preco: 420, vila: 3 },
  };
  const MONSTERS = {
    slime: { nome: 'Slime', art: 'o', hp: 8, atk: [1, 4], def: null, ouro: [2, 4], xp: 3 },
    rato: { nome: 'Rato gigante', art: 'o', hp: 6, atk: [1, 6], def: null, ouro: [2, 4], xp: 3 },
    goblin: { nome: 'Goblin', art: 'o', hp: 14, atk: [2, 4], def: null, ouro: [3, 6], xp: 7 },
    lobo: { nome: 'Lobo', art: 'o', hp: 16, atk: [1, 10], def: null, ouro: [3, 6], xp: 7 },
    esqueleto: { nome: 'Esqueleto', art: 'o', hp: 24, atk: [2, 6], def: [1, 4], ouro: [4, 6], xp: 12 },
    aranha: { nome: 'Aranha gigante', art: 'a', hp: 22, atk: [2, 6], def: [1, 4], ouro: [4, 6], xp: 12 },
    orc: { nome: 'Orc', art: 'o', hp: 38, atk: [2, 8], def: [1, 6], ouro: [4, 10], xp: 20 },
    bruxa: { nome: 'Bruxa do pântano', art: 'a', hp: 32, atk: [3, 6], def: null, ouro: [4, 10], xp: 20 },
    ogro: { nome: 'Ogro', art: 'o', hp: 62, atk: [3, 8], def: [2, 4], ouro: [6, 10], xp: 35 },
    cavaleiro: { nome: 'Cavaleiro negro', art: 'o', hp: 56, atk: [3, 10], def: [2, 6], ouro: [6, 10], xp: 35 },
    troll: { nome: 'Troll', art: 'o', hp: 92, atk: [4, 8], def: [2, 6], ouro: [8, 10], xp: 60 },
    golem: { nome: 'Golem de pedra', art: 'o', hp: 110, atk: [3, 12], def: [3, 6], ouro: [8, 10], xp: 60 },
    dragao: { nome: 'Dragão Vermelho', art: 'o', hp: 240, atk: [5, 12], def: [2, 6], ouro: [10, 20], xp: 0 },
  };
  const um = m => m.art === 'a' ? 'uma' : 'um';
  const xpNext = l => Math.round(10 * Math.pow(l, 1.5));

  const NPC_LINES = [
    'Dizem que o dragão mora no ponto mais longe daqui. Quanto mais longe você vai, mais forte é o monstro.',
    'Defesa alta? Feitiço não liga pra escudo: a magia passa direto.',
    'Cada arma dá dados. A espada de madeira é 1d6... já ouvi falar de uma lâmina que rola 5d20!',
    'Escudo e armadura também rolam dados. A soma deles sai do dano que você toma.',
    'Se desmaiar, você acorda na última vila por onde passou, mas perde metade do ouro.',
    'A Aldeia Borracha vende coisa melhor que a Vila Apontador. A Cidade Régua, melhor ainda.',
    'Monstro desenhado no mapa não corre atrás de ninguém. Você escolhe se quer brigar.',
    'No mato fechado aparece bicho do nada. Cuidado na floresta e no pântano.',
    'Baú tem moeda, poção e, com sorte, equipamento bom.',
    'Fugir é rolar um d20. Logo no começo da luta é mais fácil.',
    'Quando o mestre faz um X em cima de alguma coisa, é porque já foi resolvida.',
  ];
  const VILLAGE_TEXT = [
    'Primeira vila da ilha. Tem pousada, ferreiro e uma senhora que vende poção.',
    'Uma aldeia no meio do caminho. O ferreiro daqui trabalha com ferro e prata.',
    'A maior cidade da ilha. Dizem que o ferreiro forjou uma lâmina com escama de dragão.',
  ];
  const TERRAIN_TEXT = {
    [Wd.AREIA]: 'Praia! O mestre faz pontinhos de areia com a caneta amarela.',
    [Wd.MATA]: 'Floresta! O mestre rabisca um monte de arvorezinhas. No mato aparece mais monstro.',
    [Wd.PANTANO]: 'Pântano... cheira mal e esconde bicho. O mestre pinta tudo de verde-oliva.',
  };
  const REGION_TEXT = {
    2: 'O mestre sorri: "daqui pra frente tem goblin e lobo".',
    3: 'Esqueletos e aranhas por aqui. Melhor ter escudo.',
    4: 'Terra de orcs e bruxas. O mestre aperta a caneta com força.',
    5: 'Ogros e cavaleiros negros... você está longe de casa.',
    6: 'Trolls e golens. O covil do dragão deve estar perto.',
  };

  // ---------- estado ----------
  let W = null, P = null, G = null;
  const newState = () => ({
    rev: new Uint8Array(W.W * W.H), dead: new Set(), opened: new Set(), talked: new Set(), trail: new Set(),
    seen: new Set(), steps: 0, kills: 0, won: false,
  });
  function newPlayer(nome) {
    return {
      nome, lvl: 1, xp: 0, hp: 20, hpMax: 20, pm: 3, pmMax: 3, ouro: 15,
      equip: { arma: 'espada_madeira', escudo: null, armadura: null },
      bolsa: [], pocoes: { pocao_vida: 2, pocao_mana: 0 }, magias: [],
      x: W.start % W.W, y: (W.start / W.W) | 0, respawn: W.start,
    };
  }
  const fmtD = d => d ? `${d[0]}d${d[1]}` : '—';
  const expand = list => list.flatMap(d => d ? Array(d[0]).fill(d[1]) : []);
  const avg = d => d ? d[0] * (d[1] + 1) / 2 : 0;
  const atkDie = () => P.equip.arma ? ITEMS[P.equip.arma].dado : [1, 2];
  const defDice = () => [P.equip.escudo, P.equip.armadura].filter(Boolean).map(id => ITEMS[id].dado);
  const idx = (x, y) => y * W.W + x;

  // ---------- som (sintetizado, sem arquivos) ----------
  const SFX = {
    ac: null, on: true,
    init() {
      if (!this.ac) { try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
      if (this.ac.state === 'suspended') this.ac.resume();
    },
    noise(dur, freq, vol, q = 1) {
      if (!this.on || !this.ac) return;
      const ac = this.ac, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
      s.connect(f).connect(g).connect(ac.destination); s.start();
    },
    tone(freq, dur, vol, type = 'triangle') {
      if (!this.on || !this.ac) return;
      const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
    },
    dice() { for (let k = 0; k < 6; k++) setTimeout(() => this.noise(0.03, 1800 + Math.random() * 1500, 0.3, 4), k * 75 + Math.random() * 30); },
    scribble() { this.noise(0.08, 2600 + Math.random() * 1600, 0.04, 1.4); },
    hit() { this.noise(0.16, 320, 0.5, 1); this.tone(110, 0.15, 0.15, 'square'); },
    coin() { this.tone(988, 0.08, 0.1); setTimeout(() => this.tone(1319, 0.14, 0.1), 70); },
    step() { this.noise(0.04, 900, 0.06, 2); },
    lvl() { [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => this.tone(f, 0.16, 0.1), k * 90)); },
  };

  // ---------- canvas do mapa ----------
  const cv = $('map'), ctx = cv.getContext('2d');
  let vw = 0, vh = 0, dpr = 1, now = 0, last = 0;
  const cam = { x: 0, y: 0, z: 1, over: false };
  const chunks = new Map(), anims = [];
  let walker = null, path = [], held = null, tap = null, face = 1, lastScrib = 0, panelOpen = false;
  const heroFrames = [A.hero(0), A.hero(1)];

  // Granulado do papel: um padrão de pontinhos por cima de tudo.
  const grain = (() => {
    const g = document.createElement('canvas'); g.width = g.height = 160;
    const x = g.getContext('2d');
    for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(120,100,70,${Math.random() * 0.09})`; x.fillRect(Math.random() * 160, Math.random() * 160, 1 + Math.random(), 1 + Math.random()); }
    return ctx.createPattern(g, 'repeat');
  })();

  // Desktop vê ~12 quadrados de largura; celular em pé, ~6,5 (senão o herói some).
  function baseZoom() { return Math.max(0.55, Math.min(1.35, Math.min(vw / (T * (vw < vh ? 6.5 : 12)), vh / (T * 8.5)))); }
  function overZoom() { return Math.min(vw / (W.W * T), vh / (W.H * T)) * 0.96; }
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = innerWidth; vh = innerHeight;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  }
  addEventListener('resize', resize);
  resize();

  function chunk(cx, cy) {
    const key = cx + ',' + cy;
    let c = chunks.get(key);
    if (!c) {
      const k = document.createElement('canvas');
      k.width = k.height = CH * T * BAKE;
      const x = k.getContext('2d');
      x.setTransform(BAKE, 0, 0, BAKE, -cx * CH * T * BAKE, -cy * CH * T * BAKE);
      c = { cv: k, x, cx, cy };
      chunks.set(key, c);
    }
    return c;
  }
  // "Assa" traços prontos nos chunks que eles tocam.
  function bake(list) {
    const b = S.bbox(list), sz = CH * T;
    for (let cy = Math.floor(b.y0 / sz); cy <= Math.floor(b.y1 / sz); cy++)
      for (let cx = Math.floor(b.x0 / sz); cx <= Math.floor(b.x1 / sz); cx++) S.drawAll(chunk(cx, cy).x, list, 1);
  }
  // Põe traços na fila da caneta do mestre; ao terminar, vão para o chunk.
  function animate(list, delay = 0, speed = 1) {
    anims.push({ list, t0: performance.now() + delay, dur: (260 + Math.min(1100, S.total(list) * 0.42)) / speed });
  }

  function reveal(px, py, instant) {
    const found = [];
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const d = dx * dx + dy * dy, x = px + dx, y = py + dy;
      if (d > 6.8 || x < 0 || y < 0 || x >= W.W || y >= W.H || G.rev[idx(x, y)]) continue;
      G.rev[idx(x, y)] = 1;
      found.push([x, y, d + Math.random() * 0.5]);
    }
    found.sort((a, b) => a[2] - b[2]);
    found.forEach(([x, y], k) => { const s = A.tile(W, x, y, T, G); if (instant) bake(s); else animate(s, k * 70); });
  }
  function addTrail(ax, ay, bx, by, instant) {
    const a = idx(ax, ay), b = idx(bx, by), key = Math.min(a, b) + '-' + Math.max(a, b);
    if (!instant && G.trail.has(key)) return;
    G.trail.add(key);
    const s = A.trail(ax, ay, bx, by, T, S.hash(W.seed, a, b));
    if (instant) bake(s); else animate(s, 0, 2.5);
  }
  function rebakeAll() {
    chunks.clear(); anims.length = 0;
    for (let i = 0; i < G.rev.length; i++) if (G.rev[i]) bake(A.tile(W, i % W.W, (i / W.W) | 0, T, G));
    for (const key of G.trail) {
      const [a, b] = key.split('-').map(Number);
      bake(A.trail(a % W.W, (a / W.W) | 0, b % W.W, (b / W.W) | 0, T, S.hash(W.seed, a, b)));
    }
  }

  // ---------- desenho da tela ----------
  function heroPos() {
    if (!walker) return [P.x, P.y];
    const t = walker.t, e = t * t * (3 - 2 * t);
    return [walker.fx + (walker.tx - walker.fx) * e, walker.fy + (walker.ty - walker.fy) * e];
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.PAPER; ctx.fillRect(0, 0, vw, vh);
    if (!W) { drawMargin(); return; }
    const z = cam.z, ox = vw / 2 - cam.x * z, oy = vh / 2 - cam.y * z;
    // Pauta do caderno presa ao mundo: as linhas acompanham o mapa.
    const sp = 32 * z;
    ctx.strokeStyle = C.LINE; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
    ctx.beginPath();
    for (let y = ((oy % sp) + sp) % sp; y < vh; y += sp) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(vw, Math.round(y) + 0.5); }
    ctx.stroke(); ctx.globalAlpha = 1;

    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy);
    const sz = CH * T;
    const x0 = Math.floor(-ox / z / sz) - 1, x1 = Math.floor((vw - ox) / z / sz), y0 = Math.floor(-oy / z / sz) - 1, y1 = Math.floor((vh - oy) / z / sz);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const c = chunks.get(cx + ',' + cy);
      if (c) ctx.drawImage(c.cv, cx * sz, cy * sz, sz, sz);
    }
    // Traços ainda sendo desenhados pelo mestre.
    let head = null;
    for (let k = anims.length - 1; k >= 0; k--) {
      const a = anims[k];
      if (now < a.t0) continue;
      const p = (now - a.t0) / a.dur;
      if (p >= 1) { bake(a.list); anims.splice(k, 1); continue; }
      const h = S.drawAll(ctx, a.list, p);
      if (h && !head) head = h;
    }
    // Caminho planejado (toque/clique): pontinhos de lápis.
    ctx.fillStyle = C.GRAY;
    for (const [x, y] of path) { ctx.beginPath(); ctx.arc(x * T + T / 2, y * T + T / 2 + 8, 2.4, 0, 7); ctx.fill(); }

    const [hx, hy] = heroPos();
    const px = hx * T + T / 2, py = hy * T + T / 2;
    const bob = walker ? -Math.abs(Math.sin(walker.t * Math.PI)) * 5 : Math.sin(now / 400) * 1.2;
    ctx.fillStyle = 'rgba(43,47,69,0.18)';
    ctx.beginPath(); ctx.ellipse(px, py + 21, 14, 4, 0, 0, 7); ctx.fill();
    ctx.save();
    ctx.translate(px, py - 4 + bob); ctx.scale(0.5 * face, 0.5); ctx.translate(-50, -52);
    S.drawAll(ctx, heroFrames[walker && walker.t > 0.5 ? 1 : 0], 1);
    ctx.restore();

    if (head) drawPen(head);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMargin();
  }
  // A caneta do mestre, com a cor do traço que está desenhando.
  function drawPen(h) {
    ctx.save();
    ctx.translate(h.x, h.y); ctx.rotate(0.55);
    ctx.lineWidth = 1.4; ctx.strokeStyle = C.INK;
    ctx.fillStyle = '#d9d4c6';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4.5, -11); ctx.lineTo(4.5, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = h.color || C.INK;
    ctx.fillRect(-5.5, -52, 11, 41); ctx.strokeRect(-5.5, -52, 11, 41);
    ctx.fillStyle = C.INK; ctx.fillRect(-6, -64, 12, 13);
    ctx.fillStyle = h.color || C.INK; ctx.fillRect(4, -62, 3, 18);
    ctx.restore();
  }
  // Margem vermelha e furos do caderno, fixos na tela.
  function drawMargin() {
    const m = vw < 640 ? 22 : 40;
    ctx.fillStyle = C.PAPER; ctx.fillRect(0, 0, m, vh);
    ctx.strokeStyle = C.MARGIN; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(m + 0.5, 0); ctx.lineTo(m + 0.5, vh); ctx.stroke();
    ctx.fillStyle = '#e8e2d2'; ctx.strokeStyle = 'rgba(43,47,69,0.25)'; ctx.lineWidth = 1;
    for (let y = 70; y < vh; y += 110) { ctx.beginPath(); ctx.arc(m / 2, y, m * 0.22, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.globalAlpha = 0.6; ctx.fillStyle = grain; ctx.fillRect(0, 0, vw, vh); ctx.globalAlpha = 1;
  }

  // ---------- laço principal ----------
  function tick(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts; now = ts;
    if (W) {
      if (walker) {
        walker.t += dt / 0.16;
        if (walker.t >= 1) { const w = walker; walker = null; P.x = w.tx; P.y = w.ty; arrive(w.fx, w.fy); }
      } else if (!panelOpen) {
        // `tap` guarda um toque rápido de tecla que começou e acabou entre dois quadros.
        const dir = tap || held;
        tap = null;
        if (path.length) { const [x, y] = path.shift(); stepTo(x, y); }
        else if (dir) stepTo(P.x + dir[0], P.y + dir[1]);
      }
      const [hx, hy] = heroPos();
      const tx = cam.over ? W.W * T / 2 : hx * T + T / 2, ty = cam.over ? W.H * T / 2 : hy * T + T / 2 + 20;
      const tz = cam.over ? overZoom() : baseZoom(), k = Math.min(1, dt * 5);
      cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.z += (tz - cam.z) * k;
      if (anims.some(a => now >= a.t0) && now - lastScrib > 110) { lastScrib = now; SFX.scribble(); }
    }
    draw();
    requestAnimationFrame(tick);
  }

  // ---------- movimento e eventos do mapa ----------
  function blocking(i) {
    const o = W.obj.get(i);
    return o && ((o.type === 'monstro' && !G.dead.has(i)) || o.type === 'npc' || (o.type === 'covil' && !G.won));
  }
  function stepTo(nx, ny) {
    if (nx < 0 || ny < 0 || nx >= W.W || ny >= W.H) return;
    if (nx !== P.x) face = nx > P.x ? 1 : -1;
    const i = idx(nx, ny), o = W.obj.get(i);
    if (blocking(i)) {
      path = []; held = null;
      if (o.type === 'monstro') meetMonster(i, o);
      else if (o.type === 'npc') talk(i, o);
      else lair(i);
      return;
    }
    if (!Wd.passable(W.t[i])) {
      path = [];
      if (!stepTo.warned || now - stepTo.warned > 2500) {
        stepTo.warned = now;
        narrate(W.t[i] === Wd.AGUA ? pick(['Aí é água! Sem barco, nada feito.', 'O mestre balança a cabeça: "não dá pra nadar".']) : 'Montanha íngreme demais. Dá a volta.');
      }
      return;
    }
    walker = { fx: P.x, fy: P.y, tx: nx, ty: ny, t: 0 };
    SFX.step();
  }
  // Busca em largura pelos quadrados já desenhados (toque/clique no mapa).
  function findPath(tx, ty) {
    const goal = idx(tx, ty), start = idx(P.x, P.y), prev = new Int32Array(W.W * W.H).fill(-1), q = [start];
    prev[start] = start;
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      if (i === goal) break;
      const x = i % W.W, y = (i / W.W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W.W || ny >= W.H) continue;
        const j = idx(nx, ny);
        if (prev[j] >= 0 || !G.rev[j]) continue;
        if (j !== goal && (!Wd.passable(W.t[j]) || blocking(j))) continue;
        prev[j] = i; q.push(j);
      }
    }
    if (prev[goal] < 0 || goal === start) return null;
    const out = [];
    for (let i = goal; i !== start; i = prev[i]) out.unshift([i % W.W, (i / W.W) | 0]);
    return out;
  }
  const nearVillage = (x, y) => W.villages.some(v => Math.abs(v % W.W - x) <= 2 && Math.abs(((v / W.W) | 0) - y) <= 2);

  function arrive(fx, fy) {
    G.steps++;
    addTrail(fx, fy, P.x, P.y);
    reveal(P.x, P.y);
    const i = idx(P.x, P.y), t = W.t[i], tier = W.tier[i], o = W.obj.get(i);
    if (TERRAIN_TEXT[t] && !G.seen.has('t' + t)) { G.seen.add('t' + t); narrate(TERRAIN_TEXT[t]); }
    else if (REGION_TEXT[tier] && !G.seen.has('r' + tier)) { G.seen.add('r' + tier); narrate(REGION_TEXT[tier]); }
    if (o && o.type === 'vila') { path = []; held = null; village(i, o); }
    else if (o && o.type === 'bau' && !G.opened.has(i)) { path = []; held = null; chest(i, o); }
    else if (!o && G.steps > 6 && !nearVillage(P.x, P.y)) {
      const chance = { [Wd.AREIA]: 0.04, [Wd.CAMPO]: 0.05, [Wd.MATA]: 0.085, [Wd.PANTANO]: 0.095 }[t] || 0;
      if (Math.random() < chance) { path = []; held = null; ambush(tier); }
    }
    hud(); save();
  }

  // ---------- painéis (folhas por cima do mapa) ----------
  const ic = (name, color, cls = 'ic') => `<img class="${cls}" src="${A.iconURL(name, color)}" alt="">`;
  const itemIc = id => ITEMS[id] ? ic(ITEMS[id].icon, ITEMS[id].cor) : ic('scroll', SPELLS[id].cor);
  function openPanel(html, cls = '') {
    const p = $('panel');
    p.className = 'sheet ' + cls; p.innerHTML = html; p.onclick = null; p.scrollTop = 0;
    $('overlay').hidden = false; panelOpen = true; held = null; tap = null; path = [];
  }
  function closePanel() { $('overlay').hidden = true; $('panel').innerHTML = ''; panelOpen = false; hud(); }
  // Botões que devolvem uma promessa com o valor escolhido.
  function ask(el, list) {
    return new Promise(res => {
      el.innerHTML = list.map((b, k) => `<button data-k="${k}" class="${b.cls || ''}" ${b.off ? 'disabled' : ''}>${b.html}</button>`).join('');
      el.onclick = e => {
        const bt = e.target.closest('button');
        if (!bt || bt.disabled) return;
        el.onclick = null; el.innerHTML = '';
        res(list[+bt.dataset.k].v);
      };
    });
  }
  function dialog(title, body, buttons, art) {
    openPanel(`<h2>${title}</h2><div class="dlg">${art ? `<img class="dlg-art" src="${art}" alt="">` : ''}<div>${body}</div></div><div class="actions" id="acts"></div>`, 'dialog');
    return ask($('acts'), buttons).then(v => { closePanel(); return v; });
  }

  let narrT = 0;
  function narrate(text) {
    const el = $('narr');
    el.innerHTML = `<b>Mestre:</b> ${text}`;
    el.hidden = false;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    clearTimeout(narrT);
    narrT = setTimeout(() => { el.hidden = true; }, 3200 + text.length * 35);
  }

  function hud() {
    if (!P) return;
    $('s-hp').querySelector('b').textContent = `${P.hp}/${P.hpMax}`;
    $('s-pm').querySelector('b').textContent = `${P.pm}/${P.pmMax}`;
    $('s-gold').querySelector('b').textContent = P.ouro;
    $('s-atk').querySelector('b').textContent = fmtD(atkDie());
    $('s-def').querySelector('b').textContent = defDice().map(fmtD).join(' + ') || '—';
    $('s-lvl').querySelector('b').textContent = `Nível ${P.lvl}`;
    $('s-lvl').querySelector('.xp i').style.width = Math.min(100, P.xp / xpNext(P.lvl) * 100) + '%';
  }

  // ---------- bandeja de dados ----------
  // Os dados rolam (números trocando, dado tremendo) e param um de cada vez.
  class Tray {
    constructor(canvas) {
      this.cv = canvas; this.ctx = canvas.getContext('2d'); this.groups = []; this.res = null;
      this.fit(); this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    }
    fit() {
      const r = this.cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      this.w = r.width || 320; this.h = r.height || 160;
      this.cv.width = this.w * d; this.cv.height = this.h * d;
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    roll(defs) {
      SFX.dice();
      const t0 = performance.now();
      this.res = null;
      this.groups = defs.map((g, gi) => ({
        ...g, total: null,
        dice: g.dice.map((s, k) => ({ s, v: 1 + rnd(s), final: 1 + rnd(s), stop: t0 + 600 + k * 90 + gi * 140, rot: 0, lt: 0 })),
      }));
      const end = Math.max(t0, ...this.groups.flatMap(g => g.dice.map(d => d.stop)));
      return new Promise(res => setTimeout(() => {
        for (const g of this.groups) g.total = g.dice.reduce((a, d) => a + d.final, 0);
        res(this.groups.map(g => g.total));
      }, end - t0 + 150));
    }
    result(big, small, color) { this.res = { big, small, color }; }
    loop(t) {
      if (!this.cv.isConnected) return;
      this.draw(t);
      requestAnimationFrame(this.loop);
    }
    draw(t) {
      const c = this.ctx, n = this.groups.length, resH = this.res ? 40 : 0;
      c.clearRect(0, 0, this.w, this.h);
      const rowH = n ? Math.min(100, (this.h - resH) / n) : 0;
      this.groups.forEach((g, gi) => {
        const y0 = gi * rowH, size = Math.max(22, Math.min(rowH - 28, (this.w - 80) / g.dice.length / 1.15, 58));
        c.font = `19px ${S.HAND}`; c.fillStyle = g.color; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillText(g.label, 6, y0 + 19);
        g.dice.forEach((d, k) => {
          const rolling = t < d.stop;
          if (rolling && t - d.lt > 55) { d.v = 1 + rnd(d.s); d.lt = t; d.rot = (Math.random() - 0.5) * 0.9; }
          if (!rolling) { d.v = d.final; d.rot = k % 2 ? 0.07 : -0.05; }
          const j = rolling ? 3 : 0;
          A.drawDie(c, d.s, d.v, 8 + size / 2 + k * size * 1.15 + (Math.random() - 0.5) * j, y0 + 26 + size / 2 + (Math.random() - 0.5) * j, size, g.color, d.rot);
        });
        if (g.total != null && g.dice.length > 1) {
          c.font = `${Math.round(Math.min(34, size * 0.7))}px ${S.HAND}`; c.fillStyle = C.INK;
          c.fillText('= ' + g.total, 10 + g.dice.length * size * 1.15, y0 + 26 + size * 0.68);
        }
      });
      if (this.res) {
        c.font = `34px ${S.TITLE}`; c.fillStyle = this.res.color || C.INK; c.textAlign = 'center';
        c.fillText(this.res.big + (this.res.small ? '  ' + this.res.small : ''), this.w / 2, this.h - 10);
      }
    }
  }

  // O monstro sendo desenhado na folha da luta, com os riscos dos golpes.
  class FoeView {
    constructor(canvas, kind) {
      this.cv = canvas; this.ctx = canvas.getContext('2d'); this.fx = []; this.t0 = performance.now(); this.x = null;
      const r = canvas.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      this.s = Math.min(r.width, r.height) || 200;
      canvas.width = r.width * d; canvas.height = r.height * d;
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
      this.ox = (r.width - this.s) / 2;
      this.list = S.xform(A.monster(kind), this.s / 100, this.ox, 0);
      this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    }
    hit(color) {
      this.fx.push({ list: S.xform(A.slash(rnd(1e9), color), this.s / 100, this.ox, 0), t0: performance.now() });
      this.cv.classList.remove('shake'); void this.cv.offsetWidth; this.cv.classList.add('shake');
    }
    defeat() { this.x = { list: S.xform(A.cross(0, 0, 100, 5), this.s / 100, this.ox, 0), t0: performance.now() }; }
    loop(t) {
      if (!this.cv.isConnected) return;
      const c = this.ctx;
      c.clearRect(0, 0, this.cv.width, this.cv.height);
      S.drawAll(c, this.list, Math.min(1, (t - this.t0) / 900));
      this.fx = this.fx.filter(f => t - f.t0 < 650);
      for (const f of this.fx) S.drawAll(c, f.list, Math.min(1, (t - f.t0) / 180));
      if (this.x) S.drawAll(c, this.x.list, Math.min(1, (t - this.x.t0) / 400));
      requestAnimationFrame(this.loop);
    }
  }

  // ---------- combate ----------
  async function combat(kind, opt = {}) {
    const md = MONSTERS[kind], m = { ...md, max: md.hp };
    openPanel(`
      <div class="combat">
        <div class="foe">
          <canvas id="foe-cv"></canvas>
          <h2>${m.nome}</h2>
          <div class="bar foe-bar"><i></i></div>
          <p class="small">${ic('heart')}<span id="foe-hp"></span> ${ic('sword')}${fmtD(m.atk)} ${ic('shield')}${fmtD(m.def)}</p>
        </div>
        <div class="side">
          <p class="me"><b>${esc(P.nome)}</b> ${ic('heart')}<span id="me-hp"></span> ${ic('star')}<span id="me-pm"></span></p>
          <div class="bar me-bar"><i></i></div>
          <canvas id="tray" class="tray"></canvas>
          <p id="clog" class="clog"></p>
          <div class="actions" id="acts"></div>
        </div>
      </div>`, 'fight');
    const foe = new FoeView($('foe-cv'), kind), tray = new Tray($('tray')), acts = $('acts');
    const log = txt => { $('clog').innerHTML = txt; };
    const bars = () => {
      $('foe-hp').textContent = `${Math.max(0, m.hp)}/${m.max}`;
      $('me-hp').textContent = `${Math.max(0, P.hp)}/${P.hpMax}`;
      $('me-pm').textContent = `${P.pm}/${P.pmMax}`;
      document.querySelector('.foe-bar i').style.width = Math.max(0, m.hp / m.max * 100) + '%';
      document.querySelector('.me-bar i').style.width = Math.max(0, P.hp / P.hpMax * 100) + '%';
      hud();
    };
    bars();
    log(opt.text || `${um(m)[0].toUpperCase() + um(m).slice(1)} ${m.nome} aparece! O mestre desenha rapidinho.`);
    await wait(500);

    const monsterTurn = async () => {
      const defs = defDice();
      const groups = [{ label: `${m.nome} ataca`, dice: expand([m.atk]), color: C.PURPLE }];
      if (defs.length) groups.push({ label: 'Sua defesa', dice: expand(defs), color: C.BLUE });
      const [a, d = 0] = await tray.roll(groups);
      const dmg = Math.max(0, a - d);
      P.hp -= dmg;
      tray.result(defs.length ? `${a} − ${d} = ${dmg}` : `${dmg}`, dmg ? 'de dano em você' : 'bloqueou tudo!', dmg ? C.PURPLE : C.BLUE);
      if (dmg) { SFX.hit(); const p = $('panel'); p.classList.remove('hurt'); void p.offsetWidth; p.classList.add('hurt'); }
      bars();
      await wait(650);
    };

    if (opt.ambush) { log(`${m.nome} ataca primeiro!`); await monsterTurn(); }
    let first = !opt.ambush, result = null;
    while (!result && P.hp > 0) {
      const dc = kind === 'dragao' ? 15 : first ? 8 : 11;
      const hasPot = P.pocoes.pocao_vida > 0 || P.pocoes.pocao_mana > 0;
      const choice = await ask(acts, [
        { html: `${ic('sword', ITEMS[P.equip.arma]?.cor)} Atacar <small>${fmtD(atkDie())}</small>`, v: 'atk', cls: 'red' },
        { html: `${ic('scroll', C.PURPLE)} Feitiço`, v: 'spell', cls: 'purple', off: !P.magias.length },
        { html: `${ic('potion', C.RED)} Poção`, v: 'pot', cls: 'green', off: !hasPot },
        { html: `Fugir <small>d20 ≥ ${dc}</small>`, v: 'flee' },
      ]);
      let act = choice;
      if (choice === 'spell') {
        act = await ask(acts, P.magias.map(id => ({
          html: `${ic('scroll', SPELLS[id].cor)} ${SPELLS[id].nome} <small>${fmtD(SPELLS[id].dado)} · ${SPELLS[id].pm} PM</small>`,
          v: 's:' + id, cls: 'purple', off: P.pm < SPELLS[id].pm,
        })).concat([{ html: 'Voltar', v: 'back' }]));
      } else if (choice === 'pot') {
        act = await ask(acts, ['pocao_vida', 'pocao_mana'].filter(id => P.pocoes[id] > 0).map(id => ({
          html: `${itemIc(id)} ${ITEMS[id].nome} ×${P.pocoes[id]} <small>${fmtD(ITEMS[id].dado)}</small>`, v: 'p:' + id, cls: 'green',
        })).concat([{ html: 'Voltar', v: 'back' }]));
      }
      if (act === 'back') continue;

      if (act === 'atk') {
        const it = ITEMS[P.equip.arma];
        const groups = [{ label: `Seu ataque${it ? ' · ' + it.nome : ''}`, dice: expand([atkDie()]), color: C.RED }];
        if (m.def) groups.push({ label: `Defesa: ${m.nome}`, dice: expand([m.def]), color: C.GRAY });
        const [a, d = 0] = await tray.roll(groups);
        const dmg = Math.max(0, a - d);
        m.hp -= dmg;
        tray.result(m.def ? `${a} − ${d} = ${dmg}` : `${dmg}`, dmg ? 'de dano!' : 'ele bloqueou!', dmg ? C.RED : C.GRAY);
        if (dmg) { foe.hit(C.RED); SFX.hit(); }
        log(dmg ? `Você acerta ${m.nome}.` : `${m.nome} defendeu tudo.`);
      } else if (act.startsWith('s:')) {
        const sp = SPELLS[act.slice(2)];
        P.pm -= sp.pm;
        const [v] = await tray.roll([{ label: `${sp.nome} (ignora defesa)`, dice: expand([sp.dado]), color: sp.cor }]);
        if (sp.tipo === 'cura') {
          const heal = Math.min(P.hpMax - P.hp, v);
          P.hp += heal;
          tray.result(`+${heal}`, 'de vida', C.GREEN);
          log('Uma luz verde fecha seus machucados.');
        } else {
          m.hp -= v;
          foe.hit(sp.cor); SFX.hit();
          tray.result(`${v}`, 'de dano mágico!', sp.cor);
          log(`${sp.nome} acerta em cheio!`);
        }
      } else if (act.startsWith('p:')) {
        const id = act.slice(2), it = ITEMS[id];
        P.pocoes[id]--;
        const [v] = await tray.roll([{ label: it.nome, dice: expand([it.dado]), color: it.cor }]);
        if (it.efeito === 'hp') { const g = Math.min(P.hpMax - P.hp, v); P.hp += g; tray.result(`+${g}`, 'de vida', C.RED); }
        else { const g = Math.min(P.pmMax - P.pm, v); P.pm += g; tray.result(`+${g}`, 'de magia', C.BLUE); }
        log('Glub glub glub.');
      } else if (act === 'flee') {
        const [v] = await tray.roll([{ label: 'Fugir', dice: [20], color: C.INK }]);
        if (v >= dc) { tray.result(`${v}`, 'você fugiu!', C.GREEN); result = 'fuga'; await wait(600); break; }
        tray.result(`${v}`, 'não deu!', C.RED);
        log('Você tropeça na fuga...');
      }
      bars();
      first = false;
      if (m.hp <= 0) { result = 'vitoria'; break; }
      await wait(700);
      await monsterTurn();
    }
    if (!result) result = 'derrota';

    if (result === 'vitoria') {
      foe.defeat();
      G.kills++;
      log(`Você venceu ${m.nome}! O mestre faz um X em cima dele.`);
      await wait(500);
      const [ouro] = await tray.roll([{ label: 'Moedas', dice: expand([m.ouro]), color: C.YELLOW }]);
      P.ouro += ouro;
      SFX.coin();
      tray.result(`+${ouro}`, 'moedas', C.OCHRE);
      const ups = gainXp(m.xp);
      log(`+${ouro} moedas${m.xp ? `, +${m.xp} de experiência` : ''}.${ups ? ` <b class="up">Subiu para o nível ${P.lvl}!</b> Vida e magia cheias.` : ''}`);
      bars();
    } else if (result === 'derrota') {
      log('Você desmaiou... O mestre vira a página.');
    }
    await ask(acts, [{ html: 'Continuar', v: 1, cls: 'green' }]);
    closePanel();
    if (result === 'derrota') faint();
    save();
    return result;
  }

  function gainXp(xp) {
    P.xp += xp;
    let ups = 0;
    while (P.xp >= xpNext(P.lvl)) {
      P.xp -= xpNext(P.lvl); P.lvl++; ups++;
      P.hpMax += 6; P.pmMax += 1; P.hp = P.hpMax; P.pm = P.pmMax;
    }
    if (ups) SFX.lvl();
    return ups;
  }

  function faint() {
    const lost = Math.floor(P.ouro / 2);
    P.ouro -= lost; P.hp = P.hpMax; P.pm = P.pmMax;
    P.x = P.respawn % W.W; P.y = (P.respawn / W.W) | 0;
    walker = null; path = [];
    narrate(`Você acorda em ${Wd.VILAS[W.obj.get(P.respawn).n]}, todo enfaixado. Perdeu ${lost} moedas.`);
    hud(); save();
  }

  async function meetMonster(i, o) {
    const m = MONSTERS[o.kind];
    const v = await dialog(`${um(m)[0].toUpperCase() + um(m).slice(1)} ${m.nome}!`,
      `<p>O mestre desenhou ${um(m)} ${m.nome} bem no caminho.</p>
       <p>${ic('heart')} ${m.hp} de vida · ${ic('sword')} ataque ${fmtD(m.atk)} · ${ic('shield')} defesa ${fmtD(m.def)}</p>
       <p class="small">Seu ataque: ${fmtD(atkDie())} · sua defesa: ${defDice().map(fmtD).join(' + ') || 'nenhuma'}</p>`,
      [{ html: 'Enfrentar', v: 'luta', cls: 'red' }, { html: 'Deixar pra lá', v: 'nao' }], A.monsterURL(o.kind, 160));
    if (v !== 'luta') return;
    const r = await combat(o.kind);
    if (r === 'vitoria') { G.dead.add(i); animate(A.cross(i % W.W, (i / W.W) | 0, T, i)); save(); }
  }

  async function ambush(tier) {
    const pool = Wd.POOLS[Math.max(1, Math.random() < 0.25 ? tier - 1 : tier)];
    const kind = pick(pool), m = MONSTERS[kind];
    const v = await dialog('Surpresa!', `<p>${um(m)[0].toUpperCase() + um(m).slice(1)} ${m.nome} pula do meio do mato!</p>
      <p>${ic('heart')} ${m.hp} · ${ic('sword')} ${fmtD(m.atk)} · ${ic('shield')} ${fmtD(m.def)}</p>
      <p class="small">Fugir agora: role 1d20 e tire 8 ou mais. Se falhar, ele ataca primeiro.</p>`,
      [{ html: 'Enfrentar', v: 'luta', cls: 'red' }, { html: 'Tentar fugir (d20)', v: 'fuga' }], A.monsterURL(kind, 160));
    if (v === 'luta') { await combat(kind); return; }
    openPanel(`<h2>Fugir!</h2><canvas id="tray" class="tray mini"></canvas><p id="clog"></p><div class="actions" id="acts"></div>`, 'dialog');
    const tray = new Tray($('tray'));
    const [d] = await tray.roll([{ label: 'Fugir', dice: [20], color: C.INK }]);
    if (d >= 8) {
      tray.result(`${d}`, 'escapou!', C.GREEN);
      $('clog').textContent = `Você some no mato antes que ${m.nome} perceba.`;
      await ask($('acts'), [{ html: 'Ufa!', v: 1, cls: 'green' }]);
      closePanel();
      return;
    }
    tray.result(`${d}`, 'não deu!', C.RED);
    await wait(900);
    await combat(kind, { ambush: true });
  }

  async function lair(i) {
    const v = await dialog('Covil do Dragão',
      `<p>Um buraco escuro, ossos na entrada e cheiro de fumaça. Lá dentro, algo enorme respira.</p>
       <p>${ic('heart')} ${MONSTERS.dragao.hp} · ${ic('sword')} ${fmtD(MONSTERS.dragao.atk)} · ${ic('shield')} ${fmtD(MONSTERS.dragao.def)}</p>
       <p class="small">Daqui não dá pra fugir fácil: d20 ≥ 15.</p>`,
      [{ html: 'Entrar', v: 'luta', cls: 'red' }, { html: 'Agora não', v: 'nao' }], A.monsterURL('dragao', 160));
    if (v !== 'luta') return;
    const r = await combat('dragao', { text: 'O Dragão Vermelho abre as asas. O mestre troca para a caneta vermelha.' });
    if (r !== 'vitoria') return;
    G.won = true;
    animate(A.cross(i % W.W, (i / W.W) | 0, T, i));
    save();
    const e = await dialog('FIM!', `<p>${esc(P.nome)} derrotou o Dragão Vermelho! O mestre escreve "FIM" bem grande e desenha uma coroa.</p>
      <p>${G.steps} passos · ${G.kills} monstros vencidos · nível ${P.lvl} · ${P.ouro} moedas</p>`,
      [{ html: 'Continuar explorando', v: 'cont', cls: 'green' }, { html: 'Nova aventura', v: 'novo' }], A.iconURL('star', C.YELLOW, 160));
    if (e === 'novo') title();
  }

  async function talk(i, o) {
    let extra = '';
    if (o.presente && !G.talked.has(i)) {
      if (o.fala % 2) { P.pocoes.pocao_vida++; extra = `<p><b>Ganhou uma Poção de vida!</b></p>`; }
      else { const g = 10 * W.tier[i]; P.ouro += g; extra = `<p><b>Ganhou ${g} moedas!</b></p>`; SFX.coin(); }
    }
    G.talked.add(i);
    await dialog('Alguém no caminho', `<p>"${NPC_LINES[o.fala % NPC_LINES.length]}"</p>${extra}`, [{ html: 'Valeu!', v: 1 }]);
    save();
  }

  async function chest(i, o) {
    openPanel(`<h2>Um baú!</h2><p>O mestre desenha um baú. Role a sorte para ver o que tem dentro.</p>
      <canvas id="tray" class="tray mini"></canvas><p id="clog"></p><div class="actions" id="acts"></div>`, 'dialog');
    const tray = new Tray($('tray'));
    const [luck] = await tray.roll([{ label: 'Sorte', dice: [20], color: C.INK }]);
    let msg;
    if (luck <= 13) {
      await wait(500);
      const [g] = await tray.roll([{ label: 'Moedas', dice: Array(o.tier + 1).fill(8), color: C.YELLOW }]);
      P.ouro += g; SFX.coin();
      tray.result(`+${g}`, 'moedas', C.OCHRE);
      msg = `${g} moedas brilhando lá dentro!`;
    } else if (luck <= 18) {
      const id = luck % 2 ? 'pocao_vida' : 'pocao_mana';
      P.pocoes[id]++;
      tray.result(`${luck}`, ITEMS[id].nome, ITEMS[id].cor);
      msg = `${itemIc(id)} Uma ${ITEMS[id].nome}!`;
    } else {
      const lvl = Math.min(3, Math.ceil(o.tier / 2) + 1);
      const ids = Object.keys(ITEMS).filter(id => ITEMS[id].vila === lvl && ITEMS[id].slot !== 'pocao' && id !== 'lamina_dragao');
      const id = pick(ids);
      P.bolsa.push(id);
      tray.result(`${luck}!`, 'tesouro!', C.RED);
      msg = `${itemIc(id)} <b>${ITEMS[id].nome}</b> (${fmtD(ITEMS[id].dado)})! Está na mochila.`;
    }
    $('clog').innerHTML = msg;
    G.opened.add(i);
    animate(A.cross(i % W.W, (i / W.W) | 0, T, i + 1));
    await ask($('acts'), [{ html: 'Fechar o baú', v: 1, cls: 'green' }]);
    closePanel(); save();
  }

  // ---------- vila: pousada, ferreiro, magias, poções ----------
  function village(i, o) {
    const first = !G.seen.has('v' + o.n);
    G.seen.add('v' + o.n);
    P.respawn = i;
    if (first) narrate(`Você chega em ${Wd.VILAS[o.n]}. Se desmaiar, acorda aqui.`);
    renderVillage(o.n);
  }
  function owned(id) { return P.bolsa.includes(id) || Object.values(P.equip).includes(id); }
  function renderVillage(n) {
    const coin = ic('coin');
    const inn = 3 + n * 6;
    const gear = Object.keys(ITEMS).filter(id => ITEMS[id].vila <= n + 1 && ITEMS[id].slot !== 'pocao');
    const pots = Object.keys(ITEMS).filter(id => ITEMS[id].slot === 'pocao');
    const spells = Object.keys(SPELLS).filter(id => SPELLS[id].vila <= n + 1);
    const slotName = { arma: 'arma', escudo: 'escudo', armadura: 'armadura' };
    const row = (icon, name, info, price, act, off, note = '') =>
      `<div class="row">${icon}<span class="nm">${name} <small>${info}</small>${note ? `<em>${note}</em>` : ''}</span>
       <span class="pr">${price != null ? price + coin : ''}</span><button data-act="${act}" ${off ? 'disabled' : ''}>${act.startsWith('sell') ? 'Vender' : 'Comprar'}</button></div>`;
    openPanel(`
      <h2>${Wd.VILAS[n]}</h2>
      <p>${VILLAGE_TEXT[n]} Você tem ${P.ouro}${coin}</p>
      <div class="row">${ic('heart')}<span class="nm">Pousada <small>vida e magia cheias</small></span><span class="pr">${inn}${coin}</span>
        <button data-act="inn" ${P.ouro < inn || (P.hp === P.hpMax && P.pm === P.pmMax) ? 'disabled' : ''}>Descansar</button></div>
      <h3>Ferreiro</h3>
      ${gear.map(id => {
        const it = ITEMS[id], cur = P.equip[it.slot];
        const note = owned(id) ? 'você já tem' : cur ? `sua ${slotName[it.slot]}: ${fmtD(ITEMS[cur].dado)}` : `sem ${slotName[it.slot]}`;
        return row(itemIc(id), it.nome, fmtD(it.dado) + (it.slot === 'arma' ? ' de ataque' : ' de defesa'), it.preco, 'buy:' + id, owned(id) || P.ouro < it.preco, note);
      }).join('')}
      <h3>Magias</h3>
      ${spells.map(id => {
        const s = SPELLS[id], has = P.magias.includes(id);
        return row(itemIc(id), s.nome, `${fmtD(s.dado)} ${s.tipo === 'cura' ? 'de cura' : 'de dano, ignora defesa'} · ${s.pm} PM`, s.preco, 'spell:' + id, has || P.ouro < s.preco, has ? 'você já sabe' : '');
      }).join('')}
      <h3>Poções</h3>
      ${pots.map(id => row(itemIc(id), ITEMS[id].nome, `${fmtD(ITEMS[id].dado)} de ${ITEMS[id].efeito === 'hp' ? 'vida' : 'magia'}`, ITEMS[id].preco, 'pot:' + id, P.ouro < ITEMS[id].preco, `você tem ${P.pocoes[id]}`)).join('')}
      ${P.bolsa.length ? `<h3>Vender</h3>${P.bolsa.map((id, k) => row(itemIc(id), ITEMS[id].nome, fmtD(ITEMS[id].dado), Math.floor(ITEMS[id].preco / 2), 'sell:' + k, false)).join('')}` : ''}
      <div class="actions"><button data-act="out" class="green">Sair da vila</button></div>`, 'village');
    $('panel').onclick = e => {
      const b = e.target.closest('button[data-act]');
      if (!b || b.disabled) return;
      const [act, arg] = b.dataset.act.split(':');
      if (act === 'out') { closePanel(); return; }
      if (act === 'inn') { P.ouro -= inn; P.hp = P.hpMax; P.pm = P.pmMax; SFX.lvl(); }
      else if (act === 'buy') {
        const it = ITEMS[arg];
        P.ouro -= it.preco;
        if (P.equip[it.slot]) P.bolsa.push(P.equip[it.slot]);
        P.equip[it.slot] = arg; SFX.coin();
      } else if (act === 'spell') { P.ouro -= SPELLS[arg].preco; P.magias.push(arg); SFX.coin(); }
      else if (act === 'pot') { P.ouro -= ITEMS[arg].preco; P.pocoes[arg]++; SFX.coin(); }
      else if (act === 'sell') { const id = P.bolsa.splice(+arg, 1)[0]; P.ouro += Math.floor(ITEMS[id].preco / 2); SFX.coin(); }
      const top = $('panel').scrollTop;
      renderVillage(n); $('panel').scrollTop = top;
      hud(); save();
    };
  }

  // ---------- mochila ----------
  function bag() {
    if (!W || panelOpen || walker) return;
    const slot = s => {
      const id = P.equip[s];
      const label = { arma: 'Arma', escudo: 'Escudo', armadura: 'Armadura' }[s];
      return `<div class="row">${id ? itemIc(id) : ic(s === 'arma' ? 'sword' : s === 'escudo' ? 'shield' : 'armor', '#ddd')}<span class="nm">${label}: ${id ? ITEMS[id].nome : '—'} <small>${id ? fmtD(ITEMS[id].dado) : ''}</small></span></div>`;
    };
    openPanel(`
      <h2>Mochila de ${esc(P.nome)}</h2>
      <p>Nível ${P.lvl} · ${P.xp}/${xpNext(P.lvl)} de experiência · ${ic('heart')} ${P.hp}/${P.hpMax} · ${ic('star')} ${P.pm}/${P.pmMax} · ${P.ouro}${ic('coin')}</p>
      <h3>Equipado</h3>${slot('arma')}${slot('escudo')}${slot('armadura')}
      <h3>Na mochila</h3>
      ${P.bolsa.length ? P.bolsa.map((id, k) => `<div class="row">${itemIc(id)}<span class="nm">${ITEMS[id].nome} <small>${fmtD(ITEMS[id].dado)}</small></span><button data-act="eq:${k}">Equipar</button></div>`).join('') : '<p class="small">Vazia. Itens que sobram ao comprar ou achar em baús vêm para cá.</p>'}
      ${['pocao_vida', 'pocao_mana'].map(id => `<div class="row">${itemIc(id)}<span class="nm">${ITEMS[id].nome} ×${P.pocoes[id]} <small>${fmtD(ITEMS[id].dado)}</small></span><button data-act="use:${id}" ${P.pocoes[id] ? '' : 'disabled'}>Beber</button></div>`).join('')}
      <h3>Magias</h3>
      ${P.magias.length ? P.magias.map(id => `<div class="row">${itemIc(id)}<span class="nm">${SPELLS[id].nome} <small>${fmtD(SPELLS[id].dado)} · ${SPELLS[id].pm} PM</small></span>${SPELLS[id].tipo === 'cura' ? `<button data-act="cast:${id}" ${P.pm >= SPELLS[id].pm && P.hp < P.hpMax ? '' : 'disabled'}>Usar</button>` : ''}</div>`).join('') : '<p class="small">Nenhuma ainda. Pergaminhos de magia são vendidos nas vilas.</p>'}
      <p id="bag-msg" class="small"></p>
      <div class="actions"><button data-act="close" class="green">Fechar</button><button data-act="title">Tela inicial</button></div>`, 'bagp');
    $('panel').onclick = e => {
      const b = e.target.closest('button[data-act]');
      if (!b || b.disabled) return;
      const [act, arg] = b.dataset.act.split(':');
      let msg = '';
      if (act === 'close') { closePanel(); return; }
      if (act === 'title') { closePanel(); save(); title(); return; }
      if (act === 'eq') {
        const id = P.bolsa.splice(+arg, 1)[0], s = ITEMS[id].slot;
        if (P.equip[s]) P.bolsa.push(P.equip[s]);
        P.equip[s] = id;
      } else if (act === 'use') {
        const it = ITEMS[arg], v = expand([it.dado]).reduce((a, s) => a + 1 + rnd(s), 0);
        P.pocoes[arg]--;
        if (it.efeito === 'hp') { const g = Math.min(P.hpMax - P.hp, v); P.hp += g; msg = `Rolou ${fmtD(it.dado)}: +${g} de vida.`; }
        else { const g = Math.min(P.pmMax - P.pm, v); P.pm += g; msg = `Rolou ${fmtD(it.dado)}: +${g} de magia.`; }
      } else if (act === 'cast') {
        const s = SPELLS[arg], v = expand([s.dado]).reduce((a, d) => a + 1 + rnd(d), 0), g = Math.min(P.hpMax - P.hp, v);
        P.pm -= s.pm; P.hp += g; msg = `Rolou ${fmtD(s.dado)}: +${g} de vida.`;
      }
      bag(); hud(); save();
      if (msg) $('bag-msg').textContent = msg;
    };
  }

  // ---------- salvar / carregar ----------
  function save() {
    if (!W || !P) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 1, seed: W.seed, P, rev: Array.from(G.rev).join(''), dead: [...G.dead], opened: [...G.opened],
        talked: [...G.talked], trail: [...G.trail], seen: [...G.seen], steps: G.steps, kills: G.kills, won: G.won,
      }));
    } catch (e) { /* sem armazenamento: o jogo segue sem salvar */ }
  }
  function loadSave() {
    if (qs.has('novo')) return null;
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; }
  }

  function startGame(data) {
    W = Wd.generate(data.seed);
    G = newState();
    walker = null; path = []; held = null; cam.over = false;
    if (data.P) {
      P = data.P;
      for (let i = 0; i < data.rev.length; i++) if (data.rev[i] === '1') G.rev[i] = 1;
      data.dead.forEach(i => G.dead.add(i)); data.opened.forEach(i => G.opened.add(i));
      data.talked.forEach(i => G.talked.add(i)); data.trail.forEach(k => G.trail.add(k)); data.seen.forEach(k => G.seen.add(k));
      G.steps = data.steps; G.kills = data.kills; G.won = data.won;
      rebakeAll();
      narrate(`De volta à aventura de ${esc(P.nome)}. O mestre abre o caderno na mesma página.`);
    } else {
      P = newPlayer(data.nome);
      chunks.clear(); anims.length = 0;
      reveal(P.x, P.y);
      narrate(`Era uma vez ${esc(P.nome)}, que morava em ${Wd.VILAS[0]}. O mestre destampa as canetas...`);
    }
    devShortcuts();
    cam.x = P.x * T + T / 2; cam.y = P.y * T + T / 2 + 20; cam.z = baseZoom();
    $('hud').hidden = false;
    $('dpad').hidden = !matchMedia('(pointer: coarse)').matches;
    hud(); save();
  }

  // Atalhos de desenvolvimento pela URL (ver README).
  function devShortcuts() {
    if (qs.has('ouro')) P.ouro = +qs.get('ouro') || 9999;
    if (qs.has('nivel')) { const l = +qs.get('nivel') || 5; while (P.lvl < l) gainXp(xpNext(P.lvl) - P.xp); }
    if (qs.has('revelar')) { G.rev.fill(1); rebakeAll(); }
    if (qs.has('luta') && MONSTERS[qs.get('luta')]) setTimeout(() => combat(qs.get('luta')), 300);
  }

  // ---------- tela inicial ----------
  function title() {
    const sv = loadSave();
    openPanel(`
      <div class="cover">
        <h1>Caderno de Aventuras</h1>
        <p class="sub">o RPG que a gente jogava no fundo da sala</p>
        <canvas id="cover-cv"></canvas>
        <label class="name">Nome do herói: <input id="nome" maxlength="16" value="${esc(sv ? sv.P.nome : 'Herói')}"></label>
        <div class="actions">
          ${sv ? `<button id="b-cont" class="green">Continuar <small>${esc(sv.P.nome)}, nível ${sv.P.lvl}</small></button>` : ''}
          <button id="b-new" class="red">Nova aventura</button>
        </div>
        <p class="small how">Ande com as setas, WASD ou tocando no mapa. O mestre desenha o mundo enquanto você anda.
        Cada item dá dados: a soma é o dano, e escudo e armadura rolam a sua defesa.</p>
      </div>`, 'title');
    coverArt($('cover-cv'));
    const go = data => { SFX.init(); closePanel(); startGame(data); };
    if (sv) $('b-cont').onclick = () => go(sv);
    $('b-new').onclick = () => {
      if (sv && !$('b-new').dataset.sure) { $('b-new').dataset.sure = 1; $('b-new').innerHTML = 'Apagar o save e começar?'; return; }
      const nome = ($('nome').value || 'Herói').trim().slice(0, 16) || 'Herói';
      go({ nome, seed: qs.has('seed') ? +qs.get('seed') : (Math.random() * 1e9) >>> 0 });
    };
  }
  // Capa: herói, dragão e um d20 sendo desenhados.
  function coverArt(c) {
    const r = c.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), x = c.getContext('2d');
    c.width = r.width * d; c.height = r.height * d; x.setTransform(d, 0, 0, d, 0, 0);
    const h = r.height, list = [
      ...S.xform(A.hero(0), h / 100, r.width * 0.12, 0),
      ...S.xform(A.dieStrokes(20, C.RED), h * 0.5 / 100, r.width * 0.5 - h * 0.25, h * 0.3),
      ...S.xform(A.monster('dragao'), h / 100, r.width * 0.88 - h, 0),
    ];
    const t0 = performance.now();
    const loop = t => {
      if (!c.isConnected) return;
      x.clearRect(0, 0, r.width, r.height);
      S.drawAll(x, list, Math.min(1, (t - t0) / 2600));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ---------- entrada ----------
  const KEYS = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
  addEventListener('keydown', e => {
    SFX.init();
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (panelOpen) {
      const n = +e.key;
      if (n >= 1 && n <= 9) {
        const btns = [...$('panel').querySelectorAll('.actions button:not(:disabled)')];
        if (btns[n - 1]) btns[n - 1].click();
      }
      return;
    }
    if (KEYS[k]) { held = KEYS[k]; if (!e.repeat && !walker) tap = held; path = []; e.preventDefault(); }
    else if (k === 'b' || k === 'i') bag();
    else if (k === 'm' && W) cam.over = !cam.over;
  });
  addEventListener('keyup', e => { const k = KEYS[e.key.toLowerCase()]; if (k && held === k) held = null; });
  addEventListener('blur', () => { held = null; });

  cv.addEventListener('pointerdown', e => {
    SFX.init();
    if (panelOpen || !W) return;
    if (cam.over) { cam.over = false; return; }
    const wx = (e.clientX - vw / 2) / cam.z + cam.x, wy = (e.clientY - vh / 2) / cam.z + cam.y;
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    if (tx < 0 || ty < 0 || tx >= W.W || ty >= W.H) return;
    if (!G.rev[idx(tx, ty)]) { narrate('O mestre ainda não desenhou aí. Chegue mais perto!'); return; }
    const p = findPath(tx, ty);
    if (p) path = p;
    else if (!(tx === P.x && ty === P.y)) narrate('Não tem caminho até lá.');
  });
  for (const b of document.querySelectorAll('#dpad button')) {
    const d = b.dataset.d.split(',').map(Number);
    b.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); held = d; path = []; });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { if (held === d) held = null; });
  }
  $('b-bag').onclick = () => bag();
  $('b-map').onclick = () => { if (W && !panelOpen) cam.over = !cam.over; };
  const sndIcon = () => { $('snd-img').src = A.iconURL('sound', SFX.on ? 'on' : ''); };
  $('b-snd').onclick = () => { SFX.on = !SFX.on; sndIcon(); try { localStorage.setItem('caderno-aventuras-som', SFX.on ? '1' : '0'); } catch (e) { } };
  try { SFX.on = localStorage.getItem('caderno-aventuras-som') !== '0'; } catch (e) { }

  // Ícones fixos do HUD.
  for (const img of document.querySelectorAll('img[data-icon]')) img.src = A.iconURL(img.dataset.icon);
  sndIcon();

  window.Caderno = { get state() { return { P, G, W }; }, combat, title };

  // As fontes de mão precisam estar carregadas antes de escrever no canvas.
  Promise.race([
    Promise.all([document.fonts.load(`20px ${S.TITLE}`), document.fonts.load(`20px ${S.HAND}`)]),
    wait(2500),
  ]).catch(() => { }).then(() => {
    requestAnimationFrame(tick);
    const sv = loadSave();
    if (qs.has('novo') || qs.has('seed') || !sv) {
      if (qs.has('seed') || qs.has('luta') || qs.has('revelar')) startGame({ nome: 'Herói', seed: +qs.get('seed') || 1 });
      else title();
    } else title();
  });
})();
