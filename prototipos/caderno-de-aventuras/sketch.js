// sketch.js — traços à mão (caneta e lápis de cor) usados por todo o jogo.
//
// POR QUE: o jogo imita o RPG desenhado no caderno da escola. Nada é imagem
// pronta: mapa, monstros, ícones e dados são listas de "traços" geradas por
// código, com a tremidinha da mão, e desenhadas aos poucos (o mestre
// desenhando enquanto você anda) ou de uma vez.
//
// ESTRATÉGIA: um traço é { pts:[x,y,x,y...], color, w, kind, alpha }.
// kind 'pen' = caneta (linha cheia), 'pencil' = lápis de cor (duas passadas
// translúcidas, que deixam a textura falhada), 'text' = letra de mão.
// Toda aleatoriedade vem de um rng com semente, então o mesmo pedaço do mapa
// sai igual quando o jogo é recarregado.
(function () {
  'use strict';
  const S = {};

  S.C = {
    PAPER: '#fbf7ec', INK: '#2b2f45', BLUE: '#2f66c9', LBLUE: '#6fa6e8', GREEN: '#2e9446',
    LGREEN: '#7fc463', BROWN: '#8a5a2b', RED: '#d6383a', ORANGE: '#ef8a22', YELLOW: '#e9be2c',
    PURPLE: '#8448c4', GRAY: '#7b7d88', PINK: '#e46ea4', OCHRE: '#c49a40', OLIVE: '#77863a',
    SKIN: '#e9a87c', LINE: '#9cc3e8', MARGIN: '#e58a8a',
  };
  S.HAND = "'Patrick Hand', 'Comic Sans MS', cursive";
  S.TITLE = "'Caveat', 'Patrick Hand', cursive";

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

  // Círculo de mão: começa num ângulo qualquer e passa um pouco do ponto de
  // partida, sem fechar perfeito (é o que denuncia que foi desenhado à mão).
  S.ellipse = (r, cx, cy, rx, ry, o = {}) => {
    const a0 = r() * Math.PI * 2, sweep = Math.PI * 2 + 0.2 + r() * 0.35;
    const n = Math.max(10, Math.ceil((rx + ry) * Math.PI / 4));
    const ph = r() * 6.28, pts = [];
    for (let k = 0; k <= n; k++) {
      const a = a0 + sweep * k / n;
      const f = 1 + Math.sin(a * 2 + ph) * 0.04 + (r() - 0.5) * 0.025 + (k / n) * 0.06;
      pts.push(cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f);
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
  S.hatch = (r, poly, o = {}) => {
    const ang = o.angle ?? 0.8, sp = o.spacing ?? 4, ca = Math.cos(ang), sa = Math.sin(ang);
    const P = poly.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
    const back = (x, y) => [x * ca - y * sa, x * sa + y * ca];
    let y0 = Infinity, y1 = -Infinity;
    for (const p of P) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const opt = { color: o.color, w: o.w ?? 1.5, kind: o.kind ?? 'pencil', alpha: o.alpha ?? 0.7 };
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
    ctx.strokeStyle = s.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let pass = 0; pass < (pencil ? 2 : 1); pass++) {
      const ox = pass ? 0.7 : 0, oy = pass ? -0.6 : 0;
      ctx.globalAlpha = s.alpha * (pencil ? (pass ? 0.35 : 0.62) : 1);
      ctx.lineWidth = s.w * (pass ? 0.6 : 1);
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
