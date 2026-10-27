// world.js — gera as páginas que o mestre vai desenhando.
//
// POR QUE: no caderno, o mestre inventava o mapa na hora, mas sabia para
// onde a aventura ia (fogueiras no caminho, o dragão no fim). Aqui o mundo
// inteiro é gerado de uma semente no começo e fica escondido: o jogador só
// vê o que já andou perto, e o mestre desenha o resto quando ele chega.
// O mundo são 5 páginas do caderno, uma por bioma (Campos, Deserto,
// Montanhas Geladas, Pântano Sombrio e Vulcão), cada uma do tamanho de uma
// ilha inteira, para cada bioma ter muito o que explorar.
//
// ESTRATÉGIA: cada página é gerada sozinha da sua semente. Ruído de valor
// (elevação e umidade) define o terreno, com limites próprios do bioma; a
// borda afunda para virar mar (ou lava), então a página é uma ilha. Uma
// busca em largura a partir da fogueira inicial mede a distância de cada
// quadrado: ela divide a página em 3 regiões de perigo (as regiões 1 a 15
// do mundo, 3 por página), põe 5 fogueiras pelo caminho e, no ponto
// alcançável mais longe, a passagem para a próxima página (na última, o
// covil do dragão). Cada monstro tem uma masmorra na região dele, com o
// rei (ou a rainha) no fundo; o interior é gerado da mesma semente quando
// o herói entra.
(function () {
  'use strict';
  const S = (typeof window !== 'undefined' ? window : globalThis).Sketch;

  const W = 48, H = 34;
  const AGUA = 0, AREIA = 1, CAMPO = 2, MATA = 3, PANTANO = 4, MONTANHA = 5, PAREDE = 6, CHAO = 7;
  const TERRENOS = ['água', 'praia', 'campo', 'floresta', 'pântano', 'montanha', 'parede', 'chão'];

  // As páginas, em ordem. Os 6 terrenos têm o mesmo papel em todo bioma
  // (água e montanha não se atravessam; mata e pântano escondem mais
  // bicho), mas cada bioma dá outro nome e outro desenho a eles.
  // art = artigo ("os Campos"); agua/monte = limites da elevação; umid =
  // quanto o bioma é mais úmido (+) ou mais seco (−) que os Campos.
  const BIOMAS = [
    { id: 'campos', nome: 'Campos', art: 'os', agua: 0.36, monte: 0.69, umid: 0,
      terrenos: ['água', 'praia', 'campo', 'floresta', 'pântano', 'montanha'] },
    { id: 'deserto', nome: 'Deserto', art: 'o', agua: 0.35, monte: 0.68, umid: -0.24,
      terrenos: ['oásis', 'areia', 'dunas', 'cactos', 'areia movediça', 'rochedos'] },
    { id: 'neve', nome: 'Montanhas Geladas', art: 'as', agua: 0.36, monte: 0.64, umid: -0.04,
      terrenos: ['água gelada', 'gelo', 'neve', 'pinheiros', 'neve funda', 'picos nevados'] },
    { id: 'pantano', nome: 'Pântano Sombrio', art: 'o', agua: 0.37, monte: 0.71, umid: 0.22,
      terrenos: ['água escura', 'lama', 'terra morta', 'árvores mortas', 'brejo', 'rochas'] },
    { id: 'vulcao', nome: 'Vulcão', art: 'o', agua: 0.36, monte: 0.65, umid: -0.1,
      terrenos: ['lava', 'cinzas', 'rocha', 'árvores queimadas', 'fumarolas', 'vulcões'] },
  ];
  const PAGINAS = BIOMAS.length;
  // Página de uma região do mundo (1–3 → 0, 4–6 → 1, ...).
  const pageOf = tier => Math.floor((tier - 1) / 3);

  // Monstros de cada região (o desenho e os números ficam em art.js e game.js).
  const POOLS = {
    1: ['slime', 'rato'], 2: ['goblin', 'lobo'], 3: ['aranha', 'orc'],
    4: ['escorpiao', 'cobra'], 5: ['esqueleto', 'mumia'], 6: ['verme', 'golem'],
    7: ['lobo_gelo', 'boneco_neve'], 8: ['yeti', 'ogro'], 9: ['espirito_gelo', 'troll'],
    10: ['zumbi', 'sapo'], 11: ['fantasma', 'bruxa'], 12: ['cavaleiro', 'ceifador'],
    13: ['salamandra', 'diabrete'], 14: ['cao_infernal', 'elemental'], 15: ['golem_magma', 'fenix'],
  };
  // Acampamentos com fogueira, 5 por página, na ordem do caminho.
  const FOGUEIRAS = [
    'Apontador', 'Borracha', 'Régua', 'Clipe', 'Grampo',
    'Compasso', 'Estojo', 'Transferidor', 'Lancheira', 'Lápis de cor',
    'Caneta', 'Mochila', 'Tesoura', 'Cola', 'Fichário',
    'Esquadro', 'Giz', 'Marca-texto', 'Corretivo', 'Lapiseira',
    'Pincel', 'Guache', 'Carimbo', 'Calculadora', 'Globo',
  ].map(n => 'Acampamento ' + n);
  const FOG_POR_PAGINA = 5;
  // Masmorra de cada monstro: o lugar e o chefe lá no fundo.
  const MASMORRAS = {
    slime: ['Poço', 'Rei Slime'], rato: ['Esgoto', 'Rei Rato'],
    goblin: ['Caverna', 'Rei Goblin'], lobo: ['Toca', 'Rei Lobo'],
    aranha: ['Ninho', 'Rainha Aranha'], orc: ['Forte', 'Rei Orc'],
    escorpiao: ['Fenda', 'Rei Escorpião'], cobra: ['Templo', 'Rainha Naja'],
    esqueleto: ['Cripta', 'Rei Esqueleto'], mumia: ['Pirâmide', 'Rainha Múmia'],
    verme: ['Túnel', 'Rainha Verme'], golem: ['Pedreira', 'Rei Golem'],
    lobo_gelo: ['Gruta Gelada', 'Rei Lobo do Gelo'], boneco_neve: ['Iglu', 'Rei Boneco de Neve'],
    yeti: ['Geleira', 'Rei Yeti'], ogro: ['Gruta', 'Rei Ogro'],
    espirito_gelo: ['Palácio de Gelo', 'Rainha da Nevasca'], troll: ['Fosso', 'Rei Troll'],
    zumbi: ['Mausoléu', 'Rei Zumbi'], sapo: ['Brejo', 'Rei Sapo'],
    fantasma: ['Casarão', 'Rainha Fantasma'], bruxa: ['Cabana', 'Rainha Bruxa'],
    cavaleiro: ['Torre', 'Rei Cavaleiro'], ceifador: ['Catacumba', 'Rei Ceifador'],
    salamandra: ['Forja', 'Rainha Salamandra'], diabrete: ['Chaminé', 'Rei Diabrete'],
    cao_infernal: ['Canil', 'Rei Cão Infernal'], elemental: ['Cratera', 'Rei Elemental'],
    golem_magma: ['Fornalha', 'Rei Golem de Magma'], fenix: ['Pico', 'Rainha Fênix'],
  };
  // Guardião de cada passagem (página 1 a 4): um monstro forte da última
  // região da página, de elmo com chifres, em cima do canto dobrado. Uma
  // masmorra perto dele tem uma segunda escada que sai atrás dele (o atalho).
  const GUARDIOES = [['orc', 'Senhor da Guerra Orc'], ['verme', 'Verme Colossal'], ['troll', 'Troll da Montanha'], ['cavaleiro', 'Cavaleiro da Morte']];
  // "Esgoto do Rei Rato", "Ninho da Rainha Aranha".
  const nomeMasmorra = kind => {
    const [lugar, chefe] = MASMORRAS[kind];
    return `${lugar} ${chefe.startsWith('Rainha') ? 'da' : 'do'} ${chefe}`;
  };
  // Quem dá missão tem nome, um por região (as dicas vêm de gente sem nome).
  const QUEM = ['Seu Juca', 'Dona Filó', 'Tio Bento', 'Vó Nina', 'Mestre Caco', 'Dona Lurdes',
    'Seu Tonho', 'Dona Cida', 'Tio Zé', 'Vó Benta', 'Seu Dito', 'Dona Zuza', 'Mestre Bira', 'Dona Glória', 'Seu Lino'];
  // Personagens de dica por página.
  const DICAS_POR_PAGINA = 4;

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

  function tryGen(seed, pg) {
    const r = S.rng(seed), B = BIOMAS[pg], base = pg * 3 + 1;
    const e1 = valueNoise(r, 7), e2 = valueNoise(r, 3), m1 = valueNoise(r, 6), m2 = valueNoise(r, 2.5);
    const t = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let e = e1(x, y) * 0.7 + e2(x, y) * 0.3;
      const d = Math.max(Math.abs(x / (W - 1) - 0.5), Math.abs(y / (H - 1) - 0.5)) * 2;
      e += 0.06 - Math.max(0, d - 0.62) * 1.4;
      const m = m1(x, y) * 0.7 + m2(x, y) * 0.3 + B.umid;
      t[y * W + x] = e < B.agua ? AGUA : e < B.agua + 0.05 ? AREIA : e > B.monte ? MONTANHA
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

    // Região do mundo: a página tem 3 faixas de distância (base, base+1, base+2).
    const top = base + 2;
    const tier = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) tier[i] = dist[i] < 0 ? 0 : base + Math.min(2, Math.floor(dist[i] * 3 / (maxD + 1)));

    const obj = new Map();
    const near = (i, j, R) => Math.abs(i % W - j % W) <= R && Math.abs(((i / W) | 0) - ((j / W) | 0)) <= R;
    const pick = (lo, hi) => {
      const c = [];
      for (let i = 0; i < W * H; i++) if (dist[i] >= lo && dist[i] <= hi && (t[i] === CAMPO || t[i] === AREIA)) c.push(i);
      return c.length ? c[Math.floor(r() * c.length)] : -1;
    };
    // 5 fogueiras pelo caminho: no início, a ~1/5, ~2/5, ~3/5 e ~4/5 da
    // distância até o fim (2 em cada região, menos na última, que tem 1 e a
    // passagem). Nenhuma fica perto da outra porque as faixas não se tocam.
    const camps = [start, pick(maxD * 0.18, maxD * 0.24), pick(maxD * 0.4, maxD * 0.46),
      pick(maxD * 0.6, maxD * 0.66), pick(maxD * 0.78, maxD * 0.84)];
    if (camps.includes(-1)) return null;
    camps.forEach((i, k) => obj.set(i, { type: 'fogueira', n: pg * FOG_POR_PAGINA + k }));
    // No fim da página, a passagem para a próxima; na última, o covil.
    obj.set(far, pg < PAGINAS - 1 ? { type: 'passagem', to: pg + 1 } : { type: 'covil' });
    // Da 2ª página em diante, uma seta ao lado da primeira fogueira volta
    // para a página anterior (o primeiro vizinho que dá para pisar).
    if (pg > 0) {
      const sx = start % W, sy = (start / W) | 0;
      const spot = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]
        .map(([dx, dy]) => [sx + dx, sy + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < W && y < H)
        .map(([x, y]) => y * W + x).find(i => dist[i] > 0);
      if (spot == null) return null;
      obj.set(spot, { type: 'volta', to: pg - 1 });
    }

    const safe = i => camps.some(v => near(i, v, 2));
    const free = [];
    for (let i = 0; i < W * H; i++) if (dist[i] > 0 && !obj.has(i) && !safe(i)) free.push(i);
    // Perto da passagem (ou do covil) ficam os monstros mais fortes da página.
    for (const i of free) {
      const nearLair = near(i, far, 2);
      if (nearLair ? r() < 0.4 : r() < 0.075) {
        const tr = nearLair ? top : tier[i], pool = POOLS[tr];
        obj.set(i, { type: 'monstro', kind: pool[Math.floor(r() * pool.length)] });
      } else if (r() < 0.02) obj.set(i, { type: 'bau', tier: tier[i] });
    }
    // Grupos: alguns monstros do mapa vêm em 2 ou 3 (o desenho ganha "×2" ou
    // "×3"): ~7% em dupla e ~3% em trio, fora da primeira região do jogo. Sai
    // de um hash da semente, sem sorteio, para não mudar o resto da página.
    for (const [i, o] of obj) if (o.type === 'monstro' && tier[i] > 1) {
      const h = S.hash(seed, i, 61) % 100;
      if (h < 10) o.n = h < 3 ? 3 : 2;
    }
    // Uma masmorra por monstro, na região dele, longe das fogueiras, do fim
    // da página e das outras masmorras. Se não couber, fica de fora.
    const dungeons = [];
    for (let tr = base; tr <= top; tr++) for (const kind of POOLS[tr]) {
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
    for (let tr = base; tr <= top; tr++) {
      const c = free.filter(i => tier[i] === tr && roomy(i));
      if (!c.length) continue;
      const i = c[Math.floor(r() * c.length)];
      obj.set(i, { type: 'npc', quest: true, tier: tr, nome: QUEM[tr - 1] });
      npcs.push(i);
    }
    // `fala` conta no mundo todo (página 2 começa na fala 4), para cada
    // página ter as suas dicas.
    let hints = 0;
    for (let k = 0; k < 600 && hints < DICAS_POR_PAGINA; k++) {
      const i = free[Math.floor(r() * free.length)];
      if (!roomy(i)) continue;
      const fala = pg * DICAS_POR_PAGINA + hints;
      obj.set(i, { type: 'npc', fala, presente: fala % 3 === 1 });
      npcs.push(i);
      hints++;
    }
    // A masmorra do atalho: a da última região mais perto da passagem (sem
    // sorteio, para não mudar o resto da página). Na última página não tem.
    const fx = far % W, fy = (far / W) | 0, gap = i => Math.abs(i % W - fx) + Math.abs(((i / W) | 0) - fy);
    let atalho = -1;
    if (pg < PAGINAS - 1) dungeons.forEach((d, n) => {
      const better = atalho < 0 || (obj.get(d).tier === top) > (obj.get(dungeons[atalho]).tier === top)
        || ((obj.get(d).tier === top) === (obj.get(dungeons[atalho]).tier === top) && gap(d) < gap(dungeons[atalho]));
      if (better) atalho = n;
    });
    return { seed, W, H, t, dist, tier, maxD, start, camps, lair: far, obj, dungeons, fora: AGUA, pg, biome: B.id, atalho };
  }

  // Uma página: tenta a semente, depois a semente + 7919, + 2 × 7919... até
  // sair uma ilha boa (grande e comprida o bastante).
  function generate(seed, pg = 0) {
    for (let k = 0; k < 80; k++) { const w = tryGen((seed + k * 7919) >>> 0, pg); if (w) return w; }
    throw new Error('não consegui gerar uma página');
  }
  // O mundo: as 5 páginas, cada uma com a sua semente tirada da do mundo.
  function world(seed) {
    const pages = [];
    for (let pg = 0; pg < PAGINAS; pg++) pages.push(generate(S.hash(seed, pg, 993), pg));
    return { seed, pages };
  }

  // Interior de uma masmorra: 4 × 3 celas de 5 quadrados, cada uma com uma
  // sala; um labirinto (busca em profundidade) liga as celas por corredores,
  // mais 2 ligações extras para ter mais de um caminho. A escada de saída fica
  // numa sala e o chefe, na sala mais longe dela a pé. `atalho` = página para
  // onde sobe a segunda escada (ou -1): fica na sala mais longe depois da do
  // chefe, colocada depois de todos os sorteios.
  function dungeon(seed, n, kind, tr, atalho = -1) {
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
    if (atalho >= 0) {
      let a = -1;
      rooms.forEach((m, k) => { if (k !== s0 && k !== b0 && (a < 0 || dist[mid(m)] > dist[mid(rooms[a])])) a = k; });
      obj.set(mid(rooms[a]), { type: 'atalho', to: atalho });
    }
    return {
      seed: S.hash(seed, n, 992), W: DW, H: DH, t, dist, tier: new Uint8Array(DW * DH).fill(tr), maxD: 0,
      start, camps: [], lair: -1, obj, dungeons: [], fora: PAREDE, masmorra: n, kind,
    };
  }

  (typeof window !== 'undefined' ? window : globalThis).World = {
    W, H, AGUA, AREIA, CAMPO, MATA, PANTANO, MONTANHA, PAREDE, CHAO, TERRENOS, BIOMAS, PAGINAS, POOLS, FOGUEIRAS, MASMORRAS, QUEM, GUARDIOES,
    nomeMasmorra, pageOf, passable, generate, world, dungeon,
  };
})();
