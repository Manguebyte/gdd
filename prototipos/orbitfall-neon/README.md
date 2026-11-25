# Orbitfall 2D Neon — teste de visual neon 8-bit

Teste do [Orbitfall](../8-bit-armageddon/) com cara de **fliperama neon dos anos 80**: fundo preto com grade, naves de poucos pixels em cores saturadas e brilho em volta de tudo. Não tem GDD próprio; as regras são as do [`GDD_8-Bit_Armageddon.md`](../../GDD_8-Bit_Armageddon.md), e o badge mostra a versão desse jogo.

Abra `index.html` direto no navegador (sem build e sem servidor).

## De onde veio
É uma **cópia** de [`../8-bit-armageddon/`](../8-bit-armageddon/): o `game.js` evolui por conta própria (correções não passam de um para o outro), e o save fica numa chave própria (`orbitfallNeon.save.v1`).

## O que mudou
- **`neon-art.js`** desenha toda a arte do mundo em código (inimigos, planetas, Satellites, tiros, laser, explosões, escudo, setas, fundo). Cada folha tem **o mesmo layout de células** da PNG original de `Sprites/8-Bit-Armageddon/`, então o `game.js` continua com os mesmos `drawImage`: o `loadImages()` só chama `NEON.build(IMG, CORES)`.
- **Planetas:** globo "wireframe" (linhas de latitude e longitude em neon, continentes pontilhados), um esquema de cores por Skin.
- **Brilho:** o `render()` termina com `NEON.bloom`, que reduz a tela pela metade 4 vezes e soma as versões borradas em modo `lighter` (funciona em qualquer navegador, sem `ctx.filter`).
- **Quadrants, Reflector e anéis** viraram fileiras de pixels (`pixArc`), sem antisserrilhado.
- **`neon.css`** troca as molduras em PNG por bordas neon de 1 px com brilho. A fonte `m5x7` e os ícones da UI continuam vindo de `Sprites/8-Bit-Armageddon/`.
- **Settings:** *Brilho neon* (liga/desliga o bloom; ajuda em celular fraco) e *Scanlines CRT* (camada de linhas e vinheta por CSS).

## Atalhos de desenvolvimento
Os mesmos do Orbitfall, depois de `index.html`: `#play`, `#play,offense`, `#play,rich`, `#play,wave=10`, `#play,sim=40`, `#play,invasion`, `#cores`, `#achievements`, `#settings`. Teclado: `Esc`/`P` pausa, `+`/`-` zoom.
