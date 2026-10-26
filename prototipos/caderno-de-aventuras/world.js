// world.js — gera a ilha que o mestre vai desenhando.
//
// POR QUE: no caderno, o mestre inventava o mapa na hora, mas sabia para
// onde a aventura ia (fogueiras no caminho, o dragão no fim). Aqui o mundo
// inteiro é gerado de uma semente no começo e fica escondido: o jogador só
// vê o que já andou perto, e o mestre desenha o resto quando ele chega.
//
// ESTRATÉGIA: ruído de valor (elevação e umidade) define o terreno; a borda
// afunda para virar mar, então o mundo é uma ilha. Uma busca em largura a
// partir da fogueira inicial mede a distância de cada quadrado: ela define a
// região de perigo (1 a 6), onde ficam mais duas fogueiras (1/3 e 2/3 do
// caminho) e o covil do dragão (o ponto alcançável mais longe). Depois de
// monstros e baús, cada região sem fogueira ganha uma. Cada monstro
// tem uma masmorra na região dele, com o rei (ou a rainha) no fundo; o
// interior é gerado da mesma semente quando o herói entra.
(function () {
  'use strict';
  const S = (typeof window !== 'undefined' ? window : globalThis).Sketch;

  const W = 48, H = 34;
  const AGUA = 0, AREIA = 1, CAMPO = 2, MATA = 3, PANTANO = 4, MONTANHA = 5, PAREDE = 6, CHAO = 7;
  const TERRENOS = ['água', 'praia', 'campo', 'floresta', 'pântano', 'montanha', 'parede', 'chão'];

  // Monstros de cada região (o desenho e os números ficam em art.js e game.js).
  const POOLS = {
    1: ['slime', 'rato'], 2: ['goblin', 'lobo'], 3: ['esqueleto', 'aranha'],
    4: ['orc', 'bruxa'], 5: ['ogro', 'cavaleiro'], 6: ['troll', 'golem'],
  };
  // Acampamentos com fogueira, em ordem: os 3 primeiros ficam onde eram as
  // vilas (início, 1/3 e 2/3 do caminho); os outros cobrem as regiões que
  // ficaram sem fogueira.
  const FOGUEIRAS = ['Acampamento Apontador', 'Acampamento Borracha', 'Acampamento Régua', 'Acampamento Clipe',
    'Acampamento Grampo', 'Acampamento Compasso', 'Acampamento Estojo', 'Acampamento Transferidor', 'Acampamento Lancheira'];
  // Masmorra de cada monstro: o lugar e o chefe lá no fundo.
  const MASMORRAS = {
    slime: ['Poço', 'Rei Slime'], rato: ['Esgoto', 'Rei Rato'],
    goblin: ['Caverna', 'Rei Goblin'], lobo: ['Toca', 'Rei Lobo'],
    esqueleto: ['Cripta', 'Rei Esqueleto'], aranha: ['Ninho', 'Rainha Aranha'],
    orc: ['Forte', 'Rei Orc'], bruxa: ['Cabana', 'Rainha Bruxa'],
    ogro: ['Gruta', 'Rei Ogro'], cavaleiro: ['Torre', 'Rei Cavaleiro'],
    troll: ['Fosso', 'Rei Troll'], golem: ['Pedreira', 'Rei Golem'],
  };
  // "Esgoto do Rei Rato", "Ninho da Rainha Aranha".
  const nomeMasmorra = kind => {
    const [lugar, chefe] = MASMORRAS[kind];
    return `${lugar} ${chefe.startsWith('Rainha') ? 'da' : 'do'} ${chefe}`;
  };
  // Quem dá missão tem nome (as dicas vêm de gente sem nome).
  const QUEM = ['Seu Juca', 'Dona Filó', 'Tio Bento', 'Vó Nina', 'Mestre Caco', 'Dona Lurdes'];

  function valueNoise(r, cell) {
    const gw = Math.ceil(W / cell) + 3, gh = Math.ceil(H / cell) + 3;
    const g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = r();
    return (x, y) => {
      const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const v = (i, j) => g[(iy + j) * gw + ix + i];
      return (v(0, 0) * (1 - sx) + v(1, 0) * sx) * (1 - sy) + (v(0, 1) * (1 - sx) + v(1, 1) * sx) * sy;
    };
  }

  const passable = t => t !== AGUA && t !== MONTANHA && t !== PAREDE;

  function bfs(t, start) {
    const dist = new Int16Array(W * H).fill(-1), q = [start];
    dist[start] = 0;
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (dist[j] < 0 && passable(t[j])) { dist[j] = dist[i] + 1; q.push(j); }
      }
    }
    return dist;
  }

  function tryGen(seed) {
    const r = S.rng(seed);
    const e1 = valueNoise(r, 7), e2 = valueNoise(r, 3), m1 = valueNoise(r, 6), m2 = valueNoise(r, 2.5);
    const t = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let e = e1(x, y) * 0.7 + e2(x, y) * 0.3;
      const d = Math.max(Math.abs(x / (W - 1) - 0.5), Math.abs(y / (H - 1) - 0.5)) * 2;
      e += 0.06 - Math.max(0, d - 0.62) * 1.4;
      const m = m1(x, y) * 0.7 + m2(x, y) * 0.3;
      t[y * W + x] = e < 0.36 ? AGUA : e < 0.41 ? AREIA : e > 0.69 ? MONTANHA
        : (m > 0.6 && e < 0.5) ? PANTANO : m > 0.5 ? MATA : CAMPO;
    }

    // A fogueira inicial fica num campo perto do oeste do centro.
    let start = -1, best = Infinity;
    for (let i = 0; i < W * H; i++) {
      if (t[i] !== CAMPO) continue;
      const dd = Math.hypot(i % W - W * 0.24, ((i / W) | 0) - H * 0.5);
      if (dd < best) { best = dd; start = i; }
    }
    if (start < 0) return null;
    const dist = bfs(t, start);
    let reach = 0, maxD = 0, far = start;
    for (let i = 0; i < W * H; i++) if (dist[i] >= 0) { reach++; if (dist[i] > maxD) { maxD = dist[i]; far = i; } }
    if (reach < W * H * 0.36 || maxD < 40) return null;

    const tier = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) tier[i] = dist[i] < 0 ? 0 : Math.min(6, 1 + Math.floor(dist[i] * 6 / (maxD + 1)));

    const obj = new Map();
    const near = (i, j, R) => Math.abs(i % W - j % W) <= R && Math.abs(((i / W) | 0) - ((j / W) | 0)) <= R;
    const pick = (lo, hi) => {
      const c = [];
      for (let i = 0; i < W * H; i++) if (dist[i] >= lo && dist[i] <= hi && (t[i] === CAMPO || t[i] === AREIA)) c.push(i);
      return c.length ? c[Math.floor(r() * c.length)] : -1;
    };
    const camps = [start, pick(maxD * 0.3, maxD * 0.38), pick(maxD * 0.62, maxD * 0.7)];
    if (camps.includes(-1)) return null;
    camps.forEach((i, n) => obj.set(i, { type: 'fogueira', n }));
    obj.set(far, { type: 'covil' });

    const safe = i => camps.some(v => near(i, v, 2));
    const free = [];
    for (let i = 0; i < W * H; i++) if (dist[i] > 0 && !obj.has(i) && !safe(i)) free.push(i);
    for (const i of free) {
      const nearLair = near(i, far, 2);
      if (nearLair ? r() < 0.4 : r() < 0.075) {
        const tr = nearLair ? 6 : tier[i], pool = POOLS[tr];
        obj.set(i, { type: 'monstro', kind: pool[Math.floor(r() * pool.length)] });
      } else if (r() < 0.02) obj.set(i, { type: 'bau', tier: tier[i] });
    }
    // Cada região sem fogueira ganha uma num campo ou praia livre, sem nada
    // encostado, a 4+ quadrados do covil e a 6+ das outras fogueiras.
    for (let tr = 1; tr <= 6; tr++) {
      if (camps.some(c => tier[c] === tr)) continue;
      const c = free.filter(i => tier[i] === tr && (t[i] === CAMPO || t[i] === AREIA) && !near(i, far, 3)
        && !camps.some(v => near(i, v, 5)) && !free.some(j => obj.has(j) && near(i, j, 1)));
      if (!c.length) continue;
      const i = c[Math.floor(r() * c.length)];
      obj.set(i, { type: 'fogueira', n: camps.length });
      camps.push(i);
    }
    // Uma masmorra por monstro, na região dele, longe das fogueiras, do covil e
    // das outras masmorras. Se não couber, aquela masmorra fica de fora.
    const dungeons = [];
    for (let tr = 1; tr <= 6; tr++) for (const kind of POOLS[tr]) {
      const c = [];
      for (const i of free) {
        if (obj.has(i) || tier[i] !== tr || near(i, far, 3) || camps.some(v => near(i, v, 3))) continue;
        if (dungeons.some(d => near(i, d, 5))) continue;
        c.push(i);
      }
      if (!c.length) continue;
      const i = c[Math.floor(r() * c.length)];
      obj.set(i, { type: 'masmorra', n: dungeons.length, kind, tier: tr });
      dungeons.push(i);
    }
    // Personagens: primeiro um que dá missões em cada região, depois os que dão
    // dicas. Ninguém fica a menos de 5 quadrados de outro personagem.
    const npcs = [];
    const roomy = i => !obj.has(i) && !npcs.some(j => near(i, j, 4)) && !dungeons.some(d => near(i, d, 1));
    for (let tr = 1; tr <= 6; tr++) {
      const c = free.filter(i => tier[i] === tr && roomy(i));
      if (!c.length) continue;
      const i = c[Math.floor(r() * c.length)];
      obj.set(i, { type: 'npc', quest: true, tier: tr, nome: QUEM[tr - 1] });
      npcs.push(i);
    }
    let hints = 0;
    for (let k = 0; k < 600 && hints < 9; k++) {
      const i = free[Math.floor(r() * free.length)];
      if (!roomy(i)) continue;
      obj.set(i, { type: 'npc', fala: hints, presente: hints % 3 === 1 });
      npcs.push(i);
      hints++;
    }
    return { seed, W, H, t, dist, tier, maxD, start, camps, lair: far, obj, dungeons, fora: AGUA };
  }

  function generate(seed) {
    for (let k = 0; k < 80; k++) { const w = tryGen((seed + k * 7919) >>> 0); if (w) return w; }
    throw new Error('não consegui gerar uma ilha');
  }

  // Interior de uma masmorra: 4 × 3 celas de 5 quadrados, cada uma com uma
  // sala; um labirinto (busca em profundidade) liga as celas por corredores,
  // mais 2 ligações extras para ter mais de um caminho. A escada de saída fica
  // numa sala e o chefe, na sala mais longe dela a pé.
  function dungeon(seed, n, kind, tr) {
    const r = S.rng(S.hash(seed, n, 991));
    const CW = 5, NC = 4, NR = 3, DW = NC * CW + 1, DH = NR * CW + 1;
    const t = new Uint8Array(DW * DH).fill(PAREDE);
    const dig = (x, y) => { t[y * DW + x] = CHAO; };
    const rooms = [];
    for (let cy = 0; cy < NR; cy++) for (let cx = 0; cx < NC; cx++) {
      const rw = 2 + Math.floor(r() * 3), rh = 2 + Math.floor(r() * 3);
      const x = cx * CW + 1 + Math.floor(r() * (5 - rw)), y = cy * CW + 1 + Math.floor(r() * (5 - rh));
      for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) dig(xx, yy);
      rooms.push({ x, y, w: rw, h: rh, cx: x + (rw >> 1), cy: y + (rh >> 1) });
    }
    // Corredor em L entre o meio de duas salas.
    const hall = (a, b) => {
      const A = rooms[a], B = rooms[b];
      if (r() < 0.5) {
        for (let x = Math.min(A.cx, B.cx); x <= Math.max(A.cx, B.cx); x++) dig(x, A.cy);
        for (let y = Math.min(A.cy, B.cy); y <= Math.max(A.cy, B.cy); y++) dig(B.cx, y);
      } else {
        for (let y = Math.min(A.cy, B.cy); y <= Math.max(A.cy, B.cy); y++) dig(A.cx, y);
        for (let x = Math.min(A.cx, B.cx); x <= Math.max(A.cx, B.cx); x++) dig(x, B.cy);
      }
    };
    const nb = c => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [c % NC + dx, ((c / NC) | 0) + dy])
      .filter(([x, y]) => x >= 0 && y >= 0 && x < NC && y < NR).map(([x, y]) => y * NC + x);
    const linked = new Set([0]), stack = [0];
    while (stack.length) {
      const c = stack[stack.length - 1], opts = nb(c).filter(d => !linked.has(d));
      if (!opts.length) { stack.pop(); continue; }
      const d = opts[Math.floor(r() * opts.length)];
      hall(c, d); linked.add(d); stack.push(d);
    }
    for (let k = 0; k < 2; k++) { const c = Math.floor(r() * rooms.length), o = nb(c); hall(c, o[Math.floor(r() * o.length)]); }

    const s0 = Math.floor(r() * rooms.length), start = rooms[s0].cy * DW + rooms[s0].cx;
    const dist = new Int16Array(DW * DH).fill(-1), q = [start];
    dist[start] = 0;
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % DW, y = (i / DW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, j = ny * DW + nx;
        if (nx >= 0 && ny >= 0 && nx < DW && ny < DH && dist[j] < 0 && t[j] === CHAO) { dist[j] = dist[i] + 1; q.push(j); }
      }
    }
    const mid = m => m.cy * DW + m.cx;
    let b0 = 0;
    rooms.forEach((m, k) => { if (dist[mid(m)] > dist[mid(rooms[b0])]) b0 = k; });
    const obj = new Map();
    obj.set(start, { type: 'saida' });
    obj.set(mid(rooms[b0]), { type: 'chefe', kind });
    // Monstros e baús ficam nas outras salas, fora da linha e da coluna do
    // meio (por onde chegam os corredores), para não fechar a passagem.
    const other = POOLS[tr].find(k => k !== kind);
    let chests = 0;
    rooms.forEach((m, k) => {
      if (k === s0 || k === b0) return;
      const spots = [];
      for (let y = m.y; y < m.y + m.h; y++) for (let x = m.x; x < m.x + m.w; x++) if (x !== m.cx && y !== m.cy) spots.push(y * DW + x);
      if (!spots.length) return;
      const roll = r(), i = spots[Math.floor(r() * spots.length)];
      if (roll < 0.6) obj.set(i, { type: 'monstro', kind: r() < 0.8 ? kind : other });
      else if (roll < 0.8 && chests < 2) { obj.set(i, { type: 'bau', tier: tr }); chests++; }
    });
    return {
      seed: S.hash(seed, n, 992), W: DW, H: DH, t, dist, tier: new Uint8Array(DW * DH).fill(tr), maxD: 0,
      start, camps: [], lair: -1, obj, dungeons: [], fora: PAREDE, masmorra: n, kind,
    };
  }

  (typeof window !== 'undefined' ? window : globalThis).World = {
    W, H, AGUA, AREIA, CAMPO, MATA, PANTANO, MONTANHA, PAREDE, CHAO, TERRENOS, POOLS, FOGUEIRAS, MASMORRAS, QUEM,
    nomeMasmorra, passable, generate, dungeon,
  };
})();
