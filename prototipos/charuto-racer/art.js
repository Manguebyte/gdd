'use strict';
/* Charuto Racer — arte provisória desenhada por código, pixel a pixel (o papel do
   PlaceholderSpriteMaker da Fase 0.5, só que mais caprichado). A arte final será do
   PixelLab (Parte 1 §9, Fase 10); até lá, nada aqui é decisão de estilo. */

function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  draw(g, w, h);
  return c;
}

// Ajusta o brilho de uma cor hex (#rrggbb) por um fator (0.7 = mais escura).
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = s => clamp(Math.round(((n >> s) & 255) * f), 0, 255);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function rect(g, x, y, w, h, color) { g.fillStyle = color; g.fillRect(x, y, w, h); }
function disc(g, cx, cy, r, color) {
  g.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const hw = Math.round(Math.sqrt(r * r - y * y));
    g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2, 1);
  }
}

// Fonte de 3x5 pixels, só com as letras usadas nas placas.
const FONT3 = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', E: '111100110100111', G: '011100101101011',
  I: '111010010010111', L: '100100100100111', O: '010101101101010', P: '110101110100100', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', V: '101101101101010', X: '101101010101101', N: '101111111111101',
  U: '101101101101111', ' ': '000000000000000',
};
function text3(g, str, x, y, color) {
  g.fillStyle = color;
  for (const ch of str) {
    const bits = FONT3[ch] || FONT3[' '];
    for (let i = 0; i < 15; i++) if (bits[i] === '1') g.fillRect(x + (i % 3), y + Math.floor(i / 3), 1, 1);
    x += 4;
  }
}

// ------------------------------------------------------------------ carro visto de trás
// Carro-charuto: pneus traseiros grandes, cauda em forma de charuto, motor e escapamentos
// à mostra, piloto de capacete aberto. lean = -1/0/1 (quadros de curva).
function drawCar(look, lean) {
  return makeCanvas(64, 36, g => {
    const L = lean, cx = 32 + L * 2;
    const tyre = '#141414', tread = '#2b2b2b', arm = '#8a8a8a';
    rect(g, 4, 33, 56, 3, 'rgba(0,0,0,0.35)');                  // sombra
    // pneus dianteiros (mais longe, mais acima e menores)
    rect(g, 9 - L * 2, 9, 7, 9, tyre); rect(g, 48 - L * 2, 9, 7, 9, tyre);
    rect(g, 10 - L * 2, 10, 1, 7, tread); rect(g, 53 - L * 2, 10, 1, 7, tread);
    // braços da suspensão
    rect(g, 15, 13, 9, 1, arm); rect(g, 40, 13, 9, 1, arm);
    rect(g, 14, 24, 9, 1, arm); rect(g, 41, 24, 9, 1, arm);
    // pneus traseiros
    for (const tx of [1, 50]) {
      rect(g, tx, 15, 13, 19, tyre);
      for (let y = 17; y < 33; y += 3) rect(g, tx + 1, y, 11, 1, tread);
      rect(g, tx + 2, 16, 1, 17, '#3c3c3c');
    }
    // cauda (charuto): meia largura por linha
    const prof = [3, 5, 6, 7, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 8, 8, 7, 7, 6, 5];
    const dark = shade(look.body, 0.62), light = shade(look.body, 1.25);
    prof.forEach((hw, i) => {
      const y = 7 + i;
      rect(g, cx - hw, y, hw * 2, 1, look.body);
      rect(g, cx - hw, y, 2, 1, dark);
      rect(g, cx + hw - 2, y, 2, 1, dark);
      if (i > 2 && i < 20) rect(g, cx - hw + 2, y, 1, 1, light);
    });
    rect(g, cx - 1, 9, 2, 20, look.accent);                     // faixa central
    // motor, câmbio e escapamentos
    rect(g, cx - 7, 25, 14, 7, '#4b4b4b'); rect(g, cx - 5, 26, 10, 5, '#7c7c7c'); rect(g, cx - 2, 31, 4, 3, '#3a3a3a');
    rect(g, cx - 10, 22, 2, 9, '#cfcfcf'); rect(g, cx + 8, 22, 2, 9, '#cfcfcf');
    rect(g, cx - 10, 30, 2, 1, '#555'); rect(g, cx + 8, 30, 2, 1, '#555');
    // santo antônio e capacete
    rect(g, cx - 5 + L, 4, 10, 2, '#9a9a9a');
    const hx = cx + L * 3;
    disc(g, hx, 3, 4, look.helmet);
    rect(g, hx - 4, 2, 8, 1, '#2a2a2a');                         // tira dos óculos
    rect(g, hx - 2, 0, 2, 1, shade(look.helmet, 1.3));
  });
}

// ------------------------------------------------------------------ objetos da beira da pista
function leafy(g, cx, cy, r, colors, rand) {
  disc(g, cx, cy, r, colors[0]);
  for (let i = 0; i < 9; i++) disc(g, cx - r * 0.5 + rand() * r, cy - r * 0.6 + rand() * r * 0.8, Math.max(2, r * 0.35), colors[1]);
  for (let i = 0; i < 6; i++) disc(g, cx - r * 0.6 + rand() * r * 0.6, cy - r * 0.7 + rand() * r * 0.5, Math.max(1, r * 0.2), colors[2]);
}

function buildSprites() {
  const rand = seeded(7);
  const S = {};
  const tree = (colors) => makeCanvas(48, 64, g => {
    rect(g, 21, 38, 6, 26, '#5b3b22'); rect(g, 21, 38, 2, 26, '#7a5232');
    leafy(g, 24, 26, 20, colors, rand);
  });
  S.oak = tree(['#2f6b2e', '#3f8a3a', '#62a84e']);
  S.autumn = tree(['#a8461f', '#d0712a', '#eaa43e']);
  S.autumn2 = tree(['#8a2f1e', '#b8472a', '#d9763a']);
  S.pine = makeCanvas(32, 72, g => {
    rect(g, 14, 58, 4, 14, '#4a3020');
    for (let i = 0; i < 5; i++) {
      const top = 4 + i * 11, hw = 5 + i * 2.6;
      for (let y = 0; y < 16; y++) {
        const w = Math.round((y / 16) * hw);
        rect(g, 16 - w, top + y, w * 2, 1, '#1f4a2a');
        rect(g, 16 - w, top + y, Math.max(1, w * 0.6), 1, '#2d6438');
      }
    }
  });
  S.cypress = makeCanvas(16, 64, g => {
    rect(g, 7, 56, 2, 8, '#4a3020');
    for (let y = 0; y < 58; y++) {
      const t = y / 58, w = Math.round(Math.sin(Math.PI * Math.min(1, t * 1.1)) * 7);
      rect(g, 8 - w, y, w * 2, 1, '#264d2a');
      rect(g, 8 - w, y, Math.max(1, w * 0.6), 1, '#3a6b38');
    }
  });
  S.palm = makeCanvas(48, 64, g => {
    for (let y = 18; y < 64; y++) rect(g, 22 + Math.round(Math.sin(y / 14) * 3), y, 4, 1, y % 4 ? '#8a6a3e' : '#6f532e');
    const fronds = [[-20, 8], [-14, 2], [-6, -2], [6, -2], [14, 2], [20, 8], [-18, 14], [18, 14]];
    for (const [dx, dy] of fronds)
      for (let i = 0; i <= 12; i++) rect(g, 24 + Math.round(dx * i / 12), 18 + Math.round(dy * i / 12 + Math.sin(i / 4) * 2), 3, 2, i % 3 ? '#2f7a34' : '#4c9a45');
  });
  S.hay = makeCanvas(32, 16, g => {
    rect(g, 0, 2, 32, 14, '#c9a24c'); rect(g, 0, 2, 32, 2, '#e3c06a'); rect(g, 0, 14, 32, 2, '#9c7a32');
    for (let x = 3; x < 32; x += 6) rect(g, x, 3, 1, 12, '#a8853b');
    rect(g, 8, 2, 1, 14, '#6b5426'); rect(g, 23, 2, 1, 14, '#6b5426');
  });
  const sign = (bg, fg, txt) => makeCanvas(48, 30, g => {
    rect(g, 6, 16, 3, 14, '#5b3b22'); rect(g, 39, 16, 3, 14, '#5b3b22');
    rect(g, 0, 0, 48, 18, '#2a2a2a'); rect(g, 1, 1, 46, 16, bg);
    rect(g, 1, 13, 46, 4, shade(bg, 0.7));
    text3(g, txt, 24 - txt.length * 2, 5, fg);
  });
  S.sign1 = sign('#f2c230', '#b81e1e', 'OLEO SUPER');
  S.sign2 = sign('#1e4fa0', '#f2f2f2', 'VELOX');
  S.sign3 = sign('#c41e24', '#f2f2f2', 'PNEUS GT');
  S.marshal = makeCanvas(12, 22, g => {
    rect(g, 4, 12, 2, 10, '#2a2a4a'); rect(g, 6, 12, 2, 10, '#2a2a4a');
    rect(g, 3, 5, 6, 8, '#e8e2c4'); disc(g, 6, 3, 2, '#e0b088');
    rect(g, 8, 0, 1, 8, '#555'); rect(g, 9, 0, 3, 3, '#f2c230');
  });
  S.lamp = makeCanvas(8, 48, g => {
    rect(g, 3, 6, 2, 42, '#3a3f45'); rect(g, 1, 44, 6, 4, '#2a2e33');
    rect(g, 0, 2, 8, 4, '#3a3f45'); rect(g, 1, 3, 6, 2, '#f4e3a0');
  });
  S.building = makeCanvas(96, 72, g => {
    const walls = ['#e2c39a', '#d99a7a', '#efe0bf', '#c9a27c'];
    for (let i = 0; i < 3; i++) {
      const x = i * 32, h = 52 + Math.floor(rand() * 20), wall = walls[Math.floor(rand() * walls.length)];
      rect(g, x, 72 - h, 32, h, wall); rect(g, x, 72 - h, 32, 3, shade(wall, 0.7));
      for (let wy = 72 - h + 7; wy < 64; wy += 10)
        for (let wx = x + 4; wx < x + 30; wx += 9) { rect(g, wx, wy, 5, 6, '#3d5a73'); rect(g, wx - 1, wy + 6, 7, 1, '#6b4a2a'); }
      rect(g, x + 12, 62, 8, 10, '#5a3a24');
    }
  });
  S.stand = makeCanvas(96, 40, g => {
    rect(g, 0, 4, 96, 3, '#c42a2a'); rect(g, 2, 7, 2, 33, '#555'); rect(g, 92, 7, 2, 33, '#555');
    for (let row = 0; row < 6; row++) {
      rect(g, 4, 10 + row * 5, 88, 5, row % 2 ? '#8a8a8a' : '#9a9a9a');
      for (let x = 5; x < 91; x += 2) if (rand() < 0.8) rect(g, x, 10 + row * 5, 1, 2, ['#c42a2a', '#f2f2f2', '#2452a8', '#f2c230', '#2a2a2a'][Math.floor(rand() * 5)]);
    }
  });
  S.pitboard = makeCanvas(24, 30, g => {
    rect(g, 10, 14, 3, 16, '#3a3f45');
    rect(g, 0, 0, 24, 15, '#f2f2f2'); rect(g, 1, 1, 22, 13, '#1e4fa0');
    text3(g, 'BOX', 6, 5, '#f2f2f2');
  });
  S.gantry = makeCanvas(160, 56, g => {
    rect(g, 0, 8, 4, 48, '#3a3f45'); rect(g, 156, 8, 4, 48, '#3a3f45');
    rect(g, 0, 6, 160, 16, '#2a2a2a');
    for (let x = 0; x < 160; x += 4) for (let y = 0; y < 2; y++) rect(g, x, 7 + y * 7, 4, 7, ((x / 4 + y) % 2) ? '#f2f2f2' : '#1a1a1a');
    rect(g, 58, 0, 44, 8, '#c42a2a'); text3(g, 'GP', 75, 2, '#f2f2f2');
  });
  S.tuft = makeCanvas(24, 12, g => {
    for (let i = 0; i < 14; i++) { const x = 2 + rand() * 20, h = 4 + rand() * 8; rect(g, Math.round(x), 12 - Math.round(h), 1, Math.round(h), i % 2 ? '#8a9a4a' : '#a7b05a'); }
  });
  S.cactus = makeCanvas(20, 36, g => {
    rect(g, 8, 4, 5, 32, '#3f7a3a'); rect(g, 8, 4, 2, 32, '#5a9a4a');
    rect(g, 2, 14, 3, 10, '#3f7a3a'); rect(g, 2, 22, 7, 3, '#3f7a3a');
    rect(g, 15, 10, 3, 9, '#3f7a3a'); rect(g, 12, 17, 6, 3, '#3f7a3a');
  });
  S.rock = makeCanvas(32, 18, g => {
    disc(g, 16, 14, 13, '#8a7a6a'); disc(g, 12, 11, 7, '#a8978a'); rect(g, 0, 16, 32, 2, 'rgba(0,0,0,0.25)');
  });
  return S;
}

// ------------------------------------------------------------------ fundos (parallax)
// Cada camada tem 384 px de largura e se repete sem emenda (as ondas fecham ciclos inteiros).
function wave(x, w, cycles, phase) { return Math.sin((x / w) * cycles * Math.PI * 2 + phase); }

function drawLayer(spec, h, seed) {
  const [type, c1, c2] = spec, W = 384, rand = seeded(seed);
  return makeCanvas(W, h, g => {
    const col = (x, top, color) => { if (top < h) rect(g, x, Math.max(0, Math.round(top)), 1, h - Math.round(top), color); };
    if (type === 'hills' || type === 'dunes') {
      for (let x = 0; x < W; x++) {
        const y = h * 0.35 + wave(x, W, 2, 0.5) * h * 0.18 + wave(x, W, 5, 1.3) * h * 0.08;
        col(x, y, c1);
        if (type === 'dunes') col(x, y + 3 + wave(x, W, 7, 0) * 2, c2);
        else if (wave(x, W, 9, 2) > 0.2) rect(g, x, Math.round(y), 1, 2, c2);
      }
    } else if (type === 'mountains') {
      for (let x = 0; x < W; x++) {
        const tri = (cyc, ph) => 1 - Math.abs(((x / W) * cyc + ph) % 1 * 2 - 1);
        const y = h * 0.95 - (tri(3, 0.1) * 0.55 + tri(7, 0.4) * 0.25) * h;
        col(x, y, c1);
        if (y < h * 0.4) rect(g, x, Math.round(y), 1, 3, '#e8eef2');
      }
    } else if (type === 'forest' || type === 'poplars') {
      for (let x = 0; x < W; x++) col(x, h * 0.55 + wave(x, W, 3, 0.2) * h * 0.1, c1);
      const step = type === 'poplars' ? 9 : 7;
      for (let x = 0; x < W; x += step) {
        const top = h * (type === 'poplars' ? 0.05 : 0.25) + rand() * h * 0.25;
        for (let y = Math.round(top); y < h; y++) {
          const t = (y - top) / (h - top);
          const hw = type === 'poplars' ? Math.round(Math.sin(Math.min(1, t * 1.6) * Math.PI / 2) * 3) : Math.round(Math.min(1, t * 2) * 5);
          rect(g, (x - hw + W) % W, y, hw * 2, 1, (x / step) % 2 ? c1 : c2);
          if (x - hw < 0) rect(g, x - hw + W, y, -(x - hw), 1, (x / step) % 2 ? c1 : c2);
        }
      }
    } else if (type === 'city') {
      for (let x = 0; x < W;) {
        const bw = 10 + Math.floor(rand() * 18), bh = h * (0.3 + rand() * 0.6), color = rand() < 0.5 ? c1 : c2;
        rect(g, x, Math.round(h - bh), bw, Math.round(bh), color);
        for (let wy = Math.round(h - bh) + 3; wy < h - 3; wy += 5)
          for (let wx = x + 2; wx < x + bw - 2; wx += 4) rect(g, wx, wy, 2, 2, shade('#7d5a3a', 1));
        x += bw;
      }
    } else if (type === 'sea') {
      rect(g, 0, Math.round(h * 0.7), W, h, c1);
      for (let i = 0; i < 40; i++) rect(g, Math.floor(rand() * W), Math.round(h * 0.72 + rand() * h * 0.25), 4 + Math.floor(rand() * 6), 1, c2);
    } else if (type === 'mesas') {
      for (let x = 0; x < W; x++) col(x, h * 0.8 + wave(x, W, 4, 0) * 3, c2);
      for (let i = 0; i < 4; i++) {
        const x0 = Math.floor(i * 96 + rand() * 40), mw = 30 + Math.floor(rand() * 30), top = h * (0.25 + rand() * 0.3);
        for (let x = x0; x < x0 + mw; x++) { const edge = Math.min(x - x0, x0 + mw - x); col(x % W, top + Math.max(0, 6 - edge) * 3, c1); }
        rect(g, x0, Math.round(top) + 4, mw, 1, shade(c1, 0.8));
      }
    }
  });
}

function drawClouds(count, seed) {
  const rand = seeded(seed);
  return makeCanvas(384, 50, g => {
    for (let i = 0; i < count; i++) {
      const x = rand() * 340, y = 6 + rand() * 30, w = 16 + rand() * 30;
      for (let k = 0; k < 4; k++) disc(g, x + k * w / 4, y + (k % 2) * 2, 4 + rand() * 4, 'rgba(255,255,255,0.85)');
      rect(g, Math.round(x - 2), Math.round(y + 4), Math.round(w + 6), 3, 'rgba(255,255,255,0.85)');
    }
  });
}

// Ícones das peças para a loja (32x32): um desenho por categoria, com pontos marcando o nível.
function drawPartIcon(cat, tier) {
  return makeCanvas(32, 32, g => {
    rect(g, 0, 0, 32, 32, '#1d2a22'); rect(g, 1, 1, 30, 30, '#25382c');
    if (cat === 0) { // motor
      rect(g, 6, 9, 20, 13, '#8a8a8a'); rect(g, 6, 9, 20, 3, '#b0b0b0');
      for (let i = 0; i < Math.min(4, tier + 1); i++) rect(g, 8 + i * 5, 5, 3, 4, '#cfcfcf');
      rect(g, 3, 13, 3, 5, '#5a5a5a'); rect(g, 26, 13, 3, 5, '#5a5a5a');
    } else if (cat === 1) { // câmbio
      disc(g, 16, 14, 9, '#9a9a9a'); disc(g, 16, 14, 4, '#25382c');
      for (let a = 0; a < 8; a++) rect(g, Math.round(16 + Math.cos(a * Math.PI / 4) * 10) - 1, Math.round(14 + Math.sin(a * Math.PI / 4) * 10) - 1, 3, 3, '#9a9a9a');
    } else if (cat === 2) { // pneu
      disc(g, 16, 14, 10, '#151515'); disc(g, 16, 14, 5, '#9a9a9a'); disc(g, 16, 14, 2, '#5a5a5a');
      if (tier < 4) for (let a = 0; a < 12; a++) rect(g, Math.round(16 + Math.cos(a * Math.PI / 6) * 8), Math.round(14 + Math.sin(a * Math.PI / 6) * 8), 1, 1, '#3a3a3a');
    } else { // chassi
      rect(g, 13, 5, 6, 20, '#c9a24c'); rect(g, 11, 9, 10, 12, '#c9a24c'); rect(g, 15, 5, 2, 20, '#e3c06a');
      rect(g, 6, 7, 5, 6, '#151515'); rect(g, 21, 7, 5, 6, '#151515'); rect(g, 5, 18, 6, 8, '#151515'); rect(g, 21, 18, 6, 8, '#151515');
      if (tier === 4) { rect(g, 9, 2, 14, 2, '#c42a2a'); rect(g, 15, 2, 2, 4, '#555'); }
    }
    for (let i = 0; i < 4; i++) rect(g, 7 + i * 5, 27, 3, 3, i < tier ? '#f2c230' : '#3d5446');
  });
}
