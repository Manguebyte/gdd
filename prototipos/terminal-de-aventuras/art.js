// art.js — os desenhos do terminal: bots, herói, ícones, dados e mapa.
//
// POR QUE: cada desenho é uma função que devolve traços (sketch.js) numa
// caixa de 100×100. A mesma lista serve grande na luta e pequena no mapa
// (S.xform), e pode ser desenhada aos poucos, como a IA faz no terminal.
// No Terminal de Aventuras tudo é máquina: os monstros do Caderno viraram
// robôs (o rato é um Rato-bô de rodinhas, o goblin um Gremlin com antenas
// de prato, o dragão um Mecadragão), as fogueiras viraram estações de
// recarga, e o mapa de cada zona é ferro-velho, silício, gelo, brejo
// químico ou fundição.
//
// ESTRATÉGIA: mesma API do art.js do Caderno (A.monster, A.tile, A.icon...),
// então o game.js chama as mesmas funções. O contorno vem primeiro (linha
// de neon) e a "pintura" depois (linhas de varredura, ver S.hatch). Os ids
// dos bots são os dos monstros do Caderno (slime, rato, goblin...), porque
// os dados do jogo e a geração do mundo usam esses ids.
(function () {
  'use strict';
  const S = Sketch, C = S.C;
  const A = {};

  // ---------- atalhos de desenho ----------
  // `dim`: brilho de tudo que está sendo desenhado agora. O terreno do mapa é
  // desenhado mais apagado (TERRAIN_DIM) para bots, estações e caixotes
  // saltarem aos olhos; com o bloom, terreno no brilho cheio vira ruído.
  const TERRAIN_DIM = 0.5;
  let dim = 1;
  const pen = (color, w = 2.4) => ({ color, w, kind: 'pen', alpha: dim });
  function pl(r, o, pts, closed, color, w) { o.push(S.poly(r, pts, closed, pen(color, w))); }
  function ln(r, o, x1, y1, x2, y2, color, w) { o.push(S.line(r, x1, y1, x2, y2, pen(color, w))); }
  function ov(r, o, cx, cy, rx, ry, color, w) { o.push(S.ellipse(r, cx, cy, rx, ry, pen(color, w))); }
  function fill(r, o, poly, color, sp = 3.6, ang = 0.8, alpha = 0.75) {
    for (const s of S.hatch(r, poly, { color, spacing: sp, angle: ang, alpha: alpha * dim, w: 1.7 })) o.push(s);
  }
  function fillE(r, o, cx, cy, rx, ry, color, sp, ang, alpha) {
    fill(r, o, S.ellipsePoly(cx, cy, rx * 0.9, ry * 0.9), color, sp, ang, alpha);
  }
  // Forma fechada contornada e pintada de uma vez.
  function shape(r, o, pts, line, color, w = 2.6, sp = 3.6, ang = 0.8) { pl(r, o, pts, true, line, w); fill(r, o, pts, color, sp, ang); }
  function blob(r, o, cx, cy, rx, ry, line, color, w = 2.6, sp = 3.6, ang = 0.8) { ov(r, o, cx, cy, rx, ry, line, w); fillE(r, o, cx, cy, rx, ry, color, sp, ang); }
  function dot(r, o, x, y, rad, color) { ov(r, o, x, y, rad, rad, color, 2); fillE(r, o, x, y, rad, rad, color, 1.4, 0.3, 0.95); }
  function eyes(r, o, x1, x2, y, rad, color = C.INK) { dot(r, o, x1, y, rad, color); dot(r, o, x2, y, rad, color); }
  // ----- peças de robô -----
  // Retângulo (x, y, largura, altura) contornado e pintado.
  const box = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  function rect(r, o, x, y, w, h, line, color, lw = 2.6, sp = 3.6) { shape(r, o, box(x, y, w, h), line, color, lw, sp); }
  // LED: quadradinho aceso (os olhos dos robôs).
  function led(r, o, x, y, s, color) { shape(r, o, box(x - s / 2, y - s / 2, s, s), color, color, 2, 1.2); }
  // Viseira: uma barra acesa no lugar dos olhos.
  function visor(r, o, x1, x2, y, color, h = 4) { shape(r, o, box(x1, y - h / 2, x2 - x1, h), color, color, 2, 1.3); }
  // Rebite: um pontinho na chapa.
  function rivet(r, o, x, y, color = C.GRAY) { ov(r, o, x, y, 1.4, 1.4, color, 1.6); }
  // Antena com a bolinha na ponta.
  function antenna(r, o, x, y, h, color = C.GRAY, tip = C.RED) { ln(r, o, x, y, x, y - h, color, 2); dot(r, o, x, y - h - 2, 2.2, tip); }
  // Roda com raios.
  function wheel(r, o, cx, cy, rad, color = C.GRAY) {
    ov(r, o, cx, cy, rad, rad, color, 2.4);
    ln(r, o, cx - rad * 0.7, cy, cx + rad * 0.7, cy, color, 1.6); ln(r, o, cx, cy - rad * 0.7, cx, cy + rad * 0.7, color, 1.6);
  }
  // Esteira de tanque (x, y = canto de cima à esquerda).
  function tread(r, o, x, y, w, h, color = C.GRAY) {
    pl(r, o, [[x + h / 2, y], [x + w - h / 2, y], [x + w, y + h / 2], [x + w - h / 2, y + h], [x + h / 2, y + h], [x, y + h / 2]], true, color, 2.6);
    for (let k = 0; k < 4; k++) ov(r, o, x + h / 2 + k * (w - h) / 3, y + h / 2, h * 0.28, h * 0.28, color, 1.6);
  }
  // Pistão: duas linhas paralelas com uma junta (braços e pernas hidráulicos).
  function piston(r, o, x1, y1, x2, y2, color = C.GRAY, w = 3) {
    ln(r, o, x1, y1, x2, y2, color, w);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ov(r, o, mx, my, 2.6, 2.6, color, 2);
  }
  // Raio (o desenho do relâmpago), usado em choques, estações e ícones.
  function bolt(r, o, cx, cy, s = 1, color = C.YELLOW) {
    const p = [[2, -14], [-6, 1], [0, 1], [-3, 14], [7, -3], [1, -3], [4, -14]].map(([x, y]) => [cx + x * s, cy + y * s]);
    shape(r, o, p, color, color, 2 * s, 2);
  }
  // Labareda de plasma (vários bots da Fundição).
  function flame(r, o, cx, by, s = 1) {
    const P = (x, y) => [cx + x * s, by + y * s];
    shape(r, o, [P(0, -22), P(7, -10), P(6, -2), P(0, 0), P(-6, -2), P(-7, -10), P(-2, -8)], C.ORANGE, C.RED, 2 * s, 2.4);
    fill(r, o, [P(0, -11), P(3, -5), P(0, -2), P(-3, -5)], C.YELLOW, 1.8, 0.3, 0.95);
  }

  // ---------- bots ----------
  const M = {};

  // ----- Ferro-Velho -----
  // Gosma de óleo: poça viva de óleo, com o brilho de arco-íris do óleo e um parafuso boiando.
  M.slime = r => {
    const o = [], body = [[16, 90], [15, 74], [22, 56], [36, 42], [50, 38], [64, 42], [78, 56], [85, 74], [84, 90]];
    shape(r, o, body, C.PURPLE, C.PURPLE, 3);
    pl(r, o, [[26, 72], [32, 60], [44, 52]], false, C.LBLUE, 2.4);
    pl(r, o, [[62, 84], [72, 76], [78, 64]], false, C.PINK, 2.2);
    led(r, o, 41, 63, 6, C.INK); led(r, o, 59, 63, 6, C.INK);
    ln(r, o, 43, 76, 57, 76, C.INK, 2.2);
    ov(r, o, 30, 84, 3.6, 3.6, C.GRAY, 2); ln(r, o, 30, 80, 30, 88, C.GRAY, 1.6);
    return o;
  };
  // Rato-bô: caixa sobre duas rodas, orelha de antena parabólica e rabo de cabo com plugue.
  M.rato = r => {
    const o = [];
    pl(r, o, [[22, 72], [10, 68], [6, 56], [10, 46]], false, C.ORANGE, 2.4);
    rect(r, o, 4, 38, 12, 8, C.YELLOW, C.YELLOW, 2, 2.2);
    ln(r, o, 7, 38, 7, 33, C.YELLOW, 1.8); ln(r, o, 13, 38, 13, 33, C.YELLOW, 1.8);
    shape(r, o, [[20, 56], [70, 56], [72, 80], [20, 80]], C.LBLUE, C.GRAY);
    for (const x of [28, 40, 52, 64]) rivet(r, o, x, 62, C.LBLUE);
    shape(r, o, [[66, 50], [88, 54], [98, 64], [88, 72], [68, 72]], C.LBLUE, C.GRAY);
    ov(r, o, 74, 44, 8, 6, C.PINK, 2.4); ln(r, o, 74, 44, 77, 40, C.PINK, 1.6);
    led(r, o, 84, 60, 4, C.RED);
    ln(r, o, 92, 66, 99, 62, C.INK, 1.2); ln(r, o, 92, 68, 99, 71, C.INK, 1.2);
    wheel(r, o, 32, 84, 8); wheel(r, o, 60, 84, 8);
    return o;
  };
  // Gremlin: cabeção de lata com antenas de prato, corpo pequeno e uma chave inglesa.
  M.goblin = r => {
    const o = [];
    rect(r, o, 36, 52, 28, 30, C.GREEN, C.GREEN);
    visor(r, o, 42, 58, 64, C.YELLOW, 3);
    shape(r, o, [[30, 14], [70, 14], [74, 48], [26, 48]], C.GREEN, C.GREEN);
    shape(r, o, [[28, 24], [8, 14], [10, 34]], C.LGREEN, C.LGREEN, 2.2);
    shape(r, o, [[72, 24], [92, 14], [90, 34]], C.LGREEN, C.LGREEN, 2.2);
    led(r, o, 41, 30, 7, C.RED); led(r, o, 59, 30, 7, C.RED);
    pl(r, o, [[38, 40], [42, 44], [46, 40], [50, 44], [54, 40], [58, 44], [62, 40]], false, C.INK, 1.8);
    antenna(r, o, 50, 14, 8, C.GREEN, C.YELLOW);
    piston(r, o, 36, 58, 20, 74, C.GREEN); piston(r, o, 64, 58, 80, 70, C.GREEN);
    // Chave inglesa.
    ln(r, o, 80, 72, 92, 46, C.GRAY, 3.2);
    pl(r, o, [[88, 46], [90, 38], [96, 40], [94, 48]], false, C.GRAY, 2.6);
    ln(r, o, 42, 82, 40, 96, C.GREEN, 3); ln(r, o, 58, 82, 60, 96, C.GREEN, 3);
    return o;
  };
  // Lobo-robô de chapas; o criogênico e o cão-maçarico são o mesmo corpo em outras cores.
  function wolf(r, fur, eye) {
    const o = [];
    // Cauda de antena.
    pl(r, o, [[20, 56], [10, 46], [6, 36]], false, fur, 2.4); dot(r, o, 6, 33, 2.4, eye);
    shape(r, o, [[18, 50], [70, 48], [74, 72], [22, 74]], fur, fur);
    for (const x of [30, 42, 54]) ln(r, o, x, 52, x, 70, C.INK, 1.4);
    // Cabeça de focinho reto.
    shape(r, o, [[64, 36], [86, 46], [98, 56], [88, 64], [70, 64], [62, 50]], fur, fur);
    shape(r, o, [[66, 38], [68, 22], [78, 34]], fur, fur, 2.2);
    led(r, o, 78, 48, 5, eye);
    ln(r, o, 84, 60, 96, 58, C.INK, 1.8);
    // Pernas de pistão.
    for (const x of [26, 38, 56, 66]) piston(r, o, x, 72, x + (x > 50 ? 2 : -2), 94, C.GRAY, 3);
    return o;
  }
  M.lobo = r => wolf(r, C.GRAY, C.RED);
  // Esqueleto de metal: o esqueleto por baixo de um robô, com viseira vermelha e um cano.
  M.esqueleto = r => {
    const o = [];
    shape(r, o, [[38, 8], [62, 8], [64, 26], [56, 34], [44, 34], [36, 26]], C.INK, C.GRAY, 2.6, 3);
    visor(r, o, 41, 59, 20, C.RED, 4);
    for (const x of [45, 50, 55]) ln(r, o, x, 30, x, 34, C.INK, 1.4);
    ln(r, o, 50, 36, 50, 70, C.INK, 3);
    for (const y of [44, 51, 58]) pl(r, o, [[36, y + 3], [44, y], [56, y], [64, y + 3]], false, C.INK, 2);
    pl(r, o, [[40, 72], [50, 68], [60, 72], [50, 78]], true, C.INK, 2.2);
    piston(r, o, 50, 42, 30, 62, C.INK, 2.6); piston(r, o, 50, 42, 72, 58, C.INK, 2.6);
    piston(r, o, 44, 76, 38, 96, C.INK, 2.8); piston(r, o, 56, 76, 62, 96, C.INK, 2.8);
    ln(r, o, 72, 60, 92, 30, C.GRAY, 3.4); ov(r, o, 92, 30, 3, 3, C.GRAY, 2);
    return o;
  };
  // Aranha-drone: cúpula com um olho só e oito pernas articuladas.
  M.aranha = r => {
    const o = [];
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
      const by = 50 + k * 6, kx = 50 + s * (24 + k * 4), ky = 30 + k * 8;
      pl(r, o, [[50 + s * 10, by], [kx, ky], [50 + s * (36 + k * 3), 86 + (k % 2) * 6]], false, C.PURPLE, 2.4);
      ov(r, o, kx, ky, 1.8, 1.8, C.INK, 1.6);
    }
    shape(r, o, [[30, 64], [36, 50], [64, 50], [70, 64], [64, 80], [36, 80]], C.PURPLE, C.PURPLE, 2.8, 3);
    pl(r, o, [[36, 50], [42, 38], [58, 38], [64, 50]], false, C.PURPLE, 2.6);
    ov(r, o, 50, 50, 7, 7, C.RED, 2.4); dot(r, o, 50, 50, 3, C.RED);
    antenna(r, o, 50, 38, 6, C.PURPLE, C.LBLUE);
    return o;
  };
  // Brutamontes: peito de caixa-forte, cabecinha e uma marreta.
  M.orc = r => {
    const o = [];
    shape(r, o, [[24, 44], [76, 44], [80, 84], [20, 84]], C.ORANGE, C.ORANGE);
    for (const [x, y] of [[28, 50], [72, 50], [28, 78], [72, 78]]) rivet(r, o, x, y, C.INK);
    rect(r, o, 38, 56, 24, 14, C.INK, C.YELLOW, 2, 2.6);
    rect(r, o, 38, 20, 24, 22, C.ORANGE, C.ORANGE);
    visor(r, o, 41, 59, 30, C.RED, 4);
    piston(r, o, 22, 50, 10, 76, C.ORANGE, 3.6); piston(r, o, 78, 50, 86, 70, C.ORANGE, 3.6);
    ln(r, o, 86, 92, 86, 20, C.GRAY, 4);
    rect(r, o, 74, 10, 24, 14, C.GRAY, C.GRAY, 2.4);
    ln(r, o, 36, 84, 34, 98, C.ORANGE, 4); ln(r, o, 64, 84, 66, 98, C.ORANGE, 4);
    return o;
  };
  // Hacker do brejo: capuz de capa, rosto de tela e um notebook aceso na mão.
  M.bruxa = r => {
    const o = [];
    shape(r, o, [[50, 22], [22, 94], [78, 94]], C.PURPLE, C.PURPLE);
    shape(r, o, [[34, 40], [50, 8], [66, 40], [60, 46], [40, 46]], C.PURPLE, C.PURPLE, 2.6);
    rect(r, o, 41, 26, 18, 14, C.LGREEN, C.LGREEN, 2, 2);
    led(r, o, 46, 32, 3, C.PAPER); led(r, o, 54, 32, 3, C.PAPER);
    antenna(r, o, 50, 8, 6, C.PURPLE, C.LGREEN);
    // Notebook.
    ln(r, o, 32, 64, 14, 58, C.PURPLE, 2.6);
    pl(r, o, [[66, 66], [96, 66], [92, 72], [70, 72]], true, C.GRAY, 2.2);
    shape(r, o, [[70, 66], [74, 46], [96, 46], [94, 66]], C.LGREEN, C.LGREEN, 2.2, 2.4);
    pl(r, o, [[78, 52], [82, 56], [78, 60]], false, C.PAPER, 1.8); ln(r, o, 84, 60, 90, 60, C.PAPER, 1.8);
    return o;
  };
  // Ogro hidráulico: barrigão de tanque, braços de pistão e uma chave de roda.
  M.ogro = r => {
    const o = [];
    blob(r, o, 50, 64, 30, 26, C.ORANGE, C.ORANGE);
    ov(r, o, 50, 66, 12, 10, C.INK, 2); ln(r, o, 42, 66, 58, 66, C.INK, 1.6);
    rect(r, o, 38, 18, 24, 20, C.ORANGE, C.ORANGE);
    led(r, o, 44, 28, 4, C.YELLOW); led(r, o, 56, 28, 4, C.YELLOW);
    piston(r, o, 22, 56, 8, 82, C.GRAY, 4.4); piston(r, o, 78, 56, 88, 38, C.GRAY, 4.4);
    pl(r, o, [[84, 44], [80, 10], [94, 8], [96, 40]], true, C.GRAY, 3);
    fill(r, o, [[84, 44], [80, 10], [94, 8], [96, 40]], C.GRAY);
    ln(r, o, 38, 88, 34, 99, C.ORANGE, 4); ln(r, o, 62, 88, 66, 99, C.ORANGE, 4);
    return o;
  };
  // Cavaleiro mecha: elmo de fenda, ombreiras, escudo com raio e uma lança.
  M.cavaleiro = r => {
    const o = [];
    shape(r, o, [[32, 40], [68, 40], [72, 84], [28, 84]], C.BLUE, C.BLUE, 2.6, 3);
    shape(r, o, [[24, 38], [40, 34], [40, 46], [24, 48]], C.INK, C.GRAY, 2.2);
    shape(r, o, [[60, 34], [76, 38], [76, 48], [60, 46]], C.INK, C.GRAY, 2.2);
    shape(r, o, [[38, 8], [62, 8], [64, 34], [36, 34]], C.INK, C.GRAY, 2.6, 3);
    visor(r, o, 40, 60, 20, C.RED, 3);
    antenna(r, o, 56, 8, 6, C.GRAY, C.RED);
    shape(r, o, [[8, 46], [34, 46], [32, 70], [21, 80], [10, 70]], C.BLUE, C.BLUE, 2.4);
    bolt(r, o, 21, 61, 0.7, C.YELLOW);
    piston(r, o, 70, 50, 84, 62, C.GRAY, 3.4);
    ln(r, o, 84, 62, 96, 6, C.LBLUE, 3.4);
    ln(r, o, 40, 84, 38, 98, C.BLUE, 4); ln(r, o, 60, 84, 62, 98, C.BLUE, 4);
    return o;
  };
  // Troll de chapa: bloco rebitado de braços compridos.
  M.troll = r => {
    const o = [];
    shape(r, o, [[26, 40], [74, 40], [80, 86], [20, 86]], C.LBLUE, C.LBLUE, 2.8);
    for (const [x, y] of [[30, 46], [70, 46], [28, 80], [72, 80], [50, 46]]) rivet(r, o, x, y, C.INK);
    shape(r, o, [[36, 18], [64, 18], [66, 40], [34, 40]], C.LBLUE, C.LBLUE);
    led(r, o, 44, 28, 5, C.YELLOW); led(r, o, 56, 28, 5, C.YELLOW);
    pl(r, o, [[42, 36], [46, 33], [50, 36], [54, 33], [58, 36]], false, C.INK, 2);
    pl(r, o, [[24, 46], [8, 72], [12, 94]], false, C.GRAY, 4.4);
    pl(r, o, [[76, 46], [92, 72], [88, 94]], false, C.GRAY, 4.4);
    ln(r, o, 36, 86, 32, 98, C.LBLUE, 4.4); ln(r, o, 64, 86, 68, 98, C.LBLUE, 4.4);
    return o;
  };
  // Golem de silício: o bloco de pedra virou de chip; o de fundição é o mesmo, escuro e rachado de brasa.
  function golem(r, stone, eye, crack) {
    const o = [];
    shape(r, o, [[24, 36], [76, 36], [78, 76], [22, 76]], stone, stone, 2.8, 3.4);
    for (const x of [30, 40, 50, 60, 70]) { ln(r, o, x, 36, x, 32, stone, 1.6); ln(r, o, x, 76, x, 80, stone, 1.6); }
    shape(r, o, [[36, 10], [64, 10], [64, 34], [36, 34]], stone, stone, 2.8, 3.4);
    led(r, o, 44, 22, 6, eye); led(r, o, 56, 22, 6, eye);
    shape(r, o, [[6, 38], [22, 38], [22, 72], [6, 72]], stone, stone, 2.6, 3.4);
    shape(r, o, [[78, 38], [94, 38], [94, 72], [78, 72]], stone, stone, 2.6, 3.4);
    shape(r, o, [[28, 80], [44, 80], [44, 98], [28, 98]], stone, stone, 2.6, 3.4);
    shape(r, o, [[56, 80], [72, 80], [72, 98], [56, 98]], stone, stone, 2.6, 3.4);
    pl(r, o, [[40, 42], [48, 54], [44, 62], [52, 70]], false, crack, 2.4);
    return o;
  }
  M.golem = r => golem(r, C.GRAY, C.LBLUE, C.INK);

  // ----- Deserto de Silício -----
  // Escorpião blindado: gomos de chapa e um ferrão de laser.
  M.escorpiao = r => {
    const o = [];
    for (let k = 0; k < 3; k++) {
      ln(r, o, 38 + k * 10, 74, 30 + k * 10, 92, C.OCHRE, 2.4);
      ln(r, o, 42 + k * 10, 74, 48 + k * 10, 92, C.OCHRE, 2.4);
    }
    pl(r, o, [[30, 70], [16, 58], [14, 38], [26, 24], [42, 22]], false, C.OCHRE, 3.4);
    for (const [x, y] of [[16, 58], [14, 40], [26, 26]]) shape(r, o, box(x - 6, y - 5, 12, 10), C.OCHRE, C.ORANGE, 2.2);
    shape(r, o, [[40, 18], [54, 24], [42, 30]], C.RED, C.RED, 2.2);
    ln(r, o, 54, 24, 64, 28, C.RED, 1.6);
    shape(r, o, [[24, 64], [70, 62], [74, 76], [24, 80]], C.OCHRE, C.ORANGE);
    for (const x of [36, 48, 60]) ln(r, o, x, 63, x, 79, C.INK, 1.4);
    rect(r, o, 68, 58, 16, 14, C.OCHRE, C.ORANGE, 2.4);
    led(r, o, 75, 63, 3, C.RED); led(r, o, 81, 63, 3, C.RED);
    ln(r, o, 82, 70, 90, 56, C.OCHRE, 3);
    shape(r, o, [[90, 56], [84, 42], [92, 46], [96, 38], [98, 52]], C.OCHRE, C.ORANGE, 2.2);
    return o;
  };
  // Naja de cabo: um cabo grosso enrolado, capuz de ventoinha e cabeça de plugue.
  M.cobra = r => {
    const o = [];
    blob(r, o, 46, 86, 32, 10, C.GREEN, C.GREEN);
    pl(r, o, [[22, 84], [34, 80], [54, 82], [68, 86]], false, C.LGREEN, 2);
    shape(r, o, [[54, 82], [58, 62], [56, 46], [66, 46], [70, 64], [66, 84]], C.GREEN, C.GREEN);
    for (const y of [54, 62, 70, 78]) ln(r, o, 56, y, 68, y, C.INK, 1.4);
    // Capuz: uma ventoinha aberta.
    shape(r, o, [[46, 40], [56, 18], [72, 16], [86, 38], [76, 52], [56, 52]], C.LGREEN, C.LGREEN);
    for (const a of [0, 1.6, 3.2, 4.8]) ln(r, o, 66, 36, 66 + Math.cos(a) * 12, 36 + Math.sin(a) * 9, C.INK, 1.6);
    rect(r, o, 56, 12, 18, 14, C.GREEN, C.GREEN, 2.4);
    led(r, o, 61, 18, 3, C.YELLOW); led(r, o, 69, 18, 3, C.YELLOW);
    ln(r, o, 60, 12, 60, 6, C.YELLOW, 2); ln(r, o, 70, 12, 70, 6, C.YELLOW, 2);
    return o;
  };
  // Múmia de fita: robô enrolado em fita isolante, braços esticados.
  M.mumia = r => {
    const o = [], band = C.OCHRE;
    shape(r, o, [[36, 40], [64, 40], [66, 86], [34, 86]], band, C.GRAY);
    rect(r, o, 38, 12, 24, 26, band, C.GRAY);
    for (const y of [48, 58, 68, 78]) pl(r, o, [[36, y], [50, y + 4], [64, y - 2]], false, C.YELLOW, 1.8);
    for (const y of [18, 30]) pl(r, o, [[38, y], [62, y + 3]], false, C.YELLOW, 1.8);
    led(r, o, 45, 24, 5, C.RED);
    ln(r, o, 52, 24, 58, 25, C.INK, 2);
    ln(r, o, 64, 46, 92, 46, band, 4); ln(r, o, 64, 54, 90, 56, band, 4);
    pl(r, o, [[34, 70], [22, 78], [26, 90]], false, C.YELLOW, 2.2);
    ln(r, o, 42, 86, 40, 98, band, 3.4); ln(r, o, 58, 86, 60, 98, band, 3.4);
    return o;
  };
  // Verme perfurador: gomos de chapa saindo da areia e uma broca na ponta.
  M.verme = r => {
    const o = [];
    shape(r, o, [[4, 98], [18, 84], [50, 80], [82, 84], [98, 98]], C.OCHRE, C.OCHRE, 2.4, 4);
    for (const [x, y, rr] of [[38, 76, 15], [34, 60, 14], [40, 44, 13]]) {
      shape(r, o, [[x - rr, y - rr * 0.6], [x + rr, y - rr * 0.6], [x + rr * 0.9, y + rr * 0.6], [x - rr * 0.9, y + rr * 0.6]], C.PINK, C.PINK);
    }
    // Broca: cone com a espiral.
    shape(r, o, [[42, 36], [70, 36], [56, 6]], C.GRAY, C.GRAY, 2.6);
    pl(r, o, [[45, 30], [66, 26], [48, 22], [62, 17], [52, 13]], false, C.INK, 1.8);
    led(r, o, 46, 46, 4, C.YELLOW); led(r, o, 58, 44, 4, C.YELLOW);
    return o;
  };

  // ----- Picos Criogênicos -----
  M.lobo_gelo = r => {
    const o = wolf(r, C.LBLUE, C.BLUE);
    for (const [x, y] of [[20, 50], [44, 52], [60, 58]]) pl(r, o, [[x, y], [x + 4, y - 4], [x + 8, y]], false, C.INK, 1.6);
    return o;
  };
  // Robô de neve malvado: três esferas, cartola, nariz de cone de trânsito e braços de vassoura.
  M.boneco_neve = r => {
    const o = [];
    ov(r, o, 50, 80, 23, 18, C.LBLUE, 2.8);
    ov(r, o, 50, 50, 16, 14, C.LBLUE, 2.8);
    ov(r, o, 50, 28, 12, 11, C.LBLUE, 2.8);
    shape(r, o, [[41, 19], [59, 19], [57, 5], [43, 5]], C.INK, C.GRAY, 2.4, 3);
    ln(r, o, 35, 19, 65, 19, C.INK, 3);
    led(r, o, 45, 27, 4, C.RED); led(r, o, 55, 27, 4, C.RED);
    ln(r, o, 40, 21, 47, 24, C.INK, 2); ln(r, o, 60, 21, 53, 24, C.INK, 2);
    shape(r, o, [[50, 29], [64, 32], [50, 35]], C.ORANGE, C.ORANGE, 2, 2.4);
    ln(r, o, 55, 30, 55, 34, C.INK, 1.4);
    for (const y of [44, 52, 60]) led(r, o, 50, y, 3, C.LBLUE);
    piston(r, o, 35, 48, 12, 34, C.GRAY, 3); piston(r, o, 65, 48, 88, 36, C.GRAY, 3);
    return o;
  };
  // Yeti-tanque: corpo peludo de cabos em cima de uma esteira.
  M.yeti = r => {
    const o = [];
    tread(r, o, 16, 82, 68, 16, C.GRAY);
    blob(r, o, 50, 58, 30, 26, C.BLUE, C.LBLUE, 3);
    blob(r, o, 50, 26, 17, 14, C.BLUE, C.LBLUE, 3);
    visor(r, o, 40, 60, 26, C.YELLOW, 4);
    pl(r, o, [[44, 33], [47, 37], [50, 33], [53, 37], [56, 33]], false, C.INK, 1.6);
    pl(r, o, [[22, 46], [8, 66], [12, 80]], false, C.BLUE, 5);
    pl(r, o, [[78, 46], [92, 66], [88, 80]], false, C.BLUE, 5);
    for (const [x, y] of [[36, 52], [56, 48], [44, 66], [62, 64]]) pl(r, o, [[x, y], [x + 3, y + 4], [x + 6, y]], false, C.INK, 1.6);
    return o;
  };
  // Holograma gelado: um fantasma de luz azul, cortado por faixas de interferência.
  M.espirito_gelo = r => {
    const o = [];
    const body = [[50, 10], [68, 22], [72, 52], [82, 88], [66, 78], [58, 94], [48, 80], [36, 92], [30, 64], [32, 24]];
    shape(r, o, body, C.LBLUE, C.BLUE, 2.6, 4);
    for (const y of [40, 62]) ln(r, o, 26, y, 78, y + 1, C.INK, 1.2);
    led(r, o, 43, 34, 6, C.INK); led(r, o, 57, 34, 6, C.INK);
    ov(r, o, 50, 48, 4, 5, C.INK, 2);
    for (const [x, y] of [[12, 40], [88, 34], [16, 72], [90, 64]])
      shape(r, o, [[x, y - 8], [x + 5, y], [x, y + 8], [x - 5, y]], C.LBLUE, C.LBLUE, 2, 2.6);
    return o;
  };

  // ----- Brejo Tóxico -----
  // Zumbi-ciborgue: meia cara de metal, olho de LED e braços esticados.
  M.zumbi = r => {
    const o = [];
    shape(r, o, [[34, 44], [64, 44], [68, 84], [32, 84]], C.OLIVE, C.OLIVE);
    pl(r, o, [[34, 76], [40, 84], [46, 76], [52, 84], [58, 76], [64, 84]], false, C.INK, 2);
    blob(r, o, 50, 28, 14, 15, C.LGREEN, C.OLIVE);
    shape(r, o, [[50, 14], [62, 18], [64, 36], [50, 42]], C.GRAY, C.GRAY, 2.2);
    dot(r, o, 44, 26, 2.6, C.YELLOW);
    led(r, o, 57, 26, 5, C.RED);
    pl(r, o, [[43, 36], [48, 34], [52, 37], [57, 35]], false, C.INK, 1.8);
    piston(r, o, 64, 50, 92, 48, C.OLIVE, 4.4); ln(r, o, 62, 58, 88, 64, C.OLIVE, 4.4);
    ln(r, o, 42, 84, 38, 98, C.OLIVE, 3.4); ln(r, o, 58, 84, 64, 98, C.OLIVE, 3.4);
    return o;
  };
  // Sapo de lata: lata amassada de olhos de câmera e língua de mola.
  M.sapo = r => {
    const o = [];
    shape(r, o, [[14, 92], [8, 80], [24, 74], [28, 90]], C.GREEN, C.GREEN, 2.4);
    shape(r, o, [[86, 92], [92, 80], [76, 74], [72, 90]], C.GREEN, C.GREEN, 2.4);
    shape(r, o, [[18, 72], [24, 52], [76, 52], [82, 72], [74, 90], [26, 90]], C.GREEN, C.GREEN, 2.8);
    for (const y of [62, 74]) ln(r, o, 22, y, 78, y, C.INK, 1.4);
    ov(r, o, 34, 44, 9, 9, C.LGREEN, 2.6); ov(r, o, 64, 44, 9, 9, C.LGREEN, 2.6);
    dot(r, o, 34, 44, 4, C.RED); dot(r, o, 64, 44, 4, C.RED);
    pl(r, o, [[72, 66], [78, 62], [82, 68], [88, 62], [94, 66]], false, C.PINK, 2.6);
    dot(r, o, 96, 65, 3, C.PINK);
    return o;
  };
  // Fantasma digital: lençol de pixels em degraus, com um olho de cursor.
  M.fantasma = r => {
    const o = [];
    const body = [[38, 8], [62, 8], [62, 14], [72, 14], [72, 24], [78, 24], [78, 88], [70, 88], [70, 80], [62, 80], [62, 92], [54, 92], [54, 80],
      [46, 80], [46, 92], [38, 92], [38, 80], [30, 80], [30, 88], [22, 88], [22, 24], [28, 24], [28, 14], [38, 14]];
    shape(r, o, body, C.LBLUE, C.BLUE, 2.6, 5.2);
    led(r, o, 41, 38, 8, C.INK); led(r, o, 59, 38, 8, C.INK);
    rect(r, o, 44, 52, 12, 10, C.INK, C.INK, 2.4, 2);
    pl(r, o, [[22, 52], [8, 44], [6, 54]], false, C.LBLUE, 2.4);
    pl(r, o, [[78, 52], [92, 42], [96, 52]], false, C.LBLUE, 2.4);
    return o;
  };
  // Ceifador industrial: manto de lona, cara de máscara e uma foice de serra.
  M.ceifador = r => {
    const o = [];
    ln(r, o, 82, 96, 76, 8, C.GRAY, 3.4);
    shape(r, o, [[76, 8], [50, 4], [30, 16], [52, 12], [76, 18]], C.INK, C.GRAY, 2.4, 2.6);
    for (const x of [40, 48, 56, 64]) ln(r, o, x, 9, x - 2, 14, C.INK, 1.4);
    shape(r, o, [[48, 10], [66, 24], [74, 94], [22, 94], [30, 24]], C.PURPLE, C.PURPLE, 2.6, 3.4);
    rect(r, o, 39, 24, 18, 18, C.INK, C.PAPER, 2.2);
    led(r, o, 44, 31, 4, C.RED); led(r, o, 52, 31, 4, C.RED);
    for (const x of [44, 48, 52]) ln(r, o, x, 36, x, 40, C.INK, 1.4);
    ln(r, o, 64, 50, 78, 50, C.PURPLE, 3);
    return o;
  };

  // ----- Fundição -----
  // Salamandra de solda: lagarto de chapa com bicos de maçarico nas costas.
  M.salamandra = r => {
    const o = [];
    pl(r, o, [[22, 72], [8, 66], [6, 54], [14, 48]], false, C.ORANGE, 4);
    shape(r, o, [[20, 62], [68, 60], [70, 80], [20, 80]], C.ORANGE, C.ORANGE);
    shape(r, o, [[64, 56], [88, 58], [92, 66], [86, 72], [66, 72]], C.ORANGE, C.ORANGE);
    led(r, o, 80, 62, 4, C.YELLOW);
    pl(r, o, [[84, 68], [92, 68]], false, C.INK, 2);
    for (const x of [28, 40, 52, 62]) piston(r, o, x, 80, x + (x > 45 ? 4 : -4), 92, C.GRAY, 3);
    for (const x of [30, 44, 58]) { rect(r, o, x - 3, 54, 6, 6, C.GRAY, C.GRAY, 1.8, 2); flame(r, o, x, 54, 0.6); }
    return o;
  };
  // Diabrete-chip: diabinho de placa de circuito, chifres de antena e garfo de tomada.
  M.diabrete = r => {
    const o = [];
    shape(r, o, [[36, 50], [14, 32], [20, 52], [10, 60], [34, 62]], C.PURPLE, C.PURPLE, 2.2);
    shape(r, o, [[64, 50], [86, 32], [80, 52], [90, 60], [66, 62]], C.PURPLE, C.PURPLE, 2.2);
    pl(r, o, [[42, 78], [30, 90], [20, 86], [14, 92]], false, C.RED, 2.6);
    shape(r, o, [[14, 92], [8, 88], [14, 84]], C.RED, C.RED, 2, 2);
    rect(r, o, 34, 50, 32, 34, C.RED, C.RED);
    pl(r, o, [[40, 58], [48, 58], [48, 66], [56, 66]], false, C.YELLOW, 1.6); pl(r, o, [[60, 76], [52, 76], [52, 70]], false, C.YELLOW, 1.6);
    rect(r, o, 38, 26, 24, 22, C.RED, C.RED);
    ln(r, o, 40, 26, 34, 14, C.INK, 2.2); dot(r, o, 34, 12, 2, C.YELLOW);
    ln(r, o, 60, 26, 66, 14, C.INK, 2.2); dot(r, o, 66, 12, 2, C.YELLOW);
    led(r, o, 45, 36, 4, C.YELLOW); led(r, o, 55, 36, 4, C.YELLOW);
    pl(r, o, [[44, 43], [50, 45], [56, 43]], false, C.INK, 1.8);
    // Garfo de tomada.
    ln(r, o, 66, 64, 84, 96, C.GRAY, 2.6);
    pl(r, o, [[60, 58], [62, 50]], false, C.GRAY, 2.6); pl(r, o, [[70, 56], [72, 48]], false, C.GRAY, 2.6);
    ln(r, o, 60, 58, 72, 56, C.GRAY, 2.6);
    ln(r, o, 42, 84, 40, 96, C.RED, 3); ln(r, o, 58, 84, 60, 96, C.RED, 3);
    return o;
  };
  M.cao_infernal = r => {
    const o = wolf(r, C.RED, C.YELLOW);
    flame(r, o, 74, 30, 0.8); flame(r, o, 10, 44, 0.7); flame(r, o, 40, 50, 0.6);
    return o;
  };
  // Elemental de plasma: uma chama viva presa num anel de contenção.
  M.elemental = r => {
    const o = [];
    const body = [[50, 4], [64, 24], [62, 38], [76, 30], [78, 58], [68, 92], [32, 92], [22, 58], [24, 30], [38, 38], [36, 22]];
    shape(r, o, body, C.PINK, C.PURPLE, 2.8, 3);
    fill(r, o, [[50, 40], [62, 60], [58, 86], [42, 86], [38, 60]], C.LBLUE, 2.4, 0.3, 0.9);
    ov(r, o, 50, 66, 34, 8, C.GRAY, 2.4);
    led(r, o, 43, 46, 6, C.INK); led(r, o, 57, 46, 6, C.INK);
    pl(r, o, [[42, 58], [50, 62], [58, 58]], false, C.INK, 2);
    bolt(r, o, 14, 50, 0.8, C.LBLUE); bolt(r, o, 86, 50, 0.8, C.LBLUE);
    return o;
  };
  M.golem_magma = r => {
    const o = golem(r, C.BROWN, C.YELLOW, C.ORANGE);
    pl(r, o, [[60, 40], [56, 50], [64, 58]], false, C.ORANGE, 3);
    for (const [x, y] of [[14, 74], [86, 74]]) dot(r, o, x, y + 6, 2.4, C.ORANGE);
    return o;
  };
  // Fênix de plasma: pássaro de chapas com asas de lâmina e a cauda em chama.
  M.fenix = r => {
    const o = [];
    shape(r, o, [[46, 50], [6, 18], [16, 40], [2, 46], [36, 64]], C.ORANGE, C.RED, 2.4, 3);
    shape(r, o, [[56, 50], [94, 14], [86, 38], [98, 42], [66, 64]], C.ORANGE, C.RED, 2.4, 3);
    for (const k of [0, 1]) { ln(r, o, 16 + k * 10, 30 + k * 6, 30 + k * 6, 52, C.YELLOW, 1.4); ln(r, o, 84 - k * 10, 28 + k * 6, 70 - k * 6, 52, C.YELLOW, 1.4); }
    for (const x of [40, 50, 60]) flame(r, o, x, 98, 0.9);
    shape(r, o, [[40, 50], [62, 50], [64, 76], [38, 76]], C.RED, C.RED);
    rect(r, o, 48, 26, 18, 16, C.RED, C.RED);
    shape(r, o, [[66, 30], [76, 34], [66, 38]], C.YELLOW, C.YELLOW, 2, 2.4);
    led(r, o, 58, 32, 4, C.YELLOW);
    flame(r, o, 56, 26, 0.6);
    return o;
  };
  // Mecadragão Vermelho: o chefe final, de asas de chapa, pescoço de pistão e boca de lança-chamas.
  M.dragao = r => {
    const o = [];
    shape(r, o, [[44, 50], [20, 10], [30, 30], [8, 22], [24, 48]], C.PURPLE, C.PURPLE, 2.4, 3);
    for (const [x, y] of [[26, 26], [20, 36]]) ln(r, o, 40, 48, x, y, C.INK, 1.4);
    pl(r, o, [[30, 74], [12, 80], [4, 70], [10, 62]], false, C.RED, 3.4);
    shape(r, o, [[16, 66], [26, 52], [60, 50], [70, 64], [62, 82], [24, 84]], C.RED, C.RED, 2.8, 3);
    for (const [x, y] of [[30, 58], [44, 56], [56, 58], [34, 74], [50, 76]]) rivet(r, o, x, y, C.INK);
    shape(r, o, [[54, 56], [62, 34], [70, 24], [76, 32], [68, 44], [62, 62]], C.RED, C.RED, 2.6, 3);
    shape(r, o, [[66, 18], [86, 20], [94, 30], [82, 34], [70, 32]], C.RED, C.RED, 2.6, 3);
    pl(r, o, [[70, 20], [66, 8]], false, C.GRAY, 2.6); pl(r, o, [[76, 20], [76, 8]], false, C.GRAY, 2.6);
    led(r, o, 78, 25, 4, C.YELLOW);
    shape(r, o, [[94, 30], [100, 38], [96, 42], [100, 50], [92, 46], [88, 38]], C.ORANGE, C.YELLOW, 2, 2.4);
    for (const x of [28, 40, 52]) piston(r, o, x, 82, x, 96, C.GRAY, 3.4);
    return o;
  };

  // Onde fica o alto da cabeça de cada bot (caixa 100×100): é ali que a IA
  // desenha a coroa da versão chefe.
  const HEAD = {
    slime: [50, 38], rato: [78, 48], goblin: [50, 8], lobo: [74, 36], esqueleto: [50, 6], aranha: [50, 30],
    orc: [50, 18], bruxa: [50, 4], ogro: [50, 16], cavaleiro: [50, 6], troll: [50, 16], golem: [50, 10],
    escorpiao: [76, 56], cobra: [65, 6], mumia: [50, 10], verme: [56, 6],
    lobo_gelo: [74, 36], boneco_neve: [50, 4], yeti: [50, 12], espirito_gelo: [50, 10],
    zumbi: [50, 13], sapo: [49, 34], fantasma: [50, 8], ceifador: [48, 6],
    salamandra: [76, 54], diabrete: [50, 12], cao_infernal: [74, 28], elemental: [50, 6], golem_magma: [50, 10], fenix: [57, 22],
  };
  function crown(r, o, cx, by, s = 1) {
    const p = [[-12, 0], [-13, -10], [-6, -4], [0, -14], [6, -4], [13, -10], [12, 0]].map(([x, y]) => [cx + x * s, by + y * s]);
    shape(r, o, p, C.YELLOW, C.YELLOW, 2.4, 2.6);
    led(r, o, cx, by - 4 * s, 3.4 * s, C.RED);
  }
  // Chefe ("chefe_rato" = Rato-bô Alfa): o mesmo bot, um pouco menor para
  // caber a coroa de circuito em cima.
  function boss(kind) {
    const r = S.rng(S.hash(kind.length, kind.charCodeAt(0), kind.charCodeAt(1), 7)), sc = 0.84, ox = 8, oy = 14;
    const o = S.xform(M[kind](r), sc, ox, oy), [hx, hy] = HEAD[kind];
    crown(r, o, hx * sc + ox, hy * sc + oy + 1, 1.1);
    return o;
  }
  // Guardião do portal ("guarda_0" = Brutamontes de Guerra): o bot de
  // capacete de combate com duas antenas, no lugar da coroa dos chefes.
  function helm(r, o, cx, by, s = 1) {
    const cap = [[-13, 0], [-12, -9], [-6, -14], [6, -14], [12, -9], [13, 0]].map(([x, y]) => [cx + x * s, by + y * s]);
    shape(r, o, cap, C.RED, C.GRAY, 2.4, 2.6);
    for (const k of [-1, 1]) {
      ln(r, o, cx + 9 * k * s, by - 10 * s, cx + 18 * k * s, by - 26 * s, C.RED, 2.2);
      dot(r, o, cx + 18 * k * s, by - 27 * s, 2.4 * s, C.RED);
    }
    ln(r, o, cx - 12 * s, by - 3 * s, cx + 12 * s, by - 3 * s, C.YELLOW, 2.2);
  }
  function guardian(pg) {
    const kind = World.GUARDIOES[pg][0], r = S.rng(S.hash(pg, 17, 5)), sc = 0.84, ox = 8, oy = 14;
    const o = S.xform(M[kind](r), sc, ox, oy), [hx, hy] = HEAD[kind];
    helm(r, o, hx * sc + ox, hy * sc + oy + 2, 1.05);
    return o;
  }
  // Bot lendário ("lenda_2" = Pé-de-Esteira): o bot de tamanho normal, com um
  // halo dourado tracejado em volta e uma estrela em cima da cabeça.
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
    shape(r, o, p, C.YELLOW, C.YELLOW, 2.2, 2.4);
    return o;
  }
  // Androide de combate da estação (os duelos): capa colorida, capacete,
  // lâmina e escudo redondo, virado para o herói. `capa` muda a cor (o
  // mecânico e a veterana, quando o herói ataca eles).
  M.guerreiro = (r, capa = C.BLUE) => {
    const o = [];
    shape(r, o, [[53, 32], [68, 70], [36, 70], [46, 32]], capa, capa, 3.2, 3.2);
    rect(r, o, 40, 10, 20, 20, C.INK, C.GRAY, 3);
    visor(r, o, 43, 57, 20, C.LBLUE, 3);
    antenna(r, o, 50, 10, 5, C.GRAY, capa);
    ln(r, o, 50, 31, 50, 60, C.INK, 3.6);
    piston(r, o, 50, 40, 64, 54, C.INK, 3);
    piston(r, o, 50, 40, 34, 48, C.INK, 3);
    ln(r, o, 34, 48, 18, 22, C.LBLUE, 3.8); ln(r, o, 40, 42, 28, 52, C.GRAY, 3.4);
    blob(r, o, 68, 56, 12, 13, C.INK, capa, 2.8, 3);
    led(r, o, 68, 56, 4, C.YELLOW);
    ln(r, o, 50, 60, 38, 86, C.INK, 3.6); ln(r, o, 50, 60, 62, 86, C.INK, 3.6);
    return o;
  };
  // Gente que o herói ataca (o jogo registra cada uma com A.defMonster).
  // Quem luta de lâmina é um androide de combate; o resto, o robô do
  // caminho, com o balão só em quem fica no mapa.
  A.gente = (papel, seed, color) => {
    const r = S.rng(seed);
    if (papel === 'ferreiro') return M.guerreiro(r, C.ORANGE);
    if (papel === 'veterana') return M.guerreiro(r, C.PURPLE);
    if (papel === 'duelista') return M.guerreiro(r);
    return A.npc(r, color, papel === 'missao', papel === 'missao' || papel === 'dica');
  };
  const EXTRA = {};
  A.defMonster = (kind, fn) => { EXTRA[kind] = fn; };
  const monsterCache = {};
  A.monster = kind => monsterCache[kind] || (monsterCache[kind] = EXTRA[kind] ? EXTRA[kind]()
    : kind.startsWith('chefe_') ? boss(kind.slice(6))
    : kind.startsWith('guarda_') ? guardian(+kind.slice(7))
    : kind.startsWith('lenda_') ? legend(+kind.slice(6))
    : kind.startsWith('duelo_') ? M.guerreiro(S.rng(S.hash(+kind.slice(6), 29)))
    : M[kind](S.rng(S.hash(kind.length, kind.charCodeAt(0), kind.charCodeAt(1)))));
  A.monsterFresh = (kind, seed) => M[kind](S.rng(seed));

  // ---------- herói, gente e lugares ----------
  // Herói: robô explorador de viseira, antena e mochila de scanner (2 poses de
  // andar). Traço grosso porque no mapa ele é desenhado a menos da metade.
  // `capa`: outra cor de corpo (o adversário na arena PvP vem de azul).
  A.hero = (frame, capa = C.RED) => {
    const r = S.rng(1234 + frame), o = [];
    rect(r, o, 30, 34, 10, 22, C.GRAY, C.GRAY, 3);
    shape(r, o, [[38, 32], [62, 32], [64, 62], [36, 62]], capa, capa, 3.4, 3.2);
    led(r, o, 50, 44, 5, C.YELLOW);
    rect(r, o, 38, 8, 24, 20, C.INK, C.GRAY, 4);
    visor(r, o, 41, 59, 18, C.LBLUE, 5);
    antenna(r, o, 56, 8, 7, C.INK, C.YELLOW);
    ln(r, o, 50, 28, 50, 32, C.INK, 4);
    ln(r, o, 40, 40, 32, 56, C.INK, 4);
    ln(r, o, 60, 40, 68, 48, C.INK, 4);
    ln(r, o, 68, 48, 84, 22, C.LBLUE, 4.4); ln(r, o, 62, 44, 74, 52, C.GRAY, 4);
    if (frame) { ln(r, o, 44, 62, 42, 86, C.INK, 4.4); ln(r, o, 56, 62, 58, 86, C.INK, 4.4); }
    else { ln(r, o, 44, 62, 36, 84, C.INK, 4.4); ln(r, o, 56, 62, 64, 84, C.INK, 4.4); }
    return o;
  };

  // Robô do caminho. Quem dá dica tem "?" azul no balão; quem dá missão tem
  // "!" vermelho num balão pintado de amarelo, para chamar atenção.
  // Sem `balao`, só o robô (a programadora e o mercador da estação, na luta).
  A.npc = (r, color, quest, balao = true) => {
    const o = [];
    rect(r, o, 41, 24, 18, 16, C.INK, color, 3);
    visor(r, o, 44, 56, 32, C.INK, 3);
    antenna(r, o, 50, 24, 8, C.INK, color);
    ln(r, o, 50, 40, 50, 70, C.INK, 3.4);
    ln(r, o, 50, 48, 36, 62, C.INK, 3); ln(r, o, 50, 48, 64, 62, C.INK, 3);
    ln(r, o, 50, 70, 40, 92, C.INK, 3.4); ln(r, o, 50, 70, 60, 92, C.INK, 3.4);
    const bal = [[66, 6], [92, 6], [92, 26], [78, 26], [72, 34], [72, 26], [66, 26]];
    if (!balao) return o;
    if (quest) shape(r, o, bal, C.YELLOW, C.YELLOW, 2.2, 3);
    else pl(r, o, bal, true, C.LBLUE, 2.2);
    o.push(S.text(quest ? '!' : '?', 79, 23, 22, quest ? C.RED : C.LBLUE, { font: S.HAND }));
    return o;
  };

  // Estação de recarga ("fogueira" no código): um poste de bobinas com um
  // raio em cima. (cx, by) = meio da base; s = tamanho (1 = 24 de largura).
  function campfire(r, o, cx, by, s = 1) {
    const P = (x, y) => [cx + x * s, by + y * s];
    pl(r, o, [P(-12, 0), P(12, 0), P(8, -5), P(-8, -5)], true, C.GRAY, 2.6 * s);
    pl(r, o, [P(-4, -5), P(-4, -18), P(4, -18), P(4, -5)], true, C.LBLUE, 2.4 * s);
    for (const y of [-9, -14]) o.push(S.line(r, ...P(-7, y), ...P(7, y), pen(C.LBLUE, 2 * s)));
    bolt(r, o, cx, by - 27 * s, 0.75 * s, C.YELLOW);
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
    const o = []; shape(r, o, pts, c || C.RED, c || C.RED, 4, 4);
    pl(r, o, [[22, 50], [38, 50], [44, 38], [52, 62], [58, 50], [78, 50]], false, C.INK, 3);
    return o;
  };
  I.star = (r, c) => {
    const pts = [];
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 18 : 42; pts.push([50 + Math.cos(a) * rr, 54 + Math.sin(a) * rr]); }
    const o = []; shape(r, o, pts, c || C.LBLUE, c || C.LBLUE, 4, 4); return o;
  };
  // Crédito: uma ficha hexagonal com o "C" no meio.
  I.coin = (r) => {
    const o = [], p = [];
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; p.push([50 + Math.cos(a) * 38, 50 + Math.sin(a) * 38]); }
    shape(r, o, p, C.YELLOW, C.YELLOW, 4, 4);
    pl(r, o, [[62, 36], [40, 36], [36, 50], [40, 64], [62, 64]], false, C.PAPER, 5);
    return o;
  };
  I.sword = (r, c) => {
    const o = [];
    shape(r, o, [[44, 74], [44, 22], [50, 8], [56, 22], [56, 74]], c || C.LBLUE, c || C.LBLUE, 3.4, 3.4, 0.3);
    ln(r, o, 50, 18, 50, 70, C.INK, 2);
    ln(r, o, 28, 76, 72, 76, C.GRAY, 7); ln(r, o, 50, 78, 50, 94, C.GRAY, 8); return o;
  };
  // Serra circular (o ícone "axe": o machado do Caderno).
  I.axe = (r, c) => {
    const o = [], p = [];
    for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, rr = k % 2 ? 26 : 34; p.push([58 + Math.cos(a) * rr, 40 + Math.sin(a) * rr]); }
    ln(r, o, 30, 94, 52, 48, C.GRAY, 7);
    shape(r, o, p, c || C.GRAY, c || C.GRAY, 3.4);
    ov(r, o, 58, 40, 7, 7, C.INK, 3); return o;
  };
  I.shield = (r, c) => {
    const o = [], p = [[18, 16], [82, 16], [80, 52], [50, 90], [20, 52]];
    shape(r, o, p, c || C.LBLUE, c || C.LBLUE, 4); bolt(r, o, 50, 48, 1.5, C.INK); return o;
  };
  I.armor = (r, c) => {
    const o = [], p = [[30, 16], [42, 10], [58, 10], [70, 16], [88, 32], [76, 44], [70, 36], [70, 90], [30, 90], [30, 36], [24, 44], [12, 32]];
    shape(r, o, p, c || C.LBLUE, c || C.LBLUE, 4);
    rect(r, o, 40, 36, 20, 16, C.INK, C.YELLOW, 3, 3);
    for (const y of [62, 74]) ln(r, o, 34, y, 66, y, C.INK, 2.4);
    return o;
  };
  // Célula (o ícone "potion": a poção do Caderno): uma pilha com a carga pintada.
  I.potion = (r, c) => {
    const o = [];
    rect(r, o, 42, 8, 16, 10, C.GRAY, C.GRAY, 3.4);
    pl(r, o, box(28, 18, 44, 74), true, C.INK, 4);
    fill(r, o, box(32, 46, 36, 42), c || C.RED, 3.4, 0, 0.9);
    bolt(r, o, 50, 34, 0.8, c || C.RED); return o;
  };
  // Chip de dados (o ícone "scroll": o pergaminho do Caderno): programas e missões.
  I.scroll = (r, c) => {
    const o = [];
    shape(r, o, box(26, 26, 48, 48), c || C.PURPLE, c || C.PURPLE, 3.4, 4);
    for (const k of [0, 1, 2, 3]) {
      const t = 32 + k * 12;
      ln(r, o, t, 26, t, 14, C.GRAY, 3); ln(r, o, t, 74, t, 86, C.GRAY, 3);
      ln(r, o, 26, t, 14, t, C.GRAY, 3); ln(r, o, 74, t, 86, t, C.GRAY, 3);
    }
    rect(r, o, 40, 40, 20, 20, C.INK, C.INK, 3, 2.4);
    return o;
  };
  I.bag = (r) => {
    const o = [], p = [[30, 34], [70, 34], [86, 72], [76, 92], [24, 92], [14, 72]];
    shape(r, o, p, C.ORANGE, C.ORANGE, 4); ov(r, o, 50, 30, 16, 8, C.ORANGE, 4);
    rect(r, o, 38, 56, 24, 16, C.INK, C.YELLOW, 3, 3); return o;
  };
  // Mapa: uma tela de holograma com a rota.
  I.map = (r) => {
    const o = [];
    shape(r, o, box(10, 16, 80, 64), C.LBLUE, C.BLUE, 4, 5);
    ln(r, o, 50, 80, 50, 92, C.GRAY, 4); ln(r, o, 30, 92, 70, 92, C.GRAY, 4);
    pl(r, o, [[20, 70], [30, 52], [46, 58], [56, 40], [74, 44], [80, 26]], false, C.YELLOW, 3.4);
    led(r, o, 80, 26, 6, C.RED); return o;
  };
  // Caixote de suprimentos com as listras de aviso (o baú do Caderno).
  I.chest = (r) => {
    const o = [];
    shape(r, o, box(14, 30, 72, 56), C.OCHRE, C.OCHRE, 4);
    for (const x of [22, 38, 54, 70]) ln(r, o, x, 30, x + 10, 44, C.YELLOW, 3);
    ln(r, o, 14, 44, 86, 44, C.OCHRE, 3);
    rect(r, o, 42, 54, 16, 14, C.INK, C.LBLUE, 3, 2.4); return o;
  };
  I.die = (r, c) => {
    const o = []; shape(r, o, box(20, 20, 60, 60), c || C.RED, c || C.RED, 4, 5);
    for (const [x, y] of [[35, 35], [50, 50], [65, 65]]) led(r, o, x, y, 8, C.INK); return o;
  };
  I.fire = (r) => { const o = []; campfire(r, o, 50, 92, 3.1); return o; };
  I.sun = (r) => {
    const o = [];
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ln(r, o, 50 + Math.cos(a) * 30, 50 + Math.sin(a) * 30, 50 + Math.cos(a) * 44, 50 + Math.sin(a) * 44, C.ORANGE, 4); }
    blob(r, o, 50, 50, 22, 22, C.YELLOW, C.YELLOW, 4, 4); return o;
  };
  I.moon = (r) => {
    const o = [], p = [];
    for (let k = 0; k <= 12; k++) { const a = -2.2 + k / 12 * 4.4; p.push([50 + Math.cos(a) * 38, 50 + Math.sin(a) * 38]); }
    for (let k = 12; k >= 0; k--) { const a = -1.75 + k / 12 * 3.5; p.push([64 + Math.cos(a) * 26, 50 + Math.sin(a) * 30]); }
    shape(r, o, p.map(([x, y]) => [100 - x, y]), C.LBLUE, C.LBLUE, 4, 4); return o;
  };
  // Lanterna (o ícone "torch": a tocha do Caderno); ligada, solta o facho.
  I.torch = (r, lit) => {
    const o = [];
    shape(r, o, [[40, 56], [60, 56], [58, 94], [42, 94]], C.GRAY, C.GRAY, 3.4, 3.4);
    shape(r, o, [[34, 40], [66, 40], [60, 56], [40, 56]], C.INK, C.GRAY, 3.4, 3);
    if (lit !== 'off') {
      shape(r, o, [[36, 38], [22, 6], [78, 6], [64, 38]], C.YELLOW, C.YELLOW, 3, 3.4);
      led(r, o, 50, 46, 8, C.YELLOW);
    }
    return o;
  };
  I.sound = (r, on) => {
    const o = []; shape(r, o, [[14, 38], [32, 38], [54, 18], [54, 82], [32, 62], [14, 62]], C.LBLUE, C.GRAY, 4);
    if (on) { pl(r, o, [[66, 34], [74, 50], [66, 66]], false, C.LBLUE, 4); pl(r, o, [[78, 22], [90, 50], [78, 78]], false, C.LBLUE, 4); }
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
  // Cada tipo de dado tem a sua silhueta: d4 triângulo, d6 quadrado, d8
  // losango, d10 pipa, d12 pentágono, d20 hexágono (como no Caderno).
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
    pl(r, o, p, true, color, 4);
    fill(r, o, p, color, 6, 0.8, 0.35);
    if (sides === 20) pl(r, o, [[50, 24], [76, 66], [24, 66]], true, color, 1.6);
    return (dieCache[key] = o);
  };
  // Dado na bandeja: a forma em neon + o número no meio, em letra de terminal.
  A.drawDie = (ctx, sides, value, x, y, size, color, rot = 0, dim = false) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha = 1;
    ctx.save(); ctx.scale(size / 100, size / 100); ctx.translate(-50, -50);
    S.drawAll(ctx, A.dieStrokes(sides, color), 1);
    ctx.restore();
    ctx.fillStyle = dim ? C.GRAY : C.INK;
    ctx.font = `${Math.round(size * (sides === 4 ? 0.44 : 0.56))}px ${S.HAND}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(value), 0, sides === 4 ? size * 0.12 : size * 0.02);
    ctx.restore();
  };

  // ---------- mapa ----------
  // Um quadrado do mapa (64×64 no mundo), já na posição do mundo. Inclui o que
  // está em cima dele (estação, bot, caixote...) e o "X" se já foi resolvido.
  // Os terrenos do código são os do Caderno (AGUA, AREIA, CAMPO, MATA,
  // PANTANO, MONTANHA); cada bioma desenha os seus (ver World.BIOMAS).
  A.tile = (world, tx, ty, T, state) => {
    dim = TERRAIN_DIM;
    try { return tile(world, tx, ty, T, state); } finally { dim = 1; }
  };
  function tile(world, tx, ty, T, state) {
    const r = S.rng(S.hash(world.seed, tx, ty, 77)), o = [];
    const x0 = tx * T, y0 = ty * T, Wd = World;
    const ter = (x, y) => (x < 0 || y < 0 || x >= world.W || y >= world.H) ? world.fora : world.t[y * world.W + x];
    const t = ter(tx, ty);
    const rx = (a, b) => a + r() * (b - a);

    // Bioma da zona (bases não têm: só parede e chão).
    const bio = world.biome || 'campos';
    const pencil = (color, w = 1.8, alpha = 0.9) => ({ color, w, kind: 'pencil', alpha: alpha * dim, j: 0.6 });
    // Cor do "líquido" de cada bioma: óleo, refrigerante, água gelada, lodo e aço derretido.
    const LIQ = { campos: [C.PURPLE, C.PINK], deserto: [C.LBLUE, C.BLUE], neve: [C.LBLUE, C.INK], pantano: [C.LGREEN, C.GREEN], vulcao: [C.ORANGE, C.RED] }[bio] || [C.LBLUE, C.BLUE];
    if (t === Wd.AGUA) {
      const [lc, wc] = LIQ;
      for (let k = 0; k < 9; k++) {
        const y = y0 + 4 + k * 7;
        if (k % 2) continue;   // uma linha sim, outra não: o líquido é fundo, não parede
        o.push(S.line(r, x0 - 1, y, x0 + T + 1, y, { color: lc, w: 1.6, kind: 'pencil', alpha: (bio === 'vulcao' ? 0.6 : 0.4) * dim, j: 1 }));
      }
      if (r() < 0.35) {
        const wx = rx(x0 + 10, x0 + 40), wy = rx(y0 + 14, y0 + 50);
        pl(r, o, [[wx, wy], [wx + 4, wy - 3], [wx + 8, wy], [wx + 12, wy - 3], [wx + 16, wy]], false, wc, 1.8);
      }
      if (bio === 'campos' && r() < 0.3) ov(r, o, rx(x0 + 14, x0 + T - 14), rx(y0 + 14, y0 + T - 14), 6, 3, C.LBLUE, 1.6);
      if (bio === 'vulcao' && r() < 0.4) led(r, o, rx(x0 + 12, x0 + T - 12), rx(y0 + 12, y0 + T - 12), 4, C.YELLOW);
      if (bio === 'pantano' && r() < 0.4) ov(r, o, rx(x0 + 12, x0 + T - 12), rx(y0 + 12, y0 + T - 12), 3, 3, C.LGREEN, 1.8);
      if (bio === 'neve' && r() < 0.3) {
        const fx = rx(x0 + 12, x0 + T - 24), fy = rx(y0 + 14, y0 + T - 16);
        pl(r, o, [[fx, fy], [fx + 10, fy - 4], [fx + 16, fy + 2], [fx + 8, fy + 7]], true, C.INK, 1.8);
      }
    } else {
      // Costa: linha cheia nas bordas que dão para o líquido. Os vértices
      // tremem pelo hash do próprio vértice, então as bordas vizinhas se emendam.
      const coast = LIQ[0];
      const vj = (vx, vy) => [vx * T + (S.hash(world.seed, vx, vy, 1) / 4294967296 - 0.5) * 9, vy * T + (S.hash(world.seed, vx, vy, 2) / 4294967296 - 0.5) * 9];
      const edges = [[0, -1, tx, ty, tx + 1, ty], [0, 1, tx, ty + 1, tx + 1, ty + 1], [-1, 0, tx, ty, tx, ty + 1], [1, 0, tx + 1, ty, tx + 1, ty + 1]];
      for (const [dx, dy, ax, ay, bx, by] of edges) {
        if (ter(tx + dx, ty + dy) !== Wd.AGUA) continue;
        o.push(S.poly(r, [vj(ax, ay), vj(bx, by)], false, { color: coast, w: 2.4, j: 4, step: 5, alpha: 0.85 }));
      }
    }

    const obj = world.obj.get(ty * world.W + tx);
    const busy = obj && obj.type !== 'monstro' && obj.type !== 'bau';
    if (t === Wd.AREIA) {
      // Cascalho, areia de silício, gelo (rachaduras), lama e escória.
      if (bio === 'neve') {
        for (let k = 0; k < 3; k++) {
          const x = rx(x0 + 8, x0 + T - 20), y = rx(y0 + 8, y0 + T - 8);
          o.push(S.poly(r, [[x, y], [x + 6, y + 3], [x + 10, y - 1], [x + 16, y + 2]], false, pencil(C.LBLUE, 1.6)));
        }
      } else {
        const col = { campos: C.GRAY, deserto: C.OCHRE, pantano: C.BROWN, vulcao: C.GRAY }[bio] || C.GRAY;
        for (let k = 0; k < 9; k++) { const x = rx(x0 + 6, x0 + T - 6), y = rx(y0 + 6, y0 + T - 6); ln(r, o, x, y, x + 1.6, y, col, 2.2); }
        if (bio === 'vulcao' && r() < 0.4) led(r, o, rx(x0 + 10, x0 + T - 10), rx(y0 + 10, y0 + T - 10), 2.6, C.ORANGE);
      }
    } else if (t === Wd.CAMPO) {
      if (bio === 'deserto') {
        if (!busy) {
          const n = r() < 0.7 ? 1 + (r() < 0.4 ? 1 : 0) : 0;
          for (let k = 0; k < n; k++) {
            const x = rx(x0 + 6, x0 + T - 30), y = rx(y0 + 18, y0 + T - 8);
            o.push(S.poly(r, [[x, y], [x + 8, y - 5], [x + 16, y - 6], [x + 24, y - 2]], false, pencil(C.OCHRE, 2)));
          }
        }
      } else if (bio === 'neve') {
        if (!busy && r() < 0.45) {
          const x = rx(x0 + 14, x0 + T - 14), y = rx(y0 + 14, y0 + T - 14);
          for (const [a, b] of [[-4, 0], [-2, -3.5], [2, -3.5]]) o.push(S.line(r, x + a, y + b, x - a, y - b, pencil(C.LBLUE, 1.6)));
        }
      } else {
        // Ferro-Velho e Fundição: chão de chapas rebitadas (a chapa quente
        // da Fundição tem um risco em brasa). Brejo Tóxico: chão podre, às
        // vezes com a cabeça de um robô desligado.
        const plate = bio === 'pantano' ? null : bio === 'vulcao' ? '#4a2416' : '#1c2a55';
        if (plate) {
          pl(r, o, box(x0 + 3, y0 + 3, T - 6, T - 6), true, plate, 1.6);
          for (const [x, y] of [[x0 + 8, y0 + 8], [x0 + T - 8, y0 + 8], [x0 + 8, y0 + T - 8], [x0 + T - 8, y0 + T - 8]]) rivet(r, o, x, y, plate);
          if (bio === 'vulcao' && !busy && r() < 0.35) {
            const x = rx(x0 + 10, x0 + T - 30), y = rx(y0 + 14, y0 + T - 14);
            o.push(S.poly(r, [[x, y], [x + 7, y + 4], [x + 12, y - 2], [x + 20, y + 3]], false, pencil(C.ORANGE, 1.8)));
          }
        } else if (!busy) {
          if (r() < 0.6) {
            const x = rx(x0 + 8, x0 + T - 30), y = rx(y0 + 12, y0 + T - 12);
            o.push(S.poly(r, [[x, y], [x + 7, y + 4], [x + 12, y - 2], [x + 20, y + 3]], false, pencil(C.BROWN, 1.8)));
          }
          if (r() < 0.2) {
            const gx = rx(x0 + 16, x0 + T - 16), gy = rx(y0 + 30, y0 + T - 8);
            rect(r, o, gx - 9, gy - 16, 18, 16, C.GRAY, C.GRAY, 2, 3);
            ln(r, o, gx - 6, gy - 12, gx - 2, gy - 8, C.RED, 1.6); ln(r, o, gx - 2, gy - 12, gx - 6, gy - 8, C.RED, 1.6);
            ln(r, o, gx + 2, gy - 12, gx + 6, gy - 8, C.RED, 1.6); ln(r, o, gx + 6, gy - 12, gx + 2, gy - 8, C.RED, 1.6);
          }
        }
      }
    } else if (t === Wd.MATA) {
      const props = [];
      // O Caderno punha 2 ou 3 árvores; em neon, 1 ou 2 enfeites já enchem o quadrado.
      const n = obj ? (obj.type === 'masmorra' ? 0 : 1) : 1 + (r() < 0.5 ? 1 : 0);
      for (let k = 0; k < n; k++) props.push([rx(x0 + 14, x0 + T - 14), rx(y0 + 12, y0 + T - 20), rx(9, 12)]);
      props.sort((a, b) => a[1] - b[1]);
      for (const [cx, cy, rr] of props) {
        if (bio === 'deserto') {
          // Painel solar quebrado num poste.
          ln(r, o, cx, cy + 2, cx, cy + rr + 8, C.GRAY, 2.4);
          const p = [[cx - rr, cy - 2], [cx + rr - 2, cy - rr + 2], [cx + rr, cy + 4], [cx - rr + 2, cy + 8]];
          shape(r, o, p, C.LBLUE, C.BLUE, 2, 3);
          ln(r, o, cx - 1, cy - rr / 2 + 1, cx + 1, cy + 6, C.INK, 1.2);
        } else if (bio === 'neve') {
          // Radiador congelado: aletas verticais com neve em cima.
          rect(r, o, cx - rr, cy - rr / 2, rr * 2, rr + 8, C.GRAY, C.GRAY, 2, 3);
          for (let k = 1; k < 4; k++) ln(r, o, cx - rr + k * rr / 2, cy - rr / 2, cx - rr + k * rr / 2, cy + rr / 2 + 8, C.INK, 1.2);
          pl(r, o, [[cx - rr - 2, cy - rr / 2], [cx, cy - rr / 2 - 5], [cx + rr + 2, cy - rr / 2]], false, C.LBLUE, 2.6);
        } else if (bio === 'pantano') {
          // Canos retorcidos com uma válvula.
          pl(r, o, [[cx - rr, cy + rr + 8], [cx - rr, cy - 2], [cx + 2, cy - 2], [cx + 2, cy - rr], [cx + rr, cy - rr]], false, C.OLIVE, 3.2);
          ov(r, o, cx + 2, cy - 2, 3.6, 3.6, C.RED, 2);
          if (r() < 0.5) ov(r, o, cx + rr + 2, cy - rr - 4, 2.4, 2.4, C.LGREEN, 1.6);
        } else if (bio === 'vulcao') {
          // Guindaste queimado: torre e braço com o gancho.
          ln(r, o, cx - 4, cy + rr + 8, cx - 4, cy - rr, C.GRAY, 2.6);
          ln(r, o, cx - 8, cy - rr, cx + rr, cy - rr, C.GRAY, 2.4);
          ln(r, o, cx + rr - 2, cy - rr, cx + rr - 2, cy - 2, C.INK, 1.4);
          pl(r, o, [[cx + rr - 5, cy - 4], [cx + rr - 2, cy], [cx + rr + 1, cy - 4]], false, C.ORANGE, 1.8);
        } else {
          // Ferro-Velho: pilha de sucata com uma engrenagem.
          const p = [[cx - rr - 2, cy + rr + 6], [cx - rr + 4, cy - 2], [cx - 2, cy - rr], [cx + 6, cy - 4], [cx + rr + 2, cy + rr + 6]];
          shape(r, o, p, C.GRAY, C.GRAY, 2.2, 3.4);
          wheel(r, o, cx - 2, cy + 4, 5, C.ORANGE);
          ln(r, o, cx + 4, cy + 2, cx + rr, cy - 6, C.LBLUE, 1.8);
        }
      }
    } else if (t === Wd.PANTANO) {
      if (bio === 'deserto') {
        // Areia movediça: um redemoinho.
        const cx = x0 + T / 2 + (r() - 0.5) * 10, cy = y0 + T / 2 + (r() - 0.5) * 10, sp = [];
        for (let k = 0; k <= 16; k++) { const a = k * 0.75, rr = 2 + k * 1.2; sp.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7]); }
        o.push(S.poly(r, sp, false, pencil(C.OCHRE, 1.8)));
      } else if (bio === 'neve') {
        for (let k = 0; k < 3; k++) {
          const x = rx(x0 + 4, x0 + T - 26), y = rx(y0 + 14, y0 + T - 6);
          o.push(S.poly(r, [[x, y], [x + 6, y - 6], [x + 14, y - 7], [x + 22, y - 1]], false, pencil(C.LBLUE, 2.2)));
        }
      } else if (bio === 'vulcao') {
        // Respiro de vapor: uma grade no chão soltando fumaça.
        const x = rx(x0 + 18, x0 + T - 18), y = rx(y0 + T - 18, y0 + T - 8);
        pl(r, o, box(x - 9, y - 3, 18, 6), true, C.ORANGE, 2);
        for (const d of [-4, 0, 4]) ln(r, o, x + d, y - 3, x + d, y + 3, C.ORANGE, 1.4);
        o.push(S.poly(r, [[x, y - 4], [x - 5, y - 12], [x + 3, y - 20], [x - 4, y - 28], [x + 2, y - 36]], false, pencil(C.GRAY, 2.2, 0.8)));
      } else {
        // Graxa do Ferro-Velho e brejo químico do Brejo Tóxico (este com bolhas).
        const col = bio === 'pantano' ? C.GREEN : C.PURPLE;
        for (let k = 0; k < 5; k++) {
          const x = rx(x0 + 6, x0 + T - 22), y = rx(y0 + 10, y0 + T - 6);
          o.push(S.line(r, x, y, x + rx(10, 18), y, { color: col, w: k < 2 ? 2.2 : 1.6, kind: k < 2 ? 'pen' : 'pencil', alpha: 0.8 * dim }));
        }
        if (!busy) for (let k = 0; k < 2; k++) ov(r, o, rx(x0 + 10, x0 + T - 10), rx(y0 + 10, y0 + T - 10), 2.6, 2.4, bio === 'pantano' ? C.LGREEN : C.PINK, 1.6);
      }
    } else if (t === Wd.PAREDE) {
      // Parede de base: só a que encosta no chão é desenhada (o maciço fica
      // em preto), pintada de linhas com a borda acesa.
      const floor = (x, y) => ter(x, y) === Wd.CHAO;
      let touch = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (floor(tx + dx, ty + dy)) touch = true;
      if (!touch) return o;
      fill(r, o, box(x0, y0, T, T), C.BLUE, 6, 0, 0.35);
      for (const [dx, dy, ax, ay, bx, by] of [[0, -1, 0, 0, 1, 0], [0, 1, 0, 1, 1, 1], [-1, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1]])
        if (floor(tx + dx, ty + dy)) ln(r, o, x0 + ax * T, y0 + ay * T, x0 + bx * T, y0 + by * T, C.LBLUE, 2.8);
    } else if (t === Wd.CHAO) {
      pl(r, o, box(x0 + 4, y0 + 4, T - 8, T - 8), true, '#18244a', 1.4);
    } else if (t === Wd.MONTANHA) {
      const n = r() < 0.5 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const cx = n === 1 ? x0 + T / 2 + (r() - 0.5) * 8 : x0 + 18 + k * 28, by = y0 + T - 8 - k * 4;
        const hw = n === 1 ? rx(24, 28) : rx(16, 19), py = by - rx(34, 46);
        if (bio === 'campos') {
          // Prédio em ruínas: caixa de topo quebrado com janelas (umas acesas).
          const w = hw * 1.3;
          pl(r, o, [[cx - w / 2, by], [cx - w / 2, py + 6], [cx - w / 6, py], [cx + w / 8, py + 8], [cx + w / 2, py + 3], [cx + w / 2, by]], false, C.BLUE, 2.4);
          for (let yy = py + 12; yy < by - 6; yy += 8) for (const xx of [cx - w / 4, cx + w / 8]) {
            const on = r() < 0.25;
            pl(r, o, box(xx - 2, yy, 4, 4), true, on ? C.YELLOW : '#22305e', 1.4);
          }
          continue;
        }
        if (bio === 'pantano') {
          // Chaminé de fábrica com fumaça verde.
          pl(r, o, [[cx - 6, by], [cx - 4, py], [cx + 4, py], [cx + 6, by]], false, C.GRAY, 2.4);
          for (const y of [py + 8, py + 16]) ln(r, o, cx - 5, y, cx + 5, y, C.RED, 1.6);
          o.push(S.poly(r, [[cx, py - 2], [cx + 6, py - 10], [cx + 2, py - 18], [cx + 10, py - 26]], false, pencil(C.LGREEN, 2.4, 0.7)));
          continue;
        }
        if (bio === 'vulcao') {
          // Alto-forno: torre larga com a boca em brasa.
          pl(r, o, [[cx - hw * 0.7, by], [cx - hw * 0.45, py], [cx + hw * 0.45, py], [cx + hw * 0.7, by]], false, C.BROWN, 2.6);
          fill(r, o, [[cx - hw * 0.3, py + 4], [cx + hw * 0.3, py + 4], [cx + hw * 0.36, py + 14], [cx - hw * 0.36, py + 14]], C.ORANGE, 2.4, 0, 0.9);
          ln(r, o, cx - hw * 0.55, by - 10, cx + hw * 0.55, by - 10, C.GRAY, 1.8);
          continue;
        }
        if (bio === 'deserto') {
          // Rochedo de topo chato, com listras.
          const top = py + 10;
          pl(r, o, [[cx - hw, by], [cx - hw * 0.6, top], [cx + hw * 0.6, top], [cx + hw, by]], false, C.ORANGE, 2.6);
          fill(r, o, [[cx - hw * 0.6, top + 2], [cx + hw * 0.6, top + 2], [cx + hw - 2, by - 1], [cx - hw + 2, by - 1]], C.OCHRE, 4, -0.9, 0.4);
          ln(r, o, cx - hw * 0.75, top + (by - top) * 0.45, cx + hw * 0.75, top + (by - top) * 0.45, C.YELLOW, 1.8);
          continue;
        }
        // Picos nevados.
        pl(r, o, [[cx - hw, by], [cx, py], [cx + hw, by]], false, C.BLUE, 2.6);
        fill(r, o, [[cx, py + 3], [cx + hw - 2, by - 1], [cx + 2, by - 1]], C.BLUE, 3.4, -0.9, 0.5);
        pl(r, o, [[cx - hw * 0.28, py + (by - py) * 0.28], [cx - hw * 0.1, py + (by - py) * 0.36], [cx + hw * 0.08, py + (by - py) * 0.26], [cx + hw * 0.28, py + (by - py) * 0.32]], false, C.INK, 1.8);
      }
    }

    if (!obj) return o;
    dim = 1;   // o que está em cima do quadrado (estação, bot, caixote...) brilha inteiro
    const cx = x0 + T / 2, i = ty * world.W + tx;
    if (obj.type === 'fogueira') {
      // Estação de recarga: cúpula de abrigo, o poste de bobinas e um androide sentado.
      const tents = [C.RED, C.BLUE, C.GREEN, C.PURPLE, C.ORANGE, C.PINK];
      const dome = [];
      for (let k = 0; k <= 8; k++) { const a = Math.PI + k * Math.PI / 8; dome.push([x0 + 18 + Math.cos(a) * 15, y0 + 50 + Math.sin(a) * 24]); }
      shape(r, o, dome, tents[obj.n % tents.length], tents[obj.n % tents.length], 2.4, 3.4);
      pl(r, o, [[x0 + 13, y0 + 50], [x0 + 13, y0 + 38], [x0 + 23, y0 + 38], [x0 + 23, y0 + 50]], false, C.INK, 2);
      campfire(r, o, x0 + 46, y0 + 56, 0.8);
      rect(r, o, x0 + 52, y0 + 28, 9, 8, C.INK, C.GRAY, 2, 2);
      ln(r, o, x0 + 56, y0 + 36, x0 + 57, y0 + 48, C.INK, 2.2);
      ln(r, o, x0 + 57, y0 + 48, x0 + 50, y0 + 50, C.INK, 2.2);
      ln(r, o, x0 + 56, y0 + 42, x0 + 50, y0 + 44, C.INK, 2);
      ln(r, o, x0 + 60, y0 + 30, x0 + 61, y0 + 50, C.LBLUE, 2);
      o.push(S.text(World.FOGUEIRAS[obj.n], cx, y0 - 2, 18, C.INK));
    } else if (obj.type === 'covil') {
      // Ninho do Mecadragão: portão de hangar listrado, com a porta escura.
      const p = [[x0 + 2, y0 + T - 6], [x0 + 6, y0 + 22], [cx, y0 + 8], [x0 + T - 6, y0 + 22], [x0 + T - 2, y0 + T - 6]];
      shape(r, o, p, C.RED, C.RED, 2.6, 4.4);
      const hole = box(cx - 16, y0 + 28, 32, T - 34);
      pl(r, o, hole, true, C.YELLOW, 2.4); fill(r, o, hole, C.PAPER, 2, 0, 0.9);
      for (const x of [cx - 12, cx - 2, cx + 8]) ln(r, o, x, y0 + 28, x + 6, y0 + 36, C.YELLOW, 2);
      o.push(S.text('Ninho do Mecadragão', cx, y0 - 2, 19, C.RED));
      if (state.won) cross(r, o, x0, y0, T);
    } else if (obj.type === 'passagem' || obj.type === 'volta') {
      // Portal: um anel de luz com uma seta. Por aqui a IA carrega a próxima
      // zona (passagem) ou a anterior (volta).
      const fwd = obj.type === 'passagem', cy = y0 + T / 2 + 6;
      const col = fwd ? C.PINK : C.GREEN, a = fwd ? 1 : -1;
      ov(r, o, cx, cy, 24, 20, col, 3);
      ov(r, o, cx, cy, 17, 14, col, 1.8);
      fillE(r, o, cx, cy, 17, 14, col, 4, 0, 0.35);
      ln(r, o, cx - 12 * a, cy, cx + 12 * a, cy, C.INK, 3.4);
      pl(r, o, [[cx + 4 * a, cy - 7], [cx + 12 * a, cy], [cx + 4 * a, cy + 7]], false, C.INK, 3.4);
      // A volta fica encostada na primeira estação, então o nome vai embaixo
      // para não cobrir o nome da estação.
      const nome = World.BIOMAS[obj.to].nome;
      o.push(S.text(fwd ? nome + ' →' : '← ' + nome, cx, fwd ? y0 + 4 : y0 + T + 12, 17, col));
      // Enquanto o guardião não for vencido, ele fica em pé na frente do portal.
      if (fwd && !state.guarda) {
        for (const s of S.xform(A.monster('guarda_' + (obj.to - 1)), 0.62, x0 + 1, y0 + 4)) o.push(s);
        o.push(S.text(World.GUARDIOES[obj.to - 1][1], cx, y0 + T + 12, 16, C.RED));
      }
    } else if (obj.type === 'placa') {
      // Placa de holograma: um poste com a tela e a seta vermelha para onde
      // segue o caminho até a próxima zona (ou o ninho).
      ln(r, o, cx, y0 + 30, cx + 1, y0 + T - 6, C.GRAY, 3.4);
      const tela = box(cx - 20, y0 + 14, 40, 20);
      shape(r, o, tela, C.LBLUE, C.BLUE, 2.4, 3.4);
      const a = obj.dir * Math.PI / 4, ux = Math.cos(a), uy = Math.sin(a), my = y0 + 24;
      const bx = cx + ux * 13, by = my + uy * 8;
      ln(r, o, cx - ux * 13, my - uy * 8, bx, by, C.RED, 3);
      const h = (ang, k) => [bx - Math.cos(a + ang) * k, by - Math.sin(a + ang) * k * 0.7];
      pl(r, o, [h(0.6, 8), [bx, by], h(-0.6, 8)], false, C.RED, 3);
      o.push(S.text(obj.to < 0 ? 'Ninho' : World.BIOMAS[obj.to].nome, cx, y0 + 6, 14, C.LBLUE));
    } else if (obj.type === 'arena') {
      // Arena PvP: um ringue de cordas de laser visto de cima, com 4 postes e
      // duas lâminas cruzadas no meio.
      const q = [[x0 + 8, y0 + 18], [x0 + T - 8, y0 + 18], [x0 + T - 8, y0 + T - 6], [x0 + 8, y0 + T - 6]];
      fill(r, o, q, C.PURPLE, 4.4, 0, 0.35);
      for (const k of [0, 1]) pl(r, o, q.map(([x, y]) => [x + (k ? 3 : 0) * Math.sign(cx - x), y + (k ? 3 : 0) * Math.sign(y0 + 40 - y)]), true, C.RED, 2);
      for (const [x, y] of q) ln(r, o, x, y + 2, x, y - 10, C.GRAY, 3.4);
      ln(r, o, cx - 12, y0 + 26, cx + 12, y0 + 50, C.LBLUE, 3); ln(r, o, cx + 12, y0 + 26, cx - 12, y0 + 50, C.LBLUE, 3);
      o.push(S.text('Arena', cx, y0 + 2, 18, C.RED));
    } else if (obj.type === 'monstro' && obj.noite && !state.noite) {
      // Bot da noite (Brejo Tóxico): de dia a IA não desenha nada.
    } else if (obj.type === 'miragem') {
      // Miragem (Deserto de Silício): igual a um caixote ou um bot de verdade, até sumir.
      if (!state.dead.has(i)) {
        if (obj.look === 'bau') for (const s of S.xform(A.icon('chest'), 0.38, x0 + 13, y0 + 16)) o.push(s);
        else for (const s of S.xform(A.monster(obj.kind), 0.5, x0 + 7, y0 + 8)) o.push(s);
      }
    } else if (obj.type === 'porta') {
      // Porta blindada: listras de perigo e uma fechadura de cartão; aberta, some.
      if (!state.opened.has('chave')) {
        shape(r, o, box(x0 + 8, y0 + 8, T - 16, T - 14), C.YELLOW, C.OCHRE, 2.6, 4);
        for (const x of [14, 26, 38]) ln(r, o, x0 + x, y0 + 10, x0 + x + 12, y0 + 26, C.PAPER, 2.4);
        rect(r, o, cx - 7, y0 + 34, 14, 12, C.INK, C.RED, 2.2, 2.4);
      }
    } else if (obj.type === 'chave') {
      // Cartão de acesso (a "chave" do código).
      if (!state.opened.has('chave')) {
        shape(r, o, box(cx - 16, y0 + 22, 32, 20), C.YELLOW, C.YELLOW, 2.6, 2.4);
        rect(r, o, cx - 12, y0 + 26, 9, 7, C.INK, C.OCHRE, 1.8, 2);
        ln(r, o, cx - 1, y0 + 36, cx + 12, y0 + 36, C.INK, 1.6);
        o.push(S.text('Cartão', cx, y0 + 4, 17, C.YELLOW));
      }
    } else if (obj.type === 'armadilha') {
      // Escondida: só aparece (espetos de metal) depois que alguém pisa.
      if (state.opened.has(i)) for (let k = 0; k < 4; k++) {
        const x = x0 + 14 + k * 12;
        shape(r, o, [[x - 5, y0 + T - 14], [x, y0 + 24], [x + 5, y0 + T - 14]], C.RED, C.GRAY, 2, 2.4);
      }
    } else if (obj.type === 'enigma') {
      // Terminal de enigmas na parede: uma tela com cara; resolvido, ganha um X.
      shape(r, o, box(x0 + 10, y0 + 12, T - 20, T - 20), C.PURPLE, C.PURPLE, 2.6, 4);
      led(r, o, cx - 9, y0 + 28, 6, C.INK); led(r, o, cx + 9, y0 + 28, 6, C.INK);
      pl(r, o, box(cx - 8, y0 + 40, 16, 6), true, C.INK, 2.4);
      o.push(S.text('?', cx + 22, y0 + 12, 26, C.YELLOW, { font: S.HAND }));
      if (state.opened.has(i)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'descer' || obj.type === 'subir' || obj.type === 'saida' || obj.type === 'atalho') {
      // Elevador: duas portas de correr e a seta de para onde ele vai.
      const down = obj.type === 'descer';
      const col = { descer: C.RED, subir: C.GREEN, saida: C.GREEN, atalho: C.PURPLE }[obj.type];
      shape(r, o, box(cx - 20, y0 + 16, 40, T - 22), col, col, 2.4, 4);
      ln(r, o, cx, y0 + 16, cx, y0 + T - 6, C.INK, 2);
      const ay = y0 + 34;
      pl(r, o, down ? [[cx - 8, ay - 4], [cx, ay + 6], [cx + 8, ay - 4]] : [[cx - 8, ay + 6], [cx, ay - 4], [cx + 8, ay + 6]], false, C.INK, 3);
      const txt = { descer: 'Andar de baixo', subir: 'Subir', saida: 'Saída', atalho: 'Elevador secreto' }[obj.type];
      o.push(S.text(txt, cx, y0 + 4, 16, col));
    } else if (obj.type === 'monstro') {
      for (const s of S.xform(A.monster(obj.kind), 0.5, x0 + 7, y0 + 8)) o.push(s);
      // Grupo: a IA escreve quantos são em cima do bot.
      if (obj.n > 1) o.push(S.text('×' + obj.n, x0 + T - 10, y0 + 12, 24, C.RED));
      if (state.dead.has(i)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'bau') {
      for (const s of S.xform(A.icon('chest'), 0.38, x0 + 13, y0 + 16)) o.push(s);
      if (state.opened.has(i)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'npc') {
      const cols = [C.BLUE, C.GREEN, C.PURPLE, C.ORANGE, C.PINK];
      for (const s of S.xform(A.npc(r, cols[(obj.quest ? obj.tier : obj.fala) % cols.length], obj.quest), 0.56, x0 + 4, y0 + 6)) o.push(s);
      if (obj.quest) o.push(S.text(obj.nome, cx, y0 - 2, 17, C.INK));
      // Quem o herói desligou fica riscado para sempre.
      if (state.mortos && state.mortos.has(i)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'masmorra') {
      // Entrada da base: casamata de concreto, porta escura e a coroa em cima.
      const bunker = [[cx - 26, y0 + T - 6], [cx - 20, y0 + 22], [cx + 20, y0 + 22], [cx + 26, y0 + T - 6]];
      shape(r, o, bunker, C.GRAY, C.GRAY, 2.6, 4);
      const door = box(cx - 10, y0 + 34, 20, T - 40);
      pl(r, o, door, true, C.LBLUE, 2.4); fill(r, o, door, C.PAPER, 2, 0, 0.9);
      led(r, o, cx + 6, y0 + 44, 3, C.RED);
      crown(r, o, cx, y0 + 19, 0.8);
      o.push(S.text(World.MASMORRAS[obj.kind][0], cx, y0 - 2, 18, C.INK));
      if (state.cleared && state.cleared.has(obj.n)) cross(r, o, x0, y0, T);
    } else if (obj.type === 'chefe') {
      for (const s of S.xform(A.monster('chefe_' + obj.kind), 0.6, x0 + 2, y0 + 2)) o.push(s);
      o.push(S.text(World.MASMORRAS[obj.kind][1], cx, y0 - 2, 18, C.RED));
      if (state.dead.has(i)) cross(r, o, x0, y0, T);
    }
    return o;
  }

  // O "X" vermelho que a IA faz em cima do que já foi resolvido.
  function cross(r, o, x0, y0, T) {
    ln(r, o, x0 + 12, y0 + 12, x0 + T - 12, y0 + T - 12, C.RED, 3);
    ln(r, o, x0 + T - 12, y0 + 12, x0 + 12, y0 + T - 12, C.RED, 3);
  }
  A.cross = (tx, ty, T, seed) => { const o = []; cross(S.rng(seed), o, tx * T, ty * T, T); return o; };

  // Rastro do scanner entre o centro de dois quadrados (o caminho que você fez).
  A.trail = (ax, ay, bx, by, T, seed) => {
    const r = S.rng(seed), o = [];
    const x1 = ax * T + T / 2, y1 = ay * T + T / 2 + 8, x2 = bx * T + T / 2, y2 = by * T + T / 2 + 8;
    for (let k = 0; k < 4; k++) {
      const t1 = k / 4 + 0.04, t2 = t1 + 0.13;
      o.push(S.line(r, x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1, x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2, { color: C.LBLUE, w: 2, kind: 'pencil', alpha: 0.6, j: 0.6 }));
    }
    return o;
  };

  // Golpe na luta: riscos rápidos de laser em cima do bot.
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
