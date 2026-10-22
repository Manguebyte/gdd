# Texturas 3D do Iso RPG 3D

Piso e parede da masmorra do protótipo `prototipos/iso-rpg-3d/`, que as carrega direto desta pasta. Os personagens e objetos não ficam aqui: o 3D usa os mesmos sprites de [`../IsoRpg/`](../IsoRpg/).

| Pasta | Conteúdo |
|---|---|
| `<bioma>/` (`orcs`, `forest`, `swamp`, `ice`, `volcano`, `academy`) | `floor-00..15` (piso visto de cima, 64×64, emenda nas bordas) e `wall-00..15` (face de parede vista de frente, 64×64). |
| `textures.js` | Quais variações o jogo usa em cada bioma e qual parede é tocha (escolhido à mão: as que destoam ficam de fora). Bioma sem entrada usa os Orcs. |
| `_tools/baixar.py` | Baixa os 16 pisos e as 16 paredes de cada bioma pelos ids dos lotes do PixelLab (`TILESETS`). |

## Receita

`create_tiles_pro` com `tile_type: square_topdown`, `tile_view: top-down`, `tile_size: 64` e `palette` = as cores dos tiles isométricos do mesmo bioma em `../IsoRpg/tiles/<bioma>/` (extraídas por script), para manter a cor do Iso RPG. A referência de estilo (`style_images`) **não** serve aqui: ela copia também o formato de losango dos tiles isométricos.

- **Piso:** "Seamless … floor textures seen from directly above", 4 itens numerados.
- **Parede:** "Flat seamless texture of a vertical wall face filling the entire square edge to edge, no top, no depth, no perspective", 4 itens numerados, o 4º com "an iron wall torch holding an orange flame in the center". Pedir a parede com `tile_view_angle: 0` (vista de lado) dá blocos baixos com o topo à mostra, não uma face; por isso a parede também é pedida como `top-down`.
- Gelo e Academia não têm laranja nos tiles isométricos: a paleta da parede ganha as cores da chama dos Orcs, senão a tocha sai sem fogo.
- Na tocha, prefira a variação sem halo laranja pintado na parede: a luz vem da PointLight do jogo.
