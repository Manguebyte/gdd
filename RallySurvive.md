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
13. [Unity — Fase 6: Menu Principal e Seleção de Pista](#parte-13--implementação-unity-fase-6-menu-principal-e-seleção-de-pista)
14. [Unity — Fase 7: Build e Próximos Passos](#parte-14--implementação-unity-fase-7-build-e-próximos-passos)
15. [Visão Futura: Versão 3D Topdown](#parte-15--visão-futura-versão-3d-topdown)

---

# Parte 1 — GDD Core (Compartilhado)

## GDD Core — Franquia Rally (nome provisório)

> Documento vivo. Tudo aqui é compartilhado pelos 3 jogos: **RallySurvive**, **RallySurvive: Navigation Expert** e **RaceLegenda**.
> Cada jogo tem seu próprio documento de variante, que só descreve o que diverge deste Core.

---

### 1. Visão Geral

- **Gênero:** Corrida / Rally, topdown, pixel art 2D.
- **Pilar de design:** controle tenso e "orgânico" via mouse, onde a distância entre carro e cursor dita a velocidade — cria risco/recompensa constante (quanto mais rápido, mais longe o cursor precisa estar, mais difícil reagir a curvas).
- **Fantasia central:** pilotar no limite, sentindo a frenagem e aceleração através de um feedback visual claro (chevrons), sem HUD pesado de velocímetro (ver Parte 1 §5 — o indicador de velocidade usado é uma barra leve em %, não um velocímetro numérico tradicional).

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

- Modelo simplificado top-down (sem simulação real de física de pneus), com:
  - **Grip (0–1) por zona de terreno**: controla o quão rápido a velocidade real do carro consegue acompanhar a velocidade pedida pelo cursor. Grip 1.0 = resposta quase instantânea (padrão); grip baixo = o carro "carrega" velocidade/direção anteriores por mais tempo antes de obedecer ao cursor — é a derrapagem. Implementação: Parte 8 §1.2/1.5 (`CarController`) e Parte 10 §3.8–3.10 (zonas de terreno).
  - **Definido:** a UI e os chevrons leem fontes diferentes desse sistema — os chevrons refletem a velocidade *pedida* pelo cursor (intenção do jogador, `TargetSpeedNormalized`), a barra de velocidade da HUD reflete a velocidade *real* do carro já filtrada pelo grip (`ActualSpeedNormalized`, ver §5 abaixo). Isso deixa visível quando o carro está derrapando: o jogador pede mais do que o carro consegue entregar.
- Parâmetros por carro (se houver múltiplos carros no futuro): velocidade máxima, aceleração, frenagem, grip base.

### 4. Estilo Visual

- Pixel art 2D, câmera topdown fixa (rotação de câmera a definir: segue o carro ou é fixa por pista?).
- Paleta e ambientação variam por pista/tema (ver documentos de variante).

### 5. HUD / UI Genérica

Comum a todos os jogos:
- Cronômetro (tempo da corrida atual).
- Indicador de posição/checkpoint (formato varia por jogo — ver variantes).
- Chevrons de aceleração/frenagem (sempre visíveis entre carro e cursor).
- **Indicador de velocidade atual:** barra de preenchimento (0–100%), sem número de km/h — mantém o pilar "sem velocímetro pesado" da seção 1, é um indicador leve, não um instrumento realista. Mostra a velocidade **real** do carro (pós-grip, ver §3 acima), não a velocidade pedida pelo cursor — em pista escorregadia a barra fica visivelmente "atrás" do que o jogador está pedindo. Implementação: Parte 11 §4.4.
- **Indicador de % da pista percorrida:** formato varia por jogo. Em traçado fixo (RallySurvive, RaceLegenda), usa waypoints de progresso — ver Parte 10 §3.7. Em jogos com checkpoints soltos (Navigation Expert), o próprio indicador de checkpoint já cumpre esse papel. Implementação da UI: Parte 11 §4.5.

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
Corrida contrarrelógio em traçado fixo, tema "sobrevivência ao rally": pistas temáticas, objetivo é bater o menor tempo do mundo em cada uma.

### Pistas (3 no lançamento, 1 pós-MVP)
1. **Deserto** — pista "padrão": grip total (1.0) o traçado inteiro, sem modificador de terreno. É a referência de sensação de direção contra a qual as outras duas pistas se comparam.
2. **Floresta** — chovendo, com **poças de água espalhadas pelo traçado** (posições fixas, autoradas por pista, não sorteadas): grip normal fora delas, grip reduzido ao atravessar uma poça. Risco pontual e evitável, não um modificador constante.
3. **Gelo** — grip reduzido no traçado inteiro (mais escorregadio que qualquer poça da Floresta) — aqui a derrapagem é um castigo constante, não pontual.
4. **Noturna** — pós-MVP.

**Definido:** as 3 pistas do lançamento (Deserto, Floresta, Gelo) liberadas desde o início, sem progressão pra desbloquear — jogo curto e focado em contrarrelógio, não faz sentido represar conteúdo atrás de progressão. **Noturna fica de fora do MVP** e entra numa fase seguinte.

**Em aberto:** valores numéricos exatos de grip (Deserto, poça da Floresta, Gelo) e de `steeringResponsiveness` — calibrar em prototipagem. A ordem relativa (Gelo mais escorregadio que uma poça, poça mais escorregadia que grip padrão) já está definida. Ver Parte 10 §3.8–3.10 (implementação das zonas de terreno) e Parte 8 §1.2/1.5 (como o grip afeta o movimento e as partículas).

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
- Barra de velocidade atual e % da pista percorrida, herdados do Core (Parte 1 §5) — traçado fixo, então o % usa os waypoints de progresso (Parte 10 §3.7).

### Menu Principal
**Definido:** o menu inicial lista as 3 pistas do lançamento (Deserto, Floresta, Gelo); tocar no botão de uma pista mostra imediatamente o ranking de melhores tempos daquela pista (lido do Firebase) **e troca o background do menu para a imagem correspondente àquela pista** (uma imagem de fundo por pista). Começar a corrida exige **tocar e segurar** o botão da pista por alguns segundos — não há um botão "Jogar" separado. O objetivo é evitar que um toque rápido/acidental (ex.: navegando a lista) inicie uma corrida sem querer.

**Em aberto:** duração exata do "segurar" (placeholder de implementação: 1,5s — ver Parte 13 §6.4). Background do menu para a pista Noturna fica pendente até ela entrar em produção (pós-MVP).

### Menus de Feedback (Colisão e Chegada)

**Definido:** ao sair do traçado (ver "Regra específica: Traçado" acima), a corrida **não reinicia mais automaticamente** — ela pausa e mostra um menu com o texto **"Você Bateu! Aperte ESC para voltar ao grid ou R para tentar novamente."**. `ESC` volta para o menu principal (o grid de pistas, ver "Menu Principal" acima); `R` reinicia a mesma pista, com o mesmo efeito que o reinício automático tinha antes. Isso substitui o comportamento anterior descrito na Parte 10 §3.6, atualizado junto com a Parte 11 §4.3.

Ao cruzar a linha de chegada, antes de enviar o tempo ao leaderboard (Parte 12 §5.6), aparece uma tela de chegada mostrando o **tempo final da corrida** e pedindo que o jogador **digite um nome de até 5 caracteres** para identificar aquele score — esse nome é o campo `nome`/`playerName` salvo junto do tempo na estrutura do Firestore (ver Parte 1 §6). Essa mesma tela tem dois botões sempre disponíveis, independente de o jogador já ter confirmado um nome: **"Repetir Pista"** (recarrega a mesma pista do zero, mesmo efeito do `R` no menu de colisão) e **"Voltar ao Menu"** (volta para o grid de pistas do menu principal, mesmo efeito do `Esc` no menu de colisão) — o jogador pode usá-los mesmo sem enviar o tempo, se preferir não salvar aquele score.

**Em aberto:** o que acontece se o jogador confirmar sem digitar nada (usar um nome padrão tipo "PLAYR", ou bloquear a confirmação até haver ao menos 1 caractere); se os caracteres são livres ou restritos (ex.: só letras/números, maiúsculas automáticas); se o nome digitado fica lembrado para a próxima corrida (salvo localmente) ou é pedido toda vez.

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
| **Nº de pistas/mapas no lançamento** | 3 (deserto, floresta, gelo) + noturna pós-MVP | A definir                                           | A definir                                                    | A definir                                                            |

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
      Particles/
    Scenes/
    Prefabs/
    Materials/
    Tilemaps/
    SceneTemplates/
```

> Dica: o prefixo `_Project` (com underline) faz sua pasta ficar sempre no topo da lista, separada das pastas de packages/plugins.

### 0.4 Criar a primeira cena

> As 3 pistas do lançamento (Deserto, Floresta, Gelo — ver Parte 2 §"Pistas") nascem do mesmo pipeline. Construímos a `RaceDesert` primeiro, com todo o sistema comum (carro, partículas, chevrons, pista, timer/UI), e a partir dela geramos `RaceForest` e `RaceIce` como pistas-template (Parte 10 §3.12) — só trocando o que é específico de cada uma (geometria da pista, poças, grip, partículas, chuva). Esta fase e as próximas 4 (Fase 1 a 4) descrevem a `RaceDesert` em detalhe completo; a Parte 10 §3.8 em diante mostra a diferença pras outras duas.

1. Em `Assets/_Project/Scenes/`, botão direito → **Create → Scene**. Nomeie `RaceDesert`.
2. Dê duplo clique pra abrir.
3. Salve o projeto (`Ctrl+S` / `Cmd+S`).

### 0.5 Pacotes necessários (Window → Package Manager)

Instale agora, mesmo que só use mais adiante (evita interromper o fluxo depois):

- **Input System** (com.unity.inputsystem) — vamos usar pra ler a posição do mouse de forma moderna.
- **TextMeshPro** (geralmente já vem, ou é oferecido num popup na primeira vez que você usa texto — aceite o import de "TMP Essentials").
- **2D Pixel Perfect** (com.unity.2d.pixel-perfect) — essencial pra pixel art não ficar borrada/tremida.
- **2D Sprite Shape** (com.unity.2d.spriteshape) — pra desenhar o traçado da pista como uma textura contínua ao longo de uma spline (ver Fase 3).
- **2D Tilemap Editor** (com.unity.2d.tilemap) — pra pintar o terreno de fundo (fora da pista) e apoiar a decoração.

#### Ativar o novo Input System
`Edit → Project Settings → Player → Other Settings → Active Input Handling` → mude para **Input System Package (New)** ou **Both** (mais seguro para iniciante, evita quebrar packages antigos). O Unity vai pedir pra reiniciar o Editor — aceite.

### ✅ Checkpoint da Fase 0
- Projeto abre sem erros.
- Estrutura de pastas criada.
- Cena `RaceDesert` existe e está salva.
- Package Manager mostra Input System, TextMeshPro, Pixel Perfect, Sprite Shape e Tilemap instalados.

Próxima fase: **01_CARRO_MOVIMENTO.md** — vamos fazer o carro se mover em direção ao mouse.

---

# Parte 8 — Implementação Unity: Fase 1 (Movimento do Carro)

## Fase 1 — Movimento do Carro

> Objetivo: o carro se move em direção ao cursor, a velocidade cresce (de forma exponencial) quanto mais longe o cursor estiver, e o quanto ele responde a isso depende do **grip** do terreno atual (seção 1.5) — em grip baixo o carro carrega velocidade/direção antigas por mais tempo antes de obedecer ao cursor.

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

    [Header("Grip / Derrapagem")]
    [SerializeField] private float steeringResponsiveness = 20f;
    // ^ com grip 1.0, um valor alto aqui deixa a resposta quase idêntica ao "snap" direto de antes.
    //   Em grip baixo (poça, Gelo), a resposta efetiva cai proporcionalmente — ver FixedUpdate.

    [Header("Rotation")]
    [SerializeField] private float rotationSpeed = 10f;

    private Rigidbody2D rb;
    private Camera mainCamera;
    private Vector2 mouseWorldPos;

    // Grip atual (0 a 1) do terreno embaixo do carro — setado externamente pelo
    // CarTerrainSensor (Parte 10 §3.10), nunca calculado aqui dentro. Padrão 1 = grip
    // total, então nada muda até a Fase 3 ligar o sensor.
    public float CurrentGrip { get; set; } = 1f;
    // true enquanto o carro estiver sobre uma poça (Floresta) — só troca o preset de
    // partícula (seção 1.5), não afeta o grip em si (isso já está em CurrentGrip).
    public bool InPuddle { get; set; }

    // Velocidade PEDIDA pelo cursor (0 a 1) — alimenta os chevrons (intenção do jogador, Fase 2).
    public float TargetSpeedNormalized { get; private set; }
    // Velocidade REAL do carro (0 a 1), já filtrada pelo grip — alimenta a barra de
    // velocidade da UI (Parte 11 §4.4) e as partículas (seção 1.5).
    public float ActualSpeedNormalized { get; private set; }
    public bool IsAccelerating { get; private set; }
    public bool IsBraking { get; private set; }

    private float previousTargetSpeedNormalized;

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

        // 2. Apply the curve (smooth exponential) to get the TARGET speed
        float speedT = speedCurve.Evaluate(t);

        // 3. Build the velocity the player is ASKING for (direction + target speed)
        Vector2 desiredVelocity = Vector2.zero;
        if (distance > minDistanceForMovement)
        {
            Vector2 direction = toMouse.normalized;
            desiredVelocity = direction * (speedT * maxSpeed);

            // Smoothly rotate the car to "look" in the direction of movement.
            // A rotação segue o cursor direto — só a velocidade é afetada pelo grip (passo 4).
            float targetAngle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg - 90f;
            float angle = Mathf.LerpAngle(rb.rotation, targetAngle, rotationSpeed * Time.fixedDeltaTime);
            rb.MoveRotation(angle);
        }

        // 4. Aproxima a velocidade REAL da velocidade pedida, numa taxa proporcional ao
        //    grip do terreno atual — isso é a derrapagem. Grip 1.0 (Deserto) responde quase
        //    instantaneamente; grip baixo (poça, Gelo) "carrega" velocidade antiga por mais
        //    tempo antes de alcançar o que o cursor está pedindo.
        float effectiveResponsiveness = steeringResponsiveness * CurrentGrip;
        float lerpT = Mathf.Clamp01(effectiveResponsiveness * Time.fixedDeltaTime);
        rb.linearVelocity = Vector2.Lerp(rb.linearVelocity, desiredVelocity, lerpT);

        // 5. Update public state
        TargetSpeedNormalized = speedT;
        ActualSpeedNormalized = Mathf.Clamp01(rb.linearVelocity.magnitude / maxSpeed);
        IsAccelerating = speedT > previousTargetSpeedNormalized + 0.001f;
        IsBraking = speedT < previousTargetSpeedNormalized - 0.001f;
        previousTargetSpeedNormalized = speedT;
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
   - `Steering Responsiveness`: 20 (com grip 1.0 já fica quase idêntico ao comportamento antigo; a diferença por pista entra na Fase 3, não aqui)
   - `Rotation Speed`: 10

### 1.4 Configurar a curva exponencial suave

No Inspector, clique no campo `Speed Curve` (abre um editor gráfico de curva):
1. Clique com botão direito no ponto do canto inferior esquerdo (0,0) → **Left Tangent / Right Tangent → Linear**, depois ajuste para algo que comece bem raso e suba rápido no final — ou mais simples:
2. Clique com botão direito em qualquer ponto vazio da curva → **Ease In** já dá uma curva que começa devagar e acelera, que é a sensação que queremos (resposta mais "explosiva" perto do máximo).

Se preferir 100% via código sem mexer no Inspector, troque a linha da curva por:
```csharp
float speedT = t * t; // simple quadratic curve, same "smooth exponential" effect
```

### 1.5 Partículas de movimento

> Objetivo: dar feedback visual de que o carro está em movimento e reagindo ao terreno — poeira em terreno seco (Deserto e Floresta fora de poça), respingo d'água ao cruzar uma poça (só na Floresta), e spray de gelo/neve no Gelo. A fonte de dado já existe: `CarController.ActualSpeedNormalized` e `CarController.InPuddle` (seção 1.2).

**Definido:** cada cena usa um preset de partícula fixo (`trailParticles`), exceto a Floresta, que alterna em tempo real entre o preset seco e o preset de respingo (`splashParticles`) conforme o carro entra/sai de uma poça (Parte 10 §3.9). Deserto e Gelo não precisam de troca em tempo real — o terreno é uniforme na pista inteira.

**1. Criar o Particle System:**

1. Selecione o GameObject `Car` na Hierarchy → **Add Component → Particle System**. Renomeie o componente/filho gerado para `CarTrailParticles`.
2. Configure o básico pra um rastro atrás do carro: `Shape = Cone` ou `Circle` pequeno na posição da traseira, `Simulation Space = World` (pra partículas ficarem "no chão" enquanto o carro segue em frente), emissão baixa (`Rate over Time` ~10-20), `Start Lifetime` curto (~0.5-1s).
3. Ajuste a cor/textura pra poeira (tons de terra/areia) — isso vira o preset padrão do Deserto e da Floresta fora de poça.
4. **Só na cena `RaceForest`** (criada na Parte 10 §3.12): duplique esse Particle System (`Ctrl+D`), renomeie para `CarSplashParticles`, troque a cor/textura pra respingo d'água (tons de azul/branco, partículas maiores e mais rápidas verticalmente).
5. **Só na cena `RaceIce`**: troque a cor/textura do `CarTrailParticles` pra spray de gelo/neve (branco/ciano) — não precisa de um segundo Particle System, já que o Gelo não tem poças.

**2. Script: `CarParticles.cs`**

Crie em `Assets/_Project/Scripts/Car/CarParticles.cs`:

```csharp
using UnityEngine;

public class CarParticles : MonoBehaviour
{
    [SerializeField] private CarController car;
    [SerializeField] private ParticleSystem trailParticles;   // poeira (Deserto/Floresta) ou gelo/neve (Gelo)
    [SerializeField] private ParticleSystem splashParticles;  // respingo de poça — deixe vazio no Deserto e no Gelo
    [SerializeField] private float minSpeedToEmit = 0.1f;     // abaixo disso, carro "parado", sem partícula

    void Update()
    {
        bool moving = car.ActualSpeedNormalized > minSpeedToEmit;

        if (splashParticles != null)
        {
            // Cena com poça (Floresta): alterna entre os dois presets
            SetEmitting(trailParticles, moving && !car.InPuddle);
            SetEmitting(splashParticles, moving && car.InPuddle);
        }
        else
        {
            // Deserto/Gelo: um único preset fixo
            SetEmitting(trailParticles, moving);
        }
    }

    private void SetEmitting(ParticleSystem ps, bool emit)
    {
        var emission = ps.emission;
        if (emission.enabled != emit) emission.enabled = emit;
    }
}
```

1. Arraste o script no GameObject `Car`.
2. No Inspector, ligue `Car` a ele mesmo, `Trail Particles` ao `CarTrailParticles`, e `Splash Particles` ao `CarSplashParticles` **só na cena `RaceForest`** (deixe vazio nas outras duas).

> Dica opcional: pra dar mais leitura de velocidade, escale `emission.rateOverTimeMultiplier` proporcionalmente a `car.ActualSpeedNormalized` em vez de só ligar/desligar — fica pra polimento, não é necessário pro MVP.

### ✅ Checkpoint da Fase 1
- Dar Play, mover o mouse longe do carro → carro acelera na direção dele.
- Aproximar o mouse do carro → carro desacelera e para.
- Movimento parece suave, sem tremer (nessa fase `CurrentGrip` ainda está sempre em `1`, valor padrão — a diferença de derrapagem só aparece a partir da Fase 3, quando o `CarTerrainSensor` passa a alterá-lo).
- Partículas de poeira aparecem atrás do carro enquanto ele se move, e somem quando ele para.

### Testando rápido
Adicione temporariamente um `Debug.Log($"Target: {TargetSpeedNormalized}, Actual: {ActualSpeedNormalized}, Grip: {CurrentGrip}, Accel: {IsAccelerating}, Brake: {IsBraking}");` dentro do `FixedUpdate` pra confirmar que os valores mudam como esperado antes de seguir pra fase dos chevrons. Com `CurrentGrip = 1` (padrão nesta fase), `Target` e `Actual` devem ficar bem próximos o tempo todo.

Próxima fase: **02_CHEVRONS.md** — desenhar as setas verdes/vermelhas entre carro e cursor.

---

# Parte 9 — Implementação Unity: Fase 2 (Chevrons)

## Fase 2 — Sistema de Chevrons

> Objetivo: desenhar uma fileira de setas entre o carro e o cursor, verdes se acelerando, vermelhas se freando.

> Nota: os chevrons leem `IsAccelerating`/`IsBraking`, calculados a partir da velocidade **pedida** pelo cursor (`TargetSpeedNormalized`, Fase 1 §1.2) — eles mostram a intenção do jogador, não a velocidade real do carro (essa é a barra da UI, Fase 4 §4.4). Isso não muda entre pistas: os chevrons ficam iguais no Deserto, na Floresta e no Gelo, só a resposta física do carro é que muda (Fase 3, §3.8-3.10).

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

Próxima fase: **03_PISTA_E_LIMITES.md** — desenhar a pista com Sprite Shape e detectar quando o carro sai dela.

---

# Parte 10 — Implementação Unity: Fase 3 (Pista e Limites)

## Fase 3 — Pista (Sprite Shape + Terreno) e Detecção de Saída da Pista

> Objetivo: desenhar a superfície da pista como uma textura contínua (Sprite Shape), usar sprites/Tilemap só pro terreno de fundo e decoração, e detectar quando o carro sai do traçado válido, disparando o reinício da corrida.

**Definido:** a pista em si (o asfalto/terra por onde o carro anda) é renderizada como **uma textura aplicada a uma malha gerada por spline** (2D Sprite Shape), não como peças de tile encaixadas. Isso evita emendas visíveis em curvas orgânicas e casa com o formato de dados de pista do Core (waypoints + largura — ver Parte 1), já que a spline do Sprite Shape é, na prática, a mesma lista de waypoints. Tilemap e sprites soltos ficam reservados para **terreno de fundo** (grama, deserto, neve fora da pista) e **decoração** (pedras, árvores, placas) — nunca para desenhar o traçado.

### 3.1 Criar a pista com Sprite Shape

1. Hierarchy → botão direito → **2D Object → Sprite Shape → Spline** (use o preset **Filled** — é o que preenche o interior com uma textura, diferente do "Open" que é só uma linha/estrada sem preenchimento fechado).
2. Renomeie o GameObject para `Track_Desert`.
3. No componente **Sprite Shape Controller**, crie (ou peça pro seu artista criar) um **Sprite Shape Profile**: um asset que define qual sprite/textura preenche o interior (`Angle Range → Sprites`, campo de fill) e quais sprites usar nas bordas/laterais (acostamento, guia da pista).
4. Edite os pontos de controle da spline na Scene view (clique com a ferramenta de edição de spline ativa) seguindo o traçado desejado da pista — esses pontos podem vir diretamente dos **waypoints** já definidos pra pista (Parte 1 — GDD Core).
5. Ajuste a espessura da pista arrastando as alças de largura em cada ponto de controle (equivalente ao campo "largura de pista" dos dados de waypoint).
6. No Sprite Shape Profile, configure o **Fill Texture** com a textura de asfalto/terra pixel art — o Unity repete/estica essa textura automaticamente ao longo de toda a spline, sem você desenhar tile por tile.

> Enquanto não tiver a textura final de pixel art, use uma textura sólida simples (ex: cinza-chapado) só pra testar a forma e a lógica.

### 3.2 Terreno de fundo e decoração (Tilemap + sprites soltos)

O terreno que fica **fora** da pista (fora da área coberta pelo Sprite Shape) é pintado numa Tilemap separada, e a decoração é feita com sprites individuais posicionados à mão — nunca dentro da malha da pista.

1. Hierarchy → botão direito → **2D Object → Tilemap → Rectangular**. Renomeie para `Tilemap_Terrain`.
2. Abra **Window → 2D → Tile Palette**, crie a paleta `Palette_Desert` em `Assets/_Project/Tilemaps/`, e arraste os sprites de terreno (dunas, grama, gelo) pra dentro.
3. Pinte o terreno de fundo ao redor do traçado — não precisa ser preciso nas bordas, já que quem faz a fronteira visual real é a pista (Sprite Shape) por cima.
4. Ajuste a **Sorting Layer/Order in Layer**: `Tilemap_Terrain` no fundo, `Track_Desert` (Sprite Shape) acima do terreno, decoração e chevrons acima da pista, carro no topo.
5. Para decoração (pedras, cactos, árvores, bancos de neve), arraste sprites/prefabs individuais na cena — sem Tilemap, pra poder rotacionar/escalar cada um livremente e permitir sobreposição parcial na borda da pista (ex.: um arbusto que "invade" visualmente o acostamento).

### 3.3 Estratégia de detecção: zona válida vs. fora da pista

A forma mais simples pra iniciante (e é a mesma abordagem que vamos usar no RaceLegenda depois): criar um **collider de trigger** que cobre toda a área **fora** da pista (ou, alternativamente, um collider que cobre a pista e detectar quando o carro *sai* dele).

**Abordagem recomendada: "zona válida" com Polygon Collider 2D.**

1. Crie um GameObject vazio: `Create Empty` → renomeie `TrackValidZone`.
2. Adicione componente **Polygon Collider 2D**.
3. Marque a opção **Is Trigger** ✅.
4. Edite os pontos do polígono (no Inspector, botão **Edit Collider**, ou arrastando os pontos verdes na Scene view) para desenhar o contorno exato da pista, seguindo o visual do Sprite Shape.

> Dica: o **Sprite Shape Controller** tem a opção **Collider Type → Trigger**, que gera automaticamente um `Polygon Collider 2D` seguindo o contorno exato da spline — ativando isso, você pode usar esse collider gerado diretamente como `TrackValidZone` em vez de redesenhar o polígono manualmente, e ele se atualiza sozinho se você editar a spline depois.
>
> Dica: para pistas mais complexas (com curvas), você pode ter vários `Polygon Collider 2D` compostos, ou usar um único collider com múltiplos "paths" (o Polygon Collider 2D do Unity suporta múltiplos contornos no mesmo componente).

**Definido:** o carro só é considerado "fora da pista" (bateu) quando **0% do seu Collider2D ainda sobrepõe** a `TrackValidZone` — ou seja, 99% fora ainda conta como 100% dentro, e nada acontece enquanto restar qualquer sobreposição. Isso já é o comportamento nativo do `OnTriggerExit2D`: ele só dispara no instante em que as duas formas deixam de se sobrepor completamente, nunca antes.

> Atenção: essa regra depende do **Collider2D do `Car` cobrir a silhueta real do carro** (ex.: um `Box Collider 2D`/`Polygon Collider 2D` ajustado ao sprite), não um ponto ou círculo minúsculo no centro — senão "100% fora" na prática vira só "o centro saiu", o que não é a mesma coisa.

### 3.4 Script: `TrackBoundary.cs`

Crie em `Assets/_Project/Scripts/Track/TrackBoundary.cs` e coloque no `TrackValidZone`:

```csharp
using UnityEngine;

public class TrackBoundary : MonoBehaviour
{
    [SerializeField] private float grip = 1f;
    // Grip base desta pista inteira (0 a 1): 1.0 no Deserto e na Floresta (fora de
    // poça), mais baixo no Gelo — ver Parte 10 §3.8. O CarTerrainSensor (§3.10) lê
    // este valor pra saber qual grip aplicar quando o carro não está sobre uma poça.
    public float Grip => grip;

    // OnTriggerExit2D só dispara quando o Collider2D do carro deixa de
    // sobrepor esta zona por completo (0% de sobreposição) — 99% fora
    // ainda conta como dentro, e não gera este evento.
    void OnTriggerExit2D(Collider2D other)
    {
        if (other.CompareTag("Car"))
        {
            RaceManager.Instance.OnCarLeftTrack();
        }
    }
}
```

### 3.5 Marcar o carro com a Tag correta

1. Selecione o GameObject `Car`.
2. No topo do Inspector, campo `Tag` → **Add Tag...** → crie a tag `Car`.
3. Volte no `Car`, selecione a tag `Car` recém-criada.

### 3.6 Script: `RaceManager.cs` (gerencia o estado da corrida)

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
    public bool Crashed { get; private set; } // true enquanto o menu "Você Bateu" está na tela

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
        if (Crashed) return; // evita disparar de novo enquanto o menu de colisão já está aberto
        Debug.Log("Car left the track!");
        RaceActive = false;
        Crashed = true;
        // Não recarrega mais a cena direto — o CrashMenuUI (Fase 4, seção 4.3) mostra
        // a mensagem "Você Bateu" e espera o jogador apertar R (RetryRace) ou Esc (QuitToMainMenu).
    }

    public void RetryRace()
    {
        // Mesmo efeito que o reinício automático tinha antes: recarrega a cena inteira.
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }

    public void QuitToMainMenu()
    {
        SceneManager.LoadScene("MainMenu"); // cena criada na Fase 6 — ver Parte 13 §6.1
    }
}
```

1. Crie um GameObject vazio `RaceManager` na Hierarchy e arraste o script nele.

### 3.7 Progresso da pista (% percorrida)

> Objetivo: saber, a qualquer momento da corrida, qual % do traçado o carro já percorreu. Esse número (de 0 a 1) é só **dado** — quem o mostra na tela é a UI da Fase 4 (Parte 11 §4.5). Aqui a gente só cria o sistema que calcula.

**A ideia, em uma frase:** espalhamos ao longo da pista uma série de **"portas" invisíveis** (triggers), numeradas do início ao fim. Cada vez que o carro atravessa uma porta, o progresso sobe para `portas atravessadas / total de portas`.

```
 LARGADA                                                      CHEGADA
   |  |  |  |  |  |  |  |  |  |  |  |    (cada "|" = Waypoint_XX, uma porta
   00 01 02 03 04 05 06 07 08 09 10 11    invisível atravessando a pista)

 carro passou pela porta 02 → progresso = (2 + 1) / 12 = 25%
 carro passou pela porta 11 → progresso = 12 / 12   = 100%
```

**Definido:** o progresso avança **em degraus**, um por porta atravessada (não é uma barra perfeitamente suave). É uma aproximação deliberada: suficiente para o indicador da HUD e evita ter que calcular a posição exata do carro projetada na spline da pista.

**Se o jogador pular uma porta ou der ré:** o sistema guarda o **maior** número de porta já atravessado. Se o carro pular a porta `04` e passar direto na `05`, o progresso vai para `6/12` normalmente. Se o carro voltar e atravessar uma porta antiga de novo, ela é ignorada — o progresso nunca diminui.

**1. Posicionar as portas (`Waypoint_XX`) na cena**

1. Na Hierarchy, crie um GameObject vazio chamado `TrackWaypoints`. Ele é só uma **pasta organizadora** — todas as portas ficam dentro dele.
2. Dentro de `TrackWaypoints`, crie um GameObject vazio para cada porta, **na ordem em que o carro vai passar por elas**, da largada até perto da chegada. Nomeie `Waypoint_00`, `Waypoint_01`, `Waypoint_02`...
   - **A ordem na Hierarchy importa:** o script usa a posição do objeto dentro de `TrackWaypoints` como número da porta (primeiro filho = porta 0, segundo = porta 1, etc.). O nome é só para você se orientar.
   - **Onde colocar:** uma boa referência são os pontos de controle da spline da pista (seção 3.1), mas não precisa ser 1 para 1 — o importante é distribuir as portas de forma mais ou menos uniforme ao longo do traçado. Comece com ~10–15 portas por pista.
   - **Não crie uma porta na linha de chegada** — a `FinishLine` (Parte 12 §5.6) já cuida disso e força o progresso para 100%.
3. Em cada `Waypoint_XX`, adicione um **Box Collider 2D** com `Is Trigger` ✅ e ajuste-o para ser uma **faixa fina atravessando a pista de lado a lado** (perpendicular ao sentido da corrida):
   - `Size`: X = um pouco mais que a largura da pista naquele ponto, Y = algo fino (ex.: `0.5`).
   - Gire o GameObject (`Rotation Z`) para que a faixa fique "de través" na pista, como uma linha de chegada.
   - Pense nela como uma catraca: como cobre a pista toda, o carro não tem como seguir em frente sem tocá-la.

> **Dica:** com **Gizmos** ligado na Scene view, os colliders aparecem como caixas verdes — fica fácil conferir se cada porta cobre a largura toda da pista.

**2. Script: `TrackWaypoint.cs`** (vai em **cada** porta)

Crie em `Assets/_Project/Scripts/Track/TrackWaypoint.cs`:

```csharp
using UnityEngine;

public class TrackWaypoint : MonoBehaviour
{
    // O número da porta é a posição dela dentro de TrackWaypoints na Hierarchy
    // (primeiro filho = 0, segundo = 1, ...). Nada para preencher no Inspector.
    public int Index => transform.GetSiblingIndex();

    void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Car")) // tag criada na seção 3.5
            TrackProgress.Instance.OnWaypointReached(Index);
    }
}
```

Selecione **todos** os `Waypoint_XX` de uma vez (clique no primeiro, Shift+clique no último) e adicione o script pelo Inspector — ele entra em todos ao mesmo tempo. Não há nenhum campo para preencher.

**3. Script: `TrackProgress.cs`** (um só na cena — é quem faz a conta)

Crie em `Assets/_Project/Scripts/Track/TrackProgress.cs`:

```csharp
using UnityEngine;

public class TrackProgress : MonoBehaviour
{
    public static TrackProgress Instance { get; private set; }

    public float ProgressNormalized { get; private set; } // 0 = largada, 1 = chegada

    private int totalWaypoints;         // contado sozinho no Start, a partir das portas da cena
    private int lastWaypointIndex = -1; // maior porta já atravessada (-1 = nenhuma ainda)

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    void Start()
    {
        // Conta quantas portas (TrackWaypoint) existem na cena — não precisa digitar à mão.
        totalWaypoints = FindObjectsByType<TrackWaypoint>(FindObjectsSortMode.None).Length;
        if (totalWaypoints == 0)
            Debug.LogWarning("TrackProgress: nenhum TrackWaypoint na cena — o % vai ficar em 0 até a chegada.");
    }

    public void OnWaypointReached(int index)
    {
        if (index <= lastWaypointIndex) return; // porta repetida ou antiga (ré): ignora
        lastWaypointIndex = index;
        ProgressNormalized = (index + 1) / (float)totalWaypoints;
    }

    public void ForceComplete()
    {
        ProgressNormalized = 1f; // chamado pelo RaceManager.OnRaceFinished() (Parte 12 §5.6)
    }
}
```

1. Crie um GameObject vazio `TrackProgress` na Hierarchy (fora de `TrackWaypoints`) e arraste o script nele. Nada para configurar no Inspector.

**4. Garantir 100% ao cruzar a chegada (fazer só na Fase 5)**

Como não existe porta na linha de chegada, quem leva o progresso a 100% é o `RaceManager`. Quando chegar na Parte 12 §5.6, adicione a chamada `ForceComplete()` dentro de `OnRaceFinished()`, logo após `Finished = true;`:

```csharp
public void OnRaceFinished()
{
    if (!RaceActive) return;
    RaceActive = false;
    Finished = true;
    TrackProgress.Instance.ForceComplete(); // garante 100% mesmo que o último waypoint tenha sido pulado
    Debug.Log($"Race finished! Time: {ElapsedTime}");
}
```

> Até a Fase 5 existir, o progresso para no valor da última porta (ex.: `92%`) — é esperado.

**5. Como testar agora (antes da UI da Fase 4)**

Temporariamente, adicione no fim de `OnWaypointReached` a linha `Debug.Log($"Porta {index} → {ProgressNormalized:P0}");`, dê Play e dirija pela pista. O Console deve mostrar `Porta 0 → 8 %`, `Porta 1 → 17 %`... subindo em ordem. Se alguma porta não aparecer, o collider dela não cobre a largura da pista (ou está sem `Is Trigger`). Remova o log depois.

> **Em aberto:** o número de waypoints por pista (e a distância entre eles) ainda não está calibrado — poucos waypoints deixam o indicador "pulando" em saltos grandes; waypoints demais dão mais trabalho manual ao montar cada pista. Ajustar depois de testar em pista real.

### 3.8 Grip por pista

> Objetivo: dar ao `TrackValidZone` de cada pista o grip base que a caracteriza (ver Parte 2 §"Pistas"). Isso já é lido pelo `CarController` (Fase 1 §1.2) através do sensor que a seção 3.10 cria — aqui só configuramos o dado.

No componente `TrackBoundary` (seção 3.4) de cada cena, ajuste o campo `Grip` no Inspector:

| Pista | Grip base do `TrackValidZone` |
|---|---|
| Deserto | `1.0` (padrão, sem modificador) |
| Floresta | `1.0` fora de poça — a poça em si tem seu próprio grip menor (seção 3.9) |
| Gelo | baixo (ex.: `0.3` — placeholder, **Em aberto**: calibrar em prototipagem) |

**Definido:** o Gelo usa um grip uniforme mais baixo que o de qualquer poça da Floresta — é castigo constante, não pontual (ver Parte 2 §"Pistas").

### 3.9 Poças de água (Floresta)

> Objetivo: zonas de trigger menores, com grip mais baixo que o resto da pista, espalhadas em posições fixas pelo traçado da Floresta (não sorteadas — ver Parte 2 §"Pistas"). Só existem na cena `RaceForest`.

**1. Script: `PuddleZone.cs`**

Crie em `Assets/_Project/Scripts/Track/PuddleZone.cs`:

```csharp
using UnityEngine;

public class PuddleZone : MonoBehaviour
{
    [SerializeField] private float grip = 0.5f; // Em aberto: valor exato a calibrar em prototipagem
    public float Grip => grip;
}
```

**2. Criar as poças na cena `RaceForest`:**

1. Escolha manualmente alguns pontos ao longo do traçado (2-4 pra começar, ajustar depois de testar).
2. Em cada um, crie um GameObject `Puddle_00`, `Puddle_01`, etc., dentro de uma pasta organizadora `Puddles` (igual ao padrão de `TrackWaypoints`, seção 3.7).
3. Adicione um **Circle Collider 2D** (ou `Box Collider 2D`) com `Is Trigger` ✅, do tamanho de uma poça — bem menor que a largura total da pista, pra dar espaço pro jogador desviar.
4. Arraste o script `PuddleZone.cs`.
5. Adicione um sprite simples de poça (`SpriteRenderer`, textura escura/reflexiva) do mesmo tamanho do collider, só pra leitura visual — sem ele, o jogador não teria como prever onde vai escorregar.

> Dica: como as poças são fixas e visíveis, elas fazem parte do "traçado de risco" que o jogador aprende a decorar tentando bater o próprio recorde — coerente com o pilar de contrarrelógio da Parte 2.

### 3.10 Sensor de terreno no carro

> Objetivo: ler o grip da `TrackValidZone` (seção 3.8) e das `PuddleZone` que o carro estiver sobrepondo (seção 3.9), e escrever o resultado em `CarController.CurrentGrip`/`InPuddle` (Fase 1 §1.2) — é a ponte entre o dado de terreno e a física do carro.

**Definido:** a detecção acontece no próprio `Car` (não na zona), porque o carro pode estar sobre 0, 1 ou mais poças ao mesmo tempo (poças sobrepostas) — contar overlaps no carro é mais simples que coordenar várias zonas entre si.

Crie em `Assets/_Project/Scripts/Car/CarTerrainSensor.cs`:

```csharp
using UnityEngine;

public class CarTerrainSensor : MonoBehaviour
{
    [SerializeField] private CarController car;
    [SerializeField] private TrackBoundary trackBoundary; // fornece o grip base da pista atual (seção 3.8)

    private int puddleOverlapCount;
    private float currentPuddleGrip;

    void Start()
    {
        car.CurrentGrip = trackBoundary.Grip;
    }

    void OnTriggerEnter2D(Collider2D other)
    {
        var puddle = other.GetComponent<PuddleZone>();
        if (puddle == null) return;

        puddleOverlapCount++;
        // Se o carro estiver sobre mais de uma poça ao mesmo tempo, usa a mais escorregadia
        currentPuddleGrip = puddleOverlapCount == 1 ? puddle.Grip : Mathf.Min(currentPuddleGrip, puddle.Grip);

        car.CurrentGrip = currentPuddleGrip;
        car.InPuddle = true;
    }

    void OnTriggerExit2D(Collider2D other)
    {
        var puddle = other.GetComponent<PuddleZone>();
        if (puddle == null) return;

        puddleOverlapCount = Mathf.Max(0, puddleOverlapCount - 1);
        if (puddleOverlapCount == 0)
        {
            car.CurrentGrip = trackBoundary.Grip;
            car.InPuddle = false;
        }
    }
}
```

1. Arraste o script no GameObject `Car` (ele precisa do próprio `Collider2D`/`Rigidbody2D` do carro pra receber os eventos de trigger — já existem desde a Fase 1).
2. No Inspector, ligue `Car` a ele mesmo e `Track Boundary` ao GameObject `TrackValidZone` da cena.

> Nas cenas `RaceDesert` e `RaceIce` (sem poças), este script simplesmente nunca recebe `OnTriggerEnter2D` de uma `PuddleZone` — o carro fica sempre com o grip base da pista, lido uma vez em `Start()`. Nada precisa ser desligado/condicionado por pista.

### 3.11 Chuva ambiente (Floresta)

> Objetivo: um efeito puramente visual de chuva caindo, só na cena `RaceForest` — não afeta a física, é só ambientação que reforça a razão das poças existirem.

1. Crie um Particle System como filho da `Main Camera` (`Create Empty` dentro dela → **Add Component → Particle System**), renomeie `RainAmbient`.
2. Configure: `Shape = Box`, alinhada horizontalmente acima da área visível da câmera; `Start Speed` alta e `Gravity Modifier` positivo pra cair rápido de cima pra baixo; `Start Lifetime` curto (só o suficiente pra atravessar a tela); `Rate over Time` alto (chuva densa); sprite/textura fina (uma linha ou traço, não um círculo).
3. Por estar dentro da `Main Camera`, a chuva sempre cobre a área visível, mesmo se a câmera seguir o carro.
4. Marque `Play On Awake` ✅ — a chuva começa a cair assim que a cena carrega, sem precisar de script.

Não precisa de script próprio: é configuração pura de Inspector.

### 3.12 Salvando como template e criando as pistas Floresta e Gelo

> Objetivo: depois que a `RaceDesert` estiver completa (Fases 1 a 4: carro, partículas, chevrons, pista, timer/UI funcionando), reaproveitar tudo que é comum pra criar as outras duas pistas sem refazer carro/chevrons/RaceManager/UI do zero.

**Definido:** usamos o recurso nativo de **Scene Template** do Unity — ele existe exatamente pra isso.

1. Com a `RaceDesert` completa e salva, clique com o botão direito nela na janela Project → **Create → Scene Template From Scene**. Isso gera um asset `.scenetemplate`; mova/renomeie pra `Assets/_Project/SceneTemplates/RaceTrack.scenetemplate`.
2. Pra criar uma pista nova: `File → New Scene`, escolha a aba **Scene Templates** e selecione `RaceTrack` — isso abre uma cópia completa da `RaceDesert` (carro, chevrons, RaceManager, TrackProgress, Canvas/UI, câmera, e também a pista do Deserto em si).
3. Salve essa cópia como `RaceForest` (ou `RaceIce`) em `Assets/_Project/Scenes/`.
4. Dentro da cópia, **apague os objetos específicos do Deserto** — `Track_Desert` (Sprite Shape), `Tilemap_Terrain`, `TrackWaypoints` — e refaça-os do zero seguindo as seções 3.1–3.2 e 3.7 com a geometria/terreno daquela pista. O `TrackValidZone` (com o `TrackBoundary`, seção 3.4) também é redesenhado (o polígono/spline muda de forma), mas o **script continua o mesmo** — só ajuste o campo `Grip` (seção 3.8) pro valor daquela pista (o total de waypoints é contado sozinho pelo `TrackProgress`, seção 3.7).
5. Só na `RaceForest`: adicione as `PuddleZone` (seção 3.9), o preset de partícula de respingo (Fase 1 §1.5) e a chuva ambiente (seção 3.11).
6. Só na `RaceIce`: troque o preset de partícula do `CarTrailParticles` pra gelo/neve (Fase 1 §1.5) — sem poça, sem chuva.
7. Tudo que **não** foi apagado (`Car`, `ChevronGuide`, `RaceManager`, `TrackProgress`, `Canvas` com toda a UI, câmera) já está funcionando igual à `RaceDesert` — nenhuma referência de script quebra, porque tudo se encontra por singleton (`RaceManager.Instance`, `TrackProgress.Instance`) ou por arrasto no Inspector dentro da própria cena copiada.

> **Em aberto:** a **Noturna** (pós-MVP, Parte 2 §"Pistas") segue o mesmo pipeline quando entrar em produção — mesmo template, mais uma entrada em `MainMenuController.tracks` (Parte 13 §6.6) com seu próprio `BackgroundSprite`.

### ✅ Checkpoint da Fase 3
- Dar Play, guiar o carro para fora dos limites do `TrackValidZone` → `RaceActive` vira `false` e `Crashed` vira `true` (visível no Inspector, já que são propriedades sem UI própria ainda — a UI do menu "Você Bateu" só é ligada na Fase 4, seção 4.3).
- Guiar o carro dentro da pista normalmente → nada acontece, corrida continua.
- Guiar o carro através dos `Waypoint_XX` em ordem → `TrackProgress.Instance.ProgressNormalized` sobe em degraus no Inspector (visível ao selecionar o GameObject `TrackProgress` durante o Play).
- Na `RaceDesert`, `CarController.CurrentGrip` fica sempre em `1` durante o Play (visível no Inspector, componente `Car`).
- Depois da seção 3.12: dar Play na `RaceForest` e cruzar uma poça → `CurrentGrip` cai pro valor da `PuddleZone`, `InPuddle` vira `true`, e o carro visivelmente "escorrega" antes de voltar a obedecer o cursor ao sair dela; na `RaceIce`, `CurrentGrip` fica sempre no valor baixo configurado na seção 3.8, o traçado inteiro.

#### Problemas comuns
- **`OnTriggerExit2D` nunca dispara:** confirme que o `Car` tem um **Collider2D** (não só o Rigidbody2D) e que pelo menos um dos dois colliders envolvidos (carro ou zona) **não** está marcado como trigger simultaneamente de forma que ambos sejam triggers — Unity exige que pelo menos um Rigidbody2D esteja envolvido para eventos de trigger funcionarem (o do carro já resolve isso).
- **Carro "atravessa" a borda sem detectar:** se o carro estiver muito rápido, ative `Collision Detection = Continuous` no Rigidbody2D do carro (`Rigidbody2D → Collision Detection`).
- **`ProgressNormalized` nunca passa de um certo valor:** confira se `Index` de cada `Waypoint_XX` está preenchido corretamente e em ordem crescente — um índice repetido ou fora de ordem é ignorado pelo guard `if (index <= lastWaypointIndex)`.
- **Carro nunca parece derrapar na Floresta/Gelo:** confira se `CarTerrainSensor` está no `Car` (não na zona) e se o campo `Track Boundary` está ligado ao `TrackValidZone` da cena — sem isso, `CurrentGrip` nunca é setado e fica no valor padrão (`1`) do `CarController`.

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

### 4.3 Menu de colisão: "Você Bateu"

> Objetivo: quando `RaceManager.Crashed` vira `true` (Fase 3, seção 3.6), pausar a corrida e mostrar um menu esperando o jogador apertar `R` (tentar de novo) ou `Esc` (voltar ao grid de pistas) — ver decisão de design na Parte 2 §"Menus de Feedback (Colisão e Chegada)".

**1. Criar o painel na UI:**

1. No mesmo `Canvas` da seção 4.1, crie um painel `CrashPanel` (**UI → Panel**).
2. Dentro dele, um texto TextMeshPro `CrashMessageText` com o conteúdo:
   `Você Bateu!\nAperte ESC para voltar ao grid ou R para tentar novamente.`
3. Deixe `CrashPanel` **desativado** por padrão (`SetActive(false)` no Inspector) — o script abaixo liga/desliga ele sozinho.

**2. Script: `CrashMenuUI.cs`**

Crie em `Assets/_Project/Scripts/UI/CrashMenuUI.cs`:

```csharp
using UnityEngine;
using UnityEngine.InputSystem;

public class CrashMenuUI : MonoBehaviour
{
    [SerializeField] private GameObject crashPanel;

    void Update()
    {
        bool crashed = RaceManager.Instance.Crashed;
        if (crashPanel.activeSelf != crashed)
            crashPanel.SetActive(crashed);

        if (!crashed) return;

        if (Keyboard.current.rKey.wasPressedThisFrame)
            RaceManager.Instance.RetryRace();
        else if (Keyboard.current.escapeKey.wasPressedThisFrame)
            RaceManager.Instance.QuitToMainMenu();
    }
}
```

1. Arraste o script em qualquer GameObject da cena (ex.: no próprio `CrashPanel`).
2. No Inspector, ligue o campo `Crash Panel` ao GameObject `CrashPanel` criado acima.

> `QuitToMainMenu()` carrega a cena `MainMenu`, que só é criada na Fase 6 (Parte 13). Até lá, testar o `Esc` nesta fase vai gerar um erro de "cena não encontrada nos Build Settings" — normal nesse ponto do guia, não é um bug.

### 4.4 Indicador de velocidade

> Objetivo: mostrar a velocidade **real** do carro (pós-grip, não a pedida pelo cursor) como uma barra leve em %, sem virar um velocímetro numérico pesado (ver pilar na Parte 1 §1, e a distinção intenção/realidade na Parte 1 §3). A fonte do dado já existe: `CarController.ActualSpeedNormalized` (Fase 1, seção 1.2), que varia de 0 a 1 e reflete o grip do terreno atual.

**1. Criar a barra na UI:**

1. No mesmo `Canvas` da seção 4.1, crie uma `Image` chamada `SpeedBarFill` (**UI → Image**), com `Image Type = Filled` e `Fill Method` à sua escolha (`Horizontal` para uma barra reta, `Radial 360` para um gauge circular).
2. Posicione num canto discreto da tela (ex.: inferior direito) — não é o foco visual do HUD, é um apoio.
3. Opcional: uma `Image` de fundo (`SpeedBarBackground`) atrás dela, só pra moldura da barra.

**2. Script: `SpeedDisplay.cs`**

Crie em `Assets/_Project/Scripts/UI/SpeedDisplay.cs`:

```csharp
using UnityEngine;
using UnityEngine.UI;

public class SpeedDisplay : MonoBehaviour
{
    [SerializeField] private CarController car;
    [SerializeField] private Image speedFillImage; // Image Type = Filled

    void Update()
    {
        speedFillImage.fillAmount = car.ActualSpeedNormalized;
    }
}
```

1. Arraste o script em qualquer GameObject da cena (ex.: no próprio `SpeedBarFill`).
2. No Inspector, ligue `Car` ao GameObject `Car` da cena e `Speed Fill Image` ao componente `Image` do `SpeedBarFill`.

### 4.5 Indicador de % da pista percorrida

> Objetivo: mostrar quanto da pista o jogador já percorreu, lendo o `TrackProgress` criado na Fase 3 (Parte 10 §3.7).

**1. Criar o texto na UI:**

1. No mesmo `Canvas`, crie um texto TextMeshPro `TrackProgressText` (posição sugerida: ao lado do `TimerText`, seção 4.1).

**2. Script: `TrackProgressDisplay.cs`**

Crie em `Assets/_Project/Scripts/UI/TrackProgressDisplay.cs`:

```csharp
using UnityEngine;
using TMPro;

public class TrackProgressDisplay : MonoBehaviour
{
    [SerializeField] private TMP_Text progressText;

    void Update()
    {
        int percent = Mathf.RoundToInt(TrackProgress.Instance.ProgressNormalized * 100f);
        progressText.text = $"{percent}%";
    }
}
```

1. Arraste o script no `TrackProgressText` (ou num objeto separado).
2. No Inspector, ligue `Progress Text` ao próprio componente `TMP_Text` do `TrackProgressText`.

### ✅ Checkpoint da Fase 4
- Dar Play → o cronômetro aparece no topo da tela e conta corretamente (`00:00.00`, `00:01.23`, etc.).
- Acelerar/frear → a `SpeedBarFill` sobe e desce acompanhando `ActualSpeedNormalized` (0–100%). Na `RaceDesert` isso acompanha o cursor de perto; na `RaceForest`/`RaceIce` (Fase 3, §3.8-3.10) a barra visivelmente "atrasa" em relação ao pedido do cursor ao escorregar.
- Guiar o carro pelos `Waypoint_XX` (Fase 3, seção 3.7) → `TrackProgressText` sobe em degraus (ex.: `0%` → `8%` → `16%`...).
- Guiar o carro pra fora da pista → o cronômetro para e o `CrashPanel` aparece com a mensagem "Você Bateu! Aperte ESC para voltar ao grid ou R para tentar novamente.".
- Apertar `R` com o menu aberto → a pista recarrega do zero (mesmo efeito do reinício automático antigo).
- Apertar `Esc` com o menu aberto → tenta carregar `MainMenu` (só funciona de fato a partir da Fase 6, ver nota acima).

#### Problemas comuns
- **`SpeedBarFill` não se move:** confira se `Image Type = Filled` está marcado — numa `Image` normal, `fillAmount` não tem efeito visual.
- **`TrackProgressText` fica sempre em `0%`:** confira se os `Waypoint_XX` têm o script `TrackWaypoint` e um `Box Collider 2D` com `Is Trigger` ✅ cobrindo a largura da pista, e se o carro tem a tag `Car` (Fase 3, seções 3.5 e 3.7). Se o % sobe fora de ordem, a ordem dos filhos dentro de `TrackWaypoints` na Hierarchy não segue o sentido da corrida.

Próxima fase: **05_FIREBASE_LEADERBOARD.md** — conectar o projeto ao Firebase e enviar/ler tempos do leaderboard global.

---

# Parte 12 — Implementação Unity: Fase 5 (Firebase Leaderboard)

## Fase 5 — Firebase: Leaderboard Global

> Objetivo: enviar o tempo do jogador para o Firestore ao final de uma corrida válida, e exibir o ranking dos melhores tempos da pista.

### Nota de plataforma: build WebGL para itch.io

**Definido:** o alvo de build para o primeiro lançamento é **WebGL, publicado no itch.io**, não Android. O motivo é prático: o suporte a build Android no Unity exige instalar módulos adicionais (Android SDK/NDK/JDK via Unity Hub) que precisam de permissão de administrador na máquina, indisponível no momento. WebGL não tem essa dependência — o módulo **WebGL Build Support** se instala pelo Unity Hub sem precisar de ferramentas externas de outro fabricante.

Isso tem uma implicação direta na integração com Firebase: o **Firebase Unity SDK oficial (o pacote `.unitypackage` de Auth/Firestore usado nas seções 5.3–5.5 abaixo) não suporta o build target WebGL** — ele depende de bibliotecas nativas compiladas para Android/iOS/Desktop, que não existem/não linkam em WebGL. Importar esse SDK e tentar buildar para WebGL resulta em erros de compilação ou `DllNotFoundException` em runtime.

A solução usada por esta seção é **não importar o SDK nativo por enquanto** e falar direto com o **Firebase via REST API**, usando `UnityWebRequest` (que funciona normalmente em WebGL, dentro do navegador). As seções **5.3-WEB / 5.4-WEB / 5.5-WEB** abaixo documentam esse caminho — é o que você deve seguir agora. As seções 5.3/5.4/5.5 "SDK nativo" originais ficam documentadas para quando o suporte a build Android/iOS for viável (outra máquina, ou resolvendo a permissão de admin) — **em aberto** quando isso acontecer.

### 5.1 Criar o projeto no Firebase Console

1. Acesse console.firebase.google.com e faça login com sua conta Google.
2. **Add project** → nome `RallySurvive` → siga o assistente (pode desativar Google Analytics por enquanto, não é necessário pro MVP).
3. Dentro do projeto, vá em **Build → Firestore Database** → **Create database** → escolha modo **production** (vamos configurar regras de segurança manualmente) → escolha a região mais próxima do seu público.

### 5.2 Registrar o app no Firebase

1. No console, ícone de engrenagem → **Project settings** → aba **General** → em "Your apps", clique no ícone **`</>`  (Web)** — é essa a plataforma relevante agora, já que o alvo é WebGL/itch.io.
2. Dê um apelido ao app (ex.: `RallySurvive Web`) e finalize o cadastro. Não é preciso hospedar no Firebase Hosting — só precisamos das credenciais.
3. O console vai mostrar um objeto `firebaseConfig` com campos como `apiKey` e `projectId`. **Guarde esses dois valores** — são o que a seção 5.3-WEB usa para falar com o Firebase via REST (nenhum SDK JS embutido é necessário).
4. Se um dia for buildar para Android/iOS também, volte aqui e registre esses apps adicionalmente (ícone Android/iOS) — vai gerar `google-services.json`/`GoogleService-Info.plist`, usados apenas pela seção 5.3 "SDK nativo" abaixo.

### 5.3 (Fase futura — Android/iOS/Desktop) Importar o Firebase Unity SDK

> **Em aberto:** esta seção fica registrada para quando for possível instalar suporte a build Android/iOS. Não é necessária para o build WebGL atual — pule direto para **5.3-WEB**.

1. Baixe o **Firebase Unity SDK** em firebase.google.com/download/unity.
2. No Unity, `Assets → Import Package → Custom Package`, selecione o `.unitypackage` de **Firestore** (dentro do SDK baixado — vem separado por produto: Auth, Firestore, Analytics, etc.).
3. Importe também o pacote de **Authentication** (vamos usar login anônimo, mais simples pra MVP).
4. Coloque o `google-services.json` (ou `.plist`) na raiz de `Assets/` (o SDK vai processá-lo automaticamente no build).
5. O Unity vai pedir pra resolver dependências automaticamente (**Assets → External Dependency Manager → Android Resolver → Resolve**, se estiver no Android). Aceite e espere terminar (pode demorar alguns minutos).

### 5.4 (Fase futura — Android/iOS/Desktop) Script: `FirebaseBootstrap.cs` (inicialização)

> **Em aberto**, mesma ressalva da 5.3 — não usar agora.

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

### 5.5 (Fase futura — Android/iOS/Desktop) Script: `LeaderboardService.cs`

> **Em aberto**, mesma ressalva da 5.3 — não usar agora. A versão que você vai usar de fato é a **5.5-WEB**, logo abaixo (`LeaderboardServiceWebGL`) — mesmos métodos `SubmitTime`/`GetTopTimes`, só o nome da classe muda, pra deixar claro qual arquivo pertence a qual caminho de integração caso os dois convivam no projeto (o `RaceManager`, seção 5.6, chama a versão WebGL por enquanto).

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

### 5.3-WEB Integração via REST API (WebGL/itch.io — sem SDK nativo)

**Definido:** para WebGL, em vez do SDK nativo, falamos direto com dois serviços do Firebase por HTTPS, usando `UnityWebRequest` (que roda normalmente dentro do navegador em builds WebGL):

- **Identity Toolkit REST API** (`identitytoolkit.googleapis.com`) — faz o login anônimo e devolve um `idToken` (token de autenticação) e um `localId` (equivalente ao `uid`).
- **Firestore REST API** (`firestore.googleapis.com`) — lê/escreve documentos, autenticado com o `idToken` acima no header `Authorization: Bearer`.

Nenhum pacote adicional precisa ser importado no Unity — é tudo `UnityWebRequest` + JSON, já disponíveis. Os dois endpoints suportam **CORS**, então as chamadas funcionam direto do navegador sem precisar de um backend/proxy intermediário.

Você vai precisar só do `apiKey` e do `projectId` que pegou na seção 5.2.

### 5.4-WEB Script: `FirebaseBootstrapWebGL.cs` (login anônimo via REST)

Crie em `Assets/_Project/Scripts/Firebase/FirebaseBootstrapWebGL.cs`:

```csharp
using System;
using UnityEngine;
using UnityEngine.Networking;

public class FirebaseBootstrapWebGL : MonoBehaviour
{
    // Preencha com os valores de Project Settings → General → Your apps → Web app
    private const string ApiKey = "SUA_API_KEY_AQUI";
    public const string ProjectId = "SEU_PROJECT_ID_AQUI";

    public static string IdToken { get; private set; }
    public static string Uid { get; private set; }
    public static bool IsReady { get; private set; }

    [Serializable]
    private class SignUpResponse
    {
        public string idToken;
        public string localId;
        public string refreshToken;
    }

    async void Awake()
    {
        DontDestroyOnLoad(gameObject);

        string url = $"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={ApiKey}";
        string body = "{\"returnSecureToken\":true}";

        using var request = new UnityWebRequest(url, "POST");
        byte[] bodyBytes = System.Text.Encoding.UTF8.GetBytes(body);
        request.uploadHandler = new UploadHandlerRaw(bodyBytes);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");

        await request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"Firebase anonymous sign-in failed: {request.error}\n{request.downloadHandler.text}");
            return;
        }

        var response = JsonUtility.FromJson<SignUpResponse>(request.downloadHandler.text);
        IdToken = response.idToken;
        Uid = response.localId;
        IsReady = true;
        Debug.Log($"Logged in anonymously (REST): {Uid}");
    }
}
```

1. Crie um GameObject vazio `FirebaseBootstrapWebGL` na sua **primeira cena carregada** e arraste o script — mesma posição que o `FirebaseBootstrap` teria na versão SDK nativo.
2. Substitua `SUA_API_KEY_AQUI`/`SEU_PROJECT_ID_AQUI` pelos valores reais do console (a `apiKey` do Firebase **não** é secreta — ela só identifica o projeto; a segurança de verdade vem das regras do Firestore na seção 5.7, que continuam valendo do mesmo jeito para chamadas REST).
3. **Em aberto:** o `idToken` expira em 1h (`expiresIn` na resposta). Para uma corrida de alguns minutos isso não é problema; se sessões mais longas passarem a importar, dá pra trocar o `refreshToken` por um novo `idToken` via `securetoken.googleapis.com/v1/token` quando isso for necessário.

### 5.5-WEB Script: `LeaderboardServiceWebGL.cs`

Crie em `Assets/_Project/Scripts/Firebase/LeaderboardServiceWebGL.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

public class LeaderboardEntry
{
    public string PlayerName;
    public float TimeSeconds;
}

public static class LeaderboardServiceWebGL
{
    private const string BaseUrl = "https://firestore.googleapis.com/v1/projects";

    [Serializable] private class StringValue { public string stringValue; }
    [Serializable] private class DoubleValue { public double doubleValue; }
    [Serializable] private class TimestampValue { public string timestampValue; }

    [Serializable]
    private class LeaderboardFields
    {
        public StringValue playerName;
        public DoubleValue timeSeconds;
        public TimestampValue timestamp;
    }

    [Serializable]
    private class FirestoreDocument
    {
        public string name;
        public LeaderboardFields fields;
    }

    [Serializable] private class RunQueryEntry { public FirestoreDocument document; }

    public static async Task SubmitTime(string track, float timeSeconds, string playerName)
    {
        if (!FirebaseBootstrapWebGL.IsReady) return;

        string uid = FirebaseBootstrapWebGL.Uid;
        string docUrl = $"{BaseUrl}/{FirebaseBootstrapWebGL.ProjectId}/databases/(default)/documents/leaderboards/rallysurvive/{track}/{uid}";

        // Lê o tempo atual do jogador antes de sobrescrever — só salva se for melhor
        using (var getRequest = UnityWebRequest.Get(docUrl))
        {
            getRequest.SetRequestHeader("Authorization", $"Bearer {FirebaseBootstrapWebGL.IdToken}");
            await getRequest.SendWebRequest();

            if (getRequest.result == UnityWebRequest.Result.Success)
            {
                var existing = JsonUtility.FromJson<FirestoreDocument>(getRequest.downloadHandler.text);
                if (existing?.fields?.timeSeconds != null && timeSeconds >= existing.fields.timeSeconds.doubleValue)
                {
                    Debug.Log("Time is not better than the saved personal record — not updating.");
                    return;
                }
            }
            // 404 = ainda não existe registro pra esse jogador — segue normalmente pro PATCH.
        }

        string isoTimestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
        string body = "{\"fields\":{"
            + $"\"playerName\":{{\"stringValue\":\"{Escape(playerName)}\"}},"
            + $"\"timeSeconds\":{{\"doubleValue\":{timeSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture)}}},"
            + $"\"timestamp\":{{\"timestampValue\":\"{isoTimestamp}\"}}"
            + "}}";

        using var patchRequest = new UnityWebRequest(docUrl, "PATCH");
        patchRequest.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(body));
        patchRequest.downloadHandler = new DownloadHandlerBuffer();
        patchRequest.SetRequestHeader("Content-Type", "application/json");
        patchRequest.SetRequestHeader("Authorization", $"Bearer {FirebaseBootstrapWebGL.IdToken}");

        await patchRequest.SendWebRequest();

        if (patchRequest.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"Failed to submit time: {patchRequest.error}\n{patchRequest.downloadHandler.text}");
            return;
        }

        Debug.Log("Time successfully submitted to the leaderboard.");
    }

    public static async Task<List<LeaderboardEntry>> GetTopTimes(string track, int limit = 10)
    {
        var result = new List<LeaderboardEntry>();
        if (!FirebaseBootstrapWebGL.IsReady) return result;

        string parentUrl = $"{BaseUrl}/{FirebaseBootstrapWebGL.ProjectId}/databases/(default)/documents/leaderboards/rallysurvive:runQuery";
        string body = "{\"structuredQuery\":{"
            + $"\"from\":[{{\"collectionId\":\"{track}\"}}],"
            + "\"orderBy\":[{\"field\":{\"fieldPath\":\"timeSeconds\"},\"direction\":\"ASCENDING\"}],"
            + $"\"limit\":{limit}"
            + "}}";

        using var request = new UnityWebRequest(parentUrl, "POST");
        request.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(body));
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        request.SetRequestHeader("Authorization", $"Bearer {FirebaseBootstrapWebGL.IdToken}");

        await request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"Failed to fetch leaderboard: {request.error}\n{request.downloadHandler.text}");
            return result;
        }

        // runQuery devolve um array JSON puro — envolve num objeto pra JsonUtility conseguir ler.
        string wrapped = "{\"items\":" + request.downloadHandler.text + "}";
        var parsed = JsonUtility.FromJson<Wrapper>(wrapped);

        foreach (var entry in parsed.items)
        {
            if (entry.document?.fields == null) continue; // heartbeat sem documento, ignora
            result.Add(new LeaderboardEntry
            {
                PlayerName = entry.document.fields.playerName.stringValue,
                TimeSeconds = (float)entry.document.fields.timeSeconds.doubleValue
            });
        }
        return result;
    }

    [Serializable] private class Wrapper { public RunQueryEntry[] items; }

    private static string Escape(string s) => s.Replace("\\", "\\\\").Replace("\"", "\\\"");
}
```

> Nota: para simplificar, essa versão assume que os nomes dos jogadores não trazem caracteres exóticos além de aspas/barra (tratados em `Escape`). Se mais tarde adicionar um campo de nome livre, vale trocar essa concatenação manual por um serializador JSON de verdade (ex.: `Newtonsoft.Json` via UPM) — não bloqueante para o MVP.

### 5.6 Linha de chegada e envio de tempo ao final da corrida

Quando o carro cruza a linha de chegada, a corrida termina e o tempo é enviado ao Firestore (a checagem de "só salva se for melhor que o recorde pessoal" já está embutida em `LeaderboardServiceWebGL.SubmitTime`, seção 5.5-WEB — nenhuma lógica extra é necessária aqui).

**1. Criar a zona da linha de chegada:**

1. Na cena de corrida, crie um GameObject vazio `FinishLine`, posicionado no ponto final da pista.
2. Adicione um `Polygon Collider 2D` (ou `Box Collider 2D`, se a linha de chegada for reta) e marque `Is Trigger`.
3. Redimensione/rotacione o collider pra cobrir a largura da pista nesse ponto, como uma "porta" que o carro atravessa — mesma lógica de ajuste usada na `TrackValidZone` (seção 3.3).

**2. Script: `FinishLine.cs`**

Crie em `Assets/_Project/Scripts/Track/FinishLine.cs` e coloque no GameObject `FinishLine`:

```csharp
using UnityEngine;

public class FinishLine : MonoBehaviour
{
    // Ao contrário do TrackBoundary (que usa OnTriggerExit2D pra saber
    // quando o carro deixa a pista), aqui o que importa é o instante em
    // que o carro ENTRA na linha de chegada.
    void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Car"))
        {
            RaceManager.Instance.OnRaceFinished();
        }
    }
}
```

**3. Adicionar `OnRaceFinished()` e `SubmitFinishedTime()` ao `RaceManager.cs`** (da Fase 3):

```csharp
public bool Finished { get; private set; } // true enquanto o menu de "digite seu nome" está na tela

public void OnRaceFinished()
{
    if (!RaceActive) return; // evita reabrir o menu se o collider disparar mais de uma vez
    RaceActive = false;
    Finished = true;
    TrackProgress.Instance.ForceComplete(); // garante 100% mesmo que o último waypoint tenha sido pulado — ver Parte 10 §3.7
    Debug.Log($"Race finished! Time: {ElapsedTime}");
    // O envio ao leaderboard só acontece depois que o jogador confirma um nome
    // no FinishMenuUI (item 4 abaixo) — ver SubmitFinishedTime abaixo.
}

public async void SubmitFinishedTime(string playerName)
{
    await LeaderboardServiceWebGL.SubmitTime("desert", ElapsedTime, playerName);
}
```

> O guard `if (!RaceActive) return;` é necessário porque, diferente do `OnCarLeftTrack()` (que agora só pausa e espera input — Fase 3/4), aqui a cena continua rodando enquanto o jogador digita o nome — sem o guard, se o carro ficar oscilando sobre o collider da linha de chegada, `OnTriggerEnter2D` poderia disparar de novo e reabrir o menu.

> Se um dia migrar para a versão SDK nativo (seção 5.5, Android/iOS/Desktop), a chamada dentro de `SubmitFinishedTime` troca só de classe: `LeaderboardService.SubmitTime(...)` no lugar de `LeaderboardServiceWebGL.SubmitTime(...)` — a assinatura do método é idêntica.

> **Em aberto:** o parâmetro `"desert"` está fixo — quando as pistas Floresta e Gelo existirem (seção 7.3), esse valor precisa vir de um campo configurável por cena (ex.: uma variável `[SerializeField] private string trackId` no `RaceManager`, preenchida no Inspector de cada cena) em vez de ficar hardcoded.

**4. Menu de chegada: tempo final, nome do jogador (até 5 caracteres), repetir e voltar ao menu**

> Ver decisão de design na Parte 2 §"Menus de Feedback (Colisão e Chegada)". Quando `RaceManager.Finished` vira `true`, mostra um painel com o tempo final, um campo pra digitar o nome antes de chamar `SubmitFinishedTime`, e dois botões — **Repetir Pista** e **Voltar ao Menu** — sempre disponíveis, mesmo antes de o jogador confirmar um nome.

Estrutura da UI (no mesmo `Canvas` da Fase 4):
1. Crie um painel `FinishPanel` (**UI → Panel**), desativado por padrão.
2. Dentro dele:
   - Um texto TextMeshPro `FinalTimeText`, mesmo formato do `TimerText` (Fase 4, seção 4.1) — mostra o tempo final parado, já que o `TimerText` continua exibindo o mesmo valor por trás do painel.
   - Um `TMP_InputField` chamado `NameInputField` (campo `Character Limit` = `5` no Inspector) e um `Button` chamado `ConfirmButton` com um texto tipo "Confirmar".
   - Um `Button` chamado `RetryButton` com o texto "Repetir Pista".
   - Um `Button` chamado `MainMenuButton` com o texto "Voltar ao Menu".

Script `FinishMenuUI.cs`, em `Assets/_Project/Scripts/UI/FinishMenuUI.cs`:

```csharp
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class FinishMenuUI : MonoBehaviour
{
    private const int MaxNameLength = 5;

    [SerializeField] private GameObject finishPanel;
    [SerializeField] private TMP_Text finalTimeText;
    [SerializeField] private TMP_InputField nameInputField;
    [SerializeField] private Button confirmButton;
    [SerializeField] private Button retryButton;
    [SerializeField] private Button mainMenuButton;

    void Start()
    {
        nameInputField.characterLimit = MaxNameLength; // reforça no código o mesmo limite configurado no Inspector
        confirmButton.onClick.AddListener(OnConfirm);
        retryButton.onClick.AddListener(() => RaceManager.Instance.RetryRace());       // reaproveita o método da Fase 3 (Parte 10 §3.6)
        mainMenuButton.onClick.AddListener(() => RaceManager.Instance.QuitToMainMenu()); // idem
        finishPanel.SetActive(false);
    }

    void Update()
    {
        bool finished = RaceManager.Instance.Finished;
        if (finishPanel.activeSelf != finished)
        {
            finishPanel.SetActive(finished);
            if (finished)
                finalTimeText.text = FormatTime(RaceManager.Instance.ElapsedTime);
        }
    }

    private void OnConfirm()
    {
        string playerName = nameInputField.text.Trim();
        if (string.IsNullOrEmpty(playerName))
            playerName = "PLAYR"; // fallback de 5 caracteres se o jogador confirmar sem digitar nada — ver "Em aberto" na Parte 2

        confirmButton.interactable = false; // evita reenvio duplicado com cliques repetidos
        RaceManager.Instance.SubmitFinishedTime(playerName);
    }

    // Mesmo formato usado em TimerDisplay.cs (Fase 4) e LeaderboardRowUI.cs (Fase 6)
    private static string FormatTime(float time)
    {
        int minutes = Mathf.FloorToInt(time / 60f);
        int seconds = Mathf.FloorToInt(time % 60f);
        int centiseconds = Mathf.FloorToInt((time * 100f) % 100f);
        return $"{minutes:00}:{seconds:00}.{centiseconds:00}";
    }
}
```

> `RetryButton` e `MainMenuButton` chamam diretamente `RaceManager.RetryRace()`/`QuitToMainMenu()` (já existentes desde a Fase 3, seção 3.6, usados pelo `CrashMenuUI`) — nenhum método novo no `RaceManager` é necessário. Como ficam interagíveis o tempo todo (diferente do `ConfirmButton`, que se desativa após o envio), o jogador pode repetir a pista ou voltar ao menu sem precisar salvar o tempo, se preferir.

Arraste o script em qualquer GameObject da cena (ex.: no próprio `FinishPanel`) e ligue `Finish Panel`, `Final Time Text`, `Name Input Field`, `Confirm Button`, `Retry Button` e `Main Menu Button` aos respectivos objetos criados acima.

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

Isso garante que: qualquer um pode **ler** o ranking, mas só o próprio jogador (autenticado, mesmo anonimamente) pode escrever no **seu próprio** documento de tempo. Essas regras valem **igualmente** para as chamadas REST da versão WebGL — o Firestore valida o `idToken` do header `Authorization` do mesmo jeito, não importa se ele chegou via SDK nativo ou via `UnityWebRequest`.

### ✅ Checkpoint da Fase 5 (WebGL)
- Rodar a cena no **Unity Editor** (o REST funciona em qualquer plataforma, então dá pra testar sem precisar buildar WebGL toda hora) → cruzar a linha de chegada → o `FinishPanel` aparece com o tempo final e pedindo um nome (máx. 5 caracteres).
- Digitar um nome e confirmar → aparece no Console "Time successfully submitted to the leaderboard." e `ConfirmButton` fica desativado (evita reenvio).
- Confirmar sem digitar nada → o nome salvo cai no fallback `"PLAYR"` (ver seção 5.6, item 4).
- Sem confirmar nome nenhum, apertar `RetryButton` → a pista recarrega do zero (mesmo efeito do `R` no `CrashMenuUI`, Fase 4 §4.3), sem enviar tempo ao leaderboard.
- Sem confirmar nome nenhum, apertar `MainMenuButton` → tenta carregar `MainMenu` (só funciona de fato a partir da Fase 6), sem enviar tempo ao leaderboard.
- Conferir no Firebase Console (Firestore Database) que o documento foi criado em `leaderboards/rallysurvive/desert/{localId}`, com o `playerName` digitado.
- Chamar `LeaderboardServiceWebGL.GetTopTimes("desert")` (ex.: num script de teste temporário) e confirmar que retorna a lista ordenada.
- Fazer um **build WebGL real** (`File → Build and Run`) e repetir os dois testes acima rodando no navegador — o Editor não pega alguns bugs específicos de CORS/sandbox de WebGL.

#### Problemas comuns
- **`PERMISSION_DENIED` ao escrever:** confira se `FirebaseBootstrapWebGL.IsReady` já é `true` (login anônimo concluído) antes de chamar `SubmitTime` — adicione um log pra confirmar a ordem de execução.
- **Erro 400 "Invalid JSON payload" no PATCH:** normalmente é `timeSeconds` sendo formatado com vírgula em vez de ponto decimal (problema de `CultureInfo` do sistema) — confira se o `ToString(CultureInfo.InvariantCulture)` está presente, como no script acima.
- **CORS bloqueado no navegador:** não deveria acontecer com os domínios `identitytoolkit.googleapis.com`/`firestore.googleapis.com` (eles suportam CORS nativamente); se aparecer, normalmente é sinal de URL/endpoint digitado errado, não um problema de CORS de verdade.
- **Funciona no Editor mas não no build WebGL:** teste sempre via `Build and Run` (que sobe um servidor local automaticamente) — abrir o `index.html` direto do disco (`file://`) quebra por causa das mesmas restrições de CORS do navegador.

Próxima fase: **Fase 6 (Menu Principal e Seleção de Pista)** — usar `GetTopTimes` para montar a tela inicial com as pistas disponíveis e o ranking de cada uma.

---

# Parte 13 — Implementação Unity: Fase 6 (Menu Principal e Seleção de Pista)

## Fase 6 — Menu Principal e Seleção de Pista

> Objetivo: uma cena de menu, carregada antes das pistas, que mostra as 3 pistas do lançamento (Deserto, Floresta, Gelo — ver Parte 2 §"Pistas (3 no lançamento, 1 pós-MVP)"; Noturna fica de fora até entrar em produção) e o grid dos melhores tempos de cada uma, lidos do Firestore via `LeaderboardServiceWebGL.GetTopTimes` (Fase 5).
>
> **Definido** (ver Parte 2 §"Menu Principal"): tocar no botão de uma pista já mostra o ranking daquela pista imediatamente **e troca o background do menu pela imagem daquela pista** (uma imagem de fundo por pista). Para começar a corrida, o jogador precisa **tocar e segurar** o mesmo botão por alguns segundos — não existe um botão "Jogar" separado. Isso evita que um toque rápido/acidental (ex.: rolando a lista) inicie uma corrida sem querer.
>
> Pré-requisito: esta fase assume que as cenas das outras pistas já existem (`RaceForest`, `RaceIce`, duplicadas de `RaceDesert` conforme a seção 7.3) e que você tem 3 imagens de background, uma por pista. Se alguma cena ainda não existir, o menu e o grid de tempos funcionam normalmente — só segurar o botão daquela pista vai falhar ao carregar; nesse caso, desabilite o botão até a cena existir.

### 6.1 Criar a cena de menu

1. Em `Assets/_Project/Scenes/`, crie uma nova cena `MainMenu`.
2. Em `File → Build Settings`, adicione `MainMenu` à lista de cenas e arraste-a para o **topo** (índice 0) — é a cena que carrega primeiro quando o jogo abre.
3. Mova (ou recrie) o GameObject `FirebaseBootstrapWebGL` (Fase 5, seção 5.4-WEB) para esta cena — como o script já usa `DontDestroyOnLoad`, o login anônimo acontece uma vez aqui e continua válido quando o jogador entra numa cena de corrida.

### 6.2 Estrutura de UI

1. Hierarchy → **UI → Canvas** (mesma configuração de `Canvas Scaler → Scale With Screen Size` usada na Fase 4).
2. Antes de tudo, dentro do Canvas, crie uma `Image` chamada `MenuBackground`, esticada pra cobrir a tela inteira (`Anchor` = stretch/stretch) e posicionada **atrás** dos outros elementos na Hierarchy (primeiro filho do Canvas, já que a ordem de renderização segue a ordem de irmãos). É nela que as 3 imagens de pista vão ser trocadas.
3. Crie um painel `TrackListPanel` com 3 botões, um por pista do lançamento: **Deserto**, **Floresta**, **Gelo**. Cada botão precisa de:
   - Um texto TextMeshPro com o nome da pista.
   - Uma `Image` filha chamada `HoldProgress`, `Image Type = Filled` (`Fill Method = Radial 360` ou `Horizontal`, à escolha), começando com `Fill Amount = 0` — é o indicador visual de "quanto falta" pra segurar completar.
4. Crie um painel `LeaderboardPanel` ao lado, com:
   - Um texto `SelectedTrackText` (nome da pista selecionada).
   - Um `Scroll View` (ou uma `Vertical Layout Group` simples, já que são poucas linhas) chamado `LeaderboardContent`, onde as linhas de ranking serão instanciadas.
   - Um texto `LoadingIndicator` ("Carregando...") e um texto `EmptyLeaderboardText` ("Nenhum tempo registrado ainda"), ambos desativados por padrão.
5. Crie um prefab `LeaderboardRow` em `Assets/_Project/Prefabs/UI/`: um `Horizontal Layout Group` com 3 textos TextMeshPro (`RankText`, `NameText`, `TimeText`).
6. Importe as 3 imagens de background (uma por pista) em `Assets/_Project/Sprites/Menu/`, com `Texture Type = Sprite (2D and UI)`.

### 6.3 Script: `LeaderboardRowUI.cs`

Crie em `Assets/_Project/Scripts/UI/LeaderboardRowUI.cs`:

```csharp
using UnityEngine;
using TMPro;

public class LeaderboardRowUI : MonoBehaviour
{
    [SerializeField] private TMP_Text rankText;
    [SerializeField] private TMP_Text nameText;
    [SerializeField] private TMP_Text timeText;

    public void Setup(int rank, string playerName, float timeSeconds)
    {
        rankText.text = $"{rank}º";
        nameText.text = playerName;
        timeText.text = FormatTime(timeSeconds);
    }

    // Mesmo formato usado em TimerDisplay.cs (Fase 4) — mantém o tempo consistente entre HUD e menu.
    private static string FormatTime(float time)
    {
        int minutes = Mathf.FloorToInt(time / 60f);
        int seconds = Mathf.FloorToInt(time % 60f);
        int centiseconds = Mathf.FloorToInt((time * 100f) % 100f);
        return $"{minutes:00}:{seconds:00}.{centiseconds:00}";
    }
}
```

Arraste o script no prefab `LeaderboardRow` e ligue os 3 campos aos respectivos `TMP_Text` no Inspector.

### 6.4 Script: `TrackButtonHold.cs`

> **Em aberto:** a duração exata do "segurar" (placeholder abaixo: 1,5s) não está fechada — ajustar depois de testar em dispositivo real; segurar demais frustra, segurar de menos deixa fácil demais iniciar sem querer.

Crie em `Assets/_Project/Scripts/UI/TrackButtonHold.cs`:

```csharp
using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class TrackButtonHold : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
{
    [SerializeField] private Image holdProgressImage; // Image Type = Filled — preenche conforme o jogador segura
    [SerializeField] private float holdDurationSeconds = 1.5f; // placeholder — Em aberto

    public event Action OnTap;          // dispara assim que o dedo/mouse encosta no botão
    public event Action OnHoldComplete; // dispara só se o toque durar holdDurationSeconds sem soltar

    private bool _isHolding;
    private bool _completed;
    private float _holdStartTime;

    public void OnPointerDown(PointerEventData eventData)
    {
        _isHolding = true;
        _completed = false;
        _holdStartTime = Time.time;
        OnTap?.Invoke();
    }

    public void OnPointerUp(PointerEventData eventData) => CancelHold();
    public void OnPointerExit(PointerEventData eventData) => CancelHold(); // dedo saiu da área do botão

    private void Update()
    {
        if (!_isHolding || _completed) return;

        float elapsed = Time.time - _holdStartTime;
        if (holdProgressImage != null)
            holdProgressImage.fillAmount = Mathf.Clamp01(elapsed / holdDurationSeconds);

        if (elapsed >= holdDurationSeconds)
        {
            _completed = true;
            _isHolding = false;
            OnHoldComplete?.Invoke();
        }
    }

    private void CancelHold()
    {
        _isHolding = false;
        if (!_completed && holdProgressImage != null)
            holdProgressImage.fillAmount = 0f;
    }
}
```

Arraste o script em cada botão de pista (o mesmo GameObject que tem a `Image` de fundo do botão) e ligue o campo `holdProgressImage` à `Image` filha `HoldProgress` criada na seção 6.2.

### 6.5 Script: `MainMenuController.cs`

Crie em `Assets/_Project/Scripts/UI/MainMenuController.cs`:

```csharp
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using TMPro;

[System.Serializable]
public class TrackOption
{
    public string TrackId;         // ex.: "desert" — mesmo valor usado no SubmitTime/GetTopTimes (Fase 5)
    public string SceneName;       // ex.: "RaceDesert"
    public string DisplayName;     // ex.: "Deserto"
    public Sprite BackgroundSprite; // imagem de fundo do menu para essa pista
    public TrackButtonHold HoldButton;
}

public class MainMenuController : MonoBehaviour
{
    [SerializeField] private List<TrackOption> tracks = new();
    [SerializeField] private Image menuBackground;
    [SerializeField] private TMP_Text selectedTrackText;
    [SerializeField] private Transform leaderboardContent;
    [SerializeField] private GameObject leaderboardRowPrefab;
    [SerializeField] private GameObject loadingIndicator;
    [SerializeField] private GameObject emptyLeaderboardText;

    private void Start()
    {
        foreach (var track in tracks)
        {
            var capturedTrack = track; // evita o bug clássico de closure sobre a variável do loop
            capturedTrack.HoldButton.OnTap += () => SelectTrack(capturedTrack);
            capturedTrack.HoldButton.OnHoldComplete += () => PlayTrack(capturedTrack);
        }

        if (tracks.Count > 0)
            SelectTrack(tracks[0]); // pré-seleciona a primeira pista só pro grid e o background já aparecerem preenchidos ao abrir o menu
    }

    private async void SelectTrack(TrackOption track)
    {
        selectedTrackText.text = track.DisplayName;
        menuBackground.sprite = track.BackgroundSprite;

        ClearLeaderboardRows();
        loadingIndicator.SetActive(true);
        emptyLeaderboardText.SetActive(false);

        var topTimes = await LeaderboardServiceWebGL.GetTopTimes(track.TrackId);

        loadingIndicator.SetActive(false);

        if (topTimes.Count == 0)
        {
            emptyLeaderboardText.SetActive(true);
            return;
        }

        for (int i = 0; i < topTimes.Count; i++)
        {
            var row = Instantiate(leaderboardRowPrefab, leaderboardContent);
            row.GetComponent<LeaderboardRowUI>().Setup(i + 1, topTimes[i].PlayerName, topTimes[i].TimeSeconds);
        }
    }

    private void ClearLeaderboardRows()
    {
        foreach (Transform child in leaderboardContent)
            Destroy(child.gameObject);
    }

    private void PlayTrack(TrackOption track)
    {
        SceneManager.LoadScene(track.SceneName);
    }
}
```

> Se um dia migrar para o SDK nativo (seção 5.5, Android/iOS/Desktop), a única troca aqui é `LeaderboardServiceWebGL.GetTopTimes` → `LeaderboardService.GetTopTimes` — mesma assinatura, igual já documentado na Fase 5.

### 6.6 Configurar no Inspector

1. Crie um GameObject vazio `MainMenuController` na cena `MainMenu` e arraste o script.
2. Preencha a lista `tracks` com 3 entradas, uma por pista do lançamento:

   | TrackId | SceneName | DisplayName | BackgroundSprite |
   |---|---|---|---|
   | `desert` | `RaceDesert` | Deserto | imagem de fundo do Deserto |
   | `forest` | `RaceForest` | Floresta | imagem de fundo da Floresta |
   | `ice` | `RaceIce` | Gelo | imagem de fundo do Gelo |

3. Arraste o botão correspondente de `TrackListPanel` (já com o `TrackButtonHold` da seção 6.4) no campo `HoldButton` de cada entrada, e a respectiva imagem importada na seção 6.2 no campo `BackgroundSprite`.
4. Ligue `menuBackground` (a `Image` `MenuBackground` da seção 6.2), `selectedTrackText`, `leaderboardContent` (o `Transform` do `LeaderboardContent`), `leaderboardRowPrefab` (o prefab `LeaderboardRow`), `loadingIndicator` e `emptyLeaderboardText` aos respectivos objetos criados na seção 6.2.

### ✅ Checkpoint da Fase 6
- Dar Play na cena `MainMenu` → a primeira pista (Deserto) já aparece selecionada, o background mostra a imagem do Deserto, e o grid mostra os tempos existentes no Firestore (ou o texto de "nenhum tempo ainda", se a coleção estiver vazia).
- Tocar rapidamente em outra pista (sem segurar) atualiza `SelectedTrackText`, troca o background pra imagem daquela pista, e recarrega o grid com os tempos dela, sem iniciar a corrida.
- Tocar e segurar um botão de pista preenche visualmente o `HoldProgress` até completar e só então carrega a cena de corrida correspondente.
- Soltar o dedo/mouse (ou arrastar pra fora do botão) antes de completar cancela o hold e zera o preenchimento, sem iniciar a corrida.
- Completar uma corrida (Fase 5) e voltar ao menu mostra o novo tempo refletido no grid (se foi o melhor tempo daquele jogador).

#### Problemas comuns
- **Grid nunca sai de "Carregando...":** confira se `FirebaseBootstrapWebGL.IsReady` já é `true` antes do menu tentar buscar os tempos — se o `MainMenuController.Start()` rodar antes do login anônimo terminar, `GetTopTimes` retorna lista vazia silenciosamente (ver Fase 5, `IsReady`). Se isso acontecer com frequência, vale adicionar um `await` esperando `IsReady` ficar `true` antes da primeira chamada.
- **Segurar não carrega a cena:** confira se `SceneName` na lista `tracks` bate exatamente com o nome da cena em `Build Settings` (case-sensitive), e se a cena foi de fato adicionada ao Build Settings.
- **Background não troca (ou fica em branco):** confira se `BackgroundSprite` foi preenchido pra cada entrada de `tracks` e se `menuBackground` está ligado no Inspector — um `Image` sem `sprite` atribuído fica transparente/branco, não dá erro.
- **`HoldProgress` não preenche:** confira se a `Image` está com `Image Type = Filled` (uma `Image` normal ignora `fillAmount`).
- **Hold completa mesmo arrastando o dedo pra fora do botão:** em touchscreens isso pode acontecer se o Canvas não tiver um `Graphic Raycaster` corretamente configurado — confirme que o `EventSystem` da cena está ativo e que nenhum outro elemento de UI está sobrepondo o botão e bloqueando o `OnPointerExit`.
- **Linhas de ranking duplicadas ao trocar de pista várias vezes:** confira se `ClearLeaderboardRows()` está sendo chamado antes de instanciar as novas linhas — sintoma comum de esquecer de destruir os filhos antigos de `leaderboardContent`.

Próxima fase: **Fase 7 (Build e Próximos Passos)** — gerar um build de teste e o que vem depois.

---

# Parte 14 — Implementação Unity: Fase 7 (Build e Próximos Passos)

## Fase 7 — Build de Teste e Próximos Passos

### 7.1 Gerar um build de teste (WebGL)

**Definido:** a plataforma de build é **WebGL** — é a única que não depende de módulos extras bloqueados pela falta de permissão de admin (ver nota de plataforma na Parte 12).

1. `File → Build Settings` → selecione **WebGL** → **Switch Platform** (só na primeira vez; pode demorar alguns minutos).
2. Clique **Add Open Scenes** para incluir sua cena atual.
3. Em **Player Settings → Publishing Settings**, configure o **Compression Format**: itch.io às vezes não envia o header `Content-Encoding` correto para arquivos comprimidos, o que causa tela branca ao carregar. Duas soluções:
   - Marque **Decompression Fallback** (mantém compressão, o próprio JS do build descomprime no navegador) — mais seguro pra itch.io, recomendado; ou
   - Mude **Compression Format** para **Disabled** (build maior no download, mas elimina o problema por completo).
4. Clique **Build** e escolha uma pasta de saída (ex.: `Builds/WebGL/`).
5. Teste local: use **`File → Build and Run`** (o Unity sobe um servidor local automaticamente) — abrir o `index.html` direto do disco (`file://`) não funciona, por restrição de CORS do navegador.

### 7.1-B Publicar no itch.io

1. Compacte o **conteúdo** da pasta de build em `.zip` (o `index.html` precisa estar na raiz do zip, não dentro de uma subpasta).
2. No itch.io, crie o projeto (ou edite um existente) → **Kind of project: HTML**.
3. Faça upload do `.zip` e marque a caixa **"This file will be played in the browser"**.
4. Em **Embed options**, defina a resolução (viewport) igual à configurada em `Player Settings → Resolution and Presentation` no Unity, pra evitar barras de rolagem/corte.
5. Publique como rascunho primeiro (visibilidade "Draft"/link restrito) e teste o link antes de tornar público.

### 7.2 Checklist antes de considerar o MVP "pronto"

- [ ] Carro se move corretamente em direção ao mouse, com aceleração exponencial suave.
- [ ] Partículas de movimento aparecem atrás do carro e trocam de preset corretamente (respingo só dentro de poça na Floresta, gelo/neve na cena Gelo) — Fase 1, seção 1.5.
- [ ] Chevrons aparecem e mudam de cor corretamente (verde/vermelho).
- [ ] Sair da pista reinicia a corrida e zera o tempo.
- [ ] Cronômetro visível e correto.
- [ ] Barra de velocidade (velocidade real, pós-grip) e % da pista percorrida atualizam corretamente durante a corrida (Fase 4, seções 4.4–4.5).
- [ ] Grip por pista funciona: Deserto sem modificador perceptível, Floresta escorrega só dentro das poças, Gelo escorrega o traçado inteiro (Fase 3, seções 3.8–3.10).
- [ ] Chuva ambiente aparece na `RaceForest` e não em nenhuma outra pista (Fase 3, seção 3.11).
- [ ] Ao cruzar a linha de chegada, a tela de chegada aparece com o tempo final e permite enviar o tempo, repetir a pista ou voltar ao menu (Fase 5, seção 5.6).
- [ ] Ao cruzar a linha de chegada, tempo é enviado ao Firestore via `LeaderboardServiceWebGL` (se for melhor que o recorde pessoal).
- [ ] Regras de segurança do Firestore configuradas (não deixado em modo "aberto" por engano).
- [ ] Testado no navegador via o link real do itch.io (não só no Unity Editor) — cobre bugs de CORS/sandbox que só aparecem fora do Editor.
- [ ] Menu principal mostra as 3 pistas do lançamento, troca o background ao selecionar cada uma, e carrega a cena correta ao segurar o botão.
- [ ] Grid de melhores tempos do menu bate com os documentos reais em `leaderboards/rallysurvive/{pista}` no Firestore.

### 7.3 Floresta e Gelo já nascem junto com o Deserto

Diferente de versões anteriores deste guia, as pistas Floresta e Gelo não são mais um passo "depois" — elas nascem na própria Fase 3 (Parte 10 §3.12), a partir do Scene Template salvo da `RaceDesert`. Se você seguiu o guia em ordem, as 3 já existem e o Checklist §7.2 acima já cobre as três.

**Noturna** (pós-MVP): quando entrar em produção, segue o mesmo pipeline (Parte 10 §3.12) — nova cena a partir do template, mais uma entrada em `MainMenuController.tracks` (seção 6.6) com seu próprio `BackgroundSprite`.

### 7.4 Como isso conecta com os outros 2 jogos do GDD

- **Navigation Expert:** reaproveita 100% do `CarController`, `CarParticles` e `ChevronGuide` sem mudança. Você vai *trocar* o `TrackBoundary`/`RaceManager` por um sistema de checkpoints (novo script `CheckpointManager.cs`) e adicionar o minimapa + seta direcional — dá pra fazer uma sessão de implementação dedicada pra isso quando chegar a hora.
- **RaceLegenda:** também reaproveita `CarController`/`ChevronGuide`, incluindo o sistema de grip/`CarTerrainSensor` (Parte 10 §3.8–3.10) já pronto — só troca o que dispara ao sair da pista (aqui, perda de grip temporária em vez de reinício) e adiciona voltas múltiplas no `RaceManager`. Mais o sistema de setup do carro e o multiplayer via Firebase Realtime Database (esse último é bem mais complexo — merece uma sessão de implementação própria, depois de fecharmos os detalhes de sala/sincronização que você quer discutir).

### 7.5 O que fica pra uma próxima sessão de implementação
- **Definido:** padrão de pixel art 32px por tile / Pixels Per Unit 32 (carro ~48px de sprite). Primeira leva de arte (carro, `ChevronGuide`, poça, tilesets de terreno das 3 pistas de lançamento e decoração — pedra, cacto, árvore, banco de neve) já gerada via PixelLab e organizada em `Sprites/RallySurvive/` neste repositório. Falta importar no Unity com os import settings corretos (Pixel Perfect Camera, filtro Point/no filter) — ver Parte 8 §0.5 e §1.1.
- Trocar sprites placeholder pelo pixel art final dentro da cena Unity (a arte em si já existe; falta o passo de importação/atribuição).
- Calibrar os valores exatos de grip (Gelo, poça da Floresta) e de `steeringResponsiveness` com playtesting real — hoje são placeholders (Parte 10 §3.8-3.9).
- Sistema de áudio (motor, derrapagem — o som já tem um gancho natural no mesmo `CurrentGrip`/`InPuddle` que já dirige as partículas, Fase 1 §1.5).
- UI de ranking pós-corrida (ler `GetTopTimes` e mostrar numa tela de "Resultados" ao final de uma corrida, além do grid já disponível no menu — Fase 6).

---

Isso fecha o pipeline completo do RallySurvive, do zero até o leaderboard funcionando. Quando quiser, seguimos com uma sessão só pra **Navigation Expert** (checkpoints + minimapa) ou pra fechar os detalhes de sala do multiplayer do RaceLegenda.

---

# Parte 15 — Visão Futura: Versão 3D Topdown

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

**Sem mudanças.** O `Canvas` (Screen Space - Overlay) funciona da mesma forma independente da câmera ser 2D ou 3D por baixo. Os scripts `TimerDisplay.cs`, `RaceManager.cs` e toda a camada de `LeaderboardServiceWebGL.cs`/Firebase são reaproveitados **sem nenhuma alteração** — eles não sabem (nem precisam saber) se a cena é 2D ou 3D.

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
