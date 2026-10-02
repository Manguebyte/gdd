# GDD — Guerreiro da Masmorra

> Documento vivo. Escrito a partir do jogo publicado ([abraaovilanova/guerreiro-da-masmorra](https://github.com/abraaovilanova/guerreiro-da-masmorra): web em `index.html` único + Android via Capacitor), que é a referência de comportamento. A Parte 1 descreve o que o código faz hoje (incluindo os sistemas já escritos mas desligados) e a Parte 2 ensina a reconstruir o jogo em Unity.
> Onde o `GDD.md` do próprio repositório ficou desatualizado em relação ao código, este documento segue o **código** e registra a diferença na §17. Números marcados como **valor inicial** são o balanceamento atual, não decisões fechadas.

**Gênero:** RPG tático por turnos com reações em tempo real (QTE) · **Dimensão:** 2D · **Plataformas:** Web (H5 Games/AdSense) e Android; no port Unity, Android e WebGL · **Orientação:** retrato · **Engine do port:** Unity 6

## Índice

**Parte 1 — GDD**
1. [Visão Geral](#1-visão-geral)
2. [Loop Principal](#2-loop-principal)
3. [Heróis](#3-heróis)
4. [Turnos e Iniciativa](#4-turnos-e-iniciativa)
5. [Reações (QTE)](#5-reações-qte)
6. [Ações do Herói](#6-ações-do-herói)
7. [Fúria, Exaustão e Cansaço](#7-fúria-exaustão-e-cansaço)
8. [Monstros](#8-monstros)
9. [Masmorras](#9-masmorras)
10. [Acampamento e Mercado](#10-acampamento-e-mercado)
11. [Mago Arcanista (cartas)](#11-mago-arcanista-cartas)
12. [Mapa-múndi e Recrutamento](#12-mapa-múndi-e-recrutamento)
13. [Estilo Visual e Áudio](#13-estilo-visual-e-áudio)
14. [Interface e Controles](#14-interface-e-controles)
15. [Persistência, Nuvem e Monetização](#15-persistência-nuvem-e-monetização)
16. [Escopo do MVP](#16-escopo-do-mvp)
17. [Em aberto](#17-em-aberto)

**Parte 2 — Guia de Implementação Unity**
- [Convenções, arquitetura e fases](#parte-2--guia-de-implementação-unity)
- Partes 3 a 13: Fases 0 a 10 (setup → testes → build → pós-MVP)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Pitch:** um RPG de turnos em que o seu reflexo decide a luta, não só a sua build. Cada golpe inimigo vira um evento de reação: toque no instante certo para aparar, arraste para cima para pular, deslize para o lado para esquivar. Defender bem enche a Fúria, que vira especiais com minijogos de precisão. Desça 33 masmorras de 3 ondas cada, volte ao acampamento com ouro e fique mais forte.
- **Gênero — Definido:** RPG tático por turnos com QTE de reação a cada golpe inimigo.
- **Dimensão e câmera — Definido:** 2D. O protótipo desenha um corredor de masmorra em perspectiva (herói no meio, inimigos num dos cantos do fundo); o port pode começar com um layout lateral (ver Parte 2).
- **Plataformas — Definido:** Web (H5 Games Ads/AdSense, no navegador, sem conta obrigatória) e Android. Tela em **retrato**, pensada para o polegar.
- **Pilar de design — Definido:** **o combate é ativo, não passivo.** Atributos e gemas importam, mas o reflexo do jogador decide boa parte da batalha: um parry perfeito zera o dano, revida e cansa o inimigo.
- **Fantasia central:** o cavaleiro sozinho que aprende o padrão de cada monstro pelo nome do golpe e passa a aparar tudo.
- **Referências:** Clair Obscur: Expedition 33 e Paper Mario (turnos com reação em tempo real), Final Fantasy Tactics (mapa-múndi), jogos mobile casuais (tochas que recarregam, baú diário).

## 2. Loop Principal

```
 Acampamento ──► (gasta 1 Tocha) ──► Masmorra Nv. N: Onda 1 ► Onda 2 ► Onda 3 (Chefe) ──► Vitória: ouro, Soul,
  (atributos,                                                                              pergaminho de gema
   Mercado,                                                                                 (Nv. 1 e múltiplos de 5),
   Baú do Dia)  ◄─────────────── Derrota: perde metade do ouro desta masmorra ◄────────────  Masmorra N+1
       ▲                         (ou revive com 1 Soul de onde parou)                              │
       └───────────────────────────────────────────────────────────────────────────────────────────┘
 Masmorra 33 vencida ► "Você venceu o jogo" ► NG+ (volta à masmorra 1, mantém tudo, monstros mais fortes)
```

- **Definido:** a primeira entrada no jogo abre o **Campo de Treinamento** (tutorial) em vez de uma masmorra.
- **Definido:** cada entrada em masmorra custa 1 **Tocha**; as Tochas recarregam com o tempo real (§10.2).
- **Definido:** vencer uma masmorra avança o nível de masmorra em 1 e sorteia a cor da próxima.

## 3. Heróis

| Herói | Classe de combate | HP | ATK | DEF | Como entra na equipe |
|---|---|---|---|---|---|
| **Guerreiro** ⚔️ | guerreiro (fúria/parry) | 60 | 10 | 3 | Inicial |
| **Mago Arcanista** 🃏 | mago (cartas, §11) | 45 | 8 | 2 | Duelo na cidade 0 do mapa |
| **Caçadora** 🏹 | guerreiro | 55 | 12 | 2 | Duelo na cidade 2 |
| **Lanceiro** 🔱 | guerreiro | 75 | 11 | 5 | Duelo na cidade 4 |
| **Monge** 📿 | guerreiro | 52 | 9 | 3 | Duelo na cidade 6 |

- **Definido:** cada herói tem progressão própria e independente (atributos comprados, Habilidade e gemas).
- **Definido:** Caçadora, Lanceiro e Monge usam o mesmo motor do Guerreiro. A diferença hoje é de atributos, sprite e uma regra: **só o Guerreiro ganha Fúria com o ataque simples**; os outros só ganham defendendo ou apanhando.
- **Definido (estado atual do jogo publicado):** só o Guerreiro está ativo. Recrutamento, troca de herói e mapa-múndi estão escritos no código mas comentados como "patch futuro" (ver §16).

## 4. Turnos e Iniciativa

- **Definido:** cada rodada monta uma **fila de iniciativa**: cada participante vivo rola `velocidade-base + d(0..5)` e a fila é ordenada do maior para o menor (empate: o herói primeiro). A fila é mostrada numa barra no topo.
- Velocidades-base **(valor inicial):** herói 10 (qualquer herói) · Servo 12 · Gnomo 11 · Ladrão 10 · Arqueiro, Goblin da Tocha, Cobra, Aranha 9 · Monge, Goblin Dinamite, Gnoll, Lagarto, Peixe Arpoador 8 · Lanceiro, Minotauro, Caveira, Peixe-Remo, Xamã, Cavaleiro Selvagem 7 · Cavaleiro-chefe, Rei Slime, Urso, Minotauro Ancestral, Panda 6 · Árvore Anciã 5 · Tartaruga, Troll 4. Sem valor: 8.
- **Definido:** um chefe em **Fase 2** (§8.4) entra na fila **2 a 3 vezes** por rodada, com +3 na rolagem.
- **Definido:** quem morre antes da sua vez é pulado. Fila esgotada = nova rodada.
- **Definido:** monstro **exausto** (§7.3) perde a vez e desconta 1 das rodadas de exaustão.

## 5. Reações (QTE)

Todo golpe de monstro abre um **círculo de reação** que fecha em `T` milissegundos. A cor e o ícone dizem a reação exigida.

| Tipo | Ícone | Gesto (toque) | Teclado | Sucesso | Falha |
|---|---|---|---|---|---|
| **Parry** | 🛡️ | tocar | Espaço/Enter | Nos últimos **32%** do tempo: **PARRY PERFEITO**. Antes disso: **bloqueio** | Dano cheio |
| **Salto** | ⬆️ | arrastar para cima | ↑ | Esquiva + janela de **Ataque Aéreo** | Dano cheio |
| **Lateral** | ↔️ | deslizar para o lado | ← ou → | Esquiva (só evita o dano) | Dano cheio |

- **Tempo do círculo — Definido:** base **900 ms**. A partir do nível efetivo 6, cada golpe nomeado usa seu multiplicador `m` (`T = 900 × m`; `m < 1` fecha mais rápido) e sua **curva** (`acel`: começa devagar e acelera; `desac`: o contrário; padrão linear). Chefe em Fase 2: ×0,75. NG+: ×`max(0,6; 1 − 0,06 × ciclo)`.
- **Aviso sonoro — Definido:** um "plim" de moeda toca no início da janela perfeita (68% do tempo).
- **Resultados — Definido:**

| Resultado | Dano no herói | Fúria | Extra |
|---|---|---|---|
| Parry perfeito | 0 | +1 | Cansa o atacante (+1, §7.3); **riposte** de `max(1, round(ATK × 0,5) − DEF do alvo)`; Gema Vital cura |
| Bloqueio | `max(0, ATK do golpe − DEF)` | +1 | — |
| Salto bem-sucedido | 0 | +1 | Botão de **Ataque Aéreo** por 1,1 s: `max(1, round(ATK × 0,9) − DEF)` |
| Lateral bem-sucedida | 0 | 0 | — |
| Falha (qualquer tipo) | `ATK do golpe + d(0..3)` | +1 | Golpe de monstro de fogo gruda uma **dinamite** (§8.3) |

- **Combos — Definido:** um golpe nomeado pode ter de 1 a 3 hits (mais com Fase 2 e NG+). Em golpes de vários hits, cada hit usa `round(ATK × 0,65)`. **Defender o combo inteiro** (parry perfeito nos de toque, esquiva nos de salto e lateral) rende um **contra-ataque** de `max(1, round(ATK × m) − DEF)` com `m` sorteado entre 1,5 e 2.
- **Guarda quebrada — Definido:** ver Exaustão do herói (§7.2). Com a guarda quebrada, não há QTE: todo golpe é dano cheio.
- **O nome do golpe aparece na tela** antes do ataque. O jogador aprende o padrão de cada monstro pelo título.

## 6. Ações do Herói

No turno do herói, o menu de comandos fica à direita do campo. **Comandos de ação exigem segurar o botão por 0,9 s** (uma barra enche; soltar antes cancela), para evitar toques acidentais.

| Ação | Custo | Efeito |
|---|---|---|
| **Atacar** | — | Corre até o alvo e golpeia: `max(1, round(ATK) − DEF + d(−2..3))`; 15% de crítico (×2). Com escudo arcano no alvo, quebra 1 escudo (2 no crítico). Gema do Eco: um segundo golpe. **Guerreiro: +1 Fúria.** |
| **Especial** | Fúria | Abre o submenu de especiais (§7.1). Todo especial deixa o herói **exausto**: perde a rodada seguinte inteira. |
| **Poção** | 1 poção | Submenu com **Poção de Cura** (+40% do HP máximo) e **Poção de Adrenalina** (Fúria 5/5). 3 de cada por masmorra. Consome o turno. |
| **Fugir** | 1 Mapa | Sai da masmorra mantendo o ouro coletado. |
| **Pedrada** 🪨 | grátis | Arrastar do herói até um monstro. 1 por rodada (mais com a Gema do Arremesso). `max(1, round(ATK × 0,2))` ou quebra 1 escudo. **Não consome o turno.** |

- **Alvo — Definido:** tocar num monstro o seleciona; deslizar no campo (ou ← →) troca de alvo.
- **Dano mínimo — Definido:** todo golpe do herói causa pelo menos 1.

## 7. Fúria, Exaustão e Cansaço

### 7.1 Fúria (0–5) e especiais

- **Fontes — Definido:** ataque simples (só Guerreiro), parry perfeito, bloqueio, salto bem-sucedido, sofrer dano (+1 cada). Esquiva lateral não dá Fúria. O **Selo da Fúria** do Monge inimigo bloqueia o ganho por 2–3 turnos.
- **Gastar não zera — Definido:** cada especial subtrai só o que usou.
- **Especiais liberados pela Habilidade — Definido:** o herói nasce só com o ataque simples. A cada 5 níveis do atributo **Habilidade** (comprado no acampamento, §10.1), ele aprende um especial, nesta ordem:

| Habilidade | Especial | Custo | Efeito |
|---|---|---|---|
| 5 | ⚡ **Fúria** | 1 a 5 (toda a Fúria disponível, em faixas) | Golpe único: Fúria 1 → ×1,1 · 2 → ×1,2 · 3–4 → ×1,5 (custa 3) · **5 → ×2 em TODOS os monstros** com a **barra de carga**: o jogador martela a tela por 2,2 s (14 toques enchem; a barra vaza 22%/s). O quanto encheu é a chance de crítico; cheia, crítico garantido. Crítico = ×2,5 sobre o multiplicador (×5 do ataque). Com escudo: quebra 2 (crítico: 4). |
| 10 | 🗡 **Combo** | 2 a 4 (o número de golpes) | Fúria ≥4 → 4 golpes; 3 → 3; senão 2. Cada golpe é um círculo de 900 ms linear: tocar nos últimos 32% conecta; cedo ou sem toque, erra só aquele golpe. Multiplicadores ×1,2 / ×1,4 / ×1,8 / ×2. |
| 15 | 👻 **Lâmina Invisível** | toda a Fúria (N) | N golpes de ×0,85 em alvos sorteados entre os vivos (pode repetir). |
| 20 | ☠ **Sequência Mortal** | 2 | Barra oscilante: zona fraca 60% (×1,1), forte 30% (×1,5), muito forte 10% (×2); o cursor acelera a cada zona (0,55 / 1,05 / 1,9 barras por segundo) e faz 3 idas e voltas. Tocar trava. Sem toque, o ataque falha (e o herói perde a rodada mesmo assim). Escudos: quebra 1/2/3. |

- Dano dos especiais: `max(1, round(ATK × mult) − DEF + d(−1..3))` (Lâmina: `d(−1..2)`).

### 7.2 Exaustão do herói (barra de guarda)

- **Definido:** a barra tem `min(20, 5 + floor(compras de Defesa ÷ 5))` segmentos. Cada golpe sofrido soma `max(0,3; dano × 7 ÷ HP máximo)`.
- **Definido:** se a barra já está cheia e o herói leva dano **durante um combo inimigo de vários hits**, a guarda quebra: a barra zera, o herói perde a próxima ação e **não reage** a mais nenhum golpe até voltar a agir.

### 7.3 Cansaço dos monstros

- **Definido:** cada golpe forte sofrido (especiais, combo, parry perfeito, Lâmina) soma 1 ao contador de cansaço do monstro, até um teto: **monstro comum 5, chefe 10**; a partir do nível efetivo 20, **10 e 20**.
- **Definido:** com o contador no teto, o próximo golpe de multiplicador **≥ 1,5** deixa o monstro **EXAUSTO por 3 rodadas** (perde a vez) e zera o contador. Golpes fracos (parry ×1, Lâmina ×0,9) só enchem.

## 8. Monstros

### 8.1 Comuns

Os atributos abaixo são os do nível de masmorra 1 **(valor inicial)**; "Nv." é o nível efetivo mínimo para aparecer. "Cor" = o sprite muda com a cor da masmorra.

| Monstro | Código | HP | ATK | DEF | Nv. | Notas |
|---|---|---|---|---|---|---|
| Servo | `pawn` | 30 | 9 | 2 | 1 | cor |
| Arqueiro | `archer` | 24 | 12 | 1 | 1 | cor · à distância |
| Lanceiro | `lancer` | 40 | 11 | 4 | 1 | cor |
| Monge | `monk` | 26 | 10 | 2 | 1 | cor · suporte (§8.5) |
| Gnomo Arruaceiro | `gnome` | 24 | 9 | 1 | 1 | |
| Ladrão | `thief` | 26 | 10 | 1 | 2 | |
| Cobra Venenosa | `snake` | 24 | 11 | 1 | 2 | |
| Aranha Gigante | `spider` | 28 | 10 | 2 | 3 | |
| Goblin da Tocha | `torch` | 28 | 10 | 2 | 3 | cor · fogo |
| Goblin Dinamite | `tnt` | 22 | 9 | 1 | 3 | cor · fogo · à distância |
| Caveira Amaldiçoada | `skull` | 32 | 11 | 3 | 4 | |
| Minotauro | `mino` | 46 | 13 | 3 | 4 | |
| Gnoll Arremessador | `gnoll` | 30 | 12 | 2 | 5 | à distância |
| Lagarto Cuspidor | `lizard` | 32 | 11 | 2 | 6 | à distância |
| Peixe Arpoador | `harpoonfish` | 30 | 12 | 2 | 7 | à distância |
| Peixe-Remo | `paddlefish` | 36 | 12 | 3 | 8 | |
| Xamã Selvagem | `shaman` | 34 | 13 | 2 | 9 | à distância |
| Tartaruga Blindada | `turtle` | 48 | 11 | 6 | 10 | |
| Cavaleiro Selvagem | `wlancer` | 40 | 14 | 4 | 12 | |

### 8.2 Chefes

| Chefe | Código | HP | ATK | DEF | Nv. | Notas |
|---|---|---|---|---|---|---|
| Cavaleiro [Cor] | `boss` | 160 | 20 | 6 | 1 | nome muda com a cor (Cavaleiro Vermelho, Negro…) |
| Rei Slime | `kingslime` | 200 | 18 | 4 | 1 | |
| Árvore Anciã | `tree` | 170 | 19 | 8 | 1 | brota do chão em vez de correr; à distância |
| Urso Feroz | `bear` | 180 | 19 | 5 | 2 | |
| Minotauro Ancestral | `minolord` | 210 | 20 | 6 | 4 | |
| Troll das Cavernas | `troll` | 230 | 21 | 7 | 6 | |
| Panda Guerreiro | `panda` | 190 | 18 | 6 | 9 | |

### 8.3 Golpes nomeados

Notação: **P** = parry (toque), **J** = salto (↑), **S** = lateral (↔); o número é o multiplicador `m` do círculo (sem número = 1); **a** = curva acelerando, **d** = desacelerando. "(NvX)" = só a partir do nível efetivo X. Cada monstro sorteia um golpe entre os liberados.

| Monstro | Golpes |
|---|---|
| Servo | Facada do Servo `P` · Corte Apressado `P.75` · Dança das Facas (Nv3) `P1.2 P.7a` |
| Arqueiro | Flecha Certeira `P` · Tiro Traiçoeiro `P1.35a` · Chuva de Flechas (Nv3) `P.8 P.8` |
| Lanceiro | Investida Dupla `P J.85` · Varredura Rasteira `J1.25a P.7` |
| Monge | Feitiço Sombrio `P` · Chama Voraz `P.75` · Prece Invertida `P1.4a` |
| Goblin da Tocha | Tocha Flamejante `P` · Giro Incendiário `J.9` · Dança do Fogo (Nv5) `P.8 J.85` |
| Goblin Dinamite | Dinamite Acesa `P` · Pavio Curto `P.7` · Bomba Rolante `S.95` · Barril Explosivo (Nv5) `P1.3a` |
| Gnomo | Cutucada Traquina `P.85` · Salto Zombeteiro `J.85` · Dupla Travessura (Nv3) `P.8 J.75` |
| Ladrão | Facada Rápida `P.9` · Corte e Fuga `S.85` · Roubo Relâmpago (Nv4) `P1.25a` |
| Cobra | Bote Venenoso `P` · Rasteira Sibilante `S.9` · Picada Dupla (Nv4) `P.8 P.8` |
| Aranha | Mordida Peçonhenta `P` · Teia Pegajosa `S.9` · Investida de Oito Pernas (Nv5) `J.9 P.75` |
| Caveira | Golpe Ósseo `P` · Risada Sinistra `J.9` · Maldição Óssea (Nv6) `P.85 P.85` |
| Minotauro | Machadada Brutal `P.9` · Investida do Touro `S.85` · Giro do Machado (Nv6) `J.9 P.8` |
| Gnoll | Osso Arremessado `P` · Ossada Giratória `J.85` · Chuva de Ossos (Nv7) `P.75 P.75` |
| Lagarto | Cuspe Ácido `P` · Rajada Ácida (Nv8) `P.75 P.75` · Salto Corrosivo `J.9` |
| Peixe Arpoador | Arpoada `P` · Arpão Giratório `J.9` · Chuva de Arpões (Nv9) `P.8 J.8` |
| Peixe-Remo | Rabada Forte `P.95` · Investida Aquática `S.9` · Marolas Consecutivas (Nv10) `S.75 P.8` |
| Xamã | Explosão Mística `P` · Vórtice Arcano (Nv11) `P.8 P.8` · Chama Ritual `J.9` |
| Tartaruga | Investida do Casco `S.9` · Mordida de Casco `P.9` · Rolamento Blindado (Nv12) `J.9 S.85` |
| Cavaleiro Selvagem | Lançada Selvagem `P` · Investida Feroz `J.9` · Fúria da Lança (Nv14) `P1.1 J.85` |
| Cavaleiro (chefe) | Julgamento do Cavaleiro `P J.9 P.7` · Lâmina Paciente `P1.5a P.65` · Tempestade de Aço `J.85 P.8 P1.2d` |
| Rei Slime | Esmagada Real `P` · Salto do Rei `J.9` · Onda Gosmenta `S.9` · Fúria Gelatinosa (Nv7) `P.8 S.8` |
| Árvore Anciã | Chicote de Raiz `P` · Raízes Rasteiras `J.95` · Galhada Giratória `S.9` · Ira da Floresta (Nv7) `P.85 J.8` |
| Urso Feroz | Patada Brutal `P1.1` · Investida Ursina `S.95` · Abraço Esmagador `P.85 J.85` · Fúria da Floresta (Nv5) `P.9 S.85 P.85` |
| Minotauro Ancestral | Corte do Machado Ancestral `P1.1` · Investida do Touro Ancião `S.95` · Giro Devastador `J.9 P.85` · Fúria do Labirinto (Nv7) `J.85 P.8 P.85` |
| Troll | Pancada do Porrete `P1.2a` · Varredura Brutal `S1` · Esmagamento Duplo `P.9 P.9` · Fúria da Caverna (Nv9) `S.85 P.85 J.85` |
| Panda | Golpe do Bambu `P1.05` · Chute Giratório `J.9` · Postura Impenetrável `P.85 S.85` · Fúria do Mestre (Nv12) `J.85 P.85 S.85` |

- **Fase 2 e NG+ — Definido:** o chefe em Fase 2 emenda um hit extra no fim do combo (mesmo tipo do último, `m × 0,85`) se o combo tiver menos de 4. Em NG+, combos de mais de 1 hit ganham `min(3, ciclo)` hits extras do mesmo jeito, até 5 no total.
- **À distância — Definido:** Arqueiro, Goblin Dinamite, Árvore, Gnoll, Lagarto, Peixe Arpoador e Xamã atacam sem sair do lugar; os demais correm até o herói e voltam.

### 8.4 Mecânicas especiais

- **Goblins de fogo (Tocha e Dinamite):** um golpe de fogo que acerta em cheio gruda uma **dinamite** no herói (máximo 5). No início de cada turno do herói, **uma** dinamite explode, causando a maior potência registrada: `max(3, round(ATK do goblin × 0,4))`.
- **Explosão Final:** goblin de fogo que morre detona. O herói tem uma reação **lateral**; sem ela, leva `max(3, round(ATK × 0,5))`, +1 Fúria e exaustão. Os outros monstros levam estilhaços de `max(1, dano − round(DEF ÷ 2))` (ou perdem 1 escudo) e podem morrer, **encadeando** outras explosões.
- **Escudo Arcano:** a partir do nível efetivo 5, um chefe com menos de 10 escudos tem 45% de chance de gastar o turno conjurando 2–3 (teto 10). Com escudo de pé, golpes quebram escudos em vez de tirar HP. A **Gema Perfurante** deixa parte do dano atravessar.
- **Fase 2:** a partir do nível efetivo 3, 60% dos chefes são marcados para Fase 2 (duelos: sempre). Ao cair a 50% do HP, o chefe enfurece: ATK ×1,4, hit extra no combo, círculo 25% mais rápido, 2–3 entradas na fila de iniciativa.

### 8.5 Monge inimigo (suporte)

No turno dele, nesta ordem:
1. Se algum aliado está abaixo de 50% do HP, 50% de chance de **curar** o mais ferido em 30% do HP máximo.
2. Senão, se o herói não está amaldiçoado, 45% de chance de **encantar**: 50/50 entre **Maldição Sombria** (o herói perde `max(3, round(ATK × 0,5))` no início de cada turno) e **Selo da Fúria** (a Fúria não enche), por 2–3 turnos.
3. Senão, um **feitiço** à distância: o primeiro hit de um golpe sorteado, sempre como parry, com o ATK cheio.

## 9. Masmorras

- **Definido:** 3 ondas. Ondas 1 e 2: 3 monstros comuns; a onda 2 vem 30% mais forte e paga 25% mais ouro. Onda 3: o chefe.
- **Grupo da masmorra — Definido:** os comuns de uma masmorra saem de um grupo fixo de até 4 tipos, recortado do pool liberado a partir da posição `(nível − 1) mod tamanho do pool`. A mesma masmorra sempre tem o mesmo grupo; o sorteio é só de quais entram em cada onda.
- **Chefe — Definido:** fixo por masmorra: `pool de chefes liberados[(nível − 1) mod tamanho]`.
- **Escala — Definido:** com `L` = nível da masmorra e `ng` = `1,25^ciclo NG+`:
  - atributos dos monstros: base × `(1 + (L − 1) × 0,25) × ng` (×1,3 na onda 2);
  - ouro por monstro: `round((12 + 4L) × ng)` (×1,25 na onda 2).
- **Escolta — Definido:** nas masmorras múltiplas de 5, o chefe vem com 2 guardas do grupo com 70% do HP, 80% do ATK e 80% do ouro.
- **Nível efetivo — Definido:** `L + 5 × ciclo NG+`. Controla tudo que é "liberado a partir do nível X" (monstros, golpes, escudo, Fase 2), para nada sumir quando o NG+ volta à masmorra 1.
- **Cor e bioma — Definido:** a cor (Vermelha, Negra, Azul, Púrpura, Dourada) é sorteada ao vencer a anterior e muda os sprites dos comuns "de cor" e o nome do chefe Cavaleiro. O bioma (Castelo, Floresta, Cemitério, Ruínas) é sorteado por masmorra e é só decorativo.
- **Vitória — Definido:**
  - bônus de `round((150 + 60 × (L − 1)) × ng)` ouro;
  - **+1 Soul**;
  - **run perfeita** (nenhum dano sofrido na masmorra inteira): bônus e Souls em dobro;
  - nas masmorras 1, 5, 10 e 15, o chefe derruba um **Pergaminho de Gema** (próxima da ordem Pedra → Vital → Eco → Perfurante);
  - vídeo premiado opcional dobra o bônus.
- **Derrota — Definido:** perde metade do ouro coletado **nesta** masmorra. Com Soul, pode **reviver** com a vida cheia na mesma onda, com os monstros como estavam (a Soul não devolve o ouro perdido).
- **Fim de jogo e NG+ — Definido:** vencer a masmorra **33** mostra "Você venceu o jogo" e oferece o **NG+**: volta à masmorra 1, mantém ouro, atributos e gemas. Por ciclo: monstros ×1,25 (força e ouro), círculo de reação mais rápido (−6%, piso 60%) e combos maiores.

## 10. Acampamento e Mercado

### 10.1 Atributos

| Atributo | Ganho por compra | Custo-base |
|---|---|---|
| Vida | +20 HP máximo | 50 |
| Ataque | +3 ATK | 60 |
| Defesa | +2 DEF (e +1 segmento na barra de guarda a cada 5 compras) | 60 |
| Habilidade | nenhum direto; a cada 5 níveis libera um especial (§7.1) | 40 |

- Custo de cada compra: `round(base × 1,55^compras já feitas daquele atributo)` **(valor inicial)**, por herói.

### 10.2 Mercado e recursos

| Recurso | Como se obtém | Uso |
|---|---|---|
| Ouro 🪙 | monstros, bônus de vitória, Baú do Dia | atributos, gemas |
| Soul 💠 | 1 por chefe (2 na run perfeita) | reviver; comprar Tocha ou Mapa (1 Soul cada) |
| Tocha 🔥 | começa com 5; recarrega 1 a cada **10 minutos reais** até o teto de **5**; ou 1 Soul | entrar em masmorra |
| Mapa 🗺️ | começa com 1; ou 1 Soul | fugir de uma masmorra mantendo o ouro |

- **Baú do Dia — Definido:** 1 vez por dia, depois de um vídeo premiado: `round((80 + 40 × (L − 1)) × ng)` ouro. Abre com uma animação de baú (fechado → tremendo → abrindo → aberto) cujo desenho cicla entre 12 modelos conforme o nível de masmorra.
- **Estado inicial — Definido:** 120 ouro, 5 Tochas, 1 Mapa, 0 Souls.

### 10.3 Gemas

Liberadas por pergaminho (§9); depois, compradas no Nv.1 e evoluídas até o Nv.5. **Só 1 equipada por vez.**

| Gema | Compra (Nv.1) | Efeito no Nv. g (1 a 5) |
|---|---|---|
| 🪨 Gema do Arremesso | 250 | `1 + g` pedradas grátis por rodada |
| 💗 Gema Vital | 300 | parry perfeito cura `3 + 2g` % do HP máximo |
| ⚔️ Gema do Eco | 400 | ataque simples golpeia 2×; o eco vale `37,5 + 12,5g` % |
| 💠 Gema Perfurante | 400 | `30 + 10g` % do dano atravessa escudos |

- Evoluir do Nv. g para g+1: `4000 × 5^(g − 1)` ouro **(valor inicial)**.

## 11. Mago Arcanista (cartas)

**Definido no código, desligado no jogo publicado.** O Mago troca o menu do Guerreiro por **Ataque Simples / Conjurar / Destruir carta** e uma mão de cartas na base da tela. Também joga pedra. Não usa Fúria.

| Carta | Cor | Base | Efeito sozinha |
|---|---|---|---|
| 🔥 Bola de Fogo | roxa | 9 | dano no alvo |
| ❄️ Lasca de Gelo | roxa | 10 | dano no alvo |
| 💧 Jato d'Água | roxa | 9 | dano no alvo |
| ⚡ Faísca | roxa | 8 | dano no alvo |
| 💚 Bênção | verde | 14 | cura o mago |
| 🛡️ Couraça Arcana | verde | 12 | escudo que absorve o próximo dano recebido |
| 💀 Carta da Morte | preta | 0 | abate o alvo na hora (§ abaixo) |

- **Mão — Definido:** começa vazia a cada masmorra (persiste entre ondas); limite de 7 (a 8ª se dissipa). Compra 1 carta aleatória (nunca a Morte) no início de cada turno e mais 1 a cada Ataque Simples.
- **Ataque Simples — Definido:** `max(1, round(ATK × 0,8) + d(−1..2))`, ignorando DEF; compra 1 carta.
- **Conjurar — Definido:** seleciona até 3 cartas **da mesma cor** (cores misturadas: jogada recusada sem custo). **Poder** = `nº de cartas × soma das bases × (ATK atual ÷ 8)`.
  - Roxas do mesmo tipo: atinge tantos monstros quanto cartas (1 → o alvo; 2 → alvo + outro; 3 → **todos, com crítico**).
  - Roxas de tipos diferentes: só o alvo.
  - Verdes iguais: cura ou escudo com o poder; verdes misturadas: metade do poder de cada efeito, calculado separadamente.
  - Escudo arcano: várias cartas num só monstro quebram 1 escudo por carta; em área, 1 (2 se crítico ou dano ≥ 18).
- **Carta da Morte — Definido:** ganha toda vez que o Mago mata um monstro com magia. Jogada sozinha: abate o alvo (ignora escudo). Se houver outras cartas na mão, o Mago sofre a soma das bases delas (× ATK ÷ 8) e a mão inteira é destruída.
- **Destruir carta — Definido:** funde 1 a 3 Cartas da Morte selecionadas numa carta aleatória (roxa ou verde) com `base × nº de cartas fundidas`. Consome o turno.
- **Habilidade do Mago — Definido:** Habilidade 5 libera Conjurar com 1 carta; 10, combos de 2; 15, combos de 3.

## 12. Mapa-múndi e Recrutamento

**Definido no código, desligado no jogo publicado.**

- Mapa estilo Final Fantasy Tactics com 11 nós alternando **cidade** (6 nós pares: Pedraverde, Lago Bruma, Solar Silente, Torre Rubra, Bosque Ermo, Castelo Ruína) e **porta de masmorra** (5 nós ímpares). O token anda entre nós adjacentes já alcançados.
- `região = floor((L − 1) ÷ 5)`; a porta de fronteira acompanha o nível de masmorra. Parar nela mostra "Entrar na Masmorra".
- **Duelo de recrutamento:** parar na cidade de um herói não recrutado mostra "Desafiar". Custa 1 Tocha e roda no motor da masmorra: 2 ondas comuns + o próprio herói como chefe, **sempre com Fase 2**. Atributos do herói-chefe: HP `(90 + HP base) × m`, ATK `(ATK base + 6) × m`, DEF `(DEF base + 2) × m`, com `m = (1 + (L − 1) × 0,18) × ng`; ouro `60 + 20L`. A dificuldade acompanha o nível de masmorra do jogador.
- Vencer marca o duelo como vencido; o jogador confirma no menu **Recrutar** e o herói entra no Nv.1 da sua própria progressão. Derrota no duelo não tem penalidade de ouro.
- Os nós 8 e 10 não têm duelo: reservados para heróis futuros.
- **Troca de herói:** no acampamento, arrastando o cartão do herói para o lado.

## 13. Estilo Visual e Áudio

- **Jogo publicado:** pixel art do **Tiny Swords** (Pixel Frog: Free Pack, Enemy Pack e Update 010), cavaleiro com sheets de ataque, pulo e esquiva em 8 direções; ícones de poções e armas de packs de ícones RPG. Fundo escuro arroxeado, interface com cartões arredondados.
- **Definido (port Unity):** a pixel art sai. Os personagens passam a ser **flat vector com poucos detalhes**, vistos de lado:
  - formas geométricas limpas e contorno escuro uniforme;
  - cor chapada com no máximo um tom de sombra;
  - sem textura e sem gradiente.
  - O herói olha para a direita e os monstros para a esquerda.
- Os assets são gerados no SpriteCook e ficam em `Sprites/GuerreiroDaMasmorra/`, com os `asset_id` em `spritecook-assets.json`. O Guerreiro (`heroes/warrior.png`) é a referência de estilo de todo o elenco.
- **Animações — Definido:** spritesheets de 8 quadros de 640 × 640 px, geradas a partir da pose base de cada personagem (idle e ataque).
- **Cavaleiro [Cor] — Definido:** é o Guerreiro recolorido localmente por `_tools/recolor_knight.py` (vermelho, negro, púrpura e dourado; o azul é o próprio herói), como no jogo publicado.
- **Em aberto:** o resto do elenco (23 monstros e chefes), as animações de idle dos monstros, a pose de guarda/parry do herói, os outros heróis e a decisão entre animar a corrida por spritesheet ou por tween.
- **Definido:** corredor de masmorra em perspectiva com cenário do bioma; inimigos entram pelo fundo do corredor; entre ondas o herói "marcha" (o cenário rola para trás por 2 s).
- **Feedback — Definido:** números de dano flutuantes (dourado no crítico), tremida de tela em golpes fortes, flash verde/vermelho no campo para reação boa/ruim, explosão na morte de goblin de fogo e caveira nos demais, contadores de ouro que sobem de 0 até o valor.
- **Áudio — Definido:** música de acampamento e de batalha; efeitos de golpe, crítico, parry, bloqueio, esquiva, dano, moeda (aviso da janela perfeita), explosão, escudo, magia, cura, maldição, atordoamento e poção. Pode ser desligado.

## 14. Interface e Controles

- **Acampamento:** cartão do herói (sprite animado, HP/ATK/DEF), botões de atributo com preço, **Entrar na Masmorra** (com contador de Tochas e tempo da próxima recarga), **Mercado**, **Baú do Dia**, som, login/nuvem.
- **Batalha:**
  - topo: chip com "MASMORRA NV. N · bioma · ONDA x/3 · ouro" e a fila de iniciativa com miniaturas;
  - campo: herói, monstros com barra de HP, escudos e cansaço, marcador de alvo; nome do golpe em faixa;
  - direita: lista vertical de comandos (Atacar, Especial, Poção, Fugir) com submenus;
  - base: linha de log com a última mensagem e a barra de Fúria (⚡ 0–5) e de guarda;
  - centro, quando ativo: o círculo de reação, a barra de carga, a barra oscilante ou o botão de Ataque Aéreo.
- **Controles — Definido:** toque/mouse como primário (tocar, arrastar para cima, deslizar, arrastar do herói ao monstro, segurar botões); teclado como alternativa no navegador (Espaço/Enter = toque, ↑ = salto, ← → = lateral ou trocar alvo).

## 15. Persistência, Nuvem e Monetização

- **Save local — Definido:** um registro com atributos do herói ativo, ouro, Souls, Tochas e o relógio de recarga, Mapas, nível e cor da masmorra, vitórias, entradas, tutorial concluído, dia do último baú, ciclo NG+, posição no mapa e a progressão de cada herói. Saves antigos são migrados com valores padrão.
- **Nuvem — Definido:** login opcional com Google e save no Firestore em `saves/{uid}`, legível e gravável só pelo próprio usuário.
- **Anúncios — Definido:**
  - intersticial a cada 5 entradas em masmorra;
  - vídeo premiado para dobrar o bônus de vitória e para abrir o Baú do Dia;
  - nenhum anúncio é obrigatório para progredir.

## 16. Escopo do MVP

**Dentro (é o jogo publicado hoje):**
- Guerreiro com reações, especiais liberados pela Habilidade, pedrada e poções.
- 33 masmorras com NG+, todos os monstros e chefes, escudo, Fase 2, monge, goblins de fogo.
- Acampamento, Mercado, gemas, Tochas, Souls, Baú do Dia, tutorial, save local, anúncios.

**Fora (pós-MVP, código pronto e desligado):** Mago Arcanista, Caçadora, Lanceiro e Monge jogáveis, troca de herói, mapa-múndi, duelos e recrutamento.

**Fora (pós-MVP, a criar):** identidade própria de combate para Caçadora, Lanceiro e Monge; heróis das cidades 8 e 10.

## 17. Em aberto

1. **Identidade da Caçadora, do Lanceiro e do Monge.** O README do repositório já anuncia ideias que não estão no código: Caçadora com "Tiro Certeiro" que ignora a armadura; Lanceiro com "Investida em Leque" em toda a linha; Monge com cura e resistência.
2. **Versão alternativa do Mago descrita no README:** cartas que se anulam em pares (fogo×gelo, água×raio, cura×morte); Carta da Morte tirando 25% do HP de um chefe em vez de matá-lo; Mago perdendo 25% da vida ao jogar a Morte sem outras cartas. Decidir se substitui a versão do §11.
3. **"Desenhar o padrão do feitiço"** (também no README): mecânica de desenhar runas para o Mago, não implementada.
4. **Quando religar** mapa-múndi, recrutamento e troca de herói.
5. **Heróis das cidades 8 e 10.**
6. **Diferenças do `GDD.md` do repositório para o código**, resolvidas aqui a favor do código:
   - especiais liberados pela Habilidade;
   - Fúria cheia ×2 com barra de carga;
   - Combo custando o número de golpes;
   - cansaço 5/10 → 10/20 a partir do nível 20 (o `GDD.md` diz 5/10/15/20 por categoria de chefe);
   - Tochas com teto 5 compradas com Soul (o `GDD.md` diz 40 ouro, teto 20);
   - Mapa comprado com Soul.
   Confirmar que o código é a intenção.
7. **No port Unity:** provedor de anúncios (Unity LevelPlay ou Google Mobile Ads), provedor de login para a nuvem e se o corredor em perspectiva entra no MVP do port ou fica para depois do layout lateral.

---

# Parte 2 — Guia de Implementação Unity

Este guia reconstrói o Guerreiro da Masmorra em Unity 6, do projeto vazio até as builds de Android e WebGL. O jogo publicado é a especificação: fórmulas, tempos e probabilidades da Parte 1 são portados um a um. A ordem das fases segue o escopo da Parte 1 §16: primeiro o MVP (o Guerreiro e as masmorras), e por último os sistemas pós-MVP (Mago, recrutamento, mapa).

## Como usar este guia

O guia foi escrito para quem está aprendendo Unity. Cada fase segue o mesmo formato:

- **Conceitos novos:** o que a fase usa pela primeira vez, explicado antes de aparecer.
- **Etapas** pequenas (3A, 3B, ...), cada uma terminando num **🧪 Teste rápido** no Play Mode.
- **Passos no Editor clique a clique:** menus no formato **Menu → Submenu → Item**, campos do Inspector em **negrito** e valores em `código`.
- **✅ Checkpoint** no fim da fase e **Problemas comuns**.

Todo script do guia é **completo**: crie o arquivo, apague o conteúdo que a Unity gerou e cole o código inteiro. Os comentários dentro do código explicam **por que** cada classe existe e **como** ela funciona.

### Duas operações que se repetem no guia inteiro

**Criar um script C#:**
1. Na janela **Project**, entre na pasta indicada no comentário `// Caminho:` do script.
2. Botão direito no espaço vazio → **Create → Scripting → Empty C# Script** (antes do Unity 6: **Create → C# Script**).
3. Digite o nome **exatamente igual ao nome da classe** e aperte Enter.
4. Duplo clique no arquivo, apague tudo, cole o script do guia e salve (**Ctrl+S**).
5. Volte à Unity, espere compilar e confira o **Console** (**Window → General → Console**): nenhum erro em vermelho.

**Ligar um campo no Inspector:** campos `[SerializeField]` aparecem com o nome "humanizado" (`_monsterTurn` vira **Monster Turn**). Arraste o objeto ou asset para o campo, ou use o círculo ⊙ ao lado dele.

## Convenções

- **Nomes no projeto em inglês**, **comentários em português**. Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`; cada método tem um comentário curto acima dele.
- **Os ids do jogo publicado continuam iguais** (`pawn`, `kingslime`, `warrior`...).
- **Namespaces:**
  - `GuerreiroDaMasmorra.Data`: ScriptableObjects e enums.
  - `GuerreiroDaMasmorra.Combat`: regras de combate em C# puro.
  - `GuerreiroDaMasmorra.Battle`: a cena de batalha.
  - `GuerreiroDaMasmorra.Meta`: save, acampamento, mercado e fluxo entre cenas.
  - `GuerreiroDaMasmorra.Services`: serviços externos (anúncios).
  - `GuerreiroDaMasmorra.EditorTools`: ferramentas do Editor.
  - `GuerreiroDaMasmorra.Tests`: testes automáticos.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Textos na tela sem emoji:** a fonte do TextMeshPro não tem emojis; o guia usa palavras ("PARRY!", "FÚRIA 3/5").

## Arquitetura em uma página

```
 Dados (ScriptableObjects)      Regras (C# puro)                      Cena Battle (MonoBehaviours)
 ─────────────────────────      ────────────────                      ────────────────────────────
 GameBalance                    WaveFactory, Initiative               BattleController (ondas, rodadas)
 MonsterDefinition (+golpes)    HitResolver, Strikes                    ├─ WarriorTurn ── CommandMenu, TargetSelector, RockThrower
 HeroDefinition, GemDefinition  HeroRun, Monster, Fatigue               ├─ MonsterTurn
 GameDatabase, VisualCatalog    QteTiming, MoveComposer, Rewards        ├─ BoomResolver
                                MetaRules (custos, Tochas, gemas)       └─ BattleStage ── CombatantView (sprites)
                                                                      IReactionSource ◄─ QteController (círculo)
                                                                      IMinigames      ◄─ MinigamePanel (barras)
 Cena Camp: CampScreen, MarketScreen ── GameSession (save, fluxo) ── PlayerPrefs
```

- **Regra de ouro:** fórmulas, sorteios e estado do combate moram em classes C# comuns. Os MonoBehaviours só animam, mostram e coletam o toque. Assim as regras rodam em testes automáticos (Fase 8), sem cena.
- **Aleatório injetável:** todo sorteio passa por uma interface `IRandom`. No jogo, ela usa `System.Random`; nos testes, uma versão "roteirizada" devolve exatamente os números que o teste quer.
- **Turnos como código linear:** o jogo publicado escreve o combate como uma sequência de `await` ("corre até o herói, espera o círculo, aplica o dano, volta"). O port faz igual com o `Awaitable` do Unity 6, em vez de máquinas de estado ou corrotinas.
- **Interfaces entre regra e tela:** o turno do monstro pede a reação do jogador a um `IReactionSource`, e o especial pede o resultado do minijogo a um `IMinigames`. Na Fase 3 uma implementação automática responde (dá para ver a batalha inteira sem nenhuma UI de reação); nas Fases 4 e 5 entram as de verdade, sem mexer no turno.
- **Sem física:** ninguém colide com ninguém; posições são animadas por interpolação. Por isso este guia não usa `Rigidbody2D` nem a nota `rb.linearVelocity`/`rb.velocity`. Os únicos colliders são áreas de toque para escolher o alvo.

## Mapa de sistemas

| Namespace | Script | Responsabilidade | Fase |
|---|---|---|---|
| `Data` | `Enums`, `MathUtil`, `GameBalance` | Enums, arredondamento igual ao do JS, números do jogo | 1 |
| `Data` | `MonsterDefinition`, `HeroDefinition`, `GemDefinition`, `GameDatabase` | Monstros e golpes, heróis, gemas | 1 |
| `EditorTools` | `GameDataSeeder` | Cria todos os assets da Parte 1 com um clique | 1 |
| `Combat` | `GameRandom`, `Monster`, `HeroRun`, `DungeonMath`, `WaveFactory`, `Initiative` | Estado e montagem das ondas | 2 |
| `Combat` | `CombatMath`, `Strikes`, `HitResolver`, `QteTiming`, `MoveComposer` | Fórmulas de dano, reação e tempo | 2 |
| `Data` | `SpriteAnimation`, `VisualCatalog` | Animações e aparência | 3 |
| `Battle` | `SpriteAnimPlayer`, `HpBar`, `CombatantView`, `FloatingText`, `BattleStage` | Personagens na tela | 3 |
| `Battle` | `BattleContext`, `BattleController`, `MonsterTurn`, `WarriorTurn`, `BoomResolver` | O combate inteiro | 3 |
| `Battle` | `IReactionSource`, `IMinigames`, `AutoPlayer` | Reações e minijogos automáticos (substituídos nas Fases 4 e 5) | 3 |
| `Battle` | `HoldButton`, `CommandMenu`, `TargetSelector`, `BattleHud`, `BattleTestStarter` | Comandos, alvo, HUD, teste | 3 |
| `Battle` | `GestureInput`, `QteController` | Círculo de reação e gestos | 4 |
| `Battle` | `MinigamePanel`, `RockThrower` | Barra de carga, barra oscilante, combo, pedrada | 5 |
| `Combat`/`Services`/`Battle` | `DungeonRewards`, `Ads` (`IAdsService`), `ResultPanel` | Vitória, derrota, Souls, NG+, vídeo premiado | 6 |
| `Meta` | `SaveData`, `SaveService`, `MetaRules`, `GameSession`, `BattleBootstrap`, `CampScreen`, `MarketScreen`, `GemRow`, `ChestPopup` | Acampamento, mercado, save e fluxo | 7 |
| `Tests` | `ScriptedRandom`, `TestData` e 3 classes (+1 na Fase 10) | Testes automáticos | 8 |
| `Services`/`Meta` | `ProviderAds`, `CloudSave` | Anúncios reais e save na nuvem | 9 |
| `Combat`/`Battle`/`Meta` | `MageHand`, `CardButton`, `MageTurn`, `RosterRules` | Pós-MVP: Mago, recrutamento e duelos | 10 |

## Fases

| Fase | Parte | Conteúdo | Etapas |
|---|---|---|---|
| 0 | 3 | Setup do projeto | 0A Unity · 0B projeto e Git · 0C pastas, cenas e tela retrato |
| 1 | 4 | Dados | 1A tipos base · 1B definições · 1C dados iniciais |
| 2 | 5 | Regras de combate em C# puro | 2A estado · 2B ondas e iniciativa · 2C fórmulas |
| 3 | 6 | A batalha andando sozinha | 3A sprites · 3B personagens na tela · 3C controlador · 3D turno do monstro · 3E turno do herói · 3F HUD e teste |
| 4 | 7 | Reações (QTE) | 4A gestos · 4B círculo de reação |
| 5 | 8 | Especiais e pedrada | 5A minijogos · 5B pedrada |
| 6 | 9 | Fim de masmorra | 6A recompensas · 6B painel de resultado |
| 7 | 10 | Acampamento, mercado e save | 7A save e regras · 7B sessão e cenas · 7C telas |
| 8 | 11 | Testes automáticos | 8A assemblies · 8B testes · 8C rodar |
| 9 | 12 | Build, anúncios e nuvem | — |
| 10 | 13 | Pós-MVP: Mago, heróis e duelos | 10A mão de cartas · 10B turno do Mago · 10C duelos |

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, em retrato, versionado no Git, com as pastas e as duas cenas do jogo.

**Conceitos novos:**
- **Unity Hub, LTS e módulos:** o Hub instala versões da Unity; use sempre uma **LTS**; cada plataforma (Android, Web) é um **módulo** instalado junto.
- **Template Universal 2D:** projeto com o **URP** em modo 2D, câmera ortográfica e materiais de sprite prontos.
- **As janelas do Editor:** **Hierarchy**, **Scene**, **Game**, **Inspector**, **Project**, **Console**. Se alguma sumir, reabra em **Window → General**.
- **GameObject e componente:** tudo na cena é um GameObject; o que ele faz vem dos componentes presos a ele (seus scripts também são componentes).
- **Play Mode:** ⚠️ tudo o que você mudar na cena durante o Play é desfeito ao sair do Play.
- **Cena:** um "nível" salvo. Este jogo tem duas: `Camp` (acampamento) e `Battle` (masmorra). A troca entre elas é feita por código (Fase 7).

### Etapa 0A — Instalar a Unity

1. Instale o **Unity Hub** e entre com sua conta.
2. **Installs → Install Editor** → **Unity 6** mais recente marcada **LTS**.
3. Módulos: **Microsoft Visual Studio Community** (se precisar), **Android Build Support** (abra a setinha e marque **OpenJDK** e **Android SDK & NDK Tools**) e **Web Build Support**. **Install**.

### Etapa 0B — Criar o projeto e o repositório

1. **Projects → New project** → template **Universal 2D** → nome `GuerreiroDaMasmorra` → **Create project**.
2. **Edit → Preferences → External Tools → External Script Editor** = o seu editor.
3. No PowerShell, na pasta do projeto:

   ```powershell
   git init
   curl.exe -L https://raw.githubusercontent.com/github/gitignore/main/Unity.gitignore -o .gitignore
   git lfs install
   git lfs track "*.png" "*.ttf" "*.otf" "*.wav" "*.ogg" "*.mp3"
   ```

4. Acrescente `Builds/` ao `.gitignore`.
5. **Edit → Project Settings → Editor**: **Version Control → Mode** = `Visible Meta Files`; **Asset Serialization → Mode** = `Force Text`.
6. `git add .` e `git commit -m "chore: projeto Unity vazio"`.

### Etapa 0C — Pastas, cenas e tela retrato

1. Crie em `Assets/`:

   ```
   Assets/_Project/
     Art/
       Sprites/
       Fonts/
     Data/
       Monsters/
       Heroes/
       Gems/
       Anims/
     Prefabs/
     Scenes/
     Scripts/
       Data/
       Combat/
       Battle/
       Meta/
       Services/
       Editor/
   ```

2. Mova `Assets/Scenes/SampleScene` para `_Project/Scenes/` e renomeie para `Battle`. Crie a segunda cena: **File → New Scene → Basic 2D (URP) → Create**, salve como `_Project/Scenes/Camp`.
3. **Tela retrato:** na Game view, no menu de resolução (canto superior esquerdo da janela, onde diz "Free Aspect"), clique **+** e crie `Retrato 1080x1920` (**Type** `Fixed Resolution`, **Width** `1080`, **Height** `1920`). Selecione-o.
4. **Edit → Project Settings → Player → Resolution and Presentation → Default Orientation** = `Portrait`.

### 🧪 Teste rápido
Abra a cena `Battle` e aperte ▶. A Game view mostra um retângulo em pé, vazio, sem erros no Console.

### ✅ Checkpoint da Fase 0
- Duas cenas, `Camp` e `Battle`, em `_Project/Scenes/`.
- Game view em retrato 1080×1920.
- Commit: `chore: estrutura do projeto`.

---

# Parte 4 — Implementação Unity: Fase 1 (Dados)

## Fase 1 — Dados

> Objetivo desta fase: monstros (com todos os golpes nomeados da Parte 1 §8.3), heróis e gemas como assets editáveis, criados de uma vez por uma ferramenta do Editor.

**Conceitos novos:**
- **ScriptableObject:** classe cujas instâncias são **arquivos de dados** (`.asset`), editáveis no Inspector.
- **`[CreateAssetMenu]`:** cria um item no menu **Create** para gerar o asset.
- **`[Serializable]`:** deixa uma classe comum aparecer como "gaveta" dentro de outro objeto no Inspector. Os golpes e os hits de cada golpe são assim.
- **`[MenuItem]` e `AssetDatabase`:** um item de menu do Editor que roda código seu, e a API para criar e salvar assets por código. Só funcionam em scripts de uma pasta chamada `Editor`.
- **Mini-linguagem de dados:** em vez de 150 hits digitados no Inspector, a ferramenta lê a notação da Parte 1 §8.3 (`"P J.85 P1.2d"`) e monta os hits.

### Etapa 1A — Tipos base

```csharp
// Caminho: Assets/_Project/Scripts/Data/Enums.cs
namespace GuerreiroDaMasmorra.Data
{
    // POR QUE: as três reações da Parte 1 §5. Cada hit de um golpe exige uma.
    public enum ReactionType
    {
        Parry,
        Jump,
        Side,
    }

    // POR QUE: o ritmo com que o círculo de reação fecha (Parte 1 §5).
    // Accel começa devagar e acelera; Decel começa rápido e freia.
    public enum QteCurve
    {
        Linear,
        Accel,
        Decel,
    }

    // POR QUE: as cinco cores de masmorra (Parte 1 §9). Mudam sprites e o
    // nome do chefe Cavaleiro.
    public enum DungeonColor
    {
        Red,
        Black,
        Blue,
        Purple,
        Yellow,
    }

    // POR QUE: o sistema de combate do herói (Parte 1 §3).
    public enum HeroClass
    {
        Warrior,
        Mage,
    }

    // POR QUE: as gemas, na ordem fixa em que os pergaminhos as liberam
    // (Parte 1 §10.3). A ordem do enum É a ordem dos pergaminhos.
    public enum GemId
    {
        Stone,
        Vital,
        Echo,
        Pierce,
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/MathUtil.cs
using System;

namespace GuerreiroDaMasmorra.Data
{
    // POR QUE: o jogo publicado arredonda com `Math.round` do JavaScript,
    // que leva 0,5 sempre para cima (2,5 → 3). O `Math.Round` do C# e o
    // `Mathf.RoundToInt` usam arredondamento bancário (2,5 → 2), o que
    // mudaria danos e preços em 1.
    // ESTRATÉGIA: um único método para todo arredondamento da Parte 1.
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

namespace GuerreiroDaMasmorra.Data
{
    // POR QUE: os números de masmorra, tempo de reação e economia da Parte 1
    // (§5, §8, §9, §10) num asset só, para balancear sem recompilar.
    // ESTRATÉGIA: valores iniciais já preenchidos. Os multiplicadores de dano
    // de cada golpe ficam no CombatMath (Fase 2), perto das fórmulas que os usam.
    [CreateAssetMenu(fileName = "GameBalance", menuName = "GDM/Game Balance")]
    public class GameBalance : ScriptableObject
    {
        [Header("Reação (QTE)")]
        [Tooltip("Duração base do círculo, em segundos.")]
        public float qteSeconds = 0.9f;
        [Tooltip("A partir de que fração do tempo o toque é PARRY PERFEITO.")]
        public float perfectWindowStart = 0.68f;
        public float aerialWindowSeconds = 1.1f;
        [Tooltip("Tempo segurando um botão de comando para confirmar.")]
        public float holdSeconds = 0.9f;

        [Header("Masmorra")]
        public int dungeonCap = 33;
        public double statGainPerLevel = 0.25;
        public double wave2StatMult = 1.3;
        public double wave2GoldMult = 1.25;
        public int goldBase = 12;
        public int goldPerLevel = 4;
        public int maxCommonGroup = 4;

        [Header("NG+")]
        public double ngStatMult = 1.25;
        public int ngLevelOffset = 5;
        public double ngQteShrink = 0.06;
        public double ngQteFloor = 0.6;
        public int ngMaxExtraHits = 3;

        [Header("Chefes")]
        public int phase2MinLevel = 3;
        public double phase2Chance = 0.6;
        public int shieldMinLevel = 5;
        public double shieldChance = 0.45;
        public int shieldMax = 10;
        public double escortHp = 0.7;
        public double escortAtk = 0.8;
        public double escortGold = 0.8;

        [Header("Cansaço dos monstros")]
        public int fatigueCommon = 5;
        public int fatigueBoss = 10;
        [Tooltip("A partir deste nível efetivo os tetos dobram.")]
        public int fatigueHighLevel = 20;
        public int exhaustTurns = 3;

        [Header("Herói na masmorra")]
        public int heroSpeed = 10;
        public int potionsPerRun = 3;
        public int adrenalinePerRun = 3;
        public int dynamiteMax = 5;
        public int skillStep = 5;

        [Header("Recompensas")]
        public int victoryBase = 150;
        public int victoryPerLevel = 60;
        public int chestBase = 80;
        public int chestPerLevel = 40;

        [Header("Acampamento e mercado")]
        public double upgradeGrowth = 1.55;
        public int startGold = 120;
        public int startTorches = 5;
        public int startMaps = 1;
        public int torchMax = 5;
        public int torchRegenMinutes = 10;
        public int gemUpgradeBase = 4000;
        public int gemUpgradeGrowth = 5;
        public int gemMaxLevel = 5;
        public int interstitialEvery = 5;
    }
}
```

### Etapa 1B — Definições

```csharp
// Caminho: Assets/_Project/Scripts/Data/MonsterDefinition.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace GuerreiroDaMasmorra.Data
{
    // POR QUE: um hit de um golpe: qual reação exige, a velocidade do
    // círculo e a curva (Parte 1 §8.3).
    [Serializable]
    public class HitSpec
    {
        public ReactionType type;
        [Tooltip("Multiplicador do tempo do círculo (menor = mais rápido). Só vale do nível efetivo 6 em diante.")]
        public float speed = 1f;
        public QteCurve curve;
    }

    // POR QUE: um golpe nomeado ("Investida Dupla"). O nome aparece na tela
    // e ensina o padrão ao jogador.
    [Serializable]
    public class MoveDefinition
    {
        public string name;
        [Tooltip("Nível efetivo mínimo para este golpe aparecer.")]
        public int minLevel = 1;
        public List<HitSpec> hits = new List<HitSpec>();
    }

    // POR QUE: um tipo de monstro comum ou chefe (Parte 1 §8): atributos do
    // nível 1, quando aparece, comportamento e repertório de golpes.
    // ESTRATÉGIA: as flags descrevem comportamento que o turno do monstro
    // consulta (à distância não corre; suporte é o Monge; fogo gruda dinamite).
    [CreateAssetMenu(fileName = "Monster", menuName = "GDM/Monster")]
    public class MonsterDefinition : ScriptableObject
    {
        public string id;
        public string displayName;
        public bool isBoss;

        [Header("Atributos no nível 1")]
        public int hp;
        public int attack;
        public int defense;
        [Tooltip("Velocidade-base na fila de iniciativa.")]
        public int speed = 8;
        [Tooltip("Nível efetivo mínimo para aparecer.")]
        public int minLevel = 1;

        [Header("Comportamento")]
        [Tooltip("O sprite muda com a cor da masmorra.")]
        public bool colored;
        [Tooltip("Goblin de fogo: gruda dinamite e explode ao morrer.")]
        public bool fire;
        [Tooltip("Ataca de longe, sem correr até o herói.")]
        public bool ranged;
        [Tooltip("Suporte: cura aliados e encanta o herói (Monge).")]
        public bool support;

        public List<MoveDefinition> moves = new List<MoveDefinition>();

        // Golpes liberados no nível efetivo dado.
        public List<MoveDefinition> MovesAt(int effectiveLevel)
        {
            return moves.FindAll(m => m.minLevel <= effectiveLevel);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/HeroDefinition.cs
using UnityEngine;

namespace GuerreiroDaMasmorra.Data
{
    // POR QUE: um herói jogável (Parte 1 §3): atributos iniciais, sistema de
    // combate e onde ele é recrutado.
    // ESTRATÉGIA: só o ponto de partida; o que o jogador comprou fica no save.
    [CreateAssetMenu(fileName = "Hero", menuName = "GDM/Hero")]
    public class HeroDefinition : ScriptableObject
    {
        public string id;
        public string displayName;
        public HeroClass heroClass;
        public int maxHp;
        public int attack;
        public int defense;
        [Tooltip("Só o Guerreiro ganha Fúria com o ataque simples.")]
        public bool furyOnAttack;
        [Tooltip("Nó de cidade do mapa onde é desafiado. -1 = herói inicial.")]
        public int recruitCity = -1;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/GemDefinition.cs
using UnityEngine;

namespace GuerreiroDaMasmorra.Data
{
    // POR QUE: nome, preço de compra e descrição de uma gema (Parte 1 §10.3).
    // ESTRATÉGIA: o efeito em si é calculado no CombatMath a partir do id e
    // do nível; aqui fica o que a loja mostra. `{0}` na descrição recebe o
    // valor do efeito no nível.
    [CreateAssetMenu(fileName = "Gem", menuName = "GDM/Gem")]
    public class GemDefinition : ScriptableObject
    {
        public GemId id;
        public string displayName;
        public int buyCost;
        public string descriptionFormat;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameDatabase.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace GuerreiroDaMasmorra.Data
{
    // POR QUE: um asset que aponta para todos os outros; as cenas e os
    // testes recebem só ele.
    // ESTRATÉGIA: a ORDEM das listas é regra de jogo. `commons` e `bosses`
    // seguem a ordem do jogo publicado, porque o grupo de cada masmorra e o
    // chefe fixo saem de índices nessas listas (Parte 1 §9). `gems` segue a
    // ordem dos pergaminhos.
    [CreateAssetMenu(fileName = "GameDatabase", menuName = "GDM/Game Database")]
    public class GameDatabase : ScriptableObject
    {
        public GameBalance balance;
        public List<HeroDefinition> heroes = new List<HeroDefinition>();
        public List<MonsterDefinition> commons = new List<MonsterDefinition>();
        public List<MonsterDefinition> bosses = new List<MonsterDefinition>();
        public List<GemDefinition> gems = new List<GemDefinition>();

        // Herói pelo id gravado no save.
        public HeroDefinition Hero(string id)
        {
            var hero = heroes.Find(h => h.id == id);
            if (hero == null) throw new ArgumentException($"Herói desconhecido: {id}");
            return hero;
        }

        // Gema pelo id.
        public GemDefinition Gem(GemId id) => gems.Find(g => g.id == id);
    }
}
```

### 🧪 Teste rápido
O Console compila sem erros e **Create → GDM** lista Game Balance, Monster, Hero, Gem e Game Database.

### Etapa 1C — Dados iniciais com um clique

```csharp
// Caminho: Assets/_Project/Scripts/Editor/GameDataSeeder.cs
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;
using GuerreiroDaMasmorra.Data;
using UnityEditor;
using UnityEngine;

namespace GuerreiroDaMasmorra.EditorTools
{
    // POR QUE: 26 monstros, 84 golpes, 5 heróis e 4 gemas digitados no
    // Inspector levariam horas. A ferramenta cria tudo a partir das tabelas
    // da Parte 1 e serve de "reset" do balanceamento (o GameBalance é
    // preservado).
    // ESTRATÉGIA: carrega o asset se já existe (mantém as referências) ou
    // cria; preenche; salva. Os golpes usam a notação da Parte 1 §8.3:
    // "P J.85 P1.2d" = parry; salto com m 0,85; parry com m 1,2 desacelerando.
    public static class GameDataSeeder
    {
        private const string Root = "Assets/_Project/Data";
        private static readonly Regex HitToken = new Regex(@"^([PJS])([0-9]*\.?[0-9]*)([ad]?)$");

        [MenuItem("GDM/Criar ou atualizar dados iniciais")]
        public static void Seed()
        {
            var balance = LoadOrCreate<GameBalance>($"{Root}/GameBalance.asset");
            var commons = new List<MonsterDefinition>();
            var bosses = new List<MonsterDefinition>();

            // flags: "cor" = muda com a cor, "fogo", "dist" = à distância, "sup" = suporte.
            void Monster(bool boss, string id, string name, int hp, int atk, int def, int minLevel, int speed,
                string flags, params MoveDefinition[] moves)
            {
                var m = LoadOrCreate<MonsterDefinition>($"{Root}/Monsters/{(boss ? "boss" : "common")}_{id}.asset");
                m.id = id;
                m.displayName = name;
                m.isBoss = boss;
                m.hp = hp;
                m.attack = atk;
                m.defense = def;
                m.minLevel = minLevel;
                m.speed = speed;
                m.colored = flags.Contains("cor");
                m.fire = flags.Contains("fogo");
                m.ranged = flags.Contains("dist");
                m.support = flags.Contains("sup");
                m.moves = new List<MoveDefinition>(moves);
                EditorUtility.SetDirty(m);
                (boss ? bosses : commons).Add(m);
            }

            // §8.1 — comuns, na ordem do jogo publicado (a ordem define os grupos das masmorras).
            Monster(false, "pawn", "Servo", 30, 9, 2, 1, 12, "cor",
                M("Facada do Servo", "P"), M("Corte Apressado", "P.75"), M("Dança das Facas", "P1.2 P.7a", 3));
            Monster(false, "archer", "Arqueiro", 24, 12, 1, 1, 9, "cor dist",
                M("Flecha Certeira", "P"), M("Tiro Traiçoeiro", "P1.35a"), M("Chuva de Flechas", "P.8 P.8", 3));
            Monster(false, "lancer", "Lanceiro", 40, 11, 4, 1, 7, "cor",
                M("Investida Dupla", "P J.85"), M("Varredura Rasteira", "J1.25a P.7"));
            Monster(false, "monk", "Monge", 26, 10, 2, 1, 8, "cor sup dist",
                M("Feitiço Sombrio", "P"), M("Chama Voraz", "P.75"), M("Prece Invertida", "P1.4a"));
            Monster(false, "gnome", "Gnomo Arruaceiro", 24, 9, 1, 1, 11, "",
                M("Cutucada Traquina", "P.85"), M("Salto Zombeteiro", "J.85"), M("Dupla Travessura", "P.8 J.75", 3));
            Monster(false, "thief", "Ladrão", 26, 10, 1, 2, 10, "",
                M("Facada Rápida", "P.9"), M("Corte e Fuga", "S.85"), M("Roubo Relâmpago", "P1.25a", 4));
            Monster(false, "snake", "Cobra Venenosa", 24, 11, 1, 2, 9, "",
                M("Bote Venenoso", "P"), M("Rasteira Sibilante", "S.9"), M("Picada Dupla", "P.8 P.8", 4));
            Monster(false, "spider", "Aranha Gigante", 28, 10, 2, 3, 9, "",
                M("Mordida Peçonhenta", "P"), M("Teia Pegajosa", "S.9"), M("Investida de Oito Pernas", "J.9 P.75", 5));
            Monster(false, "torch", "Goblin da Tocha", 28, 10, 2, 3, 9, "cor fogo",
                M("Tocha Flamejante", "P"), M("Giro Incendiário", "J.9"), M("Dança do Fogo", "P.8 J.85", 5));
            Monster(false, "tnt", "Goblin Dinamite", 22, 9, 1, 3, 8, "cor fogo dist",
                M("Dinamite Acesa", "P"), M("Pavio Curto", "P.7"), M("Bomba Rolante", "S.95"), M("Barril Explosivo", "P1.3a", 5));
            Monster(false, "skull", "Caveira Amaldiçoada", 32, 11, 3, 4, 7, "",
                M("Golpe Ósseo", "P"), M("Risada Sinistra", "J.9"), M("Maldição Óssea", "P.85 P.85", 6));
            Monster(false, "mino", "Minotauro", 46, 13, 3, 4, 7, "",
                M("Machadada Brutal", "P.9"), M("Investida do Touro", "S.85"), M("Giro do Machado", "J.9 P.8", 6));
            Monster(false, "gnoll", "Gnoll Arremessador", 30, 12, 2, 5, 8, "dist",
                M("Osso Arremessado", "P"), M("Ossada Giratória", "J.85"), M("Chuva de Ossos", "P.75 P.75", 7));
            Monster(false, "lizard", "Lagarto Cuspidor", 32, 11, 2, 6, 8, "dist",
                M("Cuspe Ácido", "P"), M("Rajada Ácida", "P.75 P.75", 8), M("Salto Corrosivo", "J.9"));
            Monster(false, "harpoonfish", "Peixe Arpoador", 30, 12, 2, 7, 8, "dist",
                M("Arpoada", "P"), M("Arpão Giratório", "J.9"), M("Chuva de Arpões", "P.8 J.8", 9));
            Monster(false, "paddlefish", "Peixe-Remo", 36, 12, 3, 8, 7, "",
                M("Rabada Forte", "P.95"), M("Investida Aquática", "S.9"), M("Marolas Consecutivas", "S.75 P.8", 10));
            Monster(false, "shaman", "Xamã Selvagem", 34, 13, 2, 9, 7, "dist",
                M("Explosão Mística", "P"), M("Vórtice Arcano", "P.8 P.8", 11), M("Chama Ritual", "J.9"));
            Monster(false, "turtle", "Tartaruga Blindada", 48, 11, 6, 10, 4, "",
                M("Investida do Casco", "S.9"), M("Mordida de Casco", "P.9"), M("Rolamento Blindado", "J.9 S.85", 12));
            Monster(false, "wlancer", "Cavaleiro Selvagem", 40, 14, 4, 12, 7, "",
                M("Lançada Selvagem", "P"), M("Investida Feroz", "J.9"), M("Fúria da Lança", "P1.1 J.85", 14));

            // §8.2 — chefes, na ordem do jogo publicado (define o chefe fixo de cada masmorra).
            Monster(true, "boss", "Cavaleiro", 160, 20, 6, 1, 6, "cor",
                M("Julgamento do Cavaleiro", "P J.9 P.7"), M("Lâmina Paciente", "P1.5a P.65"),
                M("Tempestade de Aço", "J.85 P.8 P1.2d"));
            Monster(true, "kingslime", "Rei Slime", 200, 18, 4, 1, 6, "",
                M("Esmagada Real", "P"), M("Salto do Rei", "J.9"), M("Onda Gosmenta", "S.9"),
                M("Fúria Gelatinosa", "P.8 S.8", 7));
            Monster(true, "tree", "Árvore Anciã", 170, 19, 8, 1, 5, "dist",
                M("Chicote de Raiz", "P"), M("Raízes Rasteiras", "J.95"), M("Galhada Giratória", "S.9"),
                M("Ira da Floresta", "P.85 J.8", 7));
            Monster(true, "bear", "Urso Feroz", 180, 19, 5, 2, 6, "",
                M("Patada Brutal", "P1.1"), M("Investida Ursina", "S.95"), M("Abraço Esmagador", "P.85 J.85"),
                M("Fúria da Floresta", "P.9 S.85 P.85", 5));
            Monster(true, "minolord", "Minotauro Ancestral", 210, 20, 6, 4, 6, "",
                M("Corte do Machado Ancestral", "P1.1"), M("Investida do Touro Ancião", "S.95"),
                M("Giro Devastador", "J.9 P.85"), M("Fúria do Labirinto", "J.85 P.8 P.85", 7));
            Monster(true, "troll", "Troll das Cavernas", 230, 21, 7, 6, 4, "",
                M("Pancada do Porrete", "P1.2a"), M("Varredura Brutal", "S1"), M("Esmagamento Duplo", "P.9 P.9"),
                M("Fúria da Caverna", "S.85 P.85 J.85", 9));
            Monster(true, "panda", "Panda Guerreiro", 190, 18, 6, 9, 6, "",
                M("Golpe do Bambu", "P1.05"), M("Chute Giratório", "J.9"), M("Postura Impenetrável", "P.85 S.85"),
                M("Fúria do Mestre", "J.85 P.85 S.85", 12));

            // §3 — heróis.
            var heroes = new List<HeroDefinition>();
            void Hero(string id, string name, HeroClass cls, int hp, int atk, int def, bool furyOnAttack, int city)
            {
                var h = LoadOrCreate<HeroDefinition>($"{Root}/Heroes/{id}.asset");
                h.id = id;
                h.displayName = name;
                h.heroClass = cls;
                h.maxHp = hp;
                h.attack = atk;
                h.defense = def;
                h.furyOnAttack = furyOnAttack;
                h.recruitCity = city;
                EditorUtility.SetDirty(h);
                heroes.Add(h);
            }

            Hero("warrior", "Guerreiro", HeroClass.Warrior, 60, 10, 3, true, -1);
            Hero("mage", "Mago Arcanista", HeroClass.Mage, 45, 8, 2, false, 0);
            Hero("huntress", "Caçadora", HeroClass.Warrior, 55, 12, 2, false, 2);
            Hero("lancer", "Lanceiro", HeroClass.Warrior, 75, 11, 5, false, 4);
            Hero("monk", "Monge", HeroClass.Warrior, 52, 9, 3, false, 6);

            // §10.3 — gemas, na ordem dos pergaminhos.
            var gems = new List<GemDefinition>();
            void Gem(GemId id, string name, int cost, string description)
            {
                var g = LoadOrCreate<GemDefinition>($"{Root}/Gems/{id}.asset");
                g.id = id;
                g.displayName = name;
                g.buyCost = cost;
                g.descriptionFormat = description;
                EditorUtility.SetDirty(g);
                gems.Add(g);
            }

            Gem(GemId.Stone, "Gema do Arremesso", 250, "{0} pedradas grátis por rodada");
            Gem(GemId.Vital, "Gema Vital", 300, "Parry perfeito cura {0}% do HP máximo");
            Gem(GemId.Echo, "Gema do Eco", 400, "Ataque simples golpeia 2x (eco com {0}% do dano)");
            Gem(GemId.Pierce, "Gema Perfurante", 400, "{0}% do dano atravessa os escudos arcanos");

            var db = LoadOrCreate<GameDatabase>($"{Root}/GameDatabase.asset");
            db.balance = balance;
            db.commons = commons;
            db.bosses = bosses;
            db.heroes = heroes;
            db.gems = gems;
            EditorUtility.SetDirty(db);
            AssetDatabase.SaveAssets();
            Debug.Log($"GDM: {commons.Count} comuns, {bosses.Count} chefes, {heroes.Count} heróis e {gems.Count} gemas prontos.");
        }

        // Um golpe a partir da notação da Parte 1 §8.3.
        private static MoveDefinition M(string name, string notation, int minLevel = 1)
        {
            var move = new MoveDefinition { name = name, minLevel = minLevel };
            foreach (string token in notation.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            {
                var match = HitToken.Match(token);
                if (!match.Success) throw new FormatException($"Hit inválido '{token}' em {name}");
                move.hits.Add(new HitSpec
                {
                    type = match.Groups[1].Value == "P" ? ReactionType.Parry
                        : match.Groups[1].Value == "J" ? ReactionType.Jump : ReactionType.Side,
                    speed = match.Groups[2].Value == "" ? 1f
                        : float.Parse(match.Groups[2].Value, CultureInfo.InvariantCulture),
                    curve = match.Groups[3].Value == "a" ? QteCurve.Accel
                        : match.Groups[3].Value == "d" ? QteCurve.Decel : QteCurve.Linear,
                });
            }
            return move;
        }

        // Carrega o asset do caminho ou cria um novo ali (criando as pastas que faltarem).
        private static T LoadOrCreate<T>(string path) where T : ScriptableObject
        {
            var asset = AssetDatabase.LoadAssetAtPath<T>(path);
            if (asset != null) return asset;
            string folder = System.IO.Path.GetDirectoryName(path).Replace('\\', '/');
            if (!AssetDatabase.IsValidFolder(folder))
                AssetDatabase.CreateFolder(System.IO.Path.GetDirectoryName(folder).Replace('\\', '/'), System.IO.Path.GetFileName(folder));
            asset = ScriptableObject.CreateInstance<T>();
            AssetDatabase.CreateAsset(asset, path);
            return asset;
        }
    }
}
```

1. Salve e espere compilar. A barra de menus ganha o menu **GDM**.
2. **GDM → Criar ou atualizar dados iniciais**. O Console mostra `GDM: 19 comuns, 7 chefes, 5 heróis e 4 gemas prontos.`

### 🧪 Teste rápido
Abra `Data/Monsters/common_lancer`: dois golpes; **Investida Dupla** tem 2 hits (Parry com speed 1; Jump com speed 0.85). Abra `boss_boss`: **Tempestade de Aço** termina com um Parry de speed 1.2 e curva **Decel**.

### ✅ Checkpoint da Fase 1
- `GameDatabase` lista 5 heróis, 19 comuns (Servo primeiro, Cavaleiro Selvagem por último), 7 chefes (Cavaleiro primeiro) e 4 gemas.
- Commit: `feat: dados do jogo`.

#### Problemas comuns
- **`FormatException: Hit inválido`:** um golpe foi digitado fora da notação (use ponto decimal, `P.85`, nunca vírgula).
- **Menu GDM não aparece:** o script não está numa pasta chamada exatamente `Editor`.

Próxima fase: **as regras de combate**, em C# puro.

---

# Parte 5 — Implementação Unity: Fase 2 (Regras de combate em C# puro)

## Fase 2 — Regras de combate em C# puro

> Objetivo desta fase: tudo o que é número e sorteio no combate (montagem das ondas, iniciativa, dano, reação, Fúria, exaustão, cansaço, tempo do círculo) em classes C# comuns, conferidas com um script de teste no Console. Nenhuma cena muda nesta fase.

**Conceitos novos:**
- **Classe C# comum:** não herda de `MonoBehaviour`, não vive na cena, é criada com `new`. É onde as regras moram, para serem testáveis (Fase 8).
- **Interface:** um "contrato" (`IRandom`) que diz quais métodos uma classe precisa ter, sem dizer como. Quem usa a interface não sabe nem se importa com qual implementação recebeu. É assim que o jogo usa sorteio de verdade e os testes usam números fixos.
- **`static class`:** só métodos, sem estado. Boa para fórmulas.
- **`struct` somente leitura:** um valor pequeno e imutável, como o resultado de um golpe.

### Etapa 2A — Estado: sorteio, monstro e herói

```csharp
// Caminho: Assets/_Project/Scripts/Combat/GameRandom.cs
namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: todo sorteio do combate (crítico, golpe escolhido, iniciativa,
    // dano extra) passa por aqui, para os testes poderem trocar o acaso por
    // números escolhidos.
    // ESTRATÉGIA: `Range` inclui os dois extremos, igual ao `rnd(a, b)` do
    // jogo publicado; `Value` devolve um número em [0, 1), igual ao Math.random.
    public interface IRandom
    {
        int Range(int minInclusive, int maxInclusive);
        double Value();
    }

    // POR QUE: a implementação usada no jogo, com o gerador do .NET.
    public sealed class SystemRandom : IRandom
    {
        private readonly System.Random _random;

        // Sem semente: cada partida sorteia diferente. Com semente: repete a mesma sequência.
        public SystemRandom(int? seed = null)
        {
            _random = seed.HasValue ? new System.Random(seed.Value) : new System.Random();
        }

        public int Range(int minInclusive, int maxInclusive) => _random.Next(minInclusive, maxInclusive + 1);

        public double Value() => _random.NextDouble();
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/Monster.cs
using System;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: um monstro vivo numa onda, com os atributos já escalados
    // para o nível da masmorra (Parte 1 §9) e o estado de combate: escudos,
    // cansaço, exaustão, Fase 2.
    // ESTRATÉGIA: campos públicos simples, alterados pelas regras de combate.
    public sealed class Monster
    {
        public readonly MonsterDefinition Definition;
        public string Name;
        public DungeonColor Color;
        public int MaxHp;
        public int Hp;
        public int Attack;
        public int Defense;
        public int Gold;

        public int Shield;
        public int Fatigue;
        public int ExhaustTurns;

        public bool IsBoss;
        public bool IsEscort;
        public bool HasPhase2;
        public bool Enraged;
        public bool Dead;

        // Cria o monstro a partir da definição; quem escala os números é o WaveFactory.
        public Monster(MonsterDefinition definition)
        {
            Definition = definition;
        }

        public string Id => Definition.id;
        public bool Fire => Definition.fire;
        public bool Ranged => Definition.ranged;
        public bool Support => Definition.support;
        public bool Exhausted => ExhaustTurns > 0;

        // Tira HP sem passar de zero.
        public void TakeDamage(int amount)
        {
            if (amount > 0) Hp = Math.Max(0, Hp - amount);
        }

        // Recupera HP sem passar do máximo.
        public void Heal(int amount)
        {
            Hp = Math.Min(MaxHp, Hp + amount);
        }

        // Chefe marcado para Fase 2 que caiu a 50% do HP (Parte 1 §8.4).
        public bool ShouldEnrage => HasPhase2 && !Enraged && !Dead && Hp <= MaxHp * 0.5;

        // Entra na Fase 2: ATK multiplicado; os outros efeitos são lidos de `Enraged`.
        public void Enrage(double attackMult)
        {
            Enraged = true;
            Attack = MathUtil.RoundHalfUp(Attack * attackMult);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/HeroRun.cs
using System;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: o que o herói leva para a masmorra: atributos comprados,
    // Habilidade e gema equipada (Parte 1 §10).
    // ESTRATÉGIA: montado pelo acampamento a partir do save (Fase 7) ou à
    // mão nos testes. `UnlockAllSkills` serve ao treino e aos testes.
    public sealed class HeroLoadout
    {
        public HeroDefinition Hero;
        public int MaxHp;
        public int Attack;
        public int Defense;
        public int DefensePurchases;
        public int SkillLevel;
        public bool HasGem;
        public GemId Gem;
        public int GemLevelValue;
        public bool UnlockAllSkills;

        // Nível da gema em efeito: 0 se ela não for a equipada.
        public int GemLevel(GemId id) => HasGem && Gem == id ? GemLevelValue : 0;

        // Quantos especiais a Habilidade já liberou.
        public int SkillsUnlocked(int step) => UnlockAllSkills ? 99 : SkillLevel / step;

        // Loadout de um herói recém-recrutado, só com os atributos iniciais.
        public static HeroLoadout Fresh(HeroDefinition hero) => new HeroLoadout
        {
            Hero = hero,
            MaxHp = hero.maxHp,
            Attack = hero.attack,
            Defense = hero.defense,
        };
    }

    public enum CurseType
    {
        Drain,
        SealFury,
    }

    // POR QUE: encanto do Monge inimigo sobre o herói (Parte 1 §8.5).
    public sealed class Curse
    {
        public CurseType Type;
        public int Turns;
        public int Power;
    }

    // POR QUE: o estado do herói durante uma masmorra: HP, Fúria, guarda,
    // poções, dinamites, maldição, ouro coletado e se a run segue perfeita.
    // ESTRATÉGIA: nasce cheio a cada masmorra e morre com ela. As regras de
    // Fúria (§7.1) e da barra de guarda (§7.2) são métodos daqui.
    public sealed class HeroRun
    {
        public readonly HeroLoadout Loadout;

        public int Hp;
        public int Fury;
        public bool Exhausted;
        public bool GuardBroken;
        public double Stagger;
        public int Potions;
        public int Adrenaline;
        public int Dynamite;
        public int DynamitePower;
        public Curse Curse;
        public bool Flawless = true;
        public int RunGold;
        public int RocksLeft;
        // Couraça Arcana do Mago: absorve dano do próximo golpe (Parte 1 §11).
        public int Ward;

        // Começa a masmorra com HP cheio e as poções da Parte 1 §6.
        public HeroRun(HeroLoadout loadout, GameBalance balance)
        {
            Loadout = loadout;
            Hp = loadout.MaxHp;
            Potions = balance.potionsPerRun;
            Adrenaline = balance.adrenalinePerRun;
        }

        public int MaxHp => Loadout.MaxHp;
        public int Attack => Loadout.Attack;
        public int Defense => Loadout.Defense;
        public bool Dead => Hp <= 0;

        // Segmentos da barra de guarda: 5, +1 a cada 5 compras de Defesa, teto 20.
        public int StaggerCap => Math.Min(20, 5 + Loadout.DefensePurchases / 5);

        public bool FurySealed => Curse != null && Curse.Type == CurseType.SealFury;

        // +n de Fúria (teto 5), a menos que o Selo da Fúria esteja ativo.
        public void GainFury(int amount = 1)
        {
            if (FurySealed) return;
            Fury = Math.Min(5, Fury + amount);
        }

        // Gasta só o que usou: a barra não zera (Parte 1 §7.1).
        public void SpendFury(int amount)
        {
            Fury = Math.Max(0, Fury - amount);
        }

        // Soma dano à barra de guarda. Devolve true se a guarda quebrou.
        public bool AddStagger(int damage, bool inCombo)
        {
            if (Stagger >= StaggerCap && inCombo)
            {
                Stagger = 0;
                Exhausted = true;
                GuardBroken = true;
                return true;
            }
            Stagger = Math.Min(StaggerCap, Stagger + Math.Max(0.3, damage * 7.0 / MaxHp));
            return false;
        }

        // Tira HP; qualquer dano acaba com a run perfeita.
        public void TakeDamage(int amount)
        {
            if (amount <= 0) return;
            Flawless = false;
            Hp = Math.Max(0, Hp - amount);
        }

        // Cura até o máximo e devolve quanto curou de fato.
        public int Heal(int amount)
        {
            int before = Hp;
            Hp = Math.Min(MaxHp, Hp + amount);
            return Hp - before;
        }

        // Gruda uma dinamite (teto `max`); a potência é a maior já registrada.
        public void AddDynamite(int monsterAttack, int max)
        {
            if (Dynamite >= max) return;
            Dynamite++;
            DynamitePower = Math.Max(DynamitePower, CombatMath.DynamitePower(monsterAttack));
        }
    }
}
```

### Etapa 2B — Ondas e iniciativa

```csharp
// Caminho: Assets/_Project/Scripts/Combat/DungeonMath.cs
using System;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: as fórmulas de masmorra da Parte 1 §9 e §10 (escala, ouro,
    // bônus, NG+, cansaço), num lugar só.
    // ESTRATÉGIA: funções puras sobre (nível, ciclo NG+, balanceamento).
    public static class DungeonMath
    {
        // Nível efetivo: controla tudo que é "liberado a partir do nível X".
        public static int EffectiveLevel(int level, int ngPlus, GameBalance b) => level + ngPlus * b.ngLevelOffset;

        // 1,25 elevado ao ciclo NG+.
        public static double NgMult(int ngPlus, GameBalance b) => Math.Pow(b.ngStatMult, ngPlus);

        // Encolhimento do círculo de reação no NG+, com piso.
        public static double NgSpeedMult(int ngPlus, GameBalance b) => Math.Max(b.ngQteFloor, 1 - ngPlus * b.ngQteShrink);

        // Multiplicador dos atributos dos monstros de uma onda.
        public static double StatMult(int level, int ngPlus, int wave, GameBalance b) =>
            (1 + (level - 1) * b.statGainPerLevel) * NgMult(ngPlus, b) * (wave == 2 ? b.wave2StatMult : 1);

        // Ouro de cada monstro de uma onda.
        public static int GoldPerMonster(int level, int ngPlus, int wave, GameBalance b) =>
            MathUtil.RoundHalfUp((b.goldBase + b.goldPerLevel * level) * NgMult(ngPlus, b) * (wave == 2 ? b.wave2GoldMult : 1));

        // Bônus de vitória da masmorra (antes de dobrar por run perfeita ou vídeo).
        public static int VictoryBonus(int level, int ngPlus, GameBalance b) =>
            MathUtil.RoundHalfUp((b.victoryBase + b.victoryPerLevel * (level - 1)) * NgMult(ngPlus, b));

        // Ouro do Baú do Dia.
        public static int ChestReward(int level, int ngPlus, GameBalance b) =>
            MathUtil.RoundHalfUp((b.chestBase + b.chestPerLevel * (level - 1)) * NgMult(ngPlus, b));

        // Teto do cansaço: comum 5, chefe 10; dobra no nível efetivo alto.
        public static int FatigueCap(bool boss, int effectiveLevel, GameBalance b) =>
            (boss ? b.fatigueBoss : b.fatigueCommon) * (effectiveLevel >= b.fatigueHighLevel ? 2 : 1);

        // Masmorras cujo chefe derruba Pergaminho de Gema.
        public static bool DropsGemScroll(int level) => level == 1 || level % 5 == 0;

        // "Vermelha", "Negra"... (nome da masmorra).
        public static string ColorName(DungeonColor color) => color switch
        {
            DungeonColor.Red => "Vermelha",
            DungeonColor.Black => "Negra",
            DungeonColor.Blue => "Azul",
            DungeonColor.Purple => "Púrpura",
            _ => "Dourada",
        };

        // "Cavaleiro Vermelho"... (nome do chefe genérico).
        public static string KnightName(DungeonColor color) => color switch
        {
            DungeonColor.Red => "Cavaleiro Vermelho",
            DungeonColor.Black => "Cavaleiro Negro",
            DungeonColor.Blue => "Cavaleiro Azul",
            DungeonColor.Purple => "Cavaleiro Púrpura",
            _ => "Cavaleiro Dourado",
        };
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/WaveFactory.cs
using System.Collections.Generic;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: monta os monstros de cada onda (Parte 1 §9): grupo fixo da
    // masmorra, escala por nível, chefe fixo, Fase 2 e escolta.
    // ESTRATÉGIA: a ordem das listas `commons` e `bosses` do GameDatabase é
    // regra de jogo; o único sorteio é quais tipos do grupo entram e se o
    // chefe terá Fase 2.
    public static class WaveFactory
    {
        private const string Letters = "ABC";

        // Os monstros da onda `wave` (1 a 3) da masmorra `level`.
        public static List<Monster> Make(int wave, int level, int ngPlus, DungeonColor color, GameDatabase db, IRandom rng)
        {
            var b = db.balance;
            int effective = DungeonMath.EffectiveLevel(level, ngPlus, b);
            double mult = DungeonMath.StatMult(level, ngPlus, wave, b);
            int gold = DungeonMath.GoldPerMonster(level, ngPlus, wave, b);
            var group = Group(level, effective, db);

            if (wave < 3)
            {
                var wave12 = new List<Monster>();
                for (int i = 0; i < 3; i++)
                    wave12.Add(Create(group[rng.Range(0, group.Count - 1)], mult, gold, i, 3, color));
                return wave12;
            }

            var bossPool = db.bosses.FindAll(m => m.minLevel <= effective);
            var bossDef = bossPool[(level - 1) % bossPool.Count];
            var boss = Create(bossDef, mult, gold, 0, 1, color);
            boss.IsBoss = true;
            boss.HasPhase2 = effective >= b.phase2MinLevel && rng.Value() < b.phase2Chance;
            if (bossDef.id == "boss") boss.Name = DungeonMath.KnightName(color);

            var wave3 = new List<Monster> { boss };
            if (level % 5 == 0)
            {
                // Masmorras 5, 10, 15...: o chefe vem com dois guardas mais fracos.
                for (int i = 0; i < 2; i++)
                {
                    var guard = Create(group[rng.Range(0, group.Count - 1)], mult, gold, i, 2, color);
                    guard.MaxHp = guard.Hp = MathUtil.RoundHalfUp(guard.MaxHp * b.escortHp);
                    guard.Attack = MathUtil.RoundHalfUp(guard.Attack * b.escortAtk);
                    guard.Gold = MathUtil.RoundHalfUp(guard.Gold * b.escortGold);
                    guard.IsEscort = true;
                    wave3.Add(guard);
                }
            }
            return wave3;
        }

        // O grupo fixo de até 4 tipos comuns desta masmorra.
        public static List<MonsterDefinition> Group(int level, int effectiveLevel, GameDatabase db)
        {
            var pool = db.commons.FindAll(m => m.minLevel <= effectiveLevel);
            int size = System.Math.Min(db.balance.maxCommonGroup, pool.Count);
            int start = (level - 1) % pool.Count;
            var group = new List<MonsterDefinition>();
            for (int i = 0; i < size; i++) group.Add(pool[(start + i) % pool.Count]);
            return group;
        }

        // Um monstro escalado. Com mais de um na onda, o nome ganha A, B ou C.
        private static Monster Create(MonsterDefinition def, double mult, int gold, int index, int count, DungeonColor color)
        {
            int hp = MathUtil.RoundHalfUp(def.hp * mult);
            return new Monster(def)
            {
                Name = count > 1 ? $"{def.displayName} {Letters[index]}" : def.displayName,
                Color = color,
                MaxHp = hp,
                Hp = hp,
                Attack = MathUtil.RoundHalfUp(def.attack * mult),
                Defense = MathUtil.RoundHalfUp(def.defense * mult),
                Gold = gold,
            };
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/Initiative.cs
using System.Collections.Generic;
using System.Linq;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: uma vaga na fila da rodada: o herói (Monster null) ou um monstro.
    public readonly struct TurnSlot
    {
        public readonly Monster Monster;

        public TurnSlot(Monster monster)
        {
            Monster = monster;
        }

        public bool IsHero => Monster == null;
    }

    // POR QUE: a fila de iniciativa da Parte 1 §4.
    // ESTRATÉGIA: cada vivo rola velocidade + d(0..5); chefe em Fase 2 entra
    // 2–3 vezes com +3. A ordenação é estável (OrderByDescending do LINQ):
    // num empate, quem entrou primeiro na lista vai antes, e o herói entra
    // primeiro, como no jogo publicado.
    public static class Initiative
    {
        // A fila desta rodada, do mais rápido para o mais lento.
        public static List<TurnSlot> Roll(IReadOnlyList<Monster> monsters, IRandom rng, GameBalance b)
        {
            var entries = new List<(TurnSlot slot, int roll)> { (new TurnSlot(null), b.heroSpeed + rng.Range(0, 5)) };
            foreach (var monster in monsters)
            {
                if (monster.Dead) continue;
                int times = monster.Enraged ? rng.Range(2, 3) : 1;
                for (int i = 0; i < times; i++)
                {
                    int roll = monster.Definition.speed + rng.Range(0, 5) + (monster.Enraged ? 3 : 0);
                    entries.Add((new TurnSlot(monster), roll));
                }
            }
            return entries.OrderByDescending(e => e.roll).Select(e => e.slot).ToList();
        }
    }
}
```

### Etapa 2C — Fórmulas

```csharp
// Caminho: Assets/_Project/Scripts/Combat/CombatMath.cs
using System;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: uma faixa do especial Fúria (Parte 1 §7.1).
    public readonly struct FuryTier
    {
        public readonly double Mult;
        public readonly int Cost;
        public readonly bool AllTargets;
        public readonly bool ChargeBar;

        public FuryTier(double mult, int cost, bool allTargets, bool chargeBar)
        {
            Mult = mult;
            Cost = cost;
            AllTargets = allTargets;
            ChargeBar = chargeBar;
        }
    }

    // POR QUE: os multiplicadores e fórmulas de dano das Partes 1 §5 a §8.
    // ESTRATÉGIA: constantes com nome (valores iniciais) + funções puras.
    // Quem aplica o dano e mostra o número é o código da cena.
    public static class CombatMath
    {
        public const double CritChance = 0.15;
        public const double RiposteMult = 0.5;
        public const double AerialMult = 0.9;
        public const double RockMult = 0.2;
        public const double BladeMult = 0.85;
        public const double BladeFatigue = 0.9;
        public const double ComboHitAttackMult = 0.65;
        public const double HealPotionFraction = 0.4;
        public const double BoomMult = 0.5;
        public const double DynamiteMult = 0.4;
        public const double CurseMult = 0.5;
        public const double MonkHealFraction = 0.3;
        public const double EnrageAttackMult = 1.4;
        public const double EnrageQteMult = 0.75;
        public const double FuryCritMult = 2.5;
        public const double CounterMin = 1.5;
        public const double CounterMax = 2.0;
        public static readonly double[] ComboMults = { 1.2, 1.4, 1.8, 2.0 };
        public static readonly double[] SequenceMults = { 1.1, 1.5, 2.0 };

        // Golpe do herói: max(1, round(ATK × mult) − DEF + variação).
        public static int HeroStrike(int attack, double mult, int defense, int jitter) =>
            Math.Max(1, MathUtil.RoundHalfUp(attack * mult) - defense + jitter);

        // Golpe de monstro que acerta em cheio: ATK + d(0..3).
        public static int FullHit(int attack, IRandom rng) => attack + rng.Range(0, 3);

        // Golpe bloqueado: a DEF do herói absorve.
        public static int Blocked(int attack, int heroDefense) => Math.Max(0, attack - heroDefense);

        // Em combos de vários hits, cada hit vale 65% do ATK.
        public static int ComboHitAttack(int attack, int hits) =>
            hits > 1 ? MathUtil.RoundHalfUp(attack * ComboHitAttackMult) : attack;

        // Pedrada: 20% do ATK, ignorando DEF.
        public static int Rock(int attack) => Math.Max(1, MathUtil.RoundHalfUp(attack * RockMult));

        // Dano que a Gema Perfurante deixa atravessar o escudo (0 sem a gema).
        public static int Pierce(double rawDamage, int gemLevel) =>
            gemLevel <= 0 ? 0 : Math.Max(1, MathUtil.RoundHalfUp(rawDamage * (0.3 + 0.1 * gemLevel)));

        // Cura da Gema Vital no parry perfeito.
        public static int VitalHeal(int maxHp, int gemLevel) =>
            Math.Max(1, MathUtil.RoundHalfUp(maxHp * (0.03 + 0.02 * gemLevel)));

        // Força do segundo golpe da Gema do Eco.
        public static double EchoMult(int gemLevel) => 0.375 + 0.125 * gemLevel;

        // Pedradas grátis por rodada.
        public static int RocksPerRound(int stoneGemLevel) => 1 + stoneGemLevel;

        // Explosão Final de um goblin de fogo.
        public static int BoomDamage(int attack) => Math.Max(3, MathUtil.RoundHalfUp(attack * BoomMult));

        // Estilhaço da explosão num outro monstro.
        public static int BoomSplash(int boom, int defense) => Math.Max(1, boom - MathUtil.RoundHalfUp(defense / 2.0));

        // Potência de uma dinamite grudada.
        public static int DynamitePower(int attack) => Math.Max(3, MathUtil.RoundHalfUp(attack * DynamiteMult));

        // Dano por turno da Maldição Sombria.
        public static int CursePower(int attack) => Math.Max(3, MathUtil.RoundHalfUp(attack * CurseMult));

        // A faixa do especial Fúria para a Fúria atual (null sem Fúria).
        public static FuryTier? FuryTierFor(int fury)
        {
            if (fury >= 5) return new FuryTier(2.0, 5, true, true);
            if (fury >= 3) return new FuryTier(1.5, 3, false, false);
            if (fury >= 2) return new FuryTier(1.2, 2, false, false);
            if (fury >= 1) return new FuryTier(1.1, 1, false, false);
            return null;
        }

        // Quantos golpes o Combo dá com a Fúria atual.
        public static int ComboHits(int fury) => fury >= 4 ? 4 : fury >= 3 ? 3 : 2;

        // Zona da barra oscilante: 0 fraca (60%), 1 forte (30%), 2 muito forte (10%).
        public static int SequenceZone(double position) => position < 0.6 ? 0 : position < 0.9 ? 1 : 2;

        // Cansaço (Parte 1 §7.3): devolve true se o golpe deixou o monstro exausto.
        public static bool AddFatigue(Monster monster, double mult, int effectiveLevel, GameBalance b)
        {
            if (monster.Dead) return false;
            int cap = DungeonMath.FatigueCap(monster.IsBoss, effectiveLevel, b);
            if (monster.Fatigue >= cap && mult >= 1.5)
            {
                monster.Fatigue = 0;
                monster.ExhaustTurns = b.exhaustTurns;
                return true;
            }
            monster.Fatigue = Math.Min(cap, monster.Fatigue + 1);
            return false;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/Strikes.cs
using System;

namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: o que aconteceu quando o herói acertou um monstro.
    public readonly struct StrikeOutcome
    {
        public readonly int Damage;
        public readonly int ShieldsBroken;
        public readonly int Pierced;
        public readonly bool Killed;

        public StrikeOutcome(int damage, int shieldsBroken, int pierced, bool killed)
        {
            Damage = damage;
            ShieldsBroken = shieldsBroken;
            Pierced = pierced;
            Killed = killed;
        }
    }

    // POR QUE: toda fonte de dano do herói (ataque, especiais, riposte,
    // contra-ataque, ataque aéreo, pedrada) passa pela mesma regra de escudo
    // arcano (Parte 1 §8.4).
    // ESTRATÉGIA: com escudo, quebra até `shieldBreak` escudos e a Gema
    // Perfurante fura uma parte do `pierceRaw`; sem escudo, tira o dano
    // inteiro. Quem chama decide o que fazer se `Killed` (marcar como morto,
    // pagar ouro, explodir).
    public static class Strikes
    {
        // Aplica um golpe do herói.
        public static StrikeOutcome Apply(Monster monster, int damage, int shieldBreak, double pierceRaw, int pierceGemLevel)
        {
            if (monster.Dead) return default;
            if (monster.Shield > 0)
            {
                int broke = Math.Min(monster.Shield, shieldBreak);
                monster.Shield -= broke;
                int pierced = CombatMath.Pierce(pierceRaw, pierceGemLevel);
                monster.TakeDamage(pierced);
                return new StrikeOutcome(0, broke, pierced, monster.Hp <= 0);
            }
            monster.TakeDamage(damage);
            return new StrikeOutcome(damage, 0, 0, monster.Hp <= 0);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/HitResolver.cs
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: o que o jogador fez no círculo de reação. Dodge vale para salto
    // e lateral; Perfect e Block, para parry; Miss é não reagir (ou reagir
    // com o gesto errado).
    public enum QteResult
    {
        Miss,
        Perfect,
        Block,
        Dodge,
    }

    // POR QUE: o resultado de um hit de monstro, para a tela mostrar.
    public struct HitOutcome
    {
        public ReactionType Type;
        public QteResult Result;
        public int Damage;
        public bool Defended;
        public StrikeOutcome Riposte;
        public int Healed;
        public bool GotDynamite;
        public bool GuardBroke;
        public int WardAbsorbed;
        public bool MonsterExhausted;
    }

    // POR QUE: a tabela de resultados da Parte 1 §5 inteira, num lugar só.
    // ESTRATÉGIA: aplica o efeito no herói e no monstro e devolve o resumo.
    // `Defended` diz se o hit conta para o contra-ataque de combo inteiro
    // (só parry PERFEITO e esquivas contam; bloqueio não).
    public static class HitResolver
    {
        // Resolve um hit com a reação dada.
        public static HitOutcome Resolve(HeroRun hero, Monster monster, ReactionType type, QteResult result,
            int attack, bool inCombo, int effectiveLevel, GameBalance b, IRandom rng)
        {
            var outcome = new HitOutcome { Type = type, Result = result };
            int damage;

            if (type == ReactionType.Side)
            {
                damage = result == QteResult.Dodge ? 0 : CombatMath.FullHit(attack, rng);
            }
            else if (type == ReactionType.Jump)
            {
                damage = result == QteResult.Dodge ? 0 : CombatMath.FullHit(attack, rng);
                if (result == QteResult.Dodge) hero.GainFury();
            }
            else if (result == QteResult.Perfect)
            {
                damage = 0;
                hero.GainFury();
                outcome.MonsterExhausted = CombatMath.AddFatigue(monster, 1, effectiveLevel, b);
                int riposte = CombatMath.HeroStrike(hero.Attack, CombatMath.RiposteMult, monster.Defense, 0);
                outcome.Riposte = Strikes.Apply(monster, riposte, 1, riposte, hero.Loadout.GemLevel(GemId.Pierce));
                int vital = hero.Loadout.GemLevel(GemId.Vital);
                if (vital > 0 && hero.Hp < hero.MaxHp) outcome.Healed = hero.Heal(CombatMath.VitalHeal(hero.MaxHp, vital));
            }
            else if (result == QteResult.Block)
            {
                damage = CombatMath.Blocked(attack, hero.Defense);
                hero.GainFury();
            }
            else
            {
                damage = CombatMath.FullHit(attack, rng);
            }

            outcome.Defended = type == ReactionType.Parry ? result == QteResult.Perfect : result == QteResult.Dodge;

            // Acertou em cheio: golpe de fogo gruda dinamite.
            if (result == QteResult.Miss && monster.Fire)
            {
                hero.AddDynamite(monster.Attack, b.dynamiteMax);
                outcome.GotDynamite = true;
            }

            // Dano sofrido vira Fúria (o bloqueio já deu a dele) e enche a barra de guarda.
            if (damage > 0 && result != QteResult.Block) hero.GainFury();
            if (damage > 0) outcome.GuardBroke = hero.AddStagger(damage, inCombo);

            // Couraça Arcana do Mago (Parte 1 §11).
            if (damage > 0 && hero.Ward > 0)
            {
                int absorbed = System.Math.Min(hero.Ward, damage);
                damage -= absorbed;
                hero.Ward -= absorbed;
                outcome.WardAbsorbed = absorbed;
            }

            hero.TakeDamage(damage);
            outcome.Damage = damage;
            return outcome;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/QteTiming.cs
using System.Collections.Generic;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: quanto tempo o círculo de reação dura e com que ritmo fecha
    // (Parte 1 §5).
    // ESTRATÉGIA: o ritmo próprio de cada golpe só vale do nível efetivo 6
    // em diante; antes disso, todo círculo é de 900 ms e linear.
    public static class QteTiming
    {
        // Duração do círculo deste hit, em segundos.
        public static float Seconds(HitSpec hit, int effectiveLevel, bool enraged, int ngPlus, GameBalance b)
        {
            double seconds = effectiveLevel > 5 ? b.qteSeconds * hit.speed : b.qteSeconds;
            if (enraged) seconds *= CombatMath.EnrageQteMult;
            seconds *= DungeonMath.NgSpeedMult(ngPlus, b);
            return (float)seconds;
        }

        // Curva deste hit.
        public static QteCurve Curve(HitSpec hit, int effectiveLevel) =>
            effectiveLevel > 5 ? hit.curve : QteCurve.Linear;

        // Quanto o círculo já fechou (0 a 1) no instante normalizado t (0 a 1).
        public static float Shape(QteCurve curve, float t)
        {
            if (t < 0f) t = 0f;
            if (t > 1f) t = 1f;
            switch (curve)
            {
                case QteCurve.Accel: return t * t;
                case QteCurve.Decel: return 1f - (1f - t) * (1f - t);
                default: return t;
            }
        }

        // O toque caiu na janela perfeita?
        public static bool IsPerfect(float elapsed, float duration, GameBalance b) =>
            elapsed >= duration * b.perfectWindowStart;
    }

    // POR QUE: escolher o golpe do monstro e montar a sequência de hits
    // final, com os extras da Fase 2 e do NG+ (Parte 1 §8.3).
    public static class MoveComposer
    {
        // Sorteia um golpe entre os liberados no nível efetivo.
        public static MoveDefinition Pick(MonsterDefinition monster, int effectiveLevel, IRandom rng)
        {
            var pool = monster.MovesAt(effectiveLevel);
            return pool[rng.Range(0, pool.Count - 1)];
        }

        // Os hits que o jogador vai enfrentar.
        public static List<HitSpec> Compose(MoveDefinition move, bool enraged, int ngPlus, GameBalance b)
        {
            var combo = new List<HitSpec>(move.hits);
            if (enraged && combo.Count < 4) combo.Add(Faster(combo[combo.Count - 1]));
            int extra = combo.Count > 1 ? System.Math.Min(b.ngMaxExtraHits, ngPlus) : 0;
            for (int k = 0; k < extra && combo.Count < 5; k++) combo.Add(Faster(combo[combo.Count - 1]));
            return combo;
        }

        // Cópia do hit, 15% mais rápida.
        private static HitSpec Faster(HitSpec hit) => new HitSpec
        {
            type = hit.type,
            speed = hit.speed * 0.85f,
            curve = hit.curve,
        };
    }
}
```

### 🧪 Teste rápido

Um script descartável para ver as regras rodando:

```csharp
// Caminho: Assets/_Project/Scripts/Combat/RulesSmokeTest.cs
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

// POR QUE: conferir a Fase 2 no Console antes de existir cena de batalha.
// ESTRATÉGIA: monta as três ondas de uma masmorra e resolve alguns hits.
// Apague este script no fim da fase.
public class RulesSmokeTest : MonoBehaviour
{
    [SerializeField] private GameDatabase _database;
    [SerializeField] private int _level = 5;

    // Unity chama ao começar o Play.
    private void Start()
    {
        var rng = new SystemRandom(42);
        var b = _database.balance;
        for (int wave = 1; wave <= 3; wave++)
        {
            foreach (var m in WaveFactory.Make(wave, _level, 0, DungeonColor.Red, _database, rng))
                Debug.Log($"Onda {wave}: {m.Name} HP {m.Hp} ATK {m.Attack} DEF {m.Defense} ouro {m.Gold} chefe {m.IsBoss} fase2 {m.HasPhase2}");
        }

        var hero = new HeroRun(HeroLoadout.Fresh(_database.Hero("warrior")), b);
        var monster = WaveFactory.Make(1, 3, 0, DungeonColor.Red, _database, rng)[0];
        var perfect = HitResolver.Resolve(hero, monster, ReactionType.Parry, QteResult.Perfect, monster.Attack, false, 3, b, rng);
        var miss = HitResolver.Resolve(hero, monster, ReactionType.Parry, QteResult.Miss, monster.Attack, false, 3, b, rng);
        Debug.Log($"Parry perfeito: dano {perfect.Damage}, riposte {perfect.Riposte.Damage}. Falha: dano {miss.Damage}. Fúria {hero.Fury}, HP {hero.Hp}/{hero.MaxHp}");
    }
}
```

Na cena `Battle`, crie um objeto vazio `SmokeTest` com esse componente, ligue o **Database** e aperte ▶. Com **Level** `5`:
- ondas 1 e 2 com 3 monstros cada, nomes terminados em A, B e C, e a onda 2 mais forte;
- onda 3 com um chefe e **dois guardas** (5 é múltiplo de 5).

A linha do parry mostra **dano 0** no perfeito, dano cheio na falha e **Fúria 2** (+1 de cada). Depois, **apague** o objeto e o script.

### ✅ Checkpoint da Fase 2
- Os 10 scripts de `Scripts/Combat/` compilam.
- O teste mostra ondas coerentes com a Parte 1 §9 e a tabela de reação funcionando.
- Commit: `feat: regras de combate`.

#### Problemas comuns
- **`ArgumentOutOfRangeException` no WaveFactory:** o `GameDatabase` está com as listas vazias; rode **GDM → Criar ou atualizar dados iniciais**.
- **Erro em `switch` com `=>`:** expressões `switch` exigem C# 8; o Unity 6 já suporta. Em versões antigas, troque por `if`/`else`.

Próxima fase: **a batalha andando sozinha**, com todos os turnos e reações automáticas.

---

# Parte 6 — Implementação Unity: Fase 3 (A batalha andando sozinha)

## Fase 3 — A batalha andando sozinha

> Objetivo desta fase: uma masmorra inteira (3 ondas, iniciativa, turno do herói com todos os comandos, turno do monstro com todos os comportamentos, explosões de goblin) jogável na cena `Battle`. As **reações** e os **minijogos** ainda são respondidos por um "jogador automático" com habilidade ajustável; as Fases 4 e 5 trocam esse jogador automático pela interface de verdade sem mexer em nenhum script desta fase.

**Conceitos novos:**
- **`async` / `await` e `Awaitable` (Unity 6):** um método `async Awaitable` pode "pausar" com `await` e continuar depois, sem travar o jogo. `await Awaitable.WaitForSecondsAsync(0.5f)` espera meio segundo; `await Awaitable.NextFrameAsync()` espera o próximo quadro. É o que permite escrever o turno como uma receita: "corre até o herói, espera o círculo, aplica o dano, volta".
- **`destroyCancellationToken`:** se a cena fechar no meio de um `await`, a espera é cancelada com uma `OperationCanceledException`, em vez de o código continuar mexendo em objetos destruídos. Todo `await` do guia recebe esse token.
- **`AwaitableCompletionSource<T>`:** uma "promessa" que você cumpre na mão. O menu de comandos cria uma, o código do turno faz `await` nela, e o toque num botão a cumpre com o comando escolhido.
- **Interface em campo do Inspector:** a Unity não mostra campos do tipo interface. O truque é um campo `MonoBehaviour` e um `as IReactionSource` no código. Você arrasta qualquer componente que implemente a interface.
- **`Collider2D` e `Physics2D.OverlapPoint`:** áreas de toque. Nenhuma física acontece; o collider só responde "o dedo está em cima de quem?".
- **TextMeshPro 3D:** o componente `TextMeshPro` (sem "UGUI") desenha texto no mundo, como um sprite. É usado nos números de dano que sobem da cabeça dos personagens.

### Etapa 3A — Sprites e animações

O port usa a arte **flat vector** gerada no SpriteCook (Parte 1 §13), que está em `Sprites/GuerreiroDaMasmorra/` neste repositório de GDDs:

| Personagem | Pose base | Animações (8 quadros de 640 × 640) | Pivot Y |
|---|---|---|---|
| Guerreiro (herói) | `heroes/warrior.png` | `anims/warrior_idle_sheet.png`, `anims/warrior_attack_sheet.png` | `0.06` |
| Servo | `monsters/pawn.png` | `anims/pawn_attack_sheet.png` | `0.095` |
| Arqueiro | `monsters/archer.png` | `anims/archer_attack_sheet.png` | `0.11` |
| Cavaleiro (chefe), 4 cores | `bosses/boss_knight_<cor>.png` | `bosses/boss_knight_idle_sheet_<cor>.png`, `bosses/boss_knight_attack_sheet_<cor>.png` | `0.06` |

1. Copie as pastas `heroes`, `monsters`, `anims` e `bosses` para `Assets/_Project/Art/Sprites/`.
2. Selecione os PNGs → **Texture Type** `Sprite (2D and UI)`, **Sprite Mode** `Multiple` (poses base: `Single`), **Pixels Per Unit** `100`, **Filter Mode** `Bilinear` (arte vetorial é suavizada; `Point` só para pixel art), **Compression** `None` → **Apply**.
3. Cada sheet: **Open Sprite Editor → Slice → Grid By Cell Size** `640 × 640`, **Pivot** `Custom` com **X** `0.5` e o **Y** da tabela (o quadro tem margem transparente embaixo; esse Y põe o pivot nos pés) → **Slice → Apply**.
4. Para a idle do Servo e do Arqueiro, que ainda não têm sheet de idle, crie uma `SpriteAnimation` de 1 quadro com a pose base. Para a corrida, use a idle por enquanto. O `CombatantView` só precisa que **idle** e **attack** existam.

> Os demais monstros ainda não têm arte vetorial (Parte 1 §13, Em aberto). Até lá, eles aparecem como quadrado colorido, ou você pode usar provisoriamente os sprites originais do jogo publicado, da tabela abaixo.

Os sprites originais do jogo publicado (pixel art dos packs **Tiny Swords**, da Pixel Frog, e **THE PACK**, com o Rei Slime e a Árvore) estão na pasta `assets/` do repositório do jogo; confira a licença de cada pack antes de publicar. Caminhos:

| Personagem | Pasta | Quadro | Animações (arquivo) |
|---|---|---|---|
| Guerreiro (herói) | `Tiny Swords (Free Pack)/Units/Blue Units/Warrior/` | 192 | idle `Warrior_Idle`, run `Warrior_Run`, attack `Warrior_Attack1`, guard `Warrior_Guard` |
| Servo, Arqueiro, Lanceiro, Monge, Cavaleiro (por cor) | `Units/<Cor> Units/Pawn`, `Archer`, `Lancer` (320), `Monk`, `Warrior` | 192 | `Pawn_Idle Knife`/`Pawn_Run Knife`/`Pawn_Interact Knife`; `Archer_Idle`/`_Run`/`_Shoot`; `Lancer_Idle`/`_Run`/`_Right_Attack`; `Idle`/`Run`/`Heal` |
| Goblins da Tocha e Dinamite (por cor) | `Factions/Goblins/Troops/Torch/<Cor>/`, `TNT/<Cor>/` | 192 | um sheet com linhas: 1 idle, 2 run, 3 attack |
| Gnomo, Ladrão, Cobra, Aranha, Caveira, Gnoll, Lagarto, Peixes, Xamã | `Tiny Swords (Enemy Pack)/Enemy Pack/<Nome>/` | 192 | `<Nome>_Idle`, `_Run` (Gnoll: `_Walk`), `_Attack` (Gnoll e Arpoador: `_Throw`) |
| Tartaruga, Minotauro Ancestral | `Enemy Pack/Turtle/`, `Minotaur/` | 320 | `_Idle`, `_Walk`, `_Attack`, `_Guard` |
| Cavaleiro Selvagem, Urso, Panda | `Enemy Pack/Lancer/`, `Bear/`, `Panda/` | 256 | `_Idle`, `_Run`, `_Attack` |
| Troll | `Enemy Pack/Troll/` | 384 | `Troll_Idle`, `_Walk`, `_Attack` |
| Minotauro (comum) | `assets/Minotaur - Sprite Sheet.png` | 96 | um sheet: linha 1 idle, 2 run, 4 attack |
| Rei Slime, Árvore Anciã | `assets/THE PACK/Monsters/KING SLIME/`, `Tree/` | 100 × 120 | quadros soltos numerados (`idel/`, `attack/`; Árvore: `ground Up/`, `attact/`) |

Para esses sprites provisórios, use **Filter Mode** `Point (no filter)` e **Slice → Grid By Cell Size** com o tamanho da coluna "Quadro", **Pivot** `Bottom`.

> **Não precisa importar tudo agora.** Personagem sem arte no catálogo aparece como um quadrado colorido e o jogo funciona igual. Para esta fase bastam o Guerreiro, o Servo, o Arqueiro e o Cavaleiro de uma cor.

Os scripts de animação:

```csharp
// Caminho: Assets/_Project/Scripts/Data/SpriteAnimation.cs
using System;
using UnityEngine;

namespace GuerreiroDaMasmorra.Data
{
    // POR QUE: uma sequência de quadros com velocidade própria (parado,
    // correndo, atacando, guarda).
    // ESTRATÉGIA: o quadro atual sai de "tempo × fps", em loop.
    [CreateAssetMenu(fileName = "Anim", menuName = "GDM/Sprite Animation")]
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

    // POR QUE: as animações que todo personagem tem. `guard` é opcional
    // (sem ela, o parry usa a de ataque).
    [Serializable]
    public class SpriteAnimSet
    {
        public SpriteAnimation idle;
        public SpriteAnimation run;
        public SpriteAnimation attack;
        public SpriteAnimation guard;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/VisualCatalog.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace GuerreiroDaMasmorra.Data
{
    // POR QUE: a aparência de cada herói e monstro, separada das regras.
    // Monstros "de cor" (Parte 1 §8.1) têm uma entrada por cor.
    // ESTRATÉGIA: busca pelo id; prefere a entrada da cor exata, senão uma
    // marcada "qualquer cor", senão qualquer entrada do id. Sem entrada, a
    // tela usa um quadrado colorido.
    [CreateAssetMenu(fileName = "VisualCatalog", menuName = "GDM/Visual Catalog")]
    public class VisualCatalog : ScriptableObject
    {
        [Serializable]
        public class Entry
        {
            public string id;
            public bool anyColor = true;
            public DungeonColor color;
            public SpriteAnimSet anims = new SpriteAnimSet();
            [Tooltip("Altura do quadro inteiro, em unidades do mundo.")]
            public float height = 2.6f;
        }

        public List<Entry> entries = new List<Entry>();

        // A melhor entrada para este id e esta cor (null se não houver).
        public Entry Find(string id, DungeonColor color)
        {
            Entry anyColor = null;
            Entry other = null;
            foreach (var entry in entries)
            {
                if (entry.id != id) continue;
                if (!entry.anyColor && entry.color == color) return entry;
                if (entry.anyColor) anyColor = entry;
                else other ??= entry;
            }
            return anyColor ?? other;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Editor/SpriteAnimationMaker.cs
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using GuerreiroDaMasmorra.Data;
using UnityEditor;
using UnityEngine;

namespace GuerreiroDaMasmorra.EditorTools
{
    // POR QUE: criar uma SpriteAnimation a partir dos quadros selecionados
    // na Project com um clique direito.
    // ESTRATÉGIA: junta os sprites selecionados (ou todos os de uma textura,
    // ou várias texturas de quadros soltos), ordena pelo número no fim do
    // nome em ordem natural e pede onde salvar.
    public static class SpriteAnimationMaker
    {
        private const string MenuPath = "Assets/GDM/Criar animação com os sprites selecionados";

        [MenuItem(MenuPath)]
        public static void Create()
        {
            var sprites = SelectedSprites();
            if (sprites.Count == 0) return;

            string suggested = Regex.Replace(sprites[0].name, @"_?\d+$", "");
            string path = EditorUtility.SaveFilePanelInProject("Salvar animação", suggested, "asset",
                "Nome da animação (ex.: warrior_idle)", "Assets/_Project/Data/Anims");
            if (string.IsNullOrEmpty(path)) return;

            var anim = ScriptableObject.CreateInstance<SpriteAnimation>();
            anim.frames = sprites.ToArray();
            AssetDatabase.CreateAsset(anim, path);
            AssetDatabase.SaveAssets();
            Selection.activeObject = anim;
        }

        // Só habilita o item quando há sprite ou textura selecionada.
        [MenuItem(MenuPath, true)]
        public static bool CanCreate() => SelectedSprites().Count > 0;

        // Sprites selecionados, em ordem natural pelo número final do nome.
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

        // "Warrior_Idle_5" → 5; sem número → 0.
        private static int TrailingNumber(string name)
        {
            var match = Regex.Match(name, @"(\d+)$");
            return match.Success ? int.Parse(match.Value) : 0;
        }
    }
}
```

1. Para cada animação: abra a setinha da textura na Project, selecione os quadros (ou a textura inteira, se ela tiver uma animação só) → botão direito → **GDM → Criar animação com os sprites selecionados** → salve como `<id>_<anim>` (ex.: `warrior_idle`). **Fps** `8` nas sheets vetoriais (o ritmo com que foram geradas); `10` nos sprites provisórios do jogo publicado.
2. **Create → GDM → Visual Catalog** em `Data/`. Adicione uma entrada por personagem: **Id** igual ao id do jogo (`warrior`, `pawn`, `boss`...), as animações e **Height** `2.6` (chefes grandes: `3.4`). Para monstros de cor, desmarque **Any Color** e crie uma entrada por **Color**.

### 🧪 Teste rápido
Selecione `Data/Anims/warrior_idle`: o Inspector mostra os quadros na ordem certa. O catálogo tem pelo menos as entradas `warrior`, `pawn`, `archer` e `boss`.

### Etapa 3B — Personagens na tela

```csharp
// Caminho: Assets/_Project/Scripts/Battle/SpriteAnimPlayer.cs
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: toca uma SpriteAnimation num SpriteRenderer, com a altura
    // certa no mundo.
    // ESTRATÉGIA: guarda a animação e quando ela começou; no LateUpdate
    // escolhe o quadro e ajusta a escala (altura desejada ÷ altura do
    // quadro). Sem animação, mostra um sprite parado (o quadrado reserva).
    [RequireComponent(typeof(SpriteRenderer))]
    public class SpriteAnimPlayer : MonoBehaviour
    {
        private SpriteRenderer _renderer;
        private SpriteAnimation _current;
        private float _startTime;
        private float _timeOffset;
        private float _height = 1f;

        public SpriteRenderer Renderer => _renderer != null ? _renderer : _renderer = GetComponent<SpriteRenderer>();

        // Altura no mundo e defasagem (para dois iguais não andarem sincronizados).
        public void Configure(float height, float timeOffset)
        {
            _height = height;
            _timeOffset = timeOffset;
        }

        // Troca de animação; `restart` volta ao primeiro quadro.
        public void Play(SpriteAnimation anim, bool restart = false)
        {
            if (anim == null || (anim == _current && !restart)) return;
            _current = anim;
            _startTime = Time.time;
        }

        // Mostra um sprite parado (sem arte no catálogo).
        public void ShowStatic(Sprite sprite, Color tint)
        {
            _current = null;
            Renderer.sprite = sprite;
            Renderer.color = tint;
            Fit(sprite);
        }

        // Escolhe o quadro do momento e ajusta a escala.
        private void LateUpdate()
        {
            if (_current == null) return;
            var sprite = _current.FrameAt(Time.time - _startTime + _timeOffset);
            Renderer.sprite = sprite;
            Fit(sprite);
        }

        // Escala o objeto para o sprite ter a altura desejada.
        private void Fit(Sprite sprite)
        {
            if (sprite == null) return;
            float frameHeight = sprite.rect.height / sprite.pixelsPerUnit;
            float scale = _height / frameHeight;
            transform.localScale = new Vector3(scale, scale, 1f);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/HpBar.cs
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: barra de HP sobre cada personagem.
    // ESTRATÉGIA: dois quadrados (fundo e preenchimento); o preenchimento
    // encolhe pela esquerda.
    public class HpBar : MonoBehaviour
    {
        [SerializeField] private Transform _back;
        [SerializeField] private Transform _fill;

        private float _width = 1.5f;
        private float _thickness = 0.12f;

        // Tamanho da barra no mundo.
        public void SetSize(float width, float thickness)
        {
            _width = width;
            _thickness = thickness;
            _back.localScale = new Vector3(width, thickness, 1f);
        }

        // Fração de vida (0 a 1).
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
// Caminho: Assets/_Project/Scripts/Battle/CombatantView.cs
using System.Threading;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using TMPro;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: um personagem na tela (herói ou monstro): sprite animado,
    // barra de HP, linha de status (escudo, cansaço), marcador de alvo e
    // área de toque.
    // ESTRATÉGIA: só aparência. Os movimentos são métodos `async` que o
    // código do turno espera com await (correr até o alvo, golpear, voltar).
    [RequireComponent(typeof(BoxCollider2D))]
    public class CombatantView : MonoBehaviour
    {
        private static readonly Color HitTint = new Color(1f, 0.35f, 0.35f);

        [SerializeField] private SpriteAnimPlayer _body;
        [SerializeField] private HpBar _hpBar;
        [SerializeField] private TextMeshPro _status;
        [SerializeField] private GameObject _targetMarker;
        [SerializeField] private Sprite _fallbackSprite;

        private SpriteAnimSet _anims;
        private Color _baseColor = Color.white;
        private float _flashUntil;

        // Null quando a view é do herói.
        public Monster Monster { get; private set; }
        public Vector3 Home { get; set; }
        public float Height { get; private set; }

        // Prepara a view; sem animações, usa o quadrado reserva tingido.
        public void Init(SpriteAnimSet anims, float height, bool faceLeft, Monster monster, Color fallbackTint)
        {
            Monster = monster;
            Height = height;
            _body.Configure(height, Random.value);
            _body.Renderer.flipX = faceLeft;

            bool hasArt = anims != null && anims.idle != null;
            _anims = hasArt ? anims : null;
            _baseColor = hasArt ? Color.white : fallbackTint;
            if (hasArt) _body.Play(anims.idle);
            else _body.ShowStatic(_fallbackSprite, fallbackTint);

            var hitbox = GetComponent<BoxCollider2D>();
            hitbox.size = new Vector2(height * 0.6f, height * 0.9f);
            hitbox.offset = new Vector2(0f, height * 0.45f);
            _hpBar.SetSize(height * 0.6f, 0.12f);
            _hpBar.transform.localPosition = new Vector3(0f, height * 1.02f, 0f);
            _status.transform.localPosition = new Vector3(0f, height * 1.15f, 0f);
            SetTargeted(false);
        }

        // Vira para a esquerda ou para a direita.
        public void Face(bool left) => _body.Renderer.flipX = left;

        // Atualiza barra de HP e linha de status.
        public void SetBars(float hpFraction, string status)
        {
            _hpBar.SetFraction(hpFraction);
            _status.text = status;
        }

        // Liga ou desliga o marcador de alvo.
        public void SetTargeted(bool on)
        {
            if (_targetMarker != null) _targetMarker.SetActive(on);
        }

        // Pisca vermelho por um instante (levou dano).
        public void Flash() => _flashUntil = Time.time + 0.25f;

        // Corre até `target` em `seconds` segundos, com aceleração suave.
        public async Awaitable MoveTo(Vector3 target, float seconds, CancellationToken token)
        {
            if (_anims != null) _body.Play(_anims.run);
            Face(target.x < transform.position.x);
            Vector3 from = transform.position;
            for (float t = 0f; t < seconds; t += Time.deltaTime)
            {
                transform.position = Vector3.Lerp(from, target, Mathf.SmoothStep(0f, 1f, t / seconds));
                await Awaitable.NextFrameAsync(token);
            }
            transform.position = target;
            if (_anims != null) _body.Play(_anims.idle);
        }

        // Toca o golpe uma vez e volta a ficar parado.
        public Awaitable Strike(CancellationToken token) => PlayOnce(_anims?.attack, token);

        // Pose de defesa no parry (ou o golpe, se não houver pose de guarda).
        public Awaitable Guard(CancellationToken token) =>
            PlayOnce(_anims != null && _anims.guard != null ? _anims.guard : _anims?.attack, token);

        // Corre sem sair do lugar (marcha entre ondas).
        public void Run(bool on)
        {
            if (_anims != null) _body.Play(on ? _anims.run : _anims.idle);
        }

        // Toca uma animação uma vez e espera ela acabar.
        private async Awaitable PlayOnce(SpriteAnimation anim, CancellationToken token)
        {
            if (anim == null)
            {
                await Awaitable.WaitForSecondsAsync(0.3f, token);
                return;
            }
            _body.Play(anim, restart: true);
            await Awaitable.WaitForSecondsAsync(anim.Duration, token);
            if (_anims != null) _body.Play(_anims.idle);
        }

        // Aplica o piscar de dano.
        private void Update()
        {
            _body.Renderer.color = Time.time < _flashUntil ? HitTint : _baseColor;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/FloatingText.cs
using TMPro;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: os números e avisos que sobem da cabeça dos personagens
    // ("-12", "PARRY!", "+40 OURO") (Parte 1 §13).
    // ESTRATÉGIA: sobe e some em 0,9 s e se destrói sozinho.
    [RequireComponent(typeof(TextMeshPro))]
    public class FloatingText : MonoBehaviour
    {
        [SerializeField] private float _rise = 1.2f;
        [SerializeField] private float _seconds = 0.9f;

        private TextMeshPro _text;
        private Vector3 _from;
        private Color _color;
        private float _start;

        // Configura o texto logo depois de instanciado.
        public void Show(string text, Color color, bool big)
        {
            _text = GetComponent<TextMeshPro>();
            _text.text = text;
            _text.fontSize = big ? 6f : 4f;
            _color = color;
            _from = transform.position;
            _start = Time.time;
        }

        // Sobe, desbota e se destrói no fim.
        private void Update()
        {
            float k = (Time.time - _start) / _seconds;
            if (k >= 1f)
            {
                Destroy(gameObject);
                return;
            }
            transform.position = _from + Vector3.up * (_rise * k);
            var c = _color;
            c.a = 1f - k * k;
            _text.color = c;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BattleStage.cs
using System.Collections.Generic;
using System.Threading;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: o "palco" da batalha: cria as views, sabe onde cada um fica,
    // anima entradas e idas e voltas, mostra números flutuantes e treme a
    // câmera. O código dos turnos pede coisas ao palco e nunca mexe em
    // Transform diretamente.
    // ESTRATÉGIA: posições vêm de objetos vazios na cena (spots), que você
    // arruma no Editor. Uma view por monstro, num dicionário. Sync, chamado
    // todo quadro, copia HP, escudos e cansaço para as barras.
    public class BattleStage : MonoBehaviour
    {
        public static readonly Color White = Color.white;
        public static readonly Color Gold = new Color(0.98f, 0.75f, 0.14f);
        public static readonly Color Red = new Color(0.97f, 0.44f, 0.44f);
        public static readonly Color Green = new Color(0.29f, 0.87f, 0.5f);
        public static readonly Color Blue = new Color(0.38f, 0.65f, 0.98f);
        public static readonly Color Purple = new Color(0.65f, 0.55f, 0.98f);
        public static readonly Color Orange = new Color(0.98f, 0.57f, 0.24f);
        public static readonly Color Cyan = new Color(0.38f, 0.84f, 1f);

        [SerializeField] private Camera _camera;
        [SerializeField] private VisualCatalog _catalog;
        [SerializeField] private CombatantView _viewPrefab;
        [SerializeField] private FloatingText _floatPrefab;
        [SerializeField] private Transform _heroSpot;
        [SerializeField] private Transform[] _monsterSpots;
        [SerializeField] private Transform _monsterEntrance;

        private readonly Dictionary<Monster, CombatantView> _monsters = new Dictionary<Monster, CombatantView>();
        private CombatantView _hero;
        private BattleContext _context;
        private Vector3 _cameraHome;
        private float _shakeUntil;

        public CombatantView HeroView => _hero;

        // Unity chama ao criar o objeto.
        private void Awake()
        {
            _cameraHome = _camera.transform.position;
        }

        // Liga o palco a uma masmorra: cria o herói e escuta as mortes.
        public void Bind(BattleContext context)
        {
            _context = context;
            context.Slain += OnSlain;
            var hero = context.Request.Loadout.Hero;
            var entry = _catalog.Find(hero.id, context.Request.Color);
            _hero = Instantiate(_viewPrefab, _heroSpot.position, Quaternion.identity, transform);
            _hero.Init(entry?.anims, entry != null ? entry.height : 2.6f, false, null, Blue);
            _hero.Home = _heroSpot.position;
        }

        // Os monstros de uma onda entram correndo pela entrada do corredor.
        public async Awaitable SpawnWave(IReadOnlyList<Monster> monsters, CancellationToken token)
        {
            foreach (var view in _monsters.Values) Destroy(view.gameObject);
            _monsters.Clear();

            var entrances = new List<Awaitable>();
            for (int i = 0; i < monsters.Count; i++)
            {
                var monster = monsters[i];
                var entry = _catalog.Find(monster.Id, monster.Color);
                var view = Instantiate(_viewPrefab, _monsterEntrance.position + Vector3.up * (i * 0.6f), Quaternion.identity, transform);
                view.Init(entry?.anims, entry != null ? entry.height : (monster.IsBoss ? 3.4f : 2.6f), true, monster,
                    monster.IsBoss ? Red : Orange);
                view.Home = _monsterSpots[Mathf.Min(i, _monsterSpots.Length - 1)].position;
                _monsters[monster] = view;
                entrances.Add(view.MoveTo(view.Home, 0.7f, token));
            }
            foreach (var entrance in entrances) await entrance;
            foreach (var view in _monsters.Values) view.Face(true);
        }

        // A view de um monstro (null se não existir).
        public CombatantView ViewOf(Monster monster) =>
            monster != null && _monsters.TryGetValue(monster, out var view) ? view : null;

        // O monstro vivo sob um ponto da tela (null se nenhum).
        public Monster MonsterAt(Vector2 screenPosition)
        {
            var hit = Physics2D.OverlapPoint(_camera.ScreenToWorldPoint(screenPosition));
            var view = hit != null ? hit.GetComponent<CombatantView>() : null;
            return view != null && view.Monster != null && !view.Monster.Dead ? view.Monster : null;
        }

        // O dedo está em cima do herói?
        public bool IsHeroAt(Vector2 screenPosition)
        {
            var hit = Physics2D.OverlapPoint(_camera.ScreenToWorldPoint(screenPosition));
            return hit != null && _hero != null && hit.gameObject == _hero.gameObject;
        }

        // Converte um ponto da tela para o mundo (z = 0).
        public Vector3 ScreenToWorld(Vector2 screenPosition)
        {
            var world = _camera.ScreenToWorldPoint(screenPosition);
            world.z = 0f;
            return world;
        }

        // O herói corre até ficar de frente para o monstro.
        public Awaitable HeroApproach(Monster target, CancellationToken token) =>
            _hero.MoveTo(ViewOf(target).transform.position + Vector3.left * 1.3f, 0.34f, token);

        // O herói corre até o meio dos monstros (golpes em todos).
        public Awaitable HeroToCenter(CancellationToken token)
        {
            Vector3 sum = Vector3.zero;
            foreach (var spot in _monsterSpots) sum += spot.position;
            return _hero.MoveTo(sum / _monsterSpots.Length + Vector3.left * 1.6f, 0.3f, token);
        }

        // O herói volta para o seu lugar e olha para os monstros.
        public async Awaitable HeroReturn(CancellationToken token)
        {
            await _hero.MoveTo(_hero.Home, 0.34f, token);
            _hero.Face(false);
        }

        // O monstro corre até o herói.
        public Awaitable MonsterApproach(Monster monster, CancellationToken token) =>
            ViewOf(monster).MoveTo(_hero.transform.position + Vector3.right * 1.3f, 0.38f, token);

        // O monstro volta para o seu lugar.
        public async Awaitable MonsterReturn(Monster monster, CancellationToken token)
        {
            var view = ViewOf(monster);
            await view.MoveTo(view.Home, 0.38f, token);
            view.Face(true);
        }

        // Marcha entre ondas: o herói corre sem sair do lugar.
        public async Awaitable March(float seconds, CancellationToken token)
        {
            _hero.Run(true);
            await Awaitable.WaitForSecondsAsync(seconds, token);
            _hero.Run(false);
        }

        // Texto flutuante sobre um monstro, ou sobre o herói (monster null).
        public void Float(Monster monster, string text, Color color, bool big = false)
        {
            var view = monster == null ? _hero : ViewOf(monster);
            if (view == null) return;
            var label = Instantiate(_floatPrefab, view.transform.position + Vector3.up * view.Height * 0.8f, Quaternion.identity);
            label.Show(text, color, big);
        }

        // Mostra o resultado de um golpe do herói: dano, escudos quebrados, perfuração.
        public void ShowStrike(Monster monster, StrikeOutcome strike, Color color, bool big)
        {
            ViewOf(monster)?.Flash();
            if (strike.ShieldsBroken > 0)
            {
                Float(monster, $"ESCUDO -{strike.ShieldsBroken}", Blue, big);
                if (strike.Pierced > 0) Float(monster, $"{strike.Pierced} PERFURA", Cyan);
            }
            else
            {
                Float(monster, strike.Damage.ToString(), color, big);
            }
        }

        // Treme a câmera por 0,4 s.
        public void Shake() => _shakeUntil = Time.time + 0.4f;

        // Monstro morto: some e mostra o ouro.
        private void OnSlain(Monster monster)
        {
            Float(monster, $"+{monster.Gold} OURO", Gold);
            Shake();
        }

        // Todo quadro: barras, status, alvo e tremida.
        private void LateUpdate()
        {
            if (_context != null)
            {
                foreach (var pair in _monsters)
                {
                    var monster = pair.Key;
                    var view = pair.Value;
                    if (monster.Dead)
                    {
                        view.gameObject.SetActive(false);
                        continue;
                    }
                    view.SetBars((float)monster.Hp / monster.MaxHp, StatusOf(monster));
                    view.SetTargeted(_context.ShowTarget && monster == _context.Target);
                }
                if (_hero != null) _hero.SetBars((float)_context.Hero.Hp / _context.Hero.MaxHp, "");
            }

            _camera.transform.position = Time.time < _shakeUntil
                ? _cameraHome + (Vector3)(Random.insideUnitCircle * 0.15f)
                : _cameraHome;
        }

        // "ESCUDO 4  FASE 2  CANSAÇO 3/5" ou "EXAUSTO".
        private string StatusOf(Monster monster)
        {
            string shield = monster.Shield > 0 ? $"ESCUDO {monster.Shield}  " : "";
            string rage = monster.Enraged ? "FASE 2  " : "";
            if (monster.Exhausted) return $"{shield}{rage}EXAUSTO";
            int cap = DungeonMath.FatigueCap(monster.IsBoss, _context.EffectiveLevel, _context.Balance);
            return $"{shield}{rage}CANSAÇO {monster.Fatigue}/{cap}";
        }
    }
}
```

**Prefabs e cena** (cena `Battle`):

1. **Quadrado branco:** botão direito em `Art/Sprites` → **Create → 2D → Sprites → Square**.
2. **Prefab `HpBar`:** **Create Empty** `HpBar` com **Add Component → Hp Bar**; filhos `Back` (arraste o `Square`; **Color** `#3A1010`; **Order in Layer** `50`) e `Fill` (`Square`; **Color** `#4ADE80`; **Order in Layer** `51`). Ligue **Back** e **Fill**.
3. **Prefab `CombatantView`:** **Create Empty** `CombatantView` com **Add Component → Combatant View** (a Unity adiciona o **Box Collider 2D**; marque **Is Trigger**). Filhos:
   - `Body` com **Sprite Renderer** + **Sprite Anim Player** (**Order in Layer** `10`);
   - o `HpBar`;
   - `Status`: **3D Object → Text - TextMeshPro**, **Font Size** `2.5`, alinhado ao centro;
   - `TargetMarker`: um `Square` pequeno (`0.3 × 0.3`), amarelo, rotacionado 45°, em `(0, -0.2)`.
   No **Combatant View**, ligue **Body**, **Hp Bar**, **Status**, **Target Marker** e **Fallback Sprite** = `Square`. Arraste para `Prefabs/` e apague da cena.
4. **Prefab `FloatingText`:** **3D Object → Text - TextMeshPro** chamado `FloatingText`, **Add Component → Floating Text**, alinhado ao centro, **Order in Layer** `100` (em **Extra Settings**). Para `Prefabs/` e apague da cena.
5. **Câmera:** **Main Camera** → **Size** `9.6`, **Position** `(0, 0, -10)`, **Background** `#0F1117`.
6. **Spots:** **Create Empty** `[World]` e, dentro dele, objetos vazios com estas posições:

| Objeto | Posição |
|---|---|
| `HeroSpot` | `(-2.5, 2.5, 0)` |
| `MonsterSpot1` | `(2.2, 5.0, 0)` |
| `MonsterSpot2` | `(2.9, 2.6, 0)` |
| `MonsterSpot3` | `(1.9, 0.4, 0)` |
| `MonsterEntrance` | `(5.5, 7.0, 0)` |

7. Dentro de `[World]`, **Create Empty** `BattleStage` com **Add Component → Battle Stage**. Ligue **Camera**, **Catalog**, **View Prefab**, **Float Prefab**, **Hero Spot**, **Monster Spots** (os 3, em ordem) e **Monster Entrance**.

### 🧪 Teste rápido
Sem scripts de turno ainda, o palco só aparece na Etapa 3F. Confira apenas que o Console não tem erros e que os três prefabs existem em `Prefabs/`.

### Etapa 3C — O controlador da masmorra

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BattleContext.cs
using System;
using System.Collections.Generic;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: o pedido de entrada numa masmorra: com que herói, em que nível
    // e quantas Souls e Mapas o jogador tem para gastar lá dentro.
    // ESTRATÉGIA: três campos existem para fases futuras: `GemsUnlocked`
    // decide qual Pergaminho de Gema cai (Fase 6); `DuelHeroId` e
    // `ThirdWaveOverride` transformam a masmorra num duelo de recrutamento,
    // trocando o chefe pelo herói desafiado (Fase 10).
    public sealed class DungeonRequest
    {
        public HeroLoadout Loadout;
        public int Level = 1;
        public int NgPlus;
        public DungeonColor Color;
        public int Souls;
        public int Maps;
        public bool Tutorial;
        public List<GemId> GemsUnlocked = new List<GemId>();
        public string DuelHeroId;
        public Func<IRandom, List<Monster>> ThirdWaveOverride;
    }

    public enum DungeonOutcomeKind
    {
        Victory,
        Defeat,
        Fled,
    }

    // POR QUE: como a masmorra terminou, para o painel de resultado (Fase 6)
    // e o acampamento (Fase 7) aplicarem ouro, Souls e Mapas.
    public sealed class BattleEnd
    {
        public DungeonOutcomeKind Kind;
        public DungeonRequest Request;
        public int RunGold;
        public bool Flawless;
        public int SoulsUsed;
        public int MapsUsed;
        public int Wave;
    }

    // POR QUE: tudo o que os turnos compartilham durante uma masmorra: o
    // herói, os monstros da onda, o alvo, o sorteio e as explosões pendentes.
    // ESTRATÉGIA: classe comum criada pelo BattleController a cada masmorra.
    // `Slay` é o único jeito de matar um monstro: paga o ouro, enfileira a
    // Explosão Final de goblins de fogo e avisa a tela pelo evento `Slain`.
    public sealed class BattleContext
    {
        public readonly GameDatabase Db;
        public readonly DungeonRequest Request;
        public readonly IRandom Rng;
        public readonly HeroRun Hero;
        public readonly Queue<Monster> PendingBooms = new Queue<Monster>();

        public List<Monster> Monsters = new List<Monster>();
        public int Wave;
        public Monster Target;
        public bool ShowTarget;
        public int SoulsUsed;
        public int MapsUsed;

        public event Action<string> Logged;
        public event Action<Monster> Slain;

        // Começa uma masmorra com o herói cheio.
        public BattleContext(GameDatabase db, DungeonRequest request, IRandom rng)
        {
            Db = db;
            Request = request;
            Rng = rng;
            Hero = new HeroRun(request.Loadout, db.balance);
        }

        public GameBalance Balance => Db.balance;
        public int NgPlus => Request.NgPlus;
        public int EffectiveLevel => DungeonMath.EffectiveLevel(Request.Level, Request.NgPlus, Balance);
        public bool WaveCleared => Monsters.TrueForAll(m => m.Dead);
        public int SoulsAvailable => Request.Souls - SoulsUsed;
        public int MapsAvailable => Request.Maps - MapsUsed;

        // Monstros vivos, na ordem da onda.
        public List<Monster> Alive() => Monsters.FindAll(m => !m.Dead);

        // Mostra uma mensagem na linha de log.
        public void Log(string message) => Logged?.Invoke(message);

        // Mata um monstro (uma vez só): ouro, explosão pendente e aviso à tela.
        public void Slay(Monster monster)
        {
            if (monster.Dead) return;
            monster.Dead = true;
            monster.Hp = 0;
            Hero.RunGold += monster.Gold;
            if (monster.Fire && !Request.Tutorial) PendingBooms.Enqueue(monster);
            Slain?.Invoke(monster);
        }

        // Garante um alvo vivo.
        public void EnsureTarget()
        {
            if (Target == null || Target.Dead) Target = Monsters.Find(m => !m.Dead);
        }

        // Troca de alvo para o próximo (+1) ou anterior (-1) vivo.
        public void CycleTarget(int direction)
        {
            var alive = Alive();
            if (alive.Count == 0) return;
            int index = alive.IndexOf(Target);
            index = ((index + direction) % alive.Count + alive.Count) % alive.Count;
            Target = alive[index];
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BattleInterfaces.cs
using System;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: quem responde ao círculo de reação. Fase 3: o AutoPlayer;
    // Fase 4: o QteController, com o toque do jogador.
    public interface IReactionSource
    {
        // Abre o círculo por `seconds` e devolve o que o jogador fez.
        Awaitable<QteResult> React(ReactionType type, float seconds, QteCurve curve, string tag);

        // Janela do Ataque Aéreo depois de um salto: true se o jogador tocou.
        Awaitable<bool> AerialWindow(float seconds);
    }

    // POR QUE: quem joga os minijogos dos especiais. Fase 3: o AutoPlayer;
    // Fase 5: o MinigamePanel.
    public interface IMinigames
    {
        // Barra de carga da Fúria total: devolve de 0 a 1.
        Awaitable<float> ChargeBar(float seconds);

        // Barra oscilante da Sequência Mortal: devolve o multiplicador, ou 0 se falhou.
        Awaitable<double> SequenceBar();

        // Um golpe do Combo: true se o toque caiu na janela.
        Awaitable<bool> ComboStrike(int index, int total);
    }

    public enum TurnResult
    {
        Done,
        Fled,
    }

    // POR QUE: o turno do herói muda com a classe (Guerreiro: menu; Mago: cartas).
    public interface IHeroTurnTaker
    {
        Awaitable<TurnResult> TakeTurn(BattleContext context);
    }

    // POR QUE: oferecer Soul ao cair (Fase 6). Sem um, o herói simplesmente perde.
    public interface IDeathHandler
    {
        Awaitable<bool> OfferRevive(BattleContext context);
    }

    // POR QUE: ações grátis durante a escolha do comando (a pedrada, Fase 5).
    // `onWaveCleared` encerra o turno se a ação grátis matar o último monstro.
    public interface IFreeAction
    {
        void Begin(BattleContext context, Action onWaveCleared);
        void End();
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/AutoPlayer.cs
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: um jogador automático para ver e balancear a batalha antes de
    // existir interface de reação e de minijogo.
    // ESTRATÉGIA: espera o tempo que o jogador teria e acerta com a chance
    // `_skill`. Continua útil depois: com skill 1, testa o "jogador perfeito".
    public class AutoPlayer : MonoBehaviour, IReactionSource, IMinigames
    {
        [SerializeField, Range(0f, 1f)] private float _skill = 0.6f;

        // Reação: acerta com chance _skill; no parry, 60% dos acertos são perfeitos.
        public async Awaitable<QteResult> React(ReactionType type, float seconds, QteCurve curve, string tag)
        {
            await Awaitable.WaitForSecondsAsync(seconds, destroyCancellationToken);
            if (Random.value >= _skill) return QteResult.Miss;
            if (type != ReactionType.Parry) return QteResult.Dodge;
            return Random.value < 0.6f ? QteResult.Perfect : QteResult.Block;
        }

        public async Awaitable<bool> AerialWindow(float seconds)
        {
            await Awaitable.WaitForSecondsAsync(0.3f, destroyCancellationToken);
            return Random.value < _skill;
        }

        public async Awaitable<float> ChargeBar(float seconds)
        {
            await Awaitable.WaitForSecondsAsync(seconds, destroyCancellationToken);
            return _skill;
        }

        public async Awaitable<double> SequenceBar()
        {
            await Awaitable.WaitForSecondsAsync(1f, destroyCancellationToken);
            return Random.value < _skill ? 1.5 : 1.1;
        }

        public async Awaitable<bool> ComboStrike(int index, int total)
        {
            await Awaitable.WaitForSecondsAsync(0.9f, destroyCancellationToken);
            return Random.value < _skill;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BattleController.cs
using System;
using System.Threading;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: o roteiro de uma masmorra (Parte 1 §4 e §9): 3 ondas; em
    // cada uma, rodadas com fila de iniciativa até a onda cair, o herói cair
    // ou o herói fugir.
    // ESTRATÉGIA: um único método async lido de cima para baixo. Cada vez na
    // fila delega a quem sabe agir (turno do herói, turno do monstro) e,
    // depois de cada ação, resolve as explosões pendentes e confere o fim.
    // O Update cuida de duas coisas contínuas: Fase 2 dos chefes (como no
    // jogo publicado, conferida a todo quadro) e sincronizar o palco.
    public class BattleController : MonoBehaviour
    {
        [SerializeField] private GameDatabase _database;
        [SerializeField] private BattleStage _stage;
        [SerializeField] private BattleHud _hud;
        [SerializeField] private MonsterTurn _monsterTurn;
        [SerializeField] private BoomResolver _booms;
        [SerializeField] private MonoBehaviour _warriorTurn;
        [SerializeField] private MonoBehaviour _mageTurn;
        [SerializeField] private MonoBehaviour _deathHandler;

        public BattleContext Context { get; private set; }

        // Disparado uma vez, quando a masmorra termina.
        public event Action<BattleEnd> Ended;

        // Ponto de entrada: roda a masmorra e avisa o fim.
        public async void Begin(DungeonRequest request)
        {
            try
            {
                var end = await RunDungeon(request, destroyCancellationToken);
                Ended?.Invoke(end);
            }
            catch (OperationCanceledException)
            {
                // A cena fechou no meio da luta: nada a fazer.
            }
        }

        // As 3 ondas.
        private async Awaitable<BattleEnd> RunDungeon(DungeonRequest request, CancellationToken token)
        {
            Context = new BattleContext(_database, request, new SystemRandom());
            _hud.Bind(Context);
            _stage.Bind(Context);

            for (int wave = 1; wave <= 3; wave++)
            {
                Context.Wave = wave;
                Context.Monsters = wave == 3 && request.ThirdWaveOverride != null
                    ? request.ThirdWaveOverride(Context.Rng)
                    : WaveFactory.Make(wave, request.Level, request.NgPlus, request.Color, _database, Context.Rng);
                Context.Target = null;
                Context.EnsureTarget();
                Context.Log(wave == 3
                    ? $"{Context.Monsters[0].Name} surge das sombras{(Context.Monsters.Count > 1 ? " com sua escolta" : "")}!"
                    : $"Onda {wave}/3: monstros à vista!");
                await _stage.SpawnWave(Context.Monsters, token);

                var outcome = await FightWave(token);
                if (outcome.HasValue) return End(outcome.Value);

                if (wave < 3)
                {
                    Context.Log("Onda vencida! Avançando pelo corredor...");
                    await Awaitable.WaitForSecondsAsync(0.7f, token);
                    await _stage.March(2f, token);
                }
            }
            return End(DungeonOutcomeKind.Victory);
        }

        // Rodadas até a onda cair (null) ou a masmorra acabar (derrota/fuga).
        private async Awaitable<DungeonOutcomeKind?> FightWave(CancellationToken token)
        {
            while (true)
            {
                var queue = Initiative.Roll(Context.Monsters, Context.Rng, Context.Balance);
                for (int i = 0; i < queue.Count; i++)
                {
                    if (Context.WaveCleared) return null;
                    var slot = queue[i];
                    _hud.ShowQueue(queue, i);

                    if (slot.IsHero)
                    {
                        if (await HeroTurn(token) == TurnResult.Fled) return DungeonOutcomeKind.Fled;
                    }
                    else if (!slot.Monster.Dead)
                    {
                        await _monsterTurn.TakeTurn(Context, slot.Monster);
                    }

                    await _booms.ProcessAll(Context);

                    if (Context.Hero.Dead)
                    {
                        if (await OfferRevive()) break;   // reviveu: nova rodada
                        return DungeonOutcomeKind.Defeat;
                    }
                    if (Context.WaveCleared) return null;
                }
            }
        }

        // Começo do turno do herói (dinamite, maldição, exaustão) e a ação.
        private async Awaitable<TurnResult> HeroTurn(CancellationToken token)
        {
            var hero = Context.Hero;

            if (hero.Dynamite > 0)
            {
                hero.Dynamite--;
                hero.TakeDamage(hero.DynamitePower);
                _stage.HeroView.Flash();
                _stage.Shake();
                _stage.Float(null, $"-{hero.DynamitePower} DINAMITE", BattleStage.Orange, true);
                Context.Log($"Uma dinamite explodiu em você! {hero.DynamitePower} de dano." +
                            (hero.Dynamite > 0 ? $" Restam {hero.Dynamite}!" : ""));
                if (hero.Dead) return TurnResult.Done;
                await Awaitable.WaitForSecondsAsync(0.6f, token);
            }
            else
            {
                hero.DynamitePower = 0;
            }

            if (hero.Curse != null)
            {
                if (hero.Curse.Type == CurseType.Drain)
                {
                    hero.TakeDamage(hero.Curse.Power);
                    _stage.Float(null, $"-{hero.Curse.Power} MALDIÇÃO", BattleStage.Purple, true);
                    Context.Log($"A maldição drena {hero.Curse.Power} de HP!");
                    if (hero.Dead) return TurnResult.Done;
                }
                if (--hero.Curse.Turns <= 0)
                {
                    hero.Curse = null;
                    _stage.Float(null, "encanto dissipado", BattleStage.White);
                }
            }

            if (hero.Exhausted)
            {
                hero.Exhausted = false;
                Context.Log("Exausto pelo golpe especial, o herói não consegue agir!");
                _stage.Float(null, "EXAUSTO...", BattleStage.White, true);
                await Awaitable.WaitForSecondsAsync(1.1f, token);
                return TurnResult.Done;
            }

            hero.GuardBroken = false;
            hero.RocksLeft = CombatMath.RocksPerRound(hero.Loadout.GemLevel(GemId.Stone));
            Context.EnsureTarget();

            bool mage = Context.Request.Loadout.Hero.heroClass == HeroClass.Mage && _mageTurn != null;
            var taker = (mage ? _mageTurn : _warriorTurn) as IHeroTurnTaker;
            return await taker.TakeTurn(Context);
        }

        // Herói caído: oferece Soul (se houver quem ofereça e Soul para gastar).
        private async Awaitable<bool> OfferRevive()
        {
            var handler = _deathHandler as IDeathHandler;
            if (handler == null || Context.SoulsAvailable <= 0) return false;
            if (!await handler.OfferRevive(Context)) return false;

            Context.SoulsUsed++;
            Context.Hero.Hp = Context.Hero.MaxHp;
            _stage.Float(null, $"+{Context.Hero.MaxHp} SOUL", BattleStage.Cyan, true);
            Context.Log("A Soul envolve o herói em luz... ele se reergue com a vida cheia!");
            return true;
        }

        // Monta o resumo do fim.
        private BattleEnd End(DungeonOutcomeKind kind) => new BattleEnd
        {
            Kind = kind,
            Request = Context.Request,
            RunGold = Context.Hero.RunGold,
            Flawless = Context.Hero.Flawless,
            SoulsUsed = Context.SoulsUsed,
            MapsUsed = Context.MapsUsed,
            Wave = Context.Wave,
        };

        // Fase 2 dos chefes, conferida a todo quadro (Parte 1 §8.4).
        private void Update()
        {
            if (Context == null) return;
            foreach (var monster in Context.Monsters)
            {
                if (!monster.ShouldEnrage) continue;
                monster.Enrage(CombatMath.EnrageAttackMult);
                _stage.Float(monster, "FASE 2!", BattleStage.Red, true);
                _stage.Shake();
                Context.Log($"{monster.Name} entra em FÚRIA! Golpes mais fortes, mais rápidos e turnos extras!");
            }
        }
    }
}
```

### Etapa 3D — O turno do monstro e as explosões

```csharp
// Caminho: Assets/_Project/Scripts/Battle/MonsterTurn.cs
using System.Collections.Generic;
using System.Threading;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: tudo o que um monstro pode fazer na sua vez (Parte 1 §5 e
    // §8): descansar exausto, erguer Escudo Arcano, agir como Monge de
    // suporte ou atacar com um golpe nomeado, hit a hit, pedindo a reação do
    // jogador; e, se o jogador defender tudo, levar o contra-ataque.
    // ESTRATÉGIA: a ordem dos testes é a do jogo publicado. A reação vem de
    // um IReactionSource (AutoPlayer agora, QteController na Fase 4) e as
    // regras vêm do HitResolver; aqui só ficam a sequência e a encenação.
    public class MonsterTurn : MonoBehaviour
    {
        [SerializeField] private BattleStage _stage;
        [SerializeField] private BattleHud _hud;
        [SerializeField] private MonoBehaviour _reactionSource;

        private IReactionSource Reactions => (IReactionSource)_reactionSource;
        private CancellationToken Token => destroyCancellationToken;

        // A vez de um monstro.
        public async Awaitable TakeTurn(BattleContext ctx, Monster monster)
        {
            var b = ctx.Balance;

            if (monster.Exhausted)
            {
                monster.ExhaustTurns--;
                _stage.Float(monster, "EXAUSTO...", BattleStage.Cyan, true);
                ctx.Log($"{monster.Name} está exausto e não consegue agir!");
                await Wait(0.9f);
                return;
            }

            if (monster.IsBoss && ctx.EffectiveLevel >= b.shieldMinLevel && monster.Shield < b.shieldMax
                && ctx.Rng.Value() < b.shieldChance)
            {
                await CastShield(ctx, monster);
                return;
            }

            if (monster.Support)
            {
                await SupportTurn(ctx, monster);
                return;
            }

            var move = MoveComposer.Pick(monster.Definition, ctx.EffectiveLevel, ctx.Rng);
            var combo = MoveComposer.Compose(move, monster.Enraged, ctx.NgPlus, b);
            _hud.ShowMoveName((monster.Enraged ? "FÚRIA: " : "") + move.name);
            ctx.Log(combo.Count > 1
                ? $"{monster.Name} prepara: {move.name} ({combo.Count} golpes)!"
                : $"{monster.Name} prepara: {move.name}!");

            if (!monster.Ranged) await _stage.MonsterApproach(monster, Token);
            else await Wait(0.38f);
            await Wait(0.22f);

            bool allDefended = combo.Count > 1;
            for (int i = 0; i < combo.Count; i++)
            {
                if (ctx.Hero.Dead) break;
                var hit = combo[i];
                var result = QteResult.Miss;
                if (ctx.Hero.GuardBroken)
                {
                    ctx.Log("Exausto, você não consegue reagir ao golpe!");
                    await Wait(0.55f);
                }
                else
                {
                    float seconds = QteTiming.Seconds(hit, ctx.EffectiveLevel, monster.Enraged, ctx.NgPlus, b);
                    string tag = combo.Count > 1 ? $"GOLPE {i + 1}/{combo.Count}" : "";
                    result = await Reactions.React(hit.type, seconds, QteTiming.Curve(hit, ctx.EffectiveLevel), tag);
                }

                var swing = _stage.ViewOf(monster).Strike(Token);
                await Wait(0.18f);
                int attack = CombatMath.ComboHitAttack(monster.Attack, combo.Count);
                var outcome = HitResolver.Resolve(ctx.Hero, monster, hit.type, result, attack, combo.Count > 1,
                    ctx.EffectiveLevel, b, ctx.Rng);
                Show(ctx, monster, outcome);
                await swing;

                if (!outcome.Defended) allDefended = false;
                if (hit.type == ReactionType.Jump && result == QteResult.Dodge && !monster.Dead && !ctx.Hero.Dead)
                    await AerialAttack(ctx, monster);
                if (monster.Dead || ctx.Hero.Dead) break;
                if (i < combo.Count - 1) await Wait(0.26f);
            }

            if (monster.Dead) return;
            if (allDefended && !ctx.Hero.Dead)
            {
                ctx.Log("Combo inteiro defendido!");
                await Wait(0.35f);
                await CounterAttack(ctx, monster);
            }
            if (!monster.Ranged && !monster.Dead) await _stage.MonsterReturn(monster, Token);
        }

        // Mostra o resultado de um hit (Parte 1 §5) e mata o monstro se o riposte o derrubou.
        private void Show(BattleContext ctx, Monster monster, HitOutcome o)
        {
            switch (o.Result)
            {
                case QteResult.Dodge:
                    _stage.Float(null, "ESQUIVOU!", BattleStage.Green, true);
                    ctx.Log(o.Type == ReactionType.Jump
                        ? $"Você saltou sobre o golpe rasteiro de {monster.Name} (+1 Fúria)!"
                        : $"Você deslizou para o lado e o golpe de {monster.Name} passou reto!");
                    break;
                case QteResult.Perfect:
                    _ = _stage.HeroView.Guard(Token);
                    _stage.Float(null, "PARRY!", BattleStage.Gold, true);
                    _stage.ShowStrike(monster, o.Riposte, BattleStage.Gold, false);
                    if (o.Healed > 0) _stage.Float(null, $"+{o.Healed} VITAL", BattleStage.Green);
                    ctx.Log($"PERFEITO! Aparou e revidou {o.Riposte.Damage} de dano em {monster.Name} (+1 Fúria)!");
                    break;
                case QteResult.Block:
                    _ = _stage.HeroView.Guard(Token);
                    _stage.Float(null, $"-{o.Damage}", BattleStage.Purple);
                    ctx.Log($"Bloqueado! A defesa absorveu: {o.Damage} de dano (+1 Fúria).");
                    break;
                default:
                    _stage.HeroView.Flash();
                    _stage.Shake();
                    _stage.Float(null, $"-{o.Damage}", BattleStage.Red, true);
                    ctx.Log($"{monster.Name} acertou em cheio! {o.Damage} de dano.");
                    break;
            }

            if (o.GotDynamite) _stage.Float(null, "+1 DINAMITE", BattleStage.Orange);
            if (o.WardAbsorbed > 0) _stage.Float(null, $"COURAÇA -{o.WardAbsorbed}", BattleStage.Blue);
            if (o.MonsterExhausted)
            {
                _stage.Float(monster, "EXAUSTO!", BattleStage.Cyan, true);
                ctx.Log($"{monster.Name} ficou exausto e perderá as próximas 3 rodadas!");
            }
            if (o.GuardBroke)
            {
                _stage.Float(null, "GUARDA QUEBRADA!", BattleStage.Cyan, true);
                ctx.Log("O combo esmagou sua guarda: sem ação nem defesa até se recuperar!");
            }
            if (o.Riposte.Killed && !ctx.Request.Tutorial) ctx.Slay(monster);
        }

        // Depois de pular um golpe rasteiro: toque rápido para golpear do alto.
        private async Awaitable AerialAttack(BattleContext ctx, Monster monster)
        {
            if (!await Reactions.AerialWindow(ctx.Balance.aerialWindowSeconds) || monster.Dead) return;
            var swing = _stage.HeroView.Strike(Token);
            await Wait(0.15f);
            _stage.Shake();
            int damage = CombatMath.HeroStrike(ctx.Hero.Attack, CombatMath.AerialMult, monster.Defense, 0);
            var strike = Strikes.Apply(monster, damage, 1, damage, ctx.Hero.Loadout.GemLevel(GemId.Pierce));
            _stage.ShowStrike(monster, strike, BattleStage.Gold, true);
            ctx.Log($"ATAQUE AÉREO! {damage} de dano em {monster.Name}!");
            if (strike.Killed && !ctx.Request.Tutorial) ctx.Slay(monster);
            await swing;
        }

        // Combo inteiro defendido: contra-ataque de 1,5× a 2× o ATK.
        private async Awaitable CounterAttack(BattleContext ctx, Monster monster)
        {
            double mult = CombatMath.CounterMin + ctx.Rng.Value() * (CombatMath.CounterMax - CombatMath.CounterMin);
            var swing = _stage.HeroView.Strike(Token);
            await Wait(0.18f);
            _stage.Shake();
            int damage = CombatMath.HeroStrike(ctx.Hero.Attack, mult, monster.Defense, 0);
            var strike = Strikes.Apply(monster, damage, 2, ctx.Hero.Attack * mult - monster.Defense,
                ctx.Hero.Loadout.GemLevel(GemId.Pierce));
            _stage.ShowStrike(monster, strike, BattleStage.Gold, true);
            ctx.Log($"CONTRA-ATAQUE x{mult:0.0}! {damage} de dano em {monster.Name}!");
            if (strike.Killed) ctx.Slay(monster);
            await swing;
        }

        // Chefe gasta o turno erguendo 2 a 3 escudos (teto 10).
        private async Awaitable CastShield(BattleContext ctx, Monster monster)
        {
            int gain = Mathf.Min(ctx.Balance.shieldMax - monster.Shield, ctx.Rng.Range(2, 3));
            _hud.ShowMoveName("Barreira Arcana");
            ctx.Log($"{monster.Name} conjura uma barreira arcana...");
            await Wait(0.55f);
            monster.Shield += gain;
            _stage.Float(monster, $"+{gain} ESCUDO", BattleStage.Blue, true);
            ctx.Log($"{monster.Name} ergueu {gain} escudos ({monster.Shield}/{ctx.Balance.shieldMax}). Quebre todos antes de ferir o chefe!");
            await Wait(0.65f);
        }

        // Monge de suporte (Parte 1 §8.5): cura, encanto ou feitiço.
        private async Awaitable SupportTurn(BattleContext ctx, Monster monk)
        {
            var hurt = ctx.Monsters.FindAll(m => !m.Dead && (double)m.Hp / m.MaxHp < 0.5);
            hurt.Sort((a, c) => ((double)a.Hp / a.MaxHp).CompareTo((double)c.Hp / c.MaxHp));

            if (hurt.Count > 0 && ctx.Rng.Value() < 0.5)
            {
                var target = hurt[0];
                _hud.ShowMoveName("Prece de Cura");
                var cast = _stage.ViewOf(monk).Strike(Token);
                await Wait(0.45f);
                int heal = MathUtil.RoundHalfUp(target.MaxHp * CombatMath.MonkHealFraction);
                target.Heal(heal);
                _stage.Float(target, $"+{heal}", BattleStage.Green, true);
                ctx.Log($"{monk.Name} curou {target.Name} em {heal} de HP!");
                await cast;
                return;
            }

            if (ctx.Hero.Curse == null && ctx.Rng.Value() < 0.45)
            {
                var type = ctx.Rng.Value() < 0.5 ? CurseType.Drain : CurseType.SealFury;
                int turns = ctx.Rng.Range(2, 3);
                var cast = _stage.ViewOf(monk).Strike(Token);
                await Wait(0.45f);
                ctx.Hero.Curse = new Curse { Type = type, Turns = turns, Power = CombatMath.CursePower(monk.Attack) };
                _hud.ShowMoveName(type == CurseType.Drain ? "Maldição Sombria" : "Selo da Fúria");
                _stage.Float(null, type == CurseType.Drain ? "MALDIÇÃO!" : "FÚRIA SELADA!", BattleStage.Purple, true);
                ctx.Log(type == CurseType.Drain
                    ? $"Maldição! Você perderá {ctx.Hero.Curse.Power} de HP no início dos próximos {turns} turnos!"
                    : $"Fúria selada! Sua barra de Fúria não enche pelos próximos {turns} turnos!");
                await cast;
                return;
            }

            // Feitiço à distância: o primeiro hit de um golpe, sempre como parry.
            var move = MoveComposer.Pick(monk.Definition, ctx.EffectiveLevel, ctx.Rng);
            var hit = move.hits[0];
            _hud.ShowMoveName(move.name);
            ctx.Log($"{monk.Name} conjura: {move.name}!");
            await Wait(0.38f);
            var result = QteResult.Miss;
            if (ctx.Hero.GuardBroken) await Wait(0.55f);
            else result = await Reactions.React(ReactionType.Parry,
                QteTiming.Seconds(hit, ctx.EffectiveLevel, false, ctx.NgPlus, ctx.Balance),
                QteTiming.Curve(hit, ctx.EffectiveLevel), "");
            var swing = _stage.ViewOf(monk).Strike(Token);
            await Wait(0.18f);
            var outcome = HitResolver.Resolve(ctx.Hero, monk, ReactionType.Parry, result, monk.Attack, false,
                ctx.EffectiveLevel, ctx.Balance, ctx.Rng);
            Show(ctx, monk, outcome);
            await swing;
        }

        private Awaitable Wait(float seconds) => Awaitable.WaitForSecondsAsync(seconds, Token);
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BoomResolver.cs
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: a Explosão Final dos goblins de fogo (Parte 1 §8.4): o herói
    // só escapa com a esquiva lateral; os outros monstros levam estilhaços e
    // podem morrer, encadeando outras explosões.
    // ESTRATÉGIA: o BattleContext enfileira cada goblin de fogo morto; o
    // controlador chama ProcessAll depois de cada ação, que esvazia a fila
    // (mortes novas entram no fim da fila e são resolvidas na sequência).
    // Simplificação do port: um goblin morto por pedrada explode ao fim do
    // turno do herói, não no meio dele.
    public class BoomResolver : MonoBehaviour
    {
        [SerializeField] private BattleStage _stage;
        [SerializeField] private BattleHud _hud;
        [SerializeField] private MonoBehaviour _reactionSource;

        private IReactionSource Reactions => (IReactionSource)_reactionSource;

        // Resolve todas as explosões pendentes (para se o herói cair).
        public async Awaitable ProcessAll(BattleContext ctx)
        {
            while (ctx.PendingBooms.Count > 0 && !ctx.Hero.Dead)
                await Boom(ctx, ctx.PendingBooms.Dequeue());
        }

        // Uma explosão.
        private async Awaitable Boom(BattleContext ctx, Monster goblin)
        {
            int damage = CombatMath.BoomDamage(goblin.Attack);
            _hud.ShowMoveName($"{goblin.Name} vai explodir!");
            ctx.Log($"O corpo de {goblin.Name} vai explodir! DESLIZE para o lado para esquivar!");
            await Awaitable.WaitForSecondsAsync(0.45f, destroyCancellationToken);
            var result = await Reactions.React(ReactionType.Side, ctx.Balance.qteSeconds, QteCurve.Linear, "");
            _stage.Shake();

            foreach (var other in ctx.Alive())
            {
                if (other.Shield > 0)
                {
                    other.Shield--;
                    _stage.Float(other, "ESCUDO -1", BattleStage.Blue);
                    continue;
                }
                int splash = CombatMath.BoomSplash(damage, other.Defense);
                other.TakeDamage(splash);
                _stage.ViewOf(other)?.Flash();
                _stage.Float(other, splash.ToString(), BattleStage.Orange);
                if (other.Hp <= 0)
                {
                    ctx.Slay(other);
                    ctx.Log($"A explosão levou {other.Name} junto! +{other.Gold} de ouro.");
                }
            }

            if (result == QteResult.Dodge)
            {
                _stage.Float(null, "ESQUIVOU!", BattleStage.Green, true);
                ctx.Log($"Você deslizou para o lado: a explosão de {goblin.Name} não te alcançou!");
            }
            else
            {
                ctx.Hero.TakeDamage(damage);
                ctx.Hero.GainFury();
                ctx.Hero.AddStagger(damage, false);
                _stage.HeroView.Flash();
                _stage.Float(null, $"-{damage} EXPLOSÃO", BattleStage.Orange, true);
                ctx.Log($"A explosão de {goblin.Name} te atingiu! {damage} de dano.");
            }
            await Awaitable.WaitForSecondsAsync(0.5f, destroyCancellationToken);
        }
    }
}
```

### Etapa 3E — O turno do herói

```csharp
// Caminho: Assets/_Project/Scripts/Battle/HoldButton.cs
using System;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: os comandos de ação exigem SEGURAR o botão por 0,9 s (Parte 1
    // §6), para um toque acidental não gastar o turno.
    // ESTRATÉGIA: pressionar começa a encher a barra; soltar ou arrastar o
    // dedo para fora cancela; encheu, dispara `Held`.
    public class HoldButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
    {
        [SerializeField] private Image _fill;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private CanvasGroup _group;
        [SerializeField] private float _holdSeconds = 0.9f;

        public event Action Held;

        private bool _interactable = true;
        private bool _holding;
        private float _elapsed;

        // Desabilitado fica semitransparente e ignora o toque.
        public bool Interactable
        {
            get => _interactable;
            set
            {
                _interactable = value;
                _group.alpha = value ? 1f : 0.35f;
                if (!value) Cancel();
            }
        }

        // Troca o texto do botão.
        public void SetLabel(string text) => _label.text = text;

        public void OnPointerDown(PointerEventData eventData)
        {
            if (!_interactable) return;
            _holding = true;
            _elapsed = 0f;
        }

        public void OnPointerUp(PointerEventData eventData) => Cancel();

        public void OnPointerExit(PointerEventData eventData) => Cancel();

        // Enche a barra; ao completar, dispara a ação.
        private void Update()
        {
            if (!_holding) return;
            _elapsed += Time.unscaledDeltaTime;
            _fill.fillAmount = _elapsed / _holdSeconds;
            if (_elapsed >= _holdSeconds)
            {
                Cancel();
                Held?.Invoke();
            }
        }

        // Para de segurar e esvazia a barra.
        private void Cancel()
        {
            _holding = false;
            _elapsed = 0f;
            if (_fill != null) _fill.fillAmount = 0f;
        }

        private void OnDisable() => Cancel();
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/CommandMenu.cs
using GuerreiroDaMasmorra.Data;
using UnityEngine;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Battle
{
    public enum HeroCommand
    {
        None,
        Attack,
        Fury,
        Combo,
        Blade,
        Sequence,
        HealPotion,
        Adrenaline,
        Flee,
    }

    // POR QUE: o que o menu deve permitir neste turno.
    public struct CommandOptions
    {
        public bool Fury;
        public string FuryLabel;
        public bool Combo;
        public string ComboLabel;
        public bool Blade;
        public bool Sequence;
        public int SkillsUnlocked;
        public int Heals;
        public bool CanHeal;
        public int Adrenalines;
        public bool CanAdrenaline;
        public int Maps;
    }

    // POR QUE: a lista de comandos do herói (Parte 1 §6 e §14), com os
    // submenus de Especial e Poção.
    // ESTRATÉGIA: WaitForCommand devolve uma "promessa" (Awaitable) que só
    // se cumpre quando um botão é segurado até o fim; o turno do herói faz
    // await nela. Cancel cumpre a promessa com None (a pedrada matou o
    // último monstro). Especial ainda não liberado pela Habilidade nem aparece.
    public class CommandMenu : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private HoldButton _attack;
        [SerializeField] private HoldButton _flee;
        [SerializeField] private Button _specialToggle;
        [SerializeField] private Button _potionToggle;
        [SerializeField] private GameObject _specialPanel;
        [SerializeField] private GameObject _potionPanel;
        [SerializeField] private HoldButton _fury;
        [SerializeField] private HoldButton _combo;
        [SerializeField] private HoldButton _blade;
        [SerializeField] private HoldButton _sequence;
        [SerializeField] private HoldButton _heal;
        [SerializeField] private HoldButton _adrenaline;

        private AwaitableCompletionSource<HeroCommand> _pending;

        // Liga cada botão ao comando que ele representa.
        private void Awake()
        {
            _attack.Held += () => Complete(HeroCommand.Attack);
            _flee.Held += () => Complete(HeroCommand.Flee);
            _fury.Held += () => Complete(HeroCommand.Fury);
            _combo.Held += () => Complete(HeroCommand.Combo);
            _blade.Held += () => Complete(HeroCommand.Blade);
            _sequence.Held += () => Complete(HeroCommand.Sequence);
            _heal.Held += () => Complete(HeroCommand.HealPotion);
            _adrenaline.Held += () => Complete(HeroCommand.Adrenaline);
            _specialToggle.onClick.AddListener(() => Toggle(_specialPanel, _potionPanel));
            _potionToggle.onClick.AddListener(() => Toggle(_potionPanel, _specialPanel));
            _root.SetActive(false);
        }

        // Mostra o menu e espera um comando.
        public Awaitable<HeroCommand> WaitForCommand(CommandOptions o)
        {
            _fury.gameObject.SetActive(o.SkillsUnlocked >= 1);
            _combo.gameObject.SetActive(o.SkillsUnlocked >= 2);
            _blade.gameObject.SetActive(o.SkillsUnlocked >= 3);
            _sequence.gameObject.SetActive(o.SkillsUnlocked >= 4);
            _specialToggle.interactable = o.SkillsUnlocked >= 1;

            _fury.Interactable = o.Fury;
            _fury.SetLabel($"FÚRIA {o.FuryLabel}");
            _combo.Interactable = o.Combo;
            _combo.SetLabel($"COMBO {o.ComboLabel}");
            _blade.Interactable = o.Blade;
            _sequence.Interactable = o.Sequence;
            _heal.Interactable = o.CanHeal;
            _heal.SetLabel($"CURA x{o.Heals}");
            _adrenaline.Interactable = o.CanAdrenaline;
            _adrenaline.SetLabel($"ADRENALINA x{o.Adrenalines}");
            _flee.Interactable = o.Maps > 0;
            _flee.SetLabel($"FUGIR x{o.Maps}");

            _specialPanel.SetActive(false);
            _potionPanel.SetActive(false);
            _root.SetActive(true);
            _pending = new AwaitableCompletionSource<HeroCommand>();
            return _pending.Awaitable;
        }

        // Encerra a espera sem comando.
        public void Cancel() => Complete(HeroCommand.None);

        // Cumpre a promessa uma vez só e esconde o menu.
        private void Complete(HeroCommand command)
        {
            if (_pending == null) return;
            var pending = _pending;
            _pending = null;
            _root.SetActive(false);
            pending.SetResult(command);
        }

        // Abre um submenu e fecha o outro.
        private void Toggle(GameObject open, GameObject close)
        {
            open.SetActive(!open.activeSelf);
            close.SetActive(false);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/TargetSelector.cs
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: escolher o alvo no turno do herói (Parte 1 §6): tocar num
    // monstro, deslizar no campo ou usar ← →.
    // ESTRATÉGIA: só escuta entre Begin e End. Toques que começam em cima
    // da interface ou do herói (onde começa a pedrada) são ignorados.
    public class TargetSelector : MonoBehaviour
    {
        [SerializeField] private BattleStage _stage;
        [SerializeField] private float _swipeInches = 0.25f;

        private BattleContext _context;
        private Vector2 _pressPosition;
        private bool _tracking;

        public void Begin(BattleContext context) => _context = context;

        public void End()
        {
            _context = null;
            _tracking = false;
        }

        // Lê teclado e toque a cada quadro.
        private void Update()
        {
            if (_context == null) return;

            var keyboard = Keyboard.current;
            if (keyboard != null)
            {
                if (keyboard.leftArrowKey.wasPressedThisFrame) _context.CycleTarget(-1);
                if (keyboard.rightArrowKey.wasPressedThisFrame) _context.CycleTarget(1);
            }

            var pointer = Pointer.current;
            if (pointer == null) return;
            Vector2 position = pointer.position.ReadValue();

            if (pointer.press.wasPressedThisFrame)
            {
                bool overUi = EventSystem.current != null && EventSystem.current.IsPointerOverGameObject();
                _tracking = !overUi && !_stage.IsHeroAt(position);
                _pressPosition = position;
            }

            if (_tracking && pointer.press.wasReleasedThisFrame)
            {
                _tracking = false;
                float dx = position.x - _pressPosition.x;
                if (Mathf.Abs(dx) > SwipePixels())
                {
                    _context.CycleTarget(dx > 0 ? 1 : -1);
                    return;
                }
                var monster = _stage.MonsterAt(position);
                if (monster != null) _context.Target = monster;
            }
        }

        // Distância mínima de deslize, em pixels da tela.
        private float SwipePixels() => _swipeInches * (Screen.dpi > 0 ? Screen.dpi : 160f);
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/WarriorTurn.cs
using System.Collections.Generic;
using System.Threading;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: o turno do Guerreiro (e de Caçadora, Lanceiro e Monge, que
    // usam o mesmo motor): escolher o comando e executá-lo (Parte 1 §6 e §7).
    // ESTRATÉGIA: espera o comando do CommandMenu com o alvo e as ações
    // grátis liberadas; depois, um método por comando. Todo especial gasta
    // Fúria e deixa o herói exausto. Os minijogos vêm de um IMinigames
    // (AutoPlayer agora, MinigamePanel na Fase 5).
    public class WarriorTurn : MonoBehaviour, IHeroTurnTaker
    {
        [SerializeField] private BattleStage _stage;
        [SerializeField] private CommandMenu _menu;
        [SerializeField] private TargetSelector _targets;
        [SerializeField] private MonoBehaviour _minigames;
        [SerializeField] private MonoBehaviour _freeAction;

        private IMinigames Minigames => (IMinigames)_minigames;
        private CancellationToken Token => destroyCancellationToken;

        // Escolhe e executa uma ação.
        public async Awaitable<TurnResult> TakeTurn(BattleContext ctx)
        {
            ctx.ShowTarget = true;
            _targets.Begin(ctx);
            var free = _freeAction as IFreeAction;
            free?.Begin(ctx, _menu.Cancel);

            var command = await _menu.WaitForCommand(Options(ctx));

            free?.End();
            _targets.End();
            ctx.ShowTarget = false;
            ctx.EnsureTarget();
            if (ctx.WaveCleared) return TurnResult.Done;

            switch (command)
            {
                case HeroCommand.Attack: await BasicAttack(ctx); break;
                case HeroCommand.Fury: await FurySpecial(ctx); break;
                case HeroCommand.Combo: await Combo(ctx); break;
                case HeroCommand.Blade: await InvisibleBlade(ctx); break;
                case HeroCommand.Sequence: await DeadlySequence(ctx); break;
                case HeroCommand.HealPotion: await HealPotion(ctx); break;
                case HeroCommand.Adrenaline: await AdrenalinePotion(ctx); break;
                case HeroCommand.Flee:
                    ctx.MapsUsed++;
                    ctx.Log("Você usou um mapa e escapou pelo túnel secreto. Todo o ouro coletado foi mantido.");
                    return TurnResult.Fled;
            }
            return TurnResult.Done;
        }

        // O que está liberado neste turno.
        private CommandOptions Options(BattleContext ctx)
        {
            var hero = ctx.Hero;
            int unlocked = hero.Loadout.SkillsUnlocked(ctx.Balance.skillStep);
            var tier = CombatMath.FuryTierFor(hero.Fury);
            return new CommandOptions
            {
                SkillsUnlocked = unlocked,
                Fury = hero.Fury >= 1,
                FuryLabel = !tier.HasValue ? "" : tier.Value.AllTargets ? "x2 TODOS" : $"x{tier.Value.Mult:0.0}",
                Combo = hero.Fury >= 1,
                ComboLabel = $"{CombatMath.ComboHits(hero.Fury)} golpes",
                Blade = hero.Fury >= 1,
                Sequence = hero.Fury >= 2,
                Heals = hero.Potions,
                CanHeal = hero.Potions > 0 && hero.Hp < hero.MaxHp,
                Adrenalines = hero.Adrenaline,
                CanAdrenaline = hero.Adrenaline > 0 && hero.Fury < 5,
                Maps = ctx.MapsAvailable,
            };
        }

        // Ataque simples: crítico de 15%, eco da Gema do Eco, +1 Fúria só para o Guerreiro.
        private async Awaitable BasicAttack(BattleContext ctx)
        {
            var hero = ctx.Hero;
            var target = ctx.Target;
            int echo = hero.Loadout.GemLevel(GemId.Echo);
            int pierce = hero.Loadout.GemLevel(GemId.Pierce);
            await _stage.HeroApproach(target, Token);

            int strikes = echo > 0 ? 2 : 1;
            for (int i = 0; i < strikes && !target.Dead; i++)
            {
                double mult = i > 0 ? CombatMath.EchoMult(echo) : 1.0;
                var swing = _stage.HeroView.Strike(Token);
                await Wait(0.2f);
                bool crit = ctx.Rng.Value() < CombatMath.CritChance;
                int damage = CombatMath.HeroStrike(hero.Attack, mult, target.Defense, ctx.Rng.Range(-2, 3));
                if (crit) damage *= 2;
                var strike = Strikes.Apply(target, damage, crit ? 2 : 1, hero.Attack * mult - target.Defense, pierce);
                _stage.ShowStrike(target, strike, crit ? BattleStage.Gold : BattleStage.White, crit);
                ctx.Log($"{(i > 0 ? "Eco! " : "")}{(crit ? "CRÍTICO! " : "")}{strike.Damage} de dano em {target.Name}.");
                if (strike.Killed) ctx.Slay(target);
                await swing;
                if (i < strikes - 1 && !target.Dead) await Wait(0.15f);
            }

            if (hero.Loadout.Hero.furyOnAttack) hero.GainFury();
            await _stage.HeroReturn(Token);
        }

        // Especial Fúria: faixa pela Fúria atual; com 5, golpe em todos com barra de carga.
        private async Awaitable FurySpecial(BattleContext ctx)
        {
            var hero = ctx.Hero;
            var tier = CombatMath.FuryTierFor(hero.Fury).Value;
            hero.SpendFury(tier.Cost);
            hero.Exhausted = true;
            var targets = tier.AllTargets ? ctx.Alive() : new List<Monster> { ctx.Target };
            ctx.Log(tier.AllTargets ? "FÚRIA TOTAL! Golpe giratório em TODOS (x2)!" : $"Golpe de fúria (x{tier.Mult:0.0})!");

            if (tier.AllTargets) await _stage.HeroToCenter(Token);
            else await _stage.HeroApproach(targets[0], Token);

            double mult = tier.Mult;
            bool crit = false;
            if (tier.ChargeBar)
            {
                float seconds = 2.2f * (float)DungeonMath.NgSpeedMult(ctx.NgPlus, ctx.Balance);
                float charge = await Minigames.ChargeBar(seconds);
                crit = charge >= 1f || ctx.Rng.Value() < charge;
                if (crit) mult *= CombatMath.FuryCritMult;
                ctx.Log(crit
                    ? $"CRÍTICO DE FÚRIA! Golpe carregado a {charge:P0}: força devastadora!"
                    : $"Carga de {charge:P0}: não saiu crítico desta vez.");
            }

            var swing = _stage.HeroView.Strike(Token);
            await Wait(0.2f);
            _stage.Shake();
            foreach (var target in targets)
            {
                if (CombatMath.AddFatigue(target, mult, ctx.EffectiveLevel, ctx.Balance))
                    _stage.Float(target, "EXAUSTO!", BattleStage.Cyan, true);
                int damage = CombatMath.HeroStrike(hero.Attack, mult, target.Defense, ctx.Rng.Range(-1, 3));
                var strike = Strikes.Apply(target, damage, crit ? 4 : 2, hero.Attack * mult - target.Defense,
                    hero.Loadout.GemLevel(GemId.Pierce));
                _stage.ShowStrike(target, strike, crit ? BattleStage.Red : BattleStage.Gold, true);
                if (strike.Killed) ctx.Slay(target);
            }
            await swing;
            await _stage.HeroReturn(Token);
        }

        // Combo: 2 a 4 golpes, cada um com seu toque de tempo.
        private async Awaitable Combo(BattleContext ctx)
        {
            var hero = ctx.Hero;
            var target = ctx.Target;
            int hits = CombatMath.ComboHits(hero.Fury);
            hero.SpendFury(hits);
            hero.Exhausted = true;
            ctx.Log($"COMBO de {hits} golpes em {target.Name}! Acerte o tempo de cada um!");
            await _stage.HeroApproach(target, Token);

            int landed = 0;
            for (int i = 0; i < hits && !target.Dead; i++)
            {
                bool ok = await Minigames.ComboStrike(i, hits);
                var swing = _stage.HeroView.Strike(Token);
                await Wait(0.18f);
                if (ok)
                {
                    landed++;
                    double mult = CombatMath.ComboMults[i];
                    if (CombatMath.AddFatigue(target, mult, ctx.EffectiveLevel, ctx.Balance))
                        _stage.Float(target, "EXAUSTO!", BattleStage.Cyan, true);
                    int damage = CombatMath.HeroStrike(hero.Attack, mult, target.Defense, ctx.Rng.Range(-1, 2));
                    var strike = Strikes.Apply(target, damage, 1, hero.Attack * mult - target.Defense,
                        hero.Loadout.GemLevel(GemId.Pierce));
                    _stage.ShowStrike(target, strike, i >= 2 ? BattleStage.Gold : BattleStage.White, i >= 2);
                    if (i >= 2) _stage.Shake();
                    if (strike.Killed) ctx.Slay(target);
                }
                else
                {
                    _stage.Float(null, "ERROU!", BattleStage.White);
                    ctx.Log($"Golpe {i + 1}/{hits} errou o tempo!");
                }
                await swing;
                if (target.Dead) break;
                if (i < hits - 1) await Wait(0.2f);
            }
            if (landed == hits && !target.Dead) ctx.Log($"COMBO PERFEITO! Todos os {hits} golpes conectaram!");
            await _stage.HeroReturn(Token);
        }

        // Lâmina Invisível: um golpe de x0,85 por ponto de Fúria, em alvos sorteados.
        private async Awaitable InvisibleBlade(BattleContext ctx)
        {
            var hero = ctx.Hero;
            int hits = hero.Fury;
            hero.SpendFury(hits);
            hero.Exhausted = true;
            ctx.Log($"LÂMINA INVISÍVEL! {hits} golpe(s) relâmpago!");
            await _stage.HeroToCenter(Token);
            var swing = _stage.HeroView.Strike(Token);
            await Wait(0.16f);
            for (int i = 0; i < hits; i++)
            {
                var alive = ctx.Alive();
                if (alive.Count == 0) break;
                var target = alive[ctx.Rng.Range(0, alive.Count - 1)];
                if (CombatMath.AddFatigue(target, CombatMath.BladeFatigue, ctx.EffectiveLevel, ctx.Balance))
                    _stage.Float(target, "EXAUSTO!", BattleStage.Cyan, true);
                int damage = CombatMath.HeroStrike(hero.Attack, CombatMath.BladeMult, target.Defense, ctx.Rng.Range(-1, 2));
                var strike = Strikes.Apply(target, damage, 1, hero.Attack * CombatMath.BladeMult - target.Defense,
                    hero.Loadout.GemLevel(GemId.Pierce));
                _stage.ShowStrike(target, strike, BattleStage.Purple, true);
                if (strike.Killed) ctx.Slay(target);
                await Wait(0.09f);
            }
            _stage.Shake();
            await swing;
            await _stage.HeroReturn(Token);
        }

        // Sequência Mortal: barra oscilante define o multiplicador; sem toque, falha.
        private async Awaitable DeadlySequence(BattleContext ctx)
        {
            var hero = ctx.Hero;
            hero.SpendFury(2);
            hero.Exhausted = true;
            ctx.Log("SEQUÊNCIA MORTAL! Trave o cursor na zona vermelha!");
            double mult = await Minigames.SequenceBar();
            if (mult <= 0)
            {
                ctx.Log("O ataque falhou! O herói hesitou...");
                _stage.Float(null, "FALHOU!", BattleStage.White, true);
                await Wait(0.6f);
                return;
            }

            var target = ctx.Target;
            await _stage.HeroApproach(target, Token);
            var swing = _stage.HeroView.Strike(Token);
            await Wait(0.2f);
            if (mult >= 1.5) _stage.Shake();
            if (CombatMath.AddFatigue(target, mult, ctx.EffectiveLevel, ctx.Balance))
                _stage.Float(target, "EXAUSTO!", BattleStage.Cyan, true);
            int damage = CombatMath.HeroStrike(hero.Attack, mult, target.Defense, ctx.Rng.Range(-1, 3));
            int shields = mult >= 2 ? 3 : mult >= 1.5 ? 2 : 1;
            var strike = Strikes.Apply(target, damage, shields, hero.Attack * mult - target.Defense,
                hero.Loadout.GemLevel(GemId.Pierce));
            _stage.ShowStrike(target, strike, mult >= 2 ? BattleStage.Gold : BattleStage.White, mult >= 1.5);
            ctx.Log($"Sequência Mortal x{mult:0.0}! {strike.Damage} de dano em {target.Name}.");
            await swing;
            if (strike.Killed) ctx.Slay(target);
            await _stage.HeroReturn(Token);
        }

        // Poção de Cura: +40% do HP máximo.
        private async Awaitable HealPotion(BattleContext ctx)
        {
            ctx.Hero.Potions--;
            int healed = ctx.Hero.Heal(MathUtil.RoundHalfUp(ctx.Hero.MaxHp * CombatMath.HealPotionFraction));
            _stage.Float(null, $"+{healed}", BattleStage.Green, true);
            ctx.Log($"Poção de Cura! +{healed} de HP.");
            await Wait(0.65f);
        }

        // Poção de Adrenalina: Fúria cheia.
        private async Awaitable AdrenalinePotion(BattleContext ctx)
        {
            ctx.Hero.Adrenaline--;
            ctx.Hero.Fury = 5;
            _stage.Float(null, "FÚRIA CHEIA!", BattleStage.Orange, true);
            ctx.Log("Poção de Adrenalina! Fúria no máximo (5/5).");
            await Wait(0.65f);
        }

        private Awaitable Wait(float seconds) => Awaitable.WaitForSecondsAsync(seconds, Token);
    }
}
```

### Etapa 3F — HUD, teste e montagem da cena

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BattleHud.cs
using System.Collections.Generic;
using System.Text;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: o HUD da batalha (Parte 1 §14): chip da masmorra, fila de
    // iniciativa, nome do golpe, log, HP, Fúria e barra de guarda.
    // ESTRATÉGIA: lê o BattleContext a cada quadro; eventos pontuais (log,
    // nome do golpe, fila) chegam por métodos.
    public class BattleHud : MonoBehaviour
    {
        [SerializeField] private TMP_Text _chip;
        [SerializeField] private TMP_Text _queue;
        [SerializeField] private TMP_Text _moveName;
        [SerializeField] private TMP_Text _log;
        [SerializeField] private TMP_Text _heroLine;
        [SerializeField] private TMP_Text _furyLabel;
        [SerializeField] private Image _hpFill;
        [SerializeField] private Image _furyFill;
        [SerializeField] private Image _guardFill;

        private readonly StringBuilder _text = new StringBuilder();
        private BattleContext _context;
        private float _moveNameUntil;

        // Liga o HUD a uma masmorra.
        public void Bind(BattleContext context)
        {
            _context = context;
            context.Logged += message => _log.text = message;
        }

        // Faixa com o nome do golpe, por 1,6 s.
        public void ShowMoveName(string name)
        {
            _moveName.text = name.ToUpperInvariant();
            _moveName.gameObject.SetActive(true);
            _moveNameUntil = Time.time + 1.6f;
        }

        // A fila da rodada, com a vez atual entre colchetes.
        public void ShowQueue(List<TurnSlot> queue, int current)
        {
            _text.Clear();
            for (int i = 0; i < queue.Count; i++)
            {
                string name = queue[i].IsHero ? "VOCÊ" : queue[i].Monster.Name.ToUpperInvariant();
                if (queue[i].Monster != null && queue[i].Monster.Dead) continue;
                _text.Append(i == current ? $"<b>[{name}]</b>" : name);
                if (i < queue.Count - 1) _text.Append("  >  ");
            }
            _queue.text = _text.ToString();
        }

        // Atualiza os números contínuos.
        private void LateUpdate()
        {
            if (Time.time > _moveNameUntil) _moveName.gameObject.SetActive(false);
            if (_context == null) return;

            var hero = _context.Hero;
            var request = _context.Request;
            _chip.text = $"MASMORRA NV. {request.Level}{(request.NgPlus > 0 ? $" NG+{request.NgPlus}" : "")} · " +
                         $"{DungeonMath.ColorName(request.Color).ToUpperInvariant()} · ONDA {_context.Wave}/3" +
                         $"{(_context.Wave == 3 ? " · CHEFE" : "")} · OURO {hero.RunGold}";
            _heroLine.text = $"HP {hero.Hp}/{hero.MaxHp}   DINAMITE {hero.Dynamite}   PEDRAS {hero.RocksLeft}";
            _hpFill.fillAmount = (float)hero.Hp / hero.MaxHp;
            _furyLabel.text = hero.FurySealed ? "FÚRIA SELADA" : $"FÚRIA {hero.Fury}/5";
            _furyFill.fillAmount = hero.Fury / 5f;
            _guardFill.fillAmount = (float)(hero.Stagger / hero.StaggerCap);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BattleTestStarter.cs
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: abrir a cena Battle e jogar uma masmorra na hora, sem
    // acampamento, escolhendo tudo no Inspector.
    // ESTRATÉGIA: monta um DungeonRequest e chama o controlador no Start.
    // A Fase 7 o desativa quando o acampamento passa a mandar o pedido.
    public class BattleTestStarter : MonoBehaviour
    {
        [SerializeField] private BattleController _controller;
        [SerializeField] private GameDatabase _database;
        [SerializeField] private string _heroId = "warrior";
        [SerializeField] private int _level = 1;
        [SerializeField] private int _ngPlus;
        [SerializeField] private DungeonColor _color = DungeonColor.Red;
        [SerializeField, Tooltip("Habilidade 20 libera os quatro especiais.")] private int _skillLevel = 20;
        [SerializeField] private int _bonusAttack;
        [SerializeField] private int _souls = 1;
        [SerializeField] private int _maps = 1;

        // Começa a masmorra de teste.
        private void Start()
        {
            var loadout = HeroLoadout.Fresh(_database.Hero(_heroId));
            loadout.SkillLevel = _skillLevel;
            loadout.Attack += _bonusAttack;
            _controller.Ended += end =>
                Debug.Log($"Fim da masmorra: {end.Kind} na onda {end.Wave}, ouro {end.RunGold}, perfeita {end.Flawless}");
            _controller.Begin(new DungeonRequest
            {
                Loadout = loadout,
                Level = _level,
                NgPlus = _ngPlus,
                Color = _color,
                Souls = _souls,
                Maps = _maps,
            });
        }
    }
}
```

**Montar a interface** (cena `Battle`):

1. **Hierarchy → UI → Canvas**, renomeie `[UI]`. **Canvas Scaler**: **Scale With Screen Size**, **Reference Resolution** `1080 × 1920`, **Match** `0.5`. Se pedir, troque o EventSystem para o **InputSystemUIInputModule**.
2. **HUD** (dentro do Canvas, objeto vazio esticado `BattleHud` com o componente **Battle Hud**):
   - topo: `Chip` (texto, tamanho `34`) e, abaixo, `Queue` (tamanho `30`, **Rich Text** ligado);
   - meio da tela: `MoveName` (texto grande, `48`, dourado, centralizado);
   - base (faixa dos 35% inferiores, com um painel escuro de fundo): `Log` (tamanho `32`), `HeroLine`, e três barras: **UI → Image** com **Image Type** `Filled`, **Fill Method** `Horizontal` para `HpFill` (verde), `FuryFill` (laranja) e `GuardFill` (azul-claro), com o texto `FuryLabel` sobre a de Fúria.
   - Ligue todos os campos.
3. **Prefab `HoldButton`:** **UI → Image** (fundo escuro arredondado, `300 × 110`) com **Add Component → Canvas Group** e **Add Component → Hold Button**. Filhos: `Fill` (**UI → Image**, **Image Type** `Filled`, **Fill Method** `Horizontal`, cor clara translúcida, esticado) e `Label` (texto `36`). Ligue **Fill**, **Label** e **Group**. Para `Prefabs/`.
4. **Menu de comandos:** dentro do Canvas, objeto `CommandMenu` com **Add Component → Command Menu**. Filho `Root` (ancorado à direita, no meio da altura) com um **Vertical Layout Group** contendo: `Attack` (HoldButton, "ATACAR"), `SpecialToggle` (**UI → Button - TextMeshPro**, "ESPECIAL"), `PotionToggle` (Button, "POÇÃO"), `Flee` (HoldButton, "FUGIR"). Ao lado esquerdo do `Root`, dois painéis: `SpecialPanel` com os HoldButtons `Fury`, `Combo`, `Blade` ("LÂMINA INVISÍVEL") e `Sequence` ("SEQUÊNCIA MORTAL"); `PotionPanel` com `Heal` e `Adrenaline`. Ligue tudo no **Command Menu**.
5. **Sistemas:** objeto vazio `[Systems]` com os filhos:
   - `BattleController` (**Battle Controller**),
   - `MonsterTurn` (**Monster Turn**),
   - `BoomResolver` (**Boom Resolver**),
   - `WarriorTurn` (**Warrior Turn**),
   - `TargetSelector` (**Target Selector**),
   - `AutoPlayer` (**Auto Player**),
   - `BattleTestStarter` (**Battle Test Starter**).
6. Ligações:
   - **Battle Controller:** Database, Stage, Hud, Monster Turn, Booms, **Warrior Turn** = o objeto `WarriorTurn`. Mage Turn e Death Handler ficam vazios.
   - **Monster Turn** e **Boom Resolver:** Stage, Hud e **Reaction Source** = `AutoPlayer`.
   - **Warrior Turn:** Stage, Menu, Targets e **Minigames** = `AutoPlayer`. Free Action fica vazio.
   - **Target Selector:** Stage.
   - **Battle Test Starter:** Controller e Database.

### 🧪 Teste rápido
Aperte ▶. O herói aparece à esquerda; três monstros entram correndo. A fila de iniciativa aparece no topo.
- **No turno do herói**, o menu aparece à direita: toque num monstro para mirar (o marcador muda), **segure** ATACAR até a barra encher. O herói corre, golpeia, volta.
- **No turno do monstro**, o nome do golpe aparece e o AutoPlayer reage sozinho: às vezes "PARRY!", às vezes "-10".
- Abra **ESPECIAL**: com **Skill Level** 20 os quatro especiais aparecem e se acendem conforme a Fúria.
- Vença as três ondas: o Console mostra `Fim da masmorra: Victory...`.

Agora estresse o motor: **Level** `20`, **Bonus Attack** `60`, **Skill** do AutoPlayer `0.9`. Chefes com escudo, Fase 2, goblins explodindo e monges curando devem aparecer ao longo das ondas.

### ✅ Checkpoint da Fase 3
- Uma masmorra inteira roda do início ao fim, com vitória ou derrota no Console.
- Todos os comandos funcionam; especiais deixam o herói exausto na rodada seguinte.
- Goblins de fogo explodem ao morrer e podem levar outros monstros junto.
- Commit: `feat: batalha completa com jogador automático`.

#### Problemas comuns
- **`InvalidCastException` em `Reactions` ou `Minigames`:** o campo recebeu um objeto sem o componente certo. Arraste o objeto `AutoPlayer` (que tem o componente **Auto Player**).
- **O toque no monstro não muda o alvo:** o **Box Collider 2D** do prefab `CombatantView` sumiu, ou o toque começou em cima de um painel de UI.
- **Botões não respondem:** falta o `EventSystem` na cena, ou a imagem raiz do `HoldButton` está com **Raycast Target** desligado.
- **`OperationCanceledException` no Console ao sair do Play:** é esperado se aparecer como aviso de algum `await` em andamento; o `BattleController` já o trata. Se vier de outro script, envolva o `await` em `try/catch (OperationCanceledException)`.
- **Monstros invisíveis:** o id no Visual Catalog está diferente do id do monstro (`pawn`, não `Pawn`). Sem entrada, ele aparece como quadrado laranja.

Próxima fase: **as reações**, o coração do jogo.

---

# Parte 7 — Implementação Unity: Fase 4 (Reações)

## Fase 4 — Reações (QTE)

> Objetivo desta fase: o círculo de reação da Parte 1 §5 com os gestos de verdade (tocar, arrastar para cima, deslizar para o lado), o aviso sonoro da janela perfeita e o Ataque Aéreo. Ele substitui o AutoPlayer como `IReactionSource` sem mudar nenhum script da Fase 3.

**Conceitos novos:**
- **Input System: `Pointer` e `Keyboard`:** `Pointer.current` é "o mouse ou o dedo", com `press.wasPressedThisFrame`, `press.isPressed` e `position`. Assim o mesmo código serve ao celular e ao navegador.
- **Eventos C# (`event Action`):** o `GestureInput` só anuncia "houve um toque", "houve um deslize para cima"; quem estiver interessado naquele instante se inscreve com `+=` e sai com `-=`.
- **`try` / `finally`:** o `finally` roda sempre, inclusive se o `await` for cancelado. É onde o círculo se desinscreve dos gestos e se esconde, para nunca ficar "preso" na tela.

### Etapa 4A — Gestos

```csharp
// Caminho: Assets/_Project/Scripts/Battle/GestureInput.cs
using System;
using UnityEngine;
using UnityEngine.InputSystem;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: traduz toque, mouse e teclado nos três gestos do jogo
    // (Parte 1 §14): tocar, arrastar para cima, deslizar para o lado.
    // ESTRATÉGIA: o toque é anunciado no instante em que o dedo encosta
    // (o tempo do parry é medido aí); o deslize, quando o dedo anda mais que
    // o limite numa direção dominante, uma vez por toque. Teclado: Espaço ou
    // Enter = toque, ↑ = salto, ← → = lateral.
    public class GestureInput : MonoBehaviour
    {
        [SerializeField] private float _swipeInches = 0.2f;

        public event Action Tapped;
        public event Action SwipedUp;
        public event Action SwipedSide;

        private Vector2 _start;
        private bool _tracking;

        // Lê os dispositivos a cada quadro.
        private void Update()
        {
            var keyboard = Keyboard.current;
            if (keyboard != null)
            {
                if (keyboard.spaceKey.wasPressedThisFrame || keyboard.enterKey.wasPressedThisFrame) Tapped?.Invoke();
                if (keyboard.upArrowKey.wasPressedThisFrame) SwipedUp?.Invoke();
                if (keyboard.leftArrowKey.wasPressedThisFrame || keyboard.rightArrowKey.wasPressedThisFrame) SwipedSide?.Invoke();
            }

            var pointer = Pointer.current;
            if (pointer == null) return;
            Vector2 position = pointer.position.ReadValue();

            if (pointer.press.wasPressedThisFrame)
            {
                _start = position;
                _tracking = true;
                Tapped?.Invoke();
            }

            if (_tracking && pointer.press.isPressed)
            {
                Vector2 delta = position - _start;
                float limit = _swipeInches * (Screen.dpi > 0 ? Screen.dpi : 160f);
                if (delta.y > limit && delta.y > Mathf.Abs(delta.x))
                {
                    _tracking = false;
                    SwipedUp?.Invoke();
                }
                else if (Mathf.Abs(delta.x) > limit && Mathf.Abs(delta.x) > Mathf.Abs(delta.y))
                {
                    _tracking = false;
                    SwipedSide?.Invoke();
                }
            }

            if (pointer.press.wasReleasedThisFrame) _tracking = false;
        }
    }
}
```

### Etapa 4B — O círculo de reação

```csharp
// Caminho: Assets/_Project/Scripts/Battle/QteController.cs
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: o círculo de reação da Parte 1 §5, o momento central do jogo.
    // ESTRATÉGIA: um anel encolhe até o alvo durante todo o tempo do golpe,
    // no ritmo da curva. Só o gesto do tipo pedido conta, e só o primeiro.
    // O parry mede o tempo desde que o anel abriu: depois de 68% do tempo é
    // PERFEITO; antes, bloqueio. O círculo fica aberto até o fim mesmo depois
    // da reação, como no jogo publicado, e um "plim" marca o início da janela
    // perfeita. Também serve ao Combo (AttackTiming) e ao Ataque Aéreo.
    public class QteController : MonoBehaviour, IReactionSource
    {
        [SerializeField] private GestureInput _input;
        [SerializeField] private GameDatabase _database;
        [SerializeField] private GameObject _root;
        [SerializeField] private RectTransform _ring;
        [SerializeField] private Image _ringImage;
        [SerializeField] private Image _targetImage;
        [SerializeField] private TMP_Text _icon;
        [SerializeField] private TMP_Text _tip;
        [SerializeField] private GameObject _aerialPrompt;
        [SerializeField] private AudioSource _perfectCue;
        [SerializeField] private Color _parryColor = new Color(0.98f, 0.75f, 0.14f);
        [SerializeField] private Color _jumpColor = new Color(0.29f, 0.87f, 0.5f);
        [SerializeField] private Color _sideColor = new Color(0.38f, 0.65f, 0.98f);
        [SerializeField] private Color _attackColor = new Color(0.97f, 0.44f, 0.44f);

        private GameBalance Balance => _database.balance;

        // Esconde tudo ao começar.
        private void Awake()
        {
            _root.SetActive(false);
            _aerialPrompt.SetActive(false);
        }

        // Abre o círculo para um golpe de monstro e devolve a reação.
        public async Awaitable<QteResult> React(ReactionType type, float seconds, QteCurve curve, string tag)
        {
            var result = QteResult.Miss;
            float start = Time.time;

            void OnTap()
            {
                if (type != ReactionType.Parry || result != QteResult.Miss) return;
                result = QteTiming.IsPerfect(Time.time - start, seconds, Balance) ? QteResult.Perfect : QteResult.Block;
                _tip.text = result == QteResult.Perfect ? "PERFEITO!" : "BLOQUEADO";
            }
            void OnUp()
            {
                if (type != ReactionType.Jump || result != QteResult.Miss) return;
                result = QteResult.Dodge;
                _tip.text = "ESQUIVA! ATAQUE NO AR!";
            }
            void OnSide()
            {
                if (type != ReactionType.Side || result != QteResult.Miss) return;
                result = QteResult.Dodge;
                _tip.text = "ESQUIVA LATERAL!";
            }

            _input.Tapped += OnTap;
            _input.SwipedUp += OnUp;
            _input.SwipedSide += OnSide;
            try
            {
                Open(ColorOf(type), IconOf(type), Prefix(tag) + TipOf(type));
                await RunRing(seconds, curve, () => result == QteResult.Miss);
            }
            finally
            {
                _input.Tapped -= OnTap;
                _input.SwipedUp -= OnUp;
                _input.SwipedSide -= OnSide;
                _root.SetActive(false);
            }
            return result;
        }

        // Golpe do Combo do herói: tocar quando o anel fechar (linear). True = conectou.
        public async Awaitable<bool> AttackTiming(string tag, float seconds)
        {
            bool reacted = false;
            bool perfect = false;
            float start = Time.time;

            void OnTap()
            {
                if (reacted) return;
                reacted = true;
                perfect = QteTiming.IsPerfect(Time.time - start, seconds, Balance);
                _tip.text = perfect ? "ACERTOU!" : "CEDO DEMAIS!";
            }

            _input.Tapped += OnTap;
            try
            {
                Open(_attackColor, "ATAQUE", Prefix(tag) + "TOQUE QUANDO FECHAR!");
                await RunRing(seconds, QteCurve.Linear, () => !reacted);
            }
            finally
            {
                _input.Tapped -= OnTap;
                _root.SetActive(false);
            }
            return perfect;
        }

        // Depois de pular um rasteiro: qualquer toque dentro da janela é Ataque Aéreo.
        public async Awaitable<bool> AerialWindow(float seconds)
        {
            bool tapped = false;
            void OnTap() => tapped = true;

            _input.Tapped += OnTap;
            _aerialPrompt.SetActive(true);
            try
            {
                float end = Time.time + seconds;
                while (!tapped && Time.time < end) await Awaitable.NextFrameAsync(destroyCancellationToken);
            }
            finally
            {
                _input.Tapped -= OnTap;
                _aerialPrompt.SetActive(false);
            }
            return tapped;
        }

        // Mostra o círculo com cor, ícone e dica.
        private void Open(Color color, string icon, string tip)
        {
            _ringImage.color = new Color(color.r, color.g, color.b, 0.45f);
            _targetImage.color = color;
            _icon.text = icon;
            _tip.text = tip;
            _ring.localScale = Vector3.one * 2.4f;
            _root.SetActive(true);
        }

        // Encolhe o anel durante `seconds`; toca o aviso no início da janela perfeita.
        private async Awaitable RunRing(float seconds, QteCurve curve, System.Func<bool> stillWaiting)
        {
            float start = Time.time;
            bool cued = false;
            while (Time.time - start < seconds)
            {
                float t = (Time.time - start) / seconds;
                _ring.localScale = Vector3.one * Mathf.Lerp(2.4f, 1f, QteTiming.Shape(curve, t));
                if (!cued && t >= Balance.perfectWindowStart)
                {
                    cued = true;
                    if (_perfectCue != null && stillWaiting()) _perfectCue.Play();
                }
                await Awaitable.NextFrameAsync(destroyCancellationToken);
            }
        }

        private static string Prefix(string tag) => string.IsNullOrEmpty(tag) ? "" : tag + " · ";

        private Color ColorOf(ReactionType type) =>
            type == ReactionType.Jump ? _jumpColor : type == ReactionType.Side ? _sideColor : _parryColor;

        private static string IconOf(ReactionType type) =>
            type == ReactionType.Jump ? "PULE" : type == ReactionType.Side ? "DESVIE" : "APARE";

        private static string TipOf(ReactionType type) =>
            type == ReactionType.Jump ? "ARRASTE PARA CIMA!"
            : type == ReactionType.Side ? "DESLIZE PARA O LADO!"
            : "TOQUE QUANDO O CÍRCULO FECHAR!";
    }
}
```

**Montar na cena `Battle`:**

1. **Círculos:** botão direito em `Art/Sprites` → **Create → 2D → Sprites → Circle**.
2. No Canvas `[UI]`, crie `Qte` (objeto vazio centralizado, `600 × 600`) com **Add Component → Qte Controller**. Filhos:
   - `Root` (vazio, esticado dentro de `Qte`) contendo: `Ring` (**UI → Image**, sprite `Circle`, `260 × 260`), `Target` (**UI → Image**, `Circle`, `260 × 260`, por cima do anel), `Icon` (texto `48`, centralizado no alvo) e `Tip` (texto `40`, abaixo do círculo).
   - `AerialPrompt` (texto grande "TOQUE! ATAQUE AÉREO!", acima do círculo).
3. **Aviso sonoro (opcional):** um objeto com **Audio Source** (**Play On Awake** desligado) e um som curto de moeda em **Audio Resource**; ligue em **Perfect Cue**.
4. Em `[Systems]`, objeto `GestureInput` com **Add Component → Gesture Input**.
5. Ligue no **Qte Controller**: Input, Database, Root, Ring, **Ring Image** (o `Ring`), **Target Image**, Icon, Tip e Aerial Prompt.
6. **A troca:** em **Monster Turn** e em **Boom Resolver**, mude **Reaction Source** de `AutoPlayer` para o objeto `Qte`.

### 🧪 Teste rápido
Aperte ▶ e deixe um monstro atacar.
- **Parry:** toque tarde (quando o anel quase encostou): "PERFEITO!", dano 0, o monstro leva o riposte. Toque cedo: "BLOQUEADO". Não toque: dano cheio.
- **Salto:** quando aparecer "PULE", arraste para cima (ou ↑). Depois da esquiva, toque rápido: ATAQUE AÉREO.
- **Lateral:** num golpe "DESVIE", deslize para o lado (ou ← →).
- Num golpe de 2 ou 3 hits, defenda todos: "Combo inteiro defendido!" e o contra-ataque.
- Com **Level** `6` ou mais, golpes com `a` na notação começam devagar e aceleram: a janela perfeita parece mais curta.

### ✅ Checkpoint da Fase 4
- Os três gestos funcionam com dedo, mouse e teclado.
- Só o gesto do tipo pedido conta; o círculo fica aberto o tempo inteiro.
- Commit: `feat: reações`.

#### Problemas comuns
- **Todo toque vira "BLOQUEADO":** a janela perfeita é medida por tempo, não pelo tamanho do anel; com curva `Accel`, o anel ainda parece grande quando ela começa. É o comportamento esperado.
- **O deslize também conta como toque no parry:** é intencional; o toque é lido no instante em que o dedo encosta. Num golpe de salto ou lateral, o toque é ignorado.
- **O círculo fica preso na tela após sair do Play:** algum `await` não recebeu o `destroyCancellationToken`; confira o `RunRing`.

---

# Parte 8 — Implementação Unity: Fase 5 (Especiais e pedrada)

## Fase 5 — Especiais e pedrada

> Objetivo desta fase: os minijogos dos especiais (barra de carga da Fúria total, barra oscilante da Sequência Mortal e o toque de tempo do Combo, Parte 1 §7.1) e a pedrada de arrastar (§6). O `MinigamePanel` substitui o AutoPlayer como `IMinigames`; a `RockThrower` entra como ação grátis no turno do herói.

**Conceitos novos:**
- **`RectTransform.anchoredPosition`:** a posição de um elemento de UI em relação às âncoras do pai. O cursor da barra oscilante anda mudando o `x` dela.
- **`LineRenderer`:** desenha uma linha entre pontos no mundo. É a "mira" da pedrada.
- **Ação "dispara e esquece":** `_ = Throw(...)` começa um método `async` sem esperar por ele. A pedrada voa enquanto o jogador ainda pode escolher o comando.

### Etapa 5A — Os minijogos

```csharp
// Caminho: Assets/_Project/Scripts/Battle/MinigamePanel.cs
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: os minijogos dos especiais (Parte 1 §7.1).
    // ESTRATÉGIA: cada minijogo mostra seu painel, escuta os toques do
    // GestureInput e devolve um número quando termina. Barra de carga: cada
    // toque soma 1/14 e a barra vaza 22% por segundo; cheia, fecha 0,26 s
    // depois. Barra oscilante: o cursor acelera conforme a zona e faz 3 idas
    // e voltas; o primeiro toque trava. Combo: o mesmo círculo do parry,
    // emprestado do QteController.
    public class MinigamePanel : MonoBehaviour, IMinigames
    {
        private const int ChargeTaps = 14;
        private const float ChargeLeakPerSecond = 0.22f;
        private static readonly float[] ZoneSpeeds = { 0.55f, 1.05f, 1.9f };
        private static readonly string[] ZoneLabels = { "FRACO x1.1", "FORTE x1.5", "MUITO FORTE x2!" };

        [SerializeField] private GestureInput _input;
        [SerializeField] private QteController _qte;
        [SerializeField] private GameDatabase _database;
        [Header("Barra de carga")]
        [SerializeField] private GameObject _chargeRoot;
        [SerializeField] private Image _chargeFill;
        [SerializeField] private TMP_Text _chargeText;
        [Header("Barra oscilante")]
        [SerializeField] private GameObject _sequenceRoot;
        [SerializeField] private RectTransform _sequenceBar;
        [SerializeField] private RectTransform _sequenceCursor;
        [SerializeField] private TMP_Text _sequenceText;

        // Esconde os painéis ao começar.
        private void Awake()
        {
            _chargeRoot.SetActive(false);
            _sequenceRoot.SetActive(false);
        }

        // Martelar a tela para carregar o golpe: devolve de 0 a 1.
        public async Awaitable<float> ChargeBar(float seconds)
        {
            float value = 0f;
            float fullAt = -1f;
            void OnTap()
            {
                if (value >= 1f) return;
                value = Mathf.Min(1f, value + 1f / ChargeTaps);
                if (value >= 1f) fullAt = Time.time;
            }

            _input.Tapped += OnTap;
            _chargeRoot.SetActive(true);
            try
            {
                float end = Time.time + seconds;
                while (Time.time < end && (fullAt < 0f || Time.time - fullAt < 0.26f))
                {
                    if (value < 1f) value = Mathf.Max(0f, value - Time.deltaTime * ChargeLeakPerSecond);
                    _chargeFill.fillAmount = value;
                    _chargeText.text = value >= 1f ? "CRÍTICO GARANTIDO!" : $"TOQUE SEM PARAR! {Mathf.RoundToInt(value * 100)}% de crítico";
                    await Awaitable.NextFrameAsync(destroyCancellationToken);
                }
            }
            finally
            {
                _input.Tapped -= OnTap;
                _chargeRoot.SetActive(false);
            }
            return value;
        }

        // Travar o cursor na zona certa: devolve 1,1 / 1,5 / 2, ou 0 se não tocou.
        public async Awaitable<double> SequenceBar()
        {
            double position = 0;
            int direction = 1;
            int trips = 0;
            double locked = 0;
            bool done = false;
            void OnTap()
            {
                if (done) return;
                done = true;
                int zone = CombatMath.SequenceZone(position);
                locked = CombatMath.SequenceMults[zone];
                _sequenceText.text = ZoneLabels[zone];
            }

            _input.Tapped += OnTap;
            _sequenceRoot.SetActive(true);
            try
            {
                while (!done)
                {
                    float dt = Mathf.Min(0.08f, Time.deltaTime);
                    position += direction * ZoneSpeeds[CombatMath.SequenceZone(position)] * dt;
                    if (position >= 1)
                    {
                        position = 1;
                        direction = -1;
                    }
                    else if (position <= 0)
                    {
                        position = 0;
                        direction = 1;
                        if (++trips >= 3) break;
                    }
                    float width = _sequenceBar.rect.width;
                    _sequenceCursor.anchoredPosition = new Vector2((float)(position - 0.5) * width, 0f);
                    if (!done) _sequenceText.text = $"TOQUE PARA TRAVAR! {3 - trips} ida(s) e volta(s)";
                    await Awaitable.NextFrameAsync(destroyCancellationToken);
                }
                if (!done)
                {
                    done = true;
                    _sequenceText.text = "O ATAQUE FALHOU!";
                }
                await Awaitable.WaitForSecondsAsync(0.65f, destroyCancellationToken);
            }
            finally
            {
                _input.Tapped -= OnTap;
                _sequenceRoot.SetActive(false);
            }
            return locked;
        }

        // Um golpe do Combo: o círculo de tempo do QteController.
        public Awaitable<bool> ComboStrike(int index, int total) =>
            _qte.AttackTiming($"GOLPE {index + 1}/{total}", _database.balance.qteSeconds);
    }
}
```

**Montar:** no Canvas, objeto `Minigames` com **Add Component → Minigame Panel**. Filhos:
- `ChargeRoot`: fundo escuro no centro da tela com `ChargeFill` (**UI → Image**, **Filled**, **Horizontal**, laranja, `700 × 60`) e `ChargeText` acima.
- `SequenceRoot`: uma barra `SequenceBar` (`800 × 60`, **Pivot** central) com três filhos **UI → Image** ancorados por porcentagem da largura: cinza de 0% a 60%, laranja de 60% a 90%, vermelho de 90% a 100% (use **Anchor Min/Max X** = `0/0.6`, `0.6/0.9`, `0.9/1`, com **Left/Right** `0`). `SequenceCursor` é uma **UI → Image** branca fina (`12 × 90`) filha da barra, ancorada no centro. `SequenceText` acima da barra.

Ligue Input, Qte, Database e os campos dos dois painéis. **A troca:** em **Warrior Turn**, mude **Minigames** de `AutoPlayer` para `Minigames`.

### 🧪 Teste rápido
Com **Skill Level** `20` no `BattleTestStarter`:
- **Fúria** com 5 pontos (use a **Poção de Adrenalina**): a barra de carga aparece; martele a tela. Cheia, "CRÍTICO GARANTIDO!" e um número vermelho enorme em todos os monstros.
- **Sequência Mortal:** o cursor anda devagar na zona cinza e dispara na vermelha. Sem tocar em 3 idas e voltas, "O ATAQUE FALHOU!" e o herói perde a vez seguinte mesmo assim.
- **Combo:** um círculo vermelho por golpe; toque tarde para conectar.

### Etapa 5B — A pedrada

```csharp
// Caminho: Assets/_Project/Scripts/Battle/RockThrower.cs
using System;
using GuerreiroDaMasmorra.Combat;
using UnityEngine;
using UnityEngine.InputSystem;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: a pedrada (Parte 1 §6): ação grátis, 1 por rodada (mais com a
    // Gema do Arremesso), arrastando do herói até um monstro.
    // ESTRATÉGIA: só funciona entre Begin e End (o turno do herói, enquanto
    // ele escolhe o comando). Pressionar em cima do herói começa a mira;
    // soltar longe dele arremessa no ponto. A pedra voa 0,28 s; se acertar,
    // quebra 1 escudo ou causa 20% do ATK. Se matar o último monstro, avisa
    // o turno para encerrar.
    public class RockThrower : MonoBehaviour, IFreeAction
    {
        [SerializeField] private BattleStage _stage;
        [SerializeField] private LineRenderer _aim;
        [SerializeField] private Transform _rockPrefab;

        private BattleContext _context;
        private Action _onWaveCleared;
        private bool _aiming;

        public void Begin(BattleContext context, Action onWaveCleared)
        {
            _context = context;
            _onWaveCleared = onWaveCleared;
        }

        public void End()
        {
            _context = null;
            _aiming = false;
            _aim.enabled = false;
        }

        // Mira e arremesso a cada quadro.
        private void Update()
        {
            if (_context == null) return;
            var pointer = Pointer.current;
            if (pointer == null) return;
            Vector2 screen = pointer.position.ReadValue();

            if (pointer.press.wasPressedThisFrame && _context.Hero.RocksLeft > 0 && _stage.IsHeroAt(screen))
                _aiming = true;
            if (!_aiming) return;

            Vector3 from = HeroCenter();
            Vector3 to = _stage.ScreenToWorld(screen);
            _aim.enabled = true;
            _aim.SetPosition(0, from);
            _aim.SetPosition(1, to);

            if (pointer.press.wasReleasedThisFrame)
            {
                _aiming = false;
                _aim.enabled = false;
                if (Vector3.Distance(from, to) > _stage.HeroView.Height * 0.6f) _ = Throw(_context, screen, from, to);
            }
        }

        // Arremessa, espera o voo e aplica o efeito.
        private async Awaitable Throw(BattleContext ctx, Vector2 screen, Vector3 from, Vector3 to)
        {
            ctx.Hero.RocksLeft--;
            var target = _stage.MonsterAt(screen);
            var rock = Instantiate(_rockPrefab, from, Quaternion.identity);
            for (float t = 0f; t < 0.28f; t += Time.deltaTime)
            {
                rock.position = Vector3.Lerp(from, to, t / 0.28f) + Vector3.up * Mathf.Sin(t / 0.28f * Mathf.PI) * 0.6f;
                await Awaitable.NextFrameAsync(destroyCancellationToken);
            }
            Destroy(rock.gameObject);

            if (target == null || target.Dead)
            {
                ctx.Log("A pedra passou longe...");
                return;
            }
            _stage.ViewOf(target)?.Flash();
            if (target.Shield > 0)
            {
                target.Shield--;
                _stage.Float(target, "ESCUDO -1", BattleStage.Blue);
                ctx.Log($"A pedrada quebrou um escudo de {target.Name}! Restam {target.Shield}.");
                return;
            }
            int damage = CombatMath.Rock(ctx.Hero.Attack);
            target.TakeDamage(damage);
            _stage.Float(target, damage.ToString(), BattleStage.White);
            ctx.Log($"Pedrada certeira em {target.Name}! {damage} de dano.");
            if (target.Hp <= 0)
            {
                ctx.Slay(target);
                if (ctx.WaveCleared) _onWaveCleared?.Invoke();
            }
        }

        // Ponto de onde a pedra sai: o meio do herói.
        private Vector3 HeroCenter() => _stage.HeroView.transform.position + Vector3.up * (_stage.HeroView.Height * 0.5f);
    }
}
```

**Montar:**
1. **Prefab `Rock`:** arraste o sprite `Circle` para a cena, **Scale** `(0.3, 0.3, 1)`, **Color** cinza, **Order in Layer** `60`. Para `Prefabs/` e apague.
2. Em `[Systems]`, objeto `RockThrower` com **Add Component → Rock Thrower** e **Add Component → Line Renderer** (**Width** `0.08`, **Positions** `2`, material `Sprites-Default`, cor branca translúcida, **Sorting Order** `60`; desmarque o componente para nascer desligado).
3. Ligue Stage, **Aim** (o Line Renderer) e **Rock Prefab**. Em **Warrior Turn**, **Free Action** = `RockThrower`.

### 🧪 Teste rápido
No turno do herói, pressione em cima do herói e arraste até um monstro: a linha de mira aparece; solte. A pedra voa em arco e tira um número pequeno (20% do ATK). Tente de novo na mesma rodada: nada acontece (1 por rodada). Mate o último monstro de uma onda só com pedradas: o turno termina sozinho e a próxima onda entra.

### ✅ Checkpoint da Fase 5
- O AutoPlayer não é mais usado por nenhum script (pode desativar o objeto).
- Os três minijogos e a pedrada funcionam com dedo, mouse e teclado (Espaço = toque).
- Commit: `feat: especiais e pedrada`.

#### Problemas comuns
- **A pedrada também troca o alvo:** confira se o `TargetSelector` ignora toques que começam no herói (`IsHeroAt`); o collider do herói precisa cobrir o corpo dele.
- **O cursor da barra oscilante sai da barra:** o **Pivot** da `SequenceBar` precisa ser central e o cursor ancorado no centro dela.

---

# Parte 9 — Implementação Unity: Fase 6 (Fim de masmorra)

## Fase 6 — Fim de masmorra

> Objetivo desta fase: tudo o que acontece quando a masmorra termina (Parte 1 §9): bônus de vitória, run perfeita, Souls, Pergaminho de Gema, vídeo para dobrar o bônus, fim de jogo e NG+, derrota com perda de metade do ouro e reviver com Soul.

**Conceitos novos:**
- **Painel modal com `AwaitableCompletionSource`:** o painel de derrota "pergunta" algo ao jogador (reviver?) e o combate espera a resposta com `await`, exatamente como o menu de comandos.
- **Serviço trocável por interface (`IAdsService`):** o vídeo premiado é simulado agora; na Fase 9 entra o provedor real, sem mexer em quem pede o vídeo.

### Etapa 6A — Recompensas

```csharp
// Caminho: Assets/_Project/Scripts/Combat/DungeonRewards.cs
using System;
using System.Collections.Generic;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Combat
{
    // POR QUE: o que uma vitória rende (Parte 1 §9).
    public readonly struct VictoryReward
    {
        public readonly int Bonus;
        public readonly int Souls;
        public readonly bool HasScroll;
        public readonly GemId Scroll;
        public readonly bool GameComplete;

        public VictoryReward(int bonus, int souls, bool hasScroll, GemId scroll, bool gameComplete)
        {
            Bonus = bonus;
            Souls = souls;
            HasScroll = hasScroll;
            Scroll = scroll;
            GameComplete = gameComplete;
        }
    }

    // POR QUE: as regras de fim de masmorra num lugar testável.
    // ESTRATÉGIA: run perfeita dobra bônus e Souls; o pergaminho é a primeira
    // gema da ordem que o herói ainda não tem; a masmorra 33 fecha o jogo.
    public static class DungeonRewards
    {
        // Recompensa de uma vitória.
        public static VictoryReward Victory(int level, int ngPlus, bool flawless, ICollection<GemId> gemsUnlocked, GameBalance b)
        {
            int bonus = DungeonMath.VictoryBonus(level, ngPlus, b) * (flawless ? 2 : 1);
            int souls = flawless ? 2 : 1;
            bool hasScroll = false;
            var scroll = GemId.Stone;
            if (DungeonMath.DropsGemScroll(level))
            {
                foreach (GemId gem in Enum.GetValues(typeof(GemId)))
                {
                    if (gemsUnlocked.Contains(gem)) continue;
                    hasScroll = true;
                    scroll = gem;
                    break;
                }
            }
            return new VictoryReward(bonus, souls, hasScroll, scroll, level >= b.dungeonCap);
        }

        // Ouro perdido ao cair: metade do coletado nesta masmorra.
        public static int DefeatPenalty(int runGold) => runGold / 2;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Services/Ads.cs
using UnityEngine;

namespace GuerreiroDaMasmorra.Services
{
    // POR QUE: os anúncios da Parte 1 §15 (vídeo premiado e intersticial)
    // atrás de uma interface, para trocar de provedor sem mexer no jogo.
    public interface IAdsService
    {
        // Mostra um vídeo premiado; true se o jogador assistiu até o fim.
        Awaitable<bool> ShowRewarded();

        // Mostra um intersticial (ignora falhas).
        Awaitable ShowInterstitial();
    }

    // POR QUE: o ponto único de acesso ao serviço de anúncios.
    // ESTRATÉGIA: começa com o simulado; a Fase 9 troca `Current` no início do jogo.
    public static class Ads
    {
        public static IAdsService Current { get; set; } = new SimulatedAds();
    }

    // POR QUE: anúncios de mentira para o Editor e para os testes.
    public sealed class SimulatedAds : IAdsService
    {
        public async Awaitable<bool> ShowRewarded()
        {
            Debug.Log("[Ads] vídeo premiado simulado");
            await Awaitable.WaitForSecondsAsync(1f);
            return true;
        }

        public async Awaitable ShowInterstitial()
        {
            Debug.Log("[Ads] intersticial simulado");
            await Awaitable.WaitForSecondsAsync(0.5f);
        }
    }
}
```

O script fica na pasta `Scripts/Services/`, criada na Fase 0.

### Etapa 6B — O painel de resultado

```csharp
// Caminho: Assets/_Project/Scripts/Battle/ResultPanel.cs
using System;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using GuerreiroDaMasmorra.Services;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: o que o acampamento precisa aplicar ao save depois de uma masmorra.
    public sealed class DungeonOutcome
    {
        public BattleEnd End;
        public VictoryReward Reward;
        public int GoldKept;
        public bool BonusDoubled;
        public bool StartNgPlus;
    }

    // POR QUE: a tela de fim de masmorra (Parte 1 §9) e a pergunta "usar uma
    // Soul?" quando o herói cai.
    // ESTRATÉGIA: como IDeathHandler, mostra a derrota com o botão de Soul e
    // espera a escolha. Quando o controlador avisa o fim (Ended), calcula as
    // recompensas, oferece o vídeo para dobrar e o NG+, e ao fechar entrega
    // um DungeonOutcome. Sem ninguém escutando (cena aberta direto), recarrega
    // a cena para testar de novo.
    public class ResultPanel : MonoBehaviour, IDeathHandler
    {
        [SerializeField] private BattleController _controller;
        [SerializeField] private GameDatabase _database;
        [SerializeField] private GameObject _root;
        [SerializeField] private TMP_Text _title;
        [SerializeField] private TMP_Text _body;
        [SerializeField] private Button _continue;
        [SerializeField] private Button _revive;
        [SerializeField] private Button _double;
        [SerializeField] private Button _ngPlus;

        // Disparado ao fechar o painel de fim.
        public event Action<DungeonOutcome> Closed;

        private DungeonOutcome _outcome;

        // Escuta o fim da masmorra e começa escondido.
        private void Awake()
        {
            _controller.Ended += OnEnded;
            _root.SetActive(false);
        }

        // Herói caído com Soul disponível: reviver ou desistir?
        public async Awaitable<bool> OfferRevive(BattleContext ctx)
        {
            var choice = new AwaitableCompletionSource<bool>();
            Show("DERROTA...",
                $"O herói caiu na onda {ctx.Wave}.\nVocê tem {ctx.SoulsAvailable} Soul(s): use uma para se reerguer de onde parou!",
                revive: true, doubleBonus: false, ngPlus: false);
            _revive.onClick.AddListener(() => choice.TrySetResult(true));
            _continue.onClick.AddListener(() => choice.TrySetResult(false));
            bool revive = await choice.Awaitable;
            _root.SetActive(false);
            return revive;
        }

        // A masmorra acabou: calcula e mostra o resultado.
        private void OnEnded(BattleEnd end)
        {
            var b = _database.balance;
            var request = end.Request;
            _outcome = new DungeonOutcome { End = end, GoldKept = end.RunGold };

            // Duelo de recrutamento (Fase 10): sem bônus e sem perda de ouro.
            if (!string.IsNullOrEmpty(request.DuelHeroId))
            {
                bool won = end.Kind == DungeonOutcomeKind.Victory;
                Show(won ? "DUELO VENCIDO!" : "DERROTA NO DUELO...",
                    won ? "Você provou seu valor! Vá ao menu Recrutar para trazer o herói para a equipe."
                        : "O herói desafiado foi forte demais desta vez. Fortaleça-se e volte!",
                    revive: false, doubleBonus: false, ngPlus: false);
                _continue.onClick.AddListener(Close);
                return;
            }

            switch (end.Kind)
            {
                case DungeonOutcomeKind.Victory:
                    var reward = DungeonRewards.Victory(request.Level, request.NgPlus, end.Flawless, request.GemsUnlocked, b);
                    _outcome.Reward = reward;
                    string text = $"As 3 ondas caíram! Bônus de vitória: {reward.Bonus} de ouro.\n" +
                                  (end.Flawless ? "PERFEITO: nenhum dano sofrido! Ouro e Souls em dobro!\n" : "") +
                                  $"O chefe deixou {reward.Souls} Soul(s).\n" +
                                  (reward.HasScroll ? $"Pergaminho de Gema: {_database.Gem(reward.Scroll).displayName} liberada no Mercado!\n" : "") +
                                  $"Ouro coletado: {end.RunGold}.";
                    Show(reward.GameComplete ? "VOCÊ VENCEU O JOGO!" : "MASMORRA CONQUISTADA!", text,
                        revive: false, doubleBonus: true, ngPlus: reward.GameComplete);
                    break;

                case DungeonOutcomeKind.Defeat:
                    int lost = DungeonRewards.DefeatPenalty(end.RunGold);
                    _outcome.GoldKept = end.RunGold - lost;
                    Show("DERROTA...",
                        $"O herói caiu na onda {end.Wave}.\nA queda custou metade do ouro desta masmorra: -{lost}.\nFortaleça-se e tente de novo!",
                        revive: false, doubleBonus: false, ngPlus: false);
                    break;

                default:
                    Show("FUGA!", $"Você usou um mapa e escapou pelo túnel secreto.\nTodo o ouro coletado foi mantido: {end.RunGold}.",
                        revive: false, doubleBonus: false, ngPlus: false);
                    break;
            }

            _continue.onClick.AddListener(Close);
            _double.onClick.AddListener(DoubleBonus);
            _ngPlus.onClick.AddListener(() =>
            {
                _outcome.StartNgPlus = true;
                Close();
            });
        }

        // Vídeo premiado: dobra o bônus de vitória.
        private async void DoubleBonus()
        {
            _double.interactable = false;
            if (await Ads.Current.ShowRewarded())
            {
                _outcome.BonusDoubled = true;
                _double.gameObject.SetActive(false);
                _body.text += $"\nBônus dobrado: +{_outcome.Reward.Bonus} de ouro!";
            }
            else
            {
                _double.interactable = true;
            }
        }

        // Fecha e entrega o resultado (ou recarrega a cena, se ninguém escuta).
        private void Close()
        {
            _root.SetActive(false);
            if (Closed != null) Closed.Invoke(_outcome);
            else SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        }

        // Mostra o painel com os botões pedidos e sem ouvintes antigos.
        private void Show(string title, string body, bool revive, bool doubleBonus, bool ngPlus)
        {
            foreach (var button in new[] { _continue, _revive, _double, _ngPlus })
            {
                button.onClick.RemoveAllListeners();
                button.interactable = true;
            }
            _title.text = title;
            _body.text = body;
            _revive.gameObject.SetActive(revive);
            _double.gameObject.SetActive(doubleBonus);
            _ngPlus.gameObject.SetActive(ngPlus);
            _root.SetActive(true);
        }
    }
}
```

**Montar:** no Canvas (por último na Hierarchy, para ficar por cima), objeto `Results` com **Add Component → Result Panel**. Filho `Root`: fundo escuro de tela inteira com um cartão central contendo `Title` (texto `56`), `Body` (texto `34`, várias linhas) e quatro botões (**UI → Button - TextMeshPro**): `Continue` ("CONTINUAR"), `Revive` ("USAR 1 SOUL E CONTINUAR"), `Double` ("ASSISTIR VÍDEO E DOBRAR O BÔNUS") e `NgPlus` ("INICIAR NG+"). Ligue tudo, inclusive **Controller** e **Database**. No **Battle Controller**, **Death Handler** = `Results`.

### 🧪 Teste rápido
- **Derrota com Soul:** **Souls** `1` no `BattleTestStarter`, deixe o herói morrer. O painel oferece a Soul; aceite: o herói volta com a vida cheia, na mesma onda, e os monstros continuam feridos. Morra de novo: sem Soul, aparece a derrota com a perda de metade do ouro.
- **Vitória:** com **Level** `1`, vença: bônus de 150 (300 se não levou dano), 1 Soul e o pergaminho da **Gema do Arremesso**. **Dobrar** chama o vídeo simulado (veja o Console) e soma o bônus de novo.
- **Fim de jogo:** **Level** `33` e **Bonus Attack** alto: "VOCÊ VENCEU O JOGO!" com o botão de NG+.
- **Fuga:** segure FUGIR: "FUGA!" com o ouro mantido.

### ✅ Checkpoint da Fase 6
- Os quatro desfechos (vitória, derrota, reviver, fuga) aparecem e fecham recarregando a cena.
- Commit: `feat: fim de masmorra`.

#### Problemas comuns
- **O painel não aparece no fim:** **Controller** não ligado no `ResultPanel`, ou o `Results` está desativado na cena (ele precisa estar ativo para o `Awake` rodar; quem começa desligado é o filho `Root`).
- **Botão executa a ação duas vezes:** ouvintes acumulados; o `Show` remove todos antes de mostrar. Não adicione ouvintes pelo Inspector (**On Click ()** vazio).

Próxima fase: **o acampamento**, com save e o fluxo completo.

---

# Parte 10 — Implementação Unity: Fase 7 (Acampamento, mercado e save)

## Fase 7 — Acampamento, mercado e save

> Objetivo desta fase: o loop inteiro da Parte 1 §2. A cena `Camp` mostra o herói, compra atributos e Habilidade, recarrega Tochas em tempo real, abre o Baú do Dia e o Mercado (Tochas e Mapas por Soul, gemas). Entrar na masmorra carrega a cena `Battle`; ao fim dela, o resultado é aplicado ao save e o jogo volta ao acampamento.

**Conceitos novos:**
- **`SceneManager.LoadScene`:** troca de cena. Tudo da cena antiga é destruído, exceto objetos marcados com `DontDestroyOnLoad`.
- **Singleton com `DontDestroyOnLoad`:** o `GameSession` existe uma vez só e sobrevive à troca de cena, levando o save e o pedido de masmorra. Se a cena `Camp` for carregada de novo, a cópia nova se destrói e a antiga continua.
- **`JsonUtility` e `PlayerPrefs`:** o save vira texto JSON guardado na chave `gdm.save.v1`. O `JsonUtility` não salva `Dictionary` nem campos `null` de tipos simples; por isso o save usa listas e um booleano "tem gema equipada".
- **`DateTime.UtcNow`:** o relógio real, usado para recarregar Tochas mesmo com o jogo fechado. Usar UTC evita saltos com fuso horário e horário de verão.

### Etapa 7A — Save e regras do acampamento

```csharp
// Caminho: Assets/_Project/Scripts/Meta/SaveData.cs
using System;
using System.Collections.Generic;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Meta
{
    // POR QUE: o nível de uma gema comprada.
    [Serializable]
    public class GemLevel
    {
        public GemId gem;
        public int level;
    }

    // POR QUE: a progressão própria de cada herói (Parte 1 §3 e §10).
    [Serializable]
    public class HeroProgress
    {
        public string heroId;
        public bool unlocked;
        public bool wonDuel;
        public int maxHp;
        public int attack;
        public int defense;
        public int lvHealth;
        public int lvAttack;
        public int lvDefense;
        public int lvSkill;
        public List<GemId> gemsUnlocked = new List<GemId>();
        public List<GemLevel> gemLevels = new List<GemLevel>();
        public bool hasEquippedGem;
        public GemId equippedGem;
    }

    // POR QUE: tudo o que o jogo guarda (Parte 1 §15).
    // ESTRATÉGIA: só campos serializáveis pelo JsonUtility. `version`
    // permite migrar saves antigos no futuro.
    [Serializable]
    public class SaveData
    {
        public int version = 1;
        public int gold;
        public int souls;
        public int torches;
        public long torchTimerTicks;
        public int maps;
        public int dungeonLevel = 1;
        public DungeonColor dungeonColor;
        public int ngPlus;
        public int wins;
        public int entries;
        public bool tutorialDone;
        public string chestDay = "";
        public string activeHero = "warrior";
        public int mapPosition = -1;
        public List<HeroProgress> heroes = new List<HeroProgress>();
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/MetaRules.cs
using System;
using GuerreiroDaMasmorra.Battle;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Meta
{
    public enum Stat
    {
        Health,
        Attack,
        Defense,
        Skill,
    }

    // POR QUE: as regras do acampamento e do mercado (Parte 1 §10) e a
    // aplicação do resultado de uma masmorra ao save (§9).
    // ESTRATÉGIA: funções sobre o SaveData; as compras devolvem false quando
    // não podem acontecer (a tela desabilita o botão). Nada aqui toca em cena,
    // então tudo é testável (Fase 8).
    public static class MetaRules
    {
        private static readonly int[] StatBaseCost = { 50, 60, 60, 40 };

        // Um jogo novo: recursos iniciais e cada herói no seu ponto de partida.
        public static SaveData NewGame(GameDatabase db, IRandom rng)
        {
            var b = db.balance;
            var save = new SaveData
            {
                gold = b.startGold,
                torches = b.startTorches,
                maps = b.startMaps,
                dungeonColor = RandomColor(rng),
            };
            foreach (var hero in db.heroes) save.heroes.Add(NewProgress(hero));
            return save;
        }

        // A progressão inicial de um herói.
        public static HeroProgress NewProgress(HeroDefinition hero) => new HeroProgress
        {
            heroId = hero.id,
            unlocked = hero.recruitCity < 0,
            maxHp = hero.maxHp,
            attack = hero.attack,
            defense = hero.defense,
        };

        // A progressão de um herói pelo id.
        public static HeroProgress Progress(SaveData save, string heroId) => save.heroes.Find(h => h.heroId == heroId);

        // Quantas compras de um atributo já foram feitas.
        public static int Purchases(HeroProgress hero, Stat stat) => stat switch
        {
            Stat.Health => hero.lvHealth,
            Stat.Attack => hero.lvAttack,
            Stat.Defense => hero.lvDefense,
            _ => hero.lvSkill,
        };

        // Preço da próxima compra: base × 1,55^compras.
        public static int UpgradeCost(Stat stat, int purchases, GameBalance b) =>
            MathUtil.RoundHalfUp(StatBaseCost[(int)stat] * Math.Pow(b.upgradeGrowth, purchases));

        // Compra um ponto de atributo.
        public static bool TryUpgrade(SaveData save, HeroProgress hero, Stat stat, GameBalance b)
        {
            int cost = UpgradeCost(stat, Purchases(hero, stat), b);
            if (save.gold < cost) return false;
            save.gold -= cost;
            switch (stat)
            {
                case Stat.Health: hero.maxHp += 20; hero.lvHealth++; break;
                case Stat.Attack: hero.attack += 3; hero.lvAttack++; break;
                case Stat.Defense: hero.defense += 2; hero.lvDefense++; break;
                default: hero.lvSkill++; break;
            }
            return true;
        }

        // Recarrega Tochas pelo tempo real decorrido (1 a cada N minutos, até o teto).
        public static void RegenTorches(SaveData save, DateTime nowUtc, GameBalance b)
        {
            if (save.torches >= b.torchMax)
            {
                save.torchTimerTicks = 0;
                return;
            }
            long period = TimeSpan.FromMinutes(b.torchRegenMinutes).Ticks;
            if (save.torchTimerTicks == 0) save.torchTimerTicks = nowUtc.Ticks;
            while (save.torches < b.torchMax && nowUtc.Ticks - save.torchTimerTicks >= period)
            {
                save.torches++;
                save.torchTimerTicks += period;
            }
            if (save.torches >= b.torchMax) save.torchTimerTicks = 0;
        }

        // Gasta uma Tocha para entrar; o relógio de recarga começa ao cair do teto.
        public static bool TrySpendTorch(SaveData save, DateTime nowUtc, GameBalance b)
        {
            RegenTorches(save, nowUtc, b);
            if (save.torches <= 0) return false;
            if (save.torchTimerTicks == 0) save.torchTimerTicks = nowUtc.Ticks;
            save.torches--;
            return true;
        }

        // Quanto falta para a próxima Tocha (null se estiver no teto).
        public static TimeSpan? NextTorchIn(SaveData save, DateTime nowUtc, GameBalance b)
        {
            if (save.torches >= b.torchMax || save.torchTimerTicks == 0) return null;
            long left = save.torchTimerTicks + TimeSpan.FromMinutes(b.torchRegenMinutes).Ticks - nowUtc.Ticks;
            return TimeSpan.FromTicks(Math.Max(0, left));
        }

        // Compra uma Tocha (true) ou um Mapa (false) com 1 Soul.
        public static bool TryBuyWithSoul(SaveData save, bool torch, GameBalance b)
        {
            if (save.souls < 1 || (torch && save.torches >= b.torchMax)) return false;
            save.souls--;
            if (!torch)
            {
                save.maps++;
                return true;
            }
            save.torches++;
            if (save.torches >= b.torchMax) save.torchTimerTicks = 0;
            return true;
        }

        // Nível de uma gema (0 = não comprada).
        public static int GemLevelOf(HeroProgress hero, GemId gem)
        {
            var entry = hero.gemLevels.Find(g => g.gem == gem);
            return entry == null ? 0 : entry.level;
        }

        // Valor do efeito da gema no nível (o que a loja mostra em "{0}").
        public static string GemEffectValue(GemId gem, int level) => gem switch
        {
            GemId.Stone => (1 + level).ToString(),
            GemId.Vital => (3 + 2 * level).ToString(),
            GemId.Echo => (37.5 + 12.5 * level).ToString("0.#"),
            _ => (30 + 10 * level).ToString(),
        };

        // Preço para evoluir do nível atual para o próximo.
        public static int GemUpgradeCost(int level, GameBalance b) =>
            (int)(b.gemUpgradeBase * Math.Pow(b.gemUpgradeGrowth, level - 1));

        // Compra a gema no Nv.1 (precisa do pergaminho).
        public static bool TryBuyGem(SaveData save, HeroProgress hero, GemDefinition gem)
        {
            if (!hero.gemsUnlocked.Contains(gem.id) || GemLevelOf(hero, gem.id) > 0 || save.gold < gem.buyCost) return false;
            save.gold -= gem.buyCost;
            hero.gemLevels.Add(new GemLevel { gem = gem.id, level = 1 });
            return true;
        }

        // Evolui a gema um nível.
        public static bool TryUpgradeGem(SaveData save, HeroProgress hero, GemId gem, GameBalance b)
        {
            int level = GemLevelOf(hero, gem);
            if (level == 0 || level >= b.gemMaxLevel) return false;
            int cost = GemUpgradeCost(level, b);
            if (save.gold < cost) return false;
            save.gold -= cost;
            hero.gemLevels.Find(g => g.gem == gem).level++;
            return true;
        }

        // Equipa uma gema comprada (só uma por vez).
        public static bool Equip(HeroProgress hero, GemId gem)
        {
            if (GemLevelOf(hero, gem) == 0) return false;
            hero.hasEquippedGem = true;
            hero.equippedGem = gem;
            return true;
        }

        // O Baú do Dia ainda não foi aberto hoje?
        public static bool CanOpenChest(SaveData save, string today) => save.chestDay != today;

        // Abre o baú: credita o ouro e marca o dia. Devolve o ouro ganho.
        public static int OpenChest(SaveData save, string today, GameBalance b)
        {
            int gold = DungeonMath.ChestReward(save.dungeonLevel, save.ngPlus, b);
            save.gold += gold;
            save.chestDay = today;
            return gold;
        }

        // O que o herói leva para a masmorra.
        public static HeroLoadout Loadout(GameDatabase db, HeroProgress hero) => new HeroLoadout
        {
            Hero = db.Hero(hero.heroId),
            MaxHp = hero.maxHp,
            Attack = hero.attack,
            Defense = hero.defense,
            DefensePurchases = hero.lvDefense,
            SkillLevel = hero.lvSkill,
            HasGem = hero.hasEquippedGem,
            Gem = hero.equippedGem,
            GemLevelValue = hero.hasEquippedGem ? GemLevelOf(hero, hero.equippedGem) : 0,
        };

        // Aplica o fim de uma masmorra ao save (Parte 1 §9).
        public static void ApplyOutcome(SaveData save, HeroProgress hero, DungeonOutcome outcome, GameBalance b, IRandom rng)
        {
            var end = outcome.End;
            save.gold += outcome.GoldKept;
            save.souls = Math.Max(0, save.souls - end.SoulsUsed);
            save.maps = Math.Max(0, save.maps - end.MapsUsed);

            // Duelo de recrutamento (Fase 10): vencer só marca o duelo.
            if (!string.IsNullOrEmpty(end.Request.DuelHeroId))
            {
                if (end.Kind == DungeonOutcomeKind.Victory) Progress(save, end.Request.DuelHeroId).wonDuel = true;
                return;
            }
            if (end.Kind != DungeonOutcomeKind.Victory) return;

            var reward = outcome.Reward;
            save.gold += reward.Bonus * (outcome.BonusDoubled ? 2 : 1);
            save.souls += reward.Souls;
            save.wins++;
            if (reward.HasScroll && !hero.gemsUnlocked.Contains(reward.Scroll)) hero.gemsUnlocked.Add(reward.Scroll);

            if (!reward.GameComplete)
            {
                save.dungeonLevel++;
                save.dungeonColor = RandomColor(rng);
            }
            else if (outcome.StartNgPlus)
            {
                save.ngPlus++;
                save.dungeonLevel = 1;
                save.mapPosition = -1;
                save.dungeonColor = RandomColor(rng);
            }
        }

        // Sorteia a cor da próxima masmorra.
        private static DungeonColor RandomColor(IRandom rng) =>
            (DungeonColor)rng.Range(0, Enum.GetValues(typeof(DungeonColor)).Length - 1);
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/SaveService.cs
using System;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Meta
{
    // POR QUE: guardar o SaveData entre sessões, no Android e no navegador.
    // ESTRATÉGIA: JSON numa chave de PlayerPrefs. Save ausente ou ilegível
    // vira jogo novo. Ao carregar, heróis que não existiam numa versão
    // antiga do save são acrescentados (migração defensiva).
    public static class SaveService
    {
        private const string Key = "gdm.save.v1";

        // Lê o save ou cria um jogo novo.
        public static SaveData Load(GameDatabase db)
        {
            SaveData save = null;
            try
            {
                if (PlayerPrefs.HasKey(Key)) save = JsonUtility.FromJson<SaveData>(PlayerPrefs.GetString(Key));
            }
            catch (Exception e)
            {
                Debug.LogWarning($"Save ilegível, começando jogo novo: {e.Message}");
            }
            if (save == null || save.heroes == null) return MetaRules.NewGame(db, new SystemRandom());

            foreach (var hero in db.heroes)
                if (MetaRules.Progress(save, hero.id) == null) save.heroes.Add(MetaRules.NewProgress(hero));
            return save;
        }

        // Grava o save. Falha ao gravar não interrompe o jogo.
        public static void Save(SaveData save)
        {
            try
            {
                PlayerPrefs.SetString(Key, JsonUtility.ToJson(save));
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogWarning($"Save falhou: {e.Message}");
            }
        }
    }
}
```

### Etapa 7B — Sessão e troca de cenas

```csharp
// Caminho: Assets/_Project/Scripts/Meta/GameSession.cs
using System;
using System.Collections.Generic;
using GuerreiroDaMasmorra.Battle;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using GuerreiroDaMasmorra.Services;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace GuerreiroDaMasmorra.Meta
{
    // POR QUE: o dono do save e da ponte entre as cenas Camp e Battle.
    // ESTRATÉGIA: singleton que sobrevive à troca de cena. EnterDungeon gasta
    // a Tocha, monta o DungeonRequest a partir do save e carrega a Battle;
    // FinishDungeon aplica o resultado, salva e volta ao Camp. A cada 5
    // entradas, um intersticial (Parte 1 §15).
    public class GameSession : MonoBehaviour
    {
        public static GameSession Instance { get; private set; }

        [SerializeField] private GameDatabase _database;

        private readonly IRandom _rng = new SystemRandom();

        public GameDatabase Database => _database;
        public SaveData Save { get; private set; }
        public DungeonRequest PendingRequest { get; private set; }
        public HeroProgress ActiveHero => MetaRules.Progress(Save, Save.activeHero);

        // Garante uma única sessão e carrega o save.
        private void Awake()
        {
            if (Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Save = SaveService.Load(_database);
        }

        // Grava o save.
        public void Persist() => SaveService.Save(Save);

        // Entra na masmorra atual com o herói ativo.
        public async void EnterDungeon()
        {
            var b = _database.balance;
            if (!MetaRules.TrySpendTorch(Save, DateTime.UtcNow, b)) return;
            Save.entries++;
            Persist();
            if (Save.entries % b.interstitialEvery == 0) await Ads.Current.ShowInterstitial();

            var hero = ActiveHero;
            PendingRequest = new DungeonRequest
            {
                Loadout = MetaRules.Loadout(_database, hero),
                Level = Save.dungeonLevel,
                NgPlus = Save.ngPlus,
                Color = Save.dungeonColor,
                Souls = Save.souls,
                Maps = Save.maps,
                GemsUnlocked = new List<GemId>(hero.gemsUnlocked),
            };
            SceneManager.LoadScene("Battle");
        }

        // Aplica o fim da masmorra e volta ao acampamento.
        public void FinishDungeon(DungeonOutcome outcome)
        {
            MetaRules.ApplyOutcome(Save, ActiveHero, outcome, _database.balance, _rng);
            Persist();
            PendingRequest = null;
            SceneManager.LoadScene("Camp");
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/BattleBootstrap.cs
using GuerreiroDaMasmorra.Battle;
using UnityEngine;

namespace GuerreiroDaMasmorra.Meta
{
    // POR QUE: na cena Battle, decide quem começa a masmorra: o pedido vindo
    // do acampamento, ou o BattleTestStarter quando a cena é aberta direto.
    // ESTRATÉGIA: no Awake (antes de qualquer Start), se há sessão com
    // pedido, desliga o starter de teste e liga o fim da masmorra à sessão.
    public class BattleBootstrap : MonoBehaviour
    {
        [SerializeField] private BattleController _controller;
        [SerializeField] private ResultPanel _results;
        [SerializeField] private GameObject _testStarter;

        private bool _fromCamp;

        private void Awake()
        {
            var session = GameSession.Instance;
            _fromCamp = session != null && session.PendingRequest != null;
            if (!_fromCamp) return;
            _testStarter.SetActive(false);
            _results.Closed += session.FinishDungeon;
        }

        private void Start()
        {
            if (_fromCamp) _controller.Begin(GameSession.Instance.PendingRequest);
        }
    }
}
```

**Na cena `Battle`:** em `[Systems]`, objeto `BattleBootstrap` com o componente; ligue **Controller**, **Results** e **Test Starter** (o objeto `BattleTestStarter`).

**Build Profiles:** **File → Build Profiles → Scene List**: adicione `Camp` (índice 0) e `Battle` (índice 1).

### Etapa 7C — As telas do acampamento

```csharp
// Caminho: Assets/_Project/Scripts/Meta/ChestPopup.cs
using GuerreiroDaMasmorra.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Meta
{
    // POR QUE: a animação de abertura do baú (Parte 1 §10.2): fechado,
    // tremendo, abrindo, aberto. O desenho cicla entre 12 modelos conforme o
    // nível de masmorra.
    // ESTRATÉGIA: um SpriteAnimation de 4 quadros por modelo; toca uma vez e
    // para no último.
    public class ChestPopup : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private Image _chest;
        [SerializeField] private TMP_Text _message;
        [SerializeField] private Button _close;
        [SerializeField] private SpriteAnimation[] _designs;

        private void Awake()
        {
            _root.SetActive(false);
            _close.onClick.AddListener(() => _root.SetActive(false));
        }

        // Mostra o baú abrindo e a mensagem.
        public async void Show(int dungeonLevel, string message)
        {
            _message.text = message;
            _root.SetActive(true);
            if (_designs == null || _designs.Length == 0) return;
            var design = _designs[(dungeonLevel - 1) % _designs.Length];
            foreach (var frame in design.frames)
            {
                _chest.sprite = frame;
                await Awaitable.WaitForSecondsAsync(0.25f, destroyCancellationToken);
            }
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/GemRow.cs
using System;
using GuerreiroDaMasmorra.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Meta
{
    // POR QUE: uma linha de gema no Mercado (Parte 1 §10.3): trancada,
    // à venda, evoluível, equipável.
    // ESTRATÉGIA: Bind reconfigura textos, botões e ouvintes a partir do save.
    public class GemRow : MonoBehaviour
    {
        [SerializeField] private TMP_Text _name;
        [SerializeField] private TMP_Text _description;
        [SerializeField] private Button _action;
        [SerializeField] private TMP_Text _actionLabel;
        [SerializeField] private Button _equip;
        [SerializeField] private TMP_Text _equipLabel;

        // Mostra a gema para o herói ativo; `changed` é chamado depois de qualquer compra.
        public void Bind(GemDefinition gem, HeroProgress hero, SaveData save, GameBalance b, Action changed)
        {
            _action.onClick.RemoveAllListeners();
            _equip.onClick.RemoveAllListeners();
            bool unlocked = hero.gemsUnlocked.Contains(gem.id);
            int level = MetaRules.GemLevelOf(hero, gem.id);

            _name.text = !unlocked ? "???" : level > 0 ? $"{gem.displayName} NV.{level}" : gem.displayName;
            _description.text = unlocked
                ? string.Format(gem.descriptionFormat, MetaRules.GemEffectValue(gem.id, Math.Max(1, level)))
                : "Derrote o chefe das masmorras 1, 5, 10 ou 15 para liberar.";

            _action.gameObject.SetActive(unlocked && level < b.gemMaxLevel);
            _equip.gameObject.SetActive(level > 0);
            if (!unlocked) return;

            if (level == 0)
            {
                _actionLabel.text = $"COMPRAR · {gem.buyCost}";
                _action.interactable = save.gold >= gem.buyCost;
                _action.onClick.AddListener(() => { if (MetaRules.TryBuyGem(save, hero, gem)) changed(); });
            }
            else
            {
                int cost = MetaRules.GemUpgradeCost(level, b);
                _actionLabel.text = $"NV.{level + 1} · {cost}";
                _action.interactable = save.gold >= cost;
                _action.onClick.AddListener(() => { if (MetaRules.TryUpgradeGem(save, hero, gem.id, b)) changed(); });
            }

            bool equipped = hero.hasEquippedGem && hero.equippedGem == gem.id;
            _equipLabel.text = equipped ? "EQUIPADA" : "EQUIPAR";
            _equip.interactable = !equipped;
            _equip.onClick.AddListener(() => { if (MetaRules.Equip(hero, gem.id)) changed(); });
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/MarketScreen.cs
using System;
using GuerreiroDaMasmorra.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Meta
{
    // POR QUE: o Mercado (Parte 1 §10.2 e §10.3): Tocha e Mapa por Soul, e as gemas.
    // ESTRATÉGIA: painel sobre o acampamento; toda compra salva e redesenha.
    public class MarketScreen : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private TMP_Text _resources;
        [SerializeField] private Button _buyTorch;
        [SerializeField] private Button _buyMap;
        [SerializeField] private Button _close;
        [SerializeField] private GemRow[] _gemRows = new GemRow[4];

        private Action _onClose;
        private GameSession Session => GameSession.Instance;
        private GameBalance Balance => Session.Database.balance;

        private void Awake()
        {
            _root.SetActive(false);
            _buyTorch.onClick.AddListener(() => BuyWithSoul(true));
            _buyMap.onClick.AddListener(() => BuyWithSoul(false));
            _close.onClick.AddListener(Close);
        }

        // Abre o Mercado; `onClose` atualiza o acampamento ao fechar.
        public void Open(Action onClose)
        {
            _onClose = onClose;
            _root.SetActive(true);
            Refresh();
        }

        private void Close()
        {
            _root.SetActive(false);
            _onClose?.Invoke();
        }

        // Tocha (true) ou Mapa (false) por 1 Soul.
        private void BuyWithSoul(bool torch)
        {
            if (MetaRules.TryBuyWithSoul(Session.Save, torch, Balance)) Session.Persist();
            Refresh();
        }

        // Redesenha recursos, botões e gemas.
        private void Refresh()
        {
            var save = Session.Save;
            _resources.text = $"OURO {save.gold}   SOULS {save.souls}   TOCHAS {save.torches}/{Balance.torchMax}   MAPAS {save.maps}";
            _buyTorch.interactable = save.souls >= 1 && save.torches < Balance.torchMax;
            _buyMap.interactable = save.souls >= 1;

            var gems = Session.Database.gems;
            for (int i = 0; i < _gemRows.Length && i < gems.Count; i++)
            {
                _gemRows[i].Bind(gems[i], Session.ActiveHero, save, Balance, () =>
                {
                    Session.Persist();
                    Refresh();
                });
            }
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/CampScreen.cs
using System;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using GuerreiroDaMasmorra.Services;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Meta
{
    // POR QUE: o acampamento (Parte 1 §10 e §14): herói, atributos,
    // recursos, Entrar na Masmorra, Mercado e Baú do Dia.
    // ESTRATÉGIA: a cada segundo recarrega Tochas pelo relógio real e
    // redesenha; cada botão chama uma regra do MetaRules e salva.
    public class CampScreen : MonoBehaviour
    {
        private static readonly string[] StatLabels = { "VIDA +20", "ATAQUE +3", "DEFESA +2", "HABILIDADE +1" };

        [SerializeField] private TMP_Text _heroName;
        [SerializeField] private TMP_Text _heroStats;
        [SerializeField] private TMP_Text _resources;
        [SerializeField] private TMP_Text _dungeon;
        [SerializeField] private TMP_Text _torchTimer;
        [SerializeField] private Button[] _upgradeButtons = new Button[4];
        [SerializeField] private TMP_Text[] _upgradeLabels = new TMP_Text[4];
        [SerializeField] private Button _enter;
        [SerializeField] private Button _market;
        [SerializeField] private Button _chest;
        [SerializeField] private TMP_Text _chestLabel;
        [SerializeField] private MarketScreen _marketScreen;
        [SerializeField] private ChestPopup _chestPopup;

        private GameSession Session => GameSession.Instance;
        private GameBalance Balance => Session.Database.balance;

        // Liga os botões e começa o relógio.
        private void Start()
        {
            for (int i = 0; i < _upgradeButtons.Length; i++)
            {
                var stat = (Stat)i;
                _upgradeButtons[i].onClick.AddListener(() => Buy(stat));
            }
            _enter.onClick.AddListener(Session.EnterDungeon);
            _market.onClick.AddListener(() => _marketScreen.Open(Refresh));
            _chest.onClick.AddListener(OpenChest);
            InvokeRepeating(nameof(Tick), 0f, 1f);
        }

        // Uma vez por segundo: Tochas pelo relógio e tela.
        private void Tick()
        {
            MetaRules.RegenTorches(Session.Save, DateTime.UtcNow, Balance);
            Refresh();
        }

        // Compra um ponto de atributo.
        private void Buy(Stat stat)
        {
            if (MetaRules.TryUpgrade(Session.Save, Session.ActiveHero, stat, Balance)) Session.Persist();
            Refresh();
        }

        // Baú do Dia: vídeo premiado, ouro e animação.
        private async void OpenChest()
        {
            var save = Session.Save;
            if (!MetaRules.CanOpenChest(save, Today())) return;
            _chest.interactable = false;
            if (await Ads.Current.ShowRewarded())
            {
                int gold = MetaRules.OpenChest(save, Today(), Balance);
                Session.Persist();
                _chestPopup.Show(save.dungeonLevel, $"O baú da Masmorra Nv. {save.dungeonLevel} continha {gold} de ouro!\nVolte amanhã para abrir outro.");
            }
            Refresh();
        }

        // Redesenha tudo a partir do save.
        private void Refresh()
        {
            var save = Session.Save;
            var hero = Session.ActiveHero;
            var definition = Session.Database.Hero(hero.heroId);

            _heroName.text = definition.displayName.ToUpperInvariant();
            _heroStats.text = $"HP {hero.maxHp}   ATK {hero.attack}   DEF {hero.defense}\n" +
                              $"HABILIDADE {hero.lvSkill} · {Mathf.Min(4, hero.lvSkill / Balance.skillStep)}/4 especiais";
            _resources.text = $"OURO {save.gold}   SOULS {save.souls}   TOCHAS {save.torches}/{Balance.torchMax}   MAPAS {save.maps}";
            _dungeon.text = $"MASMORRA NV. {save.dungeonLevel}{(save.ngPlus > 0 ? $" · NG+{save.ngPlus}" : "")} · " +
                            DungeonMath.ColorName(save.dungeonColor).ToUpperInvariant();

            var next = MetaRules.NextTorchIn(save, DateTime.UtcNow, Balance);
            _torchTimer.text = next.HasValue ? $"próxima tocha em {next.Value:mm\\:ss}" : "";

            for (int i = 0; i < _upgradeButtons.Length; i++)
            {
                var stat = (Stat)i;
                int cost = MetaRules.UpgradeCost(stat, MetaRules.Purchases(hero, stat), Balance);
                _upgradeLabels[i].text = $"{StatLabels[i]}\n{cost} ouro";
                _upgradeButtons[i].interactable = save.gold >= cost;
            }

            _enter.interactable = save.torches > 0;
            bool chestAvailable = MetaRules.CanOpenChest(save, Today());
            _chest.interactable = chestAvailable;
            _chestLabel.text = chestAvailable
                ? $"BAÚ DO DIA · {DungeonMath.ChestReward(save.dungeonLevel, save.ngPlus, Balance)} OURO (vídeo)"
                : "BAÚ DO DIA · volte amanhã";
        }

        // O dia local, no formato guardado no save.
        private static string Today() => DateTime.Now.ToString("yyyy-MM-dd");
    }
}
```

**Montar a cena `Camp`:**

1. **Hierarchy → Create Empty** `GameSession` com **Add Component → Game Session** e **Database** ligado.
2. **UI → Canvas** com o **Canvas Scaler** igual ao da Battle (`1080 × 1920`, **Match** `0.5`).
3. Objeto `Camp` com **Add Component → Camp Screen** e os elementos:
   - topo: `Resources`;
   - cartão do herói: `HeroName`, `HeroStats`;
   - grade 2×2 com os 4 botões de atributo, cada um com seu texto;
   - `Dungeon` e o botão grande `Enter` ("ENTRAR NA MASMORRA") com `TorchTimer` embaixo;
   - os botões `Market` ("MERCADO") e `Chest` (com o `ChestLabel` dentro).
   Ligue os arrays **Upgrade Buttons** e **Upgrade Labels** na ordem Vida, Ataque, Defesa, Habilidade.
4. **Mercado:** objeto `Market` com **Market Screen**. `Root` é um painel de tela inteira com:
   - `Resources`;
   - os botões `BuyTorch` ("TOCHA · 1 SOUL") e `BuyMap` ("MAPA · 1 SOUL");
   - 4 linhas de gema (prefab `GemRow` com **Gem Row**: `Name`, `Description` e os botões `Action` e `Equip` com seus textos);
   - `Close` ("VOLTAR").
5. **Baú:** objeto `Chest` com **Chest Popup** e um `Root` com `Image` grande, `Message` e `Close`. Se for usar a arte do jogo publicado (`assets/chests/chest1.png` a `chest12.png`, tiras de 4 quadros), recorte cada uma em 4 e crie 12 SpriteAnimation para o campo **Designs**.
6. Ligue no **Camp Screen**: os textos, os botões, **Market Screen** e **Chest Popup**.

### 🧪 Teste rápido
1. Abra a cena `Camp` e aperte ▶. O acampamento mostra 120 de ouro, 5 Tochas, 1 Mapa e a Masmorra Nv. 1.
2. Compre **VIDA +20**: o ouro cai 50 e o preço sobe para 78.
3. **ENTRAR NA MASMORRA**: a cena Battle carrega com o herói comprado (HP 80), e as Tochas viram 4 com o relógio "próxima tocha em 09:59".
4. Vença: o painel mostra o resultado; **CONTINUAR** volta ao acampamento com o ouro somado, **Masmorra Nv. 2** e 1 Soul. No Mercado, a Gema do Arremesso está à venda.
5. Saia do Play e volte: tudo continua (save).

### ✅ Checkpoint da Fase 7
- O loop completo da Parte 1 §2 funciona entre as duas cenas.
- Tochas recarregam com o tempo real (teste mudando **Torch Regen Minutes** para `1` no `GameBalance`).
- A cena Battle continua abrindo sozinha pelo BattleTestStarter quando aberta direto.
- Commit: `feat: acampamento, mercado e save`.

#### Problemas comuns
- **`Scene 'Battle' couldn't be loaded`:** a cena não está na **Scene List** dos Build Profiles.
- **Duas masmorras começam ao mesmo tempo:** o `BattleTestStarter` não foi ligado no `BattleBootstrap`, então continua ativo.
- **O save não reseta durante os testes:** **Edit → Clear All PlayerPrefs**.
- **Botão "ENTRAR" não faz nada:** zero Tochas; espere a recarga ou compre uma com Soul no Mercado.

Próxima fase: **testes automáticos** das regras.

---

# Parte 11 — Implementação Unity: Fase 8 (Testes automáticos)

## Fase 8 — Testes automáticos

> Objetivo desta fase: proteger as regras da Parte 1 com testes que rodam em segundos, sem cena: montagem das ondas, iniciativa, tabela de reação, cansaço, tempo do círculo, recompensas e acampamento.

**Conceitos novos:**
- **Unity Test Framework e NUnit:** um teste é um método `[Test]`; `Assert.AreEqual(esperado, obtido)` falha se diferirem. A janela **Test Runner** roda tudo.
- **Assembly Definition (`.asmdef`):** separa os scripts em assemblies com nome, para o assembly de testes poder referenciar o do jogo.
- **Sorteio roteirizado:** um `IRandom` que devolve exatamente os números que o teste manda, tornando previsível o que no jogo é acaso.

### Etapa 8A — Assemblies

1. Botão direito em `Assets/_Project/Scripts` → **Create → Scripting → Assembly Definition** → `GuerreiroDaMasmorra`. Em **Assembly Definition References**: `Unity.TextMeshPro`, `Unity.InputSystem`, `UnityEngine.UI`. **Apply**.
2. Em `Scripts/Editor` → **Assembly Definition** `GuerreiroDaMasmorra.Editor`: referência `GuerreiroDaMasmorra`; **Platforms** só **Editor**. **Apply**.
3. Botão direito em `Assets/_Project` → **Create → Testing → Tests Assembly Folder** → pasta `Tests`, asmdef renomeado para `GuerreiroDaMasmorra.Tests`, referência `GuerreiroDaMasmorra`, **Platforms** só **Editor**. **Apply**.

### Etapa 8B — Os testes

```csharp
// Caminho: Assets/_Project/Tests/TestData.cs
using System;
using System.Collections.Generic;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEditor;

namespace GuerreiroDaMasmorra.Tests
{
    // POR QUE: um IRandom que devolve números escolhidos pelo teste.
    // ESTRATÉGIA: filas de inteiros e de frações. Fila vazia: Range devolve
    // o mínimo e Value devolve 0,99 (o "acaso" que nunca dispara efeito).
    public sealed class ScriptedRandom : IRandom
    {
        private readonly Queue<int> _ints = new Queue<int>();
        private readonly Queue<double> _values = new Queue<double>();

        public ScriptedRandom Ints(params int[] values)
        {
            foreach (int v in values) _ints.Enqueue(v);
            return this;
        }

        public ScriptedRandom Values(params double[] values)
        {
            foreach (double v in values) _values.Enqueue(v);
            return this;
        }

        public int Range(int minInclusive, int maxInclusive) =>
            _ints.Count > 0 ? Math.Clamp(_ints.Dequeue(), minInclusive, maxInclusive) : minInclusive;

        public double Value() => _values.Count > 0 ? _values.Dequeue() : 0.99;
    }

    // POR QUE: atalhos para os testes usarem os dados reais do jogo.
    public static class TestData
    {
        private static GameDatabase _db;

        public static GameDatabase Db =>
            _db != null ? _db : _db = AssetDatabase.LoadAssetAtPath<GameDatabase>("Assets/_Project/Data/GameDatabase.asset");

        public static GameBalance B => Db.balance;

        // A definição de um monstro comum ou chefe pelo id.
        public static MonsterDefinition Def(string id) => Db.commons.Find(m => m.id == id) ?? Db.bosses.Find(m => m.id == id);

        // Um monstro com os atributos do nível 1.
        public static Monster Monster(string id)
        {
            var def = Def(id);
            return new Monster(def) { Name = def.displayName, MaxHp = def.hp, Hp = def.hp, Attack = def.attack, Defense = def.defense, Gold = 10 };
        }

        // O Guerreiro recém-criado, numa masmorra.
        public static HeroRun Warrior() => new HeroRun(HeroLoadout.Fresh(Db.Hero("warrior")), B);
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/WaveAndInitiativeTests.cs
using System.Linq;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using NUnit.Framework;
using static GuerreiroDaMasmorra.Tests.TestData;

namespace GuerreiroDaMasmorra.Tests
{
    // POR QUE: montagem das ondas (Parte 1 §9) e fila de iniciativa (§4).
    public class WaveAndInitiativeTests
    {
        [Test]
        public void Onda1TemTresMonstrosComLetras()
        {
            var wave = WaveFactory.Make(1, 1, 0, DungeonColor.Red, Db, new ScriptedRandom());
            Assert.AreEqual(3, wave.Count);
            CollectionAssert.AreEqual(new[] { "Servo A", "Servo B", "Servo C" }, wave.Select(m => m.Name).ToArray());
            Assert.AreEqual(30, wave[0].Hp);
        }

        [Test]
        public void Onda2Vem30PorCentoMaisForteE25PorCentoMaisRica()
        {
            var wave = WaveFactory.Make(2, 1, 0, DungeonColor.Red, Db, new ScriptedRandom());
            Assert.AreEqual(39, wave[0].Hp);
            Assert.AreEqual(20, wave[0].Gold);
        }

        [Test]
        public void GrupoDaMasmorraEhFixo()
        {
            var ids = WaveFactory.Group(2, 2, Db).Select(m => m.id).ToArray();
            CollectionAssert.AreEqual(new[] { "archer", "lancer", "monk", "gnome" }, ids);
        }

        [Test]
        public void ChefeFixoPorMasmorra()
        {
            var first = WaveFactory.Make(3, 1, 0, DungeonColor.Red, Db, new ScriptedRandom())[0];
            Assert.IsTrue(first.IsBoss);
            Assert.AreEqual("Cavaleiro Vermelho", first.Name);
            Assert.AreEqual("kingslime", WaveFactory.Make(3, 2, 0, DungeonColor.Red, Db, new ScriptedRandom())[0].Id);
        }

        [Test]
        public void Fase2SoDoNivelEfetivo3EmDiante()
        {
            Assert.IsFalse(WaveFactory.Make(3, 2, 0, DungeonColor.Red, Db, new ScriptedRandom().Values(0)).First().HasPhase2);
            Assert.IsTrue(WaveFactory.Make(3, 3, 0, DungeonColor.Red, Db, new ScriptedRandom().Values(0.5)).First().HasPhase2);
            Assert.IsFalse(WaveFactory.Make(3, 3, 0, DungeonColor.Red, Db, new ScriptedRandom().Values(0.7)).First().HasPhase2);
        }

        [Test]
        public void Masmorra5TemEscoltaMaisFraca()
        {
            var wave = WaveFactory.Make(3, 5, 0, DungeonColor.Red, Db, new ScriptedRandom());
            Assert.AreEqual(3, wave.Count);
            Assert.IsTrue(wave[1].IsEscort && wave[2].IsEscort);
            var def = WaveFactory.Group(5, 5, Db)[0];
            Assert.AreEqual(MathUtil.RoundHalfUp(MathUtil.RoundHalfUp(def.hp * 2.0) * 0.7), wave[1].MaxHp);
        }

        [Test]
        public void NgPlusArredondaComoOJogoPublicado()
        {
            // 30 × 1,25 = 37,5 → 38 (meio para cima, como o JavaScript).
            Assert.AreEqual(38, WaveFactory.Make(1, 1, 1, DungeonColor.Red, Db, new ScriptedRandom())[0].Hp);
        }

        [Test]
        public void EmpateNaIniciativaFavoreceOHeroi()
        {
            var pawn = Monster("pawn");   // velocidade 12
            var queue = Initiative.Roll(new[] { pawn }, new ScriptedRandom().Ints(2, 0), B);
            Assert.IsTrue(queue[0].IsHero);
        }

        [Test]
        public void ChefeEnfurecidoEntraVariasVezes()
        {
            var boss = Monster("boss");
            boss.Enraged = true;
            var queue = Initiative.Roll(new[] { boss }, new ScriptedRandom().Ints(0, 3), B);
            Assert.AreEqual(3, queue.Count(s => s.Monster == boss));
        }

        [Test]
        public void MortoNaoEntraNaFila()
        {
            var pawn = Monster("pawn");
            pawn.Dead = true;
            Assert.AreEqual(1, Initiative.Roll(new[] { pawn }, new ScriptedRandom(), B).Count);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/ReactionTests.cs
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using NUnit.Framework;
using static GuerreiroDaMasmorra.Tests.TestData;

namespace GuerreiroDaMasmorra.Tests
{
    // POR QUE: a tabela de reação (Parte 1 §5), Fúria (§7.1), guarda (§7.2),
    // cansaço (§7.3) e o tempo do círculo.
    public class ReactionTests
    {
        private static HitOutcome Hit(HeroRun hero, Monster m, ReactionType type, QteResult r, bool inCombo = false, IRandom rng = null) =>
            HitResolver.Resolve(hero, m, type, r, m.Attack, inCombo, 1, B, rng ?? new ScriptedRandom());

        [Test]
        public void ParryPerfeitoZeraODanoERevida()
        {
            var hero = Warrior();
            var pawn = Monster("pawn");
            var o = Hit(hero, pawn, ReactionType.Parry, QteResult.Perfect);
            Assert.AreEqual(0, o.Damage);
            Assert.AreEqual(3, o.Riposte.Damage);        // max(1, round(10 × 0,5) − 2)
            Assert.AreEqual(27, pawn.Hp);
            Assert.AreEqual(1, hero.Fury);
            Assert.AreEqual(1, pawn.Fatigue);
            Assert.IsTrue(o.Defended);
        }

        [Test]
        public void BloqueioDescontaADefesaENaoContaParaOContraAtaque()
        {
            var hero = Warrior();
            var o = Hit(hero, Monster("pawn"), ReactionType.Parry, QteResult.Block);
            Assert.AreEqual(6, o.Damage);                 // 9 − 3
            Assert.AreEqual(1, hero.Fury);                // só o +1 do bloqueio
            Assert.IsFalse(o.Defended);
        }

        [Test]
        public void FalhaTiraDanoCheioEDaFuria()
        {
            var hero = Warrior();
            var o = Hit(hero, Monster("pawn"), ReactionType.Parry, QteResult.Miss, rng: new ScriptedRandom().Ints(2));
            Assert.AreEqual(11, o.Damage);
            Assert.AreEqual(49, hero.Hp);
            Assert.AreEqual(1, hero.Fury);
            Assert.IsFalse(hero.Flawless);
        }

        [Test]
        public void GolpeDeFogoEmCheioGrudaDinamite()
        {
            var hero = Warrior();
            Hit(hero, Monster("torch"), ReactionType.Parry, QteResult.Miss);
            Assert.AreEqual(1, hero.Dynamite);
            Assert.AreEqual(4, hero.DynamitePower);       // max(3, round(10 × 0,4))
        }

        [Test]
        public void EsquivaLateralNaoDaFuria()
        {
            var hero = Warrior();
            var o = Hit(hero, Monster("thief"), ReactionType.Side, QteResult.Dodge);
            Assert.AreEqual(0, o.Damage);
            Assert.AreEqual(0, hero.Fury);
            Assert.IsTrue(o.Defended);
        }

        [Test]
        public void SeloDaFuriaImpedeOGanho()
        {
            var hero = Warrior();
            hero.Curse = new Curse { Type = CurseType.SealFury, Turns = 2 };
            Hit(hero, Monster("pawn"), ReactionType.Parry, QteResult.Perfect);
            Assert.AreEqual(0, hero.Fury);
        }

        [Test]
        public void GuardaQuebraNoComboComABarraCheia()
        {
            var hero = Warrior();
            hero.Stagger = hero.StaggerCap;
            var o = Hit(hero, Monster("pawn"), ReactionType.Parry, QteResult.Miss, inCombo: true);
            Assert.IsTrue(o.GuardBroke);
            Assert.IsTrue(hero.GuardBroken && hero.Exhausted);
            Assert.AreEqual(0, hero.Stagger);
        }

        [Test]
        public void EscudoAbsorveORiposte()
        {
            var pawn = Monster("pawn");
            pawn.Shield = 2;
            Hit(Warrior(), pawn, ReactionType.Parry, QteResult.Perfect);
            Assert.AreEqual(1, pawn.Shield);
            Assert.AreEqual(30, pawn.Hp);
        }

        [Test]
        public void GemaVitalCuraNoParryPerfeito()
        {
            var loadout = HeroLoadout.Fresh(Db.Hero("warrior"));
            loadout.HasGem = true;
            loadout.Gem = GemId.Vital;
            loadout.GemLevelValue = 1;
            var hero = new HeroRun(loadout, B) { Hp = 30 };
            Hit(hero, Monster("pawn"), ReactionType.Parry, QteResult.Perfect);
            Assert.AreEqual(33, hero.Hp);                 // +5% de 60
        }

        [Test]
        public void CansacoSoExaureComGolpeForteNoTeto()
        {
            var pawn = Monster("pawn");
            for (int i = 0; i < 6; i++) Assert.IsFalse(CombatMath.AddFatigue(pawn, 1, 1, B));
            Assert.AreEqual(5, pawn.Fatigue);
            Assert.IsFalse(CombatMath.AddFatigue(pawn, 1.2, 1, B));
            Assert.IsTrue(CombatMath.AddFatigue(pawn, 1.5, 1, B));
            Assert.AreEqual(3, pawn.ExhaustTurns);
            Assert.AreEqual(0, pawn.Fatigue);
        }

        [Test]
        public void TetoDoCansacoDobraNoNivel20()
        {
            Assert.AreEqual(5, DungeonMath.FatigueCap(false, 19, B));
            Assert.AreEqual(10, DungeonMath.FatigueCap(false, 20, B));
            Assert.AreEqual(20, DungeonMath.FatigueCap(true, 20, B));
        }

        [Test]
        public void RitmoDoGolpeSoValeDoNivel6EmDiante()
        {
            var hit = new HitSpec { type = ReactionType.Parry, speed = 0.5f, curve = QteCurve.Accel };
            Assert.AreEqual(0.9f, QteTiming.Seconds(hit, 5, false, 0, B), 1e-4);
            Assert.AreEqual(0.45f, QteTiming.Seconds(hit, 6, false, 0, B), 1e-4);
            Assert.AreEqual(QteCurve.Linear, QteTiming.Curve(hit, 5));
            Assert.AreEqual(QteCurve.Accel, QteTiming.Curve(hit, 6));
        }

        [Test]
        public void Fase2ENgPlusEncurtamOCirculo()
        {
            var hit = new HitSpec { type = ReactionType.Parry };
            Assert.AreEqual(0.675f, QteTiming.Seconds(hit, 1, true, 0, B), 1e-4);
            Assert.AreEqual(0.54f, QteTiming.Seconds(hit, 1, false, 10, B), 1e-4);   // piso de 60%
        }

        [Test]
        public void JanelaPerfeitaNosUltimos32PorCento()
        {
            Assert.IsTrue(QteTiming.IsPerfect(0.62f, 0.9f, B));
            Assert.IsFalse(QteTiming.IsPerfect(0.60f, 0.9f, B));
        }

        [Test]
        public void Fase2ENgPlusAlongamOCombo()
        {
            var move = Def("lancer").moves[0];          // Investida Dupla: 2 hits
            Assert.AreEqual(3, MoveComposer.Compose(move, true, 0, B).Count);
            Assert.AreEqual(5, MoveComposer.Compose(move, true, 5, B).Count);
            var single = Def("pawn").moves[0];
            Assert.AreEqual(1, MoveComposer.Compose(single, false, 3, B).Count);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/RewardAndCampTests.cs
using System;
using System.Collections.Generic;
using GuerreiroDaMasmorra.Battle;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using GuerreiroDaMasmorra.Meta;
using NUnit.Framework;
using static GuerreiroDaMasmorra.Tests.TestData;

namespace GuerreiroDaMasmorra.Tests
{
    // POR QUE: fim de masmorra (Parte 1 §9) e acampamento (§10).
    public class RewardAndCampTests
    {
        private static readonly List<GemId> NoGems = new List<GemId>();

        [Test]
        public void VitoriaNaMasmorra1()
        {
            var r = DungeonRewards.Victory(1, 0, false, NoGems, B);
            Assert.AreEqual(150, r.Bonus);
            Assert.AreEqual(1, r.Souls);
            Assert.IsTrue(r.HasScroll);
            Assert.AreEqual(GemId.Stone, r.Scroll);
            Assert.IsFalse(r.GameComplete);
        }

        [Test]
        public void RunPerfeitaDobraBonusESouls()
        {
            var r = DungeonRewards.Victory(1, 0, true, NoGems, B);
            Assert.AreEqual(300, r.Bonus);
            Assert.AreEqual(2, r.Souls);
        }

        [Test]
        public void PergaminhosSeguemAOrdem()
        {
            Assert.AreEqual(GemId.Vital, DungeonRewards.Victory(5, 0, false, new List<GemId> { GemId.Stone }, B).Scroll);
            Assert.IsFalse(DungeonRewards.Victory(2, 0, false, NoGems, B).HasScroll);
        }

        [Test]
        public void Masmorra33FechaOJogo()
        {
            Assert.IsTrue(DungeonRewards.Victory(33, 0, false, NoGems, B).GameComplete);
        }

        [Test]
        public void DerrotaPerdeMetadeDoOuro()
        {
            Assert.AreEqual(12, DungeonRewards.DefeatPenalty(25));
        }

        [Test]
        public void PrecoDoAtributoCresce()
        {
            Assert.AreEqual(50, MetaRules.UpgradeCost(Stat.Health, 0, B));
            Assert.AreEqual(78, MetaRules.UpgradeCost(Stat.Health, 1, B));   // 77,5 → 78
        }

        [Test]
        public void TochasRecarregamComOTempoReal()
        {
            var now = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
            var save = new SaveData { torches = 3, torchTimerTicks = now.AddMinutes(-25).Ticks };
            MetaRules.RegenTorches(save, now, B);
            Assert.AreEqual(5, save.torches);
            Assert.AreEqual(0, save.torchTimerTicks);
        }

        [Test]
        public void GastarTochaNoTetoIniciaORelogio()
        {
            var now = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
            var save = new SaveData { torches = 5 };
            Assert.IsTrue(MetaRules.TrySpendTorch(save, now, B));
            Assert.AreEqual(4, save.torches);
            Assert.AreEqual(now.Ticks, save.torchTimerTicks);
        }

        [Test]
        public void BauAbreUmaVezPorDia()
        {
            var save = new SaveData();
            Assert.IsTrue(MetaRules.CanOpenChest(save, "2026-01-01"));
            Assert.AreEqual(80, MetaRules.OpenChest(save, "2026-01-01", B));
            Assert.IsFalse(MetaRules.CanOpenChest(save, "2026-01-01"));
            Assert.IsTrue(MetaRules.CanOpenChest(save, "2026-01-02"));
        }

        [Test]
        public void SoUmaGemaEquipada()
        {
            var hero = MetaRules.NewProgress(Db.Hero("warrior"));
            hero.gemLevels.Add(new GemLevel { gem = GemId.Stone, level = 1 });
            hero.gemLevels.Add(new GemLevel { gem = GemId.Vital, level = 1 });
            MetaRules.Equip(hero, GemId.Stone);
            MetaRules.Equip(hero, GemId.Vital);
            Assert.AreEqual(GemId.Vital, hero.equippedGem);
            Assert.IsFalse(MetaRules.Equip(hero, GemId.Echo));   // não comprada
        }

        [Test]
        public void VitoriaAvancaAMasmorraEPagaTudo()
        {
            var save = MetaRules.NewGame(Db, new ScriptedRandom());
            var hero = MetaRules.Progress(save, "warrior");
            var outcome = Outcome(DungeonOutcomeKind.Victory, level: 1, runGold: 40, soulsUsed: 0);
            MetaRules.ApplyOutcome(save, hero, outcome, B, new ScriptedRandom());
            Assert.AreEqual(120 + 40 + 150, save.gold);
            Assert.AreEqual(1, save.souls);
            Assert.AreEqual(2, save.dungeonLevel);
            Assert.Contains(GemId.Stone, hero.gemsUnlocked);
        }

        [Test]
        public void NgPlusVoltaParaAMasmorra1()
        {
            var save = MetaRules.NewGame(Db, new ScriptedRandom());
            save.dungeonLevel = 33;
            var outcome = Outcome(DungeonOutcomeKind.Victory, level: 33, runGold: 0, soulsUsed: 0);
            outcome.StartNgPlus = true;
            MetaRules.ApplyOutcome(save, MetaRules.Progress(save, "warrior"), outcome, B, new ScriptedRandom());
            Assert.AreEqual(1, save.ngPlus);
            Assert.AreEqual(1, save.dungeonLevel);
        }

        // Um resultado de masmorra como o ResultPanel montaria.
        private static DungeonOutcome Outcome(DungeonOutcomeKind kind, int level, int runGold, int soulsUsed)
        {
            var request = new DungeonRequest { Level = level };
            var end = new BattleEnd { Kind = kind, Request = request, RunGold = runGold, SoulsUsed = soulsUsed };
            return new DungeonOutcome
            {
                End = end,
                GoldKept = kind == DungeonOutcomeKind.Defeat ? runGold - DungeonRewards.DefeatPenalty(runGold) : runGold,
                Reward = kind == DungeonOutcomeKind.Victory ? DungeonRewards.Victory(level, 0, false, request.GemsUnlocked, B) : default,
            };
        }
    }
}
```

### Etapa 8C — Rodar

**Window → General → Test Runner → EditMode → Run All**. Todos verdes.

### 🧪 Teste rápido
Abra `Data/Monsters/common_pawn` e mude o **Attack** de `9` para `10`. Rode os testes: `BloqueioDescontaADefesa...` falha (esperava 6, obteve 7). Volte o valor (ou rode **GDM → Criar ou atualizar dados iniciais**).

### ✅ Checkpoint da Fase 8
- 3 classes de teste, todas verdes.
- Commit: `test: regras de combate, recompensas e acampamento`.

#### Problemas comuns
- **Testes não aparecem:** o asmdef de testes precisa ser só **Editor** e referenciar `GuerreiroDaMasmorra`.
- **Erros de compilação logo após criar o asmdef do jogo:** faltam as referências `Unity.TextMeshPro`, `Unity.InputSystem` ou `UnityEngine.UI`.

---

# Parte 12 — Implementação Unity: Fase 9 (Build, anúncios e nuvem)

## Fase 9 — Build, anúncios e nuvem

> Objetivo desta fase: builds de Android e WebGL, o caminho para trocar os anúncios simulados por um provedor real e o save na nuvem opcional (Parte 1 §15).

### 9.1 Configurações comuns

1. **File → Build Profiles → Scene List:** `Camp` (0) e `Battle` (1).
2. **Project Settings → Player:** **Company Name**, **Product Name** `Guerreiro da Masmorra`, ícone.
3. **Resolution and Presentation → Default Orientation** = `Portrait`.

### 9.2 Android

1. **Build Profiles → Android → Switch Platform**.
2. **Player → Other Settings:**
   - **Package Name**: o jogo publicado usa `com.guerreirodamasmorra.app`. Usar o mesmo nome substitui o app publicado na Play Store, e para isso é preciso a mesma chave de assinatura. Para testes, use outro (`com.guerreirodamasmorra.unity`).
   - **Scripting Backend** = `IL2CPP`; **Target Architectures** = `ARM64`.
3. **Player → Publishing Settings → Keystore Manager:** crie (ou importe) a keystore. **Guarde a senha e o arquivo fora do repositório.**
4. Para a Play Store, marque **Build App Bundle (Google Play)**. **Build**.

### 9.3 WebGL

1. **Build Profiles → Web → Switch Platform**.
2. **Publishing Settings → Compression Format** `Gzip` + **Decompression Fallback**.
3. **Resolution and Presentation:** template **Minimal** ou **Default**, canvas `540 × 960` (retrato).
4. **Build And Run**.

> No navegador, o `PlayerPrefs` vira o armazenamento do site (por domínio). O save do jogo web publicado (`localStorage`, outro formato) **não** é lido pelo port.

### 9.4 Anúncios

O jogo chama só `Ads.Current.ShowRewarded()` e `Ads.Current.ShowInterstitial()` (Fase 6). Trocar o provedor é escrever uma classe que implemente `IAdsService` e registrá-la no início do jogo.

**Em aberto (Parte 1 §17):** qual provedor. As duas opções naturais no Android são o **Unity LevelPlay** (pacote **Ads Mediation** no Package Manager) e o **Google Mobile Ads** (plugin oficial do AdMob, o mesmo SDK que o jogo publicado usa via Capacitor). No WebGL, o equivalente ao H5 Games Ads exige chamar JavaScript da página (um arquivo `.jslib`).

O formato do adaptador, independente do provedor:

```csharp
// Caminho: Assets/_Project/Scripts/Services/ProviderAds.cs
using UnityEngine;

namespace GuerreiroDaMasmorra.Services
{
    // POR QUE: molde do adaptador entre o jogo e o SDK de anúncios escolhido.
    // ESTRATÉGIA: SDKs de anúncio avisam por callbacks ("recompensa
    // concedida", "anúncio fechado", "falhou"). Cada pedido cria uma promessa
    // (AwaitableCompletionSource) e os callbacks a cumprem: recompensa
    // concedida → true; fechou sem recompensa ou falhou → false. Substitua os
    // comentários "SDK:" pelas chamadas do provedor escolhido.
    public sealed class ProviderAds : IAdsService
    {
        private AwaitableCompletionSource<bool> _rewarded;
        private bool _rewardGranted;

        public Awaitable<bool> ShowRewarded()
        {
            _rewarded = new AwaitableCompletionSource<bool>();
            _rewardGranted = false;
            // SDK: se o vídeo não estiver carregado, chame OnRewardedClosed() e retorne.
            // SDK: mostre o vídeo premiado.
            return _rewarded.Awaitable;
        }

        public async Awaitable ShowInterstitial()
        {
            // SDK: mostre o intersticial se estiver carregado; ignore falhas.
            await Awaitable.NextFrameAsync();
        }

        // Ligue ao callback "recompensa concedida" do SDK.
        public void OnRewardGranted() => _rewardGranted = true;

        // Ligue ao callback "anúncio fechado" e ao "falhou" do SDK.
        public void OnRewardedClosed()
        {
            _rewarded?.TrySetResult(_rewardGranted);
            _rewarded = null;
            // SDK: peça o próximo vídeo premiado (pré-carregamento).
        }
    }
}
```

Registre-o no `Awake` do `GameSession`, depois do `Instance = this;`: `Ads.Current = new ProviderAds();` (com a inicialização do SDK que o provedor pedir). No Editor, mantenha o `SimulatedAds`.

### 9.5 Save na nuvem (opcional)

O jogo publicado usa Firebase (login com Google + Firestore em `saves/{uid}`, com regras que só deixam o próprio usuário ler e gravar). No port:

1. Crie (ou reutilize) o projeto no console do Firebase, adicione o app Android com o **Package Name** da Etapa 9.2 e baixe o `google-services.json` para `Assets/`.
2. Importe do **Firebase Unity SDK** os pacotes `FirebaseAuth` e `FirebaseFirestore`.
3. Use as mesmas regras do jogo publicado:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /saves/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

4. Envio e leitura do save, para um usuário já autenticado:

```csharp
// Caminho: Assets/_Project/Scripts/Meta/CloudSave.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using Firebase;
using Firebase.Auth;
using Firebase.Firestore;
using UnityEngine;

namespace GuerreiroDaMasmorra.Meta
{
    // POR QUE: continuar o jogo em outro aparelho (Parte 1 §15).
    // ESTRATÉGIA: o SaveData inteiro vai como texto JSON num documento
    // saves/{uid}. Só funciona com alguém logado; sem login, não faz nada.
    // O login em si (Google, Play Games...) está em aberto (Parte 1 §17).
    public static class CloudSave
    {
        private static FirebaseFirestore _db;

        // Confere as dependências do Firebase. Chame uma vez no começo do jogo.
        public static async Task<bool> Init()
        {
            var status = await FirebaseApp.CheckAndFixDependenciesAsync();
            if (status != DependencyStatus.Available) return false;
            _db = FirebaseFirestore.DefaultInstance;
            return true;
        }

        private static string UserId => FirebaseAuth.DefaultInstance.CurrentUser?.UserId;

        // Grava o save na nuvem.
        public static async Task Upload(SaveData save)
        {
            if (_db == null || UserId == null) return;
            await _db.Collection("saves").Document(UserId).SetAsync(new Dictionary<string, object>
            {
                { "json", JsonUtility.ToJson(save) },
                { "updatedAt", FieldValue.ServerTimestamp },
            });
        }

        // Lê o save da nuvem (null se não houver).
        public static async Task<SaveData> Download()
        {
            if (_db == null || UserId == null) return null;
            var snapshot = await _db.Collection("saves").Document(UserId).GetSnapshotAsync();
            if (!snapshot.Exists || !snapshot.ContainsField("json")) return null;
            return JsonUtility.FromJson<SaveData>(snapshot.GetValue<string>("json"));
        }
    }
}
```

> O save do jogo web publicado tem outro formato. Migrar jogadores da versão web para o port exige um conversor; fica em aberto.

### ✅ Checkpoint da Fase 9
- APK/AAB instala e roda em retrato; o save sobrevive a fechar o app.
- A build WebGL roda no navegador.
- Commit: `chore: builds`.

### 9.6 Próximos passos do MVP

1. **Campo de Treinamento (tutorial):** o jogo publicado abre, na primeira vez, um treino guiado contra um Boneco de Treino (60 HP, ATK 5, sem ouro). Os passos são pedrada, segurar Atacar, parry até acertar o perfeito, salto, lateral e os especiais, com botão "Pular tutorial". Caminho no port: uma cena ou modo com `DungeonRequest.Tutorial = true`, `ThirdWaveOverride` com o boneco e um `TutorialDirector` que implementa `IReactionSource` envolvendo o `QteController` (para repetir o parry até sair perfeito e mostrar as dicas). Marque `SaveData.tutorialDone` no fim.
2. **Áudio:** um `SoundBoard` com os efeitos da Parte 1 §13, tocado pelo `BattleStage` (golpe, crítico, parry, bloqueio, esquiva, dano, explosão, escudo) e pelo `QteController` (o "plim" já existe).
3. **Corredor em perspectiva e biomas** (Parte 1 §13): trocar o fundo liso por cenários por bioma e a marcha por um cenário que rola.
4. **Baú também na vitória**, com o mesmo `ChestPopup` do acampamento.
5. **Pós-MVP:** Fase 10.

---

# Parte 13 — Implementação Unity: Fase 10 (Pós-MVP: Mago, heróis e duelos)

## Fase 10 — Pós-MVP: Mago, heróis e duelos

> Objetivo desta fase: os sistemas que o jogo publicado já tem escritos mas desligados (Parte 1 §11 e §12): o Mago Arcanista com a mão de cartas, o recrutamento por duelo e a troca de herói. O mapa-múndi fica descrito no fim, como próximo passo.

**Conceitos novos:**
- **Pattern matching `or` (C# 9):** `kind is CardKind.Bless or CardKind.Ward` testa várias opções de uma vez.
- **LINQ (`Sum`, `All`, `Any`, `Select`):** consultas curtas sobre listas, usadas nas regras das cartas.

### Etapa 10A — A mão de cartas

```csharp
// Caminho: Assets/_Project/Scripts/Combat/MageHand.cs
using System.Collections.Generic;
using System.Linq;
using GuerreiroDaMasmorra.Data;

namespace GuerreiroDaMasmorra.Combat
{
    public enum CardKind
    {
        Fire,
        Ice,
        Water,
        Spark,
        Bless,
        Ward,
        Death,
    }

    public enum CardColor
    {
        Purple,
        Green,
        Black,
    }

    // POR QUE: uma carta na mão. `Base` pode ser maior que o da tabela
    // (cartas nascidas da fusão de Cartas da Morte).
    public sealed class Card
    {
        public int Uid;
        public CardKind Kind;
        public int Base;

        public CardColor Color => CardCatalog.ColorOf(Kind);
        public string Name => CardCatalog.NameOf(Kind);
    }

    // POR QUE: a tabela de cartas da Parte 1 §11.
    public static class CardCatalog
    {
        // Cartas que podem ser compradas (a Morte só vem de um abate).
        public static readonly CardKind[] DrawPool =
            { CardKind.Fire, CardKind.Ice, CardKind.Water, CardKind.Spark, CardKind.Bless, CardKind.Ward };

        public static int BaseOf(CardKind kind) => kind switch
        {
            CardKind.Fire => 9,
            CardKind.Ice => 10,
            CardKind.Water => 9,
            CardKind.Spark => 8,
            CardKind.Bless => 14,
            CardKind.Ward => 12,
            _ => 0,
        };

        public static CardColor ColorOf(CardKind kind) =>
            kind is CardKind.Bless or CardKind.Ward ? CardColor.Green
            : kind == CardKind.Death ? CardColor.Black : CardColor.Purple;

        public static string NameOf(CardKind kind) => kind switch
        {
            CardKind.Fire => "Bola de Fogo",
            CardKind.Ice => "Lasca de Gelo",
            CardKind.Water => "Jato d'Água",
            CardKind.Spark => "Faísca",
            CardKind.Bless => "Bênção",
            CardKind.Ward => "Couraça Arcana",
            _ => "Carta da Morte",
        };
    }

    public enum CastError
    {
        None,
        Empty,
        TooMany,
        DeathNotAlone,
        MixedColors,
    }

    // POR QUE: a mão do Mago e as regras de combinação (Parte 1 §11).
    // ESTRATÉGIA: estado (as cartas) + funções puras de validação e poder.
    // O poder escala com o ATK atual dividido pelo ATK inicial do Mago.
    public sealed class MageHand
    {
        public const int Limit = 7;

        public readonly List<Card> Cards = new List<Card>();
        private int _nextUid;

        // Põe uma carta na mão; com a mão cheia, ela se dissipa (false).
        public bool Add(CardKind kind, int baseOverride = -1)
        {
            if (Cards.Count >= Limit) return false;
            Cards.Add(new Card { Uid = ++_nextUid, Kind = kind, Base = baseOverride >= 0 ? baseOverride : CardCatalog.BaseOf(kind) });
            return true;
        }

        // Compra uma carta aleatória (nunca a Morte).
        public bool DrawRandom(IRandom rng) => Add(CardCatalog.DrawPool[rng.Range(0, CardCatalog.DrawPool.Length - 1)]);

        // Tira cartas da mão (jogadas ou fundidas).
        public void Remove(IEnumerable<Card> cards)
        {
            foreach (var card in cards.ToList()) Cards.Remove(card);
        }

        // A jogada é válida? (Morte sozinha; demais, até `maxCombo` da mesma cor.)
        public static CastError Validate(IReadOnlyList<Card> selection, int maxCombo)
        {
            if (selection.Count == 0) return CastError.Empty;
            if (selection.Count > maxCombo) return CastError.TooMany;
            if (selection.Count > 1 && selection.Any(c => c.Kind == CardKind.Death)) return CastError.DeathNotAlone;
            if (selection.Any(c => c.Color != selection[0].Color)) return CastError.MixedColors;
            return CastError.None;
        }

        // Todas do mesmo tipo exato (fogo + fogo)?
        public static bool SameKind(IReadOnlyList<Card> selection) => selection.All(c => c.Kind == selection[0].Kind);

        // Escala pelo ATK comprado no acampamento.
        public static double AttackScale(int attack, int baseAttack) => attack / (double)baseAttack;

        // Poder do combo: nº de cartas × soma das bases × escala.
        public static int Power(IReadOnlyList<Card> selection, double scale) =>
            MathUtil.RoundHalfUp(selection.Sum(c => c.Base) * selection.Count * scale);

        // Dano que a Carta da Morte devolve ao Mago: a soma das outras cartas.
        public int Backlash(double scale) => MathUtil.RoundHalfUp(Cards.Sum(c => c.Base) * scale);

        // Dá para fundir? (1 a 3 Cartas da Morte e nada mais)
        public static bool CanFuse(IReadOnlyList<Card> selection) =>
            selection.Count >= 1 && selection.Count <= 3 && selection.All(c => c.Kind == CardKind.Death);

        // Funde Cartas da Morte numa carta aleatória com base × quantidade.
        public CardKind Fuse(IReadOnlyList<Card> deaths, IRandom rng)
        {
            Remove(deaths);
            var kind = CardCatalog.DrawPool[rng.Range(0, CardCatalog.DrawPool.Length - 1)];
            Add(kind, CardCatalog.BaseOf(kind) * deaths.Count);
            return kind;
        }
    }
}
```

**Testes da mão** (acrescente à pasta `Tests`):

```csharp
// Caminho: Assets/_Project/Tests/MageHandTests.cs
using System.Collections.Generic;
using GuerreiroDaMasmorra.Combat;
using NUnit.Framework;

namespace GuerreiroDaMasmorra.Tests
{
    // POR QUE: as regras de cartas da Parte 1 §11.
    public class MageHandTests
    {
        private static Card C(CardKind kind) => new Card { Kind = kind, Base = CardCatalog.BaseOf(kind) };

        [Test]
        public void PoderEhQuantidadeVezesSomaVezesEscala()
        {
            var pair = new List<Card> { C(CardKind.Fire), C(CardKind.Fire) };
            Assert.AreEqual(36, MageHand.Power(pair, 1.0));          // 2 × 18
            Assert.AreEqual(50, MageHand.Power(pair, 11 / 8.0));     // ATK 11: 36 × 1,375 = 49,5 → 50
        }

        [Test]
        public void CoresMisturadasNaoCombinam()
        {
            Assert.AreEqual(CastError.MixedColors, MageHand.Validate(new List<Card> { C(CardKind.Fire), C(CardKind.Bless) }, 3));
            Assert.AreEqual(CastError.None, MageHand.Validate(new List<Card> { C(CardKind.Fire), C(CardKind.Spark) }, 3));
        }

        [Test]
        public void MorteSoSozinha()
        {
            Assert.AreEqual(CastError.DeathNotAlone, MageHand.Validate(new List<Card> { C(CardKind.Death), C(CardKind.Fire) }, 3));
            Assert.AreEqual(CastError.None, MageHand.Validate(new List<Card> { C(CardKind.Death) }, 3));
        }

        [Test]
        public void MaoTemLimiteDe7()
        {
            var hand = new MageHand();
            for (int i = 0; i < 7; i++) Assert.IsTrue(hand.Add(CardKind.Ice));
            Assert.IsFalse(hand.Add(CardKind.Ice));
        }

        [Test]
        public void FusaoMultiplicaABase()
        {
            var hand = new MageHand();
            hand.Add(CardKind.Death);
            hand.Add(CardKind.Death);
            var kind = hand.Fuse(new List<Card>(hand.Cards), new ScriptedRandom().Ints(1));   // Ice
            Assert.AreEqual(CardKind.Ice, kind);
            Assert.AreEqual(1, hand.Cards.Count);
            Assert.AreEqual(20, hand.Cards[0].Base);
        }
    }
}
```

### Etapa 10B — O turno do Mago

```csharp
// Caminho: Assets/_Project/Scripts/Battle/CardButton.cs
using System;
using GuerreiroDaMasmorra.Combat;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: uma carta na base da tela; tocar seleciona ou desseleciona.
    public class CardButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private Image _background;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private GameObject _highlight;

        public event Action Clicked;

        private void Awake() => _button.onClick.AddListener(() => Clicked?.Invoke());

        // Mostra a carta (ou esconde, com null).
        public void Show(Card card, bool selected)
        {
            gameObject.SetActive(card != null);
            if (card == null) return;
            _label.text = $"{card.Name}\n{card.Base}";
            _background.color = card.Color switch
            {
                CardColor.Green => new Color(0.2f, 0.55f, 0.3f),
                CardColor.Black => new Color(0.12f, 0.12f, 0.14f),
                _ => new Color(0.4f, 0.25f, 0.6f),
            };
            _highlight.SetActive(selected);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/MageTurn.cs
using System;
using System.Collections.Generic;
using System.Linq;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Battle
{
    // POR QUE: o turno do Mago Arcanista (Parte 1 §11): Ataque Simples,
    // Conjurar (combos de cartas) e Destruir carta (fusão de Cartas da Morte).
    // ESTRATÉGIA: uma mão por masmorra (persiste entre ondas). No começo de
    // cada turno compra 1 carta; espera uma ação; jogada inválida não gasta o
    // turno (volta a esperar). As regras de validação e poder vêm do MageHand.
    public class MageTurn : MonoBehaviour, IHeroTurnTaker
    {
        private enum MageAction
        {
            None,
            Attack,
            Conjure,
            Destroy,
        }

        [SerializeField] private BattleStage _stage;
        [SerializeField] private BattleHud _hud;
        [SerializeField] private TargetSelector _targets;
        [SerializeField] private MonoBehaviour _freeAction;
        [SerializeField] private GameObject _root;
        [SerializeField] private HoldButton _attack;
        [SerializeField] private HoldButton _conjure;
        [SerializeField] private HoldButton _destroy;
        [SerializeField] private CardButton[] _cardButtons = new CardButton[MageHand.Limit];

        private readonly List<Card> _selected = new List<Card>();
        private AwaitableCompletionSource<MageAction> _pending;
        private BattleContext _handOwner;
        private MageHand _hand;
        private int _maxCombo;

        // Liga botões e cartas.
        private void Awake()
        {
            _attack.Held += () => Complete(MageAction.Attack);
            _conjure.Held += () => Complete(MageAction.Conjure);
            _destroy.Held += () => Complete(MageAction.Destroy);
            for (int i = 0; i < _cardButtons.Length; i++)
            {
                int index = i;
                _cardButtons[i].Clicked += () => Toggle(index);
            }
            _root.SetActive(false);
        }

        // A vez do Mago.
        public async Awaitable<TurnResult> TakeTurn(BattleContext ctx)
        {
            if (_handOwner != ctx)
            {
                _hand = new MageHand();
                _handOwner = ctx;
            }
            _maxCombo = Math.Min(3, ctx.Hero.Loadout.SkillsUnlocked(ctx.Balance.skillStep));
            _selected.Clear();
            if (!_hand.DrawRandom(ctx.Rng)) ctx.Log("Mão cheia: a carta se dissipou!");
            var free = _freeAction as IFreeAction;

            while (true)
            {
                ctx.ShowTarget = true;
                _targets.Begin(ctx);
                free?.Begin(ctx, () => Complete(MageAction.None));
                RefreshCards();
                _root.SetActive(true);
                _pending = new AwaitableCompletionSource<MageAction>();
                var action = await _pending.Awaitable;
                free?.End();
                _targets.End();
                ctx.ShowTarget = false;
                ctx.EnsureTarget();
                if (ctx.WaveCleared || action == MageAction.None) return TurnResult.Done;

                if (action == MageAction.Attack)
                {
                    await SimpleAttack(ctx);
                    return TurnResult.Done;
                }

                if (action == MageAction.Destroy)
                {
                    if (!MageHand.CanFuse(_selected))
                    {
                        ctx.Log("Selecione de 1 a 3 Cartas da Morte para fundir.");
                        continue;
                    }
                    int count = _selected.Count;
                    var kind = _hand.Fuse(_selected, ctx.Rng);
                    _selected.Clear();
                    _stage.Float(null, CardCatalog.NameOf(kind).ToUpperInvariant(), BattleStage.Purple, true);
                    ctx.Log($"{count} Carta(s) da Morte viraram {CardCatalog.NameOf(kind)}!");
                    await Wait(0.5f);
                    return TurnResult.Done;
                }

                var error = MageHand.Validate(_selected, _maxCombo);
                if (error != CastError.None)
                {
                    ctx.Log(error switch
                    {
                        CastError.Empty => "Toque nas cartas para selecioná-las.",
                        CastError.DeathNotAlone => "A Carta da Morte deve ser jogada sozinha.",
                        CastError.MixedColors => "Essas cartas não combinam: precisam ser da mesma cor.",
                        _ => "Combo maior do que a Habilidade permite.",
                    });
                    continue;
                }
                await Conjure(ctx, new List<Card>(_selected));
                return TurnResult.Done;
            }
        }

        // Ataque Simples: 80% do ATK, ignorando DEF, e compra 1 carta.
        private async Awaitable SimpleAttack(BattleContext ctx)
        {
            var target = ctx.Target;
            _hud.ShowMoveName("Ataque Simples");
            var swing = _stage.HeroView.Strike(destroyCancellationToken);
            await Wait(0.2f);
            int damage = Math.Max(1, MathUtil.RoundHalfUp(ctx.Hero.Attack * 0.8) + ctx.Rng.Range(-1, 2));
            Damage(ctx, target, damage, false, null);
            if (!_hand.DrawRandom(ctx.Rng)) ctx.Log("Mão cheia: a carta se dissipou!");
            await swing;
            await Wait(0.4f);
        }

        // Conjurar as cartas selecionadas.
        private async Awaitable Conjure(BattleContext ctx, List<Card> cards)
        {
            _hand.Remove(cards);
            _selected.Clear();
            double scale = MageHand.AttackScale(ctx.Hero.Attack, ctx.Hero.Loadout.Hero.attack);
            _hud.ShowMoveName(string.Join(" + ", cards.Select(c => c.Name)));
            var swing = _stage.HeroView.Strike(destroyCancellationToken);
            await Wait(0.2f);

            var first = cards[0];
            if (first.Kind == CardKind.Death)
            {
                CastDeath(ctx, scale);
            }
            else if (first.Color == CardColor.Green)
            {
                GreenCombo(ctx, cards, scale);
            }
            else if (MageHand.SameKind(cards))
            {
                // Mesmo tipo: tantos alvos quanto cartas; 3 cartas = todos, com crítico.
                bool crit = cards.Count >= 3;
                int damage = MageHand.Power(cards, scale);
                var targets = PickTargets(ctx, cards.Count);
                int? shieldBreak = cards.Count > 1 && targets.Count == 1 ? cards.Count : (int?)null;
                foreach (var target in targets) Damage(ctx, target, damage, crit, shieldBreak);
            }
            else
            {
                // Tipos diferentes da mesma cor: só o alvo, 1 escudo por carta.
                Damage(ctx, ctx.Target, MageHand.Power(cards, scale), false, cards.Count);
            }
            await swing;
            await Wait(0.3f);
        }

        // Carta da Morte: abate o alvo; o resto da mão volta contra o Mago.
        private void CastDeath(BattleContext ctx, double scale)
        {
            var target = ctx.Target;
            if (target != null && !target.Dead)
            {
                ctx.Slay(target);
                _stage.Float(target, "MORTE", BattleStage.Purple, true);
                _stage.Shake();
                ctx.Log($"A Carta da Morte consumiu {target.Name} instantaneamente!");
            }
            if (_hand.Cards.Count == 0) return;
            int backlash = _hand.Backlash(scale);
            _hand.Cards.Clear();
            ctx.Hero.TakeDamage(backlash);
            _stage.Float(null, $"-{backlash}", BattleStage.Red, true);
            ctx.Log($"As demais cartas se voltaram contra você: {backlash} de dano!");
        }

        // Cartas verdes: cura e/ou Couraça Arcana.
        private void GreenCombo(BattleContext ctx, List<Card> cards, double scale)
        {
            if (MageHand.SameKind(cards))
            {
                if (cards[0].Kind == CardKind.Bless) Heal(ctx, MageHand.Power(cards, scale));
                else Ward(ctx, MageHand.Power(cards, scale));
                return;
            }
            var bless = cards.Where(c => c.Kind == CardKind.Bless).ToList();
            var ward = cards.Where(c => c.Kind == CardKind.Ward).ToList();
            if (bless.Count > 0) Heal(ctx, MathUtil.RoundHalfUp(MageHand.Power(bless, scale) / 2.0));
            if (ward.Count > 0) Ward(ctx, MathUtil.RoundHalfUp(MageHand.Power(ward, scale) / 2.0));
        }

        private void Heal(BattleContext ctx, int amount)
        {
            ctx.Hero.Heal(amount);
            _stage.Float(null, $"+{amount}", BattleStage.Green, true);
            ctx.Log($"Bênção! +{amount} de HP.");
        }

        private void Ward(BattleContext ctx, int amount)
        {
            ctx.Hero.Ward += amount;
            _stage.Float(null, $"COURAÇA +{amount}", BattleStage.Blue, true);
            ctx.Log($"Couraça Arcana: absorve {ctx.Hero.Ward} do próximo dano.");
        }

        // Dano mágico: escudo primeiro; matar com magia rende uma Carta da Morte.
        private void Damage(BattleContext ctx, Monster target, int damage, bool crit, int? shieldBreak)
        {
            if (target == null || target.Dead) return;
            if (target.Shield > 0)
            {
                int n = shieldBreak ?? (crit || damage >= 18 ? 2 : 1);
                int broke = Math.Min(target.Shield, n);
                target.Shield -= broke;
                _stage.Float(target, $"ESCUDO -{broke}", BattleStage.Blue, crit);
                return;
            }
            target.TakeDamage(damage);
            _stage.ViewOf(target)?.Flash();
            _stage.Float(target, damage.ToString(), crit ? BattleStage.Gold : BattleStage.White, crit || damage >= 18);
            if (crit) _stage.Shake();
            if (target.Hp > 0) return;
            ctx.Slay(target);
            if (_hand.Add(CardKind.Death)) _stage.Float(null, "+CARTA DA MORTE", BattleStage.Purple);
        }

        // 1 carta: o alvo; 2: o alvo e outro; 3 ou mais: todos.
        private static List<Monster> PickTargets(BattleContext ctx, int count)
        {
            var alive = ctx.Alive();
            if (count >= 3) return alive;
            var list = new List<Monster>();
            if (ctx.Target != null && !ctx.Target.Dead) list.Add(ctx.Target);
            foreach (var monster in alive)
                if (!list.Contains(monster)) list.Add(monster);
            return list.GetRange(0, Math.Min(count, list.Count));
        }

        // Seleciona ou desseleciona; acima do combo liberado, a mais antiga sai.
        private void Toggle(int index)
        {
            if (_hand == null || index >= _hand.Cards.Count) return;
            var card = _hand.Cards[index];
            if (_selected.Remove(card))
            {
                RefreshCards();
                return;
            }
            bool fusing = card.Kind == CardKind.Death;
            if (_maxCombo == 0 && !fusing)
            {
                _handOwner?.Log("Suba Habilidade ao Nv.5 no acampamento para conjurar cartas!");
                return;
            }
            int limit = fusing ? 3 : _maxCombo;
            if (_selected.Count >= limit) _selected.RemoveAt(0);
            _selected.Add(card);
            RefreshCards();
        }

        // Redesenha a mão e os botões.
        private void RefreshCards()
        {
            for (int i = 0; i < _cardButtons.Length; i++)
            {
                var card = i < _hand.Cards.Count ? _hand.Cards[i] : null;
                _cardButtons[i].Show(card, card != null && _selected.Contains(card));
            }
            _conjure.Interactable = _maxCombo > 0;
            _destroy.Interactable = _hand.Cards.Any(c => c.Kind == CardKind.Death);
        }

        // Cumpre a espera uma vez só e esconde a mão.
        private void Complete(MageAction action)
        {
            if (_pending == null) return;
            var pending = _pending;
            _pending = null;
            _root.SetActive(false);
            pending.SetResult(action);
        }

        private Awaitable Wait(float seconds) => Awaitable.WaitForSecondsAsync(seconds, destroyCancellationToken);
    }
}
```

**Montar:** no Canvas da cena `Battle`, objeto `MageTurn` com o componente. `Root` ocupa a faixa de baixo: uma fileira de 7 `CardButton` (prefab: **UI → Button** com `Label`, e um filho `Highlight` dourado desligado; **Add Component → Card Button** com os campos ligados) e, acima dela, os três HoldButtons: "ATAQUE SIMPLES", "CONJURAR" e "DESTRUIR CARTA". Ligue Stage, Hud, Targets, **Free Action** = `RockThrower` e os botões. No **Battle Controller**, **Mage Turn** = `MageTurn`.

### 🧪 Teste rápido
No `BattleTestStarter`, **Hero Id** = `mage`, **Skill Level** `15`. Aperte ▶:
- cada turno o Mago compra uma carta;
- **ATAQUE SIMPLES** dá dano e mais uma carta;
- selecione duas cartas iguais roxas e segure **CONJURAR**: atinge 2 monstros; três iguais atingem todos;
- matar com magia dá uma **Carta da Morte**: jogue-a sozinha com outras na mão e veja o Mago tomar o dano de volta.

### Etapa 10C — Recrutamento, troca de herói e duelos

```csharp
// Caminho: Assets/_Project/Scripts/Meta/RosterRules.cs
using System.Collections.Generic;
using GuerreiroDaMasmorra.Combat;
using GuerreiroDaMasmorra.Data;
using UnityEngine;

namespace GuerreiroDaMasmorra.Meta
{
    // POR QUE: recrutamento por duelo e troca de herói (Parte 1 §3 e §12).
    // ESTRATÉGIA: o duelo é uma masmorra normal com a onda 3 trocada pelo
    // herói desafiado como chefe (sempre com Fase 2). Atributos do duelo:
    // (90 + HP base) × m, (ATK base + 6) × m, (DEF base + 2) × m, com
    // m = (1 + (nível − 1) × 0,18) × NG+. O comportamento vem do monstro
    // comum equivalente (Caçadora = Arqueiro, Lanceiro = Lanceiro, Mago e
    // Monge = Monge de suporte).
    public static class RosterRules
    {
        // O herói ainda pode ser desafiado?
        public static bool CanChallenge(SaveData save, HeroDefinition hero)
        {
            var progress = MetaRules.Progress(save, hero.id);
            return hero.recruitCity >= 0 && !progress.unlocked && !progress.wonDuel;
        }

        // Duelo vencido → entra na equipe no Nv.1 da própria progressão.
        public static bool TryRecruit(SaveData save, string heroId)
        {
            var progress = MetaRules.Progress(save, heroId);
            if (progress.unlocked || !progress.wonDuel) return false;
            progress.unlocked = true;
            return true;
        }

        // Troca o herói ativo do acampamento.
        public static bool TrySwitch(SaveData save, string heroId)
        {
            var progress = MetaRules.Progress(save, heroId);
            if (progress == null || !progress.unlocked) return false;
            save.activeHero = heroId;
            return true;
        }

        // O herói desafiado convertido em chefe.
        public static Monster MakeDuelBoss(HeroDefinition hero, int level, int ngPlus, GameDatabase db)
        {
            double m = (1 + (level - 1) * 0.18) * DungeonMath.NgMult(ngPlus, db.balance);
            string kind = hero.id == "huntress" ? "archer" : hero.id == "lancer" ? "lancer" : "monk";
            var template = db.commons.Find(c => c.id == kind);

            var def = ScriptableObject.CreateInstance<MonsterDefinition>();
            def.id = hero.id;
            def.displayName = hero.displayName;
            def.isBoss = true;
            def.speed = template.speed;
            def.ranged = template.ranged;
            def.support = template.support;
            def.moves = new List<MoveDefinition>(template.moves);

            int hp = MathUtil.RoundHalfUp((90 + hero.maxHp) * m);
            return new Monster(def)
            {
                Name = hero.displayName,
                MaxHp = hp,
                Hp = hp,
                Attack = MathUtil.RoundHalfUp((hero.attack + 6) * m),
                Defense = MathUtil.RoundHalfUp((hero.defense + 2) * m),
                Gold = 60 + 20 * level,
                IsBoss = true,
                HasPhase2 = true,
            };
        }
    }
}
```

Para entrar num duelo, acrescente ao `GameSession` (Fase 7) este método, logo abaixo de `EnterDungeon`:

```csharp
        // Desafia um herói para duelo (custa 1 Tocha; 2 ondas + o herói como chefe).
        public void EnterDuel(string heroId)
        {
            var b = _database.balance;
            var challenged = _database.Hero(heroId);
            if (!RosterRules.CanChallenge(Save, challenged) || !MetaRules.TrySpendTorch(Save, DateTime.UtcNow, b)) return;
            Persist();

            var hero = ActiveHero;
            int level = Save.dungeonLevel;
            int ngPlus = Save.ngPlus;
            PendingRequest = new DungeonRequest
            {
                Loadout = MetaRules.Loadout(_database, hero),
                Level = level,
                NgPlus = ngPlus,
                Color = Save.dungeonColor,
                Souls = Save.souls,
                Maps = Save.maps,
                GemsUnlocked = new List<GemId>(hero.gemsUnlocked),
                DuelHeroId = heroId,
                ThirdWaveOverride = _ => new List<Monster> { RosterRules.MakeDuelBoss(challenged, level, ngPlus, _database) },
            };
            SceneManager.LoadScene("Battle");
        }
```

O `ResultPanel` (Fase 6) já mostra "DUELO VENCIDO!" e o `MetaRules.ApplyOutcome` (Fase 7) já marca `wonDuel` quando o pedido tem `DuelHeroId`.

**Na interface do acampamento:**
- uma lista **Recrutar** com uma linha por herói recrutável: "Desafiar" (chama `GameSession.Instance.EnterDuel(id)`) enquanto `CanChallenge`; "Recrutar" (chama `RosterRules.TryRecruit` e salva) depois do duelo vencido; "Na equipe" quando já recrutado;
- setas no cartão do herói chamando `RosterRules.TrySwitch` com o próximo herói desbloqueado.

### 🧪 Teste rápido
No Console de uma build de desenvolvimento, ou com um botão de teste temporário, chame `GameSession.Instance.EnterDuel("huntress")`. A onda 3 é a **Caçadora** como chefe com Fase 2; vencendo, o painel diz "DUELO VENCIDO!" e, no acampamento, **Recrutar** a coloca na equipe. Trocar para ela mostra HP 55, ATK 12, DEF 2 e progressão própria zerada.

### ✅ Checkpoint da Fase 10
- O Mago joga uma masmorra inteira com cartas; os testes da mão passam.
- Duelo, recrutamento e troca de herói funcionam e persistem no save.
- Commit: `feat: mago, duelos e recrutamento`.

### 10.4 Próximo passo: o mapa-múndi

O mapa da Parte 1 §12 é a camada de navegação que leva às portas de masmorra e às cidades de duelo:
- **Dados:** 11 nós em posições fixas (o jogo publicado usa coordenadas normalizadas de 0 a 1 na tela); pares = cidades (Pedraverde, Lago Bruma, Solar Silente, Torre Rubra, Bosque Ermo, Castelo Ruína), ímpares = portas.
- **Estado:** a posição do token já existe no save (`mapPosition`, −1 = não posicionado); a região atual é `floor((nível − 1) ÷ 5)`.
- **Tela:** uma cena ou painel com o mapa de fundo, um botão por nó, o token animado entre nós adjacentes já alcançados, "Entrar na Masmorra" na porta de fronteira e "Desafiar" na cidade de um herói recrutável (`HeroDefinition.recruitCity`).

**Em aberto (Parte 1 §17):** quando religar o mapa no jogo publicado, e os heróis das cidades 8 e 10.
