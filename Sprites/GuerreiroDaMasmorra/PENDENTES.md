# Guerreiro da Masmorra — sprites pendentes (SpriteCook)

Plano para retomar a arte flat vector quando os créditos do SpriteCook forem recarregados. Direção de arte e decisões: `GuerreiroDaMasmorra.md`, Parte 1 §13. Como importar no Unity: Etapa 3A do guia.

## Onde paramos (2026-10-02)

| Personagem | Pose base | Idle | Ataque | Observação |
|---|---|---|---|---|
| Guerreiro (herói) | ✅ `heroes/warrior.png` | ✅ | ✅ | referência de estilo de todo o elenco |
| Servo (`pawn`) | ✅ `monsters/pawn.png` | — | ✅ | |
| Arqueiro (`archer`) | ✅ `monsters/archer.png` | — | ⚠️ | o ataque termina sem flecha no arco (não pega outra da aljava); serve para tocar uma vez, não para loop |
| Cavaleiro-chefe (`boss`), 5 cores | ✅ | ✅ | ✅ | gerado localmente por `_tools/recolor_knight.py` (sem crédito) |

Créditos restantes no fim da sessão: **6**. Todos os `asset_id` estão em `spritecook-assets.json`.

## Receita (para manter o estilo igual)

- **Projeto SpriteCook:** `Guerreiro da Masmorra` (`8b474b5c-28b1-4fd0-ba06-cdb243e3a081`).
- **Imagem base:**
  - `generate_game_art` com `model` = `gpt-image-2.5-flare`, `quality` = `medium`, `pixel` = `false`, `width`/`height` = `512`;
  - `bg_mode` = `transparent` (padrão);
  - sai em 1024 × 1024 com fundo transparente limpo.
- **Referência de estilo (opcional, +8 créditos):** `style_asset_ids` = `["c6a46a97-e05e-4e04-bbcf-ffca81194890"]` (o Guerreiro). O Arqueiro saiu consistente sem referência, só com o texto e a paleta abaixo; use a referência só se um monstro destoar.
- **Estilo:** `style` = `flat vector, minimalist, mobile game character, bold dark outlines`.
- **Paleta base:** `["#1B1F3B", "#6E8B3D", "#A8343A", "#7A4A2B", "#E8EEF7", "#9AA5B8", "#F2C14E", "#2B2B2B"]`. Ajuste as cores principais por monstro e mantenha `#1B1F3B` (contorno) e `#2B2B2B`.
- **Molde do prompt** (troque o trecho entre colchetes):

  > [Nome] enemy for a 2D side-view turn-based RPG, full body, facing left, [descrição do corpo, roupa e arma]. Flat vector art: clean geometric shapes, bold uniform dark outlines, flat color fills with one simple shadow tone, minimal detail, no texture, no gradients, no pixel art.

  Herói: `facing right`. Monstros: `facing left`.
- **Animação:**
  - `animate_game_art` na pose base, com `pixel` = `false`, `output_frames` = `8`, `output_format` = `spritesheet` e `auto_enhance_prompt` = `false`;
  - o prompt é um parágrafo descrevendo só o que é visível na pose: o que se move, como se move, o que fica parado, e que termina na pose inicial;
  - sai em 8 quadros de 640 × 640, a 8 fps.

## Custos

| Item | Créditos |
|---|---|
| Imagem base (sem referência) | 8 |
| Imagem base com referência de estilo | 16 |
| Animação (8 quadros) | 20 |
| Monstro com pose + ataque | 28 |
| Monstro com pose + idle + ataque | 48 |

## Fila, por ordem de aparição nas masmorras

"Nv." é o nível efetivo em que o monstro começa a aparecer (Parte 1 §8). "Cor" indica um sprite que muda com a cor da masmorra: gere em **vermelho** e recolora localmente (ver Pós-processamento). Para cada um, gere a pose base e o ataque; a idle fica para depois, se sobrar crédito.

| # | Monstro | Id | Nv. | Descrição para o prompt |
|---|---|---|---|---|
| 1 | Lanceiro | `lancer` | 1 | goblin soldier in a red tunic and small metal cap holding a long spear pointed forward, round wooden buckler (cor) |
| 2 | Monge | `monk` | 1 | goblin monk in long red hooded robes holding a wooden staff with a glowing orb, prayer beads (cor) |
| 3 | Gnomo Arruaceiro | `gnome` | 1 | mischievous bearded gnome with a tall pointed hat holding a small wooden club, cheeky grin |
| 4 | Rei Slime (chefe) | `kingslime` | 1 | big round green slime blob with a small golden crown on top, simple face with angry eyes |
| 5 | Árvore Anciã (chefe) | `tree` | 1 | ancient living tree with a stern bark face, thick branch arms and roots as legs |
| 6 | Ladrão | `thief` | 2 | hooded goblin thief in a dark purple cloak with a mask over the mouth, holding two daggers |
| 7 | Cobra Venenosa | `snake` | 2 | big coiled purple venomous snake rearing up, fangs showing |
| 8 | Urso Feroz (chefe) | `bear` | 2 | huge brown bear standing on hind legs, claws raised, angry |
| 9 | Aranha Gigante | `spider` | 3 | giant black spider with red markings, eight legs, fangs |
| 10 | Goblin da Tocha | `torch` | 3 | goblin holding a burning wooden torch, red tunic, flame stylized as flat shapes (cor) |
| 11 | Goblin Dinamite | `tnt` | 3 | goblin holding a lit stick of dynamite ready to throw, red tunic, bandolier of dynamite (cor) |
| 12 | Caveira Amaldiçoada | `skull` | 4 | skeleton warrior with a rusty sword and cracked round shield, glowing green eye sockets |
| 13 | Minotauro | `mino` | 4 | muscular minotaur with bull head and big horns holding a two-handed axe |
| 14 | Minotauro Ancestral (chefe) | `minolord` | 4 | larger elder minotaur with grey fur, golden horn rings and a huge double axe |
| 15 | Gnoll Arremessador | `gnoll` | 5 | hyena-like gnoll in leather scraps holding a bone ready to throw |
| 16 | Lagarto Cuspidor | `lizard` | 6 | upright green lizardman with a frilled neck, mouth open about to spit acid |
| 17 | Troll das Cavernas (chefe) | `troll` | 6 | huge grey-blue cave troll with a big wooden club, small eyes, tusks |
| 18 | Peixe Arpoador | `harpoonfish` | 7 | upright fishman with blue scales holding a harpoon |
| 19 | Peixe-Remo | `paddlefish` | 8 | upright orange fishman with a long paddle-shaped snout and a wooden oar |
| 20 | Xamã Selvagem | `shaman` | 9 | tribal goblin shaman with a feather headdress and a skull-topped staff |
| 21 | Panda Guerreiro (chefe) | `panda` | 9 | martial-arts panda in a red sash holding a bamboo staff, fighting stance |
| 22 | Tartaruga Blindada | `turtle` | 10 | upright armored turtle with a spiked shell, short sword |
| 23 | Cavaleiro Selvagem | `wlancer` | 12 | savage knight in mismatched fur and spiked armor with a long lance |

- **Para fechar a masmorra 1 completa:** itens 1 a 5, cerca de 140 créditos com ataque.
- **Elenco inteiro com pose e ataque:** cerca de 650 créditos.

### Herói (depois do elenco)

- **Pose de guarda/parry** (para o `guard` do `CombatantView`): animação a partir de `heroes/warrior.png` com o escudo erguido absorvendo um golpe. 20 créditos.
- **Corrida** (ida e volta até o alvo): animação de corrida no lugar. 20 créditos.
- Os outros heróis (Mago, Caçadora, Lanceiro, Monge) são pós-MVP; a pose base deles usa o Guerreiro como referência de estilo.

## Pós-processamento (sem custo, fazer a cada leva)

1. **Baixar:** a pose base vai para `monsters/<id>.png`; a sheet (`spritesheet_url`) vai para `anims/<id>_attack_sheet.png` e o `.webp` (`sprite_url`) para `anims/<id>_attack.webp`.
2. **Conferir o fundo:** monte a imagem sobre magenta e verifique o canal alfa. As até agora vieram limpas, com alfa máximo 254.
3. **Recolorir os monstros "cor":** generalize o `_tools/recolor_knight.py`. Hoje ele troca o matiz azul do Guerreiro; para os goblins, a faixa de origem é o vermelho da túnica (matiz próximo de 350°–10°). Gere azul, negro, púrpura e dourado e salve em `monsters/<id>_<cor>.png` e `anims/<id>_attack_sheet_<cor>.png`. Isso vale também para o Servo e o Arqueiro que já existem.
4. **Medir o pivot:** a altura dos pés em cada sheet (maior `getbbox()[3]` entre os 8 quadros). O pivot Y é `(640 − pés) ÷ 640`.
5. **Atualizar `spritecook-assets.json`:** `asset_id`, `sha12` (12 primeiros caracteres do SHA-256 do arquivo) e `label`.
6. **Atualizar a tabela da Etapa 3A** em `GuerreiroDaMasmorra.md` (arquivos e pivot Y) e a linha "Em aberto" da Parte 1 §13.

## Pendências de qualidade

- Refazer o ataque do Arqueiro para fechar o loop (prompt: depois de soltar, ele pega uma flecha nova na aljava e volta a mirar). 20 créditos.
- Idles do Servo e do Arqueiro (hoje usam a pose parada). 20 créditos cada.
