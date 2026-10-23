# Orbitfall

> Antes chamado *8-Bit Armageddon*. Pastas e código ainda usam o nome antigo.

Roguelike de defesa automática: um planeta fixo no centro da tela se defende sozinho de ondas de aliens, enquanto o jogador decide em tempo real onde investir. Este glossário fixa os termos canônicos (em inglês) usados no GDD e no código.

## Modos

**Last Stand**:
O modo principal: o jogador defende o planeta contra Waves infinitas. O recorde é o Best Wave.
_Avoid_: defense mode, modo defesa (Defense já é uma Track e um Stat)

**Invasion**:
O modo ao contrário: uma IA defende o planeta com as regras do Last Stand, e o jogador lança as naves alienígenas para derrubar uma sequência de Target Planets. Libera com a conquista Holding the Line.
_Avoid_: attack mode, modo ataque, siege

**Target Planet**:
Cada planeta defendido pela IA no Invasion; tem Planet Core e perfil de compra sorteados e um Siege Timer. Todo quinto é uma Fortress.
_Avoid_: nível, fase, stage

**Siege Timer**:
O tempo para destruir um Target Planet (120 s); se acabar com o planeta vivo, a run de Invasion acaba.
_Avoid_: timer (sozinho, que é o da Wave)

**Plasma**:
A moeda do jogador no Invasion: renda por segundo, por nave que acerta o planeta e por planeta destruído; gasta em naves (aba Deploy) e Fleet Upgrades (aba Fleet).
_Avoid_: Shards (no Invasion, Shards são da IA), energia, mana

**Fleet Upgrade**:
A compra de um nível de Hull, Warheads, Thrusters ou Plasma Flow no Invasion, válida até o fim da run.
_Avoid_: Upgrade (sozinho, que é do planeta)

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

**Gunner**:
Inimigo comum que não é kamikaze: para a 4,5 u do centro e dispara Gunner Bolts no planeta.
_Avoid_: shooter, atirador, sniper

**Gunner Bolt**:
O projétil do Gunner; não é alvo dos Satellites, gasta uma carga do Energy Shield e pode ser refletido pelo Reflector.
_Avoid_: tiro inimigo, bala

**Mothership**:
O boss das Boss Waves; entra pela borda e desce em espiral em volta do planeta até uma órbita mínima, dispara laser telegrafado e solta Swarmers, e permanece em campo até morrer.
_Avoid_: chefe, boss (quando se refere a este inimigo específico)

**Revive**:
Voltar à run depois que o planeta cai, uma vez por run, em troca de assistir a um anúncio.
_Avoid_: continue, segunda chance

## Planeta

**Planet Core**:
Variante do planeta escolhida antes da run, com pontos fortes e fracos próprios: Terra Core (equilibrado), Ice Core, Magma Core. Desbloqueado por conquista.
_Avoid_: núcleo planetário, planet type, Núcleo Estelar

**Satellite**:
Arma do planeta que orbita em volta dele e só ataca inimigos no Quadrant por onde está passando; toda run começa com um, e o jogador compra até mais três com Shards durante a run; todos ficam na mesma órbita e igualmente espaçados.
_Avoid_: Turret, drone, orbital, canhão

**Quadrant**:
Um dos 4 setores de 90° da tela, como um plano cartesiano centrado no planeta; um Satellite só atira em inimigos do Quadrant onde está e dentro do Attack Range.
_Avoid_: Sector, setor, zona (Sector é só para Spawn Sector), Firing Cone

**Target Priority**:
A regra (Closest, Weakest, Strongest, Farthest) que decide em qual inimigo válido (no Quadrant do Satellite e dentro do Attack Range) um Satellite atira.
_Avoid_: mira, targeting mode

**Multishot**:
Um disparo de Satellite que, sorteado por Multishot Chance, também solta um projétil em cada um de até Multishot Targets outros inimigos válidos.
_Avoid_: tiro múltiplo, spread, chain

**Energy Shield**:
O Stat de Defense que dá até 3 cargas; cada carga anula um hit inteiro e se recarrega com o tempo.
_Avoid_: barreira, bubble, Shield (sozinho)

**Reflector**:
O escudo-satélite do Stat Reflect Shield: órbita própria, sentido horário, cobre um Reflect Arc; devolve Gunner Bolts, bloqueia o laser e fere kamikazes com Reflect Damage (fixo). Não é um Satellite.
_Avoid_: Satellite, espelho, mirror

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
A única moeda do jogo: ganha matando inimigos e completando Waves, gasta em Upgrades e Satellites; zera a cada run.
_Avoid_: Energy Shards (só no texto de marketing), recurso, resource, cash

## Progressão permanente

Não existe moeda permanente nem Perks: além do Best Wave e do Best Planet, só Planet Cores, Skins e conquistas passam de uma run para a outra.

**Best Wave**:
O recorde do jogador: a maior Wave alcançada em qualquer run, mostrada no Main Menu e no Results.
_Avoid_: high score, pontuação, recorde (no código)

**Best Planet**:
O recorde do Invasion: o maior número de Target Planets destruídos numa run.
_Avoid_: high score, pontuação
