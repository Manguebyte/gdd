// Protocolo Ectoplasma — protótipo jogável em JavaScript puro.
// Segue a Parte 1 do GDD_Protocolo_Ectoplasma.md: core loop da §5 e estrutura da §6.6 (cidade → 4 bairros →
// imóveis → 3 etapas: rua, térreo e porão), ameaça visível e sem bloqueio dentro do bairro (§6.1), sucção segurando
// o botão com regeneração ao soltar e estabilidade de mira (§6.2), as duas armadilhas (§6.3), a árvore de upgrades
// (§6.4), os 4 tipos de fantasma da §7 com o Residual como chefe de cada bairro, e o arco do Ato 1 ao Ato 3 (§3.2).
// Arte: Sprites/ProtocoloEctoplasma/.
'use strict';

const ART = '../../Sprites/ProtocoloEctoplasma/';
const W = 480, H = 270;           // cena em pixels de arte, desenhada em 2×
const SAVE_KEY = 'ectoplasma-save-v2';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ============================================================ dados de design (números do protótipo)

// §6.4. Preço do nível seguinte; o decodificador é o "upgrade de história" (lê a memória antes de sugar).
// A lanterna é a proposta "Em aberto" da §6.6 para o escuro do porão.
const UPG = {
  suck:    { name: 'Velocidade de sucção', desc: '+30% de plasma sugado por segundo', max: 5 },
  tank:    { name: 'Tanque da mochila',    desc: '+30 de energia de sucção',          max: 5 },
  range:   { name: 'Alcance de mira',      desc: 'Feixe mais longo · +20% do alcance inicial', max: 5 },
  resist:  { name: 'Resistência',          desc: '−12% de dano dos contra-ataques',    max: 4 },
  traps:   { name: 'Armadilhas',           desc: '+1 armadilha em campo, +30% de força', max: 3 },
  lamp:    { name: 'Lanterna',             desc: 'Facho ampliado · +35% do raio inicial', max: 3 },
  decoder: { name: 'Decodificador de memórias', desc: 'lê a memória de cada fantasma antes de sugar', max: 1 },
};
const PRICES = [40, 90, 160, 250, 360];
const upgPrice = (id, lvl) => id === 'decoder' ? 150 : id === 'lamp' ? [60, 140, 240][lvl] : PRICES[lvl];

const stat = {
  suck:    () => 20 * (1 + 0.3 * S.up.suck),     // plasma/s sugado com a mira parada
  tankMax: () => 100 + 30 * S.up.tank,
  range:   () => 90 + 18 * S.up.range,
  resist:  () => 1 - 0.12 * S.up.resist,
  slots:   () => 2 + S.up.traps,
  trapPow: () => 1 + 0.3 * S.up.traps,
  light:   () => 62 + 22 * S.up.lamp,           // raio da lanterna no escuro
};
const TANK_DRAIN = 22, TANK_REFILL = 18;         // energia/s gasta sugando e recuperada parado
const MOVING_PENALTY = 0.5;                       // §6.2: sugar andando rende metade
const REGEN_DELAY = 1.2;                          // s sem ser sugado antes de o plasma voltar
const SPEED = 72, PUDDLE_SLOW = 0.55;             // px/s do operador; poças do Beira-rio deixam lento

const TRAPS = {
  auto: { name: 'Armadilha autônoma', img: 'traps/armadilha_autonoma', price: 25, key: 'Q', radius: 55, desc: 'suga sozinha o fantasma mais perto, mais devagar que você' },
  sup:  { name: 'Armadilha de suporte', img: 'traps/armadilha_suporte', price: 20, key: 'E', radius: 60, desc: 'atrai fantasmas, desacelera e impede a regeneração' },
};

// §7. plasma = reserva do fantasma; regen = plasma/s de volta quando ninguém suga; reward = plasma que vira moeda.
const GHOSTS = {
  errante:     { name: 'Errante',     img: 'ghosts/errante',       size: 48, r: 12, plasma: 60,  regen: 6,  reward: 40,  speed: 12 },
  assombrado:  { name: 'Assombrado',  img: 'ghosts/assombrado',    size: 48, r: 13, plasma: 70,  regen: 8,  reward: 55,  speed: 20, flee: 62 },
  poltergeist: { name: 'Poltergeist', img: 'ghosts/poltergeist',   size: 48, r: 15, plasma: 90,  regen: 8,  reward: 70,  speed: 16, dmg: 5, throwEvery: 3.4 },
  residual:    { name: 'Residual',    img: 'ghosts/residual_boss', size: 96, r: 30, plasma: 360, regen: 12, reward: 250, speed: 9,  dmg: 8, boss: true },
};

// §6.6: 4 bairros (os ícones do mapa, em 960×540), cada um com imóveis de 3 etapas; o último é o chefe Residual.
// Temas da proposta "Em aberto" da §6.6: poças no Beira-rio, mais Poltergeists no Nobre, escuro no Centro Antigo.
const E = 'errante', A = 'assombrado', P = 'poltergeist', R = 'residual';
const BAIRROS = [
  { id: 'vila', name: 'Vila Operária', mx: 622, my: 91, theme: 'Casas simples de uma rua só. Bom lugar para aprender o serviço.', imoveis: [
    { id: 'acacias', name: 'Casa da Rua das Acácias, 12', threat: 1, etapas: [[E, E], [E, E, E], [E, A]] },
    { id: 'largo',   name: 'Sobrado do Largo',            threat: 2, etapas: [[E, A], [A, E, A], [A, E, E]] },
    { id: 'vila4',   name: 'Vila Operária, casa 4',       threat: 2, boss: true, etapas: [[E, A, E], [P, A], [R]] },
  ] },
  { id: 'rio', name: 'Beira-rio', mx: 825, my: 221, puddles: true, theme: 'Alagado: poças de ectoplasma deixam o operador lento.', imoveis: [
    { id: 'palafita', name: 'Casa da Palafita',      threat: 2, etapas: [[E, A, E], [A, P, E], [A, A, E]] },
    { id: 'cais',     name: 'Sobrado do Cais',       threat: 3, etapas: [[A, E, A], [P, A, E], [P, A, A]] },
    { id: 'ponte',    name: 'Casarão da Ponte',      threat: 3, boss: true, etapas: [[A, P, E], [P, P, A], [R, E]] },
  ] },
  { id: 'nobre', name: 'Bairro Nobre', mx: 611, my: 455, theme: 'Mansões cheias de móveis: mais Poltergeists.', imoveis: [
    { id: 'jardins',  name: 'Mansão dos Jardins',    threat: 3, etapas: [[P, E, A], [P, P, E], [P, A, A]] },
    { id: 'ipes',     name: 'Palacete dos Ipês',     threat: 4, etapas: [[P, A, P], [P, P, A], [P, P, A]] },
    { id: 'baronesa', name: 'Solar da Baronesa',     threat: 4, boss: true, etapas: [[P, A, A], [P, P, P], [R, P]] },
  ] },
  { id: 'centro', name: 'Centro Antigo', mx: 825, my: 480, dark: true, theme: 'Sem luz desde a contaminação: até o térreo fica no escuro.', imoveis: [
    { id: 'pensao',   name: 'Pensão São Jorge',      threat: 4, etapas: [[A, P, E], [P, A, A], [P, P, A]] },
    { id: 'cinema',   name: 'Antigo Cine Avenida',   threat: 5, etapas: [[P, A, P], [P, P, A], [A, P, P]] },
    { id: 'matriz',   name: 'Casa Paroquial da Matriz', threat: 5, boss: true, etapas: [[P, A, P], [P, P, A], [R, P, A]] },
  ] },
];
const ETAPA_NAMES = ['Rua', 'Térreo', 'Porão'];
const threatMul = t => 1 + 0.3 * (t - 1);         // ameaça vira números (§6.1), não bloqueio: regeneração e plasma
const dmgMul = t => 1 + 0.15 * (t - 1);           // e, mais suave, o dano dos contra-ataques
const RECOMMENDED = [0, 0, 1, 3, 6, 9];           // níveis de upgrade somados sugeridos por ameaça
const RISK = ['adequado', 'arriscado', 'perigoso', 'suicida'];
const CONTRACT = 60;                              // bônus por imóvel limpo, × ameaça

// Memórias (§7: cada tipo tem uma memória associada; §3.2 Ato 2: pistas de que eram pessoas).
const MEMORIES = {
  errante:     ['"Já coloquei a mesa, Antônio. Vem jantar."', 'Uma cantiga de ninar, sempre pela metade.', '"Quem vai regar as samambaias agora?"', 'Cheiro de café passado às seis da manhã.', '"Fecha a janela, que vai chover."'],
  assombrado:  ['Passos de criança subindo a escada, correndo.', '"Não me tira daqui. Essa casa é minha."', 'Um nome riscado no batente: LÚCIA, 1987.', '"Esconde-esconde! Conta até dez!"'],
  poltergeist: ['A poltrona favorita, onde ninguém mais podia sentar.', '"Vocês venderam o meu piano!"', 'O abajur que sempre acendia às seis da tarde.', '"Tira a mão das minhas coisas."'],
  residual:    ['Dezenas de vozes da mesma rua, ao mesmo tempo: "a gente morava aqui".'],
};
// Bilhetes achados no térreo (§3.2): do tom de "job" no 1º bairro às pistas do Ato 2 e ao gancho do Ato 3.
const NOTES = {
  vila:   ['Recibo de aluguel: "Família Souza, três gerações nesta casa."', 'Lista de compras: pão, leite, remédio da vó.', 'Folheto da LimpaCorp: "Seu bairro de volta ao mercado!"'],
  rio:    ['Carta: "Mãe, eu sei que é você que liga a luz da cozinha."', 'Foto molhada de um aniversário. Atrás: "nossa última festa aqui".', 'Abaixo-assinado: "Não à extração no Cais".'],
  nobre:  ['Diário: "Ele toca o piano toda noite. Eu não tenho coragem de vender."', 'Contrato rasgado com a LimpaCorp. Na margem: "assassinos".', 'Bilhete infantil: "Vovô, a gente ainda te escuta."'],
  centro: ['Crachá: "LimpaCorp — Projeto PONTE — acesso restrito".', 'Relatório: "Sujeito respondeu ao próprio nome. Recomendo pausa." Carimbo: IGNORADO.', 'E-mail impresso: "Comunicação não gera plasma. Arquivem a PONTE."'],
};

// Tileset Wang rua/calçada: cantos NW NE SW SE (1 = calçada) → coluna/linha do tile (tirado do rua_calcada.json).
const WANG = { '0000': [2, 1], '0001': [3, 1], '0010': [2, 2], '0011': [1, 2], '0100': [2, 0], '0101': [3, 2], '0110': [0, 1], '0111': [3, 3],
  '1000': [1, 1], '1001': [2, 3], '1010': [1, 0], '1011': [0, 2], '1100': [3, 0], '1101': [0, 0], '1110': [1, 3], '1111': [0, 3] };

const DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
const WALK_FRAMES = 8;                            // caminhada do operador (PixelLab, template walking-8-frames)

// ============================================================ sons (sintetizados no navegador, sem arquivos)

// O áudio está "Em aberto" no GDD; estes sons existem para dar peso à sucção, à captura e aos golpes.
// M liga e desliga. O navegador só libera o áudio depois do primeiro clique ou tecla (SFX.unlock).
const SFX = (() => {
  let ac = null, master = null, noiseBuf = null, hum = null, muted = false;
  try { muted = localStorage.getItem('ectoplasma-muted') === 'true'; } catch (e) {}
  function audio() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC(); master = ac.createGain(); master.gain.value = muted ? 0 : 0.45; master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  // Nota com glissando de f0 para f1.
  function tone(type, f0, f1, dur, vol, delay = 0) {
    if (!ac || muted) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  // Ruído filtrado com o filtro indo de f0 para f1 (batidas, assobios).
  function noise(filter, f0, f1, dur, vol, q = 1, delay = 0) {
    if (!ac || muted) return;
    const t = ac.currentTime + delay, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; f.type = filter; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(master); src.start(t); src.stop(t + dur + 0.02);
  }
  // Ronco contínuo do aspirador: serra grave + ruído soprado. Fica ligado o tempo todo, com volume zero em silêncio.
  function buildHum() {
    const o = ac.createOscillator(), lp = ac.createBiquadFilter(), go = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = 70; lp.type = 'lowpass'; lp.frequency.value = 500; go.gain.value = 0;
    o.connect(lp).connect(go).connect(master); o.start();
    const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), gn = ac.createGain();
    n.buffer = noiseBuf; n.loop = true; bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.value = 900; gn.gain.value = 0;
    n.connect(bp).connect(gn).connect(master); n.start();
    return { o, go, bp, gn };
  }
  return {
    unlock() { audio(); },
    isMuted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.45;
      if (hum) { hum.go.gain.value = 0; hum.gn.gain.value = 0; }
      try { localStorage.setItem('ectoplasma-muted', String(muted)); } catch (e) {}
      return muted;
    },
    purchase() { [440, 660, 880].forEach((f, i) => tone('sine', f, f, 0.14, 0.10, i * 0.07)); },
    // on: sugando; pull: 0..1 do plasma já tirado do alvo; hit: o feixe está pegando um fantasma.
    hum(on, pull = 0, hit = false) {
      if (!ac) return;
      if (!hum) hum = buildHum();
      const t = ac.currentTime, v = on && !muted ? 1 : 0;
      hum.go.gain.setTargetAtTime(0.10 * v, t, 0.04);
      hum.gn.gain.setTargetAtTime((hit ? 0.22 : 0.12) * v, t, 0.04);
      hum.o.frequency.setTargetAtTime(hit ? 80 + 70 * pull : 62, t, 0.08);
      hum.bp.frequency.setTargetAtTime(hit ? 900 + 1500 * pull : 650, t, 0.08);
    },
    capture(big) {
      tone('square', 260, 1100, 0.18, 0.12); tone('sine', 520, 1900, 0.28, 0.16, 0.06);
      if (big) { noise('lowpass', 900, 60, 0.9, 0.5); tone('sawtooth', 110, 40, 0.9, 0.2); }
    },
    hurt() { noise('lowpass', 900, 90, 0.22, 0.55); tone('sawtooth', 170, 55, 0.22, 0.16); },
    windup() { tone('triangle', 70, 150, 0.55, 0.10); noise('bandpass', 200, 600, 0.55, 0.06, 6); },
    whoosh() { noise('bandpass', 350, 1800, 0.32, 0.30, 2.5); },
    smash() { noise('bandpass', 2400, 250, 0.25, 0.40, 1.2); tone('square', 140, 70, 0.12, 0.08); },
    spit() { noise('lowpass', 1400, 200, 0.3, 0.3); tone('sine', 300, 90, 0.3, 0.12); },
    trap() { tone('square', 880, 880, 0.05, 0.07); tone('square', 660, 660, 0.06, 0.07, 0.06); },
    clear() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.22, 0.12, i * 0.09)); },
    door() { noise('lowpass', 600, 80, 0.45, 0.4); tone('sine', 110, 70, 0.4, 0.12); },
    split() { tone('sawtooth', 220, 50, 0.6, 0.18); noise('lowpass', 1200, 100, 0.6, 0.4); },
    denied() { tone('square', 200, 150, 0.12, 0.08); },
  };
})();

// ============================================================ cenas das etapas (feitas à mão)

// Cada cena: piso, parede do fundo, paredes internas (retângulo no chão, com face de 22 px), móveis (posição = pés)
// e pontos de nascimento dos fantasmas. Objetos planos (flat) são desenhados centrados no ponto, no chão. Móveis com throw podem ser arremessados pelo Poltergeist (§7).
const PROPS = {
  sofa: {}, poltrona: {}, piano: {}, mesa: {}, cama: {}, estante: {}, geladeira: {}, caldeira: {},
  caixas: { throw: true }, cadeira: { throw: true }, abajur: { throw: true },
  tapete: { flat: true }, poca_ecto: { flat: true }, escada_descida: { flat: true }, bilhete: { flat: true },
  // Rua (etapa 1): objetos do PixelLab gerados em 2026-10-15 com a mesma receita dos móveis.
  carro: {}, poste: {}, arvore_seca: {}, cerca: {}, placa_vende: {}, hidrante: {}, lixeira: { throw: true },
};
// Rua: calçada em cima (frente da casa), asfalto embaixo. Imóveis de índice ímpar usam a cena espelhada.
const STREET = [['arvore_seca', 36, 104], ['cerca', 104, 106], ['poste', 156, 112], ['placa_vende', 316, 108], ['cerca', 376, 106],
  ['lixeira', 440, 112], ['hidrante', 58, 262], ['carro', 404, 262], ['lixeira', 150, 264], ['poste', 470, 268]];
const ROOMS = {
  sala: { floor: 'piso_madeira', wall: 'parede_sala',
    walls: [{ x: 300, y: 60, w: 12, h: 104 }],
    props: [['tapete', 160, 214], ['sofa', 120, 112], ['poltrona', 54, 176], ['abajur', 24, 104], ['estante', 252, 96], ['piano', 384, 100],
      ['mesa', 392, 206], ['cadeira', 352, 206], ['cadeira', 432, 206], ['abajur', 280, 250]],
    exit: [440, 236], start: [60, 240], note: [210, 168], spawns: [[200, 170], [370, 160], [100, 236], [250, 238], [420, 140]] },
  cozinha: { floor: 'piso_madeira', wall: 'parede_sala',
    walls: [{ x: 6, y: 156, w: 186, h: 12 }],
    props: [['geladeira', 46, 102], ['estante', 116, 100], ['caixas', 170, 104], ['mesa', 320, 160], ['cadeira', 284, 160], ['cadeira', 356, 160],
      ['abajur', 440, 104], ['caixas', 440, 250], ['poltrona', 230, 250]],
    exit: [60, 236], start: [380, 238], note: [380, 230], spawns: [[260, 120], [400, 200], [120, 220], [320, 240], [210, 190]] },
  quarto: { floor: 'piso_madeira', wall: 'parede_sala',
    walls: [{ x: 184, y: 60, w: 12, h: 92 }, { x: 300, y: 186, w: 174, h: 12 }],
    props: [['cama', 80, 170], ['abajur', 140, 104], ['tapete', 250, 230], ['estante', 250, 98], ['caixas', 420, 120], ['cadeira', 340, 120],
      ['poltrona', 40, 250], ['caixas', 150, 250]],
    exit: [440, 236], start: [240, 246], note: [100, 210], spawns: [[260, 150], [380, 140], [120, 230], [300, 250], [420, 240]] },
  porao: { floor: 'piso_concreto', wall: 'parede_porao', dark: 0.94,
    walls: [{ x: 150, y: 150, w: 16, h: 16 }, { x: 320, y: 150, w: 16, h: 16 }],
    props: [['caldeira', 56, 112], ['caixas', 120, 104], ['estante', 410, 98], ['caixas', 440, 240], ['caixas', 40, 250], ['cadeira', 250, 110], ['poca_ecto', 240, 200]],
    start: [70, 200], spawns: [[240, 160], [380, 200], [100, 190], [250, 240], [420, 150]] },
};
const INTERIORS = ['sala', 'cozinha', 'quarto'];

// ============================================================ save

const S = loadSave();
function loadSave() {
  const fresh = { plasma: 0, up: { suck: 0, tank: 0, range: 0, resist: 0, traps: 0, lamp: 0, decoder: 0 }, traps: { auto: 1, sup: 0 },
    prog: {}, clean: {}, mem: [], notes: [], records: [], intro: false, note: false };
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return { ...fresh, ...s, up: { ...fresh.up, ...s.up }, traps: { ...fresh.traps, ...s.traps } }; } catch (e) {}
  return fresh;
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
if (DEV.has('rich')) S.plasma += 1500;
const bairroDone = b => b.imoveis.every(i => S.clean[i.id]);
const bairroOpen = b => DEV.has('all') || BAIRROS.indexOf(b) === 0 || bairroDone(BAIRROS[BAIRROS.indexOf(b) - 1]);
const imoveisClean = () => BAIRROS.reduce((s, b) => s + b.imoveis.filter(i => S.clean[i.id]).length, 0);
const imoveisTotal = BAIRROS.reduce((s, b) => s + b.imoveis.length, 0);
const power = () => S.up.suck + S.up.tank + S.up.range + S.up.resist + S.up.traps;
const riskOf = im => { const d = RECOMMENDED[im.threat] - power(); return d <= 0 ? 0 : d <= 2 ? 1 : d <= 4 ? 2 : 3; };

// ============================================================ arte

const IMG = {};
function loadImages() {
  const names = ['map/mapa_cidade', 'buildings/casa_contaminada', 'tiles/rua_calcada', ...DIRS.map(d => 'chars/operador/' + d),
    ...Object.values(GHOSTS).map(g => g.img), ...Object.values(TRAPS).map(t => t.img),
    ...Object.keys(PROPS).map(p => 'props/' + p), ...['piso_madeira', 'piso_concreto', 'parede_sala', 'parede_porao'].map(n => 'interior/' + n),
    ...DIRS.flatMap(d => [...Array(WALK_FRAMES).keys()].map(i => `chars/operador/walk/${d}_${i}`))];
  return Promise.all(names.map(n => new Promise(res => {
    const im = new Image(); im.onload = res; im.onerror = res; im.src = ART + n + '.png'; IMG[n] = im;
  })));
}

// Chão da rua: calçada em cima (frente da casa), meio-fio e asfalto embaixo, montado pelos cantos do Wang.
let ground = null;
function buildGround() {
  ground = document.createElement('canvas'); ground.width = W; ground.height = 288;
  const g = ground.getContext('2d');
  const side = (cx, cy) => cy <= 3 || (cx <= 2 && cy >= 8) || (cx >= 13 && cy >= 8) ? 1 : 0;
  for (let y = 0; y < 9; y++) for (let x = 0; x < 15; x++) {
    const [tx, ty] = WANG['' + side(x, y) + side(x + 1, y) + side(x, y + 1) + side(x + 1, y + 1)];
    g.drawImage(IMG['tiles/rua_calcada'], tx * 32, ty * 32, 32, 32, x * 32, y * 32, 32, 32);
  }
  // Asfalto: faixa central tracejada e gasta, bueiro e rachaduras, para o meio da rua não ficar liso.
  g.fillStyle = 'rgba(232,212,120,.5)';
  for (let x = 6; x < W; x += 40) if (x % 120 !== 46) g.fillRect(x, 186, 22, 3);
  g.fillStyle = '#2a2733'; g.beginPath(); g.ellipse(300, 226, 13, 7, 0, 0, 7); g.fill();
  g.fillStyle = '#4a4656'; g.beginPath(); g.ellipse(300, 225, 11, 5.5, 0, 0, 7); g.fill();
  g.fillStyle = '#2a2733'; for (let i = -8; i <= 8; i += 4) g.fillRect(300 + i, 222, 1, 7);
  g.strokeStyle = 'rgba(25,22,32,.7)'; g.lineWidth = 1;
  for (const [x, y] of [[70, 150], [210, 230], [380, 160], [140, 200], [440, 214]]) {
    g.beginPath(); g.moveTo(x, y);
    let cx = x, cy = y;
    for (let i = 0; i < 5; i++) { cx += 4 + (i * 7) % 5; cy += ((i * 5) % 7) - 3; g.lineTo(cx, cy); }
    g.stroke();
  }
  // Calçada abandonada: escurece o bege claro do tileset para combinar com o bairro contaminado.
  g.fillStyle = 'rgba(40,36,60,.38)'; g.fillRect(0, 0, W, 288);
}

// ============================================================ estado e utilidades

const $ = id => document.getElementById(id);
const cv = $('view'), ctx = cv.getContext('2d');
const darkCv = document.createElement('canvas'); darkCv.width = W; darkCv.height = H;
const dctx = darkCv.getContext('2d');
let scene = 'map';               // map · mission · screen
let M = null;                    // etapa em andamento (e a entrada no imóvel que a contém)
let hoverBairro = null;
let screenBack = null;
let paused = false;
let noticeTime = 0;
const IRACEMA = 'Minha mãe ainda estava naquela casa. Vocês não tinham o direito. — Iracema';
const keys = new Set();
const mouse = { x: 0, y: 0, down: false };
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hyp = (x, y) => Math.hypot(x, y);
const inRect = (x, y, r, pad = 0) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;

function toast(html, ms = 3200) {
  const t = $('toast'); t.innerHTML = html; t.classList.remove('hidden');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), ms);
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brand = label => `<div class="terminal-head"><span class="brand-mark">LC<span>+</span></span><span>LIMPACORP <small>DIVISÃO ESPECTRAL</small></span><span class="terminal-label">${label}</span></div>`;
const orderNo = im => String(BAIRROS.flatMap(b => b.imoveis).indexOf(im) + 1).padStart(3, '0');

function resetInput() { mouse.down = false; keys.clear(); SFX.hum(false); }
function showScreen(html, type = '', back = null) {
  resetInput(); screenBack = back;
  clearTimeout(toast.t); $('toast').classList.add('hidden');
  const s = $('screen'); s.className = type; s.innerHTML = brand('OPERADOR / 0451') + html;
  scene = 'screen';
  for (const id of ['hud', 'dispatch', 'objective', 'arrival', 'memoryNotice']) $(id).classList.add('hidden');
  s.focus({ preventScroll: true });
}
function hideScreen() { $('screen').classList.add('hidden'); $('hud').classList.remove('hidden'); screenBack = null; }

function resumeMission() {
  if (!M || !paused) return;
  paused = false; resetInput(); hideScreen(); scene = 'mission';
  $('objective').classList.remove('hidden');
  last = performance.now();
}

function openPause(reason = '') {
  if (!M || (scene !== 'mission' && !paused)) return;
  paused = true;
  showScreen(`<div class="eyebrow">ORDEM DE SERVIÇO / ${orderNo(M.im)}</div>
    <h1>Operação suspensa</h1><p class="subtitle">${M.im.name} · ${ETAPA_NAMES[M.etapa]}</p>
    <div class="pause-status"><span>INTEGRIDADE <b>${Math.ceil(M.op.hp)}%</b></span><span>EM CUSTÓDIA <b>◆ ${M.bag}</b></span></div>
    <p class="pause-reason">${reason || 'O tempo está parado. Seu equipamento e sua carga estão seguros.'}</p>
    <div class="row"><button class="btn go" id="resume">Retomar operação [Esc]</button><button class="btn" id="archive">Arquivo [J]</button></div>
    <div class="row"><button class="btn" id="controls">Controles</button><button class="btn" id="audio">Som: ${SFX.isMuted() ? 'desligado' : 'ligado'}</button>
    <button class="btn danger" id="evacuate" ${M.over ? 'disabled' : ''}>Solicitar evacuação</button></div>
    <small>${M.over ? 'Extração concluída. Retome para receber o relatório.' : M.cleared ? 'Etapa limpa: evacuação com toda a carga.' : 'Etapa em andamento: evacuar perde metade da carga.'}</small>`, 'pause-screen', resumeMission);
  $('resume').onclick = resumeMission;
  $('archive').onclick = () => openArchive(openPause);
  $('controls').onclick = () => openControls(openPause);
  $('audio').onclick = () => { SFX.toggleMute(); openPause(); };
  $('evacuate').onclick = confirmEvacuation;
}

function confirmEvacuation() {
  if (!M || M.over || !paused) return;
  const kept = M.cleared ? M.bag : Math.floor(M.bag / 2);
  showScreen(`<div class="eyebrow">EXTRAÇÃO DO OPERADOR</div><h1>${M.cleared ? 'Carga protegida' : 'Interromper o serviço?'}</h1>
    <p>${M.cleared ? 'A etapa foi concluída. Todo o plasma será depositado.' : 'A etapa atual continuará pendente. O resgate recupera metade do plasma da mochila.'}</p>
    <div class="receipt"><div>Depósito confirmado <b>◆ ${kept}</b></div><div>Perda de carga <strong class="loss">◆ ${M.bag - kept}</strong></div></div>
    <small>As etapas já limpas continuam salvas.</small><div class="row"><button class="btn go" id="cancel">Continuar no imóvel</button>
    <button class="btn danger" id="confirmEvac">Confirmar evacuação</button></div>`, 'pause-screen', openPause);
  $('cancel').onclick = resumeMission;
  $('confirmEvac').onclick = () => { resumeMission(); leave('evac'); };
}

function openControls(back) {
  showScreen(`<div class="eyebrow">MANUAL DO OPERADOR</div><h1>Procedimento de campo</h1>
    <div class="controls-list"><div><kbd>W A S D / SETAS</kbd><span>Movimentar o operador</span></div>
    <div><kbd>MOUSE SEGURADO</kbd><span>Mirar no fantasma e sugar. Parado, a sucção rende o dobro.</span></div>
    <div><kbd>Q / E</kbd><span>Instalar armadilha autônoma / de suporte perto da mira</span></div>
    <div><kbd>ESC / J / M</kbd><span>Pausar / consultar arquivo / ligar ou desligar o som</span></div></div>
    <p class="subtitle">O tanque recarrega ao soltar o feixe. Após limpar uma etapa, avance pela saída ou evacue com toda a carga.</p>
    <button class="btn go" id="back">Voltar</button>`, 'controls-screen', back);
  $('back').onclick = () => back();
}

function remember(text, kind, place) {
  const list = kind === 'memory' ? S.mem : S.notes;
  if (!list.includes(text)) list.push(text);
  if (!S.records.some(r => r.text === text)) S.records.push({ text, kind, place: place || M?.im.name || 'Arquivo municipal' });
  save();
  const n = $('memoryNotice');
  n.innerHTML = `<span class="eyebrow">${kind === 'memory' ? 'ECO RECUPERADO' : 'DOCUMENTO RECOLHIDO'}</span><span>${escapeHtml(text)}</span><small>Guardado no arquivo · [J] para ler em segurança</small>`;
  n.classList.remove('hidden'); noticeTime = 5;
}

function openArchive(back, filter = 'all') {
  const records = [
    ...S.mem.map(text => ({ text, kind: 'memory' })), ...S.notes.map(text => ({ text, kind: 'note' })),
    ...(S.note ? [{ text: IRACEMA, kind: 'note', place: 'Portão da Vila Operária' }] : []),
  ].filter((r, i, all) => all.findIndex(x => x.text === r.text) === i)
    .map(r => ({ ...r, ...S.records.find(x => x.text === r.text) }))
    .filter(r => filter === 'all' || r.kind === filter);
  showScreen(`<div class="eyebrow">REGISTROS RETIDOS / ACESSO DO OPERADOR</div><h1>O que ficou nas casas</h1>
    <div class="archive-tabs">${[['all', 'Todos'], ['memory', 'Memórias'], ['note', 'Documentos']].map(([id, label]) => `<button class="btn ${id === filter ? 'go' : ''}" data-filter="${id}" aria-pressed="${id === filter}">${label}</button>`).join('')}</div>
    <div class="archive-list" tabindex="0" aria-label="Registros coletados">${records.length ? records.map((r, i) => `<article><span class="record-number">${String(i + 1).padStart(2, '0')}</span><div><small>${r.kind === 'memory' ? 'ECO ESPECTRAL' : 'DOCUMENTO'} / ${escapeHtml(r.place || 'Registro anterior · origem não catalogada')}</small><p>${escapeHtml(r.text)}</p></div></article>`).join('') : '<div class="empty-archive"><h2>Nenhum registro por aqui.</h2><p>Recolha bilhetes e capture ecos nos imóveis. Tudo o que encontrar ficará guardado neste arquivo.</p></div>'}</div>
    <div class="screen-footer"><small>${records.length} ${records.length === 1 ? 'registro' : 'registros'} · armazenamento local</small><button class="btn go" id="back">Voltar [Esc]</button></div>`, 'archive-screen', back);
  document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => openArchive(back, b.dataset.filter));
  $('back').onclick = () => back();
}

// ============================================================ mapa da cidade (§6.1, §6.6, §8)

function goMap() {
  paused = false; resetInput(); hideScreen(); M = null; scene = 'map';
  for (const id of ['objective', 'arrival', 'memoryNotice']) $(id).classList.add('hidden');
  mapHud();
  // Ato 2 (§3.2): depois do primeiro bairro aparece a primeira pista forte de que os fantasmas eram gente.
  if (bairroDone(BAIRROS[0]) && !S.note) {
    S.note = true; save();
    remember(IRACEMA, 'note', 'Portão da Vila Operária');
  }
}

function mapHud() {
  $('hud').innerHTML = `<div><div class="lbl">LimpaCorp Espectral · operador nº 0451</div><div class="plasma">◆ ${S.plasma} de plasma</div></div>
    <div><div class="lbl">Cidade limpa</div>${imoveisClean()}/${imoveisTotal} imóveis</div>
    <div><div class="lbl">Memórias</div>${S.mem.length + S.notes.length}</div><div class="grow"></div>
    <button class="btn" id="archiveBtn">Arquivo [J]</button><button class="btn neon" id="shopBtn">Equipamento [U]</button>`;
  $('shopBtn').onclick = () => openShop(goMap);
  $('archiveBtn').onclick = () => openArchive(goMap);
  const dispatch = $('dispatch'); dispatch.classList.remove('hidden');
  dispatch.innerHTML = `${brand('CENTRAL')}<div class="eyebrow">PROGRAMA DE REVALORIZAÇÃO URBANA</div><h1>A cidade espera<br>pelo seu trabalho.</h1>
    <p>Selecione um setor para consultar as ordens de serviço.</p>
    <nav>${BAIRROS.map((b, i) => `<button data-bairro="${i}" ${!bairroOpen(b) ? 'disabled' : ''}><span class="sector-number">0${i + 1}</span><span>${b.name}<small>${bairroDone(b) ? 'SERVIÇO CONCLUÍDO' : !bairroOpen(b) ? 'AGUARDANDO SETOR ANTERIOR' : `${b.imoveis.filter(im => S.clean[im.id]).length}/3 IMÓVEIS CONCLUÍDOS`}</small></span><span class="sector-arrow">${bairroDone(b) ? '✓' : '→'}</span></button>`).join('')}</nav>
    <footer>SEU BAIRRO DE VOLTA AO MERCADO.<span>LC / CONEXÃO LOCAL ATIVA</span></footer>`;
  document.querySelectorAll('[data-bairro]').forEach(btn => btn.onclick = () => openBairro(BAIRROS[+btn.dataset.bairro]));
}

function bairroAt(x, y) { return BAIRROS.find(b => hyp(b.mx - x, b.my - y) < 34); }

function drawMap(now) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(IMG['map/mapa_cidade'], 0, 0, 960, 540);
  for (const b of BAIRROS) {
    const done = bairroDone(b), open = bairroOpen(b), hot = b === hoverBairro;
    const pulse = (Math.sin(now / 300 + b.mx) + 1) / 2;
    const n = b.imoveis.filter(i => S.clean[i.id]).length;
    ctx.save();
    if (done) {
      // Bairro valorizado (§6.1): a névoa dá lugar ao neon.
      const g = ctx.createRadialGradient(b.mx, b.my, 4, b.mx, b.my, 90);
      g.addColorStop(0, 'rgba(54,214,255,.55)'); g.addColorStop(1, 'rgba(54,214,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.mx, b.my, 90, 0, 7); ctx.fill();
    } else if (!open) { ctx.fillStyle = 'rgba(8,7,12,.55)'; ctx.beginPath(); ctx.arc(b.mx, b.my, 32, 0, 7); ctx.fill(); }
    ctx.lineWidth = hot ? 4 : 3;
    ctx.strokeStyle = done ? '#36d6ff' : open ? `rgba(200,120,255,${0.5 + pulse * 0.5})` : 'rgba(150,150,170,.6)';
    ctx.beginPath(); ctx.arc(b.mx, b.my, 30 + (done || !open ? 0 : pulse * 4), 0, 7); ctx.stroke();
    const maxT = Math.max(...b.imoveis.map(i => i.threat));
    const label = done ? 'VALORIZADO' : !open ? 'BLOQUEADO' : `${'☠'.repeat(maxT)} ${n}/${b.imoveis.length}`;
    ctx.font = '18px Silkscreen, monospace';
    const tw = ctx.measureText(label).width + 14, lx = clamp(b.mx - tw / 2, 4, 956 - tw), ly = b.my > 440 ? b.my - 62 : b.my + 36;
    ctx.fillStyle = 'rgba(8,7,12,.85)'; ctx.fillRect(lx, ly, tw, 24);
    ctx.fillStyle = done ? '#36d6ff' : !open ? '#9aa3b5' : ['', '#8cff4a', '#ffd166', '#ff9a4a', '#ff5a5a', '#c77dff'][maxT];
    ctx.textAlign = 'left'; ctx.fillText(label, lx + 7, ly + 18);
    // Nome do bairro sob o mouse.
    if (hot) {
      const nt = b.name.toUpperCase(), nw = ctx.measureText(nt).width + 14, nx = clamp(b.mx - nw / 2, 4, 956 - nw), ny = ly + (b.my > 440 ? -28 : 28);
      ctx.fillStyle = 'rgba(8,7,12,.9)'; ctx.fillRect(nx, ny, nw, 24); ctx.fillStyle = '#e9ecef'; ctx.fillText(nt, nx + 7, ny + 18);
    }
    ctx.restore();
  }
}

// ============================================================ bairro: lista de imóveis (§6.6)

function openBairro(b) {
  M = null; paused = false;
  const cards = b.imoveis.map(im => {
    const done = S.prog[im.id] || 0, clean = S.clean[im.id], risk = riskOf(im);
    const pips = ETAPA_NAMES.map((n, k) => `<span class="${k < done ? 'ok' : ''}" title="${n}">${k < done ? '■' : '□'}</span>`).join('');
    const ghosts = [...new Set(im.etapas.flat())];
    return `<div class="card${clean ? ' clean' : ''}">
      <div class="card-code">OS / ${orderNo(im)} <span>${clean ? 'CONCLUÍDA' : im.boss ? 'RESIDUAL' : 'EXTRAÇÃO'}</span></div>
      <div class="house-frame"><img class="house" src="${ART}buildings/casa_contaminada.png" alt="">${clean ? '<span class="stamp">LIBERADO</span>' : ''}</div>
      <h3>${im.name}</h3>
      <div>Ameaça <span class="threat">${'☠'.repeat(im.threat)}${'·'.repeat(5 - im.threat)}</span>${im.boss ? ' · <b style="color:var(--pink)">chefe</b>' : ''}</div>
      <div class="row cast">${ghosts.map(g => `<img src="${ART + GHOSTS[g].img}.png" title="${GHOSTS[g].name}" alt="">`).join('')}</div>
      <div class="pips" aria-label="${done} de 3 etapas limpas">${pips} <span>${done}/3 etapas</span></div>
      ${clean ? '<div class="risk-0">Limpo · imóvel valorizado</div>' :
        `<div>Equipamento: <span class="risk-${risk}">${RISK[risk]}</span></div>
         <button class="btn go" data-im="${im.id}">${done ? `Continuar: ${ETAPA_NAMES[done]}` : 'Entrar'}</button>`}
    </div>`;
  }).join('');
  showScreen(`<div class="eyebrow">ORDENS DE SERVIÇO / SETOR 0${BAIRROS.indexOf(b) + 1}</div><h1>${b.name}</h1><p class="subtitle">${b.theme}</p><div class="imoveis">${cards}</div>
    <div class="screen-footer"><small>A carga e o equipamento seguem com você entre as etapas.</small><div class="row"><button class="btn neon" id="shop">Equipamento</button> <button class="btn" id="back">Central [Esc]</button></div></div>`, 'district-screen', goMap);
  document.querySelectorAll('[data-im]').forEach(btn => btn.onclick = () => startImovel(b, b.imoveis.find(i => i.id === btn.dataset.im)));
  $('shop').onclick = () => openShop(() => openBairro(b));
  $('back').onclick = goMap;
}

// ============================================================ loja (§6.4, §6.3, §8)

function openShop(back, feedback = '') {
  const ups = Object.entries(UPG).map(([id, u]) => {
    const lvl = S.up[id], maxed = lvl >= u.max, price = maxed ? 0 : upgPrice(id, lvl);
    return `<button data-up="${id}" class="${feedback === id ? 'installed' : ''}" ${maxed || S.plasma < price ? 'disabled' : ''}>${u.name} <em>${maxed ? 'máx.' : '◆ ' + price}</em>
      <span>${u.desc} · <i class="pips">${'■'.repeat(lvl)}${'□'.repeat(u.max - lvl)}</i></span></button>`;
  }).join('');
  const traps = Object.entries(TRAPS).map(([id, t]) =>
    `<button data-trap="${id}" ${S.plasma < t.price ? 'disabled' : ''}>${t.name} (tem ${S.traps[id]}) <em>◆ ${t.price}</em><span>[${t.key}] ${t.desc}</span></button>`).join('');
  showScreen(`<div class="eyebrow">ALMOXARIFADO / MELHORIAS AUTORIZADAS</div><div class="shop-heading"><h1>Ferramentas do ofício</h1><span class="balance">SALDO DISPONÍVEL <b>◆ ${S.plasma}</b></span></div>
    <div class="shop">${ups}${traps}</div>
    <div class="screen-footer"><small role="status">${feedback ? `✓ ${UPG[feedback]?.name || TRAPS[feedback]?.name} · ${UPG[feedback] ? 'melhoria instalada' : 'adicionada ao inventário'}.` : `Armadilhas consumíveis · ${stat.slots()} posições disponíveis em campo.`}</small>
    <button class="btn go" id="back">Voltar [Esc]</button></div>`, 'shop-screen', back);
  document.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
    const id = b.dataset.up; S.plasma -= upgPrice(id, S.up[id]); S.up[id]++; save(); SFX.purchase(); openShop(back, id);
  });
  document.querySelectorAll('[data-trap]').forEach(b => b.onclick = () => {
    const id = b.dataset.trap; S.plasma -= TRAPS[id].price; S.traps[id]++; save(); SFX.purchase(); openShop(back, id);
  });
  $('back').onclick = () => back();
}

// ============================================================ imóvel e etapas (§6.6)

// Uma entrada no imóvel: vida, tanque e mochila passam de uma etapa para a outra; começa na 1ª etapa ainda suja.
function startImovel(b, im, etapa) {
  paused = false; resetInput(); hideScreen(); $('dispatch').classList.add('hidden');
  const mul = threatMul(im.threat);
  M = { bairro: b, im, mul, dmg: dmgMul(im.threat), bag: 0, etapa: etapa ?? Math.min(2, S.prog[im.id] || 0),
    op: { x: 240, y: 240, hp: 100, dir: 6, hurt: -9, moving: false, walk: 0, kx: 0, ky: 0 }, tank: stat.tankMax(), overheat: false };
  enterEtapa();
}

function enterEtapa() {
  clearTimeout(toast.t); $('toast').classList.add('hidden');
  const im = M.im, k = M.etapa, b = M.bairro;
  const kind = k === 0 ? 'rua' : k === 1 ? INTERIORS[b.imoveis.indexOf(im) % INTERIORS.length] : 'porao';
  Object.assign(M, { kind, t: 0, traps: [], shots: [], parts: [], ghosts: [], dying: [], over: false, cleared: false, beam: null, note: null,
    shake: 0, shakeMag: 0, hitstop: 0, red: 0, finishIn: null, arrival: 3, clearBlend: 0 });
  resetInput();
  Object.assign(M.op, { kx: 0, ky: 0, hurt: -9 });
  if (k > 0) SFX.door();
  const room = ROOMS[kind];
  M.walls = room ? room.walls : [{ x: 190, y: 30, w: 102, h: 70 }];   // na rua, a casa é o obstáculo
  const flip = !room && b.imoveis.indexOf(im) % 2 === 1;
  M.props = room ? room.props.map(([name, x, y]) => ({ name, x, y, ...PROPS[name] }))
    : STREET.map(([name, x, y]) => ({ name, x: flip ? W - x : x, y, ...PROPS[name] }));
  if (im.id === 'acacias' && kind === 'sala') {
    // O tapete une a área de estar sem alterar móveis sólidos ou caminhos.
    Object.assign(M.props.find(p => p.name === 'tapete'), { x: 122, y: 148, scale: 1.45 });
  }
  M.dark = room && room.dark ? room.dark : (b.dark && k === 1 ? 0.8 : 0);
  M.exit = k === 2 ? null : room ? { x: room.exit[0] - 20, y: room.exit[1] - 14, w: 40, h: 28 } : { x: 226, y: 96, w: 34, h: 16 };
  if (room && room.exit) M.props.push({ name: 'escada_descida', x: room.exit[0], y: room.exit[1], flat: true });
  // Bilhete do térreo (§3.2): uma pista por imóvel, que muda de tom a cada bairro.
  if (k === 1 && !S.notes.includes(noteFor(im))) M.note = { x: room.note[0], y: room.note[1], text: noteFor(im) };
  // Beira-rio: poças de ectoplasma que deixam o operador lento.
  M.puddles = b.puddles ? [0, 1, 2, 3, 4].map(i => ({ x: 60 + i * 90 + rnd(-20, 20), y: rnd(120, 250) })) : [];
  const spawns = room ? room.spawns : [[90, 150], [400, 140], [160, 220], [330, 210], [240, 170]];
  im.etapas[k].forEach((g, i) => { const [x, y] = spawns[i % spawns.length]; spawnGhost(g, x + rnd(-10, 10), y + rnd(-8, 8)); });
  M.total = M.ghosts.reduce((s, g) => s + g.max, 0);
  [M.op.x, M.op.y] = room ? room.start : [240, 246];
  scene = 'mission';
  buildMissionHud();
  missionHud();
  $('arrival').innerHTML = `<span class="eyebrow">LIMPACORP / OS ${orderNo(im)} / ${b.name}</span><strong>${im.name}</strong><span>0${k + 1} — ${ETAPA_NAMES[k]} <i>Extração autorizada</i></span>`;
  $('arrival').classList.remove('hidden');
  $('objective').classList.remove('hidden');
  $('memoryNotice').classList.add('hidden'); noticeTime = 0;
}

function noteFor(im) {
  const b = BAIRROS.find(x => x.imoveis.includes(im));
  return NOTES[b.id][b.imoveis.indexOf(im) % NOTES[b.id].length];
}

function spawnGhost(kind, x, y) {
  const k = GHOSTS[kind];
  const g = { kind, ...k, x, y, tx: x, ty: y, max: k.plasma, p: k.plasma, lastHit: -9, aimed: -9, cd: rnd(1.5, 3), phase: 1, seed: Math.random() * 9 };
  g.memory = MEMORIES[kind][(S.mem.length + M.ghosts.length) % MEMORIES[kind].length];
  M.ghosts.push(g);
  return g;
}

// A arma sai da mão do operador: um pouco acima dos pés, para o lado da mira.
function nozzle() {
  const a = Math.atan2(mouse.y - (M.op.y - 18), mouse.x - M.op.x);
  return { x: M.op.x + Math.cos(a) * 14, y: M.op.y - 18 + Math.sin(a) * 8, a };
}

// Golpe no operador, vindo de (sx, sy): meio segundo de invencibilidade, empurrão para longe da origem,
// tremor de tela, borda vermelha e som. Sem a invencibilidade, dois objetos juntos (ou o chefe colado) somavam
// dano sem dar tempo de reagir.
const IFRAMES = 0.5;
function hurt(dmg, sx, sy) {
  if (DEV.has('god') || M.over || M.t - M.op.hurt < IFRAMES) return;
  const op = M.op;
  op.hp -= dmg * M.dmg * stat.resist();
  op.hurt = M.t;
  const d = hyp(op.x - sx, op.y - sy) || 1;
  op.kx = (op.x - sx) / d * 170; op.ky = (op.y - sy) / d * 170;
  shake(0.25, 3); M.red = 0.45; M.hitstop = 0.05;
  SFX.hurt();
  if (op.hp <= 0) { op.hp = 0; leave('dead'); }
}
function shake(time, mag) { M.shakeMag = M.shake > 0 ? Math.max(M.shakeMag, mag) : mag; M.shake = Math.max(M.shake, time); }

// Obstáculos para andar: paredes, a casa (na rua) e a base dos móveis que não são planos.
function solidAt(x, y) {
  if (M.kind !== 'rua' && y < 70) return true;
  for (const r of M.walls) if (inRect(x, y, r, 4)) return true;
  for (const p of M.props) if (!p.flat && Math.abs(x - p.x) < IMG['props/' + p.name].width * 0.38 && y > p.y - 12 && y < p.y + 2) return true;
  return false;
}

// Paredes cortam o feixe (§6.6): devolve onde o segmento bate numa parede (contando a face de 22 px), ou null.
function wallHit(x1, y1, x2, y2) {
  if (M.kind === 'rua') return null;
  const d = hyp(x2 - x1, y2 - y1), n = Math.ceil(d / 3);
  for (let i = 1; i <= n; i++) {
    const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n;
    for (const r of M.walls) if (x > r.x && x < r.x + r.w && y > r.y - 22 && y < r.y + r.h) return { x, y };
  }
  return null;
}

function updateMission(dt) {
  if (scene !== 'mission' || paused) return;
  const op = M.op;
  M.arrival = Math.max(0, M.arrival - dt);
  M.clearBlend = Math.min(1, M.clearBlend + (M.cleared ? dt * 0.7 : 0));
  $('arrival').classList.toggle('hidden', M.arrival === 0);
  // O relatório usa tempo de simulação: pausa e perda de foco também param sua contagem.
  if (M.finishIn !== null) {
    M.t += dt; M.finishIn -= dt;
    M.shake = Math.max(0, M.shake - dt);
    for (const d of M.dying) d.t += dt;
    M.dying = M.dying.filter(d => d.t < CAPTURE_TIME);
    for (const p of M.parts) p.life -= dt;
    M.parts = M.parts.filter(p => p.life > 0);
    if (M.finishIn <= 0) finishImovel();
    return;
  }
  M.shake = Math.max(0, M.shake - dt); M.red = Math.max(0, M.red - dt);
  // Pausa de impacto: congela o jogo por alguns centésimos na captura e no golpe, para eles "pesarem".
  if (M.hitstop > 0) { M.hitstop -= dt; missionHud(); return; }
  M.t += dt;
  // Movimento (WASD/setas), sem atravessar paredes nem móveis; poças deixam lento.
  let vx = (keys.has('d') || keys.has('arrowright')) - (keys.has('a') || keys.has('arrowleft'));
  let vy = (keys.has('s') || keys.has('arrowdown')) - (keys.has('w') || keys.has('arrowup'));
  const len = hyp(vx, vy) || 1;
  op.moving = !!(vx || vy);
  const slow = M.puddles.some(p => hyp(p.x - op.x, (p.y - op.y) * 1.6) < 22) ? PUDDLE_SLOW : 1;
  const nx = clamp(op.x + vx / len * SPEED * slow * dt, 14, W - 14), ny = clamp(op.y + vy / len * SPEED * slow * dt, 64, H - 4);
  if (!solidAt(nx, op.y)) op.x = nx;
  if (!solidAt(op.x, ny)) op.y = ny;
  if (op.moving) op.walk += dt * 10 * slow;
  // Empurrão do golpe, que se esgota rápido e também não atravessa paredes.
  if (Math.abs(op.kx) + Math.abs(op.ky) > 1) {
    const kx = clamp(op.x + op.kx * dt, 14, W - 14), ky = clamp(op.y + op.ky * dt, 64, H - 4);
    if (!solidAt(kx, op.y)) op.x = kx;
    if (!solidAt(op.x, ky)) op.y = ky;
    const f = Math.exp(-12 * dt); op.kx *= f; op.ky *= f;
  }
  const nz = nozzle();
  op.dir = ((Math.round(nz.a / (Math.PI / 4)) % 8) + 8) % 8;

  // Sucção (§6.2): segurar gasta o tanque; o feixe pega o fantasma sob a mira se estiver no alcance e sem parede no meio.
  M.beam = null;
  const sucking = mouse.down && !M.overheat && M.tank > 0 && !M.over;
  if (sucking) {
    M.tank = Math.max(0, M.tank - TANK_DRAIN * dt);
    if (M.tank === 0) { M.overheat = true; toast('Tanque vazio! Espere recarregar.', 1600); }
    const reach = stat.range();
    let target = null, best = 1e9;
    for (const g of M.ghosts) {
      const dm = hyp(g.x - mouse.x, g.y - g.size * 0.45 - mouse.y), dn = hyp(g.x - nz.x, g.y - g.size * 0.45 - nz.y);
      if (dm < g.r + 8 && dn <= reach + g.r && dm < best) { best = dm; target = g; }
    }
    const end = target ? { x: target.x, y: target.y - target.size * 0.45 } : (() => {
      const d = Math.min(reach, hyp(mouse.x - nz.x, mouse.y - nz.y));
      return { x: nz.x + Math.cos(nz.a) * d, y: nz.y + Math.sin(nz.a) * d };
    })();
    const block = wallHit(nz.x, nz.y, end.x, end.y);
    if (target && !block) {
      target.p -= stat.suck() * (op.moving ? MOVING_PENALTY : 1) * dt;
      target.lastHit = target.aimed = M.t;
      M.beam = { ...end, hit: true };
      // Fiapos de plasma saindo do fantasma em direção ao bico.
      if (Math.random() < dt * 40) {
        const a = Math.random() * 7;
        M.parts.push({ x: end.x + Math.cos(a) * target.r, y: end.y + Math.sin(a) * target.r * 0.7, home: true, life: 0.5, color: Math.random() < 0.7 ? '#8cff4a' : '#c77dff' });
      }
      SFX.hum(true, 1 - target.p / target.max, true);
      if (target.p <= 0) capture(target);
    } else { M.beam = { ...(block || end), hit: false, blocked: !!block }; SFX.hum(true); }
  } else {
    SFX.hum(false);
    M.tank = Math.min(stat.tankMax(), M.tank + TANK_REFILL * dt);
    if (M.overheat && M.tank >= stat.tankMax() * 0.35) M.overheat = false;
  }

  // Armadilhas (§6.3).
  for (const tr of M.traps) {
    if (tr.type !== 'auto') continue;
    let g = null, best = TRAPS.auto.radius;
    for (const o of M.ghosts) { const d = hyp(o.x - tr.x, o.y - tr.y); if (d < best) { best = d; g = o; } }
    tr.link = g;
    if (g) { g.p -= 6 * stat.trapPow() * dt; g.lastHit = M.t; if (g.p <= 0) capture(g); }
  }

  for (const g of [...M.ghosts]) { updateGhost(g, dt); if (scene !== 'mission') return; }

  for (const s of M.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; s.rot += dt * 8;
    if (hyp(s.x - op.x, s.y - (op.y - 16)) < 13) { s.life = 0; hurt(s.dmg, s.x - s.vx, s.y - s.vy); burst(s.x, s.y, '#ff9a4a', 8); if (s.kind !== 'blob') SFX.smash(); }
    else if (M.kind !== 'rua' && M.walls.some(r => s.x > r.x && s.x < r.x + r.w && s.y > r.y - 22 && s.y < r.y + r.h)) { s.life = 0; burst(s.x, s.y, '#c77dff', 8); SFX.smash(); }
    if (scene !== 'mission') return;
  }
  M.shots = M.shots.filter(s => s.life > 0 && s.x > -20 && s.x < W + 20 && s.y > -20 && s.y < H + 20);
  const nzz = nozzle();
  for (const p of M.parts) {
    if (p.home) { p.x += (nzz.x - p.x) * Math.min(1, dt * 9); p.y += (nzz.y - p.y) * Math.min(1, dt * 9); if (hyp(nzz.x - p.x, nzz.y - p.y) < 3) p.life = 0; }
    else { p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 10 * dt; }
    p.life -= dt;
  }
  M.parts = M.parts.filter(p => p.life > 0);
  for (const d of M.dying) d.t += dt;
  M.dying = M.dying.filter(d => d.t < CAPTURE_TIME);

  // Bilhete do térreo.
  if (M.note && hyp(M.note.x - op.x, M.note.y - op.y) < 16) {
    remember(M.note.text, 'note');
    M.note = null;
  }

  // Etapa limpa: salva o progresso (não volta a contaminar) e abre a saída; na última, o imóvel acaba.
  if (!M.ghosts.length && !M.cleared) {
    M.cleared = true;
    SFX.clear();
    if (M.etapa === 2) { M.over = true; M.finishIn = 1.2; SFX.hum(false); }
    else {
      S.prog[M.im.id] = M.etapa + 1; save();
      toast(`Etapa liberada · ${M.etapa === 0 ? 'Entre pela porta da casa' : 'Desça pela escada'} ou abra a pausa para evacuar com toda a carga.`, 5000);
    }
  }
  if (M.cleared && M.exit && !M.over && inRect(op.x, op.y, M.exit)) { M.etapa++; enterEtapa(); return; }
  missionHud();
}

function updateGhost(g, dt) {
  const op = M.op;
  // Suporte: dentro do raio o fantasma fica lento, é puxado para a armadilha e não regenera.
  let slow = 1, sup = null;
  for (const tr of M.traps) if (tr.type === 'sup' && hyp(g.x - tr.x, g.y - tr.y) < TRAPS.sup.radius * (g.boss ? 0.8 : 1)) { slow = 0.4; sup = tr; }
  if (!sup && M.t - g.lastHit > REGEN_DELAY) g.p = Math.min(g.max, g.p + g.regen * M.mul * dt);

  const dOp = hyp(g.x - op.x, g.y - op.y) || 1;
  let vx = 0, vy = 0;
  if (g.kind === 'assombrado' && M.t - g.aimed < 0.25) {
    // Foge quando mirado (§7): obriga a reposicionar; atrás de uma parede, o feixe não alcança.
    vx = (g.x - op.x) / dOp * g.flee; vy = (g.y - op.y) / dOp * g.flee;
  } else if (g.kind === 'poltergeist') {
    // Mantém distância e arremessa objetos da casa contra o operador (§7): no interior, os móveis da própria sala.
    // Antes de arremessar há um aviso de WINDUP s: o objeto treme e sobe (§7), para o jogador poder desviar.
    if (g.windup) {
      g.windup.t -= dt;
      if (g.windup.t <= 0) { releaseThrow(g); g.windup = null; }
    } else {
      if (dOp < 95) { vx = (g.x - op.x) / dOp * g.speed * 2; vy = (g.y - op.y) / dOp * g.speed * 2; }
      else wander(g);
      g.cd -= dt;
      if (g.cd <= 0 && !M.over) { g.cd = g.throwEvery * rnd(0.8, 1.2); startThrow(g); }
    }
  } else if (g.boss) {
    // Residual (§7): avança devagar, machuca de perto, divide-se em fases e cospe ectoplasma a partir da 2ª.
    if (dOp > 20) { vx = (op.x - g.x) / dOp * g.speed; vy = (op.y - g.y) / dOp * g.speed; }
    if (dOp < 36) hurt(6, g.x, g.y);   // contato: golpe com empurrão (antes era dano contínuo)
    const phase = g.p > g.max * 2 / 3 ? 1 : g.p > g.max / 3 ? 2 : 3;
    if (phase > g.phase) {
      g.phase = phase;
      toast(`O Residual se parte! Fase ${phase}.`, 1800);
      SFX.split(); shake(0.4, 4);
      for (let i = 0; i < 2; i++) spawnGhost('errante', clamp(g.x + rnd(-70, 70), 40, 440), clamp(g.y + rnd(-40, 40), 100, 240));
      burst(g.x, g.y - 40, '#8cff4a', 30);
      if (dOp < 80) hurt(10, g.x, g.y);
    }
    // A partir da 2ª fase cospe ectoplasma, com 0,45 s de aviso (o chefe incha e brilha).
    if (g.phase >= 2) {
      g.cd -= dt;
      if (g.spit > 0) { g.spit -= dt; if (g.spit <= 0) { throwAt(g.x, g.y - g.size * 0.4, 'blob', 95, g.dmg); SFX.spit(); } }
      else if (g.cd <= 0) { g.cd = g.phase === 2 ? 3.2 : 2.4; g.spit = 0.45; }
    }
  } else wander(g);

  if (sup && !g.boss) { vx += (sup.x - g.x) * 0.6; vy += (sup.y - g.y) * 0.6; }
  g.x = clamp(g.x + vx * slow * dt, 24, W - 24);
  g.y = clamp(g.y + vy * slow * dt, 84 + (g.boss ? 20 : 0), H - 8);

  function wander(o) {
    if (hyp(o.tx - o.x, o.ty - o.y) < 4) { o.tx = rnd(40, W - 40); o.ty = rnd(110, H - 20); }
    const d = hyp(o.tx - o.x, o.ty - o.y) || 1;
    vx = (o.tx - o.x) / d * o.speed; vy = (o.ty - o.y) / d * o.speed;
  }
}

// O Poltergeist escolhe o móvel arremessável mais perto dele, que treme e flutua durante o aviso; depois o móvel
// some do lugar e voa no operador. Sem móvel por perto, o objeto solto aparece girando sobre o próprio fantasma.
const WINDUP = 0.6, LIFT = 10;                    // duração do aviso (s) e quanto o móvel sobe (px)
function startThrow(g) {
  let best = null, bd = 160;
  for (const p of M.props) if (p.throw && !p.lift) { const d = hyp(p.x - g.x, p.y - g.y); if (d < bd) { bd = d; best = p; } }
  if (best) best.lift = M.t;
  g.windup = { t: WINDUP, prop: best, kind: Math.random() < 0.5 ? 'chair' : 'lamp' };
  SFX.windup();
}
function releaseThrow(g) {
  const w = g.windup, p = w.prop;
  if (p && M.props.includes(p)) {
    M.props = M.props.filter(o => o !== p);
    burst(p.x, p.y - 10, '#c77dff', 10);
    throwAt(p.x, p.y - 12 - LIFT, p.name, 100, g.dmg);
  } else throwAt(g.x, g.y - g.size * 0.4, w.kind, 105, g.dmg);
  SFX.whoosh();
}

function throwAt(sx, sy, kind, speed, dmg) {
  const d = hyp(M.op.x - sx, M.op.y - 16 - sy) || 1;
  M.shots.push({ kind, x: sx, y: sy, vx: (M.op.x - sx) / d * speed, vy: (M.op.y - 16 - sy) / d * speed, life: 4, rot: 0, dmg });
}

// Captura: o fantasma não some de uma vez; ele é esticado e puxado para dentro do bico em CAPTURE_TIME s.
const CAPTURE_TIME = 0.35;
function capture(g) {
  M.ghosts = M.ghosts.filter(o => o !== g);
  if (g.windup && g.windup.prop) g.windup.prop.lift = 0;
  const gain = Math.round(g.reward * M.mul);
  M.bag += gain;
  M.dying.push({ g, t: 0, x: g.x, y: g.y - g.size * 0.45 });
  burst(g.x, g.y - g.size * 0.45, '#8cff4a', g.boss ? 60 : 22);
  M.hitstop = g.boss ? 0.18 : 0.06; shake(g.boss ? 0.6 : 0.12, g.boss ? 5 : 2);
  SFX.capture(g.boss);
  remember(g.memory, 'memory');
  toast(`${g.name} capturado · <b>+◆ ${gain}</b> em custódia`, 2200);
}

function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) M.parts.push({ x, y, vx: rnd(-50, 50), vy: rnd(-60, 20), life: rnd(0.4, 1), color });
}

function placeTrap(type) {
  if (!M || M.over) return;
  if (S.traps[type] <= 0) return toast(`Sem ${TRAPS[type].name.toLowerCase()}. Compre na loja.`, 1600);
  if (M.traps.length >= stat.slots()) return toast(`Só cabem ${stat.slots()} armadilhas em campo (upgrade Armadilhas).`, 1600);
  const d = hyp(mouse.x - M.op.x, mouse.y - M.op.y), k = Math.min(1, 70 / (d || 1));
  M.traps.push({ type, x: clamp(M.op.x + (mouse.x - M.op.x) * k, 20, W - 20), y: clamp(M.op.y + (mouse.y - M.op.y) * k, 100, H - 6) });
  SFX.trap();
  S.traps[type]--; save();
}

// Imóvel 100% limpo: bônus do contrato; bairro inteiro limpo valoriza no mapa e libera o próximo (§6.6).
function finishImovel() {
  if (scene !== 'mission' || S.clean[M.im.id]) return;
  M.finishIn = null;
  SFX.hum(false);
  const { im, bairro: b } = M;
  const bonus = CONTRACT * im.threat;
  S.plasma += M.bag + bonus; S.clean[im.id] = true; S.prog[im.id] = 3; save();
  if (BAIRROS.every(bairroDone)) return ending();
  const nextB = BAIRROS[BAIRROS.indexOf(b) + 1];
  const bairroMsg = bairroDone(b) ? `<p><b>${b.name} valorizado!</b>${nextB ? ` ${nextB.name} liberado no mapa.` : ''}</p>` : '';
  showScreen(`<div class="eyebrow">RELATÓRIO DE EXTRAÇÃO / OS ${orderNo(im)}</div><h1>Serviço concluído.</h1><p class="subtitle">${im.name}</p>
    <div class="receipt"><span class="stamp">LIBERADO</span><div>Plasma extraído <b>◆ ${M.bag}</b></div><div>Adicional de contrato <b>◆ ${bonus}</b></div><div class="receipt-total">Depositado na conta <b>◆ ${M.bag + bonus}</b></div></div>${bairroMsg}
    <p class="corporate-quote">A cidade agradece. O metro quadrado da rua subiu ${8 * im.threat}%.</p>
    <div class="row"><button class="btn neon" id="shop">Melhorar equipamento</button> <button class="btn go" id="bairro">${bairroDone(b) ? 'Voltar à central' : 'Próxima ordem de serviço'}</button></div>`, 'report-screen');
  $('shop').onclick = () => openShop(() => openBairro(b));
  $('bairro').onclick = () => bairroDone(b) ? goMap() : openBairro(b);
}

// Saída antes do fim (§6.6): evacuar entre etapas guarda tudo; morrer ou abandonar no meio perde metade.
function leave(why) {
  if (scene !== 'mission' || M.over) return;
  M.over = true;
  SFX.hum(false);
  const { im, bairro: b } = M;
  const full = why === 'evac' && M.cleared;
  const kept = full ? M.bag : Math.floor(M.bag / 2);
  S.plasma += kept; save();
  const done = S.prog[im.id] || 0;
  const title = full ? 'Evacuação segura' : why === 'dead' ? 'Resgatado' : 'Abandonou o imóvel';
  const text = full ? `Você saiu entre as etapas e guardou todo o plasma: <b>◆ ${kept}</b>.`
    : `${why === 'dead' ? 'O operador foi retirado pela equipe de resgate.' : 'Você saiu no meio da etapa.'} Metade do plasma da mochila se perdeu: ficou <b>◆ ${kept}</b>. A etapa ${ETAPA_NAMES[M.etapa].toLowerCase()} volta a contaminar.`;
  showScreen(`<div class="eyebrow">RELATÓRIO DE RESGATE / OS ${orderNo(im)}</div><h1 style="color:${full ? 'var(--ecto)' : 'var(--hp)'}">${title}</h1><h2>${im.name}</h2><p>${text}</p>
    <p>Etapas limpas: ${done}/3. Na próxima entrada você começa ${done < 3 ? 'no ' + ETAPA_NAMES[done].toLowerCase() : ''}, com vida cheia.</p>
    <div class="row"><button class="btn neon" id="shop">Equipamento</button> <button class="btn go" id="bairro">${b.name}</button></div>`, 'report-screen');
  $('shop').onclick = () => openShop(() => openBairro(b));
  $('bairro').onclick = () => openBairro(b);
}

// Ato 3 (§3.2) e vitória vazia: a cidade limpa, sem ninguém.
function ending() {
  showScreen(`<h1>Cidade 100% limpa</h1>
    <div class="memo">ARQUIVO INTERNO — LimpaCorp Espectral<br><br>
    Projeto PONTE (protótipo de <b>comunicação</b> espectral): os testes confirmaram contato estável com residentes falecidos.
    Os familiares reconheceram as vozes.<br><br>Status: <b>arquivado</b>. Motivo: retorno financeiro inferior à extração de plasma.</div>
    <p>Você guardou ${S.mem.length} memórias e ${S.notes.length} bilhetes de pessoas que alguém amou.</p>
    <button class="btn" id="next">Continuar</button>`);
  $('next').onclick = () => {
    showScreen(`<h2>Fim</h2><p>Os imóveis foram valorizados. As ruas estão vazias.<br>Ninguém mais chama ninguém para jantar.</p>
      <div class="ending-line">LIMPACORP ESPECTRAL<br><span>O futuro não deixa vestígios.</span></div>
      <div class="row"><button class="btn go" id="map">Ver a cidade</button><button class="btn" id="archive">Guardar as vozes</button> <button class="btn" id="again">Novo turno</button></div>`, 'ending-screen');
    $('map').onclick = goMap;
    $('archive').onclick = () => openArchive(ending);
    $('again').onclick = () => {
      showScreen(`<div class="eyebrow">NOVO TURNO</div><h1>Recomeçar a história?</h1><p>O progresso, o equipamento e os registros desta cidade serão apagados.</p><div class="row"><button class="btn go" id="cancel">Manter meu arquivo</button><button class="btn danger" id="resetSave">Apagar e recomeçar</button></div>`, 'pause-screen', ending);
      $('cancel').onclick = ending;
      $('resetSave').onclick = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.hash = ''; location.reload(); };
    };
  };
}

// ============================================================ HUD da missão (§8)

// Montado uma vez por etapa; a cada quadro só os números e as barras mudam (o botão de sair não é recriado).
function buildMissionHud() {
  $('hud').innerHTML = `<div><div class="lbl">Operador</div><div class="bar"><i id="hpBar" style="background:var(--hp)"></i><span id="hpTxt"></span></div></div>
    <div><div class="lbl">Tanque<span id="heat" style="color:var(--hp)"></span></div><div class="bar"><i id="tkBar"></i><span id="tkTxt"></span></div></div>
    <div><div class="lbl">Mochila</div><span class="plasma" id="bag"></span></div>
    <div><div class="lbl">Etapa ${M.etapa + 1}/3</div>${ETAPA_NAMES[M.etapa]} · <span id="left"></span></div>
    <div class="traps">${Object.entries(TRAPS).map(([id, t]) => `<div title="${t.name}: ${t.desc}"><img src="${ART + t.img}.png" alt=""><kbd>${t.key}</kbd>×<span id="tr-${id}"></span></div>`).join('')}</div>
    <div class="grow"></div><button class="btn" id="quit">Pausa [Esc]</button>`;
  $('quit').onclick = () => openPause();
}

function missionHud() {
  const hp = Math.max(0, M.op.hp);
  $('hpBar').style.width = hp + '%'; $('hpTxt').textContent = Math.ceil(hp);
  $('tkBar').style.width = M.tank / stat.tankMax() * 100 + '%';
  $('tkBar').style.background = M.overheat ? '#7a5050' : 'var(--ecto2)';
  $('tkTxt').textContent = Math.round(M.tank);
  $('heat').textContent = M.overheat ? ' · recarregando' : '';
  $('bag').textContent = '◆ ' + M.bag;
  $('left').textContent = M.cleared ? 'liberada' : M.ghosts.length + ' ecos';
  const objective = `<span class="objective-step">0${M.etapa + 1} / 03</span><div><small>OS ${orderNo(M.im)} · ${M.bairro.name}</small><strong>${M.cleared ? M.etapa === 2 ? 'Extração concluída. Emitindo relatório…' : M.etapa === 0 ? 'Área liberada. Entre pela porta.' : 'Área liberada. Desça pela escada.' : 'Localize e capture as presenças.'}</strong></div><span class="field-hint">${M.cleared ? 'ESC · opções de extração' : 'WASD · mover / mouse · sugar / J · arquivo'}</span>`;
  if ($('objective').innerHTML !== objective) $('objective').innerHTML = objective;
  for (const id in TRAPS) $('tr-' + id).textContent = S.traps[id];
}

// ============================================================ desenho da etapa

function drawMission(now) {
  const op = M.op;
  const sh = M.shake > 0 ? M.shakeMag : 0;
  ctx.setTransform(2, 0, 0, 2, Math.round(rnd(-sh, sh)) * 2, Math.round(rnd(-sh, sh)) * 2);
  ctx.imageSmoothingEnabled = false;
  const room = ROOMS[M.kind];
  if (!room) {
    ctx.drawImage(ground, 0, 0);
    ctx.drawImage(IMG['buildings/casa_contaminada'], 176, -26);
  } else {
    ctx.fillStyle = ctx.createPattern(IMG['interior/' + room.floor], 'repeat'); ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 128) ctx.drawImage(IMG['interior/' + room.wall], x, -2);
    ctx.fillStyle = '#120f1a'; ctx.fillRect(0, 0, 6, H); ctx.fillRect(W - 6, 0, 6, H); ctx.fillRect(0, H - 3, W, 3);
  }
  if (M.im.id === 'acacias') drawAcaciasDetails();
  for (const p of M.puddles) ctx.drawImage(IMG['props/poca_ecto'], p.x - 32, p.y - 20, 64, 40);

  // Contaminação: névoa verde/roxa que some conforme o plasma da etapa é sugado.
  const left = M.total ? M.ghosts.reduce((s, g) => s + g.p, 0) / M.total : 0;
  ctx.fillStyle = `rgba(60,25,90,${0.08 + 0.24 * left})`; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) {
    const fx = (i * 113 + now / 60 * (i % 2 ? 1 : -1)) % (W + 160) - 80, fy = 70 + i * 40;
    const g = ctx.createRadialGradient(fx, fy, 4, fx, fy, 90);
    g.addColorStop(0, `rgba(120,255,80,${0.09 * left})`); g.addColorStop(1, 'rgba(120,255,80,0)');
    ctx.fillStyle = g; ctx.fillRect(fx - 90, fy - 90, 180, 180);
  }
  if (M.im.id === 'acacias') drawHouseLight();

  // Objetos planos no chão (tapete, gosma, escada, bilhete) antes de tudo.
  for (const p of M.props) if (p.flat) drawProp(p);
  if (M.exit && M.cleared) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 160);
    ctx.strokeStyle = `rgba(140,255,74,${0.4 + 0.5 * pulse})`; ctx.lineWidth = 2;
    ctx.strokeRect(M.exit.x, M.exit.y, M.exit.w, M.exit.h); ctx.lineWidth = 1;
  }
  if (M.note) {
    const bob = Math.sin(now / 250) * 2;
    ctx.drawImage(IMG['props/bilhete'], M.note.x - 16, M.note.y - 24 + bob);
  }

  for (const tr of M.traps) {
    const R = TRAPS[tr.type].radius;
    ctx.strokeStyle = tr.type === 'auto' ? 'rgba(140,255,74,.25)' : 'rgba(199,125,255,.3)';
    ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.ellipse(tr.x, tr.y, R, R * 0.6, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.drawImage(IMG[TRAPS[tr.type].img], tr.x - 16, tr.y - 28);
    if (tr.link) beam(tr.x, tr.y - 22, tr.link.x, tr.link.y - tr.link.size * 0.45, now, 0.5);
  }

  // Paredes, móveis, operador e fantasmas por altura (pés); fantasmas semitransparentes (§4) e flutuando.
  const list = [{ op: true, y: op.y }, ...M.ghosts.map(g => ({ g, y: g.y })),
    ...M.props.filter(p => !p.flat).map(p => ({ p, y: p.y })), ...(room ? M.walls.map(w => ({ w, y: w.y + w.h })) : [])]
    .sort((a, b) => a.y - b.y);
  for (const e of list) {
    if (e.op) drawOperator(now);
    else if (e.p) drawProp(e.p);
    else if (e.w) drawWall(e.w, room);
    else drawGhost(e.g, now);
  }

  for (const s of M.shots) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
    const im = IMG['props/' + s.kind];
    if (im) ctx.drawImage(im, -im.width * 0.35, -im.height * 0.35, im.width * 0.7, im.height * 0.7);
    else if (s.kind === 'chair') { ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-5, -5, 10, 3); ctx.fillRect(-5, -5, 3, 11); ctx.fillRect(2, -2, 3, 8); }
    else if (s.kind === 'lamp') { ctx.fillStyle = '#f2c46b'; ctx.fillRect(-5, -6, 10, 5); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-1, -1, 2, 8); }
    else { ctx.fillStyle = '#8cff4a'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#c77dff'; ctx.fillRect(-1, -1, 3, 3); }
    ctx.restore();
  }

  if (M.beam) {
    const nz = nozzle(); beam(nz.x, nz.y, M.beam.x, M.beam.y, now, M.beam.hit ? 1 : 0.45);
    // Desenho sem alterar a simulação: a cena permanece congelada durante a pausa.
    if (M.beam.blocked) { ctx.fillStyle = '#8cff4a'; ctx.fillRect(M.beam.x - 1, M.beam.y - 1, 3, 3); }
  }
  if (mouse.down && !M.overheat) {
    ctx.strokeStyle = 'rgba(140,255,74,.18)'; ctx.beginPath(); ctx.arc(op.x, op.y - 18, stat.range(), 0, 7); ctx.stroke();
  }
  for (const p of M.parts) { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 2, 2); }
  ctx.globalAlpha = 1;
  for (const d of M.dying) drawDying(d);

  if (M.dark) drawDarkness(now);

  // Borda vermelha logo depois de um golpe.
  if (M.red > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    g.addColorStop(0, 'rgba(255,40,40,0)'); g.addColorStop(1, `rgba(255,40,40,${0.55 * M.red / 0.45})`);
    ctx.fillStyle = g; ctx.fillRect(-8, -8, W + 16, H + 16);
  }

  // Decodificador (upgrade de história, §6.4): a memória aparece ao passar a mira sobre o fantasma.
  if (S.up.decoder) {
    const g = M.ghosts.find(o => hyp(o.x - mouse.x, o.y - o.size * 0.45 - mouse.y) < o.r + 8);
    if (g) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = '20px VT323, monospace'; ctx.textAlign = 'center';
      const w = ctx.measureText(g.memory).width + 16;
      const tx = clamp(g.x * 2, w / 2 + 4, 956 - w / 2), ty = Math.max(90, (g.y - g.size - 18) * 2);
      ctx.fillStyle = 'rgba(13,11,20,.85)'; ctx.fillRect(tx - w / 2, ty - 18, w, 24);
      ctx.fillStyle = '#d9c6ff'; ctx.fillText(g.memory, tx, ty);
    }
  }
}

// Detalhes decorativos da casa de referência: não participam da colisão nem da mira.
function drawAcaciasDetails() {
  ctx.save();
  if (M.kind === 'rua') {
    ctx.fillStyle = '#262c30'; ctx.fillRect(294, 65, 30, 18);
    ctx.strokeStyle = '#c6b980'; ctx.strokeRect(295, 66, 28, 16);
    ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#e5d8aa'; ctx.fillText('12', 309, 74);
    ctx.font = '4px monospace'; ctx.fillText('SOUZA', 309, 80);
    // Soleira e caminho gasto, assentados sobre o piso existente.
    ctx.fillStyle = '#938974'; ctx.fillRect(226, 109, 34, 3);
    ctx.fillStyle = 'rgba(207,189,143,.12)';
    for (let i = 0; i < 4; i++) ctx.fillRect(230 + (i % 2) * 2, 116 + i * 7, 24, 4);
  } else if (M.kind === 'sala') {
    // Janela e retratos na parede do fundo, acima dos móveis.
    ctx.fillStyle = '#392c2d'; ctx.fillRect(159, 14, 48, 39);
    ctx.fillStyle = '#171e2a'; ctx.fillRect(163, 17, 40, 32);
    ctx.fillStyle = M.cleared ? '#8c9b83' : '#40515b'; ctx.fillRect(165, 19, 36, 27);
    ctx.fillStyle = '#796854'; ctx.fillRect(181, 17, 3, 32); ctx.fillRect(163, 31, 40, 3); ctx.fillRect(158, 50, 51, 4);
    ctx.fillStyle = '#65535c'; ctx.fillRect(155, 12, 8, 41); ctx.fillRect(203, 12, 8, 41);
    for (const [x, y] of [[64, 23], [88, 17], [115, 24]]) {
      ctx.fillStyle = '#987849'; ctx.fillRect(x, y, 17, 21);
      ctx.fillStyle = '#242b30'; ctx.fillRect(x + 2, y + 2, 13, 17);
      ctx.fillStyle = '#b9a080'; ctx.fillRect(x + 6, y + 5, 5, 5);
      ctx.fillStyle = '#78676c'; ctx.fillRect(x + 4, y + 11, 9, 6);
    }
    // Luz da janela revela discretamente o chão, preservando a leitura do combate.
    ctx.fillStyle = 'rgba(207,193,143,.055)'; ctx.beginPath(); ctx.moveTo(164, 55); ctx.lineTo(204, 55); ctx.lineTo(278, 234); ctx.lineTo(198, 234); ctx.fill();
    ctx.fillStyle = '#736350'; ctx.fillRect(18, 69, 268, 2);
  } else if (M.kind === 'porao') {
    ctx.strokeStyle = '#535255'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(12, 46); ctx.lineTo(282, 46); ctx.lineTo(282, 65); ctx.stroke();
    ctx.strokeStyle = '#8b7e6b'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(12, 44); ctx.lineTo(284, 44); ctx.stroke();
    ctx.fillStyle = '#29272c'; ctx.fillRect(211, 20, 27, 20);
    ctx.fillStyle = '#9a8b68'; ctx.fillRect(213, 22, 23, 16);
    ctx.fillStyle = '#443a32'; ctx.font = '5px monospace'; ctx.fillText('SOUZA', 215, 29); ctx.fillText('1987', 215, 35);
  }
  // Marcas de uso apenas nas bordas; posições determinísticas, sem ruído por quadro.
  ctx.fillStyle = 'rgba(16,15,22,.20)';
  for (let i = 0; i < 22; i++) {
    const x = 10 + (i * 37) % 460, y = i % 2 ? 259 - (i % 4) * 3 : 73 + (i % 3) * 4;
    ctx.fillRect(x, y, 3 + i % 6, 1);
  }
  ctx.restore();
}

function drawHouseLight() {
  ctx.save();
  const lights = M.kind === 'rua' ? [[242, 100, 60]] : M.kind === 'sala' ? [[34, 100, 75], [280, 232, 65], [183, 58, 95]] : [[56, 94, 45]];
  for (const [x, y, r] of lights) {
    const light = ctx.createRadialGradient(x, y, 1, x, y, r);
    light.addColorStop(0, `rgba(255,202,119,${0.07 + M.clearBlend * 0.13})`);
    light.addColorStop(1, 'rgba(255,202,119,0)');
    ctx.fillStyle = light; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

function drawProp(p) {
  const im = IMG['props/' + p.name];
  if (!im || !im.width) return;
  if (!p.flat) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 3, im.width * 0.38, 4, 0, 0, 7); ctx.fill(); }
  // Durante o aviso do Poltergeist o móvel treme, sobe e ganha um contorno roxo.
  let dx = 0, dy = 0;
  if (p.lift) {
    const k = clamp((M.t - p.lift) / WINDUP, 0, 1);
    dx = Math.round(rnd(-1, 1) * (1 + k)); dy = -Math.round(LIFT * k);
    ctx.filter = `drop-shadow(0 0 2px #c77dff) brightness(${1 + 0.4 * k})`;
  }
  const scale = p.flat ? p.scale || 1 : 1;
  ctx.drawImage(im, Math.round(p.x - im.width * scale / 2) + dx, Math.round(p.flat ? p.y - im.height * scale / 2 : p.y - im.height + 4) + dy, im.width * scale, im.height * scale);
  ctx.filter = 'none';
}

// Fantasma capturado: estica na direção do bico, encolhe e é puxado para dentro.
function drawDying(d) {
  const g = d.g, k = d.t / CAPTURE_TIME, nz = nozzle(), im = IMG[g.img];
  const x = d.x + (nz.x - d.x) * k * k, y = d.y + (nz.y - d.y) * k * k;
  const a = Math.atan2(nz.y - d.y, nz.x - d.x), sc = 1 - k * 0.9;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.scale(sc * (1 + k * 1.5), sc * (1 - k * 0.5));
  ctx.rotate(-a);
  ctx.globalAlpha = 0.9 - k * 0.5; ctx.filter = `brightness(${1.3 + k})`;
  ctx.drawImage(im, -g.size / 2, -g.size * 0.55);
  ctx.restore(); ctx.filter = 'none'; ctx.globalAlpha = 1;
}

// Parede interna em 3/4 (como as de Stardew Valley): o tampo é uma faixa de reboco com moldura clara e sombra
// interna, a face embaixo usa a textura da parede do cômodo com rodapé, e a parede projeta sombra no piso.
// Antes o tampo era um retângulo escuro liso, que parecia um pilar solto no meio da sala.
function drawWall(w, room) {
  const face = 22, top = w.y - face, topH = w.h;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(w.x + 2, w.y + w.h, w.w, 4);              // sombra no piso
  ctx.fillStyle = '#5a4870'; ctx.fillRect(w.x, top, w.w, topH);                              // tampo
  ctx.fillStyle = '#6e5a88'; ctx.fillRect(w.x + 1, top + 1, w.w - 2, topH - 2);
  ctx.fillStyle = '#4a3a5e';
  for (let y = top + 6; y < top + topH - 2; y += 8) ctx.fillRect(w.x + 2, y, w.w - 4, 1);      // juntas do reboco
  ctx.fillStyle = '#8a76a6'; ctx.fillRect(w.x, top, w.w, 1); ctx.fillRect(w.x, top, 1, topH); // luz de cima/esquerda
  ctx.fillStyle = '#2b2236'; ctx.fillRect(w.x + w.w - 1, top, 1, topH);
  const fy = w.y + w.h - face;                                                               // face
  ctx.save(); ctx.beginPath(); ctx.rect(w.x, fy, w.w, face); ctx.clip();
  for (let x = w.x - (w.x % 128); x < w.x + w.w; x += 128) ctx.drawImage(IMG['interior/' + room.wall], x, fy - 30);
  ctx.restore();
  ctx.fillStyle = '#1a1424'; ctx.fillRect(w.x, fy, w.w, 1);
  ctx.fillStyle = '#3b2c22'; ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);                      // rodapé
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(w.x, fy, 1, face); ctx.fillRect(w.x + w.w - 1, fy, 1, face);
}

function drawOperator(now) {
  const op = M.op;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(op.x, op.y - 2, 11, 4, 0, 0, 7); ctx.fill();
  // Andando: quadros da caminhada do PixelLab; parado (ou se a animação não carregou): a pose da direção.
  const walkIm = IMG[`chars/operador/walk/${DIRS[op.dir]}_${Math.floor(op.walk) % WALK_FRAMES}`];
  const im = op.moving && walkIm && walkIm.width ? walkIm : IMG['chars/operador/' + DIRS[op.dir]];
  const bob = op.moving && im !== walkIm ? Math.abs(Math.sin(now / 90)) * 2 : 0;
  // Invencível depois do golpe: pisca.
  if (M.t - op.hurt < IFRAMES && Math.floor(M.t * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  if (M.t - op.hurt < 0.12) ctx.filter = 'brightness(2) saturate(0)';
  ctx.drawImage(im, Math.round(op.x - im.width / 2), Math.round(op.y - 46 - bob - (im.height - 48)));
  ctx.filter = 'none'; ctx.globalAlpha = 1;
}

function drawGhost(g, now) {
  const s = g.size, bob = Math.sin(now / 400 + g.seed) * 3;
  ctx.fillStyle = 'rgba(80,255,120,.18)'; ctx.beginPath(); ctx.ellipse(g.x, g.y - 2, s * 0.25, s * 0.08, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 0.82 + 0.1 * Math.sin(now / 200 + g.seed);
  const sucked = M.t - g.lastHit < 0.05 && M.beam && M.beam.hit;
  const warn = (g.windup && !g.windup.prop) || g.spit > 0;
  if (sucked || warn) ctx.filter = `brightness(${warn ? 1.6 + 0.4 * Math.sin(now / 40) : 1.4})`;
  else if (M.t - g.aimed < 0.1) ctx.filter = 'brightness(1.4)';
  // Sendo sugado: treme e estica um pouco; chefe prestes a cuspir: incha.
  const jx = sucked ? Math.round(rnd(-1, 1)) : 0, sx = sucked ? 0.92 : 1, sy = sucked ? 1.08 : g.spit > 0 ? 1.06 : 1;
  ctx.drawImage(IMG[g.img], Math.round(g.x - s * sx / 2) + jx, Math.round(g.y - s * sy - 6 + bob), s * sx, s * sy);
  if (g.windup && !g.windup.prop) {   // objeto solto girando sobre o fantasma durante o aviso
    ctx.save(); ctx.translate(g.x, g.y - s - 4 + bob); ctx.rotate(now / 80);
    ctx.fillStyle = g.windup.kind === 'chair' ? '#7a4a2a' : '#f2c46b'; ctx.fillRect(-4, -4, 8, 8); ctx.restore();
  }
  ctx.filter = 'none'; ctx.globalAlpha = 1;
  if (g.p < g.max || M.t - g.aimed < 1) {
    const w = g.boss ? 60 : 30, bx = g.x - w / 2, by = g.y - s - 12 + bob;
    ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, w + 2, 5);
    ctx.fillStyle = '#8cff4a'; ctx.fillRect(bx, by, w * Math.max(0, g.p) / g.max, 3);
  }
}

// Escuro do porão (e do térreo no Centro Antigo): máscara com o círculo da lanterna; fantasmas, gosma e armadilhas
// brilham um pouco, então dá para vê-los de longe, mas móveis e objetos arremessados só aparecem na luz.
function drawDarkness(now) {
  dctx.globalCompositeOperation = 'source-over';
  dctx.clearRect(0, 0, W, H);
  dctx.fillStyle = `rgba(4,3,9,${M.dark})`; dctx.fillRect(0, 0, W, H);
  dctx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => {
    const g = dctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g; dctx.beginPath(); dctx.arc(x, y, r, 0, 7); dctx.fill();
  };
  const flick = 1 + Math.sin(now / 70) * 0.02;
  hole(M.op.x, M.op.y - 14, stat.light() * flick, 1);
  const nz = nozzle();
  hole(nz.x + Math.cos(nz.a) * 40, nz.y + Math.sin(nz.a) * 30, stat.light() * 0.7, 0.8);    // facho na direção da mira
  for (const g of M.ghosts) hole(g.x, g.y - g.size * 0.45, g.size * 0.55, 0.6);
  for (const s of M.shots) if (s.kind === 'blob') hole(s.x, s.y, 10, 0.8);
  for (const tr of M.traps) hole(tr.x, tr.y - 12, 18, 0.7);
  for (const p of M.props) if (p.name === 'poca_ecto') hole(p.x, p.y, 18, 0.5);
  if (M.exit && M.cleared) hole(M.exit.x + M.exit.w / 2, M.exit.y + M.exit.h / 2, 30, 0.8);
  if (M.note) hole(M.note.x, M.note.y - 12, 16, 0.7);
  if (M.beam) hole(M.beam.x, M.beam.y, 16, 0.7);
  ctx.drawImage(darkCv, 0, 0);
}

// Feixe de sucção: duas linhas onduladas verdes do bico até o alvo.
function beam(x1, y1, x2, y2, now, power) {
  const d = hyp(x2 - x1, y2 - y1), n = Math.max(4, Math.floor(d / 6)), nx = -(y2 - y1) / (d || 1), ny = (x2 - x1) / (d || 1);
  for (const [w, color] of [[4, `rgba(140,255,74,${0.25 * power})`], [1.5, `rgba(220,255,200,${0.9 * power})`]]) {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const t = i / n, wob = Math.sin(t * 12 - now / 40) * 2.5 * Math.sin(t * Math.PI);
      ctx[i ? 'lineTo' : 'moveTo'](x1 + (x2 - x1) * t + nx * wob, y1 + (y2 - y1) * t + ny * wob);
    }
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

// ============================================================ entrada

function viewPos(ev) {
  const r = cv.getBoundingClientRect();
  return { x: (ev.clientX - r.left) / r.width * 960, y: (ev.clientY - r.top) / r.height * 540 };
}
cv.addEventListener('contextmenu', ev => ev.preventDefault());
cv.addEventListener('pointermove', ev => {
  const p = viewPos(ev);
  mouse.x = p.x / 2; mouse.y = p.y / 2;
  if (scene === 'map') { hoverBairro = bairroAt(p.x, p.y); cv.style.cursor = hoverBairro ? 'pointer' : 'default'; }
  else cv.style.cursor = 'crosshair';
});
addEventListener('pointerdown', () => SFX.unlock());
cv.addEventListener('pointerdown', ev => {
  const p = viewPos(ev);
  mouse.x = p.x / 2; mouse.y = p.y / 2;
  if (scene === 'map') {
    const b = bairroAt(p.x, p.y);
    if (b && bairroOpen(b)) openBairro(b);
    else if (b) toast(`${b.name} está bloqueado: limpe o bairro anterior, chefe incluído.`, 2600);
    return;
  }
  if (scene === 'mission') mouse.down = true;   // §6.2 usa o botão direito; o esquerdo também suga (touchpad)
});
addEventListener('pointerup', () => { mouse.down = false; });
addEventListener('blur', () => { resetInput(); if (scene === 'mission') openPause('Pausa automática: a janela perdeu o foco. Retome quando estiver pronto.'); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && scene === 'mission') openPause('Pausa automática: você saiu da janela do jogo.');
});
addEventListener('keydown', ev => {
  const k = ev.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'escape'].includes(k) && scene === 'mission') ev.preventDefault();
  // Mantém a navegação por teclado dentro do terminal aberto.
  if (k === 'tab' && scene === 'screen') {
    const focusable = [...$('screen').querySelectorAll('button:not(:disabled), [tabindex="0"]')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (first && (ev.shiftKey && (document.activeElement === first || document.activeElement === $('screen')))) { ev.preventDefault(); last.focus(); }
    else if (first && !ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    return;
  }
  keys.add(k);
  if (ev.repeat) return;
  SFX.unlock();
  if (k === 'm') {
    const muted = SFX.toggleMute();
    toast(muted ? 'Som desligado [M]' : 'Som ligado [M]', 1200);
    if ($('audio')) $('audio').textContent = `Som: ${muted ? 'desligado' : 'ligado'}`;
  }
  if (scene === 'mission') {
    if (k === 'q') placeTrap('auto');
    if (k === 'e') placeTrap('sup');
    if (k === 'escape') openPause();
    if (k === 'j') { openPause(); openArchive(openPause); }
  } else if (scene === 'map') {
    if (k === 'u') openShop(goMap);
    if (k === 'j') openArchive(goMap);
  } else if (k === 'escape' && screenBack) { ev.preventDefault(); screenBack(); }
  else if (k === 'j' && paused && $('screen').classList.contains('pause-screen')) openArchive(openPause);
});
addEventListener('keyup', ev => keys.delete(ev.key.toLowerCase()));

// ============================================================ laço, escala e início

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (scene === 'mission' && M) { updateMission(dt); if (M && scene === 'mission') drawMission(M.t * 1000); }
  else if (!M) drawMap(now);
  if (scene !== 'screen' && noticeTime > 0) {
    noticeTime = Math.max(0, noticeTime - dt);
    if (noticeTime === 0) $('memoryNotice').classList.add('hidden');
  }
  requestAnimationFrame(frame);
}

function fit() {
  const s = Math.min(innerWidth / 960, innerHeight / 540), app = $('app');
  app.style.transform = `scale(${s})`;
  app.style.left = (innerWidth - 960 * s) / 2 + 'px';
  app.style.top = (innerHeight - 540 * s) / 2 + 'px';
}
addEventListener('resize', fit);
fit();

// Gancho do Ato 1 (§3.2): tom corporativo e leve.
function intro() {
  showScreen(`<div class="title-copy"><div class="eyebrow">SEU PRÓXIMO TURNO COMEÇA AGORA</div><h1>PROTOCOLO<br><span>ECTOPLASMA</span></h1>
    <p>Uma cidade para limpar.<br>Algumas coisas para esquecer.</p>
    <div class="title-rule"></div><p class="title-memo">Operador 0451, apresente-se à Vila Operária.<br>Capture as presenças. Entregue o plasma.<br>A valorização da cidade começa com você.</p>
    <div class="row"><button class="btn go" id="start">Bater o ponto →</button><button class="btn" id="controls">Manual do operador</button></div>
    <small>WASD + mouse · Esc pausa · progresso salvo neste navegador</small></div>
    <div class="title-scene"><span class="title-coordinate">SETOR 01 / VILA OPERÁRIA</span><img class="title-house" src="${ART}buildings/casa_contaminada.png" alt="Casa tomada por ectoplasma"><img class="title-ghost" src="${ART}ghosts/errante.png" alt=""><img class="title-operator" src="${ART}chars/operador/north-east.png" alt="Operador da LimpaCorp"><span class="title-slogan">FANTASMA NÃO É GENTE.<br><b>É ESTOQUE.</b></span></div>`, 'title-screen');
  $('start').onclick = () => { S.intro = true; save(); goMap(); };
  $('controls').onclick = () => openControls(intro);
}

loadImages().then(() => {
  buildGround();
  requestAnimationFrame(frame);
  // Atalho #t<bairro><imóvel>, com #e<etapa> opcional: #t13,e3 = Vila Operária, casa 4, porão.
  const t = [...DEV].map(d => /^t(\d)(\d)$/.exec(d)).find(Boolean);
  const e = [...DEV].map(d => /^e(\d)$/.exec(d)).find(Boolean);
  if (t) { const b = BAIRROS[+t[1] - 1]; startImovel(b, b.imoveis[+t[2] - 1], e ? +e[1] - 1 : undefined); }
  else if (DEV.has('go') || S.intro) goMap();
  else intro();
});
