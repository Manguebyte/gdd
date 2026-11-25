// neon-art.js — toda a arte do mundo do Orbitfall 2D Neon, desenhada em código.
//
// POR QUE: o teste é ver se o Orbitfall fica bom com cara de fliperama neon dos anos 80 (fundo
// preto, formas de poucos pixels em cores saturadas, brilho em volta). Em vez de pedir arte nova,
// cada sprite é um desenho de poucos pixels feito aqui, numa cor neon só (ou duas).
//
// ESTRATÉGIA: cada folha gerada tem EXATAMENTE o layout de células da PNG original de
// Sprites/8-Bit-Armageddon/ (mesmo tamanho de célula, mesma ordem de quadros e linhas). Assim o
// game.js continua desenhando com os mesmos drawImage de antes: NEON.build() só preenche IMG com
// canvases no lugar das imagens. O brilho (bloom) não mora aqui: é um passe no fim do render().
'use strict';
(function () {
  // Paleta neon: poucas cores, todas saturadas. "Meu" é ciano/amarelo, "deles" é magenta/vermelho/verde.
  const C = {
    cyan: '#00f0ff', blue: '#3d7bff', magenta: '#ff2bd6', pink: '#ff6ec7', purple: '#b04dff',
    yellow: '#ffe94a', orange: '#ff8a1f', red: '#ff3355', green: '#39ff6a', lime: '#b6ff3a',
    white: '#ffffff', grid: '#0d1638', black: '#04020c',
  };

  function sheet(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
  const px = (g, x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };

  // Desenha um sprite em texto: cada caractere é um pixel ('.' = vazio), a letra escolhe a cor.
  function glyph(g, rows, cx, cy, pal) {
    const h = rows.length, w = rows[0].length;
    const x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = rows[y][x];
      if (k !== '.' && pal[k]) px(g, x0 + x, y0 + y, pal[k]);
    }
  }
  // Círculo de pixels (só o contorno), com um "vão" opcional para tracejar.
  function ring(g, cx, cy, r, col, dash = 0, phase = 0) {
    const n = Math.max(12, Math.round(r * 7));
    const seen = new Set();
    for (let i = 0; i < n; i++) {
      if (dash && Math.floor(i / dash + phase) % 2) continue;
      const a = i / n * Math.PI * 2, x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
      const key = x + ',' + y; if (seen.has(key)) continue; seen.add(key);
      px(g, x, y, col);
    }
  }
  // Gerador pseudoaleatório com semente: a explosão é igual toda vez (sem tremer entre quadros).
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // ---------------------------------------------------------------- inimigos
  const GRUNT = [[
    '....www....',
    '...awwwa...',
    '.aaaaaaaaa.',
    'aabaabaabaa',
    '.aaaaaaaaa.',
    '..a..a..a..',
  ], [
    '....www....',
    '...awwwa...',
    '.aaaaaaaaa.',
    'abaabaabaab',
    '.aaaaaaaaa.',
    '.a..a..a..a',
  ]];
  const SCOUT = [
    '....a....',
    '...awa...',
    '..aawaa..',
    '.aa.a.aa.',
    'aa..a..aa',
    'a.......a',
  ];
  const GUNNER = [
    '.....a.....',
    '....aaa....',
    '...aawaa...',
    '..aaabaaa..',
    '.aaabbbaaa.',
    '..aaabaaa..',
    '...aaaaa...',
    '....aaa....',
    '.....a.....',
  ];
  const SWARMER = [[
    'a...a',
    '.awa.',
    'aaaaa',
    '.a.a.',
  ], [
    '.a.a.',
    '.awa.',
    'aaaaa',
    'a...a',
  ]];
  const BRUTE = [
    '...aaaaaaaaa...',
    '..aaaaaaaaaaa..',
    '.aawwaaaaawwaa.',
    'aaawwaaaaawwaaa',
    'aaaaaaaaaaaaaaa',
    'aaabbbbbbbbbaaa',
    '.aaab.b.b.baaa.',
    '..aaaaaaaaaaa..',
    '.aa..aaaaa..aa.',
    'aa....aaa....aa',
  ];
  const SATELLITE = [
    'aa.....aa',
    'aa..b..aa',
    'aa.bwb.aa',
    'aaabbbaaa',
    'aa.bbb.aa',
    'aa.....aa',
    'aa.....aa',
  ];

  function strip(frames, cell, drawFrame, rows = 1) {
    const [c, g] = sheet(frames * cell, rows * cell);
    for (let r = 0; r < rows; r++) for (let f = 0; f < frames; f++) drawFrame(g, f * cell + cell / 2, r * cell + cell / 2, f, r);
    return c;
  }

  function mothership() {
    // Casco elíptico 31×13 com cúpula; as luzes da borda andam um passo por quadro (5 quadros).
    return strip(5, 64, (g, cx, cy, f) => {
      const A = 15.5, B = 5.5;
      for (let y = -B; y <= B; y++) for (let x = -A; x <= A; x++) {
        const d = (x * x) / (A * A) + (y * y) / (B * B);
        if (d > 1) continue;
        const col = d > 0.72 ? C.magenta : y === 0 ? C.pink : (Math.abs(x) % 4 === 0 && y > 0 ? C.purple : null);
        if (col) px(g, Math.round(cx + x), Math.round(cy + y + 2), col);
      }
      // cúpula
      for (let y = -5; y <= 0; y++) for (let x = -6; x <= 6; x++) {
        const d = (x * x) / 36 + (y * y) / 25;
        if (d <= 1 && d > 0.55) px(g, Math.round(cx + x), Math.round(cy + y - 3), C.cyan);
        else if (d <= 0.3) px(g, Math.round(cx + x), Math.round(cy + y - 3), C.white);
      }
      // luzes na barriga
      for (let i = 0; i < 7; i++) {
        const on = (i + f) % 5 === 0;
        px(g, Math.round(cx - 12 + i * 4), Math.round(cy + 5), on ? C.white : C.yellow);
      }
      // canhão do laser embaixo
      px(g, cx, cy + 8, C.red); px(g, cx - 1, cy + 8, C.red); px(g, cx, cy + 9, C.white);
    });
  }

  // ---------------------------------------------------------------- planetas
  // Globo "wireframe" de fliperama: fundo escuro, continentes pontilhados e as linhas de latitude e
  // longitude em neon. 32 quadros de giro, como a PNG original (o CSS do menu anda 32 passos).
  const SKINS = {
    Terra_Classic: { line: C.cyan, land: C.green, sea: '#06233a', rim: C.cyan, seed: 1 },
    Terra_Ocean:   { line: C.blue, land: C.cyan, sea: '#071a44', rim: C.cyan, seed: 2 },
    Terra_Desert:  { line: C.orange, land: C.yellow, sea: '#2a1404', rim: C.yellow, seed: 3 },
    Ice_Classic:   { line: C.cyan, land: C.white, sea: '#0a2236', rim: C.white, seed: 4 },
    Ice_Aurora:    { line: C.magenta, land: C.green, sea: '#0b1830', rim: C.green, seed: 5 },
    Ice_Crystal:   { line: C.purple, land: C.cyan, sea: '#160c33', rim: C.purple, seed: 6 },
    Magma_Classic: { line: C.red, land: C.orange, sea: '#2a0508', rim: C.orange, seed: 7 },
    Magma_Obsidian:{ line: C.purple, land: C.red, sea: '#14041e', rim: C.magenta, seed: 8 },
    Magma_Solar:   { line: C.orange, land: C.yellow, sea: '#331a00', rim: C.white, seed: 9 },
  };
  function planet(key) {
    const s = SKINS[key] || SKINS.Terra_Classic, R = 13.5;
    return strip(32, 32, (g, cx, cy, f) => {
      const rot = f / 32 * Math.PI * 2;
      for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) {
        const nx = (x + 0.5) / R, ny = (y + 0.5) / R, q = nx * nx + ny * ny;
        if (q > 1) continue;
        const nz = Math.sqrt(1 - q);
        const lon = Math.atan2(nx, nz) + rot, lat = Math.asin(ny);
        const light = -0.55 * nx - 0.55 * ny + 0.62 * nz;   // luz de cima à esquerda (GDD §6.2)
        let col = null;
        if (q > 0.86) col = s.rim;                          // borda acesa
        else {
          const land = Math.sin(3 * lon + s.seed) * Math.cos(2 * lat) + 0.6 * Math.sin(5 * lon - 2 * lat + s.seed * 1.7) + 0.35 * Math.sin(7 * lat + 2 * lon);
          const L = ((lon % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3);
          const onLon = L < 0.16 || L > Math.PI / 3 - 0.05;
          const onLat = Math.abs(((lat + Math.PI / 2) % (Math.PI / 6)) - Math.PI / 12) > Math.PI / 12 - 0.09;
          if (land > 0.45) col = ((x + y) & 1) || light > 0.2 ? s.land : s.sea;   // continente pontilhado
          else if (onLon || onLat) col = s.line;
          else col = s.sea;
          if (light < -0.25 && col !== s.sea && ((x + y) & 1)) col = s.sea;      // lado escuro: meio-tom
        }
        px(g, cx - 16 + 16 + x, cy + y, col);
      }
    });
  }

  // ---------------------------------------------------------------- tiros, escudos, laser
  const dot = (col, core) => (g, cx, cy, f) => {
    px(g, cx, cy, core); px(g, cx - 1, cy, col); px(g, cx + 1, cy, col); px(g, cx, cy - 1, col); px(g, cx, cy + 1, col);
    if (f) { px(g, cx - 1, cy - 1, col); px(g, cx + 1, cy + 1, col); px(g, cx + 1, cy - 1, col); px(g, cx - 1, cy + 1, col); }
  };

  function explosion(frames, cell, cols, seed, size) {
    return strip(frames, cell, (g, cx, cy, f) => {
      const k = (f + 1) / frames, rnd = rng(seed);
      const col = cols[Math.min(cols.length - 1, Math.floor(k * cols.length))];
      ring(g, cx, cy, Math.max(1, size * k), col, k > 0.5 ? 2 : 0);
      if (f === 0) { px(g, cx, cy, C.white); ring(g, cx, cy, 1.5, C.white); }
      for (let i = 0; i < size * 2; i++) {   // lascas que voam para fora
        const a = rnd() * Math.PI * 2, sp = 0.5 + rnd() * 0.9, d = size * k * sp;
        if (rnd() < k * 0.6) continue;
        px(g, Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), i % 3 ? col : C.white);
      }
    });
  }

  function shield() {
    // 4 quadros × 3 linhas (1, 2 ou 3 cargas): anéis tracejados que giram.
    return strip(4, 48, (g, cx, cy, f, r) => {
      for (let i = 0; i <= r; i++) ring(g, cx, cy, 21 - i * 2, i ? C.blue : C.cyan, 3, f * 0.5 + i);
    }, 3);
  }

  function laser(kind) {
    // Tiles horizontais de 32×32: o game.js gira a linha inteira na direção do planeta.
    if (kind === 'warn') return strip(2, 32, (g, cx, cy, f) => {
      for (let x = -16; x < 16; x++) if (((x + 16) >> 2) % 2 === f) px(g, cx + x, cy, C.red);
    });
    if (kind === 'beam') return strip(4, 32, (g, cx, cy, f) => {
      const w = [2, 3, 2, 3][f];
      for (let x = -16; x < 16; x++) for (let y = -w; y <= w; y++) {
        const col = Math.abs(y) <= w - 2 ? C.white : Math.abs(y) === w ? C.magenta : C.pink;
        if (Math.abs(y) === w && ((x + f) & 3) === 0) continue;
        px(g, cx + x, cy + y, col);
      }
    });
    return explosion(4, 32, [C.white, C.pink, C.magenta], 77, 6);   // impacto
  }

  function arrows() {
    // 2 colunas (apagada, acesa) × 6 linhas: o Spawn Sector s aponta para fora no ângulo s·60°+30°.
    return strip(2, 32, (g, cx, cy, lit, s) => {
      const a = (s * 60 + 30) * Math.PI / 180, dx = Math.cos(a), dy = -Math.sin(a);
      for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++) {
        const u = x * dx + y * dy, v = -x * dy + y * dx;
        const tri = u >= -4 && u <= 6 && Math.abs(v) <= (6 - u) * 0.75;      // ponta
        const chev = u >= -9 && u <= -6 && Math.abs(v) <= (-3 - u) * 1.4 + 3 && Math.abs(v) >= (-6 - u) * 1.4; // chevron atrás
        if (!tri && !chev) continue;
        const edge = tri && (u <= -3 || Math.abs(v) > (6 - u) * 0.75 - 1.2);
        px(g, cx + x, cy + y, lit ? (edge ? C.yellow : C.white) : (edge ? C.orange : '#5a2a08'));
      }
    }, 6);
  }

  // ---------------------------------------------------------------- fundo
  function background() {
    // 4 tiles de 32×32: preto com a grade do fliperama (linha só na borda de cima e da esquerda).
    return strip(4, 32, (g, cx, cy, f) => {
      const x0 = cx - 16, y0 = cy - 16;
      g.fillStyle = C.black; g.fillRect(x0, y0, 32, 32);
      g.fillStyle = C.grid; g.fillRect(x0, y0, 32, 1); g.fillRect(x0, y0, 1, 32);
      for (let i = 2; i < 32; i += 4) px(g, x0 + i, y0 + 16, '#08102a');   // meia-grade pontilhada
      if (f === 1) px(g, x0 + 9, y0 + 21, '#3a4a8a');
      if (f === 3) px(g, x0 + 23, y0 + 7, '#5a2a6a');
    });
  }
  function twinkle() {
    return strip(4, 32, (g, cx, cy, f) => {
      const col = ['#6a7aff', C.cyan, C.white, C.cyan][f];
      px(g, cx, cy, col);
      if (f >= 1) { px(g, cx - 1, cy, col); px(g, cx + 1, cy, col); px(g, cx, cy - 1, col); px(g, cx, cy + 1, col); }
      if (f === 2) { px(g, cx - 2, cy, C.cyan); px(g, cx + 2, cy, C.cyan); px(g, cx, cy - 2, C.cyan); px(g, cx, cy + 2, C.cyan); }
    });
  }

  // ---------------------------------------------------------------- montagem
  const planetURL = {};
  function build(IMG, cores) {
    IMG.bg = background();
    IMG.twinkle = twinkle();
    IMG.grunt = strip(4, 32, (g, cx, cy, f, r) => glyph(g, GRUNT[(f >> 1) & 1], cx, cy, { a: r ? C.purple : C.magenta, b: (f & 1) ? C.yellow : C.white, w: C.cyan }), 2);
    IMG.scout = strip(4, 32, (g, cx, cy, f) => { glyph(g, SCOUT, cx, cy, { a: C.green, w: C.white }); if (f & 1) { px(g, cx, cy + 3, C.yellow); px(g, cx, cy + 4, C.orange); } });
    IMG.gunner = strip(4, 32, (g, cx, cy, f) => glyph(g, GUNNER, cx, cy, { a: C.orange, b: f % 2 ? C.magenta : C.yellow, w: C.white }));
    IMG.swarmer = strip(2, 32, (g, cx, cy, f) => glyph(g, SWARMER[f], cx, cy, { a: C.lime, w: C.white }));
    const bruteCols = [C.red, C.orange, C.magenta, C.pink];
    IMG.brute = strip(4, 32, (g, cx, cy, f) => glyph(g, BRUTE, cx, cy, { a: bruteCols[f], b: C.yellow, w: C.white }));
    IMG.mothership = mothership();
    IMG.satellite = strip(2, 32, (g, cx, cy, f) => glyph(g, SATELLITE, cx, cy, { a: C.cyan, b: C.white, w: f ? C.white : C.orange }));
    IMG.reflector = strip(2, 32, (g, cx, cy, f) => { ring(g, cx, cy, 3, C.cyan); px(g, cx, cy, f ? C.white : C.blue); });
    IMG.projectile = strip(2, 32, dot(C.yellow, C.white));
    IMG.bolt = strip(2, 32, dot(C.magenta, C.white));
    IMG.reflected = strip(2, 32, dot(C.cyan, C.white));
    IMG.expSmall = explosion(5, 32, [C.white, C.yellow, C.orange, C.red], 11, 7);
    IMG.expBig = explosion(5, 32, [C.white, C.yellow, C.orange, C.red], 23, 12);
    IMG.expMother = explosion(6, 64, [C.white, C.pink, C.magenta, C.purple], 31, 28);
    IMG.shieldPop = explosion(5, 48, [C.white, C.cyan, C.blue], 41, 22);
    IMG.shield = shield();
    IMG.laserWarn = laser('warn');
    IMG.laserBeam = laser('beam');
    IMG.laserImpact = laser('impact');
    IMG.arrows = arrows();
    for (const c of cores) for (const s of c.skins) {
      const key = `${c.id}_${s}`, cv = planet(key);
      IMG['planet_' + key] = cv;
      planetURL[key] = cv.toDataURL();   // o menu desenha o planeta girando em CSS
    }
  }

  // ---------------------------------------------------------------- brilho (bloom)
  // Reduz a imagem pela metade 3 vezes (cada redução com suavização faz uma média) e soma as
  // versões borradas por cima, em modo "lighter". Funciona em qualquer navegador, sem ctx.filter.
  const levels = [];
  function bloom(canvas, ctx, strength) {
    let src = canvas, w = canvas.width, h = canvas.height;
    for (let i = 0; i < 4; i++) {
      w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
      let L = levels[i];
      if (!L || L.c.width !== w || L.c.height !== h) { const [c, g] = sheet(w, h); L = levels[i] = { c, g }; }
      L.g.imageSmoothingEnabled = true;
      L.g.globalCompositeOperation = 'copy';
      L.g.drawImage(src, 0, 0, w, h);
      src = L.c;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'lighter';
    const alphas = [0, 0.25, 0.35, 0.45];   // o nível 1/2 quase não borra: fica de fora
    for (let i = 1; i < 4; i++) { ctx.globalAlpha = alphas[i] * strength; ctx.drawImage(levels[i].c, 0, 0, canvas.width, canvas.height); }
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
  }

  window.NEON = { C, build, bloom, planetURL };
})();
