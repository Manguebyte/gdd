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

**Fórmula de dano do disparo:**
```
dano = Damage × (1 + Impetus × distânciaAoCentro) × (crítico ? CriticalFactor : 1)
```
O crítico é sorteado a cada disparo com probabilidade Critical Chance.

### 4.2 Stats do planeta (Upgrades)

Os Stats são organizados em três **Tracks**, que são as três abas da gaveta de upgrades. Cada Upgrade compra um nível de um Stat, válido até o fim da run.

**Definido:** custo do próximo nível = `baseCost × 1.15^nível`, com nível começando em 0. O valor de um Stat = `base + incremento × nível`, limitado pelo teto (quando houver), e depois modificado pelos Perks e pelo Planet Core.

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
- **Limite de tela:** no máximo **150 inimigos** vivos ao mesmo tempo. Se o limite for atingido, o spawn espera.

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
- **Câmera:** com a gaveta aberta, a câmera desliza para cima para o planeta continuar inteiro à vista. O jogo nunca pausa.
- **Aba Satellites:** uma linha por Satellite desbloqueado, com um seletor da Target Priority (só as prioridades já desbloqueadas).

**Definido: arte da interface.**
- **Painéis e botões:** metal cinza-escuro, com bordas mais claras e detalhes laranja, na mesma linguagem do Satellite ("equipamento do jogador"). São **9-slice** em células de 32×32, com bordas de 8 px: painel, botão (normal, pressionado e desabilitado) e a faixa da gaveta fechada.
- **Ícones:** 16 px dentro de células de 32×32, todos numa spritesheet só (13 Stats, 4 abas, Shards, Stardust e troféu).
- **Fonte:** **m5x7** (Daniel Linssen, CC0), com 7 px de altura, no tamanho 16 do TextMeshPro. Tem todos os acentos do português, mas em maiúsculas eles ficam espremidos, então a UI usa **maiúsculas e minúsculas**, nunca tudo em caixa alta. A fonte não tem "→": o card de Stat usa uma setinha como ícone. O arquivo e a licença estão em `Sprites/8-Bit-Armageddon/Fonts/`.
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
| Campo privado | `_camelCase` | `_turnSpeed` |
| Campo exposto no Inspector | `[SerializeField] private` + `_camelCase` | `[SerializeField] private float _orbitRadius;` |
| Evento C# | PascalCase, verbo no passado, sem `On` | `event Action<Enemy> EnemyKilled;` |
| Método que responde a evento | `Handle` + nome do evento | `HandleEnemyKilled(Enemy enemy)` |
| Constante | PascalCase | `const float IsoYScale = 0.6f;` |

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
| `Armageddon.Core` | `GameBootstrap` | Primeiro script a rodar: inicializa os serviços e carrega o Main Menu | 1 |
| `Armageddon.Core` | `Services` | Acesso central aos serviços (save, áudio, anúncios…) | 1 |
| `Armageddon.Core` | `SceneLoader` | Troca de cenas com tela de transição | 1 |
| `Armageddon.Core` | `SaveService`, `PlayerProfile` | Save JSON versionado e os dados salvos do jogador | 1 |
| `Armageddon.Core` | `GameClock` | Pausa (manual e automática) e escala de tempo | 1 |
| `Armageddon.World` | `Quadrant` | Os 4 Quadrants e em qual deles uma posição está | 2 |
| `Armageddon.World` | `CameraRig` | Pixel Perfect Camera, deslocamento com a gaveta, shake | 2 |
| `Armageddon.Planet` | `Planet`, `PlanetHealth` | O planeta, HP, dano recebido, regeneração | 2 |
| `Armageddon.Combat` | `Satellite`, `SatelliteOrbit` | Disparo; a órbita compartilhada e o espaçamento dos Satellites | 3 |
| `Armageddon.Combat` | `TargetSelector`, `TargetPriority` | Escolha de alvo dentro do Quadrant e do Attack Range | 3 |
| `Armageddon.Combat` | `Projectile`, `ProjectilePool` | Projétil teleguiado reaproveitado por pooling | 3 |
| `Armageddon.Combat` | `QuadrantView` | Mostra na tela o Quadrant coberto por cada Satellite | 3 |
| `Armageddon.Enemies` | `EnemyDefinition` | ScriptableObject com os dados de cada inimigo | 4 |
| `Armageddon.Enemies` | `Enemy`, `EnemyRegistry`, `EnemyPool` | Inimigo em cena, lista de vivos, pooling | 4 |
| `Armageddon.Enemies` | `StraightMovement`, `ZigZagMovement` | Comportamentos de movimento | 4 |
| `Armageddon.Waves` | `WaveDirector`, `WaveBalance` | Waves híbridas, composição, escalada, Wave Clear | 5 |
| `Armageddon.Waves` | `SpawnSectorIndicator` | Aviso na borda da tela | 5 |
| `Armageddon.Economy` | `StatDefinition`, `RunStats` | Definição dos 14 Stats e seus valores na run | 6 |
| `Armageddon.Economy` | `ShardWallet`, `UpgradeService` | Saldo de Shards e compra de Upgrades | 6 |
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
| 1 | Arquitetura: bootstrap, serviços, cenas, save, pausa | A escrever |
| 2 | Planeta, Quadrants e câmera | A escrever |
| 3 | Satellites, órbita, Target Priority e projéteis | A escrever |
| 4 | Inimigos | A escrever |
| 5 | Waves | A escrever |
| 6 | Stats, Shards, Upgrades e gaveta | A escrever |
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
- **Pacote (package):** uma biblioteca oficial da Unity (Input System, Cinemachine, Localization…) instalada pelo **Package Manager**. Bibliotecas de terceiros (DOTween) vêm da **Asset Store**.
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
| **Cinemachine** | Câmera e screen shake (Impulse) | 2 e 12 |
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
   - `Unity.Cinemachine`
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

#### Passo 7 — Cenas

Em `Assets/_Project/Scenes/`, crie três cenas (**botão direito → Create → Scene**, ou **File > New Scene** e salve):

| Cena | Para quê |
|---|---|
| `Boot` | Primeira cena. Inicializa os serviços e passa para o Main Menu. Nunca é recarregada. |
| `MainMenu` | Menu, Perks, Planet Cores, conquistas, recompensa diária, Settings |
| `Gameplay` | A run |

Apague a cena de exemplo que veio com o template (`SampleScene`).

Abra **File > Build Profiles** (no Unity 6, substitui o antigo "Build Settings"), clique em **Scene List** e adicione as cenas **nesta ordem**: `Boot` (índice 0), `MainMenu`, `Gameplay`. A cena de índice 0 é a que abre quando o jogo inicia.

#### Passo 8 — Player Settings (todas as plataformas)

**Edit > Project Settings > Player**, na parte comum a todas as plataformas:

| Campo | Valor |
|---|---|
| Company Name | `MangueByteGames` |
| Product Name | `8-Bit Armageddon` (este é o nome que o jogador vê, então pode ter hífen e espaço) |
| Version | `0.1.0` |

Em **Other Settings > Configuration**:
- **Active Input Handling:** `Input System Package (New)`. Se a Unity pedir para reiniciar, reinicie.

#### Passo 9 — Plataforma Android

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

#### Passo 10 — Plataforma Web

1. **File > Build Profiles** → selecione **Web**. Não precisa trocar a plataforma ativa agora; só confira que ela aparece sem aviso de módulo faltando.
2. **Edit > Project Settings > Player**, aba **Web** → **Publishing Settings**:
   - **Compression Format:** `Brotli`
   - **Decompression Fallback:** marcado. Sem isso, o jogo não abre em servidores que não enviam os cabeçalhos HTTP de compressão (como o itch.io). A Fase 14 detalha a configuração do site próprio.

#### Passo 11 — Commit

Feche a Unity (ela só grava algumas configurações em disco ao fechar), abra de novo, e faça o commit: `git add .` e `git commit -m "Project setup: packages, folders, presets, scenes, platform settings"`.

**✅ Checkpoint:**
- O projeto abre sem nenhuma mensagem vermelha no Console (**Window > General > Console**).
- `Assets/_Project/` tem toda a estrutura de pastas, e `Scripts/` tem o `Armageddon.asmdef`.
- Um PNG novo colocado em `Art/` entra automaticamente com PPU 16 e Filter Point.
- A cena `Boot` está no índice 0 da Scene List.
- *(Recomendado, e economiza muita dor depois)* Com um celular Android conectado por USB, com a **Depuração USB** ativada nas Opções do desenvolvedor, **File > Build Profiles > Android > Build And Run** instala o projeto vazio no aparelho e mostra uma tela azul/cinza. Isso prova que o SDK Android está funcionando antes de existir qualquer código.
- `git lfs ls-files` lista os PNGs que você já tiver no projeto (se ainda não tiver nenhum, a lista fica vazia, o que é normal).

**Problemas comuns:**
- **"Android SDK not found" ou "JDK not found" no build:** os submódulos OpenJDK e Android SDK & NDK não foram instalados. No Hub: **Installs** → engrenagem da versão → **Add modules**.
- **Erros vermelhos do DOTween depois de criar o asmdef:** rode de novo **Tools > Demigiant > DOTween Utility Panel > Setup DOTween…** com **Create ASMDEF** marcado, e confira que `DOTween.Modules` está nas referências do `Armageddon.asmdef`.
- **Sprites borrados ou "piscando":** o sprite foi importado antes do Preset existir, ou está fora de `Assets/_Project/Art/`. Selecione-o e clique no ícone de Preset → `SpriteImporter_PixelArt`.
- **O celular não aparece no Build And Run:** ative as **Opções do desenvolvedor** no Android (tocar 7 vezes em "Número da versão"), ligue a **Depuração USB** e aceite o pedido de autorização que aparece no celular ao conectar o cabo.
- **Os PNGs foram para o Git como arquivo normal:** o `git lfs install` não foi rodado, ou o `.gitattributes` foi criado depois do commit. Rode `git lfs migrate import --include="*.png,*.wav,*.ogg"` antes de enviar o repositório para qualquer lugar.
