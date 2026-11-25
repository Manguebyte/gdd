// neon-bots.js — os robôs do Androide da Fábrica, desenhados em código.
//
// POR QUE: o Guerreiro da Masmorra (app) desenha tudo com folhas de pixel art
// (personagens com 3 ou 4 animações, o herói em 8 direções). No Androide da
// Fábrica todo mundo é robô, em neon 8-bit, e nenhuma folha nova foi
// desenhada à mão: cada folha é gerada aqui, na hora, com o MESMO tamanho de
// quadro, o MESMO número de quadros e o corpo na MESMA caixa do sprite
// original. Assim o motor do jogo (frameCount, drawActor, headBox...) usa as
// folhas geradas sem saber que mudaram.
//
// ESTRATÉGIA: um robô é um "rig" de peças (tronco, cabeça, braços, pernas,
// arma) num espaço de 100 unidades de altura, com os pés em y = 0 e olhando
// para +x. Uma pose (pose()) diz o ângulo de cada peça num instante t de 0 a
// 1 da animação. Cada quadro é desenhado num canvas pequeno (1 pixel = vários
// pixels do quadro), a transparência é arredondada (sem antisserrilhado) e o
// quadro é ampliado sem suavizar: é o que dá o pixel 8-bit. Peças: miolo
// escuro e contorno aceso na cor do robô; o brilho em volta vem do bloom do
// neon-skin.js. Os tipos de corpo (humanoide, gosma, árvore, serpente,
// aranha, caveira, peixe, tartaruga, quadrúpede) estão em BODY; qual unidade
// usa qual corpo está em SPECS.
(function () {
  'use strict';

  // ---------------------------------------------------------------- paleta
  const PAL = {
    bg: '#05060f', cyan: '#00e5ff', blue: '#3d7bff', magenta: '#ff2bd6', pink: '#ff6ec7', purple: '#b04dff',
    yellow: '#ffe94a', orange: '#ff8a1f', red: '#ff3355', green: '#39ff6a', lime: '#b6ff3a', white: '#e8fbff',
    steel: '#9aa6d6', gray: '#6c779f', brown: '#d9822b',
  };
  // As 5 cores de fábrica (as "cores de masmorra" do jogo).
  const DG = { red: PAL.red, black: PAL.steel, blue: PAL.cyan, purple: PAL.purple, yellow: PAL.yellow };

  // Mistura uma cor com o fundo: o miolo escuro das peças.
  function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function dark(c, k = 0.22) {
    const [r, g, b] = hex(c), [R, G, B] = hex(PAL.bg);
    return `rgb(${Math.round(R + (r - R) * k)},${Math.round(G + (g - G) * k)},${Math.round(B + (b - B) * k)})`;
  }

  // ---------------------------------------------------------------- primitivas
  // Todas desenham no espaço do rig (100 unidades = altura do robô). `LW` é a
  // espessura de 1 pixel do canvas pequeno, em unidades do rig.
  let LW = 1;
  function part(x, path, col, fillK = 0.22) {
    x.beginPath(); path(); x.fillStyle = dark(col, fillK); x.fill();
    x.lineWidth = LW * 1.2; x.strokeStyle = col; x.stroke();
  }
  const rect = (x, a, b, w, h) => () => x.rect(a, b, w, h);
  function poly(x, pts) { return () => { x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.closePath(); }; }
  function ell(x, cx, cy, rx, ry) { return () => x.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2); }
  function lit(x, path, col) { x.beginPath(); path(); x.fillStyle = col; x.fill(); }   // peça acesa (olho, visor, LED)
  function line(x, x0, y0, x1, y1, col, w = 1.4) { x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.lineWidth = LW * w; x.strokeStyle = col; x.stroke(); }
  // Segmento de membro: um retângulo que sai de (x0, y0) no ângulo `a`
  // (0 = para baixo, positivo = para a frente). Devolve a ponta.
  function limb(x, x0, y0, a, len, wid, col) {
    x.save(); x.translate(x0, y0); x.rotate(-a);
    part(x, rect(x, -wid / 2, 0, wid, len), col);
    x.restore();
    return [x0 + Math.sin(a) * len, y0 + Math.cos(a) * len];
  }

  // ---------------------------------------------------------------- armas
  // Desenhadas na mão (hx, hy), apontando no ângulo `a` do braço.
  function weapon(x, kind, hx, hy, a, P, pose) {
    const c = P.acc || PAL.cyan;
    const dirx = Math.sin(a), diry = Math.cos(a);
    const along = (d) => [hx + dirx * d, hy + diry * d];
    x.save();
    switch (kind) {
      case 'sword': case 'knife': case 'saber': {
        const L = kind === 'knife' ? 14 : kind === 'saber' ? 40 : 32;
        const [ex, ey] = along(L);
        line(x, hx, hy, ex, ey, c, 3.4); line(x, hx, hy, ex, ey, PAL.white, 1.2);
        const px = -diry * 5, py = dirx * 5; line(x, hx - px, hy - py, hx + px, hy + py, PAL.gray, 2.4);
        break;
      }
      case 'lance': case 'harpoon': {
        const [bx, by] = along(-22), [ex, ey] = along(58);
        line(x, bx, by, ex, ey, PAL.gray, 2.2);
        const px = -diry * 4, py = dirx * 4, [tx, ty] = along(70);
        part(x, poly(x, [[ex - px, ey - py], [tx, ty], [ex + px, ey + py]]), c);
        break;
      }
      case 'bow': {
        // Arco de energia: um arco aceso na frente da mão e a corda.
        const r = 20, ang = Math.atan2(diry, dirx);
        x.beginPath(); x.arc(hx, hy, r, ang - 1.1, ang + 1.1); x.lineWidth = LW * 2.2; x.strokeStyle = c; x.stroke();
        const p1 = [hx + Math.cos(ang - 1.1) * r, hy + Math.sin(ang - 1.1) * r], p2 = [hx + Math.cos(ang + 1.1) * r, hy + Math.sin(ang + 1.1) * r];
        const pull = pose.pull || 0, mx = hx - dirx * (2 + pull * 12), my = hy - diry * (2 + pull * 12);
        line(x, p1[0], p1[1], mx, my, PAL.white, 0.9); line(x, p2[0], p2[1], mx, my, PAL.white, 0.9);
        if (pose.fire) { const [fx, fy] = along(18 + pose.fire * 40); line(x, fx - dirx * 12, fy - diry * 12, fx, fy, c, 2.4); }
        break;
      }
      case 'staff': {
        const [bx, by] = along(-30), [ex, ey] = along(26);
        line(x, bx, by, ex, ey, PAL.gray, 2.2);
        lit(x, ell(x, ex, ey, 5.5 + (pose.glow || 0) * 3, 5.5 + (pose.glow || 0) * 3), c);
        break;
      }
      case 'hammer': case 'club': case 'axe': {
        const [ex, ey] = along(30);
        line(x, hx, hy, ex, ey, PAL.gray, 2.6);
        x.translate(ex, ey); x.rotate(-a);
        if (kind === 'axe') part(x, poly(x, [[0, -6], [14, -12], [16, 6], [0, 4]]), c);
        else part(x, rect(x, -9, -8, 18, 14), c);
        break;
      }
      case 'torch': {
        const [ex, ey] = along(14);
        line(x, hx, hy, ex, ey, PAL.gray, 2.4);
        const f = 0.7 + 0.3 * Math.sin((pose.time || 0) * 40);
        lit(x, poly(x, [[ex - 5, ey], [ex, ey + 14 * f * (diry < 0 ? 1 : -1)], [ex + 5, ey]]), PAL.orange);
        lit(x, ell(x, ex, ey - 2 * Math.sign(diry || 1), 2.5, 2.5), PAL.yellow);
        break;
      }
      case 'tnt': {
        x.translate(hx, hy); x.rotate(-a);
        part(x, rect(x, -4, 0, 8, 16), PAL.red);
        line(x, 0, 16, 2, 22, PAL.white, 1);
        lit(x, ell(x, 2, 23, 2, 2), PAL.yellow);
        break;
      }
      case 'scythe': {
        const [bx, by] = along(-24), [ex, ey] = along(34);
        line(x, bx, by, ex, ey, PAL.gray, 2.2);
        x.translate(ex, ey); x.rotate(-a);
        part(x, poly(x, [[0, 0], [20, 6], [26, 18], [16, 10]]), c);
        break;
      }
      case 'paddle': {
        const [ex, ey] = along(30);
        line(x, hx, hy, ex, ey, PAL.gray, 2.2);
        x.translate(ex, ey); x.rotate(-a);
        part(x, ell(x, 0, 8, 6, 11), c);
        break;
      }
      case 'rock': {
        if (!pose.fire) { const [ex, ey] = along(6); part(x, ell(x, ex, ey, 6, 5), PAL.gray); }
        break;
      }
      case 'claws': {
        for (const k of [-1, 0, 1]) { const ox = -diry * k * 3, oy = dirx * k * 3; const [ex, ey] = along(9); line(x, hx + ox, hy + oy, ex + ox, ey + oy, c, 1.4); }
        break;
      }
    }
    x.restore();
  }

  // ---------------------------------------------------------------- poses
  // anim: idle | run | attack | attack2 | guard | heal | grow | jump | parry | tired | dodge
  const ease = k => k * k * (3 - 2 * k);
  function pose(anim, t, P) {
    const s = Math.sin(t * Math.PI * 2), p = { bob: 0, lean: 0, armF: 0.25, armB: -0.15, legF: 0, legB: 0, crouch: 0, y: 0, glow: 0, time: t };
    if (anim === 'idle' || anim === 'guard' && P.noGuard) { p.bob = s * 1.6; p.armF = 0.25 + s * 0.06; p.armB = -0.18 - s * 0.05; }
    else if (anim === 'run' || anim === 'walk') { p.legF = s * 0.62; p.legB = -s * 0.62; p.armF = 0.2 - s * 0.55; p.armB = s * 0.55; p.bob = -Math.abs(s) * 3; p.lean = 0.1; }
    else if (anim === 'attack') {
      if (P.ranged) {   // tiro: puxa a corda e solta; ou arremessa
        p.armF = 1.57; p.armB = 1.3;
        if (t < 0.6) p.pull = ease(t / 0.6); else { p.pull = 0; p.fire = (t - 0.6) / 0.4; }
        if (P.weapon === 'rock' || P.weapon === 'harpoon' || P.weapon === 'tnt') { p.armF = t < 0.5 ? -2.2 * ease(t / 0.5) : -2.2 + 3.6 * ease((t - 0.5) / 0.5); p.armB = 0.6; p.fire = t > 0.6 ? (t - 0.6) / 0.4 : 0; }
        if (P.weapon === 'staff') { p.armF = 1.2 + Math.sin(t * Math.PI) * 0.4; p.glow = Math.sin(t * Math.PI); }
      } else if (t < 0.45) { const k = ease(t / 0.45); p.armF = 0.25 - 2.65 * k; p.lean = -0.12 * k; p.armB = -0.3 * k; }
      else if (t < 0.65) { const k = ease((t - 0.45) / 0.2); p.armF = -2.4 + 3.9 * k; p.lean = -0.12 + 0.34 * k; p.slash = k; p.armB = -0.3; }
      else { const k = ease((t - 0.65) / 0.35); p.armF = 1.5 - 1.25 * k; p.lean = 0.22 - 0.22 * k; }
    }
    else if (anim === 'attack2') {   // estocada
      if (t < 0.4) { const k = ease(t / 0.4); p.armF = 0.25 + 0.8 * k; p.lean = -0.1 * k; p.reach = -6 * k; }
      else if (t < 0.6) { const k = ease((t - 0.4) / 0.2); p.armF = 1.05 + 0.5 * k; p.reach = -6 + 22 * k; p.lean = 0.25 * k; p.slash = k; }
      else { const k = ease((t - 0.6) / 0.4); p.armF = 1.55 - 1.3 * k; p.reach = 16 * (1 - k); p.lean = 0.25 * (1 - k); }
    }
    else if (anim === 'guard' || anim === 'parry') { const k = anim === 'parry' ? Math.sin(Math.min(1, t * 1.6) * Math.PI / 2) : 1; p.armB = 1.35 * k; p.armF = 0.6 * k; p.crouch = 5 * k; p.lean = -0.06 * k; p.shieldUp = k; }
    else if (anim === 'heal') { const k = Math.sin(t * Math.PI); p.armF = -2.5 * k + 0.25 * (1 - k); p.armB = -2.5 * k - 0.15 * (1 - k); p.glow = k; }
    else if (anim === 'jump') { const k = Math.sin(t * Math.PI); p.y = -22 * k; p.legF = 0.8 * k; p.legB = -0.3 * k; p.armF = -0.6 * k + 0.25; p.armB = -0.9 * k; p.crouch = 6 * (1 - k) * (t < 0.15 || t > 0.85 ? 1 : 0); }
    else if (anim === 'tired') { p.lean = 0.32; p.bob = Math.sin(t * Math.PI * 4) * 1.4; p.armF = 0.05; p.armB = 0.05; p.crouch = 6; }
    else if (anim === 'dodge') { const k = Math.sin(t * Math.PI); p.lean = 0.45 * k; p.crouch = 10 * k; p.legF = 0.7 * k; p.legB = -0.7 * k; p.armB = -0.8 * k; }
    else if (anim === 'grow') { p.reveal = t; }
    return p;
  }

  // ---------------------------------------------------------------- corpos
  const BODY = {};

  // Cabeça (centro do topo em hx, hy = pescoço). `view`: side | front | back.
  function head(x, P, hx, hy, view, dir) {
    const c = P.col, w = (P.headW || 22), h = (P.headH || 20), top = hy - h;
    const kind = P.head || 'box';
    if (kind === 'dome') part(x, () => x.ellipse(hx, hy - h * 0.5, w / 2, h / 2 + 2, 0, 0, Math.PI * 2), c);
    else if (kind === 'skull') part(x, poly(x, [[hx - w / 2, top], [hx + w / 2, top], [hx + w / 2, hy - 6], [hx + w / 4, hy], [hx - w / 4, hy], [hx - w / 2, hy - 6]]), c);
    else if (kind === 'hood') part(x, poly(x, [[hx - w / 2 - 3, hy + 2], [hx - w / 2, top + 4], [hx, top - 6], [hx + w / 2, top + 4], [hx + w / 2 + 3, hy + 2]]), c);
    else if (kind === 'helm') { part(x, rect(x, hx - w / 2, top, w, h), c); part(x, rect(x, hx - w / 2 - 2, top + h * 0.35, w + 4, 3), c); }
    else part(x, rect(x, hx - w / 2, top, w, h), c);
    if (P.horns) for (const k of [-1, 1]) part(x, poly(x, [[hx + k * w * 0.35, top + 2], [hx + k * (w * 0.5 + 8), top - 10], [hx + k * w * 0.2, top + 4]]), P.acc || PAL.white);
    if (P.crown) part(x, poly(x, [[hx - 9, top], [hx - 10, top - 9], [hx - 4, top - 4], [hx, top - 11], [hx + 4, top - 4], [hx + 10, top - 9], [hx + 9, top]]), PAL.yellow);
    if (P.antenna) { line(x, hx + 3, top, hx + 5, top - 10, PAL.gray, 1.4); lit(x, ell(x, hx + 5, top - 11, 2.2, 2.2), P.acc || PAL.red); }
    if (view === 'back') { line(x, hx - w * 0.3, hy - h * 0.55, hx + w * 0.3, hy - h * 0.55, dark(c, 0.6), 1); return; }
    const eye = P.eye || PAL.yellow, ey = hy - h * 0.55;
    if (kind === 'skull') { lit(x, rect(x, hx - w * 0.32, ey - 2, 5, 4), PAL.red); lit(x, rect(x, hx + w * 0.32 - 5, ey - 2, 5, 4), PAL.red); return; }
    if (kind === 'hood') { lit(x, rect(x, hx - 6, ey - 1, 4, 3), eye); lit(x, rect(x, hx + 2, ey - 1, 4, 3), eye); return; }
    if (P.cyclops) { lit(x, ell(x, hx + (view === 'side' ? dir * 4 : 0), ey, 4, 4), eye); return; }
    if (view === 'side') lit(x, rect(x, dir > 0 ? hx : hx - w * 0.5, ey - 2, w * 0.5, 4), eye);
    else lit(x, rect(x, hx - w * 0.38, ey - 2, w * 0.76, 4), eye);
  }

  // Humanoide: o corpo da maioria (cavaleiros, arqueiros, lanceiros, monges...).
  BODY.humanoid = (x, P, p, view, dir) => {
    const c = P.col, tw = P.torsoW || 28, th = P.torsoH || 32, lh = P.legH || 34, aw = P.armW || 7;
    const by = -lh + (p.crouch || 0) + p.bob + (p.y || 0);    // quadril
    x.save(); x.translate(0, 0);
    const shoulderY = by - th + 4;
    // Capa e mochila atrás de tudo.
    if (P.cape) part(x, poly(x, [[-tw * 0.4 * dir, shoulderY], [tw * 0.45 * -dir - dir * 6, by + 10], [tw * 0.1 * -dir, by + 14]]), P.acc || PAL.magenta, 0.35);
    // Pernas: rodas, esteira, flutuador, túnica ou pernas.
    const legs = P.legs || 'legs';
    const hipF = view === 'side' ? 3 * dir : tw * 0.22, hipB = view === 'side' ? -3 * dir : -tw * 0.22;
    if (legs === 'legs') {
      const lf = view === 'side' ? p.legF * dir : 0, lb = view === 'side' ? p.legB * dir : 0;
      limb(x, hipB, by, lb, lh - (p.crouch || 0) - (p.y || 0) * 0, P.legW || 8, dark(c, 0.8));
      limb(x, hipF, by, lf, lh - (p.crouch || 0), P.legW || 8, c);
    } else if (legs === 'wheel') {
      line(x, 0, by, 0, -10, PAL.gray, 2.4);
      part(x, ell(x, 0, -10, 10, 10), PAL.gray); lit(x, ell(x, 0, -10, 2.4, 2.4), c);
    } else if (legs === 'tread') {
      part(x, poly(x, [[-tw * 0.7, -14], [tw * 0.7, -14], [tw * 0.8, -6], [tw * 0.6, 0], [-tw * 0.6, 0], [-tw * 0.8, -6]]), PAL.gray);
      for (let k = -2; k <= 2; k++) x.strokeRect && line(x, k * tw * 0.25, -11, k * tw * 0.25, -3, c, 1);
      line(x, 0, by, 0, -14, PAL.gray, 3);
    } else if (legs === 'hover' || legs === 'robe') {
      const bot = legs === 'robe' ? -2 : -10 + Math.sin(p.time * Math.PI * 2) * 2;
      part(x, poly(x, [[-tw * 0.45, by], [tw * 0.45, by], [tw * 0.62, bot], [-tw * 0.62, bot]]), legs === 'robe' ? c : PAL.gray);
      if (legs === 'hover') lit(x, ell(x, 0, bot + 4, tw * 0.35, 2.5), PAL.cyan);
    }
    // Rabo (lagarto).
    if (P.tail) part(x, poly(x, [[-dir * tw * 0.3, by - 6], [-dir * (tw * 0.6 + 22), by + 14], [-dir * tw * 0.2, by]]), c);
    x.save(); x.translate(0, by); x.rotate(-(p.lean || 0) * dir); x.translate(0, -by);
    // Braço de trás (escudo, se houver).
    const shBx = view === 'side' ? -tw * 0.3 * dir : -tw / 2 - aw / 2;
    const ab = view === 'side' ? p.armB * dir : (view === 'back' ? -0.15 : -(0.15 + Math.abs(p.armB) * 0.3));
    const [hbx, hby] = limb(x, shBx, shoulderY, ab, P.armL || 26, aw, view === 'side' ? dark(c, 0.8) : c);
    if (P.shield && view !== 'back') {
      const sx = view === 'side' ? hbx + dir * 4 : hbx, sy = hby - (p.shieldUp ? 12 * p.shieldUp : 0);
      part(x, ell(x, sx, sy, view === 'side' ? 6 : 11, 13), P.acc || PAL.cyan, 0.35);
      lit(x, ell(x, sx, sy, 2.4, 2.4), P.acc || PAL.cyan);
    }
    // Tronco: caixa com o núcleo aceso no peito.
    const bulk = P.bulk || 1;
    part(x, poly(x, [[-tw / 2 * bulk, by - th], [tw / 2 * bulk, by - th], [tw / 2 * 0.86 * bulk, by], [-tw / 2 * 0.86 * bulk, by]]), c);
    if (view !== 'back') lit(x, rect(x, (view === 'side' ? 3 * dir : 0) - 3, by - th * 0.62, 6, 6), P.core || PAL.yellow);
    else { part(x, rect(x, -tw * 0.32, by - th * 0.9, tw * 0.64, th * 0.6), PAL.gray); lit(x, rect(x, -2, by - th * 0.75, 4, 4), P.core || PAL.yellow); }
    // Cabeça.
    head(x, P, view === 'side' ? 2 * dir : 0, by - th, view, dir);
    // Braço da frente com a arma.
    const shFx = view === 'side' ? tw * 0.18 * dir : tw / 2 + aw / 2;
    let af = view === 'side' ? p.armF * dir : (view === 'back' ? 0.15 : 0.15 + Math.max(0, p.armF) * 0.2);
    if (view !== 'side' && (p.slash || p.armF < -0.5)) af = p.armF * 0.6;   // de frente/de costas: ergue a arma
    const reach = p.reach || 0;
    const [hfx, hfy] = limb(x, shFx + (view === 'side' ? reach * dir * 0.3 : 0), shoulderY, af, (P.armL || 26) + (view === 'side' ? reach * 0.5 : 0), aw, c);
    if (P.weapon) weapon(x, P.weapon, hfx, hfy, af + (P.weapon === 'bow' || P.weapon === 'staff' ? 0 : 0.35 * (view === 'side' ? dir : 1)), P, p);
    if (P.weapon2) weapon(x, P.weapon2, hbx, hby, ab + 0.35, P, p);
    // Rastro do golpe.
    if (p.slash && p.slash < 1) { x.beginPath(); x.arc(0, shoulderY, 46, -1.4, 0.9); x.lineWidth = LW * 2.4; x.strokeStyle = P.acc || PAL.cyan; x.globalAlpha = 0.5 * (1 - p.slash); x.stroke(); x.globalAlpha = 1; }
    // Brilho de cura / feitiço.
    if (p.glow) { x.globalAlpha = 0.65 * p.glow; x.beginPath(); x.ellipse(0, by - th / 2, 26 + p.glow * 14, 30 + p.glow * 14, 0, 0, Math.PI * 2); x.lineWidth = LW * 2; x.strokeStyle = PAL.green; x.stroke(); x.globalAlpha = 1; }
    x.restore();
    x.restore();
  };

  // Gosma de óleo (o Rei Slime): uma poça viva que quica, com coroa.
  BODY.slime = (x, P, p, view, dir) => {
    const q = p.anim === 'attack' ? Math.sin(p.time * Math.PI) : 0, sq = 1 + Math.sin(p.time * Math.PI * 2) * 0.06;
    const w = 46 * sq * (1 + q * 0.25), h = 40 / sq * (1 - q * 0.15) + q * 10, y0 = -q * 18;
    part(x, () => { x.moveTo(-w, 0 + y0); x.quadraticCurveTo(-w, -h * 1.6 + y0, 0, -h * 1.5 + y0); x.quadraticCurveTo(w, -h * 1.6 + y0, w, 0 + y0); x.closePath(); }, P.col, 0.3);
    line(x, -w * 0.6, -h * 0.5 + y0, -w * 0.2, -h * 1.05 + y0, PAL.cyan, 1.4); line(x, w * 0.5, -h * 0.3 + y0, w * 0.7, -h * 0.7 + y0, PAL.pink, 1.4);
    lit(x, rect(x, -16, -h * 0.85 + y0, 8, 6), PAL.yellow); lit(x, rect(x, 8, -h * 0.85 + y0, 8, 6), PAL.yellow);
    if (P.crown) { const t = -h * 1.5 + y0; part(x, poly(x, [[-14, t + 2], [-16, t - 12], [-6, t - 5], [0, t - 15], [6, t - 5], [16, t - 12], [14, t + 2]]), PAL.yellow); }
  };
  // Árvore de cabos (Árvore Anciã): tronco de cano, galhos de cabo e folhas de LED.
  BODY.tree = (x, P, p, view, dir) => {
    const sw = p.anim === 'attack' ? Math.sin(p.time * Math.PI) : 0;
    part(x, poly(x, [[-10, 0], [-7, -60], [7, -60], [10, 0]]), PAL.brown);
    for (const [k, len, a] of [[-1, 34, 0.9], [1, 38, -0.8], [1, 26, -1.6 + sw * 1.4], [-1, 24, 1.7 - sw * 0.6]]) {
      const ex = Math.sin(a) * len * -1, ey = -60 - Math.cos(a) * len * 0.4 - 8;
      line(x, 0, -52, ex, ey, PAL.gray, 2.2);
      for (let i = 0; i < 3; i++) lit(x, rect(x, ex - 6 + i * 5, ey - 6 - i * 2, 4, 4), i % 2 ? PAL.lime : PAL.green);
    }
    part(x, ell(x, 0, -76, 30, 20), P.col, 0.3);
    lit(x, rect(x, -9, -66, 5, 4), PAL.yellow); lit(x, rect(x, 4, -66, 5, 4), PAL.yellow);
  };
  // Serpente de cabo: gomos ondulando, cabeça de plugue.
  BODY.snake = (x, P, p, view, dir) => {
    const lunge = p.anim === 'attack' ? Math.sin(p.time * Math.PI) : 0;
    let px = -40 * dir, py = -6;
    for (let i = 0; i < 8; i++) {
      const xx = (-40 + i * 9) * dir, yy = -6 - Math.sin(i * 0.9 + p.time * Math.PI * 2) * 4 - (i > 5 ? (i - 5) * (10 + lunge * 8) : 0);
      part(x, ell(x, xx, yy, 6, 5), i % 2 ? P.col : dark(P.col, 0.9));
      px = xx; py = yy;
    }
    const hx = px + dir * (10 + lunge * 16), hy = py - 6 - lunge * 6;
    part(x, rect(x, hx - 9, hy - 8, 18, 14), P.col);
    lit(x, rect(x, hx + (dir > 0 ? 2 : -6), hy - 4, 4, 3), PAL.yellow);
    line(x, hx + dir * 9, hy + 2, hx + dir * 15, hy + 4, PAL.red, 1.2);
  };
  // Aranha-drone: cúpula de um olho e oito pernas articuladas.
  BODY.spider = (x, P, p, view, dir) => {
    const up = p.anim === 'attack' ? Math.sin(p.time * Math.PI) : 0, w = Math.sin(p.time * Math.PI * 2);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
      const kx = s * (18 + k * 6), ky = -26 - k * 3 - (k === 0 && s === dir ? up * 16 : 0) + (k % 2 ? w : -w) * 2;
      line(x, s * 8, -16, kx, ky, P.col, 1.6); line(x, kx, ky, s * (26 + k * 7), 0 - (k === 0 && s === dir ? up * 10 : 0), P.col, 1.6);
    }
    part(x, ell(x, 0, -18, 20, 14), P.col);
    lit(x, ell(x, dir * 6, -20, 5, 5), PAL.red);
    line(x, 0, -32, 2, -40, PAL.gray, 1.2); lit(x, ell(x, 2, -41, 2, 2), PAL.cyan);
  };
  // Caveira flutuante (Lich-drone do Enemy Pack): caixa de caveira com propulsores.
  BODY.skull = (x, P, p, view, dir) => {
    const lunge = p.anim === 'attack' ? Math.sin(p.time * Math.PI) : 0, f = -40 + Math.sin(p.time * Math.PI * 2) * 3;
    const cx = dir * lunge * 14;
    part(x, poly(x, [[cx - 22, f - 22], [cx + 22, f - 22], [cx + 22, f + 4], [cx + 12, f + 10], [cx - 12, f + 10], [cx - 22, f + 4]]), P.col);
    lit(x, rect(x, cx - 14, f - 12, 9, 7), PAL.red); lit(x, rect(x, cx + 5, f - 12, 9, 7), PAL.red);
    const jaw = lunge * 6; part(x, rect(x, cx - 12, f + 10 + jaw, 24, 6), P.col);
    for (const k of [-1, 1]) lit(x, ell(x, cx + k * 14, f + 18 + jaw, 3, 2), PAL.cyan);
    if (p.shieldUp) { x.globalAlpha = 0.6; part(x, ell(x, cx, f - 6, 30, 30), PAL.cyan, 0.1); x.globalAlpha = 1; }
  };
  // Peixe-drone (Peixe Arpoador, Peixe-Remo): casco de peixe sobre um propulsor.
  BODY.fish = (x, P, p, view, dir) => {
    const f = Math.sin(p.time * Math.PI * 2) * 2, y = -26 + f;
    part(x, ell(x, 0, y - 16, 22, 18), P.col);
    part(x, poly(x, [[-dir * 20, y - 16], [-dir * 34, y - 28], [-dir * 34, y - 4]]), P.col);
    lit(x, rect(x, dir * 8, y - 22, 6, 5), PAL.yellow);
    line(x, 0, y + 2, 0, y + 10, PAL.gray, 2); lit(x, ell(x, 0, y + 13, 8, 2.4), PAL.cyan);
    const arm = p.anim === 'attack' ? (p.time < 0.5 ? -2.2 * ease(p.time / 0.5) : -2.2 + 3.6 * ease((p.time - 0.5) / 0.5)) : 0.9;
    const [hx, hy] = limb(x, dir * 12, y - 10, arm * dir, 18, 5, P.col);
    weapon(x, P.weapon, hx, hy, arm * dir + 0.3 * dir, P, p);
  };
  // Tartaruga-tanque: casco hexagonal sobre esteira; na defesa, recolhe a cabeça.
  BODY.turtle = (x, P, p, view, dir) => {
    const hide = p.shieldUp || 0, bite = p.anim === 'attack' ? Math.sin(p.time * Math.PI) : 0;
    part(x, poly(x, [[-34, -10], [34, -10], [38, -4], [30, 0], [-30, 0], [-38, -4]]), PAL.gray);
    part(x, () => { x.moveTo(-36, -10); x.quadraticCurveTo(-30, -58, 0, -58); x.quadraticCurveTo(30, -58, 36, -10); x.closePath(); }, P.col);
    for (const [a, b] of [[-14, -40], [8, -44], [-2, -24], [20, -26], [-22, -22]]) part(x, rect(x, a, b, 9, 8), P.col, 0.5);
    if (hide < 0.8) { const hx = dir * (38 + bite * 10), hy = -26 + bite * 4; part(x, rect(x, hx - 9, hy - 8, 18, 14), P.col); lit(x, rect(x, hx + (dir > 0 ? 2 : -6), hy - 4, 4, 3), PAL.yellow); }
  };
  // Quadrúpede pesado (urso, panda): bloco de chapas que empina e dá a patada.
  BODY.quad = (x, P, p, view, dir) => {
    const rear = p.anim === 'attack' ? Math.sin(p.time * Math.PI) : 0, w = Math.sin(p.time * Math.PI * 2);
    x.save(); x.translate(-dir * 20, -8); x.rotate(-rear * 0.6 * dir); x.translate(dir * 20, 8);
    for (const [lx, ph] of [[-22, 1], [-12, -1], [14, -1], [24, 1]]) limb(x, lx * dir, -30, (p.anim === 'run' ? w * 0.4 * ph : 0) * dir, 26, 9, ph > 0 ? dark(P.col, 0.8) : P.col);
    part(x, rect(x, -34, -58, 68, 32), P.col);
    for (const k of [-18, 0, 18]) line(x, k, -56, k, -28, dark(P.col, 0.6), 1);
    part(x, rect(x, dir > 0 ? 28 : -52, -70, 24, 24), P.col);
    lit(x, rect(x, dir > 0 ? 40 : -46, -62, 6, 4), PAL.yellow);
    if (P.ears !== false) for (const k of [0, 14]) part(x, rect(x, (dir > 0 ? 30 : -50) + k, -76, 6, 6), P.col);
    if (rear > 0.3) weapon(x, 'claws', dir * 48, -50, 1.4 * dir, P, p);
    x.restore();
  };

  // Quanto cada corpo ocupa no espaço do rig (largura, altura): os que não são
  // humanoides são encaixados pela altura E pela largura da caixa original
  // (uma serpente é baixa e comprida; escalar só pela altura a deixava minúscula).
  const EXT = { slime: [96, 72], tree: [76, 104], snake: [104, 46], spider: [92, 46], skull: [52, 74], fish: [72, 62], turtle: [92, 60], quad: [112, 80] };

  // ---------------------------------------------------------------- unidades
  // Qual corpo e quais peças cada unidade do jogo usa. As que têm cor de
  // fábrica (red_pawn, blue_archer...) recebem a cor do prefixo.
  const SPECS = {
    warrior: { body: 'humanoid', col: PAL.cyan, acc: PAL.magenta, head: 'helm', weapon: 'sword', shield: true, antenna: true },
    pawn: { body: 'humanoid', head: 'box', weapon: 'knife', legs: 'wheel', torsoW: 24, torsoH: 26, headW: 20, antenna: true },
    archer: { body: 'humanoid', head: 'box', weapon: 'bow', ranged: true, torsoW: 22, cyclops: true },
    lancer: { body: 'humanoid', head: 'helm', weapon: 'lance', torsoW: 32, bulk: 1.1, shield: true },
    monk: { body: 'humanoid', head: 'hood', weapon: 'staff', legs: 'robe', torsoW: 24, healer: true },
    boss: { body: 'humanoid', head: 'helm', weapon: 'saber', shield: true, horns: true, cape: true, torsoW: 32, bulk: 1.15 },
    torch: { body: 'humanoid', head: 'box', weapon: 'torch', legs: 'legs', torsoW: 22, torsoH: 24, legH: 24, headW: 24, headH: 18, antenna: true },
    tnt: { body: 'humanoid', head: 'box', weapon: 'tnt', ranged: true, torsoW: 22, torsoH: 24, legH: 24, headW: 24, headH: 18, antenna: true },
    blackknight: { body: 'humanoid', col: PAL.steel, acc: PAL.red, head: 'helm', weapon: 'saber', shield: true, torsoW: 30, bulk: 1.1, eye: PAL.red },
    skelarcher: { body: 'humanoid', col: PAL.white, acc: PAL.cyan, head: 'skull', weapon: 'bow', ranged: true, torsoW: 20, armW: 5, legW: 6 },
    gravelancer: { body: 'humanoid', col: PAL.green, acc: PAL.lime, head: 'skull', weapon: 'lance', torsoW: 26 },
    cultist: { body: 'humanoid', col: PAL.purple, acc: PAL.magenta, head: 'hood', weapon: 'knife', legs: 'robe', eye: PAL.magenta },
    lich: { body: 'humanoid', col: PAL.purple, acc: PAL.green, head: 'skull', weapon: 'staff', ranged: true, legs: 'hover', crown: true },
    ogre: { body: 'humanoid', col: PAL.orange, acc: PAL.yellow, head: 'box', weapon: 'club', torsoW: 40, torsoH: 38, bulk: 1.25, armW: 10, legW: 11, headW: 20 },
    wraith: { body: 'humanoid', col: PAL.cyan, acc: PAL.white, head: 'hood', weapon: 'claws', legs: 'hover', eye: PAL.white },
    imp: { body: 'humanoid', col: PAL.red, acc: PAL.yellow, head: 'box', weapon: 'claws', horns: true, torsoW: 20, torsoH: 22, legH: 22, headW: 20 },
    necro: { body: 'humanoid', col: PAL.green, acc: PAL.lime, head: 'hood', weapon: 'staff', ranged: true, legs: 'robe' },
    gobtorch: { body: 'humanoid', col: PAL.lime, acc: PAL.orange, head: 'box', weapon: 'torch', torsoW: 22, torsoH: 24, legH: 24, headW: 24, headH: 18, antenna: true },
    gobtnt: { body: 'humanoid', col: PAL.lime, acc: PAL.red, head: 'box', weapon: 'tnt', ranged: true, torsoW: 22, torsoH: 24, legH: 24, headW: 24, headH: 18, antenna: true },
    serpent: { body: 'snake', col: PAL.green },
    commander: { body: 'humanoid', col: PAL.steel, acc: PAL.red, head: 'helm', weapon: 'saber', cape: true, crown: true, shield: true, torsoW: 32, bulk: 1.15 },
    commander_bone: { body: 'humanoid', col: PAL.white, acc: PAL.cyan, head: 'helm', weapon: 'saber', cape: true, crown: true, shield: true, torsoW: 32, bulk: 1.15 },
    commander_ash: { body: 'humanoid', col: PAL.orange, acc: PAL.yellow, head: 'helm', weapon: 'saber', cape: true, crown: true, shield: true, torsoW: 32, bulk: 1.15 },
    kingslime: { body: 'slime', col: PAL.purple, crown: true },
    tree: { body: 'tree', col: PAL.green },
    mino: { body: 'humanoid', col: PAL.brown, acc: PAL.orange, head: 'box', horns: true, weapon: 'axe', torsoW: 36, bulk: 1.2, armW: 9, legW: 10 },
    minolord: { body: 'humanoid', col: PAL.red, acc: PAL.yellow, head: 'box', horns: true, weapon: 'axe', torsoW: 40, bulk: 1.25, armW: 10, legW: 11, cape: true },
    gnome: { body: 'humanoid', col: PAL.blue, acc: PAL.cyan, head: 'dome', weapon: 'staff', torsoW: 20, torsoH: 22, legH: 20, antenna: true },
    thief: { body: 'humanoid', col: PAL.purple, acc: PAL.cyan, head: 'hood', weapon: 'knife', weapon2: 'knife', torsoW: 20 },
    snake: { body: 'snake', col: PAL.lime },
    spider: { body: 'spider', col: PAL.purple },
    skull: { body: 'skull', col: PAL.white },
    gnoll: { body: 'humanoid', col: PAL.orange, acc: PAL.gray, head: 'box', weapon: 'rock', ranged: true, torsoW: 28, antenna: true },
    lizard: { body: 'humanoid', col: PAL.green, acc: PAL.lime, head: 'dome', weapon: 'claws', tail: true, torsoW: 26 },
    harpoonfish: { body: 'fish', col: PAL.cyan, acc: PAL.yellow, weapon: 'harpoon', ranged: true },
    paddlefish: { body: 'fish', col: PAL.blue, acc: PAL.orange, weapon: 'paddle' },
    shaman: { body: 'humanoid', col: PAL.green, acc: PAL.magenta, head: 'hood', weapon: 'staff', ranged: true, legs: 'robe' },
    turtle: { body: 'turtle', col: PAL.green },
    wlancer: { body: 'humanoid', col: PAL.orange, acc: PAL.cyan, head: 'helm', weapon: 'lance', legs: 'wheel', torsoW: 30 },
    bear: { body: 'quad', col: PAL.brown },
    panda: { body: 'quad', col: PAL.white },
    troll: { body: 'humanoid', col: PAL.cyan, acc: PAL.steel, head: 'box', weapon: 'club', torsoW: 42, torsoH: 40, bulk: 1.3, armW: 11, legW: 12, armL: 34, headW: 18 },
  };
  function specFor(unit) {
    const m = /^(red|black|blue|purple|yellow)_(.+)$/.exec(unit);
    const base = m ? m[2] : unit, s = Object.assign({ body: 'humanoid', col: PAL.steel, acc: PAL.cyan }, SPECS[base] || {});
    if (m) { s.col = DG[m[1]]; if (base === 'boss' || base === 'lancer') s.acc = m[1] === 'yellow' ? PAL.magenta : PAL.yellow; }
    return s;
  }

  // ---------------------------------------------------------------- render de um quadro
  // Desenha o robô P na pose do instante t num canvas pequeno e devolve o
  // canvas (já com a transparência arredondada: pixel limpo, sem borda borrada).
  function frame(P, anim, t, opt) {
    const { w, h, footX, footY, bodyH, bodyW, view = 'side', dir = 1 } = opt;
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const x = c.getContext('2d');
    const ext = EXT[P.body];
    const s = ext && bodyW ? Math.min(bodyH / ext[1], bodyW / ext[0]) : bodyH / 100;
    LW = 1 / s;
    const p = pose(anim, t, P); p.anim = anim;
    x.save();
    x.translate(footX, footY); x.scale(s, s);
    x.lineJoin = 'miter'; x.lineCap = 'square';
    if (anim === 'grow' && p.reveal < 1) { x.beginPath(); x.rect(-200, -100 * p.reveal - 10, 400, 100 * p.reveal + 20); x.clip(); x.translate(0, (1 - p.reveal) * 30); }
    (BODY[P.body] || BODY.humanoid)(x, P, p, view, dir);
    x.restore();
    // Transparência em 0 ou 1: o 8-bit não tem borda suave.
    try {
      const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
      for (let i = 3; i < a.length; i += 4) a[i] = a[i] > 90 ? 255 : 0;
      x.putImageData(d, 0, 0);
    } catch (e) { /* sem leitura de pixels: fica com a borda suave */ }
    return c;
  }

  // Caixa do corpo dentro do quadro original: une os pixels visíveis de todos
  // os quadros da animação parada. `draw` é o drawImage original (sem o filtro
  // neon do neon-skin.js).
  function measure(img, fw, fh, row, frames, draw) {
    try {
      const c = document.createElement('canvas'); c.width = fw; c.height = fh;
      const x = c.getContext('2d', { willReadFrequently: true });
      let x0 = fw, y0 = fh, x1 = -1, y1 = -1;
      for (let f = 0; f < frames; f++) {
        x.clearRect(0, 0, fw, fh);
        draw.call(x, img, f * fw, row * fh, fw, fh, 0, 0, fw, fh);
        const d = x.getImageData(0, 0, fw, fh).data;
        for (let yy = 0; yy < fh; yy++) for (let xx = 0; xx < fw; xx++) if (d[(yy * fw + xx) * 4 + 3] > 40) {
          if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
        }
      }
      if (y1 < 0) return null;
      return { x0, y0, x1, y1 };
    } catch (e) { return null; }
  }

  // Folha de uma animação de unidade com o mesmo tamanho da original.
  // box = a caixa do corpo (de measure), ou null para uma caixa padrão.
  // opt.view: 'front' para os inimigos que olham para a câmera; opt.dir: -1
  // para os que olham para a esquerda (o motor espelha os outros sozinho).
  function unitSheet(unit, anim, W0, H0, fw, fh, row, frames, box, opt = {}) {
    const P = specFor(unit);
    const out = document.createElement('canvas'); out.width = W0; out.height = H0;
    const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
    const b = box || { x0: fw * 0.32, y0: fh * 0.3, x1: fw * 0.68, y1: fh * 0.72 };
    const bodyH = Math.max(8, b.y1 - b.y0), bodyW = Math.max(8, b.x1 - b.x0), cx = (b.x0 + b.x1) / 2;
    // Tamanho do "pixel": o corpo fica com ~40 pixels de altura.
    const px = Math.max(1, Math.round(bodyH / 40));
    const view = P.body === 'humanoid' ? (opt.view || 'side') : 'side', dir = opt.dir || 1;
    const anims = { attack2: 'attack2', guard: 'guard', grow: 'grow', run: 'run', attack: P.healer ? 'heal' : 'attack' };
    const a = anims[anim] || 'idle';
    for (let f = 0; f < frames; f++) {
      const t = frames > 1 ? f / frames : 0;
      const fr = frame(P, a, t, { w: fw / px, h: fh / px, footX: cx / px, footY: b.y1 / px, bodyH: bodyH / px, bodyW: bodyW / px, view, dir });
      o.drawImage(fr, 0, 0, fr.width, fr.height, f * fw, row * fh, fr.width * px, fr.height * px);
    }
    out.naturalWidth = out.width; out.naturalHeight = out.height;   // o motor testa naturalWidth
    return out;
  }

  // ---------------------------------------------------------------- herói em 8 direções
  // As folhas novas do herói: grade de blocos 3×3 de células 64×64; cada bloco
  // é um quadro (15 quadros, em ordem de leitura de 4×4 blocos, sem o último),
  // e cada célula do bloco é uma direção: 0=SE 1=E 2=S 3=NE 4=N 5=NW 6=W 7=SW.
  const HERO = Object.assign({}, SPECS.warrior);
  const DIRS = [['side', 1], ['side', 1], ['front', 1], ['side', 1, true], ['back', 1], ['side', -1, true], ['side', -1], ['side', -1]];
  const KIND_ANIM = { atk: 'attack', atk2: 'attack2', jump: 'jump', parry: 'parry', idle: 'idle', tired: 'tired', dodge: 'dodge', walk: 'run' };
  function heroSheet(kind) {
    const fs = 64, out = document.createElement('canvas'); out.width = out.height = fs * 12;
    const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
    const blocks = [];
    for (let br = 0; br < 4; br++) for (let bc = 0; bc < 4; bc++) if (!(br === 3 && bc === 3)) blocks.push([br, bc]);
    blocks.forEach(([br, bc], idx) => {
      const t = idx / 15;
      for (let pos = 0; pos < 8; pos++) {
        const [view, dir, backish] = DIRS[pos];
        const P = backish ? Object.assign({}, HERO, { eye: HERO.col }) : HERO;   // 3/4 de costas: sem visor aceso
        const fr = frame(P, KIND_ANIM[kind] || 'idle', t, { w: fs, h: fs, footX: 32, footY: 55, bodyH: 42, view, dir });
        const r = (pos / 3) | 0, c = pos % 3;
        o.drawImage(fr, (bc * 3 + c) * fs, (br * 3 + r) * fs);
      }
    });
    out.naturalWidth = out.width; out.naturalHeight = out.height;
    return out;
  }
  // Herói de frente no hangar (a tela do acampamento): 5 colunas, 17 quadros.
  function campSheet() {
    const fs = 64, out = document.createElement('canvas'); out.width = fs * 5; out.height = fs * 4;
    const o = out.getContext('2d');
    for (let f = 0; f < 17; f++) {
      const fr = frame(HERO, 'idle', f / 17, { w: fs, h: fs, footX: 32, footY: 55, bodyH: 42, view: 'front', dir: 1 });
      o.drawImage(fr, (f % 5) * fs, Math.floor(f / 5) * fs);
    }
    out.naturalWidth = out.width; out.naturalHeight = out.height;
    return out;
  }

  window.NEONBOT = { PAL, DG, dark, specFor, frame, measure, unitSheet, heroSheet, campSheet };
})();
