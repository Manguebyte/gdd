# Orbitfall Iso 3D — teste em 3D low-poly

Teste do [Orbitfall Iso](../8-bit-armageddon-iso/) com o mundo em **3D low-poly**: o planeta é uma esfera facetada com relevo, os inimigos são discos voadores e naves modelados por código, e as sombras e o laser da Mothership são de verdade. Não tem GDD próprio; as regras são as do [`GDD_8-Bit_Armageddon_Iso.md`](../../GDD_8-Bit_Armageddon_Iso.md), e o badge mostra a versão desse jogo.

Abra `index.html` **por um servidor local** (ex.: `npx serve` na raiz do repositório). O Three.js vem do jsDelivr por `importmap`, sem build, e o navegador não carrega módulos abertos direto do disco (`file://`). Sem o Three.js (sem internet ou sem servidor), o jogo cai no desenho 2D do Orbitfall Iso.

## De onde veio
É uma **cópia** de [`../8-bit-armageddon-iso/`](../8-bit-armageddon-iso/): o `game.js` e o `style.css` evoluem por conta própria (correções não passam de um para o outro), e o save fica numa chave própria (`armageddonIso3d.save.v1`). No `game.js` só mudou o `render()`: ele chama `window.R3D.draw(ox, oy, z)` e só desenha no canvas 2D os números de dano e as setas dos Spawn Sectors (`drawOverlay`). O desenho 2D antigo virou `drawWorld2D`, usado quando o 3D não carrega.

## Como o 3D funciona (`render3d.js`)
- **Câmera fixa no ângulo iso.** Câmera ortográfica calibrada para projetar o chão exatamente como a função `W(x, y)` do Iso (1 u no eixo x vira (+12, −6) px, no eixo y vira (−12, −6) px). Por isso o HUD, o zoom, o deslize da gaveta, o tremor de tela e o toque que escolhe o Spawn Sector no Invasion funcionam sem mudança.
- **Mesmos dois níveis do Iso.** Planeta, inimigos, Satellites e tiros no plano de voo; o grid 16 px (≈1,09 u) abaixo dele, em tiles baixos que somem nas bordas.
- **Sombras de verdade.** Uma luz a pino é a única que faz sombra, então cada sombra cai logo embaixo da coisa, como a sombra do Iso: mostra em qual Quadrant ela está. Outra luz, de cima à esquerda (GDD §6.2), dá o volume das facetas.
- **Arte por código, sem sprites.** Os 9 planetas (3 Planet Cores × 3 Skins) são o mesmo icosaedro com relevo e cores de cada Skin (`SKINS`); inimigos em lavanda e roxo, Satellites em cinza com a luz laranja piscando, como na paleta "meu × deles" do GDD. Explosões são bolas facetadas que esfriam, com lascas.
- O HUD, os ícones e a fonte continuam sendo a pixel art de [`Sprites/8-Bit-Armageddon/`](../../Sprites/8-Bit-Armageddon/).

## Atalhos de desenvolvimento
Os mesmos do Orbitfall Iso, depois de `index.html`: `#play`, `#play,offense`, `#play,rich`, `#play,sats`, `#play,wave=10`, `#play,sim=40`, `#play,invasion`, `#play,invasion,planet=5`, `#cores`, `#achievements`, `#settings`. Teclado: `Esc`/`P` pausa, `+`/`-` zoom.
