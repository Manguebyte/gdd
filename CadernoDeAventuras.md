# Caderno de Aventuras — GDD inicial

**Versão:** 0.7.0 · [histórico](#histórico-de-versões)

Oct 26, 2026 · @Abraão Alves Vila NOVA

## Visão geral

Caderno de Aventuras recria o RPG que a gente jogava no caderno da escola. Um colega era o "mestre": o personagem ia andando e o mestre ia desenhando o mapa com canetas coloridas. Itens, feitiços, moedas e os ícones de ataque e defesa eram desenhados com lápis de cor. Quando aparecia um monstro, o jogador escolhia se enfrentava, e a luta era decidida nos dados: cada item dava dados, e a soma era o dano.

"Caderno de Aventuras" é nome de trabalho.

**Pilares**

- **O mundo é desenhado enquanto você anda.** O jogador nunca vê um mapa pronto: cada quadrado aparece quando ele chega perto, traçado à mão pela caneta do mestre.
- **Todo poder é um punhado de dados.** Equipamento não dá "+3 de ataque": dá dados. A espada inicial dá 1d6; a melhor arma do jogo dá 5d20.
- **Tudo parece feito à mão.** Folha pautada, margem vermelha, caneta para o mapa e lápis de cor para pintar. Nenhum gráfico "limpo".
- **A escolha de brigar é do jogador.** Monstros desenhados no mapa não perseguem ninguém; enfrentar ou dar a volta é decisão de quem joga.
- **Sempre tem um rei no fundo.** Cada monstro tem uma versão chefe (Rei Rato, Rainha Aranha...) esperando no fundo da sua masmorra.
- **Fogueiras, não cidades.** Como num souls-like, não há vilas: há acampamentos com fogueira espalhados pelas páginas. Descansar cura, mas todo monstro vencido volta; os guerreiros que descansam ali vendem o que o herói precisa.
- **Cada bioma é uma página do caderno.** Campos, Deserto, Montanhas Geladas, Pântano Sombrio e Vulcão: cada um ocupa uma folha inteira, do tamanho de uma ilha, para ter muito o que explorar antes de virar a página.
- **Cada página traz uma novidade.** Da segunda página em diante, cada uma tem uma regra própria (tempestade de areia, gelo escorregadio, neblina, erupções), e toda página tem um monstro lendário que foge do herói. Assim a página nova tem algo novo para aprender, não só monstros mais fortes.

**Plataforma:** o protótipo é web (HTML/JS, sem build) e funciona em desktop e celular, em pé ou deitado. No celular ele **se instala como app** (PWA): pelo botão "Instalar no celular" da capa (Android) ou por Compartilhar → "Adicionar à Tela de Início" (iPhone), ganha ícone, abre em tela cheia, gira junto com o celular e joga sem internet (os arquivos ficam guardados no aparelho; o save continua no armazenamento do navegador e, com conta, também na nuvem: ver Conta e save na nuvem). O guia de implementação (Parte 2 em diante) é em **Unity 6**. **Visitas:** o protótipo no site conta quantas pessoas o abrem com o Google Analytics, e só isso (nenhum evento do jogo, nada pessoal); a capa avisa. **Em aberto:** em quais plataformas a versão final sai (web, PC, celular).

**Protótipo:** [`prototipos/caderno-de-aventuras/`](prototipos/caderno-de-aventuras/). Os números deste documento são os do protótipo e valem como **proposta** de balanceamento.

## Estética: caderno, caneta e lápis de cor

**Definido**

- A tela é uma folha de caderno: papel creme, pauta azul, margem vermelha e furos de espiral à esquerda. A pauta acompanha o mapa (cada quadrado do mapa ocupa duas linhas).
- **Caneta** (traço cheio) desenha o mapa e os contornos: costa azul, árvores verdes, montanhas marrons, barracas listradas e fogueiras.
- **Lápis de cor** (hachura translúcida, em zigue-zague) pinta: água, copa das árvores, corpo dos monstros, ícones, dados.
- Letra de mão em tudo: títulos em Caveat, textos em Patrick Hand.
- Nenhuma imagem pronta. Mapa, monstros, herói, ícones e dados são gerados por código como listas de traços tremidos, com semente fixa, então o mesmo lugar sai igual ao recarregar.
- O herói é um boneco-palito de capa vermelha e espada.
- O que já foi resolvido (monstro vencido, baú aberto, masmorra limpa, dragão derrotado) ganha um **X de caneta vermelha** por cima, como o mestre fazia.
- **Noite** é o mestre pintando a folha de azul-escuro com lápis (hachura por cima do mapa), menos um círculo de luz em volta do herói.
- O caminho que o herói percorreu fica marcado com um tracejado de lápis.
- Som sintetizado, sem arquivos: rabisco de caneta enquanto o mestre desenha, dados chacoalhando, moedas, golpe.

## O mestre

O mestre não aparece, mas está em todo lugar:

- **A caneta do mestre** aparece na ponta do traço enquanto um quadrado novo é desenhado, com a cor da tinta que está usando.
- **Narração:** um balão "Mestre:" comenta o que acontece. Na primeira vez em cada terreno ("Floresta! O mestre rabisca um monte de arvorezinhas"), ao entrar numa região mais perigosa, ao chegar numa fogueira, ao bater na água ou na montanha.
- **A borracha do mestre:** quando o herói descansa numa fogueira (ou desmaia), o mestre apaga os X dos monstros vencidos: eles voltam para o mapa.
- **Personagens no caminho:** os de balão com "?" azul dão dicas das regras e às vezes um presente; ao conversar de novo, dão outra dica. Os de balão amarelo com "!" vermelho têm nome e dão missões (ver Missões).
- **Virar a página:** ao chegar no canto dobrado no fim de uma página, o mestre vira a folha e começa o bioma seguinte. Ao descer numa masmorra, ele tira a página da tela e desenha o interior numa folha à parte; ao subir, volta para a página de cima.
- Avisa quando anoitece ("O mestre pinta a folha de azul-escuro...") e quando amanhece ("O mestre apaga o azul com a borracha").

## Mundo

**Definido**

- O mundo são **5 páginas do caderno, uma por bioma**, sempre na mesma ordem: Campos, Deserto, Montanhas Geladas, Pântano Sombrio e Vulcão. Cada página é uma ilha de 48 × 34 quadrados (cerca de 700 dá para alcançar a pé), cercada de água (no Vulcão, de lava).
- Tudo é gerado de uma semente no começo da aventura e salvo com ela. Cada página tem a sua semente, tirada da semente do mundo e do número da página, e é gerada sozinha.
- **Os 6 terrenos têm o mesmo papel em toda página.** Água e montanha bloqueiam; areia, campo, mata e pântano se andam, e mata e pântano escondem mais bicho. Cada bioma dá outro nome e outro desenho a eles, e muda o quanto de cada um aparece:

| Papel | Campos | Deserto | Montanhas Geladas | Pântano Sombrio | Vulcão |
| --- | --- | --- | --- | --- | --- |
| água (bloqueia) | água | oásis | água gelada (com blocos de gelo) | água escura | lava |
| areia | praia | areia | gelo | lama | cinzas |
| campo | campo | dunas | neve | terra morta (com túmulos) | rocha |
| mata | floresta | cactos | pinheiros | árvores mortas | árvores queimadas |
| pântano | pântano | areia movediça | neve funda | brejo | fumarolas |
| montanha (bloqueia) | montanha | rochedos | picos nevados | rochas | vulcões |

- **Como cada bioma muda o terreno (proposta):** o Deserto é seco (quase só dunas, poucos cactos, pouca areia movediça), o Pântano Sombrio é úmido (muita árvore morta e brejo), as Montanhas Geladas e o Vulcão têm mais montanha. No gerador, isso são os limites de elevação (água e montanha) e um ajuste de umidade por bioma.
- **Os biomas mudam o visual, os monstros e uma regra.** Terreno, desenho, monstros, chefes e lojas mudam de uma página para outra; andar, lutar, dia e noite, tochas e fogueiras funcionam igual em todas. Fora isso, cada página da segunda em diante tem **uma regra só dela** (ver Regras de cada página). Os Campos, a primeira, não têm: é onde o jogador aprende o básico.
- **Revelação:** ao chegar num quadrado, o mestre desenha todos os quadrados num raio de ~2,6 ao redor que ainda estavam em branco, do mais perto para o mais longe, um após o outro.
- **Regiões de perigo 1 a 15**, 3 por página, pela distância a pé desde a primeira fogueira da página: os Campos são as regiões 1–3, o Deserto 4–6, as Montanhas Geladas 7–9, o Pântano Sombrio 10–12 e o Vulcão 13–15. Cada região tem seu par de monstros.
- **5 acampamentos com fogueira por página**, com nome de material escolar: o primeiro no início da página e os outros a ~1/5, ~2/5, ~3/5 e ~4/5 do caminho até o fim, sempre num campo ou areia. Os nomes seguem a ordem do caderno: Apontador, Borracha, Régua, Clipe e Grampo nos Campos; Compasso, Estojo, Transferidor, Lancheira e Lápis de cor no Deserto; Caneta, Mochila, Tesoura, Cola e Fichário nas Montanhas Geladas; Esquadro, Giz, Marca-texto, Corretivo e Lapiseira no Pântano Sombrio; Pincel, Guache, Carimbo, Calculadora e Globo no Vulcão.
- No mapa, o acampamento é uma barraca listrada, a fogueira e um guerreiro sentado, com o nome escrito em cima.
- **Passagem:** no ponto alcançável mais distante da primeira fogueira fica o **canto dobrado da página**, com uma seta vermelha e o nome da próxima página ("Deserto →"), guardado por um **guardião** (ver Guardiões das passagens). Na última página, ali fica o **Covil do Dragão**. Em volta dos dois, a 2 quadrados, há mais monstros (40% dos quadrados), da região mais forte da página.
- **Volta:** da 2ª página em diante, ao lado da primeira fogueira há uma folha com uma seta verde e o nome da página anterior ("← Campos").
- Por página: monstros desenhados (~7,5% dos quadrados livres), baús (~2%), **6 entradas de masmorra** (uma por monstro, na região dele) e **7 personagens**: 3 que dão missões (um por região) e 4 que dão dicas.
- **Personagens espaçados:** nenhum personagem fica a menos de 5 quadrados de outro (contando na horizontal ou na vertical, a maior das duas distâncias), nem colado numa masmorra.
- Masmorras ficam a 4+ quadrados das fogueiras e do fim da página e a 6+ umas das outras. Se uma não couber na região dela, aquela página fica sem ela (a missão do chefe passa a pedir o outro rei da região).
- **Ordem dos sorteios** de cada página: terreno, fogueiras, passagem (ou covil), volta, monstros e baús, masmorras e por último os personagens. A masmorra do atalho é escolhida depois, sem sorteio (ver Guardiões das passagens), e a escada escondida entra no interior dela depois de todos os sorteios da masmorra, então as páginas e masmorras são as mesmas de antes da 0.4.0. O que entrou na 0.5.0 (miragens, monstros da noite, onde o lendário começa, a variação de cada masmorra) também vem depois de todos os sorteios, só com hash ou com um gerador separado, então as páginas e masmorras de antes continuam iguais.

**Em aberto**

- Mapa feito à mão em vez de gerado (o mestre do caderno inventava na hora, mas tinha um roteiro).
- Barcos, pontes ou atalhos para atravessar água e montanha.
- Mais páginas (outros biomas) ou uma ordem diferente a cada aventura.

## Movimento

- Um quadrado por vez, nas 4 direções: setas ou WASD, direcional na tela no celular, ou tocando/clicando num quadrado já desenhado (o herói vai sozinho pelo caminho mais curto entre os quadrados conhecidos).
- Andar até um monstro, um personagem ou o covil abre o encontro sem entrar no quadrado.
- Entrar numa fogueira abre a folha do acampamento; entrar num baú abre o baú.
- **Virar a página:** com o guardião vencido, pisar no canto dobrado pergunta se o herói quer ir para a próxima página (antes disso, quem responde é o guardião). Na primeira vez, o aviso diz que lá os monstros são mais fortes. Indo para a frente, o herói chega na primeira fogueira da página nova, que já vira o lugar onde ele acorda se desmaiar. Pisar na seta de volta leva ao canto dobrado da página anterior. Na primeira vez em cada página, o mestre narra a chegada ("O mestre vira a página e pega a caneta amarela: é o Deserto...").
- **Encontros surpresa:** a mais de 2 quadrados de uma fogueira e fora de quadrados com algo desenhado, cada passo pode trazer um monstro do mato: 3% na areia, 3,5% no campo, 5% na mata e 6% no pântano (com os nomes de cada bioma). Depois de uma surpresa vêm **8 passos de calma**, sem outra. Vem um monstro da região (25% de chance de ser da região anterior, mas nunca de outra página).
- O botão de mapa afasta a câmera para ver a página inteira já desenhada (ou a masmorra inteira, dentro dela).
- O HUD mostra o número e o nome da página ("2. Deserto"); no celular, só o número.

## Dia e noite

**Definido**

- O relógio anda **um passo por quadrado andado**: o dia tem 100 passos. Passos 0–64 são dia, 65–74 escurecem aos poucos, 75–94 são noite e 95–99 clareiam. A aventura começa no passo 10 do Dia 1.
- O HUD mostra sol ou lua, "Dia N" e "noite".
- **À noite, os monstros ficam mais fortes:** rolam **um dado de ataque a mais** do mesmo tipo (Lobo 1d10 vira 2d10). Em compensação, dão **+50% de experiência**. Encontros surpresa ficam 50% mais comuns. Vale para monstros do mapa, encontros surpresa e o dragão; não vale dentro das masmorras.
- O relógio é um só para o mundo todo: virar a página não muda a hora.
- **Escuro** é a noite numa página ou qualquer hora dentro de uma masmorra. No escuro:
  - **Com tocha acesa:** o mestre desenha num raio de ~2,2 quadrados, e a luz em volta do herói tem ~3 quadrados, tremendo como fogo.
  - **Sem tocha:** o mestre só desenha os 8 quadrados vizinhos, e a tela fica escura a mais de ~1 quadrado do herói. O que já foi desenhado continua lá, mas aparece apagado sob o azul.
- **Tochas:** custam 5 moedas com o mercador de qualquer fogueira; o herói começa com 2. Acendem sozinhas quando fica escuro, cada uma dura **40 passos no escuro** (de dia não gasta), e quando acaba a próxima acende sozinha. O mestre avisa quando a última apaga.
- **Dormir na fogueira:** a partir do passo 60, descansar vira "Dormir": o herói acorda no passo 5 do dia seguinte.

**Em aberto**

- Monstros que só aparecem à noite em outras páginas (hoje só no Pântano Sombrio, ver Regras de cada página).
- Fogueiras com outros guerreiros (e outra loja) à noite.
- Fogueira acesa iluminando em volta dela à noite.

## Regras de cada página

**Definido** (os números são proposta)

Da segunda página em diante, cada página tem uma regra só dela, para a página nova trazer algo novo além de monstros mais fortes. O mestre conta a regra na chegada ("Cuidado com as tempestades de areia...") e, quando ela acontece, narra. As regras valem só lá fora, na página; dentro das masmorras, não.

- **Campos:** nenhuma. É a página onde o jogador aprende o básico.
- **Deserto: tempestade de areia e miragens.**
  - A cada **70 passos** no Deserto vem uma tempestade de areia de **15 passos**. Quatro passos antes, o mestre avisa ("O vento começa a levantar areia..."). Durante ela, o mestre só desenha os 8 vizinhos do herói, a folha fica coberta de lápis cor de areia com riscos voando, e o HUD mostra "tempestade".
  - No começo da tempestade, **a borracha apaga um pedaço do mapa** já desenhado: um círculo de raio ~3,5 quadrados, a 6 a 12 quadrados do herói, com o rastro que passava por ali. O que tem nome escrito (fogueiras, masmorras, quem dá missão, a passagem e a seta de volta) a borracha não apaga.
  - **Miragens:** ~4% dos quadrados livres do Deserto têm um baú ou um monstro desenhado que não existe. Quando o herói chega do lado (nos 8 vizinhos), some ("Era miragem!"). Elas voltam com o descanso na fogueira, como os monstros. Ficam longe de personagens, masmorras e da passagem.
- **Montanhas Geladas: gelo escorregadio.** No gelo (o terreno de areia desta página, ~1/5 do que se anda), o herói continua escorregando na mesma direção, mais rápido, até sair do gelo ou o próximo quadrado ser água, montanha ou ter alguma coisa desenhada. Escorregando, o toque no mapa perde o caminho planejado. Isso faz o gelo virar um pequeno quebra-cabeça de caminho.
- **Pântano Sombrio: neblina e os mortos da noite.**
  - **Neblina:** mesmo de dia, o mestre só desenha num raio de ~2,1 quadrados (com tocha à noite, também), e uma camada de lápis cinza-claro cobre a folha, menos um círculo em volta do herói.
  - **Monstros da noite:** ~3% dos quadrados livres têm um monstro da região que só existe à noite. De dia o mestre não desenha nada ali e dá para passar; quando anoitece, ele aparece no mapa ("Os mortos se levantam!") e bloqueia o quadrado como qualquer monstro desenhado. Vencido, fica com X até o descanso.
- **Vulcão: erupções.** A cada **60 passos** no Vulcão (com aviso 4 passos antes: "O chão treme..."), o vulcão cospe **3 rios de lava** de 4 a 7 quadrados, saindo dos vulcões a até 10 quadrados do herói. Os quadrados viram lava (não se anda neles) por **30 passos** e depois esfriam (a contagem continua mesmo dentro das masmorras). A lava nunca cai a menos de 3 passos do herói, perto de uma fogueira, em cima de algo desenhado ou do lendário, e um rio que fecharia o caminho do herói até uma fogueira, masmorra, personagem, a seta de volta, a passagem ou o covil não sai.

**Em aberto**

- Uma regra para os Campos também (hoje ficam sem, de propósito).
- A tempestade apagar parte do mapa pode irritar quem usa o toque no mapa para andar longe; se incomodar, ela pode só esconder a visão.

## Monstro lendário

**Definido** (os números são proposta)

- Cada página tem **um monstro lendário**: um monstro da região do meio com nome, aura dourada tracejada e uma estrela na cabeça. Ele não fica desenhado parado: **anda pela página** a cada passo do herói.
- **Foge:** até 5 quadrados do herói, em 75% dos passos ele vai para o vizinho mais longe do herói; mais longe, passeia (anda em metade dos passos). Não pisa em nada desenhado nem perto das fogueiras. Para lutar, é preciso **encurralar** e esbarrar nele.
- Aparece na tela só onde o mestre já desenhou e se o herói consegue ver (no escuro, na neblina e na tempestade, só de perto). Na primeira vez que o herói o vê, o mestre avisa. A 4ª pessoa de dica de cada página, na primeira conversa, fala dele.
- **Na luta**, depois da primeira rodada, cada vez dele tem **20%** de chance de ele fugir em vez de atacar. Ele reaparece longe (a 15+ quadrados do herói, fora da primeira região) **com a vida que perdeu**: dá para cansar ele aos poucos. Se o herói fugir da luta, acontece o mesmo.
- **Números:** vida = a do chefe do monstro + 20%; ataque, defesa e golpe especial do chefe (defesa 1d4 se o chefe não tiver); o dobro dos dados de moeda e o triplo da experiência do chefe. Vencido, não volta e deixa um **equipamento da loja da página seguinte**.

| Página | Lendário | Monstro | Vida | Ataque | Defesa |
| --- | --- | --- | --- | --- | --- |
| Campos | Dentuço, o Lobo Sem Dono | Lobo | 50 | 2d10 | 1d4 |
| Deserto | Rainha das Dunas | Naja | 65 | 3d8 | 1d4 |
| Montanhas Geladas | Pé-Grande | Yeti | 233 | 5d8 | 2d6 |
| Pântano Sombrio | Lençol Errante | Fantasma | 312 | 6d10 | 3d6 |
| Vulcão | Faísca, o Diabrete Ladrão | Diabrete | 420 | 6d12 | 3d8 |

## Masmorras e chefes

**Definido**

- Cada monstro comum tem uma masmorra na sua região, com a versão **chefe** dele no fundo: o mesmo desenho, um pouco menor, com uma coroa amarela na cabeça. São 30 masmorras no mundo, 6 por página.
- No mapa, a entrada é um arco de pedra cinza com porta escura e uma coroa em cima, com o nome do lugar escrito (Esgoto, Cripta...). Pisar nela pergunta se o herói quer descer, mostrando vida e dados do chefe e quantas tochas ele tem.
- **Interior (gerado da semente da página e do número da masmorra):** 21 × 16 quadrados, divididos em 4 × 3 celas de 5 quadrados com uma sala de 2 a 4 quadrados de lado em cada. Um labirinto liga as salas por corredores em L, mais 2 ligações extras. A escada de **Saída** fica numa sala; o **chefe**, na sala mais longe dela a pé.
- **Desenho:** paredes que encostam no chão são pintadas de cinza com a borda em caneta preta; pedra maciça fica em branco. O chão tem pontinhos de lápis.
- Nas outras salas: monstros (60% de chance por sala; 80% deles do tipo da masmorra, o resto do outro monstro da região) e até 2 baús. Ficam fora da linha e da coluna do meio da sala, por onde chegam os corredores. Dentro da masmorra não há encontros surpresa.
- Dentro é sempre escuro (ver Dia e noite). O relógio continua andando.
- **Sair:** pisar de novo na escada pergunta se quer subir; o herói volta para a entrada, na página. Desmaiar lá dentro leva para a última fogueira, como lá em cima.
- **Vencer o chefe** deixa X nele e risca a entrada da masmorra na página. Atrás do trono há um baú com um **equipamento** da loja da página seguinte (a mesma regra dos baús raros). Baús abertos e o que foi desenhado de cada masmorra ficam salvos; dá para voltar depois. Os monstros dela voltam quando o herói descansa numa fogueira, mas o chefe vencido não volta.
- **Fugir de um chefe:** d20 ≥ 13.
- **Escada escondida:** em uma masmorra por página (menos a última), uma segunda escada sobe por trás do guardião da passagem e vira a página (ver Guardiões das passagens).
- **Variações:** cada masmorra tem uma de 4 variações, para nenhuma ser igual à outra. As 6 masmorras de uma página passam pelas 4 em ordem, começando de uma tirada da semente, então toda página tem todas.
  - **Porta trancada:** os corredores que chegam na sala do chefe têm portas de madeira com cadeado. A chave fica na sala mais longe da escada que dá para alcançar sem passar por elas; pisar nela abre todas as portas. Se não houver sala assim, a masmorra fica com armadilhas.
  - **Armadilhas:** 4 quadrados de corredor (fora das salas) têm uma armadilha escondida, que o mestre só desenha (espetos) depois que alguém pisa. Pisar rola **1d20: 11 ou mais pula a tempo**; senão, toma **(região/2, arredondado para cima)d8** de dano. Armadilha nunca faz desmaiar: o herói fica com pelo menos 1 de vida. Cada uma dispara uma vez só.
  - **Enigma do mestre:** numa sala há uma cara de pedra que bloqueia o quadrado e faz uma adivinha "O que é, o que é?" com 3 respostas (12 adivinhas, como "Tem dentes, mas não morde" → pente). Ela só pergunta uma vez. **Acertar** dá um equipamento da loja da página seguinte; **errar** acorda um monstro da masmorra, e começa a luta.
  - **Andar a mais:** no lugar do chefe, uma escada desce para o **andar de baixo**, outro labirinto do mesmo tamanho (com monstros e baús) com o chefe no fundo. Uma escada "Subir" leva de volta para onde ficava a do primeiro andar.

**Chefes (proposta):** vida = 2 × a do monstro + 10; ataque com um dado a mais; mesma defesa; o dobro de dados de moeda; 4 × a experiência; deixam 2d6 despojos.

| Página | Masmorra | Chefe | Vida | Ataque | Defesa | Moedas | XP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Campos | Poço do Rei Slime | Rei Slime | 26 | 2d4 | — | 4d4 | 12 |
| Campos | Esgoto do Rei Rato | Rei Rato | 22 | 2d6 | — | 4d4 | 12 |
| Campos | Caverna do Rei Goblin | Rei Goblin | 38 | 3d4 | — | 6d6 | 24 |
| Campos | Toca do Rei Lobo | Rei Lobo | 42 | 2d10 | — | 6d6 | 24 |
| Campos | Ninho da Rainha Aranha | Rainha Aranha | 50 | 3d6 | 1d4 | 8d6 | 40 |
| Campos | Forte do Rei Orc | Rei Orc | 58 | 2d12 | 1d4 | 8d6 | 40 |
| Deserto | Fenda do Rei Escorpião | Rei Escorpião | 62 | 3d6 | 1d6 | 8d8 | 56 |
| Deserto | Templo da Rainha Naja | Rainha Naja | 54 | 3d8 | — | 8d8 | 56 |
| Deserto | Cripta do Rei Esqueleto | Rei Esqueleto | 78 | 3d8 | 1d4 | 10d8 | 76 |
| Deserto | Pirâmide da Rainha Múmia | Rainha Múmia | 90 | 4d6 | 1d6 | 10d8 | 76 |
| Deserto | Túnel da Rainha Verme | Rainha Verme | 126 | 4d8 | 1d6 | 12d8 | 100 |
| Deserto | Pedreira do Rei Golem | Rei Golem | 138 | 4d10 | 2d6 | 12d8 | 100 |
| Montanhas Geladas | Gruta Gelada do Rei Lobo do Gelo | Rei Lobo do Gelo | 134 | 4d10 | 1d6 | 12d10 | 128 |
| Montanhas Geladas | Iglu do Rei Boneco de Neve | Rei Boneco de Neve | 150 | 4d8 | 2d6 | 12d10 | 128 |
| Montanhas Geladas | Geleira do Rei Yeti | Rei Yeti | 194 | 5d8 | 2d6 | 14d10 | 160 |
| Montanhas Geladas | Gruta do Rei Ogro | Rei Ogro | 210 | 5d8 | 2d4 | 14d10 | 160 |
| Montanhas Geladas | Palácio de Gelo da Rainha da Nevasca | Rainha da Nevasca | 186 | 5d10 | 2d6 | 16d10 | 200 |
| Montanhas Geladas | Fosso do Rei Troll | Rei Troll | 240 | 5d10 | 2d8 | 16d10 | 200 |
| Pântano Sombrio | Mausoléu do Rei Zumbi | Rei Zumbi | 270 | 6d8 | 2d6 | 8d20 | 248 |
| Pântano Sombrio | Brejo do Rei Sapo | Rei Sapo | 246 | 5d12 | 2d8 | 8d20 | 248 |
| Pântano Sombrio | Casarão da Rainha Fantasma | Rainha Fantasma | 260 | 6d10 | 3d6 | 10d20 | 300 |
| Pântano Sombrio | Cabana da Rainha Bruxa | Rainha Bruxa | 280 | 7d8 | 2d6 | 10d20 | 300 |
| Pântano Sombrio | Torre do Rei Cavaleiro | Rei Cavaleiro | 340 | 6d12 | 3d8 | 12d20 | 360 |
| Pântano Sombrio | Catacumba do Rei Ceifador | Rei Ceifador | 310 | 7d10 | 2d8 | 12d20 | 360 |
| Vulcão | Forja da Rainha Salamandra | Rainha Salamandra | 380 | 7d10 | 3d6 | 14d20 | 432 |
| Vulcão | Chaminé do Rei Diabrete | Rei Diabrete | 350 | 6d12 | 3d8 | 14d20 | 432 |
| Vulcão | Canil do Rei Cão Infernal | Rei Cão Infernal | 460 | 8d10 | 3d8 | 16d20 | 512 |
| Vulcão | Cratera do Rei Elemental | Rei Elemental | 440 | 7d12 | 4d6 | 16d20 | 512 |
| Vulcão | Fornalha do Rei Golem de Magma | Rei Golem de Magma | 560 | 8d12 | 5d6 | 16d20 | 600 |
| Vulcão | Pico da Rainha Fênix | Rainha Fênix | 510 | 9d10 | 3d8 | 16d20 | 600 |

**Em aberto**

- Armadilhas que dá para achar antes de pisar (uma tocha melhor, uma habilidade).
- Mais de uma variação na mesma masmorra nas páginas do fim.
- Monstros da masmorra voltarem depois de um tempo.
- Masmorra do dragão (hoje o covil é um quadrado só).

## Guardiões das passagens e escadas escondidas

**Definido**

- Antes de cada virada de página (as 4 primeiras páginas) há uma luta de chefe: um **guardião** fica em pé em cima do canto dobrado, com o nome escrito em vermelho embaixo. Ele bloqueia o quadrado como um monstro desenhado; pisar nele mostra vida, dados e golpe especial e pergunta se o herói quer enfrentá-lo.
- **Dá para não enfrentar (como em Elden Ring):** em cada uma dessas páginas, uma masmorra tem uma **escada escondida** além da Saída, na sala mais longe da entrada depois da do chefe (sem precisar vencer o chefe da masmorra). Ela sobe por trás do guardião: pisar nela pergunta se o herói quer subir e já vira a página ("Você passou por trás do Senhor da Guerra Orc sem ele perceber!"). A masmorra do atalho é a da última região da página mais perto do canto dobrado. O mundo incentiva explorar em vez de forçar a luta.
- Depois que o herói já esteve na página seguinte (pelo atalho), o guardião continua lá, mas pisar nele também oferece **"Passar por trás dele"**: dá para virar a página sem lutar, ou enfrentá-lo quando quiser.
- **Vencer** apaga o guardião do canto da folha (a passagem fica livre para sempre, não volta com o descanso) e dá um **equipamento** da loja da página seguinte, como o baú de um chefe de masmorra.
- Uma personagem de dica dos Campos avisa: "No ponto mais longe daqui tem um canto de página dobrado, com um guardião em cima. Mas tem masmorra com escada que sai atrás dele...". A folha do guardião repete a dica enquanto o herói não conhece o caminho.
- **Desenho:** o monstro do guardião com um elmo cinza de chifres no lugar da coroa dos chefes de masmorra. A escada escondida é a escada da Saída em pedra cinza, com "Escada escondida" em roxo.
- **Fugir de um guardião:** d20 ≥ 13, como de um chefe.

**Guardiões (proposta):** vida = a do chefe do monstro + 30%; o ataque do monstro comum (com o ataque do chefe, o herói da simulação quase nunca vencia); a defesa do monstro (1d4 se ele não tiver); o dobro das moedas e da experiência do chefe; um golpe especial (ver Golpes especiais dos monstros), com uma rodada a mais que o chefe.

| Página | Guardião | Monstro | Vida | Ataque | Defesa | Golpe |
| --- | --- | --- | --- | --- | --- | --- |
| Campos → Deserto | Senhor da Guerra Orc | Orc | 75 | 1d12 | 1d4 | Machadada (quebrar) |
| Deserto → Montanhas Geladas | Verme Colossal | Verme da areia | 164 | 3d8 | 1d6 | Mordida colossal (quebrar) |
| Montanhas Geladas → Pântano Sombrio | Troll da Montanha | Troll | 312 | 4d10 | 2d8 | Pancada de troll (quebrar) |
| Pântano Sombrio → Vulcão | Cavaleiro da Morte | Cavaleiro negro | 442 | 5d12 | 3d8 | Lâmina amaldiçoada (maldição, −2 por dado, 6 rodadas) |

- **Na simulação** (herói que só ataca, com Golpe certeiro e Fôlego equipados e o equipamento da loja da página), cada guardião cai em 1 a 3 tentativas na maioria das vezes; o Troll da Montanha às vezes pede mais. O Golem de pedra começou como guardião do Deserto, mas com a defesa 2d6 o herói quase nunca vencia, e ele foi trocado pelo Verme da areia.
- **Em aberto:** a escada escondida ficar escondida de verdade (só aparecer depois de uma dica, de uma missão ou de bater numa parede); um guardião no Vulcão antes do covil do dragão.

## Missões

**Definido**

- Cada região tem um personagem com "!" que dá missões, com o nome escrito em cima. São 15, um por região, na ordem: Seu Juca, Dona Filó e Tio Bento (Campos); Vó Nina, Mestre Caco e Dona Lurdes (Deserto); Seu Tonho, Dona Cida e Tio Zé (Montanhas Geladas); Vó Benta, Seu Dito e Dona Zuza (Pântano Sombrio); Mestre Bira, Dona Glória e Seu Lino (Vulcão).
- Cada um dá **3 missões, uma depois da outra**, com os dois monstros da região dele:
  1. **Derrotar** N do monstro A. Só contam os vencidos depois de aceitar.
  2. **Juntar** N despojos do monstro B. Contam os que o herói já tem.
  3. **Derrotar o chefe** do monstro A (ou do B, se a masmorra de A não existir nesta página). Vale se ele já tiver sido vencido antes.
- Qual dos dois monstros é A sai da semente da página, então cada aventura muda.
- **Despojos:** todo monstro vencido deixa 1d3 de uma parte dele (chefe: 2d6), rolados na bandeja junto com as moedas. Exemplos: rabos de rato, ferrões, narizes de cenoura, lençóis rasgados, penas de fênix (a lista toda está em Monstros). Ficam na mochila; numa fogueira, o mercador compra por (região do monstro) moedas cada, menos os guardados para uma missão de juntar.
- Uma missão aceita continua valendo em outra página: dá para aceitar nos Campos, ir ao Deserto e voltar para entregar. A caixinha do HUD e a mochila dizem de quem é cada missão.

**Números por região (proposta).** A recompensa é × 1 na primeira missão, × 1,5 na segunda e × 2 na do chefe; a do chefe também dá um equipamento da loja da página seguinte.

| Região | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Derrotar | 10 | 10 | 8 | 8 | 8 | 6 | 6 | 6 | 5 | 5 | 5 | 4 | 4 | 4 | 3 |
| Juntar | 20 | 18 | 16 | 15 | 14 | 13 | 12 | 11 | 10 | 10 | 9 | 8 | 8 | 7 | 6 |
| Moedas | 15 | 20 | 30 | 40 | 50 | 60 | 75 | 90 | 105 | 125 | 145 | 165 | 190 | 215 | 240 |
| Experiência | 15 | 25 | 40 | 55 | 75 | 100 | 130 | 165 | 205 | 250 | 300 | 360 | 430 | 510 | 600 |

- **Moedas (0.7.0):** eram o dobro (30 na região 1 ... 480 na 15). Com o dobro, o herói ficava rico cedo e comprava o melhor da página logo nas primeiras fogueiras ("o personagem fica muito forte rápido, tem muito recurso"). Agora a primeira missão paga mais ou menos o que os monstros pedidos já deixam. A experiência não mudou.
- Aceitar é opcional ("Agora não"), e podem ficar várias missões ativas ao mesmo tempo (uma por personagem).
- **No HUD:** uma caixinha "Missões" embaixo dos números mostra cada missão ativa com o progresso (3/10). Quando fica pronta, o mestre avisa e a linha fica verde com "volte a Seu Juca". Para receber, é preciso falar com o personagem de novo. A mochila também lista as missões, com a página de quem deu.
- Os monstros desenhados voltam a cada descanso na fogueira, e com uma missão ativa de derrotar ou juntar, **metade dos encontros surpresa na região daquele monstro traz o monstro pedido**.
- Depois das 3 missões, o personagem só agradece.

**Em aberto**

- Missões de entregar um item ou levar alguém até uma fogueira.
- Mural de pedidos nas fogueiras.

## Combate

O coração do jogo. A luta acontece numa folha por cima do mapa: o mestre desenha o monstro à esquerda, a bandeja de dados (com a conta, o que aconteceu e os botões) fica no meio e o herói à direita, virado para o monstro, com a vida, a Magia, os **dados de ataque e de defesa** dele e a maldição ou os dados quebrados embaixo. Os dados mostrados são os que valem agora: os quebrados saem da defesa, e com maldição aparece o "−1" ou "−2" em roxo do lado de cada um. Golpes do monstro deixam riscos roxos no herói.

- **Celular em pé:** as três colunas não cabem; fica monstro em cima, dados no meio, o herói embaixo (desenho pequeno à direita do nome) e os botões por último, perto do polegar.
- **Celular deitado:** as mesmas três colunas, menores.

**Regra base (definido)**

- Cada item equipado dá dados. **Arma** dá os dados de ataque; **escudo** e **armadura** dão os dados de defesa.
- **Atacar:** o herói rola os dados da arma; o monstro rola os dados de defesa dele. Dano = ataque − defesa (mínimo 0, "bloqueou!").
- **Turno do monstro:** do mesmo jeito, ele rola os dados de ataque e o herói rola escudo + armadura.
- **Teto de 5 dados:** a arma rola no máximo 5 dados, e escudo + armadura juntos também (o escudo dá até 2, a armadura até 3). O equipamento melhor tem dados maiores, não mais dados.
- Os dados rolam na tela (números trocando, dado tremendo) e param um de cada vez; depois aparece a conta, por exemplo "12 − 3 = 9 de dano!".
- **Lutas em grupo:** poucos monstros desenhados no mapa vêm em **dupla ou trio** do mesmo tipo, com "×2" ou "×3" escrito em vermelho em cima do desenho (~7% dos monstros do mapa em dupla e ~3% em trio, uns 3 grupos de 2 e 1 de 3 por página; nunca na primeira região do jogo; sai de um hash da semente, sem sorteio, então o resto da página não muda). Encontros surpresa, masmorras, chefes e guardiões são sempre de um monstro só.
  - Na folha da luta, os monstros ficam empilhados na coluna da esquerda, em cartões menores com vida própria. **Tocar num monstro escolhe o alvo** (cartão com tracejado vermelho e "← alvo" no nome); quando o alvo cai, passa para o próximo vivo. Ataque, feitiço de dano e as habilidades de ataque (inclusive tonto) vão no alvo; o segundo golpe do Golpe duplo vai no mesmo, ou no próximo se ele caiu.
  - **Na vez deles, cada monstro vivo age**, um depois do outro, e cada ataque rola contra a sua defesa (e pode disparar as suas habilidades de defesa; Revide, Espelho e Contra-ataque respondem a quem atacou). A maldição conta uma rodada só depois de todos agirem; só uma maldição de cada vez.
  - **Fugir** fica mais difícil: +1 no d20 por monstro vivo a mais.
  - **Vitória:** as moedas de um monstro rolam uma vez e valem vezes o tamanho do grupo; cada um deixa 1d3 despojos e a sua experiência, e conta como um abate para as missões. O grupo inteiro ganha um X no mapa e volta junto no descanso.
- **Golpes especiais e habilidades:** alguns monstros amaldiçoam os dados do herói ou quebram um dado da defesa dele, e o herói aprende habilidades que disparam com combinações de pôquer nos dados (ver as duas seções abaixo de Monstros).
- Cada tipo de dado tem a silhueta que se desenhava no caderno: d4 triângulo, d6 quadrado, d8 losango, d10 pipa, d12 pentágono, d20 hexágono com triângulo dentro.
- Golpes deixam riscos de caneta por cima do monstro; ao vencer, o mestre faz um X nele.

**Ações do turno**

| Ação | O que faz |
| --- | --- |
| Atacar | Dados da arma contra a defesa do monstro. Sem arma, 1d2. |
| Feitiço | Gasta Magia (PM). Dano de feitiço **ignora a defesa**; Cura recupera vida. |
| Poção | Rola os dados da poção e recupera vida ou magia. |
| Fugir | Rola 1d20: precisa de 8+ no primeiro turno, 11+ depois, 13+ contra um chefe e 15+ contra o dragão. Falhou, o monstro ataca. |

- **Antes da luta:** contra um monstro desenhado, o jogador vê vida e dados dele e escolhe "Enfrentar" ou "Deixar pra lá" (sem rolagem). Num encontro surpresa, pode tentar fugir antes (d20 ≥ 8); se falhar, o monstro ataca primeiro.
- **Vitória:** rola os dados de moedas do monstro junto com os despojos (1d3; chefe 2d6) e ganha a experiência dele (+50% à noite). Monstros desenhados vencidos ficam com X até o próximo descanso numa fogueira (ou desmaio), quando voltam.
- **À noite**, a folha da luta mostra a lua e o lembrete "+1 dado de ataque, +50% de experiência".
- **Derrota (desmaio):** o herói acorda na última fogueira por onde passou (que pode estar em outra página), com vida e magia cheias e **metade do ouro**, e os monstros vencidos voltam (como num descanso). Nada mais se perde.
- **Em aberto:** o ouro perdido ficar caído onde o herói desmaiou, para ele voltar e pegar (como as almas de um souls-like).

**Em aberto**

- Grupo de heróis (vários jogadores, como na sala de aula).

## Personagem e progressão

- Começa com 20 de vida, 3 de Magia, 15 moedas, Espada de madeira (1d6), 2 Poções de vida e 2 Tochas.
- Experiência para o próximo nível: 10 × nível^1,5 (10, 28, 52, 80...). Cada nível dá +6 de vida máxima, +1 de Magia máxima, enche as duas e dá **1 ponto de habilidade**, gasto numa fogueira (ver Habilidades passivas).
- Ouro compra equipamento, magias, poções e tochas dos guerreiros das fogueiras. Descansar é de graça.

## Itens (proposta)

| Item | Tipo | Dados | Preço | Loja |
| --- | --- | --- | --- | --- |
| Espada de madeira | arma | 1d6 | 10 | 1 |
| Espada curta | arma | 1d8 | 30 | 1 |
| Espada de ferro | arma | 2d6 | 70 | 1 |
| Machado de guerra | arma | 2d8 | 140 | 2 |
| Espada de prata | arma | 3d8 | 260 | 2 |
| Montante | arma | 3d12 | 600 | 3 |
| Espada rúnica | arma | 4d12 | 1100 | 3 |
| Espada de cristal | arma | 5d12 | 2600 | 4 |
| Lâmina do Dragão | arma | 5d20 | 6000 | 5 |
| Tampa de panela | escudo | 1d4 | 12 | 1 |
| Escudo de madeira | escudo | 1d6 | 40 | 1 |
| Escudo de ferro | escudo | 1d10 | 160 | 2 |
| Escudo de torre | escudo | 2d8 | 500 | 3 |
| Escudo rúnico | escudo | 2d10 | 1900 | 4 |
| Escudo de dragão | escudo | 2d12 | 4200 | 5 |
| Roupa de couro | armadura | 1d4 | 25 | 1 |
| Cota de malha | armadura | 2d4 | 110 | 2 |
| Armadura de placas | armadura | 2d8 | 380 | 2 |
| Armadura de gelo | armadura | 2d12 | 950 | 3 |
| Armadura rúnica | armadura | 3d12 | 2400 | 4 |
| Armadura de dragão | armadura | 3d20 | 5000 | 5 |
| Poção de vida | poção | 3d6 de vida | 12 | 1 |
| Poção de magia | poção | 2d4 de Magia | 15 | 1 |
| Poção grande | poção | 8d8 de vida | 70 | 3 |

- **Loja** é a página do item: Campos 1, Deserto 2, Montanhas Geladas 3, Pântano Sombrio 4, Vulcão 5. Os preços sobem junto com as moedas que os monstros de lá deixam. Desde a 0.7.0, arma, escudo, armadura e feitiço não são vendidos em toda fogueira da página: **cada fogueira tem a sua lista** (ver Fogueiras), e a melhor arma da página só aparece na última fogueira antes do guardião. A coluna Loja ainda vale para as poções e para os prêmios "equipamento da loja da página seguinte" (baús, chefes, guardiões, missões do chefe).
- Comprar um equipamento já o equipa; o anterior vai para a mochila. Na mochila dá para trocar o equipado e, numa fogueira, vender por metade do preço.
- Cada item tem ícone desenhado em lápis de cor, com a cor do material (madeira marrom, ferro grafite, prata e gelo azul-claro, cristal rosa, rúnica roxa, dragão vermelha).
- **Teto de 5 dados (definido):** arma até 5 dados; escudo até 2 e armadura até 3, então os dois juntos defendem com no máximo 5. A média de defesa de cada página ficou perto da de antes do teto (5d6 + 5d8 = 40 virou 2d12 + 3d20 = 44,5 no Vulcão).
- **A curva (proposta, conferida numa simulação de antes da 0.7.0, quando toda fogueira vendia tudo da página e as missões pagavam o dobro; falta simular de novo):** um herói que só ataca, compra o melhor que dá na loja da página, equipa Golpe certeiro e Fôlego (a melhor dupla na simulação) e descansa com meia vida chega ao fim do Vulcão por volta do nível 38. Contra o dragão, tudo depende da Lâmina do Dragão: quando junta as 6000 moedas, vence em ~60–70% das vezes; sem ela, quase nunca. Sem habilidades, o mesmo herói trava no Vulcão (os golpes especiais e o teto de dados pesam). A simulação não usa baús, equipamento de missão, poções nem feitiços. **Em aberto:** baixar a vida do dragão (600) ou o preço da Lâmina, se jogando o fim ficar duro demais. A primeira região de cada página fica fácil logo depois das compras, e a última, difícil. Com feitiços e poções fica mais fácil; falta uma pessoa jogar a curva toda.

## Feitiços (proposta)

Comprados uma vez da maga de uma fogueira, como pergaminhos, e ficam para sempre.

| Feitiço | Magia | Efeito | Preço | Loja |
| --- | --- | --- | --- | --- |
| Faísca | 1 | 2d4 de dano | 30 | 1 |
| Cura | 2 | 2d6 de vida (também fora da luta) | 45 | 1 |
| Bola de fogo | 3 | 3d8 de dano | 150 | 2 |
| Raio | 5 | 4d10 de dano | 420 | 3 |
| Cura maior | 5 | 6d8 de vida (também fora da luta) | 900 | 3 |
| Nevasca | 7 | 6d10 de dano | 1600 | 4 |
| Meteoro | 9 | 8d12 de dano | 3500 | 5 |

## Monstros (proposta)

| Página | Região | Monstro | Vida | Ataque | Defesa | Moedas | XP | Despojo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Campos | 1 | Slime | 8 | 1d4 | — | 2d4 | 3 | gotas de gosma |
| Campos | 1 | Rato gigante | 6 | 1d6 | — | 2d4 | 3 | rabos de rato |
| Campos | 2 | Goblin | 14 | 2d4 | — | 3d6 | 6 | orelhas de goblin |
| Campos | 2 | Lobo | 16 | 1d10 | — | 3d6 | 6 | presas de lobo |
| Campos | 3 | Aranha gigante | 20 | 2d6 | 1d4 | 4d6 | 10 | pernas de aranha |
| Campos | 3 | Orc | 24 | 1d12 | 1d4 | 4d6 | 10 | dentes de orc |
| Deserto | 4 | Escorpião gigante | 26 | 2d6 | 1d6 | 4d8 | 14 | ferrões |
| Deserto | 4 | Naja | 22 | 2d8 | — | 4d8 | 14 | escamas de naja |
| Deserto | 5 | Esqueleto | 34 | 2d8 | 1d4 | 5d8 | 19 | ossos |
| Deserto | 5 | Múmia | 40 | 3d6 | 1d6 | 5d8 | 19 | faixas de múmia |
| Deserto | 6 | Verme da areia | 58 | 3d8 | 1d6 | 6d8 | 25 | dentes de verme |
| Deserto | 6 | Golem de pedra | 64 | 3d10 | 2d6 | 6d8 | 25 | lascas de pedra |
| Montanhas Geladas | 7 | Lobo do gelo | 62 | 3d10 | 1d6 | 6d10 | 32 | pelos gelados |
| Montanhas Geladas | 7 | Boneco de neve malvado | 70 | 3d8 | 2d6 | 6d10 | 32 | narizes de cenoura |
| Montanhas Geladas | 8 | Yeti | 92 | 4d8 | 2d6 | 7d10 | 40 | tufos de yeti |
| Montanhas Geladas | 8 | Ogro | 100 | 4d8 | 2d4 | 7d10 | 40 | tufos de pelo de ogro |
| Montanhas Geladas | 9 | Espírito do gelo | 88 | 4d10 | 2d6 | 8d10 | 50 | flocos eternos |
| Montanhas Geladas | 9 | Troll | 115 | 4d10 | 2d8 | 8d10 | 50 | unhas de troll |
| Pântano Sombrio | 10 | Zumbi | 130 | 5d8 | 2d6 | 4d20 | 62 | dedos de zumbi |
| Pântano Sombrio | 10 | Sapo gigante | 118 | 4d12 | 2d8 | 4d20 | 62 | línguas de sapo |
| Pântano Sombrio | 11 | Fantasma | 125 | 5d10 | 3d6 | 5d20 | 75 | lençóis rasgados |
| Pântano Sombrio | 11 | Bruxa do pântano | 135 | 6d8 | 2d6 | 5d20 | 75 | verrugas de bruxa |
| Pântano Sombrio | 12 | Cavaleiro negro | 165 | 5d12 | 3d8 | 6d20 | 90 | plumas negras |
| Pântano Sombrio | 12 | Ceifador | 150 | 6d10 | 2d8 | 6d20 | 90 | ampulhetas |
| Vulcão | 13 | Salamandra de fogo | 185 | 6d10 | 3d6 | 7d20 | 108 | caudas de salamandra |
| Vulcão | 13 | Diabrete | 170 | 5d12 | 3d8 | 7d20 | 108 | chifrinhos |
| Vulcão | 14 | Cão infernal | 225 | 7d10 | 3d8 | 8d20 | 128 | coleiras em brasa |
| Vulcão | 14 | Elemental de fogo | 215 | 6d12 | 4d6 | 8d20 | 128 | brasas vivas |
| Vulcão | 15 | Golem de magma | 275 | 7d12 | 5d6 | 8d20 | 150 | pedras de magma |
| Vulcão | 15 | Fênix | 250 | 8d10 | 3d8 | 8d20 | 150 | penas de fênix |
| Vulcão | Chefe | Dragão Vermelho | 600 | 8d12 | 4d8 | 10d20 | — | — |

Moedas e experiência dependem só da região (os dois monstros de uma região dão o mesmo). Os chefes de cada monstro estão em Masmorras e chefes. Vencer o Dragão Vermelho, no fim do Vulcão, termina a aventura: o mestre escreve "FIM" e mostra passos, monstros vencidos, nível e ouro. Dá para continuar explorando ou começar outra aventura.

Os monstros novos de cada bioma também são desenhados à mão por código: escorpião de rabo em gomos, naja de capuz aberto, múmia de faixas soltas, verme saindo da areia; lobo do gelo (o lobo em azul), boneco de neve de cartola e sobrancelha brava, yeti peludo, espírito do gelo com cristais em volta; zumbi de braços esticados, sapo de língua de fora, fantasma de lençol, ceifador de foice; salamandra e cão infernal com labaredas nas costas, diabrete de tridente, elemental de fogo, golem de magma (o golem em marrom com rachaduras de lava) e fênix de asas abertas.

## Golpes especiais dos monstros (proposta)

Alguns monstros fazem mais que bater. Os chefes de cada um têm o mesmo golpe; a folha de antes da luta (monstro desenhado, surpresa, porta da masmorra, chefe e covil) avisa qual é.

- **Maldição:** na vez dele, **30%** de chance de, em vez de atacar, lançar um feitiço que tira **1 ou 2 de cada dado** de ataque e de defesa do herói (nenhum dado fica abaixo de 1). Dura **1 + região/3 rodadas**, arredondado para cima (2 nos Campos, 3 no Deserto, 4 nas Montanhas, 5 no Pântano, 6 no Vulcão; o chefe, uma a mais); a rodada conta a cada vez do monstro, menos a vez em que lançou. Não lança outra enquanto a primeira dura. Feitiços e poções do herói não sofrem a maldição.
- **Quebrar:** os brutos, quando atacam, têm **25%** de chance de quebrar o maior dado de defesa que ainda sobra ao herói, **até o fim da luta** (escudo 2d6 vira 1d6). Pode quebrar mais de um.
- A luta mostra, embaixo da vida do herói, a maldição (com as rodadas que faltam) e quantos dados estão quebrados. Tudo some quando a luta acaba. A habilidade Fé (ver Habilidades passivas) acaba com os dois.

| Monstro | Golpe | Tipo | Efeito |
| --- | --- | --- | --- |
| Aranha gigante | Teia | maldição | −1 por dado, 2 rodadas |
| Naja | Veneno | maldição | −1 por dado, 3 rodadas |
| Múmia | Maldição da múmia | maldição | −1 por dado, 3 rodadas |
| Golem de pedra | Soco de pedra | quebrar | — |
| Ogro | Clavada | quebrar | — |
| Espírito do gelo | Sopro gelado | maldição | −1 por dado, 4 rodadas |
| Troll | Pancada de troll | quebrar | — |
| Fantasma | Assombração | maldição | −1 por dado, 5 rodadas |
| Bruxa do pântano | Feitiço da bruxa | maldição | −2 por dado, 5 rodadas |
| Ceifador | Toque da morte | maldição | −2 por dado, 5 rodadas |
| Diabrete | Truque do diabrete | maldição | −1 por dado, 6 rodadas |
| Golem de magma | Punho de magma | quebrar | — |
| Fênix | Chama sagrada | maldição | −2 por dado, 6 rodadas |
| Dragão Vermelho | Garra do dragão | quebrar | — |

## Habilidades passivas (proposta)

Combinações de pôquer nos dados. Cada nível ganho dá **1 ponto de habilidade**, e cada fogueira do caderno ensina **uma habilidade só**, sempre a mesma (a fogueira k ensina a habilidade k da tabela abaixo; a folha do acampamento mostra só a dela). Aprender custa o ponto e é na hora.

- **Só 2 equipadas (definido):** o herói guarda todas as que aprendeu, mas só **2** ficam equipadas, e só as equipadas disparam. A recém-aprendida entra equipada se houver vaga; a troca é na mochila (Equipar / Tirar), a qualquer hora fora da luta. Escolher a dupla vira parte da estratégia: uma de ataque e uma de defesa, duas de ataque, ou uma de feitiço para quem joga de mago.

- **Passivas:** não têm botão. Quando os números que caíram nos dados formam a combinação, o efeito acontece e a luta mostra o nome da combinação ("Dois pares! Golpe crítico: dano em dobro.").
- **Ataque** olha os dados da arma, **defesa** os do escudo + armadura no turno do monstro, **feitiço** os do feitiço.
- **Uma por rolagem:** se as duas habilidades equipadas servem na mesma rolagem, vale só a de combinação mais alta (ordem da tabela de combinações).
- A combinação olha os números que caíram, antes da maldição (ver Golpes especiais). Dados de tamanhos diferentes (escudo d12 e armadura d20) combinam pelo número.
- Com 1 dado só, apenas o Dado cheio é possível; as combinações maiores pedem armas e armaduras de mais dados, por isso aparecem nas páginas do fim.

| Combinação | Precisa de |
| --- | --- |
| Dado cheio | algum dado tirar o número mais alto dele (6 no d6, 20 no d20) |
| Par | 2 dados iguais |
| Dois pares | 2 pares de dados iguais (uma quadra também conta) |
| Trinca | 3 dados iguais |
| Sequência | 3 números seguidos, como 4-5-6 |
| Full house | uma trinca e um par |
| Sequência grande | 5 números seguidos |
| Quadra | 4 dados iguais |
| Quina | 5 dados iguais |

| Fogueira | Página | Habilidade | Dados | Combinação | Efeito |
| --- | --- | --- | --- | --- | --- |
| 1 | Campos | Golpe caprichado | ataque | Dado cheio | rola mais um dado da arma e soma |
| 2 | Campos | Escudo firme | defesa | Dado cheio | rola mais um dado de defesa (o maior) e soma |
| 3 | Campos | Golpe certeiro | ataque | Par | ignora a defesa do monstro |
| 4 | Campos | Mente leve | feitiço | Par | o feitiço não gasta Magia |
| 5 | Campos | Revide | defesa | Par | o monstro toma metade da sua defesa |
| 6 | Deserto | Pancada tonta | ataque | Trinca | o monstro fica tonto e perde a próxima vez |
| 7 | Deserto | Faísca extra | feitiço | Dado cheio | rola mais um dado do feitiço e soma |
| 8 | Deserto | Muralha | defesa | Trinca | bloqueia o golpe inteiro |
| 9 | Deserto | Golpe sedento | ataque | Sequência | cura metade do dano causado |
| 10 | Deserto | Eco | feitiço | Trinca | o feitiço acontece de novo, de graça |
| 11 | Montanhas Geladas | Golpe crítico | ataque | Dois pares | dano em dobro |
| 12 | Montanhas Geladas | Fé | defesa | Dois pares | acaba com a maldição e conserta os dados quebrados |
| 13 | Montanhas Geladas | Fôlego | defesa | Sequência | cura metade da sua defesa |
| 14 | Montanhas Geladas | Magia sedenta | feitiço | Dois pares | cura metade do dano do feitiço |
| 15 | Montanhas Geladas | Magia dupla | feitiço | Sequência | feitiço em dobro (dano ou cura) |
| 16 | Pântano Sombrio | Golpe duplo | ataque | Full house | ataca duas vezes |
| 17 | Pântano Sombrio | Contra-ataque | defesa | Full house | você ataca de volta na hora |
| 18 | Pântano Sombrio | Feitiço tonto | feitiço | Full house | o monstro fica tonto e perde a próxima vez |
| 19 | Pântano Sombrio | Golpe esmagador | ataque | Quadra | dano em triplo |
| 20 | Pântano Sombrio | Espelho | defesa | Quadra | o golpe volta inteiro para o monstro, e você não toma nada |
| 21 | Vulcão | Dança das lâminas | ataque | Sequência grande | ataca duas vezes, ignorando a defesa |
| 22 | Vulcão | Tempestade | feitiço | Quadra | feitiço em triplo (dano ou cura) |
| 23 | Vulcão | Cometa | feitiço | Quina | feitiço cinco vezes mais forte |
| 24 | Vulcão | Golpe lendário | ataque | Quina | dano cinco vezes maior |
| 25 | Vulcão | Bênção do mestre | defesa | Quina | bloqueia tudo e cura toda a sua vida |

- O segundo golpe do Golpe duplo e da Dança das lâminas e o golpe do Contra-ataque rolam de novo (e podem disparar outra habilidade de ataque), mas não atacam uma terceira vez. O Eco também não ecoa de novo.
- Os multiplicadores valem sobre o dano depois da defesa do monstro.
- O herói chega ao fim do Vulcão por volta do nível 39, então dá para aprender as 25; o que limita é passar pelas fogueiras e as 2 vagas.
- As de combinação rara (Quadra, Quina) disparam pouco: valem como aposta, não como dupla de todo dia.
- **Em aberto:** trocar as equipadas só nas fogueiras (como num souls-like) em vez de em qualquer lugar; uma terceira vaga ganha mais tarde (nível ou chefe); deixar o jogador escolher qual vale quando as duas servem.

## Fogueiras (acampamentos)

**Definido**

Não há vilas nem cidades. Como num souls-like, cada página tem 5 acampamentos com fogueira (ver Mundo), e outros guerreiros descansam em volta dela.

- **Chegar** numa fogueira marca ali o lugar onde o herói acorda se desmaiar e abre a folha do acampamento. Na primeira vez, o mestre narra a chegada.
- **Descansar** é de graça: enche vida e Magia e, a partir do passo 60 do dia, vira "Dormir" e passa a noite. Mas **todo monstro vencido volta**, em todas as páginas e masmorras: o mestre apaga os X com a borracha. Chefes vencidos, o dragão e baús abertos não voltam.
- **A veterana da fogueira ensina** a habilidade daquela fogueira, por 1 ponto de habilidade (ver Habilidades passivas). Cada fogueira mostra só a sua; para aprender todas, é preciso passar por todas.
- **Duelo:** em cada fogueira, um guerreiro com nome (Zeca Machado, Tina Escudo... um por fogueira, 25 no caderno) aceita um duelo de treino, desenhado como um boneco-palito de capa azul, elmo e escudo redondo. É uma luta normal de dados, mas **ninguém desmaia**: quem chega a 0 perde e fica com 1 de vida, sem perder ouro. Não tem noite (+1 dado), e "Fugir" vira "Desistir", que sai sem rolar.
  - **Números (proposta):** a região da fogueira (as 5 de uma página ficam nas regiões 1, 1, 2, 2 e 3 dela); vida = a média dos dois monstros da região × 1,4; ataque e defesa do monstro de ataque mais forte (defesa 1d4 se ele não tiver).
  - **Prêmio:** a primeira vitória em cada fogueira paga as moedas e a experiência da primeira missão daquela região (ver Missões). **Revanche é só treino**, sem prêmio. Até a 0.6.0 cada revanche pagava um quarto das moedas; como perder não custa nada e descansar é de graça, dava para tirar moeda sem fim e sem risco (crítica de um jogador).
- **Os guerreiros vendem** (ver Itens). Qualquer um deles pode ser atacado (ver Atacar gente):
  - **Ferreiro andarilho:** armas, escudos e armaduras, da lista daquela fogueira.
  - **Maga:** feitiços, da lista daquela fogueira.
  - **Mercador:** poções (a Poção grande só da 3ª página em diante) e tochas (5 moedas); compra despojos (a região do monstro em moedas cada; os guardados para uma missão de juntar não entram na venda) e equipamento da mochila pela metade do preço.
- Perto de uma fogueira (até 2 quadrados) não há encontro surpresa.

**Estoque de cada fogueira (proposta, 0.7.0).** O que o ferreiro e a maga vendem. As 5 fogueiras de uma página ficam nas regiões 1, 1, 2, 2 e 3 dela, e as do fundo vendem coisa melhor: quem avança na página encontra vendedores melhores. A primeira fogueira de cada página ainda vende o melhor da página anterior.

| Página | Fogueira 1 | Fogueira 2 | Fogueira 3 | Fogueira 4 | Fogueira 5 |
| --- | --- | --- | --- | --- | --- |
| Campos | espada de madeira, tampa de panela, roupa de couro, Faísca | espada curta, tampa de panela, roupa de couro, Cura | espada curta, escudo de madeira, Faísca | escudo de madeira, roupa de couro, Cura | **espada de ferro**, escudo de madeira, roupa de couro, Faísca, Cura |
| Deserto | espada de ferro, escudo de madeira, cota de malha, Bola de fogo | machado, escudo de ferro, cota de malha, Cura | machado, escudo de ferro, cota de malha, Bola de fogo | espada de prata, escudo de ferro, armadura de placas | espada de prata, escudo de ferro, armadura de placas, Bola de fogo, Cura |
| Montanhas Geladas | espada de prata, escudo de ferro, armadura de placas, Raio | montante, escudo de torre, armadura de placas, Cura maior | montante, escudo de torre, armadura de gelo, Raio | espada rúnica, escudo de torre, armadura de gelo | espada rúnica, escudo de torre, armadura de gelo, Raio, Cura maior |
| Pântano Sombrio | espada rúnica, escudo de torre, armadura de gelo, Nevasca | espada de cristal, escudo de torre, armadura de gelo, Cura maior | espada de cristal, escudo rúnico, armadura de gelo, Nevasca | espada de cristal, escudo rúnico, armadura rúnica | espada de cristal, escudo rúnico, armadura rúnica, Nevasca, Cura maior |
| Vulcão | espada de cristal, escudo rúnico, armadura rúnica, Meteoro | espada de cristal, escudo de dragão, armadura rúnica, Cura maior | Lâmina do Dragão, escudo de dragão, armadura rúnica, Meteoro | Lâmina do Dragão, escudo de dragão, armadura de dragão | Lâmina do Dragão, escudo de dragão, armadura de dragão, Meteoro, Cura maior, Nevasca |

O mercador continua igual em toda fogueira (poções pela página, tochas, compra de despojos e equipamento).

**Em aberto**

- Subir de nível só na fogueira, gastando experiência (como as almas de um souls-like), em vez de subir na hora.
- Um mascate com 1–2 itens sorteados por dia em cada fogueira (de vez em quando um da página seguinte, caro), sugerido junto com o estoque próprio.

## Atacar gente

**Definido (0.7.0)**

Qualquer pessoa do caderno pode ser atacada: os personagens do caminho (os de missão, com "!", e os de dica, com "?") e cada um da fogueira (veterana, duelista, ferreiro, maga e mercador). **Quem morre não volta mais**, nem com o descanso: o caminho fica com um X para sempre, e a fogueira mostra o título riscado.

- **Como:** nas conversas com os personagens do caminho há o botão "Atacar"; na folha da fogueira, cada um tem "Atacar" ao lado do título. Antes da luta o mestre avisa o que se perde e mostra os números.
- **É luta de verdade**, como contra um monstro: tem noite (+1 dado), fugir com d20, e perder é desmaiar (metade do ouro). Diferente do duelo, que é treino.
- **O que se perde:**
  - personagem de missão: as missões dele acabam, e a que estiver aceita some da margem do caderno;
  - personagem de dica: as dicas dele (o presente, se tinha, ele já deu ao conversar, antes do botão "Atacar");
  - veterana: ninguém mais ensina a habilidade daquela fogueira (cada habilidade só existe numa fogueira);
  - duelista: os duelos daquela fogueira;
  - ferreiro, maga, mercador: a parte deles na loja daquela fogueira (o mercador também era quem comprava despojos e equipamento ali).
  - Descansar continua valendo em qualquer fogueira, mesmo sem ninguém em volta.
- **O que se ganha:** a bolsa da pessoa, uma vez só, e experiência. Pessoa não deixa despojo.
- **Números (proposta):** cada um luta como os monstros da região dele (a da fogueira ou a do quadrado): vida = (a média dos dois monstros da região + 10) × o fator do papel; ataque = o do monstro de ataque mais forte com dados a mais; defesa = a desse monstro (1d4 se ele não tiver). Bolsa = (região ÷ 2, arredondado para cima, + 1) dados; experiência = o dobro da de um monstro da região.

| Papel | Vida × | Dados de ataque a mais | Dado da bolsa |
| --- | --- | --- | --- |
| Ferreiro | 1,6 | +1 | d10 |
| Maga | 1 | +2 | d10 |
| Mercador | 0,9 | 0 | d20 |
| Veterana | 1,5 | +1 | d8 |
| Duelista | 1,4 | 0 | d10 |
| Personagem de missão | 1 | 0 | d10 |
| Personagem de dica | 0,8 | 0 | d6 |

**Em aberto**

- Consequência além da perda: guardas, preços mais altos nas outras fogueiras, o mestre lembrando do que o herói fez.
- O ferreiro morto deixar uma peça do estoque dele (hoje só moedas).

## Baús

Ao abrir, rola-se 1d20 de sorte:

- 1–13: moedas, (região + 1)d8.
- 14–18: uma poção (vida ou magia).
- 19–20: um equipamento da loja da página seguinte, que vai para a mochila (nunca a Lâmina do Dragão; no Vulcão, da própria loja do Vulcão).

Os baús das masmorras seguem a mesma regra, com a região da masmorra.

## Conta e save na nuvem

**Definido** (0.6.0)

- Na capa, **"Entrar / Criar conta"**: o jogador cria uma conta com **usuário e senha, sem e-mail** (usuário de 3 a 20 letras minúsculas, números, ponto, hífen ou sublinhado; senha de 6 ou mais). Com a conta, ele continua a mesma aventura em qualquer aparelho. Sem conta, o jogo funciona igual a antes.
- **Senha esquecida não tem como recuperar**, porque não há e-mail. A folha de criar conta avisa para anotar a senha.
- O backend é o **Firebase**: o login é do Firebase Authentication (provedor E-mail/senha, com o usuário virando um e-mail interno `usuario@caderno-de-aventuras.manguebyte.github.io`, que nunca recebe nada), e o save fica no Firestore, um documento por jogador em `caderno-saves/{uid}` (o save inteiro como texto, mais nome, nível, página e hora). A senha fica só no Firebase Auth. As regras do Firestore deixam cada jogador ler e gravar só o próprio documento.
- **O save do aparelho continua sendo o principal** (o jogo joga sem internet). A nuvem é uma cópia que sobe ao chegar numa fogueira, descansar, virar a página, a cada 50 passos, ao voltar para a capa e quando o jogo vai para segundo plano, e só quando mudou. Nada sobe antes de o jogo comparar o save do aparelho com o da nuvem naquela sessão, para um save velho nunca apagar um mais novo.
- **Comparar os saves**, na capa, logo depois de entrar (ou ao abrir o jogo já com a conta entrada): se só um existe, fica esse; se são a mesma aventura (mesma semente), fica o salvo por último; se são aventuras diferentes, a folha "Duas aventuras" mostra as duas (nome, nível, página, data) e o jogador escolhe. A outra é apagada.
- Enquanto o `firebaseConfig` não está no protótipo (`nuvem.js`), a conta não aparece e nada do Firebase é carregado.

**Em aberto**

- Recuperar a senha (um e-mail opcional, ou uma pergunta secreta).
- Mais de uma aventura por conta.
- Ranking entre os jogadores (passos até o dragão, nível), usando as contas.

## Salvamento

Salvo no navegador a cada passo e após cada painel (`caderno-aventuras-save-v3`): semente do mundo, personagem (com tochas, despojos, missões, a página e o mapa em que ele está e a página da fogueira onde acorda), relógio e dia, e, para cada página e cada masmorra visitada, os quadrados revelados, monstros vencidos, baús abertos e o rastro. Para cada página, também os personagens visitados, as masmorras limpas e (na última) se o dragão foi vencido. Ao continuar, as 5 páginas são geradas de novo da semente e o mapa atual é redesenhado de uma vez.

Da 0.5.0 em diante também ficam salvos: onde está o lendário de cada página, a vida dele e se caiu; os quadrados de lava que ainda não esfriaram (voltam para o mapa do Vulcão ao carregar); os passos até a próxima tempestade e erupção; as vitórias nos duelos de cada fogueira; o andar da masmorra em que o herói está (o andar de baixo de uma masmorra é salvo como "página:masmorra:1"); a chave pega, as armadilhas disparadas e o enigma respondido, junto com os baús abertos de cada masmorra. Um save da 0.4 carrega normalmente, com os lendários no lugar de começo e de vida cheia.

Da 0.7.0 em diante também ficam salvos os personagens do caminho mortos (em cada página) e quem morreu em cada fogueira. Um save da 0.6 carrega com todo mundo vivo.

Para cada página também fica salvo se o guardião da passagem foi vencido (um save antigo carrega com os guardiões vivos; quem já esteve na página seguinte pode passar por trás deles). As habilidades aprendidas e as 2 equipadas ficam no personagem; os pontos não são guardados, são o nível − 1 − as habilidades aprendidas. Um save da 0.2.0 (sem habilidades) carrega normalmente e já chega com um ponto por nível subido; um da 0.3 (todas valiam) equipa as 2 primeiras que aprendeu.

Saves de antes das páginas (`-v1` e `-v2`) não são carregados: a mesma semente agora gera outro mundo, então o jogo começa uma aventura nova.

## Em aberto (geral)

- Nome definitivo.
- Plataformas da versão final (web, PC, celular).
- Balanceamento de toda a curva (protótipo ainda não foi jogado do começo ao fim por uma pessoa). Com 5 páginas, a aventura ficou bem mais longa: falta saber se cansa, e se vale encurtar as páginas do meio.
- Multijogador local "da sala de aula": vários heróis, um passa o turno para o outro.
- Modo mestre: um jogador desenha/posiciona o mapa e os monstros para outro jogar.

## Histórico de versões

- **0.7.0** (2026-10-28): balanceamento a partir da crítica de um jogador ("o personagem fica muito forte rápido, tem muito recurso", dava para ganhar moeda sem fim nos duelos, os vendedores eram iguais em toda a página). Dá para atacar qualquer pessoa do caderno: os personagens do caminho e cada um da fogueira. É luta de verdade, e quem morre não volta: some a parte dele (missões, dicas, habilidade, duelo ou loja) e o herói fica com a bolsa. Cada fogueira vende a sua lista de arma, defesa e feitiço, e as do fundo da página vendem coisa melhor (a Espada de ferro só na última dos Campos). Missões pagam metade das moedas. Revanche de duelo não paga mais nada. Saves da 0.6 continuam valendo.
- **0.6.0** (2026-10-27): conta com usuário e senha (sem e-mail) para salvar a aventura na nuvem (Firebase Auth + Firestore) e continuar em qualquer aparelho. O save do aparelho continua sendo o principal; ao entrar, o jogo junta os dois (o mais novo ganha; aventuras diferentes, o jogador escolhe). Desligado até o `firebaseConfig` ser colado em `nuvem.js`. Saves da 0.5 continuam valendo.
- **0.5.0** (2026-10-27): para o jogo ficar menos repetitivo (crítica de um jogador: "me pareceu repetitivo em certo momento"), cada página da segunda em diante ganha uma regra própria: tempestade de areia que apaga um pedaço do mapa e miragens no Deserto, gelo escorregadio nas Montanhas Geladas, neblina e monstros que só aparecem à noite no Pântano Sombrio, erupções de lava que fecham caminhos por um tempo no Vulcão. Um monstro lendário por página, com nome, que anda pelo mapa, foge do herói e pode fugir da luta guardando a vida que perdeu. Duelos de treino com um guerreiro em cada fogueira (ninguém desmaia). Cada masmorra ganha uma variação: porta trancada com chave, armadilhas escondidas (d20), enigma "O que é, o que é?" ou um andar de baixo com o chefe. A mesma semente gera as mesmas páginas e masmorras de antes, e saves da 0.4 carregam.
- **0.4.0** (2026-10-27): lutas em grupo (alguns monstros do mapa vêm em dupla ou trio, com "×2"/"×3" no desenho; você escolhe o alvo e cada um ataca na vez deles); guardião de chefe em cima de cada canto dobrado (4: Senhor da Guerra Orc, Verme Colossal, Troll da Montanha, Cavaleiro da Morte), com uma escada escondida numa masmorra de cada página que sai atrás dele, para quem prefere explorar a lutar; o protótipo conta quantas pessoas o abrem (Google Analytics, só a visita, com aviso na capa); folha de luta em três colunas (monstro, dados, herói; no celular em pé, um embaixo do outro); só 2 habilidades passivas equipadas de cada vez (o herói guarda todas as aprendidas e troca na mochila). Saves da 0.3 carregam (equipam as 2 primeiras habilidades).
- **0.3.1** (2026-10-27): correção: a mochila não se atualizava depois de equipar um item, beber uma poção ou usar Cura (a ação acontecia, mas a folha só mudava ao fechar e abrir de novo).
- **0.3.0** (2026-10-27): habilidades passivas com combinações de pôquer nos dados (25, uma por fogueira, um ponto por nível); golpes especiais dos monstros (maldição que tira 1 ou 2 de cada dado por algumas rodadas, e brutos que quebram um dado da defesa até o fim da luta); teto de 5 dados na arma e na defesa (escudo até 2, armadura até 3, com dados maiores); menos encontros surpresa (mata 8,5% → 5%, pântano 9,5% → 6%, campo e areia um pouco menos) e 8 passos de calma depois de cada um. Saves da 0.2.0 continuam valendo.
- **0.2.0** (2026-10-26): o protótipo vira app instalável no celular (PWA): ícone na tela inicial, tela cheia, joga sem internet, em pé ou deitado. Nova arrumação da tela para o celular deitado (HUD, narração, direcional, luta e folhas menores).
- **0.1.0** (2026-10-26): início do versionamento; marca o estado do GDD e do protótipo neste dia. Já com as 5 páginas de bioma.

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para fazer o Caderno de Aventuras em **Unity 6**. O protótipo web ([`prototipos/caderno-de-aventuras/`](prototipos/caderno-de-aventuras/)) é a referência de comportamento: cada script daqui aponta o arquivo do protótipo que ele traduz. Os números são os da Parte 1 e ficam num asset (`GameDatabase`), editáveis no Inspector.

> **Atenção: este guia ainda descreve a versão de uma ilha só** (6 regiões, 12 monstros, o dragão no fim da ilha, save `v2`), de antes da 0.3.0 (sem habilidades passivas, golpes especiais, teto de 5 dados, guardiões das passagens nem a folha de luta em três colunas, e com as chances antigas de encontro surpresa). As 5 páginas de bioma da Parte 1 (Mundo) e as regras da 0.3.0, da 0.4.0, da 0.5.0 (regras de cada página, monstro lendário, duelos, variações das masmorras) e da 0.7.0 (atacar gente, estoque de cada fogueira, missões pagando menos) já estão no protótipo, mas entram aqui depois que forem aprovadas jogando. Até lá, a mesma semente gera mundos diferentes no protótipo e no Unity.

## Decisão técnica: tudo desenhado com UI Toolkit

O jogo não tem sprites nem física. Tudo (mapa, monstros, herói, ícones, dados) é uma lista de traços tremidos, como no protótipo. No Unity, a ferramenta que desenha linhas como o canvas do navegador é o **`Painter2D` do UI Toolkit**: `MoveTo`, `LineTo`, `Stroke`, com espessura, cor, transparência e ponta redonda.

Por isso o jogo inteiro roda numa única cena, dentro de um `UIDocument`:

- **Cada quadrado do mapa é um `VisualElement`** que desenha seus traços uma vez. O UI Toolkit guarda a geometria pronta até alguém chamar `MarkDirtyRepaint()`. É o mesmo papel dos "chunks assados" do protótipo: só o quadrado que está sendo desenhado pela caneta do mestre é refeito a cada quadro.
- **A câmera é só um `translate` e um `scale`** no elemento que contém o mapa. Mover um elemento não refaz a geometria dos filhos.
- **Menus, luta e HUD** usam o mesmo sistema, então os ícones e dados desenhados à mão aparecem na interface sem conversão.

**Em aberto:** trocar a arte por código por ilustrações feitas a lápis de verdade (escaneadas). Nesse caso, `MonsterArt`, `IconArt` e `TileArt` passam a devolver imagens, e o resto do guia não muda.

## Convenções

- **Nomes no projeto em inglês, textos do jogo e comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele.
- **Namespaces:**
  - `Caderno.Core`: regras em C# puro, sem `MonoBehaviour` (sorte, dados, ilha, personagem, combate).
  - `Caderno.Data`: tabelas do jogo (`GameDatabase`), cores e textos.
  - `Caderno.Sketch`: o traço à mão e todos os desenhos.
  - `Caderno.UI`: elementos de interface (folhas, HUD, bandeja de dados, som).
  - `Caderno.Game`: o `GameController`, o mapa na tela e o save.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de save e de tabela:** campos públicos `camelCase`.
- **Unidades:** um quadrado do mapa mede **64** unidades, como no protótipo. Assim todas as coordenadas dos desenhos são copiadas sem conversão.
- **Código assíncrono** com `Awaitable` (Unity 6): `await Awaitable.WaitForSecondsAsync(0.5f)` espera meio segundo sem travar o jogo. É o mesmo `await wait(500)` do protótipo.

## Arquitetura em uma página

```
                         GameController (MonoBehaviour, partial em 8 arquivos)
  Teclado/toque ──▶ Update: passo, caminho ──▶ Arrive ──▶ relógio, tocha, vila / baú / masmorra / surpresa
                         │                         │
            MapView ◀────┘ (revela, rastro, X)     └──▶ Combat ──▶ DiceTray + FoeView
   ┌─────────────────────────────┐                           │
   │ PaperBackground (pauta)     │                 CombatRules (C# puro)
   │ world (translate + scale)   │
   │   quadrados (SketchElement) │   PanelHost (folhas) · Hud · Narrator · Sfx
   │   marcas, herói, caneta     │   Missões (Quests) · Masmorras (Dungeons)
   │ escuridão (DarkOverlay)     │
   │ margem e furos              │   SaveSystem (JSON) ◀── PlayerState + RunState
   └─────────────────────────────┘
  IslandGenerator (C# puro, mesma conta do protótipo) ──▶ Island (a ilha e cada masmorra)
  Sketch + ArtKit ──▶ MonsterArt · PeopleArt · IconArt · TileArt (listas de traços)
```

| Protótipo | Unity |
| --- | --- |
| `sketch.js` | `Rng`, `Stroke`, `Sketch`, `StrokePainter`, `SketchElement` |
| `world.js` | `Island`, `IslandGenerator` (ilha e masmorras), `Texts` |
| `art.js` | `ArtKit`, `MonsterArt`, `PeopleArt`, `IconArt`, `TileArt` |
| `game.js` | `GameController` (8 partes), `MapView`, `DarkOverlay`, `PanelHost`, `DiceTray`, `FoeView`, `Hud`, `Sfx`, `SaveSystem` |

- **Regra de ouro:** as regras (rolar, dano, fuga, experiência, noite, geração da ilha e das masmorras) ficam em `Caderno.Core`, sem Unity no meio. A tela só mostra o estado e repassa os cliques.

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 com uma cena, um `UIDocument`, as duas fontes de mão e o Input System, rodando sem erros.

### 0.1 Criar o projeto

1. No **Unity Hub**, instale um **Unity 6 LTS** (6000.x) com **Web Build Support** e **Android Build Support**.
2. **New project → Universal 2D**, nome `CadernoDeAventuras`. O template 2D já tem câmera ortográfica; o jogo não usa sprites, mas o template é o mais leve.

### 0.2 Estrutura de pastas

```
Assets/_Project/
  Scripts/
    Core/     (regras em C# puro)
    Data/     (GameDatabase, cores, textos)
    Sketch/   (traço à mão e desenhos)
    UI/       (folhas, HUD, dados, som)
    Game/     (GameController, MapView, save)
    Editor/   (menus de teste; o nome "Editor" é especial: não entra no build)
  UI/         (Caderno.uss e CadernoPanel.asset)
  Fonts/
  Data/       (GameDatabase.asset)
  Scenes/     (Main.unity)
```

### 0.3 Fontes

Baixe do Google Fonts (licença OFL, livre para jogos) e coloque em `Assets/_Project/Fonts/`:

- **Caveat** (`Caveat-Bold.ttf`): títulos e nomes no mapa.
- **Patrick Hand** (`PatrickHand-Regular.ttf`): todo o resto.

### 0.4 Pacotes e ajustes

| Pacote ou ajuste | Para quê |
| --- | --- |
| **Input System** (já vem no Unity 6) | Setas/WASD com o mesmo código no PC e no navegador. |
| **Project Settings → Player → Active Input Handling = Input System Package (New)** | O código lê `Keyboard.current`. |
| UI Toolkit (já vem no Unity 6) | Todo o desenho e a interface. |

### 0.5 Panel Settings e cena

1. Em `Assets/_Project/UI/`: **Create → UI Toolkit → Panel Settings Asset**, nome `CadernoPanel`.
   - **Scale Mode = Scale With Screen Size**, **Reference Resolution = 1366 × 768**, **Screen Match Mode = Match Width Or Height**, **Match = 0.5**. Assim a folha tem o mesmo tamanho aparente no monitor e no celular.
   - **Clear Color** ligado, cor `#FBF7EC` (o creme do papel).
2. Crie a cena `Assets/_Project/Scenes/Main.unity` e adicione-a na **Build Profiles → Scene List**.
3. Na cena, crie um GameObject vazio `Caderno` com o componente **UI Document** (Panel Settings = `CadernoPanel`, Source Asset vazio: toda a interface é montada por código) e um **Audio Source** (Play On Awake desligado).
4. Crie `Assets/_Project/UI/Caderno.uss` vazio por enquanto (é preenchido na Fase 6).

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- Play na cena `Main` mostra a tela creme, sem erros.

#### Problemas comuns
- **`InputSystem` não encontrado:** o Active Input Handling ficou em "Input Manager (Old)".
- **Tela azul em vez de creme:** o Clear Color do Panel Settings está desligado e aparece a cor da câmera. Ligue-o ou mude o Background da câmera para `#FBF7EC`.

Próxima fase: **Núcleo**, com a sorte com semente, os dados e as tabelas do jogo.

---

# Parte 4 — Implementação Unity: Fase 1 (Núcleo: sorte, dados e tabelas)

## Fase 1 — Núcleo: sorte, dados e tabelas

> Objetivo desta fase: a sorte com semente, a notação de dados ("2d6"), as tabelas de itens, feitiços e monstros (com os chefes e os despojos) da Parte 1 num asset editável, e o estado do personagem (com tochas, despojos e missões).

### 1.1 `Rng`: sorte com semente

```csharp
// Caminho: Assets/_Project/Scripts/Core/Rng.cs
namespace Caderno.Core
{
    // POR QUE: o mapa e os desenhos precisam sair iguais toda vez que o jogo
    // é aberto (a ilha vem de uma semente salva, e cada quadrado é desenhado
    // de novo ao carregar). UnityEngine.Random não serve: é um só para o jogo
    // inteiro e muda com qualquer sorteio no meio.
    // ESTRATÉGIA: a mesma conta do protótipo (mulberry32 e o hash FNV de
    // sketch.js). Feita com `uint`, que dá a volta em 2^32 igual ao
    // Math.imul do JavaScript. Resultado: a mesma semente gera a mesma ilha
    // no protótipo e no Unity, o que ajuda a comparar os dois.
    public sealed class Rng
    {
        private uint _a;

        public Rng(uint seed) { _a = seed; }

        // Próximo número em [0, 1).
        public double Next()
        {
            unchecked
            {
                _a += 0x6D2B79F5;
                uint t = (_a ^ (_a >> 15)) * (1 | _a);
                t = (t + ((t ^ (t >> 7)) * (61 | t))) ^ t;
                return (t ^ (t >> 14)) / 4294967296.0;
            }
        }

        // Versão float, para geometria.
        public float NextF() => (float)Next();

        // Número entre a e b.
        public float Range(float a, float b) => a + NextF() * (b - a);

        // Índice entre 0 e n-1 (o Math.floor(r() * n) do protótipo).
        public int Index(int n) => (int)(Next() * n);

        // Mistura vários inteiros numa semente (ex.: semente da ilha + x + y).
        public static uint Hash(params int[] values)
        {
            unchecked
            {
                uint h = 2166136261;
                foreach (int v in values)
                {
                    h = (h ^ (uint)v) * 16777619u;
                    h ^= h >> 13;
                }
                return h;
            }
        }
    }
}
```

### 1.2 `DiceSpec`: a notação "2d6"

```csharp
// Caminho: Assets/_Project/Scripts/Core/DiceSpec.cs
using System;
using System.Collections.Generic;

namespace Caderno.Core
{
    // POR QUE: no jogo, poder é um punhado de dados (Parte 1, Combate). Um
    // item não dá "+3 de ataque": dá "2d6". Este tipo guarda isso.
    // ESTRATÉGIA: struct [Serializable] para aparecer no Inspector e ir para o
    // save. count = 0 quer dizer "nenhum dado" (monstro sem defesa).
    // [Serializable] = "o Unity pode guardar e mostrar este tipo".
    [Serializable]
    public struct DiceSpec
    {
        public int count;
        public int sides;

        public DiceSpec(int count, int sides) { this.count = count; this.sides = sides; }

        public bool IsNone => count <= 0;

        // Média, para comparar itens na loja.
        public float Average => count * (sides + 1) / 2f;

        // "2d6", ou "—" quando não há dado.
        public override string ToString() => IsNone ? "—" : $"{count}d{sides}";
    }

    // POR QUE: rolar é uma regra, não desenho. Fica separado para ser usado
    // pelo combate, pelo baú e pela mochila do mesmo jeito.
    public static class Dice
    {
        // Abre "2d6 + 1d4" numa lista de faces por dado: [6, 6, 4].
        // É essa lista que a bandeja desenha, um dado por item.
        public static List<int> Expand(params DiceSpec[] specs)
        {
            var list = new List<int>();
            foreach (var d in specs)
                for (int i = 0; i < d.count; i++) list.Add(d.sides);
            return list;
        }

        // Um dado de `sides` lados: 1..sides.
        public static int RollOne(Random rng, int sides) => rng.Next(1, sides + 1);

        // Soma de uma rolagem completa (usada fora da bandeja, ex.: poção na mochila).
        public static int RollSum(Random rng, params DiceSpec[] specs)
        {
            int total = 0;
            foreach (int s in Expand(specs)) total += RollOne(rng, s);
            return total;
        }
    }
}
```

### 1.3 Cores do caderno

```csharp
// Caminho: Assets/_Project/Scripts/Data/Palette.cs
using UnityEngine;

namespace Caderno.Data
{
    // POR QUE: as cores das canetas e lápis de cor (Parte 1, Estética). Ficam
    // num lugar só para o mapa, os monstros e a interface combinarem.
    // ESTRATÉGIA: os mesmos valores de S.C em sketch.js.
    public static class Palette
    {
        public static readonly Color Paper = Hex("#fbf7ec");
        public static readonly Color Ink = Hex("#2b2f45");
        public static readonly Color Blue = Hex("#2f66c9");
        public static readonly Color LBlue = Hex("#6fa6e8");
        public static readonly Color Green = Hex("#2e9446");
        public static readonly Color LGreen = Hex("#7fc463");
        public static readonly Color Brown = Hex("#8a5a2b");
        public static readonly Color Red = Hex("#d6383a");
        public static readonly Color Orange = Hex("#ef8a22");
        public static readonly Color Yellow = Hex("#e9be2c");
        public static readonly Color Purple = Hex("#8448c4");
        public static readonly Color Gray = Hex("#7b7d88");
        public static readonly Color Pink = Hex("#e46ea4");
        public static readonly Color Ochre = Hex("#c49a40");
        public static readonly Color Olive = Hex("#77863a");
        public static readonly Color Skin = Hex("#e9a87c");
        public static readonly Color Parchment = Hex("#efdcae");
        public static readonly Color Line = Hex("#9cc3e8");
        public static readonly Color Margin = Hex("#e58a8a");

        // Converte "#rrggbb" em Color.
        public static Color Hex(string hex)
        {
            ColorUtility.TryParseHtmlString(hex, out var c);
            return c;
        }
    }
}
```

### 1.4 Tipos das tabelas

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameTypes.cs
using System;
using Caderno.Core;
using UnityEngine;

namespace Caderno.Data
{
    // Onde o item vai (Parte 1, Itens). Poção não é equipada: vira contador.
    public enum Slot { Arma, Escudo, Armadura, Pocao }

    // Qual desenho de ícone usar (Fase 3, IconArt).
    public enum IconKind { Heart, Star, Coin, Sword, Axe, Shield, Armor, Potion, Scroll, Bag, Map, Chest, Die, Sound, SoundOff, Sun, Moon, Torch, TorchOff, Fire }

    public enum SpellKind { Dano, Cura }

    public enum PotionEffect { Nenhum, Vida, Magia }

    // POR QUE: uma linha da tabela de itens da Parte 1.
    // ESTRATÉGIA: classe [Serializable] dentro de uma lista do GameDatabase,
    // em vez de um asset por item: são ~18 itens, e editar tudo numa tela só
    // é mais fácil para balancear. `id` é a chave usada no save.
    [Serializable]
    public class ItemDef
    {
        public string id;
        public string nome;
        public Slot slot;
        public DiceSpec dado;      // arma: ataque; escudo/armadura: defesa; poção: quanto recupera
        public int preco;
        public IconKind icon;
        public Color cor;          // cor do lápis no ícone (material do item)
        public int loja;           // nível da fogueira que vende: 1 (regiões 1–2), 2 (3–4), 3 (5–6)
        public PotionEffect efeito;
    }

    // Uma linha da tabela de feitiços da Parte 1.
    [Serializable]
    public class SpellDef
    {
        public string id;
        public string nome;
        public int pm;
        public DiceSpec dado;
        public SpellKind tipo;
        public Color cor;
        public int preco;
        public int loja;
    }

    // Uma linha da tabela de monstros da Parte 1 (os chefes também).
    [Serializable]
    public class MonsterDef
    {
        public string id;          // mesmo id do desenho em MonsterArt ("rato", "chefe_rato")
        public string nome;
        public string pl;          // plural, para as missões ("ratos gigantes")
        public bool feminino;      // "uma Aranha gigante", "um Goblin"
        public int hp;
        public DiceSpec atk;
        public DiceSpec def;       // count 0 = sem defesa
        public DiceSpec ouro;
        public int xp;
        public string parte, partes;   // despojo no singular e no plural ("" = não deixa)
        public bool chefe;         // versão chefe de um monstro comum
        public string baseId;      // chefe: id do monstro comum dele ("rato")

        public string Um => feminino ? "uma" : "um";
        public string UmMaiusculo => feminino ? "Uma" : "Um";
        public string O => feminino ? "a" : "o";
        public string Despojo => chefe ? baseId : id;   // de quem é o despojo que ele deixa
    }
}
```

### 1.5 `GameDatabase`: as tabelas num asset

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameDatabase.cs
using System.Collections.Generic;
using Caderno.Core;
using UnityEngine;

namespace Caderno.Data
{
    // POR QUE: os números da Parte 1 (itens, feitiços, monstros) são proposta
    // de balanceamento. Num asset, dá para ajustar no Inspector durante o Play
    // sem mexer em código.
    // ESTRATÉGIA: ScriptableObject = um arquivo de dados do Unity (.asset) que
    // o jogo lê. FillDefaults escreve as tabelas do GDD; ele roda sozinho
    // quando o asset é criado (Reset) e pode ser chamado de novo pelo menu
    // de contexto (⋮ → "Preencher com os valores do GDD").
    [CreateAssetMenu(menuName = "Caderno/Banco de dados", fileName = "GameDatabase")]
    public class GameDatabase : ScriptableObject
    {
        public List<ItemDef> items = new List<ItemDef>();
        public List<SpellDef> spells = new List<SpellDef>();
        public List<MonsterDef> monsters = new List<MonsterDef>();

        // Masmorra de cada monstro: o lugar e o chefe lá no fundo (Parte 1, Masmorras e chefes).
        // Fica aqui porque os chefes da tabela de monstros saem dela.
        public static readonly (string kind, string lugar, string chefe)[] Masmorras =
        {
            ("slime", "Poço", "Rei Slime"), ("rato", "Esgoto", "Rei Rato"),
            ("goblin", "Caverna", "Rei Goblin"), ("lobo", "Toca", "Rei Lobo"),
            ("esqueleto", "Cripta", "Rei Esqueleto"), ("aranha", "Ninho", "Rainha Aranha"),
            ("orc", "Forte", "Rei Orc"), ("bruxa", "Cabana", "Rainha Bruxa"),
            ("ogro", "Gruta", "Rei Ogro"), ("cavaleiro", "Torre", "Rei Cavaleiro"),
            ("troll", "Fosso", "Rei Troll"), ("golem", "Pedreira", "Rei Golem"),
        };


        public ItemDef Item(string id) => items.Find(i => i.id == id);
        public SpellDef Spell(string id) => spells.Find(s => s.id == id);
        public MonsterDef Monster(string id) => monsters.Find(m => m.id == id);

        // Chamado pelo Unity quando o asset é criado.
        private void Reset() => FillDefaults();

        // Escreve as tabelas da Parte 1.
        [ContextMenu("Preencher com os valores do GDD")]
        public void FillDefaults()
        {
            items = new List<ItemDef>
            {
                It("espada_madeira", "Espada de madeira", Slot.Arma, 1, 6, 10, IconKind.Sword, Palette.Brown, 1),
                It("espada_curta", "Espada curta", Slot.Arma, 1, 8, 30, IconKind.Sword, Palette.Gray, 1),
                It("espada_ferro", "Espada de ferro", Slot.Arma, 2, 6, 70, IconKind.Sword, Palette.Ink, 1),
                It("machado", "Machado de guerra", Slot.Arma, 2, 8, 140, IconKind.Axe, Palette.Gray, 2),
                It("espada_prata", "Espada de prata", Slot.Arma, 3, 8, 260, IconKind.Sword, Palette.LBlue, 2),
                It("montante", "Montante", Slot.Arma, 3, 12, 480, IconKind.Sword, Palette.Blue, 3),
                It("espada_runica", "Espada rúnica", Slot.Arma, 4, 12, 800, IconKind.Sword, Palette.Purple, 3),
                It("lamina_dragao", "Lâmina do Dragão", Slot.Arma, 5, 20, 1200, IconKind.Sword, Palette.Red, 3),
                It("tampa_panela", "Tampa de panela", Slot.Escudo, 1, 4, 12, IconKind.Shield, Palette.Gray, 1),
                It("escudo_madeira", "Escudo de madeira", Slot.Escudo, 1, 6, 40, IconKind.Shield, Palette.Brown, 1),
                It("escudo_ferro", "Escudo de ferro", Slot.Escudo, 2, 6, 160, IconKind.Shield, Palette.Ink, 2),
                It("escudo_torre", "Escudo de torre", Slot.Escudo, 3, 6, 420, IconKind.Shield, Palette.Blue, 3),
                It("roupa_couro", "Roupa de couro", Slot.Armadura, 1, 4, 25, IconKind.Armor, Palette.Brown, 1),
                It("cota_malha", "Cota de malha", Slot.Armadura, 2, 4, 110, IconKind.Armor, Palette.Gray, 2),
                It("placas", "Armadura de placas", Slot.Armadura, 2, 8, 380, IconKind.Armor, Palette.Ink, 2),
                It("armadura_dragao", "Armadura de dragão", Slot.Armadura, 3, 10, 950, IconKind.Armor, Palette.Red, 3),
                Pot("pocao_vida", "Poção de vida", 3, 6, 12, Palette.Red, PotionEffect.Vida),
                Pot("pocao_mana", "Poção de magia", 2, 4, 15, Palette.Blue, PotionEffect.Magia),
            };
            spells = new List<SpellDef>
            {
                Sp("faisca", "Faísca", 1, 2, 4, SpellKind.Dano, Palette.Yellow, 30, 1),
                Sp("cura", "Cura", 2, 2, 6, SpellKind.Cura, Palette.Green, 45, 1),
                Sp("bola_fogo", "Bola de fogo", 3, 3, 8, SpellKind.Dano, Palette.Orange, 150, 2),
                Sp("raio", "Raio", 5, 4, 10, SpellKind.Dano, Palette.Purple, 420, 3),
            };
            monsters = new List<MonsterDef>
            {
                Mo("slime", "Slime", "slimes", false, 8, 1, 4, 0, 0, 2, 4, 3, "gota de gosma", "gotas de gosma"),
                Mo("rato", "Rato gigante", "ratos gigantes", false, 6, 1, 6, 0, 0, 2, 4, 3, "rabo de rato", "rabos de rato"),
                Mo("goblin", "Goblin", "goblins", false, 14, 2, 4, 0, 0, 3, 6, 7, "orelha de goblin", "orelhas de goblin"),
                Mo("lobo", "Lobo", "lobos", false, 16, 1, 10, 0, 0, 3, 6, 7, "presa de lobo", "presas de lobo"),
                Mo("esqueleto", "Esqueleto", "esqueletos", false, 24, 2, 6, 1, 4, 4, 6, 12, "osso", "ossos"),
                Mo("aranha", "Aranha gigante", "aranhas gigantes", true, 22, 2, 6, 1, 4, 4, 6, 12, "perna de aranha", "pernas de aranha"),
                Mo("orc", "Orc", "orcs", false, 38, 2, 8, 1, 6, 4, 10, 20, "dente de orc", "dentes de orc"),
                Mo("bruxa", "Bruxa do pântano", "bruxas do pântano", true, 32, 3, 6, 0, 0, 4, 10, 20, "verruga de bruxa", "verrugas de bruxa"),
                Mo("ogro", "Ogro", "ogros", false, 62, 3, 8, 2, 4, 6, 10, 35, "tufo de pelo de ogro", "tufos de pelo de ogro"),
                Mo("cavaleiro", "Cavaleiro negro", "cavaleiros negros", false, 56, 3, 10, 2, 6, 6, 10, 35, "pluma negra", "plumas negras"),
                Mo("troll", "Troll", "trolls", false, 92, 4, 8, 2, 6, 8, 10, 60, "unha de troll", "unhas de troll"),
                Mo("golem", "Golem de pedra", "golens de pedra", false, 110, 3, 12, 3, 6, 8, 10, 60, "lasca de pedra", "lascas de pedra"),
                Mo("dragao", "Dragão Vermelho", "dragões", false, 240, 5, 12, 2, 6, 10, 20, 0, "", ""),
            };
            // Um chefe para cada monstro com masmorra (Parte 1, Masmorras e chefes).
            foreach (var (kind, _, chefe) in Masmorras) monsters.Add(Boss(Monster(kind), chefe));
        }

        // Atalhos para as tabelas acima caberem numa linha por item.
        private static ItemDef It(string id, string nome, Slot slot, int n, int s, int preco, IconKind icon, Color cor, int loja) =>
            new ItemDef { id = id, nome = nome, slot = slot, dado = new DiceSpec(n, s), preco = preco, icon = icon, cor = cor, loja = loja };

        private static ItemDef Pot(string id, string nome, int n, int s, int preco, Color cor, PotionEffect efeito) =>
            new ItemDef { id = id, nome = nome, slot = Slot.Pocao, dado = new DiceSpec(n, s), preco = preco, icon = IconKind.Potion, cor = cor, loja = 1, efeito = efeito };

        private static SpellDef Sp(string id, string nome, int pm, int n, int s, SpellKind tipo, Color cor, int preco, int loja) =>
            new SpellDef { id = id, nome = nome, pm = pm, dado = new DiceSpec(n, s), tipo = tipo, cor = cor, preco = preco, loja = loja };

        private static MonsterDef Mo(string id, string nome, string pl, bool fem, int hp, int an, int asides, int dn, int dsides, int on, int osides, int xp, string parte, string partes) =>
            new MonsterDef
            {
                id = id, nome = nome, pl = pl, feminino = fem, hp = hp, atk = new DiceSpec(an, asides), def = new DiceSpec(dn, dsides),
                ouro = new DiceSpec(on, osides), xp = xp, parte = parte, partes = partes,
            };

        // Chefe de um monstro: o dobro da vida + 10, um dado de ataque a mais,
        // a mesma defesa, o dobro de dados de moeda e 4 × a experiência.
        private static MonsterDef Boss(MonsterDef m, string nome) => new MonsterDef
        {
            id = "chefe_" + m.id, nome = nome, pl = nome, feminino = nome.StartsWith("Rainha"), hp = m.hp * 2 + 10,
            atk = new DiceSpec(m.atk.count + 1, m.atk.sides), def = m.def, ouro = new DiceSpec(m.ouro.count * 2, m.ouro.sides),
            xp = m.xp * 4, parte = m.parte, partes = m.partes, chefe = true, baseId = m.id,
        };
    }
}
```

Crie o asset: em `Assets/_Project/Data/`, **Create → Caderno → Banco de dados**. Selecione o `GameDatabase.asset` e confira no Inspector as três listas preenchidas.

### 1.6 `PlayerState`: o herói

```csharp
// Caminho: Assets/_Project/Scripts/Core/PlayerState.cs
using System;
using System.Collections.Generic;
using Caderno.Data;
using UnityEngine;

namespace Caderno.Core
{
    // POR QUE: um contador com nome ("rato" → 7). O JsonUtility do Unity não
    // salva Dictionary, então contadores viram lista de pares.
    [Serializable]
    public class Count
    {
        public string id;
        public int n;
    }

    // POR QUE: uma missão aceita (Parte 1, Missões).
    // ESTRATÉGIA: guarda de quem é (npc = índice do personagem na ilha), qual
    // das 3 missões dele (etapa), o que pede e, para "matar", quantos já
    // tinham sido vencidos ao aceitar (inicio), porque só contam os novos.
    [Serializable]
    public class Quest
    {
        public int npc, etapa, n, inicio;
        public string tipo;     // "matar", "coletar" ou "chefe"
        public string kind;     // monstro (no chefe: o monstro comum dele)
        public bool avisado;    // o mestre já avisou que está pronta
    }

    // POR QUE: tudo o que é do herói (Parte 1, Personagem e progressão) num
    // objeto só, que vai inteiro para o save.
    // ESTRATÉGIA: só campos simples e listas (o JsonUtility do Unity não
    // salva Dictionary). Os itens são guardados pelo `id`, e os números deles
    // vêm do GameDatabase; assim, rebalancear uma espada vale também para
    // quem já tem save.
    [Serializable]
    public class PlayerState
    {
        public string nome = "Herói";
        public int lvl = 1, xp, hp = 20, hpMax = 20, pm = 3, pmMax = 3, ouro = 15;
        public string arma = "espada_madeira", escudo = "", armadura = "";
        public List<string> bolsa = new List<string>();
        public int pocaoVida = 2, pocaoMana;
        public List<string> magias = new List<string>();
        public int x, y, respawn;
        public int onde = -1;              // -1 = na ilha; n = dentro da masmorra n
        public int ox, oy;                 // onde voltar na ilha ao sair da masmorra
        public int tochas = 2, tocha;      // tochas na mochila; passos que faltam na acesa (0 = apagada)
        public List<Count> abates = new List<Count>();   // monstros vencidos por id ("rato", "chefe_rato")
        public List<Count> partes = new List<Count>();   // despojos por monstro ("rato" → rabos de rato)
        public List<Count> etapas = new List<Count>();   // missões entregues por personagem (id = índice dele)
        public List<Quest> missoes = new List<Quest>();

        // Herói novo na fogueira inicial (Parte 1: 20 de vida, 3 de Magia, 15
        // moedas, 1d6, 2 poções e 2 tochas).
        public static PlayerState New(string nome, int startIndex, int mapWidth) =>
            new PlayerState { nome = nome, x = startIndex % mapWidth, y = startIndex / mapWidth, respawn = startIndex };

        // Valor de um contador (0 se não existir).
        public static int Get(List<Count> list, string id)
        {
            var c = list.Find(k => k.id == id);
            return c != null ? c.n : 0;
        }

        // Soma (ou tira, com n negativo) num contador.
        public static void Add(List<Count> list, string id, int n)
        {
            var c = list.Find(k => k.id == id);
            if (c == null) list.Add(c = new Count { id = id });
            c.n += n;
        }

        // Id equipado num espaço ("" = vazio).
        public string Equipped(Slot slot) => slot switch
        {
            Slot.Arma => arma,
            Slot.Escudo => escudo,
            Slot.Armadura => armadura,
            _ => "",
        };

        // Troca o item de um espaço.
        public void SetEquipped(Slot slot, string id)
        {
            if (slot == Slot.Arma) arma = id;
            else if (slot == Slot.Escudo) escudo = id;
            else if (slot == Slot.Armadura) armadura = id;
        }

        public bool Owns(string id) => bolsa.Contains(id) || arma == id || escudo == id || armadura == id;

        // Quantas poções desse tipo.
        public int Potions(string id) => id == "pocao_vida" ? pocaoVida : pocaoMana;

        public void AddPotion(string id, int n)
        {
            if (id == "pocao_vida") pocaoVida += n; else pocaoMana += n;
        }

        // Dados de ataque: os da arma, ou 1d2 de soco sem arma.
        public DiceSpec AttackDie(GameDatabase db) =>
            string.IsNullOrEmpty(arma) ? new DiceSpec(1, 2) : db.Item(arma).dado;

        // Dados de defesa: escudo + armadura (pode ser vazio).
        public DiceSpec[] DefenseDice(GameDatabase db)
        {
            var list = new List<DiceSpec>();
            if (!string.IsNullOrEmpty(escudo)) list.Add(db.Item(escudo).dado);
            if (!string.IsNullOrEmpty(armadura)) list.Add(db.Item(armadura).dado);
            return list.ToArray();
        }

        // Experiência para passar do nível l: 10 × l^1,5.
        public static int XpNext(int l) => Mathf.RoundToInt(10f * Mathf.Pow(l, 1.5f));

        // Soma experiência e sobe quantos níveis der. Devolve quantos subiu.
        // Cada nível: +6 de vida máxima, +1 de Magia máxima, e enche as duas.
        public int GainXp(int amount)
        {
            xp += amount;
            int ups = 0;
            while (xp >= XpNext(lvl))
            {
                xp -= XpNext(lvl);
                lvl++; ups++;
                hpMax += 6; pmMax += 1; hp = hpMax; pm = pmMax;
            }
            return ups;
        }
    }
}
```

### 1.7 Menu de teste

```csharp
// Caminho: Assets/_Project/Scripts/Editor/CoreTestMenu.cs
using System.Linq;
using Caderno.Core;
using UnityEditor;
using UnityEngine;

namespace Caderno.EditorTools
{
    // POR QUE: conferir a Fase 1 sem ter tela ainda.
    // ESTRATÉGIA: um item de menu do Editor ([MenuItem]) que escreve no Console.
    public static class CoreTestMenu
    {
        // Rola 2d6 + 1d4 cinco vezes e mostra a sequência do Rng com semente 1.
        [MenuItem("Caderno/Testar dados")]
        private static void TestDice()
        {
            var rng = new System.Random();
            for (int i = 0; i < 5; i++)
                Debug.Log($"2d6 + 1d4 = {Dice.RollSum(rng, new DiceSpec(2, 6), new DiceSpec(1, 4))}");
            var r = new Rng(1);
            Debug.Log("Rng(1): " + string.Join(", ", Enumerable.Range(0, 3).Select(_ => r.Next().ToString("0.0000"))));
        }
    }
}
```

### ✅ Checkpoint da Fase 1
- **Caderno → Testar dados** escreve cinco somas entre 3 e 16 e três números do `Rng(1)`.
- Rodar o menu de novo repete os mesmos três números do `Rng(1)`: a sorte com semente é repetível.
- O `GameDatabase.asset` mostra 18 itens, 4 feitiços e 25 monstros: os 13 da tabela e os 12 chefes (`chefe_slime` a `chefe_golem`), com o dobro da vida + 10 e um dado de ataque a mais.

#### Problemas comuns
- **Listas vazias no asset:** ele foi criado antes do script compilar. Use **⋮ → Preencher com os valores do GDD**.
- **Erro `unchecked` / overflow:** confira se o `Rng` está com `unchecked` em volta da conta; sem ele, uma opção do compilador pode transformar a volta em 2^32 em erro.

Próxima fase: **O traço à mão**, a peça que dá a cara de caderno a tudo.

---

# Parte 5 — Implementação Unity: Fase 2 (O traço à mão)

## Fase 2 — O traço à mão

> Objetivo desta fase: gerar traços tremidos (linha, polígono, círculo que não fecha, hachura de lápis em zigue-zague) e desenhá-los na tela, inteiros ou só até uma fração, como a caneta do mestre faz. Traduz `sketch.js`.

### 2.1 `Stroke` e `StrokeList`

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/Stroke.cs
using System.Collections.Generic;
using UnityEngine;

namespace Caderno.Sketch
{
    // Caneta = linha cheia; lápis = duas passadas translúcidas (textura falhada).
    public enum StrokeKind { Pen, Pencil }

    // POR QUE: a unidade de todo desenho do jogo. Um traço é uma linha de
    // pontos com cor, espessura e tipo (caneta ou lápis).
    // ESTRATÉGIA: guarda o comprimento acumulado até cada ponto (_cum). Com
    // isso, "desenhe 40% deste traço" vira só achar onde a soma passa de 40%.
    public sealed class Stroke
    {
        public readonly List<Vector2> pts;
        public readonly Color color;
        public readonly float width;
        public readonly StrokeKind kind;
        public readonly float alpha;
        private float[] _cum;

        public Stroke(List<Vector2> pts, Color color, float width, StrokeKind kind, float alpha)
        {
            this.pts = pts; this.color = color; this.width = width; this.kind = kind; this.alpha = alpha;
        }

        // Comprimento total do traço.
        public float Length { get { Prep(); return _cum[_cum.Length - 1]; } }

        // Comprimento acumulado até o ponto i.
        public float Cum(int i) { Prep(); return _cum[i]; }

        // Calcula os comprimentos uma vez só, na primeira vez que alguém pede.
        private void Prep()
        {
            if (_cum != null) return;
            _cum = new float[Mathf.Max(1, pts.Count)];
            for (int i = 1; i < pts.Count; i++) _cum[i] = _cum[i - 1] + Vector2.Distance(pts[i - 1], pts[i]);
        }

        // Cópia escalada e deslocada (a mesma arte grande na luta e pequena no mapa).
        // A espessura cresce menos que o desenho (raiz da escala), como no protótipo.
        public Stroke Transformed(float scale, Vector2 offset) =>
            new Stroke(pts.ConvertAll(p => p * scale + offset), color, Mathf.Max(0.7f, width * Mathf.Sqrt(scale)), kind, alpha);
    }

    // POR QUE: um desenho é uma lista de traços desenhados em ordem
    // (contorno primeiro, pintura depois, como uma criança desenha).
    public sealed class StrokeList : List<Stroke>
    {
        private float _total = -1;
        private int _countAtTotal;

        // Comprimento somado de todos os traços (guardado até a lista mudar de tamanho).
        public float TotalLength
        {
            get
            {
                if (_total < 0 || _countAtTotal != Count)
                {
                    _total = 0;
                    foreach (var s in this) _total += s.Length;
                    _countAtTotal = Count;
                }
                return _total;
            }
        }

        // Cópia escalada e deslocada da lista inteira.
        public StrokeList Transformed(float scale, Vector2 offset)
        {
            var list = new StrokeList();
            foreach (var s in this) list.Add(s.Transformed(scale, offset));
            return list;
        }
    }
}
```

### 2.2 `Sketch`: os traços de mão

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/Sketch.cs
using System.Collections.Generic;
using Caderno.Core;
using UnityEngine;

namespace Caderno.Sketch
{
    // POR QUE: o que faz qualquer forma parecer desenhada à mão (Parte 1,
    // Estética). Linhas com uma "barriga" leve, círculos que passam do ponto
    // de partida e pintura de lápis em hachura.
    // ESTRATÉGIA: tudo recebe um Rng com semente, nunca Random. O mesmo
    // quadrado do mapa sai igual toda vez que é redesenhado.
    public static class Sketch
    {
        // Opções de um traço.
        public struct Opt
        {
            public Color color;
            public float w, alpha, j, step;
            public StrokeKind kind;
        }

        // Caneta: linha cheia. j = quanto treme; step = a cada quantas unidades há um ponto.
        public static Opt Pen(Color c, float w = 2.4f, float j = 1.4f, float step = 6f) =>
            new Opt { color = c, w = w, alpha = 1f, j = j, step = step, kind = StrokeKind.Pen };

        // Lápis de cor: translúcido, com duas passadas.
        public static Opt Pencil(Color c, float w = 1.5f, float alpha = 0.7f, float j = 0.7f) =>
            new Opt { color = c, w = w, alpha = alpha, j = j, step = 6f, kind = StrokeKind.Pencil };

        private static Stroke Make(List<Vector2> pts, Opt o) => new Stroke(pts, o.color, o.w, o.kind, o.alpha);

        // Liga os pontos com uma barriga suave e um tremor leve. As pontas de
        // cada segmento não se mexem: assim duas bordas que dividem um vértice
        // (a costa entre dois quadrados) continuam emendadas.
        public static List<Vector2> Wobble(Rng r, IList<Vector2> pts, float j, float step)
        {
            var output = new List<Vector2>();
            for (int i = 0; i < pts.Count - 1; i++)
            {
                Vector2 a = pts[i], b = pts[i + 1];
                float d = Vector2.Distance(a, b);
                if (d == 0) d = 1;
                int n = Mathf.Max(1, Mathf.CeilToInt(d / step));
                var normal = new Vector2(-(b.y - a.y) / d, (b.x - a.x) / d);
                float bow = (r.NextF() - 0.5f) * j * Mathf.Min(1.6f, d / 25f);
                for (int k = i == 0 ? 0 : 1; k <= n; k++)
                {
                    float t = (float)k / n;
                    float off = Mathf.Sin(t * Mathf.PI) * bow + (k > 0 && k < n ? (r.NextF() - 0.5f) * j * 0.5f : 0f);
                    output.Add(a + (b - a) * t + normal * off);
                }
            }
            return output;
        }

        // Linha de a até b.
        public static Stroke Line(Rng r, Vector2 a, Vector2 b, Opt o) => Make(Wobble(r, new[] { a, b }, o.j, o.step), o);

        // Linha passando por vários pontos; closed volta ao primeiro.
        public static Stroke Poly(Rng r, IList<Vector2> pts, bool closed, Opt o)
        {
            var list = new List<Vector2>(pts);
            if (closed) list.Add(pts[0]);
            return Make(Wobble(r, list, o.j, o.step), o);
        }

        // Círculo de mão: começa num ângulo qualquer e passa um pouco do ponto
        // de partida sem fechar perfeito (é o que denuncia a mão).
        public static Stroke Ellipse(Rng r, float cx, float cy, float rx, float ry, Opt o)
        {
            float a0 = r.NextF() * Mathf.PI * 2f, sweep = Mathf.PI * 2f + 0.2f + r.NextF() * 0.35f;
            int n = Mathf.Max(10, Mathf.CeilToInt((rx + ry) * Mathf.PI / 4f));
            float ph = r.NextF() * 6.28f;
            var pts = new List<Vector2>();
            for (int k = 0; k <= n; k++)
            {
                float a = a0 + sweep * k / n;
                float f = 1f + Mathf.Sin(a * 2f + ph) * 0.04f + (r.NextF() - 0.5f) * 0.025f + (float)k / n * 0.06f;
                pts.Add(new Vector2(cx + Mathf.Cos(a) * rx * f, cy + Mathf.Sin(a) * ry * f));
            }
            return Make(pts, o);
        }

        // Polígono de uma elipse (forma para pintar com Hatch).
        public static Vector2[] EllipsePoly(float cx, float cy, float rx, float ry, int n = 18)
        {
            var v = new Vector2[n];
            for (int k = 0; k < n; k++)
            {
                float a = (float)k / n * Mathf.PI * 2f;
                v[k] = new Vector2(cx + Mathf.Cos(a) * rx, cy + Mathf.Sin(a) * ry);
            }
            return v;
        }

        // Pintura de lápis de cor: hachuras paralelas recortadas pelo polígono.
        // ESTRATÉGIA: gira o polígono até as hachuras ficarem horizontais, corta
        // cada linha nas bordas e desgira. Linhas seguidas com um trecho só
        // viram um zigue-zague contínuo, como quem pinta sem tirar o lápis.
        public static List<Stroke> Hatch(Rng r, IList<Vector2> poly, Color color, float spacing = 4f, float angle = 0.8f,
            float alpha = 0.7f, float w = 1.5f, bool zigzag = true)
        {
            float ca = Mathf.Cos(angle), sn = Mathf.Sin(angle);
            var P = new Vector2[poly.Count];
            float y0 = float.MaxValue, y1 = float.MinValue;
            for (int i = 0; i < poly.Count; i++)
            {
                P[i] = new Vector2(poly[i].x * ca + poly[i].y * sn, -poly[i].x * sn + poly[i].y * ca);
                y0 = Mathf.Min(y0, P[i].y); y1 = Mathf.Max(y1, P[i].y);
            }
            Vector2 Back(float x, float y) => new Vector2(x * ca - y * sn, x * sn + y * ca);

            var opt = Pencil(color, w, alpha);
            const float ins = 0.8f;
            var output = new List<Stroke>();
            List<Vector2> zig = null;
            int dir = 1;
            void Flush()
            {
                if (zig != null && zig.Count >= 2) output.Add(Make(Wobble(r, zig, opt.j, 8f), opt));
                zig = null;
            }

            var xs = new List<float>();
            var segs = new List<Vector2>();
            for (float y = y0 + spacing * (0.3f + r.NextF() * 0.5f); y < y1; y += spacing)
            {
                xs.Clear(); segs.Clear();
                for (int i = 0; i < P.Length; i++)
                {
                    Vector2 a = P[i], b = P[(i + 1) % P.Length];
                    if ((a.y <= y) != (b.y <= y)) xs.Add(a.x + (y - a.y) / (b.y - a.y) * (b.x - a.x));
                }
                xs.Sort();
                for (int i = 0; i + 1 < xs.Count; i += 2)
                {
                    float sa = xs[i] + ins * (r.NextF() * 1.6f - 0.3f), sb = xs[i + 1] - ins * (r.NextF() * 1.6f - 0.3f);
                    if (sb - sa > 0.6f) segs.Add(new Vector2(sa, sb));
                }
                if (segs.Count == 1 && zigzag)
                {
                    Vector2 p1 = Back(segs[0].x, y), p2 = Back(segs[0].y, y);
                    if (zig == null) { zig = new List<Vector2>(); dir = 1; }
                    if (dir > 0) { zig.Add(p1); zig.Add(p2); } else { zig.Add(p2); zig.Add(p1); }
                    dir = -dir;
                }
                else
                {
                    Flush();
                    foreach (var s in segs) output.Add(Make(Wobble(r, new[] { Back(s.x, y), Back(s.y, y) }, opt.j, 8f), opt));
                }
            }
            Flush();
            return output;
        }
    }
}
```

### 2.3 `StrokePainter`: desenhar com `Painter2D`

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/StrokePainter.cs
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.Sketch
{
    // POR QUE: transforma traços em linhas na tela, inteiros ou até uma
    // fração (a animação do mestre desenhando).
    // ESTRATÉGIA: Painter2D é a "caneta" do UI Toolkit: BeginPath, MoveTo,
    // LineTo e Stroke, com cor e espessura. O lápis é a mesma linha passada
    // duas vezes, translúcida e levemente deslocada.
    public static class StrokePainter
    {
        // Desenha `list` até a fração `progress` (0..1) do comprimento somado,
        // com escala e deslocamento. Devolve true e a ponta da caneta quando
        // o desenho ainda não terminou.
        public static bool Draw(Painter2D p, StrokeList list, float progress, Vector2 offset, float scale,
            out Vector2 head, out Color headColor)
        {
            head = default; headColor = default;
            float left = progress >= 1f ? float.MaxValue : list.TotalLength * progress;
            bool hasHead = false;
            foreach (var s in list)
            {
                if (left <= 0f) break;
                float len = s.Length;
                float frac = left >= len ? 1f : left / Mathf.Max(0.0001f, len);
                Vector2 h = DrawOne(p, s, frac, offset, scale);
                if (frac < 1f) { head = h; headColor = s.color; hasHead = true; }
                left -= len;
            }
            return hasHead;
        }

        // Um traço até a fração `frac`. Devolve onde a linha parou.
        private static Vector2 DrawOne(Painter2D p, Stroke s, float frac, Vector2 off, float sc)
        {
            var pts = s.pts;
            Vector2 head = pts[0] * sc + off;
            if (pts.Count < 2) return head;
            float end = s.Length * frac;
            bool pencil = s.kind == StrokeKind.Pencil;
            p.lineCap = LineCap.Round;
            p.lineJoin = LineJoin.Round;
            for (int pass = 0; pass < (pencil ? 2 : 1); pass++)
            {
                Vector2 o = pass == 1 ? new Vector2(0.7f, -0.6f) * sc : Vector2.zero;
                var c = s.color;
                c.a = s.alpha * (pencil ? (pass == 1 ? 0.35f : 0.62f) : 1f);
                p.strokeColor = c;
                p.lineWidth = s.width * sc * (pass == 1 ? 0.6f : 1f);
                p.BeginPath();
                p.MoveTo(pts[0] * sc + off + o);
                for (int i = 1; i < pts.Count; i++)
                {
                    float ci = s.Cum(i);
                    if (ci >= end)
                    {
                        float prev = s.Cum(i - 1);
                        float t = (end - prev) / Mathf.Max(0.0001f, ci - prev);
                        head = Vector2.Lerp(pts[i - 1], pts[i], t) * sc + off;
                        p.LineTo(head + o);
                        break;
                    }
                    head = pts[i] * sc + off;
                    p.LineTo(head + o);
                }
                p.Stroke();
            }
            return head;
        }
    }
}
```

### 2.4 `SketchElement`: um desenho na interface

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/SketchElement.cs
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.Sketch
{
    // POR QUE: o pedaço de interface que mostra uma lista de traços: um
    // monstro na luta, um ícone na loja, um quadrado do mapa.
    // ESTRATÉGIA: VisualElement é o "bloco" do UI Toolkit (como uma div no
    // HTML). generateVisualContent é chamado quando o bloco precisa ser
    // desenhado; o resultado fica guardado até MarkDirtyRepaint(). Dois modos:
    // - BoxSize: os traços foram feitos numa caixa (ex.: 100×100) e são
    //   esticados para caber no tamanho do elemento (ícones, monstros).
    // - FixedScale > 0: escala fixa e Origin (canto do desenho), para o mapa,
    //   onde 1 unidade do traço = 1 unidade do mundo.
    public class SketchElement : VisualElement
    {
        public StrokeList Strokes;
        public float Progress = 1f;
        public float BoxSize = 100f;
        public float FixedScale;
        public Vector2 Origin;

        // Ponta da caneta na última pintura (só vale enquanto Progress < 1).
        public bool HasHead { get; private set; }
        public Vector2 Head;
        public Color HeadColor;

        public SketchElement(StrokeList strokes = null, float boxSize = 100f)
        {
            Strokes = strokes;
            BoxSize = boxSize;
            pickingMode = PickingMode.Ignore;   // não "rouba" cliques de quem está embaixo
            generateVisualContent += Paint;
        }

        // Troca o desenho e pede para repintar.
        public void SetStrokes(StrokeList strokes)
        {
            Strokes = strokes;
            MarkDirtyRepaint();
        }

        public void SetProgress(float p)
        {
            Progress = Mathf.Clamp01(p);
            MarkDirtyRepaint();
        }

        // Desenha do zero em `seconds` segundos (o mestre desenhando o monstro).
        public void PlayDraw(float seconds)
        {
            float t0 = Time.realtimeSinceStartup;
            SetProgress(0f);
            schedule.Execute(() => SetProgress((Time.realtimeSinceStartup - t0) / seconds))
                .Every(16).Until(() => Progress >= 1f);
        }

        private void Paint(MeshGenerationContext ctx)
        {
            HasHead = false;
            if (Strokes == null || Strokes.Count == 0) return;
            float sc;
            Vector2 off;
            if (FixedScale > 0f)
            {
                sc = FixedScale;
                off = -Origin * sc;
            }
            else
            {
                var r = contentRect;
                sc = Mathf.Min(r.width, r.height) / BoxSize;
                if (sc <= 0f) return;
                off = new Vector2((r.width - BoxSize * sc) / 2f, (r.height - BoxSize * sc) / 2f);
            }
            HasHead = StrokePainter.Draw(ctx.painter2D, Strokes, Progress, off, sc, out var h, out HeadColor);
            Head = (h - off) / sc;   // ponta em coordenadas do desenho
        }
    }
}
```

### 2.5 Teste rápido

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/SketchTest.cs
using Caderno.Core;
using Caderno.Data;
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.Sketch
{
    // POR QUE: ver o traço funcionando antes de existir o jogo. Remova o
    // componente depois da Fase 3.
    // ESTRATÉGIA: um círculo de caneta pintado de lápis, desenhado em 1,5 s.
    public class SketchTest : MonoBehaviour
    {
        [SerializeField] private UIDocument _doc;

        private void Start()
        {
            var r = new Rng(7);
            var list = new StrokeList();
            list.Add(Sketch.Ellipse(r, 50, 50, 40, 32, Sketch.Pen(Palette.Green, 3f)));
            list.AddRange(Sketch.Hatch(r, Sketch.EllipsePoly(50, 50, 36, 29), Palette.LGreen, 3.6f));
            var el = new SketchElement(list);
            el.style.width = 300; el.style.height = 300;
            _doc.rootVisualElement.Add(el);
            el.PlayDraw(1.5f);
        }
    }
}
```

Adicione `SketchTest` ao GameObject `Caderno` e ligue o campo **Doc** ao UI Document.

### ✅ Checkpoint da Fase 2
- No Play, um círculo verde aparece sendo traçado e depois pintado em zigue-zague de lápis, em 1,5 s.
- O círculo passa um pouco do ponto de partida, e a pintura é translúcida e falhada.
- Rodar de novo desenha exatamente o mesmo círculo (semente 7).

#### Problemas comuns
- **Nada aparece:** o elemento ficou com tamanho zero. Confira `style.width` e `style.height`.
- **Linhas serrilhadas:** em **Project Settings → Quality**, ligue o Anti Aliasing; o `Painter2D` também suaviza as bordas sozinho quando a linha tem mais de 1 unidade.

Próxima fase: **Os desenhos**, com os 13 monstros, o herói, os ícones e os dados.

---

# Parte 6 — Implementação Unity: Fase 3 (Os desenhos)

## Fase 3 — Os desenhos

> Objetivo desta fase: todos os desenhos de `art.js` como listas de traços numa caixa 100×100: 13 monstros e os 12 chefes com coroa, herói, personagem do caminho (de dica e de missão), ícones (com sol, lua, tocha e fogueira) e as silhuetas dos dados.

### 3.1 `ArtKit`: atalhos de desenho

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/ArtKit.cs
using Caderno.Core;
using UnityEngine;

namespace Caderno.Sketch
{
    // POR QUE: os desenhos têm dezenas de formas cada. Com estes atalhos,
    // cada linha de C# fica igual à linha correspondente de art.js.
    // ESTRATÉGIA: o kit guarda o Rng e a lista de saída; cada método empilha
    // traços. Ordem: contorno de caneta primeiro, pintura de lápis depois.
    public sealed class ArtKit
    {
        public readonly StrokeList Out = new StrokeList();
        public readonly Rng R;

        public ArtKit(uint seed) { R = new Rng(seed); }

        // Lista de pontos a partir de x,y,x,y...  (V(16,90, 15,74) = [[16,90],[15,74]] em JS)
        public static Vector2[] V(params float[] xy)
        {
            var v = new Vector2[xy.Length / 2];
            for (int i = 0; i < v.Length; i++) v[i] = new Vector2(xy[2 * i], xy[2 * i + 1]);
            return v;
        }

        // Polilinha de caneta.
        public void Pl(Vector2[] pts, bool closed, Color c, float w = 2.4f) => Out.Add(Sketch.Poly(R, pts, closed, Sketch.Pen(c, w)));

        // Linha de caneta.
        public void Ln(float x1, float y1, float x2, float y2, Color c, float w = 2.4f) =>
            Out.Add(Sketch.Line(R, new Vector2(x1, y1), new Vector2(x2, y2), Sketch.Pen(c, w)));

        // Elipse de caneta.
        public void Ov(float cx, float cy, float rx, float ry, Color c, float w = 2.4f) =>
            Out.Add(Sketch.Ellipse(R, cx, cy, rx, ry, Sketch.Pen(c, w)));

        // Pinta um polígono com lápis.
        public void Fill(Vector2[] poly, Color c, float sp = 3.6f, float ang = 0.8f, float alpha = 0.75f) =>
            Out.AddRange(Sketch.Hatch(R, poly, c, sp, ang, alpha, 1.7f));

        // Pinta uma elipse com lápis (um pouco menor que o contorno).
        public void FillE(float cx, float cy, float rx, float ry, Color c, float sp = 3.6f, float ang = 0.8f, float alpha = 0.75f) =>
            Fill(Sketch.EllipsePoly(cx, cy, rx * 0.9f, ry * 0.9f), c, sp, ang, alpha);

        // Forma fechada contornada e pintada.
        public void Shape(Vector2[] pts, Color line, Color fill, float w = 2.6f, float sp = 3.6f, float ang = 0.8f)
        {
            Pl(pts, true, line, w);
            Fill(pts, fill, sp, ang);
        }

        // Elipse contornada e pintada.
        public void Blob(float cx, float cy, float rx, float ry, Color line, Color fill, float w = 2.6f, float sp = 3.6f, float ang = 0.8f)
        {
            Ov(cx, cy, rx, ry, line, w);
            FillE(cx, cy, rx, ry, fill, sp, ang);
        }

        // Bolinha cheia (olhos, botões).
        public void Dot(float x, float y, float rad, Color c)
        {
            Ov(x, y, rad, rad, c, 2f);
            FillE(x, y, rad, rad, c, 1.4f, 0.3f, 0.95f);
        }

        public void Eyes(float x1, float x2, float y, float rad, Color c)
        {
            Dot(x1, y, rad, c);
            Dot(x2, y, rad, c);
        }
    }
}
```

### 3.2 `MonsterArt`: os 13 monstros e os chefes

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/MonsterArt.cs
using System;
using System.Collections.Generic;
using Caderno.Core;
using UnityEngine;
using static Caderno.Data.Palette;
using static Caderno.Sketch.ArtKit;

namespace Caderno.Sketch
{
    // POR QUE: o desenho de cada monstro da Parte 1, igual ao de art.js, e a
    // versão chefe dele (Rei Rato, Rainha Aranha...).
    // ESTRATÉGIA: cada monstro é uma função que recebe um ArtKit e desenha
    // numa caixa 100×100 (chão perto de y = 92). Get guarda o resultado: o
    // mesmo monstro aparece no mapa (pequeno) e na luta (grande) sem ser
    // gerado de novo. O chefe ("chefe_rato") é o mesmo desenho, um pouco
    // menor, com uma coroa na cabeça. `using static` deixa escrever Ink em
    // vez de Palette.Ink.
    public static class MonsterArt
    {
        private static readonly Dictionary<string, StrokeList> Cache = new Dictionary<string, StrokeList>();

        private static readonly Dictionary<string, Action<ArtKit>> Draw = new Dictionary<string, Action<ArtKit>>
        {
            ["slime"] = k =>
            {
                var body = V(16, 90, 15, 74, 22, 56, 36, 42, 50, 38, 64, 42, 78, 56, 85, 74, 84, 90);
                k.Shape(body, Green, LGreen, 3f);
                k.Eyes(40, 60, 62, 4, Ink);
                k.Pl(V(42, 74, 50, 79, 58, 74), false, Ink, 2.2f);
                k.Pl(V(28, 64, 31, 55, 38, 49), false, Paper, 3f);
            },
            ["rato"] = k =>
            {
                k.Pl(V(20, 70, 8, 66, 4, 54, 10, 44), false, Pink, 2.6f);
                k.Blob(46, 68, 30, 17, Ink, Gray);
                k.Blob(78, 60, 13, 11, Ink, Gray);
                k.Blob(74, 46, 6, 7, Ink, Pink);
                k.Dot(82, 57, 2.4f, Ink);
                k.Dot(92, 62, 2.6f, Pink);
                k.Ln(88, 64, 99, 60, Ink, 1.2f); k.Ln(88, 66, 99, 68, Ink, 1.2f);
                foreach (float x in new[] { 30f, 44f, 56f, 66f }) k.Ln(x, 82, x - 2, 92, Ink, 2.4f);
            },
            ["goblin"] = k =>
            {
                k.Shape(V(34, 52, 66, 52, 72, 88, 28, 88), Ink, Brown);
                k.Shape(V(30, 30, 8, 22, 32, 40), Ink, Green, 2.2f);
                k.Shape(V(70, 30, 92, 22, 68, 40), Ink, Green, 2.2f);
                k.Blob(50, 34, 20, 18, Ink, Green);
                k.Eyes(42, 58, 30, 3.2f, Red);
                k.Pl(V(40, 42, 44, 45, 48, 42, 52, 45, 56, 42, 60, 45), false, Ink, 1.8f);
                k.Ln(34, 58, 18, 74, Ink, 3); k.Ln(66, 58, 82, 70, Ink, 3);
                k.Ln(82, 72, 94, 48, Gray, 3.2f); k.Ln(78, 66, 88, 72, Brown, 3);
                k.Ln(42, 88, 40, 97, Ink, 3); k.Ln(58, 88, 60, 97, Ink, 3);
            },
            ["lobo"] = k =>
            {
                k.Pl(V(20, 58, 8, 50, 4, 38, 14, 46, 22, 52), true, Ink, 2.4f);
                k.Blob(46, 62, 28, 15, Ink, Gray);
                k.Shape(V(66, 40, 90, 54, 96, 58, 88, 64, 70, 64, 64, 52), Ink, Gray);
                k.Shape(V(68, 42, 70, 26, 78, 40), Ink, Gray, 2.2f);
                k.Dot(78, 50, 2.4f, Red);
                k.Dot(95, 58, 2, Ink);
                foreach (float x in new[] { 28f, 38f, 56f, 64f }) k.Ln(x, 72, x + (x > 50 ? 2 : -2), 94, Ink, 3);
            },
            ["esqueleto"] = k =>
            {
                k.Ov(50, 22, 14, 14, Ink, 2.6f);
                k.Eyes(44, 56, 21, 3.6f, Ink);
                k.Pl(V(43, 32, 57, 32, 55, 38, 45, 38), true, Ink, 1.8f);
                k.Ln(50, 38, 50, 70, Ink, 3);
                foreach (float y in new[] { 46f, 53f, 60f }) k.Pl(V(36, y + 4, 44, y, 56, y, 64, y + 4), false, Ink, 2);
                k.Pl(V(40, 72, 50, 68, 60, 72, 50, 78), true, Ink, 2.2f);
                k.Ln(50, 44, 30, 62, Ink, 2.6f); k.Ln(50, 44, 72, 58, Ink, 2.6f);
                k.Ln(44, 76, 38, 96, Ink, 2.8f); k.Ln(56, 76, 62, 96, Ink, 2.8f);
                k.Ln(72, 60, 92, 30, Gray, 3.2f); k.Ln(66, 54, 78, 62, Brown, 3);
            },
            ["aranha"] = k =>
            {
                foreach (int s in new[] { -1, 1 })
                    for (int i = 0; i < 4; i++)
                    {
                        float by = 50 + i * 6, kx = 50 + s * (24 + i * 4), ky = 30 + i * 8;
                        k.Pl(V(50 + s * 10, by, kx, ky, 50 + s * (36 + i * 3), 86 + (i % 2) * 6), false, Ink, 2.4f);
                    }
                k.Blob(50, 66, 20, 18, Ink, Purple, 2.8f, 3);
                k.Blob(50, 44, 12, 10, Ink, Purple, 2.6f, 3);
                foreach (var e in V(45, 42, 55, 42, 48, 47, 52, 47)) k.Dot(e.x, e.y, 1.8f, Red);
            },
            ["orc"] = k =>
            {
                k.Shape(V(28, 50, 72, 50, 80, 92, 20, 92), Ink, Olive);
                k.Ln(24, 72, 76, 72, Brown, 4);
                k.Blob(50, 30, 20, 18, Ink, Olive);
                k.Pl(V(36, 22, 46, 26), false, Ink, 3); k.Pl(V(64, 22, 54, 26), false, Ink, 3);
                k.Eyes(43, 57, 29, 2.8f, Red);
                k.Pl(V(40, 42, 42, 34, 44, 42), false, Ink, 2); k.Pl(V(56, 42, 58, 34, 60, 42), false, Ink, 2);
                k.Ln(26, 56, 12, 78, Ink, 3.4f); k.Ln(74, 56, 86, 74, Ink, 3.4f);
                k.Ln(86, 90, 86, 20, Brown, 4);
                k.Shape(V(86, 24, 98, 18, 99, 44, 86, 40), Ink, Gray, 2.4f);
            },
            ["bruxa"] = k =>
            {
                k.Shape(V(50, 40, 24, 94, 76, 94), Ink, Purple);
                k.Blob(50, 36, 13, 12, Ink, LGreen);
                k.Pl(V(52, 36, 62, 42, 53, 42), false, Ink, 2);
                k.Dot(46, 33, 2, Ink);
                k.Ln(26, 26, 76, 26, Ink, 3);
                k.Shape(V(36, 26, 52, 4, 60, 8, 64, 26), Ink, Purple);
                k.Ln(30, 60, 14, 50, Ink, 2.6f);
                k.Ln(70, 60, 86, 44, Ink, 2.6f);
                k.Ln(86, 44, 92, 30, Brown, 3);
                k.Shape(V(92, 18, 95, 25, 100, 26, 96, 30, 97, 36, 92, 32, 87, 36, 88, 30, 84, 26, 89, 25), Orange, Yellow, 1.8f, 2.4f);
            },
            ["ogro"] = k =>
            {
                k.Blob(50, 64, 32, 28, Ink, Orange);
                k.Blob(50, 30, 14, 12, Ink, Orange);
                k.Eyes(45, 55, 28, 2.4f, Ink);
                k.Pl(V(44, 36, 56, 36), false, Ink, 2);
                k.Ln(22, 58, 10, 80, Ink, 4);
                k.Ln(78, 58, 88, 40, Ink, 4);
                k.Pl(V(84, 44, 80, 12, 94, 8, 96, 40), true, Brown, 3);
                k.Fill(V(84, 44, 80, 12, 94, 8, 96, 40), Brown);
                k.Ln(38, 90, 34, 99, Ink, 4); k.Ln(62, 90, 66, 99, Ink, 4);
            },
            ["cavaleiro"] = k =>
            {
                k.Shape(V(32, 40, 68, 40, 72, 84, 28, 84), Ink, Ink, 2.6f, 3);
                k.Shape(V(36, 8, 64, 8, 66, 38, 34, 38), Ink, Gray, 2.6f, 3);
                k.Ln(40, 22, 60, 22, Red, 3.4f);
                k.Shape(V(10, 46, 34, 46, 32, 70, 22, 80, 12, 70), Ink, Red, 2.4f);
                k.Ln(22, 50, 22, 74, Paper, 2.4f); k.Ln(14, 58, 30, 58, Paper, 2.4f);
                k.Ln(70, 50, 84, 62, Ink, 3.4f);
                k.Ln(84, 62, 96, 10, Gray, 3.4f); k.Ln(78, 54, 90, 64, Brown, 3);
                k.Ln(40, 84, 38, 98, Ink, 4); k.Ln(60, 84, 62, 98, Ink, 4);
            },
            ["troll"] = k =>
            {
                k.Shape(V(26, 40, 74, 40, 80, 86, 20, 86), Ink, LBlue, 2.8f);
                k.Blob(50, 30, 16, 13, Ink, LBlue);
                k.Eyes(44, 56, 28, 2.6f, Yellow);
                k.Pl(V(42, 38, 46, 34, 50, 38, 54, 34, 58, 38), false, Ink, 2);
                k.Pl(V(24, 46, 8, 72, 12, 94), false, Ink, 4.4f);
                k.Pl(V(76, 46, 92, 72, 88, 94), false, Ink, 4.4f);
                k.Ln(36, 86, 32, 98, Ink, 4.4f); k.Ln(64, 86, 68, 98, Ink, 4.4f);
            },
            ["golem"] = k =>
            {
                k.Shape(V(24, 36, 76, 36, 78, 76, 22, 76), Ink, Gray, 2.8f, 3.4f);
                k.Shape(V(36, 10, 64, 10, 64, 34, 36, 34), Ink, Gray, 2.8f, 3.4f);
                k.Eyes(44, 56, 22, 3, Orange);
                k.Shape(V(6, 38, 22, 38, 22, 72, 6, 72), Ink, Gray, 2.6f, 3.4f);
                k.Shape(V(78, 38, 94, 38, 94, 72, 78, 72), Ink, Gray, 2.6f, 3.4f);
                k.Shape(V(28, 76, 44, 76, 44, 98, 28, 98), Ink, Gray, 2.6f, 3.4f);
                k.Shape(V(56, 76, 72, 76, 72, 98, 56, 98), Ink, Gray, 2.6f, 3.4f);
                k.Pl(V(40, 42, 48, 54, 44, 62, 52, 70), false, Ink, 1.8f);
            },
            ["dragao"] = k =>
            {
                k.Shape(V(44, 50, 20, 10, 30, 30, 8, 22, 24, 48), Ink, Purple, 2.4f, 3);
                k.Pl(V(30, 74, 12, 80, 4, 70, 10, 62), false, Red, 3.4f);
                k.Blob(42, 66, 26, 18, Ink, Red, 2.8f, 3);
                k.Shape(V(54, 56, 62, 34, 70, 24, 76, 32, 68, 44, 62, 62), Ink, Red, 2.6f, 3);
                k.Shape(V(66, 18, 86, 22, 92, 30, 82, 34, 70, 32), Ink, Red, 2.6f, 3);
                k.Pl(V(70, 20, 66, 8), false, Ink, 2.6f); k.Pl(V(76, 20, 76, 8), false, Ink, 2.6f);
                k.Dot(78, 25, 2.2f, Yellow);
                k.Shape(V(92, 30, 100, 38, 96, 42, 100, 50, 92, 46, 88, 38), Orange, Yellow, 2, 2.4f);
                foreach (float x in new[] { 28f, 40f, 52f }) k.Ln(x, 80, x, 96, Ink, 3.4f);
                foreach (var e in V(34, 62, 44, 58, 52, 66)) k.Pl(V(e.x, e.y, e.x + 3, e.y + 4, e.x + 6, e.y), false, Ink, 1.6f);
            },
        };

        // Alto da cabeça de cada monstro (caixa 100×100): onde vai a coroa do chefe.
        private static readonly Dictionary<string, Vector2> Head = new Dictionary<string, Vector2>
        {
            ["slime"] = new Vector2(50, 38), ["rato"] = new Vector2(78, 48), ["goblin"] = new Vector2(50, 16),
            ["lobo"] = new Vector2(76, 40), ["esqueleto"] = new Vector2(50, 8), ["aranha"] = new Vector2(50, 34),
            ["orc"] = new Vector2(50, 12), ["bruxa"] = new Vector2(52, 6), ["ogro"] = new Vector2(50, 18),
            ["cavaleiro"] = new Vector2(50, 8), ["troll"] = new Vector2(50, 17), ["golem"] = new Vector2(50, 10),
        };

        // Desenho do monstro (gerado uma vez e guardado).
        public static StrokeList Get(string id)
        {
            if (Cache.TryGetValue(id, out var list)) return list;
            if (id.StartsWith("chefe_")) return Cache[id] = Boss(id.Substring(6));
            var k = new ArtKit(Rng.Hash(id.Length, id[0], id[1]));
            Draw[id](k);
            Cache[id] = k.Out;
            return k.Out;
        }

        // Chefe: o monstro em 84% do tamanho, descido para caber a coroa.
        private static StrokeList Boss(string kind)
        {
            const float sc = 0.84f;
            var off = new Vector2(8, 14);
            var k = new ArtKit(Rng.Hash(kind.Length, kind[0], kind[1], 7));
            Draw[kind](k);
            var list = k.Out.Transformed(sc, off);
            var head = Head[kind] * sc + off;
            var c = new ArtKit(Rng.Hash(kind.Length, kind[0], 9));
            Crown(c, head.x, head.y + 1, 1.1f);
            list.AddRange(c.Out);
            return list;
        }

        // Coroa amarela de três pontas com uma pedra vermelha; (cx, by) é o
        // meio da base e s, o tamanho (1 = 24 de largura).
        public static void Crown(ArtKit k, float cx, float by, float s)
        {
            var p = V(-12, 0, -13, -10, -6, -4, 0, -14, 6, -4, 13, -10, 12, 0);
            for (int i = 0; i < p.Length; i++) p[i] = new Vector2(cx + p[i].x * s, by + p[i].y * s);
            k.Shape(p, Ochre, Yellow, 2.4f, 2.6f);
            k.Dot(cx, by - 4 * s, 2 * s, Red);
        }
    }
}
```

### 3.3 `PeopleArt`: herói e personagem do caminho

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/PeopleArt.cs
using Caderno.Core;
using UnityEngine;
using static Caderno.Data.Palette;
using static Caderno.Sketch.ArtKit;

namespace Caderno.Sketch
{
    // POR QUE: o boneco-palito de capa vermelha (Parte 1, Estética) e os
    // personagens do caminho.
    // ESTRATÉGIA: o herói tem duas poses (pernas abertas e fechadas) que se
    // alternam ao andar. O traço dele é grosso porque no mapa ele aparece
    // com metade do tamanho.
    public static class PeopleArt
    {
        private static readonly StrokeList[] HeroCache = new StrokeList[2];

        // Herói na pose 0 (parado) ou 1 (passo).
        public static StrokeList Hero(int frame)
        {
            if (HeroCache[frame] != null) return HeroCache[frame];
            var k = new ArtKit((uint)(1234 + frame));
            k.Shape(V(47, 32, 32, 70, 64, 70, 54, 32), Red, Red, 3.4f, 3.2f);
            k.Ov(50, 21, 10, 10, Ink, 4);
            k.FillE(50, 21, 10, 10, Skin, 3, 0.8f, 0.6f);
            k.Pl(V(40, 17, 46, 9, 54, 9, 61, 16), false, Brown, 4);
            k.Ln(50, 31, 50, 60, Ink, 4.4f);
            k.Ln(50, 40, 36, 54, Ink, 4);
            k.Ln(50, 40, 66, 48, Ink, 4);
            k.Ln(66, 48, 82, 22, Gray, 4.4f); k.Ln(60, 42, 72, 52, Brown, 4);
            if (frame == 1) { k.Ln(50, 60, 42, 86, Ink, 4.4f); k.Ln(50, 60, 58, 86, Ink, 4.4f); }
            else { k.Ln(50, 60, 36, 84, Ink, 4.4f); k.Ln(50, 60, 64, 84, Ink, 4.4f); }
            return HeroCache[frame] = k.Out;
        }

        // Personagem do caminho: boneco-palito de chapéu colorido. Quem dá dica
        // tem "?" azul no balão; quem dá missão (quest), "!" vermelho num
        // balão pintado de amarelo, para chamar atenção.
        public static StrokeList Npc(uint seed, Color hat, bool quest = false)
        {
            var k = new ArtKit(seed);
            k.Ov(50, 34, 9, 9, Ink, 3);
            k.Shape(V(38, 28, 50, 12, 62, 28), Ink, hat, 2.6f);
            k.Ln(50, 43, 50, 70, Ink, 3.4f);
            k.Ln(50, 50, 36, 62, Ink, 3); k.Ln(50, 50, 64, 62, Ink, 3);
            k.Ln(50, 70, 40, 92, Ink, 3.4f); k.Ln(50, 70, 60, 92, Ink, 3.4f);
            var balloon = V(66, 6, 92, 6, 92, 26, 78, 26, 72, 34, 72, 26, 66, 26);
            if (quest)
            {
                k.Shape(balloon, Ink, Yellow, 2.2f, 3);
                k.Ln(79, 9, 79, 18, Red, 2.6f);   // o "!"
                k.Dot(79, 22.5f, 1.3f, Red);
            }
            else
            {
                k.Pl(balloon, true, Ink, 2.2f);
                k.Pl(V(75, 12, 79, 9, 84, 12, 82, 16, 79, 18, 79, 20), false, Blue, 2.2f);   // o "?"
                k.Dot(79, 23, 1.2f, Blue);
            }
            return k.Out;
        }

    }
}
```

### 3.4 `IconArt`: ícones e dados

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/IconArt.cs
using System.Collections.Generic;
using Caderno.Core;
using Caderno.Data;
using UnityEngine;
using static Caderno.Data.Palette;
using static Caderno.Sketch.ArtKit;

namespace Caderno.Sketch
{
    // POR QUE: os ícones desenhados com lápis de cor (vida, magia, moeda,
    // espada, escudo...) e as silhuetas dos dados (Parte 1, Combate: d4
    // triângulo, d6 quadrado, d8 losango, d10 pipa, d12 pentágono, d20
    // hexágono com triângulo dentro).
    // ESTRATÉGIA: tudo numa caixa 100×100, guardado em cache por tipo + cor.
    // Cada item usa o ícone do seu tipo pintado na cor do material.
    public static class IconArt
    {
        private static readonly Dictionary<string, StrokeList> Cache = new Dictionary<string, StrokeList>();

        // Ícone de um tipo, pintado com `color` (null = cor padrão do ícone).
        public static StrokeList Get(IconKind kind, Color? color = null)
        {
            string key = kind + "|" + (color.HasValue ? ColorUtility.ToHtmlStringRGB(color.Value) : "");
            if (Cache.TryGetValue(key, out var list)) return list;
            var k = new ArtKit(Rng.Hash((int)kind, 31, key.Length));
            Build(k, kind, color);
            return Cache[key] = k.Out;
        }

        private static void Build(ArtKit k, IconKind kind, Color? color)
        {
            switch (kind)
            {
                case IconKind.Heart:
                {
                    var pts = new Vector2[24];
                    for (int i = 0; i < 24; i++)
                    {
                        float t = i / 24f * Mathf.PI * 2f, s = Mathf.Sin(t);
                        pts[i] = new Vector2(50 + 16 * s * s * s * 2.5f,
                            48 - (13 * Mathf.Cos(t) - 5 * Mathf.Cos(2 * t) - 2 * Mathf.Cos(3 * t) - Mathf.Cos(4 * t)) * 2.5f);
                    }
                    k.Shape(pts, Ink, color ?? Red, 4, 4);
                    break;
                }
                case IconKind.Star:
                {
                    var pts = new Vector2[10];
                    for (int i = 0; i < 10; i++)
                    {
                        float a = -Mathf.PI / 2 + i * Mathf.PI / 5, rr = i % 2 == 1 ? 18 : 42;
                        pts[i] = new Vector2(50 + Mathf.Cos(a) * rr, 54 + Mathf.Sin(a) * rr);
                    }
                    k.Shape(pts, Ink, color ?? Blue, 4, 4);
                    break;
                }
                case IconKind.Coin:
                    k.Blob(50, 50, 36, 36, Ink, Yellow, 4, 4); k.Ov(50, 50, 22, 22, Ochre, 3); k.Ln(50, 38, 50, 62, Ochre, 4);
                    break;
                case IconKind.Sword:
                    k.Shape(V(44, 74, 44, 22, 50, 8, 56, 22, 56, 74), Ink, color ?? Gray, 3.4f, 3.4f, 0.3f);
                    k.Ln(28, 76, 72, 76, Brown, 7); k.Ln(50, 78, 50, 94, Brown, 8);
                    break;
                case IconKind.Axe:
                    k.Ln(34, 94, 60, 12, Brown, 7);
                    k.Shape(V(56, 22, 80, 10, 92, 36, 80, 58, 62, 42), Ink, color ?? Gray, 3.4f);
                    break;
                case IconKind.Shield:
                    k.Shape(V(18, 16, 82, 16, 80, 52, 50, 90, 20, 52), Ink, color ?? Brown, 4);
                    k.Ln(50, 22, 50, 80, Ink, 3); k.Ln(24, 40, 76, 40, Ink, 3);
                    break;
                case IconKind.Armor:
                    k.Shape(V(30, 16, 42, 10, 58, 10, 70, 16, 88, 32, 76, 44, 70, 36, 70, 90, 30, 90, 30, 36, 24, 44, 12, 32), Ink, color ?? Brown, 4);
                    k.Pl(V(42, 12, 50, 24, 58, 12), false, Ink, 3);
                    break;
                case IconKind.Potion:
                    k.Pl(V(42, 10, 58, 10, 58, 34, 42, 34), true, Ink, 3.4f);
                    k.Ov(50, 62, 28, 28, Ink, 4);
                    k.Fill(V(24, 62, 76, 62, 70, 80, 50, 89, 30, 80), color ?? Red, 3.4f, 0.6f, 0.9f);
                    k.Ln(40, 8, 60, 8, Brown, 6);
                    break;
                case IconKind.Scroll:
                    k.Shape(V(24, 22, 76, 22, 76, 78, 24, 78), Ink, Parchment, 3.4f, 4);
                    k.Ov(50, 20, 30, 7, Ink, 3.4f); k.Ov(50, 80, 30, 7, Ink, 3.4f);
                    foreach (float y in new[] { 36f, 48f, 60f }) k.Pl(V(32, y, 42, y - 4, 52, y + 2, 68, y - 2), false, color ?? Purple, 4);
                    break;
                case IconKind.Bag:
                    k.Shape(V(30, 34, 70, 34, 86, 72, 76, 92, 24, 92, 14, 72), Ink, Brown, 4); k.Ov(50, 30, 16, 8, Ink, 4);
                    break;
                case IconKind.Map:
                    k.Shape(V(10, 22, 36, 12, 64, 22, 90, 12, 90, 80, 64, 90, 36, 80, 10, 90), Ink, Parchment, 4, 5);
                    k.Ln(36, 14, 36, 78, Ink, 2.4f); k.Ln(64, 24, 64, 88, Ink, 2.4f);
                    k.Pl(V(20, 70, 30, 52, 46, 58, 56, 40, 74, 44, 80, 28), false, Red, 3.4f);
                    break;
                case IconKind.Chest:
                    k.Shape(V(14, 44, 86, 44, 86, 86, 14, 86), Ink, Brown, 4);
                    k.Shape(V(14, 44, 20, 22, 80, 22, 86, 44), Ink, Ochre, 4);
                    k.Blob(50, 52, 7, 8, Ink, Yellow, 3, 2.5f);
                    break;
                case IconKind.Die:
                    k.Shape(V(20, 20, 80, 20, 80, 80, 20, 80), Ink, color ?? Red, 4, 5);
                    foreach (var p in V(35, 35, 50, 50, 65, 65)) k.Dot(p.x, p.y, 5, Ink);
                    break;
                case IconKind.Fire:
                    Campfire(k, 50, 90, 3.2f);
                    break;
                case IconKind.Sun:
                    for (int i = 0; i < 8; i++)
                    {
                        float a = i * Mathf.PI / 4;
                        k.Ln(50 + Mathf.Cos(a) * 30, 50 + Mathf.Sin(a) * 30, 50 + Mathf.Cos(a) * 44, 50 + Mathf.Sin(a) * 44, Orange, 4);
                    }
                    k.Blob(50, 50, 22, 22, Orange, Yellow, 4, 4);
                    break;
                case IconKind.Moon:
                {
                    // Lua crescente: arco de fora (raio 38) e arco de dentro, espelhados.
                    var pts = new List<Vector2>();
                    for (int i = 0; i <= 12; i++) { float a = -2.2f + i / 12f * 4.4f; pts.Add(new Vector2(50 - Mathf.Cos(a) * 38, 50 + Mathf.Sin(a) * 38)); }
                    for (int i = 12; i >= 0; i--) { float a = -1.75f + i / 12f * 3.5f; pts.Add(new Vector2(36 - Mathf.Cos(a) * 26, 50 + Mathf.Sin(a) * 30)); }
                    k.Shape(pts.ToArray(), Ink, LBlue, 4, 4);
                    break;
                }
                case IconKind.Torch:
                case IconKind.TorchOff:
                    k.Shape(V(44, 46, 56, 46, 53, 94, 47, 94), Ink, Brown, 3.4f, 3.4f);
                    k.Ln(42, 48, 58, 48, Ink, 5);
                    if (kind == IconKind.Torch)
                    {
                        k.Shape(V(50, 6, 64, 26, 62, 40, 50, 44, 38, 40, 36, 26, 44, 30), Red, Orange, 3.4f, 3);
                        k.Fill(V(50, 22, 57, 34, 50, 40, 43, 34), Yellow, 2.4f, 0.3f, 0.95f);
                    }
                    break;
                case IconKind.Sound:
                case IconKind.SoundOff:
                    k.Shape(V(14, 38, 32, 38, 54, 18, 54, 82, 32, 62, 14, 62), Ink, Gray, 4);
                    if (kind == IconKind.Sound) { k.Pl(V(66, 34, 74, 50, 66, 66), false, Ink, 4); k.Pl(V(78, 22, 90, 50, 78, 78), false, Ink, 4); }
                    else { k.Ln(64, 34, 90, 66, Red, 5); k.Ln(90, 34, 64, 66, Red, 5); }
                    break;
            }
        }

        // Silhueta de cada tipo de dado (caixa 100×100).
        private static Vector2[] DieShape(int sides) => sides switch
        {
            2 => V(18, 50, 50, 18, 82, 50, 50, 82),
            4 => V(50, 10, 92, 84, 8, 84),
            8 => V(50, 4, 90, 50, 50, 96, 10, 50),
            10 => V(50, 4, 92, 44, 50, 96, 8, 44),
            12 => V(50, 6, 94, 38, 77, 92, 23, 92, 6, 38),
            20 => V(50, 4, 90, 27, 90, 73, 50, 96, 10, 73, 10, 27),
            _ => V(14, 14, 86, 14, 86, 86, 14, 86),
        };

        // O dado de `sides` lados desenhado e pintado de leve com `color`.
        // O número é escrito por cima, como texto (DiceTray, Fase 7).
        public static StrokeList Die(int sides, Color color)
        {
            string key = "d" + sides + ColorUtility.ToHtmlStringRGB(color);
            if (Cache.TryGetValue(key, out var list)) return list;
            var k = new ArtKit((uint)(sides * 31 + key.Length));
            var p = DieShape(sides);
            k.Pl(p, true, Ink, 4);
            k.Fill(p, color, 6, 0.8f, 0.45f);
            if (sides == 20) k.Pl(V(50, 24, 76, 66, 24, 66), true, Ink, 1.6f);
            return Cache[key] = k.Out;
        }

        // Fogueira de acampamento: dois troncos cruzados e a chama em cima.
        // (cx, by) = meio da base; s = tamanho (1 = 24 de largura).
        public static void Campfire(ArtKit k, float cx, float by, float s)
        {
            Vector2 P(float x, float y) => new Vector2(cx + x * s, by + y * s);
            var a = P(-12, 0); var b = P(10, -6); var c = P(12, 0); var d = P(-10, -6);
            k.Ln(a.x, a.y, b.x, b.y, Brown, 3.4f * s); k.Ln(c.x, c.y, d.x, d.y, Brown, 3.4f * s);
            k.Shape(new[] { P(0, -26), P(8, -14), P(7, -5), P(0, -3), P(-7, -5), P(-8, -14), P(-3, -11) }, Red, Orange, 2.2f * s, 2.6f);
            k.Fill(new[] { P(0, -15), P(4, -8), P(0, -5), P(-4, -8) }, Yellow, 2, 0.3f, 0.95f);
        }

        // Riscos de golpe por cima do monstro na luta.
        public static StrokeList Slash(uint seed, Color color)
        {
            var r = new Rng(seed);
            var list = new StrokeList();
            for (int i = 0; i < 3; i++)
            {
                float y = 25 + i * 16 + r.NextF() * 8;
                list.Add(Sketch.Line(r, new Vector2(12 + r.NextF() * 10, y), new Vector2(88 - r.NextF() * 10, y + 22 + r.NextF() * 10),
                    Sketch.Pen(color, 4, 3)));
            }
            return list;
        }

        // O "X" vermelho do mestre numa caixa de lado `size` com canto em (x0, y0).
        public static StrokeList Cross(float x0, float y0, float size, uint seed)
        {
            var k = new ArtKit(seed);
            k.Ln(x0 + size * 0.19f, y0 + size * 0.19f, x0 + size * 0.81f, y0 + size * 0.81f, Red, 3);
            k.Ln(x0 + size * 0.81f, y0 + size * 0.19f, x0 + size * 0.19f, y0 + size * 0.81f, Red, 3);
            return k.Out;
        }
    }
}
```

### 3.5 Galeria para conferir

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/ArtGallery.cs
using Caderno.Data;
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.Sketch
{
    // POR QUE: ver todos os desenhos de uma vez e comparar com o protótipo
    // (index.html?luta=<monstro>). Remova o componente depois de conferir.
    // ESTRATÉGIA: uma grade que quebra linha (flex-wrap) com cada desenho
    // sendo traçado ao abrir.
    public class ArtGallery : MonoBehaviour
    {
        [SerializeField] private UIDocument _doc;

        private void Start()
        {
            var grid = new VisualElement();
            grid.style.flexDirection = FlexDirection.Row;
            grid.style.flexWrap = Wrap.Wrap;
            _doc.rootVisualElement.Add(grid);
            string[] ids = { "slime", "rato", "goblin", "lobo", "esqueleto", "aranha", "orc", "bruxa", "ogro", "cavaleiro", "troll", "golem", "dragao" };
            foreach (var id in ids) Add(grid, MonsterArt.Get(id), 150);
            foreach (var id in ids) if (id != "dragao") Add(grid, MonsterArt.Get("chefe_" + id), 150);
            Add(grid, PeopleArt.Hero(0), 150);
            Add(grid, PeopleArt.Npc(1, Palette.Blue), 150);
            Add(grid, PeopleArt.Npc(2, Palette.Green, true), 150);
            foreach (IconKind kind in System.Enum.GetValues(typeof(IconKind))) Add(grid, IconArt.Get(kind), 64);
            foreach (int s in new[] { 4, 6, 8, 10, 12, 20 }) Add(grid, IconArt.Die(s, Palette.Red), 64);
        }

        private static void Add(VisualElement grid, StrokeList list, float size)
        {
            var el = new SketchElement(list);
            el.style.width = size; el.style.height = size;
            grid.Add(el);
            el.PlayDraw(1.2f);
        }
    }
}
```

### ✅ Checkpoint da Fase 3
- Troque `SketchTest` por `ArtGallery` no GameObject `Caderno`. No Play, os 13 monstros, os 12 chefes (cada um com coroa amarela na cabeça), o herói, os dois personagens ("?" azul e "!" vermelho em balão amarelo), os ícones e os 6 dados aparecem sendo desenhados.
- Os desenhos batem com os do protótipo (`index.html?luta=goblin`, por exemplo). Os tremidos não são idênticos, porque os números aleatórios são consumidos numa ordem um pouco diferente, mas as formas e as cores são as mesmas.
- Remova o `ArtGallery` ao terminar.

#### Problemas comuns
- **`KeyNotFoundException` em `MonsterArt.Get`:** o id não está no dicionário `Draw` (ou, num chefe, no `Head`). Os ids precisam ser os mesmos do `GameDatabase`.
- **Coroa flutuando longe da cabeça:** o ponto do monstro em `Head` está errado; ele é o alto da cabeça na caixa 100×100 do desenho original.
- **Galeria lenta para abrir:** são mais de 30 desenhos animando ao mesmo tempo; é só a galeria. No jogo, poucos desenhos animam juntos.

Próxima fase: **A ilha**, com o gerador do mundo e o desenho de cada quadrado do mapa.

---

# Parte 7 — Implementação Unity: Fase 4 (A ilha)

## Fase 4 — A ilha

> Objetivo desta fase: gerar a ilha de uma semente (terrenos, regiões de perigo, fogueiras, covil, monstros, baús, masmorras e personagens) e o interior de cada masmorra, guardar o que já aconteceu em cada mapa e desenhar cada quadrado. Traduz `world.js` e a parte de mapa de `art.js`.

### 4.1 `Island`: um mapa (a ilha ou uma masmorra)

```csharp
// Caminho: Assets/_Project/Scripts/Core/Island.cs
using System.Collections.Generic;

namespace Caderno.Core
{
    // Água, montanha e parede bloqueiam; o resto é andável (Parte 1, Mundo).
    // Parede e Chao só existem dentro das masmorras.
    public enum TileType : byte { Agua, Areia, Campo, Mata, Pantano, Montanha, Parede, Chao }

    public enum ObjType { Fogueira, Covil, Monstro, Bau, Npc, Masmorra, Saida, Chefe }

    // POR QUE: o que o mestre desenhou em cima de um quadrado.
    // ESTRATÉGIA: uma classe só para todos os tipos; cada tipo usa os campos que precisa.
    public sealed class MapObject
    {
        public ObjType type;
        public string kind;     // Monstro, Chefe e Masmorra: id do monstro
        public int n;           // Fogueira: ordem dela (nome em Texts.Fogueiras); Masmorra: número dela (0 a 11)
        public int tier;        // Baú, Masmorra e Npc de missão: região
        public int fala;        // Npc de dica: índice da primeira dica
        public bool presente;   // Npc de dica: dá um presente na primeira conversa
        public bool quest;      // Npc com "!": dá missões (o nome vem de Texts.Quem pela região)
    }

    // POR QUE: um mapa do jogo. É a ilha inteira (48 × 34) ou o interior de
    // uma masmorra (21 × 16), gerado uma vez por aventura.
    // ESTRATÉGIA: arrays de W×H indexados por y * W + x (o "índice" de um
    // quadrado). É assim que o save guarda posições e quadrados resolvidos.
    // O tamanho é de cada mapa, então tudo que percorre o mapa usa map.W e map.H.
    public sealed class Island
    {
        public const int IslandW = 48, IslandH = 34;

        public int W = IslandW, H = IslandH;
        public uint seed;
        public TileType[] t;
        public short[] dist;      // passos a pé desde a fogueira inicial (ou a escada) (-1 = inalcançável)
        public byte[] tier;       // região de perigo 1..6 (0 = inalcançável)
        public int maxD, start, lair = -1;
        public List<int> camps = new List<int>();      // ilha: índices das fogueiras, na ordem
        public List<int> dungeons = new List<int>();   // ilha: índices das entradas, na ordem do número
        public TileType fora = TileType.Agua;           // o que tem fora do mapa: mar na ilha, pedra na masmorra
        public int masmorra = -1;                       // masmorra: o número dela (-1 = é a ilha)
        public string kind;                             // masmorra: o monstro dela
        public Dictionary<int, MapObject> obj = new Dictionary<int, MapObject>();

        public bool IsDungeon => masmorra >= 0;
        public int Size => W * H;

        public static bool Passable(TileType x) => x != TileType.Agua && x != TileType.Montanha && x != TileType.Parede;
        public int Index(int x, int y) => y * W + x;
        public bool InBounds(int x, int y) => x >= 0 && y >= 0 && x < W && y < H;

        // Terreno em (x, y); fora do mapa é `fora`.
        public TileType TerrainAt(int x, int y) => InBounds(x, y) ? t[Index(x, y)] : fora;

        public MapObject ObjAt(int i) => obj.TryGetValue(i, out var o) ? o : null;
    }
}
```

### 4.2 `IslandGenerator`: a ilha e as masmorras

```csharp
// Caminho: Assets/_Project/Scripts/Core/IslandGenerator.cs
using System;
using System.Collections.Generic;

namespace Caderno.Core
{
    // POR QUE: o mestre do caderno inventava o mapa na hora, mas sabia para
    // onde a aventura ia: fogueiras no caminho, masmorras com reis no fundo e o
    // dragão no fim (Parte 1, Mundo; Masmorras e chefes).
    // ESTRATÉGIA (igual a world.js, conta por conta):
    // 1. Ruído de valor (elevação e umidade) define o terreno; a borda afunda
    //    para virar mar, então o mundo é uma ilha.
    // 2. Uma busca em largura a partir da fogueira inicial mede a distância a
    //    pé de cada quadrado: ela define a região (1 a 6), onde ficam mais
    //    duas fogueiras (1/3 e 2/3 do caminho) e o covil (o ponto mais longe).
    // 3. Ilhas ruins (pequenas ou curtas demais) são descartadas e a semente
    //    seguinte é tentada.
    // 4. Monstros e baús; depois uma fogueira em cada região que ficou sem,
    //    as 12 masmorras e por fim os personagens, espaçados. Como esses vêm
    //    por último, a sequência de sorteios até os baús não muda.
    public static class IslandGenerator
    {
        // Monstros de cada região (índice = região).
        public static readonly string[][] Pools =
        {
            null,
            new[] { "slime", "rato" }, new[] { "goblin", "lobo" }, new[] { "esqueleto", "aranha" },
            new[] { "orc", "bruxa" }, new[] { "ogro", "cavaleiro" }, new[] { "troll", "golem" },
        };

        private const int W = Island.IslandW, H = Island.IslandH;

        // Gera a ilha da semente. A ilha guarda a semente que deu certo
        // (island.seed), que é a que vai para o save.
        public static Island Generate(uint seed)
        {
            for (int k = 0; k < 80; k++)
            {
                var island = TryGen(unchecked(seed + (uint)(k * 7919)));
                if (island != null) return island;
            }
            throw new Exception("Não consegui gerar uma ilha");
        }

        // Ruído de valor: uma grade de números sorteados, suavizada entre os pontos.
        // Os valores ficam em float (como o Float32Array do protótipo).
        private static Func<double, double, double> ValueNoise(Rng r, double cell)
        {
            int gw = (int)Math.Ceiling(W / cell) + 3, gh = (int)Math.Ceiling(H / cell) + 3;
            var g = new float[gw * gh];
            for (int i = 0; i < g.Length; i++) g[i] = (float)r.Next();
            return (x, y) =>
            {
                double fx = x / cell, fy = y / cell;
                int ix = (int)Math.Floor(fx), iy = (int)Math.Floor(fy);
                double tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
                double V(int i, int j) => g[(iy + j) * gw + ix + i];
                return (V(0, 0) * (1 - sx) + V(1, 0) * sx) * (1 - sy) + (V(0, 1) * (1 - sx) + V(1, 1) * sx) * sy;
            };
        }

        private static readonly int[] Dx = { 1, -1, 0, 0 }, Dy = { 0, 0, 1, -1 };

        // Distância a pé de cada quadrado até `start` num mapa w × h (só andando em terreno andável).
        private static short[] Bfs(TileType[] t, int w, int h, int start)
        {
            var dist = new short[w * h];
            for (int i = 0; i < dist.Length; i++) dist[i] = -1;
            var q = new List<int> { start };
            dist[start] = 0;
            for (int k = 0; k < q.Count; k++)
            {
                int i = q[k], x = i % w, y = i / w;
                for (int d = 0; d < 4; d++)
                {
                    int nx = x + Dx[d], ny = y + Dy[d];
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    int j = ny * w + nx;
                    if (dist[j] < 0 && Island.Passable(t[j])) { dist[j] = (short)(dist[i] + 1); q.Add(j); }
                }
            }
            return dist;
        }

        // Os dois quadrados estão a até `range` de distância na horizontal e na vertical.
        private static bool Near(int i, int j, int range) =>
            Math.Abs(i % W - j % W) <= range && Math.Abs(i / W - j / W) <= range;

        private static bool NearAny(int i, List<int> list, int range)
        {
            foreach (int j in list) if (Near(i, j, range)) return true;
            return false;
        }

        private static Island TryGen(uint seed)
        {
            var r = new Rng(seed);
            var e1 = ValueNoise(r, 7); var e2 = ValueNoise(r, 3); var m1 = ValueNoise(r, 6); var m2 = ValueNoise(r, 2.5);
            var t = new TileType[W * H];
            for (int y = 0; y < H; y++)
                for (int x = 0; x < W; x++)
                {
                    double e = e1(x, y) * 0.7 + e2(x, y) * 0.3;
                    double d = Math.Max(Math.Abs(x / (double)(W - 1) - 0.5), Math.Abs(y / (double)(H - 1) - 0.5)) * 2;
                    e += 0.06 - Math.Max(0, d - 0.62) * 1.4;
                    double m = m1(x, y) * 0.7 + m2(x, y) * 0.3;
                    t[y * W + x] = e < 0.36 ? TileType.Agua : e < 0.41 ? TileType.Areia : e > 0.69 ? TileType.Montanha
                        : (m > 0.6 && e < 0.5) ? TileType.Pantano : m > 0.5 ? TileType.Mata : TileType.Campo;
                }

            // A fogueira inicial fica no campo mais perto de (24% da largura, meio da altura).
            int start = -1;
            double best = double.MaxValue;
            for (int i = 0; i < W * H; i++)
            {
                if (t[i] != TileType.Campo) continue;
                double dd = Math.Sqrt(Math.Pow(i % W - W * 0.24, 2) + Math.Pow(i / W - H * 0.5, 2));
                if (dd < best) { best = dd; start = i; }
            }
            if (start < 0) return null;

            var dist = Bfs(t, W, H, start);
            int reach = 0, maxD = 0, far = start;
            for (int i = 0; i < W * H; i++)
                if (dist[i] >= 0) { reach++; if (dist[i] > maxD) { maxD = dist[i]; far = i; } }
            if (reach < W * H * 0.36 || maxD < 40) return null;

            var tier = new byte[W * H];
            for (int i = 0; i < W * H; i++)
                tier[i] = dist[i] < 0 ? (byte)0 : (byte)Math.Min(6, 1 + (int)Math.Floor(dist[i] * 6.0 / (maxD + 1)));

            var island = new Island { seed = seed, t = t, dist = dist, tier = tier, maxD = maxD, start = start, lair = far };

            // Um campo ou praia sorteado com distância entre lo e hi.
            int Pick(double lo, double hi)
            {
                var c = new List<int>();
                for (int i = 0; i < W * H; i++)
                    if (dist[i] >= lo && dist[i] <= hi && (t[i] == TileType.Campo || t[i] == TileType.Areia)) c.Add(i);
                return c.Count > 0 ? c[r.Index(c.Count)] : -1;
            }
            island.camps = new List<int> { start, Pick(maxD * 0.3, maxD * 0.38), Pick(maxD * 0.62, maxD * 0.7) };
            if (island.camps.Contains(-1)) return null;
            for (int n = 0; n < 3; n++) island.obj[island.camps[n]] = new MapObject { type = ObjType.Fogueira, n = n };
            island.obj[far] = new MapObject { type = ObjType.Covil };

            var free = new List<int>();
            for (int i = 0; i < W * H; i++) if (dist[i] > 0 && !island.obj.ContainsKey(i) && !NearAny(i, island.camps, 2)) free.Add(i);

            // Monstros (~7,5%; 40% em volta do covil, todos da região 6) e baús (~2%).
            foreach (int i in free)
            {
                bool nearLair = Near(i, far, 2);
                if (nearLair ? r.Next() < 0.4 : r.Next() < 0.075)
                {
                    var pool = Pools[nearLair ? 6 : tier[i]];
                    island.obj[i] = new MapObject { type = ObjType.Monstro, kind = pool[r.Index(pool.Length)] };
                }
                else if (r.Next() < 0.02) island.obj[i] = new MapObject { type = ObjType.Bau, tier = tier[i] };
            }

            // Cada região sem fogueira ganha uma num campo ou praia livre, sem
            // nada encostado (dos quadrados livres), a 4+ quadrados do covil e a
            // 6+ das outras fogueiras.
            var freeSet = new HashSet<int>(free);
            bool Crowded(int i)
            {
                for (int dy = -1; dy <= 1; dy++)
                    for (int dx = -1; dx <= 1; dx++)
                    {
                        int x = i % W + dx, y = i / W + dy, j = y * W + x;
                        if (x >= 0 && y >= 0 && x < W && y < H && freeSet.Contains(j) && island.obj.ContainsKey(j)) return true;
                    }
                return false;
            }
            for (int tr = 1; tr <= 6; tr++)
            {
                bool has = false;
                foreach (int c in island.camps) if (tier[c] == tr) has = true;
                if (has) continue;
                var c2 = free.FindAll(i => tier[i] == tr && (t[i] == TileType.Campo || t[i] == TileType.Areia) && !Near(i, far, 3)
                    && !NearAny(i, island.camps, 5) && !Crowded(i));
                if (c2.Count == 0) continue;
                int at = c2[r.Index(c2.Count)];
                island.obj[at] = new MapObject { type = ObjType.Fogueira, n = island.camps.Count };
                island.camps.Add(at);
            }

            // Uma masmorra por monstro, na região dele, a 4+ quadrados das fogueiras
            // e do covil e a 6+ das outras. Se não couber, aquela fica de fora.
            for (int tr = 1; tr <= 6; tr++)
                foreach (string kind in Pools[tr])
                {
                    var c = new List<int>();
                    foreach (int i in free)
                        if (!island.obj.ContainsKey(i) && tier[i] == tr && !Near(i, far, 3) && !NearAny(i, island.camps, 3) && !NearAny(i, island.dungeons, 5))
                            c.Add(i);
                    if (c.Count == 0) continue;
                    int at = c[r.Index(c.Count)];
                    island.obj[at] = new MapObject { type = ObjType.Masmorra, n = island.dungeons.Count, kind = kind, tier = tr };
                    island.dungeons.Add(at);
                }

            // Personagens: primeiro um que dá missões em cada região, depois 9
            // que dão dicas. Ninguém fica a menos de 5 quadrados de outro
            // personagem, nem encostado numa masmorra.
            var npcs = new List<int>();
            bool Roomy(int i) => !island.obj.ContainsKey(i) && !NearAny(i, npcs, 4) && !NearAny(i, island.dungeons, 1);
            for (int tr = 1; tr <= 6; tr++)
            {
                var c = free.FindAll(i => tier[i] == tr && Roomy(i));
                if (c.Count == 0) continue;
                int at = c[r.Index(c.Count)];
                island.obj[at] = new MapObject { type = ObjType.Npc, quest = true, tier = tr };
                npcs.Add(at);
            }
            int hints = 0;
            for (int k = 0; k < 600 && hints < 9; k++)
            {
                int i = free[r.Index(free.Count)];
                if (!Roomy(i)) continue;
                island.obj[i] = new MapObject { type = ObjType.Npc, fala = hints, presente = hints % 3 == 1 };
                npcs.Add(i);
                hints++;
            }
            return island;
        }

        // ---------- masmorras ----------

        // POR QUE: o interior da masmorra n, igual a dungeon() de world.js. Sai
        // da semente da ilha, então é o mesmo toda vez que o herói desce.
        // ESTRATÉGIA: 4 × 3 celas de 5 quadrados, cada uma com uma sala de 2 a
        // 4 de lado. Um labirinto (busca em profundidade) liga as celas por
        // corredores em L, mais 2 ligações extras. A escada fica numa sala e
        // o chefe na sala mais longe dela a pé.
        public static Island Dungeon(uint islandSeed, int n, string kind, int tr)
        {
            const int CW = 5, NC = 4, NR = 3, DW = NC * CW + 1, DH = NR * CW + 1;
            var r = new Rng(Rng.Hash((int)islandSeed, n, 991));
            var t = new TileType[DW * DH];
            for (int i = 0; i < t.Length; i++) t[i] = TileType.Parede;
            void Dig(int x, int y) => t[y * DW + x] = TileType.Chao;

            var rooms = new List<RectInt>();
            for (int cy = 0; cy < NR; cy++)
                for (int cx = 0; cx < NC; cx++)
                {
                    int rw = 2 + r.Index(3), rh = 2 + r.Index(3);
                    int x = cx * CW + 1 + r.Index(5 - rw), y = cy * CW + 1 + r.Index(5 - rh);
                    for (int yy = y; yy < y + rh; yy++) for (int xx = x; xx < x + rw; xx++) Dig(xx, yy);
                    rooms.Add(new RectInt(x, y, rw, rh));
                }

            // Corredor em L entre o meio de duas salas.
            void Hall(int a, int b)
            {
                RectInt A = rooms[a], B = rooms[b];
                if (r.Next() < 0.5)
                {
                    for (int x = Math.Min(A.Cx, B.Cx); x <= Math.Max(A.Cx, B.Cx); x++) Dig(x, A.Cy);
                    for (int y = Math.Min(A.Cy, B.Cy); y <= Math.Max(A.Cy, B.Cy); y++) Dig(B.Cx, y);
                }
                else
                {
                    for (int y = Math.Min(A.Cy, B.Cy); y <= Math.Max(A.Cy, B.Cy); y++) Dig(A.Cx, y);
                    for (int x = Math.Min(A.Cx, B.Cx); x <= Math.Max(A.Cx, B.Cx); x++) Dig(x, B.Cy);
                }
            }
            // Celas vizinhas da cela c, na ordem direita, esquerda, baixo, cima.
            List<int> Neighbors(int c)
            {
                var list = new List<int>();
                for (int d = 0; d < 4; d++)
                {
                    int x = c % NC + Dx[d], y = c / NC + Dy[d];
                    if (x >= 0 && y >= 0 && x < NC && y < NR) list.Add(y * NC + x);
                }
                return list;
            }
            var linked = new HashSet<int> { 0 };
            var stack = new List<int> { 0 };
            while (stack.Count > 0)
            {
                int c = stack[stack.Count - 1];
                var opts = Neighbors(c).FindAll(d => !linked.Contains(d));
                if (opts.Count == 0) { stack.RemoveAt(stack.Count - 1); continue; }
                int next = opts[r.Index(opts.Count)];
                Hall(c, next); linked.Add(next); stack.Add(next);
            }
            for (int k = 0; k < 2; k++)
            {
                int c = r.Index(rooms.Count);
                var o = Neighbors(c);
                Hall(c, o[r.Index(o.Count)]);
            }

            int s0 = r.Index(rooms.Count);
            int Mid(RectInt m) => m.Cy * DW + m.Cx;
            int start = Mid(rooms[s0]);
            var dist = Bfs(t, DW, DH, start);
            int b0 = 0;
            for (int k = 0; k < rooms.Count; k++) if (dist[Mid(rooms[k])] > dist[Mid(rooms[b0])]) b0 = k;

            var map = new Island
            {
                W = DW, H = DH, seed = Rng.Hash((int)islandSeed, n, 992), t = t, dist = dist, start = start,
                fora = TileType.Parede, masmorra = n, kind = kind, tier = new byte[DW * DH],
            };
            for (int i = 0; i < map.tier.Length; i++) map.tier[i] = (byte)tr;
            map.obj[start] = new MapObject { type = ObjType.Saida };
            map.obj[Mid(rooms[b0])] = new MapObject { type = ObjType.Chefe, kind = kind };

            // Monstros e baús nas outras salas, fora da linha e da coluna do
            // meio (por onde chegam os corredores), para não fechar a passagem.
            string other = Array.Find(Pools[tr], k => k != kind);
            int chests = 0;
            for (int k = 0; k < rooms.Count; k++)
            {
                if (k == s0 || k == b0) continue;
                var m = rooms[k];
                var spots = new List<int>();
                for (int y = m.y; y < m.y + m.h; y++)
                    for (int x = m.x; x < m.x + m.w; x++)
                        if (x != m.Cx && y != m.Cy) spots.Add(y * DW + x);
                if (spots.Count == 0) continue;
                double roll = r.Next();
                int at = spots[r.Index(spots.Count)];
                if (roll < 0.6) map.obj[at] = new MapObject { type = ObjType.Monstro, kind = r.Next() < 0.8 ? kind : other };
                else if (roll < 0.8 && chests < 2) { map.obj[at] = new MapObject { type = ObjType.Bau, tier = tr }; chests++; }
            }
            return map;
        }

        // Retângulo de uma sala; (Cx, Cy) é o meio, arredondado para baixo
        // (o `x + (w >> 1)` do protótipo).
        private readonly struct RectInt
        {
            public readonly int x, y, w, h;
            public RectInt(int x, int y, int w, int h) { this.x = x; this.y = y; this.w = w; this.h = h; }
            public int Cx => x + (w >> 1);
            public int Cy => y + (h >> 1);
        }
    }
}
```

### 4.3 `RunState`: o que já aconteceu em cada mapa e o relógio

```csharp
// Caminho: Assets/_Project/Scripts/Core/RunState.cs
using System.Collections.Generic;

namespace Caderno.Core
{
    // POR QUE: o que o jogador já fez num mapa (a ilha ou uma masmorra).
    // ESTRATÉGIA: conjuntos de índices de quadrados daquele mapa. Os "X" do
    // mestre são desenhados a partir de dead/opened.
    public sealed class MapState
    {
        public readonly bool[] revealed;
        public HashSet<int> dead = new HashSet<int>();      // monstros (e chefe) desenhados vencidos
        public HashSet<int> opened = new HashSet<int>();    // baús abertos
        public HashSet<long> trail = new HashSet<long>();   // trechos do rastro (par de índices)

        public MapState(int size) { revealed = new bool[size]; }
    }

    // POR QUE: a ilha nasce igual da semente; o que muda é o que o jogador já
    // fez nela. Guardar só isso deixa o save pequeno.
    // ESTRATÉGIA: um MapState para a ilha e um para cada masmorra visitada,
    // mais o que vale para a aventura toda: relógio, narrações já feitas,
    // masmorras limpas, conversas.
    public sealed class RunState
    {
        public const int Ciclo = 100;   // passos de um dia inteiro

        public MapState island = new MapState(Island.IslandW * Island.IslandH);
        public Dictionary<int, MapState> dungeons = new Dictionary<int, MapState>();
        public HashSet<int> talked = new HashSet<int>();     // personagens que já deram presente
        public HashSet<int> cleared = new HashSet<int>();    // masmorras com o chefe vencido
        public HashSet<string> seen = new HashSet<string>(); // narrações já feitas ("t3", "r2", "v0")
        public Dictionary<int, int> conversa = new Dictionary<int, int>();   // quantas vezes falou com cada personagem
        public int steps, kills, clock = 10, day = 1;
        public bool won;

        // Estado da masmorra n (criado vazio na primeira descida).
        public MapState Dungeon(int n, int size)
        {
            if (!dungeons.TryGetValue(n, out var s)) dungeons[n] = s = new MapState(size);
            return s;
        }

        // Quão escuro está (0 a 1): passos 0–64 dia, 65–74 escurecendo,
        // 75–94 noite, 95–99 clareando (Parte 1, Dia e noite).
        public float Darkness =>
            clock < 65 ? 0f : clock < 75 ? (clock - 64) / 10f : clock < 95 ? 1f : (100 - clock) / 6f;

        public bool IsNight => Darkness >= 0.5f;

        // Um passo no relógio; vira o dia no fim do ciclo.
        public void Tick()
        {
            if (++clock >= Ciclo) { clock = 0; day++; }
        }

        // Chave de um trecho do rastro, igual nos dois sentidos.
        public static long TrailKey(int a, int b) => (long)System.Math.Min(a, b) * 100000 + System.Math.Max(a, b);
    }
}
```

### 4.4 `Texts`: nomes e falas

```csharp
// Caminho: Assets/_Project/Scripts/Data/Texts.cs
using System.Collections.Generic;
using Caderno.Core;

namespace Caderno.Data
{
    // POR QUE: as falas do mestre e dos personagens (Parte 1, O mestre). Num
    // arquivo só, para revisar o texto sem procurar no código.
    public static class Texts
    {
        // Acampamentos com fogueira, na ordem em que o gerador cria (os 3
        // primeiros onde eram as vilas; os outros, nas regiões que ficaram sem).
        public static readonly string[] Fogueiras =
        {
            "Acampamento Apontador", "Acampamento Borracha", "Acampamento Régua", "Acampamento Clipe", "Acampamento Grampo",
            "Acampamento Compasso", "Acampamento Estojo", "Acampamento Transferidor", "Acampamento Lancheira",
        };

        // Quem descansa em cada fogueira (uma frase por fogueira, em rodízio).
        public static readonly string[] FogueiraDescricao =
        {
            "Em volta do fogo: um ferreiro andarilho afiando a espada, uma maga de chapéu torto e um mercador cochilando.",
            "Uma cavaleira remenda o escudo, um mago velho lê pergaminhos e um mercador conta moedas.",
            "Dois guerreiros assam linguiça no fogo. Um deles carrega uma mochila cheia de armas pra vender.",
        };

        // Dicas. O personagem de dica k fala a frase k; ao conversar de novo,
        // a k + 9, depois a k + 18... então nenhuma dica fica de fora.
        public static readonly string[] Npc =
        {
            "Dizem que o dragão mora no ponto mais longe daqui. Quanto mais longe você vai, mais forte é o monstro.",
            "Cada arma dá dados. A espada de madeira é 1d6... já ouvi falar de uma lâmina que rola 5d20!",
            "De noite os monstros ficam mais fortes: rolam um dado de ataque a mais. Em compensação, dão mais experiência.",
            "Sem tocha, de noite você não enxerga um palmo na frente do nariz. Em toda fogueira tem alguém vendendo tocha.",
            "Cada tipo de monstro tem um rei escondido numa masmorra. Procure as portas de pedra com uma coroa em cima.",
            "Gente com \"!\" no balão tem serviço pra você. E paga bem!",
            "Escudo e armadura também rolam dados. A soma deles sai do dano que você toma.",
            "Se desmaiar, você acorda na última fogueira por onde passou, mas perde metade do ouro. E os monstros voltam.",
            "Defesa alta? Feitiço não liga pra escudo: a magia passa direto.",
            "Descansar na fogueira cura tudo e passa a noite... mas todo monstro que você venceu volta pro mapa.",
            "Quanto mais longe a fogueira, melhor o equipamento dos guerreiros que descansam nela.",
            "Monstro desenhado no mapa não corre atrás de ninguém. Você escolhe se quer brigar.",
            "No mato fechado aparece bicho do nada. Cuidado na floresta e no pântano.",
            "Baú tem moeda, poção e, com sorte, equipamento bom.",
            "Fugir é rolar um d20. Logo no começo da luta é mais fácil.",
            "Rabo de rato, osso de esqueleto... tudo que cai dos monstros vale umas moedas na fogueira.",
        };

        // Lugar da masmorra de um monstro ("Esgoto").
        public static string Lugar(string kind) => System.Array.Find(GameDatabase.Masmorras, m => m.kind == kind).lugar;

        // "Esgoto do Rei Rato", "Ninho da Rainha Aranha".
        public static string NomeMasmorra(string kind)
        {
            var m = System.Array.Find(GameDatabase.Masmorras, x => x.kind == kind);
            return $"{m.lugar} {(m.chefe.StartsWith("Rainha") ? "da" : "do")} {m.chefe}";
        }

        // Quem dá missão em cada região (índice = região - 1).
        public static readonly string[] Quem = { "Seu Juca", "Dona Filó", "Tio Bento", "Vó Nina", "Mestre Caco", "Dona Lurdes" };

        // Narração na primeira vez em cada terreno (null = nada a dizer).
        public static string Terreno(TileType t) => t switch
        {
            TileType.Areia => "Praia! O mestre faz pontinhos de areia com a caneta amarela.",
            TileType.Mata => "Floresta! O mestre rabisca um monte de arvorezinhas. No mato aparece mais monstro.",
            TileType.Pantano => "Pântano... cheira mal e esconde bicho. O mestre pinta tudo de verde-oliva.",
            _ => null,
        };

        // Narração na primeira vez em cada região.
        public static readonly Dictionary<int, string> Regiao = new Dictionary<int, string>
        {
            [2] = "O mestre sorri: \"daqui pra frente tem goblin e lobo\".",
            [3] = "Esqueletos e aranhas por aqui. Melhor ter escudo.",
            [4] = "Terra de orcs e bruxas. O mestre aperta a caneta com força.",
            [5] = "Ogros e cavaleiros negros... você está longe de casa.",
            [6] = "Trolls e golens. O covil do dragão deve estar perto.",
        };
    }
}
```

### 4.5 `TileArt`: o desenho de cada quadrado

```csharp
// Caminho: Assets/_Project/Scripts/Sketch/TileArt.cs
using Caderno.Core;
using Caderno.Data;
using UnityEngine;
using static Caderno.Data.Palette;
using static Caderno.Sketch.ArtKit;

namespace Caderno.Sketch
{
    // Um quadrado desenhado: traços + um nome escrito (fogueira, covil...), se houver.
    public sealed class TileDrawing
    {
        public StrokeList strokes;
        public string label;
        public Vector2 labelPos;
        public Color labelColor;
    }

    // POR QUE: o mestre desenha cada quadrado com caneta colorida (Parte 1,
    // Estética): costa azul, ondas, pontinhos de areia, tufos de grama,
    // árvores, pântano, montanhas, paredes de masmorra, e o que estiver em cima.
    // ESTRATÉGIA: traços em coordenadas do mundo (quadrado de 64). A semente
    // vem da ilha + posição, então o quadrado sai igual ao recarregar. A
    // costa é traçada pelo quadrado de terra; os cantos tremem por um hash do
    // próprio vértice, então bordas vizinhas se emendam.
    public static class TileArt
    {
        public const float T = 64f;

        // st = o que já aconteceu neste mapa (X em monstros e baús);
        // run = a aventura (dragão vencido, masmorras limpas).
        public static TileDrawing Build(Island w, int tx, int ty, MapState st, RunState run)
        {
            var k = new ArtKit(Rng.Hash((int)w.seed, tx, ty, 77));
            var r = k.R;
            float x0 = tx * T, y0 = ty * T;
            var t = w.TerrainAt(tx, ty);
            var d = new TileDrawing { strokes = k.Out };

            if (t == TileType.Agua)
            {
                for (int i = 0; i < 9; i++)
                {
                    float y = y0 + 4 + i * 7 + (r.NextF() - 0.5f) * 1.5f;
                    k.Out.Add(Sketch.Line(r, new Vector2(x0 - 1, y), new Vector2(x0 + T + 1, y + (r.NextF() - 0.5f) * 2),
                        Sketch.Pencil(LBlue, 1.6f, 0.55f, 1f)));
                }
                if (r.Next() < 0.35)
                {
                    float wx = r.Range(x0 + 10, x0 + 40), wy = r.Range(y0 + 14, y0 + 50);
                    k.Pl(V(wx, wy, wx + 4, wy - 3, wx + 8, wy, wx + 12, wy - 3, wx + 16, wy), false, Blue, 1.8f);
                }
            }
            else
            {
                // (dx, dy) do vizinho e os dois vértices da borda comum.
                int[,] edges = { { 0, -1, tx, ty, tx + 1, ty }, { 0, 1, tx, ty + 1, tx + 1, ty + 1 }, { -1, 0, tx, ty, tx, ty + 1 }, { 1, 0, tx + 1, ty, tx + 1, ty + 1 } };
                for (int e = 0; e < 4; e++)
                {
                    if (w.TerrainAt(tx + edges[e, 0], ty + edges[e, 1]) != TileType.Agua) continue;
                    var a = Vertex(w, edges[e, 2], edges[e, 3]);
                    var b = Vertex(w, edges[e, 4], edges[e, 5]);
                    k.Out.Add(Sketch.Poly(r, new[] { a, b }, false, Sketch.Pen(Blue, 2.4f, 4, 5)));
                }
            }

            int index = w.Index(tx, ty);
            var obj = w.ObjAt(index);
            bool busy = obj != null && obj.type != ObjType.Monstro && obj.type != ObjType.Bau;
            switch (t)
            {
                case TileType.Areia:
                    for (int i = 0; i < 9; i++)
                    {
                        float x = r.Range(x0 + 6, x0 + T - 6), y = r.Range(y0 + 6, y0 + T - 6);
                        k.Ln(x, y, x + 1.6f, y + 0.8f, Ochre, 2.2f);
                    }
                    break;
                case TileType.Campo when !busy:
                {
                    int n = r.Next() < 0.55 ? 1 + (r.Next() < 0.4 ? 1 : 0) : 0;
                    for (int i = 0; i < n; i++)
                    {
                        float x = r.Range(x0 + 12, x0 + T - 12), y = r.Range(y0 + 16, y0 + T - 8);
                        foreach (float dd in new[] { -5f, 0f, 5f })
                            k.Out.Add(Sketch.Line(r, new Vector2(x, y), new Vector2(x + dd, y - 7 - (dd == 0 ? 2 : 0)), Sketch.Pencil(Green, 1.8f, 0.9f, 0.6f)));
                    }
                    break;
                }
                case TileType.Mata:
                {
                    int n = obj != null ? (obj.type == ObjType.Masmorra ? 0 : 1) : 2 + (r.Next() < 0.5 ? 1 : 0);
                    var trees = new Vector3[n];
                    for (int i = 0; i < n; i++) trees[i] = new Vector3(r.Range(x0 + 14, x0 + T - 14), r.Range(y0 + 12, y0 + T - 20), r.Range(9, 12));
                    System.Array.Sort(trees, (p, q) => p.y.CompareTo(q.y));   // de trás para a frente
                    foreach (var tr in trees)
                    {
                        k.Ln(tr.x, tr.y + tr.z - 2, tr.x + (r.NextF() - 0.5f) * 2, tr.y + tr.z + 8, Brown, 2.4f);
                        k.Ov(tr.x, tr.y, tr.z, tr.z * 0.92f, Green, 2.2f);
                        k.FillE(tr.x, tr.y, tr.z, tr.z * 0.92f, LGreen, 3.4f, 0.9f, 0.7f);
                    }
                    break;
                }
                case TileType.Pantano:
                    for (int i = 0; i < 5; i++)
                    {
                        float x = r.Range(x0 + 6, x0 + T - 22), y = r.Range(y0 + 10, y0 + T - 6);
                        var end = new Vector2(x + r.Range(10, 18), y + (r.NextF() - 0.5f) * 2);
                        k.Out.Add(i < 2 ? Sketch.Line(r, new Vector2(x, y), end, Sketch.Pen(Olive, 2.2f))
                                        : Sketch.Line(r, new Vector2(x, y), end, Sketch.Pencil(Olive, 1.6f, 0.8f)));
                    }
                    if (!busy)
                        for (int i = 0; i < 2; i++)
                        {
                            float x = r.Range(x0 + 12, x0 + T - 12), y = r.Range(y0 + 26, y0 + T - 8);
                            k.Ln(x, y, x + 1, y - 16, Olive, 1.8f);
                            k.Ov(x + 1, y - 18, 2, 4.5f, Brown, 2.2f);
                        }
                    break;
                case TileType.Parede:
                {
                    // Só a parede que encosta no chão é desenhada (pedra maciça
                    // fica em branco): pintada de cinza, com borda de caneta.
                    bool touch = false;
                    for (int dy = -1; dy <= 1; dy++)
                        for (int dx = -1; dx <= 1; dx++)
                            if (w.TerrainAt(tx + dx, ty + dy) == TileType.Chao) touch = true;
                    if (!touch) return d;
                    k.Fill(V(x0, y0, x0 + T, y0, x0 + T, y0 + T, x0, y0 + T), Gray, 5, 0.8f, 0.5f);
                    // (dx, dy) do vizinho e a borda comum, em frações do quadrado.
                    float[,] sides = { { 0, -1, 0, 0, 1, 0 }, { 0, 1, 0, 1, 1, 1 }, { -1, 0, 0, 0, 0, 1 }, { 1, 0, 1, 0, 1, 1 } };
                    for (int e = 0; e < 4; e++)
                        if (w.TerrainAt(tx + (int)sides[e, 0], ty + (int)sides[e, 1]) == TileType.Chao)
                            k.Ln(x0 + sides[e, 2] * T, y0 + sides[e, 3] * T, x0 + sides[e, 4] * T, y0 + sides[e, 5] * T, Ink, 2.8f);
                    break;
                }
                case TileType.Chao:
                    for (int i = 0; i < 3; i++)
                    {
                        float x = r.Range(x0 + 8, x0 + T - 8), y = r.Range(y0 + 8, y0 + T - 8);
                        k.Ln(x, y, x + 1.4f, y + 0.6f, Gray, 1.8f);
                    }
                    break;
                case TileType.Montanha:
                {
                    int n = r.Next() < 0.5 ? 2 : 1;
                    for (int i = 0; i < n; i++)
                    {
                        float cx = n == 1 ? x0 + T / 2 + (r.NextF() - 0.5f) * 8 : x0 + 18 + i * 28, by = y0 + T - 8 - i * 4;
                        float hw = n == 1 ? r.Range(24, 28) : r.Range(16, 19), py = by - r.Range(34, 46);
                        k.Pl(V(cx - hw, by, cx, py, cx + hw, by), false, Brown, 2.6f);
                        k.Fill(V(cx, py + 3, cx + hw - 2, by - 1, cx + 2, by - 1), Gray, 3.4f, -0.9f, 0.7f);
                        float hh = by - py;
                        k.Pl(V(cx - hw * 0.28f, py + hh * 0.28f, cx - hw * 0.1f, py + hh * 0.36f, cx + hw * 0.08f, py + hh * 0.26f, cx + hw * 0.28f, py + hh * 0.32f), false, Ink, 1.8f);
                    }
                    break;
                }
            }

            if (obj == null) return d;
            float mid = x0 + T / 2;
            switch (obj.type)
            {
                case ObjType.Fogueira:
                {
                    // Acampamento: barraca listrada, a fogueira e um guerreiro sentado nela.
                    Color[] tents = { Red, Blue, Green, Purple, Orange, Pink };
                    k.Shape(V(x0 + 4, y0 + 50, x0 + 18, y0 + 20, x0 + 32, y0 + 50), Ink, tents[obj.n % tents.Length], 2.4f, 3.4f);
                    k.Pl(V(x0 + 14, y0 + 50, x0 + 18, y0 + 36, x0 + 22, y0 + 50), false, Ink, 2);
                    IconArt.Campfire(k, x0 + 46, y0 + 54, 0.8f);
                    k.Ov(x0 + 56, y0 + 34, 3.5f, 3.5f, Ink, 2);
                    k.Ln(x0 + 56, y0 + 38, x0 + 57, y0 + 48, Ink, 2.2f);
                    k.Ln(x0 + 57, y0 + 48, x0 + 50, y0 + 50, Ink, 2.2f);
                    k.Ln(x0 + 56, y0 + 42, x0 + 50, y0 + 44, Ink, 2);
                    k.Ln(x0 + 60, y0 + 30, x0 + 61, y0 + 50, Gray, 2);
                    d.label = Texts.Fogueiras[obj.n]; d.labelPos = new Vector2(mid, y0 - 2); d.labelColor = Ink;
                    break;
                }
                case ObjType.Covil:
                {
                    k.Shape(V(x0 + 2, y0 + T - 6, x0 + 10, y0 + 22, mid, y0 + 8, x0 + T - 10, y0 + 22, x0 + T - 2, y0 + T - 6), Brown, Gray, 2.6f, 4.4f);
                    var hole = V(mid - 14, y0 + T - 6, mid - 12, y0 + 36, mid, y0 + 28, mid + 12, y0 + 36, mid + 14, y0 + T - 6);
                    k.Pl(hole, true, Ink, 2.4f); k.Fill(hole, Ink, 2, 0.5f, 0.9f);
                    d.label = "Covil do Dragão"; d.labelPos = new Vector2(mid, y0 - 2); d.labelColor = Red;
                    if (run.won) k.Out.AddRange(IconArt.Cross(x0, y0, T, (uint)index));
                    break;
                }
                case ObjType.Monstro:
                    k.Out.AddRange(MonsterArt.Get(obj.kind).Transformed(0.5f, new Vector2(x0 + 7, y0 + 8)));
                    if (st.dead.Contains(index)) k.Out.AddRange(IconArt.Cross(x0, y0, T, (uint)index));
                    break;
                case ObjType.Bau:
                    k.Out.AddRange(IconArt.Get(Caderno.Data.IconKind.Chest).Transformed(0.38f, new Vector2(x0 + 13, y0 + 16)));
                    if (st.opened.Contains(index)) k.Out.AddRange(IconArt.Cross(x0, y0, T, (uint)index));
                    break;
                case ObjType.Npc:
                {
                    Color[] hats = { Blue, Green, Purple, Orange, Pink };
                    var hat = hats[(obj.quest ? obj.tier : obj.fala) % hats.Length];
                    k.Out.AddRange(PeopleArt.Npc(Rng.Hash(index, 5), hat, obj.quest).Transformed(0.56f, new Vector2(x0 + 4, y0 + 6)));
                    if (obj.quest) { d.label = Texts.Quem[obj.tier - 1]; d.labelPos = new Vector2(mid, y0 - 2); d.labelColor = Ink; }
                    break;
                }
                case ObjType.Masmorra:
                {
                    // Arco de pedra cinza, porta escura e uma coroa em cima.
                    Vector2[] Arch(float hw, float top) => V(mid - hw, y0 + T - 6, mid - hw, y0 + top + 10, mid - hw * 0.6f, y0 + top + 2,
                        mid, y0 + top, mid + hw * 0.6f, y0 + top + 2, mid + hw, y0 + top + 10, mid + hw, y0 + T - 6);
                    k.Shape(Arch(22, 16), Ink, Gray, 2.6f, 4);
                    var door = Arch(12, 28);
                    k.Pl(door, true, Ink, 2.4f); k.Fill(door, Ink, 2, 0.5f, 0.9f);
                    MonsterArt.Crown(k, mid, y0 + 13, 0.8f);
                    d.label = Texts.Lugar(obj.kind); d.labelPos = new Vector2(mid, y0 - 2); d.labelColor = Ink;
                    if (run.cleared.Contains(obj.n)) k.Out.AddRange(IconArt.Cross(x0, y0, T, (uint)index));
                    break;
                }
                case ObjType.Saida:
                    // Escada para cima: degraus cada vez mais estreitos.
                    for (int i = 0; i < 4; i++)
                    {
                        float hw = 22 - i * 4, y = y0 + T - 10 - i * 9;
                        k.Shape(V(mid - hw, y, mid + hw, y, mid + hw, y - 8, mid - hw, y - 8), Ink, Ochre, 2.2f, 3);
                    }
                    d.label = "Saída"; d.labelPos = new Vector2(mid, y0 + 2); d.labelColor = Green;
                    break;
                case ObjType.Chefe:
                    k.Out.AddRange(MonsterArt.Get("chefe_" + obj.kind).Transformed(0.6f, new Vector2(x0 + 2, y0 + 2)));
                    d.label = System.Array.Find(GameDatabase.Masmorras, m => m.kind == obj.kind).chefe;
                    d.labelPos = new Vector2(mid, y0 - 2); d.labelColor = Red;
                    if (st.dead.Contains(index)) k.Out.AddRange(IconArt.Cross(x0, y0, T, (uint)index));
                    break;
            }
            return d;
        }

        // Vértice (vx, vy) da grade, tremido por um hash do próprio vértice.
        private static Vector2 Vertex(Island w, int vx, int vy) => new Vector2(
            vx * T + (Rng.Hash((int)w.seed, vx, vy, 1) / 4294967296f - 0.5f) * 9,
            vy * T + (Rng.Hash((int)w.seed, vx, vy, 2) / 4294967296f - 0.5f) * 9);

        // Rastro de lápis entre o centro de dois quadrados (o caminho feito).
        public static StrokeList Trail(int ax, int ay, int bx, int by, uint seed)
        {
            var r = new Rng(seed);
            var list = new StrokeList();
            var a = new Vector2(ax * T + T / 2, ay * T + T / 2 + 8);
            var b = new Vector2(bx * T + T / 2, by * T + T / 2 + 8);
            for (int i = 0; i < 4; i++)
            {
                float t1 = i / 4f + 0.04f, t2 = t1 + 0.13f;
                list.Add(Sketch.Line(r, Vector2.Lerp(a, b, t1), Vector2.Lerp(a, b, t2), Sketch.Pencil(Gray, 2, 0.8f, 0.6f)));
            }
            return list;
        }
    }
}
```

### 4.6 Menu: imprimir a ilha e uma masmorra

```csharp
// Caminho: Assets/_Project/Scripts/Editor/IslandTestMenu.cs
using System.Text;
using Caderno.Core;
using UnityEditor;
using UnityEngine;

namespace Caderno.EditorTools
{
    // POR QUE: conferir o gerador sem tela. O protótipo imprime o mesmo mapa
    // com o mesmo código de letras, então dá para comparar lado a lado.
    // ESTRATÉGIA: uma letra por quadrado: ~ água, . praia, , campo, T mata,
    // s pântano, M montanha, # parede, _ chão; F fogueira, D covil, m monstro,
    // $ baú, ? dica, ! missão, K masmorra, S saída, R rei (chefe).
    public static class IslandTestMenu
    {
        [MenuItem("Caderno/Imprimir ilha (semente 42)")]
        private static void Print()
        {
            var w = IslandGenerator.Generate(42);
            Debug.Log($"Semente usada {w.seed}, maxD {w.maxD}, {w.dungeons.Count} masmorras\n{Draw(w)}");
        }

        [MenuItem("Caderno/Imprimir masmorra 0 (semente 42)")]
        private static void PrintDungeon()
        {
            var w = IslandGenerator.Generate(42);
            var o = w.ObjAt(w.dungeons[0]);
            var d = IslandGenerator.Dungeon(w.seed, 0, o.kind, o.tier);
            Debug.Log($"Masmorra 0: {o.kind}, região {o.tier}\n{Draw(d)}");
        }

        private static string Draw(Island w)
        {
            const string ter = "~.,TsM#_";
            var sb = new StringBuilder();
            for (int y = 0; y < w.H; y++)
            {
                for (int x = 0; x < w.W; x++)
                {
                    var o = w.ObjAt(w.Index(x, y));
                    sb.Append(o == null ? ter[(int)w.t[w.Index(x, y)]] : o.type switch
                    {
                        ObjType.Fogueira => 'F', ObjType.Covil => 'D', ObjType.Monstro => 'm', ObjType.Bau => '$',
                        ObjType.Masmorra => 'K', ObjType.Saida => 'S', ObjType.Chefe => 'R', _ => o.quest ? '!' : '?',
                    });
                }
                sb.AppendLine();
            }
            return sb.ToString();
        }
    }
}
```

### ✅ Checkpoint da Fase 4
- **Caderno → Imprimir ilha (semente 42)** mostra uma ilha cercada de `~`, com 6 `F` (fogueiras, uma por região), 1 `D` no ponto mais longe, vários `m`, alguns `$`, 12 `K` (masmorras), 6 `!` e 9 `?`. Nenhum `!` ou `?` fica a menos de 5 quadrados de outro.
- A linha de cima diz **"Semente usada 7961, maxD 43, 12 masmorras"**: é o mesmo resultado do protótipo para a semente 42. Se for outro número, alguma conta do `Rng` ou do gerador está diferente da de `world.js`.
- **Caderno → Imprimir masmorra 0 (semente 42)** mostra o Poço do Rei Slime: 21 × 16, salas de `_` cercadas de `#`, uma `S` (escada) e um `R` (o chefe) na sala mais longe dela. É o mesmo interior do protótipo (`index.html?novo&seed=42&masmorra=0&revelar`).
- Compile sem erros com `TileArt` (o desenho dos quadrados aparece na Fase 5).

#### Problemas comuns
- **Semente diferente da do protótipo:** o suspeito mais comum é trocar `double` por `float` no `ValueNoise` ou no cálculo de `e`. Só a grade `g` é float; o resto é `double`.
- **`IndexOutOfRangeException` no `ValueNoise`:** o `+ 3` no tamanho da grade sumiu.
- **Ilha igual, mas masmorras ou personagens em outro lugar:** a ordem dos sorteios mudou. Depois dos baús vêm as fogueiras extras (região 1 a 6), depois as masmorras e por último os personagens; dentro da masmorra, cada sala sorteia `roll` e a posição sempre, mesmo quando não põe nada.

Próxima fase: **O mapa na folha**, onde o herói anda e o mestre desenha.

---

# Parte 8 — Implementação Unity: Fase 5 (O mapa na folha)

## Fase 5 — O mapa na folha

> Objetivo desta fase: a folha pautada, o mapa revelado aos poucos pela caneta do mestre, o herói andando com setas, WASD, toque ou clique, o rastro de lápis, a câmera seguindo, o relógio de dia e noite com a escuridão e a tocha, e a troca de mapa (ilha ou masmorra). Os eventos (fogueira, monstro, baú, masmorra...) chegam nas Fases 6 a 8.

### 5.1 Peças da tela: pauta, margem, caneta, caminho e escuridão

```csharp
// Caminho: Assets/_Project/Scripts/Game/MapParts.cs
using System.Collections.Generic;
using Caderno.Data;
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.Game
{
    // POR QUE: a pauta azul do caderno, que acompanha o mapa: cada quadrado
    // ocupa duas linhas (Parte 1, Estética).
    // ESTRATÉGIA: um elemento do tamanho da tela que redesenha as linhas
    // quando a câmera anda (OffsetY e Spacing vêm do MapView).
    public sealed class PaperBackground : VisualElement
    {
        public float OffsetY, Spacing = 32f;

        public PaperBackground()
        {
            pickingMode = PickingMode.Ignore;
            style.position = Position.Absolute;
            style.left = 0; style.top = 0; style.right = 0; style.bottom = 0;
            generateVisualContent += ctx =>
            {
                var p = ctx.painter2D;
                var r = contentRect;
                var c = Palette.Line; c.a = 0.8f;
                p.strokeColor = c; p.lineWidth = 1f;
                p.BeginPath();
                for (float y = Mathf.Repeat(OffsetY, Spacing); y < r.height; y += Spacing)
                {
                    p.MoveTo(new Vector2(0, y)); p.LineTo(new Vector2(r.width, y));
                }
                p.Stroke();
            };
        }
    }

    // POR QUE: a margem vermelha e os furos da espiral, fixos na tela.
    public sealed class NotebookMargin : VisualElement
    {
        public NotebookMargin(float width)
        {
            pickingMode = PickingMode.Ignore;
            style.position = Position.Absolute;
            style.left = 0; style.top = 0; style.bottom = 0; style.width = width;
            style.backgroundColor = Palette.Paper;
            style.borderRightWidth = 2; style.borderRightColor = Palette.Margin;
            generateVisualContent += ctx =>
            {
                var p = ctx.painter2D;
                p.fillColor = new Color(0.91f, 0.89f, 0.82f);
                p.strokeColor = new Color(0.17f, 0.18f, 0.27f, 0.25f);
                p.lineWidth = 1;
                for (float y = 70; y < contentRect.height; y += 110)
                {
                    p.BeginPath();
                    p.Arc(new Vector2(width / 2, y), width * 0.22f, Angle.Degrees(0f), Angle.Degrees(360f));
                    p.Fill(); p.Stroke();
                }
            };
        }
    }

    // POR QUE: a caneta do mestre na ponta do traço que está sendo desenhado,
    // com a cor da tinta (Parte 1, O mestre).
    // ESTRATÉGIA: desenhada em pé com a ponta em (0, 0); o MapView a move e
    // gira com translate/rotate (mexer nisso não refaz a geometria).
    public sealed class PenElement : VisualElement
    {
        private Color _color = Palette.Ink;

        public PenElement()
        {
            pickingMode = PickingMode.Ignore;
            style.position = Position.Absolute;
            style.width = 1; style.height = 1;
            style.transformOrigin = new TransformOrigin(0, 0, 0);
            style.rotate = new Rotate(Angle.Radians(0.55f));
            generateVisualContent += ctx =>
            {
                var p = ctx.painter2D;
                p.lineWidth = 1.4f; p.strokeColor = Palette.Ink;
                Quad(p, new Color(0.85f, 0.83f, 0.78f), new Vector2(0, 0), new Vector2(-4.5f, -11), new Vector2(4.5f, -11), null);
                Quad(p, _color, new Vector2(-5.5f, -52), new Vector2(5.5f, -52), new Vector2(5.5f, -11), new Vector2(-5.5f, -11));
                Quad(p, Palette.Ink, new Vector2(-6, -64), new Vector2(6, -64), new Vector2(6, -51), new Vector2(-6, -51));
            };
        }

        // Muda a cor da tinta (só repinta se mudou).
        public void SetColor(Color c)
        {
            if (c == _color) return;
            _color = c;
            MarkDirtyRepaint();
        }

        // Polígono de 3 ou 4 pontos, pintado e contornado.
        private static void Quad(Painter2D p, Color fill, Vector2 a, Vector2 b, Vector2 c, Vector2? d)
        {
            p.fillColor = fill;
            p.BeginPath(); p.MoveTo(a); p.LineTo(b); p.LineTo(c);
            if (d.HasValue) p.LineTo(d.Value);
            p.ClosePath(); p.Fill(); p.Stroke();
        }
    }

    // POR QUE: os pontinhos de lápis do caminho planejado (toque/clique).
    public sealed class PathDots : VisualElement
    {
        public readonly List<Vector2Int> Path = new List<Vector2Int>();

        public PathDots()
        {
            pickingMode = PickingMode.Ignore;
            style.position = Position.Absolute;
            generateVisualContent += ctx =>
            {
                var p = ctx.painter2D;
                p.fillColor = Palette.Gray;
                foreach (var c in Path)
                {
                    p.BeginPath();
                    p.Arc(new Vector2(c.x * 64 + 32, c.y * 64 + 40), 2.4f, Angle.Degrees(0f), Angle.Degrees(360f));
                    p.Fill();
                }
            };
        }
    }

    // POR QUE: a noite (e o escuro da masmorra) é o mestre pintando a folha
    // de azul-escuro com lápis, menos um círculo de luz em volta do herói
    // (Parte 1, Dia e noite).
    // ESTRATÉGIA: um elemento do tamanho da tela por cima do mapa. São 7
    // camadas de azul translúcido, cada uma com um buraco redondo (o
    // retângulo da tela menos um círculo, pintado com a regra par-ímpar),
    // de raio indo de R1 a R0: o meio fica claro e a borda escurece em
    // degraus, como lápis. Fora de R1, riscos diagonais de lápis.
    public sealed class DarkOverlay : VisualElement
    {
        public Vector2 Center;        // herói, em coordenadas da tela
        public float R0, R1, Alpha;   // raio da luz cheia, raio onde fica escuro, e o quanto escurece (0 a 1)

        private const int Rings = 7;
        private static readonly Color Night = new Color(0.118f, 0.133f, 0.33f);

        public DarkOverlay()
        {
            pickingMode = PickingMode.Ignore;
            style.position = Position.Absolute;
            style.left = 0; style.top = 0; style.right = 0; style.bottom = 0;
            generateVisualContent += ctx =>
            {
                if (Alpha <= 0.01f) return;
                var p = ctx.painter2D;
                var r = contentRect;
                // Alfa de cada camada para as 7 juntas darem 0,62 × Alpha.
                float a = 1f - Mathf.Pow(1f - 0.62f * Alpha, 1f / Rings);
                p.fillColor = new Color(Night.r, Night.g, Night.b, a);
                for (int i = 0; i < Rings; i++)
                {
                    float rad = Mathf.Lerp(R1, R0, i / (Rings - 1f));
                    p.BeginPath();
                    p.MoveTo(Vector2.zero); p.LineTo(new Vector2(r.width, 0)); p.LineTo(new Vector2(r.width, r.height)); p.LineTo(new Vector2(0, r.height));
                    p.ClosePath();
                    p.MoveTo(Center + new Vector2(rad, 0));
                    p.Arc(Center, rad, Angle.Degrees(0f), Angle.Degrees(360f));
                    p.ClosePath();
                    p.Fill(FillRule.OddEven);
                }
                // Riscos a 45° (descendo para a esquerda) que param na borda do círculo R1.
                p.strokeColor = new Color(0.08f, 0.086f, 0.235f, 0.55f * Alpha);
                p.lineWidth = 2f;
                p.BeginPath();
                for (float c = 0; c < r.width + r.height; c += 14f)
                {
                    // Ponto da reta: (c - t, t). Onde ela cruza o círculo: 2t² + 2t(b - a) + a² + b² - R1² = 0.
                    float ca = c - Center.x, cb = -Center.y;
                    float disc = (cb - ca) * (cb - ca) - 2f * (ca * ca + cb * cb - R1 * R1);
                    if (disc <= 0f) { Seg(p, c, 0f, r.height); continue; }
                    float sq = Mathf.Sqrt(disc), t1 = (ca - cb - sq) / 2f, t2 = (ca - cb + sq) / 2f;
                    Seg(p, c, 0f, Mathf.Min(t1, r.height));
                    Seg(p, c, Mathf.Max(t2, 0f), r.height);
                }
                p.Stroke();
            };
        }

        // Trecho da reta (c - t, t) entre t0 e t1.
        private static void Seg(Painter2D p, float c, float t0, float t1)
        {
            if (t1 <= t0) return;
            p.MoveTo(new Vector2(c - t0, t0));
            p.LineTo(new Vector2(c - t1, t1));
        }
    }
}
```

### 5.2 `MapView`: o mapa na tela

```csharp
// Caminho: Assets/_Project/Scripts/Game/MapView.cs
using System.Collections.Generic;
using Caderno.Core;
using Caderno.Data;
using Caderno.Sketch;
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.Game
{
    // POR QUE: mostra o mapa (a ilha ou uma masmorra) do jeito do caderno:
    // só o que já foi revelado, com o mestre desenhando cada quadrado novo
    // aos poucos, e o azul da noite por cima.
    // ESTRATÉGIA:
    // - `_world` contém tudo o que é do mapa, em unidades do mundo (64 por
    //   quadrado). A câmera é só translate + scale nele.
    // - Cada quadrado revelado é um SketchElement desenhado uma vez. Enquanto
    //   o mestre desenha, ele entra na lista _anims e o Progress sobe a cada
    //   quadro; ao terminar, nunca mais é repintado.
    // - O rastro e os "X" ficam numa camada por cima dos quadrados.
    // - A escuridão (DarkOverlay) fica por cima do mapa e embaixo da margem.
    public sealed class MapView
    {
        public const float T = TileArt.T;

        private sealed class Anim { public SketchElement el; public float t0, dur; }

        public readonly VisualElement Root;
        private readonly PaperBackground _paper;
        private readonly VisualElement _world, _tiles, _marks;
        private readonly PathDots _dots;
        private readonly SketchElement _hero;
        private readonly PenElement _pen;
        private readonly DarkOverlay _dark;
        private Vector2 _darkCenter;      // herói, em quadrados
        private float _darkR0, _darkR1;   // raios da luz, em quadrados
        private readonly Font _titleFont;
        private readonly List<Anim> _anims = new List<Anim>();
        private Island _w;
        private MapState _st;
        private RunState _run;

        public Vector2 Cam;          // ponto do mundo no centro da tela
        public float Zoom = 1f;
        public bool Drawing => _anims.Count > 0;   // o mestre está desenhando (som de rabisco)

        public MapView(VisualElement parent, Font titleFont)
        {
            _titleFont = titleFont;
            Root = new VisualElement { name = "map" };
            Root.style.position = Position.Absolute;
            Root.style.left = 0; Root.style.top = 0; Root.style.right = 0; Root.style.bottom = 0;
            Root.style.overflow = Overflow.Hidden;
            parent.Add(Root);

            _paper = new PaperBackground();
            Root.Add(_paper);

            _world = new VisualElement { pickingMode = PickingMode.Ignore, usageHints = UsageHints.DynamicTransform };
            _world.style.position = Position.Absolute;
            _world.style.transformOrigin = new TransformOrigin(0, 0, 0);
            Root.Add(_world);

            _tiles = Layer(); _marks = Layer();
            _dots = new PathDots(); _world.Add(_dots);
            _hero = new SketchElement(PeopleArt.Hero(0)) { usageHints = UsageHints.DynamicTransform };
            _hero.style.position = Position.Absolute;
            _hero.style.width = 50; _hero.style.height = 50;
            _world.Add(_hero);
            _pen = new PenElement { usageHints = UsageHints.DynamicTransform };
            _world.Add(_pen);

            _dark = new DarkOverlay();
            Root.Add(_dark);
            Root.Add(new NotebookMargin(40));
        }

        // Camada vazia do tamanho do mundo.
        private VisualElement Layer()
        {
            var l = new VisualElement { pickingMode = PickingMode.Ignore };
            l.style.position = Position.Absolute;
            _world.Add(l);
            return l;
        }

        // Começa um mapa (a ilha ou uma masmorra): apaga tudo o que estava desenhado.
        public void Reset(Island w, MapState st, RunState run)
        {
            _w = w; _st = st; _run = run;
            _world.style.width = w.W * T; _world.style.height = w.H * T;
            _tiles.Clear(); _marks.Clear(); _anims.Clear();
            _dots.Path.Clear(); _dots.MarkDirtyRepaint();
        }

        // Revela os quadrados com distância² até r2 em volta de (px, py), do
        // mais perto para o mais longe, um a cada 70 ms (ou tudo de uma vez).
        // De dia r2 = 6,8 (raio ~2,6); no escuro é menor (Parte 1, Dia e noite).
        public void RevealAround(int px, int py, bool instant, float r2 = 6.8f)
        {
            var found = new List<Vector3Int>();
            for (int dy = -3; dy <= 3; dy++)
                for (int dx = -3; dx <= 3; dx++)
                {
                    int x = px + dx, y = py + dy, d = dx * dx + dy * dy;
                    if (d > r2 || !_w.InBounds(x, y) || _st.revealed[_w.Index(x, y)]) continue;
                    _st.revealed[_w.Index(x, y)] = true;
                    found.Add(new Vector3Int(x, y, d * 10 + Random.Range(0, 5)));
                }
            found.Sort((a, b) => a.z.CompareTo(b.z));
            for (int i = 0; i < found.Count; i++) AddTile(found[i].x, found[i].y, instant ? -1f : i * 0.07f);
        }

        // Cria o elemento de um quadrado. delay < 0 = desenhado na hora.
        private void AddTile(int tx, int ty, float delay)
        {
            var drawing = TileArt.Build(_w, tx, ty, _st, _run);
            var el = new SketchElement(drawing.strokes) { FixedScale = 1f, Origin = new Vector2(tx * T, ty * T) };
            el.style.position = Position.Absolute;
            el.style.left = tx * T; el.style.top = ty * T;
            el.style.width = T; el.style.height = T;
            if (drawing.label != null) el.Add(MakeLabel(drawing));
            _tiles.Add(el);
            if (delay >= 0f) Animate(el, delay, 1f);
        }

        // Nome da fogueira/covil/masmorra escrito em cima do quadrado (aparece com o desenho).
        private Label MakeLabel(TileDrawing d)
        {
            var label = new Label(d.label) { pickingMode = PickingMode.Ignore };
            label.style.position = Position.Absolute;
            label.style.left = -68; label.style.width = T + 136; label.style.top = -26;
            label.style.unityTextAlign = TextAnchor.MiddleCenter;
            label.style.unityFontDefinition = new StyleFontDefinition(_titleFont);
            label.style.fontSize = 19;
            label.style.color = d.labelColor;
            return label;
        }

        // Põe um desenho na fila da caneta. A duração cresce com o comprimento
        // dos traços (igual ao protótipo: 0,26 s + 0,42 ms por unidade, até 1,1 s a mais).
        private void Animate(SketchElement el, float delay, float speed)
        {
            el.Progress = 0f;
            float dur = (0.26f + Mathf.Min(1.1f, el.Strokes.TotalLength * 0.00042f)) / speed;
            _anims.Add(new Anim { el = el, t0 = Time.time + delay, dur = dur });
        }

        // Rastro, "X" e outras marcas por cima dos quadrados.
        public void AddMark(StrokeList strokes, bool instant, float speed = 1f)
        {
            var el = new SketchElement(strokes) { FixedScale = 1f };
            el.style.position = Position.Absolute;
            _marks.Add(el);
            if (!instant) Animate(el, 0f, speed);
        }

        // Redesenha de uma vez tudo o que já foi revelado (ao carregar o save).
        public void RebuildAll()
        {
            _tiles.Clear(); _marks.Clear(); _anims.Clear();
            for (int i = 0; i < _st.revealed.Length; i++)
                if (_st.revealed[i]) AddTile(i % _w.W, i / _w.W, -1f);
            foreach (long key in _st.trail)
            {
                int a = (int)(key / 100000), b = (int)(key % 100000);
                AddMark(TileArt.Trail(a % _w.W, a / _w.W, b % _w.W, b / _w.W, Rng.Hash((int)_w.seed, a, b)), true);
            }
        }

        // Atualiza o herói: posição em quadrados (fracionária durante o passo),
        // lado para onde olha e pose de andar.
        public void SetHero(Vector2 tilePos, int face, float walkT, bool walking)
        {
            float bob = walking ? -Mathf.Abs(Mathf.Sin(walkT * Mathf.PI)) * 5f : Mathf.Sin(Time.time * 2.5f) * 1.2f;
            var center = tilePos * T + new Vector2(T / 2, T / 2);
            _hero.style.translate = new Translate(center.x - 25, center.y - 30 + bob);
            _hero.style.scale = new Scale(new Vector3(face, 1, 1));
            var frame = PeopleArt.Hero(walking && walkT > 0.5f ? 1 : 0);
            if (_hero.Strokes != frame) _hero.SetStrokes(frame);
        }

        // Escuridão da vez: alpha de 0 (dia) a 1, luz em volta de `heroTile`
        // (posição em quadrados) com raios r0 (luz cheia) e r1 (já escuro), em quadrados.
        public void SetDark(float alpha, Vector2 heroTile, float r0, float r1)
        {
            _dark.Alpha = alpha;
            _darkCenter = heroTile; _darkR0 = r0; _darkR1 = r1;
        }

        // Mostra (ou apaga) o caminho planejado.
        public void SetPath(List<Vector2Int> path)
        {
            _dots.Path.Clear();
            _dots.Path.AddRange(path);
            _dots.MarkDirtyRepaint();
        }

        // Avança as animações e aplica a câmera. Chame uma vez por quadro.
        public void Tick()
        {
            float now = Time.time;
            SketchElement penOn = null;
            for (int i = _anims.Count - 1; i >= 0; i--)
            {
                var a = _anims[i];
                if (now < a.t0) continue;
                float p = (now - a.t0) / a.dur;
                a.el.SetProgress(p);
                if (p >= 1f) { _anims.RemoveAt(i); continue; }
                if (penOn == null && a.el.HasHead) penOn = a.el;
            }
            _pen.style.display = penOn != null ? DisplayStyle.Flex : DisplayStyle.None;
            if (penOn != null)
            {
                _pen.style.translate = new Translate(penOn.Head.x, penOn.Head.y);
                _pen.SetColor(penOn.HeadColor);
            }

            var view = Root.contentRect.size;
            var origin = view / 2f - Cam * Zoom;
            _world.style.translate = new Translate(origin.x, origin.y);
            _world.style.scale = new Scale(new Vector3(Zoom, Zoom, 1));
            _paper.Spacing = 32f * Zoom;
            _paper.OffsetY = origin.y;
            _paper.MarkDirtyRepaint();
            _dark.style.display = _dark.Alpha > 0.01f ? DisplayStyle.Flex : DisplayStyle.None;
            if (_dark.Alpha > 0.01f)
            {
                _dark.Center = origin + (_darkCenter * T + new Vector2(T / 2, T / 2)) * Zoom;
                _dark.R0 = _darkR0 * T * Zoom; _dark.R1 = _darkR1 * T * Zoom;
                _dark.MarkDirtyRepaint();
            }
        }

        // Ponto da tela (coordenadas do painel) → quadrado do mapa.
        public Vector2Int ScreenToTile(Vector2 panelPos)
        {
            var view = Root.contentRect.size;
            var world = (panelPos - (view / 2f - Cam * Zoom)) / Zoom;
            return new Vector2Int(Mathf.FloorToInt(world.x / T), Mathf.FloorToInt(world.y / T));
        }

        public Vector2 ViewSize => Root.contentRect.size;
    }
}
```

Um detalhe sobre a ponta da caneta: `SketchElement.Head` vem em coordenadas do desenho, e os traços do mapa estão em coordenadas do mundo. Então `Head` já é a posição da caneta dentro de `_world`.

A escuridão fica fora de `_world`, em coordenadas da tela: o `Tick` converte a posição do herói e os raios da luz (em quadrados) usando a mesma câmera do mapa.

### 5.3 `GameController`: andar pela ilha (e pelas masmorras)

O `GameController` é `partial`: a mesma classe dividida em 8 arquivos, um ou mais por fase. Os métodos que só existem em fases futuras são declarados aqui como `partial void` sem corpo. O compilador simplesmente apaga as chamadas a eles enquanto ninguém os implementa, então o jogo compila e roda a cada fase.

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameController.cs
using System.Collections.Generic;
using Caderno.Core;
using Caderno.Data;
using Caderno.Sketch;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UIElements;

namespace Caderno.Game
{
    // POR QUE: o "mestre" do jogo. Liga entrada, mapa, regras e telas, como o
    // game.js do protótipo.
    // ESTRATÉGIA: um MonoBehaviour só na cena, dividido em partes (partial):
    // este arquivo cuida da aventura, do movimento, do relógio e da tocha;
    // Ui (Fase 6), Combat e Events (Fase 7), Places, Dungeons e Quests
    // (Fase 8) e Save (Fase 9) completam a classe.
    // W é sempre a ilha; M é o mapa onde o herói está (a ilha ou uma
    // masmorra) e L, o que já aconteceu nele.
    public partial class GameController : MonoBehaviour
    {
        [SerializeField] private UIDocument _doc;
        [SerializeField] private GameDatabase _db;
        [SerializeField] private StyleSheet _style;
        [SerializeField] private Font _titleFont;
        [SerializeField] private float _stepTime = 0.16f;

        private Island W, M;
        private PlayerState P;
        private RunState G;
        private MapState L;
        private readonly Dictionary<int, Island> _dungeonMaps = new Dictionary<int, Island>();
        private float _darkV;   // escuridão mostrada agora (desliza até a do relógio)

        private const int TochaPassos = 40, TochaPreco = 5;
        private MapView _map;
        private VisualElement _root;
        private readonly System.Random _dice = new System.Random();

        // Movimento: o passo em andamento, o caminho planejado, a direção
        // segurada (teclado ou direcional) e um toque rápido guardado.
        private bool _walking;
        private Vector2Int _from, _to;
        private float _walkT;
        private readonly List<Vector2Int> _path = new List<Vector2Int>();
        private Vector2Int _touchDir, _tap;
        private int _face = 1;
        private bool _overview, _panelOpen;
        private float _warnedAt = -10f;

        private static readonly Vector2Int Up = new Vector2Int(0, -1), Down = new Vector2Int(0, 1);

        // Ganchos das próximas fases (sem corpo até lá).
        partial void BuildUi(VisualElement root);
        partial void UpdateHud();
        partial void Narrate(string text);
        partial void PlaySfx(string name);
        partial void OnPanelKeys();
        partial void ShowTitle(ref bool shown);
        partial void SaveGame();
        partial void MeetMonster(int index, MapObject o);
        partial void MeetBoss(int index, MapObject o);
        partial void Talk(int index, MapObject o);
        partial void EnterLair(int index);
        partial void EnterCamp(int index, MapObject o);
        partial void OpenChest(int index, MapObject o);
        partial void Ambush(int tier);
        partial void OpenBag();
        partial void EnterDungeon(int index, MapObject o);
        partial void LeaveDungeon();
        partial void QuestPing();
        partial void QuestLines(List<(string text, bool done)> lines);

        private void Start()
        {
            _root = _doc.rootVisualElement;
            if (_style != null) _root.styleSheets.Add(_style);
            _root.AddToClassList("caderno");
            _map = new MapView(_root, _titleFont);
            _map.Root.RegisterCallback<PointerDownEvent>(OnMapPointer);
            BuildDpad();
            BuildUi(_root);
            bool shown = false;
            ShowTitle(ref shown);
            if (!shown) NewRun("Herói", (uint)Random.Range(1, int.MaxValue));
        }

        // Começa uma aventura nova numa ilha nova.
        private void NewRun(string nome, uint seed)
        {
            W = IslandGenerator.Generate(seed);
            _dungeonMaps.Clear();
            G = new RunState();
            P = PlayerState.New(nome, W.start, W.W);
            SetMap(-1);
            _map.RevealAround(P.x, P.y, false, RevealRadius2());
            SnapCamera();
            Narrate($"Era uma vez {nome}, que acordou ao lado de uma fogueira no {Texts.Fogueiras[0]}. O mestre destampa as canetas...");
            UpdateHud();
            SaveGame();
        }

        // Câmera direto no herói, sem deslizar (início, ao desmaiar e ao trocar de mapa).
        private void SnapCamera()
        {
            _map.Cam = new Vector2(P.x * MapView.T + 32, P.y * MapView.T + 52);
            _map.Zoom = BaseZoom();
            _darkV = TargetDark();
        }

        // ---------- mapa atual ----------

        // Interior da masmorra n (gerado na primeira vez e guardado).
        private Island DungeonMap(int n)
        {
            if (!_dungeonMaps.TryGetValue(n, out var map))
            {
                var o = W.ObjAt(W.dungeons[n]);
                _dungeonMaps[n] = map = IslandGenerator.Dungeon(W.seed, n, o.kind, o.tier);
            }
            return map;
        }

        // Troca o mapa atual: -1 = a ilha; n = a masmorra n. O mestre "vira a
        // página": tudo some e o que já foi revelado do outro mapa é redesenhado.
        // Monstros vencidos voltam (descanso na fogueira e desmaio), na ilha e
        // nas masmorras; o chefe vencido continua vencido. Redesenha o mapa
        // atual para o mestre "apagar os X com a borracha".
        private void RespawnMonsters()
        {
            G.island.dead.Clear();
            foreach (var kv in G.dungeons)
            {
                var map = DungeonMap(kv.Key);
                kv.Value.dead.RemoveWhere(i => map.ObjAt(i).type != ObjType.Chefe);
            }
            _map.RebuildAll();
        }

        private void SetMap(int n)
        {
            P.onde = n;
            M = n < 0 ? W : DungeonMap(n);
            L = n < 0 ? G.island : G.Dungeon(n, M.Size);
            _walking = false;
            ClearPath();
            _map.Reset(M, L, G);
            _map.RebuildAll();
        }

        // ---------- dia, noite e tocha ----------

        private bool InDungeon => P.onde >= 0;
        private bool IsDark => InDungeon || G.IsNight;
        private bool Lit => IsDark && P.tocha > 0;
        private bool NightBonus => G.IsNight && !InDungeon;   // monstro mais forte (Fase 7)

        // Distância² do que o mestre desenha: dia 6,8; escuro com tocha 5; sem tocha 2.
        private float RevealRadius2() => !IsDark ? 6.8f : Lit ? 5f : 2f;

        // Escuridão que a tela deve ter agora: masmorra 0,9; ilha conforme o relógio.
        private float TargetDark() => InDungeon ? 0.9f : G.Darkness * 0.85f;

        // No escuro, cada passo gasta a tocha acesa; quando ela acaba, acende a
        // próxima sozinha. step = false só acende (ao descer na masmorra).
        private void BurnTorch(bool step)
        {
            if (!IsDark) return;
            bool burnedOut = false;
            if (step && P.tocha > 0) { P.tocha--; burnedOut = P.tocha == 0; }
            if (P.tocha <= 0 && P.tochas > 0)
            {
                P.tochas--; P.tocha = TochaPassos;
                Narrate(burnedOut ? "A tocha apagou e você acende outra." : "Você acende uma tocha. O mestre pinta um círculo de luz amarela.");
            }
            else if (burnedOut) Narrate("A tocha apagou! Sem tocha, você mal enxerga.");
        }

        // Desktop vê ~12 quadrados de largura; celular em pé, ~6,5.
        private float BaseZoom()
        {
            var v = _map.ViewSize;
            if (v.x <= 0) return 1f;
            float across = v.x < v.y ? 6.5f : 12f;
            return Mathf.Clamp(Mathf.Min(v.x / (MapView.T * across), v.y / (MapView.T * 8.5f)), 0.55f, 1.35f);
        }

        // Zoom para ver o mapa inteiro.
        private float OverviewZoom()
        {
            var v = _map.ViewSize;
            return Mathf.Min(v.x / (M.W * MapView.T), v.y / (M.H * MapView.T)) * 0.96f;
        }

        private void Update()
        {
            if (W == null) return;
            ReadKeys();
            if (_walking)
            {
                _walkT += Time.deltaTime / _stepTime;
                if (_walkT >= 1f)
                {
                    _walking = false;
                    P.x = _to.x; P.y = _to.y;
                    Arrive(_from);
                }
            }
            else if (!_panelOpen)
            {
                var dir = _tap != Vector2Int.zero ? _tap : HeldDir();
                _tap = Vector2Int.zero;
                if (_path.Count > 0) { var next = _path[0]; _path.RemoveAt(0); _map.SetPath(_path); StepTo(next); }
                else if (dir != Vector2Int.zero) StepTo(new Vector2Int(P.x, P.y) + dir);
            }

            // Herói e câmera (desliza até o alvo).
            var hero = HeroPos();
            _map.SetHero(hero, _face, _walkT, _walking);
            var target = _overview ? new Vector2(M.W * MapView.T / 2, M.H * MapView.T / 2)
                                   : hero * MapView.T + new Vector2(32, 52);
            float k = Mathf.Min(1f, Time.deltaTime * 5f);
            _map.Cam = Vector2.Lerp(_map.Cam, target, k);
            _map.Zoom = Mathf.Lerp(_map.Zoom, _overview ? OverviewZoom() : BaseZoom(), k);

            // Escuridão: desliza até a do relógio; a luz da tocha treme como fogo.
            _darkV = Mathf.Lerp(_darkV, TargetDark(), Mathf.Min(1f, Time.deltaTime * 2f));
            float flicker = Lit ? 1f + Mathf.Sin(Time.time * 11f) * 0.05f + Mathf.Sin(Time.time * 27f) * 0.03f : 1f;
            _map.SetDark(_overview ? 0f : _darkV, hero, Lit ? 1.9f : 0.55f, (Lit ? 3.3f : 1.5f) * flicker);
            _map.Tick();
            if (_map.Drawing) PlaySfx("scribble");
        }

        // Posição do herói em quadrados, fracionária durante o passo (com suavização).
        private Vector2 HeroPos()
        {
            if (!_walking) return new Vector2(P.x, P.y);
            float e = _walkT * _walkT * (3 - 2 * _walkT);
            return Vector2.Lerp(_from, _to, e);
        }

        // ---------- entrada ----------

        // Teclas da vez: toque rápido, mochila, mapa e atalhos das folhas.
        private void ReadKeys()
        {
            var kb = Keyboard.current;
            if (kb == null) return;
            if (_panelOpen) { OnPanelKeys(); return; }
            if (!_walking)
            {
                if (kb.upArrowKey.wasPressedThisFrame || kb.wKey.wasPressedThisFrame) _tap = Up;
                if (kb.downArrowKey.wasPressedThisFrame || kb.sKey.wasPressedThisFrame) _tap = Down;
                if (kb.leftArrowKey.wasPressedThisFrame || kb.aKey.wasPressedThisFrame) _tap = Vector2Int.left;
                if (kb.rightArrowKey.wasPressedThisFrame || kb.dKey.wasPressedThisFrame) _tap = Vector2Int.right;
            }
            if (_tap != Vector2Int.zero) ClearPath();
            if (kb.bKey.wasPressedThisFrame || kb.iKey.wasPressedThisFrame) OpenBag();
            if (kb.mKey.wasPressedThisFrame) _overview = !_overview;
        }

        // Direção segurada agora (teclado ou direcional da tela).
        private Vector2Int HeldDir()
        {
            if (_touchDir != Vector2Int.zero) return _touchDir;
            var kb = Keyboard.current;
            if (kb == null) return Vector2Int.zero;
            if (kb.upArrowKey.isPressed || kb.wKey.isPressed) return Up;
            if (kb.downArrowKey.isPressed || kb.sKey.isPressed) return Down;
            if (kb.leftArrowKey.isPressed || kb.aKey.isPressed) return Vector2Int.left;
            if (kb.rightArrowKey.isPressed || kb.dKey.isPressed) return Vector2Int.right;
            return Vector2Int.zero;
        }

        // Clique/toque num quadrado já desenhado: anda até lá pelo caminho mais curto.
        private void OnMapPointer(PointerDownEvent e)
        {
            if (_panelOpen || W == null) return;
            if (_overview) { _overview = false; return; }
            var t = _map.ScreenToTile(e.localPosition);
            if (!M.InBounds(t.x, t.y)) return;
            if (!L.revealed[M.Index(t.x, t.y)]) { Narrate("O mestre ainda não desenhou aí. Chegue mais perto!"); return; }
            var path = FindPath(t);
            if (path != null) { _path.Clear(); _path.AddRange(path); _map.SetPath(_path); }
            else if (t != new Vector2Int(P.x, P.y)) Narrate("Não tem caminho até lá.");
        }

        // Direcional na tela, só em aparelhos de toque.
        private void BuildDpad()
        {
            if (Touchscreen.current == null && !Application.isMobilePlatform) return;
            var pad = new VisualElement();
            pad.AddToClassList("dpad");
            (string text, Vector2Int dir, string cls)[] keys =
                { ("▲", Up, "up"), ("◀", Vector2Int.left, "left"), ("▶", Vector2Int.right, "right"), ("▼", Down, "down") };
            foreach (var (text, dir, cls) in keys)
            {
                var b = new Button { text = text };
                b.AddToClassList(cls);
                b.RegisterCallback<PointerDownEvent>(_ => { _touchDir = dir; ClearPath(); }, TrickleDown.TrickleDown);
                b.RegisterCallback<PointerUpEvent>(_ => _touchDir = Vector2Int.zero);
                b.RegisterCallback<PointerLeaveEvent>(_ => _touchDir = Vector2Int.zero);
                pad.Add(b);
            }
            _root.Add(pad);
        }

        private void ClearPath()
        {
            _path.Clear();
            _map.SetPath(_path);
        }

        // ---------- movimento ----------

        // Quadrado que não deixa passar: monstro ou chefe vivo, personagem, covil com dragão.
        private bool Blocking(int i)
        {
            var o = M.ObjAt(i);
            return o != null && (((o.type == ObjType.Monstro || o.type == ObjType.Chefe) && !L.dead.Contains(i))
                || o.type == ObjType.Npc || (o.type == ObjType.Covil && !G.won));
        }

        // Tenta dar um passo até `to`: abre o encontro, avisa do bloqueio ou anda.
        private void StepTo(Vector2Int to)
        {
            if (!M.InBounds(to.x, to.y)) return;
            if (to.x != P.x) _face = to.x > P.x ? 1 : -1;
            int i = M.Index(to.x, to.y);
            var o = M.ObjAt(i);
            if (Blocking(i))
            {
                ClearPath(); _touchDir = Vector2Int.zero;
                if (o.type == ObjType.Monstro) MeetMonster(i, o);
                else if (o.type == ObjType.Chefe) MeetBoss(i, o);
                else if (o.type == ObjType.Npc) Talk(i, o);
                else EnterLair(i);
                return;
            }
            if (!Island.Passable(M.t[i]))
            {
                ClearPath();
                if (Time.time - _warnedAt > 2.5f)
                {
                    _warnedAt = Time.time;
                    Narrate(M.t[i] == TileType.Agua ? "Aí é água! Sem barco, nada feito."
                        : M.t[i] == TileType.Parede ? "Parede de pedra." : "Montanha íngreme demais. Dá a volta.");
                }
                return;
            }
            _from = new Vector2Int(P.x, P.y); _to = to; _walkT = 0f; _walking = true;
            PlaySfx("step");
        }

        // Chegou num quadrado: relógio, tocha, rastro, revelação, narração e eventos.
        private void Arrive(Vector2Int from)
        {
            G.steps++;
            bool wasNight = G.IsNight;
            G.Tick();
            BurnTorch(true);
            int a = M.Index(from.x, from.y), b = M.Index(P.x, P.y);
            if (L.trail.Add(RunState.TrailKey(a, b)))
                _map.AddMark(TileArt.Trail(from.x, from.y, P.x, P.y, Rng.Hash((int)M.seed, Mathf.Min(a, b), Mathf.Max(a, b))), false, 2.5f);
            _map.RevealAround(P.x, P.y, false, RevealRadius2());

            var t = M.t[b];
            int tier = M.tier[b];
            var o = M.ObjAt(b);
            if (!InDungeon)
            {
                string terrainText = Texts.Terreno(t);
                if (terrainText != null && G.seen.Add("t" + (int)t)) Narrate(terrainText);
                else if (Texts.Regiao.TryGetValue(tier, out var regionText) && G.seen.Add("r" + tier)) Narrate(regionText);
                if (!wasNight && G.IsNight)
                    Narrate(P.tocha > 0 ? "Anoiteceu. O mestre pinta a folha de azul-escuro; sua tocha ilumina em volta. Os monstros ficam mais fortes."
                        : "Anoiteceu! O mestre pinta a folha de azul-escuro. Sem tocha, você mal enxerga, e os monstros ficam mais fortes.");
                else if (wasNight && !G.IsNight) Narrate($"Amanheceu! Dia {G.day + (G.clock > 90 ? 1 : 0)}. O mestre apaga o azul com a borracha.");
            }

            if (o != null && o.type == ObjType.Fogueira) { StopMoving(); EnterCamp(b, o); }
            else if (o != null && o.type == ObjType.Masmorra) { StopMoving(); EnterDungeon(b, o); }
            else if (o != null && o.type == ObjType.Saida) { StopMoving(); LeaveDungeon(); }
            else if (o != null && o.type == ObjType.Bau && !L.opened.Contains(b)) { StopMoving(); OpenChest(b, o); }
            else if (o == null && !InDungeon && G.steps > 6 && !NearCamp(P.x, P.y))
            {
                float chance = t switch { TileType.Areia => 0.04f, TileType.Campo => 0.05f, TileType.Mata => 0.085f, TileType.Pantano => 0.095f, _ => 0f };
                if (G.IsNight) chance *= 1.5f;   // à noite aparece mais bicho
                if (Random.value < chance) { StopMoving(); Ambush(tier); }
            }
            UpdateHud();
            SaveGame();
        }

        private void StopMoving()
        {
            ClearPath();
            _touchDir = Vector2Int.zero;
        }

        // Até 2 quadrados de alguma fogueira (lá não tem encontro surpresa).
        private bool NearCamp(int x, int y)
        {
            foreach (int v in M.camps)
                if (Mathf.Abs(v % M.W - x) <= 2 && Mathf.Abs(v / M.W - y) <= 2) return true;
            return false;
        }

        // Busca em largura pelos quadrados já desenhados; o destino pode ser
        // um monstro ou personagem (o passo final abre o encontro).
        private List<Vector2Int> FindPath(Vector2Int goalTile)
        {
            int goal = M.Index(goalTile.x, goalTile.y), start = M.Index(P.x, P.y);
            if (goal == start) return null;
            var prev = new int[M.Size];
            for (int i = 0; i < prev.Length; i++) prev[i] = -1;
            prev[start] = start;
            var q = new List<int> { start };
            int[] dx = { 1, -1, 0, 0 }, dy = { 0, 0, 1, -1 };
            for (int h = 0; h < q.Count && prev[goal] < 0; h++)
            {
                int i = q[h], x = i % M.W, y = i / M.W;
                for (int d = 0; d < 4; d++)
                {
                    int nx = x + dx[d], ny = y + dy[d];
                    if (!M.InBounds(nx, ny)) continue;
                    int j = M.Index(nx, ny);
                    if (prev[j] >= 0 || !L.revealed[j]) continue;
                    if (j != goal && (!Island.Passable(M.t[j]) || Blocking(j))) continue;
                    prev[j] = i; q.Add(j);
                }
            }
            if (prev[goal] < 0) return null;
            var path = new List<Vector2Int>();
            for (int i = goal; i != start; i = prev[i]) path.Insert(0, new Vector2Int(i % M.W, i / M.W));
            return path;
        }
    }
}
```

### 5.4 Montar a cena

1. Remova `SketchTest`/`ArtGallery` do GameObject `Caderno` e adicione **Game Controller**.
2. Ligue os campos: **Doc** = o UI Document, **Db** = `GameDatabase.asset`, **Style** = `Caderno.uss`, **Title Font** = `Caveat-Bold` (os nomes no mapa; o resto da letra vem do USS).

### ✅ Checkpoint da Fase 5
- No Play, aparece a folha pautada com a margem vermelha, e o mestre desenha a fogueira inicial e os quadrados em volta, um a um, com a caneta colorida na ponta do traço.
- Setas/WASD andam um quadrado; segurar anda sem parar. Cada passo revela quadrados novos e deixa um tracejado de lápis.
- Clicar num quadrado desenhado mostra pontinhos do caminho e o herói vai sozinho.
- **M** afasta a câmera para a ilha inteira; **M** de novo volta.
- Água e montanha não deixam passar. Ainda não aparece aviso, porque a narração vem na Fase 6. Monstros e personagens bloqueiam o caminho, mas ainda não abrem nada.
- Depois de uns 55 passos, a folha começa a escurecer: aparece o azul com riscos de lápis e um círculo de luz em volta do herói. A primeira tocha acende sozinha (ainda sem aviso), a luz treme e o mestre desenha num raio menor. Uns 30 passos depois, clareia de novo.
- Andar com a tocha acesa no escuro gasta um passo dela; sem tochas, o círculo de luz fica bem pequeno e o mestre só desenha os vizinhos.

#### Problemas comuns
- **O mapa não aparece, só a pauta:** o `MapView` foi criado antes do painel ter tamanho, e `BaseZoom` deu 1 com `ViewSize` zero. Ele corrige sozinho no quadro seguinte, porque o `Update` recalcula o zoom.
- **A caneta fica parada num canto:** `Head` só vale enquanto `Progress < 1`; confira o `if (penOn == null && a.el.HasHead)`.
- **Clique cai no quadrado errado:** o clique precisa usar `e.localPosition` no `_map.Root`, que ocupa a tela toda.
- **Fica lento depois de revelar muito:** veja "Desempenho" na Fase 10.
- **A escuridão não tem buraco (fica tudo azul):** a luz precisa de `Fill(FillRule.OddEven)`; com a regra padrão, o círculo é pintado junto com o retângulo.

Próxima fase: **Folhas, HUD e o mestre**, a interface de caderno.

---

# Parte 9 — Implementação Unity: Fase 6 (Folhas, HUD e o mestre)

## Fase 6 — Folhas, HUD e o mestre

> Objetivo desta fase: a interface de caderno. HUD com vida, magia, moedas, dados, hora do dia, tochas e a caixinha de missões; o balão "Mestre:"; folhas pautadas por cima do mapa com botões pintados a lápis; e o som sintetizado. Traduz `style.css` e a parte de painéis de `game.js`.

### 6.1 `Caderno.uss`: o estilo

USS é o "CSS do Unity": as mesmas ideias (classes, cores, bordas, flex), com alguns nomes próprios (`-unity-font`). A borda "de mão" vem de raios de canto diferentes em cada canto.

```css
/* Caminho: Assets/_Project/UI/Caderno.uss */
.caderno { -unity-font: url("../Fonts/PatrickHand-Regular.ttf"); -unity-font-definition: initial; font-size: 19px; color: rgb(43, 47, 69); }
.title-font { -unity-font: url("../Fonts/Caveat-Bold.ttf"); -unity-font-definition: initial; }

/* ---------- HUD ---------- */
.hud { position: absolute; top: 8px; left: 50px; right: 8px; flex-direction: row; justify-content: space-between; align-items: flex-start; }
.stats { flex-direction: row; flex-wrap: wrap; align-items: center; flex-shrink: 1; background-color: rgba(251, 247, 236, 0.92);
  padding: 2px 12px; border-width: 2px; border-color: rgb(43, 47, 69);
  border-top-left-radius: 14px; border-top-right-radius: 4px; border-bottom-right-radius: 12px; border-bottom-left-radius: 5px; font-size: 21px; }
.stat { flex-direction: row; align-items: center; margin-right: 12px; }
.icon { width: 28px; height: 28px; }
.xp { width: 64px; height: 11px; margin-left: 6px; border-width: 2px; border-color: rgb(43, 47, 69); border-radius: 6px; overflow: hidden; }
.xp-fill { height: 100%; width: 0; background-color: rgb(132, 72, 196); }
.tools { flex-direction: row; }
.hud-left { flex-direction: column; align-items: flex-start; flex-shrink: 1; }
.quests { margin-top: 6px; padding: 2px 12px 4px; max-width: 420px; font-size: 17px; background-color: rgba(251, 247, 236, 0.92);
  border-width: 2px; border-color: rgb(43, 47, 69);
  border-top-left-radius: 14px; border-top-right-radius: 4px; border-bottom-right-radius: 12px; border-bottom-left-radius: 5px; }
.quests-title { font-size: 22px; color: rgb(47, 102, 201); }
.quest { white-space: normal; }
.quest-done { color: rgb(46, 148, 70); }
.night { color: rgb(47, 102, 201); }

/* ---------- botões ---------- */
.btn { flex-direction: row; align-items: center; margin: 4px 8px 4px 0; padding: 3px 14px; font-size: 21px;
  background-color: rgb(251, 247, 236); border-width: 2px; border-color: rgb(43, 47, 69);
  border-top-left-radius: 16px; border-top-right-radius: 4px; border-bottom-right-radius: 14px; border-bottom-left-radius: 5px;
  transition-property: scale, rotate; transition-duration: 0.1s; }
.btn:hover { scale: 1.04 1.04; rotate: -1.2deg; }
.btn:disabled { opacity: 0.4; }
.btn-small { font-size: 15px; opacity: 0.8; margin-left: 4px; }
.tool-btn { padding: 2px 6px; margin: 0 0 0 6px; }

/* ---------- narração ---------- */
.narr-wrap { position: absolute; left: 0; right: 0; bottom: 18px; align-items: center; }
.narr { max-width: 620px; padding: 6px 18px; font-size: 21px; white-space: normal; background-color: rgb(251, 247, 236);
  border-width: 2px; border-color: rgb(43, 47, 69);
  border-top-left-radius: 14px; border-top-right-radius: 4px; border-bottom-right-radius: 12px; border-bottom-left-radius: 5px; }

/* ---------- folhas ---------- */
.overlay { position: absolute; left: 0; top: 0; right: 0; bottom: 0; align-items: center; justify-content: center; padding: 12px;
  background-color: rgba(43, 47, 69, 0.22); }
.sheet { width: 100%; max-width: 760px; max-height: 100%; background-color: rgb(251, 247, 236);
  border-width: 2px; border-color: rgb(43, 47, 69);
  border-top-left-radius: 3px; border-top-right-radius: 9px; border-bottom-right-radius: 5px; border-bottom-left-radius: 11px; rotate: -0.35deg; }
.sheet-content { padding: 14px 22px 18px 58px; }
.margin-line { position: absolute; left: 40px; top: 0; bottom: 0; width: 2px; background-color: rgb(229, 138, 138); }
.p { white-space: normal; }
.h2 { font-size: 42px; -unity-font-style: bold; }
.h3 { font-size: 30px; color: rgb(47, 102, 201); margin-top: 16px; }
.small { font-size: 16px; opacity: 0.85; white-space: normal; }
.row { flex-direction: row; align-items: center; min-height: 40px; }
.row-name { flex-grow: 1; flex-shrink: 1; white-space: normal; margin-left: 8px; }
.row-note { font-size: 15px; color: rgb(123, 125, 136); }
.row-price { flex-direction: row; align-items: center; margin: 0 8px; }
.actions { flex-direction: row; flex-wrap: wrap; margin-top: 14px; }
.dlg { flex-direction: row; }
.dlg-art { width: 160px; height: 160px; flex-shrink: 0; margin-right: 16px; }
.dlg-text { flex-grow: 1; flex-shrink: 1; }

/* ---------- luta ---------- */
.fight { max-width: 860px; }
.combat { flex-direction: row; }
.foe { width: 240px; align-items: center; flex-shrink: 0; }
.foe-art { width: 230px; height: 230px; }
.foe-name { font-size: 36px; }
.side { flex-grow: 1; flex-shrink: 1; margin-left: 20px; }
.bar { height: 14px; margin: 6px 0; border-width: 2px; border-color: rgb(43, 47, 69); border-radius: 7px; overflow: hidden; align-self: stretch; }
.bar-fill { height: 100%; transition-property: width; transition-duration: 0.45s; }
.tray { height: 240px; }
.tray-mini { height: 150px; }
.tray-label { position: absolute; font-size: 19px; }
.die-number { position: absolute; -unity-text-align: middle-center; }
.tray-result { position: absolute; left: 0; right: 0; bottom: 4px; font-size: 34px; -unity-text-align: middle-center; }
.clog { min-height: 64px; white-space: normal; }

/* ---------- capa ---------- */
.cover { align-items: center; }
.cover-title { font-size: 64px; color: rgb(214, 56, 58); rotate: -2deg; }
.cover-art { width: 100%; height: 190px; }
.name-field { width: 260px; }

/* ---------- direcional de toque ---------- */
.dpad { position: absolute; right: 14px; bottom: 14px; width: 162px; height: 162px; }
.dpad > Button { position: absolute; width: 54px; height: 54px; font-size: 22px; background-color: rgba(251, 247, 236, 0.85);
  border-width: 2px; border-color: rgb(43, 47, 69); border-radius: 10px; }
.dpad .up { left: 54px; top: 0; }
.dpad .left { left: 0; top: 54px; }
.dpad .right { left: 108px; top: 54px; }
.dpad .down { left: 54px; top: 108px; }

/* ---------- tela estreita (celular em pé) ---------- */
.narrow .hud { left: 28px; }
.narrow .stats { font-size: 17px; }
.narrow .quests { font-size: 14px; max-width: 250px; }
.narrow .combat { flex-direction: column; }
.narrow .foe { width: auto; flex-direction: row; }
.narrow .foe-art { width: 120px; height: 120px; }
.narrow .side { margin-left: 0; }
.narrow .tray { height: 200px; }
.narrow .dlg { flex-direction: column; align-items: center; }
.narrow .dlg-art { width: 120px; height: 120px; }
.narrow .sheet-content { padding: 10px 12px 14px 48px; }
.narrow .narr-wrap { bottom: 190px; }
```

### 6.2 `PaperTextures`: pauta e hachura

```csharp
// Caminho: Assets/_Project/Scripts/UI/PaperTextures.cs
using System.Collections.Generic;
using Caderno.Data;
using UnityEngine;

namespace Caderno.UI
{
    // POR QUE: a pauta azul das folhas e a pintura de lápis dos botões
    // (Parte 1, Estética). O USS não tem gradiente repetido como o CSS do
    // protótipo, então as duas viram texturas pequenas que se repetem.
    // ESTRATÉGIA: texturas criadas em código uma vez e guardadas. Na textura,
    // a linha 0 é a de baixo; a pauta fica no fim de cada faixa de 32 px.
    public static class PaperTextures
    {
        private static Texture2D _lined;
        private static readonly Dictionary<Color, Texture2D> Hatches = new Dictionary<Color, Texture2D>();

        // Faixa de 8×32 com uma linha azul embaixo.
        public static Texture2D Lined
        {
            get
            {
                if (_lined != null) return _lined;
                _lined = new Texture2D(8, 32, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Repeat, filterMode = FilterMode.Point };
                for (int y = 0; y < 32; y++)
                    for (int x = 0; x < 8; x++)
                        _lined.SetPixel(x, y, y == 0 ? Palette.Line : Palette.Paper);
                _lined.Apply();
                return _lined;
            }
        }

        // Quadrado 12×12 com riscos diagonais na cor do lápis.
        public static Texture2D Hatch(Color c)
        {
            if (Hatches.TryGetValue(c, out var t)) return t;
            t = new Texture2D(12, 12, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Repeat };
            var on = new Color(c.r, c.g, c.b, 0.32f);
            for (int y = 0; y < 12; y++)
                for (int x = 0; x < 12; x++)
                    t.SetPixel(x, y, (x + y) % 6 < 2 ? on : Color.clear);
            t.Apply();
            return Hatches[c] = t;
        }
    }
}
```

### 6.3 `Ui`: atalhos de interface

```csharp
// Caminho: Assets/_Project/Scripts/UI/Ui.cs
using System;
using Caderno.Data;
using Caderno.Sketch;
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.UI
{
    // POR QUE: as folhas são montadas em código (fogueira, mochila, luta mudam a
    // cada clique). Estes atalhos deixam cada tela curta de escrever.
    // ESTRATÉGIA: cada método devolve um VisualElement já com a classe USS certa.
    public static class Ui
    {
        // Texto comum (quebra linha; aceita <b> e <color=#...>).
        public static Label Text(string text, string cls = "p")
        {
            var l = new Label(text) { enableRichText = true };
            l.AddToClassList(cls);
            return l;
        }

        // Título com a letra Caveat.
        public static Label Heading(string text, string cls = "h2")
        {
            var l = Text(text, cls);
            l.AddToClassList("title-font");
            return l;
        }

        // Ícone desenhado a lápis.
        public static SketchElement Icon(IconKind kind, Color? color = null, float size = 28)
        {
            var el = new SketchElement(IconArt.Get(kind, color));
            el.style.width = size; el.style.height = size;
            el.style.flexShrink = 0;
            return el;
        }

        // Botão de borda tremida; `hatch` pinta o fundo com lápis daquela cor.
        public static Button Btn(string text, Action onClick, Color? hatch = null, VisualElement icon = null, string small = null)
        {
            var b = new Button(onClick);
            b.AddToClassList("btn");
            if (hatch.HasValue)
            {
                b.style.backgroundImage = new StyleBackground(PaperTextures.Hatch(hatch.Value));
                b.style.backgroundRepeat = new BackgroundRepeat(Repeat.Repeat, Repeat.Repeat);
                b.style.backgroundSize = new BackgroundSize(12, 12);
            }
            if (icon != null) b.Add(icon);
            b.Add(new Label(text));
            if (small != null) b.Add(Text(small, "btn-small"));
            return b;
        }

        // Linha horizontal com os elementos dados.
        public static VisualElement Row(params VisualElement[] items)
        {
            var row = new VisualElement();
            row.AddToClassList("row");
            foreach (var i in items) row.Add(i);
            return row;
        }

        // Ícone + número (HUD e fichas de monstro).
        public static VisualElement Stat(IconKind kind, string text, Color? color = null, float size = 26)
        {
            var row = new VisualElement();
            row.AddToClassList("stat");
            row.Add(Icon(kind, color, size));
            row.Add(new Label(text));
            return row;
        }

        // Caixa para os botões de uma folha.
        public static VisualElement Actions()
        {
            var a = new VisualElement();
            a.AddToClassList("actions");
            return a;
        }

        // Barra de vida pintada a lápis. Devolve a barra e o preenchimento.
        public static (VisualElement bar, VisualElement fill) Bar(Color color)
        {
            var bar = new VisualElement();
            bar.AddToClassList("bar");
            var fill = new VisualElement();
            fill.AddToClassList("bar-fill");
            fill.style.backgroundImage = new StyleBackground(PaperTextures.Hatch(color));
            fill.style.backgroundRepeat = new BackgroundRepeat(Repeat.Repeat, Repeat.Repeat);
            fill.style.backgroundSize = new BackgroundSize(8, 8);
            fill.style.backgroundColor = new Color(color.r, color.g, color.b, 0.25f);
            bar.Add(fill);
            return (bar, fill);
        }

        public static void SetFill(VisualElement fill, float frac) =>
            fill.style.width = Length.Percent(Mathf.Clamp01(frac) * 100f);

        // Tremida rápida (golpe, dano).
        public static async Awaitable Shake(VisualElement el, float strength = 6f)
        {
            float[] xs = { -1f, 0.8f, -0.5f, 0.2f, 0f };
            foreach (float x in xs)
            {
                el.style.translate = new Translate(x * strength, 0);
                await Awaitable.WaitForSecondsAsync(0.06f);
            }
        }
    }
}
```

### 6.4 `PanelHost`: as folhas por cima do mapa

```csharp
// Caminho: Assets/_Project/Scripts/UI/PanelHost.cs
using System;
using System.Collections.Generic;
using Caderno.Data;
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.UI
{
    // Um botão de escolha: texto, valor devolvido, cor do lápis, desligado, ícone.
    public struct Choice
    {
        public string label, value, small;
        public Color? hatch, iconColor;
        public bool off;
        public IconKind? icon;

        public Choice(string label, string value, Color? hatch = null, bool off = false, IconKind? icon = null, Color? iconColor = null, string small = null)
        {
            this.label = label; this.value = value; this.hatch = hatch; this.off = off;
            this.icon = icon; this.iconColor = iconColor; this.small = small;
        }
    }

    // POR QUE: toda conversa com o jogador (encontro, luta, fogueira, baú) é uma
    // folha de caderno por cima do mapa, como no protótipo.
    // ESTRATÉGIA: uma única folha reaproveitada. Open limpa e devolve onde
    // pôr o conteúdo; Ask mostra botões e devolve um Awaitable que termina
    // quando um deles é clicado. Assim a luta é escrita em sequência, com
    // await, igual ao game.js.
    public sealed class PanelHost
    {
        private readonly VisualElement _overlay;
        private readonly ScrollView _scroll;
        private readonly List<Action> _pressable = new List<Action>();

        public readonly VisualElement Sheet;
        public bool IsOpen { get; private set; }
        public event Action<bool> Changed;

        public PanelHost(VisualElement root)
        {
            _overlay = new VisualElement();
            _overlay.AddToClassList("overlay");
            _overlay.style.display = DisplayStyle.None;
            Sheet = new VisualElement();
            Sheet.AddToClassList("sheet");
            _scroll = new ScrollView(ScrollViewMode.Vertical);
            _scroll.contentContainer.AddToClassList("sheet-content");
            // A pauta fica no conteúdo, então rola junto com o texto.
            _scroll.contentContainer.style.backgroundImage = new StyleBackground(PaperTextures.Lined);
            _scroll.contentContainer.style.backgroundRepeat = new BackgroundRepeat(Repeat.Repeat, Repeat.Repeat);
            _scroll.contentContainer.style.backgroundSize = new BackgroundSize(8, 32);
            var margin = new VisualElement { pickingMode = PickingMode.Ignore };
            margin.AddToClassList("margin-line");
            Sheet.Add(_scroll);
            Sheet.Add(margin);
            _overlay.Add(Sheet);
            root.Add(_overlay);
        }

        // Abre a folha vazia (com uma classe extra: "fight", "dialog"...).
        public VisualElement Open(string cls = null)
        {
            _scroll.Clear();
            _pressable.Clear();
            Sheet.ClearClassList();
            Sheet.AddToClassList("sheet");
            if (cls != null) Sheet.AddToClassList(cls);
            _scroll.scrollOffset = Vector2.zero;
            _overlay.style.display = DisplayStyle.Flex;
            if (!IsOpen) { IsOpen = true; Changed?.Invoke(true); }
            return _scroll.contentContainer;
        }

        public void Close()
        {
            _scroll.Clear();
            _pressable.Clear();
            _overlay.style.display = DisplayStyle.None;
            if (IsOpen) { IsOpen = false; Changed?.Invoke(false); }
        }

        public float ScrollY { get => _scroll.scrollOffset.y; set => _scroll.scrollOffset = new Vector2(0, value); }

        // Mostra os botões em `box` e espera um clique. Devolve o `value` escolhido.
        public Awaitable<string> Ask(VisualElement box, IList<Choice> choices)
        {
            var src = new AwaitableCompletionSource<string>();
            box.Clear();
            _pressable.Clear();
            foreach (var choice in choices)
            {
                var c = choice;
                Action pick = () => { box.Clear(); _pressable.Clear(); src.SetResult(c.value); };
                var icon = c.icon.HasValue ? Ui.Icon(c.icon.Value, c.iconColor, 24) : null;
                var b = Ui.Btn(c.label, pick, c.hatch, icon, c.small);
                b.SetEnabled(!c.off);
                if (!c.off) _pressable.Add(pick);
                box.Add(b);
            }
            return src.Awaitable;
        }

        // Atalho do teclado: aperta o n-ésimo botão ligado (1 = primeiro).
        public void PressNth(int n)
        {
            if (n >= 0 && n < _pressable.Count) _pressable[n]();
        }
    }
}
```

### 6.5 `Hud` e `Narrator`

```csharp
// Caminho: Assets/_Project/Scripts/UI/Hud.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Caderno.Core;
using Caderno.Data;
using Caderno.Sketch;
using UnityEngine.UIElements;

namespace Caderno.UI
{
    // POR QUE: vida, magia, moedas, dados de ataque e defesa, nível, hora do
    // dia e tochas sempre à vista no topo da folha, com as missões ativas
    // logo embaixo (Parte 1, Personagem; Dia e noite; Missões).
    // ESTRATÉGIA: monta uma vez e só troca os textos em Refresh.
    public sealed class Hud
    {
        private readonly VisualElement _root;
        private readonly Label _hp, _pm, _gold, _atk, _def, _lvl, _time, _torch;
        private readonly VisualElement _xpFill, _quests;
        private readonly SketchElement _soundIcon, _timeIcon, _torchIcon;

        public Hud(VisualElement parent, Action onBag, Action onMap, Action onSound)
        {
            _root = new VisualElement();
            _root.AddToClassList("hud");
            _root.style.display = DisplayStyle.None;
            var stats = new VisualElement();
            stats.AddToClassList("stats");
            _hp = AddStat(stats, IconKind.Heart);
            _pm = AddStat(stats, IconKind.Star);
            _gold = AddStat(stats, IconKind.Coin);
            _atk = AddStat(stats, IconKind.Sword);
            _def = AddStat(stats, IconKind.Shield);
            var lvlRow = new VisualElement();
            lvlRow.AddToClassList("stat");
            _lvl = new Label();
            var xp = new VisualElement();
            xp.AddToClassList("xp");
            _xpFill = new VisualElement();
            _xpFill.AddToClassList("xp-fill");
            xp.Add(_xpFill);
            lvlRow.Add(_lvl); lvlRow.Add(xp);
            stats.Add(lvlRow);
            (_timeIcon, _time) = AddIconStat(stats, IconKind.Sun);
            (_torchIcon, _torch) = AddIconStat(stats, IconKind.Torch);
            _torch.enableRichText = true;
            // Números em cima e a caixinha de missões embaixo, numa coluna.
            var left = new VisualElement();
            left.AddToClassList("hud-left");
            left.Add(stats);
            _quests = new VisualElement();
            _quests.AddToClassList("quests");
            left.Add(_quests);
            _root.Add(left);

            var tools = new VisualElement();
            tools.AddToClassList("tools");
            tools.Add(Tool(IconKind.Bag, onBag));
            tools.Add(Tool(IconKind.Map, onMap));
            _soundIcon = Ui.Icon(IconKind.Sound, null, 32);
            var snd = new Button(onSound);
            snd.AddToClassList("btn"); snd.AddToClassList("tool-btn");
            snd.Add(_soundIcon);
            tools.Add(snd);
            _root.Add(tools);
            parent.Add(_root);
        }

        // Ícone + rótulo dentro da barra de status. Devolve o rótulo para atualizar.
        private static Label AddStat(VisualElement stats, IconKind kind)
        {
            var row = new VisualElement();
            row.AddToClassList("stat");
            row.Add(Ui.Icon(kind));
            var l = new Label();
            row.Add(l);
            stats.Add(row);
            return l;
        }

        // Como AddStat, mas devolve também o ícone (sol/lua e tocha acesa/apagada mudam).
        private static (SketchElement, Label) AddIconStat(VisualElement stats, IconKind kind)
        {
            var row = new VisualElement();
            row.AddToClassList("stat");
            var icon = Ui.Icon(kind);
            row.Add(icon);
            var l = new Label();
            row.Add(l);
            stats.Add(row);
            return (icon, l);
        }

        private static Button Tool(IconKind kind, Action onClick)
        {
            var b = new Button(onClick);
            b.AddToClassList("btn"); b.AddToClassList("tool-btn");
            b.Add(Ui.Icon(kind, null, 32));
            return b;
        }

        // Copia os números do herói, o relógio e as missões para a tela.
        public void Refresh(PlayerState p, GameDatabase db, RunState g, IList<(string text, bool done)> quests)
        {
            _root.style.display = DisplayStyle.Flex;
            _hp.text = $"{p.hp}/{p.hpMax}";
            _pm.text = $"{p.pm}/{p.pmMax}";
            _gold.text = p.ouro.ToString();
            _atk.text = p.AttackDie(db).ToString();
            var def = p.DefenseDice(db);
            _def.text = def.Length > 0 ? string.Join(" + ", def.Select(d => d.ToString())) : "—";
            _lvl.text = $"Nível {p.lvl}";
            Ui.SetFill(_xpFill, (float)p.xp / PlayerState.XpNext(p.lvl));

            bool inDungeon = p.onde >= 0;
            SetIcon(_timeIcon, inDungeon || g.IsNight ? IconKind.Moon : IconKind.Sun);
            _time.text = inDungeon ? "Masmorra" : $"Dia {g.day}{(g.IsNight ? " · noite" : "")}";
            SetIcon(_torchIcon, p.tocha > 0 ? IconKind.Torch : IconKind.TorchOff);
            _torch.text = p.tocha > 0 ? $"{p.tochas} <size=14>acesa: {p.tocha}</size>" : p.tochas.ToString();

            _quests.Clear();
            _quests.style.display = quests.Count > 0 ? DisplayStyle.Flex : DisplayStyle.None;
            if (quests.Count == 0) return;
            _quests.Add(Ui.Heading("Missões", "quests-title"));
            foreach (var (text, done) in quests)
            {
                var l = Ui.Text((done ? "✓ " : "• ") + text, "quest");
                if (done) l.AddToClassList("quest-done");
                _quests.Add(l);
            }
        }

        // Troca o desenho de um ícone só quando muda (evita repintar à toa).
        private static void SetIcon(SketchElement el, IconKind kind)
        {
            var strokes = IconArt.Get(kind);
            if (el.Strokes != strokes) el.SetStrokes(strokes);
        }

        // Ícone do botão de som (ligado/desligado).
        public void SetSound(bool on) => _soundIcon.SetStrokes(IconArt.Get(on ? IconKind.Sound : IconKind.SoundOff));
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/Narrator.cs
using UnityEngine.UIElements;

namespace Caderno.UI
{
    // POR QUE: o balão "Mestre:" que comenta a aventura (Parte 1, O mestre).
    // ESTRATÉGIA: um balão só; cada fala nova troca o texto e reinicia o
    // tempo de sumir (3,2 s + 35 ms por letra, como no protótipo).
    public sealed class Narrator
    {
        private readonly VisualElement _wrap;
        private readonly Label _label;
        private IVisualElementScheduledItem _hide;

        public Narrator(VisualElement parent)
        {
            _wrap = new VisualElement { pickingMode = PickingMode.Ignore };
            _wrap.AddToClassList("narr-wrap");
            _label = Ui.Text("", "narr");
            _label.pickingMode = PickingMode.Ignore;
            _wrap.Add(_label);
            _wrap.style.display = DisplayStyle.None;
            parent.Add(_wrap);
        }

        public void Say(string text)
        {
            _label.text = $"<color=#d6383a>Mestre:</color> {text}";
            _wrap.style.display = DisplayStyle.Flex;
            _wrap.BringToFront();
            _hide?.Pause();
            _hide = _wrap.schedule.Execute(() => _wrap.style.display = DisplayStyle.None).StartingIn(3200 + text.Length * 35);
        }
    }
}
```

### 6.6 `Sfx`: som sem arquivos

```csharp
// Caminho: Assets/_Project/Scripts/UI/Sfx.cs
using System.Collections.Generic;
using UnityEngine;

namespace Caderno.UI
{
    // POR QUE: rabisco de caneta, dados chacoalhando, golpe, moeda e subida
    // de nível (Parte 1, Estética: som sintetizado, sem arquivos).
    // ESTRATÉGIA: cada som é um AudioClip montado em código na abertura do
    // jogo (ruído com envelope, ou tons curtos) e tocado com PlayOneShot. O
    // rabisco é pedido a cada quadro enquanto o mestre desenha, então ele se
    // limita a um a cada 110 ms.
    public sealed class Sfx
    {
        private const int Rate = 44100;
        private readonly AudioSource _src;
        private readonly Dictionary<string, AudioClip> _clips = new Dictionary<string, AudioClip>();
        private float _lastScribble;
        public bool On = true;

        public Sfx(AudioSource src)
        {
            _src = src;
            _clips["scribble"] = Noise("scribble", 0.08f, 0.10f, true);
            _clips["step"] = Noise("step", 0.04f, 0.12f, false);
            _clips["hit"] = Noise("hit", 0.16f, 0.7f, false);
            _clips["dice"] = Dice();
            _clips["coin"] = Tones("coin", new[] { 988f, 1319f }, 0.07f, 0.12f);
            _clips["lvl"] = Tones("lvl", new[] { 523f, 659f, 784f, 1047f }, 0.09f, 0.14f);
        }

        public void Play(string name)
        {
            if (!On || _src == null || !_clips.TryGetValue(name, out var clip)) return;
            if (name == "scribble")
            {
                if (Time.time - _lastScribble < 0.11f) return;
                _lastScribble = Time.time;
            }
            _src.PlayOneShot(clip);
        }

        // Ruído que some aos poucos. bright = agudo (risco de caneta); senão grave (passo, golpe).
        private static AudioClip Noise(string name, float dur, float vol, bool bright)
        {
            int n = (int)(Rate * dur);
            var data = new float[n];
            var r = new System.Random(name.Length * 97);
            float low = 0f;
            for (int i = 0; i < n; i++)
            {
                float w = (float)(r.NextDouble() * 2 - 1);
                low += (w - low) * (bright ? 0.5f : 0.08f);       // filtro passa-baixa simples
                float v = bright ? w - low : low * 3f;            // agudo = o que o filtro tirou
                data[i] = v * vol * (1f - (float)i / n);
            }
            return Make(name, data);
        }

        // Seis estalos curtos e espaçados: dados batendo na mesa.
        private static AudioClip Dice()
        {
            var data = new float[(int)(Rate * 0.5f)];
            var r = new System.Random(6);
            for (int k = 0; k < 6; k++)
            {
                int start = (int)(Rate * (k * 0.075f + r.NextDouble() * 0.03f)), len = (int)(Rate * 0.03f);
                for (int i = 0; i < len && start + i < data.Length; i++)
                    data[start + i] += (float)(r.NextDouble() * 2 - 1) * 0.35f * (1f - (float)i / len);
            }
            return Make("dice", data);
        }

        // Notas em sequência (onda triangular que some).
        private static AudioClip Tones(string name, float[] freqs, float gap, float each)
        {
            var data = new float[(int)(Rate * (gap * freqs.Length + each))];
            for (int k = 0; k < freqs.Length; k++)
            {
                int start = (int)(Rate * gap * k), len = (int)(Rate * each);
                for (int i = 0; i < len && start + i < data.Length; i++)
                {
                    float phase = (freqs[k] * i / Rate) % 1f;
                    float tri = 4f * Mathf.Abs(phase - 0.5f) - 1f;
                    data[start + i] += tri * 0.12f * Mathf.Exp(-6f * i / len);
                }
            }
            return Make(name, data);
        }

        private static AudioClip Make(string name, float[] data)
        {
            var clip = AudioClip.Create(name, data.Length, 1, Rate, false);
            clip.SetData(data, 0);
            return clip;
        }
    }
}
```

### 6.7 `GameController.Ui.cs`

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameController.Ui.cs
using System.Collections.Generic;
using Caderno.Sketch;
using Caderno.UI;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UIElements;

namespace Caderno.Game
{
    // POR QUE: liga a interface (HUD, narração, folhas, som) ao jogo.
    // ESTRATÉGIA: implementa os ganchos partial declarados na Fase 5 e traz
    // Dialog, a folha de "título + texto + desenho + botões" usada pelos
    // encontros, personagens e pelo fim do jogo.
    public partial class GameController
    {
        private PanelHost _panels;
        private Hud _hud;
        private Narrator _narr;
        private Sfx _sfx;

        partial void BuildUi(VisualElement root)
        {
            _hud = new Hud(root, () => OpenBag(), () => { if (!_panelOpen) _overview = !_overview; }, ToggleSound);
            _narr = new Narrator(root);
            _panels = new PanelHost(root);
            _panels.Changed += open =>
            {
                _panelOpen = open;
                if (open) { StopMoving(); _tap = Vector2Int.zero; }
                UpdateHud();
            };
            _sfx = new Sfx(GetComponent<AudioSource>());
            // Abaixo de 700 de largura, as folhas empilham em coluna (celular em pé).
            root.RegisterCallback<GeometryChangedEvent>(_ => root.EnableInClassList("narrow", root.contentRect.width < 700));
        }

        private readonly List<(string text, bool done)> _questLines = new List<(string text, bool done)>();

        // As linhas de missão vêm do gancho QuestLines (Fase 8); até lá, nenhuma.
        partial void UpdateHud()
        {
            if (P == null) return;
            _questLines.Clear();
            QuestLines(_questLines);
            _hud.Refresh(P, _db, G, _questLines);
        }

        partial void Narrate(string text) => _narr.Say(text);

        partial void PlaySfx(string name) => _sfx.Play(name);

        // Teclas 1 a 9 apertam os botões da folha aberta.
        partial void OnPanelKeys()
        {
            var kb = Keyboard.current;
            for (int n = 0; n < 9; n++)
                if (kb[Key.Digit1 + n].wasPressedThisFrame) _panels.PressNth(n);
        }

        private void ToggleSound()
        {
            _sfx.On = !_sfx.On;
            _hud.SetSound(_sfx.On);
            PlayerPrefs.SetInt("caderno-som", _sfx.On ? 1 : 0);
        }

        // Folha simples: título, desenho opcional, texto e botões. Fecha sozinha
        // e devolve o valor do botão escolhido.
        private async Awaitable<string> Dialog(string title, string body, Choice[] choices, StrokeList art = null)
        {
            var c = _panels.Open("dialog");
            c.Add(Ui.Heading(title));
            var row = new VisualElement();
            row.AddToClassList("dlg");
            if (art != null)
            {
                var a = new SketchElement(art);
                a.AddToClassList("dlg-art");
                row.Add(a);
                a.PlayDraw(0.8f);
            }
            var text = Ui.Text(body);
            text.AddToClassList("dlg-text");
            row.Add(text);
            c.Add(row);
            var acts = Ui.Actions();
            c.Add(acts);
            string v = await _panels.Ask(acts, choices);
            _panels.Close();
            return v;
        }
    }
}
```

No Start (Fase 9 completa isso), o som respeita a escolha salva: por enquanto ele começa ligado.

### ✅ Checkpoint da Fase 6
- O HUD aparece no topo com coração, estrela, moeda, espada (`1d6`), escudo (`—`), "Nível 1", sol com "Dia 1" e a tocha apagada com `2`, tudo em letra de mão. A caixinha de missões ainda não aparece (as missões vêm na Fase 8).
- Ao anoitecer, o sol vira lua, aparece "Dia 1 · noite", o mestre avisa "Anoiteceu!" e a tocha acesa mostra quantos passos faltam.
- Bater na água mostra o balão "**Mestre:** Aí é água! Sem barco, nada feito." embaixo, que some sozinho.
- Entrar na floresta pela primeira vez narra "Floresta! O mestre rabisca...".
- Com som ligado, o mestre faz um chiado de rabisco enquanto desenha, e cada passo faz um "tum" baixinho. O botão de som troca o ícone e silencia.

#### Problemas comuns
- **Letra comum em vez da letra de mão:** o caminho em `url(...)` no USS está errado, ou faltou `-unity-font-definition: initial`, que tira a fonte padrão do tema da frente.
- **Fundo dos botões esticado em vez de listrado:** faltou `backgroundRepeat` e `backgroundSize` (Unity 2022.2 ou mais novo).
- **`AwaitableCompletionSource` não existe:** o projeto não está no Unity 6 (ou 2023.1+).

Próxima fase: **Combate**, o coração do jogo.

---

# Parte 10 — Implementação Unity: Fase 7 (Combate)

## Fase 7 — Combate

> Objetivo desta fase: a luta da Parte 1. O monstro é desenhado na folha, os dados rolam na bandeja e param um de cada vez, a conta aparece ("12 − 3 = 9 de dano!"), e os turnos se alternam até alguém cair ou o herói fugir. À noite o monstro rola um dado a mais; ao vencer, moedas e despojos rolam juntos.

### 7.1 `CombatRules`: as regras em C# puro

```csharp
// Caminho: Assets/_Project/Scripts/Core/CombatRules.cs
using System;

namespace Caderno.Core
{
    public enum CombatResult { Vitoria, Derrota, Fuga }

    // POR QUE: as contas da luta (Parte 1, Combate) num lugar só, sem tela.
    // Quando o balanceamento mudar (crítico, veneno...), muda aqui.
    // ESTRATÉGIA: funções pequenas e puras; a cena só chama e mostra.
    public static class CombatRules
    {
        // Dano = ataque − defesa, nunca negativo ("bloqueou!").
        public static int Damage(int attack, int defense) => Math.Max(0, attack - defense);

        // Quanto o d20 precisa para fugir: 15 do dragão, 13 de um chefe, 8 no
        // primeiro turno, 11 depois.
        public static int FleeTarget(bool dragon, bool chefe, bool firstTurn) => dragon ? 15 : chefe ? 13 : firstTurn ? 8 : 11;

        // À noite (fora das masmorras) o monstro rola um dado de ataque a mais
        // e dá 50% a mais de experiência (Parte 1, Dia e noite).
        public static DiceSpec NightAttack(DiceSpec atk) => new DiceSpec(atk.count + 1, atk.sides);
        public static int NightXp(int xp) => (int)Math.Round(xp * 1.5, MidpointRounding.AwayFromZero);

        // Fuga antes da luta num encontro surpresa.
        public const int AmbushFleeTarget = 8;
    }
}
```

### 7.2 `DiceTray`: a bandeja de dados

```csharp
// Caminho: Assets/_Project/Scripts/UI/DiceTray.cs
using System.Collections.Generic;
using Caderno.Core;
using Caderno.Data;
using Caderno.Sketch;
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.UI
{
    // POR QUE: rolar dados é o momento mais importante do jogo (Parte 1,
    // Combate). Os dados precisam rolar na frente do jogador: números
    // trocando, dado tremendo, e cada um parando na sua vez.
    // ESTRATÉGIA: cada rolagem tem grupos (ex.: "Seu ataque" e "Defesa do
    // Orc"). Os valores finais são sorteados logo no início; a animação só
    // mostra números falsos até o "stop" de cada dado. As silhuetas são
    // desenhadas com Painter2D e os números são Labels por cima, porque o
    // Painter2D não escreve texto.
    public sealed class DiceTray : VisualElement
    {
        public struct Group
        {
            public string label;
            public List<int> sides;
            public Color color;
            public Group(string label, List<int> sides, Color color) { this.label = label; this.sides = sides; this.color = color; }
        }

        private sealed class DieState
        {
            public int sides, value, final;
            public float stop, last, size;
            public Vector2 pos;
            public Label number;
        }

        private sealed class GroupState
        {
            public Color color;
            public Label title, total;
            public readonly List<DieState> dice = new List<DieState>();
        }

        private readonly List<GroupState> _groups = new List<GroupState>();
        private readonly Label _result;
        private readonly System.Random _rng;

        public DiceTray(System.Random rng, bool mini = false)
        {
            _rng = rng;
            AddToClassList("tray");
            if (mini) AddToClassList("tray-mini");
            generateVisualContent += Paint;
            _result = new Label();
            _result.AddToClassList("tray-result");
            _result.AddToClassList("title-font");
            Add(_result);
            schedule.Execute(Tick).Every(16);
        }

        // Rola os grupos e espera todos pararem. Devolve a soma de cada grupo.
        public async Awaitable<int[]> Roll(params Group[] defs)
        {
            foreach (var g in _groups)
            {
                g.title.RemoveFromHierarchy(); g.total.RemoveFromHierarchy();
                foreach (var d in g.dice) d.number.RemoveFromHierarchy();
            }
            _groups.Clear();
            _result.text = "";
            float now = Time.time, end = now;
            for (int gi = 0; gi < defs.Length; gi++)
            {
                var gs = new GroupState { color = defs[gi].color };
                gs.title = NewLabel("tray-label", defs[gi].label, defs[gi].color);
                gs.total = NewLabel("die-number", "", Palette.Ink);
                for (int k = 0; k < defs[gi].sides.Count; k++)
                {
                    int s = defs[gi].sides[k];
                    var d = new DieState { sides = s, final = Dice.RollOne(_rng, s), value = Dice.RollOne(_rng, s), stop = now + 0.6f + k * 0.09f + gi * 0.14f };
                    d.number = NewLabel("die-number", "", Palette.Ink);
                    gs.dice.Add(d);
                    end = Mathf.Max(end, d.stop);
                }
                _groups.Add(gs);
            }
            Layout(now);
            await Awaitable.WaitForSecondsAsync(end - now + 0.15f);
            var totals = new int[_groups.Count];
            for (int gi = 0; gi < _groups.Count; gi++)
            {
                foreach (var d in _groups[gi].dice) totals[gi] += d.final;
                if (_groups[gi].dice.Count > 1) _groups[gi].total.text = "= " + totals[gi];
            }
            return totals;
        }

        // A conta grande embaixo, ex.: "12 − 3 = 9  de dano!".
        public void Result(string big, string small, Color color)
        {
            _result.text = big + (string.IsNullOrEmpty(small) ? "" : "  " + small);
            _result.style.color = color;
        }

        private Label NewLabel(string cls, string text, Color color)
        {
            var l = new Label(text) { pickingMode = PickingMode.Ignore };
            l.AddToClassList(cls);
            l.style.color = color;
            Add(l);
            return l;
        }

        // A cada 16 ms: troca os números dos dados que ainda rolam e repinta.
        private void Tick()
        {
            float now = Time.time;
            foreach (var g in _groups)
                foreach (var d in g.dice)
                {
                    if (now < d.stop)
                    {
                        if (now - d.last > 0.055f) { d.value = Dice.RollOne(_rng, d.sides); d.last = now; }
                    }
                    else d.value = d.final;
                    d.number.text = d.value.ToString();
                }
            Layout(now);
            MarkDirtyRepaint();
        }

        // Posição de tudo: uma faixa por grupo; dado menor quando são muitos.
        private void Layout(float now)
        {
            var r = contentRect;
            if (r.width <= 0 || _groups.Count == 0) return;
            float rowH = Mathf.Min(100f, (r.height - 40f) / _groups.Count);
            for (int gi = 0; gi < _groups.Count; gi++)
            {
                var g = _groups[gi];
                float y0 = gi * rowH;
                float size = Mathf.Max(22f, Mathf.Min(rowH - 28f, (r.width - 80f) / g.dice.Count / 1.15f, 58f));
                g.title.style.left = 6; g.title.style.top = y0;
                for (int k = 0; k < g.dice.Count; k++)
                {
                    var d = g.dice[k];
                    float jitter = now < d.stop ? 3f : 0f;
                    d.size = size;
                    d.pos = new Vector2(8 + size / 2 + k * size * 1.15f + Random.Range(-jitter, jitter) / 2,
                                        y0 + 26 + size / 2 + Random.Range(-jitter, jitter) / 2);
                    var n = d.number.style;
                    n.left = d.pos.x - size / 2; n.top = d.pos.y - size / 2 + (d.sides == 4 ? size * 0.12f : 0f);
                    n.width = size; n.height = size;
                    n.fontSize = size * (d.sides == 4 ? 0.36f : 0.44f);
                    n.color = now < d.stop ? Palette.Gray : Palette.Ink;
                }
                g.total.style.left = 10 + g.dice.Count * size * 1.15f; g.total.style.top = y0 + 26;
                g.total.style.height = size; g.total.style.fontSize = Mathf.Min(34f, size * 0.7f);
            }
        }

        // Silhueta de cada dado, pintada na cor do grupo.
        private void Paint(MeshGenerationContext ctx)
        {
            foreach (var g in _groups)
                foreach (var d in g.dice)
                    StrokePainter.Draw(ctx.painter2D, IconArt.Die(d.sides, g.color), 1f, d.pos - Vector2.one * d.size / 2f, d.size / 100f, out _, out _);
        }
    }
}
```

No protótipo os dados também giram enquanto rolam. Aqui eles só tremem, porque girar exigiria gerar os traços de novo a cada quadro. Se fizer falta, envolva cada dado num `VisualElement` próprio e use `style.rotate`.

### 7.3 `FoeView`: o monstro na folha da luta

```csharp
// Caminho: Assets/_Project/Scripts/UI/FoeView.cs
using Caderno.Sketch;
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.UI
{
    // POR QUE: o mestre desenha o monstro grande na hora da luta, e os golpes
    // deixam riscos de caneta por cima (Parte 1, Combate). No fim, um X.
    // ESTRATÉGIA: três desenhos empilhados no mesmo lugar: o monstro, os
    // riscos do golpe (somem em 0,65 s) e o X da vitória.
    public sealed class FoeView : VisualElement
    {
        private readonly SketchElement _art, _fx, _cross;

        public FoeView(string monsterId)
        {
            AddToClassList("foe-art");
            _art = Layer(new SketchElement(MonsterArt.Get(monsterId)));
            _fx = Layer(new SketchElement());
            _cross = Layer(new SketchElement());
            _art.PlayDraw(0.9f);
        }

        // Ocupa a área toda do FoeView.
        private SketchElement Layer(SketchElement e)
        {
            e.style.position = Position.Absolute;
            e.style.left = 0; e.style.top = 0; e.style.right = 0; e.style.bottom = 0;
            Add(e);
            return e;
        }

        // Golpe: riscos rápidos na cor do ataque e uma tremida.
        public void Hit(Color color)
        {
            _fx.SetStrokes(IconArt.Slash((uint)Random.Range(1, int.MaxValue), color));
            _fx.PlayDraw(0.18f);
            _fx.schedule.Execute(() => _fx.SetStrokes(null)).StartingIn(650);
            _ = Ui.Shake(this, 8f);
        }

        // O X vermelho do mestre.
        public void Defeat()
        {
            _cross.SetStrokes(IconArt.Cross(0, 0, 100, 5));
            _cross.PlayDraw(0.4f);
        }
    }
}
```

### 7.4 `GameController.Combat.cs`: a luta

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameController.Combat.cs
using System.Collections.Generic;
using System.Linq;
using Caderno.Core;
using Caderno.Data;
using Caderno.UI;
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.Game
{
    // POR QUE: a luta da Parte 1, igual à função combat() do protótipo.
    // ESTRATÉGIA: um laço assíncrono. Cada turno espera o jogador escolher
    // (Ask), rola na bandeja (Roll), aplica as CombatRules e, se o monstro
    // ainda estiver de pé, faz o turno dele. Termina em vitória, derrota ou
    // fuga. À noite (fora das masmorras) o monstro rola um dado de ataque a
    // mais e dá mais experiência; ao vencer, moedas e despojos rolam juntos.
    public partial class GameController
    {
        private async Awaitable<CombatResult> Combat(string kind, bool ambush = false, string intro = null)
        {
            var m = _db.Monster(kind);
            int foeHp = m.hp;
            bool dragon = kind == "dragao", night = NightBonus;
            var atk = night ? CombatRules.NightAttack(m.atk) : m.atk;

            // ----- monta a folha -----
            var c = _panels.Open("fight");
            var combat = new VisualElement();
            combat.AddToClassList("combat");
            c.Add(combat);

            var foeCol = new VisualElement();
            foeCol.AddToClassList("foe");
            var foe = new FoeView(kind);
            foeCol.Add(foe);
            var info = new VisualElement();
            info.style.alignSelf = Align.Stretch;
            info.style.flexGrow = 1;
            info.Add(Ui.Heading(m.nome, "foe-name"));
            var (foeBar, foeFill) = Ui.Bar(Palette.Purple);
            info.Add(foeBar);
            var foeHpLabel = new Label();
            info.Add(Ui.Row(Ui.Icon(IconKind.Heart, null, 22), foeHpLabel,
                Ui.Icon(IconKind.Sword, null, 22), new Label(atk.ToString()),
                Ui.Icon(IconKind.Shield, null, 22), new Label(m.def.ToString())));
            if (night)
            {
                var note = Ui.Text("noite: +1 dado de ataque, +50% de experiência", "small");
                note.AddToClassList("night");
                info.Add(Ui.Row(Ui.Icon(IconKind.Moon, null, 22), note));
            }
            foeCol.Add(info);
            combat.Add(foeCol);

            var side = new VisualElement();
            side.AddToClassList("side");
            var meHp = new Label();
            var mePm = new Label();
            side.Add(Ui.Row(Ui.Text($"<b>{P.nome}</b>"), Ui.Icon(IconKind.Heart, null, 22), meHp, Ui.Icon(IconKind.Star, null, 22), mePm));
            var (meBar, meFill) = Ui.Bar(Palette.Red);
            side.Add(meBar);
            var tray = new DiceTray(_dice);
            side.Add(tray);
            var clog = Ui.Text("", "clog");
            side.Add(clog);
            var acts = Ui.Actions();
            side.Add(acts);
            combat.Add(side);

            void Bars()
            {
                foeHpLabel.text = $"{Mathf.Max(0, foeHp)}/{m.hp}";
                meHp.text = $"{Mathf.Max(0, P.hp)}/{P.hpMax}";
                mePm.text = $"{P.pm}/{P.pmMax}";
                Ui.SetFill(foeFill, (float)foeHp / m.hp);
                Ui.SetFill(meFill, (float)P.hp / P.hpMax);
                UpdateHud();
            }
            void Log(string text) => clog.text = text;

            // Turno do monstro: ataque dele contra escudo + armadura.
            async Awaitable MonsterTurn()
            {
                var defs = P.DefenseDice(_db);
                var groups = new List<DiceTray.Group> { new DiceTray.Group($"{m.nome} ataca", Dice.Expand(atk), Palette.Purple) };
                if (defs.Length > 0) groups.Add(new DiceTray.Group("Sua defesa", Dice.Expand(defs), Palette.Blue));
                var r = await tray.Roll(groups.ToArray());
                int a = r[0], d = r.Length > 1 ? r[1] : 0, dmg = CombatRules.Damage(a, d);
                P.hp -= dmg;
                tray.Result(defs.Length > 0 ? $"{a} − {d} = {dmg}" : $"{dmg}", dmg > 0 ? "de dano em você" : "bloqueou tudo!", dmg > 0 ? Palette.Purple : Palette.Blue);
                if (dmg > 0) { PlaySfx("hit"); _ = Ui.Shake(_panels.Sheet); }
                Bars();
                await Awaitable.WaitForSecondsAsync(0.65f);
            }

            Bars();
            Log(intro ?? $"{m.UmMaiusculo} {m.nome} aparece! O mestre desenha rapidinho.");
            await Awaitable.WaitForSecondsAsync(0.5f);
            if (ambush) { Log($"{m.nome} ataca primeiro!"); await MonsterTurn(); }

            // ----- turnos -----
            bool first = !ambush;
            CombatResult? result = null;
            while (result == null && P.hp > 0)
            {
                int flee = CombatRules.FleeTarget(dragon, m.chefe, first);
                var weapon = _db.Item(P.arma);
                bool hasPot = P.pocaoVida > 0 || P.pocaoMana > 0;
                string act = await _panels.Ask(acts, new[]
                {
                    new Choice("Atacar", "atk", Palette.Red, icon: IconKind.Sword, iconColor: weapon?.cor, small: P.AttackDie(_db).ToString()),
                    new Choice("Feitiço", "spell", Palette.Purple, P.magias.Count == 0, IconKind.Scroll, Palette.Purple),
                    new Choice("Poção", "pot", Palette.Green, !hasPot, IconKind.Potion, Palette.Red),
                    new Choice("Fugir", "flee", small: $"d20 ≥ {flee}"),
                });
                if (act == "spell")
                {
                    var list = P.magias.Select(id => _db.Spell(id)).Select(s =>
                        new Choice(s.nome, "s:" + s.id, Palette.Purple, P.pm < s.pm, IconKind.Scroll, s.cor, $"{s.dado} · {s.pm} PM")).ToList();
                    list.Add(new Choice("Voltar", "back"));
                    act = await _panels.Ask(acts, list);
                }
                else if (act == "pot")
                {
                    var list = new[] { "pocao_vida", "pocao_mana" }.Where(id => P.Potions(id) > 0).Select(id => _db.Item(id)).Select(it =>
                        new Choice($"{it.nome} ×{P.Potions(it.id)}", "p:" + it.id, Palette.Green, false, IconKind.Potion, it.cor, it.dado.ToString())).ToList();
                    list.Add(new Choice("Voltar", "back"));
                    act = await _panels.Ask(acts, list);
                }
                if (act == "back") continue;

                if (act == "atk")
                {
                    var groups = new List<DiceTray.Group> { new DiceTray.Group("Seu ataque" + (weapon != null ? " · " + weapon.nome : ""), Dice.Expand(P.AttackDie(_db)), Palette.Red) };
                    if (!m.def.IsNone) groups.Add(new DiceTray.Group($"Defesa: {m.nome}", Dice.Expand(m.def), Palette.Gray));
                    var r = await tray.Roll(groups.ToArray());
                    int a = r[0], d = r.Length > 1 ? r[1] : 0, dmg = CombatRules.Damage(a, d);
                    foeHp -= dmg;
                    tray.Result(m.def.IsNone ? $"{dmg}" : $"{a} − {d} = {dmg}", dmg > 0 ? "de dano!" : "ele bloqueou!", dmg > 0 ? Palette.Red : Palette.Gray);
                    if (dmg > 0) { foe.Hit(Palette.Red); PlaySfx("hit"); }
                    Log(dmg > 0 ? $"Você acerta {m.nome}." : $"{m.nome} defendeu tudo.");
                }
                else if (act.StartsWith("s:"))
                {
                    var sp = _db.Spell(act.Substring(2));
                    P.pm -= sp.pm;
                    var r = await tray.Roll(new DiceTray.Group($"{sp.nome} (ignora defesa)", Dice.Expand(sp.dado), sp.cor));
                    if (sp.tipo == SpellKind.Cura)
                    {
                        int heal = Mathf.Min(P.hpMax - P.hp, r[0]);
                        P.hp += heal;
                        tray.Result($"+{heal}", "de vida", Palette.Green);
                        Log("Uma luz verde fecha seus machucados.");
                    }
                    else
                    {
                        foeHp -= r[0];
                        foe.Hit(sp.cor); PlaySfx("hit");
                        tray.Result($"{r[0]}", "de dano mágico!", sp.cor);
                        Log($"{sp.nome} acerta em cheio!");
                    }
                }
                else if (act.StartsWith("p:"))
                {
                    var it = _db.Item(act.Substring(2));
                    P.AddPotion(it.id, -1);
                    var r = await tray.Roll(new DiceTray.Group(it.nome, Dice.Expand(it.dado), it.cor));
                    if (it.efeito == PotionEffect.Vida) { int g = Mathf.Min(P.hpMax - P.hp, r[0]); P.hp += g; tray.Result($"+{g}", "de vida", Palette.Red); }
                    else { int g = Mathf.Min(P.pmMax - P.pm, r[0]); P.pm += g; tray.Result($"+{g}", "de magia", Palette.Blue); }
                    Log("Glub glub glub.");
                }
                else if (act == "flee")
                {
                    var r = await tray.Roll(new DiceTray.Group("Fugir", new List<int> { 20 }, Palette.Ink));
                    if (r[0] >= flee)
                    {
                        tray.Result($"{r[0]}", "você fugiu!", Palette.Green);
                        result = CombatResult.Fuga;
                        await Awaitable.WaitForSecondsAsync(0.6f);
                        break;
                    }
                    tray.Result($"{r[0]}", "não deu!", Palette.Red);
                    Log("Você tropeça na fuga...");
                }
                Bars();
                first = false;
                if (foeHp <= 0) { result = CombatResult.Vitoria; break; }
                await Awaitable.WaitForSecondsAsync(0.7f);
                await MonsterTurn();
            }
            var final = result ?? CombatResult.Derrota;

            // ----- fim da luta -----
            if (final == CombatResult.Vitoria)
            {
                foe.Defeat();
                G.kills++;
                PlayerState.Add(P.abates, kind, 1);
                Log($"Você venceu {m.nome}! O mestre faz um X em cima.");
                await Awaitable.WaitForSecondsAsync(0.5f);
                // Moedas e despojos (1d3; do chefe, 2d6) rolam juntos na bandeja.
                bool drops = !string.IsNullOrEmpty(m.parte);
                var groups = new List<DiceTray.Group> { new DiceTray.Group("Moedas", Dice.Expand(m.ouro), Palette.Yellow) };
                if (drops) groups.Add(new DiceTray.Group(Cap(m.partes), Dice.Expand(m.chefe ? new DiceSpec(2, 6) : new DiceSpec(1, 3)), Palette.Brown));
                var r = await tray.Roll(groups.ToArray());
                int parts = drops ? r[1] : 0;
                P.ouro += r[0];
                if (parts > 0) PlayerState.Add(P.partes, m.Despojo, parts);
                PlaySfx("coin");
                tray.Result($"+{r[0]}", "moedas", Palette.Ochre);
                int xp = night ? CombatRules.NightXp(m.xp) : m.xp;
                int ups = P.GainXp(xp);
                if (ups > 0) PlaySfx("lvl");
                Log($"+{r[0]} moedas" + (parts > 0 ? $", +{parts} {(parts > 1 ? m.partes : m.parte)}" : "") +
                    (xp > 0 ? $", +{xp} de experiência{(night ? " (noite)" : "")}" : "") + "." +
                    (ups > 0 ? $" <color=#8448c4>Subiu para o nível {P.lvl}!</color> Vida e magia cheias." : ""));
                Bars();
            }
            else if (final == CombatResult.Derrota) Log("Você desmaiou... O mestre vira a página.");

            await _panels.Ask(acts, new[] { new Choice("Continuar", "ok", Palette.Green) });
            _panels.Close();
            if (final == CombatResult.Derrota) Faint();
            else QuestPing();
            UpdateHud();
            SaveGame();
            return final;
        }

        // Primeira letra maiúscula ("rabos de rato" → "Rabos de rato").
        private static string Cap(string s) => string.IsNullOrEmpty(s) ? s : char.ToUpper(s[0]) + s.Substring(1);

        // Desmaio: acorda na última fogueira, com vida e magia cheias e metade
        // do ouro, e os monstros vencidos voltam. Dentro de uma masmorra, o
        // mestre volta para a página da ilha.
        private void Faint()
        {
            int lost = P.ouro / 2;
            P.ouro -= lost; P.hp = P.hpMax; P.pm = P.pmMax;
            if (InDungeon) SetMap(-1);
            P.x = P.respawn % W.W; P.y = P.respawn / W.W;
            _walking = false;
            ClearPath();
            SnapCamera();
            RespawnMonsters();
            Narrate($"Você acorda no {Texts.Fogueiras[W.ObjAt(P.respawn).n]}, todo enfaixado. Perdeu {lost} moedas, e os monstros voltaram.");
            UpdateHud();
        }
    }
}
```

### 7.5 Ligar o encontro com um monstro desenhado

Para testar já, implemente o gancho `MeetMonster` num arquivo novo (ele é completado na Fase 8 com os outros eventos):

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameController.Events.cs
using Caderno.Core;
using Caderno.Data;
using Caderno.Sketch;
using Caderno.UI;
using UnityEngine;

namespace Caderno.Game
{
    // POR QUE: tudo o que acontece ao encostar em algo do mapa (Parte 1:
    // monstros desenhados, surpresas, covil, personagens, baús e fogueiras).
    // ESTRATÉGIA: cada gancho é `async void` porque é chamado do Update e
    // ninguém espera por ele; dentro, tudo é await em sequência.
    public partial class GameController
    {
        // Monstro desenhado no caminho: mostra a ficha e deixa escolher.
        async partial void MeetMonster(int index, MapObject o)
        {
            var m = _db.Monster(o.kind);
            string def = string.Join(" + ", System.Array.ConvertAll(P.DefenseDice(_db), d => d.ToString()));
            string v = await Dialog($"{m.UmMaiusculo} {m.nome}!",
                $"O mestre desenhou {m.Um} {m.nome} bem no caminho.\n" +
                $"{m.hp} de vida · ataque {AttackText(m)} · defesa {m.def}\n" +
                $"<size=16>Seu ataque: {P.AttackDie(_db)} · sua defesa: {(def.Length > 0 ? def : "nenhuma")}</size>",
                new[] { new Choice("Enfrentar", "luta", Palette.Red), new Choice("Deixar pra lá", "nao") },
                MonsterArt.Get(o.kind));
            if (v != "luta") return;
            if (await Combat(o.kind) != CombatResult.Vitoria) return;
            L.dead.Add(index);
            _map.AddMark(IconArt.Cross(index % M.W * MapView.T, index / M.W * MapView.T, MapView.T, (uint)index), false);
            SaveGame();
        }

        // Dados de ataque como aparecem na ficha: à noite, com o dado a mais.
        private string AttackText(MonsterDef m) => NightBonus ? $"{CombatRules.NightAttack(m.atk)} (noite)" : m.atk.ToString();
    }
}
```

### ✅ Checkpoint da Fase 7
- Andar até um monstro desenhado abre a ficha dele com o desenho sendo traçado. "Deixar pra lá" fecha; "Enfrentar" abre a luta.
- Na luta: o monstro é desenhado à esquerda, a bandeja mostra "Seu ataque · Espada de madeira" com um d6 quadrado, os números trocam e param, e aparece a conta. Contra o Esqueleto aparece também "Defesa: Esqueleto" com um d4 triângulo e "a − d = dano".
- O turno do monstro vem logo depois, em roxo, e a folha treme quando você toma dano.
- Vencer rola as moedas em amarelo e os despojos em marrom ("Rabos de rato", 1d3), mostra a experiência e, de volta ao mapa, o mestre faz um X vermelho em cima do monstro.
- À noite, a ficha e a folha da luta mostram o ataque com um dado a mais (Lobo `2d10`), a lua com "noite: +1 dado de ataque, +50% de experiência", e a experiência vem com "(noite)".
- Perder leva de volta à fogueira inicial com metade do ouro, e os monstros vencidos voltam (sem X).
- Teclas 1 a 4 apertam Atacar, Feitiço, Poção e Fugir.

#### Problemas comuns
- **"InvalidOperationException: Awaitable already completed":** um mesmo `Awaitable` foi esperado duas vezes. Cada `Ask` e cada `Roll` cria um novo; não guarde um para esperar de novo.
- **Botões continuam clicáveis enquanto os dados rolam:** é o esperado que não estejam. `Ask` limpa os botões ao escolher, e eles só voltam no próximo `Ask`.
- **Números dos dados fora do lugar no primeiro quadro:** a bandeja ainda não tinha tamanho. O `Tick` seguinte corrige.

Próxima fase: **Fogueiras, masmorras, missões e o dragão**.

---

# Parte 11 — Implementação Unity: Fase 8 (Fogueiras, masmorras, missões e o dragão)

## Fase 8 — Fogueiras, masmorras, missões e o dragão

> Objetivo desta fase: o resto da aventura. Encontros surpresa no mato, personagens com dicas e presentes, baús com rolagem de sorte, fogueiras de acampamento (descansar de graça, com os monstros voltando, e guerreiros que vendem equipamento, magias, poções e tochas e compram despojos), a mochila, as masmorras com os chefes, as missões e o Dragão Vermelho com o fim do jogo.

### 8.1 `GameController.Places.cs`

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameController.Places.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Caderno.Core;
using Caderno.Data;
using Caderno.Sketch;
using Caderno.UI;
using UnityEngine;
using UnityEngine.UIElements;
using Random = UnityEngine.Random;

namespace Caderno.Game
{
    // POR QUE: os lugares e encontros da Parte 1 que não são o monstro
    // desenhado (esse ficou em GameController.Events.cs, Fase 7).
    // ESTRATÉGIA: encontros usam Dialog/Ask com await; fogueira e mochila são
    // folhas de "compra e clique" que se redesenham inteiras a cada ação,
    // guardando a rolagem para o jogador não perder o lugar na lista.
    public partial class GameController
    {
        // ---------- encontro surpresa ----------

        // Um monstro da região (25% de chance de ser da região anterior) pula do
        // mato. Com missão de derrotar ou juntar desta região, metade das vezes
        // vem o monstro pedido.
        async partial void Ambush(int tier)
        {
            var pool = IslandGenerator.Pools[Mathf.Max(1, Random.value < 0.25f ? tier - 1 : tier)];
            var want = WantedKinds(tier);
            string kind = want.Count > 0 && Random.value < 0.5f ? want[_dice.Next(want.Count)] : pool[_dice.Next(pool.Length)];
            var m = _db.Monster(kind);
            string v = await Dialog("Surpresa!",
                $"{m.UmMaiusculo} {m.nome} pula do meio do mato!\n{m.hp} de vida · ataque {AttackText(m)} · defesa {m.def}\n" +
                $"<size=16>Fugir agora: role 1d20 e tire {CombatRules.AmbushFleeTarget} ou mais. Se falhar, ele ataca primeiro.</size>",
                new[] { new Choice("Enfrentar", "luta", Palette.Red), new Choice("Tentar fugir (d20)", "fuga") },
                MonsterArt.Get(kind));
            if (v == "luta") { await Combat(kind); return; }

            var c = _panels.Open("dialog");
            c.Add(Ui.Heading("Fugir!"));
            var tray = new DiceTray(_dice, true);
            c.Add(tray);
            var log = Ui.Text("", "clog");
            c.Add(log);
            var acts = Ui.Actions();
            c.Add(acts);
            int d = (await tray.Roll(new DiceTray.Group("Fugir", new List<int> { 20 }, Palette.Ink)))[0];
            if (d >= CombatRules.AmbushFleeTarget)
            {
                tray.Result($"{d}", "escapou!", Palette.Green);
                log.text = $"Você some no mato antes que {m.nome} perceba.";
                await _panels.Ask(acts, new[] { new Choice("Ufa!", "ok", Palette.Green) });
                _panels.Close();
                return;
            }
            tray.Result($"{d}", "não deu!", Palette.Red);
            await Awaitable.WaitForSecondsAsync(0.9f);
            await Combat(kind, ambush: true);
        }

        // ---------- personagens ----------

        // Quem tem "!" dá missões (GameController.Quests.cs). Os outros dão uma
        // dica (outra a cada conversa); um a cada três dá presente na primeira.
        async partial void Talk(int index, MapObject o)
        {
            if (o.quest) { await QuestGiver(index, o); return; }
            string extra = "";
            if (G.talked.Add(index) && o.presente)
            {
                if (o.fala % 2 == 1) { P.pocaoVida++; extra = "\n<b>Ganhou uma Poção de vida!</b>"; }
                else { int g = 10 * W.tier[index]; P.ouro += g; extra = $"\n<b>Ganhou {g} moedas!</b>"; PlaySfx("coin"); }
            }
            G.conversa.TryGetValue(index, out int times);
            G.conversa[index] = times + 1;
            await Dialog("Alguém no caminho", $"\"{Texts.Npc[(o.fala + times * 9) % Texts.Npc.Length]}\"{extra}",
                new[] { new Choice("Valeu!", "ok") }, PeopleArt.Npc(Rng.Hash(index, 5), Palette.Blue));
            UpdateHud();
            SaveGame();
        }

        // ---------- baú ----------

        // Rola 1d20 de sorte: 1–13 moedas, 14–18 poção, 19–20 equipamento.
        async partial void OpenChest(int index, MapObject o)
        {
            var c = _panels.Open("dialog");
            c.Add(Ui.Heading("Um baú!"));
            c.Add(Ui.Text("O mestre desenha um baú. Role a sorte para ver o que tem dentro."));
            var tray = new DiceTray(_dice, true);
            c.Add(tray);
            var log = Ui.Text("", "clog");
            c.Add(log);
            var acts = Ui.Actions();
            c.Add(acts);

            int luck = (await tray.Roll(new DiceTray.Group("Sorte", new List<int> { 20 }, Palette.Ink)))[0];
            if (luck <= 13)
            {
                await Awaitable.WaitForSecondsAsync(0.5f);
                int g = (await tray.Roll(new DiceTray.Group("Moedas", Enumerable.Repeat(8, o.tier + 1).ToList(), Palette.Yellow)))[0];
                P.ouro += g;
                PlaySfx("coin");
                tray.Result($"+{g}", "moedas", Palette.Ochre);
                log.text = $"{g} moedas brilhando lá dentro!";
            }
            else if (luck <= 18)
            {
                var it = _db.Item(luck % 2 == 1 ? "pocao_vida" : "pocao_mana");
                P.AddPotion(it.id, 1);
                tray.Result($"{luck}", it.nome, it.cor);
                log.text = $"Uma {it.nome}!";
            }
            else
            {
                var it = _db.Item(Loot(o.tier));
                P.bolsa.Add(it.id);
                tray.Result($"{luck}!", "tesouro!", Palette.Red);
                log.text = $"<b>{it.nome}</b> ({it.dado})! Está na mochila.";
            }
            L.opened.Add(index);
            _map.AddMark(IconArt.Cross(index % M.W * MapView.T, index / M.W * MapView.T, MapView.T, (uint)index), false);
            await _panels.Ask(acts, new[] { new Choice("Fechar o baú", "ok", Palette.Green) });
            _panels.Close();
            UpdateHud();
            SaveGame();
        }

        // ---------- covil e fim ----------

        async partial void EnterLair(int index)
        {
            var m = _db.Monster("dragao");
            string v = await Dialog("Covil do Dragão",
                $"Um buraco escuro, ossos na entrada e cheiro de fumaça. Lá dentro, algo enorme respira.\n" +
                $"{m.hp} de vida · ataque {m.atk} · defesa {m.def}\n<size=16>Daqui não dá pra fugir fácil: d20 ≥ 15.</size>",
                new[] { new Choice("Entrar", "luta", Palette.Red), new Choice("Agora não", "nao") }, MonsterArt.Get("dragao"));
            if (v != "luta") return;
            if (await Combat("dragao", intro: "O Dragão Vermelho abre as asas. O mestre troca para a caneta vermelha.") != CombatResult.Vitoria) return;
            G.won = true;
            _map.AddMark(IconArt.Cross(index % W.W * MapView.T, index / W.W * MapView.T, MapView.T, (uint)index), false);
            SaveGame();
            string e = await Dialog("FIM!",
                $"{P.nome} derrotou o Dragão Vermelho! O mestre escreve \"FIM\" bem grande e desenha uma coroa.\n" +
                $"{G.steps} passos · {G.kills} monstros vencidos · nível {P.lvl} · {P.ouro} moedas",
                new[] { new Choice("Continuar explorando", "cont", Palette.Green), new Choice("Nova aventura", "novo") },
                IconArt.Get(IconKind.Star, Palette.Yellow));
            if (e == "novo")
            {
                bool shown = false;
                ShowTitle(ref shown);
                if (!shown) NewRun(P.nome, (uint)Random.Range(1, int.MaxValue));
            }
        }

        // ---------- fogueira ----------

        // Chegar numa fogueira marca ali o lugar de acordar e abre o acampamento.
        partial void EnterCamp(int index, MapObject o)
        {
            P.respawn = index;
            if (G.seen.Add("v" + o.n)) Narrate($"Você chega no {Texts.Fogueiras[o.n]} e se aquece na fogueira. Se desmaiar, acorda aqui.");
            RenderCamp(index, 0f);
        }

        // Nível da loja de uma fogueira: 1 nas regiões 1–2, 2 nas 3–4, 3 nas 5–6.
        private int CampLevel(int index) => Mathf.Min(3, Mathf.CeilToInt(W.tier[index] / 2f));

        // Descansar: vida e magia cheias, passa a noite se for tarde, e os
        // monstros vencidos voltam (Parte 1, Fogueiras).
        private void Rest()
        {
            P.hp = P.hpMax; P.pm = P.pmMax;
            bool late = G.clock >= 60;
            if (late) { G.day++; G.clock = 5; }
            RespawnMonsters();
            PlaySfx("lvl");
            Narrate(late ? $"Você dorme perto do fogo e acorda de manhã. Dia {G.day}. O mestre apaga os X dos monstros com a borracha: eles voltaram."
                : "Você descansa perto do fogo. O mestre apaga os X dos monstros com a borracha: eles voltaram.");
        }

        // Folha do acampamento: descansar, e o que os guerreiros vendem
        // (ferreiro andarilho, maga, mercador) e compram.
        private void RenderCamp(int index, float scroll)
        {
            var c = _panels.Open("village");
            int n = W.ObjAt(index).n, lvl = CampLevel(index);
            c.Add(Ui.Heading(Texts.Fogueiras[n]));
            c.Add(Ui.Text($"{Texts.FogueiraDescricao[n % Texts.FogueiraDescricao.Length]} Você tem {P.ouro} moedas."));
            bool late = G.clock >= 60;
            c.Add(ShopRow(index, Ui.Icon(IconKind.Fire), "Descansar na fogueira", late ? "vida e magia cheias, dorme até de manhã" : "vida e magia cheias",
                "os monstros vencidos voltam (chefes e dragão, não)", 0, late ? "Dormir" : "Descansar", false, Rest));

            c.Add(Ui.Heading("Ferreiro andarilho", "h3"));
            foreach (var it in _db.items.Where(i => i.loja <= lvl && i.slot != Slot.Pocao))
            {
                string cur = P.Equipped(it.slot), slotName = it.slot.ToString().ToLower();
                string note = P.Owns(it.id) ? "você já tem" : cur != "" ? $"sua {slotName}: {_db.Item(cur).dado}" : $"sem {slotName}";
                var item = it;
                c.Add(ShopRow(index, Ui.Icon(it.icon, it.cor), it.nome, $"{it.dado} de {(it.slot == Slot.Arma ? "ataque" : "defesa")}", note,
                    it.preco, "Comprar", P.Owns(it.id) || P.ouro < it.preco, () => Buy(item)));
            }

            c.Add(Ui.Heading("Maga", "h3"));
            foreach (var s in _db.spells.Where(s => s.loja <= lvl))
            {
                bool has = P.magias.Contains(s.id);
                var spell = s;
                c.Add(ShopRow(index, Ui.Icon(IconKind.Scroll, s.cor), s.nome,
                    $"{s.dado} {(s.tipo == SpellKind.Cura ? "de cura" : "de dano, ignora defesa")} · {s.pm} PM", has ? "você já sabe" : null,
                    s.preco, "Comprar", has || P.ouro < s.preco, () => { P.ouro -= spell.preco; P.magias.Add(spell.id); PlaySfx("coin"); }));
            }

            c.Add(Ui.Heading("Mercador", "h3"));
            foreach (var it in _db.items.Where(i => i.slot == Slot.Pocao))
            {
                var pot = it;
                c.Add(ShopRow(index, Ui.Icon(IconKind.Potion, it.cor), it.nome, $"{it.dado} de {(it.efeito == PotionEffect.Vida ? "vida" : "magia")}",
                    $"você tem {P.Potions(it.id)}", it.preco, "Comprar", P.ouro < it.preco, () => { P.ouro -= pot.preco; P.AddPotion(pot.id, 1); PlaySfx("coin"); }));
            }
            c.Add(ShopRow(index, Ui.Icon(IconKind.Torch), "Tocha", $"acende sozinha no escuro, dura {TochaPassos} passos", $"você tem {P.tochas}",
                TochaPreco, "Comprar", P.ouro < TochaPreco, () => { P.ouro -= TochaPreco; P.tochas++; PlaySfx("coin"); }));

            // Despojos valem (região do monstro) moedas cada; os guardados para
            // uma missão de juntar não entram na venda.
            var parts = P.partes.Where(k => k.n > 0).ToList();
            if (parts.Count > 0)
            {
                c.Add(Ui.Heading("Vender despojos", "h3"));
                foreach (var part in parts)
                {
                    var m = _db.Monster(part.id);
                    int price = TierOf(part.id), need = PartsNeeded(part.id), extra = part.n - need;
                    string id = part.id;
                    c.Add(ShopRow(index, MonsterIcon(id), $"{part.n} {(part.n > 1 ? m.partes : m.parte)}", $"{price} cada",
                        need > 0 ? $"{need} guardados para uma missão" : null, Mathf.Max(0, extra) * price, "Vender", extra <= 0,
                        () => { PlayerState.Add(P.partes, id, -extra); P.ouro += extra * price; PlaySfx("coin"); }));
                }
            }

            if (P.bolsa.Count > 0)
            {
                c.Add(Ui.Heading("Vender", "h3"));
                for (int k = 0; k < P.bolsa.Count; k++)
                {
                    var it = _db.Item(P.bolsa[k]);
                    int slotIndex = k;
                    c.Add(ShopRow(index, Ui.Icon(it.icon, it.cor), it.nome, it.dado.ToString(), null, it.preco / 2, "Vender", false,
                        () => { P.bolsa.RemoveAt(slotIndex); P.ouro += it.preco / 2; PlaySfx("coin"); }));
                }
            }

            var acts = Ui.Actions();
            acts.Add(Ui.Btn("Seguir viagem", () => _panels.Close(), Palette.Green));
            c.Add(acts);
            c.schedule.Execute(() => _panels.ScrollY = scroll);   // depois do layout, senão a rolagem volta a 0
        }

        // Compra um equipamento: ele é equipado na hora e o antigo vai para a mochila.
        private void Buy(ItemDef it)
        {
            P.ouro -= it.preco;
            string old = P.Equipped(it.slot);
            if (old != "") P.bolsa.Add(old);
            P.SetEquipped(it.slot, it.id);
            PlaySfx("coin");
        }

        // Uma linha de loja: ícone, nome + detalhe, observação, preço (0 = de
        // graça, sem preço) e botão. Depois da ação, salva e redesenha a folha
        // da fogueira no mesmo ponto da rolagem.
        private VisualElement ShopRow(int camp, VisualElement icon, string name, string info, string note, int price, string button, bool off, Action act)
        {
            var row = new VisualElement();
            row.AddToClassList("row");
            row.Add(icon);
            var text = $"{name} <size=15>{info}</size>";
            if (note != null) text += $"\n<size=15><color=#7b7d88>{note}</color></size>";
            row.Add(Ui.Text(text, "row-name"));
            var priceRow = new VisualElement();
            priceRow.AddToClassList("row-price");
            if (price > 0)
            {
                priceRow.Add(new Label(price.ToString()));
                priceRow.Add(Ui.Icon(IconKind.Coin, null, 20));
            }
            row.Add(priceRow);
            var b = Ui.Btn(button, () =>
            {
                act();
                UpdateHud();
                SaveGame();
                RenderCamp(camp, _panels.ScrollY);
            });
            b.SetEnabled(!off);
            row.Add(b);
            return row;
        }

        // ---------- mochila ----------

        partial void OpenBag()
        {
            if (W == null || _panelOpen || _walking) return;
            RenderBag(null);
        }

        // Folha da mochila: equipado, itens guardados, poções e magias.
        private void RenderBag(string message)
        {
            var c = _panels.Open("bag");
            c.Add(Ui.Heading($"Mochila de {P.nome}"));
            c.Add(Ui.Text($"Nível {P.lvl} · {P.xp}/{PlayerState.XpNext(P.lvl)} de experiência · vida {P.hp}/{P.hpMax} · magia {P.pm}/{P.pmMax} · {P.ouro} moedas"));

            c.Add(Ui.Heading("Equipado", "h3"));
            foreach (var slot in new[] { Slot.Arma, Slot.Escudo, Slot.Armadura })
            {
                string id = P.Equipped(slot);
                var it = id != "" ? _db.Item(id) : null;
                var icon = it != null ? Ui.Icon(it.icon, it.cor) : Ui.Icon(slot == Slot.Arma ? IconKind.Sword : slot == Slot.Escudo ? IconKind.Shield : IconKind.Armor, new Color(0.87f, 0.87f, 0.87f));
                c.Add(Ui.Row(icon, Ui.Text($"{slot}: {(it != null ? $"{it.nome} <size=15>{it.dado}</size>" : "—")}", "row-name")));
            }

            c.Add(Ui.Heading("Na mochila", "h3"));
            if (P.bolsa.Count == 0) c.Add(Ui.Text("Vazia. Itens que sobram ao comprar ou achar em baús vêm para cá.", "small"));
            for (int k = 0; k < P.bolsa.Count; k++)
            {
                var it = _db.Item(P.bolsa[k]);
                int slotIndex = k;
                c.Add(Ui.Row(Ui.Icon(it.icon, it.cor), Ui.Text($"{it.nome} <size=15>{it.dado}</size>", "row-name"),
                    Ui.Btn("Equipar", () =>
                    {
                        P.bolsa.RemoveAt(slotIndex);
                        string old = P.Equipped(it.slot);
                        if (old != "") P.bolsa.Add(old);
                        P.SetEquipped(it.slot, it.id);
                        AfterBag(null);
                    })));
            }
            foreach (var id in new[] { "pocao_vida", "pocao_mana" })
            {
                var it = _db.Item(id);
                var b = Ui.Btn("Beber", () =>
                {
                    int v = Dice.RollSum(_dice, it.dado);
                    P.AddPotion(it.id, -1);
                    int g = it.efeito == PotionEffect.Vida ? Mathf.Min(P.hpMax - P.hp, v) : Mathf.Min(P.pmMax - P.pm, v);
                    if (it.efeito == PotionEffect.Vida) P.hp += g; else P.pm += g;
                    AfterBag($"Rolou {it.dado}: +{g} de {(it.efeito == PotionEffect.Vida ? "vida" : "magia")}.");
                });
                b.SetEnabled(P.Potions(id) > 0);
                c.Add(Ui.Row(Ui.Icon(IconKind.Potion, it.cor), Ui.Text($"{it.nome} ×{P.Potions(id)} <size=15>{it.dado}</size>", "row-name"), b));
            }

            c.Add(Ui.Row(Ui.Icon(P.tocha > 0 ? IconKind.Torch : IconKind.TorchOff), Ui.Text($"Tochas ×{P.tochas} <size=15>" +
                (P.tocha > 0 ? $"uma acesa, mais {P.tocha} passos" : $"acendem sozinhas no escuro, {TochaPassos} passos cada") + "</size>", "row-name")));
            foreach (var part in P.partes.Where(k => k.n > 0))
            {
                var m = _db.Monster(part.id);
                c.Add(Ui.Row(MonsterIcon(part.id), Ui.Text($"{Cap(part.n > 1 ? m.partes : m.parte)} ×{part.n} <size=15>despojo de {m.nome}</size>", "row-name")));
            }

            c.Add(Ui.Heading("Missões", "h3"));
            if (P.missoes.Count == 0) c.Add(Ui.Text("Nenhuma. Quem tem \"!\" no balão tem serviço pra você.", "small"));
            foreach (var q in P.missoes)
            {
                int pr = Mathf.Min(q.n, Progress(q));
                string who = Texts.Quem[W.ObjAt(q.npc).tier - 1];
                c.Add(Ui.Row(Ui.Icon(IconKind.Scroll, Palette.Ochre), Ui.Text($"{QuestText(q)} <size=15>{pr}/{q.n}</size>\n" +
                    $"<size=15><color=#7b7d88>{(pr >= q.n ? "pronta: volte a " : "para ")}{who}</color></size>", "row-name")));
            }

            c.Add(Ui.Heading("Magias", "h3"));
            if (P.magias.Count == 0) c.Add(Ui.Text("Nenhuma ainda. As magas das fogueiras vendem pergaminhos.", "small"));
            foreach (var id in P.magias)
            {
                var s = _db.Spell(id);
                var row = Ui.Row(Ui.Icon(IconKind.Scroll, s.cor), Ui.Text($"{s.nome} <size=15>{s.dado} · {s.pm} PM</size>", "row-name"));
                if (s.tipo == SpellKind.Cura)
                {
                    var b = Ui.Btn("Usar", () =>
                    {
                        int g = Mathf.Min(P.hpMax - P.hp, Dice.RollSum(_dice, s.dado));
                        P.pm -= s.pm; P.hp += g;
                        AfterBag($"Rolou {s.dado}: +{g} de vida.");
                    });
                    b.SetEnabled(P.pm >= s.pm && P.hp < P.hpMax);
                    row.Add(b);
                }
                c.Add(row);
            }

            if (message != null) c.Add(Ui.Text(message, "small"));
            var acts = Ui.Actions();
            acts.Add(Ui.Btn("Fechar", () => _panels.Close(), Palette.Green));
            acts.Add(Ui.Btn("Tela inicial", () =>
            {
                _panels.Close();
                SaveGame();
                bool shown = false;
                ShowTitle(ref shown);
            }));
            c.Add(acts);
        }

        // Depois de qualquer ação da mochila: atualiza, salva e redesenha.
        private void AfterBag(string message)
        {
            UpdateHud();
            SaveGame();
            RenderBag(message);
        }
    }
}
```

### ✅ Checkpoint da Fase 8
- Entrar no Acampamento Apontador abre a folha da fogueira. Com moedas suficientes, comprar a Espada de ferro do ferreiro andarilho troca o ataque do HUD para `2d6`, e a espada de madeira aparece em "Vender".
- Fogueiras mais longe (regiões 3–4 e 5–6) vendem os itens de nível 2 e 3.
- **Descansar** é de graça: enche vida e magia, e os monstros vencidos voltam ao mapa sem o X. Chefes vencidos continuam riscados.
- **B** abre a mochila; equipar troca o item com o da mochila; beber poção rola os dados dela.
- Andar até um baú rola o d20 de sorte; depois o baú ganha um X no mapa.
- Personagens dão a dica; os que dão presente só dão uma vez.
- Andando no mato, às vezes aparece "Surpresa!". Fugir rola o d20; falhar faz o monstro atacar primeiro.
- O covil, no ponto mais longe da ilha, abre a luta contra o Dragão Vermelho; vencer mostra a folha "FIM!".
- O mercador vende **Tocha** (5 moedas). Depois do passo 60 do dia, descansar vira **Dormir**, e dormir leva para a manhã do dia seguinte.
- **Masmorra:** pisar num arco de pedra com coroa mostra o chefe e pergunta se quer descer. "Descer" troca a página: aparece a escada com "Saída", tudo escuro em volta e a tocha acendendo. No fundo, o chefe (com o nome escrito em vermelho) abre a ficha com "fugir de um chefe: d20 ≥ 13". Vencer dá o tesouro atrás do trono; subir pela escada volta para a entrada na ilha, agora riscada com X.
- **Missões:** falar com quem tem "!" oferece "Derrotar 10 ratos gigantes" (ou o par da região). Aceitar mostra a caixinha "Missões" no HUD com `0/10`. Os encontros surpresa trazem o monstro pedido mais vezes; ao completar, o mestre avisa, a linha fica verde e falar de novo paga e oferece a próxima (juntar despojos), depois a do chefe.
- Na fogueira, "Vender despojos" vende só o que sobra além do que uma missão de juntar precisa.

#### Problemas comuns
- **A folha da fogueira volta para o topo a cada compra:** a rolagem precisa ser aplicada depois do layout, por isso o `schedule.Execute`.
- **Dois cliques rápidos compram duas vezes:** o primeiro clique já redesenha a folha e troca os botões; se ainda acontecer, desligue o botão (`SetEnabled(false)`) no começo da ação.
- **Ao subir da masmorra o herói aparece no lugar errado:** `ox`/`oy` precisam ser guardados antes de `SetMap`, porque `SetMap` não mexe na posição.
- **A missão de derrotar não conta:** só valem os vencidos depois de aceitar (`inicio`). Confira se `Combat` soma `P.abates` com o id do monstro (`rato`, não o nome).

### 8.2 `GameController.Dungeons.cs`: masmorras e chefes

Descer e subir é só trocar o mapa atual (`SetMap`, Fase 5): o `MapView` passa a mostrar o interior, e o herói lembra onde estava na ilha.

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameController.Dungeons.cs
using System.Linq;
using Caderno.Core;
using Caderno.Data;
using Caderno.Sketch;
using Caderno.UI;
using UnityEngine;

namespace Caderno.Game
{
    // POR QUE: as masmorras e os chefes (Parte 1, Masmorras e chefes): descer
    // pela entrada da ilha, achar o rei no fundo, vencer e subir de volta.
    // ESTRATÉGIA: trocar de mapa é só SetMap (Fase 5): o MapView passa a
    // mostrar o interior e o estado dele (L). O herói lembra onde estava na
    // ilha (ox, oy) para voltar ao mesmo lugar.
    public partial class GameController
    {
        // Pisou numa entrada: mostra o chefe e pergunta se quer descer.
        async partial void EnterDungeon(int index, MapObject o)
        {
            var m = _db.Monster("chefe_" + o.kind);
            bool done = G.cleared.Contains(o.n);
            string v = await Dialog(Texts.NomeMasmorra(o.kind),
                (done ? $"Você já derrotou {m.O} {m.nome}. Lá embaixo ainda tem o que ficou para trás.\n"
                      : $"Uma escada desce para o escuro. Lá no fundo mora {m.O} <b>{m.nome}</b>.\n") +
                $"{m.hp} de vida · ataque {m.atk} · defesa {m.def}\n" +
                $"<size=16>Lá dentro é sempre escuro: leve tochas. Você tem {P.tochas}{(P.tocha > 0 ? " e uma acesa" : "")}.</size>",
                new[] { new Choice("Descer", "sim", Palette.Red), new Choice("Agora não", "nao") }, MonsterArt.Get(m.id));
            if (v != "sim") return;
            P.ox = P.x; P.oy = P.y;
            SetMap(o.n);
            P.x = M.start % M.W; P.y = M.start / M.W;
            SnapCamera();
            BurnTorch(false);
            _map.RevealAround(P.x, P.y, false, RevealRadius2());
            Narrate(P.tocha > 0 ? "O mestre vira a página e desenha a escada descendo. Sua tocha ilumina as paredes."
                : "O mestre vira a página... está tudo escuro. Sem tocha, você só vê o que está do seu lado.");
            UpdateHud();
            SaveGame();
        }

        // Pisou de novo na escada: pergunta se quer subir.
        async partial void LeaveDungeon()
        {
            string v = await Dialog("Escada", "Subir de volta para a ilha?",
                new[] { new Choice("Subir", "sim", Palette.Green), new Choice("Ficar aqui", "nao") }, IconArt.Get(IconKind.Map));
            if (v != "sim") return;
            SetMap(-1);
            P.x = P.ox; P.y = P.oy;
            SnapCamera();
            Narrate("O mestre volta para a página da ilha.");
            UpdateHud();
            SaveGame();
        }

        // O chefe no fundo. Vencer deixa X nele, risca a entrada na ilha e
        // abre o baú do tesouro atrás do trono.
        async partial void MeetBoss(int index, MapObject o)
        {
            var m = _db.Monster("chefe_" + o.kind);
            string def = string.Join(" + ", System.Array.ConvertAll(P.DefenseDice(_db), d => d.ToString()));
            string v = await Dialog($"{m.nome}!",
                $"No fundo da masmorra, num trono rabiscado com caneta dourada, está {m.O} <b>{m.nome}</b>.\n" +
                $"{m.hp} de vida · ataque {m.atk} · defesa {m.def}\n" +
                $"<size=16>Seu ataque: {P.AttackDie(_db)} · sua defesa: {(def.Length > 0 ? def : "nenhuma")} · fugir de um chefe: d20 ≥ 13.</size>",
                new[] { new Choice("Enfrentar", "luta", Palette.Red), new Choice("Agora não", "nao") }, MonsterArt.Get(m.id));
            if (v != "luta") return;
            if (await Combat(m.id, intro: $"{m.nome} se levanta do trono. O mestre pinta a coroa de amarelo bem forte.") != CombatResult.Vitoria) return;
            L.dead.Add(index);
            G.cleared.Add(M.masmorra);
            _map.AddMark(IconArt.Cross(index % M.W * MapView.T, index / M.W * MapView.T, MapView.T, (uint)index), false);
            var it = _db.Item(Loot(M.tier[index]));
            P.bolsa.Add(it.id);
            SaveGame();
            await Dialog("Tesouro do chefe!",
                $"Atrás do trono tinha um baú. Dentro: <b>{it.nome}</b> ({it.dado})! Está na mochila.\n" +
                "<size=16>Volte pela escada para sair. Na ilha, o mestre risca a entrada desta masmorra.</size>",
                new[] { new Choice("Oba!", "ok", Palette.Green) }, IconArt.Get(IconKind.Chest));
            UpdateHud();
            SaveGame();
        }

        // Equipamento de uma loja à frente da região (nunca a Lâmina do
        // Dragão): o baú raro, o tesouro do chefe e o prêmio da 3ª missão.
        private string Loot(int tier)
        {
            int lvl = Mathf.Min(3, Mathf.CeilToInt(tier / 2f) + 1);
            var ids = _db.items.Where(i => i.loja == lvl && i.slot != Slot.Pocao && i.id != "lamina_dragao").ToList();
            return ids[_dice.Next(ids.Count)].id;
        }
    }
}
```

### 8.3 `GameController.Quests.cs`: missões

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameController.Quests.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Caderno.Core;
using Caderno.Data;
using Caderno.Sketch;
using Caderno.UI;
using UnityEngine;

namespace Caderno.Game
{
    // POR QUE: as missões dos personagens com "!" (Parte 1, Missões): cada
    // um dá 3 em sequência (derrotar, juntar despojos e o chefe da masmorra).
    // ESTRATÉGIA: a lista de missões de um personagem não é salva: ela sai
    // da semente da ilha e do índice dele, como no protótipo. O save guarda
    // só quantas ele já entregou (P.etapas) e as aceitas (P.missoes).
    public partial class GameController
    {
        // Números por região (índice = região - 1). Proposta de balanceamento.
        private static readonly int[] QuestMatar = { 10, 10, 8, 8, 6, 5 };
        private static readonly int[] QuestColetar = { 20, 18, 16, 14, 12, 10 };
        private static readonly int[] QuestOuro = { 30, 60, 110, 180, 280, 420 };
        private static readonly int[] QuestXp = { 15, 30, 55, 90, 140, 210 };

        // As missões do personagem `index`: derrotar A, juntar despojos de B e
        // derrotar o chefe de A (ou de B, se a masmorra de A não existir).
        private List<Quest> QuestsOf(int index, MapObject o)
        {
            var pool = IslandGenerator.Pools[o.tier];
            uint h = Rng.Hash((int)W.seed, index, 5);
            string a = pool[h % 2], b = pool[(h + 1) % 2];
            int tr = o.tier - 1;
            var list = new List<Quest>
            {
                new Quest { npc = index, etapa = 0, tipo = "matar", kind = a, n = QuestMatar[tr] },
                new Quest { npc = index, etapa = 1, tipo = "coletar", kind = b, n = QuestColetar[tr] },
            };
            bool Has(string k) => W.dungeons.Exists(d => W.ObjAt(d).kind == k);
            string boss = Has(a) ? a : Has(b) ? b : null;
            if (boss != null) list.Add(new Quest { npc = index, etapa = 2, tipo = "chefe", kind = boss, n = 1 });
            return list;
        }

        private MonsterDef BossOf(Quest q) => _db.Monster("chefe_" + q.kind);

        // "Derrotar 10 ratos gigantes", "Juntar 18 presas de lobo", "Derrotar o Rei Rato".
        private string QuestText(Quest q) => q.tipo switch
        {
            "matar" => $"Derrotar {q.n} {_db.Monster(q.kind).pl}",
            "coletar" => $"Juntar {q.n} {_db.Monster(q.kind).partes}",
            _ => $"Derrotar {BossOf(q).O} {BossOf(q).nome}",
        };

        // Quanto já foi feito: vencidos desde que aceitou, despojos na mochila,
        // ou 1 se o chefe já foi vencido (mesmo antes de aceitar).
        private int Progress(Quest q) => q.tipo switch
        {
            "coletar" => PlayerState.Get(P.partes, q.kind),
            "chefe" => Mathf.Min(1, PlayerState.Get(P.abates, "chefe_" + q.kind)),
            _ => PlayerState.Get(P.abates, q.kind) - q.inicio,
        };

        // Moedas e experiência da missão: × 1, × 1,5 e × 2 da 1ª à 3ª.
        // Arredonda .5 para cima, como o Math.round do protótipo.
        private static (int ouro, int xp) QuestReward(int tier, int etapa)
        {
            double mult = 1 + etapa * 0.5;
            return ((int)Math.Round(QuestOuro[tier - 1] * mult, MidpointRounding.AwayFromZero),
                    (int)Math.Round(QuestXp[tier - 1] * mult, MidpointRounding.AwayFromZero));
        }

        private string QuestGiverName(Quest q) => Texts.Quem[W.ObjAt(q.npc).tier - 1];

        // Avisa (uma vez) quando uma missão fica pronta para entregar.
        partial void QuestPing()
        {
            foreach (var q in P.missoes)
                if (!q.avisado && Progress(q) >= q.n)
                {
                    q.avisado = true;
                    Narrate($"Missão cumprida: {QuestText(q)}! Volte a {QuestGiverName(q)} para receber.");
                }
        }

        // Linhas da caixinha de missões do HUD (Fase 6).
        partial void QuestLines(List<(string text, bool done)> lines)
        {
            foreach (var q in P.missoes)
            {
                int pr = Mathf.Min(q.n, Progress(q));
                bool done = pr >= q.n;
                lines.Add((done ? $"{QuestText(q)} {pr}/{q.n}\n<size=13>volte a {QuestGiverName(q)}</size>"
                                : $"{QuestText(q)} <color=#d6383a>{pr}/{q.n}</color>", done));
            }
        }

        // Região de um monstro comum (1 a 6).
        private static int TierOf(string kind)
        {
            for (int t = 1; t <= 6; t++) if (Array.IndexOf(IslandGenerator.Pools[t], kind) >= 0) return t;
            return 1;
        }

        // Despojos guardados para missões de juntar (não entram na venda).
        private int PartsNeeded(string kind) => P.missoes.Where(q => q.tipo == "coletar" && q.kind == kind).Sum(q => q.n);

        // Monstros que missões ativas desta região ainda pedem (encontro surpresa).
        private List<string> WantedKinds(int tier) =>
            P.missoes.Where(q => q.tipo != "chefe" && TierOf(q.kind) == tier && Progress(q) < q.n).Select(q => q.kind).ToList();

        // Desenho pequeno de um monstro (despojos na fogueira e na mochila).
        private static SketchElement MonsterIcon(string id, float size = 28)
        {
            var el = new SketchElement(MonsterArt.Get(id));
            el.style.width = size; el.style.height = size;
            el.style.flexShrink = 0;
            return el;
        }

        // Conversa com quem tem "!": entrega a missão pronta, mostra quanto
        // falta ou oferece a próxima.
        private async Awaitable QuestGiver(int index, MapObject o)
        {
            string nome = Texts.Quem[o.tier - 1];
            var list = QuestsOf(index, o);
            int stage = PlayerState.Get(P.etapas, index.ToString());
            var cur = P.missoes.Find(q => q.npc == index);
            var art = PeopleArt.Npc(Rng.Hash(index, 5), Palette.Blue, true);

            if (cur != null)
            {
                int pr = Mathf.Min(cur.n, Progress(cur));
                if (pr < cur.n)
                {
                    await Dialog(nome, $"\"E aí, {P.nome}? Ainda faltam {cur.n - pr}.\"\n<b>Missão:</b> {QuestText(cur)} · {pr}/{cur.n}",
                        new[] { new Choice("Já volto", "ok") }, art);
                    return;
                }
                if (cur.tipo == "coletar") PlayerState.Add(P.partes, cur.kind, -cur.n);
                var (ouro, xp) = QuestReward(o.tier, cur.etapa);
                P.ouro += ouro;
                PlaySfx("coin");
                int ups = P.GainXp(xp);
                if (ups > 0) PlaySfx("lvl");
                string prize = "";
                if (cur.tipo == "chefe")
                {
                    var it = _db.Item(Loot(o.tier + 1));
                    P.bolsa.Add(it.id);
                    prize = $"\nE ainda ganhou <b>{it.nome}</b> ({it.dado})! Está na mochila.";
                }
                P.missoes.Remove(cur);
                PlayerState.Add(P.etapas, index.ToString(), 1);
                UpdateHud();
                SaveGame();
                await Dialog(nome, $"\"Você conseguiu! Muito obrigado, {P.nome}!\"\n<b>+{ouro} moedas, +{xp} de experiência.</b>" +
                    (ups > 0 ? $" <color=#8448c4>Subiu para o nível {P.lvl}!</color>" : "") + prize,
                    new[] { new Choice("De nada!", "ok", Palette.Green) }, IconArt.Get(IconKind.Coin));
                return;
            }

            if (stage >= list.Count)
            {
                await Dialog(nome, "\"Graças a você a região está mais tranquila. O mestre devia desenhar uma estátua sua aqui!\"",
                    new[] { new Choice("Tchau!", "ok") }, art);
                return;
            }

            var next = list[stage];
            var (o2, x2) = QuestReward(o.tier, stage);
            var mm = _db.Monster(next.kind);
            string ask = next.tipo switch
            {
                "matar" => $"Os {mm.pl} não me deixam em paz! Derrota {next.n} deles pra mim?",
                "coletar" => $"Preciso de {next.n} {mm.partes} pra uma receita da minha avó. Consegue?",
                _ => $"Quem manda nesses bichos é {BossOf(next).O} {BossOf(next).nome}, lá no fundo da masmorra ({Texts.NomeMasmorra(next.kind)}). Dá um jeito nisso?",
            };
            string v = await Dialog($"{nome} pede ajuda",
                $"\"{ask}\"\n<b>Missão:</b> {QuestText(next)}\n" +
                $"<size=16>Recompensa: {o2} moedas e {x2} de experiência{(next.tipo == "chefe" ? ", mais um equipamento" : "")}." +
                (next.tipo == "coletar" ? $" Cada {mm.nome} vencido deixa 1d3 {mm.partes}." : "") + "</size>",
                new[] { new Choice("Aceitar", "sim", Palette.Green), new Choice("Agora não", "nao") },
                MonsterArt.Get(next.tipo == "chefe" ? "chefe_" + next.kind : next.kind));
            if (v != "sim") return;
            next.inicio = PlayerState.Get(P.abates, next.kind);
            P.missoes.Add(next);
            Narrate($"Missão anotada na margem do caderno: {QuestText(next)}.");
            QuestPing();
            UpdateHud();
            SaveGame();
        }
    }
}
```

As linhas da caixinha do HUD usam rich text: `<color>` pinta o progresso de vermelho e `<size=13>` deixa o "volte a..." menor.

Próxima fase: **Save e capa**.

---

# Parte 12 — Implementação Unity: Fase 9 (Save e capa)

## Fase 9 — Save e capa

> Objetivo desta fase: salvar a aventura a cada passo (com as masmorras visitadas, o relógio e as missões) e continuar de onde parou, e a capa do caderno com o nome do herói.

### 9.1 `SaveSystem`

```csharp
// Caminho: Assets/_Project/Scripts/Game/SaveSystem.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Caderno.Core;
using UnityEngine;

namespace Caderno.Game
{
    // O que já aconteceu num mapa (a ilha ou uma masmorra), do jeito que vai
    // para o JSON. n = -1 é a ilha.
    [Serializable]
    public class MapSave
    {
        public int n = -1;
        public string revealed;
        public List<int> dead = new List<int>(), opened = new List<int>();
        public List<long> trail = new List<long>();
    }

    // POR QUE: o que vai para o save (Parte 1, Salvamento). A ilha e as
    // masmorras não vão: nascem de novo da semente. Vai o herói e o que já
    // aconteceu em cada mapa.
    // ESTRATÉGIA: só listas e campos simples, porque o JsonUtility do Unity
    // não salva HashSet nem Dictionary. Os quadrados revelados viram uma
    // string de '0' e '1' (1632 letras na ilha), como no protótipo.
    [Serializable]
    public class SaveData
    {
        public int v = 2;
        public uint seed;
        public PlayerState player;
        public MapSave island;
        public List<MapSave> dungeons = new List<MapSave>();
        public List<int> talked = new List<int>(), cleared = new List<int>();
        public List<string> seen = new List<string>();
        public List<Count> conversa = new List<Count>();
        public int steps, kills, clock = 10, day = 1;
        public bool won;
    }

    // O save da versão 1 (antes das masmorras), só para converter.
    [Serializable]
    internal class SaveDataV1
    {
        public int v;
        public uint seed;
        public PlayerState player;
        public string revealed;
        public List<int> dead, opened, talked;
        public List<long> trail;
        public List<string> seen;
        public int steps, kills;
        public bool won;
    }

    // POR QUE: guardar e ler o SaveData.
    // ESTRATÉGIA: PlayerPrefs (uma chave com o JSON). Funciona igual no PC,
    // no Android e no navegador (WebGL), onde arquivos em disco são chatos.
    // Um save da versão 1 é convertido: a ilha da mesma semente é a mesma,
    // só ganhou masmorras e personagens.
    public static class SaveSystem
    {
        private const string Key = "caderno-aventuras-save-v2", OldKey = "caderno-aventuras-save-v1";

        public static void Save(SaveData d)
        {
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(d));
            PlayerPrefs.Save();
        }

        // O save, ou null se não houver (ou se não der para ler).
        public static SaveData Load()
        {
            try
            {
                if (PlayerPrefs.HasKey(Key))
                {
                    var d = JsonUtility.FromJson<SaveData>(PlayerPrefs.GetString(Key));
                    return d != null && d.v == 2 && d.player != null ? d : null;
                }
                if (!PlayerPrefs.HasKey(OldKey)) return null;
                var o = JsonUtility.FromJson<SaveDataV1>(PlayerPrefs.GetString(OldKey));
                if (o == null || o.v != 1 || o.player == null) return null;
                return new SaveData
                {
                    seed = o.seed, player = o.player, steps = o.steps, kills = o.kills, won = o.won,
                    seen = o.seen ?? new List<string>(), talked = o.talked ?? new List<int>(),
                    island = new MapSave { revealed = o.revealed, dead = o.dead, opened = o.opened, trail = o.trail },
                };
            }
            catch (Exception) { return null; }
        }

        private static MapSave SaveMap(int n, MapState m) => new MapSave
        {
            n = n,
            revealed = new string(m.revealed.Select(b => b ? '1' : '0').ToArray()),
            dead = m.dead.ToList(), opened = m.opened.ToList(), trail = m.trail.ToList(),
        };

        private static void LoadMap(MapSave s, MapState m)
        {
            for (int i = 0; i < s.revealed.Length && i < m.revealed.Length; i++) m.revealed[i] = s.revealed[i] == '1';
            if (s.dead != null) m.dead.UnionWith(s.dead);
            if (s.opened != null) m.opened.UnionWith(s.opened);
            if (s.trail != null) m.trail.UnionWith(s.trail);
        }

        // Fotografa a aventura atual.
        public static SaveData Capture(Island w, PlayerState p, RunState g) => new SaveData
        {
            seed = w.seed,
            player = p,
            island = SaveMap(-1, g.island),
            dungeons = g.dungeons.Select(kv => SaveMap(kv.Key, kv.Value)).ToList(),
            talked = g.talked.ToList(), cleared = g.cleared.ToList(), seen = g.seen.ToList(),
            conversa = g.conversa.Select(kv => new Count { id = kv.Key.ToString(), n = kv.Value }).ToList(),
            steps = g.steps, kills = g.kills, clock = g.clock, day = g.day, won = g.won,
        };

        // Remonta o RunState a partir do save. dungeonSize(n) diz o tamanho
        // da masmorra n (o MapState precisa saber quantos quadrados tem).
        public static RunState Restore(SaveData d, Func<int, int> dungeonSize)
        {
            var g = new RunState { steps = d.steps, kills = d.kills, clock = d.clock, day = d.day, won = d.won };
            LoadMap(d.island, g.island);
            foreach (var s in d.dungeons) LoadMap(s, g.Dungeon(s.n, dungeonSize(s.n)));
            g.talked.UnionWith(d.talked); g.cleared.UnionWith(d.cleared); g.seen.UnionWith(d.seen);
            foreach (var c in d.conversa) g.conversa[int.Parse(c.id)] = c.n;
            return g;
        }
    }
}
```

### 9.2 `GameController.Save.cs`: save, capa e atalhos de teste

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameController.Save.cs
using Caderno.Data;
using Caderno.Sketch;
using Caderno.UI;
using UnityEngine;
using UnityEngine.UIElements;

namespace Caderno.Game
{
    // POR QUE: a capa do caderno (nome do herói, continuar ou começar) e o
    // save automático.
    // ESTRATÉGIA: ShowTitle é o gancho chamado no Start (Fase 5); quando ele
    // diz que mostrou a capa, o Start não começa uma aventura sozinho. Os
    // "atalhos de teste" do Inspector fazem o papel dos parâmetros de URL do
    // protótipo (?seed, ?revelar, ?ouro, ?noite, ?tochas, ?masmorra).
    public partial class GameController
    {
        [Header("Atalhos de teste")]
        [SerializeField] private bool _devSkipTitle;
        [SerializeField] private uint _devSeed;
        [SerializeField] private bool _devRevealAll;
        [SerializeField] private int _devGold;
        [SerializeField] private bool _devNight;
        [SerializeField] private int _devTorches = -1;   // -1 = as 2 do começo
        [SerializeField] private int _devDungeon = -1;   // >= 0 = começa dentro da masmorra n

        partial void SaveGame()
        {
            if (W != null && P != null) SaveSystem.Save(SaveSystem.Capture(W, P, G));
        }

        partial void ShowTitle(ref bool shown)
        {
            shown = true;
            _sfx.On = PlayerPrefs.GetInt("caderno-som", 1) == 1;
            _hud.SetSound(_sfx.On);
            if (_devSkipTitle) { StartNew("Herói"); return; }
            _ = TitleScreen();
        }

        // A capa: título, desenhos sendo traçados, nome e botões.
        private async Awaitable TitleScreen()
        {
            var save = SaveSystem.Load();
            var c = _panels.Open("title");
            var cover = new VisualElement();
            cover.AddToClassList("cover");
            c.Add(cover);
            cover.Add(Ui.Heading("Caderno de Aventuras", "cover-title"));
            cover.Add(Ui.Text("o RPG que a gente jogava no fundo da sala"));
            var art = new VisualElement();
            art.AddToClassList("cover-art");
            art.style.flexDirection = FlexDirection.Row;
            art.style.justifyContent = Justify.Center;
            foreach (var strokes in new[] { PeopleArt.Hero(0), IconArt.Die(20, Palette.Red), MonsterArt.Get("dragao") })
            {
                var s = new SketchElement(strokes);
                s.style.width = 180; s.style.height = 180;
                art.Add(s);
                s.PlayDraw(2.6f);
            }
            cover.Add(art);
            var name = new TextField("Nome do herói:") { value = save?.player.nome ?? "Herói", maxLength = 16 };
            name.AddToClassList("name-field");
            cover.Add(name);
            var acts = Ui.Actions();
            acts.style.justifyContent = Justify.Center;
            cover.Add(acts);
            cover.Add(Ui.Text("Ande com as setas, WASD ou tocando no mapa. O mestre desenha o mundo enquanto você anda. " +
                              "Cada item dá dados: a soma é o dano, e escudo e armadura rolam a sua defesa.", "small"));

            while (true)
            {
                var choices = new System.Collections.Generic.List<Choice>();
                if (save != null) choices.Add(new Choice("Continuar", "cont", Palette.Green, small: $"{save.player.nome}, nível {save.player.lvl}"));
                choices.Add(new Choice("Nova aventura", "novo", Palette.Red));
                string v = await _panels.Ask(acts, choices);
                if (v == "novo" && save != null)
                {
                    string sure = await _panels.Ask(acts, new[] { new Choice("Apagar o save e começar", "sim", Palette.Red), new Choice("Voltar", "nao") });
                    if (sure != "sim") continue;
                }
                _panels.Close();
                if (v == "cont") LoadRun(save);
                else StartNew(string.IsNullOrWhiteSpace(name.value) ? "Herói" : name.value.Trim());
                return;
            }
        }

        // Aventura nova, aplicando os atalhos de teste.
        private void StartNew(string nome)
        {
            NewRun(nome, _devSeed != 0 ? _devSeed : (uint)Random.Range(1, int.MaxValue));
            if (_devGold > 0) P.ouro = _devGold;
            if (_devTorches >= 0) P.tochas = _devTorches;
            if (_devNight) { G.clock = 80; BurnTorch(false); }
            if (_devDungeon >= 0 && _devDungeon < W.dungeons.Count)
            {
                int d = W.dungeons[_devDungeon];
                P.ox = d % W.W; P.oy = d / W.W;
                SetMap(_devDungeon);
                P.x = M.start % M.W; P.y = M.start / M.W;
                BurnTorch(false);
                _map.RevealAround(P.x, P.y, true, RevealRadius2());
            }
            if (_devRevealAll)
            {
                for (int i = 0; i < L.revealed.Length; i++) L.revealed[i] = true;
                _map.RebuildAll();
            }
            SnapCamera();
            UpdateHud();
        }

        // Continua o save: mesma ilha (pela semente), mesmo mapa revelado, no
        // mapa onde o herói estava (a ilha ou uma masmorra).
        private void LoadRun(SaveData d)
        {
            W = Caderno.Core.IslandGenerator.Generate(d.seed);
            _dungeonMaps.Clear();
            G = SaveSystem.Restore(d, n => DungeonMap(n).Size);
            P = d.player;
            SetMap(P.onde);
            SnapCamera();
            Narrate($"De volta à aventura de {P.nome}. O mestre abre o caderno na mesma página.");
            UpdateHud();
        }
    }
}
```

### ✅ Checkpoint da Fase 9
- O jogo abre na capa: título vermelho, herói, d20 e dragão sendo desenhados, campo do nome e "Nova aventura".
- Ande um pouco, abra uma fogueira, pare o Play e aperte Play de novo: aparece "Continuar (nome, nível)", e ele volta na mesma ilha, com o mapa já desenhado, os X e o rastro.
- "Nova aventura" com save pede confirmação antes de apagar.
- Com **Dev Skip Title** + **Dev Seed = 42** + **Dev Reveal All** no Inspector, o Play abre direto na ilha da semente 42 toda revelada. Ela é a mesma de `index.html?novo&seed=42&revelar` no protótipo.
- **Dev Dungeon = 1** começa dentro do Esgoto do Rei Rato (`?masmorra=1`); **Dev Night** começa à noite (`?noite`); **Dev Torches = 0** começa sem tochas (`?tochas=0`).
- Salvar dentro de uma masmorra e continuar volta para a mesma masmorra, no mesmo quadrado; subir pela escada leva para a entrada certa na ilha.
- Um save antigo (`caderno-aventuras-save-v1`) aparece em "Continuar" e abre na mesma ilha, agora com masmorras e personagens novos.

#### Problemas comuns
- **Continuar abre outra ilha:** o save guardou a semente pedida, não a usada. Use `w.seed` (a da ilha gerada), como em `Capture`.
- **Para apagar o save durante os testes:** **Edit → Clear All PlayerPrefs**.

Próxima fase: **Build e próximos passos**.

---

# Parte 13 — Implementação Unity: Fase 10 (Build e próximos passos)

## Fase 10 — Build e próximos passos

> Objetivo desta fase: gerar o jogo para navegador e celular, cuidar do desempenho com a ilha toda revelada e listar o que fica para depois.

### 10.1 Builds

- **Web (WebGL):** **File → Build Profiles → Web → Switch Platform**. Em **Player Settings → Publishing Settings**, ligue **Decompression Fallback** se for hospedar em servidor sem configuração de compressão (como o GitHub Pages). O save em PlayerPrefs funciona no navegador.
- **Android:** **Build Profiles → Android**. Em **Player Settings → Resolution and Presentation**, deixe **Auto Rotation** com retrato e paisagem ligados: a classe `narrow` do USS ajeita as folhas no celular em pé, e o direcional de toque aparece sozinho.

### 10.2 Desempenho

Com a ilha toda revelada são até 1.632 quadrados, cada um com sua geometria guardada. O UI Toolkit desenha todos, mesmo os que estão fora da tela. Se ficar lento (especialmente no celular), esconda os que estão longe da câmera:

```csharp
// Em MapView: chame a cada ~10 quadros, no fim do Tick.
// ESTRATÉGIA: display = None tira o elemento do desenho sem apagar a
// geometria guardada; quando ele volta, não precisa ser redesenhado.
public void Cull()
{
    var view = Root.contentRect.size / Zoom;
    var visible = new Rect(Cam - view / 2f - Vector2.one * 2 * T, view + Vector2.one * 4 * T);
    foreach (var child in _tiles.Children())
    {
        var pos = new Vector2(child.style.left.value.value, child.style.top.value.value);
        child.style.display = visible.Contains(pos) ? DisplayStyle.Flex : DisplayStyle.None;
    }
}
```

O protótipo tem um granulado de papel por cima de tudo. Aqui ele foi deixado de fora; se fizer falta, é uma textura de ruído com `backgroundRepeat` num elemento transparente por cima do mapa.

### 10.3 Em aberto (implementação)

- **Arte:** traço gerado por código (este guia) ou ilustrações a lápis escaneadas. A troca fica isolada em `MonsterArt`, `IconArt`, `PeopleArt` e `TileArt`.
- **Dados girando** na bandeja, como no protótipo (ver 7.2).
- **Brilho da tocha:** o protótipo pinta um círculo laranja translúcido em volta do herói com a tocha acesa; aqui ficou só a luz. Dá para fazer com mais um anel no `DarkOverlay`.
- Tudo o que a Parte 1 marca como **Em aberto**: mapa feito à mão, masmorras com andares e armadilhas, missões de entrega, efeitos de status, crítico, grupo de heróis e modo mestre.
