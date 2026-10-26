// world.js — gera a ilha que o mestre vai desenhando.
//
// POR QUE: no caderno, o mestre inventava o mapa na hora, mas sabia para
// onde a aventura ia (vilas no caminho, o dragão no fim). Aqui o mundo
// inteiro é gerado de uma semente no começo e fica escondido: o jogador só
// vê o que já andou perto, e o mestre desenha o resto quando ele chega.
//
// ESTRATÉGIA: ruído de valor (elevação e umidade) define o terreno; a borda
// afunda para virar mar, então o mundo é uma ilha. Uma busca em largura a
// partir da vila inicial mede a distância de cada quadrado: ela define a
// região de perigo (1 a 6), onde ficam as outras duas vilas (1/3 e 2/3 do
// caminho) e o covil do dragão (o ponto alcançável mais longe).
(function () {
  'use strict';
  const S = (typeof window !== 'undefined' ? window : globalThis).Sketch;

  const W = 48, H = 34;
  const AGUA = 0, AREIA = 1, CAMPO = 2, MATA = 3, PANTANO = 4, MONTANHA = 5;
  const TERRENOS = ['água', 'praia', 'campo', 'floresta', 'pântano', 'montanha'];

  // Monstros de cada região (o desenho e os números ficam em art.js e game.js).
  const POOLS = {
    1: ['slime', 'rato'], 2: ['goblin', 'lobo'], 3: ['esqueleto', 'aranha'],
    4: ['orc', 'bruxa'], 5: ['ogro', 'cavaleiro'], 6: ['troll', 'golem'],
  };
  const VILAS = ['Vila Apontador', 'Aldeia Borracha', 'Cidade Régua'];

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

  const passable = t => t !== AGUA && t !== MONTANHA;

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

    // A vila inicial fica num campo perto do oeste do centro.
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
    const villages = [start, pick(maxD * 0.3, maxD * 0.38), pick(maxD * 0.62, maxD * 0.7)];
    if (villages.includes(-1)) return null;
    villages.forEach((i, n) => obj.set(i, { type: 'vila', n }));
    obj.set(far, { type: 'covil' });

    const safe = i => villages.some(v => near(i, v, 2));
    const free = [];
    for (let i = 0; i < W * H; i++) if (dist[i] > 0 && !obj.has(i) && !safe(i)) free.push(i);
    for (const i of free) {
      const nearLair = near(i, far, 2);
      if (nearLair ? r() < 0.4 : r() < 0.075) {
        const tr = nearLair ? 6 : tier[i], pool = POOLS[tr];
        obj.set(i, { type: 'monstro', kind: pool[Math.floor(r() * pool.length)] });
      } else if (r() < 0.02) obj.set(i, { type: 'bau', tier: tier[i] });
    }
    // Personagens que dão dicas (e às vezes um presente), espalhados pela ilha.
    let npcs = 0;
    for (let k = 0; k < 400 && npcs < 11; k++) {
      const i = free[Math.floor(r() * free.length)];
      if (obj.has(i)) continue;
      obj.set(i, { type: 'npc', fala: npcs, presente: npcs % 3 === 1 });
      npcs++;
    }
    return { seed, W, H, t, dist, tier, maxD, start, villages, lair: far, obj };
  }

  function generate(seed) {
    for (let k = 0; k < 80; k++) { const w = tryGen((seed + k * 7919) >>> 0); if (w) return w; }
    throw new Error('não consegui gerar uma ilha');
  }

  (typeof window !== 'undefined' ? window : globalThis).World = {
    W, H, AGUA, AREIA, CAMPO, MATA, PANTANO, MONTANHA, TERRENOS, POOLS, VILAS, passable, generate,
  };
})();
