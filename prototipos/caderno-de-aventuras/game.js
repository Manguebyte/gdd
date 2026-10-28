// game.js — Caderno de Aventuras: o RPG de caderno da escola.
//
// POR QUE: o herói anda pela folha e o "mestre" vai desenhando o mapa com
// canetas coloridas à medida que ele chega perto. Monstros, fogueiras e baús
// aparecem desenhados; brigar é rolar dados: cada item equipado dá dados
// (a espada de madeira dá 1d6, a melhor lâmina dá 5d20), a soma é o dano, e
// o monstro faz o mesmo de volta. Escudo e armadura rolam dados de defesa
// que descontam do dano recebido. Cada monstro tem um rei (chefe) no fundo
// da sua masmorra; personagens com "!" dão missões; à noite os monstros
// ficam mais fortes e, sem tocha, o herói quase não enxerga. Não há vilas:
// como num souls-like, há fogueiras de acampamento. Descansar nelas cura,
// mas todo monstro vencido volta; os guerreiros em volta vendem coisas.
// O mundo são 5 páginas do caderno, uma por bioma (Campos, Deserto,
// Montanhas Geladas, Pântano Sombrio e Vulcão); no fim de cada uma, o
// mestre vira a página. O dragão mora no fim da última.
//
// ESTRATÉGIA: o mapa revelado é "assado" em pedaços de canvas (chunks) e só
// os quadrados novos são desenhados a cada quadro, aos poucos, com a caneta
// do mestre na ponta do traço. Menus e luta são HTML por cima, em folha
// pautada; dados e monstros são desenhados em canvas pequenos. O "mapa
// atual" (M) é a página onde o herói está (W) ou o interior de uma
// masmorra dela; cada um tem o seu estado (L: quadrados revelados, rastro,
// monstros vencidos, baús abertos).
(function () {
  'use strict';
  const S = Sketch, C = S.C, A = Art, Wd = World;
  const T = 64, CH = 8, BAKE = 1.5;
  const SAVE_KEY = 'caderno-aventuras-save-v3';
  const $ = id => document.getElementById(id);
  const qs = new URLSearchParams(location.search);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- dados do jogo (números são proposta) ----------
  // loja = nível da fogueira que vende: a página (1 nos Campos ... 5 no Vulcão).
  // Teto de 5 dados: a arma dá até 5; o escudo até 2 e a armadura até 3, então
  // os dois juntos também defendem com no máximo 5 (os dados ficam maiores).
  const ITEMS = {
    espada_madeira: { nome: 'Espada de madeira', slot: 'arma', dado: [1, 6], preco: 10, icon: 'sword', cor: C.BROWN, loja: 1 },
    espada_curta: { nome: 'Espada curta', slot: 'arma', dado: [1, 8], preco: 30, icon: 'sword', cor: C.GRAY, loja: 1 },
    espada_ferro: { nome: 'Espada de ferro', slot: 'arma', dado: [2, 6], preco: 70, icon: 'sword', cor: C.INK, loja: 1 },
    machado: { nome: 'Machado de guerra', slot: 'arma', dado: [2, 8], preco: 140, icon: 'axe', cor: C.GRAY, loja: 2 },
    espada_prata: { nome: 'Espada de prata', slot: 'arma', dado: [3, 8], preco: 260, icon: 'sword', cor: C.LBLUE, loja: 2 },
    montante: { nome: 'Montante', slot: 'arma', dado: [3, 12], preco: 600, icon: 'sword', cor: C.BLUE, loja: 3 },
    espada_runica: { nome: 'Espada rúnica', slot: 'arma', dado: [4, 12], preco: 1100, icon: 'sword', cor: C.PURPLE, loja: 3 },
    espada_cristal: { nome: 'Espada de cristal', slot: 'arma', dado: [5, 12], preco: 2600, icon: 'sword', cor: C.PINK, loja: 4 },
    lamina_dragao: { nome: 'Lâmina do Dragão', slot: 'arma', dado: [5, 20], preco: 6000, icon: 'sword', cor: C.RED, loja: 5 },
    tampa_panela: { nome: 'Tampa de panela', slot: 'escudo', dado: [1, 4], preco: 12, icon: 'shield', cor: C.GRAY, loja: 1 },
    escudo_madeira: { nome: 'Escudo de madeira', slot: 'escudo', dado: [1, 6], preco: 40, icon: 'shield', cor: C.BROWN, loja: 1 },
    escudo_ferro: { nome: 'Escudo de ferro', slot: 'escudo', dado: [1, 10], preco: 160, icon: 'shield', cor: C.INK, loja: 2 },
    escudo_torre: { nome: 'Escudo de torre', slot: 'escudo', dado: [2, 8], preco: 500, icon: 'shield', cor: C.BLUE, loja: 3 },
    escudo_runico: { nome: 'Escudo rúnico', slot: 'escudo', dado: [2, 10], preco: 1900, icon: 'shield', cor: C.PURPLE, loja: 4 },
    escudo_dragao: { nome: 'Escudo de dragão', slot: 'escudo', dado: [2, 12], preco: 4200, icon: 'shield', cor: C.RED, loja: 5 },
    roupa_couro: { nome: 'Roupa de couro', slot: 'armadura', dado: [1, 4], preco: 25, icon: 'armor', cor: C.BROWN, loja: 1 },
    cota_malha: { nome: 'Cota de malha', slot: 'armadura', dado: [2, 4], preco: 110, icon: 'armor', cor: C.GRAY, loja: 2 },
    placas: { nome: 'Armadura de placas', slot: 'armadura', dado: [2, 8], preco: 380, icon: 'armor', cor: C.INK, loja: 2 },
    armadura_gelo: { nome: 'Armadura de gelo', slot: 'armadura', dado: [2, 12], preco: 950, icon: 'armor', cor: C.LBLUE, loja: 3 },
    armadura_runica: { nome: 'Armadura rúnica', slot: 'armadura', dado: [3, 12], preco: 2400, icon: 'armor', cor: C.PURPLE, loja: 4 },
    armadura_dragao: { nome: 'Armadura de dragão', slot: 'armadura', dado: [3, 20], preco: 5000, icon: 'armor', cor: C.RED, loja: 5 },
    pocao_vida: { nome: 'Poção de vida', slot: 'pocao', dado: [3, 6], preco: 12, icon: 'potion', cor: C.RED, loja: 1, efeito: 'hp' },
    pocao_mana: { nome: 'Poção de magia', slot: 'pocao', dado: [2, 4], preco: 15, icon: 'potion', cor: C.BLUE, loja: 1, efeito: 'pm' },
    pocao_grande: { nome: 'Poção grande', slot: 'pocao', dado: [8, 8], preco: 70, icon: 'potion', cor: C.PINK, loja: 3, efeito: 'hp' },
  };
  const POTS = Object.keys(ITEMS).filter(id => ITEMS[id].slot === 'pocao');
  // Feitiço gasta Magia (PM) e ignora a defesa do monstro.
  const SPELLS = {
    faisca: { nome: 'Faísca', pm: 1, dado: [2, 4], tipo: 'dano', cor: C.YELLOW, preco: 30, loja: 1 },
    cura: { nome: 'Cura', pm: 2, dado: [2, 6], tipo: 'cura', cor: C.GREEN, preco: 45, loja: 1 },
    bola_fogo: { nome: 'Bola de fogo', pm: 3, dado: [3, 8], tipo: 'dano', cor: C.ORANGE, preco: 150, loja: 2 },
    raio: { nome: 'Raio', pm: 5, dado: [4, 10], tipo: 'dano', cor: C.PURPLE, preco: 420, loja: 3 },
    cura_maior: { nome: 'Cura maior', pm: 5, dado: [6, 8], tipo: 'cura', cor: C.LGREEN, preco: 900, loja: 3 },
    nevasca: { nome: 'Nevasca', pm: 7, dado: [6, 10], tipo: 'dano', cor: C.LBLUE, preco: 1600, loja: 4 },
    meteoro: { nome: 'Meteoro', pm: 9, dado: [8, 12], tipo: 'dano', cor: C.RED, preco: 3500, loja: 5 },
  };
  // Moedas e experiência por região do mundo (1 a 15); os números de cada
  // monstro estão na tabela logo abaixo.
  const OURO = [null, [2, 4], [3, 6], [4, 6], [4, 8], [5, 8], [6, 8], [6, 10], [7, 10], [8, 10], [4, 20], [5, 20], [6, 20], [7, 20], [8, 20], [8, 20]];
  const XP = [0, 3, 6, 10, 14, 19, 25, 32, 40, 50, 62, 75, 90, 108, 128, 150];
  const mon = (pl, nome, art, tier, hp, atk, def) => ({ pl, nome, art, hp, atk, def, ouro: OURO[tier], xp: XP[tier] });
  const MONSTERS = {
    // Campos
    slime: mon('slimes', 'Slime', 'o', 1, 8, [1, 4], null),
    rato: mon('ratos gigantes', 'Rato gigante', 'o', 1, 6, [1, 6], null),
    goblin: mon('goblins', 'Goblin', 'o', 2, 14, [2, 4], null),
    lobo: mon('lobos', 'Lobo', 'o', 2, 16, [1, 10], null),
    aranha: mon('aranhas gigantes', 'Aranha gigante', 'a', 3, 20, [2, 6], [1, 4]),
    orc: mon('orcs', 'Orc', 'o', 3, 24, [1, 12], [1, 4]),
    // Deserto
    escorpiao: mon('escorpiões gigantes', 'Escorpião gigante', 'o', 4, 26, [2, 6], [1, 6]),
    cobra: mon('najas', 'Naja', 'a', 4, 22, [2, 8], null),
    esqueleto: mon('esqueletos', 'Esqueleto', 'o', 5, 34, [2, 8], [1, 4]),
    mumia: mon('múmias', 'Múmia', 'a', 5, 40, [3, 6], [1, 6]),
    verme: mon('vermes da areia', 'Verme da areia', 'o', 6, 58, [3, 8], [1, 6]),
    golem: mon('golens de pedra', 'Golem de pedra', 'o', 6, 64, [3, 10], [2, 6]),
    // Montanhas Geladas
    lobo_gelo: mon('lobos do gelo', 'Lobo do gelo', 'o', 7, 62, [3, 10], [1, 6]),
    boneco_neve: mon('bonecos de neve malvados', 'Boneco de neve malvado', 'o', 7, 70, [3, 8], [2, 6]),
    yeti: mon('yetis', 'Yeti', 'o', 8, 92, [4, 8], [2, 6]),
    ogro: mon('ogros', 'Ogro', 'o', 8, 100, [4, 8], [2, 4]),
    espirito_gelo: mon('espíritos do gelo', 'Espírito do gelo', 'o', 9, 88, [4, 10], [2, 6]),
    troll: mon('trolls', 'Troll', 'o', 9, 115, [4, 10], [2, 8]),
    // Pântano Sombrio
    zumbi: mon('zumbis', 'Zumbi', 'o', 10, 130, [5, 8], [2, 6]),
    sapo: mon('sapos gigantes', 'Sapo gigante', 'o', 10, 118, [4, 12], [2, 8]),
    fantasma: mon('fantasmas', 'Fantasma', 'o', 11, 125, [5, 10], [3, 6]),
    bruxa: mon('bruxas do pântano', 'Bruxa do pântano', 'a', 11, 135, [6, 8], [2, 6]),
    cavaleiro: mon('cavaleiros negros', 'Cavaleiro negro', 'o', 12, 165, [5, 12], [3, 8]),
    ceifador: mon('ceifadores', 'Ceifador', 'o', 12, 150, [6, 10], [2, 8]),
    // Vulcão
    salamandra: mon('salamandras de fogo', 'Salamandra de fogo', 'a', 13, 185, [6, 10], [3, 6]),
    diabrete: mon('diabretes', 'Diabrete', 'o', 13, 170, [5, 12], [3, 8]),
    cao_infernal: mon('cães infernais', 'Cão infernal', 'o', 14, 225, [7, 10], [3, 8]),
    elemental: mon('elementais de fogo', 'Elemental de fogo', 'o', 14, 215, [6, 12], [4, 6]),
    golem_magma: mon('golens de magma', 'Golem de magma', 'o', 15, 275, [7, 12], [5, 6]),
    fenix: mon('fênix', 'Fênix', 'a', 15, 250, [8, 10], [3, 8]),
    dragao: { nome: 'Dragão Vermelho', art: 'o', hp: 600, atk: [8, 12], def: [4, 8], ouro: [10, 20], xp: 0 },
  };
  // Cada monstro tem uma versão chefe no fundo da masmorra dele ("Rei Rato"):
  // o dobro da vida +10, um dado de ataque a mais e o dobro de dados de moeda.
  for (const kind of Object.keys(Wd.MASMORRAS)) {
    const m = MONSTERS[kind], nome = Wd.MASMORRAS[kind][1];
    MONSTERS['chefe_' + kind] = {
      nome, art: nome.startsWith('Rainha') ? 'a' : 'o', hp: m.hp * 2 + 10, atk: [m.atk[0] + 1, m.atk[1]], def: m.def,
      ouro: [m.ouro[0] * 2, m.ouro[1]], xp: m.xp * 4, chefe: true, base: kind,
    };
  }
  const TIER_OF = {};
  for (const t in Wd.POOLS) for (const k of Wd.POOLS[t]) TIER_OF[k] = +t;
  // Golpes especiais. Maldição: em vez de atacar, o monstro lança um feitiço
  // que tira `pen` de cada dado de ataque e de defesa do herói (nenhum dado
  // fica abaixo de 1) por algumas rodadas: 1 + região/3, arredondado para
  // cima (2 nos Campos ... 6 no Vulcão; o chefe, uma a mais). Quebrar: os
  // brutos, ao atacar, às vezes quebram o maior dado da defesa do herói até
  // o fim da luta (2d6 vira 1d6). Os chefes têm o mesmo golpe.
  const MALDICAO_CHANCE = 0.3, QUEBRA_CHANCE = 0.25;
  const ESPECIAL = {
    aranha: { tipo: 'maldicao', nome: 'Teia', pen: 1 },
    cobra: { tipo: 'maldicao', nome: 'Veneno', pen: 1 },
    mumia: { tipo: 'maldicao', nome: 'Maldição da múmia', pen: 1 },
    golem: { tipo: 'quebra', nome: 'Soco de pedra' },
    ogro: { tipo: 'quebra', nome: 'Clavada' },
    espirito_gelo: { tipo: 'maldicao', nome: 'Sopro gelado', pen: 1 },
    troll: { tipo: 'quebra', nome: 'Pancada de troll' },
    fantasma: { tipo: 'maldicao', nome: 'Assombração', pen: 1 },
    bruxa: { tipo: 'maldicao', nome: 'Feitiço da bruxa', pen: 2 },
    ceifador: { tipo: 'maldicao', nome: 'Toque da morte', pen: 2 },
    diabrete: { tipo: 'maldicao', nome: 'Truque do diabrete', pen: 1 },
    golem_magma: { tipo: 'quebra', nome: 'Punho de magma' },
    fenix: { tipo: 'maldicao', nome: 'Chama sagrada', pen: 2 },
    dragao: { tipo: 'quebra', nome: 'Garra do dragão' },
  };
  for (const kind in ESPECIAL) {
    const n = 1 + Math.ceil((TIER_OF[kind] || 15) / 3);
    MONSTERS[kind].esp = { ...ESPECIAL[kind], rodadas: n };
    if (MONSTERS['chefe_' + kind]) MONSTERS['chefe_' + kind].esp = { ...ESPECIAL[kind], rodadas: n + 1 };
  }

  // Guardiões das passagens (World.GUARDIOES, um por página menos a última):
  // a vida do chefe do monstro + 30%, o ataque do monstro comum (o do chefe
  // deixava o guardião quase invencível na simulação), um golpe especial e o
  // dobro das moedas e da experiência do chefe. Não voltam depois de vencidos.
  const GUARDA_ESP = [
    { tipo: 'quebra', nome: 'Machadada' }, { tipo: 'quebra', nome: 'Mordida colossal' },
    { tipo: 'quebra', nome: 'Pancada de troll' }, { tipo: 'maldicao', nome: 'Lâmina amaldiçoada', pen: 2 },
  ];
  Wd.GUARDIOES.forEach(([base, nome], pg) => {
    const b = MONSTERS['chefe_' + base], tier = pg * 3 + 3;
    MONSTERS['guarda_' + pg] = {
      nome, art: 'o', hp: Math.round(b.hp * 1.3), atk: MONSTERS[base].atk, def: b.def || [1, 4],
      ouro: [b.ouro[0] * 2, b.ouro[1]], xp: b.xp * 2, chefe: true, base, guarda: pg,
      esp: { ...GUARDA_ESP[pg], rodadas: 2 + Math.ceil(tier / 3) },
    };
  });

  // Monstro lendário de cada página (World.LENDAS): anda pela página e foge
  // de quem chega perto. A vida do chefe do monstro + 20%, o ataque e o golpe
  // do chefe, o triplo da experiência do chefe. A vida que perdeu fica
  // perdida até ele cair. Na luta, depois da primeira rodada, cada vez dele
  // tem LENDA_FOGE de chance de ele fugir.
  const LENDA_FOGE = 0.2;
  Wd.LENDAS.forEach(([base, nome], pg) => {
    const b = MONSTERS['chefe_' + base];
    MONSTERS['lenda_' + pg] = {
      nome, art: MONSTERS[base].art, hp: Math.round(b.hp * 1.2), atk: b.atk, def: b.def || [1, 4],
      ouro: [b.ouro[0] * 2, b.ouro[1]], xp: b.xp * 3, chefe: true, base, lenda: pg, esp: b.esp,
    };
  });
  // Duelos: em cada fogueira, um guerreiro aceita um duelo de treino. Ninguém
  // desmaia: quem chega a 0 perde e fica com 1 de vida. Ele tem a vida média
  // dos monstros da região da fogueira × 1,4 e o ataque e a defesa do mais
  // forte deles. A primeira vitória paga como a primeira missão da região;
  // as revanches, um quarto das moedas e nada de experiência.
  const DUELISTAS = [
    ['Zeca Machado', 'o'], ['Tina Escudo', 'a'], ['Biu Martelo', 'o'], ['Nena Lança', 'a'], ['Dudu Punhos', 'o'],
    ['Rosa da Areia', 'a'], ['Tião Duna', 'o'], ['Lia Cimitarra', 'a'], ['Juca Camelo', 'o'], ['Bia Miragem', 'a'],
    ['Neco Gelo', 'o'], ['Ivo Avalanche', 'o'], ['Clara Nevasca', 'a'], ['Toninho Iglu', 'o'], ['Sara Pinheiro', 'a'],
    ['Dona Névoa', 'a'], ['Zé do Lodo', 'o'], ['Maria Brejo', 'a'], ['Chico Lanterna', 'o'], ['Lena Corvo', 'a'],
    ['Rubi Brasa', 'a'], ['Teo Vulcão', 'o'], ['Fátima Cinza', 'a'], ['Leco Fornalha', 'o'], ['Inês Labareda', 'a'],
  ];
  // Região da fogueira n: as 5 de uma página ficam nas regiões 1, 1, 2, 2 e 3 dela.
  const duelTier = n => Math.floor(n / 5) * 3 + 1 + [0, 0, 1, 1, 2][n % 5];
  // Os monstros de uma região: a vida média dos dois e o ataque e a defesa
  // do que bate mais.
  function forteDa(tier) {
    const [a, b] = Wd.POOLS[tier].map(k => MONSTERS[k]);
    const f = a.atk[0] * (a.atk[1] + 1) >= b.atk[0] * (b.atk[1] + 1) ? a : b;
    return { hp: (a.hp + b.hp) / 2, atk: f.atk, def: f.def || a.def || b.def || [1, 4] };
  }
  DUELISTAS.forEach(([nome, art], n) => {
    const f = forteDa(duelTier(n));
    MONSTERS['duelo_' + n] = { nome, art, hp: Math.round(f.hp * 1.4), atk: f.atk, def: f.def, ouro: null, xp: 0, duelo: n };
  });
  // Gente que dá para atacar (proposta): todo personagem do caminho e cada
  // um da fogueira. É luta de verdade (perder é desmaiar) e quem morre não
  // volta mais, nem descansando. Cada um luta como os monstros da região
  // dele: (a vida média + 10) × `vida`, o ataque do mais forte com `atk` dados a
  // mais e a defesa dele. A bolsa rola (região/2 + 1) dados de `moeda` lados,
  // uma vez só; a experiência é o dobro da de um monstro da região.
  const PAPEIS = {
    ferreiro: { vida: 1.6, atk: 1, moeda: 10 },
    maga: { vida: 1, atk: 2, moeda: 10 },
    mercador: { vida: 0.9, atk: 0, moeda: 20 },
    veterana: { vida: 1.5, atk: 1, moeda: 8 },
    duelista: { vida: 1.4, atk: 0, moeda: 10 },
    missao: { vida: 1, atk: 0, moeda: 10 },
    dica: { vida: 0.8, atk: 0, moeda: 6 },
  };
  // Registra a pessoa como "monstro" (uma vez) e devolve o tipo dela.
  // `key` é única no mundo: "f3_maga" (fogueira 3), "p1_812" (página 2, quadrado 812).
  function gente(key, papel, tier, nome, art, seed, cor) {
    const kind = 'gente_' + key;
    if (!MONSTERS[kind]) {
      const p = PAPEIS[papel], f = forteDa(tier);
      MONSTERS[kind] = {
        nome, art, hp: Math.round((f.hp + 10) * p.vida), atk: [f.atk[0] + p.atk, f.atk[1]], def: f.def,
        ouro: [Math.ceil(tier / 2) + 1, p.moeda], xp: XP[tier] * 2, gente: papel,
      };
      A.defMonster(kind, () => A.gente(papel, seed, cor));
    }
    return kind;
  }
  // Adivinhas da cara de pedra (masmorra com enigma): a certa vem primeiro.
  const ENIGMAS = [
    ['Tem dentes, mas não morde.', 'pente', 'cachorro', 'tesoura'],
    ['Quanto mais se tira, maior fica.', 'buraco', 'bolo', 'cabelo'],
    ['Anda com os pés na cabeça.', 'piolho', 'chapéu', 'acrobata'],
    ['Tem coroa, mas não é rei; tem escamas, mas não é peixe.', 'abacaxi', 'dragão', 'cobra'],
    ['Cai em pé e corre deitada.', 'chuva', 'gata', 'folha'],
    ['Tem pescoço, mas não tem cabeça.', 'garrafa', 'girafa', 'camisa'],
    ['Quanto mais seca, mais molhada fica.', 'toalha', 'esponja', 'roupa'],
    ['Tem cabeça e tem dente, não é bicho nem é gente.', 'alho', 'prego', 'pente'],
    ['Passa na frente do sol e não faz sombra.', 'vento', 'nuvem', 'pássaro'],
    ['Tem asa, mas não voa; tem bico, mas não bica.', 'bule', 'galinha', 'avião'],
    ['Tem olho, mas não enxerga.', 'agulha', 'toupeira', 'morcego'],
    ['Sobe e desce sem sair do lugar.', 'escada', 'elevador', 'balão'],
  ];
  // Regras das páginas (proposta). Deserto: a cada TEMPESTADE_A passos lá fora
  // vem uma tempestade de areia de TEMPESTADE_N passos (só os vizinhos são
  // desenhados, e a borracha apaga um pedaço do mapa já desenhado).
  // Vulcão: a cada ERUPCAO_A passos lá fora, o vulcão cospe lava em uns
  // quadrados por LAVA_N passos (nunca fechando o caminho até uma fogueira,
  // masmorra, personagem ou o covil).
  const TEMPESTADE_A = 70, TEMPESTADE_N = 15, ERUPCAO_A = 60, LAVA_N = 30;

  // Habilidades passivas: combinações de pôquer nos dados. Cada nível ganho dá
  // um ponto; cada fogueira ensina uma só habilidade (a do índice dela, então
  // a página 1 ensina as 5 primeiras). O herói guarda todas as que aprendeu,
  // mas só HABS_MAX ficam equipadas (troca na mochila). As equipadas valem
  // sozinhas, sem botão: quando a rolagem tem a combinação, o efeito acontece. Se mais de uma serve na mesma
  // rolagem, vale só a de combinação mais alta. A combinação olha os números
  // que caíram nos dados, antes de qualquer maldição.
  const MAOS = {
    maximo: { nome: 'Dado cheio', txt: 'algum dado tira o número mais alto dele' },
    par: { nome: 'Par', txt: '2 dados iguais' },
    dois_pares: { nome: 'Dois pares', txt: '2 pares de dados iguais' },
    trinca: { nome: 'Trinca', txt: '3 dados iguais' },
    sequencia: { nome: 'Sequência', txt: '3 números seguidos, como 4-5-6' },
    full: { nome: 'Full house', txt: 'uma trinca e um par' },
    sequencia_grande: { nome: 'Sequência grande', txt: '5 números seguidos' },
    quadra: { nome: 'Quadra', txt: '4 dados iguais' },
    quina: { nome: 'Quina', txt: '5 dados iguais' },
  };
  const RANK = Object.keys(MAOS);
  const HABS_MAX = 2;
  const GRUPO = { ataque: 'de ataque', defesa: 'de defesa', magia: 'de feitiço' };
  const hab = (nome, grupo, mao, efeito, txt) => ({ nome, grupo, mao, efeito, txt });
  const HABILIDADES = [
    // Campos
    hab('Golpe caprichado', 'ataque', 'maximo', 'dado', 'rola mais um dado da arma e soma'),
    hab('Escudo firme', 'defesa', 'maximo', 'dado', 'rola mais um dado de defesa e soma'),
    hab('Golpe certeiro', 'ataque', 'par', 'perfura', 'ignora a defesa do monstro'),
    hab('Mente leve', 'magia', 'par', 'pm', 'o feitiço não gasta Magia'),
    hab('Revide', 'defesa', 'par', 'espinhos', 'o monstro toma metade da sua defesa'),
    // Deserto
    hab('Pancada tonta', 'ataque', 'trinca', 'atordoa', 'o monstro fica tonto e perde a vez'),
    hab('Faísca extra', 'magia', 'maximo', 'dado', 'rola mais um dado do feitiço e soma'),
    hab('Muralha', 'defesa', 'trinca', 'bloqueio', 'bloqueia o golpe inteiro'),
    hab('Golpe sedento', 'ataque', 'sequencia', 'vampiro', 'cura metade do dano que você causar'),
    hab('Eco', 'magia', 'trinca', 'eco', 'o feitiço acontece de novo, de graça'),
    // Montanhas Geladas
    hab('Golpe crítico', 'ataque', 'dois_pares', 'x2', 'dano em dobro'),
    hab('Fé', 'defesa', 'dois_pares', 'purifica', 'acaba com a maldição e conserta os dados quebrados'),
    hab('Fôlego', 'defesa', 'sequencia', 'cura', 'cura metade da sua defesa'),
    hab('Magia sedenta', 'magia', 'dois_pares', 'vampiro', 'cura metade do dano do feitiço'),
    hab('Magia dupla', 'magia', 'sequencia', 'x2', 'feitiço em dobro (dano ou cura)'),
    // Pântano Sombrio
    hab('Golpe duplo', 'ataque', 'full', 'duplo', 'ataca duas vezes'),
    hab('Contra-ataque', 'defesa', 'full', 'contra', 'você ataca de volta na hora'),
    hab('Feitiço tonto', 'magia', 'full', 'atordoa', 'o monstro fica tonto e perde a vez'),
    hab('Golpe esmagador', 'ataque', 'quadra', 'x3', 'dano em triplo'),
    hab('Espelho', 'defesa', 'quadra', 'reflete', 'o golpe volta inteiro para o monstro'),
    // Vulcão
    hab('Dança das lâminas', 'ataque', 'sequencia_grande', 'danca', 'ataca duas vezes, ignorando a defesa'),
    hab('Tempestade', 'magia', 'quadra', 'x3', 'feitiço em triplo (dano ou cura)'),
    hab('Cometa', 'magia', 'quina', 'x5', 'feitiço cinco vezes mais forte'),
    hab('Golpe lendário', 'ataque', 'quina', 'x5', 'dano cinco vezes maior'),
    hab('Bênção do mestre', 'defesa', 'quina', 'bencao', 'bloqueia tudo e cura toda a sua vida'),
  ];
  // Que combinações uma rolagem tem (faces = números que caíram, sides = faces de cada dado).
  function maos(faces, sides) {
    const n = {};
    for (const f of faces) n[f] = (n[f] || 0) + 1;
    const c = Object.values(n).sort((a, b) => b - a).concat([0, 0]);
    let run = 0, cur = 0;
    for (let v = 1; v <= 20; v++) { cur = n[v] ? cur + 1 : 0; run = Math.max(run, cur); }
    return {
      maximo: faces.some((f, k) => f === sides[k]),
      par: c[0] >= 2, dois_pares: c[0] >= 4 || c[1] >= 2, trinca: c[0] >= 3, sequencia: run >= 3,
      full: c[0] >= 5 || (c[0] >= 3 && c[1] >= 2), sequencia_grande: run >= 5, quadra: c[0] >= 4, quina: c[0] >= 5,
    };
  }
  // A habilidade equipada que vale nesta rolagem (a de combinação mais alta), ou null.
  function passiva(grupo, faces, sides) {
    const tem = maos(faces, sides);
    let best = null;
    for (const k of P.ativas) {
      const h = HABILIDADES[k];
      if (h.grupo === grupo && tem[h.mao] && (!best || RANK.indexOf(h.mao) > RANK.indexOf(best.mao))) best = h;
    }
    return best;
  }
  const pontos = () => Math.max(0, P.lvl - 1 - P.habs.length);
  const comboTxt = h => `<b class="combo">${MAOS[h.mao].nome}!</b> ${h.nome}: ${h.txt}.`;
  // O golpe especial de um monstro, para as folhas de antes da luta.
  const espTxt = m => !m.esp ? '' : m.esp.tipo === 'maldicao'
    ? `<p class="small esp">${ic('scroll', C.PURPLE)} Lança <b>${m.esp.nome}</b>: −${m.esp.pen} em cada dado seu por ${m.esp.rodadas} rodadas.</p>`
    : `<p class="small esp">${ic('shield', C.PURPLE)} <b>${m.esp.nome}</b>: pode quebrar um dado da sua defesa até o fim da luta.</p>`;
  // Despojos: o que cai de cada monstro vencido (1d3; do chefe, 2d6). Servem
  // para missões e valem (região) moedas cada nas fogueiras.
  const PARTS = {
    slime: ['gota de gosma', 'gotas de gosma'], rato: ['rabo de rato', 'rabos de rato'],
    goblin: ['orelha de goblin', 'orelhas de goblin'], lobo: ['presa de lobo', 'presas de lobo'],
    aranha: ['perna de aranha', 'pernas de aranha'], orc: ['dente de orc', 'dentes de orc'],
    escorpiao: ['ferrão', 'ferrões'], cobra: ['escama de naja', 'escamas de naja'],
    esqueleto: ['osso', 'ossos'], mumia: ['faixa de múmia', 'faixas de múmia'],
    verme: ['dente de verme', 'dentes de verme'], golem: ['lasca de pedra', 'lascas de pedra'],
    lobo_gelo: ['pelo gelado', 'pelos gelados'], boneco_neve: ['nariz de cenoura', 'narizes de cenoura'],
    yeti: ['tufo de yeti', 'tufos de yeti'], ogro: ['tufo de pelo de ogro', 'tufos de pelo de ogro'],
    espirito_gelo: ['floco eterno', 'flocos eternos'], troll: ['unha de troll', 'unhas de troll'],
    zumbi: ['dedo de zumbi', 'dedos de zumbi'], sapo: ['língua de sapo', 'línguas de sapo'],
    fantasma: ['lençol rasgado', 'lençóis rasgados'], bruxa: ['verruga de bruxa', 'verrugas de bruxa'],
    cavaleiro: ['pluma negra', 'plumas negras'], ceifador: ['ampulheta', 'ampulhetas'],
    salamandra: ['cauda de salamandra', 'caudas de salamandra'], diabrete: ['chifrinho', 'chifrinhos'],
    cao_infernal: ['coleira em brasa', 'coleiras em brasa'], elemental: ['brasa viva', 'brasas vivas'],
    golem_magma: ['pedra de magma', 'pedras de magma'], fenix: ['pena de fênix', 'penas de fênix'],
  };
  const cap = t => t[0].toUpperCase() + t.slice(1);
  const um = m => m.art === 'a' ? 'uma' : 'um';
  const oa = m => m.art === 'a' ? 'a' : 'o';

  // Missões de quem tem "!" no balão: 3 em sequência, ficando maiores.
  // Um número por região do mundo (1 a 15).
  const QUEST_N = {
    matar: [10, 10, 8, 8, 8, 6, 6, 6, 5, 5, 5, 4, 4, 4, 3],
    coletar: [20, 18, 16, 15, 14, 13, 12, 11, 10, 10, 9, 8, 8, 7, 6],
  };
  // Moedas da primeira missão de cada região: mais ou menos o que os monstros
  // pedidos já pagam (era o dobro, e o herói ficava rico cedo demais).
  const QUEST_OURO = [15, 20, 30, 40, 50, 60, 75, 90, 105, 125, 145, 165, 190, 215, 240];
  const QUEST_XP = [15, 25, 40, 55, 75, 100, 130, 165, 205, 250, 300, 360, 430, 510, 600];
  // Dia e noite: o relógio anda um passo por quadrado. Uma tocha dura 40 passos no escuro.
  const CICLO = 100, TOCHA_PASSOS = 40, TOCHA_PRECO = 5;
  const xpNext = l => Math.round(10 * Math.pow(l, 1.5));

  // Cada personagem de dica fala uma frase; ao conversar de novo, fala outra
  // (a frase k, depois k + 20, k + 40...), então nenhuma dica fica de fora.
  // Há 4 personagens de dica por página: as frases 0–3 são dos Campos, 4–7
  // do Deserto, e assim por diante, então cada página fala dela mesma.
  const NPC_LINES = [
    'O mapa não acaba nesta folha. No ponto mais longe daqui tem um canto de página dobrado, com um guardião em cima. Mas tem masmorra com escada que sai atrás dele...',
    'Cada arma dá dados. A espada de madeira é 1d6... já ouvi falar de uma lâmina que rola 5d20! E tirar dois dados iguais tem truque: os veteranos das fogueiras ensinam.',
    'De noite os monstros ficam mais fortes: rolam um dado de ataque a mais. Em compensação, dão mais experiência.',
    'Sem tocha, de noite você não enxerga um palmo na frente do nariz. Em toda fogueira tem alguém vendendo tocha.',
    'No deserto até o rei é escorpião. Cada tipo de monstro tem um rei escondido numa masmorra: procure as portas de pedra com uma coroa em cima.',
    'Gente com "!" no balão tem serviço pra você. E paga bem!',
    'Escudo e armadura também rolam dados, no máximo 5 os dois juntos. A soma deles sai do dano que você toma.',
    'Cada página nova tem guerreiros novos nas fogueiras, e eles vendem coisa melhor que os da página de antes.',
    'Nas Montanhas Geladas até o boneco de neve é malvado. Poção grande, só daqui pra frente.',
    'Quer voltar uma página? A seta verde fica do lado da primeira fogueira.',
    'Defesa alta? Feitiço não liga pra escudo: a magia passa direto.',
    'Descansar na fogueira cura tudo e passa a noite... mas todo monstro que você venceu volta pro mapa. Em todas as páginas.',
    'O Pântano Sombrio é cheio de túmulos. Os mortos daqui não ficam quietos.',
    'Monstro desenhado no mapa não corre atrás de ninguém. Você escolhe se quer brigar.',
    'No mato fechado aparece bicho do nada. Cuidado nas árvores e no brejo.',
    'Se desmaiar, você acorda na última fogueira por onde passou, mas perde metade do ouro. E os monstros voltam.',
    'O Dragão Vermelho dorme no fundo do Vulcão, na última página do caderno. Quanto mais perto dele, mais forte é o monstro.',
    'Baú tem moeda, poção e, com sorte, equipamento bom.',
    'Fugir é rolar um d20. Logo no começo da luta é mais fácil.',
    'Rabo de rato, pena de fênix... tudo que cai dos monstros vale umas moedas na fogueira.',
  ];
  const DICAS = 20;
  // A 4ª pessoa de dica de cada página, na primeira conversa, fala do lendário.
  const LENDA_DICA = [
    'Viu um lobo de estrela na cabeça? É o Dentuço, o Lobo Sem Dono. Corre de todo mundo... mas se você encurralar ele, vale um tesouro.',
    'Tem uma naja dourada que anda pelas dunas: a Rainha das Dunas. Quando chega perto, ela some na areia.',
    'Pegadas enormes na neve? É o Pé-Grande. Ninguém nunca pegou ele.',
    'O Lençol Errante passeia pelo brejo. Se você machucar ele, ele foge e volta depois, ainda machucado.',
    'Faísca, o Diabrete Ladrão, vive fugindo pelas cinzas. Dizem que ele guarda coisa boa.',
  ];
  // Quem descansa em cada fogueira (cada uma usa uma frase, pela ordem).
  const CAMP_TEXT = [
    'Em volta do fogo: um ferreiro andarilho afiando a espada, uma maga de chapéu torto e um mercador cochilando.',
    'Uma cavaleira remenda o escudo, um mago velho lê pergaminhos e um mercador conta moedas.',
    'Dois guerreiros assam linguiça no fogo. Um deles carrega uma mochila cheia de armas pra vender.',
  ];
  // O mestre comenta o terreno na primeira vez que o herói pisa nele (por bioma).
  const TERRAIN_TEXT = {
    campos: {
      [Wd.AREIA]: 'Praia! O mestre faz pontinhos de areia com a caneta amarela.',
      [Wd.MATA]: 'Floresta! O mestre rabisca um monte de arvorezinhas. No mato aparece mais monstro.',
      [Wd.PANTANO]: 'Pântano... cheira mal e esconde bicho. O mestre pinta tudo de verde-oliva.',
    },
    deserto: {
      [Wd.MATA]: 'Cactos! O mestre desenha com cuidado para não se espetar. Atrás deles tem bicho escondido.',
      [Wd.PANTANO]: 'Areia movediça! O mestre rabisca um redemoinho. Melhor andar rápido.',
    },
    neve: {
      [Wd.AREIA]: 'Gelo! O mestre risca rachaduras com o lápis azul. No gelo você escorrega até sair dele ou bater em alguma coisa.',
      [Wd.MATA]: 'Pinheiros cobertos de neve. Bom lugar para um yeti se esconder.',
      [Wd.PANTANO]: 'Neve funda até o joelho. O mestre desenha montinhos de neve.',
    },
    pantano: {
      [Wd.CAMPO]: 'Terra morta e túmulos tortos. O mestre pega o lápis cinza.',
      [Wd.MATA]: 'Árvores mortas, cheias de galho seco. Alguma coisa se mexeu ali.',
      [Wd.PANTANO]: 'Brejo! Borbulha, fede e esconde bicho.',
    },
    vulcao: {
      [Wd.AREIA]: 'Cinzas. O mestre assopra o papel e continua desenhando.',
      [Wd.MATA]: 'Árvores queimadas, ainda soltando brasa.',
      [Wd.PANTANO]: 'Fumarolas! Fumaça quente sai das rachaduras do chão.',
    },
  };
  // Ao entrar numa região nova da página (a primeira de cada página tem o texto da chegada).
  const REGION_TEXT = {
    2: 'O mestre sorri: "daqui pra frente tem goblin e lobo".',
    3: 'Aranhas e orcs por aqui. O canto dobrado da página deve estar perto.',
    5: 'Esqueletos e múmias. O mestre desenha ruínas meio enterradas na areia.',
    6: 'Vermes da areia e golens de pedra. O fim da página está perto.',
    8: 'Yetis e ogros. O vento gelado vira a folha sozinho.',
    9: 'Espíritos do gelo e trolls. O mestre aperta a caneta com força.',
    11: 'Fantasmas e bruxas. O mestre faz a lua mais apagada.',
    12: 'Cavaleiros negros e ceifadores... você está longe de casa.',
    14: 'Cães infernais e elementais de fogo. O papel está quente.',
    15: 'Golens de magma e fênix. O covil do dragão deve estar perto.',
  };
  // Na primeira vez em cada página. `aviso` aparece antes de virar a página.
  const BIOME_TEXT = [
    { chegada: '', aviso: '' },
    { chegada: 'O mestre vira a página e pega a caneta amarela: é o Deserto. Escorpiões e najas por aqui. Cuidado com as tempestades de areia... e nem todo baú é de verdade.',
      aviso: 'No Deserto os monstros são bem mais fortes que nos Campos. Os guerreiros das fogueiras de lá vendem coisa melhor.' },
    { chegada: 'Página nova, toda branca: as Montanhas Geladas. O mestre só pinta o que não é neve. Lobos do gelo e bonecos de neve por aqui, e no gelo você escorrega.',
      aviso: 'As Montanhas Geladas são mais perigosas que o Deserto.' },
    { chegada: 'O mestre vira a página e escurece tudo com o lápis: o Pântano Sombrio. A neblina não deixa ver longe, e à noite os mortos se levantam.',
      aviso: 'O Pântano Sombrio é mais perigoso que as Montanhas Geladas.' },
    { chegada: 'Última página. O mestre pega a caneta vermelha: o Vulcão. De tempos em tempos ele cospe lava. O Dragão Vermelho mora no fim.',
      aviso: 'É a última página: o Vulcão, onde mora o Dragão Vermelho. Os monstros de lá são os mais fortes do caderno.' },
  ];

  // ---------- estado ----------
  // WORLD = as 5 páginas; W = a página onde o herói está; M = o mapa onde ele
  // está (a página ou uma masmorra dela); L = o estado desse mapa.
  let WORLD = null, W = null, P = null, G = null, M = null, L = null, dunCache = {};
  const newLevel = m => ({ rev: new Uint8Array(m.W * m.H), dead: new Set(), opened: new Set(), trail: new Set() });
  // Estado de uma página: além do mapa, quem já deu presente, as masmorras
  // limpas, se o guardião da passagem foi vencido e (na última) se o dragão foi.
  // `lenda` = onde está o monstro lendário da página, a vida dele e se caiu.
  const newPage = (m, pg) => ({
    ...newLevel(m), talked: new Set(), cleared: new Set(), won: false, guarda: false, mortos: new Set(),
    lenda: { i: m.lenda, hp: MONSTERS['lenda_' + pg].hp, dead: false },
  });
  // G.dun é por "página:masmorra" ("2:4" = masmorra 4 da 3ª página; "2:4:1" =
  // o andar de baixo dela). G.lava: quadrados do Vulcão cobertos de lava,
  // índice → [terreno de antes, passo em que esfria]. G.areia e G.vulcao contam
  // os passos até a próxima tempestade e erupção; G.tempestade, os que faltam
  // da tempestade de agora. G.duelos: vitórias em cada fogueira. G.gente:
  // quem o herói matou em cada fogueira (n → ['maga', ...]); os mortos do
  // caminho ficam em `mortos` de cada página. G.tempo: segundos jogados.
  const newState = () => ({
    pg: WORLD.pages.map(newPage), dun: {},
    seen: new Set(), steps: 0, kills: 0, clock: 10, day: 1, conversa: {}, calma: 0,
    lava: {}, areia: 0, vulcao: 0, tempestade: 0, duelos: {}, gente: {}, tempo: 0,
  });
  const here = () => G.pg[P.pg];
  const dunKey = (pg, n, andar = 0) => pg + ':' + n + (andar ? ':1' : '');
  function newPlayer(nome) {
    const w = WORLD.pages[0];
    return {
      nome, lvl: 1, xp: 0, hp: 20, hpMax: 20, pm: 3, pmMax: 3, ouro: 15,
      equip: { arma: 'espada_madeira', escudo: null, armadura: null },
      bolsa: [], pocoes: { pocao_vida: 2, pocao_mana: 0, pocao_grande: 0 }, magias: [],
      pg: 0, x: w.start % w.W, y: (w.start / w.W) | 0, respawn: w.start, rpg: 0,
      onde: null, andar: 0, ox: 0, oy: 0, tochas: 2, tocha: 0,
      abates: {}, partes: {}, missoes: [], etapa: {}, habs: [], ativas: [],
    };
  }
  const fmtD = d => d ? `${d[0]}d${d[1]}` : '—';
  // Lista de dados um a um ([12, 12, 8]) escrita como "2d12 + 1d8".
  const fmtDice = list => [...new Set(list)].map(f => `${list.filter(x => x === f).length}d${f}`).join(' + ');
  const expand = list => list.flatMap(d => d ? Array(d[0]).fill(d[1]) : []);
  const avg = d => d ? d[0] * (d[1] + 1) / 2 : 0;
  const atkDie = () => P.equip.arma ? ITEMS[P.equip.arma].dado : [1, 2];
  const defDice = () => [P.equip.escudo, P.equip.armadura].filter(Boolean).map(id => ITEMS[id].dado);
  // Os dados de defesa um a um, do maior para o menor, com o teto de 5.
  const defList = () => expand(defDice()).sort((a, b) => b - a).slice(0, 5);
  const idx = (x, y) => y * M.W + x;

  // ---------- dia, noite e tocha ----------
  // Relógio de 0 a 99: 0–64 dia, 65–74 escurece aos poucos, 75–94 noite, 95–99 amanhece.
  const darkness = () => { const c = G.clock; return c < 65 ? 0 : c < 75 ? (c - 64) / 10 : c < 95 ? 1 : (100 - c) / 6; };
  const isNight = () => darkness() >= 0.5;
  const inDungeon = () => P.onde != null;
  const isDark = () => inDungeon() || isNight();
  const lit = () => isDark() && P.tocha > 0;
  // À noite (fora da masmorra) o monstro rola um dado de ataque a mais.
  const nightBonus = () => isNight() && !inDungeon();
  const atkOf = md => nightBonus() ? [md.atk[0] + 1, md.atk[1]] : md.atk;
  // No escuro, cada passo gasta a tocha acesa; quando ela acaba, acende a próxima sozinho.
  function burnTorch(step) {
    if (!isDark()) return;
    let out = false;
    if (step && P.tocha > 0) { P.tocha--; out = !P.tocha; }
    if (P.tocha <= 0 && P.tochas > 0) {
      P.tochas--; P.tocha = TOCHA_PASSOS;
      narrate(out ? 'A tocha apagou e você acende outra.' : 'Você acende uma tocha. O mestre pinta um círculo de luz amarela.');
    } else if (out) narrate('A tocha apagou! Sem tocha, você mal enxerga.');
  }

  // ---------- missões ----------
  // Quem deu a missão (pode estar em outra página).
  const npcOf = q => WORLD.pages[q.pg].obj.get(q.npc);
  function questsOf(i, o) {
    const pool = Wd.POOLS[o.tier], h = S.hash(W.seed, i, 5), tr = o.tier - 1;
    const a = pool[h % 2], b = pool[(h + 1) % 2];
    const list = [{ tipo: 'matar', kind: a, n: QUEST_N.matar[tr] }, { tipo: 'coletar', kind: b, n: QUEST_N.coletar[tr] }];
    // O chefe pedido é o de uma masmorra que existe nesta página.
    const has = k => W.dungeons.some(d => W.obj.get(d).kind === k);
    const boss = has(a) ? a : has(b) ? b : null;
    if (boss) list.push({ tipo: 'chefe', kind: boss, n: 1 });
    return list;
  }
  const questText = q => q.tipo === 'matar' ? `Derrotar ${q.n} ${MONSTERS[q.kind].pl}`
    : q.tipo === 'coletar' ? `Juntar ${q.n} ${PARTS[q.kind][1]}`
    : `Derrotar ${oa(MONSTERS['chefe_' + q.kind])} ${MONSTERS['chefe_' + q.kind].nome}`;
  const progress = q => q.tipo === 'coletar' ? (P.partes[q.kind] || 0)
    : q.tipo === 'chefe' ? Math.min(1, P.abates['chefe_' + q.kind] || 0)
    : (P.abates[q.kind] || 0) - q.base;
  const questReward = (tier, k) => [Math.round(QUEST_OURO[tier - 1] * (1 + k * 0.5)), Math.round(QUEST_XP[tier - 1] * (1 + k * 0.5))];
  // Avisa (uma vez) quando uma missão fica pronta para entregar.
  function questPing() {
    for (const q of P.missoes) if (!q.avisado && progress(q) >= q.n) {
      q.avisado = true;
      narrate(`Missão cumprida: ${questText(q)}! Volte a ${npcOf(q).nome} para receber.`);
    }
  }

  // ---------- som (sintetizado, sem arquivos) ----------
  const SFX = {
    ac: null, on: true,
    init() {
      if (!this.ac) { try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
      if (this.ac.state === 'suspended') this.ac.resume();
    },
    noise(dur, freq, vol, q = 1) {
      if (!this.on || !this.ac) return;
      const ac = this.ac, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
      s.connect(f).connect(g).connect(ac.destination); s.start();
    },
    tone(freq, dur, vol, type = 'triangle') {
      if (!this.on || !this.ac) return;
      const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
    },
    dice() { for (let k = 0; k < 6; k++) setTimeout(() => this.noise(0.03, 1800 + Math.random() * 1500, 0.3, 4), k * 75 + Math.random() * 30); },
    scribble() { this.noise(0.08, 2600 + Math.random() * 1600, 0.04, 1.4); },
    hit() { this.noise(0.16, 320, 0.5, 1); this.tone(110, 0.15, 0.15, 'square'); },
    coin() { this.tone(988, 0.08, 0.1); setTimeout(() => this.tone(1319, 0.14, 0.1), 70); },
    step() { this.noise(0.04, 900, 0.06, 2); },
    lvl() { [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => this.tone(f, 0.16, 0.1), k * 90)); },
  };

  // ---------- canvas do mapa ----------
  const cv = $('map'), ctx = cv.getContext('2d');
  let vw = 0, vh = 0, dpr = 1, now = 0, last = 0;
  const cam = { x: 0, y: 0, z: 1, over: false };
  const chunks = new Map(), anims = [];
  // `slide` = direção em que o herói está escorregando no gelo (ou null).
  let walker = null, path = [], held = null, tap = null, face = 1, lastScrib = 0, panelOpen = false, slide = null;
  const heroFrames = [A.hero(0), A.hero(1)];

  // Granulado do papel: um padrão de pontinhos por cima de tudo.
  const grain = (() => {
    const g = document.createElement('canvas'); g.width = g.height = 160;
    const x = g.getContext('2d');
    for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(120,100,70,${Math.random() * 0.09})`; x.fillRect(Math.random() * 160, Math.random() * 160, 1 + Math.random(), 1 + Math.random()); }
    return ctx.createPattern(g, 'repeat');
  })();

  // Desktop vê ~12 quadrados de largura; celular em pé, ~6,5 (senão o herói some).
  function baseZoom() { return Math.max(0.55, Math.min(1.35, Math.min(vw / (T * (vw < vh ? 6.5 : 12)), vh / (T * 8.5)))); }
  function overZoom() { return Math.min(vw / (M.W * T), vh / (M.H * T)) * 0.96; }
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = innerWidth; vh = innerHeight;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  }
  addEventListener('resize', resize);
  resize();

  function chunk(cx, cy) {
    const key = cx + ',' + cy;
    let c = chunks.get(key);
    if (!c) {
      const k = document.createElement('canvas');
      k.width = k.height = CH * T * BAKE;
      const x = k.getContext('2d');
      x.setTransform(BAKE, 0, 0, BAKE, -cx * CH * T * BAKE, -cy * CH * T * BAKE);
      c = { cv: k, x, cx, cy };
      chunks.set(key, c);
    }
    return c;
  }
  // "Assa" traços prontos nos chunks que eles tocam.
  function bake(list) {
    const b = S.bbox(list), sz = CH * T;
    for (let cy = Math.floor(b.y0 / sz); cy <= Math.floor(b.y1 / sz); cy++)
      for (let cx = Math.floor(b.x0 / sz); cx <= Math.floor(b.x1 / sz); cx++) S.drawAll(chunk(cx, cy).x, list, 1);
  }
  // Põe traços na fila da caneta do mestre; ao terminar, vão para o chunk.
  function animate(list, delay = 0, speed = 1) {
    anims.push({ list, t0: performance.now() + delay, dur: (260 + Math.min(1100, S.total(list) * 0.42)) / speed });
  }

  // Regras das páginas que mudam o que se vê: a neblina do Pântano Sombrio e
  // a tempestade de areia do Deserto (só lá fora).
  const foggy = () => !inDungeon() && W.biome === 'pantano';
  const stormy = () => !inDungeon() && W.biome === 'deserto' && G.tempestade > 0;
  // Raio do que o mestre desenha: de dia ~2,6 quadrados; no escuro com tocha
  // ~2,2; no escuro sem tocha, só os 8 vizinhos. Na neblina, ~2,1 no máximo;
  // na tempestade de areia, só os vizinhos.
  function reveal(px, py, instant) {
    const found = [], R2 = stormy() ? 2 : !isDark() ? (foggy() ? 4.5 : 6.8) : lit() ? (foggy() ? 4.5 : 5) : 2;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const d = dx * dx + dy * dy, x = px + dx, y = py + dy;
      if (d > R2 || x < 0 || y < 0 || x >= M.W || y >= M.H || L.rev[idx(x, y)]) continue;
      L.rev[idx(x, y)] = 1;
      found.push([x, y, d + Math.random() * 0.5]);
    }
    found.sort((a, b) => a[2] - b[2]);
    found.forEach(([x, y], k) => { const s = A.tile(M, x, y, T, L); if (instant) bake(s); else animate(s, k * 70); });
  }
  function addTrail(ax, ay, bx, by, instant) {
    const a = idx(ax, ay), b = idx(bx, by), key = Math.min(a, b) + '-' + Math.max(a, b);
    if (!instant && L.trail.has(key)) return;
    L.trail.add(key);
    const s = A.trail(ax, ay, bx, by, T, S.hash(M.seed, a, b));
    if (instant) bake(s); else animate(s, 0, 2.5);
  }
  // Redesenha o mapa inteiro de uma vez. `L.noite` diz ao desenho se os
  // monstros da noite (Pântano Sombrio) aparecem.
  function rebakeAll() {
    chunks.clear(); anims.length = 0;
    L.noite = isNight() && !inDungeon();
    for (let i = 0; i < L.rev.length; i++) if (L.rev[i]) bake(A.tile(M, i % M.W, (i / M.W) | 0, T, L));
    for (const key of L.trail) {
      const [a, b] = key.split('-').map(Number);
      bake(A.trail(a % M.W, (a / M.W) | 0, b % M.W, (b / M.W) | 0, T, S.hash(M.seed, a, b)));
    }
  }
  // Interior da masmorra n da página pg (gerado na primeira vez que precisa);
  // andar = 1 é o andar de baixo (masmorras com a variação "andar").
  function dunMap(n, pg = P.pg, andar = 0) {
    const w = WORLD.pages[pg], o = w.obj.get(w.dungeons[n]), k = dunKey(pg, n, andar);
    return dunCache[k] || (dunCache[k] = Wd.dungeon(w.seed, n, o.kind, o.tier, n === w.atalho ? pg + 1 : -1, andar));
  }
  // Troca a página do herói (sem redesenhar: chame setMap depois).
  function setPage(pg) { P.pg = pg; W = WORLD.pages[pg]; }
  // Troca o mapa atual: null = a página; n = a masmorra n dela (no andar `andar`).
  function setMap(n, andar = 0) {
    P.onde = n == null ? null : n;
    P.andar = P.onde == null ? 0 : andar;
    if (P.onde == null) { M = W; L = here(); } else { M = dunMap(n, P.pg, P.andar); const k = dunKey(P.pg, n, P.andar); L = G.dun[k] || (G.dun[k] = newLevel(M)); }
    walker = null; path = [];
    rebakeAll();
  }
  function snapCam() { cam.x = P.x * T + T / 2; cam.y = P.y * T + T / 2 + 20; cam.z = baseZoom(); }

  // ---------- desenho da tela ----------
  function heroPos() {
    if (!walker) return [P.x, P.y];
    const t = walker.t, e = t * t * (3 - 2 * t);
    return [walker.fx + (walker.tx - walker.fx) * e, walker.fy + (walker.ty - walker.fy) * e];
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.PAPER; ctx.fillRect(0, 0, vw, vh);
    if (!W) { drawMargin(); return; }
    const z = cam.z, ox = vw / 2 - cam.x * z, oy = vh / 2 - cam.y * z;
    // Pauta do caderno presa ao mundo: as linhas acompanham o mapa.
    const sp = 32 * z;
    ctx.strokeStyle = C.LINE; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
    ctx.beginPath();
    for (let y = ((oy % sp) + sp) % sp; y < vh; y += sp) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(vw, Math.round(y) + 0.5); }
    ctx.stroke(); ctx.globalAlpha = 1;

    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy);
    const sz = CH * T;
    const x0 = Math.floor(-ox / z / sz) - 1, x1 = Math.floor((vw - ox) / z / sz), y0 = Math.floor(-oy / z / sz) - 1, y1 = Math.floor((vh - oy) / z / sz);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const c = chunks.get(cx + ',' + cy);
      if (c) ctx.drawImage(c.cv, cx * sz, cy * sz, sz, sz);
    }
    // Traços ainda sendo desenhados pelo mestre.
    let head = null;
    for (let k = anims.length - 1; k >= 0; k--) {
      const a = anims[k];
      if (now < a.t0) continue;
      const p = (now - a.t0) / a.dur;
      if (p >= 1) { bake(a.list); anims.splice(k, 1); continue; }
      const h = S.drawAll(ctx, a.list, p);
      if (h && !head) head = h;
    }
    // Caminho planejado (toque/clique): pontinhos de lápis.
    ctx.fillStyle = C.GRAY;
    for (const [x, y] of path) { ctx.beginPath(); ctx.arc(x * T + T / 2, y * T + T / 2 + 8, 2.4, 0, 7); ctx.fill(); }

    // O monstro lendário anda pela página: não fica "assado" no mapa, é
    // desenhado a cada quadro onde ele está, se o herói consegue vê-lo.
    if (legendSeen()) {
      const lg = here().lenda, lx = (lg.i % W.W) * T, ly = ((lg.i / W.W) | 0) * T;
      ctx.save();
      ctx.translate(lx + 7, ly + 8 + Math.sin(now / 160) * 1.5); ctx.scale(0.5, 0.5);
      S.drawAll(ctx, A.monster('lenda_' + P.pg), 1);
      ctx.restore();
    }

    const [hx, hy] = heroPos();
    const px = hx * T + T / 2, py = hy * T + T / 2;
    const bob = walker ? -Math.abs(Math.sin(walker.t * Math.PI)) * 5 : Math.sin(now / 400) * 1.2;
    ctx.fillStyle = 'rgba(43,47,69,0.18)';
    ctx.beginPath(); ctx.ellipse(px, py + 21, 14, 4, 0, 0, 7); ctx.fill();
    ctx.save();
    ctx.translate(px, py - 4 + bob); ctx.scale(0.5 * face, 0.5); ctx.translate(-50, -52);
    S.drawAll(ctx, heroFrames[walker && walker.t > 0.5 ? 1 : 0], 1);
    ctx.restore();

    if (fogV > 0.01 && !cam.over) drawVeil(ox + px * z, oy + py * z, '214,214,206', 0.62 * fogV, 1.4, 2.7);
    if (sandV > 0.01 && !cam.over) drawVeil(ox + px * z, oy + py * z, '214,168,92', 0.6 * sandV, 0.6, 1.8, true);
    if (darkV > 0.01 && !cam.over) drawDark(ox + px * z, oy + py * z);
    if (head) drawPen(head);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMargin();
  }
  // A noite é o mestre pintando a folha de azul-escuro com lápis, menos um
  // círculo em volta do herói (maior com tocha, tremendo como fogo).
  const darkCv = document.createElement('canvas'), dctx = darkCv.getContext('2d');
  const nightHatch = (() => {
    const g = document.createElement('canvas'); g.width = g.height = 14;
    const x = g.getContext('2d');
    x.strokeStyle = 'rgba(20,22,60,0.55)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(-2, 16); x.lineTo(16, -2); x.stroke();
    return ctx.createPattern(g, 'repeat');
  })();
  let darkV = 0;
  function drawDark(sx, sy) {
    if (darkCv.width !== cv.width || darkCv.height !== cv.height) { darkCv.width = cv.width; darkCv.height = cv.height; }
    const d = dctx, z = cam.z, a = darkV, on = lit();
    d.setTransform(dpr, 0, 0, dpr, 0, 0);
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, vw, vh);
    d.fillStyle = `rgba(30,34,84,${0.62 * a})`; d.fillRect(0, 0, vw, vh);
    d.globalAlpha = a; d.fillStyle = nightHatch; d.fillRect(0, 0, vw, vh); d.globalAlpha = 1;
    const fl = on ? 1 + Math.sin(now / 90) * 0.05 + Math.sin(now / 37) * 0.03 : 1;
    const r1 = (on ? 3.3 : 1.5) * T * z * fl, r0 = (on ? 1.9 : 0.55) * T * z;
    const g = d.createRadialGradient(sx, sy, 0, sx, sy, r1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(r0 / r1, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    d.globalCompositeOperation = 'destination-out';
    d.fillStyle = g; d.beginPath(); d.arc(sx, sy, r1, 0, 7); d.fill();
    d.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(darkCv, 0, 0);
    if (on) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = ctx.createRadialGradient(sx, sy, 0, sx, sy, r1);
      w.addColorStop(0, `rgba(239,138,34,${0.13 * a})`); w.addColorStop(1, 'rgba(239,138,34,0)');
      ctx.fillStyle = w; ctx.beginPath(); ctx.arc(sx, sy, r1, 0, 7); ctx.fill();
    }
  }
  // Neblina (Pântano Sombrio) e tempestade de areia (Deserto): uma camada de
  // lápis claro por cima do mapa, menos um círculo em volta do herói (raios
  // r0 e r1 em quadrados). A tempestade ainda tem riscos de areia voando.
  const veilCv = document.createElement('canvas'), vctx = veilCv.getContext('2d');
  let fogV = 0, sandV = 0;
  function drawVeil(sx, sy, rgb, a, r0q, r1q, streaks) {
    if (veilCv.width !== cv.width || veilCv.height !== cv.height) { veilCv.width = cv.width; veilCv.height = cv.height; }
    const d = vctx, z = cam.z, r1 = r1q * T * z, r0 = r0q * T * z;
    d.setTransform(dpr, 0, 0, dpr, 0, 0);
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, vw, vh);
    d.fillStyle = `rgba(${rgb},${a})`; d.fillRect(0, 0, vw, vh);
    if (streaks) {
      d.strokeStyle = `rgba(150,105,40,${0.5 * a})`; d.lineWidth = 2;
      d.beginPath();
      for (let k = 0; k < 40; k++) {
        const x = ((k * 197 + now * 0.9) % (vw + 200)) - 100, y = (k * 89) % vh + Math.sin(now / 300 + k) * 8;
        d.moveTo(x, y); d.lineTo(x + 30, y + 6);
      }
      d.stroke();
    }
    const g = d.createRadialGradient(sx, sy, 0, sx, sy, r1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(r0 / r1, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    d.globalCompositeOperation = 'destination-out';
    d.fillStyle = g; d.beginPath(); d.arc(sx, sy, r1, 0, 7); d.fill();
    d.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(veilCv, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // A caneta do mestre, com a cor do traço que está desenhando.
  function drawPen(h) {
    ctx.save();
    ctx.translate(h.x, h.y); ctx.rotate(0.55);
    ctx.lineWidth = 1.4; ctx.strokeStyle = C.INK;
    ctx.fillStyle = '#d9d4c6';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4.5, -11); ctx.lineTo(4.5, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = h.color || C.INK;
    ctx.fillRect(-5.5, -52, 11, 41); ctx.strokeRect(-5.5, -52, 11, 41);
    ctx.fillStyle = C.INK; ctx.fillRect(-6, -64, 12, 13);
    ctx.fillStyle = h.color || C.INK; ctx.fillRect(4, -62, 3, 18);
    ctx.restore();
  }
  // Margem vermelha e furos do caderno, fixos na tela.
  function drawMargin() {
    const m = vw < 640 ? 22 : 40;
    ctx.fillStyle = C.PAPER; ctx.fillRect(0, 0, m, vh);
    ctx.strokeStyle = C.MARGIN; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(m + 0.5, 0); ctx.lineTo(m + 0.5, vh); ctx.stroke();
    ctx.fillStyle = '#e8e2d2'; ctx.strokeStyle = 'rgba(43,47,69,0.25)'; ctx.lineWidth = 1;
    for (let y = 70; y < vh; y += 110) { ctx.beginPath(); ctx.arc(m / 2, y, m * 0.22, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.globalAlpha = 0.6; ctx.fillStyle = grain; ctx.fillRect(0, 0, vw, vh); ctx.globalAlpha = 1;
  }

  // ---------- laço principal ----------
  function tick(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts; now = ts;
    if (W) {
      if (walker) {
        walker.t += dt / (walker.fast ? 0.1 : 0.16);
        if (walker.t >= 1) { const w = walker; walker = null; P.x = w.tx; P.y = w.ty; arrive(w.fx, w.fy); }
      } else if (!panelOpen) {
        // `tap` guarda um toque rápido de tecla que começou e acabou entre dois quadros.
        const dir = tap || held;
        tap = null;
        if (slide) { const [dx, dy] = slide; slide = null; stepTo(P.x + dx, P.y + dy); if (walker) walker.fast = true; }
        else if (path.length) { const [x, y] = path.shift(); stepTo(x, y); }
        else if (dir) stepTo(P.x + dir[0], P.y + dir[1]);
      }
      const [hx, hy] = heroPos();
      const tx = cam.over ? M.W * T / 2 : hx * T + T / 2, ty = cam.over ? M.H * T / 2 : hy * T + T / 2 + 20;
      const dTarget = inDungeon() ? 0.9 : darkness() * 0.85;
      darkV += (dTarget - darkV) * Math.min(1, dt * 2);
      fogV += ((foggy() ? 1 : 0) - fogV) * Math.min(1, dt * 2);
      sandV += ((stormy() ? 1 : 0) - sandV) * Math.min(1, dt * 2);
      const tz = cam.over ? overZoom() : baseZoom(), k = Math.min(1, dt * 5);
      cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.z += (tz - cam.z) * k;
      if (anims.some(a => now >= a.t0) && now - lastScrib > 110) { lastScrib = now; SFX.scribble(); }
    }
    draw();
    requestAnimationFrame(tick);
  }

  // ---------- placas ----------
  // Placa do caminho: não para o herói, só o mestre lê o que está escrito.
  const RUMOS = ['leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste', 'norte', 'nordeste'];
  function signpost(o) {
    const para = o.to < 0 ? 'Covil do Dragão' : `${Wd.BIOMAS[o.to].nome} (próxima página)`;
    narrate(pick([`Uma placa de madeira: "${para}", com a seta para o ${RUMOS[o.dir]}.`,
      `O mestre desenha uma placa: "${para} →". A seta aponta para o ${RUMOS[o.dir]}.`]));
  }

  // ---------- movimento e eventos do mapa ----------
  // O lendário da página está neste quadrado (e ainda não caiu)?
  const legendAt = i => !inDungeon() && !here().lenda.dead && here().lenda.i === i;
  function blocking(i) {
    const o = M.obj.get(i);
    if (legendAt(i)) return true;
    return o && (((o.type === 'monstro' || o.type === 'chefe') && !L.dead.has(i) && (!o.noite || L.noite)) || (o.type === 'npc' && !(L.mortos && L.mortos.has(i))) || (o.type === 'covil' && !L.won)
      || (o.type === 'passagem' && !L.guarda) || o.type === 'enigma' || (o.type === 'porta' && !L.opened.has('chave')));
  }
  function stepTo(nx, ny) {
    if (nx < 0 || ny < 0 || nx >= M.W || ny >= M.H) return;
    if (nx !== P.x) face = nx > P.x ? 1 : -1;
    const i = idx(nx, ny), o = M.obj.get(i);
    if (blocking(i)) {
      path = []; held = null;
      if (legendAt(i)) meetLegend();
      else if (o.type === 'monstro') meetMonster(i, o);
      else if (o.type === 'chefe') meetBoss(i, o);
      else if (o.type === 'npc') talk(i, o);
      else if (o.type === 'passagem') guardian(i, o);
      else if (o.type === 'enigma') riddle(i, o);
      else if (o.type === 'porta') narrate('Porta trancada, com um cadeado amarelo. A chave deve estar em alguma sala desta masmorra.');
      else lair(i);
      return;
    }
    if (!Wd.passable(M.t[i])) {
      path = [];
      if (!stepTo.warned || now - stepTo.warned > 2500) {
        stepTo.warned = now;
        const bio = M.biome;
        narrate(M.t[i] === Wd.AGUA ? (bio === 'vulcao' ? pick(['Lava! Nem pensar.', 'O mestre ri: "quer virar churrasco?"'])
          : bio === 'pantano' ? 'Água preta e funda. Melhor não.'
          : pick(['Aí é água! Sem barco, nada feito.', 'O mestre balança a cabeça: "não dá pra nadar".']))
          : M.t[i] === Wd.PAREDE ? 'Parede de pedra.' : 'Montanha íngreme demais. Dá a volta.');
      }
      return;
    }
    walker = { fx: P.x, fy: P.y, tx: nx, ty: ny, t: 0 };
    SFX.step();
  }
  // Busca em largura pelos quadrados já desenhados (toque/clique no mapa).
  function findPath(tx, ty) {
    const goal = idx(tx, ty), start = idx(P.x, P.y), prev = new Int32Array(M.W * M.H).fill(-1), q = [start];
    prev[start] = start;
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      if (i === goal) break;
      const x = i % M.W, y = (i / M.W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= M.W || ny >= M.H) continue;
        const j = idx(nx, ny);
        if (prev[j] >= 0 || !L.rev[j]) continue;
        if (j !== goal && (!Wd.passable(M.t[j]) || blocking(j))) continue;
        prev[j] = i; q.push(j);
      }
    }
    if (prev[goal] < 0 || goal === start) return null;
    const out = [];
    for (let i = goal; i !== start; i = prev[i]) out.unshift([i % M.W, (i / M.W) | 0]);
    return out;
  }
  const nearCamp = (x, y) => M.camps.some(v => Math.abs(v % M.W - x) <= 2 && Math.abs(((v / M.W) | 0) - y) <= 2);

  function arrive(fx, fy) {
    G.steps++;
    // O relógio anda um passo; o mestre avisa quando anoitece e amanhece.
    const wasNight = isNight();
    if (++G.clock >= CICLO) { G.clock = 0; G.day++; }
    burnTorch(true);
    coolLava();
    // Regras das páginas, antes de desenhar em volta (a tempestade e a lava
    // mudam o que o mestre desenha).
    const event = !inDungeon() && pageRules();
    addTrail(fx, fy, P.x, P.y);
    reveal(P.x, P.y);
    const i = idx(P.x, P.y), t = M.t[i], tier = M.tier[i], o = M.obj.get(i);
    if (!inDungeon()) {
      const tt = TERRAIN_TEXT[W.biome][t], tk = 't' + W.biome + t;
      if (event) { /* a regra da página já falou */ }
      else if (tt && !G.seen.has(tk)) { G.seen.add(tk); narrate(tt); }
      else if (REGION_TEXT[tier] && !G.seen.has('r' + tier)) { G.seen.add('r' + tier); narrate(REGION_TEXT[tier]); }
      if (!wasNight && isNight()) narrate(P.tocha > 0 ? 'Anoiteceu. O mestre pinta a folha de azul-escuro; sua tocha ilumina em volta. Os monstros ficam mais fortes.'
        : 'Anoiteceu! O mestre pinta a folha de azul-escuro. Sem tocha, você mal enxerga, e os monstros ficam mais fortes.');
      else if (wasNight && !isNight()) narrate(`Amanheceu! Dia ${G.day + (G.clock > 90 ? 1 : 0)}. O mestre apaga o azul com a borracha.`);
      // No Pântano Sombrio, os monstros da noite aparecem e somem com ela.
      if (wasNight !== isNight() && W.biome === 'pantano') {
        rebakeAll();
        if (isNight()) setTimeout(() => narrate('Os mortos se levantam! O mestre desenha mais monstros no brejo.'), 2500);
      }
      mirages();
      moveLegend();
    }
    const stop = () => { path = []; held = null; slide = null; };
    if (o && o.type === 'fogueira') { stop(); camp(i, o); }
    else if (o && o.type === 'masmorra') { stop(); enterDungeon(i, o); }
    else if (o && o.type === 'saida') { stop(); leaveDungeon(); }
    else if (o && o.type === 'atalho') { stop(); shortcut(o); }
    else if (o && o.type === 'descer') { stop(); stairs(true); }
    else if (o && o.type === 'subir') { stop(); stairs(false); }
    else if (o && o.type === 'chave' && !L.opened.has('chave')) {
      stop();
      L.opened.add('chave');
      rebakeAll(); SFX.coin();
      narrate('Você pegou a chave! As portas da sala do chefe estão abertas.');
    }
    else if (o && o.type === 'armadilha' && !L.opened.has(i)) { stop(); trap(i); }
    else if (o && (o.type === 'passagem' || o.type === 'volta')) { stop(); turnPage(o); }
    else if (o && o.type === 'bau' && !L.opened.has(i)) { stop(); chest(i, o); }
    else if (o && o.type === 'placa') signpost(o);
    else if (!o && !inDungeon() && G.steps > 6 && G.steps >= G.calma && !nearCamp(P.x, P.y)) {
      // Depois de uma surpresa, 8 passos de calma para explorar em paz.
      const chance = ({ [Wd.AREIA]: 0.03, [Wd.CAMPO]: 0.035, [Wd.MATA]: 0.05, [Wd.PANTANO]: 0.06 }[t] || 0) * (isNight() ? 1.5 : 1);
      if (Math.random() < chance) { stop(); G.calma = G.steps + 8; ambush(tier); }
    }
    if (G.steps % 50 === 0) setTimeout(cloudSave, 0);
    // Gelo das Montanhas Geladas: o herói continua escorregando na mesma
    // direção até sair do gelo ou o próximo quadrado ter alguma coisa.
    if (!panelOpen && !inDungeon() && W.biome === 'neve' && t === Wd.AREIA && !o) {
      const dx = P.x - fx, dy = P.y - fy, nx = P.x + dx, ny = P.y + dy, j = idx(nx, ny);
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < M.W && ny < M.H && Wd.passable(M.t[j]) && !M.obj.has(j) && !blocking(j)) {
        slide = [dx, dy]; path = [];
        if (!G.seen.has('escorregou')) { G.seen.add('escorregou'); narrate('Você escorrega no gelo! Só para quando sair dele ou bater em alguma coisa.'); }
      }
    }
    hud(); save();
  }

  // ---------- regras das páginas ----------
  // Conta os passos lá fora e dispara a tempestade de areia (Deserto) ou a
  // erupção (Vulcão). Devolve true se o mestre narrou alguma coisa.
  function pageRules() {
    if (W.biome === 'deserto') {
      if (G.tempestade > 0) {
        if (--G.tempestade === 0) { narrate('A tempestade passou. O mestre sopra a areia do papel.'); return true; }
        return false;
      }
      if (++G.areia >= TEMPESTADE_A) { G.areia = 0; sandstorm(); return true; }
      if (G.areia === TEMPESTADE_A - 4) { narrate('O vento começa a levantar areia...'); return true; }
    } else if (W.biome === 'vulcao') {
      if (++G.vulcao >= ERUPCAO_A) { G.vulcao = 0; return erupt(); }
      if (G.vulcao === ERUPCAO_A - 4) { narrate('O chão treme. O mestre pega a caneta laranja...'); return true; }
    }
    return false;
  }
  // Tempestade de areia: por TEMPESTADE_N passos o mestre só desenha os
  // vizinhos, e a borracha apaga um pedaço do mapa já desenhado (longe do
  // herói). O que tem nome escrito (fogueiras, masmorras, personagens com
  // missão, a passagem) a borracha não apaga.
  function sandstorm() {
    G.tempestade = TEMPESTADE_N;
    const ring = [];
    for (let i = 0; i < L.rev.length; i++) {
      const d = Math.max(Math.abs(i % M.W - P.x), Math.abs(((i / M.W) | 0) - P.y));
      if (L.rev[i] && d >= 6 && d <= 12) ring.push(i);
    }
    let erased = 0;
    if (ring.length) {
      const c = pick(ring), cx = c % M.W, cy = (c / M.W) | 0;
      for (let i = 0; i < L.rev.length; i++) {
        const x = i % M.W, y = (i / M.W) | 0, o = M.obj.get(i);
        if (!L.rev[i] || (x - cx) ** 2 + (y - cy) ** 2 > 12) continue;
        if (o && (o.type === 'fogueira' || o.type === 'masmorra' || o.type === 'passagem' || o.type === 'volta' || (o.type === 'npc' && o.quest))) continue;
        L.rev[i] = 0; erased++;
      }
      // O rastro que passava pelo pedaço apagado também some.
      for (const key of [...L.trail]) if (key.split('-').some(k => !L.rev[+k])) L.trail.delete(key);
      rebakeAll();
    }
    path = [];
    narrate(`Tempestade de areia! Você mal enxerga um palmo${erased ? ', e o vento leva um pedaço do mapa: o mestre passa a borracha' : ''}.`);
  }
  // Erupção: 3 rios de lava saem dos vulcões perto do herói e cobrem uns
  // quadrados por LAVA_N passos. Um rio que fecharia o caminho até uma
  // fogueira, masmorra, personagem, a seta de volta ou o covil não sai.
  function erupt() {
    const near = [];
    for (let i = 0; i < W.t.length; i++) {
      const x = i % W.W, y = (i / W.W) | 0;
      if (W.t[i] === Wd.MONTANHA && Math.max(Math.abs(x - P.x), Math.abs(y - P.y)) <= 10) near.push(i);
    }
    const ok = j => j >= 0 && j < W.t.length && Wd.passable(W.t[j]) && !W.obj.has(j) && !G.lava[j] && here().lenda.i !== j
      && Math.abs(j % W.W - P.x) + Math.abs(((j / W.W) | 0) - P.y) >= 3 && !nearCamp(j % W.W, (j / W.W) | 0);
    const nb = i => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => { const x = i % W.W + dx, y = ((i / W.W) | 0) + dy; return x >= 0 && y >= 0 && x < W.W && y < W.H; })
      .map(([dx, dy]) => i + dy * W.W + dx);
    const until = G.steps + LAVA_N;
    let flows = 0;
    for (let k = 0; k < 12 && flows < 3 && near.length; k++) {
      const v = pick(near), first = nb(v).filter(ok);
      if (!first.length) continue;
      const flow = [pick(first)], len = 4 + rnd(4);
      while (flow.length < len) {
        const nx = nb(flow[flow.length - 1]).filter(j => ok(j) && !flow.includes(j));
        if (!nx.length) break;
        flow.push(pick(nx));
      }
      for (const j of flow) G.lava[j] = [W.t[j], until];
      for (const j of flow) W.t[j] = Wd.AGUA;
      if (cutsOff()) { for (const j of flow) { W.t[j] = G.lava[j][0]; delete G.lava[j]; } continue; }
      flows++;
    }
    if (!flows) return false;
    rebakeAll();
    narrate('Erupção! O vulcão cospe lava e o mestre pinta rios laranja pelo caminho. Daqui a pouco ela esfria.');
    return true;
  }
  // A lava fecha o caminho do herói até algum lugar importante da página?
  function cutsOff() {
    const seen = new Uint8Array(W.W * W.H), q = [idx(P.x, P.y)];
    seen[q[0]] = 1;
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % W.W, y = (i / W.W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, j = ny * W.W + nx;
        if (nx >= 0 && ny >= 0 && nx < W.W && ny < W.H && !seen[j] && Wd.passable(W.t[j])) { seen[j] = 1; q.push(j); }
      }
    }
    for (const [i, o] of W.obj) {
      if (!['fogueira', 'masmorra', 'npc', 'volta', 'covil', 'passagem'].includes(o.type)) continue;
      // Personagem e covil bloqueiam o quadrado: basta chegar num vizinho.
      const x = i % W.W, y = (i / W.W) | 0;
      if (!seen[i] && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen[(y + dy) * W.W + x + dx] && x + dx >= 0 && x + dx < W.W)) return true;
    }
    return false;
  }
  // A lava de cada erupção esfria depois de LAVA_N passos (em qualquer mapa).
  function coolLava() {
    const v = WORLD.pages[Wd.PAGINAS - 1];
    let cooled = false;
    for (const k in G.lava) if (G.steps >= G.lava[k][1]) { v.t[+k] = G.lava[k][0]; delete G.lava[k]; cooled = true; }
    if (cooled && M === v) { rebakeAll(); narrate('A lava esfriou e virou pedra de novo.'); }
  }
  // Miragens (Deserto): um baú ou monstro que some quando o herói chega do
  // lado. Voltam com o descanso, como os monstros.
  function mirages() {
    let gone = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = P.x + dx, y = P.y + dy;
      if (x < 0 || y < 0 || x >= M.W || y >= M.H) continue;
      const i = idx(x, y), o = M.obj.get(i);
      if (o && o.type === 'miragem' && !L.dead.has(i)) { L.dead.add(i); gone++; }
    }
    if (!gone) return;
    rebakeAll();
    narrate(pick(['Era miragem! O mestre ri e apaga com a borracha.', 'Você esfrega os olhos... não tinha nada ali. Miragem!', 'O calor engana: era só miragem.']));
  }

  // ---------- monstro lendário ----------
  // O herói consegue ver o lendário? Ele precisa estar num quadrado já
  // desenhado e perto o bastante no escuro, na neblina ou na tempestade.
  function legendSeen() {
    if (!W || inDungeon() || !G) return false;
    const lg = here().lenda;
    if (lg.dead || !L.rev[lg.i]) return false;
    const d = Math.hypot(lg.i % W.W - P.x, ((lg.i / W.W) | 0) - P.y);
    const view = stormy() ? 1.5 : isDark() ? (lit() ? 3 : 1.5) : foggy() ? 2.5 : Infinity;
    return d <= view;
  }
  // A cada passo do herói na página, o lendário anda: perto do herói (até 5
  // quadrados) ele foge na maioria das vezes; longe, passeia. Não pisa em
  // nada desenhado nem perto das fogueiras.
  function moveLegend() {
    const lg = here().lenda;
    if (lg.dead) return;
    const x = lg.i % W.W, y = (lg.i / W.W) | 0, far = (a, b) => Math.abs(a - P.x) + Math.abs(b - P.y);
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy])
      .filter(([a, b]) => a >= 0 && b >= 0 && a < W.W && b < W.H && Wd.passable(W.t[b * W.W + a]) && !W.obj.has(b * W.W + a)
        && !(a === P.x && b === P.y) && !nearCamp(a, b));
    if (!opts.length) return;
    const d = far(x, y);
    let next = null;
    if (d <= 5) {
      if (Math.random() < 0.75) {
        const best = Math.max(...opts.map(([a, b]) => far(a, b)));
        if (best > d) next = pick(opts.filter(([a, b]) => far(a, b) === best));
      }
    } else if (Math.random() < 0.5) next = pick(opts);
    if (next) lg.i = next[1] * W.W + next[0];
    if (legendSeen() && !G.seen.has('l' + P.pg)) {
      G.seen.add('l' + P.pg);
      const m = MONSTERS['lenda_' + P.pg];
      // Se o mestre acabou de falar outra coisa, espera ele terminar.
      setTimeout(() => narrate(`Olha ali: ${oa(m)} <b>${m.nome}</b>, com uma estrela na cabeça! O mestre desenha rapidinho e ${m.art === 'a' ? 'ela' : 'ele'} sai correndo. Encurrale para lutar.`),
        performance.now() - narrAt < 1500 ? 4500 : 600);
    }
  }
  // Depois de fugir de uma luta, o lendário reaparece longe do herói, na
  // região do meio ou na última da página.
  function legendAway() {
    const lg = here().lenda, base = P.pg * 3 + 1, c = [];
    for (let i = 0; i < W.t.length; i++) {
      const x = i % W.W, y = (i / W.W) | 0;
      if (W.tier[i] > base && Wd.passable(W.t[i]) && !W.obj.has(i) && !nearCamp(x, y) && Math.abs(x - P.x) + Math.abs(y - P.y) >= 15) c.push(i);
    }
    if (c.length) lg.i = pick(c);
  }
  async function meetLegend() {
    const id = 'lenda_' + P.pg, m = MONSTERS[id], lg = here().lenda, ele = m.art === 'a' ? 'ela' : 'ele';
    const v = await dialog(`${m.nome}!`,
      `<p>Você encurralou ${oa(m)} <b>${m.nome}</b>, o monstro lendário desta página!</p>
       <p>${ic('heart')} ${lg.hp}/${m.hp} de vida · ${ic('sword')} ataque ${fmtD(atkOf(m))}${nightBonus() ? ' (noite)' : ''} · ${ic('shield')} defesa ${fmtD(m.def)}</p>
       ${espTxt(m)}
       <p class="small">Cuidado: na vez ${m.art === 'a' ? 'dela' : 'dele'}, ${ele} pode fugir no meio da luta (e volta com a vida que perdeu). Vencer dá um tesouro.</p>`,
      [{ html: 'Enfrentar', v: 'luta', cls: 'red' }, { html: 'Deixar pra lá', v: 'nao' }], A.monsterURL(id, 160));
    if (v !== 'luta') return;
    const opt = { hp: lg.hp, foge: true, text: `${m.nome} rosna, sem saída. O mestre pinta a estrela de amarelo.` };
    const r = await combat(id, opt);
    if (r === 'vitoria') {
      lg.dead = true;
      const it = loot(P.pg * 3 + 3);
      P.bolsa.push(it);
      save();
      await dialog('Lenda vencida!', `<p>Ninguém nunca tinha pegado ${oa(m)} ${m.nome}! O mestre escreve seu nome do lado do desenho. ${cap(ele)} deixou ${itemIc(it)} <b>${ITEMS[it].nome}</b> (${fmtD(ITEMS[it].dado)})! Está na mochila.</p>`,
        [{ html: 'Oba!', v: 1, cls: 'green' }], A.iconURL('star', C.YELLOW, 160));
    } else if (r !== 'derrota') {
      lg.hp = Math.max(1, opt.left);
      legendAway();
      narrate(`${m.nome} sumiu no mapa, com ${lg.hp} de vida. Vai ter que achar de novo!`);
    }
    hud(); save();
  }

  // ---------- masmorras: armadilha, enigma e andar de baixo ----------
  // Armadilha escondida: d20 ≥ 11 pula a tempo; senão, toma (região/2)d8,
  // mas nunca desmaia por ela (fica com 1 de vida, no mínimo).
  async function trap(i) {
    L.opened.add(i);
    rebakeAll();
    const tr = M.tier[i], dano = [Math.ceil(tr / 2), 8];
    openPanel(`<h2>Armadilha!</h2><p>Clique! Espetos saem do chão. Role 1d20: 11 ou mais, você pula a tempo.</p>
      <canvas id="tray" class="tray mini"></canvas><p id="clog"></p><div class="actions" id="acts"></div>`, 'dialog');
    const tray = new Tray($('tray'));
    const [d] = await tray.roll([{ label: 'Pular', dice: [20], color: C.INK }]);
    if (d >= 11) {
      tray.result(`${d}`, 'pulou!', C.GREEN);
      $('clog').textContent = 'Você pula para trás bem na hora.';
    } else {
      await wait(500);
      const [v] = await tray.roll([{ label: 'Espetos', dice: expand([dano]), color: C.PURPLE }]);
      const lost = Math.min(v, P.hp - 1);
      P.hp -= lost; SFX.hit();
      tray.result(`−${lost}`, 'de vida', C.PURPLE);
      $('clog').textContent = lost < v ? 'Ai! Você escapa por um triz, quase sem vida.' : 'Ai! Os espetos pegam seu pé.';
    }
    await ask($('acts'), [{ html: 'Continuar', v: 1, cls: 'green' }]);
    closePanel(); hud(); save();
  }
  // Cara de pedra: uma adivinha com 3 respostas. Acertar dá um equipamento da
  // loja da página seguinte; errar chama um monstro da masmorra. Uma tentativa só.
  async function riddle(i, o) {
    if (L.opened.has(i)) { narrate('A cara de pedra dorme. Ela só pergunta uma vez.'); return; }
    const [q, ...ans] = ENIGMAS[o.q % ENIGMAS.length], right = ans[0];
    const order = ans.slice().sort((a, b) => S.hash(o.q, a.length, a.charCodeAt(0)) - S.hash(o.q, b.length, b.charCodeAt(0)));
    const v = await dialog('A cara de pedra', `<p>Na parede, uma cara de pedra abre a boca. O mestre escreve embaixo, com letra caprichada:</p>
      <p><b>"O que é, o que é? ${q}"</b></p><p class="small">Acertou, ganha um tesouro. Errou... alguma coisa acorda. Ela só pergunta uma vez.</p>`,
      order.map(a => ({ html: a, v: a, cls: 'purple' })).concat([{ html: 'Pensar depois', v: 'nao' }]));
    if (v === 'nao') return;
    L.opened.add(i);
    animate(A.cross(i % M.W, (i / M.W) | 0, T, i));
    if (v === right) {
      const it = loot(M.tier[i]);
      P.bolsa.push(it); SFX.lvl();
      save();
      await dialog('Acertou!', `<p>"${cap(right)}!" A cara de pedra sorri e cospe ${itemIc(it)} <b>${ITEMS[it].nome}</b> (${fmtD(ITEMS[it].dado)}). Está na mochila.</p>`,
        [{ html: 'Oba!', v: 1, cls: 'green' }], A.iconURL('chest', '', 160));
    } else {
      save();
      await dialog('Errou!', `<p>A resposta era <b>${right}</b>. A cara de pedra ri tão alto que acorda ${um(MONSTERS[M.kind])} ${MONSTERS[M.kind].nome}!</p>`,
        [{ html: 'Lutar', v: 1, cls: 'red' }], A.monsterURL(M.kind, 160));
      await combat(M.kind);
    }
    hud(); save();
  }
  // Escada entre os dois andares de uma masmorra com a variação "andar".
  async function stairs(down) {
    const v = await dialog(down ? 'Andar de baixo' : 'Escada', `<p>${down ? `Uma escada escura desce mais fundo. Lá embaixo está ${oa(MONSTERS['chefe_' + M.kind])} <b>${MONSTERS['chefe_' + M.kind].nome}</b>.` : 'Subir de volta para o primeiro andar?'}</p>`,
      [{ html: down ? 'Descer' : 'Subir', v: 'sim', cls: down ? 'red' : 'green' }, { html: 'Ficar aqui', v: 'nao' }], A.iconURL('map', '', 160));
    if (v !== 'sim') return;
    const n = M.masmorra;
    setMap(n, down ? 1 : 0);
    let to = M.start;
    if (!down) for (const [i, o] of M.obj) if (o.type === 'descer') to = i;
    P.x = to % M.W; P.y = (to / M.W) | 0;
    snapCam();
    reveal(P.x, P.y);
    narrate(down ? 'O mestre vira mais uma página e desenha um andar ainda mais fundo.' : 'O mestre volta para o primeiro andar.');
    hud(); save();
  }

  // ---------- painéis (folhas por cima do mapa) ----------
  const ic = (name, color, cls = 'ic') => `<img class="${cls}" src="${A.iconURL(name, color)}" alt="">`;
  const itemIc = id => ITEMS[id] ? ic(ITEMS[id].icon, ITEMS[id].cor) : ic('scroll', SPELLS[id].cor);
  function openPanel(html, cls = '') {
    const p = $('panel');
    p.className = 'sheet ' + cls; p.innerHTML = html; p.onclick = null; p.scrollTop = 0;
    $('overlay').hidden = false; panelOpen = true; held = null; tap = null; path = [];
  }
  function closePanel() { $('overlay').hidden = true; $('panel').innerHTML = ''; panelOpen = false; hud(); }
  // Botões que devolvem uma promessa com o valor escolhido.
  function ask(el, list) {
    return new Promise(res => {
      el.innerHTML = list.map((b, k) => `<button data-k="${k}" class="${b.cls || ''}" ${b.off ? 'disabled' : ''}>${b.html}</button>`).join('');
      el.onclick = e => {
        const bt = e.target.closest('button');
        if (!bt || bt.disabled) return;
        el.onclick = null; el.innerHTML = '';
        res(list[+bt.dataset.k].v);
      };
    });
  }
  function dialog(title, body, buttons, art) {
    openPanel(`<h2>${title}</h2><div class="dlg">${art ? `<img class="dlg-art" src="${art}" alt="">` : ''}<div>${body}</div></div><div class="actions" id="acts"></div>`, 'dialog');
    return ask($('acts'), buttons).then(v => { closePanel(); return v; });
  }

  let narrT = 0, narrAt = -1e9;
  function narrate(text) {
    narrAt = performance.now();
    const el = $('narr');
    el.innerHTML = `<b>Mestre:</b> ${text}`;
    el.hidden = false;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    clearTimeout(narrT);
    narrT = setTimeout(() => { el.hidden = true; }, 3200 + text.length * 35);
  }

  function hud() {
    if (!P || !G) return;
    const night = isNight() || inDungeon();
    $('time-img').src = A.iconURL(night ? 'moon' : 'sun');
    $('s-time').querySelector('b').textContent = inDungeon() ? (P.andar ? 'Andar de baixo' : 'Masmorra')
      : `Dia ${G.day}${isNight() ? ' · noite' : ''}${stormy() ? ' · tempestade' : ''}`;
    // No celular só o número da página (o nome do bioma fica escondido no CSS).
    $('s-page').querySelector('b').innerHTML = `${P.pg + 1}<span class="bio">. ${Wd.BIOMAS[P.pg].nome}</span>`;
    $('s-torch').querySelector('b').innerHTML = `${P.tochas}${P.tocha > 0 ? ` <small>acesa: ${P.tocha}</small>` : ''}`;
    $('torch-img').src = A.iconURL('torch', P.tocha > 0 ? '' : 'off');
    const qs2 = P.missoes.map(q => {
      const pr = Math.min(q.n, progress(q)), done = pr >= q.n;
      return `<div class="${done ? 'done' : ''}">${done ? '✓' : '•'} ${questText(q)} <b>${pr}/${q.n}</b>${done ? ` <small>volte a ${npcOf(q).nome}</small>` : ''}</div>`;
    });
    $('quests').innerHTML = qs2.length ? `<i>Missões</i>${qs2.join('')}` : '';
    $('quests').hidden = !qs2.length;
    $('s-hp').querySelector('b').textContent = `${P.hp}/${P.hpMax}`;
    $('s-pm').querySelector('b').textContent = `${P.pm}/${P.pmMax}`;
    $('s-gold').querySelector('b').textContent = P.ouro;
    $('s-atk').querySelector('b').textContent = fmtD(atkDie());
    $('s-def').querySelector('b').textContent = defDice().map(fmtD).join(' + ') || '—';
    $('s-lvl').querySelector('b').textContent = `Nível ${P.lvl}`;
    $('s-lvl').querySelector('.xp i').style.width = Math.min(100, P.xp / xpNext(P.lvl) * 100) + '%';
  }

  // ---------- bandeja de dados ----------
  // Os dados rolam (números trocando, dado tremendo) e param um de cada vez.
  // Um grupo com `pen` (maldição) tira pen de cada dado na soma, sem deixar
  // nenhum abaixo de 1; o dado mostra o número que caiu.
  class Tray {
    constructor(canvas) {
      this.cv = canvas; this.ctx = canvas.getContext('2d'); this.groups = []; this.res = null;
      this.fit(); this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    }
    fit() {
      const r = this.cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      this.w = r.width || 320; this.h = r.height || 160;
      this.cv.width = this.w * d; this.cv.height = this.h * d;
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    roll(defs) {
      SFX.dice();
      const t0 = performance.now();
      this.res = null;
      this.groups = defs.map((g, gi) => ({
        ...g, total: null,
        dice: g.dice.map((s, k) => ({ s, v: 1 + rnd(s), final: 1 + rnd(s), stop: t0 + 600 + k * 90 + gi * 140, rot: 0, lt: 0 })),
      }));
      const end = Math.max(t0, ...this.groups.flatMap(g => g.dice.map(d => d.stop)));
      return new Promise(res => setTimeout(() => {
        for (const g of this.groups) g.total = g.dice.reduce((a, d) => a + Math.max(1, d.final - (g.pen || 0)), 0);
        res(this.groups.map(g => g.total));
      }, end - t0 + 150));
    }
    faces(gi) { return this.groups[gi].dice.map(d => d.final); }
    sides(gi) { return this.groups[gi].dice.map(d => d.s); }
    // Sem dados na bandeja, só o letreiro (um feitiço do monstro, por exemplo).
    show(big, small, color) { this.groups = []; this.result(big, small, color); }
    result(big, small, color) { this.res = { big, small, color }; }
    loop(t) {
      if (!this.cv.isConnected) return;
      this.draw(t);
      requestAnimationFrame(this.loop);
    }
    draw(t) {
      const c = this.ctx, n = this.groups.length, resH = this.res ? 40 : 0;
      c.clearRect(0, 0, this.w, this.h);
      const rowH = n ? Math.min(100, (this.h - resH) / n) : 0;
      this.groups.forEach((g, gi) => {
        const y0 = gi * rowH, size = Math.max(22, Math.min(rowH - 28, (this.w - 80) / g.dice.length / 1.15, 58));
        c.font = `19px ${S.HAND}`; c.fillStyle = g.color; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillText(g.label, 6, y0 + 19);
        g.dice.forEach((d, k) => {
          const rolling = t < d.stop;
          if (rolling && t - d.lt > 55) { d.v = 1 + rnd(d.s); d.lt = t; d.rot = (Math.random() - 0.5) * 0.9; }
          if (!rolling) { d.v = d.final; d.rot = k % 2 ? 0.07 : -0.05; }
          const j = rolling ? 3 : 0;
          A.drawDie(c, d.s, d.v, 8 + size / 2 + k * size * 1.15 + (Math.random() - 0.5) * j, y0 + 26 + size / 2 + (Math.random() - 0.5) * j, size, g.color, d.rot);
        });
        if (g.total != null && g.dice.length > 1) {
          c.font = `${Math.round(Math.min(34, size * 0.7))}px ${S.HAND}`; c.fillStyle = C.INK;
          c.fillText('= ' + g.total, 10 + g.dice.length * size * 1.15, y0 + 26 + size * 0.68);
        }
      });
      if (this.res) {
        // Encolhe a letra para caber na bandeja estreita do celular em pé.
        const txt = this.res.big + (this.res.small ? '  ' + this.res.small : '');
        c.font = `34px ${S.TITLE}`;
        const px = Math.max(16, Math.min(34, Math.floor(34 * (this.w - 12) / c.measureText(txt).width)));
        c.font = `${px}px ${S.TITLE}`; c.fillStyle = this.res.color || C.INK; c.textAlign = 'center';
        c.fillText(txt, this.w / 2, this.h - 10);
      }
    }
  }

  // O monstro sendo desenhado na folha da luta, com os riscos dos golpes.
  // `kind` é o tipo do monstro ou já os traços (o herói, do outro lado).
  class FoeView {
    constructor(canvas, kind) {
      this.cv = canvas; this.ctx = canvas.getContext('2d'); this.fx = []; this.t0 = performance.now(); this.x = null;
      const r = canvas.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      this.s = Math.min(r.width, r.height) || 200;
      canvas.width = r.width * d; canvas.height = r.height * d;
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
      this.ox = (r.width - this.s) / 2;
      this.list = S.xform(typeof kind === 'string' ? A.monster(kind) : kind, this.s / 100, this.ox, 0);
      this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    }
    hit(color) {
      this.fx.push({ list: S.xform(A.slash(rnd(1e9), color), this.s / 100, this.ox, 0), t0: performance.now() });
      this.cv.classList.remove('shake'); void this.cv.offsetWidth; this.cv.classList.add('shake');
    }
    defeat() { this.x = { list: S.xform(A.cross(0, 0, 100, 5), this.s / 100, this.ox, 0), t0: performance.now() }; }
    loop(t) {
      if (!this.cv.isConnected) return;
      const c = this.ctx;
      c.clearRect(0, 0, this.cv.width, this.cv.height);
      S.drawAll(c, this.list, Math.min(1, (t - this.t0) / 900));
      this.fx = this.fx.filter(f => t - f.t0 < 650);
      for (const f of this.fx) S.drawAll(c, f.list, Math.min(1, (t - f.t0) / 180));
      if (this.x) S.drawAll(c, this.x.list, Math.min(1, (t - this.x.t0) / 400));
      requestAnimationFrame(this.loop);
    }
  }

  // ---------- combate ----------
  // Luta contra `opt.n` monstros iguais (1 a 3; no mapa, os grupos têm "×2"
  // ou "×3" em cima). Com mais de um, você toca no monstro para escolher o
  // alvo; na vez deles, cada monstro vivo age, um depois do outro.
  // opt.treino = duelo na fogueira (sem noite, sem prêmio aqui, ninguém
  //   desmaia: chegar a 0 dá 'perdeu' e você fica com 1 de vida; "Desistir"
  //   sai sem rolar).
  // opt.hp = vida com que o monstro começa (o lendário machucado); opt.foge =
  //   ele pode fugir na vez dele ('escapou'). A vida que sobrou volta em opt.left.
  async function combat(kind, opt = {}) {
    const md = MONSTERS[kind], night = !opt.treino && nightBonus(), n = opt.n || 1;
    const foes = Array.from({ length: n }, (_, k) => ({ ...md, max: md.hp, atk: opt.treino ? md.atk : atkOf(md), k, nome: n > 1 ? `${md.nome} ${k + 1}` : md.nome }));
    if (opt.hp) foes[0].hp = opt.hp;
    openPanel(`
      <div class="combat">
        <div class="foes${n > 1 ? ' multi' : ''}">
          ${foes.map(f => `<div class="foe" data-k="${f.k}">
            <canvas id="foe-cv-${f.k}"></canvas>
            <h2>${f.nome}</h2>
            <div class="bar foe-bar"><i id="foe-bar-${f.k}"></i></div>
            <p class="small">${ic('heart')}<span id="foe-hp-${f.k}"></span> ${ic('sword')}${fmtD(f.atk)} ${ic('shield')}${fmtD(f.def)}</p>
          </div>`).join('')}
          ${night ? `<p class="small night">${ic('moon')} noite: +1 dado de ataque, +50% de experiência</p>` : ''}
        </div>
        <div class="mid">
          <canvas id="tray" class="tray"></canvas>
          <p id="clog" class="clog"></p>
          <div class="actions" id="acts"></div>
        </div>
        <div class="me">
          <div class="flip"><canvas id="me-cv"></canvas></div>
          <h2>${esc(P.nome)}</h2>
          <div class="bar me-bar"><i></i></div>
          <p class="small"><span class="st">${ic('heart')}<span id="me-hp"></span></span> <span class="st">${ic('star')}<span id="me-pm"></span></span></p>
          <p class="small"><span class="st">${ic('sword')}<span id="me-atk"></span></span> <span class="st">${ic('shield')}<span id="me-def"></span></span></p>
          <p id="cstat" class="small cstat"></p>
        </div>
      </div>`, 'fight');
    // Monstros à esquerda, dados no meio e o herói à direita, virado para eles.
    for (const f of foes) f.view = new FoeView($('foe-cv-' + f.k), kind);
    const me = new FoeView($('me-cv'), A.hero(0)), tray = new Tray($('tray')), acts = $('acts');
    const hurt = () => { const p = $('panel'); p.classList.remove('hurt'); void p.offsetWidth; p.classList.add('hurt'); me.hit(C.PURPLE); };
    const log = txt => { $('clog').innerHTML = txt; };
    // Maldição em você (null ou { nome, pen, n rodadas }) e dados de defesa
    // quebrados: só valem nesta luta.
    let curse = null, broken = 0;
    const alive = () => foes.filter(f => f.hp > 0);
    // O alvo: o que você tocou, ou o primeiro vivo se ele já caiu.
    let alvo = 0;
    const target = () => foes[alvo].hp > 0 ? foes[alvo] : alive()[0];
    const bars = () => {
      for (const f of foes) {
        $('foe-hp-' + f.k).textContent = `${Math.max(0, f.hp)}/${f.max}`;
        $('foe-bar-' + f.k).style.width = Math.max(0, f.hp / f.max * 100) + '%';
        const card = document.querySelector(`.foe[data-k="${f.k}"]`);
        if (f.hp <= 0 && !f.x) { f.x = true; f.view.defeat(); card.classList.add('dead'); }
        card.classList.toggle('alvo', n > 1 && f === target());
      }
      $('me-hp').textContent = `${Math.max(0, P.hp)}/${P.hpMax}`;
      $('me-pm').textContent = `${P.pm}/${P.pmMax}`;
      // Ataque e defesa do herói como estão agora: sem os dados quebrados e,
      // com maldição, com o "−1 por dado" do lado.
      const pn = curse ? ` <small class="cstat">−${curse.pen}</small>` : '';
      $('me-atk').innerHTML = fmtD(atkDie()) + pn;
      $('me-def').innerHTML = (fmtDice(defList().slice(broken)) || '—') + pn;
      document.querySelector('.me-bar i').style.width = Math.max(0, P.hp / P.hpMax * 100) + '%';
      hud();
    };
    if (n > 1) document.querySelector('.foes').onclick = e => {
      const card = e.target.closest('.foe');
      if (card && foes[+card.dataset.k].hp > 0) { alvo = +card.dataset.k; bars(); }
    };
    bars();
    const Um = cap(n === 1 ? um(md) : n === 2 ? (md.art === 'a' ? 'duas' : 'dois') : 'três');
    log(opt.text || (n > 1 ? `${Um} ${md.pl} aparecem! Toque num deles para escolher em quem bater.`
      : `${Um} ${md.nome} aparece! O mestre desenha rapidinho.`));
    await wait(500);

    const status = () => {
      const parts = [];
      // O "−2" já aparece do lado dos dados do herói; aqui, só o nome e quanto falta.
      if (curse) parts.push(`${ic('scroll', C.PURPLE)} ${curse.nome}: ${curse.n} rodada${curse.n > 1 ? 's' : ''}`);
      if (broken) parts.push(`${ic('shield', C.PURPLE)} ${broken} dado${broken > 1 ? 's' : ''} quebrado${broken > 1 ? 's' : ''}`);
      $('cstat').innerHTML = parts.join(' · ');
      bars();
    };
    // A maldição perde uma rodada a cada vez dos monstros (menos a vez em que foi lançada).
    const tickCurse = () => {
      if (!curse) return '';
      if (curse.novo) { curse.novo = false; return ''; }
      if (--curse.n > 0) return '';
      curse = null;
      return ' A maldição passou.';
    };
    const pen = () => curse ? curse.pen : 0;
    const penTxt = () => curse ? ` · −${curse.pen} por dado` : '';
    const heal = v => { const g = Math.min(P.hpMax - P.hp, v); P.hp += g; return g; };

    // Seu ataque com a arma no monstro `f`. `extra` = o segundo golpe (Golpe
    // duplo, Dança das lâminas) ou o Contra-ataque: esses não atacam de novo.
    const heroAttack = async (extra = '', fura = false, f = target()) => {
      const it = ITEMS[P.equip.arma], die = atkDie();
      const groups = [{ label: `${extra || 'Seu ataque'}${it ? ' · ' + it.nome : ''}${penTxt()}`, dice: expand([die]), color: C.RED, pen: pen() }];
      if (f.def) groups.push({ label: `Defesa: ${f.nome}`, dice: expand([f.def]), color: C.GRAY });
      let [a, d = 0] = await tray.roll(groups);
      const h = passiva('ataque', tray.faces(0), tray.sides(0)), ef = h ? h.efeito : '';
      if (ef === 'dado') a += 1 + rnd(die[1]);
      if (ef === 'perfura' || ef === 'danca' || fura) d = 0;
      const k = { x2: 2, x3: 3, x5: 5 }[ef] || 1, dmg = Math.max(0, a - d) * k;
      f.hp -= dmg;
      const conta = (d ? `${a} − ${d}` : `${a}`) + (k > 1 ? ` ×${k}` : '');
      tray.result(conta !== `${dmg}` ? `${conta} = ${dmg}` : `${dmg}`, h ? MAOS[h.mao].nome + '!' : dmg ? 'de dano!' : 'ele bloqueou!', dmg ? C.RED : C.GRAY);
      if (dmg) { f.view.hit(C.RED); SFX.hit(); }
      let txt = dmg ? `Você acerta ${f.nome}: ${dmg} de dano.` : `${f.nome} defendeu tudo.`;
      if (ef === 'vampiro') txt += ` Você recupera ${heal(Math.floor(dmg / 2))} de vida.`;
      if (ef === 'atordoa' && f.hp > 0) f.tonto = true;
      log((h ? comboTxt(h) + ' ' : '') + txt);
      bars();
      // O segundo golpe vai no mesmo monstro, ou no próximo se ele caiu.
      if ((ef === 'duplo' || ef === 'danca') && !extra && alive().length) {
        await wait(1100);
        await heroAttack('Segundo golpe', ef === 'danca');
      }
    };

    // Feitiço: ignora a defesa. As habilidades de feitiço olham os dados dele.
    const castSpell = async (sp, eco = false) => {
      const f = target();
      let [v] = await tray.roll([{ label: `${sp.nome}${eco ? ' de novo' : ''} (ignora defesa)`, dice: expand([sp.dado]), color: sp.cor }]);
      const h = passiva('magia', tray.faces(0), tray.sides(0)), ef = h ? h.efeito : '';
      if (ef === 'dado') v += 1 + rnd(sp.dado[1]);
      v *= { x2: 2, x3: 3, x5: 5 }[ef] || 1;
      let txt;
      if (sp.tipo === 'cura') {
        const g = heal(v);
        tray.result(`+${g}`, h ? MAOS[h.mao].nome + '!' : 'de vida', C.GREEN);
        txt = 'Uma luz verde fecha seus machucados.';
      } else {
        f.hp -= v;
        f.view.hit(sp.cor); SFX.hit();
        tray.result(`${v}`, h ? MAOS[h.mao].nome + '!' : 'de dano mágico!', sp.cor);
        txt = `${sp.nome} acerta ${f.nome} em cheio!`;
        if (ef === 'vampiro') txt += ` Você recupera ${heal(Math.floor(v / 2))} de vida.`;
      }
      if (ef === 'pm') P.pm = Math.min(P.pmMax, P.pm + sp.pm);
      if (ef === 'atordoa' && f.hp > 0) f.tonto = true;
      log((h ? comboTxt(h) + ' ' : '') + txt);
      bars();
      if (ef === 'eco' && !eco && alive().length) { await wait(1100); await castSpell(sp, true); }
    };

    // A vez de um monstro: perde a vez se está tonto, às vezes amaldiçoa,
    // senão ataca (e os brutos às vezes quebram um dado da sua defesa).
    const foeTurn = async f => {
      if (f.tonto) {
        f.tonto = false;
        tray.show('tonto!', `perdeu a vez`, C.GRAY);
        log(`${f.nome} está tonto e perde a vez!`);
        await wait(1100);
        return;
      }
      const esp = md.esp;
      if (esp && esp.tipo === 'maldicao' && !curse && Math.random() < MALDICAO_CHANCE) {
        curse = { nome: esp.nome, pen: esp.pen, n: esp.rodadas, novo: true };
        tray.show(esp.nome, `−${esp.pen} por dado`, C.PURPLE);
        SFX.tone(220, 0.5, 0.12, 'sawtooth');
        hurt();
        log(`${f.nome} lança <b>${esp.nome}</b>! Por ${esp.rodadas} rodadas, cada dado seu de ataque e de defesa vale ${esp.pen} a menos (feitiços e poções, não).`);
        status();
        await wait(1500);
        return;
      }
      const defs = defList().slice(broken);
      const groups = [{ label: `${f.nome} ataca`, dice: expand([f.atk]), color: C.PURPLE }];
      if (defs.length) groups.push({ label: `Sua defesa${broken ? ` · ${broken} quebrado${broken > 1 ? 's' : ''}` : ''}${penTxt()}`, dice: defs, color: C.BLUE, pen: pen() });
      const [a, d0 = 0] = await tray.roll(groups);
      const h = defs.length ? passiva('defesa', tray.faces(1), tray.sides(1)) : null, ef = h ? h.efeito : '';
      const d = d0 + (ef === 'dado' ? 1 + rnd(defs[0]) : 0);
      let dmg = Math.max(0, a - d), txt = '';
      if (ef === 'bloqueio' || ef === 'bencao') dmg = 0;
      if (ef === 'reflete') { f.hp -= a; dmg = 0; f.view.hit(C.BLUE); txt = ` O golpe volta: ${f.nome} toma ${a}.`; }
      if (ef === 'espinhos') { const e = Math.floor(d / 2); f.hp -= e; if (e) f.view.hit(C.BLUE); txt = ` ${f.nome} toma ${e} de volta.`; }
      P.hp -= dmg;
      if (ef === 'cura' && P.hp > 0) txt = ` Você recupera ${heal(Math.floor(d / 2))} de vida.`;
      if (ef === 'bencao') { P.hp = P.hpMax; txt = ' Sua vida enche toda.'; }
      if (ef === 'purifica') { curse = null; broken = 0; txt = ' A maldição some e os dados quebrados voltam.'; }
      tray.result(defs.length ? `${a} − ${d} = ${dmg}` : `${dmg}`, h ? MAOS[h.mao].nome + '!' : dmg ? 'de dano em você' : 'bloqueou tudo!', dmg ? C.PURPLE : C.BLUE);
      if (dmg) { SFX.hit(); hurt(); }
      // O bruto às vezes quebra o maior dado de defesa que ainda sobra.
      if (esp && esp.tipo === 'quebra' && defs.length && P.hp > 0 && Math.random() < QUEBRA_CHANCE) {
        broken++;
        txt += ` <b>${esp.nome}!</b> Um d${defs[0]} da sua defesa quebra até o fim da luta.`;
      }
      log((h ? comboTxt(h) : `${f.nome} ataca.`) + txt);
      bars(); status();
      await wait(650);
      if (ef === 'contra' && P.hp > 0 && f.hp > 0) { await wait(500); await heroAttack('Contra-ataque', false, f); }
    };
    // Todos os monstros vivos, um depois do outro; a maldição conta uma rodada no fim.
    const monstersTurn = async () => {
      for (const f of foes) {
        if (f.hp <= 0 || P.hp <= 0) continue;
        await foeTurn(f);
        if (!alive().length) break;
        if (n > 1) await wait(350);
      }
      const t = tickCurse();
      if (t) { $('clog').innerHTML += t; status(); }
    };

    if (opt.ambush) { log(n > 1 ? `Os ${md.pl} atacam primeiro!` : `${md.nome} ataca primeiro!`); await monstersTurn(); }
    // Fugir de um grupo é mais difícil: +1 no d20 por monstro a mais vivo.
    let first = !opt.ambush, result = null, rodada = 0;
    while (!result && P.hp > 0 && alive().length) {
      const dc = (kind === 'dragao' ? 15 : md.chefe ? 13 : first ? 8 : 11) + alive().length - 1;
      const hasPot = POTS.some(id => P.pocoes[id] > 0);
      const choice = await ask(acts, [
        { html: `${ic('sword', ITEMS[P.equip.arma]?.cor)} Atacar <small>${fmtD(atkDie())}</small>`, v: 'atk', cls: 'red' },
        { html: `${ic('scroll', C.PURPLE)} Feitiço`, v: 'spell', cls: 'purple', off: !P.magias.length },
        { html: `${ic('potion', C.RED)} Poção`, v: 'pot', cls: 'green', off: !hasPot },
        opt.treino ? { html: 'Desistir', v: 'flee' } : { html: `Fugir <small>d20 ≥ ${dc}</small>`, v: 'flee' },
      ]);
      let act = choice;
      if (choice === 'spell') {
        act = await ask(acts, P.magias.map(id => ({
          html: `${ic('scroll', SPELLS[id].cor)} ${SPELLS[id].nome} <small>${fmtD(SPELLS[id].dado)} · ${SPELLS[id].pm} PM</small>`,
          v: 's:' + id, cls: 'purple', off: P.pm < SPELLS[id].pm,
        })).concat([{ html: 'Voltar', v: 'back' }]));
      } else if (choice === 'pot') {
        act = await ask(acts, POTS.filter(id => P.pocoes[id] > 0).map(id => ({
          html: `${itemIc(id)} ${ITEMS[id].nome} ×${P.pocoes[id]} <small>${fmtD(ITEMS[id].dado)}</small>`, v: 'p:' + id, cls: 'green',
        })).concat([{ html: 'Voltar', v: 'back' }]));
      }
      if (act === 'back') continue;

      if (act === 'atk') await heroAttack();
      else if (act.startsWith('s:')) {
        const sp = SPELLS[act.slice(2)];
        P.pm -= sp.pm;
        await castSpell(sp);
      } else if (act.startsWith('p:')) {
        const id = act.slice(2), it = ITEMS[id];
        P.pocoes[id]--;
        const [v] = await tray.roll([{ label: it.nome, dice: expand([it.dado]), color: it.cor }]);
        if (it.efeito === 'hp') tray.result(`+${heal(v)}`, 'de vida', C.RED);
        else { const g = Math.min(P.pmMax - P.pm, v); P.pm += g; tray.result(`+${g}`, 'de magia', C.BLUE); }
        log('Glub glub glub.');
      } else if (act === 'flee' && opt.treino) {
        tray.show('desistiu', '', C.GRAY); result = 'fuga'; await wait(600); break;
      } else if (act === 'flee') {
        const [v] = await tray.roll([{ label: 'Fugir', dice: [20], color: C.INK }]);
        if (v >= dc) { tray.result(`${v}`, 'você fugiu!', C.GREEN); result = 'fuga'; await wait(600); break; }
        tray.result(`${v}`, 'não deu!', C.RED);
        log('Você tropeça na fuga...');
      }
      bars();
      first = false;
      if (!alive().length) break;
      await wait(700);
      // O lendário, na vez dele, às vezes foge da luta em vez de atacar.
      if (opt.foge && rodada++ > 0 && Math.random() < LENDA_FOGE) {
        tray.show('fugiu!', `com ${foes[0].hp} de vida`, C.OCHRE);
        log(`${md.nome} dá um pulo e foge correndo! O mestre apaga ${md.art === 'a' ? 'ela' : 'ele'} da folha.`);
        result = 'escapou';
        await wait(1200);
        break;
      }
      await monstersTurn();
    }
    // Os monstros também podem cair na vez deles (Revide, Espelho, Contra-ataque).
    if (!result) result = P.hp > 0 && !alive().length ? 'vitoria' : 'derrota';
    opt.left = foes[0].hp;
    // Duelo: ninguém desmaia, o herói fica com 1 de vida.
    if (opt.treino && result === 'derrota') { P.hp = 1; result = 'perdeu'; log(`${md.nome} encosta a espada no seu peito: "Treino é treino!" Você perdeu o duelo.`); bars(); }

    if (result === 'vitoria' && opt.treino) {
      log(`Você venceu o duelo! ${md.nome} ri e aperta a sua mão.`);
    } else if (result === 'vitoria') {
      G.kills += n;
      P.abates[kind] = (P.abates[kind] || 0) + n;
      log(n > 1 ? `Você venceu ${md.art === 'a' ? 'as' : 'os'} ${n === 2 ? (md.art === 'a' ? 'duas' : 'dois') : 'três'}! O mestre faz um X em cima.` : `Você venceu ${md.nome}! O mestre faz um X em cima.`);
      await wait(500);
      // Moedas e despojos rolam juntos na bandeja. Num grupo, as moedas de um
      // valem vezes o tamanho do grupo, e cada um deixa os seus despojos.
      const base = md.base || kind, part = PARTS[base];
      const groups = [{ label: n > 1 ? `Moedas (×${n})` : 'Moedas', dice: expand([md.ouro]), color: C.YELLOW }];
      if (part) groups.push({ label: cap(part[1]), dice: expand([md.chefe ? [2, 6] : [n, 3]]), color: C.BROWN });
      const [o1, np = 0] = await tray.roll(groups), ouro = o1 * n;
      P.ouro += ouro;
      if (np) P.partes[base] = (P.partes[base] || 0) + np;
      SFX.coin();
      tray.result(n > 1 ? `${o1} ×${n} = +${ouro}` : `+${ouro}`, 'moedas', C.OCHRE);
      const xp = Math.round(md.xp * n * (night ? 1.5 : 1)), ups = gainXp(xp);
      log(`+${ouro} moedas${np ? `, +${np} ${part[np > 1 ? 1 : 0]}` : ''}${xp ? `, +${xp} de experiência${night ? ' (noite)' : ''}` : ''}.${ups ? ` <b class="up">Subiu para o nível ${P.lvl}!</b> Vida e magia cheias, +${ups} ponto${ups > 1 ? 's' : ''} de habilidade (aprenda numa fogueira).` : ''}`);
      bars();
    } else if (result === 'derrota') {
      log('Você desmaiou... O mestre vira a página.');
    }
    await ask(acts, [{ html: 'Continuar', v: 1, cls: 'green' }]);
    closePanel();
    if (result === 'derrota') faint();
    else questPing();
    hud(); save();
    return result;
  }

  function gainXp(xp) {
    P.xp += xp;
    let ups = 0;
    while (P.xp >= xpNext(P.lvl)) {
      P.xp -= xpNext(P.lvl); P.lvl++; ups++;
      P.hpMax += 6; P.pmMax += 1; P.hp = P.hpMax; P.pm = P.pmMax;
    }
    if (ups) SFX.lvl();
    return ups;
  }

  // Desmaiou: acorda na última fogueira (que pode ser de outra página).
  function faint() {
    const lost = Math.floor(P.ouro / 2);
    P.ouro -= lost; P.hp = P.hpMax; P.pm = P.pmMax;
    P.onde = null;
    setPage(P.rpg);
    P.x = P.respawn % W.W; P.y = (P.respawn / W.W) | 0;
    respawnMonsters();
    setMap(null);
    snapCam();
    narrate(`Você acorda no ${Wd.FOGUEIRAS[W.obj.get(P.respawn).n]}, todo enfaixado. Perdeu ${lost} moedas, e os monstros voltaram.`);
    hud(); save();
  }

  // Monstro desenhado no mapa: sozinho ou em grupo (o "×2" / "×3" do desenho).
  async function meetMonster(i, o) {
    const m = MONSTERS[o.kind], n = o.n || 1, quantos = n === 2 ? (m.art === 'a' ? 'duas' : 'dois') : 'três';
    const v = await dialog(n > 1 ? `${cap(quantos)} ${m.pl}!` : `${cap(um(m))} ${m.nome}!`,
      `<p>${n > 1 ? `O mestre desenhou ${quantos} ${m.pl} ${m.art === 'a' ? 'juntas' : 'juntos'} e escreveu "×${n}" em cima. Vão atacar você ${m.art === 'a' ? 'as' : 'os'} ${quantos}, ${m.art === 'a' ? 'uma depois da outra' : 'um depois do outro'}.`
        : `O mestre desenhou ${um(m)} ${m.nome} bem no caminho.`}</p>
       <p>${n > 1 ? 'Cada um: ' : ''}${ic('heart')} ${m.hp} de vida · ${ic('sword')} ataque ${fmtD(atkOf(m))}${nightBonus() ? ' (noite)' : ''} · ${ic('shield')} defesa ${fmtD(m.def)}</p>
       ${espTxt(m)}
       <p class="small">Seu ataque: ${fmtD(atkDie())} · sua defesa: ${defDice().map(fmtD).join(' + ') || 'nenhuma'}</p>`,
      [{ html: 'Enfrentar', v: 'luta', cls: 'red' }, { html: 'Deixar pra lá', v: 'nao' }], A.monsterURL(o.kind, 160));
    if (v !== 'luta') return;
    const r = await combat(o.kind, { n });
    if (r === 'vitoria') { L.dead.add(i); animate(A.cross(i % M.W, (i / M.W) | 0, T, i)); save(); }
  }

  // O chefe no fundo da masmorra. Vencer marca a masmorra com X na página e
  // abre o baú do tesouro atrás do trono.
  async function meetBoss(i, o) {
    const id = 'chefe_' + o.kind, m = MONSTERS[id];
    const v = await dialog(`${m.nome}!`,
      `<p>No fundo da masmorra, num trono rabiscado com caneta dourada, está ${oa(m)} <b>${m.nome}</b>.</p>
       <p>${ic('heart')} ${m.hp} de vida · ${ic('sword')} ataque ${fmtD(m.atk)} · ${ic('shield')} defesa ${fmtD(m.def)}</p>
       ${espTxt(m)}
       <p class="small">Seu ataque: ${fmtD(atkDie())} · sua defesa: ${defDice().map(fmtD).join(' + ') || 'nenhuma'} · fugir de um chefe: d20 ≥ 13.</p>`,
      [{ html: 'Enfrentar', v: 'luta', cls: 'red' }, { html: 'Agora não', v: 'nao' }], A.monsterURL(id, 160));
    if (v !== 'luta') return;
    const r = await combat(id, { text: `${m.nome} se levanta do trono. O mestre pinta a coroa de amarelo bem forte.` });
    if (r !== 'vitoria') return;
    L.dead.add(i);
    here().cleared.add(M.masmorra);
    animate(A.cross(i % M.W, (i / M.W) | 0, T, i));
    const it = loot(M.tier[i]);
    P.bolsa.push(it);
    save();
    await dialog('Tesouro do chefe!', `<p>Atrás do trono tinha um baú. Dentro: ${itemIc(it)} <b>${ITEMS[it].nome}</b> (${fmtD(ITEMS[it].dado)})! Está na mochila.</p>
      <p class="small">Volte pela escada para sair. Lá em cima, o mestre risca a entrada desta masmorra.</p>`,
      [{ html: 'Oba!', v: 1, cls: 'green' }], A.iconURL('chest', '', 160));
    hud(); save();
  }
  // Equipamento da loja da página seguinte (nunca a Lâmina do Dragão).
  function loot(tier) {
    const lvl = Math.min(5, Math.ceil(tier / 3) + 1);
    return pick(Object.keys(ITEMS).filter(id => ITEMS[id].loja === lvl && ITEMS[id].slot !== 'pocao' && id !== 'lamina_dragao'));
  }

  async function enterDungeon(i, o) {
    const id = 'chefe_' + o.kind, m = MONSTERS[id], done = here().cleared.has(o.n);
    const v = await dialog(Wd.nomeMasmorra(o.kind),
      `<p>${done ? `Você já derrotou ${oa(m)} ${m.nome}. Lá embaixo ainda tem o que ficou para trás.`
        : `Uma escada desce para o escuro. Lá no fundo mora ${oa(m)} <b>${m.nome}</b>.`}</p>
       <p>${ic('heart')} ${m.hp} · ${ic('sword')} ${fmtD(m.atk)} · ${ic('shield')} ${fmtD(m.def)}</p>
       ${espTxt(m)}
       <p class="small">Lá dentro é sempre escuro: leve tochas. Você tem ${P.tochas}${P.tocha > 0 ? ' e uma acesa' : ''}.</p>`,
      [{ html: 'Descer', v: 'sim', cls: 'red' }, { html: 'Agora não', v: 'nao' }], A.monsterURL(id, 160));
    if (v !== 'sim') return;
    P.ox = P.x; P.oy = P.y;
    setMap(o.n);
    P.x = M.start % M.W; P.y = (M.start / M.W) | 0;
    snapCam();
    burnTorch(false);
    reveal(P.x, P.y);
    narrate(P.tocha > 0 ? 'O mestre vira a página e desenha a escada descendo. Sua tocha ilumina as paredes.'
      : 'O mestre vira a página... está tudo escuro. Sem tocha, você só vê o que está do seu lado.');
    hud(); save();
  }
  async function leaveDungeon() {
    const B = Wd.BIOMAS[P.pg];
    const v = await dialog('Escada', `<p>Subir de volta para ${B.art} ${B.nome}?</p>`,
      [{ html: 'Subir', v: 'sim', cls: 'green' }, { html: 'Ficar aqui', v: 'nao' }], A.iconURL('map', '', 160));
    if (v !== 'sim') return;
    setMap(null);
    P.x = P.ox; P.y = P.oy;
    snapCam();
    narrate('O mestre volta para a página de cima.');
    hud(); save();
  }

  // Virar a página (passagem no fim da página) ou voltar uma (seta ao lado
  // da primeira fogueira). Indo para a frente, o herói chega na primeira
  // fogueira da página nova, que já vira o lugar onde ele acorda.
  async function turnPage(o) {
    const fwd = o.to > P.pg, B = Wd.BIOMAS[o.to], first = !G.seen.has('p' + o.to);
    const v = await dialog(fwd ? 'Virar a página' : 'Voltar uma página',
      `<p>${fwd ? `A trilha chega no canto dobrado da folha. Do outro lado, o mestre já rabiscou o começo de outra página: <b>${B.nome}</b>.`
        : `A seta leva de volta para a página anterior: <b>${B.nome}</b>.`}</p>
       ${fwd && first ? `<p class="small">${BIOME_TEXT[o.to].aviso}</p>` : ''}`,
      [{ html: fwd ? 'Virar a página' : 'Voltar', v: 'sim', cls: fwd ? 'red' : 'green' }, { html: 'Ficar aqui', v: 'nao' }],
      A.iconURL('map', '', 160));
    if (v !== 'sim') return;
    goPage(o.to);
  }
  // Leva o herói para outra página: para a frente, na primeira fogueira dela
  // (que vira o lugar onde ele acorda); para trás, no fim dela.
  function goPage(to, txt = '') {
    const fwd = to > P.pg, B = Wd.BIOMAS[to], first = !G.seen.has('p' + to), o = { to };
    setPage(o.to);
    setMap(null);
    const dest = fwd ? W.start : W.lair;
    P.x = dest % W.W; P.y = (dest / W.W) | 0;
    if (fwd) {
      P.respawn = W.start; P.rpg = P.pg;
      G.seen.add('v' + W.obj.get(W.start).n);
    }
    snapCam();
    reveal(P.x, P.y);
    G.seen.add('p' + o.to);
    narrate(txt + (first && BIOME_TEXT[o.to].chegada ? BIOME_TEXT[o.to].chegada
      : fwd ? `O mestre vira a página: ${B.nome}. Você chega no ${Wd.FOGUEIRAS[W.obj.get(W.start).n]}.`
      : `O mestre volta uma página: ${B.nome}.`));
    hud(); save(); cloudSave();
  }

  // O guardião em cima do canto dobrado: para virar a página, é preciso
  // vencê-lo... ou ter dado a volta por trás (o atalho de uma masmorra), e aí
  // dá para passar sem lutar. Vencido, não volta mais.
  async function guardian(i, o) {
    const id = 'guarda_' + P.pg, m = MONSTERS[id], B = Wd.BIOMAS[o.to], passed = G.seen.has('p' + o.to);
    const btns = [{ html: 'Enfrentar', v: 'luta', cls: 'red' }];
    if (passed) btns.push({ html: 'Passar por trás dele', v: 'passa', cls: 'green' });
    btns.push({ html: 'Agora não', v: 'nao' });
    const v = await dialog(`${m.nome}!`,
      `<p>Em cima do canto dobrado da folha, ${oa(m)} <b>${m.nome}</b> guarda a passagem para ${B.art} ${B.nome}.</p>
       <p>${ic('heart')} ${m.hp} de vida · ${ic('sword')} ataque ${fmtD(m.atk)} · ${ic('shield')} defesa ${fmtD(m.def)}</p>
       ${espTxt(m)}
       <p class="small">${passed ? 'Você já conhece o caminho por trás dele: dá para virar a página sem lutar. Vencer dá um equipamento.'
         : 'Para virar a página, só vencendo. Ou... dizem que uma masmorra aqui perto tem uma escada que sai atrás dele.'} Fugir: d20 ≥ 13.</p>`,
      btns, A.monsterURL(id, 160));
    if (v === 'passa') { goPage(o.to); return; }
    if (v !== 'luta') return;
    const r = await combat(id, { text: `${m.nome} levanta do canto da folha. O mestre aperta a caneta.` });
    if (r !== 'vitoria') return;
    here().guarda = true;
    rebakeAll();
    const it = loot(P.pg * 3 + 3);
    P.bolsa.push(it);
    save();
    await dialog('Passagem livre!', `<p>${m.nome} cai e o mestre apaga ele do canto da folha. Ele deixou ${itemIc(it)} <b>${ITEMS[it].nome}</b> (${fmtD(ITEMS[it].dado)})! Está na mochila.</p>
      <p class="small">Agora é só pisar no canto dobrado para virar a página.</p>`, [{ html: 'Oba!', v: 1, cls: 'green' }], A.iconURL('chest', '', 160));
    hud(); save();
  }
  // A segunda escada da masmorra do atalho: sai atrás do guardião e vira a página.
  async function shortcut(o) {
    const B = Wd.BIOMAS[o.to], g = MONSTERS['guarda_' + P.pg];
    const v = await dialog('Escada escondida',
      `<p>Atrás de umas pedras soltas, uma escada estreita sobe. Lá em cima dá para ver o canto dobrado da folha... por trás ${g.art === 'a' ? 'da' : 'do'} <b>${g.nome}</b>, que nem percebe.</p>
       <p>Do outro lado: <b>${B.nome}</b>.</p>`,
      [{ html: 'Subir e virar a página', v: 'sim', cls: 'red' }, { html: 'Ficar aqui', v: 'nao' }], A.iconURL('map', '', 160));
    if (v !== 'sim') return;
    goPage(o.to, here().guarda ? '' : `Você passou por trás ${g.art === 'a' ? 'da' : 'do'} ${g.nome} sem ele perceber! `);
  }

  async function ambush(tier) {
    // Metade das vezes, vem o monstro que uma missão ativa desta região pede.
    // Um quarto das vezes vem um da região de antes, mas só da mesma página.
    const first = P.pg * 3 + 1;
    const pool = Wd.POOLS[Math.max(first, Math.random() < 0.25 ? tier - 1 : tier)];
    const want = P.missoes.filter(q => q.tipo !== 'chefe' && TIER_OF[q.kind] === tier && progress(q) < q.n).map(q => q.kind);
    const kind = want.length && Math.random() < 0.5 ? pick(want) : pick(pool), m = MONSTERS[kind];
    const v = await dialog('Surpresa!', `<p>${um(m)[0].toUpperCase() + um(m).slice(1)} ${m.nome} pula do meio do mato!</p>
      <p>${ic('heart')} ${m.hp} · ${ic('sword')} ${fmtD(atkOf(m))}${nightBonus() ? ' (noite)' : ''} · ${ic('shield')} ${fmtD(m.def)}</p>
      ${espTxt(m)}
      <p class="small">Fugir agora: role 1d20 e tire 8 ou mais. Se falhar, ele ataca primeiro.</p>`,
      [{ html: 'Enfrentar', v: 'luta', cls: 'red' }, { html: 'Tentar fugir (d20)', v: 'fuga' }], A.monsterURL(kind, 160));
    if (v === 'luta') { await combat(kind); return; }
    openPanel(`<h2>Fugir!</h2><canvas id="tray" class="tray mini"></canvas><p id="clog"></p><div class="actions" id="acts"></div>`, 'dialog');
    const tray = new Tray($('tray'));
    const [d] = await tray.roll([{ label: 'Fugir', dice: [20], color: C.INK }]);
    if (d >= 8) {
      tray.result(`${d}`, 'escapou!', C.GREEN);
      $('clog').textContent = `Você some no mato antes que ${m.nome} perceba.`;
      await ask($('acts'), [{ html: 'Ufa!', v: 1, cls: 'green' }]);
      closePanel();
      return;
    }
    tray.result(`${d}`, 'não deu!', C.RED);
    await wait(900);
    await combat(kind, { ambush: true });
  }

  async function lair(i) {
    const v = await dialog('Covil do Dragão',
      `<p>Um buraco escuro, ossos na entrada e cheiro de fumaça. Lá dentro, algo enorme respira.</p>
       <p>${ic('heart')} ${MONSTERS.dragao.hp} · ${ic('sword')} ${fmtD(MONSTERS.dragao.atk)} · ${ic('shield')} ${fmtD(MONSTERS.dragao.def)}</p>
       ${espTxt(MONSTERS.dragao)}
       <p class="small">Daqui não dá pra fugir fácil: d20 ≥ 15.</p>`,
      [{ html: 'Entrar', v: 'luta', cls: 'red' }, { html: 'Agora não', v: 'nao' }], A.monsterURL('dragao', 160));
    if (v !== 'luta') return;
    const r = await combat('dragao', { text: 'O Dragão Vermelho abre as asas. O mestre troca para a caneta vermelha.' });
    if (r !== 'vitoria') return;
    here().won = true;
    animate(A.cross(i % W.W, (i / W.W) | 0, T, i));
    save();
    const e = await dialog('FIM!', `<p>${esc(P.nome)} derrotou o Dragão Vermelho! O mestre escreve "FIM" bem grande e desenha uma coroa.</p>
      <p>${G.steps} passos · ${G.kills} monstros vencidos · nível ${P.lvl} · ${P.ouro} moedas</p>`,
      [{ html: 'Continuar explorando', v: 'cont', cls: 'green' }, { html: 'Nova aventura', v: 'novo' }], A.iconURL('star', C.YELLOW, 160));
    if (e === 'novo') title();
  }

  // ---------- atacar gente ----------
  const ATACAR = { html: 'Atacar', v: 'atacar' };
  // Pergunta antes (quem morre não volta) e luta de verdade. Devolve o
  // resultado da luta, ou 'nao' se o herói desistiu.
  async function attackPerson(kind, perde) {
    const m = MONSTERS[kind];
    const v = await dialog(`Atacar ${m.nome}?`,
      `<p>Quem morre não volta mais: ${perde}.</p>
       <p>${ic('heart')} ${m.hp} de vida · ${ic('sword')} ataque ${fmtD(atkOf(m))}${nightBonus() ? ' (noite)' : ''} · ${ic('shield')} defesa ${fmtD(m.def)}</p>
       <p class="small">Seu ataque: ${fmtD(atkDie())} · sua defesa: ${defDice().map(fmtD).join(' + ') || 'nenhuma'}. É luta de verdade: perder é desmaiar.</p>`,
      [{ html: 'Atacar', v: 'luta', cls: 'red' }, { html: 'Melhor não', v: 'nao' }], A.monsterURL(kind, 160));
    if (v !== 'luta') return 'nao';
    return combat(kind, { text: `${m.nome} dá um pulo para trás: "Que é isso?!" O mestre arregala os olhos e desenha a luta.` });
  }
  // Personagem do caminho (missão ou dica). Morto, fica riscado no mapa e
  // as missões que deu somem da margem do caderno.
  async function attackNpc(i, o) {
    const pg = P.pg, art = o.quest && /^(Dona|Vó)/.test(o.nome) ? 'a' : 'o';
    const cols = [C.BLUE, C.GREEN, C.PURPLE, C.ORANGE, C.PINK], ele = art === 'a' ? 'dela' : 'dele';
    const kind = gente(`p${pg}_${i}`, o.quest ? 'missao' : 'dica', W.tier[i], o.quest ? o.nome : 'Andarilho', art,
      S.hash(pg, i, 41), cols[(o.quest ? o.tier : o.fala) % cols.length]);
    const r = await attackPerson(kind, o.quest ? `as missões ${ele} acabam` : `as dicas ${ele} acabam`);
    if (r !== 'vitoria') return;
    here().mortos.add(i);
    animate(A.cross(i % M.W, (i / M.W) | 0, T, i));
    const tinha = P.missoes.some(q => q.pg === pg && q.npc === i);
    P.missoes = P.missoes.filter(q => !(q.pg === pg && q.npc === i));
    if (tinha) narrate(`O mestre risca da margem a missão de ${o.nome}. Não tem mais para quem entregar.`);
    hud(); save();
  }
  // Alguém da fogueira n. Morto, a parte dele some desta fogueira.
  const PERDE = {
    ferreiro: 'ninguém mais vende arma, escudo e armadura nesta fogueira',
    maga: 'ninguém mais ensina feitiço nesta fogueira',
    mercador: 'ninguém mais vende poção e tocha nem compra nada nesta fogueira',
    veterana: n => `ninguém mais ensina ${HABILIDADES[n].nome}`,
    duelista: 'acabam os duelos nesta fogueira',
  };
  const perdeDe = (n, papel) => typeof PERDE[papel] === 'function' ? PERDE[papel](n) : PERDE[papel];
  const mortoNaFogueira = (n, papel) => (G.gente[n] || []).includes(papel);
  async function attackCamp(n, papel) {
    const [nome, art] = papel === 'duelista' ? DUELISTAS[n]
      : { ferreiro: ['Ferreiro andarilho', 'o'], maga: ['Maga', 'a'], mercador: ['Mercador', 'o'], veterana: ['Veterana da fogueira', 'a'] }[papel];
    const kind = gente(`f${n}_${papel}`, papel, duelTier(n), nome, art, S.hash(n, 29), papel === 'maga' ? C.PURPLE : C.OCHRE);
    const r = await attackPerson(kind, perdeDe(n, papel));
    if (r === 'vitoria') { G.gente[n] = [...(G.gente[n] || []), papel]; save(); }
    return r;
  }

  async function talk(i, o) {
    if (o.quest) { await questGiver(i, o); return; }
    let extra = '';
    if (o.presente && !here().talked.has(i)) {
      if (o.fala % 2) { P.pocoes.pocao_vida++; extra = `<p><b>Ganhou uma Poção de vida!</b></p>`; }
      else { const g = 10 * W.tier[i]; P.ouro += g; extra = `<p><b>Ganhou ${g} moedas!</b></p>`; SFX.coin(); }
    }
    here().talked.add(i);
    const key = dunKey(P.pg, i), n = G.conversa[key] || 0;
    G.conversa[key] = n + 1;
    // A 4ª pessoa de dica da página fala do lendário na primeira conversa; da
    // segunda em diante, as dicas de sempre.
    const lenda = !n && o.fala % 4 === 3 && !here().lenda.dead;
    const line = lenda ? LENDA_DICA[P.pg] : NPC_LINES[(o.fala + n * DICAS) % NPC_LINES.length];
    const v = await dialog('Alguém no caminho', `<p>"${line}"</p>${extra}`, [{ html: 'Valeu!', v: 1 }, ATACAR]);
    save();
    if (v === 'atacar') await attackNpc(i, o);
  }

  // Quem tem "!" no balão: oferece a próxima missão, mostra quanto falta ou
  // recebe a missão pronta e paga (a do chefe também dá um equipamento).
  async function questGiver(i, o) {
    const key = dunKey(P.pg, i), list = questsOf(i, o), stage = P.etapa[key] || 0;
    const cur = P.missoes.find(q => q.pg === P.pg && q.npc === i);
    if (cur) {
      const pr = Math.min(cur.n, progress(cur));
      if (pr < cur.n) {
        const v = await dialog(o.nome, `<p>"E aí, ${esc(P.nome)}? Ainda faltam ${cur.n - pr}."</p><p><b>Missão:</b> ${questText(cur)} · ${pr}/${cur.n}</p>`,
          [{ html: 'Já volto', v: 1 }, ATACAR]);
        if (v === 'atacar') await attackNpc(i, o);
        return;
      }
      if (cur.tipo === 'coletar') P.partes[cur.kind] -= cur.n;
      const [ouro, xp] = questReward(o.tier, cur.k);
      P.ouro += ouro; SFX.coin();
      const ups = gainXp(xp);
      let prize = '';
      if (cur.tipo === 'chefe') { const it = loot(o.tier + 1); P.bolsa.push(it); prize = `<p>${itemIc(it)} E ainda ganhou <b>${ITEMS[it].nome}</b> (${fmtD(ITEMS[it].dado)})! Está na mochila.</p>`; }
      P.missoes = P.missoes.filter(q => q !== cur);
      P.etapa[key] = stage + 1;
      hud(); save();
      await dialog(o.nome, `<p>"Você conseguiu! Muito obrigado, ${esc(P.nome)}!"</p><p><b>+${ouro} moedas, +${xp} de experiência.</b>${ups ? ` <b class="up">Subiu para o nível ${P.lvl}!</b> +${ups} ponto${ups > 1 ? 's' : ''} de habilidade.` : ''}</p>${prize}`,
        [{ html: 'De nada!', v: 1, cls: 'green' }], A.iconURL('coin', '', 160));
      return;
    }
    if (stage >= list.length) {
      const v = await dialog(o.nome, `<p>"Graças a você a região está mais tranquila. O mestre devia desenhar uma estátua sua aqui!"</p>`, [{ html: 'Tchau!', v: 1 }, ATACAR]);
      if (v === 'atacar') await attackNpc(i, o);
      return;
    }
    const q = list[stage], [ouro, xp] = questReward(o.tier, stage), mm = MONSTERS[q.kind];
    const ask2 = q.tipo === 'matar' ? `Os ${mm.pl} não me deixam em paz! Derrota ${q.n} deles pra mim?`
      : q.tipo === 'coletar' ? `Preciso de ${q.n} ${PARTS[q.kind][1]} pra uma receita da minha avó. Consegue?`
      : `Quem manda nesses bichos é ${oa(MONSTERS['chefe_' + q.kind])} ${MONSTERS['chefe_' + q.kind].nome}, lá no fundo da masmorra (${Wd.nomeMasmorra(q.kind)}). Dá um jeito nisso?`;
    const v = await dialog(`${o.nome} pede ajuda`,
      `<p>"${ask2}"</p><p><b>Missão:</b> ${questText(q)}</p>
       <p class="small">Recompensa: ${ouro} moedas e ${xp} de experiência${q.tipo === 'chefe' ? ', mais um equipamento' : ''}.${q.tipo === 'coletar' ? ` Cada ${MONSTERS[q.kind].nome} vencido deixa 1d3 ${PARTS[q.kind][1]}.` : ''}</p>`,
      [{ html: 'Aceitar', v: 'sim', cls: 'green' }, { html: 'Agora não', v: 'nao' }, ATACAR],
      A.monsterURL(q.tipo === 'chefe' ? 'chefe_' + q.kind : q.kind, 160));
    if (v === 'atacar') await attackNpc(i, o);
    if (v !== 'sim') return;
    P.missoes.push({ pg: P.pg, npc: i, k: stage, ...q, base: P.abates[q.kind] || 0 });
    narrate(`Missão anotada na margem do caderno: ${questText(q)}.`);
    questPing();
    hud(); save();
  }

  async function chest(i, o) {
    openPanel(`<h2>Um baú!</h2><p>O mestre desenha um baú. Role a sorte para ver o que tem dentro.</p>
      <canvas id="tray" class="tray mini"></canvas><p id="clog"></p><div class="actions" id="acts"></div>`, 'dialog');
    const tray = new Tray($('tray'));
    const [luck] = await tray.roll([{ label: 'Sorte', dice: [20], color: C.INK }]);
    let msg;
    if (luck <= 13) {
      await wait(500);
      const [g] = await tray.roll([{ label: 'Moedas', dice: Array(o.tier + 1).fill(8), color: C.YELLOW }]);
      P.ouro += g; SFX.coin();
      tray.result(`+${g}`, 'moedas', C.OCHRE);
      msg = `${g} moedas brilhando lá dentro!`;
    } else if (luck <= 18) {
      const id = luck % 2 ? 'pocao_vida' : 'pocao_mana';
      P.pocoes[id]++;
      tray.result(`${luck}`, ITEMS[id].nome, ITEMS[id].cor);
      msg = `${itemIc(id)} Uma ${ITEMS[id].nome}!`;
    } else {
      const id = loot(o.tier);
      P.bolsa.push(id);
      tray.result(`${luck}!`, 'tesouro!', C.RED);
      msg = `${itemIc(id)} <b>${ITEMS[id].nome}</b> (${fmtD(ITEMS[id].dado)})! Está na mochila.`;
    }
    $('clog').innerHTML = msg;
    L.opened.add(i);
    animate(A.cross(i % M.W, (i / M.W) | 0, T, i + 1));
    await ask($('acts'), [{ html: 'Fechar o baú', v: 1, cls: 'green' }]);
    closePanel(); save();
  }

  // ---------- fogueira: descansar e comprar dos guerreiros ----------
  // Nível da loja de uma fogueira: a página dela (1 nos Campos ... 5 no Vulcão).
  // Só as poções seguem o nível; arma, defesa e feitiço vêm de LOJAS.
  const campLevel = i => Wd.pageOf(W.tier[i]) + 1;
  // O que o ferreiro e a maga de cada fogueira vendem (proposta). Cada
  // fogueira tem a sua lista, e na mesma página as do fundo vendem coisa
  // melhor (as 5 ficam nas regiões 1, 1, 2, 2 e 3 dela): a melhor arma da
  // página só aparece na última fogueira antes do guardião.
  const LOJAS = [
    // Campos
    ['espada_madeira', 'tampa_panela', 'roupa_couro', 'faisca'],
    ['espada_curta', 'tampa_panela', 'roupa_couro', 'cura'],
    ['espada_curta', 'escudo_madeira', 'faisca'],
    ['escudo_madeira', 'roupa_couro', 'cura'],
    ['espada_ferro', 'escudo_madeira', 'roupa_couro', 'faisca', 'cura'],
    // Deserto
    ['espada_ferro', 'escudo_madeira', 'cota_malha', 'bola_fogo'],
    ['machado', 'escudo_ferro', 'cota_malha', 'cura'],
    ['machado', 'escudo_ferro', 'cota_malha', 'bola_fogo'],
    ['espada_prata', 'escudo_ferro', 'placas'],
    ['espada_prata', 'escudo_ferro', 'placas', 'bola_fogo', 'cura'],
    // Montanhas Geladas
    ['espada_prata', 'escudo_ferro', 'placas', 'raio'],
    ['montante', 'escudo_torre', 'placas', 'cura_maior'],
    ['montante', 'escudo_torre', 'armadura_gelo', 'raio'],
    ['espada_runica', 'escudo_torre', 'armadura_gelo'],
    ['espada_runica', 'escudo_torre', 'armadura_gelo', 'raio', 'cura_maior'],
    // Pântano Sombrio
    ['espada_runica', 'escudo_torre', 'armadura_gelo', 'nevasca'],
    ['espada_cristal', 'escudo_torre', 'armadura_gelo', 'cura_maior'],
    ['espada_cristal', 'escudo_runico', 'armadura_gelo', 'nevasca'],
    ['espada_cristal', 'escudo_runico', 'armadura_runica'],
    ['espada_cristal', 'escudo_runico', 'armadura_runica', 'nevasca', 'cura_maior'],
    // Vulcão
    ['espada_cristal', 'escudo_runico', 'armadura_runica', 'meteoro'],
    ['espada_cristal', 'escudo_dragao', 'armadura_runica', 'cura_maior'],
    ['lamina_dragao', 'escudo_dragao', 'armadura_runica', 'meteoro'],
    ['lamina_dragao', 'escudo_dragao', 'armadura_dragao'],
    ['lamina_dragao', 'escudo_dragao', 'armadura_dragao', 'meteoro', 'cura_maior', 'nevasca'],
  ];
  function camp(i, o) {
    const first = !G.seen.has('v' + o.n);
    G.seen.add('v' + o.n);
    P.respawn = i; P.rpg = P.pg;
    if (first) narrate(`Você chega no ${Wd.FOGUEIRAS[o.n]} e se aquece na fogueira. Se desmaiar, acorda aqui.`);
    save(); cloudSave();
    renderCamp(i, o.n);
  }
  // Descansar: vida e magia cheias, passa a noite se for tarde, e todo monstro
  // vencido volta (menos chefes e o dragão), como num souls-like.
  function rest() {
    P.hp = P.hpMax; P.pm = P.pmMax;
    const late = G.clock >= 60;
    if (late) { G.day++; G.clock = 5; }
    respawnMonsters();
    save(); cloudSave();
    SFX.lvl();
    narrate(late ? `Você dorme perto do fogo e acorda de manhã. Dia ${G.day}. O mestre apaga os X dos monstros com a borracha: eles voltaram.`
      : 'Você descansa perto do fogo. O mestre apaga os X dos monstros com a borracha: eles voltaram.');
  }
  // Tira os monstros vencidos de todas as páginas e masmorras (chefes ficam
  // vencidos) e redesenha o mapa atual sem os X.
  function respawnMonsters() {
    for (const l of G.pg) l.dead.clear();
    for (const k in G.dun) {
      const [pg, n, andar = 0] = k.split(':').map(Number), m = dunMap(n, pg, andar);
      for (const i of [...G.dun[k].dead]) if (m.obj.get(i).type !== 'chefe') G.dun[k].dead.delete(i);
    }
    if (M) rebakeAll();
  }
  // Duelo de treino com o guerreiro da fogueira n. A primeira vitória paga
  // moedas e experiência como a primeira missão da região; as revanches são
  // só treino (pagavam um quarto, e dava para tirar moeda sem fim, sem risco).
  const duelPrize = n => [QUEST_OURO[duelTier(n) - 1], QUEST_XP[duelTier(n) - 1]];
  async function duel(n) {
    const dm = MONSTERS['duelo_' + n], wins = G.duelos[n] || 0;
    const r = await combat('duelo_' + n, { treino: true, text: `${dm.nome} levanta da fogueira e pega ${dm.art === 'a' ? 'a espada dela' : 'a espada dele'}: "Vamos ver do que você é capaz!"` });
    if (r !== 'vitoria') return;
    G.duelos[n] = wins + 1;
    if (wins) { narrate('Duelo vencido! Revanche é só treino: sem prêmio.'); hud(); save(); return; }
    const [ouro, xp] = duelPrize(n);
    P.ouro += ouro; SFX.coin();
    const ups = gainXp(xp);
    narrate(`Duelo vencido! +${ouro} moedas, +${xp} de experiência.${ups ? ` Subiu para o nível ${P.lvl}!` : ''}`);
    hud(); save();
  }
  function owned(id) { return P.bolsa.includes(id) || Object.values(P.equip).includes(id); }
  function renderCamp(i, n) {
    const coin = ic('coin'), lvl = campLevel(i), late = G.clock >= 60;
    const hb = HABILIDADES[n], learned = P.habs.includes(n), pts = pontos();
    const gear = LOJAS[n].filter(id => ITEMS[id]);
    const pots = POTS.filter(id => ITEMS[id].loja <= lvl);
    const spells = LOJAS[n].filter(id => SPELLS[id]);
    const slotName = { arma: 'arma', escudo: 'escudo', armadura: 'armadura' };
    const row = (icon, name, info, price, act, off, note = '') =>
      `<div class="row">${icon}<span class="nm">${name} <small>${info}</small>${note ? `<em>${note}</em>` : ''}</span>
       <span class="pr">${price != null ? price + coin : ''}</span><button data-act="${act}" ${off ? 'disabled' : ''}>${act.startsWith('sell') ? 'Vender' : 'Comprar'}</button></div>`;
    const partsNeeded = k => P.missoes.filter(q => q.tipo === 'coletar' && q.kind === k).reduce((a, q) => a + q.n, 0);
    // Cada um da fogueira: o título com o botão de atacar; morto, o título
    // riscado e o que se perdeu.
    const quem = (titulo, papel, corpo) => mortoNaFogueira(n, papel)
      ? `<h3><s>${titulo}</s></h3><p class="small">O mestre riscou do caderno: ${perdeDe(n, papel)}.</p>`
      : `<h3>${titulo} <button data-act="kill:${papel}" class="atk">Atacar</button></h3>${corpo}`;
    openPanel(`
      <h2>${Wd.FOGUEIRAS[n]}</h2>
      <p>${CAMP_TEXT[n % CAMP_TEXT.length]} Você tem ${P.ouro}${coin}</p>
      <div class="row">${ic('fire')}<span class="nm">Descansar na fogueira <small>vida e magia cheias${late ? ', dorme até de manhã' : ''}</small><em>os monstros vencidos voltam (chefes e dragão, não)</em></span>
        <button data-act="rest" class="red">${late ? 'Dormir' : 'Descansar'}</button></div>
      ${quem('Veterana da fogueira', 'veterana', `
      <p class="small">Cada fogueira ensina uma habilidade só, e cada nível que você sobe dá um ponto para aprender. Você guarda todas, mas só ${HABS_MAX} ficam equipadas (troque na mochila). Você tem ${pts} ponto${pts === 1 ? '' : 's'}.</p>
      <div class="row">${ic('star', C.YELLOW)}<span class="nm">${hb.nome} <small>${MAOS[hb.mao].nome} nos dados ${GRUPO[hb.grupo]}: ${hb.txt}</small><em>${learned ? 'você já sabe' : `${MAOS[hb.mao].nome} = ${MAOS[hb.mao].txt}`}</em></span>
        <button data-act="learn" ${learned || !pts ? 'disabled' : ''}>${learned ? 'Aprendida' : 'Aprender'}</button></div>`)}
      ${quem('Duelo', 'duelista', (() => {
        const dm = MONSTERS['duelo_' + n], wins = G.duelos[n] || 0, [ouro, xp] = duelPrize(n);
        return `<div class="row"><img class="ic" src="${A.monsterURL('duelo_' + n, 64)}" alt=""><span class="nm">${dm.nome} desafia você <small>${ic('heart')}${dm.hp} ${ic('sword')}${fmtD(dm.atk)} ${ic('shield')}${fmtD(dm.def)}</small>
          <em>${wins ? `Revanche: só treino, sem prêmio (você já venceu ${wins}×)` : `Prêmio: ${ouro} moedas e ${xp} de experiência`}. Ninguém desmaia: quem chega a 0 perde e fica com 1 de vida.</em></span>
          <button data-act="duel" class="red" ${P.hp <= 1 ? 'disabled' : ''}>Duelar</button></div>`;
      })())}
      ${quem('Ferreiro andarilho', 'ferreiro', gear.map(id => {
        const it = ITEMS[id], cur = P.equip[it.slot];
        const note = owned(id) ? 'você já tem' : cur ? `sua ${slotName[it.slot]}: ${fmtD(ITEMS[cur].dado)}` : `sem ${slotName[it.slot]}`;
        return row(itemIc(id), it.nome, fmtD(it.dado) + (it.slot === 'arma' ? ' de ataque' : ' de defesa'), it.preco, 'buy:' + id, owned(id) || P.ouro < it.preco, note);
      }).join(''))}
      ${quem('Maga', 'maga', spells.map(id => {
        const s = SPELLS[id], has = P.magias.includes(id);
        return row(itemIc(id), s.nome, `${fmtD(s.dado)} ${s.tipo === 'cura' ? 'de cura' : 'de dano, ignora defesa'} · ${s.pm} PM`, s.preco, 'spell:' + id, has || P.ouro < s.preco, has ? 'você já sabe' : '');
      }).join(''))}
      ${quem('Mercador', 'mercador', `${pots.map(id => row(itemIc(id), ITEMS[id].nome, `${fmtD(ITEMS[id].dado)} de ${ITEMS[id].efeito === 'hp' ? 'vida' : 'magia'}`, ITEMS[id].preco, 'pot:' + id, P.ouro < ITEMS[id].preco, `você tem ${P.pocoes[id]}`)).join('')}
      ${row(ic('torch'), 'Tocha', `acende sozinha no escuro, dura ${TOCHA_PASSOS} passos`, TOCHA_PRECO, 'torch', P.ouro < TOCHA_PRECO, `você tem ${P.tochas}`)}
      ${Object.keys(P.partes).some(k => P.partes[k] > 0) ? `<h3>Vender despojos</h3>${Object.keys(P.partes).filter(k => P.partes[k] > 0).map(k => {
        const need = partsNeeded(k), extra = P.partes[k] - need;
        return row(`<img class="ic" src="${A.monsterURL(k, 64)}" alt="">`, `${P.partes[k]} ${PARTS[k][P.partes[k] > 1 ? 1 : 0]}`, `${TIER_OF[k]} cada`, extra > 0 ? extra * TIER_OF[k] : null, 'sellp:' + k, extra <= 0, need ? `${need} guardados para uma missão` : '');
      }).join('')}` : ''}
      ${P.bolsa.length ? `<h3>Vender</h3>${P.bolsa.map((id, k) => row(itemIc(id), ITEMS[id].nome, fmtD(ITEMS[id].dado), Math.floor(ITEMS[id].preco / 2), 'sell:' + k, false)).join('')}` : ''}`)}
      <div class="actions"><button data-act="out" class="green">Seguir viagem</button></div>`, 'village');
    $('panel').onclick = e => {
      const b = e.target.closest('button[data-act]');
      if (!b || b.disabled) return;
      const [act, arg] = b.dataset.act.split(':');
      if (act === 'out') { closePanel(); return; }
      if (act === 'duel') { closePanel(); duel(n).then(() => renderCamp(i, n)); return; }
      // Quem perde a luta desmaia e acorda em outro lugar: aí não volta para cá.
      if (act === 'kill') { closePanel(); attackCamp(n, arg).then(r => { if (r !== 'derrota') renderCamp(i, n); }); return; }
      if (act === 'rest') rest();
      else if (act === 'learn') {
        // Aprendida entra equipada se ainda houver vaga.
        P.habs.push(n);
        const eq = P.ativas.length < HABS_MAX;
        if (eq) P.ativas.push(n);
        SFX.lvl();
        narrate(`Você aprendeu ${hb.nome}! ${MAOS[hb.mao].nome} nos dados ${GRUPO[hb.grupo]}: ${hb.txt}.${eq ? '' : ` Você já tem ${HABS_MAX} equipadas: troque na mochila.`}`);
      }
      else if (act === 'torch') { P.ouro -= TOCHA_PRECO; P.tochas++; SFX.coin(); }
      else if (act === 'sellp') { const extra = P.partes[arg] - partsNeeded(arg); P.partes[arg] -= extra; P.ouro += extra * TIER_OF[arg]; SFX.coin(); }
      else if (act === 'buy') {
        const it = ITEMS[arg];
        P.ouro -= it.preco;
        if (P.equip[it.slot]) P.bolsa.push(P.equip[it.slot]);
        P.equip[it.slot] = arg; SFX.coin();
      } else if (act === 'spell') { P.ouro -= SPELLS[arg].preco; P.magias.push(arg); SFX.coin(); }
      else if (act === 'pot') { P.ouro -= ITEMS[arg].preco; P.pocoes[arg]++; SFX.coin(); }
      else if (act === 'sell') { const id = P.bolsa.splice(+arg, 1)[0]; P.ouro += Math.floor(ITEMS[id].preco / 2); SFX.coin(); }
      const top = $('panel').scrollTop;
      renderCamp(i, n); $('panel').scrollTop = top;
      hud(); save();
    };
  }

  // ---------- mochila ----------
  // `redraw`: a mochila já aberta se redesenha depois de equipar, beber ou usar.
  function bag(redraw = false) {
    if (!W || (panelOpen && !redraw) || walker) return;
    const slot = s => {
      const id = P.equip[s];
      const label = { arma: 'Arma', escudo: 'Escudo', armadura: 'Armadura' }[s];
      return `<div class="row">${id ? itemIc(id) : ic(s === 'arma' ? 'sword' : s === 'escudo' ? 'shield' : 'armor', '#ddd')}<span class="nm">${label}: ${id ? ITEMS[id].nome : '—'} <small>${id ? fmtD(ITEMS[id].dado) : ''}</small></span></div>`;
    };
    openPanel(`
      <h2>Mochila de ${esc(P.nome)}</h2>
      <p>Nível ${P.lvl} · ${P.xp}/${xpNext(P.lvl)} de experiência · ${ic('heart')} ${P.hp}/${P.hpMax} · ${ic('star')} ${P.pm}/${P.pmMax} · ${P.ouro}${ic('coin')}</p>
      <h3>Equipado</h3>${slot('arma')}${slot('escudo')}${slot('armadura')}
      <h3>Na mochila</h3>
      ${P.bolsa.length ? P.bolsa.map((id, k) => `<div class="row">${itemIc(id)}<span class="nm">${ITEMS[id].nome} <small>${fmtD(ITEMS[id].dado)}</small></span><button data-act="eq:${k}">Equipar</button></div>`).join('') : '<p class="small">Vazia. Itens que sobram ao comprar ou achar em baús vêm para cá.</p>'}
      ${POTS.filter(id => ITEMS[id].loja === 1 || P.pocoes[id]).map(id => `<div class="row">${itemIc(id)}<span class="nm">${ITEMS[id].nome} ×${P.pocoes[id] || 0} <small>${fmtD(ITEMS[id].dado)}</small></span><button data-act="use:${id}" ${P.pocoes[id] ? '' : 'disabled'}>Beber</button></div>`).join('')}
      <div class="row">${ic('torch')}<span class="nm">Tochas ×${P.tochas} <small>${P.tocha > 0 ? `uma acesa, mais ${P.tocha} passos` : `acendem sozinhas no escuro, ${TOCHA_PASSOS} passos cada`}</small></span></div>
      ${Object.keys(P.partes).filter(k => P.partes[k] > 0).map(k => `<div class="row"><img class="ic" src="${A.monsterURL(k, 64)}" alt=""><span class="nm">${cap(PARTS[k][P.partes[k] > 1 ? 1 : 0])} ×${P.partes[k]} <small>despojo de ${MONSTERS[k].nome}</small></span></div>`).join('')}
      <h3>Missões</h3>
      ${P.missoes.length ? P.missoes.map(q => { const pr = Math.min(q.n, progress(q)), who = `${npcOf(q).nome} (${Wd.BIOMAS[q.pg].nome})`; return `<div class="row">${ic('scroll', C.OCHRE)}<span class="nm">${questText(q)} <small>${pr}/${q.n}</small><em>${pr >= q.n ? `pronta: volte a ${who}` : `para ${who}`}</em></span></div>`; }).join('') : '<p class="small">Nenhuma. Quem tem "!" no balão tem serviço pra você.</p>'}
      <h3>Habilidades</h3>
      ${P.habs.length ? `<p class="small">Equipadas: ${P.ativas.length} de ${HABS_MAX}. Só as equipadas disparam.</p>` : ''}
      ${P.habs.map(k => {
        const h = HABILIDADES[k], on = P.ativas.includes(k);
        return `<div class="row">${ic('star', on ? C.YELLOW : '#ccc')}<span class="nm">${h.nome} <small>${MAOS[h.mao].nome} nos dados ${GRUPO[h.grupo]}</small><em>${h.txt}</em></span>
          <button data-act="hab:${k}" class="${on ? 'green' : ''}" ${!on && P.ativas.length >= HABS_MAX ? 'disabled' : ''}>${on ? 'Tirar' : 'Equipar'}</button></div>`;
      }).join('')}
      <p class="small">${pontos() ? `Você tem ${pontos()} ponto${pontos() > 1 ? 's' : ''} de habilidade: cada fogueira ensina uma.` : P.habs.length ? '' : 'Nenhuma ainda. Cada nível dá um ponto; cada fogueira ensina uma habilidade.'}</p>
      <h3>Magias</h3>
      ${P.magias.length ? P.magias.map(id => `<div class="row">${itemIc(id)}<span class="nm">${SPELLS[id].nome} <small>${fmtD(SPELLS[id].dado)} · ${SPELLS[id].pm} PM</small></span>${SPELLS[id].tipo === 'cura' ? `<button data-act="cast:${id}" ${P.pm >= SPELLS[id].pm && P.hp < P.hpMax ? '' : 'disabled'}>Usar</button>` : ''}</div>`).join('') : '<p class="small">Nenhuma ainda. As magas das fogueiras vendem pergaminhos.</p>'}
      <p id="bag-msg" class="small"></p>
      <div class="actions"><button data-act="close" class="green">Fechar</button><button data-act="title">Tela inicial</button></div>`, 'bagp');
    $('panel').onclick = e => {
      const b = e.target.closest('button[data-act]');
      if (!b || b.disabled) return;
      const [act, arg] = b.dataset.act.split(':');
      let msg = '';
      if (act === 'close') { closePanel(); return; }
      if (act === 'title') { closePanel(); save(); cloudSave(); title(); return; }
      if (act === 'eq') {
        const id = P.bolsa.splice(+arg, 1)[0], s = ITEMS[id].slot;
        if (P.equip[s]) P.bolsa.push(P.equip[s]);
        P.equip[s] = id;
      } else if (act === 'use') {
        const it = ITEMS[arg], v = expand([it.dado]).reduce((a, s) => a + 1 + rnd(s), 0);
        P.pocoes[arg]--;
        if (it.efeito === 'hp') { const g = Math.min(P.hpMax - P.hp, v); P.hp += g; msg = `Rolou ${fmtD(it.dado)}: +${g} de vida.`; }
        else { const g = Math.min(P.pmMax - P.pm, v); P.pm += g; msg = `Rolou ${fmtD(it.dado)}: +${g} de magia.`; }
      } else if (act === 'hab') {
        const k = +arg;
        P.ativas = P.ativas.includes(k) ? P.ativas.filter(x => x !== k) : P.ativas.concat(k).slice(0, HABS_MAX);
      } else if (act === 'cast') {
        const s = SPELLS[arg], v = expand([s.dado]).reduce((a, d) => a + 1 + rnd(d), 0), g = Math.min(P.hpMax - P.hp, v);
        P.pm -= s.pm; P.hp += g; msg = `Rolou ${fmtD(s.dado)}: +${g} de vida.`;
      }
      const top = $('panel').scrollTop;
      bag(true); $('panel').scrollTop = top;
      hud(); save();
      if (msg) $('bag-msg').textContent = msg;
    };
  }

  // ---------- salvar / carregar ----------
  const saveLevel = l => ({ rev: Array.from(l.rev).join(''), dead: [...l.dead], opened: [...l.opened], trail: [...l.trail] });
  function loadLevel(l, d) {
    for (let i = 0; i < d.rev.length; i++) if (d.rev[i] === '1') l.rev[i] = 1;
    d.dead.forEach(i => l.dead.add(i)); d.opened.forEach(i => l.opened.add(i)); d.trail.forEach(k => l.trail.add(k));
  }
  function save() {
    if (!W || !P) return;
    try {
      const dun = {};
      for (const k in G.dun) dun[k] = saveLevel(G.dun[k]);
      // `em` = quando foi salvo: com conta, o save mais novo ganha (ver syncDown).
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 3, em: Date.now(), seed: WORLD.seed, P, dun,
        pg: G.pg.map(l => ({ ...saveLevel(l), talked: [...l.talked], cleared: [...l.cleared], won: l.won, guarda: l.guarda, lenda: l.lenda, mortos: [...l.mortos] })),
        seen: [...G.seen], steps: G.steps, kills: G.kills, clock: G.clock, day: G.day, conversa: G.conversa,
        lava: G.lava, areia: G.areia, vulcao: G.vulcao, tempestade: G.tempestade, duelos: G.duelos, gente: G.gente, tempo: G.tempo,
      }));
    } catch (e) { /* sem armazenamento: o jogo segue sem salvar */ }
  }
  // Saves de antes das páginas (v1 e v2) não servem: a mesma semente agora
  // gera outro mundo. Eles ficam no navegador, mas o jogo começa do zero.
  function loadSave() {
    if (qs.has('novo')) return null;
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      return s && s.v === 3 ? s : null;
    } catch (e) { return null; }
  }

  // ---------- tempo de jogo ----------
  // POR QUE: o save (e a conta na nuvem) guarda quanto tempo a aventura já
  // foi jogada. ESTRATÉGIA: conta 1 segundo por vez, só com a aventura aberta
  // (fora da capa), a aba visível e alguém mexendo: depois de 2 minutos sem
  // tecla nem toque, o jogo deixado aberto para de contar.
  const PARADO = 120000;
  let mexeu = Date.now();
  for (const ev of ['keydown', 'pointerdown']) addEventListener(ev, () => { mexeu = Date.now(); }, true);
  setInterval(() => {
    if (G && P && !onTitle && !document.hidden && Date.now() - mexeu < PARADO) G.tempo = (G.tempo || 0) + 1;
  }, 1000);
  const fmtTempo = seg => {
    const h = Math.floor(seg / 3600), m = Math.floor(seg / 60) % 60;
    return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}min`;
  };

  // ---------- conta e save na nuvem (nuvem.js) ----------
  // Com conta, o save do navegador sobe para a nuvem nos momentos que
  // importam: ao chegar numa fogueira, descansar, virar a página, a cada 50
  // passos, ao voltar para a capa e quando o jogo vai para segundo plano.
  // Nada sobe antes de juntar o save do aparelho com o da nuvem nesta
  // sessão (`synced`): senão um save velho deste aparelho apagaria um mais
  // novo, feito em outro.
  const nuvem = () => window.Nuvem && Nuvem.ativa;
  let synced = false, syncing = false;
  function cloudSave() {
    if (!nuvem() || !Nuvem.usuario || !synced) return;
    try { Nuvem.subir(localStorage.getItem(SAVE_KEY)).catch(() => { }); } catch (e) { }
  }
  addEventListener('visibilitychange', () => { if (document.hidden) { save(); cloudSave(); } });
  // Junta o save do aparelho com o da nuvem, na capa: só um dos dois existe →
  // fica esse; a mesma aventura (mesma semente) → fica o mais novo; aventuras
  // diferentes → o jogador escolhe. Devolve true se mudou o save do aparelho.
  async function syncDown() {
    if (!nuvem() || !Nuvem.usuario || syncing) return false;
    syncing = true;
    try { return await merge(); } finally { syncing = false; }
  }
  async function merge() {
    let cloud;
    try { cloud = await Nuvem.baixar(); } catch (e) { return false; }
    synced = true;
    const local = loadSave();
    const take = s => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { } return true; };
    if (!cloud || cloud.v !== 3) { cloudSave(); return false; }
    if (!local) return take(cloud);
    if (cloud.seed === local.seed) {
      if ((cloud.em || 0) > (local.em || 0)) return take(cloud);
      cloudSave();
      return false;
    }
    const resumo = s => `<b>${esc(s.P.nome)}</b>, nível ${s.P.lvl}, página ${s.P.pg + 1} (${Wd.BIOMAS[s.P.pg].nome}), ${fmtTempo(s.tempo || 0)} de jogo${s.em ? `, salvo em ${new Date(s.em).toLocaleDateString('pt-BR')}` : ''}`;
    const v = await dialog('Duas aventuras', `<p>Este aparelho tem uma aventura e a sua conta tem outra. Qual você quer continuar?</p>
      <p>${ic('map')} Na conta: ${resumo(cloud)}</p><p>${ic('bag')} Neste aparelho: ${resumo(local)}</p>
      <p class="small">A outra é apagada.</p>`,
      [{ html: 'A da conta', v: 'nuvem', cls: 'green' }, { html: 'A deste aparelho', v: 'local' }]);
    if (v === 'nuvem') return take(cloud);
    Nuvem.subir(JSON.stringify(local)).catch(() => { });
    return false;
  }
  // A área da conta na capa: "Entrar / Criar conta" ou "Conta: fulano · Sair".
  function renderConta() {
    const el = $('conta');
    if (!el) return;
    if (!nuvem()) { el.innerHTML = ''; return; }
    el.innerHTML = Nuvem.usuario
      ? `<p class="small">${ic('star', C.YELLOW)} Conta: <b>${esc(Nuvem.usuario)}</b>. Sua aventura fica salva na nuvem. <button id="b-sair">Sair</button></p>`
      : `<button id="b-conta" class="purple">${ic('scroll', C.PURPLE)} Entrar / Criar conta</button>
         <p class="small">Com uma conta, você continua a aventura em qualquer aparelho.</p>`;
    if ($('b-conta')) $('b-conta').onclick = contaPanel;
    if ($('b-sair')) $('b-sair').onclick = async () => { await Nuvem.sair(); synced = false; renderConta(); };
  }
  // Folha de entrar ou criar conta: usuário e senha, sem e-mail.
  function contaPanel() {
    openPanel(`<h2>Sua conta</h2>
      <p class="small">Sem e-mail: só um usuário e uma senha. <b>Anote a senha</b>: se esquecer, não tem como recuperar.</p>
      <form id="f-conta" class="conta-form" autocomplete="on">
        <label>Usuário <input id="c-user" name="username" autocomplete="username" maxlength="20" autocapitalize="none" spellcheck="false"></label>
        <label>Senha <input id="c-pass" name="password" type="password" autocomplete="current-password" maxlength="64"></label>
        <p id="c-msg" class="small"></p>
        <div class="actions">
          <button type="submit" class="green">Entrar</button>
          <button type="button" id="c-criar" class="purple">Criar conta</button>
          <button type="button" id="c-voltar">Voltar</button>
        </div>
      </form>`, 'dialog');
    const go = async criar => {
      const msg = $('c-msg'), btns = [...$('f-conta').querySelectorAll('button')];
      btns.forEach(b => { b.disabled = true; });
      msg.textContent = criar ? 'Criando a conta...' : 'Entrando...';
      try {
        await Nuvem.entrar($('c-user').value, $('c-pass').value, criar);
        synced = false;
        title();
        narrate(criar ? `Conta criada! O mestre escreve "${esc(Nuvem.usuario)}" na capa do caderno.` : `Bem-vindo de volta, ${esc(Nuvem.usuario)}!`);
      } catch (e) {
        msg.textContent = e.message;
        btns.forEach(b => { b.disabled = false; });
      }
    };
    $('f-conta').onsubmit = e => { e.preventDefault(); go(false); };
    $('c-criar').onclick = () => go(true);
    $('c-voltar').onclick = () => title();
    $('c-user').focus();
  }

  function startGame(data) {
    onTitle = false;
    WORLD = Wd.world(data.seed); dunCache = {};
    G = newState();
    walker = null; path = []; held = null; cam.over = false;
    if (data.P) {
      P = Object.assign(newPlayer(data.P.nome), data.P);
      // Save da 0.3 (todas as aprendidas valiam): equipa as 2 primeiras.
      if (!data.P.ativas) P.ativas = P.habs.slice(0, HABS_MAX);
      data.pg.forEach((d, pg) => {
        const l = G.pg[pg];
        loadLevel(l, d);
        d.talked.forEach(i => l.talked.add(i)); d.cleared.forEach(n => l.cleared.add(n));
        l.won = d.won; l.guarda = !!d.guarda;
        // Save de antes da 0.5.0: o lendário começa no lugar dele, com a vida cheia.
        if (d.lenda) l.lenda = d.lenda;
        (d.mortos || []).forEach(i => l.mortos.add(i));
      });
      for (const k in data.dun) {
        const [pg, n, andar = 0] = k.split(':').map(Number);
        G.dun[k] = newLevel(dunMap(n, pg, andar)); loadLevel(G.dun[k], data.dun[k]);
      }
      data.seen.forEach(k => G.seen.add(k));
      Object.assign(G, {
        steps: data.steps, kills: data.kills, clock: data.clock, day: data.day, conversa: data.conversa || {},
        lava: data.lava || {}, areia: data.areia || 0, vulcao: data.vulcao || 0, tempestade: data.tempestade || 0, duelos: data.duelos || {}, gente: data.gente || {}, tempo: data.tempo || 0,
      });
      // A lava que ainda não esfriou volta para o mapa do Vulcão.
      const v = WORLD.pages[Wd.PAGINAS - 1];
      for (const k in G.lava) v.t[+k] = Wd.AGUA;
      setPage(P.pg);
      setMap(P.onde, P.andar);
      narrate(`De volta à aventura de ${esc(P.nome)}. O mestre abre o caderno na mesma página.`);
    } else {
      P = newPlayer(data.nome);
      setPage(0);
      setMap(null);
      reveal(P.x, P.y);
      narrate(`Era uma vez ${esc(P.nome)}, que acordou ao lado de uma fogueira no ${Wd.FOGUEIRAS[0]}. O mestre destampa as canetas...`);
    }
    devShortcuts();
    snapCam();
    darkV = inDungeon() ? 0.9 : darkness() * 0.85;
    $('hud').hidden = false;
    $('dpad').hidden = !matchMedia('(pointer: coarse)').matches;
    hud(); save();
  }

  // Atalhos de desenvolvimento pela URL (ver README).
  function devShortcuts() {
    if (qs.has('ouro')) P.ouro = +qs.get('ouro') || 9999;
    if (qs.has('nivel')) { const l = +qs.get('nivel') || 5; while (P.lvl < l) gainXp(xpNext(P.lvl) - P.xp); }
    if (qs.has('tochas')) P.tochas = +qs.get('tochas') || 0;
    // ?habilidades = todas as 25; ?habilidades=2,10,15 = só essas (índice da fogueira).
    // As 2 primeiras da lista ficam equipadas.
    if (qs.has('habilidades')) {
      P.habs = qs.get('habilidades') ? qs.get('habilidades').split(',').map(Number).filter(k => HABILIDADES[k]) : HABILIDADES.map((_, k) => k);
      P.ativas = P.habs.slice(0, HABS_MAX);
    }
    if (qs.has('pagina')) {
      // Começa na primeira fogueira da página N (1 a 5).
      const pg = Math.max(0, Math.min(Wd.PAGINAS - 1, (+qs.get('pagina') || 1) - 1));
      setPage(pg);
      P.x = W.start % W.W; P.y = (W.start / W.W) | 0; P.respawn = W.start; P.rpg = pg;
      G.seen.add('p' + pg);
      setMap(null);
      reveal(P.x, P.y, true);
      if (BIOME_TEXT[pg].chegada) narrate(BIOME_TEXT[pg].chegada);
    }
    if (qs.has('noite')) { G.clock = 80; burnTorch(false); rebakeAll(); }
    // ?tempestade e ?erupcao: a próxima tempestade (Deserto) ou erupção
    // (Vulcão) vem no próximo passo lá fora.
    if (qs.has('tempestade')) G.areia = TEMPESTADE_A - 1;
    if (qs.has('erupcao')) G.vulcao = ERUPCAO_A - 1;
    // ?lenda: o lendário da página aparece 3 quadrados à direita do herói (se der).
    if (qs.has('lenda')) {
      const lg = here().lenda;
      for (let dx = 3; dx >= 2; dx--) { const j = idx(P.x + dx, P.y); if (Wd.passable(W.t[j]) && !W.obj.has(j)) { lg.i = j; break; } }
    }
    if (qs.has('masmorra')) {
      const n = Math.min(W.dungeons.length - 1, +qs.get('masmorra') || 0), d = W.dungeons[n];
      P.ox = d % W.W; P.oy = (d / W.W) | 0;
      // ?andar = já no andar de baixo (só nas masmorras com a variação "andar").
      setMap(n, qs.has('andar') && dunMap(n).varia === 'andar' ? 1 : 0);
      P.x = M.start % M.W; P.y = (M.start / M.W) | 0;
      burnTorch(false);
      reveal(P.x, P.y, true);
    }
    if (qs.has('revelar')) { L.rev.fill(1); rebakeAll(); }
    // ?luta=lobo&grupo=3 = luta contra 3 lobos.
    if (qs.has('luta') && MONSTERS[qs.get('luta')]) setTimeout(() => combat(qs.get('luta'), { n: Math.max(1, Math.min(3, +qs.get('grupo') || 1)) }), 300);
  }

  // ---------- tela inicial ----------
  // `onTitle`: a capa está aberta (falso depois de começar a jogar).
  let onTitle = false;
  function title() {
    onTitle = true;
    const sv = loadSave();
    openPanel(`
      <div class="cover">
        <h1>Caderno de Aventuras</h1>
        <p class="sub">o RPG que a gente jogava no fundo da sala</p>
        <canvas id="cover-cv"></canvas>
        <label class="name">Nome do herói: <input id="nome" maxlength="16" value="${esc(sv ? sv.P.nome : 'Herói')}"></label>
        <div class="actions">
          ${sv ? `<button id="b-cont" class="green">Continuar <small>${esc(sv.P.nome)}, nível ${sv.P.lvl} · ${fmtTempo(sv.tempo || 0)}</small></button>` : ''}
          <button id="b-new" class="red">Nova aventura</button>
        </div>
        <p class="small how">Ande com as setas, WASD ou tocando no mapa. O mestre desenha o mundo enquanto você anda.
        Cada item dá dados: a soma é o dano, e escudo e armadura rolam a sua defesa.</p>
        <div id="conta" class="conta"></div>
        ${window.CADERNO_GA ? '<p class="small how">Este jogo conta quantas pessoas o abrem com o Google Analytics (sem nenhum dado pessoal).</p>' : ''}
        <div id="install" class="install"></div>
      </div>`, 'title');
    coverArt($('cover-cv'));
    installOffer();
    renderConta();
    // Com conta e ainda sem juntar os saves nesta sessão, junta agora e
    // redesenha a capa (o "Continuar" pode mudar; a escolha entre duas
    // aventuras fecha a capa).
    if (nuvem() && Nuvem.usuario && !synced && !syncing) syncDown().then(() => { if (synced && onTitle) title(); });
    const go = data => { SFX.init(); closePanel(); startGame(data); };
    if (sv) $('b-cont').onclick = () => go(sv);
    $('b-new').onclick = () => {
      if (sv && !$('b-new').dataset.sure) { $('b-new').dataset.sure = 1; $('b-new').innerHTML = 'Apagar o save e começar?'; return; }
      const nome = ($('nome').value || 'Herói').trim().slice(0, 16) || 'Herói';
      go({ nome, seed: qs.has('seed') ? +qs.get('seed') : (Math.random() * 1e9) >>> 0 });
    };
  }
  // ---------- instalar no celular (PWA) ----------
  // O navegador avisa (beforeinstallprompt, no Android e no PC) que dá para
  // instalar; a capa mostra um botão. No iPhone não existe esse aviso: a capa
  // ensina o caminho pelo menu Compartilhar. Já instalado, não mostra nada.
  let installEvt = null;
  const standalone = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; installOffer(); });
  addEventListener('appinstalled', () => { installEvt = null; installOffer(); });
  function installOffer() {
    const el = $('install');
    if (!el) return;
    if (standalone()) { el.innerHTML = ''; return; }
    if (installEvt) {
      el.innerHTML = `<button id="b-install" class="green">${ic('star', C.YELLOW)} Instalar no celular</button>
        <p class="small">Vira um app: ícone na tela inicial, tela cheia, em pé ou deitado, e joga sem internet.</p>`;
      $('b-install').onclick = async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; installOffer(); };
    } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      el.innerHTML = '<p class="small">No iPhone: toque em Compartilhar e depois em "Adicionar à Tela de Início" para jogar como app, em tela cheia e sem internet.</p>';
    } else el.innerHTML = '';
  }
  // O service worker só roda em https (o site no GitHub Pages); abrindo o
  // arquivo do disco ou num servidor local de teste, o jogo segue sem ele.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
  }

  // Capa: herói, dragão e um d20 sendo desenhados.
  function coverArt(c) {
    const r = c.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), x = c.getContext('2d');
    c.width = r.width * d; c.height = r.height * d; x.setTransform(d, 0, 0, d, 0, 0);
    const h = r.height, list = [
      ...S.xform(A.hero(0), h / 100, r.width * 0.12, 0),
      ...S.xform(A.dieStrokes(20, C.RED), h * 0.5 / 100, r.width * 0.5 - h * 0.25, h * 0.3),
      ...S.xform(A.monster('dragao'), h / 100, r.width * 0.88 - h, 0),
    ];
    const t0 = performance.now();
    const loop = t => {
      if (!c.isConnected) return;
      x.clearRect(0, 0, r.width, r.height);
      S.drawAll(x, list, Math.min(1, (t - t0) / 2600));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ---------- entrada ----------
  const KEYS = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
  addEventListener('keydown', e => {
    SFX.init();
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (panelOpen) {
      const n = +e.key;
      if (n >= 1 && n <= 9) {
        const btns = [...$('panel').querySelectorAll('.actions button:not(:disabled)')];
        if (btns[n - 1]) btns[n - 1].click();
      }
      return;
    }
    if (KEYS[k]) { held = KEYS[k]; if (!e.repeat && !walker) tap = held; path = []; e.preventDefault(); }
    else if (k === 'b' || k === 'i') bag();
    else if (k === 'm' && W) cam.over = !cam.over;
  });
  addEventListener('keyup', e => { const k = KEYS[e.key.toLowerCase()]; if (k && held === k) held = null; });
  addEventListener('blur', () => { held = null; });

  cv.addEventListener('pointerdown', e => {
    SFX.init();
    if (panelOpen || !W) return;
    if (cam.over) { cam.over = false; return; }
    const wx = (e.clientX - vw / 2) / cam.z + cam.x, wy = (e.clientY - vh / 2) / cam.z + cam.y;
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    if (tx < 0 || ty < 0 || tx >= M.W || ty >= M.H) return;
    if (!L.rev[idx(tx, ty)]) { narrate('O mestre ainda não desenhou aí. Chegue mais perto!'); return; }
    const p = findPath(tx, ty);
    if (p) path = p;
    else if (!(tx === P.x && ty === P.y)) narrate('Não tem caminho até lá.');
  });
  for (const b of document.querySelectorAll('#dpad button')) {
    const d = b.dataset.d.split(',').map(Number);
    b.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); held = d; path = []; });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { if (held === d) held = null; });
  }
  $('b-bag').onclick = () => bag();
  $('b-map').onclick = () => { if (W && !panelOpen) cam.over = !cam.over; };
  const sndIcon = () => { $('snd-img').src = A.iconURL('sound', SFX.on ? 'on' : ''); };
  $('b-snd').onclick = () => { SFX.on = !SFX.on; sndIcon(); try { localStorage.setItem('caderno-aventuras-som', SFX.on ? '1' : '0'); } catch (e) { } };
  try { SFX.on = localStorage.getItem('caderno-aventuras-som') !== '0'; } catch (e) { }

  // Ícones fixos do HUD.
  for (const img of document.querySelectorAll('img[data-icon]')) img.src = A.iconURL(img.dataset.icon);
  sndIcon();

  window.Caderno = {
    get state() { return { P, G, W, M, L, WORLD }; }, combat, title, rest, duel, meetLegend, sandstorm, erupt,
    riddle: i => riddle(i, M.obj.get(i)), stairs,
    talk: i => talk(i, M.obj.get(i)), camp: i => camp(i, M.obj.get(i)), guardian: i => guardian(i, M.obj.get(i)), shortcut: i => shortcut(M.obj.get(i)), meetBoss: i => meetBoss(i, M.obj.get(i)), turnPage: i => turnPage(M.obj.get(i)),
  };

  // As fontes de mão precisam estar carregadas antes de escrever no canvas.
  Promise.race([
    Promise.all([document.fonts.load(`20px ${S.TITLE}`), document.fonts.load(`20px ${S.HAND}`)]),
    wait(2500),
  ]).catch(() => { }).then(() => {
    requestAnimationFrame(tick);
    const sv = loadSave();
    if (qs.has('novo') || qs.has('seed') || !sv) {
      if (qs.has('seed') || qs.has('luta') || qs.has('revelar') || qs.has('masmorra') || qs.has('pagina')) startGame({ nome: 'Herói', seed: +qs.get('seed') || 1 });
      else title();
    } else title();
    // Com conta já entrada neste aparelho, a capa busca o save da nuvem.
    if (nuvem()) {
      Nuvem.aoMudar(renderConta);
      Nuvem.iniciar().then(ok => { if (ok && Nuvem.usuario && $('panel').classList.contains('title')) title(); });
    }
  });
})();
