'use strict';
// Bolsa de Heróis: dados do protótipo (GDD em BolsaDeHerois.md, Parte 1).
// Tudo que é número de balanceamento mora aqui; game.js só tem as regras.

// Configuração (Parte 1 §8 e §12; todos "proposta").
const CONFIG = {
  draw: [4, 5, 6, 7, 8, 9],       // Trilha de Fôlego: fichas tiradas por rodada em cada nível
  reserve: [1, 2, 3, 4, 5],       // Trilha de Reserva: casas da Reserva em cada nível
  maxPages: 8,
  xpPerLevel: 10,
  layers: 7,                      // camadas do mapa da run (a última é o Chefe)
  campHeal: 0.3,
  tokenPrice: 15, pagePrice: 40, treatPrice: 20,
  knockoutHp: 1, woundsOnKnockout: 2,
};

// Fichas (Parte 1 §5). bad = não encaixa em nada.
const TOKENS = {
  for: { name: 'Força', short: 'FOR', color: '#c8402f', light: '#ff8a6e' },
  agi: { name: 'Agilidade', short: 'AGI', color: '#3f8f3a', light: '#8fe07a' },
  man: { name: 'Mana', short: 'MAN', color: '#3456c4', light: '#8fb0ff' },
  foc: { name: 'Foco', short: 'FOC', color: '#c99a1c', light: '#ffe27a' },
  fer: { name: 'Ferida', short: 'FER', color: '#5e5e66', light: '#a9a9b4', bad: true },
  med: { name: 'Medo', short: 'MED', color: '#6b2f8a', light: '#c08cff', bad: true },
};
// Casa "Qualquer": aceita qualquer ficha boa.
const ANY = { short: 'QQ', color: '#8a8f9c', light: '#e2e6ee' };

// Páginas do livro (Parte 1 §7.1 e §7.2).
// target: self (sem alvo), move (casa alcançável andando), enemy, ally, cell (área).
// effects em ordem: dmg {n, r}, move {n}, shield {n}, recruit {tok}, treat {n}, clearFear {r}.
const PAGES = {
  passo:       { name: 'Passo', kind: 'Movimento', slots: ['qq'], target: 'move', effects: [{ t: 'move', n: 2 }], desc: 'Anda até 2 casas.' },
  golpe:       { name: 'Golpe', kind: 'Simples', slots: ['for'], target: 'enemy', range: 1, effects: [{ t: 'dmg', n: 3 }], desc: '3 de dano num inimigo adjacente.' },
  escudo:      { name: 'Erguer Escudo', kind: 'Suporte', slots: ['for', 'foc'], target: 'ally', range: 1, effects: [{ t: 'shield', n: 5 }], desc: '5 de escudo em si ou num aliado adjacente.' },
  redemoinho:  { name: 'Redemoinho', kind: 'Especial', slots: ['for', 'for', 'agi', 'foc'], target: 'self', effects: [{ t: 'dmg', n: 4, r: 1 }], desc: '4 de dano em todos os inimigos adjacentes.' },
  treino:      { name: 'Treino', kind: 'Recrutar', slots: ['foc', 'qq'], target: 'self', effects: [{ t: 'recruit', tok: 'for' }], desc: '+1 Força na bag (vale para a run toda).' },
  flecha:      { name: 'Flecha', kind: 'Simples', slots: ['agi'], target: 'enemy', range: 5, effects: [{ t: 'dmg', n: 2 }], desc: '2 de dano, alcance 5.' },
  corrida:     { name: 'Corrida', kind: 'Movimento', slots: ['agi', 'agi'], target: 'move', effects: [{ t: 'move', n: 4 }], desc: 'Anda até 4 casas.' },
  tiroCerteiro:{ name: 'Tiro Certeiro', kind: 'Especial', slots: ['agi', 'agi', 'foc', 'foc'], target: 'enemy', range: 7, effects: [{ t: 'dmg', n: 8 }], desc: '8 de dano, alcance 7.' },
  cacada:      { name: 'Caçada', kind: 'Recrutar', slots: ['foc', 'qq'], target: 'self', effects: [{ t: 'recruit', tok: 'agi' }], desc: '+1 Agilidade na bag (vale para a run toda).' },
  faisca:      { name: 'Faísca', kind: 'Simples', slots: ['man'], target: 'enemy', range: 4, effects: [{ t: 'dmg', n: 2 }], desc: '2 de dano, alcance 4.' },
  barreira:    { name: 'Barreira Arcana', kind: 'Suporte', slots: ['man', 'foc'], target: 'ally', range: 3, effects: [{ t: 'shield', n: 4 }], desc: '4 de escudo num aliado a até 3 casas.' },
  bolaDeFogo:  { name: 'Bola de Fogo', kind: 'Especial', slots: ['man', 'man', 'foc'], target: 'cell', range: 4, effects: [{ t: 'dmg', n: 3, r: 1 }], desc: '3 de dano em área (raio 1), alcance 4.' },
  estudo:      { name: 'Estudo', kind: 'Recrutar', slots: ['foc', 'qq'], target: 'self', effects: [{ t: 'recruit', tok: 'man' }], desc: '+1 Mana na bag (vale para a run toda).' },
  // Páginas de recompensa
  meteoro:     { name: 'Meteoro', kind: 'Especial', slots: ['man', 'man', 'man', 'foc', 'foc'], target: 'cell', range: 5, effects: [{ t: 'dmg', n: 7, r: 1 }], desc: '7 de dano em área (raio 1), alcance 5. Use a Reserva para juntar as 5 fichas.' },
  investida:   { name: 'Investida', kind: 'Especial', slots: ['for', 'agi', 'agi'], target: 'move', effects: [{ t: 'move', n: 3 }, { t: 'dmg', n: 4, r: 1 }], desc: 'Anda até 3 casas e dá 4 de dano nos inimigos adjacentes ao destino.' },
  chuva:       { name: 'Chuva de Flechas', kind: 'Especial', slots: ['agi', 'agi', 'agi', 'foc'], target: 'cell', range: 6, effects: [{ t: 'dmg', n: 2, r: 1 }], desc: '2 de dano em área (raio 1), alcance 6.' },
  atadura:     { name: 'Atadura', kind: 'Suporte', slots: ['foc', 'qq'], target: 'ally', range: 1, effects: [{ t: 'treat', n: 1 }], desc: 'Tira 1 Ferida da bag de si ou de um aliado adjacente.' },
  grito:       { name: 'Grito de Guerra', kind: 'Suporte', slots: ['for', 'foc'], target: 'self', effects: [{ t: 'clearFear', r: 3 }], desc: 'Tira todo o Medo dos aliados a até 3 casas.' },
};

// Heróis (Parte 1 §4). Ordem fixa das abas: Guerreiro, Arqueiro, Mago.
const HERO_ORDER = ['guerreiro', 'arqueiro', 'mago'];
const HEROES = {
  guerreiro: { name: 'Guerreiro', hp: 24, bag: { for: 4, agi: 2, foc: 2 }, pages: ['passo', 'golpe', 'escudo', 'redemoinho', 'treino'],
               favored: ['for', 'for', 'foc'], rewardPages: ['investida', 'grito', 'atadura'] },
  arqueiro:  { name: 'Arqueiro', hp: 18, bag: { agi: 4, foc: 2, for: 2 }, pages: ['passo', 'flecha', 'corrida', 'tiroCerteiro', 'cacada'],
               favored: ['agi', 'agi', 'foc'], rewardPages: ['chuva', 'atadura'] },
  mago:      { name: 'Mago', hp: 16, bag: { man: 4, foc: 2, agi: 2 }, pages: ['passo', 'faisca', 'barreira', 'bolaDeFogo', 'estudo'],
               favored: ['man', 'man', 'foc'], rewardPages: ['meteoro', 'atadura'] },
};

// Inimigos da Floresta (Parte 1 §11). shout = a cada N rodadas grita (Medo) em vez de atacar.
const ENEMIES = {
  lobo:    { name: 'Lobo', hp: 8, move: 4, range: 1, dmg: 3, shout: 3 },
  javali:  { name: 'Javali', hp: 12, move: 3, range: 1, dmg: 4, wound: true },
  bandido: { name: 'Bandido', hp: 10, move: 3, range: 4, dmg: 2 },
  lodo:    { name: 'Lodo', hp: 14, move: 2, range: 1, dmg: 2, wound: true },
  grifo:   { name: 'Grifo', hp: 40, move: 5, range: 1, dmg: 6, wound: true, shout: 3, boss: true },
};

// Encontros (Unity guia, Fase 6.5).
const ENCOUNTERS = {
  lobos:   { tier: 'normal', enemies: ['lobo', 'lobo'], xp: 4, gold: 10 },
  estrada: { tier: 'normal', enemies: ['bandido', 'javali'], xp: 4, gold: 10 },
  brejo:   { tier: 'normal', enemies: ['lodo', 'lodo', 'lobo'], xp: 4, gold: 10 },
  elite:   { tier: 'elite', enemies: ['javali', 'javali', 'bandido', 'lobo'], xp: 7, gold: 20 },
  chefe:   { tier: 'boss', enemies: ['grifo', 'lobo'], xp: 10, gold: 40 },
};
