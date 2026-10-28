// versao.js — a versão de cada jogo do repositório (versionamento semântico).
//
// POR QUE: cada jogo (GDD, protótipo e guia juntos) tem um número
// MAJOR.MINOR.PATCH para dizer o quanto ele já evoluiu. Enquanto o jogo não
// lança, fica em 0.y.z: MINOR sobe com mecânica, conteúdo ou sistema novo (e
// com qualquer quebra, como save antigo que deixa de valer); PATCH sobe com
// correção, balanceamento ou texto. 1.0.0 é o primeiro lançamento público;
// depois dele, quebra sobe o MAJOR.
//
// ESTRATÉGIA: este arquivo é a fonte da verdade. O cabeçalho de cada GDD
// repete o número e o histórico do GDD conta o que mudou; o build do site
// (site/scripts/split-gdds.mjs) falha se os dois discordarem. É um <script>
// comum, sem fetch, para funcionar abrindo o index.html direto do disco:
// cada protótipo carrega "../versao.js", que descobre a pasta pelo endereço
// e mostra "Nome v0.1.0" num canto da tela por alguns segundos. O hub de
// protótipos usa a mesma tabela nos cartões.
(function () {
  'use strict';
  // id do jogo: [nome, GDD onde o número aparece, versão].
  const JOGOS = {
    rallysurvive: ['RallySurvive', 'RallySurvive.md', '0.1.0'],
    'navigation-expert': ['Navigation Expert', 'RallySurvive.md', '0.1.0'],
    'race-legenda': ['RaceLegenda', 'RallySurvive.md', '0.1.0'],
    'street-legends': ['Street Legends', 'RallySurvive.md', '0.1.0'],
    'star-expedition-co': ['Star Expedition Co.', 'StarExpeditionCo.md', '0.1.0'],
    '8-bit-armageddon': ['Orbitfall', 'GDD_8-Bit_Armageddon.md', '0.1.0'],
    '8-bit-armageddon-iso': ['Orbitfall Iso', 'GDD_8-Bit_Armageddon_Iso.md', '0.1.0'],
    'requiem-of-blessings': ['Requiem of Blessings', 'RequiemOfBlessings.md', '0.1.0'],
    'dice-and-blood': ['DiceAndBlood', 'DiceAndBlood.md', '0.1.0'],
    'protocolo-ectoplasma': ['Protocolo Ectoplasma', 'GDD_Protocolo_Ectoplasma.md', '0.1.0'],
    'paddock-boss': ['Paddock Boss', 'PaddockBoss.md', '0.1.0'],
    'evil-enemy-defense': ['Evil Enemy Defense', 'EvilEnemyDefense.md', '0.1.0'],
    'guerreiro-da-masmorra': ['Guerreiro da Masmorra', 'GuerreiroDaMasmorra.md', '0.1.0'],
    'guerreiro-da-masmorra-v2': ['Guerreiro da Masmorra v2', 'GuerreiroDaMasmorraV2.md', '0.1.0'],
    'old-knight-and-the-witch': ['Old Knight and the Witch', 'OldKnightAndTheWitch.md', '0.1.0'],
    'craft-dice': ['Craft Dice', 'CraftDice.md', '0.1.0'],
    'ultima-entrega': ['Última Entrega', 'UltimaEntrega.md', '0.1.0'],
    'paper-flight': ['Paper Flight', 'PaperFlight.md', '0.1.0'],
    'projeto-hex': ['Projeto Hex', 'ProjetoHex.md', '0.1.0'],
    'charuto-racer': ['Charuto Racer', 'CharutoRacer.md', '0.1.0'],
    'fury-hauler': ['Fury Hauler', 'FuryHauler.md', '0.1.0'],
    'space-hauler': ['Space Hauler', 'SpaceHauler.md', '0.1.0'],
    'sea-hauler': ['Sea Hauler', 'SeaHauler.md', '0.1.0'],
    'capibaribe-vivo': ['Capibaribe Vivo', 'CapibaribeVivo.md', '0.1.0'],
    'marble-arena': ['Marble Arena', 'MarbleArena.md', '0.1.0'],
    'caca-as-bruxas': ['Caça às Bruxas', 'CacaAsBruxas.md', '0.1.0'],
    'caderno-de-aventuras': ['Caderno de Aventuras', 'CadernoDeAventuras.md', '0.9.0'],
    'iso-cards': ['Iso Cards', 'IsoCards.md', '0.1.0'],
    'mercador-e-legiao': ['Mercador & Legião', 'tutorial-mvp-completo-unity.md', '0.1.0'],
  };
  // Pastas de protótipo que não têm o nome de um jogo: mostram a versão do
  // jogo cujo GDD o cartão do hub abre.
  const PROTOTIPOS = {
    'iso-rpg': 'guerreiro-da-masmorra',
    'iso-rpg-3d': 'guerreiro-da-masmorra',
    'iso-rpg-vertical': 'guerreiro-da-masmorra',
    'guerreiro-da-masmorra-v2-3d': 'guerreiro-da-masmorra-v2',
    'guerreiro-da-masmorra-app': 'guerreiro-da-masmorra-v2',
    'guerreiro-da-masmorra-app-3d': 'guerreiro-da-masmorra-v2',
  };
  // { nome, gdd, versao } do jogo de uma pasta de protótipo (ou undefined).
  const doPrototipo = pasta => {
    const j = JOGOS[PROTOTIPOS[pasta] || pasta];
    return j && { nome: j[0], gdd: j[1], versao: j[2] };
  };
  const g = typeof window !== 'undefined' ? window : globalThis;
  g.VERSOES = { JOGOS, PROTOTIPOS, doPrototipo };
  if (typeof document === 'undefined') return;

  // A pasta é o trecho do endereço logo depois de "prototipos/" (no site e no disco).
  const partes = decodeURIComponent(location.pathname).split('/');
  const k = partes.lastIndexOf('prototipos');
  const jogo = k >= 0 && doPrototipo(partes[k + 1]);
  if (!jogo) return;
  const mostrar = () => {
    const el = document.createElement('div');
    el.textContent = `${jogo.nome} v${jogo.versao}`;
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;right:8px;bottom:6px;z-index:2147483647;pointer-events:none;' +
      'font:600 12px/1.4 system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.5);padding:2px 8px;' +
      'border-radius:6px;opacity:.9;transition:opacity 1s';
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; }, 8000);
    setTimeout(() => el.remove(), 9200);
  };
  if (document.body) mostrar(); else addEventListener('DOMContentLoaded', mostrar);
})();
