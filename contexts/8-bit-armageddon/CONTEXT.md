# 8-Bit Armageddon

Roguelike de defesa automática: um planeta fixo no centro da tela se defende sozinho de ondas de aliens, enquanto o jogador decide em tempo real onde investir. Este glossário fixa os termos canônicos (em inglês) usados no GDD e no código.

## Run e ondas

**Run**:
Uma tentativa completa, do início até a destruição do planeta.
_Avoid_: partida, jogo, match

**Wave**:
Um grupo de inimigos com timer próprio; a próxima começa quando o timer acaba ou quando a tela é limpa, o que vier primeiro. Limpar antes do timer é um **Wave Clear**.
_Avoid_: horda, round

**Wave Clear**:
O momento em que a tela fica sem inimigos; paga o bônus de Resource per Wave de toda Wave que ainda tinha inimigos vivos, inclusive as que já tinham passado do timer.
_Avoid_: onda completa, wave completed (quando o timer só expirou)

**Spawn Sector**:
Um arco de 60° ao redor do planeta de onde os inimigos de uma Wave nascem; cada Wave sorteia de 1 a 3.
_Avoid_: direção, lado, spawn point

**Boss Wave**:
Wave especial, a cada 10 ondas, com um único boss de padrão de ataque telegrafado.
_Avoid_: onda marco, milestone wave

**Mothership**:
O boss das Boss Waves; fica em órbita, dispara laser telegrafado e solta Swarmers, e permanece em campo até morrer.
_Avoid_: chefe, boss (quando se refere a este inimigo específico)

**Revive**:
Voltar à run depois que o planeta cai, uma vez por run, em troca de assistir a um anúncio.
_Avoid_: continue, segunda chance

## Planeta

**Planet Core**:
Variante do planeta escolhida antes da run, com pontos fortes e fracos próprios: Terra Core (equilibrado), Ice Core, Magma Core. Desbloqueado por conquista, nunca por Stardust.
_Avoid_: núcleo planetário, planet type, Núcleo Estelar

**Satellite**:
Arma do planeta que orbita em volta dele e só ataca inimigos no Quadrant por onde está passando; o planeta começa com um e pode ter até quatro, todos na mesma órbita e igualmente espaçados.
_Avoid_: Turret, drone, orbital, canhão

**Quadrant**:
Um dos 4 setores de 90° da tela, como um plano cartesiano centrado no planeta; um Satellite só atira em inimigos do Quadrant onde está e dentro do Attack Range.
_Avoid_: Sector, setor, zona (Sector é só para Spawn Sector), Firing Cone

**Target Priority**:
A regra (Closest, Weakest, Strongest, Farthest) que decide em qual inimigo válido (no Quadrant do Satellite e dentro do Attack Range) um Satellite atira.
_Avoid_: mira, targeting mode

**Skin**:
Visual alternativo de um Planet Core, sem efeito de gameplay.
_Avoid_: cosmético, cosmetic

## Progressão dentro da run

**Stat**:
Um valor numérico do planeta que afeta o combate (ex.: Damage, Regeneration, Resource Bonus).
_Avoid_: atributo, attribute

**Track**:
Um dos três grupos de Stats: Offense, Defense ou Utility.
_Avoid_: trilha, aba, categoria, category

**Upgrade**:
A compra de um nível de Stat com Shards, válida só até o fim da run.
_Avoid_: melhoria

**Shards**:
Moeda temporária ganha matando inimigos e completando Waves; zera a cada run.
_Avoid_: Energy Shards (só no texto de marketing), recurso, resource, cash

## Progressão permanente

**Stardust**:
Moeda permanente, obtida ao fim de cada run a partir dos Shards coletados.
_Avoid_: Núcleo Estelar, recurso permanente, currency, PermanentCurrency

**Perk**:
Um nó da árvore de meta-progressão, comprado com Stardust e mantido entre runs.
_Avoid_: upgrade permanente, meta upgrade

**Branch**:
Um dos quatro ramos da árvore de Perks: Offense, Defense, Utility e Arsenal. Os três primeiros espelham as Tracks; Arsenal libera Satellites e Target Priorities.
_Avoid_: Track (Track é só para Stats da run), categoria, category
