// neon-skin.js — a "pele" do Androide da Fábrica por cima do motor do
// Guerreiro da Masmorra (app). Carregado DEPOIS do script do jogo.
//
// POR QUE: o jogo é o Guerreiro da Masmorra (app) inteiro (mesmas regras,
// mesmo combate, mesmo mapa). Em vez de reescrever o motor, esta camada
// troca o que se vê:
//   1. as folhas de animação de toda unidade (UNITS) por robôs gerados no
//      neon-bots.js, com o mesmo tamanho e o mesmo número de quadros;
//   2. as folhas do herói em 8 direções e a de frente do hangar;
//   3. o cenário da batalha (céu, horizonte, estrada, margens, interiores)
//      por um corredor de grade neon;
//   4. um brilho (bloom) no canvas da batalha;
//   5. qualquer outra imagem do jogo (baús, efeitos, mapa, ícones, painéis
//      9-slice) por uma versão neon automática (filtro), no canvas, nos
//      <img> e no CSS;
//   6. os textos: um tradutor troca, na saída (DOM e canvas), as palavras do
//      tema medieval pelas do tema de robôs (Masmorra → Fábrica...).
// O código do jogo continua igual; é por isso que esta pasta é uma cópia
// mantida à mão do app com só alguns ajustes no index.html (título, save,
// scripts).
(function () {
  'use strict';
  const NB = window.NEONBOT, PAL = NB.PAL;
  const ART = '/Sprites/GuerreiroDaMasmorraApp/';
  const isArt = src => typeof src === 'string' && src.indexOf(ART) >= 0 && !src.startsWith('data:');
  const ORIG_DRAW = CanvasRenderingContext2D.prototype.drawImage;

  // ================================================================ 1. unidades
  // Cada IMGS['unit.anim'] vira um getter que gera a folha de robô na primeira
  // vez que o jogo pede (gerar as ~170 folhas de uma vez travaria o início).
  const ORIG_IMGS = {}, BOX = {};
  function unitBox(unit) {
    if (BOX[unit] !== undefined) return BOX[unit];
    const cfg = UNITS[unit], spec = cfg.anims.idle, img = ORIG_IMGS[unit + '.idle'];
    const fw = cfg.fw || cfg.fs, fh = cfg.fh || cfg.fs;
    let box = null;
    if (img && (img.naturalWidth || img.width)) {
      const frames = (typeof spec === 'object' && spec.frames) || Math.max(1, Math.floor((img.naturalWidth || img.width) / cfg.fs));
      box = NB.measure(img, fw, fh, (typeof spec === 'object' && spec.row) || 0, Math.min(frames, 8), ORIG_DRAW);
    }
    return (BOX[unit] = box);
  }
  function installUnits() {
    for (const [unit, cfg] of Object.entries(UNITS)) for (const [anim, spec] of Object.entries(cfg.anims)) {
      const key = unit + '.' + anim;
      if (ORIG_IMGS[key] !== undefined) continue;
      ORIG_IMGS[key] = IMGS[key] || null;
      let cache = null;
      Object.defineProperty(IMGS, key, {
        configurable: true, enumerable: true,
        get() {
          if (cache) return cache;
          const orig = ORIG_IMGS[key], fw = cfg.fw || cfg.fs, fh = cfg.fh || cfg.fs;
          const W0 = orig ? (orig.naturalWidth || orig.width) : fw * ((typeof spec === 'object' && spec.frames) || 4);
          const H0 = orig ? (orig.naturalHeight || orig.height) : fh * (((typeof spec === 'object' && spec.row) || 0) + 1);
          const frames = (typeof spec === 'object' && spec.frames) || Math.max(1, Math.floor(W0 / cfg.fs));
          cache = NB.unitSheet(unit, anim, W0, H0, fw, fh, (typeof spec === 'object' && spec.row) || 0, frames, unitBox(unit),
            { view: cfg.faceFront ? 'front' : 'side', dir: cfg.faceLeft ? -1 : 1 });
          return cache;
        },
        set(v) { ORIG_IMGS[key] = v; cache = null; },
      });
    }
  }
  loadPromise.then(installUnits, installUnits);

  // ================================================================ 2. herói
  const HSHEETS = {};
  const heroOf = key => HSHEETS[key] || (HSHEETS[key] = NB.heroSheet(key));
  let CAMP = null;
  window.heroSheet = (img, key) => heroOf(key);
  window.tinted = (img, key) => key === 'camp' ? (CAMP || (CAMP = NB.campSheet())) : img;
  // O idle de frente também é desenhado direto do CAMP_HERO_IMG (drawIdleCam).
  setTimeout(() => { try { CAMP_HERO_IMG.src = (CAMP || (CAMP = NB.campSheet())).toDataURL(); } catch (e) { } }, 0);

  // ================================================================ 3. cenário neon da batalha
  // Cada bioma do jogo vira um tema de cor (o nome muda no tradutor).
  const THEME = {
    castelo:   { a: PAL.magenta, b: PAL.cyan,   sky: ['#07020f', '#2a0838'], sun: PAL.magenta },
    floresta:  { a: PAL.green,   b: PAL.lime,   sky: ['#020a07', '#06301f'], sun: PAL.lime },
    cemiterio: { a: PAL.blue,    b: PAL.purple, sky: ['#03040f', '#12164a'], sun: PAL.cyan },
    ruinas:    { a: PAL.orange,  b: PAL.yellow, sky: ['#0d0503', '#3a1606'], sun: PAL.orange },
    cripta:    { a: PAL.cyan,    b: PAL.blue,   wall: true },
    igreja:    { a: PAL.purple,  b: PAL.magenta, wall: true },
    salao:     { a: PAL.yellow,  b: PAL.orange, wall: true },
  };
  const th = () => THEME[battleBiome] || THEME.castelo;
  const alpha = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  // Silhueta de cidade neon (no lugar da faixa de castelo/árvores do horizonte).
  const SKY_CITY = {};
  function cityStrip(key) {
    if (SKY_CITY[key]) return SKY_CITY[key];
    const T = THEME[key] || THEME.castelo, w = 512, h = 96, c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    let px = 0, s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    while (px < w) {
      const bw = 14 + r() * 30, bh = 20 + r() * 70, y = h - bh;
      x.fillStyle = '#04050c'; x.fillRect(px, y, bw, bh);
      x.strokeStyle = alpha(T.a, 0.8); x.lineWidth = 1; x.strokeRect(px + 0.5, y + 0.5, bw - 1, bh);
      for (let yy = y + 5; yy < h - 4; yy += 7) for (let xx = px + 3; xx < px + bw - 4; xx += 6) if (r() < 0.28) { x.fillStyle = r() < 0.5 ? T.b : T.a; x.fillRect(xx, yy, 2, 3); }
      if (r() < 0.3) { x.strokeStyle = T.b; x.beginPath(); x.moveTo(px + bw / 2, y); x.lineTo(px + bw / 2, y - 12); x.stroke(); }
      px += bw + 2 + r() * 6;
    }
    return (SKY_CITY[key] = c);
  }
  window.drawSky = function (t) {
    const T = th(), { yTop } = roadGeom();
    const g = ctx.createLinearGradient(0, 0, 0, yTop * 1.15);
    g.addColorStop(0, T.sky[0]); g.addColorStop(1, T.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, yTop * 1.15);
    for (let i = 0; i < 50; i++) {
      const h = cellHash(i, 7), x = (h % 1000) / 1000 * W, y = ((h >>> 10) % 1000) / 1000 * yTop * 0.7;
      ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(t * 0.0008 + i)); ctx.fillStyle = i % 3 ? '#fff' : T.b; ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
    // Sol de fliperama: listrado, cortado por faixas pretas.
    const sx = W * 0.5, sy = yTop * 0.86, sr = Math.min(W, H) * 0.16;
    ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, sr, Math.PI, 0); ctx.closePath(); ctx.clip();
    const sg = ctx.createLinearGradient(0, sy - sr, 0, sy);
    sg.addColorStop(0, PAL.yellow); sg.addColorStop(1, T.sun);
    ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr);
    ctx.fillStyle = T.sky[1];
    for (let k = 0; k < 6; k++) { const yy = sy - sr * 0.08 - k * sr * 0.13, hh = 1.5 + (5 - k) * 0.9; ctx.fillRect(sx - sr, yy - hh, sr * 2, hh); }
    ctx.restore();
    // Montanhas de grade (wireframe) com parallax.
    const ph = roadScroll * 0.06;
    for (const [amp, base, col, f, sp] of [[H * 0.06, yTop * 0.98, alpha(T.b, 0.55), 6, 0.45], [H * 0.04, yTop * 1.02, alpha(T.a, 0.9), 9, 1]]) {
      ctx.beginPath(); ctx.moveTo(0, yTop * 1.1);
      for (let x = 0; x <= W; x += 6) {
        const u = x / W, y = base - Math.abs(Math.sin(u * f + ph * sp)) * amp - Math.abs(Math.sin(u * f * 2.3 + ph)) * amp * 0.4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, yTop * 1.1); ctx.closePath(); ctx.fillStyle = '#04050c'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    }
    drawSkyline(yTop);
  };
  window.drawSkyline = function (yTop) {
    const img = cityStrip(battleBiome), h = H * 0.13, w = h * img.width / img.height, y = yTop - h * 0.98;
    const off = ((roadScroll * 0.03 * w) % w + w) % w;
    ctx.save(); ctx.globalAlpha = 0.85;
    for (let x = -off; x < W; x += w) ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  };
  // Grade em perspectiva: as fileiras do corredor (mesma malha do drawGround).
  function gridRows(cb) {
    const { yTop, yBot, wTop, wBot, rows } = roadGeom();
    const frac = ((roadScroll % 1) + 1) % 1;
    for (let i = -1; i <= rows; i++) {
      const t0 = (i + frac) / rows;
      if (t0 < 0 || t0 > 1) continue;
      const e = roadEase(t0);
      cb(yTop + (yBot - yTop) * e, wTop + (wBot - wTop) * e, e);
    }
  }
  window.drawVerges = function () {
    const T = th(), { yTop, yBot, wTop, wBot } = roadGeom();
    ctx.fillStyle = '#03040a'; ctx.fillRect(0, yTop, W, H - yTop);
    // Grade fraca das margens.
    ctx.strokeStyle = alpha(T.b, 0.18); ctx.lineWidth = 1;
    gridRows((y) => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); });
    for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(W / 2 + k * wTop * 0.25, yTop); ctx.lineTo(W / 2 + k * wBot * 0.25, yBot); ctx.stroke(); }
  };
  window.drawGround = function () {
    const T = th(), { yTop, yBot, wTop, wBot, cols } = roadGeom();
    ctx.save();
    ctx.beginPath(); ctx.moveTo((W - wTop) / 2, yTop); ctx.lineTo((W + wTop) / 2, yTop); ctx.lineTo((W + wBot) / 2, yBot); ctx.lineTo((W - wBot) / 2, yBot); ctx.closePath();
    const g = ctx.createLinearGradient(0, yTop, 0, yBot); g.addColorStop(0, '#05040e'); g.addColorStop(1, '#0b0a20');
    ctx.fillStyle = g; ctx.fill(); ctx.clip();
    ctx.lineWidth = Math.max(1, W * 0.004);
    gridRows((y, w, e) => { ctx.strokeStyle = alpha(T.a, 0.35 + e * 0.5); ctx.beginPath(); ctx.moveTo((W - w) / 2, y); ctx.lineTo((W + w) / 2, y); ctx.stroke(); });
    for (let c = 0; c <= cols; c++) {
      ctx.strokeStyle = alpha(T.b, 0.6);
      ctx.beginPath(); ctx.moveTo((W - wTop) / 2 + c * wTop / cols, yTop); ctx.lineTo((W - wBot) / 2 + c * wBot / cols, yBot); ctx.stroke();
    }
    ctx.restore();
    // Bordas acesas do corredor.
    ctx.strokeStyle = T.a; ctx.lineWidth = Math.max(2, W * 0.008);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(W / 2 + s * wTop / 2, yTop); ctx.lineTo(W / 2 + s * wBot / 2, yBot); ctx.stroke(); }
    return true;
  };
  window.drawInterior = function () {
    const T = th(), b = BIOMES[battleBiome], it = b.interior;
    const { yTop, yBot, wTop, wBot, rows } = roadGeom();
    ctx.fillStyle = '#020309'; ctx.fillRect(0, 0, W, H);
    const geo = t => { const e = roadEase(t); return { y: yTop + (yBot - yTop) * e, hw: (wTop + (wBot - wTop) * e) / 2, wh: H * it.h * (0.18 + e * 0.95), e }; };
    const frac = ((roadScroll % 1) + 1) % 1;
    const f = geo(0), n = geo(1);
    // Painéis das paredes e do teto: linhas de fileira + faixas acesas.
    ctx.lineWidth = Math.max(1, W * 0.004);
    for (let i = -1; i <= rows; i++) {
      const t0 = (i + frac) / rows; if (t0 < 0 || t0 > 1) continue;
      const a = geo(t0);
      ctx.strokeStyle = alpha(T.a, 0.25 + a.e * 0.6);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(W / 2 + s * a.hw, a.y); ctx.lineTo(W / 2 + s * a.hw, a.y - a.wh); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(W / 2 - a.hw, a.y - a.wh); ctx.lineTo(W / 2 + a.hw, a.y - a.wh); ctx.stroke();
      // LEDs de servidor nas paredes.
      if (((i + Math.floor(roadScroll)) & 1) === 0) for (const s of [-1, 1]) for (let k = 1; k < 5; k++) {
        ctx.fillStyle = k % 2 ? T.b : T.a; ctx.fillRect(W / 2 + s * a.hw - (s > 0 ? 6 : -2) * (0.4 + a.e), a.y - a.wh * k / 5, 3 + a.e * 3, 2 + a.e * 2);
      }
    }
    for (const [k, col] of [[0.33, T.b], [0.66, T.a]]) {
      ctx.strokeStyle = alpha(col, 0.7);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(W / 2 + s * f.hw, f.y - f.wh * k); ctx.lineTo(W / 2 + s * n.hw, n.y - n.wh * k); ctx.stroke(); }
    }
    ctx.strokeStyle = T.a; ctx.lineWidth = Math.max(2, W * 0.008);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(W / 2 + s * f.hw, f.y - f.wh); ctx.lineTo(W / 2 + s * n.hw, n.y - n.wh); ctx.stroke();
    }
    // Fundo do corredor: uma porta de luz.
    const grd = ctx.createRadialGradient(W / 2, f.y - f.wh * 0.45, 1, W / 2, f.y - f.wh * 0.45, Math.max(f.hw, f.wh));
    grd.addColorStop(0, alpha(T.a, 0.35)); grd.addColorStop(1, 'rgba(2,3,9,0)');
    ctx.fillStyle = grd; ctx.fillRect(W / 2 - f.hw, f.y - f.wh, f.hw * 2, f.wh);
  };
  window.drawRoadLight = function () {
    const { yTop, yBot } = roadGeom(), cy = yTop + (yBot - yTop) * 0.72;
    const lit = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, W * 0.8);
    lit.addColorStop(0, alpha(th().b, 0.08)); lit.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lit; ctx.fillRect(0, yTop, W, H - yTop);
  };
  window.drawHorizonHaze = function () {
    const { yTop } = roadGeom(), top = yTop - H * 0.04, bot = yTop + H * 0.06;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, alpha(th().a, 0)); g.addColorStop(0.5, alpha(th().a, 0.35)); g.addColorStop(1, alpha(th().a, 0));
    ctx.fillStyle = g; ctx.fillRect(0, top, W, bot - top);
  };
  // Objetos das margens: postes de luz, antenas e torres de servidor neon.
  function prop(kind, cx, y, w, T) {
    const h = w * 2.2;
    ctx.lineWidth = Math.max(1, w * 0.05);
    if (kind % 3 === 0) {          // poste de luz
      ctx.strokeStyle = T.b; ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - h); ctx.lineTo(cx + w * 0.3, y - h); ctx.stroke();
      ctx.fillStyle = T.a; ctx.fillRect(cx + w * 0.22, y - h, w * 0.22, w * 0.12);
    } else if (kind % 3 === 1) {   // torre de servidor
      ctx.fillStyle = '#04050c'; ctx.fillRect(cx - w * 0.25, y - h * 0.7, w * 0.5, h * 0.7);
      ctx.strokeStyle = T.a; ctx.strokeRect(cx - w * 0.25, y - h * 0.7, w * 0.5, h * 0.7);
      for (let k = 1; k < 6; k++) { ctx.fillStyle = k % 2 ? T.b : T.a; ctx.fillRect(cx - w * 0.15, y - h * 0.7 + k * h * 0.11, w * 0.08, w * 0.05); }
    } else {                        // antena de treliça
      ctx.strokeStyle = T.b; ctx.beginPath();
      ctx.moveTo(cx - w * 0.2, y); ctx.lineTo(cx, y - h); ctx.lineTo(cx + w * 0.2, y);
      for (let k = 1; k < 4; k++) { const yy = y - h * k / 4, hw = w * 0.2 * (1 - k / 4); ctx.moveTo(cx - hw, yy); ctx.lineTo(cx + hw, yy); }
      ctx.stroke(); ctx.fillStyle = PAL.red; ctx.fillRect(cx - 2, y - h - 3, 4, 4);
    }
  }
  window.drawSideProps = function (list) {
    if (!list || !list.length) return;
    const T = th(), { yTop, yBot, wTop, wBot } = roadGeom();
    const frac = ((roadScroll % 1) + 1) % 1, base = Math.floor(roadScroll), slots = [];
    for (let i = -1; i <= SIDE_ROWS; i++) {
      const t = (i + frac) / SIDE_ROWS;
      if (t <= 0.02 || t > 1.04) continue;
      for (const sgn of [-1, 1]) { const h = cellHash((i - base) * 2 + (sgn > 0 ? 1 : 0), 31); if (h % 10 < 4) continue; slots.push({ t, sgn, h }); }
    }
    slots.sort((a, b) => a.t - b.t);
    for (const s of slots) {
      const e = roadEase(s.t), y = yTop + (yBot - yTop) * e, road = wTop + (wBot - wTop) * e, w = W * 0.12 * (road / wBot);
      ctx.globalAlpha = Math.min(1, 0.3 + e * 1.1);
      prop(s.h >>> 3, W / 2 + s.sgn * (road / 2 + w * 0.6), y, w, T);
    }
    ctx.globalAlpha = 1;
  };
  // Cenário de fundo (torres e árvores do bioma): vira torres neon nas mesmas posições.
  window.drawSceneryItems = function (list) {
    const T = th();
    for (const s of list) {
      if (!s.bg) continue;
      const w = W * s.w * 0.5, x = (s.mirror ? mirrorX(W * s.x) : W * s.x);
      ctx.globalAlpha = s.alpha * 0.9;
      prop(1, x, H * s.y + w, w * 1.4, T);
      ctx.globalAlpha = 1;
    }
  };

  // ================================================================ 4. brilho (bloom)
  const BLOOM = [];
  function bloom(canvas) {
    const c2 = canvas.getContext('2d');
    let src = canvas, w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    for (let i = 0; i < 4; i++) {
      w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
      let b = BLOOM[i];
      if (!b || b.c.width !== w || b.c.height !== h) { const c = document.createElement('canvas'); c.width = w; c.height = h; b = BLOOM[i] = { c, x: c.getContext('2d') }; }
      b.x.imageSmoothingEnabled = true; b.x.globalCompositeOperation = 'copy';
      ORIG_DRAW.call(b.x, src, 0, 0, w, h);
      src = b.c;
    }
    c2.save(); c2.setTransform(1, 0, 0, 1, 0, 0); c2.imageSmoothingEnabled = true; c2.globalCompositeOperation = 'lighter';
    [0, 0.3, 0.4, 0.5].forEach((a, i) => { if (a) { c2.globalAlpha = a; ORIG_DRAW.call(c2, BLOOM[i].c, 0, 0, canvas.width, canvas.height); } });
    c2.restore();
  }
  const _draw = window.draw;
  window.draw = function (t) { _draw(t); bloom(cv); };
  const _drawMap = window.drawMap;
  if (_drawMap) window.drawMap = function (t) { _drawMap(t); bloom(mapCv); };

  // ================================================================ 5. filtro neon das outras imagens
  // Ícones com desenho próprio (o resto passa pelo filtro automático).
  const ICON_DRAW = {
    'soul.png': (x, s) => { core(x, s, PAL.magenta); },                     // Núcleo (o "Soul")
    'potion-heal.png': (x, s) => cell(x, s, PAL.red),                         // Célula de reparo
    'potion-adrenaline.png': (x, s) => cell(x, s, PAL.yellow),                // Célula de adrenalina
    'icons/ui/torch.png': (x, s) => battery(x, s),                            // Bateria (a "tocha")
    'Icons/Icon_03.png': (x, s) => chip(x, s),                                // Crédito (a moeda)
    'icons/ui/brackets.png': (x, s) => brackets(x, s),                       // mira em volta do alvo
  };
  // Mira do alvo: quatro cantos finos acesos (a moldura de ferro filtrada
  // virava um quadro branco grosso em volta do inimigo).
  function brackets(x, s) {
    const k = s * 0.22, m = s * 0.06;
    x.strokeStyle = PAL.yellow; x.lineWidth = Math.max(2, s * 0.035);
    for (const [cx, cy, dx, dy] of [[m, m, 1, 1], [s - m, m, -1, 1], [m, s - m, 1, -1], [s - m, s - m, -1, -1]]) {
      x.beginPath(); x.moveTo(cx, cy + dy * k); x.lineTo(cx, cy); x.lineTo(cx + dx * k, cy); x.stroke();
    }
  }
  function core(x, s, c) {
    x.translate(s / 2, s / 2); x.strokeStyle = c; x.fillStyle = NB.dark(c, 0.3); x.lineWidth = s * 0.06;
    x.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; x.lineTo(Math.cos(a) * s * 0.38, Math.sin(a) * s * 0.38); } x.closePath(); x.fill(); x.stroke();
    x.fillStyle = c; x.fillRect(-s * 0.1, -s * 0.1, s * 0.2, s * 0.2);
  }
  function cell(x, s, c) {
    x.fillStyle = NB.dark(c, 0.25); x.strokeStyle = c; x.lineWidth = s * 0.06;
    x.fillRect(s * 0.3, s * 0.18, s * 0.4, s * 0.68); x.strokeRect(s * 0.3, s * 0.18, s * 0.4, s * 0.68);
    x.fillStyle = PAL.gray; x.fillRect(s * 0.4, s * 0.08, s * 0.2, s * 0.1);
    x.fillStyle = c; x.fillRect(s * 0.36, s * 0.5, s * 0.28, s * 0.3);
  }
  function battery(x, s) {
    x.strokeStyle = PAL.cyan; x.fillStyle = NB.dark(PAL.cyan, 0.25); x.lineWidth = s * 0.06;
    x.fillRect(s * 0.12, s * 0.3, s * 0.68, s * 0.4); x.strokeRect(s * 0.12, s * 0.3, s * 0.68, s * 0.4);
    x.fillStyle = PAL.cyan; x.fillRect(s * 0.8, s * 0.42, s * 0.08, s * 0.16);
    x.fillStyle = PAL.yellow; for (let k = 0; k < 3; k++) x.fillRect(s * (0.18 + k * 0.2), s * 0.36, s * 0.14, s * 0.28);
  }
  function chip(x, s) {
    x.translate(s / 2, s / 2); x.strokeStyle = PAL.yellow; x.fillStyle = NB.dark(PAL.yellow, 0.35); x.lineWidth = s * 0.07;
    x.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; x.lineTo(Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4); } x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(s * 0.12, -s * 0.14); x.lineTo(-s * 0.1, -s * 0.14); x.lineTo(-s * 0.16, 0); x.lineTo(-s * 0.1, s * 0.14); x.lineTo(s * 0.12, s * 0.14); x.stroke();
  }
  // Cores neon por faixa de matiz: o filtro "puxa" cada cor para a da paleta.
  const HUES = [[0, PAL.red], [25, PAL.orange], [50, PAL.yellow], [90, PAL.lime], [135, PAL.green], [185, PAL.cyan], [225, PAL.blue], [275, PAL.purple], [315, PAL.magenta], [345, PAL.red]];
  const HUE_RGB = HUES.map(([h, c]) => [h, NB.dark(c, 1).match(/\d+/g).map(Number)]);
  function neonRGB(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (mx < 20) return null;
    if (d < 28) return [150, 230, 255];                // cinzas: ciano claro
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    let best = HUE_RGB[0];
    for (const e of HUE_RGB) if (Math.abs(e[0] - h) < Math.abs(best[0] - h)) best = e;
    return best[1];
  }
  const NEON = new Map();
  function filterImage(img) {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    const name = Object.keys(ICON_DRAW).find(k => decodeURIComponent(img.src).endsWith(k));
    if (name) { x.imageSmoothingEnabled = false; const s = Math.min(w, h); x.save(); x.translate((w - s) / 2, (h - s) / 2); ICON_DRAW[name](x, s); x.restore(); return c; }
    ORIG_DRAW.call(x, img, 0, 0);
    try {
      const d = x.getImageData(0, 0, w, h), p = d.data, out = new Uint8ClampedArray(p.length);
      const A = i => p[i * 4 + 3], L = i => p[i * 4] * 0.3 + p[i * 4 + 1] * 0.59 + p[i * 4 + 2] * 0.11;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
        const i = yy * w + xx, o = i * 4;
        if (A(i) < 30) continue;
        // Borda: vizinho transparente, ou um salto de brilho (desenho por dentro).
        let edge = false, l = L(i);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = xx + dx, ny = yy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) { edge = edge || A(i) > 200 && false; continue; }
          const j = ny * w + nx;
          if (A(j) < 30 || Math.abs(L(j) - l) > 46) { edge = true; break; }
        }
        const nc = neonRGB(p[o], p[o + 1], p[o + 2]);
        if (edge && nc) { out[o] = nc[0]; out[o + 1] = nc[1]; out[o + 2] = nc[2]; out[o + 3] = 255; }
        else {
          const k = 0.16 + l / 255 * 0.14, tint = nc || [40, 60, 120];
          out[o] = 5 + tint[0] * k; out[o + 1] = 6 + tint[1] * k; out[o + 2] = 15 + tint[2] * k; out[o + 3] = A(i);
        }
      }
      x.putImageData(new ImageData(out, w, h), 0, 0);
    } catch (e) { /* imagem de outra origem (file://): fica como veio */ }
    return c;
  }
  function neonOf(img) {
    let c = NEON.get(img.src);
    if (!c) { c = filterImage(img); NEON.set(img.src, c); }
    return c;
  }
  CanvasRenderingContext2D.prototype.drawImage = function (img, ...rest) {
    if (img instanceof HTMLImageElement && img.complete && img.naturalWidth && isArt(img.src)) img = neonOf(img);
    return ORIG_DRAW.call(this, img, ...rest);
  };

  // <img> e CSS do jogo: troca pela versão neon quando a original carrega.
  const URLS = new Map();
  function neonURL(src) {
    if (URLS.has(src)) return URLS.get(src);
    const pr = new Promise(res => {
      const im = new Image();
      im.onload = () => { try { res(neonOf(im).toDataURL()); } catch (e) { res(null); } };
      im.onerror = () => res(null);
      im.src = src;
    });
    URLS.set(src, pr);
    return pr;
  }
  function fixImg(el) {
    if (el.dataset.neon === el.getAttribute('src')) return;
    const src = el.src;
    if (!isArt(src)) return;
    neonURL(src).then(u => { if (u && el.src === src) { el.src = u; el.dataset.neon = u; } });
  }
  // Estilos com imagem do jogo: fundo, border-image (a fita dos títulos) e as
  // variáveis --ui-* que o jogo põe no <html> com o caminho das molduras.
  function fixStyle(el) {
    const st = el.style;
    if (!st) return;
    const props = ['background-image', 'border-image-source'];
    for (let i = 0; i < st.length; i++) if (st[i].startsWith('--')) props.push(st[i]);
    for (const prop of props) {
      const v = st.getPropertyValue(prop);
      if (!v || v.indexOf(ART) < 0) continue;
      const m = /url\(["']?([^"')]+)["']?\)/.exec(v); if (!m || m[1].startsWith('data:')) continue;
      const abs = new URL(m[1], location.href).href;
      neonURL(abs).then(u => { if (u && st.getPropertyValue(prop) === v) st.setProperty(prop, v.replace(m[0], `url("${u}")`)); });
    }
  }
  function fixSheets() {
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch (e) { continue; }
      for (const r of rules) {
        if (!r.style || !r.style.backgroundImage || r.style.backgroundImage.indexOf(ART) < 0) continue;
        const m = /url\(["']?([^"')]+)["']?\)/.exec(r.style.backgroundImage);
        if (m) neonURL(new URL(m[1], sh.href || location.href).href).then(u => { if (u) r.style.backgroundImage = `url("${u}")`; });
      }
    }
  }

  // ================================================================ 6. textos
  // Dicionário do tema: frases primeiro, depois palavras. A troca guarda a
  // caixa do original (TUDO MAIÚSCULO, Primeira maiúscula ou minúsculo).
  const DICT = [
    ['Guerreiro da Masmorra', 'Androide da Fábrica'],
    // Cidades do mapa (MAP_CITIES).
    ['Pedraverde', 'Silício Verde'], ['Lago Bruma', 'Lago de Óleo'], ['Solar Silente', 'Usina Silente'],
    ['Torre Rubra', 'Antena Rubra'], ['Bosque Ermo', 'Pátio Ermo'], ['Castelo Ruína', 'Refinaria em Ruína'],
    ['Cavaleiro do acampamento', 'Sentinela do hangar'],
    ['Campo de Treinamento', 'Simulador de Treino'], ['Boneco de Treino', 'Robô de Treino'],
    ['Baú do Dia', 'Caixote do Dia'], ['Mago Arcanista', 'Hacker Arcano'], ['Conjura cartas arcanas', 'Roda cartas de código'],
    ['Arqueira ágil e mortal', 'Atiradora ágil e mortal'],
    ['Cavaleiro Negro', 'Mecha Negro'], ['Arqueiro Espectral', 'Atirador Espectral'], ['Lanceiro Sepulcral', 'Lanceiro de Plasma'],
    ['Servo Deformado', 'Servo Defeituoso'], ['Espectro Ladino', 'Holograma Ladino'], ['Serpente Podre', 'Serpente de Cabo'],
    ['Aranha Gigante', 'Aranha-Drone'], ['Goblin da Tocha', 'Gremlin Maçarico'], ['Goblin Dinamite', 'Gremlin Dinamite'],
    ['Lich Amaldiçoado', 'Lich Corrompido'], ['Gnoll Arremessador', 'Lançador de Sucata'], ['Lagarto Cuspidor', 'Lagarto Lança-Óleo'],
    ['Peixe Arpoador', 'Drone Arpoador'], ['Peixe-Remo', 'Drone-Remo'], ['Tartaruga Blindada', 'Tanque-Tartaruga'],
    ['Cavaleiro Selvagem', 'Mecha Selvagem'], ['Rei Slime', 'Rei Gosma'], ['Árvore Anciã', 'Árvore de Cabos'],
    ['Urso Feroz', 'Urso Mecânico'], ['Minotauro Ancestral', 'Minotauro Blindado'], ['Troll das Cavernas', 'Troll de Chapa'],
    ['Ogro Carrasco', 'Ogro Prensa'], ['Arqueiro Ancestral', 'Atirador Ancestral'], ['Igreja Profanada', 'Capela Hackeada'],
    ['Salão do Castelo', 'Salão de Máquinas'], ['Cultista', 'Cultista do Código'], ['Necromante', 'Necromante Digital'],
    ['Minotauro', 'Minotauro Hidráulico'],
    ['Cavaleiros', 'Mechas'], ['Cavaleiro', 'Mecha'], ['Guerreiros', 'Androides'], ['Guerreiro', 'Androide'],
    ['Caçadora', 'Atiradora'], ['Monge', 'Monge-Bot'], ['Mago', 'Hacker'],
    ['Masmorras', 'Fábricas'], ['Masmorra', 'Fábrica'], ['Acampamentos', 'Hangares'], ['Acampamento', 'Hangar'],
    ['Goblins', 'Gremlins'], ['Goblin', 'Gremlin'], ['Souls', 'Núcleos'], ['Soul', 'Núcleo'],
    ['Tochas', 'Baterias'], ['Tocha', 'Bateria'], ['Poções', 'Células'], ['Poção', 'Célula'],
    ['Baús', 'Caixotes'], ['Baú', 'Caixote'], ['Fúria', 'Sobrecarga'], ['Maldição', 'Pane'], ['Amaldiçoado', 'Corrompido'],
    ['Feitiço', 'Programa'], ['Magia', 'Hack'], ['Slime', 'Gosma'], ['Ouro', 'Créditos'],
    ['Cripta', 'Servidor'], ['Castelo', 'Refinaria'], ['Floresta', 'Estufa'], ['Cemitério', 'Ferro-Velho'],
  ];
  const caseOf = (m, r) => m === m.toUpperCase() && m !== m.toLowerCase() ? r.toUpperCase()
    : m[0] === m[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r[0].toLowerCase() + r.slice(1);
  const W_ = 'A-Za-zÀ-ÿ';
  const RULES = DICT.map(([a, b]) => [new RegExp(`(?<![${W_}])${a.replace(/[-]/g, '\\-')}(?![${W_}])`, 'gi'), b]);
  const TCACHE = new Map();
  function tr(s) {
    if (typeof s !== 'string' || !/[A-Za-zÀ-ÿ]{3}/.test(s)) return s;
    let r = TCACHE.get(s);
    if (r !== undefined) return r;
    r = s;
    for (const [re, b] of RULES) r = r.replace(re, m => caseOf(m, b));
    if (TCACHE.size > 5000) TCACHE.clear();
    TCACHE.set(s, r);
    return r;
  }
  for (const fn of ['fillText', 'strokeText', 'measureText']) {
    const o = CanvasRenderingContext2D.prototype[fn];
    CanvasRenderingContext2D.prototype[fn] = function (t, ...a) { return o.call(this, tr(String(t)), ...a); };
  }
  function trNode(n) {
    if (n.nodeType === 3) { const v = n.nodeValue, t = tr(v); if (t !== v) n.nodeValue = t; return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    if (n.tagName === 'IMG') fixImg(n);
    fixStyle(n);
    for (const at of ['title', 'alt', 'placeholder', 'aria-label']) if (n.hasAttribute(at)) { const v = n.getAttribute(at), t = tr(v); if (t !== v) n.setAttribute(at, t); }
    for (const c of n.childNodes) trNode(c);
  }
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') trNode(m.target);
      else if (m.type === 'attributes') { if (m.attributeName === 'src' && m.target.tagName === 'IMG') fixImg(m.target); else if (m.attributeName === 'style') fixStyle(m.target); }
      else m.addedNodes.forEach(trNode);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['src', 'style'] });
  trNode(document.body);
  fixStyle(document.documentElement);
  document.title = tr(document.title);
  fixSheets();

  // ================================================================ 7. hangar (o "acampamento" do menu)
  // O vídeo da fogueira dá lugar a um fundo de grade neon (neon.css).
  const vid = document.getElementById('campVideo');
  if (vid) { try { vid.pause(); } catch (e) { } vid.removeAttribute('src'); vid.load(); vid.style.display = 'none'; }
  // Ícone da aba: o herói robô.
  try {
    const ic = document.createElement('canvas'); ic.width = ic.height = 64;
    ic.getContext('2d').drawImage(NB.frame(NB.specFor('warrior'), 'idle', 0, { w: 64, h: 64, footX: 32, footY: 58, bodyH: 50, view: 'front', dir: 1 }), 0, 0);
    const l = document.createElement('link'); l.rel = 'icon'; l.href = ic.toDataURL(); document.head.appendChild(l);
  } catch (e) { }

  window.NEONSKIN = { tr, neonOf, bloom };
})();
