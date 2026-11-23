# GDD — Reinos Hex (nome de trabalho)

**Versão:** 0.2.0 · [histórico](#histórico-de-versões)

> Documento vivo. Rascunho inicial: este GDD separa o que já foi **Definido** pelo time do que está **Em aberto**. Tudo que aparece como **proposta** (principalmente os números da §15 e alguns detalhes de regra) foi escrito para o protótipo/guia funcionar, mas ainda não foi decidido: pode e deve mudar no primeiro playtest.
>
> **Protótipo:** [`prototipos/reinos-hex/`](prototipos/reinos-hex/) joga as regras desta Parte 1 no navegador, contra a IA ou a dois no mesmo aparelho (o online existe só no guia Unity). Ele usa o mesmo gerador e a mesma semente do guia, então a mesma semente dá o mesmo mapa nos dois.
>
> "Reinos Hex" é nome de trabalho (arquivos, pastas, namespace `ReinosHex.*`). O nome final está **Em aberto**. Apesar do tabuleiro hexagonal, este jogo **não tem relação** com o `ProjetoHex.md`: lá se constrói nos cantos dos hexágonos e tudo é por tempo; aqui cada hexágono inteiro tem dono, o jogo é por turnos e o território se conquista com exército.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Unity](#parte-2--guia-de-implementação-unity)
3. [Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-3--implementação-unity-fase-0-setup-do-projeto)
4. [Parte 4 — Implementação Unity: Fase 1 (Coordenadas Hexagonais)](#parte-4--implementação-unity-fase-1-coordenadas-hexagonais)
5. [Parte 5 — Implementação Unity: Fase 2 (Dados e Geração do Mapa)](#parte-5--implementação-unity-fase-2-dados-e-geração-do-mapa)
6. [Parte 6 — Implementação Unity: Fase 3 (Ações, Batalha e Turnos)](#parte-6--implementação-unity-fase-3-ações-batalha-e-turnos)
7. [Parte 7 — Implementação Unity: Fase 4 (Tabuleiro na Tela e Input)](#parte-7--implementação-unity-fase-4-tabuleiro-na-tela-e-input)
8. [Parte 8 — Implementação Unity: Fase 5 (Partida, HUD e Comandos)](#parte-8--implementação-unity-fase-5-partida-hud-e-comandos)
9. [Parte 9 — Implementação Unity: Fase 6 (IA)](#parte-9--implementação-unity-fase-6-ia)
10. [Parte 10 — Implementação Unity: Fase 7 (Menu e Dois Jogadores no Mesmo Aparelho)](#parte-10--implementação-unity-fase-7-menu-e-dois-jogadores-no-mesmo-aparelho)
11. [Parte 11 — Implementação Unity: Fase 8 (Multiplayer Online com Firebase)](#parte-11--implementação-unity-fase-8-multiplayer-online-com-firebase)
12. [Parte 12 — Implementação Unity: Fase 9 (Build e Próximos Passos)](#parte-12--implementação-unity-fase-9-build-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Nome:** **Em aberto** ("Reinos Hex" é provisório).
- **Gênero:** **Definido:** estratégia de conquista por turnos num tabuleiro de hexágonos.
- **Dimensão:** **Definido:** 2D.
- **Câmera/perspectiva:** **Definido:** topdown (tabuleiro visto de cima), com arrastar e zoom.
- **Plataforma-alvo:** **Definido:** PC e mobile. Input por mouse e por toque desde o MVP.
- **Modos:** **Definido:** contra IA, multiplayer local (duas pessoas no mesmo aparelho) e multiplayer online. Os três entram no MVP.
- **Objetivo:** **Definido:** conquistar a cidade do adversário, expandindo o seu reino hexágono a hexágono.
- **Referências/inspirações:** **Em aberto**.
- **Pilar de design:** **Em aberto**. Proposta para discutir: *"Cada hexágono é uma escolha: pagar pelo livre ou lutar pelo ocupado, e todo monstro vencido vira soldado seu."*

## 2. Loop Principal

**Definido:**

1. Cada jogador começa com **uma cidade** num hexágono.
2. Os hexágonos ao redor podem ter **recursos** (madeira, pedra, ouro, pasto...), **monstros** ou **saqueadores**.
3. No seu turno, você faz **uma única ação** (§6.3) e a vez passa. Com ela você expande o reino:
   - um hexágono **livre** (sem dono e sem ninguém nele) se conquista **pagando recursos** (§5);
   - um hexágono **inimigo** (do adversário, de monstros ou de saqueadores) se conquista **numa batalha** de soldados contra soldados (§7).
4. Cada hexágono seu **produz o recurso dele a cada turno** (§4).
5. Recursos pagam novos hexágonos, **torres de vigia** e **recrutam soldados** na cidade ou numa torre (§6.2).
6. Monstros e saqueadores vencidos **entram para o seu exército** (§8).
7. Quem tomar a cidade do adversário vence (§9).

## 3. O Tabuleiro

- **Definido:** o tabuleiro é uma grade de hexágonos vista de cima.
- **Definido:** cada hexágono tem um **terreno**, que define o recurso que ele produz, e pode ter **dono** (um jogador) e **tropas**.
- **Terrenos e recursos.** **Definido:** madeira, pedra, ouro e pasto foram citados como recursos. A tabela abaixo liga cada um a um terreno (os nomes dos terrenos são **proposta**):

| Terreno | Recurso produzido |
|---|---|
| Floresta | Madeira |
| Pedreira | Pedra |
| Mina de ouro | Ouro |
| Pasto | Pasto |
| Cidade | Um pouco de cada (§4) |

- **Em aberto:** outros recursos (a ideia original terminava em "etc."). Se "pasto" deve virar "comida" no texto do jogo.
- **Ocupantes neutros.** **Definido:** um hexágono pode ter **monstros** ou **saqueadores** (mercenários). Eles não pertencem a nenhum jogador e defendem o hexágono.
- **Formato e tamanho do mapa.** **Em aberto.** Proposta usada no guia: mapa em forma de hexágono grande com raio 5 (91 hexágonos), gerado a partir de uma **semente** e **espelhado** pelo centro, para que os dois lados comecem com as mesmas oportunidades. As duas cidades ficam em pontas opostas.
- **Vizinhança da cidade.** **Proposta:** o anel de hexágonos colado na cidade não tem monstros nem saqueadores, para que o primeiro turno sempre tenha algo para comprar.
- **Em aberto:** névoa de guerra. O guia assume **sem névoa** no MVP (todo o tabuleiro visível), o que também simplifica o online.
- **Em aberto:** mapas feitos à mão vs. gerados.

## 4. Recursos e Produção

- **Definido:** cada hexágono seu produz o recurso do terreno dele **a cada turno**.
- **Proposta:** a produção entra no **início do seu turno** (inclusive no primeiro). Cada hexágono rende 1 unidade; a cidade rende 1 de cada recurso.
- **Proposta:** os recursos são do reino (um estoque só), não do hexágono.
- **Em aberto:** custo de manutenção do exército (ex.: pasto por soldado por turno), limite de estoque, comércio entre recursos.

## 5. Conquistar Hexágono Livre

- **Definido:** um hexágono livre se conquista pagando uma quantidade de recursos.
- **Proposta:** só dá para conquistar hexágono **vizinho do seu reino** (encostado em pelo menos um hexágono seu).
- **Proposta:** o custo é o mesmo para qualquer terreno (§15). **Em aberto:** custo por terreno, ou custo que sobe com o tamanho do reino.
- **Proposta:** o hexágono conquistado assim começa **sem tropas**; para defendê-lo, é preciso mover soldados para ele.

## 6. Exército

### 6.1 Tropas por hexágono

- **Definido:** as tropas ficam **em hexágonos**. Cada hexágono seu tem um número de tropas, e você move e ataca **a partir de um hexágono**.
- **Proposta:** tipos de tropa no exército: **Soldado** (recrutado), **Monstro** e **Mercenário** (absorvidos, §8). No MVP **todos valem 1** na batalha. **Em aberto:** se monstros e mercenários devem valer mais (ou ter outra vantagem) do que soldados.

### 6.2 Recrutar e torres de vigia

- **Definido:** a cidade recruta soldados pagando recursos.
- **Definido:** o jogador pode construir **torres de vigia**, que viram **novos pontos de recrutamento**. Com elas o exército nasce perto da frente, sem precisar atravessar o reino a partir da cidade.
- **Definido:** a torre se constrói em qualquer hexágono seu que não seja a cidade, **uma por hexágono**. O hexágono continua produzindo o recurso dele.
- **Definido:** quem tomar o hexágono de uma torre **fica com a torre**; ela passa a recrutar para o novo dono.
- **Proposta:** a torre custa 2 madeira + 2 pedra (§15) e não dá vantagem de defesa. **Em aberto:** limite de torres, custo crescente, torre que se destrói, outras funções (ver mais longe com névoa de guerra, defesa +1).
- **Proposta:** recrutar é escolher um ponto de recrutamento seu (cidade ou torre) e quantos soldados; eles aparecem nesse hexágono, sem limite além dos recursos. Custo na §15.
- **Proposta:** monstros e mercenários **não** se recrutam; só vêm de batalhas (§8).

### 6.3 Uma ação por turno

- **Definido:** cada jogador faz **uma ação por vez**: no seu turno escolhe **uma** ação e, feita ela, a vez passa para o adversário.
- **Proposta:** as ações são **comprar** um hexágono livre (§5), **recrutar** num ponto de recrutamento (§6.2), **construir** uma torre de vigia (§6.2), **mover** parte das tropas de um hexágono seu para um vizinho seu, ou **atacar** um hexágono vizinho com parte das tropas de um hexágono seu (§7). Também dá para **passar a vez** sem fazer nada.
- **Proposta:** a produção (§4) continua entrando no início de cada turno, então os recursos tendem a sobrar: a escolha do turno é *o que* fazer, não *se dá para pagar*.
- **Em aberto:** alcance maior que 1 hexágono, unidades com movimento próprio, ações extras (ex.: 2 ações por turno, ou uma ação de tropa mais uma de economia) se a partida ficar lenta.

## 7. Batalha

- **Definido:** batalha é **número de soldados do atacante contra número de soldados do defensor**, e o resultado é **determinístico** (sem sorte).
- **Definido:** quem tem mais vence; o vencedor perde tantos soldados quanto o perdedor tinha.
- **Proposta (detalhes):**
  - Você escolhe quantas tropas do hexágono de origem vão no ataque (`A`). O defensor usa todas as tropas do hexágono atacado (`D`).
  - **`A > D`:** o atacante vence. O defensor perde as `D` tropas; o atacante perde `D`. As `A − D` que sobram **ocupam** o hexágono conquistado.
  - **`A ≤ D`:** o ataque falha. As `A` tropas enviadas morrem e o defensor perde `A` tropas. **Empate** (`A = D`): os dois lados zeram e o hexágono continua do defensor, vazio.
  - Atacar um hexágono inimigo **vazio** (`D = 0`) é vitória automática.
  - As baixas saem nesta ordem: soldados, depois mercenários, depois monstros.
- **Exemplos:** 7 contra 4 → vitória, 3 ocupam. 4 contra 4 → empate, os dois zeram. 3 contra 5 → derrota, o defensor fica com 2.
- **Em aberto:** vantagem de defesa (ex.: cidade ou terreno valendo +1), ataque combinado de vários hexágonos.

## 8. Monstros e Saqueadores

- **Definido:** ao conquistar um hexágono de **monstros**, eles passam a fazer parte do seu exército.
- **Definido:** ao conquistar um hexágono de **saqueadores/mercenários**, eles também passam a fazer parte do seu exército.
- **Proposta:** os neutros vencidos se juntam às tropas que ocuparam o hexágono: monstros viram **Monstros** no seu exército e saqueadores viram **Mercenários**. No MVP **todos** se juntam (100%, valor ajustável na §15). Com isso, vencer neutros troca soldados por monstros/mercenários e ainda ganha o hexágono.
- **Proposta:** neutros não se movem nem atacam no MVP; são guarnições paradas.
- **Em aberto:** se "saqueadores" e "mercenários" são o mesmo grupo ou dois grupos diferentes; tipos de monstro; neutros que aparecem durante a partida.

## 9. Vitória e Derrota

- **Definido:** vence quem conquistar a cidade do adversário.
- **Proposta:** a cidade tomada passa para o vencedor e a partida acaba na hora.
- **Proposta:** o MVP é **1 contra 1**. **Em aberto:** partidas com 3+ reinos (o que acontece com o território de quem cai, quem vence).
- **Em aberto:** limite de turnos, desistência, vitória por pontos.

## 10. Modos de Jogo

- **Contra IA.** **Definido.** Proposta: um rival que segue regras simples e escolhe uma ação por turno (ataca a cidade se puder vencer, ataca o que consegue vencer, constrói torre de vigia perto da frente, compra hexágonos ou recruta, e empurra tropas para a frente). Níveis de dificuldade **Em aberto**.
- **Dois jogadores no mesmo aparelho (hot-seat).** **Definido.** Proposta: entre os turnos aparece uma tela "Vez de Fulano" para passar o aparelho.
- **Online.** **Definido.** Proposta: um jogador cria uma sala e recebe um código de 6 letras; o outro entra com o código. Cada turno (uma ação, §6.3) é enviado para o servidor como uma lista de ações; o outro aparelho repete essas ações nas mesmas regras e chega ao mesmo estado (§13). **Em aberto:** matchmaking aleatório, limite de tempo por turno, o que acontece quando alguém abandona, notificação de "sua vez".
- **Em aberto:** quem começa (hoje é sempre o jogador 1) e se o segundo jogador recebe alguma compensação.

## 11. Estilo Visual

- **Definido:** 2D topdown.
- **Em aberto:** direção de arte (pixel art, vetor, tabuleiro "de mesa"...), paleta, ícones de terreno, monstros e saqueadores.
- O guia usa **arte provisória feita em código**: hexágonos coloridos por terreno, borda na cor do dono e um texto com nome do terreno e número de tropas.
- **Proposta:** cada hexágono livre mostra o custo de compra em ícones de recurso (ex.: 🪵2 🪨1), em destaque onde o jogador da vez pode comprar agora.

## 12. HUD / UI

**Proposta:**

- Topo: turno atual e de quem é a vez (na cor do jogador).
- Recursos do jogador que está olhando (no hot-seat, o da vez), tamanho do território e total de tropas.
- Painel de ação que abre ao tocar num hexágono: conquistar (mostra o custo), recrutar na cidade ou na torre (com quantidade), construir torre de vigia (num hexágono seu sem torre), mover e atacar (com quantidade e a **previsão do resultado** da batalha, que dá para calcular porque ela é determinística).
- Botão **Passar a vez**, para passar sem agir (qualquer outra ação já passa a vez sozinha).
- Linha de registro com a última ação do adversário (como cada turno é uma ação só, ela conta o que ele acabou de fazer).
- Torre de vigia: ícone no canto do hexágono, que troca de cor junto com o dono.
- Tela de fim de partida.

## 13. Backend / Serviços

- **Definido:** o online usa **Firebase**, como os outros jogos do estúdio: login anônimo (Auth) e Firestore.
- **Proposta (estrutura):**

```text
/jogos/reinos-hex/partidas/{codigo}            → { seed, players: [uid1, uid2], names: [nome1, nome2],
                                                   status: "esperando" | "jogando", createdAt }
/jogos/reinos-hex/partidas/{codigo}/turnos/{n} → { ply: n, player, actions: "<lista de ações em JSON>" }
```

- **Proposta:** o servidor não roda regras. Os dois aparelhos geram o mesmo mapa a partir da `seed` e aplicam a mesma lista de ações, então chegam ao mesmo estado. As regras de segurança do Firestore só garantem que cada turno é escrito uma vez, pelo jogador certo.
- **Em aberto:** validação no servidor (Cloud Functions) contra trapaça, limpeza de salas antigas, ranking/leaderboard, save de partidas offline (contra IA/hot-seat) para continuar depois.

## 14. Escopo do MVP

**Definido:**

- Um tabuleiro hexagonal com cidade inicial, terrenos de recurso, monstros e saqueadores.
- Conquista de hexágono livre pagando recursos; batalha determinística; neutros que entram no exército.
- Uma ação por turno; tropas por hexágono, recrutamento na cidade e em torres de vigia; vitória ao tomar a cidade inimiga.
- Os três modos: contra IA, hot-seat e online.
- PC e mobile.

**Proposta (fica para depois do MVP):** névoa de guerra, mais tipos de unidade e de recurso, outras construções além da torre, vários mapas, 3+ jogadores, ranking, arte final, som.

## 15. Placeholders de Balanceamento

Todos os valores abaixo são **proposta** e ficam no asset `GameConfig` (Fase 2), para ajustar sem mexer em código.

| Parâmetro | Valor |
|---|---|
| Raio do mapa | 5 (91 hexágonos) |
| Distância entre as cidades | 8 hexágonos |
| Anel seguro em volta da cidade | 1 |
| Chance de monstros num hexágono | 15%, com 2 a 5 monstros |
| Chance de saqueadores num hexágono | 10%, com 3 a 6 saqueadores |
| Tropas iniciais na cidade | 5 soldados |
| Recursos iniciais | 2 de cada |
| Produção por hexágono | 1 do recurso dele por turno |
| Produção da cidade | 1 de cada por turno |
| Custo para conquistar hexágono livre | 2 madeira + 1 pedra |
| Custo de 1 soldado | 1 ouro + 1 pasto |
| Custo da torre de vigia | 2 madeira + 2 pedra |
| Neutros que se juntam ao exército | 100% |

## 16. Riscos / Em aberto (consolidado)

- Nome do jogo, pilar de design, referências.
- Direção de arte e áudio.
- Outros recursos além dos quatro citados; se "pasto" vira "comida".
- Formato do mapa, mapas fixos vs. gerados, névoa de guerra.
- Custo de hexágono livre (fixo, por terreno, crescente).
- Valor de monstros/mercenários na batalha; manutenção do exército.
- Uma ação por turno: se a partida fica lenta ou se sobra recurso demais; limite e custo das torres de vigia.
- Vantagem de defesa e ataque combinado.
- Saqueadores e mercenários: mesmo grupo ou dois.
- Neutros parados ou ativos.
- 3+ jogadores; limite de turnos; desistência.
- Vantagem de quem começa.
- Online: matchmaking, tempo por turno, abandono, notificações, validação no servidor.
- **Risco:** batalha determinística com tabuleiro todo visível pode deixar a partida "calculável" demais ou favorecer muito quem sai na frente (bola de neve). Medir no playtest antes de mexer.
- **Risco:** com 100% dos neutros entrando no exército, limpar neutros pode ser sempre a melhor jogada. Medir no playtest.

## Histórico de versões

- **0.2.0** (2026-11-23): **uma ação por turno** (comprar, recrutar, construir torre, mover ou atacar; depois a vez passa) no lugar de uma ordem por hexágono; **torres de vigia** (2 madeira + 2 pedra), novos pontos de recrutamento que passam para quem tomar o hexágono. GDD, guia Unity e protótipo.
- **0.1.2** (2026-11-23): cada hexágono livre mostra o ícone do custo de compra (🪵2 🪨1), forte onde dá para comprar agora e apagado no resto.
- **0.1.1** (2026-11-23): protótipo web em `prototipos/reinos-hex/` (contra IA e dois jogadores no mesmo aparelho; o online fica só no guia Unity).
- **0.1.0** (2026-11-23): primeira versão do GDD e do guia Unity (tabuleiro hexagonal, conquista paga e por batalha determinística, neutros que entram no exército, IA, hot-seat e online com Firebase).

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para construir o MVP em Unity 6. Cada fase termina com um checkpoint que dá para testar no Play Mode. Os números vêm do `GameConfig` (§15) e são placeholders.

## Convenções

- **Namespaces:** `ReinosHex.Core` (regras puras), `ReinosHex.View` (desenho e input do tabuleiro), `ReinosHex.Match` (partida e turnos), `ReinosHex.UI` (HUD e painéis), `ReinosHex.AI`, `ReinosHex.Online`.
- **Nomes:** as palavras das regras ficam em português, iguais às do GDD (`Conquistar`, `Recrutar`, `Floresta`, `Monstro`...); a infraestrutura fica em inglês (`MapView`, `MatchController`).
- **Comentários:** todo script explica o **POR QUE** e a **ESTRATÉGIA** em comentários dentro do código.
- **Unity:** Unity 6 (6000.x). Nenhuma fase usa física, então não há `Rigidbody2D` nem a nota de `rb.velocity`.

## Arquitetura em uma página

```text
            ┌──────────────── ReinosHex.Core (C# puro, sem MonoBehaviour) ────────────────┐
            │ HexCoord · ResourceBag · Army · HexCell · GameState · GameConfig            │
            │ MapGenerator (semente → mapa)  ·  GameAction  ·  Rules (Validate / Apply)   │
            └──────────────▲───────────────────────▲───────────────────────▲─────────────┘
                           │ lê                    │ pede ação             │ repete ações
  ReinosHex.View           │        ReinosHex.AI   │        ReinosHex.Online│
  MapView/HexTileView ─────┤        AiPlayer ──────┤        OnlineSync ─────┤
  BoardInput (toque/mouse) │                       │                        │
                           │                       │                        │
                     ReinosHex.Match.MatchController  ← todas as ações passam por aqui
                           │
                     ReinosHex.UI: HumanInput, ActionPanel, Hud, PassDevicePanel
```

A regra de ouro: **o estado do jogo só muda por `Rules.Apply(estado, ação)`**. Humano, IA e o adversário online produzem o mesmo tipo de objeto (`GameAction`). Isso dá três coisas de graça: a IA não consegue trapacear (usa a mesma validação), o online só precisa mandar a lista de ações, e qualquer partida pode ser reconstruída do zero a partir da semente + ações.

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, com pastas, pacotes e as duas cenas criadas.

### 0.1 Criar o projeto

1. Instale o **Unity Hub** e um editor **Unity 6 (6000.x)** com os módulos **Android Build Support** (e **iOS Build Support** se for publicar em iPhone) e **Windows Build Support (IL2CPP)**.
2. Unity Hub → **New project** → template **Universal 2D** (o "2D (URP)"). O jogo é 2D topdown e não usa física: o template 2D basta.
3. Nome do projeto: `ReinosHex`.

### 0.2 Estrutura de pastas

Em `Assets/`, crie:

```text
Assets/_Project/
  Config/        ← o asset GameConfig
  Materials/
  Scenes/        ← Menu.unity e Game.unity
  Scripts/
    Core/  View/  Match/  UI/  AI/  Online/  Tests/
```

### 0.3 Pacotes (Window → Package Manager)

- **Input System**: já vem no template do Unity 6. Confirme em **Edit → Project Settings → Player → Active Input Handling** que está em **Input System Package (New)** ou **Both**.
- **TextMeshPro**: no Unity 6 vem dentro do pacote **uGUI**. Na primeira vez que criar um texto, o editor pede **Import TMP Essentials**: aceite.
- **Não** instale o 2D Tilemap para o tabuleiro. O Unity tem tilemap hexagonal, mas as regras precisam de coordenadas próprias em C# puro (para a IA e o online rodarem sem cena), e desenhar ~91 hexágonos em código é simples (Fase 4).
- O **Firebase SDK** entra só na Fase 8.

### 0.4 Cenas

1. Renomeie a cena padrão para `Game` e mova para `Assets/_Project/Scenes/`.
2. Crie uma cena vazia `Menu` na mesma pasta (fica vazia até a Fase 7).
3. **File → Build Profiles → Scene List:** adicione `Menu` (índice 0) e `Game` (índice 1).

### ✅ Checkpoint da Fase 0

- O projeto abre sem erros no Console.
- As pastas de `Assets/_Project/` existem e as duas cenas estão na Scene List.
- Active Input Handling inclui o Input System novo.

#### Problemas comuns

- **Aviso pedindo para reiniciar o editor ao mudar Active Input Handling:** é normal; reinicie.

Próxima fase: **Coordenadas Hexagonais** — a matemática da grade de hexágonos.

---

# Parte 4 — Implementação Unity: Fase 1 (Coordenadas Hexagonais)

## Fase 1 — Coordenadas Hexagonais

> Objetivo desta fase: saber endereçar um hexágono, achar os vizinhos, medir distância e converter entre hexágono e posição na tela.

### 1.1 `HexCoord`

```csharp
// Caminho: Assets/_Project/Scripts/Core/HexCoord.cs
using System;
using System.Collections.Generic;

namespace ReinosHex.Core
{
    // POR QUE: todas as regras (vizinho, alcance, distância até a cidade inimiga)
    // dependem de saber "onde" está um hexágono. Uma grade de hexágonos não é uma
    // matriz comum: cada célula tem 6 vizinhos, não 4 nem 8.
    // ESTRATÉGIA: coordenadas AXIAIS (q, r). Pense em dois eixos inclinados a 60°.
    // Existe um terceiro eixo implícito, s = -q - r, que deixa as fórmulas simples
    // (distância é a metade da soma das diferenças nos 3 eixos). É uma struct
    // pequena e comparável, usada como chave de dicionário e serializável em JSON
    // (por isso os campos são públicos e marcados [Serializable]).
    [Serializable]
    public struct HexCoord : IEquatable<HexCoord>
    {
        public int q;
        public int r;

        public HexCoord(int q, int r) { this.q = q; this.r = r; }

        // Terceiro eixo implícito do sistema "cúbico".
        public int S => -q - r;

        // Os 6 passos para chegar a cada vizinho, em ordem anti-horária.
        static readonly HexCoord[] Directions =
        {
            new HexCoord(1, 0), new HexCoord(1, -1), new HexCoord(0, -1),
            new HexCoord(-1, 0), new HexCoord(-1, 1), new HexCoord(0, 1),
        };

        // Vizinho numa das 6 direções (0 a 5).
        public HexCoord Neighbor(int direction) => this + Directions[direction];

        // Os 6 vizinhos, um por vez (foreach).
        public IEnumerable<HexCoord> Neighbors()
        {
            for (int i = 0; i < 6; i++) yield return Neighbor(i);
        }

        // Quantos passos de hexágono em hexágono até "other".
        public int DistanceTo(HexCoord other)
        {
            int dq = Math.Abs(q - other.q);
            int dr = Math.Abs(r - other.r);
            int ds = Math.Abs(S - other.S);
            return (dq + dr + ds) / 2;
        }

        // Atalho usado em quase toda regra: "é colado em mim?".
        public bool IsNeighbor(HexCoord other) => DistanceTo(other) == 1;

        public static HexCoord operator +(HexCoord a, HexCoord b) => new HexCoord(a.q + b.q, a.r + b.r);
        // O "espelho" pelo centro do mapa: usado para gerar mapas justos (Fase 2).
        public static HexCoord operator -(HexCoord a) => new HexCoord(-a.q, -a.r);
        public static bool operator ==(HexCoord a, HexCoord b) => a.q == b.q && a.r == b.r;
        public static bool operator !=(HexCoord a, HexCoord b) => !(a == b);

        public bool Equals(HexCoord other) => this == other;
        public override bool Equals(object obj) => obj is HexCoord h && this == h;
        // Combina q e r num número para o Dictionary achar a chave rápido.
        public override int GetHashCode() => (q * 397) ^ r;
        public override string ToString() => $"({q},{r})";
    }
}
```

### 1.2 `HexLayout`: da grade para a tela

```csharp
// Caminho: Assets/_Project/Scripts/View/HexLayout.cs
using ReinosHex.Core;
using UnityEngine;

namespace ReinosHex.View
{
    // POR QUE: as regras falam em (q, r); a tela fala em (x, y). Esta classe é a
    // única ponte entre os dois: onde desenhar um hexágono e qual hexágono foi tocado.
    // ESTRATÉGIA: hexágonos "de ponta para cima" (pointy-top). As fórmulas são as
    // clássicas da grade axial. Para converter um ponto da tela de volta, a conta dá
    // números quebrados (q = 1.3, r = -0.6); "Round" arredonda no sistema cúbico,
    // que é o jeito correto de achar o hexágono mais próximo.
    // Fica em View (e não em Core) porque usa Vector3/Mathf do Unity.
    public static class HexLayout
    {
        // Raio do hexágono em unidades do mundo (centro até a ponta).
        public const float Size = 0.5f;
        static readonly float Sqrt3 = Mathf.Sqrt(3f);

        // Centro do hexágono no mundo.
        public static Vector3 ToWorld(HexCoord h) =>
            new Vector3(Size * Sqrt3 * (h.q + h.r * 0.5f), Size * 1.5f * h.r, 0f);

        // Hexágono que contém um ponto do mundo.
        public static HexCoord FromWorld(Vector2 p)
        {
            float q = (Sqrt3 / 3f * p.x - p.y / 3f) / Size;
            float r = (2f / 3f * p.y) / Size;
            return Round(q, r);
        }

        // Canto i (0 a 5) de um hexágono de raio "radius", relativo ao centro.
        // 60°·i + 30° coloca uma ponta exatamente em cima (90°).
        public static Vector3 Corner(int i, float radius)
        {
            float angle = Mathf.Deg2Rad * (60f * i + 30f);
            return new Vector3(radius * Mathf.Cos(angle), radius * Mathf.Sin(angle), 0f);
        }

        // Arredonda (q, r, s) quebrados para o hexágono inteiro mais próximo.
        // ESTRATÉGIA: arredonda os 3 eixos; o que mais "errou" no arredondamento é
        // recalculado a partir dos outros dois, para manter q + r + s = 0.
        static HexCoord Round(float fq, float fr)
        {
            float fs = -fq - fr;
            int q = Mathf.RoundToInt(fq), r = Mathf.RoundToInt(fr), s = Mathf.RoundToInt(fs);
            float dq = Mathf.Abs(q - fq), dr = Mathf.Abs(r - fr), ds = Mathf.Abs(s - fs);
            if (dq > dr && dq > ds) q = -r - s;
            else if (dr > ds) r = -q - s;
            return new HexCoord(q, r);
        }
    }
}
```

### 1.3 Teste rápido no Console

```csharp
// Caminho: Assets/_Project/Scripts/Tests/HexSelfTest.cs
using ReinosHex.Core;
using ReinosHex.View;
using UnityEngine;

namespace ReinosHex.Tests
{
    // POR QUE: erro de conta em coordenada hexagonal aparece só lá na frente, como
    // "cliquei num hexágono e selecionou o do lado". Testar agora é barato.
    // ESTRATÉGIA: um MonoBehaviour descartável que roda no Start e escreve no Console.
    // Apague-o (ou desative) depois do checkpoint.
    public class HexSelfTest : MonoBehaviour
    {
        void Start()
        {
            var a = new HexCoord(0, 0);
            var b = new HexCoord(2, -1);
            Check(a.DistanceTo(b) == 2, "distância (0,0)→(2,-1) = 2");

            int vizinhos = 0;
            foreach (var n in a.Neighbors()) if (a.IsNeighbor(n)) vizinhos++;
            Check(vizinhos == 6, "6 vizinhos a distância 1");

            // Ida e volta: hexágono → mundo → hexágono tem que dar o mesmo.
            for (int q = -4; q <= 4; q++)
                for (int r = -4; r <= 4; r++)
                {
                    var h = new HexCoord(q, r);
                    Check(HexLayout.FromWorld(HexLayout.ToWorld(h)) == h, $"ida e volta {h}");
                }

            // Um ponto um pouco fora do centro ainda cai no mesmo hexágono.
            var perto = HexLayout.ToWorld(b) + new Vector3(0.2f, -0.15f, 0f);
            Check(HexLayout.FromWorld(perto) == b, "ponto perto do centro");
            Debug.Log("HexSelfTest terminou.");
        }

        // Escreve só as falhas, para o Console ficar limpo quando tudo passa.
        static void Check(bool ok, string what)
        {
            if (!ok) Debug.LogError("FALHOU: " + what);
        }
    }
}
```

1. Na cena `Game`, crie um GameObject vazio `Teste` e adicione `HexSelfTest`.
2. Dê Play.

### ✅ Checkpoint da Fase 1

- O Console mostra só `HexSelfTest terminou.` e nenhum `FALHOU`.

#### Problemas comuns

- **`FALHOU: ida e volta` em vários hexágonos:** o sinal de `r` em `FromWorld` precisa bater com o de `ToWorld` (os dois usam `y = 1,5 · Size · r`). Se você inverter o eixo y em um, inverta no outro.

Próxima fase: **Dados e Geração do Mapa** — recursos, exércitos, o estado da partida e o mapa gerado por semente.

---

# Parte 5 — Implementação Unity: Fase 2 (Dados e Geração do Mapa)

## Fase 2 — Dados e Geração do Mapa

> Objetivo desta fase: o estado completo de uma partida em C# puro e um gerador que, com a mesma semente, sempre cria o mesmo mapa espelhado.

### 2.1 Recursos: `ResourceBag`

```csharp
// Caminho: Assets/_Project/Scripts/Core/ResourceBag.cs
using System;

namespace ReinosHex.Core
{
    // POR QUE: recursos aparecem em todo lugar: estoque do jogador, custo de
    // conquistar, custo de soldado, produção da cidade. Um tipo só evita repetir
    // "madeira, pedra, ouro, pasto" em cada conta.
    // ESTRATÉGIA: uma classe [Serializable] com um campo por recurso. Campos
    // simples aparecem no Inspector (para editar custos no GameConfig) e viram JSON
    // sem esforço. Se o GDD ganhar recursos novos, entram aqui.
    [Serializable]
    public class ResourceBag
    {
        public int madeira, pedra, ouro, pasto;

        public ResourceBag() { }
        public ResourceBag(int madeira, int pedra, int ouro, int pasto)
        {
            this.madeira = madeira; this.pedra = pedra; this.ouro = ouro; this.pasto = pasto;
        }

        // Cópia independente (para não alterar o custo do GameConfig sem querer).
        public ResourceBag Clone() => new ResourceBag(madeira, pedra, ouro, pasto);

        // Tem o suficiente para pagar "cost"?
        public bool CanPay(ResourceBag cost) =>
            madeira >= cost.madeira && pedra >= cost.pedra && ouro >= cost.ouro && pasto >= cost.pasto;

        // Desconta o custo (quem chama confere CanPay antes).
        public void Pay(ResourceBag cost)
        {
            madeira -= cost.madeira; pedra -= cost.pedra; ouro -= cost.ouro; pasto -= cost.pasto;
        }

        // Soma uma produção ao estoque.
        public void Add(ResourceBag other)
        {
            madeira += other.madeira; pedra += other.pedra; ouro += other.ouro; pasto += other.pasto;
        }

        // Custo de "n" unidades de algo (ex.: 4 soldados).
        public ResourceBag Times(int n) => new ResourceBag(madeira * n, pedra * n, ouro * n, pasto * n);

        // Texto curto para HUD e painéis.
        public override string ToString() =>
            $"Madeira {madeira} · Pedra {pedra} · Ouro {ouro} · Pasto {pasto}";
    }
}
```

### 2.2 Exército: `Army`

```csharp
// Caminho: Assets/_Project/Scripts/Core/Army.cs
using System;

namespace ReinosHex.Core
{
    // POR QUE: um hexágono pode ter soldados recrutados, monstros e mercenários
    // absorvidos (GDD §6.1 e §8). No MVP todos valem 1, mas guardar os tipos
    // separados deixa o GDD mudar isso depois sem trocar a estrutura.
    // ESTRATÉGIA: três contadores. "Take" tira N unidades numa ordem fixa
    // (soldados → mercenários → monstros, GDD §7) e devolve o que tirou: serve
    // tanto para "separar um destacamento para mover/atacar" quanto para "aplicar
    // baixas". A ordem fixa é importante para o online: os dois aparelhos precisam
    // tirar exatamente as mesmas unidades.
    [Serializable]
    public class Army
    {
        public int soldados, monstros, mercenarios;

        // Poder na batalha = número de tropas (GDD §7).
        public int Total => soldados + monstros + mercenarios;

        public Army Clone() => new Army { soldados = soldados, monstros = monstros, mercenarios = mercenarios };

        // Junta outro grupo a este.
        public void Add(Army other)
        {
            soldados += other.soldados; monstros += other.monstros; mercenarios += other.mercenarios;
        }

        // Tira até "n" unidades e devolve um Army só com elas.
        public Army Take(int n)
        {
            var taken = new Army();
            int k = Math.Min(n, soldados); soldados -= k; taken.soldados = k; n -= k;
            k = Math.Min(n, mercenarios); mercenarios -= k; taken.mercenarios = k; n -= k;
            k = Math.Min(n, monstros); monstros -= k; taken.monstros = k;
            return taken;
        }
    }
}
```

### 2.3 Terreno e hexágono: `Terrain`, `HexCell`, `PlayerState`

```csharp
// Caminho: Assets/_Project/Scripts/Core/Terrain.cs
namespace ReinosHex.Core
{
    // POR QUE: o terreno decide o que o hexágono produz (GDD §3).
    // ESTRATÉGIA: um enum para as regras e uma classe estática com os textos,
    // para a UI não espalhar nomes pelo código.
    public enum Terrain { Floresta, Pedreira, Mina, Pasto, Cidade }

    public static class TerrainInfo
    {
        // Nome do terreno para mostrar na tela.
        public static string Name(Terrain t) => t switch
        {
            Terrain.Floresta => "Floresta",
            Terrain.Pedreira => "Pedreira",
            Terrain.Mina => "Mina de ouro",
            Terrain.Pasto => "Pasto",
            Terrain.Cidade => "Cidade",
            _ => "?",
        };

        // O que ele produz, em texto ("produz madeira").
        public static string Produces(Terrain t) => t switch
        {
            Terrain.Floresta => "madeira",
            Terrain.Pedreira => "pedra",
            Terrain.Mina => "ouro",
            Terrain.Pasto => "pasto",
            Terrain.Cidade => "um pouco de cada recurso",
            _ => "nada",
        };
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Core/HexCell.cs
using System;

namespace ReinosHex.Core
{
    // POR QUE: o tabuleiro é uma coleção destes. Tudo que as regras precisam saber
    // de um hexágono mora aqui.
    // ESTRATÉGIA: dados puros, sem lógica. "owner = -1" significa sem dono; se não
    // tem dono mas tem tropas, são neutros (monstros ou saqueadores, GDD §8).
    // "tower" marca uma torre de vigia: um ponto de recrutamento a mais (GDD §6.2).
    // Ela pertence a quem é dono do hexágono, então trocar o owner já entrega a torre.
    [Serializable]
    public class HexCell
    {
        public HexCoord coord;
        public Terrain terrain;
        public int owner = -1;
        public Army army = new Army();
        public bool tower;

        public bool IsNeutralOccupied => owner < 0 && army.Total > 0;
        public bool IsFree => owner < 0 && army.Total == 0;

        // Cópia completa, usada para espelhar o mapa na geração.
        public HexCell CloneAt(HexCoord at) => new HexCell
        {
            coord = at, terrain = terrain, owner = owner, army = army.Clone(), tower = tower,
        };
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Core/PlayerState.cs
using System;

namespace ReinosHex.Core
{
    // POR QUE: o que é de cada reino e não de um hexágono: nome, estoque, cidade.
    // ESTRATÉGIA: dados puros; "alive" vira false quando a cidade cai (GDD §9).
    [Serializable]
    public class PlayerState
    {
        public string name;
        public ResourceBag resources = new ResourceBag();
        public HexCoord city;
        public bool alive = true;
    }
}
```

### 2.4 Configuração: `GameConfig`

```csharp
// Caminho: Assets/_Project/Scripts/Core/GameConfig.cs
using UnityEngine;

namespace ReinosHex.Core
{
    // POR QUE: todos os números do GDD §15 são placeholders. Num ScriptableObject
    // (um "asset de dados" que vive no projeto, não na cena) dá para ajustá-los no
    // Inspector sem recompilar.
    // ESTRATÉGIA: só campos com valores padrão iguais à tabela §15. As regras leem
    // daqui pelo GameState.config. Atenção no online: os dois aparelhos PRECISAM ter
    // o mesmo GameConfig, senão as mesmas ações dão resultados diferentes.
    [CreateAssetMenu(menuName = "Reinos Hex/Game Config", fileName = "GameConfig")]
    public class GameConfig : ScriptableObject
    {
        [Header("Mapa")]
        [Min(3)] public int mapRadius = 5;
        [Tooltip("Anel em volta da cidade sem monstros nem saqueadores.")]
        [Min(0)] public int safeRadius = 1;
        [Range(0f, 1f)] public float monsterChance = 0.15f;
        public int monsterMin = 2, monsterMax = 5;
        [Range(0f, 1f)] public float raiderChance = 0.10f;
        public int raiderMin = 3, raiderMax = 6;

        [Header("Início")]
        public int startSoldiers = 5;
        public ResourceBag startResources = new ResourceBag(2, 2, 2, 2);

        [Header("Produção por turno")]
        public int yieldPerHex = 1;
        public ResourceBag cityYield = new ResourceBag(1, 1, 1, 1);

        [Header("Custos")]
        public ResourceBag claimCost = new ResourceBag(2, 1, 0, 0);
        public ResourceBag soldierCost = new ResourceBag(0, 0, 1, 1);
        [Tooltip("Torre de vigia: novo ponto de recrutamento (GDD §6.2).")]
        public ResourceBag towerCost = new ResourceBag(2, 2, 0, 0);

        [Header("Batalha")]
        [Tooltip("Quantos % dos neutros vencidos entram no exército.")]
        [Range(0, 100)] public int neutralJoinPercent = 100;
    }
}
```

### 2.5 O estado da partida: `GameState`

```csharp
// Caminho: Assets/_Project/Scripts/Core/GameState.cs
using System.Collections.Generic;

namespace ReinosHex.Core
{
    // POR QUE: um objeto só com TUDO que define a partida. Se dois aparelhos têm
    // GameStates iguais, estão vendo o mesmo jogo.
    // ESTRATÉGIA: lista de hexágonos + um dicionário (coord → hexágono) para achar
    // rápido. "ply" conta quantos turnos já terminaram no total (de todos os
    // jogadores): é o número usado para ordenar os turnos no online.
    public class GameState
    {
        public GameConfig config;
        public int seed;
        public readonly List<HexCell> cells = new List<HexCell>();
        public PlayerState[] players;
        public int current;      // de quem é a vez (índice em players)
        public int turn = 1;     // rodada: sobe quando a vez volta para o jogador 0
        public int ply;          // turnos individuais encerrados
        public int winner = -1;  // -1 enquanto ninguém venceu

        readonly Dictionary<HexCoord, HexCell> index = new Dictionary<HexCoord, HexCell>();

        public bool IsOver => winner >= 0;

        // Adiciona um hexágono ao tabuleiro (só na geração).
        public void AddCell(HexCell cell)
        {
            cells.Add(cell);
            index[cell.coord] = cell;
        }

        // Hexágono numa coordenada, ou null se estiver fora do mapa.
        public HexCell Get(HexCoord c) => index.TryGetValue(c, out var cell) ? cell : null;

        // Hexágonos de um jogador.
        public IEnumerable<HexCell> Owned(int player)
        {
            foreach (var c in cells) if (c.owner == player) yield return c;
        }
    }
}
```

### 2.6 Sorteio determinístico: `Rng`

```csharp
// Caminho: Assets/_Project/Scripts/Core/Rng.cs
namespace ReinosHex.Core
{
    // POR QUE: no online cada aparelho gera o mapa sozinho a partir da semente. Se
    // o sorteador der números diferentes em PC e Android, os mapas saem diferentes.
    // ESTRATÉGIA: um xorshift de 32 bits escrito aqui. É poucas linhas, rápido e dá
    // exatamente a mesma sequência em qualquer plataforma (System.Random e
    // UnityEngine.Random não garantem isso entre versões).
    public class Rng
    {
        uint state;

        public Rng(int seed)
        {
            state = (uint)seed;
            if (state == 0) state = 0x9E3779B9; // xorshift não pode começar em 0
        }

        // Próximo número de 32 bits.
        public uint Next()
        {
            state ^= state << 13;
            state ^= state >> 17;
            state ^= state << 5;
            return state;
        }

        // Inteiro em [min, maxInclusive].
        public int Range(int min, int maxInclusive) =>
            min + (int)(Next() % (uint)(maxInclusive - min + 1));

        // Número em [0, 1).
        public float Value() => (Next() & 0xFFFFFF) / 16777216f;
    }
}
```

### 2.7 Gerar o mapa: `MapGenerator`

```csharp
// Caminho: Assets/_Project/Scripts/Core/MapGenerator.cs
using System;

namespace ReinosHex.Core
{
    // POR QUE: cria uma partida nova: tabuleiro, cidades, tropas e estoques iniciais.
    // ESTRATÉGIA: mapa em forma de hexágono de raio R. Para ser justo, só METADE é
    // sorteada; a outra metade é a cópia espelhada pelo centro (o hexágono (q,r)
    // vira (-q,-r)). As cidades ficam em (0,-(R-1)) e (0,R-1), que também são
    // espelho uma da outra, então os dois lados recebem os mesmos terrenos e os
    // mesmos neutros nas mesmas distâncias. A ordem dos sorteios é fixa: mesma
    // semente + mesmo GameConfig = mesmo mapa (base do online, GDD §13).
    public static class MapGenerator
    {
        public static GameState NewGame(GameConfig cfg, int seed, string[] names)
        {
            var rng = new Rng(seed);
            var s = new GameState { config = cfg, seed = seed };
            int R = cfg.mapRadius;
            var cities = new[] { new HexCoord(0, -(R - 1)), new HexCoord(0, R - 1) };

            // Percorre todos os hexágonos a distância <= R do centro.
            for (int q = -R; q <= R; q++)
            {
                int rMin = Math.Max(-R, -q - R), rMax = Math.Min(R, -q + R);
                for (int r = rMin; r <= rMax; r++)
                {
                    var c = new HexCoord(q, r);
                    if (!IsCanonical(c)) continue; // a outra metade vem do espelho
                    var cell = RandomCell(c, rng, cfg, cities);
                    s.AddCell(cell);
                    if (c != -c) s.AddCell(cell.CloneAt(-c));
                }
            }

            // Cidades, tropas e estoques iniciais.
            s.players = new PlayerState[cities.Length];
            for (int p = 0; p < cities.Length; p++)
            {
                var city = s.Get(cities[p]);
                city.terrain = Terrain.Cidade;
                city.owner = p;
                city.army = new Army { soldados = cfg.startSoldiers };
                s.players[p] = new PlayerState
                {
                    name = p < names.Length ? names[p] : $"Jogador {p + 1}",
                    resources = cfg.startResources.Clone(),
                    city = cities[p],
                };
            }

            Rules.StartTurn(s); // produção do primeiro turno do jogador 0
            return s;
        }

        // De cada par (c, -c), só um é "canônico" e passa pelo sorteio.
        static bool IsCanonical(HexCoord c) => c.q > 0 || (c.q == 0 && c.r >= 0);

        // Sorteia terreno e, longe das cidades, talvez monstros ou saqueadores.
        static HexCell RandomCell(HexCoord c, Rng rng, GameConfig cfg, HexCoord[] cities)
        {
            var cell = new HexCell { coord = c, terrain = (Terrain)rng.Range(0, 3) };
            float roll = rng.Value();
            int nearest = int.MaxValue;
            foreach (var city in cities) nearest = Math.Min(nearest, c.DistanceTo(city));
            if (nearest <= cfg.safeRadius) return cell; // anel seguro (GDD §3)

            if (roll < cfg.monsterChance)
                cell.army.monstros = rng.Range(cfg.monsterMin, cfg.monsterMax);
            else if (roll < cfg.monsterChance + cfg.raiderChance)
                cell.army.mercenarios = rng.Range(cfg.raiderMin, cfg.raiderMax);
            return cell;
        }
    }
}
```

> `MapGenerator` chama `Rules.StartTurn`, que só existe na Fase 3. Para compilar agora, crie já o arquivo `Rules.cs` com o esqueleto abaixo; a Fase 3 troca pelo completo.

```csharp
// Caminho: Assets/_Project/Scripts/Core/Rules.cs (esqueleto temporário, trocado na Fase 3)
namespace ReinosHex.Core
{
    public static class Rules
    {
        public static void StartTurn(GameState s) { }
    }
}
```

### 2.8 Criar o asset e testar

1. Na pasta `Assets/_Project/Config/`: botão direito → **Create → Reinos Hex → Game Config**. Deixe o nome `GameConfig`.
2. Acrescente este teste:

```csharp
// Caminho: Assets/_Project/Scripts/Tests/MapSelfTest.cs
using ReinosHex.Core;
using UnityEngine;

namespace ReinosHex.Tests
{
    // POR QUE: confirma as duas promessas do gerador: tamanho certo e mapa espelhado.
    // ESTRATÉGIA: gera duas vezes com a mesma semente e compara; depois confere
    // que cada hexágono tem o mesmo conteúdo do seu espelho.
    public class MapSelfTest : MonoBehaviour
    {
        [SerializeField] GameConfig config;

        void Start()
        {
            var names = new[] { "A", "B" };
            var a = MapGenerator.NewGame(config, 1234, names);
            var b = MapGenerator.NewGame(config, 1234, names);
            int R = config.mapRadius;
            Check(a.cells.Count == 3 * R * (R + 1) + 1, "número de hexágonos");

            int neutros = 0;
            foreach (var c in a.cells)
            {
                var same = b.Get(c.coord);
                Check(same.terrain == c.terrain && same.army.Total == c.army.Total, $"mesma semente {c.coord}");
                var mirror = a.Get(-c.coord);
                Check(mirror != null && mirror.terrain == c.terrain && mirror.army.Total == c.army.Total,
                      $"espelho de {c.coord}");
                if (c.IsNeutralOccupied) neutros++;
            }
            Debug.Log($"MapSelfTest terminou: {a.cells.Count} hexágonos, {neutros} com neutros.");
        }

        static void Check(bool ok, string what)
        {
            if (!ok) Debug.LogError("FALHOU: " + what);
        }
    }
}
```

3. No GameObject `Teste`, adicione `MapSelfTest` e arraste o `GameConfig` para o campo **Config**. Dê Play.

### ✅ Checkpoint da Fase 2

- O Console mostra `MapSelfTest terminou: 91 hexágonos, N com neutros.` (N par, por causa do espelho) e nenhum `FALHOU`.
- Mudar **Monster Chance** no `GameConfig` muda N no próximo Play.

#### Problemas comuns

- **`NullReferenceException` em `MapSelfTest`:** o campo **Config** ficou vazio no Inspector.
- **Hexágonos a mais ou a menos:** o laço de `r` precisa usar `Math.Max(-R, -q - R)` e `Math.Min(R, -q + R)`; sem isso o mapa vira um losango.

Próxima fase: **Ações, Batalha e Turnos** — as regras do jogo.

---

# Parte 6 — Implementação Unity: Fase 3 (Ações, Batalha e Turnos)

## Fase 3 — Ações, Batalha e Turnos

> Objetivo desta fase: todas as regras do GDD (§4 a §9) funcionando em C# puro e testadas no Console, sem nada na tela ainda.

### 3.1 A ação: `GameAction`

```csharp
// Caminho: Assets/_Project/Scripts/Core/GameAction.cs
using System;
using System.Collections.Generic;

namespace ReinosHex.Core
{
    // POR QUE: tudo que um jogador pode fazer vira um objeto destes. Humano, IA e
    // adversário online falam a mesma "língua". Como cada turno é UMA ação (GDD §6.3),
    // o turno que vai para o Firestore na Fase 8 é uma lista com uma ação só.
    // ESTRATÉGIA: uma classe só com um "type" e os campos que cada tipo usa
    // (de onde, para onde, quantos). Recrutar e ConstruirTorre usam "to" como o
    // hexágono onde acontecem. Campos públicos e [Serializable] para o JsonUtility
    // do Unity converter em texto. As fábricas estáticas (Claim, Recruit...) evitam
    // montar o objeto à mão e errar um campo. FimDoTurno agora é "passar a vez".
    // ConstruirTorre fica no FIM do enum: o JsonUtility grava o enum como número,
    // e mudar a posição dos outros quebraria turnos já gravados.
    public enum ActionType { Conquistar, Recrutar, Mover, Atacar, FimDoTurno, ConstruirTorre }

    [Serializable]
    public class GameAction
    {
        public ActionType type;
        public HexCoord from;
        public HexCoord to;
        public int count;

        public static GameAction Claim(HexCoord to) => new GameAction { type = ActionType.Conquistar, to = to };
        public static GameAction Recruit(HexCoord at, int count) =>
            new GameAction { type = ActionType.Recrutar, to = at, count = count };
        public static GameAction BuildTower(HexCoord at) => new GameAction { type = ActionType.ConstruirTorre, to = at };
        public static GameAction Move(HexCoord from, HexCoord to, int count) =>
            new GameAction { type = ActionType.Mover, from = from, to = to, count = count };
        public static GameAction Attack(HexCoord from, HexCoord to, int count) =>
            new GameAction { type = ActionType.Atacar, from = from, to = to, count = count };
        public static GameAction EndTurn() => new GameAction { type = ActionType.FimDoTurno };

        public override string ToString() => $"{type} {from}→{to} x{count}";
    }

    // POR QUE: o JsonUtility não converte uma List solta; precisa de uma classe em volta.
    [Serializable]
    public class ActionList
    {
        public List<GameAction> items = new List<GameAction>();
    }
}
```

### 3.2 O resultado de uma batalha: `BattleReport`

```csharp
// Caminho: Assets/_Project/Scripts/Core/BattleReport.cs
namespace ReinosHex.Core
{
    // POR QUE: a batalha é determinística (GDD §7), então o mesmo cálculo serve para
    // PREVER o resultado no painel antes de confirmar e para REGISTRAR o que
    // aconteceu depois.
    // ESTRATÉGIA: só números e os dois textos que a UI precisa.
    public class BattleReport
    {
        public int attacker, defender;          // defender = -1 para neutros
        public HexCoord from, to;
        public int attackers, defenders;
        public bool attackerWon;
        public int attackerLosses, defenderLosses;
        public int joinedMonsters, joinedMercenaries;
        public bool defenderWereMonsters;       // neutros: monstros (true) ou saqueadores
        public bool cityCaptured;

        public int Joined => joinedMonsters + joinedMercenaries;

        // Texto do painel antes de atacar.
        public string PreviewText()
        {
            if (!attackerWon)
                return $"{attackers} contra {defenders}: DERROTA.\n" +
                       $"As {attackers} tropas enviadas morrem e o defensor perde {defenderLosses}.";
            string text = $"{attackers} contra {defenders}: VITÓRIA.\n" +
                          $"Você perde {attackerLosses}; {attackers - attackerLosses} ocupam o hexágono.";
            if (Joined > 0) text += $"\n+{Joined} neutros entram no seu exército.";
            if (cityCaptured) text += "\nA cidade inimiga cai: fim de jogo!";
            return text;
        }

        // Linha de registro depois da batalha.
        public string LogText(string attackerName, string defenderName)
        {
            string result = attackerWon ? "venceu" : "perdeu";
            string extra = Joined > 0 ? $" (+{Joined} no exército)" : "";
            return $"{attackerName} atacou {defenderName} com {attackers} contra {defenders} e {result}{extra}.";
        }
    }
}
```

### 3.3 As regras: `Rules`

Troque o esqueleto da Fase 2 por este arquivo completo.

```csharp
// Caminho: Assets/_Project/Scripts/Core/Rules.cs
using System;

namespace ReinosHex.Core
{
    // POR QUE: o único lugar do projeto que muda o GameState. Se uma regra do GDD
    // muda, muda aqui e vale ao mesmo tempo para humano, IA e online.
    // ESTRATÉGIA: duas portas.
    //  - Validate(estado, ação): devolve null se pode, ou o motivo em texto se não pode.
    //    Não muda nada; a UI usa para habilitar botões e a IA para escolher jogadas.
    //  - Apply(estado, ação): valida de novo (nunca confia em quem chamou), aplica e
    //    PASSA A VEZ: cada turno é uma ação só (GDD §6.3).
    // Tudo é determinístico: sem sorteio, sem relógio. Mesmo estado + mesma ação =
    // mesmo resultado em qualquer aparelho.
    public static class Rules
    {
        // ---------- Validação ----------

        public static string Validate(GameState s, GameAction a)
        {
            if (s.IsOver) return "A partida já acabou.";
            int me = s.current;
            var cfg = s.config;

            switch (a.type)
            {
                case ActionType.Conquistar:
                {
                    var to = s.Get(a.to);
                    if (to == null) return "Fora do mapa.";
                    if (to.owner >= 0) return "Esse hexágono já tem dono.";
                    if (to.army.Total > 0) return "Está ocupado: é preciso atacar.";
                    if (!TouchesTerritory(s, me, a.to)) return "Só dá para conquistar vizinhos do seu reino.";
                    if (!s.players[me].resources.CanPay(cfg.claimCost)) return $"Faltam recursos. Custo: {cfg.claimCost}.";
                    return null;
                }
                case ActionType.Recrutar:
                {
                    var at = s.Get(a.to);
                    if (at == null) return "Fora do mapa.";
                    if (!IsRecruitPoint(s, me, at)) return "Só se recruta na cidade ou numa torre de vigia sua.";
                    if (a.count < 1) return "Recrute pelo menos 1.";
                    if (a.count > MaxRecruit(s)) return $"Faltam recursos. Cada soldado custa {cfg.soldierCost}.";
                    return null;
                }
                case ActionType.ConstruirTorre:
                {
                    var at = s.Get(a.to);
                    if (at == null) return "Fora do mapa.";
                    if (at.owner != me) return "Só dá para construir em hexágono seu.";
                    if (a.to == s.players[me].city) return "A cidade já recruta.";
                    if (at.tower) return "Esse hexágono já tem torre.";
                    if (!s.players[me].resources.CanPay(cfg.towerCost)) return $"Faltam recursos. Custo: {cfg.towerCost}.";
                    return null;
                }
                case ActionType.Mover:
                case ActionType.Atacar:
                {
                    var from = s.Get(a.from);
                    var to = s.Get(a.to);
                    if (from == null || to == null) return "Fora do mapa.";
                    if (from.owner != me) return "A origem não é sua.";
                    if (!a.from.IsNeighbor(a.to)) return "Só dá para agir em hexágonos vizinhos.";
                    if (a.count < 1 || a.count > from.army.Total) return "Quantidade de tropas inválida.";
                    if (a.type == ActionType.Mover)
                        return to.owner == me ? null : "Só dá para mover para hexágono seu.";
                    if (to.owner == me) return "Esse hexágono já é seu.";
                    if (to.IsFree) return "Hexágono livre: conquiste pagando recursos.";
                    return null;
                }
                case ActionType.FimDoTurno:
                    return null;
            }
            return "Ação desconhecida.";
        }

        // ---------- Aplicação ----------

        // Aplica a ação e passa a vez (GDD §6.3). Devolve o relatório se foi uma
        // batalha; senão, null. Se a ação acabou a partida, a vez não passa.
        public static BattleReport Apply(GameState s, GameAction a)
        {
            string error = Validate(s, a);
            if (error != null) throw new InvalidOperationException($"{a}: {error}");
            var report = ApplyOne(s, a);
            if (!s.IsOver) EndTurn(s);
            return report;
        }

        // O efeito de cada ação, sem passar a vez.
        static BattleReport ApplyOne(GameState s, GameAction a)
        {
            int me = s.current;
            var cfg = s.config;
            var player = s.players[me];

            switch (a.type)
            {
                case ActionType.Conquistar:
                {
                    player.resources.Pay(cfg.claimCost);
                    s.Get(a.to).owner = me; // entra vazio (GDD §5)
                    return null;
                }
                case ActionType.Recrutar:
                {
                    player.resources.Pay(cfg.soldierCost.Times(a.count));
                    s.Get(a.to).army.soldados += a.count; // na cidade ou na torre escolhida
                    return null;
                }
                case ActionType.ConstruirTorre:
                {
                    player.resources.Pay(cfg.towerCost);
                    s.Get(a.to).tower = true;
                    return null;
                }
                case ActionType.Mover:
                {
                    var from = s.Get(a.from);
                    var to = s.Get(a.to);
                    to.army.Add(from.army.Take(a.count));
                    return null;
                }
                case ActionType.Atacar:
                    return ApplyAttack(s, a);
            }
            return null; // FimDoTurno: passar a vez sem fazer nada
        }

        // ---------- Batalha ----------

        // Calcula a batalha SEM mudar o estado (usado na previsão e no Apply).
        // ESTRATÉGIA: regra do GDD §7: quem tem mais vence; os dois lados perdem
        // min(A, D). Se o atacante vence neutros, uma % deles entra no exército (§8).
        public static BattleReport Preview(GameState s, GameAction a)
        {
            var to = s.Get(a.to);
            int A = a.count, D = to.army.Total;
            var r = new BattleReport
            {
                attacker = s.current, defender = to.owner, from = a.from, to = a.to,
                attackers = A, defenders = D,
                attackerWon = A > D,
                attackerLosses = Math.Min(A, D),
                defenderLosses = Math.Min(A, D),
            };
            r.defenderWereMonsters = to.owner < 0 && to.army.monstros > 0;
            if (r.attackerWon && to.owner < 0)
            {
                int pct = s.config.neutralJoinPercent;
                r.joinedMonsters = to.army.monstros * pct / 100;
                r.joinedMercenaries = to.army.mercenarios * pct / 100;
            }
            r.cityCaptured = r.attackerWon && to.owner >= 0 && s.players[to.owner].city == a.to;
            return r;
        }

        // Aplica a batalha calculada por Preview.
        static BattleReport ApplyAttack(GameState s, GameAction a)
        {
            var r = Preview(s, a);
            var from = s.Get(a.from);
            var to = s.Get(a.to);

            var sent = from.army.Take(a.count);
            sent.Take(r.attackerLosses);
            to.army.Take(r.defenderLosses);

            if (r.attackerWon)
            {
                sent.monstros += r.joinedMonsters;
                sent.mercenarios += r.joinedMercenaries;
                to.army = sent;
                to.owner = s.current; // uma torre no hexágono passa junto (GDD §6.2)
                if (r.cityCaptured)
                {
                    s.players[r.defender].alive = false;
                    CheckWinner(s);
                }
            }
            // Se perdeu, "sent" já ficou vazio: as tropas enviadas morreram.
            return r;
        }

        // Com um só reino vivo, ele vence (GDD §9).
        static void CheckWinner(GameState s)
        {
            int alive = 0, last = -1;
            for (int i = 0; i < s.players.Length; i++)
                if (s.players[i].alive) { alive++; last = i; }
            if (alive == 1) s.winner = last;
        }

        // ---------- Turnos ----------

        // Passa a vez para o próximo reino vivo e começa o turno dele.
        static void EndTurn(GameState s)
        {
            int n = s.players.Length;
            do
            {
                s.current = (s.current + 1) % n;
                if (s.current == 0) s.turn++;
            } while (!s.players[s.current].alive);
            s.ply++;
            StartTurn(s);
        }

        // Início do turno: soma a produção (GDD §4).
        public static void StartTurn(GameState s)
        {
            int me = s.current;
            var resources = s.players[me].resources;
            foreach (var c in s.cells)
                if (c.owner == me) resources.Add(Yield(s.config, c.terrain));
        }

        // ---------- Ajudantes (também usados pela UI e pela IA) ----------

        // Quanto um hexágono deste terreno produz por turno.
        public static ResourceBag Yield(GameConfig cfg, Terrain t)
        {
            int n = cfg.yieldPerHex;
            switch (t)
            {
                case Terrain.Floresta: return new ResourceBag(n, 0, 0, 0);
                case Terrain.Pedreira: return new ResourceBag(0, n, 0, 0);
                case Terrain.Mina: return new ResourceBag(0, 0, n, 0);
                case Terrain.Pasto: return new ResourceBag(0, 0, 0, n);
                case Terrain.Cidade: return cfg.cityYield.Clone();
                default: return new ResourceBag();
            }
        }

        // Quantos soldados o jogador da vez consegue pagar agora.
        public static int MaxRecruit(GameState s)
        {
            var have = s.players[s.current].resources;
            var cost = s.config.soldierCost;
            int max = int.MaxValue;
            if (cost.madeira > 0) max = Math.Min(max, have.madeira / cost.madeira);
            if (cost.pedra > 0) max = Math.Min(max, have.pedra / cost.pedra);
            if (cost.ouro > 0) max = Math.Min(max, have.ouro / cost.ouro);
            if (cost.pasto > 0) max = Math.Min(max, have.pasto / cost.pasto);
            return max == int.MaxValue ? 0 : max; // custo zero = recrutamento desligado
        }

        // Dá para recrutar neste hexágono? Só na cidade ou numa torre de vigia do jogador (GDD §6.2).
        public static bool IsRecruitPoint(GameState s, int player, HexCell c) =>
            c.owner == player && (c.tower || c.coord == s.players[player].city);

        // O hexágono encosta em algum hexágono do jogador?
        public static bool TouchesTerritory(GameState s, int player, HexCoord c)
        {
            foreach (var n in c.Neighbors())
            {
                var cell = s.Get(n);
                if (cell != null && cell.owner == player) return true;
            }
            return false;
        }
    }
}
```

### 3.4 Teste das regras

```csharp
// Caminho: Assets/_Project/Scripts/Tests/RulesSelfTest.cs
using ReinosHex.Core;
using UnityEngine;

namespace ReinosHex.Tests
{
    // POR QUE: as regras são o coração do jogo e do online. Este teste monta
    // situações conhecidas e confere os números dos exemplos do GDD §7.
    // ESTRATÉGIA: gera um mapa, ESCREVE à mão o conteúdo de dois vizinhos da cidade
    // e aplica ações em sequência, conferindo o estado depois de cada uma. Como cada
    // ação passa a vez (GDD §6.3), o jogador B passa a vez entre as ações de A.
    public class RulesSelfTest : MonoBehaviour
    {
        [SerializeField] GameConfig config;

        void Start()
        {
            var s = MapGenerator.NewGame(config, 99, new[] { "A", "B" });
            var city = s.players[0].city;
            var alvo = s.Get(city.Neighbor(0));
            var outro = s.Get(city.Neighbor(1)); // vizinho da cidade E do alvo

            // Prepara: 5 soldados na cidade, 3 monstros no alvo, 4 saqueadores no outro.
            s.Get(city).army = new Army { soldados = 5 };
            alvo.owner = -1; alvo.army = new Army { monstros = 3 };
            outro.owner = -1; outro.army = new Army { mercenarios = 4 };

            // Conquistar hexágono ocupado não pode: tem que atacar.
            Check(Rules.Validate(s, GameAction.Claim(alvo.coord)) != null, "não compra hexágono ocupado");

            // 5 contra 3: vitória, sobram 2 soldados e os 3 monstros entram.
            var r = Rules.Apply(s, GameAction.Attack(city, alvo.coord, 5));
            Check(r.attackerWon && alvo.owner == 0, "vitória 5x3");
            Check(alvo.army.soldados == 2 && alvo.army.monstros == 3, "2 soldados + 3 monstros no alvo");

            // Uma ação por turno: a vez já passou para B sozinha.
            Check(s.current == 1 && s.ply == 1, "a ação passou a vez");
            Rules.Apply(s, GameAction.EndTurn()); // B passa
            Check(s.current == 0 && s.turn == 2 && s.ply == 2, "voltou para A na rodada 2");

            // 3 contra 4: derrota, o defensor fica com 1, a origem fica com 2.
            var r2 = Rules.Apply(s, GameAction.Attack(alvo.coord, outro.coord, 3));
            Check(!r2.attackerWon && outro.army.Total == 1 && alvo.army.Total == 2, "derrota 3x4");
            Rules.Apply(s, GameAction.EndTurn()); // B passa

            // Torre de vigia no alvo: só recruta lá depois de construir.
            s.players[0].resources.Add(new ResourceBag(10, 10, 10, 10));
            Check(Rules.Validate(s, GameAction.Recruit(alvo.coord, 1)) != null, "sem torre não recruta");
            Check(Rules.Validate(s, GameAction.BuildTower(city)) != null, "não constrói torre na cidade");
            Rules.Apply(s, GameAction.BuildTower(alvo.coord));
            Check(alvo.tower, "torre construída");
            Rules.Apply(s, GameAction.EndTurn()); // B passa

            // Recrutar na torre: os soldados aparecem nela, não na cidade.
            int naCidade = s.Get(city).army.soldados, naTorre = alvo.army.soldados;
            Rules.Apply(s, GameAction.Recruit(alvo.coord, 2));
            Check(alvo.army.soldados == naTorre + 2 && s.Get(city).army.soldados == naCidade, "recrutou na torre");

            // B toma o hexágono da torre e fica com ela.
            var deB = s.Get(alvo.coord.Neighbor(0));
            deB.owner = 1; deB.army = new Army { soldados = alvo.army.Total + 1 };
            Rules.Apply(s, GameAction.Attack(deB.coord, alvo.coord, deB.army.Total));
            Check(alvo.owner == 1 && alvo.tower && Rules.IsRecruitPoint(s, 1, alvo), "a torre passou para B");
            Debug.Log("RulesSelfTest terminou.");
        }

        static void Check(bool ok, string what)
        {
            if (!ok) Debug.LogError("FALHOU: " + what);
        }
    }
}
```

1. Adicione `RulesSelfTest` ao `Teste`, arraste o `GameConfig` e dê Play.

### ✅ Checkpoint da Fase 3

- O Console mostra `RulesSelfTest terminou.` sem nenhum `FALHOU`.
- Trocar **Neutral Join Percent** para 0 no `GameConfig` faz o teste "2 soldados + 3 monstros" falhar (prova de que a regra lê o config). Volte para 100 depois.

#### Problemas comuns

- **`InvalidOperationException` no Console:** uma ação inválida chegou em `Apply`. A mensagem diz qual ação e por quê; é o comportamento esperado (o `Apply` nunca aplica nada inválido).
- **"a ação passou a vez" falha:** `Apply` precisa chamar `EndTurn` depois de `ApplyOne` (menos quando a partida acabou).
- **"a torre passou para B" falha:** a vizinha `alvo.coord.Neighbor(0)` caiu fora do mapa ou na cidade de A nesta semente; troque o `0` por outra direção (1 a 5).

Próxima fase: **Tabuleiro na Tela e Input** — desenhar o mapa e tocar nos hexágonos.

---

# Parte 7 — Implementação Unity: Fase 4 (Tabuleiro na Tela e Input)

## Fase 4 — Tabuleiro na Tela e Input

> Objetivo desta fase: ver o mapa gerado, arrastar e dar zoom com mouse ou dedo, e tocar num hexágono para saber qual é.

### 4.1 Malha do hexágono: `HexMesh`

```csharp
// Caminho: Assets/_Project/Scripts/View/HexMesh.cs
using UnityEngine;

namespace ReinosHex.View
{
    // POR QUE: a arte final está Em aberto (GDD §11). Um hexágono desenhado em
    // código deixa o jogo inteiro jogável sem nenhum PNG.
    // ESTRATÉGIA: uma Mesh (a forma que a placa de vídeo desenha) com 7 pontos:
    // o centro e os 6 cantos, formando 6 triângulos. A cor vai nos VÉRTICES
    // (mesh.colors), que os shaders de sprite do Unity sempre respeitam; assim cada
    // hexágono tem sua própria cor sem criar um material por hexágono.
    public static class HexMesh
    {
        public static Mesh Create(float radius)
        {
            var mesh = new Mesh { name = "Hex" };
            var vertices = new Vector3[7];
            vertices[0] = Vector3.zero;
            for (int i = 0; i < 6; i++) vertices[i + 1] = HexLayout.Corner(i, radius);

            // Cada triângulo: centro, canto seguinte, canto atual (sentido horário
            // visto pela câmera, que é o lado "da frente" para o Unity).
            var triangles = new int[18];
            for (int i = 0; i < 6; i++)
            {
                triangles[i * 3] = 0;
                triangles[i * 3 + 1] = 1 + (i + 1) % 6;
                triangles[i * 3 + 2] = 1 + i;
            }
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            Paint(mesh, Color.white);
            mesh.RecalculateBounds();
            return mesh;
        }

        // Pinta a malha inteira de uma cor.
        public static void Paint(Mesh mesh, Color color)
        {
            var colors = new Color[mesh.vertexCount];
            for (int i = 0; i < colors.Length; i++) colors[i] = color;
            mesh.colors = colors;
        }
    }
}
```

### 4.2 Um hexágono na tela: `HexTileView`

```csharp
// Caminho: Assets/_Project/Scripts/View/HexTileView.cs
using ReinosHex.Core;
using TMPro;
using UnityEngine;

namespace ReinosHex.View
{
    public enum Highlight { Nenhum, Selecionado, Alvo }

    // POR QUE: mostra UM hexágono: cor do terreno, borda na cor do dono e um texto
    // com terreno e tropas. Também acende quando está selecionado ou é alvo possível.
    // ESTRATÉGIA: o objeto é montado em código (Init) com três peças:
    //  - MeshRenderer: o preenchimento colorido;
    //  - LineRenderer: a borda (uma linha fechada pelos 6 cantos);
    //  - TextMeshPro: o texto no mundo (não é UI de Canvas, fica preso ao hexágono).
    // "sortingOrder" decide quem fica na frente em 2D: fundo 0, borda 1, texto 2.
    public class HexTileView : MonoBehaviour
    {
        static readonly Color LabelColor = new Color(0.12f, 0.12f, 0.12f);

        Mesh mesh;
        LineRenderer border;
        TextMeshPro label;
        Color borderColor;
        float borderWidth;
        Highlight highlight;

        // Monta as peças. Chamado uma vez pelo MapView.
        public void Init(Material material)
        {
            mesh = HexMesh.Create(HexLayout.Size * 0.96f); // 4% de folga = "rejunte"
            gameObject.AddComponent<MeshFilter>().sharedMesh = mesh;
            var fill = gameObject.AddComponent<MeshRenderer>();
            fill.sharedMaterial = material;
            fill.sortingOrder = 0;

            var borderGo = new GameObject("Borda");
            borderGo.transform.SetParent(transform, false);
            border = borderGo.AddComponent<LineRenderer>();
            border.useWorldSpace = false;
            border.loop = true;
            border.positionCount = 6;
            for (int i = 0; i < 6; i++) border.SetPosition(i, HexLayout.Corner(i, HexLayout.Size * 0.86f));
            border.sharedMaterial = material;
            border.sortingOrder = 1;
            border.numCornerVertices = 2;

            var labelGo = new GameObject("Texto");
            labelGo.transform.SetParent(transform, false);
            label = labelGo.AddComponent<TextMeshPro>();
            label.alignment = TextAlignmentOptions.Center;
            label.fontSize = 2.2f;
            label.rectTransform.sizeDelta = new Vector2(0.8f, 0.6f);
            label.sortingOrder = 2;
        }

        // Atualiza a aparência a partir dos dados do hexágono.
        public void Show(HexCell cell, MapView map)
        {
            HexMesh.Paint(mesh, map.TerrainColor(cell.terrain));
            bool owned = cell.owner >= 0;
            borderColor = owned ? map.PlayerColor(cell.owner) : map.neutralBorder;
            borderWidth = owned ? 0.07f : 0.02f;
            label.text = LabelFor(cell);
            label.color = LabelColor;
            ApplyHighlight();
        }

        // Acende/apaga o destaque sem mexer no resto.
        public void SetHighlight(Highlight h)
        {
            highlight = h;
            ApplyHighlight();
        }

        // Destaque tem prioridade sobre a cor do dono.
        void ApplyHighlight()
        {
            Color c = borderColor;
            float w = borderWidth;
            if (highlight == Highlight.Selecionado) { c = Color.yellow; w = 0.1f; }
            else if (highlight == Highlight.Alvo) { c = Color.white; w = 0.06f; }
            border.startColor = c; border.endColor = c;
            border.startWidth = w; border.endWidth = w;
        }

        // Texto provisório: terreno em cima (com "Torre" se tiver uma, GDD §6.2), tropas embaixo.
        static string LabelFor(HexCell c)
        {
            string top = TerrainInfo.Name(c.terrain) + (c.tower ? " · Torre" : "");
            if (c.army.Total == 0) return top;
            if (c.owner < 0)
                return c.army.monstros > 0 ? $"{top}\nMonstros {c.army.Total}" : $"{top}\nSaqueadores {c.army.Total}";
            return $"{top}\n<b>{c.army.Total}</b>";
        }
    }
}
```

### 4.3 O mapa inteiro: `MapView`

```csharp
// Caminho: Assets/_Project/Scripts/View/MapView.cs
using System.Collections.Generic;
using ReinosHex.Core;
using UnityEngine;

namespace ReinosHex.View
{
    // POR QUE: cria um HexTileView por hexágono e os mantém em dia com o GameState.
    // ESTRATÉGIA: o MapView só LÊ o estado (nunca muda regras). Build cria os
    // objetos uma vez; Refresh repinta todos (91 hexágonos é pouco, não vale a pena
    // repintar só os que mudaram). As cores ficam aqui no Inspector para o time
    // brincar com a paleta provisória.
    public class MapView : MonoBehaviour
    {
        [Tooltip("Material de sprite sem luz (Sprite-Unlit-Default).")]
        public Material tileMaterial;
        [Tooltip("Floresta, Pedreira, Mina, Pasto, Cidade (mesma ordem do enum Terrain).")]
        public Color[] terrainColors =
        {
            new Color(0.38f, 0.62f, 0.35f), new Color(0.66f, 0.66f, 0.68f), new Color(0.93f, 0.78f, 0.33f),
            new Color(0.70f, 0.86f, 0.48f), new Color(0.92f, 0.87f, 0.76f),
        };
        public Color[] playerColors = { new Color(0.20f, 0.45f, 0.95f), new Color(0.90f, 0.25f, 0.22f) };
        public Color neutralBorder = new Color(0f, 0f, 0f, 0.25f);

        readonly Dictionary<HexCoord, HexTileView> tiles = new Dictionary<HexCoord, HexTileView>();
        GameState state;

        public Color TerrainColor(Terrain t) => terrainColors[(int)t];
        public Color PlayerColor(int player) => playerColors[player % playerColors.Length];

        // Cria um objeto por hexágono do estado.
        public void Build(GameState s)
        {
            foreach (Transform child in transform) Destroy(child.gameObject);
            tiles.Clear();
            state = s;
            foreach (var cell in s.cells)
            {
                var go = new GameObject($"Hex {cell.coord}");
                go.transform.SetParent(transform, false);
                go.transform.localPosition = HexLayout.ToWorld(cell.coord);
                var view = go.AddComponent<HexTileView>();
                view.Init(tileMaterial);
                tiles[cell.coord] = view;
            }
            Refresh();
        }

        // Repinta tudo a partir do estado atual.
        public void Refresh()
        {
            if (state == null) return;
            foreach (var cell in state.cells) tiles[cell.coord].Show(cell, this);
        }

        // Destaca o selecionado e os alvos possíveis (o resto apaga).
        public void SetHighlights(HexCoord? selected, IEnumerable<HexCoord> targets)
        {
            foreach (var t in tiles.Values) t.SetHighlight(Highlight.Nenhum);
            if (targets != null)
                foreach (var c in targets)
                    if (tiles.TryGetValue(c, out var v)) v.SetHighlight(Highlight.Alvo);
            if (selected is HexCoord s && tiles.TryGetValue(s, out var sv)) sv.SetHighlight(Highlight.Selecionado);
        }

        // Retângulo que cobre o mapa inteiro, para a câmera enquadrar.
        public Bounds WorldBounds()
        {
            var b = new Bounds(HexLayout.ToWorld(state.cells[0].coord), Vector3.zero);
            foreach (var c in state.cells) b.Encapsulate(HexLayout.ToWorld(c.coord));
            b.Expand(HexLayout.Size * 2f);
            return b;
        }
    }
}
```

### 4.4 Arrastar, zoom e toque: `BoardInput`

```csharp
// Caminho: Assets/_Project/Scripts/View/BoardInput.cs
using System;
using System.Collections.Generic;
using ReinosHex.Core;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.EnhancedTouch;
using Touch = UnityEngine.InputSystem.EnhancedTouch.Touch;
using TouchPhase = UnityEngine.InputSystem.TouchPhase;

namespace ReinosHex.View
{
    // POR QUE: o mesmo jogo roda com mouse (PC) e dedo (mobile). Este script junta
    // os dois num só evento: "HexTapped(coord)". O resto do jogo não sabe de onde
    // veio o toque.
    // ESTRATÉGIA:
    //  - Arrastar: guarda o ponto do MUNDO que estava sob o dedo quando o arraste
    //    começou e, a cada frame, move a câmera para que esse ponto continue sob o
    //    dedo. É o "agarrar o mapa".
    //  - Toque x arraste: se o dedo andou menos que "dragThresholdPixels" entre
    //    apertar e soltar, foi um toque.
    //  - Zoom: roda do mouse ou pinça com dois dedos; o ponto sob o cursor/meio da
    //    pinça fica parado (zoom "para onde você aponta").
    //  - Toques em cima de botões da UI são ignorados (IsOverUI).
    // EnhancedTouch é a API de toque do Input System novo; precisa ser ligada (Enable).
    [RequireComponent(typeof(Camera))]
    public class BoardInput : MonoBehaviour
    {
        public float minZoom = 2f, maxZoom = 12f;
        public float dragThresholdPixels = 15f;

        public event Action<HexCoord> HexTapped;

        Camera cam;
        bool pressed, dragging;
        Vector2 pressScreen;
        Vector3 grabbedWorld;
        readonly List<RaycastResult> uiHits = new List<RaycastResult>();

        void Awake() => cam = GetComponent<Camera>();
        void OnEnable() => EnhancedTouchSupport.Enable();
        void OnDisable() => EnhancedTouchSupport.Disable();

        void Update()
        {
            if (Touch.activeTouches.Count > 0) HandleTouch();
            else HandleMouse();
        }

        // Enquadra um retângulo do mundo (o mapa inteiro) na câmera.
        public void Frame(Bounds b)
        {
            var p = cam.transform.position;
            cam.transform.position = new Vector3(b.center.x, b.center.y, p.z);
            float size = Mathf.Max(b.extents.y, b.extents.x / cam.aspect);
            maxZoom = Mathf.Max(maxZoom, size * 1.2f);
            cam.orthographicSize = Mathf.Clamp(size, minZoom, maxZoom);
        }

        void HandleMouse()
        {
            var mouse = Mouse.current;
            if (mouse == null) return;
            Vector2 pos = mouse.position.ReadValue();

            float scroll = mouse.scroll.ReadValue().y;
            if (Mathf.Abs(scroll) > 0.01f && !IsOverUI(pos))
                ZoomAt(cam.orthographicSize * (scroll > 0 ? 0.9f : 1.1f), pos);

            if (mouse.leftButton.wasPressedThisFrame) { if (!IsOverUI(pos)) Begin(pos); }
            else if (mouse.leftButton.isPressed && pressed) Drag(pos);
            else if (mouse.leftButton.wasReleasedThisFrame && pressed) End(pos);
        }

        void HandleTouch()
        {
            var touches = Touch.activeTouches;
            if (touches.Count >= 2)
            {
                pressed = false; // dois dedos nunca viram toque
                var a = touches[0];
                var b = touches[1];
                float before = Vector2.Distance(a.screenPosition - a.delta, b.screenPosition - b.delta);
                float now = Vector2.Distance(a.screenPosition, b.screenPosition);
                if (before > 1f && now > 1f)
                    ZoomAt(cam.orthographicSize * before / now, (a.screenPosition + b.screenPosition) * 0.5f);
                return;
            }

            var t = touches[0];
            switch (t.phase)
            {
                case TouchPhase.Began:
                    if (!IsOverUI(t.screenPosition)) Begin(t.screenPosition);
                    break;
                case TouchPhase.Moved:
                case TouchPhase.Stationary:
                    if (pressed) Drag(t.screenPosition);
                    break;
                case TouchPhase.Ended:
                    if (pressed) End(t.screenPosition);
                    break;
                case TouchPhase.Canceled:
                    pressed = false;
                    break;
            }
        }

        void Begin(Vector2 screen)
        {
            pressed = true;
            dragging = false;
            pressScreen = screen;
        }

        void Drag(Vector2 screen)
        {
            if (!dragging && (screen - pressScreen).magnitude > dragThresholdPixels)
            {
                dragging = true;
                grabbedWorld = ScreenToWorld(pressScreen);
            }
            if (dragging) cam.transform.position += grabbedWorld - ScreenToWorld(screen);
        }

        void End(Vector2 screen)
        {
            if (!dragging) HexTapped?.Invoke(HexLayout.FromWorld(ScreenToWorld(screen)));
            pressed = false;
            dragging = false;
        }

        // Muda o zoom mantendo parado o ponto do mundo sob "screen".
        void ZoomAt(float newSize, Vector2 screen)
        {
            Vector3 before = ScreenToWorld(screen);
            cam.orthographicSize = Mathf.Clamp(newSize, minZoom, maxZoom);
            cam.transform.position += before - ScreenToWorld(screen);
        }

        Vector3 ScreenToWorld(Vector2 screen)
        {
            var w = cam.ScreenToWorldPoint(new Vector3(screen.x, screen.y, -cam.transform.position.z));
            w.z = 0f;
            return w;
        }

        // Há algum elemento de UI (botão, painel) sob este ponto da tela?
        bool IsOverUI(Vector2 screen)
        {
            if (EventSystem.current == null) return false;
            uiHits.Clear();
            EventSystem.current.RaycastAll(new PointerEventData(EventSystem.current) { position = screen }, uiHits);
            return uiHits.Count > 0;
        }
    }
}
```

### 4.5 Visualização provisória: `MapPreview`

```csharp
// Caminho: Assets/_Project/Scripts/Tests/MapPreview.cs
using ReinosHex.Core;
using ReinosHex.View;
using UnityEngine;

namespace ReinosHex.Tests
{
    // POR QUE: ver o mapa e testar o toque antes de existir a partida (Fase 5).
    // ESTRATÉGIA: gera um mapa, manda o MapView desenhar, enquadra e escreve no
    // Console o hexágono tocado. Será removido na Fase 5.
    public class MapPreview : MonoBehaviour
    {
        [SerializeField] GameConfig config;
        [SerializeField] MapView map;
        [SerializeField] BoardInput board;
        [SerializeField] int seed = 7;

        void Start()
        {
            var state = MapGenerator.NewGame(config, seed, new[] { "Azul", "Vermelho" });
            map.Build(state);
            board.Frame(map.WorldBounds());
            board.HexTapped += c =>
            {
                var cell = state.Get(c);
                Debug.Log(cell == null ? $"{c}: fora do mapa" : $"{c}: {TerrainInfo.Name(cell.terrain)}, dono {cell.owner}, tropas {cell.army.Total}");
                map.SetHighlights(c, c.Neighbors());
            };
        }
    }
}
```

### 4.6 Montar a cena

1. **Desative** o GameObject `Teste` (os testes das fases anteriores já passaram).
2. **Main Camera:** Projection **Orthographic**, Size 5, Background numa cor escura (ex.: `#1F2A33`). Adicione `BoardInput`.
3. Crie um GameObject vazio `Mapa` na posição (0, 0, 0) e adicione `MapView`. No campo **Tile Material**, use o material `Sprite-Unlit-Default` (procure pelo nome na janela Project, com o filtro **All**). Ele ignora luzes 2D, então o mapa aparece mesmo sem Global Light.
4. Crie um GameObject `Preview`, adicione `MapPreview` e arraste `GameConfig`, `Mapa` e `Main Camera` para os campos.
5. Dê Play. Teste no PC com mouse; para testar toque sem celular, use **Window → General → Device Simulator**.

### ✅ Checkpoint da Fase 4

- O mapa aparece inteiro, em forma de hexágono, com as duas cidades (borda azul embaixo, vermelha em cima) e os mesmos terrenos espelhados.
- Arrastar move o mapa sem "escorregar" sob o cursor; a roda do mouse (ou a pinça no Device Simulator) dá zoom no ponto do cursor.
- Clicar num hexágono escreve no Console o hexágono certo e acende ele (amarelo) e os vizinhos (branco). Arrastar e soltar **não** conta como clique.

#### Problemas comuns

- **Mapa rosa:** o material não é compatível com o URP. Use `Sprite-Unlit-Default` (do URP), não um material do pipeline antigo.
- **Texto gigante ou minúsculo:** o tamanho do `TextMeshPro` no mundo depende da fonte. Ajuste `label.fontSize` em `HexTileView.Init` (2.2 é o ponto de partida).
- **Clique acerta o hexágono do lado:** a câmera não está em z negativo (ex.: -10) ou não é ortográfica; `ScreenToWorld` usa a distância da câmera até z = 0.

Próxima fase: **Partida, HUD e Comandos** — turnos de verdade, painel de ação e HUD.

---

# Parte 8 — Implementação Unity: Fase 5 (Partida, HUD e Comandos)

## Fase 5 — Partida, HUD e Comandos

> Objetivo desta fase: uma partida completa jogável por duas pessoas na mesma tela, do primeiro turno até tomar a cidade.

### 5.1 Configuração da partida: `MatchSetup`

```csharp
// Caminho: Assets/_Project/Scripts/Match/MatchSetup.cs
using System;

namespace ReinosHex.Match
{
    public enum SeatKind { Humano, IA, Remoto }
    public enum MatchMode { ContraIA, HotSeat, Online }

    // POR QUE: o Menu (Fase 7) escolhe o modo e a cena Game precisa saber qual foi.
    // Trocar de cena apaga os objetos da cena anterior, mas variáveis estáticas
    // sobrevivem.
    // ESTRATÉGIA: uma classe estática com os dados da próxima partida. Os valores
    // padrão (duas pessoas, semente aleatória) deixam dar Play direto na cena Game.
    // "Seats" diz quem controla cada reino: humano neste aparelho, IA ou remoto.
    public static class MatchSetup
    {
        public static MatchMode Mode { get; private set; } = MatchMode.HotSeat;
        public static int Seed { get; private set; }  // 0 = sortear ao começar
        public static string[] Names { get; private set; } = { "Azul", "Vermelho" };
        public static SeatKind[] Seats { get; private set; } = { SeatKind.Humano, SeatKind.Humano };
        public static string OnlineCode { get; private set; }
        public static int LocalPlayer { get; private set; }

        public static void ContraIA(string name)
        {
            Mode = MatchMode.ContraIA;
            Seed = 0;
            Names = new[] { name, "Reino Rival" };
            Seats = new[] { SeatKind.Humano, SeatKind.IA };
        }

        public static void HotSeat(string name1, string name2)
        {
            Mode = MatchMode.HotSeat;
            Seed = 0;
            Names = new[] { name1, name2 };
            Seats = new[] { SeatKind.Humano, SeatKind.Humano };
        }

        public static void Online(string code, int seed, string[] names, int localPlayer)
        {
            Mode = MatchMode.Online;
            OnlineCode = code;
            Seed = seed;
            Names = names;
            LocalPlayer = localPlayer;
            Seats = new SeatKind[names.Length];
            for (int i = 0; i < Seats.Length; i++) Seats[i] = i == localPlayer ? SeatKind.Humano : SeatKind.Remoto;
        }

        // Semente para partidas locais (nunca 0, que significa "sortear").
        public static int RandomSeed() => Math.Max(1, Environment.TickCount & int.MaxValue);
    }
}
```

### 5.2 A partida: `MatchController`

```csharp
// Caminho: Assets/_Project/Scripts/Match/MatchController.cs
using System;
using System.Collections;
using System.Collections.Generic;
using ReinosHex.AI;
using ReinosHex.Core;
using ReinosHex.View;
using UnityEngine;

namespace ReinosHex.Match
{
    // POR QUE: o "juiz" da partida em cena. Toda ação, venha de onde vier (toque do
    // humano, IA, adversário online), entra por aqui, é validada pelas Rules e
    // avisa quem estiver ouvindo (mapa, HUD, online).
    // ESTRATÉGIA:
    //  - Eventos C# (event Action) em vez de referências diretas: o HUD, o painel de
    //    passar o aparelho e o OnlineSync "se inscrevem" e o MatchController não
    //    precisa conhecer nenhum deles.
    //  - Cada turno é UMA ação (GDD §6.3): Rules.Apply já passa a vez. A ação local
    //    fica em turnActions e LocalTurnEnded entrega essa lista (de uma ação) para
    //    o online enviar (Fase 8). Manter a lista deixa o formato do Firestore pronto
    //    para o caso de o GDD voltar a ter mais de uma ação por turno.
    //  - Quando é a vez de uma IA, uma Coroutine (função que pode "esperar" entre
    //    frames) espera um pouco e pede a ação dela, para dar para ver.
    public class MatchController : MonoBehaviour
    {
        [SerializeField] GameConfig config;
        [SerializeField] MapView map;
        [SerializeField] BoardInput board;
        [SerializeField] float aiDelay = 0.5f;

        public GameState State { get; private set; }
        public SeatKind[] Seats { get; private set; }

        public event Action StateChanged;
        public event Action<int> TurnStarted;
        public event Action<BattleReport> Battle;
        public event Action<int, GameAction> ActionApplied; // quem agiu e o quê (para o registro)
        public event Action<int> GameOver;
        public event Action<int, int, List<GameAction>> LocalTurnEnded; // ply, jogador, ações

        readonly List<GameAction> turnActions = new List<GameAction>();
        int turnPly, turnOwner;

        // Pode receber comandos do humano deste aparelho agora?
        public bool IsLocalHumanTurn => State != null && !State.IsOver && Seats[State.current] == SeatKind.Humano;

        // De qual reino o HUD mostra os recursos: o da vez, se for humano daqui;
        // senão, o primeiro humano daqui (contra IA e online).
        public int ViewerPlayer
        {
            get
            {
                if (Seats[State.current] == SeatKind.Humano) return State.current;
                for (int i = 0; i < Seats.Length; i++) if (Seats[i] == SeatKind.Humano) return i;
                return 0;
            }
        }

        void Start()
        {
            int seed = MatchSetup.Seed != 0 ? MatchSetup.Seed : MatchSetup.RandomSeed();
            Seats = (SeatKind[])MatchSetup.Seats.Clone();
            State = MapGenerator.NewGame(config, seed, MatchSetup.Names);
            map.Build(State);
            board.Frame(map.WorldBounds());
            StateChanged?.Invoke();
            BeginTurn();
        }

        // Comando de um humano deste aparelho. Devolve false e o motivo se não pode.
        public bool Submit(GameAction action, out string error)
        {
            error = IsLocalHumanTurn ? Rules.Validate(State, action) : "Não é a sua vez.";
            if (error != null) return false;
            ApplyInternal(action, local: true);
            return true;
        }

        // Turno inteiro vindo do servidor (Fase 8). Devolve o erro se algo não bate.
        public string ApplyRemoteTurn(List<GameAction> actions)
        {
            foreach (var a in actions)
            {
                string error = Rules.Validate(State, a);
                if (error != null) return $"{a}: {error}";
                ApplyInternal(a, local: false);
                if (State.IsOver) break;
            }
            return null;
        }

        // Aplica, avisa os ouvintes e começa o turno seguinte (ou acaba a partida).
        void ApplyInternal(GameAction action, bool local)
        {
            int player = State.current;
            var report = Rules.Apply(State, action); // aplica e já passa a vez
            if (local) turnActions.Add(action);

            map.Refresh();
            StateChanged?.Invoke();
            ActionApplied?.Invoke(player, action);
            if (report != null) Battle?.Invoke(report);

            FlushLocalTurn();
            if (State.IsOver)
            {
                GameOver?.Invoke(State.winner);
                return;
            }
            BeginTurn();
        }

        // Entrega as ações do turno local para quem quiser (o online).
        void FlushLocalTurn()
        {
            if (turnActions.Count == 0) return;
            LocalTurnEnded?.Invoke(turnPly, turnOwner, new List<GameAction>(turnActions));
            turnActions.Clear();
        }

        void BeginTurn()
        {
            turnPly = State.ply;
            turnOwner = State.current;
            turnActions.Clear();
            TurnStarted?.Invoke(State.current);
            if (Seats[State.current] == SeatKind.IA) StartCoroutine(RunAi());
        }

        // A IA faz a ação dela; Apply passa a vez e BeginTurn chama o próximo.
        IEnumerator RunAi()
        {
            yield return new WaitForSeconds(aiDelay);
            if (State.IsOver) yield break;
            var action = AiPlayer.NextAction(State);
            string error = Rules.Validate(State, action);
            if (error != null)
            {
                Debug.LogError($"IA tentou uma ação inválida ({action}): {error}");
                action = GameAction.EndTurn();
            }
            ApplyInternal(action, local: true);
        }
    }
}
```

O `MatchController` já chama a IA. Para compilar agora, crie o esqueleto abaixo; a Fase 6 troca pela IA de verdade.

```csharp
// Caminho: Assets/_Project/Scripts/AI/AiPlayer.cs (esqueleto temporário, trocado na Fase 6)
using ReinosHex.Core;

namespace ReinosHex.AI
{
    public static class AiPlayer
    {
        public static GameAction NextAction(GameState s) => GameAction.EndTurn();
    }
}
```

### 5.3 Painel de ação: `ActionPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ActionPanel.cs
using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace ReinosHex.UI
{
    // POR QUE: quase toda ação precisa de uma confirmação, às vezes com quantidade
    // (quantas tropas mover/atacar, quantos soldados recrutar). Um painel só, com
    // três jeitos de abrir, cobre tudo.
    // ESTRATÉGIA: o script fica num objeto sempre ativo e liga/desliga o filho
    // "root". (Se desligasse o próprio objeto, o Awake só rodaria na primeira
    // abertura e fecharia o painel na mesma hora.) O texto do corpo é uma função
    // da quantidade, para a previsão da batalha mudar enquanto o slider anda.
    public class ActionPanel : MonoBehaviour
    {
        [SerializeField] GameObject root;
        [SerializeField] TMP_Text title, body, countText, confirmLabel;
        [SerializeField] Slider slider;
        [SerializeField] Button confirmButton, closeButton;

        Action<int> onConfirm;
        Func<int, string> bodyFor;

        void Awake()
        {
            slider.wholeNumbers = true;
            slider.onValueChanged.AddListener(_ => UpdateBody());
            confirmButton.onClick.AddListener(Confirm);
            closeButton.onClick.AddListener(Hide);
            Hide();
        }

        // Só informação, sem botão de confirmar.
        public void ShowInfo(string titleText, string bodyText) =>
            Open(titleText, _ => bodyText, 0, null, null);

        // Confirmar sem quantidade (ex.: conquistar hexágono livre).
        public void ShowConfirm(string titleText, string bodyText, string button, Action ok) =>
            Open(titleText, _ => bodyText, 0, button, _ => ok());

        // Confirmar com quantidade de 1 a "max" (começa no máximo).
        public void ShowCount(string titleText, Func<int, string> bodyText, int max, string button, Action<int> ok) =>
            Open(titleText, bodyText, max, button, ok);

        public void Hide()
        {
            root.SetActive(false);
            onConfirm = null;
        }

        void Open(string titleText, Func<int, string> bodyText, int max, string button, Action<int> ok)
        {
            root.SetActive(true);
            title.text = titleText;
            bodyFor = bodyText;
            onConfirm = ok;
            bool hasCount = max >= 1;
            slider.gameObject.SetActive(hasCount);
            countText.gameObject.SetActive(hasCount);
            if (hasCount)
            {
                slider.minValue = 1;
                slider.maxValue = max;
                slider.SetValueWithoutNotify(max);
            }
            confirmButton.gameObject.SetActive(ok != null);
            confirmLabel.text = button ?? "";
            UpdateBody();
        }

        int Count => slider.gameObject.activeSelf ? Mathf.RoundToInt(slider.value) : 0;

        void UpdateBody()
        {
            countText.text = Count.ToString();
            body.text = bodyFor != null ? bodyFor(Count) : "";
        }

        void Confirm()
        {
            var callback = onConfirm;
            int n = Count;
            Hide();
            callback?.Invoke(n);
        }
    }
}
```

### 5.4 Comandos do humano: `HumanInput`

```csharp
// Caminho: Assets/_Project/Scripts/UI/HumanInput.cs
using System.Collections.Generic;
using ReinosHex.Core;
using ReinosHex.Match;
using ReinosHex.View;
using UnityEngine;

namespace ReinosHex.UI
{
    // POR QUE: transforma toques no tabuleiro em GameActions.
    // ESTRATÉGIA: uma pequena máquina de "selecionado ou não":
    //  - toque num hexágono SEU → seleciona (acende os alvos possíveis); se for a
    //    cidade ou uma torre, já oferece recrutar ali; se não, oferece construir
    //    uma torre de vigia (GDD §6.2);
    //  - com algo selecionado, toque num VIZINHO → mover (se for seu) ou atacar
    //    (se for de outro ou de neutros), com quantidade e previsão;
    //  - toque num hexágono LIVRE vizinho do reino → conquistar pagando;
    //  - toque no próprio selecionado → desseleciona.
    // Antes de abrir qualquer painel, pergunta às Rules se a ação é válida, para
    // nunca oferecer algo que vai falhar. Qualquer ação confirmada passa a vez.
    public class HumanInput : MonoBehaviour
    {
        [SerializeField] MatchController match;
        [SerializeField] BoardInput board;
        [SerializeField] MapView map;
        [SerializeField] ActionPanel panel;

        HexCoord? selected;

        void OnEnable()
        {
            board.HexTapped += OnTap;
            match.StateChanged += OnStateChanged;
            match.TurnStarted += OnTurnStarted;
        }

        void OnDisable()
        {
            board.HexTapped -= OnTap;
            match.StateChanged -= OnStateChanged;
            match.TurnStarted -= OnTurnStarted;
        }

        void OnTurnStarted(int player)
        {
            Deselect();
            panel.Hide();
        }

        // Depois de qualquer mudança, a seleção pode ter ficado sem sentido.
        void OnStateChanged()
        {
            if (selected is not HexCoord c) return;
            var cell = match.State.Get(c);
            if (cell.owner != match.State.current || cell.army.Total == 0) Deselect();
            else ShowTargets(c);
        }

        void OnTap(HexCoord c)
        {
            if (!match.IsLocalHumanTurn) return;
            var s = match.State;
            var cell = s.Get(c);
            if (cell == null) { Deselect(); panel.Hide(); return; }

            if (selected == c) { Deselect(); panel.Hide(); return; }
            if (selected is HexCoord from && from.IsNeighbor(c) && TryOrder(from, c)) return;

            if (cell.owner == s.current) { Select(c); return; }
            Deselect();
            if (cell.IsFree) OfferClaim(c);
            else Describe(cell);
        }

        // Seleciona um hexágono próprio.
        void Select(HexCoord c)
        {
            var s = match.State;
            var cell = s.Get(c);
            bool canOrder = cell.army.Total > 0;

            if (canOrder) { selected = c; ShowTargets(c); }
            else Deselect();

            string hint = canOrder ? "Ou toque num vizinho para mover ou atacar." : "Sem tropas aqui.";
            string title = $"{TerrainInfo.Name(cell.terrain)}{(cell.tower ? " com torre" : "")}: {cell.army.Total} tropas";
            string produces = $"Produz {TerrainInfo.Produces(cell.terrain)}.";

            // Cidade e torre de vigia: recrutar aqui.
            if (Rules.IsRecruitPoint(s, s.current, cell))
            {
                int max = Rules.MaxRecruit(s);
                if (max > 0)
                    panel.ShowCount(title,
                        n => $"Recrutar {n} soldado(s) aqui por {s.config.soldierCost.Times(n)}.\n{hint}",
                        max, "Recrutar", n => Send(GameAction.Recruit(c, n)));
                else
                    panel.ShowInfo(title, $"{produces}\nSem recursos para recrutar ({s.config.soldierCost} cada).\n{hint}");
                return;
            }

            // Outro hexágono seu: construir torre de vigia.
            string tower = $"Torre de vigia ({s.config.towerCost}): vira ponto de recrutamento.";
            string error = Rules.Validate(s, GameAction.BuildTower(c));
            if (error == null)
                panel.ShowConfirm(title, $"{produces}\n{tower}\n{hint}", "Construir torre",
                    () => Send(GameAction.BuildTower(c)));
            else
                panel.ShowInfo(title, $"{produces}\n{tower}\n{error}\n{hint}");
        }

        // Com um hexágono selecionado, tenta mover/atacar o vizinho tocado.
        bool TryOrder(HexCoord from, HexCoord to)
        {
            var s = match.State;
            var target = s.Get(to);
            int max = s.Get(from).army.Total;

            if (target.owner == s.current)
            {
                if (Rules.Validate(s, GameAction.Move(from, to, 1)) != null) return false;
                panel.ShowCount("Mover tropas",
                    n => $"Levar {n} de {max} tropas.",
                    max, "Mover", n => Send(GameAction.Move(from, to, n)));
                return true;
            }

            if (Rules.Validate(s, GameAction.Attack(from, to, 1)) != null) return false;
            panel.ShowCount("Atacar",
                n => Rules.Preview(s, GameAction.Attack(from, to, n)).PreviewText(),
                max, "Atacar", n => Send(GameAction.Attack(from, to, n)));
            return true;
        }

        void OfferClaim(HexCoord c)
        {
            var s = match.State;
            var cell = s.Get(c);
            string produces = $"Produz {TerrainInfo.Produces(cell.terrain)} todo turno.";
            string error = Rules.Validate(s, GameAction.Claim(c));
            if (error != null) { panel.ShowInfo("Hexágono livre", $"{produces}\n{error}"); return; }
            panel.ShowConfirm("Conquistar hexágono livre", $"{produces}\nCusto: {s.config.claimCost}.",
                "Pagar", () => Send(GameAction.Claim(c)));
        }

        // Hexágono de outro reino ou de neutros: só explica o que dá para fazer.
        void Describe(HexCell cell)
        {
            var s = match.State;
            string who = cell.owner >= 0 ? s.players[cell.owner].name
                       : cell.army.monstros > 0 ? "Monstros" : "Saqueadores";
            string extra = cell.owner < 0 ? "\nSe você vencer, eles entram no seu exército." : "";
            panel.ShowInfo($"{who}: {cell.army.Total} tropas",
                $"Selecione um hexágono seu vizinho para atacar.{extra}");
        }

        void Send(GameAction action)
        {
            if (!match.Submit(action, out string error)) panel.ShowInfo("Não deu", error);
        }

        // Acende os vizinhos onde mover ou atacar é válido.
        void ShowTargets(HexCoord from)
        {
            var s = match.State;
            var targets = new List<HexCoord>();
            foreach (var n in from.Neighbors())
                if (Rules.Validate(s, GameAction.Move(from, n, 1)) == null ||
                    Rules.Validate(s, GameAction.Attack(from, n, 1)) == null)
                    targets.Add(n);
            map.SetHighlights(from, targets);
        }

        void Deselect()
        {
            selected = null;
            map.SetHighlights(null, null);
        }
    }
}
```

### 5.5 HUD: `Hud`

```csharp
// Caminho: Assets/_Project/Scripts/UI/Hud.cs
using ReinosHex.Core;
using ReinosHex.Match;
using ReinosHex.View;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace ReinosHex.UI
{
    // POR QUE: o que fica sempre na tela (GDD §12): de quem é a vez, recursos,
    // território, a última ação (como cada turno é uma ação só, ela conta o que o
    // adversário acabou de fazer), botão de passar a vez e a tela de fim.
    // ESTRATÉGIA: só escuta eventos do MatchController e reescreve os textos. Não
    // guarda estado próprio, então nunca fica "desatualizado".
    public class Hud : MonoBehaviour
    {
        [SerializeField] MatchController match;
        [SerializeField] MapView map;
        [SerializeField] TMP_Text turnText, resourcesText, logText;
        [SerializeField] Button endTurnButton;
        [SerializeField] GameObject gameOverRoot;
        [SerializeField] TMP_Text gameOverText;
        [SerializeField] Button gameOverButton;

        void Awake()
        {
            endTurnButton.onClick.AddListener(EndTurn);
            gameOverButton.onClick.AddListener(BackToMenu);
            gameOverRoot.SetActive(false);
            logText.text = "";
        }

        void OnEnable()
        {
            match.StateChanged += Refresh;
            match.ActionApplied += OnAction;
            match.Battle += OnBattle;
            match.GameOver += OnGameOver;
        }

        void OnDisable()
        {
            match.StateChanged -= Refresh;
            match.ActionApplied -= OnAction;
            match.Battle -= OnBattle;
            match.GameOver -= OnGameOver;
        }

        void Refresh()
        {
            var s = match.State;
            string color = ColorUtility.ToHtmlStringRGB(map.PlayerColor(s.current));
            turnText.text = $"Rodada {s.turn} · vez de <color=#{color}>{s.players[s.current].name}</color>";

            int viewer = match.ViewerPlayer;
            int hexes = 0, troops = 0;
            foreach (var c in s.Owned(viewer)) { hexes++; troops += c.army.Total; }
            resourcesText.text = $"{s.players[viewer].name}: {s.players[viewer].resources}\n" +
                                 $"Território: {hexes} · Tropas: {troops}";
            endTurnButton.interactable = match.IsLocalHumanTurn;
        }

        // Registro das ações sem batalha. Num ataque, OnBattle vem logo depois e
        // escreve o texto da batalha por cima.
        void OnAction(int player, GameAction a)
        {
            var s = match.State;
            var cell = s.Get(a.to);
            string place = a.to == s.players[player].city ? "na cidade"
                         : cell != null ? $"em {TerrainInfo.Name(cell.terrain)}" : "";
            string what = a.type switch
            {
                ActionType.Conquistar => $"comprou {TerrainInfo.Name(cell.terrain)}",
                ActionType.Recrutar => $"recrutou {a.count} soldado(s) {(cell.tower ? "na torre de vigia" : place)}",
                ActionType.ConstruirTorre => $"construiu uma torre de vigia {place}",
                ActionType.Mover => $"moveu {a.count} tropa(s)",
                ActionType.FimDoTurno => "passou a vez",
                _ => "",
            };
            if (what != "") logText.text = $"{s.players[player].name} {what}.";
        }

        void OnBattle(BattleReport r)
        {
            var s = match.State;
            string defender = r.defender >= 0 ? s.players[r.defender].name
                            : r.defenderWereMonsters ? "monstros" : "saqueadores";
            logText.text = r.LogText(s.players[r.attacker].name, defender);
        }

        void OnGameOver(int winner)
        {
            gameOverRoot.SetActive(true);
            gameOverText.text = $"{match.State.players[winner].name} tomou a cidade inimiga e venceu!";
            endTurnButton.interactable = false;
        }

        void EndTurn()
        {
            if (match.IsLocalHumanTurn) match.Submit(GameAction.EndTurn(), out _);
        }

        // Volta ao Menu se ele estiver na Scene List; senão, reinicia a cena.
        void BackToMenu()
        {
            if (Application.CanStreamedLevelBeLoaded("Menu")) SceneManager.LoadScene("Menu");
            else SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
        }
    }
}
```

### 5.6 Montar a cena

1. **Apague** o GameObject `Preview` (o `MapPreview` não é mais usado).
2. Crie um GameObject vazio `Partida` e adicione `MatchController` e `HumanInput`. No `MatchController`, ligue **Config** (`GameConfig`), **Map** (`Mapa`) e **Board** (`Main Camera`).
3. **UI → Canvas.** No **Canvas Scaler**: **Scale With Screen Size**, 1920×1080, **Match** 0,5. Selecione o `EventSystem` criado junto e clique em **Replace with InputSystemUIInputModule**.
4. Dentro do Canvas, crie (UI → Text - TextMeshPro / Button - TextMeshPro / Slider / Panel):
   - `TurnText` (canto superior esquerdo), `ResourcesText` (logo abaixo) e `LogText` (canto inferior esquerdo). Desligue **Raycast Target** nos três, para não bloquearem toques no mapa.
   - `EndTurnButton` (canto inferior direito), texto "Passar a vez" (qualquer outra ação já passa a vez sozinha).
   - `ActionPanel`: objeto vazio com o script `ActionPanel`; dentro dele, `Root` (um Panel de ~700×340 ancorado embaixo no centro) com `Title`, `Body`, `Slider`, `CountText`, `ConfirmButton` (com o texto em `ConfirmLabel`) e `CloseButton` ("X"). Ligue todos os campos do script.
   - `GameOver`: um Panel em tela cheia, semitransparente, com `GameOverText` e `GameOverButton` ("Menu").
5. Adicione `Hud` ao Canvas e ligue os campos (`GameOver` vai em **Game Over Root**).
6. No `HumanInput`, ligue **Match** (`Partida`), **Board** (`Main Camera`), **Map** (`Mapa`) e **Panel** (`ActionPanel`).

### ✅ Checkpoint da Fase 5

- Ao dar Play, a HUD mostra "Rodada 1 · vez de Azul" e os recursos de Azul (já com a produção do primeiro turno).
- Tocar na cidade oferece recrutar; tocar num hexágono livre vizinho oferece conquistar com o custo; pagar muda a borda dele para azul e passa a vez para Vermelho.
- Tocar noutro hexágono seu oferece construir uma torre de vigia; depois de construída, tocar nela oferece recrutar ali, e os soldados aparecem na torre.
- Selecionar a cidade acende os vizinhos válidos; atacar monstros mostra a previsão, e o resultado bate com ela (inclusive os monstros entrando no exército).
- Toda ação confirmada passa a vez sozinha; "Passar a vez" passa sem fazer nada. O registro embaixo conta a última ação. Tomar a cidade adversária abre a tela de fim.

#### Problemas comuns

- **Tocar no mapa não faz nada:** algum texto ou painel em tela cheia está com **Raycast Target** ligado e o `BoardInput` acha que o toque foi na UI. O `Root` do `ActionPanel` e do `GameOver` só devem bloquear enquanto estão visíveis (ficam desativados no resto do tempo).
- **`NullReferenceException` no `Hud.Refresh`:** o `Hud` está num objeto que liga antes do `MatchController` existir. Confira se o campo **Match** está preenchido.

Próxima fase: **IA** — um rival para jogar sozinho.

---

# Parte 9 — Implementação Unity: Fase 6 (IA)

## Fase 6 — IA

> Objetivo desta fase: o reino rival joga sozinho seguindo regras simples (GDD §10).

### 6.1 `AiPlayer`

Troque o esqueleto da Fase 5 por este arquivo.

```csharp
// Caminho: Assets/_Project/Scripts/AI/AiPlayer.cs
using System;
using ReinosHex.Core;

namespace ReinosHex.AI
{
    // POR QUE: o modo "contra IA" do GDD §10.
    // ESTRATÉGIA: uma lista de prioridades. Como cada turno é UMA ação (GDD §6.3),
    // a IA devolve a PRIMEIRA jogada útil desta ordem e a vez passa:
    //  1. tomar a cidade inimiga, se algum hexágono vizinho dela tem mais tropas;
    //  2. atacar o melhor alvo que dá para vencer;
    //  3. construir torre de vigia perto da frente (longe dos pontos de recrutamento);
    //  4. gastar o estoque mais cheio: comprar hexágono livre (madeira + pedra) ou
    //     recrutar 3+ soldados de uma vez (ouro + pasto). Sem isso, ela gastava
    //     todo turno no recurso que sobra e nunca no outro;
    //  5. empurrar tropas paradas para mais perto da cidade inimiga;
    //  6. recrutar o que der; senão, passar a vez.
    // A IA só gera GameActions: as Rules validam igual às do humano, então ela
    // não tem como trapacear. A cidade guarda uma reserva (Guard) para não ficar
    // vazia com inimigos perto.
    public static class AiPlayer
    {
        public static GameAction NextAction(GameState s)
        {
            int me = s.current;
            var res = s.players[me].resources;
            HexCoord target = EnemyCity(s, me);
            bool recruitFirst = res.ouro + res.pasto > res.madeira + res.pedra;
            GameAction spend = recruitFirst
                ? Recruit(s, me, target, 3) ?? ClaimFree(s, me, target)
                : ClaimFree(s, me, target) ?? Recruit(s, me, target, 3);
            return AttackCity(s, me, target)
                ?? BestAttack(s, me, target)
                ?? BuildTower(s, me, target)
                ?? spend
                ?? AdvanceTroops(s, me, target)
                ?? Recruit(s, me, target, 1)
                ?? GameAction.EndTurn();
        }

        // 1. Tomar a cidade se der.
        static GameAction AttackCity(GameState s, int me, HexCoord city)
        {
            var defenders = s.Get(city).army.Total;
            foreach (var h in s.Owned(me))
            {
                if (!h.coord.IsNeighbor(city) || h.army.Total <= defenders) continue;
                var a = GameAction.Attack(h.coord, city, h.army.Total);
                if (Rules.Validate(s, a) == null) return a;
            }
            return null;
        }

        // 2. O ataque vencível mais valioso: inimigo > neutros; neutros grandes
        //    valem mais (mais monstros entram); torre vale mais; perto da cidade
        //    inimiga é melhor.
        static GameAction BestAttack(GameState s, int me, HexCoord enemyCity)
        {
            GameAction best = null;
            int bestScore = int.MinValue;
            foreach (var h in s.Owned(me))
            {
                int available = Available(s, me, h);
                if (available <= 0) continue;
                foreach (var n in h.coord.Neighbors())
                {
                    var t = s.Get(n);
                    if (t == null || t.owner == me || t.IsFree) continue;
                    int defenders = t.army.Total;
                    if (available <= defenders) continue;
                    int score = (t.owner >= 0 ? 50 : 30) + defenders * 2 + (t.tower ? 20 : 0) - n.DistanceTo(enemyCity);
                    if (score > bestScore)
                    {
                        bestScore = score;
                        best = GameAction.Attack(h.coord, n, available);
                    }
                }
            }
            return best;
        }

        // 3. Torre no hexágono seu mais perto da cidade inimiga, desde que ele
        //    fique a 3+ hexágonos de qualquer ponto de recrutamento (cidade ou torre).
        static GameAction BuildTower(GameState s, int me, HexCoord enemyCity)
        {
            if (!s.players[me].resources.CanPay(s.config.towerCost)) return null;
            var points = new System.Collections.Generic.List<HexCoord>();
            foreach (var c in s.Owned(me)) if (Rules.IsRecruitPoint(s, me, c)) points.Add(c.coord);

            HexCoord? best = null;
            int bestDistance = int.MaxValue;
            foreach (var c in s.Owned(me))
            {
                if (c.tower || c.coord == s.players[me].city) continue;
                bool nearPoint = false;
                foreach (var p in points) if (p.DistanceTo(c.coord) < 3) { nearPoint = true; break; }
                if (nearPoint) continue;
                int d = c.coord.DistanceTo(enemyCity);
                if (d < bestDistance) { bestDistance = d; best = c.coord; }
            }
            return best is HexCoord at ? GameAction.BuildTower(at) : null;
        }

        // 4a. Comprar o hexágono livre que produz o recurso mais escasso;
        //     empate: o mais perto da cidade inimiga.
        static GameAction ClaimFree(GameState s, int me, HexCoord enemyCity)
        {
            if (!s.players[me].resources.CanPay(s.config.claimCost)) return null;
            HexCell best = null;
            long bestScore = long.MinValue;
            foreach (var c in s.cells)
            {
                if (!c.IsFree || !Rules.TouchesTerritory(s, me, c.coord)) continue;
                long score = -(long)Stock(s.players[me].resources, c.terrain) * 10 - c.coord.DistanceTo(enemyCity);
                if (score > bestScore) { bestScore = score; best = c; }
            }
            return best == null ? null : GameAction.Claim(best.coord);
        }

        // 4b/6. Recrutar o máximo, se der pelo menos "min" soldados. Na cidade se
        //       ela está abaixo da reserva; senão, no ponto de recrutamento mais
        //       perto do inimigo (as torres da frente).
        static GameAction Recruit(GameState s, int me, HexCoord enemyCity, int min)
        {
            int n = Rules.MaxRecruit(s);
            if (n < min) return null;
            var city = s.players[me].city;
            if (s.Get(city).army.Total < Guard(s, me)) return GameAction.Recruit(city, n);
            HexCoord best = city;
            int bestDistance = city.DistanceTo(enemyCity);
            foreach (var c in s.Owned(me))
            {
                if (!c.tower) continue;
                int d = c.coord.DistanceTo(enemyCity);
                if (d < bestDistance) { bestDistance = d; best = c.coord; }
            }
            return GameAction.Recruit(best, n);
        }

        // 5. Mover tropas do interior para o vizinho próprio mais perto da cidade
        //    inimiga. Hexágonos encostados em inimigos ficam (seguram a frente).
        static GameAction AdvanceTroops(GameState s, int me, HexCoord enemyCity)
        {
            GameAction best = null;
            int bestAmount = 0;
            foreach (var h in s.Owned(me))
            {
                int available = Available(s, me, h);
                if (available <= bestAmount || TouchesEnemy(s, me, h.coord)) continue;
                int here = h.coord.DistanceTo(enemyCity);
                foreach (var n in h.coord.Neighbors())
                {
                    var t = s.Get(n);
                    if (t == null || t.owner != me || n.DistanceTo(enemyCity) >= here) continue;
                    best = GameAction.Move(h.coord, n, available);
                    bestAmount = available;
                    break;
                }
            }
            return best;
        }

        // Tropas que podem sair de um hexágono (a cidade guarda uma reserva).
        static int Available(GameState s, int me, HexCell h)
        {
            if (h.coord != s.players[me].city) return h.army.Total;
            return Math.Max(0, h.army.Total - Guard(s, me));
        }

        // Reserva da cidade: um a mais que o maior grupo inimigo a até 2 hexágonos.
        static int Guard(GameState s, int me)
        {
            var city = s.players[me].city;
            int threat = 0;
            foreach (var c in s.cells)
                if (c.owner >= 0 && c.owner != me && c.coord.DistanceTo(city) <= 2)
                    threat = Math.Max(threat, c.army.Total);
            return threat + 1;
        }

        static bool TouchesEnemy(GameState s, int me, HexCoord c)
        {
            foreach (var n in c.Neighbors())
            {
                var t = s.Get(n);
                if (t != null && t.owner >= 0 && t.owner != me) return true;
            }
            return false;
        }

        // Cidade viva mais próxima de outro reino.
        static HexCoord EnemyCity(GameState s, int me)
        {
            HexCoord best = s.players[me].city;
            int bestDistance = int.MaxValue;
            for (int i = 0; i < s.players.Length; i++)
            {
                if (i == me || !s.players[i].alive) continue;
                int d = s.players[i].city.DistanceTo(s.players[me].city);
                if (d < bestDistance) { bestDistance = d; best = s.players[i].city; }
            }
            return best;
        }

        // Quanto o reino tem do recurso que este terreno produz.
        static int Stock(ResourceBag r, Terrain t) => t switch
        {
            Terrain.Floresta => r.madeira,
            Terrain.Pedreira => r.pedra,
            Terrain.Mina => r.ouro,
            Terrain.Pasto => r.pasto,
            _ => int.MaxValue,
        };
    }
}
```

### 6.2 Testar contra a IA sem o Menu

O Menu só chega na Fase 7. Para testar agora, faça o `MatchSetup` começar contra a IA trocando, **temporariamente**, a linha dos assentos padrão em `MatchSetup.cs`:

```csharp
public static SeatKind[] Seats { get; private set; } = { SeatKind.Humano, SeatKind.IA };
```

Volte para `{ SeatKind.Humano, SeatKind.Humano }` no fim da fase.

### ✅ Checkpoint da Fase 6

- Depois de cada ação sua, Vermelho faz uma ação sozinho meio segundo depois (comprar, recrutar, construir torre, atacar ou mover) e a vez volta para você.
- O Console não mostra `IA tentou uma ação inválida`.
- Numa partida inteira, a IA chega até a sua cidade e a toma se você deixá-la desprotegida.

#### Problemas comuns

- **A IA nunca ataca:** com 100% dos neutros entrando no exército e custos baixos, ela pode passar muitos turnos só comprando hexágonos. É balanceamento (GDD §16), não bug: abaixe `claimCost` ou mude a ordem das prioridades em `NextAction` para testar.
- **A IA só recruta e nunca sai da cidade:** a escolha "gastar o estoque mais cheio" (passo 4) foi trocada por uma ordem fixa. Com uma ação por turno, recrutar sempre que dá 3 soldados ocupa todos os turnos.
- **A partida não acaba (IA contra IA):** no protótipo web, as sementes 5, 7, 42, 99, 1234 e 2026 terminam entre 27 e 71 rodadas. Se aqui não termina, compare `NextAction` com o `aiNext` do `prototipos/reinos-hex/game.js`.

Próxima fase: **Menu e Dois Jogadores no Mesmo Aparelho** — escolher o modo e passar o aparelho entre os turnos.

---

# Parte 10 — Implementação Unity: Fase 7 (Menu e Dois Jogadores no Mesmo Aparelho)

## Fase 7 — Menu e Dois Jogadores no Mesmo Aparelho

> Objetivo desta fase: um menu para escolher "contra IA" ou "dois jogadores", e uma tela de "passe o aparelho" entre turnos no hot-seat.

### 7.1 `MenuController`

```csharp
// Caminho: Assets/_Project/Scripts/UI/MenuController.cs
using ReinosHex.Match;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace ReinosHex.UI
{
    // POR QUE: a porta de entrada: nome do jogador e escolha do modo (GDD §10).
    // ESTRATÉGIA: grava a escolha no MatchSetup (estático) e carrega a cena Game.
    // O nome fica salvo em PlayerPrefs (um armazenamento chave-valor simples do
    // Unity) para não precisar digitar toda vez.
    public class MenuController : MonoBehaviour
    {
        [SerializeField] TMP_InputField nameInput, secondNameInput;
        [SerializeField] Button vsAiButton, hotSeatButton;

        public string PlayerName => Clean(nameInput.text, "Jogador");

        void Awake()
        {
            nameInput.text = PlayerPrefs.GetString("nome", "");
            vsAiButton.onClick.AddListener(() =>
            {
                SaveName();
                MatchSetup.ContraIA(PlayerName);
                SceneManager.LoadScene("Game");
            });
            hotSeatButton.onClick.AddListener(() =>
            {
                SaveName();
                MatchSetup.HotSeat(PlayerName, Clean(secondNameInput.text, "Jogador 2"));
                SceneManager.LoadScene("Game");
            });
        }

        public void SaveName() => PlayerPrefs.SetString("nome", nameInput.text.Trim());

        static string Clean(string text, string fallback) =>
            string.IsNullOrWhiteSpace(text) ? fallback : text.Trim();
    }
}
```

### 7.2 Tela de passar o aparelho: `PassDevicePanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/PassDevicePanel.cs
using ReinosHex.Match;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace ReinosHex.UI
{
    // POR QUE: no hot-seat, duas pessoas dividem o aparelho. Sem um aviso, quem
    // acabou de jogar pode tocar sem querer no turno do outro (GDD §10).
    // ESTRATÉGIA: no início de cada turno, se o modo é hot-seat, mostra um painel
    // de tela cheia por cima do mapa. Como o painel é UI, o BoardInput ignora
    // toques enquanto ele está aberto. Some ao tocar em "Começar".
    public class PassDevicePanel : MonoBehaviour
    {
        [SerializeField] MatchController match;
        [SerializeField] GameObject root;
        [SerializeField] TMP_Text message;
        [SerializeField] Button startButton;

        void Awake()
        {
            root.SetActive(false);
            startButton.onClick.AddListener(() => root.SetActive(false));
        }

        void OnEnable() => match.TurnStarted += OnTurnStarted;
        void OnDisable() => match.TurnStarted -= OnTurnStarted;

        void OnTurnStarted(int player)
        {
            if (MatchSetup.Mode != MatchMode.HotSeat) return;
            root.SetActive(true);
            message.text = $"Vez de {match.State.players[player].name}\nPasse o aparelho e toque em Começar.";
        }
    }
}
```

### 7.3 Montar as cenas

1. Se você mudou os assentos padrão do `MatchSetup` na Fase 6, volte para `{ SeatKind.Humano, SeatKind.Humano }`.
2. **Cena `Menu`:** crie um Canvas (mesmas configurações da Fase 5, com `InputSystemUIInputModule` no EventSystem) com: título "Reinos Hex", `NameInput` (TMP Input Field, placeholder "Seu nome"), `SecondNameInput` (placeholder "Jogador 2 (só no modo dois jogadores)"), botões `VsAiButton` ("Contra a IA") e `HotSeatButton` ("Dois jogadores no mesmo aparelho"). Adicione `MenuController` ao Canvas e ligue os campos.
3. **Cena `Game`:** dentro do Canvas, crie `PassDevice`: objeto vazio com `PassDevicePanel`, e dentro dele `Root` (Panel em tela cheia, opaco o bastante para esconder o mapa) com `Message` e `StartButton` ("Começar"). Deixe-o como o **último** filho do Canvas, para ficar por cima de tudo. Ligue os campos (`Match` = `Partida`).
4. Confira a Scene List: `Menu` (0), `Game` (1). Abra a cena `Menu` e dê Play a partir dela.

### ✅ Checkpoint da Fase 7

- O Menu lembra o nome digitado da última vez.
- "Contra a IA" abre uma partida contra "Reino Rival" que joga sozinho, sem tela de passar o aparelho.
- "Dois jogadores" mostra "Vez de Fulano" a cada turno, e o mapa não responde a toques até apertar "Começar".
- O botão "Menu" da tela de fim volta para o Menu.

#### Problemas comuns

- **A tela de passar o aparelho não aparece no primeiro turno:** o `PassDevicePanel` precisa estar ativo na cena (só o `Root` começa desligado), senão ele se inscreve no `TurnStarted` tarde demais.

Próxima fase: **Multiplayer Online com Firebase** — jogar com alguém em outro aparelho.

---

# Parte 11 — Implementação Unity: Fase 8 (Multiplayer Online com Firebase)

## Fase 8 — Multiplayer Online com Firebase

> Objetivo desta fase: criar uma sala, entrar com o código num segundo aparelho e jogar a partida por turnos pela internet (GDD §10 e §13).

**Como funciona (resumo):** o servidor guarda só a **semente** da partida e a **lista de ações de cada turno**. Cada aparelho gera o mesmo mapa com a semente e aplica as mesmas ações com as mesmas `Rules`, chegando ao mesmo estado. Não existe "estado do jogo" no servidor para ficar dessincronizado; se um aparelho fechar, ele reconstrói tudo repetindo os turnos desde o começo.

### 8.1 Preparar o Firebase

1. No [console do Firebase](https://console.firebase.google.com/), crie um projeto (ou use o do estúdio).
2. Adicione um app **Android** com o *package name* do jogo (o mesmo de **Player Settings → Other Settings → Package Name**, ex.: `com.manguebyte.reinoshex`). Baixe o `google-services.json` e coloque em `Assets/`. Para iOS, adicione um app iOS e coloque o `GoogleService-Info.plist` em `Assets/`. O editor e o build de Windows usam o arquivo do Android.
3. **Authentication → Sign-in method:** ligue **Anonymous**.
4. **Firestore Database:** crie o banco (modo de produção).
5. Baixe o **Firebase Unity SDK** e importe no projeto (**Assets → Import Package → Custom Package**) os pacotes `FirebaseAuth.unitypackage` e `FirebaseFirestore.unitypackage`. Aceite o **External Dependency Manager** quando ele pedir para resolver as dependências do Android.

### 8.2 Regras de segurança do Firestore

Cole em **Firestore → Rules** e publique. Elas garantem que só os dois jogadores leem a partida, que quem entra é o segundo jogador e que cada turno é escrito uma única vez, pelo jogador da vez.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function partida(code) {
      return get(/databases/$(database)/documents/jogos/reinos-hex/partidas/$(code)).data;
    }

    match /jogos/reinos-hex/partidas/{code} {
      allow read: if request.auth != null;
      // Criar: o criador é o único jogador.
      allow create: if request.auth != null
        && request.resource.data.players == [request.auth.uid]
        && request.resource.data.status == 'esperando';
      // Entrar: só enquanto espera, mantendo o criador e acrescentando quem entra.
      allow update: if request.auth != null
        && resource.data.status == 'esperando'
        && request.resource.data.status == 'jogando'
        && request.resource.data.players.size() == 2
        && request.resource.data.players[0] == resource.data.players[0]
        && request.resource.data.players[1] == request.auth.uid
        && request.resource.data.seed == resource.data.seed;
      allow delete: if false;

      match /turnos/{ply} {
        allow read: if request.auth != null && request.auth.uid in partida(code).players;
        // Turno n é do jogador n % 2, escrito por ele mesmo, uma única vez.
        allow create: if request.auth != null
          && request.resource.data.ply == int(ply)
          && request.resource.data.player == int(ply) % 2
          && partida(code).players[request.resource.data.player] == request.auth.uid;
        allow update, delete: if false;
      }
    }
  }
}
```

### 8.3 Conexão: `FirebaseBoot`

```csharp
// Caminho: Assets/_Project/Scripts/Online/FirebaseBoot.cs
using System;
using System.Threading.Tasks;
using Firebase;
using Firebase.Auth;
using Firebase.Firestore;

namespace ReinosHex.Online
{
    // POR QUE: antes de qualquer leitura ou escrita, o Firebase precisa conferir
    // suas dependências e o jogador precisa estar logado (anônimo, GDD §13).
    // ESTRATÉGIA: uma Task guardada: a primeira chamada faz o trabalho, as outras
    // só esperam a mesma Task. "await" (C# assíncrono) espera sem travar o jogo; no
    // Unity, o código depois do await volta a rodar na thread principal, então dá
    // para mexer em objetos de cena em seguida.
    public static class FirebaseBoot
    {
        static Task<string> signIn;

        // Garante login e devolve o uid do jogador.
        public static Task<string> SignIn() => signIn ??= Init();

        static async Task<string> Init()
        {
            var status = await FirebaseApp.CheckAndFixDependenciesAsync();
            if (status != DependencyStatus.Available)
            {
                signIn = null; // deixa tentar de novo
                throw new Exception("Firebase indisponível: " + status);
            }
            var auth = FirebaseAuth.DefaultInstance;
            if (auth.CurrentUser == null) await auth.SignInAnonymouslyAsync();
            return auth.CurrentUser.UserId;
        }

        public static FirebaseFirestore Db => FirebaseFirestore.DefaultInstance;

        // /jogos/reinos-hex/partidas
        public static CollectionReference Partidas =>
            Db.Collection("jogos").Document("reinos-hex").Collection("partidas");

        // Mensagem legível de um erro do Firebase (que costuma vir embrulhado).
        public static string Message(Exception e) =>
            e is AggregateException a && a.InnerException != null ? a.InnerException.Message : e.Message;
    }
}
```

### 8.4 Criar e entrar na sala: `OnlineLobby`

```csharp
// Caminho: Assets/_Project/Scripts/Online/OnlineLobby.cs
using System;
using System.Collections.Generic;
using Firebase.Firestore;
using ReinosHex.Match;
using ReinosHex.UI;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace ReinosHex.Online
{
    // POR QUE: a parte online do Menu: criar uma sala com código ou entrar numa.
    // ESTRATÉGIA:
    //  - Criar: sorteia código e semente e grava o documento da partida com o
    //    criador como jogador 0. Depois "escuta" o documento (Listen) até o status
    //    virar "jogando".
    //  - Entrar: uma TRANSAÇÃO lê o documento e, se ainda está esperando, acrescenta
    //    o jogador 1. Transação garante que, se duas pessoas entrarem ao mesmo
    //    tempo, só uma consegue.
    //  - Quem já está na sala (fechou o app no meio) entra com o mesmo código e
    //    retoma: a cena Game repete todos os turnos já jogados.
    public class OnlineLobby : MonoBehaviour
    {
        const string Letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem O/0 e I/1

        [SerializeField] MenuController menu;
        [SerializeField] TMP_InputField codeInput;
        [SerializeField] Button createButton, joinButton;
        [SerializeField] TMP_Text statusText;

        ListenerRegistration waiting;

        void Awake()
        {
            createButton.onClick.AddListener(Create);
            joinButton.onClick.AddListener(Join);
            statusText.text = "";
        }

        void OnDestroy() => waiting?.Stop();

        async void Create()
        {
            SetBusy(true, "Conectando...");
            try
            {
                menu.SaveName();
                string uid = await FirebaseBoot.SignIn();
                string code = NewCode();
                int seed = MatchSetup.RandomSeed();
                var doc = FirebaseBoot.Partidas.Document(code);
                await doc.SetAsync(new Dictionary<string, object>
                {
                    ["seed"] = seed,
                    ["players"] = new List<string> { uid },
                    ["names"] = new List<string> { menu.PlayerName },
                    ["status"] = "esperando",
                    ["createdAt"] = FieldValue.ServerTimestamp,
                });
                statusText.text = $"Sala criada. Código: <b>{code}</b>\nEsperando o adversário...";
                waiting = doc.Listen(snap =>
                {
                    if (!snap.Exists || snap.GetValue<string>("status") != "jogando") return;
                    waiting.Stop();
                    waiting = null;
                    Begin(code, snap, uid);
                });
            }
            catch (Exception e)
            {
                SetBusy(false, "Não deu para criar a sala: " + FirebaseBoot.Message(e));
            }
        }

        async void Join()
        {
            string code = codeInput.text.Trim().ToUpperInvariant();
            if (code.Length == 0) return;
            SetBusy(true, "Entrando...");
            try
            {
                menu.SaveName();
                string uid = await FirebaseBoot.SignIn();
                var doc = FirebaseBoot.Partidas.Document(code);
                await FirebaseBoot.Db.RunTransactionAsync(async tx =>
                {
                    var snap = await tx.GetSnapshotAsync(doc);
                    if (!snap.Exists) throw new Exception("sala não encontrada.");
                    var players = snap.GetValue<List<string>>("players");
                    if (players.Contains(uid))
                    {
                        if (players.Count < 2) throw new Exception("a sala ainda espera o adversário.");
                        return true; // já é jogador desta sala: só retomar
                    }
                    if (snap.GetValue<string>("status") != "esperando") throw new Exception("a sala já está cheia.");
                    var names = snap.GetValue<List<string>>("names");
                    players.Add(uid);
                    names.Add(menu.PlayerName);
                    tx.Update(doc, new Dictionary<string, object>
                    {
                        ["players"] = players,
                        ["names"] = names,
                        ["status"] = "jogando",
                    });
                    return true;
                });
                Begin(code, await doc.GetSnapshotAsync(), uid);
            }
            catch (Exception e)
            {
                SetBusy(false, "Não deu para entrar: " + FirebaseBoot.Message(e));
            }
        }

        // Guarda os dados no MatchSetup e abre a cena Game.
        void Begin(string code, DocumentSnapshot snap, string uid)
        {
            var players = snap.GetValue<List<string>>("players");
            var names = snap.GetValue<List<string>>("names");
            int seed = (int)snap.GetValue<long>("seed");
            MatchSetup.Online(code, seed, names.ToArray(), players.IndexOf(uid));
            SceneManager.LoadScene("Game");
        }

        void SetBusy(bool busy, string message)
        {
            createButton.interactable = !busy;
            joinButton.interactable = !busy;
            statusText.text = message;
        }

        static string NewCode()
        {
            var chars = new char[6];
            for (int i = 0; i < chars.Length; i++) chars[i] = Letters[UnityEngine.Random.Range(0, Letters.Length)];
            return new string(chars);
        }
    }
}
```

### 8.5 Sincronizar os turnos: `OnlineSync`

```csharp
// Caminho: Assets/_Project/Scripts/Online/OnlineSync.cs
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Firebase.Firestore;
using ReinosHex.Core;
using ReinosHex.Match;
using TMPro;
using UnityEngine;

namespace ReinosHex.Online
{
    // POR QUE: liga a partida em cena ao Firestore: envia os turnos deste aparelho
    // e aplica os do outro.
    // ESTRATÉGIA:
    //  - ENVIAR: quando o MatchController avisa LocalTurnEnded, grava o documento
    //    turnos/{ply} com a lista de ações em JSON. O id é o número do turno com 5
    //    dígitos ("00007"), então a ordem alfabética é a ordem do jogo. Se a rede
    //    falhar, tenta de novo; se o documento já existir (o envio anterior chegou e
    //    só a resposta se perdeu), para.
    //  - RECEBER: escuta a coleção "turnos" ordenada por ply. Cada turno novo vai
    //    para "pending" e é aplicado assim que for o próximo da fila (ply == ply
    //    atual). Turnos já aplicados (ply menor) são ignorados. É isso que permite
    //    retomar: ao abrir a cena, o listener entrega TODOS os turnos e a partida
    //    é reconstruída em ordem.
    //  - Se uma ação recebida for inválida aqui, os aparelhos divergiram (ex.:
    //    GameConfig diferente). A partida para com um aviso em vez de seguir errada.
    public class OnlineSync : MonoBehaviour
    {
        [SerializeField] MatchController match;
        [SerializeField] TMP_Text statusText;

        readonly SortedDictionary<int, List<GameAction>> pending = new SortedDictionary<int, List<GameAction>>();
        ListenerRegistration listener;
        bool broken;

        CollectionReference Turns =>
            FirebaseBoot.Partidas.Document(MatchSetup.OnlineCode).Collection("turnos");

        void OnEnable() => match.LocalTurnEnded += Push;
        void OnDisable() => match.LocalTurnEnded -= Push;
        void OnDestroy() => listener?.Stop();

        async void Start()
        {
            if (MatchSetup.Mode != MatchMode.Online) { enabled = false; return; }
            statusText.text = "Conectando...";
            try
            {
                await FirebaseBoot.SignIn();
                listener = Turns.OrderBy("ply").Listen(OnTurns);
                statusText.text = "";
            }
            catch (Exception e)
            {
                statusText.text = "Sem conexão: " + FirebaseBoot.Message(e);
            }
        }

        // A fila é drenada no Update porque o listener pode responder antes de a
        // partida existir (MatchController.Start ainda não rodou).
        void Update()
        {
            if (pending.Count > 0) Drain();
        }

        void OnTurns(QuerySnapshot snapshot)
        {
            foreach (var doc in snapshot.Documents)
            {
                int ply = (int)doc.GetValue<long>("ply");
                if (pending.ContainsKey(ply)) continue;
                if (match.State != null && ply < match.State.ply) continue; // já aplicado
                var list = JsonUtility.FromJson<ActionList>(doc.GetValue<string>("actions"));
                pending[ply] = list.items;
            }
        }

        // Aplica, em ordem, todos os turnos que já estão na vez.
        void Drain()
        {
            var s = match.State;
            if (broken || s == null) return;
            while (!s.IsOver && pending.TryGetValue(s.ply, out var actions))
            {
                int ply = s.ply;
                pending.Remove(ply);
                string error = match.ApplyRemoteTurn(actions);
                if (error != null)
                {
                    broken = true;
                    statusText.text = $"Partida dessincronizada no turno {ply}: {error}";
                    return;
                }
                if (s.ply == ply) break; // acabou no meio do turno (vitória)
            }
            // Descarta o que ficou para trás.
            var old = new List<int>();
            foreach (var k in pending.Keys) if (k < s.ply) old.Add(k);
            foreach (var k in old) pending.Remove(k);
        }

        // Envia um turno local, tentando de novo se a rede falhar.
        async void Push(int ply, int player, List<GameAction> actions)
        {
            if (MatchSetup.Mode != MatchMode.Online) return;
            var doc = Turns.Document(ply.ToString("D5"));
            var data = new Dictionary<string, object>
            {
                ["ply"] = ply,
                ["player"] = player,
                ["actions"] = JsonUtility.ToJson(new ActionList { items = actions }),
            };
            for (int attempt = 1; ; attempt++)
            {
                try
                {
                    await doc.SetAsync(data);
                    statusText.text = "";
                    return;
                }
                catch (Exception e)
                {
                    Debug.LogWarning($"Falha ao enviar o turno {ply}: {FirebaseBoot.Message(e)}");
                    try { if ((await doc.GetSnapshotAsync()).Exists) { statusText.text = ""; return; } }
                    catch (Exception) { /* sem rede: tenta de novo abaixo */ }
                    if (this == null) return; // a cena foi fechada
                    statusText.text = $"Sem conexão, tentando de novo ({attempt})...";
                    await Task.Delay(2000);
                }
            }
        }
    }
}
```

### 8.6 Montar as cenas

1. **Cena `Menu`:** acrescente ao Canvas uma área "Online" com `CodeInput` (TMP Input Field, placeholder "Código da sala", **Character Limit** 6), botões `CreateButton` ("Criar sala") e `JoinButton` ("Entrar") e `OnlineStatus` (texto). Adicione `OnlineLobby` ao Canvas e ligue os campos (**Menu** = o `MenuController` do mesmo Canvas).
2. **Cena `Game`:** crie `Online` (objeto vazio) com `OnlineSync`; ligue **Match** (`Partida`) e **Status Text** a um texto novo no topo central do Canvas (Raycast Target desligado).
3. Para testar com dois "aparelhos" no mesmo PC: faça um build de Windows (Fase 9) e rode o build e o editor ao mesmo tempo. Cada um precisa de um login anônimo diferente; build e editor já têm.

### ✅ Checkpoint da Fase 8

- No aparelho A, "Criar sala" mostra um código de 6 letras. No aparelho B, digitar o código e "Entrar" abre a partida nos dois, com o **mesmo mapa**.
- Só o jogador da vez consegue agir; o outro vê o botão "Passar a vez" apagado.
- Cada ação feita em A aparece em B logo depois e a vez passa para B (um documento por ação, já que cada turno é uma ação só).
- Fechar o app de B no meio da partida e entrar de novo com o mesmo código reconstrói o tabuleiro exatamente como estava.
- No console do Firebase, `jogos/reinos-hex/partidas/{código}/turnos` tem um documento por turno (`00000`, `00001`...).

#### Problemas comuns

- **`PERMISSION_DENIED` ao criar ou entrar:** as regras da §8.2 não foram publicadas, ou o login anônimo está desligado no console.
- **"Partida dessincronizada" logo no começo:** os dois aparelhos não têm o mesmo `GameConfig` (ex.: um build antigo). Gere os dois builds da mesma versão.
- **Criar sala falha às vezes com `PERMISSION_DENIED`:** o código sorteado já existia (as regras bloqueiam sobrescrever outra sala). Tentar de novo sorteia outro código.

Próxima fase: **Build e Próximos Passos** — gerar os builds de PC e mobile.

---

# Parte 12 — Implementação Unity: Fase 9 (Build e Próximos Passos)

## Fase 9 — Build e Próximos Passos

> Objetivo desta fase: builds jogáveis de PC e Android (e iOS, se houver Mac) com os três modos.

### 9.1 Configurações comuns

1. **Edit → Project Settings → Player:** Company Name, Product Name ("Reinos Hex"), versão `0.1.0` (a mesma do GDD).
2. **File → Build Profiles → Scene List:** `Menu` (0) e `Game` (1).
3. Desative ou apague o GameObject `Teste` da cena `Game` antes do build.

### 9.2 Windows

1. Build Profiles → **Windows** → **Switch Platform** → **Build**.
2. O Firebase de desktop é para desenvolvimento (bom para testar o online com o editor), não para publicar na Steam sem revisão.

### 9.3 Android

1. Build Profiles → **Android** → **Switch Platform**.
2. **Player → Other Settings:** **Scripting Backend** IL2CPP, **Target Architectures** ARM64, *package name* igual ao cadastrado no Firebase.
3. **Orientação:** **Em aberto** no GDD; para começar, **Auto Rotation** com retrato e paisagem ligados (o `BoardInput.Frame` reenquadra pelo `aspect`).
4. **Build And Run** com o celular conectado (depuração USB ligada).

### 9.4 iOS (opcional)

1. Precisa de Mac com Xcode. Build Profiles → **iOS** → **Build** gera um projeto Xcode; o `GoogleService-Info.plist` precisa estar em `Assets/`.

### 9.5 Web

O GDD pede PC e mobile. Um build **WebGL** roda os modos contra IA e hot-seat, mas o Firebase Unity SDK **não funciona em WebGL**: o online na web precisaria do SDK JavaScript do Firebase com uma ponte (`.jslib`). **Em aberto** se a web entra no escopo.

### ✅ Checkpoint da Fase 9

- O build de Windows abre no Menu e joga os três modos.
- O APK instala no Android, o toque seleciona hexágonos, arrastar e pinça funcionam, e uma partida online entre o celular e o PC vai do começo ao fim.

#### Problemas comuns

- **Android fecha ao abrir o modo online:** faltou o `google-services.json` em `Assets/` no momento do build, ou o External Dependency Manager não resolveu as dependências (**Assets → External Dependency Manager → Android Resolver → Force Resolve**).

### 9.6 Próximos passos

Tudo abaixo depende de decisões ainda **Em aberto** no GDD (§16):

- Arte final e áudio (hoje tudo é provisório, feito em código).
- Névoa de guerra, mais recursos e tipos de unidade, vantagem de defesa.
- Neutros ativos (que andam ou atacam).
- Online: tempo por turno, abandono, notificação de "sua vez", validação no servidor com Cloud Functions, limpeza de salas antigas.
- Save das partidas contra IA e hot-seat (dá para reaproveitar a ideia do online: guardar semente + lista de ações).
- Dificuldades de IA.
