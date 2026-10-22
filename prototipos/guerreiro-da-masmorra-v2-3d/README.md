# Guerreiro da Masmorra 3D — protótipo web (JavaScript + Three.js)

O [Guerreiro da Masmorra v2](../guerreiro-da-masmorra-v2/) com a batalha em **3D no estilo HD-2D**, como o [Iso RPG 3D](../iso-rpg-3d/): estrada e margens são chão 3D, o céu do V2 fica ao fundo, e personagens e cenário viram placas iluminadas pelo luar e por uma luz quente no miolo da luta, com sombras, bloom, tilt-shift e vinheta. As regras e as telas são as do V2 ([`GuerreiroDaMasmorraV2.md`](../../GuerreiroDaMasmorraV2.md)). Tela em retrato. Abra por um servidor http (o Three.js vem do jsDelivr por `importmap`; sem build).

**Cópia separada:** o `index.html` daqui é uma cópia do `../guerreiro-da-masmorra-v2/index.html` (que é gerado por `Sprites/GuerreiroDaMasmorraV2/_tools/importar.py`) com poucos ganchos editados à mão. Rodar o script de importação de novo **não** atualiza esta pasta: mudanças do V2 precisam ser copiadas e os ganchos refeitos. O save também é separado (`guerreiro-v2-3d-save-v1`).

## Os ganchos no `index.html`
- `#cv3d` (cena 3D) embaixo do `#cv`, que continua por cima, transparente, recebendo os toques.
- `ctx` virou `let`: o renderer troca o contexto por um instante para desenhar cada boneco no canvas da placa dele.
- `drawActor(a, t, mode)`: `'sprite'` desenha só o boneco; `'hud'` só barras, nomes e marcadores; sem `mode`, tudo (como no V2).
- `draw(t)` chama `window.R3D.draw(t)` quando o Three.js carregou; senão desenha o 2D de sempre (se o CDN falhar, o jogo continua jogável em 2D). Explosões, pedrada, dinamite e números foram para `drawOverlay(t)`.

## Como o 3D funciona (`render3d.js`)
- **Tudo continua em coordenadas de tela.** A câmera 3D é calibrada para que o chão projete exatamente o trapézio da estrada do V2 (`roadGeom`). Por isso posições, botes, toques e a mira da pedrada não mudaram.
- **Placas:** cada personagem, objeto da margem e item de cenário vira uma placa virada para a câmera, com a base no ponto do chão sob os pés e o tamanho que ocupa os mesmos pixels do 2D. No pulo do herói, os pés ficam no chão e a subida na tela vira altura.
- **Bonecos:** o próprio `drawActor` do V2 desenha cada personagem num canvas que vira a textura da placa, então as animações (inclusive as de 8 direções) e os filtros de dano, morte e fúria são os do V2.
- **Chão:** tiles de estrada e de margem com texturas do PixelLab por bioma em [`Sprites/GuerreiroDaMasmorraV2-3D/`](../../Sprites/GuerreiroDaMasmorraV2-3D/), que deslizam para a câmera na marcha entre ondas (`roadScroll`).
- **Céu:** o `drawSky` do V2 (estrelas, astro, morros, névoa) desenhado num canvas que vira o fundo da cena.

## Atalhos
Os do V2: `#batalha` entra direto na masmorra (num save novo, abre o Campo de Treinamento).
