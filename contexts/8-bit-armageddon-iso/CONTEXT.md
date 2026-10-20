# 8-Bit Armageddon Iso

Jogo separado do 8-Bit Armageddon, com as mesmas regras vistas por uma câmera isométrica: um planeta fixo no centro de um grid isométrico se defende sozinho de ondas de aliens que vêm de qualquer direção do chão, enquanto o jogador decide em tempo real onde investir. Os termos nasceram de uma cópia do glossário do 8-Bit Armageddon, mas este glossário evolui sozinho. Termos canônicos em inglês, usados no GDD e no código.

## Mundo

**Isometric Grid**:
O chão em losango em volta do planeta. É só referência visual, sem efeito de jogo; as linhas dos eixos dele marcam onde um Quadrant termina e o outro começa.
_Avoid_: tabuleiro, board, tilemap (quando se refere à regra)

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
O boss das Boss Waves; entra pela borda e desce em espiral em volta do planeta até uma órbita mínima, dispara laser telegrafado e solta Swarmers, e permanece em campo até morrer.
_Avoid_: chefe, boss (quando se refere a este inimigo específico)


## Planeta

**Planet Core**:
Variante do planeta escolhida antes da run, com pontos fortes e fracos próprios: Terra Core (equilibrado), Ice Core, Magma Core. Desbloqueado por conquista.
_Avoid_: núcleo planetário, planet type, Núcleo Estelar

**Satellite**:
Arma do planeta que orbita em volta dele e só ataca inimigos no Quadrant por onde está passando; toda run começa com um, e o jogador compra até mais três com Shards durante a run; todos ficam na mesma órbita e igualmente espaçados.
_Avoid_: Turret, drone, orbital, canhão

**Quadrant**:
Um dos 4 setores de 90° do chão, alinhados aos eixos do Isometric Grid; na tela aparecem como as cunhas de cima, direita, baixo e esquerda do losango. Um Satellite só atira em inimigos do Quadrant onde está e dentro do Attack Range.
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
A única moeda do jogo: ganha matando inimigos e completando Waves, gasta em Upgrades e Satellites; zera a cada run.
_Avoid_: Energy Shards (só no texto de marketing), recurso, resource, cash

## Progressão permanente

Não existe moeda permanente nem Perks: além do Best Wave, só Planet Cores, Skins e conquistas passam de uma run para a outra.

**Best Wave**:
O recorde do jogador: a maior Wave alcançada em qualquer run, mostrada no Main Menu e no Results.
_Avoid_: high score, pontuação, recorde (no código)
