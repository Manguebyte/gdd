# Paddock Boss — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`PaddockBoss.md`](../../PaddockBoss.md), usando a arte do SpriteCook em [`Sprites/PaddockBoss/`](../../Sprites/PaddockBoss/) direto do lugar (sem cópias). Não precisa de build nem servidor: abra `index.html` no navegador.

## O que tem
- Corrida simulada no mapa topdown: 7 equipes, 14 carros, sprite branco tingido com a cor de cada equipe e contorno + número nos dois carros do jogador.
- As regras são um porte direto do guia Unity (Parte 2): `TrackPath` (curva por graus/unidade), `RaceSimulator` (velocidade, voltas, box, ultrapassagens, chegada), `RaceEconomy`, `UpgradeService`, `RivalAI` (box e compras com as 6 personalidades da Etapa 6B) e o campeonato de 3 etapas com pontos por equipe.
- Investimentos ao vivo: Engenharia, Propaganda, Equipe de boxes e Treino por piloto, com custo crescente e nível máximo 20.
- Pit stop: escolha do composto (Macio/Médio/Duro) e botão BOX por carro; entra ao fim da volta, dá para cancelar antes.
- Notificações (volta mais rápida, pneu gasto, box, última volta, chegada), tabela de posições com diferença, pneu e paradas.
- Tela da temporada com resultado da última etapa e classificação; save no `localStorage` só entre corridas (§12: fechar no meio da corrida perde ela).
- Todos os números vêm da §14 (Balanceamento inicial). Tela de referência 1920×1080, escalada para caber na janela (paisagem).

## Escolhas do protótipo onde o GDD diz "Em aberto"
- **Traçados:** o guia desenha as pistas no Editor da Unity; aqui elas são pontos de controle suavizados (Catmull-Rom) em `TRACKS`, no `game.js`. Nomes de pistas e equipes são provisórios.
- **Velocidade da simulação:** o botão ⏩ no mapa alterna 1×/2×/4×, para validar se o recurso deve existir (§3).
- **Investimento entre corridas:** não existe, como no guia.
- A vaga "Túnel de vento" fica trancada só para mostrar o estado `upgrade_row_locked` do kit; não é uma decisão de design.

## O que ficou de fora
- Áudio, tutorial guiado, ordens táticas, clima, quebras e tudo da lista "Fora do MVP" (§13).
- Elementos do conceito de arte que estão Em aberto (subdivisões de engenharia, mistura de combustível, modo do motor, rádio).

## Primeira leitura do balanceamento
Rodando a simulação sem o jogador comprar nada, cada corrida dura de 4,7 a 6 min a 1× (dentro dos 3–6 min da §3), a IA para no box uma vez, por volta da metade da prova, e a ordem de chegada segue quase exatamente os níveis iniciais das equipes. O jogador termina sempre em P13/P14 com ~$ 1.000 no caixa. Ou seja, a corrida em si não gera surpresa; quem decide é o investimento. Essa é a pergunta que o protótipo serve para responder (§15 itens 3 e 12).

## Atalhos de desenvolvimento
Na URL, depois de `index.html`: `#fast` (começa em 4×), `#rich` (+5000 no caixa a cada largada), `#go` (pula a tela da temporada e larga direto), `#warp` (com `#go`: adianta 90 s de corrida), `#reset` (apaga o save). Combine com vírgula: `#go,rich`.
