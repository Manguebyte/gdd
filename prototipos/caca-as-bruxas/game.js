/* Caça às Bruxas — recorte jogável do GDD. Canvas 2D, sem dependências. */
(() => {
  'use strict';

  const WORLD = { width: 1600, height: 1100 };
  const SAVE_KEY = 'manguebyte-caca-as-bruxas-v1';
  const ART = '../../Sprites/CacaAsBruxas/';
  const $ = id => document.getElementById(id);
  const canvas = $('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const direction = (x, y) => {
    const length = Math.hypot(x, y);
    return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 1 };
  };
  const hidden = (id, value) => {
    const el = $(id);
    if (el) { el.hidden = value; el.classList.toggle('hidden', value); }
  };
  const say = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const bar = (id, value) => {
    const el = $(id);
    if (el) { el.max = 100; el.value = clamp(value, 0, 100); }
  };

  const SPELLS = [
    { name: 'Fagulha ancestral', cost: 22, description: 'Uma chama que atravessa inimigos. Uma velha memória que a vila teme.' },
    { name: 'Sopro das mortas', cost: 36, description: 'Recupera 38 de vida. O conhecimento de uma curandeira sobrevive à fogueira.' },
    { name: 'Passo espectral', cost: 24, description: 'Uma esquiva longa e invulnerável. Atordoa perseguidores próximos.' },
    { name: 'Lua morta', cost: 44, description: 'Uma onda de energia ao seu redor. As vozes das bruxas rompem o silêncio.' }
  ];
  const PYRES = [
    { id: 'mira', x: 214, y: 940, name: 'Mira, a parteira',
      story: 'Eu trouxe crianças à luz. Quando uma morreu no inverno, disseram que eu a havia oferecido ao demônio. Minhas mãos viraram cinza.\n\nA criatura espera na praça, além das casas. Há uma lembrança nossa num baú perto do poço. Quando os sinos soarem contra você, volte: minhas cinzas ainda aquecem.' },
    { id: 'elisa', x: 828, y: 526, name: 'Elisa, a curandeira',
      story: 'Curei a febre do filho do juiz. Ele agradeceu. No dia seguinte, mandou me queimar por conhecer ervas que ele não conhecia.\n\nProcure o túmulo aberto no cemitério, a leste. Um dom de cura espera ali. O poder atrai os caçadores — mas é também o que abre a passagem para a Inquisição.' },
    { id: 'ines', x: 1032, y: 366, name: 'Inês, a escrevente',
      story: 'Guardei os nomes de todas nós. Chamaram meus livros de maldição. O juiz os leu antes de acender o fogo.\n\nUm baú se esconde entre as árvores ao norte. O portão da Inquisição fica a leste daqui. Eles abrirão o portão quando temerem seu poder. O inquisidor guarda o último registro das mortas.' }
  ];
  const CHESTS = [
    { id: 'ember', x: 348, y: 774, spell: 0, suspicion: 15 },
    { id: 'breath', x: 1390, y: 916, spell: 1, suspicion: 15 },
    { id: 'step', x: 966, y: 208, spell: 2, suspicion: 15 },
    { id: 'moon', x: 1448, y: 456, spell: 3, suspicion: 10 }
  ];
  const NPCS = [
    { id: 'merchant', x: 333, y: 882, name: 'Rui, o mercador',
      line: 'Algo saiu do poço da praça. Eu vi sombras rasgando as portas. Se você pode nos ajudar, siga a rua de pedras para o norte.\n\nO baú junto à casa azul guarda um objeto que minha mãe deixou. Ela dizia que pertencia a uma mulher queimada aqui.' },
    { id: 'witness', x: 746, y: 724, name: 'Uma moradora',
      line: 'Não deixe a criatura chegar às nossas casas. Os guardas se trancaram na igreja. Não restou ninguém lá fora.' }
  ];
  const HOUSES = [
    { x: 58, y: 476, w: 144, h: 122, roof: '#4f454f' },
    { x: 252, y: 516, w: 126, h: 114, roof: '#564450' },
    { x: 56, y: 732, w: 133, h: 134, roof: '#4e4b62' },
    { x: 275, y: 655, w: 142, h: 110, roof: '#3b5260' },
    { x: 741, y: 622, w: 147, h: 111, roof: '#59454d' },
    { x: 500, y: 873, w: 149, h: 127, roof: '#4b465e' },
    { x: 705, y: 852, w: 126, h: 134, roof: '#574943' },
    { x: 477, y: 425, w: 153, h: 129, roof: '#574c5f' },
    { x: 1282, y: 69, w: 244, h: 129, roof: '#393a4b', chapel: true }
  ];
  const FIXED_COLLIDERS = HOUSES.map(h => ({ x: h.x + 7, y: h.y + 25, w: h.w - 14, h: h.h - 30 }));
  FIXED_COLLIDERS.push(
    { x: 1206, y: 32, w: 24, h: 310, wall: true },
    { x: 1206, y: 454, w: 24, h: 129, wall: true },
    { x: 1206, y: 574, w: 394, h: 24, wall: true },
    { x: 954, y: 654, w: 540, h: 16, wall: true },
    { x: 1480, y: 663, w: 16, h: 358, wall: true },
    { x: 954, y: 1004, w: 540, h: 16, wall: true },
    { x: 954, y: 668, w: 16, h: 112, wall: true },
    { x: 954, y: 878, w: 16, h: 127, wall: true },
    { x: 535, y: 630, w: 35, h: 35 }
  );
  const GRAVES = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
    const x = 1020 + col * 82 + (row % 2) * 12;
    const y = 721 + row * 91;
    if (row === 2 && col === 4) continue;
    GRAVES.push({ x, y });
    FIXED_COLLIDERS.push({ x: x - 9, y: y - 12, w: 18, h: 20 });
  }
  const TREES = [];
  let seed = 43109;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 54; i++) {
    const x = 710 + random() * 470, y = 55 + random() * 407;
    if (Math.hypot(x - 966, y - 208) < 88 || Math.hypot(x - 1032, y - 366) < 98 ||
      (x > 866 && x < 1140 && y > 300)) continue;
    TREES.push({ x: Math.round(x), y: Math.round(y), scale: 0.8 + random() * 0.5 });
  }
  [ [68, 363], [171, 381], [82, 1002], [362, 1018], [865, 1045], [1545, 606],
    [1466, 560], [916, 600], [47, 661], [1145, 548], [1570, 220], [1048, 1080]
  ].forEach(([x, y]) => TREES.push({ x, y, scale: 1.1 }));
  for (const tree of TREES) FIXED_COLLIDERS.push({ x: tree.x - 9, y: tree.y - 9, w: 18, h: 18 });
  const GATE = { x: 1205, y: 342, w: 26, h: 112 };

  const assets = {};
  let terrainReady = false;
  ['witch', 'guard', 'demon', 'inquisitor', 'ghost', 'house', 'tree', 'pyre', 'chest', 'stone', 'grass'].forEach(name => {
    const img = new Image();
    if (name === 'stone' || name === 'grass') img.onload = () => { if (terrainReady) paintGround(); };
    img.src = ART + name + '.png';
    assets[name] = img;
  });
  const walkFrames = Array.from({ length: 8 }, (_, index) => {
    const image = new Image(); image.src = ART + 'witch-walk/' + index + '.png'; return image;
  });

  function freshSave() {
    return { version: 1, checkpoint: 'mira', suspicion: 5, spells: [], ashes: 0,
      demonDefeated: false, victory: false, lostAshes: null, deaths: 0, visited: [], introSeen: false };
  }
  function readSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!raw || raw.version !== 1) return null;
      const save = freshSave();
      save.checkpoint = PYRES.some(p => p.id === raw.checkpoint) ? raw.checkpoint : 'mira';
      save.suspicion = clamp(Number(raw.suspicion) || 5, 5, 100);
      save.spells = Array.isArray(raw.spells) ? [...new Set(raw.spells.filter(n => Number.isInteger(n) && n >= 0 && n < SPELLS.length))] : [];
      save.ashes = clamp(Number(raw.ashes) || 0, 0, 999999);
      save.demonDefeated = raw.demonDefeated === true;
      save.victory = raw.victory === true && save.demonDefeated;
      save.deaths = clamp(Number(raw.deaths) || 0, 0, 999999);
      save.introSeen = raw.introSeen === true;
      save.visited = Array.isArray(raw.visited) ? raw.visited.filter(id => PYRES.some(p => p.id === id)) : [];
      if (raw.lostAshes && Number.isFinite(raw.lostAshes.x) && Number.isFinite(raw.lostAshes.y) && raw.lostAshes.amount > 0) {
        save.lostAshes = { x: clamp(raw.lostAshes.x, 25, WORLD.width - 25),
          y: clamp(raw.lostAshes.y, 25, WORLD.height - 25), amount: clamp(Number(raw.lostAshes.amount), 0, 999999) };
      }
      return save;
    } catch (_) { return null; }
  }

  let saved = readSave();
  let progress = saved || freshSave();
  let active = false, dialogOpen = false, dead = false;
  let player, enemies = [], projectiles = [], particles = [], effects = [];
  let clock = 0, uiTimer = 0, quickCooldown = 0, spellCooldown = 0, charge = 0, chargeHeld = false;
  let shieldAge = 0, shieldHeld = false, lastSpend = -10, staminaDelay = 0;
  let toastTime = 0, zoneName = '', mouseAim = false, mouseDown = false;
  const controls = new Set();
  const pointer = { x: 480, y: 300 };
  const camera = { x: 0, y: 0 };
  const view = { w: 960, h: 600 };
  let audioContext = null;

  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); saved = JSON.parse(JSON.stringify(progress)); } catch (_) {}
    hidden('continue-btn', !saved);
    hidden('reset-btn', !saved);
  }
  function sound(kind) {
    if (!audioContext) return;
    try {
      const osc = audioContext.createOscillator(), gain = audioContext.createGain();
      const now = audioContext.currentTime;
      const pitch = { cast: 330, hit: 95, parry: 720, dodge: 190, bell: 120, learn: 480, death: 70 }[kind] || 240;
      osc.type = kind === 'bell' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.35, now + 0.28);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'bell' ? 1.7 : 0.3));
      osc.connect(gain); gain.connect(audioContext.destination);
      osc.start(); osc.stop(now + 1.8);
    } catch (_) {}
  }
  function toast(message, duration = 4) {
    say('toast', message); toastTime = duration; hidden('toast', false);
  }
  function showDialog(title, text, actions) {
    dialogOpen = true;
    controls.clear(); mouseDown = false; chargeHeld = false; charge = 0; shieldHeld = false;
    say('dialog-title', title); say('dialog-text', text);
    const container = $('dialog-actions');
    if (container) {
      container.replaceChildren();
      for (const action of actions || [{ label: 'Continuar', run: closeDialog }]) {
        const button = document.createElement('button');
        button.textContent = action.label;
        button.addEventListener('click', action.run);
        container.appendChild(button);
      }
    }
    hidden('dialog', false);
  }
  function closeDialog() { dialogOpen = false; hidden('dialog', true); canvas.focus(); }

  function makeEnemy(id, type, x, y) {
    const stats = {
      demon: { hp: 280, damage: 22, speed: 63, range: 84, windup: 0.9, reward: 70, name: 'A sombra do poço' },
      shade: { hp: 54, damage: 12, speed: 83, range: 42, windup: 0.68, reward: 12, name: 'Cria da sombra' },
      guard: { hp: 92, damage: 17, speed: 88, range: 45, windup: 0.68, reward: 18, name: 'Guarda da vila' },
      hunter: { hp: 110, damage: 18, speed: 93, range: 240, windup: 0.95, reward: 25, name: 'Caçador de bruxas' },
      inquisitor: { hp: 460, damage: 26, speed: 78, range: 102, windup: 0.9, reward: 140, name: 'O inquisidor-mor' }
    }[type];
    return { id, type, x, y, homeX: x, homeY: y, ...stats, maxHp: stats.hp,
      alive: true, timer: 0, state: 'idle', stun: 0, flash: 0, attackCount: 0, facing: 1,
      targetX: x, targetY: y, unparryable: false, boss: type === 'demon' || type === 'inquisitor' };
  }
  function setupEnemies() {
    enemies = [];
    if (!progress.demonDefeated) {
      enemies.push(makeEnemy('demon', 'demon', 625, 670));
      enemies.push(makeEnemy('shade-1', 'shade', 435, 828), makeEnemy('shade-2', 'shade', 573, 756));
    } else {
      enemies.push(makeEnemy('guard-1', 'guard', 455, 797), makeEnemy('guard-2', 'guard', 720, 785),
        makeEnemy('guard-3', 'guard', 648, 555), makeEnemy('guard-4', 'guard', 1160, 950));
    }
    if (progress.suspicion >= 70) {
      enemies.push(makeEnemy('hunter-1', 'hunter', 1081, 579), makeEnemy('hunter-2', 'hunter', 1321, 448));
    }
    if (!progress.victory) enemies.push(makeEnemy('inquisitor', 'inquisitor', 1386, 268));
  }
  function spawnPlayer() {
    const pyre = PYRES.find(p => p.id === progress.checkpoint) || PYRES[0];
    player = { x: pyre.x + 45, y: pyre.y + 12, hp: 100, mp: 100, stamina: 100,
      r: 12, facingX: 0, facingY: -1, invulnerable: 0, dodgeTime: 0, dodgeX: 0, dodgeY: 0,
      stun: 0, flash: 0, moving: false };
    camera.x = clamp(player.x - view.w / 2, 0, WORLD.width - view.w);
    camera.y = clamp(player.y - view.h / 2, 0, WORLD.height - view.h);
    quickCooldown = 0; spellCooldown = 0; charge = 0; shieldHeld = false; shieldAge = 0;
    lastSpend = -10; staminaDelay = 0; dead = false;
    projectiles = []; particles = []; effects = []; controls.clear();
    setupEnemies();
  }
  function reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
    saved = null; progress = freshSave(); active = false; clock = 0;
    closeDialog(); spawnPlayer(); hidden('title-screen', false); hidden('hud', true); hidden('continue-btn', true); hidden('reset-btn', true);
    hidden('boss-panel', true); hidden('toast', true); updateHUD(); render();
  }
  function start(resume = true) {
    if (!resume) { progress = freshSave(); saved = null; }
    else progress = readSave() || progress;
    spawnPlayer(); active = true; hidden('title-screen', true); hidden('hud', false); closeDialog();
    try {
      if (!audioContext) { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) audioContext = new Audio(); }
      if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    } catch (_) {}
    if (!progress.introSeen) {
      progress.introSeen = true;
      showDialog('Uma vila pede socorro', 'Uma criatura saiu do poço. Você veio caçá-la.\n\nMova-se com WASD ou setas. Lance magia com o mouse ou J; segure K para carregar. Use Q para escudo, Espaço para esquivar e E para interagir.\n\nUma voz chama do fogo apagado ao seu lado. Escute as mortas. Elas conhecem o caminho.', [{ label: 'Ouvir a vila', run: closeDialog }]);
    } else if (progress.victory) toast('As mortas têm nome. Você pode continuar explorando a vila.', 6);
    persist(); updateHUD();
  }

  function blocked(x, y, radius = 12) {
    if (x < 25 || y < 25 || x > WORLD.width - 25 || y > WORLD.height - 25) return true;
    const colliders = progress.suspicion >= 70 ? FIXED_COLLIDERS : FIXED_COLLIDERS.concat(GATE);
    return colliders.some(c => x + radius > c.x && x - radius < c.x + c.w && y + radius > c.y && y - radius < c.y + c.h);
  }
  function move(body, dx, dy, radius = 12) {
    // Separate axes allow the player to slide along houses and cemetery walls.
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 8));
    for (let i = 0; i < steps; i++) {
      if (!blocked(body.x + dx / steps, body.y, radius)) body.x += dx / steps;
      if (!blocked(body.x, body.y + dy / steps, radius)) body.y += dy / steps;
    }
  }
  function safePosition(x, y) { return PYRES.some(p => Math.hypot(x - p.x, y - p.y) < 78); }
  function targetDirection() {
    if (mouseAim) return direction(pointer.x + camera.x - player.x, pointer.y + camera.y - player.y);
    const target = enemies.filter(e => e.alive && distance(player, e) < 440)
      .sort((a, b) => distance(player, a) - distance(player, b))[0];
    if (target) return direction(target.x - player.x, target.y - player.y);
    return direction(player.facingX, player.facingY);
  }
  function sparks(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2, s = 30 + random() * 120;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35 + random() * 0.35, maxLife: 0.7, color });
    }
  }
  function ring(x, y, radius, color, duration = 0.45) { effects.push({ x, y, radius, color, life: duration, maxLife: duration }); }
  function fire(kind, power = 1) {
    const aim = targetDirection();
    player.facingX = aim.x; player.facingY = aim.y;
    const damage = kind === 'charged' ? 48 + power * 35 : kind === 'ember' ? 74 : 23;
    projectiles.push({ x: player.x + aim.x * 20, y: player.y + aim.y * 20,
      vx: aim.x * (kind === 'charged' ? 410 : 440), vy: aim.y * (kind === 'charged' ? 410 : 440),
      damage, radius: kind === 'quick' ? 5 : 10, life: 1.3, kind, enemy: false,
      color: kind === 'ember' ? '#ffac70' : kind === 'charged' ? '#eac7ff' : '#bd9eff', hits: [] });
    sound('cast');
  }
  function cast(kind = 'quick', power = 1) {
    if (!active || dialogOpen || dead || player.stun > 0 || shieldHeld) return false;
    if (kind === 'quick') {
      if (quickCooldown > 0 || player.stamina < 9) return false;
      player.stamina -= 9; staminaDelay = 0.35; quickCooldown = 0.28; fire('quick'); return true;
    }
    if (kind === 'charged') {
      if (quickCooldown > 0 || player.stamina < 25) return false;
      player.stamina -= 25; staminaDelay = 0.55; quickCooldown = 0.6; fire('charged', clamp(power, 0, 1)); return true;
    }
    const index = typeof kind === 'number' ? kind : Number(String(kind).replace('spell', '')) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= SPELLS.length) return false;
    if (!progress.spells.includes(index)) { toast('Este feitiço ainda é uma lembrança perdida. Procure os baús.', 2); return false; }
    if (spellCooldown > 0) return false;
    if (player.mp < SPELLS[index].cost) { toast('Sem energia mágica. Afaste-se para recuperar MP.', 2); return false; }
    if (index === 1 && player.hp >= 100) { toast('Sua vida já está completa.', 2); return false; }
    player.mp -= SPELLS[index].cost; lastSpend = clock; spellCooldown = 0.65;
    if (index === 0) fire('ember');
    if (index === 1) { player.hp = Math.min(100, player.hp + 38); ring(player.x, player.y, 58, '#9bddb5'); sparks(player.x, player.y, '#b7ebc7', 20); sound('learn'); }
    if (index === 2) {
      const aim = movementDirection();
      player.dodgeTime = 0.4; player.invulnerable = 0.65; player.dodgeX = aim.x; player.dodgeY = aim.y;
      enemies.forEach(e => { if (e.alive && distance(e, player) < 140) e.stun = 1.5; });
      ring(player.x, player.y, 130, '#b8d7f4'); sound('dodge');
    }
    if (index === 3) {
      ring(player.x, player.y, 190, '#dfc3fa', 0.75);
      enemies.forEach(e => { if (e.alive && distance(e, player) < 190) damageEnemy(e, 105); });
      sparks(player.x, player.y, '#e4ccfa', 45); sound('cast');
    }
    updateHUD(); return true;
  }
  function movementDirection() {
    const x = (controls.has('right') ? 1 : 0) - (controls.has('left') ? 1 : 0);
    const y = (controls.has('down') ? 1 : 0) - (controls.has('up') ? 1 : 0);
    return x || y ? direction(x, y) : direction(player.facingX, player.facingY);
  }
  function dodge() {
    if (!active || dialogOpen || dead || player.stun > 0 || player.dodgeTime > 0 || player.stamina < 24) return false;
    const aim = movementDirection(); player.stamina -= 24; staminaDelay = 0.6;
    player.dodgeTime = 0.24; player.invulnerable = 0.34; player.dodgeX = aim.x; player.dodgeY = aim.y;
    shieldHeld = false; charge = 0; chargeHeld = false; sound('dodge'); return true;
  }
  function shield(on) {
    if (!active || dialogOpen || dead) { shieldHeld = false; return; }
    if (on && !shieldHeld && player.stun <= 0 && player.dodgeTime <= 0) {
      shieldHeld = true; shieldAge = 0; charge = 0; chargeHeld = false;
    } else if (!on) shieldHeld = false;
  }
  function damagePlayer(amount, source, unparryable = false) {
    if (dead || player.invulnerable > 0) return;
    if (shieldHeld && !unparryable) {
      if (shieldAge <= 0.23) {
        if (source) { source.stun = source.boss ? 1.6 : 2.2; source.state = 'idle'; source.timer = 1.3; }
        player.mp = Math.min(100, player.mp + 8); player.invulnerable = 0.3;
        sparks(player.x, player.y, '#eef1ff', 28); ring(player.x, player.y, 70, '#e4ddff');
        toast('PARRY · postura quebrada · nenhum custo de MP', 1.5); sound('parry'); return;
      }
      if (player.mp >= 18) {
        player.mp -= 18; lastSpend = clock; player.invulnerable = 0.2;
        sparks(player.x, player.y, '#a68bde', 12); sound('hit'); return;
      }
      player.mp = 0; shieldHeld = false; player.stun = 0.7; toast('Escudo rompido', 2);
    }
    player.hp -= amount; player.flash = 0.24; player.invulnerable = 0.48;
    sparks(player.x, player.y, '#d48089'); sound('hit');
    if (player.hp <= 0) die();
  }
  function damageEnemy(enemy, amount) {
    if (!enemy.alive) return;
    if (enemy.type === 'inquisitor' && (!progress.demonDefeated || progress.suspicion < 70)) return;
    enemy.hp -= amount * (enemy.stun > 0 ? 1.35 : 1); enemy.flash = 0.17;
    sparks(enemy.x, enemy.y, enemy.type === 'demon' || enemy.type === 'shade' ? '#a788bc' : '#b8a19e', 8);
    if (enemy.hp > 0) return;
    enemy.alive = false; progress.ashes += enemy.reward;
    if (enemy.type === 'demon') {
      progress.demonDefeated = true; progress.suspicion = Math.max(60, progress.suspicion);
      enemies.filter(e => e.type === 'shade').forEach(e => { e.alive = false; });
      enemies.push(makeEnemy('guard-1', 'guard', 455, 797), makeEnemy('guard-2', 'guard', 720, 785),
        makeEnemy('guard-3', 'guard', 648, 555), makeEnemy('guard-4', 'guard', 1160, 950));
      sound('bell'); persist();
      showDialog('Os sinos chamam por você', 'A sombra do poço cai. Você salvou a vila.\n\nUma moradora vê a magia ainda viva em suas mãos. “É ela! A bruxa trouxe o demônio!” Portas se fecham. Os guardas erguem as tochas.\n\nA Suspeita chegou a 60. A vila agora caça você. Fuja para uma fogueira e ouça as mulheres que eles queimaram.', [{ label: 'Sobreviver à acusação', run: () => { closeDialog(); toast('A vila se voltou contra você. Fogueiras são lugares seguros.', 6); } }]);
    } else if (enemy.type === 'inquisitor') {
      progress.victory = true; persist(); sound('bell');
      showDialog('As mortas têm nome', 'No registro do inquisidor, você encontra o nome de cada mulher queimada. Mira. Elisa. Inês. E tantas outras.\n\nA vila queria um monstro. Você lhe devolve a memória.\n\nEste é o fim do recorte jogável. As fogueiras continuam acesas, e a cidade ainda pode ser explorada.', [{ label: 'Continuar explorando', run: closeDialog }, { label: 'Voltar ao início', run: () => { closeDialog(); active = false; hidden('title-screen', false); hidden('hud', true); } }]);
    } else persist();
  }
  function die() {
    dead = true; player.hp = 0; shieldHeld = false; mouseDown = false; controls.clear();
    progress.lostAshes = progress.ashes > 0 ? { x: player.x, y: player.y, amount: progress.ashes } : null;
    progress.ashes = 0; progress.deaths++; persist(); sound('death');
    showDialog('Você se tornou cinza', progress.lostAshes
      ? `${progress.lostAshes.amount} cinzas ficaram onde você caiu. Recupere-as antes de morrer novamente.\n\nAs mortas guardam seu conhecimento. As magias aprendidas, a Suspeita e os chefes derrotados permanecem.`
      : 'Você caiu sem carregar cinzas.\n\nAs mortas guardam seu conhecimento. Descanse e tente novamente.',
    [{ label: 'Retornar à fogueira', run: () => { spawnPlayer(); closeDialog(); toast('Você desperta entre as cinzas. O conhecimento permanece.', 5); updateHUD(); } }]);
  }

  function nearestInteraction() {
    if (!player) return null;
    const nearby = [];
    for (const p of PYRES) if (distance(player, p) < 90) nearby.push({ ...p, type: 'pyre', label: `E · Descansar com ${p.name}`, distance: distance(player, p) });
    for (const c of CHESTS) if (!progress.spells.includes(c.spell) && distance(player, c) < 67 && (c.id !== 'moon' || (progress.demonDefeated && progress.suspicion >= 70)))
      nearby.push({ ...c, type: 'chest', label: 'E · Abrir o baú de memórias', distance: distance(player, c) });
    for (const n of NPCS) if (distance(player, n) < 65) nearby.push({ ...n, type: 'npc', label: `E · Falar com ${n.name}`, distance: distance(player, n) });
    if (progress.lostAshes && distance(player, progress.lostAshes) < 52) nearby.push({ ...progress.lostAshes, type: 'ashes', label: 'E · Recuperar suas cinzas', distance: distance(player, progress.lostAshes) });
    if (player.x > 1118 && player.x < 1290 && player.y > 330 && player.y < 461 && progress.suspicion < 70)
      nearby.push({ type: 'gate', label: 'E · Examinar o portão da Inquisição', distance: Math.abs(player.x - 1206) });
    return nearby.sort((a, b) => a.distance - b.distance)[0] || null;
  }
  function interact() {
    if (!active || dialogOpen || dead || player.stun > 0) return false;
    const object = nearestInteraction();
    if (!object) return false;
    if (object.type === 'pyre') {
      progress.checkpoint = object.id;
      if (!progress.visited.includes(object.id)) progress.visited.push(object.id);
      player.hp = 100; player.mp = 100; player.stamina = 100;
      projectiles = []; setupEnemies(); persist(); sound('learn');
      showDialog(object.name, object.story + '\n\nVida, MP e fôlego restaurados. Esta fogueira é seu novo ponto de retorno.', [{ label: 'Levantar da fogueira', run: closeDialog }]);
    } else if (object.type === 'chest') {
      const oldSuspicion = progress.suspicion;
      progress.spells.push(object.spell); progress.suspicion = Math.min(100, progress.suspicion + object.suspicion);
      if (oldSuspicion < 70 && progress.suspicion >= 70) {
        enemies.push(makeEnemy('hunter-1', 'hunter', 1081, 579), makeEnemy('hunter-2', 'hunter', 1321, 448));
      }
      persist(); sound('learn'); sparks(object.x, object.y, '#e2c39a', 22);
      showDialog('Memória aprendida: ' + SPELLS[object.spell].name,
        SPELLS[object.spell].description + `\n\nAtalho ${object.spell + 1} · custo ${SPELLS[object.spell].cost} MP. Suspeita +${object.suspicion}.` +
        (oldSuspicion < 70 && progress.suspicion >= 70 ? '\n\nOs caçadores a reconheceram. O portão da Inquisição se abre para recebê-la. Procure a passagem ao norte do cemitério.' : '\n\nAprender torna você mais poderosa. A cidade também passa a temê-la mais.'),
      [{ label: 'Guardar a memória', run: closeDialog }]);
    } else if (object.type === 'npc') {
      showDialog(object.name, progress.demonDefeated
        ? '“Não se aproxime! Nós vimos suas mãos. Vimos o fogo. Guardas! A bruxa está aqui!”\n\nA mulher que pediu sua ajuda agora teme você.' : object.line);
    } else if (object.type === 'ashes') {
      progress.ashes += progress.lostAshes.amount; progress.lostAshes = null; persist(); sound('learn');
      toast('Suas cinzas voltaram para você.', 4); ring(player.x, player.y, 50, '#edc493');
    } else if (object.type === 'gate') {
      showDialog('O portão da Inquisição', '“Só os que carregam o mal serão julgados.”\n\nO portão se abre com Suspeita 70. Procure memórias no cemitério a leste ou na floresta ao norte. Quanto mais você aprende, mais perto chega de quem queimou as bruxas.');
    }
    updateHUD(); return true;
  }

  function updateEnemy(enemy, dt) {
    if (!enemy.alive) return;
    enemy.flash = Math.max(0, enemy.flash - dt);
    enemy.stun = Math.max(0, enemy.stun - dt);
    if (enemy.stun > 0) return;
    if (enemy.type === 'inquisitor' && progress.suspicion < 70) return;
    enemy.timer = Math.max(0, enemy.timer - dt);
    const d = distance(enemy, player);
    enemy.facing = player.x < enemy.x ? -1 : 1;
    if (enemy.state === 'windup') {
      if (enemy.timer <= 0) {
        if (enemy.type === 'hunter') {
          const aim = direction(enemy.targetX - enemy.x, enemy.targetY - enemy.y);
          projectiles.push({ x: enemy.x, y: enemy.y - 8, vx: aim.x * 250, vy: aim.y * 250,
            radius: 5, damage: enemy.damage, life: 2, enemy: true, source: enemy, color: '#efb784', hits: [] });
        } else {
          const blast = { x: enemy.unparryable ? enemy.targetX : enemy.x, y: enemy.unparryable ? enemy.targetY : enemy.y };
          const radius = enemy.unparryable ? 78 : enemy.range + 12;
          ring(blast.x, blast.y, radius, enemy.unparryable ? '#f09365' : '#ce899c');
          if (distance(blast, player) < radius + player.r) damagePlayer(enemy.damage, enemy, enemy.unparryable);
        }
        enemy.state = 'recover'; enemy.timer = enemy.boss ? 1.1 : 1.35;
      }
      return;
    }
    if (enemy.state === 'recover') { if (enemy.timer <= 0) enemy.state = 'idle'; else return; }
    const aggroDistance = enemy.boss ? 320 : progress.suspicion >= 85 ? 330 : 270;
    if (d > aggroDistance || safePosition(player.x, player.y)) {
      const home = direction(enemy.homeX - enemy.x, enemy.homeY - enemy.y);
      if (Math.hypot(enemy.homeX - enemy.x, enemy.homeY - enemy.y) > 10) move(enemy, home.x * enemy.speed * dt * 0.5, home.y * enemy.speed * dt * 0.5, 13);
      return;
    }
    if (d < enemy.range + 12 && enemy.timer <= 0) {
      enemy.state = 'windup'; enemy.timer = enemy.windup;
      enemy.targetX = player.x; enemy.targetY = player.y; enemy.attackCount++;
      enemy.unparryable = (enemy.type === 'inquisitor' && enemy.attackCount % 2 === 0) || (enemy.type === 'demon' && enemy.attackCount % 3 === 0);
    } else {
      const aim = direction(player.x - enemy.x, player.y - enemy.y);
      const speed = enemy.speed * (progress.suspicion >= 85 && !enemy.boss ? 1.13 : 1);
      const nx = enemy.x + aim.x * speed * dt, ny = enemy.y + aim.y * speed * dt;
      if (!safePosition(nx, ny)) move(enemy, aim.x * speed * dt, aim.y * speed * dt, enemy.boss ? 19 : 12);
    }
  }
  function updateProjectiles(dt) {
    for (const p of projectiles) {
      p.life -= dt;
      const steps = Math.max(1, Math.ceil(Math.hypot(p.vx, p.vy) * dt / 9));
      for (let i = 0; i < steps && p.life > 0; i++) {
        p.x += p.vx * dt / steps; p.y += p.vy * dt / steps;
        if (blocked(p.x, p.y, 3)) { p.life = 0; sparks(p.x, p.y, p.color, 4); break; }
        if (p.enemy) {
          if (distance(p, player) < p.radius + player.r) {
            if (shieldHeld && shieldAge <= 0.23 && player.invulnerable <= 0) {
              damagePlayer(0, p.source); p.enemy = false; p.vx *= -1; p.vy *= -1; p.damage = 46; p.color = '#d9c9ff'; p.life = 1.3;
            } else { damagePlayer(p.damage, p.source); p.life = 0; }
          }
        } else for (const e of enemies) {
          if (!e.alive || (e.type === 'inquisitor' && progress.suspicion < 70) || p.hits.includes(e.id)) continue;
          if (distance(p, e) < p.radius + (e.boss ? 26 : 15)) {
            damageEnemy(e, p.damage); p.hits.push(e.id);
            if (p.kind !== 'ember') p.life = 0;
          }
        }
      }
    }
    projectiles = projectiles.filter(p => p.life > 0);
  }
  function currentZone() {
    if (player.x > 1230 && player.y < 580) return 'Pátio da Inquisição';
    if (player.x > 955 && player.y > 653) return 'Cemitério das esquecidas';
    if (player.y < 460 && player.x > 690) return 'Bosque das testemunhas';
    if (player.x > 451 && player.x < 733 && player.y > 560 && player.y < 826) return 'Praça do poço';
    return 'Vila de Santa Bruma';
  }
  function objective() {
    if (progress.victory) return 'As mortas têm nome. A memória delas permanece.';
    if (!progress.spells.includes(0) && !progress.demonDefeated) return 'Ouça Mira na fogueira. Busque a primeira memória perto do poço.';
    if (!progress.demonDefeated) return 'Derrote a sombra do poço, na praça da vila.';
    if (progress.suspicion < 70) return 'Fuja dos guardas. Procure memórias no cemitério a leste.';
    return 'O portão está aberto. Enfrente o inquisidor no pátio ao nordeste.';
  }
  function updateHUD() {
    if (!player) return;
    bar('hp', player.hp); bar('mp', player.mp); bar('stamina', player.stamina);
    say('hp-value', Math.ceil(player.hp)); say('mp-value', Math.floor(player.mp)); say('stamina-value', Math.floor(player.stamina));
    const level = progress.suspicion >= 90 ? 'INQUISIÇÃO' : progress.suspicion >= 70 ? 'PERSEGUIÇÃO' : progress.suspicion >= 45 ? 'DENÚNCIA' : 'DESCONFIANÇA';
    bar('suspicion', progress.suspicion); say('suspicion-label', `${level} · ${progress.suspicion}`);
    say('objective', objective()); say('ashes', progress.ashes); say('zone', currentZone());
    const nearby = !dialogOpen && !dead ? nearestInteraction() : null;
    say('prompt', nearby ? nearby.label : ''); hidden('prompt', !nearby || !active);
    const boss = enemies.find(e => e.alive && e.boss && distance(e, player) < 390 && (e.type !== 'inquisitor' || progress.suspicion >= 70));
    hidden('boss-panel', !boss || !active || dead);
    if (boss) { say('boss-name', boss.name); bar('boss-hp', boss.hp / boss.maxHp * 100); }
    for (let i = 0; i < SPELLS.length; i++) {
      const el = $('spell' + (i + 1));
      if (el) {
        const learned = progress.spells.includes(i);
        el.classList.toggle('learned', learned); el.classList.toggle('locked', !learned);
        el.title = learned ? `${SPELLS[i].name} · ${SPELLS[i].cost} MP` : 'Memória ainda não encontrada';
        const label = el.querySelector('.spell-name'); if (label) label.textContent = learned ? SPELLS[i].name : 'Memória perdida';
      }
    }
  }
  function tick(dt) {
    dt = clamp(Number(dt) || 0, 0, 0.05);
    if (!active || dialogOpen || dead || document.hidden) return;
    clock += dt; quickCooldown = Math.max(0, quickCooldown - dt); spellCooldown = Math.max(0, spellCooldown - dt);
    staminaDelay = Math.max(0, staminaDelay - dt); player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.stun = Math.max(0, player.stun - dt); player.flash = Math.max(0, player.flash - dt);
    if (shieldHeld) {
      shieldAge += dt;
      if (shieldAge > 0.23) { player.mp = Math.max(0, player.mp - 12 * dt); lastSpend = clock; }
      if (player.mp <= 0 && shieldAge > 0.23) { shieldHeld = false; player.stun = 0.65; toast('Escudo rompido · energia esgotada', 2); }
    } else if (clock - lastSpend > 1.35) player.mp = Math.min(100, player.mp + dt * (progress.suspicion >= 90 ? 8.8 : 11));
    if (staminaDelay <= 0 && !chargeHeld) player.stamina = Math.min(100, player.stamina + 29 * dt);
    player.moving = false;
    if (player.stun <= 0) {
      if (player.dodgeTime > 0) {
        player.dodgeTime = Math.max(0, player.dodgeTime - dt);
        move(player, player.dodgeX * 490 * dt, player.dodgeY * 490 * dt);
        if (random() < 0.65) particles.push({ x: player.x, y: player.y - 9, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: '#bda8e1' });
      } else {
        const x = (controls.has('right') ? 1 : 0) - (controls.has('left') ? 1 : 0);
        const y = (controls.has('down') ? 1 : 0) - (controls.has('up') ? 1 : 0);
        if (x || y) {
          const d = direction(x, y), speed = shieldHeld ? 69 : chargeHeld ? 79 : 156;
          move(player, d.x * speed * dt, d.y * speed * dt);
          player.facingX = d.x; player.facingY = d.y; player.moving = true;
        }
      }
      if (mouseDown || controls.has('attack')) cast('quick');
      if (chargeHeld && !shieldHeld && player.dodgeTime <= 0) charge = Math.min(1.2, charge + dt);
    }
    for (const e of enemies) { if (dead || dialogOpen) break; updateEnemy(e, dt); }
    if (!dead && !dialogOpen) updateProjectiles(dt);
    particles.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; });
    particles = particles.filter(p => p.life > 0);
    effects.forEach(e => { e.life -= dt; }); effects = effects.filter(e => e.life > 0);
    const targetX = clamp(player.x - view.w / 2, 0, WORLD.width - view.w);
    const targetY = clamp(player.y - view.h / 2, 0, WORLD.height - view.h);
    camera.x += (targetX - camera.x) * Math.min(1, dt * 8);
    camera.y += (targetY - camera.y) * Math.min(1, dt * 8);
    toastTime -= dt; if (toastTime <= 0) hidden('toast', true);
    const zone = currentZone();
    if (zone !== zoneName) { zoneName = zone; say('zone', zone); }
    uiTimer -= dt; if (uiTimer <= 0) { updateHUD(); uiTimer = 0.07; }
  }

  // Terrain is painted once. Handcrafted streets and distinct landmarks keep the map readable.
  const ground = document.createElement('canvas'); ground.width = WORLD.width; ground.height = WORLD.height;
  const g = ground.getContext('2d');
  function pixelPath(points, width, color) {
    g.strokeStyle = color; g.lineWidth = width; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  }
  function paintGround() {
    const previousSeed = seed; seed = 904177;
    g.fillStyle = '#1d2628'; g.fillRect(0, 0, WORLD.width, WORLD.height);
    if (assets.grass.complete && assets.grass.naturalWidth) {
      g.globalAlpha = 0.16; g.fillStyle = g.createPattern(assets.grass, 'repeat');
      g.fillRect(0, 0, WORLD.width, WORLD.height); g.globalAlpha = 1;
    }
    g.fillStyle = '#29282d'; g.fillRect(35, 426, 868, 632);
    g.fillStyle = '#20282c'; g.fillRect(961, 669, 520, 337);
    g.fillStyle = '#272832'; g.fillRect(1229, 44, 330, 530);
    for (let i = 0; i < 9800; i++) {
      const x = Math.floor(random() * WORLD.width / 3) * 3, y = Math.floor(random() * WORLD.height / 3) * 3;
      g.fillStyle = ['#29302f', '#20292b', '#303034', '#35302f'][Math.floor(random() * 4)];
      g.fillRect(x, y, 2 + Math.floor(random() * 3), 2);
    }
    const mainRoad = [[207, 1070], [245, 913], [462, 826], [569, 709], [675, 550], [849, 496], [1032, 411], [1310, 400], [1388, 268]];
    pixelPath(mainRoad, 96, '#383637'); pixelPath(mainRoad, 78, '#4a4140');
    pixelPath([[462, 826], [674, 814], [974, 826], [1385, 915]], 72, '#3d383a');
    pixelPath([[1061, 393], [1019, 306], [966, 209]], 60, '#353732');
    pixelPath([[258, 902], [330, 821], [348, 782]], 50, '#4b4140');
    pixelPath([[839, 500], [828, 526]], 76, '#4d4441');
    g.fillStyle = '#4b4142';
    g.beginPath(); g.ellipse(598, 676, 160, 130, -0.2, 0, Math.PI * 2); g.fill();
    if (assets.stone.complete && assets.stone.naturalWidth) {
      const stone = g.createPattern(assets.stone, 'repeat'); g.globalAlpha = 0.24;
      pixelPath(mainRoad, 72, stone); pixelPath([[462, 826], [674, 814], [974, 826], [1385, 915]], 64, stone);
      pixelPath([[258, 902], [330, 821], [348, 782]], 42, stone);
      g.fillStyle = stone; g.beginPath(); g.ellipse(598, 676, 160, 130, -0.2, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    }
    // Individual irregular cobbles are constrained to roads rather than covering every block.
    for (let i = 0; i < 1800; i++) {
      const x = Math.floor(random() * WORLD.width / 6) * 6, y = Math.floor(random() * WORLD.height / 6) * 6;
      const color = g.getImageData(x, y, 1, 1).data;
      if (color[0] < 57 || color[0] > 83 || color[1] > 76) continue;
      g.fillStyle = random() > 0.5 ? '#5a4d49' : '#3b3536'; g.fillRect(x, y, 8 + Math.floor(random() * 5), 4);
    }
    // Fields, flower plots, charred execution ground and chalk markings are district-specific.
    g.fillStyle = '#242f2d'; g.fillRect(61, 910, 93, 99);
    for (let y = 918; y < 1004; y += 13) { g.fillStyle = '#394337'; g.fillRect(69, y, 76, 3); }
    PYRES.forEach(p => {
      g.fillStyle = '#302c31'; g.beginPath(); g.arc(p.x, p.y, 66, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#65584e'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 39, 0, Math.PI * 2); g.stroke();
    });
    g.fillStyle = '#372f36'; g.fillRect(1330, 215, 116, 115);
    g.strokeStyle = '#5c4751'; g.lineWidth = 2; g.strokeRect(1335, 220, 106, 105);
    for (let y = 684; y < 1000; y += 24) for (let x = 973; x < 1470; x += 26) {
      if (random() > 0.63) { g.fillStyle = '#39413c'; g.fillRect(x, y, 3, 5); }
    }
    seed = previousSeed; terrainReady = true;
  }
  paintGround();

  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function imageAsset(name, x, y, w, h, flip = false) {
    const img = assets[name];
    if (!img || !img.complete || !img.naturalWidth) return false;
    ctx.save();
    if (flip) { ctx.translate(Math.round(x + w), Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); }
    else ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
    ctx.restore(); return true;
  }
  function shadow(x, y, w = 26) { ctx.fillStyle = '#10151aad'; ctx.beginPath(); ctx.ellipse(x, y + 3, w / 2, 7, 0, 0, Math.PI * 2); ctx.fill(); }
  function drawHouse(h) {
    rect(h.x + 10, h.y + 12, h.w, h.h, '#11192070');
    if (imageAsset('house', h.x - 6, h.y - 22, h.w + 12, h.h + 36)) {
      if (h.chapel) { rect(h.x + h.w / 2 - 2, h.y - 39, 5, 26, '#a1a3ab'); rect(h.x + h.w / 2 - 11, h.y - 29, 23, 5, '#a1a3ab'); }
      return;
    }
    rect(h.x, h.y + 34, h.w, h.h - 34, '#514b4d');
    rect(h.x + 6, h.y + 40, h.w - 12, h.h - 43, '#69615b');
    rect(h.x + 14, h.y + 50, h.w - 28, 8, '#777064');
    for (let i = 0; i < 6; i++) rect(h.x + i * 5, h.y + 30 - i * 7, h.w - i * 10, 10, h.roof);
    for (let x = h.x + 18; x < h.x + h.w - 8; x += 28) rect(x, h.y + 17, 13, 3, '#817078');
    rect(h.x + h.w / 2 - 13, h.y + h.h - 39, 26, 39, '#302a31');
    rect(h.x + h.w / 2 + 5, h.y + h.h - 22, 3, 3, '#b0a18b');
    for (const x of [h.x + 17, h.x + h.w - 40]) {
      rect(x, h.y + 60, 22, 25, '#342a30'); rect(x + 4, h.y + 64, 14, 16, progress.demonDefeated ? '#42363b' : '#ba865550');
      rect(x + 10, h.y + 62, 3, 22, '#423c3c');
    }
    rect(h.x + h.w - 31, h.y - 20, 13, 34, '#5b5153');
  }
  function drawTree(t) {
    shadow(t.x, t.y, 45 * t.scale);
    if (imageAsset('tree', t.x - 40 * t.scale, t.y - 90 * t.scale, 80 * t.scale, 102 * t.scale)) return;
    rect(t.x - 6, t.y - 37, 12, 46, '#3e363a'); rect(t.x - 2, t.y - 30, 4, 39, '#625349');
    for (let i = 0; i < 4; i++) {
      const w = (70 - i * 11) * t.scale;
      rect(t.x - w / 2, t.y - (47 + i * 14) * t.scale, w, 24 * t.scale, ['#253533', '#30403b', '#354940', '#425247'][i]);
    }
  }
  function drawPyre(p) {
    shadow(p.x, p.y, 46);
    if (!imageAsset('pyre', p.x - 26, p.y - 57, 52, 70)) {
      rect(p.x - 3, p.y - 53, 6, 52, '#64524e'); rect(p.x - 17, p.y - 40, 34, 5, '#514442');
      rect(p.x - 25, p.y - 4, 51, 6, '#53423b'); rect(p.x - 20, p.y + 3, 40, 5, '#78604b');
      rect(p.x - 9, p.y - 24, 18, 23, '#824b53'); rect(p.x - 5, p.y - 14, 10, 17, '#dd9471');
    }
    const pulse = Math.sin(clock * 2.8 + p.x) * 3;
    ctx.fillStyle = '#dba97316'; ctx.beginPath(); ctx.arc(p.x, p.y - 15, 50 + pulse, 0, Math.PI * 2); ctx.fill();
    if (distance(player, p) < 132) {
      ctx.globalAlpha = 0.65 + Math.sin(clock * 2) * 0.12;
      if (!imageAsset('ghost', p.x + 15, p.y - 68 + pulse, 35, 48)) {
        rect(p.x + 23, p.y - 55 + pulse, 14, 13, '#acb6d1'); rect(p.x + 17, p.y - 42 + pulse, 26, 23, '#8e91b3');
        rect(p.x + 22, p.y - 21 + pulse, 5, 9, '#8e91b3'); rect(p.x + 33, p.y - 21 + pulse, 5, 7, '#8e91b3');
      }
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < 4; i++) {
      const y = p.y - 10 - ((clock * 20 + i * 13) % 47), x = p.x + Math.sin(clock * 2 + i) * 12;
      rect(x, y, 2, 3, '#e6b586');
    }
  }
  function drawChest(chest) {
    const opened = progress.spells.includes(chest.spell);
    shadow(chest.x, chest.y, 29);
    if (!imageAsset('chest', chest.x - 20, chest.y - 25, 40, 34)) {
      rect(chest.x - 17, chest.y - 19, 34, 24, '#654d47'); rect(chest.x - 15, chest.y - 22, 30, 8, '#8f7460');
      rect(chest.x - 10, chest.y - 22, 3, 27, '#bc9a66'); rect(chest.x + 7, chest.y - 22, 3, 27, '#bc9a66');
      rect(chest.x - 2, chest.y - 10, 4, 6, '#dac69b');
    }
    if (opened) { ctx.fillStyle = '#171c2766'; ctx.fillRect(chest.x - 19, chest.y - 27, 39, 34); }
    else {
      rect(chest.x - 2, chest.y - 42 + Math.sin(clock * 3) * 3, 4, 4, '#e6c68e');
      ctx.strokeStyle = '#dfbb8e44'; ctx.strokeRect(chest.x - 23, chest.y - 28, 46, 38);
    }
  }
  function drawHumanoid(x, y, color, hat, facing = 1) {
    shadow(x, y, 27);
    rect(x - 10, y - 25, 20, 22, color); rect(x - 12, y - 11, 24, 9, color);
    rect(x - 7, y - 36, 14, 13, '#b9a29a'); rect(x - 7, y - 38, 14, 5, '#403540');
    rect(x - 8, y - 2, 5, 7, '#252733'); rect(x + 3, y - 2, 5, 7, '#252733');
    rect(x + (facing < 0 ? -7 : 4), y - 32, 3, 2, '#252731');
    if (hat) {
      rect(x - 17, y - 37, 34, 5, '#bda0d1'); rect(x - 10, y - 47, 20, 10, '#715883');
      rect(x - 7, y - 55, 14, 9, '#715883'); rect(x - 4, y - 60, 8, 5, '#9c78ab');
    }
  }
  function drawEnemy(e) {
    if (!e.alive) return;
    shadow(e.x, e.y, e.boss ? 49 : 29);
    ctx.globalAlpha = e.flash > 0 ? 0.6 : 1;
    const size = e.type === 'demon' ? [78, 82] : e.type === 'inquisitor' ? [66, 80] : [43, 53];
    const name = e.type === 'shade' ? 'demon' : e.type === 'hunter' ? 'guard' : e.type;
    if (!imageAsset(name, e.x - size[0] / 2, e.y - size[1] + 11, size[0], size[1], e.facing < 0)) {
      if (e.type === 'demon' || e.type === 'shade') {
        const scale = e.type === 'demon' ? 1.6 : 0.9;
        rect(e.x - 16 * scale, e.y - 33 * scale, 32 * scale, 29 * scale, '#593d5f');
        rect(e.x - 10 * scale, e.y - 48 * scale, 20 * scale, 19 * scale, '#765375');
        rect(e.x - 16 * scale, e.y - 58 * scale, 6 * scale, 20 * scale, '#bca394');
        rect(e.x + 10 * scale, e.y - 58 * scale, 6 * scale, 20 * scale, '#bca394');
        rect(e.x - 6 * scale, e.y - 42 * scale, 4 * scale, 3 * scale, '#efaea0');
        rect(e.x + 3 * scale, e.y - 42 * scale, 4 * scale, 3 * scale, '#efaea0');
      } else {
        drawHumanoid(e.x, e.y, e.type === 'inquisitor' ? '#795764' : e.type === 'hunter' ? '#5e645b' : '#77717b', false, e.facing);
        rect(e.x + 17, e.y - 48, 4, 52, '#bdad9f'); rect(e.x + 12, e.y - 19, 15, 4, '#b6a39c');
        if (e.type === 'inquisitor') { rect(e.x - 16, e.y - 33, 32, 36, '#79616b'); rect(e.x - 3, e.y - 53, 7, 15, '#d2c1b5'); }
      }
    }
    ctx.globalAlpha = 1;
    if (!e.boss && e.hp < e.maxHp) {
      rect(e.x - 18, e.y - size[1] - 1, 36, 3, '#20232b'); rect(e.x - 18, e.y - size[1] - 1, 36 * e.hp / e.maxHp, 3, '#b37784');
    }
    if (e.stun > 0) { ctx.fillStyle = '#edddc8'; ctx.font = 'bold 15px monospace'; ctx.fillText('✦', e.x - 6, e.y - size[1] - 5); }
  }
  function drawPlayer() {
    if (!player) return;
    const bob = player.moving ? Math.sin(clock * 14) * 2 : Math.sin(clock * 3) * 0.6;
    shadow(player.x, player.y, 30);
    if (player.invulnerable > 0 && Math.floor(clock * 30) % 2 === 0) ctx.globalAlpha = 0.5;
    if (player.flash > 0) ctx.globalAlpha = 0.45;
    const frame = player.moving && player.dodgeTime <= 0 ? walkFrames[Math.floor(clock * 10) % walkFrames.length] : null;
    if (frame && frame.complete && frame.naturalWidth) {
      ctx.save();
      if (player.facingX < 0) { ctx.translate(Math.round(player.x + 25), Math.round(player.y - 57)); ctx.scale(-1, 1); ctx.drawImage(frame, 0, 0, 50, 64); }
      else ctx.drawImage(frame, Math.round(player.x - 25), Math.round(player.y - 57), 50, 64);
      ctx.restore();
    } else if (!imageAsset('witch', player.x - 25, player.y - 57 + bob, 50, 64, player.facingX < 0))
      drawHumanoid(player.x, player.y + bob, '#715886', true, player.facingX < 0 ? -1 : 1);
    ctx.globalAlpha = 1;
    if (shieldHeld) {
      ctx.strokeStyle = shieldAge <= 0.23 ? '#eee5ff' : '#b99ae4'; ctx.lineWidth = shieldAge <= 0.23 ? 4 : 2;
      ctx.fillStyle = '#b99ae41b'; ctx.beginPath(); ctx.arc(player.x, player.y - 17, 35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (charge > 0) {
      ctx.strokeStyle = '#dac0ff'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.arc(player.x, player.y - 16, 29, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge / 1.2); ctx.stroke();
      rect(player.x + player.facingX * 25 - 3, player.y - 16 + player.facingY * 25, 6 + charge * 6, 6 + charge * 6, '#dfc5fc');
    }
  }
  function drawStructures() {
    // Cemetery wall and broken boundary, with an entrance aligned to the east road.
    for (const c of FIXED_COLLIDERS.filter(c => c.wall)) {
      rect(c.x, c.y - 12, c.w, c.h + 12, '#4d4f57');
      rect(c.x, c.y - 12, c.w, 4, '#74717b');
      for (let x = c.x + 5; x < c.x + c.w - 2; x += 20) rect(x, c.y - 3, 2, 5, '#333a43');
    }
    GRAVES.forEach(grave => {
      rect(grave.x - 13, grave.y - 25, 26, 34, '#53545c'); rect(grave.x - 9, grave.y - 29, 18, 7, '#74707a');
      rect(grave.x - 1, grave.y - 18, 3, 18, '#aaa2a1'); rect(grave.x - 6, grave.y - 13, 13, 3, '#aaa2a1');
      rect(grave.x - 15, grave.y + 11, 30, 17, '#36373d');
    });
    rect(532, 621, 42, 42, '#33303a'); rect(534, 618, 40, 10, '#807178'); rect(534, 652, 40, 10, '#685960');
    rect(535, 628, 8, 23, '#7a6a70'); rect(565, 628, 8, 23, '#7a6a70'); rect(543, 630, 21, 19, '#141b27');
    if (progress.suspicion < 70) {
      rect(GATE.x - 2, GATE.y, 31, GATE.h, '#34363e');
      for (let y = GATE.y; y < GATE.y + GATE.h; y += 13) rect(GATE.x + 3, y, 21, 5, '#8f7880');
      rect(GATE.x + 8, GATE.y + 40, 7, 23, '#c9b898');
    } else { rect(GATE.x - 3, GATE.y, 35, 10, '#7c717d'); rect(GATE.x - 3, GATE.y + GATE.h - 10, 35, 10, '#7c717d'); }
    // Wanted posters appear only after the reversal.
    if (progress.demonDefeated) for (const [x, y] of [[426, 775], [895, 736], [916, 629]]) {
      rect(x, y, 6, 33, '#64524a'); rect(x - 9, y - 19, 24, 29, '#ad957d');
      rect(x - 5, y - 15, 16, 4, '#5b4750'); rect(x, y - 7, 8, 10, '#695062'); rect(x - 5, y + 5, 16, 2, '#725956');
    }
    for (const [x, y] of [[420, 612], [897, 846], [1238, 340], [1238, 456]]) {
      rect(x, y - 24, 4, 28, '#6d5652'); rect(x - 2, y - 34, 8, 13, '#b67b64'); rect(x, y - 31, 4, 8, '#e4b279');
      ctx.fillStyle = '#b87e5912'; ctx.beginPath(); ctx.arc(x + 2, y - 27, 37, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawTelegraphs() {
    for (const e of enemies) {
      if (!e.alive || e.state !== 'windup') continue;
      const t = 1 - e.timer / e.windup;
      ctx.strokeStyle = e.unparryable ? '#ffb17c' : '#e7a0ae'; ctx.fillStyle = e.unparryable ? '#ee96522a' : '#bb688522'; ctx.lineWidth = 2;
      const x = e.unparryable ? e.targetX : e.x, y = e.unparryable ? e.targetY : e.y;
      const radius = e.unparryable ? 78 : e.type === 'hunter' ? 24 : e.range + 12;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t); ctx.stroke();
      if (e.type === 'hunter') { ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.targetX, e.targetY); ctx.stroke(); }
      ctx.fillStyle = e.unparryable ? '#ffc08c' : '#edb9c3'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      ctx.fillText(e.unparryable ? 'ESQUIVE' : 'PARRY / ESQUIVE', x, y - radius - 10); ctx.textAlign = 'left';
    }
  }
  function drawMiniMap() {
    if (view.w < 500) return;
    const w = 156, h = 107, x = view.w - w - 16, y = view.h - h - 16;
    ctx.save(); ctx.globalAlpha = 0.86; rect(x - 5, y - 5, w + 10, h + 10, '#111722');
    ctx.drawImage(ground, x, y, w, h); ctx.globalAlpha = 1;
    const sx = w / WORLD.width, sy = h / WORLD.height;
    HOUSES.forEach(house => rect(x + house.x * sx, y + house.y * sy, house.w * sx, house.h * sy, '#777078'));
    PYRES.forEach(p => rect(x + p.x * sx - 2, y + p.y * sy - 2, 4, 4, '#ebb887'));
    if (progress.lostAshes) rect(x + progress.lostAshes.x * sx - 2, y + progress.lostAshes.y * sy - 2, 4, 4, '#f6d6a0');
    rect(x + player.x * sx - 2, y + player.y * sy - 2, 5, 5, '#ead5ff');
    ctx.strokeStyle = '#6f626f'; ctx.lineWidth = 1; ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
    ctx.font = '10px monospace'; ctx.fillStyle = '#c7bacb'; ctx.fillText('N ↑', x + w - 23, y + 12); ctx.restore();
  }
  function render() {
    if (!player) return;
    ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, view.w, view.h);
    ctx.save(); ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    ctx.drawImage(ground, 0, 0); drawStructures(); drawTelegraphs();
    const objects = [];
    HOUSES.forEach(h => objects.push({ y: h.y + h.h, draw: () => drawHouse(h) }));
    TREES.forEach(t => objects.push({ y: t.y + 6, draw: () => drawTree(t) }));
    PYRES.forEach(p => objects.push({ y: p.y + 10, draw: () => drawPyre(p) }));
    CHESTS.forEach(c => objects.push({ y: c.y + 5, draw: () => drawChest(c) }));
    NPCS.forEach(n => objects.push({ y: n.y + 4, draw: () => drawHumanoid(n.x, n.y, progress.demonDefeated ? '#765c5e' : '#a28b79', false, -1) }));
    enemies.forEach(e => { if (e.alive) objects.push({ y: e.y + 4, draw: () => drawEnemy(e) }); });
    objects.push({ y: player.y + 4, draw: drawPlayer });
    objects.sort((a, b) => a.y - b.y).forEach(o => o.draw());
    if (progress.lostAshes) {
      const a = progress.lostAshes; ctx.fillStyle = '#ead1a633'; ctx.beginPath(); ctx.arc(a.x, a.y, 26, 0, Math.PI * 2); ctx.fill();
      rect(a.x - 4, a.y - 12 + Math.sin(clock * 3) * 3, 8, 13, '#e8c99b'); rect(a.x - 1, a.y - 20, 3, 5, '#fff0cb');
    }
    effects.forEach(e => {
      ctx.globalAlpha = e.life / e.maxLife; ctx.strokeStyle = e.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(e.x, e.y - 8, e.radius * (1 - e.life / e.maxLife * 0.7), 0, Math.PI * 2); ctx.stroke();
    }); ctx.globalAlpha = 1;
    for (const p of projectiles) {
      rect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2, p.color);
      rect(p.x - p.radius / 2, p.y - p.radius / 2, p.radius, p.radius, '#f0e8ff');
    }
    for (const p of particles) { ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1); rect(p.x, p.y, 3, 3, p.color); }
    ctx.globalAlpha = 1;
    // Thin moving fog strips; no opaque darkness over combat or telegraphs.
    ctx.fillStyle = '#b5b7ce07';
    for (let i = 0; i < 7; i++) ctx.fillRect(((clock * 8 + i * 271) % 1860) - 200, 140 + i * 146, 220, 15);
    ctx.restore();
    const vignette = ctx.createRadialGradient(view.w / 2, view.h / 2, 155, view.w / 2, view.h / 2, view.w * 0.66);
    vignette.addColorStop(0, '#10131d00'); vignette.addColorStop(1, '#10131d73'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, view.w, view.h);
    drawMiniMap();
    if (player.hp < 28 && active) { ctx.strokeStyle = '#b6687860'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, view.w - 8, view.h - 8); }
    if (!active) {
      ctx.fillStyle = '#10121c55'; ctx.fillRect(0, 0, view.w, view.h);
    }
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    view.w = bounds.width && bounds.height ? clamp(Math.round(view.h * bounds.width / bounds.height), 220, 1400) : 960;
    canvas.width = view.w; canvas.height = view.h; ctx.imageSmoothingEnabled = false;
    if (player) { camera.x = clamp(player.x - view.w / 2, 0, WORLD.width - view.w); camera.y = clamp(player.y - view.h / 2, 0, WORLD.height - view.h); }
  }
  window.addEventListener('resize', resize);
  const KEY_CONTROLS = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyJ: 'attack' };
  function control(name, pressed) {
    if (!active || dialogOpen || dead) return;
    if (['up', 'down', 'left', 'right', 'attack'].includes(name)) {
      if (pressed) controls.add(name); else controls.delete(name);
    } else if (name === 'shield') shield(pressed);
    else if (name === 'charge') {
      if (pressed && !shieldHeld) chargeHeld = true;
      else if (!pressed && chargeHeld) { const amount = charge; chargeHeld = false; charge = 0; if (amount > 0.08) cast('charged', amount / 1.2); }
    } else if (pressed) {
      if (name === 'dodge') dodge();
      if (name === 'interact') interact();
      if (/^spell[1-4]$/.test(name)) cast(name);
    }
  }
  window.addEventListener('keydown', event => {
    if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (event.code === 'Escape') {
      if (dialogOpen && !dead) closeDialog();
      else if (active && !dead) showDialog('Respirar entre as cinzas', 'O mundo aguarda.\n\nJ / clique: ataque rápido · K: ataque carregado\nQ / botão direito: escudo e parry · Espaço: esquiva\n1–4: memórias aprendidas · E: interação', [{ label: 'Continuar', run: closeDialog }, { label: 'Voltar ao início', run: () => { persist(); closeDialog(); active = false; hidden('title-screen', false); hidden('hud', true); } }]);
      return;
    }
    const name = KEY_CONTROLS[event.code] || ({ KeyQ: 'shield', KeyK: 'charge', Space: 'dodge', KeyE: 'interact', Digit1: 'spell1', Digit2: 'spell2', Digit3: 'spell3', Digit4: 'spell4' })[event.code];
    if (name && active) { event.preventDefault(); if (!event.repeat || KEY_CONTROLS[event.code]) control(name, true); }
  });
  window.addEventListener('keyup', event => {
    const name = KEY_CONTROLS[event.code] || ({ KeyQ: 'shield', KeyK: 'charge' })[event.code];
    if (name) { controls.delete(name); control(name, false); }
  });
  function releaseControls() { controls.clear(); mouseDown = false; shieldHeld = false; chargeHeld = false; charge = 0; }
  window.addEventListener('blur', releaseControls);
  document.addEventListener('visibilitychange', releaseControls);
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const bounds = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / bounds.width * view.w;
    pointer.y = (event.clientY - bounds.top) / bounds.height * view.h; mouseAim = true;
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') return;
    if (!active || dialogOpen || dead) return;
    canvas.focus(); event.preventDefault();
    const bounds = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / bounds.width * view.w;
    pointer.y = (event.clientY - bounds.top) / bounds.height * view.h; mouseAim = true;
    if (event.button === 0) { mouseDown = true; cast('quick'); }
    if (event.button === 2) shield(true);
  });
  window.addEventListener('pointerup', event => { if (event.button === 0) mouseDown = false; if (event.button === 2) shield(false); });
  for (const button of document.querySelectorAll('[data-control]')) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      if (event.pointerType === 'touch') mouseAim = false;
      control(button.dataset.control, true); button.classList.add('pressed');
    });
    const release = event => { event.preventDefault(); control(button.dataset.control, false); button.classList.remove('pressed'); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release);
  }
  if ($('play-btn')) $('play-btn').addEventListener('click', () => start(false));
  if ($('continue-btn')) $('continue-btn').addEventListener('click', () => start(true));
  if ($('reset-btn')) $('reset-btn').addEventListener('click', () => showDialog('Recomeçar a história?', 'O progresso salvo, as magias e as cinzas desta partida serão apagados.', [{ label: 'Apagar e recomeçar', run: () => { reset(); start(false); } }, { label: 'Manter minha partida', run: closeDialog }]));
  canvas.tabIndex = 0;
  resize(); spawnPlayer(); hidden('hud', true); hidden('continue-btn', !saved); hidden('reset-btn', !saved); hidden('dialog', true); hidden('boss-panel', true); updateHUD(); render();
  let lastFrame = performance.now();
  function frame(now) { const dt = (now - lastFrame) / 1000; lastFrame = now; tick(dt); render(); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);

  const debug = String(location.hash || '').includes('debug') ? Object.freeze({
    teleport(x, y) {
      player.x = clamp(Number(x), 25, WORLD.width - 25); player.y = clamp(Number(y), 25, WORLD.height - 25);
      camera.x = clamp(player.x - view.w / 2, 0, WORLD.width - view.w);
      camera.y = clamp(player.y - view.h / 2, 0, WORLD.height - view.h);
      updateHUD();
    },
    aim(x, y) { pointer.x = x - camera.x; pointer.y = y - camera.y; mouseAim = true; },
    hit(id, amount) { const enemy = enemies.find(e => e.id === id); if (enemy) damageEnemy(enemy, Number(amount)); },
    hurt(amount, unparryable = false) { damagePlayer(Number(amount), null, unparryable); },
    setResources(resources) { ['hp', 'mp', 'stamina'].forEach(key => { if (Number.isFinite(resources[key])) player[key] = clamp(resources[key], 0, 100); }); updateHUD(); },
    enemyAttack(id, unparryable = false) { const enemy = enemies.find(e => e.id === id); if (enemy) damagePlayer(enemy.damage, enemy, unparryable); }
  }) : undefined;
  window.WitchGame = Object.freeze({
    start, reset, tick, interact, cast, dodge, shield, setControl: control, closeDialog,
    debug,
    getState: () => ({ active, paused: dialogOpen, dead, clock, world: { ...WORLD }, view: { ...view },
      player: { ...player }, progress: JSON.parse(JSON.stringify(progress)),
      checkpoint: progress.checkpoint, gateOpen: progress.suspicion >= 70,
      objective: objective(), interaction: nearestInteraction()?.type || null,
      enemies: enemies.map(e => ({ id: e.id, type: e.type, x: e.x, y: e.y, hp: e.hp, alive: e.alive, state: e.state, stun: e.stun })),
      projectiles: projectiles.map(p => ({ x: p.x, y: p.y, kind: p.kind, enemy: p.enemy })),
      spells: SPELLS.map((s, index) => ({ ...s, learned: progress.spells.includes(index) })),
      landmarks: { pyres: PYRES.map(p => ({ id: p.id, x: p.x, y: p.y })), chests: CHESTS.map(c => ({ ...c })) },
      assets: Object.fromEntries(Object.entries(assets).map(([name, img]) => [name, Boolean(img.complete && img.naturalWidth)])) })
  });
})();
