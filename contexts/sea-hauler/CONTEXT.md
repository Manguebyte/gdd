# Sea Hauler

Tower defense em movimento com estrutura roguelite, no mar: uma fragata da Coroa britânica navega sozinha de um porto a outro, fugindo de piratas, e o jogador decide quanto pano içar e quais armas montar em quais portinholas. Jogo próprio, derivado do Space Hauler, mas com glossário independente. Termos em pt-BR.

## Viagem

**Run**:
Uma viagem completa do porto de origem ao porto de destino, ou até o navio afundar.
_Avoid_: partida, jogo

**Trecho**:
Uma parte da viagem entre dois nós do mapa de rota; termina quando o navio chega ao fim dele. No código, `Leg`.
_Avoid_: fase, nível, travessia

**Mapa de rota**:
O mapa em camadas, gerado a cada run e desenhado como carta náutica, onde o jogador escolhe o próximo trecho entre bifurcações; o último nó é a entrada do porto de destino, onde está o Galeão pirata.
_Avoid_: carta (sozinho), mapa do mundo

**Tipo de trecho**:
O padrão de ataque de um trecho: **Mar aberto** (piratas perseguem por trás), **Recifes** (emboscada pela frente e pelos lados, com rochedos), **Enseada pirata** (cerco de 360°, mais risco e mais ouro) ou **Tempestade** (por trás e pelos lados, menos piratas, com rajadas).
_Avoid_: bioma, terreno, clima

**Rochedo**:
Rocha dos Recifes que bate no navio e causa dano ao casco; não pode ser destruída. O dano cresce com a velocidade do navio.
_Avoid_: recife (o recife é o tipo de trecho), obstáculo, pedra

**Rajada**:
Golpe de vento da Tempestade, avisado alguns segundos antes; se pega o navio de Pano cheio, rasga as velas.
_Avoid_: tornado, vento (sozinho)

**Porto**:
Nó do mapa de rota onde, entre trechos, o jogador repara o casco pagando ouro e compra melhorias do navio. Não tem combate.
_Avoid_: estação, loja, doca

**Porto de destino**:
O fim da run, guardado pelo Galeão pirata. Não confundir com o Porto (nó de reparo).
_Avoid_: destino (sozinho, quando houver ambiguidade)

## O navio

**Navio**:
A fragata do jogador e "torre" do tower defense; segue a rota sozinha (o jogador não vira o leme) e afunda quando o casco chega a zero.
_Avoid_: nave, barco, player

**Velas**:
O controle de velocidade do jogador, em três posições: **Rizadas** (devagar), **Meio pano** (o ritmo dos piratas) e **Pano cheio** (mais rápido que os piratas). No código, `SailSetting`.
_Avoid_: marcha, acelerador, velocidade (para a posição)

**Ritmo do mar**:
A velocidade fixa em que os piratas navegam (igual ao Meio pano). Eles não acompanham o Pano cheio. No código, `seaSpeed`.
_Avoid_: velocidade de cruzeiro (era o termo do Space Hauler)

**Velas rasgadas**:
Estado em que o navio fica preso em Rizadas por alguns segundos, depois de uma rajada pegar o Pano cheio. Inimigos também ficam com as velas rasgadas (bala encadeada, barris) e perdem o embalo.
_Avoid_: atordoado, stun

**Portinhola**:
Um dos 8 pontos fixos do navio onde se monta uma arma: 1 na proa (caça-proa), 3 a bombordo, 3 a estibordo e 1 na popa (caça-popa). Cada uma só atira dentro do próprio arco de tiro; nenhuma cobre 360°. Quatro começam fechadas. No código, `Gunport`.
_Avoid_: hardpoint, slot, encaixe

**Bordada**:
O conjunto das portinholas de um lado do navio (3 de cada lado). Também é o nome de uma habilidade (todas as armas recarregam em dobro).
_Avoid_: lateral (para o conjunto)

**Arco de tiro**:
A faixa de direções em que a arma de uma portinhola consegue mirar: para frente (proa), para trás (popa) ou para o próprio lado (bombordo/estibordo).
_Avoid_: cone, alcance (alcance é a distância, não a direção)

**Arma**:
O que se monta numa portinhola e mira e atira sozinho: Canhão longo, Carronada, Bala encadeada, Fuzileiros.
_Avoid_: defesa, torre

**Melhoria do navio**:
Upgrade da própria fragata, fora das portinholas, comprado em níveis com ouro: **Forro de cobre** (+ casco máximo e − dano de colisão), **Velame** (Pano cheio mais rápido), **Tripulação** (conserta o casco devagar durante o trecho) e **Portinholas** (abre uma portinhola fechada).
_Avoid_: anexo, módulo, carenagem

**Forro de cobre**:
A melhoria que blinda o navio contra colisão (rochedos e brulotes). No código, `Copper`.
_Avoid_: carenagem, blindagem, armadura

**Casco**:
Os pontos de vida do navio; chegar a zero afunda o navio e acaba a run.
_Avoid_: HP, vida, hull (no texto)

**Habilidade**:
Ação do jogador com cooldown, usada por botão: Barris de pólvora e Bordada.
_Avoid_: poder, skill

## Economia

**Ouro**:
A única moeda da run: solto por piratas afundados e gasto em tempo real em armas, portinholas e melhorias, e em reparo nos Portos; zera quando a run acaba. Inimigos deixados para trás não dão ouro.
_Avoid_: sucata, dinheiro, moedas, saque (saque é o conceito, ouro é a moeda)

**Deixado para trás**:
Inimigo que ficou a mais de 40 m do navio, atrás dele, e saiu do jogo sem dar ouro. É o preço de fugir ("fuga custa saque").
_Avoid_: fugiu, escapou (quem foge é o navio)

## Inimigos

**Escuna pirata**:
Inimigo rápido e frágil que ronda o navio do lado de onde veio e atira.

**Chalupa de abordagem**:
Encosta no navio e solta **Piratas a bordo**, que ocupam uma portinhola aberta, sabotam a arma dela e ferem o casco até serem mortos.
_Avoid_: nave de abordagem, saqueador

**Brulote**:
Barco em chamas cheio de pólvora que vai direto no navio e explode ao bater; afundado antes, não causa dano.
_Avoid_: kamikaze, navio-bomba

**Galeão pirata**:
O chefe, na entrada do porto de destino. Nunca fica para trás: enquanto estiver à tona, o navio não chega.
_Avoid_: chefe, boss (quando se refere a este inimigo)
