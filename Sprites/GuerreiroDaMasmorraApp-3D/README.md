# Texturas 3D do Guerreiro da Masmorra 3D (app)

Paredes dos interiores do protótipo `prototipos/guerreiro-da-masmorra-app-3d/`. O resto do chão (estrada e margens ao ar livre, e o chão dos interiores) vem de [`../GuerreiroDaMasmorraV2-3D/`](../GuerreiroDaMasmorraV2-3D/); personagens, cenário e céu vêm da arte do app em [`../GuerreiroDaMasmorraApp/`](../GuerreiroDaMasmorraApp/).

| Pasta | Conteúdo |
|---|---|
| `cripta/`, `igreja/`, `salao/` | `wall-00..15` (face de parede vista de frente, 64×64): 4 temas por interior, o 4º com tocha. |
| `textures.js` | Por bioma (os 7 do app): de que pasta vem cada tipo de tile (`road`, `verge`, `wall`) e quais variações o jogo usa; `torch` diz qual parede é a tocha. |
| `_tools/baixar.py` | Baixa as 16 paredes de cada interior pelos ids dos lotes do PixelLab (`TILESETS`). |

## Receita

A mesma das paredes do Iso RPG 3D (ver [`../IsoRpg3D/README.md`](../IsoRpg3D/README.md)): `create_tiles_pro` com `square_topdown`, `tile_view: top-down` (a vista de lado dá blocos baixos, não uma face), 64 px, "Flat seamless texture of a vertical wall face filling the entire square edge to edge, no top, no depth, no perspective", 4 itens numerados com a tocha no 4º. A `palette` é a da parede de pedra do app (`../GuerreiroDaMasmorraApp/assets/biomas/wall_stone.png`) mais as cores da chama, e, por tema, o vitral (Igreja) e o vermelho dos estandartes (Salão).
