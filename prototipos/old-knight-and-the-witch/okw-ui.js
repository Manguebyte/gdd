/* ================================================================
   Old Knight and the Witch — interface própria (arte PixelLab)
   POR QUE: o protótipo herdou do app do Guerreiro centenas de emojis espalhados
   em strings (log, botões, números flutuantes no canvas). Trocar um por um no
   motor quebraria a regra de "não mexer no código de combate do app". Este
   arquivo troca os emojis na SAÍDA: no DOM (MutationObserver) e no canvas
   (fillText), pelos ícones de Sprites/OldKnightWitch/ui/icons/.
   ESTRATÉGIA:
     - EMO: emoji → nome do ícone. Emoji sem ícone some (a tela fica limpa em vez
       de misturar emoji do sistema com pixel art).
     - Cartas da Bruxa no estilo do Iso Cards: moldura em pixel art feita por
       código (uma cor por carta), ilustração PixelLab 48×48, gema do custo e
       placa com o nome. card(id) devolve um <canvas> pronto.
   Carregado antes do script do jogo; expõe window.OKW_UI.
   ================================================================ */
(function () {
  'use strict';
  const ART = '../../Sprites/OldKnightWitch/';
  const FONT = '"Pixelify Sans", monospace';

  /* ---------- ícones ---------- */
  const ICONS = ['coin', 'torch', 'soul', 'pouch', 'sparkle', 'chest', 'scroll', 'castle', 'map', 'lock', 'mana',
    'hourglass', 'potion', 'adrenaline', 'swap', 'bolt', 'crown', 'shield', 'trophy', 'bomb', 'stone',
    'stars', 'heart', 'burst', 'arrow', 'horn', 'dagger', 'tree',
    'crossed', 'skull', 'firskull', 'crystal', 'grimoire', 'helmet', 'sigil'];
  const CARD_IDS = ['spark', 'embers', 'veil', 'snap', 'chain', 'blizzard', 'blast', 'lance', 'tea', 'blessing', 'haste', 'memory', 'swapstep'];
  const iconSrc = n => ART + 'ui/icons/' + n + '.png';
  const cardSrc = id => ART + 'cartas/' + id + '.png';
  const IMG = {}, CARD_IMG = {};
  const load = src => { const im = new Image(); im.src = src; return im; };
  ICONS.forEach(n => { IMG[n] = load(iconSrc(n)); });
  CARD_IDS.forEach(id => { CARD_IMG[id] = load(cardSrc(id)); });

  /* emoji (sem o seletor FE0F) → ícone; 'card:' usa a ilustração da carta */
  const EMO = {
    '🪙': 'coin', '💰': 'pouch', '🛒': 'pouch', '🔥': 'torch', '👻': 'soul', '✨': 'sparkle', '💫': 'stars',
    '🃏': 'grimoire', '🎁': 'chest', '📜': 'scroll', '🏰': 'castle', '🏛': 'castle', '🗺': 'map', '🔒': 'lock',
    '💧': 'mana', '⏭': 'hourglass', '⏱': 'hourglass', '🧪': 'potion', '💉': 'adrenaline', '🔁': 'swap', '🔄': 'swap',
    '⚡': 'bolt', '👑': 'crown', '🛡': 'shield', '🏆': 'trophy', '🏅': 'trophy', '🧨': 'bomb', '🪨': 'stone',
    '💗': 'heart', '💚': 'heart', '❤': 'heart', '💥': 'burst', '⚔': 'crossed', '🗡': 'dagger', '🪓': 'dagger',
    '☠': 'skull', '💀': 'skull', '😡': 'firskull', '⚠': 'firskull', '💎': 'crystal', '💠': 'crystal',
    '🌲': 'tree', '🌳': 'tree', '🌱': 'tree', '🔊': 'horn', '◀': 'arrowL', '⬅': 'arrowL', '↩': 'arrowL',
    '▶': 'arrow', '➡': 'arrow', '🎓': 'scroll', '📍': 'map', '🧭': 'map', '🧙': 'sigil', '🔮': 'sigil',
    '🌫': 'card:veil', '🍵': 'card:tea', '❄': 'card:blizzard', '🌩': 'card:chain', '🔆': 'card:lance',
    '📖': 'card:memory', '💨': 'card:haste',
  };
  const RE = /\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*/gu;
  // teste sem a flag g: RE.test() avançaria o lastIndex, e o matchAll (que copia o lastIndex)
  // pularia o 1º emoji — o texto voltava com emoji e o observer entrava em laço
  const HAS = /\p{Extended_Pictographic}/u;
  const keyOf = m => (m.includes('\u200D') ? null : m.replace(/\uFE0F/g, ''));
  function srcFor(m) {
    const n = EMO[keyOf(m)];
    if (!n) return null;
    if (n.startsWith('card:')) return cardSrc(n.slice(5));
    return iconSrc(n === 'arrowL' ? 'arrow' : n);
  }
  function imgFor(m) {
    const n = EMO[keyOf(m)];
    if (!n) return null;
    if (n.startsWith('card:')) return CARD_IMG[n.slice(5)];
    return IMG[n === 'arrowL' ? 'arrow' : n];
  }
  const flipped = m => EMO[keyOf(m)] === 'arrowL';
  /* <img> de um ícone para innerHTML */
  const icon = (name, cls) => '<img class="' + (cls || 'emo') + '" src="' + iconSrc(name) + '" alt="">';

  /* ---------- DOM: troca os emojis dos nós de texto ---------- */
  const SKIP = /^(SCRIPT|STYLE|TITLE|TEXTAREA|OPTION)$/;
  function fixText(node) {
    const t = node.nodeValue;
    if (!t || !node.parentNode || SKIP.test(node.parentNode.nodeName)) return;
    if (!HAS.test(t)) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of t.matchAll(RE)) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const src = srcFor(m[0]);
      if (src) {
        const im = document.createElement('img');
        im.className = 'emo' + (flipped(m[0]) ? ' flip' : '');
        im.src = src; im.alt = '';
        frag.appendChild(im);
      }
      last = m.index + m[0].length;
    }
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last).replace(/^ (?= )/, '')));
    node.parentNode.replaceChild(frag, node);
  }
  function fixTree(root) {
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1 || SKIP.test(root.nodeName)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach(fixText);
  }
  const obs = new MutationObserver(recs => {
    for (const r of recs) {
      if (r.type === 'characterData') fixText(r.target);
      else r.addedNodes.forEach(fixTree);
    }
  });
  function startDom() {
    fixTree(document.body);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) startDom(); else document.addEventListener('DOMContentLoaded', startDom);

  /* ---------- canvas: fillText com ícones no lugar dos emojis ---------- */
  const P = CanvasRenderingContext2D.prototype;
  const oFill = P.fillText, oStroke = P.strokeText, oMeasure = P.measureText;
  const cache = new Map();
  function parts(text) {
    if (cache.has(text)) return cache.get(text);
    let out = null;
    if (HAS.test(text)) {
      out = []; let last = 0;
      for (const m of text.matchAll(RE)) {
        if (m.index > last) out.push({ t: text.slice(last, m.index) });
        out.push({ m: m[0], img: imgFor(m[0]) });
        last = m.index + m[0].length;
      }
      if (last < text.length) out.push({ t: text.slice(last) });
      out = out.filter(p => p.t || p.img);
    }
    if (cache.size > 400) cache.clear();
    cache.set(text, out);
    return out;
  }
  const sizeOf = ctx => { const m = /(\d+(?:\.\d+)?)px/.exec(ctx.font); return m ? +m[1] * 1.15 : 14; };
  function drawRich(ctx, orig, fill, text, x, y) {
    const ps = parts(String(text));
    if (!ps) return false;
    const s = sizeOf(ctx);
    const wOf = p => (p.t ? oMeasure.call(ctx, p.t).width : s);
    const total = ps.reduce((a, p) => a + wOf(p), 0);
    const al = ctx.textAlign;
    let cx = al === 'center' ? x - total / 2 : (al === 'right' || al === 'end') ? x - total : x;
    const bl = ctx.textBaseline;
    const top = bl === 'middle' ? y - s / 2 : (bl === 'top' || bl === 'hanging') ? y : (bl === 'bottom' || bl === 'ideographic') ? y - s : y - s * 0.82;
    ctx.save();
    ctx.textAlign = 'left';
    for (const p of ps) {
      if (p.t) orig.call(ctx, p.t, cx, y);
      else if (fill && p.img && p.img.complete && p.img.naturalWidth) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(p.img, Math.round(cx), Math.round(top), Math.round(s), Math.round(s));
      }
      cx += wOf(p);
    }
    ctx.restore();
    return true;
  }
  P.fillText = function (t, x, y, mw) {
    if (!drawRich(this, oFill, true, t, x, y)) return mw === undefined ? oFill.call(this, t, x, y) : oFill.call(this, t, x, y, mw);
  };
  P.strokeText = function (t, x, y, mw) {
    if (!drawRich(this, oStroke, false, t, x, y)) return mw === undefined ? oStroke.call(this, t, x, y) : oStroke.call(this, t, x, y, mw);
  };
  P.measureText = function (t) {
    const ps = parts(String(t));
    if (!ps) return oMeasure.call(this, t);
    const s = sizeOf(this);
    const r = oMeasure.call(this, ps.map(p => p.t || '').join(''));
    const w = r.width + ps.filter(p => !p.t).length * s;
    return { width: w, actualBoundingBoxAscent: r.actualBoundingBoxAscent, actualBoundingBoxDescent: r.actualBoundingBoxDescent };
  };

  /* ---------- cartas no estilo do Iso Cards ---------- */
  const CW = 56, CH = 80;
  // mesmas rampas do Iso Cards (sombra, base, luz)
  const RAMP = {
    branco: ['#6e5f3c', '#cdb98a', '#fff1c8'], preto: ['#24163a', '#5b3f7a', '#a383cc'], azul: ['#14325a', '#3f7fc0', '#a6d0f4'],
    verde: ['#1b441b', '#4f9a48', '#ade08d'], vermelho: ['#521910', '#c4472f', '#f4a27a'], incolor: ['#383c40', '#878d93', '#d2d7db'],
  };
  // cor da moldura por carta: fogo/dano direto vermelho, arcano preto, gelo/vento azul, cura verde, luz branca, cinza o resto
  const CARD_COLOR = {
    spark: 'vermelho', embers: 'vermelho', veil: 'incolor', snap: 'preto', chain: 'preto', blizzard: 'azul', blast: 'preto',
    lance: 'branco', tea: 'verde', blessing: 'verde', haste: 'azul', memory: 'branco', swapstep: 'incolor',
  };
  const frames = {};
  function cardFrame(color) {
    if (frames[color]) return frames[color];
    const c = document.createElement('canvas'); c.width = CW; c.height = CH;
    const g = c.getContext('2d');
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const r = RAMP[color] || RAMP.incolor;
    px(0, 0, CW, CH, '#120c08');                                   // contorno
    px(1, 1, CW - 2, CH - 2, r[1]);                                // borda
    px(1, 1, CW - 2, 1, r[2]); px(1, 1, 1, CH - 2, r[2]);          // luz em cima/esquerda
    px(1, CH - 2, CW - 2, 1, r[0]); px(CW - 2, 1, 1, CH - 2, r[0]); // sombra embaixo/direita
    for (let i = 6; i < CW - 6; i += 4) { px(i, 2, 1, 1, r[2]); px(i, CH - 3, 1, 1, r[0]); }
    px(3, 3, 50, 50, '#120c08'); px(4, 4, 48, 48, '#1d1a24');       // janela da arte
    px(3, 54, 50, 23, '#120c08');                                  // placa de texto
    px(4, 55, 48, 21, '#ead7aa'); px(4, 55, 48, 1, '#fff3d4'); px(4, 75, 48, 1, '#b8955f'); px(51, 55, 1, 21, '#c9a971');
    for (const [x, y] of [[1, 1], [CW - 3, 1], [1, CH - 3], [CW - 3, CH - 3]]) { px(x, y, 2, 2, '#f6e7b5'); px(x + 1, y + 1, 1, 1, '#6e5a2c'); }
    return (frames[color] = c);
  }
  /* rótulo curto do que a carta faz (linha de baixo da placa) */
  function kindOf(c) {
    if (c.efeito === 'veu') return 'Escudo';
    if (c.efeito === 'cura') return c.alvo === 'parceiro' ? 'Cura · parceiro' : 'Cura';
    if (c.efeito === 'troca') return 'Troca';
    if (c.alvo === 'todos') return 'Área · todos';
    if (c.alvo === 'salto') return (c.golpes || 1) + ' golpes';
    if (c.alvo === 'um') return '1 alvo';
    return 'Feitiço';
  }
  /* desenha a carta `id` (dados em window.CARDS) num canvas em escala k */
  function drawCard(g, id, k) {
    const c = (window.CARDS || {})[id] || { nome: id, custo: 0 };
    g.imageSmoothingEnabled = false;
    g.drawImage(cardFrame(CARD_COLOR[id]), 0, 0, CW * k, CH * k);
    const art = CARD_IMG[id];
    if (art && art.complete && art.naturalWidth) g.drawImage(art, 4 * k, 4 * k, 48 * k, 48 * k);
    // gema do custo: mana (azul-violeta), como o ícone de mana
    const gx = 9 * k, gy = 9 * k, gr = 6 * k;
    g.fillStyle = '#120c08'; g.beginPath(); g.arc(gx, gy, gr + k, 0, 7); g.fill();
    g.fillStyle = '#4b5fd6'; g.beginPath(); g.arc(gx, gy, gr, 0, 7); g.fill();
    g.fillStyle = '#9fb4ff'; g.fillRect(Math.round(gx - gr / 2), Math.round(gy - gr / 2), k, k);
    g.font = '600 ' + 8 * k + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#fff'; oFill.call(g, String(c.custo), gx, gy + 0.5 * k);
    // nome na placa (encolhe até caber) e o tipo embaixo
    let fs = 7;
    g.font = '600 ' + fs * k + 'px ' + FONT;
    while (fs > 4 && oMeasure.call(g, c.nome).width > 46 * k) { fs -= 0.5; g.font = '600 ' + fs * k + 'px ' + FONT; }
    g.textBaseline = 'top'; g.fillStyle = '#2a1a05';
    oFill.call(g, c.nome, 28 * k, 57 * k);
    g.font = '400 ' + 5 * k + 'px ' + FONT; g.fillStyle = '#6a4a20';
    oFill.call(g, kindOf(c), 28 * k, 67 * k);
  }
  function card(id, k) {
    k = k || 2;
    const cv = document.createElement('canvas');
    cv.width = CW * k; cv.height = CH * k;
    cv.className = 'okw-card'; cv.dataset.card = id;
    drawCard(cv.getContext('2d'), id, k);
    return cv;
  }
  /* redesenha as cartas da tela quando a fonte ou as ilustrações chegam */
  function refreshCards() {
    document.querySelectorAll('canvas.okw-card').forEach(cv => {
      const k = cv.width / CW, g = cv.getContext('2d');
      g.clearRect(0, 0, cv.width, cv.height);
      drawCard(g, cv.dataset.card, k);
    });
  }
  Object.values(CARD_IMG).forEach(im => im.addEventListener('load', refreshCards));
  if (document.fonts) document.fonts.load('600 14px "Pixelify Sans"').then(refreshCards, () => {});

  window.OKW_UI = { icon, iconSrc, cardSrc, card, kindOf, CARD_COLOR, refreshCards };
})();
