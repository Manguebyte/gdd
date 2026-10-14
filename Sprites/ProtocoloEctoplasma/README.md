# Protocolo Ectoplasma — sprites PixelLab

Arte do `GDD_Protocolo_Ectoplasma.md` (§4 Estilo Visual): pixel art no ângulo de Stardew Valley (top-down com leve perspectiva), paleta urbana cinza, neon publicitário nos bairros limpos e névoa verde/roxa nos contaminados. Estilo aprovado no teste de 2026-10-14 (`_style-test/cena.png`). Visão geral: `_preview/lote1.png`.

## O que existe

| Pasta | Conteúdo | Tamanho |
|---|---|---|
| `chars/operador/` | O operador da empresa de limpeza nas 8 direções (`south.png`, `north-east.png`…), parado | 48×48 |
| `ghosts/` | `errante` (parado/lento), `assombrado` (foge), `poltergeist` (arremessa objetos), `residual_boss` (chefe de bairro) — os 4 tipos do §7 | 48×48 (chefe 96×96) |
| `traps/` | `armadilha_autonoma` (suga sozinha) e `armadilha_suporte` (atrai/desacelera) — as duas variantes do §6.3 | 32×32 |
| `buildings/casa_contaminada.png` | Casa abandonada com ectoplasma escorrendo | 128×128 |
| `tiles/rua_calcada.png` + `.json` | Tileset Wang asfalto ↔ calçada, 16 tiles de 32 px. O `.json` traz `bounding_box` e cantos de cada tile (use o `bounding_box`, não o nome `wang_N`) | 32 px |
| `map/mapa_cidade.png` | Mapa da cidade (hub, §6.1): bairros limpos em neon, contaminados na névoa | 256×144 |

Ids do PixelLab em `pixellab-assets.json`.

## Receita
- Pro Flash (`create_image_pro_flash`), sem fundo, com `style_image` = `source_image_id` do operador aprovado (`a9c13ccf-5dec-5026-bbd3-497d8f3aa2c6`) e o pedido "copy only the pixel art style… do not draw the operator". Telas grandes (mapa) usam a cena aprovada (`9153f177-fba7-5e64-8b91-c0639a240bc4`) como referência.
- A referência precisa caber na tela do pedido: para sprites de 32×32 use a armadilha (`189ce3a3-b5e0-584f-a806-2e35ff1d7396`).
- Fantasmas: descreva sempre "bright glowing ectoplasm green… purple edges"; sem isso o modelo faz fantasma branco (aconteceu no teste).

## Pendências
1. Animações: caminhada do operador (`animate_character`, template `walking-8-frames`), flutuar dos fantasmas, feixe de sucção.
2. Interior de casa (tileset de piso de madeira ↔ parede) e props de cômodo para o Poltergeist arremessar.
3. Variações "limpas" da casa e do mapa (bairro valorizado, §6.1) e ícones de HUD (plasma, ameaça).
