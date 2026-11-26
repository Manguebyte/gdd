// pixel.js — ícones 8-bit e brilho neon do Reino 8bit.
//
// POR QUE: o Reinos Hex usa emoji, que mudam de cara em cada aparelho e não
// combinam com fliperama neon. Aqui todo ícone é uma grade 9×9 escrita em
// código, desenhada em pixel grande, com a mesma cara em qualquer tela.
// ESTRATÉGIA: cada ícone é uma lista de 9 linhas; cada letra é uma cor da
// PALETA e '.' é vazio. O ícone vira um canvas 9×9 uma vez só (cache por nome
// e cor) e depois é ampliado sem suavizar. `tint` pinta todos os pixels de uma
// cor só (ex.: a espada do saqueador em laranja). O mesmo canvas vira data URL
// para os <img> do HUD. `bloom` é o brilho: o quadro de baixa resolução é
// desenhado de novo por cima, borrado e somado à luz ("lighter").
(() => {
  'use strict';
  const PALETA = {
    g: '#39ff6a', // verde neon (floresta)
    o: '#ff9a3c', // laranja (tronco, cabo)
    w: '#f4f4ff', // branco aceso
    c: '#7fdcff', // ciano claro (pedra)
    C: '#2f86d6', // azul (sombra da pedra)
    y: '#ffd23f', // amarelo (ouro, torre)
    l: '#c6ff3d', // verde-limão (pasto)
    m: '#e04bff', // magenta (monstro)
    r: '#ff3b5c', // vermelho (olho)
  };

  const ICONES = {
    arvore: [
      '....g....',
      '...ggg...',
      '..ggggg..',
      '...ggg...',
      '..ggggg..',
      '.ggggggg.',
      'ggggggggg',
      '....o....',
      '....o....',
    ],
    montanha: [
      '.........',
      '....w....',
      '...wcw...',
      '..wcccw..',
      '..ccccc..',
      '.cccCccc.',
      '.ccCCCcc.',
      'cccCCCccc',
      '.........',
    ],
    picareta: [
      '..yyyyy..',
      '.yy.o.yy.',
      'yy..o..yy',
      'y...o...y',
      '....o....',
      '....o....',
      '....o....',
      '....o....',
      '.........',
    ],
    ovelha: [
      '.........',
      '...www...',
      '.wwwwww..',
      'wwwwwwwll',
      'wwwwwwwlr',
      '.wwwwww..',
      '.l.l.l.l.',
      '.l.l.l.l.',
      '.........',
    ],
    castelo: [
      'w.w.w.w.w',
      'wwwwwwwww',
      '.wwwwwww.',
      '.w.www.w.',
      '.wwwwwww.',
      '.wwwwwww.',
      '.www.www.',
      '.ww...ww.',
      '.ww...ww.',
    ],
    torre: [
      '..y.y.y..',
      '..yyyyy..',
      '...yyy...',
      '...y.y...',
      '...yyy...',
      '...yyy...',
      '...yyy...',
      '..yyyyy..',
      '.........',
    ],
    monstro: [
      'm.......m',
      'mm.....mm',
      '.mmmmmmm.',
      'mmrmmmrmm',
      'mmmmmmmmm',
      '.mmwmwmm.',
      '.mmmmmmm.',
      '..m...m..',
      '.........',
    ],
    espada: [
      '.......ww',
      '......www',
      '.....www.',
      '.o..www..',
      '..oww....',
      '..oo.....',
      '.o..o....',
      'o........',
      '.........',
    ],
    moeda: [
      '...yyy...',
      '..yyyyy..',
      '.yyoyoyy.',
      '.yyoyoyy.',
      '.yyoyoyy.',
      '.yyyyyyy.',
      '..yyyyy..',
      '...yyy...',
      '.........',
    ],
    tronco: [
      '.........',
      '.........',
      '.ooooooo.',
      'oooooooyo',
      'ooooooyoy',
      'oooooooyo',
      '.ooooooo.',
      '.........',
      '.........',
    ],
    trigo: [
      '....l....',
      '...lll...',
      '..l.l.l..',
      '...lll...',
      '..l.l.l..',
      '...lll...',
      '....l....',
      '....l....',
      '....l....',
    ],
    hexagono: [
      '...ccc...',
      '..c...c..',
      '.c.....c.',
      '.c.....c.',
      '.c.....c.',
      '..c...c..',
      '...ccc...',
      '.........',
      '.........',
    ],
  };

  const cache = new Map();
  // Canvas 9×9 do ícone (com cache).
  function sprite(nome, tint) {
    const k = nome + '|' + (tint || '');
    if (cache.has(k)) return cache.get(k);
    const rows = ICONES[nome];
    const cv = document.createElement('canvas');
    cv.width = 9; cv.height = 9;
    const g = cv.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = tint || PALETA[ch] || '#fff';
      g.fillRect(x, y, 1, 1);
    }));
    cache.set(k, cv);
    return cv;
  }

  // Desenha o ícone centrado em (cx, cy) com `size` de lado.
  function draw(ctx, nome, cx, cy, size, tint) {
    if (!ICONES[nome]) return;
    const old = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite(nome, tint), Math.round(cx - size / 2), Math.round(cy - size / 2), size, size);
    ctx.imageSmoothingEnabled = old;
  }

  // <img> para o HUD e os painéis (HTML).
  const img = (nome, tint) => ICONES[nome]
    ? `<img class="px" src="${sprite(nome, tint).toDataURL()}" alt="">` : '';

  // POR QUE: neon só parece neon se a luz "vaza" em volta das linhas.
  // ESTRATÉGIA: duas cópias borradas do quadro somadas com "lighter"; uma
  // larga e fraca, outra curta e forte. `forca` 0 desliga.
  function bloom(dst, src, w, h, forca) {
    if (!(forca > 0)) return;
    dst.save();
    dst.globalCompositeOperation = 'lighter';
    dst.imageSmoothingEnabled = true;
    dst.filter = 'blur(10px)'; dst.globalAlpha = 0.55 * forca; dst.drawImage(src, 0, 0, w, h);
    dst.filter = 'blur(3px)'; dst.globalAlpha = 0.45 * forca; dst.drawImage(src, 0, 0, w, h);
    dst.restore();
  }

  window.PIXEL = { ICONES, PALETA, sprite, draw, img, bloom };
})();
