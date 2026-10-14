# Paper Flight — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`PaperFlight.md`](../../PaperFlight.md), usando a pixel art do PixelLab em [`Sprites/PaperFlight/`](../../Sprites/PaperFlight/) direto do lugar. Abra `index.html` no navegador (tela em retrato; no PC fica uma coluna no meio).

## O que tem
- **Estilingue (§3):** encoste, puxe para trás e solte; a direção dá o ângulo (0°–75°) e a distância dá a força (3 m de puxada = força cheia). Puxada curta demais cancela. Só a linha de mira, sem trajetória prevista.
- **Planeio (§4.1), porte do `PaperPlane` do guia:** voa para onde o nariz aponta, troca altura por velocidade, arrasto `drag × v²`, estol que embica a −45°, ângulo de subida crescendo entre o estol e a subida plena, nariz voltando a −8° sem input.
- **Controle (§4.2/§4.3, `FlightInput`):** toque curto e parado (≤ 0,2 s) solta um impulso de vento; deslizar para cima/baixo inclina o nariz (15% da tela = inclinação máxima). No PC também dá para usar Espaço e as setas.
- **Mapas (§6/§7):** Quintal, Parque, Praia, Cidade e Montanha, com metas de 300/600/1000/1500/2500 m, avião, parallax, chão e obstáculos próprios; moedas, correntes de ar para cima e obstáculos que tiram 40% da velocidade (colisão pelo desenho, como o `PolygonCollider2D`), sorteados com semente fixa por mapa.
- **Economia (§5):** dinheiro = distância × Renda + moedas; 5 trilhas de 10 níveis com custo `20 × 1,5^nível`; "Próximo mapa" aparece ao bater a meta e zera upgrades, dinheiro e recorde, com confirmação.
- HUD com distância, meta, recorde, cargas de vento e o velocímetro vermelho/amarelo/verde; tela de resultado; marcador do recorde no cenário; save no `localStorage`.

Todos os números vêm da tabela "Valores de partida" (§12) e do `GameConfig`/`PaperPlane` do guia.

## O que ficou de fora
Áudio, leaderboard, monetização, prestígio e as variações de sprite por nível de Papel/Dobra (tudo Em aberto no GDD).

## Atalhos
Na URL: `#rich` (+5000 de dinheiro), `#m1`…`#m5` (começa no mapa, zerado), `#reset` (apaga o save).
