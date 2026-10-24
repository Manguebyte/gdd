# Old Knight and the Witch — arte PixelLab

Pixel art do protótipo `prototipos/old-knight-and-the-witch/`. O jogo lê as tiras daqui pelo `units.js`; os nomes das pastas e dos arquivos fazem parte da integração.

## Como foi feita
- **Personagens:** `create_character` em modo standard, 4 direções, boneco de 64 px num quadro de 92 px, vista "low top-down". Os ids estão em `_tools/chars.json`.
  - Estilo em todos: medium detail, medium shading, contorno preto, "dark medieval fantasy".
- **Animações:**
  - **Parado:** modelo `breathing-idle`.
  - **Corrida:** modelo `running-6-frames`.
  - **Golpe:** v3 personalizado, com 6 a 8 quadros e uma descrição do movimento.
  - **Direção:** só a que o jogo usa. Os heróis aparecem de costas (`north`) na batalha e de frente (`south`) no acampamento; os inimigos aparecem de frente (`south`).
- **Gosmas:** `create_1_direction_object` (64 px; 16 candidatos, escolhidos 2) + `animate_object` v3 (parado e golpe). As URLs estão em `_tools/objects.json`.
- **Script:** `_tools/baixar.py` baixa tudo e centraliza os quadros num quadrado único por personagem. Ele monta `idle.png`, `run.png` e `attack.png` (e `camp.png` nos heróis) e gera o `units.js`.

## Personagens
| Pasta | Quem | Descrição usada no PixelLab |
|---|---|---|
| `witch` | a Bruxa | teenage witch girl, long bright red hair, plain grey hooded cloak, small wooden magic wand |
| `oldknight` | o Velho Cavaleiro | old knight, long white hair and very long white beard, worn dented armor, torn brown cape, gigantic half-broken greatsword |
| `woodcutter` | o mesmo velho, como lenhador (só no prólogo) | old woodcutter, long white hair and beard, brown tunic and leather apron, large woodcutter axe |
| `villager` | Aldeão Furioso | angry peasant villager with a pitchfork |
| `crossbow` | Caçador de Bruxas | witch hunter, wide brimmed black hat, black leather coat, heavy crossbow |
| `guard` | Guarda da Inquisição | kettle helmet, red tabard with white cross, halberd |
| `priest` | Padre Inquisidor | black and red robes, tall pointed hood, holy book and censer |
| `torchwoman` | Aldeã com Tocha | village woman with headscarf and apron, burning torch |
| `zealot` | Fanático do Piche | hooded zealot in sackcloth, jars of burning tar |
| `hound` | Cão de Caça | black hunting hound, spiked collar (quadrúpede, template dog) |
| `executioner` | Carrasco | black leather hood, bare arms, executioner axe |
| `captain` | Capitão da Ordem | full plate, red cross, crested great helm, longsword and kite shield |
| `masterhunter` | Caçador-Mor | grey coat with stakes, tricorn hat, long bow |
| `inquisitor` | Grande Inquisidor | crimson and gold robes, mitre, golden staff with a burning cross |
| `slime` / `slimeking` | Gosma e Gosma Rainha | green forest slime; giant king slime with a crown of twigs and mushrooms |

## Interface (`ui/` e `cartas/`)
Ids em `_tools/ui.json`. Para baixar de novo, rode `_tools/baixar_ui.py`.
- **Ícones** (`ui/icons/`, 32×32): `create_image_pro_flash`, um por ícone. O estilo vem de uma célula da folha de teste, e depois da moeda.
  - A folha 4×4 de 128 px saiu com outros desenhos no lugar dos pedidos. Sete células dela viraram ícones: caveira, caveira em chamas, grimório, cristal, elmo, armas cruzadas e sigilo.
- **Ilustrações das cartas** (`cartas/`, 48×48): `create_image_pro_flash` com uma carta do Iso Cards como referência de estilo (`chamas.png`). Depois disso, a primeira carta gerada serviu de referência para as outras.
- **Molduras** (`ui/panel.png`, `button.png` e `button-red.png`): `create_ui_asset`.
  - Os botões vieram com a palavra "Button" desenhada no meio, e o script refaz o miolo repetindo uma faixa limpa da madeira.
  - O vermelho veio dentro de um kit maior e é recortado.

## Em aberto
- **Espada do Cavaleiro:** a espada saiu longa e inteira; o "meio quebrada" do GDD não apareceu. Uma nova geração (modo v3 ou pro) pode resolver.
- **Animações dos heróis:** só existem parado, corrida e golpe. Faltam guarda, pulo e esquiva (hoje o jogo usa a corrida e a pose parada no lugar).
