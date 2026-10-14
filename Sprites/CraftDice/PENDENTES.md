# Craft Dice — sprites PixelLab

O estilo segue a imagem de referência em `example/`: pixel art retrô com personagens chibi minúsculos e chão carmesim formando uma "ilha" sobre o fundo roxo-vazio. Os personagens têm uns 20 px de altura, cabeça redonda, pouco detalhe e cores variadas. Os props têm sombreado suave, pedras bege/areia, árvores ciano e sombra projetada. A vista é top-down angulada, para o jogo manter o Tilemap retangular do guia Unity (`CraftDice.md`, Parte 1 §10). Para conferir tudo junto: `_preview/cena.png`.

## Pronto (2026-10-05, segunda versão)

A primeira versão (paleta roxo/teal, personagens maiores, chão de pedra roxa) foi descartada por ficar longe do exemplo.

### Personagens

`chars/` guarda a pose parada de cada personagem nas 4 direções (`<id>_<direção>.png`).

`anims/` tem uma sheet por animação:
- cada **linha** é uma direção, na ordem south, east, north, west;
- cada coluna é um quadro;
- todas as sheets de um personagem têm o mesmo quadro quadrado, com os pés na última linha (pivot **Bottom**).

| Personagem | id | Quadro | Animações |
|---|---|---|---|
| Jogador (cavaleiro azul) | `player` | 32 px | `idle` (4 quadros), `walk` (6) |
| Esqueleto | `skeleton` | 32 px | `idle` (4) |
| Cão Sombrio | `shadow-hound` | 32 px | `idle` (8) |
| Cavaleiro Caído (chefe) | `fallen-knight` | 48 px | `idle` (4) |

Os monstros ficam parados no mapa (placeholder do GDD §6), então só têm `idle`.

### Dados

Cada tipo tem uma cor: **Ataque vermelho**, **Defesa cinza** e **Feitiço azul**. Um dado é sempre um **corpo** (48 px) com um **ícone** (32 px) colado no centro da face da frente, porque a forja deixa o jogador escolher as faces (GDD §3.3).

- **`dice/bodies/<tipo>.png`:** o corpo vazio de `attack`, `defense` e `spell`.
- **`dice/icons/<face>.png`:** um ícone por face:

  | Ícone | Face |
  |---|---|
  | `attack1` | uma espada |
  | `attack2` | duas espadas cruzadas |
  | `critical` | três espadas com explosão |
  | `miss` | X |
  | `parry` | escudo e espada |
  | `dodge` | seta de esquiva |
  | `spell0` | círculo vazio |
  | `spell1` | um orbe |
  | `spell2` | dois orbes |

  No Unity, ponha o ícone como filho do corpo, centralizado em (22, 24) px do canto superior esquerdo do corpo. É o centro da face da frente, que não coincide com o centro da tela porque a lateral e o topo do cubo aparecem.
- **`dice/faces/<tipo>_<face>.png`:** as 10 faces dos dados padrão já montadas, prontas para usar e para conferir.
- **`anims/die-<tipo>_roll.png`:** o dado girando, 8 quadros de 48 px em linha, um por tipo.
  - A cada quadro o dado gira 90°, dá um pulinho e mostra outra face **do próprio tipo**: espadas, crítico e X no de Ataque; escudo, esquiva e X no de Defesa; orbes no de Feitiço.
  - Quando a rolagem acaba, troque pela face sorteada, de frente.
  - Para um dado forjado com outras faces, faça o mesmo em tempo de execução no Unity: gire o dado 90° por quadro e troque o sprite do ícone entre as faces dele.
- **Prévia:** `_preview/dados.png` (estático) e `_preview/dados-girando.gif` (animado).

O corpo foi gerado **só em vermelho**. O script tira o cinza e o azul trocando a cor dos pixels avermelhados (`recolor` em `_tools/fetch_pixellab.py`), para os três dados terem o mesmo formato. Para mudar um tom, ajuste `recolor`, sem regerar nada.

A animação de girar é montada pelo script (`build_roll`), não gerada no PixelLab. A tentativa no PixelLab desenhou um dado comum, com pontos, em vez dos ícones do jogo. Ela continua na conta (objeto `293ed09b-1a35-466a-9931-3cb691025f44`), mas não é usada.

### Bonfire

`anims/bonfire_burn.png`: o fogo da bonfire acesa, 8 quadros de 64 px em linha. Use no lugar do `props/bonfire.png` quando ela estiver acesa.

### Chão

`tiles/area1-void-ground.png` é um tileset Wang de 16 tiles de 32 px: chão carmesim ↔ fundo roxo-vazio. O fundo roxo faz o papel de parede: o jogador anda só no carmesim.

O `.json` ao lado traz, para cada tile:
- o retângulo na sheet (`bounding_box`);
- os cantos (NW/NE/SW/SE), que é o que um Rule Tile de autotile precisa.

Não use o nome `wang_N` nem `original_position` como posição na sheet.

### Props (15, de 1 direção)

| Grupo | Props |
|---|---|
| Bonfire e forja | `bonfire`, `bonfire-unlit`, `anvil` (bigorna com dado, para a forja) |
| Pedras e ruínas | `rune-stone`, `boulders`, `pillar`, `broken-pillar` |
| Árvores | `cyan-tree`, `dead-tree`, `stump` |
| Outros | `chest`, `tombstone`, `boss-gate`, `crystal`, `skull-pile` |

O tamanho da tela varia:
- **64 px** na maioria;
- **32 px** em `stump`, `tombstone` e `crystal`, que são pequenos no exemplo.

### Manifesto

`pixellab-assets.json` reúne os ids do PixelLab, os arquivos, os quadros e o tamanho de quadro de tudo acima.

Para baixar de novo ou depois de regerar algo, rode `python _tools/fetch_pixellab.py` dentro desta pasta. O script avisa se faltar alguma direção numa animação.

## Receita do estilo

Descrever o estilo só por texto não funcionou: a primeira versão saiu bem diferente do exemplo. O que funciona é passar uma **imagem de referência** no modo **Pro Flash** do PixelLab.

1. **Referência inicial.** Recorte um personagem ou prop do `example/` e reduza para a escala nativa: cada pixel da arte ocupa uns 3 px da imagem do exemplo. Em seguida remova o fundo.
2. **Imagem base.** Gere a imagem com `create_image_pro_flash`, passando `style_image` e uma tela de 32 px para personagem ou 48 px para chefe.
   - Depois que houver uma imagem aprovada, use o `source_image_id` dela como referência das próximas. Assim dispensa o base64, que costuma chegar truncado.
3. **Personagem.** Gere com `create_character_pro_flash`, usando o `source_image_id` da imagem aprovada:
   - só as rotações são cobradas;
   - quadrúpedes usam `template_id` = `dog`.
4. **Animações.** São templates do PixelLab (`walking-6-frames` e `breathing-idle` nos humanoides, `idle` no cão), pedidos só nas 4 direções.
5. **Props.** Gere com `create_object_pro_flash` e `n_directions` = 1:
   - a referência de estilo é a imagem da bonfire (`source_image_id` `bdf41af5-7276-5162-bd20-99736c6d12a9`, 64 px);
   - a tela precisa ser **pelo menos do tamanho da referência**;
   - para props pequenos, use tela de 32 px com a imagem do cavaleiro (`6b1ad22f-0326-5acd-9086-08bf1c3154ca`) como referência e peça para copiar só o estilo;
   - toda descrição termina com `slight 3/4 top-down view, soft dark drop shadow`.
6. **Chão.** Gere com `create_topdown_tileset`, 32 px, `flat shading`, `lineless`:
   - escreva "seamless … no grid lines and no tile borders", senão cada tile vem com borda escura e o chão vira grade;
   - escreva "crimson red, not pink", senão sai magenta.

## Melhorias possíveis

1. **Ícones dos 4 feitiços** (Poção, Re-rolar, Fraqueza, Golpe Duplo) para os botões da batalha, no mesmo estilo dos ícones das faces. O exemplo tem cartas de personagem que podem servir de referência para o layout.
2. **Mais variedade no chão:** a borda da ilha ficou mais limpa que no exemplo, que tem pedaços soltos e sombra. Dá para regerar ou complementar com props de borda.
3. **Animações de ataque e de dano**, se a cena de batalha deixar de ser só UI.
4. **Tilesets e props das próximas áreas**, encadeados no mesmo fundo roxo (`lower_base_tile_id` `dac2fecf-2f25-48dc-879a-7a9bcb32ed34`).
5. **Mais personagens do exemplo** (fantasma, porco, mago), se entrarem no bestiário.

## Dica de produção

O limite é de 10 trabalhos simultâneos na conta. Envie em grupos e use `wait_for_jobs` entre eles.

O PixelLab devolveu vários erros 500/502 do lado deles nesta sessão. Esses erros não são cobrados. Uma direção de animação que falhou se refaz passando o `animation_group_id` e só a direção que falta.

Custo observado:
- imagem ou prop Pro Flash: 5 gerações;
- rotação de personagem a partir de uma imagem: cerca de 1 geração;
- template de animação: 1 geração por direção;
- tileset: 1 a 4 gerações.

A segunda versão inteira, contando o teste de estilo, custou 145 gerações. Os dados custaram mais 56.
