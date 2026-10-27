// art.js — os desenhos do caderno: monstros, herói, ícones, dados e mapa.
//
// POR QUE: cada desenho é uma função que devolve traços (sketch.js) numa
// caixa de 100×100. A mesma lista serve grande na luta e pequena no mapa
// (S.xform), e pode ser desenhada aos poucos, como o mestre faz.
//
// ESTRATÉGIA: o contorno vem primeiro (caneta) e a pintura depois (lápis de
// cor em hachura), na ordem em que uma criança desenha e pinta.
(function () {
  'use strict';
  const S = Sketch, C = S.C;
  const A = {};

  // ---------- atalhos de desenho ----------
  const pen = (color, w = 2.4) => ({ color, w, kind: 'pen' });
  function pl(r, o, pts, closed, color, w) { o.push(S.poly(r, pts, closed, pen(color, w))); }
  function ln(r, o, x1, y1, x2, y2, color, w) { o.push(S.line(r, x1, y1, x2, y2, pen(color, w))); }
  function ov(r, o, cx, cy, rx, ry, color, w) { o.push(S.ellipse(r, cx, cy, rx, ry, pen(color, w))); }
  function fill(r, o, poly, color, sp = 3.6, ang = 0.8, alpha = 0.75) {
    for (const s of S.hatch(r, poly, { color, spacing: sp, angle: ang, alpha, w: 1.7 })) o.push(s);
  }
  function fillE(r, o, cx, cy, rx, ry, color, sp, ang, alpha) {
    fill(r, o, S.ellipsePoly(cx, cy, rx * 0.9, ry * 0.9), color, sp, ang, alpha);
  }
  // Forma fechada contornada e pintada de uma vez.
  function shape(r, o, pts, line, color, w = 2.6, sp = 3.6, ang = 0.8) { pl(r, o, pts, true, line, w); fill(r, o, pts, color, sp, ang); }
  function blob(r, o, cx, cy, rx, ry, line, color, w = 2.6, sp = 3.6, ang = 0.8) { ov(r, o, cx, cy, rx, ry, line, w); fillE(r, o, cx, cy, rx, ry, color, sp, ang); }
  function dot(r, o, x, y, rad, color) { ov(r, o, x, y, rad, rad, color, 2); fillE(r, o, x, y, rad, rad, color, 1.4, 0.3, 0.95); }
  function eyes(r, o, x1, x2, y, rad, color = C.INK) { dot(r, o, x1, y, rad, color); dot(r, o, x2, y, rad, color); }

  // ---------- monstros ----------
  const M = {};
  M.slime = r => {
    const o = [], body = [[16, 90], [15, 74], [22, 56], [36, 42], [50, 38], [64, 42], [78, 56], [85, 74], [84, 90]];
    shape(r, o, body, C.GREEN, C.LGREEN, 3);
    eyes(r, o, 40, 60, 62, 4);
    pl(r, o, [[42, 74], [50, 79], [58, 74]], false, C.INK, 2.2);
    pl(r, o, [[28, 64], [31, 55], [38, 49]], false, C.PAPER, 3);
    return o;
  };
  M.rato = r => {
    const o = [];
    pl(r, o, [[20, 70], [8, 66], [4, 54], [10, 44]], false, C.PINK, 2.6);
    blob(r, o, 46, 68, 30, 17, C.INK, C.GRAY);
    blob(r, o, 78, 60, 13, 11, C.INK, C.GRAY);
    blob(r, o, 74, 46, 6, 7, C.INK, C.PINK);
    dot(r, o, 82, 57, 2.4, C.INK);
    dot(r, o, 92, 62, 2.6, C.PINK);
    ln(r, o, 88, 64, 99, 60, C.INK, 1.2); ln(r, o, 88, 66, 99, 68, C.INK, 1.2);
    for (const x of [30, 44, 56, 66]) ln(r, o, x, 82, x - 2, 92, C.INK, 2.4);
    return o;
  };
  M.goblin = r => {
    const o = [];
    shape(r, o, [[34, 52], [66, 52], [72, 88], [28, 88]], C.INK, C.BROWN);
    shape(r, o, [[30, 30], [8, 22], [32, 40]], C.INK, C.GREEN, 2.2);
    shape(r, o, [[70, 30], [92, 22], [68, 40]], C.INK, C.GREEN, 2.2);
    blob(r, o, 50, 34, 20, 18, C.INK, C.GREEN);
    eyes(r, o, 42, 58, 30, 3.2, C.RED);
    pl(r, o, [[40, 42], [44, 45], [48, 42], [52, 45], [56, 42], [60, 45]], false, C.INK, 1.8);
    ln(r, o, 34, 58, 18, 74, C.INK, 3); ln(r, o, 66, 58, 82, 70, C.INK, 3);
    ln(r, o, 82, 72, 94, 48, C.GRAY, 3.2); ln(r, o, 78, 66, 88, 72, C.BROWN, 3);
    ln(r, o, 42, 88, 40, 97, C.INK, 3); ln(r, o, 58, 88, 60, 97, C.INK, 3);
    return o;
  };
  // Lobo de pelo cinza; o do gelo e o cão infernal são o mesmo desenho em outras cores.
  function wolf(r, fur, eye) {
    const o = [];
    pl(r, o, [[20, 58], [8, 50], [4, 38], [14, 46], [22, 52]], true, C.INK, 2.4);
    blob(r, o, 46, 62, 28, 15, C.INK, fur);
    shape(r, o, [[66, 40], [90, 54], [96, 58], [88, 64], [70, 64], [64, 52]], C.INK, fur);
    shape(r, o, [[68, 42], [70, 26], [78, 40]], C.INK, fur, 2.2);
    dot(r, o, 78, 50, 2.4, eye);
    dot(r, o, 95, 58, 2, C.INK);
    for (const x of [28, 38, 56, 64]) ln(r, o, x, 72, x + (x > 50 ? 2 : -2), 94, C.INK, 3);
    return o;
  }
  M.lobo = r => wolf(r, C.GRAY, C.RED);
  M.esqueleto = r => {
    const o = [];
    ov(r, o, 50, 22, 14, 14, C.INK, 2.6);
    eyes(r, o, 44, 56, 21, 3.6);
    pl(r, o, [[43, 32], [57, 32], [55, 38], [45, 38]], true, C.INK, 1.8);
    ln(r, o, 50, 38, 50, 70, C.INK, 3);
    for (const y of [46, 53, 60]) pl(r, o, [[36, y + 4], [44, y], [56, y], [64, y + 4]], false, C.INK, 2);
    pl(r, o, [[40, 72], [50, 68], [60, 72], [50, 78]], true, C.INK, 2.2);
    ln(r, o, 50, 44, 30, 62, C.INK, 2.6); ln(r, o, 50, 44, 72, 58, C.INK, 2.6);
    ln(r, o, 44, 76, 38, 96, C.INK, 2.8); ln(r, o, 56, 76, 62, 96, C.INK, 2.8);
    ln(r, o, 72, 60, 92, 30, C.GRAY, 3.2); ln(r, o, 66, 54, 78, 62, C.BROWN, 3);
    return o;
  };
  M.aranha = r => {
    const o = [];
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
      const by = 50 + k * 6, kx = 50 + s * (24 + k * 4), ky = 30 + k * 8;
      pl(r, o, [[50 + s * 10, by], [kx, ky], [50 + s * (36 + k * 3), 86 + (k % 2) * 6]], false, C.INK, 2.4);
    }
    blob(r, o, 50, 66, 20, 18, C.INK, C.PURPLE, 2.8, 3);
    blob(r, o, 50, 44, 12, 10, C.INK, C.PURPLE, 2.6, 3);
    for (const [x, y] of [[45, 42], [55, 42], [48, 47], [52, 47]]) dot(r, o, x, y, 1.8, C.RED);
    return o;
  };
  M.orc = r => {
    const o = [];
    shape(r, o, [[28, 50], [72, 50], [80, 92], [20, 92]], C.INK, C.OLIVE);
    ln(r, o, 24, 72, 76, 72, C.BROWN, 4);
    blob(r, o, 50, 30, 20, 18, C.INK, C.OLIVE);
    pl(r, o, [[36, 22], [46, 26]], false, C.INK, 3); pl(r, o, [[64, 22], [54, 26]], false, C.INK, 3);
    eyes(r, o, 43, 57, 29, 2.8, C.RED);
    pl(r, o, [[40, 42], [42, 34], [44, 42]], false, C.INK, 2); pl(r, o, [[56, 42], [58, 34], [60, 42]], false, C.INK, 2);
    ln(r, o, 26, 56, 12, 78, C.INK, 3.4); ln(r, o, 74, 56, 86, 74, C.INK, 3.4);
    ln(r, o, 86, 90, 86, 20, C.BROWN, 4);
    shape(r, o, [[86, 24], [98, 18], [99, 44], [86, 40]], C.INK, C.GRAY, 2.4);
    return o;
  };
  M.bruxa = r => {
    const o = [];
    shape(r, o, [[50, 40], [24, 94], [76, 94]], C.INK, C.PURPLE);
    blob(r, o, 50, 36, 13, 12, C.INK, C.LGREEN);
    pl(r, o, [[52, 36], [62, 42], [53, 42]], false, C.INK, 2);
    dot(r, o, 46, 33, 2, C.INK);
    ln(r, o, 26, 26, 76, 26, C.INK, 3);
    shape(r, o, [[36, 26], [52, 4], [60, 8], [64, 26]], C.INK, C.PURPLE);
    ln(r, o, 30, 60, 14, 50, C.INK, 2.6);
    ln(r, o, 70, 60, 86, 44, C.INK, 2.6);
    ln(r, o, 86, 44, 92, 30, C.BROWN, 3);
    shape(r, o, [[92, 18], [95, 25], [100, 26], [96, 30], [97, 36], [92, 32], [87, 36], [88, 30], [84, 26], [89, 25]], C.ORANGE, C.YELLOW, 1.8, 2.4);
    return o;
  };
  M.ogro = r => {
    const o = [];
    blob(r, o, 50, 64, 32, 28, C.INK, C.ORANGE);
    blob(r, o, 50, 30, 14, 12, C.INK, C.ORANGE);
    eyes(r, o, 45, 55, 28, 2.4);
    pl(r, o, [[44, 36], [56, 36]], false, C.INK, 2);
    ln(r, o, 22, 58, 10, 80, C.INK, 4);
    ln(r, o, 78, 58, 88, 40, C.INK, 4);
    pl(r, o, [[84, 44], [80, 12], [94, 8], [96, 40]], true, C.BROWN, 3);
    fill(r, o, [[84, 44], [80, 12], [94, 8], [96, 40]], C.BROWN);
    ln(r, o, 38, 90, 34, 99, C.INK, 4); ln(r, o, 62, 90, 66, 99, C.INK, 4);
    return o;
  };
  M.cavaleiro = r => {
    const o = [];
    shape(r, o, [[32, 40], [68, 40], [72, 84], [28, 84]], C.INK, C.INK, 2.6, 3);
    shape(r, o, [[36, 8], [64, 8], [66, 38], [34, 38]], C.INK, C.GRAY, 2.6, 3);
    ln(r, o, 40, 22, 60, 22, C.RED, 3.4);
    shape(r, o, [[10, 46], [34, 46], [32, 70], [22, 80], [12, 70]], C.INK, C.RED, 2.4);
    ln(r, o, 22, 50, 22, 74, C.PAPER, 2.4); ln(r, o, 14, 58, 30, 58, C.PAPER, 2.4);
    ln(r, o, 70, 50, 84, 62, C.INK, 3.4);
    ln(r, o, 84, 62, 96, 10, C.GRAY, 3.4); ln(r, o, 78, 54, 90, 64, C.BROWN, 3);
    ln(r, o, 40, 84, 38, 98, C.INK, 4); ln(r, o, 60, 84, 62, 98, C.INK, 4);
    return o;
  };
  M.troll = r => {
    const o = [];
    shape(r, o, [[26, 40], [74, 40], [80, 86], [20, 86]], C.INK, C.LBLUE, 2.8);
    blob(r, o, 50, 30, 16, 13, C.INK, C.LBLUE);
    eyes(r, o, 44, 56, 28, 2.6, C.YELLOW);
    pl(r, o, [[42, 38], [46, 34], [50, 38], [54, 34], [58, 38]], false, C.INK, 2);
    pl(r, o, [[24, 46], [8, 72], [12, 94]], false, C.INK, 4.4);
    pl(r, o, [[76, 46], [92, 72], [88, 94]], false, C.INK, 4.4);
    ln(r, o, 36, 86, 32, 98, C.INK, 4.4); ln(r, o, 64, 86, 68, 98, C.INK, 4.4);
    return o;
  };
  // Golem de pedra cinza; o de magma é o mesmo bloco escuro com rachaduras de lava.
  function golem(r, stone, eye, crack) {
    const o = [];
    shape(r, o, [[24, 36], [76, 36], [78, 76], [22, 76]], C.INK, stone, 2.8, 3.4);
    shape(r, o, [[36, 10], [64, 10], [64, 34], [36, 34]], C.INK, stone, 2.8, 3.4);
    eyes(r, o, 44, 56, 22, 3, eye);
    shape(r, o, [[6, 38], [22, 38], [22, 72], [6, 72]], C.INK, stone, 2.6, 3.4);
    shape(r, o, [[78, 38], [94, 38], [94, 72], [78, 72]], C.INK, stone, 2.6, 3.4);
    shape(r, o, [[28, 76], [44, 76], [44, 98], [28, 98]], C.INK, stone, 2.6, 3.4);
    shape(r, o, [[56, 76], [72, 76], [72, 98], [56, 98]], C.INK, stone, 2.6, 3.4);
    pl(r, o, [[40, 42], [48, 54], [44, 62], [52, 70]], false, crack, crack === C.INK ? 1.8 : 3);
    return o;
  }
  M.golem = r => golem(r, C.GRAY, C.ORANGE, C.INK);

  // ----- Deserto -----
  M.escorpiao = r => {
    const o = [];
    for (let k = 0; k < 3; k++) {
      ln(r, o, 38 + k * 10, 74, 30 + k * 10, 92, C.INK, 2.4);
      ln(r, o, 42 + k * 10, 74, 48 + k * 10, 92, C.INK, 2.4);
    }
    // Rabo em gomos subindo pelas costas, com o ferrão vermelho na ponta.
    pl(r, o, [[30, 70], [16, 58], [14, 38], [26, 24], [42, 22]], false, C.INK, 4);
    for (const [x, y] of [[16, 58], [14, 40], [26, 26]]) blob(r, o, x, y, 7, 6, C.INK, C.OCHRE, 2.2);
    shape(r, o, [[40, 18], [54, 24], [42, 30]], C.INK, C.RED, 2.2);
    blob(r, o, 48, 70, 26, 12, C.INK, C.OCHRE);
    for (const x of [38, 48, 58]) ln(r, o, x, 60, x, 80, C.BROWN, 1.6);
    blob(r, o, 76, 66, 9, 8, C.INK, C.OCHRE);
    eyes(r, o, 76, 82, 62, 2);
    // Pinças.
    ln(r, o, 80, 70, 90, 56, C.INK, 3);
    shape(r, o, [[90, 56], [84, 42], [92, 46], [96, 38], [98, 52]], C.INK, C.OCHRE, 2.2);
    return o;
  };
  M.cobra = r => {
    const o = [];
    blob(r, o, 46, 86, 32, 10, C.INK, C.GREEN);
    pl(r, o, [[22, 84], [34, 80], [54, 82], [68, 86]], false, C.LGREEN, 2);
    shape(r, o, [[54, 82], [58, 62], [56, 46], [66, 46], [70, 64], [66, 84]], C.INK, C.GREEN);
    // Capuz aberto de naja, com o desenho em cima.
    shape(r, o, [[46, 40], [56, 18], [72, 16], [86, 38], [76, 52], [56, 52]], C.INK, C.LGREEN);
    pl(r, o, [[56, 36], [62, 42], [68, 36], [74, 42]], false, C.INK, 2);
    blob(r, o, 64, 22, 10, 8, C.INK, C.GREEN);
    eyes(r, o, 60, 68, 20, 2, C.YELLOW);
    pl(r, o, [[66, 28], [70, 36], [74, 33]], false, C.RED, 1.8);
    pl(r, o, [[70, 36], [72, 40]], false, C.RED, 1.8);
    return o;
  };
  M.mumia = r => {
    const o = [], band = '#efdcae';
    shape(r, o, [[36, 40], [64, 40], [66, 86], [34, 86]], C.INK, band);
    blob(r, o, 50, 26, 13, 14, C.INK, band);
    for (const y of [48, 58, 68, 78]) pl(r, o, [[36, y], [50, y + 4], [64, y - 2]], false, C.OCHRE, 1.8);
    for (const y of [18, 32]) pl(r, o, [[38, y], [62, y + 3]], false, C.OCHRE, 1.8);
    dot(r, o, 45, 25, 2.6, C.RED);
    ln(r, o, 52, 24, 58, 25, C.INK, 2);
    // Braços esticados para a frente e uma faixa solta.
    ln(r, o, 64, 46, 92, 46, C.INK, 4); ln(r, o, 64, 54, 90, 56, C.INK, 4);
    pl(r, o, [[34, 70], [22, 78], [26, 90]], false, C.OCHRE, 2.2);
    ln(r, o, 42, 86, 40, 98, C.INK, 3.4); ln(r, o, 58, 86, 60, 98, C.INK, 3.4);
    return o;
  };
  M.verme = r => {
    const o = [];
    shape(r, o, [[4, 98], [18, 84], [50, 80], [82, 84], [98, 98]], C.OCHRE, C.YELLOW, 2.4, 4);
    for (const [x, y, rr] of [[38, 76, 15], [34, 60, 14], [40, 44, 13]]) blob(r, o, x, y, rr, rr * 0.8, C.INK, C.PINK);
    // Boca redonda cheia de dentes.
    blob(r, o, 56, 28, 15, 14, C.INK, C.PINK);
    ov(r, o, 58, 28, 9, 8, C.INK, 2.4);
    fillE(r, o, 58, 28, 9, 8, C.RED, 2.4, 0.4, 0.9);
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;
      ln(r, o, 58 + Math.cos(a) * 10, 28 + Math.sin(a) * 9, 58 + Math.cos(a) * 6, 28 + Math.sin(a) * 5, C.INK, 1.6);
    }
    return o;
  };

  // ----- Montanhas Geladas -----
  M.lobo_gelo = r => {
    const o = wolf(r, C.LBLUE, C.BLUE);
    for (const [x, y] of [[20, 50], [44, 52], [60, 58]]) pl(r, o, [[x, y], [x + 4, y - 4], [x + 8, y]], false, C.BLUE, 1.6);
    return o;
  };
  M.boneco_neve = r => {
    const o = [];
    ov(r, o, 50, 80, 23, 18, C.LBLUE, 2.8);
    ov(r, o, 50, 50, 16, 14, C.LBLUE, 2.8);
    ov(r, o, 50, 28, 12, 11, C.LBLUE, 2.8);
    // Cartola, olhos de carvão com sobrancelha brava e nariz de cenoura.
    shape(r, o, [[41, 19], [59, 19], [57, 5], [43, 5]], C.INK, C.INK, 2.4, 3);
    ln(r, o, 35, 19, 65, 19, C.INK, 3);
    eyes(r, o, 45, 55, 27, 2.2);
    ln(r, o, 40, 21, 47, 24, C.INK, 2); ln(r, o, 60, 21, 53, 24, C.INK, 2);
    shape(r, o, [[50, 30], [64, 33], [50, 34]], C.ORANGE, C.ORANGE, 2, 2.4);
    for (const y of [44, 52, 60]) dot(r, o, 50, y, 1.8, C.INK);
    ln(r, o, 35, 48, 12, 34, C.BROWN, 3); ln(r, o, 18, 38, 12, 44, C.BROWN, 2.4);
    ln(r, o, 65, 48, 88, 36, C.BROWN, 3); ln(r, o, 82, 40, 88, 46, C.BROWN, 2.4);
    return o;
  };
  M.yeti = r => {
    const o = [];
    blob(r, o, 50, 64, 30, 28, C.BLUE, C.LBLUE, 3);
    blob(r, o, 50, 28, 17, 15, C.BLUE, C.LBLUE, 3);
    blob(r, o, 50, 31, 10, 8, C.INK, C.GRAY, 2.2);
    eyes(r, o, 46, 54, 29, 1.8);
    pl(r, o, [[45, 35], [47, 39], [49, 35]], false, C.INK, 1.6); pl(r, o, [[51, 35], [53, 39], [55, 35]], false, C.INK, 1.6);
    // Braços compridos e pelo em zigue-zague.
    pl(r, o, [[22, 50], [8, 70], [12, 88]], false, C.BLUE, 5);
    pl(r, o, [[78, 50], [92, 70], [88, 88]], false, C.BLUE, 5);
    for (const [x, y] of [[36, 56], [56, 52], [44, 72], [62, 70]]) pl(r, o, [[x, y], [x + 3, y + 4], [x + 6, y]], false, C.BLUE, 1.6);
    ln(r, o, 38, 90, 34, 99, C.BLUE, 5); ln(r, o, 62, 90, 66, 99, C.BLUE, 5);
    return o;
  };
  M.espirito_gelo = r => {
    const o = [];
    const body = [[50, 10], [68, 22], [72, 52], [82, 88], [66, 78], [58, 94], [48, 80], [36, 92], [30, 64], [32, 24]];
    shape(r, o, body, C.BLUE, C.LBLUE, 2.6, 4);
    eyes(r, o, 43, 57, 34, 3.4, C.BLUE);
    ov(r, o, 50, 46, 4, 5, C.INK, 2);
    // Cristais de gelo girando em volta.
    for (const [x, y] of [[12, 40], [88, 34], [16, 72], [90, 64]])
      shape(r, o, [[x, y - 8], [x + 5, y], [x, y + 8], [x - 5, y]], C.BLUE, C.LBLUE, 2, 2.6);
    return o;
  };

  // ----- Pântano Sombrio -----
  M.zumbi = r => {
    const o = [];
    shape(r, o, [[34, 44], [64, 44], [68, 84], [32, 84]], C.INK, C.BLUE);
    pl(r, o, [[34, 76], [40, 84], [46, 76], [52, 84], [58, 76], [64, 84]], false, C.INK, 2);
    blob(r, o, 50, 28, 14, 15, C.INK, C.OLIVE);
    dot(r, o, 44, 26, 2.6, C.YELLOW);
    ln(r, o, 52, 23, 58, 29, C.INK, 2); ln(r, o, 58, 23, 52, 29, C.INK, 2);
    pl(r, o, [[43, 36], [48, 34], [52, 37], [57, 35]], false, C.INK, 1.8);
    // Braços para a frente, um mais caído.
    ln(r, o, 64, 50, 92, 48, C.OLIVE, 4.4); ln(r, o, 62, 58, 88, 64, C.OLIVE, 4.4);
    ln(r, o, 42, 84, 38, 98, C.INK, 3.4); ln(r, o, 58, 84, 64, 98, C.INK, 3.4);
    return o;
  };
  M.sapo = r => {
    const o = [];
    shape(r, o, [[14, 92], [8, 80], [24, 74], [28, 90]], C.INK, C.GREEN, 2.4);
    shape(r, o, [[86, 92], [92, 80], [76, 74], [72, 90]], C.INK, C.GREEN, 2.4);
    blob(r, o, 50, 68, 34, 24, C.INK, C.GREEN, 2.8);
    blob(r, o, 50, 76, 20, 13, C.INK, C.LGREEN, 2);
    // Olhos em cima da cabeça e a língua esticada.
    blob(r, o, 34, 44, 9, 9, C.INK, C.LGREEN); blob(r, o, 64, 44, 9, 9, C.INK, C.LGREEN);
    eyes(r, o, 35, 65, 44, 3);
    pl(r, o, [[24, 60], [50, 66], [78, 58]], false, C.INK, 2.4);
    pl(r, o, [[72, 62], [84, 66], [94, 60]], false, C.PINK, 3);
    dot(r, o, 95, 59, 3, C.PINK);
    return o;
  };
  M.fantasma = r => {
    const o = [];
    const body = [[50, 8], [70, 16], [78, 40], [80, 88], [70, 80], [62, 92], [52, 80], [42, 92], [32, 80], [22, 88], [22, 40], [30, 16]];
    shape(r, o, body, C.GRAY, C.LBLUE, 2.6, 5.2);
    blob(r, o, 41, 36, 5, 7, C.INK, C.INK, 2, 1.6);
    blob(r, o, 59, 36, 5, 7, C.INK, C.INK, 2, 1.6);
    ov(r, o, 50, 56, 6, 8, C.INK, 2.4);
    pl(r, o, [[22, 52], [8, 44], [6, 54]], false, C.GRAY, 2.4);
    pl(r, o, [[78, 52], [92, 42], [96, 52]], false, C.GRAY, 2.4);
    return o;
  };
  M.ceifador = r => {
    const o = [];
    // Foice primeiro, para o manto passar na frente do cabo.
    ln(r, o, 82, 96, 76, 8, C.BROWN, 3.4);
    shape(r, o, [[76, 8], [50, 4], [30, 16], [52, 12], [76, 18]], C.INK, C.GRAY, 2.4, 2.6);
    shape(r, o, [[48, 10], [66, 24], [74, 94], [22, 94], [30, 24]], C.INK, C.INK, 2.6, 3.4);
    blob(r, o, 48, 32, 10, 11, C.INK, C.PAPER, 2.2);
    eyes(r, o, 44, 52, 30, 2.4, C.RED);
    pl(r, o, [[44, 38], [48, 40], [52, 38]], false, C.INK, 1.6);
    ln(r, o, 64, 50, 78, 50, C.INK, 3);
    return o;
  };

  // ----- Vulcão -----
  // Labareda pequena (cx, by = meio da base), usada em vários bichos de fogo.
  function flame(r, o, cx, by, s = 1) {
    const P = (x, y) => [cx + x * s, by + y * s];
    shape(r, o, [P(0, -22), P(7, -10), P(6, -2), P(0, 0), P(-6, -2), P(-7, -10), P(-2, -8)], C.RED, C.ORANGE, 2 * s, 2.4);
    fill(r, o, [P(0, -11), P(3, -5), P(0, -2), P(-3, -5)], C.YELLOW, 1.8, 0.3, 0.95);
  }
  M.salamandra = r => {
    const o = [];
    pl(r, o, [[22, 72], [8, 66], [6, 54], [14, 48]], false, C.RED, 4);
    blob(r, o, 44, 70, 26, 11, C.INK, C.ORANGE);
    blob(r, o, 76, 62, 12, 9, C.INK, C.ORANGE);
    dot(r, o, 80, 58, 2.2, C.YELLOW);
    pl(r, o, [[84, 66], [90, 66]], false, C.INK, 2);
    for (const x of [28, 40, 52, 62]) ln(r, o, x, 78, x + (x > 45 ? 4 : -4), 90, C.INK, 3);
    for (const x of [30, 44, 58]) flame(r, o, x, 62, 0.7);
    return o;
  };
  M.diabrete = r => {
    const o = [];
    shape(r, o, [[36, 50], [14, 32], [20, 52], [10, 60], [34, 62]], C.INK, C.PURPLE, 2.2);
    shape(r, o, [[64, 50], [86, 32], [80, 52], [90, 60], [66, 62]], C.INK, C.PURPLE, 2.2);
    pl(r, o, [[42, 78], [30, 90], [20, 86], [14, 92]], false, C.RED, 2.6);
    shape(r, o, [[14, 92], [8, 88], [14, 84]], C.RED, C.RED, 2, 2);
    blob(r, o, 50, 66, 16, 18, C.INK, C.RED);
    blob(r, o, 50, 38, 13, 12, C.INK, C.RED);
    shape(r, o, [[40, 30], [34, 18], [44, 26]], C.INK, C.INK, 2, 2.4);
    shape(r, o, [[60, 30], [66, 18], [56, 26]], C.INK, C.INK, 2, 2.4);
    eyes(r, o, 45, 55, 36, 2.2, C.YELLOW);
    pl(r, o, [[44, 44], [50, 47], [56, 44]], false, C.INK, 1.8);
    // Tridente.
    ln(r, o, 66, 64, 84, 96, C.BROWN, 2.6);
    pl(r, o, [[58, 56], [62, 50], [66, 64], [74, 54], [76, 62]], false, C.GRAY, 2.6);
    ln(r, o, 42, 84, 40, 96, C.INK, 3); ln(r, o, 58, 84, 60, 96, C.INK, 3);
    return o;
  };
  M.cao_infernal = r => {
    const o = wolf(r, C.RED, C.YELLOW);
    flame(r, o, 74, 30, 0.8); flame(r, o, 10, 44, 0.7); flame(r, o, 40, 50, 0.6);
    return o;
  };
  M.elemental = r => {
    const o = [];
    const body = [[50, 4], [64, 24], [62, 38], [76, 30], [78, 58], [68, 92], [32, 92], [22, 58], [24, 30], [38, 38], [36, 22]];
    shape(r, o, body, C.RED, C.ORANGE, 2.8, 3);
    fill(r, o, [[50, 40], [62, 60], [58, 86], [42, 86], [38, 60]], C.YELLOW, 2.4, 0.3, 0.9);
    eyes(r, o, 43, 57, 46, 3.2);
    pl(r, o, [[42, 58], [50, 62], [58, 58]], false, C.INK, 2);
    flame(r, o, 14, 60, 0.8); flame(r, o, 86, 60, 0.8);
    return o;
  };
  M.golem_magma = r => {
    const o = golem(r, C.BROWN, C.YELLOW, C.ORANGE);
    pl(r, o, [[60, 40], [56, 50], [64, 58]], false, C.ORANGE, 3);
    for (const [x, y] of [[14, 74], [86, 74]]) dot(r, o, x, y + 6, 2.4, C.ORANGE);
    return o;
  };
  M.fenix = r => {
    const o = [];
    shape(r, o, [[46, 50], [6, 18], [16, 40], [2, 46], [36, 64]], C.RED, C.ORANGE, 2.4, 3);
    shape(r, o, [[56, 50], [94, 14], [86, 38], [98, 42], [66, 64]], C.RED, C.ORANGE, 2.4, 3);
    for (const x of [40, 50, 60]) flame(r, o, x, 98, 0.9);
    blob(r, o, 51, 62, 13, 18, C.INK, C.RED);
    blob(r, o, 56, 34, 9, 9, C.INK, C.RED);
    shape(r, o, [[64, 32], [74, 36], [64, 38]], C.INK, C.YELLOW, 2, 2.4);
    dot(r, o, 58, 32, 1.8, C.YELLOW);
    flame(r, o, 54, 26, 0.6);
    return o;
  };
  M.dragao = r => {
    const o = [];
    shape(r, o, [[44, 50], [20, 10], [30, 30], [8, 22], [24, 48]], C.INK, C.PURPLE, 2.4, 3);
    pl(r, o, [[30, 74], [12, 80], [4, 70], [10, 62]], false, C.RED, 3.4);
    blob(r, o, 42, 66, 26, 18, C.INK, C.RED, 2.8, 3);
    shape(r, o, [[54, 56], [62, 34], [70, 24], [76, 32], [68, 44], [62, 62]], C.INK, C.RED, 2.6, 3);
    shape(r, o, [[66, 18], [86, 22], [92, 30], [82, 34], [70, 32]], C.INK, C.RED, 2.6, 3);
    pl(r, o, [[70, 20], [66, 8]], false, C.INK, 2.6); pl(r, o, [[76, 20], [76, 8]], false, C.INK, 2.6);
    dot(r, o, 78, 25, 2.2, C.YELLOW);
    shape(r, o, [[92, 30], [100, 38], [96, 42], [100, 50], [92, 46], [88, 38]], C.ORANGE, C.YELLOW, 2, 2.4);
    for (const x of [28, 40, 52]) ln(r, o, x, 80, x, 96, C.INK, 3.4);
    for (const [x, y] of [[34, 62], [44, 58], [52, 66]]) pl(r, o, [[x, y], [x + 3, y + 4], [x + 6, y]], false, C.INK, 1.6);
    return o;
  };

  // Onde fica o alto da cabeça de cada monstro (caixa 100×100): é ali que o
  // mestre desenha a coroa da versão chefe.
  const HEAD = {
    slime: [50, 38], rato: [78, 48], goblin: [50, 16], lobo: [76, 40], esqueleto: [50, 8], aranha: [50, 34],
    orc: [50, 12], bruxa: [52, 6], ogro: [50, 18], cavaleiro: [50, 8], troll: [50, 17], golem: [50, 10],
    escorpiao: [76, 58], cobra: [64, 14], mumia: [50, 12], verme: [56, 14],
    lobo_gelo: [76, 40], boneco_neve: [50, 4], yeti: [50, 13], espirito_gelo: [50, 10],
    zumbi: [50, 13], sapo: [49, 36], fantasma: [50, 8], ceifador: [48, 10],
    salamandra: [76, 53], diabrete: [50, 20], cao_infernal: [76, 30], elemental: [50, 6], golem_magma: [50, 10], fenix: [56, 18],
  };
  function crown(r, o, cx, by, s = 1) {
    const p = [[-12, 0], [-13, -10], [-6, -4], [0, -14], [6, -4], [13, -10], [12, 0]].map(([x, y]) => [cx + x * s, by + y * s]);
    shape(r, o, p, C.OCHRE, C.YELLOW, 2.4, 2.6);
    dot(r, o, cx, by - 4 * s, 2 * s, C.RED);
  }
  // Chefe ("chefe_rato" = Rei Rato): o mesmo monstro, um pouco menor para
  // caber a coroa em cima, com uma coroa amarela na cabeça.
  function boss(kind) {
    const r = S.rng(S.hash(kind.length, kind.charCodeAt(0), kind.charCodeAt(1), 7)), sc = 0.84, ox = 8, oy = 14;
    const o = S.xform(M[kind](r), sc, ox, oy), [hx, hy] = HEAD[kind];
    crown(r, o, hx * sc + ox, hy * sc + oy + 1, 1.1);
    return o;
  }
  // Guardião da passagem ("guarda_0" = Senhor da Guerra Orc): o monstro de
  // elmo cinza com chifres, no lugar da coroa dos chefes de masmorra.
  function helm(r, o, cx, by, s = 1) {
    const cap = [[-13, 0], [-12, -9], [-6, -14], [6, -14], [12, -9], [13, 0]].map(([x, y]) => [cx + x * s, by + y * s]);
    shape(r, o, cap, C.INK, C.GRAY, 2.4, 2.6);
    for (const k of [-1, 1]) {
      const horn = [[cx + 11 * k * s, by - 6 * s], [cx + 22 * k * s, by - 14 * s], [cx + 21 * k * s, by - 26 * s], [cx + 15 * k * s, by - 11 * s]];
      shape(r, o, horn, C.INK, '#f3ecd8', 2.2, 2.4);
    }
    ln(r, o, cx - 12 * s, by - 2 * s, cx + 12 * s, by - 2 * s, C.INK, 2.2);
  }
  function guardian(pg) {
    const kind = World.GUARDIOES[pg][0], r = S.rng(S.hash(pg, 17, 5)), sc = 0.84, ox = 8, oy = 14;
    const o = S.xform(M[kind](r), sc, ox, oy), [hx, hy] = HEAD[kind];
    helm(r, o, hx * sc + ox, hy * sc + oy + 2, 1.05);
    return o;
  }
  // Monstro lendário ("lenda_2" = Pé-Grande): o monstro de tamanho normal, com
  // uma aura dourada tracejada em volta e uma estrela em cima da cabeça.
  function legend(pg) {
    const kind = World.LENDAS[pg][0], r = S.rng(S.hash(pg, 23, 9)), sc = 0.84, ox = 8, oy = 14;
    const o = [];
    for (let k = 0; k < 14; k++) {
      const a0 = k / 14 * Math.PI * 2, a1 = a0 + 0.24;
      o.push(S.line(r, 50 + Math.cos(a0) * 46, 56 + Math.sin(a0) * 42, 50 + Math.cos(a1) * 46, 56 + Math.sin(a1) * 42, { color: C.YELLOW, w: 3.4, kind: 'pen' }));
    }
    for (const s of S.xform(M[kind](r), sc, ox, oy)) o.push(s);
    const [hx, hy] = HEAD[kind], cx = hx * sc + ox, by = hy * sc + oy - 2, p = [];
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 4 : 10; p.push([cx + Math.cos(a) * rr, by - 6 + Math.sin(a) * rr]); }
    shape(r, o, p, C.OCHRE, C.YELLOW, 2.2, 2.4);
    return o;
  }
  // Guerreiro da fogueira (os duelos): boneco-palito de capa azul, elmo,
  // espada e escudo redondo, virado para o herói.
  M.guerreiro = r => {
    const o = [];
    shape(r, o, [[53, 32], [68, 70], [36, 70], [46, 32]], C.BLUE, C.BLUE, 3.2, 3.2);
    ov(r, o, 50, 21, 10, 10, C.INK, 3.4);
    fillE(r, o, 50, 21, 10, 10, C.SKIN, 3, 0.8, 0.6);
    shape(r, o, [[39, 19], [42, 9], [50, 6], [58, 9], [61, 19]], C.INK, C.GRAY, 2.6, 2.8);
    ln(r, o, 50, 31, 50, 60, C.INK, 3.6);
    ln(r, o, 50, 40, 64, 54, C.INK, 3.2);
    ln(r, o, 50, 40, 34, 48, C.INK, 3.2);
    ln(r, o, 34, 48, 18, 22, C.GRAY, 3.8); ln(r, o, 40, 42, 28, 52, C.BROWN, 3.4);
    blob(r, o, 68, 56, 12, 13, C.INK, C.OCHRE, 2.8, 3);
    dot(r, o, 68, 56, 2.6, C.INK);
    ln(r, o, 50, 60, 38, 86, C.INK, 3.6); ln(r, o, 50, 60, 62, 86, C.INK, 3.6);
    return o;
  };
  const monsterCache = {};
  A.monster = kind => monsterCache[kind] || (monsterCache[kind] = kind.startsWith('chefe_') ? boss(kind.slice(6))
    : kind.startsWith('guarda_') ? guardian(+kind.slice(7))
    : kind.startsWith('lenda_') ? legend(+kind.slice(6))
    : kind.startsWith('duelo_') ? M.guerreiro(S.rng(S.hash(+kind.slice(6), 29)))
    : M[kind](S.rng(S.hash(kind.length, kind.charCodeAt(0), kind.charCodeAt(1)))));
  A.monsterFresh = (kind, seed) => M[kind](S.rng(seed));

  // ---------- herói, gente e lugares ----------
  // Herói boneco-palito de capa vermelha (2 poses de andar). Traço grosso porque
  // no mapa ele é desenhado a menos da metade do tamanho.
  A.hero = frame => {
    const r = S.rng(1234 + frame), o = [];
    shape(r, o, [[47, 32], [32, 70], [64, 70], [54, 32]], C.RED, C.RED, 3.4, 3.2);
    ov(r, o, 50, 21, 10, 10, C.INK, 4);
    fillE(r, o, 50, 21, 10, 10, C.SKIN, 3, 0.8, 0.6);
    pl(r, o, [[40, 17], [46, 9], [54, 9], [61, 16]], false, C.BROWN, 4);
    ln(r, o, 50, 31, 50, 60, C.INK, 4.4);
    ln(r, o, 50, 40, 36, 54, C.INK, 4);
    ln(r, o, 50, 40, 66, 48, C.INK, 4);
    ln(r, o, 66, 48, 82, 22, C.GRAY, 4.4); ln(r, o, 60, 42, 72, 52, C.BROWN, 4);
    if (frame) { ln(r, o, 50, 60, 42, 86, C.INK, 4.4); ln(r, o, 50, 60, 58, 86, C.INK, 4.4); }
    else { ln(r, o, 50, 60, 36, 84, C.INK, 4.4); ln(r, o, 50, 60, 64, 84, C.INK, 4.4); }
    return o;
  };

  // Personagem do caminho. Quem dá dica tem "?" azul no balão; quem dá missão
  // tem "!" vermelho num balão pintado de amarelo, para chamar atenção.
  A.npc = (r, color, quest) => {
    const o = [];
    ov(r, o, 50, 34, 9, 9, C.INK, 3);
    shape(r, o, [[38, 28], [50, 12], [62, 28]], C.INK, color, 2.6);
    ln(r, o, 50, 43, 50, 70, C.INK, 3.4);
    ln(r, o, 50, 50, 36, 62, C.INK, 3); ln(r, o, 50, 50, 64, 62, C.INK, 3);
    ln(r, o, 50, 70, 40, 92, C.INK, 3.4); ln(r, o, 50, 70, 60, 92, C.INK, 3.4);
    const bal = [[66, 6], [92, 6], [92, 26], [78, 26], [72, 34], [72, 26], [66, 26]];
    if (quest) shape(r, o, bal, C.INK, C.YELLOW, 2.2, 3);
    else pl(r, o, bal, true, C.INK, 2.2);
    o.push(S.text(quest ? '!' : '?', 79, 23, 18, quest ? C.RED : C.BLUE, { font: S.HAND }));
    return o;
  };

  // Fogueira de acampamento: dois troncos cruzados e a chama em cima.
  // (cx, by) = meio da base; s = tamanho (1 = 24 de largura).
  function campfire(r, o, cx, by, s = 1) {
    const P = (x, y) => [cx + x * s, by + y * s];
    ln(r, o, ...P(-12, 0), ...P(10, -6), C.BROWN, 3.4 * s); ln(r, o, ...P(12, 0), ...P(-10, -6), C.BROWN, 3.4 * s);
    shape(r, o, [P(0, -26), P(8, -14), P(7, -5), P(0, -3), P(-7, -5), P(-8, -14), P(-3, -11)], C.RED, C.ORANGE, 2.2 * s, 2.6);
    fill(r, o, [P(0, -15), P(4, -8), P(0, -5), P(-4, -8)], C.YELLOW, 2, 0.3, 0.95);
  }
  A.campfire = campfire;

  // ---------- ícones (HUD, loja, mochila) ----------
  const I = {};
  I.heart = (r, c) => {
    const pts = [];
    for (let k = 0; k < 24; k++) {
      const t = k / 24 * Math.PI * 2;
      pts.push([50 + 16 * Math.pow(Math.sin(t), 3) * 2.5, 48 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 2.5]);
    }
    const o = []; shape(r, o, pts, C.INK, c || C.RED, 4, 4); return o;
  };
  I.star = (r, c) => {
    const pts = [];
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 18 : 42; pts.push([50 + Math.cos(a) * rr, 54 + Math.sin(a) * rr]); }
    const o = []; shape(r, o, pts, C.INK, c || C.BLUE, 4, 4); return o;
  };
  I.coin = (r) => {
    const o = []; blob(r, o, 50, 50, 36, 36, C.INK, C.YELLOW, 4, 4); ov(r, o, 50, 50, 22, 22, C.OCHRE, 3);
    ln(r, o, 50, 38, 50, 62, C.OCHRE, 4); return o;
  };
  I.sword = (r, c) => {
    const o = [];
    shape(r, o, [[44, 74], [44, 22], [50, 8], [56, 22], [56, 74]], C.INK, c || C.GRAY, 3.4, 3.4, 0.3);
    ln(r, o, 28, 76, 72, 76, C.BROWN, 7); ln(r, o, 50, 78, 50, 94, C.BROWN, 8); return o;
  };
  I.axe = (r, c) => {
    const o = [];
    ln(r, o, 34, 94, 60, 12, C.BROWN, 7);
    shape(r, o, [[56, 22], [80, 10], [92, 36], [80, 58], [62, 42]], C.INK, c || C.GRAY, 3.4); return o;
  };
  I.shield = (r, c) => {
    const o = [], p = [[18, 16], [82, 16], [80, 52], [50, 90], [20, 52]];
    shape(r, o, p, C.INK, c || C.BROWN, 4); ln(r, o, 50, 22, 50, 80, C.INK, 3); ln(r, o, 24, 40, 76, 40, C.INK, 3); return o;
  };
  I.armor = (r, c) => {
    const o = [], p = [[30, 16], [42, 10], [58, 10], [70, 16], [88, 32], [76, 44], [70, 36], [70, 90], [30, 90], [30, 36], [24, 44], [12, 32]];
    shape(r, o, p, C.INK, c || C.BROWN, 4); pl(r, o, [[42, 12], [50, 24], [58, 12]], false, C.INK, 3); return o;
  };
  I.potion = (r, c) => {
    const o = [];
    pl(r, o, [[42, 10], [58, 10], [58, 34], [42, 34]], true, C.INK, 3.4);
    ov(r, o, 50, 62, 28, 28, C.INK, 4);
    fill(r, o, [[24, 62], [76, 62], [70, 80], [50, 89], [30, 80]], c || C.RED, 3.4, 0.6, 0.9);
    ln(r, o, 40, 8, 60, 8, C.BROWN, 6); return o;
  };
  I.scroll = (r, c) => {
    const o = [];
    shape(r, o, [[24, 22], [76, 22], [76, 78], [24, 78]], C.INK, '#efdcae', 3.4, 4);
    ov(r, o, 50, 20, 30, 7, C.INK, 3.4); ov(r, o, 50, 80, 30, 7, C.INK, 3.4);
    for (const y of [36, 48, 60]) pl(r, o, [[32, y], [42, y - 4], [52, y + 2], [68, y - 2]], false, c || C.PURPLE, 4);
    return o;
  };
  I.bag = (r) => {
    const o = [], p = [[30, 34], [70, 34], [86, 72], [76, 92], [24, 92], [14, 72]];
    shape(r, o, p, C.INK, C.BROWN, 4); ov(r, o, 50, 30, 16, 8, C.INK, 4); return o;
  };
  I.map = (r) => {
    const o = [], p = [[10, 22], [36, 12], [64, 22], [90, 12], [90, 80], [64, 90], [36, 80], [10, 90]];
    shape(r, o, p, C.INK, '#efdcae', 4, 5); ln(r, o, 36, 14, 36, 78, C.INK, 2.4); ln(r, o, 64, 24, 64, 88, C.INK, 2.4);
    pl(r, o, [[20, 70], [30, 52], [46, 58], [56, 40], [74, 44], [80, 28]], false, C.RED, 3.4); return o;
  };
  I.chest = (r) => {
    const o = [];
    shape(r, o, [[14, 44], [86, 44], [86, 86], [14, 86]], C.INK, C.BROWN, 4);
    shape(r, o, [[14, 44], [20, 22], [80, 22], [86, 44]], C.INK, C.OCHRE, 4);
    blob(r, o, 50, 52, 7, 8, C.INK, C.YELLOW, 3, 2.5); return o;
  };
  I.die = (r, c) => {
    const o = []; shape(r, o, [[20, 20], [80, 20], [80, 80], [20, 80]], C.INK, c || C.RED, 4, 5);
    for (const [x, y] of [[35, 35], [50, 50], [65, 65]]) dot(r, o, x, y, 5, C.INK); return o;
  };
  I.fire = (r) => { const o = []; campfire(r, o, 50, 90, 3.2); return o; };
  I.sun = (r) => {
    const o = [];
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ln(r, o, 50 + Math.cos(a) * 30, 50 + Math.sin(a) * 30, 50 + Math.cos(a) * 44, 50 + Math.sin(a) * 44, C.ORANGE, 4); }
    blob(r, o, 50, 50, 22, 22, C.ORANGE, C.YELLOW, 4, 4); return o;
  };
  I.moon = (r) => {
    const o = [], p = [];
    for (let k = 0; k <= 12; k++) { const a = -2.2 + k / 12 * 4.4; p.push([50 + Math.cos(a) * 38, 50 + Math.sin(a) * 38]); }
    for (let k = 12; k >= 0; k--) { const a = -1.75 + k / 12 * 3.5; p.push([64 + Math.cos(a) * 26, 50 + Math.sin(a) * 30]); }
    shape(r, o, p.map(([x, y]) => [100 - x, y]), C.INK, C.LBLUE, 4, 4); return o;
  };
  I.torch = (r, lit) => {
    const o = [];
    shape(r, o, [[44, 46], [56, 46], [53, 94], [47, 94]], C.INK, C.BROWN, 3.4, 3.4);
    ln(r, o, 42, 48, 58, 48, C.INK, 5);
    if (lit !== 'off') {
      shape(r, o, [[50, 6], [64, 26], [62, 40], [50, 44], [38, 40], [36, 26], [44, 30]], C.RED, C.ORANGE, 3.4, 3);
      fill(r, o, [[50, 22], [57, 34], [50, 40], [43, 34]], C.YELLOW, 2.4, 0.3, 0.95);
    }
    return o;
  };
  I.sound = (r, on) => {
    const o = []; shape(r, o, [[14, 38], [32, 38], [54, 18], [54, 82], [32, 62], [14, 62]], C.INK, C.GRAY, 4);
    if (on) { pl(r, o, [[66, 34], [74, 50], [66, 66]], false, C.INK, 4); pl(r, o, [[78, 22], [90, 50], [78, 78]], false, C.INK, 4); }
    else { ln(r, o, 64, 34, 90, 66, C.RED, 5); ln(r, o, 90, 34, 64, 66, C.RED, 5); }
    return o;
  };

  const iconCache = {};
  A.icon = (name, color) => I[name](S.rng(S.hash(name.length, name.charCodeAt(0), (color || '').length)), color);
  // Ícone como <img>: desenha num canvas pequeno uma vez e guarda a URL.
  A.iconURL = (name, color, px = 64) => {
    const key = name + '|' + color + '|' + px;
    if (iconCache[key]) return iconCache[key];
    const cv = document.createElement('canvas');
    cv.width = cv.height = px;
    const ctx = cv.getContext('2d');
    ctx.scale(px / 100, px / 100);
    S.drawAll(ctx, A.icon(name, color), 1);
    return (iconCache[key] = cv.toDataURL());
  };
  A.monsterURL = (kind, px = 96) => {
    const key = 'm|' + kind + '|' + px;
    if (iconCache[key]) return iconCache[key];
    const cv = document.createElement('canvas');
    cv.width = cv.height = px;
    const ctx = cv.getContext('2d');
    ctx.scale(px / 100, px / 100);
    S.drawAll(ctx, A.monster(kind), 1);
    return (iconCache[key] = cv.toDataURL());
  };

  // ---------- dados ----------
  // Cada tipo de dado tem a sua silhueta, como se desenha no caderno:
  // d4 triângulo, d6 quadrado, d8 losango, d10 pipa, d12 pentágono, d20 hexágono.
  const DIE_SHAPES = {
    2: [[18, 50], [50, 18], [82, 50], [50, 82]],
    4: [[50, 10], [92, 84], [8, 84]],
    6: [[14, 14], [86, 14], [86, 86], [14, 86]],
    8: [[50, 4], [90, 50], [50, 96], [10, 50]],
    10: [[50, 4], [92, 44], [50, 96], [8, 44]],
    12: [[50, 6], [94, 38], [77, 92], [23, 92], [6, 38]],
    20: [[50, 4], [90, 27], [90, 73], [50, 96], [10, 73], [10, 27]],
  };
  const dieCache = {};
  A.dieStrokes = (sides, color) => {
    const key = sides + color;
    if (dieCache[key]) return dieCache[key];
    const r = S.rng(sides * 31 + color.length), o = [], p = DIE_SHAPES[sides] || DIE_SHAPES[6];
    pl(r, o, p, true, C.INK, 4);
    fill(r, o, p, color, 6, 0.8, 0.45);
    if (sides === 20) pl(r, o, [[50, 24], [76, 66], [24, 66]], true, C.INK, 1.6);
    return (dieCache[key] = o);
  };
  // Dado na bandeja: forma em traço + número escrito à mão no meio.
  A.drawDie = (ctx, sides, value, x, y, size, color, rot = 0, dim = false) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha = 1;
    ctx.save(); ctx.scale(size / 100, size / 100); ctx.translate(-50, -50);
    S.drawAll(ctx, A.dieStrokes(sides, color), 1);
    ctx.restore();
    ctx.fillStyle = dim ? C.GRAY : C.INK;
    ctx.font = `${Math.round(size * (sides === 4 ? 0.36 : 0.44))}px ${S.HAND}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(value), 0, sides === 4 ? size * 0.12 : size * 0.02);
    ctx.restore();
  };

  // ---------- mapa ----------
  // Um quadrado do mapa (64×64 no mundo), já na posição do mundo. Inclui o que
  // está em cima dele (fogueira, monstro, baú...) e o "X" se já foi resolvido.
  A.tile = (world, tx, ty, T, state) => {
    const r = S.rng(S.hash(world.seed, tx, ty, 77)), o = [];
    const x0 = tx * T, y0 = ty * T, Wd = World;
    const ter = (x, y) => (x < 0 || y < 0 || x >= world.W || y >= world.H) ? world.fora : world.t[y * world.W + x];
    const t = ter(tx, ty);
    const rx = (a, b) => a + r() * (b - a);

    // Bioma da página (masmorras não têm: só parede e chão).
    const bio = world.biome || 'campos';
    const pencil = (color, w = 1.8, alpha = 0.9) => ({ color, w, kind: 'pencil', alpha, j: 0.6 });
    if (t === Wd.AGUA) {
      // Água (azul), água escura do pântano (oliva) ou lava do vulcão (laranja).
      const lava = bio === 'vulcao', dark = bio === 'pantano';
      const lc = lava ? C.ORANGE : dark ? C.OLIVE : C.LBLUE, wc = lava ? C.RED : dark ? C.INK : C.BLUE;
      for (let k = 0; k < 9; k++) {
        const y = y0 + 4 + k * 7 + (r() - 0.5) * 1.5;
        o.push(S.line(r, x0 - 1, y, x0 + T + 1, y + (r() - 0.5) * 2, { color: lc, w: 1.6, kind: 'pencil', alpha: lava ? 0.75 : 0.55, j: 1 }));
      }
      if (r() < 0.35) {
        const wx = rx(x0 + 10, x0 + 40), wy = rx(y0 + 14, y0 + 50);
        pl(r, o, [[wx, wy], [wx + 4, wy - 3], [wx + 8, wy], [wx + 12, wy - 3], [wx + 16, wy]], false, wc, 1.8);
      }
      if (lava && r() < 0.4) dot(r, o, rx(x0 + 12, x0 + T - 12), rx(y0 + 12, y0 + T - 12), 2.6, C.YELLOW);
      if (bio === 'neve' && r() < 0.3) {
        const fx = rx(x0 + 12, x0 + T - 24), fy = rx(y0 + 14, y0 + T - 16);
        pl(r, o, [[fx, fy], [fx + 10, fy - 4], [fx + 16, fy + 2], [fx + 8, fy + 7]], true, C.BLUE, 1.8);
      }
    } else {
      // Costa: caneta nas bordas que dão para a água (ou lava). Os vértices
      // tremem pelo hash do próprio vértice, então as bordas vizinhas se emendam.
      const coast = bio === 'vulcao' ? C.RED : bio === 'pantano' ? C.OLIVE : C.BLUE;
      const vj = (vx, vy) => [vx * T + (S.hash(world.seed, vx, vy, 1) / 4294967296 - 0.5) * 9, vy * T + (S.hash(world.seed, vx, vy, 2) / 4294967296 - 0.5) * 9];
      const edges = [[0, -1, tx, ty, tx + 1, ty], [0, 1, tx, ty + 1, tx + 1, ty + 1], [-1, 0, tx, ty, tx, ty + 1], [1, 0, tx + 1, ty, tx + 1, ty + 1]];
      for (const [dx, dy, ax, ay, bx, by] of edges) {
        if (ter(tx + dx, ty + dy) !== Wd.AGUA) continue;
        o.push(S.poly(r, [vj(ax, ay), vj(bx, by)], false, { color: coast, w: 2.4, j: 4, step: 5 }));
      }
    }

    const obj = world.obj.get(ty * world.W + tx);
    const busy = obj && obj.type !== 'monstro' && obj.type !== 'bau';
    if (t === Wd.AREIA) {
      // Praia e areia (ocre), gelo (rachaduras azuis), lama (marrom) ou cinzas (cinza).
      if (bio === 'neve') {
        for (let k = 0; k < 3; k++) {
          const x = rx(x0 + 8, x0 + T - 20), y = rx(y0 + 8, y0 + T - 8);
          o.push(S.poly(r, [[x, y], [x + 6, y + 3], [x + 10, y - 1], [x + 16, y + 2]], false, pencil(C.LBLUE, 1.6)));
        }
      } else {
        const col = bio === 'pantano' ? C.BROWN : bio === 'vulcao' ? C.GRAY : C.OCHRE;
        for (let k = 0; k < 9; k++) { const x = rx(x0 + 6, x0 + T - 6), y = rx(y0 + 6, y0 + T - 6); ln(r, o, x, y, x + 1.6, y + 0.8, col, 2.2); }
      }
    } else if (t === Wd.CAMPO && !busy) {
      if (bio === 'deserto') {
        // Dunas: um ou dois arcos de lápis ocre.
        const n = r() < 0.7 ? 1 + (r() < 0.4 ? 1 : 0) : 0;
        for (let k = 0; k < n; k++) {
          const x = rx(x0 + 6, x0 + T - 30), y = rx(y0 + 18, y0 + T - 8);
          o.push(S.poly(r, [[x, y], [x + 8, y - 5], [x + 16, y - 6], [x + 24, y - 2]], false, pencil(C.OCHRE, 2)));
        }
      } else if (bio === 'neve') {
        // Neve: o branco do papel, com floquinhos de vez em quando.
        if (r() < 0.45) {
          const x = rx(x0 + 14, x0 + T - 14), y = rx(y0 + 14, y0 + T - 14);
          for (const [a, b] of [[-4, 0], [-2, -3.5], [2, -3.5]]) o.push(S.line(r, x + a, y + b, x - a, y - b, pencil(C.LBLUE, 1.6)));
        }
      } else if (bio === 'vulcao') {
        // Rocha: rachaduras marrons, às vezes com brasa (laranja).
        const x = rx(x0 + 8, x0 + T - 30), y = rx(y0 + 12, y0 + T - 12);
        o.push(S.poly(r, [[x, y], [x + 7, y + 4], [x + 12, y - 2], [x + 20, y + 3]], false, pencil(r() < 0.3 ? C.ORANGE : C.BROWN, 1.8)));
      } else {
        // Capim (verde) nos Campos; terra morta (marrom) no Pântano, com túmulos.
        const grass = bio === 'pantano' ? C.BROWN : C.GREEN;
        const n = r() < 0.55 ? 1 + (r() < 0.4 ? 1 : 0) : 0;
        for (let k = 0; k < n; k++) {
          const x = rx(x0 + 12, x0 + T - 12), y = rx(y0 + 16, y0 + T - 8);
          for (const d of [-5, 0, 5]) o.push(S.line(r, x, y, x + d, y - 7 - (d ? 0 : 2), { color: grass, w: 1.8, kind: 'pencil', alpha: 0.9, j: 0.6 }));
        }
        if (bio === 'pantano' && r() < 0.2) {
          const gx = rx(x0 + 16, x0 + T - 16), gy = rx(y0 + 30, y0 + T - 8);
          shape(r, o, [[gx - 8, gy], [gx - 8, gy - 14], [gx - 4, gy - 19], [gx + 4, gy - 19], [gx + 8, gy - 14], [gx + 8, gy]], C.INK, C.GRAY, 2, 3);
          ln(r, o, gx, gy - 15, gx, gy - 6, C.INK, 1.6); ln(r, o, gx - 3, gy - 12, gx + 3, gy - 12, C.INK, 1.6);
        }
      }
    } else if (t === Wd.MATA) {
      const trees = [];
      const n = obj ? (obj.type === 'masmorra' ? 0 : 1) : 2 + (r() < 0.5 ? 1 : 0);
      for (let k = 0; k < n; k++) trees.push([rx(x0 + 14, x0 + T - 14), rx(y0 + 12, y0 + T - 20), rx(9, 12)]);
      trees.sort((a, b) => a[1] - b[1]);
      for (const [cx, cy, rr] of trees) {
        if (bio === 'deserto') {
          // Cacto com dois bracinhos.
          const body = [[cx - 4, cy + rr + 8], [cx - 4, cy - rr + 2], [cx, cy - rr - 2], [cx + 4, cy - rr + 2], [cx + 4, cy + rr + 8]];
          shape(r, o, body, C.GREEN, C.LGREEN, 2, 2.6);
          pl(r, o, [[cx - 4, cy + 2], [cx - 9, cy + 2], [cx - 9, cy - 6]], false, C.GREEN, 2);
          pl(r, o, [[cx + 4, cy + 6], [cx + 9, cy + 6], [cx + 9, cy - 2]], false, C.GREEN, 2);
        } else if (bio === 'neve') {
          // Pinheiro com a ponta nevada.
          const tri = [[cx - rr, cy + rr], [cx, cy - rr - 4], [cx + rr, cy + rr]];
          ln(r, o, cx, cy + rr - 2, cx, cy + rr + 8, C.BROWN, 2.4);
          shape(r, o, tri, C.GREEN, C.GREEN, 2.2, 3.4);
          pl(r, o, [[cx - rr * 0.45, cy - rr * 0.1], [cx, cy - rr - 4], [cx + rr * 0.45, cy - rr * 0.1]], false, C.LBLUE, 2.6);
        } else if (bio === 'pantano' || bio === 'vulcao') {
          // Árvore morta (marrom, com musgo) ou queimada (preta, com brasa).
          const wood = bio === 'pantano' ? C.BROWN : C.INK;
          ln(r, o, cx, cy + rr + 8, cx, cy - rr + 2, wood, 3);
          pl(r, o, [[cx, cy], [cx - 8, cy - 6], [cx - 11, cy - 12]], false, wood, 2.2);
          pl(r, o, [[cx, cy - 4], [cx + 8, cy - 9], [cx + 10, cy - 15]], false, wood, 2.2);
          if (bio === 'pantano') ln(r, o, cx - 8, cy - 6, cx - 8, cy + 2, C.OLIVE, 1.8);
          else if (r() < 0.5) dot(r, o, cx + 9, cy - 13, 1.8, C.ORANGE);
        } else {
          ln(r, o, cx, cy + rr - 2, cx + (r() - 0.5) * 2, cy + rr + 8, C.BROWN, 2.4);
          ov(r, o, cx, cy, rr, rr * 0.92, C.GREEN, 2.2);
          fillE(r, o, cx, cy, rr, rr * 0.92, C.LGREEN, 3.4, 0.9, 0.7);
        }
      }
    } else if (t === Wd.PANTANO) {
      if (bio === 'deserto') {
        // Areia movediça: um redemoinho.
        const cx = x0 + T / 2 + (r() - 0.5) * 10, cy = y0 + T / 2 + (r() - 0.5) * 10, sp = [];
        for (let k = 0; k <= 16; k++) { const a = k * 0.75, rr = 2 + k * 1.2; sp.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7]); }
        o.push(S.poly(r, sp, false, pencil(C.BROWN, 1.8)));
      } else if (bio === 'neve') {
        // Neve funda: montes de neve em arco.
        for (let k = 0; k < 3; k++) {
          const x = rx(x0 + 4, x0 + T - 26), y = rx(y0 + 14, y0 + T - 6);
          o.push(S.poly(r, [[x, y], [x + 6, y - 6], [x + 14, y - 7], [x + 22, y - 1]], false, pencil(C.LBLUE, 2.2)));
        }
      } else if (bio === 'vulcao') {
        // Fumarola: fumaça cinza saindo de uma rachadura em brasa.
        const x = rx(x0 + 18, x0 + T - 18), y = rx(y0 + T - 18, y0 + T - 8);
        ln(r, o, x - 8, y, x + 8, y + 1, C.ORANGE, 2.2);
        o.push(S.poly(r, [[x, y - 2], [x - 5, y - 10], [x + 3, y - 18], [x - 4, y - 26], [x + 2, y - 34]], false, pencil(C.GRAY, 2.2, 0.8)));
      } else {
        // Pântano dos Campos e brejo do Pântano Sombrio (este com bolhas).
        for (let k = 0; k < 5; k++) {
          const x = rx(x0 + 6, x0 + T - 22), y = rx(y0 + 10, y0 + T - 6);
          o.push(S.line(r, x, y, x + rx(10, 18), y + (r() - 0.5) * 2, { color: C.OLIVE, w: k < 2 ? 2.2 : 1.6, kind: k < 2 ? 'pen' : 'pencil', alpha: 0.8 }));
        }
        if (!busy) for (let k = 0; k < 2; k++) {
          const x = rx(x0 + 12, x0 + T - 12), y = rx(y0 + 26, y0 + T - 8);
          ln(r, o, x, y, x + 1, y - 16, C.OLIVE, 1.8);
          ov(r, o, x + 1, y - 18, 2, 4.5, C.BROWN, 2.2);
        }
        if (bio === 'pantano') for (let k = 0; k < 2; k++) ov(r, o, rx(x0 + 10, x0 + T - 10), rx(y0 + 10, y0 + T - 10), 2.6, 2.4, C.PURPLE, 1.6);
      }
    } else if (t === Wd.PAREDE) {
      // Parede de masmorra: só a que encosta no chão é desenhada (pedra
      // maciça fica em branco), pintada de cinza com a borda em caneta.
      const floor = (x, y) => ter(x, y) === Wd.CHAO;
      let touch = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (floor(tx + dx, ty + dy)) touch = true;
      if (!touch) return o;
      fill(r, o, [[x0, y0], [x0 + T, y0], [x0 + T, y0 + T], [x0, y0 + T]], C.GRAY, 5, 0.8, 0.5);
      for (const [dx, dy, ax, ay, bx, by] of [[0, -1, 0, 0, 1, 0], [0, 1, 0, 1, 1, 1], [-1, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1]])
        if (floor(tx + dx, ty + dy)) ln(r, o, x0 + ax * T, y0 + ay * T, x0 + bx * T, y0 + by * T, C.INK, 2.8);
    } else if (t === Wd.CHAO) {
      for (let k = 0; k < 3; k++) { const x = rx(x0 + 8, x0 + T - 8), y = rx(y0 + 8, y0 + T - 8); ln(r, o, x, y, x + 1.4, y + 0.6, C.GRAY, 1.8); }
    } else if (t === Wd.MONTANHA) {
      // Cor do contorno, da sombra e do "chapéu" de cada bioma.
      const [edge, shade, cap] = {
        deserto: [C.BROWN, C.ORANGE, C.OCHRE], neve: [C.BLUE, C.LBLUE, C.BLUE],
        pantano: [C.INK, C.PURPLE, C.INK], vulcao: [C.BROWN, C.INK, C.RED],
      }[bio] || [C.BROWN, C.GRAY, C.INK];
      const n = r() < 0.5 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const cx = n === 1 ? x0 + T / 2 + (r() - 0.5) * 8 : x0 + 18 + k * 28, by = y0 + T - 8 - k * 4;
        const hw = n === 1 ? rx(24, 28) : rx(16, 19), py = by - rx(34, 46);
        if (bio === 'deserto') {
          // Rochedo de topo chato, com listras.
          const top = py + 10;
          pl(r, o, [[cx - hw, by], [cx - hw * 0.6, top], [cx + hw * 0.6, top], [cx + hw, by]], false, edge, 2.6);
          fill(r, o, [[cx - hw * 0.6, top + 2], [cx + hw * 0.6, top + 2], [cx + hw - 2, by - 1], [cx - hw + 2, by - 1]], shade, 4, -0.9, 0.55);
          ln(r, o, cx - hw * 0.75, top + (by - top) * 0.45, cx + hw * 0.75, top + (by - top) * 0.45, cap, 1.8);
          continue;
        }
        pl(r, o, [[cx - hw, by], [cx, py], [cx + hw, by]], false, edge, 2.6);
        fill(r, o, [[cx, py + 3], [cx + hw - 2, by - 1], [cx + 2, by - 1]], shade, 3.4, -0.9, 0.7);
        pl(r, o, [[cx - hw * 0.28, py + (by - py) * 0.28], [cx - hw * 0.1, py + (by - py) * 0.36], [cx + hw * 0.08, py + (by - py) * 0.26], [cx + hw * 0.28, py + (by - py) * 0.32]], false, cap, bio === 'vulcao' ? 2.4 : 1.8);
        // No vulcão, uma língua de lava descendo da cratera.
        if (bio === 'vulcao') pl(r, o, [[cx, py + 4], [cx - 3, py + (by - py) * 0.5], [cx + 1, by - 6]], false, C.ORANGE, 2.2);
      }
    }

    if (!obj) return o;
    const cx = x0 + T / 2, i = ty * world.W + tx;
    if (obj.type === 'fogueira') {
      // Acampamento: barraca listrada, a fogueira e um guerreiro sentado nela.
      const tents = [C.RED, C.BLUE, C.GREEN, C.PURPLE, C.ORANGE, C.PINK];
      const tent = [[x0 + 4, y0 + 50], [x0 + 18, y0 + 20], [x0 + 32, y0 + 50]];
      shape(r, o, tent, C.INK, tents[obj.n % tents.length], 2.4, 3.4);
      pl(r, o, [[x0 + 14, y0 + 50], [x0 + 18, y0 + 36], [x0 + 22, y0 + 50]], false, C.INK, 2);
      campfire(r, o, x0 + 46, y0 + 54, 0.8);
      ov(r, o, x0 + 56, y0 + 34, 3.5, 3.5, C.INK, 2);
      ln(r, o, x0 + 56, y0 + 38, x0 + 57, y0 + 48, C.INK, 2.2);
      ln(r, o, x0 + 57, y0 + 48, x0 + 50, y0 + 50, C.INK, 2.2);
      ln(r, o, x0 + 56, y0 + 42, x0 + 50, y0 + 44, C.INK, 2);
      ln(r, o, x0 + 60, y0 + 30, x0 + 61, y0 + 50, C.GRAY, 2);
      o.push(S.text(World.FOGUEIRAS[obj.n], cx, y0 - 2, 17, C.INK));
    } else if (obj.type === 'covil') {
      const p = [[x0 + 2, y0 + T - 6], [x0 + 10, y0 + 22], [cx, y0 + 8], [x0 + T - 10, y0 + 22], [x0 + T - 2, y0 + T - 6]];
      shape(r, o, p, C.BROWN, C.GRAY, 2.6, 4.4);
      const hole = [[cx - 14, y0 + T - 6], [cx - 12, y0 + 36], [cx, y0 + 28], [cx + 12, y0 + 36], [cx + 14, y0 + T - 6]];
      pl(r, o, hole, true, C.INK, 2.4); fill(r, o, hole, C.INK, 2, 0.5, 0.9);
      o.push(S.text('Covil do Dragão', cx, y0 - 2, 19, C.RED));
      if (state.won) cross(r, o, x0, y0, T);
    } else if (obj.type === 'passagem' || obj.type === 'volta') {
      // Canto da folha dobrado com uma seta: por aqui o mestre vira a página
      // (para a frente na passagem, para trás na volta).
      const fwd = obj.type === 'passagem', cy = y0 + T / 2 + 6;
      const sheet = [[x0 + 8, y0 + 14], [x0 + T - 22, y0 + 14], [x0 + T - 8, y0 + 28], [x0 + T - 8, y0 + T - 6], [x0 + 8, y0 + T - 6]];
      shape(r, o, sheet, C.INK, '#efdcae', 2.4, 4.4);
      pl(r, o, [[x0 + T - 22, y0 + 14], [x0 + T - 22, y0 + 28], [x0 + T - 8, y0 + 28]], true, C.INK, 2);
      const col = fwd ? C.RED : C.GREEN, a = fwd ? 1 : -1;
      ln(r, o, cx - 14 * a, cy, cx + 14 * a, cy, col, 3.4);
      pl(r, o, [[cx + 6 * a, cy - 8], [cx + 14 * a, cy], [cx + 6 * a, cy + 8]], false, col, 3.4);
      // A volta fica encostada na primeira fogueira, então o nome vai embaixo
      // para não cobrir o nome do acampamento.
      const nome = World.BIOMAS[obj.to].nome;
      o.push(S.text(fwd ? nome + ' →' : '← ' + nome, cx, fwd ? y0 + 4 : y0 + T + 12, 16, col));
      // Enquanto o guardião não for vencido, ele fica em pé em cima do canto.
      if (fwd && !state.guarda) {
        for (const s of S.xform(A.monster('guarda_' + (obj.to - 1)), 0.62, x0 + 1, y0 + 4)) o.push(s);
        o.push(S.text(World.GUARDIOES[obj.to - 1][1], cx, y0 + T + 12, 15, C.RED));
      }
    } else if (obj.type === 'monstro' && obj.noite && !state.noite) {
      // Monstro da noite (Pântano Sombrio): de dia o mestre não desenha nada.
    } else if (obj.type === 'miragem') {
      // Miragem (Deserto): igual a um baú ou um monstro de verdade, até sumir.
      if (!state.dead.has(i)) {
        if (obj.look === 'bau') for (const s of S.xform(A.icon('chest'), 0.38, x0 + 13, y0 + 16)) o.push(s);
        else for (const s of S.xform(A.monster(obj.kind), 0.5, x0 + 7, y0 + 8)) o.push(s);
      }
    } else if (obj.type === 'porta') {
      // Porta trancada: tábuas marrons com um cadeado amarelo; aberta, some.
      if (!state.opened.has('chave')) {
        shape(r, o, [[x0 + 8, y0 + 8], [x0 + T - 8, y0 + 8], [x0 + T - 8, y0 + T - 6], [x0 + 8, y0 + T - 6]], C.INK, C.BROWN, 2.6, 4);
        for (const y of [24, 40]) ln(r, o, x0 + 10, y0 + y, x0 + T - 10, y0 + y, C.INK, 1.8);
        ov(r, o, cx, y0 + 30, 6, 7, C.INK, 2.2);
        blob(r, o, cx, y0 + 38, 9, 7, C.INK, C.YELLOW, 2.2, 2.4);
      }
    } else if (obj.type === 'chave') {
      if (!state.opened.has('chave')) {
        blob(r, o, cx - 12, y0 + 32, 8, 8, C.INK, C.YELLOW, 2.6, 2.4);
        ln(r, o, cx - 4, y0 + 32, cx + 18, y0 + 32, C.OCHRE, 3.6);
        ln(r, o, cx + 12, y0 + 32, cx + 12, y0 + 40, C.OCHRE, 3.2); ln(r, o, cx + 18, y0 + 32, cx + 18, y0 + 40, C.OCHRE, 3.2);
        o.push(S.text('Chave', cx, y0 + 4, 16, C.OCHRE));
      }
    } else if (obj.type === 'armadilha') {
      // Escondida: só aparece (espetos de caneta) depois que alguém pisa.
      if (state.opened.has(i)) for (let k = 0; k < 4; k++) {
        const x = x0 + 14 + k * 12;
        shape(r, o, [[x - 5, y0 + T - 14], [x, y0 + 24], [x + 5, y0 + T - 14]], C.INK, C.GRAY, 2, 2.4);
      }
    } else if (obj.type === 'enigma') {
      // Cara de pedra na parede, com a boca aberta; resolvida, ganha um X.
      shape(r, o, [[x0 + 12, y0 + T - 6], [x0 + 10, y0 + 18], [cx, y0 + 8], [x0 + T - 10, y0 + 18], [x0 + T - 12, y0 + T - 6]], C.INK, C.GRAY, 2.6, 4);
      eyes(r, o, cx - 9, cx + 9, y0 + 28, 3.4);
      ov(r, o, cx, y0 + 44, 8, 6, C.INK, 2.4);
      o.push(S.text('?', cx + 20, y0 + 12, 22, C.PURPLE, { font: S.HAND }));
      if (state.opened.has(i)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'descer') {
      // Escada para baixo: degraus pintados de escuro, cada vez mais fundos.
      for (let k = 0; k < 4; k++) {
        const w = 10 + k * 4, y = y0 + 22 + k * 9;
        shape(r, o, [[cx - w, y], [cx + w, y], [cx + w, y + 8], [cx - w, y + 8]], C.INK, C.INK, 2.2, 3);
      }
      o.push(S.text('Andar de baixo', cx, y0 + 4, 15, C.RED));
    } else if (obj.type === 'subir') {
      for (let k = 0; k < 4; k++) {
        const w = 22 - k * 4, y = y0 + T - 10 - k * 9;
        shape(r, o, [[cx - w, y], [cx + w, y], [cx + w, y - 8], [cx - w, y - 8]], C.INK, C.OCHRE, 2.2, 3);
      }
      o.push(S.text('Subir', cx, y0 + 2, 17, C.GREEN));
    } else if (obj.type === 'monstro') {
      for (const s of S.xform(A.monster(obj.kind), 0.5, x0 + 7, y0 + 8)) o.push(s);
      // Grupo: o mestre escreve quantos são em cima do monstro.
      if (obj.n > 1) o.push(S.text('×' + obj.n, x0 + T - 10, y0 + 12, 22, C.RED));
      if (state.dead.has(i)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'bau') {
      for (const s of S.xform(A.icon('chest'), 0.38, x0 + 13, y0 + 16)) o.push(s);
      if (state.opened.has(i)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'npc') {
      const cols = [C.BLUE, C.GREEN, C.PURPLE, C.ORANGE, C.PINK];
      for (const s of S.xform(A.npc(r, cols[(obj.quest ? obj.tier : obj.fala) % cols.length], obj.quest), 0.56, x0 + 4, y0 + 6)) o.push(s);
      if (obj.quest) o.push(S.text(obj.nome, cx, y0 - 2, 16, C.INK));
    } else if (obj.type === 'masmorra') {
      // Entrada: arco de pedra cinza, porta escura e uma coroa em cima.
      const arch = (w, top) => [[cx - w, y0 + T - 6], [cx - w, y0 + top + 10], [cx - w * 0.6, y0 + top + 2], [cx, y0 + top], [cx + w * 0.6, y0 + top + 2], [cx + w, y0 + top + 10], [cx + w, y0 + T - 6]];
      shape(r, o, arch(22, 16), C.INK, C.GRAY, 2.6, 4);
      const door = arch(12, 28);
      pl(r, o, door, true, C.INK, 2.4); fill(r, o, door, C.INK, 2, 0.5, 0.9);
      crown(r, o, cx, y0 + 13, 0.8);
      o.push(S.text(World.MASMORRAS[obj.kind][0], cx, y0 - 2, 17, C.INK));
      if (state.cleared && state.cleared.has(obj.n)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'saida') {
      // Escada para cima: degraus cada vez mais estreitos.
      for (let k = 0; k < 4; k++) {
        const w = 22 - k * 4, y = y0 + T - 10 - k * 9;
        shape(r, o, [[cx - w, y], [cx + w, y], [cx + w, y - 8], [cx - w, y - 8]], C.INK, C.OCHRE, 2.2, 3);
      }
      o.push(S.text('Saída', cx, y0 + 2, 17, C.GREEN));
    } else if (obj.type === 'atalho') {
      // A segunda escada, que sai atrás do guardião: degraus de pedra cinza.
      for (let k = 0; k < 4; k++) {
        const w = 22 - k * 4, y = y0 + T - 10 - k * 9;
        shape(r, o, [[cx - w, y], [cx + w, y], [cx + w, y - 8], [cx - w, y - 8]], C.INK, C.GRAY, 2.2, 3);
      }
      o.push(S.text('Escada escondida', cx, y0 + 2, 15, C.PURPLE));
    } else if (obj.type === 'chefe') {
      for (const s of S.xform(A.monster('chefe_' + obj.kind), 0.6, x0 + 2, y0 + 2)) o.push(s);
      o.push(S.text(World.MASMORRAS[obj.kind][1], cx, y0 - 2, 17, C.RED));
      if (state.dead.has(i)) cross(r, o, x0, y0, T);
    }
    return o;
  };

  // O "X" de caneta vermelha que o mestre faz em cima do que já foi resolvido.
  function cross(r, o, x0, y0, T) {
    ln(r, o, x0 + 12, y0 + 12, x0 + T - 12, y0 + T - 12, C.RED, 3);
    ln(r, o, x0 + T - 12, y0 + 12, x0 + 12, y0 + T - 12, C.RED, 3);
  }
  A.cross = (tx, ty, T, seed) => { const o = []; cross(S.rng(seed), o, tx * T, ty * T, T); return o; };

  // Rastro de lápis entre o centro de dois quadrados (o caminho que você fez).
  A.trail = (ax, ay, bx, by, T, seed) => {
    const r = S.rng(seed), o = [];
    const x1 = ax * T + T / 2, y1 = ay * T + T / 2 + 8, x2 = bx * T + T / 2, y2 = by * T + T / 2 + 8;
    for (let k = 0; k < 4; k++) {
      const t1 = k / 4 + 0.04, t2 = t1 + 0.13;
      o.push(S.line(r, x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1, x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2, { color: C.GRAY, w: 2, kind: 'pencil', alpha: 0.8, j: 0.6 }));
    }
    return o;
  };

  // Golpe na luta: risco rápido em cima do monstro.
  A.slash = (seed, color) => {
    const r = S.rng(seed), o = [];
    for (let k = 0; k < 3; k++) {
      const y = 25 + k * 16 + r() * 8;
      o.push(S.line(r, 12 + r() * 10, y, 88 - r() * 10, y + 22 + r() * 10, { color, w: 4, kind: 'pen', j: 3 }));
    }
    return o;
  };

  window.Art = A;
})();
