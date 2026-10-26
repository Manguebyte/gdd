# GDD — Guerreiro da Masmorra v2

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

> Documento vivo. Escrito a partir do jogo publicado no repositório [abraaovilanova/guerreiro-da-masmorra-v2](https://github.com/abraaovilanova/guerreiro-da-masmorra-v2) (web em `index.html` único + Android via Capacitor), que é a referência de comportamento. A Parte 1 descreve o que o código faz hoje, incluindo os sistemas já escritos mas desligados.
> A v2 é a evolução do jogo descrito em [`GuerreiroDaMasmorra.md`](GuerreiroDaMasmorra.md): o mesmo combate de reações, mas **todo o poder de ataque vem de dados**, comprados e melhorados com **sangue**, a moeda única. Este documento é completo por si só e não é um diff do outro; a §2.1 lista o que mudou, para quem já conhece a versão anterior.
> Onde o `GDD.md` do repositório da v2 ficou desatualizado em relação ao código, este documento segue o **código** e registra a diferença na §17. Números marcados como **valor inicial** são o balanceamento atual, não decisões fechadas.

**Gênero:** RPG tático por turnos com reações em tempo real (QTE) e dados · **Dimensão:** 2D · **Plataformas:** Web (H5 Games/AdSense) e Android · **Orientação:** retrato · **Protótipo:** [`prototipos/guerreiro-da-masmorra-v2/`](prototipos/guerreiro-da-masmorra-v2/) (o próprio jogo, importado da v2)

## Índice

**Parte 1 — GDD**
1. [Visão Geral](#1-visão-geral)
2. [Loop Principal](#2-loop-principal)
3. [Herói](#3-herói)
4. [Turnos e Iniciativa](#4-turnos-e-iniciativa)
5. [Dados](#5-dados)
6. [Ações do Herói](#6-ações-do-herói)
7. [Reações (QTE)](#7-reações-qte)
8. [Exaustão e Cansaço](#8-exaustão-e-cansaço)
9. [Monstros](#9-monstros)
10. [Masmorras](#10-masmorras)
11. [Acampamento, Forja e Mercado](#11-acampamento-forja-e-mercado)
12. [Sistemas desligados: outros heróis, mapa-múndi e Mago](#12-sistemas-desligados-outros-heróis-mapa-múndi-e-mago)
13. [Estilo Visual e Áudio](#13-estilo-visual-e-áudio)
14. [Interface e Controles](#14-interface-e-controles)
15. [Persistência, Nuvem e Monetização](#15-persistência-nuvem-e-monetização)
16. [Escopo](#16-escopo)
17. [Em aberto](#17-em-aberto)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Pitch:** um RPG de turnos em que você rola os dados para atacar e usa o reflexo para defender. No começo de cada rodada sua mão de dados é rolada: a soma vira o ataque, e combinações de pôquer (par, trinca, sequência…) liberam os golpes especiais. Na vez dos monstros, cada golpe vira uma reação em tempo real: aparar, pular ou esquivar. Defender bem rende re-rolagens. Desça 33 masmorras de 3 ondas, volte ao acampamento com sangue e troque-o por dados maiores.
- **Gênero — Definido:** RPG tático por turnos com QTE de reação a cada golpe inimigo e ataque decidido por dados.
- **Dimensão e câmera — Definido:** 2D. A batalha acontece num corredor de masmorra em perspectiva, com o herói de costas no meio e os monstros no fundo.
- **Plataformas — Definido:** Web (H5 Games Ads/AdSense, no navegador, sem conta obrigatória) e Android. Tela em **retrato**, pensada para o polegar.
- **Pilares — Definido:**
  - **O combate é ativo, não passivo.** Um parry perfeito zera o dano, revida e cansa o inimigo.
  - **Sorte que você administra.** O dado decide o ataque, mas o jogador escolhe o que travar, quando re-rolar e qual especial a rolagem permite. Defender bem compra mais re-rolagens.
  - **Progressão visível na mão.** O herói começa com um único D4; cada compra na Forja aparece como um dado novo ou uma face maior.
- **Fantasia central:** o cavaleiro sozinho que aprende o padrão de cada monstro pelo nome do golpe e transforma uma mão de dados fracos numa mão de D20.
- **Referências:** Clair Obscur: Expedition 33 e Paper Mario (turnos com reação em tempo real), Yahtzee e Balatro (dados e combinações de pôquer), jogos mobile casuais (tochas que recarregam, baú diário).

## 2. Loop Principal

```
 Acampamento ──► (gasta 1 Tocha) ──► Masmorra Nv. N: Onda 1 ► Onda 2 ► Onda 3 (Chefe) ──► Vitória: bônus de sangue, Soul,
  (Forja de Dados,                                                                         pergaminho de gema
   atributos, Mercado,                                                                     (Nv. 1 e múltiplos de 5),
   Baú do Dia)  ◄──────────── Derrota: perde metade do sangue desta masmorra ◄──────────── Masmorra N+1
       ▲                      (ou revive com 1 Soul de onde parou)                               │
       └─────────────────────────────────────────────────────────────────────────────────────────┘
 Masmorra 33 vencida ► "Você venceu o jogo" ► NG+ (volta à masmorra 1, mantém tudo, monstros mais fortes)
```

- **Definido:** a primeira entrada no jogo abre o **Campo de Treinamento** (§14.3) em vez de uma masmorra.
- **Definido:** cada entrada em masmorra custa 1 **Tocha** (§11.4).
- **Definido:** vencer uma masmorra avança o nível em 1 e sorteia a cor da próxima.
- **Definido:** entre as ondas, o herói marcha corredor adentro (2 s, o chão e o cenário rolam para a câmera) e os novos monstros chegam pelo fundo.

### 2.1 O que mudou desde o Guerreiro da Masmorra

| Sistema | Antes | Na v2 |
|---|---|---|
| Moeda | Ouro | **Sangue** 🩸 (mesmo campo no save, nome novo em toda a interface) |
| Ataque | Atributo comprado (+3 por compra) | **Mão de dados** (até 5, de D4 a D20), comprada na Forja de Dados (§5, §11.2) |
| Fúria | Barra 0–5 que paga os especiais | Não existe mais. Defender bem rende **re-rolagens** (§5.3) |
| Especiais | Custam Fúria | Pedem uma **soma mínima ou combinação** na rolagem (§6.2) e gastam os dados |
| Poção de Adrenalina | Enche a Fúria | **Rola a mão de novo** com 3 re-rolagens, sem gastar a vez (§6.3) |
| Herói em batalha | Sprite lateral do Tiny Swords | Pixel art de 8 direções (PixelLab), visto de costas no corredor |

## 3. Herói

- **Definido:** só o **Guerreiro** é jogável. Os outros quatro heróis existem no código, mas estão desligados (§12).
- **Atributos-base (valor inicial):** Vida 60, Defesa 3, mão de dados `[D4]`, 1 re-rolagem por rodada.
- **Definido:** não existe atributo de Ataque comprável. O campo `atk` do save sobrou da versão anterior e não entra em nenhuma conta do Guerreiro.
- **Definido:** o herói nasce só com o ataque normal. Os 4 especiais são aprendidos subindo o atributo **Habilidade** (§11.3).

## 4. Turnos e Iniciativa

- **Definido:** cada rodada rola a iniciativa de todos: `velocidade + d(0..5)`, do maior para o menor. A barra "Turnos" mostra a fila; quem já agiu fica apagado.
- **Velocidades (valor inicial):** herói 10; Servo 12; Gnomo 11; Ladrão 10; Arqueiro, Goblin da Tocha, Cobra e Aranha 9; Monge, Goblin Dinamite, Gnoll, Lagarto e Peixe Arpoador 8; Lanceiro, Minotauro, Caveira, Peixe-Remo, Xamã e Cavaleiro Selvagem 7; Cavaleiro-chefe, Rei Slime, Urso, Minotauro Ancestral e Panda 6; Árvore Anciã 5; Tartaruga e Troll 4.
- **Definido:** um chefe em **Fase 2** (§9.4) entra na fila 2 ou 3 vezes por rodada, cada entrada com +3 de iniciativa.
- **Definido:** no início de cada vez do herói, antes de agir: explode 1 dinamite grudada (§9.5), age a maldição do Monge (§9.6) e, se o herói está **exausto** por ter usado um especial, ele perde a vez.

## 5. Dados

O coração do combate. Todo dano do herói sai dos dados.

### 5.1 A mão

- **Definido:** a mão tem de 1 a **5 dados**, cada um com uma face entre **D4, D6, D8, D10, D12 e D20**. Começa com um D4.
- **Definido:** no começo de cada vez do herói a mão inteira é rolada. A rolagem vale para **uma** ação: atacar ou usar um especial "gasta" os dados até a próxima rodada.
- **Definido:** **poder da rolagem** = `round(soma × 4)` (mínimo 1). A constante `DICE_K = 4` faz um D4 (média 2,5) render dano médio 10, o mesmo Ataque inicial da versão anterior; 5×D20 (média 52,5) rende 210.
- **Definido:** golpes que acontecem fora da vez do herói (riposte, ataque aéreo, contra-ataque, pedrada) usam o **poder médio** da mão, `round(soma média × 4)`, porque não há rolagem ativa.

### 5.2 Travar e re-rolar

- **Definido:** tocar um dado o **trava** (não muda na re-rolagem). "Re-rolar" sorteia de novo os dados não travados e gasta 1 re-rolagem.
- **Definido:** re-rolagens por rodada = `mín(3, re-rolagens compradas + bônus guardado)`. Sem re-rolagens restantes, os dados não podem ser travados.

### 5.3 Re-rolagens de bônus

Substituem a antiga Fúria: defender bem (ou apanhar) guarda re-rolagens para a próxima rodada do herói, até o teto de 3.

| Evento | Bônus |
|---|---|
| Parry perfeito | +1 |
| Bloqueio | +1 |
| Salto sobre golpe rasteiro | +1 |
| Tomar dano (golpe em cheio, explosão de goblin) | +1 |
| Esquiva lateral | nada (só evita o dano) |

- **Definido:** o **Selo da Fúria** do Monge inimigo (§9.6) bloqueia esses bônus enquanto durar.

### 5.4 Combinações

A rolagem é lida como uma mão de pôquer, e o nome aparece na mesa de dados.

| Combinação | Regra |
|---|---|
| 👊 Par | 2 dados iguais |
| ⚖ Dois pares | 2 grupos de 2+ dados iguais (um full house também conta) |
| 🎯 Trinca | 3 dados iguais |
| ➰ Sequência | **Todos** os dados da mão em valores consecutivos, com 3+ dados |
| 🏠 Full house | Trinca + par |
| 💠 Quadra | 4 dados iguais |
| 🌈 Sequência (de 5) | Sequência com os 5 dados |
| 👑 Quinta | 5 dados iguais |

- **Definido:** sequência e quinta exigem 5 dados na mão; a Forja avisa isso enquanto a mão não está completa.

## 6. Ações do Herói

Toda ação de batalha exige **segurar o botão por 0,9 s** (uma barra carrega; soltar antes cancela). Navegar menus é toque simples.

### 6.1 Ataque normal

- **Definido:** usa só a soma, sem exigir combinação. O herói corre até o alvo e golpeia: dano = `máx(1, poder − DEF do alvo)`.
- **Definido:** 15% de chance de **crítico** (dano ×2; contra escudo, quebra 2 em vez de 1).
- **Definido:** com a **Gema do Eco** equipada, o ataque golpeia duas vezes (§11.5).

### 6.2 Especiais

Abertos pelo botão "✨ Ataque especial" (carrossel de 2 páginas). Cada um precisa estar **aprendido** (Habilidade, §11.3) e a rolagem atual precisa atender ao requisito. Todo especial **gasta os dados e deixa o herói exausto**: ele perde a próxima vez.

Os requisitos de soma são uma fração da **soma máxima da mão** (soma das faces), para continuarem difíceis quando a mão crescer: `soma mínima = máx(2, ⌈soma máxima × fração⌉)`.

| Especial | Aprende no | Requisito | Efeito |
|---|---|---|---|
| ⚡ Fúria | Habilidade 5 | Soma ≥ 45% do máximo | Golpe único. Multiplicador pela fração da soma: <60% ×1,2 · ≥60% ×1,4 · ≥75% ×1,6 · ≥90% **×1,8 em todos os inimigos**. Contra escudo, quebra 2 |
| 🗡 Combo | Habilidade 10 | Par ou melhor | Golpes = tamanho do maior grupo de dados iguais (par 2 … quinta 5); força de cada um = **valor repetido** × 4, com multiplicadores ×1,2 / ×1,4 / ×1,8 / ×2 / ×2,4. Cada golpe tem um círculo de tempo (§7.4): errar perde só aquele golpe |
| 👻 Lâmina Invisível | Habilidade 15 | Dois pares ou sequência | **Cada dado vira um golpe** num inimigo vivo sorteado (pode repetir), com força = valor do dado × 4 × 1,5. Contra escudo, quebra 1 por golpe |
| ☠ Sequência Mortal | Habilidade 20 | Trinca+ ou soma ≥ 75% do máximo | Barra oscilante (§7.4) decide o multiplicador ×1,1 / ×1,5 / ×2 sobre o poder da rolagem. Sem toque em 3 idas e voltas, o golpe falha. Contra escudo, quebra 1/2/3 |

- **Definido:** no empate de grupos do Combo, vale o de valor mais alto (uma trinca de 6 bate mais que uma de 2).

### 6.3 Poções

Ficam sob o botão "Poção", com 2 opções. Cada uma começa com **×3 por masmorra**.

- **Poção de Cura:** cura 40% da Vida máxima e **gasta a vez**.
- **Poção de Adrenalina:** rola a mão inteira de novo e devolve **3 re-rolagens**. **Não gasta a vez**: é a rede de segurança contra uma rolagem ruim.

### 6.4 Pedrada

- **Definido:** arrastar do herói até um monstro joga uma pedra. É **grátis e não gasta a vez**; 1 por rodada (mais com a Gema do Arremesso).
- **Definido:** acertando, causa `máx(1, round(poder médio × 0,2))` (sem descontar DEF) ou quebra 1 escudo. Errar a mira desperdiça a pedra.

### 6.5 Fugir

- **Definido:** "Fugir 🗺️" gasta 1 **Mapa** e sai da masmorra mantendo todo o sangue coletado.

## 7. Reações (QTE)

Na vez de um monstro, o nome do golpe aparece na tela e cada golpe do combo vira um círculo que se fecha em **900 ms** (valor inicial). A cor e o ícone dizem a reação pedida.

### 7.1 Tipos de reação

| Golpe | Reação | Acerto | Falha |
|---|---|---|---|
| 🛡️ Toque (`parry`) | Tocar a tela | Nos últimos **32%** da janela: **parry perfeito** (dano 0, riposte, cansa o atacante). Antes disso: **bloqueio** (dano = `máx(0, ATK − DEF)`) | Dano cheio |
| ⬆️ Rasteiro (`jump`) | Arrastar para cima | Salto: dano 0 e abre o **Ataque Aéreo** | Dano cheio |
| ↔️ Rolante (`side`) | Deslizar para o lado | Esquiva: dano 0, sem bônus | Dano cheio |

- **Dano cheio:** `ATK do golpe + d(0..3)`. Em combos de 2+ golpes, cada golpe usa **65% do ATK** do monstro.
- **Riposte (parry perfeito):** `máx(1, round(poder médio × 0,5) − DEF)`, ou quebra 1 escudo.
- **Ataque Aéreo:** depois do salto, aparece o botão "⚡ ATAQUE RÁPIDO!" por 1,1 s; tocar causa `máx(1, round(poder médio × 0,9) − DEF)`.
- **Contra-ataque:** defender **todos** os golpes de um combo de 2+ golpes (parry perfeito, salto ou esquiva, cada um no seu tipo) dispara um golpe de **×1,5 a ×2** o poder médio.
- **Aviso sonoro:** uma moeda toca quando começa a janela do parry perfeito.

### 7.2 Ritmo dos golpes

- **Definido:** a partir do nível efetivo 6 (§10.3), cada golpe nomeado tem seu ritmo: `m` multiplica a duração do círculo (<1 fecha mais rápido) e `curve` muda a aceleração (`accel` começa devagar e acelera; `decel` o contrário). Antes disso, todo círculo é linear de 900 ms.
- **Definido:** Fase 2 do chefe deixa o círculo 25% mais rápido; cada ciclo de NG+ encurta todas as janelas em 6% (piso de 60%).

### 7.3 Guarda quebrada

Ver §8.1: com a guarda quebrada o herói não reage, e todo golpe entra cheio.

### 7.4 Minijogos de ataque

- **Combo:** o mesmo círculo de 900 ms, sempre linear. Tocar nos últimos 32% acerta o golpe; antes disso é "cedo demais" e o golpe erra.
- **Sequência Mortal:** cursor numa barra com 3 zonas (fraca 60% ×1,1, forte 30% ×1,5, muito forte 10% ×2). O cursor acelera em cada zona (0,55 / 1,05 / 1,9 barras por segundo) e faz 3 idas e voltas; tocar trava o multiplicador.

## 8. Exaustão e Cansaço

### 8.1 Exaustão do herói

- **Definido:** barra de 0 a 100. Cada golpe sofrido soma `máx(6, round(dano × 140 ÷ Vida máxima))`.
- **Definido:** se a barra está cheia e o herói leva dano **dentro de um combo inimigo**, ela zera, a guarda quebra (sem reação até a próxima vez dele) e ele perde a próxima vez.
- **Definido:** usar um especial também deixa o herói exausto por 1 vez (§6.2), sem quebrar a guarda.

### 8.2 Cansaço dos monstros

- **Definido:** cada golpe de especial, combo, riposte ou parry perfeito soma 1 ao contador do monstro, até o teto da categoria:

| Categoria | Teto |
|---|---|
| Monstro comum | 5 |
| Chefe | 10 |
| Big Boss (nível efetivo ≥ 20) | 15 |
| Huge Boss (nível efetivo ≥ 30) | 20 |

- **Definido:** com o contador no teto, o próximo golpe de multiplicador **≥ 1,5** deixa o monstro **exausto por 3 rodadas** (perde a vez). Golpes fracos (parry, Lâmina Invisível) só enchem o contador.

## 9. Monstros

### 9.1 Comuns

Liberados pelo **nível efetivo** mínimo (§10.3). Os de cor (Servo, Arqueiro, Lanceiro, Monge, goblins) usam o sprite da cor da masmorra; os "solo" têm sprite único.

| Monstro | HP | ATK | DEF | Nível | Nota |
|---|---|---|---|---|---|
| Servo | 30 | 9 | 2 | 1 | |
| Arqueiro | 24 | 12 | 1 | 1 | Ataca à distância |
| Lanceiro | 40 | 11 | 4 | 1 | |
| Monge | 26 | 10 | 2 | 1 | Suporte (§9.6) |
| Gnomo Arruaceiro | 24 | 9 | 1 | 1 | |
| Ladrão | 26 | 10 | 1 | 2 | |
| Cobra Venenosa | 24 | 11 | 1 | 2 | |
| Aranha Gigante | 28 | 10 | 2 | 3 | |
| Goblin da Tocha | 28 | 10 | 2 | 3 | Fogo (§9.5) |
| Goblin Dinamite | 22 | 9 | 1 | 3 | Fogo, à distância |
| Caveira Amaldiçoada | 32 | 11 | 3 | 4 | |
| Minotauro | 46 | 13 | 3 | 4 | |
| Gnoll Arremessador | 30 | 12 | 2 | 5 | À distância |
| Lagarto Cuspidor | 32 | 11 | 2 | 6 | À distância |
| Peixe Arpoador | 30 | 12 | 2 | 7 | À distância |
| Peixe-Remo | 36 | 12 | 3 | 8 | |
| Xamã Selvagem | 34 | 13 | 2 | 9 | À distância |
| Tartaruga Blindada | 48 | 11 | 6 | 10 | |
| Cavaleiro Selvagem | 40 | 14 | 4 | 12 | |

- **Definido:** monstros à distância atacam do lugar; os outros correm até o herói e voltam.

### 9.2 Chefes

| Chefe | HP | ATK | DEF | Nível | Nota |
|---|---|---|---|---|---|
| Cavaleiro da cor ("Cavaleiro Vermelho"…) | 160 | 20 | 6 | 1 | |
| Rei Slime | 200 | 18 | 4 | 1 | |
| Árvore Anciã | 170 | 19 | 8 | 1 | Brota do chão em vez de correr; ataca de onde está |
| Urso Feroz | 180 | 19 | 5 | 2 | |
| Minotauro Ancestral | 210 | 20 | 6 | 4 | |
| Troll das Cavernas | 230 | 21 | 7 | 6 | |
| Panda Guerreiro | 190 | 18 | 6 | 9 | |

### 9.3 Golpes nomeados

Cada monstro tem um repertório fixo, e o nome do golpe aparece antes do ataque, ensinando o padrão. Alguns golpes só entram a partir de um nível efetivo. Exemplos (a tabela completa está em `MOVES` no código):

| Monstro | Golpes (reações em ordem) |
|---|---|
| Servo | Facada do Servo (toque) · Corte Apressado (toque rápido) · Dança das Facas (toque, toque acelerando; Nv. 3+) |
| Lanceiro | Investida Dupla (toque, salto) · Varredura Rasteira (salto acelerando, toque) |
| Cavaleiro-chefe | Julgamento do Cavaleiro (toque, salto, toque) · Lâmina Paciente (toque lento acelerando, toque) · Tempestade de Aço (salto, toque, toque freando) |
| Goblin Dinamite | Dinamite Acesa · Pavio Curto · Bomba Rolante (lateral) · Barril Explosivo (Nv. 5+) |
| Troll das Cavernas | Pancada do Porrete · Varredura Brutal (lateral) · Esmagamento Duplo · Fúria da Caverna (lateral, toque, salto; Nv. 9+) |

- **Definido:** em Fase 2, o combo ganha 1 golpe extra igual ao último (15% mais rápido), até 4 golpes.
- **Definido:** em NG+, todo combo de 2+ golpes ganha 1 golpe extra por ciclo (até 3 extras, máximo 5 golpes).

### 9.4 Escudo Arcano e Fase 2

- **Escudo Arcano:** a partir do nível efetivo 5, o chefe tem 45% de chance de gastar a vez conjurando 2–3 escudos (teto 10). Com escudo de pé, golpes quebram escudos em vez de tirar HP (a Gema Perfurante deixa parte do dano passar).
- **Fase 2:** a partir do nível efetivo 3, 60% dos chefes são marcados. Ao cair a 50% do HP, enfurecem: ATK ×1,4, golpe extra no combo, círculo 25% mais rápido e 2–3 entradas por rodada.

### 9.5 Goblins de fogo

- **Dinamite:** um golpe de goblin de fogo que entra em cheio gruda uma dinamite no herói (até 5). No início de cada vez do herói, 1 explode: dano `máx(3, round(ATK × 0,4))`.
- **Explosão Final:** ao morrer, o goblin explode: dano `máx(3, round(ATK × 0,5))`, que só a **esquiva lateral** evita. A explosão também atinge os outros monstros (`dano − DEF/2`, ou quebra 1 escudo) e pode matar outro goblin, encadeando outra explosão.

### 9.6 Monge inimigo (suporte)

Na vez dele, em ordem de prioridade:
1. Se há aliado abaixo de 50% do HP, 50% de chance de **curar** o mais ferido em 30% do HP máximo dele.
2. Se o herói não está amaldiçoado, 45% de chance de lançar um encanto por 2–3 vezes do herói: **Maldição Sombria** (perde `máx(3, round(ATK × 0,5))` de HP no início de cada vez) ou **Selo da Fúria** (sem re-rolagens de bônus).
3. Senão, ataca de longe com um feitiço (1 golpe de toque).

## 10. Masmorras

### 10.1 Ondas

- **Definido:** 3 ondas. Ondas 1 e 2 têm 3 monstros comuns; a onda 2 vem com stats ×1,3 e sangue ×1,25. A onda 3 é o chefe.
- **Definido:** cada masmorra sorteia seus comuns de um **grupo fixo de 4** tirado da lista liberada, começando no índice `(nível − 1) mod tamanho`. A mesma masmorra sempre traz o mesmo grupo e o mesmo chefe: `chefes liberados[(nível − 1) mod quantidade]`.
- **Definido:** nas masmorras **múltiplas de 5** o chefe vem com 2 guardas (comuns com 70% do HP, 80% do ATK e 80% do sangue).

### 10.2 Escala

- Stats dos monstros: `base × (1 + (nível − 1) × 0,25) × 1,25^NG+` (valor inicial).
- Sangue por monstro: `round((12 + 4 × nível) × 1,25^NG+)`, pago na hora em que ele morre.

### 10.3 Cores, biomas e NG+

- **Cores** (sorteadas ao vencer a masmorra anterior): Vermelha, Negra, Azul, Púrpura, Dourada. Mudam os sprites das tropas e dos goblins e o nome do Cavaleiro-chefe.
- **Biomas** (sorteados a cada entrada, só visuais): Castelo, Floresta, Cemitério e Ruínas, cada um com chão, céu e objetos de margem próprios (§13).
- **`DUNGEON_CAP = 33`:** vencer a masmorra 33 "zera o jogo" e oferece o **NG+**: volta à masmorra 1, mantém sangue, dados, atributos e gemas.
- **Nível efetivo** = `nível + NG+ × 5`. Controla tudo o que é liberado por nível (monstros, golpes, escudo, Fase 2), então nada desbloqueado some no NG+.

### 10.4 Fim da masmorra

- **Vitória:** bônus de `round((150 + 60 × (nível − 1)) × 1,25^NG+)` de sangue e **1 Soul**. Se o herói não sofreu **nenhum dano** na masmorra inteira, bônus e Souls dobram. Um vídeo premiado dobra o bônus de novo.
- **Pergaminho de Gema:** o chefe da masmorra 1 e o de cada múltipla de 5 liberam a próxima gema no Mercado, na ordem Arremesso → Vital → Eco → Perfurante.
- **Baú:** a vitória toca a animação de um baú (12 desenhos, que ciclam com o nível vencido).
- **Derrota:** perde **metade do sangue ganho nesta masmorra**. Com Souls, pode gastar 1 para reviver com a Vida cheia **na mesma onda**, com os monstros como estavam (morrer de novo corta metade do que sobrou).

## 11. Acampamento, Forja e Mercado

### 11.1 Recursos

| Recurso | Para quê | Como ganha |
|---|---|---|
| 🩸 Sangue | Tudo da Forja, atributos e gemas | Monstros mortos, bônus de vitória, Baú do Dia, +100 ao terminar o treino. Começa com 120 |
| 🔥 Tocha | 1 por entrada na masmorra | Recarrega 1 a cada 10 min reais, até 5; ou 1 Soul cada |
| 💠 Soul | Reviver, comprar Tocha ou Mapa | 1 por chefe (2 na masmorra sem dano) |
| 🗺️ Mapa | Fugir da masmorra com o sangue | 1 Soul cada. Começa com 1 |

### 11.2 Forja de Dados

A mão aparece numa prateleira com 5 vagas; cada dado é um botão que compra a próxima face (valores iniciais):

| Compra | Custo em sangue |
|---|---|
| 2º / 3º / 4º / 5º dado (sempre D4) | 150 / 400 / 900 / 1.800 |
| Melhorar para D6 / D8 / D10 / D12 / D20 | 120 / 260 / 520 / 950 / 2.200 |
| 2ª / 3ª re-rolagem por rodada | 500 / 1.500 |

- **Definido:** a mão fica ordenada do maior dado para o menor. A Forja mostra o dano médio, a faixa de soma e as re-rolagens.

### 11.3 Atributos

| Atributo | Por compra | Custo-base |
|---|---|---|
| Vida máxima | +20 | 50 |
| Defesa | +2 | 60 |
| Habilidade | +1 | 40 |

- **Custo:** `base × 1,55^compras já feitas` (valor inicial).
- **Habilidade:** a cada 5 níveis o herói aprende um especial, na ordem Fúria (5), Combo (10), Lâmina Invisível (15), Sequência Mortal (20). Depois do 20 o botão trava em "MÁX". Cada marco abre um aviso "✨ NOVA HABILIDADE!".
- **Visual:** cada atributo tem uma barrinha de 5 marcos, e o ícone da Defesa troca de escudo a cada 5 compras.

### 11.4 Mercado

- **Tocha:** 1 Soul (só se não estiver no teto de 5).
- **Mapa:** 1 Soul.
- **Gemas:** ver §11.5.

### 11.5 Gemas

Liberadas pelos pergaminhos (§10.4); compradas no Nv. 1 com sangue e evoluídas até o Nv. 5. **Só 1 equipada por vez.** Evoluir do Nv. *n* custa `4.000 × 5^(n − 1)` (valor inicial).

| Gema | Compra | Efeito (Nv. 1 → Nv. 5) |
|---|---|---|
| 🪨 Gema do Arremesso | 250 | Pedradas por rodada: 2 → 6 |
| 💗 Gema Vital | 300 | Parry perfeito cura 5% → 13% da Vida máxima |
| ⚔️ Gema do Eco | 400 | Ataque normal golpeia 2×; o eco vale 50% → 100% do dano |
| 💠 Gema Perfurante | 400 | 40% → 80% do dano atravessa o escudo arcano |

### 11.6 Baú do Dia

- **Definido:** 1 vez por dia (data local), depois de um vídeo premiado: `round((80 + 40 × (nível − 1)) × 1,25^NG+)` de sangue, com a animação do baú.

## 12. Sistemas desligados: outros heróis, mapa-múndi e Mago

Escritos e mantidos no save, mas com os botões comentados no código como "PATCH FUTURO". O herói ativo é sempre forçado para o Guerreiro.

- **Heróis:** Mago Arcanista (45/8/2, cartas), Caçadora (55/12/2), Lanceiro (75/11/5) e Monge (52/9/3). Cada um teria progressão própria e seria trocado arrastando o card no acampamento. Caçadora, Lanceiro e Monge usariam o combate do Guerreiro.
- **Mapa-múndi:** 11 nós (6 cidades e 5 portas de masmorra) sobre um pergaminho, no estilo Final Fantasy Tactics. A cada 5 masmorras a região muda e as portas renumeram.
- **Recrutamento por duelo:** na cidade de um herói, "Desafiar" gasta 1 Tocha e roda 2 ondas comuns mais o herói como chefe (sempre com Fase 2). Vencendo, o herói fica disponível no menu Recrutar.
- **Mago Arcanista:** mão de cartas (até 7) em vez de dados. Fogo, Gelo, Água e Faísca (roxas, dano), Bênção e Couraça Arcana (verdes, cura e escudo) e Carta da Morte (abate instantâneo, ganha ao matar). Combina até 3 cartas da mesma cor; Conjurar é liberado pela Habilidade (1, 2 e 3 cartas nos Nv. 5, 10 e 15).

## 13. Estilo Visual e Áudio

- **Herói:** pixel art de 64 px em 8 direções, gerada no PixelLab (parado, andando, atacando, aparando, pulando, esquivando). Na batalha aparece de costas; no acampamento, de frente.
- **Monstros:** Tiny Swords (Pixel Frog: tropas por cor, goblins de fogo e o Enemy Pack), THE PACK (Rei Slime e Árvore Anciã) e uma folha avulsa de Minotauro.
- **Corredor:** estrada em perspectiva com chão do bioma (folhas do PixelLab), céu procedural com estrelas, astro e duas camadas de morros com parallax, luz no centro e névoa no fundo. Objetos nas margens (árvores, estátuas, cruzes, caixas) crescem com a perspectiva e passam pela câmera na marcha entre ondas.
- **Efeitos:** explosão na morte dos goblins, caveira que surge e afunda nos outros monstros, tremor de tela nos golpes fortes, números de dano flutuantes.
- **Interface:** painéis, botões, fitas e barras do pacote de UI do Tiny Swords (9-slice), tema escuro roxo. O acampamento tem um vídeo de fogueira ao fundo.
- **Áudio:** efeitos sintetizados na hora (Web Audio, sem arquivos). Música em arquivo: "Victory's Dawn" na batalha e duas faixas "Campfire Tales" alternando no acampamento, em volume baixo para os efeitos ficarem audíveis.

## 14. Interface e Controles

### 14.1 Acampamento
Barra de recursos (sangue, tochas com o tempo da próxima recarga, Souls), card do herói animado, botões laterais Mercado e Baú do Dia, Forja de Dados, Atributos, botão de entrar na masmorra, contador de masmorras vencidas, nuvem, som e "zerar progresso".

### 14.2 Batalha
- **Topo:** log de uma linha e o chip "MASMORRA NV. X · bioma · ONDA n/3 · sangue". Na onda do chefe, uma barra de vida fixa dele.
- **Campo:** o corredor; setas ◀ ▶ para trocar de alvo; o alvo aparece entre colchetes.
- **Mesa de dados:** os dados da rolagem (tocar trava), soma e combinação, botão "Re-rolar ×N".
- **Comandos:** lista à direita do herói: Atacar, Ataque especial, Poção. "Fugir" fica ao lado da barra de turnos.
- **Gestos:** tocar (parry, travar golpes do Combo e da Sequência Mortal), arrastar para cima (salto), deslizar para o lado (esquiva e troca de alvo), arrastar do herói ao monstro (pedrada). No teclado: setas, Espaço e Enter.

### 14.3 Campo de Treinamento
Tutorial guiado na primeira entrada, contra um Boneco de Treino (60 HP, ATK 5), com uma mão emprestada de 3×D6 e todos os especiais liberados: pedrada → rolagem e re-rolagem → ataque → parry (repete até sair perfeito) → salto (idem) → especial com uma trinca de 5 garantida → terminar o boneco. Os golpes do boneco vêm em câmera lenta (1,4 s) e o herói não morre. Concluir dá **+100 de sangue**; dá para pular.

## 15. Persistência, Nuvem e Monetização

- **Save local:** `localStorage`, chave `rpg-guerreiro-v3`. Guarda sangue (no campo `gold`), dados, re-rolagens, atributos, tochas e relógio de recarga, mapas, Souls, nível e cor de masmorra, NG+, gemas, baú do dia, tutorial, som e a progressão de cada herói. Saves de antes dos dados são convertidos: o antigo Ataque vira uma mão de poder médio equivalente, comprando o dado ou a face mais barata até alcançá-lo.
- **Nuvem:** login com Google e Firestore (`saves/{uid}`), opcional. "Salvar campanha na nuvem" envia; "Já tenho uma campanha salva" só carrega, nunca sobrescreve a nuvem. No Android, usa o login nativo (o popup não funciona no WebView).
- **Anúncios:** vídeo premiado no Baú do Dia e para dobrar o bônus de vitória; intersticial a cada 5 entradas na masmorra. Na web, AdSense H5 Games Ads; no app, AdMob; sem nenhum dos dois, um anúncio simulado de 5 s (premiado) ou 3 s (intersticial).
- **No protótipo deste repositório:** sem AdSense (cai no simulado), sem nuvem e com save próprio `guerreiro-v2-save-v1` (ver o README do protótipo).

## 16. Escopo

**Dentro (é o jogo publicado hoje):** Guerreiro com dados, reações, os 4 especiais pela Habilidade, pedrada e poções; Forja de Dados; 33 masmorras com NG+, todos os monstros e chefes, escudo, Fase 2, Monge, goblins de fogo; acampamento, Mercado, gemas, Tochas, Souls, Baú do Dia, tutorial, save local, nuvem, anúncios.

**Fora (código pronto e desligado):** Mago Arcanista, Caçadora, Lanceiro e Monge jogáveis, troca de herói, mapa-múndi, duelos e recrutamento.

**Ainda não existe:** um guia de implementação Unity para a v2 (o de [`GuerreiroDaMasmorra.md`](GuerreiroDaMasmorra.md) cobre a versão anterior, sem os dados).

## 17. Em aberto

1. **Lâmina Invisível com quadra ou quinta.** O requisito é "dois pares ou sequência", e o código não conta uma quadra nem uma quinta como dois pares. A mão mais rara do jogo não libera esse especial. Decidir se é intencional.
2. **Restos da Fúria no texto.** Logs ainda dizem "+1 ⚡" e "fúria" ao ganhar re-rolagem; o Selo da Fúria avisa que "a barra de fúria não enche"; o botão do especial chama "Fúria". Decidir os nomes novos (o especial pode continuar "Fúria"?).
3. **Teto de Tochas na tela.** O acampamento e o Mercado mostram "/20", mas o teto no código é 5.
4. **"Sangue e Souls em dobro"** na masmorra sem dano: só o bônus de vitória e as Souls dobram; o sangue de cada monstro, não. Ajustar o texto ou a regra.
5. **Mago sem Ataque.** O poder das cartas e o Ataque simples do Mago usam o atributo `atk`, que não se compra mais. Se o Mago voltar, ele precisa de um caminho de progressão (dados próprios? cartas compradas na Forja?).
6. **Identidade de Caçadora, Lanceiro e Monge** e **quando religar** mapa-múndi, recrutamento e troca de herói (herdado da versão anterior).
7. **Diferenças do `GDD.md` da v2 para o código**, resolvidas aqui a favor do código: o `GDD.md` ainda descreve Ataque comprável, Fúria 0–5, Tochas de 40 ouro com teto 20 e especiais pagos com Fúria. Confirmar que o código é a intenção.
8. **Guia Unity da v2:** escrever um guia próprio ou estender o do `GuerreiroDaMasmorra.md` com os dados.

## Histórico de versões

- **0.1.0** (2026-10-26): início do versionamento; marca o estado do GDD e do protótipo neste dia.
