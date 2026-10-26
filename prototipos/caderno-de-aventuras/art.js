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
  M.lobo = r => {
    const o = [];
    pl(r, o, [[20, 58], [8, 50], [4, 38], [14, 46], [22, 52]], true, C.INK, 2.4);
    blob(r, o, 46, 62, 28, 15, C.INK, C.GRAY);
    shape(r, o, [[66, 40], [90, 54], [96, 58], [88, 64], [70, 64], [64, 52]], C.INK, C.GRAY);
    shape(r, o, [[68, 42], [70, 26], [78, 40]], C.INK, C.GRAY, 2.2);
    dot(r, o, 78, 50, 2.4, C.RED);
    dot(r, o, 95, 58, 2, C.INK);
    for (const x of [28, 38, 56, 64]) ln(r, o, x, 72, x + (x > 50 ? 2 : -2), 94, C.INK, 3);
    return o;
  };
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
  M.golem = r => {
    const o = [];
    shape(r, o, [[24, 36], [76, 36], [78, 76], [22, 76]], C.INK, C.GRAY, 2.8, 3.4);
    shape(r, o, [[36, 10], [64, 10], [64, 34], [36, 34]], C.INK, C.GRAY, 2.8, 3.4);
    eyes(r, o, 44, 56, 22, 3, C.ORANGE);
    shape(r, o, [[6, 38], [22, 38], [22, 72], [6, 72]], C.INK, C.GRAY, 2.6, 3.4);
    shape(r, o, [[78, 38], [94, 38], [94, 72], [78, 72]], C.INK, C.GRAY, 2.6, 3.4);
    shape(r, o, [[28, 76], [44, 76], [44, 98], [28, 98]], C.INK, C.GRAY, 2.6, 3.4);
    shape(r, o, [[56, 76], [72, 76], [72, 98], [56, 98]], C.INK, C.GRAY, 2.6, 3.4);
    pl(r, o, [[40, 42], [48, 54], [44, 62], [52, 70]], false, C.INK, 1.8);
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

  const monsterCache = {};
  A.monster = kind => monsterCache[kind] || (monsterCache[kind] = M[kind](S.rng(S.hash(kind.length, kind.charCodeAt(0), kind.charCodeAt(1)))));
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

  A.npc = (r, color) => {
    const o = [];
    ov(r, o, 50, 34, 9, 9, C.INK, 3);
    shape(r, o, [[38, 28], [50, 12], [62, 28]], C.INK, color, 2.6);
    ln(r, o, 50, 43, 50, 70, C.INK, 3.4);
    ln(r, o, 50, 50, 36, 62, C.INK, 3); ln(r, o, 50, 50, 64, 62, C.INK, 3);
    ln(r, o, 50, 70, 40, 92, C.INK, 3.4); ln(r, o, 50, 70, 60, 92, C.INK, 3.4);
    pl(r, o, [[66, 6], [92, 6], [92, 26], [78, 26], [72, 34], [72, 26], [66, 26]], true, C.INK, 2.2);
    o.push(S.text('?', 79, 23, 18, C.BLUE, { font: S.HAND }));
    return o;
  };

  // Uma casinha de criança: parede, telhado triangular pintado e porta.
  function house(r, o, x, y, s, roof) {
    pl(r, o, [[x, y], [x + s, y], [x + s, y - s * 0.8], [x, y - s * 0.8]], true, C.INK, 2.2);
    shape(r, o, [[x - 3, y - s * 0.8], [x + s / 2, y - s * 1.45], [x + s + 3, y - s * 0.8]], C.INK, roof, 2.2, 3);
    pl(r, o, [[x + s * 0.38, y], [x + s * 0.38, y - s * 0.42], [x + s * 0.62, y - s * 0.42], [x + s * 0.62, y]], false, C.BROWN, 1.8);
  }

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
  // está em cima dele (vila, monstro, baú...) e o "X" se já foi resolvido.
  A.tile = (world, tx, ty, T, state) => {
    const r = S.rng(S.hash(world.seed, tx, ty, 77)), o = [];
    const x0 = tx * T, y0 = ty * T, Wd = World;
    const ter = (x, y) => (x < 0 || y < 0 || x >= world.W || y >= world.H) ? Wd.AGUA : world.t[y * world.W + x];
    const t = ter(tx, ty);
    const rx = (a, b) => a + r() * (b - a);

    if (t === Wd.AGUA) {
      for (let k = 0; k < 9; k++) {
        const y = y0 + 4 + k * 7 + (r() - 0.5) * 1.5;
        o.push(S.line(r, x0 - 1, y, x0 + T + 1, y + (r() - 0.5) * 2, { color: C.LBLUE, w: 1.6, kind: 'pencil', alpha: 0.55, j: 1 }));
      }
      if (r() < 0.35) {
        const wx = rx(x0 + 10, x0 + 40), wy = rx(y0 + 14, y0 + 50);
        pl(r, o, [[wx, wy], [wx + 4, wy - 3], [wx + 8, wy], [wx + 12, wy - 3], [wx + 16, wy]], false, C.BLUE, 1.8);
      }
    } else {
      // Costa: caneta azul nas bordas que dão para a água. Os vértices tremem
      // pelo hash do próprio vértice, então as bordas vizinhas se emendam.
      const vj = (vx, vy) => [vx * T + (S.hash(world.seed, vx, vy, 1) / 4294967296 - 0.5) * 9, vy * T + (S.hash(world.seed, vx, vy, 2) / 4294967296 - 0.5) * 9];
      const edges = [[0, -1, tx, ty, tx + 1, ty], [0, 1, tx, ty + 1, tx + 1, ty + 1], [-1, 0, tx, ty, tx, ty + 1], [1, 0, tx + 1, ty, tx + 1, ty + 1]];
      for (const [dx, dy, ax, ay, bx, by] of edges) {
        if (ter(tx + dx, ty + dy) !== Wd.AGUA) continue;
        o.push(S.poly(r, [vj(ax, ay), vj(bx, by)], false, { color: C.BLUE, w: 2.4, j: 4, step: 5 }));
      }
    }

    const obj = world.obj.get(ty * world.W + tx);
    const busy = obj && obj.type !== 'monstro' && obj.type !== 'bau';
    if (t === Wd.AREIA) {
      for (let k = 0; k < 9; k++) { const x = rx(x0 + 6, x0 + T - 6), y = rx(y0 + 6, y0 + T - 6); ln(r, o, x, y, x + 1.6, y + 0.8, C.OCHRE, 2.2); }
    } else if (t === Wd.CAMPO && !busy) {
      const n = r() < 0.55 ? 1 + (r() < 0.4 ? 1 : 0) : 0;
      for (let k = 0; k < n; k++) {
        const x = rx(x0 + 12, x0 + T - 12), y = rx(y0 + 16, y0 + T - 8);
        for (const d of [-5, 0, 5]) o.push(S.line(r, x, y, x + d, y - 7 - (d ? 0 : 2), { color: C.GREEN, w: 1.8, kind: 'pencil', alpha: 0.9, j: 0.6 }));
      }
    } else if (t === Wd.MATA) {
      const trees = [];
      const n = obj ? 1 : 2 + (r() < 0.5 ? 1 : 0);
      for (let k = 0; k < n; k++) trees.push([rx(x0 + 14, x0 + T - 14), rx(y0 + 12, y0 + T - 20), rx(9, 12)]);
      trees.sort((a, b) => a[1] - b[1]);
      for (const [cx, cy, rr] of trees) {
        ln(r, o, cx, cy + rr - 2, cx + (r() - 0.5) * 2, cy + rr + 8, C.BROWN, 2.4);
        ov(r, o, cx, cy, rr, rr * 0.92, C.GREEN, 2.2);
        fillE(r, o, cx, cy, rr, rr * 0.92, C.LGREEN, 3.4, 0.9, 0.7);
      }
    } else if (t === Wd.PANTANO) {
      for (let k = 0; k < 5; k++) {
        const x = rx(x0 + 6, x0 + T - 22), y = rx(y0 + 10, y0 + T - 6);
        o.push(S.line(r, x, y, x + rx(10, 18), y + (r() - 0.5) * 2, { color: C.OLIVE, w: k < 2 ? 2.2 : 1.6, kind: k < 2 ? 'pen' : 'pencil', alpha: 0.8 }));
      }
      if (!busy) for (let k = 0; k < 2; k++) {
        const x = rx(x0 + 12, x0 + T - 12), y = rx(y0 + 26, y0 + T - 8);
        ln(r, o, x, y, x + 1, y - 16, C.OLIVE, 1.8);
        ov(r, o, x + 1, y - 18, 2, 4.5, C.BROWN, 2.2);
      }
    } else if (t === Wd.MONTANHA) {
      const n = r() < 0.5 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const cx = n === 1 ? x0 + T / 2 + (r() - 0.5) * 8 : x0 + 18 + k * 28, by = y0 + T - 8 - k * 4;
        const hw = n === 1 ? rx(24, 28) : rx(16, 19), py = by - rx(34, 46);
        pl(r, o, [[cx - hw, by], [cx, py], [cx + hw, by]], false, C.BROWN, 2.6);
        fill(r, o, [[cx, py + 3], [cx + hw - 2, by - 1], [cx + 2, by - 1]], C.GRAY, 3.4, -0.9, 0.7);
        pl(r, o, [[cx - hw * 0.28, py + (by - py) * 0.28], [cx - hw * 0.1, py + (by - py) * 0.36], [cx + hw * 0.08, py + (by - py) * 0.26], [cx + hw * 0.28, py + (by - py) * 0.32]], false, C.INK, 1.8);
      }
    }

    if (!obj) return o;
    const cx = x0 + T / 2, i = ty * world.W + tx;
    if (obj.type === 'vila') {
      house(r, o, x0 + 6, y0 + 40, 20, C.RED);
      house(r, o, x0 + 34, y0 + 36, 22, C.ORANGE);
      house(r, o, x0 + 20, y0 + 60, 18, C.BLUE);
      if (obj.n === 0) { ln(r, o, x0 + 58, y0 + 58, x0 + 58, y0 + 40, C.INK, 2); shape(r, o, [[x0 + 58, y0 + 40], [x0 + 70, y0 + 44], [x0 + 58, y0 + 48]], C.INK, C.YELLOW, 1.8, 2.5); }
      o.push(S.text(World.VILAS[obj.n], cx, y0 - 2, 19, C.INK));
    } else if (obj.type === 'covil') {
      const p = [[x0 + 2, y0 + T - 6], [x0 + 10, y0 + 22], [cx, y0 + 8], [x0 + T - 10, y0 + 22], [x0 + T - 2, y0 + T - 6]];
      shape(r, o, p, C.BROWN, C.GRAY, 2.6, 4.4);
      const hole = [[cx - 14, y0 + T - 6], [cx - 12, y0 + 36], [cx, y0 + 28], [cx + 12, y0 + 36], [cx + 14, y0 + T - 6]];
      pl(r, o, hole, true, C.INK, 2.4); fill(r, o, hole, C.INK, 2, 0.5, 0.9);
      o.push(S.text('Covil do Dragão', cx, y0 - 2, 19, C.RED));
      if (state.won) cross(r, o, x0, y0, T);
    } else if (obj.type === 'monstro') {
      for (const s of S.xform(A.monster(obj.kind), 0.5, x0 + 7, y0 + 8)) o.push(s);
      if (state.dead.has(i)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'bau') {
      for (const s of S.xform(A.icon('chest'), 0.38, x0 + 13, y0 + 16)) o.push(s);
      if (state.opened.has(i)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'npc') {
      const cols = [C.BLUE, C.GREEN, C.PURPLE, C.ORANGE, C.PINK];
      for (const s of S.xform(A.npc(r, cols[obj.fala % cols.length]), 0.56, x0 + 4, y0 + 6)) o.push(s);
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
