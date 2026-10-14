# GDD — Projeto Hex (nome de trabalho)

> Documento vivo. Rascunho inicial: a ideia ainda está sendo amadurecida, então este GDD separa com cuidado o que já foi **Definido** do que está **Em aberto**. Os números de balanceamento (custos, tempos de coleta, tamanho do mapa) ainda não foram decididos: os valores da tabela §17 e do Guia de Implementação Unity (Parte 2 em diante) são **placeholders de MVP**, não decisões fechadas.
>
> "Projeto Hex" é só um nome de trabalho para arquivos, pastas e namespace do código. O nome do jogo está **Em aberto**.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Unity](#parte-2--guia-de-implementação-unity)
3. [Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-3--implementação-unity-fase-0-setup-do-projeto)
4. [Parte 4 — Implementação Unity: Fase 1 (Coordenadas Hexagonais)](#parte-4--implementação-unity-fase-1-coordenadas-hexagonais)
5. [Parte 5 — Implementação Unity: Fase 2 (Dados e Mundo)](#parte-5--implementação-unity-fase-2-dados-e-mundo)
6. [Parte 6 — Implementação Unity: Fase 3 (Mapa na Tela e Câmera)](#parte-6--implementação-unity-fase-3-mapa-na-tela-e-câmera)
7. [Parte 7 — Implementação Unity: Fase 4 (Coleta por Tempo)](#parte-7--implementação-unity-fase-4-coleta-por-tempo)
8. [Parte 8 — Implementação Unity: Fase 5 (Construir e Explorar)](#parte-8--implementação-unity-fase-5-construir-e-explorar)
9. [Parte 9 — Implementação Unity: Fase 6 (Rival IA)](#parte-9--implementação-unity-fase-6-rival-ia)
10. [Parte 10 — Implementação Unity: Fase 7 (Save Local e Progresso Offline)](#parte-10--implementação-unity-fase-7-save-local-e-progresso-offline)
11. [Parte 11 — Implementação Unity: Fase 8 (Build e Próximos Passos)](#parte-11--implementação-unity-fase-8-build-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Nome:** **Em aberto** ("Projeto Hex" é nome de trabalho).
- **Gênero:** **Definido:** estratégia de expansão e construção sobre mapa hexagonal, com coleta de recursos por tempo (estilo idle) e progresso offline. Sandbox sem fim, com rivais controlados por IA.
- **Dimensão:** **Definido:** 2D.
- **Câmera/perspectiva:** **Definido:** isométrica, feita com sprites 2D desenhados em perspectiva isométrica sobre uma grade hexagonal.
- **Plataforma-alvo:** **Definido:** PC (Steam/Itch), Mobile e Web (WebGL). Input por mouse e por toque desde o MVP.
- **Referência principal:** **Definido:** *Catan*: hexágonos de recurso, construções nas interseções entre hexágonos, estradas nas arestas, vila que vira cidade. A grande diferença é que aqui **não há dados nem turnos: tudo é por tempo**.
- **Outras referências/inspirações:** **Em aberto**.
- **Pilar de design:** **Em aberto**. Proposta para discutir, não decidida: *"Ver a névoa virar um reino: cada hexágono revelado é uma escolha de onde crescer, e cada interseção vale mais quando o rival também quer ela."*

## 2. Loop Principal

**Definido:**

1. Você começa com uma **vila pequena** numa interseção do mapa, com alguns hexágonos ao redor já conhecidos.
2. O resto do mapa está coberto por névoa. Você **explora** mandando **batedores**, que levam um tempo para revelar um hexágono (§6).
3. Cada hexágono tem um **tipo** (mina, trigo, lã, argila, rio...) que produz um recurso (§3).
4. Você **constrói nas interseções** (os cantos onde 3 hexágonos se encontram). Uma construção passa a **coletar os recursos dos hexágonos que ela toca** (§4).
5. **Tudo é por tempo:** cada hexágono leva X tempo para produzir. A coleta continua mesmo com o jogo fechado (§10).
6. Os recursos pagam **construções, unidades e melhorias** (§4, §7, §8), que aumentam o território e a produção.
7. Um **rival IA** disputa as mesmas interseções (§9).

O jogo **não tem fim** (§11): o loop é crescer, explorar e disputar espaço.

> **Em aberto:** a frase original da ideia terminou em "você pode ir..." e ficou incompleta. Pode ser uma mecânica de movimento (ir até um lugar? ir com uma unidade?) que ainda não está no documento.

## 3. O Mapa Hexagonal

- **Definido:** o mapa é uma grade de hexágonos. Cada hexágono tem um tipo de terreno que produz um recurso.
- **Definido:** os tipos já citados:

| Terreno | Recurso produzido |
|---|---|
| Mina | Minério |
| Campo de trigo | Trigo |
| Pasto | Lã |
| Barreiro | Argila |
| Rio | Peixe (água/peixe; o nome final do recurso está **Em aberto**) |

- **Em aberto:** outros terrenos. A ideia original lista "mina, trigo, lã, argila, rio...", então podem existir mais. O Catan tem **floresta/madeira**, que falta aqui e é a base de estradas e vilas no jogo de tabuleiro. Também há o deserto, que não produz nada.
- **Em aberto:** tamanho e formato do mapa. Ele é fixo e gerado por seed? Cresce para sempre, já que o jogo é sem fim? Feito à mão? **Placeholder de MVP:** mapa hexagonal de raio 7 (169 hexágonos), gerado por seed, com terreno sorteado por peso.
- **Em aberto:** algum equivalente às "fichas de número" do Catan, que deixam alguns hexágonos melhores que outros (ex.: um trigo que produz a cada 15 s e outro a cada 40 s). No MVP, o tempo vem só do tipo de terreno.
- **Em aberto (placeholder de MVP):** início justo. As 3 casas em volta da vila inicial são sempre de terrenos diferentes, para ninguém começar só com rio.

## 4. Construções

- **Definido:** as construções do Catan:
  - **Vila:** construída numa interseção, coleta dos hexágonos que toca.
  - **Cidade:** upgrade da vila, coleta mais.
  - **Estrada:** construída numa aresta (o lado entre dois hexágonos).
- **Definido:** uma interseção toca até 3 hexágonos, e a construção nela coleta de todos eles.
- **Em aberto:** regras de posicionamento. Todas estão no código do MVP como opções do `GameConfig`, com o valor padrão marcado como placeholder:
  - **Regra de distância** do Catan: não pode construir colado em outra construção. Placeholder: **ligada**.
  - **Precisa de estrada** chegando na interseção, como no Catan. Placeholder: **ligada**. É isso que dá função às estradas no MVP.
  - **Precisa ter explorado** os hexágonos em volta. Placeholder: todos os hexágonos que a interseção toca precisam estar revelados.
- **Em aberto:** quanto a cidade produz a mais. Placeholder: vila 1×, cidade 2×, como no Catan.
- **Em aberto:** se existem outras construções (porto no rio, muralha, mercado, quartel...).
- **Em aberto:** se construir leva tempo (canteiro de obras com timer) ou é instantâneo. Placeholder de MVP: instantâneo.

## 5. Coleta por Tempo

- **Definido:** não há dados nem turnos. Cada hexágono produz seu recurso em ciclos de X segundos, e cada construção que o toca recebe a produção.
- **Placeholder de MVP:** cada hexágono tem um único relógio. Quando o ciclo fecha, **todas** as construções que o tocam recebem o recurso, de qualquer dono. É o equivalente por tempo a "o número do hexágono saiu no dado".
- **Em aberto:** a coleta vai direto para o estoque (automática) ou o jogador precisa tocar para recolher (estilo idle mobile)? Placeholder de MVP: automática.
- **Em aberto:** existe limite de estoque (armazém)?
- **Em aberto:** os tempos de cada recurso. Placeholders na §17.

## 6. Exploração e Batedores

- **Definido:** o mapa começa coberto por névoa. Você explora mandando um **batedor** (uma unidade), que leva X tempo para revelar um hexágono.
- **Placeholder de MVP:**
  - O batedor só pode ir para um hexágono que **encosta num já conhecido** (a "fronteira").
  - O batedor é reutilizável: ele volta quando termina e pode ser mandado de novo.
  - O jogo começa com 1 batedor. Treinar outro custa recursos (§17), com limite de 3.
  - Cada missão leva um tempo fixo (60 s) e revela 1 hexágono.
- **Em aberto:** o batedor anda visivelmente pelo mapa ou é só um timer? O tempo depende da distância? O batedor pode se perder ou ser pego pelo rival?
- **Em aberto:** a exploração traz algo além do terreno (ruínas, tesouros, eventos)?

## 7. Unidades

- **Definido:** recursos treinam unidades.
- **Definido:** batedores (§6) entram no MVP.
- **Definido (pós-MVP):** soldados, ligados ao conflito com rivais (§9).
- **Em aberto:** outros tipos de unidade, limite de unidades, se elas têm manutenção (consomem comida/peixe com o tempo) e se o treino leva tempo.

## 8. Melhorias e Tecnologia

- **Definido:** recursos pagam melhorias/pesquisas que aumentam a produção ou reduzem o tempo de coleta.
- **Definido:** fica fora do MVP (§16).
- **Em aberto:** a lista de melhorias, se a pesquisa leva tempo e se é uma árvore de tecnologia ou uma lista simples.

## 9. Rivais IA

- **Definido:** existem vilas rivais controladas pela IA, que interagem com você de três formas:
  - **Disputa de espaço:** a IA também explora e constrói. Quem construir primeiro numa interseção fica com ela.
  - **Comércio:** trocar recursos com o rival, como as trocas do Catan.
  - **Conflito:** o rival pode atacar ou roubar, e você precisa de defesa (soldados, §7).
- **Definido:** o MVP tem **1 rival que só disputa espaço**. Comércio e conflito ficam para depois (§16).
- **Em aberto:** quantos rivais existem, se eles têm personalidades diferentes (expansionista, comerciante, agressivo), como o comércio funciona (preços fixos? o rival propõe?) e como o conflito funciona (combate automático? destrói construções? rouba estoque?).
- **Placeholder de MVP:** a névoa é separada por jogador. Você só vê as construções do rival que estão encostadas em hexágonos que você já explorou.

## 10. Progresso Offline

- **Definido:** idle real. O tempo continua correndo com o jogo fechado e, ao voltar, você recebe o que foi produzido enquanto esteve fora, até um limite.
- **Em aberto:** o valor do limite. Placeholder de MVP: 8 horas.
- **Em aberto:** o rival também progride enquanto você está fora? Placeholder de MVP: **sim**, porque o mundo inteiro é simulado junto (também sobre os batedores que estavam em missão).
- **Em aberto:** o que fazer com quem adianta o relógio do aparelho para trapacear. Sem backend (§15), o MVP confia no relógio do aparelho e só ignora o relógio voltando para trás.
- **Placeholder de MVP:** ao voltar, uma tela mostra "Você ficou fora por Xh: +N de cada recurso".

## 11. Progressão de Longo Prazo

- **Definido:** sandbox sem fim e sem condição de vitória.
- **Em aberto (risco principal, ver §18):** o que mantém o jogador jogando depois de algumas horas: mapa que expande, novos terrenos desbloqueados, metas/conquistas, rivais mais fortes com o tempo, prestígio/recomeço com bônus...

## 12. Estilo Visual

- **Definido:** 2D isométrico, com hexágonos desenhados como peças com volume (a face de cima mais a lateral).
- **Em aberto:** estilo de arte (pixel art? vetor flat como a franquia Rally? pintado à mão?), paleta e tema (medieval? fantasia?).
- **Em aberto:** a altura visual do hexágono isométrico. Ela define o "achatamento" vertical da grade (`isoYScale` no código, placeholder 0.6) e precisa bater com a arte.
- O MVP do guia Unity usa formas geométricas coloridas como placeholder (hexágono do próprio Unity tingido pela cor do terreno).

## 13. HUD / UI

- **Placeholder de MVP:**
  - Barra de recursos no topo: os 5 recursos e os batedores (livres/total).
  - Botão "Treinar batedor".
  - Ao tocar no mapa, um painel de ação para o alvo:
    - **Interseção:** construir vila / virar cidade.
    - **Aresta:** construir estrada.
    - **Hexágono na névoa:** enviar batedor.
    - **Hexágono revelado:** informações de produção.
  - Barrinha de progresso do ciclo em cada hexágono que produz para você.
  - Tela de "enquanto você esteve fora".
- **Em aberto:** layout final, orientação no mobile (retrato ou paisagem) e se haverá notificações push ("seu armazém encheu", "o batedor voltou").

## 14. Áudio

- **Em aberto.**

## 15. Backend / Serviços

- **Definido:** MVP **offline, com save local**. Sem conta, sem servidor e sem leaderboard. O progresso offline usa o relógio do aparelho.
- **Em aberto:** save na nuvem (ex.: Firebase, como os outros jogos do estúdio) e checagem de horário pelo servidor contra fraude de relógio no pós-MVP.

## 16. Escopo do MVP

**Definido:** o loop básico mais **1 rival IA que só disputa espaço**.

Entra no MVP:
- Mapa hexagonal isométrico 2D com névoa.
- 5 terrenos: mina, trigo, pasto, barreiro, rio.
- Vila, cidade e estrada.
- Coleta por tempo.
- Batedores para explorar.
- 1 rival IA que explora e constrói, disputando interseções.
- Save local e progresso offline.
- PC, Mobile e Web.

Fica para depois:
- Comércio e conflito com rivais.
- Soldados.
- Melhorias/tecnologia.
- Outros terrenos.
- Mais rivais.
- Arte final.
- Áudio.
- Save na nuvem.

## 17. Placeholders de Balanceamento

> Todos os valores são **placeholders de MVP** e ficam no asset `GameConfig` (Fase 2 do guia), para ajustar sem mexer em código. A falta de madeira (§3) obriga custos diferentes dos do Catan.

| Item | Valor placeholder |
|---|---|
| Raio do mapa | 7 (169 hexágonos) |
| Ciclo do Trigo / Lã / Argila / Peixe / Minério | 20 s / 25 s / 30 s / 30 s / 45 s (1 unidade por ciclo) |
| Produção por vila / cidade | 1× / 2× |
| Vila | 1 Argila, 1 Lã, 1 Trigo, 1 Peixe |
| Cidade (upgrade) | 3 Minério, 2 Trigo |
| Estrada | 1 Argila, 1 Minério |
| Treinar batedor | 1 Trigo, 1 Peixe (máx. 3 batedores; começa com 1) |
| Missão do batedor | 60 s, revela 1 hexágono |
| Recursos iniciais | 3 Argila, 2 Minério, 2 Lã, 3 Trigo, 2 Peixe |
| Limite do progresso offline | 8 h |
| Rival: intervalo de decisão | 20 s |
| Rival: distância inicial | 5 hexágonos do jogador |

## 18. Riscos / Em aberto (consolidado)

- **Nome do jogo.**
- **Pilar de design** (há uma proposta na §1).
- **Motivação de longo prazo num jogo sem fim** (§11). É o maior risco de design: sem metas, um idle sandbox perde o jogador cedo.
- Frase incompleta da ideia: "você pode ir..." (§2).
- Outros terrenos, principalmente madeira (§3).
- Tamanho, formato e geração do mapa, e um equivalente às fichas de número (§3).
- Regras de posicionamento: distância, estrada obrigatória, exploração obrigatória (§4).
- Construção instantânea ou com timer (§4).
- Coleta automática ou manual, e limite de estoque (§5).
- Detalhes do batedor: movimento visível, tempo por distância, riscos (§6).
- Lista de unidades e manutenção (§7).
- Melhorias/tecnologia (§8).
- Número de rivais, comércio e conflito (§9).
- Limite offline, rival progredindo offline e fraude de relógio (§10).
- Estilo de arte e altura do hexágono isométrico (§12).
- Orientação no mobile e notificações (§13).
- Áudio (§14).
- Save na nuvem (§15).

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para implementar o MVP do Projeto Hex em Unity 6. Os números vêm da tabela de placeholders da Parte 1 §17 e ficam em um asset (`GameConfig`), para dar para balancear sem mexer no código. As regras marcadas como **Em aberto** na Parte 1 viram opções (`bool`) do `GameConfig`, para trocar de ideia sem reescrever nada.

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele.
- **Namespaces** (troque `ProjetoHex` pelo nome do jogo quando ele for decidido):
  - `ProjetoHex.Grid`: matemática da grade hexagonal (hexágono, interseção, aresta, conversão para a tela).
  - `ProjetoHex.Data`: tipos de recurso, ScriptableObjects de terreno e de configuração.
  - `ProjetoHex.Sim`: o estado do mundo e as regras do jogo, em C# puro (sem `MonoBehaviour`).
  - `ProjetoHex.View`: desenhar o mapa, câmera e toque/clique no mapa.
  - `ProjetoHex.Meta`: `GameManager`, save e progresso offline.
  - `ProjetoHex.UI`: barra de recursos e painéis.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Textos na tela sem emoji**, porque a fonte padrão do TextMeshPro não tem emojis.

## Arquitetura em uma página

```
 Input (mouse/toque)           GameManager (relógio + save)              Tela
 ───────────────────           ────────────────────────────              ────
 MapPointer ──Tapped──▶ ActionPanel ──▶ WorldActions ──▶ World ──Changed──▶ MapView / HexTileView
   (pan, zoom, toque)            (UI)       (regras:            ▲              ResourceBar (lê o estoque)
                                            BuildRules,         │
                                            ScoutRules)         │
                     Update ──▶ Simulation.Tick(dt) ────────────┤  (coleta + batedores)
                                RivalAI.Tick(dt) ───────────────┘  (mesmas WorldActions do jogador)
                     Awake ───▶ SaveSystem.TryLoad ──▶ tempo fora ──▶ vários Tick() seguidos
```

- **Regra de ouro:** todo o jogo (mapa, estoque, construções, timers) mora no objeto `World`, que é C# puro. Só três coisas mudam o `World`:
  1. `WorldActions`: ações do jogador e do rival, sempre checadas pelas regras.
  2. `Simulation.Tick`: a passagem do tempo.
  3. O load do save.

  A tela só lê o `World` e redesenha quando ele avisa (`Changed`).
- **Por que isso importa aqui:** o progresso offline (Fase 7) é só rodar `Simulation.Tick` várias vezes seguidas, sem tela nenhuma. E o rival IA (Fase 6) usa as mesmas `WorldActions` que o jogador, então nunca trapaceia nas regras.

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, organizado e com os pacotes certos, rodando no Play Mode.

### 0.1 Criar o projeto

1. Instale o **Unity Hub** e uma versão **Unity 6 LTS** (6000.x). Marque os módulos **Windows Build Support**, **Android Build Support**, **WebGL Build Support** e, se tiver um Mac, **iOS Build Support**: o MVP é PC, Mobile e Web (Parte 1 §1).
2. No Hub, crie um projeto com **New project → Universal 2D** e o nome `ProjetoHex`.
   - É aqui que a dimensão 2D definida na Parte 1 vira decisão técnica: o template 2D já vem com URP 2D, sprites e câmera ortográfica.
   - **Isométrico não muda o template.** Os hexágonos são sprites 2D comuns, e o "isométrico" vem de dois detalhes:
     - a arte é desenhada em perspectiva;
     - a grade é achatada na vertical (`isoYScale`, Fase 1).
   - **Física não é usada:** nada no jogo cai, colide ou anda por física. O toque no mapa é resolvido por matemática de hexágono (Fase 3), sem `Collider2D`.

### 0.2 Estrutura de pastas

Crie dentro de `Assets/`:

```
Assets/_Project/
  Scripts/
    Grid/      (coordenadas hexagonais)
    Data/      (recursos, terrenos, GameConfig)
    Sim/       (World e regras, C# puro)
    View/      (mapa na tela, câmera, toque)
    Meta/      (GameManager, save)
    UI/        (HUD e painéis)
  Resources/   (só o GameConfig, ver Fase 2)
  ScriptableObjects/
    Terrains/
  Prefabs/
  Scenes/      (Game)
  Sprites/
```

### 0.3 Pacotes (Window → Package Manager)

| Pacote | Para quê |
|---|---|
| **Input System** (já vem no Unity 6) | O mesmo código lê mouse (PC/Web) e toque (Mobile) através de `Pointer`. |
| **2D Sprite** (vem com o template 2D) | Criar sprites placeholder de hexágono e círculo pelo menu **Create → 2D → Sprites**. |
| **TextMeshPro** (parte do pacote uGUI no Unity 6) | Textos da UI. No primeiro uso, aceite **Import TMP Essentials**. |

O **2D Tilemap Editor** não é necessário. O Tilemap hexagonal do Unity sabe onde fica cada hexágono, mas não conhece **interseções nem arestas**, que são o centro do jogo (vilas nos cantos, estradas nos lados). Por isso a grade é feita em código (Fase 1) e cada hexágono é um `SpriteRenderer` comum.

### 0.4 Cena e ordenação de sprites

1. Crie a cena `Game` em `Assets/_Project/Scenes/` e adicione-a em **File → Build Profiles → Scene List**.
2. **Sorting Layers** (Edit → Project Settings → Tags and Layers → Sorting Layers), nesta ordem: `Terreno`, `Estradas`, `Construcoes`, `Marcadores`.
3. **Ordenar por altura na tela** é o truque clássico do isométrico: o que está mais embaixo na tela fica na frente.
   1. Abra o asset **Renderer 2D Data** do projeto (em `Assets/Settings/`, nome parecido com `Renderer2D`).
   2. Em **Transparency Sort Mode**, escolha **Custom Axis** com **Transparency Sort Axis = (0, 1, 0)**.
4. Em **Edit → Project Settings → Player → Other Settings → Active Input Handling**, deixe **Input System Package (New)** ou **Both**.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- A cena `Game` aparece na Scene List do Build Profile.
- As 4 Sorting Layers existem na ordem certa.
- Apertar Play na cena vazia não gera erro.

#### Problemas comuns
- **Não acho o Transparency Sort Mode:** ele fica no asset **Renderer 2D Data**, não na câmera. Use a busca do Project com `t:Renderer2DData` para achar.
- **`InputSystem` não encontrado nos scripts:** o pacote Input System não está instalado, ou o Active Input Handling está em "Input Manager (Old)".

Próxima fase: **Coordenadas Hexagonais**, com a matemática de hexágono, interseção e aresta.

---

# Parte 4 — Implementação Unity: Fase 1 (Coordenadas Hexagonais)

## Fase 1 — Coordenadas Hexagonais

> Objetivo desta fase: tipos que dão nome a cada hexágono, cada interseção e cada aresta do mapa, e que convertem essas posições para coordenadas da tela (já achatadas no isométrico).

Esta é a fase mais "matemática", mas é escrita uma vez e usada pelo resto do jogo. A referência clássica é o guia *Hexagonal Grids* da Red Blob Games, que vale a leitura.

O problema que ela resolve: no Catan, **cada interseção é dividida por 3 hexágonos** e **cada aresta por 2**. Se cada hexágono guardasse "meus 6 cantos" separadamente, a mesma vila apareceria em 3 lugares diferentes. Aqui cada canto e cada aresta tem **um nome só**.

### 1.1 Hexágono: `HexCoord`

```csharp
// Caminho: Assets/_Project/Scripts/Grid/HexCoord.cs
using System;
using UnityEngine;

namespace ProjetoHex.Grid
{
    // POR QUE: o mapa inteiro é feito de hexágonos, e quase toda regra do jogo
    // pergunta "quem é vizinho de quem". Um tipo próprio para a posição de um
    // hexágono deixa essas perguntas em uma linha só.
    // ESTRATÉGIA: coordenadas axiais (q, r) com hexágonos "pointy-top" (ponta
    // para cima): q cresce para a direita e r cresce para cima-direita. É um
    // struct (tipo de valor, copiado ao passar adiante), com == e GetHashCode,
    // então serve de chave em Dictionary e HashSet.
    [Serializable]
    public struct HexCoord : IEquatable<HexCoord>
    {
        // Campos públicos e minúsculos porque o JsonUtility (save da Fase 7)
        // só grava campos, não propriedades.
        public int q;
        public int r;

        public HexCoord(int q, int r)
        {
            this.q = q;
            this.r = r;
        }

        // As 6 direções vizinhas, na ordem: L, NE, NO, O, SO, SE.
        public static readonly HexCoord[] Directions =
        {
            new HexCoord(+1, 0), new HexCoord(0, +1), new HexCoord(-1, +1),
            new HexCoord(-1, 0), new HexCoord(0, -1), new HexCoord(+1, -1),
        };

        // Vizinho na direção 0..5 (índice de Directions).
        public HexCoord Neighbor(int direction) => this + Directions[direction];

        // Quantos passos de hexágono em hexágono separam dois hexágonos.
        public int DistanceTo(HexCoord other)
        {
            int dq = q - other.q;
            int dr = r - other.r;
            return (Mathf.Abs(dq) + Mathf.Abs(dr) + Mathf.Abs(dq + dr)) / 2;
        }

        // Os 6 cantos (interseções) deste hexágono, na ordem N, NE, SE, S, SO, NO.
        // Os cantos se alternam entre "N" e "S" de algum hexágono: VertexCoord
        // explica por quê.
        public VertexCoord[] Corners()
        {
            return new[]
            {
                new VertexCoord(q, r, true),          // N
                new VertexCoord(q, r + 1, false),     // NE = canto S do vizinho NE
                new VertexCoord(q + 1, r - 1, true),  // SE = canto N do vizinho SE
                new VertexCoord(q, r, false),         // S
                new VertexCoord(q, r - 1, true),      // SO = canto N do vizinho SO
                new VertexCoord(q - 1, r + 1, false), // NO = canto S do vizinho NO
            };
        }

        public static HexCoord operator +(HexCoord a, HexCoord b) => new HexCoord(a.q + b.q, a.r + b.r);
        public static HexCoord operator *(HexCoord a, int k) => new HexCoord(a.q * k, a.r * k);
        public static bool operator ==(HexCoord a, HexCoord b) => a.q == b.q && a.r == b.r;
        public static bool operator !=(HexCoord a, HexCoord b) => !(a == b);
        public bool Equals(HexCoord other) => this == other;
        public override bool Equals(object obj) => obj is HexCoord other && this == other;
        public override int GetHashCode() => HashCode.Combine(q, r);
        public override string ToString() => $"Hex({q}, {r})";
    }
}
```

### 1.2 Interseção: `VertexCoord`

```csharp
// Caminho: Assets/_Project/Scripts/Grid/VertexCoord.cs
using System;

namespace ProjetoHex.Grid
{
    // POR QUE: vilas e cidades ficam nas interseções (Parte 1 §4). Cada
    // interseção é dividida por 3 hexágonos, e precisa de UM nome só, senão a
    // mesma vila seria guardada 3 vezes.
    // ESTRATÉGIA: num hexágono "pointy-top", toda interseção do mapa é ou a
    // ponta de cima (N) ou a ponta de baixo (S) de exatamente um hexágono.
    // Então uma interseção é "hexágono (q, r) + N ou S". Os outros 4 cantos de
    // um hexágono são o N ou o S de algum vizinho (ver HexCoord.Corners).
    [Serializable]
    public struct VertexCoord : IEquatable<VertexCoord>
    {
        public int q;
        public int r;
        public bool north; // true = ponta de cima (N), false = ponta de baixo (S)

        public VertexCoord(int q, int r, bool north)
        {
            this.q = q;
            this.r = r;
            this.north = north;
        }

        // O hexágono "dono" do nome desta interseção.
        public HexCoord Hex => new HexCoord(q, r);

        // Os 3 hexágonos que se encontram nesta interseção: é deles que uma
        // vila aqui coleta.
        public HexCoord[] TouchingHexes()
        {
            return north
                ? new[] { new HexCoord(q, r), new HexCoord(q - 1, r + 1), new HexCoord(q, r + 1) }
                : new[] { new HexCoord(q, r), new HexCoord(q, r - 1), new HexCoord(q + 1, r - 1) };
        }

        // As 3 interseções ligadas a esta por uma aresta: usadas pela regra de
        // distância e pelas estradas. Uma ponta N sempre liga a pontas S e vice-versa.
        public VertexCoord[] AdjacentVertices()
        {
            return north
                ? new[] { new VertexCoord(q, r + 1, false), new VertexCoord(q - 1, r + 1, false), new VertexCoord(q - 1, r + 2, false) }
                : new[] { new VertexCoord(q + 1, r - 1, true), new VertexCoord(q, r - 1, true), new VertexCoord(q + 1, r - 2, true) };
        }

        public static bool operator ==(VertexCoord a, VertexCoord b) => a.q == b.q && a.r == b.r && a.north == b.north;
        public static bool operator !=(VertexCoord a, VertexCoord b) => !(a == b);
        public bool Equals(VertexCoord other) => this == other;
        public override bool Equals(object obj) => obj is VertexCoord other && this == other;
        public override int GetHashCode() => HashCode.Combine(q, r, north);
        public override string ToString() => $"Vertex({q}, {r}, {(north ? "N" : "S")})";
    }
}
```

### 1.3 Aresta: `EdgeCoord`

```csharp
// Caminho: Assets/_Project/Scripts/Grid/EdgeCoord.cs
using System;
using System.Collections.Generic;

namespace ProjetoHex.Grid
{
    // POR QUE: estradas ficam nas arestas (Parte 1 §4). Uma aresta liga duas
    // interseções vizinhas e precisa do mesmo nome venha de que lado vier.
    // ESTRATÉGIA: toda aresta liga uma ponta N a uma ponta S. O construtor
    // sempre guarda a ponta N em "a" e a S em "b", então (x, y) e (y, x) viram
    // a mesma aresta e funcionam como a mesma chave de Dictionary.
    [Serializable]
    public struct EdgeCoord : IEquatable<EdgeCoord>
    {
        public VertexCoord a; // sempre a ponta N
        public VertexCoord b; // sempre a ponta S

        // Monta a aresta entre duas interseções vizinhas, em qualquer ordem.
        public EdgeCoord(VertexCoord x, VertexCoord y)
        {
            if (x.north == y.north)
                throw new ArgumentException("Uma aresta sempre liga uma ponta N a uma ponta S.");
            a = x.north ? x : y;
            b = x.north ? y : x;
        }

        // Os 2 hexágonos dos dois lados da aresta: os que as duas pontas têm em comum.
        public HexCoord[] TouchingHexes()
        {
            var result = new List<HexCoord>(2);
            HexCoord[] fromB = b.TouchingHexes();
            foreach (HexCoord h in a.TouchingHexes())
                if (Array.IndexOf(fromB, h) >= 0)
                    result.Add(h);
            return result.ToArray();
        }

        public static bool operator ==(EdgeCoord x, EdgeCoord y) => x.a == y.a && x.b == y.b;
        public static bool operator !=(EdgeCoord x, EdgeCoord y) => !(x == y);
        public bool Equals(EdgeCoord other) => this == other;
        public override bool Equals(object obj) => obj is EdgeCoord other && this == other;
        public override int GetHashCode() => HashCode.Combine(a, b);
        public override string ToString() => $"Edge({a} - {b})";
    }
}
```

### 1.4 Da grade para a tela: `HexLayout`

```csharp
// Caminho: Assets/_Project/Scripts/Grid/HexLayout.cs
using UnityEngine;

namespace ProjetoHex.Grid
{
    // POR QUE: a grade só sabe "hexágono (2, -1)". Para desenhar, e para saber
    // em que hexágono o jogador tocou, é preciso converter isso de e para
    // posições do mundo do Unity.
    // ESTRATÉGIA: fórmulas padrão de hexágono pointy-top, com uma diferença: o
    // eixo Y é multiplicado por yScale (< 1). É esse "achatamento" vertical que
    // faz a grade parecer vista de cima em ângulo (isométrico). O valor certo
    // depende da arte (Parte 1 §12, Em aberto).
    public class HexLayout
    {
        private const float Sqrt3 = 1.7320508f;

        public readonly float size;   // distância do centro do hexágono até uma ponta, em unidades
        public readonly float yScale; // achatamento vertical do isométrico (1 = visto de cima)

        public HexLayout(float size, float yScale)
        {
            this.size = size;
            this.yScale = yScale;
        }

        // Centro do hexágono no mundo.
        public Vector3 HexToWorld(HexCoord h)
        {
            float x = size * Sqrt3 * (h.q + h.r * 0.5f);
            float y = size * 1.5f * h.r * yScale;
            return new Vector3(x, y, 0f);
        }

        // Posição de uma interseção: centro do hexágono dono + ponta N ou S.
        public Vector3 VertexToWorld(VertexCoord v)
        {
            Vector3 center = HexToWorld(v.Hex);
            return center + new Vector3(0f, (v.north ? size : -size) * yScale, 0f);
        }

        // Meio da aresta: média das duas pontas.
        public Vector3 EdgeToWorld(EdgeCoord e) => (VertexToWorld(e.a) + VertexToWorld(e.b)) * 0.5f;

        // Qual hexágono contém este ponto do mundo (inverso de HexToWorld).
        public HexCoord WorldToHex(Vector3 world)
        {
            float x = world.x;
            float y = world.y / yScale; // desfaz o achatamento antes da fórmula
            float q = (Sqrt3 / 3f * x - 1f / 3f * y) / size;
            float r = (2f / 3f * y) / size;
            return Round(q, r);
        }

        // Arredonda uma coordenada fracionária para o hexágono mais próximo.
        // Arredondar q e r separadamente erra perto das bordas; o truque é usar
        // a terceira coordenada s = -q - r e corrigir a que mais arredondou.
        private static HexCoord Round(float fq, float fr)
        {
            float fs = -fq - fr;
            int q = Mathf.RoundToInt(fq);
            int r = Mathf.RoundToInt(fr);
            int s = Mathf.RoundToInt(fs);
            float dq = Mathf.Abs(q - fq);
            float dr = Mathf.Abs(r - fr);
            float ds = Mathf.Abs(s - fs);
            if (dq > dr && dq > ds) q = -r - s;
            else if (dr > ds) r = -q - s;
            return new HexCoord(q, r);
        }
    }
}
```

### 1.5 Teste rápido no Console

Ainda não há nada na tela, então teste a matemática com um script temporário. Coloque-o num GameObject vazio da cena `Game` e apague-o depois da Fase 3.

```csharp
// Caminho: Assets/_Project/Scripts/Grid/HexGridSmokeTest.cs (temporário)
using UnityEngine;

namespace ProjetoHex.Grid
{
    // POR QUE: erro de sinal em coordenada hexagonal é fácil de cometer e
    // difícil de ver. Este teste confere as propriedades que o resto do jogo
    // assume antes de existir qualquer tela.
    // ESTRATÉGIA: checagens simples com Debug.Assert, que mostra erro no
    // Console se a condição for falsa.
    public class HexGridSmokeTest : MonoBehaviour
    {
        // Start roda uma vez quando a cena começa (depois de todos os Awake).
        private void Start()
        {
            var layout = new HexLayout(1f, 0.6f);
            var h = new HexCoord(2, -1);

            // Ida e volta: centro do hexágono -> mundo -> hexágono.
            Debug.Assert(layout.WorldToHex(layout.HexToWorld(h)) == h, "WorldToHex falhou");

            // Cada canto toca 3 hexágonos, e um deles é o próprio h.
            foreach (VertexCoord v in h.Corners())
                Debug.Assert(System.Array.IndexOf(v.TouchingHexes(), h) >= 0, $"{v} não toca {h}");

            // Vizinhança é simétrica: se A liga em B, B liga em A.
            foreach (VertexCoord v in h.Corners())
                foreach (VertexCoord n in v.AdjacentVertices())
                    Debug.Assert(System.Array.IndexOf(n.AdjacentVertices(), v) >= 0, $"{v} e {n} não são simétricos");

            // Toda aresta divide exatamente 2 hexágonos.
            var e = new EdgeCoord(h.Corners()[0], h.Corners()[1]);
            Debug.Assert(e.TouchingHexes().Length == 2, "Aresta deveria tocar 2 hexágonos");

            Debug.Log("HexGridSmokeTest terminou. Se não apareceu nenhum erro acima, a grade está certa.");
        }
    }
}
```

### ✅ Checkpoint da Fase 1
- Os 4 scripts da grade compilam sem erros.
- Ao apertar Play com o `HexGridSmokeTest` na cena, só aparece a mensagem final, sem nenhum "Assertion failed".

#### Problemas comuns
- **"Assertion failed: X e Y não são simétricos":** algum índice de `AdjacentVertices` ou de `Corners` foi digitado errado. Compare com a listagem: os sinais de `q` e `r` importam.
- **`HashCode` não encontrado:** falta o `using System;` no topo do arquivo.

Próxima fase: **Dados e Mundo**, com os recursos, os terrenos, o `GameConfig` e o objeto `World` com o mapa gerado.

---

# Parte 5 — Implementação Unity: Fase 2 (Dados e Mundo)

## Fase 2 — Dados e Mundo

> Objetivo desta fase: os terrenos e os números do jogo editáveis no Inspector, e um `World` em C# puro com o mapa gerado por seed, a vila inicial do jogador e a do rival.

### 2.1 Recursos

```csharp
// Caminho: Assets/_Project/Scripts/Data/ResourceType.cs
using System;

namespace ProjetoHex.Data
{
    // POR QUE: os 5 recursos do MVP (Parte 1 §3). Um enum evita erro de digitação
    // ("trigo" vs "Trigo") e serve de índice no array do estoque.
    // ESTRATÉGIA: o número de cada valor é fixo (= 0, = 1...) porque o save guarda
    // o estoque por posição. Não reordene: acrescente novos recursos no fim.
    public enum ResourceType
    {
        Minerio = 0,
        Trigo = 1,
        La = 2,
        Argila = 3,
        Peixe = 4,
    }

    // POR QUE: um par "recurso + quantidade", usado em custos e no estoque inicial.
    // ESTRATÉGIA: [Serializable] faz o Unity mostrar a lista de custos no Inspector.
    [Serializable]
    public struct ResourceAmount
    {
        public ResourceType type;
        public int amount;

        public ResourceAmount(ResourceType type, int amount)
        {
            this.type = type;
            this.amount = amount;
        }
    }

    // POR QUE: textos com acento para a UI ("Minério", "Lã"), que o nome do enum não pode ter.
    // ESTRATÉGIA: funções estáticas pequenas, usadas pela UI e pelo painel de ação.
    public static class ResourceTypes
    {
        // Quantidade de recursos. Atualize se acrescentar um valor no enum.
        public const int Count = 5;

        // Nome do recurso para a tela.
        public static string Label(ResourceType type) => type switch
        {
            ResourceType.Minerio => "Minério",
            ResourceType.Trigo => "Trigo",
            ResourceType.La => "Lã",
            ResourceType.Argila => "Argila",
            ResourceType.Peixe => "Peixe",
            _ => type.ToString(),
        };

        // Custo em texto, ex.: "1 Argila, 1 Lã".
        public static string Format(ResourceAmount[] cost)
        {
            if (cost == null || cost.Length == 0) return "grátis";
            var parts = new string[cost.Length];
            for (int i = 0; i < cost.Length; i++)
                parts[i] = $"{cost[i].amount} {Label(cost[i].type)}";
            return string.Join(", ", parts);
        }
    }
}
```

### 2.2 Terreno: `TerrainDef`

```csharp
// Caminho: Assets/_Project/Scripts/Data/TerrainDef.cs
using UnityEngine;

namespace ProjetoHex.Data
{
    // POR QUE: cada tipo de hexágono (mina, trigo, pasto, barreiro, rio) tem
    // recurso, tempo de ciclo, raridade e arte próprios (Parte 1 §3). Um terreno
    // novo deve ser "criar um asset", não "mexer em código".
    // ESTRATÉGIA: ScriptableObject é um arquivo de dados do Unity (.asset)
    // editável no Inspector. [CreateAssetMenu] adiciona a opção no menu
    // Create do Project.
    [CreateAssetMenu(fileName = "Terreno", menuName = "Projeto Hex/Terreno")]
    public class TerrainDef : ScriptableObject
    {
        public string displayName = "Campo de trigo";
        public ResourceType resource = ResourceType.Trigo;

        [Tooltip("Segundos para produzir um ciclo (Parte 1 §5).")]
        [Min(1f)] public float cycleSeconds = 20f;

        [Tooltip("Quanto uma vila recebe por ciclo (a cidade recebe o dobro, ver GameConfig).")]
        [Min(1)] public int amountPerCycle = 1;

        [Tooltip("Chance relativa de aparecer no mapa. 2 = aparece o dobro de um terreno com 1.")]
        [Min(0f)] public float spawnWeight = 1f;

        [Tooltip("Arte do hexágono. Vazio = usa o hexágono placeholder tingido com a cor abaixo.")]
        public Sprite sprite;
        public Color placeholderColor = Color.yellow;
    }
}
```

### 2.3 Configuração: `GameConfig`

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameConfig.cs
using UnityEngine;

namespace ProjetoHex.Data
{
    // POR QUE: todos os números de balanceamento (Parte 1 §17) e as regras ainda
    // Em aberto (Parte 1 §4) num lugar só, editáveis sem recompilar.
    // ESTRATÉGIA: um único asset em Resources/, carregado por nome com
    // Resources.Load. Os valores iniciais dos campos já são os placeholders, então
    // o asset novo nasce preenchido.
    [CreateAssetMenu(fileName = "GameConfig", menuName = "Projeto Hex/Game Config")]
    public class GameConfig : ScriptableObject
    {
        [Header("Mapa (Parte 1 §3)")]
        [Min(2)] public int mapRadius = 7;
        [Tooltip("0 = seed aleatória a cada jogo novo. Outro número = sempre o mesmo mapa (bom para testar).")]
        public int fixedSeed = 0;
        public TerrainDef[] terrains;

        [Header("Visual (Parte 1 §12)")]
        public float hexSize = 1f;
        [Tooltip("Achatamento vertical do isométrico. Ajuste até bater com a arte.")]
        [Range(0.3f, 1f)] public float isoYScale = 0.6f;

        [Header("Início")]
        public ResourceAmount[] startingResources =
        {
            new ResourceAmount(ResourceType.Argila, 3), new ResourceAmount(ResourceType.Minerio, 2),
            new ResourceAmount(ResourceType.La, 2), new ResourceAmount(ResourceType.Trigo, 3),
            new ResourceAmount(ResourceType.Peixe, 2),
        };
        [Min(0)] public int startingScouts = 1;

        [Header("Produção (Parte 1 §5)")]
        [Min(0)] public int villageYield = 1;
        [Min(0)] public int cityYield = 2;

        [Header("Custos (Parte 1 §17)")]
        public ResourceAmount[] villageCost =
        {
            new ResourceAmount(ResourceType.Argila, 1), new ResourceAmount(ResourceType.La, 1),
            new ResourceAmount(ResourceType.Trigo, 1), new ResourceAmount(ResourceType.Peixe, 1),
        };
        public ResourceAmount[] cityCost =
        {
            new ResourceAmount(ResourceType.Minerio, 3), new ResourceAmount(ResourceType.Trigo, 2),
        };
        public ResourceAmount[] roadCost =
        {
            new ResourceAmount(ResourceType.Argila, 1), new ResourceAmount(ResourceType.Minerio, 1),
        };
        public ResourceAmount[] scoutCost =
        {
            new ResourceAmount(ResourceType.Trigo, 1), new ResourceAmount(ResourceType.Peixe, 1),
        };

        [Header("Regras Em aberto (Parte 1 §4), placeholders")]
        [Tooltip("Não pode construir colado em outra construção (regra do Catan).")]
        public bool distanceRule = true;
        [Tooltip("Vila só onde chega uma estrada sua (regra do Catan).")]
        public bool requireRoadConnection = true;

        [Header("Batedores (Parte 1 §6)")]
        [Min(1f)] public float scoutSeconds = 60f;
        [Min(1)] public int maxScouts = 3;

        [Header("Offline e save (Parte 1 §10)")]
        [Min(0f)] public float offlineCapHours = 8f;
        [Min(5f)] public float autosaveSeconds = 30f;

        [Header("Rival IA (Parte 1 §9)")]
        public bool rivalEnabled = true;
        [Min(1f)] public float rivalThinkSeconds = 20f;
        [Min(2)] public int rivalStartDistance = 5;

        // Carrega o asset Assets/_Project/Resources/GameConfig.asset.
        public static GameConfig Load()
        {
            var config = Resources.Load<GameConfig>("GameConfig");
            if (config == null)
                Debug.LogError("GameConfig não encontrado. Crie em Assets/_Project/Resources/GameConfig.asset (Fase 2).");
            return config;
        }
    }
}
```

### 2.4 O estado do jogo: `World`

```csharp
// Caminho: Assets/_Project/Scripts/Sim/World.cs
using System;
using System.Collections.Generic;
using ProjetoHex.Data;
using ProjetoHex.Grid;
using UnityEngine;

namespace ProjetoHex.Sim
{
    // POR QUE: um hexágono do mapa: onde está, que terreno é e quanto falta para
    // o próximo ciclo de produção (Parte 1 §5).
    // ESTRATÉGIA: o terreno nunca muda depois de gerado (readonly); só o
    // progresso do relógio muda.
    public class HexCell
    {
        public readonly HexCoord coord;
        public readonly int terrainIndex; // posição em GameConfig.terrains
        public readonly TerrainDef terrain;
        public float progress; // segundos acumulados no ciclo atual

        public HexCell(HexCoord coord, int terrainIndex, TerrainDef terrain)
        {
            this.coord = coord;
            this.terrainIndex = terrainIndex;
            this.terrain = terrain;
        }

        // Progresso do ciclo de 0 a 1, para a barrinha na tela.
        public float Progress01 => Mathf.Clamp01(progress / terrain.cycleSeconds);
    }

    // POR QUE: uma vila ou cidade numa interseção (Parte 1 §4).
    // ESTRATÉGIA: [Serializable] com campos públicos para ir direto para o save.
    [Serializable]
    public class Building
    {
        public const int Village = 1;
        public const int City = 2;

        public VertexCoord vertex;
        public int owner; // World.Player ou World.Rival
        public int level; // Village ou City
    }

    // POR QUE: uma estrada numa aresta (Parte 1 §4).
    [Serializable]
    public class Road
    {
        public EdgeCoord edge;
        public int owner;
    }

    // POR QUE: um batedor em missão (Parte 1 §6): para onde foi e quanto falta.
    [Serializable]
    public class ScoutJob
    {
        public HexCoord target;
        public float remaining; // segundos
    }

    // POR QUE: tudo que pertence a um jogador (você ou o rival): estoque, o que
    // ele já explorou e seus batedores.
    // ESTRATÉGIA: a névoa é por jogador (Parte 1 §9), então cada Faction tem o
    // seu conjunto "revealed". O estoque é um array indexado pelo ResourceType.
    public class Faction
    {
        public readonly int id;
        public readonly int[] bank = new int[ResourceTypes.Count];
        public readonly HashSet<HexCoord> revealed = new HashSet<HexCoord>();
        public readonly List<ScoutJob> scoutJobs = new List<ScoutJob>();
        public int scoutsOwned;

        public Faction(int id)
        {
            this.id = id;
        }

        // Batedores parados em casa, prontos para uma missão.
        public int IdleScouts => scoutsOwned - scoutJobs.Count;

        // Quanto tem de um recurso.
        public int Get(ResourceType type) => bank[(int)type];

        // Soma (ou subtrai, com valor negativo) um recurso.
        public void Add(ResourceType type, int amount) => bank[(int)type] += amount;

        // Tem tudo que o custo pede?
        public bool CanAfford(ResourceAmount[] cost)
        {
            foreach (ResourceAmount c in cost)
                if (bank[(int)c.type] < c.amount) return false;
            return true;
        }

        // Desconta o custo. Chame só depois de CanAfford.
        public void Pay(ResourceAmount[] cost)
        {
            foreach (ResourceAmount c in cost)
                bank[(int)c.type] -= c.amount;
        }

        // Já tem um batedor indo para este hexágono?
        public bool IsScouting(HexCoord target)
        {
            foreach (ScoutJob job in scoutJobs)
                if (job.target == target) return true;
            return false;
        }
    }

    // POR QUE: o jogo inteiro num objeto só, sem nada de Unity: mapa, jogadores,
    // construções e estradas. A tela, o rival IA, o save e o progresso offline
    // leem e mudam só isto (ver "Arquitetura em uma página").
    // ESTRATÉGIA: Dictionary por coordenada para responder rápido "tem algo
    // aqui?". O evento Changed avisa a tela quando algo estrutural muda
    // (construção, estrada, hexágono revelado). O estoque muda o tempo todo e
    // não dispara o evento: a UI lê a cada frame.
    public class World
    {
        public const int Player = 0;
        public const int Rival = 1;

        public readonly GameConfig config;
        public readonly int seed;
        public readonly Dictionary<HexCoord, HexCell> hexes = new Dictionary<HexCoord, HexCell>();
        public readonly List<HexCell> hexList = new List<HexCell>(); // ordem fixa da geração (o save usa)
        public readonly Faction[] factions = { new Faction(Player), new Faction(Rival) };
        public readonly Dictionary<VertexCoord, Building> buildings = new Dictionary<VertexCoord, Building>();
        public readonly Dictionary<EdgeCoord, Road> roads = new Dictionary<EdgeCoord, Road>();

        public VertexCoord playerStart;
        public VertexCoord rivalStart;
        public float rivalThinkTimer;

        public event Action Changed;

        public World(GameConfig config, int seed)
        {
            this.config = config;
            this.seed = seed;
        }

        // O hexágono existe no mapa?
        public bool InMap(HexCoord h) => hexes.ContainsKey(h);

        // A interseção encosta em pelo menos um hexágono do mapa?
        public bool VertexInMap(VertexCoord v)
        {
            foreach (HexCoord h in v.TouchingHexes())
                if (InMap(h)) return true;
            return false;
        }

        // Hexágono na névoa, mas encostado num já revelado: dá para mandar batedor.
        public bool IsFrontier(int owner, HexCoord h)
        {
            Faction f = factions[owner];
            if (!InMap(h) || f.revealed.Contains(h)) return false;
            for (int d = 0; d < 6; d++)
                if (f.revealed.Contains(h.Neighbor(d))) return true;
            return false;
        }

        // Revela todos os hexágonos do mapa até "radius" passos de "center".
        public void RevealAround(int owner, HexCoord center, int radius)
        {
            for (int dq = -radius; dq <= radius; dq++)
            {
                int rMin = Mathf.Max(-radius, -dq - radius);
                int rMax = Mathf.Min(radius, -dq + radius);
                for (int dr = rMin; dr <= rMax; dr++)
                {
                    var h = new HexCoord(center.q + dq, center.r + dr);
                    if (InMap(h)) factions[owner].revealed.Add(h);
                }
            }
        }

        // Avisa quem estiver ouvindo (a tela) que algo estrutural mudou.
        public void NotifyChanged() => Changed?.Invoke();
    }
}
```

### 2.5 Gerar o mapa e começar um jogo: `WorldFactory`

```csharp
// Caminho: Assets/_Project/Scripts/Sim/WorldFactory.cs
using System;
using System.Collections.Generic;
using ProjetoHex.Data;
using ProjetoHex.Grid;
using UnityEngine;

namespace ProjetoHex.Sim
{
    // POR QUE: criar o mapa e montar o começo do jogo (vila inicial, estoque,
    // primeiro batedor) para o jogador e o rival.
    // ESTRATÉGIA: o terreno é gerado só a partir da seed, sempre igual para a
    // mesma seed. Assim o save (Fase 7) não precisa guardar o terreno de 169
    // hexágonos: guarda a seed e gera de novo. Generate() faz só a parte
    // determinística; NewGame() acrescenta o estado inicial dos jogadores.
    public static class WorldFactory
    {
        // Jogo novo do zero.
        public static World NewGame(GameConfig config)
        {
            int seed = config.fixedSeed != 0 ? config.fixedSeed : Environment.TickCount;
            World world = Generate(config, seed);
            SetupFaction(world, World.Player, world.playerStart);
            if (config.rivalEnabled)
                SetupFaction(world, World.Rival, world.rivalStart);
            return world;
        }

        // Gera o terreno e os pontos de partida a partir da seed (determinístico).
        public static World Generate(GameConfig config, int seed)
        {
            var world = new World(config, seed);
            var rng = new System.Random(seed);
            int radius = config.mapRadius;

            // 1. Sorteia o terreno de cada hexágono de um mapa em forma de hexágono.
            var coords = new List<HexCoord>();
            var terrainOf = new Dictionary<HexCoord, int>();
            for (int q = -radius; q <= radius; q++)
            {
                int rMin = Mathf.Max(-radius, -q - radius);
                int rMax = Mathf.Min(radius, -q + radius);
                for (int r = rMin; r <= rMax; r++)
                {
                    var h = new HexCoord(q, r);
                    coords.Add(h);
                    terrainOf[h] = PickTerrain(config, rng);
                }
            }

            // 2. Pontos de partida: jogador no centro, rival numa direção sorteada.
            //    O "- 1" garante que os 3 hexágonos da vila do rival estão dentro do mapa.
            world.playerStart = new VertexCoord(0, 0, true);
            int distance = Mathf.Min(config.rivalStartDistance, radius - 1);
            HexCoord rivalHex = HexCoord.Directions[rng.Next(6)] * distance;
            world.rivalStart = new VertexCoord(rivalHex.q, rivalHex.r, true);

            // 3. Início justo (placeholder, Parte 1 §3): 3 terrenos diferentes em volta de cada vila.
            MakeFairStart(config, world.playerStart, terrainOf, rng);
            MakeFairStart(config, world.rivalStart, terrainOf, rng);

            // 4. Cria as células numa ordem fixa (a mesma lista "coords"), que o save usa.
            foreach (HexCoord h in coords)
            {
                int t = terrainOf[h];
                var cell = new HexCell(h, t, config.terrains[t]);
                world.hexes[h] = cell;
                world.hexList.Add(cell);
            }
            return world;
        }

        // Sorteio com peso: um terreno com spawnWeight 2 sai o dobro de um com 1.
        private static int PickTerrain(GameConfig config, System.Random rng)
        {
            float total = 0f;
            foreach (TerrainDef t in config.terrains) total += t.spawnWeight;
            double roll = rng.NextDouble() * total;
            for (int i = 0; i < config.terrains.Length; i++)
            {
                roll -= config.terrains[i].spawnWeight;
                if (roll < 0) return i;
            }
            return config.terrains.Length - 1;
        }

        // Troca os 3 hexágonos em volta da vila por 3 terrenos diferentes, embaralhados.
        private static void MakeFairStart(GameConfig config, VertexCoord start, Dictionary<HexCoord, int> terrainOf, System.Random rng)
        {
            int count = config.terrains.Length;
            if (count < 3) return;
            var order = new List<int>();
            for (int i = 0; i < count; i++) order.Add(i);
            for (int i = count - 1; i > 0; i--) // embaralhamento de Fisher-Yates
            {
                int j = rng.Next(i + 1);
                (order[i], order[j]) = (order[j], order[i]);
            }
            HexCoord[] touching = start.TouchingHexes();
            for (int i = 0; i < touching.Length; i++)
                if (terrainOf.ContainsKey(touching[i]))
                    terrainOf[touching[i]] = order[i];
        }

        // Estoque inicial, batedores, vila inicial e área em volta já revelada.
        private static void SetupFaction(World world, int owner, VertexCoord start)
        {
            Faction f = world.factions[owner];
            foreach (ResourceAmount a in world.config.startingResources) f.Add(a.type, a.amount);
            f.scoutsOwned = world.config.startingScouts;
            world.buildings[start] = new Building { vertex = start, owner = owner, level = Building.Village };
            foreach (HexCoord h in start.TouchingHexes())
                world.RevealAround(owner, h, 1);
        }
    }
}
```

### 2.6 Criar os assets

1. Em `Assets/_Project/ScriptableObjects/Terrains/`, use **Create → Projeto Hex → Terreno** para criar os 5 terrenos da Parte 1 §17:

| Asset | displayName | resource | cycleSeconds | spawnWeight | placeholderColor |
|---|---|---|---|---|---|
| `Mina` | Mina | Minerio | 45 | 1 | cinza |
| `Trigo` | Campo de trigo | Trigo | 20 | 1.2 | amarelo |
| `Pasto` | Pasto | La | 25 | 1.2 | verde-claro |
| `Barreiro` | Barreiro | Argila | 30 | 1 | laranja-tijolo |
| `Rio` | Rio | Peixe | 30 | 0.7 | azul |

   Os pesos (`spawnWeight`) também são placeholders.

2. Em `Assets/_Project/Resources/`, use **Create → Projeto Hex → Game Config**, com o nome exato `GameConfig`. Arraste os 5 terrenos para a lista **Terrains**. Os outros campos já vêm com os placeholders.
3. Para testar sempre o mesmo mapa enquanto desenvolve, coloque **Fixed Seed = 1234**. Volte para 0 antes do build.

### ✅ Checkpoint da Fase 2
- Os scripts compilam sem erros.
- `GameConfig` existe em `Resources/` com os 5 terrenos na lista.
- Ainda não há nada para ver na tela: o `World` aparece pela primeira vez na Fase 3.

#### Problemas comuns
- **`IndexOutOfRangeException` em `Generate`:** a lista **Terrains** do `GameConfig` está vazia ou tem um item `None`. Preencha os 5.
- **Mudar a ordem da lista Terrains muda o mapa salvo:** o save guarda o terreno pelo índice da lista (Fase 7). Durante o desenvolvimento, acrescente terrenos novos no fim e apague o save se reordenar.

Próxima fase: **Mapa na Tela e Câmera**, com os hexágonos desenhados, a névoa, a câmera arrastável e o toque que identifica hexágono, interseção ou aresta.

---

# Parte 6 — Implementação Unity: Fase 3 (Mapa na Tela e Câmera)

## Fase 3 — Mapa na Tela e Câmera

> Objetivo desta fase: o mapa aparece na tela com névoa, vila do jogador e barrinhas de produção; dá para arrastar e dar zoom no mouse e no toque; tocar no mapa diz no Console se foi num hexágono, numa interseção ou numa aresta.

### 3.1 `GameManager` (versão 1)

O `GameManager` cresce ao longo do guia: aqui ele só cria o mundo. A Fase 4 acrescenta o relógio, a Fase 6 o rival e a Fase 7 traz a versão completa, com save.

```csharp
// Caminho: Assets/_Project/Scripts/Meta/GameManager.cs (versão 1, substituída na Fase 7)
using ProjetoHex.Data;
using ProjetoHex.Grid;
using ProjetoHex.Sim;
using UnityEngine;

namespace ProjetoHex.Meta
{
    // POR QUE: o único MonoBehaviour que "é dono" do World. Os outros scripts da
    // cena pegam o mundo daqui (GameManager.Instance.World).
    // ESTRATÉGIA: um singleton simples (Instance estático). [DefaultExecutionOrder(-100)]
    // faz o Awake dele rodar antes do Awake/Start dos outros scripts, então o World
    // já existe quando a tela vai desenhar.
    [DefaultExecutionOrder(-100)]
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }
        public GameConfig Config { get; private set; }
        public HexLayout Layout { get; private set; }
        public World World { get; private set; }

        // Awake roda quando o objeto é criado, antes de qualquer Start.
        private void Awake()
        {
            Instance = this;
            Config = GameConfig.Load();
            Layout = new HexLayout(Config.hexSize, Config.isoYScale);
            World = WorldFactory.NewGame(Config);
        }
    }
}
```

### 3.2 Um hexágono na tela: `HexTileView`

```csharp
// Caminho: Assets/_Project/Scripts/View/HexTileView.cs
using ProjetoHex.Sim;
using UnityEngine;

namespace ProjetoHex.View
{
    // POR QUE: a parte visual de um hexágono: o terreno, a névoa por cima, a
    // barrinha do ciclo de produção e o marcador de "batedor a caminho".
    // ESTRATÉGIA: um prefab com SpriteRenderers filhos que só ligam e desligam.
    // Quem decide o estado é o MapView; este script só aplica.
    public class HexTileView : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _terrain;
        [SerializeField] private SpriteRenderer _fog;
        [SerializeField] private GameObject _progressRoot;
        [SerializeField] private Transform _progressFill; // pivô na ponta esquerda da barra
        [SerializeField] private GameObject _scoutMarker;
        [SerializeField] private Color _fogColor = new Color(0.12f, 0.12f, 0.16f);
        [SerializeField] private Color _frontierFogColor = new Color(0.32f, 0.32f, 0.42f);

        public HexCell Cell { get; private set; }

        // Liga este visual a uma célula do mundo e pinta o terreno.
        public void Setup(HexCell cell)
        {
            Cell = cell;
            if (cell.terrain.sprite != null)
            {
                _terrain.sprite = cell.terrain.sprite;
                _terrain.color = Color.white;
            }
            else
            {
                _terrain.color = cell.terrain.placeholderColor;
            }
            name = $"{cell.coord} {cell.terrain.displayName}";
        }

        // Aplica o estado: revelado ou na névoa, fronteira (névoa mais clara =
        // "dá para explorar"), produzindo para o jogador, batedor a caminho.
        public void SetState(bool revealed, bool frontier, bool producing, bool scouted)
        {
            _terrain.enabled = revealed;
            _fog.enabled = !revealed;
            _fog.color = frontier ? _frontierFogColor : _fogColor;
            _progressRoot.SetActive(revealed && producing);
            _scoutMarker.SetActive(scouted);
        }

        // Estica a barrinha conforme o ciclo avança (chamado a cada frame pelo MapView).
        public void UpdateProgress()
        {
            Vector3 s = _progressFill.localScale;
            s.x = Cell.Progress01;
            _progressFill.localScale = s;
        }
    }
}
```

### 3.3 O mapa inteiro: `MapView`

```csharp
// Caminho: Assets/_Project/Scripts/View/MapView.cs
using System.Collections.Generic;
using ProjetoHex.Grid;
using ProjetoHex.Meta;
using ProjetoHex.Sim;
using UnityEngine;

namespace ProjetoHex.View
{
    // POR QUE: transformar o World em coisas na tela: um HexTileView por
    // hexágono, um sprite por vila/cidade, uma linha por estrada.
    // ESTRATÉGIA: os hexágonos são criados uma vez no Start. Construções e
    // estradas são criadas quando aparecem pela primeira vez e guardadas em
    // Dictionary, para não recriar tudo a cada mudança. Refresh() roda quando o
    // World avisa (evento Changed); só as barrinhas de progresso atualizam a cada frame.
    public class MapView : MonoBehaviour
    {
        [SerializeField] private HexTileView _hexPrefab;
        [SerializeField] private SpriteRenderer _buildingPrefab;
        [SerializeField] private LineRenderer _roadPrefab;
        [SerializeField] private Sprite _villageSprite;
        [SerializeField] private Sprite _citySprite;
        [SerializeField] private float _cityScale = 1.4f; // placeholder: cidade = vila maior
        [SerializeField] private float _roadWidth = 0.12f;
        [SerializeField] private Color[] _factionColors = { new Color(0.2f, 0.5f, 1f), new Color(0.9f, 0.25f, 0.2f) };

        private World _world;
        private HexLayout _layout;
        private readonly Dictionary<HexCoord, HexTileView> _tiles = new Dictionary<HexCoord, HexTileView>();
        private readonly Dictionary<VertexCoord, SpriteRenderer> _buildingViews = new Dictionary<VertexCoord, SpriteRenderer>();
        private readonly Dictionary<EdgeCoord, LineRenderer> _roadViews = new Dictionary<EdgeCoord, LineRenderer>();
        private readonly List<HexTileView> _producingTiles = new List<HexTileView>();

        // Cria um HexTileView para cada hexágono e começa a ouvir o World.
        private void Start()
        {
            _world = GameManager.Instance.World;
            _layout = GameManager.Instance.Layout;
            foreach (HexCell cell in _world.hexList)
            {
                HexTileView tile = Instantiate(_hexPrefab, _layout.HexToWorld(cell.coord), Quaternion.identity, transform);
                tile.Setup(cell);
                _tiles[cell.coord] = tile;
            }
            _world.Changed += Refresh;
            Refresh();
        }

        // Para de ouvir o World quando a cena fecha (evita chamar um objeto destruído).
        private void OnDestroy()
        {
            if (_world != null) _world.Changed -= Refresh;
        }

        // Barrinhas de produção andam a cada frame.
        private void Update()
        {
            foreach (HexTileView tile in _producingTiles) tile.UpdateProgress();
        }

        // Redesenha névoa, construções e estradas a partir do World.
        private void Refresh()
        {
            Faction player = _world.factions[World.Player];

            // Hexágonos que produzem para o jogador = os que tocam uma construção dele.
            var producing = new HashSet<HexCoord>();
            foreach (Building b in _world.buildings.Values)
                if (b.owner == World.Player)
                    foreach (HexCoord h in b.vertex.TouchingHexes()) producing.Add(h);

            _producingTiles.Clear();
            foreach (KeyValuePair<HexCoord, HexTileView> pair in _tiles)
            {
                HexCoord c = pair.Key;
                bool revealed = player.revealed.Contains(c);
                bool isProducing = revealed && producing.Contains(c);
                pair.Value.SetState(revealed, _world.IsFrontier(World.Player, c), isProducing, player.IsScouting(c));
                if (isProducing) _producingTiles.Add(pair.Value);
            }

            foreach (Building b in _world.buildings.Values) RefreshBuilding(b, player);
            foreach (Road road in _world.roads.Values) RefreshRoad(road, player);
        }

        // O jogador só vê o que encosta em algo que ele já explorou (névoa por jogador, Parte 1 §9).
        private static bool PlayerSees(HexCoord[] touching, Faction player)
        {
            foreach (HexCoord h in touching)
                if (player.revealed.Contains(h)) return true;
            return false;
        }

        // Cria (se ainda não existe) e atualiza o sprite de uma vila/cidade.
        private void RefreshBuilding(Building b, Faction player)
        {
            if (!_buildingViews.TryGetValue(b.vertex, out SpriteRenderer view))
            {
                view = Instantiate(_buildingPrefab, _layout.VertexToWorld(b.vertex), Quaternion.identity, transform);
                _buildingViews[b.vertex] = view;
            }
            Sprite sprite = b.level == Building.City ? _citySprite : _villageSprite;
            if (sprite != null) view.sprite = sprite;
            view.color = _factionColors[b.owner];
            view.transform.localScale = Vector3.one * (b.level == Building.City ? _cityScale : 1f);
            view.gameObject.SetActive(PlayerSees(b.vertex.TouchingHexes(), player));
        }

        // Cria (se ainda não existe) e atualiza a linha de uma estrada.
        private void RefreshRoad(Road road, Faction player)
        {
            if (!_roadViews.TryGetValue(road.edge, out LineRenderer line))
            {
                line = Instantiate(_roadPrefab, transform);
                line.useWorldSpace = true;
                line.positionCount = 2;
                line.SetPosition(0, _layout.VertexToWorld(road.edge.a));
                line.SetPosition(1, _layout.VertexToWorld(road.edge.b));
                line.startWidth = _roadWidth;
                line.endWidth = _roadWidth;
                _roadViews[road.edge] = line;
            }
            line.startColor = _factionColors[road.owner];
            line.endColor = _factionColors[road.owner];
            line.gameObject.SetActive(PlayerSees(road.edge.TouchingHexes(), player));
        }
    }
}
```

### 3.4 O que foi tocado: `MapTarget`

```csharp
// Caminho: Assets/_Project/Scripts/View/MapTarget.cs
using ProjetoHex.Grid;
using UnityEngine;

namespace ProjetoHex.View
{
    // POR QUE: um toque no mapa pode cair num hexágono (explorar/ver produção),
    // numa interseção (vila/cidade) ou numa aresta (estrada). O painel de ação
    // (Fase 5) precisa saber qual dos três foi.
    // ESTRATÉGIA: um struct com o tipo e as três coordenadas possíveis; só a do
    // tipo escolhido é usada.
    public enum MapTargetKind { Hex, Vertex, Edge }

    public struct MapTarget
    {
        public MapTargetKind kind;
        public HexCoord hex;
        public VertexCoord vertex;
        public EdgeCoord edge;
        public Vector3 worldPosition; // onde colocar o marcador de seleção

        public static MapTarget ForHex(HexCoord h, HexLayout layout) =>
            new MapTarget { kind = MapTargetKind.Hex, hex = h, worldPosition = layout.HexToWorld(h) };

        public static MapTarget ForVertex(VertexCoord v, HexCoord h, HexLayout layout) =>
            new MapTarget { kind = MapTargetKind.Vertex, vertex = v, hex = h, worldPosition = layout.VertexToWorld(v) };

        public static MapTarget ForEdge(EdgeCoord e, HexCoord h, HexLayout layout) =>
            new MapTarget { kind = MapTargetKind.Edge, edge = e, hex = h, worldPosition = layout.EdgeToWorld(e) };

        public override string ToString() => kind switch
        {
            MapTargetKind.Vertex => vertex.ToString(),
            MapTargetKind.Edge => edge.ToString(),
            _ => hex.ToString(),
        };
    }
}
```

### 3.5 Arrastar, dar zoom e tocar: `MapPointer`

```csharp
// Caminho: Assets/_Project/Scripts/View/MapPointer.cs
using System;
using System.Collections.Generic;
using ProjetoHex.Grid;
using ProjetoHex.Meta;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

namespace ProjetoHex.View
{
    // POR QUE: o mesmo gesto serve para duas coisas. Arrastar move a câmera;
    // tocar e soltar sem arrastar seleciona algo no mapa. No PC isso vem do
    // mouse, no celular do dedo.
    // ESTRATÉGIA: Pointer.current (Input System) representa "o último mouse ou
    // dedo usado", então um código só serve para as três plataformas. Se o dedo
    // andar mais que _tapMaxPixels, é arrasto; senão, é toque. O toque é
    // convertido em hexágono pela matemática da Fase 1 (sem Collider2D), e
    // depois em "interseção" ou "aresta" se caiu perto de um canto ou de um lado.
    public class MapPointer : MonoBehaviour
    {
        [SerializeField] private Camera _camera;
        [SerializeField] private Transform _selectionMarker;
        [SerializeField] private float _tapMaxPixels = 15f;
        [SerializeField] private float _minZoom = 2f;
        [SerializeField] private float _maxZoom = 12f;
        [SerializeField] private float _scrollZoomStep = 0.8f;
        [SerializeField] private float _pinchZoomSpeed = 0.02f;
        [Tooltip("Raio, em fração do tamanho do hexágono, para o toque 'grudar' num canto ou num lado.")]
        [SerializeField] private float _pickRadius = 0.3f;
        [SerializeField] private bool _logTaps = true;

        // Avisado a cada toque válido no mapa (o ActionPanel da Fase 5 ouve isto).
        public event Action<MapTarget> Tapped;

        private bool _pressing;
        private bool _dragging;
        private Vector2 _pressScreenPos;
        private Vector3 _dragOriginWorld;
        private float _lastPinchDistance = -1f;
        private static readonly List<RaycastResult> UiHits = new List<RaycastResult>();

        // Começa sem nada selecionado.
        private void Start()
        {
            if (_selectionMarker != null) _selectionMarker.gameObject.SetActive(false);
        }

        // Lê o input a cada frame: zoom, pinça, arrasto e toque.
        private void Update()
        {
            HandleScrollZoom();
            if (HandlePinch())
            {
                _pressing = false; // durante a pinça, nada de arrasto nem toque
                return;
            }

            Pointer pointer = Pointer.current;
            if (pointer == null) return;
            Vector2 screenPos = pointer.position.ReadValue();

            if (pointer.press.wasPressedThisFrame && !IsOverUI(screenPos))
            {
                _pressing = true;
                _dragging = false;
                _pressScreenPos = screenPos;
                _dragOriginWorld = ScreenToWorld(screenPos);
            }

            if (_pressing && pointer.press.isPressed)
            {
                if (!_dragging && Vector2.Distance(screenPos, _pressScreenPos) > _tapMaxPixels)
                    _dragging = true;
                if (_dragging)
                {
                    // Move a câmera para que o ponto agarrado continue embaixo do dedo.
                    _camera.transform.position += _dragOriginWorld - ScreenToWorld(screenPos);
                    ClampCamera();
                }
            }

            if (_pressing && pointer.press.wasReleasedThisFrame)
            {
                _pressing = false;
                if (!_dragging) HandleTap(screenPos);
            }
        }

        // Converte o toque em alvo, move o marcador e avisa quem estiver ouvindo.
        private void HandleTap(Vector2 screenPos)
        {
            MapTarget target = Pick(ScreenToWorld(screenPos));
            if (!GameManager.Instance.World.InMap(target.hex))
            {
                if (_selectionMarker != null) _selectionMarker.gameObject.SetActive(false);
                return;
            }
            if (_selectionMarker != null)
            {
                _selectionMarker.position = target.worldPosition;
                _selectionMarker.gameObject.SetActive(true);
            }
            if (_logTaps) Debug.Log($"Toque em {target}");
            Tapped?.Invoke(target);
        }

        // Hexágono sob o ponto; se estiver perto de um canto, é interseção; se
        // estiver perto do meio de um lado, é aresta. Cantos têm prioridade.
        private MapTarget Pick(Vector3 world)
        {
            HexLayout layout = GameManager.Instance.Layout;
            HexCoord hex = layout.WorldToHex(world);
            VertexCoord[] corners = hex.Corners();
            float radius = layout.size * _pickRadius;

            int best = -1;
            float bestDist = float.MaxValue;
            for (int i = 0; i < 6; i++)
            {
                float d = Vector2.Distance(world, layout.VertexToWorld(corners[i]));
                if (d < bestDist) { bestDist = d; best = i; }
            }
            if (bestDist <= radius) return MapTarget.ForVertex(corners[best], hex, layout);

            best = -1;
            bestDist = float.MaxValue;
            for (int i = 0; i < 6; i++)
            {
                Vector3 mid = (layout.VertexToWorld(corners[i]) + layout.VertexToWorld(corners[(i + 1) % 6])) * 0.5f;
                float d = Vector2.Distance(world, mid);
                if (d < bestDist) { bestDist = d; best = i; }
            }
            if (bestDist <= radius)
                return MapTarget.ForEdge(new EdgeCoord(corners[best], corners[(best + 1) % 6]), hex, layout);

            return MapTarget.ForHex(hex, layout);
        }

        // Roda do mouse: um "degrau" de zoom por clique. Usa só o sinal porque o
        // valor bruto da roda muda de plataforma para plataforma.
        private void HandleScrollZoom()
        {
            Mouse mouse = Mouse.current;
            if (mouse == null) return;
            float scroll = mouse.scroll.ReadValue().y;
            if (Mathf.Approximately(scroll, 0f) || IsOverUI(mouse.position.ReadValue())) return;
            Zoom(-Mathf.Sign(scroll) * _scrollZoomStep);
        }

        // Dois dedos na tela: afastar = zoom in, aproximar = zoom out.
        // Devolve true enquanto a pinça está acontecendo.
        private bool HandlePinch()
        {
            Touchscreen screen = Touchscreen.current;
            if (screen == null) return false;
            var t0 = screen.touches[0];
            var t1 = screen.touches[1];
            if (!t0.isInProgress || !t1.isInProgress)
            {
                _lastPinchDistance = -1f;
                return false;
            }
            float distance = Vector2.Distance(t0.position.ReadValue(), t1.position.ReadValue());
            if (_lastPinchDistance > 0f) Zoom((_lastPinchDistance - distance) * _pinchZoomSpeed);
            _lastPinchDistance = distance;
            return true;
        }

        // Muda o tamanho da câmera ortográfica (maior = vê mais mapa).
        private void Zoom(float delta)
        {
            _camera.orthographicSize = Mathf.Clamp(_camera.orthographicSize + delta, _minZoom, _maxZoom);
        }

        // Não deixa a câmera fugir do mapa.
        private void ClampCamera()
        {
            HexLayout layout = GameManager.Instance.Layout;
            int radius = GameManager.Instance.Config.mapRadius;
            float maxX = layout.size * 1.7320508f * (radius + 0.5f);
            float maxY = layout.size * 1.5f * radius * layout.yScale + layout.size;
            Vector3 p = _camera.transform.position;
            p.x = Mathf.Clamp(p.x, -maxX, maxX);
            p.y = Mathf.Clamp(p.y, -maxY, maxY);
            _camera.transform.position = p;
        }

        // Posição da tela (pixels) para posição do mundo (unidades), no plano z = 0.
        private Vector3 ScreenToWorld(Vector2 screen)
        {
            Vector3 p = _camera.ScreenToWorldPoint(new Vector3(screen.x, screen.y, 0f));
            p.z = 0f;
            return p;
        }

        // O ponto está em cima de um botão/painel? Então o toque é da UI, não do mapa.
        // Faz um raycast na UI em vez de usar IsPointerOverGameObject(), que é
        // pouco confiável com toque no Input System.
        private static bool IsOverUI(Vector2 screenPos)
        {
            if (EventSystem.current == null) return false;
            var data = new PointerEventData(EventSystem.current) { position = screenPos };
            UiHits.Clear();
            EventSystem.current.RaycastAll(data, UiHits);
            return UiHits.Count > 0;
        }
    }
}
```

### 3.6 Montar a cena

1. **Sprites placeholder** (em `Assets/_Project/Sprites/`): use **Create → 2D → Sprites → Hexagon Point-Top**, **Circle** e **Square**.
2. **Prefab `HexTile`** (em `Prefabs/`):
   1. Crie um GameObject vazio `HexTile` com o componente `HexTileView`.
   2. Filho `Terrain`: SpriteRenderer com o sprite *Hexagon Point-Top*, Sorting Layer `Terreno`, Order 0.
   3. Filho `Fog`: o mesmo sprite, Sorting Layer `Terreno`, **Order 1**.
   4. Ajuste a **Scale** de `Terrain` e `Fog` (o mesmo valor nos dois) até um hexágono de `hexSize = 1` ter cerca de 1,73 unidade de largura e 2 de altura. Depois multiplique o **Y** da escala pelo `isoYScale` (0.6). O ajuste fino é visual: na Fase 3 os hexágonos vizinhos devem encostar sem frestas.
   5. Filho `Progress` (é o `_progressRoot`), posicionado um pouco abaixo do centro (ex.: y = -0.35):
      - neto `Bg`: Square escuro com escala (0.8, 0.08), Sorting Layer `Marcadores`;
      - neto `FillPivot` (é o `_progressFill`): vazio em x = -0.4, a ponta esquerda da barra;
      - bisneto `Fill`, filho de `FillPivot`: Square claro em x = 0.4, escala (0.8, 0.08), Sorting Layer `Marcadores`, Order 1.

      Escalar o `FillPivot` em X faz a barra crescer a partir da esquerda.
   6. Filho `ScoutMarker`: Circle amarelo pequeno (escala 0.3), Sorting Layer `Marcadores`.
   7. Arraste os filhos para os campos do `HexTileView`.
3. **Prefab `Building`:** GameObject com SpriteRenderer (Circle, escala 0.35), Sorting Layer `Construcoes`. Arte final **Em aberto** (Parte 1 §12).
4. **Prefab `Road`:**
   1. Crie um GameObject com **LineRenderer**.
   2. Em **Materials**, use **Sprites-Default**.
   3. Em **Additional Settings**, coloque **Sorting Layer = `Estradas`**.
5. **Na cena `Game`:**
   1. GameObject `GameManager` com o componente `GameManager`.
   2. GameObject `Map` com `MapView`. Arraste os 3 prefabs; `Village Sprite` e `City Sprite` podem ficar vazios (usa o Circle do prefab).
   3. **Main Camera:** Projection **Orthographic**, Size **6**, Background azul-escuro. Adicione `MapPointer` na própria câmera e arraste a câmera para o campo `Camera`.
   4. Marcador de seleção: Circle branco semitransparente (escala 0.5) chamado `Selection`, Sorting Layer `Marcadores`, Order 5, arrastado para `Selection Marker`.
   5. **GameObject → UI → Event System**, se ainda não existir. Clique em **Replace with InputSystemUIInputModule** se o Unity sugerir.

### ✅ Checkpoint da Fase 3
- Ao apertar Play, aparece um mapa em forma de hexágono, quase todo na névoa escura. No centro há cerca de 10 hexágonos coloridos revelados e um círculo azul (sua vila) numa interseção.
- Os 3 hexágonos em volta da vila têm cores diferentes e mostram a barrinha de progresso (ainda parada, porque o relógio vem na Fase 4).
- Os hexágonos na névoa colados nos revelados aparecem num tom mais claro (fronteira).
- Arrastar com o mouse ou com o dedo move o mapa, e a roda ou a pinça dão zoom.
- Clicar perto de um canto loga `Toque em Vertex(...)`, perto do meio de um lado loga `Edge(...)` e no meio do hexágono loga `Hex(...)`. O marcador branco vai para o lugar certo.
- O `HexGridSmokeTest` da Fase 1 pode ser apagado.

#### Problemas comuns
- **Hexágonos com frestas ou sobrepostos:** a escala dos filhos `Terrain`/`Fog` não bate com `hexSize`. Ajuste no prefab até encostarem; o código não precisa mudar.
- **A vila aparece atrás dos hexágonos:** o prefab `Building` ficou na Sorting Layer `Default` ou `Terreno`. Use `Construcoes`.
- **Toque não funciona no celular, mas funciona no PC:** falta o Event System, ou ele usa o módulo antigo (`StandaloneInputModule`). Troque por `InputSystemUIInputModule`.

Próxima fase: **Coleta por Tempo**, com o relógio do jogo, os hexágonos produzindo e a barra de recursos.

---

# Parte 7 — Implementação Unity: Fase 4 (Coleta por Tempo)

## Fase 4 — Coleta por Tempo

> Objetivo desta fase: o tempo passa. Cada hexágono fecha ciclos, as construções que o tocam recebem recursos (Parte 1 §5) e a barra de recursos mostra o estoque subindo.

### 4.1 O relógio do mundo: `Simulation`

```csharp
// Caminho: Assets/_Project/Scripts/Sim/Simulation.cs
using ProjetoHex.Grid;

namespace ProjetoHex.Sim
{
    // POR QUE: "tudo é por tempo" (Parte 1 §5). Algo precisa avançar os relógios
    // de produção de cada hexágono e das missões dos batedores.
    // ESTRATÉGIA: uma função pura Tick(world, dt) que avança o mundo dt
    // segundos. Ela não sabe se o tempo é "ao vivo" (Update) ou "offline" (vários
    // Ticks seguidos ao abrir o jogo, Fase 7), e por isso serve para os dois.
    // Cada hexágono tem um relógio só; quando o ciclo fecha, todas as
    // construções que o tocam recebem (o "dado do Catan" trocado por tempo).
    public static class Simulation
    {
        // Avança o mundo em dt segundos.
        public static void Tick(World w, float dt)
        {
            if (dt <= 0f) return;

            foreach (HexCell cell in w.hexList)
            {
                cell.progress += dt;
                float cycle = cell.terrain.cycleSeconds;
                // "while" e não "if": com dt grande (offline), podem fechar vários ciclos de uma vez.
                while (cell.progress >= cycle)
                {
                    cell.progress -= cycle;
                    Produce(w, cell);
                }
            }

            // Missões de batedor (usadas a partir da Fase 5).
            bool changed = false;
            foreach (Faction f in w.factions)
            {
                for (int i = f.scoutJobs.Count - 1; i >= 0; i--) // de trás para frente, porque remove da lista
                {
                    ScoutJob job = f.scoutJobs[i];
                    job.remaining -= dt;
                    if (job.remaining <= 0f)
                    {
                        f.revealed.Add(job.target);
                        f.scoutJobs.RemoveAt(i);
                        changed = true;
                    }
                }
            }
            if (changed) w.NotifyChanged();
        }

        // Um ciclo fechou: cada vila/cidade num dos 6 cantos do hexágono recebe o recurso.
        private static void Produce(World w, HexCell cell)
        {
            foreach (VertexCoord v in cell.coord.Corners())
            {
                if (!w.buildings.TryGetValue(v, out Building b)) continue;
                int yield = b.level == Building.City ? w.config.cityYield : w.config.villageYield;
                w.factions[b.owner].Add(cell.terrain.resource, yield * cell.terrain.amountPerCycle);
            }
        }
    }
}
```

### 4.2 Ligar o relógio no `GameManager`

Acrescente na classe `GameManager` da Fase 3 o campo e os dois métodos abaixo:

```csharp
        [Tooltip("Só para testar: 10 = o tempo do jogo passa 10x mais rápido.")]
        [SerializeField] private float _debugTimeScale = 1f;

        // Update roda uma vez por frame. Time.deltaTime = segundos desde o frame anterior.
        private void Update()
        {
            Step(Time.deltaTime * _debugTimeScale);
        }

        // Avança o jogo em dt segundos (a Fase 6 acrescenta o rival aqui).
        private void Step(float dt)
        {
            Simulation.Tick(World, dt);
        }
```

### 4.3 Barra de recursos: `ResourceBar`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ResourceBar.cs
using ProjetoHex.Data;
using ProjetoHex.Meta;
using ProjetoHex.Sim;
using TMPro;
using UnityEngine;

namespace ProjetoHex.UI
{
    // POR QUE: o jogador precisa ver o estoque subindo. É o retorno principal do
    // loop de coleta (Parte 1 §13).
    // ESTRATÉGIA: lê o estoque do World a cada frame e escreve nos textos. O
    // estoque muda a todo ciclo, então ler sempre é mais simples do que um
    // evento por recurso.
    public class ResourceBar : MonoBehaviour
    {
        [Tooltip("Um texto por recurso, na ordem do enum: Minério, Trigo, Lã, Argila, Peixe.")]
        [SerializeField] private TMP_Text[] _resourceTexts = new TMP_Text[ResourceTypes.Count];
        [SerializeField] private TMP_Text _scoutsText;

        // Atualiza os textos com o estoque atual do jogador.
        private void Update()
        {
            Faction player = GameManager.Instance.World.factions[World.Player];
            for (int i = 0; i < _resourceTexts.Length && i < ResourceTypes.Count; i++)
                if (_resourceTexts[i] != null)
                    _resourceTexts[i].text = $"{ResourceTypes.Label((ResourceType)i)}: {player.bank[i]}";
            if (_scoutsText != null)
                _scoutsText.text = $"Batedores: {player.IdleScouts}/{player.scoutsOwned}";
        }
    }
}
```

### 4.4 Montar a UI

1. **GameObject → UI → Canvas.** No **Canvas Scaler**, use **UI Scale Mode = Scale With Screen Size**, **Reference Resolution = 1920 × 1080** e **Match = 0.5**. Isso funciona razoavelmente no PC, no celular e no navegador; a orientação final está **Em aberto** (Parte 1 §13).
2. Dentro do Canvas, crie um painel `ResourceBar` ancorado no topo, com **Horizontal Layout Group**.
3. Dentro do painel, crie 6 textos **UI → Text - TextMeshPro**: 5 de recursos e 1 de batedores.
4. Adicione `ResourceBar` ao painel e arraste os textos (na ordem do enum) e o de batedores.

### ✅ Checkpoint da Fase 4
- Ao dar Play, as barrinhas dos 3 hexágonos em volta da sua vila enchem e reiniciam, cada uma no seu ritmo.
- A cada barrinha cheia, o recurso daquele terreno sobe 1 na barra do topo.
- Com `Debug Time Scale = 10` no `GameManager`, tudo acontece 10x mais rápido.
- A barra mostra `Batedores: 1/1`.

#### Problemas comuns
- **Recursos não sobem:** o `GameManager` não tem o `Update` da 4.2, ou o `cycleSeconds` dos terrenos está muito alto. Teste com `Debug Time Scale` maior.
- **Acentos aparecem como quadrados:** a fonte do TMP não tem o caractere. Use a fonte padrão *LiberationSans SDF* (que tem fallback dinâmico) ou uma fonte com Latin-1.

Próxima fase: **Construir e Explorar**, com as regras de vila, cidade, estrada e batedor e o painel de ação ao tocar no mapa.

---

# Parte 8 — Implementação Unity: Fase 5 (Construir e Explorar)

## Fase 5 — Construir e Explorar

> Objetivo desta fase: tocar numa interseção e construir uma vila ou virar cidade; tocar numa aresta e construir uma estrada; tocar num hexágono na névoa e mandar um batedor; treinar batedores. Tudo checado pelas regras da Parte 1 §4 e §6.

### 5.1 Regras de construção: `BuildRules`

```csharp
// Caminho: Assets/_Project/Scripts/Sim/BuildRules.cs
using ProjetoHex.Grid;

namespace ProjetoHex.Sim
{
    // POR QUE: decidir se uma vila, cidade ou estrada pode ser construída, e
    // explicar por que não quando não pode. A mesma regra serve para o
    // jogador (painel de ação) e para o rival (Fase 6).
    // ESTRATÉGIA: funções que só leem o World e devolvem true/false com um
    // motivo em texto ("out string reason"). As regras Em aberto (Parte 1 §4)
    // são lidas do GameConfig (distanceRule, requireRoadConnection).
    public static class BuildRules
    {
        // A interseção serve para uma vila, sem contar estrada e custo? (o rival
        // usa isto para escolher para onde crescer).
        public static bool SiteIsFree(World w, int owner, VertexCoord v, out string reason)
        {
            if (!w.VertexInMap(v)) { reason = "Fora do mapa."; return false; }
            if (w.buildings.ContainsKey(v)) { reason = "Já tem uma construção aqui."; return false; }
            foreach (HexCoord h in v.TouchingHexes())
                if (w.InMap(h) && !w.factions[owner].revealed.Contains(h))
                {
                    reason = "Explore os hexágonos em volta primeiro.";
                    return false;
                }
            if (w.config.distanceRule)
                foreach (VertexCoord n in v.AdjacentVertices())
                    if (w.buildings.ContainsKey(n)) { reason = "Muito perto de outra construção."; return false; }
            reason = null;
            return true;
        }

        // Pode construir uma vila aqui agora?
        public static bool CanBuildVillage(World w, int owner, VertexCoord v, out string reason)
        {
            if (!SiteIsFree(w, owner, v, out reason)) return false;
            if (w.config.requireRoadConnection && !HasOwnRoadAt(w, owner, v))
            {
                reason = "Precisa de uma estrada sua chegando aqui.";
                return false;
            }
            if (!w.factions[owner].CanAfford(w.config.villageCost)) { reason = "Recursos insuficientes."; return false; }
            reason = null;
            return true;
        }

        // Pode transformar esta vila em cidade?
        public static bool CanUpgradeToCity(World w, int owner, VertexCoord v, out string reason)
        {
            if (!w.buildings.TryGetValue(v, out Building b) || b.owner != owner) { reason = "Não é uma vila sua."; return false; }
            if (b.level != Building.Village) { reason = "Já é uma cidade."; return false; }
            if (!w.factions[owner].CanAfford(w.config.cityCost)) { reason = "Recursos insuficientes."; return false; }
            reason = null;
            return true;
        }

        // Pode construir uma estrada nesta aresta?
        public static bool CanBuildRoad(World w, int owner, EdgeCoord e, out string reason)
        {
            if (w.roads.ContainsKey(e)) { reason = "Já tem estrada aqui."; return false; }
            if (!TouchesRevealed(w, owner, e)) { reason = "Explore os hexágonos deste lado primeiro."; return false; }
            if (!EndpointConnects(w, owner, e.a, e) && !EndpointConnects(w, owner, e.b, e))
            {
                reason = "A estrada precisa sair de uma vila ou estrada sua.";
                return false;
            }
            if (!w.factions[owner].CanAfford(w.config.roadCost)) { reason = "Recursos insuficientes."; return false; }
            reason = null;
            return true;
        }

        // Pelo menos um dos 2 hexágonos da aresta já foi explorado por este jogador?
        public static bool TouchesRevealed(World w, int owner, EdgeCoord e)
        {
            foreach (HexCoord h in e.TouchingHexes())
                if (w.factions[owner].revealed.Contains(h)) return true;
            return false;
        }

        // Alguma estrada deste jogador chega nesta interseção?
        private static bool HasOwnRoadAt(World w, int owner, VertexCoord v)
        {
            foreach (VertexCoord n in v.AdjacentVertices())
                if (w.roads.TryGetValue(new EdgeCoord(v, n), out Road road) && road.owner == owner)
                    return true;
            return false;
        }

        // A estrada nova "encosta" na rede deste jogador por esta ponta? Como no
        // Catan, uma construção do rival na ponta bloqueia a passagem.
        private static bool EndpointConnects(World w, int owner, VertexCoord v, EdgeCoord except)
        {
            if (w.buildings.TryGetValue(v, out Building b)) return b.owner == owner;
            foreach (VertexCoord n in v.AdjacentVertices())
            {
                var e = new EdgeCoord(v, n);
                if (e != except && w.roads.TryGetValue(e, out Road road) && road.owner == owner)
                    return true;
            }
            return false;
        }
    }
}
```

### 5.2 Regras do batedor: `ScoutRules`

```csharp
// Caminho: Assets/_Project/Scripts/Sim/ScoutRules.cs
using ProjetoHex.Grid;

namespace ProjetoHex.Sim
{
    // POR QUE: decidir para onde um batedor pode ir e se dá para treinar outro
    // (Parte 1 §6, placeholders de MVP).
    // ESTRATÉGIA: mesmo formato do BuildRules (true/false + motivo).
    public static class ScoutRules
    {
        // Pode mandar um batedor para este hexágono?
        public static bool CanSendScout(World w, int owner, HexCoord target, out string reason)
        {
            Faction f = w.factions[owner];
            if (!w.InMap(target)) { reason = "Fora do mapa."; return false; }
            if (f.revealed.Contains(target)) { reason = "Já explorado."; return false; }
            if (f.IsScouting(target)) { reason = "Um batedor já está a caminho."; return false; }
            if (!w.IsFrontier(owner, target)) { reason = "Só dá para explorar ao lado de um hexágono conhecido."; return false; }
            if (f.IdleScouts <= 0) { reason = "Nenhum batedor livre."; return false; }
            reason = null;
            return true;
        }

        // Pode treinar mais um batedor?
        public static bool CanTrainScout(World w, int owner, out string reason)
        {
            Faction f = w.factions[owner];
            if (f.scoutsOwned >= w.config.maxScouts) { reason = $"Limite de {w.config.maxScouts} batedores."; return false; }
            if (!f.CanAfford(w.config.scoutCost)) { reason = "Recursos insuficientes."; return false; }
            reason = null;
            return true;
        }
    }
}
```

### 5.3 As ações: `WorldActions`

```csharp
// Caminho: Assets/_Project/Scripts/Sim/WorldActions.cs
using ProjetoHex.Grid;

namespace ProjetoHex.Sim
{
    // POR QUE: o único jeito de jogador e rival mudarem o mundo. Checa a regra,
    // paga o custo, aplica a mudança e avisa a tela, sempre nessa ordem.
    // ESTRATÉGIA: cada Try* chama a regra correspondente primeiro; se ela disser
    // não, nada muda e o motivo volta para quem chamou mostrar na tela.
    public static class WorldActions
    {
        // Constrói uma vila na interseção.
        public static bool TryBuildVillage(World w, int owner, VertexCoord v, out string reason)
        {
            if (!BuildRules.CanBuildVillage(w, owner, v, out reason)) return false;
            w.factions[owner].Pay(w.config.villageCost);
            w.buildings[v] = new Building { vertex = v, owner = owner, level = Building.Village };
            w.NotifyChanged();
            return true;
        }

        // Transforma uma vila em cidade.
        public static bool TryUpgradeToCity(World w, int owner, VertexCoord v, out string reason)
        {
            if (!BuildRules.CanUpgradeToCity(w, owner, v, out reason)) return false;
            w.factions[owner].Pay(w.config.cityCost);
            w.buildings[v].level = Building.City;
            w.NotifyChanged();
            return true;
        }

        // Constrói uma estrada na aresta.
        public static bool TryBuildRoad(World w, int owner, EdgeCoord e, out string reason)
        {
            if (!BuildRules.CanBuildRoad(w, owner, e, out reason)) return false;
            w.factions[owner].Pay(w.config.roadCost);
            w.roads[e] = new Road { edge = e, owner = owner };
            w.NotifyChanged();
            return true;
        }

        // Manda um batedor livre para o hexágono; ele revela quando o tempo acabar (Simulation).
        public static bool TrySendScout(World w, int owner, HexCoord target, out string reason)
        {
            if (!ScoutRules.CanSendScout(w, owner, target, out reason)) return false;
            w.factions[owner].scoutJobs.Add(new ScoutJob { target = target, remaining = w.config.scoutSeconds });
            w.NotifyChanged();
            return true;
        }

        // Treina mais um batedor (instantâneo no MVP, Parte 1 §7).
        public static bool TryTrainScout(World w, int owner, out string reason)
        {
            if (!ScoutRules.CanTrainScout(w, owner, out reason)) return false;
            w.factions[owner].Pay(w.config.scoutCost);
            w.factions[owner].scoutsOwned++;
            w.NotifyChanged();
            return true;
        }
    }
}
```

### 5.4 O painel de ação: `ActionPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ActionPanel.cs
using System.Text;
using ProjetoHex.Data;
using ProjetoHex.Grid;
using ProjetoHex.Meta;
using ProjetoHex.Sim;
using ProjetoHex.View;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace ProjetoHex.UI
{
    // POR QUE: ao tocar no mapa, o jogador vê o que é aquilo e qual ação dá
    // para fazer ali (Parte 1 §13). Se a ação não for possível, o painel mostra
    // o motivo vindo das regras ("Precisa de uma estrada sua chegando aqui").
    // ESTRATÉGIA: um botão de ação só, que muda de função conforme o alvo:
    // interseção vazia = vila, sua vila = cidade, aresta = estrada, névoa =
    // batedor. Enquanto está aberto, o painel se atualiza a cada frame, porque
    // o estoque sobe sozinho e o botão pode passar a ser possível.
    public class ActionPanel : MonoBehaviour
    {
        [SerializeField] private MapPointer _pointer;
        [Tooltip("O painel visível. Precisa ser um FILHO deste objeto: este script tem de ficar ativo para ouvir os toques.")]
        [SerializeField] private GameObject _root;
        [SerializeField] private TMP_Text _title;
        [SerializeField] private TMP_Text _details;
        [SerializeField] private Button _actionButton;
        [SerializeField] private TMP_Text _actionLabel;
        [SerializeField] private Button _closeButton;

        private enum PanelAction { None, BuildVillage, UpgradeCity, BuildRoad, SendScout }

        private MapTarget _target;
        private PanelAction _action;
        private bool _open;

        // Liga os botões uma vez e começa fechado.
        private void Awake()
        {
            _actionButton.onClick.AddListener(OnActionClicked);
            _closeButton.onClick.AddListener(Hide);
            Hide();
        }

        // OnEnable/OnDisable: começa/para de ouvir os toques no mapa.
        private void OnEnable() => _pointer.Tapped += Show;
        private void OnDisable() => _pointer.Tapped -= Show;

        // Abre o painel para o alvo tocado.
        private void Show(MapTarget target)
        {
            _target = target;
            _open = true;
            _root.SetActive(true);
            RefreshPanel();
        }

        // Fecha o painel.
        private void Hide()
        {
            _open = false;
            _root.SetActive(false);
        }

        // Mantém o painel em dia enquanto está aberto.
        private void Update()
        {
            if (_open) RefreshPanel();
        }

        // Decide título, detalhes e botão conforme o tipo de alvo e o estado do mundo.
        private void RefreshPanel()
        {
            World w = GameManager.Instance.World;
            Faction me = w.factions[World.Player];
            _action = PanelAction.None;
            bool can = false;
            string reason = null;

            switch (_target.kind)
            {
                case MapTargetKind.Vertex:
                    if (w.buildings.TryGetValue(_target.vertex, out Building b))
                    {
                        bool mine = b.owner == World.Player;
                        _title.text = !mine ? "Construção do rival" : b.level == Building.City ? "Sua cidade" : "Sua vila";
                        if (mine && b.level == Building.Village)
                        {
                            _action = PanelAction.UpgradeCity;
                            can = BuildRules.CanUpgradeToCity(w, World.Player, _target.vertex, out reason);
                            _actionLabel.text = $"Virar cidade ({ResourceTypes.Format(w.config.cityCost)})";
                        }
                    }
                    else
                    {
                        _title.text = "Interseção livre";
                        _action = PanelAction.BuildVillage;
                        can = BuildRules.CanBuildVillage(w, World.Player, _target.vertex, out reason);
                        _actionLabel.text = $"Construir vila ({ResourceTypes.Format(w.config.villageCost)})";
                    }
                    _details.text = DescribeHexes(w, _target.vertex.TouchingHexes(), me);
                    break;

                case MapTargetKind.Edge:
                    if (w.roads.TryGetValue(_target.edge, out Road road))
                    {
                        _title.text = road.owner == World.Player ? "Sua estrada" : "Estrada do rival";
                    }
                    else
                    {
                        _title.text = "Caminho livre";
                        _action = PanelAction.BuildRoad;
                        can = BuildRules.CanBuildRoad(w, World.Player, _target.edge, out reason);
                        _actionLabel.text = $"Construir estrada ({ResourceTypes.Format(w.config.roadCost)})";
                    }
                    _details.text = "Estradas levam suas vilas a novas interseções.";
                    break;

                default: // Hex
                    if (me.revealed.Contains(_target.hex) && w.hexes.TryGetValue(_target.hex, out HexCell cell))
                    {
                        _title.text = cell.terrain.displayName;
                        _details.text = $"Produz {cell.terrain.amountPerCycle} {ResourceTypes.Label(cell.terrain.resource)} " +
                                        $"a cada {cell.terrain.cycleSeconds:0}s para cada vila encostada (cidade: {w.config.cityYield}x).";
                    }
                    else
                    {
                        _title.text = "Terra desconhecida";
                        _details.text = ScoutStatus(me, _target.hex, w.config.scoutSeconds);
                        _action = PanelAction.SendScout;
                        can = ScoutRules.CanSendScout(w, World.Player, _target.hex, out reason);
                        _actionLabel.text = $"Enviar batedor ({w.config.scoutSeconds:0}s)";
                    }
                    break;
            }

            _actionButton.gameObject.SetActive(_action != PanelAction.None);
            _actionButton.interactable = can;
            if (_action != PanelAction.None && !can && reason != null)
                _details.text += $"\n<color=#ff8080>{reason}</color>";
        }

        // Executa a ação do botão. As regras já foram checadas, mas WorldActions checa de novo.
        private void OnActionClicked()
        {
            World w = GameManager.Instance.World;
            switch (_action)
            {
                case PanelAction.BuildVillage: WorldActions.TryBuildVillage(w, World.Player, _target.vertex, out _); break;
                case PanelAction.UpgradeCity: WorldActions.TryUpgradeToCity(w, World.Player, _target.vertex, out _); break;
                case PanelAction.BuildRoad: WorldActions.TryBuildRoad(w, World.Player, _target.edge, out _); break;
                case PanelAction.SendScout: WorldActions.TrySendScout(w, World.Player, _target.hex, out _); break;
            }
            RefreshPanel();
        }

        // Lista o que uma interseção coletaria: um item por hexágono que ela toca.
        private static string DescribeHexes(World w, HexCoord[] hexes, Faction me)
        {
            var sb = new StringBuilder("Coleta de:");
            foreach (HexCoord h in hexes)
            {
                if (!w.hexes.TryGetValue(h, out HexCell cell)) continue;
                if (!me.revealed.Contains(h)) { sb.Append("\n- ? (inexplorado)"); continue; }
                sb.Append($"\n- {ResourceTypes.Label(cell.terrain.resource)} a cada {cell.terrain.cycleSeconds:0}s");
            }
            return sb.ToString();
        }

        // Texto de um hexágono na névoa: tem batedor a caminho?
        private static string ScoutStatus(Faction me, HexCoord hex, float scoutSeconds)
        {
            foreach (ScoutJob job in me.scoutJobs)
                if (job.target == hex) return $"Batedor a caminho: faltam {job.remaining:0}s.";
            return $"Um batedor leva {scoutSeconds:0}s para revelar este hexágono.";
        }
    }
}
```

### 5.5 Botão de treinar batedor: `TrainScoutButton`

```csharp
// Caminho: Assets/_Project/Scripts/UI/TrainScoutButton.cs
using ProjetoHex.Data;
using ProjetoHex.Meta;
using ProjetoHex.Sim;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace ProjetoHex.UI
{
    // POR QUE: treinar batedores é uma ação global, não de um lugar do mapa, então
    // fica num botão fixo da HUD (Parte 1 §13).
    // ESTRATÉGIA: o botão só fica clicável quando ScoutRules permite; o texto mostra o custo.
    public class TrainScoutButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private TMP_Text _label;

        // Liga o clique à ação.
        private void Awake()
        {
            _button.onClick.AddListener(() => WorldActions.TryTrainScout(GameManager.Instance.World, World.Player, out _));
        }

        // Atualiza se dá para clicar e o texto do custo.
        private void Update()
        {
            World w = GameManager.Instance.World;
            _button.interactable = ScoutRules.CanTrainScout(w, World.Player, out _);
            _label.text = $"Treinar batedor ({ResourceTypes.Format(w.config.scoutCost)})";
        }
    }
}
```

### 5.6 Montar a UI

1. No Canvas, crie um GameObject vazio `ActionPanel` com o script `ActionPanel`.
2. Dentro dele, crie o filho `Panel` (UI → Panel), ancorado embaixo, com:
   - um texto `Title` e um texto `Details`;
   - um botão `ActionButton`, com o texto `Label`;
   - um botão `Close` ("X").
3. Arraste para os campos do `ActionPanel`:
   - `Panel` vai em `Root` (é o filho que liga e desliga; o `ActionPanel` em si fica sempre ativo);
   - a câmera (que tem o `MapPointer`) vai em `Pointer`;
   - os textos e botões vão nos campos correspondentes.
4. Crie um botão `TrainScout` no canto da HUD, com o script `TrainScoutButton`. Arraste o próprio `Button` e o texto dele para os campos.

### ✅ Checkpoint da Fase 5
- Tocar numa aresta colada na sua vila mostra "Caminho livre" e o botão "Construir estrada". Depois de construir, a linha azul aparece e o estoque cai.
- Tocar na interseção do outro lado da estrada mostra "Construir vila". Se você estiver sem recursos ou a área não estiver explorada, o motivo aparece em vermelho e o botão fica cinza.
- Tocar numa interseção colada numa construção mostra "Muito perto de outra construção" (com `distanceRule` ligada).
- Tocar num hexágono de névoa clara e "Enviar batedor" faz aparecer o marcador amarelo. Depois de 60 s (ou menos, com `Debug Time Scale`), o hexágono é revelado e a fronteira avança.
- Tocar na sua vila e "Virar cidade" deixa o círculo maior, e os hexágonos em volta passam a render o dobro.
- Desligar `requireRoadConnection` no `GameConfig` permite construir vila sem estrada.

#### Problemas comuns
- **O painel abre uma vez e nunca mais:** o script `ActionPanel` está no mesmo objeto que o `Root`. Ao esconder, o `OnDisable` para de ouvir os toques. Coloque o painel visível como filho.
- **Clicar no botão também seleciona o mapa atrás dele:** o painel precisa de uma **Image** com **Raycast Target** marcado no fundo, para o `IsOverUI` do `MapPointer` detectar a UI.
- **Nunca consigo tocar numa interseção (sempre dá hexágono):** o `Pick Radius` do `MapPointer` ficou pequeno para o zoom atual. Aumente para 0.35 ou dê mais zoom.

Próxima fase: **Rival IA**, com uma vila controlada pelo computador que explora, constrói e disputa interseções com você.

---

# Parte 9 — Implementação Unity: Fase 6 (Rival IA)

## Fase 6 — Rival IA

> Objetivo desta fase: o rival do MVP (Parte 1 §9). Ele explora com batedores, abre estradas e ocupa as melhores interseções antes de você. Comércio e conflito ficam para depois.

### 6.1 O cérebro do rival: `RivalAI`

```csharp
// Caminho: Assets/_Project/Scripts/Sim/RivalAI.cs
using System.Collections.Generic;
using ProjetoHex.Grid;
using UnityEngine;

namespace ProjetoHex.Sim
{
    // POR QUE: o MVP tem 1 rival que só disputa espaço (Parte 1 §9 e §16). Ele
    // precisa parecer que "quer" as boas interseções, sem ser perfeito.
    // ESTRATÉGIA: a cada rivalThinkSeconds, o rival decide UMA ação de
    // construção, em ordem de prioridade:
    //   1) virar cidade, se já tem os recursos;
    //   2) construir vila no melhor lugar que já alcança (se o lugar existe mas
    //      falta recurso, ele ESPERA juntando, em vez de gastar em estrada);
    //   3) abrir estrada rumo ao melhor lugar a até 3 arestas de distância
    //      (busca em largura, BFS);
    // e, à parte, cuida dos batedores. Ele usa as mesmas WorldActions do
    // jogador, então nunca quebra as regras. É C# puro, então também roda no
    // progresso offline.
    public class RivalAI
    {
        private const int MaxRoadSearch = 3; // quantas arestas à frente ele procura lugares
        private enum SiteResult { Built, Waiting, None }

        private readonly int _owner;
        private readonly System.Random _rng = new System.Random();

        public RivalAI(int owner)
        {
            _owner = owner;
        }

        // Chamado pelo GameManager com o tempo que passou; decide quando der a hora.
        public void Tick(World w, float dt)
        {
            w.rivalThinkTimer += dt;
            while (w.rivalThinkTimer >= w.config.rivalThinkSeconds)
            {
                w.rivalThinkTimer -= w.config.rivalThinkSeconds;
                Think(w);
            }
        }

        // Uma rodada de decisão.
        private void Think(World w)
        {
            ManageScouts(w);
            if (TryUpgradeACity(w)) return;
            SiteResult site = TryBestVillage(w);
            if (site != SiteResult.None) return; // construiu ou está juntando recurso para isso
            TryRoadTowardBestSite(w);
        }

        // 1) Vira cidade a vila que coleta mais, se tiver os recursos.
        private bool TryUpgradeACity(World w)
        {
            if (!w.factions[_owner].CanAfford(w.config.cityCost)) return false;
            Building best = null;
            float bestScore = -1f;
            foreach (Building b in w.buildings.Values)
            {
                if (b.owner != _owner || b.level != Building.Village) continue;
                float s = SiteScore(w, b.vertex);
                if (s > bestScore) { bestScore = s; best = b; }
            }
            return best != null && WorldActions.TryUpgradeToCity(w, _owner, best.vertex, out _);
        }

        // 2) Vila no melhor lugar já alcançado pelas estradas.
        private SiteResult TryBestVillage(World w)
        {
            IEnumerable<VertexCoord> candidates = w.config.requireRoadConnection ? NetworkVertices(w) : RevealedCorners(w);
            VertexCoord best = default;
            float bestScore = -1f;
            foreach (VertexCoord v in candidates)
            {
                if (!BuildRules.SiteIsFree(w, _owner, v, out _)) continue;
                float s = SiteScore(w, v);
                if (s > bestScore) { bestScore = s; best = v; }
            }
            if (bestScore < 0f) return SiteResult.None;
            return WorldActions.TryBuildVillage(w, _owner, best, out _) ? SiteResult.Built : SiteResult.Waiting;
        }

        // 3) Busca em largura a partir da rede de estradas até achar o melhor
        //    lugar a até MaxRoadSearch arestas; constrói o PRIMEIRO trecho do caminho.
        private void TryRoadTowardBestSite(World w)
        {
            if (!w.config.requireRoadConnection) return;

            var depth = new Dictionary<VertexCoord, int>();
            var parent = new Dictionary<VertexCoord, VertexCoord>();
            var queue = new Queue<VertexCoord>();
            foreach (VertexCoord v in NetworkVertices(w))
            {
                if (OccupiedByOther(w, v)) continue;
                depth[v] = 0;
                queue.Enqueue(v);
            }

            VertexCoord best = default;
            float bestScore = -1f;
            while (queue.Count > 0)
            {
                VertexCoord v = queue.Dequeue();
                int d = depth[v];
                if (d > 0 && BuildRules.SiteIsFree(w, _owner, v, out _))
                {
                    float s = SiteScore(w, v) - d * 0.01f; // no empate, o mais perto ganha
                    if (s > bestScore) { bestScore = s; best = v; }
                }
                if (d >= MaxRoadSearch) continue;
                foreach (VertexCoord n in v.AdjacentVertices())
                {
                    if (depth.ContainsKey(n) || !w.VertexInMap(n) || OccupiedByOther(w, n)) continue;
                    var e = new EdgeCoord(v, n);
                    if (w.roads.ContainsKey(e) || !BuildRules.TouchesRevealed(w, _owner, e)) continue;
                    depth[n] = d + 1;
                    parent[n] = v;
                    queue.Enqueue(n);
                }
            }
            if (bestScore < 0f) return;

            // Volta pelo caminho até o passo que sai da rede.
            VertexCoord step = best;
            while (depth[parent[step]] > 0) step = parent[step];
            WorldActions.TryBuildRoad(w, _owner, new EdgeCoord(parent[step], step), out _);
        }

        // Treina até 2 batedores e manda os livres para a fronteira, de preferência perto de casa.
        private void ManageScouts(World w)
        {
            Faction f = w.factions[_owner];
            if (f.scoutsOwned < 2) WorldActions.TryTrainScout(w, _owner, out _);
            if (f.IdleScouts <= 0) return;

            HexCoord home = (_owner == World.Rival ? w.rivalStart : w.playerStart).Hex;
            var frontier = new List<HexCoord>();
            foreach (HexCoord h in f.revealed)
                for (int d = 0; d < 6; d++)
                {
                    HexCoord n = h.Neighbor(d);
                    if (w.IsFrontier(_owner, n) && !f.IsScouting(n) && !frontier.Contains(n)) frontier.Add(n);
                }
            frontier.Sort((a, b) => a.DistanceTo(home).CompareTo(b.DistanceTo(home)));

            while (f.IdleScouts > 0 && frontier.Count > 0)
            {
                int i = _rng.Next(Mathf.Min(3, frontier.Count)); // um dos 3 mais perto, para não ser previsível
                WorldActions.TrySendScout(w, _owner, frontier[i], out _);
                frontier.RemoveAt(i);
            }
        }

        // Quanto vale uma interseção: recurso por segundo dos hexágonos revelados
        // que ela toca, com bônus para o que está faltando no estoque.
        private float SiteScore(World w, VertexCoord v)
        {
            Faction f = w.factions[_owner];
            float score = 0f;
            foreach (HexCoord h in v.TouchingHexes())
            {
                if (!w.hexes.TryGetValue(h, out HexCell cell) || !f.revealed.Contains(h)) continue;
                float perSecond = cell.terrain.amountPerCycle / cell.terrain.cycleSeconds;
                bool lacking = f.Get(cell.terrain.resource) < 2;
                score += perSecond * (lacking ? 1.5f : 1f);
            }
            return score;
        }

        // Todas as interseções onde o rival já está: suas construções e as pontas das suas estradas.
        private HashSet<VertexCoord> NetworkVertices(World w)
        {
            var set = new HashSet<VertexCoord>();
            foreach (Building b in w.buildings.Values)
                if (b.owner == _owner) set.Add(b.vertex);
            foreach (Road r in w.roads.Values)
                if (r.owner == _owner) { set.Add(r.edge.a); set.Add(r.edge.b); }
            return set;
        }

        // Sem a regra da estrada: qualquer canto de hexágono revelado é candidato.
        private HashSet<VertexCoord> RevealedCorners(World w)
        {
            var set = new HashSet<VertexCoord>();
            foreach (HexCoord h in w.factions[_owner].revealed)
                foreach (VertexCoord v in h.Corners()) set.Add(v);
            return set;
        }

        // Tem construção de outro jogador nesta interseção?
        private bool OccupiedByOther(World w, VertexCoord v) =>
            w.buildings.TryGetValue(v, out Building b) && b.owner != _owner;
    }
}
```

### 6.2 Ligar o rival no `GameManager`

No `GameManager`:

1. Acrescente o campo `private RivalAI _rival;`.
2. No fim do `Awake`, acrescente `_rival = new RivalAI(World.Rival);`.
3. Troque o `Step` por:

```csharp
        // Avança o jogo em dt segundos: produção, batedores e o rival.
        private void Step(float dt)
        {
            Simulation.Tick(World, dt);
            if (Config.rivalEnabled) _rival.Tick(World, dt);
        }
```

### ✅ Checkpoint da Fase 6
- Com `Debug Time Scale = 10`, depois de alguns minutos de jogo, mandar batedores na direção do rival revela estradas e vilas **vermelhas**.
- Tocar numa interseção vermelha mostra "Construção do rival", sem botão de ação.
- O rival não constrói colado nas suas construções (regra de distância) nem passa estrada por cima da sua vila.
- Com `rivalEnabled` desligado no `GameConfig` e um jogo novo, não aparece rival nenhum.

#### Problemas comuns
- **O rival não faz nada:** com `rivalEnabled` desligado na hora em que o jogo foi criado, ele não ganhou vila inicial. Ligue e comece um jogo novo (na Fase 7, apague o save).
- **O rival trava sem crescer:** a vila inicial dele está encostada em hexágonos que ele não consegue explorar (borda do mapa). Teste outra seed ou aumente `mapRadius`.
- **Quero ver o rival sem explorar:** para debug, troque temporariamente `PlayerSees` no `MapView` para sempre retornar `true`.

Próxima fase: **Save Local e Progresso Offline**, para fechar o jogo, voltar horas depois e encontrar tudo produzido.

---

# Parte 10 — Implementação Unity: Fase 7 (Save Local e Progresso Offline)

## Fase 7 — Save Local e Progresso Offline

> Objetivo desta fase: o jogo salva sozinho no aparelho (Parte 1 §15). Ao reabrir, ou ao voltar de outra aba ou app, ele calcula o tempo que passou (até o limite de 8 h) e simula esse tempo de uma vez, mostrando "enquanto você esteve fora" (Parte 1 §10).

### 7.1 O formato do save: `SaveData`

```csharp
// Caminho: Assets/_Project/Scripts/Meta/SaveData.cs
using System;
using System.Collections.Generic;
using ProjetoHex.Grid;
using ProjetoHex.Sim;

namespace ProjetoHex.Meta
{
    // POR QUE: o World usa Dictionary e HashSet, que o JsonUtility do Unity não
    // sabe gravar. Este é o "retrato" do mundo em listas e arrays simples.
    // ESTRATÉGIA: o terreno NÃO é gravado: guarda-se a seed e o mapa é gerado de
    // novo (WorldFactory.Generate é determinístico). mapRadius e terrainCount
    // servem para detectar um save de uma configuração diferente.
    [Serializable]
    public class SaveData
    {
        public int version;
        public int seed;
        public int mapRadius;
        public int terrainCount;
        public long savedAtUtcTicks; // DateTime.UtcNow.Ticks do momento do save
        public float[] hexProgress;  // na ordem de World.hexList
        public FactionSave[] factions;
        public List<Building> buildings;
        public List<Road> roads;
        public float rivalThinkTimer;
    }

    // POR QUE: a parte de um jogador no save (estoque, névoa, batedores).
    [Serializable]
    public class FactionSave
    {
        public int[] bank;
        public List<HexCoord> revealed;
        public int scoutsOwned;
        public List<ScoutJob> scoutJobs;
    }

    // POR QUE: o que mostrar na tela "enquanto você esteve fora".
    public class OfflineReport
    {
        public double seconds;
        public bool hitCap;
        public int[] gained;
        public int hexesRevealed;
    }
}
```

### 7.2 Gravar e carregar: `SaveSystem`

```csharp
// Caminho: Assets/_Project/Scripts/Meta/SaveSystem.cs
using System;
using System.Collections.Generic;
using ProjetoHex.Data;
using ProjetoHex.Grid;
using ProjetoHex.Sim;
using UnityEngine;

namespace ProjetoHex.Meta
{
    // POR QUE: o MVP é offline com save local (Parte 1 §15) e precisa funcionar
    // igual em PC, celular e navegador.
    // ESTRATÉGIA: o mundo vira JSON (JsonUtility) e é guardado no PlayerPrefs.
    // PlayerPrefs funciona nas três plataformas sem código especial (no WebGL
    // ele vai para o armazenamento do navegador). O save tem poucos KB, bem
    // abaixo do limite de 1 MB do WebGL.
    public static class SaveSystem
    {
        private const string Key = "projetohex_save";
        private const int CurrentVersion = 1;

        // Grava o mundo inteiro, com a hora atual.
        public static void Save(World w)
        {
            var data = new SaveData
            {
                version = CurrentVersion,
                seed = w.seed,
                mapRadius = w.config.mapRadius,
                terrainCount = w.config.terrains.Length,
                savedAtUtcTicks = DateTime.UtcNow.Ticks,
                hexProgress = new float[w.hexList.Count],
                factions = new FactionSave[w.factions.Length],
                buildings = new List<Building>(w.buildings.Values),
                roads = new List<Road>(w.roads.Values),
                rivalThinkTimer = w.rivalThinkTimer,
            };
            for (int i = 0; i < w.hexList.Count; i++) data.hexProgress[i] = w.hexList[i].progress;
            for (int i = 0; i < w.factions.Length; i++)
            {
                Faction f = w.factions[i];
                data.factions[i] = new FactionSave
                {
                    bank = (int[])f.bank.Clone(),
                    revealed = new List<HexCoord>(f.revealed),
                    scoutsOwned = f.scoutsOwned,
                    scoutJobs = new List<ScoutJob>(f.scoutJobs),
                };
            }
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(data));
            PlayerPrefs.Save(); // grava no disco agora, não só ao fechar o jogo
        }

        // Tenta remontar o mundo do save. Devolve false se não há save ou se ele
        // é de outra versão/configuração (aí o GameManager começa um jogo novo).
        public static bool TryLoad(GameConfig config, out World world, out long savedAtUtcTicks)
        {
            world = null;
            savedAtUtcTicks = 0;
            if (!PlayerPrefs.HasKey(Key)) return false;

            SaveData data;
            try
            {
                data = JsonUtility.FromJson<SaveData>(PlayerPrefs.GetString(Key));
            }
            catch (Exception e)
            {
                Debug.LogWarning($"Save corrompido, começando do zero: {e.Message}");
                return false;
            }
            if (data == null || data.version != CurrentVersion ||
                data.mapRadius != config.mapRadius || data.terrainCount != config.terrains.Length)
            {
                Debug.LogWarning("Save de outra versão ou configuração; começando do zero.");
                return false;
            }

            World w = WorldFactory.Generate(config, data.seed);
            if (data.hexProgress == null || data.hexProgress.Length != w.hexList.Count) return false;
            for (int i = 0; i < w.hexList.Count; i++) w.hexList[i].progress = data.hexProgress[i];

            for (int i = 0; i < w.factions.Length && i < data.factions.Length; i++)
            {
                Faction f = w.factions[i];
                FactionSave s = data.factions[i];
                Array.Copy(s.bank, f.bank, Math.Min(s.bank.Length, f.bank.Length));
                foreach (HexCoord h in s.revealed) f.revealed.Add(h);
                f.scoutsOwned = s.scoutsOwned;
                f.scoutJobs.AddRange(s.scoutJobs);
            }
            foreach (Building b in data.buildings) w.buildings[b.vertex] = b;
            foreach (Road r in data.roads) w.roads[r.edge] = r;
            w.rivalThinkTimer = data.rivalThinkTimer;

            world = w;
            savedAtUtcTicks = data.savedAtUtcTicks;
            return true;
        }

        // Apaga o save (para testar do zero).
        public static void Delete()
        {
            PlayerPrefs.DeleteKey(Key);
            PlayerPrefs.Save();
        }
    }
}
```

### 7.3 `GameManager` (versão completa)

Substitua o `GameManager` inteiro por esta versão, que junta o relógio da Fase 4, o rival da Fase 6, o save e o progresso offline:

```csharp
// Caminho: Assets/_Project/Scripts/Meta/GameManager.cs (versão completa)
using System;
using ProjetoHex.Data;
using ProjetoHex.Grid;
using ProjetoHex.Sim;
using UnityEngine;

namespace ProjetoHex.Meta
{
    // POR QUE: dono do World e do relógio. Cria ou carrega o mundo, faz o tempo
    // passar, salva sozinho e aplica o tempo em que o jogador esteve fora
    // (Parte 1 §10).
    // ESTRATÉGIA:
    // - Tempo ao vivo: Step(Time.deltaTime) a cada frame.
    // - Tempo fora: a diferença do relógio do aparelho (DateTime.UtcNow), aplicada
    //   em passos de 1 s com o mesmo Step. O Update compara a hora real entre
    //   frames: se passou mais de alguns segundos (celular bloqueado, aba do
    //   navegador escondida, PC hibernando), também conta como tempo fora. O
    //   Unity não roda Update nesses casos, e Time.deltaTime não "vê" a pausa.
    // - Save: sempre que algo estrutural muda (evento Changed), a cada
    //   autosaveSeconds e ao pausar/fechar.
    [DefaultExecutionOrder(-100)]
    public class GameManager : MonoBehaviour
    {
        private const float OfflineStepSeconds = 1f;

        [Tooltip("Só para testar: 10 = o tempo do jogo passa 10x mais rápido.")]
        [SerializeField] private float _debugTimeScale = 1f;
        [Tooltip("Pausas maiores que isso (aba escondida, celular bloqueado) contam como tempo offline.")]
        [SerializeField] private float _gapAsOfflineSeconds = 5f;

        public static GameManager Instance { get; private set; }
        public GameConfig Config { get; private set; }
        public HexLayout Layout { get; private set; }
        public World World { get; private set; }

        // Avisado quando um tempo offline é aplicado (a tela de "enquanto você esteve fora" ouve).
        public event Action<OfflineReport> OfflineProgressApplied;

        private RivalAI _rival;
        private OfflineReport _pendingReport;
        private DateTime _lastFrameUtc;
        private float _autosaveTimer;
        private bool _dirty;
        private bool _saveDisabled;

        // Carrega o save (e aplica o tempo fora) ou cria um jogo novo.
        private void Awake()
        {
            Instance = this;
            Config = GameConfig.Load();
            Layout = new HexLayout(Config.hexSize, Config.isoYScale);
            _rival = new RivalAI(World.Rival);

            if (SaveSystem.TryLoad(Config, out World loaded, out long savedAtTicks))
            {
                World = loaded;
                double away = (DateTime.UtcNow - new DateTime(savedAtTicks, DateTimeKind.Utc)).TotalSeconds;
                ApplyOffline(away);
            }
            else
            {
                World = WorldFactory.NewGame(Config);
            }

            World.Changed += () => _dirty = true;
            _lastFrameUtc = DateTime.UtcNow;
        }

        // A cada frame: avança o tempo (ao vivo ou "pulo" offline) e salva se precisar.
        private void Update()
        {
            DateTime now = DateTime.UtcNow;
            double gap = (now - _lastFrameUtc).TotalSeconds;
            _lastFrameUtc = now;

            if (gap > _gapAsOfflineSeconds) ApplyOffline(gap);
            else Step(Time.deltaTime * _debugTimeScale);

            _autosaveTimer += Time.unscaledDeltaTime;
            if (_dirty || _autosaveTimer >= Config.autosaveSeconds) Save();
        }

        // Celular indo para segundo plano: salva já, porque o sistema pode matar o app.
        private void OnApplicationPause(bool paused)
        {
            if (paused) Save();
        }

        // Fechando o jogo (no WebGL nem sempre é chamado; por isso existe o autosave).
        private void OnApplicationQuit() => Save();

        // Grava agora.
        public void Save()
        {
            if (_saveDisabled) return;
            SaveSystem.Save(World);
            _dirty = false;
            _autosaveTimer = 0f;
        }

        // A tela de offline pega o relatório gerado no Awake (antes de ela existir).
        public OfflineReport ConsumePendingReport()
        {
            OfflineReport r = _pendingReport;
            _pendingReport = null;
            return r;
        }

        // Avança o jogo em dt segundos: produção, batedores e o rival.
        private void Step(float dt)
        {
            Simulation.Tick(World, dt);
            if (Config.rivalEnabled) _rival.Tick(World, dt);
        }

        // Simula o tempo fora (até o limite) e monta o relatório do que o jogador ganhou.
        private void ApplyOffline(double seconds)
        {
            if (seconds <= 0) return; // relógio do aparelho voltou para trás: ignora (Parte 1 §10)
            double cap = Config.offlineCapHours * 3600.0;
            double applied = Math.Min(seconds, cap);

            Faction player = World.factions[World.Player];
            var before = (int[])player.bank.Clone();
            int revealedBefore = player.revealed.Count;

            double left = applied;
            while (left > 0)
            {
                float dt = (float)Math.Min(OfflineStepSeconds, left);
                Step(dt);
                left -= dt;
            }

            var report = new OfflineReport
            {
                seconds = applied,
                hitCap = seconds > cap,
                gained = new int[ResourceTypes.Count],
                hexesRevealed = player.revealed.Count - revealedBefore,
            };
            for (int i = 0; i < ResourceTypes.Count; i++) report.gained[i] = player.bank[i] - before[i];

            _pendingReport = report;
            OfflineProgressApplied?.Invoke(report);
        }

        // Menu de contexto do componente (clique nos 3 pontinhos do GameManager no Inspector).
        [ContextMenu("Apagar save")]
        private void DeleteSave()
        {
            SaveSystem.Delete();
            _saveDisabled = Application.isPlaying; // se estiver jogando, não regrava ao sair do Play
            Debug.Log("Save apagado. O próximo Play começa um jogo novo.");
        }
    }
}
```

### 7.4 Tela "enquanto você esteve fora": `OfflineReportPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/OfflineReportPanel.cs
using System;
using System.Text;
using ProjetoHex.Data;
using ProjetoHex.Meta;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace ProjetoHex.UI
{
    // POR QUE: no idle, voltar e ver "olha quanto você ganhou" é a recompensa
    // principal (Parte 1 §10). Sem essa tela, o progresso offline passa despercebido.
    // ESTRATÉGIA: pega o relatório do Awake (abriu o jogo) com
    // ConsumePendingReport, e ouve o evento para voltas de aba ou app com o jogo
    // já aberto. Ausências curtas (< 1 min) não abrem a tela.
    public class OfflineReportPanel : MonoBehaviour
    {
        [Tooltip("O painel visível, filho deste objeto.")]
        [SerializeField] private GameObject _root;
        [SerializeField] private TMP_Text _text;
        [SerializeField] private Button _okButton;
        [SerializeField] private float _minSecondsToShow = 60f;

        // Liga o botão e começa escondido.
        private void Awake()
        {
            _okButton.onClick.AddListener(() => _root.SetActive(false));
            _root.SetActive(false);
        }

        // Mostra o relatório da abertura do jogo, se houver, e passa a ouvir os próximos.
        private void Start()
        {
            GameManager gm = GameManager.Instance;
            gm.OfflineProgressApplied += Show;
            OfflineReport pending = gm.ConsumePendingReport();
            if (pending != null) Show(pending);
        }

        // Para de ouvir quando a cena fecha.
        private void OnDestroy()
        {
            if (GameManager.Instance != null) GameManager.Instance.OfflineProgressApplied -= Show;
        }

        // Monta o texto e abre o painel.
        private void Show(OfflineReport r)
        {
            if (r.seconds < _minSecondsToShow) return;
            TimeSpan t = TimeSpan.FromSeconds(r.seconds);
            var sb = new StringBuilder();
            sb.AppendLine($"Você ficou fora por {(int)t.TotalHours}h {t.Minutes:00}min.");
            if (r.hitCap) sb.AppendLine("(A produção offline tem um limite. Volte antes para não perder nada.)");

            bool any = false;
            for (int i = 0; i < r.gained.Length; i++)
                if (r.gained[i] > 0)
                {
                    sb.AppendLine($"+{r.gained[i]} {ResourceTypes.Label((ResourceType)i)}");
                    any = true;
                }
            if (r.hexesRevealed > 0) sb.AppendLine($"Seus batedores revelaram {r.hexesRevealed} hexágono(s).");
            if (!any) sb.AppendLine("Nada foi produzido. Construa vilas encostadas em recursos.");

            _text.text = sb.ToString();
            _root.SetActive(true);
        }
    }
}
```

### 7.5 Montar a UI

1. No Canvas, crie um GameObject vazio `OfflineReport` com o script `OfflineReportPanel`.
2. Dentro dele, crie o filho `Panel` (UI → Panel), centralizado, com um texto e um botão "OK".
3. Arraste o `Panel` para `Root`, e o texto e o botão para os campos correspondentes.
4. Deixe o `OfflineReport` como o último filho do Canvas, para ele ficar por cima de tudo.

### ✅ Checkpoint da Fase 7
- Construa uma estrada, saia do Play e entre de novo: a estrada continua lá, com o mesmo mapa e o mesmo estoque.
- Saia do Play, espere 2 minutos e entre de novo: aparece "Você ficou fora por 0h 02min" com os recursos ganhos, e os batedores em missão terminaram se o tempo deu.
- Com o jogo rodando, minimize o editor ou troque de aba no WebGL por mais de 1 minuto. Ao voltar, aparece a mesma tela.
- **Apagar save** (menu de contexto do `GameManager`) faz o próximo Play começar um mapa novo.

#### Problemas comuns
- **Toda vez começa um jogo novo:** o log "Save de outra versão ou configuração" indica que o `mapRadius` ou a quantidade de terrenos mudou desde o save. É de propósito; apague o save. Se não aparece log nenhum, o `Save()` não está rodando: confira se o `World.Changed += ...` está no `Awake`.
- **Voltar depois de 8 h trava o jogo por um instante:** são 28.800 passos de 1 s simulados de uma vez. Se ficar lento num celular fraco, aumente `OfflineStepSeconds` para 5. A produção continua certa, porque `Simulation.Tick` usa `while` para os ciclos.
- **Adiantar o relógio do aparelho dá recursos de graça:** é esperado sem backend (Parte 1 §10, **Em aberto**). O limite de 8 h só reduz o estrago.

Próxima fase: **Build e Próximos Passos**, com builds para PC, Android/iOS e WebGL e o que vem depois do MVP.

---

# Parte 11 — Implementação Unity: Fase 8 (Build e Próximos Passos)

## Fase 8 — Build e Próximos Passos

> Objetivo desta fase: o MVP rodando fora do editor nas três plataformas (Parte 1 §1), e a lista do que vem depois.

### 8.1 Antes de qualquer build

1. No `GameConfig`, deixe **Fixed Seed = 0** (mapa aleatório) e confira se o `Debug Time Scale` do `GameManager` está em **1**.
2. Desligue o `Log Taps` do `MapPointer`.
3. Em **Project Settings → Player**, preencha **Company Name** e **Product Name**. Use o nome de trabalho até o nome definitivo sair (**Em aberto**).
   - **Cuidado:** o PlayerPrefs de PC e de celular é guardado por Company/Product Name. Trocar o nome depois "perde" o save dos testadores.

### 8.2 PC (Windows / Steam / Itch)

1. **File → Build Profiles → Windows → Build.**
2. Teste:
   - arrastar e dar zoom com o mouse;
   - fechar pela janela e reabrir (o save precisa estar lá).

### 8.3 Mobile (Android / iOS)

1. **File → Build Profiles → Android** (ou **iOS**) → **Switch Platform**.
2. **Player → Resolution and Presentation → Default Orientation:** a orientação está **Em aberto** (Parte 1 §13). Para o MVP, use **Landscape Left**, que combina com a referência 1920 × 1080 do Canvas.
3. Teste num aparelho real:
   - pinça para zoom;
   - toque em interseção (pode precisar de mais zoom ou de um `Pick Radius` maior em telas pequenas);
   - bloquear a tela por 2 minutos e voltar (a tela de offline precisa aparecer).

### 8.4 Web (WebGL)

1. **File → Build Profiles → Web → Switch Platform.**
2. **Player → Publishing Settings:** para o itch.io, marque **Decompression Fallback**, porque o servidor do itch nem sempre manda os cabeçalhos de compressão que o Unity espera.
3. **Build**, compacte a pasta gerada num `.zip` e suba no itch.io como jogo HTML.
4. Teste:
   - recarregar a página (o save fica no navegador; o modo anônimo apaga tudo ao fechar);
   - trocar de aba por mais de 1 minuto e voltar.

#### Problemas comuns
- **WebGL abre com tela preta e erro de "Content-Encoding":** é o servidor sem os cabeçalhos de compressão. Marque **Decompression Fallback**, ou use **Compression Format = Disabled**.
- **No celular, tocar em botões também mexe no mapa:** algum painel não tem Image com **Raycast Target**, então o `IsOverUI` não o enxerga.

### ✅ Checkpoint da Fase 8
- Os builds de PC, de celular e de WebGL abrem, mostram o mapa e aceitam input.
- Nas três plataformas, fechar e reabrir mantém o progresso e mostra a tela de offline quando passou mais de 1 minuto.

### 8.5 Próximos passos (pós-MVP)

Em ordem sugerida. Tudo depende das decisões **Em aberto** da Parte 1 §18:

1. **Decidir a motivação de longo prazo** (Parte 1 §11), antes de mais conteúdo: é o maior risco do design.
2. **Arte isométrica:**
   - fechar o estilo (Parte 1 §12);
   - gerar os 5 hexágonos, a vila e a cidade. O PixelLab tem geração de tiles isométricos, e o SpriteCook gera arte HD;
   - ajustar `isoYScale` à altura da arte;
   - preencher o campo `sprite` de cada `TerrainDef`.
3. **Mais terrenos:** principalmente madeira (Parte 1 §3). É um `ResourceType` novo no fim do enum (atualize `ResourceTypes.Count`) e um `TerrainDef` novo.
4. **Comércio com o rival** (Parte 1 §9): uma `WorldActions.TryTrade` com taxas no `GameConfig`.
5. **Soldados e conflito** (Parte 1 §7 e §9): o tipo de unidade e as regras de ataque ainda precisam ser desenhados.
6. **Melhorias/tecnologia** (Parte 1 §8): multiplicadores no cálculo de `Simulation.Produce` e no `cycleSeconds`.
7. **Mais rivais:** o `World.factions` já é um array, e o `RivalAI` recebe o dono no construtor.
8. **Save na nuvem e checagem de horário pelo servidor** (Parte 1 §15), se a fraude de relógio virar problema.

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
