# Charuto Racer — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`CharutoRacer.md`](../../CharutoRacer.md). Não precisa de build nem servidor: abra `index.html` no navegador. Joga-se com teclado ou controle (gamepad), em PC.

## O que tem
- **Estrada pseudo-3D** no estilo Top Gear (Fase 2 do guia): segmentos projetados, curvas, subidas e descidas que escondem a pista atrás da crista, zebras, faixas, neblina e fundo em 3 camadas com parallax. Tela de 320×180 ampliada sem suavização.
- **Pilotagem** (Fase 3): câmbio automático ou manual (E/Q), conta-giros com ponto ideal de troca, força centrífuga que depende da aderência e do desgaste dos pneus, perda de velocidade na grama, nitro com 3 cargas.
- **Combustível, pneus e dano** (Partes 1 §4.3–4.5): consumo por km (o dobro com nitro), desgaste maior fora da pista, batidas em objetos da beira e na traseira dos adversários, dano que reduz a velocidade máxima e continua para a próxima corrida. Com 100% de dano, ou parado sem combustível fora do box, é abandono.
- **Pit stop** (Fase 6): asfalto extra à direita da reta de largada; entrar abaixo de 90 km/h para o carro, que é reabastecido e tem os pneus trocados.
- **Corrida** (Fase 5): grid de 10 carros, jogador em último, contagem regressiva, voltas, posições ao vivo, bandeirada e tabela de resultado. 9 adversários com IA que tira o pé nas curvas e desvia de carros mais lentos.
- **Temporada de 8 GPs**, com os temas candidatos da Parte 1 §8: Inglaterra, Riviera, Itália, Alemanha, Bélgica, Holanda, EUA e México. Pontos 9-6-4-3-2-1, prêmio por posição, classificação com desempate por vitórias.
- **Garagem** (Fase 9): loja com as 16 peças das 4 categorias, números do carro, conserto de dano e escolha do câmbio. Save no `localStorage`, gravado só entre corridas.
- Esc pausa (com opção de desistir da corrida).

As regras ficam em `sim.js`, um porte direto do guia Unity (`Track`, `PlayerCarController`, `CollisionSystem`, `AICarController`, `RaceDirector`, `PitStopController`, `GameSession`), sem nada de tela; por isso a simulação também roda no Node para testar o balanceamento. `data.js` tem os números (o `GameConfig`), as peças, as equipes e as pistas; `art.js` desenha a arte; `game.js` cuida do desenho, da entrada, da HUD e da garagem.

## Escolhas do protótipo onde o GDD diz "Em aberto"
- **Arte provisória desenhada por código** (`art.js`): carros-charuto vistos de trás nas cores nacionais da época, árvores, fardos de feno, placas, prédios, arquibancadas e fundos. A arte final é do PixelLab (Parte 1 §9, Fase 10), que ainda depende da imagem de referência; nada aqui é decisão de estilo.
- **Pistas fictícias** "no estilo de" (Ashbury Park, Porto Azzurro, Vallerossa, Schwarzwaldring, Ardennes, Duinwijk, Glen Harbor, Valle Alto), com 4 a 6 voltas e 7 a 8,5 km de corrida. Nomes de equipes e pilotos também são placeholders.
- **8 pistas**, o mínimo dos "8 a 10" da Parte 1 §5.1.
- **Fim de temporada:** o placeholder do GDD (§5.3): "Nova temporada" zera os pontos e mantém dinheiro, peças e dano.

## Onde o protótipo mudou um número do guia
- **Força centrífuga com velocidade de referência fixa (200 km/h)**, em vez da fração da velocidade máxima do próprio carro. Do jeito antigo, um carro com motor melhor sentia a curva igual ao carro base, e pneus e chassi não faziam diferença. O guia (Fase 3.3) já foi atualizado com essa regra (`referenceSpeedKmh`).
- **Consumo de 12 %/km** (o guia diz 7). Com as corridas de ~7,5 km, 7 %/km nunca exigia pit stop; com 12, um tanque quase chega ao fim, mas não se o jogador usar os 3 nitros e bater.
- **Largura do carro 300** (o guia diz 360), para o carro do jogador ocupar ~80 px dos 320 em vez de ~96.

## Primeira leitura do balanceamento
Corrida simulada com o piloto automático do protótipo (`autopilot` em `sim.js`, o mesmo do atalho `#auto`), sem dano acumulado:

| Carro | Posição típica | Distância para o vencedor |
|---|---|---|
| Inicial (só peças de nível 1) | 9º–10º | 25–60 s |
| Só o motor V8 1.5 | 6º–10º | 13–35 s |
| Tudo no nível 2 | 4º–10º | 6–60 s |
| Tudo no nível 3 | 3º–10º | 3–45 s |
| Tudo no nível 4 | 1º (5º na Riviera) | — |

A curva de progressão funciona: cada nível de peças sobe o carro no grid e só o carro completo vence. O que não fecha é a **economia** placeholder do GDD: o carro inicial termina em 9º ou 10º e ganha $400–500 por GP, a primeira peça útil custa $4.500 e o carro completo custa $133.000. Uma temporada inteira com o carro inicial rende uns $6.000; seriam muitas temporadas para chegar ao carro completo. Simulando duas temporadas seguidas com o piloto automático, comprando sempre a peça mais barata que dava: o carro terminou com 6 das 16 peças e em 10º no campeonato nas duas. A pista de rua (Porto Azzurro) é a mais difícil: o piloto automático bate nos postes 5 a 11 vezes por corrida. Um jogador humano pode ir melhor que o piloto automático, então vale jogar antes de mexer nos números.

## O que ficou de fora
- Áudio (Parte 1 §11, todo Em aberto), tela dividida, chuva, treino classificatório, mini-mapa, menu principal e tudo da lista "Fora do MVP" (§13).
- Adversários não gastam combustível nem pneus, não param no box e não batem (placeholder da Parte 1 §4.3 e §7).

## Atalhos de desenvolvimento
Na URL, depois de `index.html`: `#go` (pula a garagem e larga direto no GP atual), `#gp=N` (escolhe o GP de 1 a 8), `#auto` (o piloto automático dirige), `#warp=N` (adianta N segundos de corrida ao largar), `#short` (corrida de 1 volta), `#rich` (+$50.000), `#reset` (apaga o save). Combine com vírgula: `#reset,gp=4,go,auto`.
