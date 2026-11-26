// Reino 8bit — protótipo web (cópia do Reinos Hex com visual neon 8-bit).
//
// POR QUE: o Reino 8bit (Reino8bit.md) é o Reinos Hex com cara de fliperama neon.
// As regras são as da Parte 1 do ReinosHex.md, sem mudar nada; só o desenho muda.
// ESTRATÉGIA DO VISUAL: o tabuleiro é desenhado num canvas PIX vezes menor que a
// tela, ampliado sem suavizar (pixel 8-bit) e somado a um brilho (bloom). Ícones
// são grades 9×9 em código (pixel.js), não emoji. Esta pasta é uma cópia: correção
// numa não passa para a outra. Se uma regra mudar no Reinos Hex, copie para cá.
//
// (Comentário original do Reinos Hex:)
// ESTRATÉGIA: o mesmo desenho do guia Unity. As regras (geração do mapa, Validate,
// Apply, batalha, IA) são funções puras sobre um objeto de estado; humano e IA só
// produzem "ações" que passam por validate/apply. O gerador usa o mesmo xorshift e
// a mesma ordem de sorteios do guia, então a mesma semente dá o mesmo mapa aqui e
// no Unity. Tela: canvas para o tabuleiro, HTML para HUD e painéis.
(() => {
  'use strict';

  // ---------------------------------------------------------------- números (GDD §15)
  const CONFIG = {
    mapRadius: 5, safeRadius: 1,
    monsterChance: 0.15, monsterMin: 2, monsterMax: 5,
    raiderChance: 0.10, raiderMin: 3, raiderMax: 6,
    startSoldiers: 5, startResources: bag(2, 2, 2, 2),
    yieldPerHex: 1, cityYield: bag(1, 1, 1, 1),
    claimCost: bag(2, 1, 0, 0), soldierCost: bag(0, 0, 1, 1), towerCost: bag(2, 2, 0, 0),
    neutralJoinPercent: 100,
  };

  const RES = ['madeira', 'pedra', 'ouro', 'pasto'];
  // Ícones são nomes de PIXEL.ICONES (pixel.js); cores em neon sobre fundo preto.
  const RES_ICON = { madeira: 'tronco', pedra: 'montanha', ouro: 'moeda', pasto: 'trigo' };
  const TERRAIN = [
    { name: 'Floresta', res: 'madeira', icon: 'arvore', color: '#39ff6a' },
    { name: 'Pedreira', res: 'pedra', icon: 'montanha', color: '#7fdcff' },
    { name: 'Mina de ouro', res: 'ouro', icon: 'picareta', color: '#ffd23f' },
    { name: 'Pasto', res: 'pasto', icon: 'ovelha', color: '#c6ff3d' },
    { name: 'Cidade', res: null, icon: 'castelo', color: '#f4f4ff' },
  ];
  const CIDADE = 4;
  const PLAYER_COLORS = ['#22e6ff', '#ff3b8d'];   // reino ciano x reino magenta
  const GOOD = '#39ff6a', BAD = '#ff3b5c', NEUTRAL = { monstros: '#e04bff', saqueadores: '#ff9a3c' };
  const FONT = '"VT323", "Courier New", monospace';

  // ---------------------------------------------------------------- recursos e exército
  function bag(madeira = 0, pedra = 0, ouro = 0, pasto = 0) { return { madeira, pedra, ouro, pasto }; }
  const cloneBag = b => bag(b.madeira, b.pedra, b.ouro, b.pasto);
  const canPay = (have, cost) => RES.every(k => have[k] >= cost[k]);
  const pay = (have, cost) => RES.forEach(k => { have[k] -= cost[k]; });
  const addBag = (have, x) => RES.forEach(k => { have[k] += x[k]; });
  const times = (c, n) => bag(c.madeira * n, c.pedra * n, c.ouro * n, c.pasto * n);
  const bagText = b => RES.filter(k => b[k] > 0).map(k => `${b[k]} ${k}`).join(' + ') || 'nada';

  const army = (soldados = 0, monstros = 0, mercenarios = 0) => ({ soldados, monstros, mercenarios });
  const total = a => a.soldados + a.monstros + a.mercenarios;
  // Tira até n unidades na ordem fixa do GDD §7: soldados, mercenários, monstros.
  function take(a, n) {
    const t = army();
    let k = Math.min(n, a.soldados); a.soldados -= k; t.soldados = k; n -= k;
    k = Math.min(n, a.mercenarios); a.mercenarios -= k; t.mercenarios = k; n -= k;
    k = Math.min(n, a.monstros); a.monstros -= k; t.monstros = k;
    return t;
  }

  // ---------------------------------------------------------------- hexágonos (axiais)
  const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const hx = (q, r) => ({ q: q + 0, r: r + 0 }); // "+ 0" troca -0 por 0
  const key = h => h.q + ',' + h.r;
  const same = (a, b) => a.q === b.q && a.r === b.r;
  const neighbors = h => DIRS.map(([dq, dr]) => hx(h.q + dq, h.r + dr));
  const dist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
  const isNeighbor = (a, b) => dist(a, b) === 1;

  // xorshift32, igual ao Rng.cs do guia.
  function Rng(seed) {
    let s = seed >>> 0;
    if (s === 0) s = 0x9E3779B9;
    const next = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s; };
    return {
      range: (min, max) => min + next() % (max - min + 1),
      value: () => (next() & 0xFFFFFF) / 16777216,
    };
  }

  // ---------------------------------------------------------------- estado e geração
  const get = (s, h) => s.index.get(key(h)) || null;
  const owned = (s, p) => s.cells.filter(c => c.owner === p);
  const isFree = c => c.owner < 0 && total(c.army) === 0;
  function addCell(s, c) { s.cells.push(c); s.index.set(key(c.coord), c); }

  // Mapa em forma de hexágono, metade sorteada e metade espelhada (GDD §3).
  function newGame(seed, names) {
    const rng = Rng(seed), R = CONFIG.mapRadius;
    const s = { seed, cells: [], index: new Map(), players: [], current: 0, turn: 1, ply: 0, winner: -1 };
    const cities = [hx(0, -(R - 1)), hx(0, R - 1)];
    for (let q = -R; q <= R; q++) {
      for (let r = Math.max(-R, -q - R); r <= Math.min(R, -q + R); r++) {
        const c = hx(q, r);
        if (!(q > 0 || (q === 0 && r >= 0))) continue;
        const cell = randomCell(c, rng, cities);
        addCell(s, cell);
        if (q !== 0 || r !== 0) addCell(s, { ...cell, coord: hx(-q, -r), army: { ...cell.army } });
      }
    }
    cities.forEach((h, p) => {
      const city = get(s, h);
      city.terrain = CIDADE; city.owner = p; city.army = army(CONFIG.startSoldiers);
      s.players.push({ name: names[p] || `Jogador ${p + 1}`, resources: cloneBag(CONFIG.startResources), city: h, alive: true });
    });
    startTurn(s);
    return s;
  }

  function randomCell(c, rng, cities) {
    const cell = { coord: c, terrain: rng.range(0, 3), owner: -1, army: army(), tower: false };
    const roll = rng.value();
    const nearest = Math.min(...cities.map(city => dist(c, city)));
    if (nearest <= CONFIG.safeRadius) return cell;
    if (roll < CONFIG.monsterChance) cell.army.monstros = rng.range(CONFIG.monsterMin, CONFIG.monsterMax);
    else if (roll < CONFIG.monsterChance + CONFIG.raiderChance) cell.army.mercenarios = rng.range(CONFIG.raiderMin, CONFIG.raiderMax);
    return cell;
  }

  // ---------------------------------------------------------------- regras
  const A = {
    claim: to => ({ type: 'conquistar', to }),
    recruit: (at, count) => ({ type: 'recrutar', to: at, count }),
    tower: at => ({ type: 'torre', to: at }),
    move: (from, to, count) => ({ type: 'mover', from, to, count }),
    attack: (from, to, count) => ({ type: 'atacar', from, to, count }),
    end: () => ({ type: 'fim' }),
  };

  const touchesTerritory = (s, p, h) => neighbors(h).some(n => { const c = get(s, n); return c && c.owner === p; });
  // Pontos de recrutamento: a cidade e as torres de vigia (GDD §6.2).
  const isRecruitPoint = (s, p, c) => c.owner === p && (c.tower || same(c.coord, s.players[p].city));

  function maxRecruit(s) {
    const have = s.players[s.current].resources, cost = CONFIG.soldierCost;
    let max = Infinity;
    RES.forEach(k => { if (cost[k] > 0) max = Math.min(max, Math.floor(have[k] / cost[k])); });
    return max === Infinity ? 0 : max;
  }

  // null se pode; senão, o motivo.
  function validate(s, a) {
    if (s.winner >= 0) return 'A partida já acabou.';
    const me = s.current;
    switch (a.type) {
      case 'conquistar': {
        const to = get(s, a.to);
        if (!to) return 'Fora do mapa.';
        if (to.owner >= 0) return 'Esse hexágono já tem dono.';
        if (total(to.army) > 0) return 'Está ocupado: é preciso atacar.';
        if (!touchesTerritory(s, me, a.to)) return 'Só dá para conquistar vizinhos do seu reino.';
        if (!canPay(s.players[me].resources, CONFIG.claimCost)) return `Faltam recursos. Custo: ${bagText(CONFIG.claimCost)}.`;
        return null;
      }
      case 'recrutar': {
        const at = get(s, a.to);
        if (!at) return 'Fora do mapa.';
        if (!isRecruitPoint(s, me, at)) return 'Só se recruta na cidade ou numa torre de vigia sua.';
        if (a.count < 1) return 'Recrute pelo menos 1.';
        if (a.count > maxRecruit(s)) return `Faltam recursos. Cada soldado custa ${bagText(CONFIG.soldierCost)}.`;
        return null;
      }
      case 'torre': {
        const at = get(s, a.to);
        if (!at) return 'Fora do mapa.';
        if (at.owner !== me) return 'Só dá para construir em hexágono seu.';
        if (same(a.to, s.players[me].city)) return 'A cidade já recruta.';
        if (at.tower) return 'Esse hexágono já tem torre.';
        if (!canPay(s.players[me].resources, CONFIG.towerCost)) return `Faltam recursos. Custo: ${bagText(CONFIG.towerCost)}.`;
        return null;
      }
      case 'mover':
      case 'atacar': {
        const from = get(s, a.from), to = get(s, a.to);
        if (!from || !to) return 'Fora do mapa.';
        if (from.owner !== me) return 'A origem não é sua.';
        if (!isNeighbor(a.from, a.to)) return 'Só dá para agir em hexágonos vizinhos.';
        if (a.count < 1 || a.count > total(from.army)) return 'Quantidade de tropas inválida.';
        if (a.type === 'mover') return to.owner === me ? null : 'Só dá para mover para hexágono seu.';
        if (to.owner === me) return 'Esse hexágono já é seu.';
        if (isFree(to)) return 'Hexágono livre: conquiste pagando recursos.';
        return null;
      }
      case 'fim': return null;
    }
    return 'Ação desconhecida.';
  }

  // Batalha determinística (GDD §7), sem mudar o estado.
  function preview(s, a) {
    const to = get(s, a.to);
    const att = a.count, def = total(to.army);
    const r = {
      attacker: s.current, defender: to.owner, from: a.from, to: a.to, attackers: att, defenders: def,
      attackerWon: att > def, attackerLosses: Math.min(att, def), defenderLosses: Math.min(att, def),
      joinedMonsters: 0, joinedMercenaries: 0, defenderWereMonsters: to.owner < 0 && to.army.monstros > 0,
      cityCaptured: false,
    };
    if (r.attackerWon && to.owner < 0) {
      r.joinedMonsters = Math.floor(to.army.monstros * CONFIG.neutralJoinPercent / 100);
      r.joinedMercenaries = Math.floor(to.army.mercenarios * CONFIG.neutralJoinPercent / 100);
    }
    r.cityCaptured = r.attackerWon && to.owner >= 0 && same(s.players[to.owner].city, a.to);
    return r;
  }

  function previewText(r) {
    if (!r.attackerWon) {
      return `${r.attackers} contra ${r.defenders}: ${r.attackers === r.defenders ? 'EMPATE' : 'DERROTA'}.\n` +
        `As ${r.attackers} tropas enviadas morrem e o defensor perde ${r.defenderLosses}.`;
    }
    let t = `${r.attackers} contra ${r.defenders}: VITÓRIA.\nVocê perde ${r.attackerLosses}; ${r.attackers - r.attackerLosses} ocupam o hexágono.`;
    const joined = r.joinedMonsters + r.joinedMercenaries;
    if (joined > 0) t += `\n+${joined} ${r.joinedMonsters ? 'monstros' : 'mercenários'} entram no seu exército.`;
    if (r.cityCaptured) t += '\nA cidade inimiga cai: fim de jogo!';
    return t;
  }

  // Uma ação por turno (GDD §6.3): toda ação válida encerra o turno; 'fim' é passar a vez.
  function apply(s, a) {
    const err = validate(s, a);
    if (err) throw new Error(`${a.type}: ${err}`);
    const r = applyOne(s, a);
    if (s.winner < 0) endTurn(s);
    return r;
  }

  function applyOne(s, a) {
    const me = s.current, player = s.players[me];
    switch (a.type) {
      case 'conquistar':
        pay(player.resources, CONFIG.claimCost);
        get(s, a.to).owner = me;
        return null;
      case 'recrutar':
        pay(player.resources, times(CONFIG.soldierCost, a.count));
        get(s, a.to).army.soldados += a.count;
        return null;
      case 'torre':
        pay(player.resources, CONFIG.towerCost);
        get(s, a.to).tower = true;
        return null;
      case 'mover': {
        const from = get(s, a.from), to = get(s, a.to);
        const moved = take(from.army, a.count);
        to.army.soldados += moved.soldados; to.army.monstros += moved.monstros; to.army.mercenarios += moved.mercenarios;
        return null;
      }
      case 'atacar': {
        const r = preview(s, a);
        const from = get(s, a.from), to = get(s, a.to);
        const sent = take(from.army, a.count);
        take(sent, r.attackerLosses);
        take(to.army, r.defenderLosses);
        if (r.attackerWon) {
          sent.monstros += r.joinedMonsters; sent.mercenarios += r.joinedMercenaries;
          to.army = sent; to.owner = me;   // uma torre no hexágono passa para o vencedor
          if (r.cityCaptured) {
            s.players[r.defender].alive = false;
            const alive = s.players.map((p, i) => p.alive ? i : -1).filter(i => i >= 0);
            if (alive.length === 1) s.winner = alive[0];
          }
        }
        return r;
      }
    }
    return null;   // 'fim': passar a vez
  }

  function endTurn(s) {
    const n = s.players.length;
    do { s.current = (s.current + 1) % n; if (s.current === 0) s.turn++; } while (!s.players[s.current].alive);
    s.ply++;
    startTurn(s);
  }

  function yieldOf(t) {
    if (t === CIDADE) return cloneBag(CONFIG.cityYield);
    const b = bag(); b[TERRAIN[t].res] = CONFIG.yieldPerHex; return b;
  }

  function startTurn(s) {
    const me = s.current, res = s.players[me].resources;
    s.cells.forEach(c => { if (c.owner === me) addBag(res, yieldOf(c.terrain)); });
  }

  // ---------------------------------------------------------------- IA (guia, Fase 6)
  // Uma ação por turno: a IA escolhe a primeira que servir, nesta ordem. Entre comprar
  // hexágono (madeira + pedra) e recrutar (ouro + pasto), gasta primeiro o estoque mais cheio.
  function aiNext(s) {
    const me = s.current, res = s.players[me].resources;
    const target = enemyCity(s, me);
    const recruitFirst = res.ouro + res.pasto > res.madeira + res.pedra;
    const spend = recruitFirst
      ? () => aiRecruit(s, me, target, 3) || aiClaim(s, me, target)
      : () => aiClaim(s, me, target) || aiRecruit(s, me, target, 3);
    return aiAttackCity(s, me, target) || aiBestAttack(s, me, target) || aiTower(s, me, target) ||
      spend() || aiAdvance(s, me, target) || aiRecruit(s, me, target, 1) || A.end();
  }
  function enemyCity(s, me) {
    let best = s.players[me].city, bd = Infinity;
    s.players.forEach((p, i) => {
      if (i === me || !p.alive) return;
      const d = dist(p.city, s.players[me].city);
      if (d < bd) { bd = d; best = p.city; }
    });
    return best;
  }
  function guard(s, me) {
    const city = s.players[me].city;
    let threat = 0;
    s.cells.forEach(c => { if (c.owner >= 0 && c.owner !== me && dist(c.coord, city) <= 2) threat = Math.max(threat, total(c.army)); });
    return threat + 1;
  }
  const available = (s, me, h) => same(h.coord, s.players[me].city) ? Math.max(0, total(h.army) - guard(s, me)) : total(h.army);
  function aiAttackCity(s, me, city) {
    const def = total(get(s, city).army);
    for (const h of owned(s, me)) {
      if (!isNeighbor(h.coord, city) || total(h.army) <= def) continue;
      const a = A.attack(h.coord, city, total(h.army));
      if (!validate(s, a)) return a;
    }
    return null;
  }
  function aiClaim(s, me, enemy) {
    const res = s.players[me].resources;
    if (!canPay(res, CONFIG.claimCost)) return null;
    let best = null, bestScore = -Infinity;
    s.cells.forEach(c => {
      if (!isFree(c) || !touchesTerritory(s, me, c.coord)) return;
      const stock = c.terrain === CIDADE ? Infinity : res[TERRAIN[c.terrain].res];
      const score = -stock * 10 - dist(c.coord, enemy);
      if (score > bestScore) { bestScore = score; best = c; }
    });
    return best ? A.claim(best.coord) : null;
  }
  // Recruta só com pelo menos `min` soldados de uma vez. Na cidade se ela está ameaçada;
  // senão no ponto de recrutamento mais perto do inimigo.
  function aiRecruit(s, me, enemy, min) {
    const n = maxRecruit(s);
    if (n < min) return null;
    const city = s.players[me].city;
    if (total(get(s, city).army) < guard(s, me)) return A.recruit(city, n);
    let best = city, bd = dist(city, enemy);
    owned(s, me).forEach(c => { if (c.tower && dist(c.coord, enemy) < bd) { bd = dist(c.coord, enemy); best = c.coord; } });
    return A.recruit(best, n);
  }
  // Torre no hexágono seu mais perto do inimigo, se ele estiver a 3+ de qualquer ponto de recrutamento.
  function aiTower(s, me, enemy) {
    if (!canPay(s.players[me].resources, CONFIG.towerCost)) return null;
    const points = owned(s, me).filter(c => isRecruitPoint(s, me, c)).map(c => c.coord);
    let best = null, bd = Infinity;
    owned(s, me).forEach(c => {
      if (c.tower || same(c.coord, s.players[me].city)) return;
      if (points.some(p => dist(p, c.coord) < 3)) return;
      const d = dist(c.coord, enemy);
      if (d < bd) { bd = d; best = c.coord; }
    });
    return best ? A.tower(best) : null;
  }
  function aiBestAttack(s, me, enemy) {
    let best = null, bestScore = -Infinity;
    owned(s, me).forEach(h => {
      const av = available(s, me, h);
      if (av <= 0) return;
      neighbors(h.coord).forEach(n => {
        const t = get(s, n);
        if (!t || t.owner === me || isFree(t)) return;
        const def = total(t.army);
        if (av <= def) return;
        const score = (t.owner >= 0 ? 50 : 30) + def * 2 + (t.tower ? 20 : 0) - dist(n, enemy);
        if (score > bestScore) { bestScore = score; best = A.attack(h.coord, n, av); }
      });
    });
    return best;
  }
  function aiAdvance(s, me, enemy) {
    let best = null, bestAmount = 0;
    owned(s, me).forEach(h => {
      const av = available(s, me, h);
      const touchesEnemy = neighbors(h.coord).some(n => { const t = get(s, n); return t && t.owner >= 0 && t.owner !== me; });
      if (av <= bestAmount || touchesEnemy) return;
      const here = dist(h.coord, enemy);
      const step = neighbors(h.coord).find(n => { const t = get(s, n); return t && t.owner === me && dist(n, enemy) < here; });
      if (step) { best = A.move(h.coord, step, av); bestAmount = av; }
    });
    return best;
  }

  // ---------------------------------------------------------------- partida
  const $ = id => document.getElementById(id);
  const flags = new Set(location.hash.slice(1).split(',').filter(Boolean));
  const flagValue = name => { for (const f of flags) if (f.startsWith(name + '=')) return Number(f.slice(name.length + 1)); return 0; };
  const AI_DELAY = flags.has('rapido') ? 60 : 450;

  let S = null;              // estado da partida
  let seats = [];            // 'humano' | 'ia' por jogador
  let mode = 'hotseat';
  let names = [];
  let token = 0;             // invalida timers da IA de partidas antigas
  let selected = null;       // hexágono selecionado
  let targets = [];
  const fx = [];             // números flutuantes

  const isHumanTurn = () => S && S.winner < 0 && seats[S.current] === 'humano' && $('pass').hidden;
  const viewer = () => seats[S.current] === 'humano' ? S.current : Math.max(0, seats.indexOf('humano'));

  function startMatch(newMode, playerNames, seed) {
    mode = newMode; names = playerNames;
    seats = mode === 'ia' ? ['humano', 'ia'] : mode === 'iaxia' ? ['ia', 'ia'] : ['humano', 'humano'];
    const sd = seed || flagValue('seed') || (Math.floor(Math.random() * 0x7FFFFFFE) + 1);
    S = newGame(sd, names);
    if (flags.has('recursos')) S.players.forEach(p => RES.forEach(k => { p.resources[k] += 50; }));
    token++;
    fx.length = 0;
    $('menu').hidden = true; $('over').hidden = true;
    ['hud', 'log', 'endTurn'].forEach(id => { $(id).hidden = false; });
    $('log').textContent = '';
    frame();
    beginTurn();
    console.info(`Reino 8bit: semente ${sd} (use #seed=${sd} para repetir o mapa).`);
  }

  function beginTurn() {
    deselect(); hidePanel();
    if (mode === 'hotseat') {
      $('passMsg').textContent = `Vez de ${S.players[S.current].name}\nPasse o aparelho e toque em Começar.`;
      $('pass').hidden = false;
    }
    refreshHud();
    if (seats[S.current] === 'ia') runAi();
  }

  function runAi() {
    const tok = token, me = S.current;
    const step = () => {
      if (tok !== token || S.winner >= 0 || S.current !== me) return;
      let a = aiNext(S);
      const err = validate(S, a);
      if (err) { console.error('IA tentou uma ação inválida', a, err); a = A.end(); }
      applyAction(a);   // a ação encerra o turno; beginTurn chama a IA seguinte, se houver
    };
    setTimeout(step, AI_DELAY);
  }

  function submit(a) {
    const err = isHumanTurn() ? validate(S, a) : 'Não é a sua vez.';
    if (err) { showInfo('Não deu', err); return; }
    applyAction(a);
  }

  function applyAction(a) {
    const who = S.players[S.current].name;
    const r = apply(S, a);   // aplica e já passa a vez (GDD §6.3)
    if (r) onBattle(r); else logAction(who, a);
    if (a.type === 'conquistar') addFx(a.to, '+', GOOD);
    if (a.type === 'recrutar') addFx(a.to, `+${a.count}`, GOOD);
    if (a.type === 'torre') addFx(a.to, '', GOOD, 0, 'torre');
    refreshHud();
    if (S.winner >= 0) { gameOver(); return; }
    beginTurn();
  }

  // Como cada turno é uma ação só, o registro conta o que o jogador anterior fez.
  function logAction(who, a) {
    const cell = a.to && get(S, a.to);
    const place = cell ? (same(cell.coord, S.players[cell.owner]?.city ?? hx(99, 99)) ? 'na cidade' : `em ${TERRAIN[cell.terrain].name}`) : '';
    const text = {
      conquistar: `comprou ${place.replace(/^em /, '')}`,
      recrutar: `recrutou ${a.count} soldado(s) ${cell && cell.tower ? 'na torre de vigia' : place}`,
      torre: `construiu uma torre de vigia ${place}`,
      mover: `moveu ${a.count} tropa(s)`,
      fim: 'passou a vez',
    }[a.type];
    $('log').textContent = `${who} ${text || a.type}.`;
  }

  function onBattle(r) {
    const attacker = S.players[r.attacker].name;
    const defender = r.defender >= 0 ? S.players[r.defender].name : (r.defenderWereMonsters ? 'monstros' : 'saqueadores');
    const joined = r.joinedMonsters + r.joinedMercenaries;
    const result = r.attackerWon ? 'venceu' : (r.attackers === r.defenders ? 'empatou' : 'perdeu');
    $('log').textContent = `${attacker} atacou ${defender} com ${r.attackers} contra ${r.defenders} e ${result}` +
      (joined ? ` (+${joined} no exército).` : '.');
    if (r.attackerLosses) addFx(r.from, `-${r.attackerLosses}`, BAD, -0.4);
    if (r.defenderLosses) addFx(r.to, `-${r.defenderLosses}`, BAD);
    if (joined) addFx(r.to, `+${joined}`, GOOD, 0.75, r.joinedMonsters ? 'monstro' : 'espada');
  }

  function gameOver() {
    hidePanel(); deselect();
    $('endTurn').disabled = true;
    $('overMsg').textContent = `${S.players[S.winner].name} tomou a cidade inimiga e venceu!`;
    $('over').hidden = false;
  }

  function refreshHud() {
    const cur = S.players[S.current];
    $('turn').innerHTML = `Rodada ${S.turn} · vez de <span style="color:${PLAYER_COLORS[S.current]}">${esc(cur.name)}</span>`;
    const v = viewer(), p = S.players[v];
    const mine = owned(S, v);
    const troops = mine.reduce((n, c) => n + total(c.army), 0);
    $('res').innerHTML = RES.map(k => `<span title="${k}">${PIXEL.img(RES_ICON[k])}<b>${p.resources[k]}</b></span>`).join('') +
      `<span title="hexágonos">${PIXEL.img('hexagono')}<b>${mine.length}</b></span>` +
      `<span title="tropas">${PIXEL.img('espada', '#f4f4ff')}<b>${troops}</b></span>`;
    $('endTurn').disabled = !isHumanTurn();
  }

  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------------------------------------------------------------- comandos do humano
  function onTap(h) {
    if (!isHumanTurn()) return;
    const cell = get(S, h);
    if (!cell) { deselect(); hidePanel(); return; }
    if (selected && same(selected, h)) { deselect(); hidePanel(); return; }
    if (selected && isNeighbor(selected, h) && tryOrder(selected, h)) return;
    if (cell.owner === S.current) { select(h); return; }
    deselect();
    if (isFree(cell)) offerClaim(h); else describe(cell);
  }

  function select(h) {
    const cell = get(S, h);
    const isCity = same(h, S.players[S.current].city);
    const canOrder = total(cell.army) > 0;
    if (canOrder) { selected = h; computeTargets(); } else deselect();
    const hint = canOrder ? 'Ou toque num vizinho para mover ou atacar.' : 'Sem tropas aqui.';
    const title = `${isCity ? 'Cidade' : TERRAIN[cell.terrain].name}${cell.tower ? ' com torre' : ''}: ${total(cell.army)} tropas`;
    const prod = isCity ? 'Produz 1 de cada recurso.' : `Produz ${TERRAIN[cell.terrain].res}.`;
    const max = maxRecruit(S);
    // Cidade e torre de vigia: recrutar aqui.
    if (isCity || cell.tower) {
      if (max > 0) {
        showCount(title, n => `Recrutar ${n} soldado(s) aqui por ${bagText(times(CONFIG.soldierCost, n))}.\n${hint}`,
          max, 'Recrutar', n => submit(A.recruit(h, n)));
      } else showInfo(title, `${prod}\nSem recursos para recrutar (${bagText(CONFIG.soldierCost)} cada).\n${hint}`);
      return;
    }
    // Outro hexágono seu: construir torre de vigia.
    const err = validate(S, A.tower(h));
    const tower = `Torre de vigia (${bagText(CONFIG.towerCost)}): vira ponto de recrutamento.`;
    if (!err) showConfirm(title, `${prod}\n${tower}\n${hint}`, 'Construir torre', () => submit(A.tower(h)));
    else showInfo(title, `${prod}\n${tower}\n${err}\n${hint}`);
  }

  function tryOrder(from, to) {
    const target = get(S, to);
    const max = total(get(S, from).army);
    if (target.owner === S.current) {
      if (validate(S, A.move(from, to, 1))) return false;
      showCount('Mover tropas', n => `Levar ${n} de ${max} tropas.`,
        max, 'Mover', n => submit(A.move(from, to, n)));
      return true;
    }
    if (validate(S, A.attack(from, to, 1))) return false;
    showCount('Atacar', n => previewText(preview(S, A.attack(from, to, n))), max, 'Atacar',
      n => submit(A.attack(from, to, n)));
    return true;
  }

  function offerClaim(h) {
    const cell = get(S, h);
    const prod = `Produz ${TERRAIN[cell.terrain].res} todo turno.`;
    const err = validate(S, A.claim(h));
    if (err) { showInfo(`${TERRAIN[cell.terrain].name} livre`, `${prod}\n${err}`); return; }
    showConfirm(`Conquistar ${TERRAIN[cell.terrain].name}`, `${prod}\nCusto: ${bagText(CONFIG.claimCost)}.`, 'Pagar',
      () => submit(A.claim(h)));
  }

  function describe(cell) {
    const who = cell.owner >= 0 ? S.players[cell.owner].name : (cell.army.monstros > 0 ? 'Monstros' : 'Saqueadores');
    const extra = cell.owner < 0 ? '\nSe você vencer, eles entram no seu exército.' : '';
    showInfo(`${who}: ${total(cell.army)} tropas`, `Selecione um hexágono seu vizinho para atacar.${extra}`);
  }

  function computeTargets() {
    targets = selected ? neighbors(selected).filter(n =>
      !validate(S, A.move(selected, n, 1)) || !validate(S, A.attack(selected, n, 1))) : [];
  }
  function deselect() { selected = null; targets = []; }

  // ---------------------------------------------------------------- painel
  let panelOk = null, panelBody = null;
  function openPanel(title, body, max, label, ok) {
    $('panel').hidden = false;
    $('pTitle').textContent = title;
    panelBody = body; panelOk = ok;
    const r = $('pRange');
    $('pCountRow').hidden = !(max >= 1);
    if (max >= 1) { r.min = 1; r.max = max; r.value = max; }
    $('pOk').hidden = !ok;
    $('pOk').textContent = label || '';
    updatePanel();
  }
  const panelCount = () => $('pCountRow').hidden ? 0 : Number($('pRange').value);
  function updatePanel() {
    $('pCount').textContent = panelCount();
    $('pBody').textContent = panelBody ? panelBody(panelCount()) : '';
  }
  const showInfo = (t, b) => openPanel(t, () => b, 0, null, null);
  const showConfirm = (t, b, label, ok) => openPanel(t, () => b, 0, label, () => ok());
  const showCount = (t, b, max, label, ok) => openPanel(t, b, max, label, ok);
  function hidePanel() { $('panel').hidden = true; panelOk = null; }
  $('pRange').addEventListener('input', updatePanel);
  $('pClose').addEventListener('click', () => { hidePanel(); });
  $('pOk').addEventListener('click', () => { const ok = panelOk, n = panelCount(); hidePanel(); if (ok) ok(n); });

  // ---------------------------------------------------------------- tela: câmera e desenho
  // POR QUE: o visual 8-bit neon sem tocar nas regras nem na câmera do Reinos Hex.
  // ESTRATÉGIA: `ctx` desenha num canvas `low` PIX vezes menor, com a escala 1/PIX
  // já aplicada, então todo o desenho abaixo continua em pixels de CSS (a câmera,
  // o toque e o zoom são os mesmos do Reinos Hex). No fim do quadro, `low` é
  // ampliado sem suavizar no canvas da tela e ganha o brilho (PIXEL.bloom).
  // Atalhos: #pix=1..4 muda o tamanho do pixel; #sembrilho desliga o brilho.
  const canvas = $('board'), screen = canvas.getContext('2d');
  const low = document.createElement('canvas'), ctx = low.getContext('2d');
  const PIX = Math.min(4, Math.max(1, flagValue('pix') || 2));
  const BLOOM = flags.has('sembrilho') ? 0 : 1;
  const cam = { x: 0, y: 0, zoom: 40, min: 10, max: 200 };
  const SQ3 = Math.sqrt(3);
  // Hexágono de raio 1 no mundo; jogador 0 embaixo (y cresce para baixo na tela).
  const toWorld = h => ({ x: SQ3 * (h.q + h.r / 2), y: -1.5 * h.r });
  function fromWorld(x, y) {
    const fr = -y / 1.5, fq = x / SQ3 - fr / 2, fs = -fq - fr;
    let q = Math.round(fq), r = Math.round(fr), s = Math.round(fs);
    const dq = Math.abs(q - fq), dr = Math.abs(r - fr), ds = Math.abs(s - fs);
    if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
    return hx(q, r);
  }
  const W = () => canvas.clientWidth, H = () => canvas.clientHeight;
  const toScreen = (x, y) => ({ x: (x - cam.x) * cam.zoom + W() / 2, y: (y - cam.y) * cam.zoom + H() / 2 });
  const screenToWorld = (sx, sy) => ({ x: (sx - W() / 2) / cam.zoom + cam.x, y: (sy - H() / 2) / cam.zoom + cam.y });

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W() * dpr); canvas.height = Math.round(H() * dpr);
    low.width = Math.max(1, Math.ceil(W() / PIX)); low.height = Math.max(1, Math.ceil(H() / PIX));
    ctx.setTransform(1 / PIX, 0, 0, 1 / PIX, 0, 0);
  }

  // Enquadra o mapa inteiro, descontando HUD em cima e botões embaixo.
  function frame() {
    if (!S) return;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    S.cells.forEach(c => { const w = toWorld(c.coord); x0 = Math.min(x0, w.x); x1 = Math.max(x1, w.x); y0 = Math.min(y0, w.y); y1 = Math.max(y1, w.y); });
    const top = $('hud').offsetHeight || 50, bottom = 70;
    const zoom = Math.min(W() / (x1 - x0 + 2.4), (H() - top - bottom) / (y1 - y0 + 2.6));
    cam.zoom = zoom; cam.min = zoom * 0.6; cam.max = zoom * 4;
    cam.x = (x0 + x1) / 2;
    cam.y = (y0 + y1) / 2 - (top - bottom) / 2 / zoom;
  }

  function hexPath(cx, cy, radius) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i + 30);
      const x = cx + radius * Math.cos(a), y = cy + radius * Math.sin(a);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function addFx(h, text, color, dx = 0, icon = null) { fx.push({ h, text, color, dx, icon, t0: performance.now() }); }

  // Lado de um ícone 9×9 em px de CSS, arredondado para cada pixel do ícone
  // cair num número inteiro de pixels 8-bit (senão os pixels ficam tortos).
  const iconSize = want => Math.max(1, Math.round(want / 9 / PIX)) * 9 * PIX;
  const font = px => `${Math.max(PIX * 6, Math.round(px))}px ${FONT}`;

  // Fundo: preto com uma grade azul-escura presa ao mapa (anda com a câmera).
  function drawBackdrop() {
    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, W(), H());
    const step = cam.zoom * SQ3;
    if (step < PIX * 6) return;
    const o = toScreen(0, 0);
    ctx.strokeStyle = '#0f1d42'; ctx.lineWidth = PIX;
    ctx.beginPath();
    for (let x = ((o.x % step) + step) % step; x < W(); x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H()); }
    for (let y = ((o.y % step) + step) % step; y < H(); y += step) { ctx.moveTo(0, y); ctx.lineTo(W(), y); }
    ctx.stroke();
  }

  function draw(now) {
    drawBackdrop();
    if (S) {
      const z = cam.zoom;
      const human = isHumanTurn();
      const canClaim = human && canPay(S.players[S.current].resources, CONFIG.claimCost);
      const targetKeys = new Set(targets.map(key));
      const pulse = 0.65 + 0.35 * Math.sin(now / 220);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const c of S.cells) {
        const w = toWorld(c.coord), p = toScreen(w.x, w.y);
        if (p.x < -z * 2 || p.y < -z * 2 || p.x > W() + z * 2 || p.y > H() + z * 2) continue;
        const col = TERRAIN[c.terrain].color;
        // preenchimento fraco na cor do terreno; o dono pinta por cima
        hexPath(p.x, p.y, z * 0.94);
        ctx.fillStyle = col + '16'; ctx.fill();
        if (c.owner >= 0) { ctx.fillStyle = PLAYER_COLORS[c.owner] + '2a'; ctx.fill(); }
        ctx.strokeStyle = col + '60'; ctx.lineWidth = PIX; ctx.stroke();
        // borda acesa do dono
        if (c.owner >= 0) {
          hexPath(p.x, p.y, z * 0.84);
          ctx.strokeStyle = PLAYER_COLORS[c.owner]; ctx.lineWidth = Math.max(PIX * 2, z * 0.08); ctx.stroke();
        }
        // dá para comprar? tracejado verde que anda
        if (canClaim && isFree(c) && touchesTerritory(S, S.current, c.coord)) {
          ctx.setLineDash([z * 0.14, z * 0.1]); ctx.lineDashOffset = -now / 40;
          hexPath(p.x, p.y, z * 0.78); ctx.strokeStyle = GOOD; ctx.lineWidth = Math.max(PIX, z * 0.05); ctx.stroke();
          ctx.setLineDash([]); ctx.lineDashOffset = 0;
        }
        // destaque: seleção amarela, alvos brancos piscando
        if (selected && same(selected, c.coord)) {
          hexPath(p.x, p.y, z * 0.86); ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = Math.max(PIX * 2, z * 0.12); ctx.stroke();
        } else if (targetKeys.has(key(c.coord))) {
          ctx.globalAlpha = pulse;
          hexPath(p.x, p.y, z * 0.8); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(PIX * 2, z * 0.07); ctx.stroke();
          ctx.globalAlpha = 1;
        }
        // ícone do terreno (sobe quando há tropas ou custo embaixo)
        const n = total(c.army), free = isFree(c), raised = n > 0 || free;
        ctx.globalAlpha = c.owner < 0 && n > 0 ? 0.5 : 1;
        PIXEL.draw(ctx, TERRAIN[c.terrain].icon, p.x, p.y - (raised ? z * 0.24 : 0), iconSize(z * (raised ? 0.5 : 0.7)));
        ctx.globalAlpha = 1;
        // torre de vigia no canto de cima
        if (c.tower) PIXEL.draw(ctx, 'torre', p.x + z * 0.44, p.y - z * 0.42, iconSize(z * 0.4));
        // tropas
        if (n > 0) drawBadge(c, p.x, p.y + z * 0.3, n, z);
        // custo de compra: forte onde dá para comprar agora, apagado no resto
        else if (free) drawCost(p.x, p.y + z * 0.32, z, canClaim && touchesTerritory(S, S.current, c.coord));
      }
      // números flutuantes (texto e, às vezes, um ícone depois dele)
      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i], t = (now - f.t0) / 1300;
        if (t >= 1) { fx.splice(i, 1); continue; }
        const w = toWorld(f.h), p = toScreen(w.x + f.dx, w.y);
        const y = p.y - z * (0.3 + t * 0.9);
        ctx.globalAlpha = 1 - t;
        ctx.font = font(z * 0.7);
        const tw = f.text ? ctx.measureText(f.text).width : 0, is = f.icon ? iconSize(z * 0.45) : 0;
        const x0 = p.x - (tw + is) / 2;
        if (f.text) {
          ctx.lineWidth = PIX * 2; ctx.strokeStyle = '#05060f';
          ctx.strokeText(f.text, x0 + tw / 2, y);
          ctx.fillStyle = f.color; ctx.fillText(f.text, x0 + tw / 2, y);
        }
        if (f.icon) PIXEL.draw(ctx, f.icon, x0 + tw + is / 2, y, is);
        ctx.globalAlpha = 1;
      }
    }
    present();
    requestAnimationFrame(draw);
  }

  // Amplia o quadro de baixa resolução sem suavizar e soma o brilho.
  function present() {
    const dpr = window.devicePixelRatio || 1;
    const w = low.width * PIX * dpr, h = low.height * PIX * dpr;
    screen.setTransform(1, 0, 0, 1, 0, 0);
    screen.imageSmoothingEnabled = false;
    screen.drawImage(low, 0, 0, w, h);
    PIXEL.bloom(screen, low, w, h, BLOOM);
  }

  // Caixa de tropas: quadrada (8-bit), fundo preto e borda acesa na cor do dono.
  // Monstros e saqueadores mostram o ícone deles antes do número.
  function drawBadge(c, x, y, n, z) {
    const neutral = c.owner < 0;
    const kind = c.army.monstros > 0 ? 'monstros' : 'saqueadores';
    const color = neutral ? NEUTRAL[kind] : PLAYER_COLORS[c.owner];
    const icon = neutral ? (kind === 'monstros' ? 'monstro' : 'espada') : null;
    const label = String(n);
    ctx.font = font(z * 0.5);
    const tw = ctx.measureText(label).width;
    const is = icon ? iconSize(z * 0.32) : 0, gap = icon ? z * 0.06 : 0;
    const wdt = Math.max(z * 0.5, tw + is + gap + z * 0.24), hgt = z * 0.44;
    ctx.fillStyle = '#05060f'; ctx.fillRect(x - wdt / 2, y - hgt / 2, wdt, hgt);
    ctx.strokeStyle = color; ctx.lineWidth = PIX; ctx.strokeRect(x - wdt / 2, y - hgt / 2, wdt, hgt);
    const x0 = x - (tw + is + gap) / 2;
    if (icon) PIXEL.draw(ctx, icon, x0 + is / 2, y, is, kind === 'saqueadores' ? NEUTRAL.saqueadores : null);
    ctx.fillStyle = neutral ? color : '#ffffff';
    ctx.textAlign = 'left'; ctx.fillText(label, x0 + is + gap, y + PIX / 2); ctx.textAlign = 'center';
  }

  // POR QUE: o jogador vê no próprio tabuleiro quanto custa cada hexágono livre.
  // ESTRATÉGIA: ícone + número de cada recurso com custo > 0 (CONFIG.claimCost),
  // numa caixa preta de borda verde; apagada quando a compra não é possível agora.
  function drawCost(x, y, z, buyable) {
    const parts = RES.filter(k => CONFIG.claimCost[k] > 0).map(k => ({ icon: RES_ICON[k], n: String(CONFIG.claimCost[k]) }));
    ctx.font = font(z * 0.42);
    const is = iconSize(z * 0.26), gap = z * 0.08;
    const widths = parts.map(pt => is + ctx.measureText(pt.n).width);
    const inner = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
    const wdt = inner + z * 0.16, hgt = z * 0.36;
    ctx.globalAlpha = buyable ? 1 : 0.35;
    ctx.fillStyle = '#05060f'; ctx.fillRect(x - wdt / 2, y - hgt / 2, wdt, hgt);
    ctx.strokeStyle = buyable ? GOOD : '#3a4a66'; ctx.lineWidth = PIX; ctx.strokeRect(x - wdt / 2, y - hgt / 2, wdt, hgt);
    let cx = x - inner / 2;
    ctx.textAlign = 'left'; ctx.fillStyle = buyable ? GOOD : '#8899bb';
    parts.forEach((pt, i) => {
      PIXEL.draw(ctx, pt.icon, cx + is / 2, y, is);
      ctx.fillText(pt.n, cx + is, y + PIX / 2);
      cx += widths[i] + gap;
    });
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- input: arrastar, zoom, tocar
  const pointers = new Map();
  let press = null, pinch = null;
  const pinchInfo = () => {
    const [a, b] = [...pointers.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  };
  function zoomAt(z, sx, sy) {
    const before = screenToWorld(sx, sy);
    cam.zoom = Math.min(cam.max, Math.max(cam.min, z));
    const after = screenToWorld(sx, sy);
    cam.x += before.x - after.x; cam.y += before.y - after.y;
  }
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) press = { x: e.clientX, y: e.clientY, dragging: false, grab: screenToWorld(e.clientX, e.clientY) };
    else { press = null; pinch = pinchInfo(); }
  });
  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2) {
      const p = pinchInfo();
      if (pinch && pinch.d > 1 && p.d > 1) zoomAt(cam.zoom * p.d / pinch.d, p.mx, p.my);
      pinch = p;
      return;
    }
    if (!press) return;
    if (!press.dragging && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) press.dragging = true;
    if (press.dragging) {
      const w = screenToWorld(e.clientX, e.clientY);
      cam.x += press.grab.x - w.x; cam.y += press.grab.y - w.y;
    }
  });
  const release = e => {
    pointers.delete(e.pointerId);
    if (press && !press.dragging && e.type === 'pointerup') {
      const w = screenToWorld(e.clientX, e.clientY);
      onTap(fromWorld(w.x, w.y));
    }
    press = null;
    if (pointers.size < 2) pinch = null;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoomAt(cam.zoom * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX, e.clientY); }, { passive: false });
  window.addEventListener('resize', () => { resize(); frame(); });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') { deselect(); hidePanel(); }
    if ((e.key === 'e' || e.key === 'E') && isHumanTurn() && $('menu').hidden) submit(A.end());
  });

  // ---------------------------------------------------------------- botões e menu
  const nameOf = (id, fallback) => ($(id).value.trim() || fallback);
  try { $('name1').value = localStorage.getItem('reino-8bit-nome') || ''; } catch (_) { /* sem storage */ }
  const saveName = () => { try { localStorage.setItem('reino-8bit-nome', $('name1').value.trim()); } catch (_) { /* sem storage */ } };
  let lastStart = null;
  function start(m) {
    saveName();
    const n = m === 'ia' ? [nameOf('name1', 'Jogador'), 'Reino Rival']
      : m === 'iaxia' ? ['IA Azul', 'IA Vermelha'] : [nameOf('name1', 'Jogador'), nameOf('name2', 'Jogador 2')];
    lastStart = m;
    startMatch(m, n);
  }
  $('vsAi').addEventListener('click', () => start('ia'));
  $('hotSeat').addEventListener('click', () => start('hotseat'));
  $('endTurn').addEventListener('click', () => { if (isHumanTurn()) submit(A.end()); });
  $('passBtn').addEventListener('click', () => { $('pass').hidden = true; refreshHud(); });
  $('againBtn').addEventListener('click', () => start(lastStart || 'ia'));
  const toMenu = () => {
    token++; S = null; deselect(); hidePanel();
    ['hud', 'log', 'endTurn', 'pass', 'over'].forEach(id => { $(id).hidden = true; });
    $('menu').hidden = false;
  };
  $('menuBtn').addEventListener('click', toMenu);
  $('overMenuBtn').addEventListener('click', toMenu);

  resize();
  requestAnimationFrame(draw);
  if (flags.has('ia')) start('ia');
  else if (flags.has('hotseat')) start('hotseat');
  else if (flags.has('iaxia')) start('iaxia');

  // Para depurar no console: Reino8bit.state(), Reino8bit.validate(...)
  window.Reino8bit = { state: () => S, validate: a => validate(S, a), preview: a => preview(S, a), CONFIG };
})();
