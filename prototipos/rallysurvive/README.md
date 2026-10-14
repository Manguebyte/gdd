# RallySurvive — protótipo web (JavaScript)

Versão jogável em HTML/JS puro do Core (Parte 1) e da variante RallySurvive (Parte 2) do [`RallySurvive.md`](../../RallySurvive.md), usando a arte vetorial flat do SpriteCook em [`Sprites/Rally2D/`](../../Sprites/Rally2D/) direto do lugar. Abra `index.html` no navegador.

## O que tem
- **Movimento (Parte 1 §2, guia Parte 8 §1.2–1.4):** o carro vai na direção do cursor; a velocidade vem da distância com a curva `t²`, com os valores do `CarController` do guia (`maxSpeed` 8, zona morta 0,3, velocidade máxima a 6 unidades, `steeringResponsiveness` 20, `rotationSpeed` 10).
- **Grip por terreno (§3):** Deserto 1,0; Floresta 1,0 com 6 poças de grip 0,5; Gelo 0,3 na pista inteira. A barra de velocidade mostra a velocidade real (pós-grip), então ela fica "atrás" do pedido em pista escorregadia.
- **`ChevronGuide`:** setas entre o carro e o cursor (sprite `ui/chevron.png` tingido), verdes quando o cursor pede mais velocidade do que o carro tem, vermelhas quando pede menos; a quantidade cresce com a diferença (até 5).
- **Regras da variante (Parte 2):** sair do traçado mostra "Você Bateu!" (ESC volta ao grid, R repete); na chegada, tempo final, nome de até 5 caracteres, "Repetir Pista" e "Voltar ao Menu".
- **Menu:** as 3 pistas liberadas; tocar mostra o ranking e troca o fundo para a pista; **segurar 1,5 s** larga.
- **Fantasma do recorde pessoal** (carro azul translúcido), poeira/respingo, marcas de derrapagem, chuva na Floresta, cenário e público de `deco/` e `props/`.

## Escolhas do protótipo onde o GDD diz "Em aberto"
- **Ranking:** local, no `localStorage` (top 10 por pista), no lugar do Firebase da Parte 12. Nome vazio vira `PLAYR`; o último nome fica lembrado.
- **Estrada:** desenhada como uma faixa sobre o traçado usando o miolo de estrada e de terreno recortados dos tilesets de 15 peças (`CROPS` no `game.js`), sem o autotile dual-grid.
- **Escala:** 1 unidade = 64 px na tela; carro com 1,35 unidade. Traçados em `TRACKS` (pontos de controle suavizados).
- O cronômetro começa quando o carro sai do grid.

## Atalhos
Na URL: `#deserto`, `#floresta` ou `#gelo` (larga direto), `#reset` (apaga ranking e fantasmas).
