// Núcleo compartilhado da franquia Rally (RallySurvive.md, Parte 1 — GDD Core) para os protótipos web de
// Navigation Expert, RaceLegenda e Street Legends. Cada jogo carrega este arquivo antes do seu game.js e
// só escreve o que é dele (Partes 3–5): o que está aqui é o que o Core diz que é igual nos quatro.
//
// - CarController: o carro vai na direção do cursor, velocidade pela distância com a curva t² (Parte 8
//   §1.2–1.4) e grip por terreno (§3). Mesmos números do protótipo do RallySurvive.
// - ChevronGuide: setas entre o carro e o cursor, verdes acelerando e vermelhas freando (Parte 1 §2). O
//   nome fica ChevronGuide em todos os jogos (Parte 1 §9).
// - Sprite de 8 direções em pixel art 3/4 (estilo do repositório rally2d): escolhe o quadro mais perto do
//   ângulo do carro e gira só o resto (no máximo 22,5°), porque girar um desenho 3/4 inteiro fica errado.
// - Ranking local (no lugar do Firebase da Parte 1 §6), cronômetro, minimapa e "segurar para largar".
'use strict';

const RC = (() => {
  const CAR = {
    maxSpeed: 8,                  // unidades/s
    minDistanceForMovement: 0.3,  // zona morta
    maxDistanceForTopSpeed: 6,
    steeringResponsiveness: 20,
    rotationSpeed: 10,
  };
  const PPU = 48;                 // pixels de tela por unidade de mundo
  const ART = 0.7;                // escala da arte de 128 px na tela (um sprite de 128 aparece com ~90 px)
  const FIXED = 1 / 60;

  // ------------------------------------------------------------------ imagens

  const IMG = {};
  function loadImages(base, keys) {
    return Promise.all(keys.map(k => new Promise(res => {
      const im = new Image();
      im.onload = () => { IMG[k] = im; res(); };
      im.onerror = () => { console.warn('sem arte', base + k); res(); };
      im.src = `${base}${k}.png`;
    })));
  }

  // As 8 rotações exportadas pelo PixelLab, com o ângulo de tela de cada uma (0 = leste, positivo = para baixo).
  const DIRS = [['east', 0], ['south-east', 45], ['south', 90], ['south-west', 135], ['west', 180], ['north-west', -135], ['north', -90], ['north-east', -45]];
  const dirKeys = folder => DIRS.map(([d]) => `${folder}/${d}`);

  // Troca a cor de um sprite girando o matiz só dos pixels saturados da faixa "from" (ex.: o vermelho da
  // carroceria), sem mexer em pneus, vidros e contorno. Serve aos rivais do RaceLegenda e à pintura da garagem.
  function recolor(img, fromHue, toHue, range = 40, satMul = 1, lightAdd = 0) {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const cg = c.getContext('2d'); cg.drawImage(img, 0, 0);
    // Aberto direto do disco (file://) o navegador não deixa ler os pixels: fica a cor original.
    let d; try { d = cg.getImageData(0, 0, c.width, c.height); } catch (e) { return img; }
    const p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const [h, s, l] = rgb2hsl(p[i], p[i + 1], p[i + 2]);
      let dh = Math.abs(h - fromHue); dh = Math.min(dh, 360 - dh);
      if (dh > range || s < 0.25) continue;
      const [r, g, b] = hsl2rgb((toHue + (h - fromHue) + 360) % 360, Math.min(1, s * satMul), Math.max(0, Math.min(1, l + lightAdd)));
      p[i] = r; p[i + 1] = g; p[i + 2] = b;
    }
    cg.putImageData(d, 0, 0);
    return c;
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function hsl2rgb(h, s, l) {
    h /= 360;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
  }

  // Um conjunto de 8 quadros: {east: img, ...}. "recolorFn" opcional gera uma cópia tingida de cada quadro.
  function carSet(folder, recolorFn) {
    const set = {};
    for (const [d] of DIRS) { const im = IMG[`${folder}/${d}`]; if (im) set[d] = recolorFn ? recolorFn(im) : im; }
    return set;
  }

  // Desenha o carro na posição/ângulo do mundo (já com a transformação do mundo aplicada no contexto).
  function drawCar(g, set, x, y, ang, alpha = 1, scale = 1) {
    const deg = ang * 180 / Math.PI;
    let best = DIRS[0], bd = 999;
    for (const dir of DIRS) { let dd = Math.abs(((deg - dir[1]) % 360 + 540) % 360 - 180); if (dd < bd) { bd = dd; best = dir; } }
    const im = set[best[0]]; if (!im) return;
    let res = ((deg - best[1]) % 360 + 540) % 360 - 180;
    const w = im.width * ART * scale / PPU, h = im.height * ART * scale / PPU;
    g.save(); g.translate(x, y);
    shadow(g, 0, h * 0.18, w * 0.36, h * 0.2, 0.28 * alpha);
    g.rotate(res * Math.PI / 180); g.globalAlpha = alpha;
    g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
  }

  // Objetos em pé (3/4) não trazem sombra desenhada: o jogo põe uma elipse no pé deles (rally2d, estilo).
  function shadow(g, x, y, rx, ry, a = 0.25) {
    g.save(); g.fillStyle = `rgba(0,0,0,${a})`; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }

  // Sprite de objeto, com o pé (base do desenho) no ponto x,y. "foot" = fração da altura onde fica o pé.
  function drawProp(g, key, x, y, scale = 1, opt = {}) {
    const im = opt.img || IMG[key]; if (!im) return;
    const w = im.width * ART * scale / PPU, h = im.height * ART * scale / PPU;
    const foot = opt.foot ?? 0.88;
    g.save(); g.translate(x, y);
    if (!opt.noShadow) shadow(g, 0, 0, w * (opt.shadowW ?? 0.32), h * 0.08, 0.22);
    if (opt.flip) g.scale(-1, 1);
    if (opt.rot) g.rotate(opt.rot);
    if (opt.alpha != null) g.globalAlpha = opt.alpha;
    g.drawImage(im, -w / 2, -h * foot, w, h); g.restore();
  }

  // Chão visto de cima (decalques, poças, telhados): centrado no ponto, sem sombra.
  function drawFlat(g, key, x, y, scale = 1, rot = 0, alpha = 1) {
    const im = IMG[key]; if (!im) return;
    const w = im.width * ART * scale / PPU, h = im.height * ART * scale / PPU;
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.globalAlpha = alpha;
    g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
  }

  // Padrão repetido a partir de um tile do chão (ou de um recorte dele).
  function pattern(g, key, crop) {
    const im = IMG[key]; if (!im) return null;
    let src = im;
    if (crop) { src = document.createElement('canvas'); src.width = crop[2]; src.height = crop[3]; src.getContext('2d').drawImage(im, crop[0], crop[1], crop[2], crop[3], 0, 0, crop[2], crop[3]); }
    const p = g.createPattern(src, 'repeat');
    p.setTransform(new DOMMatrix().scale(ART / PPU));
    return p;
  }

  // ------------------------------------------------------------------ CarController (Parte 8 §1.2)

  // car: {x, y, vx, vy, ang, target, actual}. p: parâmetros do carro (CAR + o que a variante mudar).
  // grip: do terreno sob o carro. speedCap: teto de velocidade daquele chão (1 = nenhum).
  function drive(car, aim, dt, p, grip, speedCap = 1) {
    const tx = aim.x - car.x, ty = aim.y - car.y, dist = Math.hypot(tx, ty);
    const t = Math.max(0, Math.min(1, (dist - p.minDistanceForMovement) / (p.maxDistanceForTopSpeed - p.minDistanceForMovement)));
    const speedT = t * t;   // curva "exponencial suave" (Parte 1 §2, guia §1.4)
    let dvx = 0, dvy = 0;
    if (dist > p.minDistanceForMovement) {
      const v = speedT * p.maxSpeed * speedCap;
      dvx = tx / dist * v; dvy = ty / dist * v;
      const target = Math.atan2(ty, tx);
      car.ang += wrap(target - car.ang) * Math.min(1, p.rotationSpeed * dt);
    }
    // Frear e acelerar usam a mesma resposta, a não ser que a variante dê uma resposta de freio própria.
    const cur = Math.hypot(car.vx, car.vy), want = Math.hypot(dvx, dvy);
    const resp = want < cur - 0.05 && p.brakeResponse ? p.brakeResponse : p.steeringResponsiveness;
    const k = Math.min(1, resp * grip * dt);
    car.vx += (dvx - car.vx) * k; car.vy += (dvy - car.vy) * k;
    car.x += car.vx * dt; car.y += car.vy * dt;
    car.target = speedT * speedCap;
    car.actual = Math.min(1, Math.hypot(car.vx, car.vy) / p.maxSpeed);
  }
  const wrap = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

  // Colisão com obstáculo: reduz a velocidade bruscamente sem frear o carro de vez (Parte 1 §2) e o tira
  // de dentro do obstáculo. Círculos {x,y,r} e retângulos {x,y,w,h} (canto superior esquerdo).
  function collide(car, obstacles, radius = 0.45, keep = 0.35) {
    let hit = null;
    for (const o of obstacles) {
      let nx, ny, pen;
      if (o.r != null) {
        const dx = car.x - o.x, dy = car.y - o.y, d = Math.hypot(dx, dy) || 1e-4;
        pen = o.r + radius - d; if (pen <= 0) continue;
        nx = dx / d; ny = dy / d;
      } else {
        const cx = Math.max(o.x, Math.min(o.x + o.w, car.x)), cy = Math.max(o.y, Math.min(o.y + o.h, car.y));
        let dx = car.x - cx, dy = car.y - cy, d = Math.hypot(dx, dy);
        if (d === 0) {   // centro dentro do retângulo: sai pelo lado mais perto
          const opts = [[car.x - o.x, -1, 0], [o.x + o.w - car.x, 1, 0], [car.y - o.y, 0, -1], [o.y + o.h - car.y, 0, 1]].sort((a, b) => a[0] - b[0]);
          nx = opts[0][1]; ny = opts[0][2]; pen = opts[0][0] + radius;
        } else { pen = radius - d; if (pen <= 0) continue; nx = dx / d; ny = dy / d; }
      }
      car.x += nx * pen; car.y += ny * pen;
      const vn = car.vx * nx + car.vy * ny;
      if (vn < 0) { car.vx -= vn * nx * 1.3; car.vy -= vn * ny * 1.3; }
      if (!car.hitCd) { car.vx *= keep; car.vy *= keep; car.hitCd = 0.25; }
      hit = o;
    }
    if (car.hitCd) car.hitCd = Math.max(0, car.hitCd - FIXED);
    return hit;
  }

  // ------------------------------------------------------------------ ChevronGuide (Parte 1 §2)

  // Setas de pixel desenhadas no código (em blocos, para casar com a arte). Verde = cursor pedindo mais
  // velocidade do que o carro tem; vermelho = pedindo menos. A quantidade cresce com a diferença (até 5).
  function drawChevrons(g, car, aim) {
    const dx = aim.x - car.x, dy = aim.y - car.y, dist = Math.hypot(dx, dy);
    if (dist < CAR.minDistanceForMovement + 0.5) return;
    const diff = car.target - car.actual;
    const color = diff > 0.02 ? '#3fcf5a' : diff < -0.02 ? '#ef4040' : '#f4f1e8';
    const count = Math.max(1, Math.min(5, Math.round(1 + Math.abs(diff) * 8), Math.floor((dist - 0.7) / 0.85)));
    const ang = Math.atan2(dy, dx), px = 1 / PPU * 3.6;
    for (let i = 0; i < count; i++) {
      const d = 1.1 + i * 0.85;
      g.save(); g.translate(car.x + dx / dist * d, car.y + dy / dist * d); g.rotate(ang); g.globalAlpha = 0.95 - i * 0.1;
      // ">" de 7 blocos de altura: contorno escuro e miolo colorido
      for (const [c, o] of [['#1b1d24', 1], [color, 0]]) {
        g.fillStyle = c;
        for (let r = -3; r <= 3; r++) {
          const x = (3 - Math.abs(r)) * px - 3 * px;
          g.fillRect(x - px - o * px, r * px - o * px, px * 2 + o * px * 2, px + o * px * 2);
        }
      }
      g.restore();
    }
  }

  // ------------------------------------------------------------------ minimapa e seta (Partes 3 e 5)

  // Minimapa no canto inferior: o mundo inteiro reduzido, o carro e o próximo checkpoint.
  function drawMinimap(g, x, y, w, h, world, draw) {
    g.save();
    g.fillStyle = 'rgba(20,22,30,.78)'; g.strokeStyle = '#f4f1e8'; g.lineWidth = 3;
    roundRect(g, x - 6, y - 6, w + 12, h + 12, 10); g.fill(); g.stroke();
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    const s = Math.min(w / world.w, h / world.h);
    g.translate(x + (w - world.w * s) / 2, y + (h - world.h * s) / 2); g.scale(s, s);
    draw(g, s);
    g.restore();
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // Seta grande apontando o próximo checkpoint, em volta do carro (coordenadas de tela).
  function drawGuideArrow(g, sx, sy, ang, alpha, color = '#ffd23f') {
    g.save(); g.translate(sx, sy); g.rotate(ang); g.globalAlpha = alpha; g.translate(70, 0);
    const b = 4;
    for (const [c, o] of [['#1b1d24', 1], [color, 0]]) {
      g.fillStyle = c;
      for (let r = -5; r <= 5; r++) { const len = (5 - Math.abs(r)) * b; g.fillRect(-12 - o * b, r * b - o * b, len + 12 + o * b * 2, b + o * b * 2); }
      g.fillRect(-28 - o * b, -2 * b - o * b, 20 + o * b, b * 5 + o * b * 2);
    }
    g.restore();
  }

  // ------------------------------------------------------------------ save, ranking, tempo

  function store(key) {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}
    data.boards = data.boards || {};
    return {
      data,
      save() { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} },
      board(id) { return (data.boards[id] = data.boards[id] || []); },
      submit(id, name, t, extra = {}) {
        const list = this.board(id); list.push({ name, t, date: Date.now(), ...extra });
        list.sort((a, b) => a.t - b.t); list.splice(10); this.save();
      },
    };
  }
  const fmt = s => { const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r.toFixed(2).padStart(5, '0')}`; };
  const cleanName = v => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);

  // Botão "segurar para largar" (mesmo gesto do menu do RallySurvive, Parte 2 §Menu Principal).
  function holdButton(btn, ms, onTap, onDone) {
    let t0 = 0, raf = 0;
    const bar = btn.querySelector('.hold');
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      if (bar) bar.style.width = `${p * 100}%`;
      if (p >= 1) { t0 = 0; onDone(); return; }
      raf = requestAnimationFrame(tick);
    };
    const down = e => { e.preventDefault(); onTap && onTap(); t0 = performance.now(); tick(); };
    const up = () => { cancelAnimationFrame(raf); t0 = 0; if (bar) bar.style.width = '0'; };
    btn.onpointerdown = down; btn.onpointerup = up; btn.onpointerleave = up; btn.onpointercancel = up;
  }

  // ------------------------------------------------------------------ traçados (mesmo formato nos 4 jogos, Parte 1 §9)

  // Pontos de controle → linha suavizada (Catmull-Rom). "closed" fecha o circuito (RaceLegenda).
  function smoothPath(pts, closed = false, spacing = 0.5) {
    const n = pts.length, out = [];
    const P = i => closed ? pts[(i % n + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / spacing));
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        const f = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
        out.push([f(0), f(1)]);
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }

  // Distância de um ponto até uma linha (lista de pontos). Devolve {dist, i, k} do segmento mais perto.
  function nearest(path, x, y, closed = false) {
    let best = { dist: Infinity, i: 0, k: 0 };
    const n = path.length, last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const a = path[i], b = path[(i + 1) % n], vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy || 1;
      const k = Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy) / l2));
      const d = Math.hypot(x - a[0] - vx * k, y - a[1] - vy * k);
      if (d < best.dist) best = { dist: d, i, k };
    }
    return best;
  }

  function strokePath(g, path, closed = false) {
    g.beginPath(); path.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (closed) g.closePath();
  }

  // ------------------------------------------------------------------ tela, entrada, partículas, diálogos

  // Canvas em tela cheia + mouse/dedo. O cursor só conta depois que o jogador mexe (evita largar sozinho).
  function screen(canvasId = 'game') {
    const cv = document.getElementById(canvasId), g = cv.getContext('2d');
    const s = { cv, g, W: 0, H: 0, DPR: 1, mouse: { x: 0, y: 0, has: false }, active: false };
    const resize = () => { s.DPR = window.devicePixelRatio || 1; s.W = innerWidth; s.H = innerHeight; cv.width = s.W * s.DPR; cv.height = s.H * s.DPR; };
    resize(); addEventListener('resize', resize);
    addEventListener('pointermove', e => { s.mouse.x = e.clientX; s.mouse.y = e.clientY; if (s.active) s.mouse.has = true; });
    addEventListener('pointerdown', e => { if (e.target === cv) { s.mouse.x = e.clientX; s.mouse.y = e.clientY; if (s.active) s.mouse.has = true; } });
    // Câmera: centro (x,y) em unidades de mundo e zoom em px por unidade.
    s.toWorld = (cam, sx, sy) => ({ x: cam.x + (sx - s.W / 2) / cam.z, y: cam.y + (sy - s.H / 2) / cam.z });
    s.toScreen = (cam, x, y) => ({ x: (x - cam.x) * cam.z + s.W / 2, y: (y - cam.y) * cam.z + s.H / 2 });
    s.begin = cam => {
      g.setTransform(s.DPR, 0, 0, s.DPR, 0, 0); g.save();
      g.translate(s.W / 2, s.H / 2); g.scale(cam.z, cam.z); g.translate(-cam.x, -cam.y);
      return { x0: cam.x - s.W / 2 / cam.z - 3, x1: cam.x + s.W / 2 / cam.z + 3, y0: cam.y - s.H / 2 / cam.z - 3, y1: cam.y + s.H / 2 / cam.z + 5 };
    };
    s.end = () => { g.restore(); g.setTransform(s.DPR, 0, 0, s.DPR, 0, 0); };
    return s;
  }
  const inView = (v, x, y, m = 0) => x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m;

  // Poeira/respingo/fumaça: {x,y,vx,vy,life,t,color,size}
  function emitDust(list, car, color, back = 0.55) {
    if (car.actual > 0.1 && Math.random() < car.actual) {
      list.push({ x: car.x - Math.cos(car.ang) * back, y: car.y - Math.sin(car.ang) * back + 0.2, vx: -car.vx * 0.15 + (Math.random() - 0.5), vy: -car.vy * 0.15 + (Math.random() - 0.5), life: 0.6, t: 0, color });
    }
  }
  function drawParticles(g, list, dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i]; p.t += dt; if (p.t > p.life) { list.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const sz = (p.size || 0.14) + p.t * 0.5;
      g.fillStyle = p.color + (0.55 * (1 - p.t / p.life)) + ')';
      g.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);   // quadradinho: casa com o pixel art
    }
  }

  function dialog(html, act) {
    const d = document.getElementById('dialog'); d.innerHTML = html; d.classList.remove('hidden');
    d.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(b.dataset.a, b));
    return d;
  }
  function hideDialog() { document.getElementById('dialog').classList.add('hidden'); }

  // Tela de chegada com nome de até 5 caracteres (Parte 2 do RallySurvive, que os outros jogos herdam).
  function finishDialog({ title = 'Chegada!', time, lines = [], lastName = '', onSave, act }) {
    dialog(`<div class="card"><h2>${title}</h2><div class="big">${fmt(time)}</div>${lines.map(l => `<p>${l}</p>`).join('')}
      <p>Seu nome (até 5 letras):</p>
      <input type="text" id="name" maxlength="5" value="${lastName}" autocomplete="off" spellcheck="false">
      <div class="row"><button class="btn go" data-a="save" id="save-btn">Enviar tempo</button></div>
      <div class="row"><button class="btn" data-a="retry">Repetir (R)</button><button class="btn" data-a="menu">Voltar ao Menu (ESC)</button></div></div>`,
      (a, b) => {
        if (a !== 'save') return act(a);
        const name = cleanName(document.getElementById('name').value) || 'PLAYR';
        onSave(name); b.disabled = true; b.textContent = 'Tempo enviado ✓';
      });
    const inp = document.getElementById('name'); inp.focus(); inp.select();
    inp.oninput = () => { inp.value = cleanName(inp.value); };
    inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') document.getElementById('save-btn').click(); };
  }

  function boardHtml(title, list, note) {
    return `<h3>${title}</h3>${list.length ? `<ol>${list.map(r => `<li>${r.name}<span>${fmt(r.t)}</span></li>`).join('')}</ol>` : '<p class="empty">Ninguém correu aqui ainda.</p>'}
      <p class="note">${note || 'Ranking local deste navegador (o jogo final usa o Firebase, Parte 1 §6).'}</p>`;
  }

  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  return { CAR, PPU, ART, FIXED, IMG, DIRS, loadImages, dirKeys, recolor, carSet, drawCar, drawProp, drawFlat, shadow, pattern, drive, wrap, collide, drawChevrons, drawMinimap, drawGuideArrow, roundRect, store, fmt, cleanName, holdButton, smoothPath, nearest, strokePath, screen, inView, emitDust, drawParticles, dialog, hideDialog, finishDialog, boardHtml, mulberry32 };
})();
