# Star Expedition Co. — Prompts do SpriteCook

Prompts usados para gerar a arte do jogo. Direção de arte, paleta, tamanhos e catálogo: GDD §10 (`StarExpeditionCo.md`). Ordem de produção e pipeline: GDD Parte 2, Fase 6.

Os `asset_id` do SpriteCook ficam em `spritecook-assets.json` (nesta pasta), com o `sha12` do PNG salvo. Entradas com `derived_from` foram geradas por script a partir de outro asset (não têm geração própria no SpriteCook). Todos os assets estão no projeto **Star Expedition Co.** do SpriteCook.

## Bloco de estilo (vale para todo asset)

```
Retro-futuristic corporate sci-fi pixel art, 1980s space-mining company aesthetic.
Cool slate blue-grey metal with amber/orange accents. Limited palette, 3-4 tones per
color, light from top-left, crisp 1px dark outline (#0E1018). Clean readable shapes,
no anti-aliasing, no gradients. Centered, transparent background.
```

## Configuração comum

- **Modelo:** `gemini-3.1-flash-image` (12 créditos/imagem), `pixel: true`, resolução 1K, `smart_crop_mode: tightest`.
- **Animação:** `animate_game_art`, `pixel-engine-v1.1`, 4 quadros, `output_format: spritesheet`, `auto_enhance_prompt: false` (20 créditos/animação).
- O SpriteCook devolve cada sprite numa grade própria (tipicamente 26–110 px). O script de pós-processamento recorta pelo conteúdo, **só reduz** com nearest neighbor (nunca amplia) e centraliza no tamanho exato do catálogo §10.5.
- Scripts em `tools/`: `pipe.py` (baixa, pós-processa, salva e atualiza o manifesto; a docstring lista os modos), `batch.py` (registra vários assets de uma vez) e `derive_buttons.py` (gera `Pressed`/`Disabled` a partir dos botões `Normal`). Requerem Python 3.12+ com Pillow e NumPy. O registro de jobs e os downloads ficam em `tools/work/`, fora do git.

## Âncoras de estilo

| Grupo | Âncora | asset_id |
|---|---|---|
| UI | `SPR_UI_Panel` | `0c111667-720f-4810-9a1a-87c6f9968af8` |
| UI | `SPR_UI_Button_Primary_Normal` | `ba6036ca-b04b-484a-8355-403da2ca099c` |
| Items | `SPR_Item_iron_ore` | `3e57eff6-d430-4c68-b845-b906c7b11a04` |
| Crew | `SPR_Crew_Scout_1` (busto parado: `39e50e28-3bf5-44b7-919d-8737819f9741`) | `30d0042e-03ba-494b-a4da-9832e04c7b73` |
| Planets | `SPR_Planet_kora_Surface` | `8a686964-a597-49f8-acc1-049df8f8895f` |
| Backgrounds | `SPR_Bg_Galaxy1` | `d28bf0dd-46d4-4f0f-b7bc-afc6a86a2f1e` |

Cada grupo foi gerado com a âncora dele em `style_asset_ids`.

## Assets

### UI

| Arquivo | Prompt (resumo) | Observação |
|---|---|---|
| `SPR_UI_Panel` | "UI panel frame, square metal plate in slate blue-grey (#2E3650) with a 1px lighter bevel border (#4A5578), small rivets in the four corners, flat plain center area, 9-slice friendly" + bloco de estilo | `mode: ui`, 2 candidatos, escolhido o A |
| `SPR_UI_Button_Primary_Normal` | "UI button, wide rectangular amber-orange (#F2A33A) metal button with a lighter top bevel highlight (#FFD27A), darker bottom edge, flat plain center with no text, 9-slice friendly" + bloco de estilo | `mode: ui`, 2 candidatos, escolhido o B |
| `SPR_UI_Button_Secondary_Normal` | "Recolor this UI button to slate blue-grey metal (#4A5578 face, #8A96B8 top bevel, #2E3650 bottom edge), keeping the exact same shape…" | `edit_asset_id` = Primary_Normal |
| `SPR_UI_Button_*_{Pressed,Disabled}` | — | Derivados por script: Pressed = 1 px abaixo, face 20% mais escura; Disabled = dessaturado rumo ao Slate 500 |
| `SPR_UI_TabBar`, `SPR_UI_TopBar` | "Long horizontal UI bar… slate blue-grey metal strip (#2E3650), small rivets at both ends, thin amber accent line along the top/bottom edge, flat plain middle, 9-slice friendly" | Gerados curtos; esticados para 360 px por 9-slice (pontas de 8 px preservadas) |
| `SPR_UI_Icon_{Map,Crew,Workshop,Shop}` | "Small UI tab icon, simple bold readable silhouette: <assunto>. Amber (#F2A33A) and paper white (#E8ECF5)…" | Map = pino de localização, Crew = dois capacetes, Workshop = chave inglesa, Shop = balcão com toldo. Map e Workshop foram refeitos com uma forma única (a v1 ficou ilegível em 24 px, está em `_candidatos_descartados/`) |
| `SPR_UI_Icon_*` (16×16) | "Tiny 16x16 UI icon, very simple bold silhouette: <assunto>" + cor da paleta | Credits = moeda âmbar; Risk = triângulo vermelho; Timer = cronômetro; Lock = cadeado; Check = tique verde; Close = X; Settings = engrenagem; Ad = TV com play; Cycle = setas circulares; Alert = círculo âmbar com "!"; Success = estrela verde; Loss = coração partido vermelho (a v1, capacete rachado, ficou ilegível) |
| `SPR_UI_Arrow` | "…thick amber arrow pointing straight down with a light highlight" | — |
| `SPR_UI_Logo` | "Game logo lettering: \"STAR EXPEDITION CO.\" as a 1980s space-mining company sign, bold blocky amber letters… on a riveted slate metal plaque, small star emblem" | 2 candidatos; o B (3 linhas) está em `_candidatos_descartados/` |

### Items (32×32)

Prompt: `Inventory icon: <coluna Visual da §16.4/§16.5>, 3/4 view.` + bloco de estilo. Equipments com "Slate grey metal with amber accents"; Rare Items com "surrounded by a soft violet (#B07CFF) glow aura".

Pós-processamento: **Equipment** recebe a moldura âmbar de 1 px (`#F2A33A`) na borda de 32×32; **Rare Items** recebem um halo violeta de 1 px (`#B07CFF`) em volta da silhueta.

### Crew (folha 256×64, 4 quadros de 64×64)

1. **Busto:** `Character bust portrait, head and shoulders, front view facing the viewer: <descrição>` + bloco de estilo. Descrição = coluna *Visual* da §16.1 + variação de tom de pele, cabelo e acessório (ex.: Scout_2 "young woman explorer with dark brown skin and short curly black hair"; Engineer_3 "older mechanic engineer with dark skin, grey buzz cut and moustache").
2. **Idle:** `The <personagem> faces the viewer in a calm bust portrait. The shoulders rise and fall gently in a slow breathing rhythm and the eyes blink once, while <acessórios>, the head position and the framing stay steady. Seamless looping idle.` Negative: `camera movement, zoom, turning head, talking, extra objects`.
3. A folha (4 × ~88 px) é recortada com uma caixa comum aos 4 quadros (para o retrato não tremer) e reduzida para 64×64 por quadro.

### Planets (128×64, repetível na horizontal)

Prompt: `Seamless horizontally tileable planet surface texture map, equirectangular projection, flat 2:1 map filling the whole frame: <coluna Visual da §16.3>. Left and right edges must match seamlessly.` + estilo sem contorno. `mode: texture`, `bg_mode: include`, `aspect_ratio: 16:9`, sem smart crop.

Conferência da emenda: a diferença média entre a primeira e a última coluna ficou igual ou menor que a variação interna da textura nos 18 Planets.

### Backgrounds (360×960)

Prompt: `Pixel art vertical space background: dark starfield over a deep slate base (#1B2030) with a soft <mangrove-green | amber-orange | deep purple and violet> nebula drifting through…`. Gerado em 360×512 e empilhado com uma cópia espelhada na vertical até 960 px (o loop vertical fecha sem emenda).

### Ships

`SPR_Ship_Scout`: "Tiny top-down spaceship sprite: small mining scout ship pointing up, slate grey hull with an amber cockpit stripe and a small orange engine glow…". 2 candidatos; o B está em `_candidatos_descartados/`.

### Store

- `SPR_Store_Icon` (64×64 → `SPR_Store_Icon_512x512`, 8×): "Mobile app icon, square, full bleed: bold amber blocky letters \"SE\"… in front of a colorful ringed planet, on a deep slate starfield background with a thin riveted slate metal border". 2 candidatos.
- `SPR_Store_Feature` (256×125 → `SPR_Store_Feature_1024x500`, 4×): "Wide store feature banner… three colorful pixel planets (grey cratered moon, orange lava world, ringed amber gas giant)… a tiny slate mining scout ship… Leave the upper-left third calm and empty for a title… no text". Gerado em 512×250 e reduzido 2×.
