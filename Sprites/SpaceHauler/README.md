# Arte PixelLab do Space Hauler

Sprites do protótipo `prototipos/space-hauler/`, que os carrega direto desta pasta (renomear um PNG quebra o jogo; ele volta ao desenho vetorial daquele objeto).

**Estado: teste de estilo.** Só 3 sprites existem: a nave (`ship.png`), o caça pirata (`enemies/fighter.png`) e um asteroide (`asteroids/asteroid-2.png`). A comparação com as formas vetoriais está em `_style-test/vetor_x_pixel.png`, e uma cena do jogo com eles em `_style-test/cena.png`. O lote completo (os outros inimigos, as torres em 8 direções e os outros asteroides) espera a aprovação do estilo. Enquanto isso, o protótipo desenha por código o que não tem sprite.

| Pasta | Conteúdo |
|---|---|
| `ship.png` | A nave de carga do jogador, sem as armas (elas são sprites à parte, nos hardpoints). |
| `enemies/` | `fighter` (caça pirata). Faltam `drone`, `boarder`, `pirate`, `cruiser-bow` e `cruiser-hull`. |
| `asteroids/` | `asteroid-2`. Faltam `asteroid-1` e `asteroid-3`. |
| `turrets/<id>/<direção>.png` | (a fazer) as 4 defesas (`cannon`, `plasma`, `harpoon`, `field`) nas 8 direções do PixelLab. |
| `anchors.js` | Gerado. Para cada sprite, o caminho e o **ponto de apoio no plano** (âncora, em px do PNG). |
| `pixellab-assets.json` | Gerado. De qual job do PixelLab veio cada sprite. |
| `_refs/` | As referências vetoriais exportadas do protótipo (e `refs.json`, com as âncoras). |

## Estilo

O mesmo do Fury Hauler: **isométrico 2:1, pixel art com contorno escuro seletivo e luz do alto à esquerda**. A nave voa para cima e para a direita da tela, então aparecem a **popa e o lado de estibordo**. A nave do jogador é industrial (casco branco-acinzentado, contêineres laranja); os piratas são vermelho-escuro e preto. Os sprites não têm sombra nem brilho de motor: o jogo desenha o brilho dos motores por cima.

## Receita

Igual à do Fury Hauler (ver `Sprites/FuryHauler/README.md`):

1. **Exportar as referências:** `python _tools/exportar_refs.py` (abre o protótipo com `#refs` no Chrome headless).
2. **Redesenhar no PixelLab:** `edit_image_pro_flash` com `method: text`, `no_background: true` e a referência como imagem. O pedido começa com *"Redraw as detailed isometric pixel art, keeping exactly the same silhouette, size, position and camera angle: ..."* e termina com *"Clean pixel art, selective dark outline, light from upper-left, no ground, no cast shadow, transparent background."* Os 3 do teste usaram seed 11.
3. **Torres em 8 direções:** `create_object_pro_flash` com `n_directions: 8` a partir da imagem editada.
4. **Baixar:** `python _tools/baixar.py <nome>=<job_id> ...` (ex.: `enemies/drone=<job>`, `turrets/cannon=obj8:<id>`). Grava os PNGs, atualiza o `pixellab-assets.json` e reescreve o `anchors.js`.
