# Craft Dice — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`CraftDice.md`](../../CraftDice.md), usando a pixel art do PixelLab em [`Sprites/CraftDice/`](../../Sprites/CraftDice/) direto do lugar. Abra `index.html` no navegador.

## O que tem
- **Exploração (§8, §11):** mapa fixo feito à mão (ilha carmesim no vazio roxo, autotile Wang de cantos do `tiles/area1-void-ground`), WASD/setas no PC e joystick virtual no toque, props sólidos, ordem de desenho por altura.
- **Monstros parados (§6):** Esqueleto, Cão Sombrio e o chefe Cavaleiro Caído, com os HP, dano, padrão de intenção e Almas da tabela da §13. Encostar abre a batalha.
- **Batalha (§4):** intenção do monstro visível, rolagem com a animação de girar de cada tipo, marcar dados e re-rolar (1 por rodada), feitiços pagos com os pontos do Dado de Feitiço, resolução com o jogador agindo primeiro (Parry antes da Esquiva, contra-ataque podendo matar no meio).
- **Feitiços (§5):** Poção, Re-rolar, Fraqueza e Golpe Duplo com custo e preço da tabela.
- **Bonfire (§7):** descansar (cura tudo e faz os monstros comuns renascerem, o chefe não), aprender feitiços, forjar dados escolhendo cada face (preço `5 + 3 × soma do valor de forja`) e escolher até 5 dados para a mão.
- **Run (§9, §12):** começa com 2 Ataque + 1 Defesa; vencer o chefe termina a run em vitória; morrer apaga tudo. Save local ao entrar e vencer batalhas e em cada ação da bonfire; "Continuar run" no título.

Todos os números são os placeholders de MVP da §13.

## Escolhas do protótipo
- Uma área só, com o Cavaleiro Caído como chefe final, como no guia Unity (Fase 7.2). O portão do chefe é decorativo.
- A bonfire abre ao encostar e só reabre depois de se afastar.

## Atalhos
Na URL: `#go` (pula o título), `#rich` (+300 Almas na run), `#reset` (apaga a run salva).
