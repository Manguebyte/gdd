# rally-core — Core compartilhado da franquia Rally (protótipos web)

O que a Parte 1 do [`RallySurvive.md`](../../RallySurvive.md) diz que é igual nos quatro jogos, num lugar só, para os protótipos de [Navigation Expert](../navigation-expert/), [RaceLegenda](../race-legenda/) e [Street Legends](../street-legends/). Não é um jogo: cada protótipo carrega `rally-core.js` e `rally.css` antes do seu `game.js`. O protótipo do [RallySurvive](../rallysurvive/) é anterior e continua independente (arte vetorial do `Sprites/Rally2D/`).

## O que tem (`RC.*`)
- **`drive`** — o `CarController` (Parte 8 §1.2–1.4): velocidade pela distância até o cursor com a curva `t²`, grip do terreno, teto de velocidade por chão, e uma resposta de freio própria opcional (`brakeResponse`, usada pelos freios do RaceLegenda e do Street Legends).
- **`collide`** — obstáculo reduz a velocidade bruscamente sem frear o carro de vez (Core §2); círculos e retângulos.
- **`drawChevrons`** — o `ChevronGuide`: setas de pixel entre carro e cursor, verdes acelerando, vermelhas freando, 1 a 5 conforme a diferença.
- **`drawCar` / `carSet` / `recolor`** — sprite de 8 direções do PixelLab (escolhe o quadro mais perto do ângulo e gira só o resto, no máximo 22,5°) e troca de cor da carroceria por matiz.
- **`drawProp` / `drawFlat` / `shadow` / `pattern`** — objetos em pé (3/4) com a sombra desenhada pelo jogo, chão visto de cima e padrão repetido dos tiles.
- **`smoothPath` / `nearest`** — traçados por pontos de controle (Catmull-Rom), o mesmo formato nos jogos (Core §9).
- **`drawMinimap` / `drawGuideArrow`** — minimapa e seta de navegação (Navigation Expert e Street Legends).
- **`store` / `finishDialog` / `boardHtml` / `holdButton`** — ranking local, tela de chegada com nome de 5 letras e o "segurar para largar".

Escala: 1 unidade de mundo = 48 px; a arte de 128 px do PixelLab aparece a 0,7 (≈ 90 px).
