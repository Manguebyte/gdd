# Paper Flight — sprites PixelLab

Arte do `PaperFlight.md` (Parte 1 §8, Parte 12 / Fase 9). Pixel art 2D, tela em retrato, visão lateral. Tudo foi desenhado para **16 px por unidade** (PPU 16) e para a câmera de referência 180×320 do guia.

Prévia geral: `_preview/maps_all.png` (os 5 mapas montados com todos os assets).

## Estilo

Não há imagem de referência em `example/`. O estilo saiu de um teste só por texto, aprovado em 2026-10-06 (`_style-test/`, cena em `_preview/style_test_scene.png`):

> Cozy bright casual mobile game pixel art, clean dark outline, soft 2-tone shading, limited warm palette

Depois do teste, todo asset novo usou um asset aprovado como `style_image` (Pro Flash):

| Para gerar | Referência de estilo (`source_image_id`) |
|---|---|
| Aviões | avião do teste `c4862404-36f7-556c-b159-f2cad3522fad` |
| Obstáculos e ícones | avião do Quintal `9aa2b184-555d-54aa-8d87-63f00c496191` ("copy only the style, do not draw a paper airplane") |
| Camadas "perto" | fundo do Quintal `af10d116-2cb3-5f5a-93ae-7d85e8728672` |
| Camadas "longe" | longe do Quintal `33c27c54-e4f1-5be5-ad66-872890996362` |
| Elemento que tapa a emenda | a própria camada que ele vai cobrir |

Os ids de todos os assets estão em `pixellab-assets.json`.

## O que existe

| Pasta | Conteúdo | Tamanho |
|---|---|---|
| `planes/` | `plane_<n>_<mapa>.png`: um avião por mapa (GDD §8). 1 Quintal: dardo de papel de caderno. 2 Parque: planador amarelo. 3 Praia: andorinha turquesa. 4 Cidade: caça de jornal. 5 Montanha: asa-delta de papel kraft vermelho. Nariz para a direita. | 32×32 |
| `backgrounds/` | `<n>_<mapa>_near.png` e `<n>_<mapa>_far.png`: as duas camadas de parallax de cada mapa, **já repetindo sem emenda**. Topo transparente. | 128 de altura, largura na tabela abaixo |
| `ground/` | `<n>_<mapa>_surface.png` (topo do chão) e `<n>_<mapa>_fill.png` (terra/pedra embaixo). `<n>_<mapa>.png/.json` é o tileset lateral completo do PixelLab (16 tiles). | 16×16 |
| `obstacles/` | Por mapa, um de chão (`ground_*`, base na última linha) e um de ar (`air_*`). Quintal: casinha de passarinho / pardal. Parque: árvore / pipa. Praia: coqueiro / gaivota. Cidade: poste / drone. Montanha: pinheiro / águia. | chão 32×96, ar 32×32 (pipa 32×48) |
| `common/` | `coin.png` (16×16), `goal_flag.png` (16×48), `wind_puff.png` (32×32), `air_current.png` (48×128) | — |
| `icons/` | `upgrade_paper/fold/launch/wind/income.png`, um por trilha (GDD §5.2) | 32×32 |
| `ui/` | `panel.png`, `button_blue.png`, `button_yellow_square.png`, `bar_frame.png` + `bar_fill_white.png` (o velocímetro: a Unity tinge o fill de vermelho/amarelo/verde) | resolução alta (ver abaixo) |

Pastas que não vão para a Unity: `backgrounds/_raw` (camadas como vieram do PixelLab), `backgrounds/_seam` (elementos que tapam a emenda), `_style-test`, `_preview`, `_tools`.

### Largura das camadas de fundo (`_tileWidth` do `ParallaxLayer`)

O corte das bordas transparentes deixou cada camada com uma largura. No Unity, `_tileWidth` = largura ÷ 16.

| Mapa | `near` (px → unidades) | `far` (px → unidades) |
|---|---|---|
| 1 Quintal | 255 → 15,9375 | 255 → 15,9375 |
| 2 Parque | 256 → 16 | 252 → 15,75 |
| 3 Praia | 252 → 15,75 | 214 → 13,375 |
| 4 Cidade | 256 → 16 | 250 → 15,625 |
| 5 Montanha | 252 → 15,75 | 247 → 15,4375 |

### Cor do céu (fundo da câmera)

O céu não é sprite: use a cor de fundo da câmera (ou um degradê). Cores usadas nas prévias, topo → horizonte:

| Mapa | Topo | Horizonte |
|---|---|---|
| 1 Quintal | `#76C4F0` | `#D6EEFA` |
| 2 Parque | `#6EBEEE` | `#CEECF6` |
| 3 Praia | `#5ABAF0` | `#C8F0FA` |
| 4 Cidade | `#82B8E2` | `#DEE6F0` |
| 5 Montanha | `#78AAE1` | `#E2ECF8` |

## Importar na Unity

O passo a passo completo está no guia Unity do `PaperFlight.md`:

- **Fase 0.5** — quais arquivos copiar, configuração de importação (PPU 16, Point, Full Rect), bordas de 9-slice do kit de UI e a tabela de pivôs (obstáculos de chão, bandeira, fundos e chão têm linhas transparentes embaixo).
- **Fase 1.5** — avião, cor do céu e ícones nos `MapDefinition` e `UpgradeDefinition`.
- **Fase 3.4** — prefab de cenário do Quintal (chão, `near`, `far`).
- **Fase 6.3** — moeda, corrente de ar, bandeira e obstáculos do Quintal.
- **Fases 7.4 e 8.3** — HUD, velocímetro, tela de resultado e hangar com o kit de UI (tudo em 3×).
- **Fase 9** — cenários e obstáculos dos mapas 2 a 5 (tabela com `Tile Width` e `Size` de cada camada) e a lufada do vento.

## Receitas

### Fundo que repete sem emenda (`_tools/make_seamless.py`)

O PixelLab não gera bordas que casam. O script:

1. corta as colunas transparentes das bordas;
2. desloca a camada meia largura: a emenda vai para o meio e as bordas novas, que eram pixels vizinhos, já casam;
3. cola por cima o elemento de `_seam/` (árvore, coqueiros, prédio, pinheiros, torre, ilha...), centralizado na emenda e com a base na última linha opaca;
4. conta as linhas da emenda que ficaram sem cobertura. Sobram algumas na Praia "perto" (faixa do mar, que é uniforme e não aparece) e 1–2 em outras.

O elemento de `_seam/` é gerado num canvas do **mesmo tamanho** da camada (256×128), usando a camada como `style_image` — o Pro Flash exige que a referência caiba no canvas.

O inpaint do PixelLab seria o caminho natural, mas exige mandar a imagem em base64, e ela chegou truncada/corrompida nas duas tentativas (10 mil e 4,5 mil caracteres).

### Chão

`create_sidescroller_tileset`, 16 px, `selective outline`, `basic shading`, `medium detail`, `transition_size` 0,25. Parque e Montanha saíram destoando (terra vermelha em anéis, pedra azul em bolotas) e foram refeitos com `base_tile_id` do Quintal (`12505693-ebed-4d4a-96a9-b8f012fa9532`). As versões rejeitadas estão em `rejected` no manifesto.

### Kit de UI

`create_ui_asset` com `elements` (window, button, icon_button, health_bar, tab). Ele desenha conteúdo dentro das peças ("NEW" no botão, um coração no botão quadrado, gemas na barra); `ui/_*_raw.png` são os recortes originais e as versões limpas foram pintadas por script nesta sessão.

### Ícone com fundo

Se a remoção de fundo do PixelLab apagar o desenho inteiro (erro "Background removal erased the whole image", não cobrado), gere com `no_background: false` pedindo fundo magenta liso, e tire o fundo localmente. É o caso de `icons/_upgrade_launch_bg.png` → `upgrade_launch.png`, feito por `_tools/build_previews.py`.

## Scripts (rodar dentro desta pasta)

| Script | O que faz |
|---|---|
| `python _tools/fetch_pixellab.py [--force]` | Baixa do PixelLab tudo o que está no manifesto (imagens e tilesets). |
| `python _tools/make_seamless.py` | Gera `backgrounds/*.png` a partir de `_raw/` e `_seam/`. |
| `python _tools/build_previews.py` | Exporta `ground/*_surface.png` e `*_fill.png`, limpa o ícone de Lançamento e monta `_preview/maps_all.png`. |

O CDN dos tilesets recusa o User-Agent padrão do Python; o `fetch_pixellab.py` já manda um de navegador.

## Próximos passos

1. **Animações**: pardal/gaivota/águia batendo asas, pipa balançando, hélices do drone, moeda girando, corrente de ar subindo, lufada abrindo. Exigem recriar esses assets como objeto (`create_object_pro_flash` a partir do `source_image_id`) e animar.
2. **Sprites de ângulo do avião** (8–16 por modelo), se a rotação livre ficar serrilhada (GDD §8, **Em aberto**).
3. **Sprite de quem lança o avião** (GDD §3, **Em aberto**).
4. Moeda de 16 px ficou com pouco detalhe; se ficar ilegível no celular, testar 20 px.

## Custo

Cerca de 384 gerações no total (teste de estilo ~28; aviões 25; 10 camadas de fundo 90; 10 elementos de emenda 90; 10 obstáculos 50; 5 tilesets + 2 refeitos ~18; comuns ~21; 5 ícones + 1 refeito ~30; kit de UI 40). Saldo depois: 3.811 gerações até 2026-10-27.
