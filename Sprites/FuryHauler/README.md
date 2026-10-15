# Arte PixelLab do Fury Hauler

Sprites do protótipo `prototipos/fury-hauler/`, que os carrega direto desta pasta (renomear um PNG quebra o jogo; ele volta ao desenho vetorial daquele objeto). Prévias em `_preview/`.

| Pasta | Conteúdo |
|---|---|
| `truck.png` | O caminhão do jogador, sem as armas (elas são sprites à parte, nos slots). |
| `enemies/` | `biker`, `rammer` (carro-bomba), `boarder` (buggy), `raider` (saqueador a bordo), `boss-cab` e `boss-hull` (as duas peças do chefe). |
| `turrets/<id>/<direção>.png` | As 4 defesas (`mg`, `flame`, `harpoon`, `armor`) nas 8 direções do PixelLab (`south`, `south-east`, `east`... `south-west`). O jogo escolhe a direção mais perto da mira. |
| `decor/` | Cenário do deserto: `rocks-1`, `rocks-2`, `rocks-3`, `bush`, `skull`, `tire`, `wreck`. |
| `anchors.js` | Gerado. Para cada sprite, o caminho e o **ponto de apoio no chão** (âncora, em px do PNG). |
| `pixellab-assets.json` | Gerado. De qual job/objeto do PixelLab veio cada sprite. |
| `_refs/` | As referências vetoriais exportadas do protótipo (e `refs.json`, com as âncoras). |

## Estilo

**Isométrico 2:1, pixel art com contorno escuro seletivo e luz do alto à esquerda**, na paleta do protótipo vetorial que foi aprovado (ferrugem, aço escuro, areia). Os veículos andam para cima e para a direita da tela, então aparecem a **traseira e a lateral direita**. Os sprites não têm sombra: o jogo desenha uma sombra no chão embaixo de cada veículo.

**Escala:** 1 px de arte = 1 px da tela lógica de 1280×720 (o jogo desenha o mundo numa tela de baixa resolução e amplia sem suavização). Uma primeira versão com metade dessa resolução foi descartada por ter pouco detalhe.

O chefe é dividido em cabine e carroceria porque inteiro (288 px) passa do limite de 256 px do PixelLab. As duas peças têm a mesma âncora (o centro do chefe no chão), então encaixam sozinhas.

## Receita

A ideia é que **cada sprite seja um redesenho da forma vetorial do protótipo**, no mesmo ângulo, tamanho e posição. Assim a âncora já é conhecida e o sprite encaixa na lógica sem ajuste à mão.

1. **Exportar as referências:** `python _tools/exportar_refs.py`. Abre o protótipo no Chrome headless com `#refs`, que desenha cada objeto sozinho, sem sombra, na escala dos sprites. Grava `_refs/<nome>.png` e `_refs/refs.json`.
2. **Redesenhar no PixelLab:** `edit_image_pro_flash` com `method: text`, `no_background: true` e a referência como imagem. O pedido sempre começa com *"Redraw as detailed isometric pixel art, keeping exactly the same silhouette, size, position and camera angle: ..."* e termina com *"Clean pixel art, selective dark outline, light from upper-left, no ground, no cast shadow, transparent background."*
3. **Torres em 8 direções:** a referência é desenhada mirando a câmera (o `south` do PixelLab). Depois do passo 2, `create_object_pro_flash` com `n_directions: 8` e o `source_image_id` da imagem editada (cobra só as rotações).
4. **Baixar:** `python _tools/baixar.py <nome>=<job_id> ...` (ou `<nome>=obj8:<object_id>` para as torres). Grava os PNGs, atualiza o `pixellab-assets.json` e reescreve o `anchors.js`.

Para trocar um sprite: refaça o passo 2 (ou 3) só para ele e rode o passo 4. Se a forma vetorial mudar no protótipo, refaça o passo 1 antes, senão a âncora fica errada.
