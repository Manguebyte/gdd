# Orbitfall Iso Neon — teste de visual neon 8-bit

Teste do [Orbitfall Iso](../8-bit-armageddon-iso/) com o visual de fliperama neon do [Orbitfall 2D Neon](../orbitfall-neon/): o planeta flutua sobre uma grade isométrica neon (estilo Tron), com naves de poucos pixels em cores saturadas e brilho em volta de tudo. Não tem GDD próprio; as regras são as do [`GDD_8-Bit_Armageddon_Iso.md`](../../GDD_8-Bit_Armageddon_Iso.md), e o badge mostra a versão desse jogo.

Abra `index.html` direto no navegador (sem build e sem servidor).

## De onde veio
É uma **cópia** de [`../8-bit-armageddon-iso/`](../8-bit-armageddon-iso/): o `game.js` evolui por conta própria (correções não passam de um para o outro), e o save fica numa chave própria (`orbitfallIsoNeon.save.v1`). O `neon-art.js` e o `neon.css` são cópias dos do Orbitfall 2D Neon, também independentes.

## O que mudou
- **`neon-art.js`** desenha toda a arte do mundo em código, com **o mesmo layout de células** das PNGs (`Sprites/8-Bit-Armageddon/` e o chão de `Sprites/8-Bit-Armageddon-Iso/Grid/`), então o `game.js` continua com os mesmos `drawImage`. Em relação ao 2D Neon, ganhou o tile do chão (`gridTile()`: só o contorno do losango, no mesmo encaixe de `SPR_Grid_Floor.png`) e o fundo perdeu a grade quadrada.
- **Brilho:** o `render()` termina com `NEON.bloom`.
- **Quadrants e Reflector:** as bordas viraram fileiras de pixels projetadas no chão ou no plano de voo (`pixArcFloor`). As sombras ficaram mais escuras, para apagar a grade embaixo de cada coisa.
- **`neon.css`:** molduras neon no lugar das PNGs. A fonte `m5x7` e os ícones da UI continuam vindo de `Sprites/8-Bit-Armageddon/`.
- **Settings:** *Brilho neon* e *Scanlines CRT*.

## Atalhos de desenvolvimento
Os mesmos do Orbitfall Iso, depois de `index.html`: `#play`, `#play,offense`, `#play,rich`, `#play,wave=10`, `#play,sim=40`, `#play,invasion`, `#play,invasion,planet=5`, `#cores`, `#achievements`, `#settings`. Teclado: `Esc`/`P` pausa, `+`/`-` zoom.
