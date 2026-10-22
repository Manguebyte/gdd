# Texturas 3D do Guerreiro da Masmorra 3D

Chão da estrada e das margens do protótipo `prototipos/guerreiro-da-masmorra-v2-3d/`, que as carrega direto desta pasta. Personagens, cenário e céu continuam vindo da arte do V2 em [`../GuerreiroDaMasmorraV2/`](../GuerreiroDaMasmorraV2/).

| Pasta | Conteúdo |
|---|---|
| `<bioma>/` (`castelo`, `floresta`, `cemiterio`, `ruinas`, os biomas do V2) | `road-00..15` (estrada vista de cima, 64×64) e `verge-00..15` (chão das margens, 64×64). |
| `textures.js` | Quais variações o jogo usa em cada bioma (escolhido à mão; índice repetido sai mais vezes). |
| `_tools/baixar.py` | Baixa as 16 estradas e as 16 margens de cada bioma pelos ids dos lotes do PixelLab (`TILESETS`). |

## Receita

A mesma das texturas do Iso RPG 3D (ver [`../IsoRpg3D/README.md`](../IsoRpg3D/README.md)): `create_tiles_pro` com `square_topdown`, `tile_view: top-down`, 64 px e `palette` = as cores das folhas de chão do V2 em `../GuerreiroDaMasmorraV2/assets/biomas/` (Castelo = estrada de pedra, Floresta = `forest_land`, Cemitério = `cemetery_slabs`, Ruínas = `cracked_stone_from_the_ruins`). Para a margem, um lote à parte por bioma, com só os tons de terra e grama da mesma folha.

- Os tiles vêm com 1 px de contorno escuro na borda; o jogo corta esse pixel ao carregar, senão aparece uma grade no chão.
- Variações de tons muito diferentes lado a lado viram um xadrez visível: no `textures.js`, cada bioma fica só com uma família de tons (as outras saem raramente ou nunca).
