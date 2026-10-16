# Arte PixelLab do Iso RPG

Sprites do protótipo `prototipos/iso-rpg/`, que os carrega direto desta pasta (renomear um PNG quebra o jogo; aquele objeto vira um retângulo). Tudo é gerado e baixado por `_tools/baixar.py`.

| Pasta | Conteúdo |
|---|---|
| `hero/` e uma pasta por monstro (`pawn/`, `orc/`, `yeti/`, `archmage/`…; a lista está em `CHARS` no script) | Folhas horizontais `idle`, `walk`, `attack`, `death` (quadros quadrados) e `pose.png`. Só a direção usada: o herói olha para o **nordeste**, os monstros para o **sudoeste**. O lobo é quadrúpede (template `dog`); o Espírito do Gelo flutua e não tem `walk` (desliza com o `idle`). |
| `slime/`, `slime2/`, `slimeking/` | Gosmas do treinamento: só `idle` e `attack` (sem `walk` e sem `death`: deslizam no idle e derretem por código). Feitas com `create_image_pro_flash` + `animate_image` (`IMAGE_CHARS` no script); `slime2` é a `slime` recolorida para azul (`RECOLOR_CHARS`). |
| `boss/` | O Cavaleiro: as mesmas folhas em `<animação>-red/black/purple/yellow.png` (as 3 últimas recoloridas pelo script a partir da vermelha). |
| `tiles/<bioma>/` (`orcs`, `forest`, `swamp`, `ice`, `volcano`, `academy`) | `floor-00..15` (piso fino, 64×64, losango de 64×32) e `wall-00..15` (bloco de parede, 64×64, 30 px de altura). Quais tiles aparecem e com que peso está em `BIOMES` no `game.js` (`floorPick`, `wallPick`); alguns ficaram de fora por destoarem (névoa translúcida, tijolos de outro estilo, tapetes que não emendam). |
| `decor/` | Objetos de cenário, com prefixo do bioma (`ice-`, `forest-`, `swamp-`, `volcano-`, `academy-`; os sem prefixo são dos Orcs). Cada bioma diz em `BIOMES.decor` qual objeto vai em cada lugar do corredor; o baú é o mesmo em todos. |
| `sprites.js` | Gerado. Tamanho dos quadros e âncora (os pés) de cada animação, os tiles e a chama das paredes com tocha. |
| `pixellab-assets.json` | Gerado. De qual personagem/tileset/job do PixelLab veio cada coisa. |

## Estilo

Pixel art com **contorno escuro seletivo, sombreado contido e luz do alto à esquerda**, a mesma do Fury Hauler. Os personagens e objetos foram gerados com uma folha de sprites do Fury Hauler como referência de estilo (`create_image_pro_flash` com `style_image`, copiando contorno, detalhe e sombreado, mas não a paleta). Os sprites não têm sombra: o jogo desenha uma elipse no chão.

**Escala:** 1 px de arte = 3 px da tela lógica de 720 px de altura. Personagem comum ≈ 48 px de altura; os chefes ≈ 80–90 px (quase o dobro, de propósito). Os chefes usaram a pose do Cavaleiro como referência de estilo; os comuns, a do herói.

## Receita

1. **Pose de frente** (`south`, olhando para a câmera): `create_image_pro_flash`, 64×64 (chefe 96×96), `no_background`, `style_image` = folha do Fury Hauler 64×64 (raider, pedra, pneu). O pedido termina com *"Clean pixel art, selective dark outline, light from upper-left, no ground, no cast shadow, transparent background."*
2. **8 direções:** `create_character` com `mode: v3` e `reference_image_url` = a pose do passo 1.
3. **Animações**, só na direção usada: `breathing-idle`, `walking-6-frames` e `falling-back-death` por template; o ataque por `v3` com `action_description`. O ataque do Arqueiro foi refeito com o nome `shoot` (o script usa o `shoot` no lugar do `attack`, `ALIAS`), mas nas duas tentativas o arco apontou para a direita da tela; por isso o script espelha essa folha (`MIRROR`) e o tiro mira no herói.
4. **Tiles:** um tile avulso de `create_isometric_tile` serviu de estilo para `create_tiles_pro` (16 variações de piso e 16 de parede, com a mesma paleta). **Bioma novo:** `create_tiles_pro` com `style_images` = `tiles/orcs/floor-00` (ou `wall-00`) e `style_options.color_palette = false`, para manter forma e contorno com a paleta do bioma; peça a tocha com "orange flame" num dos 4 itens, que o script acha a chama sozinho. Registre os dois ids em `TILESETS` no script. Tocha na face esquerda do bloco fica escondida atrás do vizinho, então o script espelha esses blocos; onde outras paredes também brilham laranja (lava, dourado), `TORCH_ONLY` diz quais blocos são tocha.
5. **Baixar:** `python _tools/baixar.py` (personagens, tiles, objetos de `_tools/decor.json`, cores do chefe e `sprites.js`). `--local` só regera o `sprites.js` e as cores. Personagem com animação ainda gerando devolve 423; o script pula e mantém os PNGs que já tem.
