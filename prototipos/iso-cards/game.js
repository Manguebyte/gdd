'use strict';
// Iso Cards: protótipo do loop inteiro (GDD em IsoCards.md).
// Mapa do mundo → Campo de batalha → Recompensas → Cidade (Forja, Loja, Classes, Montagem).
// A lógica fica no grid (x, y, altura); só o desenho converte para a tela isométrica.
// Arte PixelLab em Sprites/IsoCards/ (âncoras em sprites.js); sem arte, cai no desenho por código.

const ART = '../../Sprites/IsoCards/';
const SAVE_KEY = 'isocards-save-v1';
const VIGOR = 3, HAND_START = 5, HAND_DRAW = 2, HAND_MAX = 10, N = 8;
const TW = 48, TH = 24, LV = 12;              // tile: largura, altura do losango, altura de 1 nível
const BW = 480, BH = 300, SCALE = 2;          // buffer de baixa resolução, ampliado sem suavização
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const META = window.SPRITE_META || {};
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));

/* ================= Utilidades ================= */
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, DEV.has('fast') ? ms / 6 : ms));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
const regionOf = key => REGIONS.find(r => r.key === key);

/* ================= Arte ================= */
const SPR = { chars: {}, tiles: {}, props: {}, tall: {} };
function loadImg(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
async function loadArt() {
  const charKeys = [...Object.keys(CLASSES), ...Object.keys(MONSTERS)];
  const anims = ['se', 'ne', 'parado-se', 'parado-ne', 'ataque-se', 'ataque-ne'];
  await Promise.all([
    ...charKeys.map(async k => {
      const imgs = await Promise.all(anims.map(n => loadImg(`${ART}personagens/${k}/${n}.png`)));
      if (!imgs[0]) return;
      const o = {}; anims.forEach((n, i) => { o[n] = imgs[i]; });
      SPR.chars[k] = o;
    }),
    ...REGIONS.map(async r => {
      const t = await Promise.all([...Array(16)].map((_, i) => loadImg(`${ART}tiles/${r.key}/tile_${i}.png`)));
      if (t.every(Boolean)) SPR.tiles[r.key] = t;
    }),
    (async () => {
      const [fundo, city, field, boss] = await Promise.all(['fundo', 'cidade', 'campo', 'chefe'].map(n => loadImg(`${ART}mapa/${n}.png`)));
      SPR.world = { fundo, city, field, boss };
    })(),
    ...REGIONS.map(async r => {
      const [arvore, pedra, deco] = await Promise.all(['arvore', 'pedra', 'deco'].map(n => loadImg(`${ART}cenario/${r.key}/${n}.png`)));
      SPR.props[r.key] = { arvore, pedra, deco };
    }),
  ]);
}
// Base visível do sprite (linha do pé), medida pelo script de download; sem medida, o fundo da imagem
const footOf = (path, img) => (META[path] ? META[path][3] : img.height);

// Bloco elevado sem emenda: estica a lateral repetindo a faixa do meio, coluna a coluna
// (drawImage em fatias de 1 px; não usa getImageData, que falha em file://)
function tallBlock(biome, h) {
  const key = biome + h;
  if (SPR.tall[key]) return SPR.tall[key];
  const tile = SPR.tiles[biome][15], ext = h * LV;
  const c = document.createElement('canvas'); c.width = TW; c.height = tile.height + ext;
  const g = c.getContext('2d');
  for (let x = 0; x < TW; x++) {
    const yb = Math.round(12 + (24 - Math.abs(x + 0.5 - 24)) / 2);  // borda de baixo do losango
    g.drawImage(tile, x, 0, 1, yb + 3, x, 0, 1, yb + 3);
    let off = 0; const need = 7 + ext;
    while (off < need) { const n = Math.min(7, need - off); g.drawImage(tile, x, yb + 3, 1, n, x, yb + 3 + off, 1, n); off += n; }
    g.drawImage(tile, x, yb + 10, 1, 2, x, yb + 10 + ext, 1, 2);
  }
  return (SPR.tall[key] = c);
}

/* ================= Save ================= */
let G;   // estado persistente da campanha
function newCampaign() {
  const collection = {};
  const heroes = START_NAMES.map((name, i) => {
    for (const [id, n] of Object.entries(STARTER_DECK)) collection[id] = (collection[id] || 0) + n;
    return { id: i + 1, name, cls: 'escudeiro', owned: ['escudeiro'], deck: { ...STARTER_DECK } };
  });
  return {
    gold: START_GOLD, spheres: { ...START_SPHERES }, items: {}, collection, heroes,
    party: heroes.map(h => h.id), nextId: heroes.length + 1, recruits: 0,
    node: 'pantano-city', visited: { 'pantano-city': true }, bosses: {}, recipes: {}, taught: {},
  };
}
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { /* sem storage: segue sem save */ } }
function loadGame() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

/* ================= Regras de baralho ================= */
const heroById = id => G.heroes.find(h => h.id === id);
function canUse(cls, cardId) {
  const d = CARDS[cardId], c = CLASSES[cls];
  if (d.classe) return d.classe === cls;
  if (d.color === 'incolor') return true;
  return d.color === c.color || d.color2 === c.color;
}
const inDecks = id => G.heroes.reduce((a, h) => a + (h.deck[id] || 0), 0);
const available = id => (G.collection[id] || 0) - inDecks(id);
const deckSize = h => sum(h.deck);
const deckValid = h => deckSize(h) === DECK_SIZE && Object.keys(h.deck).every(id => canUse(h.cls, id));

/* ================= Mapa do mundo ================= */
// Nós: cidade, 2 campos (rotas alternativas) e o chefe; o chefe liga na próxima cidade.
const NODES = {};
REGIONS.forEach((r, i) => {
  const bx = 34 + i * 90, by = i % 2 ? 150 : 172;
  NODES[`${r.key}-city`] = { region: r.key, type: 'city', x: bx, y: by, name: r.city };
  NODES[`${r.key}-f0`] = { region: r.key, type: 'field', map: r.fields[0], x: bx + 26, y: by - 60, name: MAPS[r.fields[0]].name };
  NODES[`${r.key}-f1`] = { region: r.key, type: 'field', map: r.fields[1], x: bx + 30, y: by + 58, name: MAPS[r.fields[1]].name };
  NODES[`${r.key}-boss`] = { region: r.key, type: 'boss', map: r.boss, x: bx + 58, y: by, name: MAPS[r.boss].name };
});
const EDGES = [];
REGIONS.forEach((r, i) => {
  const k = r.key;
  EDGES.push([`${k}-city`, `${k}-f0`], [`${k}-city`, `${k}-f1`], [`${k}-f0`, `${k}-boss`], [`${k}-f1`, `${k}-boss`]);
  if (REGIONS[i + 1]) EDGES.push([`${k}-boss`, `${REGIONS[i + 1].key}-city`]);
});
function neighbors(id) {
  return EDGES.filter(e => e.includes(id)).map(e => (e[0] === id ? e[1] : e[0])).filter(n => {
    const a = NODES[id], b = NODES[n];
    // Atravessar do chefe para a próxima região exige o chefe vencido
    if (a.type === 'boss' && b.region !== a.region) return G.bosses[a.region];
    if (b.type === 'boss' && a.region !== b.region) return true;
    return true;
  });
}

/* ================= Telas ================= */
let screen = 'map';
function show(name) {
  screen = name;
  ['map', 'city', 'battle'].forEach(s => { $('scr-' + s).hidden = s !== name; });
  $('field').hidden = name === 'city';
  $('handwrap').hidden = $('scr-battle-bar').hidden = name !== 'battle';
  $('turninfo').textContent = '';
  renderHeader();
  if (name === 'map') renderMapPanel();
  if (name === 'city') renderCity();
}
function renderHeader() {
  const sph = [...COLORS, 'incolor', 'especial'].filter(c => G.spheres[c])
    .map(c => `<span class="sph" style="--sc:${COLOR_HEX[c]}" title="Esferas ${COLOR_NAME[c]}">${G.spheres[c]}</span>`).join('');
  $('wallet').innerHTML = `<span class="gold" title="Ouro">${G.gold} ouro</span>${sph}`;
}
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}
function modal(title, html, buttons) {
  $('ovtitle').textContent = title; $('ovbody').innerHTML = html;
  $('ovbtns').innerHTML = buttons.map((b, i) => `<button class="btn${i ? ' ghost' : ''}" data-ov="${i}">${esc(b.label)}</button>`).join('');
  $('overlay').classList.add('show');
  $('ovbtns').onclick = ev => {
    const i = ev.target.closest('[data-ov]'); if (!i) return;
    $('overlay').classList.remove('show'); buttons[+i.dataset.ov].fn();
  };
  $('ovbtns').querySelector('button').focus();
}

/* ---------- Painel do mapa ---------- */
function renderMapPanel() {
  const n = NODES[G.node], r = regionOf(n.region);
  const typeName = { city: 'Cidade', field: 'Campo de batalha', boss: 'Ponto de história' }[n.type];
  let html = `<p class="kicker">${r.name} · ${typeName}</p><h2>${esc(n.name)}</h2>`;
  if (n.type === 'city') html += `<p>Nó seguro: forja, loja, classes e montagem. O jogo grava aqui.</p><button class="btn" id="entercity">Entrar na cidade</button>`;
  if (n.type === 'field') html += `<p>Esferas ${COLOR_NAME[r.color]}. Monstros: ${[...new Set(MAPS[n.map].foes.map(f => MONSTERS[f[0]].name))].join(', ')}.</p><button class="btn" id="farm">Lutar aqui de novo</button>`;
  if (n.type === 'boss') html += G.bosses[n.region] ? '<p>Chefe vencido. A trilha para a próxima região está aberta.</p>' : '<p>O chefe espera aqui.</p>';
  html += '<p class="hint">Clique num nó vizinho, ligado por trilha, para viajar.</p>';
  $('mappanel').innerHTML = html;
  const ec = $('entercity'); if (ec) ec.onclick = () => enterCity();
  const fm = $('farm'); if (fm) fm.onclick = () => startBattle(n.map, G.node);
}

function travel(to) {
  if (!neighbors(G.node).includes(to)) return;
  G.node = to;
  const n = NODES[to], first = !G.visited[to];
  G.visited[to] = true;
  if (n.type === 'city') { enterCity(); return; }
  if (n.type === 'field' && first) { startBattle(n.map, to); return; }
  if (n.type === 'boss' && !G.bosses[n.region]) { startBattle(n.map, to); return; }
  renderMapPanel(); renderHeader();
}

/* ================= Cidade ================= */
let cityTab = 'grupo', deckHero = null;
function enterCity() {
  const n = NODES[G.node], r = regionOf(n.region);
  // O ferreiro ensina as receitas da cor local na primeira visita
  const taught = RECIPES.filter(rc => rc.region === r.key && rc.learned && !G.recipes[rc.card]);
  taught.forEach(rc => { G.recipes[rc.card] = 'aprendida'; });
  saveGame();
  show('city');
  if (taught.length) toast(`O ferreiro ensinou: ${taught.map(rc => CARDS[rc.card].name).join(', ')}.`);
}
function renderCity() {
  const n = NODES[G.node], r = regionOf(n.region);
  $('cityname').textContent = r.city;
  $('citysub').textContent = `${r.name} · esferas ${COLOR_NAME[r.color]}. O jogo foi gravado ao entrar.`;
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === cityTab));
  const body = $('citybody');
  if (cityTab === 'grupo') body.innerHTML = cityGroup();
  if (cityTab === 'montagem') body.innerHTML = cityDeck();
  if (cityTab === 'loja') body.innerHTML = cityShop(r);
  if (cityTab === 'forja') body.innerHTML = cityForge();
  if (cityTab === 'livro') body.innerHTML = cityBook();
  renderHeader();
}
const sphereChip = (c, n) => `<span class="sph" style="--sc:${COLOR_HEX[c]}">${n}</span> ${COLOR_NAME[c]}`;

function cityGroup() {
  const rows = G.heroes.map(h => {
    const c = CLASSES[h.cls], inParty = G.party.includes(h.id);
    const opts = Object.entries(CLASSES).filter(([k]) => k !== h.cls).map(([k, cl]) => {
      const free = h.owned.includes(k) || k === 'escudeiro';
      const can = free || (G.spheres[cl.color] || 0) >= CLASS_CHANGE_COST;
      const price = free ? 'grátis' : `${CLASS_CHANGE_COST} ${COLOR_NAME[cl.color].toLowerCase()}`;
      return `<button class="chip" data-cls="${h.id}:${k}" ${can ? '' : 'disabled'} style="--sc:${COLOR_HEX[cl.color]}">${cl.name} <small>${price}</small></button>`;
    }).join('');
    return `<div class="hero">
      <div class="herohead"><span class="dot" style="--sc:${COLOR_HEX[c.color]}"></span><b>${esc(h.name)}</b> · ${c.name} (${COLOR_NAME[c.color]}) · ${c.hp} PV
        <span class="deckcount ${deckValid(h) ? 'ok' : 'bad'}">${deckSize(h)}/${DECK_SIZE} cartas</span>
        <label class="inparty"><input type="checkbox" data-party="${h.id}" ${inParty ? 'checked' : ''}> Na batalha</label></div>
      <div class="chips"><span class="lbl">Trocar de classe:</span>${opts}</div>
    </div>`;
  }).join('');
  const canRecruit = G.heroes.length < PARTY_MAX && G.gold >= RECRUIT_COST;
  return `<p>Escolha os ${BATTLE_SIZE} que entram nas batalhas. A troca custa ${CLASS_CHANGE_COST} esferas da cor da classe nova; voltar a uma classe que o personagem já teve é grátis. Na primeira vez numa classe, ele traz ${CLASS_KIT} cópias de cada carta exclusiva dela para a coleção.</p>
    ${rows}
    <p><button class="btn" data-recruit ${canRecruit ? '' : 'disabled'}>Recrutar Escudeiro (${RECRUIT_COST} ouro)</button>
    <span class="hint">Grupo: ${G.heroes.length}/${PARTY_MAX}. O recruta chega com um baralho incolor.</span></p>`;
}

function cityDeck() {
  if (!deckHero || !heroById(deckHero)) deckHero = G.heroes[0].id;
  const h = heroById(deckHero), c = CLASSES[h.cls];
  const tabs = G.heroes.map(x => `<button class="chip" data-dh="${x.id}" aria-pressed="${x.id === h.id}">${esc(x.name)} <small>${CLASSES[x.cls].name}</small></button>`).join('');
  const deckIds = Object.keys(h.deck).filter(id => h.deck[id] > 0);
  const pool = Object.keys(G.collection).filter(id => canUse(h.cls, id) && available(id) > 0);
  const row = (id, n, sign) => {
    const d = CARDS[id];
    return `<li><span class="dot" style="--sc:${COLOR_HEX[d.color]}"></span><span class="cn">${d.name}</span><small>${d.cost} Vigor · ${esc(d.text)}</small><b>×${n}</b><button class="mini" data-${sign === '+' ? 'add' : 'rem'}="${id}" aria-label="${sign === '+' ? 'Pôr' : 'Tirar'} ${d.name}">${sign}</button></li>`;
  };
  return `<div class="chips">${tabs}</div>
    <p>${esc(h.name)} é ${c.name}: usa cartas incolores${c.color !== 'incolor' ? `, da cor ${COLOR_NAME[c.color]}` : ''}${c.cards.length ? ' e as exclusivas da classe' : ''}. O baralho precisa de exatamente ${DECK_SIZE} cartas para sair da cidade.</p>
    <div class="deckcols">
      <section><h3>Baralho <span class="deckcount ${deckValid(h) ? 'ok' : 'bad'}">${deckSize(h)}/${DECK_SIZE}</span></h3><ul class="cardlist">${deckIds.map(id => row(id, h.deck[id], '−')).join('') || '<li class="empty">Vazio</li>'}</ul></section>
      <section><h3>Coleção disponível</h3><ul class="cardlist">${pool.map(id => row(id, available(id), '+')).join('') || '<li class="empty">Nada disponível para esta classe. Forje cartas da cor dela.</li>'}</ul></section>
    </div>`;
}

function cityShop(r) {
  const items = [...r.sells.map((c, i) => [c, i === 0 ? PRICE_LOCAL : PRICE_NEAR]), ['incolor', PRICE_INCOLOR]];
  return `<p>Esta cidade vende esferas da cor do seu bioma (mais baratas), das cores vizinhas na trilha e incolores.</p>
    <ul class="shop">${items.map(([c, p]) => `<li>${sphereChip(c, G.spheres[c] || 0)} <span class="price">${p} ouro</span>
      <button class="btn ghost" data-buy="${c}:${p}:1" ${G.gold >= p ? '' : 'disabled'}>Comprar 1</button>
      <button class="btn ghost" data-buy="${c}:${p}:5" ${G.gold >= p * 5 ? '' : 'disabled'}>Comprar 5</button></li>`).join('')}</ul>`;
}

let forgeSel = { item: null, spheres: {} };
function cityForge() {
  const items = Object.keys(G.items).filter(k => G.items[k] > 0);
  const colors = [...COLORS, 'incolor', 'especial'];
  const itemHtml = items.length ? items.map(k => `<button class="chip" data-fitem="${k}" aria-pressed="${forgeSel.item === k}" title="${esc(ITEMS[k].text)}">${ITEMS[k].name} ×${G.items[k]}</button>`).join('')
    : '<span class="hint">Sem itens. Monstros deixam itens ao cair.</span>';
  const sel = forgeSel.item ? `<p class="clue">“${esc(ITEMS[forgeSel.item].text)}”</p>` : '';
  const steppers = colors.map(c => {
    const have = G.spheres[c] || 0, n = forgeSel.spheres[c] || 0;
    return `<div class="stepper"><span>${sphereChip(c, have)}</span><button class="mini" data-fs="${c}:-1" ${n ? '' : 'disabled'}>−</button><b>${n}</b><button class="mini" data-fs="${c}:1" ${n < have ? '' : 'disabled'}>+</button></div>`;
  }).join('');
  const conv = COLORS.map(c => `<option value="${c}">${COLOR_NAME[c]}</option>`).join('');
  return `<p>Escolha 1 item e as esferas. Receita certa forja ${FORGE_COPIES} cópias da carta e entra no Livro de Receitas; combinação errada vira uma Carta Rachada e gasta tudo.</p>
    <h3>Item</h3><div class="chips">${itemHtml}</div>${sel}
    <h3>Esferas</h3><div class="steppers">${steppers}</div>
    <p><button class="btn" data-forge ${forgeSel.item && sum(forgeSel.spheres) ? '' : 'disabled'}>Forjar</button></p>
    <h3>Conversão</h3><p>3 esferas de uma cor viram 1 de outra.
      <select id="convfrom" aria-label="De">${conv}<option value="incolor">Incolor</option></select> →
      <select id="convto" aria-label="Para">${conv}</select>
      <button class="btn ghost" data-convert>Converter</button></p>`;
}

function cityBook() {
  const rows = RECIPES.filter(rc => G.recipes[rc.card]).map(rc => {
    const d = CARDS[rc.card];
    const sp = Object.entries(rc.spheres).map(([c, n]) => sphereChip(c, n)).join(' + ');
    return `<li><b>${d.name}</b> <small>(${G.recipes[rc.card]})</small><br>${sp} + ${ITEMS[rc.item].name}<br><small>${esc(d.text)}</small></li>`;
  }).join('');
  const total = RECIPES.length, known = Object.keys(G.recipes).length;
  return `<p>${known} de ${total} receitas. As aprendidas vêm do ferreiro de cada cidade; as outras se descobrem testando na forja. A descrição dos itens dá pistas.</p><ul class="book">${rows || '<li class="empty">Nenhuma ainda.</li>'}</ul>`;
}

function doForge() {
  const it = forgeSel.item, sp = Object.fromEntries(Object.entries(forgeSel.spheres).filter(([, n]) => n > 0));
  if (!it || !sum(sp)) return;
  G.items[it]--;
  for (const [c, n] of Object.entries(sp)) G.spheres[c] -= n;
  const match = RECIPES.find(rc => rc.item === it && Object.keys(rc.spheres).length === Object.keys(sp).length
    && Object.entries(rc.spheres).every(([c, n]) => sp[c] === n));
  forgeSel = { item: null, spheres: {} };
  if (match) {
    G.collection[match.card] = (G.collection[match.card] || 0) + FORGE_COPIES;
    const isNew = !G.recipes[match.card];
    if (isNew) G.recipes[match.card] = 'descoberta';
    modal('Forja', `<p>Saíram ${FORGE_COPIES} cópias de <b>${CARDS[match.card].name}</b> (${COLOR_NAME[CARDS[match.card].color]}${CARDS[match.card].color2 ? '/' + COLOR_NAME[CARDS[match.card].color2] : ''}).</p>${isNew ? '<p>Receita nova no Livro de Receitas!</p>' : ''}<p>${esc(CARDS[match.card].text)}</p>`, [{ label: 'Ok', fn: () => renderCity() }]);
  } else {
    G.collection.rachada = (G.collection.rachada || 0) + 1;
    modal('A forja falhou', '<p>A combinação não era uma receita. Saiu uma <b>Carta Rachada</b> (incolor e fraca), e o item e as esferas se perderam.</p>', [{ label: 'Ok', fn: () => renderCity() }]);
  }
  renderHeader();
}

function changeClass(heroId, cls) {
  const h = heroById(heroId), cl = CLASSES[cls];
  const free = h.owned.includes(cls) || cls === 'escudeiro';
  if (!free) {
    if ((G.spheres[cl.color] || 0) < CLASS_CHANGE_COST) return;
    G.spheres[cl.color] -= CLASS_CHANGE_COST;
  }
  if (!h.owned.includes(cls)) {
    h.owned.push(cls);
    cl.cards.forEach(id => { G.collection[id] = (G.collection[id] || 0) + CLASS_KIT; });
  }
  h.cls = cls;
  // Cartas que a classe nova não usa voltam para a coleção
  const out = Object.keys(h.deck).filter(id => !canUse(cls, id));
  const back = out.reduce((a, id) => a + h.deck[id], 0);
  out.forEach(id => delete h.deck[id]);
  toast(`${h.name} agora é ${cl.name}.${back ? ` ${back} cartas voltaram para a coleção: remonte o baralho.` : ''}`);
  renderCity();
}

function leaveCity() {
  const party = G.party.map(heroById).filter(Boolean);
  if (party.length !== BATTLE_SIZE) { toast(`Escolha exatamente ${BATTLE_SIZE} personagens para a batalha (aba Grupo).`); return; }
  const bad = party.find(h => !deckValid(h));
  if (bad) { toast(`O baralho de ${bad.name} precisa de ${DECK_SIZE} cartas válidas (aba Montagem).`); cityTab = 'montagem'; deckHero = bad.id; renderCity(); return; }
  show('map');
}

$('citybody').addEventListener('click', ev => {
  const t = ev.target.closest('button,input'); if (!t || t.disabled) return;
  const ds = t.dataset;
  if (ds.cls) { const [id, k] = ds.cls.split(':'); changeClass(+id, k); return; }
  if (ds.recruit !== undefined) {
    if (G.heroes.length >= PARTY_MAX || G.gold < RECRUIT_COST) return;
    G.gold -= RECRUIT_COST;
    const name = RECRUIT_NAMES[G.recruits++ % RECRUIT_NAMES.length];
    for (const [id, n] of Object.entries(STARTER_DECK)) G.collection[id] = (G.collection[id] || 0) + n;
    G.heroes.push({ id: G.nextId++, name, cls: 'escudeiro', owned: ['escudeiro'], deck: { ...STARTER_DECK } });
    toast(`${name} entrou no grupo como Escudeiro.`); renderCity(); return;
  }
  if (ds.party) {
    const id = +ds.party;
    if (t.checked) { if (G.party.length >= BATTLE_SIZE) { t.checked = false; toast(`Só ${BATTLE_SIZE} entram na batalha. Tire alguém antes.`); return; } G.party.push(id); }
    else G.party = G.party.filter(x => x !== id);
    renderCity(); return;
  }
  if (ds.dh) { deckHero = +ds.dh; renderCity(); return; }
  if (ds.add) { const h = heroById(deckHero); if (deckSize(h) >= DECK_SIZE) { toast(`O baralho já tem ${DECK_SIZE} cartas. Tire uma antes.`); return; } h.deck[ds.add] = (h.deck[ds.add] || 0) + 1; renderCity(); return; }
  if (ds.rem) { const h = heroById(deckHero); if (--h.deck[ds.rem] <= 0) delete h.deck[ds.rem]; renderCity(); return; }
  if (ds.buy) { const [c, p, q] = ds.buy.split(':'); const cost = +p * +q; if (G.gold < cost) return; G.gold -= cost; G.spheres[c] = (G.spheres[c] || 0) + +q; renderCity(); return; }
  if (ds.fitem) { forgeSel.item = forgeSel.item === ds.fitem ? null : ds.fitem; renderCity(); return; }
  if (ds.fs) { const [c, d] = ds.fs.split(':'); forgeSel.spheres[c] = Math.max(0, Math.min(G.spheres[c] || 0, (forgeSel.spheres[c] || 0) + +d)); renderCity(); return; }
  if (ds.forge !== undefined) { doForge(); return; }
  if (ds.convert !== undefined) {
    const from = $('convfrom').value, to = $('convto').value;
    if (from === to) { toast('Escolha cores diferentes.'); return; }
    if ((G.spheres[from] || 0) < 3) { toast(`Precisa de 3 esferas ${COLOR_NAME[from].toLowerCase()}.`); return; }
    G.spheres[from] -= 3; G.spheres[to] = (G.spheres[to] || 0) + 1; renderCity(); return;
  }
});
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { cityTab = b.dataset.tab; renderCity(); }));
$('leavecity').addEventListener('click', leaveCity);

/* ================= Batalha ================= */
let S = null, UID = 0;   // estado da batalha atual
const def = c => CARDS[c.id];
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const inBounds = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

function parseMap(m) {
  const H = [], T = [];
  m.rows.forEach((row, y) => {
    H.push([]); T.push([]);
    [...row].forEach((ch, x) => {
      H[y][x] = ch === '1' ? 1 : ch === '2' ? 2 : 0;
      T[y][x] = ch === '~' ? 'liquid' : ch === 'r' ? 'pedra' : ch === 't' ? 'arvore' : ch === 'm' ? 'deco' : 'ground';
    });
  });
  return { H, T };
}
const blocked = (x, y) => ['liquid', 'pedra', 'arvore'].includes(S.T[y][x]);
const heightAt = (x, y) => S.H[y][x];

function mkUnit(side, key, x, y, name, deck, hp, cls) {
  const cards = [];
  for (const [id, n] of Object.entries(deck)) for (let i = 0; i < n; i++) cards.push({ uid: ++UID, id });
  return { side, key, name, cls, hp, maxHp: hp, x, y, armor: 0, vigor: 0, counter: 0, status: {},
    deck: shuffle(cards), hand: [], discard: [], alive: true, face: side === 'hero' ? 'se' : 'sw', anim: null, ox: 0, oy: 0 };
}
const heroes = () => S.units.filter(u => u.side === 'hero' && u.alive);
const enemies = () => S.units.filter(u => u.side === 'enemy' && u.alive);
const cur = () => S.units[S.sel];
const unitAt = (x, y) => S.units.find(u => u.alive && u.x === x && u.y === y);

function startBattle(mapKey, nodeId) {
  const m = MAPS[mapKey], { H, T } = parseMap(m), node = NODES[nodeId];
  UID = 0;
  S = { map: mapKey, node: nodeId, region: node.region, H, T, turn: 0, phase: 'player', units: [], sel: 0,
    pending: null, log: [], popups: [], hover: null, note: '', defeated: [] };
  G.party.map(heroById).forEach((h, i) => {
    const [x, y] = m.heroes[i];
    S.units.push(mkUnit('hero', h.cls, x, y, h.name, h.deck, CLASSES[h.cls].hp, h.cls));
  });
  m.foes.forEach(([k, x, y]) => {
    const mo = MONSTERS[k];
    S.units.push(mkUnit('enemy', k, x, y, mo.name, mo.deck, mo.hp));
  });
  S.units.forEach(u => drawCards(u, u.side === 'hero' ? HAND_START : 4));
  show('battle');
  log(`${m.name}: a batalha começa.`);
  startPlayerTurn(true);
}

function drawCards(u, n) {
  for (let i = 0; i < n; i++) {
    if (u.hand.length >= HAND_MAX) break;
    if (!u.deck.length) { if (!u.discard.length) break; u.deck = shuffle(u.discard); u.discard = []; }
    u.hand.push(u.deck.pop());
  }
}

// Casas alcançáveis: 4 vizinhos, sem líquido/obstáculo/unidade, subindo no máximo 1 nível por passo
function reachable(u, steps) {
  const seen = new Set([u.x + ',' + u.y]), out = [];
  let frontier = [[u.x, u.y]];
  for (let s = 0; s < steps; s++) {
    const next = [];
    for (const [x, y] of frontier) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (seen.has(k) || !inBounds(nx, ny) || blocked(nx, ny) || unitAt(nx, ny)) continue;
      if (heightAt(nx, ny) - heightAt(x, y) > 1) continue;
      seen.add(k); next.push([nx, ny]); out.push({ x: nx, y: ny });
    }
    frontier = next;
  }
  return out;
}
// Alcance efetivo: ataque à distância de cima ganha +1
const rangeTo = (u, d, t) => d.range + (d.range > 1 && heightAt(u.x, u.y) > heightAt(t.x, t.y) ? 1 : 0);

function targetsFor(u, d) {
  if (d.kind === 'move') return u.status.preso ? [] : reachable(u, d.move);
  if (d.kind === 'attack' || d.kind === 'steal')
    return S.units.filter(v => v.alive && v.side !== u.side && dist(u, v) <= rangeTo(u, d, v)).map(v => ({ x: v.x, y: v.y }));
  if (d.kind === 'heal')
    return S.units.filter(v => v.alive && v.side === u.side && dist(u, v) <= d.range).map(v => ({ x: v.x, y: v.y }));
  if (d.kind === 'area') {
    if (d.range === 0) return [{ x: u.x, y: u.y }];
    const foes = S.units.filter(v => v.alive && (d.ally ? v.side === u.side : v.side !== u.side));
    const out = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (Math.abs(u.x - x) + Math.abs(u.y - y) > d.range) continue;
      if (foes.some(f => Math.abs(f.x - x) + Math.abs(f.y - y) <= d.radius)) out.push({ x, y });
    }
    return out;
  }
  return [];
}

function log(msg) { S.log.unshift(msg); S.log = S.log.slice(0, 40); }
function popup(t, text, color) { S.popups.push({ x: t.x, y: t.y, h: heightAt(t.x, t.y), text, color, t: performance.now() }); }

function damage(t, n, src) {
  const absorbed = Math.min(t.armor, n);
  t.armor -= absorbed; t.hp -= (n - absorbed);
  popup(t, '-' + n, absorbed ? '#9cc3ff' : '#ff6b5a');
  t.hurt = performance.now();
  if (t.hp <= 0) {
    t.hp = 0; t.alive = false;
    log(`${t.name} caiu. O baralho ${t.side === 'hero' ? 'dele' : 'do monstro'} sai da batalha.`);
    if (t.side === 'enemy') S.defeated.push(t.key);
  }
  if (src && src.melee && t.alive && t.counter && src.unit.alive) {
    const c = t.counter; t.counter = 0;
    log(`${t.name} revida ${c}.`); damage(src.unit, c);
  }
}
function heal(t, n) { if (!t.alive || n <= 0) return; const v = Math.min(n, t.maxHp - t.hp); t.hp += v; popup(t, '+' + n, '#7be08f'); }
function applyStatus(t, st) {
  if (!st || !t.alive) return;
  const [k, n] = st; t.status[k] = Math.max(t.status[k] || 0, n);
  popup(t, { preso: 'preso', veneno: 'veneno', queimadura: 'queimado' }[k], '#e8d27a');
}
function face(u, x, y) {
  const dx = x - u.x, dy = y - u.y;
  if (!dx && !dy) return;
  if (Math.abs(dx) >= Math.abs(dy)) u.face = dx > 0 ? 'se' : 'nw'; else u.face = dy > 0 ? 'sw' : 'ne';
}
function playAnim(u, name) { u.anim = { name, t: performance.now() }; }
// Andar é um deslize por código entre a casa de origem e a de destino
function moveUnit(u, x, y) { face(u, x, y); u.slide = { from: cellCenter(u.x, u.y), t: performance.now() }; u.x = x; u.y = y; }
const SLIDE_MS = 260;
const resonance = (u, d) => d.color2 && u.side === 'hero' && [d.color, d.color2].every(c => (CLASSES[u.cls].colors || [CLASSES[u.cls].color]).includes(c));

function removeCard(u, uid, toDiscard) {
  const i = u.hand.findIndex(c => c.uid === uid);
  const [c] = u.hand.splice(i, 1);
  if (toDiscard && !c.stolen) u.discard.push(c);
  return c;
}

// Status no começo do turno do lado: veneno 1, queimadura 2 por turno
function tickStatus(u) {
  for (const [k, dmg] of [['veneno', 1], ['queimadura', 2]]) {
    if (!u.status[k]) continue;
    damage(u, dmg); log(`${u.name} sofre ${dmg} de ${k}.`);
    if (--u.status[k] <= 0) delete u.status[k];
  }
}
function endSideStatus(units) { units.forEach(u => { if (u.status.preso && --u.status.preso <= 0) delete u.status.preso; }); }

function startPlayerTurn(first) {
  S.turn++; S.phase = 'player'; S.pending = null; S.note = '';
  heroes().forEach(h => { h.vigor = VIGOR; if (!first) { drawCards(h, HAND_DRAW); tickStatus(h); } });
  if (checkEnd()) return;
  if (!cur() || !cur().alive || cur().side !== 'hero') S.sel = S.units.indexOf(heroes()[0]);
  log(`Turno ${S.turn}: sua vez.`);
  renderBattleUI();
  if (DEV.has('auto')) autoTurn();
}
// #auto: o grupo joga com a mesma IA dos inimigos (teste e miniatura do hub)
async function autoTurn() {
  await sleep(400);
  for (const h of heroes()) { S.sel = S.units.indexOf(h); await enemyAct(h); if (S.phase === 'over') return; }
  endTurn();
}

async function endTurn() {
  if (S.phase !== 'player') return;
  S.pending = null; S.phase = 'enemy'; S.note = '';
  heroes().forEach(h => { h.vigor = 0; });
  endSideStatus(heroes());
  renderBattleUI();
  for (const e of enemies()) {
    tickStatus(e);
    if (checkEnd()) return;
    if (!e.alive) continue;
    e.vigor = VIGOR; drawCards(e, HAND_DRAW);
    await enemyAct(e);
    if (S.phase === 'over') return;
  }
  endSideStatus(enemies());
  await sleep(250);
  startPlayerTurn(false);
}

// Aplica uma carta jogada por u no alvo (x, y). Usado pelo jogador e pela IA.
function resolveCard(u, c, x, y) {
  const d = def(c), res = resonance(u, d) ? d.res : null;
  u.vigor -= d.cost; removeCard(u, c.uid, true);
  if (d.kind === 'move') {
    moveUnit(u, x, y); if (d.armor) u.armor += d.armor;
    log(`${u.name} usa ${d.name}.`);
  } else if (d.kind === 'attack') {
    const t = unitAt(x, y); face(u, x, y); playAnim(u, 'ataque');
    log(`${u.name} usa ${d.name} em ${t.name}.`);
    for (let i = 0; i < (d.hits || 1) && t.alive; i++) damage(t, d.dmg, { unit: u, melee: d.range === 1 });
    applyStatus(t, d.status);
    if (d.lifesteal) heal(u, d.lifesteal);
    if (res && res.status) applyStatus(t, res.status);
    if (res && res.pierce) {
      const bx = t.x + Math.sign(t.x - u.x), by = t.y + Math.sign(t.y - u.y), b = inBounds(bx, by) && unitAt(bx, by);
      if (b && b.side !== u.side) { log('Ressonância: a flecha atravessa.'); damage(b, d.dmg); }
    }
  } else if (d.kind === 'steal') {
    const t = unitAt(x, y); face(u, x, y); playAnim(u, 'ataque'); damage(t, d.dmg, { unit: u, melee: true });
    let taken = null;
    if (t.hand.length) taken = t.hand.splice(Math.floor(Math.random() * t.hand.length), 1)[0];
    else if (t.deck.length) taken = t.deck.pop();
    if (taken && u.hand.length < HAND_MAX) { u.hand.push({ uid: ++UID, id: taken.id, stolen: true }); log(`${u.name} rouba ${CARDS[taken.id].name} de ${t.name}.`); }
    else log(`${u.name} acerta ${t.name}, mas não consegue roubar nada.`);
  } else if (d.kind === 'area') {
    playAnim(u, 'ataque'); if (d.range) face(u, x, y);
    const hit = S.units.filter(v => v.alive && (d.ally ? v.side === u.side : v.side !== u.side) && Math.abs(v.x - x) + Math.abs(v.y - y) <= d.radius);
    log(`${u.name} usa ${d.name} e atinge ${hit.length} ${d.ally ? 'aliado' : 'alvo'}${hit.length === 1 ? '' : 's'}.`);
    hit.forEach(v => { if (d.dmg) damage(v, d.dmg); if (d.heal) heal(v, d.heal); applyStatus(v, d.status); });
  } else if (d.kind === 'heal') {
    const t = unitAt(x, y); heal(t, d.heal); if (d.armor) t.armor += d.armor;
    log(`${u.name} usa ${d.name} em ${t.name}.`);
  } else if (d.kind === 'self') {
    u.armor += d.armor || 0; if (d.heal) heal(u, d.heal); if (d.counter) u.counter = d.counter;
    if (res && res.allyArmor) S.units.filter(v => v.alive && v !== u && v.side === u.side && dist(u, v) === 1).forEach(v => { v.armor += res.allyArmor; });
    log(`${u.name} usa ${d.name}.`);
  } else if (d.kind === 'draw') {
    drawCards(u, d.draw); log(`${u.name} usa ${d.name} e compra ${d.draw}.`);
  } else if (d.kind === 'rage') {
    u.hp = Math.max(1, u.hp - d.hpCost); u.vigor += d.vigor; popup(u, '+' + d.vigor + ' Vigor', '#f2c14e');
    log(`${u.name} usa ${d.name}: perde ${d.hpCost} PV e ganha ${d.vigor} Vigor.`);
  }
}

async function enemyAct(e) {
  const pace = 480;
  let guarded = false;
  for (let step = 0; step < 8; step++) {
    if (!e.alive || S.phase === 'over') return;
    const hs = S.units.filter(v => v.alive && v.side !== e.side); if (!hs.length) return;
    // 1) atacar: cartas de dano que alcançam alguém, da mais forte
    const offensive = e.hand.filter(c => ['attack', 'area'].includes(def(c).kind)).sort((a, b) => def(b).dmg - def(a).dmg);
    let acted = false;
    for (const c of offensive) {
      const d = def(c);
      let tiles = targetsFor(e, d);
      if (!tiles.length) continue;
      if (!(await payFor(e, c, pace))) continue;
      // alvo: herói com menos PV (área: casa que acerta mais heróis)
      let tile;
      if (d.kind === 'attack') tile = tiles.map(t => unitAt(t.x, t.y)).sort((a, b) => a.hp - b.hp)[0];
      else tile = tiles.sort((a, b) => hs.filter(h => dist(h, b) <= d.radius).length - hs.filter(h => dist(h, a) <= d.radius).length)[0];
      resolveCard(e, c, tile.x, tile.y); renderBattleUI(); await sleep(pace);
      if (checkEnd()) return;
      acted = true; break;
    }
    if (acted) continue;
    // 2) defesa: uma carta de armadura quando há herói perto
    const guard = !guarded && e.hand.find(c => def(c).kind === 'self' && def(c).cost <= e.vigor);
    if (guard && hs.some(h => dist(h, e) <= 2)) {
      resolveCard(e, guard, e.x, e.y); guarded = true; renderBattleUI(); await sleep(pace); continue;
    }
    // 3) andar até ficar ao alcance do melhor ataque
    if (e.status.preso) break;
    const mv = e.hand.filter(c => def(c).kind === 'move' && def(c).cost <= e.vigor).sort((a, b) => def(b).move - def(a).move)[0];
    if (!mv) break;
    const ranges = e.hand.filter(c => def(c).kind === 'attack').map(c => def(c).range);
    const range = ranges.length ? Math.max(...ranges) : 1;
    const score = (x, y) => {
      const dm = Math.min(...hs.map(h => Math.abs(h.x - x) + Math.abs(h.y - y)));
      return Math.max(0, dm - range) * 10 + (range > 1 ? Math.abs(dm - range) : dm) * 0.1;
    };
    let best = null, bs = score(e.x, e.y);
    for (const t of reachable(e, def(mv).move)) { const s = score(t.x, t.y); if (s < bs - 1e-9) { bs = s; best = t; } }
    if (!best) break;
    resolveCard(e, mv, best.x, best.y); renderBattleUI(); await sleep(pace);
  }
  // Inimigos não guardam mão cheia: descartam o excesso para o baralho girar
  while (e.alive && e.hand.length > 4) removeCard(e, e.hand[0].uid, true);
}
// A IA descarta uma carta que não é de ataque para pagar o Vigor que falta
async function payFor(e, c, pace) {
  const d = def(c);
  while (e.vigor < d.cost) {
    const fuel = e.hand.find(k => k.uid !== c.uid && !['attack', 'area'].includes(def(k).kind) && def(k).discard > 0);
    if (!fuel) return false;
    removeCard(e, fuel.uid, true); e.vigor += def(fuel).discard;
    log(`${e.name} descarta ${def(fuel).name} (+${def(fuel).discard} Vigor).`);
    renderBattleUI(); await sleep(pace * 0.6);
  }
  return true;
}

function checkEnd() {
  if (S.phase === 'over') return true;
  if (!enemies().length) { S.phase = 'over'; renderBattleUI(); setTimeout(victory, 500); return true; }
  if (!heroes().length) { S.phase = 'over'; renderBattleUI(); setTimeout(defeat, 500); return true; }
  return false;
}

function victory() {
  const r = regionOf(S.region), node = NODES[S.node], got = { spheres: {}, items: {}, gold: 0 };
  const add = (o, k, n) => { o[k] = (o[k] || 0) + n; };
  for (const k of S.defeated) {
    const mo = MONSTERS[k];
    add(got.spheres, mo.color, mo.boss ? 4 : rnd(1, 2));
    if (Math.random() < 0.5) add(got.spheres, 'incolor', 1);
    if (mo.boss) add(got.spheres, 'especial', 1);
    if (mo.boss || Math.random() < 0.6) add(got.items, mo.item, 1);
    got.gold += mo.boss ? 60 : rnd(12, 20);
  }
  add(got.spheres, r.color, 1);   // a cor do campo
  G.gold += got.gold;
  for (const [k, n] of Object.entries(got.spheres)) add(G.spheres, k, n);
  for (const [k, n] of Object.entries(got.items)) add(G.items, k, n);
  renderHeader();
  let extra = '';
  if (node.type === 'boss' && !G.bosses[r.key]) {
    G.bosses[r.key] = true;
    const next = REGIONS[REGIONS.indexOf(r) + 1];
    extra = next ? `<p><b>A trilha para a região ${next.name} está aberta.</b></p>` : '<p><b>Você venceu o último chefe! O mundo está livre (por enquanto).</b></p>';
  }
  const list = [
    `<li>${got.gold} de ouro</li>`,
    ...Object.entries(got.spheres).map(([c, n]) => `<li>${sphereChip(c, n)}</li>`),
    ...Object.entries(got.items).map(([k, n]) => `<li>${ITEMS[k].name} ×${n}</li>`),
  ].join('');
  modal('Vitória', `<p>${MAPS[S.map].name} em ${S.turn} turnos. Recompensas:</p><ul class="rewards">${list}</ul>${extra}`, [{ label: 'Voltar ao mapa', fn: () => { S = null; show('map'); } }]);
}
function defeat() {
  modal('Game over', '<p>O grupo caiu. Você volta ao último save, gravado na última cidade em que entrou.</p>', [{ label: 'Voltar ao último save', fn: () => { G = loadGame() || newCampaign(); S = null; enterCity(); } }]);
}

/* ---------- Ações do jogador ---------- */
function onPlay(i) {
  if (S.phase !== 'player') return;
  const u = cur(), c = u.hand[i]; if (!c) return;
  const d = def(c);
  if (u.vigor < d.cost) { S.note = `Falta Vigor para ${d.name}. Descarte outra carta para ganhar Vigor.`; renderBattleUI(); return; }
  S.pending = null; S.note = '';
  if (['self', 'draw', 'rage'].includes(d.kind) || (d.kind === 'area' && d.range === 0)) { resolveCard(u, c, u.x, u.y); checkEnd(); renderBattleUI(); return; }
  if (d.kind === 'move' && u.status.preso) { S.note = `${u.name} está preso e não pode se mover neste turno.`; renderBattleUI(); return; }
  const tiles = targetsFor(u, d);
  if (!tiles.length) { S.note = `${d.name}: nenhum alvo ao alcance.`; renderBattleUI(); return; }
  S.pending = { uid: c.uid, mode: d.kind, radius: d.radius || 0, tiles, source: 'play' };
  renderBattleUI();
}
function onDiscard(i) {
  if (S.phase !== 'player') return;
  const u = cur(), c = u.hand[i]; if (!c) return;
  const d = def(c);
  if (!(d.discard > 0 || d.discardMove)) return;
  S.pending = null; S.note = '';
  removeCard(u, c.uid, true); u.vigor += d.discard;
  log(`${u.name} descarta ${d.name} (+${d.discard} Vigor).`);
  if (d.discardMove && !u.status.preso) { const tiles = reachable(u, d.discardMove); if (tiles.length) S.pending = { mode: 'move', tiles, source: 'discardMove' }; }
  renderBattleUI();
}
function onShare(i, toIdx) {
  if (S.phase !== 'player') return;
  const u = cur(), ally = S.units[toIdx];
  if (!ally || !ally.alive || ally.hand.length >= HAND_MAX) return;
  const [c] = u.hand.splice(i, 1); ally.hand.push(c);
  log(`${u.name} passa ${def(c).name} para ${ally.name}.`);
  S.pending = null; renderBattleUI();
}
function resolveAt(x, y) {
  const p = S.pending, u = cur();
  if (!p.tiles.some(t => t.x === x && t.y === y)) return;
  S.pending = null;
  if (p.source === 'discardMove') { moveUnit(u, x, y); log(`${u.name} se move 1 casa.`); renderBattleUI(); return; }
  const c = u.hand.find(k => k.uid === p.uid);
  resolveCard(u, c, x, y); checkEnd(); renderBattleUI();
}
function onTile(x, y) {
  if (S.phase !== 'player') return;
  if (S.pending) { resolveAt(x, y); return; }
  const u = unitAt(x, y);
  if (u && u.side === 'hero') { S.sel = S.units.indexOf(u); S.note = ''; renderBattleUI(); }
}
function cancelPending() { if (S && S.pending) { S.pending = null; renderBattleUI(); } }

/* ---------- Interface da batalha ---------- */
const kindLabel = d => ({ move: 'Movimento', attack: d.magic ? 'Ataque mágico' : 'Ataque básico', area: 'Feitiço', self: 'Feitiço', heal: 'Feitiço', draw: 'Utilitário', steal: 'Roubo', rage: 'Feitiço' })[d.kind];
const pips = (n, max) => Array.from({ length: Math.max(max, n) }, (_, i) => `<span class="pip${i < n ? ' on' : ''}"></span>`).join('');
const statusText = u => [u.armor ? `${u.armor} armadura` : '', ...Object.entries(u.status).map(([k, n]) => `${k} ${n}`)].filter(Boolean).join(', ');
const colorLabel = d => d.classe ? `exclusiva do ${CLASSES[d.classe].name}` : d.color2 ? `${COLOR_NAME[d.color]}/${COLOR_NAME[d.color2]}` : COLOR_NAME[d.color];

function renderBattleUI() {
  if (!S) return;
  const u = cur();
  $('turninfo').textContent = `${MAPS[S.map].name} · Turno ${S.turn}`;
  $('party').innerHTML = S.units.filter(v => v.side === 'hero').map(h => {
    const idx = S.units.indexOf(h);
    return `<button class="member${h.alive ? '' : ' dead'}" data-sel="${idx}" aria-pressed="${idx === S.sel}" ${h.alive ? '' : 'disabled'}>
      <span class="mname">${esc(h.name)} <small>${CLASSES[h.cls].name}</small></span><span class="pips" aria-label="${h.vigor} de Vigor">${pips(h.vigor, VIGOR)}</span>
      <span class="bar"><i style="width:${100 * h.hp / h.maxHp}%"></i></span>
      <span class="meta">${h.alive ? `${h.hp}/${h.maxHp} PV${statusText(h) ? ', ' + statusText(h) : ''}, ${h.hand.length} na mão` : 'Fora de combate'}</span>
    </button>`;
  }).join('');
  $('enemies').innerHTML = S.units.filter(v => v.side === 'enemy').map(e => `
    <div class="member enemyrow${e.alive ? '' : ' dead'}">
      <span class="mname">${esc(e.name)}</span><span></span>
      <span class="bar"><i style="width:${100 * e.hp / e.maxHp}%"></i></span>
      <span class="meta">${e.alive ? `${e.hp}/${e.maxHp} PV${statusText(e) ? ', ' + statusText(e) : ''}, ${e.hand.length} na mão` : 'Derrotado'}</span>
    </div>`).join('');
  $('log').innerHTML = S.log.map(l => `<li>${esc(l)}</li>`).join('');

  $('handtitle').textContent = `Mão de ${u.name}`;
  $('vigor').innerHTML = pips(u.vigor, VIGOR);
  $('counts').textContent = `${u.deck.length} no baralho, ${u.discard.length} no descarte`;
  const playerTurn = S.phase === 'player';
  const hand = $('hand');
  if (!u.alive) hand.innerHTML = '<p class="empty">Este personagem está fora de combate.</p>';
  else if (!u.hand.length) hand.innerHTML = '<p class="empty">Mão vazia. Encerre o turno para comprar mais cartas.</p>';
  else hand.innerHTML = u.hand.map((c, i) => {
    const d = def(c);
    const canPlay = playerTurn && u.vigor >= d.cost;
    const canDisc = playerTurn && (d.discard > 0 || d.discardMove);
    const discTxt = (d.discard > 0 || d.discardMove) ? `Descartar: ${d.discText || `+${d.discard} Vigor`}` : 'Sem efeito de descarte';
    const sel = S.pending && S.pending.uid === c.uid;
    const allies = c.stolen ? heroes().filter(h => h !== u) : [];
    const band = d.color2 ? `linear-gradient(90deg, ${COLOR_HEX[d.color]} 50%, ${COLOR_HEX[d.color2]} 50%)` : COLOR_HEX[d.color];
    return `<div class="card${sel ? ' sel' : ''}" style="--cc:${band}">
      <button class="cplay" data-play="${i}" aria-disabled="${!canPlay}">
        <span class="chead"><span class="cost" aria-label="Custo ${d.cost}">${d.cost}</span><span class="cname">${d.name}</span></span>
        <span class="ctype">${kindLabel(d)}, ${colorLabel(d)}</span>
        ${c.stolen ? '<span class="badge">Roubada</span>' : ''}
        <span class="ctext">${esc(d.text)}${d.resText ? `<br><i>${esc(d.resText)}</i>` : ''}</span>
      </button>
      ${allies.length && playerTurn ? `<div class="cshare">Passar para ${allies.map(a => `<button data-share="${i}" data-to="${S.units.indexOf(a)}">${esc(a.name)}</button>`).join('')}</div>` : ''}
      <button class="cdisc" data-disc="${i}" aria-disabled="${!canDisc}">${discTxt}</button>
    </div>`;
  }).join('');

  const st = $('status'), p = S.pending;
  if (S.phase === 'enemy') st.textContent = 'Os inimigos estão agindo…';
  else if (S.phase === 'over') st.textContent = 'Batalha encerrada.';
  else if (S.note) st.textContent = S.note;
  else if (p && p.source === 'discardMove') st.textContent = 'Movimento extra: escolha uma casa azul ou cancele.';
  else if (p && p.mode === 'move') st.textContent = 'Escolha uma casa azul para mover. Subir mais de 1 nível de uma vez não dá.';
  else if (p && (p.mode === 'attack' || p.mode === 'steal')) st.textContent = 'Escolha um inimigo marcado em vermelho.';
  else if (p && p.mode === 'heal') st.textContent = 'Escolha um aliado marcado em verde.';
  else if (p && p.mode === 'area') st.textContent = 'Escolha o centro do efeito.';
  else st.textContent = `Vez de ${u.name}. Jogue uma carta ou descarte para ganhar Vigor.`;
  $('cancel').hidden = !p;
  $('endturn').disabled = !playerTurn;
  renderHeader();
}

document.addEventListener('click', ev => {
  if (screen !== 'battle' || !S) return;
  const t = ev.target.closest('[data-play],[data-disc],[data-share],[data-sel]');
  if (!t) return;
  if (t.dataset.sel !== undefined) { if (S.phase === 'player') { S.sel = +t.dataset.sel; S.pending = null; S.note = ''; renderBattleUI(); } return; }
  if (t.dataset.share !== undefined) { onShare(+t.dataset.share, +t.dataset.to); return; }
  if (t.getAttribute('aria-disabled') === 'true') { if (t.dataset.play !== undefined && S.phase === 'player') onPlay(+t.dataset.play); return; }
  if (t.dataset.play !== undefined) onPlay(+t.dataset.play);
  else if (t.dataset.disc !== undefined) onDiscard(+t.dataset.disc);
});
$('endturn').addEventListener('click', endTurn);
$('cancel').addEventListener('click', cancelPending);
document.addEventListener('keydown', e => { if (e.key === 'Escape') cancelPending(); });

/* ================= Desenho ================= */
const cv = $('cv'), ctx = cv.getContext('2d');
const buf = document.createElement('canvas'); buf.width = BW; buf.height = BH;
const b = buf.getContext('2d');
const OX = BW / 2 - TW / 2, OY = 62;
// Canto superior esquerdo do tile da casa (x, y) na altura h
const tilePos = (x, y, h = 0) => [OX + (x - y) * TW / 2, OY + (x + y) * TH / 2 - h * LV];
const cellCenter = (x, y) => { const [px, py] = tilePos(x, y, heightAt(x, y)); return [px + TW / 2, py + TH / 2]; };

function diamond(px, py, color) {
  b.fillStyle = color;
  for (let r = 0; r < TH; r++) { const w = r < TH / 2 ? (r + 1) * 2 : (TH - r) * 2; b.fillRect(px + TW / 2 - w, py + r, w * 2, 1); }
}
// Bloco desenhado por código (sem tileset): topo e duas laterais
function codeBlock(px, py, h, top, left, right) {
  const depth = LV + h * LV;
  for (let c = 0; c < TW / 2; c++) {
    b.fillStyle = left; b.fillRect(px + c, py + TH / 2 + (c >> 1), 1, depth);
    b.fillStyle = right; b.fillRect(px + TW / 2 + c, py + TH - 1 - (c >> 1), 1, depth);
  }
  diamond(px, py, top);
}
const BIOME_CODE = {
  pantano: ['#4f7448', '#2c4a2d', '#3a5e37', '#2a5f78'], floresta: ['#5a8f45', '#33522a', '#416a33', '#3a7f8f'],
  deserto: ['#d9b46c', '#a07a3e', '#b98d4c', '#4f9fb0'], gelo: ['#cfe3ef', '#7f9db4', '#9bb8cc', '#4f7fb8'], fogo: ['#5a4038', '#2e1f1b', '#43302a', '#e2622a'],
};

function drawFloor(biome) {
  const tiles = SPR.tiles[biome];
  if (tiles) {
    // Grid dual: um tile em cada vértice, com os 4 cantos vindo das 4 casas em volta,
    // assim a borda chão/líquido cai exatamente na borda das casas
    const ground = (x, y) => (S.T[Math.max(0, Math.min(N - 1, y))][Math.max(0, Math.min(N - 1, x))] === 'liquid' ? 0 : 1);
    for (let s = 0; s <= 2 * N; s++) for (let vx = 0; vx <= N; vx++) {
      const vy = s - vx; if (vy < 0 || vy > N) continue;
      const m = (ground(vx - 1, vy - 1) << 3) | (ground(vx, vy - 1) << 2) | (ground(vx - 1, vy) << 1) | ground(vx, vy);
      const [px, py] = tilePos(vx - 0.5, vy - 0.5);
      b.drawImage(tiles[m], Math.round(px), Math.round(py));
    }
  } else {
    const [top, left, right, liq] = BIOME_CODE[biome];
    for (let s = 0; s <= 2 * (N - 1); s++) for (let x = 0; x < N; x++) {
      const y = s - x; if (y < 0 || y >= N) continue;
      const [px, py] = tilePos(x, y);
      codeBlock(px, py, 0, S.T[y][x] === 'liquid' ? liq : top, left, right);
    }
  }
}

const ROCK = { pal: { r: '#7d8580', R: '#a9b0aa', d: '#4c524f' }, px: ['...rrr....', '..rRRrr...', '.rRRrrrr..', 'rrrrrrrrd.', '.rrrrrddd.', '..dddddd..'] };
function pixelSprite(spr, ox, oy, scale = 2) {
  spr.px.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) { const ch = row[rx]; if (ch === '.') continue; b.fillStyle = spr.pal[ch]; b.fillRect(ox + rx * scale, oy + ry * scale, scale, scale); } });
}
function drawProp(biome, kind, cx, cy) {
  const img = SPR.props[biome] && SPR.props[biome][kind];
  if (img) {
    const foot = footOf(`cenario/${S.region}/${kind}.png`, img);
    b.drawImage(img, Math.round(cx - img.width / 2), Math.round(cy + 4 - foot));
    return;
  }
  if (kind === 'pedra') pixelSprite(ROCK, cx - 10, cy - 8);
  else if (kind === 'arvore') { b.fillStyle = '#4b3424'; b.fillRect(cx - 2, cy - 20, 4, 22); b.fillStyle = '#35602f'; b.beginPath(); b.arc(cx, cy - 26, 12, 0, Math.PI * 2); b.fill(); }
  else { b.fillStyle = '#9fd07a'; b.fillRect(cx - 4, cy - 4, 2, 4); b.fillRect(cx + 2, cy - 6, 2, 6); }
}

// Personagem: SE/NE desenhados, SW/NW espelhados (como no FFT); animação parado/ataque
function drawUnit(u, cx, cy, now) {
  const art = SPR.chars[u.key];
  const back = u.face === 'ne' || u.face === 'nw', flip = u.face === 'sw' || u.face === 'nw';
  const dir = back ? 'ne' : 'se';
  b.fillStyle = 'rgba(0,0,0,0.35)'; b.beginPath(); b.ellipse(cx, cy + 2, 9, 3.5, 0, 0, Math.PI * 2); b.fill();
  if (art) {
    let img = art[dir], frame = 0, frames = 1, sheet = null;
    if (u.anim && art[`${u.anim.name}-${dir}`]) {
      sheet = art[`${u.anim.name}-${dir}`]; frames = Math.max(1, Math.round(sheet.width / sheet.height));
      frame = Math.floor((now - u.anim.t) / 90);
      if (frame >= frames) { u.anim = null; sheet = null; frame = 0; frames = 1; }
    }
    if (!sheet && art[`parado-${dir}`] && !reduceMotion) {
      sheet = art[`parado-${dir}`]; frames = Math.max(1, Math.round(sheet.width / sheet.height));
      frame = Math.floor(now / 160) % frames;
    }
    const src = sheet || img, fw = sheet ? sheet.height : img.width, fh = sheet ? sheet.height : img.height;
    const foot = footOf(`personagens/${u.key}/${dir}.png`, img) + (fh - img.height) / 2;
    const dx = Math.round(cx - fw / 2), dy = Math.round(cy + 2 - foot);
    b.save();
    if (flip) { b.translate(dx * 2 + fw, 0); b.scale(-1, 1); }
    const hurt = u.hurt && now - u.hurt < 180;
    if (hurt) b.filter = 'brightness(2.2)';
    b.drawImage(src, frame * fw, 0, fw, fh, dx, dy, fw, fh);
    b.restore();
    return dy + (META[`personagens/${u.key}/${dir}.png`] ? META[`personagens/${u.key}/${dir}.png`][1] : 8);
  }
  // Sem arte: boneco simples na cor da classe/monstro
  const col = u.side === 'hero' ? COLOR_HEX[CLASSES[u.cls].color] : COLOR_HEX[MONSTERS[u.key].color];
  const big = u.side === 'enemy' && MONSTERS[u.key].boss ? 1.5 : 1;
  b.fillStyle = '#1b1b1b'; b.fillRect(cx - 6 * big, cy - 22 * big, 12 * big, 22 * big);
  b.fillStyle = col; b.fillRect(cx - 5 * big, cy - 14 * big, 10 * big, 13 * big);
  b.fillStyle = u.side === 'hero' ? '#e2b48c' : '#7fae4a'; b.fillRect(cx - 4 * big, cy - 21 * big, 8 * big, 7 * big);
  return cy - 24 * big;
}

function renderBattle(now) {
  const r = regionOf(S.region);
  b.fillStyle = r.sky; b.fillRect(0, 0, BW, BH);
  drawFloor(S.region);

  // Destaques no chão (na altura de cada casa)
  const p = S.pending;
  const mark = (x, y, color) => { const [px, py] = tilePos(x, y, heightAt(x, y)); diamond(px, py, color); };
  if (p) {
    const col = { move: 'rgba(110,190,255,0.45)', area: 'rgba(242,193,78,0.42)', heal: 'rgba(110,220,130,0.45)' }[p.mode] || 'rgba(239,90,70,0.5)';
    p.tiles.forEach(t => mark(t.x, t.y, col));
    const h = S.hover;
    if (p.mode === 'area' && h && p.tiles.some(t => t.x === h.x && t.y === h.y))
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.abs(x - h.x) + Math.abs(y - h.y) <= p.radius) mark(x, y, 'rgba(255,140,40,0.5)');
  }
  if (S.hover) mark(S.hover.x, S.hover.y, 'rgba(255,255,255,0.18)');

  // Blocos elevados, cenário e unidades em ordem de profundidade
  const objs = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (S.H[y][x] > 0) objs.push({ x, y, z: 0, block: S.H[y][x] });
    if (['pedra', 'arvore', 'deco'].includes(S.T[y][x])) objs.push({ x, y, z: 1, prop: S.T[y][x] });
  }
  S.units.filter(u => u.alive).forEach(u => objs.push({ x: u.x, y: u.y, z: 2, u }));
  objs.sort((a, c) => (a.x + a.y) - (c.x + c.y) || a.z - c.z);
  const tops = [];
  for (const o of objs) {
    const h = heightAt(o.x, o.y);
    if (o.block) {
      const [px, py] = tilePos(o.x, o.y, o.block);
      if (SPR.tiles[S.region]) b.drawImage(tallBlock(S.region, o.block), Math.round(px), Math.round(py));
      else { const [top, left, right] = BIOME_CODE[S.region]; codeBlock(px, py, o.block, top, left, right); }
      // destaques de casas elevadas são redesenhados por cima do bloco
      if (p && p.tiles.some(t => t.x === o.x && t.y === o.y)) diamond(px, py, { move: 'rgba(110,190,255,0.45)', area: 'rgba(242,193,78,0.42)', heal: 'rgba(110,220,130,0.45)' }[p.mode] || 'rgba(239,90,70,0.5)');
      if (S.hover && S.hover.x === o.x && S.hover.y === o.y) diamond(px, py, 'rgba(255,255,255,0.18)');
      continue;
    }
    let [cx, cy] = cellCenter(o.x, o.y);
    if (o.prop) { drawProp(S.region, o.prop, cx, cy); continue; }
    const u = o.u;
    if (u.slide && !reduceMotion) {
      const k = (now - u.slide.t) / SLIDE_MS;
      if (k < 1) { cx = u.slide.from[0] + (cx - u.slide.from[0]) * k; cy = u.slide.from[1] + (cy - u.slide.from[1]) * k - Math.sin(k * Math.PI) * 4; }
      else u.slide = null;
    }
    const top = drawUnit(u, cx, cy, now);
    tops.push({ u, cx, top });
  }
  // Barras de vida e marcador do selecionado
  for (const { u, cx, top } of tops) {
    const y = top - 5;
    b.fillStyle = '#111'; b.fillRect(cx - 9, y, 18, 3);
    b.fillStyle = u.side === 'hero' ? '#5fbf86' : '#ef6b57'; b.fillRect(cx - 9, y, Math.max(1, Math.round(18 * u.hp / u.maxHp)), 3);
    if (u.armor) { b.fillStyle = '#7aa7ff'; b.fillRect(cx - 9, y + 3, Math.min(18, u.armor * 2), 1); }
    if (u.status.preso) { b.fillStyle = '#8bd36b'; b.fillRect(cx + 10, y, 3, 3); }
    if (u.status.veneno) { b.fillStyle = '#b36bd3'; b.fillRect(cx + 10, y + 3, 3, 3); }
    if (u.status.queimadura) { b.fillStyle = '#f08a3c'; b.fillRect(cx - 13, y, 3, 3); }
    if (u.side === 'hero' && S.units.indexOf(u) === S.sel && S.phase === 'player') {
      const bob = reduceMotion ? 0 : Math.round(Math.sin(now / 200));
      b.fillStyle = '#f2c14e';
      b.fillRect(cx - 3, y - 8 + bob, 7, 1); b.fillRect(cx - 2, y - 7 + bob, 5, 1); b.fillRect(cx - 1, y - 6 + bob, 3, 1);
    }
  }
  blit();
  // Números flutuantes, em alta resolução
  S.popups = S.popups.filter(pp => now - pp.t < 1000);
  ctx.font = '600 20px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
  for (const pp of S.popups) {
    const k = (now - pp.t) / 1000;
    const [px, py] = tilePos(pp.x, pp.y, pp.h);
    const x = (px + TW / 2) * SCALE, y = (py - 26 - (reduceMotion ? 0 : k * 12)) * SCALE;
    ctx.globalAlpha = 1 - k * 0.6;
    ctx.fillStyle = '#000'; ctx.fillText(pp.text, x + 2, y + 2);
    ctx.fillStyle = pp.color; ctx.fillText(pp.text, x, y);
    ctx.globalAlpha = 1;
  }
}

function blit() { ctx.imageSmoothingEnabled = false; ctx.drawImage(buf, 0, 0, BW * SCALE, BH * SCALE); }

/* ---------- Desenho do mapa do mundo ---------- */
let mapHover = null;
function renderWorld(now) {
  const W = SPR.world || {};
  if (W.fundo) b.drawImage(W.fundo, 0, 0, BW, BH);
  else {
    b.fillStyle = '#16232a'; b.fillRect(0, 0, BW, BH);
    b.fillStyle = '#1d3039';   // mar com ondas
    for (let i = 0; i < 40; i++) b.fillRect((i * 53 + (reduceMotion ? 0 : now / 120)) % BW | 0, (i * 37) % BH, 6, 1);
    REGIONS.forEach(r => {   // uma ilha por região, na cor do bioma
      const ids = ['city', 'f0', 'f1', 'boss'].map(t => NODES[`${r.key}-${t}`]);
      b.fillStyle = '#0c1418';
      ids.forEach(n => { b.beginPath(); b.arc(n.x + 2, n.y + 4, 25, 0, Math.PI * 2); b.fill(); });
      b.fillStyle = BIOME_CODE[r.key][0];
      ids.forEach(n => { b.beginPath(); b.arc(n.x, n.y, 23, 0, Math.PI * 2); b.fill(); });
    });
  }
  // trilhas
  for (const [a, c] of EDGES) {
    const A = NODES[a], C = NODES[c], open = G.visited[a] || G.visited[c];
    const len = Math.hypot(C.x - A.x, C.y - A.y), steps = Math.floor(len / 5);
    b.fillStyle = open ? '#f1e2b8' : '#6b6a5e';
    for (let i = 1; i < steps; i++) { const t = i / steps; b.fillRect(Math.round(A.x + (C.x - A.x) * t), Math.round(A.y + (C.y - A.y) * t), 2, 2); }
  }
  // nós
  const nb = neighbors(G.node);
  for (const [id, n] of Object.entries(NODES)) {
    const col = COLOR_HEX[regionOf(n.region).color];
    const can = nb.includes(id), here = id === G.node, seen = G.visited[id];
    if (can) { b.fillStyle = mapHover === id ? '#fff3b0' : 'rgba(255,243,176,0.55)'; b.beginPath(); b.arc(n.x, n.y, 10 + (reduceMotion ? 0 : Math.sin(now / 250)), 0, Math.PI * 2); b.fill(); }
    const icon = W[n.type];
    if (icon) {
      b.globalAlpha = seen || can ? 1 : 0.6;
      b.drawImage(icon, Math.round(n.x - icon.width / 2), Math.round(n.y - icon.height + 8));
      b.globalAlpha = 1;
      if (n.type === 'boss' && G.bosses[n.region]) { b.fillStyle = '#5fbf86'; b.fillRect(n.x + 8, n.y - 14, 4, 4); }
      if (here) { const lead = heroById(G.party[0]) || G.heroes[0]; drawUnit({ key: lead.cls, cls: lead.cls, side: 'hero', face: 'se', status: {}, anim: null }, n.x + 10, n.y + 8, now); }
      continue;
    }
    b.fillStyle = '#10181b'; b.beginPath(); b.arc(n.x, n.y, 8, 0, Math.PI * 2); b.fill();
    b.fillStyle = seen ? col : '#59605f'; b.beginPath(); b.arc(n.x, n.y, 6, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#10181b';
    if (n.type === 'city') { b.fillRect(n.x - 3, n.y - 1, 6, 4); b.fillRect(n.x - 2, n.y - 3, 4, 2); }
    if (n.type === 'field') { b.fillRect(n.x - 3, n.y - 3, 1, 6); b.fillRect(n.x + 2, n.y - 3, 1, 6); b.fillRect(n.x - 3, n.y, 6, 1); }
    if (n.type === 'boss') { b.fillRect(n.x - 3, n.y - 3, 6, 4); b.fillStyle = seen ? col : '#59605f'; b.fillRect(n.x - 2, n.y - 2, 1, 1); b.fillRect(n.x + 1, n.y - 2, 1, 1); b.fillStyle = '#10181b'; b.fillRect(n.x - 2, n.y + 1, 4, 2); if (G.bosses[n.region]) { b.fillStyle = '#5fbf86'; b.fillRect(n.x + 5, n.y - 7, 3, 3); } }
    if (here) {
      const lead = heroById(G.party[0]) || G.heroes[0];
      const fake = { key: lead.cls, cls: lead.cls, side: 'hero', face: 'se', status: {}, anim: null };
      drawUnit(fake, n.x, n.y - 6, now);
    }
  }
  blit();
  // rótulos nítidos
  ctx.font = '600 15px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
  REGIONS.forEach(r => {
    const c = NODES[`${r.key}-city`], x = (c.x + 29) * SCALE, y = 22 * SCALE;
    ctx.fillStyle = '#000c'; ctx.fillText(r.name, x + 2, y + 2);
    ctx.fillStyle = '#f5ecd2'; ctx.fillText(r.name, x, y);
  });
  if (mapHover) {
    const n = NODES[mapHover];
    ctx.font = '600 14px "Atkinson Hyperlegible", sans-serif';
    const label = n.name, w = ctx.measureText(label).width + 14, ly = (n.y - (W.city ? 44 : 26)) * SCALE;
    ctx.fillStyle = '#10181be6'; ctx.fillRect(n.x * SCALE - w / 2, ly - 16, w, 22);
    ctx.fillStyle = '#f5ecd2'; ctx.fillText(label, n.x * SCALE, ly);
  }
}

function frame(now) {
  if (screen === 'battle' && S) renderBattle(now);
  else if (screen === 'map') renderWorld(now);
  requestAnimationFrame(frame);
}

function toBuf(ev) {
  const r = cv.getBoundingClientRect();
  return [(ev.clientX - r.left) * BW / r.width, (ev.clientY - r.top) * BH / r.height];
}
// Casa sob o ponteiro: testa do bloco mais alto e mais à frente para trás
function pickTile(ev) {
  const [bx, by] = toBuf(ev);
  const front = S.units.filter(u => u.alive).sort((a, c) => (c.x + c.y) - (a.x + a.y));
  for (const u of front) { const [cx, cy] = cellCenter(u.x, u.y); if (bx >= cx - 9 && bx <= cx + 9 && by >= cy - 26 && by <= cy + 4) return { x: u.x, y: u.y }; }
  for (let h = 2; h >= 0; h--) {
    const a = (bx - OX - TW / 2) / (TW / 2), c = (by - OY + h * LV) / (TH / 2);
    const gx = Math.floor((a + c) / 2), gy = Math.floor((c - a) / 2);
    if (inBounds(gx, gy) && heightAt(gx, gy) === h) return { x: gx, y: gy };
  }
  return null;
}
function pickNode(ev) {
  const [bx, by] = toBuf(ev);
  const icons = SPR.world && SPR.world.city, lift = icons ? 14 : 0;   // com ícone, o alvo é o centro do desenho
  let best = null, bd = icons ? 20 : 14;
  for (const [id, n] of Object.entries(NODES)) { const d = Math.hypot(n.x - bx, n.y - lift - by); if (d < bd) { bd = d; best = id; } }
  return best;
}
cv.addEventListener('pointermove', ev => {
  if (screen === 'battle' && S) S.hover = pickTile(ev);
  if (screen === 'map') { mapHover = pickNode(ev); cv.style.cursor = mapHover && neighbors(G.node).includes(mapHover) ? 'pointer' : 'default'; }
});
cv.addEventListener('pointerleave', () => { if (S) S.hover = null; mapHover = null; });
cv.addEventListener('click', ev => {
  if (screen === 'battle' && S) { const t = pickTile(ev); if (t) onTile(t.x, t.y); }
  else if (screen === 'map') { const id = pickNode(ev); if (id && neighbors(G.node).includes(id)) travel(id); else if (id) toast('Esse nó não está ligado por trilha ao lugar onde o grupo está.'); }
});

$('newgame').addEventListener('click', () => modal('Novo jogo', '<p>Apagar o save e recomeçar do Pântano com 3 Escudeiros?</p>', [
  { label: 'Recomeçar', fn: () => { G = newCampaign(); saveGame(); enterCity(); } }, { label: 'Cancelar', fn: () => {} }]));

/* ================= Início ================= */
(async function boot() {
  await loadArt();
  if (DEV.has('reset')) try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* sem storage */ }
  G = loadGame() || newCampaign();
  if (DEV.has('rich')) { G.gold += 2000; [...COLORS, 'incolor', 'especial'].forEach(c => { G.spheres[c] = (G.spheres[c] || 0) + 30; }); Object.keys(ITEMS).forEach(k => { G.items[k] = (G.items[k] || 0) + 3; }); }
  if (DEV.has('open')) { REGIONS.forEach(r => { G.bosses[r.key] = true; ['city', 'f0', 'f1', 'boss'].forEach(t => { G.visited[`${r.key}-${t}`] = true; }); }); }
  const go = [...DEV].find(k => MAPS[k]);
  requestAnimationFrame(frame);
  if (go) { const node = Object.keys(NODES).find(id => NODES[id].map === go) || 'pantano-f0'; G.node = node; startBattle(go, node); return; }
  if (DEV.has('mapa')) { show('map'); return; }
  if (NODES[G.node].type === 'city') enterCity(); else show('map');
})();
