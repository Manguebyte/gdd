# Star Expedition Co.

Jogo mobile (Android, retrato) de gerenciamento de equipe com resolução idle: o jogador manda Squads do seu Roster em Expeditions de tempo real para Planets e usa o loot para craftar Equipment e contratar Crew Members. Este glossário fixa os termos canônicos (em inglês) usados no GDD e no código; a UI é traduzida (pt-BR/en).

## Equipe

**Crew Member**:
Um personagem contratado, pertencente a uma Crew Class, com um único slot de Equipment.
_Avoid_: personagem, herói, unidade, member (sozinho)

**Starter Pick**:
A escolha, no início do jogo, de 1 Crew Member grátis entre Scout, Engineer e Guard.
_Avoid_: personagem inicial, starter, escolha de classe

**Crew Class**:
Um dos 6 papéis (Scout, Engineer, Scientist, Guard, Medic, Pilot), cada um com um bônus próprio na resolução da Expedition.
_Avoid_: classe RPG, profissão, job

**Roster**:
Todos os Crew Members que o jogador possui, ocupados ou não.
_Avoid_: equipe, time, team

**Squad**:
Os 1 a 3 Crew Members enviados numa Expedition específica; ficam ocupados até o Claim.
_Avoid_: equipe, time, team, party, grupo

## Expedições

**Galaxy**:
Um conjunto ordenado de Planets; completar o último libera a próxima Galaxy.
_Avoid_: setor, região, mundo

**Planet**:
Destino de Expedition, com Risk, duração e Loot Table próprios; só pode ter uma Expedition ativa por vez.
_Avoid_: fase, nível, missão, stage

**Risk**:
O número que mede o perigo de um Planet e reduz a chance de sucesso; o Risk efetivo é o do Planet mais o do Cycle, menos a redução da Squad.
_Avoid_: dificuldade, perigo, monstros, inimigos, Threat

**Expedition**:
Uma Squad enviada a um Planet, esperando um timer real (também com o app fechado) até poder ser reivindicada.
_Avoid_: missão, viagem, run, quest

**Claim**:
O ato do jogador de abrir uma Expedition concluída e receber o resultado; é o Claim, não o fim do timer, que sorteia o resultado e libera o próximo Planet.
_Avoid_: coletar, resgatar, finalizar

**Success / Failure**:
Os dois únicos resultados de uma Expedition: Success entrega loot; Failure não entrega nada e pode causar Member Loss.
_Avoid_: resultado parcial, vitória/derrota

**Member Loss**:
A remoção permanente de um Crew Member da Squad numa Failure; o Equipment dele se perde junto.
_Avoid_: morte, permadeath (no texto do jogo), baixa

**Emergency Recruit**:
Um Scout dado de graça quando o Roster fica vazio e os Credits não pagam nenhuma contratação; impede o jogo de travar.
_Avoid_: recruta grátis, membro de resgate

## Itens e crafting

**Item**:
Qualquer coisa que entra no inventário; tem uma de 4 categorias: Raw Material, Component, Rare Item (as três vêm do Loot) ou Equipment (só sai de Recipe).
_Avoid_: recurso, loot (loot é o conjunto recebido num Claim)

**Loot**:
O conjunto de Items que o jogador recebe no Claim de um Success; cresce com o Cycle.
_Avoid_: recompensa, prêmio, drop

**Loot Table**:
A lista de Items que um Planet pode entregar num Success, com chance e quantidade de cada um.
_Avoid_: drop table, recompensas

**Equipment**:
Um Item craftado que pode ser equipado num Crew Member para dar bônus.
_Avoid_: tecnologia, upgrade, gear, arma

**Recipe**:
A receita que transforma Items em Equipment ou em outro Item; pertence a um Tech Tier.
_Avoid_: blueprint, fórmula

**Tech Tier**:
Um dos 4 níveis da árvore de Recipes; Recipes de tier mais alto exigem produtos de tiers anteriores.
_Avoid_: era, nível de tecnologia

## Economia e monetização

**Credits**:
A única moeda do jogo, ganha vendendo Items e usada para contratar Crew Members. Na UI pt-BR: "Créditos".
_Avoid_: moedas, dinheiro, gold, currency, moeda premium

**Hire**:
Comprar um novo Crew Member de uma Crew Class com Credits.
_Avoid_: recrutar, comprar membro, gacha

**Double Loot**:
O benefício de um anúncio recompensado: dobra os Items entregues num Success, no momento do Claim.
_Avoid_: bônus de anúncio, boost

**Ad-Free**:
Compra única que concede Double Loot em todo Success sem assistir anúncio.
_Avoid_: remover anúncios, VIP, premium

**Founder Pack**:
Compra única de lançamento com Credits e Crew Members extras.
_Avoid_: starter pack, pacote inicial

## Progressão sem fim

**Cycle**:
Uma passagem completa pelas Galaxies. Começar um Cycle novo zera só o desbloqueio de Planets, mantém todo o resto e soma Risk a todos os Planets.
_Avoid_: New Game Plus, NG+, prestígio, temporada, loop
