# GDD — 8-Bit Armageddon
**Gênero:** Roguelike de defesa automática / tower-defense invertido
**Estilo visual:** Pixel art colorida, top-down, tela em paisagem (resolução de referência 320×180)
**Plataformas:** Android (Google Play) e Web (site próprio + itch.io)
**Modelo de negócio:** Free-to-play com anúncios recompensados (sem intersticiais, sem compras no app)
**Idiomas no lançamento:** Inglês e Português (Brasil)
**Público-alvo:** 13+. Fãs de roguelike incremental (ex: The Tower, Vampire Survivors, Kingdom Rush) com foco em runs curtas e replayability
**Glossário:** os termos canônicos (em inglês) estão em [`contexts/8-bit-armageddon/CONTEXT.md`](contexts/8-bit-armageddon/CONTEXT.md). Este documento e o código usam só esses termos.

---

## 1. Conceito Central (Pitch)

O jogador defende um planeta contra ondas infinitas de invasores alienígenas vindos do espaço. Os **Satellites** orbitam o planeta e disparam **automaticamente**; o papel do jogador é decidir, em tempo real, como investir os **Shards** coletados a cada inimigo destruído, transformando o planeta em uma fortaleza cada vez mais poderosa até que, inevitavelmente, ele caia. Cada queda gera **Stardust**, a moeda da meta-progressão permanente, incentivando a próxima tentativa.

**Fantasia central:** "Eu sou o último ponto de defesa de um mundo. Quanto mais eu resistir, mais forte eu fico, mas os aliens também."

---

## 2. Pilares de Design

1. **Automação com decisão constante:** o combate é automático (os Satellites orbitam, escolhem alvo e atiram sozinhos), mas a estratégia de Upgrade é ativa e contínua, sem tempo morto. Comprar um Upgrade custa um toque e nunca pausa o jogo.
2. **Run curta, morte com propósito:** cada run dura de 5 a 20 minutos; morrer não é frustração, é combustível para a meta-progressão.
3. **Escalada dupla:** inimigos ficam mais fortes a cada Wave; o planeta também, através das escolhas do jogador. A tensão vem de saber se sua curva vence a deles.
4. **Cerco legível:** o planeta é o centro fixo da tela; tudo ao redor (inimigos, projéteis, Satellites, efeitos) converge para ele. A tela é dividida em 4 **Quadrants** centrados no planeta, toda ameaça está sempre visível num deles, e o jogo sempre avisa de onde a próxima ameaça vem.

---

## 3. Loop de Gameplay

### Loop de curto prazo (dentro da run)
1. Um indicador na borda da tela avisa, 2 s antes, de quais **Spawn Sectors** a próxima Wave vai sair.
2. A Wave começa com um timer (30 s; 60 s na Boss Wave). Os inimigos nascem nos setores sorteados e avançam até o planeta.
3. Os **Satellites** orbitam o planeta, e cada um dispara nos inimigos do **Quadrant** por onde está passando, escolhendo o alvo pela sua **Target Priority**.
4. Inimigo destruído → o jogador ganha **Shards**.
5. O jogador gasta Shards em **Upgrades** (válidos só nesta run) pela gaveta na parte de baixo da tela, sem pausar o jogo.
6. A próxima Wave começa quando o timer acaba **ou** quando a tela fica sem inimigos, o que vier primeiro. Esvaziar a tela (**Wave Clear**) paga um bônus de Shards.
7. Repete até o planeta ser destruído. Uma vez por run, o jogador pode assistir a um anúncio para **Revive**.

### Loop de médio prazo (fim de run)
1. Planeta destruído (e Revive recusado ou já usado) → tela de **Results**: Wave alcançada, inimigos destruídos, tempo de sobrevivência, Shards coletados.
2. Parte dos Shards coletados vira **Stardust**. O jogador pode assistir a um anúncio para dobrar o Stardust da run.
3. No Main Menu, o jogador gasta Stardust em **Perks**, que melhoram o ponto de partida das próximas runs.
4. Nova run começa, mais forte que a anterior desde o início.

### Loop de longo prazo (meta)
- **Conquistas** desbloqueiam novos **Planet Cores** (variantes de planeta que mudam a build) e **Skins**.
- O ramo **Arsenal** da árvore de Perks libera mais Satellites (até 4) e novas Target Priorities, mudando *como* o jogo é jogado, não só os números.
- A **recompensa diária** (sequência de 7 dias) dá um motivo para voltar todo dia.

---

## 4. Sistemas de Combate

> **Unidades:** todas as distâncias abaixo estão em **unidades de mundo (u)** no plano lógico (ver Seção 6.1). Com 16 pixels por unidade, a tela de 320×180 mostra 20 × 11,25 u. O planeta tem 2 u de diâmetro (raio de 1 u).

### 4.1 Satellites e Quadrants

**Definido:**
- O planeta começa com **1 Satellite** e pode chegar a **4**, desbloqueados pelo ramo Arsenal dos Perks (Seção 5.2).
- **Órbita:** todos os Satellites giram na **mesma órbita circular**, com raio de **1,75 u** a partir do centro do planeta (o planeta tem raio de 1 u), no sentido **anti-horário**, na velocidade do Stat **Orbit Speed** (graus por segundo). Ficam **espaçados igualmente** e giram juntos: 1 Satellite; 2 opostos; 3 a cada 120°; 4 a cada 90°. Com 4, cada um está sempre num Quadrant diferente e a cobertura é total. Com menos, cada Satellite "visita" um Quadrant de cada vez.
- **Quadrants:** a tela é dividida em 4 setores de 90°, como um plano cartesiano centrado no planeta: acima à direita, acima à esquerda, abaixo à esquerda e abaixo à direita. Um inimigo exatamente sobre a linha entre dois Quadrants pertence a um só deles (regra técnica, sem efeito visível).
- **Alvos:** um Satellite só pode atirar em inimigos que estejam **no Quadrant onde ele está agora** **e** dentro do Stat **Attack Range**, medido **a partir do centro do planeta** (assim todos os Satellites têm o mesmo alcance efetivo). Se não houver ninguém válido, ele segura o tiro.
- Todos os Satellites usam os **mesmos Stats** (Damage, Attack Speed etc.). Só a Target Priority é individual.
- **Target Priority** escolhe qual inimigo válido (no Quadrant e no alcance) recebe o tiro. É configurada **por Satellite**, na aba "Satellites" da gaveta de upgrades:

| Target Priority | Escolhe | Como desbloquear |
|---|---|---|
| **Closest** | O inimigo mais perto do planeta | Padrão |
| **Weakest** | O inimigo com menos HP atual | Perk do ramo Arsenal |
| **Strongest** | O inimigo com mais HP atual | Perk do ramo Arsenal |
| **Farthest** | O inimigo mais longe do planeta (sinergia com Impetus) | Perk do ramo Arsenal |

- **Projéteis:** cada disparo cria um projétil teleguiado que persegue o alvo, mesmo que o Satellite já tenha passado para outro Quadrant. Se o alvo morrer antes, o projétil some.
  - **Em aberto:** a velocidade do projétil. O valor inicial no código é **10 u/s** (cruza o Attack Range base de 4 u em 0,4 s).

**Fórmula de dano do disparo:**
```
dano = Damage × (1 + Impetus × distânciaAoCentro) × (crítico ? CriticalFactor : 1)
```
O crítico é sorteado a cada disparo com probabilidade Critical Chance.

### 4.2 Stats do planeta (Upgrades)

Os Stats são organizados em três **Tracks**, que são as três abas da gaveta de upgrades. Cada Upgrade compra um nível de um Stat, válido até o fim da run.

**Definido:** custo do próximo nível = `baseCost × 1.15^nível`, com nível começando em 0, arredondado para o inteiro mais próximo. O valor de um Stat = `base + incremento × nível`, limitado pelo teto (quando houver), e depois modificado pelos Perks e pelo Planet Core.

**Definido (valor inicial, ajustar via Analytics):** os valores das tabelas abaixo.

#### ⚔️ Offense
| Stat | Efeito | Base | Por nível | Teto | baseCost |
|---|---|---|---|---|---|
| **Damage** | Dano por disparo | 10 | +3 | — | 10 |
| **Attack Speed** | Disparos por segundo, por Satellite | 1,0/s | +0,08/s | 6,0/s | 12 |
| **Critical Chance** | Probabilidade de crítico | 0% | +1,5 p.p. | 80% | 15 |
| **Critical Factor** | Multiplicador de dano no crítico | 1,5× | +0,1× | 6× | 15 |
| **Attack Range** | Raio de detecção e disparo, medido do centro do planeta | 4,0 u | +0,15 u | 8,0 u | 12 |
| **Impetus** | Dano extra por unidade de distância do alvo | 0%/u | +0,4%/u | 12%/u | 20 |
| **Orbit Speed** | Velocidade da órbita dos Satellites | 45°/s | +5°/s | 180°/s | 12 |

Observações de design:
- Critical Chance e Critical Factor são separados para permitir builds de "chance alta + fator baixo" e o oposto.
- Impetus incentiva Attack Range alto e a Target Priority Farthest.
- Orbit Speed decide quanto tempo um Quadrant fica sem cobertura quando o jogador tem menos de 4 Satellites. Com o valor base, 1 Satellite dá a volta em 8 s e fica 2 s em cada Quadrant. Um Grunt leva uns 3,7 s para cruzar o Attack Range base, então alguns chegam ao planeta nas primeiras Waves. Isso é proposital: cria o incentivo para comprar Orbit Speed ou o Satellite 2.

#### 🛡️ Defense
| Stat | Efeito | Base | Por nível | Teto | baseCost |
|---|---|---|---|---|---|
| **Hitpoints** | HP máximo do planeta | 100 | +25 | — | 10 |
| **Regeneration** | HP recuperado por segundo | 0 | +0,4/s | — | 15 |
| **Defense (absolute)** | Dano fixo removido de cada hit | 0 | +0,5 | — | 15 |
| **Defense (relative)** | % de dano removido de cada hit | 0% | +1,5 p.p. | 75% | 20 |

**Definido:** dano recebido = `max(1, (danoBruto − DefenseAbsolute) × (1 − DefenseRelative))`. A defesa absoluta é aplicada primeiro, e nenhum hit causa menos que 1 de dano. A absoluta é forte contra muitos hits fracos (Swarmer); a relativa, contra hits grandes (Brute, laser da Mothership).

Ao comprar um nível de Hitpoints, o HP atual sobe na mesma quantidade (o jogador não "perde" a compra por estar ferido).

#### 💰 Utility
| Stat | Efeito | Base | Por nível | Teto | baseCost |
|---|---|---|---|---|---|
| **Resource Bonus** | Shards extras por inimigo destruído | 0% | +5 p.p. | — | 20 |
| **Resource per Wave** | Bônus extra no Wave Clear | 0% | +10 p.p. | — | 20 |

Utility é a Track "de investimento": não ataca nem defende, mas acelera o acesso às outras duas.

### 4.3 Waves

**Definido:**
- **Timer:** 30 s por Wave; 60 s na Boss Wave.
- **Início da próxima Wave:** quando o timer acaba **ou** quando a tela fica sem inimigos (depois de todos os inimigos da Wave atual terem nascido), o que vier primeiro. Antes de cada Wave há um **aviso de 2 s** com os indicadores de Spawn Sector.
- **Wave Clear:** o momento em que a tela fica sem inimigos. Paga o bônus de **todas** as Waves que ainda tinham inimigos vivos, inclusive as que já tinham passado do timer. Exemplo: o timer da Wave 12 acaba com 5 inimigos vivos, a Wave 13 começa, e o jogador limpa tudo → recebe o bônus da 12 e da 13.
  - Consequência: enquanto uma Mothership estiver viva, a tela nunca esvazia, então os bônus se acumulam e são pagos todos juntos quando ela morre.
- **Spawn Sectors:** o círculo ao redor do planeta é dividido em 6 arcos de 60°. Cada Wave sorteia 1 setor (Waves 1–4), 2 setores (Waves 5–14) ou 3 setores (Wave 15 em diante). Os inimigos nascem num ponto aleatório dentro dos setores sorteados, a 12 u do centro (fora da tela).
- **Ritmo de spawn:** os inimigos de uma Wave nascem espalhados igualmente nos primeiros 20 s do timer.
- **Limite de tela:** no máximo **150 inimigos** vivos ao mesmo tempo. Se o limite for atingido, o spawn espera. Os slots que não couberem **não são descartados**: continuam na fila e nascem assim que houver espaço, mesmo que a próxima Wave já tenha começado. O Wave Clear só acontece com essa fila vazia.

**Definido (valor inicial, ajustar via Analytics):**
| Item | Fórmula |
|---|---|
| Slots de spawn por Wave (w = número da Wave) | `min(6 + 2·w, 60)` |
| HP do inimigo | `baseHP × 1.09^(w−1)` |
| Dano do inimigo | `baseDamage × 1.06^(w−1)` |
| Bônus de Wave Clear (por Wave paga) | `(5 + w) × (1 + Resource per Wave)` Shards |

**Composição:** cada slot de spawn sorteia um tipo de inimigo entre os já liberados, com os pesos Grunt 50, Scout 25, Swarmer 15, Brute 10 (os pesos são renormalizados entre os tipos liberados). Um slot de Swarmer gera um cacho de 8.

### 4.4 Inimigos

**Definido:** todos os inimigos comuns são **kamikaze**: avançam até o planeta, causam dano ao tocar (distância < raio do planeta) e somem sem dar Shards.

**Definido (valor inicial, ajustar via Analytics):** valores na Wave 1, antes da escalada da Seção 4.3.

| Inimigo | HP | Dano | Velocidade | Shards | Liberado na Wave | Comportamento |
|---|---|---|---|---|---|---|
| **Grunt** | 10 | 5 | 0,8 u/s | 1 | 1 | Linha reta até o planeta |
| **Scout** | 6 | 3 | 2,0 u/s | 1 | 3 | Zigue-zague leve (amplitude 0,5 u, 1,5 Hz) |
| **Swarmer** | 3 | 2 | 1,2 u/s | 1 a cada 2 | 6 | Nasce em cachos de 8, espalhados |
| **Brute** | 80 | 20 | 0,5 u/s | 4 | 8 | Linha reta, lento |

Shards por kill são multiplicados por `(1 + Resource Bonus)`. Frações (Swarmer) são acumuladas e pagas quando somam 1.

### 4.5 Boss Wave — Mothership

**Definido:**
- Toda Wave múltipla de 10 (10, 20, 30…) é uma **Boss Wave**: nasce uma única **Mothership**, sem inimigos comuns. HP e dano escalam com a mesma fórmula da Seção 4.3.
- A Mothership **não é kamikaze**. Ela entra e fica em órbita a 7 u do centro, girando devagar (10°/s).
- **Laser:** a cada 8 s, telegrafa uma linha vermelha piscando por 1,5 s e dispara um laser no planeta.
- **Swarmers:** a cada 15 s, solta um cacho de 8 Swarmers.
- **Barra de HP** no topo da tela enquanto ela estiver viva.
- Se o timer de 60 s acabar com a Mothership viva, ela **continua em campo** junto com as Waves seguintes até ser destruída.

**Definido (valor inicial):** HP base 1.200, dano do laser base 25, Shards 50.

### 4.6 Fim de run e Revive

**Definido:**
- Quando o HP do planeta chega a 0, o jogo congela e aparece a oferta de **Revive**: "Assistir anúncio para reviver", com contagem regressiva de 5 s.
  - Só aparece se o Revive ainda não foi usado nesta run **e** se há um anúncio recompensado disponível.
  - Se o jogador assistir até o fim: o planeta volta com **50% do HP máximo** e uma onda de choque destrói todos os inimigos a até 4 u do centro (sem dar Shards). A run continua.
  - Se recusar, se a contagem acabar ou se o anúncio falhar: vai para Results.
- **Pausa:** o botão de pausa congela o jogo. O jogo também **pausa sozinho** quando o app vai para segundo plano ou a aba do navegador perde o foco.

---

## 5. Meta-Progressão (entre runs)

### 5.1 Stardust

**Definido:** Stardust ganho ao fim da run = `floor(totalShardsDaRun × conversão) + 5 × mothershipsDestruídas`, onde a conversão base é **10%** (aumentada pelo Perk Stardust Conversion). `totalShardsDaRun` conta todos os Shards ganhos, inclusive os já gastos.

Na tela de Results, um anúncio recompensado **dobra** o Stardust da run (1 vez por run).

### 5.2 Perks

**Definido:** 17 Perks em 4 **Branches**. Cada Perk tem um ou mais níveis; custo do próximo nível = `baseCost × 1.6^nível`. Os Perks "Starting X" multiplicam ou somam ao valor **base** do Stat no início da run.

**Definido (valor inicial, ajustar via Analytics):**

| Branch | Perk | Níveis | Efeito por nível | baseCost | Pré-requisito |
|---|---|---|---|---|---|
| Offense | Starting Damage | 5 | +5% Damage base | 20 | — |
| Offense | Starting Attack Speed | 5 | +4% Attack Speed base | 20 | — |
| Offense | Starting Crit Chance | 5 | +2 p.p. Critical Chance base | 25 | — |
| Offense | Starting Range | 3 | +5% Attack Range base | 25 | — |
| Offense | Starting Orbit Speed | 3 | +5°/s Orbit Speed base | 30 | — |
| Defense | Starting Hitpoints | 5 | +10% Hitpoints base | 20 | — |
| Defense | Starting Regeneration | 5 | +0,3 HP/s | 25 | — |
| Defense | Starting Defense | 5 | +1 Defense (absolute) | 25 | — |
| Utility | Starting Shards | 5 | Começa a run com +25 Shards | 20 | — |
| Utility | Shards Bonus | 5 | +5 p.p. Resource Bonus base | 30 | — |
| Utility | Stardust Conversion | 5 | +1 p.p. na conversão de Stardust | 40 | — |
| Arsenal | Satellite 2 | 1 | Segundo Satellite | 300 | — |
| Arsenal | Satellite 3 | 1 | Terceiro Satellite | 1.200 | Satellite 2 |
| Arsenal | Satellite 4 | 1 | Quarto Satellite | 4.000 | Satellite 3 |
| Arsenal | Target Priority: Weakest | 1 | Libera Weakest | 100 | — |
| Arsenal | Target Priority: Strongest | 1 | Libera Strongest | 150 | — |
| Arsenal | Target Priority: Farthest | 1 | Libera Farthest | 200 | — |

### 5.3 Planet Cores

**Definido:** o jogador escolhe o Planet Core na tela Core Select, antes de cada run. Planet Cores são desbloqueados **só por conquista**, nunca por Stardust, para não competir com os Perks.

| Planet Core | Modificadores | Desbloqueio |
|---|---|---|
| **Terra Core** | Nenhum (equilibrado) | Desde o início |
| **Ice Core** | +30% em todos os Stats de Defense; −20% Attack Speed; +0,5 u de Attack Range base | Conquista *Frozen Resolve* |
| **Magma Core** | +30% Damage; −25% Hitpoints; −0,5 u de Attack Range base; +15°/s Orbit Speed base | Conquista *Triple Threat* |

### 5.4 Skins

**Definido:** cada Planet Core tem uma Skin padrão ("Classic") e duas Skins desbloqueáveis por conquista. Skins não afetam o gameplay.

| Planet Core | Skins desbloqueáveis |
|---|---|
| Terra Core | Ocean, Desert |
| Ice Core | Aurora, Crystal |
| Magma Core | Obsidian, Solar |

### 5.5 Conquistas

**Definido:** as conquistas ficam dentro do jogo (sem Google Play Games Services na 1.0). O progresso das conquistas "totais" soma todas as runs.

| Conquista | Condição | Recompensa |
|---|---|---|
| First Contact | Completar a primeira run | 25 Stardust |
| Holding the Line | Chegar à Wave 10 | 50 Stardust |
| Frozen Resolve | Chegar à Wave 20 | **Ice Core** |
| Giant Slayer | Destruir a primeira Mothership | Skin Terra "Ocean" |
| Triple Threat | Destruir 3 Motherships (total) | **Magma Core** |
| Deep Space | Chegar à Wave 40 | Skin Terra "Desert" |
| Glacier | Chegar à Wave 30 com Ice Core | Skin Ice "Aurora" |
| Absolute Zero | Chegar à Wave 30 com Ice Core sem comprar nenhum Upgrade de Offense | Skin Ice "Crystal" |
| Eruption | Destruir 1.000 inimigos numa run com Magma Core | Skin Magma "Obsidian" |
| Glass Cannon | Chegar à Wave 25 com Magma Core sem comprar Hitpoints | Skin Magma "Solar" |
| Sniper | Causar um único hit de mais de 10.000 de dano com Impetus acima de 0 | 100 Stardust |
| Critical Mass | Dar 500 críticos numa run | 100 Stardust |
| Untouchable | Destruir uma Mothership sem o planeta tomar dano durante a Boss Wave | 150 Stardust |
| Clean Sweep | Fazer Wave Clear em 10 Waves seguidas antes do timer | 75 Stardust |
| Full Arsenal | Ter 4 Satellites | 100 Stardust |
| Dedicated | Pegar a recompensa diária 7 dias seguidos | 100 Stardust |

### 5.6 Recompensa diária

**Definido:**
- Uma vez por dia (data local do aparelho), o Main Menu oferece a recompensa do dia da sequência: **10 / 15 / 20 / 25 / 30 / 40 / 75 Stardust** (dias 1 a 7).
- Depois do dia 7, a sequência recomeça do dia 1. Perder um dia também volta ao dia 1.
- Um anúncio recompensado **dobra** a recompensa do dia.

### 5.7 Progresso offline

**Definido:** não existe na 1.0. Toda a progressão vem das runs (pilar 2); a recompensa diária cumpre o papel de "motivo para voltar".

---

## 6. Arte e Apresentação

### 6.1 Câmera top-down

**Definido:**
- A câmera olha **de cima (top-down)**. A simulação e a tela usam o mesmo plano 2D: órbitas, alcances e Quadrants são círculos e retas de verdade na tela, sem achatamento.
- Nada fica escondido atrás do planeta: Satellites e inimigos estão sempre visíveis. A ordem de desenho é fixa: fundo, inimigos, planeta, Satellites, projéteis, efeitos.
- A tela é em **paisagem**, com resolução de referência **320×180** e **Pixel Perfect Camera** (escala inteira: 6× em 1080p). Em proporções diferentes de 16:9, o jogo mostra um pouco mais de espaço em vez de distorcer.

### 6.2 Direção de arte

- **Definido: estilo.** Pixel art colorida "clássica", baseada nas referências em `Sprites/8-Bit-Armageddon/_referencia/` (`ref1.png` e `ref2.png`): pixels grandes, sombreamento suave com 3 a 5 tons por objeto, brilho no canto de cima à esquerda (luz vinda de cima à esquerda) e **contorno preto**. O fundo é espaço azul-marinho escuro com estrelas. Os sprites são vistos de cima, com um leve volume (a luz de cima à esquerda dá a sensação de esfera ou cúpula). As referências são arte de banco de imagens com marca d'água: servem de guia para o PixelLab e nunca entram no build.
- **Definido: paleta "meu × deles".**
  - **Planeta (estilo `ref2`):** cores vivas. Cada Planet Core tem a sua própria paleta: Terra = verde e azul, Ice = azul-gelo e branco, Magma = laranja e amarelo.
  - **Satellites:** tons de **cinza** (metal), com uma **luz laranja** piscando como detalhe quente. A silhueta quadrada e o cinza neutro os separam dos inimigos, que são arredondados e lavanda.
  - **Inimigos e projéteis inimigos (estilo `ref1`):** tons frios, puxados para **lavanda e roxo**. Não usam azul, para não se confundir com o Ice Core.
- **Definido: cada Skin é um sprite próprio.** São 9 planetas (3 Planet Cores × 3 Skins), cada um desenhado com as suas cores. O jogo não recolore sprites.
- **Definido: o sprite do planeta não mostra dano.** O planeta tem a mesma cara com qualquer HP; o HP aparece só na barra do HUD, e cada acerto dá um flash no sprite. O planeta **gira**: loop de **32 frames a 4 fps** (8 s por volta), numa faixa de células de 32×32.
- **Em aberto (pós-lançamento):** estados visuais de dano do planeta (ex.: rachaduras com 2/3 e 1/3 do HP). Custariam 3 versões de cada um dos 9 planetas.
- **Definido: grade de 32×32.** Todo PNG de arte (sprites do mundo, ícones, painéis de UI) é montado numa grade de células de **32×32 px**, e no Unity é sempre fatiado com *Sprite Editor → Slice → Grid By Cell Size 32×32*. O desenho fica centralizado na célula, com o pivô no centro e o resto transparente. **Única exceção: a Mothership**, que usa células de **64×64** (fatiada com *Grid By Cell Size 64×64*) para ser claramente maior que qualquer inimigo comum.
- **Definido: tamanhos** (16 pixels por unidade; tamanho do desenho dentro da célula de 32×32):

  | Sprite | Desenho |
  |---|---|
  | Planeta | 32 px (a célula toda, 2 u de diâmetro) |
  | Mothership | ~50×34 px (célula de 64×64) |
  | Brute | 24 px |
  | Grunt / Scout | 16 px |
  | Swarmer | 8 px |
  | Satellite | 14×8 px |
  | Ícones pequenos (Stats, Shards, Stardust, abas da gaveta) | 16 px |
  | Ícones grandes (retratos dos Planet Cores, conquistas) | 32 px (a célula toda) |
- **Definido: Quadrants na tela.** As linhas dos eixos ficam sempre visíveis, bem discretas (1 px pontilhado, quase transparente). O Quadrant onde há um Satellite ganha um preenchimento translúcido quente em forma de quarto de círculo, do tamanho do Attack Range, que pisca mais forte a cada disparo. Assim o jogador vê ao mesmo tempo o que está coberto e até onde vai o alcance. O "Mostrar Quadrants" das Settings esconde o preenchimento; as linhas continuam.
- **Legibilidade dos efeitos:** disparos e críticos precisam ser legíveis mesmo com 150 inimigos na tela. Pixel art pede exagero visual (flash no sprite, números de dano, screen shake leve) para compensar a resolução baixa.
- **Definido: produção da arte.** Toda a arte da 1.0 é gerada no **PixelLab**. Os arquivos ficam neste repositório em `Sprites/8-Bit-Armageddon/{Planet,Satellites,Enemies,Projectiles,VFX,UI,Backgrounds}/`, espelhando `Assets/_Project/Art/`, já com o nome final `SPR_<Tipo>_<Nome>.png`. Candidatos rejeitados vão para `_candidatos_descartados/` dentro da pasta.
- **Definido: direções dos sprites.**
  - **Satellite:** corpo cúbico cinza com dois painéis solares altos, em tons de cinza, com **orientação fixa** (painéis sempre na horizontal): um sprite só, sem direções, e uma luz laranja piscando (2 frames).
  - **Inimigos comuns** (Grunt, Scout, Swarmer, Brute): design **radialmente simétrico** (discos, orbes, cristais), com um sprite só para qualquer direção de chegada. O movimento aparece numa animação de pulsar ou girar.
  - **Scout:** drone lavanda em forma de estrela de 4 pontas, girando (4 frames). A silhueta é diferente da do Grunt, para ler como "o rápido".
  - **Swarmer:** orbe lavanda de 8 px com núcleo magenta pulsando (2 frames). Em cacho, lê como um enxame de luzinhas.
  - **Brute:** disco blindado (um Grunt grande com placas de armadura escuras), de 24 px. Mesma família do Grunt, para o jogador entender "maior e blindado = aguenta mais". Tem **4 variações visuais**, sorteadas no spawn, com os mesmos valores.
  - **Mothership:** disco gigante visto em 3/4 (o mesmo ângulo do Grunt), com uma cúpula magenta e 5 luzes na borda que acendem em sequência (5 frames). Um sprite só, sem direções; o laser sai do centro dela em direção ao planeta.
  - **Grunt:** disco voador lavanda/roxo, com luzes magenta que giram pela borda (4 frames). Tem **2 variações visuais**, sorteadas no spawn, só para dar variedade à tela; as duas são o mesmo inimigo, com os mesmos valores.
  - **Projétil do Satellite:** bolinha brilhante de 4 px em laranja/amarelo, com 2 frames de piscar. É redonda, então não precisa de direções (o projétil é teleguiado e muda de ângulo o tempo todo). O jogo desenha atrás dela um **rastro curto de 2–3 px** na direção do movimento, para não se confundir com as estrelas do fundo.
- **Definido: VFX com sprite** (desenhados por script, células de 32×32 salvo indicação):
  - **Explosão dos inimigos:** um "pop" de pixels magenta e branco que se espalham e somem, em 5 frames. Versão **pequena** (Grunt, Scout, Swarmer), **grande** (Brute) e uma da **Mothership** em células de 64×64.
  - **Laser da Mothership:** o **aviso** é uma linha vermelha tracejada de 1 px que pisca (2 frames); o **disparo** é um feixe de 3 px, com núcleo branco e bordas vermelhas, que tremula (4 frames), mais uma **ponta de impacto** no planeta. O aviso e o feixe são **tiles de 32×32 repetidos** ao longo da linha. Como a Mothership orbita, a linha pode ter qualquer ângulo, então o jogo **gira** esses tiles: é a única exceção à regra de nunca girar sprites. O vermelho é exclusivo do laser e significa "perigo iminente".
  - **Indicador de Spawn Sector:** seta magenta de 16 px na borda da tela, apontando para dentro, piscando (2 frames). Há uma seta desenhada para cada uma das **6 direções** dos centros dos Spawn Sectors (30°, 90°, 150°, 210°, 270°, 330°), então nada é girado.
- **Definido: efeitos sem sprite** (feitos por código ou shader na Unity): flash de dano (o sprite fica branco por 1–2 frames), onda de choque do Revive (anel que cresce até 4 u), preenchimento dos Quadrants e linhas dos eixos, rastro dos projéteis e números de dano (com a fonte da UI).
- **Definido: fundo de espaço.** É montado com **tiles de 32×32** que se repetem sem emenda: azul-marinho com estrelinhas, em 3 ou 4 variações sorteadas. Por cima, estrelas maiores piscando, como sprites separados. Assim o fundo segue a grade de 32×32 e cobre qualquer proporção de tela (Seção 6.1).
- **Em aberto:** quem produz o áudio (artista contratado, packs ou produção própria). O guia Unity especifica a lista de sons, mas não o produtor.

### 6.3 Interface

**Definido: gaveta de upgrades.**
- **Fechada:** uma faixa fina na parte de baixo da tela com o saldo de Shards e 4 abas, cada uma com cor e ícone próprios: **Offense** (laranja), **Defense** (azul), **Utility** (verde) e **Satellites** (cinza). O vermelho fica de fora, porque é exclusivo do laser da Mothership, e a lavanda/magenta também, porque é dos inimigos.
- **Aberta:** tocar numa aba abre a gaveta com cerca de 40% da altura da tela. Os Stats daquela Track aparecem como **cards** numa fileira com rolagem horizontal. Cada card mostra nome, nível, valor atual → próximo valor e custo.
- **Card acessível:** quando o jogador tem Shards para comprar, o card pulsa de leve.
- **Quantidade por compra:** seletor ×1 / ×10 / Max.
- **Câmera:** com a gaveta aberta, a visão desliza para o planeta ficar inteiro no centro da área livre (o mundo sobe; a câmera desce). O jogo nunca pausa.
- **Aba Satellites:** uma linha por Satellite desbloqueado, com um seletor da Target Priority (só as prioridades já desbloqueadas).

**Definido: arte da interface.**
- **Painéis e botões:** metal cinza-escuro, com bordas mais claras e detalhes laranja, na mesma linguagem do Satellite ("equipamento do jogador"). São **9-slice** em células de 32×32, com bordas de 8 px: painel, botão (normal, pressionado e desabilitado) e a faixa da gaveta fechada.
- **Ícones:** 16 px dentro de células de 32×32, todos numa spritesheet só (13 Stats, 4 abas, Shards, Stardust e troféu).
- **Fonte:** **m5x7** (Daniel Linssen, CC0), com 7 px de altura, no tamanho 16 do TextMeshPro. Tem todos os acentos do português, mas em maiúsculas eles ficam espremidos, então a UI usa **maiúsculas e minúsculas**, nunca tudo em caixa alta. A fonte não tem "→": o card de Stat usa ">" entre o valor atual e o próximo. O arquivo e a licença estão em `Sprites/8-Bit-Armageddon/Fonts/`.
- **Retratos e conquistas:** a Core Select usa o **sprite do próprio planeta** girando como retrato de cada Planet Core e Skin. As conquistas usam **um ícone de troféu em 3 estados** (bloqueada, desbloqueada, recompensa coletada), e as que dão um Core ou uma Skin mostram o planeta como recompensa.

**Definido: fluxo de telas.**
1. **Boot:** logo e carregamento.
2. **Consent:** tela de consentimento GDPR/LGPD, só no primeiro uso (e onde a lei exigir).
3. **Main Menu:** Play, Perks, Planet Cores & Skins, Achievements, Daily Reward, Settings.
4. **Core Select:** escolher o Planet Core e a Skin antes da run.
5. **Gameplay:** HUD (HP do planeta, Wave atual e timer, botão de pausa, barra de HP da Mothership quando houver) e a gaveta de upgrades.
6. **Pause:** continuar, Settings, desistir da run (vai para Results).
7. **Revive Offer:** ver Seção 4.6.
8. **Results:** estatísticas da run, Stardust ganho, botão "dobrar com anúncio", botões "jogar de novo" e "menu".

**Definido: Settings e acessibilidade.**
- Volume de música e de efeitos, separados.
- Idioma (English / Português).
- Frame rate: 60 fps ou 30 fps (economia de bateria).
- Vibração on/off.
- Screen shake on/off.
- Números de dano on/off.
- Mostrar Quadrants on/off.
- Modo daltônico: dá aos inimigos uma marca extra, além da cor, para diferenciá-los do planeta e dos Satellites. **Em aberto:** qual marca (contorno de outra cor, ícone, padrão).
- Reduzir flashes: suaviza os flashes de crítico e de dano (fotossensibilidade).
- Resetar progresso, com confirmação dupla.

**Definido: onboarding.** Sem tutorial forçado. Na primeira run, **dicas contextuais** aparecem na hora certa (ex.: "Toque em Offense para comprar Damage" quando o jogador tem Shards pela primeira vez) e somem depois que a ação é feita. Cada dica aparece uma vez por perfil.

### 6.4 Catálogo de assets

Referência técnica para importar e usar a arte no Unity. Os arquivos estão em `Sprites/8-Bit-Armageddon/` (a pasta tem o mesmo nome em `Assets/_Project/Art/`). A arte e as regras visuais são descritas nas Seções 6.1 a 6.3; esta seção só diz **como cada arquivo é usado**.

**Definido: regras gerais.**
- Todo arquivo tem **PPU 16**, **Filter Mode Point** e **Compression None** (preset da Fase 0). O **pivô é sempre o centro** da célula.
- Uma **spritesheet** (arquivo com mais de uma célula) é importada com **Sprite Mode = Multiple** e fatiada com **Grid By Cell Size** do tamanho da célula na tabela. Nos arquivos com mais de uma linha, cada **linha** é uma variação ou direção, e cada **coluna** é um frame.
- **Animação:** frames da esquerda para a direita. "Loop" repete; "uma vez" toca e o objeto volta para o pool.
- **Sorting Layers** (de trás para frente, seguindo a ordem de desenho da Seção 6.1): `Background`, `Quadrants`, `Enemies`, `Planet`, `Satellites`, `Projectiles`, `VFX`. A UI (Canvas) fica por cima de tudo.

#### Mundo

| Arquivo | Célula | Layout | Frames | fps | Animação | Sorting Layer | Uso |
|---|---|---|---|---|---|---|---|
| `Planet/SPR_Planet_<Core>_<Skin>_Rotate` | 32×32 | 1 linha | 32 | 4 | loop | `Planet` | O planeta girando (9 arquivos: 3 Cores × 3 Skins). Uma volta = 8 s. |
| `Planet/SPR_Planet_<Core>_<Skin>` | 32×32 | 1 célula | 1 | — | — | UI | Imagem estática do planeta (= frame 1 da rotação): ícone de recompensa de conquista. |
| `Satellites/SPR_Satellite` | 32×32 | 1 linha | 2 | 2 | loop | `Satellites` | Luz laranja acesa / apagada. Nunca gira. |
| `Projectiles/SPR_Projectile_Satellite` | 32×32 | 1 linha | 2 | 8 | loop | `Projectiles` | Bolinha que pisca. O rastro é desenhado por código (Seção 6.2). |
| `Enemies/SPR_Enemy_Grunt` | 32×32 | 2 linhas × 4 | 4 | 6 | loop | `Enemies` | Linha = variação visual, sorteada no spawn. |
| `Enemies/SPR_Enemy_Scout` | 32×32 | 1 linha | 4 | 12 | loop | `Enemies` | Giro da estrela (os 4 frames fecham uma volta de 90°). |
| `Enemies/SPR_Enemy_Swarmer` | 32×32 | 1 linha | 2 | 4 | loop | `Enemies` | Núcleo pulsando. |
| `Enemies/SPR_Enemy_Brute` | 32×32 | 1 linha | 1 | — | — | `Enemies` | Cada **coluna** é uma variação visual (4), sorteada no spawn. Sem animação. |
| `Enemies/SPR_Enemy_Mothership` | **64×64** | 1 linha | 5 | 5 | loop | `Enemies` | Luzes da borda acendendo em sequência. Única célula de 64×64. |
| `Backgrounds/SPR_Background_Space` | 32×32 | 1 linha | — | — | — | `Background` | 4 tiles de fundo, **sorteados** por célula de 32×32 para cobrir a tela (não é animação). |
| `Backgrounds/SPR_Background_StarTwinkle` | 32×32 | 1 linha | 4 | 4 | loop | `Background` | Estrela grande piscando, espalhada por cima dos tiles. |

#### VFX

| Arquivo | Célula | Frames | fps | Animação | Sorting Layer | Uso |
|---|---|---|---|---|---|---|
| `VFX/SPR_VFX_Explosion_Small` | 32×32 | 5 | 15 | uma vez | `VFX` | Morte de Grunt, Scout e Swarmer. |
| `VFX/SPR_VFX_Explosion_Big` | 32×32 | 5 | 15 | uma vez | `VFX` | Morte do Brute. |
| `VFX/SPR_VFX_Explosion_Mothership` | **64×64** | 6 | 12 | uma vez | `VFX` | Morte da Mothership. |
| `VFX/SPR_VFX_Laser_Warning` | 32×32 | 2 | 6 | loop por 1,5 s | `VFX` | Aviso do laser. Tile repetido e girado ao longo da linha Mothership → planeta (Seção 6.2). |
| `VFX/SPR_VFX_Laser_Beam` | 32×32 | 4 | 12 | loop enquanto dispara | `VFX` | Feixe do laser. Mesmo uso do aviso. |
| `VFX/SPR_VFX_Laser_Impact` | 32×32 | 4 | 12 | loop enquanto dispara | `VFX` | Ponta do feixe, na borda do planeta. |

#### Interface

| Arquivo | Célula | Layout | Uso |
|---|---|---|---|
| `UI/SPR_UI_Panel` | 32×32 | 1 célula | Painel. **9-slice** com bordas de 8 px (*Sprite Editor → Border* = 8 nos 4 lados; na Image, *Image Type = Sliced*). |
| `UI/SPR_UI_Button` | 32×32 | 3 colunas | Botão normal, pressionado e desabilitado (as 3 *sprites* do *Sprite Swap* do Button). 9-slice com bordas de 8 px. |
| `UI/SPR_UI_DrawerStrip` | 32×32 | 1 célula | Faixa da gaveta fechada. *Image Type = Tiled*, repetida na horizontal por toda a largura. |
| `UI/SPR_UI_SpawnSectorArrow` | 32×32 | 6 linhas × 2 | Linha = Spawn Sector (30°, 90°, 150°, 210°, 270°, 330°); coluna = aceso / apagado, piscando a 4 fps durante o aviso de 2 s. |
| `UI/SPR_UI_Icons` | 32×32 | 8 colunas × 3 linhas | Ícones de 16 px centralizados na célula. Ordem das células abaixo. |
| `Fonts/m5x7.ttf` | — | — | Fonte do jogo. Vira um *Font Asset* do TextMeshPro, usado no tamanho 16 (Seção 6.3). |

**Ordem das células de `SPR_UI_Icons`** (da esquerda para a direita, de cima para baixo, começando em 0): 0 Damage · 1 Attack Speed · 2 Critical Chance · 3 Critical Factor · 4 Attack Range · 5 Impetus · 6 Orbit Speed · 7 Hitpoints · 8 Regeneration · 9 Defense (absolute) · 10 Defense (relative) · 11 Resource Bonus · 12 Resource per Wave · 13 aba Offense · 14 aba Defense · 15 aba Utility · 16 aba Satellites · 17 Shards · 18 Stardust · 19 troféu desbloqueado · 20 troféu bloqueado · 21 troféu com recompensa coletada.

---

## 7. Monetização, Plataformas e Serviços

### 7.1 Anúncios

**Definido:**
- **Só anúncios recompensados**, em três momentos: Revive (Seção 4.6), dobrar o Stardust no Results (Seção 5.1) e dobrar a recompensa diária (Seção 5.6).
- **Nenhum intersticial** e **nenhuma compra no app** na 1.0.
- Um botão de anúncio só aparece quando há um anúncio carregado. Se o anúncio falhar ou for fechado antes do fim, o jogador não recebe a recompensa e o jogo segue normalmente.

| Plataforma | Provedor de anúncios |
|---|---|
| Android (Google Play) | Unity LevelPlay, com mediação do Google AdMob |
| Web — site próprio | Google H5 Games Ads (AdSense) |
| Web — itch.io | Nenhum. Os botões de anúncio não aparecem. |

- **Em aberto:** a aprovação do site próprio no programa H5 Games Ads (é por inscrição e não é garantida). Se não for aprovado, o site próprio se comporta como o itch.io, sem mudar código.

### 7.2 Privacidade e consentimento

**Definido:**
- Público declarado no Google Play: **13+** (fora da Families Policy).
- Consentimento GDPR/LGPD pelo **Google UMP** (User Messaging Platform) antes de inicializar anúncios e analytics.
- Política de privacidade publicada no site próprio e linkada no Google Play e nas Settings.

### 7.3 Save

**Definido:**
- **Save só local:** um arquivo JSON versionado no aparelho (na Web, no armazenamento do navegador).
- No Android, o **Auto Backup** do sistema salva a pasta de dados do app na conta Google do jogador, recuperando o progresso ao trocar de celular.
- Sem save na nuvem, sem contas e sem progresso compartilhado entre Web e Android.

### 7.4 Analytics e diagnóstico

**Definido:** Unity Gaming Services **Analytics** (sem login) + diagnóstico de crashes da Unity, ativados só depois do consentimento. Eventos mínimos: início e fim de run (Wave alcançada, duração, Planet Core), compra de Upgrade e de Perk, anúncio oferecido/assistido/recompensado por momento, conquista desbloqueada, recompensa diária coletada. São esses dados que ajustam os valores marcados como "valor inicial" neste documento.

### 7.5 Lançamento

**Definido:**
- **Android:** só Google Play. A conta de desenvolvedor é **pessoal**, então antes de publicar em produção é obrigatório um **teste fechado com pelo menos 12 testadores ativos por 14 dias seguidos**.
- **Web:** mesmo build WebGL publicado no site próprio (com anúncios) e no itch.io (sem anúncios), decidido por uma configuração no carregamento. Alvo: navegadores de desktop. No celular, o jogador é direcionado ao app.
- **Localização:** Unity Localization desde o início, com Inglês e Português (Brasil) no lançamento.

---

## 8. Escopo da versão 1.0

**Definido:** a 1.0 contém:
1. 4 inimigos comuns (Grunt, Scout, Swarmer, Brute) + a Mothership a cada 10 Waves.
2. Waves híbridas com Spawn Sectors e aviso na borda da tela.
3. 13 Stats em 3 Tracks, com Upgrades pela gaveta.
4. 1 a 4 Satellites em órbita, cada um atacando o Quadrant onde está, com Target Priority por Satellite (4 prioridades).
5. 3 Planet Cores, 6 Skins desbloqueáveis, 16 conquistas.
6. Árvore de 17 Perks em 4 Branches.
7. Stardust, recompensa diária e os três anúncios recompensados.
8. Revive, pausa (inclusive automática), Results.
9. Settings e acessibilidade completos (Seção 6.3), dicas contextuais de onboarding.
10. Inglês e Português (Brasil).
11. Android (Google Play) e Web (site próprio + itch.io), com save local, consentimento e analytics.

**Metas de performance (Definido):**
- Android mínimo: 8.0 (API 26).
- Aparelho-alvo: celular de entrada com cerca de 3 GB de RAM (ex.: Moto G de uns 3 anos atrás).
- 60 fps estáveis com 150 inimigos na tela; opção de 30 fps nas Settings.

---

## 9. Roteiro pós-lançamento

Candidatos para updates, em ordem aproximada de prioridade (a decidir com base no Analytics):
- Novos bosses (variações da Mothership com padrões de ataque diferentes).
- Novos Planet Cores e Skins.
- Novos inimigos (ex.: inimigo com escudo frontal, inimigo que ataca à distância).
- Google Play Games Services (conquistas e placares).
- Save na nuvem.
- IAP "remover anúncios" ou pacotes de Stardust, se os dados indicarem.
- Versão iOS.
- Eventos semanais e modos alternativos (ex.: desafio diário com seed fixa).

---

## 10. Guia de Implementação Unity (versão 1.0)

Este guia leva o jogo do projeto vazio até a publicação. Ele continua **didático**: cada fase explica os conceitos novos antes de usar, e termina com algo que dá para ver funcionando. Mas o código é de **produto final**: dados em ScriptableObjects, object pooling, save versionado, sistemas desacoplados e tudo pronto para Android e Web.

Cada fase segue o mesmo formato:
- **Conceitos novos:** o que você vai aprender e por quê.
- **Passos:** o que fazer no Editor e o código completo de cada script.
- **✅ Checkpoint:** como confirmar que funcionou.
- **Problemas comuns:** os erros mais prováveis e como resolver.

### 10.1 Convenções do projeto

**Idioma:** todo nome no projeto (scripts, classes, variáveis, funções, GameObjects, Prefabs, assets, pastas) é em **inglês** e usa os termos do [glossário](contexts/8-bit-armageddon/CONTEXT.md). Se o glossário diz **Satellite**, nada no projeto se chama `Turret`, `Drone` ou `Orbital`. Comentários no código podem ser em português.

**Código C#:**

| Elemento | Padrão | Exemplo |
|---|---|---|
| Namespace | `Armageddon.<Área>` | `Armageddon.Combat` |
| Classe, struct, enum, interface | PascalCase; interfaces com `I` | `WaveDirector`, `IAdService` |
| Método e propriedade | PascalCase | `TryPurchase()`, `CurrentWave` |
| Campo privado | `_camelCase` | `_orbitSpeed` |
| Campo exposto no Inspector | `[SerializeField] private` + `_camelCase` | `[SerializeField] private float _orbitRadius;` |
| Evento C# | PascalCase, verbo no passado, sem `On` | `event Action<Enemy> EnemyKilled;` |
| Método que responde a evento | `Handle` + nome do evento | `HandleEnemyKilled(Enemy enemy)` |
| Constante | PascalCase | `const float OrbitRadius = 1.75f;` |

> Por que `_camelCase` + `[SerializeField] private` em vez de `public`? Um campo `public` pode ser alterado por qualquer outro script, e bugs de "quem mudou esse valor?" são dos mais difíceis de achar. Com `[SerializeField] private`, o valor aparece no Inspector para você ajustar, mas só a própria classe pode alterá-lo em código.

**Assets:**

| Tipo | Padrão | Exemplo |
|---|---|---|
| Prefab | PascalCase, nome do conceito | `Grunt.prefab`, `Satellite.prefab`, `StatCard.prefab` |
| ScriptableObject de dados | `<Tipo>_<Nome>` | `Enemy_Grunt`, `Stat_Damage`, `Perk_StartingDamage`, `Core_Terra` |
| Sprite / spritesheet | `<Tipo>_<Nome>` | `SPR_Planet_Terra_Classic`, `SPR_Enemy_Scout` |
| Áudio | `SFX_<Nome>` / `MUS_<Nome>` | `SFX_SatelliteFire`, `MUS_Gameplay` |
| Cena | PascalCase | `Boot`, `MainMenu`, `Gameplay` |

**Hierarquia das cenas:** cada cena tem GameObjects vazios de agrupamento, na raiz, com nomes entre colchetes: `[Systems]` (gerenciadores sem visual), `[World]` (tudo que aparece no mundo do jogo), `[UI]` (Canvas e telas). Nada solto na raiz além deles, da câmera e do `EventSystem`.

### 10.2 Mapa de sistemas

Todos os scripts principais do jogo, com a fase em que cada um é criado. Use esta tabela como índice: se você se perguntar "onde fica a lógica de X?", a resposta está aqui.

| Área (namespace) | Script | Responsabilidade | Fase |
|---|---|---|---|
| `Armageddon.Core` | `GameBootstrap` | Primeiro código a rodar, antes de qualquer cena: cria o `[Services]` e registra os serviços | 1 |
| `Armageddon.Core` | `BootSequence` | Na cena Boot: mostra o logo e carrega o Main Menu | 1 |
| `Armageddon.Core` | `Services` | Acesso central aos serviços (save, áudio, anúncios…) | 1 |
| `Armageddon.Core` | `SceneLoader` | Troca de cenas com tela de transição | 1 |
| `Armageddon.Core` | `SaveService`, `PlayerProfile`, `SaveStorage` | Save JSON versionado, os dados salvos do jogador e onde eles moram (arquivo ou navegador) | 1 |
| `Armageddon.Core` | `GameClock` | Pausa (manual e automática) e escala de tempo | 1 |
| `Armageddon.Core` | `AppLifecycle` | Segundo plano, perda de foco, fechar o app e o botão "voltar" | 1 |
| `Armageddon.Core` | `DevShortcuts` | Atalhos de teste (só no Editor e em builds de desenvolvimento) | 1 |
| `Armageddon.World` | `WorldLayout` | Medidas do mundo (raio do planeta, órbita, spawn) e a grade de pixels | 2 |
| `Armageddon.World` | `Quadrant`, `Quadrants` | Os 4 Quadrants e em qual deles uma posição ou ângulo está | 2 |
| `Armageddon.World` | `SpriteAnimator` | Loop de frames sem Animator (planeta, estrelas, inimigos, VFX) | 2 |
| `Armageddon.World` | `SpaceBackground` | Fundo em tiles sorteados e estrelas piscando | 2 |
| `Armageddon.World` | `CameraRig` | Pixel Perfect Camera e deslocamento com a gaveta (o shake entra na Fase 12) | 2 |
| `Armageddon.Planets` | `Planet`, `PlanetHealth` | O planeta, HP, dano recebido, regeneração | 2 |
| `Armageddon.Combat` | `Satellite`, `SatelliteOrbit` | Disparo; a órbita compartilhada e o espaçamento dos Satellites | 3 |
| `Armageddon.Combat` | `TargetSelector`, `TargetPriority` | Escolha de alvo dentro do Quadrant e do Attack Range | 3 |
| `Armageddon.Combat` | `ITarget`, `TargetRegistry` | O contrato de "alvo" e a lista dos alvos vivos | 3 |
| `Armageddon.Combat` | `SatelliteStats` | Os Stats de Offense dos Satellites e a fórmula de dano | 3 |
| `Armageddon.Combat` | `Projectile`, `ProjectilePool` | Projétil teleguiado reaproveitado por pooling | 3 |
| `Armageddon.World` | `PixelSprite` | Sprite branco de 1 pixel, criado por código | 3 |
| `Armageddon.Combat` | `QuadrantView` | Mostra na tela o Quadrant coberto por cada Satellite | 3 |
| `Armageddon.Combat` | `CombatDevTools`, `TargetDummy` | Teclas e alvos de teste do combate (só no Editor e em builds de desenvolvimento) | 3 |
| `Armageddon.Enemies` | `EnemyDefinition` | ScriptableObject com os dados de cada inimigo | 4 |
| `Armageddon.Enemies` | `Enemy`, `EnemyPool` | Inimigo em cena (implementa `ITarget` e entra no `TargetRegistry`), pooling e os eventos de morte | 4 |
| `Armageddon.World` | `ExplosionPool` | Explosões (animação "uma vez") reaproveitadas por pooling | 4 |
| `Armageddon.Enemies` | `EnemyDevTools` | Teclas de teste de inimigos (só no Editor e em builds de desenvolvimento) | 4 |
| `Armageddon.Enemies` | `IEnemyMovement`, `StraightMovement`, `ZigZagMovement` | Comportamentos de movimento | 4 |
| `Armageddon.Waves` | `WaveDirector`, `WaveBalance` | Waves híbridas, composição, escalada, fila de spawn, Wave Clear | 5 |
| `Armageddon.Waves` | `SpawnSectorIndicator` | Aviso na borda da tela | 5 |
| `Armageddon.Waves` | `WaveDevTools` | Teclas de teste das Waves (só no Editor e em builds de desenvolvimento) | 5 |
| `Armageddon.Economy` | `StatDefinition`, `StatCatalog` | Definição dos 13 Stats e a ordem deles na gaveta | 6 |
| `Armageddon.Economy` | `RunStats`, `StatModifier` | Nível e valor de cada Stat na run; modificadores de Perks e Planet Core | 6 |
| `Armageddon.Economy` | `ShardWallet`, `UpgradeService` | Saldo de Shards e compra de Upgrades | 6 |
| `Armageddon.Economy` | `RunEconomy` | Cria a economia da run, transforma kills e Wave Clears em Shards e aplica os Stats | 6 |
| `Armageddon.Economy` | `EconomyDevTools` | Teclas de teste da economia (só no Editor e em builds de desenvolvimento) | 6 |
| `Armageddon.UI` | `IntegerCanvasScale` | Escala inteira da UI, igual à da Pixel Perfect Camera | 6 |
| `Armageddon.UI` | `UpgradeDrawer`, `StatCard`, `SatellitePanel` | A gaveta de upgrades | 6 |
| `Armageddon.Enemies` | `Mothership`, `LaserAttack` | O boss e o laser telegrafado | 7 |
| `Armageddon.Run` | `RunController`, `RunSummary` | Ciclo de vida da run, Revive, fim de run | 8 |
| `Armageddon.UI` | `HudView`, `PauseView`, `ReviveOfferView`, `ResultsView` | Telas da run | 8 |
| `Armageddon.Meta` | `PerkDefinition`, `PerkService` | Árvore de Perks | 9 |
| `Armageddon.Meta` | `PlanetCoreDefinition`, `SkinDefinition` | Planet Cores e Skins | 9 |
| `Armageddon.Meta` | `AchievementDefinition`, `AchievementService` | Conquistas | 9 |
| `Armageddon.Meta` | `DailyRewardService` | Recompensa diária | 9 |
| `Armageddon.UI` | `MainMenuView`, `PerkTreeView`, `CoreSelectView`, `AchievementsView` | Telas do menu | 9 |
| `Armageddon.Services` | `IAdService`, `LevelPlayAdService`, `H5AdService`, `NullAdService` | Anúncios por plataforma | 10 |
| `Armageddon.Services` | `ConsentService`, `AnalyticsService` | Consentimento (UMP) e UGS Analytics | 10 |
| `Armageddon.Core` | `SettingsService` | Configurações e acessibilidade | 11 |
| `Armageddon.UI` | `SettingsView` | Tela de Settings | 11 |
| `Armageddon.Juice` | `AudioService`, `CameraShaker`, `DamageNumberSpawner`, `HitFlash` | Som, shake, números de dano, flashes | 12 |
| `Armageddon.Onboarding` | `HintService`, `HintDefinition` | Dicas contextuais | 13 |

### 10.3 Fases

| Fase | Conteúdo | Status |
|---|---|---|
| 0 | Setup do projeto | ✅ Escrita |
| 1 | Arquitetura: bootstrap, serviços, cenas, save, pausa | ✅ Escrita |
| 2 | Planeta, Quadrants e câmera | ✅ Escrita |
| 3 | Satellites, órbita, Target Priority e projéteis | ✅ Escrita |
| 4 | Inimigos | ✅ Escrita |
| 5 | Waves | ✅ Escrita |
| 6 | Stats, Shards, Upgrades e gaveta | ✅ Escrita |
| 7 | Mothership | A escrever |
| 8 | Run: Revive, pausa, Results | A escrever |
| 9 | Meta-progressão: Stardust, Perks, Planet Cores, Skins, conquistas, recompensa diária | A escrever |
| 10 | Anúncios, consentimento e analytics | A escrever |
| 11 | Localização, Settings e acessibilidade | A escrever |
| 12 | Juice e áudio | A escrever |
| 13 | Onboarding | A escrever |
| 14 | Performance e builds (Android e Web) | A escrever |
| 15 | Lançamento | A escrever |

---

### Fase 0 — Setup do Projeto

**Conceitos novos:**
- **Unity Hub e módulos:** o Unity Hub instala versões da Unity e os "módulos" de cada plataforma. Sem o módulo Android, a Unity não consegue gerar o `.aab` para o Google Play; sem o módulo Web, não gera o build de navegador.
- **URP (Universal Render Pipeline):** o sistema de renderização moderna da Unity. O template "Universal 2D" já vem com o renderizador 2D configurado, que é o que usamos para luzes e efeitos em pixel art.
- **Pacote (package):** uma biblioteca oficial da Unity (Input System, Localization…) instalada pelo **Package Manager**. Bibliotecas de terceiros (DOTween) vêm da **Asset Store**.
- **Assembly Definition (asmdef):** um arquivo que agrupa scripts numa "assembly" separada. Com ele, a Unity recompila só o que mudou, e o projeto fica mais rápido de iterar à medida que cresce. Também deixa explícito de quais bibliotecas o seu código depende.
- **Preset:** uma configuração salva (ex.: "como importar um sprite de pixel art") que a Unity aplica automaticamente em todo arquivo novo de uma pasta. Evita o erro clássico de pixel art borrada.
- **Git LFS:** extensão do Git para arquivos binários grandes (imagens, sons). Sem ela, o repositório incha a cada versão de um sprite.

#### Passo 1 — Instalar a Unity

1. Instale o **Unity Hub** (unity.com/download).
2. No Hub, aba **Installs** → **Install Editor** → escolha a versão **Unity 6 LTS** mais recente (versão `6000.x`, marcada como LTS).
3. Na tela de módulos, marque:
   - **Android Build Support**, com os submódulos **OpenJDK** e **Android SDK & NDK Tools**;
   - **Web Build Support**;
   - **Microsoft Visual Studio Community** (ou use o JetBrains Rider / VS Code, se preferir).

> **Por que LTS?** "Long Term Support" recebe só correções de bugs por dois anos, sem mudanças que quebrem o projeto. Para um jogo que vai ser publicado e atualizado, estabilidade vale mais que recurso novo.

#### Passo 2 — Criar o projeto e o repositório

1. No Hub, **Projects** → **New project** → template **Universal 2D**.
   - **Project name:** `EightBitArmageddon` (nomes de projeto que começam com número causam problemas em algumas ferramentas).
   - **Location:** uma pasta **fora** deste repositório de GDD. O projeto Unity é outro repositório.
2. Instale o **Git** e o **Git LFS** (git-lfs.com). Uma vez só na máquina: `git lfs install`.
3. Na pasta raiz do projeto (a que contém `Assets/`, `Packages/`, `ProjectSettings/`), rode `git init`.
4. Crie o arquivo `.gitignore` com o conteúdo do modelo oficial para Unity (github.com/github/gitignore → `Unity.gitignore`). Ele ignora as pastas geradas `Library/`, `Temp/`, `Logs/`, `Obj/`, `Build/` e `UserSettings/`.
5. Crie o arquivo `.gitattributes` para mandar os binários para o LFS:
   ```
   # Imagens
   *.png filter=lfs diff=lfs merge=lfs -text
   *.psd filter=lfs diff=lfs merge=lfs -text
   *.aseprite filter=lfs diff=lfs merge=lfs -text
   # Áudio
   *.wav filter=lfs diff=lfs merge=lfs -text
   *.ogg filter=lfs diff=lfs merge=lfs -text
   *.mp3 filter=lfs diff=lfs merge=lfs -text
   # Fontes
   *.ttf filter=lfs diff=lfs merge=lfs -text
   *.otf filter=lfs diff=lfs merge=lfs -text
   # Arquivos da Unity que são texto (YAML): nunca LFS
   *.unity text
   *.prefab text
   *.asset text
   *.meta text
   ```
6. Na Unity: **Edit > Project Settings > Editor** e confirme:
   - **Version Control > Mode:** `Visible Meta Files`;
   - **Asset Serialization > Mode:** `Force Text`.

   Os dois já são o padrão no Unity 6, mas confira: com arquivos `.meta` escondidos ou cenas em binário, o Git não consegue versionar o projeto direito.
7. Primeiro commit: `git add .` e `git commit -m "Initial Unity project"`.

#### Passo 3 — Instalar os pacotes

Abra **Window > Package Manager**, selecione **Unity Registry** na lateral e instale:

| Pacote | Para quê | Fase em que é usado |
|---|---|---|
| **Input System** | Toque, mouse, teclado e o botão "voltar" do Android. Normalmente já vem instalado no Unity 6. | 1 |
| **Localization** | Textos em Inglês e Português | 11 (mas a configuração base entra na Fase 1) |

O **TextMeshPro** já vem dentro do pacote **Unity UI** no Unity 6. Na primeira vez que você criar um texto TMP, a Unity pede para importar os "TMP Essentials": aceite.

Instale o **DOTween** (animações de UI e juice):
1. Abra a **Asset Store** no navegador e adicione **"DOTween (HOTween v2)"**, da Demigiant (gratuito), à sua conta.
2. Na Unity: **Window > Package Manager** → **My Assets** → DOTween → **Download** → **Import**.
3. Quando o painel do DOTween abrir (ou pelo menu **Tools > Demigiant > DOTween Utility Panel**), clique em **Setup DOTween…**, marque **Create ASMDEF** e clique em **Apply**. Isso cria a assembly `DOTween.Modules`, que o nosso código vai referenciar.

> Os SDKs de serviços (Unity LevelPlay, UGS Analytics, UMP) **não** são instalados agora. Eles entram na Fase 10, junto com a explicação de cada um. Instalar SDK de anúncio cedo só deixa o projeto mais lento de compilar sem nenhum ganho.

#### Passo 4 — Estrutura de pastas

Todo o conteúdo do jogo fica dentro de `Assets/_Project/`. O `_` coloca a pasta no topo da lista, e fica claro o que é nosso e o que veio de pacotes e plugins (DOTween, por exemplo, se instala em `Assets/Plugins/`).

Crie esta estrutura (**botão direito → Create → Folder**):

```
Assets/
  _Project/
    Art/
      Planet/
      Satellites/
      Enemies/
      Projectiles/
      VFX/
      UI/
      Backgrounds/
      Fonts/
    Audio/
      Music/
      SFX/
      Mixers/
    Data/
      Balance/
      Enemies/
      Stats/
      Perks/
      PlanetCores/
      Skins/
      Achievements/
      Hints/
    Localization/
    Prefabs/
      Gameplay/
      UI/
      VFX/
    Scenes/
    Scripts/
      Core/
      World/
      Planet/
      Combat/
      Enemies/
      Waves/
      Economy/
      Run/
      Meta/
      Services/
      UI/
      Juice/
      Onboarding/
    Settings/
      Input/
      Presets/
      Rendering/
```

Mova para `Assets/_Project/Settings/Rendering/` os assets de URP que o template criou na pasta `Assets/Settings/` (arraste pela janela Project da Unity, **nunca** pelo Explorer do Windows, senão as referências se perdem). Depois apague a pasta `Assets/Settings/` vazia.

#### Passo 5 — Assembly Definition

1. Em `Assets/_Project/Scripts/`, **botão direito → Create → Scripting → Assembly Definition**. Nome: `Armageddon`.
2. Selecione o arquivo e, no Inspector, em **Assembly Definition References**, adicione:
   - `Unity.InputSystem`
   - `Unity.TextMeshPro`
   - `Unity.Localization`
   - `Unity.RenderPipelines.Universal.Runtime`
   - `DOTween.Modules`
3. Clique em **Apply**.

Todos os scripts dentro de `Scripts/` (e das subpastas) passam a fazer parte da assembly `Armageddon`.

> Nas próximas fases, se aparecer o erro `The type or namespace name 'X' could not be found` para uma biblioteca instalada, quase sempre falta adicionar a assembly dela aqui. A fase que introduz a biblioteca vai dizer qual referência adicionar.

#### Passo 6 — Preset de importação de pixel art

1. Arraste qualquer PNG de teste para dentro de `Assets/_Project/Art/`.
2. Selecione o PNG e configure no Inspector:
   - **Texture Type:** `Sprite (2D and UI)`
   - **Pixels Per Unit:** `16`
   - **Filter Mode:** `Point (no filter)`
   - **Compression:** `None`
   - **Generate Mip Maps** (em Advanced): desmarcado
3. Clique em **Apply**.
4. No topo do Inspector, clique no ícone de **Preset** (o controle deslizante ao lado do ícone de ajuda) → **Save current to…** → salve como `Assets/_Project/Settings/Presets/SpriteImporter_PixelArt.preset`.
5. Abra **Edit > Project Settings > Preset Manager** → **Add Default Preset** → **Importer > TextureImporter** → escolha `SpriteImporter_PixelArt`. No campo **Filter**, escreva:
   ```
   glob:"Assets/_Project/Art/**"
   ```
6. Apague o PNG de teste.

A partir de agora, toda imagem colocada em `Art/` já entra com as configurações certas de pixel art.

> **Por que PPU 16?** Com 16 pixels por unidade, a tela de referência 320×180 mostra exatamente 20 × 11,25 unidades, e todas as distâncias do GDD (Seção 4) estão nessa unidade. Uma célula de sprite de 32×32 (Seção 6.2) ocupa 2 × 2 u, o tamanho do planeta.

#### Passo 7 — Importar a arte

A arte do jogo já está pronta no repositório do GDD, em `Sprites/8-Bit-Armageddon/`, e cada arquivo está descrito na Seção 6.4. Neste passo ela entra no projeto já configurada. Nenhum sprite será usado em cena ainda: isso começa na Fase 2.

**Conceitos novos:**
- **Sprite Mode Multiple:** um PNG com vários desenhos (uma **spritesheet**) vira vários sprites, um por célula. Sem isso, a Unity trata o arquivo inteiro como uma imagem só.
- **Slice (fatiar):** o Sprite Editor corta a spritesheet em células do mesmo tamanho. No nosso caso, 32×32 (ou 64×64 na Mothership), como definido na Seção 6.2.
- **9-slice:** um sprite com as bordas marcadas. Ao esticar, a Unity estica só o meio e mantém os cantos intactos: é assim que um painel de 32×32 vira uma janela de qualquer tamanho.
- **Sorting Layer:** a "camada" de desenho de um sprite. Quem está numa camada mais de baixo na lista é desenhado por cima.

1. **Copie a arte.** Copie para `Assets/_Project/Art/` as pastas `Planet`, `Satellites`, `Enemies`, `Projectiles`, `VFX`, `UI`, `Backgrounds` e `Fonts` de `Sprites/8-Bit-Armageddon/`. **Não copie** `_candidatos_descartados/`, `_tools/`, `_previews/`, `_referencia/`, os `_preview_*.gif` nem o `PROMPTS.md`: são material de produção, não do jogo. No PowerShell, um comando faz tudo (troque os dois caminhos pelos seus):
   ```powershell
   robocopy "C:\caminho\GDD\Sprites\8-Bit-Armageddon" "C:\caminho\Armageddon\Assets\_Project\Art" /E /XD _candidatos_descartados _tools _previews _referencia /XF PROMPTS.md _preview_*
   ```
   Copiar arquivos **novos** pelo Explorer é seguro; o que quebra referências é **mover** arquivos que a Unity já conhece. Volte para a Unity e espere a importação terminar. O preset do Passo 6 já aplica PPU 16 e Filter Point em tudo.
2. **Marque as spritesheets como Multiple.** Na janela Project, selecione **todos** os PNGs **exceto** os que têm uma célula só (`SPR_Planet_<Core>_<Skin>.png`, os 9 estáticos, mais `SPR_UI_Panel.png` e `SPR_UI_DrawerStrip.png`). Segure Ctrl para selecionar vários. No Inspector, troque **Sprite Mode** para `Multiple` e clique **Apply**.
3. **Fatie cada spritesheet.** Para cada arquivo marcado no item 2: selecione → **Open Sprite Editor** → menu **Slice** → **Type:** `Grid By Cell Size` → **Pixel Size:** `32 × 32` (use **`64 × 64`** em `SPR_Enemy_Mothership` e `SPR_VFX_Explosion_Mothership`) → **Pivot:** `Center` → **Method:** `Delete Existing` → **Slice** → **Apply** (canto de cima à direita). Deixe **Keep Empty Rects** desmarcado: as 2 últimas células de `SPR_UI_Icons` estão vazias e não viram sprite.
4. **Marque as bordas de 9-slice.** Abra o Sprite Editor de `SPR_UI_Panel` e de `SPR_UI_Button`. Clique em cada sprite (o painel, e os 3 estados do botão) e, no quadro **Sprite** do canto de baixo, preencha **Border** `L 8, T 8, R 8, B 8`. **Apply**.
5. **Crie o Font Asset da fonte.** **Window > TextMeshPro > Font Asset Creator** e configure:
   - **Source Font File:** `Art/Fonts/m5x7.ttf`
   - **Sampling Point Size:** `Custom Size` = `16`
   - **Padding:** `0`
   - **Render Mode:** `RASTER_HINTED` (fonte pixel não usa SDF; com SDF ela fica borrada)
   - **Character Set:** `Extended ASCII` (inclui todos os acentos do português)
   - **Atlas Resolution:** `256 × 256`

   Clique **Generate Font Atlas** → **Save** e salve em `Art/Fonts/` como `m5x7 Raster.asset`.
6. **Crie as Sorting Layers.** **Edit > Project Settings > Tags and Layers** → **Sorting Layers** → **+** e crie, **nesta ordem**, abaixo de `Default`: `Background`, `Quadrants`, `Enemies`, `Planet`, `Satellites`, `Projectiles`, `VFX`. A ordem da lista é a ordem de desenho (Seção 6.4): a última fica por cima.

#### Passo 8 — Cenas

Em `Assets/_Project/Scenes/`, crie três cenas (**botão direito → Create → Scene**, ou **File > New Scene** e salve):

| Cena | Para quê |
|---|---|
| `Boot` | Primeira cena. Inicializa os serviços e passa para o Main Menu. Nunca é recarregada. |
| `MainMenu` | Menu, Perks, Planet Cores, conquistas, recompensa diária, Settings |
| `Gameplay` | A run |

Apague a cena de exemplo que veio com o template (`SampleScene`).

Abra **File > Build Profiles** (no Unity 6, substitui o antigo "Build Settings"), clique em **Scene List** e adicione as cenas **nesta ordem**: `Boot` (índice 0), `MainMenu`, `Gameplay`. A cena de índice 0 é a que abre quando o jogo inicia.

#### Passo 9 — Player Settings (todas as plataformas)

**Edit > Project Settings > Player**, na parte comum a todas as plataformas:

| Campo | Valor |
|---|---|
| Company Name | `MangueByteGames` |
| Product Name | `8-Bit Armageddon` (este é o nome que o jogador vê, então pode ter hífen e espaço) |
| Version | `0.1.0` |

Em **Other Settings > Configuration**:
- **Active Input Handling:** `Input System Package (New)`. Se a Unity pedir para reiniciar, reinicie.

#### Passo 10 — Plataforma Android

1. **File > Build Profiles** → selecione **Android** → **Switch Platform**. A troca demora alguns minutos na primeira vez, porque a Unity reimporta os assets para Android.
2. **Edit > Project Settings > Player**, aba **Android**:

| Seção | Campo | Valor | Por quê |
|---|---|---|---|
| Resolution and Presentation | Default Orientation | `Auto Rotation`, marcando só **Landscape Right** e **Landscape Left** | Paisagem, girando conforme o jogador vira o celular |
| Other Settings > Identification | Override Default Package Name | marcado | |
| Other Settings > Identification | Package Name | `com.manguebytegames.eightbitarmageddon` | Identificador único no Google Play. **Não pode mudar depois de publicar.** Nenhum trecho pode começar com número, por isso `eightbit` em vez de `8bit`. |
| Other Settings > Identification | Bundle Version Code | `1` | Número inteiro que o Google Play exige aumentar a cada envio |
| Other Settings > Identification | Minimum API Level | `Android 8.0 'Oreo' (API level 26)` | Meta de performance da Seção 8 |
| Other Settings > Identification | Target API Level | `Automatic (highest installed)` | O Google Play exige uma API alvo recente, e essa exigência sobe todo ano. A Fase 15 confere o valor exigido na época do envio. |
| Other Settings > Configuration | Scripting Backend | `IL2CPP` | Obrigatório para 64 bits e mais rápido que Mono |
| Other Settings > Configuration | Target Architectures | só **ARM64** | O Google Play exige 64 bits, e todo aparelho com Android 8+ do público-alvo é ARM64 |

#### Passo 11 — Plataforma Web

1. **File > Build Profiles** → selecione **Web**. Não precisa trocar a plataforma ativa agora; só confira que ela aparece sem aviso de módulo faltando.
2. **Edit > Project Settings > Player**, aba **Web** → **Publishing Settings**:
   - **Compression Format:** `Brotli`
   - **Decompression Fallback:** marcado. Sem isso, o jogo não abre em servidores que não enviam os cabeçalhos HTTP de compressão (como o itch.io). A Fase 14 detalha a configuração do site próprio.

#### Passo 12 — Commit

Feche a Unity (ela só grava algumas configurações em disco ao fechar), abra de novo, e faça o commit: `git add .` e `git commit -m "Project setup: packages, folders, presets, art import, scenes, platform settings"`.

**✅ Checkpoint:**
- O projeto abre sem nenhuma mensagem vermelha no Console (**Window > General > Console**).
- `Assets/_Project/` tem toda a estrutura de pastas, e `Scripts/` tem o `Armageddon.asmdef`.
- Um PNG novo colocado em `Art/` entra automaticamente com PPU 16 e Filter Point.
- A cena `Boot` está no índice 0 da Scene List.
- Em `Art/Enemies/`, clicar na setinha de `SPR_Enemy_Grunt` mostra 8 sprites (`SPR_Enemy_Grunt_0` a `_7`), e a de `SPR_Enemy_Mothership` mostra 5. Arrastar qualquer um deles para a cena mostra o desenho **nítido**, do tamanho certo (a Mothership bem maior que o Grunt).
- `SPR_UI_Panel` colocado numa **Image** de UI com **Image Type = Sliced** estica sem deformar os cantos.
- Um texto TextMeshPro com a fonte `m5x7 Raster` no tamanho 16 escreve "Ação, não, você" com os acentos e sem borrão.
- As 7 Sorting Layers aparecem na ordem da Seção 6.4.
- *(Recomendado, e economiza muita dor depois)* Com um celular Android conectado por USB, com a **Depuração USB** ativada nas Opções do desenvolvedor, **File > Build Profiles > Android > Build And Run** instala o projeto vazio no aparelho e mostra uma tela azul/cinza. Isso prova que o SDK Android está funcionando antes de existir qualquer código.
- `git lfs ls-files` lista os PNGs que você já tiver no projeto (se ainda não tiver nenhum, a lista fica vazia, o que é normal).

**Problemas comuns:**
- **"Android SDK not found" ou "JDK not found" no build:** os submódulos OpenJDK e Android SDK & NDK não foram instalados. No Hub: **Installs** → engrenagem da versão → **Add modules**.
- **Erros vermelhos do DOTween depois de criar o asmdef:** rode de novo **Tools > Demigiant > DOTween Utility Panel > Setup DOTween…** com **Create ASMDEF** marcado, e confira que `DOTween.Modules` está nas referências do `Armageddon.asmdef`.
- **Uma spritesheet aparece como uma imagem só na cena:** ela ficou como `Single`. Troque o **Sprite Mode** para `Multiple` e fatie (Passo 7, itens 2 e 3).
- **A fatia saiu deslocada ou cortando o desenho:** o **Pixel Size** do slice está errado. Todas as células são 32×32, menos as duas da Mothership (64×64).
- **Texto borrado ou com contorno "fantasma":** o Font Asset foi gerado em modo SDF. Refaça com **Render Mode = `RASTER_HINTED`**.
- **Letras acentuadas aparecem como quadradinhos:** o Font Asset foi gerado com um Character Set sem acentos. Refaça com `Extended ASCII`. O caractere "→" não existe na fonte mesmo (Seção 6.3).
- **Sprites borrados ou "piscando":** o sprite foi importado antes do Preset existir, ou está fora de `Assets/_Project/Art/`. Selecione-o e clique no ícone de Preset → `SpriteImporter_PixelArt`.
- **O celular não aparece no Build And Run:** ative as **Opções do desenvolvedor** no Android (tocar 7 vezes em "Número da versão"), ligue a **Depuração USB** e aceite o pedido de autorização que aparece no celular ao conectar o cabo.
- **Os PNGs foram para o Git como arquivo normal:** o `git lfs install` não foi rodado, ou o `.gitattributes` foi criado depois do commit. Rode `git lfs migrate import --include="*.png,*.wav,*.ogg"` antes de enviar o repositório para qualquer lugar.

---

### Fase 1 — Arquitetura: bootstrap, serviços, cenas, save e pausa

> Objetivo desta fase: o jogo abre na cena `Boot`, inicializa os serviços, mostra o logo e passa para o `MainMenu` com uma transição suave. O progresso do jogador é salvo em disco com versão, e o jogo pausa sozinho quando perde o foco. Nada de gameplay ainda: esta é a "fundação" que todas as outras fases usam.

**Conceitos novos:**
- **Serviço:** um sistema que vive o jogo inteiro e não pertence a nenhuma cena (save, troca de cenas, pausa e, depois, áudio e anúncios). Todos ficam num objeto chamado `[Services]`, que nunca é destruído.
- **Service Locator (`Services`):** uma classe estática com uma propriedade para cada serviço. Qualquer script escreve `Services.Save.Profile` em vez de procurar o objeto na cena. É simples e explícito: você sabe exatamente quais serviços existem olhando um arquivo só.
- **`[RuntimeInitializeOnLoadMethod]`:** um atributo que faz a Unity chamar um método estático **antes da primeira cena carregar**, em qualquer cena. É isso que permite apertar Play direto na cena `Gameplay` e ter os serviços funcionando, sem precisar passar pela `Boot`.
- **`DontDestroyOnLoad`:** marca um objeto para sobreviver à troca de cena.
- **Save versionado:** o arquivo de save guarda o número da versão do formato. Quando o formato mudar numa atualização do jogo, o código sabe converter um save antigo em vez de apagá-lo.
- **Escrita atômica:** o save é escrito num arquivo temporário e só depois substitui o original. Se o celular desligar no meio da escrita, o save antigo continua inteiro.
- **`Time.timeScale`:** o multiplicador de tempo da Unity. Com `0`, tudo o que usa `Time.deltaTime` (movimento, animações, timers) congela; é assim que o jogo pausa. A UI de pausa usa `Time.unscaledDeltaTime`, que ignora o `timeScale`.

#### Passo 1 — Referência do Unity UI no asmdef

A transição de cena usa componentes de UI (`Canvas`, `Image`). Selecione `Assets/_Project/Scripts/Armageddon.asmdef` e, em **Assembly Definition References**, adicione `UnityEngine.UI`. **Apply**.

#### Passo 2 — Os dados salvos: `PlayerProfile`

O `PlayerProfile` é tudo o que o jogo guarda entre sessões. Nesta fase ele só tem o básico; cada fase que precisar salvar algo acrescenta campos aqui.

```csharp
// Caminho: Assets/_Project/Scripts/Core/PlayerProfile.cs
using System;
using System.Collections.Generic;

namespace Armageddon.Core
{
    // Dados salvos do jogador. É um objeto de dados puro, lido e gravado pelo SaveService em JSON.
    // O JsonUtility só grava campos públicos de tipos simples, List e classes/structs [Serializable]:
    // Dictionary NÃO é suportado, por isso os níveis de Perk são uma lista de pares.
    // Exceção à convenção de nomes: por ser um objeto de dados, os campos são públicos em camelCase,
    // e esses nomes viram as chaves do JSON. Renomear um campo é uma mudança de versão do save.
    [Serializable]
    public sealed class PlayerProfile
    {
        public int version;
        public int launchCount;
        public int stardust;
        public List<PerkLevel> perkLevels = new List<PerkLevel>();
        public List<string> unlockedCoreIds = new List<string>();
        public List<string> unlockedSkinIds = new List<string>();
        public string selectedCoreId;
        public string selectedSkinId;

        public static PlayerProfile CreateNew()
        {
            return new PlayerProfile
            {
                version = SaveService.CurrentVersion,
                unlockedCoreIds = new List<string> { "Terra" },
                // A Skin "Classic" de cada Core vem liberada; ela só pode ser usada quando o Core for desbloqueado.
                unlockedSkinIds = new List<string> { "Terra_Classic", "Ice_Classic", "Magma_Classic" },
                selectedCoreId = "Terra",
                selectedSkinId = "Terra_Classic",
            };
        }
    }

    [Serializable]
    public struct PerkLevel
    {
        public string perkId;
        public int level;
    }
}
```

> **Campo novo não precisa de migração.** Ao ler um save antigo, o `JsonUtility` deixa com o valor padrão (0, `null` ou a lista vazia do inicializador) qualquer campo que não existia no arquivo. Só é preciso subir a versão e escrever uma migração quando um campo **muda de nome ou de significado**.

#### Passo 3 — Onde o save é guardado: `SaveStorage`

No Android (e no Editor), o save é um arquivo em `Application.persistentDataPath`. Essa pasta entra no **Auto Backup** do Android (Seção 7.3). Na Web, o jogo usa o armazenamento do navegador via `PlayerPrefs`, que a Unity grava no IndexedDB.

```csharp
// Caminho: Assets/_Project/Scripts/Core/SaveStorage.cs
using System.IO;
using UnityEngine;

namespace Armageddon.Core
{
    // Onde o JSON do save mora. O SaveService não sabe se é arquivo ou navegador: só usa esta interface.
    public interface ISaveStorage
    {
        string Read();          // null se ainda não existe save
        string ReadBackup();    // null se não existe backup
        void Write(string json);
        void Delete();
    }

    public static class SaveStorage
    {
        public static ISaveStorage CreateForPlatform()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            return new PlayerPrefsSaveStorage();
#else
            return new FileSaveStorage(Application.persistentDataPath);
#endif
        }
    }

    // Android, iOS, desktop e Editor: arquivo com escrita atômica e uma cópia de backup.
    public sealed class FileSaveStorage : ISaveStorage
    {
        private readonly string _path;
        private readonly string _tempPath;
        private readonly string _backupPath;

        public FileSaveStorage(string folder)
        {
            _path = Path.Combine(folder, "profile.json");
            _tempPath = _path + ".tmp";
            _backupPath = _path + ".bak";
        }

        public string Read() => File.Exists(_path) ? File.ReadAllText(_path) : null;

        public string ReadBackup() => File.Exists(_backupPath) ? File.ReadAllText(_backupPath) : null;

        public void Write(string json)
        {
            // 1) escreve tudo num arquivo temporário; 2) troca de uma vez só, guardando o anterior como .bak.
            File.WriteAllText(_tempPath, json);
            if (File.Exists(_path))
                File.Replace(_tempPath, _path, _backupPath);
            else
                File.Move(_tempPath, _path);
        }

        public void Delete()
        {
            foreach (var path in new[] { _path, _tempPath, _backupPath })
            {
                if (File.Exists(path)) File.Delete(path);
            }
        }
    }

    // Web: PlayerPrefs, que a Unity grava no IndexedDB do navegador.
    public sealed class PlayerPrefsSaveStorage : ISaveStorage
    {
        private const string Key = "profile";
        private const string BackupKey = "profile.bak";

        public string Read() => PlayerPrefs.HasKey(Key) ? PlayerPrefs.GetString(Key) : null;

        public string ReadBackup() => PlayerPrefs.HasKey(BackupKey) ? PlayerPrefs.GetString(BackupKey) : null;

        public void Write(string json)
        {
            if (PlayerPrefs.HasKey(Key)) PlayerPrefs.SetString(BackupKey, PlayerPrefs.GetString(Key));
            PlayerPrefs.SetString(Key, json);
            PlayerPrefs.Save();
        }

        public void Delete()
        {
            PlayerPrefs.DeleteKey(Key);
            PlayerPrefs.DeleteKey(BackupKey);
            PlayerPrefs.Save();
        }
    }
}
```

#### Passo 4 — O serviço de save: `SaveService`

```csharp
// Caminho: Assets/_Project/Scripts/Core/SaveService.cs
using System;
using UnityEngine;

namespace Armageddon.Core
{
    // Carrega, migra e grava o PlayerProfile. Não é MonoBehaviour: não precisa de cena nem de Update.
    public sealed class SaveService
    {
        // Suba este número quando o formato do save mudar de um jeito que exija migração (ver Migrate).
        public const int CurrentVersion = 1;

        private readonly ISaveStorage _storage;

        public PlayerProfile Profile { get; private set; }

        // Disparado depois de "Resetar progresso" (Settings, Fase 11): quem guarda dados do perfil em cache deve recarregar.
        public event Action ProfileReset;

        public SaveService(ISaveStorage storage)
        {
            _storage = storage;
        }

        public void Load()
        {
            Profile = TryParse(_storage.Read(), "principal")
                      ?? TryParse(_storage.ReadBackup(), "backup")
                      ?? PlayerProfile.CreateNew();
            Migrate(Profile);
        }

        public void Save()
        {
            try
            {
                _storage.Write(JsonUtility.ToJson(Profile));
            }
            catch (Exception e)
            {
                // Falha de disco não pode derrubar o jogo: registra e segue. O próximo Save tenta de novo.
                Debug.LogError($"[SaveService] Falha ao salvar: {e.Message}");
            }
        }

        public void ResetProgress()
        {
            Profile = PlayerProfile.CreateNew();
            Save();
            ProfileReset?.Invoke();
        }

        private static PlayerProfile TryParse(string json, string source)
        {
            if (string.IsNullOrEmpty(json)) return null;
            try
            {
                var profile = JsonUtility.FromJson<PlayerProfile>(json);
                if (profile != null && profile.version > 0) return profile;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[SaveService] Save {source} corrompido: {e.Message}");
            }
            return null;
        }

        private static void Migrate(PlayerProfile profile)
        {
            if (profile.version > CurrentVersion)
            {
                // Save de uma versão mais nova do jogo (ex.: o jogador voltou para um APK antigo). Não mexe em nada.
                Debug.LogWarning($"[SaveService] Save da versão {profile.version}, mais nova que a do jogo ({CurrentVersion}).");
                return;
            }

            while (profile.version < CurrentVersion)
            {
                // Quando existir a versão 2, a conversão da 1 para a 2 entra aqui, por exemplo:
                // if (profile.version == 1) profile.campoNovo = ConverterDe(profile.campoAntigo);
                profile.version++;
            }
        }
    }
}
```

#### Passo 5 — Pausa e tempo: `GameClock`

A pausa pode ter mais de um motivo ao mesmo tempo: o jogador apertou pausa **e** a oferta de Revive está na tela (Fase 8). O `GameClock` guarda um conjunto de motivos, e o jogo só volta a andar quando **todos** saem.

```csharp
// Caminho: Assets/_Project/Scripts/Core/GameClock.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace Armageddon.Core
{
    public enum PauseReason
    {
        Manual,   // botão de pausa, botão "voltar" ou o app perdeu o foco
        Modal,    // uma janela que congela o jogo sem ser a pausa (ex.: oferta de Revive, Fase 8)
    }

    // Dono do Time.timeScale. Nenhum outro script deve alterar Time.timeScale diretamente.
    public sealed class GameClock : MonoBehaviour
    {
        private readonly HashSet<PauseReason> _reasons = new HashSet<PauseReason>();
        private float _timeScale = 1f;
        private bool _wasPaused;

        public bool IsPaused => _reasons.Count > 0;

        // Só existe pausa durante a run. Nos menus, perder o foco não pausa nada.
        public bool IsGameplayActive { get; private set; }

        // true = acabou de pausar; false = acabou de voltar. A PauseView (Fase 8) escuta este evento.
        public event Action<bool> PauseChanged;

        public void SetGameplayActive(bool active)
        {
            IsGameplayActive = active;
            if (!active) _reasons.Clear();
            Apply();
        }

        public void Pause(PauseReason reason)
        {
            if (_reasons.Add(reason)) Apply();
        }

        public void Resume(PauseReason reason)
        {
            if (_reasons.Remove(reason)) Apply();
        }

        public void TogglePause()
        {
            if (_reasons.Contains(PauseReason.Manual)) Resume(PauseReason.Manual);
            else Pause(PauseReason.Manual);
        }

        // Escala de tempo da run quando não está pausada (1 = normal). Reservado para efeitos como câmera lenta.
        public void SetTimeScale(float scale)
        {
            _timeScale = Mathf.Max(0f, scale);
            Apply();
        }

        // Chamado pelo AppLifecycle quando o app vai para segundo plano ou perde o foco.
        // Vira uma pausa MANUAL de propósito: ao voltar, o jogo continua pausado até o jogador tocar em "continuar".
        public void HandleApplicationSuspended()
        {
            if (IsGameplayActive) Pause(PauseReason.Manual);
        }

        private void Apply()
        {
            Time.timeScale = IsPaused ? 0f : _timeScale;
            if (IsPaused == _wasPaused) return;
            _wasPaused = IsPaused;
            Debug.Log(IsPaused ? "[GameClock] Pausado" : "[GameClock] Retomado");
            PauseChanged?.Invoke(IsPaused);
        }
    }
}
```

#### Passo 6 — Troca de cenas: `SceneLoader`

```csharp
// Caminho: Assets/_Project/Scripts/Core/SceneLoader.cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace Armageddon.Core
{
    // Os nomes precisam ser IGUAIS aos nomes dos arquivos de cena (Fase 0, Passo 8).
    public enum GameScene { Boot, MainMenu, Gameplay }

    // Troca de cena com fade para preto. Cria o próprio Canvas de transição: não precisa de prefab.
    public sealed class SceneLoader : MonoBehaviour
    {
        private const float FadeDuration = 0.25f;

        private CanvasGroup _fade;

        public bool IsLoading { get; private set; }

        public event Action<GameScene> SceneLoaded;

        private void Awake()
        {
            _fade = CreateFadeOverlay();
            SceneManager.sceneLoaded += HandleSceneLoaded;
        }

        private void OnDestroy()
        {
            SceneManager.sceneLoaded -= HandleSceneLoaded;
        }

        public void Load(GameScene scene)
        {
            if (IsLoading) return;   // ignora cliques repetidos durante a transição
            StartCoroutine(LoadRoutine(scene));
        }

        private IEnumerator LoadRoutine(GameScene scene)
        {
            IsLoading = true;
            _fade.blocksRaycasts = true;
            yield return Fade(0f, 1f);

            var operation = SceneManager.LoadSceneAsync(scene.ToString());
            while (!operation.isDone) yield return null;

            yield return Fade(1f, 0f);
            _fade.blocksRaycasts = false;
            IsLoading = false;
        }

        // Roda em TODA cena carregada, inclusive a primeira quando você aperta Play direto numa cena.
        private void HandleSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            if (!Enum.TryParse(scene.name, out GameScene gameScene)) return;
            Services.Clock.SetGameplayActive(gameScene == GameScene.Gameplay);
            SceneLoaded?.Invoke(gameScene);
        }

        private IEnumerator Fade(float from, float to)
        {
            // Tempo "unscaled": o fade funciona mesmo com o jogo pausado (timeScale = 0).
            for (float t = 0f; t < FadeDuration; t += Time.unscaledDeltaTime)
            {
                _fade.alpha = Mathf.Lerp(from, to, t / FadeDuration);
                yield return null;
            }
            _fade.alpha = to;
        }

        private CanvasGroup CreateFadeOverlay()
        {
            var root = new GameObject("SceneFade", typeof(Canvas), typeof(GraphicRaycaster), typeof(CanvasGroup));
            root.transform.SetParent(transform, false);

            var canvas = root.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 1000;   // acima de qualquer UI do jogo

            var image = new GameObject("Black", typeof(Image)).GetComponent<Image>();
            image.transform.SetParent(root.transform, false);
            image.color = Color.black;
            var rect = image.rectTransform;
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var group = root.GetComponent<CanvasGroup>();
            group.alpha = 0f;
            group.blocksRaycasts = false;   // só bloqueia toques durante a transição
            group.interactable = false;
            return group;
        }
    }
}
```

#### Passo 7 — Ciclo de vida do app: `AppLifecycle`

```csharp
// Caminho: Assets/_Project/Scripts/Core/AppLifecycle.cs
using UnityEngine;
using UnityEngine.InputSystem;

namespace Armageddon.Core
{
    // Reage aos eventos do sistema: segundo plano, perda de foco, fechar o app e o botão "voltar".
    public sealed class AppLifecycle : MonoBehaviour
    {
        // Android: o app foi para segundo plano (o jogador trocou de app ou apagou a tela).
        private void OnApplicationPause(bool paused)
        {
            if (paused) Suspend();
        }

        // Web e desktop: a aba ou a janela perdeu o foco.
        private void OnApplicationFocus(bool focused)
        {
            // No Editor, clicar no Inspector tira o foco do Game view: pausar aí atrapalharia o desenvolvimento.
            if (Application.isEditor) return;
            if (!focused) Suspend();
        }

        private void OnApplicationQuit()
        {
            Services.Save?.Save();
        }

        private void Update()
        {
            // O botão "voltar" do Android chega como a tecla Escape no Input System. No Editor, é o próprio Esc.
            var keyboard = Keyboard.current;
            if (keyboard == null || !keyboard.escapeKey.wasPressedThisFrame) return;

            // Na run, "voltar" alterna a pausa. Nos menus, cada tela trata o "voltar" (Fase 9).
            if (Services.Clock.IsGameplayActive) Services.Clock.TogglePause();
        }

        private static void Suspend()
        {
            if (!Services.IsReady) return;
            Services.Save.Save();
            Services.Clock.HandleApplicationSuspended();
        }
    }
}
```

#### Passo 8 — O ponto de acesso: `Services`

```csharp
// Caminho: Assets/_Project/Scripts/Core/Services.cs
namespace Armageddon.Core
{
    // Acesso central aos serviços do jogo. Preenchido pelo GameBootstrap antes da primeira cena carregar.
    // Cada fase que cria um serviço novo (áudio, anúncios, settings...) acrescenta uma propriedade aqui.
    public static class Services
    {
        public static SaveService Save { get; private set; }
        public static SceneLoader Scenes { get; private set; }
        public static GameClock Clock { get; private set; }

        public static bool IsReady { get; private set; }

        internal static void Register(SaveService save, SceneLoader scenes, GameClock clock)
        {
            Save = save;
            Scenes = scenes;
            Clock = clock;
            IsReady = true;
        }

        internal static void Clear()
        {
            Save = null;
            Scenes = null;
            Clock = null;
            IsReady = false;
        }
    }
}
```

#### Passo 9 — Atalhos de desenvolvimento: `DevShortcuts`

Enquanto os menus não existem, precisamos de um jeito de trocar de cena e testar o save. Este script só existe no Editor e em builds de desenvolvimento: ele some sozinho do build final.

```csharp
// Caminho: Assets/_Project/Scripts/Core/DevShortcuts.cs
#if UNITY_EDITOR || DEVELOPMENT_BUILD
using UnityEngine;
using UnityEngine.InputSystem;

namespace Armageddon.Core
{
    // F1 = MainMenu · F2 = Gameplay · F5 = +10 Stardust e salva · F9 = apaga o progresso.
    public sealed class DevShortcuts : MonoBehaviour
    {
        private void Update()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null) return;

            if (keyboard.f1Key.wasPressedThisFrame) Services.Scenes.Load(GameScene.MainMenu);
            if (keyboard.f2Key.wasPressedThisFrame) Services.Scenes.Load(GameScene.Gameplay);

            if (keyboard.f5Key.wasPressedThisFrame)
            {
                Services.Save.Profile.stardust += 10;
                Services.Save.Save();
                Debug.Log($"[Dev] Stardust = {Services.Save.Profile.stardust}");
            }

            if (keyboard.f9Key.wasPressedThisFrame)
            {
                Services.Save.ResetProgress();
                Debug.Log("[Dev] Progresso apagado.");
            }
        }
    }
}
#endif
```

#### Passo 10 — Quem liga tudo: `GameBootstrap`

```csharp
// Caminho: Assets/_Project/Scripts/Core/GameBootstrap.cs
using UnityEngine;

namespace Armageddon.Core
{
    // Primeiro código do jogo a rodar, antes de qualquer cena. Cria o objeto [Services] e registra os serviços.
    public static class GameBootstrap
    {
        // Com "Enter Play Mode Options" ligado (sem recarregar o domínio), variáveis estáticas sobrevivem
        // entre um Play e outro. Este método zera tudo no começo de cada Play.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetStatics()
        {
            Services.Clear();
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void Initialize()
        {
            if (Services.IsReady) return;

            var root = new GameObject("[Services]");
            Object.DontDestroyOnLoad(root);

            var save = new SaveService(SaveStorage.CreateForPlatform());
            save.Load();
            save.Profile.launchCount++;
            save.Save();

            var clock = root.AddComponent<GameClock>();
            var scenes = root.AddComponent<SceneLoader>();
            root.AddComponent<AppLifecycle>();
#if UNITY_EDITOR || DEVELOPMENT_BUILD
            root.AddComponent<DevShortcuts>();
#endif

            Services.Register(save, scenes, clock);
            Debug.Log($"[GameBootstrap] Serviços prontos. Abertura nº {save.Profile.launchCount}. Save em: {Application.persistentDataPath}");
        }
    }
}
```

> **Por que o `SceneLoader` usa `Services.Clock` se ele é registrado depois?** O `AddComponent` roda o `Awake` na hora, mas o `SceneLoader` só usa `Services.Clock` quando uma cena carrega, e isso acontece depois do `Initialize` terminar. Regra geral para serviços: **no `Awake`, só configure a si mesmo**; use outros serviços a partir do `Start` ou de eventos.

#### Passo 11 — A cena `Boot`: `BootSequence`

```csharp
// Caminho: Assets/_Project/Scripts/Core/BootSequence.cs
using System.Collections;
using UnityEngine;

namespace Armageddon.Core
{
    // Fica na cena Boot: mostra o logo por um tempo mínimo e passa para o Main Menu.
    // A tela de consentimento (Fase 10) entra entre o logo e o menu.
    public sealed class BootSequence : MonoBehaviour
    {
        [SerializeField] private float _minimumLogoTime = 1f;

        private IEnumerator Start()
        {
            yield return new WaitForSecondsRealtime(_minimumLogoTime);
            Services.Scenes.Load(GameScene.MainMenu);
        }
    }
}
```

Monte as cenas:
1. **Boot:** crie os objetos vazios de agrupamento `[Systems]` e `[UI]` (convenção da Seção 10.1). Em `[Systems]`, adicione um objeto `BootSequence` com o componente `BootSequence`. Em `[UI]`, crie **UI > Canvas** e, dentro dele, **UI > Text - TextMeshPro** escrito "8-Bit Armageddon", com a fonte `m5x7 Raster` no tamanho 16 (Fase 0, Passo 7). Esse é o "logo" provisório.
2. **MainMenu:** crie `[Systems]`, `[UI]` e, no Canvas, um texto "Main Menu".
3. **Gameplay:** crie `[Systems]`, `[World]` e `[UI]`. Para ver a pausa funcionando, coloque um planeta girando em `[World]`: abra a setinha de `Art/Planet/SPR_Planet_Terra_Classic_Rotate`, selecione os 32 sprites (clique no primeiro, Shift+clique no último) e **arraste todos juntos para a cena**. A Unity cria um objeto com `Animator` e um clipe de animação; salve o clipe em `Assets/_Project/Art/Planet/` como `ANIM_Planet_Rotate`. Abra **Window > Animation > Animation**, selecione o objeto, ative **Show Sample Rate** no menu ⋮ da janela e troque **Samples** para `4` (os 4 fps do planeta, Seção 6.4). No `SpriteRenderer`, escolha a **Sorting Layer** `Planet`.

#### Passo 12 — Configuração base da Localization

Os textos só serão traduzidos na Fase 11, mas os idiomas precisam existir desde já, para que todo texto novo nasça localizável.
1. **Edit > Project Settings > Localization** → **Create**. Salve o asset em `Assets/_Project/Localization/` como `LocalizationSettings`.
2. Na mesma tela, clique em **Locale Generator**, marque **English (en)** e **Portuguese (Brazil) (pt-BR)** e clique em **Generate Locales**, salvando em `Assets/_Project/Localization/Locales/`.
3. **Window > Asset Management > Localization Tables** → **New Table Collection** → tipo **String Table Collection**, nome `UI`, marcando os dois idiomas → **Create**, em `Assets/_Project/Localization/`.
4. Crie a primeira chave, `menu.play`, com os valores "Play" (en) e "Jogar" (pt-BR). Ela será usada no botão do Main Menu na Fase 9.

#### Passo 13 — Commit

`git add .` e `git commit -m "Phase 1: bootstrap, services, scene loader, versioned save, pause"`.

**✅ Checkpoint:**
- Com a cena **Boot** aberta, aperte Play: o texto "8-Bit Armageddon" aparece por ~1 s, a tela escurece e clareia, e aparece o "Main Menu". O Console mostra `[GameBootstrap] Serviços prontos. Abertura nº 1`.
- Durante o Play, a janela **Hierarchy** mostra `DontDestroyOnLoad → [Services]` com os componentes `GameClock`, `SceneLoader`, `AppLifecycle` e `DevShortcuts`.
- **F2** leva para o Gameplay com o planeta girando; **F1** volta para o menu. As duas trocas têm o fade.
- No Gameplay, **Esc** congela o planeta (Console: `[GameClock] Pausado`) e **Esc** de novo o faz voltar a girar. No Main Menu, Esc não faz nada.
- Parar e apertar Play de novo mostra `Abertura nº 2`: o save sobreviveu.
- **F5** algumas vezes, pare o Play e abra no Explorer a pasta mostrada no log do `GameBootstrap` ("Save em: …"): o `profile.json` tem `"version":1` e o `stardust` somado. Depois de dois saves, existe também o `profile.json.bak`.
- Apertar Play **direto na cena Gameplay** também funciona (serviços prontos, Esc pausa), sem passar pela Boot.
- **F9** apaga o progresso: no Play seguinte, a abertura volta a ser a nº 1.

**Problemas comuns:**
- **`NullReferenceException` em `Services.Clock` ou `Services.Save`:** algum script usou um serviço no `Awake` de um objeto que foi criado **dentro** do `GameBootstrap.Initialize`, antes do `Services.Register`. Mova esse uso para o `Start` (regra do Passo 10).
- **`The type or namespace name 'UI' does not exist in the namespace 'UnityEngine'`:** faltou adicionar `UnityEngine.UI` ao asmdef (Passo 1).
- **`The type or namespace name 'InputSystem' could not be found`:** falta `Unity.InputSystem` no asmdef (Fase 0, Passo 5), ou o **Active Input Handling** não está em `Input System Package (New)` (Fase 0, Passo 9).
- **O Console mostra `Scene 'Gameplay' couldn't be loaded because it has not been added to the build settings`:** a cena não está na **Scene List** do **File > Build Profiles** (Fase 0, Passo 8), ou o nome do arquivo não é idêntico ao do enum `GameScene`.
- **A abertura é sempre a nº 1:** o save não está sendo gravado. Procure no Console por `[SaveService] Falha ao salvar`; em geral é antivírus ou a pasta sincronizada por nuvem bloqueando o arquivo.
- **O planeta não congela na pausa:** o `Animator` está com **Update Mode = Unscaled Time**. Deixe em `Normal`: tudo o que é gameplay usa o tempo normal, e só a UI de pausa usa o "unscaled".
- **Clicar fora do Game view não pausa o jogo no Editor:** é de propósito (Passo 7). Para testar a pausa automática, rode um build de Android ou Web e troque de app ou de aba.

Próxima fase: **Fase 2 — Planeta, Quadrants e câmera**. Ela coloca o planeta de verdade na cena, com HP, a Pixel Perfect Camera em 320×180 e os 4 Quadrants.

---

### Fase 2 — Planeta, Quadrants e câmera

> Objetivo desta fase: a cena `Gameplay` mostra o fundo de espaço e o planeta girando no centro, nítido em qualquer resolução, com HP, dano (já com a fórmula de defesa) e regeneração. O código já sabe em qual **Quadrant** cada ponto da tela está, e a câmera desliza quando a gaveta de upgrades abrir. Ainda não há Satellites nem inimigos.

**Conceitos novos:**
- **Pixel Perfect Camera:** componente do URP que faz a câmera mostrar exatamente 320×180 pixels do jogo e ampliar por um número **inteiro** (6× em 1080p). Sem ele, a pixel art fica com pixels de tamanhos diferentes e "tremendo" ao se mover.
- **Upscale Render Texture:** o jogo é desenhado primeiro numa imagem de 320×180 e só depois ampliado para a tela. Assim, até o que gira (o laser da Mothership) ou se move meio pixel continua preso à grade de pixels.
- **Unidade de mundo (u):** com PPU 16, 1 u = 16 px. O planeta tem 2 u de diâmetro e a tela mostra 20 × 11,25 u (Seção 4).
- **Sprite animado sem Animator:** para loops simples de frames (planeta, estrelas e, depois, inimigos e Satellites), um componente pequeno que troca o sprite a cada 1/fps segundos é mais leve e mais fácil de reiniciar do que um `Animator` com um controller por objeto. Com 150 inimigos na tela, isso faz diferença.
- **Gizmos:** desenhos que só aparecem na janela Scene (e no Game, se ligados), úteis para ver raios e eixos invisíveis durante o desenvolvimento.

#### Passo 1 — Medidas do mundo: `WorldLayout`

```csharp
// Caminho: Assets/_Project/Scripts/World/WorldLayout.cs
using UnityEngine;

namespace Armageddon.World
{
    // Medidas do mundo em unidades (u). 1 u = 16 px (Seções 4 e 6.1). O planeta fica sempre na origem.
    public static class WorldLayout
    {
        public const float PixelsPerUnit = 16f;
        public const float PlanetRadius = 1f;     // planeta de 32 px = 2 u de diâmetro
        public const float OrbitRadius = 1.75f;   // órbita dos Satellites (Seção 4.1)
        public const float SpawnRadius = 12f;     // onde os inimigos nascem (Seção 4.3)

        public static readonly Vector2 PlanetCenter = Vector2.zero;

        // Arredonda uma posição para a grade de pixels (1/16 u).
        public static float SnapToPixel(float value) => Mathf.Round(value * PixelsPerUnit) / PixelsPerUnit;
    }
}
```

#### Passo 2 — Os 4 Quadrants: `Quadrant`

```csharp
// Caminho: Assets/_Project/Scripts/World/Quadrant.cs
using UnityEngine;

namespace Armageddon.World
{
    // Os 4 Quadrants da tela, centrados no planeta (Seção 4.1), na ordem anti-horária da órbita.
    public enum Quadrant
    {
        TopRight = 0,     //   0° a  90°
        TopLeft = 1,      //  90° a 180°
        BottomLeft = 2,   // 180° a 270°
        BottomRight = 3,  // 270° a 360°
    }

    public static class Quadrants
    {
        // Ângulo em graus: 0° = direita, crescendo no sentido anti-horário (o mesmo da órbita).
        // Um ponto exatamente sobre um eixo fica no Quadrant que COMEÇA naquele ângulo (ex.: 90° = TopLeft),
        // assim ele pertence a um só Quadrant, como pede a Seção 4.1.
        public static Quadrant FromAngle(float degrees)
        {
            float angle = Mathf.Repeat(degrees, 360f);
            return (Quadrant)Mathf.Min(3, Mathf.FloorToInt(angle / 90f));
        }

        public static Quadrant FromPosition(Vector2 position)
        {
            Vector2 offset = position - WorldLayout.PlanetCenter;
            return FromAngle(Mathf.Atan2(offset.y, offset.x) * Mathf.Rad2Deg);
        }

        public static float StartAngle(Quadrant quadrant) => (int)quadrant * 90f;
    }
}
```

#### Passo 3 — Sprites animados: `SpriteAnimator`

```csharp
// Caminho: Assets/_Project/Scripts/World/SpriteAnimator.cs
using System;
using UnityEngine;

namespace Armageddon.World
{
    // Troca o sprite do SpriteRenderer a uma taxa fixa (os fps da Seção 6.4).
    // Usa o tempo normal: pausa junto com o jogo.
    [RequireComponent(typeof(SpriteRenderer))]
    public sealed class SpriteAnimator : MonoBehaviour
    {
        [SerializeField] private Sprite[] _frames;
        [SerializeField] private float _fps = 8f;
        [SerializeField] private bool _loop = true;
        [SerializeField] private bool _randomStartFrame;

        private SpriteRenderer _renderer;
        private float _time;

        public bool IsPlaying { get; private set; }

        // Só para animações "uma vez" (explosões): avisa quando o último frame terminou.
        public event Action Finished;

        private void Awake()
        {
            _renderer = GetComponent<SpriteRenderer>();
        }

        private void OnEnable()
        {
            Play();
        }

        public void SetFrames(Sprite[] frames, float fps, bool loop)
        {
            _frames = frames;
            _fps = fps;
            _loop = loop;
            Play();
        }

        public void Play()
        {
            IsPlaying = _frames != null && _frames.Length > 0 && _fps > 0f;
            if (!IsPlaying) return;
            _time = _randomStartFrame ? UnityEngine.Random.Range(0, _frames.Length) / _fps : 0f;
            Show(Mathf.FloorToInt(_time * _fps));
        }

        private void Update()
        {
            if (!IsPlaying) return;

            _time += Time.deltaTime;
            int frame = Mathf.FloorToInt(_time * _fps);

            if (!_loop && frame >= _frames.Length)
            {
                Show(_frames.Length - 1);
                IsPlaying = false;
                Finished?.Invoke();
                return;
            }

            Show(frame % _frames.Length);
        }

        private void Show(int frame)
        {
            _renderer.sprite = _frames[frame];
        }
    }
}
```

#### Passo 4 — Vida do planeta: `PlanetHealth`

Os valores de HP, regeneração e defesa vêm dos Stats, que só existem na Fase 6. Por enquanto, eles ficam no Inspector com os valores base da Seção 4.2, e os métodos `Set…` já existem para a Fase 6 chamar.

```csharp
// Caminho: Assets/_Project/Scripts/Planet/PlanetHealth.cs
using System;
using UnityEngine;

namespace Armageddon.Planets
{
    // HP do planeta: dano com a fórmula de defesa, regeneração, morte e Revive.
    public sealed class PlanetHealth : MonoBehaviour
    {
        public const float MaxDefenseRelative = 0.75f;   // teto do Stat (Seção 4.2)

        [SerializeField] private float _maxHitpoints = 100f;
        [SerializeField] private float _regeneration;            // HP por segundo
        [SerializeField] private float _defenseAbsolute;
        [SerializeField, Range(0f, MaxDefenseRelative)] private float _defenseRelative;

        public float Current { get; private set; }
        public float Max => _maxHitpoints;
        public bool IsDead { get; private set; }

        public event Action<float> Damaged;   // recebe o dano FINAL, depois da defesa
        public event Action HealthChanged;
        public event Action Died;

        private void Awake()
        {
            Current = _maxHitpoints;
        }

        private void Update()
        {
            if (IsDead || _regeneration <= 0f || Current >= _maxHitpoints) return;
            Current = Mathf.Min(_maxHitpoints, Current + _regeneration * Time.deltaTime);
            HealthChanged?.Invoke();
        }

        // Fórmula da Seção 4.2: max(1, (danoBruto − DefenseAbsolute) × (1 − DefenseRelative)).
        public static float ComputeDamage(float raw, float defenseAbsolute, float defenseRelative)
        {
            return Mathf.Max(1f, (raw - defenseAbsolute) * (1f - defenseRelative));
        }

        public void TakeDamage(float raw)
        {
            if (IsDead || raw <= 0f) return;

            float damage = ComputeDamage(raw, _defenseAbsolute, _defenseRelative);
            Current = Mathf.Max(0f, Current - damage);
            Damaged?.Invoke(damage);
            HealthChanged?.Invoke();

            if (Current <= 0f)
            {
                IsDead = true;
                Died?.Invoke();
            }
        }

        // Upgrade de Hitpoints: o HP atual sobe na mesma quantidade que o máximo (Seção 4.2).
        public void SetMaxHitpoints(float value)
        {
            float gained = value - _maxHitpoints;
            _maxHitpoints = Mathf.Max(1f, value);
            if (gained > 0f && !IsDead) Current += gained;
            Current = Mathf.Min(Current, _maxHitpoints);
            HealthChanged?.Invoke();
        }

        public void SetRegeneration(float hpPerSecond)
        {
            _regeneration = Mathf.Max(0f, hpPerSecond);
        }

        public void SetDefense(float absolute, float relative)
        {
            _defenseAbsolute = Mathf.Max(0f, absolute);
            _defenseRelative = Mathf.Clamp(relative, 0f, MaxDefenseRelative);
        }

        // Revive (Seção 4.6): volta com uma fração do HP máximo.
        public void Revive(float fraction)
        {
            IsDead = false;
            Current = _maxHitpoints * Mathf.Clamp01(fraction);
            HealthChanged?.Invoke();
        }
    }
}
```

#### Passo 5 — O planeta: `Planet`

```csharp
// Caminho: Assets/_Project/Scripts/Planet/Planet.cs
using Armageddon.World;
using UnityEngine;

namespace Armageddon.Planets
{
    // O planeta no centro do mundo. A skin (sprites da rotação) é trocada pela Core Select na Fase 9.
    [RequireComponent(typeof(PlanetHealth))]
    public sealed class Planet : MonoBehaviour
    {
        public PlanetHealth Health { get; private set; }
        public Vector2 Center => WorldLayout.PlanetCenter;
        public float Radius => WorldLayout.PlanetRadius;

        private void Awake()
        {
            Health = GetComponent<PlanetHealth>();
            transform.position = WorldLayout.PlanetCenter;
        }

        // Na janela Scene: o raio do planeta, a órbita dos Satellites, os eixos dos Quadrants e o alcance base (4 u).
        private void OnDrawGizmos()
        {
            Vector3 center = WorldLayout.PlanetCenter;
            Gizmos.color = Color.green;
            Gizmos.DrawWireSphere(center, WorldLayout.PlanetRadius);
            Gizmos.color = Color.gray;
            Gizmos.DrawWireSphere(center, WorldLayout.OrbitRadius);
            Gizmos.color = new Color(1f, 0.6f, 0.2f);
            Gizmos.DrawWireSphere(center, 4f);
            Gizmos.color = Color.white;
            float axis = WorldLayout.SpawnRadius;
            Gizmos.DrawLine(center + Vector3.left * axis, center + Vector3.right * axis);
            Gizmos.DrawLine(center + Vector3.down * axis, center + Vector3.up * axis);
        }
    }
}
```

#### Passo 6 — O fundo de espaço: `SpaceBackground`

```csharp
// Caminho: Assets/_Project/Scripts/World/SpaceBackground.cs
using UnityEngine;

namespace Armageddon.World
{
    // Cobre a área visível com os tiles de fundo sorteados (Seção 6.4) e espalha estrelas piscando por cima.
    // Cobre também uma margem: a câmera desce com a gaveta aberta, e telas mais largas que 16:9 mostram mais espaço.
    public sealed class SpaceBackground : MonoBehaviour
    {
        private const float TileSize = 2f;   // 32 px = 2 u

        [SerializeField] private Sprite[] _tiles;           // as 4 células de SPR_Background_Space
        [SerializeField] private Sprite[] _twinkleFrames;   // as 4 células de SPR_Background_StarTwinkle
        [SerializeField] private float _twinkleFps = 4f;
        [SerializeField] private int _twinkleCount = 8;
        [SerializeField] private int _seed = 7;
        [SerializeField] private float _margin = 3f;
        [SerializeField] private string _sortingLayer = "Background";

        private void Start()
        {
            Build(Camera.main);
        }

        private void Build(Camera view)
        {
            var random = new System.Random(_seed);
            float halfHeight = view.orthographicSize + _margin;
            float halfWidth = view.orthographicSize * view.aspect + _margin;
            int columns = Mathf.CeilToInt(halfWidth / TileSize);
            int rows = Mathf.CeilToInt(halfHeight / TileSize);

            for (int x = -columns; x < columns; x++)
            {
                for (int y = -rows; y < rows; y++)
                {
                    // O pivô é o centro da célula: o centro do tile fica no meio de cada quadrado de 2 u.
                    var position = new Vector2(x * TileSize + TileSize * 0.5f, y * TileSize + TileSize * 0.5f);
                    CreateSprite("Tile", _tiles[random.Next(_tiles.Length)], position, 0);
                }
            }

            for (int i = 0; i < _twinkleCount; i++)
            {
                var position = new Vector2(
                    WorldLayout.SnapToPixel((float)(random.NextDouble() * 2 - 1) * halfWidth),
                    WorldLayout.SnapToPixel((float)(random.NextDouble() * 2 - 1) * halfHeight));
                var star = CreateSprite("Twinkle", _twinkleFrames[0], position, 1);
                star.gameObject.AddComponent<SpriteAnimator>().SetFrames(_twinkleFrames, _twinkleFps, true);
            }
        }

        private SpriteRenderer CreateSprite(string name, Sprite sprite, Vector2 position, int order)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, false);
            go.transform.localPosition = position;
            var renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            renderer.sortingLayerName = _sortingLayer;
            renderer.sortingOrder = order;
            return renderer;
        }
    }
}
```

> As estrelas piscam em sincronia, de propósito: o fundo não deve chamar atenção. A opção **Random Start Frame** do `SpriteAnimator` existe para os inimigos (Fase 4), que ficam mais naturais cada um num frame diferente.

#### Passo 7 — A câmera: `CameraRig`

```csharp
// Caminho: Assets/_Project/Scripts/World/CameraRig.cs
using UnityEngine;

namespace Armageddon.World
{
    // Câmera da run: centrada no planeta, desliza quando a gaveta de upgrades abre (Seção 6.3).
    // Fica no mesmo objeto da Camera e do componente Pixel Perfect Camera (URP). O shake entra na Fase 12.
    [RequireComponent(typeof(Camera))]
    public sealed class CameraRig : MonoBehaviour
    {
        [SerializeField, Range(0f, 0.8f)] private float _drawerScreenFraction = 0.4f;
        [SerializeField] private float _slideTime = 0.15f;

        private Camera _camera;
        private float _currentY;
        private float _targetY;
        private float _velocity;

        public bool IsDrawerOpen { get; private set; }

        private void Awake()
        {
            _camera = GetComponent<Camera>();
            ApplyPosition(0f);
        }

        // A gaveta cobre a parte de baixo da tela. Para o planeta ficar no centro da área livre,
        // a câmera DESCE metade da altura da gaveta (o mundo parece subir).
        public void SetDrawerOpen(bool open)
        {
            IsDrawerOpen = open;
            float viewHeight = _camera.orthographicSize * 2f;
            _targetY = open ? -viewHeight * _drawerScreenFraction * 0.5f : 0f;
        }

        private void LateUpdate()
        {
            // Tempo "unscaled": a câmera termina de deslizar mesmo se o jogo pausar no meio.
            _currentY = Mathf.SmoothDamp(_currentY, _targetY, ref _velocity, _slideTime, Mathf.Infinity, Time.unscaledDeltaTime);
            ApplyPosition(_currentY);
        }

        private void ApplyPosition(float y)
        {
            // Posição presa à grade de pixels: evita o mundo "tremer" meio pixel durante o deslize.
            transform.position = new Vector3(0f, WorldLayout.SnapToPixel(y), -10f);
        }
    }
}
```

#### Passo 8 — Novos atalhos de desenvolvimento

Substitua o `DevShortcuts` da Fase 1 por esta versão, que acrescenta os testes desta fase (F3, F4, F6 e F7):

```csharp
// Caminho: Assets/_Project/Scripts/Core/DevShortcuts.cs
#if UNITY_EDITOR || DEVELOPMENT_BUILD
using Armageddon.Planets;
using Armageddon.World;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Armageddon.Core
{
    // F1 = MainMenu · F2 = Gameplay · F3 = abre/fecha a gaveta (câmera) · F4 = Quadrant sob o mouse
    // F5 = +10 Stardust e salva · F6 = 10 de dano no planeta · F7 = Revive com 50% · F9 = apaga o progresso.
    public sealed class DevShortcuts : MonoBehaviour
    {
        private void Update()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null) return;

            if (keyboard.f1Key.wasPressedThisFrame) Services.Scenes.Load(GameScene.MainMenu);
            if (keyboard.f2Key.wasPressedThisFrame) Services.Scenes.Load(GameScene.Gameplay);

            if (keyboard.f3Key.wasPressedThisFrame)
            {
                var rig = FindAnyObjectByType<CameraRig>();
                if (rig != null) rig.SetDrawerOpen(!rig.IsDrawerOpen);
            }

            if (keyboard.f4Key.wasPressedThisFrame && Mouse.current != null && Camera.main != null)
            {
                Vector2 world = Camera.main.ScreenToWorldPoint(Mouse.current.position.ReadValue());
                Debug.Log($"[Dev] Mouse em {world} → {Quadrants.FromPosition(world)}");
            }

            if (keyboard.f5Key.wasPressedThisFrame)
            {
                Services.Save.Profile.stardust += 10;
                Services.Save.Save();
                Debug.Log($"[Dev] Stardust = {Services.Save.Profile.stardust}");
            }

            var planet = FindAnyObjectByType<Planet>();
            if (planet != null && keyboard.f6Key.wasPressedThisFrame)
            {
                planet.Health.TakeDamage(10f);
                Debug.Log($"[Dev] Planeta: {planet.Health.Current:0.#}/{planet.Health.Max} HP");
            }
            if (planet != null && keyboard.f7Key.wasPressedThisFrame)
            {
                planet.Health.Revive(0.5f);
                Debug.Log($"[Dev] Revive: {planet.Health.Current:0.#}/{planet.Health.Max} HP");
            }

            if (keyboard.f9Key.wasPressedThisFrame)
            {
                Services.Save.ResetProgress();
                Debug.Log("[Dev] Progresso apagado.");
            }
        }
    }
}
#endif
```

#### Passo 9 — Montar a câmera

Abra a cena `Gameplay` e apague o planeta de teste da Fase 1 (o objeto com `Animator`). O clipe `ANIM_Planet_Rotate` e o controller que a Unity criou também podem ser apagados: a partir de agora, o planeta usa o `SpriteAnimator`.

Selecione a **Main Camera** (ela fica na raiz, pela convenção da Seção 10.1):
1. **Camera:** **Projection** = `Orthographic`; **Background Type** = `Solid Color`; cor `#141241` (o azul-marinho do fundo). Assim, se alguma borda aparecer além dos tiles, ela tem a mesma cor.
2. **Add Component → Pixel Perfect Camera** (o do URP):
   - **Assets Pixels Per Unit:** `16`
   - **Reference Resolution:** `320` × `180`
   - **Crop Frame:** `None` (em telas fora de 16:9, o jogo mostra mais espaço em vez de faixas pretas, Seção 6.1)
   - **Grid Snapping:** `Upscale Render Texture`
3. **Add Component → Camera Rig**.

#### Passo 10 — Montar o planeta e o fundo

1. **Fundo:** em `[World]`, crie um objeto vazio `SpaceBackground` na posição (0, 0, 0) com o componente `SpaceBackground`. Em **Tiles**, arraste as 4 células de `Art/Backgrounds/SPR_Background_Space`; em **Twinkle Frames**, as 4 células de `SPR_Background_StarTwinkle`.
   > Para arrastar várias células para uma lista de uma vez: trave o Inspector (cadeado no canto de cima), abra a setinha da spritesheet na janela Project, selecione as células (clique no primeiro, Shift+clique no último) e solte **em cima do nome da lista**.
2. **Planeta:** em `[World]`, crie um objeto `Planet` na posição (0, 0, 0) e adicione:
   - **Sprite Renderer:** **Sprite** = a célula 0 de `SPR_Planet_Terra_Classic_Rotate`; **Sorting Layer** = `Planet`.
   - **Sprite Animator:** **Frames** = as 32 células de `SPR_Planet_Terra_Classic_Rotate`; **Fps** = `4`; **Loop** marcado.
   - **Planet** (o `PlanetHealth` entra junto, pelo `RequireComponent`). Deixe os valores base: **Max Hitpoints** `100`, o resto `0`.
3. Arraste o objeto `Planet` para `Assets/_Project/Prefabs/Gameplay/` para criar o prefab `Planet.prefab`.

#### Passo 11 — Commit

`git add .` e `git commit -m "Phase 2: planet, health, quadrants, pixel perfect camera, background"`.

**✅ Checkpoint:**
- Play na `Gameplay`: o planeta gira no centro, com o fundo de estrelas cobrindo a tela inteira e algumas estrelas grandes piscando.
- Com o **Game view** em `1920x1080`, cada pixel da arte vira um quadrado de 6×6, sem bordas borradas. Trocando para `2560x1080` (21:9) ou `1024x768` (4:3), aparece **mais espaço** dos lados ou em cima e embaixo, sem faixas pretas e sem esticar.
- Na janela **Scene**, os Gizmos mostram o círculo do planeta (verde), a órbita (cinza), o alcance base (laranja) e os dois eixos dos Quadrants.
- **F4** com o mouse em cada canto da tela mostra no Console `TopRight`, `TopLeft`, `BottomLeft` e `BottomRight` nos lugares certos.
- **F3** faz o mundo deslizar para cima (o planeta sobe até o centro dos 60% de cima da tela); **F3** de novo o traz de volta. O movimento é suave e sem tremer.
- **F6** tira 10 de HP (`90/100`, `80/100`…). Com **Defense Absolute** = `5` no Inspector, cada F6 tira só 5. Com **Defense Absolute** = `20`, tira 1 (o mínimo da fórmula).
- Com **Regeneration** = `2`, o HP volta a subir 2 por segundo depois do F6. Com **Esc** (pausa), o planeta, as estrelas e a regeneração param juntos.
- Ao chegar a 0 HP, o dano para de ser aplicado; **F7** traz o planeta de volta com 50 HP.

**Problemas comuns:**
- **A arte aparece borrada ou com pixels de tamanhos diferentes:** a **Reference Resolution** ou o **Assets Pixels Per Unit** da Pixel Perfect Camera não bate com 320×180 / 16, ou o Game view está com **Scale** diferente de 1×. Confira também se os sprites vieram com PPU 16 (preset da Fase 0).
- **Faixas pretas nas bordas:** **Crop Frame** não está em `None`.
- **O fundo não cobre um canto da tela ao abrir a gaveta:** aumente **Margin** no `SpaceBackground`. O valor 3 cobre a gaveta de 40% em 16:9.
- **O planeta não aparece, mas o objeto existe:** a **Sorting Layer** dele está abaixo da `Background`, ou a câmera está com Z maior que 0. O `CameraRig` põe a câmera em Z = −10: não mova a câmera à mão.
- **`'Planet' is a namespace but is used like a type`:** algum script usa o namespace antigo `Armageddon.Planet`. O namespace é `Armageddon.Planets` (com "s"), justamente para não colidir com a classe `Planet`.
- **O planeta gira rápido demais:** o **Fps** do `SpriteAnimator` ficou no padrão (8). O planeta usa 4 (Seção 6.4).

Próxima fase: **Fase 3 — Satellites, órbita, Target Priority e projéteis**. Ela coloca o primeiro Satellite orbitando e atirando no Quadrant onde está.

---

### Fase 3 — Satellites, órbita, Target Priority e projéteis

> Objetivo desta fase: o primeiro Satellite orbita o planeta e atira projéteis teleguiados nos alvos que estão **no Quadrant onde ele está** e dentro do Attack Range, escolhendo o alvo pela sua Target Priority (Seção 4.1). O Quadrant coberto aparece na tela e pisca a cada disparo. Os inimigos de verdade chegam na Fase 4; aqui usamos alvos de teste.

**Conceitos novos:**
- **Interface (`ITarget`):** um "contrato" que diz o que um alvo precisa ter (posição, HP, receber dano), sem dizer o que ele é. Os Satellites atiram em qualquer `ITarget`: hoje num alvo de teste, na Fase 4 num `Enemy`, sem mudar uma linha do código de combate.
- **Registro de alvos (`TargetRegistry`):** uma lista dos alvos vivos. Cada alvo se inscreve ao aparecer e sai ao morrer. Procurar alvos numa lista pronta é muito mais barato do que perguntar à física da Unity, a cada disparo, "quem está perto?".
- **Object pooling (`ObjectPool`):** em vez de criar e destruir um projétil a cada tiro (o que gera lixo de memória e engasgos do *garbage collector*), um conjunto de projéteis é criado uma vez e reaproveitado: "pegar" liga o objeto, "devolver" desliga.
- **Um dono para o tempo da órbita:** o `SatelliteOrbit` move todos os Satellites e chama o `Tick` de cada um, na ordem. Um só `Update` controla tudo, o que evita que dois Satellites discordem sobre o ângulo da órbita.
- **Textura gerada por código:** o preenchimento do Quadrant (um quarto de círculo do tamanho do Attack Range) é desenhado pixel a pixel na hora, para ficar exatamente na grade de pixels em qualquer alcance.

#### Passo 1 — O contrato de alvo e o registro: `ITarget`, `TargetRegistry`

```csharp
// Caminho: Assets/_Project/Scripts/Combat/ITarget.cs
using UnityEngine;

namespace Armageddon.Combat
{
    // Qualquer coisa em que um Satellite pode atirar. O Enemy (Fase 4) implementa esta interface.
    public interface ITarget
    {
        Vector2 Position { get; }
        float CurrentHitpoints { get; }
        bool IsAlive { get; }
        void TakeDamage(float amount, bool isCritical);
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/TargetRegistry.cs
using System.Collections.Generic;
using UnityEngine;

namespace Armageddon.Combat
{
    // Lista dos alvos vivos. Cada alvo se registra no OnEnable e sai no OnDisable.
    public static class TargetRegistry
    {
        private static readonly List<ITarget> _alive = new List<ITarget>();

        public static IReadOnlyList<ITarget> Alive => _alive;

        public static void Register(ITarget target)
        {
            if (!_alive.Contains(target)) _alive.Add(target);
        }

        public static void Unregister(ITarget target)
        {
            _alive.Remove(target);
        }

        // Com "Enter Play Mode Options" (sem recarregar o domínio), a lista estática sobreviveria entre Plays.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetStatics()
        {
            _alive.Clear();
        }
    }
}
```

#### Passo 2 — Os Stats de combate: `SatelliteStats`

Os valores de combate vêm dos Upgrades da Fase 6. Até lá, eles ficam no Inspector do `SatelliteOrbit`, com os valores base da Seção 4.2. A Fase 6 monta um `SatelliteStats` a partir dos Stats da run e chama `SetStats`.

```csharp
// Caminho: Assets/_Project/Scripts/Combat/SatelliteStats.cs
using System;
using UnityEngine;

namespace Armageddon.Combat
{
    // Os Stats de Offense que afetam os Satellites (Seção 4.2), com os valores base.
    // Objeto de dados: campos públicos em camelCase, como o PlayerProfile.
    [Serializable]
    public sealed class SatelliteStats
    {
        public float damage = 10f;
        public float attackSpeed = 1f;          // disparos por segundo, por Satellite
        [Range(0f, 0.8f)] public float criticalChance;
        public float criticalFactor = 1.5f;
        public float attackRange = 4f;          // em u, medido do centro do planeta
        public float impetus;                   // fração por u (0,004 = +0,4 % por u)
        public float orbitSpeed = 45f;          // graus por segundo

        // Fórmula da Seção 4.1: Damage × (1 + Impetus × distânciaAoCentro) × (crítico ? CriticalFactor : 1).
        public float RollDamage(float distanceToCenter, out bool isCritical)
        {
            isCritical = UnityEngine.Random.value < criticalChance;
            float value = damage * (1f + impetus * distanceToCenter);
            return isCritical ? value * criticalFactor : value;
        }
    }
}
```

#### Passo 3 — Escolher o alvo: `TargetPriority`, `TargetSelector`

```csharp
// Caminho: Assets/_Project/Scripts/Combat/TargetSelector.cs
using System.Collections.Generic;
using Armageddon.World;
using UnityEngine;

namespace Armageddon.Combat
{
    // As 4 Target Priorities (Seção 4.1). Closest é a padrão; as outras são liberadas por Perks (Fase 9).
    public enum TargetPriority
    {
        Closest,     // o mais perto do planeta
        Weakest,     // o com menos HP atual
        Strongest,   // o com mais HP atual
        Farthest,    // o mais longe do planeta (sinergia com Impetus)
    }

    public static class TargetSelector
    {
        // Só considera alvos vivos, no Quadrant pedido e dentro do alcance (medido do centro do planeta).
        // Devolve null se não houver ninguém válido.
        public static ITarget Select(IReadOnlyList<ITarget> targets, Quadrant quadrant, float range, TargetPriority priority)
        {
            ITarget best = null;
            float bestScore = float.MaxValue;
            float rangeSquared = range * range;

            for (int i = 0; i < targets.Count; i++)
            {
                var target = targets[i];
                if (!target.IsAlive) continue;

                float distanceSquared = (target.Position - WorldLayout.PlanetCenter).sqrMagnitude;
                if (distanceSquared > rangeSquared) continue;
                if (Quadrants.FromPosition(target.Position) != quadrant) continue;

                // Menor "score" vence: por isso Farthest e Strongest usam o valor negativo.
                float score = priority switch
                {
                    TargetPriority.Closest => distanceSquared,
                    TargetPriority.Farthest => -distanceSquared,
                    TargetPriority.Weakest => target.CurrentHitpoints,
                    TargetPriority.Strongest => -target.CurrentHitpoints,
                    _ => distanceSquared,
                };

                if (score < bestScore)
                {
                    bestScore = score;
                    best = target;
                }
            }

            return best;
        }
    }
}
```

#### Passo 4 — Um pixel de cor: `PixelSprite`

O rastro dos projéteis e as linhas dos eixos são desenhados com sprites de 1 pixel. Em vez de importar um PNG de 1×1, o jogo cria esse sprite na primeira vez que precisa.

```csharp
// Caminho: Assets/_Project/Scripts/World/PixelSprite.cs
using UnityEngine;

namespace Armageddon.World
{
    // Um sprite branco de 1 pixel (1/16 u), criado uma vez. A cor vem do SpriteRenderer.
    public static class PixelSprite
    {
        private static Sprite _white;

        public static Sprite White
        {
            get
            {
                if (_white != null) return _white;
                var texture = new Texture2D(1, 1) { filterMode = FilterMode.Point };
                texture.SetPixel(0, 0, Color.white);
                texture.Apply();
                _white = Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), WorldLayout.PixelsPerUnit);
                return _white;
            }
        }
    }
}
```

#### Passo 5 — O projétil: `Projectile`, `ProjectilePool`

```csharp
// Caminho: Assets/_Project/Scripts/Combat/Projectile.cs
using System;
using Armageddon.World;
using UnityEngine;

namespace Armageddon.Combat
{
    // Projétil teleguiado: persegue o alvo até acertar. Se o alvo morrer antes, some (Seção 4.1).
    // Desenha atrás de si um rastro curto de 3 pixels na direção do movimento (Seção 6.2).
    [RequireComponent(typeof(SpriteRenderer))]
    public sealed class Projectile : MonoBehaviour
    {
        // Em aberto na Seção 4.1: velocidade do projétil. Valor inicial: 10 u/s.
        [SerializeField] private float _speed = 10f;
        [SerializeField] private float _hitDistance = 0.2f;
        [SerializeField] private Color[] _trailColors =
        {
            new Color32(255, 170, 40, 200),
            new Color32(214, 110, 24, 140),
            new Color32(150, 70, 20, 90),
        };

        private ITarget _target;
        private float _damage;
        private bool _isCritical;
        private Action<Projectile> _release;
        private SpriteRenderer[] _trail;

        private void Awake()
        {
            var layer = GetComponent<SpriteRenderer>().sortingLayerName;
            _trail = new SpriteRenderer[_trailColors.Length];
            for (int i = 0; i < _trail.Length; i++)
            {
                var pixel = new GameObject("Trail").AddComponent<SpriteRenderer>();
                pixel.transform.SetParent(transform, false);
                pixel.sprite = PixelSprite.White;
                pixel.color = _trailColors[i];
                pixel.sortingLayerName = layer;
                pixel.sortingOrder = -1;
                _trail[i] = pixel;
            }
        }

        public void Launch(Vector2 from, ITarget target, float damage, bool isCritical, Action<Projectile> release)
        {
            transform.position = from;
            _target = target;
            _damage = damage;
            _isCritical = isCritical;
            _release = release;
            foreach (var pixel in _trail) pixel.enabled = false;
        }

        private void Update()
        {
            if (_target == null || !_target.IsAlive)
            {
                Release();
                return;
            }

            Vector2 position = transform.position;
            Vector2 toTarget = _target.Position - position;
            float step = _speed * Time.deltaTime;

            if (toTarget.magnitude <= Mathf.Max(step, _hitDistance))
            {
                _target.TakeDamage(_damage, _isCritical);
                Release();
                return;
            }

            Vector2 direction = toTarget.normalized;
            position += direction * step;
            transform.position = position;
            PlaceTrail(position, direction);
        }

        private void PlaceTrail(Vector2 head, Vector2 direction)
        {
            // Pixels atrás da bolinha (que tem 4 px), um por pixel de distância, presos à grade.
            const float pixel = 1f / WorldLayout.PixelsPerUnit;
            for (int i = 0; i < _trail.Length; i++)
            {
                Vector2 p = head - direction * (2.5f + i) * pixel;
                _trail[i].transform.position = new Vector3(WorldLayout.SnapToPixel(p.x), WorldLayout.SnapToPixel(p.y), 0f);
                _trail[i].enabled = true;
            }
        }

        private void Release()
        {
            _target = null;
            var release = _release;
            _release = null;          // evita devolver duas vezes para o pool
            release?.Invoke(this);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/ProjectilePool.cs
using UnityEngine;
using UnityEngine.Pool;

namespace Armageddon.Combat
{
    // Reaproveita os projéteis: nada é criado nem destruído durante a run.
    public sealed class ProjectilePool : MonoBehaviour
    {
        [SerializeField] private Projectile _prefab;
        [SerializeField] private int _prewarm = 32;

        private ObjectPool<Projectile> _pool;

        private void Awake()
        {
            _pool = new ObjectPool<Projectile>(
                createFunc: () => Instantiate(_prefab, transform),
                actionOnGet: p => p.gameObject.SetActive(true),
                actionOnRelease: p => p.gameObject.SetActive(false),
                actionOnDestroy: p => Destroy(p.gameObject),
                collectionCheck: false,
                defaultCapacity: _prewarm,
                maxSize: 512);

            // Cria os primeiros projéteis agora, no carregamento, e não no meio do primeiro combate.
            var warm = new Projectile[_prewarm];
            for (int i = 0; i < _prewarm; i++) warm[i] = _pool.Get();
            for (int i = 0; i < _prewarm; i++) _pool.Release(warm[i]);
        }

        public void Fire(Vector2 from, ITarget target, float damage, bool isCritical)
        {
            _pool.Get().Launch(from, target, damage, isCritical, _pool.Release);
        }
    }
}
```

#### Passo 6 — O Satellite e a órbita: `Satellite`, `SatelliteOrbit`

```csharp
// Caminho: Assets/_Project/Scripts/Combat/Satellite.cs
using System;
using System.Collections.Generic;
using Armageddon.World;
using UnityEngine;

namespace Armageddon.Combat
{
    // Um Satellite: fica onde o SatelliteOrbit manda e atira no Quadrant onde está (Seção 4.1).
    // A orientação é fixa: o sprite nunca gira (Seção 6.2).
    public sealed class Satellite : MonoBehaviour
    {
        [SerializeField] private TargetPriority _priority = TargetPriority.Closest;

        private float _cooldown;

        public TargetPriority Priority
        {
            get => _priority;
            set => _priority = value;
        }

        public float AngleDegrees { get; private set; }
        public Quadrant CurrentQuadrant => Quadrants.FromAngle(AngleDegrees);

        public event Action<Satellite> Fired;

        public void SetAngle(float degrees)
        {
            AngleDegrees = Mathf.Repeat(degrees, 360f);
            float radians = AngleDegrees * Mathf.Deg2Rad;
            Vector2 p = WorldLayout.PlanetCenter + new Vector2(Mathf.Cos(radians), Mathf.Sin(radians)) * WorldLayout.OrbitRadius;
            transform.position = new Vector3(WorldLayout.SnapToPixel(p.x), WorldLayout.SnapToPixel(p.y), 0f);
        }

        // Chamado pelo SatelliteOrbit a cada frame. Com o cooldown zerado e ninguém válido, segura o tiro.
        public void Tick(float deltaTime, SatelliteStats stats, IReadOnlyList<ITarget> targets, ProjectilePool projectiles)
        {
            if (_cooldown > 0f)
            {
                _cooldown -= deltaTime;
                if (_cooldown > 0f) return;
            }

            var target = TargetSelector.Select(targets, CurrentQuadrant, stats.attackRange, _priority);
            if (target == null)
            {
                _cooldown = 0f;   // pronto para atirar assim que alguém entrar no Quadrant
                return;
            }

            float distance = Vector2.Distance(target.Position, WorldLayout.PlanetCenter);
            float damage = stats.RollDamage(distance, out bool isCritical);
            projectiles.Fire(transform.position, target, damage, isCritical);

            _cooldown += 1f / Mathf.Max(0.01f, stats.attackSpeed);
            Fired?.Invoke(this);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/SatelliteOrbit.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace Armageddon.Combat
{
    // A órbita compartilhada: todos os Satellites no mesmo círculo, igualmente espaçados,
    // girando juntos no sentido anti-horário na velocidade do Stat Orbit Speed (Seção 4.1).
    public sealed class SatelliteOrbit : MonoBehaviour
    {
        public const int MaxSatellites = 4;

        [SerializeField] private Satellite _satellitePrefab;
        [SerializeField] private ProjectilePool _projectiles;
        [SerializeField, Range(1, MaxSatellites)] private int _startingCount = 1;
        [SerializeField] private SatelliteStats _stats = new SatelliteStats();

        private readonly List<Satellite> _satellites = new List<Satellite>();
        private float _angle = 90f;   // o primeiro Satellite começa no topo

        public IReadOnlyList<Satellite> Satellites => _satellites;
        public SatelliteStats Stats => _stats;

        public event Action<Satellite> SatelliteFired;
        public event Action CountChanged;

        private void Start()
        {
            SetCount(_startingCount);
        }

        public void SetStats(SatelliteStats stats)
        {
            _stats = stats;
        }

        // Perks Satellite 2/3/4 (Seção 5.2). Os novos entram já espaçados; ninguém "pula" de posição.
        public void SetCount(int count)
        {
            count = Mathf.Clamp(count, 1, MaxSatellites);

            while (_satellites.Count < count)
            {
                var satellite = Instantiate(_satellitePrefab, transform);
                satellite.Fired += HandleSatelliteFired;
                _satellites.Add(satellite);
            }

            while (_satellites.Count > count)
            {
                var last = _satellites[_satellites.Count - 1];
                last.Fired -= HandleSatelliteFired;
                _satellites.RemoveAt(_satellites.Count - 1);
                Destroy(last.gameObject);
            }

            PlaceSatellites();
            CountChanged?.Invoke();
        }

        private void Update()
        {
            float deltaTime = Time.deltaTime;
            if (deltaTime <= 0f) return;   // pausado: nem gira nem atira

            _angle = Mathf.Repeat(_angle + _stats.orbitSpeed * deltaTime, 360f);
            PlaceSatellites();

            var targets = TargetRegistry.Alive;
            for (int i = 0; i < _satellites.Count; i++)
            {
                _satellites[i].Tick(deltaTime, _stats, targets, _projectiles);
            }
        }

        private void PlaceSatellites()
        {
            if (_satellites.Count == 0) return;
            float spacing = 360f / _satellites.Count;
            for (int i = 0; i < _satellites.Count; i++)
            {
                _satellites[i].SetAngle(_angle + i * spacing);
            }
        }

        private void HandleSatelliteFired(Satellite satellite)
        {
            SatelliteFired?.Invoke(satellite);
        }
    }
}
```

#### Passo 7 — Mostrar os Quadrants: `QuadrantView`

Como definido na Seção 6.2: as linhas dos eixos ficam sempre visíveis e discretas, e o Quadrant onde há um Satellite ganha um preenchimento translúcido quente do tamanho do Attack Range, que pisca mais forte a cada disparo.

```csharp
// Caminho: Assets/_Project/Scripts/Combat/QuadrantView.cs
using Armageddon.World;
using UnityEngine;

namespace Armageddon.Combat
{
    // Desenha os eixos dos Quadrants e o preenchimento dos Quadrants cobertos (Seção 6.2).
    public sealed class QuadrantView : MonoBehaviour
    {
        [SerializeField] private SatelliteOrbit _orbit;
        [SerializeField] private Color _fillColor = new Color(1f, 0.67f, 0.24f, 0.13f);
        [SerializeField] private float _flashAlpha = 0.3f;
        [SerializeField] private float _flashDecayPerSecond = 4f;
        [SerializeField] private Color _axisColor = new Color(0.9f, 0.86f, 1f, 0.16f);
        [SerializeField] private string _sortingLayer = "Quadrants";

        private readonly SpriteRenderer[] _fills = new SpriteRenderer[4];
        private readonly float[] _flash = new float[4];
        private readonly bool[] _covered = new bool[4];
        private Texture2D _fillTexture;
        private float _builtRange = -1f;
        private bool _fillVisible = true;

        private void Start()
        {
            BuildAxes();
            _orbit.SatelliteFired += HandleSatelliteFired;
        }

        private void OnDestroy()
        {
            if (_orbit != null) _orbit.SatelliteFired -= HandleSatelliteFired;
            if (_fillTexture != null) Destroy(_fillTexture);
        }

        // "Mostrar Quadrants" das Settings (Fase 11): esconde o preenchimento; as linhas continuam.
        public void SetFillVisible(bool visible)
        {
            _fillVisible = visible;
        }

        private void LateUpdate()
        {
            float range = _orbit.Stats.attackRange;
            if (!Mathf.Approximately(range, _builtRange)) BuildFills(range);

            for (int q = 0; q < 4; q++) _covered[q] = false;
            foreach (var satellite in _orbit.Satellites) _covered[(int)satellite.CurrentQuadrant] = true;

            for (int q = 0; q < 4; q++)
            {
                _flash[q] = Mathf.Max(0f, _flash[q] - _flashDecayPerSecond * Time.deltaTime);
                var color = _fillColor;
                color.a = Mathf.Lerp(_fillColor.a, _flashAlpha, _flash[q]);
                _fills[q].color = color;
                _fills[q].enabled = _fillVisible && _covered[q];
            }
        }

        private void HandleSatelliteFired(Satellite satellite)
        {
            _flash[(int)satellite.CurrentQuadrant] = 1f;
        }

        // Um quarto de círculo de raio = Attack Range, pixel a pixel. Girado de 90 em 90 graus para os 4 Quadrants,
        // o que não distorce os pixels.
        private void BuildFills(float range)
        {
            _builtRange = range;
            int size = Mathf.Max(1, Mathf.CeilToInt(range * WorldLayout.PixelsPerUnit));

            if (_fillTexture != null) Destroy(_fillTexture);
            _fillTexture = new Texture2D(size, size) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Clamp };
            var pixels = new Color32[size * size];
            float radiusSquared = size * size;
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dx = x + 0.5f, dy = y + 0.5f;
                    pixels[y * size + x] = dx * dx + dy * dy <= radiusSquared ? new Color32(255, 255, 255, 255) : new Color32(0, 0, 0, 0);
                }
            }
            _fillTexture.SetPixels32(pixels);
            _fillTexture.Apply();
            var sprite = Sprite.Create(_fillTexture, new Rect(0, 0, size, size), Vector2.zero, WorldLayout.PixelsPerUnit);

            for (int q = 0; q < 4; q++)
            {
                if (_fills[q] == null)
                {
                    _fills[q] = new GameObject($"Fill {(Quadrant)q}").AddComponent<SpriteRenderer>();
                    _fills[q].transform.SetParent(transform, false);
                    _fills[q].transform.localRotation = Quaternion.Euler(0f, 0f, q * 90f);
                    _fills[q].sortingLayerName = _sortingLayer;
                }
                _fills[q].transform.position = WorldLayout.PlanetCenter;
                _fills[q].sprite = sprite;
            }
        }

        // Duas linhas pontilhadas (1 px aceso, 2 apagados) cruzando a área do jogo.
        private void BuildAxes()
        {
            int length = Mathf.CeilToInt(WorldLayout.SpawnRadius * 2f * WorldLayout.PixelsPerUnit);
            var texture = new Texture2D(length, 1) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Clamp };
            for (int x = 0; x < length; x++) texture.SetPixel(x, 0, x % 3 == 0 ? Color.white : Color.clear);
            texture.Apply();
            var sprite = Sprite.Create(texture, new Rect(0, 0, length, 1), new Vector2(0.5f, 0.5f), WorldLayout.PixelsPerUnit);

            for (int i = 0; i < 2; i++)
            {
                var axis = new GameObject(i == 0 ? "Axis X" : "Axis Y").AddComponent<SpriteRenderer>();
                axis.transform.SetParent(transform, false);
                axis.transform.position = WorldLayout.PlanetCenter;
                axis.transform.localRotation = Quaternion.Euler(0f, 0f, i * 90f);
                axis.sprite = sprite;
                axis.color = _axisColor;
                axis.sortingLayerName = _sortingLayer;
                axis.sortingOrder = 1;
            }
        }
    }
}
```

#### Passo 8 — Ferramentas de teste de combate: `TargetDummy`, `CombatDevTools`

```csharp
// Caminho: Assets/_Project/Scripts/Combat/TargetDummy.cs
#if UNITY_EDITOR || DEVELOPMENT_BUILD
using UnityEngine;

namespace Armageddon.Combat
{
    // Alvo parado, só para testes até os inimigos existirem (Fase 4). Some do build final.
    public sealed class TargetDummy : MonoBehaviour, ITarget
    {
        private float _hitpoints;

        public Vector2 Position => transform.position;
        public float CurrentHitpoints => _hitpoints;
        public bool IsAlive => _hitpoints > 0f;

        public static TargetDummy Spawn(Vector2 position, Sprite sprite, float hitpoints)
        {
            var go = new GameObject("TargetDummy");
            go.transform.position = position;
            var renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            renderer.sortingLayerName = "Enemies";
            var dummy = go.AddComponent<TargetDummy>();
            dummy._hitpoints = hitpoints;
            return dummy;
        }

        private void OnEnable() => TargetRegistry.Register(this);
        private void OnDisable() => TargetRegistry.Unregister(this);

        public void TakeDamage(float amount, bool isCritical)
        {
            if (!IsAlive) return;
            _hitpoints -= amount;
            Debug.Log($"[Dummy] -{amount:0.#}{(isCritical ? " CRÍTICO" : "")} → {Mathf.Max(0f, _hitpoints):0.#} HP");
            if (_hitpoints <= 0f) Destroy(gameObject);
        }
    }
}
#endif
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/CombatDevTools.cs
using UnityEngine;
#if UNITY_EDITOR || DEVELOPMENT_BUILD
using UnityEngine.InputSystem;
#endif

namespace Armageddon.Combat
{
    // Teclas de teste do combate: T = alvo de teste no mouse · 1–4 = número de Satellites · Q = troca a Target Priority.
    // A CLASSE existe em todo build (ela fica numa cena); os campos e o Update somem do build final.
    // Se a classe inteira sumisse, a cena teria um "Missing Script" no build final.
    public sealed class CombatDevTools : MonoBehaviour
    {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
        [SerializeField] private SatelliteOrbit _orbit;
        [SerializeField] private Sprite _dummySprite;
        [SerializeField] private float _dummyHitpoints = 30f;

        private void Update()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null) return;

            if (keyboard.tKey.wasPressedThisFrame && Mouse.current != null && Camera.main != null)
            {
                Vector2 world = Camera.main.ScreenToWorldPoint(Mouse.current.position.ReadValue());
                TargetDummy.Spawn(world, _dummySprite, _dummyHitpoints);
            }

            if (keyboard.digit1Key.wasPressedThisFrame) _orbit.SetCount(1);
            if (keyboard.digit2Key.wasPressedThisFrame) _orbit.SetCount(2);
            if (keyboard.digit3Key.wasPressedThisFrame) _orbit.SetCount(3);
            if (keyboard.digit4Key.wasPressedThisFrame) _orbit.SetCount(4);

            if (keyboard.qKey.wasPressedThisFrame)
            {
                foreach (var satellite in _orbit.Satellites)
                {
                    satellite.Priority = (TargetPriority)(((int)satellite.Priority + 1) % 4);
                }
                Debug.Log($"[Dev] Target Priority: {_orbit.Satellites[0].Priority}");
            }
        }
#endif
    }
}
```

#### Passo 9 — Prefabs e cena

1. **Prefab do projétil:** crie um objeto vazio `Projectile` com:
   - **Sprite Renderer:** célula 0 de `Art/Projectiles/SPR_Projectile_Satellite`; **Sorting Layer** `Projectiles`.
   - **Sprite Animator:** as 2 células; **Fps** `8`; **Loop** marcado (Seção 6.4).
   - **Projectile** (valores padrão).

   Arraste para `Assets/_Project/Prefabs/Gameplay/` e apague da cena.
2. **Prefab do Satellite:** objeto vazio `Satellite` com:
   - **Sprite Renderer:** célula 0 de `Art/Satellites/SPR_Satellite`; **Sorting Layer** `Satellites`.
   - **Sprite Animator:** as 2 células; **Fps** `2`; **Loop** marcado.
   - **Satellite** (Priority `Closest`).

   Arraste para `Prefabs/Gameplay/` e apague da cena.
3. Na cena `Gameplay`:
   - Em `[Systems]`, crie `ProjectilePool` com o componente `ProjectilePool`, e o prefab `Projectile` em **Prefab**.
   - Em `[World]`, crie `SatelliteOrbit` na posição (0, 0, 0) com o componente `SatelliteOrbit`: **Satellite Prefab** = `Satellite`; **Projectiles** = o `ProjectilePool` da cena; **Starting Count** `1`. Os **Stats** já vêm com os valores base.
   - Em `[World]`, crie `QuadrantView` na posição (0, 0, 0) com o componente `QuadrantView` e o `SatelliteOrbit` em **Orbit**.
   - Em `[Systems]`, crie `CombatDevTools` com o componente `CombatDevTools`: **Orbit** = o `SatelliteOrbit`; **Dummy Sprite** = a célula 0 de `Art/Enemies/SPR_Enemy_Grunt`.

#### Passo 10 — Commit

`git add .` e `git commit -m "Phase 3: satellites, orbit, quadrants, target priority, homing projectiles"`.

**✅ Checkpoint:**
- Play na `Gameplay`: um Satellite começa no topo e dá uma volta em **8 s** no sentido anti-horário (Orbit Speed 45°/s). O Quadrant onde ele está fica levemente iluminado, e o destaque passa de Quadrant em Quadrant junto com ele.
- As duas linhas pontilhadas dos eixos cruzam a tela e ficam sempre visíveis.
- **T** com o mouse dentro do círculo laranja dos Gizmos cria um alvo de teste. O Satellite só atira nele **enquanto estiver no mesmo Quadrant**. Um alvo fora do círculo (Attack Range 4 u) nunca é atingido.
- Cada disparo é uma bolinha com um rastro curto que persegue o alvo e faz o Quadrant piscar. O Console mostra `-10 → 20 HP`, e na terceira bala o alvo some.
- Com a cadência base (1 disparo/s) e 2 s em cada Quadrant, um alvo de 30 HP colocado sozinho num Quadrant morre depois de umas duas passagens do Satellite.
- **2**, **3** e **4** trocam o número de Satellites, que se reorganizam igualmente espaçados. Com **4**, os quatro Quadrants ficam acesos o tempo todo.
- Com dois alvos no mesmo Quadrant (um perto e um longe do planeta), **Q** alterna a Target Priority: em `Closest` o de perto é atingido primeiro; em `Farthest`, o de longe.
- No Inspector do `SatelliteOrbit`, **Critical Chance** `0,5` faz metade dos disparos aparecer como `CRÍTICO`, com 15 de dano (10 × 1,5).
- **Esc** pausa tudo: a órbita, os projéteis no ar e o piscar do Quadrant.

**Problemas comuns:**
- **O Satellite gira mas nunca atira:** o alvo está fora do Attack Range (confira o círculo laranja), ou o `SatelliteOrbit` está sem o **Projectiles** preenchido (o Console mostra um `NullReferenceException`).
- **O Satellite atira num alvo de outro Quadrant:** confira se o objeto `SatelliteOrbit` e o planeta estão na posição (0, 0, 0). Os Quadrants são medidos a partir de `WorldLayout.PlanetCenter`, que é a origem.
- **O preenchimento aparece por cima do planeta ou dos inimigos:** a Sorting Layer `Quadrants` precisa estar logo acima de `Background` e abaixo de `Enemies` (Fase 0, Passo 7).
- **O preenchimento aparece borrado:** a Pixel Perfect Camera precisa estar com **Grid Snapping** = `Upscale Render Texture` (Fase 2).
- **O projétil some antes de chegar:** o alvo morreu no caminho (outro projétil chegou antes). É o comportamento definido na Seção 4.1.
- **`Missing (Mono Script)` no `CombatDevTools` de um build:** alguém envolveu a classe inteira em `#if`. Só os campos e o `Update` ficam dentro do `#if`, como no código acima.

Próxima fase: **Fase 4 — Inimigos**. Ela cria o `Enemy` (que implementa `ITarget`), os 4 inimigos comuns com os seus movimentos, o pooling e a explosão ao morrer.

---

### Fase 4 — Inimigos

> Objetivo desta fase: os 4 inimigos comuns (Grunt, Scout, Swarmer e Brute) existem como dados, nascem, avançam até o planeta com o seu movimento, causam dano ao tocar e explodem ao morrer para os Satellites. Todos são reaproveitados por pooling. As Waves (quem nasce, quando e onde) entram na Fase 5; aqui os inimigos são criados por teclas de teste.

**Conceitos novos:**
- **ScriptableObject (`EnemyDefinition`):** um arquivo de dados na pasta do projeto, editado no Inspector, que não pertence a nenhuma cena. Cada inimigo é um asset (`Enemy_Grunt`, `Enemy_Scout`…) com os valores da Seção 4.4. Mudar o HP do Grunt é mudar um número num asset, sem tocar em código.
- **Um prefab para todos os inimigos comuns:** o `Enemy` não sabe se é um Grunt ou um Brute: ele recebe uma `EnemyDefinition` ao nascer e passa a se comportar como ela. É isso que permite um pool só para os 4 tipos.
- **Estratégia de movimento (`IEnemyMovement`):** o jeito de andar é um objeto separado que o inimigo usa. Linha reta e zigue-zague são duas implementações da mesma interface; um movimento novo (Seção 9) é só mais uma classe.
- **Kamikaze:** o inimigo não atira. Ele anda até o planeta e, ao tocar (distância ao centro < raio do planeta, Seção 4.4), causa dano e some **sem dar Shards**.
- **Eventos de morte:** o `EnemyPool` avisa quando um inimigo foi destruído por um Satellite (`EnemyKilled`) ou quando bateu no planeta (`EnemyReachedPlanet`). Quem se importa escuta: os Shards (Fase 6), as estatísticas da run (Fase 8) e as conquistas (Fase 9). O inimigo não precisa conhecer nenhum desses sistemas.

#### Passo 1 — Movimentos: `IEnemyMovement`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/EnemyMovement.cs
using UnityEngine;

namespace Armageddon.Enemies
{
    // Todo inimigo avança em linha reta para o centro do planeta. O movimento só decide o desvio LATERAL
    // (perpendicular à direção do planeta) em função do tempo de vida do inimigo.
    public interface IEnemyMovement
    {
        float LateralOffset(float time);
    }

    public enum MovementKind { Straight, ZigZag }

    // Grunt, Swarmer e Brute (Seção 4.4). Não guarda estado: uma instância serve para todos.
    public sealed class StraightMovement : IEnemyMovement
    {
        public static readonly StraightMovement Instance = new StraightMovement();

        public float LateralOffset(float time) => 0f;
    }

    // Scout: zigue-zague leve (amplitude 0,5 u, 1,5 Hz, Seção 4.4). Também não guarda estado.
    public sealed class ZigZagMovement : IEnemyMovement
    {
        private readonly float _amplitude;
        private readonly float _frequency;

        public ZigZagMovement(float amplitude, float frequency)
        {
            _amplitude = amplitude;
            _frequency = frequency;
        }

        public float LateralOffset(float time) => _amplitude * Mathf.Sin(2f * Mathf.PI * _frequency * time);
    }
}
```

#### Passo 2 — Os dados de um inimigo: `EnemyDefinition`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/EnemyDefinition.cs
using System;
using System.Collections.Generic;
using Armageddon.World;
using UnityEngine;

namespace Armageddon.Enemies
{
    // Um inimigo comum (Seção 4.4). Os valores são os da Wave 1; a escalada por Wave (Seção 4.3) é
    // aplicada no spawn, pelos multiplicadores que a Fase 5 calcula.
    [CreateAssetMenu(menuName = "Armageddon/Enemy Definition", fileName = "Enemy_")]
    public sealed class EnemyDefinition : ScriptableObject
    {
        [Header("Valores na Wave 1 (Seção 4.4)")]
        [SerializeField] private float _hitpoints = 10f;
        [SerializeField] private float _damage = 5f;
        [SerializeField] private float _speed = 0.8f;             // u/s
        [SerializeField] private float _shards = 1f;              // 0,5 = "1 a cada 2" (Swarmer)

        [Header("Movimento")]
        [SerializeField] private MovementKind _movement = MovementKind.Straight;
        [SerializeField] private float _zigZagAmplitude = 0.5f;
        [SerializeField] private float _zigZagFrequency = 1.5f;

        [Header("Spawn (usados pelas Waves, Fase 5)")]
        [SerializeField] private int _unlockWave = 1;
        [SerializeField] private float _spawnWeight = 50f;
        [SerializeField] private int _clusterSize = 1;            // Swarmer: 8
        [SerializeField] private float _clusterSpread = 0.6f;     // raio do cacho, em u

        [Header("Visual (Seção 6.4)")]
        [SerializeField] private List<SpriteVariant> _variants = new List<SpriteVariant>();
        [SerializeField] private float _fps = 6f;
        [SerializeField] private ExplosionKind _explosion = ExplosionKind.Small;

        [NonSerialized] private IEnemyMovement _movementInstance;

        public float Hitpoints => _hitpoints;
        public float Damage => _damage;
        public float Speed => _speed;
        public float Shards => _shards;
        public int UnlockWave => _unlockWave;
        public float SpawnWeight => _spawnWeight;
        public int ClusterSize => _clusterSize;
        public float ClusterSpread => _clusterSpread;
        public IReadOnlyList<SpriteVariant> Variants => _variants;
        public float Fps => _fps;
        public ExplosionKind Explosion => _explosion;

        // Os movimentos não guardam estado, então todos os inimigos do mesmo tipo usam a mesma instância.
        public IEnemyMovement Movement
        {
            get
            {
                if (_movementInstance == null)
                {
                    _movementInstance = _movement == MovementKind.ZigZag
                        ? new ZigZagMovement(_zigZagAmplitude, _zigZagFrequency)
                        : StraightMovement.Instance;
                }
                return _movementInstance;
            }
        }
    }

    // Uma variação visual: os frames de uma linha da spritesheet (Grunt), ou uma célula só (Brute).
    // O Unity não serializa Sprite[][], por isso cada variação é um objeto com a sua lista.
    [Serializable]
    public sealed class SpriteVariant
    {
        public Sprite[] frames;
    }
}
```

#### Passo 3 — As explosões: `ExplosionPool`

```csharp
// Caminho: Assets/_Project/Scripts/World/ExplosionPool.cs
using System;
using UnityEngine;
using UnityEngine.Pool;

namespace Armageddon.World
{
    public enum ExplosionKind { Small, Big, Mothership }

    // Toca uma explosão (animação "uma vez", Seção 6.4) e devolve o objeto ao pool quando ela termina.
    public sealed class ExplosionPool : MonoBehaviour
    {
        [Serializable]
        private sealed class ExplosionFrames
        {
            public ExplosionKind kind;
            public Sprite[] frames;
            public float fps = 15f;
        }

        [SerializeField] private ExplosionFrames[] _explosions;
        [SerializeField] private int _prewarm = 16;
        [SerializeField] private string _sortingLayer = "VFX";

        private ObjectPool<SpriteAnimator> _pool;

        private void Awake()
        {
            _pool = new ObjectPool<SpriteAnimator>(
                createFunc: Create,
                actionOnGet: a => a.gameObject.SetActive(true),
                actionOnRelease: a => a.gameObject.SetActive(false),
                actionOnDestroy: a => Destroy(a.gameObject),
                collectionCheck: false,
                defaultCapacity: _prewarm,
                maxSize: 256);

            var warm = new SpriteAnimator[_prewarm];
            for (int i = 0; i < _prewarm; i++) warm[i] = _pool.Get();
            for (int i = 0; i < _prewarm; i++) _pool.Release(warm[i]);
        }

        public void Play(ExplosionKind kind, Vector2 position)
        {
            var explosion = Find(kind);
            if (explosion == null) return;

            var animator = _pool.Get();
            animator.transform.position = new Vector3(WorldLayout.SnapToPixel(position.x), WorldLayout.SnapToPixel(position.y), 0f);
            animator.SetFrames(explosion.frames, explosion.fps, false);
        }

        private SpriteAnimator Create()
        {
            var go = new GameObject("Explosion");
            go.transform.SetParent(transform, false);
            go.AddComponent<SpriteRenderer>().sortingLayerName = _sortingLayer;
            var animator = go.AddComponent<SpriteAnimator>();
            animator.Finished += () => _pool.Release(animator);
            return animator;
        }

        private ExplosionFrames Find(ExplosionKind kind)
        {
            foreach (var explosion in _explosions)
            {
                if (explosion.kind == kind) return explosion;
            }
            return null;
        }
    }
}
```

#### Passo 4 — O inimigo em cena: `Enemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/Enemy.cs
using Armageddon.Combat;
using Armageddon.Planets;
using Armageddon.World;
using UnityEngine;

namespace Armageddon.Enemies
{
    // Um inimigo comum vivo. Recebe a EnemyDefinition ao nascer (um prefab serve para todos os tipos).
    [RequireComponent(typeof(SpriteRenderer), typeof(SpriteAnimator))]
    public sealed class Enemy : MonoBehaviour, ITarget
    {
        private EnemyDefinition _definition;
        private IEnemyMovement _movement;
        private PlanetHealth _planet;
        private EnemyPool _pool;
        private SpriteAnimator _animator;
        private Vector2 _radialPosition;   // a posição "na linha reta" até o planeta, sem o desvio lateral
        private float _hitpoints;
        private float _damage;
        private float _age;
        private bool _alive;

        public EnemyDefinition Definition => _definition;
        public Vector2 Position { get; private set; }
        public float CurrentHitpoints => _hitpoints;
        public bool IsAlive => _alive;

        private void Awake()
        {
            _animator = GetComponent<SpriteAnimator>();
        }

        // Chamado pelo EnemyPool. Os multiplicadores são a escalada por Wave (Seção 4.3); 1 = valores da Wave 1.
        internal void Spawn(EnemyDefinition definition, Vector2 position, float hitpointsMultiplier, float damageMultiplier,
                            PlanetHealth planet, EnemyPool pool)
        {
            _definition = definition;
            _movement = definition.Movement;
            _planet = planet;
            _pool = pool;
            _radialPosition = position;
            _hitpoints = definition.Hitpoints * hitpointsMultiplier;
            _damage = definition.Damage * damageMultiplier;
            _age = 0f;
            _alive = true;

            // Variação visual sorteada no spawn (Seção 6.2). O prefab tem "Random Start Frame" marcado,
            // para os inimigos não piscarem todos em sincronia.
            var variant = definition.Variants[Random.Range(0, definition.Variants.Count)];
            _animator.SetFrames(variant.frames, definition.Fps, true);

            ApplyPosition();
            TargetRegistry.Register(this);
        }

        private void Update()
        {
            if (!_alive) return;
            float deltaTime = Time.deltaTime;
            if (deltaTime <= 0f) return;

            _age += deltaTime;
            Vector2 toCenter = WorldLayout.PlanetCenter - _radialPosition;
            float distance = toCenter.magnitude;

            // Tocou o planeta (Seção 4.4): causa dano e some, sem Shards.
            if (distance <= WorldLayout.PlanetRadius)
            {
                _planet.TakeDamage(_damage);
                Die(killed: false);
                return;
            }

            _radialPosition += toCenter / distance * Mathf.Min(_definition.Speed * deltaTime, distance);
            ApplyPosition();
        }

        public void TakeDamage(float amount, bool isCritical)
        {
            if (!_alive) return;
            _hitpoints -= amount;
            if (_hitpoints <= 0f) Die(killed: true);
        }

        private void ApplyPosition()
        {
            Vector2 toCenter = WorldLayout.PlanetCenter - _radialPosition;
            Vector2 forward = toCenter.sqrMagnitude > 0f ? toCenter.normalized : Vector2.zero;
            Vector2 side = new Vector2(-forward.y, forward.x);
            Position = _radialPosition + side * _movement.LateralOffset(_age);
            transform.position = new Vector3(WorldLayout.SnapToPixel(Position.x), WorldLayout.SnapToPixel(Position.y), 0f);
        }

        private void Die(bool killed)
        {
            _alive = false;
            TargetRegistry.Unregister(this);
            _pool.HandleEnemyGone(this, killed);
        }

        // Segurança: se a cena for descarregada com o inimigo vivo, ele sai do registro.
        private void OnDisable()
        {
            if (!_alive) return;
            _alive = false;
            TargetRegistry.Unregister(this);
        }
    }
}
```

#### Passo 5 — Criar e reaproveitar inimigos: `EnemyPool`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/EnemyPool.cs
using System;
using Armageddon.Planets;
using Armageddon.World;
using UnityEngine;
using UnityEngine.Pool;

namespace Armageddon.Enemies
{
    // Cria os inimigos comuns (com cachos, no caso do Swarmer), reaproveita-os e avisa quando cada um some.
    public sealed class EnemyPool : MonoBehaviour
    {
        [SerializeField] private Enemy _prefab;
        [SerializeField] private PlanetHealth _planet;
        [SerializeField] private ExplosionPool _explosions;
        [SerializeField] private int _prewarm = 64;

        private ObjectPool<Enemy> _pool;

        // Inimigos vivos agora. A Fase 5 usa para o limite de 150 na tela e para o Wave Clear.
        public int AliveCount { get; private set; }

        public event Action<Enemy> EnemyKilled;          // destruído por um Satellite: vale Shards (Fase 6)
        public event Action<Enemy> EnemyReachedPlanet;   // kamikaze: já causou o dano; não vale Shards

        private void Awake()
        {
            _pool = new ObjectPool<Enemy>(
                createFunc: () => Instantiate(_prefab, transform),
                actionOnGet: e => e.gameObject.SetActive(true),
                actionOnRelease: e => e.gameObject.SetActive(false),
                actionOnDestroy: e => Destroy(e.gameObject),
                collectionCheck: false,
                defaultCapacity: _prewarm,
                maxSize: 256);

            var warm = new Enemy[_prewarm];
            for (int i = 0; i < _prewarm; i++) warm[i] = _pool.Get();
            for (int i = 0; i < _prewarm; i++) _pool.Release(warm[i]);
        }

        // Um "slot de spawn" (Seção 4.3): 1 inimigo, ou um cacho de ClusterSize (Swarmer = 8) espalhado em volta do ponto.
        public void Spawn(EnemyDefinition definition, Vector2 position, float hitpointsMultiplier = 1f, float damageMultiplier = 1f)
        {
            int count = Mathf.Max(1, definition.ClusterSize);
            for (int i = 0; i < count; i++)
            {
                Vector2 p = count == 1 ? position : position + UnityEngine.Random.insideUnitCircle * definition.ClusterSpread;
                AliveCount++;
                _pool.Get().Spawn(definition, p, hitpointsMultiplier, damageMultiplier, _planet, this);
            }
        }

        // Chamado pelo próprio Enemy ao morrer ou ao tocar o planeta.
        internal void HandleEnemyGone(Enemy enemy, bool killed)
        {
            AliveCount--;
            // A explosão aparece nos dois casos: destruído no espaço ou batendo no planeta.
            _explosions.Play(enemy.Definition.Explosion, enemy.Position);

            if (killed) EnemyKilled?.Invoke(enemy);
            else EnemyReachedPlanet?.Invoke(enemy);

            _pool.Release(enemy);
        }
    }
}
```

#### Passo 6 — Teclas de teste: `EnemyDevTools`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/EnemyDevTools.cs
using UnityEngine;
#if UNITY_EDITOR || DEVELOPMENT_BUILD
using Armageddon.World;
using UnityEngine.InputSystem;
#endif

namespace Armageddon.Enemies
{
    // G = Grunt · C = Scout · V = cacho de Swarmers · B = Brute, todos no mouse · R = 10 inimigos sorteados na borda (12 u).
    // Mesma regra do CombatDevTools: a classe existe em todo build; campos e Update, só em desenvolvimento.
    public sealed class EnemyDevTools : MonoBehaviour
    {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
        [SerializeField] private EnemyPool _pool;
        [SerializeField] private EnemyDefinition _grunt;
        [SerializeField] private EnemyDefinition _scout;
        [SerializeField] private EnemyDefinition _swarmer;
        [SerializeField] private EnemyDefinition _brute;

        private void OnEnable()
        {
            _pool.EnemyKilled += HandleEnemyKilled;
            _pool.EnemyReachedPlanet += HandleEnemyReachedPlanet;
        }

        private void OnDisable()
        {
            _pool.EnemyKilled -= HandleEnemyKilled;
            _pool.EnemyReachedPlanet -= HandleEnemyReachedPlanet;
        }

        private void Update()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null) return;

            if (Mouse.current != null && Camera.main != null)
            {
                Vector2 mouse = Camera.main.ScreenToWorldPoint(Mouse.current.position.ReadValue());
                if (keyboard.gKey.wasPressedThisFrame) _pool.Spawn(_grunt, mouse);
                if (keyboard.cKey.wasPressedThisFrame) _pool.Spawn(_scout, mouse);
                if (keyboard.vKey.wasPressedThisFrame) _pool.Spawn(_swarmer, mouse);
                if (keyboard.bKey.wasPressedThisFrame) _pool.Spawn(_brute, mouse);
            }

            if (keyboard.rKey.wasPressedThisFrame)
            {
                var all = new[] { _grunt, _scout, _swarmer, _brute };
                for (int i = 0; i < 10; i++)
                {
                    float angle = Random.Range(0f, 2f * Mathf.PI);
                    var edge = WorldLayout.PlanetCenter + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * WorldLayout.SpawnRadius;
                    _pool.Spawn(all[Random.Range(0, all.Length)], edge);
                }
                Debug.Log($"[Dev] Inimigos vivos: {_pool.AliveCount}");
            }
        }

        private void HandleEnemyKilled(Enemy enemy)
        {
            Debug.Log($"[Dev] {enemy.Definition.name} destruído (+{enemy.Definition.Shards} Shards na Fase 6). Vivos: {_pool.AliveCount}");
        }

        private void HandleEnemyReachedPlanet(Enemy enemy)
        {
            Debug.Log($"[Dev] {enemy.Definition.name} atingiu o planeta. Vivos: {_pool.AliveCount}");
        }
#endif
    }
}
```

#### Passo 7 — Os 4 assets de inimigo

Em `Assets/_Project/Data/Enemies/`, **botão direito → Create → Armageddon → Enemy Definition**, uma vez para cada inimigo. Preencha com os valores das Seções 4.3, 4.4 e 6.4:

| Asset | Hitpoints | Damage | Speed | Shards | Movement | Unlock Wave | Spawn Weight | Cluster Size | Variants | Fps | Explosion |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `Enemy_Grunt` | 10 | 5 | 0.8 | 1 | Straight | 1 | 50 | 1 | 2 variações: células 0–3 e 4–7 de `SPR_Enemy_Grunt` | 6 | Small |
| `Enemy_Scout` | 6 | 3 | 2 | 1 | ZigZag (0.5 / 1.5) | 3 | 25 | 1 | 1 variação: células 0–3 de `SPR_Enemy_Scout` | 12 | Small |
| `Enemy_Swarmer` | 3 | 2 | 1.2 | 0.5 | Straight | 6 | 15 | 8 | 1 variação: células 0–1 de `SPR_Enemy_Swarmer` | 4 | Small |
| `Enemy_Brute` | 80 | 20 | 0.5 | 4 | Straight | 8 | 10 | 1 | 4 variações de 1 frame: células 0, 1, 2 e 3 de `SPR_Enemy_Brute` | 1 | Big |

Na lista **Variants**, clique **+** uma vez por variação e arraste as células para o **Frames** de cada uma. No Brute, cada variação tem um frame só: o `SpriteAnimator` fica mostrando essa imagem parada.

#### Passo 8 — Prefab e cena

1. **Prefab do inimigo:** objeto vazio `Enemy` com:
   - **Sprite Renderer:** qualquer célula do Grunt (só para ver o prefab); **Sorting Layer** `Enemies`.
   - **Sprite Animator:** **Frames** vazio (o `Enemy` preenche ao nascer); **Random Start Frame** **marcado**.
   - **Enemy**.

   Arraste para `Prefabs/Gameplay/` e apague da cena.
2. Na cena `Gameplay`, em `[Systems]`:
   - `ExplosionPool`, com o componente `ExplosionPool`. Em **Explosions**, crie 2 itens: `Small` com as 5 células de `Art/VFX/SPR_VFX_Explosion_Small` e **Fps** `15`; e `Big` com as 5 de `SPR_VFX_Explosion_Big` e **Fps** `15`. A da Mothership entra na Fase 7.
   - `EnemyPool`, com o componente `EnemyPool`: **Prefab** = `Enemy`; **Planet** = o objeto `Planet` da cena; **Explosions** = o `ExplosionPool`.
   - `EnemyDevTools`, com o componente `EnemyDevTools`: **Pool** = o `EnemyPool`, e os 4 assets de inimigo.

#### Passo 9 — Commit

`git add .` e `git commit -m "Phase 4: enemy definitions, movement, pooling, kamikaze, explosions"`.

**✅ Checkpoint:**
- **R** faz nascer 10 inimigos na borda da tela, e todos andam em direção ao planeta. Nenhum pisca em sincronia com os outros.
- Cada tipo anda do seu jeito: o Grunt em linha reta a 0,8 u/s, o Scout **rápido e em zigue-zague**, o Swarmer em **cacho de 8**, e o Brute **bem devagar**. Os Grunts aparecem com as 2 variações visuais, e os Brutes com as 4.
- Um inimigo que chega ao planeta explode na borda dele e tira HP conforme a tabela: Grunt 5, Scout 3, Swarmer 2 cada, Brute 20. O Console mostra `atingiu o planeta`, e **F6** mostra o HP atual.
- No Quadrant do Satellite e dentro do alcance, os inimigos são destruídos: o Grunt com **1** disparo, o Brute com **8** (e explosão maior). O Console mostra `destruído (+1 Shards…)`.
- **G**, **C**, **V** e **B** criam cada tipo no mouse. Um Brute criado dentro do alcance mostra, pelos disparos, que precisa de 8 tiros.
- **Esc** congela os inimigos, as explosões e a órbita.
- Na janela **Hierarchy**, `EnemyPool` já tem 64 inimigos desativados desde o início. Depois de muitos **R**, o número de objetos para de crescer: eles são reaproveitados.

**Problemas comuns:**
- **`ArgumentOutOfRangeException` no `Enemy.Spawn`:** a `EnemyDefinition` está com a lista **Variants** vazia.
- **O inimigo aparece sem imagem:** a variação tem o **Frames** vazio, ou o **Fps** está em 0.
- **Os inimigos passam pelo planeta sem dar dano:** o campo **Planet** do `EnemyPool` está vazio (o Console mostra um `NullReferenceException`).
- **Os Satellites não atiram nos inimigos, só nos alvos de teste:** o `Enemy` precisa se registrar no `TargetRegistry` no `Spawn`. Confira se o código está igual ao do Passo 4.
- **Os inimigos piscam todos juntos:** falta marcar **Random Start Frame** no `SpriteAnimator` do prefab.
- **A explosão fica parada no último frame:** o `ExplosionPool` devolve a explosão ao pool no evento `Finished`, que só dispara com **Loop** desmarcado, e é por isso que o `Play` usa `loop: false`.

Próxima fase: **Fase 5 — Waves**. Ela coloca o `WaveDirector` para decidir quantos inimigos nascem, de que tipo, de quais Spawn Sectors e com qual escalada, com o aviso de 2 s na borda e o Wave Clear.

---

### Fase 5 — Waves

> Objetivo desta fase: a run acontece sozinha. Um aviso de 2 s na borda da tela mostra de quais Spawn Sectors a próxima Wave vem; os inimigos nascem espalhados nos primeiros 20 s, com a composição e a escalada da Seção 4.3; a próxima Wave começa quando o timer acaba ou quando a tela esvazia; e o Wave Clear paga todas as Waves pendentes. O pagamento em Shards entra na Fase 6, e a Mothership (Boss Wave) na Fase 7.

**Conceitos novos:**
- **Máquina de estados simples:** o `WaveDirector` está sempre numa de três fases: `Idle` (sem run), `Warning` (os 2 s de aviso) e `Running` (a Wave rodando). Cada fase tem a sua regra de saída. Assim, o código de "o que fazer agora" fica num lugar só e fácil de ler.
- **Fila de spawn:** ao começar, a Wave coloca todos os seus slots numa fila, cada um com o seu horário de nascer. A cada frame, nasce quem já está na hora e cabe no limite de 150 inimigos. Um slot que não coube fica na fila e nasce depois, mesmo que outra Wave já tenha começado: é o "o spawn espera" da Seção 4.3.
- **Sorteio com pesos:** cada tipo de inimigo tem um peso (Grunt 50, Scout 25…). O sorteio soma os pesos dos tipos já liberados, sorteia um número nessa soma e vê em qual faixa ele caiu. Os pesos ficam "renormalizados" sem nenhuma conta extra.
- **Dados de balanceamento separados do código (`WaveBalance`):** todos os números da Seção 4.3 ficam num asset. O ajuste pós-Analytics é editar esse asset, não recompilar.

#### Passo 1 — Os números das Waves: `WaveBalance`

```csharp
// Caminho: Assets/_Project/Scripts/Waves/WaveBalance.cs
using System.Collections.Generic;
using Armageddon.Enemies;
using UnityEngine;

namespace Armageddon.Waves
{
    // Todos os números da Seção 4.3 (valores iniciais, ajustar via Analytics).
    [CreateAssetMenu(menuName = "Armageddon/Wave Balance", fileName = "WaveBalance")]
    public sealed class WaveBalance : ScriptableObject
    {
        [Header("Tempo (s)")]
        [SerializeField] private float _waveDuration = 30f;
        [SerializeField] private float _bossWaveDuration = 60f;
        [SerializeField] private float _warningDuration = 2f;
        [SerializeField] private float _spawnWindow = 20f;      // os slots nascem espalhados nestes primeiros segundos

        [Header("Tamanho: slots = min(base + porWave·w, máximo)")]
        [SerializeField] private int _baseSlots = 6;
        [SerializeField] private int _slotsPerWave = 2;
        [SerializeField] private int _maxSlots = 60;
        [SerializeField] private int _maxAlive = 150;           // limite de inimigos na tela

        [Header("Escalada: base × crescimento^(w−1)")]
        [SerializeField] private float _hitpointsGrowth = 1.09f;
        [SerializeField] private float _damageGrowth = 1.06f;

        [Header("Spawn Sectors: 1 setor até a Wave anterior à primeira abaixo")]
        [SerializeField] private int _twoSectorsFromWave = 5;
        [SerializeField] private int _threeSectorsFromWave = 15;

        [Header("Boss Wave e Wave Clear")]
        [SerializeField] private int _bossEvery = 10;
        [SerializeField] private int _clearBonusBase = 5;       // bônus = (base + w) × (1 + Resource per Wave)

        [Header("Inimigos comuns sorteáveis")]
        [SerializeField] private List<EnemyDefinition> _enemies = new List<EnemyDefinition>();

        public float WaveDuration => _waveDuration;
        public float BossWaveDuration => _bossWaveDuration;
        public float WarningDuration => _warningDuration;
        public float SpawnWindow => _spawnWindow;
        public int MaxAlive => _maxAlive;
        public IReadOnlyList<EnemyDefinition> Enemies => _enemies;

        public bool IsBossWave(int wave) => wave > 0 && wave % _bossEvery == 0;
        public int SlotsFor(int wave) => Mathf.Min(_baseSlots + _slotsPerWave * wave, _maxSlots);
        public float HitpointsMultiplier(int wave) => Mathf.Pow(_hitpointsGrowth, wave - 1);
        public float DamageMultiplier(int wave) => Mathf.Pow(_damageGrowth, wave - 1);

        public int SectorCountFor(int wave)
        {
            if (wave >= _threeSectorsFromWave) return 3;
            if (wave >= _twoSectorsFromWave) return 2;
            return 1;
        }

        // Bônus de uma Wave paga no Wave Clear, antes do Stat Resource per Wave (aplicado na Fase 6).
        public int ClearBonus(int wave) => _clearBonusBase + wave;
    }
}
```

#### Passo 2 — O diretor das Waves: `WaveDirector`

```csharp
// Caminho: Assets/_Project/Scripts/Waves/WaveDirector.cs
using System;
using System.Collections.Generic;
using Armageddon.Enemies;
using Armageddon.World;
using UnityEngine;

namespace Armageddon.Waves
{
    // Conduz a run Wave a Wave (Seção 4.3): aviso de 2 s, spawn espalhado, escalada, fim da Wave e Wave Clear.
    public sealed class WaveDirector : MonoBehaviour
    {
        public const int SectorCount = 6;          // 6 arcos de 60°
        public const float SectorArc = 60f;

        private enum Phase { Idle, Warning, Running }

        // Um slot esperando para nascer: tipo, posição e escalada já decididos quando a Wave começou.
        private struct PendingSpawn
        {
            public EnemyDefinition Definition;
            public Vector2 Position;
            public float HitpointsMultiplier;
            public float DamageMultiplier;
            public float DueTime;
        }

        [SerializeField] private WaveBalance _balance;
        [SerializeField] private EnemyPool _enemies;
        [SerializeField] private bool _autoStart = true;   // a Fase 8 desliga: o RunController chama StartRun

        private readonly Queue<PendingSpawn> _queue = new Queue<PendingSpawn>();
        private readonly List<int> _sectors = new List<int>();
        private readonly List<int> _unpaidWaves = new List<int>();
        private readonly List<EnemyDefinition> _unlocked = new List<EnemyDefinition>();
        private Phase _phase = Phase.Idle;
        private float _phaseTime;
        private float _runTime;
        private float _duration;
        private int _externalAlive;

        public int CurrentWave { get; private set; }
        public bool IsBossWave => _balance.IsBossWave(CurrentWave);
        public bool IsWarning => _phase == Phase.Warning;
        public float TimeRemaining => _phase == Phase.Running ? Mathf.Max(0f, _duration - _phaseTime) : 0f;
        public int AliveCount => _enemies.AliveCount + _externalAlive;

        public event Action<int, IReadOnlyList<int>> WaveWarning;          // Wave que vem e os seus Spawn Sectors
        public event Action<int> WaveStarted;
        public event Action<int> BossWaveStarted;                          // a Fase 7 cria a Mothership aqui
        public event Action<IReadOnlyList<int>, bool> WaveCleared;         // Waves pagas; true = antes do timer

        private void Start()
        {
            if (_autoStart) StartRun();
        }

        public void StartRun()
        {
            _queue.Clear();
            _unpaidWaves.Clear();
            _runTime = 0f;
            BeginWarning(1);
        }

        public void StopRun()
        {
            _phase = Phase.Idle;
            _queue.Clear();
        }

        // Inimigos vivos que não vêm do EnemyPool (a Mothership, Fase 7). Contam para o Wave Clear.
        public void AddExternalAlive(int delta)
        {
            _externalAlive = Mathf.Max(0, _externalAlive + delta);
        }

        private void Update()
        {
            float deltaTime = Time.deltaTime;
            if (_phase == Phase.Idle || deltaTime <= 0f) return;

            _phaseTime += deltaTime;
            _runTime += deltaTime;
            SpawnDue();

            if (TryWaveClear()) return;

            if (_phase == Phase.Warning && _phaseTime >= _balance.WarningDuration)
            {
                BeginWave();
            }
            else if (_phase == Phase.Running && _phaseTime >= _duration)
            {
                // Timer acabou com inimigos vivos: esta Wave continua "não paga" até o próximo Wave Clear.
                BeginWarning(CurrentWave + 1);
            }
        }

        private void BeginWarning(int wave)
        {
            CurrentWave = wave;
            _phase = Phase.Warning;
            _phaseTime = 0f;
            ChooseSectors(_balance.SectorCountFor(wave));
            WaveWarning?.Invoke(wave, _sectors);
        }

        private void BeginWave()
        {
            _phase = Phase.Running;
            _phaseTime = 0f;
            int wave = CurrentWave;
            bool boss = _balance.IsBossWave(wave);
            _duration = boss ? _balance.BossWaveDuration : _balance.WaveDuration;
            _unpaidWaves.Add(wave);

            // Boss Wave: só a Mothership, sem inimigos comuns (Seção 4.5).
            if (!boss) EnqueueSlots(wave);

            WaveStarted?.Invoke(wave);
            if (boss) BossWaveStarted?.Invoke(wave);
        }

        private void EnqueueSlots(int wave)
        {
            _unlocked.Clear();
            float totalWeight = 0f;
            foreach (var definition in _balance.Enemies)
            {
                if (definition.UnlockWave > wave) continue;
                _unlocked.Add(definition);
                totalWeight += definition.SpawnWeight;
            }
            if (_unlocked.Count == 0) return;

            int slots = _balance.SlotsFor(wave);
            float interval = _balance.SpawnWindow / slots;
            float hitpoints = _balance.HitpointsMultiplier(wave);
            float damage = _balance.DamageMultiplier(wave);

            for (int i = 0; i < slots; i++)
            {
                _queue.Enqueue(new PendingSpawn
                {
                    Definition = PickWeighted(totalWeight),
                    Position = RandomPointInSectors(),
                    HitpointsMultiplier = hitpoints,
                    DamageMultiplier = damage,
                    DueTime = _runTime + i * interval,
                });
            }
        }

        // Nasce quem já está na hora, respeitando o limite de inimigos na tela. Um cacho de Swarmers conta como 8.
        private void SpawnDue()
        {
            while (_queue.Count > 0)
            {
                var next = _queue.Peek();
                if (next.DueTime > _runTime) return;
                if (AliveCount + Mathf.Max(1, next.Definition.ClusterSize) > _balance.MaxAlive) return;   // o spawn espera

                _queue.Dequeue();
                _enemies.Spawn(next.Definition, next.Position, next.HitpointsMultiplier, next.DamageMultiplier);
            }
        }

        // Wave Clear (Seção 4.3): a tela ficou vazia e não há ninguém esperando para nascer.
        // Paga TODAS as Waves pendentes, inclusive as que já tinham passado do timer.
        private bool TryWaveClear()
        {
            if (_unpaidWaves.Count == 0 || _queue.Count > 0 || AliveCount > 0) return false;

            bool beforeTimer = _phase == Phase.Running && _phaseTime < _duration;
            var paid = _unpaidWaves.ToArray();
            _unpaidWaves.Clear();
            WaveCleared?.Invoke(paid, beforeTimer);

            // Na fase Running, a tela vazia também começa a próxima Wave (Seção 4.3).
            if (_phase == Phase.Running) BeginWarning(CurrentWave + 1);
            return true;
        }

        private EnemyDefinition PickWeighted(float totalWeight)
        {
            float roll = UnityEngine.Random.value * totalWeight;
            foreach (var definition in _unlocked)
            {
                roll -= definition.SpawnWeight;
                if (roll < 0f) return definition;
            }
            return _unlocked[_unlocked.Count - 1];
        }

        // Sorteia 'count' setores diferentes entre os 6 (embaralhamento parcial).
        private void ChooseSectors(int count)
        {
            _sectors.Clear();
            for (int i = 0; i < SectorCount; i++) _sectors.Add(i);
            for (int i = 0; i < count; i++)
            {
                int j = UnityEngine.Random.Range(i, SectorCount);
                (_sectors[i], _sectors[j]) = (_sectors[j], _sectors[i]);
            }
            _sectors.RemoveRange(count, SectorCount - count);
        }

        // Um ponto aleatório num dos setores sorteados, a 12 u do centro (fora da tela).
        private Vector2 RandomPointInSectors()
        {
            int sector = _sectors[UnityEngine.Random.Range(0, _sectors.Count)];
            float angle = (sector * SectorArc + UnityEngine.Random.Range(0f, SectorArc)) * Mathf.Deg2Rad;
            return WorldLayout.PlanetCenter + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * WorldLayout.SpawnRadius;
        }

#if UNITY_EDITOR || DEVELOPMENT_BUILD
        // Só para teste: faz o timer da Wave atual acabar agora.
        public void DevEndWaveTimer()
        {
            if (_phase == Phase.Running) _phaseTime = _duration;
        }
#endif
    }
}
```

> **Setores e setas:** o setor `k` cobre de `60·k°` a `60·k + 60°`; o centro dele fica em `30 + 60·k°`. São exatamente as 6 direções das setas de `SPR_UI_SpawnSectorArrow` (linha `k` da spritesheet, Seção 6.4).

#### Passo 3 — O aviso na borda: `SpawnSectorIndicator`

```csharp
// Caminho: Assets/_Project/Scripts/Waves/SpawnSectorIndicator.cs
using System;
using System.Collections.Generic;
using Armageddon.World;
using UnityEngine;

namespace Armageddon.Waves
{
    // Durante os 2 s de aviso, mostra uma seta piscando na borda da tela para cada Spawn Sector sorteado (Seção 6.2).
    // A seta fica onde a linha "planeta → centro do setor" cruza a borda da tela, e acompanha a câmera.
    public sealed class SpawnSectorIndicator : MonoBehaviour
    {
        [Serializable]
        private sealed class ArrowFrames
        {
            public Sprite[] frames;   // aceso e apagado
        }

        [SerializeField] private WaveDirector _waves;
        [SerializeField] private ArrowFrames[] _arrows = new ArrowFrames[WaveDirector.SectorCount];   // índice = setor
        [SerializeField] private float _fps = 4f;
        [SerializeField] private float _edgeMargin = 1f;   // distância da seta até a borda, em u
        [SerializeField] private string _sortingLayer = "VFX";
        [SerializeField] private int _sortingOrder = 100;

        private readonly SpriteAnimator[] _views = new SpriteAnimator[WaveDirector.SectorCount];

        private void Awake()
        {
            for (int i = 0; i < _views.Length; i++)
            {
                var go = new GameObject($"Arrow {i}");
                go.transform.SetParent(transform, false);
                var renderer = go.AddComponent<SpriteRenderer>();
                renderer.sortingLayerName = _sortingLayer;
                renderer.sortingOrder = _sortingOrder;
                _views[i] = go.AddComponent<SpriteAnimator>();
                _views[i].SetFrames(_arrows[i].frames, _fps, true);
                go.SetActive(false);
            }
        }

        private void OnEnable()
        {
            _waves.WaveWarning += HandleWaveWarning;
            _waves.WaveStarted += HandleWaveStarted;
        }

        private void OnDisable()
        {
            _waves.WaveWarning -= HandleWaveWarning;
            _waves.WaveStarted -= HandleWaveStarted;
        }

        private void HandleWaveWarning(int wave, IReadOnlyList<int> sectors)
        {
            HideAll();
            foreach (int sector in sectors) _views[sector].gameObject.SetActive(true);
        }

        private void HandleWaveStarted(int wave)
        {
            HideAll();
        }

        private void HideAll()
        {
            foreach (var view in _views) view.gameObject.SetActive(false);
        }

        private void LateUpdate()
        {
            var view = Camera.main;
            if (view == null) return;

            Vector2 cameraCenter = view.transform.position;
            float halfHeight = view.orthographicSize - _edgeMargin;
            float halfWidth = view.orthographicSize * view.aspect - _edgeMargin;
            Vector2 origin = WorldLayout.PlanetCenter;

            for (int i = 0; i < _views.Length; i++)
            {
                if (!_views[i].gameObject.activeSelf) continue;

                float angle = (i * WaveDirector.SectorArc + WaveDirector.SectorArc * 0.5f) * Mathf.Deg2Rad;
                var direction = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));

                // Distância, ao longo da direção, até a primeira borda (esquerda/direita ou cima/baixo) da tela.
                float tx = direction.x > 0f ? (cameraCenter.x + halfWidth - origin.x) / direction.x
                         : direction.x < 0f ? (cameraCenter.x - halfWidth - origin.x) / direction.x
                         : float.MaxValue;
                float ty = direction.y > 0f ? (cameraCenter.y + halfHeight - origin.y) / direction.y
                         : direction.y < 0f ? (cameraCenter.y - halfHeight - origin.y) / direction.y
                         : float.MaxValue;
                Vector2 p = origin + direction * Mathf.Min(tx, ty);

                _views[i].transform.position = new Vector3(WorldLayout.SnapToPixel(p.x), WorldLayout.SnapToPixel(p.y), 0f);
            }
        }
    }
}
```

#### Passo 4 — Teclas de teste: `WaveDevTools`

```csharp
// Caminho: Assets/_Project/Scripts/Waves/WaveDevTools.cs
using UnityEngine;
#if UNITY_EDITOR || DEVELOPMENT_BUILD
using System.Collections.Generic;
using System.Linq;
using Armageddon.Combat;
using UnityEngine.InputSystem;
#endif

namespace Armageddon.Waves
{
    // N = acaba o timer da Wave atual · K = destrói todos os inimigos (testa o Wave Clear). Registra os eventos no Console.
    public sealed class WaveDevTools : MonoBehaviour
    {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
        [SerializeField] private WaveDirector _waves;

        private void OnEnable()
        {
            _waves.WaveWarning += HandleWaveWarning;
            _waves.WaveStarted += HandleWaveStarted;
            _waves.WaveCleared += HandleWaveCleared;
        }

        private void OnDisable()
        {
            _waves.WaveWarning -= HandleWaveWarning;
            _waves.WaveStarted -= HandleWaveStarted;
            _waves.WaveCleared -= HandleWaveCleared;
        }

        private void Update()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null) return;

            if (keyboard.nKey.wasPressedThisFrame) _waves.DevEndWaveTimer();

            if (keyboard.kKey.wasPressedThisFrame)
            {
                // Cópia da lista: cada alvo que morre sai do TargetRegistry durante o laço.
                foreach (var target in TargetRegistry.Alive.ToList()) target.TakeDamage(float.MaxValue, false);
            }
        }

        private void HandleWaveWarning(int wave, IReadOnlyList<int> sectors)
        {
            Debug.Log($"[Waves] Aviso: Wave {wave} vem dos setores {string.Join(", ", sectors)}");
        }

        private void HandleWaveStarted(int wave)
        {
            Debug.Log($"[Waves] Wave {wave} começou{(_waves.IsBossWave ? " (BOSS: a Mothership entra na Fase 7)" : "")}. Vivos: {_waves.AliveCount}");
        }

        private void HandleWaveCleared(IReadOnlyList<int> paidWaves, bool beforeTimer)
        {
            Debug.Log($"[Waves] Wave Clear{(beforeTimer ? " antes do timer" : "")}: paga(s) {string.Join(", ", paidWaves)}");
        }
#endif
    }
}
```

#### Passo 5 — O asset de balanceamento e a cena

1. Em `Assets/_Project/Data/Balance/`, **Create → Armageddon → Wave Balance**, com o nome `WaveBalance`. Os valores padrão já são os da Seção 4.3. Em **Enemies**, arraste os 4 assets da Fase 4 (`Enemy_Grunt`, `Enemy_Scout`, `Enemy_Swarmer`, `Enemy_Brute`).
2. Na cena `Gameplay`:
   - Em `[Systems]`, crie `WaveDirector` com o componente `WaveDirector`: **Balance** = `WaveBalance`; **Enemies** = o `EnemyPool`; **Auto Start** marcado.
   - Em `[World]`, crie `SpawnSectorIndicator` com o componente `SpawnSectorIndicator`: **Waves** = o `WaveDirector`. Em **Arrows** (6 itens), coloque no item `k` as células `2k` e `2k+1` de `Art/UI/SPR_UI_SpawnSectorArrow`: item 0 = células 0 e 1 (setor de 30°), item 1 = células 2 e 3 (90°), e assim por diante até o item 5 = células 10 e 11 (330°).
   - Em `[Systems]`, crie `WaveDevTools` com o componente `WaveDevTools` e o `WaveDirector` em **Waves**.
3. O `EnemyDevTools` da Fase 4 continua útil, mas a tecla **R** agora compete com as Waves: use-a só para testar o limite de tela.

#### Passo 6 — Commit

`git add .` e `git commit -m "Phase 5: waves, spawn sectors, scaling, screen cap, wave clear"`.

**✅ Checkpoint:**
- Play na `Gameplay`: uma seta magenta pisca na borda da tela por 2 s (Console: `Aviso: Wave 1 vem dos setores 3`, por exemplo), some, e **8 Grunts** (6 + 2 × 1) nascem **daquele lado**, espalhados ao longo de 20 s.
- Sem nenhum Satellite por perto dos inimigos, a Wave 2 começa quando o timer de 30 s acaba. Com os Satellites destruindo todos, ela começa antes (Console: `Wave Clear antes do timer: paga(s) 1`).
- Deixe o timer da Wave 1 acabar com inimigos vivos e aperte **K** durante a Wave 2, depois que todos os dela nascerem: o Console mostra `Wave Clear…: paga(s) 1, 2`. As duas são pagas juntas (Seção 4.3).
- Scouts aparecem a partir da Wave 3, Swarmers da 6 e Brutes da 8 (use **N** para avançar rápido). A partir da Wave 5 aparecem **2 setas** e, da 15, **3**.
- Com a gaveta aberta (**F3**), as setas continuam na borda visível da tela.
- Na Wave 10, o Console mostra `(BOSS: a Mothership entra na Fase 7)`, e a Wave termina sozinha por não ter inimigos. É esperado até a Fase 7.
- Várias vezes **R** (10 inimigos cada) até passar de 150 vivos: a Wave para de soltar inimigos e volta a soltar assim que alguns morrem.
- **Esc** pausa o timer, o spawn e o piscar das setas.

**Problemas comuns:**
- **Nenhum inimigo nasce:** a lista **Enemies** do `WaveBalance` está vazia, ou nenhum inimigo tem **Unlock Wave** ≤ 1.
- **Os inimigos nascem do lado oposto da seta:** a ordem das células no **Arrows** do `SpawnSectorIndicator` está trocada. O item `k` precisa ser a linha `k` da spritesheet (células `2k` e `2k+1`).
- **A Wave nunca termina antes do timer, mesmo com a tela vazia:** ainda há slots na fila, esperando a hora de nascer (os 20 s de spawn). O Wave Clear só acontece com a fila vazia **e** a tela vazia.
- **As setas aparecem no centro da tela:** a **Main Camera** não está com a tag `MainCamera` (o `Camera.main` não a encontra).

Próxima fase: **Fase 6 — Stats, Shards, Upgrades e gaveta**. Ela transforma os inimigos destruídos e os Wave Clears em Shards e cria a gaveta de upgrades com os 13 Stats.

---

### Fase 6 — Stats, Shards, Upgrades e gaveta

> Objetivo desta fase: destruir inimigos e fazer Wave Clear dá **Shards**; a gaveta na parte de baixo da tela mostra o saldo e as 4 abas; tocar numa aba abre os cards dos Stats daquela Track, e tocar num card compra um Upgrade sem pausar o jogo. Cada compra muda o jogo na hora: mais dano, mais alcance (o preenchimento do Quadrant cresce), mais HP. A aba Satellites troca a Target Priority de cada Satellite.

**Conceitos novos:**
- **Definição × estado:** o `StatDefinition` (asset) diz o que um Stat **é** (base, incremento, teto, custo). O `RunStats` guarda o **nível** de cada Stat nesta run. Os assets nunca mudam durante o jogo; só o estado muda, e ele é descartado no fim da run.
- **Modificadores:** Perks e Planet Core (Fase 9) não mexem nos níveis: eles entram como **modificadores** (`StatModifier`) que somam e multiplicam o valor. O cálculo fica num lugar só, seguindo a Seção 4.2: `base + incremento × nível`, limitado pelo teto, e depois modificado.
- **Composição (`RunEconomy`):** um componente cria a economia da run (Stats, carteira e loja), escuta os eventos dos outros sistemas (inimigo destruído, Wave Clear) e empurra os valores novos para quem usa (Satellites e planeta). Os sistemas continuam sem se conhecer.
- **Canvas pixel-perfect:** a UI é desenhada numa tela de referência de 320×180 e ampliada pelo mesmo fator **inteiro** da Pixel Perfect Camera (6× em 1080p). Assim, a UI tem o mesmo tamanho de pixel que o mundo.
- **UI por eventos:** os cards não verificam o saldo a cada frame. Eles se atualizam quando a carteira ou o Stat avisam que mudaram (`BalanceChanged`, `StatChanged`).

#### Passo 1 — A definição de um Stat: `StatDefinition`, `StatCatalog`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/StatDefinition.cs
using UnityEngine;

namespace Armageddon.Economy
{
    // Os 13 Stats da Seção 4.2.
    public enum StatId
    {
        Damage, AttackSpeed, CriticalChance, CriticalFactor, AttackRange, Impetus, OrbitSpeed,
        Hitpoints, Regeneration, DefenseAbsolute, DefenseRelative,
        ResourceBonus, ResourcePerWave,
    }

    public enum StatTrack { Offense, Defense, Utility }

    // Como o valor aparece no card.
    public enum StatFormat { Number, Percent, PerSecond, Multiplier, Units, DegreesPerSecond, PercentPerUnit }

    // Um Stat (Seção 4.2). Percentuais são guardados como fração: 1,5 p.p. = 0,015; 0,4 %/u = 0,004.
    [CreateAssetMenu(menuName = "Armageddon/Stat Definition", fileName = "Stat_")]
    public sealed class StatDefinition : ScriptableObject
    {
        public const float CostGrowth = 1.15f;   // custo = baseCost × 1,15^nível

        [SerializeField] private StatId _id;
        [SerializeField] private StatTrack _track;
        [SerializeField] private string _displayName;   // a Fase 11 troca por uma chave de Localization
        [SerializeField] private Sprite _icon;
        [SerializeField] private float _base;
        [SerializeField] private float _perLevel;
        [SerializeField] private float _cap;            // 0 = sem teto
        [SerializeField] private int _baseCost = 10;
        [SerializeField] private StatFormat _format;

        public StatId Id => _id;
        public StatTrack Track => _track;
        public string DisplayName => _displayName;
        public Sprite Icon => _icon;
        public float Base => _base;
        public float PerLevel => _perLevel;
        public bool HasCap => _cap > 0f;
        public float Cap => _cap;
        public int BaseCost => _baseCost;

        public string Format(float value)
        {
            return _format switch
            {
                StatFormat.Percent => $"{value * 100f:0.#}%",
                StatFormat.PerSecond => $"{value:0.##}/s",
                StatFormat.Multiplier => $"{value:0.#}x",
                StatFormat.Units => $"{value:0.##}u",
                StatFormat.DegreesPerSecond => $"{value:0}°/s",
                StatFormat.PercentPerUnit => $"{value * 100f:0.#}%/u",
                _ => $"{value:0.#}",
            };
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Economy/StatCatalog.cs
using System.Collections.Generic;
using UnityEngine;

namespace Armageddon.Economy
{
    // A lista dos 13 Stats, na ordem em que aparecem na gaveta.
    [CreateAssetMenu(menuName = "Armageddon/Stat Catalog", fileName = "StatCatalog")]
    public sealed class StatCatalog : ScriptableObject
    {
        [SerializeField] private List<StatDefinition> _stats = new List<StatDefinition>();

        public IReadOnlyList<StatDefinition> Stats => _stats;

        public List<StatDefinition> ForTrack(StatTrack track)
        {
            return _stats.FindAll(s => s.Track == track);
        }
    }
}
```

#### Passo 2 — Os Stats da run: `StatModifier`, `RunStats`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/RunStats.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace Armageddon.Economy
{
    // Um ajuste vindo de fora dos Upgrades: Perks "Starting X" e Planet Core (Fase 9).
    // valor final = (valor dos Upgrades + add) × multiply
    [Serializable]
    public struct StatModifier
    {
        public StatId stat;
        public float add;
        public float multiply;

        public static StatModifier Add(StatId stat, float value) => new StatModifier { stat = stat, add = value, multiply = 1f };
        public static StatModifier Multiply(StatId stat, float value) => new StatModifier { stat = stat, add = 0f, multiply = value };
    }

    // Nível e valor de cada Stat durante uma run. Zera a cada run (Seção 4.2: Upgrades valem só até o fim da run).
    public sealed class RunStats
    {
        private readonly Dictionary<StatId, StatDefinition> _definitions = new Dictionary<StatId, StatDefinition>();
        private readonly Dictionary<StatId, int> _levels = new Dictionary<StatId, int>();
        private readonly List<StatModifier> _modifiers = new List<StatModifier>();

        public event Action<StatId> StatChanged;

        public RunStats(IEnumerable<StatDefinition> definitions)
        {
            foreach (var definition in definitions)
            {
                _definitions[definition.Id] = definition;
                _levels[definition.Id] = 0;
            }
        }

        public StatDefinition Definition(StatId id) => _definitions[id];
        public int Level(StatId id) => _levels[id];
        public float Value(StatId id) => ValueAtLevel(id, _levels[id]);

        // Seção 4.2: base + incremento × nível, limitado pelo teto, e DEPOIS modificado por Perks e Planet Core.
        public float ValueAtLevel(StatId id, int level)
        {
            var definition = _definitions[id];
            float value = definition.Base + definition.PerLevel * level;
            if (definition.HasCap) value = Mathf.Min(value, definition.Cap);

            float add = 0f, multiply = 1f;
            foreach (var modifier in _modifiers)
            {
                if (modifier.stat != id) continue;
                add += modifier.add;
                multiply *= modifier.multiply;
            }
            return (value + add) * multiply;
        }

        public bool IsMaxed(StatId id)
        {
            var definition = _definitions[id];
            return definition.HasCap && definition.Base + definition.PerLevel * _levels[id] >= definition.Cap;
        }

        // Custo do próximo nível: baseCost × 1,15^nível, arredondado para o inteiro mais próximo.
        public int NextCost(StatId id)
        {
            return Mathf.RoundToInt(_definitions[id].BaseCost * Mathf.Pow(StatDefinition.CostGrowth, _levels[id]));
        }

        internal void IncreaseLevel(StatId id)
        {
            _levels[id]++;
            StatChanged?.Invoke(id);
        }

        public void AddModifier(StatModifier modifier)
        {
            _modifiers.Add(modifier);
            StatChanged?.Invoke(modifier.stat);
        }
    }
}
```

#### Passo 3 — Os Shards e a compra: `ShardWallet`, `UpgradeService`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/ShardWallet.cs
using System;
using UnityEngine;

namespace Armageddon.Economy
{
    // Saldo de Shards da run. Frações (Swarmer vale 0,5; Resource Bonus multiplica) são acumuladas
    // e viram Shards inteiros quando somam 1 (Seção 4.4).
    public sealed class ShardWallet
    {
        private float _fraction;

        public int Balance { get; private set; }

        // Todos os Shards ganhos na run, inclusive os já gastos. Base do Stardust no fim da run (Seção 5.1, Fase 9).
        public float TotalEarned { get; private set; }

        public event Action BalanceChanged;

        public void Add(float amount)
        {
            if (amount <= 0f) return;
            TotalEarned += amount;
            _fraction += amount;
            int whole = Mathf.FloorToInt(_fraction + 0.0001f);   // a folga evita perder 1 Shard por erro de ponto flutuante
            if (whole <= 0) return;
            _fraction -= whole;
            Balance += whole;
            BalanceChanged?.Invoke();
        }

        public bool TrySpend(int amount)
        {
            if (amount > Balance) return false;
            Balance -= amount;
            BalanceChanged?.Invoke();
            return true;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Economy/UpgradeService.cs
using System;

namespace Armageddon.Economy
{
    // Compra um nível de Stat com Shards. Nunca pausa o jogo (Pilar 1).
    public sealed class UpgradeService
    {
        private readonly RunStats _stats;
        private readonly ShardWallet _wallet;

        public event Action<StatId, int> Purchased;   // Stat e o nível novo (Analytics na Fase 10, dicas na Fase 13)

        public UpgradeService(RunStats stats, ShardWallet wallet)
        {
            _stats = stats;
            _wallet = wallet;
        }

        public bool CanPurchase(StatId id) => !_stats.IsMaxed(id) && _wallet.Balance >= _stats.NextCost(id);

        public bool TryPurchase(StatId id)
        {
            if (!CanPurchase(id)) return false;
            _wallet.TrySpend(_stats.NextCost(id));   // o custo é o do nível ATUAL, antes de subir
            _stats.IncreaseLevel(id);
            Purchased?.Invoke(id, _stats.Level(id));
            return true;
        }
    }
}
```

#### Passo 4 — A economia da run: `RunEconomy`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/RunEconomy.cs
using System.Collections.Generic;
using Armageddon.Combat;
using Armageddon.Enemies;
using Armageddon.Planets;
using Armageddon.Waves;
using UnityEngine;

namespace Armageddon.Economy
{
    // Cria os Stats, a carteira e a loja da run; transforma kills e Wave Clears em Shards;
    // e aplica os valores dos Stats nos Satellites e no planeta sempre que algum muda.
    public sealed class RunEconomy : MonoBehaviour
    {
        [SerializeField] private StatCatalog _catalog;
        [SerializeField] private WaveBalance _waveBalance;
        [SerializeField] private SatelliteOrbit _orbit;
        [SerializeField] private PlanetHealth _planet;
        [SerializeField] private EnemyPool _enemies;
        [SerializeField] private WaveDirector _waves;
        [SerializeField] private int _startingShards;   // o Perk Starting Shards (Fase 9) soma aqui

        public StatCatalog Catalog => _catalog;
        public RunStats Stats { get; private set; }
        public ShardWallet Wallet { get; private set; }
        public UpgradeService Upgrades { get; private set; }

        private void Awake()
        {
            Stats = new RunStats(_catalog.Stats);
            Wallet = new ShardWallet();
            Upgrades = new UpgradeService(Stats, Wallet);
        }

        private void OnEnable()
        {
            Stats.StatChanged += HandleStatChanged;
            _enemies.EnemyKilled += HandleEnemyKilled;
            _waves.WaveCleared += HandleWaveCleared;
        }

        private void OnDisable()
        {
            Stats.StatChanged -= HandleStatChanged;
            _enemies.EnemyKilled -= HandleEnemyKilled;
            _waves.WaveCleared -= HandleWaveCleared;
        }

        private void Start()
        {
            Wallet.Add(_startingShards);
            ApplyAll();
        }

        // Perks e Planet Core (Fase 9) chamam isto no começo da run.
        public void AddModifier(StatModifier modifier)
        {
            Stats.AddModifier(modifier);
        }

        private void HandleStatChanged(StatId id)
        {
            ApplyAll();   // são só 13 números: recalcular tudo é mais simples e à prova de esquecimento
        }

        private void ApplyAll()
        {
            _orbit.SetStats(new SatelliteStats
            {
                damage = Stats.Value(StatId.Damage),
                attackSpeed = Stats.Value(StatId.AttackSpeed),
                criticalChance = Stats.Value(StatId.CriticalChance),
                criticalFactor = Stats.Value(StatId.CriticalFactor),
                attackRange = Stats.Value(StatId.AttackRange),
                impetus = Stats.Value(StatId.Impetus),
                orbitSpeed = Stats.Value(StatId.OrbitSpeed),
            });

            _planet.SetMaxHitpoints(Stats.Value(StatId.Hitpoints));
            _planet.SetRegeneration(Stats.Value(StatId.Regeneration));
            _planet.SetDefense(Stats.Value(StatId.DefenseAbsolute), Stats.Value(StatId.DefenseRelative));
        }

        // Shards por kill × (1 + Resource Bonus) (Seção 4.4).
        private void HandleEnemyKilled(Enemy enemy)
        {
            Wallet.Add(enemy.Definition.Shards * (1f + Stats.Value(StatId.ResourceBonus)));
        }

        // Bônus de Wave Clear por Wave paga: (5 + w) × (1 + Resource per Wave) (Seção 4.3).
        private void HandleWaveCleared(IReadOnlyList<int> paidWaves, bool beforeTimer)
        {
            float multiplier = 1f + Stats.Value(StatId.ResourcePerWave);
            foreach (int wave in paidWaves) Wallet.Add(_waveBalance.ClearBonus(wave) * multiplier);
        }
    }
}
```

> **Por que o `SetStats` recebe um objeto novo?** O `SatelliteOrbit` e o `QuadrantView` leem o `SatelliteStats` a cada frame. Trocar o objeto inteiro de uma vez garante que nenhum dos dois veja um valor pela metade. E, como é só numa compra, não há custo.

#### Passo 5 — A escala da UI: `IntegerCanvasScale`

```csharp
// Caminho: Assets/_Project/Scripts/UI/IntegerCanvasScale.cs
using UnityEngine;
using UnityEngine.UI;

namespace Armageddon.UI
{
    // Amplia a UI pelo mesmo fator INTEIRO da Pixel Perfect Camera (6× em 1080p): 1 unidade de UI = 1 pixel do jogo.
    // Os tamanhos da UI neste guia são em pixels da tela de referência de 320×180.
    [RequireComponent(typeof(CanvasScaler))]
    public sealed class IntegerCanvasScale : MonoBehaviour
    {
        [SerializeField] private int _referenceWidth = 320;
        [SerializeField] private int _referenceHeight = 180;

        private CanvasScaler _scaler;
        private int _lastWidth;
        private int _lastHeight;

        private void Awake()
        {
            _scaler = GetComponent<CanvasScaler>();
            _scaler.uiScaleMode = CanvasScaler.ScaleMode.ConstantPixelSize;
            Apply();
        }

        private void Update()
        {
            if (Screen.width != _lastWidth || Screen.height != _lastHeight) Apply();   // janela redimensionada (Web)
        }

        private void Apply()
        {
            _lastWidth = Screen.width;
            _lastHeight = Screen.height;
            _scaler.scaleFactor = Mathf.Max(1, Mathf.Min(_lastWidth / _referenceWidth, _lastHeight / _referenceHeight));
        }
    }
}
```

#### Passo 6 — Os cards e a gaveta: `StatCard`, `SatellitePanel`, `UpgradeDrawer`

```csharp
// Caminho: Assets/_Project/Scripts/UI/StatCard.cs
using Armageddon.Economy;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Armageddon.UI
{
    // Um card da gaveta (Seção 6.3): ícone, nome, nível, valor atual > próximo valor, e custo. Tocar compra.
    public sealed class StatCard : MonoBehaviour
    {
        [SerializeField] private Image _icon;
        [SerializeField] private TMP_Text _name;
        [SerializeField] private TMP_Text _level;
        [SerializeField] private TMP_Text _value;
        [SerializeField] private TMP_Text _cost;
        [SerializeField] private Button _button;

        private RunEconomy _economy;
        private StatDefinition _stat;

        private void Awake()
        {
            _button.onClick.AddListener(HandleClick);
        }

        private void OnDestroy()
        {
            Unbind();
        }

        public void Bind(StatDefinition stat, RunEconomy economy)
        {
            Unbind();
            _stat = stat;
            _economy = economy;
            _icon.sprite = stat.Icon;
            _name.text = stat.DisplayName;
            _economy.Stats.StatChanged += HandleStatChanged;
            _economy.Wallet.BalanceChanged += Refresh;
            Refresh();
        }

        private void Unbind()
        {
            if (_economy == null) return;
            _economy.Stats.StatChanged -= HandleStatChanged;
            _economy.Wallet.BalanceChanged -= Refresh;
            _economy = null;
        }

        private void HandleClick()
        {
            _economy.Upgrades.TryPurchase(_stat.Id);
        }

        private void HandleStatChanged(StatId id)
        {
            if (id == _stat.Id) Refresh();
        }

        private void Refresh()
        {
            var stats = _economy.Stats;
            int level = stats.Level(_stat.Id);
            float now = stats.Value(_stat.Id);
            _level.text = $"Lv {level}";

            if (stats.IsMaxed(_stat.Id))
            {
                _value.text = _stat.Format(now);
                _cost.text = "MAX";
                _button.interactable = false;
                return;
            }

            // A fonte não tem "→" (Seção 6.3): o card usa ">".
            _value.text = $"{_stat.Format(now)} > {_stat.Format(stats.ValueAtLevel(_stat.Id, level + 1))}";
            _cost.text = stats.NextCost(_stat.Id).ToString();
            _button.interactable = _economy.Upgrades.CanPurchase(_stat.Id);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/SatellitePanel.cs
using System.Collections.Generic;
using Armageddon.Combat;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Armageddon.UI
{
    // Aba Satellites (Seção 6.3): uma linha por Satellite; tocar troca a Target Priority entre as liberadas.
    public sealed class SatellitePanel : MonoBehaviour
    {
        [SerializeField] private SatelliteOrbit _orbit;
        [SerializeField] private Button _rowPrefab;
        [SerializeField] private Transform _rows;
        // Só Closest vem liberada; os Perks do ramo Arsenal liberam as outras (Fase 9 chama SetUnlockedPriorities).
        [SerializeField] private List<TargetPriority> _unlocked = new List<TargetPriority> { TargetPriority.Closest };

        private readonly List<Button> _buttons = new List<Button>();

        private void OnEnable()
        {
            _orbit.CountChanged += Refresh;
            Refresh();
        }

        private void OnDisable()
        {
            _orbit.CountChanged -= Refresh;
        }

        public void SetUnlockedPriorities(IEnumerable<TargetPriority> priorities)
        {
            _unlocked = new List<TargetPriority>(priorities);
            Refresh();
        }

        public void Refresh()
        {
            var satellites = _orbit.Satellites;
            while (_buttons.Count < satellites.Count)
            {
                int index = _buttons.Count;
                var button = Instantiate(_rowPrefab, _rows);
                button.onClick.AddListener(() => Cycle(index));
                _buttons.Add(button);
            }

            for (int i = 0; i < _buttons.Count; i++)
            {
                bool visible = i < satellites.Count;
                _buttons[i].gameObject.SetActive(visible);
                if (visible) _buttons[i].GetComponentInChildren<TMP_Text>().text = $"Satellite {i + 1}: {satellites[i].Priority}";
            }
        }

        private void Cycle(int index)
        {
            var satellite = _orbit.Satellites[index];
            int current = _unlocked.IndexOf(satellite.Priority);
            satellite.Priority = _unlocked[(current + 1) % _unlocked.Count];
            Refresh();
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/UpgradeDrawer.cs
using System.Collections.Generic;
using Armageddon.Economy;
using Armageddon.World;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Armageddon.UI
{
    // A gaveta de upgrades (Seção 6.3). Fechada: faixa com o saldo e as 4 abas.
    // Aberta: os cards da Track tocada (ou a aba Satellites), e a câmera desliza. Nunca pausa o jogo.
    public sealed class UpgradeDrawer : MonoBehaviour
    {
        public enum Tab { None = -1, Offense = 0, Defense = 1, Utility = 2, Satellites = 3 }

        [SerializeField] private RunEconomy _economy;
        [SerializeField] private CameraRig _camera;
        [SerializeField] private Button[] _tabButtons = new Button[4];   // na ordem Offense, Defense, Utility, Satellites
        [SerializeField] private TMP_Text _shardsText;
        [SerializeField] private GameObject _panel;                      // a parte que abre
        [SerializeField] private GameObject _cardsView;                  // a rolagem com os cards
        [SerializeField] private Transform _cardContainer;
        [SerializeField] private StatCard _cardPrefab;
        [SerializeField] private SatellitePanel _satellitePanel;

        private readonly List<StatCard> _cards = new List<StatCard>();

        public Tab OpenTab { get; private set; } = Tab.None;

        private void Awake()
        {
            for (int i = 0; i < _tabButtons.Length; i++)
            {
                var tab = (Tab)i;
                _tabButtons[i].onClick.AddListener(() => HandleTabClicked(tab));
            }
        }

        // Start, e não Awake/OnEnable: a carteira é criada no Awake do RunEconomy, e a câmera no Awake do CameraRig.
        private void Start()
        {
            _economy.Wallet.BalanceChanged += RefreshShards;
            RefreshShards();
            SetOpen(Tab.None);
        }

        private void OnDestroy()
        {
            if (_economy != null && _economy.Wallet != null) _economy.Wallet.BalanceChanged -= RefreshShards;
        }

        private void HandleTabClicked(Tab tab)
        {
            SetOpen(OpenTab == tab ? Tab.None : tab);   // tocar na aba aberta fecha a gaveta
        }

        public void SetOpen(Tab tab)
        {
            OpenTab = tab;
            bool open = tab != Tab.None;
            bool satellites = tab == Tab.Satellites;

            _panel.SetActive(open);
            _camera.SetDrawerOpen(open);
            _cardsView.SetActive(open && !satellites);
            _satellitePanel.gameObject.SetActive(satellites);

            if (open && !satellites) ShowTrack((StatTrack)(int)tab);
        }

        private void ShowTrack(StatTrack track)
        {
            var stats = _economy.Catalog.ForTrack(track);
            while (_cards.Count < stats.Count) _cards.Add(Instantiate(_cardPrefab, _cardContainer));

            for (int i = 0; i < _cards.Count; i++)
            {
                bool visible = i < stats.Count;
                _cards[i].gameObject.SetActive(visible);
                if (visible) _cards[i].Bind(stats[i], _economy);
            }
        }

        private void RefreshShards()
        {
            _shardsText.text = _economy.Wallet.Balance.ToString();
        }
    }
}
```

#### Passo 7 — Teclas de teste: `EconomyDevTools`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/EconomyDevTools.cs
using UnityEngine;
#if UNITY_EDITOR || DEVELOPMENT_BUILD
using Armageddon.Combat;
using Armageddon.UI;
using UnityEngine.InputSystem;
#endif

namespace Armageddon.Economy
{
    // M = +100 Shards · U = libera as 4 Target Priorities na aba Satellites. Registra as compras no Console.
    public sealed class EconomyDevTools : MonoBehaviour
    {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
        [SerializeField] private RunEconomy _economy;
        [SerializeField] private SatellitePanel _satellitePanel;

        private void Start()
        {
            _economy.Upgrades.Purchased += HandlePurchased;
        }

        private void OnDestroy()
        {
            if (_economy != null && _economy.Upgrades != null) _economy.Upgrades.Purchased -= HandlePurchased;
        }

        private void Update()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null) return;

            if (keyboard.mKey.wasPressedThisFrame) _economy.Wallet.Add(100f);

            if (keyboard.uKey.wasPressedThisFrame)
            {
                _satellitePanel.SetUnlockedPriorities(new[]
                {
                    TargetPriority.Closest, TargetPriority.Weakest, TargetPriority.Strongest, TargetPriority.Farthest,
                });
            }
        }

        private void HandlePurchased(StatId id, int level)
        {
            var definition = _economy.Stats.Definition(id);
            Debug.Log($"[Economy] {id} nível {level}: {definition.Format(_economy.Stats.Value(id))}. Saldo: {_economy.Wallet.Balance}");
        }
#endif
    }
}
```

#### Passo 8 — Os 13 assets de Stat e o catálogo

Em `Assets/_Project/Data/Stats/`, **Create → Armageddon → Stat Definition**, uma vez para cada linha (valores da Seção 4.2; percentuais como fração). O **Icon** é a célula de `Art/UI/SPR_UI_Icons` indicada (Seção 6.4).

| Asset | Id | Track | Display Name | Base | Per Level | Cap | Base Cost | Format | Icon (célula) |
|---|---|---|---|---|---|---|---|---|---|
| `Stat_Damage` | Damage | Offense | Damage | 10 | 3 | 0 | 10 | Number | 0 |
| `Stat_AttackSpeed` | AttackSpeed | Offense | Attack Speed | 1 | 0.08 | 6 | 12 | PerSecond | 1 |
| `Stat_CriticalChance` | CriticalChance | Offense | Crit Chance | 0 | 0.015 | 0.8 | 15 | Percent | 2 |
| `Stat_CriticalFactor` | CriticalFactor | Offense | Crit Factor | 1.5 | 0.1 | 6 | 15 | Multiplier | 3 |
| `Stat_AttackRange` | AttackRange | Offense | Range | 4 | 0.15 | 8 | 12 | Units | 4 |
| `Stat_Impetus` | Impetus | Offense | Impetus | 0 | 0.004 | 0.12 | 20 | PercentPerUnit | 5 |
| `Stat_OrbitSpeed` | OrbitSpeed | Offense | Orbit Speed | 45 | 5 | 180 | 12 | DegreesPerSecond | 6 |
| `Stat_Hitpoints` | Hitpoints | Defense | Hitpoints | 100 | 25 | 0 | 10 | Number | 7 |
| `Stat_Regeneration` | Regeneration | Defense | Regen | 0 | 0.4 | 0 | 15 | PerSecond | 8 |
| `Stat_DefenseAbsolute` | DefenseAbsolute | Defense | Defense | 0 | 0.5 | 0 | 15 | Number | 9 |
| `Stat_DefenseRelative` | DefenseRelative | Defense | Defense % | 0 | 0.015 | 0.75 | 20 | Percent | 10 |
| `Stat_ResourceBonus` | ResourceBonus | Utility | Shard Bonus | 0 | 0.05 | 0 | 20 | Percent | 11 |
| `Stat_ResourcePerWave` | ResourcePerWave | Utility | Wave Bonus | 0 | 0.1 | 0 | 20 | Percent | 12 |

Depois, **Create → Armageddon → Stat Catalog** em `Data/Stats/`, com o nome `StatCatalog`, e arraste os 13 assets **nesta ordem** para a lista **Stats**: é a ordem dos cards na gaveta.

#### Passo 9 — Montar a economia na cena

Em `[Systems]` da cena `Gameplay`, crie `RunEconomy` com o componente `RunEconomy`: **Catalog** = `StatCatalog`; **Wave Balance** = `WaveBalance`; **Orbit** = o `SatelliteOrbit`; **Planet** = o `PlanetHealth` do objeto `Planet`; **Enemies** = o `EnemyPool`; **Waves** = o `WaveDirector`; **Starting Shards** = `0`.

> A partir de agora, os Stats do `SatelliteOrbit` e do `PlanetHealth` no Inspector são **sobrescritos** pelo `RunEconomy` quando o Play começa. Para testar valores, compre Upgrades (ou use **M** para ganhar Shards).

#### Passo 10 — Montar a gaveta

Todos os tamanhos e posições abaixo estão em **pixels da tela de referência de 320×180**.

1. **Canvas:** em `[UI]` da cena `Gameplay`, **UI → Canvas**. Nome `HUDCanvas`. **Render Mode** = `Screen Space - Overlay`; **Pixel Perfect** marcado. No **Canvas Scaler**, adicione o componente **Integer Canvas Scale** (ele troca o modo para `Constant Pixel Size` e calcula o fator sozinho). Se não houver um `EventSystem` na cena, crie com **UI → Event System** e, no Inspector dele, clique em **Replace with InputSystemUIInputModule**.
2. **Gaveta:** dentro do `HUDCanvas`, crie um objeto de UI vazio `UpgradeDrawer`, ancorado embaixo e esticado na horizontal (preset **bottom stretch**), com **Height** `72` (40% de 180) e **Pos Y** `0`. Adicione o componente `UpgradeDrawer`.
3. **Faixa (Strip):** dentro de `UpgradeDrawer`, uma **UI → Image** `Strip`, ancorada embaixo (bottom stretch), **Height** `20`. **Source Image** = `SPR_UI_DrawerStrip`; **Image Type** = `Tiled`.
   - Dentro de `Strip`, 4 **UI → Button** (`TabOffense`, `TabDefense`, `TabUtility`, `TabSatellites`) de **24 × 18**, lado a lado a partir da esquerda (X = 2, 28, 54, 80; Y centralizado). Cada botão: **Image** com `SPR_UI_Button` (a célula normal), **Image Type** `Sliced`, **Transition** `Sprite Swap` com a célula "pressionado" em **Pressed Sprite** e "desabilitado" em **Disabled Sprite**. Apague o texto do botão e crie dentro uma **UI → Image** de 16 × 16 com o ícone da aba: células 13, 14, 15 e 16 de `SPR_UI_Icons`.
   - À direita da faixa: uma **UI → Image** 16 × 16 com o ícone de Shards (célula 17) e, ao lado, um **UI → Text - TextMeshPro** `ShardsText` com a fonte `m5x7 Raster`, tamanho 16, alinhado à esquerda.
4. **Painel (a parte que abre):** dentro de `UpgradeDrawer`, uma **UI → Image** `Panel`, ancorada em cima (top stretch), **Height** `52`. **Source Image** = `SPR_UI_Panel`; **Image Type** = `Sliced`.
   - Dentro de `Panel`, uma **UI → Scroll View** `CardsView` que preenche o painel (stretch-stretch, margens de 4). Na `Scroll Rect`: **Horizontal** marcado, **Vertical** desmarcado; apague as barras de rolagem. No objeto `Content`, adicione **Horizontal Layout Group** (**Spacing** `4`, **Child Force Expand** desmarcado) e **Content Size Fitter** (**Horizontal Fit** = `Preferred Size`).
   - Também dentro de `Panel`, um objeto de UI vazio `SatellitePanel` (stretch-stretch, margens de 4) com **Vertical Layout Group** (**Spacing** `2`) e o componente `SatellitePanel`: **Orbit** = o `SatelliteOrbit`; **Rows** = o próprio `SatellitePanel`.
5. **Prefab do card (`StatCard`):** uma **UI → Button** de **60 × 44** com **Image** `SPR_UI_Button` (Sliced, Sprite Swap como as abas) e **Layout Element** (**Preferred Width** `60`, **Preferred Height** `44`). Apague o texto padrão e crie dentro:
   - `Icon`: **UI → Image** 16 × 16 no canto de cima à esquerda (X 4, Y −4).
   - `Name`: TMP (m5x7, 16) à direita do ícone, em cima.
   - `Level`: TMP logo abaixo do nome.
   - `Value`: TMP numa linha inteira no meio.
   - `Cost`: TMP embaixo, com um ícone de Shards (célula 17) ao lado.

   Adicione o componente `StatCard` e ligue os campos. Arraste para `Prefabs/UI/` e apague da cena.
6. **Prefab da linha de Satellite:** uma **UI → Button** de **140 × 12** com **Image** `SPR_UI_Button` (Sliced) e um TMP (m5x7, 16) dentro, e **Layout Element** (**Preferred Height** `12`). Arraste para `Prefabs/UI/` como `SatelliteRow` e apague da cena. No `SatellitePanel`, **Row Prefab** = `SatelliteRow`.
7. **Ligue o `UpgradeDrawer`:** **Economy** = `RunEconomy`; **Camera** = o `CameraRig` da Main Camera; **Tab Buttons** = os 4 botões, na ordem Offense, Defense, Utility, Satellites; **Shards Text** = `ShardsText`; **Panel** = `Panel`; **Cards View** = `CardsView`; **Card Container** = o `Content` da Scroll View; **Card Prefab** = `StatCard`; **Satellite Panel** = `SatellitePanel`.
8. Em `[Systems]`, crie `EconomyDevTools` com o componente `EconomyDevTools`: **Economy** = `RunEconomy`; **Satellite Panel** = o `SatellitePanel`.

> A tecla **F3** do `DevShortcuts` (Fase 2) continua movendo a câmera sozinha, sem abrir a gaveta. Agora prefira as abas.

#### Passo 11 — Commit

`git add .` e `git commit -m "Phase 6: stats, shards, upgrades, upgrade drawer"`.

**✅ Checkpoint:**
- Play: a faixa da gaveta aparece embaixo com as 4 abas e o saldo `0`. Cada Grunt destruído soma 1; um Wave Clear da Wave 1 soma 6 (5 + 1).
- Dois Swarmers destruídos somam **1** Shard (0,5 cada, acumulado).
- Tocar em **Offense** abre a gaveta com 7 cards (Damage, Attack Speed…), e o mundo desliza para o planeta ficar no centro da área livre. Tocar de novo em Offense fecha a gaveta.
- O card de Damage mostra `Lv 0`, `10 > 13` e custo `10`. Cards que o saldo não paga ficam desabilitados e se habilitam sozinhos quando o saldo chega ao custo.
- Comprar Damage: o saldo cai 10, o card vira `Lv 1`, `13 > 16`, custo `12` (10 × 1,15 arredondado), e o Grunt passa a morrer igual, mas o Brute precisa de menos tiros.
- Comprar **Range** faz o preenchimento do Quadrant **crescer** na hora. **Orbit Speed** faz o Satellite girar mais rápido.
- Comprar **Hitpoints** com o planeta ferido (**F6** algumas vezes): o máximo **e** o HP atual sobem 25.
- **Crit Chance** chega a `MAX` quando atinge 80% e deixa de ser comprável.
- Aba **Satellites**: uma linha `Satellite 1: Closest`. Com **U** (libera as prioridades) e tocando na linha, ela alterna Closest → Weakest → Strongest → Farthest. Com **2**–**4** (Fase 3), aparecem mais linhas.
- O jogo **nunca pausa** ao abrir a gaveta ou comprar.
- Em `1920x1080`, a UI tem o mesmo tamanho de pixel que o mundo (6×). Em `1280x720`, os dois ficam em 4×.

**Problemas comuns:**
- **Tocar nas abas não faz nada:** falta o `EventSystem` na cena, ou ele usa o módulo antigo (`Standalone Input Module`). Troque por `InputSystemUIInputModule`.
- **`KeyNotFoundException` no `RunStats`:** o `StatCatalog` não tem os 13 Stats, ou dois assets estão com o mesmo **Id**.
- **Os cards aparecem uns em cima dos outros:** falta o **Horizontal Layout Group** no `Content`, ou o **Layout Element** no prefab do card.
- **A UI fica gigante ou minúscula:** o `Canvas Scaler` ainda está em `Scale With Screen Size`. O `IntegerCanvasScale` troca o modo no `Awake`; confira se ele está no mesmo objeto que o `Canvas Scaler`.
- **A UI fica borrada:** o Canvas está sem **Pixel Perfect**, ou algum texto não usa o Font Asset `m5x7 Raster`.
- **Comprar não muda nada no jogo:** o `RunEconomy` está sem o **Orbit** ou o **Planet** preenchidos, e o Console mostra um `NullReferenceException`.
- **O valor aparece com vírgula ou com ponto dependendo do computador:** é a cultura do sistema operacional. A Fase 11 (Localization) fixa a formatação por idioma.

Próxima fase: **Fase 7 — Mothership**. Ela coloca o boss das Waves múltiplas de 10: órbita, laser telegrafado, cachos de Swarmers e a barra de HP.
