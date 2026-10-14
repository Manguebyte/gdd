# RaceLegenda — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da variante RaceLegenda (Parte 4) do [`RallySurvive.md`](../../RallySurvive.md), sobre o Core da Parte 1 em [`../rally-core/`](../rally-core/). Arte em pixel art gerada no PixelLab, em [`Sprites/RaceLegenda/`](../../Sprites/RaceLegenda/). Abra `index.html` no navegador.

## O que tem
- **Circuito fechado**, largada = chegada, com **3 voltas** (Circuito da Serra) ou **2** (Autódromo Litoral). A volta só conta se o carro passou pela metade do circuito antes de cruzar a linha.
- **Setup no box, uma vez só antes da corrida** (Parte 4 §Assistência): 2 sliders.
  - **Asa** (0–100): mais asa = mais grip em curva (70% → 125%), menos velocidade máxima (100% → 85%).
  - **Balanço de freio** (40–70% na frente): mais na frente = frenagem mais forte; acima de 55% a frenagem forte **trava as rodas** e o carro segue na direção em que vinha (marca de pneu e fumaça).
- **Corte de pista sem penalidade artificial** (Parte 4 §Corte de pista): a área válida é o asfalto + acostamento/zebra; fora dela, na grama, o grip cai para 0,45 e a velocidade para 50%. Nada de tempo extra nem volta anulada.
- **Largada com 5 luzes** vermelhas; o cronômetro começa quando apagam.
- **Dois modos** (Parte 4 §Objetivo): **Contra rivais** (posição de chegada, histórico de vitórias por circuito) e **Solo · contrarrelógio** (ranking de tempo total + melhor volta).
- HUD com volta, posição, tempo da volta atual, melhor volta, velocidade e progresso da volta. `ChevronGuide` e movimento do Core.

## Escolhas do protótipo onde o GDD diz "Em aberto"
- **Multiplayer:** o GDD pede corrida em tempo real via Firebase (sala, sincronismo — "Em aberto"). O protótipo não tem servidor: **3 rivais da máquina** ocupam o lugar dos outros jogadores. Eles usam o mesmo `CarController` do jogador (miram num ponto à frente no traçado e aliviam antes das curvas pela curvatura) — trocar a IA por posições vindas da rede não muda o resto.
- **Cor dos rivais:** o mesmo sprite do F1, com o vermelho trocado por verde, azul e amarelo no carregamento (`RC.recolor`). Aberto direto do disco (`file://`) o navegador não deixa ler os pixels e os rivais ficam vermelhos; pelo site ou por um servidor local (`python -m http.server`) saem coloridos.
- **Ranking:** local (`localStorage`), no lugar do Firebase.
- **Arte:** pixel art 3/4 no estilo do `rally2d` (ver a nota "Em aberto" na Parte 1 §4).

## Atalhos
Na URL: `#serra` ou `#litoral` (larga direto, com o último setup salvo), `#solo` junto para o contrarrelógio (ex.: `#serra,solo`), `#reset` (apaga ranking e histórico). Na corrida: `ESC` volta ao menu, `Shift+R` reinicia.
