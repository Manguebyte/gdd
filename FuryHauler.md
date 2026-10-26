# GDD — Fury Hauler

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

> Documento vivo. Rascunho inicial: o conceito está fechado nas linhas gerais (tower defense em que a "torre" é um caminhão de guerra que anda sozinho de A até B), mas os números de balanceamento ainda não foram decididos. Os valores da tabela §15 e do Guia de Implementação Unity (Parte 2 em diante) são **placeholders de MVP**, não decisões fechadas.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Unity](#parte-2--guia-de-implementação-unity)
3. [Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-3--implementação-unity-fase-0-setup-do-projeto)
4. [Parte 4 — Implementação Unity: Fase 1 (Mundo Isométrico)](#parte-4--implementação-unity-fase-1-mundo-isométrico)
5. [Parte 5 — Implementação Unity: Fase 2 (Caminhão e Trecho)](#parte-5--implementação-unity-fase-2-caminhão-e-trecho)
6. [Parte 6 — Implementação Unity: Fase 3 (Inimigos)](#parte-6--implementação-unity-fase-3-inimigos)
7. [Parte 7 — Implementação Unity: Fase 4 (Defesas)](#parte-7--implementação-unity-fase-4-defesas)
8. [Parte 8 — Implementação Unity: Fase 5 (Sucata e Alocação)](#parte-8--implementação-unity-fase-5-sucata-e-alocação)
9. [Parte 9 — Implementação Unity: Fase 6 (Habilidades Ativas)](#parte-9--implementação-unity-fase-6-habilidades-ativas)
10. [Parte 10 — Implementação Unity: Fase 7 (Run Roguelite e Save)](#parte-10--implementação-unity-fase-7-run-roguelite-e-save)
11. [Parte 11 — Implementação Unity: Fase 8 (Build Web e Próximos Passos)](#parte-11--implementação-unity-fase-8-build-web-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Nome:** **Definido:** *Fury Hauler* (nome de trabalho; pode mudar).
- **Gênero:** **Definido:** tower defense em movimento com estrutura **roguelite**. No lugar da torre fixa há um **caminhão de guerra estilo Mad Max**. O objetivo é levá-lo inteiro do **ponto A ao ponto B**.
- **Dimensão:** **Definido:** 2.5D. A lógica do jogo roda num plano 2D (o "chão" da estrada) e a arte é desenhada em perspectiva isométrica. Não há física 3D.
- **Câmera/perspectiva:** **Definido:** isométrica, seguindo o caminhão.
- **Plataforma-alvo:** **Definido:** Web (navegador), jogado com mouse.
- **Referências:** **Definido:**
  - *Mad Max: Fury Road*: estética, perseguição no deserto, caminhão-fortaleza.
  - *Kingdom Rush* / *Bloons TD*: slots de defesa, compra e upgrade com moeda ganha na partida.
  - *FTL* / *Desperados*: cuidar de um veículo sob ataque e escolher a rota num mapa com bifurcações.
  - *Vampire Survivors*: armas que atiram sozinhas contra hordas.
- **Pilar de design:** **Em aberto**. Proposta para discutir, não decidida: *"Você não dirige, você arma: o caminhão segue em frente de qualquer jeito, e cada sucata vira uma decisão de onde ele vai morder."*
- **Fantasia central:** ser o artilheiro-chefe de um comboio no deserto, escolhendo em tempo real onde montar cada arma enquanto gangues cercam o caminhão.

## 2. Loop Principal

**Definido:**

1. Uma **run** é uma viagem do ponto A ao ponto B, dividida em **trechos**.
2. Antes de cada trecho, o jogador escolhe o próximo caminho num **mapa de rota com bifurcações** (§8).
3. Durante o trecho, o caminhão **anda sozinho**: o jogador **não controla** direção nem velocidade.
4. Gangues atacam o caminhão. As defesas montadas nos **slots** do caminhão **miram e atiram sozinhas** (§4).
5. Inimigos derrubados soltam **sucata**, usada **em tempo real** para comprar, trocar e melhorar defesas (§5).
6. O jogador também tem **habilidades ativas com cooldown** (§6).
7. Se o caminhão chegar ao fim do último trecho, a run é vencida. Se for destruído, a run acaba e **recomeça do zero**, mantendo só os **desbloqueios permanentes** (§9).

## 3. O Caminhão

- **Definido:** o caminhão é a "torre" do tower defense. Ele anda sozinho pela estrada, do começo ao fim do trecho, e o jogador não tem nenhum controle de movimento.
- **Definido:** o caminhão tem **pontos de vida**. Chegar a zero acaba a run.
- **Definido:** as defesas são montadas em **slots fixos no próprio caminhão** (teto, laterais, traseira) e viajam com ele.
- **Em aberto:**
  - Quantos slots e em que posições. Placeholder do MVP: 6 slots, sendo 1 no teto, 2 em cada lateral e 1 na traseira (§15).
  - Se a posição do slot limita o ângulo de tiro. Placeholder: o teto atira em qualquer direção, as laterais só para o próprio lado e a traseira só para trás. Isso cria a decisão "qual arma vai em qual lado".
  - Se o caminhão tem upgrades próprios (blindagem base, mais slots, velocidade) ou se existem vários caminhões para escolher.
  - Se a vida do caminhão é recuperada entre trechos, e como (placeholder: **não** é recuperada, a vida passa de um trecho para o outro).
  - Reparo do caminhão com sucata.

## 4. Defesas

**Definido:** as defesas **miram e atiram sozinhas** no inimigo mais próximo que estiver ao alcance. O papel do jogador é escolher **qual** defesa vai em **qual** slot e **quando** melhorar.

**Definido:** defesas do MVP:

| Defesa | Papel |
|---|---|
| **Metralhadora** | Tiro rápido, dano baixo, um alvo por vez. A defesa "padrão". |
| **Lança-chamas** | Cone curto com dano contínuo em todos dentro dele. Boa contra quem encosta no caminhão. |
| **Arpão** | Tiro lento e forte que **derruba** um veículo: o alvo fica atordoado, para de acompanhar e fica para trás. Só acerta veículos. |
| **Placas de blindagem com espinhos** | Passiva: reduz o dano que o caminhão recebe e fere quem chega perto do slot (inclusive saqueadores a bordo). |

- **Definido:** cada defesa pode ser **melhorada** com sucata.
- **Em aberto:**
  - Números de cada defesa (dano, alcance, cadência, custo). Placeholders em §15.
  - Quantos níveis de upgrade e se o upgrade só aumenta números ou também muda o comportamento (ex.: metralhadora dupla).
  - O que exatamente "puxar" no arpão significa além de atordoar (puxar o veículo para perto para o lança-chamas? arrancar o motorista?).
  - Defesas pós-MVP.

## 5. Sucata e Alocação

- **Definido:** inimigos derrubados soltam **sucata**. A sucata é a única moeda da run.
- **Definido:** a sucata é gasta **em tempo real, durante a viagem**, para:
  - **comprar** uma defesa e montar num slot vazio;
  - **melhorar** uma defesa já montada;
  - **trocar** uma defesa: vender a atual (recebendo parte do valor) e comprar outra no lugar.
- **Definido:** a sucata continua de um trecho para o outro dentro da mesma run e zera quando a run acaba.
- **Em aberto:**
  - Se a sucata é coletada automaticamente ou se o jogador precisa clicar nela (placeholder: entra direto na carteira quando o inimigo morre).
  - Se o jogo pausa ou entra em câmera lenta enquanto o jogador aloca defesas (placeholder: não pausa).
  - Quanto a venda devolve (placeholder: 50% de tudo que foi gasto na defesa).
  - Se é possível mover uma defesa de um slot para outro sem vender.
  - Se dá para comprar entre trechos, na tela do mapa de rota (placeholder: sim, porque nada impede).
  - Sucata inicial da run (placeholder: 100).

## 6. Habilidades Ativas

- **Definido:** além de alocar, o jogador tem **habilidades ativas com cooldown**, usadas por botão (e atalho de teclado).
- **Em aberto:** a lista de habilidades. Candidatas usadas como **placeholder** no MVP:
  - **Nitro:** o caminhão acelera por alguns segundos e deixa para trás quem está perseguindo.
  - **Mancha de óleo:** joga óleo na estrada atrás do caminhão; veículos que passam por ela rodam (ficam atordoados).
- **Em aberto:** se as habilidades são fixas, desbloqueadas na meta-progressão ou escolhidas antes da run.

## 7. Inimigos

**Definido:** inimigos do MVP:

| Inimigo | Comportamento |
|---|---|
| **Motoqueiros** | Rápidos e frágeis. Emparelham com o caminhão pela lateral e atiram. |
| **Buggies de abordagem** | Encostam no caminhão e soltam **saqueadores** que sobem a bordo. |
| **Carros-bomba** | Vão direto no caminhão e explodem ao bater. Se forem destruídos antes, não causam dano. |
| **Chefe: caminhão de guerra** | Veículo grande no último trecho da run. |

- **Definido:** os inimigos chegam principalmente **por trás**, perseguindo o caminhão. Quem fica para trás demais sai do jogo sem dar sucata.
- **Em aberto:**
  - O que o **saqueador** faz a bordo. Placeholder: ele ocupa um slot, **sabota a defesa daquele slot** (ela para de funcionar) e causa dano contínuo ao caminhão até ser morto pelas defesas.
  - Comportamento do **chefe**. Placeholder: emparelha e atira como um motoqueiro muito resistente, e chama um motoqueiro de reforço de tempos em tempos.
  - Se o chefe precisa ser destruído para chegar a B (placeholder: sim, enquanto ele estiver vivo o caminhão continua na estrada).
  - Inimigos que vêm pela frente (barricadas, emboscadas).
  - Ataques à distância visíveis (projéteis) ou instantâneos (placeholder: instantâneos, com o caminhão piscando ao levar dano).

## 8. A Viagem: Trechos e Rota

- **Definido:** a run é uma rota **gerada a cada run**, com **escolhas de caminho** entre trechos (mapa em camadas, no estilo FTL/Slay the Spire).
- **Definido:** o último trecho termina no ponto B e tem o chefe.
- **Definido:** cada trecho é uma estrada do começo ao fim. O trecho termina quando o caminhão chega ao fim dele.
- **Em aberto:**
  - Quantos trechos por run (placeholder: 6, sendo 5 comuns e o do chefe).
  - Tipos de trecho/nó do mapa (oficina para reparo, loja, evento, trecho perigoso com mais sucata...). Placeholder: os nós só variam em **risco**, e mais risco significa mais inimigos e mais sucata.
  - Se a estrada tem curvas, terrenos diferentes ou obstáculos. Placeholder: estrada reta no deserto.
  - Duração de um trecho (placeholder: 90 s).

## 9. Progressão Permanente (Meta)

- **Definido:** quando a run acaba, o jogador recomeça do zero, mas mantém **desbloqueios permanentes**.
- **Em aberto:**
  - **O que** é desbloqueado (defesas, habilidades, caminhões, slots, bônus iniciais).
  - **Como** se desbloqueia (moeda permanente, metas, distância alcançada).
  - Placeholder do MVP: metralhadora e blindagem começam liberadas, o lança-chamas libera depois de completar 1 trecho em qualquer run, e o arpão depois de completar 3 trechos numa mesma run.

## 10. Condições de Vitória e Derrota

- **Definido:** **vitória** é chegar a B, ou seja, terminar o último trecho.
- **Definido:** **derrota** é a vida do caminhão chegar a zero. A run acaba e recomeça do zero (§9).
- **Em aberto:** se existe pontuação ou ranking local (tempo, sucata, vida restante).

## 11. Estilo Visual

- **Definido:** isométrico, deserto pós-apocalíptico no espírito de *Mad Max: Fury Road* (ferrugem, cromo, poeira, fogo).
- **Em aberto:**
  - Pixel art ou vetor, e com qual ferramenta (o estúdio já usa PixelLab e SpriteCook em outros jogos).
  - Paleta.
  - Quantas direções cada veículo precisa (com a estrada reta em diagonal, o MVP precisa de pouco: o caminhão e os inimigos andam quase sempre na mesma direção).

## 12. HUD / UI

**Definido:** o que fica na tela durante o trecho é derivado das mecânicas:

- Sucata atual.
- Vida do caminhão.
- Progresso do trecho (de A até o fim do trecho) e nome do trecho.
- Barra de compra com as defesas liberadas e seus custos.
- Painel da defesa selecionada (nível, melhorar, vender).
- Botões das habilidades com cooldown visível.

**Em aberto:** layout final, mensagens de feedback (ex.: "sucata insuficiente"), indicador de inimigos fora da tela.

## 13. Áudio

**Em aberto.** Nada decidido ainda.

## 14. Backend / Serviços

- **Definido:** **offline**, sem conta, sem servidor e sem leaderboard. O progresso permanente fica em **save local** no navegador.
- **Em aberto:** leaderboard no padrão Firebase do estúdio, se um dia o jogo ganhar pontuação (§10).

## 15. Escopo do MVP

**Definido:** entra no MVP:

- Caminhão andando sozinho numa estrada isométrica, com vida e slots.
- As 4 defesas da §4, com compra, upgrade e venda por sucata em tempo real.
- Os 4 inimigos da §7 (mais o saqueador que o buggy solta).
- Habilidades ativas com cooldown (placeholders: nitro e mancha de óleo).
- Run roguelite: mapa de rota com bifurcações, trechos em sequência e chefe no fim.
- Desbloqueios permanentes simples e save local.
- Build Web.

**Fica para depois:**

- Arte final e áudio.
- Mais defesas, inimigos, habilidades e tipos de nó no mapa.
- Curvas, terrenos e obstáculos na estrada.
- Upgrades do próprio caminhão.
- Leaderboard.

### Placeholders de Balanceamento

> Todos os valores são **placeholders de MVP**. No guia Unity eles ficam em assets (`GameConfig`, `DefenseDef`, `EnemyDef`, `AbilityDef`), para ajustar sem mexer em código. Distâncias em metros do chão da estrada.

| Item | Valor placeholder |
|---|---|
| Caminhão | 500 de vida, 10 m/s |
| Redução de dano máxima (soma das blindagens) | 60% |
| Trecho | 900 m (~90 s) |
| Estrada | 12 m de largura |
| Sucata inicial da run | 100 |
| Venda | devolve 50% do total gasto na defesa |
| Upgrade | +35% nos números por nível, até o nível 3 |

| Defesa | Custo (e custo de upgrade por nível) | Alcance | Efeito |
|---|---|---|---|
| Metralhadora | 40 | 9 | 6 de dano a cada 0,15 s |
| Lança-chamas | 60 | 4,5 | 35 de dano/s em cone de 60° |
| Arpão | 70 | 12 | 40 de dano a cada 3 s, atordoa 2,5 s, só veículos |
| Blindagem com espinhos | 50 | 2,5 | -10% de dano recebido; espinhos de 15 de dano/s |

| Inimigo | Vida | Velocidade | Ataque | Sucata | Custo de spawn | Dificuldade mínima |
|---|---|---|---|---|---|---|
| Motoqueiro | 30 | 16 | 4 a cada 1 s | 8 | 1 | 0 |
| Carro-bomba | 50 | 18 | 60 ao bater | 12 | 2 | 1 |
| Buggy de abordagem | 80 | 14 | solta 2 saqueadores, 1 a cada 2 s | 15 | 3 | 2 |
| Saqueador | 20 | — | 6/s no caminhão e sabota o slot | 3 | — | — |
| Chefe: caminhão de guerra | 1500 | 12 | 15 a cada 1,5 s; chama 1 motoqueiro a cada 6 s | 150 | — | — |

| Spawn e rota | Valor placeholder |
|---|---|
| Orçamento de spawn | 0,25 + 0,1 × dificuldade pontos/s |
| Dificuldade do trecho | número do trecho + risco |
| Camadas da rota | 6 (5 comuns + chefe), 2 a 3 caminhos por camada |
| Risco de um nó | 0 a 2; cada ponto dá +25% de sucata |
| Chefe aparece em | 30% do último trecho |

| Habilidade | Cooldown | Efeito |
|---|---|---|
| Nitro | 20 s | velocidade ×1,6 por 4 s |
| Mancha de óleo | 15 s | mancha de 8 m que dura 5 s e atordoa veículos por 1,5 s |

## 16. Riscos / Em aberto (consolidado)

- **Pilar de design** (há uma proposta na §1).
- **Profundidade da decisão de alocação.** Com mira automática e sem controle do caminhão, o jogo depende de escolhas de slot que importem de verdade (ângulo de tiro por slot, inimigos que vêm de lados diferentes, saqueadores). É o maior risco de design: se qualquer defesa em qualquer slot funcionar igual, sobra pouco para o jogador fazer.
- Quantidade, posição e ângulo dos slots (§3).
- Upgrades do caminhão, reparo e vida entre trechos (§3).
- Números, níveis e upgrades que mudam comportamento (§4).
- Coleta de sucata, pausa durante alocação, valor de venda, mover defesas, compra entre trechos (§5).
- Lista de habilidades (§6).
- Comportamento do saqueador e do chefe; inimigos pela frente (§7).
- Número de trechos, tipos de nó, curvas e terrenos (§8).
- O que e como desbloquear na meta-progressão (§9).
- Pontuação/ranking (§10).
- Estilo de arte, ferramenta e paleta (§11).
- Layout do HUD (§12).
- Áudio (§13).

## Histórico de versões

- **0.1.0** (2026-10-26): início do versionamento; marca o estado do GDD e do protótipo neste dia.

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para implementar o MVP do Fury Hauler em Unity 6, com build Web. Os números vêm dos placeholders da Parte 1 §15 e ficam em assets (`GameConfig` e os `...Def`), para dar para balancear sem mexer no código. As regras marcadas como **Em aberto** que o código precisa decidir de algum jeito viram opções do `GameConfig` ou ficam isoladas num lugar só, para trocar de ideia sem reescrever nada.

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele.
- **Namespaces:**
  - `FuryHauler.World`: projeção isométrica, posição no chão, estrada e câmera.
  - `FuryHauler.Data`: ScriptableObjects de configuração, defesas, inimigos e habilidades.
  - `FuryHauler.Truck`: o caminhão, sua vida e seus slots.
  - `FuryHauler.Trip`: o trecho em andamento e o spawn de inimigos.
  - `FuryHauler.Enemies`: os inimigos.
  - `FuryHauler.Defenses`: as defesas.
  - `FuryHauler.Economy`: sucata e alocação (comprar, melhorar, vender).
  - `FuryHauler.Abilities`: habilidades ativas.
  - `FuryHauler.Run`: rota, run e save da meta-progressão.
  - `FuryHauler.UI`: HUD e painéis.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Textos na tela sem emoji**, porque a fonte padrão do TextMeshPro não tem emojis.

## Arquitetura em uma página

```
 Chão (lógica 2D, metros)                          Tela (isométrico)
 ────────────────────────                          ─────────────────
 x = distância na estrada, y = lado              GroundBody ── IsoProjection.ToScreen ──▶ transform.position
                                                                                          + ordem de desenho

 RunManager ──escolhe nó──▶ TripManager.StartTrip ──Started──▶ EnemySpawner (orçamento por segundo)
     ▲                           │                                   │ instancia
     │ Ended(sucesso?)           │ IsDriving                         ▼
     └───────────────────────────┤                    Enemy (Biker / Rammer / Boarder / Raider / Boss)
                                 ▼                         │ TakeDamage ▲             │ Killed
                           TruckController ──Slots──▶ TruckSlot ──▶ Defense ──────┘   ▼
                           TruckHealth ◀──dano──── inimigos         (mira sozinha)   ScrapWallet
                                                                                      │
 Mouse ──▶ AllocationController (comprar / melhorar / vender) ◀──────────────────────┘
 Teclas/botões ──▶ AbilityController (nitro, óleo)
```

- **Regra de ouro: toda a lógica acontece no "chão", nunca na tela.** Cada coisa do jogo tem uma posição `Ground` (um `Vector2` em metros): `x` é quanto já andou na estrada e `y` é o desvio para o lado (positivo = esquerda do caminhão). Distância, alcance, ângulo de tiro e colisão são calculados ali. Só o `GroundBody` converte essa posição para a tela isométrica.
- **Por que isso importa aqui:** no isométrico, "3 metros" na tela não têm o mesmo tamanho na horizontal e na vertical (a tela é achatada). Se o alcance da metralhadora fosse medido na tela, ele seria maior para os lados do que para frente. Medindo no chão, um círculo de alcance é um círculo de verdade.
- **Sem física.** Nada cai, quica ou empurra. Não há `Rigidbody2D` nem `Collider2D`: os inimigos se movem por `Vector2.MoveTowards` e os acertos são checagens de distância. Por isso a nota de `rb.linearVelocity`/`rb.velocity` não se aplica a este guia.

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, organizado, com os pacotes certos e pronto para build Web.

### 0.1 Criar o projeto

1. Instale o **Unity Hub** e uma versão **Unity 6 LTS** (6000.x) com o módulo **Web Build Support** (o alvo é navegador, Parte 1 §1).
2. No Hub, crie um projeto com **New project → Universal 2D** e o nome `FuryHauler`.
   - É aqui que o "2.5D" definido na Parte 1 vira decisão técnica: **o projeto é 2D**. O template 2D já vem com URP 2D, sprites e câmera ortográfica.
   - **Isométrico não muda o template.** O "isométrico" vem de uma conta (`IsoProjection`, Fase 1) que converte a posição no chão em posição na tela, e da arte desenhada em perspectiva.
   - O **2D Tilemap Editor** (que tem grade isométrica pronta) não é usado: a estrada é uma faixa reta que rola sem fim, mais simples de montar com sprites soltos reciclados (Fase 1).

### 0.2 Estrutura de pastas

Crie dentro de `Assets/`:

```
Assets/_Project/
  Scripts/
    World/       (projeção isométrica, estrada, câmera)
    Data/        (GameConfig e os ...Def)
    Truck/       (caminhão, vida, slots)
    Trip/        (trecho e spawn)
    Enemies/
    Defenses/
    Economy/     (sucata e alocação)
    Abilities/
    Run/         (rota, run, save)
    UI/
  Resources/     (só o GameConfig)
  ScriptableObjects/
    Defenses/
    Enemies/
    Abilities/
  Prefabs/
    Enemies/
    Defenses/
    UI/
  Scenes/        (Game)
  Sprites/
```

### 0.3 Pacotes (Window → Package Manager)

| Pacote | Para quê |
|---|---|
| **Input System** (já vem no Unity 6) | Ler clique do mouse e teclas de atalho. |
| **2D Sprite** (vem com o template 2D) | Criar sprites placeholder pelo menu **Create → 2D → Sprites** (losango isométrico, círculo, quadrado). |
| **TextMeshPro** (parte do pacote uGUI no Unity 6) | Textos da UI. No primeiro uso, aceite **Import TMP Essentials**. |

### 0.4 Cena, camadas de desenho e input

1. Crie a cena `Game` em `Assets/_Project/Scenes/` e adicione-a em **File → Build Profiles → Scene List**.
2. **Sorting Layers** (Edit → Project Settings → Tags and Layers → Sorting Layers), nesta ordem:
   - `Chao`: estrada e manchas de óleo, sempre por baixo.
   - `Mundo`: caminhão e inimigos.
   - `FX`: rastros de tiro e efeitos.
3. Em **Edit → Project Settings → Player → Other Settings → Active Input Handling**, deixe **Input System Package (New)** ou **Both**.
4. Na **Main Camera**: **Projection = Orthographic**, **Size = 7**, **Background** com uma cor de areia (ex.: `#D9B47A`). Por enquanto o fundo de areia é o deserto inteiro.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- A cena `Game` está na Scene List do Build Profile.
- As 3 Sorting Layers existem na ordem `Chao`, `Mundo`, `FX`.
- Apertar Play mostra a tela cor de areia, sem erros.

#### Problemas comuns
- **Não aparece a plataforma Web no Build Profiles:** o módulo **Web Build Support** não foi instalado. No Unity Hub, vá em **Installs → (sua versão) → Add modules**.
- **`InputSystem` não encontrado nos scripts:** o pacote Input System não está instalado, ou o Active Input Handling está em "Input Manager (Old)".

Próxima fase: **Mundo Isométrico**, com a conta chão → tela, a estrada e a câmera.

---

# Parte 4 — Implementação Unity: Fase 1 (Mundo Isométrico)

## Fase 1 — Mundo Isométrico

> Objetivo desta fase: um objeto andando sozinho por uma estrada isométrica infinita, com a câmera seguindo.

### 1.1 A conta chão → tela: `IsoProjection`

```csharp
// Caminho: Assets/_Project/Scripts/World/IsoProjection.cs
using UnityEngine;

namespace FuryHauler.World
{
    // POR QUE: toda a lógica do jogo acontece no "chão" (metros, sem perspectiva),
    // mas a tela é isométrica. Esta classe é o único lugar que sabe converter um
    // no outro, então mudar o ângulo da câmera no futuro mexe só aqui.
    // ESTRATÉGIA: isométrico clássico 2:1 (o losango de um metro de chão tem o
    // dobro de largura em relação à altura). O eixo x do chão (a estrada) sobe
    // para a direita na tela, e o eixo y do chão (o lado esquerdo do caminhão)
    // sobe para a esquerda. É uma classe "static": não vai em nenhum objeto da
    // cena, é só um conjunto de funções.
    public static class IsoProjection
    {
        // Metade da largura e metade da altura, na tela, de 1 metro de chão.
        public const float HalfWidth = 0.5f;
        public const float HalfHeight = 0.25f;

        // Converte um ponto do chão (com uma altura opcional, ex.: o teto do
        // caminhão) em posição na tela (coordenadas de mundo da Unity).
        public static Vector3 ToScreen(Vector2 ground, float height = 0f)
        {
            float x = (ground.x - ground.y) * HalfWidth;
            float y = (ground.x + ground.y) * HalfHeight + height;
            return new Vector3(x, y, 0f);
        }

        // Converte um ângulo no chão (0 = frente da estrada, 90 = esquerda,
        // -90 = direita, 180 = trás) em vetor de comprimento 1.
        public static Vector2 Dir(float degrees)
        {
            float rad = degrees * Mathf.Deg2Rad;
            return new Vector2(Mathf.Cos(rad), Mathf.Sin(rad));
        }
    }
}
```

### 1.2 Uma coisa no chão: `GroundBody`

```csharp
// Caminho: Assets/_Project/Scripts/World/GroundBody.cs
using UnityEngine;
using UnityEngine.Rendering;

namespace FuryHauler.World
{
    // POR QUE: caminhão, inimigos e manchas de óleo vivem no chão. Este componente
    // guarda essa posição e, todo frame, coloca o objeto no lugar certo da tela e
    // na ordem certa de desenho (no isométrico, o que está "mais perto" da câmera
    // precisa ser desenhado por cima).
    // ESTRATÉGIA: a ordem de desenho vem de (x + y) no chão: quanto maior, mais
    // "para o fundo" da tela, então menor a ordem. Um SortingGroup faz o objeto
    // inteiro (com todos os sprites filhos) ser ordenado como um bloco só, o que
    // impede, por exemplo, que a roda de um inimigo apareça por cima do caminhão.
    [RequireComponent(typeof(SortingGroup))]
    public class GroundBody : MonoBehaviour
    {
        // Precisão da ordenação: 10 = diferenças de 10 cm já mudam a ordem.
        private const float SortPrecision = 10f;

        [SerializeField] private float _height;   // altura acima do chão, em unidades de tela
        [SerializeField] private int _sortBias;   // empurra a ordem para frente (ex.: saqueador em cima do caminhão)

        private SortingGroup _sorting;

        // Posição no chão em metros. É uma propriedade, então para mudar só o x
        // escreva "Ground += new Vector2(dx, 0)" (não dá para fazer "Ground.x += dx").
        public Vector2 Ground { get; set; }

        public float Height
        {
            get => _height;
            set => _height = value;
        }

        // Awake roda uma vez, quando o objeto nasce, antes de qualquer Start.
        private void Awake()
        {
            _sorting = GetComponent<SortingGroup>();
        }

        // LateUpdate roda depois de todos os Update do frame: aqui a lógica já
        // moveu o Ground, e só falta desenhar no lugar novo.
        private void LateUpdate()
        {
            Apply();
        }

        // Atualiza posição na tela e ordem de desenho agora (útil logo depois de
        // teleportar o objeto, para ele não aparecer um frame no lugar antigo).
        public void Apply()
        {
            transform.position = IsoProjection.ToScreen(Ground, _height);
            _sorting.sortingOrder = _sortBias - Mathf.RoundToInt((Ground.x + Ground.y) * SortPrecision);
        }
    }
}
```

> A `sortingOrder` aceita valores de -32768 a 32767. Com precisão 10, isso cobre uns 3 km de estrada, bem mais que um trecho (900 m, Parte 1 §15). Se um trecho ficar maior que isso, reduza `SortPrecision`.

### 1.3 A estrada: `RoadView`

```csharp
// Caminho: Assets/_Project/Scripts/World/RoadView.cs
using System.Collections.Generic;
using UnityEngine;

namespace FuryHauler.World
{
    // POR QUE: a estrada parece infinita, mas criar 900 metros de sprites seria
    // desperdício. Só os pedaços perto da câmera precisam existir.
    // ESTRATÉGIA: a estrada é uma fila de quadrados de chão (largura × largura).
    // No isométrico, um quadrado de chão vira um losango, então o sprite
    // "Isometric Diamond" serve de placeholder. Um número fixo de pedaços é
    // criado uma vez e reposicionado conforme o objeto seguido avança
    // (reciclagem, sem criar nem destruir nada durante o jogo).
    public class RoadView : MonoBehaviour
    {
        [SerializeField] private GroundBody _follow;          // normalmente o caminhão
        [SerializeField] private SpriteRenderer _tilePrefab;  // losango isométrico
        [SerializeField] private float _roadWidth = 12f;      // metros; igual a 2 × GameConfig.roadHalfWidth
        [SerializeField] private int _tilesBehind = 3;
        [SerializeField] private int _tilesAhead = 6;

        private readonly List<SpriteRenderer> _tiles = new();
        private int _firstIndex = int.MinValue;

        // Start roda uma vez, no primeiro frame em que o objeto está ativo.
        private void Start()
        {
            int count = _tilesBehind + _tilesAhead + 1;
            for (int i = 0; i < count; i++)
            {
                SpriteRenderer tile = Instantiate(_tilePrefab, transform);
                FitToGround(tile);
                _tiles.Add(tile);
            }
        }

        // Estica o sprite para ocupar exatamente um quadrado de chão de
        // _roadWidth × _roadWidth metros, qualquer que seja o tamanho da imagem.
        private void FitToGround(SpriteRenderer tile)
        {
            Vector3 size = tile.sprite.bounds.size;
            float targetWidth = _roadWidth * IsoProjection.HalfWidth * 2f;
            float targetHeight = _roadWidth * IsoProjection.HalfHeight * 2f;
            tile.transform.localScale = new Vector3(targetWidth / size.x, targetHeight / size.y, 1f);
        }

        // Quando o objeto seguido passa para o próximo pedaço, todos os pedaços
        // são redistribuídos em volta dele.
        private void LateUpdate()
        {
            if (_follow == null) return;

            int center = Mathf.FloorToInt(_follow.Ground.x / _roadWidth);
            int first = center - _tilesBehind;
            if (first == _firstIndex) return;
            _firstIndex = first;

            for (int i = 0; i < _tiles.Count; i++)
            {
                int index = first + i;
                Vector2 tileCenter = new Vector2((index + 0.5f) * _roadWidth, 0f);
                _tiles[i].transform.position = IsoProjection.ToScreen(tileCenter);
            }
        }
    }
}
```

### 1.4 A câmera: `CameraFollow`

```csharp
// Caminho: Assets/_Project/Scripts/World/CameraFollow.cs
using UnityEngine;

namespace FuryHauler.World
{
    // POR QUE: o caminhão nunca para, então a câmera precisa ir junto, com um
    // pouco de folga à frente para o jogador ver quem está chegando.
    // ESTRATÉGIA: segue um ponto no chão um pouco à frente do alvo, com
    // suavização exponencial (chega rápido quando está longe e devagar quando
    // está perto, sem tremer). DefaultExecutionOrder(100) faz este LateUpdate
    // rodar depois do LateUpdate do GroundBody, que já posicionou o alvo.
    [DefaultExecutionOrder(100)]
    public class CameraFollow : MonoBehaviour
    {
        [SerializeField] private GroundBody _target;
        [SerializeField] private Vector2 _groundOffset = new Vector2(3f, 0f); // metros à frente
        [SerializeField] private float _sharpness = 6f;

        private void LateUpdate()
        {
            if (_target == null) return;

            Vector3 goal = IsoProjection.ToScreen(_target.Ground + _groundOffset);
            goal.z = transform.position.z; // a câmera 2D fica em z = -10; não mexer nisso
            float t = 1f - Mathf.Exp(-_sharpness * Time.deltaTime);
            transform.position = Vector3.Lerp(transform.position, goal, t);
        }
    }
}
```

### 1.5 Um teste que anda sozinho: `GroundDriverTest`

Script temporário, só para esta fase. Na Fase 2 o `TruckController` faz isso de verdade e este arquivo pode ser apagado.

```csharp
// Caminho: Assets/_Project/Scripts/World/GroundDriverTest.cs
using UnityEngine;

namespace FuryHauler.World
{
    // POR QUE: testar estrada e câmera antes de existir o caminhão.
    // ESTRATÉGIA: empurra o GroundBody para frente no eixo x do chão.
    [RequireComponent(typeof(GroundBody))]
    public class GroundDriverTest : MonoBehaviour
    {
        [SerializeField] private float _speed = 10f; // metros por segundo

        private GroundBody _body;

        private void Awake()
        {
            _body = GetComponent<GroundBody>();
        }

        // Update roda uma vez por frame; Time.deltaTime é o tempo desde o frame
        // anterior, então "velocidade × deltaTime" anda certo em qualquer FPS.
        private void Update()
        {
            _body.Ground += new Vector2(_speed * Time.deltaTime, 0f);
        }
    }
}
```

### 1.6 Montar a cena

1. **Sprites placeholder:** em `Assets/_Project/Sprites/`, clique com o botão direito → **Create → 2D → Sprites → Isometric Diamond** (nome `Diamond`), e também **Square** e **Circle**.
2. **Prefab do pedaço de estrada:** arraste o `Diamond` para a cena, renomeie para `RoadTile`, pinte de cinza-escuro (`#4A4038`), **Sorting Layer = Chao**, e arraste para `Prefabs/` para virar prefab. Apague da cena.
3. **Objeto de teste:** crie um GameObject vazio `Truck`, adicione **GroundBody** (o `SortingGroup` entra junto) e **GroundDriverTest**. No `SortingGroup`, **Sorting Layer = Mundo**. Como filho, adicione um sprite `Square` chamado `Body`, cor de ferrugem (`#8C3B1E`), escala `(1.6, 0.8, 1)`.
4. **Estrada:** GameObject vazio `Road` com **RoadView**: `Follow` = `Truck`, `Tile Prefab` = `RoadTile`.
5. **Câmera:** adicione **CameraFollow** na `Main Camera`, com `Target` = `Truck`.

### ✅ Checkpoint da Fase 1
- No Play, o quadrado do caminhão anda na diagonal (subindo para a direita) e a câmera vai junto.
- A estrada cinza nunca acaba e não tem buracos entre os losangos.
- Na janela **Hierarchy**, o número de `RoadTile` fica fixo (10) durante o Play.

#### Problemas comuns
- **Buracos ou sobreposição entre os losangos:** o sprite tem borda transparente. Abra o sprite no **Sprite Editor** e confira se o losango encosta nas bordas da imagem; o `FitToGround` estica a imagem inteira, não só a parte visível.
- **A câmera treme:** confira se o `CameraFollow` está mesmo com `[DefaultExecutionOrder(100)]`. Sem isso, às vezes ela segue a posição do frame anterior.

Próxima fase: **Caminhão e Trecho**, com o caminhão de verdade, vida, slots e o fim do trecho.

---

# Parte 5 — Implementação Unity: Fase 2 (Caminhão e Trecho)

## Fase 2 — Caminhão e Trecho

> Objetivo desta fase: o caminhão anda sozinho do começo ao fim de um trecho de 900 m, tem vida e 6 slots marcados, e o jogo sabe quando o trecho acabou.

### 2.1 Os números do jogo: `GameConfig`

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameConfig.cs
using UnityEngine;

namespace FuryHauler.Data
{
    // POR QUE: os números do jogo ainda são placeholders (Parte 1 §15). Num
    // asset, dá para mudar no Inspector, até durante o Play, sem tocar em código.
    // ESTRATÉGIA: um ScriptableObject é um "arquivo de dados" da Unity, criado
    // pelo menu Create. Como existe um só, ele fica em Resources/ e é carregado
    // por nome na primeira vez que alguém pede GameConfig.I.
    [CreateAssetMenu(menuName = "Fury Hauler/Game Config", fileName = "GameConfig")]
    public class GameConfig : ScriptableObject
    {
        [Header("Caminhão (Parte 1 §3)")]
        public float truckMaxHp = 500f;
        public float truckSpeed = 10f;              // metros por segundo
        [Range(0f, 1f)] public float maxDamageReduction = 0.6f;

        [Header("Trecho (Parte 1 §8)")]
        public float tripLength = 900f;             // metros
        public float roadHalfWidth = 6f;            // metros de cada lado do centro
        public float enemyDespawnBehind = 35f;      // inimigo mais atrás que isso some sem dar sucata

        [Header("Spawn de inimigos (Parte 1 §15)")]
        public float spawnBudgetBase = 0.25f;       // pontos por segundo
        public float spawnBudgetPerDifficulty = 0.1f;
        public float spawnBehindMin = 18f;
        public float spawnBehindMax = 24f;
        [Range(0f, 1f)] public float bossSpawnAtProgress = 0.3f;

        [Header("Sucata (Parte 1 §5)")]
        public int startingScrap = 100;
        [Range(0f, 1f)] public float sellRefund = 0.5f;

        [Header("Rota (Parte 1 §8)")]
        public int routeLayers = 6;                 // inclui o trecho do chefe
        public int minNodesPerLayer = 2;
        public int maxNodesPerLayer = 3;
        public int maxRisk = 2;
        public float scrapBonusPerRisk = 0.25f;

        [Header("Regras Em aberto (placeholders)")]
        public bool carryTruckHpBetweenTrips = true; // Parte 1 §3
        public bool bossBlocksArrival = true;        // Parte 1 §7

        private static GameConfig _instance;

        // Acesso de qualquer script: GameConfig.I.truckSpeed
        public static GameConfig I
        {
            get
            {
                if (_instance == null)
                {
                    _instance = Resources.Load<GameConfig>("GameConfig");
                    if (_instance == null)
                        Debug.LogError("GameConfig não encontrado. Crie em Assets/_Project/Resources/GameConfig.asset.");
                }
                return _instance;
            }
        }
    }
}
```

### 2.2 Um slot no caminhão: `TruckSlot` (versão 1)

Esta versão só sabe **onde** o slot fica e **para onde** ele pode atirar. Na Fase 4 ela é substituída pela versão final, que também guarda a defesa montada.

```csharp
// Caminho: Assets/_Project/Scripts/Truck/TruckSlot.cs
using FuryHauler.World;
using UnityEngine;

namespace FuryHauler.Truck
{
    // POR QUE: a decisão central do jogador é "qual defesa em qual slot"
    // (Parte 1 §3). Cada slot tem uma posição no caminhão e um ângulo de tiro.
    // ESTRATÉGIA: o slot guarda um deslocamento no chão em relação ao centro do
    // caminhão, então sua posição real é sempre "caminhão + deslocamento". O
    // ângulo de tiro é um leque: direção central + abertura (360 = qualquer
    // lado). DefaultExecutionOrder(50) faz o slot se posicionar depois do
    // GroundBody do caminhão, para não ficar um frame atrasado.
    [DefaultExecutionOrder(50)]
    public class TruckSlot : MonoBehaviour
    {
        [SerializeField] private string _label = "Teto";
        [SerializeField] private Vector2 _offset;                 // metros a partir do centro do caminhão
        [SerializeField] private float _height = 0.6f;           // altura na tela (em cima do caminhão)
        [SerializeField] private float _facingDegrees;           // 0 frente, 90 esquerda, -90 direita, 180 trás
        [SerializeField, Range(10f, 360f)] private float _arcDegrees = 360f;
        [SerializeField] private SpriteRenderer _marker;
        [SerializeField] private Color _idleColor = new Color(1f, 1f, 1f, 0.35f);
        [SerializeField] private Color _sabotagedColor = Color.red;

        private int _saboteurs;

        public TruckController Truck { get; private set; }
        public string Label => _label;
        public float FacingDegrees => _facingDegrees;
        public float ArcDegrees => _arcDegrees;
        public bool Sabotaged => _saboteurs > 0;
        public Vector2 Ground => Truck.Body.Ground + _offset;

        // Chamado pelo caminhão no Awake dele: o slot passa a saber a quem pertence.
        public void Bind(TruckController truck)
        {
            Truck = truck;
        }

        // Diz se um ponto no chão está dentro do leque de tiro deste slot.
        public bool CanTarget(Vector2 point)
        {
            if (_arcDegrees >= 360f) return true;
            Vector2 toPoint = point - Ground;
            float angle = Vector2.SignedAngle(IsoProjection.Dir(_facingDegrees), toPoint);
            return Mathf.Abs(angle) <= _arcDegrees * 0.5f;
        }

        // Saqueadores (Fase 3) avisam quando sobem e quando saem do slot.
        public void AddSaboteur() => _saboteurs++;
        public void RemoveSaboteur() => _saboteurs = Mathf.Max(0, _saboteurs - 1);

        private void LateUpdate()
        {
            if (Truck == null) return;
            transform.position = IsoProjection.ToScreen(Ground, _height);
            if (_marker != null) _marker.color = Sabotaged ? _sabotagedColor : _idleColor;
        }
    }
}
```

### 2.3 A vida do caminhão: `TruckHealth`

```csharp
// Caminho: Assets/_Project/Scripts/Truck/TruckHealth.cs
using System;
using FuryHauler.Data;
using UnityEngine;

namespace FuryHauler.Truck
{
    // POR QUE: vida zero acaba a run (Parte 1 §10). Todo dano dos inimigos
    // passa por aqui, então a redução das blindagens (Fase 4) fica num lugar só.
    // ESTRATÉGIA: eventos C# (event Action) avisam a UI e o TripManager quando a
    // vida muda ou chega a zero, sem eles precisarem checar todo frame. O sprite
    // do caminhão pisca em vermelho ao levar dano, porque os tiros inimigos são
    // instantâneos (placeholder, Parte 1 §7) e o jogador precisa perceber.
    public class TruckHealth : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _bodyRenderer;
        [SerializeField] private Color _hitColor = new Color(1f, 0.3f, 0.3f);

        private TruckController _truck;
        private Color _baseColor;
        private float _flashTimer;

        public float Max => GameConfig.I.truckMaxHp;
        public float Current { get; private set; }
        public bool IsDead => Current <= 0f;

        public event Action Changed;
        public event Action Died;

        // Quanto do dano é ignorado (0 a 1). Na Fase 4 esta linha passa a somar as blindagens.
        public float DamageReduction => 0f;

        private void Awake()
        {
            _truck = GetComponent<TruckController>();
            Current = Max;
            if (_bodyRenderer != null) _baseColor = _bodyRenderer.color;
        }

        // Volta para a vida cheia (começo de run).
        public void ResetFull()
        {
            Current = Max;
            Changed?.Invoke();
        }

        // Aplica dano, já descontando a redução das blindagens.
        public void TakeDamage(float amount)
        {
            if (IsDead || amount <= 0f) return;

            Current = Mathf.Max(0f, Current - amount * (1f - DamageReduction));
            _flashTimer = 0.1f;
            Changed?.Invoke();
            if (IsDead) Died?.Invoke();
        }

        // Faz o sprite voltar à cor normal depois da piscada.
        private void Update()
        {
            if (_bodyRenderer == null) return;
            _flashTimer -= Time.deltaTime;
            _bodyRenderer.color = _flashTimer > 0f ? _hitColor : _baseColor;
        }
    }
}
```

> O campo `_truck` ainda não é usado: ele entra na conta da blindagem na Fase 4. A Unity mostra um aviso amarelo de "campo não usado", que pode ser ignorado até lá.

### 2.4 O caminhão: `TruckController`

```csharp
// Caminho: Assets/_Project/Scripts/Truck/TruckController.cs
using System.Collections.Generic;
using FuryHauler.Data;
using FuryHauler.World;
using UnityEngine;

namespace FuryHauler.Truck
{
    // POR QUE: o caminhão anda sozinho e o jogador nunca o controla (Parte 1 §3).
    // Ele é o centro de tudo: inimigos o perseguem, defesas montam nele e a
    // câmera o segue.
    // ESTRATÉGIA: velocidade constante no eixo x do chão. O multiplicador de
    // velocidade existe para o nitro (Fase 6). Os slots são encontrados
    // automaticamente entre os filhos, então basta arrastar slots para dentro
    // do caminhão na Hierarchy.
    [RequireComponent(typeof(GroundBody), typeof(TruckHealth))]
    public class TruckController : MonoBehaviour
    {
        private readonly List<TruckSlot> _slots = new();

        public GroundBody Body { get; private set; }
        public TruckHealth Health { get; private set; }
        public IReadOnlyList<TruckSlot> Slots => _slots;
        public bool IsDriving { get; set; }
        public float SpeedMultiplier { get; set; } = 1f;
        public float Speed => GameConfig.I.truckSpeed * SpeedMultiplier;
        public Vector2 Ground => Body.Ground;
        public float Distance => Body.Ground.x;

        private void Awake()
        {
            Body = GetComponent<GroundBody>();
            Health = GetComponent<TruckHealth>();
            GetComponentsInChildren(_slots);
            foreach (TruckSlot slot in _slots) slot.Bind(this);
        }

        // Anda para frente enquanto o trecho estiver rolando.
        private void Update()
        {
            if (!IsDriving) return;
            Body.Ground += new Vector2(Speed * Time.deltaTime, 0f);
        }

        // Volta para o começo da estrada (início de cada trecho).
        public void ResetForTrip()
        {
            Body.Ground = Vector2.zero;
            SpeedMultiplier = 1f;
            Body.Apply();
        }
    }
}
```

### 2.5 O trecho: `TripManager`

```csharp
// Caminho: Assets/_Project/Scripts/Trip/TripManager.cs
using System;
using FuryHauler.Data;
using FuryHauler.Truck;
using UnityEngine;

namespace FuryHauler.Trip
{
    // Tudo que muda de um trecho para outro (vem do nó do mapa de rota, Fase 7).
    // [Serializable] faz a struct aparecer no Inspector.
    [Serializable]
    public struct TripSettings
    {
        public string label;
        public int difficulty;          // mais alto = mais inimigos por segundo
        public bool hasBoss;
        public float scrapMultiplier;   // trechos de mais risco pagam mais
    }

    // POR QUE: alguém precisa dizer "o trecho começou" e "o trecho acabou, com
    // sucesso ou não". Spawner, sucata, habilidades e a run escutam isso.
    // ESTRATÉGIA: o trecho termina com sucesso quando o caminhão passa do
    // comprimento do trecho e nada está "segurando" a chegada. O chefe (Fase 3)
    // segura a chegada enquanto está vivo, através de um contador genérico de
    // bloqueios, para o TripManager não precisar conhecer o chefe. O campo
    // _startOnPlay permite testar as Fases 2 a 6 sem a run da Fase 7.
    public class TripManager : MonoBehaviour
    {
        public static TripManager Current { get; private set; }

        [SerializeField] private TruckController _truck;
        [SerializeField] private bool _startOnPlay = true; // desligar na Fase 7
        [SerializeField] private TripSettings _testSettings = new TripSettings
        {
            label = "Trecho de teste",
            difficulty = 2,
            hasBoss = false,
            scrapMultiplier = 1f,
        };

        private int _arrivalBlockers;

        public TruckController Truck => _truck;
        public TripSettings Settings { get; private set; }
        public bool IsRunning { get; private set; }
        public float Length => GameConfig.I.tripLength;
        public float Progress01 => Mathf.Clamp01(_truck.Distance / Length);

        public event Action<TripSettings> Started;
        public event Action<bool> Ended; // true = chegou ao fim do trecho

        private void Awake()
        {
            Current = this;
        }

        private void Start()
        {
            _truck.Health.Died += OnTruckDied;
            if (_startOnPlay) StartTrip(_testSettings);
        }

        // Começa um trecho: caminhão no início, andando, e todo mundo avisado.
        public void StartTrip(TripSettings settings)
        {
            Settings = settings;
            _arrivalBlockers = 0;
            _truck.ResetForTrip();
            _truck.IsDriving = true;
            IsRunning = true;
            Started?.Invoke(settings);
        }

        // Algo (o chefe) impede o trecho de terminar enquanto existir.
        public void AddArrivalBlocker() => _arrivalBlockers++;
        public void RemoveArrivalBlocker() => _arrivalBlockers = Mathf.Max(0, _arrivalBlockers - 1);

        // Checa a chegada todo frame.
        private void Update()
        {
            if (!IsRunning) return;
            if (_truck.Distance >= Length && _arrivalBlockers == 0) End(true);
        }

        private void OnTruckDied()
        {
            if (IsRunning) End(false);
        }

        // Para o caminhão e avisa o resultado.
        private void End(bool success)
        {
            IsRunning = false;
            _truck.IsDriving = false;
            Debug.Log(success ? "Trecho concluído." : "Caminhão destruído.");
            Ended?.Invoke(success);
        }
    }
}
```

### 2.6 Montar na cena

1. **GameConfig:** em `Assets/_Project/Resources/`, **Create → Fury Hauler → Game Config**, com o nome exato `GameConfig`.
2. **Caminhão:** no objeto `Truck` da Fase 1, remova o **GroundDriverTest** (pode apagar o script) e adicione **TruckController** (o `TruckHealth` entra junto). Em **TruckHealth**, `Body Renderer` = o sprite `Body`.
3. **Slots:** crie 6 filhos vazios do `Truck`, cada um com **TruckSlot** e um filho sprite `Circle` (escala `0.3`, **Order in Layer = 5**) ligado em `Marker`. Valores placeholder (Parte 1 §3):

| Nome | Label | Offset | Facing | Arc |
|---|---|---|---|---|
| `Slot_Teto` | Teto | (0.5, 0) | 0 | 360 |
| `Slot_EsqFrente` | Esquerda frente | (1.5, 1.2) | 90 | 180 |
| `Slot_EsqTras` | Esquerda trás | (-1.5, 1.2) | 90 | 180 |
| `Slot_DirFrente` | Direita frente | (1.5, -1.2) | -90 | 180 |
| `Slot_DirTras` | Direita trás | (-1.5, -1.2) | -90 | 180 |
| `Slot_Traseira` | Traseira | (-3, 0) | 180 | 180 |

4. **Trecho:** GameObject vazio `Trip` com **TripManager**, `Truck` = `Truck`, `Start On Play` ligado.
5. Para testar rápido, diminua `Trip Length` no `GameConfig` para `100` durante o teste (e volte para `900` depois).

### ✅ Checkpoint da Fase 2
- No Play, o caminhão anda sozinho, e os 6 marcadores dos slots vão junto, em volta dele.
- Com `Trip Length = 100`, depois de ~10 s o caminhão para e o Console mostra "Trecho concluído."
- O Console não mostra erros (a vida e os slots só serão testados de verdade quando houver inimigos, na Fase 3).

#### Problemas comuns
- **`GameConfig não encontrado`:** o asset precisa estar numa pasta chamada exatamente `Resources` e se chamar exatamente `GameConfig`.
- **Os marcadores ficam parados no começo da estrada:** o `TruckSlot` precisa ser **filho** do `Truck`; o caminhão só encontra os slots que estão dentro dele.

Próxima fase: **Inimigos**, com motoqueiros, carros-bomba, buggies, saqueadores, o chefe e o spawn por orçamento.

---

# Parte 6 — Implementação Unity: Fase 3 (Inimigos)

## Fase 3 — Inimigos

> Objetivo desta fase: gangues aparecendo atrás do caminhão, perseguindo e atacando, cada tipo com seu comportamento, e o chefe segurando a chegada a B.

### 3.1 Dados de um inimigo: `EnemyDef`

```csharp
// Caminho: Assets/_Project/Scripts/Data/EnemyDef.cs
using FuryHauler.Enemies;
using UnityEngine;

namespace FuryHauler.Data
{
    // POR QUE: os números de cada inimigo são placeholders (Parte 1 §15).
    // Separar dados (este asset) de comportamento (a classe do inimigo) deixa
    // balancear sem abrir código e criar variações (ex.: "motoqueiro blindado")
    // só duplicando o asset.
    // ESTRATÉGIA: um campo genérico "spawnDef" serve tanto para o buggy (que
    // solta saqueadores) quanto para o chefe (que chama motoqueiros).
    [CreateAssetMenu(menuName = "Fury Hauler/Enemy", fileName = "Enemy")]
    public class EnemyDef : ScriptableObject
    {
        public string displayName = "Motoqueiro";
        public Enemy prefab;

        [Header("Status")]
        public float maxHp = 30f;
        public float speed = 16f;          // m/s; precisa ser maior que a do caminhão para alcançá-lo
        public float damage = 4f;          // por ataque (ou por segundo, no saqueador)
        public float fireInterval = 1f;    // segundos entre ataques
        public float contactRadius = 1.8f; // carro-bomba: distância em que explode
        public bool isVehicle = true;      // o arpão e o óleo só afetam veículos
        public bool stunnable = true;

        [Header("Reforços (buggy e chefe)")]
        public EnemyDef spawnDef;
        public int spawnCount = 2;
        public float spawnInterval = 2f;

        [Header("Recompensa e spawn")]
        public int scrapReward = 8;
        public int spawnCost = 1;          // pontos do orçamento de spawn
        public int minDifficulty;          // só aparece em trechos com dificuldade >= isto
    }
}
```

### 3.2 A base de todo inimigo: `Enemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/Enemy.cs
using System;
using System.Collections.Generic;
using FuryHauler.Data;
using FuryHauler.Truck;
using FuryHauler.World;
using UnityEngine;

namespace FuryHauler.Enemies
{
    // POR QUE: todos os inimigos têm vida, levam dano, podem ser atordoados,
    // dão sucata ao morrer e somem se ficarem para trás. Só o jeito de se mover
    // e atacar muda de um para outro.
    // ESTRATÉGIA: classe "abstract" com o comum; cada tipo herda dela e
    // implementa só o Tick (o comportamento). Uma lista estática All guarda os
    // inimigos vivos, para as defesas procurarem alvos sem usar física. Quem
    // morre avisa pelo evento estático Killed (a sucata da Fase 5 escuta).
    [RequireComponent(typeof(GroundBody))]
    public abstract class Enemy : MonoBehaviour
    {
        public static readonly List<Enemy> All = new();
        public static event Action<Enemy> Killed;

        [SerializeField] private SpriteRenderer _renderer;
        [SerializeField] private Color _hitColor = Color.white;

        private float _stunTimer;
        private float _flashTimer;
        private bool _removed;
        private Color _baseColor;

        public EnemyDef Def { get; private set; }
        public float Hp { get; private set; }
        public bool IsAlive => !_removed && Hp > 0f;
        public Vector2 Ground => Body.Ground;
        protected GroundBody Body { get; private set; }
        protected TruckController Truck { get; private set; }

        protected virtual void Awake()
        {
            Body = GetComponent<GroundBody>();
            if (_renderer != null) _baseColor = _renderer.color;
        }

        // OnEnable/OnDisable rodam quando o objeto aparece e quando é destruído:
        // é o jeito seguro de manter a lista All sempre certa.
        private void OnEnable() => All.Add(this);
        private void OnDisable() => All.Remove(this);

        // Chamado pelo EnemySpawner logo depois de criar o inimigo.
        public virtual void Init(EnemyDef def, TruckController truck, Vector2 ground)
        {
            Def = def;
            Truck = truck;
            Hp = def.maxHp;
            Body.Ground = ground;
            Body.Apply();
        }

        private void Update()
        {
            if (Truck == null || !IsAlive) return;
            float dt = Time.deltaTime;

            _flashTimer -= dt;
            if (_renderer != null) _renderer.color = _flashTimer > 0f ? _hitColor : _baseColor;

            // Atordoado: fica parado no chão, então o caminhão se afasta dele.
            if (_stunTimer > 0f) _stunTimer -= dt;
            else Tick(dt);

            if (Body.Ground.x < Truck.Distance - GameConfig.I.enemyDespawnBehind) Remove(false);
        }

        // O comportamento de cada tipo de inimigo, rodado uma vez por frame.
        protected abstract void Tick(float dt);

        // Anda em linha reta até um ponto do chão e devolve a distância que falta.
        protected float MoveTowards(Vector2 target, float dt)
        {
            Body.Ground = Vector2.MoveTowards(Body.Ground, target, Def.speed * dt);
            return Vector2.Distance(Body.Ground, target);
        }

        public void TakeDamage(float amount)
        {
            if (!IsAlive) return;
            Hp -= amount;
            _flashTimer = 0.06f;
            if (Hp <= 0f) Remove(true);
        }

        // Atordoa (arpão, óleo). Só funciona em quem pode ser atordoado.
        public void Stun(float seconds)
        {
            if (Def.stunnable) _stunTimer = Mathf.Max(_stunTimer, seconds);
        }

        // Some sem dar sucata (fim do trecho, ficou para trás, explodiu sozinho).
        public void Despawn() => Remove(false);

        // Tira o inimigo do jogo. Só quem foi morto pelas defesas avisa Killed.
        protected void Remove(bool killedByPlayer)
        {
            if (_removed) return;
            _removed = true;
            if (killedByPlayer) Killed?.Invoke(this);
            OnRemoved();
            Destroy(gameObject);
        }

        // Gancho para os tipos que precisam limpar algo ao sair (saqueador, chefe).
        protected virtual void OnRemoved() { }

        // Procura o inimigo vivo mais perto de um slot, dentro do alcance e do
        // leque de tiro do slot.
        public static Enemy FindNearest(TruckSlot slot, float range, bool vehiclesOnly)
        {
            Enemy best = null;
            float bestSqr = range * range;
            Vector2 from = slot.Ground;

            foreach (Enemy enemy in All)
            {
                if (!enemy.IsAlive || (vehiclesOnly && !enemy.Def.isVehicle)) continue;
                float sqr = (enemy.Ground - from).sqrMagnitude;
                if (sqr > bestSqr || !slot.CanTarget(enemy.Ground)) continue;
                best = enemy;
                bestSqr = sqr;
            }
            return best;
        }
    }
}
```

> `Destroy` não apaga o objeto na hora: ele some no fim do frame. Por isso existe o `_removed`, que impede o mesmo inimigo de morrer duas vezes no mesmo frame (por exemplo, atingido por duas metralhadoras). Pelo mesmo motivo, as defesas podem percorrer `Enemy.All` com `foreach` e matar inimigos no meio do laço: a lista só muda no fim do frame.

### 3.3 Motoqueiro: `BikerEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/BikerEnemy.cs
using FuryHauler.Data;
using FuryHauler.Truck;
using UnityEngine;

namespace FuryHauler.Enemies
{
    // POR QUE: o inimigo básico (Parte 1 §7): emparelha com o caminhão pela
    // lateral e atira.
    // ESTRATÉGIA: escolhe um "posto" ao lado do caminhão (do lado em que
    // nasceu) e persegue esse posto. Como o posto anda junto com o caminhão e o
    // motoqueiro é mais rápido, ele chega e fica grudado. Só atira estando
    // perto do posto, então o nitro (Fase 6) o faz parar de atirar.
    public class BikerEnemy : Enemy
    {
        [SerializeField] private float _sideDistance = 4f;
        [SerializeField] private float _attackDistance = 1.5f;

        private Vector2 _post;
        private float _fireTimer;

        public override void Init(EnemyDef def, TruckController truck, Vector2 ground)
        {
            base.Init(def, truck, ground);
            float side = ground.y >= 0f ? 1f : -1f;
            _post = new Vector2(Random.Range(-3f, 3f), side * _sideDistance);
            _fireTimer = def.fireInterval;
        }

        protected override void Tick(float dt)
        {
            float remaining = MoveTowards(Truck.Ground + _post, dt);
            if (remaining > _attackDistance) return;

            _fireTimer -= dt;
            if (_fireTimer > 0f) return;
            _fireTimer = Def.fireInterval;
            Truck.Health.TakeDamage(Def.damage);
        }
    }
}
```

### 3.4 Carro-bomba: `RammerEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/RammerEnemy.cs
namespace FuryHauler.Enemies
{
    // POR QUE: cria urgência (Parte 1 §7): se não for destruído a tempo, bate
    // e tira muita vida de uma vez.
    // ESTRATÉGIA: vai direto no centro do caminhão. Ao chegar perto o
    // suficiente, causa o dano e some sem dar sucata (explodiu sozinho).
    public class RammerEnemy : Enemy
    {
        protected override void Tick(float dt)
        {
            float remaining = MoveTowards(Truck.Ground, dt);
            if (remaining > Def.contactRadius) return;

            Truck.Health.TakeDamage(Def.damage);
            Remove(false);
        }
    }
}
```

### 3.5 Buggy de abordagem: `BoarderEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/BoarderEnemy.cs
using FuryHauler.Data;
using FuryHauler.Trip;
using FuryHauler.Truck;
using UnityEngine;

namespace FuryHauler.Enemies
{
    // POR QUE: encosta e solta saqueadores que sobem no caminhão (Parte 1 §7).
    // ESTRATÉGIA: encosta bem perto da lateral; parado ali, solta um saqueador
    // a cada spawnInterval num slot sorteado. Quando acaba a "tripulação", ele
    // desacelera e fica para trás até sumir.
    public class BoarderEnemy : Enemy
    {
        [SerializeField] private float _sideDistance = 2.2f;

        private Vector2 _post;
        private float _timer;
        private int _left;

        public override void Init(EnemyDef def, TruckController truck, Vector2 ground)
        {
            base.Init(def, truck, ground);
            float side = ground.y >= 0f ? 1f : -1f;
            _post = new Vector2(Random.Range(-1.5f, 1.5f), side * _sideDistance);
            _timer = def.spawnInterval;
            _left = def.spawnCount;
        }

        protected override void Tick(float dt)
        {
            if (_left <= 0)
            {
                // Vai embora: anda na metade da velocidade do caminhão.
                Body.Ground += new Vector2(Truck.Speed * 0.5f * dt, 0f);
                return;
            }

            if (MoveTowards(Truck.Ground + _post, dt) > 1f) return;

            _timer -= dt;
            if (_timer > 0f) return;
            _timer = Def.spawnInterval;
            _left--;
            DeployRaider();
        }

        // Cria um saqueador já em cima de um slot sorteado.
        private void DeployRaider()
        {
            if (Def.spawnDef == null || Truck.Slots.Count == 0) return;
            TruckSlot slot = Truck.Slots[Random.Range(0, Truck.Slots.Count)];
            if (EnemySpawner.Current.Spawn(Def.spawnDef, slot.Ground) is RaiderEnemy raider)
                raider.Board(slot);
        }
    }
}
```

### 3.6 Saqueador: `RaiderEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/RaiderEnemy.cs
using FuryHauler.Truck;

namespace FuryHauler.Enemies
{
    // POR QUE: o comportamento do saqueador está Em aberto (Parte 1 §7). O
    // placeholder: ele sabota a defesa do slot onde subiu e machuca o caminhão
    // aos poucos até ser morto.
    // ESTRATÉGIA: fica "colado" na posição do slot todo frame. Avisa o slot ao
    // subir e ao sair (morto ou fim do trecho), para a sabotagem nunca ficar
    // presa. O dano é por segundo (Def.damage × dt).
    public class RaiderEnemy : Enemy
    {
        private TruckSlot _slot;

        // Sobe no slot. Chamado pelo buggy logo depois de criar o saqueador.
        public void Board(TruckSlot slot)
        {
            _slot = slot;
            _slot.AddSaboteur();
        }

        protected override void Tick(float dt)
        {
            if (_slot == null) return;
            Body.Ground = _slot.Ground;
            Truck.Health.TakeDamage(Def.damage * dt);
        }

        protected override void OnRemoved()
        {
            if (_slot != null) _slot.RemoveSaboteur();
            _slot = null;
        }
    }
}
```

### 3.7 Chefe: `BossEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/BossEnemy.cs
using FuryHauler.Data;
using FuryHauler.Trip;
using FuryHauler.Truck;
using UnityEngine;

namespace FuryHauler.Enemies
{
    // POR QUE: o último trecho tem um chefe (Parte 1 §7). Placeholder: ele
    // emparelha e atira como um motoqueiro muito resistente e chama reforços.
    // ESTRATÉGIA: herda do BikerEnemy (reaproveita "emparelhar e atirar") e
    // soma um timer de reforços. Enquanto existir, segura a chegada a B pelo
    // contador do TripManager, se a regra bossBlocksArrival estiver ligada.
    public class BossEnemy : BikerEnemy
    {
        private float _spawnTimer;
        private bool _blocking;

        public override void Init(EnemyDef def, TruckController truck, Vector2 ground)
        {
            base.Init(def, truck, ground);
            _spawnTimer = def.spawnInterval;
            if (GameConfig.I.bossBlocksArrival)
            {
                TripManager.Current.AddArrivalBlocker();
                _blocking = true;
            }
        }

        protected override void Tick(float dt)
        {
            base.Tick(dt);
            if (Def.spawnDef == null) return;

            _spawnTimer -= dt;
            if (_spawnTimer > 0f) return;
            _spawnTimer = Def.spawnInterval;
            EnemySpawner.Current.SpawnBehind(Def.spawnDef);
        }

        protected override void OnRemoved()
        {
            if (_blocking) TripManager.Current.RemoveArrivalBlocker();
            _blocking = false;
        }
    }
}
```

### 3.8 Quem cria os inimigos: `EnemySpawner`

```csharp
// Caminho: Assets/_Project/Scripts/Trip/EnemySpawner.cs
using System.Collections.Generic;
using FuryHauler.Data;
using FuryHauler.Enemies;
using UnityEngine;

namespace FuryHauler.Trip
{
    // POR QUE: a pressão de inimigos precisa crescer com a dificuldade do
    // trecho (Parte 1 §8) sem ninguém escrever ondas à mão para cada trecho
    // gerado.
    // ESTRATÉGIA: "orçamento de spawn". A cada segundo entram alguns pontos
    // (mais em trechos difíceis). O spawner sorteia o próximo inimigo entre os
    // permitidos na dificuldade e espera juntar pontos suficientes para ele.
    // Sortear antes de juntar evita que só os baratos apareçam. O chefe nasce
    // uma vez, ao passar de certa porcentagem do trecho.
    public class EnemySpawner : MonoBehaviour
    {
        public static EnemySpawner Current { get; private set; }

        [SerializeField] private TripManager _trip;
        [SerializeField] private List<EnemyDef> _pool = new(); // inimigos comuns
        [SerializeField] private EnemyDef _boss;

        private readonly List<EnemyDef> _eligible = new();
        private float _budget;
        private EnemyDef _next;
        private bool _bossSpawned;
        private bool _active;

        private void Awake()
        {
            Current = this;
        }

        // Assina os eventos do trecho enquanto o spawner estiver ativo.
        private void OnEnable()
        {
            _trip.Started += OnTripStarted;
            _trip.Ended += OnTripEnded;
        }

        private void OnDisable()
        {
            _trip.Started -= OnTripStarted;
            _trip.Ended -= OnTripEnded;
        }

        private void OnTripStarted(TripSettings settings)
        {
            ClearAll();
            _budget = 0f;
            _next = null;
            _bossSpawned = false;
            _active = true;
        }

        private void OnTripEnded(bool success)
        {
            _active = false;
            ClearAll();
        }

        private void Update()
        {
            if (!_active) return;
            GameConfig cfg = GameConfig.I;
            TripSettings settings = _trip.Settings;

            if (settings.hasBoss && !_bossSpawned && _boss != null && _trip.Progress01 >= cfg.bossSpawnAtProgress)
            {
                _bossSpawned = true;
                SpawnBehind(_boss);
            }

            _budget += (cfg.spawnBudgetBase + cfg.spawnBudgetPerDifficulty * settings.difficulty) * Time.deltaTime;

            if (_next == null) _next = PickNext(settings.difficulty);
            if (_next != null && _budget >= _next.spawnCost)
            {
                _budget -= _next.spawnCost;
                SpawnBehind(_next);
                _next = null;
            }
        }

        // Sorteia um inimigo comum permitido nesta dificuldade.
        private EnemyDef PickNext(int difficulty)
        {
            _eligible.Clear();
            foreach (EnemyDef def in _pool)
                if (def.minDifficulty <= difficulty) _eligible.Add(def);
            return _eligible.Count == 0 ? null : _eligible[Random.Range(0, _eligible.Count)];
        }

        // Cria um inimigo atrás do caminhão, num lado sorteado da estrada.
        public Enemy SpawnBehind(EnemyDef def)
        {
            GameConfig cfg = GameConfig.I;
            float side = Random.value < 0.5f ? -1f : 1f;
            Vector2 offset = new Vector2(
                -Random.Range(cfg.spawnBehindMin, cfg.spawnBehindMax),
                side * Random.Range(0.5f, cfg.roadHalfWidth));
            return Spawn(def, _trip.Truck.Ground + offset);
        }

        // Cria um inimigo num ponto exato do chão.
        public Enemy Spawn(EnemyDef def, Vector2 ground)
        {
            Enemy enemy = Instantiate(def.prefab, transform);
            enemy.Init(def, _trip.Truck, ground);
            return enemy;
        }

        // Tira todos os inimigos do jogo, sem dar sucata.
        public void ClearAll()
        {
            for (int i = Enemy.All.Count - 1; i >= 0; i--) Enemy.All[i].Despawn();
        }
    }
}
```

### 3.9 Criar prefabs e assets

1. **Prefabs** (em `Prefabs/Enemies/`), cada um: GameObject vazio + **GroundBody** (no `SortingGroup`, **Sorting Layer = Mundo**) + o script do tipo + um filho sprite `Circle` ligado no campo `Renderer` do script.

| Prefab | Script | Sprite (escala, cor) | GroundBody |
|---|---|---|---|
| `Biker` | BikerEnemy | 0.5, amarelo | — |
| `Rammer` | RammerEnemy | 0.8, laranja | — |
| `Boarder` | BoarderEnemy | 1.0, roxo | — |
| `Raider` | RaiderEnemy | 0.35, vermelho | Height 0.6, Sort Bias 50 |
| `Boss` | BossEnemy | 2.0, preto | — |

2. **Assets** (em `ScriptableObjects/Enemies/`, **Create → Fury Hauler → Enemy**), com os números da Parte 1 §15 (campos não listados ficam no padrão):

| Asset | Prefab | HP | Speed | Damage | Fire Int. | Contact | Vehicle | Stunnable | Spawn Def / Count / Interval | Scrap | Cost | Min Diff. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `Biker` | Biker | 30 | 16 | 4 | 1 | — | sim | sim | — | 8 | 1 | 0 |
| `Rammer` | Rammer | 50 | 18 | 60 | — | 1.8 | sim | sim | — | 12 | 2 | 1 |
| `Boarder` | Boarder | 80 | 14 | — | — | — | sim | sim | Raider / 2 / 2 | 15 | 3 | 2 |
| `Raider` | Raider | 20 | — | 6 | — | — | **não** | **não** | — | 3 | — | — |
| `Boss` | Boss | 1500 | 12 | 15 | 1.5 | — | sim | **não** | Biker / — / 6 | 150 | — | — |

3. **Spawner:** GameObject `Enemies` com **EnemySpawner**: `Trip` = `Trip`, `Pool` = Biker, Rammer, Boarder, `Boss` = Boss.

### ✅ Checkpoint da Fase 3
- No Play (dificuldade de teste 2), motoqueiros aparecem atrás, emparelham dos lados e o caminhão pisca vermelho a cada tiro.
- Carros-bomba vêm direto, somem ao encostar e o caminhão pisca.
- Buggies encostam e soltam pontos vermelhos em cima dos slots; o marcador do slot fica vermelho (sabotado).
- Com `Has Boss` ligado nas `Test Settings` do `TripManager`, o chefe aparece em 30% do trecho e o caminhão **não** termina o trecho enquanto ele existir.
- Sem defesas, o caminhão acaba destruído, o Console mostra "Caminhão destruído." e todos os inimigos somem.

#### Problemas comuns
- **`NullReferenceException` no `EnemySpawner.OnEnable`:** o campo `Trip` do spawner está vazio.
- **Os inimigos nunca alcançam o caminhão:** a `Speed` do asset precisa ser maior que a `truckSpeed` do `GameConfig` (10).
- **Inimigos aparecem por cima do caminhão quando deveriam estar atrás (ou o contrário):** o `SortingGroup` do prefab está numa Sorting Layer diferente da do caminhão. Caminhão e inimigos ficam ambos em `Mundo`.

Próxima fase: **Defesas**, com as 4 defesas montadas nos slots e mirando sozinhas.

---

# Parte 7 — Implementação Unity: Fase 4 (Defesas)

## Fase 4 — Defesas

> Objetivo desta fase: metralhadora, lança-chamas, arpão e blindagem montadas nos slots, cada uma atacando sozinha do seu jeito.

### 4.1 Dados de uma defesa: `DefenseDef`

```csharp
// Caminho: Assets/_Project/Scripts/Data/DefenseDef.cs
using FuryHauler.Defenses;
using UnityEngine;

namespace FuryHauler.Data
{
    // POR QUE: preços e números das defesas são placeholders (Parte 1 §15).
    // ESTRATÉGIA: um asset por defesa, com todos os campos que qualquer defesa
    // pode precisar; cada tipo usa só os seus (ex.: só o arpão usa stunSeconds).
    [CreateAssetMenu(menuName = "Fury Hauler/Defense", fileName = "Defense")]
    public class DefenseDef : ScriptableObject
    {
        public string displayName = "Metralhadora";
        public Sprite icon;
        public Defense prefab;

        [Header("Economia")]
        public int cost = 40;
        public int upgradeCostPerLevel = 40; // custo para subir = isto × nível atual
        public int maxLevel = 3;

        [Header("Combate")]
        public float range = 9f;             // metros
        public float damage = 6f;            // por tiro, ou por segundo (lança-chamas, espinhos)
        public float fireInterval = 0.15f;
        public float bonusPerLevel = 0.35f;  // +35% por nível acima do 1
        public float stunSeconds;            // arpão
        [Range(0f, 1f)] public float damageReduction; // blindagem

        [Header("Desbloqueio (placeholder, Parte 1 §9)")]
        public int unlockAtBestTrips;        // trechos concluídos na melhor run para liberar
    }
}
```

### 4.2 A base de toda defesa: `Defense`

```csharp
// Caminho: Assets/_Project/Scripts/Defenses/Defense.cs
using FuryHauler.Data;
using FuryHauler.Trip;
using FuryHauler.Truck;
using UnityEngine;

namespace FuryHauler.Defenses
{
    // POR QUE: toda defesa fica num slot, tem nível, sabe quanto já custou
    // (para a venda, Fase 5) e para de funcionar se um saqueador sabotar o slot.
    // ESTRATÉGIA: classe abstract com o comum; cada tipo implementa só o Tick.
    // Um LineRenderer opcional desenha o rastro do tiro por uma fração de
    // segundo, já que os acertos são instantâneos (sem projéteis voando).
    public abstract class Defense : MonoBehaviour
    {
        [SerializeField] private LineRenderer _line;

        private float _lineTimer;

        public DefenseDef Def { get; private set; }
        public TruckSlot Slot { get; private set; }
        public int Level { get; private set; } = 1;
        public int TotalSpent { get; private set; }
        public bool CanUpgrade => Level < Def.maxLevel;
        public int UpgradeCost => Def.upgradeCostPerLevel * Level;

        // Multiplicador dos números pelo nível: 1.0 no nível 1, 1.35 no 2, 1.7 no 3.
        protected float LevelMultiplier => 1f + Def.bonusPerLevel * (Level - 1);
        protected float Damage => Def.damage * LevelMultiplier;

        // Chamado pelo slot logo depois de criar a defesa.
        public void Install(DefenseDef def, TruckSlot slot)
        {
            Def = def;
            Slot = slot;
            Level = 1;
            TotalSpent = def.cost;
            if (_line != null) _line.enabled = false;
        }

        // Sobe um nível. Quem chama (a alocação) já cobrou o UpgradeCost.
        public void Upgrade()
        {
            if (!CanUpgrade) return;
            TotalSpent += UpgradeCost;
            Level++;
        }

        private void Update()
        {
            UpdateLine(Time.deltaTime);
            if (Slot == null) return;

            bool running = TripManager.Current != null && TripManager.Current.IsRunning;
            if (Slot.Sabotaged || !running)
            {
                OnIdle();
                return;
            }
            Tick(Time.deltaTime);
        }

        // O comportamento da defesa, rodado uma vez por frame.
        protected abstract void Tick(float dt);

        // Chamado nos frames em que a defesa não pode agir (sabotada, trecho parado).
        protected virtual void OnIdle() { }

        // Mostra um rastro da defesa até um ponto da tela por alguns segundos.
        protected void ShowLine(Vector3 to, float seconds)
        {
            if (_line == null) return;
            _line.positionCount = 2;
            _line.SetPosition(0, transform.position);
            _line.SetPosition(1, to);
            _line.enabled = true;
            _lineTimer = seconds;
        }

        // Apaga o rastro quando o tempo dele acaba.
        private void UpdateLine(float dt)
        {
            if (_line == null || !_line.enabled) return;
            _lineTimer -= dt;
            if (_lineTimer <= 0f) _line.enabled = false;
        }
    }
}
```

### 4.3 Metralhadora: `MachineGunDefense`

```csharp
// Caminho: Assets/_Project/Scripts/Defenses/MachineGunDefense.cs
using FuryHauler.Enemies;

namespace FuryHauler.Defenses
{
    // POR QUE: a defesa padrão (Parte 1 §4): tiro rápido, um alvo por vez.
    // ESTRATÉGIA: a cada fireInterval, acerta o inimigo mais próximo dentro do
    // alcance e do leque do slot. Saqueadores contam como alvo.
    public class MachineGunDefense : Defense
    {
        private float _cooldown;

        protected override void Tick(float dt)
        {
            _cooldown -= dt;
            if (_cooldown > 0f) return;

            Enemy target = Enemy.FindNearest(Slot, Def.range, vehiclesOnly: false);
            if (target == null) return;

            _cooldown = Def.fireInterval;
            target.TakeDamage(Damage);
            ShowLine(target.transform.position, 0.05f);
        }
    }
}
```

### 4.4 Lança-chamas: `FlamethrowerDefense`

```csharp
// Caminho: Assets/_Project/Scripts/Defenses/FlamethrowerDefense.cs
using FuryHauler.Enemies;
using FuryHauler.World;
using UnityEngine;

namespace FuryHauler.Defenses
{
    // POR QUE: dano em área de curto alcance (Parte 1 §4), bom contra buggies
    // encostados e saqueadores.
    // ESTRATÉGIA: mira no inimigo mais próximo e queima todos que estiverem
    // num cone apontado para ele, com dano por segundo (Damage × dt). O efeito
    // visual é um ParticleSystem girado para a direção do cone na tela.
    public class FlamethrowerDefense : Defense
    {
        [SerializeField] private ParticleSystem _flame;
        [SerializeField] private float _coneDegrees = 60f;

        protected override void Tick(float dt)
        {
            Enemy target = Enemy.FindNearest(Slot, Def.range, vehiclesOnly: false);
            if (target == null)
            {
                SetFlame(false, Vector2.zero);
                return;
            }

            Vector2 aim = target.Ground - Slot.Ground;
            if (aim.sqrMagnitude < 0.01f) aim = IsoProjection.Dir(Slot.FacingDegrees);
            aim.Normalize();

            float rangeSqr = Def.range * Def.range;
            foreach (Enemy enemy in Enemy.All)
            {
                if (!enemy.IsAlive) continue;
                Vector2 toEnemy = enemy.Ground - Slot.Ground;
                if (toEnemy.sqrMagnitude > rangeSqr) continue;
                if (toEnemy.sqrMagnitude > 0.01f && Vector2.Angle(aim, toEnemy) > _coneDegrees * 0.5f) continue;
                enemy.TakeDamage(Damage * dt);
            }

            SetFlame(true, aim);
        }

        protected override void OnIdle() => SetFlame(false, Vector2.zero);

        // Liga/desliga as partículas e gira para a direção do cone na tela.
        private void SetFlame(bool on, Vector2 groundAim)
        {
            if (_flame == null) return;
            if (!on)
            {
                if (_flame.isPlaying) _flame.Stop();
                return;
            }

            Vector3 screenAim = IsoProjection.ToScreen(groundAim);
            float angle = Mathf.Atan2(screenAim.y, screenAim.x) * Mathf.Rad2Deg;
            _flame.transform.rotation = Quaternion.Euler(0f, 0f, angle);
            if (!_flame.isPlaying) _flame.Play();
        }
    }
}
```

### 4.5 Arpão: `HarpoonDefense`

```csharp
// Caminho: Assets/_Project/Scripts/Defenses/HarpoonDefense.cs
using FuryHauler.Enemies;

namespace FuryHauler.Defenses
{
    // POR QUE: "derruba" um veículo (Parte 1 §4): ele para de acompanhar e
    // fica para trás. O efeito exato de "puxar" ainda está Em aberto.
    // ESTRATÉGIA: tiro lento e forte, só em veículos, que causa dano e
    // atordoa. Como o inimigo atordoado fica parado no chão e o caminhão
    // segue, ele cai para trás sozinho e pode até sair do jogo.
    public class HarpoonDefense : Defense
    {
        private float _cooldown;

        protected override void Tick(float dt)
        {
            _cooldown -= dt;
            if (_cooldown > 0f) return;

            Enemy target = Enemy.FindNearest(Slot, Def.range, vehiclesOnly: true);
            if (target == null) return;

            _cooldown = Def.fireInterval;
            target.TakeDamage(Damage);
            target.Stun(Def.stunSeconds * LevelMultiplier);
            ShowLine(target.transform.position, 0.2f);
        }
    }
}
```

### 4.6 Blindagem com espinhos: `ArmorDefense`

```csharp
// Caminho: Assets/_Project/Scripts/Defenses/ArmorDefense.cs
using FuryHauler.Enemies;

namespace FuryHauler.Defenses
{
    // POR QUE: defesa passiva (Parte 1 §4): reduz o dano do caminhão e fere
    // quem chega perto do slot, inclusive saqueadores a bordo.
    // ESTRATÉGIA: a redução não é aplicada aqui: o TruckHealth soma a
    // Reduction de todas as blindagens na hora de calcular o dano (assim não
    // há "registro" para esquecer de desfazer na venda). Os espinhos causam
    // dano por segundo a todos dentro do alcance (curto) do slot.
    public class ArmorDefense : Defense
    {
        public float Reduction => Def.damageReduction * LevelMultiplier;

        protected override void Tick(float dt)
        {
            float rangeSqr = Def.range * Def.range;
            foreach (Enemy enemy in Enemy.All)
            {
                if (!enemy.IsAlive) continue;
                if ((enemy.Ground - Slot.Ground).sqrMagnitude <= rangeSqr)
                    enemy.TakeDamage(Damage * dt);
            }
        }
    }
}
```

### 4.7 `TruckSlot` (versão final)

Substitua o arquivo inteiro da Fase 2 por este. As novidades: guardar a defesa montada, montar/desmontar, uma defesa de teste e os destaques visuais que a alocação (Fase 5) vai usar.

```csharp
// Caminho: Assets/_Project/Scripts/Truck/TruckSlot.cs
using FuryHauler.Data;
using FuryHauler.Defenses;
using FuryHauler.World;
using UnityEngine;

namespace FuryHauler.Truck
{
    // POR QUE: a decisão central do jogador é "qual defesa em qual slot"
    // (Parte 1 §3). Cada slot tem uma posição no caminhão, um ângulo de tiro
    // e no máximo uma defesa montada.
    // ESTRATÉGIA: o slot guarda um deslocamento no chão em relação ao centro do
    // caminhão, então sua posição real é sempre "caminhão + deslocamento". O
    // ângulo de tiro é um leque: direção central + abertura (360 = qualquer
    // lado). O marcador colorido mostra o estado: vazio, destacado para compra,
    // selecionado ou sabotado. DefaultExecutionOrder(50) faz o slot se
    // posicionar depois do GroundBody do caminhão.
    [DefaultExecutionOrder(50)]
    public class TruckSlot : MonoBehaviour
    {
        [SerializeField] private string _label = "Teto";
        [SerializeField] private Vector2 _offset;                 // metros a partir do centro do caminhão
        [SerializeField] private float _height = 0.6f;           // altura na tela (em cima do caminhão)
        [SerializeField] private float _facingDegrees;           // 0 frente, 90 esquerda, -90 direita, 180 trás
        [SerializeField, Range(10f, 360f)] private float _arcDegrees = 360f;
        [SerializeField] private SpriteRenderer _marker;
        [SerializeField] private Color _idleColor = new Color(1f, 1f, 1f, 0.35f);
        [SerializeField] private Color _highlightColor = new Color(0.3f, 1f, 0.3f, 0.9f);
        [SerializeField] private Color _selectedColor = Color.yellow;
        [SerializeField] private Color _sabotagedColor = Color.red;
        [SerializeField] private DefenseDef _testDefense;        // só para teste; deixe vazio na Fase 7

        private int _saboteurs;

        public TruckController Truck { get; private set; }
        public Defense Installed { get; private set; }
        public bool IsEmpty => Installed == null;
        public string Label => _label;
        public float FacingDegrees => _facingDegrees;
        public float ArcDegrees => _arcDegrees;
        public bool Sabotaged => _saboteurs > 0;
        public bool Highlighted { get; set; } // slot vazio onde dá para montar a defesa escolhida
        public bool Selected { get; set; }    // slot aberto no painel de defesa
        public Vector2 Ground => Truck.Body.Ground + _offset;

        // Chamado pelo caminhão no Awake dele: o slot passa a saber a quem pertence.
        public void Bind(TruckController truck)
        {
            Truck = truck;
        }

        private void Start()
        {
            if (_testDefense != null) Install(_testDefense);
        }

        // Diz se um ponto no chão está dentro do leque de tiro deste slot.
        public bool CanTarget(Vector2 point)
        {
            if (_arcDegrees >= 360f) return true;
            Vector2 toPoint = point - Ground;
            float angle = Vector2.SignedAngle(IsoProjection.Dir(_facingDegrees), toPoint);
            return Mathf.Abs(angle) <= _arcDegrees * 0.5f;
        }

        // Cria a defesa como filha do slot. Não cobra nada: quem cobra é a alocação.
        public Defense Install(DefenseDef def)
        {
            if (!IsEmpty || def == null || def.prefab == null) return null;
            Installed = Instantiate(def.prefab, transform);
            Installed.transform.localPosition = Vector3.zero;
            Installed.Install(def, this);
            return Installed;
        }

        // Desmonta e destrói a defesa do slot.
        public void Clear()
        {
            if (IsEmpty) return;
            Destroy(Installed.gameObject);
            Installed = null;
        }

        // Saqueadores (Fase 3) avisam quando sobem e quando saem do slot.
        public void AddSaboteur() => _saboteurs++;
        public void RemoveSaboteur() => _saboteurs = Mathf.Max(0, _saboteurs - 1);

        private void LateUpdate()
        {
            if (Truck == null) return;
            transform.position = IsoProjection.ToScreen(Ground, _height);
            UpdateMarker();
        }

        // Escolhe a cor do marcador, do estado mais importante para o menos.
        private void UpdateMarker()
        {
            if (_marker == null) return;

            if (Sabotaged) _marker.color = _sabotagedColor;
            else if (Selected) _marker.color = _selectedColor;
            else if (Highlighted) _marker.color = _highlightColor;
            else _marker.color = _idleColor;

            // Slot ocupado só mostra o marcador quando tem algo a dizer.
            _marker.enabled = IsEmpty || Selected || Sabotaged;
        }
    }
}
```

### 4.8 Blindagem no cálculo de dano

No `TruckHealth` da Fase 2, adicione `using FuryHauler.Defenses;` no topo e troque a linha da `DamageReduction` por:

```csharp
        // Quanto do dano é ignorado (0 a 1): soma das blindagens que não estão
        // sabotadas, com um teto (GameConfig.maxDamageReduction) para o
        // caminhão nunca ficar imortal.
        public float DamageReduction
        {
            get
            {
                float sum = 0f;
                foreach (TruckSlot slot in _truck.Slots)
                    if (slot.Installed is ArmorDefense armor && !slot.Sabotaged)
                        sum += armor.Reduction;
                return Mathf.Min(sum, GameConfig.I.maxDamageReduction);
            }
        }
```

### 4.9 Criar prefabs e assets

1. **Material das linhas e partículas:** no URP 2D, use o material `Sprite-Unlit-Default` (procure por esse nome no Project, com o filtro **In Packages**).
2. **Prefabs** (em `Prefabs/Defenses/`), cada um com um filho sprite `Square` (escala `0.35`, **Order in Layer = 10**) para aparecer em cima do caminhão:
   - `MachineGun`: **MachineGunDefense** + **LineRenderer** (Width `0.05`, cor amarela, **Use World Space** ligado, material acima, Sorting Layer `FX`) ligado em `Line`.
   - `Flamethrower`: **FlamethrowerDefense** + filho `Flame` com **Particle System**:
     - **Looping** ligado, **Play On Awake** desligado, Start Lifetime `0.3`, Start Speed `12`, Start Size `0.3`, cor laranja;
     - módulo **Shape** com Shape `Cone`, Angle `20` e Rotation `(0, 90, 0)`, para emitir para a direita (o "zero grau" do script);
     - módulo **Renderer** com o material acima e Sorting Layer `FX`.

     Ligue `Flame` no campo `Flame`.
   - `Harpoon`: **HarpoonDefense** + **LineRenderer** (Width `0.08`, cor cinza-metal), como na metralhadora.
   - `Armor`: **ArmorDefense**, sem linha.
3. **Assets** (em `ScriptableObjects/Defenses/`, **Create → Fury Hauler → Defense**), números da Parte 1 §15:

| Asset | Prefab | Cost / Upgrade | Range | Damage | Fire Int. | Stun | Reduction | Unlock At Best Trips |
|---|---|---|---|---|---|---|---|---|
| `MachineGun` | MachineGun | 40 / 40 | 9 | 6 | 0.15 | — | — | 0 |
| `Flamethrower` | Flamethrower | 60 / 60 | 4.5 | 35 | — | — | — | 1 |
| `Harpoon` | Harpoon | 70 / 70 | 12 | 40 | 3 | 2.5 | — | 3 |
| `Armor` | Armor | 50 / 50 | 2.5 | 15 | — | — | 0.1 | 0 |

4. **Teste:** nos slots do caminhão, preencha `Test Defense` (ex.: metralhadora no teto, lança-chamas nas laterais de trás, arpão na traseira, blindagem numa lateral da frente).

### ✅ Checkpoint da Fase 4
- No Play, a metralhadora desenha rastros amarelos curtos e motoqueiros caem.
- Uma metralhadora num slot lateral esquerdo **não** atira em quem está à direita (leque de 180°).
- O lança-chamas solta fogo na direção do inimigo próximo e queima vários de uma vez.
- O arpão acerta um veículo, que para e fica para trás.
- Um saqueador no slot da metralhadora faz ela parar de atirar até ser morto (por outra defesa ou pelos espinhos de uma blindagem vizinha).
- Com as 6 defesas de teste, o caminhão termina o trecho de dificuldade 2 com vida sobrando; sem nenhuma, ele é destruído.

#### Problemas comuns
- **Rastros ou fogo aparecem rosa:** o material não é compatível com o URP 2D. Troque para `Sprite-Unlit-Default`.
- **O fogo sai para o lado errado:** a rotação do módulo **Shape** não está em `(0, 90, 0)`, então o "zero grau" das partículas não é a direita.
- **A defesa não aparece em cima do caminhão:** o sprite dela está com **Order in Layer** menor que o do corpo do caminhão; dentro do mesmo `SortingGroup` vale a ordem.

Próxima fase: **Sucata e Alocação**, para o jogador comprar, melhorar e vender defesas com o mouse.

---

# Parte 8 — Implementação Unity: Fase 5 (Sucata e Alocação)

## Fase 5 — Sucata e Alocação

> Objetivo desta fase: inimigos mortos dão sucata, e o jogador usa o mouse para comprar defesas na barra de baixo e montá-las num slot, além de melhorar e vender as montadas. Com o HUD mostrando sucata, vida e progresso.

### 5.1 A carteira: `ScrapWallet`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/ScrapWallet.cs
using System;
using FuryHauler.Data;
using FuryHauler.Enemies;
using FuryHauler.Trip;
using UnityEngine;

namespace FuryHauler.Economy
{
    // POR QUE: a sucata é a única moeda da run (Parte 1 §5): entra quando um
    // inimigo morre e sai quando o jogador compra ou melhora.
    // ESTRATÉGIA: escuta o evento estático Enemy.Killed e soma a recompensa
    // do inimigo, multiplicada pelo bônus de risco do trecho. A coleta é
    // automática (placeholder: a Parte 1 §5 deixa Em aberto se o jogador
    // precisa clicar na sucata). Um evento Changed avisa a UI.
    public class ScrapWallet : MonoBehaviour
    {
        public static ScrapWallet Instance { get; private set; }

        public int Amount { get; private set; }
        public event Action<int> Changed;

        private void Awake()
        {
            Instance = this;
            Amount = GameConfig.I.startingScrap;
        }

        private void OnEnable() => Enemy.Killed += OnEnemyKilled;
        private void OnDisable() => Enemy.Killed -= OnEnemyKilled;

        private void OnEnemyKilled(Enemy enemy)
        {
            float multiplier = TripManager.Current != null ? TripManager.Current.Settings.scrapMultiplier : 1f;
            if (multiplier <= 0f) multiplier = 1f; // TripSettings sem multiplicador preenchido
            Add(Mathf.RoundToInt(enemy.Def.scrapReward * multiplier));
        }

        public void Add(int value)
        {
            if (value <= 0) return;
            Amount += value;
            Changed?.Invoke(Amount);
        }

        // Tenta gastar; devolve false (e não gasta nada) se não houver o bastante.
        public bool TrySpend(int value)
        {
            if (value > Amount) return false;
            Amount -= value;
            Changed?.Invoke(Amount);
            return true;
        }

        // Define o valor direto (começo de run, Fase 7).
        public void ResetTo(int value)
        {
            Amount = value;
            Changed?.Invoke(Amount);
        }
    }
}
```

### 5.2 Comprar, melhorar e vender: `AllocationController`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/AllocationController.cs
using System;
using FuryHauler.Data;
using FuryHauler.Defenses;
using FuryHauler.Truck;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

namespace FuryHauler.Economy
{
    // POR QUE: alocar defesas é tudo que o jogador faz com o mouse (Parte 1
    // §2): ele não dirige nem mira.
    // ESTRATÉGIA: "clique-clique". Clicar numa defesa da barra de compra a
    // deixa "pendente" e acende os slots vazios; clicar num slot vazio monta e
    // cobra. Clicar num slot ocupado o seleciona e abre o painel de melhorar e
    // vender. Clique fora, botão direito ou Esc cancelam. Os slots são achados
    // pela distância na tela até o marcador, sem colliders. Arrastar e soltar
    // fica para depois (Parte 1 §5 Em aberto).
    public class AllocationController : MonoBehaviour
    {
        [SerializeField] private Camera _camera;
        [SerializeField] private TruckController _truck;
        [SerializeField] private float _pickRadius = 0.6f; // unidades de tela em volta do slot

        public DefenseDef PendingBuy { get; private set; }
        public TruckSlot SelectedSlot { get; private set; }

        public event Action Changed;          // seleção mudou (barra e painel redesenham)
        public event Action<string> Message;  // aviso curto para o HUD

        // Chamado pelos botões da barra de compra. Clicar de novo na mesma cancela.
        public void SelectToBuy(DefenseDef def)
        {
            PendingBuy = PendingBuy == def ? null : def;
            SelectSlot(null);
            RefreshHighlights();
            Changed?.Invoke();
        }

        private void Update()
        {
            if (Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame) CancelAll();
            if (Mouse.current != null && Mouse.current.rightButton.wasPressedThisFrame) CancelAll();

            Pointer pointer = Pointer.current;
            if (pointer == null || !pointer.press.wasPressedThisFrame) return;

            // Clique em cima de um botão da UI não é clique no mundo.
            if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject()) return;

            Vector2 world = _camera.ScreenToWorldPoint(pointer.position.ReadValue());
            TruckSlot slot = FindSlot(world);

            if (slot == null) CancelAll();
            else if (PendingBuy != null && slot.IsEmpty) TryBuy(slot);
            else if (!slot.IsEmpty) SelectSlot(slot);
        }

        // Slot mais perto do clique, dentro do raio, ou null.
        private TruckSlot FindSlot(Vector2 world)
        {
            TruckSlot best = null;
            float bestSqr = _pickRadius * _pickRadius;
            foreach (TruckSlot slot in _truck.Slots)
            {
                float sqr = ((Vector2)slot.transform.position - world).sqrMagnitude;
                if (sqr >= bestSqr) continue;
                best = slot;
                bestSqr = sqr;
            }
            return best;
        }

        // Cobra e monta a defesa pendente num slot vazio.
        private void TryBuy(TruckSlot slot)
        {
            if (!ScrapWallet.Instance.TrySpend(PendingBuy.cost))
            {
                Message?.Invoke("Sucata insuficiente");
                return;
            }
            slot.Install(PendingBuy);
            PendingBuy = null;
            RefreshHighlights();
            Changed?.Invoke();
        }

        // Chamado pelo botão "Melhorar" do painel.
        public void UpgradeSelected()
        {
            Defense defense = SelectedSlot != null ? SelectedSlot.Installed : null;
            if (defense == null || !defense.CanUpgrade) return;
            if (!ScrapWallet.Instance.TrySpend(defense.UpgradeCost))
            {
                Message?.Invoke("Sucata insuficiente");
                return;
            }
            defense.Upgrade();
            Changed?.Invoke();
        }

        // Quanto a venda devolve (placeholder: 50% de tudo que foi gasto).
        public int SellValue(Defense defense)
        {
            return Mathf.RoundToInt(defense.TotalSpent * GameConfig.I.sellRefund);
        }

        // Chamado pelo botão "Vender" do painel. Vender e comprar outra é o "trocar" da Parte 1 §5.
        public void SellSelected()
        {
            Defense defense = SelectedSlot != null ? SelectedSlot.Installed : null;
            if (defense == null) return;
            ScrapWallet.Instance.Add(SellValue(defense));
            SelectedSlot.Clear();
            SelectSlot(null);
            Changed?.Invoke();
        }

        // Desfaz compra pendente e seleção.
        public void CancelAll()
        {
            PendingBuy = null;
            SelectSlot(null);
            RefreshHighlights();
            Changed?.Invoke();
        }

        private void SelectSlot(TruckSlot slot)
        {
            if (SelectedSlot != null) SelectedSlot.Selected = false;
            SelectedSlot = slot;
            if (SelectedSlot != null) SelectedSlot.Selected = true;
            Changed?.Invoke();
        }

        // Acende os slots vazios enquanto houver uma compra pendente.
        private void RefreshHighlights()
        {
            foreach (TruckSlot slot in _truck.Slots)
                slot.Highlighted = PendingBuy != null && slot.IsEmpty;
        }
    }
}
```

### 5.3 Um botão da barra de compra: `ShopButton`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ShopButton.cs
using System;
using FuryHauler.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FuryHauler.UI
{
    // POR QUE: cada defesa liberada vira um botão com nome e preço.
    // ESTRATÉGIA: o botão não sabe nada de compra; recebe uma ação para
    // chamar no clique (quem cria decide o que acontece). Fica desabilitado
    // quando falta sucata e mostra uma moldura quando está escolhido.
    public class ShopButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private Image _icon;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private Image _selectedFrame;

        public DefenseDef Def { get; private set; }

        public void Setup(DefenseDef def, Action onClick)
        {
            Def = def;
            _icon.sprite = def.icon;
            _icon.enabled = def.icon != null;
            _label.text = $"{def.displayName}\n{def.cost}";
            _button.onClick.AddListener(() => onClick());
        }

        public void Refresh(int scrap, bool selected)
        {
            _button.interactable = scrap >= Def.cost;
            _selectedFrame.enabled = selected;
        }
    }
}
```

### 5.4 A barra de compra: `ShopBar`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ShopBar.cs
using System.Collections.Generic;
using FuryHauler.Data;
using FuryHauler.Economy;
using UnityEngine;

namespace FuryHauler.UI
{
    // POR QUE: mostra as defesas que podem ser compradas agora.
    // ESTRATÉGIA: cria um ShopButton por defesa dentro de um container com
    // HorizontalLayoutGroup (a Unity alinha os botões sozinha). A lista começa
    // com todas as defesas do Inspector; na Fase 7 a run troca por só as
    // desbloqueadas, chamando SetDefenses.
    public class ShopBar : MonoBehaviour
    {
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private ShopButton _buttonPrefab;
        [SerializeField] private Transform _container;
        [SerializeField] private List<DefenseDef> _defenses = new();

        private readonly List<ShopButton> _buttons = new();

        private void Start()
        {
            ScrapWallet.Instance.Changed += _ => Refresh();
            _allocation.Changed += Refresh;
            Rebuild();
        }

        // Troca as defesas mostradas (desbloqueios, Fase 7).
        public void SetDefenses(IEnumerable<DefenseDef> defenses)
        {
            _defenses = new List<DefenseDef>(defenses);
            Rebuild();
        }

        // Apaga e recria todos os botões.
        private void Rebuild()
        {
            foreach (ShopButton button in _buttons) Destroy(button.gameObject);
            _buttons.Clear();

            foreach (DefenseDef def in _defenses)
            {
                ShopButton button = Instantiate(_buttonPrefab, _container);
                DefenseDef captured = def; // cópia para o "=>" abaixo lembrar desta defesa
                button.Setup(def, () => _allocation.SelectToBuy(captured));
                _buttons.Add(button);
            }
            Refresh();
        }

        private void Refresh()
        {
            int scrap = ScrapWallet.Instance.Amount;
            foreach (ShopButton button in _buttons)
                button.Refresh(scrap, button.Def == _allocation.PendingBuy);
        }
    }
}
```

### 5.5 O painel da defesa selecionada: `DefensePanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/DefensePanel.cs
using FuryHauler.Defenses;
using FuryHauler.Economy;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FuryHauler.UI
{
    // POR QUE: melhorar e vender precisam de um lugar na tela (Parte 1 §12).
    // ESTRATÉGIA: o componente fica sempre ativo e liga/desliga só um filho
    // (_root). Assim ele continua escutando os eventos mesmo escondido, e se
    // redesenha sozinho quando a seleção ou a sucata mudam.
    public class DefensePanel : MonoBehaviour
    {
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private GameObject _root;
        [SerializeField] private TMP_Text _title;
        [SerializeField] private TMP_Text _info;
        [SerializeField] private Button _upgradeButton;
        [SerializeField] private TMP_Text _upgradeLabel;
        [SerializeField] private Button _sellButton;
        [SerializeField] private TMP_Text _sellLabel;

        private void Start()
        {
            _upgradeButton.onClick.AddListener(_allocation.UpgradeSelected);
            _sellButton.onClick.AddListener(_allocation.SellSelected);
            _allocation.Changed += Refresh;
            ScrapWallet.Instance.Changed += _ => Refresh();
            Refresh();
        }

        private void Refresh()
        {
            Defense defense = _allocation.SelectedSlot != null ? _allocation.SelectedSlot.Installed : null;
            _root.SetActive(defense != null);
            if (defense == null) return;

            _title.text = $"{defense.Def.displayName} (nível {defense.Level}/{defense.Def.maxLevel})";
            _info.text = $"Slot: {defense.Slot.Label}" + (defense.Slot.Sabotaged ? "  [SABOTADO]" : "");

            if (defense.CanUpgrade)
            {
                _upgradeLabel.text = $"Melhorar ({defense.UpgradeCost})";
                _upgradeButton.interactable = ScrapWallet.Instance.Amount >= defense.UpgradeCost;
            }
            else
            {
                _upgradeLabel.text = "Nível máximo";
                _upgradeButton.interactable = false;
            }
            _sellLabel.text = $"Vender (+{_allocation.SellValue(defense)})";
        }
    }
}
```

### 5.6 O HUD: `HudView`

```csharp
// Caminho: Assets/_Project/Scripts/UI/HudView.cs
using FuryHauler.Economy;
using FuryHauler.Trip;
using FuryHauler.Truck;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FuryHauler.UI
{
    // POR QUE: sucata, vida e progresso precisam estar sempre à vista
    // (Parte 1 §12).
    // ESTRATÉGIA: sucata e nome do trecho mudam raramente, então são
    // atualizados por evento; vida e progresso mudam todo frame e são lidos
    // no Update. As barras são Images com "Image Type = Filled", em que
    // fillAmount (0 a 1) controla quanto aparece.
    public class HudView : MonoBehaviour
    {
        [SerializeField] private TripManager _trip;
        [SerializeField] private TruckController _truck;
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private TMP_Text _scrapText;
        [SerializeField] private TMP_Text _tripLabel;
        [SerializeField] private TMP_Text _messageText;
        [SerializeField] private Image _hpFill;
        [SerializeField] private Image _progressFill;
        [SerializeField] private float _messageSeconds = 1.5f;

        private float _messageTimer;

        private void Start()
        {
            ScrapWallet.Instance.Changed += OnScrapChanged;
            OnScrapChanged(ScrapWallet.Instance.Amount);
            _allocation.Message += ShowMessage;
            _trip.Started += settings => _tripLabel.text = settings.label;
            _messageText.text = "";
        }

        private void OnScrapChanged(int amount)
        {
            _scrapText.text = $"Sucata: {amount}";
        }

        // Mostra um aviso curto que some sozinho.
        private void ShowMessage(string text)
        {
            _messageText.text = text;
            _messageTimer = _messageSeconds;
        }

        private void Update()
        {
            _hpFill.fillAmount = _truck.Health.Current / _truck.Health.Max;
            _progressFill.fillAmount = _trip.Progress01;

            if (_messageTimer <= 0f) return;
            _messageTimer -= Time.deltaTime;
            if (_messageTimer <= 0f) _messageText.text = "";
        }
    }
}
```

### 5.7 Montar na cena

1. **Lógica:** GameObject `Economy` com **ScrapWallet** e **AllocationController** (`Camera` = Main Camera, `Truck` = Truck).
2. **Canvas:** **GameObject → UI → Canvas** (já cria o `EventSystem`). No Canvas: **UI Scale Mode = Scale With Screen Size**, referência `1280 × 720`. No `EventSystem`, se aparecer o aviso, clique em **Replace with InputSystemUIInputModule**.
3. **HUD** (filhos do Canvas, com **HudView** num objeto `Hud`):
   - `ScrapText` (TextMeshPro) no canto superior esquerdo.
   - `TripLabel` (TextMeshPro) no topo, centralizado.
   - `HpBar`: uma Image de fundo escura e, dentro, `HpFill`, uma Image vermelha com **Source Image** = `Square`, **Image Type = Filled**, **Fill Method = Horizontal**.
   - `ProgressBar`: igual, com `ProgressFill` amarelo, logo abaixo do título.
   - `MessageText` (TextMeshPro) no centro, um pouco acima da barra de compra.
4. **Barra de compra:** objeto `ShopBar` ancorado embaixo, com **HorizontalLayoutGroup** (Spacing `8`, Child Alignment `Middle Center`) e o componente **ShopBar** (`Container` = ele mesmo, `Defenses` = os 4 assets).
5. **Prefab `ShopButton`** (em `Prefabs/UI/`): um **Button** de `120 × 80` com filhos `Icon` (Image), `Label` (TextMeshPro) e `SelectedFrame` (Image com só a borda, amarela). Ligue os campos do **ShopButton**.
6. **Painel:** objeto `DefensePanel` (sempre ativo) com o componente **DefensePanel** e um filho `Root` (o painel visível, no canto inferior direito) contendo `Title`, `Info` e os botões `Upgrade` e `Sell`, cada um com seu texto.
7. Apague os `Test Defense` dos slots, para testar a compra de verdade.

### ✅ Checkpoint da Fase 5
- O HUD começa com "Sucata: 100", e a sucata sobe quando um inimigo morre por uma defesa (não quando um carro-bomba explode no caminhão).
- Clicar em "Metralhadora" acende os slots vazios em verde; clicar num deles monta a arma e desconta 40.
- Botões caros demais ficam cinza; tentar comprar sem sucata mostra "Sucata insuficiente".
- Clicar numa defesa montada abre o painel; "Melhorar" sobe o nível e cobra; "Vender" remove a defesa e devolve metade do gasto.
- Esc ou botão direito cancela a compra pendente e fecha o painel.
- As barras de vida e de progresso andam durante o trecho.

#### Problemas comuns
- **Clicar num botão da barra também monta a defesa no slot embaixo dele:** falta o `EventSystem` na cena, então `IsPointerOverGameObject` sempre devolve false.
- **Nenhum clique no mundo funciona:** o `Pick Radius` é pequeno demais para o zoom da câmera, ou a `Camera` do `AllocationController` está vazia.
- **As barras não mudam:** a Image está com **Image Type = Simple**. O `fillAmount` só funciona com **Filled**, e só se houver uma **Source Image**.

Próxima fase: **Habilidades Ativas**, com nitro e mancha de óleo.

---

# Parte 9 — Implementação Unity: Fase 6 (Habilidades Ativas)

## Fase 6 — Habilidades Ativas

> Objetivo desta fase: dois botões de habilidade (placeholders: nitro e mancha de óleo), com cooldown visível e atalhos `1` e `2`.

### 6.1 Dados de uma habilidade: `AbilityDef`

```csharp
// Caminho: Assets/_Project/Scripts/Data/AbilityDef.cs
using FuryHauler.Abilities;
using UnityEngine;

namespace FuryHauler.Data
{
    public enum AbilityKind
    {
        Nitro,     // acelera o caminhão
        OilSlick,  // mancha de óleo atrás do caminhão
    }

    // POR QUE: a lista de habilidades está Em aberto (Parte 1 §6); nitro e
    // óleo são placeholders. Um asset por habilidade deixa trocar números e
    // ícones sem código.
    // ESTRATÉGIA: um enum diz qual efeito aplicar, e os campos genéricos
    // (duração, intensidade, tamanho) são lidos por cada efeito do seu jeito.
    // Uma habilidade nova com efeito novo = um valor novo no enum + um case
    // no AbilityController.
    [CreateAssetMenu(menuName = "Fury Hauler/Ability", fileName = "Ability")]
    public class AbilityDef : ScriptableObject
    {
        public string displayName = "Nitro";
        public Sprite icon;
        public AbilityKind kind;
        public float cooldown = 20f;
        public float duration = 4f;     // nitro: tempo acelerando; óleo: tempo que a mancha fica na estrada
        public float magnitude = 1.6f;  // nitro: multiplicador de velocidade; óleo: segundos de atordoamento
        public float size = 4f;         // óleo: meio comprimento da mancha, em metros
        public float dropBehind = 5f;   // óleo: quantos metros atrás do caminhão a mancha cai
        public OilSlick oilPrefab;
    }
}
```

### 6.2 A mancha de óleo: `OilSlick`

```csharp
// Caminho: Assets/_Project/Scripts/Abilities/OilSlick.cs
using System.Collections.Generic;
using FuryHauler.Data;
using FuryHauler.Enemies;
using FuryHauler.World;
using UnityEngine;

namespace FuryHauler.Abilities
{
    // POR QUE: placeholder da Parte 1 §6: veículos que passam pelo óleo rodam.
    // ESTRATÉGIA: a mancha fica parada no chão (o caminhão segue e a deixa para
    // trás, bem no caminho de quem persegue). Ela cobre a estrada inteira na
    // largura e "size" metros para cada lado no comprimento. Cada veículo só
    // é atordoado uma vez por mancha (HashSet guarda quem já passou).
    [RequireComponent(typeof(GroundBody))]
    public class OilSlick : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _renderer;

        private readonly HashSet<Enemy> _hit = new();
        private GroundBody _body;
        private AbilityDef _def;
        private float _life;

        // Chamado pelo AbilityController logo depois de criar a mancha.
        public void Init(AbilityDef def, Vector2 ground)
        {
            _def = def;
            _life = def.duration;
            _body = GetComponent<GroundBody>();
            _body.Ground = ground;
            _body.Apply();
            if (_renderer != null)
            {
                // Losango placeholder esticado para a largura da estrada.
                float width = GameConfig.I.roadHalfWidth * 2f;
                Vector3 size = _renderer.sprite.bounds.size;
                _renderer.transform.localScale = new Vector3(
                    width * IsoProjection.HalfWidth * 2f / size.x,
                    width * IsoProjection.HalfHeight * 2f / size.y, 1f);
            }
        }

        private void Update()
        {
            _life -= Time.deltaTime;
            if (_life <= 0f)
            {
                Destroy(gameObject);
                return;
            }

            float halfWidth = GameConfig.I.roadHalfWidth;
            foreach (Enemy enemy in Enemy.All)
            {
                if (!enemy.IsAlive || !enemy.Def.isVehicle || _hit.Contains(enemy)) continue;
                Vector2 d = enemy.Ground - _body.Ground;
                if (Mathf.Abs(d.x) > _def.size || Mathf.Abs(d.y) > halfWidth) continue;
                enemy.Stun(_def.magnitude);
                _hit.Add(enemy);
            }
        }
    }
}
```

> O sprite do óleo é um losango (um quadrado de chão), então ele aparece com a largura da estrada nos dois sentidos, mesmo que a área que atordoa tenha `2 × size` metros de comprimento. Com a arte final, desenhe a mancha com as proporções certas.

### 6.3 Quem usa as habilidades: `AbilityController`

```csharp
// Caminho: Assets/_Project/Scripts/Abilities/AbilityController.cs
using System.Collections.Generic;
using FuryHauler.Data;
using FuryHauler.Trip;
using FuryHauler.Truck;
using UnityEngine;
using UnityEngine.InputSystem;

namespace FuryHauler.Abilities
{
    // POR QUE: além de alocar, o jogador tem habilidades com cooldown
    // (Parte 1 §6). Este é o único lugar que sabe aplicar cada efeito.
    // ESTRATÉGIA: um cooldown por habilidade, na mesma ordem da lista. As
    // teclas 1, 2, 3... usam a habilidade da posição correspondente. Tudo
    // volta a zero no começo de cada trecho.
    public class AbilityController : MonoBehaviour
    {
        [SerializeField] private TruckController _truck;
        [SerializeField] private TripManager _trip;
        [SerializeField] private List<AbilityDef> _abilities = new();

        private float[] _cooldowns;
        private float _nitroTimer;

        public IReadOnlyList<AbilityDef> Abilities => _abilities;

        private void Awake()
        {
            _cooldowns = new float[_abilities.Count];
        }

        private void OnEnable() => _trip.Started += OnTripStarted;
        private void OnDisable() => _trip.Started -= OnTripStarted;

        private void OnTripStarted(TripSettings settings)
        {
            for (int i = 0; i < _cooldowns.Length; i++) _cooldowns[i] = 0f;
            _nitroTimer = 0f;
        }

        private void Update()
        {
            float dt = Time.deltaTime;
            for (int i = 0; i < _cooldowns.Length; i++) _cooldowns[i] = Mathf.Max(0f, _cooldowns[i] - dt);

            if (_nitroTimer > 0f)
            {
                _nitroTimer -= dt;
                if (_nitroTimer <= 0f) _truck.SpeedMultiplier = 1f;
            }

            Keyboard keyboard = Keyboard.current;
            if (keyboard == null) return;
            for (int i = 0; i < _abilities.Count && i < 9; i++)
                if (keyboard[Key.Digit1 + i].wasPressedThisFrame) TryUse(i);
        }

        // Fração do cooldown que ainda falta (1 = acabou de usar, 0 = pronta).
        public float Cooldown01(int index)
        {
            float total = _abilities[index].cooldown;
            return total <= 0f ? 0f : _cooldowns[index] / total;
        }

        // Usa a habilidade se o trecho estiver rolando e ela estiver pronta.
        public bool TryUse(int index)
        {
            if (!_trip.IsRunning || _cooldowns[index] > 0f) return false;

            AbilityDef ability = _abilities[index];
            switch (ability.kind)
            {
                case AbilityKind.Nitro:
                    _truck.SpeedMultiplier = ability.magnitude;
                    _nitroTimer = ability.duration;
                    break;

                case AbilityKind.OilSlick:
                    OilSlick oil = Instantiate(ability.oilPrefab);
                    oil.Init(ability, _truck.Ground + new Vector2(-ability.dropBehind, 0f));
                    break;
            }

            _cooldowns[index] = ability.cooldown;
            return true;
        }
    }
}
```

### 6.4 Os botões: `AbilityButton` e `AbilityBar`

```csharp
// Caminho: Assets/_Project/Scripts/UI/AbilityButton.cs
using System;
using FuryHauler.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FuryHauler.UI
{
    // POR QUE: o jogador precisa ver quando a habilidade volta.
    // ESTRATÉGIA: uma Image escura por cima do botão, com "Fill Method =
    // Radial 360", que vai se abrindo como um relógio conforme o cooldown acaba.
    public class AbilityButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private Image _icon;
        [SerializeField] private Image _cooldownOverlay;
        [SerializeField] private TMP_Text _label;

        public void Setup(AbilityDef ability, int hotkey, Action onClick)
        {
            _icon.sprite = ability.icon;
            _icon.enabled = ability.icon != null;
            _label.text = $"[{hotkey}] {ability.displayName}";
            _button.onClick.AddListener(() => onClick());
        }

        public void SetCooldown(float fraction)
        {
            _cooldownOverlay.fillAmount = fraction;
            _button.interactable = fraction <= 0f;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/AbilityBar.cs
using System.Collections.Generic;
using FuryHauler.Abilities;
using UnityEngine;

namespace FuryHauler.UI
{
    // POR QUE: um botão por habilidade, criado a partir da lista do controller.
    // ESTRATÉGIA: igual à barra de compra. O cooldown muda todo frame, então
    // é lido no Update.
    public class AbilityBar : MonoBehaviour
    {
        [SerializeField] private AbilityController _controller;
        [SerializeField] private AbilityButton _buttonPrefab;
        [SerializeField] private Transform _container;

        private readonly List<AbilityButton> _buttons = new();

        private void Start()
        {
            for (int i = 0; i < _controller.Abilities.Count; i++)
            {
                int index = i; // cópia para o "=>" abaixo lembrar deste índice
                AbilityButton button = Instantiate(_buttonPrefab, _container);
                button.Setup(_controller.Abilities[i], i + 1, () => _controller.TryUse(index));
                _buttons.Add(button);
            }
        }

        private void Update()
        {
            for (int i = 0; i < _buttons.Count; i++) _buttons[i].SetCooldown(_controller.Cooldown01(i));
        }
    }
}
```

### 6.5 Montar na cena

1. **Prefab `OilSlick`** (em `Prefabs/`): GameObject + **GroundBody** (`SortingGroup` na Sorting Layer **Chao**, Order `10`, para ficar sobre a estrada) + **OilSlick** + filho sprite `Diamond` preto com alpha `0.7` ligado em `Renderer`.
2. **Assets** (em `ScriptableObjects/Abilities/`, **Create → Fury Hauler → Ability**), números da Parte 1 §15:

| Asset | Kind | Cooldown | Duration | Magnitude | Size | Drop Behind | Oil Prefab |
|---|---|---|---|---|---|---|---|
| `Nitro` | Nitro | 20 | 4 | 1.6 | — | — | — |
| `OilSlick` | OilSlick | 15 | 5 | 1.5 | 4 | 5 | OilSlick |

3. **Controller:** no objeto `Economy` (ou num novo `Abilities`), adicione **AbilityController** com `Truck`, `Trip` e `Abilities` = Nitro, OilSlick (nessa ordem: tecla 1 e tecla 2).
4. **Prefab `AbilityButton`** (em `Prefabs/UI/`): Button `100 × 100` com filhos `Icon`, `Label` e, por último (para ficar por cima), `CooldownOverlay`: Image preta com alpha `0.6`, **Source Image** = `Square`, **Image Type = Filled**, **Fill Method = Radial 360**.
5. **Barra:** objeto `AbilityBar` no canto inferior esquerdo do Canvas, com **HorizontalLayoutGroup** e o componente **AbilityBar**.

### ✅ Checkpoint da Fase 6
- Apertar `1` (ou clicar no botão) acelera o caminhão por 4 s: motoqueiros ficam para trás e param de atirar, depois alcançam de novo.
- Apertar `2` deixa uma mancha escura atrás do caminhão; veículos que passam por ela param por 1,5 s. Saqueadores não são afetados.
- Os botões escurecem e "abrem como relógio" até o fim do cooldown, e não funcionam antes disso.
- As habilidades não funcionam depois que o trecho acabou.

#### Problemas comuns
- **A tecla `1` do teclado numérico não funciona:** `Key.Digit1` é a tecla `1` acima das letras. Se quiser as duas, cheque também `Key.Numpad1 + i`.
- **O caminhão fica acelerado para sempre:** o trecho acabou durante o nitro e começou outro; o `OnTripStarted` zera o timer, mas o `TruckController.ResetForTrip` é quem volta o `SpeedMultiplier` para 1. Confira se o `ResetForTrip` está igual ao da Fase 2.

Próxima fase: **Run Roguelite e Save**, com mapa de rota, sequência de trechos, chefe no fim e desbloqueios permanentes.

---

# Parte 10 — Implementação Unity: Fase 7 (Run Roguelite e Save)

## Fase 7 — Run Roguelite e Save

> Objetivo desta fase: o jogo completo de ponta a ponta. Menu → mapa de rota gerado → escolher trecho → jogar → voltar ao mapa → ... → chefe → chegada a B (ou derrota) → tela de resultado. E os desbloqueios permanentes salvos no navegador.

### 7.1 Um nó do mapa: `RouteNode` e `RouteMap`

```csharp
// Caminho: Assets/_Project/Scripts/Run/RouteNode.cs
using System.Collections.Generic;
using FuryHauler.Data;
using FuryHauler.Trip;

namespace FuryHauler.Run
{
    // POR QUE: cada trecho da rota é uma escolha do jogador (Parte 1 §8).
    // ESTRATÉGIA: classe C# pura (não é MonoBehaviour, não vai na cena). O
    // mapa é organizado em camadas: a camada 0 é o primeiro trecho, a última
    // é o chefe. "next" guarda para quais nós da camada seguinte dá para ir.
    // Os tipos de nó estão Em aberto; o placeholder só varia o risco.
    public class RouteNode
    {
        public int layer;
        public int index;
        public int risk;      // 0..maxRisk: mais inimigos e mais sucata
        public bool isBoss;
        public readonly List<int> next = new();

        // Nome curto do nó, ex.: "2-B". O chefe se chama "B" (o destino).
        public string Name => isBoss ? "B" : $"{layer + 1}-{(char)('A' + index)}";

        // Converte o nó nas regras do trecho que o TripManager entende.
        public TripSettings ToSettings(GameConfig cfg)
        {
            return new TripSettings
            {
                label = isBoss ? "Último trecho: chegada em B" : $"Trecho {Name} (risco {risk})",
                difficulty = layer + 1 + risk,
                hasBoss = isBoss,
                scrapMultiplier = 1f + risk * cfg.scrapBonusPerRisk,
            };
        }
    }

    // O mapa inteiro: uma lista de camadas, cada uma com seus nós.
    public class RouteMap
    {
        public readonly List<List<RouteNode>> layers = new();
    }
}
```

### 7.2 Gerar o mapa: `RouteGenerator`

```csharp
// Caminho: Assets/_Project/Scripts/Run/RouteGenerator.cs
using System.Collections.Generic;
using FuryHauler.Data;
using UnityEngine;

namespace FuryHauler.Run
{
    // POR QUE: a rota é gerada a cada run (Parte 1 §8).
    // ESTRATÉGIA: cria as camadas com 2 a 3 nós (a última com só o chefe) e
    // liga camadas vizinhas pela "posição relativa": um nó no alto da coluna
    // liga com nós no alto da próxima. Duas passadas garantem que todo nó tem
    // pelo menos uma saída e uma entrada; uma ligação extra sorteada cria as
    // bifurcações. System.Random (não o UnityEngine.Random) aceita uma
    // semente, então o mesmo número gera o mesmo mapa (útil para testar).
    public static class RouteGenerator
    {
        public static RouteMap Generate(GameConfig cfg, System.Random rng)
        {
            var map = new RouteMap();
            int layerCount = Mathf.Max(2, cfg.routeLayers);

            for (int l = 0; l < layerCount; l++)
            {
                bool last = l == layerCount - 1;
                int count = last ? 1 : rng.Next(cfg.minNodesPerLayer, cfg.maxNodesPerLayer + 1);
                var layer = new List<RouteNode>();
                for (int i = 0; i < count; i++)
                {
                    layer.Add(new RouteNode
                    {
                        layer = l,
                        index = i,
                        isBoss = last,
                        risk = last ? 0 : rng.Next(0, cfg.maxRisk + 1),
                    });
                }
                map.layers.Add(layer);
            }

            for (int l = 0; l < layerCount - 1; l++) Connect(map.layers[l], map.layers[l + 1], rng);
            return map;
        }

        // Posição relativa (0..1) do nó i numa coluna de "count" nós.
        private static float RelativePos(int i, int count) => (i + 0.5f) / count;

        // Índice do nó, numa coluna de "count" nós, mais perto da posição relativa.
        private static int NearestIndex(float pos, int count) => Mathf.Clamp(Mathf.FloorToInt(pos * count), 0, count - 1);

        private static void Connect(List<RouteNode> from, List<RouteNode> to, System.Random rng)
        {
            // Toda origem tem pelo menos uma saída...
            foreach (RouteNode node in from)
            {
                int nearest = NearestIndex(RelativePos(node.index, from.Count), to.Count);
                AddEdge(node, nearest);

                // ...e às vezes uma segunda, para um vizinho (a bifurcação).
                if (rng.NextDouble() < 0.5)
                {
                    int neighbor = Mathf.Clamp(nearest + (rng.Next(2) == 0 ? -1 : 1), 0, to.Count - 1);
                    AddEdge(node, neighbor);
                }
            }

            // ...e todo destino tem pelo menos uma entrada.
            foreach (RouteNode target in to)
            {
                int source = NearestIndex(RelativePos(target.index, to.Count), from.Count);
                AddEdge(from[source], target.index);
            }
        }

        private static void AddEdge(RouteNode node, int nextIndex)
        {
            if (!node.next.Contains(nextIndex)) node.next.Add(nextIndex);
        }
    }
}
```

### 7.3 O save permanente: `MetaProgress`

```csharp
// Caminho: Assets/_Project/Scripts/Run/MetaProgress.cs
using System;
using UnityEngine;

namespace FuryHauler.Run
{
    // POR QUE: o que fica entre runs (Parte 1 §9) precisa sobreviver a fechar
    // o navegador. O jogo é offline (Parte 1 §14).
    // ESTRATÉGIA: um objeto simples convertido em JSON pelo JsonUtility e
    // guardado no PlayerPrefs. Na build Web, a Unity guarda o PlayerPrefs no
    // IndexedDB do navegador, mas só grava de fato quando PlayerPrefs.Save()
    // é chamado, por isso Save() sempre chama.
    [Serializable]
    public class MetaProgress
    {
        private const string Key = "furyhauler.meta";

        public int runsStarted;
        public int runsCompleted;
        public int bestTrips; // maior número de trechos concluídos numa run

        public static MetaProgress Load()
        {
            string json = PlayerPrefs.GetString(Key, "");
            if (string.IsNullOrEmpty(json)) return new MetaProgress();
            try
            {
                return JsonUtility.FromJson<MetaProgress>(json) ?? new MetaProgress();
            }
            catch (ArgumentException)
            {
                Debug.LogWarning("Save corrompido; começando do zero.");
                return new MetaProgress();
            }
        }

        public void Save()
        {
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(this));
            PlayerPrefs.Save();
        }
    }
}
```

### 7.4 Um botão do mapa: `RouteNodeButton`

```csharp
// Caminho: Assets/_Project/Scripts/UI/RouteNodeButton.cs
using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FuryHauler.UI
{
    // POR QUE: cada nó do mapa vira um botão clicável.
    // ESTRATÉGIA: o botão só exibe o texto e chama a ação recebida. Fica
    // clicável só se o nó for alcançável, e destacado se for o nó atual.
    public class RouteNodeButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private Image _currentFrame;

        public void Setup(string text, bool reachable, bool current, Action onClick)
        {
            _label.text = text;
            _button.interactable = reachable;
            _currentFrame.enabled = current;
            _button.onClick.AddListener(() => onClick());
        }
    }
}
```

### 7.5 O mapa na tela: `RouteMapView`

```csharp
// Caminho: Assets/_Project/Scripts/UI/RouteMapView.cs
using System.Text;
using FuryHauler.Run;
using UnityEngine;

namespace FuryHauler.UI
{
    // POR QUE: o jogador escolhe o próximo trecho num mapa (Parte 1 §8).
    // ESTRATÉGIA: uma coluna por camada (HorizontalLayoutGroup com colunas
    // de VerticalLayoutGroup). No MVP as ligações entre nós não são
    // desenhadas como linhas: cada botão diz em texto para onde ele segue
    // ("Segue: A, B"). Desenhar as linhas fica para depois.
    public class RouteMapView : MonoBehaviour
    {
        [SerializeField] private RunManager _run;
        [SerializeField] private Transform _columnsContainer;
        [SerializeField] private Transform _columnPrefab;
        [SerializeField] private RouteNodeButton _nodePrefab;

        // Apaga e recria o mapa inteiro (é pequeno, não vale a pena reaproveitar).
        public void Build()
        {
            foreach (Transform child in _columnsContainer) Destroy(child.gameObject);

            foreach (var layer in _run.Route.layers)
            {
                Transform column = Instantiate(_columnPrefab, _columnsContainer);
                foreach (RouteNode node in layer)
                {
                    RouteNodeButton button = Instantiate(_nodePrefab, column);
                    RouteNode captured = node; // cópia para o "=>" abaixo lembrar deste nó
                    button.Setup(Describe(node), _run.CanChoose(node), node == _run.CurrentNode,
                        () => _run.ChooseNode(captured));
                }
            }
        }

        // Texto do botão: nome, risco e para onde segue.
        private static string Describe(RouteNode node)
        {
            if (node.isBoss) return "CHEGADA (B)\nChefe";

            var text = new StringBuilder();
            text.Append($"Trecho {node.Name}\nRisco {node.risk}\nSegue: ");
            for (int i = 0; i < node.next.Count; i++)
            {
                if (i > 0) text.Append(", ");
                text.Append((char)('A' + node.next[i]));
            }
            return text.ToString();
        }
    }
}
```

### 7.6 A run: `RunManager`

```csharp
// Caminho: Assets/_Project/Scripts/Run/RunManager.cs
using System.Collections.Generic;
using FuryHauler.Data;
using FuryHauler.Economy;
using FuryHauler.Trip;
using FuryHauler.Truck;
using FuryHauler.UI;
using TMPro;
using UnityEngine;

namespace FuryHauler.Run
{
    // POR QUE: costura tudo numa run (Parte 1 §2): começa do zero, escolhe
    // trechos no mapa, chega a B ou perde tudo, e guarda a meta-progressão.
    // ESTRATÉGIA: uma única cena. Em vez de trocar de cena, liga e desliga
    // painéis (menu, mapa, resultado) por cima do jogo. O caminhão é o mesmo
    // objeto a run inteira: defesas e sucata continuam de um trecho para o
    // outro naturalmente, e o TripManager só o recoloca no começo da estrada.
    public class RunManager : MonoBehaviour
    {
        [SerializeField] private TripManager _trip;
        [SerializeField] private TruckController _truck;
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private ShopBar _shop;
        [SerializeField] private List<DefenseDef> _allDefenses = new();

        [Header("Telas")]
        [SerializeField] private GameObject _menuPanel;
        [SerializeField] private TMP_Text _menuStats;
        [SerializeField] private GameObject _routePanel;
        [SerializeField] private RouteMapView _routeView;
        [SerializeField] private GameObject _resultPanel;
        [SerializeField] private TMP_Text _resultText;

        private MetaProgress _meta;
        private int _tripsDone;

        public RouteMap Route { get; private set; }
        public RouteNode CurrentNode { get; private set; } // null = ainda no ponto A

        private void Start()
        {
            _meta = MetaProgress.Load();
            _trip.Ended += OnTripEnded;
            ShowOnly(_menuPanel);
            RefreshMenu();
        }

        // Botão "Partir" do menu e "Nova viagem" do resultado.
        public void NewRun()
        {
            GameConfig cfg = GameConfig.I;
            Route = RouteGenerator.Generate(cfg, new System.Random());
            CurrentNode = null;
            _tripsDone = 0;

            _allocation.CancelAll();
            foreach (TruckSlot slot in _truck.Slots) slot.Clear();
            _truck.Health.ResetFull();
            ScrapWallet.Instance.ResetTo(cfg.startingScrap);
            _shop.SetDefenses(UnlockedDefenses());

            _meta.runsStarted++;
            _meta.Save();
            ShowRoute();
        }

        // Botão "Menu" do resultado.
        public void BackToMenu()
        {
            RefreshMenu();
            ShowOnly(_menuPanel);
        }

        // Pode ir para este nó? Do ponto A, qualquer nó da camada 0; depois, só
        // os ligados ao nó atual.
        public bool CanChoose(RouteNode node)
        {
            if (CurrentNode == null) return node.layer == 0;
            return node.layer == CurrentNode.layer + 1 && CurrentNode.next.Contains(node.index);
        }

        // Clique num nó do mapa: começa o trecho.
        public void ChooseNode(RouteNode node)
        {
            if (!CanChoose(node)) return;
            CurrentNode = node;
            if (!GameConfig.I.carryTruckHpBetweenTrips) _truck.Health.ResetFull();
            ShowOnly(null);
            _trip.StartTrip(node.ToSettings(GameConfig.I));
        }

        private void OnTripEnded(bool success)
        {
            if (CurrentNode == null) return; // trecho de teste (Fases 2-6), fora de uma run

            if (success)
            {
                _tripsDone++;
                _meta.bestTrips = Mathf.Max(_meta.bestTrips, _tripsDone);
            }

            if (success && CurrentNode.isBoss)
            {
                _meta.runsCompleted++;
                _meta.Save();
                ShowResult("Você chegou a B!");
            }
            else if (success)
            {
                _meta.Save();
                ShowRoute();
            }
            else
            {
                _meta.Save();
                ShowResult($"O caminhão foi destruído no trecho {CurrentNode.Name}.\nTrechos concluídos: {_tripsDone}");
            }
        }

        // Defesas cujo requisito de desbloqueio já foi atingido (placeholder, Parte 1 §9).
        private List<DefenseDef> UnlockedDefenses()
        {
            var unlocked = new List<DefenseDef>();
            foreach (DefenseDef def in _allDefenses)
                if (def.unlockAtBestTrips <= _meta.bestTrips) unlocked.Add(def);
            return unlocked;
        }

        private void ShowRoute()
        {
            ShowOnly(_routePanel);
            _routeView.Build();
        }

        private void ShowResult(string text)
        {
            _resultText.text = text;
            ShowOnly(_resultPanel);
        }

        private void RefreshMenu()
        {
            _menuStats.text = $"Viagens: {_meta.runsStarted}   Chegadas em B: {_meta.runsCompleted}   Melhor run: {_meta.bestTrips} trechos";
        }

        // Liga um painel e desliga os outros (null = só o jogo).
        private void ShowOnly(GameObject panel)
        {
            _menuPanel.SetActive(panel == _menuPanel);
            _routePanel.SetActive(panel == _routePanel);
            _resultPanel.SetActive(panel == _resultPanel);
        }
    }
}
```

> A defesa nova liberada só aparece na barra de compra na **próxima** run, porque `UnlockedDefenses()` é lido no `NewRun`. É uma escolha de simplicidade, não de design: se o jogo quiser liberar no meio da run, basta chamar `_shop.SetDefenses(UnlockedDefenses())` também no `OnTripEnded`.

### 7.7 Montar na cena

1. **TripManager:** desligue `Start On Play`. A partir de agora quem começa os trechos é a run.
2. **Slots:** confira que nenhum `Test Defense` está preenchido.
3. **GameConfig:** volte `Trip Length` para `900`, se tinha diminuído na Fase 2.
4. **Run:** GameObject `Run` com **RunManager**: `Trip`, `Truck`, `Allocation`, `Shop` e `All Defenses` = os 4 assets de defesa.
5. **Painéis** (filhos do Canvas, cada um com uma Image de fundo escura cobrindo a tela inteira, para bloquear cliques no jogo por baixo):
   - `MenuPanel`: título "FURY HAULER", texto `MenuStats` e botão "Partir" → **On Click** = `Run` → `RunManager.NewRun`.
   - `RoutePanel`: título "Escolha o próximo trecho" e um objeto `Columns` com **HorizontalLayoutGroup** (Spacing `40`, Child Alignment `Middle Center`). Ligue **RouteMapView** no `RoutePanel`, com `Run` = `Run` e `Columns Container` = `Columns`.
   - `ResultPanel`: texto `ResultText`, botão "Nova viagem" → `RunManager.NewRun` e botão "Menu" → `RunManager.BackToMenu`.
6. **Prefabs de UI** (em `Prefabs/UI/`):
   - `RouteColumn`: um RectTransform vazio com **VerticalLayoutGroup** (Spacing `20`, Child Alignment `Middle Center`) e **Content Size Fitter** (Vertical Fit = Preferred Size).
   - `RouteNodeButton`: um Button `160 × 90` com filhos `Label` (TextMeshPro) e `CurrentFrame` (Image só de borda, amarela).
7. Na `RouteMapView`, ligue `Column Prefab` = `RouteColumn` e `Node Prefab` = `RouteNodeButton`.

### ✅ Checkpoint da Fase 7
- O jogo abre no menu, com as estatísticas zeradas na primeira vez.
- "Partir" mostra o mapa: 6 colunas, a última só com "CHEGADA (B)"; só os nós da primeira coluna são clicáveis.
- Escolher um nó esconde o mapa e começa o trecho; ao concluí-lo, o mapa volta, e só os nós indicados em "Segue:" ficam clicáveis.
- Defesas, sucata e vida do caminhão continuam de um trecho para o outro.
- No último trecho aparece o chefe; destruí-lo e chegar ao fim mostra "Você chegou a B!".
- Perder mostra a tela de resultado; "Nova viagem" recomeça com 100 de sucata, caminhão vazio e vida cheia.
- Na primeira run só há metralhadora e blindagem na barra; depois de uma run em que concluiu pelo menos 1 trecho, o lança-chamas aparece na próxima.
- Fechar e abrir o jogo de novo mantém as estatísticas do menu.

#### Problemas comuns
- **Clicar no mapa também clica no caminhão por trás:** o painel não tem uma Image de fundo com **Raycast Target** ligado, então o `EventSystem` não sabe que o mouse está sobre a UI.
- **O trecho começa sozinho ao abrir o jogo:** o `Start On Play` do `TripManager` ainda está ligado.
- **As estatísticas zeram ao rodar de novo no Editor:** o PlayerPrefs do Editor é separado do da build, mas persiste entre Plays. Se zerar, confira se o `Save()` está sendo chamado (um `Debug.Log` nele ajuda). Para apagar de propósito: **Edit → Clear All PlayerPrefs**.

Próxima fase: **Build Web e Próximos Passos**.

---

# Parte 11 — Implementação Unity: Fase 8 (Build Web e Próximos Passos)

## Fase 8 — Build Web e Próximos Passos

> Objetivo desta fase: o MVP rodando num navegador, pronto para mandar o link para alguém testar.

### 8.1 Configurar a plataforma

1. **File → Build Profiles → Web → Switch Platform.**
2. Em **Player Settings → Resolution and Presentation**: resolução padrão `1280 × 720` e template `Default` (ou `Minimal`, sem a moldura da Unity).
3. Em **Player Settings → Publishing Settings**:
   - **Compression Format = Gzip**.
   - **Decompression Fallback** ligado. Sem isso, sites que não mandam o cabeçalho `Content-Encoding` certo (como o itch.io em alguns casos) mostram erro ao carregar.
4. **Run In Background** ligado (Resolution and Presentation), para o jogo não congelar quando outra aba ganha foco por um instante.

### 8.2 Gerar e testar

1. **Build And Run** em `Builds/Web/`. A Unity abre um servidor local e o navegador.
   - Abrir o `index.html` direto do disco (dando dois cliques) **não funciona**: navegadores bloqueiam o carregamento dos arquivos da build por `file://`.
2. Teste o roteiro inteiro do Checkpoint da Fase 7 no navegador, inclusive fechar a aba e abrir de novo para conferir o save.
3. **Publicar para teste:** no itch.io, crie um projeto **HTML**, envie a pasta da build compactada em `.zip` e marque **This file will be played in the browser**.

### ✅ Checkpoint da Fase 8
- A build abre no navegador sem erros no console do navegador (F12).
- Uma run inteira dá para ser jogada só com mouse (e as teclas `1`/`2` opcionais).
- O save sobrevive a fechar e abrir a aba.

#### Problemas comuns
- **"Unable to parse Build/....framework.js.gz":** o servidor não está mandando os arquivos `.gz` com o cabeçalho certo. Ligue **Decompression Fallback** e gere de novo.
- **O save some no navegador:** abas anônimas apagam o IndexedDB ao fechar; teste numa aba normal. Na build, o save só é gravado quando `PlayerPrefs.Save()` roda (já está no `MetaProgress.Save`).

### 8.3 Próximos passos

Tudo abaixo depende de decisões que a Parte 1 ainda marca como **Em aberto**:

- **Arte:** decidir pixel art ou vetor e a ferramenta (Parte 1 §11). Os placeholders (losango, quadrado, círculo) foram escolhidos para serem trocados só arrastando sprites novos nos prefabs, sem mexer em código.
- **Áudio** (Parte 1 §13).
- **Decisão de slot mais rica** (o maior risco da Parte 1 §16): testar se o leque de tiro por slot cria escolhas de verdade, e considerar inimigos que vêm pela frente ou de um lado só por trecho.
- **Tipos de nó no mapa** (oficina, loja, evento) e linhas ligando os nós (Parte 1 §8).
- **O que desbloquear e como** na meta-progressão (Parte 1 §9).
- **Coleta de sucata, pausa durante alocação e mover defesas** (Parte 1 §5).
- **Mais habilidades, defesas e inimigos** (Parte 1 §4, §6, §7).
- **Protótipo HTML** em `prototipos/` para testar a sensação do jogo antes de investir em arte, como os outros jogos do repositório.

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
