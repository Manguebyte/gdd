# GDD — Evil Enemy Defense

> Documento vivo. Escrito a partir do protótipo web jogável ([abraaovilanova/evil-enemy-defense](https://github.com/abraaovilanova/evil-enemy-defense), Vite + TypeScript + Canvas), que é a referência de comportamento: a Parte 1 descreve o que o protótipo faz hoje e a Parte 2 ensina a reconstruí-lo em Unity.
> O glossário do protótipo (`CONTEXT.md`) e as decisões de arquitetura (`docs/adr/0001` a `0004`) foram incorporados aqui. Os números marcados como **valor inicial** são o balanceamento atual, validado pelos testes automáticos do protótipo, não decisões fechadas.

**Gênero:** autobattler de cerco ("tower defense ao contrário") com meta-progressão · **Dimensão:** 2D, vista lateral · **Plataformas:** Web (protótipo); PC e WebGL no port Unity · **Engine do port:** Unity 6

## Índice

**Parte 1 — GDD**
1. [Visão Geral](#1-visão-geral)
2. [Glossário](#2-glossário)
3. [Loop Principal](#3-loop-principal)
4. [O Campo e a Run](#4-o-campo-e-a-run)
5. [Tipos de Unidade](#5-tipos-de-unidade)
6. [Formas de Defensor](#6-formas-de-defensor)
7. [Estágios](#7-estágios)
8. [Moedas](#8-moedas)
9. [Meta-progressão](#9-meta-progressão)
10. [Estilo Visual](#10-estilo-visual)
11. [Interface e Controles](#11-interface-e-controles)
12. [Áudio](#12-áudio)
13. [Persistência](#13-persistência)
14. [Decisões registradas](#14-decisões-registradas)
15. [Escopo do MVP](#15-escopo-do-mvp)
16. [Em aberto](#16-em-aberto)

**Parte 2 — Guia de Implementação Unity**
- [Convenções, arquitetura e fases](#parte-2--guia-de-implementação-unity)
- Partes 3 a 10: Fases 0 a 7 (setup → testes automáticos → build)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Pitch:** inverta o tower defense. A fortaleza é do inimigo e a onda é você. Monte um Exército, divida-o entre as duas entradas do campo e assista à sua coluna marchar contra a Guarnição: goblins, orcs, ursos, trolls, torres e, no fim, o Castelo. Perdeu? As Moedas do dano que você causou ficam. Suba de nível, desbloqueie tipos novos, tente de novo.
- **Gênero — Definido:** autobattler de cerco com meta-progressão entre partidas.
- **Dimensão — Definido:** 2D, campo de batalha visto de lado (eixo horizontal único).
- **Câmera — Definido:** fixa, enquadrando o campo inteiro com as duas Entradas visíveis.
- **Plataformas — Definido:** Web (o protótipo atual). **Em aberto:** quais plataformas o port Unity mira além de PC e WebGL (ver §16).
- **Pilares de design — Definido:**
  1. **Toda decisão acontece antes da batalha.** A Run é automática. O jogo está na montagem do Exército (quais tipos, quantos, por qual lado) e na loja.
  2. **Construção e criatura jogam diferente, não só parecem diferentes.** A Armadura faz tiro fraco e rápido ricochetear em prédio; criaturas andam e fecham o cerco.
  3. **Perder também paga.** Toda Run rende Moedas pelo que conseguiu fazer, então nenhuma tentativa é desperdício.
- **Fantasia central:** ser o general do lado "malvado" de um tower defense, vendo sua horda cercar uma fortaleza cada vez maior.
- **Referências:** tower defense clássico (Kingdom Rush) visto do outro lado; autobattlers de montagem (The Battle Cats, Super Auto Pets); menus de Final Fantasy 1/2 no NES para a interface.

## 2. Glossário

Termos de domínio do jogo. O identificador usado em código vem entre crases e é o mesmo no protótipo e no port Unity.

| Termo | Código | Significado |
|---|---|---|
| **Run** | `Run` | Uma única batalha do Exército contra a Guarnição de um Estágio. Termina em vitória (Guarnição inteira destruída) ou derrota (Exército inteiro morto). É automática: nenhuma decisão do jogador durante ela. Não é uma sequência de batalhas. |
| **Estágio** | `Stage` | Um encontro fixo e nomeado com uma Guarnição específica. Os Estágios formam uma escada (1, 2, 3…), podem ser rejogados para farmar Moedas, e vencer alguns libera um Tipo de Unidade novo na loja. |
| **Guarnição** | `Garrison` | Os Defensores de um Estágio (até cinco). A construção principal fica no centro do campo; o resto se espalha para os dois lados dela. |
| **Defensor** | `Defender` | Um inimigo a destruir: tem Forma, HP, Armadura, Armas e posição no campo. |
| **Forma** | `Form` | O que um Defensor é (Goblin, Torre, Castelo…). Define HP, Armadura, Armas e se ele **anda** (criatura) ou é fixo (construção). |
| **Arma** | `Weapon` | Um sistema de ataque do Defensor, com dano, cadência, alcance e Regra de Alvo próprios. Uma Forma tem uma ou mais Armas. |
| **Regra de Alvo** | `TargetingRule` | Como uma Arma escolhe quem atingir: o mais próximo, o de menor HP, ou uma área. É o principal contrapeso à composição do Exército. |
| **Exército** | `Army` | As Unidades que o jogador leva para uma Run. Remontado livremente a cada Run. |
| **Unidade** | `Unit` | Um atacante individual. Unidades não são persistentes nem distinguíveis entre Runs. |
| **Tipo de Unidade** | `UnitType` | Uma classe de atacante (Guerreiro, Arqueiro…). O jogador **desbloqueia** tipos e sobe o **nível** deles. Não existe estoque de Unidades: o único limite de quantidade é a Capacidade. |
| **Capacidade** | `capacity` | Quantas Unidades cabem no Exército de uma Run. |
| **Entrada** | `side` | O lado do campo por onde uma parte do Exército entra: esquerda ou direita. |
| **Avanço** | `Advance` | A marcha das Unidades rumo ao centro, sob fogo. Uma Unidade nunca recua. |
| **Alcance** | `range` | Distância a partir da qual uma Unidade (ou Arma) consegue atacar. |
| **Armadura** | `armor` | Redução fixa de dano por golpe recebido, dos dois lados: `max(1, dano − armadura)`. |
| **Moeda** | `Coins` | Recompensa de uma Run, gasta na Meta-progressão. |
| **Meta-progressão** | `Progression` | Melhorias permanentes compradas entre Runs: níveis, desbloqueios e Capacidade. |
| **Primeira Vitória** | — | A primeira vez que um Estágio é vencido paga um bônus extra; repetições pagam menos, para que farmar não domine o loop. |
| **Derrota parcial** | — | Perder ainda rende Moedas pelo dano causado e pelo tempo sobrevivido. |

## 3. Loop Principal

```
 Seleção de Estágio ──► Montagem do Exército ──► Run (automática) ──► Resumo de Moedas
        ▲   │             (tipos, quantidades,      (assistir; x1/x3)        │
        │   ▼              Entrada de cada parcela)                          │
        │  Loja (níveis, desbloqueios, Capacidade) ◄─────────────────────────┘
        └──────────────────────────────────────────────────────────────────┘
```

- **Definido:** uma sessão é uma sequência de Runs avulsas. Não há "campanha" com estado entre batalhas além da Meta-progressão.
- **Definido:** o Exército é remontado a cada Run; Unidades mortas não são perdidas. A última composição usada fica lembrada para a próxima montagem.
- **Definido:** o Estágio 1 sempre está aberto; cada Estágio seguinte abre quando o anterior é vencido.

## 4. O Campo e a Run

### 4.1 Geometria — Definido

- O campo é um **eixo horizontal contínuo** (não há faixas nem grade). A construção principal da Guarnição fica em `x = 0`.
- As duas Entradas ficam em `x = −175` (esquerda) e `x = +175` (direita) — `ENTRY_X = 175` **valor inicial**.
- Unidades da mesma Entrada nascem em fila: a n-ésima nasce em `lado × (175 + n × 5)`, para a coluna não nascer empilhada.
- A Guarnição tem posições fixas por Estágio (§7). O que estiver do lado oposto ao da sua coluna começa **atrás** dela.

### 4.2 Simulação — Definido

- A simulação roda num **passo fixo de 20 ticks por segundo**, independente da taxa de quadros. O render só lê o estado.
- É **determinística**: o mesmo Estágio com o mesmo Exército produz sempre o mesmo resultado. Nada de número aleatório nem relógio dentro da simulação. Isso permite testar balanceamento automaticamente e, no futuro, pular a animação.
- Ordem de cada tick:
  1. **Defensores agem.** Cada Arma desconta seu cooldown; se chegou a zero e há alguém no seu alcance, dispara (pode disparar mais de uma vez no mesmo tick se o cooldown ficou muito negativo). Sem alvo, a Arma fica pronta e **não acumula** disparos. Uma **criatura** sem nenhuma Unidade no alcance de nenhuma Arma caminha na direção da Unidade viva mais próxima; **construções** (velocidade 0) nunca saem do lugar.
  2. **Unidades mortas saem do campo.**
  3. **Unidades agem.** Com algum Defensor no Alcance, a Unidade para e ataca o **Defensor vivo mais próximo, de qualquer lado** (inclusive um que a persegue por trás). Sem ninguém no Alcance, ela **avança rumo ao centro**: mira o Defensor mais próximo *à frente*; só encara quem ficou para trás quando não sobra ninguém à frente. Ela para exatamente no limite do próprio Alcance.
  4. **Defensores mortos saem do campo.**
  5. **Fim de Run:** Guarnição vazia = vitória; Exército vazio = derrota.
- **Uma Unidade nunca recua.** Perseguir a ameaça mais próxima em qualquer direção faria a coluna oscilar entre duas ameaças, e o jogador não conseguiria explicar o que viu.
- **Empates** (dois alvos à mesma distância, mesmo HP) são resolvidos pelo menor id, para manter o determinismo.
- **Sem tempo-limite de design.** O relógio natural da Run é a Guarnição do lado oposto fechando o cerco. Existe só uma trava técnica de 10 minutos simulados (12.000 ticks), que conta como derrota.

### 4.3 Dano e Armadura — Definido

- Todo golpe, dos dois lados, tira `max(1, dano − armadura)` de HP. Armadura nunca dá imunidade: o golpe mínimo vale 1.
- **Construções** têm Armadura alta e HP moderado; **criaturas**, o contrário. Contra prédio, muitos tiros fracos quase não passam; é aí que entra o Bombardeiro.

### 4.4 Regras de Alvo — Definido

| Regra | Código | Escolhe |
|---|---|---|
| Mais próximo | `foremost` | A Unidade mais perto **daquele Defensor** |
| Menor HP | `lowestHp` | A Unidade no alcance com menos HP atual |
| Área | `area` (raio) | Todas as Unidades a até `raio` da Unidade mais próxima |

Unidades não têm Regra de Alvo: sempre atacam o Defensor mais próximo.

## 5. Tipos de Unidade

Seis tipos. Os três últimos só aparecem na loja depois do Estágio indicado: seis opções de cara seriam um muro de escolhas sem informação para decidir. **Valores iniciais.**

| Tipo | Código | HP | Dano | Armadura | Ataque a cada | Alcance | Velocidade | Desbloqueio | Papel |
|---|---|---|---|---|---|---|---|---|---|
| Guerreiro | `warrior` | 70 | 9 | 3 | 1,0 s | 8 | 22 | inicial | Linha de frente; a Armadura faz tiro fraco ricochetear |
| Arqueiro | `archer` | 25 | 6 | 0 | 0,8 s | 60 | 26 | 120 Moedas | Dano de longe, frágil |
| Bombardeiro | `bomber` | 40 | 34 | 1 | 3,5 s | 110 | 14 | 400 Moedas | Cerco: a resposta à Armadura |
| Peão | `pawn` | 34 | 6 | 0 | 0,7 s | 8 | 34 | 200, após *Ninho dos Lagartos* | Enxame barato que ocupa a mira das Armas de alvo único |
| Lanceiro | `lancer` | 60 | 16 | 2 | 1,3 s | 28 | 24 | 650, após *Toca do Urso* | Meio-termo resistente, alcance curto |
| Ladino | `thief` | 30 | 14 | 0 | 0,45 s | 10 | 42 | 1200, após *Forte de Madeira* | Chega antes de todos e bate muito, se sobreviver |

- **Nível — Definido:** cada nível multiplica HP e dano por `1 + 0,25 × (nível − 1)` (arredondado). Armadura, alcance, velocidade e cadência não mudam com o nível.
- Unidades de domínio: distâncias e velocidades estão em "unidades do campo" (a Entrada fica a 175 do centro).

## 6. Formas de Defensor

Leitura dos números: **criatura** tem HP alto, Armadura baixa e anda; **construção** tem Armadura alta, HP moderado e é fixa (velocidade 0). **Valores iniciais.**

| Forma | Código | HP | Arm. | Vel. | Armas (dano / intervalo / alcance / regra) |
|---|---|---|---|---|---|
| Goblin | `goblin` | 800 | 0 | 18 | adaga 20 / 1 s / 14 / mais próximo |
| Orc Grande | `great-orc` | 950 | 2 | 15 | machado 30 / 1 s / 20 / mais próximo · lança 14 / 1,5 s / 85 / menor HP |
| Lagarto Cuspidor | `lizard` | 820 | 1 | 20 | cuspe 20 / 1,4 s / 105 / área r14 |
| Urso | `bear` | 2400 | 5 | 26 | garras 52 / 0,8 s / 22 / mais próximo · patada 38 / 2,4 s / 26 / área r20 |
| Minotauro | `minotaur` | 2600 | 7 | 19 | machadão 68 / 1,3 s / 28 / área r22 · investida 30 / 3 s / 70 / menor HP |
| Troll | `troll` | 2800 | 6 | 12 | clava 120 / 2,2 s / 32 / área r22 |
| Torre de Madeira | `wood-tower` | 1900 | 6 | 0 | besteiros 17 / 0,7 s / 120 / mais próximo · óleo 26 / 2,6 s / 70 / área r22 |
| Torre de Vigia | `tower` | 2800 | 9 | 0 | arqueiros 16 / 0,6 s / 150 / mais próximo · canhão 40 / 2 s / 170 / área r30 |
| Torre Azul | `tower-blue` | 2500 | 11 | 0 | arqueiros 15 / 0,55 s / 160 / menor HP · canhão 45 / 2,2 s / 180 / área r26 |
| Torre Sombria | `tower-purple` | 2700 | 13 | 0 | arqueiros 15 / 0,5 s / 170 / mais próximo · canhão 48 / 2 s / 190 / área r28 |
| Castelo | `castle` | 2600 | 14 | 0 | muralha 13 / 0,45 s / 190 / mais próximo · balista 42 / 1,8 s / 210 / menor HP · canhões 42 / 2,4 s / 200 / área r30 |

## 7. Estágios

A escada vai de uma criatura solta até cinco membros com construção no centro; a progressão de Formas vai de criatura para construção. Posições: `0` é o centro, negativo é o lado esquerdo. **Valores iniciais.**

| # | Estágio | Código | Guarnição (Forma @ x) | Base | 1ª vitória |
|---|---|---|---|---|---|
| 1 | Acampamento Goblin | `goblin-camp` | goblin @0 | 40 | 60 |
| 2 | Forte dos Orcs | `orc-warcamp` | great-orc @0 · goblin @−55 | 70 | 110 |
| 3 | Ninho dos Lagartos | `lizard-nest` | lizard @0 · goblin @60 · goblin @−60 | 105 | 170 |
| 4 | Posto de Madeira | `wood-outpost` | wood-tower @0 · great-orc @−50 · goblin @55 | 150 | 240 |
| 5 | Toca do Urso | `bear-den` | bear @0 · lizard @65 · goblin @−70 | 200 | 320 |
| 6 | Labirinto do Minotauro | `minotaur-maze` | minotaur @0 · lizard @−60 · great-orc @65 | 270 | 430 |
| 7 | Forte de Madeira | `wood-fort` | wood-tower @0 · wood-tower @−55 · bear @60 · great-orc @−105 | 350 | 560 |
| 8 | Ponte do Troll | `troll-bridge` | troll @0 · bear @−65 · lizard @70 | 450 | 720 |
| 9 | Torre de Vigia | `watchtower` | tower @0 · minotaur @60 · wood-tower @−60 · lizard @−110 | 580 | 930 |
| 10 | Torres Gêmeas | `twin-towers` | tower-blue @0 · tower @−60 · troll @65 · bear @−110 | 740 | 1180 |
| 11 | Fortaleza Sombria | `dark-fortress` | tower-purple @0 · tower-blue @−60 · minotaur @60 · troll @−115 · lizard @115 | 950 | 1520 |
| 12 | O Castelo | `castle` | castle @0 · tower-purple @−70 · tower-blue @70 · troll @−120 · minotaur @120 | 1250 | 2000 |

**Metas de balanceamento — Definido** (verificadas por testes automáticos, ver Fase 6 do guia):
- O Estágio 1 é vencível com o Exército inicial (6 Guerreiros) **se ele for concentrado numa Entrada**, e perdido se for dividido 3+3. A primeira Run ensina a mecânica das Entradas.
- Do Estágio 2 em diante o Exército inicial não passa.
- Uma Run vencida por um Exército forte dura entre 4 e 90 segundos.
- Um jogador "ganancioso" (gasta sempre na compra mais barata, divide o Exército sem pensar) chega ao Estágio 10 em mais de 4 e menos de 220 Runs.
- Os Estágios 11 e 12 são **muro de composição, não de grind**: nem o Exército no teto vence com uma divisão ingênua.

## 8. Moedas

Moedas de uma Run = **dano + tempo + sobreviventes + vitória**. Todas as parcelas são frações da recompensa base do Estágio, então o total parcial aparece no HUD **durante** a Run e não muda de significado no fim. **Valores iniciais.**

| Parcela | Fórmula |
|---|---|
| Dano | `base × 1,0 × fração do HP da Guarnição destruída` |
| Tempo (vitória) — rapidez | `base × 0,5 × max(0, 1 − segundos / 60)` |
| Tempo (derrota) — resistência | `base × min(0,35; 0,006 × segundos)` |
| Sobreviventes | `base × 0,3 × (vivos no fim / Unidades que entraram)` |
| Vitória | `base × 0,5` + bônus de Primeira Vitória (só na primeira) |

- **Definido:** cada parcela é arredondada separadamente; o total é a soma.
- **Definido:** a parcela de tempo troca de sentido com o desfecho: vencer rápido paga mais; perder devagar paga mais.
- **Definido:** o contador ao vivo nunca conta a parcela de vitória antes da hora.

## 9. Meta-progressão

| Compra | Custo | Teto |
|---|---|---|
| Desbloquear Tipo | fixo por tipo (§5) | — |
| Subir nível de um Tipo | `30 × 1,48^(nível atual − 1)` | nível 20 |
| +1 de Capacidade | `50 × 1,15^(Capacidade atual − 6)` | 40 |

- Estado inicial: 0 Moedas, Guerreiro nível 1, Capacidade 6, nenhum Estágio vencido.
- **Definido:** uma compra inválida (sem Moedas, no teto, já desbloqueado, tipo ainda trancado por Estágio) simplesmente não acontece e o item aparece desabilitado na loja.
- **Definido:** tipo ainda trancado por Estágio nem aparece na loja.

## 10. Estilo Visual

- **Definido:** pixel art do pack **Tiny Swords** (Pixel Frog): cavaleiros do jogador (Guerreiro, Arqueiro, Bombardeiro, Peão) dos sheets de facção, criaturas do *Enemy Pack* (Gnoll faz o Orc Grande; Lagarto, Urso, Minotauro, Troll), torres e castelo das construções.
- **Definido:** resolução interna **320×180**, ampliada em escala inteira com filtro de pixel (sem suavização).
- **Definido:** céu azul liso, chão verde com uma linha escura no horizonte. Os Defensores maiores são desenhados primeiro, para o castelo não cobrir as criaturas à frente dele.
- **Definido:** as Unidades se espalham em 5 "profundidades" derivadas do id, para a coluna não virar uma fila de um pixel, e cada uma tem a animação deslocada no tempo para não andarem em passo sincronizado.
- **Definido:** quem leva dano pisca em vermelho por 140 ms. A animação de ataque de um Defensor é **segurada** pela duração inteira dela a cada disparo (senão ela piscaria entre parado e ataque).
- **Definido:** Unidades vindas da direita aparecem espelhadas; criaturas encaram a Unidade mais próxima; construções nunca viram.

## 11. Interface e Controles

- **Definido:** toda a interface (seleção de Estágio, loja, montagem, resumo) imita os menus de **Final Fantasy 1/2 do NES**: fundo azul `#0000A8`, moldura branca dupla, texto branco/cinza, cursor "▶".
- **Definido:** **teclado é a interface primária** (setas movem, Enter confirma, Esc volta, ◀ ▶ ajustam valores); o mouse funciona por apontar e clicar sobre as linhas.
- Telas:
  - **Seleção de Estágio:** lista dos 12 Estágios (nome, "NOVO"/"LIMPO"/"TRANCADO"; trancado aparece como "? ? ?") e a entrada **LOJA** com o saldo.
  - **Loja:** uma linha por tipo disponível (desbloquear, ou subir de N para N+1 com o preço; "MAX" no teto), uma linha de Capacidade e VOLTAR.
  - **Montagem do Exército:** uma linha por tipo desbloqueado **e por Entrada** (`ESQ GUE N3 < 4 >`), INICIAR RUN (desabilitado com Exército vazio) e VOLTAR. Contador `usado/Capacidade` no topo. Painel lateral com os atributos do tipo sob o cursor e a Guarnição do Estágio contada por lado (ESQ/DIR), nome da construção central e total.
  - **Batalha:** nome do Estágio, inimigos restantes, tempo, velocidade (x1/x3, tecla Espaço), Moedas ao vivo e um contador do Exército por tipo (`GUE 4  ARQ 3`). Barra de HP sobre cada Defensor e sobre Unidades feridas.
  - **Resumo:** VITÓRIA/DERROTA, as quatro parcelas, o total e "ENTER CONTINUA".
- **Ferramenta de dev — Definido:** a tecla V abre um inspetor de sprites (mostra cada linha dos spritesheets). Fica só em builds de desenvolvimento.

## 12. Áudio

**Em aberto:** o protótipo não tem som. Proposta mínima: um tema de menu chiptune, golpes, disparo de canhão, queda de Defensor, fanfarra de vitória/derrota.

## 13. Persistência

- **Definido:** save local único (`eed.save.v1`) com Moedas, níveis dos tipos, Capacidade e Estágios vencidos. Sem backend e sem conta.
- **Definido:** save corrompido ou ilegível vira jogo novo, sem mensagem de erro; falha ao gravar (modo privado, cota cheia) não interrompe o jogo.

## 14. Decisões registradas

Resumo dos ADRs do protótipo, que valem também para o port:

| ADR | Decisão | Alternativa rejeitada | Consequência |
|---|---|---|---|
| 0001 | Campo contínuo com simulação em tick fixo, separado do render | Campo discreto em faixas | Estado serializável, sem relógio nem aleatório não-semeado |
| 0002 | Interface desenhada no mesmo visual da batalha (estilo FF NES) | HTML/CSS (no port: UI genérica da engine) | Teclado como interface primária; listas, rolagem e cursor feitos à mão |
| 0003 | Run totalmente automática | Deixar o jogador escolher quando mandar cada leva | Resultado decidido quando a Run começa; se assistir não divertir, a solução é leitura visual e ritmo, não interação |
| 0004 | Guarnição de até 5 Defensores, campo com duas Entradas | Defensor único com variedade só nos números | Criaturas andam, Unidades nunca recuam, Armadura dos dois lados |

## 15. Escopo do MVP

**Dentro:** os 12 Estágios, os 6 Tipos de Unidade, as 11 Formas, Moedas, loja, montagem com duas Entradas, velocidade x1/x3, save local, menus no estilo FF.

**Fora (pós-MVP):** áudio, pular a animação da Run (o determinismo já permite), mais Estágios depois do Castelo, conquistas, controles por toque pensados para celular.

## 16. Em aberto

1. **Assistir é divertido?** O risco apontado no ADR 0003. Se não for, as alavancas são leitura visual (efeitos de disparo, projéteis, números de dano) e ritmo (velocidade, pular Run), não interação durante a Run.
2. **Plataformas do port:** PC e WebGL são o alvo do guia. Mobile exige repensar a montagem (ajustar quantidades com toque) e o tamanho do texto em 320×180.
3. **Pular a animação:** como apresentar o resultado de uma Run simulada instantaneamente.
4. **Depois do Castelo:** novos Estágios, prestígio, modo infinito?
5. **Áudio** (§12).
6. **Projéteis visíveis:** hoje o dano é instantâneo e só o piscar indica quem apanhou.
7. **Linhas dos sheets dos cavaleiros:** o protótipo supõe o layout padrão do pack (linha 0 parado, 1 andando, 2 atacando) e oferece o inspetor de sprites para conferir.

---

# Parte 2 — Guia de Implementação Unity

Este guia reconstrói o Evil Enemy Defense em Unity 6, do projeto vazio até as builds de PC e WebGL. O protótipo web é a especificação: as regras da simulação, as fórmulas de Moedas e as compras são portadas **uma a uma**, e os testes automáticos do protótipo viram testes da Unity (Fase 6). Onde a Parte 1 diz **Em aberto**, o guia fica com o comportamento do protótipo e avisa.

## Como usar este guia

O guia foi escrito para quem está aprendendo Unity. Cada fase segue o mesmo formato:

- **Conceitos novos:** o que a fase usa pela primeira vez, explicado antes de aparecer.
- **Etapas** pequenas (2A, 2B, ...), cada uma terminando num **🧪 Teste rápido** no Play Mode. Se o teste falhar, o problema está só naquela etapa.
- **Passos no Editor clique a clique:** menus no formato **Menu → Submenu → Item**, campos do Inspector em **negrito** e valores em `código`.
- **✅ Checkpoint** no fim da fase e **Problemas comuns** com os erros mais prováveis.

Todo script do guia é **completo**: crie o arquivo, apague o conteúdo que a Unity gerou e cole o código inteiro. Os comentários dentro do código explicam **por que** cada classe existe e **como** ela funciona; leia-os, eles são parte do guia.

### Duas operações que se repetem no guia inteiro

**Criar um script C#:**
1. Na janela **Project**, entre na pasta indicada no comentário `// Caminho:` do script.
2. Botão direito no espaço vazio da pasta → **Create → Scripting → Empty C# Script** (em versões anteriores ao Unity 6: **Create → C# Script**).
3. Digite o nome **exatamente igual ao nome da classe** e aperte Enter. Arquivo e classe com nomes diferentes impedem a Unity de usar o script como componente.
4. Dê duplo clique no arquivo, apague tudo, cole o script do guia e salve (**Ctrl+S**).
5. Volte à Unity, espere a compilação (ícone girando no canto inferior direito) e confira o **Console** (**Window → General → Console**): nenhum erro em vermelho.

**Ligar um campo no Inspector:** campos `[SerializeField]` aparecem no Inspector com o nome "humanizado" (`_unitPrefab` vira **Unit Prefab**). Arraste o objeto da **Hierarchy** ou o asset da **Project** para o campo, ou clique no círculo ⊙ ao lado dele e escolha na lista.

## Convenções

- **Nomes no projeto em inglês** (scripts, classes, GameObjects, assets); **comentários em português**. Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele.
- **Os ids do protótipo continuam iguais** (`warrior`, `great-orc`, `goblin-camp`...). Eles aparecem no save e nos testes.
- **Namespaces:**
  - `EvilEnemyDefense.Data`: ScriptableObjects e enums.
  - `EvilEnemyDefense.Sim`: a simulação da Run, em C# puro.
  - `EvilEnemyDefense.Game`: Moedas, progressão, save e o fluxo entre telas.
  - `EvilEnemyDefense.View`: o que desenha a batalha.
  - `EvilEnemyDefense.UI`: menus.
  - `EvilEnemyDefense.EditorTools`: ferramentas do Editor.
  - `EvilEnemyDefense.Tests`: testes automáticos.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Unidades de medida:** no mundo da Unity, **1 unidade = 1 unidade de domínio do protótipo**. A Entrada fica em `x = ±175` e o chão em `y = 0`. Isso deixa todos os números da Parte 1 valendo sem conversão.

## Arquitetura em uma página

```
 Dados (ScriptableObjects)          Regras (C# puro)                    Tela (MonoBehaviours)
 ─────────────────────────          ────────────────                    ─────────────────────
 GameBalance ──────────────┐        BattleSimulation ── BattleState     BattleRunner (tick fixo)
 UnitTypeDefinition ───────┼──────►   (Create, Step, Result)            BattleView ── UnitView, DefenderView
 DefenderFormDefinition ───┤        CoinCalculator                      BattleHud
 StageDefinition ──────────┤        Progression ── PlayerState          GameSession (fluxo entre telas)
 GameDatabase ─────────────┘        SaveService (PlayerPrefs)           MenuList/MenuRow + 4 telas
 VisualCatalog, SpriteAnimation ───────────────────────────────────────► (só a parte visual lê)
```

- **Regra de ouro:** a simulação e as regras de progressão moram em classes C# comuns, sem `MonoBehaviour` e sem nada da cena. A tela só lê o estado e chama métodos. É o que permite rodar Runs inteiras num teste automático, em milissegundos, como o protótipo faz.
- **Por que não usar física (`Rigidbody2D`)?** O campo é um eixo só. A posição de uma Unidade é um número (`X`). Física traria colisões que o design não tem e quebraria o determinismo exigido pelo ADR 0001. Por isso nenhuma fase usa Rigidbody, e este guia não tem a nota `rb.linearVelocity`/`rb.velocity`.
- **Por que `double` na simulação?** O `number` do JavaScript é `double`. Usar `double` nas posições, cooldowns e distâncias mantém o resultado de cada Run igual ao do protótipo, e os testes de balanceamento calibrados lá continuam valendo aqui.

## Mapa de sistemas

| Namespace | Script | Responsabilidade | Fase |
|---|---|---|---|
| `Data` | `Enums`, `MathUtil`, `GameBalance` | Enums, arredondamento igual ao do JS, números do jogo | 1 |
| `Data` | `UnitTypeDefinition`, `DefenderFormDefinition`, `StageDefinition`, `GameDatabase` | Tipos, Formas, Estágios e o índice de tudo | 1 |
| `EditorTools` | `GameDataSeeder` | Cria os 29 assets da Parte 1 com um clique | 1 |
| `Sim` | `BattleTypes`, `BattleSimulation` | A Run: criação, tick, resultado | 2 |
| `Game` | `BattleRunner`, `BattleTestStarter` | Tick fixo na cena; Run de teste (desativada na Fase 5) | 2 |
| `Game` | `CoinCalculator`, `PlayerState`, `Progression`, `SaveService` | Moedas, compras e save | 3 |
| `Data` | `SpriteAnimation`, `VisualCatalog` | Animações e aparência por Tipo/Forma | 4 |
| `EditorTools` | `SpriteAnimationMaker` | Cria animações a partir de sprites selecionados | 4 |
| `View` | `SpriteAnimPlayer`, `HpBar`, `UnitView`, `DefenderView`, `BattleView`, `BattleHud` | A batalha na tela | 4 |
| `UI` | `MenuItem`, `MenuRow`, `MenuList` | O menu estilo FF com cursor | 5 |
| `Game`/`UI` | `GameSession`, `StageSelectScreen`, `ShopScreen`, `ArmyBuilderScreen`, `BattleScreen` | Telas e fluxo | 5 |
| `EditorTools` | `FfWindowSpriteMaker` | Gera o sprite da janela azul | 5 |
| `Tests` | `TestData` e 4 classes de teste | Testes automáticos em Edit Mode | 6 |

## Fases

| Fase | Parte | Conteúdo | Etapas |
|---|---|---|---|
| 0 | 3 | Setup do projeto | 0A Unity · 0B projeto e Git · 0C pastas e cena |
| 1 | 4 | Dados | 1A tipos base · 1B definições · 1C dados iniciais |
| 2 | 5 | Simulação da Run | 2A estado · 2B tick · 2C Run de teste com Gizmos |
| 3 | 6 | Moedas, progressão e save | 3A Moedas · 3B progressão · 3C save |
| 4 | 7 | A batalha na tela | 4A sprites · 4B animação · 4C views · 4D HUD |
| 5 | 8 | Menus estilo FF e fluxo | 5A visual FF · 5B menu com cursor · 5C telas · 5D fluxo completo |
| 6 | 9 | Testes automáticos | 6A assemblies · 6B testes · 6C rodar |
| 7 | 10 | Build e próximos passos | — |

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, versionado no Git, com as pastas e a cena que o resto do guia usa.

**Conceitos novos:**
- **Unity Hub:** o programa que instala versões da Unity (o "Editor") e abre projetos. Cada versão tem **módulos** de plataforma; sem o módulo Web, por exemplo, a Unity não gera build WebGL.
- **LTS (Long Term Support):** versão que recebe correções por mais tempo. Use sempre uma LTS.
- **Template Universal 2D:** projeto inicial com o **URP** (Universal Render Pipeline) em modo 2D: câmera ortográfica e materiais de sprite prontos.
- **As janelas do Editor:** **Hierarchy** (objetos da cena aberta), **Scene** (vista de edição), **Game** (o que o jogador vê), **Inspector** (propriedades do selecionado), **Project** (arquivos da pasta `Assets/`), **Console** (mensagens e erros). Se alguma sumir, reabra em **Window → General**.
- **GameObject e componente:** tudo na cena é um GameObject. O que ele faz vem dos **componentes** presos a ele (um `SpriteRenderer` desenha uma imagem; seus scripts também são componentes).
- **Play Mode:** o botão ▶ roda o jogo dentro do Editor. ⚠️ **Tudo o que você mudar na cena durante o Play é desfeito ao sair do Play.**
- **Git LFS:** extensão do Git para guardar arquivos binários grandes (imagens) fora do histórico normal.

### Etapa 0A — Instalar a Unity

1. Instale o **Unity Hub** (unity.com/download) e entre com sua conta Unity.
2. No Hub: **Installs → Install Editor** → aba **Official releases** → a versão **Unity 6** mais recente marcada **LTS** (`6000.x`) → **Install**.
3. Marque os módulos **Microsoft Visual Studio Community** (se ainda não tiver editor de código), **Web Build Support** e **Windows Build Support (IL2CPP)**. **Install**.

### Etapa 0B — Criar o projeto e o repositório

1. No Hub: **Projects → New project** → template **Universal 2D** → **Project name** = `EvilEnemyDefense` → **Create project**.
2. **Edit → Preferences → External Tools → External Script Editor** = o seu editor de código.
3. Num terminal (PowerShell) **na pasta do projeto** (a que contém `Assets/`):

   ```powershell
   git init
   curl.exe -L https://raw.githubusercontent.com/github/gitignore/main/Unity.gitignore -o .gitignore
   git lfs install
   git lfs track "*.png" "*.ttf" "*.otf" "*.wav" "*.ogg"
   ```

4. Acrescente uma linha `Builds/` no fim do `.gitignore`.
5. **Edit → Project Settings → Editor**: **Version Control → Mode** = `Visible Meta Files`; **Asset Serialization → Mode** = `Force Text`.
6. Primeiro commit:

   ```powershell
   git add .
   git commit -m "chore: projeto Unity vazio"
   ```

> **Pacotes:** o template já traz **uGUI** (que no Unity 6 inclui o **TextMeshPro**), **Input System**, **2D Sprite** e **Test Framework**. Nada a instalar.

### Etapa 0C — Pastas e cena

1. Na **Project**, botão direito em `Assets` → **Create → Folder** → `_Project` (o sublinhado deixa a pasta no topo).
2. Dentro dela, crie:

   ```
   Assets/_Project/
     Art/
       Sprites/
       Fonts/
     Data/
       Anims/
     Prefabs/
     Scenes/
     Scripts/
       Data/
       Sim/
       Game/
       View/
       UI/
       Editor/
   ```

3. Arraste `Assets/Scenes/SampleScene` para `_Project/Scenes/`, selecione e aperte **F2** → renomeie para `Main`. Duplo clique para abrir.

> **Por que a pasta se chama `Editor`?** A Unity trata qualquer pasta chamada `Editor` como "só do Editor": scripts dali usam a API `UnityEditor`, funcionam dentro da Unity e ficam fora da build do jogo. As ferramentas de criação de assets deste guia moram lá.

### 🧪 Teste rápido
Aperte ▶. A Game view mostra um fundo vazio e o Console não tem erros.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros e tem a estrutura de pastas acima e a cena `Main`.
- `git status` não lista `Library/` nem `Temp/`.

#### Problemas comuns
- **Template Universal 2D não aparece:** atualize o Hub e use a busca da lista de templates.
- **Duplo clique no script abre o Bloco de Notas:** falta o passo 2 da Etapa 0B.

---

# Parte 4 — Implementação Unity: Fase 1 (Dados)

## Fase 1 — Dados

> Objetivo desta fase: os Tipos de Unidade, as Formas de Defensor e os Estágios da Parte 1 (§5 a §7) viram assets editáveis no Inspector, criados de uma vez por uma ferramenta do Editor.

**Conceitos novos:**
- **ScriptableObject:** uma classe cujas instâncias são **arquivos de dados** no projeto (`.asset`), não objetos de cena. É o lugar certo para números de balanceamento e definições.
- **`[CreateAssetMenu]`:** cria um item no menu **Create** da Project para gerar assets daquela classe.
- **`namespace`:** "sobrenome" das classes. Quem usa uma classe de outro namespace escreve `using EvilEnemyDefense.Data;` no topo.
- **`[Serializable]`:** deixa a Unity salvar e mostrar uma classe comum dentro de outro objeto (vira uma "gaveta" no Inspector).
- **`[Header]`, `[Tooltip]`:** só mudam a aparência no Inspector.
- **`[MenuItem]`:** cria um item na barra de menus do Editor que chama um método seu. Só funciona em scripts da pasta `Editor`.
- **`AssetDatabase`:** a API do Editor para criar, carregar e salvar assets por código.

### Etapa 1A — Tipos base

Crie os três scripts em `Assets/_Project/Scripts/Data/`.

```csharp
// Caminho: Assets/_Project/Scripts/Data/Enums.cs
namespace EvilEnemyDefense.Data
{
    // POR QUE: a Entrada (ADR 0004) é um dos dois lados do campo. O valor
    // numérico do enum é o sinal do lado (-1 esquerda, +1 direita), igual ao
    // `Side` do protótipo: posição de nascimento = lado × distância.
    // ESTRATÉGIA: converta com `(int)side` quando precisar do sinal.
    public enum Side
    {
        Left = -1,
        Right = 1,
    }

    // POR QUE: as três Regras de Alvo da Parte 1 §4.4. Um enum impede
    // erros de digitação que uma string ("lowesthp") deixaria passar.
    // ESTRATÉGIA: a Regra de Área usa também o raio guardado na Arma.
    public enum TargetingKind
    {
        Foremost,
        LowestHp,
        Area,
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/MathUtil.cs
using System;

namespace EvilEnemyDefense.Data
{
    // POR QUE: o protótipo arredonda com `Math.round` do JavaScript, que leva
    // 0,5 sempre para cima (2,5 → 3). O `Math.Round` do C# e o
    // `Mathf.RoundToInt` da Unity usam "arredondamento bancário" (2,5 → 2).
    // Uma diferença de 1 HP já mudaria o resultado de Runs inteiras.
    // ESTRATÉGIA: um único método usado em todo cálculo que o protótipo arredonda.
    public static class MathUtil
    {
        // Arredonda como o JavaScript: meio para cima.
        public static int RoundHalfUp(double value)
        {
            return (int)Math.Floor(value + 0.5);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameBalance.cs
using UnityEngine;

namespace EvilEnemyDefense.Data
{
    // POR QUE: todos os números "soltos" da Parte 1 (§4, §5, §8 e §9) num
    // único asset. Ajustar balanceamento vira editar o Inspector, sem
    // recompilar nada.
    // ESTRATÉGIA: campos públicos com os valores iniciais já preenchidos; um
    // asset criado do zero já nasce balanceado como o protótipo. Os campos
    // usados pela simulação são `double` (ver "Arquitetura em uma página").
    [CreateAssetMenu(fileName = "GameBalance", menuName = "EED/Game Balance")]
    public class GameBalance : ScriptableObject
    {
        [Header("Campo e simulação")]
        [Tooltip("Distância da Entrada até o centro do campo.")]
        public double entryX = 175;
        [Tooltip("Ticks de simulação por segundo (ADR 0001).")]
        public int ticksPerSecond = 20;
        [Tooltip("Espaço entre Unidades da mesma Entrada ao nascer.")]
        public double spawnGap = 5;
        [Tooltip("Trava de segurança: segundos simulados até virar derrota.")]
        public double maxRunSeconds = 600;

        [Header("Níveis")]
        public double levelGain = 0.25;
        public int maxLevel = 20;
        public double levelCostBase = 30;
        public double levelCostGrowth = 1.48;

        [Header("Capacidade")]
        public int startingCapacity = 6;
        public int maxCapacity = 40;
        public double capacityCostBase = 50;
        public double capacityCostGrowth = 1.15;

        [Header("Moedas (frações da recompensa base do Estágio)")]
        public double damageRate = 1;
        public double speedRate = 0.5;
        public double speedLimitSeconds = 60;
        public double timeRate = 0.006;
        public double timeCap = 0.35;
        public double survivorRate = 0.3;
        public double victoryRate = 0.5;

        // Duração de um tick em segundos (0,05 com 20 ticks/s).
        public double TickSeconds => 1.0 / ticksPerSecond;

        // Quantos ticks cabem na trava de segurança.
        public int MaxTicks => MathUtil.RoundHalfUp(maxRunSeconds * ticksPerSecond);
    }
}
```

### 🧪 Teste rápido
Na Project, botão direito em `Assets/_Project/Data` → **Create → EED → Game Balance**. Um asset `GameBalance` aparece; selecione-o e confira os valores no Inspector. **Apague-o** (a ferramenta da Etapa 1C cria o definitivo).

### Etapa 1B — Definições

Crie os quatro scripts em `Assets/_Project/Scripts/Data/`.

```csharp
// Caminho: Assets/_Project/Scripts/Data/StageDefinition.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace EvilEnemyDefense.Data
{
    // POR QUE: um membro da Guarnição é "uma Forma numa posição" (Parte 1 §7).
    // ESTRATÉGIA: [Serializable] para aparecer como gaveta dentro do Estágio.
    [Serializable]
    public class GarrisonSlot
    {
        public DefenderFormDefinition form;
        [Tooltip("Posição no campo. 0 = centro; negativo = lado esquerdo.")]
        public double x;
    }

    // POR QUE: o Estágio é o encontro fixo da escada (Parte 1 §7): nome,
    // recompensas e a Guarnição.
    // ESTRATÉGIA: só dados. A ordem da escada não fica aqui, e sim na lista
    // `stages` do GameDatabase.
    [CreateAssetMenu(fileName = "Stage", menuName = "EED/Stage")]
    public class StageDefinition : ScriptableObject
    {
        public string id;
        public string displayName;
        [Tooltip("Base de todas as parcelas de Moeda da Run.")]
        public int baseReward;
        [Tooltip("Moedas extras na Primeira Vitória.")]
        public int firstClearBonus;
        public List<GarrisonSlot> garrison = new List<GarrisonSlot>();
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/UnitTypeDefinition.cs
using UnityEngine;

namespace EvilEnemyDefense.Data
{
    // POR QUE: o Tipo de Unidade (Parte 1 §5) é a classe de atacante que o
    // jogador desbloqueia e evolui.
    // ESTRATÉGIA: os valores guardados são os do nível 1; HP e dano de outros
    // níveis saem dos métodos abaixo, com o ganho por nível do GameBalance.
    [CreateAssetMenu(fileName = "UnitType", menuName = "EED/Unit Type")]
    public class UnitTypeDefinition : ScriptableObject
    {
        public string id;
        public string displayName;
        [Tooltip("Sigla de 3 letras para o HUD e para a montagem.")]
        public string shortName;

        [Header("Atributos no nível 1")]
        public int hp;
        public int damage;
        public int armor;
        [Tooltip("Segundos entre ataques.")]
        public double attackInterval = 1;
        public double range;
        [Tooltip("Unidades do campo por segundo durante o Avanço.")]
        public double speed;

        [Header("Loja")]
        [Tooltip("Moedas para desbloquear. 0 = já vem desbloqueado.")]
        public int unlockCost;
        [Tooltip("Só aparece na loja depois deste Estágio ser vencido. Vazio = sempre.")]
        public StageDefinition unlockedByStage;

        // HP de uma Unidade deste tipo no nível dado.
        public int HpAtLevel(int level, double levelGain)
        {
            return MathUtil.RoundHalfUp(hp * (1 + levelGain * (level - 1)));
        }

        // Dano por ataque no nível dado.
        public int DamageAtLevel(int level, double levelGain)
        {
            return MathUtil.RoundHalfUp(damage * (1 + levelGain * (level - 1)));
        }

        // Unity chama OnValidate ao editar o asset: impede um intervalo zero,
        // que faria a simulação atacar infinitas vezes num tick.
        private void OnValidate()
        {
            if (attackInterval < 0.05) attackInterval = 0.05;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/DefenderFormDefinition.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace EvilEnemyDefense.Data
{
    // POR QUE: uma Arma é um sistema de ataque do Defensor (Parte 1 §6), com
    // dano, cadência, alcance e Regra de Alvo próprios.
    // ESTRATÉGIA: [Serializable] para virar item de lista dentro da Forma.
    [Serializable]
    public class WeaponData
    {
        public string id;
        public int damage;
        [Tooltip("Segundos entre disparos.")]
        public double interval = 1;
        public double range;
        public TargetingKind targeting;
        [Tooltip("Só vale para a regra Area.")]
        public double areaRadius;
    }

    // POR QUE: a Forma é o que um Defensor é (Parte 1 §6): HP, Armadura,
    // velocidade e Armas. Velocidade 0 = construção.
    // ESTRATÉGIA: só dados, mais duas perguntas que a simulação faz o tempo
    // todo (é construção? qual o maior alcance?).
    [CreateAssetMenu(fileName = "Form", menuName = "EED/Defender Form")]
    public class DefenderFormDefinition : ScriptableObject
    {
        public string id;
        public string displayName;
        public int hp;
        public int armor;
        [Tooltip("0 = construção, nunca sai do lugar.")]
        public double speed;
        public List<WeaponData> weapons = new List<WeaponData>();

        // Construções não andam: é o que separa prédio de criatura.
        public bool IsBuilding => speed == 0;

        // O maior alcance entre as Armas: a criatura só anda se ninguém
        // estiver dentro dele.
        public double LongestRange
        {
            get
            {
                double longest = 0;
                foreach (var weapon in weapons) longest = Math.Max(longest, weapon.range);
                return longest;
            }
        }

        // Impede intervalo zero, pelo mesmo motivo do UnitTypeDefinition.
        private void OnValidate()
        {
            foreach (var weapon in weapons)
                if (weapon.interval < 0.05) weapon.interval = 0.05;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameDatabase.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace EvilEnemyDefense.Data
{
    // POR QUE: um único asset que aponta para todo o resto. As telas, o save
    // e os testes recebem só ele, em vez de listas soltas de assets.
    // ESTRATÉGIA: a ordem das listas é significativa: `unitTypes` é a ordem
    // da loja e da montagem; `stages` é a escada (o índice 0 é o Estágio 1).
    [CreateAssetMenu(fileName = "GameDatabase", menuName = "EED/Game Database")]
    public class GameDatabase : ScriptableObject
    {
        public GameBalance balance;
        public List<UnitTypeDefinition> unitTypes = new List<UnitTypeDefinition>();
        public List<StageDefinition> stages = new List<StageDefinition>();

        // Busca um Tipo pelo id gravado no save. Id desconhecido é erro de dado.
        public UnitTypeDefinition UnitType(string id)
        {
            var type = unitTypes.Find(t => t.id == id);
            if (type == null) throw new ArgumentException($"Tipo de Unidade desconhecido: {id}");
            return type;
        }

        // Busca um Estágio pelo id.
        public StageDefinition Stage(string id)
        {
            var stage = stages.Find(s => s.id == id);
            if (stage == null) throw new ArgumentException($"Estágio desconhecido: {id}");
            return stage;
        }

        // Posição do Estágio na escada (0 = primeiro), ou -1.
        public int StageIndex(StageDefinition stage) => stages.IndexOf(stage);
    }
}
```

### 🧪 Teste rápido
O Console compila sem erros e o menu **Create → EED** mostra Game Balance, Unit Type, Defender Form, Stage e Game Database.

### Etapa 1C — Dados iniciais com um clique

Criar 6 Tipos, 11 Formas (com 20 Armas) e 12 Estágios à mão no Inspector levaria uma hora e convida a erro de digitação. A ferramenta abaixo cria tudo a partir das tabelas da Parte 1. Rodá-la de novo **restaura** os valores da Parte 1 nos Tipos, Formas e Estágios (o `GameBalance` é preservado).

```csharp
// Caminho: Assets/_Project/Scripts/Editor/GameDataSeeder.cs
using System.Collections.Generic;
using EvilEnemyDefense.Data;
using UnityEditor;
using UnityEngine;

namespace EvilEnemyDefense.EditorTools
{
    // POR QUE: os dados iniciais da Parte 1 (§5 a §7) viram assets sem
    // digitação manual, e a ferramenta serve de "reset" do balanceamento.
    // ESTRATÉGIA: carrega o asset se ele já existe (para não quebrar as
    // referências de quem aponta para ele) ou cria um novo; preenche os
    // campos; marca como alterado (SetDirty) e salva tudo no fim. A ordem
    // importa: Formas antes de Estágios (Estágios apontam para Formas) e
    // Estágios antes de Tipos (Tipos apontam para o Estágio que os libera).
    public static class GameDataSeeder
    {
        private const string Root = "Assets/_Project/Data";

        [MenuItem("EED/Criar ou atualizar dados iniciais")]
        public static void Seed()
        {
            EnsureFolder(Root, "UnitTypes");
            EnsureFolder(Root, "Forms");
            EnsureFolder(Root, "Stages");

            var balance = LoadOrCreate<GameBalance>($"{Root}/GameBalance.asset");

            // §6 — Formas de Defensor.
            var forms = new Dictionary<string, DefenderFormDefinition>();
            void AddForm(string id, string name, int hp, int armor, double speed, params WeaponData[] weapons)
            {
                var form = LoadOrCreate<DefenderFormDefinition>($"{Root}/Forms/{id}.asset");
                form.id = id;
                form.displayName = name;
                form.hp = hp;
                form.armor = armor;
                form.speed = speed;
                form.weapons = new List<WeaponData>(weapons);
                EditorUtility.SetDirty(form);
                forms[id] = form;
            }

            AddForm("goblin", "Goblin", 800, 0, 18,
                W("adaga", 20, 1, 14, TargetingKind.Foremost));
            AddForm("great-orc", "Orc Grande", 950, 2, 15,
                W("machado", 30, 1, 20, TargetingKind.Foremost),
                W("lanca", 14, 1.5, 85, TargetingKind.LowestHp));
            AddForm("lizard", "Lagarto Cuspidor", 820, 1, 20,
                W("cuspe", 20, 1.4, 105, TargetingKind.Area, 14));
            AddForm("bear", "Urso", 2400, 5, 26,
                W("garras", 52, 0.8, 22, TargetingKind.Foremost),
                W("patada", 38, 2.4, 26, TargetingKind.Area, 20));
            AddForm("minotaur", "Minotauro", 2600, 7, 19,
                W("machadao", 68, 1.3, 28, TargetingKind.Area, 22),
                W("investida", 30, 3, 70, TargetingKind.LowestHp));
            AddForm("troll", "Troll", 2800, 6, 12,
                W("clava", 120, 2.2, 32, TargetingKind.Area, 22));
            AddForm("wood-tower", "Torre de Madeira", 1900, 6, 0,
                W("besteiros", 17, 0.7, 120, TargetingKind.Foremost),
                W("oleo", 26, 2.6, 70, TargetingKind.Area, 22));
            AddForm("tower", "Torre de Vigia", 2800, 9, 0,
                W("arqueiros", 16, 0.6, 150, TargetingKind.Foremost),
                W("canhao", 40, 2, 170, TargetingKind.Area, 30));
            AddForm("tower-blue", "Torre Azul", 2500, 11, 0,
                W("arqueiros", 15, 0.55, 160, TargetingKind.LowestHp),
                W("canhao", 45, 2.2, 180, TargetingKind.Area, 26));
            AddForm("tower-purple", "Torre Sombria", 2700, 13, 0,
                W("arqueiros", 15, 0.5, 170, TargetingKind.Foremost),
                W("canhao", 48, 2, 190, TargetingKind.Area, 28));
            AddForm("castle", "Castelo", 2600, 14, 0,
                W("muralha", 13, 0.45, 190, TargetingKind.Foremost),
                W("balista", 42, 1.8, 210, TargetingKind.LowestHp),
                W("canhoes", 42, 2.4, 200, TargetingKind.Area, 30));

            // §7 — Estágios, na ordem da escada.
            var stages = new List<StageDefinition>();
            void AddStage(string id, string name, int baseReward, int firstClear, params (string formId, double x)[] slots)
            {
                var stage = LoadOrCreate<StageDefinition>($"{Root}/Stages/{stages.Count + 1:00}_{id}.asset");
                stage.id = id;
                stage.displayName = name;
                stage.baseReward = baseReward;
                stage.firstClearBonus = firstClear;
                stage.garrison = new List<GarrisonSlot>();
                foreach (var (formId, x) in slots)
                    stage.garrison.Add(new GarrisonSlot { form = forms[formId], x = x });
                EditorUtility.SetDirty(stage);
                stages.Add(stage);
            }

            AddStage("goblin-camp", "Acampamento Goblin", 40, 60, ("goblin", 0));
            AddStage("orc-warcamp", "Forte dos Orcs", 70, 110, ("great-orc", 0), ("goblin", -55));
            AddStage("lizard-nest", "Ninho dos Lagartos", 105, 170, ("lizard", 0), ("goblin", 60), ("goblin", -60));
            AddStage("wood-outpost", "Posto de Madeira", 150, 240, ("wood-tower", 0), ("great-orc", -50), ("goblin", 55));
            AddStage("bear-den", "Toca do Urso", 200, 320, ("bear", 0), ("lizard", 65), ("goblin", -70));
            AddStage("minotaur-maze", "Labirinto do Minotauro", 270, 430, ("minotaur", 0), ("lizard", -60), ("great-orc", 65));
            AddStage("wood-fort", "Forte de Madeira", 350, 560, ("wood-tower", 0), ("wood-tower", -55), ("bear", 60), ("great-orc", -105));
            AddStage("troll-bridge", "Ponte do Troll", 450, 720, ("troll", 0), ("bear", -65), ("lizard", 70));
            AddStage("watchtower", "Torre de Vigia", 580, 930, ("tower", 0), ("minotaur", 60), ("wood-tower", -60), ("lizard", -110));
            AddStage("twin-towers", "Torres Gêmeas", 740, 1180, ("tower-blue", 0), ("tower", -60), ("troll", 65), ("bear", -110));
            AddStage("dark-fortress", "Fortaleza Sombria", 950, 1520, ("tower-purple", 0), ("tower-blue", -60), ("minotaur", 60), ("troll", -115), ("lizard", 115));
            AddStage("castle", "O Castelo", 1250, 2000, ("castle", 0), ("tower-purple", -70), ("tower-blue", 70), ("troll", -120), ("minotaur", 120));

            StageDefinition StageById(string id) => stages.Find(s => s.id == id);

            // §5 — Tipos de Unidade, na ordem da loja.
            var types = new List<UnitTypeDefinition>();
            void AddType(string id, string name, string shortName, int hp, int damage, int armor,
                double interval, double range, double speed, int unlockCost, string gateStageId = null)
            {
                var type = LoadOrCreate<UnitTypeDefinition>($"{Root}/UnitTypes/{types.Count + 1:00}_{id}.asset");
                type.id = id;
                type.displayName = name;
                type.shortName = shortName;
                type.hp = hp;
                type.damage = damage;
                type.armor = armor;
                type.attackInterval = interval;
                type.range = range;
                type.speed = speed;
                type.unlockCost = unlockCost;
                type.unlockedByStage = gateStageId == null ? null : StageById(gateStageId);
                EditorUtility.SetDirty(type);
                types.Add(type);
            }

            AddType("warrior", "Guerreiro", "GUE", 70, 9, 3, 1, 8, 22, 0);
            AddType("archer", "Arqueiro", "ARQ", 25, 6, 0, 0.8, 60, 26, 120);
            AddType("bomber", "Bombardeiro", "BOM", 40, 34, 1, 3.5, 110, 14, 400);
            AddType("pawn", "Peão", "PEA", 34, 6, 0, 0.7, 8, 34, 200, "lizard-nest");
            AddType("lancer", "Lanceiro", "LAN", 60, 16, 2, 1.3, 28, 24, 650, "bear-den");
            AddType("thief", "Ladino", "LAD", 30, 14, 0, 0.45, 10, 42, 1200, "wood-fort");

            var database = LoadOrCreate<GameDatabase>($"{Root}/GameDatabase.asset");
            database.balance = balance;
            database.unitTypes = types;
            database.stages = stages;
            EditorUtility.SetDirty(database);

            AssetDatabase.SaveAssets();
            Debug.Log($"EED: {types.Count} Tipos, {forms.Count} Formas e {stages.Count} Estágios prontos em {Root}.");
        }

        // Atalho para escrever uma Arma numa linha.
        private static WeaponData W(string id, int damage, double interval, double range,
            TargetingKind targeting, double areaRadius = 0)
        {
            return new WeaponData
            {
                id = id,
                damage = damage,
                interval = interval,
                range = range,
                targeting = targeting,
                areaRadius = areaRadius,
            };
        }

        // Carrega o asset do caminho; se não existir, cria um novo ali.
        private static T LoadOrCreate<T>(string path) where T : ScriptableObject
        {
            var asset = AssetDatabase.LoadAssetAtPath<T>(path);
            if (asset != null) return asset;
            asset = ScriptableObject.CreateInstance<T>();
            AssetDatabase.CreateAsset(asset, path);
            return asset;
        }

        // Cria a subpasta se ela ainda não existir.
        private static void EnsureFolder(string parent, string name)
        {
            if (!AssetDatabase.IsValidFolder($"{parent}/{name}"))
                AssetDatabase.CreateFolder(parent, name);
        }
    }
}
```

1. Salve e espere compilar. A barra de menus da Unity ganha o menu **EED**.
2. **EED → Criar ou atualizar dados iniciais**. O Console mostra `EED: 6 Tipos, 11 Formas e 12 Estágios prontos...`.

### 🧪 Teste rápido
Abra `Assets/_Project/Data/GameDatabase`. O Inspector mostra o `GameBalance`, 6 Tipos (Guerreiro primeiro) e 12 Estágios. Abra `Stages/12_castle`: a Guarnição tem 5 membros, o primeiro é `castle` em `x = 0`. Abra `UnitTypes/06_thief`: **Unlocked By Stage** = `07_wood-fort`.

### ✅ Checkpoint da Fase 1
- `Data/` tem `GameBalance`, `GameDatabase` e as pastas `UnitTypes` (6), `Forms` (11) e `Stages` (12).
- Os números conferem com as tabelas da Parte 1 §5 a §7.
- Commit: `git add . && git commit -m "feat: dados do jogo"`.

#### Problemas comuns
- **O menu EED não aparece:** o script não está numa pasta chamada exatamente `Editor`, ou há erro de compilação no Console.
- **`ArgumentException: Tipo de Unidade desconhecido`:** um id foi digitado errado num asset; rode a ferramenta de novo para restaurar.
- **Campos `double` não aparecem no Inspector:** confirme que são `public` (ou `[SerializeField]`). A Unity serializa `double` normalmente.

Próxima fase: **a simulação da Run**, o coração do jogo.

---

# Parte 5 — Implementação Unity: Fase 2 (Simulação da Run)

## Fase 2 — Simulação da Run

> Objetivo desta fase: a Run inteira (Parte 1 §4) rodando em C# puro, avançada por um tick fixo de 20 por segundo, e visível na cena como bolinhas e quadrados desenhados por Gizmos.

**Conceitos novos:**
- **Classe C# comum vs. `MonoBehaviour`:** um `MonoBehaviour` é um componente preso a um GameObject e recebe chamadas da Unity (`Start`, `Update`...). Uma classe comum não depende de cena nenhuma: pode ser criada com `new` em qualquer lugar, inclusive num teste. A simulação inteira é feita assim.
- **`Update` e `Time.deltaTime`:** a Unity chama `Update` uma vez por quadro; `Time.deltaTime` é quanto tempo passou desde o quadro anterior. Como a taxa de quadros varia, usar `deltaTime` direto na simulação faria cada Run dar um resultado diferente.
- **Acumulador de tempo fixo:** a técnica que resolve isso. Somamos o tempo real num "balde" e, enquanto houver pelo menos um tick no balde, avançamos a simulação um tick exato. Com 60 quadros por segundo, cerca de 1 em cada 3 quadros roda um tick; com 15, cada quadro roda uns 1,3 ticks. O resultado é o mesmo nos dois casos.
- **Gizmos:** desenhos de depuração (linhas, esferas, cubos) que aparecem na Scene view e, com o botão **Gizmos** ligado, na Game view. Não entram na build.
- **`event Action`:** um "aviso" que outros scripts podem assinar com `+=`; quem dispara não precisa conhecer quem escuta.

### Etapa 2A — O estado da Run

```csharp
// Caminho: Assets/_Project/Scripts/Sim/BattleTypes.cs
using System;
using System.Collections.Generic;
using EvilEnemyDefense.Data;

namespace EvilEnemyDefense.Sim
{
    // POR QUE: os três estados de uma Run (Parte 1 §4.2, passo 5).
    public enum BattleOutcome
    {
        Running,
        Victory,
        Defeat,
    }

    // POR QUE: uma parcela do Exército: "N Guerreiros nível 3 pela esquerda".
    // ESTRATÉGIA: [Serializable] para poder ser montada no Inspector durante
    // os testes da Fase 2; a tela de montagem (Fase 5) cria por código.
    [Serializable]
    public class ArmyEntry
    {
        public UnitTypeDefinition type;
        public int level = 1;
        public int count = 1;
        public Side side = Side.Left;
    }

    // POR QUE: uma Unidade viva dentro da simulação. Não é persistente: nasce
    // na criação da Run e morre com ela (Parte 1 §2, "Unidade").
    // ESTRATÉGIA: campos públicos simples; só a BattleSimulation os altera.
    // `TargetId` é preenchido a cada tick para o render saber se ela ataca.
    public sealed class SimUnit
    {
        public int Id;
        public UnitTypeDefinition Type;
        public Side Side;
        public double X;
        public int Hp;
        public int MaxHp;
        public int Damage;
        public int Armor;
        public double Range;
        public double Speed;
        public double AttackInterval;
        public double Cooldown;
        public int TargetId = -1;
    }

    // POR QUE: um Defensor vivo dentro da simulação.
    // ESTRATÉGIA: um cooldown por Arma, na mesma ordem da lista de Armas da
    // Forma. `Firing` diz ao render se alguma Arma disparou neste tick.
    public sealed class SimDefender
    {
        public int Id;
        public DefenderFormDefinition Form;
        public double X;
        public int Hp;
        public int MaxHp;
        public int Armor;
        public double Speed;
        public double[] Cooldowns;
        public bool Firing;
    }

    // POR QUE: tudo o que existe numa Run em andamento. É o único objeto que
    // o tick altera e que o render lê.
    // ESTRATÉGIA: nada de referência à cena, a relógio ou a aleatório
    // (ADR 0001); dá para copiar, comparar e testar.
    public sealed class BattleState
    {
        public StageDefinition Stage;
        public List<SimUnit> Units = new List<SimUnit>();
        public List<SimDefender> Defenders = new List<SimDefender>();
        public int GarrisonMaxHp;
        public int InitialUnits;
        public int Ticks;
        public int MaxTicks;
        public double TickSeconds;
        public BattleOutcome Outcome = BattleOutcome.Running;

        // Segundos simulados até agora.
        public double Seconds => Ticks * TickSeconds;
    }

    // POR QUE: o resumo de uma Run que alimenta as Moedas (Parte 1 §8).
    // ESTRATÉGIA: struct imutável; dois resultados iguais são `Equals`, o que
    // o teste de determinismo usa. Durante a Run, `Outcome` vem como Defeat
    // (a vitória ainda não aconteceu) e o contador ao vivo usa isso.
    public readonly struct BattleResult
    {
        public readonly BattleOutcome Outcome;
        public readonly int Ticks;
        public readonly double DamageFraction;
        public readonly int Survivors;
        public readonly int InitialUnits;

        // Cria um resultado; os testes de Moedas montam resultados à mão.
        public BattleResult(BattleOutcome outcome, int ticks, double damageFraction, int survivors, int initialUnits)
        {
            Outcome = outcome;
            Ticks = ticks;
            DamageFraction = damageFraction;
            Survivors = survivors;
            InitialUnits = initialUnits;
        }

        public bool Won => Outcome == BattleOutcome.Victory;
    }
}
```

### Etapa 2B — O tick

Este é o script mais importante do jogo. Ele é a tradução direta de `src/sim/battle.ts` do protótipo; compare os dois se algum resultado divergir.

```csharp
// Caminho: Assets/_Project/Scripts/Sim/BattleSimulation.cs
using System;
using System.Collections.Generic;
using EvilEnemyDefense.Data;

namespace EvilEnemyDefense.Sim
{
    // POR QUE: as regras da Run (Parte 1 §4) num só lugar, sem dependência de
    // cena. A tela chama Step 20 vezes por segundo; os testes chamam Run e
    // simulam uma batalha inteira em milissegundos.
    // ESTRATÉGIA: classe estática (só métodos, sem estado próprio): todo o
    // estado mora no BattleState recebido. A ordem de cada tick segue a
    // Parte 1 §4.2. Empates são resolvidos pelo menor Id, para que a mesma
    // entrada produza sempre a mesma saída.
    public static class BattleSimulation
    {
        // Monta a Run: Unidades em coluna nas Entradas, Guarnição nas posições do Estágio.
        public static BattleState Create(StageDefinition stage, IReadOnlyList<ArmyEntry> army, GameBalance balance)
        {
            var state = new BattleState
            {
                Stage = stage,
                TickSeconds = balance.TickSeconds,
                MaxTicks = balance.MaxTicks,
            };

            int nextId = 0;
            int rankLeft = 0;
            int rankRight = 0;
            foreach (var entry in army)
            {
                if (entry.type == null || entry.count <= 0) continue;
                var type = entry.type;
                for (int n = 0; n < entry.count; n++)
                {
                    // Quem entra depois nasce mais para fora, formando a coluna.
                    int rank = entry.side == Side.Left ? rankLeft++ : rankRight++;
                    int maxHp = type.HpAtLevel(entry.level, balance.levelGain);
                    state.Units.Add(new SimUnit
                    {
                        Id = nextId++,
                        Type = type,
                        Side = entry.side,
                        X = (int)entry.side * (balance.entryX + rank * balance.spawnGap),
                        Hp = maxHp,
                        MaxHp = maxHp,
                        Damage = type.DamageAtLevel(entry.level, balance.levelGain),
                        Armor = type.armor,
                        Range = type.range,
                        Speed = type.speed,
                        AttackInterval = type.attackInterval,
                        Cooldown = 0,
                    });
                }
            }

            for (int i = 0; i < stage.garrison.Count; i++)
            {
                var slot = stage.garrison[i];
                var form = slot.form;
                state.Defenders.Add(new SimDefender
                {
                    Id = i,
                    Form = form,
                    X = slot.x,
                    Hp = form.hp,
                    MaxHp = form.hp,
                    Armor = form.armor,
                    Speed = form.speed,
                    Cooldowns = new double[form.weapons.Count],
                });
                state.GarrisonMaxHp += form.hp;
            }

            state.InitialUnits = state.Units.Count;
            return state;
        }

        // Dano de um golpe depois da Armadura: nunca menos que 1 (Parte 1 §4.3).
        public static int DamageAfterArmor(int amount, int armor)
        {
            return Math.Max(1, amount - armor);
        }

        // Avança a Run em exatamente um tick. Não faz nada se ela já acabou.
        public static void Step(BattleState state)
        {
            if (state.Outcome != BattleOutcome.Running) return;
            double dt = state.TickSeconds;

            // 1. Os Defensores atiram, ou caminham se ninguém está no alcance.
            foreach (var defender in state.Defenders)
            {
                bool fired = false;
                var weapons = defender.Form.weapons;
                for (int i = 0; i < weapons.Count; i++)
                {
                    var weapon = weapons[i];
                    defender.Cooldowns[i] -= dt;
                    while (defender.Cooldowns[i] <= 0)
                    {
                        var targets = PickTargets(weapon, defender.X, state.Units);
                        if (targets.Count == 0)
                        {
                            // Sem alvo: a Arma fica pronta, sem acumular disparos.
                            defender.Cooldowns[i] = 0;
                            break;
                        }
                        foreach (var target in targets)
                            target.Hp -= DamageAfterArmor(weapon.damage, target.Armor);
                        fired = true;
                        defender.Cooldowns[i] += weapon.interval;
                    }
                }
                defender.Firing = fired;

                // Criatura sem ninguém no alcance de nenhuma Arma caminha para a
                // Unidade mais próxima. Construção (Speed 0) nunca sai do lugar.
                double longest = defender.Form.LongestRange;
                bool anyoneClose = state.Units.Exists(u => Math.Abs(u.X - defender.X) <= longest);
                if (defender.Speed > 0 && !anyoneClose && state.Units.Count > 0)
                {
                    var prey = MinBy(state.Units, u => Math.Abs(u.X - defender.X), u => u.Id);
                    defender.X += Math.Sign(prey.X - defender.X) * defender.Speed * dt;
                }
            }

            // 2. Unidades mortas saem do campo.
            state.Units.RemoveAll(u => u.Hp <= 0);

            // 3. As Unidades atacam quem está no Alcance, ou avançam.
            foreach (var unit in state.Units)
            {
                var reachable = state.Defenders.FindAll(d => Math.Abs(d.X - unit.X) <= unit.Range);
                if (reachable.Count > 0)
                {
                    // Para e resolve quem está mais perto, de qualquer lado.
                    var target = MinBy(reachable, d => Math.Abs(d.X - unit.X), d => d.Id);
                    unit.TargetId = target.Id;
                    unit.Cooldown -= dt;
                    while (unit.Cooldown <= 0)
                    {
                        target.Hp -= DamageAfterArmor(unit.Damage, target.Armor);
                        unit.Cooldown += unit.AttackInterval;
                    }
                    continue;
                }

                unit.TargetId = -1;
                if (state.Defenders.Count == 0) continue;

                // Avança rumo ao centro. Só encara o que ficou para trás quando
                // não há mais nada à frente: a coluna nunca oscila (ADR 0004).
                int forward = -(int)unit.Side;
                var ahead = state.Defenders.FindAll(d => Math.Sign(d.X - unit.X) == forward || d.X == unit.X);
                var goal = MinBy(ahead.Count > 0 ? ahead : state.Defenders, d => Math.Abs(d.X - unit.X), d => d.Id);

                // Para exatamente no limite do próprio Alcance.
                double gap = Math.Abs(goal.X - unit.X) - unit.Range;
                double stepSize = Math.Min(unit.Speed * dt, Math.Max(0, gap));
                unit.X += Math.Sign(goal.X - unit.X) * stepSize;
            }

            // 4. Defensores mortos saem do campo.
            state.Defenders.RemoveAll(d => d.Hp <= 0);
            state.Ticks++;

            // 5. Fim de Run.
            if (state.Defenders.Count == 0) state.Outcome = BattleOutcome.Victory;
            else if (state.Units.Count == 0) state.Outcome = BattleOutcome.Defeat;
            else if (state.Ticks >= state.MaxTicks) state.Outcome = BattleOutcome.Defeat;
        }

        // Fração do HP total da Guarnição já destruída, de 0 a 1.
        public static double DamageFraction(BattleState state)
        {
            int remaining = 0;
            foreach (var defender in state.Defenders) remaining += Math.Max(0, defender.Hp);
            return (state.GarrisonMaxHp - remaining) / (double)state.GarrisonMaxHp;
        }

        // Resumo da Run no estado atual (serve no fim e durante, para o HUD).
        public static BattleResult ResultOf(BattleState state)
        {
            return new BattleResult(
                state.Outcome == BattleOutcome.Victory ? BattleOutcome.Victory : BattleOutcome.Defeat,
                state.Ticks,
                DamageFraction(state),
                state.Units.Count,
                state.InitialUnits);
        }

        // Roda a Run inteira de uma vez. É o que os testes de balanceamento usam.
        public static BattleResult Run(StageDefinition stage, IReadOnlyList<ArmyEntry> army, GameBalance balance)
        {
            var state = Create(stage, army, balance);
            while (state.Outcome == BattleOutcome.Running) Step(state);
            return ResultOf(state);
        }

        // Quem uma Arma atinge neste disparo (Parte 1 §4.4). Lista vazia = ninguém no alcance.
        private static List<SimUnit> PickTargets(WeaponData weapon, double defenderX, List<SimUnit> units)
        {
            var inRange = units.FindAll(u => Math.Abs(u.X - defenderX) <= weapon.range);
            if (inRange.Count == 0) return inRange;

            switch (weapon.targeting)
            {
                case TargetingKind.Foremost:
                    return new List<SimUnit> { MinBy(inRange, u => Math.Abs(u.X - defenderX), u => u.Id) };
                case TargetingKind.LowestHp:
                    return new List<SimUnit> { MinBy(inRange, u => u.Hp, u => u.Id) };
                default:
                    var epicentre = MinBy(inRange, u => Math.Abs(u.X - defenderX), u => u.Id);
                    return inRange.FindAll(u => Math.Abs(u.X - epicentre.X) <= weapon.areaRadius);
            }
        }

        // O item de menor `score`; empate vai para o menor id (determinismo).
        private static T MinBy<T>(List<T> items, Func<T, double> score, Func<T, int> id)
        {
            T best = items[0];
            double bestScore = score(best);
            for (int i = 1; i < items.Count; i++)
            {
                double s = score(items[i]);
                if (s < bestScore || (s == bestScore && id(items[i]) < id(best)))
                {
                    best = items[i];
                    bestScore = s;
                }
            }
            return best;
        }
    }
}
```

> **Detalhe fiel ao protótipo:** dentro de um mesmo tick, uma Unidade morta pelo primeiro Defensor ainda pode ser escolhida pelo segundo, porque os mortos só saem do campo no passo 2. O mesmo vale para Defensores no passo 3. Não "corrija" isso: mudaria o resultado das Runs em relação ao protótipo e os testes de balanceamento da Fase 6.

### Etapa 2C — A Run na cena

Dois scripts: o `BattleRunner` (o acumulador de tempo fixo, que fica até o fim do projeto) e o `BattleTestStarter` (uma Run de teste com Gizmos, que a Fase 5 desativa).

```csharp
// Caminho: Assets/_Project/Scripts/Game/BattleRunner.cs
using System;
using EvilEnemyDefense.Sim;
using UnityEngine;

namespace EvilEnemyDefense.Game
{
    // POR QUE: liga a simulação ao tempo real sem perder o determinismo
    // (ADR 0001): a simulação sempre anda em ticks de 0,05 s, não importa a
    // taxa de quadros.
    // ESTRATÉGIA: acumulador de tempo fixo. Cada quadro soma o tempo real
    // (vezes a velocidade x1/x3) e roda quantos ticks inteiros couberem. O
    // tempo de um quadro é limitado a 0,25 s: voltar de uma pausa longa não
    // pode despejar milhares de ticks de uma vez.
    public class BattleRunner : MonoBehaviour
    {
        // A Run em andamento (null quando não há Run).
        public BattleState State { get; private set; }

        // Multiplicador de velocidade (1 = tempo real, 3 = acelerado).
        public float Speed { get; set; } = 1f;

        // Disparado uma vez, no tick em que a Run termina.
        public event Action<BattleState> Finished;

        private double _accumulator;

        // Começa a avançar uma Run recém-criada.
        public void Begin(BattleState state)
        {
            State = state;
            _accumulator = 0;
        }

        // Para de avançar (ao sair da tela de batalha).
        public void Stop()
        {
            State = null;
        }

        // Unity chama a cada quadro: converte tempo real em ticks.
        private void Update()
        {
            if (State == null || State.Outcome != BattleOutcome.Running) return;

            _accumulator += Mathf.Min(Time.unscaledDeltaTime, 0.25f) * Speed;
            while (_accumulator >= State.TickSeconds && State.Outcome == BattleOutcome.Running)
            {
                BattleSimulation.Step(State);
                _accumulator -= State.TickSeconds;
            }

            if (State.Outcome != BattleOutcome.Running) Finished?.Invoke(State);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Game/BattleTestStarter.cs
using System.Collections.Generic;
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Sim;
using UnityEngine;

namespace EvilEnemyDefense.Game
{
    // POR QUE: ver a simulação funcionando antes de existir arte ou menu.
    // Você escolhe Estágio e Exército no Inspector e aperta Play.
    // ESTRATÉGIA: cria a Run no Start e desenha o estado com Gizmos:
    // Unidades são esferas (azul = esquerda, ciano = direita; vermelho se
    // estiver atacando), Defensores são cubos com altura proporcional ao HP.
    // Desativado na Fase 5, quando o fluxo de telas assume.
    public class BattleTestStarter : MonoBehaviour
    {
        [SerializeField] private GameDatabase _database;
        [SerializeField] private BattleRunner _runner;
        [SerializeField] private StageDefinition _stage;
        [SerializeField] private List<ArmyEntry> _army = new List<ArmyEntry>();
        [SerializeField, Range(1f, 3f)] private float _speed = 1f;

        // Cria a Run e avisa no Console quando ela termina.
        private void Start()
        {
            _runner.Speed = _speed;
            _runner.Finished += state =>
            {
                var result = BattleSimulation.ResultOf(state);
                Debug.Log($"{state.Stage.displayName}: {state.Outcome} em {state.Seconds:0.0}s, " +
                          $"dano {result.DamageFraction:P0}, sobreviventes {result.Survivors}/{result.InitialUnits}");
            };
            _runner.Begin(BattleSimulation.Create(_stage, _army, _database.balance));
        }

        // Unity chama para desenhar Gizmos na Scene/Game view.
        private void OnDrawGizmos()
        {
            var state = _runner != null ? _runner.State : null;
            if (state == null) return;

            // Chão e as duas Entradas.
            Gizmos.color = Color.green;
            Gizmos.DrawLine(new Vector3(-200, 0), new Vector3(200, 0));
            Gizmos.DrawLine(new Vector3(-175, 0), new Vector3(-175, 10));
            Gizmos.DrawLine(new Vector3(175, 0), new Vector3(175, 10));

            foreach (var defender in state.Defenders)
            {
                float height = 60f * defender.Hp / defender.MaxHp;
                Gizmos.color = defender.Firing ? Color.yellow : new Color(0.55f, 0.1f, 0f);
                Gizmos.DrawCube(new Vector3((float)defender.X, height / 2f), new Vector3(10, height, 1));
            }

            foreach (var unit in state.Units)
            {
                Gizmos.color = unit.TargetId >= 0 ? Color.red
                    : unit.Side == Side.Left ? Color.blue : Color.cyan;
                // Espalha em profundidade pelo id, como o render da Fase 4.
                float y = 4f + (unit.Id % 5) * 3f;
                Gizmos.DrawSphere(new Vector3((float)unit.X, y), 2f);
            }
        }
    }
}
```

Na cena `Main`:

1. **Hierarchy → botão direito → Create Empty**, renomeie `[Systems]`. Dentro dele, outro **Create Empty** chamado `BattleRunner`, com o componente **Add Component → Battle Runner**.
2. Outro objeto vazio dentro de `[Systems]` chamado `BattleTestStarter`, com **Add Component → Battle Test Starter**. Ligue **Database** = `GameDatabase`, **Runner** = o objeto `BattleRunner`, **Stage** = `01_goblin-camp`.
3. Em **Army**, clique **+** e preencha: **Type** = `01_warrior`, **Level** = `1`, **Count** = `6`, **Side** = `Left`.
4. Selecione a **Main Camera**: **Projection** = `Orthographic`, **Size** = `115`, **Position** = `(0, 74, -10)`. Assim o campo de −205 a +205 cabe em 16:9, com o chão (y = 0) perto da base, como no protótipo.
5. Na Game view, ligue o botão **Gizmos** (no topo da janela).

### 🧪 Teste rápido
Aperte ▶. Seis esferas azuis nascem à esquerda, andam até o cubo do goblin e ficam vermelhas ao atacar; o cubo encolhe conforme perde HP. O Console mostra `Acampamento Goblin: Victory em ...`. Agora mude o Exército para **duas** linhas: 3 Guerreiros `Left` e 3 Guerreiros `Right`. O resultado tem que ser **Defeat**: é a meta de balanceamento da Parte 1 §7 (dividir o Exército inicial perde o Estágio 1).

### ✅ Checkpoint da Fase 2
- A Run de teste termina em vitória com os 6 Guerreiros juntos e em derrota com 3+3.
- Mudar o **Speed** para 3 deixa a Run 3× mais rápida e o resultado continua **idêntico** (mesmos segundos simulados e sobreviventes no Console).
- Commit: `feat: simulação da Run`.

#### Problemas comuns
- **Nada aparece:** o botão **Gizmos** da Game view está desligado, ou a câmera não está em `(0, 74, -10)` com Size `115`.
- **`NullReferenceException` no Start:** algum campo do `BattleTestStarter` ficou vazio, ou uma linha do Exército está sem **Type**.
- **O resultado muda entre x1 e x3:** algum código está usando `Time.deltaTime` dentro da simulação. Só o `BattleRunner` pode olhar o relógio.

Próxima fase: **Moedas, progressão e save**, ainda em C# puro.

---

# Parte 6 — Implementação Unity: Fase 3 (Moedas, progressão e save)

## Fase 3 — Moedas, progressão e save

> Objetivo desta fase: as fórmulas de Moedas (Parte 1 §8), as compras da Meta-progressão (§9) e o save local (§13), todos em C# puro, com uma verificação rápida no Console.

**Conceitos novos:**
- **Estado imutável:** em vez de alterar o `PlayerState` existente, cada compra devolve um **novo** `PlayerState` (ou `null` se a compra for inválida). A tela usa o `null` para desabilitar o item; e quem guardava o estado antigo não é afetado por surpresa.
- **`JsonUtility`:** converte um objeto `[Serializable]` em texto JSON e de volta. Limitação importante: **não serializa `Dictionary`**, por isso os níveis ficam numa lista de pares (tipo, nível).
- **`PlayerPrefs`:** armazenamento chave-valor da Unity que funciona em todas as plataformas (no WebGL, vira o armazenamento do navegador). Ótimo para um save pequeno como este.

### Etapa 3A — Moedas

```csharp
// Caminho: Assets/_Project/Scripts/Game/CoinCalculator.cs
using System;
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Sim;

namespace EvilEnemyDefense.Game
{
    // POR QUE: o detalhamento das Moedas de uma Run (Parte 1 §8), usado no
    // resumo do fim e no contador ao vivo.
    public readonly struct CoinBreakdown
    {
        public readonly int Damage;
        public readonly int Time;
        public readonly int Survivors;
        public readonly int Victory;

        // Monta o detalhamento a partir das quatro parcelas.
        public CoinBreakdown(int damage, int time, int survivors, int victory)
        {
            Damage = damage;
            Time = time;
            Survivors = survivors;
            Victory = victory;
        }

        public int Total => Damage + Time + Survivors + Victory;
    }

    // POR QUE: Moedas = dano + tempo + sobreviventes + vitória. Todas as
    // parcelas são frações da recompensa base do Estágio, então o total
    // parcial aparece no HUD durante a Run sem mudar de significado no fim.
    // ESTRATÉGIA: uma função pura. `live = true` (contador durante a Run)
    // nunca conta a vitória antes da hora; a parcela de tempo troca de
    // fórmula conforme o desfecho (rapidez na vitória, resistência na derrota).
    public static class CoinCalculator
    {
        // Detalha as Moedas de um resultado.
        public static CoinBreakdown Breakdown(StageDefinition stage, BattleResult result,
            bool alreadyCleared, GameBalance balance, bool live = false)
        {
            double baseReward = stage.baseReward;
            double seconds = result.Ticks * balance.TickSeconds;
            bool won = result.Won && !live;

            int damage = MathUtil.RoundHalfUp(baseReward * balance.damageRate * result.DamageFraction);

            int time = won
                ? MathUtil.RoundHalfUp(baseReward * balance.speedRate * Math.Max(0, 1 - seconds / balance.speedLimitSeconds))
                : MathUtil.RoundHalfUp(baseReward * Math.Min(balance.timeCap, balance.timeRate * seconds));

            double survivorFraction = result.InitialUnits == 0 ? 0 : (double)result.Survivors / result.InitialUnits;
            int survivors = MathUtil.RoundHalfUp(baseReward * balance.survivorRate * survivorFraction);

            int victory = won
                ? MathUtil.RoundHalfUp(baseReward * balance.victoryRate) + (alreadyCleared ? 0 : stage.firstClearBonus)
                : 0;

            return new CoinBreakdown(damage, time, survivors, victory);
        }
    }
}
```

### Etapa 3B — Progressão

```csharp
// Caminho: Assets/_Project/Scripts/Game/PlayerState.cs
using System;
using System.Collections.Generic;

namespace EvilEnemyDefense.Game
{
    // POR QUE: o nível de um Tipo desbloqueado. Um par em vez de Dictionary
    // porque o JsonUtility não salva Dictionary.
    [Serializable]
    public class UnitLevel
    {
        public string typeId;
        public int level;
    }

    // POR QUE: tudo que sobrevive entre Runs (Parte 1 §9 e §13). É exatamente
    // o que vai para o save.
    // ESTRATÉGIA: campos públicos serializáveis + Clone, para que as compras
    // produzam um estado novo sem mexer no antigo.
    [Serializable]
    public class PlayerState
    {
        public int coins;
        public int capacity;
        public List<UnitLevel> levels = new List<UnitLevel>();
        public List<string> cleared = new List<string>();

        // Nível do Tipo, ou 0 se ele não estiver desbloqueado.
        public int LevelOf(string typeId)
        {
            var entry = levels.Find(l => l.typeId == typeId);
            return entry == null ? 0 : entry.level;
        }

        public bool IsUnlocked(string typeId) => LevelOf(typeId) > 0;

        public bool HasCleared(string stageId) => cleared.Contains(stageId);

        // Cópia independente (listas e itens novos).
        public PlayerState Clone()
        {
            var copy = new PlayerState { coins = coins, capacity = capacity, cleared = new List<string>(cleared) };
            foreach (var l in levels) copy.levels.Add(new UnitLevel { typeId = l.typeId, level = l.level });
            return copy;
        }

        // Define o nível de um Tipo nesta instância (usado só dentro das compras).
        internal void SetLevel(string typeId, int level)
        {
            var entry = levels.Find(l => l.typeId == typeId);
            if (entry == null) levels.Add(new UnitLevel { typeId = typeId, level = level });
            else entry.level = level;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Game/Progression.cs
using System;
using EvilEnemyDefense.Data;

namespace EvilEnemyDefense.Game
{
    // POR QUE: as regras da Meta-progressão (Parte 1 §9): custos, tetos,
    // desbloqueios e abertura de Estágios.
    // ESTRATÉGIA: funções puras. Cada compra recebe o estado atual e devolve
    // um novo, ou null quando é inválida (sem Moedas, no teto, já
    // desbloqueado, ainda trancado). A loja desabilita o item quando a compra
    // daria null.
    public static class Progression
    {
        // O estado de um jogo novo.
        public static PlayerState Initial(GameDatabase db)
        {
            var player = new PlayerState { coins = 0, capacity = db.balance.startingCapacity };
            foreach (var type in db.unitTypes)
                if (type.unlockCost == 0) player.SetLevel(type.id, 1);
            return player;
        }

        // Custo para subir do nível atual para o próximo.
        public static int LevelUpCost(int currentLevel, GameBalance b)
        {
            return MathUtil.RoundHalfUp(b.levelCostBase * Math.Pow(b.levelCostGrowth, currentLevel - 1));
        }

        // Custo do próximo ponto de Capacidade.
        public static int CapacityCost(int currentCapacity, GameBalance b)
        {
            return MathUtil.RoundHalfUp(b.capacityCostBase * Math.Pow(b.capacityCostGrowth, currentCapacity - b.startingCapacity));
        }

        // O Tipo já pode aparecer na loja? (vencido o Estágio que o libera)
        public static bool IsTypeAvailable(PlayerState player, UnitTypeDefinition type)
        {
            return type.unlockedByStage == null || player.HasCleared(type.unlockedByStage.id);
        }

        // Sobe um nível do Tipo. Null se inválido.
        public static PlayerState BuyLevel(PlayerState player, UnitTypeDefinition type, GameBalance b)
        {
            int level = player.LevelOf(type.id);
            if (level == 0 || level >= b.maxLevel) return null;
            int cost = LevelUpCost(level, b);
            if (player.coins < cost) return null;
            var next = player.Clone();
            next.coins -= cost;
            next.SetLevel(type.id, level + 1);
            return next;
        }

        // Desbloqueia o Tipo no nível 1. Null se inválido.
        public static PlayerState BuyUnlock(PlayerState player, UnitTypeDefinition type)
        {
            if (player.IsUnlocked(type.id) || !IsTypeAvailable(player, type)) return null;
            if (player.coins < type.unlockCost) return null;
            var next = player.Clone();
            next.coins -= type.unlockCost;
            next.SetLevel(type.id, 1);
            return next;
        }

        // +1 de Capacidade. Null se inválido.
        public static PlayerState BuyCapacity(PlayerState player, GameBalance b)
        {
            if (player.capacity >= b.maxCapacity) return null;
            int cost = CapacityCost(player.capacity, b);
            if (player.coins < cost) return null;
            var next = player.Clone();
            next.coins -= cost;
            next.capacity += 1;
            return next;
        }

        // O Estágio 1 está sempre aberto; os demais pedem o anterior vencido.
        public static bool IsStageUnlocked(PlayerState player, GameDatabase db, StageDefinition stage)
        {
            int index = db.StageIndex(stage);
            if (index <= 0) return index == 0;
            return player.HasCleared(db.stages[index - 1].id);
        }

        // Aplica o fim de uma Run: credita Moedas e marca a Primeira Vitória.
        public static PlayerState AfterRun(PlayerState player, StageDefinition stage, int coins, bool won)
        {
            var next = player.Clone();
            next.coins += coins;
            if (won && !next.HasCleared(stage.id)) next.cleared.Add(stage.id);
            return next;
        }
    }
}
```

### Etapa 3C — Save

```csharp
// Caminho: Assets/_Project/Scripts/Game/SaveService.cs
using System;
using EvilEnemyDefense.Data;
using UnityEngine;

namespace EvilEnemyDefense.Game
{
    // POR QUE: guardar o PlayerState entre sessões (Parte 1 §13), sem backend.
    // ESTRATÉGIA: o estado vira JSON numa chave de PlayerPrefs, a mesma
    // `eed.save.v1` do protótipo. Save ausente, corrompido ou com campos
    // faltando vira jogo novo, sem mensagem; falha ao gravar não interrompe
    // o jogo.
    public static class SaveService
    {
        private const string Key = "eed.save.v1";

        // Lê o save, ou devolve um jogo novo.
        public static PlayerState Load(GameDatabase db)
        {
            try
            {
                if (!PlayerPrefs.HasKey(Key)) return Progression.Initial(db);
                var player = JsonUtility.FromJson<PlayerState>(PlayerPrefs.GetString(Key));
                if (player == null || player.capacity <= 0 || player.levels == null || player.cleared == null)
                    return Progression.Initial(db);
                return player;
            }
            catch (Exception)
            {
                return Progression.Initial(db);
            }
        }

        // Grava o save. Erros são engolidos: o jogo continua, só não persiste.
        public static void Save(PlayerState player)
        {
            try
            {
                PlayerPrefs.SetString(Key, JsonUtility.ToJson(player));
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogWarning($"Save falhou: {e.Message}");
            }
        }

        // Apaga o save (botão de "novo jogo" ou depuração).
        public static void Clear()
        {
            PlayerPrefs.DeleteKey(Key);
        }
    }
}
```

### 🧪 Teste rápido
Acrescente estas linhas no fim do `Start` do `BattleTestStarter`, dentro do `_runner.Finished += state => { ... }`, logo depois do `Debug.Log`:

```csharp
                var coins = CoinCalculator.Breakdown(state.Stage, result, false, _database.balance);
                Debug.Log($"Moedas: dano {coins.Damage} + tempo {coins.Time} + sobreviventes {coins.Survivors} + vitória {coins.Victory} = {coins.Total}");
```

Aperte ▶ com os 6 Guerreiros juntos no Acampamento Goblin. O total tem que incluir **vitória = 80** (base 40 × 0,5 = 20, mais 60 de Primeira Vitória) e **dano = 40**. Depois, apague as duas linhas de teste.

### ✅ Checkpoint da Fase 3
- O Console mostra o detalhamento de Moedas com as quatro parcelas.
- O projeto compila com os quatro scripts novos em `Scripts/Game/`.
- Commit: `feat: moedas, progressão e save`.

#### Problemas comuns
- **`The type or namespace name 'Sim' could not be found`:** falta `using EvilEnemyDefense.Sim;` no topo do arquivo.
- **Valores diferentes dos do protótipo por 1 Moeda:** algum cálculo usou `Mathf.RoundToInt` em vez de `MathUtil.RoundHalfUp`.

Próxima fase: **a batalha na tela**, com os sprites do Tiny Swords no lugar dos Gizmos.

---

# Parte 7 — Implementação Unity: Fase 4 (A batalha na tela)

## Fase 4 — A batalha na tela

> Objetivo desta fase: a Run de teste aparece com os sprites animados do Tiny Swords, barras de HP, o piscar vermelho de dano e o HUD da Parte 1 §11.

**Conceitos novos:**
- **Sprite e spritesheet:** um *sprite* é uma imagem 2D pronta para a cena. Um *spritesheet* é uma imagem com vários quadros; no Inspector da textura, **Sprite Mode = Multiple** e o **Sprite Editor** a cortam em vários sprites.
- **Pivot:** o ponto do sprite que fica na posição do GameObject. Com pivot **Bottom**, a posição do objeto são os pés do personagem, então "estar no chão" é simplesmente `y = 0`.
- **Filter Mode Point:** desliga a suavização ao ampliar; pixel art fica nítida.
- **`SpriteRenderer`:** o componente que desenha um sprite. `flipX` espelha, `color` tinge (multiplica as cores), `sortingOrder` decide quem é desenhado na frente.
- **Prefab:** um GameObject salvo como asset, que serve de molde. `Instantiate(prefab)` cria uma cópia na cena.
- **`LateUpdate`:** chamado depois de todos os `Update` do quadro. O render lê o estado no `LateUpdate`, quando a simulação daquele quadro já rodou.
- **uGUI, Canvas e TextMeshPro:** a interface da Unity. Um **Canvas** contém os elementos de tela; o **Canvas Scaler** ajusta o tamanho a qualquer resolução; **TextMeshPro** (TMP) é o componente de texto.

### Etapa 4A — Importar os sprites

O protótipo já tem os PNGs do Tiny Swords recortados e renomeados em `public/sprites/` (o pack original é da Pixel Frog; confira a licença dele antes de publicar).

1. Copie todos os arquivos de `public/sprites/` do repositório do protótipo para `Assets/_Project/Art/Sprites/`.
2. Na Project, selecione todos os PNGs dessa pasta (clique no primeiro, **Shift**+clique no último). No Inspector: **Texture Type** = `Sprite (2D and UI)`, **Sprite Mode** = `Multiple`, **Pixels Per Unit** = `64`, **Filter Mode** = `Point (no filter)`, **Compression** = `None`. **Apply**.
3. Selecione só `tower`, `tower_blue`, `tower_purple` e `castle` e mude **Sprite Mode** para `Single`, **Pivot** = `Bottom`. **Apply**. São imagens únicas.
4. Para cada um dos outros PNGs: selecione, clique **Open Sprite Editor** → menu **Slice** → **Type** = `Grid By Cell Size`, **Pixel Size** conforme a tabela abaixo, **Pivot** = `Bottom` → **Slice** → **Apply** (canto superior direito) e feche.

| Tamanho do quadro | Arquivos |
|---|---|
| 192 × 192 | `warrior`, `archer`, `bomber`, `pawn`, `goblin`, `gnoll_*`, `lizard_*`, `thief_*` |
| 256 × 256 | `lancer_*`, `bear_*` |
| 320 × 320 | `minotaur_*` |
| 384 × 384 | `troll_*` |
| 128 × 192 | `wood_tower` |

> **Por que o Pixels Per Unit não importa muito aqui?** Cada personagem é redimensionado por código para a altura certa em unidades do campo (Etapa 4C). O PPU só precisa ser o mesmo em todos os sheets.

### 🧪 Teste rápido
Clique na setinha ao lado de `warrior` na Project: ela abre e mostra os quadros recortados (`warrior_0`, `warrior_1`...). Os sheets dos cavaleiros têm várias linhas: a primeira linha é "parado", a segunda "andando", a terceira "atacando".

### Etapa 4B — Animação por sprites

A Unity tem um sistema completo de animação (Animator), mas aqui ele seria peso morto: cada personagem só troca entre três sequências de quadros, decididas pela simulação. Um componente pequeno que troca o sprite conforme o tempo faz o mesmo que o `drawAnim` do protótipo.

```csharp
// Caminho: Assets/_Project/Scripts/Data/SpriteAnimation.cs
using System;
using UnityEngine;

namespace EvilEnemyDefense.Data
{
    // POR QUE: uma sequência de quadros com velocidade própria, o equivalente
    // ao `Anim` do protótipo (sprites.ts).
    // ESTRATÉGIA: um asset por animação; o quadro atual sai de "tempo × fps",
    // em loop. Uma imagem única (torre de pedra) é só uma animação de 1 quadro.
    [CreateAssetMenu(fileName = "Anim", menuName = "EED/Sprite Animation")]
    public class SpriteAnimation : ScriptableObject
    {
        public Sprite[] frames = Array.Empty<Sprite>();
        public float fps = 10f;

        // Duração de uma volta completa, em segundos.
        public float Duration => frames.Length == 0 ? 0f : frames.Length / fps;

        // O quadro a mostrar `time` segundos depois do início.
        public Sprite FrameAt(float time)
        {
            if (frames.Length == 0) return null;
            int index = Mathf.FloorToInt(time * fps) % frames.Length;
            return frames[index < 0 ? index + frames.Length : index];
        }
    }

    // POR QUE: as três animações que todo personagem tem no jogo.
    [Serializable]
    public class SpriteAnimSet
    {
        public SpriteAnimation idle;
        public SpriteAnimation walk;
        public SpriteAnimation attack;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/VisualCatalog.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace EvilEnemyDefense.Data
{
    // POR QUE: a aparência de cada Tipo de Unidade e de cada Forma. Fica fora
    // dos assets de regra (UnitTypeDefinition, DefenderFormDefinition) para a
    // simulação e os testes nunca dependerem de arte.
    // ESTRATÉGIA: duas listas de "id visual"; a altura é a do quadro inteiro,
    // em unidades do campo (a mesma conta do protótipo: pixels ÷ 0,78).
    [CreateAssetMenu(fileName = "VisualCatalog", menuName = "EED/Visual Catalog")]
    public class VisualCatalog : ScriptableObject
    {
        [Serializable]
        public class UnitVisual
        {
            public UnitTypeDefinition type;
            public SpriteAnimSet anims = new SpriteAnimSet();
            public float height = 33f;
            [Tooltip("Cor do tipo no contador do HUD.")]
            public Color hudColor = Color.white;
        }

        [Serializable]
        public class FormVisual
        {
            public DefenderFormDefinition form;
            public SpriteAnimSet anims = new SpriteAnimSet();
            public float height = 60f;
        }

        public List<UnitVisual> units = new List<UnitVisual>();
        public List<FormVisual> forms = new List<FormVisual>();

        // Aparência de um Tipo (null se esquecida no catálogo).
        public UnitVisual ForUnit(UnitTypeDefinition type) => units.Find(u => u.type == type);

        // Aparência de uma Forma (null se esquecida no catálogo).
        public FormVisual ForForm(DefenderFormDefinition form) => forms.Find(f => f.form == form);
    }
}
```

Criar 33 assets de animação arrastando sprites um a um é lento. A ferramenta abaixo cria uma animação a partir dos quadros que você selecionar na Project.

```csharp
// Caminho: Assets/_Project/Scripts/Editor/SpriteAnimationMaker.cs
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using EvilEnemyDefense.Data;
using UnityEditor;
using UnityEngine;

namespace EvilEnemyDefense.EditorTools
{
    // POR QUE: transformar "estes 6 quadros" num asset SpriteAnimation com
    // um clique direito, sem arrastar sprite por sprite.
    // ESTRATÉGIA: junta os sprites selecionados (ou todos os sprites de uma
    // textura selecionada), ordena pelo número no fim do nome em ordem
    // natural (warrior_2 antes de warrior_10) e pede onde salvar.
    public static class SpriteAnimationMaker
    {
        private const string MenuPath = "Assets/EED/Criar animação com os sprites selecionados";

        [MenuItem(MenuPath)]
        public static void Create()
        {
            var sprites = SelectedSprites();
            if (sprites.Count == 0) return;

            string suggested = Regex.Replace(sprites[0].name, @"_\d+$", "");
            string path = EditorUtility.SaveFilePanelInProject(
                "Salvar animação", suggested, "asset",
                "Nome da animação (ex.: warrior_walk)", "Assets/_Project/Data/Anims");
            if (string.IsNullOrEmpty(path)) return;

            var anim = ScriptableObject.CreateInstance<SpriteAnimation>();
            anim.frames = sprites.ToArray();
            AssetDatabase.CreateAsset(anim, path);
            AssetDatabase.SaveAssets();
            Selection.activeObject = anim;
            Debug.Log($"Animação {path} criada com {sprites.Count} quadros.");
        }

        // Só habilita o item de menu quando há sprite ou textura selecionada.
        [MenuItem(MenuPath, true)]
        public static bool CanCreate() => SelectedSprites().Count > 0;

        // Sprites selecionados, ordenados pelo índice no fim do nome.
        private static List<Sprite> SelectedSprites()
        {
            var result = new List<Sprite>();
            foreach (var obj in Selection.objects)
            {
                if (obj is Sprite sprite) result.Add(sprite);
                else if (obj is Texture2D texture)
                    result.AddRange(AssetDatabase.LoadAllAssetsAtPath(AssetDatabase.GetAssetPath(texture)).OfType<Sprite>());
            }
            return result.Distinct().OrderBy(s => TrailingNumber(s.name)).ToList();
        }

        // "warrior_12" → 12; sem número → 0.
        private static int TrailingNumber(string name)
        {
            var match = Regex.Match(name, @"(\d+)$");
            return match.Success ? int.Parse(match.Value) : 0;
        }
    }
}
```

Crie as animações. Para cada linha da tabela: na Project, abra a setinha da textura, clique no primeiro quadro, **Shift**+clique no último, botão direito → **EED → Criar animação com os sprites selecionados**, salve com o nome indicado e ajuste o **Fps** do asset criado. Em sheets de uma animação só (`bear_idle`, por exemplo), basta selecionar a textura inteira.

| Animação | Quadros | Fps |
|---|---|---|
| `warrior_idle` / `_walk` / `_attack` | `warrior` linha 1 (6) / linha 2 (6) / linha 3 (6) | 10 |
| `archer_idle` / `_walk` / `_attack` | `archer` linha 1 (6) / linha 2 (6) / linha 3 (8) | 10 |
| `bomber_idle` / `_walk` / `_attack` | `bomber` linha 1 (6) / linha 2 (6) / linha 3 (7) | 10 |
| `pawn_idle` / `_walk` / `_attack` | `pawn` linha 1 (6) / linha 2 (6) / linha 3 (6) | 10 |
| `lancer_idle` / `_walk` / `_attack` | `lancer_idle` (7) / `lancer_walk` (6) / `lancer_attack` (8) | 10 |
| `thief_idle` / `_walk` / `_attack` | `thief_idle` (6) / `thief_walk` (6) / `thief_attack` (6) | 10 / 14 / 14 |
| `goblin_idle` / `_walk` / `_attack` | `goblin` linha 1 (7) / linha 2 (6) / linha 3 (6) | 10 |
| `orc_idle` / `_walk` / `_attack` | `gnoll_idle` (6) / `gnoll_walk` (8) / `gnoll_attack` (8) | 8 / 10 / 12 |
| `lizard_idle` / `_walk` / `_attack` | `lizard_idle` (7) / `lizard_walk` (6) / `lizard_attack` (9) | 8 / 10 / 12 |
| `bear_idle` / `_walk` / `_attack` | `bear_idle` (8) / `bear_walk` (5) / `bear_attack` (9) | 8 / 10 / 12 |
| `minotaur_idle` / `_walk` / `_attack` | `minotaur_idle` (16) / `minotaur_walk` (8) / `minotaur_attack` (12) | 10 / 10 / 12 |
| `troll_idle` / `_walk` / `_attack` | `troll_idle` (12) / `troll_walk` (10) / `troll_attack` (6) | 8 |
| `wood_tower` | `wood_tower` (8) — usada como parada e como ataque | 8 |
| `tower`, `tower_blue`, `tower_purple`, `castle` | a imagem única (1 quadro) | 1 |

> **Linhas dos cavaleiros:** a ordem "parado, andando, atacando" é a suposição do protótipo sobre o layout do pack (Parte 1 §16). Se uma animação parecer errada no Play, recrie-a com outra linha.

Agora o catálogo:

1. Botão direito em `Data` → **Create → EED → Visual Catalog**.
2. Em **Units**, adicione 6 itens (um por Tipo) com **Type**, as três animações e **Height** = `33`. Escolha uma **Hud Color** clara para cada um (o protótipo usa branco, rosa, bege, azul-claro, azul e lilás).
3. Em **Forms**, adicione 11 itens com **Form**, as animações (construções de pedra usam a mesma imagem nos três campos; a torre de madeira usa `wood_tower` em idle e attack) e **Height**:

| Forma | Height | Forma | Height |
|---|---|---|---|
| goblin | 38 | wood-tower | 69 |
| great-orc | 49 | tower | 79 |
| lizard | 44 | tower-blue | 85 |
| bear | 54 | tower-purple | 90 |
| minotaur | 64 | castle | 103 |
| troll | 77 | | |

### Etapa 4C — As views

```csharp
// Caminho: Assets/_Project/Scripts/View/SpriteAnimPlayer.cs
using EvilEnemyDefense.Data;
using UnityEngine;

namespace EvilEnemyDefense.View
{
    // POR QUE: toca uma SpriteAnimation num SpriteRenderer e deixa o quadro
    // com a altura certa em unidades do campo.
    // ESTRATÉGIA: guarda a animação atual e o instante em que ela começou;
    // no LateUpdate escolhe o quadro e recalcula a escala (altura desejada ÷
    // altura do quadro em unidades). `timeOffset` desencontra personagens
    // iguais para não andarem em passo sincronizado.
    [RequireComponent(typeof(SpriteRenderer))]
    public class SpriteAnimPlayer : MonoBehaviour
    {
        private SpriteRenderer _renderer;
        private SpriteAnimation _current;
        private float _startTime;
        private float _timeOffset;
        private float _height = 1f;

        public SpriteRenderer Renderer => _renderer;

        // Unity chama ao criar o objeto: pega o SpriteRenderer do mesmo GameObject.
        private void Awake()
        {
            _renderer = GetComponent<SpriteRenderer>();
        }

        // Altura do quadro na tela e defasagem da animação.
        public void Configure(float height, float timeOffset)
        {
            _height = height;
            _timeOffset = timeOffset;
        }

        // Troca de animação. Com `restart`, volta ao primeiro quadro mesmo se já for a atual.
        public void Play(SpriteAnimation anim, bool restart = false)
        {
            if (anim == _current && !restart) return;
            _current = anim;
            _startTime = Time.time;
        }

        // Escolhe o quadro do momento e ajusta a escala.
        private void LateUpdate()
        {
            if (_current == null) return;
            var sprite = _current.FrameAt(Time.time - _startTime + _timeOffset);
            _renderer.sprite = sprite;
            if (sprite == null) return;
            float frameHeight = sprite.rect.height / sprite.pixelsPerUnit;
            float scale = _height / frameHeight;
            transform.localScale = new Vector3(scale, scale, 1f);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/View/HpBar.cs
using UnityEngine;

namespace EvilEnemyDefense.View
{
    // POR QUE: a barra de HP sobre Unidades feridas e sobre Defensores.
    // ESTRATÉGIA: dois quadrados (fundo vermelho-escuro e preenchimento
    // verde); o preenchimento encolhe pela esquerda mudando escala e posição.
    public class HpBar : MonoBehaviour
    {
        [SerializeField] private Transform _back;
        [SerializeField] private Transform _fill;

        private float _width = 10f;
        private float _thickness = 1.3f;

        // Define o tamanho da barra, em unidades do campo.
        public void SetSize(float width, float thickness)
        {
            _width = width;
            _thickness = thickness;
            _back.localScale = new Vector3(width, thickness, 1f);
        }

        // Mostra a fração de vida (0 a 1).
        public void SetFraction(float fraction)
        {
            fraction = Mathf.Clamp01(fraction);
            _fill.localScale = new Vector3(_width * fraction, _thickness, 1f);
            _fill.localPosition = new Vector3(-_width * (1f - fraction) / 2f, 0f, 0f);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/View/UnitView.cs
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Sim;
using UnityEngine;

namespace EvilEnemyDefense.View
{
    // POR QUE: a aparência de uma SimUnit (Parte 1 §10): anda ou ataca,
    // espelhada se veio da direita, pisca vermelha ao apanhar e mostra a
    // barra de HP só depois de ferida.
    // ESTRATÉGIA: Init uma vez quando a Unidade nasce; Sync todo quadro com o
    // estado atual. A view nunca altera a simulação, só lê. O "piscar"
    // compara o HP com o do quadro anterior.
    public class UnitView : MonoBehaviour
    {
        private static readonly Color DamageTint = Color.Lerp(Color.white, new Color(0.88f, 0.09f, 0.09f), 0.8f);
        private const float FlashSeconds = 0.14f;
        private const float BarOffsetFactor = 0.55f;

        [SerializeField] private SpriteAnimPlayer _body;
        [SerializeField] private HpBar _hpBar;

        private VisualCatalog.UnitVisual _visual;
        private int _previousHp;
        private float _flashUntil;
        private float _laneY;

        // Prepara a view para uma Unidade recém-criada.
        public void Init(SimUnit unit, VisualCatalog.UnitVisual visual)
        {
            _visual = visual;
            _previousHp = unit.Hp;

            // Espalha em 5 profundidades pelo id: estável entre quadros, nada de aleatório.
            int lane = unit.Id % 5;
            _laneY = (2 - lane) * 2.5f;
            _body.Renderer.sortingOrder = 2000 + lane;

            float height = visual != null ? visual.height : 33f;
            _body.Configure(height, unit.Id * 0.057f);
            _body.Renderer.flipX = unit.Side == Side.Right;

            _hpBar.SetSize(13f, 1.3f);
            _hpBar.transform.localPosition = new Vector3(0f, height * BarOffsetFactor, 0f);
        }

        // Copia o estado da simulação para a tela.
        public void Sync(SimUnit unit)
        {
            transform.position = new Vector3((float)unit.X, _laneY, 0f);

            if (_visual != null)
                _body.Play(unit.TargetId < 0 ? _visual.anims.walk : _visual.anims.attack);

            if (unit.Hp < _previousHp) _flashUntil = Time.time + FlashSeconds;
            _previousHp = unit.Hp;
            _body.Renderer.color = Time.time < _flashUntil ? DamageTint : Color.white;

            bool hurt = unit.Hp < unit.MaxHp;
            _hpBar.gameObject.SetActive(hurt);
            if (hurt) _hpBar.SetFraction((float)unit.Hp / unit.MaxHp);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/View/DefenderView.cs
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Sim;
using UnityEngine;

namespace EvilEnemyDefense.View
{
    // POR QUE: a aparência de um SimDefender (Parte 1 §10).
    // ESTRATÉGIA: igual à UnitView, com duas regras a mais. (1) `Firing` só é
    // verdadeiro no tick do disparo; usá-lo direto faria o sprite piscar
    // entre parado e ataque, então cada disparo "segura" a animação de ataque
    // pela duração inteira dela, sempre a partir do primeiro quadro.
    // (2) Criatura encara a Unidade mais próxima; construção nunca vira.
    public class DefenderView : MonoBehaviour
    {
        private static readonly Color DamageTint = Color.Lerp(Color.white, new Color(0.88f, 0.09f, 0.09f), 0.75f);
        private const float FlashSeconds = 0.14f;

        [SerializeField] private SpriteAnimPlayer _body;
        [SerializeField] private HpBar _hpBar;

        private VisualCatalog.FormVisual _visual;
        private int _previousHp;
        private float _flashUntil;
        private float _attackUntil;

        // Prepara a view para um Defensor do início da Run.
        public void Init(SimDefender defender, VisualCatalog.FormVisual visual)
        {
            _visual = visual;
            _previousHp = defender.Hp;

            float height = visual != null ? visual.height : 60f;
            // Os maiores primeiro: o castelo não cobre as criaturas à frente dele.
            _body.Renderer.sortingOrder = 1000 - Mathf.RoundToInt(height);
            _body.Configure(height, defender.Id * 0.091f);

            _hpBar.SetSize(Mathf.Max(20f, height * 0.6f), 3.8f);
            _hpBar.transform.localPosition = new Vector3(0f, height + 7.7f, 0f);
        }

        // Copia o estado da simulação para a tela; precisa da lista de Unidades para virar o rosto.
        public void Sync(SimDefender defender, BattleState state)
        {
            transform.position = new Vector3((float)defender.X, 0f, 0f);

            if (_visual != null)
            {
                var attack = _visual.anims.attack;
                if (defender.Firing && attack != null)
                {
                    _attackUntil = Time.time + attack.Duration;
                    _body.Play(attack, restart: true);
                }
                else if (Time.time >= _attackUntil)
                {
                    _body.Play(_visual.anims.idle);
                }
            }

            if (!defender.Form.IsBuilding && state.Units.Count > 0)
            {
                SimUnit nearest = state.Units[0];
                foreach (var unit in state.Units)
                    if (System.Math.Abs(unit.X - defender.X) < System.Math.Abs(nearest.X - defender.X)) nearest = unit;
                _body.Renderer.flipX = nearest.X < defender.X;
            }

            if (defender.Hp < _previousHp) _flashUntil = Time.time + FlashSeconds;
            _previousHp = defender.Hp;
            _body.Renderer.color = Time.time < _flashUntil ? DamageTint : Color.white;

            _hpBar.SetFraction((float)defender.Hp / defender.MaxHp);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/View/BattleView.cs
using System.Collections.Generic;
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Game;
using EvilEnemyDefense.Sim;
using UnityEngine;

namespace EvilEnemyDefense.View
{
    // POR QUE: mantém na cena uma view para cada Unidade e Defensor vivo da
    // Run que o BattleRunner está avançando.
    // ESTRATÉGIA: dicionários id → view. Todo LateUpdate: cria a view de quem
    // é novo, sincroniza quem continua e destrói a de quem saiu do estado
    // (morreu). Uma Run nova (outro BattleState) limpa tudo.
    public class BattleView : MonoBehaviour
    {
        [SerializeField] private BattleRunner _runner;
        [SerializeField] private VisualCatalog _catalog;
        [SerializeField] private UnitView _unitPrefab;
        [SerializeField] private DefenderView _defenderPrefab;

        private readonly Dictionary<int, UnitView> _units = new Dictionary<int, UnitView>();
        private readonly Dictionary<int, DefenderView> _defenders = new Dictionary<int, DefenderView>();
        private readonly List<int> _gone = new List<int>();
        private BattleState _shown;

        // Depois da simulação do quadro: alinha as views com o estado.
        private void LateUpdate()
        {
            var state = _runner.State;
            if (state != _shown)
            {
                Clear();
                _shown = state;
            }
            if (state == null) return;

            _gone.Clear();
            _gone.AddRange(_defenders.Keys);
            foreach (var defender in state.Defenders)
            {
                if (!_defenders.TryGetValue(defender.Id, out var view))
                {
                    view = Instantiate(_defenderPrefab, transform);
                    view.Init(defender, _catalog.ForForm(defender.Form));
                    _defenders[defender.Id] = view;
                }
                view.Sync(defender, state);
                _gone.Remove(defender.Id);
            }
            foreach (int id in _gone)
            {
                Destroy(_defenders[id].gameObject);
                _defenders.Remove(id);
            }

            _gone.Clear();
            _gone.AddRange(_units.Keys);
            foreach (var unit in state.Units)
            {
                if (!_units.TryGetValue(unit.Id, out var view))
                {
                    view = Instantiate(_unitPrefab, transform);
                    view.Init(unit, _catalog.ForUnit(unit.Type));
                    _units[unit.Id] = view;
                }
                view.Sync(unit);
                _gone.Remove(unit.Id);
            }
            foreach (int id in _gone)
            {
                Destroy(_units[id].gameObject);
                _units.Remove(id);
            }
        }

        // Destrói todas as views (troca de Run ou saída da batalha).
        private void Clear()
        {
            foreach (var view in _units.Values) Destroy(view.gameObject);
            foreach (var view in _defenders.Values) Destroy(view.gameObject);
            _units.Clear();
            _defenders.Clear();
        }
    }
}
```

**Montar os prefabs e o cenário:**

1. **Quadrado branco:** na Project, botão direito em `Art/Sprites` → **Create → 2D → Sprites → Square**. Ele é usado no chão e nas barras de HP.
2. **Prefab da barra de HP:** **Hierarchy → Create Empty** chamado `HpBar`, com **Add Component → Hp Bar**. Dentro dele, dois filhos criados arrastando o sprite `Square` para cima do `HpBar`: renomeie `Back` (**Color** `#780000`, **Order in Layer** `3000`) e `Fill` (**Color** `#00B800`, **Order in Layer** `3001`). Ligue **Back** e **Fill** no componente.
3. **Prefab da Unidade:** **Create Empty** chamado `UnitView` com **Add Component → Unit View**. Filho `Body`: **Create Empty** dentro do `UnitView`, com **Add Component → Sprite Renderer** e **Add Component → Sprite Anim Player**. Arraste o `HpBar` para dentro do `UnitView`. No componente **Unit View**, ligue **Body** e **Hp Bar**. Arraste `UnitView` da Hierarchy para `Assets/_Project/Prefabs/` e apague-o da cena.
4. **Prefab do Defensor:** repita o passo 3 com o nome `DefenderView` e o componente **Defender View** (crie outro `HpBar` igual ao do passo 2).
5. **Cenário:** **Create Empty** `[World]`. Dentro dele:
   - `Ground`: arraste o `Square`, **Position** `(0, -45, 0)`, **Scale** `(500, 90, 1)`, **Color** `#00882C`, **Order in Layer** `-10`.
   - `GroundLine`: outro `Square`, **Position** `(0, -1.3, 0)`, **Scale** `(500, 2.6, 1)`, **Color** `#006818`, **Order in Layer** `-9`.
   - `BattleView`: objeto vazio com **Add Component → Battle View**; ligue **Runner**, **Catalog**, **Unit Prefab** e **Defender Prefab**.
6. **Céu:** selecione a **Main Camera** → **Environment → Background Type** = `Solid Color`, **Background** = `#3CBCFC`.

### 🧪 Teste rápido
Desligue o botão **Gizmos** da Game view e aperte ▶. Os 6 Guerreiros entram pela esquerda andando, espalhados em profundidade, e atacam o goblin, que se vira para eles; quem apanha pisca em vermelho e ganha barra de HP. Troque o Estágio do `BattleTestStarter` para `12_castle` com 30 Guerreiros nível 20 divididos 15+15: o castelo aparece atrás das criaturas e as Unidades da direita aparecem espelhadas.

### Etapa 4D — HUD

```csharp
// Caminho: Assets/_Project/Scripts/View/BattleHud.cs
using System.Collections.Generic;
using System.Text;
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Game;
using EvilEnemyDefense.Sim;
using TMPro;
using UnityEngine;

namespace EvilEnemyDefense.View
{
    // POR QUE: o HUD da batalha (Parte 1 §11): Estágio, inimigos restantes,
    // tempo, velocidade, Moedas ao vivo e o contador do Exército por tipo.
    // ESTRATÉGIA: lê o estado do BattleRunner a cada quadro. As Moedas ao
    // vivo usam a mesma fórmula do fim da Run com `live = true`, então o
    // número não muda de significado quando a Run acaba.
    public class BattleHud : MonoBehaviour
    {
        [SerializeField] private BattleRunner _runner;
        [SerializeField] private GameDatabase _database;
        [SerializeField] private VisualCatalog _catalog;
        [SerializeField] private TMP_Text _stageName;
        [SerializeField] private TMP_Text _enemies;
        [SerializeField] private TMP_Text _time;
        [SerializeField] private TMP_Text _speed;
        [SerializeField] private TMP_Text _coins;
        [SerializeField] private TMP_Text _army;

        // A tela de batalha informa se o Estágio já foi vencido antes (Primeira Vitória).
        public bool AlreadyCleared { get; set; }

        private readonly Dictionary<UnitTypeDefinition, int> _counts = new Dictionary<UnitTypeDefinition, int>();
        private readonly StringBuilder _text = new StringBuilder();

        // Atualiza os textos depois da simulação do quadro.
        private void LateUpdate()
        {
            var state = _runner.State;
            if (state == null) return;

            _stageName.text = state.Stage.displayName.ToUpperInvariant();
            _enemies.text = $"INIMIGOS {state.Defenders.Count}";
            _time.text = $"{state.Seconds:0.0}s";
            _speed.text = $"x{_runner.Speed:0}";

            bool running = state.Outcome == BattleOutcome.Running;
            var coins = CoinCalculator.Breakdown(state.Stage, BattleSimulation.ResultOf(state),
                AlreadyCleared, _database.balance, live: running);
            _coins.text = $"{coins.Total}$";

            _counts.Clear();
            foreach (var unit in state.Units)
                _counts[unit.Type] = _counts.TryGetValue(unit.Type, out int n) ? n + 1 : 1;

            _text.Clear();
            if (_counts.Count == 0) _text.Append("EXERCITO DESTRUIDO");
            foreach (var pair in _counts)
            {
                var visual = _catalog.ForUnit(pair.Key);
                string color = ColorUtility.ToHtmlStringRGB(visual != null ? visual.hudColor : Color.white);
                _text.Append($"<color=#{color}>{pair.Key.shortName} {pair.Value}</color>   ");
            }
            _army.text = _text.ToString();
        }
    }
}
```

1. **Hierarchy → botão direito → UI → Canvas**. Renomeie `[UI]`. No **Canvas Scaler**: **UI Scale Mode** = `Scale With Screen Size`, **Reference Resolution** = `320 × 180`, **Match** = `0.5`. A Unity cria junto um `EventSystem`; se ele pedir, clique **Replace with InputSystemUIInputModule**.
2. Dentro do Canvas, **Create Empty** chamado `BattleHud` (**Rect Transform** esticado: no seletor de âncoras, **Alt**+clique no quadrado do canto inferior direito, "stretch/stretch"). **Add Component → Battle Hud**.
3. Dentro do `BattleHud`, crie 6 textos com **UI → Text - TextMeshPro** (na primeira vez, aceite **Import TMP Essentials**), todos com **Font Size** `8`:
   - `StageName` no canto superior esquerdo; `Enemies` e `Time` no canto superior direito, um embaixo do outro; `Speed` logo abaixo do `Time`;
   - `Army` no canto inferior esquerdo (**Rich Text** ligado, o padrão); `Coins` no canto inferior direito.
4. Ligue os 6 textos, **Runner**, **Database** e **Catalog** no **Battle Hud**.

> A fonte em pixel e as caixas azuis estilo FF chegam na Fase 5. Por enquanto, a fonte padrão do TMP serve.

### 🧪 Teste rápido
Aperte ▶: o HUD mostra o nome do Estágio, os inimigos, o tempo correndo, `GUE 6` colorido e as Moedas subindo conforme o goblin perde HP. Durante a Run a parcela de vitória não entra no total; quando o goblin cai, ela é somada e o número final bate com o da Fase 3.

### ✅ Checkpoint da Fase 4
- A batalha aparece animada, com chão, céu, barras de HP e piscar vermelho.
- Unidades da direita espelhadas; criaturas viram para quem está perto; torres nunca viram.
- A animação de ataque de um Defensor roda inteira a cada disparo, sem piscar.
- Commit: `feat: batalha na tela`.

#### Problemas comuns
- **Personagens gigantes ou minúsculos:** a **Height** do Visual Catalog não foi preenchida, ou o Pixels Per Unit difere entre sheets.
- **Personagens flutuando ou enterrados:** o **Pivot** do recorte não ficou `Bottom`. Recorte de novo.
- **Personagem invisível:** o Tipo ou a Forma não está no Visual Catalog, ou a animação não tem quadros.
- **Texto do HUD borrado ou enorme:** confira o **Canvas Scaler** em `320 × 180`.

Próxima fase: **os menus estilo Final Fantasy** e o fluxo completo entre telas.

---

# Parte 8 — Implementação Unity: Fase 5 (Menus estilo FF e fluxo)

## Fase 5 — Menus estilo FF e fluxo

> Objetivo desta fase: o jogo completo. Seleção de Estágio, loja, montagem do Exército com as duas Entradas, batalha e resumo, todos no visual de menu de Final Fantasy 1/2 (Parte 1 §11), navegáveis pelo teclado e pelo mouse, com save.

**Conceitos novos:**
- **EventSystem e navegação do uGUI:** o `EventSystem` sabe qual elemento da UI está **selecionado** e manda para ele os eventos de teclado: setas viram `OnMove`, Enter vira `OnSubmit`, Esc vira `OnCancel`. Isso é exatamente o "cursor do FF": a linha selecionada é a linha com o cursor.
- **`Selectable`:** a classe base de tudo que pode ser selecionado na UI (botões, sliders...). Herdando dela, uma linha de menu ganha navegação por teclado e mouse de graça; sobrescrevendo `OnMove`, as setas ◀ ▶ passam a ajustar valores.
- **Interfaces de evento** (`ISubmitHandler`, `ICancelHandler`, `IPointerClickHandler`, `IScrollHandler`): implementar uma delas faz o EventSystem chamar o método correspondente.
- **Sprite fatiado (9-slice):** um sprite com **bordas** definidas pode ser esticado sem deformar os cantos. A janela azul do FF é um sprite de 12×12 pixels esticado para qualquer tamanho.
- **`RectMask2D`:** esconde o que sai do retângulo do objeto. É a "janela" das listas maiores que a caixa.
- **Font Asset do TextMeshPro:** o TMP não usa o arquivo `.ttf` direto; ele gera um *Font Asset* (atlas de letras) a partir dele.

### Etapa 5A — O visual FF

**A fonte.** Baixe a fonte **Press Start 2P** (Google Fonts, licença OFL) e copie o `.ttf` para `Assets/_Project/Art/Fonts/`. Abra **Window → TextMeshPro → Font Asset Creator**: **Source Font File** = a fonte, **Sampling Point Size** = `Custom Size` `8`, **Padding** = `1`, **Render Mode** = `RASTER_HINTED`, **Atlas Resolution** = `256 × 256`, **Character Set** = `Extended ASCII` → **Generate Font Atlas** → **Save** em `Art/Fonts/`. Depois, **Edit → Project Settings → TextMesh Pro → Settings → Default Font Asset** = o asset gerado. Todo texto novo nasce com ela; troque também a fonte dos 6 textos do HUD.

**A janela e o cursor.** Em vez de desenhar os PNGs num editor de imagem, gere-os:

```csharp
// Caminho: Assets/_Project/Scripts/Editor/FfWindowSpriteMaker.cs
using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace EvilEnemyDefense.EditorTools
{
    // POR QUE: a janela de menu do FF1 (fundo azul, moldura branca dupla) e o
    // cursor "▶" são dois sprites minúsculos; gerá-los por código garante as
    // cores exatas da paleta do protótipo (palette.ts) e o import correto.
    // ESTRATÉGIA: pinta pixel a pixel numa Texture2D, salva como PNG e ajusta
    // o import: Sprite, filtro Point, 1 pixel por unidade (casa com o Canvas
    // de 320×180) e bordas de 9-slice na janela.
    public static class FfWindowSpriteMaker
    {
        private static readonly Color32 Blue = new Color32(0x00, 0x00, 0xA8, 0xFF);
        private static readonly Color32 White = new Color32(0xFF, 0xFF, 0xFF, 0xFF);
        private static readonly Color32 Gray = new Color32(0x7C, 0x7C, 0x7C, 0xFF);
        private static readonly Color32 Clear = new Color32(0, 0, 0, 0);

        [MenuItem("EED/Gerar sprites da janela FF")]
        public static void Generate()
        {
            // Janela 12×12: borda branca, 1 pixel azul, linha cinza, miolo azul.
            WritePng("Assets/_Project/Art/Sprites/ff_window.png", 12, 12, 3, (x, y) =>
            {
                int edge = Math.Min(Math.Min(x, y), Math.Min(11 - x, 11 - y));
                return edge == 0 ? White : edge == 2 ? Gray : Blue;
            });

            // Cursor 5×7: triângulo branco apontando para a direita.
            WritePng("Assets/_Project/Art/Sprites/ff_cursor.png", 5, 7, 0, (x, y) =>
                x <= 4 - Math.Abs(y - 3) ? White : Clear);

            Debug.Log("EED: ff_window.png e ff_cursor.png gerados em Art/Sprites.");
        }

        // Pinta, salva e configura o import de um PNG.
        private static void WritePng(string path, int width, int height, int border, Func<int, int, Color32> pixel)
        {
            var texture = new Texture2D(width, height, TextureFormat.RGBA32, false);
            for (int y = 0; y < height; y++)
                for (int x = 0; x < width; x++)
                    texture.SetPixel(x, y, pixel(x, y));
            File.WriteAllBytes(path, texture.EncodeToPNG());
            UnityEngine.Object.DestroyImmediate(texture);

            AssetDatabase.ImportAsset(path);
            var importer = (TextureImporter)AssetImporter.GetAtPath(path);
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.filterMode = FilterMode.Point;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.alphaIsTransparency = true;
            importer.spritePixelsPerUnit = 1;
            importer.spriteBorder = new Vector4(border, border, border, border);
            importer.SaveAndReimport();
        }
    }
}
```

Rode **EED → Gerar sprites da janela FF**.

### 🧪 Teste rápido
No Canvas, crie **UI → Image**, **Source Image** = `ff_window`, **Image Type** = `Sliced`, tamanho `120 × 60`. A Game view mostra uma caixa azul com moldura branca dupla e cantos nítidos. Apague a imagem de teste.

### Etapa 5B — O menu com cursor

```csharp
// Caminho: Assets/_Project/Scripts/UI/MenuEntry.cs
using System;

namespace EvilEnemyDefense.UI
{
    // POR QUE: a descrição de uma linha de menu, o equivalente ao `MenuItem`
    // do protótipo (ui/menu.ts). As telas montam listas destas.
    // ESTRATÉGIA: só dados e ações. `OnAdjust` recebe -1 ou +1 (setas ◀ ▶);
    // uma linha com OnAdjust é uma linha de "quantidade".
    public class MenuEntry
    {
        public string Label;
        public string Right = "";
        public bool Disabled;
        public Action OnSelect;
        public Action<int> OnAdjust;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/MenuRow.cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace EvilEnemyDefense.UI
{
    // POR QUE: uma linha do menu FF: texto à esquerda, valor à direita e o
    // cursor "▶" quando selecionada.
    // ESTRATÉGIA: herda de Selectable para ganhar a navegação do EventSystem.
    // ◀ ▶ ajustam a quantidade quando a linha tem OnAdjust; senão seguem a
    // navegação normal. Passar o mouse seleciona (o cursor segue o mouse);
    // clique esquerdo confirma ou soma 1; clique direito subtrai 1. Linha
    // desabilitada continua selecionável, para o jogador ler o preço do que
    // ainda não pode comprar, mas não confirma.
    public class MenuRow : Selectable, ISubmitHandler, IPointerClickHandler, ICancelHandler
    {
        [SerializeField] private TMP_Text _label;
        [SerializeField] private TMP_Text _right;
        [SerializeField] private Graphic _cursor;
        [SerializeField] private Color _textColor = Color.white;
        [SerializeField] private Color _disabledColor = new Color(0.66f, 0.66f, 0.66f);

        private MenuList _list;
        private MenuEntry _entry;

        // Selectable usa transições de cor por padrão; o FF usa só o cursor.
        protected override void Awake()
        {
            base.Awake();
            transition = Transition.None;
            if (_cursor != null) _cursor.enabled = false;
        }

        // Mostra uma MenuEntry nesta linha.
        public void Bind(MenuList list, MenuEntry entry)
        {
            _list = list;
            _entry = entry;
            _label.text = entry.Label;
            _right.text = entry.Right ?? "";
            var color = entry.Disabled ? _disabledColor : _textColor;
            _label.color = color;
            _right.color = color;
        }

        // Ganhou o cursor.
        public override void OnSelect(BaseEventData eventData)
        {
            base.OnSelect(eventData);
            _cursor.enabled = true;
            if (_list != null) _list.OnRowSelected(this);
        }

        // Perdeu o cursor.
        public override void OnDeselect(BaseEventData eventData)
        {
            base.OnDeselect(eventData);
            _cursor.enabled = false;
        }

        // Setas: ◀ ▶ ajustam quantidade; ▲ ▼ navegam.
        public override void OnMove(AxisEventData eventData)
        {
            bool horizontal = eventData.moveDir == MoveDirection.Left || eventData.moveDir == MoveDirection.Right;
            if (horizontal && _entry?.OnAdjust != null)
            {
                Adjust(eventData.moveDir == MoveDirection.Right ? 1 : -1);
                eventData.Use();
                return;
            }
            base.OnMove(eventData);
        }

        // Enter confirma.
        public void OnSubmit(BaseEventData eventData) => Activate();

        // Esc volta (quem decide para onde é a tela, via MenuList.Cancelled).
        public void OnCancel(BaseEventData eventData) => _list?.Cancel();

        // Mouse em cima: o cursor vai para esta linha.
        public override void OnPointerEnter(PointerEventData eventData)
        {
            base.OnPointerEnter(eventData);
            Select();
        }

        // Clique: confirma, ou ajusta (+1 esquerdo, -1 direito) nas linhas de quantidade.
        public void OnPointerClick(PointerEventData eventData)
        {
            if (_entry?.OnAdjust != null)
            {
                Adjust(eventData.button == PointerEventData.InputButton.Right ? -1 : 1);
                return;
            }
            if (eventData.button == PointerEventData.InputButton.Left) Activate();
        }

        // Aplica o ajuste e pede à lista para redesenhar os textos.
        private void Adjust(int delta)
        {
            _entry.OnAdjust(delta);
            _list.Refresh();
        }

        // Executa a ação da linha, se habilitada.
        private void Activate()
        {
            if (_entry == null || _entry.Disabled || _entry.OnSelect == null) return;
            _entry.OnSelect();
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/MenuList.cs
using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace EvilEnemyDefense.UI
{
    // POR QUE: a caixa de menu FF inteira: título, linhas, cursor que nunca
    // se perde e rolagem para listas maiores que a caixa (a seleção de
    // Estágio tem 13 linhas).
    // ESTRATÉGIA: a tela entrega uma função que monta as MenuEntry (Bind);
    // Refresh chama essa função de novo depois de toda compra ou ajuste e
    // reaproveita as linhas existentes, então o cursor fica onde estava.
    // A navegação ▲ ▼ é explícita e dá a volta (do fim para o começo). A
    // rolagem move o Content para a linha selecionada ficar visível.
    public class MenuList : MonoBehaviour, IScrollHandler
    {
        [SerializeField] private TMP_Text _title;
        [SerializeField] private RectTransform _viewport;
        [SerializeField] private RectTransform _content;
        [SerializeField] private MenuRow _rowPrefab;
        [SerializeField] private float _rowHeight = 10f;

        // Esc numa linha deste menu.
        public event Action Cancelled;

        // Linha com o cursor.
        public int Index { get; private set; }

        private readonly List<MenuRow> _rows = new List<MenuRow>();
        private Func<List<MenuEntry>> _build;
        private int _count;

        // Liga o menu a uma tela e põe o cursor na linha inicial.
        public void Bind(string title, Func<List<MenuEntry>> build, int startIndex = 0)
        {
            _title.text = title;
            _build = build;
            Index = startIndex;
            _content.anchoredPosition = Vector2.zero;
            Refresh();
            SelectCurrent();
        }

        // Remonta os textos a partir do estado atual do jogo.
        public void Refresh()
        {
            var entries = _build();
            _count = entries.Count;
            while (_rows.Count < _count) _rows.Add(Instantiate(_rowPrefab, _content));

            for (int i = 0; i < _rows.Count; i++)
            {
                bool used = i < _count;
                _rows[i].gameObject.SetActive(used);
                if (used) _rows[i].Bind(this, entries[i]);
            }

            for (int i = 0; i < _count; i++)
            {
                _rows[i].navigation = new Navigation
                {
                    mode = Navigation.Mode.Explicit,
                    selectOnUp = _rows[(i - 1 + _count) % _count],
                    selectOnDown = _rows[(i + 1) % _count],
                };
            }

            Index = Mathf.Clamp(Index, 0, Mathf.Max(0, _count - 1));
        }

        // Põe o cursor (a seleção do EventSystem) na linha Index.
        public void SelectCurrent()
        {
            if (_count == 0 || EventSystem.current == null) return;
            EventSystem.current.SetSelectedGameObject(_rows[Index].gameObject);
        }

        // Chamado pela linha que ganhou o cursor.
        internal void OnRowSelected(MenuRow row)
        {
            Index = _rows.IndexOf(row);
            EnsureVisible();
        }

        // Repassa o Esc para a tela.
        internal void Cancel() => Cancelled?.Invoke();

        // Roda do mouse move o cursor uma linha.
        public void OnScroll(PointerEventData eventData)
        {
            if (_count == 0) return;
            Index = Mathf.Clamp(Index - Math.Sign(eventData.scrollDelta.y), 0, _count - 1);
            SelectCurrent();
        }

        // Clicar fora de qualquer linha tira a seleção; o FF nunca perde o cursor.
        private void Update()
        {
            var system = EventSystem.current;
            if (system == null || _count == 0) return;
            var selected = system.currentSelectedGameObject;
            if (selected == null || !selected.activeInHierarchy) SelectCurrent();
        }

        // Rola o Content para a linha com o cursor caber no Viewport.
        private void EnsureVisible()
        {
            float top = Index * _rowHeight;
            float bottom = top + _rowHeight;
            float scroll = _content.anchoredPosition.y;
            float visible = _viewport.rect.height;
            if (top < scroll) scroll = top;
            else if (bottom > scroll + visible) scroll = bottom - visible;
            _content.anchoredPosition = new Vector2(0f, scroll);
        }
    }
}
```

**Montar os prefabs do menu** (dentro do Canvas `[UI]`, depois arraste para `Prefabs/` e apague da cena):

1. **Prefab `MenuRow`:** **UI → Create Empty** (dentro do Canvas) chamado `MenuRow`, **Width** `200`, **Height** `10`. **Add Component → Image** com **Color** de alfa `0` (invisível, mas faz a linha inteira receber o mouse) e **Add Component → Menu Row**. Filhos:
   - `Cursor`: **UI → Image**, **Source Image** = `ff_cursor`, **Set Native Size**, ancorado à esquerda em `x = 4`.
   - `Label`: **UI → Text - TextMeshPro**, ancorado à esquerda em `x = 12`, **Font Size** `8`, **Wrapping** desligado.
   - `Right`: outro texto, ancorado à direita, **Alignment** à direita.
   - Ligue **Label**, **Right** e **Cursor** no **Menu Row**. Em **Navigation**, clique **Visualize** desligado e deixe `Automatic` (o código troca para Explicit).
2. **Prefab `MenuList`:** **UI → Image** chamado `MenuList`, **Source Image** = `ff_window`, **Image Type** = `Sliced`, **Add Component → Menu List**. Filhos:
   - `Title`: texto no topo-esquerda (`x = 8`, `y = -6`).
   - `Viewport`: **Create Empty** esticado com margens de `7` (esquerda/direita/baixo) e `17` em cima, **Add Component → Rect Mask 2D**.
   - `Content` dentro do `Viewport`: **Create Empty** com âncora **top-stretch** e **Pivot** `(0.5, 1)`, **Add Component → Vertical Layout Group** (desmarque **Child Force Expand → Height**, marque **Control Child Size → Width**) e **Add Component → Content Size Fitter** (**Vertical Fit** = `Preferred Size`).
   - Ligue **Title**, **Viewport**, **Content** e **Row Prefab** (o prefab `MenuRow`) no **Menu List**. **Row Height** = `10`.

### 🧪 Teste rápido
Ainda não há tela usando o menu; o teste vem na Etapa 5C.

### Etapa 5C — As telas

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameSession.cs
using System.Collections.Generic;
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Sim;
using EvilEnemyDefense.UI;
using UnityEngine;

namespace EvilEnemyDefense.Game
{
    // POR QUE: o "dono" do jogo em execução: o PlayerState atual, a última
    // composição do Exército, a velocidade escolhida e qual tela está ativa.
    // É o equivalente ao objeto `game` do protótipo (main.ts).
    // ESTRATÉGIA: as telas são GameObjects irmãos; mostrar uma desliga as
    // outras. Toda alteração do jogador passa por UpdatePlayer, que salva na
    // hora (o save é pequeno e as compras são raras).
    public class GameSession : MonoBehaviour
    {
        [SerializeField] private GameDatabase _database;
        [SerializeField] private StageSelectScreen _stageSelect;
        [SerializeField] private ShopScreen _shop;
        [SerializeField] private ArmyBuilderScreen _armyBuilder;
        [SerializeField] private BattleScreen _battle;

        public GameDatabase Database => _database;
        public GameBalance Balance => _database.balance;
        public PlayerState Player { get; private set; }

        // Quantidade por "tipo:lado", lembrada entre Runs.
        public Dictionary<string, int> Composition { get; } = new Dictionary<string, int>();

        // Velocidade da batalha (1 ou 3), lembrada entre Runs.
        public float Speed { get; set; } = 1f;

        // Carrega o save e abre a seleção de Estágio.
        private void Start()
        {
            Player = SaveService.Load(_database);
            GoToStageSelect();
        }

        // Troca o estado do jogador e grava.
        public void UpdatePlayer(PlayerState next)
        {
            Player = next;
            SaveService.Save(next);
        }

        // Chave da composição: um contador por tipo e por Entrada.
        public static string SlotKey(UnitTypeDefinition type, Side side) => $"{type.id}:{(int)side}";

        public void GoToStageSelect()
        {
            ShowOnly(_stageSelect);
            _stageSelect.Open(this);
        }

        public void GoToShop()
        {
            ShowOnly(_shop);
            _shop.Open(this);
        }

        public void GoToArmyBuilder(StageDefinition stage)
        {
            ShowOnly(_armyBuilder);
            _armyBuilder.Open(this, stage);
        }

        public void StartBattle(StageDefinition stage, List<ArmyEntry> army)
        {
            ShowOnly(_battle);
            _battle.Open(this, stage, army);
        }

        // Ativa uma tela e desativa as outras.
        private void ShowOnly(MonoBehaviour screen)
        {
            _stageSelect.gameObject.SetActive(screen == _stageSelect);
            _shop.gameObject.SetActive(screen == _shop);
            _armyBuilder.gameObject.SetActive(screen == _armyBuilder);
            _battle.gameObject.SetActive(screen == _battle);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/StageSelectScreen.cs
using System.Collections.Generic;
using EvilEnemyDefense.Game;
using TMPro;
using UnityEngine;

namespace EvilEnemyDefense.UI
{
    // POR QUE: a tela inicial (Parte 1 §11): a escada de Estágios e a loja.
    // ESTRATÉGIA: um MenuList com uma linha por Estágio. Trancado aparece
    // como "? ? ?" e desabilitado; os outros dizem NOVO ou LIMPO.
    public class StageSelectScreen : MonoBehaviour
    {
        [SerializeField] private MenuList _menu;
        [SerializeField] private TMP_Text _coins;

        private GameSession _session;

        // Abre a tela com o estado atual do jogador.
        public void Open(GameSession session)
        {
            _session = session;
            _menu.Bind("ESTAGIO", Build);
        }

        // Monta as linhas do menu.
        private List<MenuEntry> Build()
        {
            var player = _session.Player;
            var db = _session.Database;
            _coins.text = $"{player.coins}$";

            var entries = new List<MenuEntry>();
            foreach (var stage in db.stages)
            {
                bool unlocked = Progression.IsStageUnlocked(player, db, stage);
                entries.Add(new MenuEntry
                {
                    Label = unlocked ? stage.displayName.ToUpperInvariant() : "? ? ?",
                    Right = !unlocked ? "TRANCADO" : player.HasCleared(stage.id) ? "LIMPO" : "NOVO",
                    Disabled = !unlocked,
                    OnSelect = () => _session.GoToArmyBuilder(stage),
                });
            }
            entries.Add(new MenuEntry
            {
                Label = "LOJA",
                Right = $"{player.coins}$",
                OnSelect = _session.GoToShop,
            });
            return entries;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/ShopScreen.cs
using System.Collections.Generic;
using EvilEnemyDefense.Game;
using TMPro;
using UnityEngine;

namespace EvilEnemyDefense.UI
{
    // POR QUE: a Meta-progressão (Parte 1 §9): desbloqueios, níveis e Capacidade.
    // ESTRATÉGIA: cada linha chama uma compra do Progression; compra que
    // daria null aparece desabilitada. Tipo ainda trancado por Estágio nem
    // aparece. Depois de comprar, o menu se remonta com os preços novos.
    public class ShopScreen : MonoBehaviour
    {
        [SerializeField] private MenuList _menu;
        [SerializeField] private TMP_Text _coins;

        private GameSession _session;

        // Esc volta para a seleção de Estágio.
        private void Awake()
        {
            _menu.Cancelled += () => _session.GoToStageSelect();
        }

        // Abre a loja.
        public void Open(GameSession session)
        {
            _session = session;
            _menu.Bind("LOJA", Build);
        }

        // Monta as linhas a partir do estado atual.
        private List<MenuEntry> Build()
        {
            var player = _session.Player;
            var balance = _session.Balance;
            _coins.text = $"{player.coins}$";

            var entries = new List<MenuEntry>();
            foreach (var type in _session.Database.unitTypes)
            {
                if (!player.IsUnlocked(type.id))
                {
                    if (!Progression.IsTypeAvailable(player, type)) continue;
                    entries.Add(new MenuEntry
                    {
                        Label = $"DESBLOQUEAR {type.displayName.ToUpperInvariant()}",
                        Right = $"{type.unlockCost}$",
                        Disabled = Progression.BuyUnlock(player, type) == null,
                        OnSelect = () => Apply(Progression.BuyUnlock(_session.Player, type)),
                    });
                    continue;
                }

                int level = player.LevelOf(type.id);
                bool maxed = level >= balance.maxLevel;
                entries.Add(new MenuEntry
                {
                    Label = $"{type.displayName.ToUpperInvariant()} N{level} -> N{level + 1}",
                    Right = maxed ? "MAX" : $"{Progression.LevelUpCost(level, balance)}$",
                    Disabled = Progression.BuyLevel(player, type, balance) == null,
                    OnSelect = () => Apply(Progression.BuyLevel(_session.Player, type, balance)),
                });
            }

            bool capMaxed = player.capacity >= balance.maxCapacity;
            entries.Add(new MenuEntry
            {
                Label = $"CAPACIDADE {player.capacity} -> {player.capacity + 1}",
                Right = capMaxed ? "MAX" : $"{Progression.CapacityCost(player.capacity, balance)}$",
                Disabled = Progression.BuyCapacity(player, balance) == null,
                OnSelect = () => Apply(Progression.BuyCapacity(_session.Player, balance)),
            });

            entries.Add(new MenuEntry { Label = "VOLTAR", OnSelect = _session.GoToStageSelect });
            return entries;
        }

        // Aplica uma compra válida e atualiza os preços.
        private void Apply(PlayerState next)
        {
            if (next == null) return;
            _session.UpdatePlayer(next);
            _menu.Refresh();
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/ArmyBuilderScreen.cs
using System;
using System.Collections.Generic;
using System.Text;
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Game;
using EvilEnemyDefense.Sim;
using TMPro;
using UnityEngine;

namespace EvilEnemyDefense.UI
{
    // POR QUE: a montagem do Exército, a única decisão tática do jogo
    // (ADR 0003). Além de quantos de cada tipo, o jogador decide por qual
    // Entrada cada parcela entra (ADR 0004).
    // ESTRATÉGIA: uma linha de quantidade por Tipo desbloqueado e por Entrada
    // (◀ ▶ ajustam, sem passar da Capacidade). O painel lateral mostra os
    // atributos do tipo sob o cursor e a Guarnição contada por lado, que é o
    // que o jogador precisa para decidir a divisão.
    public class ArmyBuilderScreen : MonoBehaviour
    {
        [SerializeField] private MenuList _menu;
        [SerializeField] private TMP_Text _stageName;
        [SerializeField] private TMP_Text _used;
        [SerializeField] private TMP_Text _inspector;

        private GameSession _session;
        private StageDefinition _stage;
        private readonly List<(UnitTypeDefinition type, Side side)> _rows = new List<(UnitTypeDefinition, Side)>();
        private readonly StringBuilder _text = new StringBuilder();

        // Esc volta para a seleção de Estágio.
        private void Awake()
        {
            _menu.Cancelled += () => _session.GoToStageSelect();
        }

        // Abre a montagem para um Estágio.
        public void Open(GameSession session, StageDefinition stage)
        {
            _session = session;
            _stage = stage;
            _stageName.text = stage.displayName.ToUpperInvariant();
            _menu.Bind("EXERCITO", Build);
        }

        // Quantas Unidades de um tipo entram por um lado.
        private int CountOf(UnitTypeDefinition type, Side side)
        {
            return _session.Composition.TryGetValue(GameSession.SlotKey(type, side), out int n) ? n : 0;
        }

        // Total já escolhido, contra a Capacidade.
        private int Used
        {
            get
            {
                int total = 0;
                foreach (var (type, side) in _rows) total += CountOf(type, side);
                return total;
            }
        }

        // Soma ou subtrai, sem passar da Capacidade nem ficar negativo.
        private void Adjust(UnitTypeDefinition type, Side side, int delta)
        {
            int room = _session.Player.capacity - Used;
            int next = Math.Max(0, CountOf(type, side) + Math.Min(delta, room));
            _session.Composition[GameSession.SlotKey(type, side)] = next;
        }

        // O Exército da Run, a partir das linhas com quantidade.
        private List<ArmyEntry> Army()
        {
            var army = new List<ArmyEntry>();
            foreach (var (type, side) in _rows)
            {
                int count = CountOf(type, side);
                if (count <= 0) continue;
                army.Add(new ArmyEntry { type = type, side = side, count = count, level = _session.Player.LevelOf(type.id) });
            }
            return army;
        }

        // Monta as linhas: dois por Tipo desbloqueado, depois INICIAR RUN e VOLTAR.
        private List<MenuEntry> Build()
        {
            var player = _session.Player;
            _rows.Clear();
            foreach (var type in _session.Database.unitTypes)
            {
                if (!player.IsUnlocked(type.id)) continue;
                _rows.Add((type, Side.Left));
                _rows.Add((type, Side.Right));
            }

            var entries = new List<MenuEntry>();
            foreach (var (type, side) in _rows)
            {
                entries.Add(new MenuEntry
                {
                    Label = $"{(side == Side.Left ? "ESQ" : "DIR")} {type.shortName} N{player.LevelOf(type.id)}",
                    Right = $"< {CountOf(type, side)} >",
                    OnAdjust = delta => Adjust(type, side, delta),
                });
            }

            int used = Used;
            entries.Add(new MenuEntry
            {
                Label = "INICIAR RUN",
                Right = used == 0 ? "VAZIO" : "",
                Disabled = used == 0,
                OnSelect = () => _session.StartBattle(_stage, Army()),
            });
            entries.Add(new MenuEntry { Label = "VOLTAR", OnSelect = _session.GoToStageSelect });

            _used.text = $"{used}/{player.capacity}";
            _used.color = used >= player.capacity ? new Color(0.99f, 0.6f, 0.22f) : new Color(0.66f, 0.66f, 0.66f);
            return entries;
        }

        // O painel lateral acompanha o cursor.
        private void Update()
        {
            if (_stage == null) return;
            _text.Clear();

            if (_menu.Index < _rows.Count)
            {
                var type = _rows[_menu.Index].type;
                int level = _session.Player.LevelOf(type.id);
                var balance = _session.Balance;
                _text.AppendLine(type.displayName.ToUpperInvariant());
                _text.AppendLine($"<color=#A8A8A8>HP  {type.HpAtLevel(level, balance.levelGain)}");
                _text.AppendLine($"DAN {type.DamageAtLevel(level, balance.levelGain)}");
                _text.AppendLine($"ARM {type.armor}");
                _text.AppendLine($"ALC {type.range}");
                _text.AppendLine($"VEL {type.speed}</color>");
            }

            int left = 0, right = 0;
            string main = "";
            foreach (var slot in _stage.garrison)
            {
                if (slot.x < 0) left++;
                else if (slot.x > 0) right++;
                else main = slot.form.displayName;
            }
            _text.AppendLine();
            _text.AppendLine("GUARNICAO");
            _text.AppendLine($"<color=#A8A8A8>ESQ {left}   DIR {right}");
            if (main != "") _text.AppendLine(main);
            _text.Append($"TOTAL {_stage.garrison.Count}</color>");
            _inspector.text = _text.ToString();
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/BattleScreen.cs
using System.Collections.Generic;
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Game;
using EvilEnemyDefense.Sim;
using EvilEnemyDefense.View;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.UI;

namespace EvilEnemyDefense.UI
{
    // POR QUE: a tela da Run: começa a simulação, alterna a velocidade
    // (Espaço ou botão) e, no fim, credita as Moedas uma única vez e mostra
    // o resumo (Parte 1 §11).
    // ESTRATÉGIA: o BattleRunner avisa o fim pelo evento Finished. O "já
    // tinha vencido antes?" é lido ANTES de aplicar o resultado, senão a
    // Primeira Vitória nunca pagaria o bônus. A tecla Espaço é lida pelo
    // Input System direto, porque nenhum elemento de UI está selecionado
    // durante a batalha.
    public class BattleScreen : MonoBehaviour
    {
        [SerializeField] private BattleRunner _runner;
        [SerializeField] private BattleHud _hud;
        [SerializeField] private Button _speedButton;
        [SerializeField] private GameObject _resultPanel;
        [SerializeField] private TMP_Text _resultTitle;
        [SerializeField] private TMP_Text _resultBody;
        [SerializeField] private Button _continueButton;

        private GameSession _session;
        private bool _settled;

        // Liga os botões e o aviso de fim de Run uma vez só.
        private void Awake()
        {
            _runner.Finished += OnFinished;
            _speedButton.onClick.AddListener(ToggleSpeed);
            _continueButton.onClick.AddListener(Continue);
        }

        // Começa uma Run.
        public void Open(GameSession session, StageDefinition stage, List<ArmyEntry> army)
        {
            _session = session;
            _settled = false;
            _resultPanel.SetActive(false);
            _hud.AlreadyCleared = session.Player.HasCleared(stage.id);
            _runner.Speed = session.Speed;
            _runner.Begin(BattleSimulation.Create(stage, army, session.Balance));
            EventSystem.current.SetSelectedGameObject(null);
        }

        // Teclado: Espaço alterna x1/x3; Enter ou Esc saem depois do fim.
        private void Update()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null) return;
            if (keyboard.spaceKey.wasPressedThisFrame) ToggleSpeed();
            if (_settled && (keyboard.enterKey.wasPressedThisFrame || keyboard.numpadEnterKey.wasPressedThisFrame
                             || keyboard.escapeKey.wasPressedThisFrame))
                Continue();
        }

        // Alterna a velocidade e lembra a escolha para a próxima Run.
        private void ToggleSpeed()
        {
            _session.Speed = _session.Speed == 1f ? 3f : 1f;
            _runner.Speed = _session.Speed;
            // Tira o foco do botão, senão Espaço também o "clicaria" de novo.
            EventSystem.current.SetSelectedGameObject(null);
        }

        // Fim da Run: credita as Moedas e mostra de onde veio cada parcela.
        private void OnFinished(BattleState state)
        {
            if (_settled || _session == null) return;
            _settled = true;

            bool won = state.Outcome == BattleOutcome.Victory;
            bool clearedBefore = _session.Player.HasCleared(state.Stage.id);
            var coins = CoinCalculator.Breakdown(state.Stage, BattleSimulation.ResultOf(state), clearedBefore, _session.Balance);
            _session.UpdatePlayer(Progression.AfterRun(_session.Player, state.Stage, coins.Total, won));

            _resultTitle.text = won ? "VITORIA" : "DERROTA";
            _resultTitle.color = won ? new Color(0f, 0.72f, 0f) : new Color(0.99f, 0.6f, 0.22f);
            _resultBody.text =
                $"DANO       {coins.Damage}\n" +
                $"{(won ? "RAPIDEZ" : "TEMPO  ")}    {coins.Time}\n" +
                $"SOBREVIVEM {coins.Survivors}\n" +
                $"VITORIA    {coins.Victory}\n\n" +
                $"<color=#FFFFFF>TOTAL      {coins.Total}$</color>\n\n" +
                "ENTER CONTINUA";
            _resultPanel.SetActive(true);
        }

        // Volta para a seleção de Estágio.
        private void Continue()
        {
            if (!_settled) return;
            _runner.Stop();
            _session.GoToStageSelect();
        }
    }
}
```

### Etapa 5D — O fluxo completo na cena

1. **Desligue o teste:** selecione `BattleTestStarter` e desmarque a caixinha ao lado do nome no Inspector.
2. Em `[Systems]`, **Create Empty** `GameSession` com **Add Component → Game Session**.
3. **Tela de batalha:** dentro do Canvas `[UI]`, **Create Empty** `BattleScreen` (esticado), **Add Component → Battle Screen**. Arraste o `BattleHud` para dentro dele. Dentro de `BattleScreen`:
   - `SpeedButton`: **UI → Button - TextMeshPro**, pequeno, no canto superior direito abaixo do HUD, texto `x1/x3`.
   - `ResultPanel`: **UI → Image** com `ff_window` fatiado, `140 × 96` no centro. Filhos: `Title` (texto) e `Body` (texto em cinza `#A8A8A8`, várias linhas). Acrescente **Add Component → Button** no próprio `ResultPanel` (é o `ContinueButton`: clicar no resumo continua). Desative o `ResultPanel` (caixinha do Inspector).
   - Ligue **Runner**, **Hud**, **Speed Button**, **Result Panel**, **Result Title**, **Result Body** e **Continue Button**.
4. **As três telas de menu:** para cada uma, dentro do Canvas, **UI → Image** esticada (fundo), **Color** `#0000A8`, com o componente da tela:
   - `StageSelectScreen` (**Add Component → Stage Select Screen**): uma caixa `ff_window` no topo com o texto `EVIL ENEMY DEFENSE` e um texto `Coins` à direita; uma instância do prefab `MenuList` ocupando o resto; um texto de rodapé `SETAS MOVEM  ENTER CONFIRMA`. Ligue **Menu** e **Coins**.
   - `ShopScreen` (**Shop Screen**): caixa no topo com `MOEDAS` e `Coins`; `MenuList`; rodapé `ESC VOLTA`. Ligue **Menu** e **Coins**.
   - `ArmyBuilderScreen` (**Army Builder Screen**): caixa no topo com `StageName` à esquerda e `Used` à direita; `MenuList` na metade esquerda (`190` de largura); uma caixa `ff_window` à direita com o texto `Inspector` (várias linhas, **Rich Text** ligado); rodapé `< > AJUSTAM   ESC VOLTA`. Ligue **Menu**, **Stage Name**, **Used** e **Inspector**.
5. No `GameSession`, ligue **Database**, **Stage Select**, **Shop**, **Army Builder** e **Battle**.
6. **Ordem no Canvas:** as telas de menu devem ficar **abaixo** de `BattleScreen` na Hierarchy (desenhadas por cima), mas só uma tela fica ativa por vez, então a ordem só importa para a edição.

**Hierarchy esperada:**

```
Main
├─ Main Camera
├─ [Systems]
│  ├─ BattleRunner
│  ├─ BattleTestStarter      (desativado)
│  └─ GameSession
├─ [World]
│  ├─ Ground
│  ├─ GroundLine
│  └─ BattleView
├─ [UI]  (Canvas)
│  ├─ BattleScreen
│  │  ├─ BattleHud
│  │  ├─ SpeedButton
│  │  └─ ResultPanel         (desativado)
│  ├─ StageSelectScreen
│  ├─ ShopScreen
│  └─ ArmyBuilderScreen
└─ EventSystem
```

### 🧪 Teste rápido
Aperte ▶ e jogue com o teclado só:
1. A seleção de Estágio abre com o cursor em **ACAMPAMENTO GOBLIN** (NOVO) e os outros 11 como `? ? ?`.
2. Enter → montagem. ▼ até `ESQ GUE N1`, ▶ seis vezes: o contador mostra `6/6` em laranja; ▶ de novo não passa de 6.
3. **INICIAR RUN** → a batalha roda; Espaço alterna `x1`/`x3`. No fim, o resumo mostra **VITORIA** com 40 + rapidez + sobreviventes + 80.
4. Enter → o Estágio aparece como **LIMPO** e o Forte dos Orcs abre. **LOJA** → **DESBLOQUEAR ARQUEIRO** aparece com 120$.
5. Saia do Play e entre de novo: Moedas e Estágios vencidos continuam (save).

### ✅ Checkpoint da Fase 5
- O loop inteiro da Parte 1 §3 funciona: escolher Estágio, montar, assistir, receber Moedas, comprar.
- Teclado e mouse funcionam nos menus; o cursor nunca some.
- A composição do Exército é lembrada entre Runs; a velocidade também.
- O save sobrevive a sair e voltar.
- Commit: `feat: menus e fluxo completo`.

#### Problemas comuns
- **Setas não fazem nada:** o `EventSystem` está com o módulo antigo (`StandaloneInputModule`). Selecione-o e clique **Replace with InputSystemUIInputModule**.
- **O cursor some ao clicar no fundo:** confira se o `MenuList` está ativo; o `Update` dele recoloca a seleção.
- **Lista não rola:** o `Content` precisa do **Pivot** `(0.5, 1)` e o `Viewport` do **Rect Mask 2D**; **Row Height** do `MenuList` tem que ser igual à altura do prefab `MenuRow`.
- **Texto com quadradinhos no lugar de letras:** a fonte não tem o caractere; gere o Font Asset com **Extended ASCII** (acentos de "Peão", "Gêmeas").
- **Para apagar o save durante os testes:** **Edit → Clear All PlayerPrefs**.

Próxima fase: **testes automáticos**, para mexer no balanceamento sem medo.

---

# Parte 9 — Implementação Unity: Fase 6 (Testes automáticos)

## Fase 6 — Testes automáticos

> Objetivo desta fase: os testes do protótipo (`battle.test.ts` e `progression.test.ts`, escritos com Vitest) portados para o **Unity Test Framework**, rodando em segundos sem abrir a cena. Eles protegem as regras da Parte 1 §4 e as metas de balanceamento da §7.

**Conceitos novos:**
- **Unity Test Framework e NUnit:** o sistema de testes da Unity. Um teste é um método com `[Test]` dentro de uma classe; `Assert.AreEqual(esperado, obtido)` falha o teste se os valores diferirem. A janela **Test Runner** lista e roda os testes.
- **Edit Mode:** testes que rodam no Editor sem entrar em Play. Servem perfeitamente para código C# puro como a simulação.
- **Assembly Definition (`.asmdef`):** divide os scripts em "pacotes" compilados separadamente. O projeto de testes precisa enxergar o código do jogo, e isso só é possível com o jogo num assembly com nome.

### Etapa 6A — Assemblies

1. Na Project, botão direito em `Assets/_Project/Scripts` → **Create → Scripting → Assembly Definition** → nome `EvilEnemyDefense`. No Inspector, em **Assembly Definition References**, clique **+** três vezes e escolha `Unity.TextMeshPro`, `Unity.InputSystem` e `UnityEngine.UI`. **Apply**.
2. Botão direito em `Scripts/Editor` → **Create → Scripting → Assembly Definition** → `EvilEnemyDefense.Editor`. Referência: `EvilEnemyDefense`. Em **Platforms**, desmarque **Any Platform** e marque só **Editor**. **Apply**.
3. Botão direito em `Assets/_Project` → **Create → Testing → Tests Assembly Folder**. Renomeie a pasta para `Tests` e o `.asmdef` dentro dela para `EvilEnemyDefense.Tests`. No Inspector do asmdef: referência a `EvilEnemyDefense`; **Platforms** só **Editor**. **Apply**.

> Depois do passo 1 o Console pode mostrar erros por alguns segundos enquanto recompila; se continuarem, falta uma das três referências.

### Etapa 6B — Os testes

```csharp
// Caminho: Assets/_Project/Tests/TestData.cs
using System.Collections.Generic;
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Sim;
using UnityEditor;
using UnityEngine;

namespace EvilEnemyDefense.Tests
{
    // POR QUE: os testes usam os dados reais do jogo (os assets criados na
    // Fase 1), para que um ajuste de balanceamento que quebre uma meta da
    // Parte 1 §7 apareça aqui.
    // ESTRATÉGIA: carrega o GameDatabase pelo caminho com o AssetDatabase
    // (permitido em testes de Edit Mode) e oferece atalhos para montar
    // Exércitos e Estágios de teste com Guarnição arbitrária.
    public static class TestData
    {
        private static GameDatabase _db;

        public static GameDatabase Db =>
            _db != null ? _db : _db = AssetDatabase.LoadAssetAtPath<GameDatabase>("Assets/_Project/Data/GameDatabase.asset");

        public static GameBalance Balance => Db.balance;

        public static StageDefinition Stage(string id) => Db.Stage(id);

        // Uma parcela do Exército pelo id do tipo.
        public static ArmyEntry Entry(string typeId, int count, int level = 1, Side side = Side.Left)
        {
            return new ArmyEntry { type = Db.UnitType(typeId), count = count, level = level, side = side };
        }

        public static List<ArmyEntry> Army(params ArmyEntry[] entries) => new List<ArmyEntry>(entries);

        // Um Estágio fora da escada, com a Guarnição dada.
        public static StageDefinition StageWith(params (string formId, double x)[] slots)
        {
            var stage = ScriptableObject.CreateInstance<StageDefinition>();
            stage.id = "test";
            stage.displayName = "Teste";
            stage.baseReward = 40;
            stage.firstClearBonus = 60;
            foreach (var (formId, x) in slots)
            {
                var form = AssetDatabase.LoadAssetAtPath<DefenderFormDefinition>($"Assets/_Project/Data/Forms/{formId}.asset");
                stage.garrison.Add(new GarrisonSlot { form = form, x = x });
            }
            return stage;
        }

        public static BattleState Create(StageDefinition stage, List<ArmyEntry> army) =>
            BattleSimulation.Create(stage, army, Balance);

        public static BattleResult Run(StageDefinition stage, List<ArmyEntry> army) =>
            BattleSimulation.Run(stage, army, Balance);
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/BattleSimulationTests.cs
using System;
using System.Linq;
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Sim;
using NUnit.Framework;
using static EvilEnemyDefense.Tests.TestData;

namespace EvilEnemyDefense.Tests
{
    // POR QUE: as regras da Run (Parte 1 §4), uma por teste. Se alguém mudar
    // o tick e quebrar uma regra de design, o teste diz qual.
    // ESTRATÉGIA: porta de battle.test.ts do protótipo, com os mesmos
    // cenários e números.
    public class BattleSimulationTests
    {
        private static StageDefinition Goblin => Stage("goblin-camp");

        [Test]
        public void VenceQuandoAGuarnicaoInteiraCai()
        {
            var result = Run(Goblin, Army(Entry("warrior", 10, level: 6)));
            Assert.AreEqual(BattleOutcome.Victory, result.Outcome);
            Assert.AreEqual(1.0, result.DamageFraction);
        }

        [Test]
        public void PerdeQuandoTodasAsUnidadesMorrem()
        {
            var result = Run(Goblin, Army(Entry("archer", 1)));
            Assert.AreEqual(BattleOutcome.Defeat, result.Outcome);
            Assert.AreEqual(0, result.Survivors);
        }

        [Test]
        public void MatarParteDaGuarnicaoNaoVence()
        {
            var state = Create(StageWith(("goblin", 0), ("tower", 60)), Army(Entry("warrior", 14, level: 12)));
            bool sawPartial = false;
            for (int i = 0; i < 1200 && state.Outcome == BattleOutcome.Running; i++)
            {
                BattleSimulation.Step(state);
                if (state.Defenders.Count == 1) sawPartial = true;
                if (sawPartial && state.Outcome == BattleOutcome.Running) break;
            }
            Assert.IsTrue(sawPartial);
            Assert.AreEqual(BattleOutcome.Running, state.Outcome);
        }

        [Test]
        public void NaoExisteTempoLimite()
        {
            var result = Run(Goblin, Army(Entry("bomber", 4, level: 3)));
            Assert.AreEqual(BattleOutcome.Victory, result.Outcome);
            Assert.Less(result.Ticks, Balance.MaxTicks);
        }

        [Test]
        public void ArmaduraSubtraiUmValorFixo()
        {
            // Guerreiro tem 3 de Armadura; a adaga do goblin bate 20 → 17 por golpe.
            var state = Create(Goblin, Army(Entry("warrior", 1)));
            var unit = state.Units[0];
            while (unit.Hp == unit.MaxHp && state.Outcome == BattleOutcome.Running) BattleSimulation.Step(state);
            Assert.AreEqual(17, unit.MaxHp - unit.Hp);
        }

        [Test]
        public void GolpeNuncaValeMenosQue1()
        {
            Assert.AreEqual(1, BattleSimulation.DamageAfterArmor(6, 16));
        }

        [Test]
        public void UnidadeEntraPelaSuaEntradaECaminhaParaOCentro()
        {
            var state = Create(Goblin, Army(Entry("warrior", 1, side: Side.Right)));
            Assert.GreaterOrEqual(state.Units[0].X, Balance.entryX);
            for (int i = 0; i < 40; i++) BattleSimulation.Step(state);
            Assert.Less(state.Units[0].X, Balance.entryX);
        }

        [Test]
        public void AsDuasEntradasConvergemParaOCentro()
        {
            var state = Create(Goblin, Army(Entry("warrior", 2, side: Side.Left), Entry("warrior", 2, side: Side.Right)));
            Assert.IsTrue(state.Units.Where(u => u.Side == Side.Left).All(u => u.X < 0));
            Assert.IsTrue(state.Units.Where(u => u.Side == Side.Right).All(u => u.X > 0));
            for (int i = 0; i < 100 && state.Outcome == BattleOutcome.Running; i++) BattleSimulation.Step(state);
            foreach (var unit in state.Units) Assert.Less(Math.Abs(unit.X), Balance.entryX);
        }

        [Test]
        public void UnidadeNuncaRecua()
        {
            // Um goblin no centro e outro atrás da coluna da esquerda.
            var state = Create(StageWith(("goblin", 0), ("goblin", -160)), Army(Entry("bomber", 1)));
            double furthest = state.Units[0].X;
            for (int i = 0; i < 200 && state.Outcome == BattleOutcome.Running; i++)
            {
                BattleSimulation.Step(state);
                if (state.Units.Count == 0) break;
                Assert.GreaterOrEqual(state.Units[0].X, furthest - 0.001);
                furthest = Math.Max(furthest, state.Units[0].X);
            }
        }

        [Test]
        public void CriaturaAndaConstrucaoNao()
        {
            var state = Create(StageWith(("goblin", 0), ("tower", 30)), Army(Entry("warrior", 1)));
            var creature = state.Defenders[0];
            var building = state.Defenders[1];
            double start = creature.X;
            for (int i = 0; i < 20; i++) BattleSimulation.Step(state);
            Assert.Less(creature.X, start);
            Assert.AreEqual(30.0, building.X);
        }

        [Test]
        public void ForemostAcertaQuemEstaMaisPerto()
        {
            var state = Create(Goblin, Army(Entry("warrior", 3)));
            for (int i = 0; i < 200 && state.Outcome == BattleOutcome.Running; i++)
            {
                BattleSimulation.Step(state);
                var wounded = state.Units.Where(u => u.Hp < u.MaxHp).ToList();
                if (wounded.Count == 0) continue;
                var nearest = state.Units.OrderBy(u => Math.Abs(u.X)).First();
                Assert.AreEqual(nearest.Id, wounded[0].Id);
                return;
            }
        }

        [Test]
        public void DanoEmAreaAcertaMaisDeUmaUnidade()
        {
            var state = Create(StageWith(("troll", 0)), Army(Entry("warrior", 6, level: 8)));
            for (int i = 0; i < 600 && state.Outcome == BattleOutcome.Running; i++)
            {
                BattleSimulation.Step(state);
                if (state.Units.Count(u => u.Hp < u.MaxHp) > 1) return;
            }
            Assert.Fail("a clava do troll nunca acertou duas Unidades juntas");
        }

        [Test]
        public void MesmaRunMesmoResultado()
        {
            var army = Army(
                Entry("warrior", 4, level: 3, side: Side.Left),
                Entry("archer", 3, level: 2, side: Side.Right),
                Entry("bomber", 1, level: 1, side: Side.Left));
            var stage = Stage("wood-outpost");
            Assert.AreEqual(Run(stage, army), Run(stage, army));
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/CoinTests.cs
using EvilEnemyDefense.Game;
using EvilEnemyDefense.Sim;
using NUnit.Framework;
using static EvilEnemyDefense.Tests.TestData;

namespace EvilEnemyDefense.Tests
{
    // POR QUE: as regras de Moedas (Parte 1 §8).
    // ESTRATÉGIA: resultados montados à mão isolam a fórmula da simulação.
    public class CoinTests
    {
        private static CoinBreakdown Coins(BattleResult result, bool cleared, bool live = false) =>
            CoinCalculator.Breakdown(Stage("goblin-camp"), result, cleared, Balance, live);

        [Test]
        public void TotalEASomaDasQuatroParcelas()
        {
            var b = Coins(Run(Stage("goblin-camp"), Army(Entry("warrior", 10, level: 6))), false);
            Assert.AreEqual(b.Damage + b.Time + b.Survivors + b.Victory, b.Total);
        }

        [Test]
        public void VencerRapidoPagaMaisQueVencerDevagar()
        {
            var fast = new BattleResult(BattleOutcome.Victory, 200, 1, 3, 6);
            var slow = new BattleResult(BattleOutcome.Victory, 900, 1, 3, 6);
            Assert.Greater(Coins(fast, true).Time, Coins(slow, true).Time);
        }

        [Test]
        public void PerderDevagarPagaMaisQuePerderRapido()
        {
            var quick = new BattleResult(BattleOutcome.Defeat, 40, 0.1, 0, 5);
            var longer = new BattleResult(BattleOutcome.Defeat, 600, 0.1, 0, 5);
            Assert.Greater(Coins(longer, false).Time, Coins(quick, false).Time);
        }

        [Test]
        public void PrimeiraVitoriaPagaOBonusUmaVezSo()
        {
            var result = Run(Stage("goblin-camp"), Army(Entry("warrior", 10, level: 6)));
            Assert.Greater(Coins(result, false).Total, Coins(result, true).Total);
        }

        [Test]
        public void ContadorAoVivoNuncaContaAVitoriaAntesDaHora()
        {
            var state = Create(Stage("goblin-camp"), Army(Entry("warrior", 8, level: 6)));
            for (int i = 0; i < 30; i++) BattleSimulation.Step(state);
            var live = Coins(BattleSimulation.ResultOf(state), false, live: true);
            Assert.AreEqual(0, live.Victory);
            Assert.Greater(live.Total, 0);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/ProgressionTests.cs
using EvilEnemyDefense.Game;
using NUnit.Framework;
using static EvilEnemyDefense.Tests.TestData;

namespace EvilEnemyDefense.Tests
{
    // POR QUE: as regras da Meta-progressão (Parte 1 §9).
    // ESTRATÉGIA: porta dos testes de compras e de abertura de Estágios de
    // progression.test.ts.
    public class ProgressionTests
    {
        private static PlayerState Rich()
        {
            var player = Progression.Initial(Db);
            player.coins = 1000;
            return player;
        }

        [Test]
        public void RecusaACompraQuandoFaltamMoedas()
        {
            var player = Progression.Initial(Db);
            Assert.IsNull(Progression.BuyLevel(player, Db.UnitType("warrior"), Balance));
            Assert.IsNull(Progression.BuyCapacity(player, Balance));
            Assert.IsNull(Progression.BuyUnlock(player, Db.UnitType("archer")));
        }

        [Test]
        public void DesbloquearEntregaNoNivel1ECobraOCusto()
        {
            var archer = Db.UnitType("archer");
            var next = Progression.BuyUnlock(Rich(), archer);
            Assert.AreEqual(1, next.LevelOf("archer"));
            Assert.AreEqual(1000 - archer.unlockCost, next.coins);
        }

        [Test]
        public void NaoDesbloqueiaDuasVezes()
        {
            Assert.IsNull(Progression.BuyUnlock(Rich(), Db.UnitType("warrior")));
        }

        [Test]
        public void TipoTrancadoPorEstagioNaoPodeSerComprado()
        {
            Assert.IsNull(Progression.BuyUnlock(Rich(), Db.UnitType("pawn")));
        }

        [Test]
        public void UpgradesFicamMaisCaros()
        {
            Assert.Greater(Progression.LevelUpCost(2, Balance), Progression.LevelUpCost(1, Balance));
            Assert.Greater(Progression.CapacityCost(10, Balance), Progression.CapacityCost(6, Balance));
        }

        [Test]
        public void ComprasNaoMutamOEstadoAnterior()
        {
            var rich = Rich();
            Progression.BuyLevel(rich, Db.UnitType("warrior"), Balance);
            Assert.AreEqual(1000, rich.coins);
            Assert.AreEqual(1, rich.LevelOf("warrior"));
        }

        [Test]
        public void PrimeiroEstagioComecaAbertoEOsOutrosNao()
        {
            var player = Progression.Initial(Db);
            Assert.IsTrue(Progression.IsStageUnlocked(player, Db, Db.stages[0]));
            Assert.IsFalse(Progression.IsStageUnlocked(player, Db, Db.stages[1]));
        }

        [Test]
        public void VencerAbreOProximoPerderNao()
        {
            var player = Progression.Initial(Db);
            player = Progression.AfterRun(player, Db.stages[0], 10, false);
            Assert.IsFalse(Progression.IsStageUnlocked(player, Db, Db.stages[1]));
            player = Progression.AfterRun(player, Db.stages[0], 60, true);
            Assert.IsTrue(Progression.IsStageUnlocked(player, Db, Db.stages[1]));
            Assert.AreEqual(70, player.coins);
        }

        [Test]
        public void PrimeiraVitoriaSoContaUmaVez()
        {
            var player = Progression.AfterRun(Progression.Initial(Db), Db.stages[0], 60, true);
            player = Progression.AfterRun(player, Db.stages[0], 10, true);
            Assert.AreEqual(1, player.cleared.FindAll(id => id == Db.stages[0].id).Count);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/LadderBalanceTests.cs
using System;
using System.Collections.Generic;
using System.Linq;
using EvilEnemyDefense.Data;
using EvilEnemyDefense.Game;
using EvilEnemyDefense.Sim;
using NUnit.Framework;
using static EvilEnemyDefense.Tests.TestData;

namespace EvilEnemyDefense.Tests
{
    // POR QUE: as metas de balanceamento da Parte 1 §7. São os testes que
    // quebram quando alguém mexe num número da tabela sem pensar no todo.
    // ESTRATÉGIA: Runs inteiras com os dados reais. O último teste simula um
    // jogador "ganancioso" (compra sempre o mais barato, divide o Exército
    // sem pensar) jogando até o Estágio 10, e mede quantas Runs ele leva.
    public class LadderBalanceTests
    {
        private static List<ArmyEntry> Starting() => Army(Entry("warrior", 6));

        [Test]
        public void Estagio1EVencivelComOExercitoInicialConcentrado()
        {
            var together = Run(Db.stages[0], Starting());
            Assert.AreEqual(BattleOutcome.Victory, together.Outcome);
            Assert.LessOrEqual(together.Survivors, 3);

            var split = Run(Db.stages[0], Army(Entry("warrior", 3, side: Side.Left), Entry("warrior", 3, side: Side.Right)));
            Assert.AreEqual(BattleOutcome.Defeat, split.Outcome);
        }

        [Test]
        public void DoEstagio2EmDianteOExercitoInicialNaoPassa()
        {
            foreach (var stage in Db.stages.Skip(1))
                Assert.AreEqual(BattleOutcome.Defeat, Run(stage, Starting()).Outcome, stage.displayName);
        }

        [Test]
        public void RunVencidaDuraEntre4E90Segundos()
        {
            var strong = Army(
                Entry("warrior", 12, level: 20, side: Side.Left),
                Entry("warrior", 12, level: 20, side: Side.Right),
                Entry("archer", 12, level: 20, side: Side.Left),
                Entry("bomber", 6, level: 20, side: Side.Right));
            foreach (var stage in Db.stages)
            {
                var result = Run(stage, strong);
                Assert.AreEqual(BattleOutcome.Victory, result.Outcome, stage.displayName);
                double seconds = result.Ticks * Balance.TickSeconds;
                Assert.Greater(seconds, 4, stage.displayName);
                Assert.Less(seconds, 90, stage.displayName);
            }
        }

        [Test]
        public void JogadorGananciosoChegaAoEstagio10NumNumeroRazoavelDeRuns()
        {
            const int maxRuns = 220;
            var target = Db.stages[9];
            var player = Progression.Initial(Db);
            int runs = 0;

            while (!player.HasCleared(target.id) && runs < maxRuns)
            {
                // Tenta o Estágio novo de vez em quando; no resto, farma o melhor que já vence.
                var frontier = Db.stages.LastOrDefault(s => Progression.IsStageUnlocked(player, Db, s)) ?? Db.stages[0];
                var farm = Db.stages.LastOrDefault(s => player.HasCleared(s.id)) ?? frontier;
                var attempt = runs % 4 == 0 ? frontier : farm;

                var result = Run(attempt, GreedyArmy(player));
                int coins = CoinCalculator.Breakdown(attempt, result, player.HasCleared(attempt.id), Balance).Total;
                player = Progression.AfterRun(player, attempt, coins, result.Won);
                runs++;

                // Gasta tudo o que puder antes da próxima Run.
                for (var next = CheapestPurchase(player); next != null; next = CheapestPurchase(player))
                    player = next;
            }

            Assert.Less(runs, maxRuns, $"Runs até o Estágio 10: {runs}");
            Assert.Greater(runs, 4, "a progressão virou passeio");
        }

        // 60% da Capacidade na linha de frente, 40% no que tiver de alcance, metade de cada lado.
        private static List<ArmyEntry> GreedyArmy(PlayerState player)
        {
            var unlocked = Db.unitTypes.Where(t => player.IsUnlocked(t.id)).ToList();
            var front = unlocked.Where(t => t.id == "warrior" || t.id == "lancer").ToList();
            var back = unlocked.Where(t => t.id == "bomber" || t.id == "archer").ToList();
            var army = new List<ArmyEntry>();
            int left = player.capacity;

            void Take(List<UnitTypeDefinition> types, double share)
            {
                if (types.Count == 0) return;
                int each = Math.Max(1, (int)Math.Floor(player.capacity * share / types.Count));
                foreach (var type in types)
                {
                    int count = Math.Min(each, left);
                    if (count <= 0) return;
                    left -= count;
                    int half = (count + 1) / 2;
                    int level = player.LevelOf(type.id);
                    army.Add(new ArmyEntry { type = type, level = level, count = half, side = Side.Left });
                    army.Add(new ArmyEntry { type = type, level = level, count = count - half, side = Side.Right });
                }
            }

            Take(front, 0.6);
            Take(back, 0.4);
            if (left > 0 && army.Count > 0) army[0].count += left;
            return army.Where(e => e.count > 0).ToList();
        }

        // A compra válida mais barata (ordem estável: empate fica com a primeira da loja).
        private static PlayerState CheapestPurchase(PlayerState player)
        {
            var options = new List<(int cost, PlayerState next)>();
            foreach (var type in Db.unitTypes)
            {
                options.Add(player.IsUnlocked(type.id)
                    ? (Progression.LevelUpCost(player.LevelOf(type.id), Balance), Progression.BuyLevel(player, type, Balance))
                    : (type.unlockCost, Progression.BuyUnlock(player, type)));
            }
            options.Add((Progression.CapacityCost(player.capacity, Balance), Progression.BuyCapacity(player, Balance)));
            return options.Where(o => o.next != null).OrderBy(o => o.cost).Select(o => o.next).FirstOrDefault();
        }
    }
}
```

### Etapa 6C — Rodar

1. **Window → General → Test Runner** → aba **EditMode** → **Run All**.
2. Todos os testes ficam verdes em alguns segundos (o do jogador ganancioso é o mais lento).

### 🧪 Teste rápido
Abra o asset `Forms/goblin` e mude o dano da adaga de `20` para `21`. Rode os testes: `ArmaduraSubtraiUmValorFixo` fica vermelho (esperava 17, obteve 18). Volte o valor para `20` (ou rode **EED → Criar ou atualizar dados iniciais**).

### ✅ Checkpoint da Fase 6
- 4 classes de teste, todas verdes.
- Commit: `test: regras da Run, moedas, progressão e balanceamento`.

#### Problemas comuns
- **Os testes não aparecem no Test Runner:** o asmdef de testes não está marcado só para **Editor**, ou não referencia `EvilEnemyDefense`.
- **`NullReferenceException` em `TestData.Db`:** o asset não está em `Assets/_Project/Data/GameDatabase.asset` (rode a ferramenta da Fase 1).
- **Um teste de balanceamento falha, mas as regras estão certas:** compare a Run com o protótipo. Os culpados mais comuns são arredondamento (`Mathf.RoundToInt` em vez de `MathUtil.RoundHalfUp`), `float` no lugar de `double`, ou a ordem dos passos do tick.

---

# Parte 10 — Implementação Unity: Fase 7 (Build e Próximos Passos)

## Fase 7 — Build e Próximos Passos

> Objetivo desta fase: builds jogáveis de PC (Windows) e WebGL.

### 7.1 Configurações comuns

1. **File → Build Profiles** (Unity 6; em versões anteriores, **File → Build Settings**) → **Scene List** → **Add Open Scenes** com a `Main` aberta.
2. **Edit → Project Settings → Player**: **Company Name**, **Product Name** = `Evil Enemy Defense`, **Default Icon**.
3. **Resolution and Presentation**: resolução padrão `1280 × 720` (4× o 320×180 do jogo).

### 7.2 PC (Windows)

**Build Profiles → Windows** → **Switch Platform** → **Build** → pasta `Builds/Windows`.

### 7.3 WebGL

1. **Build Profiles → Web** → **Switch Platform**.
2. **Player → Publishing Settings**: **Compression Format** = `Gzip` e marque **Decompression Fallback** (hospedagens simples como GitHub Pages não enviam os cabeçalhos de compressão que a Unity espera).
3. **Player → Resolution and Presentation**: **Default Canvas Width/Height** = `1280 × 720`.
4. **Build And Run** → pasta `Builds/WebGL`. A Unity abre o jogo num servidor local.

> **Save no WebGL:** o `PlayerPrefs` vira armazenamento do navegador (IndexedDB), por domínio. Mudar o endereço de publicação começa um save novo.

### ✅ Checkpoint da Fase 7
- A build de Windows abre direto na seleção de Estágio, e o save persiste entre execuções.
- A build WebGL roda no navegador com teclado e mouse.

### 7.4 Próximos passos

Pela ordem do que mais afeta o pilar "assistir tem que ser divertido" (Parte 1 §16):

1. **Leitura visual:** projéteis para as Armas de longo alcance (flechas, cuspe, bala de canhão), números de dano flutuando e um "puff" quando um Defensor cai.
2. **Áudio:** golpes, disparos, queda de Defensor, fanfarra. Um `AudioSource` por tipo de som, disparado pelas views quando `Firing` liga ou o HP cai.
3. **Pular a Run:** como a simulação é determinística, `BattleSimulation.Run` já dá o resultado instantâneo; falta só a tela que o apresenta.
4. **Integer scaling:** o guia usa uma câmera ortográfica simples. Para pixels perfeitamente quadrados em qualquer resolução, experimente o componente **Pixel Perfect Camera** do URP com **Reference Resolution** 320×180.
5. **Conteúdo pós-Castelo** e **mobile**, quando as decisões em aberto da Parte 1 §16 forem tomadas.
