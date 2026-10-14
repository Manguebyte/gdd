# Paddock Boss — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`PaddockBoss.md`](../../PaddockBoss.md), usando a arte do SpriteCook em [`Sprites/PaddockBoss/`](../../Sprites/PaddockBoss/) direto do lugar (sem cópias). Não precisa de build nem servidor: abra `index.html` no navegador.

## O que tem
- Corrida simulada no mapa topdown: 7 equipes, 14 carros, sprite branco tingido com a cor de cada equipe e contorno + número nos dois carros do jogador.
- As regras são um porte direto do guia Unity (Parte 2): `TrackPath` (curva por graus/unidade), `RaceSimulator` (velocidade, voltas, box, ultrapassagens, chegada), `RaceEconomy`, `UpgradeService`, `RivalAI` (box e compras com as 6 personalidades da Etapa 6B) e o campeonato, agora de 5 etapas (§8), com pontos por equipe.
- Investimentos ao vivo: Engenharia, **Túnel de vento** (velocidade nas curvas), **Ultrapassagem** (vácuo e margem para passar), Propaganda, Equipe de boxes e Treino por piloto, com custo crescente e nível máximo 20. A 8ª vaga mostra a posição no campeonato.
- **Disputa de posição (§3):** colado atrás de outro carro, o de trás só passa se tiver ritmo melhor, e devagar (ar sujo). Na reta, o vácuo ajuda a encostar. Retardatários abrem caminho. Retomar uma posição em até 8 s não paga bônus.
- **Ritmo por carro (§5):** Normal ou Poupar. Poupando, o pneu gasta 40% menos e o carro anda 3% mais devagar. Volta ao Normal depois do box. A IA poupa perto do fim quando isso a deixa chegar sem parar.
- Pit stop: escolha do composto (Macio/Médio/Duro) e botão BOX por carro; entra ao fim da volta, dá para cancelar antes.
- Notificações (volta mais rápida, pneu gasto, box, última volta, chegada), tabela de posições com diferença, pneu e paradas.
- Tela da temporada com resultado da última etapa e classificação; save no `localStorage` só entre corridas (§12: fechar no meio da corrida perde ela).
- Todos os números vêm da §14 (Balanceamento inicial). Tela de referência 1920×1080, escalada para caber na janela (paisagem). No celular em pé aparece um aviso para girar o aparelho; no Android, o primeiro toque põe em tela cheia e trava em paisagem.

## Escolhas do protótipo onde o GDD diz "Em aberto"
- **Traçados:** o guia desenha as pistas no Editor da Unity; aqui elas são pontos de controle suavizados (Catmull-Rom) em `TRACKS`, no `game.js`. Nomes de pistas e equipes são provisórios.
- **Velocidade da simulação:** o botão ⏩ no mapa alterna 1×/2×/4×, para validar se o recurso deve existir (§3).
- **Investimento entre corridas:** não existe, como no guia.
- **Linhas de upgrade novas:** o kit do SpriteCook só tem as 4 áreas originais. As linhas do Túnel de vento e da Ultrapassagem são a moldura da Engenharia com outro ícone, geradas por `Sprites/PaddockBoss/_tools/upgrade_rows_extra.py`.
- **Pistas 4 e 5:** Aintree Park (Inglaterra) e Mangue Seco (Brasil, a casa da equipe, como final de temporada).

## O que ficou de fora
- Áudio, tutorial guiado, ordens táticas além do ritmo Poupar, clima, quebras e tudo da lista "Fora do MVP" (§13).
- Elementos do conceito de arte que estão Em aberto (subdivisões de engenharia, mistura de combustível, modo do motor, rádio).

## Primeira leitura do balanceamento
Rodando a simulação sem o jogador comprar nada, cada corrida dura de 4,7 a 6 min a 1× (dentro dos 3–6 min da §3), a IA para no box uma vez, por volta da metade da prova, e a ordem de chegada segue quase exatamente os níveis iniciais das equipes. O jogador termina sempre em P13/P14 com ~$ 1.000 no caixa. Ou seja, a corrida em si não gera surpresa; quem decide é o investimento. Essa é a pergunta que o protótipo serve para responder (§15 itens 3 e 12).

Com a disputa de posição, as corridas continuam durando o mesmo e têm de 50 a 70 ultrapassagens, como antes. Uma primeira versão deixava carros de ritmo igual trocando de posição a cada reta: eram 1.800 ultrapassagens, cada uma pagando bônus. Por isso, colado atrás, só ataca quem tem ritmo melhor, e retomar a posição não paga. Num carro do meio do pelotão (Engenharia 4, Treino 3), a Ultrapassagem nível 10 melhora a posição média de chegada em cerca de 2 lugares (de 12,5 para 10,5, em 15 corridas).

## Atalhos de desenvolvimento
Na URL, depois de `index.html`: `#fast` (começa em 4×), `#rich` (+5000 no caixa a cada largada), `#go` (pula a tela da temporada e larga direto), `#warp` (com `#go`: adianta 90 s de corrida), `#reset` (apaga o save). Combine com vírgula: `#go,rich`.
