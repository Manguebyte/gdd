# Terminal de Aventuras — GDD inicial

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

## Visão geral

Terminal de Aventuras é o [Caderno de Aventuras](CadernoDeAventuras.md) num mundo de robôs, com visual de fliperama neon 8-bit. Um robô explorador anda por um mundo de máquinas. O mapa não existe até o scanner dele alcançar: uma **IA** vai traçando cada quadrado em linhas de neon num terminal. Os inimigos são **bots**, e a luta é decidida nos dados: cada peça equipada dá dados, e a soma é o dano.

As regras, os números e a geração do mundo são **os mesmos do Caderno de Aventuras 0.9.0**. Este documento define o que muda (o tema, o visual, os nomes) e aponta para o GDD do Caderno nas regras que não mudaram. Uma regra nova ou um número novo deste jogo é escrito aqui, não no GDD do Caderno.

"Terminal de Aventuras" é nome de trabalho.

**Pilares**

- **O mundo é traçado enquanto você anda.** O jogador nunca vê um mapa pronto: cada quadrado aparece quando o scanner chega perto, desenhado em neon pelo laser da IA.
- **Todo poder é um punhado de dados.** Equipamento não dá "+3 de ataque": dá dados. O cano de sucata inicial dá 1d6; a melhor lâmina do jogo dá 5d20.
- **Fliperama neon.** Fundo preto, linhas finas acesas com brilho, poucas cores saturadas, pixel grande e scanlines de monitor CRT. Nenhuma imagem pronta.
- **A escolha de brigar é do jogador.** Bots desenhados no mapa não perseguem ninguém.
- **Sempre tem um chefe no fundo.** Cada bot tem uma versão chefe (Rato-bô Alfa, Aranha-Rainha...) no fundo da sua base.
- **Estações, não cidades.** Como num souls-like, não há cidades: há estações de recarga. Recarregar conserta o robô, mas todo bot vencido religa.
- **Cada bioma é uma zona.** Ferro-Velho, Deserto de Silício, Picos Criogênicos, Brejo Tóxico e Fundição. Cada zona é uma ilha inteira, e cada uma da segunda em diante traz uma regra própria.

**Plataforma:** o protótipo é web (HTML/JS, sem build), funciona em desktop e celular e se instala como app (PWA), como o do Caderno. **Em aberto:** plataformas da versão final e se o jogo terá um guia de implementação próprio (hoje só tem este GDD).

**Protótipo:** [`prototipos/terminal-de-aventuras/`](prototipos/terminal-de-aventuras/). Os números são os do Caderno e valem como **proposta** de balanceamento.

## Estética: terminal neon 8-bit

**Definido**

- A tela é um terminal: fundo preto (`#05060f`), uma grade azul-escura presa ao mapa (no lugar da pauta do caderno) e uma barra magenta com marquinhas de régua à esquerda (no lugar da margem vermelha).
- **Linha de neon** (traço cheio, quase reto, quinas vivas) desenha o mapa e os contornos. A pintura que no Caderno era hachura de lápis virou **linhas de varredura** horizontais e finas, como num monitor CRT.
- **Pixel 8-bit:** o quadro inteiro é desenhado num canvas 2 vezes menor que a tela e ampliado sem suavizar.
- **Brilho (bloom):** depois de ampliado, o quadro ganha um brilho em volta de tudo o que é aceso.
- **Terreno apagado, coisas acesas:** o terreno é desenhado com metade do brilho, para bots, estações, caixotes e portais saltarem aos olhos.
- **Paleta:** ciano claro na linha principal, mais ciano, azul, verde, verde-limão, amarelo, laranja, vermelho, roxo e magenta. "O que é meu" (herói, estações) puxa para ciano e amarelo; os bots usam a cor da sua família.
- **Letra de terminal:** textos em VT323; o título da capa em Press Start 2P.
- **Scanlines e vinheta** de monitor CRT por cima de tudo (CSS).
- O herói é um robô explorador: cabeça quadrada de viseira azul, antena, corpo vermelho e uma lâmina.
- O que já foi resolvido ganha um **X vermelho** por cima, como no Caderno.
- **Noite** é a IA baixando o brilho da tela, menos um círculo de luz em volta do herói (amarelo, com a lanterna ligada).
- O caminho percorrido fica marcado com um tracejado ciano.
- Som: o mesmo som sintetizado do Caderno. **Em aberto:** trocar o "rabisco de caneta" por um zumbido de laser.

## A IA

A IA tem o papel do mestre do Caderno (ver "O mestre" em [`CadernoDeAventuras.md`](CadernoDeAventuras.md)):

- **O laser da IA** aparece na ponta do traço enquanto um quadrado novo é desenhado: um ponto branco com uma mira e o feixe vindo de cima, na cor do traço.
- **Narração:** a caixa "IA:" comenta o que acontece, com as mesmas regras de quando falar.
- **Religar:** quando o herói recarrega numa estação (ou apaga), a IA apaga os X dos bots vencidos, e eles religam.
- **Robôs no caminho:** os de balão com "?" dão dicas e às vezes um presente; os de balão amarelo com "!" têm nome e dão missões.
- **Portais:** no fim de cada zona, um portal leva à próxima, e a IA carrega a zona nova. Ao entrar numa base, a IA carrega a planta dela.

## Glossário: do Caderno para o Terminal

O código do protótipo ainda usa os nomes do Caderno nas variáveis e nos ids. Esta tabela liga os dois.

| Caderno de Aventuras | Terminal de Aventuras | No código |
| --- | --- | --- |
| caderno | terminal | — |
| mestre, caneta, lápis, borracha | IA, laser, linhas de varredura, "a IA apaga" | — |
| página (5) | zona (5) | `página`, `pg`, `PAGINAS` |
| virar a página, canto dobrado | atravessar o portal, portal | `passagem`, `volta` |
| fogueira / acampamento | estação de recarga | `fogueira`, `FOGUEIRAS` |
| descansar / dormir | recarregar / hibernar | `rest()` |
| desmaiar | apagar | `faint()` |
| masmorra | base | `masmorra`, `MASMORRAS` |
| escada (de masmorra) | elevador | `descer`, `subir`, `saida`, `atalho` |
| rei / rainha | Alfa / Rainha | `chefe_<id>` |
| monstro | bot | `monstro`, `MONSTERS` |
| Dragão Vermelho, covil | Mecadragão Vermelho, ninho | `dragao`, `covil` |
| tocha (acender) | lanterna (ligar) | `tocha`, `tochas` |
| moedas / ouro | créditos | `ouro` |
| poção (beber) | célula (usar) | `pocao_*` |
| feitiço, magia (PM) | programa, energia (EN) | `SPELLS`, `pm` |
| maldição | pane | `maldicao` |
| baú | caixote | `bau` |
| despojos | peças | `PARTS` |
| chave (da porta trancada) | cartão de acesso | `chave` |
| cara de pedra (enigma) | terminal de enigmas | `enigma` |
| ferreiro, maga, mercador, veterana | mecânico, programadora, mercador, veterana | `ferreiro`, `maga`... |

## Mundo

**Definido:** o mesmo mundo do Caderno ("Mundo" e "Regras de cada página" em [`CadernoDeAventuras.md`](CadernoDeAventuras.md)): 5 ilhas de 48 × 34, 3 regiões de perigo por zona, 5 estações, a passagem para a próxima zona e o guardião dela, bases, robôs de missão e de dica, placas e a arena. A geração é a mesma, sorteio por sorteio: **a mesma semente gera o mesmo mapa nos dois jogos**. Muda o nome e o desenho de cada terreno.

| Zona | Líquido (bloqueia) | Chão claro | Chão | Esconde bots | Esconde mais bots | Alto (bloqueia) | Regra da zona |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Ferro-Velho | óleo | cascalho | chão de placas | sucata | graxa | prédios em ruínas | — |
| 2. Deserto de Silício | oásis de refrigerante | areia de silício | dunas | painéis solares | areia movediça | rochedos | tempestade de areia, miragens |
| 3. Picos Criogênicos | água gelada | gelo | neve | radiadores congelados | neve funda | picos nevados | gelo escorregadio |
| 4. Brejo Tóxico | lodo tóxico | lama | chão podre | canos retorcidos | brejo químico | chaminés | névoa tóxica, zumbis-ciborgues à noite |
| 5. Fundição | aço derretido | escória | chapa quente | guindastes queimados | respiros de vapor | altos-fornos | vazamento de aço derretido |

As regras das zonas são as do Caderno com outro nome. Tempestade de areia e miragens são as do Deserto. O gelo escorregadio é o das Montanhas Geladas. Névoa tóxica e bots da noite são a neblina e os mortos do Pântano Sombrio. O vazamento de aço derretido é a erupção do Vulcão: as mesmas regras, com aço no lugar da lava.

**Estações** (5 por zona, na ordem do caminho): Capacitor, Resistor, Transistor, Diodo, Relé · Bobina, Antena, Fusível, Soquete, Bateria · Servo, Motor, Pistão, Engrenagem, Turbina · Sensor, Radar, Sonar, Giroscópio, Válvula · Reator, Plasma, Fusão, Ignição, Núcleo.

**Robôs de missão** (um por região): Seu Rebite, Dona Bobina, Tio Pistão, Vó Ferrugem, Mestre Chip, Dona Antena, Seu Fusível, Dona Placa, Tio Diodo, Vó Engrenagem, Seu Volt, Dona Válvula, Mestre Bit, Dona Turbina, Seu Servo.

## Bots (proposta)

Vida, ataque, defesa, créditos e experiência são os do monstro do Caderno no mesmo lugar ("Monstros (proposta)" em [`CadernoDeAventuras.md`](CadernoDeAventuras.md)). Cada bot é desenhado em código como um robô da sua cor.

| Região | Caderno | Bot | Como é | Peça que deixa | Base e chefe |
| --- | --- | --- | --- | --- | --- |
| 1 | Slime | Gosma de óleo | poça viva de óleo, com brilho de arco-íris | gota de óleo | Tanque da Gosma-Mãe |
| 1 | Rato gigante | Rato-bô | caixa sobre duas rodas, rabo de cabo com plugue | cauda de cabo | Bueiro do Rato-bô Alfa |
| 2 | Goblin | Gremlin | cabeção de lata com antenas de prato, chave inglesa | parafuso solto | Oficina do Gremlin Alfa |
| 2 | Lobo | Lobo-robô | quadrúpede de chapas, pernas de pistão | presa de aço | Canil do Lobo-robô Alfa |
| 3 | Aranha gigante | Aranha-drone | cúpula de um olho, oito pernas articuladas | perna articulada | Ninho da Aranha-Rainha |
| 3 | Orc | Brutamontes | peito de caixa-forte, marreta | placa amassada | Galpão do Brutamontes Alfa |
| 4 | Escorpião gigante | Escorpião blindado | gomos de chapa, ferrão de laser | ferrão laser | Fenda do Escorpião Alfa |
| 4 | Naja | Naja de cabo | cabo enrolado, capuz de ventoinha | fio de cobre | Silo da Naja-Rainha |
| 5 | Esqueleto | Esqueleto de metal | o esqueleto de um robô, viseira vermelha | vértebra de aço | Cemitério de Robôs do Esqueleto Alfa |
| 5 | Múmia | Múmia de fita | robô enrolado em fita isolante | rolo de fita isolante | Pirâmide da Múmia-Rainha |
| 6 | Verme da areia | Verme perfurador | gomos saindo da areia, broca na ponta | broca gasta | Túnel da Verme-Rainha |
| 6 | Golem de pedra | Golem de silício | bloco de chip com perninhas de pino | lasca de silício | Pedreira do Golem Alfa |
| 7 | Lobo do gelo | Lobo criogênico | o lobo-robô em azul | cristal de gelo | Câmara Fria do Lobo Criogênico Alfa |
| 7 | Boneco de neve malvado | Robô de neve malvado | três esferas, nariz de cone de trânsito | cone de trânsito | Fábrica de Gelo do Robô de Neve Alfa |
| 8 | Yeti | Yeti-tanque | corpo peludo de cabos sobre esteira | esteira rasgada | Geleira do Yeti-tanque Alfa |
| 8 | Ogro | Ogro hidráulico | barrigão de tanque, braços de pistão | mangueira de óleo | Garagem do Ogro Alfa |
| 9 | Espírito do gelo | Holograma gelado | fantasma de luz com faixas de interferência | pixel congelado | Servidor Gelado da Holograma-Rainha |
| 9 | Troll | Troll de chapa | bloco rebitado de braços compridos | rebite | Fosso do Troll Alfa |
| 10 | Zumbi | Zumbi-ciborgue | meia cara de metal, olho de LED | chip podre | Laboratório do Zumbi Alfa |
| 10 | Sapo gigante | Sapo de lata | lata de olhos de câmera, língua de mola | língua de mola | Lagoa Química do Sapo Alfa |
| 11 | Fantasma | Fantasma digital | lençol de pixels em degraus | arquivo corrompido | Rede Abandonada da Fantasma-Rainha |
| 11 | Bruxa do pântano | Hacker do brejo | capuz, rosto de tela, notebook aceso | senha roubada | Lan House da Hacker-Rainha |
| 12 | Cavaleiro negro | Cavaleiro mecha | elmo de fenda, escudo com raio, lança | emblema negro | Torre de Rádio do Cavaleiro Alfa |
| 12 | Ceifador | Ceifador industrial | manto de lona, máscara, foice de serra | dente de serra | Serraria do Ceifador Alfa |
| 13 | Salamandra de fogo | Salamandra de solda | lagarto de chapa com maçaricos nas costas | bico de solda | Oficina de Solda da Salamandra-Rainha |
| 13 | Diabrete | Diabrete-chip | diabinho de placa de circuito, garfo de tomada | chifre de antena | Placa-Mãe do Diabrete Alfa |
| 14 | Cão infernal | Cão-maçarico | o lobo-robô em vermelho, em chamas | coleira em brasa | Canil Quente do Cão-maçarico Alfa |
| 14 | Elemental de fogo | Elemental de plasma | chama viva num anel de contenção | bolha de plasma | Reator do Elemental Alfa |
| 15 | Golem de magma | Golem de fundição | o golem escuro, rachado de brasa | lingote quente | Alto-Forno do Golem de Fundição Alfa |
| 15 | Fênix | Fênix de plasma | pássaro de chapas, cauda em chama | pena de plasma | Chaminé da Fênix-Rainha |
| fim | Dragão Vermelho | **Mecadragão Vermelho** | asas de chapa, pescoço de pistão, boca de lança-chamas | — | Ninho do Mecadragão |

- **Chefe:** o mesmo bot com uma **coroa de circuito** dourada.
- **Guardiões dos portais:** Brutamontes de Guerra, Verme Colossal, Troll Blindado e Cavaleiro Exterminador. Usam um capacete de combate com duas antenas no lugar da coroa.
- **Lendários:** Dentuço, o Lobo Sem Dono; Rainha das Dunas; Pé-de-Esteira; Glitch Errante; Faísca, o Diabrete Ladrão. Têm um halo dourado tracejado e uma estrela na cabeça.
- **Golpes especiais** (as mesmas regras de "Golpes especiais dos monstros" do Caderno; a maldição se chama **pane**): Teia elétrica, Curto-circuito, Fita grudenta, Tela congelada, Vírus, Invasão de sistema, Corte de energia, Pane no circuito e Rajada de plasma dão pane. Soco de silício, Pistão hidráulico, Pancada de chapa, Punho incandescente e Garra hidráulica quebram dados. Os guardiões têm Marretada, Broca colossal, Pancada blindada e Lâmina de vírus.

## Itens e programas (proposta)

Dados, preços e lojas são os do Caderno ("Itens (proposta)" e "Feitiços (proposta)").

| Caderno | Terminal | | Caderno | Terminal |
| --- | --- | --- | --- | --- |
| Espada de madeira | Cano de sucata | | Tampa de panela | Tampa de lixeira |
| Espada curta | Faca vibratória | | Escudo de madeira | Escudo de sucata |
| Espada de ferro | Lâmina de aço | | Escudo de ferro | Escudo de aço |
| Machado de guerra | Serra circular | | Escudo de torre | Escudo de choque |
| Espada de prata | Lâmina de titânio | | Escudo rúnico | Escudo de energia |
| Montante | Martelo hidráulico | | Escudo de dragão | Escudo do Mecadragão |
| Espada rúnica | Lâmina de plasma | | Roupa de couro | Chapa de lata |
| Espada de cristal | Lâmina de fótons | | Cota de malha | Malha de cabos |
| Lâmina do Dragão | Lâmina do Mecadragão | | Armadura de placas | Blindagem de placas |
| Poção de vida | Célula de reparo | | Armadura de gelo | Blindagem criogênica |
| Poção de magia | Célula de energia | | Armadura rúnica | Blindagem quântica |
| Poção grande | Célula de reparo grande | | Armadura de dragão | Blindagem do Mecadragão |

**Programas** (gastam energia, EN, e ignoram a defesa do bot): Choque (Faísca), Autorreparo (Cura), Bola de plasma (Bola de fogo), Raio iônico (Raio), Reparo total (Cura maior), Pulso criogênico (Nevasca), Bombardeio orbital (Meteoro).

**Habilidades passivas:** as 25 do Caderno, com os mesmos efeitos. Mudam 8 nomes: Mente leve → Bateria econômica, Faísca extra → Overclock, Fé → Antivírus, Fôlego → Resfriamento, Magia sedenta → Programa sedento, Magia dupla → Programa duplo, Feitiço tonto → Programa tonto, Bênção do mestre → Bênção da IA.

## Regras que não mudaram

Valem as seções do [`CadernoDeAventuras.md`](CadernoDeAventuras.md), lendo os nomes pelo glossário acima:

- Movimento; Dia e noite (com lanterna no lugar de tocha); Monstro lendário; Masmorras e chefes (as 4 variações de base: porta com cartão de acesso, armadilhas, terminal de enigmas, andar de baixo); Guardiões das passagens e escadas escondidas (elevador secreto); Missões; Combate; Personagem e progressão; Fogueiras (estações); Atacar gente (atacar robôs); Baús (caixotes); Salvamento.
- **Enigmas:** o terminal de enigmas faz as mesmas charadas do Caderno ("O que é, o que é?"). A IA coleciona as charadas dos humanos.

**Diferenças do protótipo:**

- Save próprio (`terminal-aventuras-save-v1`). Ele não lê o save do Caderno, e o Caderno não lê o dele.
- **Conta, save na nuvem e arena PvP: desligados.** O código está lá, mas o `FIREBASE_CONFIG` do jogo é `null` até o jogo ter um projeto Firebase próprio, com as coleções `terminal-saves`, `terminal-arena` e `terminal-lutas`. Sem conta, o portão da arena fica fechado.
- Sem Google Analytics (o ID do Caderno mediria os dois jogos juntos).

## Em aberto (geral)

- Nome definitivo.
- Plataformas da versão final e se o jogo ganha um guia de implementação (Unity ou web) próprio.
- Som próprio (zumbido de laser no lugar do rabisco, bipes de terminal).
- Projeto Firebase próprio para ligar conta, nuvem e arena.
- Se o pixel 8-bit (2 pixels de tela por pixel) fica legível em celulares pequenos. O protótipo aceita `?pix=1` (sem pixel) até `?pix=4`.

## Histórico de versões

- **0.1.0** (2026-11-25): primeira versão. É o Caderno de Aventuras 0.9.0 no tema de robôs, com visual de terminal neon 8-bit. Todos os monstros viraram bots desenhados em código, e mudaram os nomes de terrenos, estações, itens, programas, golpes, habilidades e falas. O desenho tem pixel 2×, brilho (bloom), scanlines e terreno apagado. As regras, os números e a geração do mundo são os do Caderno. O jogo tem save próprio, e nuvem, arena e Analytics estão desligados.
