// Executa a lógica real do jogo. Apenas DOM, imagens e desenho são simulados.
// Rode com: node prototipos/caca-as-bruxas/smoke-test.cjs
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function boot(storage = new Map()) {
  const elements = new Map();
  const controls = [];
  const globalListeners = new Map();
  const clock = { now: 0 };
  const drawing = new Proxy({}, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'measureText') return text => ({ width: String(text).length * 6 });
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (key === 'createPattern') return () => ({});
      if (key === 'getImageData') return () => ({ data: new Uint8ClampedArray([29, 38, 40, 255]) });
      return () => {};
    },
    set(target, key, value) { target[key] = value; return true; }
  });

  function makeElement(tag = 'div', id = '') {
    const listeners = new Map();
    const classes = new Set();
    const children = [];
    const node = {
      id, tagName: tag.toUpperCase(), style: {}, dataset: {}, width: 960, height: 540,
      textContent: '', innerHTML: '', value: 100, max: 100, disabled: false, hidden: false,
      children, childNodes: children,
      classList: {
        add(...names) { names.forEach(name => classes.add(name)); },
        remove(...names) { names.forEach(name => classes.delete(name)); },
        contains(name) { return classes.has(name); },
        toggle(name, force) { const active = force === undefined ? !classes.has(name) : Boolean(force); active ? classes.add(name) : classes.delete(name); return active; }
      },
      addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(callback); },
      removeEventListener(type, callback) { listeners.set(type, (listeners.get(type) || []).filter(item => item !== callback)); },
      dispatchEvent(event) { for (const callback of listeners.get(event.type) || []) callback(event); return true; },
      click() { if (!node.disabled) node.dispatchEvent({ type: 'click', target: node, preventDefault() {} }); },
      appendChild(child) { children.push(child); return child; },
      append(...items) { children.push(...items); },
      replaceChildren(...items) { children.splice(0, children.length, ...items); },
      setAttribute(name, value) { node[name] = String(value); },
      removeAttribute(name) { delete node[name]; },
      getAttribute(name) { return node[name]; },
      getContext() { return drawing; },
      getBoundingClientRect() { return { x: 0, y: 0, left: 0, top: 0, right: 960, bottom: 540, width: 960, height: 540 }; },
      querySelector(selector) { return children.find(child => selector === '.spell-name' && child.classList.contains('spell-name')) || null; },
      querySelectorAll() { return []; },
      focus() {}, blur() {}, setPointerCapture() {}, releasePointerCapture() {}
    };
    return node;
  }

  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const match of html.matchAll(/<([a-z][a-z\d-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) {
    const node = makeElement(match[1], match[3]);
    for (const className of (match[2].match(/\bclass="([^"]+)"/)?.[1] || '').split(/\s+/).filter(Boolean)) node.classList.add(className);
    elements.set(match[3], node);
  }
  for (const match of html.matchAll(/<button\b([^>]*\bdata-control="([^"]+)"[^>]*)>/gi)) {
    const id = match[1].match(/\bid="([^"]+)"/)?.[1];
    const node = id ? elements.get(id) : makeElement('button');
    node.dataset.control = match[2];
    const spell = match[1].match(/\bdata-spell="([^"]+)"/)?.[1];
    if (spell) node.dataset.spell = spell;
    const name = makeElement('span');
    name.classList.add('spell-name');
    node.appendChild(name);
    controls.push(node);
  }

  class FakeImage {
    constructor() { this.width = this.naturalWidth = 64; this.height = this.naturalHeight = 64; this.complete = true; }
    set src(value) { this._src = value; queueMicrotask(() => this.onload?.()); }
    get src() { return this._src; }
    addEventListener(type, callback) { if (type === 'load') queueMicrotask(callback); }
  }

  const document = {
    body: makeElement('body'), documentElement: makeElement('html'),
    getElementById(id) { return elements.get(id) || null; },
    createElement: makeElement,
    querySelector(selector) { return selector.startsWith('#') ? elements.get(selector.slice(1)) || null : null; },
    querySelectorAll(selector) { return selector.includes('data-control') ? controls : selector.includes('data-spell') ? controls.filter(node => node.dataset.spell) : []; },
    addEventListener(type, callback) { if (!globalListeners.has(type)) globalListeners.set(type, []); globalListeners.get(type).push(callback); }
  };
  const sandbox = {
    console, document, Image: FakeImage, Math, JSON, Date, Promise,
    innerWidth: 960, innerHeight: 540, devicePixelRatio: 1,
    performance: { now: () => clock.now },
    navigator: { userAgent: 'Node smoke test', maxTouchPoints: 0 },
    location: { href: 'http://localhost/prototipos/caca-as-bruxas/#debug', hash: '#debug' },
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    addEventListener(type, callback) { if (!globalListeners.has(type)) globalListeners.set(type, []); globalListeners.get(type).push(callback); },
    removeEventListener() {}, requestAnimationFrame() { return 1; }, cancelAnimationFrame() {},
    setTimeout() { return 1; }, clearTimeout() {}, matchMedia: () => ({ matches: false, addEventListener() {} })
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8'), sandbox, { filename: 'game.js' });
  function key(type, code, keyName = code) {
    const event = { type, code, key: keyName, repeat: false, preventDefault() {} };
    for (const handler of globalListeners.get(type) || []) handler(event);
  }
  return { sandbox, game: sandbox.WitchGame, storage, elements, clock, key };
}

function advance(env, seconds) {
  const steps = Math.ceil(seconds / 0.05);
  for (let i = 0; i < steps; i++) {
    env.clock.now += seconds / steps * 1000;
    env.game.tick(seconds / steps);
  }
}

function startNew() {
  const env = boot();
  assert.ok(env.game?.debug, 'A API debug é necessária para montar os cenários de combate.');
  env.elements.get('play-btn').click();
  assert.equal(env.game.getState().paused, true, 'A introdução pausa o mundo.');
  assert.equal(env.elements.get('dialog').hidden, false, 'A introdução abre o diálogo.');
  assert.equal(env.elements.get('dialog').classList.contains('hidden'), false, 'Uma classe residual não pode ocultar o diálogo.');
  const before = env.game.getState().clock;
  advance(env, 1);
  assert.equal(env.game.getState().clock, before, 'Inimigos e recursos aguardam enquanto há diálogo.');
  env.elements.get('dialog-actions').children[0].click();
  assert.equal(env.game.getState().paused, false);
  return env;
}

function learn(env, index) {
  const chest = env.game.getState().landmarks.chests.find(item => item.spell === index);
  assert.ok(chest, `Existe um baú da magia ${index}.`);
  env.game.debug.teleport(chest.x, chest.y);
  assert.equal(env.game.getState().interaction, 'chest');
  assert.equal(env.game.interact(), true);
  assert.equal(env.game.getState().spells[index].learned, true);
  env.game.closeDialog();
}

const results = [];
function test(name, run) {
  try { run(); results.push(name); console.log(`OK: ${name}`); }
  catch (error) { console.error(`FALHA: ${name}`); throw error; }
}

test('teclado real, projétil, recursos, aprendizado e regeneração de MP', () => {
  const env = startNew();
  const { game } = env;
  const beforeMove = game.getState().player.x;
  env.key('keydown', 'KeyD', 'd');
  advance(env, 0.2);
  env.key('keyup', 'KeyD', 'd');
  assert.ok(game.getState().player.x > beforeMove + 20, 'O comando do teclado chega à simulação.');
  const stoppedAt = game.getState().player.x;
  advance(env, 0.1);
  assert.equal(game.getState().player.x, stoppedAt, 'Soltar a tecla interrompe o movimento.');

  game.debug.teleport(385, 828);
  game.debug.aim(435, 828);
  const beforeAttack = game.getState();
  assert.equal(game.cast('quick'), true);
  const afterAttack = game.getState();
  assert.ok(afterAttack.player.stamina < beforeAttack.player.stamina);
  assert.equal(afterAttack.player.mp, beforeAttack.player.mp, 'Ataque básico usa fôlego, preservando MP.');
  assert.equal(game.cast('quick'), false, 'Ataque repetido respeita o intervalo entre golpes.');
  assert.equal(game.getState().player.stamina, afterAttack.player.stamina, 'Um comando recusado não consome recursos.');
  advance(env, 0.05);
  assert.ok(game.getState().enemies.find(enemy => enemy.id === 'shade-1').hp < beforeAttack.enemies.find(enemy => enemy.id === 'shade-1').hp, 'O projétil atinge e causa dano usando a colisão real.');

  assert.equal(game.cast(0), false, 'Uma memória ainda não aprendida não pode ser usada.');
  const suspicionBefore = game.getState().progress.suspicion;
  learn(env, 0);
  assert.ok(game.getState().progress.suspicion > suspicionBefore, 'Aprender poder aumenta o risco no mundo.');
  game.debug.teleport(259, 952);
  game.debug.aim(259, 1070);
  game.debug.setResources({ mp: 100 });
  assert.equal(game.cast(0), true);
  const spent = game.getState().player.mp;
  assert.ok(spent < 100);
  advance(env, 0.6);
  assert.equal(game.getState().player.mp, spent, 'MP não regenera imediatamente após lançar magia.');
  advance(env, 1.8);
  assert.ok(game.getState().player.mp > spent, 'MP volta depois de uma pausa sem gasto.');
  game.debug.setResources({ mp: 0 });
  assert.equal(game.cast(0), false, 'Sem MP, a magia falha sem gerar projétil adicional.');
});

test('parry, bloqueio tardio, ataque inaparável, escudo rompido e esquiva', () => {
  const env = startNew();
  const { game } = env;
  game.debug.setResources({ hp: 100, mp: 50 });
  game.shield(true);
  game.debug.enemyAttack('shade-1');
  assert.equal(game.getState().player.hp, 100);
  assert.ok(game.getState().player.mp >= 50, 'Parry preciso não custa MP.');
  assert.ok(game.getState().enemies.find(enemy => enemy.id === 'shade-1').stun > 0, 'Parry abre uma janela de postura quebrada.');
  game.shield(false);
  advance(env, 0.4);

  game.debug.setResources({ hp: 100, mp: 60 });
  game.shield(true);
  advance(env, 0.35);
  const beforeBlock = game.getState().player.mp;
  game.debug.enemyAttack('shade-2');
  assert.equal(game.getState().player.hp, 100, 'Bloqueio tardio protege vida.');
  assert.ok(game.getState().player.mp < beforeBlock - 10, 'Bloqueio gasta o mesmo recurso das magias.');
  game.shield(false);
  advance(env, 0.3);

  game.debug.setResources({ hp: 100, mp: 60 });
  game.shield(true);
  game.debug.enemyAttack('demon', true);
  assert.ok(game.getState().player.hp < 100, 'O sinal de ataque inaparável exige esquiva, mesmo na janela de parry.');
  game.shield(false);
  advance(env, 0.6);

  game.debug.setResources({ hp: 100, mp: 8 });
  game.shield(true);
  advance(env, 0.35);
  game.debug.enemyAttack('shade-2');
  assert.equal(game.getState().player.mp, 0);
  assert.ok(game.getState().player.hp < 100);
  assert.ok(game.getState().player.stun > 0, 'Escudo sem energia se rompe e deixa a bruxa vulnerável.');
  advance(env, 0.8);

  game.debug.setResources({ hp: 100, stamina: 100 });
  assert.equal(game.dodge(), true);
  assert.ok(game.getState().player.stamina < 100);
  game.debug.enemyAttack('demon', true);
  assert.equal(game.getState().player.hp, 100, 'A invulnerabilidade da esquiva evita até ataques inaparaveis.');
});

test('fogueira, morte, cinzas recuperáveis e persistência após recarregar', () => {
  const env = startNew();
  const { game } = env;
  learn(env, 0);
  game.debug.teleport(828, 526);
  game.debug.setResources({ hp: 20, mp: 10, stamina: 5 });
  assert.equal(game.interact(), true);
  assert.equal(game.getState().checkpoint, 'elisa');
  assert.deepEqual(Object.fromEntries(['hp', 'mp', 'stamina'].map(key => [key, game.getState().player[key]])), { hp: 100, mp: 100, stamina: 100 });
  game.closeDialog();
  game.debug.hit('shade-1', 1000);
  const ashes = game.getState().progress.ashes;
  assert.ok(ashes > 0);
  game.debug.teleport(460, 930);
  game.debug.hurt(1000, true);
  const dead = game.getState();
  assert.equal(dead.dead, true);
  assert.equal(dead.progress.ashes, 0);
  assert.equal(dead.progress.lostAshes.amount, ashes);
  assert.equal(dead.progress.deaths, 1);

  // Recarregar o arquivo inteiro valida save/load, sem reutilizar estado em memória.
  const resumed = boot(env.storage);
  assert.equal(resumed.elements.get('continue-btn').hidden, false);
  assert.equal(resumed.elements.get('continue-btn').classList.contains('hidden'), false);
  resumed.elements.get('continue-btn').click();
  const afterLoad = resumed.game.getState();
  assert.equal(afterLoad.dead, false);
  assert.equal(afterLoad.checkpoint, 'elisa');
  assert.equal(afterLoad.spells[0].learned, true);
  assert.equal(afterLoad.progress.lostAshes.amount, ashes);
  assert.ok(Math.hypot(afterLoad.player.x - 828, afterLoad.player.y - 526) < 80, 'A bruxa reaparece na última fogueira.');
  assert.equal(afterLoad.player.hp, 100);
  resumed.game.debug.teleport(dead.progress.lostAshes.x, dead.progress.lostAshes.y);
  assert.equal(resumed.game.getState().interaction, 'ashes');
  assert.equal(resumed.game.interact(), true);
  assert.equal(resumed.game.getState().progress.ashes, ashes);
  assert.equal(resumed.game.getState().progress.lostAshes, null);
  assert.equal(resumed.game.interact(), false, 'As mesmas cinzas não podem ser recolhidas duas vezes.');
});

test('demônio, virada da vila, portão físico, caçadores e conclusão persistente', () => {
  const env = startNew();
  const { game } = env;
  // Teleportar simula um desvio geométrico ou um save antigo além do portão.
  // A progressão precisa se proteger também dentro da área bloqueada.
  const sealed = game.getState();
  const inquisitorHp = sealed.enemies.find(enemy => enemy.id === 'inquisitor').hp;
  game.debug.hit('inquisitor', 1000);
  assert.equal(game.getState().enemies.find(enemy => enemy.id === 'inquisitor').hp, inquisitorHp, 'Inquisidor não recebe dano antes da Suspeita 70.');
  assert.equal(game.getState().progress.victory, false, 'Entrar por um desvio não antecipa a vitória.');
  assert.equal(game.getState().progress.ashes, sealed.progress.ashes);
  const moonChest = sealed.landmarks.chests.find(chest => chest.spell === 3);
  game.debug.teleport(moonChest.x, moonChest.y);
  game.interact();
  assert.equal(game.getState().spells[3].learned, false, 'A memória Lua morta permanece selada antes da Suspeita 70.');
  assert.equal(game.getState().progress.suspicion, sealed.progress.suspicion, 'Examinar memória selada não eleva Suspeita.');
  game.closeDialog();

  game.debug.teleport(1180, 390);
  game.setControl('right', true);
  advance(env, 0.65);
  game.setControl('right', false);
  assert.ok(game.getState().player.x < 1205, 'O portão impede passagem antes da Suspeita necessária.');

  game.debug.hit('demon', 1000);
  const betrayed = game.getState();
  assert.equal(betrayed.progress.demonDefeated, true);
  assert.ok(betrayed.progress.suspicion >= 60);
  assert.ok(betrayed.enemies.some(enemy => enemy.type === 'guard' && enemy.alive));
  assert.equal(betrayed.enemies.some(enemy => enemy.type === 'shade' && enemy.alive), false);
  assert.equal(betrayed.gateOpen, false, 'Derrotar o demônio ainda exige buscar novas memórias.');
  assert.equal(betrayed.paused, true, 'A acusação aparece dentro do mundo como diálogo.');
  game.closeDialog();

  learn(env, 1);
  const hunted = game.getState();
  assert.equal(hunted.gateOpen, true);
  assert.ok(hunted.enemies.some(enemy => enemy.type === 'hunter' && enemy.alive), 'Aprender a cura muda o tipo de perseguidor.');
  game.debug.teleport(1180, 390);
  game.setControl('right', true);
  advance(env, 0.55);
  game.setControl('right', false);
  assert.ok(game.getState().player.x > 1240, 'A Suspeita remove a colisão do portão, liberando acesso físico.');
  game.debug.teleport(1386, 315);
  advance(env, 0.05);
  assert.equal(env.elements.get('boss-panel').hidden, false);
  assert.equal(env.elements.get('boss-panel').classList.contains('hidden'), false);
  learn(env, 3);
  assert.equal(game.getState().spells[3].learned, true, 'A memória da Inquisição pode ser obtida quando a área está aberta.');
  game.debug.hit('inquisitor', 1000);
  assert.equal(game.getState().progress.victory, true);
  assert.equal(game.getState().paused, true);

  const resumed = boot(env.storage);
  resumed.elements.get('continue-btn').click();
  assert.equal(resumed.game.getState().progress.victory, true);
  assert.equal(resumed.game.getState().progress.demonDefeated, true);
  assert.equal(resumed.game.getState().enemies.some(enemy => ['demon', 'inquisitor'].includes(enemy.type) && enemy.alive), false, 'Chefes derrotados permanecem derrotados após recarregar.');
});

test('save inválido é ignorado e reset permite uma jornada limpa', () => {
  const storage = new Map([['manguebyte-caca-as-bruxas-v1', '{truncated']]);
  const env = boot(storage);
  env.game.start(true);
  env.game.closeDialog();
  assert.equal(env.game.getState().progress.demonDefeated, false);
  learn(env, 0);
  env.game.reset();
  assert.equal(env.game.getState().active, false);
  assert.equal(env.game.getState().progress.spells.length, 0);
  assert.equal(env.game.getState().progress.suspicion, 5);
  assert.equal(storage.has('manguebyte-caca-as-bruxas-v1'), false);
  assert.equal(env.elements.get('title-screen').hidden, false);
});

console.log(`\n${results.length} cenários de comportamento passaram.`);
