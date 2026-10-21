# Arte PixelLab do Sea Hauler

Sprites do protótipo `prototipos/sea-hauler/`, que os carrega direto desta pasta (renomear um PNG quebra o jogo; ele volta ao desenho vetorial daquele objeto).

**Estado: completo.** O estilo foi aprovado no teste com 3 sprites (casco, mastreame de Pano cheio e escuna; comparação em `_style-test/vetor_x_pixel.png`, cena em `_style-test/cena.png`) e depois o lote inteiro foi gerado com a mesma receita (prévias em `_style-test/lote.png` e `_style-test/armas.png`). Se um sprite não carregar, o protótipo volta ao desenho vetorial daquele objeto.

| Pasta | Conteúdo |
|---|---|
| `ship.png` | O casco da fragata, sem mastros nem armas (as armas são sprites à parte, nas portinholas). |
| `rig-reefed.png`, `rig-half.png`, `rig-full.png` | O mastreame, um por posição das velas (Rizadas, Meio pano, Pano cheio). Mesma âncora do casco: encaixam sozinhos. |
| `enemies/` | `schooner` (escuna), `fireship` (brulote), `sloop` (chalupa), `boarder` (pirata a bordo), `galleon-bow` e `galleon-hull` (as duas peças do Galeão). |
| `rocks/` | `rock-1`, `rock-2` e `rock-3` (o jogo sorteia um por rochedo). |
| `turrets/<id>/<direção>.png` | As 4 armas (`longgun`, `carronade`, `chainshot`, `marines`) nas 8 direções do PixelLab. O jogo escolhe a direção mais perto da mira. |
| `anchors.js` | Gerado. Para cada sprite, o caminho e o **ponto de apoio no plano** (âncora, em px do PNG). |
| `pixellab-assets.json` | Gerado. De qual job do PixelLab veio cada sprite. |
| `_refs/` | As referências vetoriais exportadas do protótipo (e `refs.json`, com as âncoras). |

## Estilo

O da série Hauler: **isométrico 2:1, pixel art com contorno escuro seletivo e luz do alto à esquerda**. O navio anda para cima e para a direita da tela, então aparecem a **popa e o lado de estibordo**. A fragata segue a Marinha britânica do século XVIII (casco preto com faixa ocre, velas creme, bandeira azul com a cruz vermelha); os piratas têm madeira gasta e velas pretas. Os sprites não têm sombra nem água: o jogo desenha a espuma e a esteira.

## Receita

A do Space Hauler (ver `Sprites/SpaceHauler/README.md`):

1. **Exportar as referências:** `python _tools/exportar_refs.py` (abre o protótipo com `#refs` no Chrome headless).
2. **Redesenhar no PixelLab:** `edit_image_pro_flash` com `method: text`, `no_background: true`, seed 11 e a referência como imagem (enviada com `get_upload_url`). O pedido começa com *"Redraw as detailed isometric pixel art, keeping exactly the same silhouette, size, position and camera angle: ..."* e termina com *"Clean pixel art, selective dark outline, light from upper-left, no ground, no water, no cast shadow, transparent background."*
3. **Armas em 8 direções:** `create_object_pro_flash` com `n_directions: 8` a partir da imagem editada.
4. **Baixar:** `python _tools/baixar.py <nome>=<job_id> ...` (ex.: `enemies/sloop=<job>`, `turrets/longgun=obj8:<id>`). Grava os PNGs, atualiza o `pixellab-assets.json` e reescreve o `anchors.js`.

O Galeão é dividido em proa e casco porque inteiro passa do limite de 256 px do PixelLab. As duas peças têm a mesma âncora (o centro do Galeão no plano).
