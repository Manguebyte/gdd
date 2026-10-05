# GDD — Craft Dice

> Documento vivo. Rascunho inicial — a refinar conforme prototipagem. Os números de balanceamento (HP, dano, preços, custo dos feitiços) ainda não foram decididos: os valores da tabela §13 e do Guia de Implementação Unity (Parte 2 em diante) são **placeholders de MVP**, não decisões fechadas.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Unity](#parte-2--guia-de-implementação-unity)
3. [Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-3--implementação-unity-fase-0-setup-do-projeto)
4. [Parte 4 — Implementação Unity: Fase 1 (Tipos e Definições)](#parte-4--implementação-unity-fase-1-tipos-e-definições)
5. [Parte 5 — Implementação Unity: Fase 2 (Regras da Batalha)](#parte-5--implementação-unity-fase-2-regras-da-batalha)
6. [Parte 6 — Implementação Unity: Fase 3 (Estado da Run e Save)](#parte-6--implementação-unity-fase-3-estado-da-run-e-save)
7. [Parte 7 — Implementação Unity: Fase 4 (Cena de Batalha)](#parte-7--implementação-unity-fase-4-cena-de-batalha)
8. [Parte 8 — Implementação Unity: Fase 5 (Exploração Topdown)](#parte-8--implementação-unity-fase-5-exploração-topdown)
9. [Parte 9 — Implementação Unity: Fase 6 (Bonfire e Forja)](#parte-9--implementação-unity-fase-6-bonfire-e-forja)
10. [Parte 10 — Implementação Unity: Fase 7 (Áreas, Chefes e Fim da Run)](#parte-10--implementação-unity-fase-7-áreas-chefes-e-fim-da-run)
11. [Parte 11 — Implementação Unity: Fase 8 (Build e Próximos Passos)](#parte-11--implementação-unity-fase-8-build-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Gênero:** **Definido** — RPG roguelike + soulslike, com combate por rolagem de dados.
- **Dimensão:** **Definido** — 2D.
- **Câmera/perspectiva:** **Definido** — topdown na exploração do mapa. A batalha acontece numa cena separada, orientada a UI.
- **Plataforma-alvo:** **Definido** — PC e Mobile desde o MVP.
- **Pilar de design:** **Em aberto**. Candidato para discussão (não aprovado): "você vê o golpe que vem e decide o que arriscar com os dados que tem".
- **Fantasia central:** **Em aberto**. Depende do pilar acima.
- **Referências/inspirações:** **Em aberto**, porque o usuário não citou nenhuma. Semelhanças observadas, só para orientar a conversa: a bonfire e o renascimento dos monstros vêm da série Dark Souls; a intenção do inimigo visível antes do turno lembra Slay the Spire; o combate com dados lembra Dicey Dungeons.

## 2. Loop Principal

1. **Definido:** o jogador anda pelo mapa topdown 2D.
2. **Definido:** encostar num monstro leva para a **cena de batalha**.
3. **Definido:** a batalha acontece em rodadas de dados (§4) até o monstro ou o jogador morrer.
4. **Definido:** com a vitória, o jogador volta ao mapa no mesmo ponto, o monstro some e o jogador recebe a moeda do jogo (§9).
5. **Definido:** nas **bonfires** do mapa o jogador recupera todo o HP, aprende feitiços, forja dados e escolhe quais dados leva para as batalhas (§7). Descansar numa bonfire faz os monstros comuns renascerem.
6. **Definido:** se o jogador morrer, **perde tudo** (dados, feitiços, moeda) e volta para o começo do jogo (§9).

## 3. Os Dados

### 3.1 Tipos e faces

**Definido:** existem três tipos de dado. A tabela abaixo lista as faces de um dado **padrão** de cada tipo.

| Tipo | Faces do dado padrão | O que cada face faz |
|---|---|---|
| **Ataque** | 1 Ataque · 2 Ataques · Miss · Crítico | Cada "ataque" acerta o monstro uma vez. **Crítico = 3 ataques**. Miss não faz nada. |
| **Defesa** | Parry · Esquiva · Miss | **Parry** anula 1 ataque do monstro **e contra-ataca** (devolve dano). **Esquiva** anula 1 ataque do monstro. Miss não faz nada. |
| **Feitiço** | 0 Feitiço · 1 Feitiço · 2 Feitiços | Gera pontos de feitiço para lançar os feitiços aprendidos (§5). |

- **Definido:** no texto original o terceiro dado aparece uma vez como "poção" e três vezes como "feitiço". Este GDD usa **Dado de Feitiço**. A poção de HP é um dos usos desse dado (§5).
- **Em aberto:** quanto dano causa cada ataque do jogador e quanto dano devolve o contra-ataque do Parry. Placeholders de MVP: 1 de dano por ataque e 1 de dano por Parry (§13).
- **Em aberto:** se as faces de um dado têm todas a mesma chance. Placeholder de MVP: chance igual para todas.

### 3.2 Bolsa de dados e mão de batalha

- **Definido:** o jogador pode ter mais dados do que leva para a batalha. O limite é de **5 dados por batalha**.
- **Definido:** a combinação desses 5 dados é livre. O dado de Feitiço é opcional: dá para levar só dados de Ataque, Ataque com Defesa, ou Ataque, Defesa e Feitiço.
- **Em aberto:** onde o jogador escolhe os 5 dados. Placeholder de MVP: no menu da bonfire (§7). Falta decidir se também dá para trocar ao entrar numa batalha.
- **Em aberto:** com quais dados a run começa. Placeholder de MVP: 2 dados de Ataque e 1 de Defesa, todos padrão.
- **Em aberto:** se a mão pode ficar vazia ou sem nenhum dado de Ataque. Placeholder de MVP: a mão precisa ter pelo menos 1 dado.

### 3.3 Forja (faces customizáveis)

- **Definido:** o jogador forja dados novos durante a run, e **a forja fica nas bonfires**.
- **Definido:** forjar custa a **moeda única** do jogo (§9).
- **Definido:** as **faces do dado forjado são customizáveis**. É daí que vem o "Craft" do nome: dá para forjar, por exemplo, um dado de Ataque sem a face Miss.
- **Em aberto:** as regras da customização. Placeholders de MVP:
  - o dado forjado tem o mesmo número de faces do padrão do tipo (Ataque 4, Defesa 3, Feitiço 3);
  - cada face só pode ser escolhida entre as faces que existem para aquele tipo, sem misturar tipos num mesmo dado;
  - o preço sobe conforme a força das faces: `preço = 5 + 3 × soma do valor de forja` (Miss 0, Esquiva 1, Parry 2, as demais valem o número da face, e Crítico vale 3).
- **Em aberto:** se dá para misturar tipos num dado (ex.: faces de Ataque e de Parry no mesmo dado), se dá para reforjar ou vender dados, e se existem faces especiais que só a forja oferece.

## 4. Rodada de Batalha

### 4.1 Loop da rodada

**Definido** (pelo texto original e pela entrevista):

1. **Intenção do monstro:** antes da rolagem, o jogador já vê quantos ataques o monstro vai dar nesta rodada.
2. **Rolagem:** o jogador rola todos os dados da mão.
3. **Re-rolagem:** o jogador escolhe quais dados quer re-rolar. Os dados não escolhidos ficam como estão. Sem gastar feitiço, há **1 re-rolagem por rodada**.
4. **Feitiços (opcional):** os pontos de feitiço rolados pagam os feitiços aprendidos (§5).
5. **Confirmar:** o jogador usa os dados e a rodada é resolvida (§4.2).

- **Em aberto:** o texto original diz "você rola os dados e decide se vai usar ou re-rolar alguns". Este GDD interpreta que todo dado não re-rolado é usado. Se a ideia era poder **guardar** um dado sem usá-lo (ou com algum custo/benefício por não usar), isso precisa ser definido.
- **Em aberto:** se os pontos de feitiço que sobram passam para a rodada seguinte. Placeholder de MVP: sobras se perdem no fim da rodada.

### 4.2 Resolução — o jogador age primeiro

**Definido:** o jogador age primeiro. Se o monstro morre com os ataques do jogador, ele não ataca.

1. **Ataque do jogador:** soma os ataques das faces de Ataque (1, 2 ou 3 no Crítico). O monstro perde HP.
2. **Monstro morreu?** Se sim, fim da batalha com vitória.
3. **Ataque do monstro:** o monstro dá o número de ataques que anunciou.
   - Cada **Parry** anula 1 ataque e contra-ataca.
   - Cada **Esquiva** anula 1 ataque.
   - Cada ataque que não foi anulado causa o dano do monstro.
4. **Jogador morreu?** Se sim, a run acaba (§9).

- **Em aberto:** a ordem entre Parry e Esquiva e o que acontece se o contra-ataque matar o monstro no meio da sequência. Placeholder de MVP: os Parry são aplicados primeiro, e se o contra-ataque matar o monstro os ataques que faltavam não acertam.
- **Em aberto:** um Parry ou Esquiva que sobra (mais defesas do que ataques do monstro) não faz nada no placeholder. Falta decidir se deveria ter algum efeito.

### 4.3 Exemplo de rodada (com os placeholders)

- O monstro tem 6 de HP e anuncia **2 ataques** de 2 de dano cada.
- O jogador leva Ataque, Ataque, Defesa e Feitiço e rola: `2 Ataques`, `Miss`, `Esquiva`, `1 Feitiço`.
- Ele re-rola só o `Miss` e tira `Crítico`. A única re-rolagem da rodada foi gasta.
- 1 ponto de feitiço não paga nenhum feitiço que ele conhece, então ele confirma.
- Ataque: 2 + 3 = 5 ataques, 5 de dano. O monstro fica com 1 de HP.
- O monstro ataca 2 vezes, a Esquiva anula 1 e o jogador leva 1 golpe (2 de dano).

## 5. Feitiços

- **Definido:** os feitiços são **aprendidos nas bonfires** e lançados na batalha com os pontos do Dado de Feitiço.
- **Definido (exemplos do texto original, lista não fechada):**
  - **Poção:** recupera HP.
  - **Re-rolar:** dá re-rolagens extras.
  - **Fraqueza:** deixa o monstro mais fraco.
  - **Golpe Duplo:** dobra o número de ataques da rodada.
- **Em aberto:** a lista completa ("e etc..."), o nome final de cada feitiço, o custo em pontos, o preço para aprender, quais bonfires ensinam quais feitiços, e o efeito exato da Fraqueza.
- **Em aberto:** "poção" pode ser só o efeito de um feitiço ou um item consumível que o feitiço destrava. Placeholder de MVP: é o efeito do feitiço, sem inventário de poções.

| Feitiço (placeholder) | Custo (pontos) | Efeito placeholder | Preço para aprender |
|---|---|---|---|
| Poção | 2 | +3 de HP (sem passar do máximo) | 15 |
| Re-rolar | 1 | +1 re-rolagem nesta rodada | 10 |
| Fraqueza | 2 | o monstro leva +1 de dano por ataque até o fim da batalha | 20 |
| Golpe Duplo | 3 | ×2 ataques nesta rodada | 30 |

## 6. Monstros e Chefes

- **Definido:** a intenção do monstro (quantos ataques ele vai dar) aparece **antes** da rolagem.
- **Definido:** o MVP tem várias áreas, cada uma com um chefe (§8).
- **Em aberto:** como o monstro escolhe a intenção. Placeholder de MVP: cada monstro tem um padrão fixo que se repete (ex.: 1, 2, 1, 2...).
- **Em aberto:** a lista de monstros, os chefes, as mecânicas especiais de chefe e o bestiário por área.
- **Em aberto:** se os monstros se movem no mapa (patrulha, perseguição) ou ficam parados. Placeholder de MVP: parados.
- **Em aberto:** se dá para fugir de uma batalha. Placeholder de MVP: não dá.

## 7. Bonfire

**Definido:** numa bonfire o jogador pode:

- **Descansar:** recupera todo o HP e **faz os monstros comuns renascerem** no mapa, no estilo soulslike.
- **Aprender feitiços** (§5).
- **Forjar dados** (§3.3).
- **Escolher os dados da batalha:** placeholder de MVP para o ponto em aberto da §3.2.

- **Consequência de design:** como a bonfire é o único lugar de cura fora o feitiço Poção, o HP **não** se recupera sozinho entre batalhas. Descansar cura, mas traz os monstros de volta: mais risco no caminho e, ao mesmo tempo, mais moeda.
- **Definido:** a bonfire **não** é ponto de renascimento. Morrer reinicia a run (§9).
- **Em aberto:** se os chefes renascem ao descansar. Placeholder de MVP: não renascem.

## 8. Exploração e Mapa

- **Definido:** mapa topdown 2D **fixo, feito à mão**, igual em toda run. O jogador aprende o mapa como num soulslike, e a variação entre runs vem dos dados.
- **Definido:** o MVP tem **várias áreas, cada uma com um chefe**.
- **Definido:** encostar num monstro abre a cena de batalha.
- **Em aberto:** quantas áreas, o tema de cada uma, a posição das bonfires, e se existem atalhos ou portas que abrem com o progresso.
- **Em aberto:** se a passagem para a próxima área exige derrotar o chefe. Placeholder de MVP: exige.
- **Em aberto:** se monstros e itens têm alguma variação por run (posição, tipo). Placeholder de MVP: nenhuma variação.

## 9. Morte, Moeda e Progressão

- **Definido:** existe uma **moeda única**, ganha derrotando monstros. Ela paga a forja e o aprendizado de feitiços.
- **Em aberto:** o nome da moeda. Placeholder de MVP: "Almas".
- **Definido:** se o jogador morrer, **perde tudo** (dados, feitiços, moeda, progresso no mapa) e volta ao começo do jogo. O padrão é roguelike, sem a mecânica de recuperar as almas no local da morte que existe em Dark Souls.
- **Em aberto:** se existe qualquer progressão entre runs (desbloqueios permanentes, tipos novos de face na forja, etc.). Com a regra atual de "perde tudo", não existe.
- **Definido:** a run termina em vitória ao derrotar o chefe da última área.

## 10. Estilo Visual e Áudio

- **Definido:** pixel art.
- **Em aberto:** a resolução dos sprites, a paleta, o tema visual de cada área e a ferramenta de geração. O estúdio já usa PixelLab e SpriteCook em outros jogos, mas isso ainda não foi confirmado para este.
- **Em aberto:** a direção sonora inteira.

## 11. HUD, UI e Controles

- **Definido:** PC e Mobile no MVP.
- **Exploração:**
  - PC: WASD ou setas. Mobile: joystick virtual.
  - A ação de interagir com a bonfire está **Em aberto**. Placeholder de MVP: o menu abre ao encostar na bonfire.
- **Batalha:** tudo por clique ou toque. Tocar num dado marca ou desmarca o dado para re-rolar; os botões **Re-rolar** e **Confirmar** ficam na tela, e os feitiços aparecem como botões.
- **HUD de batalha (placeholder de MVP):** nome, HP e intenção do monstro; HP do jogador, pontos de feitiço e re-rolagens restantes; a fileira de dados; a fileira de feitiços; um texto com o resultado da última rodada.
- **Em aberto:** o HUD da exploração (HP e moeda sempre visíveis?), a animação de rolagem dos dados e o layout final das telas.

## 12. Backend / Persistência

- **Definido:** **tudo offline**, sem Firebase, leaderboard ou multiplayer.
- **Definido:** existe um save local da **run em andamento**, para continuar depois de fechar o jogo.
- **Em aberto:** quando o save é gravado. Placeholder de MVP: ao entrar em batalha, ao vencer uma batalha, em cada ação da bonfire e quando o app é pausado ou fechado. O save é apagado ao morrer.
- **Em aberto (risco):** fechar o jogo no meio de uma batalha que está sendo perdida. No placeholder o jogador volta encostado no mesmo monstro e a batalha recomeça na hora, mas com o HP de antes da batalha e com dados novos. Falta decidir se isso é aceitável.

## 13. Escopo do MVP

**Definido (entra no MVP):**

- Exploração topdown 2D em mapa fixo, com várias áreas e um chefe por área.
- Batalha com os três tipos de dado, mão de até 5 dados, 1 re-rolagem por rodada e intenção do monstro visível.
- Forja com faces customizáveis.
- Feitiços aprendidos nas bonfires.
- Bonfire com descanso (cura e monstros renascem), forja e feitiços.
- Morte permanente com perda total.
- Save local da run em andamento.
- PC e Mobile.

**Valores de partida (placeholders de MVP, só para o protótipo rodar):**

| Parâmetro | Placeholder |
|---|---|
| HP máximo do jogador | 10 |
| Dano por ataque do jogador | 1 |
| Dano do contra-ataque do Parry | 1 |
| Re-rolagens por rodada | 1 |
| Limite de dados na batalha | 5 |
| Dados iniciais | 2 Ataque + 1 Defesa (padrão) |
| Moeda inicial | 0 |
| Monstro comum A ("Esqueleto") | 4 HP, 1 de dano, intenção 1, 2, 1, 2..., 10 de moeda |
| Monstro comum B ("Cão Sombrio") | 6 HP, 2 de dano, intenção 1, 1, 2..., 15 de moeda |
| Chefe ("Cavaleiro Caído") | 15 HP, 2 de dano, intenção 2, 3, 1, 3..., 50 de moeda |

**Fica para depois / Em aberto:** número de áreas, lista completa de feitiços e monstros, mecânicas de chefe, progressão entre runs, áudio, animações de rolagem.

## 14. Em aberto (consolidado)

- Pilar de design e fantasia central (§1).
- Referências oficiais (§1).
- Dano por ataque, dano do Parry e chance de cada face (§3.1).
- Onde montar a mão de 5 dados, dados iniciais e mão mínima (§3.2).
- Regras da forja: número de faces, mistura de tipos, preço, reforja ou venda (§3.3).
- "Usar ou re-rolar": dá para guardar um dado sem usar? (§4.1)
- Pontos de feitiço passam para a próxima rodada? (§4.1)
- Ordem entre Parry e Esquiva e o que fazer com defesa que sobra (§4.2).
- Lista, custos, preços e efeitos exatos dos feitiços; poção como efeito ou item (§5).
- Como o monstro escolhe a intenção, bestiário, chefes, monstros no mapa, fuga (§6).
- Chefes renascem ao descansar? (§7)
- Número e tema das áreas, posição das bonfires, portas do chefe, variação por run (§8).
- Nome da moeda e progressão entre runs (§9).
- Arte (resolução, paleta, ferramenta) e áudio (§10).
- Interação com a bonfire, HUD da exploração, animações (§11).
- Momento do save e o risco de fechar o jogo no meio da batalha (§12).

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para implementar o MVP do Craft Dice em Unity 6. Os números vêm da tabela de placeholders da Parte 1 §13 e ficam em um asset (`GameConfig`), para dar para balancear sem mexer no código.

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele.
- **Namespaces:**
  - `CraftDice.Data`: tipos, ScriptableObjects e regras de face e forja.
  - `CraftDice.Combat`: regras da batalha em C# puro, sem `MonoBehaviour`.
  - `CraftDice.Meta`: estado da run, save e troca de cenas.
  - `CraftDice.Battle`: a cena de batalha (UI).
  - `CraftDice.World`: a exploração (jogador, monstros, bonfire, portais).
  - `CraftDice.UI`: componentes de UI reaproveitados por várias cenas.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Textos na tela sem emoji**, porque a fonte padrão do TextMeshPro não tem emojis.

## Arquitetura em uma página

```
 Cena Area1 (mapa)            RunManager (sobrevive à troca de cena)          Cena Battle
 ─────────────────            ─────────────────────────────────────          ───────────
 PlayerMovement  ──contato──▶ EnterBattle(monstro) ──LoadScene──────────────▶ BattleController
 MapMonster                   RunState: HP, moeda, dados, mão,                  └ BattleEngine (C# puro)
 Bonfire ─▶ BonfireMenu ────▶ feitiços, monstros mortos, posição  ◀──────────── OnBattleWon / OnPlayerDied
 AreaPortal                   SaveSystem (JSON local)
```

- **Regra de ouro:** as regras do jogo (rolar, re-rolar, resolver, lançar feitiço) ficam em `BattleEngine`, em C# puro. A cena só mostra o estado e repassa os cliques. Isso deixa as regras fáceis de testar e de mudar quando os pontos **Em aberto** forem decididos.

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, organizado e com os pacotes certos, rodando no Play Mode.

### 0.1 Criar o projeto

1. Instale o **Unity Hub** e uma versão **Unity 6 LTS** (6000.x). Marque os módulos **Windows/Mac Build Support**, **Android Build Support** e, se tiver um Mac, **iOS Build Support**: o MVP é PC e Mobile (Parte 1 §1).
2. No Hub: **New project → Universal 2D**. Use o nome `CraftDice`.
   - A dimensão 2D definida na Parte 1 vira decisão técnica aqui: o template 2D já vem com URP 2D, física 2D (`Rigidbody2D`, `Collider2D`) e câmera ortográfica.

### 0.2 Estrutura de pastas

Crie dentro de `Assets/`:

```
Assets/_Project/
  Scripts/
    Data/      (tipos, ScriptableObjects)
    Combat/    (regras da batalha em C# puro)
    Meta/      (RunManager, SaveSystem, menus de cena)
    Battle/    (UI da batalha)
    World/     (jogador, monstros, bonfire, portais)
    UI/        (componentes de UI comuns)
  Resources/   (só o GameConfig — ver Fase 1)
  ScriptableObjects/
    Monsters/
    Spells/
  Prefabs/
  Scenes/      (MainMenu, Area1, Battle, RunEnd)
  Sprites/
  Tiles/
```

### 0.3 Pacotes (Window → Package Manager)

| Pacote | Para quê |
|---|---|
| **Input System** (já vem no Unity 6) | Mesmo código de movimento para teclado, gamepad e joystick virtual no mobile. |
| **2D Tilemap Editor** (vem com o template 2D) | Desenhar o mapa fixo feito à mão (Parte 1 §8). |
| **2D Pixel Perfect** (vem com o template 2D) | Pixel art nítida, sem borrar (Parte 1 §10). |
| **Cinemachine** (3.x) | Câmera que segue o jogador no mapa. |
| **TextMeshPro** | Textos da UI. No primeiro uso, aceite **Import TMP Essentials**. |

### 0.4 Cenas

1. Crie as cenas `MainMenu`, `Area1`, `Battle` e `RunEnd` em `Assets/_Project/Scenes/`.
2. **File → Build Profiles → Scene List**: adicione as quatro, com `MainMenu` em primeiro.

### 0.5 Ajustes de importação de pixel art

1. Selecione a pasta `Sprites` e, para cada sprite importado: **Filter Mode = Point (no filter)**, **Compression = None** e **Pixels Per Unit** igual ao tamanho do tile (ex.: 16).
2. Em **Edit → Project Settings → Player → Other Settings → Active Input Handling**, deixe **Input System Package (New)** ou **Both**.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- As quatro cenas aparecem na Scene List do Build Profile.
- Apertar Play numa cena vazia não gera erro.

#### Problemas comuns
- **Sprite borrado:** o Filter Mode ficou em Bilinear. Troque para **Point (no filter)**.
- **`InputSystem` não encontrado nos scripts:** o pacote Input System não está instalado ou o Active Input Handling está em "Input Manager (Old)".

Próxima fase: **Tipos e Definições**, com os dados, faces, monstros e feitiços como tipos de C# e assets.

---

# Parte 4 — Implementação Unity: Fase 1 (Tipos e Definições)

## Fase 1 — Tipos e Definições

> Objetivo desta fase: os três tipos de dado e suas faces (Parte 1 §3), monstros (§6), feitiços (§5) e o asset `GameConfig` com os placeholders da §13 existindo como código e assets editáveis no Inspector.

### 1.1 Tipos de dado e de face

```csharp
// Caminho: Assets/_Project/Scripts/Data/DiceTypes.cs
namespace CraftDice.Data
{
    // POR QUE: os três tipos de dado da Parte 1 §3.1. O tipo decide a cor do
    // dado na tela e quais faces a forja oferece para ele.
    public enum DieType
    {
        Attack,
        Defense,
        Spell,
    }

    // POR QUE: o que uma face faz na resolução da rodada (Parte 1 §4.2).
    // ESTRATÉGIA: o "tipo" da face e o "número" dela ficam separados (ver
    // DieFace.value). Assim "1 Ataque" e "2 Ataques" são a mesma regra com
    // números diferentes, e a forja pode criar combinações novas sem código novo.
    public enum FaceKind
    {
        Attack,   // value = número de ataques (1 ou 2)
        Critical, // value = 3 ataques (Parte 1 §3.1)
        Miss,     // não faz nada
        Parry,    // anula 1 ataque do monstro e contra-ataca
        Dodge,    // Esquiva: anula 1 ataque do monstro
        Spell,    // value = pontos de feitiço (0, 1 ou 2)
    }
}
```

### 1.2 `DieFace` e `DieData`

```csharp
// Caminho: Assets/_Project/Scripts/Data/DieFace.cs
using System;

namespace CraftDice.Data
{
    // POR QUE: uma face de dado, ex.: "2 Ataques" ou "Parry".
    // ESTRATÉGIA: é um struct [Serializable] para três coisas ao mesmo tempo:
    // aparecer no Inspector, ser salvo em JSON pelo SaveSystem (Fase 3) e ser
    // copiado por valor (mudar a face de um dado forjado não muda outro dado).
    // [Serializable] = "o Unity pode guardar e mostrar este tipo".
    [Serializable]
    public struct DieFace
    {
        public FaceKind kind;
        public int value;

        // Atalho para criar uma face numa linha só.
        public DieFace(FaceKind kind, int value)
        {
            this.kind = kind;
            this.value = value;
        }

        // Texto que aparece no dado na tela (sem emoji — ver Convenções).
        public string Label
        {
            get
            {
                switch (kind)
                {
                    case FaceKind.Attack: return value == 1 ? "1 ATAQUE" : value + " ATAQUES";
                    case FaceKind.Critical: return "CRITICO";
                    case FaceKind.Miss: return "MISS";
                    case FaceKind.Parry: return "PARRY";
                    case FaceKind.Dodge: return "ESQUIVA";
                    case FaceKind.Spell: return value == 1 ? "1 FEITICO" : value + " FEITICOS";
                    default: return "?";
                }
            }
        }

        // Compara tipo e número. Usado pela forja para achar a face atual na lista.
        public bool SameAs(DieFace other)
        {
            return kind == other.kind && value == other.value;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/FaceCatalog.cs
using System.Collections.Generic;

namespace CraftDice.Data
{
    // POR QUE: um lugar só com as faces que existem para cada tipo de dado
    // (Parte 1 §3.1) e o "valor de forja" de cada face (placeholder da §3.3).
    // ESTRATÉGIA: o dado padrão de cada tipo é exatamente a lista de faces do
    // tipo, cada uma uma vez. A forja (Fase 6) troca faces dentro dessa lista.
    public static class FaceCatalog
    {
        private static readonly DieFace[] AttackPool =
        {
            new DieFace(FaceKind.Attack, 1),
            new DieFace(FaceKind.Attack, 2),
            new DieFace(FaceKind.Miss, 0),
            new DieFace(FaceKind.Critical, 3),
        };

        private static readonly DieFace[] DefensePool =
        {
            new DieFace(FaceKind.Parry, 0),
            new DieFace(FaceKind.Dodge, 0),
            new DieFace(FaceKind.Miss, 0),
        };

        private static readonly DieFace[] SpellPool =
        {
            new DieFace(FaceKind.Spell, 0),
            new DieFace(FaceKind.Spell, 1),
            new DieFace(FaceKind.Spell, 2),
        };

        // Todas as faces possíveis para um tipo de dado.
        public static DieFace[] PoolFor(DieType type)
        {
            switch (type)
            {
                case DieType.Attack: return AttackPool;
                case DieType.Defense: return DefensePool;
                default: return SpellPool;
            }
        }

        // As faces do dado padrão: uma de cada (Parte 1 §3.1).
        public static List<DieFace> DefaultFaces(DieType type)
        {
            return new List<DieFace>(PoolFor(type));
        }

        // Placeholder da Parte 1 §3.3: quanto uma face "pesa" no preço da forja.
        public static int ForgeValue(DieFace face)
        {
            switch (face.kind)
            {
                case FaceKind.Miss: return 0;
                case FaceKind.Dodge: return 1;
                case FaceKind.Parry: return 2;
                default: return face.value; // Ataque 1/2, Crítico 3, Feitiço 0/1/2
            }
        }

        // Preço de forjar um dado: base + soma dos valores × multiplicador.
        public static int ForgePrice(DieData die, GameConfig config)
        {
            int sum = 0;
            foreach (DieFace face in die.faces)
            {
                sum += ForgeValue(face);
            }
            return config.forgeBasePrice + sum * config.forgePricePerFaceValue;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/DieData.cs
using System;
using System.Collections.Generic;

namespace CraftDice.Data
{
    // POR QUE: um dado que o jogador possui, padrão ou forjado (Parte 1 §3).
    // ESTRATÉGIA: é uma classe comum [Serializable], e não um ScriptableObject,
    // porque dados forjados nascem durante o jogo e precisam ir para o save em
    // JSON. Um ScriptableObject é um asset do projeto e não é criado em jogo.
    [Serializable]
    public class DieData
    {
        public DieType type;
        public List<DieFace> faces = new List<DieFace>();

        // Cria um dado padrão do tipo pedido (ex.: os dados iniciais da run).
        public static DieData CreateDefault(DieType type)
        {
            return new DieData { type = type, faces = FaceCatalog.DefaultFaces(type) };
        }

        // Rola o dado: cada face tem a mesma chance (placeholder da Parte 1 §3.1).
        // System.Random (e não UnityEngine.Random) permite usar uma "semente"
        // fixa nos testes e ter sempre o mesmo resultado.
        public DieFace Roll(Random rng)
        {
            return faces[rng.Next(faces.Count)];
        }

        // Cópia independente: a forja edita um rascunho e entrega uma cópia,
        // para o dado salvo não mudar se o rascunho continuar sendo editado.
        public DieData Clone()
        {
            return new DieData { type = type, faces = new List<DieFace>(faces) };
        }

        // Texto curto para listas, ex.: "ATAQUE: 1 ATAQUE / 2 ATAQUES / MISS / CRITICO".
        public string Describe()
        {
            string[] labels = new string[faces.Count];
            for (int i = 0; i < faces.Count; i++)
            {
                labels[i] = faces[i].Label;
            }
            return TypeName(type) + ": " + string.Join(" / ", labels);
        }

        // Nome do tipo em português, para a UI.
        public static string TypeName(DieType type)
        {
            switch (type)
            {
                case DieType.Attack: return "ATAQUE";
                case DieType.Defense: return "DEFESA";
                default: return "FEITICO";
            }
        }
    }
}
```

### 1.3 Monstros e feitiços (ScriptableObjects)

> **ScriptableObject** é um "arquivo de dados" do Unity: um asset no projeto que você cria pelo menu e edita no Inspector, sem estar numa cena. É o jeito padrão de guardar a ficha de cada monstro e de cada feitiço.

```csharp
// Caminho: Assets/_Project/Scripts/Data/MonsterDefinition.cs
using UnityEngine;

namespace CraftDice.Data
{
    // POR QUE: a ficha de um monstro (Parte 1 §6): HP, dano, intenção e recompensa.
    // ESTRATÉGIA: a intenção é um padrão que se repete (placeholder da §6).
    // Quando a regra real for decidida, só IntentForRound muda.
    // [CreateAssetMenu] adiciona a opção no menu Create do Project.
    [CreateAssetMenu(menuName = "CraftDice/Monster", fileName = "Monster_")]
    public class MonsterDefinition : ScriptableObject
    {
        public string displayName = "Monstro";
        public Sprite sprite;
        public int maxHp = 4;
        public int damagePerHit = 1;
        [Tooltip("Ataques por rodada, em ciclo. Ex.: 1,2 = 1, 2, 1, 2...")]
        public int[] intentPattern = { 1, 2 };
        public int currencyReward = 10;
        [Tooltip("Chefe: não renasce ao descansar na bonfire (placeholder da Parte 1 §7).")]
        public bool isBoss;
        [Tooltip("Derrotar este chefe vence a run (Parte 1 §9).")]
        public bool isFinalBoss;

        // Quantos ataques o monstro anuncia na rodada (0 = primeira rodada).
        public int IntentForRound(int roundIndex)
        {
            if (intentPattern == null || intentPattern.Length == 0)
            {
                return 1;
            }
            return intentPattern[roundIndex % intentPattern.Length];
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/SpellDefinition.cs
using UnityEngine;

namespace CraftDice.Data
{
    // POR QUE: os efeitos de feitiço citados na Parte 1 §5. A lista ainda não
    // está fechada, e cada efeito novo entra aqui e em BattleEngine.CastSpell.
    public enum SpellEffect
    {
        Heal,          // Poção: +amount de HP
        Reroll,        // +amount re-rolagens nesta rodada
        Weakness,      // monstro leva +amount de dano por ataque até o fim da batalha
        DoubleAttacks, // ×2 ataques nesta rodada
    }

    // POR QUE: a ficha de um feitiço: custo em pontos, efeito e preço na bonfire.
    // ESTRATÉGIA: o "id" é o que vai para o save (Fase 3). O nome pode mudar à
    // vontade sem quebrar saves antigos, mas o id não deve mudar.
    [CreateAssetMenu(menuName = "CraftDice/Spell", fileName = "Spell_")]
    public class SpellDefinition : ScriptableObject
    {
        public string id = "spell_id";
        public string displayName = "Feitiço";
        [TextArea] public string description;
        public SpellEffect effect;
        [Tooltip("Pontos de feitiço gastos para lançar.")]
        public int cost = 1;
        [Tooltip("Força do efeito (HP curado, re-rolagens, dano extra). Ignorado em DoubleAttacks.")]
        public int amount = 1;
        [Tooltip("Preço em moeda para aprender na bonfire.")]
        public int learnPrice = 10;
    }
}
```

### 1.4 `GameConfig`

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameConfig.cs
using System.Collections.Generic;
using UnityEngine;

namespace CraftDice.Data
{
    // POR QUE: todos os placeholders da Parte 1 §13 num asset só, para
    // balancear sem recompilar.
    // ESTRATÉGIA: o asset fica em uma pasta "Resources" e é carregado pelo
    // nome (Resources.Load). Assim o RunManager (Fase 3) o encontra sozinho,
    // em qualquer cena, sem ninguém arrastar referência no Inspector.
    [CreateAssetMenu(menuName = "CraftDice/Game Config", fileName = "GameConfig")]
    public class GameConfig : ScriptableObject
    {
        [Header("Jogador")]
        public int playerMaxHp = 10;
        public int startingCurrency = 0;
        public DieType[] startingDice = { DieType.Attack, DieType.Attack, DieType.Defense };

        [Header("Batalha")]
        public int loadoutLimit = 5;
        public int rerollsPerRound = 1;
        public int playerDamagePerHit = 1;
        public int parryCounterDamage = 1;

        [Header("Forja (Parte 1 §3.3)")]
        public int forgeBasePrice = 5;
        public int forgePricePerFaceValue = 3;

        [Header("Feitiços que existem no jogo (para achar pelo id no save)")]
        public List<SpellDefinition> allSpells = new List<SpellDefinition>();

        [Header("Cenas")]
        public string mainMenuScene = "MainMenu";
        public string firstAreaScene = "Area1";
        public string battleScene = "Battle";
        public string runEndScene = "RunEnd";

        // Procura um feitiço pelo id (o save guarda só ids).
        public SpellDefinition FindSpell(string id)
        {
            foreach (SpellDefinition spell in allSpells)
            {
                if (spell != null && spell.id == id)
                {
                    return spell;
                }
            }
            return null;
        }
    }
}
```

### 1.5 Criar os assets

1. Em `Assets/_Project/Resources/`: **Create → CraftDice → Game Config**. O nome precisa ser exatamente `GameConfig`.
2. Em `ScriptableObjects/Monsters/`, crie três monstros com os placeholders da Parte 1 §13:
   - `Monster_Skeleton`: HP 4, dano 1, intenção `1, 2`, moeda 10.
   - `Monster_ShadowHound`: HP 6, dano 2, intenção `1, 1, 2`, moeda 15.
   - `Monster_FallenKnight`: HP 15, dano 2, intenção `2, 3, 1, 3`, moeda 50, **Is Boss** e **Is Final Boss** marcados (o MVP do guia tem uma área só; com mais áreas, só o último chefe recebe Is Final Boss).
3. Em `ScriptableObjects/Spells/`, crie os quatro feitiços da tabela da Parte 1 §5 (ids `potion`, `reroll`, `weakness`, `double_attacks`).
4. Arraste os quatro feitiços para a lista **All Spells** do `GameConfig`.

### ✅ Checkpoint da Fase 1
- O Console não mostra erros de compilação.
- O menu **Create → CraftDice** tem Monster, Spell e Game Config.
- `GameConfig` está em `Assets/_Project/Resources/GameConfig.asset` e lista os quatro feitiços.

#### Problemas comuns
- **`Random` é ambíguo:** um arquivo com `using System;` e `using UnityEngine;` ao mesmo tempo não sabe qual `Random` usar. Escreva `System.Random` por extenso.

Próxima fase: **Regras da Batalha**, com a rodada da Parte 1 §4 em C# puro e testada sem nenhuma UI.

---

# Parte 5 — Implementação Unity: Fase 2 (Regras da Batalha)

## Fase 2 — Regras da Batalha

> Objetivo desta fase: a rodada completa da Parte 1 §4 (intenção, rolagem, re-rolagem, feitiços e resolução com o jogador agindo primeiro) funcionando em C# puro e verificada por um teste que imprime uma batalha inteira no Console.

### 2.1 Estado e relatório da batalha

```csharp
// Caminho: Assets/_Project/Scripts/Combat/BattleState.cs
using System.Collections.Generic;
using CraftDice.Data;

namespace CraftDice.Combat
{
    // POR QUE: um dado da mão depois de rolado: qual dado é, qual face caiu e
    // se o jogador marcou para re-rolar (Parte 1 §4.1, passo 3).
    public class RolledDie
    {
        public DieData die;
        public DieFace face;
        public bool markedForReroll;
    }

    // POR QUE: o que aconteceu ao confirmar uma rodada, para a UI contar ao jogador.
    public class RoundReport
    {
        public int hitsDealt;
        public int damageDealt;
        public int parries;
        public int dodges;
        public int counterDamage;
        public int hitsTaken;
        public int damageTaken;
        public bool monsterDied;
        public bool playerDied;
    }

    // POR QUE: tudo o que muda durante uma batalha, num objeto só.
    // ESTRATÉGIA: só guarda números. Quem muda esses números é o BattleEngine,
    // e a UI só lê. O HP do jogador é uma cópia, devolvida à run no fim (Fase 3).
    public class BattleState
    {
        public MonsterDefinition monster;
        public int monsterHp;
        public int playerHp;
        public int playerMaxHp;
        public int round;             // começa em 0
        public int currentIntent;     // ataques que o monstro anunciou
        public readonly List<RolledDie> hand = new List<RolledDie>();
        public int rerollsLeft;
        public int spellPointsSpent;
        public int attackMultiplier = 1; // Golpe Duplo (vale só na rodada)
        public int weaknessBonus;        // Fraqueza (vale até o fim da batalha)

        public bool IsOver => monsterHp <= 0 || playerHp <= 0;

        // Soma das faces de Feitiço que estão na mesa agora.
        public int SpellPointsRolled
        {
            get
            {
                int total = 0;
                foreach (RolledDie rolled in hand)
                {
                    if (rolled.face.kind == FaceKind.Spell)
                    {
                        total += rolled.face.value;
                    }
                }
                return total;
            }
        }

        public int SpellPointsAvailable => SpellPointsRolled - spellPointsSpent;
    }
}
```

### 2.2 `BattleEngine`

```csharp
// Caminho: Assets/_Project/Scripts/Combat/BattleEngine.cs
using System;
using System.Collections.Generic;
using CraftDice.Data;

namespace CraftDice.Combat
{
    // POR QUE: as regras da rodada (Parte 1 §4) e dos feitiços (§5) num lugar
    // só, sem depender de cena, botão ou sprite.
    // ESTRATÉGIA: a UI chama, nesta ordem: StartRound → (ToggleReroll/Reroll/
    // CastSpell quantas vezes quiser) → Resolve → StartRound... Cada ponto
    // "Em aberto" da Parte 1 que afeta a regra está comentado no método onde ele mora.
    public class BattleEngine
    {
        private readonly GameConfig _config;
        private readonly Random _rng;

        public BattleState State { get; }

        // Monta a batalha com a mão de dados e o HP atual do jogador.
        public BattleEngine(GameConfig config, MonsterDefinition monster, List<DieData> loadout,
                            int playerHp, int playerMaxHp, Random rng)
        {
            _config = config;
            _rng = rng;
            State = new BattleState
            {
                monster = monster,
                monsterHp = monster.maxHp,
                playerHp = playerHp,
                playerMaxHp = playerMaxHp,
            };
            foreach (DieData die in loadout)
            {
                State.hand.Add(new RolledDie { die = die });
            }
        }

        // Passos 1 e 2 da Parte 1 §4.1: anuncia a intenção e rola todos os dados.
        public void StartRound()
        {
            BattleState s = State;
            s.currentIntent = s.monster.IntentForRound(s.round);
            s.rerollsLeft = _config.rerollsPerRound;
            s.spellPointsSpent = 0;   // placeholder §4.1: sobras não passam de rodada
            s.attackMultiplier = 1;
            foreach (RolledDie rolled in s.hand)
            {
                rolled.face = rolled.die.Roll(_rng);
                rolled.markedForReroll = false;
            }
        }

        // Pode marcar este dado para re-rolar? Não, se acabaram as re-rolagens,
        // nem se for um dado de Feitiço cujos pontos já foram gastos (re-rolar
        // apagaria pontos que já pagaram um feitiço).
        public bool CanToggleReroll(int index)
        {
            if (State.IsOver || State.rerollsLeft <= 0)
            {
                return false;
            }
            RolledDie rolled = State.hand[index];
            return !(rolled.face.kind == FaceKind.Spell && State.spellPointsSpent > 0);
        }

        // Marca/desmarca um dado para re-rolar (passo 3 da §4.1).
        public void ToggleReroll(int index)
        {
            if (CanToggleReroll(index))
            {
                State.hand[index].markedForReroll = !State.hand[index].markedForReroll;
            }
        }

        // Re-rola os dados marcados e gasta 1 re-rolagem. Devolve false se não
        // havia re-rolagem ou nenhum dado marcado.
        public bool Reroll()
        {
            if (State.IsOver || State.rerollsLeft <= 0)
            {
                return false;
            }
            bool any = false;
            foreach (RolledDie rolled in State.hand)
            {
                if (rolled.markedForReroll)
                {
                    rolled.face = rolled.die.Roll(_rng);
                    rolled.markedForReroll = false;
                    any = true;
                }
            }
            if (any)
            {
                State.rerollsLeft--;
            }
            return any;
        }

        // Dá para lançar este feitiço agora? (pontos suficientes e efeito útil)
        public bool CanCast(SpellDefinition spell)
        {
            if (State.IsOver || spell.cost > State.SpellPointsAvailable)
            {
                return false;
            }
            if (spell.effect == SpellEffect.Heal && State.playerHp >= State.playerMaxHp)
            {
                return false; // não gasta pontos com HP cheio
            }
            return true;
        }

        // Lança o feitiço (passo 4 da §4.1). Os efeitos são placeholders da Parte 1 §5.
        public bool CastSpell(SpellDefinition spell)
        {
            if (!CanCast(spell))
            {
                return false;
            }
            BattleState s = State;
            switch (spell.effect)
            {
                case SpellEffect.Heal:
                    s.playerHp = Math.Min(s.playerMaxHp, s.playerHp + spell.amount);
                    break;
                case SpellEffect.Reroll:
                    s.rerollsLeft += spell.amount;
                    break;
                case SpellEffect.Weakness:
                    s.weaknessBonus += spell.amount;
                    break;
                case SpellEffect.DoubleAttacks:
                    s.attackMultiplier *= 2;
                    break;
            }
            s.spellPointsSpent += spell.cost;
            // Os dados de Feitiço pagaram o feitiço: tira a marca de re-rolar deles.
            foreach (RolledDie rolled in s.hand)
            {
                if (rolled.face.kind == FaceKind.Spell)
                {
                    rolled.markedForReroll = false;
                }
            }
            return true;
        }

        // Passo 5: usa todos os dados e resolve a rodada (Parte 1 §4.2).
        // O jogador age primeiro: se o monstro morrer aqui, ele não ataca.
        public RoundReport Resolve()
        {
            BattleState s = State;
            RoundReport report = new RoundReport();

            int hits = 0;
            int parries = 0;
            int dodges = 0;
            foreach (RolledDie rolled in s.hand)
            {
                switch (rolled.face.kind)
                {
                    case FaceKind.Attack:
                    case FaceKind.Critical:
                        hits += rolled.face.value;
                        break;
                    case FaceKind.Parry:
                        parries++;
                        break;
                    case FaceKind.Dodge:
                        dodges++;
                        break;
                }
            }

            // 1. Ataque do jogador.
            report.hitsDealt = hits * s.attackMultiplier;
            report.damageDealt = report.hitsDealt * (_config.playerDamagePerHit + s.weaknessBonus);
            s.monsterHp = Math.Max(0, s.monsterHp - report.damageDealt);
            if (s.monsterHp == 0)
            {
                report.monsterDied = true;
                s.round++;
                return report;
            }

            // 2. Ataque do monstro. Placeholder §4.2: Parry antes de Esquiva,
            // e defesas que sobram não fazem nada.
            int incoming = s.currentIntent;

            report.parries = Math.Min(parries, incoming);
            incoming -= report.parries;
            report.counterDamage = report.parries * _config.parryCounterDamage;
            s.monsterHp = Math.Max(0, s.monsterHp - report.counterDamage);
            if (s.monsterHp == 0)
            {
                // O contra-ataque matou: os ataques restantes não acertam.
                report.monsterDied = true;
                s.round++;
                return report;
            }

            report.dodges = Math.Min(dodges, incoming);
            incoming -= report.dodges;

            report.hitsTaken = incoming;
            report.damageTaken = incoming * s.monster.damagePerHit;
            s.playerHp = Math.Max(0, s.playerHp - report.damageTaken);
            report.playerDied = s.playerHp == 0;

            s.round++;
            return report;
        }
    }
}
```

### 2.3 🧪 Teste rápido: uma batalha no Console

```csharp
// Caminho: Assets/_Project/Scripts/Combat/BattleSmokeTest.cs
using System.Collections.Generic;
using UnityEngine;
using CraftDice.Data;

namespace CraftDice.Combat
{
    // POR QUE: conferir as regras da Fase 2 antes de existir qualquer UI.
    // ESTRATÉGIA: joga uma batalha sozinho, sem re-rolar nem lançar feitiço,
    // e imprime cada rodada. Com a mesma semente o resultado é sempre igual,
    // então dá para refazer a conta na mão. Pode apagar o script depois.
    // MonoBehaviour = script que vive num GameObject da cena; Start() roda
    // uma vez quando a cena começa.
    public class BattleSmokeTest : MonoBehaviour
    {
        [SerializeField] private MonsterDefinition _monster;
        [SerializeField] private int _seed = 42;

        // Roda a batalha inteira no primeiro frame.
        private void Start()
        {
            GameConfig config = Resources.Load<GameConfig>("GameConfig");
            List<DieData> loadout = new List<DieData>();
            foreach (DieType type in config.startingDice)
            {
                loadout.Add(DieData.CreateDefault(type));
            }

            BattleEngine engine = new BattleEngine(config, _monster, loadout,
                config.playerMaxHp, config.playerMaxHp, new System.Random(_seed));

            for (int i = 0; i < 50 && !engine.State.IsOver; i++)
            {
                engine.StartRound();
                string faces = "";
                foreach (RolledDie rolled in engine.State.hand)
                {
                    faces += "[" + rolled.face.Label + "] ";
                }
                int intent = engine.State.currentIntent;
                RoundReport r = engine.Resolve();
                Debug.Log($"Rodada {i + 1}: monstro anuncia {intent} | {faces}| " +
                          $"dano causado {r.damageDealt}, parry {r.parries}, esquiva {r.dodges}, " +
                          $"dano levado {r.damageTaken} | HP jogador {engine.State.playerHp}, " +
                          $"HP monstro {engine.State.monsterHp}");
            }
            Debug.Log(engine.State.monsterHp == 0 ? "VITORIA" : "DERROTA");
        }
    }
}
```

1. Numa cena qualquer, crie um GameObject vazio `SmokeTest` e adicione `BattleSmokeTest`.
2. Arraste `Monster_ShadowHound` para o campo **Monster** e aperte Play.

### ✅ Checkpoint da Fase 2
- O Console mostra uma linha por rodada e termina em `VITORIA` ou `DERROTA`.
- Refaça uma rodada na mão: o dano causado bate com a soma das faces de ataque (Crítico vale 3), e o dano levado é igual a (intenção − Parry − Esquiva) × dano do monstro.
- Numa rodada em que o monstro morre pelo ataque, o dano levado é 0, porque o jogador age primeiro.
- Trocar o **Seed** muda a batalha; repetir o mesmo seed repete a batalha.

#### Problemas comuns
- **`NullReferenceException` em `config.startingDice`:** o `GameConfig` não está em uma pasta chamada `Resources` ou não se chama exatamente `GameConfig`.

Próxima fase: **Estado da Run e Save**, com HP, moeda e dados guardados entre cenas e no disco.

---

# Parte 6 — Implementação Unity: Fase 3 (Estado da Run e Save)

## Fase 3 — Estado da Run e Save

> Objetivo desta fase: um `RunManager` que existe em qualquer cena, guarda tudo da run (Parte 1 §9), sabe entrar e sair da batalha, e grava a run em andamento no disco (§12).

### 3.1 `RunState`

```csharp
// Caminho: Assets/_Project/Scripts/Meta/RunState.cs
using System;
using System.Collections.Generic;
using CraftDice.Data;

namespace CraftDice.Meta
{
    // POR QUE: tudo o que o jogador perde ao morrer (Parte 1 §9) e tudo o que
    // precisa voltar ao continuar a run (§12).
    // ESTRATÉGIA: só tipos que o JsonUtility do Unity sabe salvar: números,
    // strings, List e classes/structs [Serializable]. Por isso os conjuntos
    // são List, e não HashSet: o JsonUtility ignora HashSet e Dictionary.
    [Serializable]
    public class RunState
    {
        public int hp;
        public int maxHp;
        public int currency;

        public List<DieData> dice = new List<DieData>();  // a bolsa inteira
        public List<int> loadout = new List<int>();       // índices em "dice" (máx. 5)
        public List<string> learnedSpellIds = new List<string>();

        public List<string> defeatedMonsterIds = new List<string>(); // renascem ao descansar
        public List<string> defeatedBossIds = new List<string>();    // não renascem

        public string currentScene;
        public bool hasPosition;
        public float posX;
        public float posY;
    }
}
```

### 3.2 `SaveSystem`

```csharp
// Caminho: Assets/_Project/Scripts/Meta/SaveSystem.cs
using System;
using System.IO;
using UnityEngine;

namespace CraftDice.Meta
{
    // POR QUE: o save local da run em andamento (Parte 1 §12). É offline e
    // tem um arquivo só.
    // ESTRATÉGIA: JSON em Application.persistentDataPath, uma pasta que o Unity
    // garante que pode ser gravada em PC, Android e iOS.
    public static class SaveSystem
    {
        private static string FilePath => Path.Combine(Application.persistentDataPath, "run.json");

        public static bool HasSave => File.Exists(FilePath);

        // Grava a run inteira por cima do save anterior.
        public static void Save(RunState state)
        {
            File.WriteAllText(FilePath, JsonUtility.ToJson(state));
        }

        // Lê a run salva. Devolve null se não houver save ou se o arquivo estiver corrompido.
        public static RunState Load()
        {
            if (!HasSave)
            {
                return null;
            }
            try
            {
                return JsonUtility.FromJson<RunState>(File.ReadAllText(FilePath));
            }
            catch (Exception e)
            {
                Debug.LogWarning("Save corrompido, começando run nova: " + e.Message);
                return null;
            }
        }

        // Apaga o save, usado ao morrer (Parte 1 §9: perde tudo).
        public static void Delete()
        {
            if (HasSave)
            {
                File.Delete(FilePath);
            }
        }
    }
}
```

### 3.3 `RunManager`

```csharp
// Caminho: Assets/_Project/Scripts/Meta/RunManager.cs
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using CraftDice.Data;

namespace CraftDice.Meta
{
    // POR QUE: alguém precisa lembrar da run enquanto as cenas trocam
    // (mapa → batalha → mapa) e decidir o que acontece ao vencer ou morrer.
    // ESTRATÉGIA: um "singleton" (só existe um, acessado por RunManager.Instance).
    // - [RuntimeInitializeOnLoadMethod] cria o objeto sozinho antes da primeira
    //   cena carregar, então dá para apertar Play em QUALQUER cena (até na
    //   Battle direto) e o RunManager já existe.
    // - DontDestroyOnLoad impede o Unity de apagar o objeto ao trocar de cena.
    // - O estado é um campo [SerializeField]: no Play Mode dá para ver HP,
    //   dados e moeda no Inspector (selecione "RunManager" na Hierarchy).
    public class RunManager : MonoBehaviour
    {
        public static RunManager Instance { get; private set; }

        [SerializeField] private RunState _state;

        public RunState State => _state;
        public GameConfig Config { get; private set; }
        public MonsterDefinition PendingMonster { get; private set; }
        public string LastRunMessage { get; private set; } = "";

        private string _pendingMonsterId;

        // Cria o RunManager antes da primeira cena (ver ESTRATÉGIA).
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void Bootstrap()
        {
            GameObject go = new GameObject("RunManager");
            go.AddComponent<RunManager>();
            DontDestroyOnLoad(go);
        }

        // Awake roda assim que o componente nasce: carrega config e save.
        private void Awake()
        {
            Instance = this;
            Config = Resources.Load<GameConfig>("GameConfig");
            if (Config == null)
            {
                Debug.LogError("GameConfig não encontrado em Assets/_Project/Resources/GameConfig.asset");
                return;
            }
            _state = SaveSystem.Load();
            if (_state == null)
            {
                StartNewRun();
            }
        }

        // ---------- Run ----------

        // Run nova do zero: HP cheio, dados iniciais, nada aprendido (Parte 1 §9).
        public void StartNewRun()
        {
            _state = new RunState
            {
                maxHp = Config.playerMaxHp,
                hp = Config.playerMaxHp,
                currency = Config.startingCurrency,
                currentScene = Config.firstAreaScene,
            };
            foreach (DieType type in Config.startingDice)
            {
                _state.dice.Add(DieData.CreateDefault(type));
                if (_state.loadout.Count < Config.loadoutLimit)
                {
                    _state.loadout.Add(_state.dice.Count - 1);
                }
            }
            PendingMonster = null;
        }

        // Grava a run no disco (momentos do placeholder da Parte 1 §12).
        public void SaveNow()
        {
            if (_state != null)
            {
                SaveSystem.Save(_state);
            }
        }

        // Os dados que vão para a batalha, na ordem da mão.
        public List<DieData> GetLoadout()
        {
            List<DieData> result = new List<DieData>();
            foreach (int index in _state.loadout)
            {
                if (index >= 0 && index < _state.dice.Count)
                {
                    result.Add(_state.dice[index]);
                }
            }
            return result;
        }

        // Lembra onde o jogador está, para voltar ao mesmo ponto depois.
        public void SavePosition(Vector2 position)
        {
            _state.currentScene = SceneManager.GetActiveScene().name;
            _state.hasPosition = true;
            _state.posX = position.x;
            _state.posY = position.y;
        }

        // Este monstro (ou chefe) já foi derrotado nesta run?
        public bool IsDefeated(string monsterId)
        {
            return _state.defeatedMonsterIds.Contains(monsterId) || _state.defeatedBossIds.Contains(monsterId);
        }

        // ---------- Batalha ----------

        // Encostou num monstro no mapa: guarda posição e monstro e abre a batalha.
        public void EnterBattle(MonsterDefinition monster, string monsterId, Vector2 playerPosition)
        {
            SavePosition(playerPosition);
            PendingMonster = monster;
            _pendingMonsterId = monsterId;
            SaveNow();
            LoadSceneSafe(Config.battleScene);
        }

        // Venceu: devolve o HP, paga a moeda, marca o monstro e volta ao mapa.
        public void OnBattleWon(int remainingHp, MonsterDefinition monster)
        {
            _state.hp = remainingHp;
            _state.currency += monster.currencyReward;
            if (!string.IsNullOrEmpty(_pendingMonsterId))
            {
                (monster.isBoss ? _state.defeatedBossIds : _state.defeatedMonsterIds).Add(_pendingMonsterId);
            }
            PendingMonster = null;
            _pendingMonsterId = null;

            if (monster.isFinalBoss)
            {
                EndRun("VITORIA! Voce derrotou o ultimo chefe.");
                return;
            }
            SaveNow();
            LoadSceneSafe(_state.currentScene);
        }

        // Morreu: perde tudo (Parte 1 §9).
        public void OnPlayerDied()
        {
            EndRun("VOCE MORREU. Tudo foi perdido.");
        }

        // Fim da run, por vitória ou morte: apaga o save, zera a run e mostra a tela final.
        private void EndRun(string message)
        {
            LastRunMessage = message;
            SaveSystem.Delete();
            StartNewRun();
            LoadSceneSafe(Config.runEndScene);
        }

        // ---------- Bonfire (Fase 6) ----------

        // Descansar: HP cheio e monstros comuns renascem (Parte 1 §7).
        public void Rest()
        {
            _state.hp = _state.maxHp;
            _state.defeatedMonsterIds.Clear();
        }

        // Aprende um feitiço pagando o preço. Devolve false se já sabe ou não tem moeda.
        public bool LearnSpell(SpellDefinition spell)
        {
            if (_state.learnedSpellIds.Contains(spell.id) || _state.currency < spell.learnPrice)
            {
                return false;
            }
            _state.currency -= spell.learnPrice;
            _state.learnedSpellIds.Add(spell.id);
            return true;
        }

        // Forja um dado: paga, guarda na bolsa e, se couber, já põe na mão.
        public bool TryForge(DieData die)
        {
            int price = FaceCatalog.ForgePrice(die, Config);
            if (_state.currency < price)
            {
                return false;
            }
            _state.currency -= price;
            _state.dice.Add(die);
            if (_state.loadout.Count < Config.loadoutLimit)
            {
                _state.loadout.Add(_state.dice.Count - 1);
            }
            return true;
        }

        // Põe ou tira um dado da mão. Respeita o limite de 5 e o placeholder
        // da Parte 1 §3.2 (a mão não pode ficar vazia).
        public bool ToggleLoadout(int diceIndex)
        {
            if (_state.loadout.Contains(diceIndex))
            {
                if (_state.loadout.Count <= 1)
                {
                    return false;
                }
                _state.loadout.Remove(diceIndex);
                return true;
            }
            if (_state.loadout.Count >= Config.loadoutLimit)
            {
                return false;
            }
            _state.loadout.Add(diceIndex);
            return true;
        }

        // ---------- Áreas (Fase 7) ----------

        // Vai para outra área: o jogador aparece no ponto inicial da cena nova.
        public void GoToArea(string sceneName)
        {
            _state.currentScene = sceneName;
            _state.hasPosition = false;
            SaveNow();
            LoadSceneSafe(sceneName);
        }

        // ---------- Utilidades ----------

        // Carrega uma cena só se ela estiver no Build Profile. Nas primeiras
        // fases do guia algumas cenas ainda não existem: em vez de erro,
        // recarrega a cena atual e avisa no Console.
        public void LoadSceneSafe(string sceneName)
        {
            if (!string.IsNullOrEmpty(sceneName) && Application.CanStreamedLevelBeLoaded(sceneName))
            {
                SceneManager.LoadScene(sceneName);
                return;
            }
            Debug.LogWarning($"Cena '{sceneName}' não está no Build Profile; recarregando a cena atual.");
            SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        }

        // Mobile: o sistema pode matar o app em segundo plano sem avisar, então grava ao pausar.
        private void OnApplicationPause(bool paused)
        {
            if (paused)
            {
                SaveNow();
            }
        }

        // PC: grava ao fechar.
        private void OnApplicationQuit()
        {
            SaveNow();
        }

        // Atalho de desenvolvimento: botão direito no componente (Play Mode) → este item.
        [ContextMenu("Apagar save e começar run nova")]
        private void DebugResetRun()
        {
            SaveSystem.Delete();
            StartNewRun();
            Debug.Log("Run reiniciada.");
        }
    }
}
```

### ✅ Checkpoint da Fase 3
- Aperte Play em qualquer cena: na Hierarchy aparece **DontDestroyOnLoad → RunManager**.
- Selecionando o RunManager no Play Mode, o Inspector mostra **State** com HP 10 e três dados (2 Ataque, 1 Defesa) com `loadout` = 0, 1, 2.
- Saia do Play Mode: existe um `run.json` em `Application.persistentDataPath` (no Windows: `%USERPROFILE%\AppData\LocalLow\<Company>\CraftDice\`).

#### Problemas comuns
- **Mudei o `GameConfig` e o HP/dados iniciais não mudaram:** o RunManager carregou o save antigo. Use o menu de contexto **Apagar save e começar run nova** ou apague o `run.json`.

Próxima fase: **Cena de Batalha**, com a rodada da Fase 2 jogável com mouse e toque.

---

# Parte 7 — Implementação Unity: Fase 4 (Cena de Batalha)

## Fase 4 — Cena de Batalha

> Objetivo desta fase: a cena `Battle` jogável: intenção do monstro visível, dados clicáveis para re-rolar, botões de feitiço, Re-rolar e Confirmar, e tela de fim de batalha (Parte 1 §4, §5 e §11).

### 4.1 Botão de lista reaproveitável

```csharp
// Caminho: Assets/_Project/Scripts/UI/ListButton.cs
using TMPro;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

namespace CraftDice.UI
{
    // POR QUE: a batalha (feitiços) e a bonfire (feitiços à venda, faces da
    // forja, mão de dados) mostram listas de botões com texto.
    // ESTRATÉGIA: um prefab só (Button + texto), configurado por código com
    // Setup. Ele limpa os cliques antigos antes de pôr o novo, então pode ser
    // chamado a cada atualização da tela sem acumular cliques.
    public class ListButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private TMP_Text _label;

        // Define texto, se dá para clicar e o que acontece ao clicar.
        public void Setup(string text, bool interactable, UnityAction onClick)
        {
            _label.text = text;
            _button.interactable = interactable;
            _button.onClick.RemoveAllListeners();
            if (onClick != null)
            {
                _button.onClick.AddListener(onClick);
            }
        }

        // Apaga todos os filhos de um container (para reconstruir uma lista).
        public static void ClearChildren(Transform container)
        {
            for (int i = container.childCount - 1; i >= 0; i--)
            {
                Destroy(container.GetChild(i).gameObject);
            }
        }
    }
}
```

### 4.2 `DieView`

```csharp
// Caminho: Assets/_Project/Scripts/Battle/DieView.cs
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using CraftDice.Combat;
using CraftDice.Data;

namespace CraftDice.Battle
{
    // POR QUE: um dado na tela. Mostra a face que caiu e, ao ser clicado ou
    // tocado, marca o dado para re-rolar (Parte 1 §11).
    // ESTRATÉGIA: o dado não sabe regra nenhuma. Ele só avisa o
    // BattleController "cliquei no dado N" e se desenha com o que recebe.
    public class DieView : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private Image _background;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private Color _attackColor = new Color(0.80f, 0.30f, 0.30f);
        [SerializeField] private Color _defenseColor = new Color(0.30f, 0.50f, 0.85f);
        [SerializeField] private Color _spellColor = new Color(0.60f, 0.35f, 0.85f);
        [SerializeField] private Color _markedColor = new Color(0.35f, 0.35f, 0.35f);

        // Liga o clique deste dado ao controlador, lembrando a posição na mão.
        public void Bind(BattleController owner, int index)
        {
            _button.onClick.AddListener(() => owner.OnDieClicked(index));
        }

        // Desenha a face atual. Dado marcado fica cinza e com aviso.
        public void Show(RolledDie rolled, bool canToggle)
        {
            _label.text = rolled.markedForReroll ? rolled.face.Label + "\n(re-rolar)" : rolled.face.Label;
            _background.color = rolled.markedForReroll ? _markedColor : ColorFor(rolled.die.type);
            _button.interactable = canToggle;
        }

        // Cor de cada tipo de dado.
        private Color ColorFor(DieType type)
        {
            switch (type)
            {
                case DieType.Attack: return _attackColor;
                case DieType.Defense: return _defenseColor;
                default: return _spellColor;
            }
        }
    }
}
```

### 4.3 `BattleController`

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BattleController.cs
using System.Collections.Generic;
using System.Text;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using CraftDice.Combat;
using CraftDice.Data;
using CraftDice.Meta;
using CraftDice.UI;

namespace CraftDice.Battle
{
    // POR QUE: liga a UI da cena Battle ao BattleEngine da Fase 2.
    // ESTRATÉGIA: todo clique chama o engine e depois Refresh(), que redesenha
    // a tela inteira a partir do BattleState. Assim a tela nunca mostra
    // algo diferente da regra. Se a cena for aberta direto (sem vir do mapa),
    // usa o "Test Monster" do Inspector.
    public class BattleController : MonoBehaviour
    {
        [Header("Teste: usado se a cena for aberta direto")]
        [SerializeField] private MonsterDefinition _testMonster;

        [Header("Monstro")]
        [SerializeField] private Image _monsterImage;
        [SerializeField] private TMP_Text _monsterNameLabel;
        [SerializeField] private TMP_Text _monsterHpLabel;
        [SerializeField] private TMP_Text _intentLabel;

        [Header("Jogador")]
        [SerializeField] private TMP_Text _playerHpLabel;
        [SerializeField] private TMP_Text _spellPointsLabel;
        [SerializeField] private TMP_Text _rerollsLabel;

        [Header("Dados e feitiços")]
        [SerializeField] private Transform _diceRow;
        [SerializeField] private DieView _diePrefab;
        [SerializeField] private Transform _spellRow;
        [SerializeField] private ListButton _spellButtonPrefab;

        [Header("Ações")]
        [SerializeField] private Button _rerollButton;
        [SerializeField] private Button _confirmButton;
        [SerializeField] private TMP_Text _logLabel;

        [Header("Fim da batalha")]
        [SerializeField] private GameObject _endPanel;
        [SerializeField] private TMP_Text _endLabel;
        [SerializeField] private Button _endButton;

        private BattleEngine _engine;
        private MonsterDefinition _monster;
        private readonly List<DieView> _dieViews = new List<DieView>();
        private readonly List<SpellDefinition> _spells = new List<SpellDefinition>();
        private readonly List<ListButton> _spellButtons = new List<ListButton>();
        private bool _won;

        // Monta a batalha: monstro, dados da mão, feitiços aprendidos e botões.
        private void Start()
        {
            RunManager run = RunManager.Instance;
            _monster = run.PendingMonster != null ? run.PendingMonster : _testMonster;
            _engine = new BattleEngine(run.Config, _monster, run.GetLoadout(),
                run.State.hp, run.State.maxHp, new System.Random());

            _monsterNameLabel.text = _monster.displayName;
            if (_monsterImage != null && _monster.sprite != null)
            {
                _monsterImage.sprite = _monster.sprite;
            }

            ListButton.ClearChildren(_diceRow);
            for (int i = 0; i < _engine.State.hand.Count; i++)
            {
                DieView view = Instantiate(_diePrefab, _diceRow);
                view.Bind(this, i);
                _dieViews.Add(view);
            }

            ListButton.ClearChildren(_spellRow);
            foreach (string id in run.State.learnedSpellIds)
            {
                SpellDefinition spell = run.Config.FindSpell(id);
                if (spell == null)
                {
                    continue;
                }
                _spells.Add(spell);
                _spellButtons.Add(Instantiate(_spellButtonPrefab, _spellRow));
            }

            _rerollButton.onClick.AddListener(OnRerollClicked);
            _confirmButton.onClick.AddListener(OnConfirmClicked);
            _endButton.onClick.AddListener(OnEndClicked);
            _endPanel.SetActive(false);

            _engine.StartRound();
            _logLabel.text = "Toque nos dados que quer re-rolar, ou confirme.";
            Refresh();
        }

        // Clique num dado: marca/desmarca para re-rolar.
        public void OnDieClicked(int index)
        {
            _engine.ToggleReroll(index);
            Refresh();
        }

        // Botão Re-rolar.
        private void OnRerollClicked()
        {
            _engine.Reroll();
            Refresh();
        }

        // Clique num feitiço.
        private void OnSpellClicked(SpellDefinition spell)
        {
            if (_engine.CastSpell(spell))
            {
                _logLabel.text = spell.displayName + " lancado!";
            }
            Refresh();
        }

        // Botão Confirmar: resolve a rodada e começa a próxima ou encerra.
        private void OnConfirmClicked()
        {
            RoundReport report = _engine.Resolve();
            _logLabel.text = Describe(report);

            if (report.monsterDied)
            {
                ShowEnd(true);
            }
            else if (report.playerDied)
            {
                ShowEnd(false);
            }
            else
            {
                _engine.StartRound();
            }
            Refresh();
        }

        // Botão da tela final: avisa a run do resultado (ela troca de cena).
        private void OnEndClicked()
        {
            if (_won)
            {
                RunManager.Instance.OnBattleWon(_engine.State.playerHp, _monster);
            }
            else
            {
                RunManager.Instance.OnPlayerDied();
            }
        }

        // Mostra o painel de vitória ou de derrota.
        private void ShowEnd(bool won)
        {
            _won = won;
            _endPanel.SetActive(true);
            _endLabel.text = won
                ? $"{_monster.displayName} derrotado!\n+{_monster.currencyReward} de moeda"
                : "Voce morreu.";
        }

        // Redesenha tudo a partir do estado da batalha.
        private void Refresh()
        {
            BattleState s = _engine.State;

            _monsterHpLabel.text = $"HP {s.monsterHp}/{s.monster.maxHp}";
            string weakness = s.weaknessBonus > 0 ? $"  (Fraqueza +{s.weaknessBonus})" : "";
            _intentLabel.text = $"Vai atacar {s.currentIntent}x ({s.monster.damagePerHit} de dano cada){weakness}";

            _playerHpLabel.text = $"HP {s.playerHp}/{s.playerMaxHp}";
            _spellPointsLabel.text = $"Feitico: {s.SpellPointsAvailable}";
            _rerollsLabel.text = $"Re-rolagens: {s.rerollsLeft}";

            for (int i = 0; i < _dieViews.Count; i++)
            {
                _dieViews[i].Show(s.hand[i], _engine.CanToggleReroll(i));
            }

            for (int i = 0; i < _spells.Count; i++)
            {
                SpellDefinition spell = _spells[i];
                _spellButtons[i].Setup($"{spell.displayName} ({spell.cost})", _engine.CanCast(spell),
                    () => OnSpellClicked(spell));
            }

            bool anyMarked = s.hand.Exists(d => d.markedForReroll);
            _rerollButton.interactable = !s.IsOver && s.rerollsLeft > 0 && anyMarked;
            _confirmButton.interactable = !s.IsOver;
        }

        // Texto do que aconteceu na rodada.
        private static string Describe(RoundReport r)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendLine($"Voce acertou {r.hitsDealt} ataque(s): {r.damageDealt} de dano.");
            if (r.parries > 0)
            {
                sb.AppendLine($"Parry x{r.parries}: bloqueou e devolveu {r.counterDamage}.");
            }
            if (r.dodges > 0)
            {
                sb.AppendLine($"Esquiva x{r.dodges}.");
            }
            if (r.hitsTaken > 0)
            {
                sb.AppendLine($"Voce levou {r.hitsTaken} golpe(s): {r.damageTaken} de dano.");
            }
            return sb.ToString();
        }
    }
}
```

### 4.4 Montar a cena `Battle`

1. Abra a cena `Battle`. **GameObject → UI → Canvas**. No **Canvas Scaler**: **Scale With Screen Size**, 1920×1080, **Match = 0.5** (funciona em tela de PC e de celular).
2. Dentro do Canvas, monte de cima para baixo:
   - **MonsterPanel:** `Image` (sprite do monstro), e textos TMP `MonsterName`, `MonsterHp` e `Intent`.
   - **PlayerPanel:** textos `PlayerHp`, `SpellPoints` e `Rerolls`.
   - **DiceRow:** objeto vazio com **Horizontal Layout Group** (Spacing 20, Child Alignment Middle Center).
   - **SpellRow:** igual ao DiceRow.
   - **Buttons:** botões `RerollButton` ("RE-ROLAR") e `ConfirmButton` ("CONFIRMAR").
   - **Log:** texto TMP.
   - **EndPanel:** painel escuro na tela toda, com texto `EndLabel` e botão `EndButton` ("CONTINUAR").
3. **Prefab `DieView`:** **UI → Button - TextMeshPro**, tamanho 200×200. Adicione `DieView`, arraste o próprio `Button` para **Button**, o `Image` do botão para **Background** e o texto filho para **Label**. Arraste para `Prefabs/` e apague da cena.
4. **Prefab `ListButton`:** outro **Button - TextMeshPro** (300×80), com `ListButton`, **Button** e **Label** preenchidos. Salve em `Prefabs/`.
5. Crie um GameObject vazio `BattleController`, adicione o script e preencha todos os campos. Em **Test Monster** use `Monster_Skeleton`.
6. Garanta que existe um **EventSystem** na cena (o Unity cria junto com o Canvas). Com o Input System, ele usa o **Input System UI Input Module**, que aceita mouse e toque.

> Para testar os feitiços antes da bonfire existir: no Play Mode, selecione o **RunManager**, abra **State → Learned Spell Ids**, adicione `potion` e `double_attacks` e recarregue a cena. Lembre-se de que o RunManager só monta a lista no `Start` da batalha.

### ✅ Checkpoint da Fase 4
- Play na cena `Battle`: aparecem o nome do Esqueleto, "Vai atacar 1x" e três dados coloridos (2 vermelhos e 1 azul).
- Clicar num dado deixa ele cinza com "(re-rolar)". **RE-ROLAR** troca só os marcados, e depois disso os dados não podem mais ser marcados (re-rolagens: 0).
- **CONFIRMAR** mostra o resultado no Log, e a intenção muda para a próxima do padrão (1 → 2).
- Ao vencer, aparece o painel com a moeda ganha. CONTINUAR recarrega a cena, porque a `Area1` ainda está vazia (aviso esperado no Console).
- Com `potion` aprendido e um dado de Feitiço na mão, o botão Poção só fica ativo com 2 ou mais pontos de feitiço e HP abaixo do máximo.

#### Problemas comuns
- **Os cliques não funcionam:** falta o EventSystem, ou ele está com o módulo antigo (Standalone Input Module). Clique em **Replace with InputSystemUIInputModule** no Inspector do EventSystem.
- **Todo dado aparece igual depois de rolar:** o prefab do `DieView` está com o campo **Label** apontando para o texto do prefab original, e não para o filho dele. Abra o prefab e arraste o filho de novo.

Próxima fase: **Exploração Topdown**, com o mapa, o jogador e os monstros que abrem esta cena ao serem tocados.

---

# Parte 8 — Implementação Unity: Fase 5 (Exploração Topdown)

## Fase 5 — Exploração Topdown

> Objetivo desta fase: a cena `Area1` com mapa de Tilemap feito à mão, o jogador andando no teclado, gamepad ou joystick virtual, câmera seguindo, e monstros que abrem a batalha ao encostar e somem quando derrotados (Parte 1 §2 e §8).

### 5.1 Mapa

1. Na cena `Area1`: **GameObject → 2D Object → Tilemap → Rectangular**. Renomeie o Tilemap para `Ground`.
2. Crie um segundo Tilemap, `Walls`. Nele adicione **Tilemap Collider 2D**, **Composite Collider 2D** (o Unity adiciona um `Rigidbody2D`; troque o **Body Type** para **Static**) e, no Tilemap Collider 2D, marque **Composite Operation = Merge**.
3. Em **Window → 2D → Tile Palette**, crie uma paleta com os tiles de `Assets/_Project/Tiles/` e pinte o chão e as paredes. Enquanto a arte estiver **Em aberto** (Parte 1 §10), quadrados coloridos de 16×16 servem.

### 5.2 `PlayerMovement`

```csharp
// Caminho: Assets/_Project/Scripts/World/PlayerMovement.cs
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;
using CraftDice.Meta;

namespace CraftDice.World
{
    // POR QUE: andar pelo mapa topdown (Parte 1 §11) com o mesmo código no PC
    // (WASD, setas, gamepad) e no mobile (joystick virtual).
    // ESTRATÉGIA: lê a ação "Move" do Input System. O joystick virtual do
    // mobile finge ser um gamepad, então nenhuma linha muda por plataforma.
    // O movimento é feito no Rigidbody2D para respeitar as paredes.
    // - Rigidbody2D = componente de física 2D: dá velocidade e colisão ao objeto.
    // - FixedUpdate roda no ritmo da física, e é lá que se mexe em Rigidbody.
    [RequireComponent(typeof(Rigidbody2D))]
    public class PlayerMovement : MonoBehaviour
    {
        [SerializeField] private InputActionReference _moveAction;
        [SerializeField] private float _speed = 4f;

        private Rigidbody2D _rb;
        private Vector2 _input;

        // Menus (bonfire) travam o jogador enquanto estão abertos.
        public bool Frozen { get; set; }

        // Guarda o Rigidbody2D deste objeto.
        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
        }

        // Liga a leitura do input quando o objeto é ativado.
        private void OnEnable()
        {
            _moveAction.action.Enable();
        }

        // Volta ao ponto salvo (ex.: onde tocou o monstro), se for esta cena.
        private void Start()
        {
            RunState state = RunManager.Instance.State;
            if (state.hasPosition && state.currentScene == SceneManager.GetActiveScene().name)
            {
                Vector2 saved = new Vector2(state.posX, state.posY);
                transform.position = saved;
                _rb.position = saved;
            }
        }

        // Update roda todo frame: lê o input.
        private void Update()
        {
            _input = Frozen ? Vector2.zero : _moveAction.action.ReadValue<Vector2>();
        }

        // Aplica a velocidade. ClampMagnitude impede andar mais rápido na diagonal.
        private void FixedUpdate()
        {
            _rb.linearVelocity = Vector2.ClampMagnitude(_input, 1f) * _speed;
        }
    }
}
```

> ⚠️ Nota de versão: `rb.linearVelocity` é o nome usado no Unity 6 / 2023.x+. Se o projeto rodar em 2022 LTS, troque por `rb.velocity` (mesma coisa, nome antigo).

**Configurar o jogador:**

1. Crie um GameObject `Player` com **SpriteRenderer**, **Rigidbody2D** (**Gravity Scale = 0**, **Freeze Rotation Z** marcado, **Interpolate = Interpolate**) e **CircleCollider2D**.
2. No topo do Inspector, ponha a **Tag = Player**.
3. Adicione `PlayerMovement`. Em **Move Action**, escolha **Player/Move** do asset `InputSystem_Actions`, que o Unity 6 cria no projeto e já liga WASD, setas e gamepad.

### 5.3 Câmera

1. **GameObject → Cinemachine → Cinemachine Camera**. Em **Tracking Target**, arraste o `Player`, e em **Position Control** use **Position Composer**.
2. Na **Main Camera**, adicione **Pixel Perfect Camera** (Assets PPU igual ao Pixels Per Unit dos sprites). Na Cinemachine Camera, adicione a extensão **Cinemachine Pixel Perfect**, para os dois não brigarem.

### 5.4 `MapMonster`

```csharp
// Caminho: Assets/_Project/Scripts/World/MapMonster.cs
using UnityEngine;
using CraftDice.Data;
using CraftDice.Meta;

namespace CraftDice.World
{
    // POR QUE: um monstro parado no mapa (placeholder da Parte 1 §6). Encostar
    // nele abre a batalha. Se já foi derrotado nesta run, ele não aparece.
    // ESTRATÉGIA: o ID do monstro é "cena@posição", calculado sozinho. Como o
    // mapa é fixo (Parte 1 §8), a posição inicial nunca muda, então ninguém
    // precisa digitar ID nem corre o risco de duplicar ao copiar o objeto.
    // Se os monstros passarem a andar (Em aberto §6), o ID continua sendo o da
    // posição inicial, porque ele é calculado no Awake, antes de qualquer movimento.
    // - Collider2D com "Is Trigger" não bloqueia ninguém: só avisa quem entrou
    //   (OnTriggerEnter2D).
    [RequireComponent(typeof(Collider2D))]
    public class MapMonster : MonoBehaviour
    {
        [SerializeField] private MonsterDefinition _definition;

        private bool _triggered;

        public string Id { get; private set; }

        // Calcula o ID a partir da posição em que o monstro foi colocado.
        private void Awake()
        {
            Vector3 p = transform.position;
            Id = $"{gameObject.scene.name}@{Mathf.RoundToInt(p.x * 10)},{Mathf.RoundToInt(p.y * 10)}";
        }

        // Some do mapa se já foi derrotado (e ainda não renasceu na bonfire).
        private void Start()
        {
            if (RunManager.Instance.IsDefeated(Id))
            {
                Destroy(gameObject);
            }
        }

        // O jogador encostou: começa a batalha (só uma vez).
        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_triggered || !other.CompareTag("Player"))
            {
                return;
            }
            _triggered = true;
            RunManager.Instance.EnterBattle(_definition, Id, other.attachedRigidbody.position);
        }
    }
}
```

**Configurar os monstros:**

1. Crie um GameObject `Monster_Skeleton` com **SpriteRenderer** (sprite do monstro), **CircleCollider2D** com **Is Trigger** marcado, e `MapMonster` com **Definition = Monster_Skeleton**. Salve como prefab.
2. Espalhe alguns Esqueletos e Cães Sombrios pelo mapa.

### 5.5 Joystick virtual no mobile

```csharp
// Caminho: Assets/_Project/Scripts/UI/MobileOnly.cs
using UnityEngine;

namespace CraftDice.UI
{
    // POR QUE: o joystick virtual só deve aparecer no celular (Parte 1 §11).
    // ESTRATÉGIA: se desliga sozinho fora do mobile. Para testar o joystick
    // no PC, marque "Force In Editor".
    public class MobileOnly : MonoBehaviour
    {
        [SerializeField] private bool _forceInEditor;

        // Liga/desliga o objeto conforme a plataforma.
        private void Awake()
        {
            bool show = Application.isMobilePlatform || (Application.isEditor && _forceInEditor);
            gameObject.SetActive(show);
        }
    }
}
```

1. Na `Area1`, crie um Canvas (mesmas configurações do Canvas da batalha) com uma `Image` redonda no canto inferior esquerdo, chamada `Stick`.
2. No `Stick`, adicione **On-Screen Stick** (do Input System) com **Control Path = `<Gamepad>/leftStick`**. A ação Move já escuta o gamepad, então o código não muda.
3. Adicione `MobileOnly` no objeto pai do Stick.

### ✅ Checkpoint da Fase 5
- Play na `Area1`: o jogador anda com WASD ou setas, para nas paredes, e a câmera o segue.
- Encostar num Esqueleto abre a cena `Battle` com o Esqueleto.
- Ao vencer e apertar CONTINUAR, o jogador volta à `Area1` no mesmo lugar, o Esqueleto sumiu e o RunManager mostra mais moeda.
- Fechar o Play Mode e apertar Play de novo: o Esqueleto continua sumido (veio do save).
- Com **Force In Editor** marcado, o joystick virtual move o jogador.

#### Problemas comuns
- **O jogador atravessa as paredes:** o Composite Collider 2D não está ligado ao Tilemap Collider 2D (**Composite Operation = Merge**), ou o Rigidbody2D do jogador está como **Kinematic**. Use **Dynamic**.
- **Encostar no monstro não faz nada:** a Tag do jogador não é `Player`, ou o collider do monstro não tem **Is Trigger** marcado.
- **O jogador cai para baixo da tela:** a **Gravity Scale** do Rigidbody2D não está em 0.

Próxima fase: **Bonfire e Forja**: descanso, feitiços, forja de faces e escolha da mão.

---

# Parte 9 — Implementação Unity: Fase 6 (Bonfire e Forja)

## Fase 6 — Bonfire e Forja

> Objetivo desta fase: encostar numa bonfire abre um menu com Descansar (HP cheio e monstros renascem), Feitiços (aprender), Forja (faces customizáveis) e Mão (escolher até 5 dados), como descrito na Parte 1 §3.2, §3.3, §5 e §7.

### 6.1 `Bonfire`

```csharp
// Caminho: Assets/_Project/Scripts/World/Bonfire.cs
using System.Collections.Generic;
using UnityEngine;
using CraftDice.Data;

namespace CraftDice.World
{
    // POR QUE: o ponto da bonfire no mapa (Parte 1 §7). Cada bonfire ensina
    // a sua própria lista de feitiços (a distribuição está Em aberto em §5).
    // ESTRATÉGIA: encostar abre o menu (placeholder da §11). O menu é um
    // objeto só por cena, e a bonfire só diz "fui eu" para ele.
    [RequireComponent(typeof(Collider2D))]
    public class Bonfire : MonoBehaviour
    {
        [SerializeField] private List<SpellDefinition> _spellsTaught = new List<SpellDefinition>();
        [SerializeField] private BonfireMenu _menu;

        public IReadOnlyList<SpellDefinition> SpellsTaught => _spellsTaught;

        // O jogador encostou: abre o menu.
        private void OnTriggerEnter2D(Collider2D other)
        {
            if (other.CompareTag("Player"))
            {
                _menu.Open(this, other.GetComponent<PlayerMovement>());
            }
        }
    }
}
```

### 6.2 `BonfireMenu`

```csharp
// Caminho: Assets/_Project/Scripts/World/BonfireMenu.cs
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using CraftDice.Data;
using CraftDice.Meta;
using CraftDice.UI;

namespace CraftDice.World
{
    // POR QUE: o menu da bonfire. Descansar e Feitiços ficam aqui; Forja e
    // Mão são painéis filhos (ForgePanel, LoadoutPanel).
    // ESTRATÉGIA: Descansar recarrega a cena. É o jeito mais simples de os
    // monstros renascerem: o RunManager esquece os derrotados, e os
    // MapMonster nascem de novo ao carregar. O jogador volta ao lado da
    // bonfire, porque a posição foi salva antes.
    public class BonfireMenu : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private TMP_Text _statusLabel;
        [SerializeField] private Button _restButton;
        [SerializeField] private Button _closeButton;
        [SerializeField] private Transform _spellList;
        [SerializeField] private ListButton _listButtonPrefab;
        [SerializeField] private ForgePanel _forgePanel;
        [SerializeField] private LoadoutPanel _loadoutPanel;

        private Bonfire _bonfire;
        private PlayerMovement _player;

        // Começa fechado e liga os botões fixos.
        private void Awake()
        {
            _root.SetActive(false);
            _restButton.onClick.AddListener(Rest);
            _closeButton.onClick.AddListener(Close);
        }

        // Abre o menu para esta bonfire: trava o jogador e salva a posição.
        public void Open(Bonfire bonfire, PlayerMovement player)
        {
            _bonfire = bonfire;
            _player = player;
            _player.Frozen = true;
            _root.SetActive(true);
            RunManager.Instance.SavePosition(player.transform.position);
            RunManager.Instance.SaveNow();
            Refresh();
        }

        // Fecha o menu e destrava o jogador.
        public void Close()
        {
            _root.SetActive(false);
            if (_player != null)
            {
                _player.Frozen = false;
            }
        }

        // Descansar: HP cheio, monstros comuns renascem (Parte 1 §7).
        private void Rest()
        {
            RunManager run = RunManager.Instance;
            run.Rest();
            run.SavePosition(_player.transform.position);
            run.SaveNow();
            SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        }

        // Atualiza status, lista de feitiços e os painéis filhos.
        // Os painéis chamam isto depois de gastar moeda.
        public void Refresh()
        {
            RunManager run = RunManager.Instance;
            RunState s = run.State;
            _statusLabel.text = $"HP {s.hp}/{s.maxHp}    Moeda {s.currency}";

            ListButton.ClearChildren(_spellList);
            foreach (SpellDefinition spell in _bonfire.SpellsTaught)
            {
                bool known = s.learnedSpellIds.Contains(spell.id);
                string text = known
                    ? $"{spell.displayName} (aprendido)"
                    : $"{spell.displayName} - custo {spell.cost} - {spell.learnPrice} moedas\n{spell.description}";
                ListButton button = Instantiate(_listButtonPrefab, _spellList);
                SpellDefinition captured = spell;
                button.Setup(text, !known && s.currency >= spell.learnPrice, () =>
                {
                    if (run.LearnSpell(captured))
                    {
                        run.SaveNow();
                        Refresh();
                    }
                });
            }

            _forgePanel.Refresh();
            _loadoutPanel.Refresh();
        }
    }
}
```

### 6.3 `ForgePanel`

```csharp
// Caminho: Assets/_Project/Scripts/World/ForgePanel.cs
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using CraftDice.Data;
using CraftDice.Meta;
using CraftDice.UI;

namespace CraftDice.World
{
    // POR QUE: a forja de faces customizáveis (Parte 1 §3.3).
    // ESTRATÉGIA: o jogador escolhe o tipo, e cada face vira um botão. Clicar
    // na face troca para a próxima face possível daquele tipo (placeholder da
    // §3.3: sem misturar tipos, mesmo número de faces). O preço é recalculado
    // a cada troca. Forjar entrega uma CÓPIA do rascunho, para o rascunho
    // poder continuar sendo editado.
    public class ForgePanel : MonoBehaviour
    {
        [SerializeField] private BonfireMenu _menu;
        [SerializeField] private Button _attackTypeButton;
        [SerializeField] private Button _defenseTypeButton;
        [SerializeField] private Button _spellTypeButton;
        [SerializeField] private Transform _faceList;
        [SerializeField] private ListButton _listButtonPrefab;
        [SerializeField] private TMP_Text _priceLabel;
        [SerializeField] private Button _forgeButton;

        private DieData _draft;

        // Liga os botões fixos.
        private void Awake()
        {
            _attackTypeButton.onClick.AddListener(() => NewDraft(DieType.Attack));
            _defenseTypeButton.onClick.AddListener(() => NewDraft(DieType.Defense));
            _spellTypeButton.onClick.AddListener(() => NewDraft(DieType.Spell));
            _forgeButton.onClick.AddListener(Forge);
        }

        // Começa um rascunho com as faces padrão do tipo escolhido.
        private void NewDraft(DieType type)
        {
            _draft = DieData.CreateDefault(type);
            Refresh();
        }

        // Troca a face N pela próxima da lista do tipo.
        private void CycleFace(int faceIndex)
        {
            DieFace[] pool = FaceCatalog.PoolFor(_draft.type);
            int current = 0;
            for (int i = 0; i < pool.Length; i++)
            {
                if (pool[i].SameAs(_draft.faces[faceIndex]))
                {
                    current = i;
                }
            }
            _draft.faces[faceIndex] = pool[(current + 1) % pool.Length];
            Refresh();
        }

        // Redesenha as faces, o preço e se dá para pagar.
        public void Refresh()
        {
            if (_draft == null)
            {
                _draft = DieData.CreateDefault(DieType.Attack);
            }
            RunManager run = RunManager.Instance;

            ListButton.ClearChildren(_faceList);
            for (int i = 0; i < _draft.faces.Count; i++)
            {
                int index = i; // cópia local: cada botão lembra a sua face
                ListButton button = Instantiate(_listButtonPrefab, _faceList);
                button.Setup($"Face {i + 1}: {_draft.faces[i].Label}", true, () => CycleFace(index));
            }

            int price = FaceCatalog.ForgePrice(_draft, run.Config);
            _priceLabel.text = $"Dado de {DieData.TypeName(_draft.type)} - {price} moedas";
            _forgeButton.interactable = run.State.currency >= price;
        }

        // Paga e guarda o dado novo na bolsa.
        private void Forge()
        {
            RunManager run = RunManager.Instance;
            if (run.TryForge(_draft.Clone()))
            {
                run.SaveNow();
                _menu.Refresh();
            }
        }
    }
}
```

### 6.4 `LoadoutPanel`

```csharp
// Caminho: Assets/_Project/Scripts/World/LoadoutPanel.cs
using TMPro;
using UnityEngine;
using CraftDice.Meta;
using CraftDice.UI;

namespace CraftDice.World
{
    // POR QUE: escolher quais dados da bolsa vão para a batalha, até 5
    // (Parte 1 §3.2). A bonfire é o lugar placeholder dessa escolha.
    // ESTRATÉGIA: uma linha por dado da bolsa. Clicar põe ou tira o dado da
    // mão, e quem garante o limite e a mão mínima é o RunManager.
    public class LoadoutPanel : MonoBehaviour
    {
        [SerializeField] private Transform _diceList;
        [SerializeField] private ListButton _listButtonPrefab;
        [SerializeField] private TMP_Text _headerLabel;

        // Reconstrói a lista de dados com a marca de "na mão".
        public void Refresh()
        {
            RunManager run = RunManager.Instance;
            RunState s = run.State;
            _headerLabel.text = $"Dados na batalha: {s.loadout.Count}/{run.Config.loadoutLimit}";

            ListButton.ClearChildren(_diceList);
            for (int i = 0; i < s.dice.Count; i++)
            {
                int index = i;
                bool inHand = s.loadout.Contains(i);
                ListButton button = Instantiate(_listButtonPrefab, _diceList);
                button.Setup((inHand ? "[X] " : "[  ] ") + s.dice[i].Describe(), true, () =>
                {
                    if (run.ToggleLoadout(index))
                    {
                        run.SaveNow();
                        Refresh();
                    }
                });
            }
        }
    }
}
```

### 6.5 Montar a bonfire na cena

1. Na `Area1`, crie `Bonfire` com **SpriteRenderer**, **CircleCollider2D** (**Is Trigger**) e o script `Bonfire`. Em **Spells Taught**, adicione `Spell_Potion` e `Spell_Reroll` (placeholder: outra bonfire ensina Fraqueza e Golpe Duplo).
2. No Canvas da `Area1`, crie `BonfireMenu` (objeto sempre ativo com o script) e, dentro dele, `Root`, um painel na tela toda que vai ser ligado e desligado. Dentro do `Root`:
   - `Status` (TMP), `RestButton` ("DESCANSAR"), `CloseButton` ("SAIR").
   - `SpellList`, com **Vertical Layout Group**.
   - `ForgePanel` (com o script): três botões de tipo, `FaceList` (Vertical Layout Group), `Price` (TMP) e `ForgeButton` ("FORJAR").
   - `LoadoutPanel` (com o script): `Header` (TMP) e `DiceList` (Vertical Layout Group).
3. Preencha os campos dos três scripts, usando o prefab `ListButton` da Fase 4 nos campos de prefab, e arraste o `BonfireMenu` para o campo **Menu** da `Bonfire`.
4. Duas bonfires usam o **mesmo** `BonfireMenu`.

> Por que o `BonfireMenu` fica sempre ativo e só o `Root` liga e desliga: um objeto desativado não roda `Awake`. Se o próprio `BonfireMenu` começasse desativado, os botões nunca seriam ligados.

### ✅ Checkpoint da Fase 6
- Encostar na bonfire abre o menu e o jogador para de andar. SAIR fecha o menu.
- Vença um Esqueleto, volte e DESCANSE: o HP enche, a cena recarrega e o Esqueleto está de volta.
- Com moeda suficiente, aprender a Poção a deixa marcada como "(aprendido)" e a moeda diminui. Na próxima batalha, o botão Poção aparece.
- Na forja, clicar numa face troca a face e o preço muda (ex.: um Ataque com 4 Críticos custa 5 + 3 × 12 = 41). Forjar adiciona o dado na lista da Mão.
- Na Mão, dá para tirar e pôr dados, mas nunca passar de 5 nem ficar com 0.

#### Problemas comuns
- **O menu abre de novo logo depois de Descansar:** é esperado no placeholder, porque o jogador renasce encostado na bonfire. Se incomodar, troque a abertura automática por um botão de interagir (a interação está **Em aberto** na Parte 1 §11).
- **`NullReferenceException` no `BonfireMenu.Refresh`:** o `Root` não é filho do objeto com o script `BonfireMenu`, ou algum campo ficou vazio no Inspector.

Próxima fase: **Áreas, Chefes e Fim da Run**: chefe que libera a próxima área, morte que apaga tudo e menu principal com Continuar.

---

# Parte 10 — Implementação Unity: Fase 7 (Áreas, Chefes e Fim da Run)

## Fase 7 — Áreas, Chefes e Fim da Run

> Objetivo desta fase: o ciclo roguelike completo. O menu principal começa ou continua a run, o chefe da área libera a passagem, o chefe final vence a run, e a morte apaga tudo e volta ao começo (Parte 1 §8, §9 e §12).

### 7.1 `AreaPortal`

```csharp
// Caminho: Assets/_Project/Scripts/World/AreaPortal.cs
using UnityEngine;
using CraftDice.Meta;

namespace CraftDice.World
{
    // POR QUE: a passagem para a próxima área, liberada só depois do chefe
    // (placeholder da Parte 1 §8).
    // ESTRATÉGIA: o portal aponta para o MapMonster do chefe na mesma cena.
    // Se o chefe já foi derrotado, o MapMonster se destrói no Start, e o Unity
    // passa a tratar a referência como null. Então "chefe == null" quer dizer
    // "caminho livre", sem precisar guardar nada a mais.
    [RequireComponent(typeof(Collider2D))]
    public class AreaPortal : MonoBehaviour
    {
        [SerializeField] private string _targetScene = "Area2";
        [SerializeField] private MapMonster _requiredBoss;

        // O jogador encostou: passa de área se o chefe já caiu.
        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!other.CompareTag("Player"))
            {
                return;
            }
            if (_requiredBoss != null)
            {
                Debug.Log("Derrote o chefe desta área primeiro.");
                return;
            }
            RunManager.Instance.GoToArea(_targetScene);
        }
    }
}
```

> Feedback na tela de "derrote o chefe primeiro" está **Em aberto** (HUD da exploração, Parte 1 §11). Por enquanto só aparece no Console.

### 7.2 Chefe

1. Coloque um `MapMonster` com **Definition = Monster_FallenKnight** no fim da `Area1`. Com uma área só no MVP do guia, ele é o chefe final (**Is Final Boss** marcado na Fase 1).
2. Para cada área nova (`Area2`, `Area3`...): duplique a cena `Area1` (**Ctrl+D** no Project), troque tiles e monstros, adicione a cena ao Build Profile e ponha um `AreaPortal` na área anterior apontando para ela, com **Required Boss** = o chefe daquela área.
3. Só o chefe da **última** área fica com **Is Final Boss** marcado. Os demais ficam só com **Is Boss**.

### 7.3 Menu principal e tela de fim de run

```csharp
// Caminho: Assets/_Project/Scripts/Meta/MainMenu.cs
using UnityEngine;
using UnityEngine.UI;

namespace CraftDice.Meta
{
    // POR QUE: a tela inicial. Continua a run salva (Parte 1 §12) ou começa
    // uma nova, que apaga a anterior.
    public class MainMenu : MonoBehaviour
    {
        [SerializeField] private Button _continueButton;
        [SerializeField] private Button _newRunButton;

        // Mostra Continuar só se houver run salva.
        private void Start()
        {
            _continueButton.gameObject.SetActive(SaveSystem.HasSave);
            _continueButton.onClick.AddListener(Continue);
            _newRunButton.onClick.AddListener(NewRun);
        }

        // Volta para a cena e a posição da run salva.
        private void Continue()
        {
            RunManager run = RunManager.Instance;
            run.LoadSceneSafe(run.State.currentScene);
        }

        // Apaga o save e começa do início do jogo.
        private void NewRun()
        {
            RunManager run = RunManager.Instance;
            SaveSystem.Delete();
            run.StartNewRun();
            run.SaveNow();
            run.LoadSceneSafe(run.Config.firstAreaScene);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/RunEndScreen.cs
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CraftDice.Meta
{
    // POR QUE: a tela depois da morte ou da vitória. Deixa claro que a run
    // acabou e que tudo foi perdido (Parte 1 §9).
    public class RunEndScreen : MonoBehaviour
    {
        [SerializeField] private TMP_Text _messageLabel;
        [SerializeField] private Button _menuButton;

        // Mostra a mensagem do RunManager e liga o botão de voltar ao menu.
        private void Start()
        {
            RunManager run = RunManager.Instance;
            _messageLabel.text = run.LastRunMessage;
            _menuButton.onClick.AddListener(() => run.LoadSceneSafe(run.Config.mainMenuScene));
        }
    }
}
```

1. Cena `MainMenu`: Canvas com título "CRAFT DICE", botões **CONTINUAR** e **NOVA RUN**, e um objeto com `MainMenu` ligando os dois.
2. Cena `RunEnd`: Canvas com um texto grande e o botão **MENU**, e um objeto com `RunEndScreen`.

### ✅ Checkpoint da Fase 7
- Começando pela `MainMenu`, sem save: só **NOVA RUN** aparece. Ela leva à `Area1` com HP 10 e os 3 dados iniciais.
- Feche o jogo no meio da `Area1` e abra de novo: **CONTINUAR** aparece e volta ao último ponto salvo, com os monstros derrotados ainda sumidos.
- O portal não deixa passar antes do chefe. Depois do chefe, deixa.
- Morrer numa batalha leva à `RunEnd` com "VOCE MORREU". Voltando ao menu, **CONTINUAR** leva a uma run nova (dados, feitiços e moeda zerados).
- Derrotar o chefe final leva à `RunEnd` com "VITORIA".

#### Problemas comuns
- **Depois de morrer, CONTINUAR aparece:** o `RunManager` grava a run nova ao fechar o app (`OnApplicationQuit`), então o "continuar" é uma run do zero. Não é bug, mas se a equipe quiser esconder o botão nesse caso, grave o save só depois do primeiro passo na `Area1`.
- **Fechei o jogo no meio da batalha e voltei encostado no monstro:** é o placeholder da Parte 1 §12. A batalha recomeça com o HP de antes dela (risco registrado como **Em aberto**).

Próxima fase: **Build e Próximos Passos**, com os builds de PC e mobile e o que falta decidir.

---

# Parte 11 — Implementação Unity: Fase 8 (Build e Próximos Passos)

## Fase 8 — Build e Próximos Passos

> Objetivo desta fase: builds jogáveis para PC e Mobile (Parte 1 §1) e uma lista clara do que vem depois do MVP.

### 8.1 Build de PC

1. **File → Build Profiles → Windows** (ou macOS) → **Switch Platform**.
2. Confira a Scene List com `MainMenu` primeiro e **Build**.
3. Teste o ciclo inteiro no executável: nova run → batalha → bonfire → forja → morte → menu.

### 8.2 Build de Mobile

1. **Android:** **Build Profiles → Android → Switch Platform**. Em **Player Settings**:
   - **Default Orientation = Landscape Left**, porque a UI da Fase 4 foi montada em 1920×1080. A orientação está **Em aberto**: retrato exigiria remontar o Canvas.
   - **Minimum API Level** conforme a política da Play Store vigente.
2. **iOS:** **Build Profiles → iOS → Switch Platform** e **Build**. Abra o projeto Xcode gerado num Mac para assinar e rodar.
3. No aparelho, confira:
   - o joystick virtual aparece e move o jogador;
   - os dados e botões têm tamanho bom para o dedo (mínimo de uns 80 px no Canvas de 1920×1080);
   - colocar o app em segundo plano e voltar não perde a run (é o `OnApplicationPause` do `RunManager`).

### 8.3 Próximos passos (dependem de decisões **Em aberto** da Parte 1)

- **Regras:** fechar os pontos do §14 da Parte 1. Quase todos são uma linha no `GameConfig` ou um `case` no `BattleEngine`.
- **Feitiços:** completar a lista ("e etc...") adicionando valores no enum `SpellEffect` e um `case` em `BattleEngine.CastSpell`.
- **Forja:** se a equipe decidir permitir tipos misturados, o `ForgePanel.CycleFace` passa a percorrer todas as faces, e a cor do `DieView` precisa de outra regra.
- **Monstros:** padrões de intenção mais ricos (aleatórios, condicionais ao HP) mudam só o `MonsterDefinition.IntentForRound`. Mecânicas de chefe pedem um novo campo e regras no `Resolve`.
- **Arte e áudio:** sprites em pixel art (Parte 1 §10), animação de rolagem dos dados, sons.
- **HUD da exploração:** HP e moeda sempre visíveis; aviso de "derrote o chefe primeiro".
- **Testes automáticos:** o `BattleEngine` é C# puro, então dá para portar o `BattleSmokeTest` para o **Test Framework** (Edit Mode) com sementes fixas.

### ✅ Checkpoint da Fase 8
- Existe um executável de PC que roda o ciclo completo sem o Editor.
- Existe um build de Android (ou iOS) que roda o mesmo ciclo usando só toque.

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
