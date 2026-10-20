// Iso RPG — o Guerreiro da Masmorra com a câmera isométrica do Fury Hauler.
// POR QUE: as regras são as do protótipo prototipos/guerreiro-da-masmorra/ (Parte 1 do
// GuerreiroDaMasmorra.md): fila de iniciativa, reações (parry/salto/lateral) com golpes nomeados,
// Fúria e os 4 especiais, exaustão, cansaço dos monstros, Fase 2 e escudo do chefe, 3 ondas,
// acampamento, Tochas, Almas e Mapas. O que muda é o palco: a luta acontece num corredor de
// masmorra isométrico (2:1), e o herói anda de sala em sala entre as ondas.
// ESTRATÉGIA: como no Fury Hauler, toda a lógica fica no "chão" (gx, gy em tiles) e só o desenho
// converte para a tela. O mundo é desenhado num canvas de baixa resolução (1 px de arte) e ampliado
// 3× sem suavização; textos e barras são desenhados por cima, já na resolução da tela, para ficarem
// nítidos. Arte PixelLab em Sprites/IsoRpg/ (tamanhos e âncoras em sprites.js).
'use strict';

const ART = '../../Sprites/IsoRpg/';
const SPR = window.IR_SPRITES || { chars: {}, tiles: {}, decor: {} };
const SAVE_KEY = 'isorpg-save-v1';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
// #auto: piloto automático (para testar e gerar a miniatura do hub): ataca na sua vez e reage certo.
const AUTO = DEV.has('auto');
const TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
// Versão em pé (prototipos/iso-rpg-vertical/): a mesma lógica, com tela lógica de 720 px de largura e
// altura entre 1280 e 1600. Só mudam o enquadramento da câmera, o círculo de reação e o tamanho da tela;
// o resto da diferença é o style.css daquela pasta.
const PORTRAIT = !!window.IR_PORTRAIT;

// ============================================================ dados (§3, §8, §9, §10)

const HERO = { hp: 60, atk: 10, def: 3, speed: 10 };
const ATTRS = [
  { id: 'hp',  name: 'Vida',       base: 50, desc: '+20 HP' },
  { id: 'atk', name: 'Ataque',     base: 60, desc: '+3 ATK' },
  { id: 'def', name: 'Defesa',     base: 60, desc: '+2 DEF' },
];
const attrCost = (a, n) => Math.round(a.base * Math.pow(1.55, n));
const COLORS = [ // o Azul é o próprio herói; as 4 cores do Cavaleiro têm folha recolorida
  { id: 'red', name: 'Vermelha', knight: 'Cavaleiro Vermelho' }, { id: 'black', name: 'Negra', knight: 'Cavaleiro Negro' },
  { id: 'purple', name: 'Púrpura', knight: 'Cavaleiro Púrpura' }, { id: 'yellow', name: 'Dourada', knight: 'Cavaleiro Dourado' },
];
// Biomas (diferente do Guerreiro, onde o bioma é sorteado e só decorativo): 42 masmorras, 7 por
// bioma, numa ordem fixa de dificuldade. A 7ª de cada bioma termina no chefe do bioma; as outras, no
// Cavaleiro. Cada bioma tem piso/parede (tiles/<tiles>/), objetos de cenário por papel (o mesmo lugar
// no corredor), monstros comuns, chefe, a cor do escuro e partículas no ar (fall). Bioma cujos tiles
// não carregaram usa a arte e o elenco da Masmorra dos Orcs, mas mostra o próprio nome.
const LEVELS = 42, PER_BIOME = 7;
const BIOMES = [
  { id: 'orcs', name: 'Masmorra dos Orcs', ready: true, tiles: 'orcs', pool: ['pawn', 'archer', 'orc', 'shaman'], boss: 'warlord',
    decor: { campfire: 'campfire', crates: 'crates', barrel: 'barrel', bones: 'bones', pillar: 'pillar', chest: 'chest' }, dark: '6,4,14', fall: null },
  { id: 'forest', name: 'Floresta Amaldiçoada', ready: true, tiles: 'forest', pool: ['thief', 'scarecrow', 'dryad'], boss: 'tree',
    decor: { campfire: 'campfire', crates: 'forest-stump', barrel: 'forest-mushrooms', bones: 'bones', pillar: 'forest-deadtree', chest: 'chest' }, dark: '4,14,10',
    fall: { colors: ['#7a8f3a', '#9c6b2f', '#5d7a2c'], vy: 9, vx: -8, rate: 0.12, size: 2 },   // folhas secas caindo
    // Terra com folhas e raízes quase sempre; trilha de pedra e cogumelos de vez em quando (os de névoa ficam de fora).
    floorPick: [0, 1, 2, 3, 0, 1, 4, 5, 6, 7, 4, 5, 12, 13, 8, 9], wallPick: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7] },
  { id: 'swamp', name: 'Pântano', ready: true, tiles: 'swamp', pool: ['frogman', 'zombie', 'witch'], boss: 'frogking',
    decor: { campfire: 'swamp-cauldron', crates: 'swamp-reeds', barrel: 'swamp-log', bones: 'bones', pillar: 'swamp-totem', chest: 'chest' }, dark: '8,16,6',
    fall: { colors: ['#c8f26a', '#9be05a'], vy: -6, vx: 3, rate: 0.09, size: 1 },     // vaga-lumes subindo
    // Lama e musgo quase sempre; poças, tábuas, cogumelos e vitórias-régias de vez em quando (sem os tijolos verdes).
    floorPick: [0, 1, 0, 1, 2, 3, 2, 3, 4, 5, 6, 10, 11, 13, 14, 15, 7, 8], wallPick: [0, 1, 2, 3, 0, 1, 2, 3, 12, 13, 14, 15] },
  { id: 'ice', name: 'Montanha de Gelo', ready: true, tiles: 'ice', pool: ['yeti', 'wolf', 'spirit'], boss: 'giant',
    decor: { campfire: 'ice-brazier', crates: 'ice-crates', barrel: 'ice-crystals', bones: 'ice-skeleton', pillar: 'ice-pillar', chest: 'chest' }, dark: '6,14,34',
    fall: { colors: ['rgba(235,245,255,0.85)', 'rgba(200,220,245,0.55)'], vy: 20, vx: -9, rate: 0.03, size: 2 },   // neve
    // Sorteio com peso (índice repetido = mais comum): pedra com neve quase sempre, gelo liso e neve fofa de vez em quando.
    floorPick: [1, 1, 5, 5, 6, 7, 7, 8, 12, 12, 13, 14, 15, 15, 3, 11, 0, 9], wallPick: [0, 1, 2, 3, 0, 1, 2, 3, 12, 13, 14, 15, 5] },
  { id: 'volcano', name: 'Vulcão', ready: true, tiles: 'volcano', pool: ['firegob', 'salamander', 'golem'], boss: 'demon',
    decor: { campfire: 'volcano-lavapool', crates: 'volcano-rocks', barrel: 'volcano-crystal', bones: 'volcano-skull', pillar: 'volcano-pillar', chest: 'chest' }, dark: '22,6,4',
    fall: { colors: ['#ffb347', '#ff7a2e', '#ffd36b'], vy: -22, vx: 4, rate: 0.05, size: 1 },  // brasas subindo
    // Basalto e obsidiana escuros quase sempre (rachaduras acesas demais brigam com os monstros); poça de lava rara. Paredes sem os blocos de tocha (o jogo põe a tocha).
    floorPick: [2, 3, 4, 5, 2, 3, 4, 5, 12, 13, 14, 15, 2, 3, 0, 1, 8, 6], wallPick: [0, 1, 2, 3, 4, 5, 6, 7, 4, 5, 6, 7, 12, 13] },
  { id: 'academy', name: 'Academia de Magia', ready: true, tiles: 'academy', pool: ['apprentice', 'gargoyle', 'armor'], boss: 'archmage',
    decor: { campfire: 'academy-brazier', crates: 'academy-bookshelf', barrel: 'academy-books', bones: 'academy-orb', pillar: 'academy-pillar', chest: 'chest' }, dark: '12,6,26',
    fall: { colors: ['#c9a8ff', '#8fe3ff', '#ffffff'], vy: -5, vx: 0, rate: 0.08, size: 1, twinkle: 1 },  // faíscas mágicas
    // Mármore escuro com runas de vez em quando (sem os tapetes, que não emendam). Parede de pedra cinza com
    // estandartes e estantes (sem os blocos claros com janela, que destoam).
    floorPick: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 8, 14, 12], wallPick: [12, 13, 14, 15, 4, 5, 6, 7, 12, 13] },
];
// Masmorra 0, de treinamento: gosmas fracas e a Gosma Rainha no cenário da Masmorra dos Orcs. Ondas fixas
// (1 gosma, 2 gosmas, só a rainha) e a Alma que a rainha solta é o prêmio. Fica fora da contagem das 42.
const TRAINING = { id: 'training', name: 'Masmorra de Treinamento', ready: true, tiles: 'orcs', pool: ['slime', 'slime2'], boss: 'slimeking',
  decor: { campfire: 'campfire', crates: 'crates', barrel: 'barrel', bones: 'bones', pillar: 'pillar', chest: 'chest' }, dark: '10,8,22', fall: null };
const biomeOf = level => (level < 1 ? TRAINING : BIOMES[Math.min(BIOMES.length - 1, Math.floor((level - 1) / PER_BIOME))]);
const artOf = b => (b.ready && SPR.tiles[b.tiles] ? b : BIOMES[0]);   // de onde vêm tiles, cenário e elenco

// Golpes nomeados (§8.3): P = parry (toque), J = salto (↑), S = lateral (↔); número = m; a/d = curva.
const parseMove = s => s.split(' ').map(t => { const m = /^([PJS])(\d*\.?\d+)?([ad])?$/.exec(t); return { type: m[1], m: m[2] ? parseFloat(m[2]) : 1, curve: m[3] || '' }; });
const MONSTERS = {
  pawn:   { name: 'Servo',    hp: 30, atk: 9,  def: 2, speed: 12, ranged: false, art: 'pawn',
    moves: [['Facada do Servo', 'P', 1], ['Corte Apressado', 'P.75', 1], ['Dança das Facas', 'P1.2 P.7a', 3]] },
  archer: { name: 'Arqueiro', hp: 24, atk: 12, def: 1, speed: 9,  ranged: true,  art: 'archer',
    moves: [['Flecha Certeira', 'P', 1], ['Tiro Traiçoeiro', 'P1.35a', 1], ['Chuva de Flechas', 'P.8 P.8', 3]] },
  boss:   { name: 'Cavaleiro', hp: 160, atk: 20, def: 6, speed: 6, ranged: false, boss: true, art: 'boss', shield: 'Escudo Arcano',
    moves: [['Julgamento do Cavaleiro', 'P J.9 P.7', 1], ['Lâmina Paciente', 'P1.5a P.65', 1], ['Tempestade de Aço', 'J.85 P.8 P1.2d', 1]] },
  // Montanha de Gelo. Números no mesmo patamar do Servo/Arqueiro: a escala por nível faz o resto.
  yeti:   { name: 'Yeti', hp: 40, atk: 11, def: 3, speed: 8, ranged: false, art: 'yeti',
    moves: [['Soco Glacial', 'P1.2', 1], ['Pisão do Yeti', 'J', 1], ['Avalanche', 'P1.3a J.8', 3]] },
  wolf:   { name: 'Lobo de Gelo', hp: 26, atk: 10, def: 1, speed: 15, ranged: false, art: 'wolf',
    moves: [['Mordida', 'P.7', 1], ['Bote', 'S', 1], ['Matilha', 'P.8 P.6a S', 3]] },
  spirit: { name: 'Espírito do Gelo', hp: 22, atk: 13, def: 1, speed: 11, ranged: true, shot: 'ice', art: 'spirit',
    moves: [['Sopro Gélido', 'P', 1], ['Lança de Gelo', 'S1.2', 1], ['Nevasca', 'P.8 J.8 P.8', 3]] },
  giant:  { name: 'Gigante de Gelo', hp: 210, atk: 22, def: 7, speed: 5, ranged: false, boss: true, art: 'giant', shield: 'Armadura de Gelo',
    moves: [['Martelo Glacial', 'J P1.4a', 1], ['Tremor', 'J.9 J.8', 1], ['Fúria do Inverno', 'P S.9 P1.2d J.8', 1]] },
  // Treinamento: fracos de propósito, e cada um ensina uma reação (toque, salto, lateral).
  slime:      { name: 'Gosma Verde', hp: 16, atk: 5, def: 0, speed: 8, art: 'slime', melt: true,
    moves: [['Esguicho', 'P', 1], ['Pulo da Gosma', 'J', 1]] },
  slime2:     { name: 'Gosma Azul', hp: 18, atk: 6, def: 0, speed: 9, art: 'slime2', melt: true,
    moves: [['Rolada', 'S', 1], ['Esguicho Azul', 'P', 1]] },
  slimeking:  { name: 'Gosma Rainha', hp: 70, atk: 8, def: 1, speed: 6, boss: true, art: 'slimeking', melt: true,
    moves: [['Esmagada Real', 'P', 1], ['Salto Real', 'J', 1], ['Onda de Gosma', 'P S', 1]] },
  // Masmorra dos Orcs (junto com o Servo e o Arqueiro).
  orc:        { name: 'Orc Brutamontes', hp: 38, atk: 12, def: 3, speed: 9, art: 'orc',
    moves: [['Machadada', 'P1.1', 1], ['Investida Orc', 'S', 1], ['Fúria Orc', 'P.8 P.8 P1.2a', 3]] },
  shaman:     { name: 'Xamã Orc', hp: 24, atk: 13, def: 1, speed: 10, ranged: true, shot: 'poison', art: 'shaman',
    moves: [['Raio Verde', 'P', 1], ['Maldição', 'J', 1], ['Chuva de Ossos', 'P.8 S P.8', 3]] },
  warlord:    { name: 'Senhor da Guerra Orc', hp: 230, atk: 23, def: 8, speed: 6, boss: true, shield: 'Grito de Guerra', art: 'warlord',
    moves: [['Cutelo Selvagem', 'P1.3a', 1], ['Golpe Duplo', 'P.8 P.7', 1], ['Massacre', 'J P.8 S P1.2d', 1]] },
  // Floresta Amaldiçoada.
  thief:      { name: 'Bandido', hp: 26, atk: 11, def: 1, speed: 14, art: 'thief',
    moves: [['Punhalada', 'P.7', 1], ['Rasteira', 'J', 1], ['Dança das Lâminas', 'P.7 P.6 S', 3]] },
  scarecrow:  { name: 'Espantalho', hp: 34, atk: 12, def: 2, speed: 7, art: 'scarecrow',
    moves: [['Ceifada', 'S1.2', 1], ['Foice Lenta', 'P1.4a', 1], ['Colheita', 'S P.9 J', 3]] },
  dryad:      { name: 'Dríade Sombria', hp: 22, atk: 13, def: 1, speed: 11, ranged: true, shot: 'thorn', art: 'dryad',
    moves: [['Espinho', 'P', 1], ['Raízes', 'J', 1], ['Chuva de Espinhos', 'P.8 P.8 S', 3]] },
  tree:       { name: 'Árvore Anciã', hp: 240, atk: 21, def: 9, speed: 4, boss: true, shield: 'Casca de Ferro', art: 'tree',
    moves: [['Galhada', 'P1.2', 1], ['Raízes Profundas', 'J J.8', 1], ['Fúria da Floresta', 'S P.9 J P1.3a', 1]] },
  // Pântano.
  frogman:    { name: 'Homem-Sapo', hp: 30, atk: 11, def: 2, speed: 12, art: 'frogman',
    moves: [['Lança de Osso', 'P', 1], ['Salto do Sapo', 'S', 1], ['Língua Certeira', 'P.6 P1.2a', 3]] },
  zombie:     { name: 'Zumbi do Pântano', hp: 44, atk: 12, def: 2, speed: 5, art: 'zombie',
    moves: [['Agarrão', 'P1.3', 1], ['Mordida Podre', 'P1.1a', 1], ['Abraço do Pântano', 'P1.2 P1.2', 3]] },
  witch:      { name: 'Bruxa do Pântano', hp: 22, atk: 14, def: 1, speed: 10, ranged: true, shot: 'poison', art: 'witch',
    moves: [['Gota Venenosa', 'P', 1], ['Bolha Ácida', 'J', 1], ['Caldeirão Fervente', 'P.8 J.8 P.8', 3]] },
  frogking:   { name: 'Rei Sapo', hp: 250, atk: 22, def: 7, speed: 6, boss: true, shield: 'Muco Protetor', art: 'frogking',
    moves: [['Barrigada', 'J', 1], ['Língua Real', 'P1.3a', 1], ['Coaxar Real', 'P.8 S P.8 J', 1]] },
  // Vulcão.
  firegob:    { name: 'Goblin de Fogo', hp: 24, atk: 14, def: 1, speed: 12, ranged: true, shot: 'fire', art: 'firegob',
    moves: [['Bola de Fogo', 'P', 1], ['Labareda', 'S', 1], ['Chuva de Brasas', 'P.7 P.7 P.7', 3]] },
  salamander: { name: 'Salamandra', hp: 32, atk: 13, def: 2, speed: 13, art: 'salamander',
    moves: [['Lança Flamejante', 'P.8', 1], ['Rabada', 'J', 1], ['Investida Ígnea', 'S P.8a', 3]] },
  golem:      { name: 'Golem de Magma', hp: 50, atk: 14, def: 5, speed: 4, art: 'golem',
    moves: [['Punho de Magma', 'P1.4a', 1], ['Terremoto', 'J', 1], ['Erupção', 'J P1.3 P1.3', 3]] },
  demon:      { name: 'Demônio de Fogo', hp: 260, atk: 24, def: 8, speed: 7, boss: true, shield: 'Escudo de Chamas', art: 'demon',
    moves: [['Garra Ardente', 'P', 1], ['Inferno', 'J.9 S.9', 1], ['Apocalipse', 'P.8 J P.7 S P1.2d', 1]] },
  // Academia de Magia.
  apprentice: { name: 'Aprendiz', hp: 22, atk: 14, def: 1, speed: 11, ranged: true, shot: 'arcane', art: 'apprentice',
    moves: [['Míssil Arcano', 'P', 1], ['Explosão', 'S', 1], ['Rajada Arcana', 'P.7 P.7 J', 3]] },
  gargoyle:   { name: 'Gárgula', hp: 36, atk: 13, def: 4, speed: 10, art: 'gargoyle',
    moves: [['Garra de Pedra', 'P', 1], ['Mergulho', 'J', 1], ['Asas de Pedra', 'S P.8 P.8', 3]] },
  armor:      { name: 'Armadura Viva', hp: 46, atk: 14, def: 6, speed: 6, art: 'armor',
    moves: [['Espadada', 'P1.2', 1], ['Golpe de Escudo', 'P.8a', 1], ['Lâmina Fantasma', 'P1.2 S P.8', 3]] },
  archmage:   { name: 'Arquimago', hp: 240, atk: 25, def: 6, speed: 8, boss: true, ranged: true, shot: 'arcane', shield: 'Barreira Arcana', art: 'archmage',
    moves: [['Raio Arcano', 'P.8', 1], ['Meteoro', 'J1.2a', 1], ['Tempestade Arcana', 'P.7 S P.7 J P.7d', 1]] },
};

// Habilidades (especiais): compradas com Almas no acampamento, em vez do atributo Habilidade do Guerreiro.
// Gastam Fúria na luta, como antes, e todo especial deixa o herói exausto.
const SPECIALS = [
  { id: 'fury',  name: '⚡ Fúria',            souls: 1, minFury: 1, desc: 'Golpe forte; com Fúria 5, acerta todos (barra de carga)' },
  { id: 'combo', name: '🗡 Combo',            souls: 3, minFury: 2, desc: '2 a 4 golpes seguidos, cada um num círculo de reação' },
  { id: 'blade', name: '👻 Lâmina Invisível', souls: 6, minFury: 1, desc: 'Um golpe num monstro qualquer por ponto de Fúria' },
  { id: 'death', name: '☠ Sequência Mortal',  souls: 8, minFury: 2, desc: 'Barra oscilante: até ×2 de dano e quebra escudos' },
];
// Gemas: forjadas com Almas, dão um efeito passivo enquanto estão num dos encaixes (GEM_SLOTS).
// Os efeitos valem para a masmorra inteira: trocar de gema só no acampamento.
const GEM_SLOTS = 3;
const GEMS = [
  { id: 'leech',  icon: '💚', name: 'Gema da Vida',       souls: 3, desc: 'Parry perfeito recupera 5% do HP' },
  { id: 'twin',   icon: '⚔',  name: 'Gema Gêmea',         souls: 5, desc: 'O ataque simples acerta 2 vezes (o 2º com 60%)' },
  { id: 'pierce', icon: '🗡', name: 'Gema Perfurante',    souls: 4, desc: 'Golpe em monstro com escudo ainda causa 40% do dano' },
  { id: 'sling',  icon: '🪨', name: 'Gema da Funda',      souls: 2, desc: '2 pedradas por rodada' },
  { id: 'reflex', icon: '🛡', name: 'Gema do Reflexo',    souls: 4, desc: 'Janela do parry perfeito 50% maior' },
  { id: 'edge',   icon: '✴',  name: 'Gema Afiada',        souls: 3, desc: 'Chance de crítico 30% (era 15%)' },
  { id: 'rage',   icon: '🔥', name: 'Gema da Ira',        souls: 3, desc: 'Começa cada onda com 2 de Fúria' },
  { id: 'stone',  icon: '🗿', name: 'Gema de Pedra',      souls: 4, desc: 'Recebe 15% menos dano' },
  { id: 'greed',  icon: '🪙', name: 'Gema da Ganância',   souls: 2, desc: '+25% de ouro dos monstros' },
  { id: 'alch',   icon: '🧪', name: 'Gema do Alquimista', souls: 2, desc: '+1 poção de cura e +1 de adrenalina' },
];
const gem = id => !!(B && B.gems.includes(id));   // a gema está equipada nesta masmorra?

// ============================================================ save (§15)

// specials: habilidades compradas; gems: gemas forjadas; equipped: as que estão nos encaixes.
const fresh = () => ({ gold: 120, souls: 0, torches: 5, torchTs: Date.now(), maps: 1, level: 0, color: 'red', ng: 0, buys: { hp: 0, atk: 0, def: 0 }, wins: 0, specials: [], gems: [], equipped: [] });
let S;
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.buys) {
      const out = { ...fresh(), ...s };
      // Save antigo: o atributo Habilidade liberava os especiais a cada 5 pontos. Quem já tinha fica com eles.
      if (out.buys.hab) { out.specials = SPECIALS.filter((sp, i) => out.buys.hab >= 5 * (i + 1)).map(sp => sp.id); delete out.buys.hab; }
      return out;
    }
  } catch (e) {}
  return fresh();
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function tickTorches() {
  if (S.torches >= 5) { S.torchTs = Date.now(); return; }
  const n = Math.floor((Date.now() - S.torchTs) / 600000);
  if (n > 0) { S.torches = Math.min(5, S.torches + n); S.torchTs += n * 600000; persist(); }
}
const heroStats = () => ({ hp: HERO.hp + 20 * S.buys.hp, atk: HERO.atk + 3 * S.buys.atk, def: HERO.def + 2 * S.buys.def });
const effLevel = () => S.level + 5 * S.ng;
const ngMult = () => Math.pow(1.25, S.ng);
const guardSegments = () => Math.min(20, 5 + Math.floor(S.buys.def / 5));

// ============================================================ utilidades

const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const now = () => performance.now();
// Sorteio fixo por posição: o mesmo tile sempre ganha a mesma variação.
const hash = (a, b, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ============================================================ arte

const IMG = {};
function loadImg(k) { return new Promise(r => { const im = new Image(); im.onload = () => { IMG[k] = im; r(); }; im.onerror = () => { console.warn('sem arte', k); r(); }; im.src = `${ART}${k}.png`; }); }

// ============================================================ mundo isométrico

// POR QUE: o corredor é uma faixa de 5 tiles de largura (gx 0..4) que sobe para o nordeste da tela
// (gy diminuindo). O acampamento fica no começo (gy ~9) e cada onda tem a sua sala, 10 tiles à frente
// da anterior. Parede só no lado de trás (noroeste) e no fim do corredor, como numa maquete: o lado da
// frente fica aberto para o escuro, para nada tampar os personagens.
const S_ART = 3;              // 1 px de arte = 3 px da tela lógica
const HW = 32, HH = 16;       // meia largura / meia altura do losango de 1 tile (64×32 px de arte)
let H = PORTRAIT ? 1280 : 720, AH = Math.ceil(H / S_ART);
let W = PORTRAIT ? 720 : 1280, AW = Math.ceil(W / S_ART);
const GX0 = 0, GX1 = 4, GY_MIN = -25, GY_MAX = 12;
const roomGy = r => -r * 10;
const CAMP = { gx: 2, gy: 9 };
const WALL_H = 30;            // altura de um bloco de parede, em px de arte
const TOP = new Proxy({}, { get: (_, art) => (SPR.chars[art] && SPR.chars[art].top) || 48 });   // altura da cabeça acima dos pés (px de arte)

const cam = { gx: CAMP.gx + 1.6, gy: CAMP.gy - 1.6 };
let camX = 0, camY = 0, shake = 0;
// Chão (tiles, altura em px de arte) → canvas de arte. Mesma conta do Fury Hauler (IsoProjection).
function P(gx, gy, h = 0) {
  // Em pé, o ponto da câmera fica mais alto: a metade de baixo da tela é dos comandos.
  return [Math.round((gx - gy) * HW - camX + AW / 2), Math.round((gx + gy) * HH - h - camY + AH * (PORTRAIT ? 0.36 : 0.62))];
}

// Paredes: coluna gx = -1 (fundo à esquerda) e a linha gy = GY_MIN - 1 (fim do corredor), 2 blocos de altura.
// O bloco de cada posição é sorteado de forma fixa, mas depende do bioma (cada conjunto tem a tocha
// num índice diferente), então a lista é montada por bioma e guardada.
const WALLS = [];
for (let gy = GY_MIN - 1; gy <= GY_MAX; gy++) WALLS.push({ gx: -1, gy });
for (let gx = GX0; gx <= GX1; gx++) WALLS.push({ gx, gy: GY_MIN - 1 });
const LAYOUTS = {};
function layoutOf(tiles) {
  if (LAYOUTS[tiles]) return LAYOUTS[tiles];
  const set = SPR.tiles[tiles] || { floor: 0, wall: 0, torch: {} }, bio = BIOMES.find(b => b.tiles === tiles) || {};
  const torch = Object.keys(set.torch || {}).map(Number), plain = [];
  for (let i = 0; i < set.wall; i++) if (!torch.includes(i)) plain.push(i);
  const walls = WALLS.map(w => ({ ...w, tiles: [0, 1].map(lv => {
    const r = hash(w.gx, w.gy, lv);
    if (lv === 1 && w.gx === -1 && ((w.gy % 5) + 5) % 5 === 0 && torch.length) return torch[Math.floor(r * torch.length)];
    if (tiles === 'orcs') return lv === 0 && r < 0.3 ? 12 + Math.floor(r / 0.3 * 4) : Math.floor(r * 8);   // musgo na base
    const pick = bio.wallPick || plain;
    return pick[Math.floor(r * pick.length)] || 0;
  }) }));
  const lights = [];   // tochas da parede, com o deslocamento da chama dentro do bloco
  for (const w of walls) w.tiles.forEach((t, lv) => { const f = set.torch && set.torch[t]; if (f) lights.push({ gx: w.gx, gy: w.gy, ox: f[0] - 32, oy: f[1] - 47 - lv * WALL_H }); });
  // Piso: no dos Orcs os 8 primeiros são os lisos (mais comuns); nos outros, o sorteio com peso do bioma.
  const floor = (gx, gy) => { const r = hash(gx, gy, 7); if (tiles !== 'orcs') { const pick = bio.floorPick; return pick ? pick[Math.floor(r * pick.length)] : Math.floor(r * set.floor); } return r < 0.72 ? Math.floor(r / 0.72 * 8) : 8 + Math.floor((r - 0.72) / 0.28 * 8); };
  return (LAYOUTS[tiles] = { walls, lights, floor });
}
// Bioma que está na tela: o da masmorra em andamento, ou o da próxima (o acampamento fica na porta dela).
const curBiome = () => (B ? B.biome : biomeOf(S.level));

// Cenário fixo (fora da linha da luta). Os pilares marcam a passagem entre as salas.
const DECOR = [
  { k: 'campfire', gx: 3.0, gy: 8.0, light: 1 }, { k: 'crates', gx: 0.2, gy: 7.0 }, { k: 'barrel', gx: 0.2, gy: 10.6 },
  { k: 'bones', gx: 0.4, gy: -3.0 }, { k: 'barrel', gx: 0.15, gy: 3.8 },
  { k: 'pillar', gx: 0, gy: -5 }, { k: 'pillar', gx: 4, gy: -5 }, { k: 'pillar', gx: 0, gy: -15 }, { k: 'pillar', gx: 4, gy: -15 },
  { k: 'crates', gx: 0.25, gy: -12.6 }, { k: 'bones', gx: 3.9, gy: -8.2 },
  { k: 'barrel', gx: 0.2, gy: -17.6 }, { k: 'bones', gx: 4.0, gy: -22.2 }, { k: 'chest', gx: 0.5, gy: -24.4 },
];
const CAMPFIRE = DECOR[0];

// ============================================================ atores

function makeActor(art, gx, gy, back) { return { art, gx, gy, h: 0, hx: gx, hy: gy, act: null, moving: false, tw: null, flash: 0, shove: 0, back, alpha: 1 }; }
const hero = makeActor('hero', CAMP.gx, CAMP.gy, 1);   // back: para onde o golpe empurra (+gy = para trás do herói)
function play(o, name, ms) { o.act = { name, t0: now(), ms, hold: name === 'death' }; }

// Desliza o ator no chão. walk = usa a animação de andar (velocidade constante); senão é um bote (desacelera).
function tween(o, gx, gy, ms, walk = false) {
  const fx = o.gx, fy = o.gy, t0 = now();
  if (walk) o.moving = true;
  return new Promise(res => {
    o.tw = { step: () => {
      const p = Math.min(1, (now() - t0) / ms), e = walk ? p : 1 - Math.pow(1 - p, 2);
      o.gx = fx + (gx - fx) * e; o.gy = fy + (gy - fy) * e;
      if (p >= 1) { o.tw = null; if (walk) o.moving = false; res(); }
    } };
  });
}
const walkTo = (o, gx, gy, speed = 3.2) => tween(o, gx, gy, Math.max(200, Math.hypot(gx - o.gx, gy - o.gy) / speed * 1000), true);
function hop(o, ms, height) {
  const t0 = now();
  return new Promise(res => { const st = () => { const p = Math.min(1, (now() - t0) / ms); o.h = Math.sin(p * Math.PI) * height; if (p < 1) requestAnimationFrame(st); else { o.h = 0; res(); } }; st(); });
}

// ============================================================ batalha: estado

let B = null;   // masmorra em andamento
const FX = { floats: [], flash: null, parts: [] };
function floatAt(o, text, color = '#fff', size = 30, dy = 0) { FX.floats.push({ gx: o.gx, gy: o.gy, h: (TOP[o.art] || 50) + 8 + dy, text, color, size, t: 0 }); }
function sparks(o, color = '#ffe9a8', n = 10) {
  for (let i = 0; i < n; i++) FX.parts.push({ gx: o.gx, gy: o.gy, x: 0, y: -(TOP[o.art] || 50) * 0.55, vx: (Math.random() - 0.5) * 140, vy: -40 - Math.random() * 90, life: 0.35 + Math.random() * 0.25, color });
}
function log(msg) { $('log').textContent = msg; }

function makeMonster(id, wave, opts = {}) {
  const d = MONSTERS[id], L = S.level, k = (1 + (L - 1) * 0.25) * ngMult() * (wave === 1 ? 1.3 : 1);
  const hpK = opts.escort ? 0.7 : 1, atkK = opts.escort ? 0.8 : 1;
  const m = makeActor(d.art, 2, 0, -1);
  Object.assign(m, {
    id, def: d, name: id === 'boss' ? COLORS.find(c => c.id === S.color).knight : d.name,
    maxHP: Math.round(d.hp * k * hpK), atk: Math.round(d.atk * k * atkK), defn: Math.round(d.def * k),
    gold: Math.round((12 + 4 * L) * ngMult() * (wave === 1 ? 1.25 : 1) * (opts.escort ? 0.8 : 1)),
    tired: 0, exhausted: 0, shields: 0, phase2: false, canPhase2: d.boss && effLevel() >= 3 && Math.random() < 0.6,
  });
  m.hp = m.maxHP;
  return m;
}

function buildWaves() {
  if (S.level === 0) return [[makeMonster('slime', 0)], [makeMonster('slime', 0), makeMonster('slime2', 0)], [makeMonster('slimeking', 2)]];
  // Comuns do bioma; na 7ª masmorra do bioma o chefe é o do bioma, nas outras é o Cavaleiro.
  // Monstro sem sprite carregado sai do sorteio (e o chefe sem arte vira o Cavaleiro).
  const hasArt = id => !!SPR.chars[MONSTERS[id].art];
  const bio = artOf(biomeOf(S.level));
  let pool = bio.pool.filter(hasArt); if (!pool.length) pool = ['pawn', 'archer'];
  const w = [0, 1].map(i => Array.from({ length: 3 }, () => makeMonster(pool[rnd(0, pool.length - 1)], i)));
  const boss = [makeMonster(S.level % PER_BIOME === 0 && hasArt(bio.boss) ? bio.boss : 'boss', 2)];
  if (S.level % 5 === 0) boss.push(makeMonster(pool[0], 2, { escort: true }), makeMonster(pool[1], 2, { escort: true }));   // escolta (§9)
  w.push(boss);
  return w;
}

async function enterDungeon() {
  tickTorches();
  if (S.torches < 1) return;
  S.torches--; if (S.torches === 4) S.torchTs = Date.now(); persist();
  const st = heroStats();
  B = {
    waves: buildWaves(), wave: 0, monsters: [], hp: st.hp, maxHP: st.hp, atk: st.atk, def: st.def,
    specials: [...S.specials], gems: [...S.equipped], souls: 0,   // souls: Almas que os chefes soltaram nesta masmorra
    fury: 0, guard: 0, guardBroken: false, noReact: false, skipNext: false, stones: 1,
    potHeal: 3 + (S.equipped.includes('alch') ? 1 : 0), potFury: 3 + (S.equipped.includes('alch') ? 1 : 0), gold: 0, tookDamage: false, biome: biomeOf(S.level), target: null, hero, camMode: 'hero',
  };
  hero.act = null; hero.alpha = 1;
  if (DEV.has('boss')) { B.wave = 2; hero.gx = 2; hero.gy = roomGy(1) + 2.2; }   // atalho de teste: começa na onda do chefe
  $('camp').classList.add('hidden'); $('battle').classList.remove('hidden');
  await runWaves();
}

// Posições da sala da onda atual: herói embaixo à esquerda, monstros em leque no alto à direita.
function layoutMonsters() {
  const a = alive(), base = roomGy(B.wave);
  // Em pé o leque é mais fechado na horizontal (a tela tem só 240 px de arte de largura).
  const spots = a.length === 1 ? [[2, -1.8]] : a.length === 2 ? (PORTRAIT ? [[1.3, -1.5], [2.6, -1.9]] : [[1.3, -1.5], [2.9, -2.0]])
    : PORTRAIT ? [[0.8, -1.2], [2.3, -2.3], [3.3, -1.0]] : [[0.9, -1.3], [2.2, -2.0], [3.5, -1.4]];
  a.forEach((m, i) => { m.hx = spots[i][0]; m.hy = base + spots[i][1] - (m.def.ranged ? 0.7 : 0) - (m.def.boss ? 0.2 : 0); });
}
const alive = () => B.monsters.filter(m => m.hp > 0);

async function runWaves() {
  for (; B.wave < 3; B.wave++) {
    // O herói anda até a sala (do acampamento ou da sala anterior), com a câmera atrás dele.
    // Os monstros da onda só entram em cena depois, para não aparecerem no meio do caminho.
    const newWave = !B.monsters.length || !alive().length;
    B.camMode = 'hero'; renderChip();
    log(B.wave === 0 ? 'O herói entra na masmorra…' : 'O herói marcha para a próxima sala…');
    hero.hx = 2; hero.hy = roomGy(B.wave) + 2.2;
    if (Math.hypot(hero.gx - hero.hx, hero.gy - hero.hy) > 0.05) await walkTo(hero, hero.hx, hero.hy);
    if (newWave) B.monsters = B.waves[B.wave];
    B.camMode = 'room';
    layoutMonsters();
    alive().forEach(m => { m.gx = m.hx; m.gy = m.hy - 6; m.alpha = 1; m.act = null; });
    B.target = alive()[0];
    log(B.wave === 2 ? `${B.monsters[0].name} aparece!` : `Onda ${B.wave + 1}: ${alive().map(m => m.name).join(', ')}`);
    await Promise.all(alive().map(m => walkTo(m, m.hx, m.hy, m.def.boss ? 2.2 : 3)));
    if (gem('rage') && B.fury < 2) { B.fury = 2; floatAt(hero, 'IRA: FÚRIA 2', '#ff9d2e', 24); sparks(hero, '#ff9d2e', 10); }
    const r = await battleLoop();
    if (r === 'dead') return defeat();
    if (r === 'fled') return endDungeon('fled');
    await wait(500);
  }
  endDungeon('won');
}

// ------------------------------------------------------------ rodada: fila de iniciativa (§4)

async function battleLoop() {
  while (true) {
    const q = [{ who: 'hero', roll: HERO.speed + rnd(0, 5) }];
    for (const m of alive()) {
      const entries = m.phase2 ? rnd(2, 3) : 1;
      for (let i = 0; i < entries; i++) q.push({ who: m, roll: m.def.speed + rnd(0, 5) + (m.phase2 ? 3 : 0) });
    }
    q.sort((a, b) => b.roll - a.roll || (a.who === 'hero' ? -1 : b.who === 'hero' ? 1 : 0));
    B.queue = q; B.stones = gem('sling') ? 2 : 1;
    for (let i = 0; i < q.length; i++) {
      B.qi = i; renderQueue();
      const e = q[i];
      if (e.who === 'hero') {
        // Maldições e dinamites ficam de fora (só valem com Monge e goblins de fogo).
        if (B.skipNext) { B.skipNext = false; log('O herói está exausto e perde a rodada.'); await wait(900); continue; }
        if (B.guardBroken) { B.guardBroken = false; B.noReact = false; log('Guarda quebrada: o herói perde a ação.'); await wait(900); continue; }
        B.noReact = false;
        const r = await heroTurn();
        if (r === 'fled') return 'fled';
      } else {
        const m = e.who;
        if (m.hp <= 0) continue;   // quem morre antes da vez é pulado
        if (m.exhausted > 0) { m.exhausted--; floatAt(m, 'EXAUSTO', '#f2c14e', 24); await wait(600); continue; }
        await monsterTurn(m);
        if (B.hp <= 0) return 'dead';
      }
      if (!alive().length) { await wait(700); return 'won'; }
    }
  }
}

// ------------------------------------------------------------ turno do herói (§6)

let turnResolve = null;
function heroTurn() {
  if (!B.target || B.target.hp <= 0) B.target = alive()[0];
  renderCmds('main');
  log(`Sua vez. Alvo: ${B.target.name}. Segure um comando para usar.`);
  if (AUTO) setTimeout(() => { if (turnResolve) doAttack(); }, 700);
  return new Promise(r => { turnResolve = r; });
}
function endTurn(v) { const r = turnResolve; turnResolve = null; renderCmds(null); r && r(v); }

// Comandos de ação exigem segurar 0,9 s (§6). A pedrada e o Ataque Aéreo são toques simples.
function holdButton(btn, fn) {
  let t0 = 0, raf = 0; const fill = document.createElement('i'); fill.className = 'fill'; btn.appendChild(fill);
  const tick = () => { const p = Math.min(1, (now() - t0) / 900); fill.style.width = `${p * 100}%`; if (p >= 1) { t0 = 0; fill.style.width = '0'; fn(); return; } raf = requestAnimationFrame(tick); };
  btn.onpointerdown = e => { e.preventDefault(); if (btn.disabled) return; t0 = now(); tick(); };
  const stop = () => { cancelAnimationFrame(raf); t0 = 0; fill.style.width = '0'; };
  btn.onpointerup = stop; btn.onpointerleave = stop; btn.onpointercancel = stop;
}


function renderCmds(mode) {
  const c = $('cmds');
  if (!mode) { c.innerHTML = ''; return; }
  if (mode === 'main') {
    const anySpecial = B.specials.length > 0;
    c.innerHTML = `<button class="btn" id="c-atk">⚔ Atacar<small>+1 Fúria</small></button>
      <button class="btn" id="c-sp" ${!anySpecial || B.fury < 1 ? 'disabled' : ''}>✨ Especial<small>${anySpecial ? `Fúria ${B.fury}/5` : 'compre no acampamento'}</small></button>
      <button class="btn" id="c-pot" ${!B.potHeal && !B.potFury ? 'disabled' : ''}>🧪 Poção<small>${B.potHeal} cura · ${B.potFury} adrenalina</small></button>
      <button class="btn" id="c-run" ${S.maps < 1 ? 'disabled' : ''}>🗺 Fugir<small>${S.maps} mapa(s)</small></button>
      <button class="btn wide" id="c-rock" ${B.stones < 1 ? 'disabled' : ''}>🪨 Pedrada (grátis, não gasta o turno) · toque${gem('sling') ? ` · ${B.stones}/2` : ''}</button>`;
    holdButton($('c-atk'), () => doAttack());
    holdButton($('c-sp'), () => renderCmds('special'));
    holdButton($('c-pot'), () => renderCmds('potion'));
    holdButton($('c-run'), () => { S.maps--; persist(); endTurn('fled'); });
    $('c-rock').onclick = doRock;
  } else if (mode === 'special') {
    c.innerHTML = SPECIALS.filter(s => B.specials.includes(s.id)).map(s => `<button class="btn" data-sp="${s.id}" ${B.fury < s.minFury ? 'disabled' : ''}>${s.name}<small>${specialCost(s.id)}</small></button>`).join('') + '<button class="btn" id="c-back">↩ Voltar</button>';
    c.querySelectorAll('[data-sp]').forEach(b => holdButton(b, () => doSpecial(b.dataset.sp)));
    $('c-back').onclick = () => renderCmds('main');
  } else if (mode === 'potion') {
    c.innerHTML = `<button class="btn" id="p-heal" ${!B.potHeal ? 'disabled' : ''}>❤ Cura<small>+40% HP (${B.potHeal})</small></button>
      <button class="btn" id="p-fury" ${!B.potFury ? 'disabled' : ''}>⚡ Adrenalina<small>Fúria 5/5 (${B.potFury})</small></button><button class="btn wide" id="c-back">↩ Voltar</button>`;
    holdButton($('p-heal'), () => { B.potHeal--; const h = Math.round(B.maxHP * 0.4); B.hp = Math.min(B.maxHP, B.hp + h); floatAt(hero, `+${h}`, '#6cc76a'); sparks(hero, '#8be07f', 12); endTurn(); });
    holdButton($('p-fury'), () => { B.potFury--; B.fury = 5; floatAt(hero, 'FÚRIA 5', '#ff9d2e'); sparks(hero, '#ff9d2e', 12); endTurn(); });
    $('c-back').onclick = () => renderCmds('main');
  }
}
function specialCost(id) {
  const f = B.fury;
  if (id === 'fury') return f >= 5 ? 'custa 5 · ×2 em todos' : f >= 3 ? 'custa 3 · ×1,5' : f === 2 ? 'custa 2 · ×1,2' : 'custa 1 · ×1,1';
  if (id === 'combo') return `custa ${f >= 4 ? 4 : f >= 3 ? 3 : 2} · ${f >= 4 ? 4 : f >= 3 ? 3 : 2} golpes`;
  if (id === 'blade') return `custa ${f} · ${f} golpes ×0,85`;
  return 'custa 2 · barra oscilante';
}
const gainFury = n => { B.fury = Math.min(5, B.fury + n); };

// Golpe do herói num monstro: escudo quebra em vez de tirar HP; cansaço e exaustão do monstro (§7.3).
function heroHit(m, mult, { crit = false, strong = false, spread = [-1, 3], shieldBreak = 1 } = {}) {
  if (!m || m.hp <= 0) return 0;
  // Escudo quebra em vez de tirar HP; com a Gema Perfurante, o golpe passa com 40% do dano.
  const shielded = m.shields > 0;
  if (shielded) {
    m.shields = Math.max(0, m.shields - shieldBreak * (crit ? 2 : 1)); floatAt(m, 'escudo!', '#5aa9f0', 24, 18); sparks(m, '#9fd0ff', 8);
    if (!gem('pierce')) return 0;
  }
  let dmg = Math.max(1, Math.round(B.atk * mult) - m.defn + rnd(spread[0], spread[1]));
  if (crit) dmg *= 2;
  if (shielded) dmg = Math.max(1, Math.round(dmg * 0.4));
  m.hp = Math.max(0, m.hp - dmg);
  m.flash = 0.2; m.shove = 0.35; shake = mult >= 1.5 || crit ? 0.25 : 0.1;
  sparks(m, crit ? '#f2c14e' : '#ffe9a8', crit ? 16 : 9);
  floatAt(m, `${dmg}`, crit ? '#f2c14e' : '#fff', crit ? 42 : 32);
  const cap = m.def.boss ? (effLevel() >= 20 ? 20 : 10) : (effLevel() >= 20 ? 10 : 5);
  if (m.tired >= cap && mult >= 1.5) { m.exhausted = 3; m.tired = 0; floatAt(m, 'EXAUSTO!', '#f2c14e', 26, 14); }
  else if (strong) m.tired = Math.min(cap, m.tired + 1);
  if (m.def.boss && m.canPhase2 && !m.phase2 && m.hp > 0 && m.hp <= m.maxHP / 2) {
    m.phase2 = true; m.atk = Math.round(m.atk * 1.4); floatAt(m, 'FASE 2!', '#e5533d', 38, 28); shake = 0.5;
  }
  if (m.hp <= 0) onKill(m);
  return dmg;
}
function onKill(m) {
  const gold = gem('greed') ? Math.round(m.gold * 1.25) : m.gold;
  B.gold += gold; floatAt(m, `+${gold} ouro`, '#f2c14e', 24, 30); play(m, 'death', 700); m.diedAt = now();
  // Todo chefe solta 1 Alma: é o recurso das habilidades e das gemas.
  if (m.def.boss) { B.souls++; setTimeout(() => { floatAt(m, '+1 ALMA 💠', '#9fd0ff', 34, 56); sparks(m, '#9fd0ff', 24); }, 450); }
}

// Bote até o alvo: o herói para um pouco antes, na diagonal da tela.
const strikeSpot = t => [t.gx, t.gy + (t.def && t.def.boss ? 1.1 : 0.9)];

async function doAttack() {
  renderCmds(null);
  const critChance = gem('edge') ? 0.30 : 0.15;
  const t = B.target, crit = Math.random() < critChance;
  await tween(hero, ...strikeSpot(t), 260);
  play(hero, 'attack', 620);
  await wait(320);
  heroHit(t, 1, { crit, spread: [-2, 3] });
  gainFury(1);   // só o Guerreiro ganha Fúria com o ataque simples
  // Gema Gêmea: um segundo golpe logo depois, com 60% da força (só uma vez a Fúria).
  if (gem('twin') && t.hp > 0) { await wait(220); play(hero, 'attack', 420); await wait(160); heroHit(t, 0.6, { crit: Math.random() < critChance, spread: [-1, 2] }); }
  await wait(320);
  await tween(hero, hero.hx, hero.hy, 260);
  retarget(); endTurn();
}

async function doRock() {
  if (B.stones < 1 || !turnResolve) return;
  B.stones--; renderCmds(null);
  const t = B.target;
  await projectile(hero, 24, t, 26, 'rock');
  if (t.shields > 0) { t.shields--; floatAt(t, 'escudo -1', '#5aa9f0', 22); }
  else { const d = Math.max(1, Math.round(B.atk * 0.2)); t.hp = Math.max(0, t.hp - d); t.flash = 0.2; t.shove = 0.2; floatAt(t, `${d}`); if (t.hp <= 0) onKill(t); }
  retarget();
  if (!alive().length) return endTurn();
  renderCmds('main');
}

function retarget() { if (!B.target || B.target.hp <= 0) B.target = alive()[0] || null; layoutMonsters(); }

// ------------------------------------------------------------ especiais e minijogos (§7.1)

async function doSpecial(id) {
  renderCmds(null);
  const f = B.fury, t = B.target;
  if (id === 'fury') {
    if (f >= 5) {
      B.fury -= 5;
      const fill = await chargeBar();
      play(hero, 'attack', 620); await hop(hero, 300, 10);
      for (const m of alive()) { const crit = Math.random() < fill; heroHit(m, crit ? 5 : 2, { crit: false, strong: true, shieldBreak: crit ? 4 : 2 }); }
      shake = 0.5;
    } else {
      const [cost, mult] = f >= 3 ? [3, 1.5] : f === 2 ? [2, 1.2] : [1, 1.1];
      B.fury -= cost;
      await tween(hero, ...strikeSpot(t), 240); play(hero, 'attack', 620); await wait(320);
      heroHit(t, mult, { strong: true, shieldBreak: 2 }); await wait(300); await tween(hero, hero.hx, hero.hy, 240);
    }
  } else if (id === 'combo') {
    const n = f >= 4 ? 4 : f >= 3 ? 3 : 2; B.fury -= n;
    const mults = [1.2, 1.4, 1.8, 2];
    await tween(hero, ...strikeSpot(t), 240);
    for (let i = 0; i < n && t.hp > 0; i++) {
      const res = await qte({ type: 'P', ms: 900, curve: '', label: `Golpe ${i + 1}/${n}` });
      if (res === 'perfect') { play(hero, 'attack', 450); await wait(200); heroHit(t, mults[i], { strong: true }); }
      else floatAt(t, 'errou', '#a59c8c', 24);
    }
    await tween(hero, hero.hx, hero.hy, 240);
  } else if (id === 'blade') {
    const n = f; B.fury = 0;
    for (let i = 0; i < n && alive().length; i++) {
      const m = alive()[rnd(0, alive().length - 1)];
      sparks(hero, '#c9b8ff', 8);
      [hero.gx, hero.gy] = strikeSpot(m); play(hero, 'attack', 380);
      heroHit(m, 0.85, { strong: true, spread: [-1, 2] }); await wait(280);
    }
    sparks(hero, '#c9b8ff', 8); hero.gx = hero.hx; hero.gy = hero.hy;
  } else if (id === 'death') {
    B.fury -= 2;
    const mult = await oscBar();
    if (mult) { await tween(hero, ...strikeSpot(t), 240); play(hero, 'attack', 620); await wait(320); heroHit(t, mult, { strong: true, shieldBreak: mult >= 2 ? 3 : mult >= 1.5 ? 2 : 1 }); await wait(300); await tween(hero, hero.hx, hero.hy, 240); }
    else log('A Sequência Mortal falhou.');
  }
  B.skipNext = true;   // todo especial deixa o herói exausto: perde a rodada seguinte
  floatAt(hero, 'exausto', '#a59c8c', 22, 20);
  retarget(); await wait(300); endTurn();
}

// Barra de carga: martelar por 2,2 s; 14 toques enchem; vaza 22%/s. Retorna 0..1 (chance de crítico).
function chargeBar() {
  const box = $('mini'); box.classList.remove('hidden');
  box.innerHTML = '<div>MARTELE A TELA!</div><div class="bar"><i id="cb" style="left:0;background:#ff9d2e"></i></div><small id="cbt"></small>';
  let fill = 0; const t0 = now(); let last = t0;
  const tap = e => { if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return; fill = Math.min(1, fill + 1 / 14); };
  addEventListener('pointerdown', tap); addEventListener('keydown', tap);
  return new Promise(res => {
    const st = () => {
      const t = now(), dt = (t - last) / 1000; last = t; fill = Math.max(0, fill - 0.22 * dt);
      $('cb').style.width = `${fill * 100}%`; $('cbt').textContent = `${Math.max(0, 2.2 - (t - t0) / 1000).toFixed(1)}s · crítico ${Math.round(fill * 100)}%`;
      if (t - t0 >= 2200) { removeEventListener('pointerdown', tap); removeEventListener('keydown', tap); box.classList.add('hidden'); res(fill >= 0.999 ? 1 : fill); return; }
      requestAnimationFrame(st);
    };
    st();
  });
}

// Barra oscilante: fraca 60% (×1,1), forte 30% (×1,5), muito forte 10% (×2); acelera a cada zona; 3 idas e voltas.
function oscBar() {
  const box = $('mini'); box.classList.remove('hidden');
  box.innerHTML = `<div>TOQUE PARA TRAVAR</div><div class="bar"><i style="left:0;width:60%;background:#4b3f63"></i><i style="left:60%;width:30%;background:#c77d2e"></i><i style="left:90%;width:10%;background:#e5533d"></i><i id="ob" style="width:5px;background:#fff"></i></div>`;
  let x = 0, dir = 1, trips = 0, last = now(), done = false;
  return new Promise(res => {
    const finish = v => { if (done) return; done = true; removeEventListener('pointerdown', lock); removeEventListener('keydown', lock); box.classList.add('hidden'); res(v); };
    const lock = e => { if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return; finish(x >= 0.9 ? 2 : x >= 0.6 ? 1.5 : 1.1); };
    setTimeout(() => { addEventListener('pointerdown', lock); addEventListener('keydown', lock); }, 150);
    const st = () => {
      if (done) return;
      const t = now(), dt = (t - last) / 1000; last = t;
      const speed = x >= 0.9 ? 1.9 : x >= 0.6 ? 1.05 : 0.55;
      x += dir * speed * dt;
      if (x >= 1) { x = 1; dir = -1; } else if (x <= 0) { x = 0; dir = 1; trips++; }
      $('ob').style.left = `calc(${x * 100}% - 2px)`;
      if (trips >= 3) return finish(0);   // sem toque: falha
      requestAnimationFrame(st);
    };
    st();
  });
}

// ------------------------------------------------------------ turno do monstro e reações (§5, §8)

async function monsterTurn(m) {
  const L = effLevel();
  // Escudo Arcano (§8.4): chefe a partir do nível 5, 45% de chance, teto 10. O Gigante tem a sua versão (Armadura de Gelo).
  if (m.def.shield && L >= 5 && m.shields < 10 && Math.random() < 0.45) {
    m.shields = Math.min(10, m.shields + rnd(2, 3)); showMove(`${m.name} conjura ${m.def.shield}`); log(`${m.name} conjura ${m.def.shield}.`);
    floatAt(m, `escudo ${m.shields}`, '#5aa9f0', 24); sparks(m, '#9fd0ff', 14); await wait(900); hideMove(); return;
  }
  const options = m.def.moves.filter(mv => Math.max(1, L) >= mv[2]);   // o treinamento (nível 0) conta como nível 1
  const [name, code] = options[rnd(0, options.length - 1)];
  let hits = parseMove(code);
  if (m.phase2 && hits.length < 4) { const lastHit = hits[hits.length - 1]; hits = [...hits, { ...lastHit, m: lastHit.m * 0.85 }]; }
  showMove(name); log(`${m.name}: ${name}`);
  await wait(650);
  if (!m.def.ranged) await walkTo(m, hero.gx, hero.gy - (m.def.boss ? 1.1 : 0.9), 6);
  let defendedAll = true;
  for (let i = 0; i < hits.length && B.hp > 0; i++) {
    const h = hits[i];
    const base = hits.length > 1 ? Math.round(m.atk * 0.65) : m.atk;
    let ms = L >= 6 ? 900 * h.m : 900;
    if (m.phase2) ms *= 0.75;
    if (S.ng) ms *= Math.max(0.6, 1 - 0.06 * S.ng);
    play(m, 'attack', Math.max(500, ms));
    if (m.def.ranged) setTimeout(() => projectile(m, 30, hero, 26, m.def.shot || 'arrow'), ms * 0.4);
    const res = B.noReact ? 'fail' : await qte({ type: h.type, ms, curve: L >= 6 ? h.curve : '', label: hits.length > 1 ? `${i + 1}/${hits.length}` : '' });
    await resolveHit(m, res, base, hits.length > 1);
    if (!(res === 'perfect' || res === 'dodge' || res === 'jump')) defendedAll = false;
    if (m.hp <= 0) break;
    await wait(160);
  }
  hideMove();
  // Defender o combo inteiro rende um contra-ataque (§5).
  if (hits.length > 1 && defendedAll && m.hp > 0 && B.hp > 0) {
    const mult = 1.5 + Math.random() * 0.5;
    floatAt(hero, 'CONTRA-ATAQUE!', '#f2c14e', 26, 20);
    play(hero, 'attack', 560); await wait(260);
    heroHit(m, mult, { spread: [0, 0] });
  }
  if (!m.def.ranged && m.hp > 0) await tween(m, m.hx, m.hy, 320);
  retarget();
}

async function resolveHit(m, res, base, multiHit) {
  if (res === 'perfect') {
    gainFury(1); FX.flash = ['#6cc76a', 0.2];
    floatAt(hero, 'PARRY PERFEITO!', '#6cc76a', 28);
    if (gem('leech') && B.hp < B.maxHP) { const h = Math.max(1, Math.round(B.maxHP * 0.05)); B.hp = Math.min(B.maxHP, B.hp + h); floatAt(hero, `+${h}`, '#6cc76a', 24, 24); }
    play(hero, 'attack', 400); sparks(hero, '#fff6c8', 10);
    const d = Math.max(1, Math.round(B.atk * 0.5) - m.defn);
    if (m.shields > 0) m.shields--; else { m.hp = Math.max(0, m.hp - d); m.flash = 0.2; m.shove = 0.25; floatAt(m, `${d}`); if (m.hp <= 0) onKill(m); }
    m.tired = Math.min(m.def.boss ? 10 : 5, m.tired + 1);
    return;
  }
  if (res === 'jump') {
    gainFury(1); FX.flash = ['#6cc76a', 0.15]; floatAt(hero, 'pulou!', '#5aa9f0', 26);
    hop(hero, 560, 30);
    await aerial(m); return;
  }
  if (res === 'dodge') {
    FX.flash = ['#6cc76a', 0.15]; floatAt(hero, 'esquivou', '#5aa9f0', 26);
    const side = hero.hx > 2 ? -0.8 : 0.8;   // passo para o lado (perpendicular à linha da luta)
    await tween(hero, hero.hx + side, hero.gy, 120); tween(hero, hero.hx, hero.gy, 260);
    return;
  }
  let dmg;
  if (res === 'block') { gainFury(1); dmg = Math.max(0, base - B.def); floatAt(hero, 'bloqueio', '#b9a8d8', 24); sparks(hero, '#d9d4e8', 6); }
  else { dmg = base + rnd(0, 3); FX.flash = ['#e5533d', 0.2]; gainFury(1); }
  if (gem('stone')) dmg = Math.round(dmg * 0.85);
  if (dmg > 0) {
    B.hp = Math.max(0, B.hp - dmg); B.tookDamage = true; hero.flash = 0.2; hero.shove = res === 'block' ? 0.15 : 0.35; shake = 0.2;
    floatAt(hero, `-${dmg}`, '#e5533d', 34, -10);
    if (B.hp <= 0) play(hero, 'death', 800);
    // Exaustão do herói (§7.2): barra cheia + dano durante combo de vários hits = guarda quebrada.
    const segs = guardSegments();
    if (B.guard >= segs && multiHit && !B.guardBroken) { B.guard = 0; B.guardBroken = true; B.noReact = true; floatAt(hero, 'GUARDA QUEBRADA', '#e5533d', 26, 24); }
    else B.guard = Math.min(segs, B.guard + Math.max(0.3, dmg * 7 / B.maxHP));
  }
}

// Ataque Aéreo: botão disponível por 1,1 s depois de um salto bem-sucedido.
function aerial(m) {
  const c = $('cmds'); c.innerHTML = '<button class="btn wide gold air" id="air">🦅 ATAQUE AÉREO!</button>';
  return new Promise(res => {
    let done = false;
    const go = () => { if (done) return; done = true; removeEventListener('keydown', key); play(hero, 'attack', 450); heroHit(m, 0.9, { spread: [0, 0] }); c.innerHTML = ''; res(); };
    const key = e => { if (e.key === ' ' || e.key === 'Enter') go(); };
    $('air').onpointerdown = go; addEventListener('keydown', key);
    if (AUTO) setTimeout(go, 300);
    setTimeout(() => { if (!done) { done = true; removeEventListener('keydown', key); c.innerHTML = ''; res(); } }, 1100);
  });
}

// Círculo de reação: fecha em ms. Parry: toque (últimos 32% = perfeito, antes = bloqueio). Salto: ↑. Lateral: ← →.
let qteInput = null;
function qte({ type, ms, curve, label }) {
  const box = $('qte'), ring = box.querySelector('.ring');
  const icon = { P: '🛡️', J: '⬆️', S: '↔️' }[type], hint = { P: 'TOQUE', J: 'ARRASTE ↑', S: 'DESLIZE ↔' }[type];
  box.querySelector('b').textContent = icon; box.querySelector('small').textContent = `${hint} ${label || ''}`;
  const perfectAt = gem('reflex') ? 0.52 : 0.68;   // parry perfeito nos últimos 32% do círculo (48% com a Gema do Reflexo)
  // O círculo fica à esquerda e acima do herói, sobre a parede, para não tampar quem ataca.
  const [hx, hy] = P(hero.hx, hero.hy, 40);
  if (PORTRAIT) { box.style.left = '50%'; box.style.top = `${Math.round(H * 0.56)}px`; }   // em pé: no meio, entre a sala e os comandos
  else { box.style.left = `${Math.max(130, hx * S_ART - 220)}px`; box.style.top = `${Math.max(130, hy * S_ART - 70)}px`; }
  box.classList.remove('hidden');
  const t0 = now();
  return new Promise(res => {
    let done = false;
    const finish = r => { if (done) return; done = true; qteInput = null; box.classList.add('hidden'); res(r); };
    qteInput = g => {
      const p = (now() - t0) / ms;
      if (type === 'P') finish(g === 'tap' ? (p >= perfectAt ? 'perfect' : 'block') : 'fail');
      else if (type === 'J') finish(g === 'up' ? 'jump' : 'fail');
      else finish(g === 'side' ? 'dodge' : 'fail');
    };
    const st = () => {
      if (done) return;
      const p = Math.min(1, (now() - t0) / ms);
      const v = curve === 'a' ? p * p : curve === 'd' ? 1 - (1 - p) * (1 - p) : p;
      ring.setAttribute('r', String(90 - 44 * v));
      ring.style.stroke = p >= perfectAt ? '#f2c14e' : type === 'P' ? '#ffffff' : '#5aa9f0';
      if (p >= 1) return finish('fail');
      requestAnimationFrame(st);
    };
    st();
    if (AUTO) setTimeout(() => qteInput && qteInput(type === 'P' ? 'tap' : type === 'J' ? 'up' : 'side'), ms * 0.8);
  });
}
function showMove(t) { const m = $('move'); m.textContent = t; m.classList.remove('hidden'); }
function hideMove() { $('move').classList.add('hidden'); }

// Projéteis voam no chão (com altura), do ator a ao ator b.
let projectiles = [];
function projectile(a, ha, b, hb, kind) {
  const p = { from: [a.gx, a.gy, ha], to: [b.gx, b.gy, hb], kind, t0: now(), ms: kind === 'rock' ? 300 : 240 };
  projectiles.push(p);
  return wait(p.ms).then(() => { projectiles = projectiles.filter(q => q !== p); });
}

// ------------------------------------------------------------ fim de masmorra (§9)

function defeat() {
  const lost = Math.floor(B.gold / 2);
  const have = S.souls + B.souls;   // as Almas que já caíram nesta masmorra também contam
  modal(`<h2 style="color:#e5533d">Você caiu</h2><p>Ouro desta masmorra: ${B.gold} (perde ${lost}).</p>${B.souls ? `<p>Almas coletadas: ${B.souls} 💠 (ficam com você)</p>` : ''}
    ${have > 0 ? '<p>Gastar 1 Alma para reviver com a vida cheia nesta onda?</p>' : ''}
    <div class="row2">${have > 0 ? '<button class="btn gold" id="m-rev">Reviver (1 💠)</button>' : ''}<button class="btn" id="m-ok">Voltar ao acampamento</button></div>`);
  if ($('m-rev')) $('m-rev').onclick = async () => {
    if (B.souls > 0) B.souls--; else S.souls--;
    persist(); closeModal(); B.hp = B.maxHP; B.guard = 0; B.noReact = false; B.guardBroken = false;
    hero.act = null; sparks(hero, '#9fd0ff', 18); floatAt(hero, 'REVIVEU', '#9fd0ff', 30);
    const r = await battleLoop(); if (r === 'dead') return defeat(); if (r === 'fled') return endDungeon('fled'); B.wave++; await runWaves();
  };
  $('m-ok').onclick = () => { S.gold += B.gold - lost; S.souls += B.souls; persist(); closeModal(); toCamp(); };
}

function endDungeon(kind) {
  if (kind === 'fled') { S.gold += B.gold; S.souls += B.souls; persist(); modal(`<h2>Fugiu</h2><p>Você mantém ${B.gold} de ouro${B.souls ? ` e ${B.souls} 💠` : ''}.</p><div class="row2"><button class="btn" id="m-ok">Acampamento</button></div>`); $('m-ok').onclick = () => { closeModal(); toCamp(); }; return; }
  const L = S.level, perfect = !B.tookDamage;
  // As Almas agora vêm só dos chefes derrotados (B.souls); a run perfeita dobra o ouro do bônus.
  let bonus = Math.round((150 + 60 * (L - 1)) * ngMult());
  const souls = B.souls;
  if (perfect) bonus *= 2;
  const total = B.gold + bonus;
  modal(`<h2 style="color:#f2c14e">${L === 0 ? 'Treinamento concluído!' : `Masmorra ${L} vencida!`}</h2><p>Ouro dos monstros: ${B.gold}</p><p>Bônus de vitória: ${bonus}${perfect ? ' (run perfeita ×2)' : ''}</p><p>Almas dos chefes: +${souls} 💠</p>
    <div class="row2"><button class="btn gold" id="m-x2">Vídeo premiado: bônus ×2 (simulado)</button><button class="btn" id="m-ok">Coletar</button></div>`);
  const take = extra => {
    S.gold += total + extra; S.souls += souls; S.wins++;
    if (S.level >= LEVELS) { S.ng++; S.level = 1; } else S.level++;
    S.color = COLORS[rnd(0, COLORS.length - 1)].id;
    persist(); closeModal(); toCamp();
  };
  $('m-x2').onclick = () => take(bonus); $('m-ok').onclick = () => take(0);
}

function modal(html) { $('modal').innerHTML = `<div class="box">${html}</div>`; $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); }

// ============================================================ HUD da batalha

function renderChip() { $('chip').textContent = `${S.level === 0 ? 'TREINAMENTO' : `MASMORRA NV. ${S.level}`}${S.ng ? ` · NG+${S.ng}` : ''} · ${B.biome.name} · ONDA ${Math.min(3, B.wave + 1)}/3 · 🪙 ${B.gold}`; }
function renderQueue() {
  $('queue').innerHTML = (B.queue || []).map((e, i) => `<i class="${e.who === 'hero' ? 'hero' : ''}${i === B.qi ? ' now' : ''}">${e.who === 'hero' ? 'Herói' : e.who.name.split(' ')[0]}</i>`).join('');
}
let barsKey = '';
function renderBars() {
  $('hp-text').textContent = `${B.hp}/${B.maxHP}`; $('hp-fill').style.width = `${B.hp / B.maxHP * 100}%`;
  const segs = guardSegments(), key = `${B.fury}|${Math.floor(B.guard)}|${segs}`;
  if (key === barsKey) return; barsKey = key;
  $('bars').innerHTML = `<span>⚡</span><div class="seg f">${Array.from({ length: 5 }, (_, i) => `<i class="${i < B.fury ? 'on' : ''}"></i>`).join('')}</div>
    <span>🛡</span><div class="seg g">${Array.from({ length: segs }, (_, i) => `<i class="${i < Math.floor(B.guard) ? 'on' : ''}"></i>`).join('')}</div>`;
}

// ============================================================ acampamento (§10, §14)

function toCamp() {
  B = null; projectiles = []; FX.floats = [];
  Object.assign(hero, { gx: CAMP.gx, gy: CAMP.gy, hx: CAMP.gx, hy: CAMP.gy, h: 0, act: null, alpha: 1, tw: null, moving: false });
  $('battle').classList.add('hidden'); renderCamp(); $('camp').classList.remove('hidden');
}
// O painel tem 3 abas: Atributos (ouro), Habilidades e Forja (Almas). A aba aberta fica guardada.
let campTab = 'attrs';
function renderCamp() {
  tickTorches();
  const st = heroStats(), next = S.torches < 5 ? Math.max(0, 600000 - (Date.now() - S.torchTs)) : 0;
  const bio = biomeOf(S.level), nth = (S.level - 1) % PER_BIOME + 1, training = S.level === 0;
  const bb = artOf(bio).boss, bossName = (training || nth === PER_BIOME) && SPR.chars[MONSTERS[bb].art] ? MONSTERS[bb].name : COLORS.find(c => c.id === S.color).knight;
  const owned = SPECIALS.filter(sp => S.specials.includes(sp.id)).map(sp => sp.name.split(' ')[0]).join(' ') || '—';
  const worn = S.equipped.map(id => GEMS.find(g => g.id === id).icon).join(' ') || '—';
  let pane = '';
  if (campTab === 'attrs') {
    pane = `<div class="attrs">${ATTRS.map(a => { const c = attrCost(a, S.buys[a.id]); return `<button class="btn attr" data-a="${a.id}" ${S.gold < c ? 'disabled' : ''}>${a.name} <small>${a.desc}</small><b>🪙 ${c}</b></button>`; }).join('')}</div>
      <div class="row2"><button class="btn" id="b-torch" ${S.souls < 1 || S.torches >= 5 ? 'disabled' : ''}>+1 Tocha (1 💠)</button><button class="btn" id="b-map" ${S.souls < 1 ? 'disabled' : ''}>+1 Mapa (1 💠)</button></div>
      <p class="note">Reação: toque = parry (no fim do círculo = perfeito) · arraste ↑ = salto · deslize ↔ = lateral. Teclado: Espaço, ↑, ← →. Comandos: segure 0,9 s. Toque num monstro (ou ← →) para escolher o alvo.</p>`;
  } else if (campTab === 'skills') {
    pane = `<p class="note">Habilidades custam Almas 💠 (cada chefe derrotado solta 1). Na luta, gastam Fúria e deixam o herói exausto na rodada seguinte.</p>
      ${SPECIALS.map(sp => { const has = S.specials.includes(sp.id); return `<div class="item${has ? ' owned' : ''}"><div><b>${sp.name}</b><small>${sp.desc}</small></div>${has ? '<span class="tag">✔ aprendida</span>' : `<button class="btn" data-sp="${sp.id}" ${S.souls < sp.souls ? 'disabled' : ''}>💠 ${sp.souls}</button>`}</div>`; }).join('')}`;
  } else {
    pane = `<p class="note">Forje gemas com Almas 💠 e equipe até ${GEM_SLOTS}. Equipadas: <b>${S.equipped.length}/${GEM_SLOTS}</b>. O efeito vale na masmorra inteira.</p>
      <div class="gems">${GEMS.map(g => { const has = S.gems.includes(g.id), on = S.equipped.includes(g.id);
        const btn = !has ? `<button class="btn" data-forge="${g.id}" ${S.souls < g.souls ? 'disabled' : ''}>Forjar 💠 ${g.souls}</button>`
          : `<button class="btn${on ? ' gold' : ''}" data-equip="${g.id}" ${!on && S.equipped.length >= GEM_SLOTS ? 'disabled' : ''}>${on ? 'Tirar' : 'Equipar'}</button>`;
        return `<div class="item gem${on ? ' on' : ''}${has ? ' owned' : ''}"><span class="ico">${g.icon}</span><div><b>${g.name}</b><small>${g.desc}</small></div>${btn}</div>`; }).join('')}</div>`;
  }
  $('camp').innerHTML = `
    <div class="card"><h1>Iso RPG<small>Acampamento · ${training ? 'antes da primeira masmorra' : `${bio.name} (${nth}/${PER_BIOME})`}</small></h1>
      <div class="stats">Guerreiro · HP ${st.hp} · ATK ${st.atk} · DEF ${st.def} <small>· Habilidades: ${owned} · Gemas: ${worn}</small></div></div>
    <div class="res"><span>🪙 ${S.gold}</span><span>💠 ${S.souls}</span><span>🔥 ${S.torches}/5</span><span>🗺 ${S.maps}</span></div>
    <div class="tabs">${[['attrs', 'Atributos'], ['skills', 'Habilidades'], ['forge', 'Forja']].map(([id, n]) => `<button class="${campTab === id ? 'on' : ''}" data-tab="${id}">${n}</button>`).join('')}</div>
    <div class="pane">${pane}</div>
    <button class="btn gold enter" id="enter" ${S.torches < 1 ? 'disabled' : ''}>${training ? 'Entrar no Treinamento' : `Entrar na Masmorra Nv. ${S.level}`}<small>🔥 −1 · ${S.torches < 5 ? `+1 tocha em ${Math.floor(next / 60000)}:${String(Math.floor(next / 1000) % 60).padStart(2, '0')}` : 'tochas cheias'} · chefe: ${bossName}</small></button>`;
  const cp = $('camp'), redo = () => { persist(); renderCamp(); };
  cp.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { campTab = b.dataset.tab; renderCamp(); });
  cp.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = ATTRS.find(x => x.id === b.dataset.a), c = attrCost(a, S.buys[a.id]); if (S.gold < c) return; S.gold -= c; S.buys[a.id]++; redo(); });
  cp.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { const sp = SPECIALS.find(x => x.id === b.dataset.sp); if (S.souls < sp.souls || S.specials.includes(sp.id)) return; S.souls -= sp.souls; S.specials.push(sp.id); redo(); });
  cp.querySelectorAll('[data-forge]').forEach(b => b.onclick = () => {
    const g = GEMS.find(x => x.id === b.dataset.forge); if (S.souls < g.souls || S.gems.includes(g.id)) return;
    S.souls -= g.souls; S.gems.push(g.id); if (S.equipped.length < GEM_SLOTS) S.equipped.push(g.id);   // forjou com encaixe livre: já equipa
    redo();
  });
  cp.querySelectorAll('[data-equip]').forEach(b => b.onclick = () => {
    const id = b.dataset.equip, i = S.equipped.indexOf(id);
    if (i >= 0) S.equipped.splice(i, 1); else if (S.equipped.length < GEM_SLOTS) S.equipped.push(id);
    redo();
  });
  $('enter').onclick = enterDungeon;
  if ($('b-torch')) { $('b-torch').onclick = () => { S.souls--; S.torches++; redo(); }; $('b-map').onclick = () => { S.souls--; S.maps++; redo(); }; }
}
setInterval(() => { if (!B && !$('camp').classList.contains('hidden') && S.torches < 5) renderCamp(); }, 1000);

// ============================================================ entrada (gestos de reação e alvo)

let scale = 1, offX = 0, offY = 0;
const toLogical = e => [(e.clientX - offX) / scale, (e.clientY - offY) / scale];
let gest = null;
$('app').addEventListener('pointerdown', e => {
  if (qteInput) { gest = { x: e.clientX, y: e.clientY, fired: false }; return; }
  // Tocar num monstro escolhe o alvo (no turno do herói).
  if (B && turnResolve && e.target.id === 'view') {
    const [x, y] = toLogical(e);
    let best = null, bd = 90;
    for (const m of alive()) { const [sx, sy] = P(m.gx, m.gy, (TOP[m.art] || 50) / 2); const d = Math.hypot(sx * S_ART - x, sy * S_ART - y); if (d < bd) { bd = d; best = m; } }
    if (best) { B.target = best; log(`Alvo: ${best.name}`); }
  }
});
addEventListener('pointermove', e => {
  if (!gest || gest.fired || !qteInput) return;
  const dx = (e.clientX - gest.x) / scale, dy = (e.clientY - gest.y) / scale;
  if (dy < -40 && Math.abs(dy) > Math.abs(dx)) { gest.fired = true; qteInput('up'); }
  else if (Math.abs(dx) > 40) { gest.fired = true; qteInput('side'); }
});
addEventListener('pointerup', () => { if (gest && !gest.fired && qteInput) qteInput('tap'); gest = null; });
addEventListener('keydown', e => {
  if (qteInput) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); qteInput('tap'); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); qteInput('up'); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); qteInput('side'); }
    return;
  }
  if (B && turnResolve && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    const a = alive(), i = a.indexOf(B.target); B.target = a[(i + (e.key === 'ArrowRight' ? 1 : -1) + a.length) % a.length]; log(`Alvo: ${B.target.name}`);
  }
});

// ============================================================ desenho

const view = $('view');
let ctx = view.getContext('2d'), k = 1;
const low = document.createElement('canvas'), lc = low.getContext('2d');
const dark = document.createElement('canvas'), dc = dark.getContext('2d');
const tint = document.createElement('canvas'), tc = tint.getContext('2d');   // piscada branca de dano

function drawFloor() {
  // De trás para frente (gx + gy crescente), só o que aparece na tela.
  const tiles = artOf(curBiome()).tiles, lay = layoutOf(tiles);
  for (let s = GX0 + GY_MIN; s <= GX1 + GY_MAX; s++) {
    for (let gx = GX0; gx <= GX1; gx++) {
      const gy = s - gx; if (gy < GY_MIN || gy > GY_MAX) continue;
      const [x, y] = P(gx, gy); if (x < -40 || x > AW + 40 || y < -40 || y > AH + 40) continue;
      const im = IMG[`tiles/${tiles}/floor-${String(lay.floor(gx, gy)).padStart(2, '0')}`];
      if (im) lc.drawImage(im, x - 32, y - 27);
      else { lc.fillStyle = (gx + gy) % 2 ? '#3a3d48' : '#33363f'; lc.beginPath(); lc.moveTo(x, y - 16); lc.lineTo(x + 32, y); lc.lineTo(x, y + 16); lc.lineTo(x - 32, y); lc.fill(); }
    }
  }
}
function drawWalls() {
  const tiles = artOf(curBiome()).tiles;
  const list = layoutOf(tiles).walls.slice().sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
  for (const w of list) {
    const [x, y] = P(w.gx, w.gy); if (x < -40 || x > AW + 40 || y < -80 || y > AH + 60) continue;
    w.tiles.forEach((t, lv) => {
      const im = IMG[`tiles/${tiles}/wall-${String(t).padStart(2, '0')}`];
      if (im) lc.drawImage(im, x - 32, y - 47 - lv * WALL_H);
      else { lc.fillStyle = '#4a4e5c'; lc.fillRect(x - 32, y - 16 - (lv + 1) * WALL_H, 64, WALL_H + 16); }
    });
  }
}

function frameOf(o) {
  const sp = SPR.chars[o.art]; if (!sp) return null;
  let name = 'idle', f = 0;
  const a = o.act, t = now();
  if (a && sp.anims[a.name] && (a.hold || t - a.t0 < a.ms)) { name = a.name; const n = sp.anims[name].n; f = Math.min(n - 1, Math.floor((t - a.t0) / a.ms * n)); }
  else if (o.moving && sp.anims.walk) { name = 'walk'; f = Math.floor(t / 100) % sp.anims.walk.n; }
  else if (sp.anims.idle) { f = Math.floor(t / 200 + (o.hx || 0) * 3) % sp.anims.idle.n; }
  else return null;
  const an = sp.anims[name], key = o.art === 'boss' ? `boss/${name}-${S.color}` : `${o.art}/${name}`;
  return IMG[key] ? { im: IMG[key], an, f } : null;
}
function drawActor(o) {
  const gy = o.gy + o.back * o.shove;
  const [fx, fy] = P(o.gx, gy);
  // Sombra no chão (os sprites não têm).
  lc.globalAlpha = 0.35 * o.alpha; lc.fillStyle = '#000';
  const r = o.art === 'boss' ? 20 : 12;
  lc.beginPath(); lc.ellipse(fx, fy, r - o.h * 0.1, (r - o.h * 0.1) * 0.42, 0, 0, Math.PI * 2); lc.fill();
  lc.globalAlpha = o.alpha;
  const fr = frameOf(o);
  if (!fr) { lc.fillStyle = o === hero ? '#5aa9f0' : '#c0503d'; lc.fillRect(fx - 8, fy - 40 - o.h, 16, 40); lc.globalAlpha = 1; return; }
  const { im, an, f } = fr, dx = fx - an.ax, dy = fy - o.h - an.ay;
  // Gosma morrendo: derrete por código (achata e espalha a partir dos pés) em vez de cair para trás.
  if (o.hp <= 0 && o.def && o.def.melt && o.diedAt) {
    const p = Math.min(1, (now() - o.diedAt) / 700);
    lc.save(); lc.translate(fx, fy); lc.scale(1 + 0.6 * p, 1 - 0.85 * p);
    lc.drawImage(im, 0, 0, an.w, an.w, -an.ax, -an.ay, an.w, an.w); lc.restore(); lc.globalAlpha = 1; return;
  }
  lc.drawImage(im, f * an.w, 0, an.w, an.w, dx, dy, an.w, an.w);
  if (o.flash > 0) {
    tint.width = an.w; tint.height = an.w; tc.clearRect(0, 0, an.w, an.w);
    tc.globalCompositeOperation = 'source-over'; tc.drawImage(im, f * an.w, 0, an.w, an.w, 0, 0, an.w, an.w);
    tc.globalCompositeOperation = 'source-atop'; tc.fillStyle = '#fff'; tc.fillRect(0, 0, an.w, an.w);
    lc.globalAlpha = Math.min(0.7, o.flash * 3.5) * o.alpha; lc.drawImage(tint, dx, dy);
  }
  lc.globalAlpha = 1;
}
function drawDecor(d) {
  const k = artOf(curBiome()).decor[d.k], im = IMG[`decor/${k}`], a = SPR.decor[k]; if (!im || !a) return;
  const [x, y] = P(d.gx, d.gy);
  lc.drawImage(im, x - a.ax, y - a.ay + 2);
}
const g2 = (p, i, q) => p.from[i] + (p.to[i] - p.from[i]) * q;
function drawProjectiles() {
  for (const p of projectiles) {
    const q = Math.min(1, (now() - p.t0) / p.ms);
    const g = i => p.from[i] + (p.to[i] - p.from[i]) * q;
    const [x, y] = P(g(0), g(1), g(2) + Math.sin(q * Math.PI) * (p.kind === 'rock' ? 22 : 6));
    if (p.kind === 'arrow') {
      const [x0, y0] = P(p.from[0], p.from[1], p.from[2]), [x1, y1] = P(p.to[0], p.to[1], p.to[2]);
      const len = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / len, uy = (y1 - y0) / len;
      lc.strokeStyle = '#5a3b22'; lc.lineWidth = 1; lc.beginPath(); lc.moveTo(x - ux * 9, y - uy * 9); lc.lineTo(x, y); lc.stroke();
      lc.fillStyle = '#d9d4c8'; lc.fillRect(x, y - 1, 2, 2); lc.fillStyle = '#e5533d'; lc.fillRect(Math.round(x - ux * 9), Math.round(y - uy * 9) - 1, 2, 2);
    } else if (p.kind === 'poison' || p.kind === 'fire' || p.kind === 'arcane') {   // bola de energia com rastro
      const [cIn, cOut] = { poison: ['#e6ff9a', '#62c23a'], fire: ['#fff1a8', '#ff6a1f'], arcane: ['#ffffff', '#a66bff'] }[p.kind];
      for (let k = 1; k <= 3; k++) { const q2 = Math.max(0, q - k * 0.06); const [tx, ty] = P(g2(p, 0, q2), g2(p, 1, q2), g2(p, 2, q2) + Math.sin(q2 * Math.PI) * 6); lc.globalAlpha = 0.5 / k; lc.fillStyle = cOut; lc.fillRect(tx - 1, ty - 1, 3, 3); }
      lc.globalAlpha = 1; lc.fillStyle = cOut; lc.fillRect(x - 2, y - 2, 5, 5); lc.fillStyle = cIn; lc.fillRect(x - 1, y - 1, 3, 3);
    } else if (p.kind === 'thorn') {   // espinho da Dríade
      lc.fillStyle = '#3b2a1c'; lc.fillRect(x - 3, y, 6, 1); lc.fillStyle = '#b48cff'; lc.fillRect(x - 1, y - 1, 2, 2);
    } else if (p.kind === 'ice') {   // estilhaço de gelo do Espírito
      lc.fillStyle = '#e8fbff'; lc.fillRect(x - 1, y - 1, 3, 3); lc.fillStyle = '#7fd4ff'; lc.fillRect(x - 3, y, 2, 1); lc.fillRect(x + 2, y - 1, 2, 1); lc.fillRect(x, y - 3, 1, 2);
    } else { lc.fillStyle = '#2a2226'; lc.fillRect(x - 2, y - 2, 5, 5); lc.fillStyle = '#9a8f86'; lc.fillRect(x - 1, y - 2, 3, 3); }
  }
}

// Luz: escurece tudo e "abre" círculos nas tochas, na fogueira e em volta do herói.
function drawLighting(t) {
  dark.width = AW; dark.height = AH;
  const bio = artOf(curBiome());
  dc.fillStyle = `rgba(${bio.dark},0.66)`; dc.fillRect(0, 0, AW, AH);
  dc.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => { const g = dc.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); dc.fillStyle = g; dc.fillRect(x - r, y - r, r * 2, r * 2); };
  const warm = [];
  for (const L of layoutOf(bio.tiles).lights) { const [x, y] = P(L.gx, L.gy); const fl = 1 + Math.sin(t * 9 + L.gy) * 0.04; hole(x + L.ox, y + L.oy, 78 * fl, 0.95); warm.push([x + L.ox, y + L.oy, 40]); }
  { const [x, y] = P(CAMPFIRE.gx, CAMPFIRE.gy); const fl = 1 + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.3) * 0.04; hole(x, y - 8, 105 * fl, 1); warm.push([x, y - 8, 60]); }
  { const [x, y] = P(hero.gx, hero.gy); hole(x, y - 20, 95, 0.8); }
  if (B) for (const m of alive()) { const [x, y] = P(m.gx, m.gy); if (m.def.boss) hole(x, y - 40, 90, 0.7); else hole(x, y - 20, 55, 0.5); }   // chefe é grande: luz maior
  dc.globalCompositeOperation = 'source-over';
  lc.drawImage(dark, 0, 0);
  lc.globalCompositeOperation = 'lighter';
  for (const [x, y, r] of warm) { const g = lc.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,150,60,0.22)'); g.addColorStop(1, 'rgba(255,120,40,0)'); lc.fillStyle = g; lc.fillRect(x - r, y - r, r * 2, r * 2); }
  lc.globalCompositeOperation = 'source-over';
}

let last = 0, clock = 0, emberT = 0, snowT = 0;
const SNOW = [];
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t; clock += dt;

  // ---- atualização (animações, câmera, efeitos)
  const actors = [hero, ...(B ? B.monsters : [])];
  for (const o of actors) {
    if (o.tw) o.tw.step();
    else if (o !== hero && o.hp > 0) { o.gx += (o.hx - o.gx) * Math.min(1, dt * 6); o.gy += (o.hy - o.gy) * Math.min(1, dt * 6); }
    o.flash = Math.max(0, o.flash - dt); o.shove = Math.max(0, o.shove - dt * 1.6);
    if (o.hp <= 0 && o.diedAt && now() - o.diedAt > 1100) o.alpha = Math.max(0, o.alpha - dt * 2);
  }
  // Em pé a tela é estreita: a câmera centraliza o herói e a sala (que vai do herói, embaixo à
  // esquerda, até os monstros no alto à direita) em vez de deixar espaço para o painel lateral.
  const tgt = PORTRAIT
    ? (!B ? [hero.gx + 0.6, hero.gy + 0.6] : B.camMode === 'hero' ? [hero.gx + 0.3, hero.gy - 1.2] : B.wave === 2 ? [1.8, roomGy(2) - 0.6] : [2.2, roomGy(B.wave) - 0.4])
    : !B ? [hero.gx + 1.6, hero.gy - 1.6] : B.camMode === 'hero' ? [hero.gx, hero.gy - 1.8] : B.wave === 2 ? [1.3, roomGy(2) - 0.3] : [1.6, roomGy(B.wave)];
  cam.gx += (tgt[0] - cam.gx) * Math.min(1, dt * 3.5); cam.gy += (tgt[1] - cam.gy) * Math.min(1, dt * 3.5);
  shake = Math.max(0, shake - dt);
  const sh = shake > 0 ? Math.sin(clock * 90) * 3 : 0;
  camX = Math.round((cam.gx - cam.gy) * HW + sh); camY = Math.round((cam.gx + cam.gy) * HH);
  // Brasas da fogueira.
  // Partículas no ar do bioma (neve, folhas, vaga-lumes, brasas, faíscas), em px de arte da tela.
  const fall = artOf(curBiome()).fall;
  if (fall) {
    snowT -= dt;
    while (snowT <= 0) {
      snowT += fall.rate;
      const up = fall.vy < 0;
      SNOW.push({ x: Math.random() * (AW + 60) - 30, y: up ? AH + 4 : -4, vx: fall.vx * (0.6 + Math.random() * 0.8), vy: fall.vy * (0.7 + Math.random() * 0.6),
        ph: Math.random() * 6, c: fall.colors[Math.floor(Math.random() * fall.colors.length)], sz: Math.random() < 0.3 ? fall.size : 1, tw: fall.twinkle });
    }
  } else SNOW.length = 0;
  emberT -= dt; if (emberT <= 0) { emberT = 0.12; FX.parts.push({ gx: CAMPFIRE.gx, gy: CAMPFIRE.gy, x: (Math.random() - 0.5) * 10, y: -10, vx: (Math.random() - 0.5) * 10, vy: -18 - Math.random() * 14, life: 1 + Math.random(), color: Math.random() < 0.5 ? '#ffb347' : '#ff7a2e', ember: 1 }); }

  // ---- mundo em baixa resolução
  low.width = AW; low.height = AH; lc.imageSmoothingEnabled = false;
  lc.fillStyle = '#0b0910'; lc.fillRect(0, 0, AW, AH);
  drawFloor(); drawWalls();
  const items = [...DECOR.map(d => ({ d: d.gx + d.gy, draw: () => drawDecor(d) })), ...actors.filter(o => o.alpha > 0).map(o => ({ d: o.gx + o.gy + 0.01, draw: () => drawActor(o) }))];
  items.sort((a, b) => a.d - b.d).forEach(i => i.draw());
  drawProjectiles();
  for (let i = FX.parts.length - 1; i >= 0; i--) {
    const p = FX.parts[i]; p.life -= dt; if (p.life <= 0) { FX.parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; if (!p.ember) p.vy += 260 * dt;
    const [x, y] = P(p.gx, p.gy); lc.fillStyle = p.color; lc.fillRect(Math.round(x + p.x), Math.round(y + p.y), 1, 1);
  }
  drawLighting(clock);
  for (let i = SNOW.length - 1; i >= 0; i--) {
    const f = SNOW[i]; f.x += (f.vx + Math.sin(clock * 2 + f.ph) * 6) * dt; f.y += f.vy * dt;
    if (f.y > AH + 6 || f.y < -6) { SNOW.splice(i, 1); continue; }
    lc.globalAlpha = f.tw ? 0.4 + 0.6 * Math.abs(Math.sin(clock * 4 + f.ph)) : 1;
    lc.fillStyle = f.c; lc.fillRect(Math.round(f.x), Math.round(f.y), f.sz, f.sz); lc.globalAlpha = 1;
  }
  if (FX.flash) { lc.globalAlpha = FX.flash[1] * 0.6; lc.fillStyle = FX.flash[0]; lc.fillRect(0, 0, AW, AH); lc.globalAlpha = 1; FX.flash[1] -= dt; if (FX.flash[1] <= 0) FX.flash = null; }

  // ---- ampliação 3× sem suavização + textos na resolução da tela
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(low, 0, 0, AW, AH, 0, 0, AW * S_ART * k, AH * S_ART * k);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  if (B) {
    for (const m of B.monsters) {
      if (m.hp <= 0 || m.alpha <= 0) continue;
      const [x, y] = P(m.gx, m.gy, TOP[m.art] + 10), sx = x * S_ART, sy = y * S_ART, bw = 120;
      ctx.fillStyle = '#000c'; ctx.fillRect(sx - bw / 2 - 2, sy - 2, bw + 4, 14);
      ctx.fillStyle = m.phase2 ? '#ff6b3d' : '#e5533d'; ctx.fillRect(sx - bw / 2, sy, bw * m.hp / m.maxHP, 10);
      const cap = m.def.boss ? 10 : 5; ctx.fillStyle = '#f2c14ecc'; ctx.fillRect(sx - bw / 2, sy + 10, bw * m.tired / cap, 3);
      ctx.font = '600 20px "Pixelify Sans"'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(`${m.name}${m.shields ? ` 🛡${m.shields}` : ''}${m.exhausted ? ' 💫' : ''}`, sx + 2, sy - 6);
      ctx.fillStyle = '#fff'; ctx.fillText(`${m.name}${m.shields ? ` 🛡${m.shields}` : ''}${m.exhausted ? ' 💫' : ''}`, sx, sy - 8);
      if (m === B.target && turnResolve) {
        const [tx, ty] = P(m.gx, m.gy); const bob = Math.sin(clock * 6) * 3;
        ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(tx * S_ART, ty * S_ART, m.def.boss ? 66 : 42, m.def.boss ? 28 : 18, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.moveTo(sx - 12, sy - 40 + bob); ctx.lineTo(sx + 12, sy - 40 + bob); ctx.lineTo(sx, sy - 26 + bob); ctx.fill();
      }
    }
    for (let i = FX.floats.length - 1; i >= 0; i--) {
      const f = FX.floats[i]; f.t += dt; if (f.t > 1.1) { FX.floats.splice(i, 1); continue; }
      const [x, y] = P(f.gx, f.gy, f.h), sy = y * S_ART - f.t * 50;
      ctx.globalAlpha = Math.min(1, 2.2 - f.t * 2); ctx.font = `700 ${f.size}px "Pixelify Sans"`; ctx.textAlign = 'center';
      const half = ctx.measureText(f.text).width / 2 + 8, sx = Math.max(half, Math.min(W - half, x * S_ART));   // não sai pela borda (em pé o herói fica perto dela)
      ctx.fillStyle = '#000'; ctx.fillText(f.text, sx + 3, sy + 3); ctx.fillStyle = f.color; ctx.fillText(f.text, sx, sy);
      ctx.globalAlpha = 1;
    }
    renderChip(); renderBars();
  }
  requestAnimationFrame(frame);
}

function fit() {
  if (PORTRAIT) { H = Math.round(Math.min(1600, Math.max(1280, W * innerHeight / innerWidth))); AH = Math.ceil(H / S_ART); }
  else { W = Math.round(Math.min(1700, Math.max(1280, H * innerWidth / innerHeight))); AW = Math.ceil(W / S_ART); }
  const app = $('app'); app.style.width = `${W}px`; app.style.height = `${H}px`;
  scale = Math.min(innerWidth / W, innerHeight / H);
  offX = (innerWidth - W * scale) / 2; offY = (innerHeight - H * scale) / 2;
  app.style.transform = `translate(${offX}px, ${offY}px) scale(${scale})`;
  const dpr = window.devicePixelRatio || 1;
  view.width = Math.round(W * scale * dpr); view.height = Math.round(H * scale * dpr);
  k = view.width / W;
}

async function boot() {
  document.body.classList.toggle('touch', TOUCH);
  const ks = [];
  for (const [id, sp] of Object.entries(SPR.chars)) for (const a of Object.keys(sp.anims)) {
    if (id === 'boss') for (const c of COLORS) ks.push(`boss/${a}-${c.id}`); else ks.push(`${id}/${a}`);
  }
  for (const [b, t] of Object.entries(SPR.tiles)) {
    for (let i = 0; i < t.floor; i++) ks.push(`tiles/${b}/floor-${String(i).padStart(2, '0')}`);
    for (let i = 0; i < t.wall; i++) ks.push(`tiles/${b}/wall-${String(i).padStart(2, '0')}`);
  }
  for (const d of Object.keys(SPR.decor)) ks.push(`decor/${d}`);
  await Promise.all(ks.map(loadImg));
  S = load();
  if (DEV.has('rich')) { S.gold += 5000; S.souls += 40; persist(); }
  const lv = [...DEV].find(x => /^nv\d+$/.test(x)); if (lv) { S.level = +lv.slice(2); persist(); }
  addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 200)); fit();
  toCamp();
  if (DEV.has('go') || DEV.has('boss') || AUTO) enterDungeon();
  requestAnimationFrame(frame);
}
boot();
