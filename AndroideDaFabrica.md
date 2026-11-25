# Androide da Fábrica — GDD inicial

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

## Visão geral

Androide da Fábrica é o **Guerreiro da Masmorra (app)** num mundo de robôs, com visual de fliperama neon 8-bit. Um androide sai do hangar para invadir fábricas tomadas por bots. Cada fábrica tem três ondas, e o chefe vem na última. A luta é a do app, por turnos com reações: aparar, pular, esquivar, abaixar, Sobrecarga (a Fúria do app) e especiais.

As regras, os números, o mapa, a árvore de habilidades, as missões e os heróis são **os do Guerreiro da Masmorra (app)**. O código do protótipo [`prototipos/guerreiro-da-masmorra-app/`](prototipos/guerreiro-da-masmorra-app/) é a especificação (ver o README dele). Este documento define o que muda: o tema, o visual e os nomes. Uma regra nova deste jogo é escrita aqui.

"Androide da Fábrica" é nome de trabalho.

**Pilares**

- **Tudo é máquina.** Herói, aliados e inimigos são robôs. As masmorras são fábricas, o acampamento é um hangar e o dinheiro é crédito.
- **Fliperama neon.** Fundo preto, linhas acesas com brilho, poucas cores saturadas, pixel grande, scanlines de monitor CRT.
- **A luta não muda.** Reações, Sobrecarga, especiais, a mão de cartas do Hacker: o mesmo combate do app.

**Plataforma:** web (o protótipo; abrir por um servidor http, como o do app). **Em aberto:** plataformas da versão final e se o jogo terá guia de implementação próprio.

**Protótipo:** [`prototipos/androide-da-fabrica/`](prototipos/androide-da-fabrica/).

## Estética: terminal neon 8-bit

**Definido**

- **Bots em código:** cada personagem é um robô montado por peças (tronco, cabeça, braços, pernas ou rodas, arma), com miolo escuro e contorno aceso na cor dele.
  - Cada folha de animação é gerada com o mesmo tamanho de quadro, o mesmo número de quadros e o corpo na mesma caixa do sprite original. As animações são parado, correndo, golpe, segundo golpe, defesa, cura e surgir do chão.
  - Os quadros são desenhados em baixa resolução e ampliados sem suavizar (pixel 8-bit), com a transparência arredondada.
- **O herói** é um androide ciano de capacete com antena, escudo redondo e lâmina magenta, em 8 direções. A batalha mostra ele de costas, e o hangar de frente.
- **Cenário da batalha:** um corredor de grade neon em perspectiva (a mesma geometria do app), com sol listrado, montanhas de arame e uma cidade de prédios acesos no horizonte. Nas margens há postes, torres de servidor e antenas. Nos interiores, paredes e teto de painéis com LEDs. Cada bioma tem um par de cores.
- **Brilho (bloom)** no canvas da batalha e no do mapa.
- **Resto da arte** (baús, efeitos, mapa-múndi, ícones, molduras 9-slice da UI): passa por um **filtro neon** automático. As bordas acendem numa cor da paleta, e o miolo escurece. Alguns ícones têm desenho próprio:
  - crédito (ficha hexagonal);
  - Núcleo (o Soul do app);
  - células (as poções);
  - bateria (a tocha);
  - mira do alvo (quatro cantos amarelos).
- **Hangar:** horizonte de grade synthwave no lugar do vídeo da fogueira.
- **Letra de terminal** (VT323, com `font-size-adjust` para não quebrar o layout do app) e scanlines CRT por cima de tudo.
- Sem a ilustração grande da vitória/derrota (era arte medieval).

## Glossário: do Guerreiro para o Androide

O código continua com os nomes do app. A troca é feita **na saída**: um tradutor (`neon-skin.js`, `DICT`) troca as palavras no texto da página e no texto desenhado no canvas, preservando maiúsculas.

| Guerreiro da Masmorra (app) | Androide da Fábrica |
| --- | --- |
| Guerreiro (Cavaleiro do acampamento) | Androide (Sentinela do hangar) |
| Mago Arcanista | Hacker Arcano |
| Caçadora, Lanceiro, Monge | Atiradora, Lanceiro, Monge-Bot |
| masmorra | fábrica |
| acampamento | hangar |
| Campo de Treinamento, Boneco de Treino | Simulador de Treino, Robô de Treino |
| ouro | créditos |
| Souls | Núcleos |
| tochas | baterias |
| poções | células |
| baú (Baú do Dia) | caixote (Caixote do Dia) |
| Fúria | Sobrecarga |
| maldição | pane |
| goblin | gremlin |
| cavaleiro | mecha |
| Castelo, Floresta, Cemitério, Ruínas | Refinaria, Estufa, Ferro-Velho, Ruínas |
| Cripta, Igreja Profanada, Salão do Castelo | Servidor, Capela Hackeada, Salão de Máquinas |
| Pedraverde, Lago Bruma, Solar Silente, Torre Rubra, Bosque Ermo, Castelo Ruína | Silício Verde, Lago de Óleo, Usina Silente, Antena Rubra, Pátio Ermo, Refinaria em Ruína |

## Bots (proposta)

Vida, ataque e defesa são os do inimigo do app. Na tabela, "Unidade" é o id em `UNITS` (as de cor de fábrica, como `red_pawn`, ganham a cor da fábrica).

| Unidade | App | Androide da Fábrica | Como é |
| --- | --- | --- | --- |
| `*_pawn` | peão | — | robozinho de roda com faca e antena |
| `*_archer` | arqueiro | — | robô de olho único com arco de energia |
| `*_lancer` | lanceiro | — | robô de capacete, escudo e lança |
| `*_monk` | monge | — | robô de capuz e túnica com cajado; "ataque" é a cura, com um anel verde |
| `*_boss` | Cavaleiro (cor) | Mecha (cor) | capacete com chifres, capa, sabre e escudo |
| `*_torch`, `gobtorch` | Goblin da Tocha | Gremlin Maçarico | robozinho com maçarico |
| `*_tnt`, `gobtnt` | Goblin Dinamite | Gremlin Dinamite | robozinho que arremessa dinamite |
| `blackknight` | Cavaleiro Negro | Mecha Negro | aço com viseira vermelha, sabre e escudo |
| `skelarcher` | Arqueiro Espectral | Atirador Espectral | esqueleto de metal com arco |
| `gravelancer` | Lanceiro Sepulcral | Lanceiro de Plasma | esqueleto de metal verde com lança |
| `cultist` | Cultista | Cultista do Código | capuz roxo, túnica, faca |
| `lich` | Lich Amaldiçoado | Lich Corrompido | caveira flutuante de coroa e cajado |
| `ogre` | Ogro Carrasco | Ogro Prensa | robô largo com porrete |
| `wraith` | Espectro Ladino | Holograma Ladino | capuz flutuante com garras |
| `imp` | Servo Deformado | Servo Defeituoso | diabinho de chifres e garras |
| `necro`, `shaman` | Necromante | Necromante Digital | capuz verde com cajado |
| `serpent`, `snake` | Serpente Podre | Serpente de Cabo | gomos de cabo com cabeça de plugue |
| `commander`, `_bone`, `_ash` | Comandante (aço, osso, cinzas) | Comandante | coroa, capa, sabre; aço, branco ou laranja |
| `kingslime` | Rei Slime | Rei Gosma | gosma de óleo com coroa |
| `tree` | Árvore Anciã | Árvore de Cabos | tronco de cano, galhos de cabo e folhas de LED |
| `mino`, `minolord` | Minotauro (Ancestral) | Minotauro Hidráulico / Blindado | chifres e machado |
| `gnome` | gnomo | — | robozinho de cúpula com cajado |
| `thief` | ladrão | — | capuz com duas facas |
| `spider` | Aranha Gigante | Aranha-Drone | cúpula de um olho, oito pernas |
| `skull` | caveira | — | caveira-drone com propulsores |
| `gnoll` | Gnoll Arremessador | Lançador de Sucata | robô que arremessa pedra |
| `lizard` | Lagarto Cuspidor | Lagarto Lança-Óleo | robô de cúpula com rabo e garras |
| `harpoonfish`, `paddlefish` | Peixe Arpoador, Peixe-Remo | Drone Arpoador, Drone-Remo | peixe-drone num propulsor |
| `turtle` | Tartaruga Blindada | Tanque-Tartaruga | casco hexagonal sobre esteira |
| `wlancer` | Cavaleiro Selvagem | Mecha Selvagem | lanceiro numa roda |
| `bear`, `panda` | Urso Feroz | Urso Mecânico | quadrúpede de chapas que dá patada |
| `troll` | Troll das Cavernas | Troll de Chapa | robô enorme de braços longos |

Os inimigos que no app olham para a câmera (`faceFront`) saem de frente. Os outros saem de lado, e o motor os espelha como no app.

## Diferenças do protótipo

- **Cópia mantida à mão:** `prototipos/androide-da-fabrica/index.html` é uma cópia do `index.html` do app. As únicas mudanças são título, ícone, save, fontes e a ligação dos três arquivos neon. Reimportar o APK **não** atualiza esta pasta.
- **Save próprio:** `androide-fabrica-save-v1`.
- **Como funciona** (detalhes no README do protótipo):
  - `neon-bots.js` gera as folhas de robôs.
  - `neon-skin.js` instala tudo por cima do jogo: as folhas de `IMGS` viram robôs na primeira vez que são pedidas, e o `heroSheet` devolve as folhas do herói. As funções de cenário são trocadas, o `draw` ganha o brilho, o `drawImage` passa as outras imagens pelo filtro neon, e o tradutor cuida dos textos.
  - `neon.css` cuida das cores, da letra e do fundo do hangar.

## Em aberto (geral)

- Nome definitivo.
- Ícones e telas que ainda vêm do filtro automático (Mercado, Habilidades, Missões, mapa-múndi): ganhar desenho próprio?
- Os emojis do app (⚔️🔥🧨) continuam; trocar por ícones neon?
- Som: o mesmo do app.
- Os heróis recrutáveis usam os robôs das unidades (Hacker = monge roxo, Atiradora = arqueiro azul...); merecem um desenho próprio, como o Androide em 8 direções?

## Histórico de versões

- **0.1.0** (2026-11-25): primeira versão. É o Guerreiro da Masmorra (app) com robôs desenhados em código para todas as unidades e o herói em 8 direções, e com um corredor de grade neon na batalha. Brilho, filtro neon para o resto da arte, textos no tema de robôs, letra de terminal e scanlines. As regras são as do app, e o save é próprio.
