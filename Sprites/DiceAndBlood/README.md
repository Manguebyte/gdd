# DiceAndBlood — sprites PixelLab

Arte do `DiceAndBlood.md` (§4: pixel art 8/16-bit). Direção aprovada no teste de 2026-10-14 (`_style-test/cena.png`, recorte do tabuleiro em `_preview/tabuleiro_referencia.png`): masmorra 16-bit escura em azul-acinzentado, manchas e detalhes vermelho-sangue, contorno escuro nítido. Personagens em 3/4 sobre o tabuleiro visto de cima. Visão geral: `_preview/lote1.png`.

## O que existe (MVP da §8: 1 herói, 2–3 monstros, 1 tabuleiro)

| Pasta | Conteúdo | Tamanho |
|---|---|---|
| `chars/heroi_cavaleiro.png` | O herói | 32×32 |
| `monsters/` | `esqueleto`, `goblin`, `morcego` | 32×32 |
| `tiles/chao_pedra.png` | Casa do tabuleiro (repete em 8×8) | 32×32 |
| `tiles/pedra_obstaculo.png` | Obstáculo que bloqueia a casa | 32×32 |
| `ui/dado_1.png` … `dado_6.png` | Faces do d6 de frente, para mostrar o resultado da rolagem (§5) | 32×32 |
| `ui/dado_icone.png` | O dado em 3/4 aprovado no teste (ícone/decoração) | 32×32 |

Ids do PixelLab em `pixellab-assets.json`.

## Receita
- Pro Flash, sem fundo, `style_image` = herói aprovado (`f4358bb4-82b1-5311-a5ae-19dc22b5a39a`), pedindo "same pixel art style, outline and palette as this knight; draw a different character".
- **Faces do dado não vêm do PixelLab:** o modelo não conta pontos (as 6 faces geradas saíram quase iguais). `_tools/draw_dice.py` desenha as 6 faces com a paleta tirada de `ui/dado_icone.png`; rode de novo para mudar o tamanho ou as cores.

## Pendências
1. Animações (parado, ataque, dano) e a animação do dado rolando.
2. Variações de chão (sangue, rachaduras) e destaque de casa alcançável/alvo (pode ser feito em código, como no teste).
3. Tema dos biomas das runs seguintes (pós-MVP).
