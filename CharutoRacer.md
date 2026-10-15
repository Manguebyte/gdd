# GDD — Charuto Racer

> Documento vivo. Rascunho inicial — a refinar conforme prototipagem. Os números de balanceamento (velocidades, consumo, preços, prêmios, pontos) ainda não foram decididos: os valores das tabelas da Parte 1 e do Guia de Implementação Unity (Parte 2 em diante) são **placeholders de MVP**, não decisões fechadas.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Unity](#parte-2--guia-de-implementação-unity)
3. [Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-3--implementação-unity-fase-0-setup-do-projeto)
4. [Parte 4 — Implementação Unity: Fase 1 (Dados e Configuração)](#parte-4--implementação-unity-fase-1-dados-e-configuração)
5. [Parte 5 — Implementação Unity: Fase 2 (Estrada Pseudo-3D)](#parte-5--implementação-unity-fase-2-estrada-pseudo-3d)
6. [Parte 6 — Implementação Unity: Fase 3 (Carro do Jogador e Sprites)](#parte-6--implementação-unity-fase-3-carro-do-jogador-e-sprites)
7. [Parte 7 — Implementação Unity: Fase 4 (Colisões e Dano)](#parte-7--implementação-unity-fase-4-colisões-e-dano)
8. [Parte 8 — Implementação Unity: Fase 5 (Adversários e Corrida)](#parte-8--implementação-unity-fase-5-adversários-e-corrida)
9. [Parte 9 — Implementação Unity: Fase 6 (Pit Stop)](#parte-9--implementação-unity-fase-6-pit-stop)
10. [Parte 10 — Implementação Unity: Fase 7 (HUD e Resultado)](#parte-10--implementação-unity-fase-7-hud-e-resultado)
11. [Parte 11 — Implementação Unity: Fase 8 (Temporada, Economia e Save)](#parte-11--implementação-unity-fase-8-temporada-economia-e-save)
12. [Parte 12 — Implementação Unity: Fase 9 (Garagem e Loja de Peças)](#parte-12--implementação-unity-fase-9-garagem-e-loja-de-peças)
13. [Parte 13 — Implementação Unity: Fase 10 (Arte no PixelLab)](#parte-13--implementação-unity-fase-10-arte-no-pixellab)
14. [Parte 14 — Implementação Unity: Fase 11 (Build e Próximos Passos)](#parte-14--implementação-unity-fase-11-build-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Nome:** **Definido** — Charuto Racer. O nome vem dos "carros-charuto", apelido dos monopostos de Fórmula 1 dos anos 60, finos e compridos como um charuto.
- **Gênero:** **Definido** — corrida arcade com progressão por economia: cada corrida paga dinheiro, e o dinheiro compra peças melhores para o carro.
- **Dimensão:** **Definido** — 2D. Toda a arte é sprite 2D. A sensação de profundidade vem de uma estrada **pseudo-3D** (linhas da pista projetadas e sprites escalados pela distância), como nos jogos de corrida de 16 bits. Não há modelo 3D nem física 3D.
- **Câmera/perspectiva:** **Definido** — atrás do carro, com a estrada indo até o horizonte, no estilo Top Gear (SNES). O carro do jogador fica fixo na parte de baixo da tela; a pista, os adversários e o cenário se movem.
- **Plataforma-alvo:** **Definido** — PC, com teclado ou controle (gamepad). **Em aberto:** loja de distribuição (Steam, itch.io) e se haverá build Web.
- **Pilar de design:** **Definido** — **"da garagem pequena ao campeonato, sempre no limite"**. O jogador começa com o carro mais fraco do grid e sente cada peça comprada mudar a corrida. Ao mesmo tempo, pilotar é perigoso: carros rápidos e frágeis, combustível contado e batidas que custam caro.
- **Fantasia central:** ser o piloto-dono de uma equipe nanica nos anos 60, que sai do fundo do grid e, peça por peça, chega a campeão do mundo.
- **Referências/inspirações:** **Definido** — Top Gear (SNES, 1992): estrada pseudo-3D, combustível e pit stop, nitro limitado, câmbio manual ou automático e loja de peças entre corridas.
- **Relação com outros jogos do estúdio:** **Definido** — jogo separado. Não faz parte da franquia Rally (`RallySurvive.md`): o controle é por teclado/controle, não pelo mouse, e não há `ChevronGuide` nem formato de pista compartilhado. Também não tem relação com `PaddockBoss.md`: aqui o jogador pilota; lá, ele só gerencia.

## 2. Loop Principal

1. **Definido:** o jogador está na **Garagem**: vê o dinheiro, a classificação do campeonato e a próxima pista.
2. **Definido:** na Garagem, compra e equipa peças em quatro categorias (motor, câmbio, pneus, chassi/aerodinâmica) e paga o conserto do dano acumulado (§6).
3. **Definido:** o jogador corre o próximo Grande Prêmio da temporada contra 8 a 10 carros controlados pelo computador (§4, §7).
4. **Definido:** durante a corrida, administra combustível, pneus, nitro e dano; se precisar, entra no pit stop (§4).
5. **Definido:** ao fim da corrida, recebe **dinheiro pela posição** e **pontos no campeonato** (§5, §6).
6. **Definido:** volta para a Garagem; o ciclo se repete até o último GP da temporada.
7. **Em aberto:** o que acontece ao fim da temporada (§5.3).

## 3. Pilotagem

### 3.1 Controles

- **Definido:** teclado ou controle. Mapeamento placeholder de MVP (não aprovado):

| Ação | Teclado | Controle |
|---|---|---|
| Acelerar | ↑ ou W | A (botão sul) ou gatilho direito |
| Frear | ↓ ou S | X (botão oeste) ou gatilho esquerdo |
| Virar | ← → ou A D | analógico esquerdo ou direcional |
| Nitro | Espaço | Y (botão norte) |
| Subir marcha (manual) | E | RB |
| Descer marcha (manual) | Q | LB |

- **Em aberto:** remapeamento de teclas pelo jogador.

### 3.2 Câmbio

- **Definido:** o jogador escolhe entre **câmbio automático** e **manual**.
- **Definido:** cada marcha cobre uma faixa de velocidade. A aceleração depende da marcha e da rotação (conta-giros): rotação baixa e rotação no limite rendem menos; cada marcha tem um ponto ideal de troca.
- **Definido:** o número de marchas depende da peça de câmbio instalada (§6.2).
- **Em aberto:** se o manual dá alguma vantagem sobre o automático (no Top Gear, dava aceleração melhor). Placeholder de MVP: nenhuma vantagem; o fator fica configurável no código (`automaticAccelFactor`).
- **Em aberto:** se trocar de marcha no limite da rotação (ou reduzir em alta) causa dano ao motor.

### 3.3 Curvas e força centrífuga

- **Definido (como em todo jogo de estrada pseudo-3D):** nas curvas, uma força empurra o carro para fora. Quanto maior a velocidade e mais fechada a curva, maior o empurrão. O jogador compensa virando para dentro ou tirando o pé.
- **Definido:** a **aderência** (vinda dos pneus e do chassi/aerodinâmica, §6.2) diminui esse empurrão. Pneus gastos aderem menos (§4.4).

### 3.4 Fora da pista

- **Definido:** sair do asfalto (grama, terra) faz o carro perder velocidade até um limite baixo.
- **Definido:** na beira da pista há objetos (árvores, placas, fardos de feno, postes). Bater num deles causa **dano** e quase para o carro (§4.5).
- **Em aberto:** se existe algum tipo de terreno de escape que não causa dano (área de brita, grama larga).

## 4. Corrida

### 4.1 Largada, voltas e posições

- **Definido:** grid de 8 a 10 carros controlados pelo computador, mais o jogador (§7).
- **Definido:** corrida por número fixo de voltas, que varia por pista.
- **Em aberto:** posição de largada do jogador. Placeholder de MVP: larga **em último**, como no Top Gear, o que reforça o pilar de "sair do fundo".
- **Em aberto:** formato do grid. A F1 dos anos 60 usava filas alternadas de 3-2-3. Placeholder de MVP: 2 carros por fila.
- **Em aberto:** número de voltas por pista. Placeholder de MVP: 5 voltas.
- **Em aberto:** se existe treino classificatório para definir o grid.

### 4.2 Nitro

- **Definido:** número **limitado** de cargas de nitro por corrida. Cada carga dá alguns segundos de velocidade máxima e aceleração maiores.
- **Em aberto:** quantas cargas, quanto dura cada uma, e se o nitro gasta combustível extra. Placeholder de MVP: 3 cargas de 4 s, com consumo de combustível em dobro durante o efeito.
- **Em aberto:** se a quantidade de cargas pode ser comprada ou melhorada na Garagem. Nota: o nitro é anacrônico para a F1 dos anos 60, mas é herança direta do Top Gear; falta decidir se ele ganha um nome de época.

### 4.3 Combustível e pit stop

- **Definido:** o carro gasta combustível conforme a distância percorrida. Sem combustível, o motor para.
- **Definido:** existe uma **entrada de box** (pit lane) na reta de largada. Entrar nela devagar para o carro, que é reabastecido e tem os pneus trocados, ao custo do tempo parado.
- **Em aberto:** o tamanho do tanque em relação à corrida (se o pit stop é obrigatório, opcional ou só emergência). Placeholder de MVP: um tanque cheio dura um pouco menos que a corrida inteira, então quem não para no box precisa economizar (sem nitro, sem bater).
- **Em aberto:** se o pit stop também conserta dano. Placeholder de MVP: não conserta; dano só se conserta na Garagem, pagando.
- **Em aberto:** se o tanque começa cheio, e se o jogador pode escolher quanto combustível levar (menos peso).
- **Em aberto:** se os adversários também param no box. Placeholder de MVP: não; os adversários não gastam combustível nem pneus.

### 4.4 Desgaste de pneus

- **Definido:** os pneus se desgastam ao longo da corrida, mais rápido fora da pista. Pneu gasto reduz a aderência nas curvas (§3.3).
- **Definido:** o pit stop troca os pneus.
- **Em aberto:** se o desgaste continua entre corridas (comprar pneus novos) ou se todo GP começa com pneus novos. Placeholder de MVP: todo GP começa com pneus novos, sem custo.

### 4.5 Dano mecânico

- **Definido:** batidas (em objetos da beira da pista ou na traseira de outros carros) causam dano. Dano reduz a velocidade máxima.
- **Definido:** o dano **continua de uma corrida para a outra** e custa dinheiro para consertar na Garagem.
- **Em aberto:** o que acontece com 100% de dano. Placeholder de MVP: o carro quebra e o jogador **abandona** a corrida (sem prêmio, sem pontos).
- **Em aberto:** dano separado por componente (motor, câmbio, suspensão) ou um valor único. Placeholder de MVP: valor único de 0 a 100%.

### 4.6 Abandono

- **Definido (consequência das regras acima):** o jogador abandona a corrida se o carro quebrar ou se ficar parado sem combustível fora do box.
- **Em aberto:** se abandonar dá algum dinheiro (participação) e se conta no campeonato. Placeholder de MVP: não dá dinheiro nem pontos.

## 5. Campeonato

### 5.1 Temporada

- **Definido:** o jogo é organizado em **temporada**: uma sequência fixa de Grandes Prêmios, corridos em ordem, com pontos por posição.
- **Definido:** a temporada do MVP tem **8 a 10 pistas** (§8). **Em aberto:** o número exato.

### 5.2 Pontos

- **Em aberto:** tabela de pontos. Placeholder de MVP: a tabela real da F1 de 1961 a 1990 — 9, 6, 4, 3, 2 e 1 ponto para os seis primeiros; do 7º em diante, zero.
- **Em aberto:** critério de desempate. Placeholder de MVP: mais vitórias, depois mais segundos lugares.

### 5.3 Fim de temporada

- **Em aberto:** o que acontece quando a temporada termina. Possibilidades a discutir (nenhuma aprovada): (a) jogo zerado, com tela de campeão; (b) nova temporada mantendo carro e dinheiro, com adversários mais fortes; (c) a temporada seguinte avança no tempo (1965 → 1966...) e libera peças novas da época.
- **Em aberto:** se perder o campeonato tem alguma consequência.
- Placeholder de MVP (só para o protótipo ter fim): ao fim da temporada aparece a classificação final e um botão "Nova temporada" que zera os pontos e mantém dinheiro, peças e dano.

## 6. Economia e Peças

### 6.1 Dinheiro

- **Definido:** **toda corrida paga dinheiro** de acordo com a posição de chegada.
- **Definido:** o dinheiro é gasto em **peças** e em **conserto de dano**.
- **Em aberto:** valores. Placeholder de MVP:

| Posição | 1º | 2º | 3º | 4º | 5º | 6º | 7º | 8º | 9º | 10º |
|---|---|---|---|---|---|---|---|---|---|---|
| Prêmio ($) | 5.000 | 3.500 | 2.500 | 1.800 | 1.300 | 1.000 | 800 | 600 | 500 | 400 |

- Placeholder de MVP: dinheiro inicial de $2.000; conserto custa $40 por ponto percentual de dano.
- **Em aberto:** outras fontes de dinheiro (patrocínio, bônus por volta mais rápida, por ultrapassagens).
- **Em aberto:** moeda (dólar, libra, moeda fictícia).

### 6.2 Categorias de peças

- **Definido:** quatro categorias de peças, cada uma com níveis comprados em sequência ou livremente:

| Categoria | O que melhora |
|---|---|
| **Motor** | Velocidade máxima e aceleração |
| **Câmbio** | Número de marchas e aceleração |
| **Pneus** | Aderência nas curvas |
| **Chassi/aerodinâmica** | Aderência, resistência a dano e peso (aceleração) |

- **Em aberto:** quantos níveis por categoria, preços, nomes e se é preciso comprar os níveis em ordem. Placeholder de MVP: 4 níveis por categoria, todos à venda desde o início, sendo o nível 1 a peça que o carro já tem. Os nomes abaixo seguem a evolução real da F1 nos anos 60, mas são candidatos, não aprovados:

| Categoria | Nível 1 (inicial) | Nível 2 | Nível 3 | Nível 4 |
|---|---|---|---|---|
| Motor | 4 cilindros 1.5 L | V8 1.5 L (+25 km/h, $4.500) | V12 3.0 L (+55 km/h, gasta 25% mais, $12.000) | V8 3.0 L de corrida (+70 km/h, $25.000) |
| Câmbio | 4 marchas | 5 marchas ($3.000) | 5 marchas de relação curta ($8.000) | 6 marchas ($16.000) |
| Pneus | Estreitos com sulco | Largos de borracha macia ($3.500) | Largos de composto de corrida ($9.000) | Lisos/slick ($18.000) |
| Chassi/aero | Tubular | Tubular leve ($4.000) | Monocoque ($10.000) | Monocoque com aerofólio (−5 km/h por arrasto, $20.000) |

- Notas de época para a discussão: o monocoque estreou na F1 em 1962 (Lotus 25), os aerofólios em 1968 e os pneus slick só em 1971 — o nível 4 de pneus seria um anacronismo.
- **Em aberto:** se peças mais fortes têm desvantagens (o placeholder já usa duas: o V12 gasta mais e o aerofólio perde velocidade final; pneus mais macios gastam mais rápido).
- **Em aberto:** se dá para vender peças.
- **Em aberto:** se a peça instalada muda a aparência do carro (ex.: aerofólio visível no sprite).

## 7. Adversários

- **Definido:** grid com **8 a 10 carros** controlados pelo computador. **Em aberto:** o número exato. Placeholder de MVP: 9 adversários (grid de 10).
- **Definido (consequência do pilar):** no começo da temporada, o carro do jogador é o mais fraco; os adversários são mais rápidos que o carro inicial e mais lentos que um carro com todas as peças no máximo.
- **Em aberto:** equipes e pilotos fictícios ou inspirados nos reais da época. Nomes de placeholder do guia Unity: fictícios.
- **Em aberto:** se os adversários evoluem durante a temporada.
- **Em aberto:** se os adversários batem, quebram ou abandonam.
- **Em aberto:** comportamento da IA além do básico (manter velocidade, frear nas curvas, desviar de carros mais lentos). Placeholder de MVP: cada equipe tem velocidade máxima e aceleração próprias; a IA freia nas curvas e desvia de quem está mais lento à frente.

## 8. Pistas

- **Definido:** 8 a 10 pistas na primeira temporada jogável.
- **Definido:** cada pista é um circuito fechado, com curvas, subidas e descidas, objetos na beira da pista, cenário de fundo próprio e uma reta de largada com entrada de box.
- **Em aberto:** pistas reais (Mônaco, Monza, Spa...) ou fictícias inspiradas nelas. Pistas reais podem exigir licença de nome e traçado, o que pesa a favor de pistas fictícias.
- **Em aberto:** quais pistas. Candidatos para discussão (países do calendário real da F1 nos anos 60, não aprovados):

| # | Tema candidato | Destaque visual/jogável |
|---|---|---|
| 1 | Campo inglês | Retas longas, fardos de feno, céu nublado |
| 2 | Rua à beira-mar (estilo Mônaco) | Curvas fechadas, muros, iates no fundo |
| 3 | Autódromo italiano (estilo Monza) | Velocidade máxima, poucas curvas |
| 4 | Floresta alemã (estilo Nürburgring) | Muitas subidas e descidas |
| 5 | Estrada belga (estilo Spa) | Curvas rápidas, possível chuva |
| 6 | Dunas holandesas (estilo Zandvoort) | Areia na beira, vento |
| 7 | Estrada francesa (estilo Reims) | Retas de estrada pública, trigais |
| 8 | Norte dos EUA (estilo Watkins Glen) | Outono, árvores laranja |
| 9 | México | Altitude, arquibancadas coloridas |
| 10 | África do Sul (estilo East London) | Final da temporada, sol forte |

- **Em aberto:** clima (chuva) e corridas noturnas.

## 9. Estilo Visual

- **Definido:** **pixel art**, gerada no **PixelLab**.
- **Definido:** tema F1 dos anos 60: carros-charuto com motor na traseira, rodas expostas, pilotos de capacete aberto e óculos.
- **Definido (consequência da câmera, §1):** os carros (jogador e adversários) são vistos **de trás**, com quadros de "reto", "virando à esquerda" e "virando à direita". O cenário é feito de sprites independentes (árvores, placas, arquibancadas) e camadas de fundo com rolagem lateral (parallax).
- **Em aberto:** resolução da arte. Placeholder de MVP do guia Unity: tela de 320×180 pixels ampliada sem suavizar (16:9, próximo dos 256×224 do SNES).
- **Em aberto:** imagem de referência de estilo. O fluxo do estúdio no PixelLab funciona melhor a partir de uma imagem de exemplo do que de texto (Parte 13). Falta escolher essa imagem e colocá-la em `Sprites/CharutoRacer/example/`.
- **Em aberto:** cores das equipes. Candidato para discussão: as cores nacionais de corrida da época (verde britânico, vermelho italiano, azul francês, prata alemão, branco e vermelho japonês, branco e azul americano).
- **Em aberto:** se o carro do jogador tem cor/pintura personalizável.

## 10. HUD / UI

### 10.1 Durante a corrida

- **Definido (consequência dos sistemas acima):** o HUD precisa mostrar velocidade, marcha (e se o câmbio é automático ou manual), conta-giros, volta atual/total, posição, combustível, cargas de nitro restantes, desgaste dos pneus e dano.
- **Definido:** a contagem regressiva da largada e os avisos (box, sem combustível, carro quebrado) aparecem no centro da tela.
- **Em aberto:** mini-mapa da pista; distância para o carro da frente e de trás; layout do HUD.

### 10.2 Telas fora da corrida

- **Definido:** Garagem (dinheiro, próxima pista, classificação, loja de peças, conserto, opção de câmbio) e tela de resultado da corrida.
- **Em aberto:** menu principal, tela de opções, tela de campeão.

## 11. Áudio

- **Em aberto:** direção sonora. Pontos a decidir: ronco do motor acompanhando o conta-giros (o som é importante para saber a hora de trocar de marcha no câmbio manual), trilha sonora no estilo chiptune/16 bits como o Top Gear, sons de batida, de pit stop e de largada.

## 12. Backend / Persistência

- **Definido:** jogo **offline**, sem backend, sem login e sem leaderboard online.
- **Definido:** progresso salvo localmente (dinheiro, peças compradas e instaladas, dano, GP atual, classificação do campeonato, opção de câmbio).
- **Em aberto:** vários slots de save; recorde de volta por pista (local).

## 13. Escopo do MVP

**Dentro do MVP:**

- Estrada pseudo-3D com curvas, subidas e descidas, objetos na beira da pista e fundo com parallax.
- Pilotagem com câmbio manual e automático, força centrífuga, perda de velocidade fora da pista.
- Nitro limitado, combustível, pit stop (abastece e troca pneus), desgaste de pneus, dano por batida.
- 8 a 10 adversários com IA simples.
- Uma temporada de 8 a 10 pistas, com pontos e prêmio em dinheiro por posição.
- Garagem com as 4 categorias de peças, conserto de dano e escolha de câmbio.
- Save local.
- Toda a arte final em pixel art do PixelLab.

**Fora do MVP (pós-MVP ou Em aberto):**

- Multiplayer local em tela dividida (o Top Gear tinha; **Em aberto** se entra no jogo).
- Chuva e clima.
- Várias temporadas, evolução dos adversários, treino classificatório.
- Leaderboard online.
- Personalização visual do carro.

## 14. Em aberto (consolidado)

- Plataforma de distribuição (§1).
- Remapeamento de teclas (§3.1).
- Vantagem do câmbio manual; dano por trocar marcha errado (§3.2).
- Áreas de escape sem dano (§3.4).
- Posição de largada do jogador, formato do grid, número de voltas, treino classificatório (§4.1).
- Cargas e duração do nitro, consumo extra, compra de nitro, nome de época (§4.2).
- Tamanho do tanque, conserto no box, tanque inicial, IA no box (§4.3).
- Desgaste de pneus entre corridas (§4.4).
- Efeito de 100% de dano; dano por componente (§4.5).
- Prêmio e pontos por abandono (§4.6).
- Número exato de pistas, tabela de pontos, desempate (§5).
- Fim de temporada (§5.3).
- Valores de prêmio, outras rendas, moeda (§6.1).
- Níveis, preços, nomes e ordem de compra das peças; desvantagens; venda; peças visíveis no carro (§6.2).
- Número exato de adversários, nomes, evolução, abandono, IA (§7).
- Pistas reais ou fictícias; quais pistas; clima (§8).
- Resolução da arte, imagem de referência do PixelLab, cores das equipes, personalização (§9).
- Mini-mapa e layout do HUD; menu principal, opções, tela de campeão (§10).
- Toda a direção de áudio (§11).
- Slots de save, recorde de volta (§12).
- Tela dividida para 2 jogadores (§13).

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para implementar o MVP do Charuto Racer em Unity 6. Ele começa num projeto vazio e termina num build de PC com temporada, garagem e corrida. Os números do código são os placeholders da Parte 1; todos ficam no asset `GameConfig` para balancear sem mexer em código.

## Convenções

- **Unidades do mundo:** 1 unidade = 1 cm. A pista é dividida em **segmentos** de 2 m (200 unidades). Velocidades ficam em km/h nos dados e são convertidas com `GameConfig.KmhToUnits`.
- **Tela:** a arte é desenhada numa tela de **320×180 pixels**, ampliada sem suavização pelo `Pixel Perfect Camera`. A câmera ortográfica mostra exatamente essa área: 1 unidade da cena = 1 pixel da arte. O canto inferior esquerdo da tela é (0, 0).
- **Sem física do Unity:** a estrada pseudo-3D não é uma cena 3D, então nada usa `Rigidbody`/`Collider`. Posição, velocidade e colisões são calculadas pelos nossos scripts. Por isso, este guia não precisa da nota `rb.linearVelocity`/`rb.velocity`.
- **Pastas:** tudo do jogo fica em `Assets/_Project/`.
- **Cenas:** `Garagem` (menu, loja, campeonato) e `Corrida`.
- **Comentários:** cada classe e método tem comentários `// POR QUE:` (motivo de existir) e `// ESTRATÉGIA:` (como funciona), e conceitos do Unity são explicados na primeira vez que aparecem.

## Arquitetura em uma página

A técnica da estrada é a clássica dos jogos de corrida de 16 bits (popularizada pelo tutorial "Javascript Racer", de Jake Gordon): a pista é uma lista de segmentos com curva e altura; a cada quadro, os segmentos à frente da câmera são **projetados** na tela (quanto mais longe, menor e mais perto do horizonte) e desenhados como faixas coloridas, de perto para longe. As curvas não existem de verdade no mundo: cada segmento só desloca para o lado o desenho dos segmentos seguintes, acumulando o efeito.

| Pasta | Scripts | Papel | Fase |
|---|---|---|---|
| `Data` | `GameConfig`, `PartDefinition`, `CarStats`, `TrackDefinition`, `TeamDefinition`, `SeasonDefinition` | Dados editáveis no Inspector | 1 |
| `Road` | `RoadSegment`, `Track`, `RoadRenderer`, `ParallaxBackground`, `RoadTestDriver`, shader `PixelUnlit` | Montar e desenhar a estrada | 2 |
| `Car` | `CarInput`, `RaceCar`, `CarCondition`, `PlayerCarController` | Carro do jogador | 3 |
| `Road` | `RoadSpriteRenderer` | Desenhar objetos e carros escalados | 3 |
| `Race` | `SoloTestRace` (temporário) | Testar o carro sozinho | 3 |
| `Race` | `CollisionSystem` | Batidas e dano | 4 |
| `Car`/`Race` | `AICarController`, `RaceDirector`, `RaceSetup`, `RaceResultEntry` | Adversários, largada, voltas, posições | 5 |
| `Race` | `PitStopController` | Box | 6 |
| `UI` | `RaceHUD` | HUD e resultado | 7 |
| `Season` | `SaveData`, `SaveSystem`, `GameSession`, `RaceResultsBridge` | Campeonato, dinheiro, save | 8 |
| `UI` | `GarageScreen`, `PartRow` | Garagem e loja | 9 |
| `Editor` | `PixelArtImporter`, `PlaceholderSpriteMaker` | Importação de pixel art e sprites provisórios | 0 |

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D com a câmera em pixel art de 320×180, as pastas criadas, a importação de pixel art automática e sprites provisórios para testar as próximas fases.

### 0.1 Criar o projeto

1. Instale o **Unity Hub** e o **Unity 6** (6000.x LTS) com o módulo **Windows Build Support (IL2CPP)**. Se você estiver num Mac, instale o módulo do Mac.
2. No Unity Hub: **New project → Universal 2D** (o template 2D com URP). Nome: `CharutoRacer`.
3. Em versões 2023.x/2022 LTS o template se chama **2D (URP)**. O guia funciona nelas também.

### 0.2 Estrutura de pastas

Crie em `Assets/`:

```
Assets/_Project/
  Art/
    Placeholder/      ← sprites provisórios (0.5)
    Cars/             ← carros do PixelLab (Fase 10)
    Roadside/         ← objetos da beira da pista
    Backgrounds/      ← camadas de fundo por pista
    UI/               ← ícones de peças, HUD
  Data/
    Parts/  Teams/  Tracks/
  Materials/
  Prefabs/
  Scenes/
  Scripts/
    Data/  Road/  Car/  Race/  Season/  UI/  Editor/
  Shaders/
```

### 0.3 Pacotes e configurações

1. **Window → Package Manager**: confirme que estão instalados **Input System**, **2D Pixel Perfect** (vem com o template 2D, faz parte do URP) e **uGUI** (já inclui o TextMeshPro no Unity 6).
2. **Edit → Project Settings → Player → Other Settings → Active Input Handling**: `Input System Package (New)`. Se o Unity pedir para reiniciar, aceite.
3. **Project Settings → Quality**: desligue **Anti Aliasing**. Pixel art não pode ser suavizada.
4. Na primeira vez que um texto TextMeshPro aparecer, o Unity pede para importar o **TMP Essentials**: aceite.

### 0.4 Câmera e cena de corrida

1. Crie a cena `Assets/_Project/Scenes/Corrida.unity` e abra.
2. Selecione a **Main Camera**:
   - **Projection:** Orthographic. **Position:** (160, 90, −10). Assim, a câmera mostra o retângulo de (0, 0) a (320, 180).
   - **Background Type:** Solid Color (a cor do céu é trocada por pista na Fase 2).
   - **Add Component → Pixel Perfect Camera**: **Assets Pixels Per Unit = 1**, **Reference Resolution = 320 × 180**, **Grid Snapping = Upscale Render Texture**, **Crop Frame = None**.
3. Crie a cena `Garagem.unity` (vazia por enquanto) e adicione as duas em **File → Build Profiles** (ou **Build Settings**) nesta ordem: `Garagem`, `Corrida`.

### 0.5 Importação de pixel art e sprites provisórios

O script abaixo configura sozinho toda imagem colocada em `Assets/_Project/Art/`. Assim, a arte do PixelLab (Fase 10) entra pronta.

```csharp
// Caminho: Assets/_Project/Scripts/Editor/PixelArtImporter.cs
using UnityEditor;
using UnityEngine;

// POR QUE: pixel art precisa de configurações de importação bem específicas
// (sem filtro, sem compressão, 1 pixel = 1 unidade). Fazer isso à mão em cada
// imagem é fácil de esquecer, e um sprite esquecido aparece borrado.
// ESTRATÉGIA: um AssetPostprocessor é uma classe de Editor que o Unity chama
// sempre que importa um arquivo. Aqui ele age só nas texturas dentro de
// Assets/_Project/Art/ e aplica as mesmas regras em todas.
// Scripts dentro de uma pasta chamada "Editor" só existem no Editor e nunca
// vão para o build.
public class PixelArtImporter : AssetPostprocessor
{
    const string ArtRoot = "Assets/_Project/Art/";

    // Chamado pelo Unity antes de importar uma textura.
    void OnPreprocessTexture()
    {
        if (!assetPath.StartsWith(ArtRoot)) return;

        var importer = (TextureImporter)assetImporter;
        importer.textureType = TextureImporterType.Sprite;
        importer.spriteImportMode = SpriteImportMode.Single;
        importer.spritePixelsPerUnit = 1;            // 1 pixel da arte = 1 unidade da cena
        importer.filterMode = FilterMode.Point;      // sem suavizar: pixels nítidos
        importer.textureCompression = TextureImporterCompression.Uncompressed;
        importer.mipmapEnabled = false;
        importer.alphaIsTransparency = true;

        // O pivô (ponto de apoio) dos objetos da estrada fica embaixo, no centro:
        // assim o sprite "pisa" no chão no ponto calculado pela projeção.
        // Ícones de UI ficam com o pivô no centro.
        var settings = new TextureImporterSettings();
        importer.ReadTextureSettings(settings);
        settings.spriteAlignment = assetPath.Contains("/UI/")
            ? (int)SpriteAlignment.Center
            : (int)SpriteAlignment.BottomCenter;
        // Full Rect permite repetir o sprite lado a lado (usado nos fundos).
        settings.spriteMeshType = SpriteMeshType.FullRect;
        importer.SetTextureSettings(settings);
    }
}
```

Os sprites provisórios são retângulos coloridos gerados por código. Eles permitem testar todas as fases antes da arte final.

```csharp
// Caminho: Assets/_Project/Scripts/Editor/PlaceholderSpriteMaker.cs
using System.IO;
using UnityEditor;
using UnityEngine;

// POR QUE: as Fases 2 a 9 precisam de algum sprite de carro, árvore e fundo
// para testar. Esperar a arte final travaria tudo.
// ESTRATÉGIA: um item de menu desenha PNGs simples pixel a pixel e salva em
// Art/Placeholder. O PixelArtImporter (acima) configura a importação deles.
public static class PlaceholderSpriteMaker
{
    const string Folder = "Assets/_Project/Art/Placeholder";

    // [MenuItem] cria um item na barra de menus do Editor.
    [MenuItem("Charuto Racer/Criar sprites provisórios")]
    static void CreateAll()
    {
        Directory.CreateDirectory(Folder);
        // Carro visto de trás: branco, para ser tingido com a cor de cada equipe.
        Save("Car_Straight", DrawCar(0));
        Save("Car_Left", DrawCar(-1));
        Save("Car_Right", DrawCar(1));
        Save("Tree", DrawBlock(28, 64, new Color32(40, 120, 50, 255), 8, new Color32(90, 60, 30, 255)));
        Save("Sign", DrawBlock(32, 24, new Color32(230, 200, 40, 255), 0, default));
        Save("HayBale", DrawBlock(24, 12, new Color32(210, 180, 90, 255), 0, default));
        Save("Bg_Far", DrawHills(384, 70, new Color32(120, 140, 170, 255), 0.03f, 30));
        Save("Bg_Near", DrawHills(384, 45, new Color32(70, 110, 70, 255), 0.07f, 18));
        AssetDatabase.Refresh();
        Debug.Log("Charuto Racer: sprites provisórios criados em " + Folder);
    }

    // Carro de 48x28: corpo branco, 4 rodas pretas. "lean" desloca o corpo
    // 2 pixels para o lado, para os quadros de curva serem diferentes do reto.
    static Texture2D DrawCar(int lean)
    {
        var tex = NewTexture(48, 28);
        Fill(tex, 0, 0, 10, 12, Color.black);   // roda traseira esquerda
        Fill(tex, 38, 0, 10, 12, Color.black);  // roda traseira direita
        Fill(tex, 4, 18, 8, 9, Color.black);    // roda dianteira esquerda
        Fill(tex, 36, 18, 8, 9, Color.black);   // roda dianteira direita
        Fill(tex, 12 + lean * 2, 2, 24, 22, Color.white); // corpo
        Fill(tex, 20 + lean * 2, 16, 8, 8, new Color32(60, 60, 60, 255)); // capacete
        return tex;
    }

    // Retângulo com um "tronco" opcional embaixo (usado na árvore).
    static Texture2D DrawBlock(int w, int h, Color32 color, int trunk, Color32 trunkColor)
    {
        var tex = NewTexture(w, h);
        if (trunk > 0) Fill(tex, w / 2 - 3, 0, 6, trunk, trunkColor);
        Fill(tex, 0, trunk, w, h - trunk, color);
        return tex;
    }

    // Silhueta de morros: cada coluna tem uma altura dada por uma onda (seno).
    static Texture2D DrawHills(int w, int h, Color32 color, float frequency, int amplitude)
    {
        var tex = NewTexture(w, h);
        for (int x = 0; x < w; x++)
        {
            // A onda completa um número inteiro de ciclos na largura, para
            // a emenda ficar invisível quando o fundo se repetir.
            float cycles = Mathf.Round(w * frequency / (2f * Mathf.PI));
            float wave = Mathf.Sin(x / (float)w * cycles * 2f * Mathf.PI);
            // Altura da coluna entre (h - amplitude) e h.
            int top = Mathf.RoundToInt(h - amplitude + (wave + 1f) * 0.5f * amplitude);
            Fill(tex, x, 0, 1, Mathf.Clamp(top, 1, h), color);
        }
        return tex;
    }

    static Texture2D NewTexture(int w, int h)
    {
        var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
        var clear = new Color32[w * h]; // tudo transparente
        tex.SetPixels32(clear);
        return tex;
    }

    static void Fill(Texture2D tex, int x, int y, int w, int h, Color32 color)
    {
        for (int i = x; i < x + w; i++)
            for (int j = y; j < y + h; j++)
                if (i >= 0 && j >= 0 && i < tex.width && j < tex.height)
                    tex.SetPixel(i, j, color);
    }

    static void Save(string name, Texture2D tex)
    {
        File.WriteAllBytes($"{Folder}/{name}.png", tex.EncodeToPNG());
        Object.DestroyImmediate(tex);
    }
}
```

Na barra de menus, clique em **Charuto Racer → Criar sprites provisórios**.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- `Assets/_Project/Art/Placeholder/` tem 8 PNGs. Ao selecionar `Car_Straight`, o Inspector mostra **Sprite (2D and UI)**, **Pixels Per Unit = 1**, **Filter Mode = Point**, **Pivot = Bottom**.
- A câmera da cena `Corrida` tem o `Pixel Perfect Camera` e, no Play Mode, a janela Game mostra só a cor de fundo.

#### Problemas comuns
- **O menu "Charuto Racer" não aparece:** o script não está numa pasta `Editor`, ou há erro de compilação no Console. Corrija o erro e espere o Unity recompilar.
- **Sprites provisórios borrados ou com PPU 100:** foram importados antes de o `PixelArtImporter` existir. Clique com o botão direito em `Art/Placeholder` → **Reimport**.

Próxima fase: **Dados e Configuração** — os ScriptableObjects com os números do jogo, as peças, as equipes e a pista de teste.

---

# Parte 4 — Implementação Unity: Fase 1 (Dados e Configuração)

## Fase 1 — Dados e Configuração

> Objetivo desta fase: todos os dados do jogo (ajustes, peças, equipes, pistas, temporada) existem como assets editáveis no Inspector.

### 1.1 `PartDefinition` e `CarStats`

```csharp
// Caminho: Assets/_Project/Scripts/Data/PartDefinition.cs
using UnityEngine;

// As 4 categorias de peça da Parte 1 §6.2. A ordem importa: o save guarda
// a peça instalada de cada categoria num array indexado por este enum.
public enum PartCategory { Motor = 0, Cambio = 1, Pneus = 2, Chassi = 3 }

// POR QUE: cada peça da loja é um asset próprio, para criar, renomear e
// balancear peças no Inspector sem tocar em código.
// ESTRATÉGIA: a peça só guarda bônus. Quem soma tudo e gera os números finais
// do carro é o CarStats (abaixo).
[CreateAssetMenu(menuName = "Charuto Racer/Peça", fileName = "Part_")]
public class PartDefinition : ScriptableObject
{
    [Tooltip("Identificador único e fixo. É o que vai no save; não mude depois de lançar.")]
    public string id;
    public string displayName;
    [TextArea] public string description;
    public PartCategory category;
    [Min(1)] public int tier = 1;
    [Tooltip("Preço na loja. Peças de preço 0 e nível 1 são o carro inicial.")]
    [Min(0)] public int price;
    public Sprite icon;

    [Header("Bônus somados ao carro base")]
    public float maxSpeedBonusKmh;
    public float accelerationBonusKmh;
    public float gripBonus;
    [Range(0, 0.8f)] public float durabilityBonus;

    [Header("Multiplicadores (1 = sem efeito)")]
    public float fuelConsumptionMultiplier = 1f;
    public float tireWearMultiplier = 1f;

    [Header("Só câmbio")]
    [Tooltip("Número de marchas. 0 = esta peça não muda as marchas.")]
    public int gearCount;
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/CarStats.cs
using System.Collections.Generic;
using UnityEngine;

// POR QUE: o carro do jogador precisa de números finais (velocidade máxima,
// aceleração, aderência...) que dependem das peças instaladas. Calcular isso
// num lugar só evita que a garagem e a corrida mostrem valores diferentes.
// ESTRATÉGIA: struct simples. Build() começa no carro base do GameConfig e
// aplica as peças: bônus são somados, multiplicadores são multiplicados.
[System.Serializable]
public struct CarStats
{
    public float maxSpeedKmh;
    public float accelerationKmh;   // km/h ganhos por segundo, no ponto ideal da rotação
    public float grip;              // 0..1: resistência à força centrífuga
    public float durability;        // 0..0.8: fração do dano que é ignorada
    public float fuelConsumption;   // multiplicador do consumo
    public float tireWear;          // multiplicador do desgaste
    public int gearCount;

    // Monta os números finais a partir do carro base e das peças instaladas.
    public static CarStats Build(GameConfig config, IEnumerable<PartDefinition> parts)
    {
        var stats = new CarStats
        {
            maxSpeedKmh = config.baseMaxSpeedKmh,
            accelerationKmh = config.baseAccelerationKmh,
            grip = config.baseGrip,
            durability = 0f,
            fuelConsumption = 1f,
            tireWear = 1f,
            gearCount = config.baseGearCount,
        };

        foreach (var part in parts)
        {
            if (part == null) continue;
            stats.maxSpeedKmh += part.maxSpeedBonusKmh;
            stats.accelerationKmh += part.accelerationBonusKmh;
            stats.grip += part.gripBonus;
            stats.durability += part.durabilityBonus;
            stats.fuelConsumption *= part.fuelConsumptionMultiplier;
            stats.tireWear *= part.tireWearMultiplier;
            if (part.gearCount > 0) stats.gearCount = part.gearCount;
        }

        stats.grip = Mathf.Clamp01(stats.grip);
        stats.durability = Mathf.Clamp(stats.durability, 0f, 0.8f);
        stats.gearCount = Mathf.Max(1, stats.gearCount);
        return stats;
    }
}
```

### 1.2 `TrackDefinition`

```csharp
// Caminho: Assets/_Project/Scripts/Data/TrackDefinition.cs
using System.Collections.Generic;
using UnityEngine;

// POR QUE: o traçado de uma pista é descrito por trechos ("entra numa curva
// para a direita, segura, sai; depois sobe um morro"), não por coordenadas.
// É assim que os jogos de estrada pseudo-3D desenham pistas, e fica fácil de
// editar no Inspector.
// ESTRATÉGIA: [System.Serializable] faz o Unity mostrar e salvar esta classe
// dentro de outro asset. Cada trecho tem três partes, medidas em segmentos
// (1 segmento = 2 m): entrada (a curva/morro aumenta aos poucos), meio
// (constante) e saída (volta ao reto/plano).
[System.Serializable]
public class TrackSection
{
    [Min(0)] public int enter = 25;
    [Min(0)] public int hold = 50;
    [Min(0)] public int leave = 25;
    [Tooltip("Negativo = esquerda, positivo = direita. 2 suave, 4 média, 6 fechada.")]
    [Range(-6f, 6f)] public float curve;
    [Tooltip("Quanto a pista sobe (+) ou desce (-) ao longo do trecho, em segmentos de altura. 20 baixo, 40 médio, 60 alto.")]
    [Range(-60f, 60f)] public float hill;
}

// Uma fileira de objetos repetidos na beira da pista (árvores, placas...).
[System.Serializable]
public class RoadsidePlacement
{
    public Sprite sprite;
    [Tooltip("Largura do objeto no mundo, em cm.")]
    public float worldWidth = 300f;
    [Tooltip("Posição lateral do centro do objeto. -1 e 1 são as bordas do asfalto.")]
    public float offset = -1.6f;
    public int firstSegment = 10;
    [Min(1)] public int every = 20;
    [Min(1)] public int count = 10;
    [Tooltip("Coloca uma cópia espelhada do outro lado da pista.")]
    public bool mirror;
    [Tooltip("Bater neste objeto causa dano.")]
    public bool collides = true;
}

// Cores da estrada. Cada pista tem a sua (grama do campo, areia da praia...).
[System.Serializable]
public class TrackPalette
{
    public Color sky = new Color32(114, 215, 238, 255);
    public Color fog = new Color32(0, 81, 8, 255);
    public Color grassLight = new Color32(16, 170, 16, 255);
    public Color grassDark = new Color32(0, 154, 0, 255);
    public Color rumbleLight = new Color32(255, 255, 255, 255);
    public Color rumbleDark = new Color32(200, 30, 30, 255);
    public Color roadLight = new Color32(107, 107, 107, 255);
    public Color roadDark = new Color32(99, 99, 99, 255);
    public Color lane = new Color32(204, 204, 204, 255);
}

// POR QUE: uma pista da temporada. A Fase 2 transforma este asset numa lista
// de segmentos (classe Track).
[CreateAssetMenu(menuName = "Charuto Racer/Pista", fileName = "Track_")]
public class TrackDefinition : ScriptableObject
{
    public string displayName = "Pista";
    [Min(1)] public int laps = 5;
    public List<TrackSection> sections = new List<TrackSection>();
    public List<RoadsidePlacement> roadside = new List<RoadsidePlacement>();
    public TrackPalette palette = new TrackPalette();
    [Tooltip("Camadas de fundo, da mais distante para a mais próxima.")]
    public Sprite[] backgroundLayers;

    [Header("Box (pit lane), à direita da pista")]
    public int pitStartSegment = 5;
    public int pitEndSegment = 60;
}
```

### 1.3 `TeamDefinition` e `SeasonDefinition`

```csharp
// Caminho: Assets/_Project/Scripts/Data/TeamDefinition.cs
using UnityEngine;

// POR QUE: cada adversário do grid é uma equipe com piloto, cor, sprites e
// desempenho próprios (Parte 1 §7).
// ESTRATÉGIA: a IA (Fase 5) só precisa de velocidade máxima e aceleração;
// o resto é aparência.
[CreateAssetMenu(menuName = "Charuto Racer/Equipe", fileName = "Team_")]
public class TeamDefinition : ScriptableObject
{
    public string teamName;
    public string driverName;
    public Color color = Color.red;
    [Tooltip("Ligado para sprites brancos (provisórios): o carro é tingido com a cor da equipe.")]
    public bool tintSprite = true;
    public Sprite spriteStraight, spriteLeft, spriteRight;
    public float maxSpeedKmh = 200f;
    public float accelerationKmh = 38f;
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/SeasonDefinition.cs
using UnityEngine;

// POR QUE: a temporada é a lista ordenada de GPs e o grid de adversários.
[CreateAssetMenu(menuName = "Charuto Racer/Temporada", fileName = "Season_")]
public class SeasonDefinition : ScriptableObject
{
    public TrackDefinition[] tracks;
    public TeamDefinition[] rivals;
}
```

### 1.4 `GameConfig`

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameConfig.cs
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

// POR QUE: todos os números de ajuste (estrada, física, combustível, economia)
// ficam num único asset, para balancear no Inspector sem mexer em código.
// ESTRATÉGIA: ScriptableObject é um "arquivo de dados" do Unity: você cria uma
// instância em Assets (botão direito → Create) e arrasta para os componentes
// que precisam dela. Os valores são placeholders de MVP (Parte 1).
[CreateAssetMenu(menuName = "Charuto Racer/Game Config", fileName = "GameConfig")]
public class GameConfig : ScriptableObject
{
    // 1 unidade do mundo = 1 cm. km/h × este fator = unidades por segundo.
    public const float KmhToUnits = 100000f / 3600f;

    [Header("Tela (pixels da arte)")]
    public int screenWidth = 320;
    public int screenHeight = 180;

    [Header("Estrada")]
    public float segmentLength = 200f;
    [Tooltip("Quantos segmentos seguidos têm a mesma cor (zebra e faixas).")]
    public int rumbleLength = 3;
    [Tooltip("Meia largura do asfalto, em cm.")]
    public float roadWidth = 1200f;
    public int lanes = 3;
    public float fieldOfView = 100f;
    public float cameraHeight = 600f;
    public int drawDistance = 250;
    public float fogDensity = 3f;
    [Tooltip("Largura extra do asfalto do box, à direita, em meias larguras.")]
    public float pitLaneWidth = 0.6f;

    [Header("Carros na estrada")]
    public float carWorldWidth = 360f;
    public float carLength = 400f;
    public Sprite playerSpriteStraight, playerSpriteLeft, playerSpriteRight;
    public Color playerTint = new Color32(30, 90, 200, 255);
    public string playerName = "Você";

    [Header("Carro base (sem peças)")]
    public float baseMaxSpeedKmh = 180f;
    public float baseAccelerationKmh = 40f;
    [Range(0, 1)] public float baseGrip = 0.4f;
    public int baseGearCount = 4;

    [Header("Pilotagem")]
    public float brakingKmh = 120f;
    public float coastDecelKmh = 25f;
    public float offRoadDecelKmh = 90f;
    public float offRoadMaxSpeedKmh = 80f;
    public float steerSpeed = 2f;
    public float centrifugal = 0.3f;
    public float maxOffsetX = 2.5f;
    [Tooltip("Multiplica a aceleração com câmbio automático. 1 = sem diferença (Parte 1 §3.2, Em aberto).")]
    public float automaticAccelFactor = 1f;

    [Header("Combustível, pneus e nitro")]
    public float fuelCapacity = 100f;      // em %
    public float fuelPerKm = 7f;           // % por km
    public float tireWearPerKm = 0.04f;    // 0..1 por km
    public int nitroCharges = 3;
    public float nitroDuration = 4f;
    public float nitroSpeedBoost = 1.25f;
    public float nitroAccelBoost = 1.6f;

    [Header("Dano")]
    public float crashDamage = 12f;        // % numa batida em velocidade máxima
    public float carBumpDamage = 3f;
    [Range(0, 1)] public float crashSpeedFactor = 0.2f;
    [Range(0, 1)] public float damageSpeedPenalty = 0.35f;

    [Header("Pit stop")]
    public float pitEntryX = 1.05f;
    public float pitMaxEntryKmh = 90f;
    public float pitRefuelPerSecond = 25f;
    public float pitTireChangeSeconds = 3f;

    [Header("IA")]
    [Range(0, 1)] public float aiCurveSlowdown = 0.35f;

    [Header("Economia e campeonato")]
    public int startingMoney = 2000;
    public int[] prizeByPosition = { 5000, 3500, 2500, 1800, 1300, 1000, 800, 600, 500, 400 };
    public int[] pointsByPosition = { 9, 6, 4, 3, 2, 1 };
    public int repairCostPerPercent = 40;

    [Header("Conteúdo")]
    public SeasonDefinition season;
    public PartDefinition[] allParts;

    // "Profundidade" da câmera: converte o campo de visão no fator de escala
    // da projeção. Quanto maior o FOV, menor o valor.
    public float CameraDepth => 1f / Mathf.Tan(fieldOfView * 0.5f * Mathf.Deg2Rad);

    // Distância da câmera até o carro do jogador. Com este valor, o chão
    // embaixo do carro cai exatamente na borda de baixo da tela.
    public float PlayerZ => cameraHeight * CameraDepth;

    // Prêmio e pontos por posição (1 = primeiro). Fora da tabela = 0.
    public int PrizeFor(int position) =>
        position >= 1 && position <= prizeByPosition.Length ? prizeByPosition[position - 1] : 0;

    public int PointsFor(int position) =>
        position >= 1 && position <= pointsByPosition.Length ? pointsByPosition[position - 1] : 0;

    public PartDefinition FindPart(string id) =>
        string.IsNullOrEmpty(id) ? null : allParts.FirstOrDefault(p => p != null && p.id == id);

    // Peças do carro inicial: nível 1 de cada categoria.
    public IEnumerable<PartDefinition> StartingParts() =>
        allParts.Where(p => p != null && p.tier == 1);
}
```

### 1.5 Criar os assets

1. Em `Assets/_Project/Data/`: botão direito → **Create → Charuto Racer → Game Config**.
2. Em `Data/Parts/`: crie as 16 peças da tabela da Parte 1 §6.2 (4 por categoria). Para cada uma, preencha `id` (ex.: `motor_v8_15`), `displayName`, `category`, `tier` e `price`. Valores de bônus placeholder:

| Peça | Bônus |
|---|---|
| Motor 1 | nenhum |
| Motor 2 | +25 km/h, +5 acel. |
| Motor 3 | +55 km/h, +8 acel., consumo 1.25 |
| Motor 4 | +70 km/h, +15 acel., consumo 1.1 |
| Câmbio 1 | marchas 4 |
| Câmbio 2 | marchas 5, +4 acel. |
| Câmbio 3 | marchas 5, +8 acel. |
| Câmbio 4 | marchas 6, +10 acel., +5 km/h |
| Pneus 1 | nenhum |
| Pneus 2 | aderência +0.15, desgaste 1.1 |
| Pneus 3 | aderência +0.3, desgaste 1.2 |
| Pneus 4 | aderência +0.45, desgaste 1.4 |
| Chassi 1 | nenhum |
| Chassi 2 | +3 acel., aderência +0.05 |
| Chassi 3 | +5 acel., aderência +0.05, durabilidade 0.3 |
| Chassi 4 | −5 km/h, aderência +0.2, durabilidade 0.3 |

3. Em `Data/Teams/`: crie 9 equipes. Arraste `Car_Straight`, `Car_Left` e `Car_Right` (provisórios) para os sprites, deixe **Tint Sprite** ligado e dê uma cor a cada uma. Espalhe `maxSpeedKmh` entre 185 e 225 e `accelerationKmh` entre 34 e 44. Nomes de placeholder (fictícios): R. Hawthorne, G. Moretti, P. Duval, K. Brandt, A. Fonseca, T. Nakamura, S. van Dijk, M. Herrera, D. MacLeod.
4. Em `Data/Tracks/`: crie `Track_Teste` com uma pista curta para os testes. Exemplo de `sections`:

| # | enter | hold | leave | curve | hill |
|---|---|---|---|---|---|
| 1 | 0 | 80 | 0 | 0 | 0 |
| 2 | 25 | 50 | 25 | 3 | 0 |
| 3 | 25 | 25 | 25 | 0 | 30 |
| 4 | 25 | 50 | 25 | −5 | −30 |
| 5 | 25 | 40 | 25 | 4 | 20 |
| 6 | 25 | 60 | 25 | −2 | −20 |
| 7 | 0 | 60 | 0 | 0 | 0 |

   Em `roadside`, adicione uma fileira de `Tree` (`worldWidth` 400, `offset` −1.8, `every` 12, `count` 60, `mirror` ligado) e uma de `Sign` (`worldWidth` 350, `offset` 1.4, `every` 50, `count` 15). Em `backgroundLayers`, arraste `Bg_Far` e `Bg_Near`. Deixe o box em 5–60.
5. Crie `Season_1` com `Track_Teste` em `tracks` e as 9 equipes em `rivals`.
6. No `GameConfig`: arraste `Season_1` para `season`, as 16 peças para `allParts` e os 3 sprites de carro provisórios para `playerSprite...`.

### ✅ Checkpoint da Fase 1
- O menu **Create → Charuto Racer** mostra Game Config, Peça, Equipe, Pista e Temporada.
- O `GameConfig` tem a temporada e as 16 peças; existem 4 peças com `tier = 1` e `price = 0`.
- O Console não mostra erros.

#### Problemas comuns
- **Peça não aparece na loja depois (Fase 9):** ela não foi arrastada para `allParts` do `GameConfig`.
- **Duas peças com o mesmo `id`:** o save vai confundir as duas. Cada `id` precisa ser único.

Próxima fase: **Estrada Pseudo-3D** — desenhar a pista na tela com curvas, morros e fundo.

---

# Parte 5 — Implementação Unity: Fase 2 (Estrada Pseudo-3D)

## Fase 2 — Estrada Pseudo-3D

> Objetivo desta fase: ao dar Play, a câmera avança sozinha pela `Track_Teste`, com zebras, faixas, curvas, morros, neblina e fundo em parallax, e as setas movem a câmera para os lados.

### 2.1 `RoadSegment`

```csharp
// Caminho: Assets/_Project/Scripts/Road/RoadSegment.cs
using System.Collections.Generic;
using UnityEngine;

// Um ponto da pista depois de projetado na tela. y é medido de CIMA para
// baixo (como nos tutoriais clássicos); o RoadRenderer converte para o Unity.
public struct ProjectedPoint
{
    public float camZ;   // distância até a câmera
    public float scale;  // quanto o mundo encolhe a essa distância
    public float x, y;   // centro da pista na tela, em pixels
    public float w;      // meia largura da pista na tela, em pixels
}

// Um objeto parado na beira da pista (árvore, placa...).
public class RoadsideObject
{
    public Sprite sprite;
    public float offset;      // posição lateral; ±1 = borda do asfalto
    public float worldWidth;  // largura no mundo, em cm
    public bool collides;
}

// POR QUE: a pista é uma lista de fatias de 2 m. Cada fatia sabe sua altura,
// sua curva e o que há sobre ela (objetos, carros), e guarda o resultado da
// projeção do quadro atual para os sprites usarem.
// ESTRATÉGIA: classe C# comum (não MonoBehaviour), porque são milhares de
// segmentos e nenhum precisa de GameObject.
public class RoadSegment
{
    public int index;
    public float z1, z2;      // início e fim ao longo da pista
    public float y1, y2;      // altura no início e no fim
    public float curve;
    public bool dark;         // alterna as cores a cada rumbleLength segmentos
    public bool isPit;        // tem asfalto de box à direita

    public readonly List<RoadsideObject> objects = new List<RoadsideObject>();
    public readonly List<RaceCar> cars = new List<RaceCar>(); // só adversários

    // Preenchidos pelo RoadRenderer a cada quadro:
    public ProjectedPoint p1, p2;
    public float clipY;       // linha (de cima para baixo) que esconde o que está atrás de um morro
    public float fog;         // 0 = sem neblina, 1 = só neblina
}
```

`RaceCar` só é criado na Fase 3. Até lá, crie um arquivo provisório para o projeto compilar:

```csharp
// Caminho: Assets/_Project/Scripts/Car/RaceCar.cs (versão provisória; a Fase 3 substitui)
public class RaceCar { }
```

### 2.2 `Track`

```csharp
// Caminho: Assets/_Project/Scripts/Road/Track.cs
using System.Collections.Generic;
using UnityEngine;

// POR QUE: transforma o TrackDefinition (trechos legíveis) na lista de
// segmentos que o desenho e a física usam.
// ESTRATÉGIA: cada trecho vira entrada + meio + saída. A curva cresce na
// entrada (easing quadrático) e some na saída; a altura muda suavemente ao
// longo do trecho todo (easing senoidal). No fim, um trecho extra devolve a
// pista à altura 0, para a última fatia emendar com a primeira.
public class Track
{
    public readonly List<RoadSegment> Segments = new List<RoadSegment>();
    public readonly TrackDefinition Definition;
    public float SegmentLength { get; }
    public float Length => Segments.Count * SegmentLength;

    readonly int rumbleLength;

    public Track(TrackDefinition definition, GameConfig config)
    {
        Definition = definition;
        SegmentLength = config.segmentLength;
        rumbleLength = Mathf.Max(1, config.rumbleLength);

        foreach (var s in definition.sections)
            AddRoad(s.enter, s.hold, s.leave, s.curve, s.hill);

        // Fecha o circuito na altura 0.
        float back = -LastY / SegmentLength;
        if (Mathf.Abs(back) > 0.01f) AddRoad(25, 25, 25, 0f, back);

        for (int i = definition.pitStartSegment; i <= definition.pitEndSegment && i < Segments.Count; i++)
            if (i >= 0) Segments[i].isPit = true;

        foreach (var placement in definition.roadside)
            Place(placement);
    }

    // Altura do fim do último segmento criado.
    float LastY => Segments.Count == 0 ? 0f : Segments[Segments.Count - 1].y2;

    void AddSegment(float curve, float y)
    {
        int n = Segments.Count;
        Segments.Add(new RoadSegment
        {
            index = n,
            z1 = n * SegmentLength,
            z2 = (n + 1) * SegmentLength,
            y1 = LastY,
            y2 = y,
            curve = curve,
            dark = (n / rumbleLength) % 2 == 1,
        });
    }

    // Um trecho: entrada, meio e saída. hill é medido em "segmentos de altura".
    void AddRoad(int enter, int hold, int leave, float curve, float hill)
    {
        float startY = LastY;
        float endY = startY + hill * SegmentLength;
        float total = Mathf.Max(1, enter + hold + leave);

        for (int n = 0; n < enter; n++)
            AddSegment(EaseIn(0f, curve, n / (float)enter), EaseInOut(startY, endY, n / total));
        for (int n = 0; n < hold; n++)
            AddSegment(curve, EaseInOut(startY, endY, (enter + n) / total));
        for (int n = 0; n < leave; n++)
            AddSegment(EaseInOut(curve, 0f, n / (float)leave), EaseInOut(startY, endY, (enter + hold + n) / total));
    }

    void Place(RoadsidePlacement p)
    {
        if (p.sprite == null) return;
        for (int i = 0; i < p.count; i++)
        {
            int index = p.firstSegment + i * p.every;
            if (index < 0 || index >= Segments.Count) break;
            Segments[index].objects.Add(new RoadsideObject
                { sprite = p.sprite, offset = p.offset, worldWidth = p.worldWidth, collides = p.collides });
            if (p.mirror)
                Segments[index].objects.Add(new RoadsideObject
                    { sprite = p.sprite, offset = -p.offset, worldWidth = p.worldWidth, collides = p.collides });
        }
    }

    // Mantém uma posição dentro de 0..Length (a pista é um circuito).
    public float Wrap(float z)
    {
        z %= Length;
        return z < 0f ? z + Length : z;
    }

    public RoadSegment FindSegment(float z) =>
        Segments[Mathf.FloorToInt(Wrap(z) / SegmentLength) % Segments.Count];

    // Quanto do segmento atual já foi percorrido (0..1).
    public float PercentInSegment(float z) => (Wrap(z) % SegmentLength) / SegmentLength;

    // Altura da pista numa posição, interpolando dentro do segmento.
    public float HeightAt(float z)
    {
        var seg = FindSegment(z);
        return Mathf.Lerp(seg.y1, seg.y2, PercentInSegment(z));
    }

    static float EaseIn(float a, float b, float t) => a + (b - a) * t * t;
    static float EaseInOut(float a, float b, float t) => a + (b - a) * (-Mathf.Cos(t * Mathf.PI) / 2f + 0.5f);
}
```

### 2.3 Shader `PixelUnlit`

```hlsl
// Caminho: Assets/_Project/Shaders/PixelUnlit.shader
// POR QUE: a estrada e os sprites usam o mesmo shader simples, sem luz.
// Ele também sabe "cortar" tudo o que fica abaixo de uma linha (_ClipY),
// para esconder a parte de um carro que está atrás de um morro.
// ESTRATÉGIA: textura × cor do vértice (a estrada é colorida pelos vértices;
// o SpriteRenderer passa a cor dele como cor de vértice). Pixels abaixo de
// _ClipY (altura no mundo) são descartados.
Shader "CharutoRacer/PixelUnlit"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _ClipY ("Clip Y (mundo)", Float) = -100000
    }
    SubShader
    {
        Tags { "Queue"="Transparent" "RenderType"="Transparent" "IgnoreProjector"="True" }
        Blend SrcAlpha OneMinusSrcAlpha
        Cull Off
        ZWrite Off

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            sampler2D _MainTex;
            float _ClipY;

            struct appdata { float4 vertex : POSITION; float2 uv : TEXCOORD0; float4 color : COLOR; };
            struct v2f { float4 pos : SV_POSITION; float2 uv : TEXCOORD0; float4 color : COLOR; float worldY : TEXCOORD1; };

            v2f vert (appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                o.color = v.color;
                o.worldY = mul(unity_ObjectToWorld, v.vertex).y;
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                if (i.worldY < _ClipY) discard;
                fixed4 c = tex2D(_MainTex, i.uv) * i.color;
                if (c.a < 0.01) discard;
                return c;
            }
            ENDCG
        }
    }
}
```

Crie dois materiais em `Assets/_Project/Materials/` com esse shader: `M_Road` e `M_RoadSprite`.

### 2.4 `RoadRenderer`

```csharp
// Caminho: Assets/_Project/Scripts/Road/RoadRenderer.cs
using System.Collections.Generic;
using UnityEngine;

// POR QUE: é o coração visual do jogo. A cada quadro, desenha a pista à
// frente da câmera como faixas coloridas, do carro até o horizonte.
// ESTRATÉGIA (projeção pseudo-3D):
// 1. Para cada um dos próximos drawDistance segmentos, projeta o início (p1)
//    e o fim (p2) na tela: escala = profundidade / distância. Longe = pequeno
//    e perto do horizonte.
// 2. Curvas: x e dx acumulam a curva de cada segmento e deslocam para o lado
//    a câmera dos segmentos seguintes. É isso que entorta a estrada.
// 3. Morros: maxY guarda a linha mais alta já desenhada. Um segmento que
//    ficaria abaixo dela está escondido atrás de um morro e é pulado.
// 4. Cada segmento vira até 6 quadriláteros (grama, 2 zebras, asfalto,
//    faixas, box) num único Mesh, com a cor em cada vértice.
// Um Mesh é a malha de triângulos que a placa de vídeo desenha; o
// MeshFilter guarda a malha e o MeshRenderer a desenha com um material.
[RequireComponent(typeof(MeshFilter), typeof(MeshRenderer))]
public class RoadRenderer : MonoBehaviour
{
    [SerializeField] GameConfig config;
    [SerializeField] int sortingOrder = 0;

    readonly List<Vector3> vertices = new List<Vector3>();
    readonly List<Color32> colors = new List<Color32>();
    readonly List<int> triangles = new List<int>();
    Mesh mesh;
    Track track;
    TrackPalette palette;
    float halfWidth, height, depth;

    // Segmento onde a câmera está no quadro atual (o RoadSpriteRenderer usa).
    public RoadSegment BaseSegment { get; private set; }

    // Awake roda uma vez, quando o objeto é criado, antes de Start.
    void Awake()
    {
        mesh = new Mesh { name = "Road" };
        mesh.MarkDynamic(); // avisa o Unity que a malha muda todo quadro
        GetComponent<MeshFilter>().sharedMesh = mesh;
        GetComponent<MeshRenderer>().sortingOrder = sortingOrder;
    }

    // Troca a pista desenhada e a cor do céu.
    public void SetTrack(Track newTrack)
    {
        track = newTrack;
        palette = newTrack.Definition.palette;
        if (Camera.main != null) Camera.main.backgroundColor = palette.sky;
    }

    // cameraZ: posição da câmera na pista. playerX: posição lateral do
    // jogador (±1 = borda). A câmera fica sempre atrás do jogador.
    public void Render(float cameraZ, float playerX)
    {
        if (track == null) return;
        vertices.Clear(); colors.Clear(); triangles.Clear();

        halfWidth = config.screenWidth * 0.5f;
        height = config.screenHeight;
        depth = config.CameraDepth;

        BaseSegment = track.FindSegment(cameraZ);
        float basePercent = track.PercentInSegment(cameraZ);
        float cameraY = track.HeightAt(cameraZ + config.PlayerZ) + config.cameraHeight;
        float cameraX = playerX * config.roadWidth;

        float x = 0f;
        float dx = -BaseSegment.curve * basePercent;
        float maxY = height;
        int count = Mathf.Min(config.drawDistance, track.Segments.Count);

        for (int n = 0; n < count; n++)
        {
            var seg = track.Segments[(BaseSegment.index + n) % track.Segments.Count];
            // Segmentos depois da linha de chegada, vistos antes de cruzá-la,
            // estão "uma volta à frente": compensa o comprimento da pista.
            bool looped = seg.index < BaseSegment.index;
            float camZ = cameraZ - (looped ? track.Length : 0f);

            seg.clipY = maxY;
            seg.fog = 1f - Mathf.Exp(-Mathf.Pow(n / (float)count, 2f) * config.fogDensity);
            seg.p1 = Project(seg.y1, seg.z1, cameraX - x, cameraY, camZ);
            seg.p2 = Project(seg.y2, seg.z2, cameraX - x - dx, cameraY, camZ);
            x += dx;
            dx += seg.curve;

            bool behindCamera = seg.p1.camZ <= depth;
            bool backFacing = seg.p2.y >= seg.p1.y;  // descida vista de cima: fatia invertida
            bool hidden = seg.p2.y >= maxY;          // atrás de um morro
            if (behindCamera || backFacing || hidden) continue;

            DrawSegment(seg);
            maxY = seg.p2.y;
        }

        mesh.Clear();
        mesh.SetVertices(vertices);
        mesh.SetColors(colors);
        mesh.SetTriangles(triangles, 0);
        mesh.RecalculateBounds();
    }

    // Projeção de um ponto do centro da pista. Fórmula clássica: tudo é
    // dividido pela distância (camZ). x usa a meia largura da tela e y a meia
    // altura, como no Javascript Racer.
    ProjectedPoint Project(float worldY, float worldZ, float cameraX, float cameraY, float cameraZ)
    {
        var p = new ProjectedPoint { camZ = worldZ - cameraZ };
        p.scale = depth / p.camZ;
        p.x = Mathf.Round(halfWidth + p.scale * -cameraX * halfWidth);
        p.y = Mathf.Round(height * 0.5f - p.scale * (worldY - cameraY) * height * 0.5f);
        p.w = Mathf.Round(p.scale * config.roadWidth * halfWidth);
        return p;
    }

    void DrawSegment(RoadSegment s)
    {
        var p1 = s.p1; var p2 = s.p2;
        float screenW = config.screenWidth;
        int lanes = Mathf.Max(1, config.lanes);
        float r1 = p1.w / Mathf.Max(6, 2 * lanes), r2 = p2.w / Mathf.Max(6, 2 * lanes);

        // Grama: faixa da largura da tela inteira.
        Quad(0, p1.y, screenW, p1.y, screenW, p2.y, 0, p2.y, Shade(s.dark ? palette.grassDark : palette.grassLight, s));

        // Box: asfalto extra à direita, além da zebra.
        if (s.isPit)
        {
            float pw1 = p1.w * config.pitLaneWidth, pw2 = p2.w * config.pitLaneWidth;
            Quad(p1.x + p1.w, p1.y, p1.x + p1.w + r1 + pw1, p1.y, p2.x + p2.w + r2 + pw2, p2.y, p2.x + p2.w, p2.y,
                 Shade(palette.roadDark, s));
        }

        // Zebras (rumble strips) dos dois lados.
        var rumble = Shade(s.dark ? palette.rumbleDark : palette.rumbleLight, s);
        Quad(p1.x - p1.w - r1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - p2.w - r2, p2.y, rumble);
        Quad(p1.x + p1.w, p1.y, p1.x + p1.w + r1, p1.y, p2.x + p2.w + r2, p2.y, p2.x + p2.w, p2.y, rumble);

        // Asfalto.
        Quad(p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y,
             Shade(s.dark ? palette.roadDark : palette.roadLight, s));

        // Faixas tracejadas: só nos segmentos claros, o que cria o tracejado.
        if (!s.dark && lanes > 1)
        {
            float l1 = p1.w / Mathf.Max(32, 8 * lanes), l2 = p2.w / Mathf.Max(32, 8 * lanes);
            float laneW1 = p1.w * 2f / lanes, laneW2 = p2.w * 2f / lanes;
            float lx1 = p1.x - p1.w + laneW1, lx2 = p2.x - p2.w + laneW2;
            var laneColor = Shade(palette.lane, s);
            for (int lane = 1; lane < lanes; lane++, lx1 += laneW1, lx2 += laneW2)
                Quad(lx1 - l1 / 2, p1.y, lx1 + l1 / 2, p1.y, lx2 + l2 / 2, p2.y, lx2 - l2 / 2, p2.y, laneColor);
        }
    }

    // Mistura a cor com a neblina conforme a distância do segmento.
    Color32 Shade(Color c, RoadSegment s) => Color.Lerp(c, palette.fog, s.fog);

    // Adiciona um quadrilátero (dois triângulos). Recebe y de cima para baixo
    // e converte para o Unity, onde y cresce para cima.
    void Quad(float x1, float y1, float x2, float y2, float x3, float y3, float x4, float y4, Color32 color)
    {
        int i = vertices.Count;
        vertices.Add(new Vector3(x1, height - y1));
        vertices.Add(new Vector3(x2, height - y2));
        vertices.Add(new Vector3(x3, height - y3));
        vertices.Add(new Vector3(x4, height - y4));
        for (int k = 0; k < 4; k++) colors.Add(color);
        triangles.Add(i); triangles.Add(i + 1); triangles.Add(i + 2);
        triangles.Add(i); triangles.Add(i + 2); triangles.Add(i + 3);
    }
}
```

### 2.5 `ParallaxBackground`

```csharp
// Caminho: Assets/_Project/Scripts/Road/ParallaxBackground.cs
using UnityEngine;

// POR QUE: nas curvas, o fundo (morros, céu) precisa deslizar para o lado,
// senão a curva não "parece" curva. Camadas mais próximas deslizam mais
// rápido que as distantes (parallax), o que dá profundidade.
// ESTRATÉGIA: cada camada é um SpriteRenderer em modo Tiled (o sprite se
// repete lado a lado) com 3 vezes a largura do sprite. Mathf.Repeat mantém o
// deslocamento dentro de uma largura, então a emenda nunca aparece.
public class ParallaxBackground : MonoBehaviour
{
    [System.Serializable]
    public class Layer
    {
        public SpriteRenderer renderer;
        [Tooltip("Quanto a camada desliza nas curvas. Distante: pouco. Próxima: mais.")]
        public float curveSpeed = 40f;
        [Tooltip("Altura da base da camada na tela (pixels).")]
        public float baseY = 90f;
        [Tooltip("Quanto a camada desce quando o carro sobe um morro.")]
        public float heightSpeed = 0.002f;
    }

    [SerializeField] GameConfig config;
    [SerializeField] Layer[] layers;
    float offset;

    // Troca as imagens das camadas (cada pista tem seu fundo).
    public void SetSprites(Sprite[] sprites)
    {
        for (int i = 0; i < layers.Length; i++)
        {
            var r = layers[i].renderer;
            bool has = sprites != null && i < sprites.Length && sprites[i] != null;
            r.gameObject.SetActive(has);
            if (!has) continue;
            r.sprite = sprites[i];
            r.drawMode = SpriteDrawMode.Tiled;
            r.size = new Vector2(sprites[i].bounds.size.x * 3f, sprites[i].bounds.size.y);
        }
    }

    // curve: curva do segmento do jogador. speedPercent: 0..1. playerY: altura.
    public void Scroll(float curve, float speedPercent, float dt, float playerY)
    {
        offset += curve * speedPercent * dt;
        float center = config.screenWidth * 0.5f;
        foreach (var layer in layers)
        {
            if (layer.renderer.sprite == null || !layer.renderer.gameObject.activeSelf) continue;
            float w = layer.renderer.sprite.bounds.size.x;
            float x = center + Mathf.Repeat(-offset * layer.curveSpeed, w) - w * 0.5f;
            float y = layer.baseY - playerY * layer.heightSpeed;
            layer.renderer.transform.position = new Vector3(Mathf.Round(x), Mathf.Round(y), 0f);
        }
    }
}
```

### 2.6 `RoadTestDriver` (só para testar esta fase)

```csharp
// Caminho: Assets/_Project/Scripts/Road/RoadTestDriver.cs
using UnityEngine;
using UnityEngine.InputSystem;

// POR QUE: testar a estrada antes de existir carro. A câmera avança em
// velocidade constante e as setas a movem para os lados.
// ESTRATÉGIA: Update roda uma vez por quadro; Time.deltaTime é o tempo desde
// o último quadro, para o movimento não depender do FPS.
// Este script é apagado na Fase 3.
public class RoadTestDriver : MonoBehaviour
{
    [SerializeField] GameConfig config;
    [SerializeField] TrackDefinition trackDefinition;
    [SerializeField] RoadRenderer road;
    [SerializeField] ParallaxBackground background;
    [SerializeField] float speedKmh = 150f;

    Track track;
    float z, x;

    void Start()
    {
        track = new Track(trackDefinition, config);
        road.SetTrack(track);
        if (background != null) background.SetSprites(trackDefinition.backgroundLayers);
        Debug.Log($"Pista com {track.Segments.Count} segmentos ({track.Length / 100000f:0.00} km).");
    }

    void Update()
    {
        float steer = 0f;
        var kb = Keyboard.current;
        if (kb != null)
        {
            if (kb.leftArrowKey.isPressed) steer -= 1f;
            if (kb.rightArrowKey.isPressed) steer += 1f;
        }
        x = Mathf.Clamp(x + steer * Time.deltaTime, -2f, 2f);
        z = track.Wrap(z + speedKmh * GameConfig.KmhToUnits * Time.deltaTime);

        road.Render(z, x);
        if (background != null)
            background.Scroll(track.FindSegment(z + config.PlayerZ).curve, 1f, Time.deltaTime, track.HeightAt(z));
    }
}
```

### 2.7 Montar a cena

1. Na cena `Corrida`: **GameObject → Create Empty**, nome `Road`, posição (0, 0, 0). **Add Component → Mesh Filter**, **Mesh Renderer** (material `M_Road`) e **Road Renderer** (arraste o `GameConfig`).
2. Crie `Background` (posição 0, 0, 0) com dois filhos `Far` e `Near`, cada um com **Sprite Renderer** (Sorting Order −20 e −10). No `Background`, adicione **Parallax Background**: arraste o `GameConfig` e configure 2 camadas: `Far` (`curveSpeed` 20, `baseY` 90) e `Near` (`curveSpeed` 45, `baseY` 90).
3. Crie `RoadTest` com **Road Test Driver**: arraste `GameConfig`, `Track_Teste`, `Road` e `Background`.

### ✅ Checkpoint da Fase 2
- No Play, a estrada cinza com zebras vermelhas e brancas avança até o horizonte, a grama alterna dois verdes e a faixa central é tracejada.
- Nas curvas, a estrada se entorta e os morros do fundo deslizam para o lado; o morro mais próximo desliza mais.
- Nas subidas, o horizonte "fecha" e a estrada some atrás da crista; nas descidas, a pista reaparece lá embaixo.
- Ao longe, as cores se misturam com a cor da neblina.
- O Console mostra o comprimento da pista em km.

#### Problemas comuns
- **Tela só com a cor do céu:** o `Mesh Renderer` está sem material, ou o objeto `Road` não está em (0, 0, 0), ou a câmera não está em (160, 90, −10).
- **Estrada rosa (magenta):** o shader não compilou. Confira se o arquivo é `.shader` e se o Console aponta erro de sintaxe nele.
- **O fundo desliza para o lado errado nas curvas:** inverta o sinal de `curveSpeed` nas duas camadas.

Próxima fase: **Carro do Jogador e Sprites** — o carro com câmbio, nitro, combustível e pneus, e os objetos da pista desenhados em escala.

---

# Parte 6 — Implementação Unity: Fase 3 (Carro do Jogador e Sprites)

## Fase 3 — Carro do Jogador e Sprites

> Objetivo desta fase: o jogador pilota o carro com teclado ou controle, com marchas, força centrífuga, perda de velocidade na grama, nitro, combustível e desgaste de pneus; árvores e placas aparecem na beira da pista no tamanho certo e somem atrás dos morros.

### 3.1 `CarInput`

```csharp
// Caminho: Assets/_Project/Scripts/Car/CarInput.cs
using UnityEngine.InputSystem;

// POR QUE: junta num lugar só as teclas e os botões do controle (Parte 1
// §3.1). O resto do código só pergunta "está acelerando?", sem saber de
// teclas.
// ESTRATÉGIA: InputAction é o objeto do Input System que representa uma ação
// ("Acelerar") com várias ligações (bindings): teclas e botões. Criamos tudo
// por código para não precisar de um asset de Input Actions. Uma ação precisa
// ser habilitada (Enable) para começar a ler a entrada.
public class CarInput : System.IDisposable
{
    readonly InputAction accelerate, brake, steer, nitro, shiftUp, shiftDown;

    public CarInput()
    {
        accelerate = Button("Acelerar", "<Keyboard>/upArrow", "<Keyboard>/w", "<Gamepad>/buttonSouth", "<Gamepad>/rightTrigger");
        brake = Button("Frear", "<Keyboard>/downArrow", "<Keyboard>/s", "<Gamepad>/buttonWest", "<Gamepad>/leftTrigger");
        nitro = Button("Nitro", "<Keyboard>/space", "<Gamepad>/buttonNorth");
        shiftUp = Button("SubirMarcha", "<Keyboard>/e", "<Gamepad>/rightShoulder");
        shiftDown = Button("DescerMarcha", "<Keyboard>/q", "<Gamepad>/leftShoulder");

        // Eixo de -1 (esquerda) a 1 (direita). "1DAxis" junta duas teclas num eixo.
        steer = new InputAction("Virar", InputActionType.Value);
        steer.AddCompositeBinding("1DAxis").With("Negative", "<Keyboard>/leftArrow").With("Positive", "<Keyboard>/rightArrow");
        steer.AddCompositeBinding("1DAxis").With("Negative", "<Keyboard>/a").With("Positive", "<Keyboard>/d");
        steer.AddCompositeBinding("1DAxis").With("Negative", "<Gamepad>/dpad/left").With("Positive", "<Gamepad>/dpad/right");
        steer.AddBinding("<Gamepad>/leftStick/x");
    }

    static InputAction Button(string name, params string[] bindings)
    {
        var action = new InputAction(name, InputActionType.Button);
        foreach (var b in bindings) action.AddBinding(b);
        return action;
    }

    public void Enable()
    {
        accelerate.Enable(); brake.Enable(); steer.Enable();
        nitro.Enable(); shiftUp.Enable(); shiftDown.Enable();
    }

    // Libera as ações quando o carro deixa de existir (troca de cena).
    public void Dispose()
    {
        foreach (var a in new[] { accelerate, brake, steer, nitro, shiftUp, shiftDown })
        {
            a.Disable();
            a.Dispose();
        }
    }

    public bool Accelerate => accelerate.IsPressed();
    public bool Brake => brake.IsPressed();
    public float Steer => steer.ReadValue<float>();
    // WasPressedThisFrame: verdadeiro só no quadro em que o botão desceu.
    public bool NitroPressed => nitro.WasPressedThisFrame();
    public bool ShiftUpPressed => shiftUp.WasPressedThisFrame();
    public bool ShiftDownPressed => shiftDown.WasPressedThisFrame();
}
```

### 3.2 `RaceCar` e `CarCondition`

Substitua o `RaceCar.cs` provisório da Fase 2 por este:

```csharp
// Caminho: Assets/_Project/Scripts/Car/RaceCar.cs
using UnityEngine;

// POR QUE: o que todo carro na pista tem em comum, seja o do jogador ou um
// adversário: posição, velocidade, voltas e aparência. Quem decide como o
// carro anda são os controladores (PlayerCarController, AICarController).
// ESTRATÉGIA: classe C# comum. z é a distância percorrida dentro da volta
// (0..comprimento da pista); x é a posição lateral (±1 = borda do asfalto).
public class RaceCar
{
    public string driverName;
    public bool isPlayer;
    public Sprite spriteStraight, spriteLeft, spriteRight;
    public Color tint = Color.white;

    public float z, x, speed;      // speed em unidades (cm) por segundo
    public int steerVisual;        // -1 esquerda, 0 reto, 1 direita (escolhe o sprite)
    public int lapsCompleted;      // começa em -1 no grid, atrás da linha de largada
    public bool finished, retired;
    public float finishTime;
    public RoadSegment segment;    // segmento onde o carro está

    // Distância total na corrida: é o que define as posições.
    public float TotalDistance(float trackLength) => lapsCompleted * trackLength + z;

    public Sprite CurrentSprite =>
        steerVisual < 0 && spriteLeft != null ? spriteLeft :
        steerVisual > 0 && spriteRight != null ? spriteRight :
        spriteStraight;

    // Anda "distance" para a frente e conta uma volta ao cruzar a linha.
    public void Advance(float distance, Track track)
    {
        z += distance;
        if (z >= track.Length)
        {
            z -= track.Length;
            lapsCompleted++;
        }
        UpdateSegment(track);
    }

    // Mantém a lista de carros de cada segmento em dia (usada para desenhar
    // os adversários e para as colisões). O jogador não entra na lista: ele é
    // desenhado à parte, sempre na parte de baixo da tela.
    public void UpdateSegment(Track track)
    {
        var current = track.FindSegment(z);
        if (current == segment) return;
        if (!isPlayer)
        {
            segment?.cars.Remove(this);
            current.cars.Add(this);
        }
        segment = current;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Car/CarCondition.cs
using UnityEngine;

// POR QUE: o "estado de saúde" do carro do jogador durante a corrida:
// combustível, dano, pneus e nitro (Parte 1 §4.2 a §4.5).
// ESTRATÉGIA: só dados e regras simples. Quem gasta e repõe é o
// PlayerCarController (corrida) e o PitStopController (box).
[System.Serializable]
public class CarCondition
{
    public float fuel;          // 0..fuelCapacity (%)
    public float damage;        // 0..100 (%)
    public float tireWear;      // 0 = novo, 1 = gasto
    public int nitroCharges;
    public float nitroTimeLeft;

    public bool NitroActive => nitroTimeLeft > 0f;
    public bool OutOfFuel => fuel <= 0f;
    public bool Broken => damage >= 100f;

    // Condição no início de um GP: tanque cheio, pneus novos (placeholder
    // da Parte 1 §4.4) e o dano que veio da corrida anterior.
    public static CarCondition NewRace(GameConfig config, float carriedDamage) => new CarCondition
    {
        fuel = config.fuelCapacity,
        damage = Mathf.Clamp(carriedDamage, 0f, 99f),
        tireWear = 0f,
        nitroCharges = config.nitroCharges,
    };

    // Aplica dano já descontando a durabilidade do chassi.
    public void AddDamage(float amount, CarStats stats)
    {
        damage = Mathf.Min(100f, damage + amount * (1f - stats.durability));
    }
}
```

### 3.3 `PlayerCarController`

```csharp
// Caminho: Assets/_Project/Scripts/Car/PlayerCarController.cs
using UnityEngine;

// POR QUE: transforma a entrada do jogador em movimento na pista, com as
// regras da Parte 1 §3 e §4: marchas e conta-giros, força centrífuga, grama,
// nitro, combustível, pneus e dano.
// ESTRATÉGIA: não usa física do Unity. Tick(dt) é chamado pelo script que
// comanda a corrida (SoloTestRace agora, RaceDirector na Fase 5), para que
// tudo aconteça numa ordem conhecida: entrada → carro → colisões → desenho.
// MonoBehaviour é a classe base de scripts que ficam num GameObject.
public class PlayerCarController : MonoBehaviour
{
    const float K = GameConfig.KmhToUnits;

    public RaceCar Car { get; private set; }
    public CarCondition Condition { get; private set; }
    public CarStats Stats { get; private set; }
    public bool AutomaticGearbox { get; private set; } = true;
    public int Gear { get; private set; } = 1;
    public float Rpm01 { get; private set; }
    public bool IsOffRoad { get; private set; }
    public bool ControlsEnabled { get; set; }
    public float SpeedKmh => Car.speed / K;

    GameConfig config;
    Track track;
    CarInput input;
    float crashCooldown;

    // Prepara o carro para uma corrida.
    public void Setup(RaceCar car, CarStats stats, CarCondition condition, GameConfig cfg, Track raceTrack, bool automatic)
    {
        Car = car;
        Stats = stats;
        Condition = condition;
        config = cfg;
        track = raceTrack;
        AutomaticGearbox = automatic;
        Gear = 1;
        if (input == null) input = new CarInput();
        input.Enable();
    }

    // OnDestroy roda quando o GameObject é destruído (ex.: troca de cena).
    void OnDestroy() => input?.Dispose();

    // Velocidade máxima atual: cai com o dano e sobe com o nitro.
    float MaxSpeed
    {
        get
        {
            float kmh = Stats.maxSpeedKmh * (1f - config.damageSpeedPenalty * Condition.damage / 100f);
            if (Condition.NitroActive) kmh *= config.nitroSpeedBoost;
            return kmh * K;
        }
    }

    // Velocidade no limite da rotação de uma marcha. As marchas dividem a
    // velocidade máxima em partes iguais: com 4 marchas, a 1ª vai até 1/4.
    float GearTop(int gear) => MaxSpeed * gear / Stats.gearCount;

    // Um passo da simulação. dt = segundos desde o último passo.
    public void Tick(float dt)
    {
        bool accelerate = ControlsEnabled && input.Accelerate && !Condition.OutOfFuel && !Condition.Broken;
        bool brake = ControlsEnabled && input.Brake;
        float steer = ControlsEnabled ? input.Steer : 0f;

        HandleNitro(dt);
        HandleGears();

        var seg = track.FindSegment(Car.z);
        float speedPercent = Mathf.Clamp01(Car.speed / (Stats.maxSpeedKmh * K));

        // Direção: virar rende mais quanto mais rápido o carro vai.
        float dx = dt * config.steerSpeed * speedPercent;
        Car.x += steer * dx;
        Car.steerVisual = steer < -0.2f ? -1 : steer > 0.2f ? 1 : 0;

        // Força centrífuga: a curva empurra para fora. Aderência alta (pneus,
        // chassi) diminui o empurrão; pneu gasto perde até metade da aderência.
        float grip = Stats.grip * (1f - Condition.tireWear * 0.5f);
        Car.x -= dx * speedPercent * seg.curve * config.centrifugal * Mathf.Lerp(1.4f, 0.6f, grip);

        // Acelerar, frear ou rodar solto.
        if (accelerate) Car.speed += Acceleration() * dt;
        else if (brake) Car.speed -= config.brakingKmh * K * dt;
        else Car.speed -= config.coastDecelKmh * K * dt;

        // Fora do asfalto (o asfalto do box, à direita, conta como pista).
        bool onPitLane = seg.isPit && Car.x > 0f && Car.x < 1f + config.pitLaneWidth;
        IsOffRoad = Mathf.Abs(Car.x) > 1f && !onPitLane;
        if (IsOffRoad && Car.speed > config.offRoadMaxSpeedKmh * K)
            Car.speed -= config.offRoadDecelKmh * K * dt;

        // Acima do limite da marcha (reduziu em alta ou o nitro acabou), o
        // motor segura o carro aos poucos, em vez de cortar a velocidade.
        float top = GearTop(Gear);
        if (Car.speed > top) Car.speed = Mathf.MoveTowards(Car.speed, top, config.coastDecelKmh * 2f * K * dt);
        Car.speed = Mathf.Max(0f, Car.speed);
        Car.x = Mathf.Clamp(Car.x, -config.maxOffsetX, config.maxOffsetX);
        Rpm01 = Mathf.Clamp01(Car.speed / top);

        // Consumo e desgaste, proporcionais à distância (em km).
        float km = Car.speed * dt / 100000f;
        float fuelUse = km * config.fuelPerKm * Stats.fuelConsumption * (Condition.NitroActive ? 2f : 1f);
        Condition.fuel = Mathf.Max(0f, Condition.fuel - fuelUse);
        Condition.tireWear = Mathf.Min(1f, Condition.tireWear + km * config.tireWearPerKm * Stats.tireWear * (IsOffRoad ? 3f : 1f));

        Car.Advance(Car.speed * dt, track);
        crashCooldown -= dt;
    }

    // Aceleração na marcha e rotação atuais. Marchas baixas puxam mais forte;
    // a força é máxima no meio do conta-giros e cai perto do limite, o que
    // cria um ponto ideal de troca de marcha.
    float Acceleration()
    {
        float gearFactor = Stats.gearCount <= 1 ? 1f : Mathf.Lerp(1.4f, 0.7f, (Gear - 1f) / (Stats.gearCount - 1f));
        float torque = Mathf.Lerp(0.6f, 1f, Mathf.Sin(Rpm01 * Mathf.PI * 0.9f));
        float a = Stats.accelerationKmh * gearFactor * torque;
        if (AutomaticGearbox) a *= config.automaticAccelFactor;
        if (Condition.NitroActive) a *= config.nitroAccelBoost;
        return a * K;
    }

    void HandleGears()
    {
        if (AutomaticGearbox)
        {
            if (Gear < Stats.gearCount && Rpm01 >= 0.92f) Gear++;
            else if (Gear > 1 && Car.speed < GearTop(Gear - 1) * 0.6f) Gear--;
        }
        else if (ControlsEnabled)
        {
            if (input.ShiftUpPressed && Gear < Stats.gearCount) Gear++;
            if (input.ShiftDownPressed && Gear > 1) Gear--;
        }
    }

    void HandleNitro(float dt)
    {
        if (Condition.nitroTimeLeft > 0f)
            Condition.nitroTimeLeft -= dt;
        else if (ControlsEnabled && input.NitroPressed && Condition.nitroCharges > 0)
        {
            Condition.nitroCharges--;
            Condition.nitroTimeLeft = config.nitroDuration;
        }
    }

    // Batida: a velocidade cai para newSpeed e o carro leva dano proporcional
    // à velocidade do impacto. O intervalo de 0,5 s evita que um mesmo
    // contato cause dano em todos os quadros seguidos.
    // Devolve true se o dano foi aplicado.
    public bool ApplyCrash(float damageAtFullSpeed, float newSpeed)
    {
        float impact = Mathf.Clamp01(Car.speed / (Stats.maxSpeedKmh * K));
        Car.speed = Mathf.Min(Car.speed, newSpeed);
        if (crashCooldown > 0f) return false;
        crashCooldown = 0.5f;
        Condition.AddDamage(damageAtFullSpeed * impact, Stats);
        return true;
    }

    // Usado pelo box (Fase 6): para o carro na hora.
    public void StopCar() => Car.speed = 0f;
}
```

### 3.4 `RoadSpriteRenderer`

```csharp
// Caminho: Assets/_Project/Scripts/Road/RoadSpriteRenderer.cs
using System.Collections.Generic;
using UnityEngine;

// POR QUE: desenha os objetos da beira da pista, os adversários e o carro do
// jogador, cada um na posição e no tamanho que a projeção da estrada manda.
// ESTRATÉGIA:
// - Percorre os segmentos de trás para a frente, para o que está perto
//   ficar por cima do que está longe (sortingOrder crescente).
// - Tamanho na tela = largura no mundo × escala do segmento × meia tela.
// - O shader PixelUnlit corta o sprite abaixo de _ClipY: a linha do morro
//   que estava na frente dele. Assim um carro atrás da crista aparece só
//   pela metade de cima, como deve ser.
// - Pool: em vez de criar e destruir SpriteRenderers todo quadro, reaproveita
//   uma lista deles e só desliga os que sobraram.
public class RoadSpriteRenderer : MonoBehaviour
{
    [SerializeField] GameConfig config;
    [SerializeField] Material spriteMaterial;   // M_RoadSprite
    [SerializeField] int baseSortingOrder = 10;

    static readonly int ClipYId = Shader.PropertyToID("_ClipY");
    readonly List<SpriteRenderer> pool = new List<SpriteRenderer>();
    MaterialPropertyBlock block;
    int used;

    void Awake() => block = new MaterialPropertyBlock();

    // Desenha tudo. Chamar depois de RoadRenderer.Render no mesmo quadro.
    // bounce: pixels de trepidação do carro do jogador (grama).
    public void Draw(Track track, RoadRenderer road, RaceCar player, float bounce)
    {
        used = 0;
        float halfW = config.screenWidth * 0.5f;
        float height = config.screenHeight;
        int count = Mathf.Min(config.drawDistance, track.Segments.Count);
        int baseIndex = road.BaseSegment.index;

        for (int n = count - 1; n > 0; n--)
        {
            var seg = track.Segments[(baseIndex + n) % track.Segments.Count];
            if (seg.p1.camZ <= config.CameraDepth) continue;   // atrás da câmera

            float clip = height - seg.clipY;                     // em coordenadas do Unity
            int order = baseSortingOrder + (count - n) * 2;

            foreach (var obj in seg.objects)
            {
                float x = seg.p1.x + seg.p1.w * obj.offset;
                Place(obj.sprite, Color.white, x, height - seg.p1.y, obj.worldWidth * seg.p1.scale * halfW, clip, order);
            }

            foreach (var car in seg.cars)
            {
                // O carro está em algum ponto dentro do segmento: interpola.
                float t = Mathf.InverseLerp(seg.z1, seg.z2, car.z);
                float scale = Mathf.Lerp(seg.p1.scale, seg.p2.scale, t);
                float x = Mathf.Lerp(seg.p1.x, seg.p2.x, t) + scale * car.x * config.roadWidth * halfW;
                float y = Mathf.Lerp(seg.p1.y, seg.p2.y, t);
                Place(car.CurrentSprite, car.tint, x, height - y, config.carWorldWidth * scale * halfW, clip, order + 1);
            }
        }

        // O jogador: sempre no centro, embaixo, na escala da distância PlayerZ.
        float playerScale = config.CameraDepth / config.PlayerZ;
        Place(player.CurrentSprite, player.tint, halfW, bounce, config.carWorldWidth * playerScale * halfW,
              -100000f, baseSortingOrder + count * 2 + 10);

        for (int i = used; i < pool.Count; i++) pool[i].enabled = false;
    }

    void Place(Sprite sprite, Color tint, float x, float y, float pixelWidth, float clipY, int order)
    {
        if (sprite == null || pixelWidth < 0.5f) return;
        var r = Next();
        r.sprite = sprite;
        r.color = tint;
        r.sortingOrder = order;
        float s = pixelWidth / sprite.bounds.size.x;
        r.transform.localPosition = new Vector3(Mathf.Round(x), Mathf.Round(y), 0f);
        r.transform.localScale = new Vector3(s, s, 1f);
        // MaterialPropertyBlock muda um valor do material só neste renderer,
        // sem criar uma cópia do material.
        r.GetPropertyBlock(block);
        block.SetFloat(ClipYId, clipY);
        r.SetPropertyBlock(block);
    }

    SpriteRenderer Next()
    {
        if (used == pool.Count)
        {
            var go = new GameObject("RoadSprite");
            go.transform.SetParent(transform, false);
            var created = go.AddComponent<SpriteRenderer>();
            created.sharedMaterial = spriteMaterial;
            pool.Add(created);
        }
        var r = pool[used++];
        r.enabled = true;
        return r;
    }
}
```

### 3.5 `SoloTestRace` (substitui o `RoadTestDriver`)

```csharp
// Caminho: Assets/_Project/Scripts/Race/SoloTestRace.cs
using UnityEngine;

// POR QUE: pilotar sozinho na pista de teste antes de existirem adversários
// e regras de corrida. Na Fase 5 o RaceDirector assume este papel e este
// script é apagado.
// ESTRATÉGIA: monta pista e carro em Start; em Update faz a sequência
// carro → desenho que o RaceDirector também vai seguir.
public class SoloTestRace : MonoBehaviour
{
    [SerializeField] GameConfig config;
    [SerializeField] TrackDefinition trackDefinition;
    [SerializeField] RoadRenderer road;
    [SerializeField] RoadSpriteRenderer sprites;
    [SerializeField] ParallaxBackground background;
    [SerializeField] PlayerCarController player;
    [SerializeField] bool automaticGearbox = true;

    Track track;

    void Start()
    {
        track = new Track(trackDefinition, config);
        road.SetTrack(track);
        if (background != null) background.SetSprites(trackDefinition.backgroundLayers);

        var car = new RaceCar
        {
            driverName = config.playerName,
            isPlayer = true,
            spriteStraight = config.playerSpriteStraight,
            spriteLeft = config.playerSpriteLeft,
            spriteRight = config.playerSpriteRight,
            tint = config.playerTint,
        };
        car.UpdateSegment(track);
        var stats = CarStats.Build(config, config.StartingParts());
        player.Setup(car, stats, CarCondition.NewRace(config, 0f), config, track, automaticGearbox);
        player.ControlsEnabled = true;
    }

    void Update()
    {
        float dt = Time.deltaTime;
        player.Tick(dt);

        var p = player.Car;
        road.Render(track.Wrap(p.z - config.PlayerZ), p.x);
        float bounce = player.IsOffRoad && p.speed > 1f ? Random.Range(0, 2) : 0f;
        sprites.Draw(track, road, p, bounce);
        if (background != null)
            background.Scroll(p.segment.curve, Mathf.Clamp01(p.speed / (config.baseMaxSpeedKmh * GameConfig.KmhToUnits)), dt, track.HeightAt(p.z));
    }
}
```

### 3.6 Montar

1. Apague o objeto `RoadTest` da cena (e o script `RoadTestDriver.cs`, se quiser).
2. Crie `RoadSprites` em (0, 0, 0) com **Road Sprite Renderer** (`GameConfig` e `M_RoadSprite`).
3. Crie `Player` com **Player Car Controller**.
4. Crie `SoloTest` com **Solo Test Race** e arraste as referências.

### ✅ Checkpoint da Fase 3
- O carro (retângulo azul com rodas) fica embaixo, no centro. ↑ acelera, ↓ freia, ← → viram, e o sprite muda nos quadros de curva.
- Com um `Debug.Log` temporário de `Gear` e `SpeedKmh` no `SoloTestRace.Update`: no automático, a marcha sobe sozinha até a 4ª e o carro chega perto de 180 km/h na reta.
- Com **Automatic Gearbox** desligado, só E e Q trocam de marcha; na 1ª o carro fica preso no limite de rotação.
- Nas curvas em alta, o carro escorrega para fora; sem virar, ele vai para a grama e perde velocidade até ~80 km/h.
- Espaço ativa o nitro 3 vezes no máximo; durante o efeito, a velocidade passa do limite normal.
- Árvores e placas crescem ao se aproximar, ficam presas ao chão nas curvas e somem atrás das cristas dos morros.

#### Problemas comuns
- **O carro não responde ao teclado:** **Active Input Handling** não está em `Input System Package` (Fase 0.3), ou a janela Game não está com o foco (clique nela).
- **Árvores flutuando ou afundadas:** o pivô do sprite não está em `Bottom`. Reimporte a pasta `Art/Placeholder` (Fase 0.5).
- **Árvores aparecem por cima da estrada atrás de um morro:** o `RoadSprites` está com o material padrão em vez de `M_RoadSprite`, então o `_ClipY` não tem efeito.

Próxima fase: **Colisões e Dano** — bater nos objetos da beira da pista custa velocidade e dano.

---

# Parte 7 — Implementação Unity: Fase 4 (Colisões e Dano)

## Fase 4 — Colisões e Dano

> Objetivo desta fase: bater numa árvore ou placa quase para o carro e causa dano; bater na traseira de outro carro causa dano menor (usado a partir da Fase 5).

### 4.1 `CollisionSystem`

```csharp
// Caminho: Assets/_Project/Scripts/Race/CollisionSystem.cs
using System.Collections.Generic;
using UnityEngine;

// POR QUE: sem física do Unity, as batidas são testes simples de
// sobreposição em uma dimensão (lateral), feitos só no segmento do carro.
// ESTRATÉGIA: larguras viram "unidades de x" (x = 1 é a borda do asfalto,
// então largura em x = largura no mundo / roadWidth). Dois objetos se tocam
// quando a distância entre os centros é menor que a média das larguras.
public static class CollisionSystem
{
    // Objetos da beira da pista. Só testa quando o carro está fora do asfalto.
    public static void CheckRoadside(PlayerCarController player, GameConfig config)
    {
        var car = player.Car;
        if (car.segment == null || Mathf.Abs(car.x) <= 1f) return;

        float carW = config.carWorldWidth / config.roadWidth;
        foreach (var obj in car.segment.objects)
        {
            if (!obj.collides) continue;
            float objW = obj.worldWidth / config.roadWidth;
            float minDistance = (carW + objW) * 0.5f;
            if (Mathf.Abs(car.x - obj.offset) >= minDistance) continue;

            player.ApplyCrash(config.crashDamage, car.speed * config.crashSpeedFactor);
            // Empurra o carro para o lado da pista, encostado no objeto.
            // Sem isso, o carro parado ficaria preso dentro da árvore: com
            // velocidade 0 não dá para virar.
            car.x = obj.offset - Mathf.Sign(obj.offset) * minDistance * 1.01f;
            break;
        }
    }

    // Batida na traseira de um adversário logo à frente e mais lento.
    public static void CheckCars(PlayerCarController player, IReadOnlyList<RaceCar> rivals, Track track, GameConfig config)
    {
        var me = player.Car;
        float carW = config.carWorldWidth / config.roadWidth;
        foreach (var other in rivals)
        {
            if (other.retired) continue;
            float ahead = track.Wrap(other.z - me.z);          // distância até ele, à frente
            if (ahead > config.carLength) continue;
            if (me.speed <= other.speed) continue;
            if (Mathf.Abs(me.x - other.x) >= carW) continue;

            // Fica atrás dele, um pouco mais lento.
            player.ApplyCrash(config.carBumpDamage, other.speed * 0.9f);
        }
    }
}
```

### 4.2 Ligar no `SoloTestRace`

Em `SoloTestRace.Update`, logo depois de `player.Tick(dt);`, acrescente:

```csharp
        CollisionSystem.CheckRoadside(player, config);
```

E, para ver o dano enquanto não há HUD, acrescente no fim do `Update`:

```csharp
        if (Time.frameCount % 60 == 0) Debug.Log($"Dano: {player.Condition.damage:0}%");
```

### ✅ Checkpoint da Fase 4
- Bater numa árvore em alta velocidade quase para o carro e soma cerca de 12% de dano; batendo devagar, o dano é menor.
- Depois da batida, o carro fica ao lado da árvore, do lado da pista, e consegue acelerar de volta.
- Com 30% de dano, a velocidade máxima na reta cai (cerca de 10% a menos com os valores placeholder).
- Passar pela grama sem tocar nas árvores não causa dano.

#### Problemas comuns
- **O carro atravessa as árvores:** a fileira de árvores está com **Collides** desligado no `Track_Teste`, ou o `offset` dela está dentro do asfalto (entre −1 e 1), onde a colisão não é testada.
- **O dano sobe sem parar encostado na árvore:** o `crashCooldown` não está sendo descontado; confira se `crashCooldown -= dt;` está no fim do `Tick`.

Próxima fase: **Adversários e Corrida** — grid, largada, voltas, posições e IA.

---

# Parte 8 — Implementação Unity: Fase 5 (Adversários e Corrida)

## Fase 5 — Adversários e Corrida

> Objetivo desta fase: uma corrida completa contra 9 adversários: contagem regressiva, voltas, posições ao vivo, chegada e lista de resultado.

### 5.1 `AICarController`

```csharp
// Caminho: Assets/_Project/Scripts/Car/AICarController.cs
using System.Collections.Generic;
using UnityEngine;

// POR QUE: dirige um adversário (Parte 1 §7): mantém a velocidade da equipe,
// tira o pé nas curvas e desvia de carros mais lentos à frente.
// ESTRATÉGIA: a IA não sofre força centrífuga, nem gasta combustível ou
// pneus (placeholder da Parte 1 §4.3). Ela só escolhe uma velocidade-alvo e
// uma posição lateral-alvo, e se aproxima delas aos poucos.
public class AICarController
{
    const float K = GameConfig.KmhToUnits;

    public RaceCar Car { get; }
    readonly TeamDefinition team;
    readonly GameConfig config;
    readonly Track track;
    readonly float preferredX;

    public AICarController(RaceCar car, TeamDefinition team, GameConfig config, Track track, float preferredX)
    {
        Car = car;
        this.team = team;
        this.config = config;
        this.track = track;
        this.preferredX = preferredX;
    }

    public void Tick(float dt, IReadOnlyList<RaceCar> allCars)
    {
        if (Car.retired) return;
        var seg = track.FindSegment(Car.z);

        // Velocidade-alvo: a da equipe, menor nas curvas fechadas.
        float curveFactor = 1f - Mathf.Clamp01(Mathf.Abs(seg.curve) / 6f) * config.aiCurveSlowdown;
        float target = team.maxSpeedKmh * K * curveFactor;
        // Freia duas vezes mais rápido do que acelera.
        float rate = team.accelerationKmh * K * (Car.speed > target ? 2f : 1f);
        Car.speed = Mathf.MoveTowards(Car.speed, target, rate * dt);

        float desiredX = DesiredX(allCars);
        float newX = Mathf.MoveTowards(Car.x, desiredX, dt * 0.8f);
        Car.steerVisual = newX < Car.x - 0.001f ? -1 : newX > Car.x + 0.001f ? 1 : 0;
        Car.x = newX;

        Car.Advance(Car.speed * dt, track);
    }

    // Procura um carro mais lento logo à frente, na mesma faixa, e passa para
    // o lado com mais espaço. Sem ninguém na frente, volta à sua faixa.
    float DesiredX(IReadOnlyList<RaceCar> allCars)
    {
        float carW = config.carWorldWidth / config.roadWidth;
        float lookAhead = config.segmentLength * 20f;
        foreach (var other in allCars)
        {
            if (other == Car || other.retired) continue;
            float ahead = track.Wrap(other.z - Car.z);
            if (ahead <= 0f || ahead > lookAhead) continue;
            if (other.speed >= Car.speed) continue;
            if (Mathf.Abs(other.x - Car.x) > carW * 1.2f) continue;

            float side = other.x > 0f ? -1f : 1f;
            return Mathf.Clamp(other.x + side * carW * 1.5f, -0.8f, 0.8f);
        }
        return preferredX;
    }
}
```

### 5.2 `RaceSetup` e `RaceResultEntry`

```csharp
// Caminho: Assets/_Project/Scripts/Race/RaceSetup.cs
// POR QUE: tudo o que a cena de corrida precisa saber para começar. A
// Garagem (Fase 9) preenche isto antes de carregar a cena.
public class RaceSetup
{
    public TrackDefinition track;
    public CarStats playerStats;
    public float playerDamage;
    public bool automaticGearbox = true;
    public TeamDefinition[] rivals;
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Race/RaceResultEntry.cs
// POR QUE: uma linha do resultado da corrida. [System.Serializable] deixa o
// save (Fase 8) guardar o último resultado em JSON.
[System.Serializable]
public class RaceResultEntry
{
    public string driverName;
    public bool isPlayer;
    public int position;
    public bool retired;
    public float finishTime;   // -1 se não terminou
}
```

### 5.3 `RaceDirector`

```csharp
// Caminho: Assets/_Project/Scripts/Race/RaceDirector.cs
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

// POR QUE: o "diretor de prova". Monta o grid, faz a contagem regressiva,
// roda a simulação de todos os carros, calcula posições, detecta a chegada e
// avisa o resultado. Também desenha a cena no fim de cada quadro.
// ESTRATÉGIA:
// - Pending (static) é o RaceSetup deixado pela Garagem. Se a cena for aberta
//   direto no Editor, usa a pista de teste do Inspector.
// - O grid fica atrás da linha de largada (fim da pista), com lapsCompleted =
//   -1; cruzar a linha pela primeira vez leva a 0 voltas completas.
// - Ordem de cada quadro: box → jogador → IA → colisões → chegada → posições
//   → desenho.
public class RaceDirector : MonoBehaviour
{
    public enum RaceState { Countdown, Racing, Finished }

    const float K = GameConfig.KmhToUnits;

    // Preenchido pela Garagem antes de carregar a cena (Fase 9).
    public static RaceSetup Pending;

    [SerializeField] GameConfig config;
    [SerializeField] RoadRenderer road;
    [SerializeField] RoadSpriteRenderer sprites;
    [SerializeField] ParallaxBackground background;
    [SerializeField] PlayerCarController player;
    [SerializeField] float countdownSeconds = 3f;

    [Header("Teste: usado quando a cena é aberta direto")]
    [SerializeField] TrackDefinition testTrack;

    public RaceState State { get; private set; }
    public Track Track { get; private set; }
    public int Laps => Track.Definition.laps;
    public float RaceTime { get; private set; }
    public float CountdownLeft { get; private set; }
    public int PlayerPosition { get; private set; }
    public bool StartedFromGarage { get; private set; }
    public PlayerCarController Player => player;
    public IReadOnlyList<RaceCar> Standings => standings;
    public List<RaceResultEntry> Results { get; private set; }

    // Evento: outros scripts se inscrevem para saber quando a corrida acabou.
    public event System.Action<List<RaceResultEntry>> RaceFinished;

    readonly List<RaceCar> cars = new List<RaceCar>();
    readonly List<RaceCar> rivals = new List<RaceCar>();
    readonly List<AICarController> ai = new List<AICarController>();
    readonly List<RaceCar> standings = new List<RaceCar>();
    PitStopController pit;

    void Start()
    {
        StartedFromGarage = Pending != null;
        var setup = Pending ?? TestSetup();
        Pending = null;

        Track = new Track(setup.track, config);
        road.SetTrack(Track);
        if (background != null) background.SetSprites(setup.track.backgroundLayers);

        BuildGrid(setup);

        // GetComponent procura outro componente no mesmo GameObject. O box é
        // opcional até a Fase 6.
        pit = GetComponent<PitStopController>();
        if (pit != null) pit.Setup(player, config);

        State = RaceState.Countdown;
        CountdownLeft = countdownSeconds;
        UpdateStandings();
    }

    RaceSetup TestSetup() => new RaceSetup
    {
        track = testTrack,
        playerStats = CarStats.Build(config, config.StartingParts()),
        rivals = config.season.rivals,
    };

    // Grid de 2 carros por fila; o jogador larga em último (Parte 1 §4.1).
    void BuildGrid(RaceSetup setup)
    {
        int total = setup.rivals.Length + 1;
        int playerSlot = total - 1;
        int rivalIndex = 0;

        for (int slot = 0; slot < total; slot++)
        {
            int row = slot / 2;
            float x = slot % 2 == 0 ? -0.4f : 0.4f;
            RaceCar car;

            if (slot == playerSlot)
            {
                car = new RaceCar
                {
                    driverName = config.playerName,
                    isPlayer = true,
                    spriteStraight = config.playerSpriteStraight,
                    spriteLeft = config.playerSpriteLeft,
                    spriteRight = config.playerSpriteRight,
                    tint = config.playerTint,
                };
                player.Setup(car, setup.playerStats, CarCondition.NewRace(config, setup.playerDamage),
                             config, Track, setup.automaticGearbox);
            }
            else
            {
                var team = setup.rivals[rivalIndex++];
                car = new RaceCar
                {
                    driverName = team.driverName,
                    spriteStraight = team.spriteStraight,
                    spriteLeft = team.spriteLeft,
                    spriteRight = team.spriteRight,
                    tint = team.tintSprite ? team.color : Color.white,
                };
                ai.Add(new AICarController(car, team, config, Track, x));
                rivals.Add(car);
            }

            car.x = x;
            car.z = Track.Wrap(-config.carLength * 1.5f * (row + 1));
            car.lapsCompleted = -1;
            car.UpdateSegment(Track);
            cars.Add(car);
        }
    }

    void Update()
    {
        float dt = Time.deltaTime;

        if (State == RaceState.Countdown)
        {
            CountdownLeft -= dt;
            if (CountdownLeft <= 0f)
            {
                State = RaceState.Racing;
                player.ControlsEnabled = true;
            }
        }
        else
        {
            if (State == RaceState.Racing)
            {
                RaceTime += dt;
                if (pit != null) pit.Tick(dt);
            }
            player.Tick(dt);
            foreach (var a in ai) a.Tick(dt, cars);
            CollisionSystem.CheckRoadside(player, config);
            CollisionSystem.CheckCars(player, rivals, Track, config);
            CheckFinishes();
            UpdateStandings();
        }

        Draw(dt);
    }

    void CheckFinishes()
    {
        foreach (var car in cars)
        {
            if (!car.finished && !car.retired && car.lapsCompleted >= Laps)
            {
                car.finished = true;
                car.finishTime = RaceTime;
            }
        }

        // Abandono do jogador: carro quebrado, ou parado sem combustível fora do box.
        var me = player.Car;
        bool pitting = pit != null && pit.IsPitting;
        if (!me.finished && !me.retired &&
            (player.Condition.Broken || (player.Condition.OutOfFuel && me.speed < 1f && !pitting)))
            me.retired = true;

        if (State == RaceState.Racing && (me.finished || me.retired))
            Finish();
    }

    void Finish()
    {
        State = RaceState.Finished;
        player.ControlsEnabled = false;
        UpdateStandings();
        Results = standings.Select((c, i) => new RaceResultEntry
        {
            driverName = c.driverName,
            isPlayer = c.isPlayer,
            position = i + 1,
            retired = c.retired,
            finishTime = c.finished ? c.finishTime : -1f,
        }).ToList();
        // ?.Invoke chama o evento só se alguém estiver inscrito.
        RaceFinished?.Invoke(Results);
    }

    // Ordem: quem chegou (pelo tempo), depois quem corre (pela distância),
    // depois quem abandonou.
    void UpdateStandings()
    {
        standings.Clear();
        standings.AddRange(cars);
        standings.Sort(Compare);
        PlayerPosition = standings.IndexOf(player.Car) + 1;
    }

    int Compare(RaceCar a, RaceCar b)
    {
        if (a.retired != b.retired) return a.retired ? 1 : -1;
        if (a.finished && b.finished) return a.finishTime.CompareTo(b.finishTime);
        if (a.finished != b.finished) return a.finished ? -1 : 1;
        return b.TotalDistance(Track.Length).CompareTo(a.TotalDistance(Track.Length));
    }

    void Draw(float dt)
    {
        var p = player.Car;
        road.Render(Track.Wrap(p.z - config.PlayerZ), p.x);
        float bounce = player.IsOffRoad && p.speed > 1f ? Random.Range(0, 2) : 0f;
        sprites.Draw(Track, road, p, bounce);
        if (background != null)
            background.Scroll(p.segment.curve, Mathf.Clamp01(p.speed / (config.baseMaxSpeedKmh * K)), dt, Track.HeightAt(p.z));
    }
}
```

`PitStopController` só é criado na Fase 6. Para compilar agora, crie a versão vazia abaixo (a Fase 6 substitui):

```csharp
// Caminho: Assets/_Project/Scripts/Race/PitStopController.cs (versão provisória)
using UnityEngine;

public class PitStopController : MonoBehaviour
{
    public bool IsPitting => false;
    public void Setup(PlayerCarController player, GameConfig config) { }
    public void Tick(float dt) { }
}
```

### 5.4 Montar

1. Apague o objeto `SoloTest` e o script `SoloTestRace.cs`.
2. Crie `RaceDirector` com **Race Director**: arraste `GameConfig`, `Road`, `RoadSprites`, `Background`, `Player` e `Track_Teste` em **Test Track**.
3. Para o teste, deixe `laps` da `Track_Teste` em 2.

### ✅ Checkpoint da Fase 5
- Ao dar Play, os 10 carros estão parados em 5 filas; o jogador está na última. Durante 3 s nada se move.
- Os adversários saem em velocidades diferentes, tiram o pé nas curvas e desviam do jogador quando ele está mais lento na frente deles.
- Bater na traseira de um adversário segura o carro atrás dele e soma um pouco de dano.
- Com um `Debug.Log` temporário de `PlayerPosition`, a posição muda ao ultrapassar.
- Ao completar 2 voltas, o jogador perde o controle (o carro roda solto) e o evento `RaceFinished` é disparado (confira com um `Debug.Log` em `Finish`).

#### Problemas comuns
- **Os adversários aparecem "pulando" ou piscando:** dois carros no mesmo lugar da lista do segmento. Confira se cada `RaceCar` chama `UpdateSegment` no grid e se a cena não tem dois `RaceDirector`.
- **A corrida acaba logo depois da largada:** os carros começaram à frente da linha. O grid usa `Track.Wrap` com `z` negativo e `lapsCompleted = -1`; se `lapsCompleted` ficou em 0, a primeira passagem pela linha já conta uma volta.
- **NullReferenceException em `config.season.rivals`:** o `GameConfig` está sem a `Season_1` (Fase 1.5).

Próxima fase: **Pit Stop** — entrar no box para reabastecer e trocar pneus.

---

# Parte 9 — Implementação Unity: Fase 6 (Pit Stop)

## Fase 6 — Pit Stop

> Objetivo desta fase: entrar devagar no asfalto do box, à direita da reta de largada, para o carro; ele é reabastecido e tem os pneus trocados, e depois volta à corrida.

### 6.1 `PitStopController`

Substitua a versão provisória da Fase 5 por esta:

```csharp
// Caminho: Assets/_Project/Scripts/Race/PitStopController.cs
using UnityEngine;

// POR QUE: as regras do box da Parte 1 §4.3: abastecer e trocar pneus ao
// custo do tempo parado. Não conserta dano (placeholder).
// ESTRATÉGIA: máquina de estados mínima. Fora do box, verifica se o carro
// entrou na faixa do box (segmento isPit, x além da zebra direita) abaixo
// da velocidade-limite. Parado, enche o tanque e conta o tempo da troca de
// pneus; quando os dois terminam, devolve o controle. "leaving" impede que o
// carro pare de novo antes de sair da área do box.
public class PitStopController : MonoBehaviour
{
    PlayerCarController player;
    GameConfig config;
    float tireTimer;
    bool leaving;

    public bool IsPitting { get; private set; }
    public float TireProgress01 => config == null ? 0f : Mathf.Clamp01(tireTimer / config.pitTireChangeSeconds);

    public void Setup(PlayerCarController playerCar, GameConfig cfg)
    {
        player = playerCar;
        config = cfg;
    }

    // Chamado pelo RaceDirector só durante a corrida (não na contagem nem depois da chegada).
    public void Tick(float dt)
    {
        var car = player.Car;
        var seg = car.segment;
        if (seg == null) return;

        if (!IsPitting)
        {
            if (leaving)
            {
                if (!seg.isPit) leaving = false;
                return;
            }
            bool inPitLane = seg.isPit && car.x > config.pitEntryX;
            if (inPitLane && player.SpeedKmh <= config.pitMaxEntryKmh)
            {
                IsPitting = true;
                tireTimer = 0f;
                player.StopCar();
                player.ControlsEnabled = false;
            }
            return;
        }

        // Parado no box.
        player.StopCar();
        var c = player.Condition;
        c.fuel = Mathf.Min(config.fuelCapacity, c.fuel + config.pitRefuelPerSecond * dt);
        tireTimer += dt;
        if (tireTimer >= config.pitTireChangeSeconds) c.tireWear = 0f;

        if (c.fuel >= config.fuelCapacity && tireTimer >= config.pitTireChangeSeconds)
        {
            IsPitting = false;
            leaving = true;
            player.ControlsEnabled = true;
        }
    }
}
```

### 6.2 Montar

1. No objeto `RaceDirector`, **Add Component → Pit Stop Controller**. O `RaceDirector` o encontra sozinho com `GetComponent`.
2. Na `Track_Teste`, o box vai do segmento 5 ao 60. Nenhum objeto que causa batida pode ficar no lado direito desse trecho: na Fase 1.5, mude o `firstSegment` das árvores e das placas para 70.
3. Placeholder visual: crie uma fileira de `Sign` em `offset` 1.9, `firstSegment` 5, `every` 10, `count` 6, **Collides** desligado, para marcar a entrada do box.

### ✅ Checkpoint da Fase 6
- Na reta de largada aparece uma faixa de asfalto extra à direita da zebra.
- Entrar nela abaixo de 90 km/h para o carro. Em cerca de 3 a 4 s o combustível volta a 100% e os pneus a novos (confira com `Debug.Log` até a HUD existir); depois o carro volta a acelerar.
- Entrar no box acima de 90 km/h não para o carro.
- Sem combustível e ainda andando, dá para chegar rodando solto até o box; parar sem combustível fora do box é abandono.

#### Problemas comuns
- **O carro não para no box:** ele está passando pela zebra (x entre 1 e 1.05). Vire mais para a direita; ou diminua `pitEntryX` no `GameConfig`.
- **O carro bate em algo invisível no box:** há um objeto com **Collides** ligado no lado direito dentro dos segmentos do box (ver 6.2, passo 2).

Próxima fase: **HUD e Resultado** — mostrar tudo isso na tela.

---

# Parte 10 — Implementação Unity: Fase 7 (HUD e Resultado)

## Fase 7 — HUD e Resultado

> Objetivo desta fase: a HUD da Parte 1 §10.1 durante a corrida e um painel de resultado no fim.

### 7.1 `RaceHUD`

```csharp
// Caminho: Assets/_Project/Scripts/UI/RaceHUD.cs
using System.Collections.Generic;
using System.Text;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

// POR QUE: mostra o estado da corrida e do carro (Parte 1 §10.1) e o
// resultado no fim.
// ESTRATÉGIA: só lê dados do RaceDirector, do PlayerCarController e do
// PitStopController; nunca muda nada na simulação. TMP_Text é o texto do
// TextMeshPro; Image com "Image Type = Filled" vira uma barra (fillAmount
// de 0 a 1). O painel de resultado se inscreve no evento RaceFinished.
public class RaceHUD : MonoBehaviour
{
    [SerializeField] GameConfig config;
    [SerializeField] RaceDirector director;
    [SerializeField] PitStopController pit;

    [Header("Sempre visível")]
    [SerializeField] TMP_Text speedText;
    [SerializeField] TMP_Text gearText;
    [SerializeField] TMP_Text lapText;
    [SerializeField] TMP_Text positionText;
    [SerializeField] TMP_Text nitroText;
    [SerializeField] TMP_Text damageText;
    [SerializeField] Image rpmFill;
    [SerializeField] Image fuelFill;
    [SerializeField] Image tireFill;

    [Header("Centro da tela")]
    [SerializeField] TMP_Text centerText;

    [Header("Resultado")]
    [SerializeField] GameObject resultsPanel;
    [SerializeField] TMP_Text resultsText;
    [SerializeField] Button continueButton;
    [Tooltip("Cena carregada ao continuar. Fase 7: Corrida (repete). Fase 8 em diante: Garagem.")]
    [SerializeField] string nextScene = "Corrida";

    void Start()
    {
        resultsPanel.SetActive(false);
        director.RaceFinished += ShowResults;
        continueButton.onClick.AddListener(() => SceneManager.LoadScene(nextScene));
    }

    // Cancela a inscrição no evento para não deixar referência para trás.
    void OnDestroy()
    {
        if (director != null) director.RaceFinished -= ShowResults;
    }

    void Update()
    {
        var player = director.Player;
        if (player.Car == null) return;
        var c = player.Condition;

        speedText.text = $"{player.SpeedKmh:0} km/h";
        gearText.text = $"{player.Gear}ª {(player.AutomaticGearbox ? "A" : "M")}";
        rpmFill.fillAmount = player.Rpm01;
        rpmFill.color = player.Rpm01 > 0.9f ? Color.red : Color.white;

        int lap = Mathf.Clamp(player.Car.lapsCompleted + 1, 1, director.Laps);
        lapText.text = $"VOLTA {lap}/{director.Laps}";
        positionText.text = $"P{director.PlayerPosition}/{director.Standings.Count}";

        fuelFill.fillAmount = c.fuel / config.fuelCapacity;
        tireFill.fillAmount = 1f - c.tireWear;
        nitroText.text = c.NitroActive ? "NITRO!" : $"NITRO x{c.nitroCharges}";
        damageText.text = $"DANO {c.damage:0}%";

        centerText.text = CenterMessage(c);
    }

    // Mensagem do centro, da mais importante para a menos importante.
    string CenterMessage(CarCondition c)
    {
        if (director.State == RaceDirector.RaceState.Countdown)
            return Mathf.CeilToInt(director.CountdownLeft).ToString();
        if (director.State == RaceDirector.RaceState.Finished)
            return director.Player.Car.retired ? "ABANDONO" : "BANDEIRADA!";
        if (director.RaceTime < 1f) return "VAI!";
        if (pit != null && pit.IsPitting) return $"BOX\nCOMBUSTÍVEL {c.fuel:0}%  PNEUS {pit.TireProgress01 * 100f:0}%";
        if (c.OutOfFuel) return "SEM COMBUSTÍVEL";
        if (c.fuel < 15f) return "COMBUSTÍVEL BAIXO";
        return "";
    }

    void ShowResults(List<RaceResultEntry> results)
    {
        var sb = new StringBuilder();
        foreach (var r in results)
        {
            string time = r.retired ? "abandonou" : r.finishTime < 0f ? "em pista" : FormatTime(r.finishTime);
            string line = $"{r.position,2}. {r.driverName,-14} {time}";
            // Rich text do TMP: destaca a linha do jogador.
            sb.AppendLine(r.isPlayer ? $"<color=#FFD24A>{line}</color>" : line);
        }
        resultsText.text = sb.ToString();
        resultsPanel.SetActive(true);
    }

    static string FormatTime(float seconds) =>
        $"{(int)(seconds / 60f)}:{seconds % 60f:00.00}";
}
```

### 7.2 Montar a HUD

1. **GameObject → UI → Canvas** (`HUD`). **Canvas Scaler**: `Scale With Screen Size`, **Reference Resolution** 640 × 360, **Match** 0.5.
2. Textos (**UI → Text - TextMeshPro**): no canto superior esquerdo `positionText` e `lapText`; no superior direito `damageText` e `nitroText`; no inferior direito `speedText` e `gearText`; no centro `centerText` (fonte grande).
3. Barras: para cada uma, crie um **UI → Image** de fundo escuro e, dentro dele, outra **Image** branca com **Image Type = Filled**, **Fill Method = Horizontal**. Ligue a de dentro em `rpmFill` (embaixo, no centro), `fuelFill` e `tireFill` (embaixo, à esquerda, com um rótulo "COMB." e "PNEUS").
4. Painel `Results`: **UI → Panel** escuro com um `resultsText` (fonte monoespaçada, se tiver) e um **Button** "Continuar". Desative o painel.
5. Crie `RaceHUD` (pode ser no próprio Canvas) com **Race HUD** e ligue todas as referências.
6. A fonte pixel final vem na Fase 10; até lá, use a fonte padrão do TextMeshPro.

### ✅ Checkpoint da Fase 7
- A largada mostra 3, 2, 1 e "VAI!".
- Velocidade, marcha (com "A" ou "M"), conta-giros (fica vermelho perto do limite), volta, posição, nitro, dano e as barras de combustível e pneus mudam durante a corrida.
- No box, o centro mostra o progresso do abastecimento e da troca de pneus.
- Na chegada aparece "BANDEIRADA!" e o painel com a ordem final, a linha do jogador destacada. "Continuar" recomeça a corrida.

#### Problemas comuns
- **Textos aparecem como quadrados:** o TMP Essentials não foi importado (Fase 0.3), ou a fonte não tem os acentos do português. Use uma fonte com "Latin-1" no Font Asset.
- **Barra não esvazia:** a `Image` de dentro não está com **Image Type = Filled**, ou está sem sprite (use o sprite padrão `UISprite`).

Próxima fase: **Temporada, Economia e Save** — prêmio, pontos e progresso salvo.

---

# Parte 11 — Implementação Unity: Fase 8 (Temporada, Economia e Save)

## Fase 8 — Temporada, Economia e Save

> Objetivo desta fase: o resultado de cada corrida paga prêmio, soma pontos no campeonato e avança para o próximo GP, e tudo fica salvo em disco.

### 8.1 `SaveData` e `SaveSystem`

```csharp
// Caminho: Assets/_Project/Scripts/Season/SaveData.cs
using System.Collections.Generic;

// Uma linha da classificação do campeonato.
[System.Serializable]
public class StandingEntry
{
    public string driverName;
    public bool isPlayer;
    public int points, wins, seconds;
}

// POR QUE: tudo o que precisa sobreviver entre uma sessão de jogo e outra
// (Parte 1 §12).
// ESTRATÉGIA: só campos simples e listas, para o JsonUtility do Unity
// conseguir converter em texto. As peças são guardadas pelo id, não pelo
// asset, porque um arquivo JSON não sabe apontar para assets do projeto.
[System.Serializable]
public class SaveData
{
    public int version = 1;
    public int money;
    public List<string> ownedParts = new List<string>();
    public string[] equipped = new string[4];   // índice = (int)PartCategory
    public float damage;
    public bool automaticGearbox = true;
    public int season = 1;
    public int raceIndex;                      // próximo GP (0 = primeiro)
    public List<StandingEntry> standings = new List<StandingEntry>();
    public List<RaceResultEntry> lastResults = new List<RaceResultEntry>();
    public int lastPrize, lastPoints;
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Season/SaveSystem.cs
using System.IO;
using UnityEngine;

// POR QUE: grava e lê o progresso num arquivo JSON local (jogo offline).
// ESTRATÉGIA: Application.persistentDataPath é uma pasta do usuário que o
// Unity garante que existe e que pode ser escrita em qualquer plataforma
// (no Windows: AppData/LocalLow/<Empresa>/<Produto>).
public static class SaveSystem
{
    static string FilePath => Path.Combine(Application.persistentDataPath, "charuto_save.json");

    public static void Save(SaveData data) =>
        File.WriteAllText(FilePath, JsonUtility.ToJson(data, true));

    // Devolve null se não houver save (primeira vez) ou se o arquivo estiver corrompido.
    public static SaveData Load()
    {
        if (!File.Exists(FilePath)) return null;
        try { return JsonUtility.FromJson<SaveData>(File.ReadAllText(FilePath)); }
        catch (System.Exception e)
        {
            Debug.LogWarning("Save inválido, começando do zero: " + e.Message);
            return null;
        }
    }

    public static void Delete()
    {
        if (File.Exists(FilePath)) File.Delete(FilePath);
    }
}
```

### 8.2 `GameSession`

```csharp
// Caminho: Assets/_Project/Scripts/Season/GameSession.cs
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

// POR QUE: o ponto único de acesso ao progresso do jogador, usado pela
// Garagem e pela corrida. Concentra as regras de economia e campeonato
// (Parte 1 §5 e §6): prêmio, pontos, compra, conserto, próxima corrida.
// ESTRATÉGIA: classe static: existe uma só, sem GameObject, e continua viva
// quando a cena muda. Init carrega o save uma vez; cada mudança salva na hora.
public static class GameSession
{
    static GameConfig config;
    public static SaveData Data { get; private set; }

    public static void Init(GameConfig cfg)
    {
        config = cfg;
        if (Data == null) Data = SaveSystem.Load() ?? NewSave();
    }

    static SaveData NewSave()
    {
        var data = new SaveData { money = config.startingMoney };
        foreach (var part in config.StartingParts())
        {
            data.ownedParts.Add(part.id);
            data.equipped[(int)part.category] = part.id;
        }
        data.standings = NewStandings();
        return data;
    }

    static List<StandingEntry> NewStandings()
    {
        var list = config.season.rivals.Select(t => new StandingEntry { driverName = t.driverName }).ToList();
        list.Add(new StandingEntry { driverName = config.playerName, isPlayer = true });
        return list;
    }

    public static void NewGame()
    {
        Data = NewSave();
        SaveSystem.Save(Data);
    }

    // ---- Temporada ----

    public static int TrackCount => config.season.tracks.Length;
    public static bool SeasonOver => Data.raceIndex >= TrackCount;
    public static TrackDefinition NextTrack => SeasonOver ? null : config.season.tracks[Data.raceIndex];

    // Classificação: pontos, depois vitórias, depois segundos lugares (placeholder §5.2).
    public static List<StandingEntry> SortedStandings => Data.standings
        .OrderByDescending(s => s.points).ThenByDescending(s => s.wins).ThenByDescending(s => s.seconds).ToList();

    // O que a cena de corrida precisa para começar o próximo GP.
    public static RaceSetup CreateRaceSetup() => new RaceSetup
    {
        track = NextTrack,
        playerStats = CurrentStats,
        playerDamage = Data.damage,
        automaticGearbox = Data.automaticGearbox,
        rivals = config.season.rivals,
    };

    // Aplica o resultado: prêmio e pontos por posição (abandono não ganha
    // nada, placeholder §4.6), guarda o dano e avança para o próximo GP.
    public static void ApplyRaceResult(List<RaceResultEntry> results, float finalDamage)
    {
        Data.lastPrize = 0;
        Data.lastPoints = 0;
        foreach (var r in results)
        {
            var entry = Data.standings.FirstOrDefault(s => s.driverName == r.driverName);
            if (entry == null || r.retired) continue;
            int points = config.PointsFor(r.position);
            entry.points += points;
            if (r.position == 1) entry.wins++;
            if (r.position == 2) entry.seconds++;
            if (r.isPlayer)
            {
                Data.lastPrize = config.PrizeFor(r.position);
                Data.lastPoints = points;
                Data.money += Data.lastPrize;
            }
        }
        Data.damage = Mathf.Clamp(finalDamage, 0f, 100f);
        Data.lastResults = results;
        Data.raceIndex++;
        SaveSystem.Save(Data);
    }

    // Placeholder §5.3: zera pontos e volta ao primeiro GP; mantém dinheiro,
    // peças e dano.
    public static void StartNextSeason()
    {
        Data.season++;
        Data.raceIndex = 0;
        Data.standings = NewStandings();
        Data.lastResults.Clear();
        SaveSystem.Save(Data);
    }

    // ---- Carro e loja ----

    public static IEnumerable<PartDefinition> EquippedParts =>
        Data.equipped.Select(config.FindPart).Where(p => p != null);

    public static CarStats CurrentStats => CarStats.Build(config, EquippedParts);

    public static bool Owns(PartDefinition part) => Data.ownedParts.Contains(part.id);
    public static bool IsEquipped(PartDefinition part) => Data.equipped[(int)part.category] == part.id;

    // Compra (se der) e já instala a peça.
    public static bool Buy(PartDefinition part)
    {
        if (Owns(part) || Data.money < part.price) return false;
        Data.money -= part.price;
        Data.ownedParts.Add(part.id);
        Equip(part);
        return true;
    }

    public static void Equip(PartDefinition part)
    {
        if (!Owns(part)) return;
        Data.equipped[(int)part.category] = part.id;
        SaveSystem.Save(Data);
    }

    public static int RepairCost => Mathf.CeilToInt(Data.damage * config.repairCostPerPercent);

    // Conserto total (placeholder; conserto parcial está Em aberto).
    public static bool Repair()
    {
        if (Data.damage <= 0f || Data.money < RepairCost) return false;
        Data.money -= RepairCost;
        Data.damage = 0f;
        SaveSystem.Save(Data);
        return true;
    }

    public static void SetAutomaticGearbox(bool automatic)
    {
        Data.automaticGearbox = automatic;
        SaveSystem.Save(Data);
    }
}
```

### 8.3 `RaceResultsBridge`

```csharp
// Caminho: Assets/_Project/Scripts/Season/RaceResultsBridge.cs
using System.Collections.Generic;
using UnityEngine;

// POR QUE: liga a corrida ao campeonato sem o RaceDirector precisar saber
// que existe save ou economia.
// ESTRATÉGIA: escuta o evento RaceFinished e repassa o resultado ao
// GameSession. Corridas abertas direto no Editor (sem passar pela Garagem)
// não mexem no save, para os testes não estragarem a temporada.
public class RaceResultsBridge : MonoBehaviour
{
    [SerializeField] GameConfig config;
    [SerializeField] RaceDirector director;

    void Start()
    {
        GameSession.Init(config);
        director.RaceFinished += OnRaceFinished;
    }

    void OnDestroy()
    {
        if (director != null) director.RaceFinished -= OnRaceFinished;
    }

    void OnRaceFinished(List<RaceResultEntry> results)
    {
        if (!director.StartedFromGarage)
        {
            Debug.Log("Corrida de teste: o resultado não foi para o save.");
            return;
        }
        GameSession.ApplyRaceResult(results, director.Player.Condition.damage);
    }
}
```

### 8.4 Montar

1. No objeto `RaceDirector`, **Add Component → Race Results Bridge** e ligue `GameConfig` e o próprio `RaceDirector`.
2. No `RaceHUD`, mude **Next Scene** para `Garagem`.

### ✅ Checkpoint da Fase 8
- Por enquanto, abrir a cena `Corrida` direto mostra no Console "Corrida de teste: o resultado não foi para o save." (o fluxo completo depende da Garagem, Fase 9).
- Teste rápido sem Garagem: num script temporário, chame `GameSession.Init(config); RaceDirector.Pending = GameSession.CreateRaceSetup();` antes de carregar a cena `Corrida`. Ao terminar, o arquivo `charuto_save.json` aparece em `Application.persistentDataPath` (ele aparece no Console com `Debug.Log(Application.persistentDataPath)`) com `raceIndex: 1`, o prêmio somado em `money` e pontos em `standings`.

#### Problemas comuns
- **O save não muda depois de alterar o código de `SaveData`:** um campo novo vem com o valor padrão de C# (0, null) nos saves antigos. Durante o desenvolvimento, apague o arquivo com `SaveSystem.Delete()`.
- **Pontos indo para o piloto errado:** `ApplyRaceResult` acha o piloto pelo nome. Dois adversários com o mesmo `driverName` se confundem; os nomes precisam ser únicos.

Próxima fase: **Garagem e Loja de Peças** — a tela entre as corridas.

---

# Parte 12 — Implementação Unity: Fase 9 (Garagem e Loja de Peças)

## Fase 9 — Garagem e Loja de Peças

> Objetivo desta fase: a cena `Garagem` mostra dinheiro, próximo GP, classificação, último resultado e números do carro; tem a loja com as 4 categorias, o conserto, a escolha de câmbio e o botão para correr. O loop completo da Parte 1 §2 funciona.

### 9.1 `PartRow`

```csharp
// Caminho: Assets/_Project/Scripts/UI/PartRow.cs
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

// POR QUE: uma linha da loja: ícone, nome, o que a peça muda, preço e um
// botão que compra, instala ou mostra que já está instalada.
// ESTRATÉGIA: componente de um prefab. A Garagem cria uma linha por peça e
// chama Bind; a linha não conhece o save, só avisa o clique.
public class PartRow : MonoBehaviour
{
    [SerializeField] Image icon;
    [SerializeField] TMP_Text nameText;
    [SerializeField] TMP_Text statsText;
    [SerializeField] TMP_Text priceText;
    [SerializeField] Button button;
    [SerializeField] TMP_Text buttonText;

    public void Bind(PartDefinition part, bool owned, bool equipped, bool canAfford, System.Action<PartDefinition> onClick)
    {
        icon.sprite = part.icon;
        icon.enabled = part.icon != null;
        nameText.text = part.displayName;
        statsText.text = Describe(part);
        priceText.text = owned ? "" : $"$ {part.price:N0}";

        buttonText.text = equipped ? "INSTALADA" : owned ? "INSTALAR" : "COMPRAR";
        button.interactable = !equipped && (owned || canAfford);
        button.onClick.RemoveAllListeners();
        button.onClick.AddListener(() => onClick(part));
    }

    // Resumo dos efeitos, ex.: "+25 km/h · +5 acel. · consumo ×1,25".
    static string Describe(PartDefinition p)
    {
        var parts = new List<string>();
        if (p.maxSpeedBonusKmh != 0) parts.Add($"{p.maxSpeedBonusKmh:+0;-0} km/h");
        if (p.accelerationBonusKmh != 0) parts.Add($"{p.accelerationBonusKmh:+0;-0} acel.");
        if (p.gripBonus != 0) parts.Add($"{p.gripBonus * 100:+0;-0}% aderência");
        if (p.durabilityBonus != 0) parts.Add($"{p.durabilityBonus * 100:0}% menos dano");
        if (p.gearCount > 0) parts.Add($"{p.gearCount} marchas");
        if (p.fuelConsumptionMultiplier != 1f) parts.Add($"consumo ×{p.fuelConsumptionMultiplier:0.##}");
        if (p.tireWearMultiplier != 1f) parts.Add($"desgaste ×{p.tireWearMultiplier:0.##}");
        return parts.Count == 0 ? "peça de série" : string.Join(" · ", parts);
    }
}
```

### 9.2 `GarageScreen`

```csharp
// Caminho: Assets/_Project/Scripts/UI/GarageScreen.cs
using System.Linq;
using System.Text;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

// POR QUE: a tela entre as corridas (Parte 1 §2, passos 1, 2 e 6).
// ESTRATÉGIA: toda ação (comprar, instalar, consertar, trocar câmbio) chama
// o GameSession e depois Refresh(), que redesenha a tela inteira a partir
// do save. Assim a tela nunca mostra um valor desatualizado.
public class GarageScreen : MonoBehaviour
{
    [SerializeField] GameConfig config;
    [SerializeField] string raceSceneName = "Corrida";

    [Header("Informações")]
    [SerializeField] TMP_Text moneyText;
    [SerializeField] TMP_Text nextRaceText;
    [SerializeField] TMP_Text standingsText;
    [SerializeField] TMP_Text lastResultText;
    [SerializeField] TMP_Text statsText;

    [Header("Ações")]
    [SerializeField] TMP_Text repairText;
    [SerializeField] Button repairButton;
    [SerializeField] Toggle automaticToggle;
    [SerializeField] Button raceButton;

    [Header("Loja")]
    [Tooltip("4 botões, na ordem do enum: Motor, Câmbio, Pneus, Chassi.")]
    [SerializeField] Button[] categoryTabs;
    [SerializeField] Transform partListParent;
    [SerializeField] PartRow partRowPrefab;

    [Header("Fim de temporada")]
    [SerializeField] GameObject seasonOverPanel;
    [SerializeField] TMP_Text seasonOverText;
    [SerializeField] Button nextSeasonButton;

    PartCategory currentCategory = PartCategory.Motor;

    void Start()
    {
        GameSession.Init(config);

        for (int i = 0; i < categoryTabs.Length; i++)
        {
            var category = (PartCategory)i;   // cópia local: cada botão guarda a sua categoria
            categoryTabs[i].onClick.AddListener(() => { currentCategory = category; Refresh(); });
        }
        repairButton.onClick.AddListener(() => { GameSession.Repair(); Refresh(); });
        automaticToggle.onValueChanged.AddListener(v => { GameSession.SetAutomaticGearbox(v); Refresh(); });
        raceButton.onClick.AddListener(StartRace);
        nextSeasonButton.onClick.AddListener(() => { GameSession.StartNextSeason(); Refresh(); });

        Refresh();
    }

    void Refresh()
    {
        var d = GameSession.Data;
        moneyText.text = $"$ {d.money:N0}";

        bool over = GameSession.SeasonOver;
        seasonOverPanel.SetActive(over);
        raceButton.interactable = !over;
        if (over) seasonOverText.text = $"FIM DA TEMPORADA {d.season}\n\n{StandingsText()}";
        else
        {
            var t = GameSession.NextTrack;
            nextRaceText.text = $"Temporada {d.season} · GP {d.raceIndex + 1}/{GameSession.TrackCount}\n{t.displayName} · {t.laps} voltas";
        }

        standingsText.text = StandingsText();
        lastResultText.text = LastResultText(d);

        var s = GameSession.CurrentStats;
        statsText.text =
            $"Vel. máxima  {s.maxSpeedKmh:0} km/h\n" +
            $"Aceleração   {s.accelerationKmh:0}\n" +
            $"Aderência    {s.grip * 100:0}%\n" +
            $"Marchas      {s.gearCount}\n" +
            $"Resistência  {s.durability * 100:0}%";

        int cost = GameSession.RepairCost;
        repairText.text = d.damage > 0f ? $"Dano {d.damage:0}% · conserto $ {cost:N0}" : "Carro sem dano";
        repairButton.interactable = d.damage > 0f && d.money >= cost;
        automaticToggle.SetIsOnWithoutNotify(d.automaticGearbox);

        for (int i = 0; i < categoryTabs.Length; i++)
            categoryTabs[i].interactable = i != (int)currentCategory;
        BuildPartList();
    }

    void BuildPartList()
    {
        // Apaga as linhas antigas e cria de novo: são poucas, não pesa.
        foreach (Transform child in partListParent) Destroy(child.gameObject);

        var parts = config.allParts.Where(p => p != null && p.category == currentCategory).OrderBy(p => p.tier);
        foreach (var part in parts)
        {
            var row = Instantiate(partRowPrefab, partListParent);
            row.Bind(part, GameSession.Owns(part), GameSession.IsEquipped(part),
                     GameSession.Data.money >= part.price, OnPartClicked);
        }
    }

    void OnPartClicked(PartDefinition part)
    {
        if (GameSession.Owns(part)) GameSession.Equip(part);
        else GameSession.Buy(part);
        Refresh();
    }

    string StandingsText()
    {
        var sb = new StringBuilder();
        int pos = 1;
        foreach (var s in GameSession.SortedStandings)
        {
            string line = $"{pos++,2}. {s.driverName,-14} {s.points,3} pts";
            sb.AppendLine(s.isPlayer ? $"<color=#FFD24A>{line}</color>" : line);
        }
        return sb.ToString();
    }

    static string LastResultText(SaveData d)
    {
        var me = d.lastResults.FirstOrDefault(r => r.isPlayer);
        if (me == null) return "";
        return me.retired
            ? "Última corrida: abandono"
            : $"Última corrida: {me.position}º · +$ {d.lastPrize:N0} · +{d.lastPoints} pts";
    }

    void StartRace()
    {
        RaceDirector.Pending = GameSession.CreateRaceSetup();
        SceneManager.LoadScene(raceSceneName);
    }
}
```

### 9.3 Montar a cena `Garagem`

1. Abra `Garagem.unity`. Crie um **Canvas** (mesmo **Canvas Scaler** da HUD: 640 × 360) e, se a cena não tiver, um **EventSystem** (**UI → Event System**; no Unity 6, ele já vem com o **Input System UI Input Module**).
2. Layout sugerido (placeholder; o layout final está Em aberto, Parte 1 §10.2):
   - Barra de cima: `moneyText` (direita) e `nextRaceText` (esquerda).
   - Coluna da esquerda: `standingsText` e, embaixo, `lastResultText`.
   - Centro: 4 botões de aba (Motor, Câmbio, Pneus, Chassi), em ordem, e embaixo uma **Scroll View**. No `Content` da Scroll View, adicione **Vertical Layout Group** e **Content Size Fitter** (Vertical Fit = Preferred Size); esse `Content` é o `partListParent`.
   - Coluna da direita: `statsText`, `repairText` + `repairButton`, **Toggle** "Câmbio automático" e o botão grande "CORRER".
   - Painel `SeasonOver` (desativado) cobrindo a tela, com `seasonOverText` e o botão "Nova temporada".
3. Prefab `PartRow`: um **Panel** com **Horizontal Layout Group**, **Layout Element** (Preferred Height 40), `Image` (ícone 32×32), dois textos empilhados (nome e efeitos), texto de preço e um **Button** com texto. Adicione o componente **Part Row**, ligue os campos e salve em `Prefabs/`.
4. Crie `Garage` com **Garage Screen** e ligue tudo.
5. Na `Season_1`, coloque as pistas da temporada. Até existirem as 8 a 10 pistas finais, repita `Track_Teste` ou crie variações dela (paleta, curvas e fundo diferentes).

### ✅ Checkpoint da Fase 9
- Na primeira vez, a Garagem mostra $2.000, GP 1 e as peças de nível 1 como "INSTALADA".
- Comprar uma peça desconta o preço, instala e muda os números do carro; voltar para uma peça já comprada só instala.
- "CORRER" abre a corrida na pista do GP atual, com o câmbio escolhido. Ao terminar, "Continuar" volta para a Garagem com o prêmio somado, a classificação atualizada e o próximo GP.
- Bater na corrida faz o dano aparecer na Garagem; consertar desconta o valor e zera o dano.
- Fechar o Play e abrir de novo mantém tudo (o save funciona).
- Depois do último GP, aparece o painel de fim de temporada; "Nova temporada" zera os pontos e volta ao GP 1.

#### Problemas comuns
- **Os botões não respondem ao clique:** falta o **EventSystem** na cena, ou ele usa o `Standalone Input Module` antigo. Selecione o EventSystem e clique em **Replace with InputSystemUIInputModule**.
- **Todas as abas mostram as mesmas peças:** o lambda usou `i` direto em vez da cópia `category`. Em C#, o `i` do `for` é compartilhado pelos lambdas.

Próxima fase: **Arte no PixelLab** — trocar os retângulos provisórios pela pixel art final.

---

# Parte 13 — Implementação Unity: Fase 10 (Arte no PixelLab)

## Fase 10 — Arte no PixelLab

> Objetivo desta fase: toda a arte provisória é trocada pela pixel art final do PixelLab (Parte 1 §9), e o jogo continua funcionando sem mudar código.

### 10.1 Lista de arte do MVP

Tamanhos placeholder, pensados para a tela de 320×180 (Fase 0). O carro do jogador aparece com cerca de 96 px de largura na tela, então os carros são gerados nesse tamanho para não serem ampliados.

| Pasta (`Sprites/CharutoRacer/`) | Conteúdo | Tamanho aprox. | Quantidade |
|---|---|---|---|
| `Cars/Player/` | Carro do jogador de trás: reto, virando à esquerda, virando à direita | 96×56 | 3 |
| `Cars/Teams/` | Mesmo carro, um por equipe, nos 3 quadros | 96×56 | 27 (9 equipes) |
| `Roadside/` | Árvores (por bioma), fardo de feno, placa de propaganda da época, poste, arquibancada, muro e placa do box, casa, fiscal com bandeira | 32 a 128 de altura | ~15 |
| `Backgrounds/<Pista>/` | 2 camadas de fundo por pista (distante e próxima), com emenda horizontal invisível | 384×70 e 384×45 | 2 por pista |
| `UI/Parts/` | Ícones das 16 peças | 32×32 | 16 |
| `UI/HUD/` | Conta-giros, ícones de combustível, pneu, nitro | 16 a 48 | ~5 |
| `UI/Font/` | Fonte pixel para HUD e Garagem (com acentos do português) | — | 1 |

- **Em aberto:** cores das equipes (Parte 1 §9). Sobre a produção, há duas opções: um sprite por equipe (melhor resultado, mais gerações) ou um sprite branco tingido pela cor da equipe, como os provisórios. Tingir também tinge piloto e detalhes, então a primeira opção é a recomendada.
- **Em aberto:** arte da Garagem (fundo ilustrado, retrato do piloto).

### 10.2 Fluxo no PixelLab

Segue o fluxo que funcionou nos outros jogos do estúdio (ver `Sprites/CraftDice/PENDENTES.md`):

1. **Imagem de referência:** escolher uma imagem de exemplo do estilo desejado e salvá-la em `Sprites/CharutoRacer/example/`. O estilo é passado ao PixelLab como imagem de estilo das ferramentas **Pro Flash**; só descrever o estilo em texto costuma dar um resultado diferente do esperado.
2. **Teste de estilo:** gerar só 3 peças (carro do jogador reto, uma árvore e uma camada de fundo) e montar uma prévia da cena (fundo + estrada + árvore + carro) para aprovação antes do lote.
3. **Variações a partir do aprovado:** os quadros de curva e as cores das equipes saem por edição do carro aprovado (ferramentas de edição de imagem do PixelLab), para todos os carros terem o mesmo desenho.
4. **Lote completo:** o restante da lista 10.1. A fonte pode sair da ferramenta de fontes do PixelLab, e os ícones da ferramenta de UI.
5. **Registro:** anotar os ids do PixelLab e as receitas num `Sprites/CharutoRacer/README.md`, como nas outras pastas de `Sprites/`.

Descrição base para os prompts (placeholder): *"1960s Formula 1 cigar-shaped race car, rear view slightly from above, exposed wheels, rear engine, driver with open-face helmet and goggles, 16-bit SNES racing game style, transparent background"*.

### 10.3 Importar no Unity

1. Copie as pastas de `Sprites/CharutoRacer/` para `Assets/_Project/Art/` (`Cars`, `Roadside`, `Backgrounds`, `UI`). O `PixelArtImporter` (Fase 0.5) configura todas: Point, sem compressão, PPU 1, pivô embaixo (e no centro dentro de `UI/`).
2. **GameConfig:** troque `playerSprite...` pelos sprites de `Cars/Player/` e ajuste `playerTint` para branco.
3. **Equipes:** troque os sprites e desligue **Tint Sprite**.
4. **Pistas:** troque os sprites de `roadside` e de `backgroundLayers`, e ajuste a paleta (`palette`) para combinar com o fundo de cada pista.
5. **Peças:** arraste os ícones para `icon`.
6. **Fonte:** **Window → TextMeshPro → Font Asset Creator** com a fonte pixel, **Render Mode = Raster**, **Character Set = Extended ASCII** (inclui os acentos), e aplique nos textos.

### ✅ Checkpoint da Fase 10
- Nenhum objeto da cena usa mais sprites de `Art/Placeholder/` (dá para apagar a pasta e o jogo continua igual, só com a arte nova).
- Os carros, árvores e placas ficam nítidos (sem borrão) e "pisam" no chão.
- Os fundos deslizam nas curvas sem emenda visível.
- Os textos da HUD e da Garagem usam a fonte pixel, com acentos.

#### Problemas comuns
- **Sprite borrado:** a imagem foi importada fora de `Assets/_Project/Art/`, onde o `PixelArtImporter` não atua. Mova para lá e reimporte.
- **Carro "pulando" de tamanho entre os quadros reto e curva:** os 3 PNGs têm larguras diferentes, e o tamanho na tela é calculado pela largura do sprite. Gere (ou recorte) os 3 quadros com a mesma largura.
- **Emenda visível no fundo:** a imagem não foi gerada como repetível na horizontal. Corrija a borda no PixelLab ou deixe a camada mais larga que a tela e reduza o `curveSpeed`.

Próxima fase: **Build e Próximos Passos**.

---

# Parte 14 — Implementação Unity: Fase 11 (Build e Próximos Passos)

## Fase 11 — Build e Próximos Passos

> Objetivo desta fase: um executável de Windows que joga a temporada inteira, e a lista do que vem depois do MVP.

### 11.1 Configurar e gerar o build

1. **Edit → Project Settings → Player**: **Company Name** `MangueByte`, **Product Name** `Charuto Racer`, ícone do jogo (pode ser o carro do jogador).
2. **Resolution and Presentation**: **Fullscreen Mode** = `Fullscreen Window`. Com o `Pixel Perfect Camera`, a imagem é ampliada em múltiplos inteiros; em monitores que não são 16:9, troque **Crop Frame** para `Letterbox` para ganhar bordas pretas em vez de distorção.
3. **File → Build Profiles → Windows**: confirme as cenas na ordem `Garagem`, `Corrida` e clique em **Build**.

### 11.2 Tela de entrada

A primeira cena é a `Garagem`, que já carrega ou cria o save. Um menu principal com "Continuar" e "Novo jogo" (chamando `GameSession.NewGame()`) está **Em aberto** (Parte 1 §10.2).

### ✅ Checkpoint da Fase 11
- O executável abre na Garagem, em tela cheia, com a pixel art nítida.
- Dá para jogar a temporada inteira (todas as pistas da `Season_1`) só com teclado e também só com controle.
- Fechar e abrir o executável mantém o progresso (o save fica em `%USERPROFILE%/AppData/LocalLow/MangueByte/Charuto Racer/charuto_save.json`).

#### Problemas comuns
- **Funciona no Editor, mas o build abre com a tela preta:** a cena `Garagem` não está na lista de cenas do build, ou está fora da primeira posição.
- **Controle não funciona no build:** o controle foi conectado depois de o jogo abrir e o Windows não o reconheceu; reconecte. Se continuar, teste em **Window → Analysis → Input Debugger** no Editor.

### 11.3 Próximos passos (pós-MVP)

Todos dependem de decisões **Em aberto** da Parte 1 §14:

- **Áudio:** ronco do motor com `AudioSource.pitch` seguindo `Rpm01`, para o câmbio manual ser jogado "de ouvido"; trilha chiptune; sons de batida e de box.
- **Balanceamento:** fechar tanque, consumo, prêmios e preços para que a temporada dê tempo de comprar a maioria das peças, mas não todas.
- **Tela dividida para 2 jogadores:** duas câmeras, cada uma com o próprio `RoadRenderer` e `RoadSpriteRenderer`; a simulação (`RaceDirector`) já é separada do desenho.
- **Chuva:** menos aderência (multiplicador em `PlayerCarController`), partículas e paleta mais escura.
- **IA mais rica:** adversários que gastam combustível, param no box, batem e abandonam; evolução durante a temporada.
- **Mini-mapa e menu principal.**
- **Protótipo web:** como os outros jogos do estúdio, um protótipo jogável em `prototipos/charuto-racer/` (HTML/JS, sem build) seguindo a Parte 1 ajudaria a fechar o balanceamento antes do Unity.

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
