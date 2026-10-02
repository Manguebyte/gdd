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
- Partes 3 a 13: Fases 0 a 10 (setup → testes automáticos → build)

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

Este guia leva o MVP do Paddock Boss de um projeto vazio até as builds de PC, Mobile e WebGL. Ele implementa a **proposta inicial** da Parte 1. Onde a Parte 1 diz **Em aberto**, o guia escolhe a solução mais simples e avisa. Todos os números ficam em dados (ScriptableObjects), então mudar o balanceamento não exige mexer em código.

## Como usar este guia

O guia foi escrito para quem está aprendendo Unity. Cada fase segue o mesmo formato:

- **Conceitos novos:** o que a fase usa pela primeira vez, explicado antes de aparecer.
- **Etapas:** a fase é dividida em etapas pequenas (3A, 3B, ...). Cada etapa termina com um **🧪 Teste rápido**: algo para ver funcionando no Play Mode antes de seguir. Se o teste falhar, o problema está só no que foi feito naquela etapa.
- **Passos no Editor clique a clique:** menus no formato **Menu → Submenu → Item**, campos do Inspector em **negrito** e valores em `código`.
- **Hierarchy esperada:** ao fim das fases que mexem na cena, um desenho de como a janela Hierarchy deve estar.
- **✅ Checkpoint** no fim da fase e **Problemas comuns** com os erros mais prováveis.

Todo script do guia é **completo**: crie o arquivo, apague o conteúdo que a Unity gerou e cole o código inteiro.

### Duas operações que se repetem no guia inteiro

**Criar um script C#:**
1. Na janela **Project**, entre na pasta indicada no comentário `// Caminho:` do script (ex.: `Assets/_Project/Scripts/Data/`).
2. Botão direito no espaço vazio da pasta → **Create → Scripting → Empty C# Script**. Em versões anteriores ao Unity 6, use **Create → C# Script**.
3. Digite o nome **exatamente igual ao nome da classe** (ex.: `GameBalance`) e aperte Enter. Se o arquivo e a classe tiverem nomes diferentes, a Unity não consegue adicionar o componente a um GameObject.
4. Dê duplo clique no arquivo para abrir no editor de código, apague tudo, cole o script do guia e salve (**Ctrl+S**).
5. Volte à Unity e espere a compilação (o ícone girando no canto inferior direito). Abra o **Console** (**Window → General → Console**): ele não pode ter erros em vermelho.

**Ligar um campo no Inspector:** campos `[SerializeField]` aparecem no Inspector com o nome "humanizado" (`_trackRenderer` vira **Track Renderer**). Para preenchê-los, arraste o objeto da **Hierarchy** ou o asset da **Project** para o campo, ou clique no círculo ⊙ à direita do campo e escolha na lista.

## Convenções

- **Nomes no projeto em inglês** (scripts, classes, GameObjects, assets); **comentários em português**. Cada classe começa com `// POR QUE:` (por que ela existe) e `// ESTRATÉGIA:` (como funciona), e cada método tem um comentário curto acima dele.
- **Namespaces:** `PaddockBoss.Data` (ScriptableObjects e enums), `PaddockBoss.Game` (regras: simulação, economia, IA, campeonato, save), `PaddockBoss.UI` (tudo que desenha algo na tela), `PaddockBoss.Tests` (testes automáticos).
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Hierarchy da cena `Main`:** agrupadores na raiz entre colchetes: `[Systems]`, `[World]`, `[UI]`.

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

- **Regra de ouro:** as regras do jogo (velocidade, dinheiro, compra, pontos) moram em classes C# comuns, sem `MonoBehaviour`. A tela só lê o estado e chama métodos (`RequestPit`, `TryBuy`). Assim a lógica não depende de cena e pode ser testada automaticamente (Fase 9).
- **Por que a simulação não usa física (`Rigidbody2D`)?** Os carros andam sobre uma linha. A posição de cada um é só "quantas unidades já percorreu" (`Distance`). Isso torna ordem, voltas e ultrapassagens triviais de calcular e deixa a corrida igual em qualquer taxa de quadros. Por isso este guia não tem a nota `rb.linearVelocity`/`rb.velocity`: nenhuma fase usa Rigidbody.

## Mapa de sistemas

| Namespace | Script | Responsabilidade | Fase |
|---|---|---|---|
| `Data` | `Enums`, `GameBalance`, `TeamDefinition` | Enums, números do jogo, equipes | 1 |
| `Data` | `TrackDefinition` | Dados de uma pista | 2 |
| `Game` | `TrackPath` | Geometria da pista (posição, direção e curva por distância) | 2 |
| `UI` | `TrackAuthoring`, `TrackRenderer` | Desenhar pistas no Editor; mostrar a pista no jogo | 2 |
| `Game` | `TeamState`, `CarState`, `RaceSimulator`, `RaceRunner` | Simulação da corrida | 3 |
| `Game` | `RaceTestStarter` | Largada de teste (desativada na Fase 7) | 3 |
| `UI` | `CarMarker`, `RaceHUD` | Carros no mapa; volta e tabela de posições | 3 |
| `UI` | `CarPitControls` | Box e pneus dos carros do jogador | 4 |
| `Game` | `RaceEconomy`, `UpgradeService` | Dinheiro ao vivo; compras | 5 |
| `UI` | `UpgradeButton`, `MoneyFeed` | Botões de investimento; dinheiro e entradas | 5 |
| `Game` | `RivalAI` | Compras e box das equipes rivais | 6 |
| `Data` | `ChampionshipDefinition` | Pistas e equipes do campeonato | 7 |
| `Game` | `SaveData`, `SaveService`, `Championship`, `GameSession` | Campeonato, pontos e save | 7 |
| `UI` | `SeasonPanel` | Tela entre corridas | 7 |
| `UI` | `SafeAreaFitter`, `TrackCameraFit` | Layout em qualquer tela | 8 |
| `Tests` | `TestData` e 5 classes de teste | Testes automáticos em Edit Mode | 9 |

## Fases

| Fase | Parte | Conteúdo | Etapas |
|---|---|---|---|
| 0 | 3 | Setup do projeto | 0A Unity · 0B projeto e Git · 0C pastas e cenas |
| 1 | 4 | Dados: balanceamento e equipes | 1A balanceamento · 1B equipes |
| 2 | 5 | Pista: geometria, editor e desenho | 2A dados e geometria · 2B ferramenta de desenho · 2C três pistas · 2D pista na cena Main |
| 3 | 6 | Simulação da corrida | 3A carros como bolinhas · 3B ícone do carro · 3C tabela de posições |
| 4 | 7 | Pneus e pit stop | 4A script · 4B painel do primeiro carro · 4C segundo carro |
| 5 | 8 | Economia e investimentos | 5A dinheiro entrando · 5B botões de compra |
| 6 | 9 | IA das equipes rivais | 6A box e compras da IA · 6B personalidades |
| 7 | 10 | Campeonato e save local | 7A dados e save · 7B tela da temporada · 7C fluxo completo |
| 8 | 11 | Layout multiplataforma e arte | 8A área segura · 8B câmera · 8C arte |
| 9 | 12 | Testes automáticos | 9A assemblies · 9B testes · 9C rodar |
| 10 | 13 | Build e próximos passos | — |

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, versionado no Git, com as pastas e cenas que o resto do guia usa.

**Conceitos novos:**
- **Unity Hub:** o programa que instala versões da Unity (o "Editor") e abre projetos. Cada versão pode ter **módulos** de plataforma; sem o módulo Android, por exemplo, a Unity não gera APK/AAB.
- **LTS (Long Term Support):** versão que recebe correções por mais tempo. Use sempre uma LTS para um projeto que vai a público.
- **Template Universal 2D:** projeto inicial já configurado com o **URP** (Universal Render Pipeline, o sistema de renderização moderno da Unity) em modo 2D: câmera ortográfica, materiais de sprite e luz 2D.
- **As janelas do Editor:**
  - **Hierarchy:** a lista de objetos da cena aberta.
  - **Scene:** a vista de edição, onde você move as coisas.
  - **Game:** o que o jogador vê.
  - **Inspector:** propriedades do que estiver selecionado.
  - **Project:** os arquivos do projeto (a pasta `Assets/`).
  - **Console:** mensagens e erros.

  Se alguma sumir, reabra em **Window → General**.
- **GameObject e componente:** tudo na cena é um GameObject (um "objeto vazio" com posição). O que ele faz vem dos **componentes** presos a ele (um `SpriteRenderer` desenha uma imagem; um script seu é um componente também).
- **Play Mode:** o botão ▶ no topo roda o jogo dentro do Editor. ⚠️ **Tudo o que você mudar na cena durante o Play é desfeito ao sair do Play.** Saia do Play antes de editar.
- **Git LFS:** extensão do Git para guardar arquivos binários grandes (imagens, áudio) fora do histórico normal.

### Etapa 0A — Instalar a Unity

1. Baixe e instale o **Unity Hub** (unity.com/download) e entre com sua conta Unity.
2. No Hub: **Installs → Install Editor** → aba **Official releases** → a versão **Unity 6** mais recente marcada como **LTS** (`6000.x`) → **Install**.
3. Na tela de módulos, marque:
   - **Microsoft Visual Studio Community** (se ainda não tiver um editor de código; VS Code e Rider também servem).
   - **Android Build Support**, abrindo a setinha e marcando também **OpenJDK** e **Android SDK & NDK Tools**.
   - **iOS Build Support** (opcional; a build final de iOS exige um Mac).
   - **Web Build Support**.
   - **Windows Build Support (IL2CPP)**.
4. Clique **Install** e espere (são vários GB).

### Etapa 0B — Criar o projeto e o repositório

1. No Hub: **Projects → New project** → escolha a versão instalada no topo → template **Universal 2D** (baixe-o se aparecer o ícone de download) → **Project name** = `PaddockBoss` → **Location** = a pasta onde ficam seus projetos → **Create project**.
2. Com o Editor aberto, configure o editor de código: **Edit → Preferences → External Tools → External Script Editor** = o seu (Visual Studio, VS Code ou Rider). Isso faz o duplo clique num script abri-lo no editor certo, com autocompletar.
3. Abra um terminal (PowerShell) **na pasta do projeto** (a que contém `Assets/`) e rode:

   ```powershell
   git init
   curl.exe -L https://raw.githubusercontent.com/github/gitignore/main/Unity.gitignore -o .gitignore
   git lfs install
   git lfs track "*.png" "*.wav" "*.ogg" "*.ttf" "*.otf"
   ```

4. Abra o `.gitignore` num editor de texto e acrescente uma linha `Builds/` no final.
5. Na Unity: **Edit → Project Settings → Editor**. Em **Version Control**, **Mode** = `Visible Meta Files`. Em **Asset Serialization**, **Mode** = `Force Text`. Arquivos de cena e de asset passam a ser texto, o que permite ver diferenças no Git.
6. Primeiro commit:

   ```powershell
   git add .
   git commit -m "chore: projeto Unity vazio"
   ```

> **Pacotes:** não é preciso instalar nada pelo Package Manager. O template já traz **uGUI** (que no Unity 6 inclui o **TextMeshPro**), **Input System**, **2D Sprite** e **Test Framework** (usado na Fase 9). A UI (uGUI) funciona com toque e mouse sem código extra, e toda interação do jogo é por botões (Parte 1 §10), então nenhum script deste guia lê input diretamente.

### Etapa 0C — Pastas e cenas

1. Na janela **Project**, clique em `Assets`. Botão direito → **Create → Folder** → `_Project`. O sublinhado faz a pasta aparecer no topo da lista.
2. Dentro de `_Project`, crie a estrutura (sempre com botão direito → **Create → Folder**):

   ```
   Assets/_Project/
     Data/
       Teams/
       Tracks/
     Prefabs/
     Scenes/
     Scripts/
       Data/
       Game/
       UI/
     Sprites/
   ```

3. Em `Assets/Scenes/` existe a `SampleScene` do template. Arraste-a para `_Project/Scenes/`, clique nela uma vez e aperte **F2** para renomear para `Main`.
4. Crie a segunda cena: **File → New Scene** → **Basic 2D (URP)** → **Create**. Salve com **File → Save As** em `_Project/Scenes/` com o nome `TrackLab`. Ela é uma "bancada" para desenhar pistas (Fase 2) e não entra na build.
5. Volte para a `Main`: duplo clique em `Main` na Project.

### 🧪 Teste rápido
Aperte ▶. A Game view mostra um fundo azul/cinza vazio e o Console não tem erros. Aperte ▶ de novo para sair.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- `Assets/_Project/` tem as pastas acima e as cenas `Main` e `TrackLab`.
- `git status` não lista `Library/` nem `Temp/` (o `.gitignore` funcionou).
- Duplo clique num `.cs` qualquer abre o editor de código configurado.

#### Problemas comuns
- **O template Universal 2D não aparece:** atualize o Hub; na lista de templates, use a busca.
- **Duplo clique no script abre o Bloco de Notas:** falta a etapa de **External Script Editor** (0B, passo 2).

Próxima fase: **Dados** — os números do jogo e as equipes viram assets editáveis.

---

# Parte 4 — Implementação Unity: Fase 1 (Dados: balanceamento e equipes)

## Fase 1 — Dados: balanceamento e equipes

> Objetivo desta fase: todos os números da Parte 1 §14 num asset `GameBalance` e as 7 equipes como assets `TeamDefinition`, editáveis no Inspector.

**Conceitos novos:**
- **ScriptableObject:** uma classe cujas instâncias são **arquivos de dados** no projeto (`.asset`), não objetos de cena. É o lugar certo para números de balanceamento e definições (equipes, pistas): você edita no Inspector e todos os scripts que apontam para o asset leem os mesmos valores.
- **`[CreateAssetMenu]`:** atributo que cria um item no menu **Create** da Project para gerar assets daquela classe.
- **`namespace`:** "sobrenome" das classes (`PaddockBoss.Data.GameBalance`). Evita conflito com classes de mesmo nome de outros pacotes. Quem usa a classe em outro namespace escreve `using PaddockBoss.Data;` no topo do arquivo.
- **`[Serializable]`:** marca uma classe comum para que a Unity consiga salvá-la e mostrá-la dentro de outro objeto (vira uma "gaveta" no Inspector).
- **`[Header("...")]` e `[Range(min, max)]`:** só mudam a aparência no Inspector: um título de seção e um controle deslizante.
- **`enum`:** um tipo com um conjunto fixo de opções nomeadas.

### Etapa 1A — Enums e `GameBalance`

Crie os dois scripts em `Assets/_Project/Scripts/Data/` (ver "Criar um script C#" na Parte 2).

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

Criar o asset:
1. Na Project, entre em `Assets/_Project/Data/`.
2. Botão direito → **Create → Paddock Boss → Game Balance**. Mantenha o nome `GameBalance`.
3. Clique no asset e veja o Inspector.

#### 🧪 Teste rápido
O Inspector do `GameBalance` mostra as seções **Velocidade**, **Pneus**, **Pit stop**, **Economia**, **Campeonato**, **Investimentos** e **IA**. Abra **Compounds** (3 elementos: Macio, Médio, Duro) e **Upgrade Costs** (4 elementos): já vêm preenchidos com os valores da Parte 1 §14.

### Etapa 1B — Equipes

Crie em `Assets/_Project/Scripts/Data/`:

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

Criar as 7 equipes:
1. Na Project, entre em `Assets/_Project/Data/Teams/`.
2. Botão direito → **Create → Paddock Boss → Team** → nome `Team_Player`.
3. Preencha no Inspector. A tabela abaixo é uma sugestão de partida; nomes e identidades das equipes estão **Em aberto** na Parte 1, então use nomes provisórios:

   | Asset | Team Id | Short Name | Color | Engineering | Marketing | Pit Crew | Driver Skill |
   |---|---|---|---|---|---|---|---|
   | `Team_Player` | `player` | `MNG` | `#F2C230` | 0 | 0 | 0 | 0, 0 |
   | `Team_Rival1` | `rival_1` | `RV1` | `#E8483C` | 5 | 2 | 2 | 3, 2 |
   | `Team_Rival2` | `rival_2` | `RV2` | `#3C7BE8` | 3 | 4 | 1 | 2, 2 |
   | `Team_Rival3` | `rival_3` | `RV3` | `#3CC27A` | 2 | 1 | 3 | 1, 3 |
   | `Team_Rival4` | `rival_4` | `RV4` | `#A64CE0` | 1 | 1 | 1 | 2, 1 |
   | `Team_Rival5` | `rival_5` | `RV5` | `#F28A30` | 1 | 0 | 2 | 0, 1 |
   | `Team_Rival6` | `rival_6` | `RV6` | `#9AA3AE` | 0 | 1 | 0 | 1, 0 |

   - **Color:** clique na barra de cor e cole o código no campo **Hexadecimal**.
   - **Display Name** e os dois **Driver Names:** livres, mas nenhum vazio.
   - Os campos de **IA** ficam para a Fase 6.
4. Para criar as rivais mais rápido: selecione `Team_Player`, **Ctrl+D** (duplicar), renomeie (**F2**) e troque os campos.

#### 🧪 Teste rápido
A pasta `Data/Teams/` tem 7 assets. Clique em cada um e confira que **Team Id** é diferente em todos e que **Driver Names** tem 2 elementos com texto.

### ✅ Checkpoint da Fase 1
- O Console não mostra erros de compilação.
- Existem o `GameBalance` preenchido e as 7 `Team_*`.

#### Problemas comuns
- **O menu "Paddock Boss" não aparece em Create:** o script tem erro de compilação (veja o Console) ou o nome do arquivo não bate com o da classe (`GameBalance.cs` ↔ `class GameBalance`).
- **`Compounds` veio vazio:** o asset foi criado antes de o script estar completo. No Inspector, clique no ⋮ do topo → **Reset**, ou apague e recrie o asset.

Próxima fase: **Pista** — desenhar o traçado no Editor e transformá-lo em dados.

---

# Parte 5 — Implementação Unity: Fase 2 (Pista: geometria, editor e desenho)

## Fase 2 — Pista: geometria, editor e desenho

> Objetivo desta fase: desenhar 3 pistas na cena `TrackLab`, gravá-las em assets `TrackDefinition` e ver uma delas desenhada na cena `Main`.

**Conceitos novos:**
- **A pista como linha:** a pista é uma lista fechada de pontos (*waypoints*). Qualquer lugar dela é descrito por um único número: a **distância** desde a linha de largada (o waypoint 0). Uma volta inteira mede `Length`; a distância `Length × 2,5` é "metade da terceira volta". Toda a simulação (Fase 3) trabalha com esse número.
- **Coordenadas do mundo:** em 2D, cada objeto tem posição (x, y) em **unidades** (não pixels). Com a câmera ortográfica, o **Size** é metade da altura visível em unidades.
- **Classe C# "pura":** uma classe que não herda de `MonoBehaviour`. Não fica presa a GameObject, é criada com `new` e serve para cálculo. `TrackPath` é a primeira.
- **Gizmos:** desenhos de ajuda que só aparecem na Scene view (e na Game view com o botão **Gizmos** ligado), nunca no jogo final. `OnDrawGizmos` desenha sempre; `OnDrawGizmosSelected` desenha só com o objeto selecionado.
- **`[ContextMenu("...")]`:** cria um item no menu ⋮ do componente no Inspector, que roda o método **sem apertar Play**.
- **`LineRenderer`:** componente que desenha uma linha com espessura passando por uma lista de pontos.

### Etapa 2A — Dados e geometria da pista

Crie em `Assets/_Project/Scripts/Data/`:

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

Crie em `Assets/_Project/Scripts/Game/`:

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

#### 🧪 Teste rápido
O Console não tem erros. Na Project, **Create → Paddock Boss → Track** existe. Ainda não crie a pista: ela é criada na 2C.

### Etapa 2B — Ferramenta de desenho de pistas

Crie em `Assets/_Project/Scripts/UI/`:

```csharp
// Caminho: Assets/_Project/Scripts/UI/TrackAuthoring.cs
using System.Collections.Generic;
using PaddockBoss.Data;
using PaddockBoss.Game;
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

        // Com o objeto selecionado, pinta o traçado pela intensidade de curva que
        // a simulação vai usar (verde = reta, vermelho = curva fechada). É o teste
        // visual do TrackPath e ajuda a calibrar sharpCornerDegreesPerUnit.
        private void OnDrawGizmosSelected()
        {
            if (_target == null || transform.childCount < 3) return;
            var points = new Vector2[transform.childCount];
            for (int i = 0; i < points.Length; i++)
                points[i] = transform.GetChild(i).localPosition;
            var path = new TrackPath(points, _target.sharpCornerDegreesPerUnit, _target.cornerInfluence);

            const float step = 0.5f;
            for (float d = 0f; d < path.Length; d += step)
            {
                Gizmos.color = Color.Lerp(Color.green, Color.red, path.CornerAt(d));
                Gizmos.DrawLine(transform.TransformPoint(path.PositionAt(d)), transform.TransformPoint(path.PositionAt(d + step)));
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

Montar a bancada:
1. Em `Data/Tracks/`: **Create → Paddock Boss → Track** → `Track_A`. No Inspector: **Track Id** = `track_a`, **Display Name** = um nome provisório (nomes das pistas: **Em aberto**). Deixe o resto como veio.
2. Abra a cena `TrackLab` (duplo clique em `Scenes/TrackLab`).
3. Na Hierarchy: botão direito no vazio → **Create Empty** → renomeie (F2) para `TrackAuthoring`. No Inspector, no componente **Transform**, clique no ⋮ → **Reset** (posição 0, 0, 0).
4. **Add Component** → digite `TrackAuthoring` → selecione. Arraste `Track_A` da Project para o campo **Target**.
5. No ⋮ do componente **Track Authoring** → **Gerar oval de teste**. Aparecem 24 filhos `WP_00` a `WP_23`.
6. Na Scene view, garanta que o botão **Gizmos** (barra superior da Scene) está ligado. Se a pista não aparecer inteira, dê duplo clique em `TrackAuthoring` na Hierarchy (enquadra o objeto) e role o mouse para afastar.

#### 🧪 Teste rápido
- Com `TrackAuthoring` **selecionado**, o traçado aparece colorido: **verde nas retas e alaranjado/vermelho nas curvas**. É o `TrackPath` calculando a intensidade de curva que a simulação vai usar.
- Com outro objeto selecionado, o traçado aparece amarelo, com o `WP_00` em verde (a largada).
- Selecione um `WP_xx` e arraste-o com a ferramenta de mover (**W**): o traçado acompanha.

### Etapa 2C — Desenhar as 3 pistas

1. Dê forma à `Track_A` arrastando os waypoints. Regras práticas:
   - O sentido da corrida é a **ordem dos filhos na Hierarchy**. O `WP_00` (verde) é a largada; deixe-o numa reta.
   - Para **acrescentar** um ponto: selecione um `WP`, **Ctrl+D** e arraste a cópia na Hierarchy para logo depois do original. Para **remover**: selecione e Delete. Os nomes não importam, só a ordem.
   - Curvas são feitas com vários pontos próximos; retas, com poucos pontos espaçados.
   - Use as cores do gizmo para calibrar: se uma curva que deveria ser lenta está verde, aproxime os pontos dela ou feche o ângulo. Se tudo fica vermelho, aumente **Sharp Corner Degrees Per Unit** no asset da pista.
   - Mantenha a pista dentro de uns 40 × 25 unidades (a grade da Scene view ajuda a medir).
2. Clique no ⋮ do **Track Authoring** → **Gravar waypoints na TrackDefinition**. O Console mostra `TrackAuthoring: N waypoints gravados em Track_A`.
3. Para a segunda pista: crie `Track_B` (`track_b`). Na Hierarchy, selecione `TrackAuthoring`, **Ctrl+D**, renomeie a cópia para `TrackAuthoring_B`, troque o **Target** para `Track_B` e desative a original (desmarque a caixinha ao lado do nome no Inspector) para não confundir os traçados. Remodele e grave.
4. Repita para `Track_C`.
5. **File → Save** (Ctrl+S) para salvar a cena `TrackLab`. Assim as pistas podem ser editadas e regravadas depois.

#### 🧪 Teste rápido
Clique em cada asset `Track_*` na Project: o campo **Waypoints** tem a quantidade de pontos que o Console informou.

### Etapa 2D — A pista na cena `Main`

Crie em `Assets/_Project/Scripts/UI/`:

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
        [SerializeField] private TrackDefinition _editorPreview;

        public Bounds Bounds { get; private set; }

        // Desenha _editorPreview sem apertar Play, pelo menu ⋮ do componente. Só
        // serve para conferir a pista na cena; no jogo, quem chama Draw é o
        // RaceRunner a cada largada.
        [ContextMenu("Desenhar prévia no Editor")]
        private void DrawEditorPreview()
        {
            if (_editorPreview != null) Draw(_editorPreview);
        }

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

Montar a cena:
1. Abra a cena `Main`.
2. Crie os agrupadores: botão direito no vazio da Hierarchy → **Create Empty**, três vezes, com os nomes `[Systems]`, `[World]` e `[UI]`. Dê **Reset** no Transform de cada um.
3. Pista: botão direito em `[World]` → **Create Empty** → `Track`. **Add Component → Line Renderer** e **Add Component → Track Renderer**.
4. No **Line Renderer**:
   - **Materials → Element 0:** clique no ⊙ e escolha `Sprite-Unlit-Default`. Com o material padrão, a linha fica rosa no URP.
   - **Color:** clique na barra de gradiente, selecione as duas setas de cor de cima e coloque `#3A3F4B` (cinza-chumbo).
   - **Corner Vertices** = `4` e **End Cap Vertices** = `4` (cantos arredondados, mais limpo no flat vector).
   - **Order in Layer** (seção Additional Settings / Sorting) = `0`.
5. Linha de largada: botão direito em `[World]` → **2D Object → Sprites → Square** → `StartLine`. **Scale** = (1.6, 0.25, 1), **Color** branco, **Order in Layer** = `1`. Arraste `StartLine` para o campo **Start Line** do `Track Renderer`.
6. Câmera: selecione `Main Camera`. **Projection** = Orthographic (já vem assim no 2D), **Size** = `16`, **Position** = (0, 0, -10). Em **Environment → Background**, uma cor de fundo escura (ex.: `#14171C`). A Fase 8 troca o Size fixo por enquadramento automático.
7. No **Track Renderer**, arraste `Track_A` para **Editor Preview** e clique no ⋮ → **Desenhar prévia no Editor**.
8. **Ctrl+S** para salvar a cena.

#### 🧪 Teste rápido
Sem apertar Play, a Scene e a Game view mostram a `Track_A` como uma faixa cinza fechada, com a linha de largada branca atravessada no `WP_00`.

**Hierarchy esperada ao fim da Fase 2 (cena `Main`):**

```
Main
├─ Main Camera
├─ [Systems]
├─ [World]
│  ├─ Track          (Line Renderer, Track Renderer)
│  └─ StartLine      (Sprite Renderer)
└─ [UI]
```

### ✅ Checkpoint da Fase 2
- Os 3 assets `Track_*` têm **Waypoints** preenchidos.
- Na `TrackLab`, o gizmo colorido mostra retas verdes e curvas vermelhas em todas as pistas.
- Na `Main`, a prévia desenha a pista com a linha de largada no lugar certo.

#### Problemas comuns
- **Linha rosa ou invisível:** falta o material `Sprite-Unlit-Default` no Line Renderer (o projeto é URP 2D).
- **A prévia não aparece na Game view:** a câmera está longe da pista. Confira **Position** (0, 0, -10) e **Size** 16, e se a `TrackAuthoring` estava em (0, 0, 0) ao gravar.
- **Gravei, mas o asset voltou ao que era:** você editou os waypoints e não clicou em **Gravar** de novo. O asset só muda no Bake.

Próxima fase: **Simulação da corrida** — 14 carros andando, completando voltas e trocando de posição.

---

# Parte 6 — Implementação Unity: Fase 3 (Simulação da corrida e tabela de posições)

## Fase 3 — Simulação da corrida e tabela de posições

> Objetivo desta fase: apertar Play e ver 14 carros largarem, andarem mais devagar nas curvas, completarem voltas e terminarem a corrida, com uma tabela de posições atualizada ao vivo.

**Conceitos novos:**
- **Ciclo de vida de um MonoBehaviour:** a Unity chama métodos com nomes especiais nos seus scripts:
  - `Awake`: uma vez, quando o objeto é criado.
  - `OnEnable`: toda vez que o objeto é ligado.
  - `Start`: uma vez, no primeiro frame, depois de todos os `Awake`.
  - `Update`: todo frame.
  - `LateUpdate`: todo frame, depois de todos os `Update`.
  - `OnDisable`: quando o objeto é desligado.
- **`Time.deltaTime`:** os segundos que se passaram desde o frame anterior. Multiplicar velocidades por ele faz o jogo andar igual a 30 ou a 144 fps.
- **Eventos C# (`event Action<...>`):** uma lista de funções a avisar. Quem quer ser avisado se inscreve com `+=` e sai com `-=`; quem dispara chama `Evento?.Invoke(...)`. O `?.` evita erro quando ninguém está inscrito.
- **Prefab:** um GameObject "modelo" salvo como asset (ícone azul na Project). `Instantiate(prefab)` cria cópias na cena; mudar o prefab muda todas as cópias.
- **Canvas e Rect Transform:** a UI da Unity (uGUI) vive dentro de um **Canvas**. Objetos de UI têm **Rect Transform** em vez de Transform. As **âncoras** dizem a que parte do pai o objeto se prende (ex.: "à direita, de cima a baixo"). O **Canvas Scaler** define como a UI escala em telas diferentes.
- **TextMeshPro (TMP):** o sistema de texto da Unity. Existem duas versões: **UI → Text - TextMeshPro** (dentro do Canvas) e **3D Object → Text - TextMeshPro** (no mundo, junto dos sprites). Na primeira vez, a Unity pede para importar o **TMP Essentials**: aceite.
- **Layout Groups:** componentes que organizam os filhos automaticamente (**Vertical Layout Group** empilha; **Horizontal** põe lado a lado; **Grid** faz uma grade). O **Layout Element** num filho diz que tamanho ele prefere.

### Etapa 3A — A corrida rodando, com os carros como bolinhas

Primeiro, a simulação sem nenhuma arte: os carros aparecem como bolinhas coloridas desenhadas por gizmo.

Crie em `Assets/_Project/Scripts/Game/` os scripts abaixo, nesta ordem. Os erros de compilação somem quando todos existirem: o `RaceRunner` cita `CarMarker` (Etapa 3B), então crie `CarMarker` agora também (em `Scripts/UI/`) e só monte o prefab dele na 3B.

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
                if (_carMarkerPrefab == null) break; // sem prefab ainda: só os gizmos (Etapa 3A)
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

        // Desenha cada carro como uma bolinha na cor da equipe (maior para o
        // jogador). Aparece na Scene view e, com o botão Gizmos ligado, na Game
        // view: é o teste visual da simulação antes de existir o prefab do carro.
        private void OnDrawGizmos()
        {
            if (Sim == null) return;
            foreach (var car in Sim.Cars)
            {
                Gizmos.color = car.Team.Definition.color;
                Gizmos.DrawSphere(Sim.Path.PositionAt(car.Distance), car.IsPlayer ? 0.5f : 0.35f);
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

Montar na cena `Main`:
1. Botão direito em `[World]` → **Create Empty** → `Cars` (os carros serão criados dentro dele).
2. Botão direito em `[Systems]` → **Create Empty** → `RaceRunner`. **Add Component → Race Runner**:
   - **Balance** = `GameBalance` (da Project).
   - **Track Renderer** = `Track` (da Hierarchy).
   - **Car Marker Prefab** = deixe **vazio** por enquanto (a Etapa 3B cria o prefab).
   - **Markers Parent** = `Cars`.
   - **Time Scale** = `4`, para testar rápido.
3. No mesmo objeto, **Add Component → Race Test Starter**:
   - **Runner** = arraste o próprio objeto `RaceRunner`.
   - **Track** = `Track_A`.
   - **Player Team** = `Team_Player`.
   - **Rival Teams:** clique no cadeado 🔒 do topo do Inspector (trava o Inspector neste objeto), selecione as 6 `Team_Rival*` na Project e arraste todas de uma vez sobre o título **Rival Teams**. Destrave o cadeado.
4. Na Game view, ligue o botão **Gizmos** (barra superior da Game view).

#### 🧪 Teste rápido
Aperte ▶. 14 bolinhas coloridas saem de trás da linha de largada e dão voltas. Nas curvas, elas se aproximam umas das outras (estão freando). As duas bolinhas amarelas maiores são os carros do jogador. Em cerca de um minuto (com Time Scale 4), todas param sobre a linha de chegada.

### Etapa 3B — O ícone do carro (prefab)

1. Na Hierarchy, botão direito no vazio → **Create Empty** → `CarMarker`. **Reset** no Transform.
2. Botão direito em `CarMarker` → **2D Object → Sprites → Capsule** → `Body`. **Scale** = (0.5, 0.8, 1); **Sprite Renderer → Order in Layer** = `3`.
3. Botão direito em `CarMarker` → **2D Object → Sprites → Capsule** → `Highlight`. **Scale** = (0.7, 1.0, 1); **Color** = `#FFE14D`; **Order in Layer** = `2` (fica atrás do Body, como um contorno).
4. Botão direito em `CarMarker` → **3D Object → Text - TextMeshPro** → `Label`. Aceite **Import TMP Essentials** se for pedido. No Inspector:
   - **Rect Transform:** **Pos** (0, 0, 0), **Width** 1, **Height** 1.
   - **Text Input:** `A`. **Font Size** = `3`. **Alignment:** centro horizontal e centro vertical. **Vertex Color** = preto.
   - **Extra Settings → Order in Layer** = `4`.
5. Selecione `CarMarker`. **Add Component → Car Marker** e arraste os filhos para **Body**, **Player Highlight** (o `Highlight`) e **Label**.
6. Arraste `CarMarker` da Hierarchy para a pasta `Assets/_Project/Prefabs/`. O ícone fica azul: virou prefab. Apague o `CarMarker` da Hierarchy (Delete); o prefab continua na Project.
7. Selecione `RaceRunner` e arraste o prefab `CarMarker` para **Car Marker Prefab**.

#### 🧪 Teste rápido
Aperte ▶. Agora cada carro é uma cápsula com a cor da equipe, apontando para onde anda e com a inicial do piloto sempre de pé. Os do jogador têm contorno amarelo. Carros lado a lado ficam levemente separados (faixas), e não um em cima do outro. As bolinhas de gizmo continuam por baixo; desligue **Gizmos** na Game view se atrapalharem.

### Etapa 3C — Volta e tabela de posições

Crie em `Assets/_Project/Scripts/UI/`:

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

Montar a UI, clique a clique:

1. **Canvas:** botão direito em `[UI]` → **UI → Canvas**. A Unity cria o `Canvas` e, na raiz, um `EventSystem` (é ele que transforma toque e clique em eventos de botão; não apague). Arraste o `EventSystem` para a raiz da Hierarchy, se não estiver lá.
2. **Canvas Scaler** (no `Canvas`): **UI Scale Mode** = `Scale With Screen Size`, **Reference Resolution** = `1920` × `1080`, **Screen Match Mode** = `Match Width Or Height`, **Match** = `0.5`. A partir daqui, todos os tamanhos do guia são "pixels de uma tela 1920×1080" e escalam para qualquer tela.
3. **Game view:** no menu de resolução da Game view (onde diz *Free Aspect*), escolha `Full HD (1920x1080)`. Se não existir, clique em **+** e crie.
4. **SidePanel:** botão direito em `Canvas` → **UI → Panel** → `SidePanel`.
   - **Rect Transform:** clique no quadrado de âncoras (canto superior esquerdo do componente), segure **Shift + Alt** e clique na opção da **coluna da direita, linha de baixo** (*right / stretch*). Depois: **Width** = `640`, **Pos X** = `0`, **Top** = `0`, **Bottom** = `0`.
   - **Image → Color** = `#1B1F27`, alfa 255 (painel opaco).
   - **Add Component → Vertical Layout Group:** **Padding** 16 nos quatro lados, **Spacing** `8`, **Child Alignment** `Upper Left`, **Control Child Size** ✓ Width ✓ Height, **Child Force Expand** ✓ Width ✗ Height.
5. **LapText:** botão direito em `SidePanel` → **UI → Text - TextMeshPro** → `LapText`. Texto `Volta 1/12`, **Font Size** `40`, **Font Style** **B**. **Add Component → Layout Element** → **Preferred Height** ✓ `56`.
6. **StandingsText:** mesmo caminho → `StandingsText`. Texto `Tabela`, **Font Size** `22`, **Alignment** topo/esquerda, **Wrapping** desligado. **Layout Element → Preferred Height** ✓ `400`.
7. Selecione `SidePanel`. **Add Component → Race HUD** e ligue **Runner** (`RaceRunner`), **Lap Text** e **Standings Text**.
8. **Ctrl+S**.

#### 🧪 Teste rápido
Aperte ▶. O painel escuro à direita mostra `Volta 1/12` e a tabela com 14 linhas: posição, sigla colorida da equipe, nome do piloto e diferença para o líder. Seus dois pilotos aparecem em **negrito**. A tabela muda a cada ultrapassagem; ao final, aparecem `Última volta`, `FIM` nos que terminaram e `Bandeirada!`.

> Parte da pista pode ficar por baixo do painel. A Fase 8 resolve isso com enquadramento automático; por ora, mova a `Main Camera` alguns pontos para a direita (**Position X** ≈ 6).

**Hierarchy esperada ao fim da Fase 3:**

```
Main
├─ Main Camera
├─ EventSystem
├─ [Systems]
│  └─ RaceRunner        (Race Runner, Race Test Starter)
├─ [World]
│  ├─ Track
│  ├─ StartLine
│  └─ Cars              (vazio no Editor; os carros nascem aqui no Play)
└─ [UI]
   └─ Canvas
      └─ SidePanel      (Image, Vertical Layout Group, Race HUD)
         ├─ LapText
         └─ StandingsText
```

### ✅ Checkpoint da Fase 3
- 14 carros largam enfileirados, freiam nas curvas, trocam de posição e terminam a corrida.
- A tabela acompanha a ordem real do mapa.
- Com **Time Scale** = 8, a corrida inteira passa em menos de um minuto, sem carros "pulando" a linha de chegada.

#### Problemas comuns
- **`ArgumentException: A pista precisa de pelo menos 3 waypoints`:** a `TrackDefinition` usada não passou pelo **Gravar** da Fase 2.
- **Todos os carros andam igual e a ordem nunca muda:** os rivais estão com os níveis iniciais zerados (ver tabela da Etapa 1B) ou `Noise Amplitude` está 0 no `GameBalance`.
- **`NullReferenceException` no `CarMarker.Bind`:** um campo do prefab ficou vazio (Body, Player Highlight ou Label) ou uma equipe tem nome de piloto vazio.
- **A tabela não aparece:** o texto está fora do painel. Confira **Control Child Size** no Vertical Layout Group e o **Layout Element** dos textos.

Próxima fase: **Pneus e pit stop** — desgaste visível e o primeiro controle do jogador.

---

# Parte 7 — Implementação Unity: Fase 4 (Pneus e pit stop)

## Fase 4 — Pneus e pit stop

> Objetivo desta fase: para cada carro do jogador, ver o desgaste do pneu, escolher o composto e mandar para o box.

A simulação já gasta pneus e faz pit stops (Fase 3: `TireWear`, `RequestPit`, `StartPit`, `TickPit`). Falta a interface.

**Conceitos novos:**
- **`Button` e `onClick`:** o componente de botão da uGUI. `onClick.AddListener(Metodo)` registra a função chamada no clique ou toque. Pelo código, o registro acontece no `Awake` (uma vez só).
- **Inscrever no `OnEnable`, sair no `OnDisable`:** um painel que é ligado e desligado (a Fase 7 esconde o HUD entre corridas) deve parar de ouvir eventos quando desligado; senão, continua recebendo avisos sem estar na tela, ou se inscreve duas vezes.
- **`Image` do tipo *Filled*:** uma imagem que se desenha só em parte, conforme o **Fill Amount** (0 a 1). É a forma mais simples de fazer uma barra.
- **Duplicar com referências internas:** ao duplicar (Ctrl+D) um objeto cujo script aponta para os próprios filhos, a cópia aponta para os filhos **da cópia**. Por isso dá para montar um painel e duplicá-lo.

### Etapa 4A — O script

Crie em `Assets/_Project/Scripts/UI/`:

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

### Etapa 4B — Painel do primeiro carro

1. **PitPanel:** botão direito em `SidePanel` → **Create Empty** → `PitPanel`. **Add Component → Horizontal Layout Group:** **Spacing** `16`, **Control Child Size** ✓ Width ✓ Height, **Child Force Expand** ✓ Width ✓ Height. **Add Component → Layout Element → Preferred Height** ✓ `190`.
2. **CarPit_0:** botão direito em `PitPanel` → **Create Empty** → `CarPit_0`. **Add Component → Vertical Layout Group:** **Spacing** `6`, **Control Child Size** ✓ Width ✓ Height, **Child Force Expand** ✓ Width ✗ Height.
3. Filhos de `CarPit_0`, nesta ordem (cada um com **Add Component → Layout Element → Preferred Height**):

   | Nome | Como criar (botão direito em `CarPit_0` →) | Ajustes | Preferred Height |
   |---|---|---|---|
   | `DriverText` | **UI → Text - TextMeshPro** | Font Size 22, negrito | 30 |
   | `WearBar` | **UI → Image** | Color `#3A3F4B` | 20 |
   | `TireText` | **UI → Text - TextMeshPro** | Font Size 20 | 26 |
   | `CompoundButton` | **UI → Button - TextMeshPro** | texto filho: Font Size 18 | 44 |
   | `BoxButton` | **UI → Button - TextMeshPro** | texto filho: Font Size 20, negrito | 44 |

4. **Barra de desgaste:** botão direito em `WearBar` → **UI → Image** → `Fill`.
   - **Rect Transform:** quadrado de âncoras → **Alt** + clique na opção do canto inferior direito (*stretch / stretch*), para ocupar todo o `WearBar`.
   - **Source Image:** clique no ⊙ e escolha `UISprite`. Sem sprite, a opção *Filled* não aparece.
   - **Image Type** = `Filled`, **Fill Method** = `Horizontal`, **Fill Origin** = `Left`. **Color** = verde.
5. Selecione `CarPit_0`. **Add Component → Car Pit Controls**:
   - **Runner** = `RaceRunner`; **Driver Index** = `0`.
   - **Driver Text**, **Wear Fill** (o `Fill`, não o `WearBar`), **Tire Text**.
   - **Box Button** = `BoxButton`; **Box Label** = o `Text (TMP)` filho do `BoxButton`.
   - **Compound Button** = `CompoundButton`; **Compound Label** = o texto filho dele.

#### 🧪 Teste rápido
Aperte ▶. O painel do primeiro carro mostra `P7  Nome`, a barra cheia e verde, `Médio 100%` e os botões. Clique **Trocar por: Médio** até mostrar **Macio**. Clique **Box**: o texto vira "Box nesta volta (cancelar)". Ao cruzar a linha, a cápsula sai para o lado da pista, o botão mostra a contagem regressiva, e o carro volta com `Macio 100%`.

### Etapa 4C — Segundo carro

1. Selecione `CarPit_0` e **Ctrl+D**. Renomeie a cópia para `CarPit_1`.
2. No **Car Pit Controls** da cópia, mude **Driver Index** para `1`. As outras referências já apontam para os filhos da cópia.

#### 🧪 Teste rápido
Os dois painéis mostram pilotos diferentes, e o **Box** de cada um chama só o seu carro.

**Hierarchy esperada (dentro de `SidePanel`) ao fim da Fase 4:**

```
SidePanel
├─ LapText
├─ StandingsText
└─ PitPanel                (Horizontal Layout Group)
   ├─ CarPit_0             (Vertical Layout Group, Car Pit Controls: Driver Index 0)
   │  ├─ DriverText
   │  ├─ WearBar
   │  │  └─ Fill
   │  ├─ TireText
   │  ├─ CompoundButton
   │  └─ BoxButton
   └─ CarPit_1             (igual, Driver Index 1)
```

### ✅ Checkpoint da Fase 4
- A barra de cada carro do jogador esvazia e passa de verde a vermelho ao longo da corrida.
- O pit stop troca o composto e zera o desgaste; a tabela mostra `BOX` enquanto o carro está parado.
- Com pneu acabado, o carro fica claramente mais lento e perde posições (teste deixando um carro sem parar a corrida inteira).

#### Problemas comuns
- **A barra não esvazia:** o campo **Wear Fill** aponta para o `WearBar` em vez do `Fill`, ou o `Fill` não está como *Filled*.
- **O botão não reage ao clique:** falta o `EventSystem` na cena, ou outro objeto de UI transparente está por cima bloqueando (desligue **Raycast Target** das imagens decorativas).

Próxima fase: **Economia e investimentos** — o dinheiro entra durante a corrida e vira desempenho.

---

# Parte 8 — Implementação Unity: Fase 5 (Economia ao vivo e investimentos)

## Fase 5 — Economia ao vivo e investimentos

> Objetivo desta fase: o dinheiro da equipe sobe durante a corrida (patrocínio, voltas, ultrapassagens, prêmio), e cada botão de investimento compra um nível que muda o desempenho na hora.

**Conceitos novos:**
- **`Dictionary<Chave, Valor>`:** uma tabela de consulta rápida. Aqui ela guarda as frações de dinheiro de patrocínio de cada equipe (o "cofrinho"), já que o dinheiro do jogo é inteiro.
- **Classe que só ouve eventos:** a `RaceEconomy` não sabe nada de pista nem de velocidade; ela se inscreve nos eventos do `RaceSimulator` e paga. Isso deixa cada regra num lugar só.
- **Ler a cada frame vs. esperar evento:** a UI de compra relê o dinheiro em todo `Update` em vez de esperar um aviso. Com poucos botões, é barato e não há como "perder" uma atualização.
- **Grid Layout Group:** organiza os filhos numa grade de células de tamanho fixo.

### Etapa 5A — Dinheiro entrando

Crie em `Assets/_Project/Scripts/Game/` os dois serviços:

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

Agora **substitua o conteúdo inteiro** do `RaceRunner.cs` pela versão abaixo. As novidades são `Economy`, `Upgrades`, `PlayerTeam`, o `Awake` e a linha `Economy.Tick(step)`.

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
                if (_carMarkerPrefab == null) break; // sem prefab ainda: só os gizmos (Etapa 3A)
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

        // Desenha cada carro como uma bolinha na cor da equipe (maior para o
        // jogador). Aparece na Scene view e, com o botão Gizmos ligado, na Game
        // view: é o teste visual da simulação antes de existir o prefab do carro.
        private void OnDrawGizmos()
        {
            if (Sim == null) return;
            foreach (var car in Sim.Cars)
            {
                Gizmos.color = car.Team.Definition.color;
                Gizmos.DrawSphere(Sim.Path.PositionAt(car.Distance), car.IsPlayer ? 0.5f : 0.35f);
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

Crie em `Assets/_Project/Scripts/UI/`:

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

Montar o painel de dinheiro:
1. Botão direito em `SidePanel` → **Create Empty** → `MoneyPanel`. Na Hierarchy, arraste-o para ficar **entre** `StandingsText` e `PitPanel`.
2. Em `MoneyPanel`: **Add Component → Horizontal Layout Group** (**Control Child Size** ✓ Width ✓ Height, **Child Force Expand** ✓ Width ✓ Height) e **Add Component → Layout Element → Preferred Height** ✓ `100`.
3. Botão direito em `MoneyPanel` → **UI → Text - TextMeshPro** → `MoneyText`: **Font Size** `40`, negrito, **Alignment** meio/esquerda, cor `#FFE14D`.
4. Botão direito em `MoneyPanel` → **UI → Text - TextMeshPro** → `FeedText`: **Font Size** `18`, **Alignment** topo/direita, cor `#6BE37A`, **Wrapping** desligado.
5. Selecione `MoneyPanel`. **Add Component → Money Feed** e ligue **Runner**, **Money Text** e **Feed Text**.

#### 🧪 Teste rápido
Aperte ▶. O saldo começa em `$ 300` e sobe sozinho (patrocínio). A cada volta aparece `+N  Volta em Px` à direita; quando um carro seu ultrapassa, `+15  Ultrapassagem`. Na chegada, `+N  Chegada em Px`. As mensagens somem depois de 3 segundos.

### Etapa 5B — Botões de investimento

Crie em `Assets/_Project/Scripts/UI/`:

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

Montar o painel:
1. Botão direito em `SidePanel` → **Create Empty** → `InvestPanel` (deve ser o **último** filho do `SidePanel`).
   - **Add Component → Grid Layout Group:** **Cell Size** `296` × `80`, **Spacing** `16` × `10`, **Constraint** = `Fixed Column Count`, **Constraint Count** = `2`.
   - **Add Component → Layout Element → Preferred Height** ✓ `260`.
2. Primeiro botão: botão direito em `InvestPanel` → **UI → Button - TextMeshPro** → `Upgrade_Engineering`.
   - Renomeie o filho `Text (TMP)` para `Title`: **Font Size** `20`, negrito.
   - Botão direito em `Upgrade_Engineering` → **UI → Text - TextMeshPro** → `Level` (**Font Size** `16`), e de novo → `Cost` (**Font Size** `18`, cor `#B8860B`).
   - Em `Upgrade_Engineering`: **Add Component → Vertical Layout Group** (**Padding** 6 nos quatro lados, **Control Child Size** ✓ Width ✓ Height, **Child Force Expand** ✓ Width ✓ Height). Os três textos se empilham dentro do botão.
   - **Add Component → Upgrade Button:** **Runner** = `RaceRunner`, **Type** = `Engineering`, **Driver Index** = `0`, **Button** = o próprio `Upgrade_Engineering`, **Title Text**, **Level Text**, **Cost Text**.
3. Selecione `Upgrade_Engineering` e **Ctrl+D** quatro vezes. Renomeie as cópias e mude só **Type** e **Driver Index**:

   | Objeto | Type | Driver Index |
   |---|---|---|
   | `Upgrade_Engineering` | Engineering | 0 |
   | `Upgrade_Marketing` | Marketing | 0 |
   | `Upgrade_PitCrew` | PitCrew | 0 |
   | `Upgrade_Driver0` | DriverTraining | 0 |
   | `Upgrade_Driver1` | DriverTraining | 1 |

4. **Ctrl+S**.

#### 🧪 Teste rápido
Aperte ▶ com **Time Scale** `1`. Os botões mostram nome, `Nv 0` e custo, e ficam cinza até o saldo alcançar o custo. Compre **Engenharia** algumas vezes: o saldo cai, o nível sobe, o custo do próximo nível aumenta, e nas voltas seguintes seus carros ganham posições. **Propaganda** acelera a subida do saldo; **Equipe de boxes** encurta a contagem do próximo pit stop.

**Hierarchy esperada (dentro de `SidePanel`) ao fim da Fase 5:**

```
SidePanel                  (Race HUD)
├─ LapText
├─ StandingsText
├─ MoneyPanel              (Money Feed)
│  ├─ MoneyText
│  └─ FeedText
├─ PitPanel
│  ├─ CarPit_0
│  └─ CarPit_1
└─ InvestPanel             (Grid Layout Group)
   ├─ Upgrade_Engineering  (Upgrade Button)
   ├─ Upgrade_Marketing
   ├─ Upgrade_PitCrew
   ├─ Upgrade_Driver0
   └─ Upgrade_Driver1
```

### ✅ Checkpoint da Fase 5
- O saldo sobe com patrocínio, voltas, ultrapassagens e chegada.
- Cada compra tem efeito visível na mesma corrida.
- Ao fim da corrida, todos os botões ficam cinza (não se compra depois da bandeirada).

#### Problemas comuns
- **Os botões nunca acendem:** `PlayerTeam` está nulo. Confira se `Team_Player` está no campo **Player Team** do `RaceTestStarter` (é ele que marca `isPlayer = true`).
- **O painel não cabe na tela:** a soma das **Preferred Height** passou de 1080. Diminua a da `StandingsText` ou a fonte dela.
- **`NullReferenceException` no `MoneyFeed`:** o `RaceRunner.cs` ainda é a versão da Fase 3, sem `Economy`. Substitua-o pela versão desta fase.

Próxima fase: **IA das equipes rivais** — as rivais também compram e vão ao box.

---

# Parte 9 — Implementação Unity: Fase 6 (IA das equipes rivais)

## Fase 6 — IA das equipes rivais

> Objetivo desta fase: as 6 equipes rivais investem e fazem pit stop sozinhas, cada uma com sua personalidade.

**Conceitos novos:**
- **`System.Random` vs. `UnityEngine.Random`:** o `UnityEngine.Random` é global (qualquer script mexe na mesma sequência). Um `System.Random` próprio, criado com uma semente, dá à IA uma sequência só dela, que pode ser repetida nos testes.
- **Sorteio ponderado:** cada opção tem um peso; uma opção de peso 3 sai três vezes mais que uma de peso 1. É assim que a "personalidade" vira comportamento.
- **Decidir em intervalos:** a IA pensa a cada 2 segundos, e não a cada frame. É mais barato e mais parecido com uma equipe de verdade.

### Etapa 6A — Box e compras da IA

Crie em `Assets/_Project/Scripts/Game/`:

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

Ligue a IA no `RaceRunner.cs`, com três acréscimos:

```csharp
// 1) Junto dos outros campos privados (abaixo de "_markers"):
private RivalAI _rivalAI;

// 2) Em StartRace, logo depois de "Economy = new RaceEconomy(Sim, _balance);":
_rivalAI = new RivalAI(Sim, Upgrades, _balance, Environment.TickCount + 1);

// 3) No laço do Update, logo depois de "Economy.Tick(step);":
_rivalAI.Tick(step);
```

Para ver as compras acontecendo, coloque temporariamente esta linha em `RivalAI.DecideSpending`, logo depois do `_upgrades.TryBuy(...)`:

```csharp
Debug.Log($"{team.teamId} comprou {type} (saldo {team.money})");
```

#### 🧪 Teste rápido
Aperte ▶ com **Time Scale** `4`. O Console mostra compras das rivais ao longo da corrida. Na tabela, carros rivais aparecem com `BOX`, quase sempre perto da metade da prova e nunca na última volta. Remova o `Debug.Log` depois do teste.

### Etapa 6B — Personalidades

Nos assets `Team_Rival*`, preencha a seção **IA (ignorado na equipe do jogador)**. Sugestão de partida:

| Asset | Perfil | Ai Spend Eagerness | Pesos Eng / Mkt / Pit / Driver | Ai Pit Wear Threshold |
|---|---|---|---|---|
| `Team_Rival1` | fábrica rica | 0.9 | 3 / 1 / 1 / 1 | 0.70 |
| `Team_Rival2` | marqueteira | 0.6 | 1 / 3 / 0.5 / 1 | 0.80 |
| `Team_Rival3` | dos boxes | 0.5 | 1 / 1 / 3 / 1 | 0.75 |
| `Team_Rival4` | dos pilotos | 0.5 | 1 / 0.5 / 1 / 3 | 0.75 |
| `Team_Rival5` | cautelosa | 0.2 | 1 / 1 / 1 / 1 | 0.65 |
| `Team_Rival6` | equilibrada | 0.5 | 1 / 1 / 1 / 1 | 0.75 |

#### 🧪 Teste rápido
Com o `Debug.Log` da 6A de volta por um momento: a `rival_1` compra quase só `Engineering` e logo; a `rival_5` compra pouco e tarde.

### ✅ Checkpoint da Fase 6
- As rivais fazem pit stop sozinhas e compram melhorias durante a corrida.
- A rival "fábrica rica" fica mais rápida ao longo da corrida; sem investir nada, a equipe do jogador perde terreno.

#### Problemas comuns
- **Nenhum rival vai ao box:** com corridas curtas, o pneu Médio de largada aguenta até o fim e a IA, corretamente, não para. Aumente as voltas da pista ou o `wearPerSecond`.
- **Um rival compra demais logo na largada:** todos começam com o mesmo `startingMoney`. Dê a ele `aiSpendEagerness` menor ou níveis iniciais maiores (o que encarece o próximo nível).

Próxima fase: **Campeonato e save** — 3 etapas, pontos e progresso salvo.

---

# Parte 10 — Implementação Unity: Fase 7 (Campeonato e save local)

## Fase 7 — Campeonato e save local

> Objetivo desta fase: jogar as 3 etapas em sequência, com pontos, tela entre corridas e progresso salvo ao fechar o jogo.

**Conceitos novos:**
- **JSON e `JsonUtility`:** JSON é um formato de texto para dados (`{"money":300,"points":25}`). `JsonUtility.ToJson(objeto)` converte um objeto `[Serializable]` em texto, e `FromJson` faz o caminho de volta. Ele só salva campos públicos de tipos simples, arrays e `List`; referências a assets não entram (por isso o `[NonSerialized] Definition` do `TeamState`).
- **`PlayerPrefs`:** armazenamento de chave/valor da Unity. Funciona igual nas três plataformas: registro do Windows no PC, arquivo de preferências no Android e IndexedDB do navegador no WebGL. É o caminho mais simples para um save pequeno como este (poucos KB).
- **Classe `static`:** uma classe que não se instancia (`SaveService.Save(...)` direto). Serve para utilitários sem estado próprio.
- **`Action` e lambda:** `Action` é "uma função guardada numa variável". `() => _onContinue?.Invoke()` é uma **lambda**, uma função escrita no próprio lugar onde é usada.
- **`SetActive(true/false)`:** liga ou desliga um GameObject inteiro (e todos os filhos). Desligado, ele não aparece e seus scripts param de receber `Update`.
- **Coroutine:** função que pode esperar no meio (`yield return new WaitForSeconds(2f)`) sem travar o jogo. É iniciada com `StartCoroutine(...)`.

### Etapa 7A — Dados do campeonato e save

Crie em `Assets/_Project/Scripts/Data/`:

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

Crie em `Assets/_Project/Scripts/Game/`:

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
        public const string DefaultKey = "paddockboss.save";

        // Chave do PlayerPrefs onde o save fica. Os testes automáticos (Fase 9)
        // trocam por outra, para não apagar o save de quem está jogando no Editor.
        public static string Key { get; set; } = DefaultKey;

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

Criar o asset:
1. Em `Data/`: **Create → Paddock Boss → Championship** → `Championship`.
2. **Player Team** = `Team_Player`.
3. **Rival Teams:** trave o Inspector (🔒), selecione as 6 rivais na Project e arraste todas sobre o título **Rival Teams**. Destrave.
4. **Tracks:** clique em **+** três vezes e arraste `Track_A`, `Track_B` e `Track_C`, nessa ordem.

#### 🧪 Teste rápido
O Console não tem erros e o asset `Championship` mostra 6 rivais e 3 pistas. O save só entra em uso na 7C.

### Etapa 7B — A tela da temporada

Crie em `Assets/_Project/Scripts/UI/`:

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

Montar a tela, clique a clique:
1. Botão direito em `Canvas` → **UI → Panel** → `SeasonPanel`. O Panel já nasce ocupando o Canvas inteiro. **Image → Color** = `#101418`, alfa `245`.
2. Na Hierarchy, garanta que `SeasonPanel` é o **último filho** do `Canvas`. A UI é desenhada na ordem da Hierarchy, então o último fica por cima de tudo.
3. **Title:** botão direito em `SeasonPanel` → **UI → Text - TextMeshPro** → `Title`. Âncoras: **Shift + Alt** + clique em *top / stretch* (linha de cima, coluna da direita). **Height** = `120`, **Left**/**Right** = `0`. **Font Size** `56`, negrito, alinhamento centralizado.
4. **Results:** botão direito em `SeasonPanel` → **UI → Text - TextMeshPro** → `Results`. No Rect Transform, abra **Anchors** e digite **Min** (0.05, 0.18) e **Max** (0.48, 0.85); depois **Left**, **Top**, **Right**, **Bottom** = `0`. **Font Size** `24`, alinhamento topo/esquerda.
5. **Standings:** igual ao `Results`, com **Min** (0.52, 0.18) e **Max** (0.95, 0.85).
6. **Botão:** botão direito em `SeasonPanel` → **UI → Button - TextMeshPro** → `ContinueButton`. Âncoras: **Shift + Alt** + *bottom / center*. **Width** `420`, **Height** `100`, **Pos Y** `40`. Renomeie o texto filho para `ContinueLabel`: texto `Largar`, **Font Size** `36`, negrito.
7. Selecione `SeasonPanel`. **Add Component → Season Panel** e ligue **Title Text**, **Results Text**, **Standings Text**, **Continue Button** e **Continue Label**.

#### 🧪 Teste rápido
Sem Play, a Game view mostra a tela escura por cima de tudo, com o título no topo, duas colunas de texto e o botão embaixo. Ela só ganha conteúdo na 7C.

### Etapa 7C — O fluxo completo

Crie em `Assets/_Project/Scripts/Game/`:

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

Montar:
1. Selecione `RaceRunner` e **desmarque** a caixinha do componente **Race Test Starter** (desativa sem apagar; útil para testes isolados de corrida no futuro). Volte o **Time Scale** do Race Runner para `1`.
2. Botão direito em `[Systems]` → **Create Empty** → `GameSession`. **Add Component → Game Session**:
   - **Definition** = `Championship`.
   - **Runner** = `RaceRunner`.
   - **Season Panel** = `SeasonPanel`.
   - **Race Hud** = `SidePanel`.
3. **Ctrl+S**.

> **Apagar o save durante os testes:** **Edit → Clear All PlayerPrefs**.

#### 🧪 Teste rápido
1. Aperte ▶: aparece `Etapa 1/3: <pista A>` com todas as equipes em 0 pts. Clique **Largar**: o painel lateral aparece e a corrida começa.
2. 2 s depois da bandeirada, a tela mostra o resultado com os pontos e a classificação. **Largar** vai para a pista B, com o dinheiro e os níveis mantidos.
3. Pare o Play entre a etapa 1 e a 2 e aperte ▶ de novo: o jogo volta em `Etapa 2/3`, com os mesmos pontos, dinheiro e níveis.
4. Pare o Play **no meio** de uma corrida e volte: ela recomeça do estado de antes da largada.
5. Depois da etapa 3: `Fim da temporada`; **Nova temporada** zera tudo.

**Hierarchy esperada ao fim da Fase 7:**

```
Main
├─ Main Camera
├─ EventSystem
├─ [Systems]
│  ├─ RaceRunner        (Race Runner, Race Test Starter desativado)
│  └─ GameSession       (Game Session)
├─ [World]
│  ├─ Track
│  ├─ StartLine
│  └─ Cars
└─ [UI]
   └─ Canvas
      ├─ SidePanel      (Race HUD) → LapText, StandingsText, MoneyPanel, PitPanel, InvestPanel
      └─ SeasonPanel    (Season Panel) → Title, Results, Standings, ContinueButton
```

### ✅ Checkpoint da Fase 7
- As 3 etapas rodam em sequência, com pontos somados e dinheiro/níveis mantidos.
- O progresso sobrevive a sair do Play entre corridas.

#### Problemas comuns
- **O jogo sempre recomeça do zero:** veja se o Console mostra "Save com equipe desconhecida": algum `teamId` mudou ou está repetido.
- **Os botões do HUD não respondem depois da primeira corrida:** algum script do HUD se inscreveu num evento no `Awake` (que roda uma vez) em vez do `OnEnable`. Siga o padrão do `CarPitControls`.
- **O HUD aparece por cima da tela da temporada:** o `SeasonPanel` não é o último filho do Canvas.

Próxima fase: **Layout multiplataforma e arte** — a mesma tela funcionando em monitor, celular e navegador.

---

# Parte 11 — Implementação Unity: Fase 8 (Layout multiplataforma e arte)

## Fase 8 — Layout multiplataforma e arte

> Objetivo desta fase: a tela se adapta a qualquer resolução (monitor, celular com notch, janela do navegador), a pista sempre cabe no espaço livre à esquerda do painel, e os placeholders viram arte flat vector.

A orientação no mobile está **Em aberto** (Parte 1 §10). Este guia usa **paisagem**, a mesma tela do PC e do WebGL. O Canvas já escala desde a Fase 3 (Canvas Scaler em 1920×1080).

**Conceitos novos:**
- **Área segura (`Screen.safeArea`):** o retângulo da tela livre de notch, câmera frontal e cantos arredondados. Fora dele, botões podem ficar escondidos.
- **Matemática da câmera ortográfica:** **Size** é metade da altura visível em unidades; a largura visível é `altura × aspect` (`aspect` = largura ÷ altura da tela).
- **Pixels Per Unit (PPU):** quantos pixels de uma imagem cabem em 1 unidade do mundo. Define o tamanho de um sprite na cena.
- **Device Simulator:** janela que simula celulares específicos (resolução, notch, área segura) dentro do Editor.

### Etapa 8A — Área segura

Crie em `Assets/_Project/Scripts/UI/`:

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

1. Botão direito em `Canvas` → **Create Empty** → `SafeArea`. Âncoras: **Alt** + *stretch / stretch*; **Left**, **Top**, **Right**, **Bottom** = `0`.
2. **Add Component → Safe Area Fitter**.
3. Arraste `SidePanel` e depois `SeasonPanel` para dentro de `SafeArea`, nessa ordem (o `SeasonPanel` continua sendo o último). Confira que o `SidePanel` continua ancorado à direita.

#### 🧪 Teste rápido
**Window → General → Device Simulator**. Escolha um celular com notch (ex.: um iPhone recente ou Pixel) e gire para paisagem (botão de rotação). Aperte ▶: o painel lateral e o botão da tela da temporada ficam fora da área do notch.

### Etapa 8B — A pista sempre cabe

Crie em `Assets/_Project/Scripts/UI/`:

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

1. Selecione `Main Camera`. Volte **Position X** para `0` (o ajuste manual da Fase 3 não é mais necessário).
2. **Add Component → Track Camera Fit** → **Track** = `Track`. **Right Panel Fraction** = `0.34` (640 de 1920 pixels).

#### 🧪 Teste rápido
Aperte ▶ e largue uma corrida. Troque a resolução da Game view entre `Full HD (1920x1080)`, `2560x1080` (crie com **+**) e o Device Simulator em paisagem: a pista sempre aparece inteira à esquerda, sem ficar por baixo do painel. Nas etapas seguintes, pistas de tamanhos diferentes também são reenquadradas.

### Etapa 8C — Arte flat vector

A arte segue a Parte 1 §9 (flat vector minimalista; paleta e identidade das equipes **Em aberto**). Assets mínimos do MVP:

| Asset | Observação |
|---|---|
| Ícone do carro visto de cima | **Branco**, apontando para cima, fundo transparente: o `SpriteRenderer` tinge com a cor da equipe |
| Contorno de destaque do jogador | Mesmo formato do carro, só o contorno |
| Linha de largada | Faixa quadriculada |
| Fundo do mapa | Liso ou com textura sutil; nada que dispute atenção com os carros |
| Painéis e botões da UI | Cantos arredondados, cores chapadas |

- Se gerar com o SpriteCook, siga as skills `spritecook-*` do repositório e guarde os `asset_id` num manifesto em `Sprites/PaddockBoss/`, como já é feito em `Sprites/Rally2D/`.

Importar e trocar o carro:
1. Arraste os PNGs para `Assets/_Project/Sprites/`.
2. Clique no PNG do carro. No Inspector: **Texture Type** = `Sprite (2D and UI)`, **Sprite Mode** = `Single`, **Pixels Per Unit** = altura da imagem ÷ 0.8 (ex.: 256 px → `320`), para o carro ter 0.8 unidade de comprimento. **Apply**.
3. Dê duplo clique no prefab `Prefabs/CarMarker` (abre o modo de edição de prefab). Em `Body`, troque **Sprite** pelo carro e volte **Scale** para (1, 1, 1). Em `Highlight`, troque pelo contorno, também com escala 1. Saia pela seta **<** no topo da Hierarchy; o prefab salva sozinho.
4. Linha de largada: no `StartLine`, troque **Sprite** pela faixa quadriculada e ajuste a escala.
5. Botões e painéis: no `Image` de cada um, troque **Source Image**. Para sprites de UI com cantos arredondados, abra o **Sprite Editor** do PNG e defina as bordas (**Border**), e use **Image Type** = `Sliced`, para o canto não esticar.
6. Fonte: **Window → TextMeshPro → Font Asset Creator** → **Source Font File** = a fonte TTF da identidade, **Character Set** = `Extended ASCII` (cobre é, ã, ç) → **Generate Font Atlas** → **Save**. Troque o **Font Asset** dos textos.

#### 🧪 Teste rápido
Aperte ▶: cada carro aparece com o ícone novo, tingido com a cor da sua equipe e com o tamanho parecido com o das cápsulas. Os acentos dos nomes aparecem corretamente.

### ✅ Checkpoint da Fase 8
- A pista sempre cabe no espaço livre em 16:9, 21:9 e no celular em paisagem.
- Nada de UI fica sob o notch no Device Simulator.
- Os placeholders (cápsulas e quadrado) foram substituídos pela arte.

#### Problemas comuns
- **A pista fica por baixo do painel:** **Right Panel Fraction** menor que a largura real do painel. Aumente até sobrar uma margem.
- **Os carros ficaram enormes ou minúsculos com o sprite novo:** é o **Pixels Per Unit** da importação, não a escala do prefab.
- **Quadrados no lugar de letras acentuadas:** o Font Asset foi gerado só com ASCII. Gere de novo com `Extended ASCII`.

Próxima fase: **Testes automáticos** — proteger as regras do jogo antes de mexer no balanceamento.

---

# Parte 12 — Implementação Unity: Fase 9 (Testes automáticos)

## Fase 9 — Testes automáticos

> Objetivo desta fase: uma bateria de testes que roda em segundos no Editor e confirma que pista, corrida, compras, economia e campeonato continuam funcionando depois de qualquer mudança.

**Conceitos novos:**
- **Test Framework e NUnit:** a Unity roda testes escritos com a biblioteca NUnit. Um teste é um método marcado com `[Test]`, que monta uma situação e verifica o resultado com `Assert` (ex.: `Assert.AreEqual(esperado, real)`). Se alguma verificação falha, o teste fica vermelho e mostra o motivo.
- **Edit Mode vs. Play Mode:** testes **Edit Mode** rodam sem cena e sem apertar Play, e são instantâneos. Servem para as classes C# puras (que são quase todas as regras deste jogo, graças à "regra de ouro" da Parte 2). Testes **Play Mode** abrem uma cena; não são necessários aqui.
- **`[SetUp]` e `[TearDown]`:** métodos que rodam antes e depois de **cada** teste, para preparar e limpar.
- **Assembly Definition (asmdef):** um arquivo que agrupa os scripts de uma pasta numa "assembly" (uma DLL) separada. Os testes ficam numa assembly própria, que **referencia** a do jogo. Sem asmdef, os scripts do jogo ficam na assembly padrão `Assembly-CSharp`, que outras assemblies não conseguem referenciar.
- **Testes sem bagunçar o save:** os testes do campeonato gravam em outra chave do PlayerPrefs (`SaveService.Key`) e apagam tudo no fim, para não destruir o save de quem está jogando no Editor.

### Etapa 9A — Assemblies

1. **Assembly do jogo:** na Project, entre em `Assets/_Project/Scripts/`. Botão direito → **Create → Scripting → Assembly Definition** → nome `PaddockBoss`.
   - Clique no asset. Em **Assembly Definition References**, clique **+** duas vezes e escolha `Unity.TextMeshPro` e `UnityEngine.UI` (os scripts de UI usam os dois).
   - **Apply** no fim do Inspector. Espere compilar: o Console não pode ter erros. Se aparecer `The type or namespace name 'TMPro' could not be found`, faltou uma das referências.
2. **Assembly dos testes:** entre em `Assets/_Project/`. Botão direito → **Create → Testing → Tests Assembly Folder**. A Unity cria a pasta `Tests` com um asmdef dentro.
   - Renomeie o asmdef para `PaddockBoss.Tests` e, no Inspector, ponha `PaddockBoss.Tests` também no campo **Name**.
   - **Platforms:** desmarque **Any Platform** e deixe marcado só **Editor** (testes Edit Mode).
   - **Assembly Definition References:** **+** → `PaddockBoss`.
   - **Apply**.

#### 🧪 Teste rápido
O Console não tem erros e o jogo continua funcionando ao apertar ▶ (a mudança de assembly não altera comportamento).

### Etapa 9B — Os testes

Crie os arquivos abaixo em `Assets/_Project/Tests/` (botão direito → **Create → Scripting → Empty C# Script**, como sempre).

```csharp
// Caminho: Assets/_Project/Tests/TestData.cs
using System.Collections.Generic;
using PaddockBoss.Data;
using PaddockBoss.Game;
using UnityEngine;

namespace PaddockBoss.Tests
{
    // POR QUE: todos os testes precisam de balanceamento, pistas e equipes. Criar
    // isso à mão em cada teste repetiria código e esconderia o que cada teste
    // quer provar.
    // ESTRATÉGIA: ScriptableObject.CreateInstance cria o "asset" só na memória,
    // sem arquivo, com os mesmos valores padrão de um asset novo (os da Parte 1
    // §14). A pista de teste é um quadrado de lado 10 (volta = 40 unidades).
    public static class TestData
    {
        // Balanceamento com os valores padrão.
        public static GameBalance Balance() => ScriptableObject.CreateInstance<GameBalance>();

        // Pista quadrada de 4 waypoints.
        public static TrackDefinition SquareTrack(int laps = 3)
        {
            var track = ScriptableObject.CreateInstance<TrackDefinition>();
            track.trackId = "test";
            track.displayName = "Teste";
            track.laps = laps;
            track.waypoints = new[] { new Vector2(0, 0), new Vector2(10, 0), new Vector2(10, 10), new Vector2(0, 10) };
            return track;
        }

        // Equipe com id e nível de engenharia escolhidos.
        public static TeamDefinition Team(string id, int engineering = 0)
        {
            var team = ScriptableObject.CreateInstance<TeamDefinition>();
            team.teamId = id;
            team.displayName = id;
            team.shortName = id;
            team.engineering = engineering;
            team.driverNames = new[] { id + "_A", id + "_B" };
            return team;
        }

        // Estados das equipes; a primeira da lista é a do jogador.
        public static List<TeamState> Teams(GameBalance balance, params TeamDefinition[] definitions)
        {
            var teams = new List<TeamState>();
            for (int i = 0; i < definitions.Length; i++)
                teams.Add(TeamState.Create(definitions[i], i == 0, balance.startingMoney));
            return teams;
        }

        // Roda a corrida até o fim. O limite de passos impede que um bug (carro
        // parado para sempre) trave o Editor.
        public static void RunToEnd(RaceSimulator sim, float step = 0.05f, int maxSteps = 200000)
        {
            for (int i = 0; i < maxSteps && !sim.IsFinished; i++) sim.Tick(step);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/TrackPathTests.cs
using System;
using NUnit.Framework;
using PaddockBoss.Game;
using UnityEngine;

namespace PaddockBoss.Tests
{
    // POR QUE: toda a corrida depende de a pista responder certo "onde fica a
    // distância X" e "quão fechada é a curva ali".
    // ESTRATÉGIA: usa o quadrado de lado 10, onde as respostas certas dá para
    // calcular de cabeça.
    public class TrackPathTests
    {
        // Cria o quadrado com os parâmetros padrão de curva.
        private static TrackPath Square() => new(TestData.SquareTrack().waypoints, 15f, 4f);

        // O comprimento da volta é o perímetro do quadrado.
        [Test]
        public void Length_IsThePerimeter() => Assert.AreEqual(40f, Square().Length, 0.001f);

        // Uma volta a mais cai no mesmo ponto.
        [Test]
        public void PositionAt_WrapsAroundLaps()
        {
            TrackPath path = Square();
            Assert.Less(Vector2.Distance(path.PositionAt(5f), path.PositionAt(45f)), 0.001f);
        }

        // Distância negativa (o grid) fica antes da linha: 2 unidades antes de
        // (0, 0) no último lado, que desce de (0, 10) para (0, 0).
        [Test]
        public void PositionAt_NegativeDistanceIsBehindTheLine()
        {
            Assert.Less(Vector2.Distance(new Vector2(0f, 2f), Square().PositionAt(-2f)), 0.001f);
        }

        // No meio de um lado (longe das quinas) não há curva.
        [Test]
        public void CornerAt_MiddleOfStraightIsZero() => Assert.AreEqual(0f, Square().CornerAt(5f), 0.001f);

        // Na quina, a curva é forte.
        [Test]
        public void CornerAt_OnTheCornerIsHigh() => Assert.Greater(Square().CornerAt(10f), 0.5f);

        // Pista com menos de 3 pontos é rejeitada com uma mensagem clara.
        [Test]
        public void Constructor_RejectsTooFewPoints()
        {
            Assert.Throws<ArgumentException>(() => new TrackPath(new[] { Vector2.zero, Vector2.one }, 15f, 4f));
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/RaceSimulatorTests.cs
using System.Linq;
using NUnit.Framework;
using PaddockBoss.Data;
using PaddockBoss.Game;

namespace PaddockBoss.Tests
{
    // POR QUE: o RaceSimulator é o coração do jogo; um erro nele (volta contada
    // duas vezes, ordem errada) estraga tudo o que vem depois.
    // ESTRATÉGIA: corridas curtas de 3 voltas na pista quadrada, com 2 equipes
    // (4 carros) e semente fixa, para o resultado ser sempre o mesmo.
    public class RaceSimulatorTests
    {
        // Cria uma corrida com as equipes dadas.
        private static RaceSimulator NewRace(GameBalance balance, params TeamDefinition[] teams) =>
            new(TestData.SquareTrack(3), balance, TestData.Teams(balance, teams), seed: 1);

        // A corrida termina, e todo carro completa todas as voltas.
        [Test]
        public void Race_FinishesWithEveryCarCompletingAllLaps()
        {
            RaceSimulator sim = NewRace(TestData.Balance(), TestData.Team("a"), TestData.Team("b"));
            TestData.RunToEnd(sim);

            Assert.IsTrue(sim.IsFinished);
            foreach (CarState car in sim.Cars)
            {
                Assert.IsTrue(car.Finished);
                Assert.AreEqual(3, car.LapsCompleted);
            }
        }

        // As posições são sempre 1, 2, 3, 4, sem repetir nem pular.
        [Test]
        public void Standings_PositionsAreOneToN()
        {
            RaceSimulator sim = NewRace(TestData.Balance(), TestData.Team("a"), TestData.Team("b"));
            for (int i = 0; i < 200; i++) sim.Tick(0.05f);
            CollectionAssert.AreEqual(new[] { 1, 2, 3, 4 }, sim.Standings.Select(c => c.Position).ToArray());
        }

        // Na tabela final, quem chegou antes está na frente.
        [Test]
        public void Standings_AfterTheRaceAreOrderedByFinishTime()
        {
            RaceSimulator sim = NewRace(TestData.Balance(), TestData.Team("a"), TestData.Team("b"));
            TestData.RunToEnd(sim);
            for (int i = 1; i < sim.Standings.Count; i++)
                Assert.LessOrEqual(sim.Standings[i - 1].FinishTime, sim.Standings[i].FinishTime);
        }

        // Muita engenharia (+40% de velocidade) garante os dois primeiros lugares.
        [Test]
        public void Engineering_MakesTheTeamFaster()
        {
            RaceSimulator sim = NewRace(TestData.Balance(), TestData.Team("slow"), TestData.Team("fast", engineering: 20));
            TestData.RunToEnd(sim);
            Assert.AreEqual("fast", sim.Standings[0].Team.teamId);
            Assert.AreEqual("fast", sim.Standings[1].Team.teamId);
        }

        // LapCompleted dispara em toda volta menos a última (que é a chegada).
        [Test]
        public void LapCompleted_FiresForEveryLapExceptTheFinish()
        {
            RaceSimulator sim = NewRace(TestData.Balance(), TestData.Team("a"), TestData.Team("b"));
            int laps = 0;
            sim.LapCompleted += _ => laps++;
            TestData.RunToEnd(sim);
            Assert.AreEqual(4 * (3 - 1), laps);
        }

        // O pit stop troca o composto e devolve o pneu novo.
        [Test]
        public void PitStop_ChangesCompoundAndResetsWear()
        {
            RaceSimulator sim = NewRace(TestData.Balance(), TestData.Team("a"), TestData.Team("b"));
            CarState car = sim.Cars[0];
            sim.RequestPit(car, TireCompound.Soft);
            for (int i = 0; i < 100000 && car.PitStops == 0; i++) sim.Tick(0.05f);

            Assert.AreEqual(1, car.PitStops);
            Assert.AreEqual(TireCompound.Soft, car.Compound);
            Assert.AreEqual(0f, car.TireWear, 0.001f);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/UpgradeServiceTests.cs
using NUnit.Framework;
using PaddockBoss.Data;
using PaddockBoss.Game;

namespace PaddockBoss.Tests
{
    // POR QUE: a compra é a ação principal do jogador; custo errado ou compra
    // "de graça" quebram a economia inteira.
    // ESTRATÉGIA: uma equipe com bastante dinheiro, recriada antes de cada teste
    // pelo [SetUp], para um teste não afetar o outro.
    public class UpgradeServiceTests
    {
        private GameBalance _balance;
        private UpgradeService _upgrades;
        private TeamState _team;

        // Prepara balanceamento, serviço e equipe novos para cada teste.
        [SetUp]
        public void SetUp()
        {
            _balance = TestData.Balance();
            _upgrades = new UpgradeService(_balance);
            _team = TeamState.Create(TestData.Team("a"), true, 10000);
        }

        // Propaganda: 120 no nível 0; 120 × 1,4 = 168 no nível 1.
        [Test]
        public void Cost_GrowsByTheGrowthFactor()
        {
            Assert.AreEqual(120, _upgrades.GetCost(_team, UpgradeType.Marketing));
            _upgrades.TryBuy(_team, UpgradeType.Marketing);
            Assert.AreEqual(168, _upgrades.GetCost(_team, UpgradeType.Marketing));
        }

        // Comprar desconta o custo e sobe um nível.
        [Test]
        public void TryBuy_SpendsMoneyAndRaisesTheLevel()
        {
            Assert.IsTrue(_upgrades.TryBuy(_team, UpgradeType.Engineering));
            Assert.AreEqual(10000 - 150, _team.money);
            Assert.AreEqual(1, _team.engineering);
        }

        // Sem dinheiro, nada muda.
        [Test]
        public void TryBuy_WithoutMoney_ChangesNothing()
        {
            _team.money = 10;
            Assert.IsFalse(_upgrades.TryBuy(_team, UpgradeType.PitCrew));
            Assert.AreEqual(10, _team.money);
            Assert.AreEqual(0, _team.pitCrew);
        }

        // No nível máximo, não compra mais.
        [Test]
        public void TryBuy_AtMaxLevel_Fails()
        {
            _team.engineering = _balance.maxLevel;
            Assert.IsTrue(_upgrades.IsMaxed(_team, UpgradeType.Engineering));
            Assert.IsFalse(_upgrades.TryBuy(_team, UpgradeType.Engineering));
        }

        // Treinar o piloto 2 não mexe no piloto 1.
        [Test]
        public void DriverTraining_OnlyAffectsTheChosenDriver()
        {
            _upgrades.TryBuy(_team, UpgradeType.DriverTraining, 1);
            Assert.AreEqual(0, _team.driverSkill[0]);
            Assert.AreEqual(1, _team.driverSkill[1]);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/RaceEconomyTests.cs
using NUnit.Framework;
using PaddockBoss.Game;

namespace PaddockBoss.Tests
{
    // POR QUE: o dinheiro é o que liga a corrida aos investimentos.
    // ESTRATÉGIA: confere a fórmula de patrocínio, o "cofrinho" de frações e se
    // os eventos da corrida viram dinheiro.
    public class RaceEconomyTests
    {
        // Corrida de 2 equipes com economia já ouvindo a simulação.
        private static (RaceSimulator sim, RaceEconomy economy) NewRace()
        {
            var balance = TestData.Balance();
            var sim = new RaceSimulator(TestData.SquareTrack(3), balance,
                TestData.Teams(balance, TestData.Team("a"), TestData.Team("b")), seed: 1);
            return (sim, new RaceEconomy(sim, balance));
        }

        // Propaganda nível 2: 2 × (1 + 2 × 0,15) = 2,6 por segundo.
        [Test]
        public void SponsorPerSecond_GrowsWithMarketing()
        {
            var (sim, economy) = NewRace();
            TeamState team = sim.Cars[0].Team;
            team.marketing = 2;
            Assert.AreEqual(2.6f, economy.SponsorPerSecond(team), 0.0001f);
        }

        // 0,25 s rende 0,5 (fica no cofrinho); mais 0,25 s completa 1.
        [Test]
        public void Tick_PaysOnlyWholeUnits()
        {
            var (sim, economy) = NewRace();
            TeamState team = sim.Cars[0].Team;
            int start = team.money;
            economy.Tick(0.25f);
            Assert.AreEqual(start, team.money);
            economy.Tick(0.25f);
            Assert.AreEqual(start + 1, team.money);
        }

        // Ao fim da corrida, toda equipe recebeu bônus de volta e prêmio.
        [Test]
        public void FinishedRace_PaysEveryTeam()
        {
            var (sim, _) = NewRace();
            int start = sim.Cars[0].Team.money;
            TestData.RunToEnd(sim);
            foreach (CarState car in sim.Cars) Assert.Greater(car.Team.money, start);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/ChampionshipTests.cs
using NUnit.Framework;
using PaddockBoss.Data;
using PaddockBoss.Game;
using UnityEngine;

namespace PaddockBoss.Tests
{
    // POR QUE: pontos e save são o progresso de longo prazo; perder o save é o
    // pior bug possível para o jogador.
    // ESTRATÉGIA: troca a chave do save antes de cada teste e apaga tudo depois,
    // para nunca tocar no save real do Editor.
    public class ChampionshipTests
    {
        private GameBalance _balance;
        private ChampionshipDefinition _definition;

        // Save isolado e um campeonato de 3 equipes e 3 pistas.
        [SetUp]
        public void SetUp()
        {
            SaveService.Key = "paddockboss.tests";
            SaveService.Delete();
            _balance = TestData.Balance();
            _definition = ScriptableObject.CreateInstance<ChampionshipDefinition>();
            _definition.playerTeam = TestData.Team("player");
            _definition.rivalTeams = new[] { TestData.Team("r1"), TestData.Team("r2") };
            _definition.tracks = new[] { TestData.SquareTrack(), TestData.SquareTrack(), TestData.SquareTrack() };
        }

        // Apaga o save de teste e devolve a chave original.
        [TearDown]
        public void TearDown()
        {
            SaveService.Delete();
            SaveService.Key = SaveService.DefaultKey;
        }

        // Campeonato novo: jogador primeiro, todos com o dinheiro inicial, etapa 1.
        [Test]
        public void CreateNew_StartsAtRaceOneWithStartingMoney()
        {
            Championship season = Championship.CreateNew(_definition, _balance);
            Assert.AreEqual(3, season.Teams.Count);
            Assert.IsTrue(season.Teams[0].isPlayer);
            foreach (TeamState team in season.Teams) Assert.AreEqual(_balance.startingMoney, team.money);
            Assert.AreEqual(1, season.RaceNumber);
        }

        // P1 soma 25, P2 soma 18, e o campeonato avança.
        [Test]
        public void RecordResult_AddsPointsAndAdvances()
        {
            Championship season = Championship.CreateNew(_definition, _balance);
            var winner = new CarState(0, season.Teams[1], 0, 0f) { Position = 1 };
            var second = new CarState(1, season.Teams[0], 0, 0f) { Position = 2 };
            season.RecordResult(new[] { winner, second });

            Assert.AreEqual(25, season.Teams[1].points);
            Assert.AreEqual(18, season.Teams[0].points);
            Assert.AreEqual(2, season.RaceNumber);
        }

        // Fechar e abrir o jogo mantém etapa, dinheiro e o vínculo com os assets.
        [Test]
        public void LoadOrCreate_RestoresSavedProgress()
        {
            Championship season = Championship.CreateNew(_definition, _balance);
            season.Teams[0].money = 999;
            season.RecordResult(new CarState[0]);

            Championship loaded = Championship.LoadOrCreate(_definition, _balance);
            Assert.AreEqual(2, loaded.RaceNumber);
            Assert.AreEqual(999, loaded.Teams[0].money);
            Assert.AreSame(_definition.playerTeam, loaded.Teams[0].Definition);
        }

        // Se uma equipe do save não existe mais, recomeça em vez de quebrar.
        [Test]
        public void LoadOrCreate_WithUnknownTeam_StartsOver()
        {
            Championship.CreateNew(_definition, _balance).RecordResult(new CarState[0]);
            _definition.rivalTeams[1] = TestData.Team("other");

            Championship loaded = Championship.LoadOrCreate(_definition, _balance);
            Assert.AreEqual(1, loaded.RaceNumber);
        }

        // Depois da última etapa, o campeonato acabou.
        [Test]
        public void IsOver_AfterTheLastRace()
        {
            Championship season = Championship.CreateNew(_definition, _balance);
            for (int i = 0; i < 3; i++) season.RecordResult(new CarState[0]);
            Assert.IsTrue(season.IsOver);
            Assert.IsNull(season.NextTrack);
        }
    }
}
```

### Etapa 9C — Rodar

1. **Window → General → Test Runner**.
2. Aba **EditMode** → **Run All**.

#### 🧪 Teste rápido
A árvore mostra `PaddockBoss.Tests` com 5 classes e 25 testes, todos com ✓ verde em poucos segundos. Para ver um teste falhando de propósito, mude temporariamente `engineeringBonusPerLevel` padrão no `GameBalance.cs` para `0f` e rode de novo: `Engineering_MakesTheTeamFaster` fica vermelho. Desfaça a mudança.

### ✅ Checkpoint da Fase 9
- Os 25 testes passam.
- O save do jogo no Editor continua intacto depois de rodar os testes (aperte ▶ e confira a etapa atual).
- Daqui em diante, rode **Run All** antes de cada commit que mexa em `Scripts/Game/` ou no `GameBalance`.

#### Problemas comuns
- **O Test Runner não mostra nenhum teste:** o asmdef de testes não referencia `PaddockBoss`, ou está com **Any Platform** marcado em vez de só **Editor**.
- **`The type or namespace name 'PaddockBoss' could not be found` nos testes:** o asmdef `PaddockBoss` não existe em `Scripts/` (Etapa 9A, passo 1).
- **`Engineering_MakesTheTeamFaster` falha depois de mudar o balanceamento:** o teste assume que 20 níveis de engenharia dão uma vantagem enorme. Se você reduziu muito `engineeringBonusPerLevel`, a falha é real: o investimento deixou de fazer diferença.

Próxima fase: **Build e próximos passos**.

---

# Parte 13 — Implementação Unity: Fase 10 (Build e Próximos Passos)

## Fase 10 — Build e Próximos Passos

> Objetivo desta fase: gerar builds jogáveis de PC, Android e WebGL a partir do mesmo projeto.

**Conceitos novos:**
- **Build Profile:** no Unity 6, cada plataforma de destino tem um perfil (**File → Build Profiles**). **Switch Platform** converte os assets para aquela plataforma (pode demorar na primeira vez).
- **Player Settings:** configurações do executável (nome, ícone, orientação, identificador do app), em **Edit → Project Settings → Player**, com uma aba por plataforma.
- **IL2CPP:** converte o C# em C++ antes de compilar. É obrigatório para Android ARM64 e iOS e costuma deixar o jogo mais rápido.

### 10.1 Configurações comuns

1. **File → Build Profiles → Scene List:** deixe marcada só a cena `Main` (a `TrackLab` é ferramenta de Editor e fica de fora). Se a `Main` não estiver na lista, clique **Add Open Scenes** com ela aberta.
2. **Edit → Project Settings → Player:** **Company Name** = `MangueByte`, **Product Name** = `Paddock Boss`, **Default Icon** = o ícone do jogo.
3. Aba Android do Player → **Resolution and Presentation → Default Orientation** = `Auto Rotation`, marcando só **Landscape Right** e **Landscape Left** (orientação provisória, ver Fase 8).

### 10.2 PC (Windows)

1. **Build Profiles → Windows** → **Switch Platform** (se não for a atual) → **Build** → escolha `Builds/Windows/`.
2. Abra o `.exe` gerado e jogue uma etapa. Redimensione a janela: a câmera reenquadra (Fase 8).

### 10.3 Android

1. **Build Profiles → Android** → **Switch Platform**.
2. **Player → Other Settings:** **Package Name** = `com.manguebyte.paddockboss`; **Scripting Backend** = `IL2CPP`; **Target Architectures** = só `ARM64` (exigido pela Google Play).
3. No celular: ative **Opções do desenvolvedor** e **Depuração USB**, ligue o cabo e autorize o computador.
4. **Build And Run** → `Builds/Android/`. O jogo abre no celular.
5. Para a loja: marque **Build App Bundle (Google Play)** e configure o keystore (fora do escopo do MVP).
6. iOS: mesmo fluxo em **Build Profiles → iOS**. A Unity gera um projeto Xcode, que precisa ser compilado num Mac.

### 10.4 WebGL

1. **Build Profiles → Web** → **Switch Platform**.
2. **Player → Publishing Settings:** **Compression Format** = `Gzip` e marque **Decompression Fallback**. Assim a build roda em hosts que não configuram os cabeçalhos de compressão (itch.io, GitHub Pages).
3. **Build And Run** → `Builds/WebGL/`. A Unity abre um servidor local no navegador. Abrir o `index.html` direto do disco não funciona.
4. No itch.io: compacte o **conteúdo** da pasta em `.zip`, envie como *HTML* e marque *This file will be played in the browser*.

### ✅ Checkpoint da Fase 10
- As três builds abrem, mostram `Etapa 1/3` e jogam uma corrida inteira.
- Em cada plataforma, fechar o jogo entre etapas e reabrir mantém o progresso (no WebGL, recarregar a página).
- No celular, os botões do painel são grandes o bastante para tocar sem errar.

#### Problemas comuns
- **WebGL fica na tela de carregamento com erro de "Content-Encoding":** faltou **Decompression Fallback**.
- **WebGL perde o save ao recarregar:** o navegador está em modo anônimo ou bloqueia o armazenamento do site. O `PlayerPrefs.Save()` do `SaveService` já força a gravação.
- **Android: "No devices found":** a depuração USB não foi autorizada no celular, ou o cabo só carrega (não transfere dados).

### 10.5 Próximos passos

Em ordem sugerida, cada um ligado a um item **Em aberto** da Parte 1 §15:

1. **Playtest de ritmo:** medir a duração real da corrida e quantas compras o jogador faz por volta; ajustar o `GameBalance` (itens 3 e 6). Rodar os testes da Fase 9 depois de cada ajuste.
2. **Ajuste da IA / rubber band:** verificar se a equipe do jogador consegue sair do fundo do grid em 3 etapas (item 12).
3. **Áudio** (item 15), tutorial e decisão sobre a orientação no mobile (item 14).
4. **Fim de temporada** e investimento entre corridas (itens 1 e 2).

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
