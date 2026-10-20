# Space Hauler

Tower defense em movimento com estrutura roguelite, no espaço: uma nave de carga viaja sozinha de um planeta a outro enquanto piratas a atacam, e o jogador só decide quais defesas montar em quais hardpoints. Jogo próprio, derivado do Fury Hauler, mas com glossário independente. Termos em pt-BR.

## Viagem

**Run**:
Uma viagem completa do planeta de origem ao planeta de destino, ou até a nave ser destruída.
_Avoid_: partida, jogo

**Trecho**:
Uma parte da viagem entre dois nós do mapa de rota; termina quando a nave chega ao fim dele.
_Avoid_: fase, nível, salto, setor

**Mapa de rota**:
O mapa em camadas, gerado a cada run, onde o jogador escolhe o próximo trecho entre bifurcações; o último nó é a órbita do planeta de destino, onde está o Cruzador pirata.
_Avoid_: mapa estelar, galáxia

**Tipo de trecho**:
O padrão de ataque de um trecho: **Espaço aberto** (piratas perseguem por trás), **Cinturão de asteroides** (emboscadas pela frente e pelos lados) ou **Rota pirata** (cerco de 360°, mais risco e mais sucata).
_Avoid_: bioma, terreno

**Asteroide**:
Rocha do Cinturão de asteroides que bate na nave e causa dano ao casco; não pode ser destruída, só aguentada com Carenagem.
_Avoid_: obstáculo, meteoro

**Estação**:
Nó do mapa de rota onde, entre trechos, o jogador repara o casco pagando sucata. É o único jeito de recuperar casco.
_Avoid_: oficina, loja, base

## A nave

**Nave**:
A nave de carga do jogador e "torre" do tower defense; anda sozinha, sem controle de direção nem velocidade, e acaba a run quando o casco chega a zero.
_Avoid_: navio, caminhão, player

**Hardpoint**:
Um dos 6 pontos fixos da nave onde se monta uma defesa: 1 na proa, 1 na popa, 2 a bombordo e 2 a estibordo. Cada um só atira dentro do próprio arco de tiro; nenhum cobre 360°.
_Avoid_: slot, torre, encaixe

**Arco de tiro**:
A faixa de direções em que a defesa de um hardpoint consegue mirar: para frente (proa), para trás (popa) ou para o próprio lado (bombordo/estibordo).
_Avoid_: cone, alcance (alcance é a distância, não a direção)

**Defesa**:
Arma ou equipamento montado num hardpoint que mira e atira sozinho: Autocanhão, Canhão de plasma, Arpão magnético, Campo elétrico (passivo: fere quem encosta e os piratas a bordo daquele hardpoint).
_Avoid_: torre, arma (para o conjunto)

**Carenagem**:
Upgrade da própria nave, fora dos hardpoints, comprado em níveis com sucata: cada nível aumenta o casco máximo e reduz o dano de colisão (asteroides e drones kamikaze). É a escolha "blindar" contra o "armar" dos hardpoints.
_Avoid_: blindagem, casco reforçado, armadura

**Casco**:
Os pontos de vida da nave; chegar a zero acaba a run.
_Avoid_: HP, vida, hull (no texto)

**Habilidade**:
Ação do jogador com cooldown, usada por botão: Pós-combustor e Nuvem de detritos.
_Avoid_: poder, skill

## Economia

**Sucata**:
A única moeda da run: solta por piratas abatidos e gasta em tempo real em defesas e Carenagem, e em reparo nas Estações; zera quando a run acaba.
_Avoid_: créditos, especiaria, salvage, dinheiro

## Inimigos

**Caça pirata**:
Inimigo rápido e frágil que emparelha com a nave e atira.

**Nave de abordagem**:
Encosta na nave e solta **Piratas a bordo**, que ocupam um hardpoint, sabotam a defesa dele e ferem o casco até serem mortos.
_Avoid_: buggy, saqueador

**Drone kamikaze**:
Vai direto na nave e explode ao bater; destruído antes, não causa dano.
_Avoid_: míssil, carro-bomba

**Cruzador pirata**:
O chefe, na órbita do planeta de destino.
_Avoid_: chefe, boss (quando se refere a este inimigo)
