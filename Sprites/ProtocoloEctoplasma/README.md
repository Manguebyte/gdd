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
| `interior/` | Etapas de interior (§6.6): `piso_madeira` e `piso_concreto` (repetem em grade), `parede_sala` e `parede_porao` (repetem na horizontal). Originais sem tratamento em `interior/_raw/` | 64×64 / 128×64 |
| `props/` | Móveis e objetos das etapas de interior: `sofa`, `poltrona`, `piano`, `mesa`, `cadeira`, `abajur`, `tapete`, `cama`, `estante`, `geladeira`, `caixas`, `caldeira`, `escada_descida` (saída para o porão), `poca_ecto` (gosma no chão) e `bilhete` (memória coletável, §3.2) | 32 a 96 px |

Ids do PixelLab em `pixellab-assets.json`.

## Receita
- Pro Flash (`create_image_pro_flash`), sem fundo, com `style_image` = `source_image_id` do operador aprovado (`a9c13ccf-5dec-5026-bbd3-497d8f3aa2c6`) e o pedido "copy only the pixel art style… do not draw the operator". Telas grandes (mapa) usam a cena aprovada (`9153f177-fba7-5e64-8b91-c0639a240bc4`) como referência.
- A referência precisa caber na tela do pedido: para sprites de 32×32 use a armadilha (`189ce3a3-b5e0-584f-a806-2e35ff1d7396`).
- Interior (aprovado em 2026-10-14, `_style-test/interior_terreo.png` e `interior_porao.png`): móveis com `style_image` = poltrona (`4db612b2-76ee-5bc0-abe7-5b6aa588e33f`, 64×64); objetos de 32 px com a armadilha. Pisos e paredes saem com emenda: rode `python _tools/seamless.py` depois de trocar um deles em `interior/_raw/`.
- O escuro do porão é feito no código (máscara com o círculo da lanterna), não na arte.
- Fantasmas: descreva sempre "bright glowing ectoplasm green… purple edges"; sem isso o modelo faz fantasma branco (aconteceu no teste).

## Pendências
1. Animações: caminhada do operador (`animate_character`, template `walking-8-frames`), flutuar dos fantasmas, feixe de sucção.
2. Andar de cima (alternativa ao porão na 3ª etapa, §6.6) e móveis por tema de bairro.
3. Variações "limpas" da casa e do mapa (bairro valorizado, §6.1) e ícones de HUD (plasma, ameaça).
