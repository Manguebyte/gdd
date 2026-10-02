# GDD — Paddock Boss

> Documento vivo. Rascunho inicial — a refinar conforme prototipagem. Nome provisório.
> Valores marcados como **valor inicial** são o ponto de partida do balanceamento, não decisões fechadas.

**Gênero:** simulação/gerenciamento de equipe de corrida, com ritmo de tycoon/idle · **Dimensão:** 2D · **Plataformas:** PC (Steam/itch), Mobile, WebGL · **Engine:** Unity 6

## Índice

**Parte 1 — GDD**
1. [Visão Geral](#1-visão-geral)
2. [Loop Principal](#2-loop-principal)
3. [A Corrida](#3-a-corrida)
4. [Áreas de Investimento](#4-áreas-de-investimento)
5. [Pneus e Pit Stop](#5-pneus-e-pit-stop)
6. [Economia](#6-economia)
7. [Equipes Rivais (IA)](#7-equipes-rivais-ia)
8. [Campeonato](#8-campeonato)
9. [Estilo Visual](#9-estilo-visual)
10. [HUD / UI](#10-hud--ui)
11. [Áudio](#11-áudio)
12. [Backend / Serviços](#12-backend--serviços)
13. [Escopo do MVP](#13-escopo-do-mvp)
14. [Balanceamento inicial](#14-balanceamento-inicial)
15. [Em aberto](#15-em-aberto)

**Parte 2 — Guia de Implementação Unity**
- [Convenções, arquitetura e fases](#parte-2--guia-de-implementação-unity)
- Partes 3 a 12: Fases 0 a 9 (setup → build)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Pitch:** você é o chefe de uma equipe pequena com dois carros num campeonato. A corrida acontece sozinha, num mapa visto de cima; você não pilota. Enquanto os carros andam, o dinheiro entra (patrocínio, posições, ultrapassagens) e você decide, ao vivo, onde investir: engenharia do carro, propaganda, treino dos pilotos, equipe de boxes. Cada compra vale na hora e fica para o resto da temporada.
- **Gênero — Definido:** simulação/gerenciamento de equipe de corrida, com o ritmo de compra constante dos jogos idle/tycoon.
- **Dimensão — Definido:** 2D.
- **Câmera/perspectiva — Definido:** mapa topdown 2D simplificado da pista, com os carros como ícones andando pelo traçado. O resto do jogo é interface (painéis, tabelas, botões).
- **Plataformas — Definido:** PC (Steam/itch), Mobile e WebGL.
- **Pilar de design — Definido:** são dois, em escalas de tempo diferentes:
  1. **Curto prazo (dentro da corrida):** decidir onde gastar sob pressão. A corrida não para; investir agora ou guardar para algo mais caro é a tensão principal.
  2. **Longo prazo (ao longo do campeonato):** ver a equipe crescer, de nanica a candidata ao título.
- **Fantasia central:** comandar a equipe do muro dos boxes, vendo o investimento de agora virar ultrapassagem daqui a meia volta.
- **Referências:** Motorsport Manager (corrida 2D ao vivo com gestão), F1 Manager (gestão de equipe com dois carros), jogos idle/tycoon mobile (ritmo de upgrades constantes e custo crescente).
- **Relação com outros jogos do estúdio — Definido:** jogo separado da franquia Rally (`RallySurvive.md`). Não usa `ChevronGuide`, controle por mouse nem o formato de pista da franquia.

## 2. Loop Principal

```
 ┌───────────── Campeonato (N etapas) ─────────────┐
 │                                                 │
 │  Tela da temporada ──► Corrida ao vivo ──► Resultado
 │   (próxima pista,      (dinheiro entra,      (pontos, prêmio,
 │    classificação)       jogador investe,      classificação)
 │         ▲               manda pro box)             │
 │         └──────────────────────────────────────────┘
 │                                                 │
 └──► Fim da temporada: classificação final ───────┘
```

- **Definido:** a partida é um **campeonato de várias corridas**.
- **Definido:** os investimentos são feitos **durante a corrida, em tempo real**. A corrida não pausa para o jogador decidir.
- **Definido:** os investimentos têm **efeito imediato** no carro/piloto e são **permanentes** (acumulam pelo campeonato inteiro).
- **Em aberto:** se também dá para investir na tela entre corridas. O guia Unity só permite investir durante a corrida.
- **Em aberto:** o que acontece ao fim da temporada (nova temporada mantendo a equipe? recomeço do zero? divisões/promoção?). O guia Unity recomeça do zero, como solução provisória.

## 3. A Corrida

- **Definido:** a corrida é simulada; o jogador não controla os carros diretamente. Ela aparece como um **mapa topdown 2D simplificado**, com o traçado da pista e ícones dos carros na cor de cada equipe.
- **Definido:** o jogador gerencia **2 carros** (dois pilotos da mesma equipe, estilo F1).
- **Definido (MVP):** 7 equipes no grid (a do jogador + 6 rivais controladas por IA), ou seja, **14 carros**.
- Pista fechada com **voltas**. A ordem é dada pela distância percorrida: quem andou mais está na frente; quem já cruzou a bandeirada fica na frente de quem não cruzou.

**Proposta inicial do modelo de simulação (Em aberto, a validar no protótipo):**

- A pista é uma linha fechada de pontos (*waypoints*). O primeiro ponto é a linha de largada/chegada.
- A velocidade de cada carro em cada trecho é:
  `velocidade = velocidade-base da pista × fator de curva × desempenho do carro × estado do pneu × variação do piloto`
  - **Fator de curva:** 1 na reta, cai nas curvas. Quanto mais fechada a curva (mais graus de virada por unidade de distância), mais lento.
  - **Desempenho:** 1 + bônus de engenharia + bônus do piloto + aderência do composto de pneu.
  - **Estado do pneu:** cai conforme o desgaste; com pneu 100% gasto, a perda é grande.
  - **Variação do piloto:** oscilação suave de ritmo (ruído). Pilotos mais treinados oscilam menos.
- Não há colisão nem bloqueio: quem é mais rápido passa. Uma **ultrapassagem** é contada quando um carro ganha a posição de outro que está na pista (passar um carro parado no box não conta).

**Em aberto:**
- Ordem de largada: o guia usa grid sorteado. Classificação (*qualifying*)? Ordem inversa do campeonato?
- Disputa de posição/bloqueio (carro mais lento segurando o mais rápido).
- Quebras, acidentes, abandono, safety car, clima.
- Duração-alvo de uma corrida (o **valor inicial** do guia dá cerca de 3–6 minutos).
- Se o jogador pode acelerar a simulação (1×/2×/4×) ou se o ritmo é fixo.
- Ordens táticas além do pit stop (ritmo agressivo/poupar pneu, ordens de equipe entre os dois carros).

## 4. Áreas de Investimento

**Definido:** as áreas do MVP são engenharia do carro, propaganda, treino de piloto, equipe de boxes e a estratégia de pneus/pit stop (esta última é uma decisão tática, não uma compra; ver §5). Todo investimento tem **efeito imediato e permanente**.

| Área | O que melhora | Alcance (proposta) |
|---|---|---|
| **Engenharia do carro** | Velocidade em todo o traçado | Os dois carros da equipe |
| **Treino de piloto** | Velocidade e consistência (menos oscilação de ritmo) | Um piloto por vez (compra separada para cada um) |
| **Propaganda** | Renda de patrocínio por segundo | Equipe |
| **Equipe de boxes (mecânicos)** | Tempo parado no pit stop | Os dois carros |

- **Proposta inicial (Em aberto):** cada área tem **níveis**. O custo do próximo nível cresce exponencialmente (`custo-base × crescimento^nível`), no estilo tycoon. Há um nível máximo.
- **Em aberto:** se engenharia se divide em subáreas (motor, aerodinâmica, confiabilidade...) ou continua um valor único.
- **Em aberto:** se o "treino de piloto" com efeito instantâneo no meio da corrida deve ser apresentado de outro jeito na ficção (ex.: "coaching pelo rádio"), já que treino costuma levar tempo.
- **Em aberto:** contratação/troca de pilotos e funcionários (fora do MVP).

## 5. Pneus e Pit Stop

- **Definido:** pit stop e estratégia de pneus fazem parte do MVP.
- **Proposta inicial (Em aberto):**
  - Três compostos: **Macio** (mais aderência, gasta rápido), **Médio** e **Duro** (menos aderência, dura mais).
  - O pneu gasta com o tempo de pista; o desgaste reduz a velocidade.
  - O jogador toca/clica em **"Box"** num dos seus carros e escolhe o composto. O carro entra no box ao completar a volta atual, fica parado (tempo do pit lane + tempo de serviço) e volta com pneus novos.
  - O **tempo de serviço** diminui com o nível da equipe de boxes.
  - Todos largam com o composto Médio.
- **Em aberto:** escolha do composto de largada; regra obrigatória de usar dois compostos; reabastecimento; reparos.

## 6. Economia

**Definido:** o dinheiro vem de três fontes, todas acontecendo durante a corrida:

| Fonte | Quando entra |
|---|---|
| **Patrocinadores** | Renda contínua por segundo de corrida. Cresce com o nível de **propaganda**. |
| **Posição e ultrapassagens** | Bônus a cada volta completada (maior quanto melhor a posição) e bônus fixo por ultrapassagem. |
| **Prêmio de chegada** | Ao cruzar a linha de chegada, conforme a posição final de cada carro. |

- O dinheiro é da equipe e é gasto nos investimentos (§4). Os carros rivais ganham dinheiro pelas mesmas regras (ver §7).
- **Proposta inicial (Em aberto):** o dinheiro nunca fica negativo; sem dinheiro, os botões de compra ficam desabilitados. Não há custos fixos (salários, manutenção) no MVP.
- **Em aberto:** nome da moeda; custos fixos; patrocinadores com metas ("termine no top 5"); monetização (não discutida).

## 7. Equipes Rivais (IA)

- **Definido (MVP):** 6 equipes rivais controladas por IA.
- **Proposta inicial (Em aberto):** as rivais seguem a mesma economia do jogador (ganham pelas mesmas regras e compram as mesmas melhorias), cada uma com uma "personalidade" de dados:
  - **Pesos de investimento** (prefere engenharia? propaganda? ...).
  - **Disposição para gastar** (gasta assim que pode ou guarda folga no caixa).
  - **Limite de desgaste para chamar o box.** A IA também escolhe o composto mais macio que aguente até o fim.
  - **Níveis iniciais** diferentes: algumas começam mais fortes que o jogador, que começa do zero.
- **Em aberto:** se a IA deve ter ajuste dinâmico de dificuldade (*rubber band*) para o jogador não ficar para trás sem chance (quem está atrás ganha menos, e isso tende a aumentar a diferença).

## 8. Campeonato

- **Definido (MVP):** campeonato de **3 etapas** (3 pistas diferentes).
- **Proposta inicial (Em aberto):** pontos por posição de cada carro, tabela estilo F1 (25-18-15-12-10-8-6-4-2-1). A classificação do MVP é **por equipe** (soma dos dois carros).
- **Em aberto:** classificação de pilotos; nomes e temas das 3 pistas; o que acontece entre temporadas (§2).

## 9. Estilo Visual

- **Definido:** **flat vector minimalista** (mesma linha que a franquia Rally adotou, mas com identidade própria).
- **Proposta inicial (Em aberto):** traçado da pista como uma faixa grossa sobre fundo liso; carros como ícones simples vistos de cima, num sprite branco tingido com a cor da equipe; o carro do jogador com um contorno de destaque.
- **Em aberto:** paleta, tipografia, identidade das equipes (nomes, logos), arte da tela da temporada.

## 10. HUD / UI

- **Definido:** jogável com toque (mobile) e mouse (PC/WebGL). Toda interação é por botões; nada depende de hover ou de teclado.
- **Proposta inicial (Em aberto):** tela da corrida dividida em duas áreas:
  - **Mapa** (lado esquerdo): pista, carros, linha de largada.
  - **Painel lateral** (lado direito): volta atual; tabela de posições (com o jogador em destaque e a diferença para o líder); dinheiro da equipe com as últimas entradas ("+15 Ultrapassagem"); os dois carros do jogador com desgaste do pneu, composto e botão "Box"; botões de investimento com nível e custo.
- **Tela da temporada:** resultado da última corrida, classificação do campeonato, próxima pista e botão para largar.
- **Em aberto:** orientação no mobile (paisagem ou retrato). O guia usa **paisagem** como ponto de partida, porque é a mesma tela do PC/WebGL.

## 11. Áudio

- **Em aberto:** direção sonora ainda não discutida.

## 12. Backend / Serviços

- **Definido:** **offline, com save local**. Sem login, sem leaderboard e sem servidor no MVP (não segue o padrão Firebase da franquia Rally).
- **Proposta inicial (Em aberto):** o jogo salva entre corridas. Se o jogo for fechado no meio de uma corrida, ela recomeça do estado anterior a ela, e o que foi ganho e gasto nela se perde.
- **Em aberto:** save na nuvem (Steam Cloud / Google Play), conquistas, leaderboard.

## 13. Escopo do MVP

**Dentro do MVP — Definido:**
- Campeonato de 3 etapas, 3 pistas.
- 7 equipes (jogador + 6 IA), 2 carros cada.
- Corrida simulada ao vivo em mapa topdown 2D.
- Investimentos durante a corrida: engenharia, propaganda, treino de piloto (por piloto), equipe de boxes, com efeito imediato e permanente.
- Pit stop com escolha de composto de pneu.
- Economia: patrocínio, bônus de posição/ultrapassagem, prêmio de chegada.
- Save local.
- Builds para PC, Mobile e WebGL.

**Fora do MVP / Em aberto:**
- Quebras, acidentes, clima, safety car.
- Classificação de pilotos, contratação de pilotos, mercado de transferências.
- Investimento entre corridas, temporadas seguintes/divisões.
- Áudio, tutorial, monetização, save na nuvem.

## 14. Balanceamento inicial

Todos os números abaixo são **valor inicial** e ficam num único asset (`GameBalance`, ver Fase 1), para ajustar sem mexer em código.

| Parâmetro | Valor inicial |
|---|---|
| Dinheiro inicial (todas as equipes) | 300 |
| Patrocínio base | 2 por segundo |
| Bônus de propaganda | +15% de patrocínio por nível |
| Bônus por ultrapassagem | 15 |
| Bônus por volta, P1 → P14 | 30, 25, 20, 16, 13, 10, 8, 6, 5, 4, 3, 2, 1, 0 |
| Prêmio de chegada, P1 → P14 | 600, 450, 350, 280, 220, 170, 130, 100, 80, 60, 45, 30, 20, 10 |
| Pontos, P1 → P10 | 25, 18, 15, 12, 10, 8, 6, 4, 2, 1 |
| Engenharia | +2% de velocidade por nível |
| Treino de piloto | +1,5% de velocidade e −8% de oscilação por nível |
| Oscilação de ritmo (piloto nível 0) | ±4% |
| Pneu Macio / Médio / Duro: aderência | +6% / +3% / 0% |
| Pneu Macio / Médio / Duro: desgaste | 1,0% / 0,6% / 0,4% por segundo |
| Pneu gasto (100%) | 88% da velocidade; "morto" (no limite): 60% |
| Pit stop | perda no pit lane (por pista, 6 s) + serviço 8 s, −0,5 s por nível de boxes (mínimo 2,5 s) |
| Custo-base / crescimento por nível | Engenharia 150 / ×1,35 · Propaganda 120 / ×1,40 · Boxes 100 / ×1,35 · Treino 130 / ×1,35 |
| Nível máximo | 20 |

## 15. Em aberto

Lista consolidada, para revisão rápida:

1. Investir também entre corridas?
2. Fim de temporada: continuar a equipe, recomeçar, divisões?
3. Modelo de simulação (§3) e todos os valores da §14: validar no protótipo.
4. Ordem de largada / classificação.
5. Disputa de posição, quebras, acidentes, clima, safety car.
6. Duração-alvo da corrida; controle de velocidade da simulação.
7. Ordens táticas além do pit stop.
8. Subdivisão da engenharia; ficção do "treino instantâneo".
9. Alcance de cada investimento (equipe vs. piloto) — proposta na §4.
10. Compostos de pneu, regras de pneu obrigatório, composto de largada.
11. Custos fixos, nome da moeda, patrocinadores com metas, monetização.
12. Ajuste dinâmico de dificuldade da IA.
13. Classificação de pilotos; nomes/temas das pistas e equipes.
14. Orientação no mobile.
15. Áudio.
16. Save no meio da corrida; save na nuvem.

---

# Parte 2 — Guia de Implementação Unity

Este guia leva o MVP do Paddock Boss do projeto vazio até as builds de PC, Mobile e WebGL. Ele implementa a **proposta inicial** da Parte 1. Onde a Parte 1 diz **Em aberto**, o guia escolhe a solução mais simples e avisa. Todos os números ficam em dados (ScriptableObjects), então mudar o balanceamento não exige mexer em código.

Cada fase termina com algo que dá para ver funcionando no Play Mode, um **✅ Checkpoint** e, quando há armadilhas prováveis, **Problemas comuns**.

## Convenções

- **Nomes no projeto em inglês** (scripts, classes, GameObjects, assets); **comentários em português**. Cada classe começa com `// POR QUE:` (por que ela existe) e `// ESTRATÉGIA:` (como funciona), e cada método tem um comentário curto acima dele.
- **Namespaces:** `PaddockBoss.Data` (ScriptableObjects e enums), `PaddockBoss.Game` (regras: simulação, economia, IA, campeonato, save), `PaddockBoss.UI` (tudo que desenha algo na tela).
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Hierarquia da cena `Main`:** agrupadores na raiz entre colchetes: `[Systems]`, `[World]`, `[UI]`.

## Arquitetura em uma página

```
 Dados (ScriptableObjects)        Regras (C# puro)                       Tela (MonoBehaviours)
 ─────────────────────────        ─────────────────────────              ─────────────────────
 GameBalance ─────────────┐       RaceSimulator ── TrackPath             TrackRenderer, CarMarker
 TeamDefinition ──────────┼──────►  CarState[], eventos (volta,          RaceHUD, MoneyFeed
 TrackDefinition ─────────┤         ultrapassagem, box, chegada)          CarPitControls, UpgradeButton
 ChampionshipDefinition ──┘       RaceEconomy (ouve os eventos)          SeasonPanel
                                  UpgradeService, RivalAI                     ▲
                                  Championship ── SaveService                 │ lê estado / chama métodos
                                  TeamState (o que é salvo)                   │
                     RaceRunner (MonoBehaviour): avança a simulação a cada frame
                     GameSession (MonoBehaviour): temporada → corrida → resultado
```

- **Regra de ouro:** as regras do jogo (velocidade, dinheiro, compra, pontos) moram em classes C# comuns, sem `MonoBehaviour`. A tela só lê o estado e chama métodos (`RequestPit`, `TryBuy`). Assim a lógica não depende de cena e dá para testar em Edit Mode depois.
- **Por que a simulação não usa física (`Rigidbody2D`)?** Os carros andam sobre uma linha. A posição de cada um é só "quantas unidades já percorreu" (`Distance`). Isso torna ordem, voltas e ultrapassagens triviais de calcular e deixa a corrida igual em qualquer taxa de quadros. Por isso este guia não tem a nota `rb.linearVelocity`/`rb.velocity`: nenhuma fase usa Rigidbody.

## Mapa de sistemas

| Namespace | Script | Responsabilidade | Fase |
|---|---|---|---|
| `Data` | `Enums`, `GameBalance`, `TeamDefinition` | Enums, números do jogo, equipes | 1 |
| `Data` | `TrackDefinition` | Dados de uma pista | 2 |
| `Game` | `TrackPath` | Geometria da pista (posição, direção e curva por distância) | 2 |
| `UI` | `TrackAuthoring`, `TrackRenderer` | Desenhar pistas no Editor; mostrar a pista no jogo | 2 |
| `Game` | `TeamState`, `CarState`, `RaceSimulator`, `RaceRunner` | Simulação da corrida | 3 |
| `Game` | `RaceTestStarter` | Largada de teste (removida na Fase 7) | 3 |
| `UI` | `CarMarker`, `RaceHUD` | Carros no mapa; volta e tabela de posições | 3 |
| `UI` | `CarPitControls` | Box e pneus dos carros do jogador | 4 |
| `Game` | `RaceEconomy`, `UpgradeService` | Dinheiro ao vivo; compras | 5 |
| `UI` | `UpgradeButton`, `MoneyFeed` | Botões de investimento; dinheiro e entradas | 5 |
| `Game` | `RivalAI` | Compras e box das equipes rivais | 6 |
| `Data` | `ChampionshipDefinition` | Pistas e equipes do campeonato | 7 |
| `Game` | `SaveData`, `SaveService`, `Championship`, `GameSession` | Campeonato, pontos e save | 7 |
| `UI` | `SeasonPanel` | Tela entre corridas | 7 |
| `UI` | `SafeAreaFitter`, `TrackCameraFit` | Layout em qualquer tela | 8 |

## Fases

| Fase | Parte | Conteúdo |
|---|---|---|
| 0 | 3 | Setup do projeto |
| 1 | 4 | Dados: balanceamento e equipes |
| 2 | 5 | Pista: geometria, editor e desenho |
| 3 | 6 | Simulação da corrida e tabela de posições |
| 4 | 7 | Pneus e pit stop |
| 5 | 8 | Economia ao vivo e investimentos |
| 6 | 9 | IA das equipes rivais |
| 7 | 10 | Campeonato e save local |
| 8 | 11 | Layout multiplataforma e arte |
| 9 | 12 | Build e próximos passos |

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, versionado no Git, com as pastas e pacotes que o resto do guia usa.

O Paddock Boss é 2D, mas quase não usa recursos 2D de jogo: não tem física, tilemap nem animação de personagem. O mapa da corrida são uma linha (`LineRenderer`) e alguns sprites; o resto é UI (uGUI + TextMeshPro). Por isso o template é o **Universal 2D** puro, sem pacotes extras de física ou tilemap.

### 0.1 Instalar a Unity

1. Instale o **Unity Hub** (unity.com/download).
2. **Installs → Install Editor** → **Unity 6 LTS** mais recente (`6000.x`).
3. Marque os módulos das três plataformas do MVP:
   - **Windows Build Support (IL2CPP)** (PC; o Mono já vem por padrão).
   - **Android Build Support**, com **OpenJDK** e **Android SDK & NDK Tools** (Mobile). Para iOS, **iOS Build Support** (exige um Mac para gerar a build final).
   - **Web Build Support** (WebGL).

### 0.2 Criar o projeto e o repositório

1. **Projects → New Project** → template **Universal 2D** → nome `PaddockBoss` → **Create project**.
2. Na pasta do projeto, crie o repositório:

   ```powershell
   git init
   curl.exe -L https://raw.githubusercontent.com/github/gitignore/main/Unity.gitignore -o .gitignore
   git lfs install
   git lfs track "*.png" "*.wav" "*.ogg" "*.ttf" "*.otf"
   ```

3. Adicione `Builds/` ao `.gitignore`.
4. **Edit → Project Settings → Editor**: **Version Control Mode** = `Visible Meta Files`, **Asset Serialization Mode** = `Force Text`.

### 0.3 Pacotes

Não é preciso instalar nada. O template já traz **uGUI** (que no Unity 6 inclui o **TextMeshPro**), **Input System** e **2D Sprite**. Na primeira vez que criar um texto TMP, aceite **Import TMP Essentials**.

> **Input:** a UI (uGUI) já funciona com toque e mouse sem código extra: o `EventSystem` da cena converte os dois em cliques. Como toda interação do jogo é por botões (Parte 1 §10), nenhum script deste guia lê input diretamente.

### 0.4 Estrutura de pastas

Crie em `Assets/`:

```
Assets/_Project/
  Data/            ← assets de ScriptableObject (balanceamento, equipes, pistas, campeonato)
    Teams/
    Tracks/
  Prefabs/
  Scenes/          ← Main.unity, TrackLab.unity
  Scripts/
    Data/
    Game/
    UI/
  Sprites/
```

Mova a cena `SampleScene` para `Scenes/` e renomeie para `Main`. Crie a segunda cena, `TrackLab` (**File → New Scene → Basic 2D (URP)**), e salve também em `Scenes/`: ela vai servir de "bancada" para desenhar pistas.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- `Assets/_Project/` tem as pastas acima e as cenas `Main` e `TrackLab`.
- `git status` não lista `Library/` nem `Temp/` (o `.gitignore` funcionou).

Próxima fase: **Dados** — os números do jogo e as equipes viram assets editáveis.

---

# Parte 4 — Implementação Unity: Fase 1 (Dados: balanceamento e equipes)

## Fase 1 — Dados: balanceamento e equipes

> Objetivo desta fase: todos os números da Parte 1 §14 num asset `GameBalance` e as 7 equipes como assets `TeamDefinition`, editáveis no Inspector.

### 1.1 Enums

```csharp
// Caminho: Assets/_Project/Scripts/Data/Enums.cs
namespace PaddockBoss.Data
{
    // POR QUE: um enum dá nome a um conjunto fixo de opções. "TireCompound.Soft"
    // é mais legível e mais seguro que um número 0/1/2 ou uma string "macio"
    // (que o compilador não confere).
    // ESTRATÉGIA: os dois enums do jogo ficam juntos num arquivo pequeno.

    // Compostos de pneu (Parte 1 §5).
    public enum TireCompound { Soft, Medium, Hard }

    // Áreas de investimento (Parte 1 §4). DriverTraining é comprado por piloto.
    public enum UpgradeType { Engineering, Marketing, PitCrew, DriverTraining }
}
```

### 1.2 `GameBalance`: todos os números num asset só

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameBalance.cs
using System;
using UnityEngine;

namespace PaddockBoss.Data
{
    // POR QUE: guarda os dados de um composto de pneu. [Serializable] faz a Unity
    // mostrar e salvar a classe dentro de outro asset (aparece como uma "gaveta"
    // no Inspector).
    [Serializable]
    public class TireCompoundData
    {
        public TireCompound compound;
        public string displayName;
        public float gripBonus;      // +0.06 = 6% mais rápido
        public float wearPerSecond;  // 0.01 = gasta 1% por segundo de pista
    }

    // POR QUE: custo de uma área de investimento. O custo do nível N é
    // baseCost × growth^N (curva exponencial típica de tycoon).
    [Serializable]
    public class UpgradeCostData
    {
        public UpgradeType type;
        public string displayName;
        public int baseCost;
        public float growth;
    }

    // POR QUE: o balanceamento muda o tempo todo durante a prototipagem. Com todos
    // os números num asset, ajustar o jogo é editar campos no Inspector, sem
    // recompilar nada.
    // ESTRATÉGIA: ScriptableObject é um "arquivo de dados" da Unity: uma classe cujas
    // instâncias são salvas como assets (.asset) no projeto. [CreateAssetMenu] cria o
    // item no menu Create do Project. Os valores escritos aqui (= 2f, = {...}) são os
    // padrões de um asset recém-criado (Parte 1 §14).
    [CreateAssetMenu(menuName = "Paddock Boss/Game Balance", fileName = "GameBalance")]
    public class GameBalance : ScriptableObject
    {
        [Header("Velocidade")]
        public float engineeringBonusPerLevel = 0.02f;
        public float driverBonusPerLevel = 0.015f;
        public float noiseAmplitude = 0.04f;
        public float consistencyPerDriverLevel = 0.08f;
        public float gridSpacing = 1.2f;

        [Header("Pneus")]
        public TireCompound startingCompound = TireCompound.Medium;
        public float wornTireSpeedMultiplier = 0.88f;
        public float deadTireSpeedMultiplier = 0.6f;
        public TireCompoundData[] compounds =
        {
            new TireCompoundData { compound = TireCompound.Soft,   displayName = "Macio", gripBonus = 0.06f, wearPerSecond = 0.010f },
            new TireCompoundData { compound = TireCompound.Medium, displayName = "Médio", gripBonus = 0.03f, wearPerSecond = 0.006f },
            new TireCompoundData { compound = TireCompound.Hard,   displayName = "Duro",  gripBonus = 0.00f, wearPerSecond = 0.004f },
        };

        [Header("Pit stop")]
        public float basePitServiceSeconds = 8f;
        public float pitServiceReductionPerLevel = 0.5f;
        public float minPitServiceSeconds = 2.5f;

        [Header("Economia")]
        public int startingMoney = 300;
        public float baseSponsorPerSecond = 2f;
        public float marketingBonusPerLevel = 0.15f;
        public int overtakeBonus = 15;
        public int[] lapBonusByPosition = { 30, 25, 20, 16, 13, 10, 8, 6, 5, 4, 3, 2, 1, 0 };
        public int[] prizeByPosition = { 600, 450, 350, 280, 220, 170, 130, 100, 80, 60, 45, 30, 20, 10 };

        [Header("Campeonato")]
        public int[] pointsByPosition = { 25, 18, 15, 12, 10, 8, 6, 4, 2, 1 };

        [Header("Investimentos")]
        public int maxLevel = 20;
        public UpgradeCostData[] upgradeCosts =
        {
            new UpgradeCostData { type = UpgradeType.Engineering,    displayName = "Engenharia",       baseCost = 150, growth = 1.35f },
            new UpgradeCostData { type = UpgradeType.Marketing,      displayName = "Propaganda",       baseCost = 120, growth = 1.40f },
            new UpgradeCostData { type = UpgradeType.PitCrew,        displayName = "Equipe de boxes",  baseCost = 100, growth = 1.35f },
            new UpgradeCostData { type = UpgradeType.DriverTraining, displayName = "Treino de piloto", baseCost = 130, growth = 1.35f },
        };

        [Header("IA")]
        public float aiThinkInterval = 2f;

        // Devolve os dados de um composto. Falha alto se o asset estiver incompleto,
        // para o erro aparecer logo no Console e não virar "carro parado" sem motivo.
        public TireCompoundData GetCompound(TireCompound compound)
        {
            foreach (var data in compounds)
                if (data.compound == compound) return data;
            throw new ArgumentException($"GameBalance sem dados para o pneu {compound}.");
        }

        // Devolve o custo-base/crescimento de uma área de investimento.
        public UpgradeCostData GetUpgrade(UpgradeType type)
        {
            foreach (var data in upgradeCosts)
                if (data.type == type) return data;
            throw new ArgumentException($"GameBalance sem custo para {type}.");
        }

        // Lê uma tabela "por posição" (posição 1 = índice 0). Posições além do fim
        // da tabela valem 0 (ex.: P11 em diante não pontua).
        public static int ByPosition(int[] table, int position)
        {
            int index = position - 1;
            return index >= 0 && index < table.Length ? table[index] : 0;
        }
    }
}
```

### 1.3 `TeamDefinition`: uma equipe

```csharp
// Caminho: Assets/_Project/Scripts/Data/TeamDefinition.cs
using UnityEngine;

namespace PaddockBoss.Data
{
    // POR QUE: cada equipe (a do jogador e as 6 rivais) tem nome, cor, pilotos,
    // níveis iniciais e, se for IA, uma "personalidade" (Parte 1 §7). Tudo isso é
    // dado, não código: criar uma equipe nova é criar um asset.
    // ESTRATÉGIA: o asset é só a definição inicial e nunca muda durante o jogo. O
    // estado que evolui (dinheiro, níveis, pontos) fica em TeamState (Fase 3), que
    // é o que vai para o save.
    [CreateAssetMenu(menuName = "Paddock Boss/Team", fileName = "Team_")]
    public class TeamDefinition : ScriptableObject
    {
        public string teamId;                 // fixo, usado no save (ex.: "player", "rival_1")
        public string displayName;
        public string shortName;              // 3 letras para a tabela de posições
        public Color color = Color.white;
        public string[] driverNames = { "Piloto 1", "Piloto 2" };

        [Header("Níveis iniciais")]
        public int engineering;
        public int marketing;
        public int pitCrew;
        public int[] driverSkill = { 0, 0 };

        [Header("IA (ignorado na equipe do jogador)")]
        [Range(0f, 1f)] public float aiSpendEagerness = 0.5f;   // 1 = gasta assim que pode
        public float aiWeightEngineering = 1f;
        public float aiWeightMarketing = 1f;
        public float aiWeightPitCrew = 1f;
        public float aiWeightDriver = 1f;
        [Range(0f, 1f)] public float aiPitWearThreshold = 0.75f;
    }
}
```

### 1.4 Criar os assets

1. Em `Assets/_Project/Data/`: **botão direito → Create → Paddock Boss → Game Balance**. Os valores da Parte 1 §14 já vêm preenchidos.
2. Em `Data/Teams/`, crie 7 equipes (**Create → Paddock Boss → Team**): `Team_Player` e `Team_Rival1` a `Team_Rival6`. Preencha `teamId` (único, sem espaços: `player`, `rival_1`, ...), `displayName`, `shortName`, `color` (bem distintas entre si) e os dois `driverNames`.
3. Equipe do jogador: tudo em 0 (ela começa nanica). Rivais: varie os níveis iniciais (ex.: engenharia de 0 a 5) e as personalidades (uma com peso alto de propaganda, outra só engenharia, outra com `aiSpendEagerness` baixo...). Nomes e identidades das equipes ainda estão **Em aberto** na Parte 1: use nomes provisórios.

### ✅ Checkpoint da Fase 1
- O Console não mostra erros de compilação.
- Ao selecionar `GameBalance`, o Inspector mostra as seções Velocidade, Pneus, Pit stop, Economia, Campeonato, Investimentos e IA, já preenchidas.
- Existem 7 assets `Team_*`, cada um com `teamId` diferente e `driverNames` com 2 nomes.

#### Problemas comuns
- **O menu "Paddock Boss" não aparece em Create:** o script tem erro de compilação (veja o Console) ou o nome do arquivo não bate com o da classe (`GameBalance.cs` ↔ `class GameBalance`).
- **`compounds` veio vazio num asset antigo:** os padrões só valem para assets criados depois do script. Clique no ⋮ do componente → **Reset**, ou apague e recrie o asset.

Próxima fase: **Pista** — desenhar o traçado no Editor e transformá-lo em dados.

---

# Parte 5 — Implementação Unity: Fase 2 (Pista: geometria, editor e desenho)

## Fase 2 — Pista: geometria, editor e desenho

> Objetivo desta fase: desenhar uma pista na cena `TrackLab`, gravá-la num asset `TrackDefinition` e vê-la desenhada na cena `Main`.

**Conceito novo — a pista como linha:** a pista é uma lista fechada de pontos (waypoints). Qualquer lugar da pista é descrito por um único número: a **distância** desde a linha de largada (o waypoint 0). Uma volta inteira mede `Length`; a distância `Length × 2,5` é "metade da terceira volta". Toda a simulação (Fase 3) trabalha com esse número.

### 2.1 `TrackDefinition`

```csharp
// Caminho: Assets/_Project/Scripts/Data/TrackDefinition.cs
using UnityEngine;

namespace PaddockBoss.Data
{
    // POR QUE: os dados de uma pista do campeonato. O MVP tem 3 (Parte 1 §8).
    // ESTRATÉGIA: o traçado é um array de pontos 2D, preenchido pela ferramenta
    // TrackAuthoring (abaixo), não à mão. O resto são números de ajuste da pista.
    [CreateAssetMenu(menuName = "Paddock Boss/Track", fileName = "Track_")]
    public class TrackDefinition : ScriptableObject
    {
        public string trackId;
        public string displayName;
        public int laps = 12;

        [Header("Ritmo")]
        public float baseSpeed = 6f;                          // unidades por segundo na reta
        [Range(0.3f, 1f)] public float cornerSpeedFactor = 0.55f; // velocidade na curva mais fechada
        public float sharpCornerDegreesPerUnit = 15f;         // a partir daqui a curva conta como "fechada ao máximo"
        public float cornerInfluence = 4f;                    // quantas unidades antes/depois o carro já sente a curva
        public float pitLaneLossSeconds = 6f;

        [Header("Traçado (gerado pelo TrackAuthoring)")]
        public Vector2[] waypoints;
    }
}
```

### 2.2 `TrackPath`: a geometria

```csharp
// Caminho: Assets/_Project/Scripts/Game/TrackPath.cs
using System;
using UnityEngine;

namespace PaddockBoss.Game
{
    // POR QUE: a simulação precisa responder três perguntas sobre qualquer ponto
    // da pista: onde fica (para desenhar o carro), para onde aponta (para girar o
    // ícone) e quão fechada é a curva ali (para frear o carro).
    // ESTRATÉGIA: no construtor, calcula uma vez a distância acumulada até cada
    // waypoint e a "intensidade de curva" de cada um. Depois, cada pergunta só acha
    // o segmento certo e interpola. É uma classe C# comum (sem MonoBehaviour): não
    // precisa de cena para existir.
    public class TrackPath
    {
        private readonly Vector2[] _points;
        private readonly float[] _cumulative;   // _cumulative[i] = distância da largada até o waypoint i
        private readonly float[] _corner;       // 0 = reta, 1 = curva fechada ao máximo
        private readonly float _cornerInfluence;

        public float Length { get; }

        // Pré-calcula comprimento e curvas. A curva de um waypoint é o ângulo de
        // virada dividido pelo tamanho médio dos segmentos vizinhos (graus por
        // unidade): assim, um grampo feito de muitos pontos pequenos conta como
        // fechado, e uma curva longa e aberta não.
        public TrackPath(Vector2[] points, float sharpCornerDegreesPerUnit, float cornerInfluence)
        {
            if (points == null || points.Length < 3)
                throw new ArgumentException("A pista precisa de pelo menos 3 waypoints.");

            _points = points;
            _cornerInfluence = Mathf.Max(0.01f, cornerInfluence);
            int n = points.Length;

            _cumulative = new float[n + 1];
            for (int i = 0; i < n; i++)
                _cumulative[i + 1] = _cumulative[i] + Vector2.Distance(points[i], points[(i + 1) % n]);
            Length = _cumulative[n];

            _corner = new float[n];
            for (int i = 0; i < n; i++)
            {
                Vector2 inSegment = points[i] - points[(i - 1 + n) % n];
                Vector2 outSegment = points[(i + 1) % n] - points[i];
                float averageLength = 0.5f * (inSegment.magnitude + outSegment.magnitude);
                float degreesPerUnit = averageLength > 0f ? Vector2.Angle(inSegment, outSegment) / averageLength : 0f;
                _corner[i] = Mathf.Clamp01(degreesPerUnit / sharpCornerDegreesPerUnit);
            }
        }

        // Ponto da pista a uma distância da largada. Aceita distâncias de várias
        // voltas e negativas (o grid de largada fica atrás da linha).
        public Vector2 PositionAt(float distance)
        {
            int segment = SegmentAt(distance, out float t);
            return Vector2.Lerp(_points[segment], _points[(segment + 1) % _points.Length], t);
        }

        // Direção (vetor de tamanho 1) em que a pista segue nesse ponto.
        public Vector2 DirectionAt(float distance)
        {
            int segment = SegmentAt(distance, out _);
            return (_points[(segment + 1) % _points.Length] - _points[segment]).normalized;
        }

        // Intensidade de curva (0 a 1) nesse ponto. Cada waypoint "espalha" sua
        // curva por cornerInfluence unidades, para o carro frear antes do ponto,
        // e não num degrau em cima dele.
        public float CornerAt(float distance)
        {
            int segment = SegmentAt(distance, out float t);
            float segmentLength = _cumulative[segment + 1] - _cumulative[segment];
            float fromStart = t * segmentLength;
            float toEnd = segmentLength - fromStart;
            float fromPrevious = _corner[segment] * Mathf.Clamp01(1f - fromStart / _cornerInfluence);
            float fromNext = _corner[(segment + 1) % _points.Length] * Mathf.Clamp01(1f - toEnd / _cornerInfluence);
            return Mathf.Max(fromPrevious, fromNext);
        }

        // Acha em qual segmento (waypoint i → i+1) a distância cai e quanto (t, de
        // 0 a 1) já foi percorrido dele. Mathf.Repeat "dá a volta": 1,5 voltas vira
        // 0,5 volta. A busca é linear porque as pistas têm poucas dezenas de pontos.
        private int SegmentAt(float distance, out float t)
        {
            float d = Mathf.Repeat(distance, Length);
            int segment = 0;
            while (segment < _points.Length - 1 && _cumulative[segment + 1] < d) segment++;
            float segmentLength = _cumulative[segment + 1] - _cumulative[segment];
            t = segmentLength > 0f ? (d - _cumulative[segment]) / segmentLength : 0f;
            return segment;
        }
    }
}
```

### 2.3 `TrackAuthoring`: desenhar pistas no Editor

```csharp
// Caminho: Assets/_Project/Scripts/UI/TrackAuthoring.cs
using System.Collections.Generic;
using PaddockBoss.Data;
using UnityEngine;

namespace PaddockBoss.UI
{
    // POR QUE: digitar dezenas de coordenadas à mão é inviável. Com esta
    // ferramenta, cada waypoint é um GameObject filho que você arrasta na Scene
    // view; um clique grava tudo no asset da pista.
    // ESTRATÉGIA: OnDrawGizmos desenha o traçado na Scene view (gizmos são
    // desenhos de ajuda que só aparecem no Editor, nunca no jogo). [ContextMenu]
    // cria itens no menu ⋮ do componente no Inspector.
    public class TrackAuthoring : MonoBehaviour
    {
        [SerializeField] private TrackDefinition _target;

        // Desenha o traçado fechado; o waypoint 0 (largada) aparece em verde.
        private void OnDrawGizmos()
        {
            int count = transform.childCount;
            if (count < 2) return;
            for (int i = 0; i < count; i++)
            {
                Vector3 a = transform.GetChild(i).position;
                Vector3 b = transform.GetChild((i + 1) % count).position;
                Gizmos.color = Color.yellow;
                Gizmos.DrawLine(a, b);
                Gizmos.color = i == 0 ? Color.green : Color.white;
                Gizmos.DrawSphere(a, i == 0 ? 0.6f : 0.25f);
            }
        }

        // Copia a posição local dos filhos, na ordem da Hierarchy, para o asset.
        // SetDirty avisa o Editor que o asset mudou e precisa ir para o disco.
        [ContextMenu("Gravar waypoints na TrackDefinition")]
        private void Bake()
        {
            if (_target == null) { Debug.LogError("TrackAuthoring: escolha uma TrackDefinition em Target."); return; }
            var points = new Vector2[transform.childCount];
            for (int i = 0; i < points.Length; i++)
                points[i] = transform.GetChild(i).localPosition;
            _target.waypoints = points;
#if UNITY_EDITOR
            UnityEditor.EditorUtility.SetDirty(_target);
            UnityEditor.AssetDatabase.SaveAssets();
#endif
            Debug.Log($"TrackAuthoring: {points.Length} waypoints gravados em {_target.name}.");
        }

        // Cria um oval de teste (duas retas e duas curvas de raio 6) no sentido
        // anti-horário, apagando os filhos atuais. Serve de ponto de partida: depois
        // é só arrastar os pontos para dar forma à pista de verdade.
        [ContextMenu("Gerar oval de teste")]
        private void GenerateTestOval()
        {
            for (int i = transform.childCount - 1; i >= 0; i--)
                DestroyImmediate(transform.GetChild(i).gameObject);

            const float halfStraight = 12f, radius = 6f;
            const int straightPoints = 4, curvePoints = 8;
            var points = new List<Vector2>();
            for (int i = 0; i < straightPoints; i++)
                points.Add(new Vector2(Mathf.Lerp(-halfStraight, halfStraight, i / (float)straightPoints), -radius));
            for (int i = 0; i < curvePoints; i++)
            {
                float angle = Mathf.Lerp(-90f, 90f, i / (float)curvePoints) * Mathf.Deg2Rad;
                points.Add(new Vector2(halfStraight + Mathf.Cos(angle) * radius, Mathf.Sin(angle) * radius));
            }
            for (int i = 0; i < straightPoints; i++)
                points.Add(new Vector2(Mathf.Lerp(halfStraight, -halfStraight, i / (float)straightPoints), radius));
            for (int i = 0; i < curvePoints; i++)
            {
                float angle = Mathf.Lerp(90f, 270f, i / (float)curvePoints) * Mathf.Deg2Rad;
                points.Add(new Vector2(-halfStraight + Mathf.Cos(angle) * radius, Mathf.Sin(angle) * radius));
            }

            for (int i = 0; i < points.Count; i++)
            {
                var waypoint = new GameObject($"WP_{i:00}");
                waypoint.transform.SetParent(transform, false);
                waypoint.transform.localPosition = points[i];
            }
        }
    }
}
```

### 2.4 `TrackRenderer`: mostrar a pista no jogo

```csharp
// Caminho: Assets/_Project/Scripts/UI/TrackRenderer.cs
using PaddockBoss.Data;
using UnityEngine;

namespace PaddockBoss.UI
{
    // POR QUE: no jogo, a pista precisa aparecer como uma faixa grossa, no
    // estilo flat vector (Parte 1 §9), e cada corrida troca de pista.
    // ESTRATÉGIA: o LineRenderer é um componente da Unity que desenha uma linha
    // com espessura passando por uma lista de pontos; com loop = true, ele fecha o
    // circuito. A linha de largada é um sprite posicionado no waypoint 0, girado
    // para ficar atravessado na pista. Bounds guarda o retângulo que contém a
    // pista, usado pela câmera na Fase 8.
    [RequireComponent(typeof(LineRenderer))]
    public class TrackRenderer : MonoBehaviour
    {
        [SerializeField] private float _width = 1.6f;
        [SerializeField] private Transform _startLine;

        public Bounds Bounds { get; private set; }

        // Redesenha a pista a partir do asset.
        public void Draw(TrackDefinition track)
        {
            var line = GetComponent<LineRenderer>();
            Vector2[] points = track.waypoints;
            line.loop = true;
            line.useWorldSpace = true;
            line.widthMultiplier = _width;
            line.positionCount = points.Length;

            var bounds = new Bounds(points[0], Vector3.zero);
            for (int i = 0; i < points.Length; i++)
            {
                line.SetPosition(i, points[i]);
                bounds.Encapsulate(points[i]);
            }
            Bounds = bounds;

            if (_startLine != null)
            {
                _startLine.position = points[0];
                _startLine.up = (points[1] - points[0]).normalized; // o eixo X do sprite fica atravessado
            }
        }
    }
}
```

### 2.5 Desenhar a primeira pista

1. Em `Data/Tracks/`: **Create → Paddock Boss → Track** → `Track_A`. Preencha `trackId` = `track_a` e `displayName` (nomes das pistas: **Em aberto**).
2. Abra a cena `TrackLab`. Crie um GameObject vazio `TrackAuthoring` na posição (0, 0, 0), adicione o componente `TrackAuthoring` e arraste `Track_A` para **Target**.
3. No ⋮ do componente: **Gerar oval de teste**. O traçado amarelo aparece na Scene view (deixe o botão **Gizmos** ligado).
4. Arraste os filhos `WP_xx` para dar forma à pista. Regras práticas:
   - O sentido da corrida é a ordem dos filhos na Hierarchy. O `WP_00` (verde) é a largada; deixe-o numa reta.
   - Curvas são feitas com vários pontos próximos; retas, com poucos pontos espaçados.
   - Mantenha a pista dentro de uns 40 × 25 unidades (a câmera da Fase 8 enquadra qualquer tamanho, mas os números de ritmo foram pensados para isso).
5. ⋮ → **Gravar waypoints na TrackDefinition**. Confira no asset que `Waypoints` foi preenchido.
6. Repita para `Track_B` e `Track_C` (pode duplicar o objeto `TrackAuthoring`, trocar o Target e remodelar).

### 2.6 Mostrar a pista na cena `Main`

1. Abra `Main`. Crie os agrupadores vazios `[Systems]`, `[World]` e `[UI]`.
2. Em `[World]`: crie `Track` com **Add Component → Line Renderer** e `TrackRenderer`.
   - No Line Renderer, **Materials → Element 0** = `Sprite-Unlit-Default` (clique no ícone de busca do campo e procure). Com o material padrão, a linha fica rosa.
   - **Color**: um cinza-chumbo. **Corner Vertices** e **End Cap Vertices** = 4 (cantos arredondados, mais limpo no flat vector).
3. Em `[World]`: crie `StartLine` (**2D Object → Sprites → Square**), escala (1.6, 0.25, 1), cor branca, **Order in Layer** = 1. Arraste para o campo **Start Line** do `TrackRenderer`.
4. Câmera: **Projection** = Orthographic, **Size** = 16, posição (0, 0, -10). A Fase 8 troca isso por um enquadramento automático.
5. Teste rápido: o `TrackRenderer` só desenha quando alguém chama `Draw`, o que começa na Fase 3. Para conferir agora, adicione temporariamente ao `TrackRenderer` um `[SerializeField] private TrackDefinition _preview;` e um `private void Start() { if (_preview) Draw(_preview); }`, aperte Play, confira e remova essas duas linhas.

### ✅ Checkpoint da Fase 2
- Na `TrackLab`, o traçado amarelo fecha o circuito e o `WP_00` aparece em verde.
- Os 3 assets `Track_*` têm `Waypoints` preenchidos.
- Na `Main`, em Play (com o teste rápido), a pista aparece como uma faixa cinza fechada, com a linha de largada atravessada no `WP_00`.

#### Problemas comuns
- **Linha rosa ou invisível:** falta o material `Sprite-Unlit-Default` no Line Renderer (o projeto é URP 2D).
- **A linha some atrás do fundo:** no Line Renderer, ajuste **Sorting Layer**/**Order in Layer** (ex.: 0 para a pista, 1 para a linha de largada, 2 para os carros).
- **Gravei, mas o asset voltou ao que era:** você editou os waypoints e não clicou em **Gravar** de novo. O asset só muda no Bake.

Próxima fase: **Simulação da corrida** — 14 carros andando, completando voltas e trocando de posição.

---

# Parte 6 — Implementação Unity: Fase 3 (Simulação da corrida e tabela de posições)

## Fase 3 — Simulação da corrida e tabela de posições

> Objetivo desta fase: apertar Play e ver 14 carros largarem, andarem mais devagar nas curvas, completarem voltas e terminarem a corrida, com uma tabela de posições atualizada ao vivo.

### 3.1 `TeamState`: o que muda numa equipe

```csharp
// Caminho: Assets/_Project/Scripts/Game/TeamState.cs
using System;
using PaddockBoss.Data;

namespace PaddockBoss.Game
{
    // POR QUE: TeamDefinition (Fase 1) é a equipe "de fábrica"; TeamState é a
    // equipe agora, com dinheiro, níveis comprados e pontos. É ela que vai para o
    // save (Fase 7), por isso é [Serializable] e só tem tipos simples.
    // ESTRATÉGIA: [NonSerialized] marca Definition como "não salvar". Referências
    // a assets não vão para o JSON; ao carregar, ela é religada pelo teamId.
    [Serializable]
    public class TeamState
    {
        public string teamId;
        public bool isPlayer;
        public int money;
        public int points;
        public int engineering;
        public int marketing;
        public int pitCrew;
        public int[] driverSkill = new int[2];

        [NonSerialized] public TeamDefinition Definition;

        // Cria o estado inicial de uma equipe a partir do asset.
        public static TeamState Create(TeamDefinition definition, bool isPlayer, int startingMoney)
        {
            return new TeamState
            {
                teamId = definition.teamId,
                isPlayer = isPlayer,
                money = startingMoney,
                engineering = definition.engineering,
                marketing = definition.marketing,
                pitCrew = definition.pitCrew,
                driverSkill = new[] { definition.driverSkill[0], definition.driverSkill[1] },
                Definition = definition,
            };
        }

        // Nível atual de uma área. driverIndex só importa para DriverTraining.
        public int GetLevel(UpgradeType type, int driverIndex)
        {
            switch (type)
            {
                case UpgradeType.Engineering: return engineering;
                case UpgradeType.Marketing: return marketing;
                case UpgradeType.PitCrew: return pitCrew;
                case UpgradeType.DriverTraining: return driverSkill[driverIndex];
                default: throw new ArgumentOutOfRangeException(nameof(type));
            }
        }

        // Sobe um nível. Quem valida custo e limite é o UpgradeService (Fase 5).
        public void IncrementLevel(UpgradeType type, int driverIndex)
        {
            switch (type)
            {
                case UpgradeType.Engineering: engineering++; break;
                case UpgradeType.Marketing: marketing++; break;
                case UpgradeType.PitCrew: pitCrew++; break;
                case UpgradeType.DriverTraining: driverSkill[driverIndex]++; break;
                default: throw new ArgumentOutOfRangeException(nameof(type));
            }
        }
    }
}
```

### 3.2 `CarState`: um carro durante a corrida

```csharp
// Caminho: Assets/_Project/Scripts/Game/CarState.cs
using PaddockBoss.Data;

namespace PaddockBoss.Game
{
    // POR QUE: tudo o que a simulação sabe de um carro numa corrida: quanto andou,
    // voltas, pneu, box, posição. Só existe durante a corrida e não vai para o save.
    // ESTRATÉGIA: campos públicos simples, escritos apenas pelo RaceSimulator. A UI
    // só lê. A equipe (Team) é uma referência ao mesmo TeamState do campeonato:
    // quando o jogador compra engenharia, o carro "vê" o nível novo no mesmo frame.
    public class CarState
    {
        public readonly int Id;
        public readonly TeamState Team;
        public readonly int DriverIndex;
        public readonly float NoiseSeed;

        public float Distance;          // unidades desde a largada (negativo no grid)
        public int LapsCompleted;
        public float LapStartTime;
        public float LastLapTime;
        public float CurrentSpeed;

        public TireCompound Compound;
        public float TireWear;          // 0 = novo, 1 = acabado

        public bool PitRequested;
        public TireCompound PitCompound;
        public float PitTimeRemaining;
        public int PitStops;

        public bool Finished;
        public float FinishTime;
        public int Position;            // 1 = líder

        public bool InPit => PitTimeRemaining > 0f;
        public bool IsPlayer => Team.isPlayer;
        public string DriverName => Team.Definition.driverNames[DriverIndex];

        // Cria o carro de um piloto. noiseSeed separa o "ritmo" de cada piloto.
        public CarState(int id, TeamState team, int driverIndex, float noiseSeed)
        {
            Id = id;
            Team = team;
            DriverIndex = driverIndex;
            NoiseSeed = noiseSeed;
        }
    }
}
```

### 3.3 `RaceSimulator`: o coração do jogo

```csharp
// Caminho: Assets/_Project/Scripts/Game/RaceSimulator.cs
using System;
using System.Collections.Generic;
using PaddockBoss.Data;
using UnityEngine;

namespace PaddockBoss.Game
{
    // POR QUE: é aqui que a corrida acontece: velocidade, voltas, box, chegada e
    // ordem. Fica separada da tela para poder rodar em qualquer velocidade e,
    // depois, em testes automáticos.
    // ESTRATÉGIA: Tick(dt) avança a corrida dt segundos: move cada carro
    // (Distance += velocidade × dt), detecta quem cruzou a linha, reordena a
    // tabela e dispara eventos. Um "event" em C# é uma lista de funções que outros
    // objetos registram com += para serem avisados (a economia ouve as
    // ultrapassagens; a UI ouve o fim da corrida). Os eventos de volta e chegada
    // são disparados só depois de reordenar, para quem ouve já ver a posição certa.
    public class RaceSimulator
    {
        public event Action<CarState, CarState> Overtake;   // (quem passou, quem foi passado)
        public event Action<CarState> LapCompleted;
        public event Action<CarState> PitStopStarted;
        public event Action<CarState> PitStopFinished;
        public event Action<CarState> CarFinished;
        public event Action RaceFinished;

        public TrackDefinition Track { get; }
        public TrackPath Path { get; }
        public GameBalance Balance { get; }
        public IReadOnlyList<CarState> Cars => _cars;
        public IReadOnlyList<CarState> Standings => _standings;
        public float ElapsedTime { get; private set; }
        public bool IsFinished { get; private set; }
        public float RaceDistance => Track.laps * Path.Length;
        public int LeaderLap => Mathf.Min(_standings[0].LapsCompleted + 1, Track.laps);

        private readonly List<CarState> _cars = new();
        private readonly List<CarState> _standings = new();
        private readonly List<CarState> _lapEvents = new();
        private readonly List<CarState> _finishEvents = new();
        private readonly int[] _previousPosition;

        // Monta o grid: 2 carros por equipe, ordem de largada sorteada (a regra de
        // grid está Em aberto na Parte 1 §3), um atrás do outro antes da linha.
        public RaceSimulator(TrackDefinition track, GameBalance balance, IReadOnlyList<TeamState> teams, int seed)
        {
            Track = track;
            Balance = balance;
            Path = new TrackPath(track.waypoints, track.sharpCornerDegreesPerUnit, track.cornerInfluence);

            var rng = new System.Random(seed);
            foreach (var team in teams)
                for (int driver = 0; driver < 2; driver++)
                    _cars.Add(new CarState(_cars.Count, team, driver, (float)rng.NextDouble() * 1000f)
                    {
                        Compound = balance.startingCompound,
                    });

            var grid = new List<CarState>(_cars);
            for (int i = grid.Count - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (grid[i], grid[j]) = (grid[j], grid[i]);
            }
            for (int i = 0; i < grid.Count; i++)
                grid[i].Distance = -(i + 1) * balance.gridSpacing;

            _previousPosition = new int[_cars.Count];
            _standings.AddRange(_cars);
            SortStandings();
        }

        // Avança a corrida dt segundos de simulação.
        public void Tick(float dt)
        {
            if (IsFinished || dt <= 0f) return;
            ElapsedTime += dt;
            _lapEvents.Clear();
            _finishEvents.Clear();

            foreach (var car in _cars)
            {
                if (car.Finished) continue;
                if (car.InPit) { TickPit(car, dt); continue; }

                car.CurrentSpeed = ComputeSpeed(car);
                car.Distance += car.CurrentSpeed * dt;
                car.TireWear = Mathf.Min(1f, car.TireWear + Balance.GetCompound(car.Compound).wearPerSecond * dt);
                CheckLapCrossing(car);
            }

            UpdateStandings();
            foreach (var car in _lapEvents) LapCompleted?.Invoke(car);
            foreach (var car in _finishEvents) CarFinished?.Invoke(car);

            if (_cars.TrueForAll(c => c.Finished))
            {
                IsFinished = true;
                RaceFinished?.Invoke();
            }
        }

        // Marca um carro para entrar no box ao completar a volta atual.
        public void RequestPit(CarState car, TireCompound compound)
        {
            if (car.Finished) return;
            car.PitRequested = true;
            car.PitCompound = compound;
        }

        // Desiste do box pedido (se o carro ainda não entrou).
        public void CancelPit(CarState car) => car.PitRequested = false;

        // Velocidade do carro agora (Parte 1 §3): base da pista × curva × desempenho
        // × pneu × oscilação do piloto. Os níveis são lidos a cada chamada, por isso
        // uma compra vale no mesmo instante.
        private float ComputeSpeed(CarState car)
        {
            TeamState team = car.Team;
            int skill = team.driverSkill[car.DriverIndex];

            float corner = Path.CornerAt(car.Distance);
            float trackSpeed = Track.baseSpeed * Mathf.Lerp(1f, Track.cornerSpeedFactor, corner);

            float performance = 1f
                + team.engineering * Balance.engineeringBonusPerLevel
                + skill * Balance.driverBonusPerLevel
                + Balance.GetCompound(car.Compound).gripBonus;

            float tire = car.TireWear < 1f
                ? Mathf.Lerp(1f, Balance.wornTireSpeedMultiplier, car.TireWear)
                : Balance.deadTireSpeedMultiplier;

            // Perlin noise devolve valores suaves (sem saltos) entre 0 e 1. Com
            // 0,25 × tempo, o ritmo de cada piloto sobe e desce devagar.
            float consistency = Mathf.Clamp01(skill * Balance.consistencyPerDriverLevel);
            float noise = (Mathf.PerlinNoise(car.NoiseSeed, ElapsedTime * 0.25f) * 2f - 1f)
                          * Balance.noiseAmplitude * (1f - consistency);

            return trackSpeed * performance * tire * (1f + noise);
        }

        // Conta a volta quando o carro passa de um múltiplo de Path.Length. Na
        // última volta, registra a chegada; se havia box pedido, entra no box.
        private void CheckLapCrossing(CarState car)
        {
            int lapsOnTrack = Mathf.FloorToInt(car.Distance / Path.Length);
            if (lapsOnTrack <= car.LapsCompleted) return;

            car.LapsCompleted = lapsOnTrack;
            car.LastLapTime = ElapsedTime - car.LapStartTime;
            car.LapStartTime = ElapsedTime;

            if (car.LapsCompleted >= Track.laps)
            {
                // Desconta o pedaço que passou da linha neste tick, para que dois
                // carros chegando no mesmo frame fiquem na ordem certa.
                float overshoot = car.Distance - RaceDistance;
                car.FinishTime = ElapsedTime - (car.CurrentSpeed > 0f ? overshoot / car.CurrentSpeed : 0f);
                car.Finished = true;
                car.Distance = RaceDistance;
                car.CurrentSpeed = 0f;
                _finishEvents.Add(car);
                return;
            }

            _lapEvents.Add(car);
            if (car.PitRequested) StartPit(car);
        }

        // Para o carro na linha (= entrada do box) pelo tempo do pit lane + serviço.
        private void StartPit(CarState car)
        {
            car.PitRequested = false;
            car.Distance = car.LapsCompleted * Path.Length;
            car.CurrentSpeed = 0f;
            float service = Mathf.Max(Balance.minPitServiceSeconds,
                Balance.basePitServiceSeconds - car.Team.pitCrew * Balance.pitServiceReductionPerLevel);
            car.PitTimeRemaining = Track.pitLaneLossSeconds + service;
            PitStopStarted?.Invoke(car);
        }

        // Conta o tempo parado; ao terminar, troca os pneus.
        private void TickPit(CarState car, float dt)
        {
            car.CurrentSpeed = 0f;
            car.PitTimeRemaining -= dt;
            if (car.PitTimeRemaining > 0f) return;

            car.PitTimeRemaining = 0f;
            car.Compound = car.PitCompound;
            car.TireWear = 0f;
            car.PitStops++;
            PitStopFinished?.Invoke(car);
        }

        // Reordena e dispara Overtake para cada par que trocou de lugar. Passar um
        // carro parado no box ou que já terminou não conta (Parte 1 §3).
        private void UpdateStandings()
        {
            foreach (var car in _cars) _previousPosition[car.Id] = car.Position;
            SortStandings();
            if (Overtake == null) return;

            foreach (var car in _cars)
            {
                if (car.Position >= _previousPosition[car.Id]) continue;
                foreach (var other in _cars)
                {
                    if (other == car || other.InPit || other.Finished) continue;
                    bool wasAhead = _previousPosition[other.Id] < _previousPosition[car.Id];
                    bool isNowBehind = other.Position > car.Position;
                    if (wasAhead && isNowBehind) Overtake.Invoke(car, other);
                }
            }
        }

        // Ordena a tabela e grava a posição de cada carro.
        private void SortStandings()
        {
            _standings.Sort(CompareCars);
            for (int i = 0; i < _standings.Count; i++) _standings[i].Position = i + 1;
        }

        // Quem terminou vem antes (pelo tempo de chegada); entre os que estão
        // correndo, quem andou mais. Comparar a distância total faz um retardatário
        // com uma volta a menos ficar atrás mesmo estando "na frente" no mapa.
        private static int CompareCars(CarState a, CarState b)
        {
            if (a.Finished != b.Finished) return a.Finished ? -1 : 1;
            int result = a.Finished ? a.FinishTime.CompareTo(b.FinishTime) : b.Distance.CompareTo(a.Distance);
            return result != 0 ? result : a.Id.CompareTo(b.Id);
        }
    }
}
```

### 3.4 `CarMarker`: o carro no mapa

```csharp
// Caminho: Assets/_Project/Scripts/UI/CarMarker.cs
using PaddockBoss.Game;
using TMPro;
using UnityEngine;

namespace PaddockBoss.UI
{
    // POR QUE: o desenho de um carro no mapa. Ele não decide nada: a cada frame,
    // lê o CarState e se coloca no lugar certo da pista.
    // ESTRATÉGIA: LateUpdate é chamado em todo frame depois de todos os Update.
    // Como a simulação avança no Update do RaceRunner, desenhar no LateUpdate
    // garante que o ícone mostra a posição já atualizada. Cada carro anda numa
    // "faixa" levemente deslocada para os lados (_laneOffset), para que carros
    // colados não fiquem exatamente um em cima do outro.
    public class CarMarker : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _body;
        [SerializeField] private SpriteRenderer _playerHighlight;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private float _laneSpacing = 0.3f;
        [SerializeField] private Vector2 _pitOffset = new(0f, -1.5f);

        private CarState _car;
        private TrackPath _path;
        private float _laneOffset;

        // Liga este ícone a um carro da simulação.
        public void Bind(CarState car, TrackPath path)
        {
            _car = car;
            _path = path;
            _body.color = car.Team.Definition.color;
            _playerHighlight.enabled = car.IsPlayer;
            _label.text = car.DriverName.Substring(0, 1);
            _laneOffset = (car.Id % 3 - 1) * _laneSpacing;
            name = $"Car_{car.Team.teamId}_{car.DriverIndex}";
        }

        // Posiciona e gira o ícone; no box, desloca para fora da pista.
        private void LateUpdate()
        {
            if (_car == null) return;
            Vector2 direction = _path.DirectionAt(_car.Distance);
            Vector2 side = new(-direction.y, direction.x);
            Vector2 position = _path.PositionAt(_car.Distance) + side * _laneOffset;
            if (_car.InPit) position += _pitOffset;

            // O sprite do carro aponta para cima (+Y); Atan2 dá o ângulo da direção.
            float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg - 90f;
            transform.SetPositionAndRotation(position, Quaternion.Euler(0f, 0f, angle));
            _label.transform.rotation = Quaternion.identity; // a letra fica sempre de pé
        }
    }
}
```

### 3.5 `RaceRunner`: liga a simulação ao tempo do jogo

```csharp
// Caminho: Assets/_Project/Scripts/Game/RaceRunner.cs
using System;
using System.Collections.Generic;
using PaddockBoss.Data;
using PaddockBoss.UI;
using UnityEngine;

namespace PaddockBoss.Game
{
    // POR QUE: RaceSimulator é C# puro e não sabe que o tempo passa. Este
    // MonoBehaviour (script preso a um GameObject da cena) é a ponte: a cada
    // frame, entrega à simulação o tempo que passou e cria os ícones dos carros.
    // ESTRATÉGIA: Update roda uma vez por frame. Time.deltaTime é o tempo desde o
    // frame anterior; ele é dividido em passos de no máximo 0,05 s, para que um
    // frame lento (ou _timeScale alto) não faça um carro "pular" uma curva ou a
    // linha de chegada. Outros objetos ouvem RaceStarted/RaceEnded.
    public class RaceRunner : MonoBehaviour
    {
        private const float MaxStep = 0.05f;

        [SerializeField] private GameBalance _balance;
        [SerializeField] private TrackRenderer _trackRenderer;
        [SerializeField] private CarMarker _carMarkerPrefab;
        [SerializeField] private Transform _markersParent;
        [SerializeField, Range(0.5f, 8f)] private float _timeScale = 1f; // só para testes (Parte 1 §3: Em aberto)

        public RaceSimulator Sim { get; private set; }
        public GameBalance Balance => _balance;
        public event Action<RaceSimulator> RaceStarted;
        public event Action<RaceSimulator> RaceEnded;

        private readonly List<CarMarker> _markers = new();

        // Começa uma corrida nova: simulação, desenho da pista e um ícone por carro.
        public void StartRace(TrackDefinition track, IReadOnlyList<TeamState> teams)
        {
            ClearMarkers();
            Sim = new RaceSimulator(track, _balance, teams, Environment.TickCount);
            Sim.RaceFinished += HandleRaceFinished;

            _trackRenderer.Draw(track);
            foreach (var car in Sim.Cars)
            {
                // Instantiate cria uma cópia do prefab (um GameObject "modelo" salvo
                // como asset) na cena, como filho de _markersParent.
                CarMarker marker = Instantiate(_carMarkerPrefab, _markersParent);
                marker.Bind(car, Sim.Path);
                _markers.Add(marker);
            }
            RaceStarted?.Invoke(Sim);
        }

        // Avança a simulação em passos pequenos.
        private void Update()
        {
            if (Sim == null || Sim.IsFinished) return;
            float remaining = Time.deltaTime * _timeScale;
            while (remaining > 0f && !Sim.IsFinished)
            {
                float step = Mathf.Min(remaining, MaxStep);
                Sim.Tick(step);
                remaining -= step;
            }
        }

        // Repassa o fim da corrida para quem estiver ouvindo.
        private void HandleRaceFinished() => RaceEnded?.Invoke(Sim);

        // Apaga os ícones da corrida anterior.
        private void ClearMarkers()
        {
            foreach (var marker in _markers)
                if (marker != null) Destroy(marker.gameObject);
            _markers.Clear();
        }
    }
}
```

### 3.6 `RaceHUD`: volta e tabela de posições

```csharp
// Caminho: Assets/_Project/Scripts/UI/RaceHUD.cs
using System.Text;
using PaddockBoss.Game;
using TMPro;
using UnityEngine;

namespace PaddockBoss.UI
{
    // POR QUE: o jogador precisa ver a ordem da corrida e a diferença para o líder
    // (Parte 1 §10) para decidir onde gastar.
    // ESTRATÉGIA: um único texto TMP com uma linha por carro, montado com
    // StringBuilder (evita criar dezenas de strings por frame) e "rich text" do
    // TMP (<b>, <color>) para destacar o jogador. Atualiza 4 vezes por segundo,
    // que é o bastante para leitura e mais barato que a cada frame.
    public class RaceHUD : MonoBehaviour
    {
        [SerializeField] private RaceRunner _runner;
        [SerializeField] private TMP_Text _lapText;
        [SerializeField] private TMP_Text _standingsText;
        [SerializeField] private float _refreshInterval = 0.25f;

        private readonly StringBuilder _builder = new();
        private float _timer;

        // Redesenha os textos no intervalo configurado.
        private void Update()
        {
            RaceSimulator sim = _runner.Sim;
            if (sim == null) return;
            _timer -= Time.deltaTime;
            if (_timer > 0f) return;
            _timer = _refreshInterval;

            _lapText.text = sim.IsFinished ? "Bandeirada!"
                : sim.LeaderLap == sim.Track.laps ? $"Última volta ({sim.Track.laps}/{sim.Track.laps})"
                : $"Volta {sim.LeaderLap}/{sim.Track.laps}";

            _builder.Clear();
            CarState leader = sim.Standings[0];
            foreach (CarState car in sim.Standings)
            {
                string color = ColorUtility.ToHtmlStringRGB(car.Team.Definition.color);
                string status = car.InPit ? " <i>BOX</i>" : car.Finished ? " <i>FIM</i>" : "";
                string gap = car == leader ? "Líder" : FormatGap(sim, leader, car);
                string line = $"{car.Position,2}. <color=#{color}>{car.Team.Definition.shortName}</color> {car.DriverName}{status} <size=80%>{gap}</size>";
                _builder.AppendLine(car.IsPlayer ? $"<b>{line}</b>" : line);
            }
            _standingsText.text = _builder.ToString();
        }

        // Diferença para o líder: em voltas, se for uma ou mais; senão, em
        // segundos aproximados (distância ÷ velocidade média típica da pista).
        private static string FormatGap(RaceSimulator sim, CarState leader, CarState car)
        {
            if (leader.Finished && car.Finished) return $"+{car.FinishTime - leader.FinishTime:0.0}s";
            float lapsBehind = (leader.Distance - car.Distance) / sim.Path.Length;
            if (lapsBehind >= 1f) return $"+{(int)lapsBehind} v";
            float seconds = (leader.Distance - car.Distance) / (sim.Track.baseSpeed * 0.75f);
            return $"+{seconds:0.0}s";
        }
    }
}
```

### 3.7 `RaceTestStarter`: largada de teste

```csharp
// Caminho: Assets/_Project/Scripts/Game/RaceTestStarter.cs
using System.Collections.Generic;
using PaddockBoss.Data;
using UnityEngine;

namespace PaddockBoss.Game
{
    // POR QUE: o campeonato só chega na Fase 7, mas a corrida precisa ser testada
    // desde já. Este script monta as equipes e larga uma corrida ao apertar Play.
    // ESTRATÉGIA: Start roda uma vez, no primeiro frame em que o objeto está
    // ativo (depois de todos os Awake). Na Fase 7, o GameSession assume esse papel
    // e este componente é desativado.
    public class RaceTestStarter : MonoBehaviour
    {
        [SerializeField] private RaceRunner _runner;
        [SerializeField] private TrackDefinition _track;
        [SerializeField] private TeamDefinition _playerTeam;
        [SerializeField] private TeamDefinition[] _rivalTeams;

        // Cria as equipes "zeradas" e larga.
        private void Start()
        {
            int money = _runner.Balance.startingMoney;
            var teams = new List<TeamState> { TeamState.Create(_playerTeam, true, money) };
            foreach (var rival in _rivalTeams) teams.Add(TeamState.Create(rival, false, money));
            _runner.StartRace(_track, teams);
        }
    }
}
```

### 3.8 Montar a cena

1. **Prefab do carro:** na `Main`, crie `CarMarker` (vazio) com três filhos:
   - `Body`: **2D Object → Sprites → Capsule**, escala (0.5, 0.8, 1), **Order in Layer** 2. A arte flat vector entra na Fase 8.
   - `Highlight`: outra Capsule, escala (0.7, 1.0, 1), cor amarela, **Order in Layer** 1 (fica atrás do Body, como um contorno).
   - `Label`: **3D Object → Text - TextMeshPro** (o TMP "de mundo", não o de UI), texto `A`, **Font Size** 3, centralizado, cor preta; no **Extra Settings** do TMP, **Order in Layer** 3.
   - No pai, adicione `CarMarker` e ligue `Body`, `Highlight` e `Label`. Arraste o objeto para `Prefabs/` e apague-o da cena.
2. Em `[World]`, crie `Cars` (vazio).
3. Em `[Systems]`, crie `RaceRunner` com o componente `RaceRunner`: **Balance** = `GameBalance`, **Track Renderer** = `Track`, **Car Marker Prefab** = o prefab, **Markers Parent** = `Cars`.
4. No mesmo objeto, adicione `RaceTestStarter`: **Runner** = o próprio RaceRunner, **Track** = `Track_A`, **Player Team** = `Team_Player`, **Rival Teams** = as 6 rivais.
5. **UI:** em `[UI]`, crie **UI → Canvas** (o EventSystem vem junto; deixe-o na raiz). No Canvas, crie `SidePanel` (**UI → Panel**) ancorado à direita: no Rect Transform, use o preset de âncora *stretch vertical / right*, **Width** 640. Dentro dele, dois **UI → Text - TextMeshPro**: `LapText` (no topo, fonte 40) e `StandingsText` (abaixo, fonte 28, alinhado à esquerda e ao topo, altura para 14 linhas).
6. No `SidePanel`, adicione `RaceHUD` e ligue **Runner**, **Lap Text** e **Standings Text**.

### ✅ Checkpoint da Fase 3
- Ao apertar Play, 14 carros coloridos saem enfileirados de trás da linha de largada.
- Nas curvas os carros ficam visivelmente mais lentos; as posições mudam ao longo da corrida.
- O texto de volta vai de `Volta 1/12` até `Última volta` e `Bandeirada!`; carros que terminaram mostram `FIM` e param na linha.
- Os dois carros da equipe do jogador aparecem em negrito na tabela e com o contorno amarelo no mapa.
- Com **Time Scale** = 8 no RaceRunner, a corrida inteira passa em menos de um minuto, sem carros "pulando" a linha de chegada.

#### Problemas comuns
- **`ArgumentException: A pista precisa de pelo menos 3 waypoints`:** a `TrackDefinition` usada não passou pelo **Gravar** da Fase 2.
- **Todos os carros andam igual e a ordem nunca muda:** confira se os rivais têm níveis iniciais diferentes e se `noiseAmplitude` não está 0 no `GameBalance`.
- **`NullReferenceException` no `CarMarker.Bind`:** algum campo do prefab ficou sem ligar (Body, Highlight ou Label), ou uma `TeamDefinition` tem `driverNames` com nome vazio.

Próxima fase: **Pneus e pit stop** — desgaste visível e o primeiro controle do jogador.

---

# Parte 7 — Implementação Unity: Fase 4 (Pneus e pit stop)

## Fase 4 — Pneus e pit stop

> Objetivo desta fase: para cada carro do jogador, ver o desgaste do pneu, escolher o composto e mandar para o box.

A simulação já gasta pneus e faz pit stops (Fase 3: `TireWear`, `RequestPit`, `StartPit`, `TickPit`). Falta a interface.

### 4.1 `CarPitControls`

```csharp
// Caminho: Assets/_Project/Scripts/UI/CarPitControls.cs
using PaddockBoss.Data;
using PaddockBoss.Game;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace PaddockBoss.UI
{
    // POR QUE: é o primeiro controle do jogador na corrida (Parte 1 §5): ver o
    // pneu, escolher o composto e chamar o carro para o box.
    // ESTRATÉGIA: um componente por carro do jogador (_driverIndex 0 ou 1).
    // OnEnable/OnDisable rodam quando o objeto liga/desliga; é ali que o script
    // se inscreve e se desinscreve do RaceStarted, para não ficar "ouvindo" depois
    // de desligado. Os botões só chamam métodos da simulação (RequestPit/CancelPit);
    // os textos são relidos a cada frame.
    public class CarPitControls : MonoBehaviour
    {
        [SerializeField] private RaceRunner _runner;
        [SerializeField, Range(0, 1)] private int _driverIndex;
        [SerializeField] private TMP_Text _driverText;
        [SerializeField] private Image _wearFill;
        [SerializeField] private TMP_Text _tireText;
        [SerializeField] private Button _boxButton;
        [SerializeField] private TMP_Text _boxLabel;
        [SerializeField] private Button _compoundButton;
        [SerializeField] private TMP_Text _compoundLabel;

        private CarState _car;
        private TireCompound _selected = TireCompound.Medium;

        // Liga os botões uma vez. onClick.AddListener registra a função chamada
        // no clique ou toque.
        private void Awake()
        {
            _boxButton.onClick.AddListener(HandleBoxClicked);
            _compoundButton.onClick.AddListener(HandleCompoundClicked);
        }

        // Passa a ouvir as largadas; se a corrida já começou, pega o carro agora.
        private void OnEnable()
        {
            _runner.RaceStarted += HandleRaceStarted;
            if (_runner.Sim != null) HandleRaceStarted(_runner.Sim);
        }

        // Para de ouvir quando o painel é desligado.
        private void OnDisable() => _runner.RaceStarted -= HandleRaceStarted;

        // Acha o carro do jogador que este painel controla.
        private void HandleRaceStarted(RaceSimulator sim)
        {
            _car = null;
            foreach (var car in sim.Cars)
                if (car.IsPlayer && car.DriverIndex == _driverIndex) _car = car;
        }

        // Alterna entre pedir e cancelar o box.
        private void HandleBoxClicked()
        {
            if (_car == null) return;
            if (_car.PitRequested) _runner.Sim.CancelPit(_car);
            else _runner.Sim.RequestPit(_car, _selected);
        }

        // Passa para o próximo composto; se o box já foi pedido, atualiza o pedido.
        private void HandleCompoundClicked()
        {
            _selected = (TireCompound)(((int)_selected + 1) % 3);
            if (_car != null && _car.PitRequested) _runner.Sim.RequestPit(_car, _selected);
        }

        // Atualiza barra de desgaste, textos e estado dos botões.
        private void Update()
        {
            if (_car == null) return;
            GameBalance balance = _runner.Balance;

            _driverText.text = $"P{_car.Position}  {_car.DriverName}";
            _wearFill.fillAmount = 1f - _car.TireWear;
            _wearFill.color = Color.Lerp(Color.green, Color.red, _car.TireWear);
            _tireText.text = $"{balance.GetCompound(_car.Compound).displayName}  {(1f - _car.TireWear) * 100f:0}%";
            _compoundLabel.text = $"Trocar por: {balance.GetCompound(_selected).displayName}";

            _boxLabel.text = _car.InPit ? $"No box... {_car.PitTimeRemaining:0.0}s"
                : _car.PitRequested ? "Box nesta volta (cancelar)"
                : "Box";
            bool canAct = !_car.Finished && !_car.InPit;
            _boxButton.interactable = canAct;
            _compoundButton.interactable = canAct;
        }
    }
}
```

### 4.2 Montar o painel

1. No `SidePanel`, abaixo da tabela, crie `PitPanel` com um **Horizontal Layout Group** e dois filhos `CarPit_0` e `CarPit_1`, cada um com **Vertical Layout Group** e:
   - `DriverText` (TMP).
   - `WearBar`: **UI → Image** de fundo cinza com um filho `Fill` (**UI → Image**, **Image Type** = *Filled*, **Fill Method** = *Horizontal*). O campo **Source Image** precisa ter um sprite (use o `UISprite` padrão), senão o *Filled* não aparece no Inspector.
   - `TireText` (TMP).
   - `CompoundButton` e `BoxButton` (**UI → Button - TextMeshPro**).
2. Adicione `CarPitControls` em cada um: **Runner**, **Driver Index** (0 no primeiro, 1 no segundo) e os campos de texto, imagem e botões.

### ✅ Checkpoint da Fase 4
- A barra de cada carro do jogador esvazia e passa de verde a vermelho ao longo da corrida.
- **Box** muda para "Box nesta volta"; ao cruzar a linha, o carro sai para o lado da pista, o botão mostra a contagem regressiva e o carro volta com 100% e o composto escolhido.
- Com pneu acabado, o carro fica claramente mais lento e perde posições (teste deixando um carro sem parar a corrida inteira).
- A tabela mostra `BOX` enquanto o carro está parado, e ninguém ganha "ultrapassagem" por passar um carro no box (isso fica visível na Fase 5, quando ultrapassagem passa a dar dinheiro).

#### Problemas comuns
- **A barra não esvazia:** a `Image` do `Fill` não está como *Filled* ou não tem Source Image.
- **O botão não reage ao clique:** falta o `EventSystem` na cena, ou outro painel transparente está por cima, bloqueando os cliques (desligue **Raycast Target** das imagens decorativas).

Próxima fase: **Economia e investimentos** — o dinheiro entra durante a corrida e vira desempenho.

---

# Parte 8 — Implementação Unity: Fase 5 (Economia ao vivo e investimentos)

## Fase 5 — Economia ao vivo e investimentos

> Objetivo desta fase: o dinheiro da equipe sobe durante a corrida (patrocínio, voltas, ultrapassagens, prêmio), e cada botão de investimento compra um nível que muda o desempenho na hora.

### 5.1 `RaceEconomy`: o dinheiro de uma corrida

```csharp
// Caminho: Assets/_Project/Scripts/Game/RaceEconomy.cs
using System;
using System.Collections.Generic;
using PaddockBoss.Data;

namespace PaddockBoss.Game
{
    // POR QUE: as três fontes de dinheiro da Parte 1 §6 acontecem durante a
    // corrida e valem para todas as equipes, inclusive as rivais.
    // ESTRATÉGIA: a economia não sabe nada de pista nem de velocidade; ela só
    // ouve os eventos da simulação (ultrapassagem, volta, chegada) e paga. O
    // patrocínio é contínuo: acumula frações num "cofrinho" por equipe e só soma
    // ao dinheiro (que é inteiro) quando junta 1 ou mais.
    public class RaceEconomy
    {
        public event Action<TeamState, int, string> MoneyEarned; // (equipe, valor, motivo)

        private readonly RaceSimulator _sim;
        private readonly GameBalance _balance;
        private readonly List<TeamState> _teams = new();
        private readonly Dictionary<TeamState, float> _sponsorBuffer = new();

        // Registra as equipes da corrida e passa a ouvir a simulação.
        public RaceEconomy(RaceSimulator sim, GameBalance balance)
        {
            _sim = sim;
            _balance = balance;
            foreach (var car in sim.Cars)
            {
                if (_sponsorBuffer.ContainsKey(car.Team)) continue;
                _teams.Add(car.Team);
                _sponsorBuffer[car.Team] = 0f;
            }

            sim.Overtake += HandleOvertake;
            sim.LapCompleted += HandleLapCompleted;
            sim.CarFinished += HandleCarFinished;
        }

        // Renda de patrocínio por segundo de uma equipe (cresce com propaganda).
        public float SponsorPerSecond(TeamState team) =>
            _balance.baseSponsorPerSecond * (1f + team.marketing * _balance.marketingBonusPerLevel);

        // Paga o patrocínio do intervalo dt. Não dispara MoneyEarned: seria uma
        // mensagem por frame.
        public void Tick(float dt)
        {
            if (_sim.IsFinished) return;
            foreach (var team in _teams)
            {
                float buffer = _sponsorBuffer[team] + SponsorPerSecond(team) * dt;
                int whole = (int)buffer;
                team.money += whole;
                _sponsorBuffer[team] = buffer - whole;
            }
        }

        // Bônus fixo para a equipe de quem ultrapassou.
        private void HandleOvertake(CarState by, CarState passed) =>
            Pay(by.Team, _balance.overtakeBonus, "Ultrapassagem");

        // Bônus por volta completada, conforme a posição.
        private void HandleLapCompleted(CarState car) =>
            Pay(car.Team, GameBalance.ByPosition(_balance.lapBonusByPosition, car.Position), $"Volta em P{car.Position}");

        // Prêmio de chegada, conforme a posição final.
        private void HandleCarFinished(CarState car) =>
            Pay(car.Team, GameBalance.ByPosition(_balance.prizeByPosition, car.Position), $"Chegada em P{car.Position}");

        // Soma o valor e avisa quem estiver ouvindo (a UI mostra só os do jogador).
        private void Pay(TeamState team, int amount, string reason)
        {
            if (amount <= 0) return;
            team.money += amount;
            MoneyEarned?.Invoke(team, amount, reason);
        }
    }
}
```

### 5.2 `UpgradeService`: comprar níveis

```csharp
// Caminho: Assets/_Project/Scripts/Game/UpgradeService.cs
using System;
using PaddockBoss.Data;
using UnityEngine;

namespace PaddockBoss.Game
{
    // POR QUE: a regra de compra (custo crescente, nível máximo, não gastar o que
    // não tem) precisa ser a mesma para o jogador e para a IA (Fase 6).
    // ESTRATÉGIA: um único lugar valida e aplica a compra. O efeito é imediato
    // porque o RaceSimulator lê os níveis do TeamState a cada Tick (Fase 3): não
    // há nada para "aplicar" além de subir o número.
    public class UpgradeService
    {
        public event Action<TeamState, UpgradeType, int> Upgraded; // (equipe, área, piloto)

        private readonly GameBalance _balance;

        // Guarda o balanceamento de onde vêm custos e limites.
        public UpgradeService(GameBalance balance) => _balance = balance;

        // Custo do próximo nível: baseCost × growth^nível atual.
        public int GetCost(TeamState team, UpgradeType type, int driverIndex = 0)
        {
            UpgradeCostData data = _balance.GetUpgrade(type);
            int level = team.GetLevel(type, driverIndex);
            return Mathf.RoundToInt(data.baseCost * Mathf.Pow(data.growth, level));
        }

        // Já chegou ao nível máximo?
        public bool IsMaxed(TeamState team, UpgradeType type, int driverIndex = 0) =>
            team.GetLevel(type, driverIndex) >= _balance.maxLevel;

        // Pode comprar agora?
        public bool CanBuy(TeamState team, UpgradeType type, int driverIndex = 0) =>
            !IsMaxed(team, type, driverIndex) && team.money >= GetCost(team, type, driverIndex);

        // Compra um nível. Devolve false (sem gastar nada) se não puder.
        public bool TryBuy(TeamState team, UpgradeType type, int driverIndex = 0)
        {
            if (!CanBuy(team, type, driverIndex)) return false;
            team.money -= GetCost(team, type, driverIndex);
            team.IncrementLevel(type, driverIndex);
            Upgraded?.Invoke(team, type, driverIndex);
            return true;
        }
    }
}
```

### 5.3 `RaceRunner` atualizado

Substitua o arquivo inteiro. As novidades são `Economy`, `Upgrades`, `PlayerTeam`, o `Awake` e a linha `Economy.Tick(step)`.

```csharp
// Caminho: Assets/_Project/Scripts/Game/RaceRunner.cs
using System;
using System.Collections.Generic;
using PaddockBoss.Data;
using PaddockBoss.UI;
using UnityEngine;

namespace PaddockBoss.Game
{
    // POR QUE: ponte entre a simulação (C# puro) e o tempo do jogo; agora também
    // dono da economia da corrida e do serviço de compras.
    // ESTRATÉGIA: igual à Fase 3. A economia é criada a cada corrida (ouve a
    // simulação nova); o UpgradeService é criado uma vez no Awake, que roda antes
    // de qualquer Start, então já existe quando a primeira corrida larga.
    public class RaceRunner : MonoBehaviour
    {
        private const float MaxStep = 0.05f;

        [SerializeField] private GameBalance _balance;
        [SerializeField] private TrackRenderer _trackRenderer;
        [SerializeField] private CarMarker _carMarkerPrefab;
        [SerializeField] private Transform _markersParent;
        [SerializeField, Range(0.5f, 8f)] private float _timeScale = 1f; // só para testes (Parte 1 §3: Em aberto)

        public RaceSimulator Sim { get; private set; }
        public RaceEconomy Economy { get; private set; }
        public UpgradeService Upgrades { get; private set; }
        public TeamState PlayerTeam { get; private set; }
        public GameBalance Balance => _balance;
        public event Action<RaceSimulator> RaceStarted;
        public event Action<RaceSimulator> RaceEnded;

        private readonly List<CarMarker> _markers = new();

        // Cria o serviço de compras, que vale para todas as corridas.
        private void Awake() => Upgrades = new UpgradeService(_balance);

        // Começa uma corrida nova: simulação, economia, pista e ícones.
        public void StartRace(TrackDefinition track, IReadOnlyList<TeamState> teams)
        {
            ClearMarkers();
            Sim = new RaceSimulator(track, _balance, teams, Environment.TickCount);
            Sim.RaceFinished += HandleRaceFinished;
            Economy = new RaceEconomy(Sim, _balance);

            PlayerTeam = null;
            foreach (var team in teams)
                if (team.isPlayer) PlayerTeam = team;

            _trackRenderer.Draw(track);
            foreach (var car in Sim.Cars)
            {
                CarMarker marker = Instantiate(_carMarkerPrefab, _markersParent);
                marker.Bind(car, Sim.Path);
                _markers.Add(marker);
            }
            RaceStarted?.Invoke(Sim);
        }

        // Avança simulação e economia em passos pequenos.
        private void Update()
        {
            if (Sim == null || Sim.IsFinished) return;
            float remaining = Time.deltaTime * _timeScale;
            while (remaining > 0f && !Sim.IsFinished)
            {
                float step = Mathf.Min(remaining, MaxStep);
                Sim.Tick(step);
                Economy.Tick(step);
                remaining -= step;
            }
        }

        // Repassa o fim da corrida para quem estiver ouvindo.
        private void HandleRaceFinished() => RaceEnded?.Invoke(Sim);

        // Apaga os ícones da corrida anterior.
        private void ClearMarkers()
        {
            foreach (var marker in _markers)
                if (marker != null) Destroy(marker.gameObject);
            _markers.Clear();
        }
    }
}
```

### 5.4 `UpgradeButton`

```csharp
// Caminho: Assets/_Project/Scripts/UI/UpgradeButton.cs
using PaddockBoss.Data;
using PaddockBoss.Game;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace PaddockBoss.UI
{
    // POR QUE: o botão de uma área de investimento (Parte 1 §4), com nível atual
    // e custo do próximo.
    // ESTRATÉGIA: o mesmo script serve para todas as áreas; o Inspector diz qual
    // (_type) e, no treino, qual piloto (_driverIndex). O clique só chama TryBuy.
    // O estado é relido a cada frame: com 5 botões, é barato e garante que o botão
    // acende no instante em que o dinheiro alcança o custo.
    public class UpgradeButton : MonoBehaviour
    {
        [SerializeField] private RaceRunner _runner;
        [SerializeField] private UpgradeType _type;
        [SerializeField, Range(0, 1)] private int _driverIndex;
        [SerializeField] private Button _button;
        [SerializeField] private TMP_Text _titleText;
        [SerializeField] private TMP_Text _levelText;
        [SerializeField] private TMP_Text _costText;

        // Liga o clique à compra.
        private void Awake() => _button.onClick.AddListener(HandleClicked);

        // Tenta comprar um nível para a equipe do jogador.
        private void HandleClicked()
        {
            TeamState team = _runner.PlayerTeam;
            if (team != null) _runner.Upgrades.TryBuy(team, _type, _driverIndex);
        }

        // Atualiza textos e se o botão está clicável.
        private void Update()
        {
            TeamState team = _runner.PlayerTeam;
            bool racing = team != null && _runner.Sim != null && !_runner.Sim.IsFinished;
            if (team == null) { _button.interactable = false; return; }

            string title = _runner.Balance.GetUpgrade(_type).displayName;
            if (_type == UpgradeType.DriverTraining) title += $": {team.Definition.driverNames[_driverIndex]}";
            _titleText.text = title;
            _levelText.text = $"Nv {team.GetLevel(_type, _driverIndex)}";

            bool maxed = _runner.Upgrades.IsMaxed(team, _type, _driverIndex);
            _costText.text = maxed ? "MÁX" : $"$ {_runner.Upgrades.GetCost(team, _type, _driverIndex):N0}";
            _button.interactable = racing && _runner.Upgrades.CanBuy(team, _type, _driverIndex);
        }
    }
}
```

### 5.5 `MoneyFeed`: dinheiro e últimas entradas

```csharp
// Caminho: Assets/_Project/Scripts/UI/MoneyFeed.cs
using System.Collections.Generic;
using System.Text;
using PaddockBoss.Game;
using TMPro;
using UnityEngine;

namespace PaddockBoss.UI
{
    // POR QUE: ver "+15 Ultrapassagem" logo depois de comprar engenharia é o que
    // fecha o loop "investi → rendeu" (pilar de curto prazo, Parte 1 §1).
    // ESTRATÉGIA: a cada corrida, inscreve-se no MoneyEarned da economia nova (e
    // sai da antiga). Guarda as últimas mensagens com hora de expirar; o Update
    // remove as velhas e redesenha.
    public class MoneyFeed : MonoBehaviour
    {
        [SerializeField] private RaceRunner _runner;
        [SerializeField] private TMP_Text _moneyText;
        [SerializeField] private TMP_Text _feedText;
        [SerializeField] private float _messageSeconds = 3f;
        [SerializeField] private int _maxMessages = 4;

        private readonly List<(string text, float expiresAt)> _messages = new();
        private readonly StringBuilder _builder = new();
        private RaceEconomy _economy;

        // Passa a ouvir as largadas (e pega a corrida atual, se já houver).
        private void OnEnable()
        {
            _runner.RaceStarted += HandleRaceStarted;
            if (_runner.Sim != null) HandleRaceStarted(_runner.Sim);
        }

        // Para de ouvir tudo quando desligado.
        private void OnDisable()
        {
            _runner.RaceStarted -= HandleRaceStarted;
            Unsubscribe();
        }

        // Troca a economia ouvida pela da corrida nova.
        private void HandleRaceStarted(RaceSimulator sim)
        {
            Unsubscribe();
            _economy = _runner.Economy;
            _economy.MoneyEarned += HandleMoneyEarned;
            _messages.Clear();
        }

        // Sai da economia antiga, se houver.
        private void Unsubscribe()
        {
            if (_economy != null) _economy.MoneyEarned -= HandleMoneyEarned;
            _economy = null;
        }

        // Guarda as entradas da equipe do jogador, a mais nova no topo.
        private void HandleMoneyEarned(TeamState team, int amount, string reason)
        {
            if (!team.isPlayer) return;
            _messages.Insert(0, ($"+{amount}  {reason}", Time.time + _messageSeconds));
            if (_messages.Count > _maxMessages) _messages.RemoveAt(_messages.Count - 1);
        }

        // Mostra o saldo e as mensagens ainda válidas.
        private void Update()
        {
            TeamState team = _runner.PlayerTeam;
            _moneyText.text = team != null ? $"$ {team.money:N0}" : "";

            _messages.RemoveAll(m => m.expiresAt < Time.time);
            _builder.Clear();
            foreach (var message in _messages) _builder.AppendLine(message.text);
            _feedText.text = _builder.ToString();
        }
    }
}
```

### 5.6 Montar o painel de investimentos

1. No `SidePanel`, crie `MoneyPanel` com dois TMP: `MoneyText` (fonte 44, negrito) e `FeedText` (fonte 24, cor verde). Adicione `MoneyFeed` e ligue os campos.
2. Crie `InvestPanel` com **Vertical Layout Group** e 5 botões (**UI → Button - TextMeshPro**). Dentro de cada um, troque o texto único por três TMP: `Title`, `Level` e `Cost`.
3. Adicione `UpgradeButton` a cada botão:

   | Botão | Type | Driver Index |
   |---|---|---|
   | Engenharia | Engineering | 0 |
   | Propaganda | Marketing | 0 |
   | Boxes | PitCrew | 0 |
   | Treino 1 | DriverTraining | 0 |
   | Treino 2 | DriverTraining | 1 |

### ✅ Checkpoint da Fase 5
- O saldo sobe sozinho durante a corrida (patrocínio) e dá saltos com mensagens `+N Volta em Px`, `+15 Ultrapassagem` e, no fim, `+N Chegada em Px`.
- Os botões ficam cinza até o dinheiro alcançar o custo. Ao comprar, o saldo cai, o nível sobe e o custo do próximo nível aumenta.
- Comprar alguns níveis de **Engenharia** faz os dois carros ganharem posições nas voltas seguintes (com **Time Scale** alto, fica bem visível).
- Comprar **Equipe de boxes** encurta a contagem regressiva do próximo pit stop; **Propaganda** acelera a subida do saldo.

#### Problemas comuns
- **Os botões nunca acendem:** `PlayerTeam` está nulo; confira se `Team_Player` está no campo **Player Team** do `RaceTestStarter` (é ele que marca `isPlayer = true`).
- **O saldo sobe, mas o feed fica vazio:** o `MoneyFeed` foi habilitado depois da largada sem achar a economia. Confira se o `MoneyPanel` está ativo na cena ao apertar Play.

Próxima fase: **IA das equipes rivais** — as rivais também compram e vão ao box.

---

# Parte 9 — Implementação Unity: Fase 6 (IA das equipes rivais)

## Fase 6 — IA das equipes rivais

> Objetivo desta fase: as 6 equipes rivais investem e fazem pit stop sozinhas, cada uma com sua personalidade.

### 6.1 `RivalAI`

```csharp
// Caminho: Assets/_Project/Scripts/Game/RivalAI.cs
using System.Collections.Generic;
using PaddockBoss.Data;
using UnityEngine;

namespace PaddockBoss.Game
{
    // POR QUE: rivais que nunca melhoram viram alvo fácil, e rivais que nunca
    // trocam pneu viram piada. A IA joga com as mesmas regras do jogador
    // (Parte 1 §7): mesmo UpgradeService, mesmo RequestPit.
    // ESTRATÉGIA: a IA "pensa" a cada aiThinkInterval segundos (não a cada frame;
    // ninguém decide 60 vezes por segundo). Compras: sorteia uma área pelos pesos
    // da personalidade e compra se o caixa tiver folga (equipes cautelosas exigem
    // até o dobro do custo). Box: só para se o pneu passou do limite E não aguenta
    // até o fim; escolhe o composto mais macio que aguente as voltas restantes.
    public class RivalAI
    {
        private static readonly UpgradeType[] Types =
            { UpgradeType.Engineering, UpgradeType.Marketing, UpgradeType.PitCrew, UpgradeType.DriverTraining };
        private static readonly TireCompound[] SofterFirst = { TireCompound.Soft, TireCompound.Medium };

        private readonly RaceSimulator _sim;
        private readonly UpgradeService _upgrades;
        private readonly GameBalance _balance;
        private readonly System.Random _rng;
        private readonly List<TeamState> _rivals = new();
        private float _timer;

        // Separa as equipes rivais (as que não são do jogador).
        public RivalAI(RaceSimulator sim, UpgradeService upgrades, GameBalance balance, int seed)
        {
            _sim = sim;
            _upgrades = upgrades;
            _balance = balance;
            _rng = new System.Random(seed);
            foreach (var car in sim.Cars)
                if (!car.IsPlayer && !_rivals.Contains(car.Team)) _rivals.Add(car.Team);
        }

        // Conta o tempo e, no intervalo, decide box e compras.
        public void Tick(float dt)
        {
            _timer -= dt;
            if (_timer > 0f) return;
            _timer = _balance.aiThinkInterval;

            foreach (var car in _sim.Cars)
                if (!car.IsPlayer) DecidePit(car);
            foreach (var team in _rivals) DecideSpending(team);
        }

        // Pede box se o pneu não aguenta até o fim e já passou do limite da equipe.
        private void DecidePit(CarState car)
        {
            if (car.Finished || car.InPit || car.PitRequested) return;
            int lapsLeft = _sim.Track.laps - car.LapsCompleted;
            if (lapsLeft <= 1) return;

            float lapTime = EstimateLapTime(car);
            float wearToEnd = _balance.GetCompound(car.Compound).wearPerSecond * lapsLeft * lapTime;
            bool lastsToEnd = car.TireWear + wearToEnd < 1f;
            if (lastsToEnd || car.TireWear < car.Team.Definition.aiPitWearThreshold) return;

            // O box acontece ao fim desta volta, então sobram lapsLeft - 1 voltas.
            _sim.RequestPit(car, ChooseCompound(lapsLeft - 1, lapTime));
        }

        // Tempo de volta do próprio carro; antes da 1ª volta, uma estimativa.
        private float EstimateLapTime(CarState car) =>
            car.LastLapTime > 0f ? car.LastLapTime : _sim.Path.Length / (_sim.Track.baseSpeed * 0.75f);

        // O composto mais macio que chega ao fim com folga; senão, o duro.
        private TireCompound ChooseCompound(int lapsAfterStop, float lapTime)
        {
            foreach (var compound in SofterFirst)
                if (_balance.GetCompound(compound).wearPerSecond * lapsAfterStop * lapTime < 0.9f)
                    return compound;
            return TireCompound.Hard;
        }

        // Sorteia uma área pela personalidade e compra se houver folga no caixa.
        private void DecideSpending(TeamState team)
        {
            TeamDefinition personality = team.Definition;
            UpgradeType type = PickWeighted(personality);
            int driver = team.driverSkill[0] <= team.driverSkill[1] ? 0 : 1; // treina o mais fraco
            int cost = _upgrades.GetCost(team, type, driver);
            float reserveFactor = Mathf.Lerp(2f, 1f, personality.aiSpendEagerness);
            if (team.money >= cost * reserveFactor) _upgrades.TryBuy(team, type, driver);
        }

        // Sorteio ponderado: um peso 3 sai 3 vezes mais que um peso 1.
        private UpgradeType PickWeighted(TeamDefinition personality)
        {
            float[] weights =
            {
                personality.aiWeightEngineering, personality.aiWeightMarketing,
                personality.aiWeightPitCrew, personality.aiWeightDriver,
            };
            float total = 0f;
            foreach (var weight in weights) total += Mathf.Max(0f, weight);
            float roll = (float)_rng.NextDouble() * total;
            for (int i = 0; i < weights.Length; i++)
            {
                roll -= Mathf.Max(0f, weights[i]);
                if (roll <= 0f) return Types[i];
            }
            return Types[Types.Length - 1];
        }
    }
}
```

### 6.2 Ligar a IA no `RaceRunner`

Três mudanças em `RaceRunner.cs`:

```csharp
// 1) Junto dos outros campos privados:
private RivalAI _rivalAI;

// 2) Em StartRace, logo depois de "Economy = new RaceEconomy(Sim, _balance);":
_rivalAI = new RivalAI(Sim, Upgrades, _balance, Environment.TickCount + 1);

// 3) No laço do Update, logo depois de "Economy.Tick(step);":
_rivalAI.Tick(step);
```

### 6.3 Dar personalidade às rivais

Nos assets `Team_Rival*`, varie os campos de IA. Exemplos de partida:

| Equipe | Eagerness | Pesos (Eng / Prop / Box / Treino) | Box com desgaste |
|---|---|---|---|
| A "fábrica rica" | 0.9 | 3 / 1 / 1 / 1 | 0.7 |
| A "marqueteira" | 0.6 | 1 / 3 / 0.5 / 1 | 0.8 |
| A "cautelosa" | 0.2 | 1 / 1 / 1 / 1 | 0.65 |
| A "dos pilotos" | 0.5 | 1 / 0.5 / 1 / 3 | 0.75 |

### ✅ Checkpoint da Fase 6
- Durante a corrida, carros rivais também aparecem com `BOX` na tabela, quase sempre perto da metade da prova, e não nas últimas voltas.
- Compras dos rivais: os assets `Team_*` não mudam durante o jogo (o estado fica no `TeamState`). Para ver as compras, coloque um `Debug.Log($"{team.teamId} comprou {type}")` temporário em `DecideSpending`, logo depois do `TryBuy`: cada rival compra com frequência e foco diferentes, conforme a personalidade.
- Rivais "fábrica rica" ficam mais rápidas ao longo da corrida; a do jogador, sem investir nada, perde terreno.

#### Problemas comuns
- **Nenhum rival vai ao box:** com corridas curtas, o pneu Médio de largada pode aguentar até o fim (`lastsToEnd`). Aumente as voltas da pista ou o `wearPerSecond`.
- **Um rival compra demais logo na largada:** ele começa com o mesmo `startingMoney` de todos. Dê a ele `aiSpendEagerness` menor ou níveis iniciais maiores (o que encarece o próximo nível).

Próxima fase: **Campeonato e save** — 3 etapas, pontos e progresso salvo.

---

# Parte 10 — Implementação Unity: Fase 7 (Campeonato e save local)

## Fase 7 — Campeonato e save local

> Objetivo desta fase: jogar as 3 etapas em sequência, com pontos, tela entre corridas e progresso salvo ao fechar o jogo.

**Conceitos novos:**
- **`JsonUtility`:** converte um objeto `[Serializable]` em texto JSON e de volta. Ele só salva campos públicos de tipos simples, arrays e `List`. Referências a assets não entram (por isso o `[NonSerialized] Definition` do `TeamState`).
- **`PlayerPrefs`:** pequeno armazenamento de chave/valor da Unity. Funciona igual nas três plataformas: registro do Windows no PC, arquivo de preferências no Android e IndexedDB do navegador no WebGL. É o caminho mais simples para um save pequeno como este (poucos KB); no WebGL, gravar arquivo em disco exigiria cuidados extras.
- **Coroutine:** função que pode "esperar" no meio (`yield return new WaitForSeconds(2f)`) sem travar o jogo. Usada para dar 2 segundos de bandeirada antes de mostrar o resultado.

### 7.1 `ChampionshipDefinition`

```csharp
// Caminho: Assets/_Project/Scripts/Data/ChampionshipDefinition.cs
using UnityEngine;

namespace PaddockBoss.Data
{
    // POR QUE: o campeonato do MVP (Parte 1 §8): quais pistas, em que ordem, e
    // quais equipes.
    // ESTRATÉGIA: só referências a outros assets. Trocar a ordem das etapas ou
    // incluir uma equipe é arrastar no Inspector.
    [CreateAssetMenu(menuName = "Paddock Boss/Championship", fileName = "Championship")]
    public class ChampionshipDefinition : ScriptableObject
    {
        public TeamDefinition playerTeam;
        public TeamDefinition[] rivalTeams;
        public TrackDefinition[] tracks;
    }
}
```

### 7.2 `SaveData` e `SaveService`

```csharp
// Caminho: Assets/_Project/Scripts/Game/SaveService.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace PaddockBoss.Game
{
    // POR QUE: tudo o que precisa sobreviver ao fechar o jogo: em que etapa
    // estamos e o estado de cada equipe (dinheiro, níveis, pontos).
    // ESTRATÉGIA: "version" permite, no futuro, reconhecer saves antigos e
    // convertê-los em vez de quebrar.
    [Serializable]
    public class SaveData
    {
        public const int CurrentVersion = 1;
        public int version = CurrentVersion;
        public int nextRaceIndex;
        public List<TeamState> teams = new();
    }

    // POR QUE: um só lugar sabe onde e como o save é gravado (Parte 1 §12:
    // offline, save local). Trocar PlayerPrefs por arquivo ou nuvem depois mexe
    // só aqui.
    // ESTRATÉGIA: SaveData vira JSON e vai para uma chave do PlayerPrefs.
    // PlayerPrefs.Save() força a gravação imediata (no WebGL, sem ela o
    // navegador pode fechar antes de gravar).
    public static class SaveService
    {
        private const string Key = "paddockboss.save";

        // Lê o save. Devolve false se não houver, se estiver corrompido ou se for
        // de outra versão.
        public static bool TryLoad(out SaveData data)
        {
            data = null;
            if (!PlayerPrefs.HasKey(Key)) return false;
            try
            {
                data = JsonUtility.FromJson<SaveData>(PlayerPrefs.GetString(Key));
            }
            catch (Exception e)
            {
                Debug.LogWarning($"Save ilegível, começando do zero: {e.Message}");
                return false;
            }
            return data != null && data.version == SaveData.CurrentVersion;
        }

        // Grava o save inteiro.
        public static void Save(SaveData data)
        {
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(data));
            PlayerPrefs.Save();
        }

        // Apaga o save (útil em testes).
        public static void Delete()
        {
            PlayerPrefs.DeleteKey(Key);
            PlayerPrefs.Save();
        }
    }
}
```

### 7.3 `Championship`

```csharp
// Caminho: Assets/_Project/Scripts/Game/Championship.cs
using System.Collections.Generic;
using PaddockBoss.Data;
using UnityEngine;

namespace PaddockBoss.Game
{
    // POR QUE: a camada de longo prazo (pilar 2, Parte 1 §1): sequência de
    // etapas, pontos e a equipe que cresce de uma corrida para a outra.
    // ESTRATÉGIA: os TeamState guardados aqui são os mesmos objetos que a corrida
    // usa. O que se ganha e compra na corrida já está "no campeonato" quando ela
    // acaba; RecordResult só soma os pontos, avança a etapa e grava. Fechar o
    // jogo no meio da corrida volta ao último save, de antes da largada
    // (Parte 1 §12).
    public class Championship
    {
        public ChampionshipDefinition Definition { get; }
        public GameBalance Balance { get; }
        public SaveData Data { get; }

        public IReadOnlyList<TeamState> Teams => Data.teams;
        public int RaceCount => Definition.tracks.Length;
        public int RaceNumber => Data.nextRaceIndex + 1;
        public bool IsOver => Data.nextRaceIndex >= RaceCount;
        public TrackDefinition NextTrack => IsOver ? null : Definition.tracks[Data.nextRaceIndex];

        // Construtor privado: use LoadOrCreate ou CreateNew.
        private Championship(ChampionshipDefinition definition, GameBalance balance, SaveData data)
        {
            Definition = definition;
            Balance = balance;
            Data = data;
        }

        // Continua o campeonato salvo ou, se não houver um válido, começa outro.
        public static Championship LoadOrCreate(ChampionshipDefinition definition, GameBalance balance)
        {
            if (SaveService.TryLoad(out SaveData data) && Relink(data, definition))
                return new Championship(definition, balance, data);
            return CreateNew(definition, balance);
        }

        // Começa um campeonato do zero e grava. Recomeçar ao fim da temporada é a
        // solução provisória da Parte 1 §2 (Em aberto).
        public static Championship CreateNew(ChampionshipDefinition definition, GameBalance balance)
        {
            var data = new SaveData();
            data.teams.Add(TeamState.Create(definition.playerTeam, true, balance.startingMoney));
            foreach (var rival in definition.rivalTeams)
                data.teams.Add(TeamState.Create(rival, false, balance.startingMoney));
            SaveService.Save(data);
            return new Championship(definition, balance, data);
        }

        // Soma os pontos de cada carro para a sua equipe, avança a etapa e grava.
        public void RecordResult(IReadOnlyList<CarState> results)
        {
            foreach (var car in results)
                car.Team.points += GameBalance.ByPosition(Balance.pointsByPosition, car.Position);
            Data.nextRaceIndex++;
            SaveService.Save(Data);
        }

        // Equipes ordenadas por pontos (classificação do campeonato).
        public List<TeamState> TeamStandings()
        {
            var list = new List<TeamState>(Data.teams);
            list.Sort((a, b) => b.points.CompareTo(a.points));
            return list;
        }

        // Religa cada TeamState carregado à sua TeamDefinition pelo teamId. Se uma
        // equipe sumiu ou mudou de id, o save não serve mais e é descartado.
        private static bool Relink(SaveData data, ChampionshipDefinition definition)
        {
            var all = new List<TeamDefinition> { definition.playerTeam };
            all.AddRange(definition.rivalTeams);
            if (data.teams.Count != all.Count) return false;
            foreach (var team in data.teams)
            {
                team.Definition = all.Find(d => d.teamId == team.teamId);
                if (team.Definition == null)
                {
                    Debug.LogWarning($"Save com equipe desconhecida '{team.teamId}', começando do zero.");
                    return false;
                }
            }
            return true;
        }
    }
}
```

### 7.4 `SeasonPanel`: a tela entre corridas

```csharp
// Caminho: Assets/_Project/Scripts/UI/SeasonPanel.cs
using System;
using System.Collections.Generic;
using System.Text;
using PaddockBoss.Data;
using PaddockBoss.Game;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace PaddockBoss.UI
{
    // POR QUE: entre uma corrida e outra o jogador precisa ver o resultado, a
    // classificação e a próxima pista (Parte 1 §10).
    // ESTRATÉGIA: uma única tela para os três momentos: início de temporada (sem
    // resultado), entre etapas e fim de temporada. Quem chama decide o que o botão
    // faz (Action é "uma função guardada numa variável").
    public class SeasonPanel : MonoBehaviour
    {
        [SerializeField] private TMP_Text _titleText;
        [SerializeField] private TMP_Text _resultsText;
        [SerializeField] private TMP_Text _standingsText;
        [SerializeField] private Button _continueButton;
        [SerializeField] private TMP_Text _continueLabel;

        private Action _onContinue;

        // Liga o botão à ação definida no último Show.
        private void Awake() => _continueButton.onClick.AddListener(() => _onContinue?.Invoke());

        // Preenche e mostra a tela. lastResults é null no começo da temporada.
        public void Show(Championship season, IReadOnlyList<CarState> lastResults, Action onContinue)
        {
            _onContinue = onContinue;
            _titleText.text = season.IsOver
                ? "Fim da temporada"
                : $"Etapa {season.RaceNumber}/{season.RaceCount}: {season.NextTrack.displayName}";
            _resultsText.text = lastResults == null ? "" : BuildResults(lastResults, season.Balance);
            _standingsText.text = BuildStandings(season);
            _continueLabel.text = season.IsOver ? "Nova temporada" : "Largar";
            gameObject.SetActive(true);
        }

        // Esconde a tela.
        public void Hide() => gameObject.SetActive(false);

        // Resultado da última corrida, com os pontos de cada carro.
        private static string BuildResults(IReadOnlyList<CarState> results, GameBalance balance)
        {
            var builder = new StringBuilder("<b>Resultado</b>\n");
            foreach (var car in results)
            {
                int points = GameBalance.ByPosition(balance.pointsByPosition, car.Position);
                string line = $"P{car.Position}  {car.Team.Definition.shortName}  {car.DriverName}" + (points > 0 ? $"  +{points}" : "");
                builder.AppendLine(car.IsPlayer ? $"<b>{line}</b>" : line);
            }
            return builder.ToString();
        }

        // Classificação de equipes do campeonato.
        private static string BuildStandings(Championship season)
        {
            var builder = new StringBuilder("<b>Campeonato</b>\n");
            List<TeamState> standings = season.TeamStandings();
            for (int i = 0; i < standings.Count; i++)
            {
                TeamState team = standings[i];
                string line = $"{i + 1}. {team.Definition.displayName}  {team.points} pts";
                builder.AppendLine(team.isPlayer ? $"<b>{line}</b>" : line);
            }
            return builder.ToString();
        }
    }
}
```

### 7.5 `GameSession`: amarra tudo

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameSession.cs
using System.Collections;
using System.Collections.Generic;
using PaddockBoss.Data;
using PaddockBoss.UI;
using UnityEngine;

namespace PaddockBoss.Game
{
    // POR QUE: alguém precisa conduzir o fluxo da Parte 1 §2: tela da temporada
    // → corrida → resultado → próxima etapa.
    // ESTRATÉGIA: carrega (ou cria) o campeonato no Start e alterna entre o
    // SeasonPanel e o HUD da corrida. O resultado é gravado no instante da
    // bandeirada; a tela só aparece 2 s depois (coroutine), para o jogador ver
    // os últimos carros cruzarem a linha.
    public class GameSession : MonoBehaviour
    {
        [SerializeField] private ChampionshipDefinition _definition;
        [SerializeField] private RaceRunner _runner;
        [SerializeField] private SeasonPanel _seasonPanel;
        [SerializeField] private GameObject _raceHud;
        [SerializeField] private float _resultsDelay = 2f;

        private Championship _season;

        // Abre o campeonato salvo e mostra a tela da temporada.
        private void Start()
        {
            _season = Championship.LoadOrCreate(_definition, _runner.Balance);
            _runner.RaceEnded += HandleRaceEnded;
            ShowSeason(null);
        }

        // Para de ouvir o RaceRunner quando a cena fecha.
        private void OnDestroy()
        {
            if (_runner != null) _runner.RaceEnded -= HandleRaceEnded;
        }

        // Esconde o HUD e mostra a tela da temporada.
        private void ShowSeason(IReadOnlyList<CarState> lastResults)
        {
            _raceHud.SetActive(false);
            _seasonPanel.Show(_season, lastResults, HandleContinue);
        }

        // Botão da tela da temporada: larga a próxima etapa ou recomeça.
        private void HandleContinue()
        {
            if (_season.IsOver)
            {
                _season = Championship.CreateNew(_definition, _runner.Balance);
                ShowSeason(null);
                return;
            }
            _seasonPanel.Hide();
            _raceHud.SetActive(true);
            _runner.StartRace(_season.NextTrack, _season.Teams);
        }

        // Bandeirada: grava o resultado e agenda a tela.
        private void HandleRaceEnded(RaceSimulator sim)
        {
            _season.RecordResult(sim.Standings);
            StartCoroutine(ShowSeasonAfterDelay(sim.Standings));
        }

        // Espera _resultsDelay segundos sem travar o jogo e mostra o resultado.
        private IEnumerator ShowSeasonAfterDelay(IReadOnlyList<CarState> results)
        {
            yield return new WaitForSeconds(_resultsDelay);
            ShowSeason(results);
        }
    }
}
```

### 7.6 Montar

1. Em `Data/`: **Create → Paddock Boss → Championship**. **Player Team** = `Team_Player`, **Rival Teams** = as 6 rivais, **Tracks** = `Track_A`, `Track_B`, `Track_C`, nessa ordem.
2. No `RaceRunner`, **desative** o componente `RaceTestStarter` (desmarque a caixinha). Mantenha-o no projeto para testes isolados de corrida.
3. Em `[Systems]`, crie `GameSession` com o componente `GameSession`: **Definition** = `Championship`, **Runner**, **Race Hud** = o `SidePanel`.
4. No Canvas, crie `SeasonPanel` (**UI → Panel**, tela cheia, fundo escuro opaco) com `Title`, duas colunas de TMP (`Results` e `Standings`) e um botão `Continue` com o texto `ContinueLabel`. Adicione `SeasonPanel` e ligue os campos. Deixe-o como **último filho** do Canvas, para ficar por cima de tudo, e arraste-o para **Season Panel** no `GameSession`.

> **Apagar o save durante os testes:** **Edit → Clear All PlayerPrefs** no Editor.

### ✅ Checkpoint da Fase 7
- Ao apertar Play, aparece `Etapa 1/3: <pista A>` com todas as equipes em 0 pts. **Largar** inicia a corrida na pista A.
- 2 s depois da bandeirada, a tela mostra o resultado com os pontos e a classificação atualizada. **Largar** vai para a pista B, com o dinheiro e os níveis da corrida anterior mantidos.
- Pare o Play entre a etapa 1 e a 2 e aperte Play de novo: o jogo volta em `Etapa 2/3` com os mesmos pontos, dinheiro e níveis.
- Pare o Play **no meio** de uma corrida e volte: ela recomeça do estado de antes da largada.
- Depois da etapa 3, a tela mostra `Fim da temporada`; **Nova temporada** zera tudo.

#### Problemas comuns
- **O jogo sempre recomeça do zero:** veja se o Console mostra "Save com equipe desconhecida": algum `teamId` mudou ou está repetido entre as equipes.
- **O HUD aparece por trás do `SeasonPanel` ou vice-versa:** a ordem de desenho do Canvas segue a ordem da Hierarchy; o último filho fica por cima.
- **Os botões do HUD não respondem depois da primeira corrida:** algum script do HUD se inscreveu num evento no `Awake` (que roda uma vez) em vez do `OnEnable`. Siga o padrão do `CarPitControls`.

Próxima fase: **Layout multiplataforma e arte** — a mesma tela funcionando em monitor, celular e navegador.

---

# Parte 11 — Implementação Unity: Fase 8 (Layout multiplataforma e arte)

## Fase 8 — Layout multiplataforma e arte

> Objetivo desta fase: a tela se adapta a qualquer resolução (monitor, celular com notch, janela do navegador), a pista sempre cabe no espaço livre à esquerda do painel, e os placeholders viram arte flat vector.

A orientação no mobile está **Em aberto** (Parte 1 §10). Este guia usa **paisagem**, a mesma tela do PC e do WebGL.

### 8.1 Canvas que escala

No Canvas, em **Canvas Scaler**: **UI Scale Mode** = *Scale With Screen Size*, **Reference Resolution** = 1920 × 1080, **Screen Match Mode** = *Match Width Or Height*, **Match** = 0.5. A UI passa a ser desenhada para 1080p e escalada para qualquer tela, sem textos minúsculos no celular nem gigantes no monitor 4K.

### 8.2 `SafeAreaFitter`: fugir do notch

```csharp
// Caminho: Assets/_Project/Scripts/UI/SafeAreaFitter.cs
using UnityEngine;

namespace PaddockBoss.UI
{
    // POR QUE: em celulares com notch ou cantos arredondados, parte da tela não
    // é visível. Screen.safeArea diz qual retângulo é seguro; botões fora dele
    // ficam escondidos ou difíceis de tocar.
    // ESTRATÉGIA: ajusta as âncoras deste RectTransform para ocupar só a área
    // segura. Os filhos (painéis) ficam dentro dele. No PC e no WebGL, a área
    // segura é a tela inteira e nada muda.
    [RequireComponent(typeof(RectTransform))]
    public class SafeAreaFitter : MonoBehaviour
    {
        private RectTransform _rect;
        private Rect _applied;

        // Aplica uma vez ao ligar.
        private void Awake()
        {
            _rect = (RectTransform)transform;
            Apply();
        }

        // Reaplica se a área mudar (rotação, janela redimensionada).
        private void Update()
        {
            if (Screen.safeArea != _applied) Apply();
        }

        // Converte a área segura (em pixels) para âncoras (0 a 1).
        private void Apply()
        {
            Rect safe = Screen.safeArea;
            _applied = safe;
            if (Screen.width <= 0 || Screen.height <= 0) return;
            Vector2 min = safe.position;
            Vector2 max = safe.position + safe.size;
            min.x /= Screen.width; min.y /= Screen.height;
            max.x /= Screen.width; max.y /= Screen.height;
            _rect.anchorMin = min;
            _rect.anchorMax = max;
        }
    }
}
```

No Canvas, crie `SafeArea` (vazio, *stretch* total, **Left/Right/Top/Bottom** = 0), adicione `SafeAreaFitter` e mova o `SidePanel` e o `SeasonPanel` para dentro dele.

### 8.3 `TrackCameraFit`: a pista sempre cabe

```csharp
// Caminho: Assets/_Project/Scripts/UI/TrackCameraFit.cs
using UnityEngine;

namespace PaddockBoss.UI
{
    // POR QUE: as pistas têm tamanhos diferentes e as telas também (16:9, 21:9,
    // celular 20:9, janela do navegador). Um Size fixo corta a pista em alguma
    // delas.
    // ESTRATÉGIA: numa câmera ortográfica, orthographicSize é metade da altura
    // visível em unidades do mundo; a largura visível é altura × aspect. Calcula o
    // menor Size em que a pista cabe na fração da tela que sobra à esquerda do
    // painel e desloca a câmera para a pista ficar centrada nessa área. Só
    // recalcula quando a pista ou a resolução mudam.
    [RequireComponent(typeof(Camera))]
    public class TrackCameraFit : MonoBehaviour
    {
        [SerializeField] private TrackRenderer _track;
        [SerializeField, Range(0f, 0.6f)] private float _rightPanelFraction = 0.34f;
        [SerializeField] private float _padding = 2f;

        private Camera _camera;
        private Bounds _fittedBounds;
        private Vector2Int _fittedScreen;

        // Guarda a câmera deste objeto.
        private void Awake() => _camera = GetComponent<Camera>();

        // Reenquadra se algo mudou desde o último ajuste.
        private void LateUpdate()
        {
            Bounds bounds = _track.Bounds;
            var screen = new Vector2Int(Screen.width, Screen.height);
            if (bounds.size == Vector3.zero) return; // nenhuma pista desenhada ainda
            if (bounds == _fittedBounds && screen == _fittedScreen) return;
            _fittedBounds = bounds;
            _fittedScreen = screen;
            Fit(bounds);
        }

        // Calcula Size e posição para a pista caber na área livre.
        private void Fit(Bounds bounds)
        {
            bounds.Expand(_padding * 2f);
            float freeFraction = 1f - _rightPanelFraction;
            float sizeForHeight = bounds.extents.y;
            float sizeForWidth = bounds.extents.x / (_camera.aspect * freeFraction);
            _camera.orthographicSize = Mathf.Max(sizeForHeight, sizeForWidth);

            float worldWidth = 2f * _camera.orthographicSize * _camera.aspect;
            float shiftRight = worldWidth * _rightPanelFraction * 0.5f;
            transform.position = new Vector3(bounds.center.x + shiftRight, bounds.center.y, transform.position.z);
        }
    }
}
```

Adicione `TrackCameraFit` à **Main Camera** e ligue **Track**. Ajuste **Right Panel Fraction** para a largura real do `SidePanel` em relação à tela (640 de 1920 ≈ 0.34).

### 8.4 Arte flat vector

A arte segue a Parte 1 §9 (flat vector minimalista; paleta e identidade das equipes **Em aberto**). Assets mínimos do MVP:

| Asset | Observação |
|---|---|
| Ícone do carro visto de cima | **Branco**, apontando para cima, fundo transparente: o `SpriteRenderer` tinge com a cor da equipe |
| Contorno de destaque do jogador | Mesmo formato do carro, só o contorno |
| Linha de largada | Faixa quadriculada |
| Fundo do mapa | Liso ou com textura sutil; nada que dispute atenção com os carros |
| Painéis e botões da UI | Cantos arredondados, cores chapadas |

- Se gerar com o SpriteCook, siga as skills `spritecook-*` do repositório e guarde os `asset_id` num manifesto em `Sprites/PaddockBoss/`, como já é feito em `Sprites/Rally2D/`.
- Importação na Unity: **Texture Type** = *Sprite (2D and UI)*. Ajuste **Pixels Per Unit** para o carro ficar com cerca de 0.8 unidade de comprimento (ex.: imagem de 256 px de altura → PPU 320). Troque os sprites `Capsule` do prefab `CarMarker` pelos novos.
- Fonte: troque a LiberationSans por uma fonte da identidade visual (**Window → TextMeshPro → Font Asset Creator**) e confira os acentos do português (é, ã, ç).

### ✅ Checkpoint da Fase 8
- No **Game view**, troque entre 1920×1080, 2560×1080 (21:9) e um celular em paisagem (ex.: 2400×1080): a pista sempre aparece inteira à esquerda, sem ficar por baixo do painel.
- No **Device Simulator** (**Window → General → Device Simulator**), num celular com notch, os botões do painel não ficam sob o notch.
- Os carros mostram o ícone novo, tingido com a cor de cada equipe.

#### Problemas comuns
- **A pista fica por baixo do painel:** **Right Panel Fraction** menor que a largura real do painel. Aumente até sobrar uma margem.
- **Os carros ficaram enormes ou minúsculos com o sprite novo:** é o **Pixels Per Unit** da importação, não a escala do prefab.

Próxima fase: **Build e próximos passos**.

---

# Parte 12 — Implementação Unity: Fase 9 (Build e Próximos Passos)

## Fase 9 — Build e Próximos Passos

> Objetivo desta fase: gerar builds jogáveis de PC, Android e WebGL a partir do mesmo projeto.

### 9.1 Configurações comuns

1. **File → Build Profiles → Scene List**: só a cena `Main` (a `TrackLab` é ferramenta de Editor e fica de fora).
2. **Project Settings → Player**: **Company Name** = `MangueByte`, **Product Name** = `Paddock Boss`, ícone do jogo.
3. **Player → Resolution and Presentation** (aba Android): **Default Orientation** = *Auto Rotation*, permitindo só **Landscape Right** e **Landscape Left** (orientação provisória, ver Fase 8).

### 9.2 PC (Windows)

1. **Build Profiles → Windows** → **Switch Platform** → **Build** em `Builds/Windows/`.
2. Teste em janela redimensionável: a câmera reenquadra (Fase 8).

### 9.3 Android

1. **Build Profiles → Android** → **Switch Platform**.
2. **Player → Other Settings**: **Package Name** = `com.manguebyte.paddockboss`; **Scripting Backend** = *IL2CPP*; **Target Architectures** = *ARM64* (exigido pela Google Play).
3. Para testar, **Build And Run** com o celular ligado por USB (depuração USB ativada). Para a loja, marque **Build App Bundle (Google Play)** e configure o keystore (fora do escopo do MVP).
4. iOS: mesmo fluxo em **Build Profiles → iOS**; a build final exige Xcode num Mac.

### 9.4 WebGL

1. **Build Profiles → Web** → **Switch Platform**.
2. **Player → Publishing Settings**: **Compression Format** = *Gzip* e marque **Decompression Fallback**. Assim a build roda em hosts que não configuram os cabeçalhos de compressão (itch.io, GitHub Pages).
3. **Build** em `Builds/WebGL/`. Para testar localmente, use **Build And Run** (abrir o `index.html` direto do disco não funciona).
4. No itch.io: compacte o conteúdo da pasta em `.zip`, envie como *HTML* e marque *This file will be played in the browser*.

### ✅ Checkpoint da Fase 9
- As três builds abrem, mostram `Etapa 1/3` e jogam uma corrida inteira.
- Em cada plataforma, fechar o jogo entre etapas e reabrir mantém o progresso (no WebGL, recarregar a página).
- No celular, os botões do painel são grandes o bastante para tocar sem errar.

#### Problemas comuns
- **WebGL fica na tela de carregamento com erro de "Content-Encoding":** faltou **Decompression Fallback**.
- **WebGL perde o save ao recarregar:** o navegador está em modo anônimo ou bloqueia o armazenamento do site; o `PlayerPrefs.Save()` do `SaveService` já força a gravação.

### 9.5 Próximos passos

Em ordem sugerida, cada um ligado a um item **Em aberto** da Parte 1 §15:

1. **Playtest de ritmo:** medir a duração real da corrida e quantas compras o jogador faz por volta; ajustar o `GameBalance` (itens 3 e 6).
2. **Ajuste da IA / rubber band:** verificar se a equipe do jogador consegue sair do fundo do grid em 3 etapas (item 12).
3. **Testes automáticos em Edit Mode** para `TrackPath`, `RaceSimulator` (ordem, ultrapassagens, box), `UpgradeService` e `Championship`. Como são C# puro, não precisam de cena.
4. **Áudio** (item 15), tutorial e decisão sobre a orientação no mobile (item 14).
5. **Fim de temporada** e investimento entre corridas (itens 1 e 2).

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
