# Game Design Document (GDD)

> **Status:** Rascunho vivo — este documento deve ser atualizado conforme decisões forem tomadas durante o desenvolvimento.
> **Título:** Requiem of Blessings
> **Plataforma:** Mobile (Android — lançamento inicial; iOS a considerar depois, se o jogo validar)
> **Motor:** Unity
> **Gênero:** RPG Ativo (Active/Real-time-influenced Turn-Based RPG)
> **Tema:** Fantasia sombria (dark fantasy)
> **Estilo visual:** Pixel art
> **Última atualização:** [preencher data]

---

## 1. Visão Geral

Um RPG mobile de fantasia sombria, com sistema de turnos onde a passividade do jogador é substituída por participação ativa: durante o turno do inimigo, o jogador pode **esquivar** ou **fazer parry** (botões distintos); durante seus próprios turnos, golpes especiais envolvem uma **interação em tela** que pode aumentar o dano causado.

O jogo alterna entre duas telas principais:
- **Acampamento**: hub entre expedições, onde o jogador investe Almas em atributos.
- **Batalha**: 1 herói vs. múltiplos inimigos, combate por turnos com camadas de habilidade (skill-based).

Não existe dinheiro no mundo do jogo. A moeda universal são **Almas**, extraídas de monstros derrotados.

### 1.1 Pilares de Design
1. **Turno não é passivo** — o jogador está sempre "com a mão no controle", mesmo no turno do inimigo.
2. **Risco recompensado por habilidade** — parry/timing perfeito deve valer mais que jogar seguro.
3. **Progressão legível** — três atributos simples (Força, Vitalidade, Conhecimento) tornam decisões de build claras.
4. **Risco de perda tem peso narrativo e mecânico** — morrer não é só "game over", é deixar algo importante pra trás no mundo (ver seção 5.1).
5. **Sessões mobile-friendly** — expedições e batalhas devem caber em sessões curtas; o sistema de Tochas (seção 2.1) reforça esse ritmo de sessões espaçadas, comum em jogos mobile.

---

## 2. Gameplay Loop

```
[ACAMPAMENTO] → escolhe expedição → [BATALHA: 1 herói vs. N inimigos] → vitória/derrota
      ↑                                                                       │
      └───────────────────── ganha Almas / itens ────────────────────────────┘
```

No Acampamento, o jogador gasta Almas para subir níveis (independentes entre si, com custo crescente) em:
- **Força** → aumenta Ataque e Defesa
- **Vitalidade** → aumenta HP máximo
- **Conhecimento** → aumenta o ganho de Almas por expedição

### 2.1 Sistema de Tochas (Energia)

Para entrar em uma expedição, o jogador precisa de **1 tocha**.

- **Estoque máximo: 5 tochas.**
- O jogador começa com 5 (cheio).
- **Recarga: 1 tocha a cada 10 minutos**, até o máximo de 5.
- Se as tochas acabarem, o jogador pode **assistir um vídeo de publicidade** para ganhar **1 tocha extra** imediatamente (sem esperar a recarga). **Sem limite diário** de quantos vídeos pode assistir para isso.

Esse sistema regula quantas expedições o jogador pode fazer em sequência, criando pausas naturais na sessão — comum em jogos mobile como um "sistema de energia/estamina".

### 2.2 Estrutura de Conteúdo e NG+

- O jogo tem um total de **42 masmorras**, **agrupadas em "mundos"/capítulos de 7 em 7** (ou seja, **6 mundos** no total, cada um com 7 masmorras).
- Ao derrotar a masmorra 42 (a última), o jogador entra em **NG+ (New Game Plus)**:
  - Mantém **todos os atributos e progressão já conquistados** (Força, Vitalidade, Conhecimento, habilidades da árvore, gemas — nada é resetado).
  - Os monstros recebem um **multiplicador de dificuldade que cresce a cada ciclo**: NG+ = +20% em todos os stats, NG++ = +40%, NG+++ = +60%, e assim por diante (incremento fixo de +20% por ciclo).
- **Ciclos infinitos**: não existe um NG+ máximo — o jogador pode continuar avançando ciclos indefinidamente, cada um 20% mais difícil que o anterior.

> **Confirmado:** cada um dos 6 mundos tem **nome/tema/paleta próprio** (visual e possivelmente tipos de inimigo característicos) — a definir os nomes/temas específicos junto com a direção de arte.

---

## 3. Sistema de Batalha

### 3.1 Estrutura de turno

**Turno do Jogador** — segue uma ordem específica de ações:
1. **Ações pré-ataque (opcionais, podem ser combinadas)**: o jogador pode **jogar uma pedra** e/ou **usar um item** antes de atacar.
2. **Ataque (ação final do turno)**: ataque normal ou golpe especial. Depois de atacar, **o turno termina imediatamente** — não é possível fazer mais nada (nem outra ação pré-ataque, nem outro ataque) até o próximo turno do jogador.

> **Jogar Pedra**: causa dano baixo (cerca de **5-10% do dano de um ataque normal**, valor inicial a balancear) e remove escudo do inimigo (funciona como um hit para fins do sistema de escudo — ver seção 3.3). É uma ação pré-ataque, então pode ser usada antes do ataque final do turno para "abrir caminho" removendo escudo sem gastar o ataque principal nisso. **Base: 1 pedra por turno** (sem upgrade na árvore — ver ramo de Pedra na seção 4.1 para aumentar essa quantidade).

**Itens usáveis** (parte das ações pré-ataque):
- **Elixir de HP**: recupera **40% do HP máximo** do herói.
- **Elixir de Bênção**: completa a Benção Divina para o máximo (**5 pontos**), instantaneamente.
- **Estoque: 3 unidades de cada tipo por expedição** (6 no total: 3 Elixir de HP + 3 Elixir de Bênção), consumíveis, não recarregam durante a expedição — precisam ser repostos/comprados no Acampamento antes da próxima.

Confirmado: estoque de **3 unidades de cada tipo** (não é compartilhado).

**Ordem e limite do turno:** o jogador pode jogar **1 pedra + 1 item** por turno (ambos opcionais) antes do ataque final. Jogar pedra em si não tem limite adicional por batalha (além do 1 por turno).

**Turno do Inimigo:** cada inimigo faz **uma** ação por turno — ataca **ou** invoca escudo (seção 3.3, sem telégrafo — é uma surpresa), nunca os dois. O ataque sempre vem com um telégrafo visual (**Slash FX**), mas existem **dois tipos de ataque**, diferenciados pela aparência do telégrafo:

| Tipo de ataque | Visual do Slash FX | Defesa possível | Dano |
|---|---|---|---|
| **Ataque Telegrafado** | Arco **branco-amarelado, largo** (mais lento de ler/reagir) | Jogador escolhe entre **Esquiva** ou **Parry** | Dano normal |
| **Ataque Rápido** | Arco **vermelho, fino** (mais rápido) | **Só Esquiva**, via uma **Sequência de Desvio** — múltiplos inputs de esquiva em sequência (tipo QTE de vários toques, quantidade **varia por inimigo/dificuldade**). **Parry é impossível** nesse tipo. | **Dano aumentado** (funciona como um "crítico" — compensa ser mais arriscado de evitar por completo) |

- **Sequência de Desvio com acerto parcial:** se o jogador acerta só parte dos toques (ex: 2 de 3), o **dano é reduzido proporcionalmente** em vez de ser tudo ou nada — recompensa reação parcial mesmo sem cravar a sequência inteira.
- **Frequência do Ataque Rápido:** os inimigos **não usam com muita frequência no início do jogo** — é uma ameaça que aparece com mais frequência **em masmorras/níveis mais avançados**, aumentando a exigência de reflexo conforme o jogo progride.
- **Todo inimigo pode usar os dois tipos de ataque** — não é uma característica exclusiva de certos monstros/fases; o que muda é a frequência de cada tipo conforme o progresso do jogador.
- **Ataque corpo a corpo:** o inimigo se aproxima do herói e ataca, podendo ser um **golpe único** ou uma **sequência de golpes (combo)** — o combo é, na prática, múltiplos telégrafos/janelas de reação em sequência antes do turno do inimigo terminar.
- **Ataque à distância (Arqueiro/Mago):** o inimigo **não se aproxima** — em vez disso, lança um **projétil** à distância. O projétil também é telegrafado (mesmo sistema de Slash FX/arco) e pode ser **esquivado ou parryado** normalmente, igual a um ataque corpo a corpo.
- Botões de reação:
  - **Botão de Esquiva**: reduz ou anula o dano recebido. **Janela de tempo maior** (mais fácil de acertar) que o Parry, mas **nunca gera contra-ataque**.
  - **Botão de Parry**: só funciona contra Ataque Telegrafado; **janela de tempo menor** (mais difícil), mas se executado no timing exato, anula o dano e **gera contra-ataque** — essa é a única forma de contra-atacar no jogo. O contra-ataque causa dano **baseado no Ataque do herói** (escala com Força/nível, mesma fórmula de dano normal). Não gera Benção Divina extra por padrão — só gera se o jogador tiver a **Gema do Parry Abençoado** equipada (seção 4.2).
- **Falha no timing:** se o jogador não reagir a tempo (ou errar — incluindo errar um dos toques da Sequência de Desvio), simplesmente toma o dano normal do golpe — sem penalidade adicional.
- **Combo corpo a corpo:** o jogador reage a **cada golpe individualmente** — cada golpe do combo tem seu próprio telégrafo e sua própria janela de Esquiva/Parry, em sequência.

**Escolha do tipo de ataque:** o inimigo escolhe entre Ataque Telegrafado e Ataque Rápido **aleatoriamente**, respeitando o peso/probabilidade que sobe conforme a masmorra avança (não é um padrão fixo/previsível como "alterna a cada N turnos").

**Múltiplos inimigos:** os telégrafos acontecem **sequencialmente** — um inimigo por vez, o jogador reage a cada um antes do próximo agir.

### 3.2 Habilidades Especiais e Benção Divina

O herói possui um recurso próprio chamado **Benção Divina**, que funciona de forma diferente de um "mana bar" tradicional:

- Começa a batalha com **1 ponto**.
- Ganha **+1 ponto a cada novo turno**, independentemente de uso (não é gerado por dano/ação — é automático por turno).
- **Limite máximo: 5 pontos** (não acumula além disso caso o jogador não use).
- Cada habilidade especial gasta uma quantidade fixa entre **1 e 5** Benção Divina, definida por habilidade (habilidades mais fortes/mais difíceis custam mais).

Isso cria um ritmo natural de "esperar e explodir": o jogador pode gastar cedo em habilidades baratas ou guardar até 5 pontos para usar a habilidade mais cara/poderosa.

#### Loadout de expedição
- O jogo tem um **pool crescente de habilidades especiais**, aprendidas na Árvore de Conhecimento das Almas (seção 4.1).
- Antes de cada expedição, no Acampamento, o jogador escolhe **3 habilidades especiais** dentre as que já aprendeu para equipar — só essas 3 ficam disponíveis durante a batalha.
- **Combinação livre**: não há restrição de repetir tipo de interação ou categoria de dano no loadout — o jogador pode equipar qualquer combinação de 3.
- Cada habilidade tem: um tipo de interação em tela (barra de precisão, sequência de gestos, hold/release, ou ritmo — ver tipos na seção anterior), um custo em Benção Divina (1–5) e um efeito (dano bônus — **no MVP, habilidades são só de dano**; cura/buff/debuff ficam para depois do MVP).

### 3.3 Sistema de Escudos dos Inimigos

Inimigos podem ter **escudos** — enquanto um inimigo tiver ao menos 1 escudo ativo, ele **não recebe dano no HP**. Cada escudo precisa ser removido (1 hit = 1 escudo removido) antes que o dano comece a afetar o HP do inimigo de fato.

- **Escudos são invocados pelo próprio inimigo**, como se fosse o uso de uma habilidade dele durante o turno — **isso substitui o ataque do inimigo naquele turno** (invocar escudo é uma alternativa a atacar, não algo que acontece junto com o ataque). **Não aparece telegrafado** — o jogador só sabe que aconteceu quando o escudo já está ativo (diferente do ataque, que é avisado com antecedência).
- **Limite máximo: 10 escudos** por inimigo — invocações podem **somar em cima de escudos já existentes**, até esse teto (não precisa estar zerado pra invocar de novo).
- **Só tipos/bosses específicos** podem invocar escudo — não é uma habilidade universal de todo inimigo comum.
- **Hits excedentes viram dano normal na mesma ação**: se o inimigo tem 1 escudo e a habilidade do jogador causa 2 hits, o primeiro hit remove o escudo e o segundo hit já causa dano no HP normalmente (os hits não são desperdiçados — o "excesso" depois de zerar os escudos é aplicado como dano na mesma resolução).

Isso é o que dá propósito mecânico às três categorias de habilidades da Árvore de Conhecimento das Almas (seção 4.1): o **número de hits** de uma habilidade (não só o dano) importa para lidar com escudos, especialmente quando vários inimigos em campo têm escudos ao mesmo tempo.

### 3.4 Categorias de Habilidades Especiais (Árvore de Conhecimento das Almas)

Ver estrutura completa na seção 4.1 — resumo rápido de como cada categoria interage com o sistema de escudos:

| Categoria | Como funciona | Bom contra |
|---|---|---|
| **Dano Elevado** | 1 ou mais hits concentrados em **um único monstro** (alvo escolhido) | Inimigo com muitos escudos empilhados |
| **Dano em Área** | Atinge **todos os monstros** em campo, 1 ou mais vezes cada | Vários inimigos com poucos escudos cada |
| **Dano Aleatório** | Muitos hits distribuídos **aleatoriamente** entre os monstros em campo | Situações imprevisíveis / grupos grandes, mas sem controle sobre qual escudo remover primeiro |

O número de hits de cada habilidade aumenta conforme a posição/profundidade dela na árvore (habilidades mais avançadas = mais hits).

### 3.5 Fim de batalha
- **Vitória** → recompensas em Almas (modificadas por Conhecimento) + possíveis itens/drops.
- **Derrota** → ver sistema de Almas Perdidas (seção 5.1).

### 3.6 Bosses com Múltiplas Fases

**Só bosses específicos/mais avançados** têm **2 fases** na mesma luta (não é uma regra universal — a maioria dos bosses tem só 1 fase).

- Ao atingir **50% de HP restante** (gatilho sempre baseado em % de HP, consistente entre todos os bosses com 2 fases), o boss **entra na segunda fase**, podendo **mudar de forma** (visual/animação diferente).
- **Durante a animação de transição, o boss fica invencível/protegido** — o jogador não consegue causar dano nesse intervalo, evitando que ele "atropele" a transição visual.
- Na segunda fase, o boss usa **combos mais complexos**, **ataques mais frequentes**, e **invoca escudo com mais frequência** também — a pressão aumenta em todas as frentes, não só nos ataques.

### 3.7 Sistema de Quebra (Break)

Tanto o **herói** quanto os **monstros** têm um **Contador de Quebra** — um mecanismo separado do HP que, ao ser preenchido, incapacita o alvo por uma rodada inteira.

#### Quebra do Herói
- Conta **hits recebidos** (não dano acumulado — cada golpe sofrido conta 1, não importa o dano dele).
- **Acumula durante toda a batalha** (não reseta a cada turno) até atingir o limiar.
- **Limiar inicial: 3 hits.** Sobe conforme o nível de **Força** do herói, até um máximo de **10 hits** (mais Força = mais resistente a quebrar — Força ganha então um terceiro efeito, além de Ataque/Defesa já documentados na seção 4).
- Ao quebrar, o herói **perde a rodada inteira**: não pode esquivar, não pode fazer parry, não pode atacar, **nem jogar pedra ou usar item** — o turno inteiro (pré-ataque + ataque) é bloqueado, e ele também fica incapaz de reagir aos ataques do inimigo naquela rodada.
- Depois de quebrar, o **contador reseta para 0** e volta a acumular — o herói pode quebrar mais de uma vez na mesma batalha se levar hits suficientes de novo.

#### Quebra do Monstro
- Conta **hits recebidos especificamente de Ataque Especial** do herói (ataque normal e Pedra **não contam** para isso — é uma mecânica pensada pra recompensar o uso das habilidades da Árvore de Conhecimento das Almas).
- **Só conta hits de habilidades de Dano Elevado** (foco total em um único monstro) — hits de habilidades de **Área ou Aleatório**, mesmo que atinjam aquele monstro, **não contribuem** para o contador de quebra dele. Isso cria uma escolha tática clara: Área/Aleatório removem escudo e causam dano em vários alvos, mas só o Dano Elevado quebra de fato.
- Também **acumula a batalha inteira** até quebrar, mesmo padrão do herói.
- **Limiar entre 3 e 10 hits**, escalando **diretamente com o número da masmorra**: a masmorra 1 tem limiar 3, a masmorra 42 tem limiar 10, distribuído de forma crescente ao longo das 42 masmorras (ex.: `Limiar = Round(3 + (NúmeroDaMasmorra - 1) * 7 / 41)`, arredondando para o inteiro mais próximo). Não é uma propriedade fixa do tipo de monstro — o mesmo tipo de monstro tem limiares diferentes dependendo de em qual masmorra ele aparece. Em NG+/NG++/etc., o limiar da masmorra continua o mesmo, mas o **multiplicador de dificuldade geral do ciclo** (seção 2.2) ainda torna o monstro mais difícil de quebrar em termos absolutos de dano/HP.
- Ao quebrar, o monstro **perde o turno dele** (não ataca nem invoca escudo) **e fica vulnerável**: recebe **+50% de dano** enquanto durar esse estado.
- **Duração da vulnerabilidade:** dura **até o próximo ataque do jogador** (não é só "aquela rodada" — se o jogador demorar a agir, a vulnerabilidade persiste até ele efetivamente atacar de novo, garantindo que o bônus sempre seja aproveitado).
- Depois de quebrar, o **contador reseta para 0** e pode quebrar de novo mais tarde na mesma batalha.

> **Nota de implementação:** esse sistema é conceitualmente parecido com "Break"/"Stagger" de jogos como Final Fantasy XIII ou Sekiro — vale a pena ter isso em mente como referência de game feel ao implementar o feedback visual (algo precisa deixar claro pro jogador que o contador está enchendo, tipo uma barrinha visível).

### 3.8 Sistema de Recuperação (Velocidade de Ação)

Depois de um **ataque de dano alto** ou uma **sequência longa (combo)**, quem atacou demora mais tempo para agir de novo — um "custo" de recuperação proporcional ao quão forte foi a ação.

- **Aplica-se a ambos**: tanto ao herói quanto aos monstros — qualquer um que solte um golpe forte ou um combo longo sofre a mesma penalidade de recuperação.
- **Gatilho duplo**: entra em recuperação quem ultrapassar um limiar de **dano causado** OU um limiar de **número de hits** no combo/ataque — qualquer um dos dois critérios já é suficiente pra disparar a recuperação (não precisam acontecer os dois ao mesmo tempo).
- **Efeito**: quem entra em recuperação **pula o próprio próximo turno inteiro** — na prática, isso funciona como dar ao adversário uma ação extra "de graça" antes que o atacante volte a agir.
- **Sem interação com o Sistema de Quebra**: os dois sistemas são **independentes**. O ataque recebido durante a Recuperação conta pro dano/HP normalmente, mas **não** dá nenhum bônus especial ao contador de Quebra (seção 3.7) — são mecânicas separadas, cada uma com seu próprio gatilho e efeito.
- **Risco intencional em habilidades fortes:** é **proposital** que habilidades de Dano Elevado com muitos hits (as mais fortes do jogo) quase sempre disparem Recuperação — faz parte do trade-off de usar o golpe mais poderoso: alto risco (ficar exposto depois), alta recompensa (dano/quebra). Não há exceção planejada para evitar isso.
- **Feedback visual:** a entidade em recuperação recebe **ícone/símbolo visível sobre o personagem** **e** uma **animação de cansaço/ofegante** — os dois ao mesmo tempo, pra deixar bem claro (tanto por ícone quanto por movimento) que aquele turno está comprometido.

> **Critério confirmado**: dispara Recuperação **quando qualquer um dos dois limiares for atingido primeiro** — seja o de dano (ex: dano acima de um valor configurável) ou o de número de hits (ex: 3+ hits no mesmo golpe/combo). Os valores numéricos exatos de cada limiar (que podem ser diferentes para o herói vs. cada tipo de monstro/boss) ainda precisam de uma passada de balanceamento durante o playtesting.

### 3.9 Sistema de Queima (Burn)

Alguns monstros têm ataques de **fogo** — magias de fogo, espadas em chamas, ou até **bombas** arremessadas — que, além do dano normal do golpe (se houver), aplicam **ícones de fogo (queimado)** no herói.

- **Acúmulo**: os ícones de fogo **se acumulam sem limite** ao longo da batalha — cada ataque de fogo que acerta o herói soma mais ícones.
- **Esquiva/Parry evita tudo**: se o herói esquiva ou faz parry com sucesso de um ataque de fogo, ele **não recebe os ícones** — evitar o golpe evita a queima também, não só o dano direto do impacto.
- **Gatilho**: **todo início da rodada do herói** (antes das ações pré-ataque), se ele tiver ícones de fogo acumulados, todos são **consumidos de uma vez** e causam dano proporcional à quantidade acumulada.
- **Dano por ícone**: **3% do HP máximo** do herói, multiplicado pela quantidade de ícones acumulados (ex: 4 ícones = 12% do HP máximo de dano de uma vez).
- **Frequência**: **livre** — não existe limite de quantos ataques de fogo um mesmo inimigo pode usar por batalha.
- **Indicador visual**: **ícone com contador numérico** sobre o personagem **e** um **efeito visual de chamas** — os dois ao mesmo tempo, deixando claro tanto a quantidade acumulada quanto o estado de "estar pegando fogo".

**Queima em monstros:** o herói também pode aplicar Queima nos monstros, através de:
- Uma **habilidade especial de elemento fogo** (uma variante das habilidades da Árvore de Conhecimento das Almas com propriedade de fogo).
- Uma **gema** que substitui a ação de Jogar Pedra por **Jogar Bomba** — a Bomba **mantém o efeito padrão da pedra (dano baixo + remove escudo) e também aplica ícones de Queima**, sem substituir nada — é um upgrade cumulativo da ação de pedra, não uma troca.

- **Mesma regra do herói**: acúmulo sem limite, dano de **3% do HP máximo** do monstro por ícone, consumido todo de uma vez no **início do turno do monstro**, mesma frequência livre e mesmo indicador visual (ícone + efeito de chamas).
- **Ignora escudo**: o dano de Queima **não é bloqueado pelo escudo** do monstro — é um dano de status, não conta como "hit" para os fins do Sistema de Escudos (seção 3.3) nem do Sistema de Quebra (seção 3.7).

---

## 4. Sistema de Progressão (Atributos)

Cada atributo é um **nível independente**, com custo em Almas crescente a cada nível (ex: nível 2 custa mais que nível 1, e assim por diante — curva exata a definir/balancear).

| Atributo | Efeito | Observações |
|---|---|---|
| Força | ↑ Ataque, ↑ Defesa, ↑ Limiar de Quebra do herói | Atributo ofensivo/defensivo padrão, também torna o herói mais resistente a quebrar (seção 3.7) |
| Vitalidade | ↑ HP máximo | Sobrevivência |
| Conhecimento | ↑ Ganho de Almas por expedição | Atributo "econômico", incentiva builds de farm |

#### Proposta inicial de balanceamento (ajustar via playtesting)

**Custo para subir de nível** (mesma curva para os três atributos — curva exponencial suave, comum em jogos com progressão incremental):

```
Custo(N) = Arredondar(20 * 1.12^(N-1))
```
Onde `N` é o nível que está sendo comprado (ex: custo para ir do nível 0 → 1 usa N=1).

| Nível | Custo aproximado (Almas) |
|---|---|
| 1 | 20 |
| 5 | ~31 |
| 10 | ~55 |
| 20 | ~172 |

> A curva exponencial (em vez de linear) faz cada nível pesar mais que o anterior, incentivando decisões de build ao invés de simplesmente maximizar um atributo sem esforço.

**Fórmulas de efeito** (valores iniciais, fáceis de expor como campos num ScriptableObject no Unity para ajuste rápido):

- **Força:** `Ataque = AtaqueBase + Força * 2` | `Defesa = DefesaBase + Força * 1` | **Limiar de Quebra:** por faixas — a cada **5 níveis de Força**, o limiar sobe **+1** (começando em 3, até o máximo de 10 — ou seja, seriam necessários 35 níveis de Força pra atingir o limiar máximo).
- **Vitalidade:** `HP Máximo = HPBase + Vitalidade * 10`
- **Conhecimento:** `Multiplicador de Almas = 1 + (Conhecimento * 0.05)` (cada nível = +5% de Almas ganhas por expedição)

> Esses números são um ponto de partida, não valores finais — a expectativa é ajustá-los durante o playtesting do MVP.

### 4.1 Árvore de Conhecimento das Almas (Skill Tree)

Segundo recurso de progressão do jogo, independente das Almas:

- **Conhecimento das Almas**: obtido **sempre que um boss é derrotado** (não vem de monstros comuns).
- Gasto no Acampamento para **aprender novas habilidades especiais** em uma **árvore de conhecimento** (skill tree).
- As habilidades aprendidas ficam disponíveis no "pool" do jogador, mas só entram em batalha se forem escolhidas no loadout de 3 (seção 3.2).

Isso cria dois eixos de progressão bem separados:
- **Almas** → progressão "vertical" (atributos: Força, Vitalidade, Conhecimento) — sobe o quão forte o herói é nos fundamentos.
- **Conhecimento das Almas** → progressão "horizontal/build" (quais habilidades especiais existem para equipar) — sobe o repertório tático do jogador.

#### Estrutura da árvore: 4 ramos

A árvore é dividida em **4 ramos**, três de categorias de dano com habilidade especial (ver também seção 3.4) e um de melhoria da Pedra:

1. **Dano Elevado** — hits concentrados em um único monstro (alvo escolhido pelo jogador). Bom para "focar" um inimigo específico, como um com muitos escudos.
2. **Dano em Área** — atinge todos os monstros em campo, uma ou mais vezes cada. Bom para remover escudos de vários inimigos ao mesmo tempo.
3. **Dano Aleatório** — muitos hits distribuídos aleatoriamente entre os monstros em campo. Sem controle de alvo, mas potencialmente muitos hits no total.
4. **Pedra** — melhora a ação de jogar pedra (seção 3.1): aumenta o **número de pedras** que podem ser arremessadas por turno e o **dano** que cada pedra causa. Diferente dos outros 3 ramos, não usa Benção Divina nem ocupa um slot do loadout de 3 habilidades — é uma melhoria direta da ação pré-ataque, sempre disponível.

Dentro de cada ramo, **avançar na árvore aumenta o número de hits** da habilidade correspondente (ex: uma habilidade de Dano Elevado no início da árvore pode bater 1 vez; mais pra frente no mesmo ramo, bate 2-3 vezes no mesmo alvo). No ramo de Pedra, avançar aumenta quantidade de pedras/turno e dano por pedra.

- **Progressão dentro de cada ramo:** não é puramente linear — tem **bifurcações**, ou seja, o jogador escolhe entre caminhos alternativos dentro do mesmo ramo (builds diferentes mesmo dentro da mesma categoria de dano).
- **Nós híbridos:** existem, em pontos avançados da árvore — combinam efeito de 2 ramos de dano no mesmo golpe (ex: um nó avançado pode ser "Dano Elevado + Área" simultâneo).
- **Custo de Conhecimento das Almas:** crescente conforme o jogador avança dentro do ramo (nós mais profundos custam mais).
- **Conhecimento das Almas por boss:** quantidade **fixa**, não escala com a dificuldade do boss (todo boss dá a mesma quantidade).
- **Nós passivos:** não existem — a árvore contém **apenas** habilidades especiais (3 ramos de dano) e melhorias de Pedra (1 ramo), sem nós passivos genéricos (como +HP ou +cap de Benção Divina).

> **Estrutura da árvore definida como enxuta**: **2 caminhos alternativos por ramo**, com aproximadamente **5-8 nós por ramo** (nos 4 ramos: Dano Elevado, Área, Aleatório e Pedra). Valor inicial (nível 0/sem upgrade) de número de pedras por turno e dano por pedra seguem os valores já definidos nas seções 3.1 e 4.2.

### 4.2 Forja de Gemas

Um terceiro uso para Almas (além de subir nível de atributos): **forjar Gemas** — itens que concedem **habilidades passivas** permanentes.

**Gemas propostas pelo design inicial:**

| Gema | Efeito |
|---|---|
| Gema da Vitalidade em Parry | +5% de HP recuperado ao executar um parry com sucesso |
| Gema do Golpe Abençoado | +1 Benção Divina ao acertar um ataque básico |
| Gema do Parry Abençoado | +1 Benção Divina ao executar um parry com sucesso |
| Gema da Devoção | +1 no limite máximo de Benção Divina (ou uma variante +2, de tier mais raro/caro) |
| Gema do Incendiário | Substitui a ação de Jogar Pedra por **Jogar Bomba** — mantém o dano baixo + remoção de escudo da pedra normal, e **também aplica ícones de Queima** no monstro (seção 3.9) |

- Ao forjar, o jogador pode **equipar até 2 gemas simultaneamente** (slots de equipamento, similar ao loadout de habilidades).
- Gemas ficam guardadas no "cofre" do jogador depois de forjadas (não se perdem ao trocar o que está equipado — só trocam de slot).
- **Custo em Almas**: crescente a cada gema forjada (a N-ésima gema forjada custa mais que a anterior — mesmo espírito da curva de custo dos atributos, seção 4).
- **Forja é aleatória, com proteção contra azar (ambos os mecanismos)**: ao forjar, o jogador não escolhe a gema exata — ela sai de um **pool aleatório** de possibilidades, mas com duas camadas de proteção: (1) **chance reduzida de repetir** uma gema que o jogador já possui, e (2) um **sistema de "pity"** que garante uma gema nova/melhor após um certo número de forjas sem sorte.
- **Gemas são fixas**: não podem ser fundidas ou melhoradas depois de forjadas (se quiser uma gema melhor, precisa forjar de novo e torcer para o resultado aleatório).

---

## 5. Economia — Almas

- Única moeda e único recurso do jogo (substitui dinheiro no lore).
- Obtida derrotando monstros em expedições.
- Gasta em: subir níveis de Força, Vitalidade e Conhecimento no Acampamento.
- Não há outros recursos (sem crafting, sem itens raros de drop) — o escopo fica mais enxuto e focado, além de Gemas (seção 4.2), que também usam Almas como custo.

### 5.1 Almas Perdidas (mecânica de morte)
Quando o herói morre em uma expedição, o **monstro que o matou fica com as Almas acumuladas naquela expedição** (elas não são perdidas imediatamente).

- Se o jogador voltar àquela expedição e **derrotar esse monstro específico**, recupera as Almas.
- Se o herói **morrer de novo antes de recuperá-las**, as Almas daquela tentativa anterior são perdidas definitivamente.

> Isso cria uma mecânica de risco/recompensa no estilo "recuperar sua marca de sangue" (referência conceitual: Dark Souls), adaptada ao tema de Almas do jogo. O monstro guardião das Almas **fica marcado visualmente** (brilho/aura), facilitando reconhecê-lo ao voltar à expedição — mas é **o mesmo monstro de sempre** em termos de força/stats, não ganha nenhum buff por carregar as Almas.
>
> **Válido desde a primeira masmorra** — não há isenção de tutorial, a mecânica se aplica desde o início do jogo.

### 5.2 Visão Divina (multiplicador de recompensa via anúncio)

Ao **vencer uma expedição**, o jogador pode assistir a um vídeo de publicidade para **triplicar os ganhos de Almas** daquela expedição.

> Nome sugerido para manter o tom de lore (deuses, orações, almas): **"Visão Divina"** — o herói recebe uma visão/bênção dos deuses que triplica o valor espiritual (Almas) colhido na expedição. Alternativas no mesmo tom: "Comunhão das Almas", "Bênção Tríplice", "Oração Final".

Disponível em **toda vitória, sem limite diário** de usos.

### 5.3 Missões Diárias

Fonte adicional de Almas, renovada diariamente, incentivando o jogador a voltar todo dia (retenção).

**Exemplos de missão fornecidos:**
- Derrotar 5 bosses
- Ganhar 1000 Almas (numa sessão/dia)
- Acertar 10 parries
- Vencer uma masmorra sem levar dano
- Vencer uma masmorra sem usar parry

Esse conjunto já sugere que as missões cobrem **categorias diferentes de objetivo**: quantidade de combate (bosses derrotados), economia (Almas ganhas), execução de habilidade (parries acertados), e desafios de restrição (sem dano, sem parry) — bom design de missão diária costuma misturar essas categorias pra agradar tipos diferentes de jogador.

**Regras definidas:**
- **3 missões fixas por dia** (não sorteadas de um pool maior — o mesmo conjunto de 3 categorias todo dia, com metas possivelmente variando).
- **Recompensa varia por dificuldade**: missões de restrição (ex: "sem levar dano", "sem parry") valem mais Almas do que missões simples de quantidade.
- **Bônus por completar todas as 3**: existe uma recompensa extra além da soma das recompensas individuais.
- **Reset: meia-noite local**, no fuso horário do dispositivo do jogador.
- **Progresso acumula o dia inteiro**, mesmo entre expedições diferentes — não precisa ser feito numa única sessão/expedição.

> ⚠️ **Atenção de implementação:** resetar por "meia-noite local do dispositivo" tem o mesmo risco de trapaça do sistema de Tochas (seção 2.1) — um jogador pode adiantar o relógio do celular pra forçar o reset antes da hora. Recomenda-se calcular a meia-noite local **a partir do fuso horário do jogador, mas usando um timestamp de servidor** (Firebase) como referência de "agora", em vez de confiar cegamente em `DateTime.Now` do dispositivo.

---

## 6. Telas do Jogo

### 6.1 Acampamento
**Função:** hub de progressão e preparação.
**Elementos:**
- Contador de Tochas (ex: 3/5, com temporizador de recarga visível)
- Distribuição de Almas em níveis de Força, Vitalidade, Conhecimento (com custo crescente visível)
- Árvore de Conhecimento das Almas (gasto de Conhecimento das Almas) e Forja de Gemas (gasto de Almas), com slots de equipamento de habilidades (3) e gemas (2)
- Seleção de expedição/missão (bloqueada se não houver Tocha, com opção de assistir anúncio para ganhar uma)
- Painel de **Missões Diárias** com progresso de cada uma e botão de coletar recompensa
- Indicação de expedições com Almas pendentes de recuperação (por causa da mecânica da seção 5.1)

### 6.2 Batalha
**Função:** combate por turnos com camada ativa, 1 herói vs. múltiplos inimigos.
**Elementos:**
- HUD de HP do herói e de cada inimigo, com contador de escudos visível por inimigo, e **contador de ícones de Queima** visível em quem estiver queimando (herói ou monstro)
- HUD do recurso de Benção Divina (0-5)
- Indicador visual de telegrafação de ataque/invocação de escudo inimigo + botões de Esquiva/Parry
- Seleção de alvo (múltiplos inimigos)
- Menu de ações pré-ataque: jogar pedra, usar item (Elixir de HP, Elixir de Bênção)
- Interface das 3 habilidades especiais equipadas (loadout), cada uma abrindo sua própria interação
- Menu de ações (Atacar, Especial — ação final do turno, encerra automaticamente)

---

## 7. Narrativa / Lore

- **Tema:** fantasia sombria (dark fantasy).
- **Premissa:** os **Deuses destruíram o mundo** por causa da maldade e da ganância dos homens — a Terra foi arrasada e povoada por **monstros e feras**, virando um verdadeiro inferno. Não existe mais dinheiro nesse mundo; a única coisa que importa é a **Alma**.
- **O que é ser Santo:** só os **Santos** conseguem escapar desse inferno em que a Terra se tornou. Para se tornar um Santo, é preciso **coletar Almas suficientes** para "gozar a eternidade com os deuses".
- **Papel do herói:** o herói caça e mata os monstros para **coletar Almas** — cada Alma colhida é um passo a mais rumo à salvação e à eternidade ao lado dos deuses. A jornada pelas 42 masmorras é, literalmente, a provação do herói para se provar digno de se tornar Santo.
- **Nome do mundo: Terra Cinzenta** — a Terra arrasada pelos deuses, hoje povoada por monstros e feras.

**Como isso já conecta com as mecânicas do jogo (não é só decoração — é o motor de tudo):**
- **Almas** como moeda universal → cada Alma colhida é literalmente progresso espiritual rumo à salvação, não só "dinheiro do jogo".
- **Almas Perdidas** (seção 5.1) → morrer não é só perder recursos, é **perder parte do caminho pra salvação** — o monstro que te matou "rouba" sua chance de ascender, até você recuperá-la.
- **Visão Divina** (seção 5.2) → os deuses concedem uma visão/bênção que triplica a colheita de Almas — encaixa perfeitamente como um "favor divino" literal.
- **Benção Divina** (recurso de golpes especiais) e **Conhecimento das Almas** (árvore de habilidades) → ambos reforçam a ideia de que o herói está sendo instruído/abençoado pelos próprios deuses enquanto avança.

> **Estrutura narrativa fina:** ainda em aberto — se há diálogos/eventos entre masmorras, ou se a narrativa fica só nessa premissa + ambientação visual/textos de flavor. Pode ser definido mais pra frente sem bloquear a implementação.

---

## 8. Arte e Áudio

- **Estilo visual:** Pixel art, tom dark fantasy (paleta sugerida: cores dessaturadas/frias com destaques de cor para elementos importantes como Almas e telegrafos de ataque). **Referência visual principal: Darkest Dungeon** — vale usar como benchmark de atmosfera sombria, iluminação dramática e silhuetas fortes de personagem/inimigo, adaptado pro pixel art (Darkest Dungeon original é ilustrado, não pixel art, mas a direção de arte — contraste alto, paleta escura com destaques pontuais — traduz bem pro pixel art também).
- **Áudio (efeitos sonoros):** usar **bibliotecas gratuitas de efeitos sonoros** (ex: Freesound, OpenGameArt, Kenney.nl, Zapsplat com licença gratuita) em vez de produção própria — decisão já definida, o que ajuda a manter o escopo de áudio enxuto no MVP. Importante checar a licença de cada asset usado (atribuição obrigatória ou não) antes de publicar o jogo.
- **Música:** também vem de **biblioteca gratuita/royalty-free** (mesmo espírito dos efeitos sonoros) — não há trilha original planejada por enquanto.

---

## 9. Escopo Técnico — Notas para Implementação em Unity

### 9.1 Sistemas sugeridos
- **Battle System Core**: state machine para turnos, com suporte a múltiplos inimigos e fila de telégrafos: `PlayerTurn(seleciona alvo/ação) → EnemyTelegraphQueue → InputWindow(Esquiva/Parry ou Sequência de Desvio, conforme tipo) → ResolveDamage → CheckBattleEnd`.
- **Attack Telegraph System**: cada ataque inimigo é resolvido a partir de um `AttackType` (enum: `Telegraphed`, `Quick`), que define tanto o **Slash FX** visual a tocar (arco largo branco-amarelado vs. arco fino vermelho) quanto **quais inputs são aceitos** (Esquiva+Parry vs. só Sequência de Desvio de múltiplos toques, com dano parcial proporcional ao número de toques acertados) e um **multiplicador de dano** (Quick = dano aumentado, tipo "crítico"). A quantidade de toques da Sequência de Desvio e o peso/probabilidade de escolher `Quick` em vez de `Telegraphed` devem ser configuráveis por `EnemyData`/masmorra, já que a frequência de Ataque Rápido sobe conforme o jogo avança.
- **Combo System**: um "turno de ataque" do inimigo pode conter uma lista de golpes (1 para ataque único, N para combo), cada um com seu próprio telégrafo e janela de defesa — resolvidos em sequência antes de passar o turno de volta ao jogador.
- **Special Ability System**: dados de habilidade via ScriptableObject (`nome`, `tipo de interação`, `custo em Benção Divina 1-5`, `categoria: Dano Elevado / Dano em Área / Dano Aleatório`, `número de hits`, `efeito`), com uma interface comum (`ISpecialAttackInteraction`) implementada pelos 4 tipos de interação (barra de precisão, gestos, hold/release, ritmo). Cada habilidade referencia qual interação usa.
- **Enemy Shield System**: cada inimigo tem um contador de escudos (int, máx. 10); dano só afeta HP quando escudos == 0. Ao resolver uma habilidade com N hits: cada hit remove 1 escudo até zerar, hits restantes aplicam dano normal na mesma resolução. Escudos são invocados pelo próprio inimigo como uma ação de turno que **substitui o ataque** naquele turno (o inimigo escolhe entre atacar ou invocar escudo, não faz os dois).
- **Divine Blessing (Benção Divina) Resource System**: contador simples por batalha — começa em 1, +1 por turno, cap em 5, sem geração por dano/ação.
- **Loadout System**: tela/fluxo no Acampamento para escolher 3 das habilidades aprendidas antes de ir para a expedição; a batalha só deve ter acesso a essas 3.
- **Soul Knowledge Skill Tree**: estrutura de árvore de habilidades (nós com pré-requisitos), gerenciando o recurso Conhecimento das Almas (ganho ao derrotar boss) e o progresso de aprendizado do jogador — provavelmente um ScriptableObject Graph ou estrutura de nós customizada.
- **Progression System**: ScriptableObjects para Força/Vitalidade/Conhecimento, cada um com sua própria curva de custo (nível → custo em Almas) e curva de efeito (nível → bônus no atributo derivado).
- **Souls Economy + Death/Recovery System**: gerenciador de Almas com suporte ao estado "Almas perdidas em [expedição X], guardadas por [monstro Y]" — precisa persistir entre sessões (ligado ao sistema de save).
- **Save System**: local + nuvem (cross-device) — **Firebase** definido como provider (considerar Firestore ou Realtime Database para o estado do jogador, e Firebase Auth para identificar o jogador entre dispositivos).
- **Multi-Enemy Targeting**: sistema de seleção de alvo entre múltiplos inimigos na tela de batalha.
- **Player Turn Action System**: controla a ordem do turno do jogador — permite múltiplas ações pré-ataque (jogar pedra, usar itens) antes de uma única ação de ataque final que encerra o turno. Bom candidato a um pequeno state machine dentro do turno do jogador (`PreAttackPhase → AttackPhase → EndTurn`).
- **Stone Throw System**: ação de dano baixo + remoção de escudo (conta como hit no Enemy Shield System), com quantidade por turno e dano base escaláveis por um ramo próprio da árvore (fora do loadout de 3 habilidades, sempre ativo).
- **Item System**: inventário simples de consumíveis (Elixir de HP: +40% HP máximo; Elixir de Bênção: Benção Divina = 5), usados na fase pré-ataque do turno.
- **Torch (Energy) System**: contador de tochas (máx. 5), decrementado ao entrar em expedição, com timer de recarga (+1 a cada 10 min) rodando mesmo com o app fechado (precisa calcular baseado em timestamp salvo, não em um timer local que zera ao fechar o app). Integração com SDK de anúncios recompensados (ex: Unity Ads, AdMob Rewarded) para o fluxo de "assistir vídeo → +1 tocha".
- **Gem System**: ScriptableObjects para as gemas (efeito passivo, custo em Almas), com sistema de "cofre" (gemas forjadas guardadas) e 2 slots de equipamento, aplicando os efeitos passivos nos cálculos de dano/Benção Divina/HP correspondentes.
- **Rewarded Ad Multiplier ("Visão Divina")**: mesmo SDK de anúncios recompensados usado nas tochas, disparado na tela de resultado da expedição vitoriosa, multiplicando por 3 as Almas ganhas antes de creditar ao jogador.
- **Boss Phase System**: máquina de estados dentro da luta de boss (`Phase1 → TransitionAnim → Phase2`), com gatilho configurável por ScriptableObject (ex: % de HP), trocando o conjunto de padrões de ataque/combo e possivelmente o sprite/animação do boss.
- **Break System**: contador de hits (int) tanto no herói quanto em cada `EnemyController`, incrementado por evento (hit recebido pro herói; hit de ataque especial recebido pro monstro), comparado contra um limiar (`BreakThreshold`) calculado a partir de Força (herói) ou dificuldade da masmorra/NG+ (monstro). Ao atingir o limiar: dispara um estado "quebrado" que bloqueia as ações daquela entidade na próxima rodada e reseta o contador para 0. Precisa de um evento/flag visível na UI (barra de quebra) para o jogador acompanhar o progresso.
- **Recovery System**: checagem pós-ação (tanto do herói quanto do monstro) comparando dano causado e número de hits contra limiares configuráveis (independentes do sistema de Quebra — não compartilham contador nem lógica); se qualquer um dos dois for ultrapassado, marca a entidade com um estado "em recuperação" que faz o `BattleManager` pular a próxima ação dela na fila de turnos, além de disparar o ícone + animação de cansaço correspondentes.
- **Burn System**: contador de ícones (int, sem teto) tanto no herói quanto em cada `EnemyController`, incrementado ao ser atingido por um ataque com propriedade `IsFire = true` (só se o ataque **acertar** — esquiva/parry com sucesso zera a aplicação também, não só o dano do impacto). No início do turno de cada entidade (antes de qualquer ação), o sistema verifica o contador de queima: se maior que 0, aplica dano = `contador * 0.03 * HPMáximo` de uma vez, depois zera o contador. Esse dano **não passa pelo Enemy Shield System** (ignora escudo) nem conta para o Break System — é resolvido separadamente dos dois. A ação de Bomba (via gema) reaproveita a mesma lógica da Pedra (dano + remoção de escudo) e adiciona a chamada ao Burn System por cima, sem substituir nada.
- **Daily Mission System**: estrutura de missão via ScriptableObject (`tipo de objetivo`, `meta`, `recompensa em Almas`, `dificuldade`), com um serviço de tracking de progresso (contadores por tipo: bosses derrotados, Almas ganhas, parries acertados, dano recebido na masmorra) que **persiste entre expedições no mesmo dia**, um bônus adicional calculado quando as 3 missões são concluídas, e reset diário à meia-noite local — calculado com timestamp de servidor/Firebase como referência de "agora" (mesmo motivo do sistema de Tochas — seção 2.1 — para evitar trapaça via relógio do dispositivo).
- **Audio Assets**: sons de efeitos vindos de bibliotecas gratuitas (Freesound, OpenGameArt, Kenney.nl, etc.) — manter uma planilha/lista de créditos com a licença de cada asset usado, já que isso costuma ser exigido para publicação (Play Store/App Store) dependendo da licença.

### 9.2 Perguntas técnicas em aberto
- Telégrafos de múltiplos inimigos: sequenciais ou simultâneos? (ver seção 3.1)
- Estrutura de dados de inimigo (ScriptableObject com padrões de ataque, timings de telégrafo, HP, etc.)
- Provider de save em nuvem (Unity Cloud Save, Firebase, backend próprio?)

---

## 10. MVP Sugerido (para primeira versão jogável)

1. Uma tela de Batalha funcional: 1 herói vs. 2 inimigos, com ataque normal, botões de esquiva/parry funcionando, e **1 habilidade especial equipada** (recomenda-se começar pela barra de precisão, mais simples de prototipar), consumindo Benção Divina. Incluir a ordem de turno (ações pré-ataque + ataque final) mesmo que só com o Elixir de HP funcionando no início.
2. Uma tela de Acampamento simples: subir nível em Força, Vitalidade e Conhecimento gastando Almas.
3. Loop completo: Acampamento → 1 expedição/batalha → retorno com Almas (incluindo o caso de derrota com Almas presas no monstro).
4. Save local simples (a versão em nuvem pode vir depois do MVP).
5. Árvore de Conhecimento das Almas e loadout de 3 habilidades podem ficar de fora do MVP inicial (usar 1 habilidade fixa primeiro, adicionar a árvore depois que o combate estiver validado).
6. Sem arte final — placeholders são aceitáveis para validar o game feel do combate.
7. **As 42 masmorras e o ciclo de NG+ são conteúdo pós-MVP** — o MVP só precisa validar 1-2 masmorras de exemplo; o resto é replicar a mesma estrutura de dados (ScriptableObjects por masmorra/inimigo) depois que o "core loop" estiver divertido.

---

## 11. Lista de Decisões Pendentes (resumo)

- [x] Valor exato de dano de Queima por ícone — decidido (3% do HP máximo por ícone)
- [x] Gema de Bomba mantém o efeito de remover escudo? — decidido (sim, mantém + aplica Queima também)
- [x] Limite de ataques de fogo por batalha? — decidido (livre, sem limite)
- [x] Indicador visual de Queima — decidido (ícone com número + efeito visual de chamas, os dois)
- [x] Sistema de recuperação/velocidade de ação — decidido (adicionar; ver seção 3.8)
- [x] Recuperação interage com o Sistema de Quebra? — decidido (não, sistemas independentes)
- [x] Habilidades fortes de Dano Elevado sempre disparam recuperação — decidido (sim, intencional)
- [x] Feedback visual da recuperação — decidido (ícone + animação de cansaço, os dois)
- [x] Limiar de dano/hits que dispara recuperação — decidido (o que vier primeiro entre os dois; valores numéricos exatos ficam pro playtesting)
- [x] Inimigo escolhe entre Ataque Telegrafado/Rápido — decidido (aleatório, com peso que sobe por masmorra)
- [x] Fórmula de Força → limiar de quebra do herói — decidido (por faixas, +1 a cada 5 níveis)
- [x] Multiplicador de dano do monstro "vulnerável" — decidido (+50%)
- [x] Duração da vulnerabilidade — decidido (até o próximo ataque do jogador)
- [x] Hits de Área/Aleatório contam pro contador de quebra? — decidido (não, só Dano Elevado conta)
- [x] Fórmula de dificuldade → limiar de quebra do monstro — decidido (escala por masmorra, 3 na masmorra 1 até 10 na masmorra 42)
- [x] Telégrafos sequenciais com múltiplos inimigos — decidido
- [x] Como o recurso de Benção Divina enche — decidido (1 no início, +1/turno, cap 5)
- [x] Custo por habilidade especial — decidido (fixo entre 1 e 5, definido por habilidade)
- [x] Habilidades desbloqueadas progressivamente via Árvore de Conhecimento das Almas — decidido
- [x] Nome de lore do recurso — decidido ("Benção Divina")
- [x] Restrição de combinação no loadout — decidido (livre, qualquer combinação de 3)
- [x] Habilidades além de dano no MVP — decidido (só dano no MVP; cura/buff/debuff depois)
- [x] Estrutura da árvore: 4 ramos (Dano Elevado, Área, Aleatório, Pedra) — decidido
- [x] Progressão dentro de cada ramo — decidido (com bifurcações)
- [x] Habilidades híbridas entre ramos — decidido (existem, em pontos avançados)
- [x] Custo de Conhecimento das Almas por nó — decidido (crescente conforme avança no ramo)
- [x] Conhecimento das Almas escala com dificuldade do boss? — decidido (não, quantidade fixa)
- [x] Nós passivos na árvore? — decidido (não existem, só habilidades e melhorias de Pedra)
- [x] Regra exata de remoção de escudo por hit — decidido (1 hit = 1 escudo)
- [x] O que acontece com hits "sobrando" quando o escudo já foi removido — decidido (viram dano normal na mesma ação)
- [x] Escudos consomem o turno de ataque do inimigo — decidido (invocar substitui o ataque naquele turno)
- [x] Escudo pode ser invocado em cima de escudo existente — decidido (sim, soma até 10)
- [x] Todo inimigo pode invocar escudo? — decidido (não, só tipos/bosses específicos)
- [x] Invocação de escudo aparece no telégrafo? — decidido (não, é surpresa)
- [x] Efeito exato de jogar pedra — decidido (dano baixo + remove escudo, conta como hit)
- [x] Jogar pedra tem limite de uso além do 1/turno? — decidido (não, sem limite adicional)
- [x] Quantidade base de pedras/turno — decidido (1 pedra por turno, sem upgrade)
- [x] Itens têm estoque limitado por expedição? — decidido (3 por expedição — *confirmar se compartilhado ou por tipo*)
- [x] Limite de ações pré-ataque por turno — decidido (1 pedra + 1 item por turno)
- [x] Limite diário de vídeos para ganhar tochas extras — decidido (ilimitado)
- [x] Limite diário de usos da "Visão Divina" — decidido (ilimitado)
- [x] Custo em Almas por gema — decidido (crescente por gema forjada)
- [x] Sistema de forja é aleatório ou escolhido? — decidido (aleatório, de um pool)
- [x] Gemas podem ser fundidas/melhoradas? — decidido (não, são fixas após forjadas)
- [x] Fórmulas de custo e efeito por nível de atributo — *proposta inicial na seção 4, ajustar em playtesting*
- [x] Monstro guardião de Almas fica marcado visualmente? — decidido (sim, brilho/aura)
- [x] Provider de save em nuvem — decidido (Firebase)
- [x] Direção de áudio — decidido (bibliotecas gratuitas de efeitos sonoros, checar licenças)
- [x] Papel do herói — decidido (caçar monstros pra coletar Almas e se tornar Santo, ver seção 7)
- [x] Total de conteúdo e ciclo de progressão — decidido (42 masmorras + NG+ mantendo atributos, monstros mais fortes)
- [x] Existe NG++/NG+++ ou só 1 ciclo? — decidido (múltiplos ciclos, cada vez mais difícil)
- [x] Aumento de dificuldade no NG+ — decidido (multiplicador fixo em todos os monstros)
- [x] 42 masmorras agrupadas ou sequência única? — decidido (agrupadas em 6 mundos de 7 masmorras cada)
- [x] Multiplicador de dificuldade por ciclo de NG+ — decidido (+20% por ciclo, cumulativo)
- [x] Existe teto/ciclo máximo? — decidido (não, infinito)
- [x] Cada "mundo" tem nome/tema/paleta próprio? — decidido (sim)
- [x] Referências visuais específicas + origem da música — decidido (Darkest Dungeon como referência visual; música de biblioteca gratuita)
- [x] Monstro guardião fica mais forte ou é o mesmo? — decidido (é o mesmo, só marcado visualmente)
- [x] Proteção contra azar na forja — decidido (sim, existe — mecanismo exato ainda a refinar)
- [x] Estoque de itens compartilhado ou por tipo? — decidido (3 de cada tipo, 6 no total)
- [x] Mecanismo exato da proteção contra azar na forja — decidido (ambos: reduz repetição + sistema de pity)
- [x] Valor inicial de dano da pedra — decidido (baixo, ~5-10% do ataque normal)
- [x] Estrutura visual exata das bifurcações da árvore — decidido (enxuta: 2 caminhos por ramo, ~5-8 nós por ramo)
- [x] Mecânica de Almas Perdidas se aplica desde o início do jogo? — decidido (sim, desde a primeira masmorra)
- [x] Gatilho de transição de fase do boss — decidido (sempre % de HP, 50%)
- [x] Boss recebe invencibilidade durante transição de fase? — decidido (sim)
- [x] Segunda fase invoca escudo com mais frequência? — decidido (sim)
- [x] Todo boss tem 2 fases? — decidido (não, só bosses específicos/mais avançados)
- [x] Quantidade de missões diárias ativas — decidido (3 fixas por dia)
- [x] Recompensa fixa por missão ou varia por dificuldade — decidido (varia; restrição vale mais)
- [x] Existe bônus por completar todas as missões do dia? — decidido (sim)
- [x] Horário de reset das missões diárias — decidido (meia-noite local, com timestamp de servidor)
- [x] Progresso de missão conta entre expedições diferentes no mesmo dia? — decidido (sim, acumula o dia inteiro)
- [x] Nome final do jogo — decidido ("Requiem of Blessings")

---

## 12. Passo a Passo de Implementação (Unity + PixelLab + Play Store)

Roteiro prático, em ordem, para sair do zero até uma versão publicável na Play Store. Cada fase pressupõe que a anterior está funcional (nem perfeita — funcional).

### Fase 0 — Setup do projeto

1. Criar projeto Unity **2D (URP)** — o URP facilita efeitos de luz/pós-processamento leves (ex: brilho do escudo, aura do monstro guardião) sem pesar no mobile.
2. Configurar **Player Settings** desde já pensando em Android: `Package Name` definitivo (ex: `com.suaempresa.requiemofblessings` — não muda depois sem virar um app novo na Play Store), `Minimum API Level` (checar o mínimo atual exigido pela Play Store — validar na Play Console, isso muda com frequência), orientação de tela (retrato, provavelmente, para um RPG mobile de menu).
3. Criar a estrutura de pastas do projeto (`_Project/Scripts`, `_Project/Art`, `_Project/Audio`, `_Project/Prefabs`, `_Project/ScriptableObjects`, etc.) — convenção clara desde o início evita bagunça quando os assets do PixelLab começarem a entrar.
4. Instalar pacotes: **Input System** (para os botões dedicados de Esquiva/Parry com timing preciso), **TextMeshPro**, e deixar reservado o pacote do **Firebase Unity SDK** (Auth + Firestore) para a fase de save.

### Fase 1 — Protótipo cinza (sem arte final)

Antes de gerar qualquer asset no PixelLab, valide as mecânicas com placeholders (quadrados coloridos, texto):

1. Implementar o **Battle State Machine** (seção 9.1): `PlayerTurn → EnemyTurn → CheckBattleEnd`.
2. Implementar **Esquiva/Parry** com janelas de tempo (usar `Time.time` ou uma coroutine com janela configurável por ScriptableObject de inimigo).
3. Implementar o **Sistema de Escudos** (contador por inimigo, resolução de hits excedentes).
4. Implementar **Benção Divina** (contador 1→5) e **1 habilidade especial** de teste (a barra de precisão, mais simples).
5. Implementar **Jogar Pedra** e os 2 itens (Elixir de HP/Bênção).
6. Validar o "game feel" — isso é o mais importante da fase e o que mais vale iterar antes de gastar em arte.

### Fase 2 — Pipeline de assets com PixelLab

Com o combate validado, comece a gerar os assets:

1. **Herói**: usar o gerador de personagem do PixelLab com **4 ou 8 direções**, base size recomendada (32x32 ou 64x64, dependendo do nível de detalhe desejado) e **fundo transparente**.
2. **Animações**: usar animação por esqueleto (skeleton-based) do PixelLab para gerar ataque normal, esquiva, parry, golpes especiais e idle — ele gera sprite sheets prontos.
3. **Inimigos**: repetir o processo por tipo de monstro (comum e boss), incluindo uma variação visual para o "monstro guardião de Almas" (brilho/aura, conforme decidido na seção 5.1).
4. **Ambientes/masmorras**: usar a geração de cenas e tilesets do PixelLab para os fundos de batalha e do Acampamento.
5. **Ícones**: usar o preset de ícones de habilidade para os 4 tipos de interação especial, gemas, itens (Elixir de HP/Bênção) e recursos (Almas, Conhecimento das Almas, Tocha).
6. **Importação no Unity**: para cada sprite sheet gerado, configurar no import settings: `Filter Mode = Point (no filter)`, `Compression = None` (ou baixa, testar qualidade), `Pixels Per Unit` consistente entre todos os assets do jogo (definir um valor único no início, ex: 16 ou 32, e manter em todos os sprites).
7. Manter uma pasta/planilha de créditos separada para os assets do PixelLab e para os efeitos sonoros de biblioteca gratuita (seção 8) — útil tanto para organização quanto para eventual exigência de atribuição na publicação.

### Fase 3 — Sistemas de Batalha completos

1. Multi-Enemy Targeting + telégrafos sequenciais (seção 3.1).
2. Sistema de Habilidades Especiais completo: os 4 tipos de interação (barra de precisão, sequência de gestos, hold/release, ritmo) via a interface comum `ISpecialAttackInteraction`.
3. Categorias de dano (Elevado, Área, Aleatório) e a lógica de múltiplos hits contra o sistema de escudo.
4. Loadout de 3 habilidades (mesmo que a árvore ainda não exista — pode usar uma lista fixa de habilidades de teste no início).
5. Bosses com 2 fases (seção 3.6) — recomenda-se implementar isso só depois que a luta de 1 fase estiver sólida; é essencialmente trocar o "conjunto de dados" de ataque do boss no meio da luta.
6. Sistema de Quebra (seção 3.7) — contador de hits + limiar, incapacita a entidade por uma rodada ao encher.
7. Sistema de Recuperação (seção 3.8) — checagem de dano/hits pós-ação que pula a próxima ação de quem atacou forte demais.
8. Sistema de Queima (seção 3.9) — contador de ícones de fogo, resolvido no início de cada turno, independente dos sistemas de Escudo e Quebra.

> Sugestão de ordem: implemente Escudo primeiro (já é essencial pro combate básico), depois Quebra, depois Queima, e Recuperação por último — Recuperação é o que mais interage com o "sentimento" de ritmo do combate, então é mais fácil ajustar depois que as outras peças já estiverem no lugar e você conseguir *sentir* o jogo rodando.

### Fase 4 — Sistemas do Acampamento

1. Progressão de atributos (Força, Vitalidade, Conhecimento) com as fórmulas da seção 4.
2. Árvore de Conhecimento das Almas (estrutura de nós com bifurcações — um grafo simples de ScriptableObjects costuma resolver bem em Unity).
3. Forja de Gemas (sorteio aleatório de um pool, custo crescente).
4. Sistema de Tochas — **importante:** calcular a recarga baseado em **timestamp real** (salvo localmente e idealmente validado contra um servidor/Firebase), nunca em um timer que reseta ao fechar o app, e nunca confiando cegamente no relógio do dispositivo (jogadores podem adiantar o relógio pra "trapacear" a recarga — mitigar comparando com hora do servidor quando possível).
5. Missões Diárias — mesma lógica de timestamp de servidor pro reset diário; o tracking de progresso (bosses derrotados, parries, dano recebido etc.) precisa "escutar" eventos já existentes do sistema de batalha, então faz sentido implementar isso depois que os eventos de combate (fim de batalha, parry bem-sucedido, dano recebido) já existirem de forma consistente.

### Fase 5 — Monetização (anúncios)

1. Integrar **Google AdMob** (ou Unity Ads/mediação) para os dois pontos de anúncio recompensado: ganhar Tocha extra e "Visão Divina" (triplicar recompensa).
2. Implementar o **Google UMP (User Messaging Platform)** para consentimento de anúncios personalizados — **obrigatório** para contas AdMob que atendem usuários no EEA/Reino Unido/Suíça, e boa prática global.
3. Testar com **IDs de anúncio de teste** do AdMob durante todo o desenvolvimento — só trocar para os IDs reais de produção no build final, para evitar banimento da conta por clique acidental em ads reais durante testes.

### Fase 6 — Save System

1. Configurar projeto no **Firebase Console**, adicionar o app Android, baixar `google-services.json`.
2. Implementar **Firebase Auth** (anônimo é suficiente para começar — permite depois migrar pra login de verdade sem perder progresso).
3. Implementar **Firestore** (ou Realtime Database) para os dados de progressão (atributos, árvore, gemas, tochas, masmorra atual).
4. Manter uma cópia local (PlayerPrefs ou arquivo JSON) como cache/fallback offline, sincronizando com a nuvem quando houver conexão.

### Fase 7 — Polimento

1. Feedback de áudio para parry/esquiva (crítico para o "feel" do timing — mesmo com efeitos de biblioteca gratuita, a sincronia importa mais que a qualidade do som em si).
2. Efeitos visuais simples (screen shake leve, flash de hit, partículas de quebra de escudo) — ajudam demais a leitura do combate num RPG ativo.
3. Tutorial básico explicando esquiva/parry/pedra antes da primeira masmorra.

### Fase 8 — Checklist de publicação na Play Store

1. Gerar **build assinado (AAB)** com uma keystore própria — guardar essa chave com segurança, ela é necessária pra toda atualização futura do jogo.
2. Preencher o **Data Safety form** da Play Console — como o jogo usa Firebase (dados salvos) e anúncios (AdMob coleta dados para anúncios), isso precisa ser declarado corretamente.
3. Preencher a **classificação de conteúdo (IARC)** — o tema é dark fantasy com violência estilizada (pixel art), então é importante responder ao questionário com atenção a esse ponto para a faixa etária correta.
4. Escrever a **política de privacidade** (obrigatória por causa dos anúncios e do Firebase) e publicá-la em uma URL acessível.
5. Preparar **screenshots, ícone e texto da loja** — os assets gerados pelo PixelLab servem bem de base pra artes promocionais também.
6. Publicar primeiro em **teste interno/fechado** na Play Console antes de ir para produção — permite pegar crashes e problemas de anúncio/save antes do público geral.
7. Validar em **dispositivos reais de gama baixa/média** (comum no público Android) — pixel art costuma rodar bem, mas o sistema de anúncios e save em nuvem merecem teste em conexão instável.

**Confirmado: lançamento inicial só para Android.** iOS pode ser considerado depois, caso o jogo valide bem — mas isso fica fora do escopo do checklist acima (a App Store tem processo de revisão e exigências próprias, como App Tracking Transparency para anúncios).

---

## 13. Guia Detalhado de Tarefas — Começando do Zero (Fase 0 e Fase 1)

Esta seção expande as Fases 0 e 1 da seção 12 em **tarefas bem pequenas**, cada uma com objetivo, explicação do conceito de Unity envolvido, e passo a passo. A ideia é você conseguir seguir isso mesmo estudando Unity há pouco tempo — cada tarefa ensina um conceito enquanto entrega uma peça pequena e testável do jogo.

**Como usar este guia:** faça uma tarefa por vez, teste (aperte o botão Play), veja funcionando, e só então vá pra próxima. Resistir à tentação de pular etapas é a parte mais importante de aprender Unity sem se perder.

---

### Bloco A — Setup do projeto

**Tarefa 1: Criar o projeto**
- **Objetivo:** ter um projeto Unity 2D configurado e rodando.
- **Passo a passo:** Abra o Unity Hub → New Project → template **2D (URP)** → nomeie o projeto (ex: `RequiemOfBlessings`) → Create.
- **Conceito:** URP (Universal Render Pipeline) é um dos "motores gráficos" do Unity, mais leve e adequado para mobile. Você não precisa entender profundamente agora — só saiba que escolher isso desde o início evita ter que migrar depois.

**Tarefa 2: Organizar as pastas**
- **Objetivo:** ter uma estrutura de pastas limpa dentro de `Assets`.
- **Passo a passo:** Na janela **Project**, clique com o botão direito em `Assets` → Create → Folder. Crie: `Scripts`, `Art`, `Audio`, `Prefabs`, `ScriptableObjects`, `Scenes`.
- **Conceito:** No Unity, tudo que você usa (scripts, imagens, sons, cenas) é um "Asset" e vive dentro da pasta `Assets`. Organizar cedo evita uma bagunça gigante depois que você tiver 200+ arquivos.

**Tarefa 3: Criar a primeira cena**
- **Objetivo:** ter uma cena chamada `Battle` (onde vamos prototipar o combate).
- **Passo a passo:** Dentro de `Scenes`, botão direito → Create → Scene → nomeie `Battle`. Dê 2 cliques para abrir.
- **Conceito:** uma "Scene" no Unity é como uma fase/tela do jogo — cada tela do seu jogo (Batalha, Acampamento) vai virar uma Scene separada (ou você pode carregar UI por cima da mesma cena — isso é uma decisão que pode vir mais tarde).

**Tarefa 4: Instalar o pacote Input System**
- **Objetivo:** ter o sistema de input moderno do Unity disponível (importante pra timing preciso de parry/esquiva).
- **Passo a passo:** Window → Package Manager → mude o dropdown pra "Unity Registry" → procure "Input System" → Install. O Unity vai perguntar se quer trocar o backend de input — aceite.
- **Conceito:** existem 2 formas de capturar toques/cliques no Unity: o sistema antigo (`Input.GetKeyDown`) e o **Input System** novo, baseado em "Actions". Vamos usar o novo porque ele lida melhor com toques de tela (mobile) e é mais fácil de configurar depois pra Esquiva/Parry.

---

### Bloco B — Estruturas de dados básicas (ScriptableObjects)

**Tarefa 5: Entender e criar seu primeiro ScriptableObject**
- **Objetivo:** ter um arquivo `EnemyData` que guarda os dados de um inimigo (nome, HP, dano) sem precisar de código repetido.
- **Conceito (importante, leia com calma):** um **ScriptableObject** é tipo uma "ficha de personagem" que existe como arquivo no seu projeto, não como algo que só existe durante o jogo rodando. Diferente de uma classe comum, você cria um `EnemyData` para o Goblin, outro pra o Esqueleto, etc., cada um com seus próprios números — sem duplicar código, só duplicando dados. É a ferramenta perfeita pra tudo que você já documentou no GDD com "dados por item" (inimigos, habilidades, gemas, itens).
- **Passo a passo:**
  1. Na pasta `Scripts`, crie um script chamado `EnemyData.cs`.
  2. Escreva:
     ```csharp
     using UnityEngine;

     [CreateAssetMenu(fileName = "NewEnemy", menuName = "RequiemOfBlessings/Enemy Data")]
     public class EnemyData : ScriptableObject
     {
         public string enemyName;
         public int maxHP;
         public int attackDamage;
         public int maxShields; // limite de escudo deste inimigo (até 10, conforme o GDD)
     }
     ```
  3. Volte pro Unity, clique com botão direito na pasta `ScriptableObjects` → Create → RequiemOfBlessings → Enemy Data. Isso cria um arquivo `NewEnemy.asset`.
  4. Clique nesse arquivo e preencha os campos no Inspector (nome, HP, dano) — por exemplo, um "Goblin" com 30 HP e 5 de dano.
- **Por que isso importa:** esse padrão (`ScriptableObject` + `CreateAssetMenu`) é a base de praticamente todo sistema de dados do seu jogo — você vai repetir esse mesmo padrão pra `AbilityData`, `GemData`, `ItemData`, etc.

**Tarefa 6: Criar `HeroData`**
- **Objetivo:** o mesmo conceito da Tarefa 5, mas para o herói (HP base, Ataque base, Defesa base — os valores "Base" das fórmulas da seção 4 do GDD).
- **Passo a passo:** repita o processo da Tarefa 5, criando `HeroData.cs` com campos como `baseHP`, `baseAttack`, `baseDefense`.

---

### Bloco C — O primeiro inimigo em cena (sem arte, com um quadrado)

**Tarefa 7: Criar um "boneco de teste" pro inimigo**
- **Objetivo:** ter um quadrado vermelho na tela representando o inimigo.
- **Passo a passo:** Na cena `Battle`, botão direito na Hierarchy → 2D Object → Sprite → Square. Renomeie pra `Enemy_Test`. No Inspector, mude a cor (componente Sprite Renderer → Color) pra vermelho.
- **Conceito:** um **GameObject** é qualquer "coisa" que existe na sua cena (o quadrado, a câmera, um botão de UI). Ele ganha comportamento através de **Components** grudados nele (o Sprite Renderer é um component que faz ele aparecer visualmente).

**Tarefa 8: Criar o script `EnemyController`**
- **Objetivo:** o `Enemy_Test` ter HP, escudo, e conseguir "tomar dano".
- **Passo a passo:**
  1. Crie `EnemyController.cs` em `Scripts`.
  2. Escreva:
     ```csharp
     using UnityEngine;

     public class EnemyController : MonoBehaviour
     {
         public EnemyData data; // arraste o EnemyData no Inspector
         private int currentHP;
         private int currentShields;

         void Start()
         {
             currentHP = data.maxHP;
             currentShields = 0;
         }

         // Chamado quando o jogador acerta N hits nesse inimigo
         public void ReceiveHits(int hitCount, int damagePerHit)
         {
             for (int i = 0; i < hitCount; i++)
             {
                 if (currentShields > 0)
                 {
                     currentShields--; // 1 hit remove 1 escudo (seção 3.3 do GDD)
                 }
                 else
                 {
                     currentHP -= damagePerHit;
                     Debug.Log($"{data.enemyName} tomou {damagePerHit} de dano. HP restante: {currentHP}");
                 }
             }

             if (currentHP <= 0)
             {
                 Debug.Log($"{data.enemyName} foi derrotado!");
             }
         }
     }
     ```
  3. Arraste esse script pro `Enemy_Test` (arraste o arquivo `.cs` de dentro da pasta `Scripts` pra cima do objeto na Hierarchy).
  4. No Inspector do `Enemy_Test`, arraste o `NewEnemy.asset` (da Tarefa 5) pro campo `Data`.
- **Conceito:** um **MonoBehaviour** é a classe base de todo script que vive "dentro" de um GameObject na cena. `Start()` roda uma vez quando o objeto é criado; é onde você inicializa valores. Esse script já implementa, em código de verdade, a regra de escudo que vocês definiram no GDD (seção 3.3): hit remove escudo primeiro, dano só depois.

**Tarefa 9: Testar via um botão temporário**
- **Objetivo:** conseguir clicar em algo e ver o inimigo tomando dano no Console, validando que a lógica funciona antes de ter qualquer UI real.
- **Passo a passo:**
  1. Crie um script `TestBattleTrigger.cs`:
     ```csharp
     using UnityEngine;

     public class TestBattleTrigger : MonoBehaviour
     {
         public EnemyController targetEnemy;

         void Update()
         {
             if (Input.GetKeyDown(KeyCode.Space))
             {
                 targetEnemy.ReceiveHits(hitCount: 2, damagePerHit: 10);
             }
         }
     }
     ```
  2. Crie um GameObject vazio (botão direito na Hierarchy → Create Empty), chame de `TestManager`, e arraste esse script nele.
  3. Arraste o `Enemy_Test` pro campo `Target Enemy` no Inspector do `TestManager`.
  4. Aperte Play e pressione a barra de espaço — observe o Console (Window → General → Console) mostrando o inimigo tomando dano.
- **Por que isso importa:** esse é seu primeiro **loop de teste completo**: dado → lógica → resultado observável. É assim que se prototipa qualquer sistema no Unity antes de gastar tempo com UI e arte. Depois trocamos "apertar espaço" por um botão de ataque de verdade.

---

### Bloco D — Estrutura de turno (o "esqueleto" da batalha)

**Tarefa 10: Criar o enum de estados de batalha**
- **Objetivo:** ter uma forma clara de saber "de quem é a vez" no combate.
- **Passo a passo:** crie `BattleState.cs`:
  ```csharp
  public enum BattleState
  {
      PlayerPreAttack,  // jogador pode jogar pedra e/ou usar item
      PlayerAttack,     // ação final do turno do jogador
      EnemyTurn,        // inimigo ataca ou invoca escudo
      BattleOver
  }
  ```
- **Conceito:** um **enum** é uma lista fechada de opções nomeadas (em vez de usar números soltos tipo `0`, `1`, `2` pra representar estados, você usa nomes que fazem sentido). Isso deixa o código muito mais fácil de ler.

**Tarefa 11: Criar o `BattleManager`**
- **Objetivo:** ter um "maestro" controlando a ordem do turno, seguindo exatamente a estrutura da seção 3.1 do GDD.
- **Passo a passo:** crie `BattleManager.cs`:
  ```csharp
  using UnityEngine;

  public class BattleManager : MonoBehaviour
  {
      public BattleState currentState;

      void Start()
      {
          currentState = BattleState.PlayerPreAttack;
          Debug.Log("Turno do jogador começou. Pode jogar pedra ou usar item.");
      }

      // Chamado quando o jogador decide atacar (ação final do turno)
      public void PlayerAttacks()
      {
          if (currentState != BattleState.PlayerPreAttack) return;

          currentState = BattleState.PlayerAttack;
          Debug.Log("Jogador atacou. Turno encerrado, passando pro inimigo.");

          currentState = BattleState.EnemyTurn;
          Debug.Log("Turno do inimigo.");

          // (por enquanto, sem lógica de inimigo real — só de volta pro jogador)
          currentState = BattleState.PlayerPreAttack;
          Debug.Log("Novo turno do jogador.");
      }
  }
  ```
  Adicione esse script no `TestManager` também, e ligue o botão de espaço (Tarefa 9) pra chamar `PlayerAttacks()` em vez de `ReceiveHits` diretamente — depois `PlayerAttacks()` que vai chamar `ReceiveHits` no inimigo certo.
- **Conceito:** isso é uma **máquina de estados (state machine)** simplificada — o conceito mais importante de todo o sistema de batalha do GDD. Toda a complexidade de "jogador pode fazer isso, mas só nesse momento" nasce de controlar bem esse `currentState`.

---

### Bloco E — Sistemas de Status: Quebra, Recuperação e Queima

Esses três sistemas (seções 3.7, 3.8 e 3.9 do GDD) são todos parecidos em estrutura: um **contador** que enche por algum evento e, ao atingir um **limiar**, dispara um efeito. Vamos implementar os três reaproveitando o mesmo tipo de raciocínio — depois de fazer o primeiro, os outros dois ficam bem mais rápidos de entender.

**Tarefa 12: Criar o `BreakCounter` (Sistema de Quebra)**
- **Objetivo:** o inimigo (e depois o herói) ter um contador de hits que, ao atingir um limiar, o deixa "quebrado" por uma rodada.
- **Passo a passo:**
  1. Crie `BreakCounter.cs`:
     ```csharp
     using UnityEngine;

     public class BreakCounter : MonoBehaviour
     {
         public int breakThreshold = 3; // limiar inicial (seção 3.7 do GDD)
         private int currentHits = 0;
         public bool IsBroken { get; private set; }

         public void RegisterHit()
         {
             if (IsBroken) return; // já quebrado, não acumula mais até resolver

             currentHits++;
             Debug.Log($"Hits acumulados: {currentHits}/{breakThreshold}");

             if (currentHits >= breakThreshold)
             {
                 TriggerBreak();
             }
         }

         private void TriggerBreak()
         {
             IsBroken = true;
             currentHits = 0; // reseta pra poder quebrar de novo depois (seção 3.7)
             Debug.Log($"{gameObject.name} QUEBROU! Perde a próxima rodada.");
         }

         // Chamado pelo BattleManager depois que a rodada "perdida" passou
         public void ResolveBrokenState()
         {
             IsBroken = false;
         }
     }
     ```
  2. Adicione esse script no `Enemy_Test` (Tarefa 7-8).
  3. No `EnemyController` (Tarefa 8), adicione uma referência: `public BreakCounter breakCounter;` e arraste o component no Inspector.
  4. Dentro de `ReceiveHits`, adicione uma chamada: dentro do loop `for`, sempre que um hit causar dano de verdade (não quando remove escudo), chame `breakCounter.RegisterHit()`. **Atenção**: pelo GDD, só hits de **Ataque Especial** contam pra quebra do monstro — então essa chamada só deve acontecer quando o método `ReceiveHits` for invocado a partir de uma habilidade especial, não de ataque normal ou pedra. Uma forma simples de resolver isso: adicione um parâmetro `bool countsForBreak` no método `ReceiveHits`, e só chame `RegisterHit()` quando ele for `true`.
- **Conceito:** isso é o padrão de **contador + limiar** que você vai repetir nas próximas duas tarefas — só muda o que incrementa o contador e o que acontece quando ele estoura.

**Tarefa 13: Criar o `BurnStatus` (Sistema de Queima)**
- **Objetivo:** herói e monstro acumularem ícones de fogo que causam dano no início do turno.
- **Passo a passo:**
  1. Crie `BurnStatus.cs`:
     ```csharp
     using UnityEngine;

     public class BurnStatus : MonoBehaviour
     {
         private int burnIcons = 0;
         public float damagePercentPerIcon = 0.03f; // 3% do HP máximo por ícone (seção 3.9)

         public void AddBurnIcon()
         {
             burnIcons++;
             Debug.Log($"Ícones de queima acumulados: {burnIcons}");
         }

         // Chamado no início do turno de quem tem esse componente
         public int ResolveBurnDamage(int maxHP)
         {
             if (burnIcons == 0) return 0;

             int burnDamage = Mathf.RoundToInt(burnIcons * damagePercentPerIcon * maxHP);
             Debug.Log($"Queima causou {burnDamage} de dano ({burnIcons} ícones consumidos).");
             burnIcons = 0; // consome tudo de uma vez (seção 3.9)
             return burnDamage;
         }
     }
     ```
  2. Adicione esse script tanto no `Enemy_Test` quanto em um futuro objeto do herói.
  3. No `BattleManager` (Tarefa 11), no início do estado `PlayerPreAttack`, adicione a checagem: busque o `BurnStatus` do herói e chame `ResolveBurnDamage`, aplicando o resultado como dano antes de qualquer outra ação.
- **Conceito:** repare que esse sistema **não interage com escudo nem quebra** — ele é resolvido de forma completamente independente, então nem precisa "conversar" com o `BreakCounter` ou com a lógica de escudo do `EnemyController`.

**Tarefa 14: Criar o `RecoveryStatus` (Sistema de Recuperação)**
- **Objetivo:** depois de um ataque forte (dano alto ou muitos hits), quem atacou perde a próxima ação.
- **Passo a passo:**
  1. Crie `RecoveryStatus.cs`:
     ```csharp
     using UnityEngine;

     public class RecoveryStatus : MonoBehaviour
     {
         public int damageThreshold = 25; // valor de exemplo, balancear depois
         public int hitCountThreshold = 3; // valor de exemplo, balancear depois
         public bool IsRecovering { get; private set; }

         // Chamado depois que uma ação de ataque é resolvida
         public void CheckRecoveryTrigger(int damageDealt, int hitCount)
         {
             if (damageDealt >= damageThreshold || hitCount >= hitCountThreshold)
             {
                 IsRecovering = true;
                 Debug.Log($"{gameObject.name} entrou em Recuperação! Vai perder a próxima ação.");
             }
         }

         // Chamado pelo BattleManager quando a ação "perdida" já foi pulada
         public void ClearRecovery()
         {
             IsRecovering = false;
         }
     }
     ```
  2. No `BattleManager`, depois de resolver qualquer ataque (do herói ou do inimigo), chame `CheckRecoveryTrigger` passando o dano total causado e a quantidade de hits daquela ação.
  3. Antes de permitir uma nova ação de quem atacou, verifique `IsRecovering` — se `true`, pule a ação dele e chame `ClearRecovery()` em seguida.
- **Conceito:** note que esse sistema é **independente do Break System** (confirmado no GDD) — mesmo que os dois "pareçam" fazer algo parecido (incapacitar por uma rodada), eles têm gatilhos e contadores completamente separados. É comum em design de jogos ter sistemas com efeito visualmente parecido mas mecanicamente distintos — o importante é não deixar o código de um "vazar" pro outro.

> **Dica de teste:** para os três sistemas, use o mesmo truque da Tarefa 9 — um script de teste que força os eventos (ex: tecla 1 = registra hit de quebra, tecla 2 = adiciona ícone de queima, tecla 3 = simula ataque forte) e observe os logs no Console. Só implemente a UI de verdade (barras, ícones) depois que a lógica estiver validada.

---

### Próximos blocos (visão geral, sem detalhar ainda)

Depois que os Blocos A-E estiverem funcionando e testados, os próximos passos naturais são:
- **Bloco F:** Esquiva/Parry com janela de tempo real (usando o Input System da Tarefa 4 + uma `Coroutine`, outro conceito de Unity pra "esperar" um tempo sem travar o jogo).
- **Bloco G:** UI real (Canvas, botões) substituindo a barra de espaço de teste.
- **Bloco H:** Benção Divina + a primeira habilidade especial (barra de precisão).

> Se quiser, posso detalhar o Bloco F (Esquiva/Parry) e os seguintes no mesmo nível de detalhe assim que você terminar e testar os Blocos A-E — geralmente é mais fácil aprender um bloco de cada vez do que receber tudo de uma vez.

---

*Este documento deve ser tratado como referência viva. Recomenda-se revisar e preencher as seções marcadas com ❓ antes de iniciar a implementação de cada sistema correspondente em Unity.*
