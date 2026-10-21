'use strict';
// Dados do Iso Cards (GDD em IsoCards.md). Números são placeholders de protótipo.

const COLORS = ['branco', 'preto', 'azul', 'verde', 'vermelho'];
const COLOR_NAME = { branco: 'Branco', preto: 'Preto', azul: 'Azul', verde: 'Verde', vermelho: 'Vermelho', incolor: 'Incolor', especial: 'Especial' };
const COLOR_HEX = { branco: '#e8dcb0', preto: '#5b3f7a', azul: '#3f7fc0', verde: '#4f9a48', vermelho: '#c4472f', incolor: '#9aa0a6', especial: '#e0b93e' };

// kind: move | attack | area | self | heal | draw | steal | rage
// area: range = alcance do centro, radius = raio; ally:true acerta aliados (cura)
// status: preso (não move no próximo turno), veneno/queimadura (dano por turno)
const CARDS = {
  // Incolores
  passo:      { name: 'Passo Rápido', color: 'incolor', cost: 1, kind: 'move', move: 2, discard: 1, text: 'Move até 2 casas.' },
  corrida:    { name: 'Corrida', color: 'incolor', cost: 2, kind: 'move', move: 4, discard: 1, text: 'Move até 4 casas.' },
  recuo:      { name: 'Recuo Tático', color: 'incolor', cost: 1, kind: 'move', move: 1, armor: 2, discard: 1, discardMove: 1, text: 'Move 1 casa e ganha 2 de armadura.', discText: '+1 Vigor e move 1 casa' },
  meditar:    { name: 'Meditar', color: 'incolor', cost: 1, kind: 'draw', draw: 1, discard: 3, text: 'Compra 1 carta.' },
  golpe:      { name: 'Golpe', color: 'incolor', cost: 1, kind: 'attack', range: 1, dmg: 3, discard: 1, text: 'Corpo a corpo: 3 de dano.' },
  pedrada:    { name: 'Pedrada', color: 'incolor', cost: 1, kind: 'attack', range: 3, dmg: 2, discard: 1, text: 'Até 3 casas: 2 de dano.' },
  rachada:    { name: 'Carta Rachada', color: 'incolor', cost: 1, kind: 'attack', range: 2, dmg: 1, discard: 2, text: 'Até 2 casas: 1 de dano. Saiu de uma forja que falhou.' },

  // Branco
  golpePesado: { name: 'Golpe Pesado', color: 'branco', cost: 2, kind: 'attack', range: 1, dmg: 6, discard: 1, text: 'Corpo a corpo: 6 de dano.' },
  escudo:      { name: 'Escudo', color: 'branco', cost: 1, kind: 'self', armor: 4, discard: 2, text: 'Ganha 4 de armadura.' },
  bencao:      { name: 'Bênção', color: 'branco', cost: 1, kind: 'heal', range: 2, heal: 4, discard: 1, text: 'Cura 4 de um aliado a até 2 casas.' },
  muralha:     { name: 'Muralha', color: 'branco', cost: 2, kind: 'self', armor: 8, discard: 1, text: 'Ganha 8 de armadura.' },
  // Preto
  dardo:       { name: 'Dardo Arcano', color: 'preto', cost: 1, kind: 'attack', range: 4, dmg: 3, magic: true, discard: 1, text: 'Até 4 casas: 3 de dano mágico.' },
  bolaFogo:    { name: 'Bola de Fogo', color: 'preto', cost: 3, kind: 'area', range: 4, radius: 1, dmg: 4, magic: true, discard: 0, text: 'Até 4 casas: 4 de dano na casa e em volta.' },
  raioSombrio: { name: 'Raio Sombrio', color: 'preto', cost: 2, kind: 'attack', range: 3, dmg: 3, magic: true, status: ['veneno', 3], discard: 1, text: 'Até 3 casas: 3 de dano e veneno por 3 turnos.' },
  drenar:      { name: 'Drenar', color: 'preto', cost: 2, kind: 'attack', range: 2, dmg: 3, magic: true, lifesteal: 3, discard: 1, text: 'Até 2 casas: 3 de dano e cura 3 em quem lança.' },
  // Azul
  flecha:      { name: 'Flecha', color: 'azul', cost: 1, kind: 'attack', range: 5, dmg: 3, discard: 1, text: 'Até 5 casas: 3 de dano.' },
  tiroDuplo:   { name: 'Tiro Duplo', color: 'azul', cost: 2, kind: 'attack', range: 4, dmg: 2, hits: 2, discard: 1, text: 'Até 4 casas: 2 de dano, duas vezes.' },
  passoSombra: { name: 'Passo da Sombra', color: 'azul', cost: 1, kind: 'move', move: 3, discard: 2, text: 'Move até 3 casas.' },
  geada:       { name: 'Geada', color: 'azul', cost: 1, kind: 'attack', range: 3, dmg: 2, magic: true, status: ['preso', 1], discard: 1, text: 'Até 3 casas: 2 de dano e prende o alvo por 1 turno.' },
  // Verde
  raizes:      { name: 'Raízes', color: 'verde', cost: 1, kind: 'attack', range: 3, dmg: 1, magic: true, status: ['preso', 1], discard: 1, text: 'Até 3 casas: 1 de dano e prende o alvo por 1 turno.' },
  curaNatural: { name: 'Cura Natural', color: 'verde', cost: 2, kind: 'heal', range: 3, heal: 6, discard: 1, text: 'Cura 6 de um aliado a até 3 casas.' },
  casca:       { name: 'Casca de Árvore', color: 'verde', cost: 1, kind: 'self', armor: 3, heal: 2, discard: 2, text: 'Ganha 3 de armadura e cura 2.' },
  espinhos:    { name: 'Espinhos', color: 'verde', cost: 2, kind: 'area', range: 3, radius: 1, dmg: 3, magic: true, discard: 1, text: 'Até 3 casas: 3 de dano na casa e em volta.' },
  // Vermelho
  furia:       { name: 'Fúria', color: 'vermelho', cost: 0, kind: 'rage', vigor: 2, hpCost: 3, discard: 0, text: 'Perde 3 de PV e ganha 2 de Vigor.' },
  golpeSelvagem: { name: 'Golpe Selvagem', color: 'vermelho', cost: 2, kind: 'attack', range: 1, dmg: 7, discard: 1, text: 'Corpo a corpo: 7 de dano.' },
  chamas:      { name: 'Chamas', color: 'vermelho', cost: 2, kind: 'attack', range: 2, dmg: 3, magic: true, status: ['queimadura', 2], discard: 1, text: 'Até 2 casas: 3 de dano e queimadura por 2 turnos.' },
  redemoinho:  { name: 'Redemoinho', color: 'vermelho', cost: 2, kind: 'area', range: 0, radius: 1, dmg: 4, discard: 1, text: 'Acerta 4 de dano em todos os inimigos em volta.' },

  // Exclusivas de classe
  golpeDuplo:  { name: 'Golpe Duplo', color: 'branco', classe: 'guerreiro', cost: 2, kind: 'attack', range: 1, dmg: 3, hits: 2, discard: 1, text: 'Corpo a corpo: 3 de dano, duas vezes.' },
  postura:     { name: 'Postura de Guarda', color: 'branco', classe: 'guerreiro', cost: 1, kind: 'self', armor: 6, discard: 1, text: 'Ganha 6 de armadura.' },
  luzSagrada:  { name: 'Luz Sagrada', color: 'branco', classe: 'paladino', cost: 2, kind: 'area', range: 0, radius: 1, heal: 4, ally: true, discard: 1, text: 'Cura 4 em quem lança e nos aliados em volta.' },
  marteloJusto:{ name: 'Martelo Justo', color: 'branco', classe: 'paladino', cost: 2, kind: 'attack', range: 1, dmg: 5, status: ['preso', 1], discard: 1, text: 'Corpo a corpo: 5 de dano e prende o alvo.' },
  meteoro:     { name: 'Meteoro', color: 'preto', classe: 'mago', cost: 3, kind: 'area', range: 5, radius: 1, dmg: 6, magic: true, discard: 0, text: 'Até 5 casas: 6 de dano na casa e em volta.' },
  concentracao:{ name: 'Concentração', color: 'preto', classe: 'mago', cost: 1, kind: 'draw', draw: 2, discard: 2, text: 'Compra 2 cartas.' },
  chuvaFlechas:{ name: 'Chuva de Flechas', color: 'azul', classe: 'arqueiro', cost: 2, kind: 'area', range: 5, radius: 1, dmg: 3, discard: 1, text: 'Até 5 casas: 3 de dano na casa e em volta.' },
  tiroCerteiro:{ name: 'Tiro Certeiro', color: 'azul', classe: 'arqueiro', cost: 2, kind: 'attack', range: 6, dmg: 5, discard: 1, text: 'Até 6 casas: 5 de dano.' },
  adaga:       { name: 'Adaga', color: 'azul', classe: 'ladrao', cost: 1, kind: 'attack', range: 1, dmg: 3, discard: 1, text: 'Corpo a corpo: 3 de dano.' },
  furto:       { name: 'Furto', color: 'azul', classe: 'ladrao', cost: 1, kind: 'steal', range: 1, dmg: 1, discard: 1, text: 'Corpo a corpo: 1 de dano e rouba uma carta do inimigo.' },
  enredar:     { name: 'Enredar', color: 'verde', classe: 'druida', cost: 2, kind: 'area', range: 3, radius: 1, dmg: 1, magic: true, status: ['preso', 1], discard: 1, text: 'Até 3 casas: 1 de dano e prende todos em volta.' },
  regenerar:   { name: 'Regenerar', color: 'verde', classe: 'druida', cost: 1, kind: 'heal', range: 3, heal: 3, armor: 2, discard: 1, text: 'Cura 3 e dá 2 de armadura a um aliado a até 3 casas.' },
  sedeSangue:  { name: 'Sede de Sangue', color: 'vermelho', classe: 'berserker', cost: 2, kind: 'attack', range: 1, dmg: 5, lifesteal: 3, discard: 1, text: 'Corpo a corpo: 5 de dano e cura 3.' },
  frenesi:     { name: 'Frenesi', color: 'vermelho', classe: 'berserker', cost: 0, kind: 'rage', vigor: 3, hpCost: 4, discard: 0, text: 'Perde 4 de PV e ganha 3 de Vigor.' },

  // Bicolores (só forjadas). res = efeito de Ressonância (quem joga tem as duas cores)
  laminaEncantada: { name: 'Lâmina Encantada', color: 'branco', color2: 'preto', cost: 2, kind: 'attack', range: 1, dmg: 5, magic: true, res: { status: ['queimadura', 2] }, discard: 1, text: 'Corpo a corpo: 5 de dano mágico.', resText: 'Ressonância: aplica queimadura.' },
  flechaArcana:    { name: 'Flecha Arcana', color: 'azul', color2: 'preto', cost: 2, kind: 'attack', range: 5, dmg: 4, magic: true, res: { pierce: true }, discard: 1, text: 'Até 5 casas: 4 de dano mágico.', resText: 'Ressonância: atravessa e acerta quem está atrás.' },
  escudoVigilante: { name: 'Escudo Vigilante', color: 'branco', color2: 'azul', cost: 1, kind: 'self', armor: 4, counter: 3, res: { allyArmor: 4 }, discard: 1, text: 'Ganha 4 de armadura e revida 3 no próximo ataque corpo a corpo.', resText: 'Ressonância: aliados vizinhos ganham 4 de armadura.' },

  // Cartas de monstros (podem ser roubadas pelo Ladrão)
  mordida:     { name: 'Mordida', color: 'incolor', cost: 1, kind: 'attack', range: 1, dmg: 3, discard: 1, text: 'Corpo a corpo: 3 de dano.' },
  lingua:      { name: 'Língua Pegajosa', color: 'preto', cost: 1, kind: 'attack', range: 2, dmg: 2, status: ['preso', 1], discard: 1, text: 'Até 2 casas: 2 de dano e prende o alvo.' },
  lanca:       { name: 'Estocada', color: 'incolor', cost: 1, kind: 'attack', range: 2, dmg: 3, discard: 1, text: 'Até 2 casas: 3 de dano.' },
  gosma:       { name: 'Gosma Tóxica', color: 'preto', cost: 1, kind: 'attack', range: 1, dmg: 2, status: ['veneno', 2], discard: 1, text: 'Corpo a corpo: 2 de dano e veneno.' },
  cuspe:       { name: 'Cuspe Venenoso', color: 'preto', cost: 1, kind: 'attack', range: 3, dmg: 2, status: ['veneno', 2], discard: 1, text: 'Até 3 casas: 2 de dano e veneno.' },
  pinca:       { name: 'Pinça Esmagadora', color: 'preto', cost: 2, kind: 'attack', range: 1, dmg: 6, discard: 1, text: 'Corpo a corpo: 6 de dano.' },
  carapaca:    { name: 'Carapaça', color: 'incolor', cost: 1, kind: 'self', armor: 5, discard: 1, text: 'Ganha 5 de armadura.' },
  garra:       { name: 'Garra', color: 'incolor', cost: 1, kind: 'attack', range: 1, dmg: 4, discard: 1, text: 'Corpo a corpo: 4 de dano.' },
  espinho:     { name: 'Espinho', color: 'verde', cost: 1, kind: 'attack', range: 3, dmg: 3, discard: 1, text: 'Até 3 casas: 3 de dano.' },
  ferrao:      { name: 'Ferrão', color: 'branco', cost: 1, kind: 'attack', range: 1, dmg: 3, status: ['veneno', 2], discard: 1, text: 'Corpo a corpo: 3 de dano e veneno.' },
  sopro:       { name: 'Sopro Gélido', color: 'azul', cost: 2, kind: 'attack', range: 3, dmg: 3, status: ['preso', 1], discard: 1, text: 'Até 3 casas: 3 de dano e prende o alvo.' },
  brasa:       { name: 'Brasa', color: 'vermelho', cost: 1, kind: 'attack', range: 3, dmg: 2, status: ['queimadura', 2], discard: 1, text: 'Até 3 casas: 2 de dano e queimadura.' },
  pisao:       { name: 'Pisão', color: 'incolor', cost: 2, kind: 'area', range: 0, radius: 1, dmg: 4, discard: 1, text: 'Acerta 4 de dano em todos em volta.' },
};

// Classes: cor, PV e as 2 exclusivas. O Escudeiro é Incolor e só usa incolores.
const CLASSES = {
  escudeiro: { name: 'Escudeiro', color: 'incolor', hp: 14, cards: [] },
  guerreiro: { name: 'Guerreiro', color: 'branco', hp: 16, cards: ['golpeDuplo', 'postura'] },
  paladino:  { name: 'Paladino', color: 'branco', hp: 15, cards: ['luzSagrada', 'marteloJusto'] },
  mago:      { name: 'Mago', color: 'preto', hp: 10, cards: ['meteoro', 'concentracao'] },
  arqueiro:  { name: 'Arqueiro', color: 'azul', hp: 11, cards: ['chuvaFlechas', 'tiroCerteiro'] },
  ladrao:    { name: 'Ladrão', color: 'azul', hp: 11, cards: ['adaga', 'furto'] },
  druida:    { name: 'Druida', color: 'verde', hp: 12, cards: ['enredar', 'regenerar'] },
  berserker: { name: 'Berserker', color: 'vermelho', hp: 17, cards: ['sedeSangue', 'frenesi'] },
};
const CLASS_CHANGE_COST = 5;   // esferas da cor da classe nova
const CLASS_KIT = 4;           // cópias de cada exclusiva ganhas na 1ª vez na classe
const RECRUIT_COST = 60;
const PARTY_MAX = 6, BATTLE_SIZE = 3, DECK_SIZE = 40;

// Itens: dropados por monstros; a descrição traz a pista da receita escondida
const ITEMS = {
  linguaSapo:   { name: 'Língua de Sapo', text: 'Ainda gruda. Dizem que, com 3 esferas pretas, vira um feitiço que drena a vida.' },
  gosmaNegra:   { name: 'Gosma Negra', text: 'Borbulha sozinha. Os ferreiros a usam com esferas pretas.' },
  presaSerpente:{ name: 'Presa de Serpente', text: 'Pinga veneno. 4 esferas pretas e ela viram um raio sombrio.' },
  carapacaReal: { name: 'Carapaça Real', text: 'Relíquia do Caranguejo-Rei. Forte o bastante para uma lâmina que é luz e sombra ao mesmo tempo.' },
  pelagem:      { name: 'Pelagem de Lobo', text: 'Cheira a mato. Com esferas verdes, protege como casca.' },
  seiva:        { name: 'Seiva Dourada', text: 'Brilha no escuro. Cura feridas quando forjada com 4 esferas verdes.' },
  presaJavali:  { name: 'Presa de Javali', text: 'Pontuda. Com 3 esferas verdes, espalha espinhos.' },
  coracaoAnciao:{ name: 'Coração do Ancião', text: 'Relíquia da floresta. Ainda pulsa.' },
  ferraoEscorp: { name: 'Ferrão de Escorpião', text: 'Uma ferroada pesada. Pede 4 esferas brancas.' },
  bandagem:     { name: 'Bandagem Antiga', text: 'Enrolada com rezas. Abençoa com 3 esferas brancas.' },
  lascaPedra:   { name: 'Lasca de Pedra', text: 'Dura como um muro. 5 esferas brancas a erguem.' },
  nucleoGolem:  { name: 'Núcleo de Golem', text: 'Pulsa com duas forças: a do sol e a da sombra.' },
  penaGrifo:    { name: 'Pena de Grifo', text: 'Leve como vento. 3 esferas azuis viram uma flecha.' },
  cristalGelo:  { name: 'Cristal de Gelo', text: 'Nunca derrete. Prende quem toca, com 3 esferas azuis.' },
  essencia:     { name: 'Essência Espectral', text: 'Some e aparece. Faz andar entre sombras, com 2 esferas azuis.' },
  chifreYeti:   { name: 'Chifre do Yeti', text: 'Relíquia do gelo. Vigia quem chega perto.' },
  escamaFogo:   { name: 'Escama de Salamandra', text: 'Ainda quente. 4 esferas vermelhas a transformam em chamas.' },
  chifreDiabo:  { name: 'Chifre de Diabrete', text: 'Ri sozinho. Desperta a fúria com 2 esferas vermelhas.' },
  magma:        { name: 'Pedra de Magma', text: 'Escorre devagar. Gira com 4 esferas vermelhas.' },
  escamaDragao: { name: 'Escama de Dragão', text: 'Relíquia do vulcão. Atravessa qualquer coisa.' },
};

// Monstros: cor (esferas que dropam), item, baralho, IA (melee/ranged)
const MONSTERS = {
  // Pântano
  homemSapo:  { name: 'Homem-Sapo', color: 'preto', hp: 10, item: 'linguaSapo', deck: { passo: 8, lanca: 8, lingua: 4 } },
  lodo:       { name: 'Lodo do Mangue', color: 'preto', hp: 12, item: 'gosmaNegra', deck: { passo: 10, gosma: 10 } },
  serpente:   { name: 'Serpente do Pântano', color: 'preto', hp: 8, item: 'presaSerpente', deck: { passo: 8, cuspe: 10, mordida: 2 } },
  caranguejo: { name: 'Caranguejo-Rei', color: 'preto', hp: 34, boss: true, item: 'carapacaReal', deck: { passo: 8, pinca: 8, carapaca: 4, mordida: 4 } },
  // Floresta
  lobo:       { name: 'Lobo', color: 'verde', hp: 10, item: 'pelagem', deck: { corrida: 6, passo: 6, mordida: 10 } },
  driade:     { name: 'Dríade', color: 'verde', hp: 9, item: 'seiva', deck: { passo: 8, espinho: 10, raizes: 2 } },
  javali:     { name: 'Javali', color: 'verde', hp: 14, item: 'presaJavali', deck: { corrida: 6, garra: 10 } },
  anciao:     { name: 'Ent Ancião', color: 'verde', hp: 40, boss: true, item: 'coracaoAnciao', deck: { passo: 6, garra: 8, raizes: 6, espinho: 4 } },
  // Deserto
  escorpiao:  { name: 'Escorpião', color: 'branco', hp: 11, item: 'ferraoEscorp', deck: { passo: 8, ferrao: 10 } },
  mumia:      { name: 'Múmia', color: 'branco', hp: 14, item: 'bandagem', deck: { passo: 10, garra: 8, carapaca: 2 } },
  bandido:    { name: 'Bandido do Deserto', color: 'branco', hp: 10, item: 'lascaPedra', deck: { passo: 8, golpe: 8, pedrada: 6 } },
  golemAreia: { name: 'Golem de Areia', color: 'branco', hp: 46, boss: true, item: 'nucleoGolem', deck: { passo: 6, pisao: 6, garra: 8, carapaca: 4 } },
  // Gelo
  grifo:      { name: 'Grifo do Gelo', color: 'azul', hp: 12, item: 'penaGrifo', deck: { corrida: 6, garra: 10 } },
  loboGelo:   { name: 'Lobo de Gelo', color: 'azul', hp: 12, item: 'cristalGelo', deck: { passo: 8, mordida: 8, sopro: 4 } },
  espectro:   { name: 'Espectro', color: 'azul', hp: 10, item: 'essencia', deck: { passo: 8, sopro: 8, geada: 4 } },
  yeti:       { name: 'Yeti', color: 'azul', hp: 50, boss: true, item: 'chifreYeti', deck: { passo: 6, pisao: 6, garra: 8, sopro: 4 } },
  // Fogo
  salamandra: { name: 'Salamandra', color: 'vermelho', hp: 12, item: 'escamaFogo', deck: { passo: 8, brasa: 10 } },
  diabrete:   { name: 'Diabrete', color: 'vermelho', hp: 10, item: 'chifreDiabo', deck: { corrida: 6, garra: 8, brasa: 4 } },
  golemMagma: { name: 'Golem de Magma', color: 'vermelho', hp: 18, item: 'magma', deck: { passo: 8, pisao: 6, garra: 6 } },
  dragao:     { name: 'Dragão', color: 'vermelho', hp: 60, boss: true, item: 'escamaDragao', deck: { passo: 6, brasa: 8, garra: 8, pisao: 4 } },
};

// Mapas de batalha 8x8. Caracteres: '.' chão, '1'/'2' chão elevado, '~' líquido,
// 'r' pedra, 't' árvore (bloqueiam), 'm' decoração baixa (passável).
// heroes: casas de entrada do grupo; foes: [monstro, x, y]
const MAPS = {
  mangueSombrio: { name: 'Mangue Sombrio', rows: [
    '22t...1.',
    '21..r.1.',
    '1...~~..',
    '...~~~.m',
    '..m~~...',
    '......r.',
    '.r....11',
    '......12'], heroes: [[0, 6], [1, 7], [0, 5]], foes: [['homemSapo', 6, 1], ['homemSapo', 7, 3]] },
  raizesAfogadas: { name: 'Raízes Afogadas', rows: [
    't..~~..1',
    '...~~..1',
    '.r.~~.m.',
    '...~~...',
    '..m.....',
    '.....r..',
    '11......',
    '21t.....'], heroes: [[3, 7], [3, 6], [1, 5]], foes: [['lodo', 6, 1], ['serpente', 7, 0], ['lodo', 5, 3]] },
  tronoCaranguejo: { name: 'Trono do Caranguejo', rows: [
    '~~~~2211',
    '~~~~2111',
    '~~~.11..',
    '~~...r..',
    '.m......',
    '..r...m.',
    '1.......',
    '21.....t'], heroes: [[1, 7], [2, 6], [0, 5]], foes: [['caranguejo', 5, 1], ['homemSapo', 4, 3], ['lodo', 6, 3]] },

  clareira: { name: 'Clareira', rows: [
    't..t..11',
    '......12',
    '.r..m...',
    '........',
    '..m.t...',
    '........',
    '11...r..',
    '21....t.'], heroes: [[1, 7], [2, 6], [0, 5]], foes: [['lobo', 6, 1], ['lobo', 7, 3], ['driade', 6, 0]] },
  riachoVerde: { name: 'Riacho Verde', rows: [
    '..~~..t.',
    '..~~....',
    '.m.~~.1.',
    '...~~.11',
    't...~~..',
    '....~~..',
    '.r...~~.',
    '......~~'], heroes: [[0, 6], [1, 7], [1, 4]], foes: [['javali', 7, 2], ['driade', 7, 0], ['lobo', 5, 1]] },
  bosqueAnciao: { name: 'Bosque do Ancião', rows: [
    't.t.1122',
    '....1122',
    '.m...11.',
    't.......',
    '...r....',
    '......m.',
    '1.......',
    '21t...t.'], heroes: [[1, 7], [2, 6], [0, 5]], foes: [['anciao', 6, 1], ['driade', 4, 0], ['javali', 7, 3]] },

  dunas: { name: 'Dunas', rows: [
    '..11..r.',
    '.1221...',
    '..11....',
    '......m.',
    '.r......',
    '....11..',
    '...1221.',
    '....11..'], heroes: [[0, 7], [1, 6], [0, 5]], foes: [['escorpiao', 6, 1], ['bandido', 7, 0], ['mumia', 7, 3]] },
  oasis: { name: 'Oásis', rows: [
    't......1',
    '..~~...1',
    '.~~~~..m',
    '.~~~~...',
    '..~~..r.',
    '........',
    '1.r.....',
    '21......'], heroes: [[1, 7], [3, 6], [0, 5]], foes: [['mumia', 6, 1], ['escorpiao', 7, 3], ['bandido', 7, 4]] },
  ruinasSol: { name: 'Ruínas do Sol', rows: [
    'r.1221.r',
    '..1221..',
    '...11...',
    '.r....r.',
    '........',
    '..m..m..',
    '1......1',
    '21....12'], heroes: [[1, 7], [2, 6], [5, 7]], foes: [['golemAreia', 3, 1], ['bandido', 1, 2], ['escorpiao', 6, 2]] },

  geleira: { name: 'Geleira', rows: [
    '..r..112',
    '......11',
    '.~~~....',
    '.~~~..r.',
    '....m...',
    '........',
    '11..r...',
    '21......'], heroes: [[1, 7], [2, 6], [0, 5]], foes: [['loboGelo', 6, 1], ['loboGelo', 7, 3], ['espectro', 7, 0]] },
  lagoCongelado: { name: 'Lago Congelado', rows: [
    '1.......',
    '..~~~~..',
    '.~~~~~~.',
    '.~~~~~~.',
    '..~~~~..',
    '.r....m.',
    '........',
    '11....r.'], heroes: [[0, 6], [1, 7], [2, 6]], foes: [['grifo', 7, 1], ['espectro', 6, 0], ['grifo', 7, 4]] },
  picoYeti: { name: 'Pico do Yeti', rows: [
    '..112211',
    '..122221',
    '...1221.',
    '.r......',
    '........',
    '..m...r.',
    '11......',
    '21......'], heroes: [[1, 7], [2, 6], [0, 5]], foes: [['yeti', 4, 1], ['loboGelo', 2, 2], ['espectro', 7, 3]] },

  campoCinzas: { name: 'Campo de Cinzas', rows: [
    '.r....11',
    '......12',
    '..~~....',
    '..~~..m.',
    '.......r',
    '.m......',
    '11..r...',
    '21......'], heroes: [[1, 7], [2, 6], [0, 5]], foes: [['salamandra', 6, 1], ['diabrete', 7, 3], ['salamandra', 7, 0]] },
  rioLava: { name: 'Rio de Lava', rows: [
    '...~~...',
    '...~~..1',
    '.r..~~.1',
    '....~~..',
    '.m...~~.',
    '.....~~.',
    '1.....~~',
    '21.....~'], heroes: [[0, 6], [1, 7], [0, 4]], foes: [['golemMagma', 7, 1], ['diabrete', 6, 0], ['salamandra', 6, 3]] },
  covilDragao: { name: 'Covil do Dragão', rows: [
    '~~.11221',
    '~..12221',
    '...1111.',
    '.r......',
    '........',
    '..m..r..',
    '1.......',
    '21.....~'], heroes: [[1, 7], [2, 6], [0, 5]], foes: [['dragao', 5, 1], ['golemMagma', 3, 2], ['diabrete', 7, 3]] },
};

// Regiões na ordem da trilha. Cada uma: Cidade, 2 Campos (rotas alternativas) e o Ponto de história.
const REGIONS = [
  { key: 'pantano', name: 'Pântano', color: 'preto', city: 'Vila do Mangue', fields: ['mangueSombrio', 'raizesAfogadas'], boss: 'tronoCaranguejo', sells: ['preto', 'verde'], sky: '#0d1618' },
  { key: 'floresta', name: 'Floresta', color: 'verde', city: 'Clareira dos Druidas', fields: ['clareira', 'riachoVerde'], boss: 'bosqueAnciao', sells: ['verde', 'preto', 'branco'], sky: '#0f1a12' },
  { key: 'deserto', name: 'Deserto', color: 'branco', city: 'Oásis de Areia', fields: ['dunas', 'oasis'], boss: 'ruinasSol', sells: ['branco', 'verde', 'azul'], sky: '#1d160e' },
  { key: 'gelo', name: 'Gelo', color: 'azul', city: 'Forte do Norte', fields: ['geleira', 'lagoCongelado'], boss: 'picoYeti', sells: ['azul', 'branco', 'vermelho'], sky: '#0e1620' },
  { key: 'fogo', name: 'Fogo', color: 'vermelho', city: 'Cidade de Brasa', fields: ['campoCinzas', 'rioLava'], boss: 'covilDragao', sells: ['vermelho', 'azul'], sky: '#1c0e0b' },
];
const PRICE_LOCAL = 10, PRICE_NEAR = 18, PRICE_INCOLOR = 8;

// Receitas: esferas exatas + 1 item → 2 cópias da carta.
// learned: o ferreiro da Cidade da região ensina; as outras se descobrem testando.
const FORGE_COPIES = 2;
const RECIPES = [
  // Pântano (Preto)
  { card: 'dardo', spheres: { preto: 2 }, item: 'gosmaNegra', region: 'pantano', learned: true },
  { card: 'bolaFogo', spheres: { preto: 4 }, item: 'gosmaNegra', region: 'pantano', learned: true },
  { card: 'raioSombrio', spheres: { preto: 4 }, item: 'presaSerpente', region: 'pantano' },
  { card: 'drenar', spheres: { preto: 3 }, item: 'linguaSapo', region: 'pantano' },
  // Floresta (Verde)
  { card: 'raizes', spheres: { verde: 2 }, item: 'pelagem', region: 'floresta', learned: true },
  { card: 'casca', spheres: { verde: 3 }, item: 'pelagem', region: 'floresta', learned: true },
  { card: 'curaNatural', spheres: { verde: 4 }, item: 'seiva', region: 'floresta' },
  { card: 'espinhos', spheres: { verde: 3 }, item: 'presaJavali', region: 'floresta' },
  { card: 'laminaEncantada', spheres: { branco: 3, preto: 3, especial: 1 }, item: 'carapacaReal', region: 'floresta' },
  // Deserto (Branco)
  { card: 'escudo', spheres: { branco: 2 }, item: 'bandagem', region: 'deserto', learned: true },
  { card: 'golpePesado', spheres: { branco: 4 }, item: 'ferraoEscorp', region: 'deserto', learned: true },
  { card: 'bencao', spheres: { branco: 3 }, item: 'bandagem', region: 'deserto' },
  { card: 'muralha', spheres: { branco: 5 }, item: 'lascaPedra', region: 'deserto' },
  { card: 'escudoVigilante', spheres: { branco: 3, azul: 3, especial: 1 }, item: 'nucleoGolem', region: 'deserto' },
  // Gelo (Azul)
  { card: 'flecha', spheres: { azul: 3 }, item: 'penaGrifo', region: 'gelo', learned: true },
  { card: 'geada', spheres: { azul: 3 }, item: 'cristalGelo', region: 'gelo', learned: true },
  { card: 'passoSombra', spheres: { azul: 2 }, item: 'essencia', region: 'gelo' },
  { card: 'tiroDuplo', spheres: { azul: 4 }, item: 'penaGrifo', region: 'gelo' },
  { card: 'flechaArcana', spheres: { azul: 3, preto: 3, especial: 1 }, item: 'chifreYeti', region: 'gelo' },
  // Fogo (Vermelho)
  { card: 'chamas', spheres: { vermelho: 4 }, item: 'escamaFogo', region: 'fogo', learned: true },
  { card: 'golpeSelvagem', spheres: { vermelho: 4 }, item: 'magma', region: 'fogo', learned: true },
  { card: 'furia', spheres: { vermelho: 2 }, item: 'chifreDiabo', region: 'fogo' },
  { card: 'redemoinho', spheres: { vermelho: 4 }, item: 'chifreDiabo', region: 'fogo' },
];

// Grupo inicial: 3 Escudeiros com baralhos incolores e 5 esferas pretas
const START_NAMES = ['Caio', 'Lia', 'Duda'];
const RECRUIT_NAMES = ['Tito', 'Bela', 'Nino', 'Mara', 'Rui', 'Iara', 'Beto', 'Luna', 'Davi', 'Sol'];
const STARTER_DECK = { passo: 10, corrida: 3, recuo: 3, meditar: 4, golpe: 14, pedrada: 6 };
const START_SPHERES = { preto: 5 };
const START_GOLD = 40;
