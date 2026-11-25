// sketch.js — traços de neon usados por todo o jogo (Terminal de Aventuras).
//
// POR QUE: o jogo é um terminal de fliperama neon: a IA desenha o mapa em
// linhas de luz conforme o scanner do robô alcança. Nada é imagem pronta:
// mapa, bots, ícones e dados são listas de "traços" geradas por código e
// desenhadas aos poucos (a IA traçando enquanto você anda) ou de uma vez.
//
// ESTRATÉGIA: a mesma biblioteca do Caderno de Aventuras (mesma API, então o
// resto do código não muda), com outro acabamento: a "mão" quase não treme
// (WOBBLE), o círculo fecha certinho, e a "pintura" de lápis virou linhas
// horizontais finas, como as linhas de varredura de um monitor CRT.
// Um traço é { pts:[x,y,x,y...], color, w, kind, alpha }.
// kind 'pen' = linha de neon cheia, 'pencil' = linha de varredura (fina e
// translúcida), 'text' = letra de terminal.
// Toda aleatoriedade vem de um rng com semente, então o mesmo pedaço do mapa
// sai igual quando o jogo é recarregado. O brilho em volta das linhas não é
// daqui: é um passe de bloom no fim do quadro (game.js).
(function () {
  'use strict';
  const S = {};

  // Os nomes das cores são os do Caderno (o código inteiro usa estes), mas os
  // valores são neon sobre fundo preto: PAPER é o fundo do terminal, INK é a
  // linha principal (ciano claro), LINE é a grade e MARGIN a barra lateral.
  S.C = {
    PAPER: '#05060f', INK: '#bff7ff', BLUE: '#3d7bff', LBLUE: '#00e5ff', GREEN: '#39ff6a',
    LGREEN: '#b6ff3a', BROWN: '#d9822b', RED: '#ff3355', ORANGE: '#ff8a1f', YELLOW: '#ffe94a',
    PURPLE: '#b04dff', GRAY: '#7d88b8', PINK: '#ff2bd6', OCHRE: '#ffb340', OLIVE: '#8fbf3a',
    SKIN: '#ffd0a8', LINE: '#142350', MARGIN: '#ff2bd6',
  };
  S.HAND = "'VT323', 'Courier New', monospace";
  S.TITLE = "'VT323', 'Courier New', monospace";
  // Quanto a "mão" treme (1 = o Caderno). Neon é quase reto, mas não 100%:
  // um tremor mínimo deixa o traço vivo.
  const WOBBLE = 0.12;

  // mulberry32: rápido e com semente (Math.random não serve para repetir o desenho).
  S.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  S.hash = function () {
    let h = 0x811c9dc5;
    for (let i = 0; i < arguments.length; i++) {
      h = Math.imul(h ^ (arguments[i] | 0), 16777619);
      h ^= h >>> 13;
    }
    return h >>> 0;
  };

  function mk(pts, o) {
    return { pts, color: o.color || S.C.INK, w: o.w || 2, kind: o.kind || 'pen', alpha: o.alpha == null ? 1 : o.alpha };
  }

  // Liga os pontos com uma "barriga" suave e um tremor leve, como a mão faz.
  // As pontas de cada segmento não se mexem: assim duas linhas que dividem um
  // vértice (a costa entre dois quadrados do mapa) continuam emendadas.
  function wobble(r, pts, j, step) {
    j *= WOBBLE;
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const x1 = pts[i][0], y1 = pts[i][1], x2 = pts[i + 1][0], y2 = pts[i + 1][1];
      const d = Math.hypot(x2 - x1, y2 - y1) || 1;
      const n = Math.max(1, Math.ceil(d / step));
      const nx = -(y2 - y1) / d, ny = (x2 - x1) / d;
      const bow = (r() - 0.5) * j * Math.min(1.6, d / 25);
      for (let k = i === 0 ? 0 : 1; k <= n; k++) {
        const t = k / n;
        const off = Math.sin(t * Math.PI) * bow + (k > 0 && k < n ? (r() - 0.5) * j * 0.5 : 0);
        out.push(x1 + (x2 - x1) * t + nx * off, y1 + (y2 - y1) * t + ny * off);
      }
    }
    return out;
  }

  S.line = (r, x1, y1, x2, y2, o = {}) => mk(wobble(r, [[x1, y1], [x2, y2]], o.j ?? 1.4, o.step ?? 6), o);

  S.poly = (r, pts, closed, o = {}) => mk(wobble(r, closed ? pts.concat([pts[0]]) : pts, o.j ?? 1.4, o.step ?? 6), o);

  // Círculo de neon: fecha certinho e é um polígono de poucos lados (o ar
  // de gráfico vetorial de fliperama). Começa num ângulo sorteado só para a
  // IA não desenhar todos os círculos a partir do mesmo ponto.
  S.ellipse = (r, cx, cy, rx, ry, o = {}) => {
    const a0 = r() * Math.PI * 2;
    const n = Math.max(8, Math.min(28, Math.ceil((rx + ry) * Math.PI / 7)));
    const pts = [];
    for (let k = 0; k <= n; k++) {
      const a = a0 + Math.PI * 2 * k / n;
      pts.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
    }
    return mk(pts, o);
  };

  S.ellipsePoly = (cx, cy, rx, ry, n = 18) => {
    const out = [];
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return out;
  };

  // Pintura de lápis de cor: hachuras paralelas recortadas pelo polígono.
  // ESTRATÉGIA: gira o polígono até as hachuras ficarem horizontais, corta
  // cada linha de varredura nas bordas e desgira. Linhas seguidas com um
  // único trecho viram um zigue-zague contínuo, como quem pinta sem tirar o
  // lápis do papel.
  // Neon: a pintura é sempre em linhas horizontais (ângulo 0), sem zigue-zague,
  // como as linhas de varredura de um CRT; o ângulo pedido é ignorado.
  S.hatch = (r, poly, o = {}) => {
    o = { ...o, zigzag: false };
    const ang = 0, sp = (o.spacing ?? 4) * 0.85, ca = Math.cos(ang), sa = Math.sin(ang);
    const P = poly.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
    const back = (x, y) => [x * ca - y * sa, x * sa + y * ca];
    let y0 = Infinity, y1 = -Infinity;
    for (const p of P) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const opt = { color: o.color, w: (o.w ?? 1.5) * 0.7, kind: o.kind ?? 'pencil', alpha: (o.alpha ?? 0.7) * 0.75 };
    const ins = o.inset ?? 0.8, j = o.j ?? 0.7, out = [];
    let zig = null, dir = 1;
    const flush = () => { if (zig && zig.length >= 2) out.push(mk(wobble(r, zig, j, 8), opt)); zig = null; };
    for (let y = y0 + sp * (0.3 + r() * 0.5); y < y1; y += sp) {
      const xs = [];
      for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length];
        if ((a[1] <= y) !== (b[1] <= y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((m, n) => m - n);
      const segs = [];
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const a = xs[i] + ins * (r() * 1.6 - 0.3), b = xs[i + 1] - ins * (r() * 1.6 - 0.3);
        if (b - a > 0.6) segs.push([a, b]);
      }
      if (segs.length === 1 && o.zigzag !== false) {
        const p1 = back(segs[0][0], y), p2 = back(segs[0][1], y);
        if (!zig) { zig = []; dir = 1; }
        if (dir > 0) zig.push(p1, p2); else zig.push(p2, p1);
        dir = -dir;
      } else {
        flush();
        for (const [a, b] of segs) out.push(mk(wobble(r, [back(a, y), back(b, y)], j, 8), opt));
      }
    }
    flush();
    return out;
  };

  S.text = (text, x, y, size, color, o = {}) => ({
    kind: 'text', text, x, y, size, color, font: o.font || S.TITLE, align: o.align || 'center', alpha: o.alpha ?? 1, w: 0,
  });

  function prep(s) {
    if (s.len != null) return;
    if (s.kind === 'text') { s.len = s.text.length * s.size * 0.5; return; }
    const p = s.pts, c = [0];
    let L = 0;
    for (let i = 2; i < p.length; i += 2) { L += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]); c.push(L); }
    s.cum = c; s.len = L;
  }

  // Desenha um traço até a fração `prog` do comprimento e devolve a ponta
  // (onde fica a caneta do mestre durante a animação).
  S.draw = function (ctx, s, prog = 1) {
    prep(s);
    if (s.kind === 'text') {
      ctx.font = `${s.size}px ${s.font}`;
      const w = ctx.measureText(s.text).width;
      const x0 = s.align === 'left' ? s.x : s.x - w / 2;
      ctx.save();
      if (prog < 1) { ctx.beginPath(); ctx.rect(x0 - 2, s.y - s.size * 1.1, w * prog + 2, s.size * 1.6); ctx.clip(); }
      ctx.globalAlpha = s.alpha; ctx.fillStyle = s.color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(s.text, x0, s.y);
      ctx.restore();
      return { x: x0 + w * prog, y: s.y - s.size * 0.3 };
    }
    const p = s.pts, c = s.cum, end = s.len * prog;
    if (p.length < 4) return null;
    const pencil = s.kind === 'pencil';
    let hx = p[0], hy = p[1];
    // Neon: ponta quadrada e quina viva; a linha de varredura é uma passada só.
    ctx.strokeStyle = s.color; ctx.lineCap = 'square'; ctx.lineJoin = 'miter'; ctx.miterLimit = 3;
    for (let pass = 0; pass < 1; pass++) {
      const ox = 0, oy = 0;
      ctx.globalAlpha = s.alpha * (pencil ? 0.8 : 1);
      ctx.lineWidth = s.w * (pencil ? 0.9 : 0.85);
      ctx.beginPath();
      ctx.moveTo(p[0] + ox, p[1] + oy);
      for (let i = 1; i < c.length; i++) {
        if (c[i] >= end) {
          const t = (end - c[i - 1]) / ((c[i] - c[i - 1]) || 1);
          hx = p[2 * i - 2] + (p[2 * i] - p[2 * i - 2]) * t;
          hy = p[2 * i - 1] + (p[2 * i + 1] - p[2 * i - 1]) * t;
          ctx.lineTo(hx + ox, hy + oy);
          break;
        }
        hx = p[2 * i]; hy = p[2 * i + 1];
        ctx.lineTo(hx + ox, hy + oy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return { x: hx, y: hy };
  };

  S.total = function (list) {
    if (list._total == null) { let t = 0; for (const s of list) { prep(s); t += s.len; } list._total = t; }
    return list._total;
  };

  // Desenha a lista inteira até a fração `prog` do comprimento somado.
  S.drawAll = function (ctx, list, prog = 1) {
    if (prog >= 1) { for (const s of list) S.draw(ctx, s, 1); return null; }
    let left = S.total(list) * prog, head = null;
    for (const s of list) {
      if (left <= 0) break;
      if (left >= s.len) { S.draw(ctx, s, 1); left -= s.len; }
      else { head = S.draw(ctx, s, left / (s.len || 1)); if (head) head.color = s.color; left = 0; }
    }
    return head;
  };

  // Escala e desloca uma lista (a mesma arte serve no mapa e na luta).
  S.xform = (list, sc, ox, oy) => list.map(s => s.kind === 'text'
    ? { ...s, x: s.x * sc + ox, y: s.y * sc + oy, size: s.size * sc, len: undefined }
    : { ...s, pts: s.pts.map((v, i) => v * sc + (i % 2 ? oy : ox)), w: Math.max(0.7, s.w * Math.sqrt(sc)), len: undefined, cum: undefined });

  S.bbox = list => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of list) {
      if (s.kind === 'text') {
        prep(s);
        x0 = Math.min(x0, s.x - s.len); x1 = Math.max(x1, s.x + s.len);
        y0 = Math.min(y0, s.y - s.size * 1.2); y1 = Math.max(y1, s.y + s.size * 0.5);
        continue;
      }
      const p = s.pts;
      for (let i = 0; i < p.length; i += 2) {
        if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i];
        if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1];
      }
    }
    return { x0: x0 - 3, y0: y0 - 3, x1: x1 + 3, y1: y1 + 3 };
  };

  (typeof window !== 'undefined' ? window : globalThis).Sketch = S;
})();
