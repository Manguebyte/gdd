# Arte PixelLab da franquia Rally — Navigation Expert, RaceLegenda, Street Legends

Arte dos três protótipos web novos da franquia (ver `prototipos/navigation-expert/`, `race-legenda/`, `street-legends/`). Cada jogo tem a sua pasta, que o protótipo carrega direto (renomear um PNG quebra o jogo):

| Pasta | Conteúdo |
|---|---|
| `Sprites/NavigationExpert/` | `car/` (rali Grupo B branco/azul, 8 direções), checkpoint, carvalho, pinheiro, pedras, fardos, celeiro, casa, cerca, arbusto, vaca, lagoa (vista de cima), cata-vento, `tiles/grass` e `tiles/dirt` |
| `Sprites/RaceLegenda/` | `f1/` (F1 anos 60 vermelho, 8 direções), arquibancada, box, torre, pórtico de largada, muro de pneus, palha, placa, fiscal, `tiles/grass` e `tiles/asphalt`; `oak`, `pine` e `bush` são cópias do Navigation Expert |
| `Sprites/StreetLegends/` | `tuner/` (cupê tunado roxo) e `police/` (viatura), 8 direções cada; poste, caçamba, árvore de calçada, pilar de neon (checkpoint), cavalete, ar-condicionado e caixa d'água (telhados, vistos de cima), `tiles/road` e `tiles/sidewalk` |

Os `object_id`/`tileset_id` de cada asset estão no `pixellab-assets.json` da pasta do jogo. Prévias em `_preview/` (não vão para o site).

## Estilo

O do repositório [`rally2d`](https://github.com/abraaovilanova/rally2d) (`docs/estilo.md` de lá): pixel art com ponto de vista misto — **chão visto de cima, objetos em 3/4** a ~60°, luz do alto à esquerda, contorno escuro seletivo, 8–12 cores, **sem sombra desenhada** (o jogo põe uma elipse no pé de cada objeto). O carro gira desenhado em **8 direções**; o jogo escolhe o quadro mais perto e gira só o resto (até 22,5°).

> O Core do GDD (`RallySurvive.md`, Parte 1 §4) define arte vetorial flat para a franquia. Esta pasta segue o pixel art do `rally2d` por pedido de 2026-10-14; a divergência está registrada como "Em aberto" no GDD.

## Receita (PixelLab, MCP)

1. **Referência de estilo, não texto.** O carro do `rally2d` (`assets/gerados/carro/south.png`, recortado e centrado em 128×128) foi o `style_image` dos carros; uma folha com a árvore, os pneus e o cone do `rally2d` foi o `style_image` dos objetos (a plateia do `rally2d` para a arquibancada).
2. **Carros:** `create_object_pro_flash`, 128×128, `n_directions: 8`, `view: low top-down`. Se a geração falhar no meio, refazer a partir do `source_image_id` da primeira direção (cobra só as rotações).
3. **Objetos:** `create_object_pro_flash`, `n_directions: 1`, 128×128 (até 256×160 nos grandes). O tamanho real vem da **ocupação do quadro** escrita no pedido ("occupies about half of the frame"). Telhados e lagoa com `view: high top-down` e "seen strictly from directly above".
4. **Chão:** `create_topdown_tileset`, `mode: pro`, tiles de 64 px. O jogo usa só os dois tiles "puros" (4 cantos do mesmo terreno), que repetem sem emenda.
5. Todo pedido termina com: `top-down 3/4 pixel art, camera 60 degrees above ground, single light from upper-left, selective dark outline, 8-12 colors, medium detail, no cast shadow, no ground, transparent background`.

## Ferramentas (`_tools/`)

- `baixar.py <pasta> obj8|obj1 <object_id> <nome>` — baixa as 8 rotações (ou a única) e atualiza o `pixellab-assets.json`.
- `tiles_puros.py <pasta> <tileset_id> <inferior> <superior>` — baixa o tileset e recorta os dois tiles puros.
- `previa_carros.py` e `previa_props.py` — folhas de prévia.
