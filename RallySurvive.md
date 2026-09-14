# GDD Completo + Guia de Implementação Unity

> Documento único reunindo os GDDs dos quatro jogos (RallySurvive, Navigation Expert, RaceLegenda, Street Legends), o guia passo a passo de implementação no Unity, e a visão futura de versão 3D topdown.

## Índice

1. [GDD Core (Compartilhado)](#parte-1--gdd-core-compartilhado)
2. [Variante: RallySurvive](#parte-2--variante-rallysurvive)
3. [Variante: Navigation Expert](#parte-3--variante-rallysurvive-navigation-expert)
4. [Variante: RaceLegenda](#parte-4--variante-racelegenda)
5. [Variante: Street Legends](#parte-5--variante-street-legends)
6. [Tabela de Divergências](#parte-6--tabela-de-divergências)
7. [Unity — Fase 0: Setup do Projeto](#parte-7--implementação-unity-fase-0-setup-do-projeto)
8. [Unity — Fase 1: Movimento do Carro](#parte-8--implementação-unity-fase-1-movimento-do-carro)
9. [Unity — Fase 2: Chevrons](#parte-9--implementação-unity-fase-2-chevrons)
10. [Unity — Fase 3: Pista e Limites](#parte-10--implementação-unity-fase-3-pista-e-limites)
11. [Unity — Fase 4: Timer e UI](#parte-11--implementação-unity-fase-4-timer-e-ui)
12. [Unity — Fase 5: Firebase Leaderboard](#parte-12--implementação-unity-fase-5-firebase-leaderboard)
13. [Unity — Fase 6: Build e Próximos Passos](#parte-13--implementação-unity-fase-6-build-e-próximos-passos)
14. [Visão Futura: Versão 3D Topdown](#parte-14--visão-futura-versão-3d-topdown)

---

# Parte 1 — GDD Core (Compartilhado)

## GDD Core — Franquia Rally (nome provisório)

> Documento vivo. Tudo aqui é compartilhado pelos 3 jogos: **RallySurvive**, **RallySurvive: Navigation Expert** e **RaceLegenda**.
> Cada jogo tem seu próprio documento de variante, que só descreve o que diverge deste Core.

---

### 1. Visão Geral

- **Gênero:** Corrida / Rally, topdown, pixel art 2D.
- **Pilar de design:** controle tenso e "orgânico" via mouse, onde a distância entre carro e cursor dita a velocidade — cria risco/recompensa constante (quanto mais rápido, mais longe o cursor precisa estar, mais difícil reagir a curvas).
- **Fantasia central:** pilotar no limite, sentindo a frenagem e aceleração através de um feedback visual claro (chevrons), sem HUD pesado de velocímetro.

### 2. Mecânica Principal — Movimento

- O carro se move em direção à posição do cursor do mouse.
- **Velocidade é proporcional à distância** entre o carro e o cursor: quanto mais longe o mouse está do carro, mais rápido ele acelera até o topo de velocidade da pista/carro.
- Distância mínima = velocidade mínima/parado; distância máxima (ou acima de um teto) = velocidade máxima.
- **Chevrons**: uma sequência de setas (chevrons) desenhada entre o carro e o cursor.
  - **Verde** → carro acelerando (cursor mais longe que a posição atual permite manter).
  - **Vermelho** → carro freando (cursor mais próximo do que a velocidade atual, ou movimento reverso relativo).
  - Quantidade/densidade de chevrons pode escalar com a intensidade da aceleração/frenagem (ex.: 1-2 chevrons = leve, 4-5 = intenso). *(a definir na prototipagem)*

#### Definições
- **Curva distância → velocidade: exponencial suave** (não linear). Perto da velocidade máxima, pequenas variações de distância mudam mais a velocidade — reforça a sensação de estar no limite/quase perdendo controle, que é o pilar central do jogo.
- **Input: mouse-only no MVP.** Acessibilidade via teclado ou controle fica para uma fase posterior, se fizer sentido.
- **Colisão com obstáculos: reduz velocidade bruscamente**, sem frear automaticamente o carro — o controle da frenagem continua 100% do jogador via posição do cursor.

### 3. Física do Carro

- Modelo simplificado top-down (sem simulação real de física de pneus, mas com:
  - Aderência/grip por tipo de terreno (asfalto, terra, gelo, neve).
  - Derrapagem ao sair da trajetória ideal em curvas fechadas ou em superfícies de baixo grip.
- Parâmetros por carro (se houver múltiplos carros no futuro): velocidade máxima, aceleração, frenagem, grip.

### 4. Estilo Visual

- Pixel art 2D, câmera topdown fixa (rotação de câmera a definir: segue o carro ou é fixa por pista?).
- Paleta e ambientação variam por pista/tema (ver documentos de variante).

### 5. HUD / UI Genérica

Comum a todos os jogos:
- Cronômetro (tempo da corrida atual).
- Indicador de posição/checkpoint (formato varia por jogo — ver variantes).
- Chevrons de aceleração/frenagem (sempre visíveis entre carro e cursor).

### 6. Backend — Firebase

- **Autenticação:** login (definir se anônimo, Google, ou both) para identificar o jogador nos rankings.
- **Leaderboards:** tempo por pista, ranqueado globalmente. Estrutura sugerida:
  ```
  /leaderboards/{jogo}/{pista}/{uid} → { tempo, nome, data, replayData? }
  ```
- **Dados compartilhados entre jogos:** perfil do jogador, carros desbloqueados (se houver progressão cross-game no futuro), estatísticas gerais.
- Considerar Firestore para leaderboards (queries ordenadas) + Realtime Database ou Firestore para estado de corrida ao vivo (necessário no multiplayer do RaceLegenda).

### 7. Regras de Corrida — Base

- Corrida é **reiniciada e o tempo zerado** caso o carro saia do traçado válido da pista (regra do RallySurvive original — variantes podem sobrescrever isso, ver documento do jogo 2 e 3).
- Objetivo padrão: menor tempo possível.

### 8. Áudio (genérico)

- Som de motor reagindo à velocidade (pitch sobe com aceleração).
- Som de derrapagem por tipo de terreno.
- Feedback sonoro ao sair da pista / bater checkpoint.

### 9. Sistema compartilhado entre jogos (visão de futuro)

- Como os 3 jogos podem convergir futuramente, manter:
  - Mesma nomenclatura de variáveis/sistemas entre os projetos (ex.: sempre chamar o sistema de chevrons de `ChevronGuide`, não variar nome por jogo).
  - Mesmo formato de dados de pista (waypoints, largura de pista, checkpoints) para que uma pista possa, em teoria, ser reaproveitada entre jogos.
  - Ver `04_TABELA_DIVERGENCIAS.md` para o que já diverge entre os três.

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*

---

# Parte 2 — Variante: RallySurvive

## Variante — RallySurvive (Jogo 1)

> Depende do `00_GDD_CORE.md`. Aqui só o que é específico deste jogo.

### Conceito
Corrida contrarrelógio em traçado fixo, tema "sobrevivência ao rally": 4 pistas temáticas, objetivo é bater o menor tempo do mundo em cada uma.

### Pistas (4 no lançamento)
1. **Deserto**
2. **Floresta**
3. **Gelo**
4. **Noturna**

**Definido:** todas as 4 pistas liberadas desde o início — jogo curto e focado em contrarrelógio, não faz sentido represar conteúdo atrás de progressão.

### Regra específica: Traçado
- A pista tem um **traçado definido** (não checkpoints soltos).
- Se o carro sair do traçado → **corrida reinicia e tempo zera** (regra herdada do Core, é a regra original deste jogo).

### Objetivo
- Menor tempo possível por pista.
- Sem posição/adversários na pista ao mesmo tempo — é contrarrelógio individual.

### Leaderboard (Firebase)
- Ranking global por pista (menor tempo).
- Estrutura: `/leaderboards/rallysurvive/{pista}/{uid}`

### HUD específico
- Cronômetro visível.
- Melhor tempo pessoal e/ou tempo do 1º colocado global, para comparação em tempo real *(a definir se cabe no MVP)*.

### Ghost Replay
**Definido:** ghost contra o **próprio recorde pessoal** no MVP. Ghost do recorde mundial fica para uma v2 — exige mais trabalho de sincronismo/armazenamento de replay no Firebase.

---

# Parte 3 — Variante: RallySurvive Navigation Expert

## Variante — RallySurvive: Navigation Expert (Jogo 2)

> Depende do `00_GDD_CORE.md`. Aqui só o que é específico deste jogo.

### Conceito
Evolução do jogo 1: ao invés de traçado fixo, a corrida é guiada por **checkpoints** espalhados no mapa aberto, no estilo das corridas de rua do GTA.

### Regra específica: Checkpoints
- Não existe "sair da pista" (não há traçado fixo) — existe **passar ou não pelo próximo checkpoint** dentro de uma área/mapa mais livre.
- Substitui a regra de reinício do Jogo 1: aqui o fracasso não é sair da pista, é o design de navegação.
- **Definido: sem penalidade explícita** por ir longe do caminho ideal — errar a rota simplesmente consome mais tempo (o próprio relógio correndo já é a punição). Não existe timeout, expiração de checkpoint ou perda de progresso.

### Navegação / Guia ao jogador
- **Minimapa** no canto inferior da tela, mostrando a posição do próximo checkpoint.
- Ao passar por um checkpoint, uma **seta direcional aparece na tela por um tempo curto**, indicando a direção do próximo checkpoint (depois desaparece, forçando o jogador a usar o minimapa).

### Objetivo
- Ainda contrarrelógio (herda do Core), mas agora a rota entre checkpoints pode ter variações de trajeto escolhidas pelo próprio jogador (mapa mais aberto).

### Leaderboard (Firebase)
- Ranking global por percurso/mapa.
- Estrutura: `/leaderboards/navigationexpert/{mapa}/{uid}`

### Guia direcional — timing
- A seta aparece por **1.5s** após passar cada checkpoint e some, forçando o uso do minimapa em seguida.
- Se o jogador ficar muito tempo sem se aproximar do próximo checkpoint (ex.: ~8s sem progresso na direção certa), a seta **reaparece brevemente** como assistência extra.

### Em aberto
- Quantos checkpoints por mapa / quantos mapas no lançamento?

---

# Parte 4 — Variante: RaceLegenda

## Variante — RaceLegenda (Jogo 3)

> Depende do `00_GDD_CORE.md`. Aqui só o que é específico deste jogo.

### Conceito
Corrida em **circuito fechado**, estética de Fórmula 1 anos 60/70, com volta(s) e agora **multiplayer**.

### Circuito
- Circuito fechado (largada = chegada), estilo F1 vintage.
- **2 a 3 voltas** por corrida (varia por circuito).

### Modo Multiplayer
- Múltiplos jogadores na mesma corrida, ao mesmo tempo (real-time via Firebase — provavelmente Realtime Database ou Firestore com listeners para posição dos carros).
- *(a definir: quantos jogadores por sala? matchmaking ou lobby com amigos? assíncrono via fantasmas ou síncrono de verdade?)*

### Assistência ao carro ("ajudar o carro como na F1")
- **Definido:** ajuste de **setup do carro** entre voltas (ou entre etapas da corrida), inspirado nos ajustes de F1.
  - Parâmetros candidatos: ângulo de asa (mais downforce = mais grip em curva / menos velocidade máxima em reta), balanço de freio (mais freio na frente = mais força de frenagem / mais risco de travar e derrapar).
  - Interação: painel simples de pré-corrida, com 2-3 sliders no máximo — não precisa ser uma simulação complexa de engenharia.
  - **Definido:** setup ajustado **uma única vez antes da corrida**, sem pit lane nem reajuste entre voltas. Mantém o escopo simples (sem necessidade de simular pit stop, sem parar o carro no meio da corrida).

### Diferenças de regra de pista — Corte de pista
- **Definido:** sem penalidade artificial de tempo. Sair da pista já reduz drasticamente a velocidade (grip baixo fora do asfalto), e essa perda de tempo natural é a única punição — sem delay adicional, sem anular volta.
- **Detecção:** zona física delimitada ao redor do circuito (área válida de pista + acostamento). Fora dessa zona, aplica-se o modificador de grip reduzido definido no Core (física do carro por terreno). Não há gradação "leve vs. significativo" — é uma única regra de física, consistente com o resto do jogo.

### Objetivo
- Multiplayer: posição de chegada entre os jogadores da sala.
- Ainda pode manter modo solo contrarrelógio (herdado do Core) como modo separado.

### Leaderboard (Firebase)
- Ranking de melhor volta / melhor tempo total por circuito (modo solo).
- Dados de partida multiplayer (histórico de corridas, posições) — estrutura separada do leaderboard de tempo solo.

### Em aberto (prioridade alta antes de detalhar mais)
- Estrutura de sala multiplayer (quantos jogadores, como sincronizar posição em tempo real com baixa latência via Firebase).

---

# Parte 5 — Variante: Street Legends

## Variante — Street Legends (Jogo 4)

> Depende do `00_GDD_CORE.md`. Reaproveita a base de navegação do Navigation Expert (Jogo 2) e o conceito de carro customizável do RaceLegenda (Jogo 3), com tema de corridas de rua noturnas e fuga da polícia.

### Conceito
Corridas de rua ilegais, à noite, em carros modificados — o jogador corre contra o tempo/adversários enquanto tenta não ser pego pela polícia.

### Estrutura da pista
- **Definido:** igual ao Navigation Expert — **rota aberta com checkpoints**, sem traçado fixo.
- Reaproveita diretamente: minimapa no canto inferior mostrando o próximo checkpoint, seta direcional temporária (1.5s) após cada checkpoint.
- Tema noturno: iluminação baixa, faróis do carro como elemento visual/atmosférico (e possivelmente de gameplay — ver seção de "em aberto").

### Mecânica de Polícia
- **Definido — condição de falha:** se a polícia alcança o jogador, a **corrida termina e reinicia** (mesmo comportamento de sair da pista no RallySurvive) — reforça a tensão de "corrida ilegal", diferente da punição só por física usada no RaceLegenda.
- **Definido — detecção:** raio de detecção por tempo. Se uma viatura fica dentro de um raio X ao redor do carro por mais de Y segundos seguidos, o jogador é "pego" e a corrida reinicia. (Parâmetros exatos de raio/tempo a calibrar em prototipagem, ex.: raio de 3 unidades por 2s contínuos.)
- **Definido — escalonamento:** a intensidade escala com o **tempo de corrida** — quanto mais tempo o jogador leva pra terminar, mais viaturas entram na perseguição. Isso cria pressão adicional pra terminar rápido, reforçando o objetivo contrarrelógio do Core.
- **Em aberto para prototipagem:** curva exata de escalonamento (ex.: 1 viatura no início, +1 a cada 30s?) e comportamento de IA das viaturas (perseguem em linha reta, ou também seguem os checkpoints/ruas?).

### Carros Modificados
- **Definido:** sistema **visual + desempenho**, diferente do setup temporário de corrida do RaceLegenda — aqui a customização é pensada como **progressão permanente** (estilo "garagem"), já que o tema é carro modificado/tunado, não setup de F1 pontual.
  - **Visual:** pintura, body kit, rodas, adesivos — puramente cosmético, sem afetar stats.
  - **Desempenho:** upgrades de motor/turbo, suspensão, freio — modificam permanentemente `maxSpeed`, aceleração, grip do `CarController` (ver Core), diferente dos sliders temporários de setup do RaceLegenda que resetam a cada corrida.
- **Definido — progressão:** modelo **híbrido**.
  - **Moeda:** ganha ao completar corridas (mais moeda por tempo melhor / por escapar da polícia com sucesso), gasta para comprar peças de upgrade e itens visuais na garagem.
  - **Desbloqueios por progresso:** certas peças/visuais ficam bloqueadas até o jogador atingir marcos (ex.: completar X corridas, vencer determinado mapa) — evita que o jogador "compre tudo" cedo demais e dá sensação de evolução de tunador ao longo do jogo.
- **Em aberto:**
  - Existe uma tela de "Garagem" dedicada fora das corridas? (provavelmente sim, dado o sistema híbrido definido — a definir o layout/fluxo exato)
  - Quantidade e categorias de peças no MVP (ex.: 3 categorias de desempenho x 3 níveis cada, pra começar simples)?

### Objetivo
- Reaproveita o objetivo contrarrelógio do Core (checkpoints, tempo), com a camada extra de risco da polícia.
- **Definido:** **solo no lançamento/MVP**, com **multiplayer planejado para uma fase futura** (mesmo padrão de evolução do RaceLegenda, mas não bloqueia o desenvolvimento inicial). Ao desenhar a arquitetura de dados no Firebase, vale já deixar espaço para isso (ex.: não amarrar tudo em suposições 100% single-player), mas a implementação do multiplayer em si fica para depois do MVP solo.

### Leaderboard (Firebase)
- Ranking global por rota/mapa, mesmo padrão dos outros jogos.
- Estrutura: `/leaderboards/streetlegends/{mapa}/{uid}`
- Dado extra a considerar: se guarda ou não o "nível de procurado" atingido como métrica secundária (ex.: bônus por completar com polícia mais agressiva).

### Em aberto (prioridade alta antes de detalhar mais)
- Curva exata de escalonamento das viaturas (quantas, a cada quanto tempo) e comportamento de IA (perseguição livre vs. seguindo ruas/checkpoints).
- Layout/fluxo da tela de Garagem e quantidade de categorias de peças no MVP.
- Faróis/visibilidade noturna: é só estética ou afeta gameplay (ex.: reduz alcance de visão do jogador)?

---

# Parte 6 — Tabela de Divergências

## Tabela de Divergências entre os Jogos

> Útil caso, no futuro, os quatro jogos se unifiquem em um só — mostra exatamente onde cada um diverge do Core.

| Sistema                              | RallySurvive                               | Navigation Expert                                      | RaceLegenda                                                  | Street Legends                                                       |
| ------------------------------------ | ------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------- |
| **Estrutura da pista**               | Traçado fixo definido                      | Mapa aberto + checkpoints                              | Circuito fechado (voltas)                                    | Mapa aberto + checkpoints                                            |
| **Regra de falha**                   | Sai do traçado → reinicia tudo, tempo zera | Sem "sair da pista"; navegação livre entre checkpoints | Corte de pista → sem penalidade artificial, só perda de grip | Polícia alcança → reinicia tudo, tempo zera                          |
| **Guia ao jogador**                  | Nenhum (traçado visível guia sozinho)      | Minimapa + seta temporária pós-checkpoint              | Provavelmente racing line / HUD de volta                     | Minimapa + seta temporária pós-checkpoint (igual Navigation Expert)  |
| **Modo de jogo**                     | Solo, contrarrelógio                       | Solo, contrarrelógio                                   | Multiplayer + solo                                           | Solo no MVP; multiplayer planejado para o futuro                     |
| **Voltas**                           | 1 (ponto A a B)                            | 1 (rota entre checkpoints)                             | 2-3 voltas, circuito fechado                                 | 1 (rota entre checkpoints)                                           |
| **Ajuda/Customização do carro**      | Não                                        | Não                                                    | Setup temporário (asas/freio), só antes da corrida           | Customização permanente (visual + desempenho), estilo garagem        |
| **Penalidade por erro de trajeto**   | Reinício total + tempo zerado              | Nenhuma, só demora mais                                | Nenhuma — perda de grip/velocidade fora da pista já pune     | Nenhuma por errar rota — mas polícia pode alcançar nesse tempo extra |
| **Ameaça externa (perseguição)**     | Não                                        | Não                                                    | Não                                                          | Sim — polícia, com regras de detecção/escalonamento a definir        |
| **Firebase - dado principal**        | Tempo por pista                            | Tempo por mapa                                         | Tempo por circuito + estado de partida multiplayer           | Tempo por mapa + progresso de customização/garagem                   |
| **Nº de pistas/mapas no lançamento** | 4 (deserto, floresta, gelo, noturna)       | A definir                                              | A definir                                                    | A definir                                                            |

### Observação para unificação futura
Se um dia estes 4 jogos virarem "modos" de um único jogo, os candidatos naturais a variável de configuração por modo seriam:
- Tipo de guia de pista (traçado / checkpoint livre / circuito com volta)
- Regra de falha (reinício total / sem falha / penalidade)
- Ativação de multiplayer (on/off)
- Ativação do sistema de assistência/customização do carro (on/off, temporário vs. permanente)
- Ativação de ameaça externa perseguindo o jogador (on/off) — novo ponto trazido pelo Street Legends

Manter esses 5 pontos como "flags" desde já no código ajuda muito nessa convergência futura.

---

# Parte 7 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: ter o Unity instalado, projeto criado, e a estrutura de pastas pronta antes de escrever qualquer script.

### 0.1 Instalar o Unity

1. Baixe o **Unity Hub** em unity.com/download.
2. Dentro do Hub, na aba **Installs**, clique **Install Editor** e escolha a versão **LTS mais recente** (ex.: 2022 LTS ou 6 LTS — qualquer LTS serve, evite versões "Beta"/"Tech Stream" sendo iniciante).
3. Na tela de módulos, marque:
   - **Build Support** da sua plataforma alvo (Windows/Mac + WebGL, se pensa em publicar no navegador).

### 0.2 Criar o projeto

1. No Hub, aba **Projects** → **New Project**.
2. Escolha o template **2D (Core)** (não "2D URP" por enquanto — menos complexidade pra quem tá começando; dá pra migrar depois se precisar).
3. Nome do projeto: `RallySurvive`.
4. Clique **Create Project** e espere abrir o Editor.

### 0.3 Estrutura de pastas (dentro de `Assets/`)

Assim que abrir, crie esta estrutura na janela **Project** (botão direito → Create → Folder):

```
Assets/
  _Project/
    Scripts/
      Car/
      Track/
      UI/
      Firebase/
    Sprites/
      Car/
      Tracks/
      UI/
    Scenes/
    Prefabs/
    Materials/
    Tilemaps/
```

> Dica: o prefixo `_Project` (com underline) faz sua pasta ficar sempre no topo da lista, separada das pastas de packages/plugins.

### 0.4 Criar a primeira cena

1. Em `Assets/_Project/Scenes/`, botão direito → **Create → Scene**. Nomeie `RaceDesert`.
2. Dê duplo clique pra abrir.
3. Salve o projeto (`Ctrl+S` / `Cmd+S`).

### 0.5 Pacotes necessários (Window → Package Manager)

Instale agora, mesmo que só use mais adiante (evita interromper o fluxo depois):

- **Input System** (com.unity.inputsystem) — vamos usar pra ler a posição do mouse de forma moderna.
- **TextMeshPro** (geralmente já vem, ou é oferecido num popup na primeira vez que você usa texto — aceite o import de "TMP Essentials").
- **2D Pixel Perfect** (com.unity.2d.pixel-perfect) — essencial pra pixel art não ficar borrada/tremida.
- **2D Tilemap Editor** (com.unity.2d.tilemap) — pra desenhar as pistas.

#### Ativar o novo Input System
`Edit → Project Settings → Player → Other Settings → Active Input Handling` → mude para **Input System Package (New)** ou **Both** (mais seguro para iniciante, evita quebrar packages antigos). O Unity vai pedir pra reiniciar o Editor — aceite.

### ✅ Checkpoint da Fase 0
- Projeto abre sem erros.
- Estrutura de pastas criada.
- Cena `RaceDesert` existe e está salva.
- Package Manager mostra Input System, TextMeshPro, Pixel Perfect e Tilemap instalados.

Próxima fase: **01_CARRO_MOVIMENTO.md** — vamos fazer o carro se mover em direção ao mouse.

---

# Parte 8 — Implementação Unity: Fase 1 (Movimento do Carro)

## Fase 1 — Movimento do Carro

> Objetivo: o carro se move em direção ao cursor, e a velocidade cresce (de forma exponencial) quanto mais longe o cursor estiver.

### 1.1 Criar o GameObject do carro

1. Na Hierarchy, botão direito → **2D Object → Sprite → Square** (placeholder — depois trocamos pelo sprite pixel art real).
2. Renomeie para `Car`.
3. Adicione componentes (botão **Add Component** no Inspector):
   - **Rigidbody2D** → mude `Body Type` para `Dynamic`, `Gravity Scale` para `0` (é topdown, sem gravidade), e marque `Interpolate` como `Interpolate` (deixa o movimento mais suave visualmente).
   - **Box Collider 2D** (ou Circle, se o sprite for redondo).

### 1.2 Script: `CarController.cs`

Crie em `Assets/_Project/Scripts/Car/CarController.cs`:

```csharp
using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Rigidbody2D))]
public class CarController : MonoBehaviour
{
    [Header("Speed")]
    [SerializeField] private float maxSpeed = 8f;
    [SerializeField] private float minDistanceForMovement = 0.3f; // below this, car stops
    [SerializeField] private float maxDistanceForTopSpeed = 6f;   // above this, already at top speed
    [SerializeField] private AnimationCurve speedCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);
    // ^ smooth exponential curve, editable in the Inspector (see section 1.4)

    [Header("Rotation")]
    [SerializeField] private float rotationSpeed = 10f;

    private Rigidbody2D rb;
    private Camera mainCamera;
    private Vector2 mouseWorldPos;

    // Exposed so other systems (e.g. ChevronGuide) can read the current state
    public float CurrentSpeedNormalized { get; private set; } // 0 to 1
    public bool IsAccelerating { get; private set; }
    public bool IsBraking { get; private set; }

    private float previousSpeedNormalized;

    void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        mainCamera = Camera.main;
    }

    void Update()
    {
        // Reads the mouse position in world space (not screen space)
        Vector2 mouseScreenPos = Mouse.current.position.ReadValue();
        mouseWorldPos = mainCamera.ScreenToWorldPoint(mouseScreenPos);
    }

    void FixedUpdate()
    {
        Vector2 toMouse = mouseWorldPos - (Vector2)transform.position;
        float distance = toMouse.magnitude;

        // 1. Normalize the distance between 0 and 1
        float t = Mathf.InverseLerp(minDistanceForMovement, maxDistanceForTopSpeed, distance);
        t = Mathf.Clamp01(t);

        // 2. Apply the curve (smooth exponential) to get the final speed
        float speedT = speedCurve.Evaluate(t);
        float targetSpeed = speedT * maxSpeed;

        // 3. Move the car towards the mouse
        if (distance > minDistanceForMovement)
        {
            Vector2 direction = toMouse.normalized;
            rb.linearVelocity = direction * targetSpeed;

            // Smoothly rotate the car to "look" in the direction of movement
            float targetAngle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg - 90f;
            float angle = Mathf.LerpAngle(rb.rotation, targetAngle, rotationSpeed * Time.fixedDeltaTime);
            rb.MoveRotation(angle);
        }
        else
        {
            rb.linearVelocity = Vector2.zero;
        }

        // 4. Update public state (for the chevrons to read)
        CurrentSpeedNormalized = speedT;
        IsAccelerating = speedT > previousSpeedNormalized + 0.001f;
        IsBraking = speedT < previousSpeedNormalized - 0.001f;
        previousSpeedNormalized = speedT;
    }
}
```

> ⚠️ Nota de versão: `rb.linearVelocity` é o nome usado no Unity 6 / 2023.x+. Se você estiver numa versão mais antiga (2022 LTS), troque por `rb.velocity` (mesma coisa, nome antigo).

### 1.3 Configurar no Inspector

1. Arraste o script pro GameObject `Car`.
2. Ajuste valores iniciais sugeridos:
   - `Max Speed`: 8
   - `Min Distance For Movement`: 0.3
   - `Max Distance For Top Speed`: 6
   - `Rotation Speed`: 10

### 1.4 Configurar a curva exponencial suave

No Inspector, clique no campo `Speed Curve` (abre um editor gráfico de curva):
1. Clique com botão direito no ponto do canto inferior esquerdo (0,0) → **Left Tangent / Right Tangent → Linear**, depois ajuste para algo que comece bem raso e suba rápido no final — ou mais simples:
2. Clique com botão direito em qualquer ponto vazio da curva → **Ease In** já dá uma curva que começa devagar e acelera, que é a sensação que queremos (resposta mais "explosiva" perto do máximo).

Se preferir 100% via código sem mexer no Inspector, troque a linha da curva por:
```csharp
float speedT = t * t; // simple quadratic curve, same "smooth exponential" effect
```

### ✅ Checkpoint da Fase 1
- Dar Play, mover o mouse longe do carro → carro acelera na direção dele.
- Aproximar o mouse do carro → carro desacelera e para.
- Movimento parece suave, sem tremer.

### Testando rápido
Adicione temporariamente um `Debug.Log($"Speed: {CurrentSpeedNormalized}, Accel: {IsAccelerating}, Brake: {IsBraking}");` dentro do `FixedUpdate` pra confirmar que os valores mudam como esperado antes de seguir pra fase dos chevrons.

Próxima fase: **02_CHEVRONS.md** — desenhar as setas verdes/vermelhas entre carro e cursor.

---

# Parte 9 — Implementação Unity: Fase 2 (Chevrons)

## Fase 2 — Sistema de Chevrons

> Objetivo: desenhar uma fileira de setas entre o carro e o cursor, verdes se acelerando, vermelhas se freando.

### 2.1 Criar o sprite/prefab do chevron

1. Por enquanto, crie um sprite simples: `2D Object → Sprite → Triangle` (serve de placeholder de seta — depois troca pelo pixel art).
2. Renomeie para `ChevronArrow`.
3. Arraste esse GameObject da Hierarchy pra pasta `Assets/_Project/Prefabs/` — isso cria um **Prefab**.
4. Delete o objeto da Hierarchy (já está salvo como prefab, não precisa dele na cena).

### 2.2 Script: `ChevronGuide.cs`

Crie em `Assets/_Project/Scripts/Car/ChevronGuide.cs`:

```csharp
using UnityEngine;
using UnityEngine.InputSystem;
using System.Collections.Generic;

public class ChevronGuide : MonoBehaviour
{
    [SerializeField] private CarController car;
    [SerializeField] private GameObject chevronPrefab;
    [SerializeField] private int maxChevrons = 5;
    [SerializeField] private float spacing = 0.8f; // distance between each chevron
    [SerializeField] private Color accelerateColor = Color.green;
    [SerializeField] private Color brakeColor = Color.red;

    private Camera mainCamera;
    private List<GameObject> pool = new List<GameObject>();

    void Awake()
    {
        mainCamera = Camera.main;

        // Object pool: creates all chevrons upfront and enables/disables them as needed
        // (avoids Instantiate/Destroy every frame, which is expensive)
        for (int i = 0; i < maxChevrons; i++)
        {
            GameObject chevron = Instantiate(chevronPrefab, transform);
            chevron.SetActive(false);
            pool.Add(chevron);
        }
    }

    void Update()
    {
        Vector2 mouseScreenPos = Mouse.current.position.ReadValue();
        Vector2 mouseWorldPos = mainCamera.ScreenToWorldPoint(mouseScreenPos);
        Vector2 carPos = car.transform.position;

        Vector2 direction = (mouseWorldPos - carPos);
        float distance = direction.magnitude;
        direction.Normalize();

        // How many chevrons to show depends on intensity (accelerating or braking)
        int chevronsToShow = Mathf.Clamp(
            Mathf.FloorToInt(distance / spacing),
            0,
            maxChevrons
        );

        Color color = car.IsBraking ? brakeColor : accelerateColor;

        for (int i = 0; i < pool.Count; i++)
        {
            if (i < chevronsToShow)
            {
                pool[i].SetActive(true);
                Vector2 pos = carPos + direction * (spacing * (i + 1));
                pool[i].transform.position = pos;

                float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg - 90f;
                pool[i].transform.rotation = Quaternion.Euler(0, 0, angle);

                var sr = pool[i].GetComponent<SpriteRenderer>();
                if (sr != null) sr.color = color;
            }
            else
            {
                pool[i].SetActive(false);
            }
        }
    }
}
```

### 2.3 Configurar na cena

1. Crie um GameObject vazio na Hierarchy: `Create Empty` → renomeie `ChevronGuide`.
2. Arraste o script `ChevronGuide.cs` nele.
3. No Inspector, arraste:
   - `Car` → o GameObject `Car` da cena.
   - `Chevron Prefab` → o prefab `ChevronArrow` criado no passo 2.1.
4. Ajuste `Max Chevrons` (5) e `Spacing` (0.8) conforme o tamanho da sua cena/sprites.

### ✅ Checkpoint da Fase 2
- Dar Play: mover o mouse para longe do carro → aparecem chevrons **verdes** entre carro e cursor.
- Mover o mouse rapidamente pra perto do carro (fazendo ele desacelerar) → chevrons ficam **vermelhos**.
- Quantidade de chevrons aumenta com a distância.

#### Problemas comuns
- **Chevrons não aparecem:** confirme que o prefab tem um `SpriteRenderer` visível e que a `Sorting Layer`/`Order in Layer` está acima do chão da pista.
- **Chevrons ficam grudados no lugar errado:** confira se `car.transform.position` está pegando a posição certa (Z=0 no 2D).

Próxima fase: **03_PISTA_E_LIMITES.md** — desenhar a pista com Tilemap e detectar quando o carro sai dela.

---

# Parte 10 — Implementação Unity: Fase 3 (Pista e Limites)

## Fase 3 — Pista (Tilemap) e Detecção de Saída da Pista

> Objetivo: desenhar a pista com Tilemap e detectar quando o carro sai do traçado válido, disparando o reinício da corrida.

### 3.1 Criar a Tilemap

1. Hierarchy → botão direito → **2D Object → Tilemap → Rectangular**. Isso cria automaticamente um `Grid` com uma `Tilemap` dentro.
2. Renomeie a Tilemap para `Tilemap_Track`.
3. Abra a janela **Window → 2D → Tile Palette**.
4. Clique **Create New Palette**, nomeie `Palette_Desert`, salve em `Assets/_Project/Tilemaps/`.
5. Arraste seus sprites de tile (chão de pista, terreno fora da pista) para dentro da Tile Palette — isso gera os "Tiles" que você pode pintar.
6. Com um tile selecionado na paleta, use a ferramenta de pincel (ícone de lápis) pra pintar o traçado da pista direto na cena.

> Enquanto não tiver os sprites finais de pixel art, use cores sólidas simples (ex: cinza para pista, verde para fora) só para testar a lógica.

### 3.2 Estratégia de detecção: zona válida vs. fora da pista

A forma mais simples pra iniciante (e é a mesma abordagem que vamos usar no RaceLegenda depois): criar um **collider de trigger** que cobre toda a área **fora** da pista (ou, alternativamente, um collider que cobre a pista e detectar quando o carro *sai* dele).

**Abordagem recomendada: "zona válida" com Polygon Collider 2D.**

1. Crie um GameObject vazio: `Create Empty` → renomeie `TrackValidZone`.
2. Adicione componente **Polygon Collider 2D**.
3. Marque a opção **Is Trigger** ✅.
4. Edite os pontos do polígono (no Inspector, botão **Edit Collider**, ou arrastando os pontos verdes na Scene view) para desenhar o contorno exato da pista, seguindo o visual da Tilemap.

> Dica: para pistas mais complexas (com curvas), você pode ter vários `Polygon Collider 2D` compostos, ou usar um único collider com múltiplos "paths" (o Polygon Collider 2D do Unity suporta múltiplos contornos no mesmo componente).

### 3.3 Script: `TrackBoundary.cs`

Crie em `Assets/_Project/Scripts/Track/TrackBoundary.cs` e coloque no `TrackValidZone`:

```csharp
using UnityEngine;

public class TrackBoundary : MonoBehaviour
{
    void OnTriggerExit2D(Collider2D other)
    {
        if (other.CompareTag("Car"))
        {
            RaceManager.Instance.OnCarLeftTrack();
        }
    }
}
```

### 3.4 Marcar o carro com a Tag correta

1. Selecione o GameObject `Car`.
2. No topo do Inspector, campo `Tag` → **Add Tag...** → crie a tag `Car`.
3. Volte no `Car`, selecione a tag `Car` recém-criada.

### 3.5 Script: `RaceManager.cs` (gerencia o estado da corrida)

Crie em `Assets/_Project/Scripts/Track/RaceManager.cs`:

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;

public class RaceManager : MonoBehaviour
{
    public static RaceManager Instance { get; private set; }

    [SerializeField] private float elapsedTime;
    public float ElapsedTime => elapsedTime;
    public bool RaceActive { get; private set; } = true;

    void Awake()
    {
        // Simple singleton pattern: ensures only one RaceManager exists in the scene
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    void Update()
    {
        if (RaceActive)
        {
            elapsedTime += Time.deltaTime;
        }
    }

    public void OnCarLeftTrack()
    {
        Debug.Log("Car left the track! Restarting race...");
        RaceActive = false;
        // Simple restart: reloads the entire scene.
        // (Later this can be optimized by resetting only the car position and timer,
        // without reloading the scene — but for the MVP, reloading is the simplest, bug-free approach.)
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }
}
```

1. Crie um GameObject vazio `RaceManager` na Hierarchy e arraste o script nele.

### ✅ Checkpoint da Fase 3
- Dar Play, guiar o carro para fora dos limites do `TrackValidZone` → a cena recarrega (reinício) e aparece o log no Console.
- Guiar o carro dentro da pista normalmente → nada acontece, corrida continua.

#### Problemas comuns
- **`OnTriggerExit2D` nunca dispara:** confirme que o `Car` tem um **Collider2D** (não só o Rigidbody2D) e que pelo menos um dos dois colliders envolvidos (carro ou zona) **não** está marcado como trigger simultaneamente de forma que ambos sejam triggers — Unity exige que pelo menos um Rigidbody2D esteja envolvido para eventos de trigger funcionarem (o do carro já resolve isso).
- **Carro "atravessa" a borda sem detectar:** se o carro estiver muito rápido, ative `Collision Detection = Continuous` no Rigidbody2D do carro (`Rigidbody2D → Collision Detection`).

Próxima fase: **04_TIMER_UI.md** — cronômetro visível na tela e feedback de UI.

---

# Parte 11 — Implementação Unity: Fase 4 (Timer e UI)

## Fase 4 — Timer e UI

> Objetivo: mostrar o cronômetro na tela em tempo real, formatado como `00:00.00`.

### 4.1 Criar o Canvas e o texto

1. Hierarchy → botão direito → **UI → Canvas** (Unity cria automaticamente um `EventSystem` junto — deixe como está).
2. No `Canvas`, ajuste `Canvas Scaler → UI Scale Mode` para **Scale With Screen Size**, com `Reference Resolution` tipo `1920 x 1080` (evita a UI ficar em tamanhos diferentes em telas diferentes).
3. Dentro do Canvas, botão direito → **UI → Text - TextMeshPro** (se for a primeira vez, aceite importar o "TMP Essentials").
4. Renomeie para `TimerText`.
5. Posicione no canto superior (ex.: `Anchor` = top-center, `Pos Y` perto do topo).
6. Ajuste `Font Size` (ex.: 48) e alinhamento central.

### 4.2 Script: `TimerDisplay.cs`

Crie em `Assets/_Project/Scripts/UI/TimerDisplay.cs`:

```csharp
using UnityEngine;
using TMPro;

public class TimerDisplay : MonoBehaviour
{
    [SerializeField] private TMP_Text timerText;

    void Update()
    {
        float time = RaceManager.Instance.ElapsedTime;
        int minutes = Mathf.FloorToInt(time / 60f);
        int seconds = Mathf.FloorToInt(time % 60f);
        int centiseconds = Mathf.FloorToInt((time * 100f) % 100f);

        timerText.text = $"{minutes:00}:{seconds:00}.{centiseconds:00}";
    }
}
```

1. Arraste o script no `TimerText` (ou num objeto separado, se preferir organizar assim).
2. No Inspector, arraste o próprio componente `TMP_Text` do `TimerText` pro campo `Timer Text`.

### ✅ Checkpoint da Fase 4
- Dar Play → o cronômetro aparece no topo da tela e conta corretamente (`00:00.00`, `00:01.23`, etc.).
- Sair da pista → cena recarrega → cronômetro volta a zero (naturalmente, já que é recarregamento de cena completo).

### 4.3 (Opcional nesta fase) Tela de "corrida reiniciada"

Um toque simples de feedback: antes de recarregar a cena no `RaceManager.OnCarLeftTrack()`, você pode disparar um som ou um flash de tela vermelha rapidamente. Fica de nota para quando você já tiver os assets de áudio/UI prontos — não é bloqueante para seguir adiante.

Próxima fase: **05_FIREBASE_LEADERBOARD.md** — conectar o projeto ao Firebase e enviar/ler tempos do leaderboard global.

---

# Parte 12 — Implementação Unity: Fase 5 (Firebase Leaderboard)

## Fase 5 — Firebase: Leaderboard Global

> Objetivo: enviar o tempo do jogador para o Firestore ao final de uma corrida válida, e exibir o ranking dos melhores tempos da pista.

### 5.1 Criar o projeto no Firebase Console

1. Acesse console.firebase.google.com e faça login com sua conta Google.
2. **Add project** → nome `RallySurvive` → siga o assistente (pode desativar Google Analytics por enquanto, não é necessário pro MVP).
3. Dentro do projeto, vá em **Build → Firestore Database** → **Create database** → escolha modo **production** (vamos configurar regras de segurança manualmente) → escolha a região mais próxima do seu público.

### 5.2 Registrar o app Unity no Firebase

1. No console, ícone de engrenagem → **Project settings** → aba **General** → em "Your apps", clique no ícone correspondente à plataforma (Android/iOS/Web, dependendo de onde vai publicar primeiro).
2. Siga o passo a passo do console: ele vai gerar um arquivo de configuração (`google-services.json` para Android, `GoogleService-Info.plist` para iOS).

### 5.3 Importar o Firebase Unity SDK

1. Baixe o **Firebase Unity SDK** em firebase.google.com/download/unity.
2. No Unity, `Assets → Import Package → Custom Package`, selecione o `.unitypackage` de **Firestore** (dentro do SDK baixado — vem separado por produto: Auth, Firestore, Analytics, etc.).
3. Importe também o pacote de **Authentication** (vamos usar login anônimo, mais simples pra MVP).
4. Coloque o `google-services.json` (ou `.plist`) na raiz de `Assets/` (o SDK vai processá-lo automaticamente no build).
5. O Unity vai pedir pra resolver dependências automaticamente (**Assets → External Dependency Manager → Android Resolver → Resolve**, se estiver no Android). Aceite e espere terminar (pode demorar alguns minutos).

### 5.4 Script: `FirebaseBootstrap.cs` (inicialização)

Crie em `Assets/_Project/Scripts/Firebase/FirebaseBootstrap.cs`:

```csharp
using UnityEngine;
using Firebase;
using Firebase.Auth;
using Firebase.Firestore;

public class FirebaseBootstrap : MonoBehaviour
{
    public static FirebaseFirestore Db { get; private set; }
    public static FirebaseAuth Auth { get; private set; }
    public static bool IsReady { get; private set; }

    async void Awake()
    {
        DontDestroyOnLoad(gameObject);

        var dependencyStatus = await FirebaseApp.CheckAndFixDependenciesAsync();
        if (dependencyStatus != DependencyStatus.Available)
        {
            Debug.LogError($"Firebase not available: {dependencyStatus}");
            return;
        }

        Auth = FirebaseAuth.DefaultInstance;
        Db = FirebaseFirestore.DefaultInstance;

        // Anonymous login — each player gets a unique UID without creating an account
        if (Auth.CurrentUser == null)
        {
            var result = await Auth.SignInAnonymouslyAsync();
            Debug.Log($"Logged in anonymously: {result.User.UserId}");
        }

        IsReady = true;
    }
}
```

1. Crie um GameObject vazio `FirebaseBootstrap` na sua **primeira cena carregada** (idealmente uma cena de "boot"/menu que carrega antes das pistas) e arraste o script.

### 5.5 Script: `LeaderboardService.cs`

Crie em `Assets/_Project/Scripts/Firebase/LeaderboardService.cs`:

```csharp
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using Firebase.Firestore;
using Firebase.Auth;

public class LeaderboardEntry
{
    public string PlayerName;
    public float TimeSeconds;
}

public static class LeaderboardService
{
    public static async Task SubmitTime(string track, float timeSeconds, string playerName)
    {
        if (!FirebaseBootstrap.IsReady) return;

        string uid = FirebaseBootstrap.Auth.CurrentUser.UserId;
        DocumentReference docRef = FirebaseBootstrap.Db
            .Collection("leaderboards")
            .Document("rallysurvive")
            .Collection(track)
            .Document(uid);

        // Reads the player's current time before overwriting — only saves if it's better
        var snapshot = await docRef.GetSnapshotAsync();
        if (snapshot.Exists)
        {
            float existingTime = snapshot.GetValue<float>("timeSeconds");
            if (timeSeconds >= existingTime)
            {
                Debug.Log("Time is not better than the saved personal record — not updating.");
                return;
            }
        }

        var data = new Dictionary<string, object>
        {
            { "playerName", playerName },
            { "timeSeconds", timeSeconds },
            { "timestamp", Firebase.Firestore.Timestamp.GetCurrentTimestamp() }
        };

        await docRef.SetAsync(data);
        Debug.Log("Time successfully submitted to the leaderboard.");
    }

    public static async Task<List<LeaderboardEntry>> GetTopTimes(string track, int limit = 10)
    {
        var result = new List<LeaderboardEntry>();
        if (!FirebaseBootstrap.IsReady) return result;

        Query query = FirebaseBootstrap.Db
            .Collection("leaderboards")
            .Document("rallysurvive")
            .Collection(track)
            .OrderBy("timeSeconds")
            .Limit(limit);

        QuerySnapshot snapshot = await query.GetSnapshotAsync();
        foreach (DocumentSnapshot doc in snapshot.Documents)
        {
            result.Add(new LeaderboardEntry
            {
                PlayerName = doc.GetValue<string>("playerName"),
                TimeSeconds = doc.GetValue<float>("timeSeconds")
            });
        }
        return result;
    }
}
```

### 5.6 Chamar o envio de tempo ao final da corrida

No `RaceManager.cs` (da Fase 3), adicione um método pra chamar quando o jogador **completa** a pista (você vai precisar de um trigger de "linha de chegada", similar ao `TrackBoundary`, mas chamando `OnRaceFinished()` em vez de `OnCarLeftTrack()`):

```csharp
public async void OnRaceFinished()
{
    RaceActive = false;
    Debug.Log($"Race finished! Time: {ElapsedTime}");

    string playerName = "Player"; // later: pull from a name input or saved profile
    await LeaderboardService.SubmitTime("desert", ElapsedTime, playerName);
}
```

> Crie a linha de chegada como outro `Polygon Collider 2D` (ou `Box Collider 2D`) marcado `Is Trigger`, com um script simples parecido com `TrackBoundary.cs`, mas chamando `RaceManager.Instance.OnRaceFinished()` no `OnTriggerEnter2D`.

### 5.7 Regras de segurança do Firestore (importante!)

Sem regras, qualquer um pode escrever qualquer coisa no seu banco. No console, aba **Firestore → Rules**, configure algo assim como ponto de partida:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboards/{game}/{track}/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Isso garante que: qualquer um pode **ler** o ranking, mas só o próprio jogador (autenticado, mesmo anonimamente) pode escrever no **seu próprio** documento de tempo.

### ✅ Checkpoint da Fase 5
- Completar uma corrida → aparece no Console "Tempo enviado ao leaderboard com sucesso."
- Conferir no Firebase Console (Firestore Database) que o documento foi criado em `leaderboards/rallysurvive/desert/{your-uid}`.
- Chamar `LeaderboardService.GetTopTimes("desert")` (ex.: num script de teste temporário) e confirmar que retorna a lista ordenada.

#### Problemas comuns
- **Erro de dependências no Android:** rode `Assets → External Dependency Manager → Android Resolver → Resolve` de novo, e confira se `minSdkVersion` no Player Settings está alto o suficiente (Firebase geralmente exige 21+).
- **`PERMISSION_DENIED` ao escrever:** confira se o login anônimo (`SignInAnonymouslyAsync`) realmente aconteceu antes de tentar escrever — adicione um log ou breakpoint para confirmar.

Próxima fase: **06_BUILD_E_PROXIMOS_PASSOS.md** — gerar um build de teste e o que vem depois (UI de ranking, polish, e como isso se conecta ao GDD dos outros dois jogos).

---

# Parte 13 — Implementação Unity: Fase 6 (Build e Próximos Passos)

## Fase 6 — Build de Teste e Próximos Passos

### 6.1 Gerar um build de teste

1. `File → Build Settings`.
2. Clique **Add Open Scenes** para incluir sua cena atual.
3. Escolha a plataforma (recomendo **WebGL** ou **PC (Windows/Mac)** pra testar rápido sem precisar de dispositivo físico).
4. Clique **Build** e escolha uma pasta de saída (ex.: `Builds/`).
5. Rode o executável gerado (ou abra o `index.html` se for WebGL, via um servidor local — WebGL não roda direto do arquivo por restrições de CORS do navegador; use `File → Build and Run` que o Unity já cuida disso).

### 6.2 Checklist antes de considerar o MVP "pronto"

- [ ] Carro se move corretamente em direção ao mouse, com aceleração exponencial suave.
- [ ] Chevrons aparecem e mudam de cor corretamente (verde/vermelho).
- [ ] Sair da pista reinicia a corrida e zera o tempo.
- [ ] Cronômetro visível e correto.
- [ ] Ao cruzar a linha de chegada, tempo é enviado ao Firestore (se for melhor que o recorde pessoal).
- [ ] Regras de segurança do Firestore configuradas (não deixado em modo "aberto" por engano).

### 6.3 Ordem sugerida para as próximas 4 pistas

Depois que a pista Deserto estiver 100% funcional com esse pipeline:
1. Duplique a cena `RaceDesert` (`Ctrl+D` na Project window) e renomeie para `RaceForest`, `RaceIce`, `RaceNight`.
2. Troque só a Tilemap/sprites/paleta de cada uma — toda a lógica de script (`CarController`, `ChevronGuide`, `RaceManager`, `LeaderboardService`) já funciona sem mudanças, só muda o parâmetro `track` que você passa pro `LeaderboardService.SubmitTime(...)`.
3. Para a pista de **Gelo**, adicione um multiplicador de grip mais baixo no `CarController` (ex.: reduzir a força efetiva de mudança de direção) — é o primeiro ponto onde você vai reaproveitar o sistema pensando já no RaceLegenda (grip variável por terreno, que está no GDD Core).

### 6.4 Como isso conecta com os outros 2 jogos do GDD

- **Navigation Expert:** reaproveita 100% do `CarController` e `ChevronGuide` sem mudança. Você vai *trocar* o `TrackBoundary`/`RaceManager` por um sistema de checkpoints (novo script `CheckpointManager.cs`) e adicionar o minimapa + seta direcional — dá pra fazer uma sessão de implementação dedicada pra isso quando chegar a hora.
- **RaceLegenda:** também reaproveita `CarController`/`ChevronGuide`. As diferenças ficam em cima do `RaceManager` (múltiplas voltas, sem reinício ao sair — só perda de grip), mais o sistema de setup do carro e o multiplayer via Firebase Realtime Database (esse último é bem mais complexo — merece uma sessão de implementação própria, depois de fecharmos os detalhes de sala/sincronização que você quer discutir).

### 6.5 O que fica pra uma próxima sessão de implementação
- Trocar sprites placeholder pelo pixel art final + import settings corretos (Pixel Perfect Camera, filtro Point/no filter, Pixels Per Unit).
- Sistema de áudio (motor, derrapagem).
- UI de ranking (ler `GetTopTimes` e mostrar numa tela de "Resultados").
- Tela de menu principal / seleção de pista.

---

Isso fecha o pipeline completo do RallySurvive, do zero até o leaderboard funcionando. Quando quiser, seguimos com uma sessão só pra **Navigation Expert** (checkpoints + minimapa) ou pra fechar os detalhes de sala do multiplayer do RaceLegenda.

---

# Parte 14 — Visão Futura: Versão 3D Topdown

## Visão Futura — Versão 3D Topdown (Todos os Jogos)

> Esta seção é prospectiva: não faz parte do escopo imediato dos 4 jogos 2D, mas documenta a intenção e o caminho técnico para quando a franquia migrar (ou ganhar uma versão paralela) em 3D topdown, mantendo a mesma mecânica central do Core.

### Conceito

A mecânica de movimento (distância do mouse → velocidade, chevrons de aceleração/frenagem) é conceitualmente **independente de 2D ou 3D** — ela já opera sobre um plano (posição do carro vs. posição do cursor). Isso significa que migrar para 3D é, na essência, uma mudança de **apresentação e pipeline técnico**, não uma mudança de design. A ideia é que os 4 jogos (RallySurvive, Navigation Expert, RaceLegenda, Street Legends) ganhem eventualmente essa versão, todos reaproveitando o mesmo Core adaptado.

### O que muda vs. o que não muda

| Sistema | Muda na versão 3D? |
|---|---|
| Matemática da mecânica (distância → velocidade, curva exponencial) | **Não** — mesma fórmula, só troca de plano (XY → XZ) |
| Regra de falha por jogo (sair da pista, polícia, corte de pista) | **Não** — lógica de gameplay idêntica |
| Firebase / leaderboard | **Não** — nenhuma mudança, dado é o mesmo (tempo por pista/mapa) |
| Timer / UI de HUD | **Não** — Canvas 2D continua funcionando normalmente sobre câmera 3D |
| Renderização de carro/pista | **Sim** — sprites 2D viram modelos/meshes 3D |
| Câmera | **Sim** — de câmera 2D fixa para câmera 3D topdown (ortográfica ou perspectiva angulada) |
| Detecção de posição do mouse no mundo | **Sim** — de `ScreenToWorldPoint` direto para **raycast contra um plano** (ver Fase 3D-2) |
| Colisão de pista/trigger | **Sim, só o tipo de componente** — de `Collider2D`/`OnTriggerExit2D` para `Collider`/`OnTriggerExit`, lógica idêntica |
| Chevrons | **Sim, no rendering** — de sprite 2D simples para *billboard* (sprite/mesh que sempre encara a câmera) |

### Decisões de design a fechar antes de prototipar

- **Tipo de câmera:** recomendo começar com **ortográfica**, olhando quase reto para baixo (rotação X ≈ 80-90°). Mantém a leitura do jogo o mais parecida possível com a versão 2D (sem distorção de perspectiva, sem objetos "grandes" no fundo por estarem mais perto da câmera). Uma perspectiva mais angulada (tipo isométrico, X ≈ 45-60°) dá mais sensação de profundidade e "showcase" dos carros modificados (interessante pro Street Legends), mas muda a legibilidade da pista — vale prototipar as duas e comparar.
- **Pipeline de arte 3D:** baixo-poly estilizado costuma combinar bem com a origem pixel art (mantém a identidade visual "retrô/estilizada" da franquia) e é mais viável pra um time pequeno/iniciante em 3D do que buscar realismo.

### Guia de Implementação Unity — Delta a partir da versão 2D

> Esta seção assume que você já seguiu o guia de implementação 2D (Partes 7-13 deste documento). Aqui só descrevo o que muda.

#### Fase 3D-1: Setup do projeto 3D topdown

1. Nova cena (dentro do mesmo projeto, ou projeto novo — recomendo **mesmo projeto**, criando uma pasta `Assets/_Project3D/`, pra reaproveitar scripts de Firebase/UI sem duplicar).
2. Se o projeto foi criado como 2D (Core), adicione suporte a 3D: `Window → Package Manager`, garanta que os pacotes de 3D padrão estão presentes (Physics — não Physics 2D).
3. Configure a câmera principal:
   - `Projection`: **Orthographic** (ponto de partida recomendado).
   - Rotação: `X = 80-90`, dependendo do ângulo escolhido.
   - Posição: alta o suficiente para enquadrar a pista, ajustando `Size` da câmera ortográfica.
4. Importe modelos 3D do carro e da pista (Asset Store, ou modelagem própria em Blender). Atenção à **escala e pivot** — o pivot do modelo do carro deve estar no centro/base dele, senão a rotação fica estranha.

#### Fase 3D-2: `CarController3D.cs` — adaptando o movimento

A diferença principal: em 2D, `ScreenToWorldPoint` já dava a posição do mouse no plano do jogo diretamente. Em 3D, a câmera está posicionada acima olhando pra baixo, então precisamos de um **raycast** da câmera até um plano imaginário no nível do chão (Y = 0) para saber onde o mouse "aponta" no mundo 3D.

```csharp
using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Rigidbody))]
public class CarController3D : MonoBehaviour
{
    [Header("Speed")]
    [SerializeField] private float maxSpeed = 8f;
    [SerializeField] private float minDistanceForMovement = 0.3f;
    [SerializeField] private float maxDistanceForTopSpeed = 6f;
    [SerializeField] private AnimationCurve speedCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);

    [Header("Rotation")]
    [SerializeField] private float rotationSpeed = 10f;

    private Rigidbody rb;
    private Camera mainCamera;
    private Plane groundPlane;
    private Vector3 mouseWorldPos;

    public float CurrentSpeedNormalized { get; private set; }
    public bool IsAccelerating { get; private set; }
    public bool IsBraking { get; private set; }
    private float previousSpeedNormalized;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
        mainCamera = Camera.main;
        // Horizontal plane at ground level (Y = 0), used for the mouse raycast
        groundPlane = new Plane(Vector3.up, Vector3.zero);
    }

    void Update()
    {
        Vector2 mouseScreenPos = Mouse.current.position.ReadValue();
        Ray ray = mainCamera.ScreenPointToRay(mouseScreenPos);

        if (groundPlane.Raycast(ray, out float distanceToPlane))
        {
            mouseWorldPos = ray.GetPoint(distanceToPlane);
        }
    }

    void FixedUpdate()
    {
        Vector3 toMouse = mouseWorldPos - transform.position;
        toMouse.y = 0f; // ignore any height difference, work only on the XZ plane
        float distance = toMouse.magnitude;

        float t = Mathf.InverseLerp(minDistanceForMovement, maxDistanceForTopSpeed, distance);
        t = Mathf.Clamp01(t);
        float speedT = speedCurve.Evaluate(t);
        float targetSpeed = speedT * maxSpeed;

        if (distance > minDistanceForMovement)
        {
            Vector3 direction = toMouse.normalized;
            rb.linearVelocity = direction * targetSpeed;

            Quaternion targetRotation = Quaternion.LookRotation(direction, Vector3.up);
            rb.MoveRotation(Quaternion.Slerp(rb.rotation, targetRotation, rotationSpeed * Time.fixedDeltaTime));
        }
        else
        {
            rb.linearVelocity = Vector3.zero;
        }

        CurrentSpeedNormalized = speedT;
        IsAccelerating = speedT > previousSpeedNormalized + 0.001f;
        IsBraking = speedT < previousSpeedNormalized - 0.001f;
        previousSpeedNormalized = speedT;
    }
}
```

> Note que a lógica de curva/normalização é **idêntica** à versão 2D — só trocamos `Vector2` por `Vector3` (ignorando o eixo Y como "altura") e a forma de achar a posição do mouse no mundo.

#### Fase 3D-3: Chevrons como billboards

Os chevrons agora precisam sempre "encarar" a câmera, senão em ângulos variados eles pareceriam finos/invisíveis de lado. Adicione este componente no prefab do chevron:

```csharp
using UnityEngine;

public class Billboard : MonoBehaviour
{
    private Camera mainCamera;

    void Awake() => mainCamera = Camera.main;

    void LateUpdate()
    {
        // Makes the sprite/quad always face the camera
        transform.rotation = Quaternion.LookRotation(transform.position - mainCamera.transform.position);
    }
}
```

O restante do `ChevronGuide.cs` (Fase 2 da versão 2D) muda muito pouco: troque os cálculos de `Vector2` por `Vector3` (com Y fixo em 0, ou na altura do chão), e o posicionamento/instanciação continua igual.

#### Fase 3D-4: Pista e colisão

A lógica é a mesma da Fase 3 (2D), só trocando os componentes:
- `Collider2D` → `Collider` (`BoxCollider`, `MeshCollider` marcado como `Convex` se for trigger, ou `CapsuleCollider`).
- `OnTriggerExit2D(Collider2D other)` → `OnTriggerExit(Collider other)`.
- `Rigidbody2D` no carro → `Rigidbody` (já ajustado na Fase 3D-2).
- Para pistas orgânicas com curvas complexas, considere modelar a "zona válida" como uma malha 3D simples (extrusão do traçado) em vez de tentar um `BoxCollider` único.

#### Fase 3D-5: UI, Timer e Firebase

**Sem mudanças.** O `Canvas` (Screen Space - Overlay) funciona da mesma forma independente da câmera ser 2D ou 3D por baixo. Os scripts `TimerDisplay.cs`, `RaceManager.cs` e toda a camada de `LeaderboardService.cs`/Firebase são reaproveitados **sem nenhuma alteração** — eles não sabem (nem precisam saber) se a cena é 2D ou 3D.

### Notas específicas por jogo (quando chegar a hora)

- **RallySurvive 3D:** conversão mais direta — é essencially um "reskin" geométrico da lógica já pronta.
- **Navigation Expert 3D:** o minimapa pode ser implementado com uma **segunda câmera ortográfica**, posicionada bem acima olhando pra baixo, renderizando para uma `RenderTexture` que alimenta a UI do minimapa — abordagem padrão em jogos 3D.
- **RaceLegenda 3D:** a sincronização multiplayer de posição fica praticamente igual (só mais um eixo de dados: X, Y, Z em vez de X, Y).
- **Street Legends 3D:** a perseguição policial se beneficia muito de um **NavMesh** (bake do terreno das ruas) para as viaturas perseguirem o jogador de forma realista pelas ruas, em vez de perseguição em linha reta — algo que só faz sentido ter em 3D.

### Em aberto
- Câmera ortográfica vs. perspectiva angulada — decisão a validar com protótipo visual comparativo.
- Direção de arte 3D definitiva (baixo-poly estilizado é a recomendação inicial, mas vale validar com referências visuais antes de comprometer o pipeline).
- Timing de entrada no roadmap: esta versão é pós-lançamento dos 4 jogos 2D, não bloqueia o desenvolvimento atual.

---
