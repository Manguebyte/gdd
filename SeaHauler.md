# GDD — Sea Hauler

> Documento vivo. Rascunho inicial: o conceito está fechado nas linhas gerais (tower defense em que a "torre" é uma fragata da Marinha britânica fugindo de piratas até o porto), mas os números de balanceamento ainda não foram decididos. Os valores da tabela §17 e do Guia de Implementação Unity (Parte 2 em diante) são **placeholders de MVP**, não decisões fechadas.
>
> **De onde vem este jogo.** **Definido:** o Sea Hauler é um **jogo separado**, derivado do [Space Hauler](SpaceHauler.md) (que por sua vez veio do [Fury Hauler](FuryHauler.md)): troca a nave de carga no espaço por uma **fragata da Coroa britânica** no mar, com piratas no rastro. Ele tem GDD, glossário ([`contexts/sea-hauler/CONTEXT.md`](contexts/sea-hauler/CONTEXT.md)), protótipo e save próprios. Os documentos evoluem sozinhos: uma mudança num jogo não vale para o outro.
>
> **O que muda em relação ao Space Hauler**, em uma linha cada: o jogador **controla as velas** (3 posições) e correr deixa os perseguidores para trás, mas **quem fica para trás não dá ouro**; são **8 portinholas** com bordadas fortes (3 de cada lado), e 4 delas começam fechadas; além do Forro de cobre (o equivalente da Carenagem), o navio tem **Velame** e **Tripulação**; há um quarto tipo de trecho, a **Tempestade**.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Unity](#parte-2--guia-de-implementação-unity)
3. [Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-3--implementação-unity-fase-0-setup-do-projeto)
4. [Parte 4 — Implementação Unity: Fase 1 (Mar Isométrico)](#parte-4--implementação-unity-fase-1-mar-isométrico)
5. [Parte 5 — Implementação Unity: Fase 2 (Navio, Velas e Trecho)](#parte-5--implementação-unity-fase-2-navio-velas-e-trecho)
6. [Parte 6 — Implementação Unity: Fase 3 (Inimigos, Rochedos e Rajadas)](#parte-6--implementação-unity-fase-3-inimigos-rochedos-e-rajadas)
7. [Parte 7 — Implementação Unity: Fase 4 (Armas)](#parte-7--implementação-unity-fase-4-armas)
8. [Parte 8 — Implementação Unity: Fase 5 (Ouro, Alocação e Melhorias do Navio)](#parte-8--implementação-unity-fase-5-ouro-alocação-e-melhorias-do-navio)
9. [Parte 9 — Implementação Unity: Fase 6 (Habilidades Ativas)](#parte-9--implementação-unity-fase-6-habilidades-ativas)
10. [Parte 10 — Implementação Unity: Fase 7 (Run Roguelite, Porto e Save)](#parte-10--implementação-unity-fase-7-run-roguelite-porto-e-save)
11. [Parte 11 — Implementação Unity: Fase 8 (Build Web e Próximos Passos)](#parte-11--implementação-unity-fase-8-build-web-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Nome:** **Definido:** *Sea Hauler* (nome de trabalho; pode mudar).
- **Gênero:** **Definido:** tower defense em movimento com estrutura **roguelite**, como o Space Hauler. No lugar da torre fixa há um **navio**: uma fragata da Marinha britânica levando uma carga da Coroa do **porto de origem (A)** ao **porto de destino (B)**, fugindo de piratas.
- **Dimensão:** **Definido:** 2.5D. A lógica do jogo roda num plano 2D (a superfície do mar, em metros) e a arte é desenhada em perspectiva isométrica. Não há física 3D. Todos navegam no mesmo plano.
- **Câmera/perspectiva:** **Definido:** isométrica, seguindo o navio (a mesma da série Hauler).
- **Plataforma-alvo:** **Definido:** Web (navegador), jogado com mouse; o protótipo também funciona no celular deitado (toque), como o Space Hauler.
- **Referências:** **Definido:**
  - *Space Hauler* / *Fury Hauler*: a estrutura inteira (o veículo anda sozinho, armas em pontos fixos, moeda em tempo real, mapa de rota).
  - *Piratas do Caribe* (os filmes): a **estética** da frota britânica (casco escuro com a faixa ocre das portinholas, velas creme, casacas vermelhas) contra piratas de velas pretas. É só inspiração visual: nenhum nome, personagem ou navio dos filmes entra no jogo.
  - *FTL*: cuidar de um navio sob ataque e escolher a rota entre portos e mares perigosos.
  - *Kingdom Rush* / *Bloons TD*: comprar e melhorar armas com moeda ganha na partida.
- **Pilar de design:** **Em aberto**. Proposta para discutir, não decidida: *"Correr ou lutar: o navio segue de qualquer jeito, e a cada momento você escolhe entre fugir inteiro ou ficar para saquear."*
- **Fantasia central:** ser o capitão de uma fragata da Coroa perseguida por piratas, decidindo em tempo real quanto pano içar, onde pôr cada canhão e quando gastar o ouro dos piratas afundados no próprio navio.

## 2. Loop Principal

**Definido:**

1. Uma **run** é uma viagem do porto de origem ao porto de destino, dividida em **trechos**.
2. Antes de cada trecho, o jogador escolhe o próximo nó num **mapa de rota com bifurcações** (§9). Cada nó é um **tipo de trecho** (com seu padrão de ataque) ou um **Porto**.
3. Durante o trecho, o navio **navega sozinho** na direção da rota. O jogador **não controla o leme**, mas **controla as velas**: escolhe a velocidade em tempo real (§3).
4. Piratas atacam. As armas montadas nas **portinholas** do navio **miram e atiram sozinhas**, cada uma só para o seu lado (§4, §5).
5. Inimigos afundados soltam **ouro**, usado **em tempo real** para comprar, trocar e melhorar armas, abrir portinholas e comprar melhorias do navio (§6). **Inimigos que ficam para trás não dão ouro.**
6. O jogador também tem **habilidades ativas com cooldown** (§7).
7. Se o navio chegar ao fim do último trecho, a run é vencida. Se afundar, a run acaba e **recomeça do zero**, mantendo só os **desbloqueios permanentes** (§11).

## 3. O Navio e as Velas

- **Definido:** o navio é a "torre" do tower defense: uma **fragata** de três mastros. Ele segue a rota sozinho, do começo ao fim do trecho. O jogador não vira o leme.
- **Definido:** o navio tem **casco** (os pontos de vida). Casco zero afunda o navio e acaba a run.
- **Definido: as velas.** O jogador escolhe em tempo real entre **3 posições**:

| Posição | O que faz |
|---|---|
| **Rizadas** | Devagar. Os piratas alcançam mais rápido e o trecho dura mais (mais combate, mais ouro). Bater em rochedo dói menos. |
| **Meio pano** | O ritmo dos piratas: quem vem por trás se aproxima só com a própria sobra. É a posição de saída. |
| **Pano cheio** | Mais rápido que os piratas: quem vem por trás com pouca sobra **fica para trás** e sai do jogo **sem dar ouro**. Bater em rochedo dói mais. Na Tempestade, rajadas rasgam as velas (§9). |

- **Definido: "fuga custa saque".** Correr é a defesa contra perseguição, mas o ouro só vem de quem é afundado. Fugir de tudo deixa o navio inteiro e pobre; ficar para lutar deixa o navio rico e machucado. É a decisão que este jogo acrescenta à série Hauler.
- **Definido:** os piratas navegam num **ritmo de cruzeiro fixo** (o "ritmo do mar", igual ao Meio pano) e só se aproximam do navio com uma **sobra pequena** própria de cada tipo (§8). Eles não acompanham o Pano cheio.
- **Definido:** trocar de posição **não muda a velocidade de uma vez**: o navio ganha ou perde embalo aos poucos.
- **Definido:** o casco **não se recupera sozinho** entre trechos. Ele é reparado no **Porto** (§10), pagando ouro, e devagar durante o trecho se o navio tiver **Tripulação** (§6).
- **Em aberto:**
  - Os números das 3 posições. Placeholder: Rizadas 6 m/s, Meio pano 10 m/s, Pano cheio 13 m/s (mais o Velame), ritmo do mar 10 m/s, aceleração 3 m/s².
  - Se as velas deveriam ter mais posições ou um controle contínuo.
  - Se existem vários navios para escolher (corveta, fragata, navio de linha).

## 4. Portinholas

- **Definido:** as armas são montadas em **8 portinholas fixas no próprio navio** e viajam com ele: **1 na proa** (o caça-proa), **3 a bombordo** (lado esquerdo), **3 a estibordo** (lado direito) e **1 na popa** (o caça-popa). As **bordadas** (os 3 de cada lado) são o forte do navio, como num navio de guerra de verdade.
- **Definido:** cada portinhola **só atira dentro do seu arco de tiro**: a proa para a frente, a popa para trás e as laterais para o próprio lado. **Nenhuma cobre 360°.** Como no Space Hauler, a decisão "qual arma vai em qual portinhola" é o centro do jogo.
- **Definido:** **4 portinholas começam fechadas** e se abrem com ouro, uma de cada vez, numa melhoria chamada **Portinholas** (§6). O jogador escolhe qual abrir. Placeholder: começam abertas a proa, a popa e a do meio de cada bordada.
- **Em aberto:**
  - O tamanho dos arcos. Placeholder: os 8 com 180°.
  - Quais portinholas começam abertas e o preço de abrir cada uma (placeholder: 60, 80, 100 e 120, nesta ordem, para qualquer portinhola).

## 5. Armas

**Definido:** as armas **miram e atiram sozinhas** no inimigo mais próximo que estiver ao alcance **e dentro do arco da portinhola**. O papel do jogador é escolher **qual** arma vai em **qual** portinhola e **quando** melhorar.

**Definido:** armas do MVP:

| Arma | Papel |
|---|---|
| **Canhão longo** | Bala redonda, alcance longo, um alvo por vez. A arma "padrão". |
| **Carronada** | Canhão curto e grosso que dispara **metralha** num cone: acerta todos dentro dele. Boa contra quem encosta. |
| **Bala encadeada** | Duas balas presas por uma corrente: tiro lento que **rasga as velas** do inimigo. Ele perde o embalo e fica para trás. Só acerta navios. |
| **Fuzileiros** | Dois fuzileiros navais de casaca vermelha com mosquetes: fogo contínuo em tudo que chega perto da portinhola, inclusive nos **piratas a bordo**. |

- **Definido:** cada arma pode ser **melhorada** com ouro.
- **Em aberto:**
  - Números de cada arma (dano, alcance, cadência, custo). Placeholders em §17.
  - Quantos níveis de upgrade e se o upgrade só aumenta números ou também muda o comportamento.
  - Se a bala encadeada deveria só desacelerar (em vez de parar o inimigo por completo).
  - Armas pós-MVP (morteiro, canhão de proa giratório, atiradores nos cestos da gávea).

## 6. Ouro, Alocação e Melhorias do Navio

- **Definido:** inimigos afundados soltam **ouro**. O ouro é a **única moeda** da run. Inimigos que **ficam para trás** (porque o navio correu mais, ou porque a bala encadeada os parou) **não dão ouro**.
- **Definido:** o ouro é gasto **em tempo real, durante a viagem**, para:
  - **comprar** uma arma e montar numa portinhola aberta e vazia;
  - **melhorar** uma arma já montada;
  - **trocar** uma arma: vender a atual (recebendo parte do valor) e comprar outra no lugar;
  - comprar um nível de uma **melhoria do navio** (abaixo).
- **Definido: melhorias do navio.** São da própria fragata, fora das portinholas, compradas **em níveis com ouro**, a qualquer momento da run (inclusive no meio de um trecho e no Porto):

| Melhoria | O que cada nível faz |
|---|---|
| **Forro de cobre** | Aumenta o casco máximo e **reduz o dano de colisão** (rochedos e brulotes). É o "blindar" contra o "armar" das portinholas, como a Carenagem do Space Hauler. |
| **Velame** | Deixa o **Pano cheio** mais rápido: com Velame alto, nem os piratas mais rápidos acompanham. |
| **Tripulação** | Carpinteiros que **consertam o casco devagar** durante o trecho. |
| **Portinholas** | **Abre** uma das portinholas fechadas (§4). |

- **Definido:** no **Porto** (§10), o ouro também paga o **reparo do casco**.
- **Definido:** o ouro continua de um trecho para o outro dentro da mesma run e zera quando a run acaba.
- **Em aberto** (com os placeholders do Space Hauler):
  - Se o ouro é coletado automaticamente ou se o jogador precisa clicar nele (placeholder: entra direto no cofre).
  - Se o jogo pausa ou entra em câmera lenta enquanto o jogador aloca armas (placeholder: não pausa).
  - Quanto a venda devolve (placeholder: 50% de tudo que foi gasto na arma).
  - Se é possível mover uma arma de uma portinhola para outra sem vender.
  - Ouro inicial da run (placeholder: 100).
  - Números das melhorias (placeholders em §17).

## 7. Habilidades Ativas

- **Definido:** além de alocar e mexer nas velas, o jogador tem **habilidades ativas com cooldown**, usadas por botão (e atalho de teclado).
- **Em aberto:** a lista de habilidades. Placeholders do MVP (o pós-combustor do Space Hauler saiu, porque as velas já fazem esse papel):
  - **Barris de pólvora:** joga barris atrás do navio; o navio pirata que passa por eles leva dano e tem as velas rasgadas por um instante.
  - **Bordada:** por alguns segundos, todas as armas recarregam em dobro (e quem estava recarregando atira na hora).
- **Em aberto:** se as habilidades são fixas, desbloqueadas na meta-progressão ou escolhidas antes da run.

## 8. Inimigos

**Definido:** inimigos do MVP (os papéis são os do Space Hauler, com cara de pirata):

| Inimigo | Comportamento |
|---|---|
| **Escuna pirata** | Rápida e frágil. Ronda o navio do lado de onde veio e atira. |
| **Chalupa de abordagem** | Encosta no navio e solta **piratas a bordo**. |
| **Brulote** | Barco velho cheio de pólvora, em chamas. Vai direto no navio e explode ao bater (dano de colisão: o Forro de cobre reduz). Afundado antes, não causa dano. |
| **Chefe: Galeão pirata** | Navio grande de velas pretas no último trecho, guardando a entrada do porto de destino. |

- **Definido:** os inimigos vêm **de qualquer direção**, conforme o **tipo de trecho** (§9).
- **Definido:** os piratas **navegam no ritmo do mar** (§3) e se aproximam do navio com uma sobra pequena, própria de cada tipo. Sem essa regra, quem vem pela frente (e navega contra o navio) fecharia a distância rápido demais para qualquer arma. Com as velas rasgadas, perdem o embalo e ficam para trás. Quem fica longe demais do navio sai do jogo **sem dar ouro**.
- **Em aberto:**
  - O que o **pirata a bordo** faz. Placeholder (o do Space Hauler): ele ocupa uma portinhola, **sabota a arma dela** (ela para de atirar) e causa dano contínuo ao casco até ser morto.
  - Quem consegue atirar no pirata a bordo. Placeholder: **qualquer arma do navio**, sem olhar o arco de tiro (ele está no convés, não lá fora).
  - Em qual portinhola o pirata sobe. Placeholder: na **aberta** mais perto da chalupa (as fechadas não deixam entrar).
  - Comportamento do **Galeão pirata**. Placeholder: ronda e atira como uma escuna muito resistente, e chama uma escuna de reforço de tempos em tempos.
  - Se o Galeão precisa ser afundado para chegar ao destino (placeholder: sim, enquanto ele existir o navio não termina o trecho).
  - Projéteis visíveis ou dano instantâneo (placeholder: dano instantâneo, com a bala desenhada só como efeito).

## 9. A Viagem: Trechos, Tipos de Trecho e Rota

- **Definido:** a run é uma rota **gerada a cada run**, com **escolhas de caminho** entre trechos (mapa em camadas, no estilo FTL/Slay the Spire), desenhada como uma carta náutica.
- **Definido:** cada trecho é um percurso reto pelo mar, do começo ao fim. O trecho termina quando o navio chega ao fim dele. O último termina na entrada do porto de destino e tem o Galeão pirata.
- **Definido:** cada nó do mapa que não é Porto é um **tipo de trecho**, que define o **padrão de ataque**:

| Tipo de trecho | De onde vêm os piratas | Extra |
|---|---|---|
| **Mar aberto** | Por trás (perseguição) | — |
| **Recifes** | Pela frente e pelos lados (emboscada) | **Rochedos** que batem no casco |
| **Enseada pirata** | De todos os lados (cerco de 360°) | Mais risco e mais ouro |
| **Tempestade** | Por trás e pelos lados | Menos piratas, mas **rajadas** rasgam o Pano cheio |

- **Definido: rochedos.** Nos Recifes, rochas aparecem à frente do navio. As que estão no caminho **batem no casco** e **não podem ser destruídas**. O dano **cresce com a velocidade**: passar pelos Recifes de Rizadas dói menos. A proteção é o **Forro de cobre** e a vela baixa.
- **Definido: rajadas.** Na Tempestade, de tempos em tempos vem uma rajada, com um **aviso** alguns segundos antes. Se ela pega o navio de **Pano cheio**, as velas **rasgam**: o navio leva dano e fica preso em Rizadas por alguns segundos. Isso faz a Tempestade cobrar atenção às velas, não às armas.
- **Em aberto:**
  - Quantos trechos por run (placeholder: 6 camadas, sendo 5 comuns e o do destino).
  - O risco de cada tipo. Placeholder: vem do tipo (Mar aberto 0, Recifes 1, Enseada 2, Tempestade 1), e cada ponto de risco dá mais inimigos e +25% de ouro.
  - O padrão do último trecho (placeholder: perseguição por trás, com o Galeão).
  - Densidade e dano dos rochedos, frequência e efeito das rajadas (placeholders em §17).
  - Duração de um trecho (placeholder: 900 m, ~90 s a Meio pano).

## 10. Porto

- **Definido:** o **Porto** é um tipo de nó do mapa de rota. Nele, o jogador **repara o casco pagando ouro**. É o único jeito de recuperar muito casco de uma vez (a Tripulação só conserta devagar).
- **Em aberto:**
  - Se o Porto tem combate. Placeholder: **não**: é uma parada sem piratas, com uma tela de reparo, e não conta como trecho concluído.
  - Preço do reparo. Placeholder: 1 de ouro repara 2 de casco.
  - Quantos Portos aparecem. Placeholder: no máximo um por camada, com 25% de chance nas camadas do meio (nunca na primeira nem na do destino).
  - Se o Porto vende outras coisas (armas mais baratas, habilidades). Placeholder: reparo e as melhorias do navio (Forro de cobre, Velame, Tripulação).

## 11. Progressão Permanente (Meta)

- **Definido:** quando a run acaba, o jogador recomeça do zero, mas mantém **desbloqueios permanentes**.
- **Em aberto:**
  - **O que** é desbloqueado (armas, habilidades, navios, portinholas abertas no começo, bônus iniciais).
  - **Como** se desbloqueia.
  - Placeholder do MVP (o mesmo do Space Hauler): canhão longo e fuzileiros começam liberados; a carronada libera depois de concluir 1 trecho em qualquer run, e a bala encadeada depois de concluir 3 trechos numa mesma run.

## 12. Condições de Vitória e Derrota

- **Definido:** **vitória** é chegar ao porto de destino, ou seja, terminar o último trecho.
- **Definido:** **derrota** é o casco chegar a zero. O navio afunda, a run acaba e recomeça do zero (§11).
- **Em aberto:** se existe pontuação ou ranking local (tempo, ouro, casco restante, piratas deixados para trás).

## 13. Estilo Visual

- **Definido:** **pixel art isométrica 2D**, como os protótipos da série Hauler: isométrico 2:1, contorno escuro seletivo, luz do alto à esquerda, feita no **PixelLab** como redesenho das formas vetoriais do protótipo. O estilo passa por um **teste com poucos sprites** antes do lote completo.
- **Definido:** a fragata do jogador tem a estética da **Marinha britânica do século XVIII** à la *Piratas do Caribe*: casco quase preto com a **faixa ocre** das portinholas, velas creme, convés de madeira, bandeira azul com a cruz vermelha na popa, fuzileiros de casaca vermelha. Os piratas têm cascos de madeira gasta, **velas pretas** e a bandeira de caveira.
- **Definido:** o plano do jogo é o **mar**: azul-petróleo com cristas de onda presas à superfície (elas correm para trás quando o navio anda), **esteira de espuma** atrás do navio, **boias** vermelhas a bombordo e verdes a estibordo a cada 100 m (com a distância até o fim), **ilhas** com coqueiros ao longe, um **farol** no começo e no fim de cada trecho e o **porto de destino** com um forte no último. A Tempestade escurece o mar e traz chuva e relâmpagos.
- **Definido:** o mastreame é um sprite separado do casco, um para cada posição das velas, e fica **meio transparente** enquanto o jogador mexe nas portinholas (senão as velas escondem as armas de bombordo).
- **Em aberto:** paleta final; quantas direções cada navio inimigo precisa (no protótipo, um sprite só por inimigo, sempre com a proa para a frente da rota).

## 14. HUD / UI

**Definido:** o que fica na tela durante o trecho é derivado das mecânicas:

- Ouro atual.
- Casco (atual / máximo).
- Progresso do trecho e o tipo de trecho.
- **Velas:** as 3 posições (a atual destacada), a velocidade do navio comparada à dos piratas e quantos inimigos ficaram para trás neste trecho.
- Barra de compra com as armas liberadas e seus custos.
- Coluna das **melhorias do navio** (Forro de cobre, Velame, Tripulação) com o nível e o custo do próximo.
- Painel da portinhola selecionada: a arma (nível, melhorar, vender) ou, se fechada, o botão de abrir.
- Botões das habilidades com cooldown visível.
- Na Tempestade, a contagem até a próxima rajada.
- No mapa de rota: o tipo de cada nó (ícone e nome), o risco e o bônus de ouro.
- No Porto: casco, ouro, botões de reparo e das melhorias.

**Em aberto:** layout final, indicador de inimigos fora da tela.

## 15. Áudio

**Em aberto.** Nada decidido ainda.

## 16. Backend / Serviços

- **Definido:** **offline**, sem conta, sem servidor e sem leaderboard. O progresso permanente fica em **save local** no navegador, separado dos saves do Fury Hauler e do Space Hauler.
- **Em aberto:** leaderboard no padrão Firebase do estúdio, se um dia o jogo ganhar pontuação (§12).

## 17. Escopo do MVP

**Definido:** entra no MVP:

- Navio navegando sozinho numa rota isométrica no mar, com casco, **velas em 3 posições** e 8 portinholas de arco limitado (4 fechadas no começo).
- As 4 armas da §5, com compra, upgrade e venda por ouro em tempo real.
- As 4 melhorias do navio (§6).
- Os 4 inimigos da §8 (mais o pirata a bordo que a chalupa solta).
- Os 4 tipos de trecho da §9, com rochedos nos Recifes e rajadas na Tempestade.
- O Porto (§10).
- Habilidades ativas com cooldown (placeholders: barris de pólvora e bordada).
- Run roguelite: mapa de rota com bifurcações, trechos em sequência e Galeão no fim.
- Desbloqueios permanentes simples e save local.
- Build Web.

**Fica para depois:**

- Arte final de todos os objetos e áudio.
- Mais armas, inimigos, habilidades e tipos de nó no mapa.
- Outros navios.
- Leaderboard.

### Placeholders de Balanceamento

> Todos os valores são **placeholders de MVP**. No guia Unity eles ficam em assets (`GameConfig`, `WeaponDef`, `EnemyDef`, `AbilityDef`, `LegTypeDef`), para ajustar sem mexer em código. Distâncias em metros no plano do mar. A primeira leitura de balanceamento (piloto automático no protótipo) está no README de `prototipos/sea-hauler/`.

| Item | Valor placeholder |
|---|---|
| Navio | 500 de casco, raio de colisão 1,6 m |
| Velas | Rizadas 6 m/s, Meio pano 10 m/s, Pano cheio 13 m/s; aceleração 3 m/s² |
| Ritmo do mar (piratas) | 10 m/s |
| Trecho | 900 m (~90 s a Meio pano) |
| Ouro inicial da run | 100 |
| Venda | devolve 50% do total gasto na arma |
| Upgrade de arma | +35% nos números por nível, até o nível 3 |
| Forro de cobre | 5 níveis; nível n custa 50 × n; cada nível +50 de casco máximo (e cura 50) e −12% de dano de colisão |
| Velame | 3 níveis; nível n custa 60 × n; cada nível +1,5 m/s no Pano cheio |
| Tripulação | 3 níveis; nível n custa 60 × n; cada nível conserta 0,2 de casco por segundo durante o trecho |
| Portinholas | abrir custa 60, 80, 100 e 120 (a 1ª, 2ª, 3ª e 4ª abertas) |
| Reparo no Porto | 1 de ouro = 2 de casco |

| Portinhola | Posição (m, a partir do centro do navio) | Arco | Começa |
|---|---|---|---|
| Proa | (3,2, 0), virada para frente | 180° | aberta |
| Bombordo frente / meio / trás | (1,7, 1) / (0,1, 1) / (−1,5, 1), viradas para a esquerda | 180° | só a do meio aberta |
| Estibordo frente / meio / trás | (1,7, −1) / (0,1, −1) / (−1,5, −1), viradas para a direita | 180° | só a do meio aberta |
| Popa | (−3,1, 0), virada para trás | 180° | aberta |

| Arma | Custo (e custo de upgrade por nível) | Alcance | Efeito |
|---|---|---|---|
| Canhão longo | 40 | 10 | 20 de dano a cada 0,5 s |
| Carronada | 60 | 4,5 | 30 de dano em todos num cone de 60°, a cada 0,9 s |
| Bala encadeada | 70 | 12 | 35 de dano a cada 3 s, rasga as velas por 3 s, só navios |
| Fuzileiros | 50 | 3 | 15 de dano/s em quem estiver perto (inclusive piratas a bordo) |

| Inimigo | Vida | Aproximação (sobra sobre o ritmo do mar) | Ataque | Ouro | Custo de spawn | Dificuldade mínima |
|---|---|---|---|---|---|---|
| Escuna pirata | 30 | 6 m/s | 4 a cada 1 s | 8 | 1 | 0 |
| Brulote | 50 | 8 m/s | 45 ao bater (colisão) | 12 | 2 | 1 |
| Chalupa de abordagem | 80 | 4 m/s | solta 2 piratas, 1 a cada 2 s | 15 | 3 | 2 |
| Pirata a bordo | 20 | — | 6/s no casco e sabota a portinhola | 3 | — | — |
| Galeão pirata | 1500 | 2 m/s | 15 a cada 1,5 s; chama 1 escuna a cada 6 s | 150 | — | — |

| Spawn, rota, rochedos e rajadas | Valor placeholder |
|---|---|
| Orçamento de spawn | (0,4 + 0,15 × dificuldade) × multiplicador do tipo pontos/s (Tempestade × 0,6) |
| Dificuldade do trecho | número do trecho + risco do tipo |
| Distância de spawn | 20 a 26 m do navio, num ângulo dentro do arco do tipo de trecho |
| Arco de spawn | Mar aberto: 145° a 215° (trás); Recifes: −110° a 110° (frente e lados); Enseada: 0° a 360°; Tempestade: 100° a 260° (trás e lados) |
| Inimigo sai do jogo | a mais de 40 m do navio (sem ouro) |
| Camadas da rota | 6 (5 comuns + destino), 2 a 3 nós por camada |
| Porto | até 1 por camada do meio, 25% de chance |
| Risco | Mar aberto 0, Recifes 1, Enseada 2, Tempestade 1; cada ponto dá +25% de ouro |
| Galeão aparece em | 30% do último trecho |
| Rochedos | 0,4 por segundo a Meio pano (a densidade é por distância), 34 a 42 m à frente, até 16 m para cada lado; raio 0,8 a 2,2 m; dano = 16 × raio × (velocidade ÷ ritmo do mar) |
| Rajadas | a cada 9 a 13 s, com 2,5 s de aviso; de Pano cheio: 20 de dano e velas rasgadas por 8 s (navio em Rizadas) |

| Habilidade | Cooldown | Efeito |
|---|---|---|
| Barris de pólvora | 15 s | barris numa faixa de 8 m de comprimento, 5 m atrás do navio, que duram 5 s; navio que passa leva 40 de dano e tem as velas rasgadas por 1,5 s |
| Bordada | 25 s | por 4 s, todas as armas recarregam em dobro; quem estava recarregando atira na hora |

## 18. Riscos / Em aberto (consolidado)

- **Pilar de design** (há uma proposta na §1).
- **A troca "fuga custa saque" precisa morder.** Na primeira leitura do protótipo (piloto automático), o Pano cheio no Mar aberto custa ~60% menos casco e ~30% menos ouro que o Meio pano, o que parece uma troca de verdade; mas Pano cheio o tempo todo perde feio nos Recifes e na Tempestade, então a decisão muda com o tipo de trecho, que é a intenção. Falta conferir jogando se ela se sustenta.
- **Profundidade da decisão de portinhola.** Herdado do Space Hauler: os padrões de ataque por tipo de trecho (§9) existem para que "qual arma em qual lado" mude de um trecho para o outro.
- **Peso da Enseada pirata.** Como a Rota pirata do Space Hauler, ela custa pouco casco e paga mais ouro.
- **Economia generosa.** O piloto automático termina os trechos com ouro sobrando para tudo; o custo das melhorias ou o ouro por pirata precisa ser revisto.
- Números das velas e se existem mais navios (§3).
- Arcos e portinholas abertas no começo (§4).
- Números, níveis e upgrades que mudam comportamento (§5).
- Coleta de ouro, pausa durante alocação, valor de venda, mover armas, números das melhorias (§6).
- Lista de habilidades (§7).
- Pirata a bordo, quem pode atirar nele, e o Galeão (§8).
- Risco por tipo, número de trechos, rochedos e rajadas (§9).
- Combate, preço e frequência do Porto (§10).
- O que e como desbloquear na meta-progressão (§11).
- Pontuação/ranking (§12).
- Paleta e direções dos sprites (§13).
- Layout do HUD e indicador de inimigos fora da tela (§14).
- Áudio (§15).

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para implementar o MVP do Sea Hauler em Unity 6, com build Web. Os números vêm dos placeholders da Parte 1 §17 e ficam em assets (`GameConfig` e os `...Def`), para dar para balancear sem mexer no código. As regras marcadas como **Em aberto** que o código precisa decidir de algum jeito viram opções do `GameConfig` ou ficam isoladas num lugar só, para trocar de ideia sem reescrever nada.
>
> **De onde vem este guia.** A estrutura é a do guia do [Space Hauler](SpaceHauler.md), porque o jogo nasceu dele: mesma projeção isométrica, mesmo jeito de montar armas, mesma run. O que muda: o plano é o mar (a Fase 1 desenha ondas presas a ele), o jogador controla as **velas** (`SailController`, Fase 2), os piratas navegam no **ritmo do mar** e não no do navio (Fase 3), há **rajadas** na Tempestade (Fase 3), as 8 **portinholas** podem estar fechadas (Fase 4) e o navio tem **três melhorias** em vez de uma (Fase 5). O projeto Unity é outro, separado do Space Hauler, e foi escrito inteiro aqui (não como diff), para dar para seguir só este documento.

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele. Os termos seguem o [glossário](contexts/sea-hauler/CONTEXT.md): portinhola é `Gunport`, casco é `Hull`, trecho é `Leg`, velas são `Sails`, Forro de cobre é `Copper`, Velame é `Rigging`, Tripulação é `Crew`, Porto é `Port`, ouro é `Gold`.
- **Namespaces:**
  - `SeaHauler.World`: projeção isométrica, posição no plano, o mar, as boias e a câmera.
  - `SeaHauler.Data`: ScriptableObjects de configuração, armas, inimigos, habilidades e tipos de trecho.
  - `SeaHauler.Ship`: o navio, o casco, as velas, as melhorias e as portinholas.
  - `SeaHauler.Leg`: o trecho em andamento, o spawn de inimigos, os rochedos e as rajadas.
  - `SeaHauler.Enemies`: os inimigos.
  - `SeaHauler.Weapons`: as armas.
  - `SeaHauler.Economy`: ouro e alocação (comprar, melhorar, vender, abrir portinhola, melhorar o navio).
  - `SeaHauler.Abilities`: habilidades ativas.
  - `SeaHauler.Run`: rota, run, Porto e save da meta-progressão.
  - `SeaHauler.UI`: HUD e painéis.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Textos na tela sem emoji**, porque a fonte padrão do TextMeshPro não tem emojis.

## Arquitetura em uma página

```
 Plano do mar (lógica 2D, metros)                  Tela (isométrico)
 ────────────────────────────────                  ─────────────────
 x = distância percorrida, y = lado              GroundBody ── IsoProjection.ToScreen ──▶ transform.position
                                                                                          + ordem de desenho

 RunManager ──escolhe nó──▶ Porto (sem combate: reparo e melhorias)
     │
     └──▶ LegManager.StartLeg ──Started──▶ EnemySpawner (orçamento por segundo, arco do tipo de trecho)
     ▲                         │           ReefField (só nos Recifes)   SquallSystem (só na Tempestade)
     │ Ended(sucesso?)         │ IsSailing                │ instancia
     └─────────────────────────┤                          ▼
                               ▼         Enemy (Schooner / Fireship / Sloop / Boarder / Galleon), Rock
 Teclas/botões ──▶ SailController ──velocidade──▶ ShipController ──Gunports──▶ Gunport ──▶ Weapon ──┐
                  (Rizadas/Meio/Cheio)           ShipHull ◀──dano── inimigos e rochedos  (mira sozinha)│ TakeDamage
                                                 ShipUpgrades (Forro de cobre, Velame, Tripulação)     ▼ Killed
                                                                                               GoldWallet
 Mouse ──▶ AllocationController (comprar / melhorar / vender / abrir portinhola / melhorar navio) ◀┘
 Teclas/botões ──▶ AbilityController (barris de pólvora, bordada)
```

- **Regra de ouro: toda a lógica acontece no plano do mar, nunca na tela.** Cada coisa do jogo tem uma posição `Ground` (um `Vector2` em metros): `x` é quanto já andou na rota e `y` é o desvio para o lado (positivo = bombordo, a esquerda do navio). Distância, alcance, arco de tiro e colisão são calculados ali. Só o `GroundBody` converte essa posição para a tela isométrica.
- **"Ground" no código, "plano" no texto.** O nome vem do Fury Hauler, onde era o chão da estrada. Aqui é a superfície do mar: o plano onde o navio, os piratas e os rochedos estão.
- **Por que isso importa aqui:** no isométrico, "3 metros" na tela não têm o mesmo tamanho na horizontal e na vertical. Se o alcance do canhão fosse medido na tela, ele seria maior para os lados do que para frente. Medindo no plano, um círculo de alcance é um círculo de verdade, e o arco de tiro de uma portinhola é um leque de verdade.
- **Duas velocidades.** O navio anda na velocidade das **velas** (`SailController`); os piratas andam no **ritmo do mar** (`GameConfig.seaSpeed`) mais a sobra deles. É dessa diferença que sai a fuga (Parte 1 §3). Nunca faça um inimigo ler a velocidade do navio.
- **Sem física.** Nada cai, quica ou empurra. Não há `Rigidbody2D` nem `Collider2D`: os inimigos se movem por `Vector2.MoveTowards` e os acertos (inclusive rochedos) são checagens de distância. Por isso a nota de `rb.linearVelocity`/`rb.velocity` não se aplica a este guia.

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, organizado, com os pacotes certos e pronto para build Web.

### 0.1 Criar o projeto

1. Instale o **Unity Hub** e uma versão **Unity 6 LTS** (6000.x) com o módulo **Web Build Support** (o alvo é navegador, Parte 1 §1).
2. No Hub, crie um projeto com **New project → Universal 2D** e o nome `SeaHauler`. É outro projeto, separado do Space Hauler.
   - É aqui que o "2.5D" definido na Parte 1 vira decisão técnica: **o projeto é 2D**. O template 2D já vem com URP 2D, sprites e câmera ortográfica.
   - **Isométrico não muda o template.** O "isométrico" vem de uma conta (`IsoProjection`, Fase 1) que converte a posição no plano em posição na tela, e da arte desenhada em perspectiva.
   - O **2D Tilemap Editor** não é usado: o mar não tem casas, é um plano liso com ondas desenhadas por cima (Fase 1).

### 0.2 Estrutura de pastas

Crie dentro de `Assets/`:

```
Assets/_Project/
  Scripts/
    World/       (projeção isométrica, mar, boias, câmera)
    Data/        (GameConfig e os ...Def)
    Ship/        (navio, casco, velas, melhorias, portinholas)
    Leg/         (trecho, spawn, rochedos e rajadas)
    Enemies/
    Weapons/
    Economy/     (ouro e alocação)
    Abilities/
    Run/         (rota, run, Porto, save)
    UI/
  Resources/     (só o GameConfig)
  ScriptableObjects/
    Weapons/
    Enemies/
    Abilities/
    LegTypes/
  Prefabs/
    Enemies/
    Weapons/
    UI/
  Scenes/        (Game)
  Sprites/
```

### 0.3 Pacotes (Window → Package Manager)

| Pacote | Para quê |
|---|---|
| **Input System** (já vem no Unity 6) | Ler clique do mouse e teclas de atalho. |
| **2D Sprite** (vem com o template 2D) | Criar sprites placeholder pelo menu **Create → 2D → Sprites** (losango isométrico, círculo, quadrado). |
| **TextMeshPro** (parte do pacote uGUI no Unity 6) | Textos da UI e das boias. No primeiro uso, aceite **Import TMP Essentials**. |

### 0.4 Cena, camadas de desenho e input

1. Crie a cena `Game` em `Assets/_Project/Scenes/` e adicione-a em **File → Build Profiles → Scene List**.
2. **Sorting Layers** (Edit → Project Settings → Tags and Layers → Sorting Layers), nesta ordem:
   - `Mar`: as ondas e a espuma, sempre por baixo.
   - `Mundo`: navio, inimigos, rochedos, boias e barris.
   - `FX`: balas, fumaça e efeitos.
3. Em **Edit → Project Settings → Player → Other Settings → Active Input Handling**, deixe **Input System Package (New)** ou **Both**.
4. Na **Main Camera**: **Projection = Orthographic**, **Size = 7**, **Background** azul-petróleo (ex.: `#155A7A`). Sem ondas por enquanto, o mar é só essa cor.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- A cena `Game` está na Scene List do Build Profile.
- As 3 Sorting Layers existem na ordem `Mar`, `Mundo`, `FX`.
- Apertar Play mostra a tela azul-petróleo, sem erros.

#### Problemas comuns
- **Não aparece a plataforma Web no Build Profiles:** o módulo **Web Build Support** não foi instalado. No Unity Hub, vá em **Installs → (sua versão) → Add modules**.
- **`InputSystem` não encontrado nos scripts:** o pacote Input System não está instalado, ou o Active Input Handling está em "Input Manager (Old)".

Próxima fase: **Mar Isométrico**, com a conta plano → tela, as ondas, as boias e a câmera.

---

# Parte 4 — Implementação Unity: Fase 1 (Mar Isométrico)

## Fase 1 — Mar Isométrico

> Objetivo desta fase: um objeto navegando sozinho pelo mar isométrico, com ondas presas ao plano, boias passando e a câmera seguindo.

### 1.1 A conta plano → tela: `IsoProjection`

```csharp
// Caminho: Assets/_Project/Scripts/World/IsoProjection.cs
using UnityEngine;

namespace SeaHauler.World
{
    // POR QUE: toda a lógica do jogo acontece no plano do mar (metros, sem
    // perspectiva), mas a tela é isométrica. Esta classe é o único lugar que sabe
    // converter um no outro, então mudar o ângulo da câmera no futuro mexe só aqui.
    // ESTRATÉGIA: isométrico clássico 2:1 (o losango de um metro tem o dobro de
    // largura em relação à altura). O eixo x do plano (a rota) sobe para a
    // direita na tela, e o eixo y (bombordo, a esquerda do navio) sobe para a
    // esquerda. É uma classe "static": não vai em nenhum objeto da cena, é só um
    // conjunto de funções.
    public static class IsoProjection
    {
        // Metade da largura e metade da altura, na tela, de 1 metro do plano.
        public const float HalfWidth = 0.5f;
        public const float HalfHeight = 0.25f;

        // Converte um ponto do plano (com uma altura opcional, ex.: o convés do
        // navio) em posição na tela (coordenadas de mundo da Unity).
        public static Vector3 ToScreen(Vector2 ground, float height = 0f)
        {
            float x = (ground.x - ground.y) * HalfWidth;
            float y = (ground.x + ground.y) * HalfHeight + height;
            return new Vector3(x, y, 0f);
        }

        // O caminho de volta: um ponto da tela (na altura do mar) vira ponto do
        // plano. O mar (Fase 1.3) usa para saber que pedaço do plano a câmera vê.
        public static Vector2 ToGround(Vector2 screen)
        {
            float a = screen.x / HalfWidth;   // = x - y
            float b = screen.y / HalfHeight;  // = x + y
            return new Vector2((a + b) * 0.5f, (b - a) * 0.5f);
        }

        // Converte um ângulo no plano (0 = frente da rota, 90 = bombordo,
        // -90 = estibordo, 180 = trás) em vetor de comprimento 1.
        public static Vector2 Dir(float degrees)
        {
            float rad = degrees * Mathf.Deg2Rad;
            return new Vector2(Mathf.Cos(rad), Mathf.Sin(rad));
        }
    }
}
```

### 1.2 Uma coisa no plano: `GroundBody`

```csharp
// Caminho: Assets/_Project/Scripts/World/GroundBody.cs
using UnityEngine;
using UnityEngine.Rendering;

namespace SeaHauler.World
{
    // POR QUE: navio, inimigos, rochedos, boias e barris vivem no plano do mar.
    // Este componente guarda essa posição e, todo frame, coloca o objeto no
    // lugar certo da tela e na ordem certa de desenho (no isométrico, o que está
    // "mais perto" da câmera precisa ser desenhado por cima).
    // ESTRATÉGIA: a ordem de desenho vem de (x + y) no plano: quanto maior, mais
    // "para o fundo" da tela, então menor a ordem. Um SortingGroup faz o objeto
    // inteiro (com todos os sprites filhos) ser ordenado como um bloco só, o que
    // impede, por exemplo, que a vela de uma escuna apareça por cima do navio.
    [RequireComponent(typeof(SortingGroup))]
    public class GroundBody : MonoBehaviour
    {
        // Precisão da ordenação: 10 = diferenças de 10 cm já mudam a ordem.
        private const float SortPrecision = 10f;

        [SerializeField] private float _height;   // altura acima do mar, em unidades de tela
        [SerializeField] private int _sortBias;   // empurra a ordem para frente (ex.: pirata em cima do navio)

        private SortingGroup _sorting;

        // Posição no plano em metros. É uma propriedade, então para mudar só o x
        // escreva "Ground += new Vector2(dx, 0)" (não dá para fazer "Ground.x += dx").
        public Vector2 Ground { get; set; }

        public float Height
        {
            get => _height;
            set => _height = value;
        }

        // Awake roda uma vez, quando o objeto nasce, antes de qualquer Start.
        private void Awake()
        {
            _sorting = GetComponent<SortingGroup>();
        }

        // LateUpdate roda depois de todos os Update do frame: aqui a lógica já
        // moveu o Ground, e só falta desenhar no lugar novo.
        private void LateUpdate()
        {
            Apply();
        }

        // Atualiza posição na tela e ordem de desenho agora (útil logo depois de
        // teleportar o objeto, para ele não aparecer um frame no lugar antigo).
        public void Apply()
        {
            transform.position = IsoProjection.ToScreen(Ground, _height);
            _sorting.sortingOrder = _sortBias - Mathf.RoundToInt((Ground.x + Ground.y) * SortPrecision);
        }
    }
}
```

> A `sortingOrder` aceita valores de -32768 a 32767. Com precisão 10, isso cobre uns 3 km de rota, bem mais que um trecho (900 m, Parte 1 §17). Se um trecho ficar maior que isso, reduza `SortPrecision`.

### 1.3 O mar: `SeaView`

No Space Hauler, sem chão, o movimento vinha das estrelas em parallax. Aqui há chão: **o mar é o plano**. As cristas de onda ficam **presas a ele**, então correm para trás quando o navio anda, exatamente como a areia passando no Fury Hauler (Parte 1 §13).

```csharp
// Caminho: Assets/_Project/Scripts/World/SeaView.cs
using System.Collections.Generic;
using UnityEngine;

namespace SeaHauler.World
{
    // POR QUE: o mar liso não mostra movimento. Cristas de onda presas ao plano
    // passam pelo navio e dão a sensação de velocidade (mais rápidas de Pano
    // cheio, mais lentas em Rizadas) sem nenhuma regra de jogo.
    // ESTRATÉGIA: um número fixo de cristas (sprites pequenos) é criado uma vez,
    // cada uma com uma posição "de casa" num quadrado de _area metros do plano.
    // Todo frame, a posição real é a casa "dobrada" (Mathf.Repeat) em volta do
    // ponto do plano que a câmera olha: a crista fica parada no mar, e quando sai
    // de um lado do quadrado reaparece do outro. Nada é criado nem destruído
    // durante o jogo. O brilho de cada crista sobe e desce num seno, para o mar
    // parecer vivo mesmo com o navio parado.
    public class SeaView : MonoBehaviour
    {
        [SerializeField] private Camera _camera;
        [SerializeField] private Sprite _crestSprite;   // um traço claro, mais largo que alto
        [SerializeField] private int _count = 260;
        [SerializeField] private float _area = 60f;     // metros de lado do quadrado coberto
        [SerializeField] private Color _color = new Color(0.55f, 0.85f, 0.95f, 0.45f);

        private readonly List<(SpriteRenderer crest, Vector2 home, float speed, float phase)> _crests = new();

        private void Start()
        {
            for (int i = 0; i < _count; i++)
            {
                var go = new GameObject("Crest");
                go.transform.SetParent(transform, false);
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sprite = _crestSprite;
                sr.sortingLayerName = "Mar";
                go.transform.localScale = new Vector3(Random.Range(0.15f, 0.4f), 0.03f, 1f);
                var home = new Vector2(Random.Range(0f, _area), Random.Range(0f, _area));
                _crests.Add((sr, home, Random.Range(1.2f, 2.7f), Random.Range(0f, 6.3f)));
            }
        }

        // Recoloca cada crista no quadrado em volta do centro da câmera e anima o brilho.
        private void LateUpdate()
        {
            Vector2 center = IsoProjection.ToGround(_camera.transform.position);
            float time = Time.time;
            foreach (var (crest, home, speed, phase) in _crests)
            {
                float x = center.x + Mathf.Repeat(home.x - center.x, _area) - _area * 0.5f;
                float y = center.y + Mathf.Repeat(home.y - center.y, _area) - _area * 0.5f;
                crest.transform.position = IsoProjection.ToScreen(new Vector2(x, y));
                float shine = Mathf.Max(0f, Mathf.Sin(time * speed + phase));
                Color c = _color;
                c.a *= shine;
                crest.color = c;
            }
        }
    }
}
```

> Com `_area = 60` e a câmera em `Size = 7`, o quadrado cobre a tela com folga. Se aparecer um "buraco" sem ondas nos cantos (telas muito largas), aumente `_area` e `_count` juntos, para a densidade continuar a mesma.

### 1.4 As boias da rota: `BuoyLine`

As ondas dão movimento, mas não dão **distância**. As boias (Parte 1 §13) ficam nos dois lados da rota, a cada 100 m: vermelhas a bombordo e verdes a estibordo, com a distância até o fim escrita na verde.

```csharp
// Caminho: Assets/_Project/Scripts/World/BuoyLine.cs
using System.Collections.Generic;
using TMPro;
using UnityEngine;

namespace SeaHauler.World
{
    // POR QUE: dar referência de distância e de "por onde a rota passa" num mar
    // sem estrada.
    // ESTRATÉGIA: um número fixo de pares de boias é criado uma vez e
    // reposicionado conforme o objeto seguido avança. Cada boia é um GroundBody
    // (entra na ordem de desenho do mundo, então um inimigo pode passar na
    // frente ou atrás dela). As cores seguem a sinalização marítima: vermelha a
    // bombordo, verde a estibordo.
    public class BuoyLine : MonoBehaviour
    {
        [SerializeField] private GroundBody _follow;          // normalmente o navio
        [SerializeField] private GroundBody _portBuoy;        // prefab da boia vermelha
        [SerializeField] private GroundBody _starboardBuoy;   // prefab da boia verde (com um TMP_Text filho)
        [SerializeField] private float _spacing = 100f;       // metros entre pares
        [SerializeField] private float _sideOffset = 8f;      // metros para cada lado da rota
        [SerializeField] private int _pairsBehind = 1;
        [SerializeField] private int _pairsAhead = 2;

        private readonly List<(GroundBody port, GroundBody starboard)> _pairs = new();
        private int _firstIndex = int.MinValue;

        // Comprimento do trecho atual, para escrever "faltam X m". O LegManager
        // (Fase 2) atualiza este valor ao começar cada trecho.
        public float LegLength { get; set; } = 900f;

        private void Start()
        {
            for (int i = 0; i < _pairsBehind + _pairsAhead + 1; i++)
                _pairs.Add((Instantiate(_portBuoy, transform), Instantiate(_starboardBuoy, transform)));
        }

        // Quando o objeto seguido passa da próxima boia, os pares são redistribuídos.
        private void LateUpdate()
        {
            if (_follow == null) return;
            int center = Mathf.FloorToInt(_follow.Ground.x / _spacing);
            int first = center - _pairsBehind;
            if (first == _firstIndex) return;
            _firstIndex = first;

            for (int i = 0; i < _pairs.Count; i++)
            {
                float x = (first + i + 1) * _spacing;
                Place(_pairs[i].port, new Vector2(x, _sideOffset), null);
                Place(_pairs[i].starboard, new Vector2(x, -_sideOffset), $"{Mathf.Max(0f, LegLength - x):0} m");
            }
        }

        // Começo de trecho: força redistribuir na próxima vez (o navio voltou para x = 0).
        public void ResetLine() => _firstIndex = int.MinValue;

        // Põe uma boia no plano e escreve o texto dela (se houver um TMP_Text).
        private static void Place(GroundBody buoy, Vector2 ground, string label)
        {
            buoy.Ground = ground;
            buoy.Apply();
            TMP_Text text = buoy.GetComponentInChildren<TMP_Text>();
            if (text != null) text.text = label ?? "";
        }
    }
}
```

### 1.5 A câmera: `CameraFollow`

```csharp
// Caminho: Assets/_Project/Scripts/World/CameraFollow.cs
using UnityEngine;

namespace SeaHauler.World
{
    // POR QUE: o navio nunca para, então a câmera precisa ir junto, com um pouco
    // de folga à frente para o jogador ver quem está chegando.
    // ESTRATÉGIA: segue um ponto do plano um pouco à frente do alvo, com
    // suavização exponencial (chega rápido quando está longe e devagar quando
    // está perto, sem tremer). A folga cresce com a velocidade (LeadPerSpeed),
    // para o jogador ver mais à frente quando corre de Pano cheio.
    // DefaultExecutionOrder(100) faz este LateUpdate rodar depois do LateUpdate
    // do GroundBody, que já posicionou o alvo. O SeaView lê a posição da câmera:
    // dê a ele DefaultExecutionOrder maior, ou deixe as ondas um frame
    // atrasadas (não dá para perceber).
    [DefaultExecutionOrder(100)]
    public class CameraFollow : MonoBehaviour
    {
        [SerializeField] private GroundBody _target;
        [SerializeField] private Vector2 _groundOffset = new Vector2(3f, 0f); // metros à frente
        [SerializeField] private float _sharpness = 6f;

        // Quem quiser (o navio, Fase 2) diz quantos metros a mais olhar à frente.
        public float ExtraLead { get; set; }

        private void LateUpdate()
        {
            if (_target == null) return;

            Vector3 goal = IsoProjection.ToScreen(_target.Ground + _groundOffset + new Vector2(ExtraLead, 0f));
            goal.z = transform.position.z; // a câmera 2D fica em z = -10; não mexer nisso
            float t = 1f - Mathf.Exp(-_sharpness * Time.deltaTime);
            transform.position = Vector3.Lerp(transform.position, goal, t);
        }
    }
}
```

### 1.6 Um teste que navega sozinho: `GroundDriverTest`

Script temporário, só para esta fase. Na Fase 2 o `ShipController` faz isso de verdade e este arquivo pode ser apagado.

```csharp
// Caminho: Assets/_Project/Scripts/World/GroundDriverTest.cs
using UnityEngine;

namespace SeaHauler.World
{
    // POR QUE: testar ondas, boias e câmera antes de existir o navio.
    // ESTRATÉGIA: empurra o GroundBody para frente no eixo x do plano.
    [RequireComponent(typeof(GroundBody))]
    public class GroundDriverTest : MonoBehaviour
    {
        [SerializeField] private float _speed = 10f; // metros por segundo

        private GroundBody _body;

        private void Awake()
        {
            _body = GetComponent<GroundBody>();
        }

        // Update roda uma vez por frame; Time.deltaTime é o tempo desde o frame
        // anterior, então "velocidade × deltaTime" anda certo em qualquer FPS.
        private void Update()
        {
            _body.Ground += new Vector2(_speed * Time.deltaTime, 0f);
        }
    }
}
```

### 1.7 Montar a cena

1. **Sprites placeholder:** em `Assets/_Project/Sprites/`, clique com o botão direito → **Create → 2D → Sprites → Isometric Diamond** (nome `Diamond`), e também **Square** e **Circle**.
2. **Objeto de teste:** crie um GameObject vazio `Ship`, adicione **GroundBody** (o `SortingGroup` entra junto) e **GroundDriverTest**. No `SortingGroup`, **Sorting Layer = Mundo**. Como filho, adicione um sprite `Square` chamado `Body`, cor quase preta (`#2A221C`), escala `(1.6, 0.6, 1)`.
3. **Mar:** crie um GameObject vazio `Sea` com **SeaView**: `Camera` = Main Camera, `Crest Sprite` = `Square`.
4. **Prefabs das boias:** GameObject `BuoyPort` com **GroundBody** (`SortingGroup` em **Mundo**) e um filho sprite `Square` vermelho (`#C83A2A`, escala `(0.15, 0.35, 1)`). Duplique como `BuoyStarboard`, troque a cor para verde (`#2A9A4A`) e adicione um filho **TextMeshPro (3D, não o de UI)** chamado `Label`, com tamanho de fonte `2`, um pouco abaixo do sprite. Arraste os dois para `Prefabs/` e apague da cena.
5. **Boias:** GameObject vazio `Buoys` com **BuoyLine**: `Follow` = `Ship`, `Port Buoy` = `BuoyPort`, `Starboard Buoy` = `BuoyStarboard`.
6. **Câmera:** adicione **CameraFollow** na `Main Camera`, com `Target` = `Ship`.

### ✅ Checkpoint da Fase 1
- No Play, o retângulo do navio anda na diagonal (subindo para a direita) e a câmera vai junto.
- As cristas de onda **passam para trás** do navio, piscando devagar. Nenhuma "acaba": a tela nunca fica sem ondas.
- Pares de boias passam pelos dois lados a cada 100 m: a vermelha em cima à esquerda (bombordo) e a verde embaixo à direita (estibordo), mostrando quantos metros faltam.
- Mudando a `Speed` do `GroundDriverTest` durante o Play, as ondas passam mais rápido ou mais devagar.
- Na janela **Hierarchy**, o número de cristas e de boias fica fixo durante o Play.

#### Problemas comuns
- **As ondas andam junto com o navio:** o `SeaView` está somando a posição da câmera na tela, em vez de converter para o plano com `IsoProjection.ToGround`. A crista precisa ter uma posição fixa no **plano**.
- **As ondas aparecem por cima do navio:** a Sorting Layer das cristas não é `Mar`, ou a camada `Mar` não está antes de `Mundo` na lista.
- **O texto da boia aparece gigante ou some:** o `Label` precisa ser o **TextMeshPro** de mundo (menu **3D Object → Text - TextMeshPro**), não o de UI, e com fonte pequena (a unidade aqui é o metro da tela).

Próxima fase: **Navio, Velas e Trecho**, com o navio de verdade, casco, velas, portinholas e o fim do trecho.

---

# Parte 5 — Implementação Unity: Fase 2 (Navio, Velas e Trecho)

## Fase 2 — Navio, Velas e Trecho

> Objetivo desta fase: o navio navega sozinho do começo ao fim de um trecho de 900 m na velocidade das velas (que o jogador troca com `Z`, `X` e `C`), tem casco e 8 portinholas marcadas (cada uma com o seu arco de tiro), e o jogo sabe quando o trecho acabou.

### 2.1 Os números do jogo: `GameConfig`

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameConfig.cs
using UnityEngine;

namespace SeaHauler.Data
{
    // POR QUE: os números do jogo ainda são placeholders (Parte 1 §17). Num
    // asset, dá para mudar no Inspector, até durante o Play, sem tocar em código.
    // ESTRATÉGIA: um ScriptableObject é um "arquivo de dados" da Unity, criado
    // pelo menu Create. Como existe um só, ele fica em Resources/ e é carregado
    // por nome na primeira vez que alguém pede GameConfig.I.
    [CreateAssetMenu(menuName = "Sea Hauler/Game Config", fileName = "GameConfig")]
    public class GameConfig : ScriptableObject
    {
        [Header("Navio (Parte 1 §3)")]
        public float shipBaseHull = 500f;           // casco sem Forro de cobre
        public float shipRadius = 1.6f;             // raio de colisão com rochedos

        [Header("Velas (Parte 1 §3)")]
        public float reefedSpeed = 6f;              // Rizadas, metros por segundo
        public float halfSpeed = 10f;               // Meio pano
        public float fullSpeed = 13f;               // Pano cheio, sem Velame
        public float sailAcceleration = 3f;         // m/s ganhos ou perdidos por segundo ao trocar
        public float seaSpeed = 10f;                // o ritmo dos piratas (não acompanham o Pano cheio)

        [Header("Forro de cobre (Parte 1 §6)")]
        public int copperMaxLevel = 5;
        public int copperCostPerLevel = 50;         // o nível n custa isto × n
        public float copperHullPerLevel = 50f;      // + casco máximo por nível
        [Range(0f, 0.2f)] public float copperCollisionReductionPerLevel = 0.12f;

        [Header("Velame (Parte 1 §6)")]
        public int riggingMaxLevel = 3;
        public int riggingCostPerLevel = 60;
        public float riggingFullSpeedPerLevel = 1.5f; // + m/s no Pano cheio

        [Header("Tripulação (Parte 1 §6)")]
        public int crewMaxLevel = 3;
        public int crewCostPerLevel = 60;
        public float crewRepairPerSecondPerLevel = 0.2f;

        [Header("Portinholas (Parte 1 §4)")]
        public int[] gunportOpenCosts = { 60, 80, 100, 120 }; // a 1ª aberta, a 2ª...

        [Header("Trecho (Parte 1 §9)")]
        public float legLength = 900f;              // metros
        public float laneHalfWidth = 6f;            // metros: largura da faixa dos barris de pólvora
        public float enemyDespawnDistance = 40f;    // inimigo mais longe que isso do navio some sem dar ouro

        [Header("Spawn de inimigos (Parte 1 §17)")]
        public float spawnBudgetBase = 0.4f;        // pontos por segundo
        public float spawnBudgetPerDifficulty = 0.15f;
        public float spawnDistanceMin = 20f;        // metros do navio
        public float spawnDistanceMax = 26f;
        [Range(0f, 1f)] public float bossSpawnAtProgress = 0.3f;

        [Header("Rochedos (Parte 1 §9)")]
        public float rocksPerSecond = 0.4f;         // a Meio pano (a densidade é por distância)
        public float rockAheadMin = 34f;
        public float rockAheadMax = 42f;
        public float rockLateralSpread = 16f;
        public float rockRadiusMin = 0.8f;
        public float rockRadiusMax = 2.2f;
        public float rockDamagePerRadius = 16f;     // × (velocidade ÷ ritmo do mar)

        [Header("Rajadas (Parte 1 §9)")]
        public float squallIntervalMin = 9f;
        public float squallIntervalMax = 13f;
        public float squallWarning = 2.5f;          // segundos de aviso
        public float squallTornSeconds = 8f;        // velas rasgadas: navio em Rizadas
        public float squallDamage = 20f;

        [Header("Ouro (Parte 1 §6)")]
        public int startingGold = 100;
        [Range(0f, 1f)] public float sellRefund = 0.5f;

        [Header("Rota e Porto (Parte 1 §9 e §10)")]
        public int routeLayers = 6;                 // inclui o trecho do destino
        public int minNodesPerLayer = 2;
        public int maxNodesPerLayer = 3;
        [Range(0f, 1f)] public float portChance = 0.25f;
        public float goldBonusPerRisk = 0.25f;
        public float repairHullPerGold = 2f;

        [Header("Regras Em aberto (placeholders)")]
        public bool bossBlocksArrival = true;        // Parte 1 §8
        public bool boarderIgnoresArcs = true;       // Parte 1 §8: qualquer arma mira no pirata a bordo

        private static GameConfig _instance;

        // Acesso de qualquer script: GameConfig.I.seaSpeed
        public static GameConfig I
        {
            get
            {
                if (_instance == null)
                {
                    _instance = Resources.Load<GameConfig>("GameConfig");
                    if (_instance == null)
                        Debug.LogError("GameConfig não encontrado. Crie em Assets/_Project/Resources/GameConfig.asset.");
                }
                return _instance;
            }
        }
    }
}
```

> Não existe opção para o casco voltar sozinho entre trechos: a Parte 1 §3 **definiu** que ele só volta no Porto (e aos poucos, com a Tripulação).

### 2.2 Uma portinhola no navio: `Gunport` (versão 1)

Esta versão só sabe **onde** a portinhola fica, **para onde** ela pode atirar e se está **aberta**. Na Fase 4 ela é substituída pela versão final, que também guarda a arma montada.

```csharp
// Caminho: Assets/_Project/Scripts/Ship/Gunport.cs
using SeaHauler.World;
using UnityEngine;

namespace SeaHauler.Ship
{
    // POR QUE: a decisão central do jogador é "qual arma em qual portinhola"
    // (Parte 1 §4). Cada portinhola tem uma posição no navio e um arco de tiro, e
    // nenhuma cobre 360°: com piratas vindo de todo lado, sempre sobra um lado fraco.
    // ESTRATÉGIA: a portinhola guarda um deslocamento no plano em relação ao
    // centro do navio, então sua posição real é sempre "navio + deslocamento". O
    // arco é um leque: direção central + abertura. _startsOpen diz se ela vem
    // aberta no começo da run (Parte 1 §4: 4 começam fechadas).
    // DefaultExecutionOrder(50) faz a portinhola se posicionar depois do
    // GroundBody do navio, para não ficar um frame atrasada.
    [DefaultExecutionOrder(50)]
    public class Gunport : MonoBehaviour
    {
        [SerializeField] private string _label = "Proa";
        [SerializeField] private Vector2 _offset;                 // metros a partir do centro do navio
        [SerializeField] private float _height = 0.3f;           // altura na tela (no convés)
        [SerializeField] private float _facingDegrees;           // 0 proa, 90 bombordo, -90 estibordo, 180 popa
        [SerializeField, Range(10f, 359f)] private float _arcDegrees = 180f;
        [SerializeField] private bool _startsOpen = true;
        [SerializeField] private SpriteRenderer _marker;
        [SerializeField] private Color _idleColor = new Color(1f, 0.95f, 0.8f, 0.45f);
        [SerializeField] private Color _closedColor = new Color(0.5f, 0.12f, 0.08f, 0.9f);
        [SerializeField] private Color _sabotagedColor = Color.red;

        private int _saboteurs;

        public ShipController Ship { get; private set; }
        public string Label => _label;
        public float FacingDegrees => _facingDegrees;
        public float ArcDegrees => _arcDegrees;
        public bool StartsOpen => _startsOpen;
        public bool IsOpen { get; private set; }
        public bool Sabotaged => _saboteurs > 0;
        public Vector2 Ground => Ship.Body.Ground + _offset;

        // Chamado pelo navio no Awake dele: a portinhola passa a saber a quem pertence.
        public void Bind(ShipController ship)
        {
            Ship = ship;
            IsOpen = _startsOpen;
        }

        // Abre a portinhola (quem cobra é a alocação, Fase 5).
        public void Open() => IsOpen = true;

        // Volta ao estado do começo de run (aberta ou fechada).
        public void ResetOpen() => IsOpen = _startsOpen;

        // Diz se um ponto do plano está dentro do arco de tiro desta portinhola.
        public bool CanTarget(Vector2 point)
        {
            Vector2 toPoint = point - Ground;
            if (toPoint.sqrMagnitude < 0.0001f) return true;   // em cima da portinhola (pirata a bordo)
            float angle = Vector2.SignedAngle(IsoProjection.Dir(_facingDegrees), toPoint);
            return Mathf.Abs(angle) <= _arcDegrees * 0.5f;
        }

        // Piratas a bordo (Fase 3) avisam quando sobem e quando saem da portinhola.
        public void AddSaboteur() => _saboteurs++;
        public void RemoveSaboteur() => _saboteurs = Mathf.Max(0, _saboteurs - 1);

        private void LateUpdate()
        {
            if (Ship == null) return;
            transform.position = IsoProjection.ToScreen(Ground, _height);
            if (_marker != null) _marker.color = Sabotaged ? _sabotagedColor : IsOpen ? _idleColor : _closedColor;
        }
    }
}
```

> O `Range` do arco vai até 359, de propósito: 360 seria uma portinhola que atira para todo lado, e a Parte 1 §4 diz que nenhuma faz isso.

### 2.3 O casco: `ShipHull`

```csharp
// Caminho: Assets/_Project/Scripts/Ship/ShipHull.cs
using System;
using SeaHauler.Data;
using UnityEngine;

namespace SeaHauler.Ship
{
    // POR QUE: casco zero afunda o navio e acaba a run (Parte 1 §12). Todo dano
    // (tiros, brulotes, piratas a bordo, rochedos, rajadas) passa por aqui, então
    // a regra "o Forro de cobre reduz só o dano de colisão" (Parte 1 §6) fica num
    // lugar só.
    // ESTRATÉGIA: eventos C# (event Action) avisam a UI e o LegManager quando o
    // casco muda ou chega a zero, sem eles precisarem checar todo frame. O sprite
    // do navio pisca em vermelho ao levar dano, porque os tiros inimigos são
    // instantâneos (placeholder, Parte 1 §8) e o jogador precisa perceber.
    public class ShipHull : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _bodyRenderer;
        [SerializeField] private Color _hitColor = new Color(1f, 0.35f, 0.3f);

        private ShipController _ship;
        private Color _baseColor;
        private float _flashTimer;

        // Casco máximo. Na Fase 5 esta linha passa a somar o Forro de cobre.
        public float Max => GameConfig.I.shipBaseHull;

        // Quanto do dano de COLISÃO é ignorado (0 a 1). Na Fase 5 esta linha passa a ler o Forro de cobre.
        public float CollisionReduction => 0f;

        public float Current { get; private set; }
        public bool IsDead => Current <= 0f;

        public event Action Changed;
        public event Action Died;

        private void Awake()
        {
            _ship = GetComponent<ShipController>();
            Current = Max;
            if (_bodyRenderer != null) _baseColor = _bodyRenderer.color;
        }

        // Volta para o casco cheio (começo de run).
        public void ResetFull()
        {
            Current = Max;
            Changed?.Invoke();
        }

        // Aplica dano. collision = true para rochedos e brulotes: só esse dano é
        // reduzido pelo Forro de cobre.
        public void TakeDamage(float amount, bool collision = false)
        {
            if (IsDead || amount <= 0f) return;

            float final = collision ? amount * (1f - CollisionReduction) : amount;
            Current = Mathf.Max(0f, Current - final);
            if (amount >= 1f) _flashTimer = 0.1f;   // o dano contínuo (pirata a bordo) não pisca todo frame
            Changed?.Invoke();
            if (IsDead) Died?.Invoke();
        }

        // Recupera casco, sem passar do máximo (Porto, Tripulação, nível novo de Forro de cobre).
        public void Repair(float amount)
        {
            if (amount <= 0f || IsDead) return;
            Current = Mathf.Min(Max, Current + amount);
            Changed?.Invoke();
        }

        // Faz o sprite voltar à cor normal depois da piscada.
        private void Update()
        {
            if (_bodyRenderer == null) return;
            _flashTimer -= Time.deltaTime;
            _bodyRenderer.color = _flashTimer > 0f ? _hitColor : _baseColor;
        }
    }
}
```

> O campo `_ship` ainda não é usado: ele sai na Fase 5, quando o casco passa a ler as melhorias. A Unity mostra um aviso amarelo de "campo não usado", que pode ser ignorado até lá.

### 2.4 As velas: `SailController`

É o controle que este jogo acrescenta à série (Parte 1 §3): três posições, trocadas em tempo real. A troca não muda a velocidade de uma vez: o navio ganha ou perde embalo.

```csharp
// Caminho: Assets/_Project/Scripts/Ship/SailController.cs
using System;
using SeaHauler.Data;
using UnityEngine;
using UnityEngine.InputSystem;

namespace SeaHauler.Ship
{
    // As três posições das velas, da mais lenta para a mais rápida.
    public enum SailSetting { Reefed, Half, Full }

    // POR QUE: correr ou lutar (Parte 1 §3). De Pano cheio o navio passa do
    // ritmo dos piratas e deixa para trás quem vem com pouca sobra; em Rizadas
    // eles alcançam rápido. A Tempestade (Fase 3) rasga o Pano cheio.
    // ESTRATÉGIA: guarda a posição ESCOLHIDA (Setting) e a que VALE (Effective):
    // com as velas rasgadas, vale Rizadas até o conserto, mas a escolha do
    // jogador fica guardada e volta sozinha. A velocidade atual persegue a
    // velocidade da posição que vale, no máximo sailAcceleration m/s por segundo.
    // As teclas Z, X e C escolhem direto; seta para cima e para baixo sobem e
    // descem uma posição. A velocidade do Pano cheio pode crescer com o Velame
    // (Fase 5), por isso ela é lida por uma função que a Fase 5 completa.
    public class SailController : MonoBehaviour
    {
        private float _tornTimer;

        public SailSetting Setting { get; private set; } = SailSetting.Half;
        public SailSetting Effective => IsTorn ? SailSetting.Reefed : Setting;
        public bool IsTorn => _tornTimer > 0f;
        public float TornSecondsLeft => Mathf.Max(0f, _tornTimer);
        public float CurrentSpeed { get; private set; }
        public bool InputEnabled { get; set; } = true;

        public event Action Changed;   // a posição escolhida ou o estado das velas mudou

        private void Start()
        {
            CurrentSpeed = SpeedOf(Setting);
        }

        // Velocidade de uma posição, em metros por segundo. Na Fase 5 o Pano
        // cheio passa a somar o Velame.
        public float SpeedOf(SailSetting setting)
        {
            GameConfig cfg = GameConfig.I;
            return setting switch
            {
                SailSetting.Reefed => cfg.reefedSpeed,
                SailSetting.Half => cfg.halfSpeed,
                _ => cfg.fullSpeed,
            };
        }

        // Escolhe uma posição (botões da UI e teclas).
        public void Set(SailSetting setting)
        {
            if (setting == Setting) return;
            Setting = setting;
            Changed?.Invoke();
        }

        // Rasga as velas: o navio fica em Rizadas por alguns segundos (rajada, Fase 3).
        public void Tear(float seconds)
        {
            _tornTimer = Mathf.Max(_tornTimer, seconds);
            Changed?.Invoke();
        }

        // Começo de trecho: velas inteiras, já na velocidade da posição escolhida.
        public void ResetForLeg()
        {
            _tornTimer = 0f;
            CurrentSpeed = SpeedOf(Setting);
            Changed?.Invoke();
        }

        private void Update()
        {
            ReadKeys();

            if (_tornTimer > 0f)
            {
                _tornTimer -= Time.deltaTime;
                if (_tornTimer <= 0f) Changed?.Invoke();   // velas consertadas
            }

            float target = SpeedOf(Effective);
            CurrentSpeed = Mathf.MoveTowards(CurrentSpeed, target, GameConfig.I.sailAcceleration * Time.deltaTime);
        }

        // Atalhos: Z Rizadas, X Meio pano, C Pano cheio, setas sobem e descem.
        private void ReadKeys()
        {
            Keyboard k = Keyboard.current;
            if (k == null || !InputEnabled) return;
            if (k.zKey.wasPressedThisFrame) Set(SailSetting.Reefed);
            if (k.xKey.wasPressedThisFrame) Set(SailSetting.Half);
            if (k.cKey.wasPressedThisFrame) Set(SailSetting.Full);
            if (k.upArrowKey.wasPressedThisFrame && Setting < SailSetting.Full) Set(Setting + 1);
            if (k.downArrowKey.wasPressedThisFrame && Setting > SailSetting.Reefed) Set(Setting - 1);
        }
    }
}
```

> `Mathf.MoveTowards` com floats faz o mesmo que com vetores: anda até o alvo sem passar dele. É o "ganhar embalo aos poucos" da Parte 1 §3.

### 2.5 O navio: `ShipController`

```csharp
// Caminho: Assets/_Project/Scripts/Ship/ShipController.cs
using System.Collections.Generic;
using SeaHauler.Data;
using SeaHauler.World;
using UnityEngine;

namespace SeaHauler.Ship
{
    // POR QUE: o navio segue a rota sozinho e o jogador nunca vira o leme
    // (Parte 1 §3). Ele é o centro de tudo: inimigos o cercam, armas montam nele
    // e a câmera o segue.
    // ESTRATÉGIA: anda no eixo x do plano na velocidade que o SailController
    // calcula. Também troca o sprite do mastreame conforme a posição das velas
    // (Parte 1 §13: um sprite por posição) e diz à câmera para olhar mais à
    // frente quando corre. As portinholas são encontradas automaticamente
    // entre os filhos, então basta arrastá-las para dentro do navio na Hierarchy.
    [RequireComponent(typeof(GroundBody), typeof(ShipHull), typeof(SailController))]
    public class ShipController : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _rigRenderer;      // o mastreame (velas)
        [SerializeField] private Sprite[] _rigSprites = new Sprite[3]; // Rizadas, Meio pano, Pano cheio
        [SerializeField] private CameraFollow _camera;
        [SerializeField] private float _cameraLeadPerSpeed = 0.4f;   // metros à frente por m/s acima do ritmo do mar

        private readonly List<Gunport> _gunports = new();

        public GroundBody Body { get; private set; }
        public ShipHull Hull { get; private set; }
        public SailController Sails { get; private set; }
        public IReadOnlyList<Gunport> Gunports => _gunports;
        public bool IsSailing { get; set; }
        public float Speed => Sails.CurrentSpeed;
        public Vector2 Ground => Body.Ground;
        public float Distance => Body.Ground.x;

        private void Awake()
        {
            Body = GetComponent<GroundBody>();
            Hull = GetComponent<ShipHull>();
            Sails = GetComponent<SailController>();
            GetComponentsInChildren(_gunports);
            foreach (Gunport gunport in _gunports) gunport.Bind(this);
        }

        // Navega para frente enquanto o trecho estiver rolando.
        private void Update()
        {
            if (IsSailing) Body.Ground += new Vector2(Speed * Time.deltaTime, 0f);

            int rig = (int)Sails.Effective;
            if (_rigRenderer != null && rig < _rigSprites.Length && _rigSprites[rig] != null)
                _rigRenderer.sprite = _rigSprites[rig];
            if (_camera != null)
                _camera.ExtraLead = (Speed - GameConfig.I.seaSpeed) * _cameraLeadPerSpeed;
        }

        // Volta para o começo da rota (início de cada trecho).
        public void ResetForLeg()
        {
            Body.Ground = Vector2.zero;
            Sails.ResetForLeg();
            Body.Apply();
        }
    }
}
```

### 2.6 O trecho: `LegManager`

O trecho carrega o **padrão** do tipo de trecho (Parte 1 §9): de que arco os piratas nascem, se há rochedos ou rajadas, e quanto do orçamento de spawn vale. Quem preenche isso é o nó do mapa (Fase 7); até lá, as `Test Settings` do Inspector servem para testar cada tipo.

```csharp
// Caminho: Assets/_Project/Scripts/Leg/LegManager.cs
using System;
using SeaHauler.Data;
using SeaHauler.Ship;
using SeaHauler.World;
using UnityEngine;

namespace SeaHauler.Leg
{
    // Tudo que muda de um trecho para outro (vem do nó do mapa de rota, Fase 7).
    // [Serializable] faz a struct aparecer no Inspector.
    [Serializable]
    public struct LegSettings
    {
        public string label;
        public int difficulty;          // mais alto = mais inimigos por segundo
        public bool hasBoss;
        public float goldMultiplier;    // trechos de mais risco pagam mais
        public float spawnArcMin;       // graus em volta do navio: 0 = frente, 180 = trás
        public float spawnArcMax;
        public float spawnMultiplier;   // Tempestade: menos piratas
        public bool rocks;              // Recifes
        public bool squalls;            // Tempestade
    }

    // POR QUE: alguém precisa dizer "o trecho começou" e "o trecho acabou, com
    // sucesso ou não". Spawner, rochedos, rajadas, ouro, habilidades e a run
    // escutam isso.
    // ESTRATÉGIA: o trecho termina com sucesso quando o navio passa do
    // comprimento do trecho e nada está "segurando" a chegada. O Galeão (Fase 3)
    // segura a chegada enquanto está vivo, através de um contador genérico de
    // bloqueios, para o LegManager não precisar conhecer o Galeão. O campo
    // _startOnPlay permite testar as Fases 2 a 6 sem a run da Fase 7.
    public class LegManager : MonoBehaviour
    {
        public static LegManager Current { get; private set; }

        [SerializeField] private ShipController _ship;
        [SerializeField] private BuoyLine _buoys;           // opcional: para as boias saberem o comprimento
        [SerializeField] private bool _startOnPlay = true;  // desligar na Fase 7
        [SerializeField] private LegSettings _testSettings = new LegSettings
        {
            label = "Trecho de teste",
            difficulty = 2,
            hasBoss = false,
            goldMultiplier = 1f,
            spawnArcMin = 145f,   // Mar aberto: por trás
            spawnArcMax = 215f,
            spawnMultiplier = 1f,
            rocks = false,
            squalls = false,
        };

        private int _arrivalBlockers;

        public ShipController Ship => _ship;
        public LegSettings Settings { get; private set; }
        public bool IsRunning { get; private set; }
        public float Length => GameConfig.I.legLength;
        public float Progress01 => Mathf.Clamp01(_ship.Distance / Length);

        public event Action<LegSettings> Started;
        public event Action<bool> Ended; // true = chegou ao fim do trecho

        private void Awake()
        {
            Current = this;
        }

        private void Start()
        {
            _ship.Hull.Died += OnShipSunk;
            if (_startOnPlay) StartLeg(_testSettings);
        }

        // Começa um trecho: navio no início, navegando, e todo mundo avisado.
        public void StartLeg(LegSettings settings)
        {
            if (settings.spawnMultiplier <= 0f) settings.spawnMultiplier = 1f; // struct sem o campo preenchido
            Settings = settings;
            _arrivalBlockers = 0;
            _ship.ResetForLeg();
            _ship.IsSailing = true;
            if (_buoys != null)
            {
                _buoys.LegLength = Length;
                _buoys.ResetLine();
            }
            IsRunning = true;
            Started?.Invoke(settings);
        }

        // Algo (o Galeão) impede o trecho de terminar enquanto existir.
        public void AddArrivalBlocker() => _arrivalBlockers++;
        public void RemoveArrivalBlocker() => _arrivalBlockers = Mathf.Max(0, _arrivalBlockers - 1);

        // Checa a chegada todo frame.
        private void Update()
        {
            if (!IsRunning) return;
            if (_ship.Distance >= Length && _arrivalBlockers == 0) End(true);
        }

        private void OnShipSunk()
        {
            if (IsRunning) End(false);
        }

        // Para o navio e avisa o resultado.
        private void End(bool success)
        {
            IsRunning = false;
            _ship.IsSailing = false;
            Debug.Log(success ? "Trecho concluído." : "Navio afundado.");
            Ended?.Invoke(success);
        }
    }
}
```

> Com o Galeão segurando a chegada, o navio continua navegando **depois** dos 900 m até ele afundar. Isso é de propósito: a câmera e as boias continuam funcionando, e o Galeão continua rondando.

### 2.7 Montar na cena

1. **GameConfig:** em `Assets/_Project/Resources/`, **Create → Sea Hauler → Game Config**, com o nome exato `GameConfig`.
2. **Navio:** no objeto `Ship` da Fase 1, remova o **GroundDriverTest** (pode apagar o script) e adicione **ShipController** (o `ShipHull` e o `SailController` entram juntos). Em **ShipHull**, `Body Renderer` = o sprite `Body`.
3. **Mastreame:** crie um filho `Rig` do `Ship` com um sprite `Square` creme (`#EFE6D0`), escala `(0.3, 1.4, 1)`, posição `(0, 0.8, 0)` e **Order in Layer = 3**. Ligue em `Rig Renderer`. Por enquanto deixe `Rig Sprites` vazio (sem sprites, o mastreame não troca; com a arte final, entram os 3 sprites `rig-reefed`, `rig-half` e `rig-full`). Ligue `Camera` = Main Camera.
4. **Portinholas:** crie 8 filhos vazios do `Ship`, cada um com **Gunport** e um filho sprite `Circle` (escala `0.25`, **Order in Layer = 5**) ligado em `Marker`. Valores placeholder (Parte 1 §17):

| Nome | Label | Offset | Facing | Arc | Starts Open |
|---|---|---|---|---|---|
| `GP_Proa` | Proa (caça-proa) | (3.2, 0) | 0 | 180 | sim |
| `GP_BombordoFrente` | Bombordo frente | (1.7, 1) | 90 | 180 | não |
| `GP_BombordoMeio` | Bombordo meio | (0.1, 1) | 90 | 180 | sim |
| `GP_BombordoTras` | Bombordo trás | (-1.5, 1) | 90 | 180 | não |
| `GP_EstibordoFrente` | Estibordo frente | (1.7, -1) | -90 | 180 | não |
| `GP_EstibordoMeio` | Estibordo meio | (0.1, -1) | -90 | 180 | sim |
| `GP_EstibordoTras` | Estibordo trás | (-1.5, -1) | -90 | 180 | não |
| `GP_Popa` | Popa (caça-popa) | (-3.1, 0) | 180 | 180 | sim |

5. **Trecho:** GameObject vazio `Leg` com **LegManager**, `Ship` = `Ship`, `Buoys` = `Buoys`, `Start On Play` ligado.
6. Para testar rápido, diminua `Leg Length` no `GameConfig` para `100` durante o teste (e volte para `900` depois).

### ✅ Checkpoint da Fase 2
- No Play, o navio navega sozinho, e os 8 marcadores das portinholas vão junto: 4 claros (abertos) e 4 vermelho-escuros (fechados).
- Apertar `C` faz o navio **acelerar aos poucos** até 13 m/s (as ondas passam mais rápido e a câmera olha mais à frente); `Z` desacelera até 6 m/s; `X` volta aos 10.
- Com `Leg Length = 100`, depois de ~10 s a Meio pano o navio para e o Console mostra "Trecho concluído." A boia verde mais próxima do fim mostra "0 m". De Pano cheio, chega antes.
- O Console não mostra erros (o casco e os arcos só serão testados de verdade quando houver inimigos, na Fase 3).

#### Problemas comuns
- **`GameConfig não encontrado`:** o asset precisa estar numa pasta chamada exatamente `Resources` e se chamar exatamente `GameConfig`.
- **Os marcadores ficam parados no começo da rota:** a `Gunport` precisa ser **filha** do `Ship`; o navio só encontra as portinholas que estão dentro dele.
- **As velas mudam a velocidade de uma vez:** o `Sail Acceleration` do `GameConfig` está muito alto (ou zero, que trava o navio parado).

Próxima fase: **Inimigos, Rochedos e Rajadas**, com escunas, brulotes, chalupas, piratas a bordo, o Galeão, o spawn por tipo de trecho, os rochedos dos Recifes e as rajadas da Tempestade.

---

# Parte 6 — Implementação Unity: Fase 3 (Inimigos, Rochedos e Rajadas)

## Fase 3 — Inimigos, Rochedos e Rajadas

> Objetivo desta fase: piratas aparecendo em volta do navio, do lado que o tipo de trecho manda, cercando e atacando, cada tipo com seu comportamento; o Galeão segurando a chegada ao porto; rochedos batendo no casco nos Recifes; e rajadas rasgando o Pano cheio na Tempestade.

Duas regras desta fase vêm do Space Hauler, e uma é nova:
- **O lado de onde o pirata vem vira o lado onde ele ronda.** Escunas e chalupas escolhem o "posto" em volta do navio na direção de onde nasceram. Num trecho de emboscada pela frente, elas ficam na frente, e só a proa e as portinholas da frente as alcançam.
- **A `approach` de um inimigo é só a sobra com que ele se aproxima.** Sem isso, um brulote que vem pela frente navegaria contra o navio a 8 + 10 = 18 m/s e chegaria antes de qualquer arma reagir.
- **Nova: os piratas navegam no ritmo do mar, não no do navio** (Parte 1 §3). O `Enemy` soma `GameConfig.seaSpeed` ao x dele todo frame, nunca a velocidade do navio. Assim, de Pano cheio o navio abre distância de quem vem por trás; quem fica a mais de 40 m sai do jogo **sem dar ouro** e conta como "deixado para trás".

### 3.1 Dados de um inimigo: `EnemyDef`

```csharp
// Caminho: Assets/_Project/Scripts/Data/EnemyDef.cs
using SeaHauler.Enemies;
using UnityEngine;

namespace SeaHauler.Data
{
    // POR QUE: os números de cada inimigo são placeholders (Parte 1 §17).
    // Separar dados (este asset) de comportamento (a classe do inimigo) deixa
    // balancear sem abrir código e criar variações (ex.: "escuna veloz") só
    // duplicando o asset.
    // ESTRATÉGIA: um campo genérico "spawnDef" serve tanto para a chalupa (que
    // solta piratas) quanto para o Galeão (que chama escunas).
    [CreateAssetMenu(menuName = "Sea Hauler/Enemy", fileName = "Enemy")]
    public class EnemyDef : ScriptableObject
    {
        public string displayName = "Escuna pirata";
        public Enemy prefab;

        [Header("Status")]
        public float maxHp = 30f;
        public float approach = 6f;        // m/s de APROXIMAÇÃO, além do ritmo do mar
        public float damage = 4f;          // por ataque (ou por segundo, no pirata a bordo)
        public float fireInterval = 1f;    // segundos entre ataques
        public float contactRadius = 2f;   // brulote: distância em que explode
        public float postDistance = 5f;    // escuna, chalupa e Galeão: a que distância ronda o navio
        public bool isShip = true;         // a bala encadeada e os barris só afetam navios
        public bool tearable = true;       // dá para rasgar as velas (bala encadeada, barris)

        [Header("Reforços (chalupa e Galeão)")]
        public EnemyDef spawnDef;
        public int spawnCount = 2;
        public float spawnInterval = 2f;

        [Header("Recompensa e spawn")]
        public int goldReward = 8;
        public int spawnCost = 1;          // pontos do orçamento de spawn
        public int minDifficulty;          // só aparece em trechos com dificuldade >= isto
    }
}
```

### 3.2 A base de todo inimigo: `Enemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/Enemy.cs
using System;
using System.Collections.Generic;
using SeaHauler.Data;
using SeaHauler.Ship;
using SeaHauler.World;
using UnityEngine;

namespace SeaHauler.Enemies
{
    // POR QUE: todos os inimigos têm vida, levam dano, podem ter as velas
    // rasgadas, dão ouro ao afundar e somem se ficarem longe demais. Só o jeito
    // de se mover e atacar muda de um para outro.
    // ESTRATÉGIA: classe "abstract" com o comum; cada tipo herda dela e
    // implementa só o Tick (o comportamento). Antes do Tick, todo inimigo é
    // "carregado" no ritmo do mar (Parte 1 §3), não no do navio: o Tick só
    // cuida da aproximação. Uma lista estática All guarda os inimigos vivos,
    // para as armas procurarem alvos sem usar física. Dois eventos estáticos:
    // Killed (afundado pelas armas: a Fase 5 dá ouro) e Escaped (ficou para trás
    // do navio: o HUD conta, e não há ouro).
    [RequireComponent(typeof(GroundBody))]
    public abstract class Enemy : MonoBehaviour
    {
        public static readonly List<Enemy> All = new();
        public static event Action<Enemy> Killed;
        public static event Action<Enemy> Escaped;

        [SerializeField] private SpriteRenderer _renderer;
        [SerializeField] private Color _hitColor = Color.white;

        private float _tornTimer;
        private float _flashTimer;
        private bool _removed;
        private Color _baseColor;

        public EnemyDef Def { get; private set; }
        public float Hp { get; private set; }
        public bool IsAlive => !_removed && Hp > 0f;
        public bool IsTorn => _tornTimer > 0f;
        public Vector2 Ground => Body.Ground;
        protected GroundBody Body { get; private set; }
        protected ShipController Ship { get; private set; }

        // Ângulo (graus, no plano) de onde o inimigo veio em relação ao navio:
        // 0 = pela frente, 180 = por trás. Os tipos que rondam o navio usam para
        // escolher o posto.
        protected float ApproachDegrees { get; private set; }

        // Pirata a bordo anda com a portinhola, não no ritmo do mar.
        protected virtual bool DriftsWithSea => true;

        // Pirata a bordo pode ser alvo de qualquer arma, sem olhar o arco (Fase 4).
        public virtual bool IsAboard => false;

        // Quem pode ficar para trás e sair do jogo por distância. O Galeão não:
        // ele guarda a entrada do porto, então fugir dele não adianta.
        protected virtual bool CanBeLeftBehind => true;

        // Velocidade com que o inimigo é carregado antes do Tick: o ritmo do mar.
        // O Galeão troca por "o maior entre o mar e o navio".
        protected virtual float DriftSpeed => GameConfig.I.seaSpeed;

        protected virtual void Awake()
        {
            Body = GetComponent<GroundBody>();
            if (_renderer != null) _baseColor = _renderer.color;
        }

        // OnEnable/OnDisable rodam quando o objeto aparece e quando é destruído:
        // é o jeito seguro de manter a lista All sempre certa.
        private void OnEnable() => All.Add(this);
        private void OnDisable() => All.Remove(this);

        // Chamado pelo EnemySpawner logo depois de criar o inimigo.
        public virtual void Init(EnemyDef def, ShipController ship, Vector2 ground)
        {
            Def = def;
            Ship = ship;
            Hp = def.maxHp;
            Body.Ground = ground;
            Body.Apply();
            Vector2 fromShip = ground - ship.Ground;
            ApproachDegrees = Mathf.Atan2(fromShip.y, fromShip.x) * Mathf.Rad2Deg;
        }

        private void Update()
        {
            if (Ship == null || !IsAlive) return;
            float dt = Time.deltaTime;

            _flashTimer -= dt;
            if (_renderer != null) _renderer.color = _flashTimer > 0f ? _hitColor : _baseColor;

            // Velas rasgadas: perde o embalo (não navega no ritmo do mar) e fica para trás.
            if (_tornTimer > 0f) _tornTimer -= dt;
            else
            {
                if (DriftsWithSea) Body.Ground += new Vector2(DriftSpeed * dt, 0f);
                Tick(dt);
            }

            if (IsAlive && CanBeLeftBehind && Vector2.Distance(Body.Ground, Ship.Ground) > GameConfig.I.enemyDespawnDistance)
            {
                if (Body.Ground.x < Ship.Ground.x) Escaped?.Invoke(this);
                Remove(false);
            }
        }

        // O comportamento de cada tipo de inimigo, rodado uma vez por frame.
        protected abstract void Tick(float dt);

        // Anda em linha reta até um ponto do plano (na sobra de velocidade dele)
        // e devolve a distância que falta.
        protected float MoveTowards(Vector2 target, float dt)
        {
            Body.Ground = Vector2.MoveTowards(Body.Ground, target, Def.approach * dt);
            return Vector2.Distance(Body.Ground, target);
        }

        // Um ponto em volta do navio, do lado de onde o inimigo veio, com uma folga
        // de até ±25° para os inimigos não ficarem todos empilhados.
        protected Vector2 PickPost(float distance)
        {
            float degrees = ApproachDegrees + UnityEngine.Random.Range(-25f, 25f);
            return IsoProjection.Dir(degrees) * distance;
        }

        public void TakeDamage(float amount)
        {
            if (!IsAlive) return;
            Hp -= amount;
            _flashTimer = 0.06f;
            if (Hp <= 0f) Remove(true);
        }

        // Rasga as velas (bala encadeada, barris). Só funciona em quem tem velas.
        public void Tear(float seconds)
        {
            if (Def.tearable) _tornTimer = Mathf.Max(_tornTimer, seconds);
        }

        // Some sem dar ouro (fim do trecho, explodiu sozinho).
        public void Despawn() => Remove(false);

        // Tira o inimigo do jogo. Só quem foi afundado pelas armas avisa Killed.
        protected void Remove(bool killedByPlayer)
        {
            if (_removed) return;
            _removed = true;
            if (killedByPlayer) Killed?.Invoke(this);
            OnRemoved();
            Destroy(gameObject);
        }

        // Gancho para os tipos que precisam limpar algo ao sair (pirata, Galeão).
        protected virtual void OnRemoved() { }

        // Procura o inimigo vivo mais perto de uma portinhola, dentro do alcance e
        // do arco dela. Pirata a bordo ignora o arco se a regra estiver ligada
        // (GameConfig.boarderIgnoresArcs, Parte 1 §8).
        public static Enemy FindNearest(Gunport gunport, float range, bool shipsOnly)
        {
            Enemy best = null;
            float bestSqr = range * range;
            Vector2 from = gunport.Ground;
            bool aboardAnywhere = GameConfig.I.boarderIgnoresArcs;

            foreach (Enemy enemy in All)
            {
                if (!enemy.IsAlive || (shipsOnly && !enemy.Def.isShip)) continue;
                float sqr = (enemy.Ground - from).sqrMagnitude;
                if (sqr > bestSqr) continue;
                bool inArc = (enemy.IsAboard && aboardAnywhere) || gunport.CanTarget(enemy.Ground);
                if (!inArc) continue;
                best = enemy;
                bestSqr = sqr;
            }
            return best;
        }
    }
}
```

> `Destroy` não apaga o objeto na hora: ele some no fim do frame. Por isso existe o `_removed`, que impede o mesmo inimigo de afundar duas vezes no mesmo frame (por exemplo, atingido por dois canhões). Pelo mesmo motivo, as armas podem percorrer `Enemy.All` com `foreach` e afundar inimigos no meio do laço: a lista só muda no fim do frame.

### 3.3 Escuna pirata: `SchoonerEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/SchoonerEnemy.cs
using SeaHauler.Data;
using SeaHauler.Ship;
using UnityEngine;

namespace SeaHauler.Enemies
{
    // POR QUE: o inimigo básico (Parte 1 §8): ronda o navio do lado de onde veio
    // e atira.
    // ESTRATÉGIA: escolhe um "posto" em volta do navio (PickPost, do lado de onde
    // nasceu) e persegue esse posto. Como o posto anda junto com o navio e a
    // escuna tem uma sobra de velocidade sobre o ritmo do mar, ela chega e fica
    // grudada, a não ser que o navio corra mais que essa sobra (Pano cheio):
    // aí o posto foge dela. Só atira estando perto do posto.
    public class SchoonerEnemy : Enemy
    {
        [SerializeField] private float _attackDistance = 1.5f;

        private Vector2 _post;
        private float _fireTimer;

        public override void Init(EnemyDef def, ShipController ship, Vector2 ground)
        {
            base.Init(def, ship, ground);
            _post = PickPost(def.postDistance);
            _fireTimer = def.fireInterval;
        }

        protected override void Tick(float dt)
        {
            float remaining = MoveTowards(Ship.Ground + _post, dt);
            if (remaining > _attackDistance) return;

            _fireTimer -= dt;
            if (_fireTimer > 0f) return;
            _fireTimer = Def.fireInterval;
            Ship.Hull.TakeDamage(Def.damage);
        }
    }
}
```

### 3.4 Brulote: `FireshipEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/FireshipEnemy.cs
namespace SeaHauler.Enemies
{
    // POR QUE: cria urgência (Parte 1 §8): se não for afundado a tempo, bate e
    // tira muito casco de uma vez.
    // ESTRATÉGIA: vai direto no centro do navio. Ao chegar perto o suficiente,
    // causa dano de COLISÃO (o Forro de cobre reduz, Fase 5) e some sem dar ouro.
    public class FireshipEnemy : Enemy
    {
        protected override void Tick(float dt)
        {
            float remaining = MoveTowards(Ship.Ground, dt);
            if (remaining > Def.contactRadius) return;

            Ship.Hull.TakeDamage(Def.damage, collision: true);
            Remove(false);
        }
    }
}
```

### 3.5 Chalupa de abordagem: `SloopEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/SloopEnemy.cs
using SeaHauler.Data;
using SeaHauler.Leg;
using SeaHauler.Ship;
using UnityEngine;

namespace SeaHauler.Enemies
{
    // POR QUE: encosta e solta piratas que sobem no navio (Parte 1 §8).
    // ESTRATÉGIA: encosta bem perto, do lado de onde veio; parada ali, solta um
    // pirata a cada spawnInterval na portinhola ABERTA mais perto dela (as
    // fechadas não deixam entrar, placeholder da Parte 1 §8). Assim, quem
    // abordou pela proa sabota a proa. Quando acaba a "tripulação", ela vai
    // embora pelo mesmo lado até sumir.
    public class SloopEnemy : Enemy
    {
        private Vector2 _post;
        private float _timer;
        private int _left;

        public override void Init(EnemyDef def, ShipController ship, Vector2 ground)
        {
            base.Init(def, ship, ground);
            _post = PickPost(def.postDistance);
            _timer = def.spawnInterval;
            _left = def.spawnCount;
        }

        protected override void Tick(float dt)
        {
            if (_left <= 0)
            {
                // Vai embora: se afasta pelo lado do posto, na sobra de velocidade dela.
                Body.Ground += _post.normalized * Def.approach * dt;
                return;
            }

            if (MoveTowards(Ship.Ground + _post, dt) > 1f) return;

            _timer -= dt;
            if (_timer > 0f) return;
            _timer = Def.spawnInterval;
            _left--;
            DeployBoarder();
        }

        // Cria um pirata já em cima da portinhola aberta mais perto da chalupa.
        private void DeployBoarder()
        {
            if (Def.spawnDef == null) return;
            Gunport nearest = null;
            float bestSqr = float.MaxValue;
            foreach (Gunport gunport in Ship.Gunports)
            {
                if (!gunport.IsOpen) continue;
                float sqr = (gunport.Ground - Ground).sqrMagnitude;
                if (sqr >= bestSqr) continue;
                nearest = gunport;
                bestSqr = sqr;
            }
            if (nearest == null) return;
            if (EnemySpawner.Current.Spawn(Def.spawnDef, nearest.Ground) is BoarderEnemy boarder)
                boarder.Board(nearest);
        }
    }
}
```

### 3.6 Pirata a bordo: `BoarderEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/BoarderEnemy.cs
using SeaHauler.Ship;

namespace SeaHauler.Enemies
{
    // POR QUE: o comportamento do pirata a bordo está Em aberto (Parte 1 §8). O
    // placeholder: ele sabota a arma da portinhola onde subiu e machuca o casco
    // aos poucos até ser morto.
    // ESTRATÉGIA: fica "colado" na posição da portinhola todo frame (por isso
    // não navega no ritmo do mar: DriftsWithSea = false). Avisa a portinhola ao
    // subir e ao sair (morto ou fim do trecho), para a sabotagem nunca ficar
    // presa. O dano é por segundo (Def.damage × dt).
    public class BoarderEnemy : Enemy
    {
        private Gunport _gunport;

        protected override bool DriftsWithSea => false;
        public override bool IsAboard => _gunport != null;

        // Sobe na portinhola. Chamado pela chalupa logo depois de criar o pirata.
        public void Board(Gunport gunport)
        {
            _gunport = gunport;
            _gunport.AddSaboteur();
        }

        protected override void Tick(float dt)
        {
            if (_gunport == null) return;
            Body.Ground = _gunport.Ground;
            Ship.Hull.TakeDamage(Def.damage * dt);
        }

        protected override void OnRemoved()
        {
            if (_gunport != null) _gunport.RemoveSaboteur();
            _gunport = null;
        }
    }
}
```

> O pirata a bordo está sempre a menos de 40 m do navio, então nunca "fica para trás" nem dispara o `Escaped`.

### 3.7 Chefe: `GalleonEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/GalleonEnemy.cs
using SeaHauler.Data;
using SeaHauler.Leg;
using SeaHauler.Ship;
using UnityEngine;

namespace SeaHauler.Enemies
{
    // POR QUE: o último trecho tem o Galeão pirata guardando a entrada do porto
    // (Parte 1 §8). Placeholder: ele ronda e atira como uma escuna muito
    // resistente e chama reforços.
    // ESTRATÉGIA: herda da SchoonerEnemy (reaproveita "rondar e atirar") e soma
    // um timer de reforços. Enquanto existir, segura a chegada ao destino pelo
    // contador do LegManager, se a regra bossBlocksArrival estiver ligada.
    // Ele nunca fica para trás: navega no maior entre o ritmo do mar e a
    // velocidade do navio (DriftSpeed) e nunca sai do jogo por distância
    // (CanBeLeftBehind = false). Mesmo de Pano cheio, o Galeão continua
    // guardando a entrada do porto, e passar dos 900 m não adianta enquanto ele
    // estiver à tona.
    public class GalleonEnemy : SchoonerEnemy
    {
        private float _spawnTimer;
        private bool _blocking;

        protected override bool CanBeLeftBehind => false;
        protected override float DriftSpeed => Mathf.Max(GameConfig.I.seaSpeed, Ship.Speed);

        public override void Init(EnemyDef def, ShipController ship, Vector2 ground)
        {
            base.Init(def, ship, ground);
            _spawnTimer = def.spawnInterval;
            if (GameConfig.I.bossBlocksArrival)
            {
                LegManager.Current.AddArrivalBlocker();
                _blocking = true;
            }
        }

        protected override void Tick(float dt)
        {
            base.Tick(dt);
            if (Def.spawnDef == null) return;

            _spawnTimer -= dt;
            if (_spawnTimer > 0f) return;
            _spawnTimer = Def.spawnInterval;
            EnemySpawner.Current.SpawnAround(Def.spawnDef);
        }

        protected override void OnRemoved()
        {
            if (_blocking) LegManager.Current.RemoveArrivalBlocker();
            _blocking = false;
        }
    }
}
```

> Sem o `DriftSpeed` e o `CanBeLeftBehind` do Galeão, um navio de Pano cheio deixaria o chefe para trás: ou ele nunca alcançaria o posto (e a chegada ficaria bloqueada para sempre, com o navio navegando além dos 900 m), ou sairia do jogo a 40 m e liberaria a chegada sem combate.

### 3.8 Quem cria os inimigos: `EnemySpawner`

```csharp
// Caminho: Assets/_Project/Scripts/Leg/EnemySpawner.cs
using System.Collections.Generic;
using SeaHauler.Data;
using SeaHauler.Enemies;
using SeaHauler.World;
using UnityEngine;

namespace SeaHauler.Leg
{
    // POR QUE: a pressão de inimigos precisa crescer com a dificuldade do
    // trecho (Parte 1 §9), e o LADO de onde eles vêm depende do tipo de trecho,
    // sem ninguém escrever ondas à mão para cada trecho gerado.
    // ESTRATÉGIA: "orçamento de spawn". A cada segundo entram alguns pontos
    // (mais em trechos difíceis, menos na Tempestade). O spawner sorteia o
    // próximo inimigo entre os permitidos na dificuldade e espera juntar pontos
    // suficientes para ele. Sortear antes de juntar evita que só os baratos
    // apareçam. Cada inimigo nasce num ângulo sorteado dentro do arco do trecho
    // (LegSettings), a uma distância fixa do navio. O orçamento é por SEGUNDO,
    // não por metro: correr de Pano cheio encurta o trecho e faz aparecer menos
    // piratas, o que também é "fuga custa saque". O Galeão nasce uma vez, ao
    // passar de certa porcentagem do trecho.
    public class EnemySpawner : MonoBehaviour
    {
        public static EnemySpawner Current { get; private set; }

        [SerializeField] private LegManager _leg;
        [SerializeField] private List<EnemyDef> _pool = new(); // inimigos comuns
        [SerializeField] private EnemyDef _galleon;

        private readonly List<EnemyDef> _eligible = new();
        private float _budget;
        private EnemyDef _next;
        private bool _galleonSpawned;
        private bool _active;

        private void Awake()
        {
            Current = this;
        }

        // Assina os eventos do trecho enquanto o spawner estiver ativo.
        private void OnEnable()
        {
            _leg.Started += OnLegStarted;
            _leg.Ended += OnLegEnded;
        }

        private void OnDisable()
        {
            _leg.Started -= OnLegStarted;
            _leg.Ended -= OnLegEnded;
        }

        private void OnLegStarted(LegSettings settings)
        {
            ClearAll();
            _budget = 0f;
            _next = null;
            _galleonSpawned = false;
            _active = true;
        }

        private void OnLegEnded(bool success)
        {
            _active = false;
            ClearAll();
        }

        private void Update()
        {
            if (!_active) return;
            GameConfig cfg = GameConfig.I;
            LegSettings settings = _leg.Settings;

            if (settings.hasBoss && !_galleonSpawned && _galleon != null && _leg.Progress01 >= cfg.bossSpawnAtProgress)
            {
                _galleonSpawned = true;
                SpawnAround(_galleon);
            }

            float perSecond = cfg.spawnBudgetBase + cfg.spawnBudgetPerDifficulty * settings.difficulty;
            _budget += perSecond * settings.spawnMultiplier * Time.deltaTime;

            if (_next == null) _next = PickNext(settings.difficulty);
            if (_next != null && _budget >= _next.spawnCost)
            {
                _budget -= _next.spawnCost;
                SpawnAround(_next);
                _next = null;
            }
        }

        // Sorteia um inimigo comum permitido nesta dificuldade.
        private EnemyDef PickNext(int difficulty)
        {
            _eligible.Clear();
            foreach (EnemyDef def in _pool)
                if (def.minDifficulty <= difficulty) _eligible.Add(def);
            return _eligible.Count == 0 ? null : _eligible[Random.Range(0, _eligible.Count)];
        }

        // Cria um inimigo em volta do navio, num ângulo dentro do arco do tipo de
        // trecho (ex.: 145° a 215° = por trás; 0° a 360° = de qualquer lado).
        public Enemy SpawnAround(EnemyDef def)
        {
            GameConfig cfg = GameConfig.I;
            LegSettings settings = _leg.Settings;
            float degrees = Random.Range(settings.spawnArcMin, settings.spawnArcMax);
            float distance = Random.Range(cfg.spawnDistanceMin, cfg.spawnDistanceMax);
            return Spawn(def, _leg.Ship.Ground + IsoProjection.Dir(degrees) * distance);
        }

        // Cria um inimigo num ponto exato do plano.
        public Enemy Spawn(EnemyDef def, Vector2 ground)
        {
            Enemy enemy = Instantiate(def.prefab, transform);
            enemy.Init(def, _leg.Ship, ground);
            return enemy;
        }

        // Tira todos os inimigos do jogo, sem dar ouro.
        public void ClearAll()
        {
            for (int i = Enemy.All.Count - 1; i >= 0; i--) Enemy.All[i].Despawn();
        }
    }
}
```

### 3.9 Rochedos: `Rock` e `ReefField`

Os rochedos (Parte 1 §9) não são inimigos: não têm vida, não dão ouro e as armas não miram neles. Por isso não herdam de `Enemy` e não entram em `Enemy.All`.

```csharp
// Caminho: Assets/_Project/Scripts/Leg/Rock.cs
using SeaHauler.World;
using UnityEngine;

namespace SeaHauler.Leg
{
    // POR QUE: uma rocha parada no mar, no caminho do navio. Não pode ser
    // destruída (Parte 1 §9): ou bate no casco, ou fica para trás.
    // ESTRATÉGIA: só guarda o raio e escolhe um dos sprites de rochedo. Quem
    // decide se bateu é o ReefField, que conhece o navio.
    [RequireComponent(typeof(GroundBody))]
    public class Rock : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _visual;
        [SerializeField] private Sprite[] _variants;   // rock-1, rock-2, rock-3 (vazio = mantém o sprite do prefab)

        public GroundBody Body { get; private set; }
        public float Radius { get; private set; }

        private void Awake()
        {
            Body = GetComponent<GroundBody>();
        }

        // Chamado pelo ReefField logo depois de criar a rocha.
        public void Init(Vector2 ground, float radius)
        {
            Radius = radius;
            Body.Ground = ground;
            Body.Apply();
            if (_visual == null) return;
            if (_variants != null && _variants.Length > 0) _visual.sprite = _variants[Random.Range(0, _variants.Length)];
            // O sprite placeholder tem 1 unidade de largura: escala = diâmetro na tela.
            _visual.transform.localScale = Vector3.one * radius * 2f * IsoProjection.HalfWidth * 2f;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Leg/ReefField.cs
using System.Collections.Generic;
using SeaHauler.Data;
using UnityEngine;

namespace SeaHauler.Leg
{
    // POR QUE: os Recifes cobram Forro de cobre e vela baixa (Parte 1 §9):
    // rochas no caminho batem no casco, nenhuma arma as destrói, e quanto mais
    // rápido o navio, pior a batida.
    // ESTRATÉGIA: só funciona em trechos com LegSettings.rocks. Um "orçamento"
    // cria rochas à frente do navio, espalhadas para os lados. O orçamento cresce
    // com a VELOCIDADE do navio (rochas por segundo × velocidade ÷ ritmo do mar),
    // então a densidade é por metro: correr não faz aparecer menos rochas pelo
    // caminho. Todo frame, cada rocha perto do navio vira colisão: dano
    // proporcional ao raio e à velocidade, marcado como colisão (o Forro de
    // cobre reduz), e a rocha some. Rocha que ficou para trás também some.
    public class ReefField : MonoBehaviour
    {
        [SerializeField] private LegManager _leg;
        [SerializeField] private Rock _prefab;

        private readonly List<Rock> _rocks = new();
        private float _budget;
        private bool _active;

        private void OnEnable()
        {
            _leg.Started += OnLegStarted;
            _leg.Ended += OnLegEnded;
        }

        private void OnDisable()
        {
            _leg.Started -= OnLegStarted;
            _leg.Ended -= OnLegEnded;
        }

        private void OnLegStarted(LegSettings settings)
        {
            ClearAll();
            _budget = 0f;
            _active = settings.rocks;
        }

        private void OnLegEnded(bool success)
        {
            _active = false;
            ClearAll();
        }

        private void Update()
        {
            if (!_active) return;
            GameConfig cfg = GameConfig.I;
            Vector2 ship = _leg.Ship.Ground;
            float speedFactor = _leg.Ship.Speed / cfg.seaSpeed;

            _budget += cfg.rocksPerSecond * speedFactor * Time.deltaTime;
            while (_budget >= 1f)
            {
                _budget -= 1f;
                Spawn(cfg, ship);
            }

            // De trás para frente: dá para tirar da lista no meio do laço.
            for (int i = _rocks.Count - 1; i >= 0; i--)
            {
                Rock rock = _rocks[i];
                Vector2 rockGround = rock.Body.Ground;
                if (Vector2.Distance(rockGround, ship) < rock.Radius + cfg.shipRadius)
                {
                    float damage = cfg.rockDamagePerRadius * rock.Radius * speedFactor;
                    _leg.Ship.Hull.TakeDamage(damage, collision: true);
                    RemoveAt(i);
                    if (!_leg.IsRunning) return;   // a batida afundou o navio
                }
                else if (rockGround.x < ship.x - 20f) RemoveAt(i);
            }
        }

        // Cria uma rocha à frente do navio, num lado sorteado.
        private void Spawn(GameConfig cfg, Vector2 ship)
        {
            Rock rock = Instantiate(_prefab, transform);
            var ground = new Vector2(
                ship.x + Random.Range(cfg.rockAheadMin, cfg.rockAheadMax),
                Random.Range(-cfg.rockLateralSpread, cfg.rockLateralSpread));
            rock.Init(ground, Random.Range(cfg.rockRadiusMin, cfg.rockRadiusMax));
            _rocks.Add(rock);
        }

        private void RemoveAt(int index)
        {
            Destroy(_rocks[index].gameObject);
            _rocks.RemoveAt(index);
        }

        private void ClearAll()
        {
            for (int i = _rocks.Count - 1; i >= 0; i--) RemoveAt(i);
        }
    }
}
```

> Os rochedos ficam parados no plano: quem anda é o navio. Por isso eles não precisam de `Update` de movimento, e o `GroundBody` de cada um só os desenha.

### 3.10 Rajadas: `SquallSystem`

```csharp
// Caminho: Assets/_Project/Scripts/Leg/SquallSystem.cs
using System;
using SeaHauler.Data;
using SeaHauler.Ship;
using UnityEngine;

namespace SeaHauler.Leg
{
    // POR QUE: a Tempestade cobra atenção às velas, não às armas (Parte 1 §9):
    // de tempos em tempos vem uma rajada, com aviso, e se ela pega o navio de
    // Pano cheio, as velas rasgam (dano e Rizadas por alguns segundos).
    // ESTRATÉGIA: só funciona em trechos com LegSettings.squalls. Um timer
    // sorteado entre o mínimo e o máximo conta até a próxima rajada; quando falta
    // menos que o aviso, dispara Warning (a UI mostra a contagem). Ao bater,
    // olha a posição ESCOLHIDA das velas (não a que vale): quem já está com as
    // velas rasgadas não rasga de novo. Os eventos deixam a UI e os efeitos
    // (relâmpago, chuva) fora desta classe.
    public class SquallSystem : MonoBehaviour
    {
        [SerializeField] private LegManager _leg;

        private float _timer;
        private bool _warned;
        private bool _active;

        public bool IsActive => _active;
        public bool IsWarning => _active && _warned;
        public float SecondsToNext => Mathf.Max(0f, _timer);

        public event Action Warning;
        public event Action<bool> Hit;   // true = pegou o navio de Pano cheio

        private void OnEnable()
        {
            _leg.Started += OnLegStarted;
            _leg.Ended += OnLegEnded;
        }

        private void OnDisable()
        {
            _leg.Started -= OnLegStarted;
            _leg.Ended -= OnLegEnded;
        }

        private void OnLegStarted(LegSettings settings)
        {
            _active = settings.squalls;
            ScheduleNext();
        }

        private void OnLegEnded(bool success) => _active = false;

        private void ScheduleNext()
        {
            GameConfig cfg = GameConfig.I;
            _timer = UnityEngine.Random.Range(cfg.squallIntervalMin, cfg.squallIntervalMax);
            _warned = false;
        }

        private void Update()
        {
            if (!_active) return;
            GameConfig cfg = GameConfig.I;
            _timer -= Time.deltaTime;

            if (!_warned && _timer <= cfg.squallWarning)
            {
                _warned = true;
                Warning?.Invoke();
            }
            if (_timer > 0f) return;

            SailController sails = _leg.Ship.Sails;
            bool caught = sails.Setting == SailSetting.Full && !sails.IsTorn;
            if (caught)
            {
                sails.Tear(cfg.squallTornSeconds);
                _leg.Ship.Hull.TakeDamage(cfg.squallDamage);
            }
            Hit?.Invoke(caught);
            ScheduleNext();
        }
    }
}
```

### 3.11 Criar prefabs e assets

1. **Prefabs de inimigo** (em `Prefabs/Enemies/`), cada um: GameObject vazio + **GroundBody** (no `SortingGroup`, **Sorting Layer = Mundo**) + o script do tipo + um filho sprite ligado no campo `Renderer` do script. Com a arte final, o sprite do PixelLab (`Sprites/SeaHauler/enemies/`) entra no lugar do placeholder; o Galeão usa dois filhos (`galleon-bow` e `galleon-hull`, nessa ordem de desenho) com o mesmo ponto de apoio.

| Prefab | Script | Sprite placeholder (escala, cor) | GroundBody |
|---|---|---|---|
| `Schooner` | SchoonerEnemy | `Square` 0.6 × 0.3, marrom-escuro | — |
| `Fireship` | FireshipEnemy | `Square` 0.5 × 0.3, laranja | — |
| `Sloop` | SloopEnemy | `Square` 0.8 × 0.4, marrom | — |
| `Boarder` | BoarderEnemy | `Circle` 0.3, vermelho | Height 0.3, Sort Bias 50 |
| `Galleon` | GalleonEnemy | `Square` 2.0 × 1.0, preto | — |

2. **Prefab `Rock`** (em `Prefabs/`): GameObject vazio + **GroundBody** (`SortingGroup` em **Mundo**) + **Rock** + filho sprite `Circle` cinza (`#5A5450`) ligado em `Visual`.
3. **Assets de inimigo** (em `ScriptableObjects/Enemies/`, **Create → Sea Hauler → Enemy**), com os números da Parte 1 §17 (campos não listados ficam no padrão):

| Asset | Prefab | HP | Approach | Damage | Fire Int. | Contact | Post Dist. | Is Ship | Tearable | Spawn Def / Count / Interval | Gold | Cost | Min Diff. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `Schooner` | Schooner | 30 | 6 | 4 | 1 | — | 5 | sim | sim | — | 8 | 1 | 0 |
| `Fireship` | Fireship | 50 | 8 | 45 | — | 2 | — | sim | sim | — | 12 | 2 | 1 |
| `Sloop` | Sloop | 80 | 4 | — | — | — | 2.8 | sim | sim | Boarder / 2 / 2 | 15 | 3 | 2 |
| `Boarder` | Boarder | 20 | — | 6 | — | — | — | **não** | **não** | — | 3 | — | — |
| `Galleon` | Galleon | 1500 | 2 | 15 | 1.5 | — | 7 | sim | **não** | Schooner / — / 6 | 150 | — | — |

4. **Spawner:** GameObject `Enemies` com **EnemySpawner**: `Leg` = `Leg`, `Pool` = Schooner, Fireship, Sloop, `Galleon` = Galleon.
5. **Rochedos:** GameObject `Reefs` com **ReefField**: `Leg` = `Leg`, `Prefab` = `Rock`.
6. **Rajadas:** GameObject `Squalls` com **SquallSystem**: `Leg` = `Leg`. Para ver alguma coisa já nesta fase, adicione temporariamente um script que faz `Debug.Log` nos eventos `Warning` e `Hit` (a UI de verdade vem na Fase 5).

### ✅ Checkpoint da Fase 3
- No Play (dificuldade de teste 2, arco 145° a 215°), escunas aparecem **atrás**, rondam a popa e os lados de trás, e o navio pisca vermelho a cada tiro.
- Aperte `C` (Pano cheio): as escunas ainda alcançam (sobra de 6 m/s contra os 3 m/s a mais do navio), mas chalupas (sobra de 4) mal acompanham. Em Rizadas (`Z`), todo mundo chega bem mais rápido.
- Troque as `Test Settings` do `LegManager` para o arco `-110` a `110`: agora eles chegam **pela frente e pelos lados**. Com `0` a `360`, chegam de todo lado.
- Brulotes vêm direto, somem ao encostar e o navio pisca. Nenhum inimigo vindo pela frente "atravessa" o navio em alta velocidade.
- Chalupas encostam e soltam pontos vermelhos na portinhola **aberta mais perto delas**; o marcador dela fica vermelho (sabotada). Nenhum pirata sobe numa portinhola fechada.
- Com `Rocks` ligado, rochas aparecem à frente; as que estão no caminho somem ao encostar. Compare o dano de Pano cheio e de Rizadas: de Rizadas, uma rocha de raio 1,5 tira ~14; de Pano cheio, ~31.
- Com `Squalls` ligado e `Spawn Multiplier = 0.6`, os avisos de rajada aparecem no Console; se a rajada pega o navio de Pano cheio, ele cai para 6 m/s por 8 s e perde 20 de casco; de Meio pano, nada acontece.
- Com `Has Boss` ligado, o Galeão aparece em 30% do trecho e o navio **não** termina o trecho enquanto ele estiver à tona.
- Sem armas, o navio acaba afundado, o Console mostra "Navio afundado." e todos os inimigos e rochas somem.

#### Problemas comuns
- **`NullReferenceException` no `OnEnable` do `EnemySpawner`, `ReefField` ou `SquallSystem`:** o campo `Leg` está vazio.
- **De Pano cheio ninguém fica para trás:** o `Enemy.Update` está somando a velocidade do **navio** em vez de `GameConfig.seaSpeed`. Os piratas precisam navegar no ritmo do mar.
- **Inimigos que vêm pela frente passam direto pelo navio e somem:** o `Enemy.Update` não está somando o ritmo do mar (`DriftsWithSea`). Sem isso, eles ficam parados no plano e o navio passa por eles.
- **Os inimigos nunca alcançam o navio:** a `Approach` do asset é a **sobra** de aproximação; com `0`, eles só acompanham e nunca chegam.
- **Piratas a bordo deslizam para longe da portinhola:** o `BoarderEnemy` precisa de `DriftsWithSea => false`.

Próxima fase: **Armas**, com as 4 armas montadas nas portinholas e mirando sozinhas dentro do arco.

---

# Parte 7 — Implementação Unity: Fase 4 (Armas)

## Fase 4 — Armas

> Objetivo desta fase: canhão longo, carronada, bala encadeada e fuzileiros montados nas portinholas abertas, cada um atacando sozinho do seu jeito e só dentro do arco da sua portinhola.

### 4.1 Dados de uma arma: `WeaponDef`

```csharp
// Caminho: Assets/_Project/Scripts/Data/WeaponDef.cs
using SeaHauler.Weapons;
using UnityEngine;

namespace SeaHauler.Data
{
    // POR QUE: preços e números das armas são placeholders (Parte 1 §17).
    // ESTRATÉGIA: um asset por arma, com todos os campos que qualquer arma pode
    // precisar; cada tipo usa só os seus (ex.: só a bala encadeada usa tearSeconds).
    [CreateAssetMenu(menuName = "Sea Hauler/Weapon", fileName = "Weapon")]
    public class WeaponDef : ScriptableObject
    {
        public string displayName = "Canhão longo";
        public Sprite icon;
        public Weapon prefab;

        [Header("Economia")]
        public int cost = 40;
        public int upgradeCostPerLevel = 40; // custo para subir = isto × nível atual
        public int maxLevel = 3;

        [Header("Combate")]
        public float range = 10f;            // metros
        public float damage = 20f;           // por tiro, por alvo da metralha, ou por segundo (fuzileiros)
        public float fireInterval = 0.5f;    // segundos de recarga
        public float coneDegrees = 60f;      // carronada
        public float tearSeconds;            // bala encadeada
        public float bonusPerLevel = 0.35f;  // +35% por nível acima do 1

        [Header("Desbloqueio (placeholder, Parte 1 §11)")]
        public int unlockAtBestLegs;         // trechos concluídos na melhor run para liberar
    }
}
```

### 4.2 A base de toda arma: `Weapon`

```csharp
// Caminho: Assets/_Project/Scripts/Weapons/Weapon.cs
using SeaHauler.Data;
using SeaHauler.Leg;
using SeaHauler.Ship;
using UnityEngine;

namespace SeaHauler.Weapons
{
    // POR QUE: toda arma fica numa portinhola, tem nível, sabe quanto já custou
    // (para a venda, Fase 5) e para de funcionar se um pirata sabotar a portinhola.
    // ESTRATÉGIA: classe abstract com o comum; cada tipo implementa só o Tick.
    // A recarga mora aqui (Reload/StartReload) porque a habilidade Bordada
    // (Fase 6) acelera a recarga de TODAS as armas por um tempo: ela só mexe no
    // ReloadMultiplier estático. Um ParticleSystem opcional solta a fumaça do
    // disparo, e um LineRenderer opcional desenha o rastro da bala por uma
    // fração de segundo, já que os acertos são instantâneos (sem projéteis).
    public abstract class Weapon : MonoBehaviour
    {
        // Multiplicador da recarga de todas as armas (2 = recarga em dobro). A Bordada liga e desliga.
        public static float ReloadMultiplier { get; set; } = 1f;

        [SerializeField] private LineRenderer _line;
        [SerializeField] private ParticleSystem _smoke;

        private float _lineTimer;
        private float _reload;

        public WeaponDef Def { get; private set; }
        public Gunport Gunport { get; private set; }
        public int Level { get; private set; } = 1;
        public int TotalSpent { get; private set; }
        public bool CanUpgrade => Level < Def.maxLevel;
        public int UpgradeCost => Def.upgradeCostPerLevel * Level;

        // Multiplicador dos números pelo nível: 1.0 no nível 1, 1.35 no 2, 1.7 no 3.
        protected float LevelMultiplier => 1f + Def.bonusPerLevel * (Level - 1);
        protected float Damage => Def.damage * LevelMultiplier;

        // Chamado pela portinhola logo depois de criar a arma.
        public void Install(WeaponDef def, Gunport gunport)
        {
            Def = def;
            Gunport = gunport;
            Level = 1;
            TotalSpent = def.cost;
            if (_line != null) _line.enabled = false;
        }

        // Sobe um nível. Quem chama (a alocação) já cobrou o UpgradeCost.
        public void Upgrade()
        {
            if (!CanUpgrade) return;
            TotalSpent += UpgradeCost;
            Level++;
        }

        // Zera a recarga: a arma atira no próximo frame em que tiver alvo (Bordada).
        public void ReloadNow() => _reload = 0f;

        private void Update()
        {
            UpdateLine(Time.deltaTime);
            if (Gunport == null) return;

            bool running = LegManager.Current != null && LegManager.Current.IsRunning;
            if (Gunport.Sabotaged || !running)
            {
                OnIdle();
                return;
            }
            _reload -= Time.deltaTime * ReloadMultiplier;
            Tick(Time.deltaTime);
        }

        // O comportamento da arma, rodado uma vez por frame.
        protected abstract void Tick(float dt);

        // Chamado nos frames em que a arma não pode agir (sabotada, trecho parado).
        protected virtual void OnIdle() { }

        // A arma já recarregou?
        protected bool Reloaded => _reload <= 0f;

        // Começa a recarregar depois de um disparo.
        protected void StartReload() => _reload = Def.fireInterval;

        // Fumaça na boca do canhão.
        protected void PuffSmoke()
        {
            if (_smoke != null) _smoke.Play();
        }

        // Mostra um rastro da arma até um ponto da tela por alguns segundos.
        protected void ShowLine(Vector3 to, float seconds)
        {
            if (_line == null) return;
            _line.positionCount = 2;
            _line.SetPosition(0, transform.position);
            _line.SetPosition(1, to);
            _line.enabled = true;
            _lineTimer = seconds;
        }

        // Apaga o rastro quando o tempo dele acaba.
        private void UpdateLine(float dt)
        {
            if (_line == null || !_line.enabled) return;
            _lineTimer -= dt;
            if (_lineTimer <= 0f) _line.enabled = false;
        }
    }
}
```

### 4.3 Canhão longo: `LongGunWeapon`

```csharp
// Caminho: Assets/_Project/Scripts/Weapons/LongGunWeapon.cs
using SeaHauler.Enemies;

namespace SeaHauler.Weapons
{
    // POR QUE: a arma padrão (Parte 1 §5): bala redonda, alcance longo, um alvo
    // por vez.
    // ESTRATÉGIA: a cada recarga, acerta o inimigo mais próximo dentro do alcance
    // e do arco da portinhola. Piratas a bordo contam como alvo (e, com a regra
    // boarderIgnoresArcs, mesmo fora do arco).
    public class LongGunWeapon : Weapon
    {
        protected override void Tick(float dt)
        {
            if (!Reloaded) return;

            Enemy target = Enemy.FindNearest(Gunport, Def.range, shipsOnly: false);
            if (target == null) return;

            StartReload();
            target.TakeDamage(Damage);
            PuffSmoke();
            ShowLine(target.transform.position, 0.08f);
        }
    }
}
```

### 4.4 Carronada: `CarronadeWeapon`

```csharp
// Caminho: Assets/_Project/Scripts/Weapons/CarronadeWeapon.cs
using SeaHauler.Enemies;
using SeaHauler.World;
using UnityEngine;

namespace SeaHauler.Weapons
{
    // POR QUE: dano em área de curto alcance (Parte 1 §5), bom contra chalupas
    // encostadas e piratas a bordo.
    // ESTRATÉGIA: a cada recarga, mira no inimigo mais próximo e dispara uma
    // metralha que acerta, de uma vez, todos dentro de um cone apontado para ele.
    // O efeito visual é um ParticleSystem em rajada (Emit), girado para a
    // direção do cone na tela.
    public class CarronadeWeapon : Weapon
    {
        [SerializeField] private ParticleSystem _grapeshot;
        [SerializeField] private int _pellets = 18;

        protected override void Tick(float dt)
        {
            if (!Reloaded) return;

            Enemy target = Enemy.FindNearest(Gunport, Def.range, shipsOnly: false);
            if (target == null) return;
            StartReload();

            Vector2 aim = target.Ground - Gunport.Ground;
            if (aim.sqrMagnitude < 0.01f) aim = IsoProjection.Dir(Gunport.FacingDegrees);
            aim.Normalize();

            float rangeSqr = Def.range * Def.range;
            foreach (Enemy enemy in Enemy.All)
            {
                if (!enemy.IsAlive) continue;
                Vector2 toEnemy = enemy.Ground - Gunport.Ground;
                if (toEnemy.sqrMagnitude > rangeSqr) continue;
                if (toEnemy.sqrMagnitude > 0.01f && Vector2.Angle(aim, toEnemy) > Def.coneDegrees * 0.5f) continue;
                enemy.TakeDamage(Damage);
            }

            PuffSmoke();
            Fire(aim);
        }

        // Gira as partículas para a direção do cone na tela e solta a rajada.
        private void Fire(Vector2 groundAim)
        {
            if (_grapeshot == null) return;
            Vector3 screenAim = IsoProjection.ToScreen(groundAim);
            float angle = Mathf.Atan2(screenAim.y, screenAim.x) * Mathf.Rad2Deg;
            _grapeshot.transform.rotation = Quaternion.Euler(0f, 0f, angle);
            _grapeshot.Emit(_pellets);
        }
    }
}
```

> O cone é calculado a partir do inimigo mais próximo **dentro do arco**, mas depois acerta todo mundo no cone, mesmo quem está fora do arco da portinhola. Numa portinhola lateral isso quase nunca acontece (o cone de 60° cabe no arco de 180°); é uma simplificação aceitável para o MVP.

### 4.5 Bala encadeada: `ChainShotWeapon`

```csharp
// Caminho: Assets/_Project/Scripts/Weapons/ChainShotWeapon.cs
using SeaHauler.Enemies;

namespace SeaHauler.Weapons
{
    // POR QUE: rasga as velas de um navio pirata (Parte 1 §5): ele perde o
    // embalo e fica para trás. É o jeito de "fugir" de um inimigo específico sem
    // correr de Pano cheio, mas quem fica para trás não dá ouro.
    // ESTRATÉGIA: tiro lento e forte, só em navios, que causa dano e rasga as
    // velas. Com as velas rasgadas, o inimigo deixa de navegar no ritmo do mar
    // (Fase 3), então cai para trás sozinho e pode até sair do jogo.
    public class ChainShotWeapon : Weapon
    {
        protected override void Tick(float dt)
        {
            if (!Reloaded) return;

            Enemy target = Enemy.FindNearest(Gunport, Def.range, shipsOnly: true);
            if (target == null) return;

            StartReload();
            target.TakeDamage(Damage);
            target.Tear(Def.tearSeconds * LevelMultiplier);
            PuffSmoke();
            ShowLine(target.transform.position, 0.2f);
        }
    }
}
```

### 4.6 Fuzileiros: `MarinesWeapon`

```csharp
// Caminho: Assets/_Project/Scripts/Weapons/MarinesWeapon.cs
using SeaHauler.Enemies;
using UnityEngine;

namespace SeaHauler.Weapons
{
    // POR QUE: fogo de mosquete contínuo em quem chega perto da portinhola,
    // inclusive nos piratas a bordo (Parte 1 §5). É a resposta "garantida" à
    // abordagem, porque não depende de mira nem de arco.
    // ESTRATÉGIA: dano por segundo a todos dentro do alcance (curto) da
    // portinhola, sem olhar o arco. Um ParticleSystem opcional solta os
    // estampidos e a fumacinha enquanto alguém está levando tiro. Não usa
    // recarga, então a Bordada não muda nada nos fuzileiros.
    public class MarinesWeapon : Weapon
    {
        [SerializeField] private ParticleSystem _volleys;

        protected override void Tick(float dt)
        {
            bool firing = false;
            float rangeSqr = Def.range * Def.range;
            foreach (Enemy enemy in Enemy.All)
            {
                if (!enemy.IsAlive) continue;
                if ((enemy.Ground - Gunport.Ground).sqrMagnitude > rangeSqr) continue;
                enemy.TakeDamage(Damage * dt);
                firing = true;
            }
            SetVolleys(firing);
        }

        protected override void OnIdle() => SetVolleys(false);

        private void SetVolleys(bool on)
        {
            if (_volleys == null) return;
            if (on && !_volleys.isPlaying) _volleys.Play();
            else if (!on && _volleys.isPlaying) _volleys.Stop();
        }
    }
}
```

### 4.7 `Gunport` (versão final)

Substitua o arquivo inteiro da Fase 2 por este. As novidades: guardar a arma montada, montar/desmontar, uma arma de teste e os destaques visuais que a alocação (Fase 5) vai usar.

```csharp
// Caminho: Assets/_Project/Scripts/Ship/Gunport.cs
using SeaHauler.Data;
using SeaHauler.Weapons;
using SeaHauler.World;
using UnityEngine;

namespace SeaHauler.Ship
{
    // POR QUE: a decisão central do jogador é "qual arma em qual portinhola"
    // (Parte 1 §4). Cada portinhola tem uma posição no navio, um arco de tiro
    // (nunca 360°), pode estar fechada e tem no máximo uma arma montada.
    // ESTRATÉGIA: a portinhola guarda um deslocamento no plano em relação ao
    // centro do navio, então sua posição real é sempre "navio + deslocamento". O
    // arco é um leque: direção central + abertura. O marcador colorido mostra o
    // estado: fechada, vazia, destacada para compra, selecionada ou sabotada.
    // DefaultExecutionOrder(50) faz a portinhola se posicionar depois do
    // GroundBody do navio.
    [DefaultExecutionOrder(50)]
    public class Gunport : MonoBehaviour
    {
        [SerializeField] private string _label = "Proa";
        [SerializeField] private Vector2 _offset;                 // metros a partir do centro do navio
        [SerializeField] private float _height = 0.3f;           // altura na tela (no convés)
        [SerializeField] private float _facingDegrees;           // 0 proa, 90 bombordo, -90 estibordo, 180 popa
        [SerializeField, Range(10f, 359f)] private float _arcDegrees = 180f;
        [SerializeField] private bool _startsOpen = true;
        [SerializeField] private SpriteRenderer _marker;
        [SerializeField] private Color _idleColor = new Color(1f, 0.95f, 0.8f, 0.45f);
        [SerializeField] private Color _closedColor = new Color(0.5f, 0.12f, 0.08f, 0.9f);
        [SerializeField] private Color _highlightColor = new Color(0.55f, 1f, 0.7f, 0.9f);
        [SerializeField] private Color _selectedColor = Color.yellow;
        [SerializeField] private Color _sabotagedColor = Color.red;
        [SerializeField] private WeaponDef _testWeapon;          // só para teste; deixe vazio na Fase 7

        private int _saboteurs;

        public ShipController Ship { get; private set; }
        public Weapon Installed { get; private set; }
        public bool IsEmpty => Installed == null;
        public string Label => _label;
        public float FacingDegrees => _facingDegrees;
        public float ArcDegrees => _arcDegrees;
        public bool StartsOpen => _startsOpen;
        public bool IsOpen { get; private set; }
        public bool Sabotaged => _saboteurs > 0;
        public bool Highlighted { get; set; } // portinhola onde dá para montar a arma escolhida
        public bool Selected { get; set; }    // portinhola aberta no painel
        public Vector2 Ground => Ship.Body.Ground + _offset;

        // Chamado pelo navio no Awake dele: a portinhola passa a saber a quem pertence.
        public void Bind(ShipController ship)
        {
            Ship = ship;
            IsOpen = _startsOpen;
        }

        private void Start()
        {
            if (_testWeapon == null) return;
            IsOpen = true;   // arma de teste numa portinhola fechada: abre para o teste
            Install(_testWeapon);
        }

        // Abre a portinhola (quem cobra é a alocação, Fase 5).
        public void Open() => IsOpen = true;

        // Volta ao estado do começo de run: sem arma e aberta ou fechada como no Inspector.
        public void ResetForRun()
        {
            Clear();
            IsOpen = _startsOpen;
        }

        // Diz se um ponto do plano está dentro do arco de tiro desta portinhola.
        public bool CanTarget(Vector2 point)
        {
            Vector2 toPoint = point - Ground;
            if (toPoint.sqrMagnitude < 0.0001f) return true;   // em cima da portinhola (pirata a bordo)
            float angle = Vector2.SignedAngle(IsoProjection.Dir(_facingDegrees), toPoint);
            return Mathf.Abs(angle) <= _arcDegrees * 0.5f;
        }

        // Cria a arma como filha da portinhola. Não cobra nada: quem cobra é a alocação.
        public Weapon Install(WeaponDef def)
        {
            if (!IsOpen || !IsEmpty || def == null || def.prefab == null) return null;
            Installed = Instantiate(def.prefab, transform);
            Installed.transform.localPosition = Vector3.zero;
            Installed.Install(def, this);
            return Installed;
        }

        // Desmonta e destrói a arma da portinhola.
        public void Clear()
        {
            if (IsEmpty) return;
            Destroy(Installed.gameObject);
            Installed = null;
        }

        // Piratas a bordo (Fase 3) avisam quando sobem e quando saem da portinhola.
        public void AddSaboteur() => _saboteurs++;
        public void RemoveSaboteur() => _saboteurs = Mathf.Max(0, _saboteurs - 1);

        private void LateUpdate()
        {
            if (Ship == null) return;
            transform.position = IsoProjection.ToScreen(Ground, _height);
            UpdateMarker();
        }

        // Escolhe a cor do marcador, do estado mais importante para o menos.
        private void UpdateMarker()
        {
            if (_marker == null) return;

            if (Sabotaged) _marker.color = _sabotagedColor;
            else if (Selected) _marker.color = _selectedColor;
            else if (!IsOpen) _marker.color = _closedColor;
            else if (Highlighted) _marker.color = _highlightColor;
            else _marker.color = _idleColor;

            // Portinhola com arma só mostra o marcador quando tem algo a dizer.
            _marker.enabled = IsEmpty || Selected || Sabotaged;
        }
    }
}
```

### 4.8 Criar prefabs e assets

1. **Material das linhas e partículas:** no URP 2D, use o material `Sprite-Unlit-Default` (procure por esse nome no Project, com o filtro **In Packages**).
2. **Fumaça de disparo** (usada por três armas): um filho `Smoke` com **Particle System** (Looping desligado, Play On Awake desligado, Duration `0.1`, Start Lifetime `0.6`, Start Speed `0.5`, Start Size `0.25`, cor creme `#E8E4DC` com alpha `0.7`, módulo **Emission** com um **Burst** de `5` partículas no tempo `0`, **Size over Lifetime** crescendo, Sorting Layer `FX`).
3. **Prefabs** (em `Prefabs/Weapons/`), cada um com um filho sprite `Square` (escala `0.3`, **Order in Layer = 10**) para aparecer em cima do navio:
   - `LongGun`: **LongGunWeapon** + **LineRenderer** (Width `0.04`, cor preta, **Use World Space** ligado, material acima, Sorting Layer `FX`) ligado em `Line` + `Smoke` ligado em `Smoke`.
   - `Carronade`: **CarronadeWeapon** + `Smoke` + filho `Grapeshot` com **Particle System**:
     - **Looping** desligado, **Play On Awake** desligado, Emission com **Rate over Time = 0** (a arma usa `Emit`), Start Lifetime `0.25`, Start Speed `16`, Start Size `0.06`, cor quase preta;
     - módulo **Shape** com Shape `Cone`, Angle `25` e Rotation `(0, 90, 0)`, para emitir para a direita (o "zero grau" do script);
     - módulo **Renderer** com o material acima e Sorting Layer `FX`.

     Ligue `Grapeshot` no campo `Grapeshot`.
   - `ChainShot`: **ChainShotWeapon** + **LineRenderer** (Width `0.06`, cor cinza `#8A8A90`), como no canhão longo, + `Smoke`.
   - `Marines`: **MarinesWeapon** + filho `Volleys` com um **Particle System** curto (Looping ligado, Start Lifetime `0.3`, Start Speed `1`, Start Size `0.12`, cor branca, Shape `Circle` com Radius `0.3`, Sorting Layer `FX`), ligado em `Volleys`.
4. **Assets** (em `ScriptableObjects/Weapons/`, **Create → Sea Hauler → Weapon**), números da Parte 1 §17:

| Asset | Prefab | Cost / Upgrade | Range | Damage | Fire Int. | Cone | Tear | Unlock At Best Legs |
|---|---|---|---|---|---|---|---|---|
| `LongGun` | LongGun | 40 / 40 | 10 | 20 | 0.5 | — | — | 0 |
| `Carronade` | Carronade | 60 / 60 | 4.5 | 30 | 0.9 | 60 | — | 1 |
| `ChainShot` | ChainShot | 70 / 70 | 12 | 35 | 3 | — | 3 | 3 |
| `Marines` | Marines | 50 / 50 | 3 | 15 | — | — | — | 0 |

5. **Teste:** nas portinholas, preencha `Test Weapon` conforme o arco das `Test Settings` do `LegManager`. Para o arco de trás (145° a 215°): canhão longo na popa e nas duas bordadas de trás, carronada numa bordada do meio, fuzileiros na outra, e bala encadeada na proa (que, nesse trecho, quase não vai ter alvo).

### ✅ Checkpoint da Fase 4
- No Play, o canhão longo da popa solta fumaça e um rastro curto, e escunas afundam.
- **Arco de tiro:** o canhão da **proa** não atira em quem está atrás do navio, e um canhão a **bombordo** não atira em quem está a estibordo. Troque o arco das `Test Settings` para `-110` a `110` (emboscada pela frente): agora a popa fica parada e a proa trabalha.
- A carronada solta uma rajada de metralha na direção do inimigo próximo e acerta vários de uma vez.
- A bala encadeada acerta um navio, que para de acompanhar e fica para trás (e, se passar de 40 m, sai sem dar ouro).
- Um pirata na portinhola de um canhão faz ele parar de atirar até ser morto: por qualquer outra arma ao alcance (mesmo fora do arco dela, com `Boarder Ignores Arcs` ligado no `GameConfig`) ou pelos fuzileiros de uma portinhola vizinha.
- Uma arma de teste numa portinhola marcada como fechada abre a portinhola sozinha (só no teste).
- Com as armas de teste montadas do lado certo, o navio termina o trecho de dificuldade 2 com casco sobrando; sem nenhuma, ele afunda.

#### Problemas comuns
- **Rastros ou partículas aparecem rosa:** o material não é compatível com o URP 2D. Troque para `Sprite-Unlit-Default`.
- **A metralha sai para o lado errado:** a rotação do módulo **Shape** não está em `(0, 90, 0)`, então o "zero grau" das partículas não é a direita.
- **A carronada não solta nada:** o `Grapeshot` está com Emission ligada e Looping desligado já tocado; com `Rate over Time = 0` e `Emit`, ele só aparece quando a arma dispara.
- **Uma arma atira para o lado que não devia:** o `Facing` da portinhola está trocado. Bombordo é `90` (esquerda do navio, para cima e para a esquerda na tela) e estibordo é `-90`.

Próxima fase: **Ouro, Alocação e Melhorias do Navio**, para o jogador comprar, melhorar e vender armas com o mouse, abrir portinholas, mexer nas velas pela UI e melhorar o navio.

---

# Parte 8 — Implementação Unity: Fase 5 (Ouro, Alocação e Melhorias do Navio)

## Fase 5 — Ouro, Alocação e Melhorias do Navio

> Objetivo desta fase: inimigos afundados dão ouro, e o jogador usa o mouse para comprar armas na barra de baixo e montá-las numa portinhola, melhorar e vender as montadas, abrir portinholas fechadas, comprar níveis de **Forro de cobre**, **Velame** e **Tripulação**, e trocar as velas pela UI. Com o HUD mostrando ouro, casco, progresso, velas e o aviso de rajada.

### 5.1 O cofre: `GoldWallet`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/GoldWallet.cs
using System;
using SeaHauler.Data;
using SeaHauler.Enemies;
using SeaHauler.Leg;
using UnityEngine;

namespace SeaHauler.Economy
{
    // POR QUE: o ouro é a única moeda da run (Parte 1 §6): entra quando um
    // inimigo afunda e sai quando o jogador compra, melhora, abre portinhola,
    // melhora o navio ou repara no Porto.
    // ESTRATÉGIA: escuta o evento estático Enemy.Killed e soma a recompensa do
    // inimigo, multiplicada pelo bônus de risco do trecho. Quem fica para trás
    // dispara Enemy.Escaped, não Killed, então não entra aqui: é a regra
    // "fuga custa saque" sem nenhuma linha a mais. A coleta é automática
    // (placeholder: a Parte 1 §6 deixa Em aberto). Um evento Changed avisa a UI.
    public class GoldWallet : MonoBehaviour
    {
        public static GoldWallet Instance { get; private set; }

        public int Amount { get; private set; }
        public event Action<int> Changed;

        private void Awake()
        {
            Instance = this;
            Amount = GameConfig.I.startingGold;
        }

        private void OnEnable() => Enemy.Killed += OnEnemyKilled;
        private void OnDisable() => Enemy.Killed -= OnEnemyKilled;

        private void OnEnemyKilled(Enemy enemy)
        {
            float multiplier = LegManager.Current != null ? LegManager.Current.Settings.goldMultiplier : 1f;
            if (multiplier <= 0f) multiplier = 1f; // LegSettings sem multiplicador preenchido
            Add(Mathf.RoundToInt(enemy.Def.goldReward * multiplier));
        }

        public void Add(int value)
        {
            if (value <= 0) return;
            Amount += value;
            Changed?.Invoke(Amount);
        }

        // Tenta gastar; devolve false (e não gasta nada) se não houver o bastante.
        public bool TrySpend(int value)
        {
            if (value > Amount) return false;
            Amount -= value;
            Changed?.Invoke(Amount);
            return true;
        }

        // Define o valor direto (começo de run, Fase 7).
        public void ResetTo(int value)
        {
            Amount = value;
            Changed?.Invoke(Amount);
        }
    }
}
```

### 5.2 As melhorias do navio: `ShipUpgrades`

As três melhorias (Parte 1 §6) são do **navio**, não de uma portinhola: elas não ocupam lugar de arma e são compradas por botões próprios. Ficam num componente só porque funcionam igual (níveis, custo × nível, máximo) e só o efeito muda.

```csharp
// Caminho: Assets/_Project/Scripts/Ship/ShipUpgrades.cs
using System;
using SeaHauler.Data;
using SeaHauler.Leg;
using UnityEngine;

namespace SeaHauler.Ship
{
    // As melhorias do navio (Parte 1 §6). Abrir portinhola não está aqui: ela
    // tem lugar (o jogador escolhe qual abrir) e mora na alocação.
    public enum ShipUpgrade { Copper, Rigging, Crew }

    // POR QUE: o "blindar" (Forro de cobre), o "correr mais" (Velame) e o
    // "aguentar mais tempo" (Tripulação) contra o "armar" das portinholas.
    // ESTRATÉGIA: guarda só os níveis. Os efeitos são LIDOS por quem já cuida
    // deles: o ShipHull lê BonusHull e CollisionReduction (a conta de dano fica
    // num lugar só), o SailController lê FullSpeedBonus. Só a Tripulação age
    // sozinha, consertando o casco no Update enquanto o trecho roda. Não cobra
    // nada: quem cobra é a alocação. Ao subir o Forro de cobre, o casco atual
    // sobe junto (senão comprar com o casco cheio deixaria um "buraco" vazio).
    [RequireComponent(typeof(ShipHull))]
    public class ShipUpgrades : MonoBehaviour
    {
        private readonly int[] _levels = new int[3];
        private ShipHull _hull;

        public float BonusHull => GameConfig.I.copperHullPerLevel * _levels[(int)ShipUpgrade.Copper];
        public float CollisionReduction => GameConfig.I.copperCollisionReductionPerLevel * _levels[(int)ShipUpgrade.Copper];
        public float FullSpeedBonus => GameConfig.I.riggingFullSpeedPerLevel * _levels[(int)ShipUpgrade.Rigging];
        public float RepairPerSecond => GameConfig.I.crewRepairPerSecondPerLevel * _levels[(int)ShipUpgrade.Crew];

        public event Action Changed;

        private void Awake()
        {
            _hull = GetComponent<ShipHull>();
        }

        public int Level(ShipUpgrade kind) => _levels[(int)kind];

        // Nível máximo de cada melhoria, vindo do GameConfig.
        public int MaxLevel(ShipUpgrade kind)
        {
            GameConfig cfg = GameConfig.I;
            return kind switch
            {
                ShipUpgrade.Copper => cfg.copperMaxLevel,
                ShipUpgrade.Rigging => cfg.riggingMaxLevel,
                _ => cfg.crewMaxLevel,
            };
        }

        public bool IsMaxed(ShipUpgrade kind) => Level(kind) >= MaxLevel(kind);

        // O próximo nível custa "custo por nível × (nível atual + 1)".
        public int NextCost(ShipUpgrade kind)
        {
            GameConfig cfg = GameConfig.I;
            int perLevel = kind switch
            {
                ShipUpgrade.Copper => cfg.copperCostPerLevel,
                ShipUpgrade.Rigging => cfg.riggingCostPerLevel,
                _ => cfg.crewCostPerLevel,
            };
            return perLevel * (Level(kind) + 1);
        }

        // Sobe um nível. O Forro de cobre cura o casco no mesmo tanto que o máximo subiu.
        public void AddLevel(ShipUpgrade kind)
        {
            if (IsMaxed(kind)) return;
            _levels[(int)kind]++;
            if (kind == ShipUpgrade.Copper) _hull.Repair(GameConfig.I.copperHullPerLevel);
            Changed?.Invoke();
        }

        // Volta tudo ao nível 0 (começo de run, Fase 7).
        public void ResetLevels()
        {
            for (int i = 0; i < _levels.Length; i++) _levels[i] = 0;
            Changed?.Invoke();
        }

        // Tripulação: carpinteiros consertam o casco devagar enquanto o trecho roda.
        private void Update()
        {
            if (RepairPerSecond <= 0f) return;
            if (LegManager.Current == null || !LegManager.Current.IsRunning) return;
            _hull.Repair(RepairPerSecond * Time.deltaTime);
        }
    }
}
```

Agora o casco passa a ler o Forro de cobre. No `ShipHull` da Fase 2, troque as duas linhas de `Max` e `CollisionReduction` por:

```csharp
        // Casco máximo: o do navio mais o do Forro de cobre (Parte 1 §6).
        public float Max => GameConfig.I.shipBaseHull + (_upgrades != null ? _upgrades.BonusHull : 0f);

        // Quanto do dano de COLISÃO é ignorado (0 a 1): o do Forro de cobre, com
        // um teto de 90% para o navio nunca ficar imune a rochedos.
        public float CollisionReduction => _upgrades != null ? Mathf.Min(0.9f, _upgrades.CollisionReduction) : 0f;
```

E troque o campo `_ship` (que até aqui não era usado) e o `Awake` por:

```csharp
        private ShipUpgrades _upgrades;

        private void Awake()
        {
            _upgrades = GetComponent<ShipUpgrades>();
            Current = Max;
            if (_bodyRenderer != null) _baseColor = _bodyRenderer.color;
        }
```

E as velas passam a ler o Velame. No `SailController` da Fase 2, adicione o campo e troque o `SpeedOf`:

```csharp
        private ShipUpgrades _upgrades;

        private void Awake()
        {
            _upgrades = GetComponent<ShipUpgrades>();
        }

        // Velocidade de uma posição, em metros por segundo. O Pano cheio soma o Velame.
        public float SpeedOf(SailSetting setting)
        {
            GameConfig cfg = GameConfig.I;
            return setting switch
            {
                SailSetting.Reefed => cfg.reefedSpeed,
                SailSetting.Half => cfg.halfSpeed,
                _ => cfg.fullSpeed + (_upgrades != null ? _upgrades.FullSpeedBonus : 0f),
            };
        }
```

> `Repair` já existe desde a Fase 2 e já respeita o novo `Max`: como o `AddLevel` sobe o nível **antes** de chamar `Repair`, o máximo já cresceu quando a cura acontece. A Tripulação chama `Repair` todo frame com um valor pequeno; o `Changed` do casco dispara todo frame nesse caso, o que é barato (só a UI escuta).

### 5.3 Comprar, melhorar, vender, abrir e melhorar o navio: `AllocationController`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/AllocationController.cs
using System;
using SeaHauler.Data;
using SeaHauler.Ship;
using SeaHauler.Weapons;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

namespace SeaHauler.Economy
{
    // POR QUE: alocar armas e melhorar o navio é tudo que o jogador faz com o
    // mouse além das velas (Parte 1 §2): ele não vira o leme nem mira.
    // ESTRATÉGIA: "clique-clique". Clicar numa arma da barra de compra a deixa
    // "pendente" e acende as portinholas abertas e vazias; clicar numa delas monta
    // e cobra. Clicar numa portinhola com arma (ou fechada) a seleciona e abre o
    // painel: melhorar e vender, ou abrir. Clique fora, botão direito ou Esc
    // cancelam. As portinholas são achadas pela distância na tela até o
    // marcador, sem colliders. As melhorias do navio são um clique só
    // (BuyUpgrade), sem escolher lugar, com os atalhos F, G e T. O preço de
    // abrir uma portinhola cresce com quantas já foram abertas nesta run.
    public class AllocationController : MonoBehaviour
    {
        [SerializeField] private Camera _camera;
        [SerializeField] private ShipController _ship;
        [SerializeField] private ShipUpgrades _upgrades;
        [SerializeField] private float _pickRadius = 0.5f; // unidades de tela em volta da portinhola

        public WeaponDef PendingBuy { get; private set; }
        public Gunport SelectedGunport { get; private set; }

        public event Action Changed;          // seleção mudou (barra e painel redesenham)
        public event Action<string> Message;  // aviso curto para o HUD

        // Quantas portinholas que começam fechadas já foram abertas nesta run.
        public int OpenedCount
        {
            get
            {
                int count = 0;
                foreach (Gunport gunport in _ship.Gunports)
                    if (gunport.IsOpen && !gunport.StartsOpen) count++;
                return count;
            }
        }

        // Preço de abrir a próxima portinhola (a lista do GameConfig; depois da última, repete a última).
        public int OpenCost
        {
            get
            {
                int[] costs = GameConfig.I.gunportOpenCosts;
                return costs[Mathf.Min(OpenedCount, costs.Length - 1)];
            }
        }

        // Chamado pelos botões da barra de compra. Clicar de novo na mesma cancela.
        public void SelectToBuy(WeaponDef def)
        {
            PendingBuy = PendingBuy == def ? null : def;
            SelectGunport(null);
            RefreshHighlights();
            Changed?.Invoke();
        }

        // Chamado pelos botões das melhorias (e pelo Porto, Fase 7).
        public void BuyUpgrade(ShipUpgrade kind)
        {
            if (_upgrades.IsMaxed(kind))
            {
                Message?.Invoke("Nível máximo");
                return;
            }
            if (!GoldWallet.Instance.TrySpend(_upgrades.NextCost(kind)))
            {
                Message?.Invoke("Ouro insuficiente");
                return;
            }
            _upgrades.AddLevel(kind);
            Changed?.Invoke();
        }

        private void Update()
        {
            Keyboard k = Keyboard.current;
            if (k != null)
            {
                if (k.escapeKey.wasPressedThisFrame) CancelAll();
                if (k.fKey.wasPressedThisFrame) BuyUpgrade(ShipUpgrade.Copper);
                if (k.gKey.wasPressedThisFrame) BuyUpgrade(ShipUpgrade.Rigging);
                if (k.tKey.wasPressedThisFrame) BuyUpgrade(ShipUpgrade.Crew);
            }
            if (Mouse.current != null && Mouse.current.rightButton.wasPressedThisFrame) CancelAll();

            Pointer pointer = Pointer.current;
            if (pointer == null || !pointer.press.wasPressedThisFrame) return;

            // Clique em cima de um botão da UI não é clique no mundo.
            if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject()) return;

            Vector2 world = _camera.ScreenToWorldPoint(pointer.position.ReadValue());
            Gunport gunport = FindGunport(world);

            if (gunport == null) CancelAll();
            else if (!gunport.IsOpen) { PendingBuy = null; RefreshHighlights(); SelectGunport(gunport); }
            else if (PendingBuy != null && gunport.IsEmpty) TryBuy(gunport);
            else if (!gunport.IsEmpty) SelectGunport(gunport);
            else Message?.Invoke("Escolha uma arma na barra de baixo");
        }

        // Portinhola mais perto do clique, dentro do raio, ou null.
        private Gunport FindGunport(Vector2 world)
        {
            Gunport best = null;
            float bestSqr = _pickRadius * _pickRadius;
            foreach (Gunport gunport in _ship.Gunports)
            {
                float sqr = ((Vector2)gunport.transform.position - world).sqrMagnitude;
                if (sqr >= bestSqr) continue;
                best = gunport;
                bestSqr = sqr;
            }
            return best;
        }

        // Cobra e monta a arma pendente numa portinhola aberta e vazia.
        private void TryBuy(Gunport gunport)
        {
            if (!GoldWallet.Instance.TrySpend(PendingBuy.cost))
            {
                Message?.Invoke("Ouro insuficiente");
                return;
            }
            gunport.Install(PendingBuy);
            PendingBuy = null;
            RefreshHighlights();
            Changed?.Invoke();
        }

        // Chamado pelo botão "Abrir" do painel, com uma portinhola fechada selecionada.
        public void OpenSelected()
        {
            if (SelectedGunport == null || SelectedGunport.IsOpen) return;
            if (!GoldWallet.Instance.TrySpend(OpenCost))
            {
                Message?.Invoke("Ouro insuficiente");
                return;
            }
            SelectedGunport.Open();
            SelectGunport(null);
            Changed?.Invoke();
        }

        // Chamado pelo botão "Melhorar" do painel.
        public void UpgradeSelected()
        {
            Weapon weapon = SelectedGunport != null ? SelectedGunport.Installed : null;
            if (weapon == null || !weapon.CanUpgrade) return;
            if (!GoldWallet.Instance.TrySpend(weapon.UpgradeCost))
            {
                Message?.Invoke("Ouro insuficiente");
                return;
            }
            weapon.Upgrade();
            Changed?.Invoke();
        }

        // Quanto a venda devolve (placeholder: 50% de tudo que foi gasto).
        public int SellValue(Weapon weapon)
        {
            return Mathf.RoundToInt(weapon.TotalSpent * GameConfig.I.sellRefund);
        }

        // Chamado pelo botão "Vender" do painel. Vender e comprar outra é o "trocar" da Parte 1 §6.
        public void SellSelected()
        {
            Weapon weapon = SelectedGunport != null ? SelectedGunport.Installed : null;
            if (weapon == null) return;
            GoldWallet.Instance.Add(SellValue(weapon));
            SelectedGunport.Clear();
            SelectGunport(null);
            Changed?.Invoke();
        }

        // Desfaz compra pendente e seleção.
        public void CancelAll()
        {
            PendingBuy = null;
            SelectGunport(null);
            RefreshHighlights();
            Changed?.Invoke();
        }

        private void SelectGunport(Gunport gunport)
        {
            if (SelectedGunport != null) SelectedGunport.Selected = false;
            SelectedGunport = gunport;
            if (SelectedGunport != null) SelectedGunport.Selected = true;
            Changed?.Invoke();
        }

        // Acende as portinholas abertas e vazias enquanto houver uma compra pendente.
        private void RefreshHighlights()
        {
            foreach (Gunport gunport in _ship.Gunports)
                gunport.Highlighted = PendingBuy != null && gunport.IsOpen && gunport.IsEmpty;
        }
    }
}
```

### 5.4 Um botão da barra de compra: `ShopButton`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ShopButton.cs
using System;
using SeaHauler.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SeaHauler.UI
{
    // POR QUE: cada arma liberada vira um botão com nome e preço.
    // ESTRATÉGIA: o botão não sabe nada de compra; recebe uma ação para chamar
    // no clique (quem cria decide o que acontece). Fica desabilitado quando
    // falta ouro e mostra uma moldura quando está escolhido.
    public class ShopButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private Image _icon;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private Image _selectedFrame;

        public WeaponDef Def { get; private set; }

        public void Setup(WeaponDef def, Action onClick)
        {
            Def = def;
            _icon.sprite = def.icon;
            _icon.enabled = def.icon != null;
            _label.text = $"{def.displayName}\n{def.cost} ouro";
            _button.onClick.AddListener(() => onClick());
        }

        public void Refresh(int gold, bool selected)
        {
            _button.interactable = gold >= Def.cost;
            _selectedFrame.enabled = selected;
        }
    }
}
```

### 5.5 A barra de compra: `ShopBar`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ShopBar.cs
using System.Collections.Generic;
using SeaHauler.Data;
using SeaHauler.Economy;
using UnityEngine;

namespace SeaHauler.UI
{
    // POR QUE: mostra as armas que podem ser compradas agora.
    // ESTRATÉGIA: cria um ShopButton por arma dentro de um container com
    // HorizontalLayoutGroup (a Unity alinha os botões sozinha). A lista começa
    // com todas as armas do Inspector; na Fase 7 a run troca por só as
    // desbloqueadas, chamando SetWeapons.
    public class ShopBar : MonoBehaviour
    {
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private ShopButton _buttonPrefab;
        [SerializeField] private Transform _container;
        [SerializeField] private List<WeaponDef> _weapons = new();

        private readonly List<ShopButton> _buttons = new();

        private void Start()
        {
            GoldWallet.Instance.Changed += _ => Refresh();
            _allocation.Changed += Refresh;
            Rebuild();
        }

        // Troca as armas mostradas (desbloqueios, Fase 7).
        public void SetWeapons(IEnumerable<WeaponDef> weapons)
        {
            _weapons = new List<WeaponDef>(weapons);
            Rebuild();
        }

        // Apaga e recria todos os botões.
        private void Rebuild()
        {
            foreach (ShopButton button in _buttons) Destroy(button.gameObject);
            _buttons.Clear();

            foreach (WeaponDef def in _weapons)
            {
                ShopButton button = Instantiate(_buttonPrefab, _container);
                WeaponDef captured = def; // cópia para o "=>" abaixo lembrar desta arma
                button.Setup(def, () => _allocation.SelectToBuy(captured));
                _buttons.Add(button);
            }
            Refresh();
        }

        private void Refresh()
        {
            int gold = GoldWallet.Instance.Amount;
            foreach (ShopButton button in _buttons)
                button.Refresh(gold, button.Def == _allocation.PendingBuy);
        }
    }
}
```

### 5.6 Os botões das melhorias: `UpgradeButton`

```csharp
// Caminho: Assets/_Project/Scripts/UI/UpgradeButton.cs
using SeaHauler.Economy;
using SeaHauler.Ship;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SeaHauler.UI
{
    // POR QUE: as melhorias do navio precisam estar sempre à mão (Parte 1 §14):
    // o momento de pôr Forro de cobre é quando os Recifes começam, no meio do
    // trecho; o de Velame, quando os perseguidores estão alcançando.
    // ESTRATÉGIA: um componente só para as três, escolhida no Inspector pelo
    // enum. Mostra nome, atalho, próximo nível e custo, e chama a alocação.
    // Redesenha quando o ouro ou as melhorias mudam.
    public class UpgradeButton : MonoBehaviour
    {
        [SerializeField] private ShipUpgrade _kind;
        [SerializeField] private string _displayName = "Forro de cobre";
        [SerializeField] private string _hotkey = "F";
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private ShipUpgrades _upgrades;
        [SerializeField] private Button _button;
        [SerializeField] private TMP_Text _label;

        private void Start()
        {
            _button.onClick.AddListener(() => _allocation.BuyUpgrade(_kind));
            GoldWallet.Instance.Changed += _ => Refresh();
            _upgrades.Changed += Refresh;
            Refresh();
        }

        private void Refresh()
        {
            int level = _upgrades.Level(_kind);
            if (_upgrades.IsMaxed(_kind))
            {
                _label.text = $"{_displayName}\nNv {level} (máximo)";
                _button.interactable = false;
                return;
            }
            int cost = _upgrades.NextCost(_kind);
            _label.text = $"{_displayName} [{_hotkey}]\nNv {level + 1}: {cost}";
            _button.interactable = GoldWallet.Instance.Amount >= cost;
        }
    }
}
```

### 5.7 As velas na tela: `SailPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/SailPanel.cs
using SeaHauler.Data;
using SeaHauler.Enemies;
using SeaHauler.Leg;
using SeaHauler.Ship;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SeaHauler.UI
{
    // POR QUE: a troca de velas é a decisão nova deste jogo (Parte 1 §3) e
    // precisa de botões (o protótipo também roda no celular, sem teclado), da
    // velocidade comparada à dos piratas e de quantos ficaram para trás neste
    // trecho: é o jogador vendo o "fuga custa saque" acontecer.
    // ESTRATÉGIA: três botões em pé (Pano cheio em cima, como um telégrafo),
    // destacados pela posição escolhida. O texto de velocidade muda todo frame
    // e é lido no Update. O contador escuta Enemy.Escaped e zera a cada trecho.
    public class SailPanel : MonoBehaviour
    {
        [SerializeField] private LegManager _leg;
        [SerializeField] private SailController _sails;
        [SerializeField] private Button _reefedButton;
        [SerializeField] private Button _halfButton;
        [SerializeField] private Button _fullButton;
        [SerializeField] private Color _onColor = new Color(0.95f, 0.9f, 0.8f);
        [SerializeField] private Color _offColor = new Color(0.25f, 0.16f, 0.1f);
        [SerializeField] private TMP_Text _speedText;
        [SerializeField] private TMP_Text _escapedText;

        private int _escaped;

        private void Start()
        {
            _reefedButton.onClick.AddListener(() => _sails.Set(SailSetting.Reefed));
            _halfButton.onClick.AddListener(() => _sails.Set(SailSetting.Half));
            _fullButton.onClick.AddListener(() => _sails.Set(SailSetting.Full));
            _sails.Changed += RefreshButtons;
            _leg.Started += _ => { _escaped = 0; RefreshEscaped(); };
            RefreshButtons();
            RefreshEscaped();
        }

        private void OnEnable() => Enemy.Escaped += OnEscaped;
        private void OnDisable() => Enemy.Escaped -= OnEscaped;

        private void OnEscaped(Enemy enemy)
        {
            _escaped++;
            RefreshEscaped();
        }

        private void RefreshButtons()
        {
            Paint(_reefedButton, SailSetting.Reefed);
            Paint(_halfButton, SailSetting.Half);
            Paint(_fullButton, SailSetting.Full);
        }

        // Pinta o botão da posição escolhida; com as velas rasgadas, o Pano cheio fica vermelho.
        private void Paint(Button button, SailSetting setting)
        {
            Color color = _sails.Setting == setting ? _onColor : _offColor;
            if (setting == SailSetting.Full && _sails.IsTorn) color = new Color(0.6f, 0.15f, 0.1f);
            button.image.color = color;
        }

        private void RefreshEscaped()
        {
            _escapedText.text = _escaped > 0 ? $"Deixados para trás: {_escaped}" : "";
        }

        private void Update()
        {
            _speedText.text = _sails.IsTorn
                ? $"RASGADAS {Mathf.CeilToInt(_sails.TornSecondsLeft)} s"
                : $"{_sails.CurrentSpeed:0.0} m/s  piratas {GameConfig.I.seaSpeed:0}";
        }
    }
}
```

### 5.8 O painel da portinhola selecionada: `GunportPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/GunportPanel.cs
using SeaHauler.Economy;
using SeaHauler.Ship;
using SeaHauler.Weapons;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SeaHauler.UI
{
    // POR QUE: melhorar, vender e abrir precisam de um lugar na tela (Parte 1 §14).
    // ESTRATÉGIA: o componente fica sempre ativo e liga/desliga só um filho
    // (_root). Assim ele continua escutando os eventos mesmo escondido, e se
    // redesenha sozinho quando a seleção ou o ouro mudam. O mesmo painel serve
    // as duas situações: portinhola fechada (um botão "Abrir") e portinhola com
    // arma ("Melhorar" e "Vender"). O botão principal troca de ação conforme o caso.
    public class GunportPanel : MonoBehaviour
    {
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private GameObject _root;
        [SerializeField] private TMP_Text _title;
        [SerializeField] private TMP_Text _info;
        [SerializeField] private Button _mainButton;
        [SerializeField] private TMP_Text _mainLabel;
        [SerializeField] private Button _sellButton;
        [SerializeField] private TMP_Text _sellLabel;

        private void Start()
        {
            _mainButton.onClick.AddListener(OnMain);
            _sellButton.onClick.AddListener(_allocation.SellSelected);
            _allocation.Changed += Refresh;
            GoldWallet.Instance.Changed += _ => Refresh();
            Refresh();
        }

        // Botão principal: abre a portinhola fechada ou melhora a arma.
        private void OnMain()
        {
            Gunport gunport = _allocation.SelectedGunport;
            if (gunport == null) return;
            if (!gunport.IsOpen) _allocation.OpenSelected();
            else _allocation.UpgradeSelected();
        }

        private void Refresh()
        {
            Gunport gunport = _allocation.SelectedGunport;
            Weapon weapon = gunport != null ? gunport.Installed : null;
            bool closed = gunport != null && !gunport.IsOpen;
            _root.SetActive(closed || weapon != null);
            if (gunport == null) return;
            int gold = GoldWallet.Instance.Amount;

            if (closed)
            {
                _title.text = "Portinhola fechada";
                _info.text = $"{gunport.Label}\nAbra para montar uma arma deste lado.";
                _mainLabel.text = $"Abrir ({_allocation.OpenCost})";
                _mainButton.interactable = gold >= _allocation.OpenCost;
                _sellButton.gameObject.SetActive(false);
                return;
            }
            if (weapon == null) return;

            _sellButton.gameObject.SetActive(true);
            _title.text = $"{weapon.Def.displayName} (nível {weapon.Level}/{weapon.Def.maxLevel})";
            _info.text = $"Portinhola: {gunport.Label}" + (gunport.Sabotaged ? "  [SABOTADA]" : "");
            if (weapon.CanUpgrade)
            {
                _mainLabel.text = $"Melhorar ({weapon.UpgradeCost})";
                _mainButton.interactable = gold >= weapon.UpgradeCost;
            }
            else
            {
                _mainLabel.text = "Nível máximo";
                _mainButton.interactable = false;
            }
            _sellLabel.text = $"Vender (+{_allocation.SellValue(weapon)})";
        }
    }
}
```

### 5.9 O HUD: `HudView`

```csharp
// Caminho: Assets/_Project/Scripts/UI/HudView.cs
using SeaHauler.Economy;
using SeaHauler.Leg;
using SeaHauler.Ship;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SeaHauler.UI
{
    // POR QUE: ouro, casco, progresso e o aviso de rajada precisam estar sempre
    // à vista (Parte 1 §14).
    // ESTRATÉGIA: ouro e nome do trecho mudam raramente, então são atualizados
    // por evento; casco, progresso e a contagem da rajada mudam todo frame e são
    // lidos no Update. As barras são Images com "Image Type = Filled", em que
    // fillAmount (0 a 1) controla quanto aparece. Avisos curtos (da alocação e
    // das rajadas) dividem o mesmo texto, que some sozinho.
    public class HudView : MonoBehaviour
    {
        [SerializeField] private LegManager _leg;
        [SerializeField] private ShipController _ship;
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private SquallSystem _squalls;
        [SerializeField] private TMP_Text _goldText;
        [SerializeField] private TMP_Text _legLabel;
        [SerializeField] private TMP_Text _hullText;
        [SerializeField] private TMP_Text _messageText;
        [SerializeField] private TMP_Text _squallText;
        [SerializeField] private Image _hullFill;
        [SerializeField] private Image _progressFill;
        [SerializeField] private float _messageSeconds = 1.8f;

        private float _messageTimer;

        private void Start()
        {
            GoldWallet.Instance.Changed += OnGoldChanged;
            OnGoldChanged(GoldWallet.Instance.Amount);
            _allocation.Message += ShowMessage;
            _leg.Started += settings => _legLabel.text = settings.label;
            _squalls.Warning += () => ShowMessage(_ship.Sails.Setting == SailSetting.Full
                ? "Rajada à vista! Recolha o Pano cheio"
                : "Rajada à vista");
            _squalls.Hit += caught => { if (caught) ShowMessage("Velas rasgadas!"); };
            _messageText.text = "";
        }

        private void OnGoldChanged(int amount)
        {
            _goldText.text = $"Ouro: {amount}";
        }

        // Mostra um aviso curto que some sozinho.
        private void ShowMessage(string text)
        {
            _messageText.text = text;
            _messageTimer = _messageSeconds;
        }

        private void Update()
        {
            ShipHull hull = _ship.Hull;
            _hullFill.fillAmount = hull.Current / hull.Max;
            _hullText.text = $"Casco {Mathf.CeilToInt(hull.Current)}/{Mathf.RoundToInt(hull.Max)}";
            _progressFill.fillAmount = _leg.Progress01;
            _squallText.text = _squalls.IsWarning ? $"Rajada em {_squalls.SecondsToNext:0.0} s" : "";

            if (_messageTimer <= 0f) return;
            _messageTimer -= Time.deltaTime;
            if (_messageTimer <= 0f) _messageText.text = "";
        }
    }
}
```

> Montar o texto do casco todo frame cria uma string nova por frame. Para um MVP é irrelevante; se o profiler reclamar, guarde os últimos valores e só reescreva quando mudarem.

### 5.10 Montar na cena

1. **Melhorias:** no objeto `Ship`, adicione **ShipUpgrades**. Faça as trocas no `ShipHull` e no `SailController` (§5.2).
2. **Lógica:** GameObject `Economy` com **GoldWallet** e **AllocationController** (`Camera` = Main Camera, `Ship` = Ship, `Upgrades` = Ship).
3. **Canvas:** **GameObject → UI → Canvas** (já cria o `EventSystem`). No Canvas: **UI Scale Mode = Scale With Screen Size**, referência `1280 × 720`. No `EventSystem`, se aparecer o aviso, clique em **Replace with InputSystemUIInputModule**.
4. **HUD** (filhos do Canvas, com **HudView** num objeto `Hud`, `Squalls` = `Squalls`):
   - `GoldText` (TextMeshPro) no canto superior esquerdo.
   - `LegLabel` (TextMeshPro) no topo, centralizado.
   - `HullBar`: uma Image de fundo escura e, dentro, `HullFill`, uma Image marrom-clara com **Source Image** = `Square`, **Image Type = Filled**, **Fill Method = Horizontal**; por cima, o texto `HullText`.
   - `ProgressBar`: igual, com `ProgressFill` dourado, logo abaixo do título.
   - `SquallText` (TextMeshPro) logo abaixo da barra de progresso.
   - `MessageText` (TextMeshPro) no centro, um pouco acima da barra de compra.
5. **Velas:** objeto `SailPanel` no lado esquerdo, acima das habilidades, com **VerticalLayoutGroup** e três **Buttons** (`Full` em cima, `Half`, `Reefed` embaixo, textos "Pano cheio [C]", "Meio pano [X]", "Rizadas [Z]"), mais `SpeedText` e `EscapedText`. Componente **SailPanel** com `Leg`, `Sails` = Ship e os campos ligados.
6. **Barra de compra:** objeto `ShopBar` ancorado embaixo, com **HorizontalLayoutGroup** (Spacing `8`, Child Alignment `Middle Center`) e o componente **ShopBar** (`Container` = ele mesmo, `Weapons` = os 4 assets).
7. **Prefab `ShopButton`** (em `Prefabs/UI/`): um **Button** de `120 × 80` com filhos `Icon` (Image), `Label` (TextMeshPro) e `SelectedFrame` (Image com só a borda, dourada). Ligue os campos do **ShopButton**.
8. **Melhorias:** uma coluna `Upgrades` no canto superior direito, com **VerticalLayoutGroup** e três **Buttons** de `170 × 60`, cada um com um `Label` e um **UpgradeButton**: `Copper`/"Forro de cobre"/`F`, `Rigging`/"Velame"/`G`, `Crew`/"Tripulação"/`T` (`Allocation`, `Upgrades` = Ship).
9. **Painel:** objeto `GunportPanel` (sempre ativo) com o componente **GunportPanel** e um filho `Root` (o painel visível, no canto inferior direito) contendo `Title`, `Info` e os botões `Main` e `Sell`, cada um com seu texto.
10. Apague os `Test Weapon` das portinholas, para testar a compra de verdade.

### ✅ Checkpoint da Fase 5
- O HUD começa com "Ouro: 100" e "Casco 500/500", e o ouro sobe quando um inimigo afunda por uma arma (não quando um brulote explode no navio, nem quando alguém fica para trás).
- Clicar em "Canhão longo" acende as portinholas **abertas** e vazias em verde (as fechadas continuam vermelho-escuras); clicar numa delas monta a arma e desconta 40.
- Clicar numa portinhola fechada abre o painel "Portinhola fechada" com "Abrir (60)"; abrir cobra 60, e a próxima custa 80.
- Clicar numa arma montada abre o painel; "Melhorar" sobe o nível e cobra; "Vender" remove a arma e devolve metade do gasto.
- `F` cobra 50 e o casco passa a "550/550"; o próximo nível custa 100. `G` deixa o Pano cheio mais rápido (13 → 14,5 m/s no painel das velas). `T` faz o casco subir devagar durante o trecho.
- Com `Rocks` ligado nas `Test Settings`, compare: sem Forro de cobre, uma rocha de raio 1,5 a Meio pano tira 24; com Forro 3, tira ~15 (24 × 0,64). Tiros de escuna **não** mudam com o Forro.
- Os botões das velas mudam a velocidade como as teclas, e o contador "Deixados para trás" sobe quando um perseguidor some atrás do navio de Pano cheio.
- Com `Squalls` ligado, a contagem "Rajada em X s" aparece no topo antes de cada rajada.
- Esc ou botão direito cancela a compra pendente e fecha o painel.

#### Problemas comuns
- **Clicar num botão da barra também monta a arma na portinhola embaixo dele:** falta o `EventSystem` na cena, então `IsPointerOverGameObject` sempre devolve false.
- **Nenhum clique no mundo funciona:** o `Pick Radius` é pequeno demais para o zoom da câmera, ou a `Camera` do `AllocationController` está vazia. As portinholas estão perto umas das outras (1,6 m); se o clique pega a vizinha, diminua o raio.
- **O Forro de cobre cobra mas o casco máximo não muda:** o `ShipHull` ainda está com as linhas da Fase 2. Faça as trocas do §5.2.
- **O Velame cobra mas o Pano cheio não acelera:** o `SailController` ainda está com o `SpeedOf` da Fase 2, ou não tem o `Awake` que acha o `ShipUpgrades`.
- **As barras não mudam:** a Image está com **Image Type = Simple**. O `fillAmount` só funciona com **Filled**, e só se houver uma **Source Image**.

Próxima fase: **Habilidades Ativas**, com barris de pólvora e bordada.

---

# Parte 9 — Implementação Unity: Fase 6 (Habilidades Ativas)

## Fase 6 — Habilidades Ativas

> Objetivo desta fase: dois botões de habilidade (placeholders: barris de pólvora e bordada), com cooldown visível e atalhos `1` e `2`.

### 6.1 Dados de uma habilidade: `AbilityDef`

```csharp
// Caminho: Assets/_Project/Scripts/Data/AbilityDef.cs
using SeaHauler.Abilities;
using UnityEngine;

namespace SeaHauler.Data
{
    public enum AbilityKind
    {
        PowderBarrels,  // barris de pólvora atrás do navio
        Broadside,      // todas as armas recarregam em dobro por um tempo
    }

    // POR QUE: a lista de habilidades está Em aberto (Parte 1 §7); barris e
    // bordada são placeholders. Um asset por habilidade deixa trocar números e
    // ícones sem código.
    // ESTRATÉGIA: um enum diz qual efeito aplicar, e os campos genéricos
    // (duração, intensidade, tamanho) são lidos por cada efeito do seu jeito.
    // Uma habilidade nova com efeito novo = um valor novo no enum + um case no
    // AbilityController.
    [CreateAssetMenu(menuName = "Sea Hauler/Ability", fileName = "Ability")]
    public class AbilityDef : ScriptableObject
    {
        public string displayName = "Barris";
        public Sprite icon;
        public AbilityKind kind;
        public float cooldown = 15f;
        public float duration = 5f;     // barris: tempo boiando; bordada: tempo de recarga acelerada
        public float magnitude = 2f;    // bordada: multiplicador da recarga
        public float damage = 40f;      // barris: dano em quem passa
        public float tearSeconds = 1.5f; // barris: velas rasgadas de quem passa
        public float size = 4f;         // barris: meio comprimento da faixa, em metros
        public float dropBehind = 5f;   // barris: quantos metros atrás do navio caem
        public PowderBarrels barrelsPrefab;
    }
}
```

### 6.2 Os barris: `PowderBarrels`

```csharp
// Caminho: Assets/_Project/Scripts/Abilities/PowderBarrels.cs
using System.Collections.Generic;
using SeaHauler.Data;
using SeaHauler.Enemies;
using SeaHauler.World;
using UnityEngine;

namespace SeaHauler.Abilities
{
    // POR QUE: placeholder da Parte 1 §7: o navio pirata que passa pelos barris
    // leva dano e tem as velas rasgadas por um instante.
    // ESTRATÉGIA: os barris ficam parados no plano, boiando (o navio segue e os
    // deixa para trás, bem no caminho de quem persegue). A faixa cobre
    // laneHalfWidth metros para cada lado e "size" metros para frente e para
    // trás. Cada navio só é atingido uma vez por faixa (HashSet guarda quem já
    // passou). É mais útil em trechos de perseguição; numa emboscada pela frente,
    // os piratas nunca passam por eles. O dano entra no ouro normalmente: um
    // navio afundado pelos barris dá ouro como se fosse por uma arma.
    [RequireComponent(typeof(GroundBody))]
    public class PowderBarrels : MonoBehaviour
    {
        [SerializeField] private ParticleSystem _blast;   // explosão, tocada a cada navio atingido

        private readonly HashSet<Enemy> _hit = new();
        private GroundBody _body;
        private AbilityDef _def;
        private float _life;

        // Chamado pelo AbilityController logo depois de criar os barris.
        public void Init(AbilityDef def, Vector2 ground)
        {
            _def = def;
            _life = def.duration;
            _body = GetComponent<GroundBody>();
            _body.Ground = ground;
            _body.Apply();
        }

        private void Update()
        {
            _life -= Time.deltaTime;
            if (_life <= 0f)
            {
                Destroy(gameObject);
                return;
            }

            float halfWidth = GameConfig.I.laneHalfWidth;
            foreach (Enemy enemy in Enemy.All)
            {
                if (!enemy.IsAlive || !enemy.Def.isShip || _hit.Contains(enemy)) continue;
                Vector2 d = enemy.Ground - _body.Ground;
                if (Mathf.Abs(d.x) > _def.size || Mathf.Abs(d.y) > halfWidth) continue;
                _hit.Add(enemy);
                enemy.Tear(_def.tearSeconds);
                enemy.TakeDamage(_def.damage);
                if (_blast != null)
                {
                    _blast.transform.position = IsoProjection.ToScreen(enemy.Ground);
                    _blast.Play();
                }
            }
        }
    }
}
```

> O `Tear` vem antes do `TakeDamage` de propósito: se o dano afundar o navio, ele some no fim do frame, e rasgar as velas de quem já afundou não faz mal. Na ordem inversa, `Tear` ainda funcionaria (o objeto só é destruído no fim do frame), mas fica mais claro assim.

### 6.3 Quem usa as habilidades: `AbilityController`

```csharp
// Caminho: Assets/_Project/Scripts/Abilities/AbilityController.cs
using System.Collections.Generic;
using SeaHauler.Data;
using SeaHauler.Leg;
using SeaHauler.Ship;
using SeaHauler.Weapons;
using UnityEngine;
using UnityEngine.InputSystem;

namespace SeaHauler.Abilities
{
    // POR QUE: além de alocar e mexer nas velas, o jogador tem habilidades com
    // cooldown (Parte 1 §7). Este é o único lugar que sabe aplicar cada efeito.
    // ESTRATÉGIA: um cooldown por habilidade, na mesma ordem da lista. As teclas
    // 1, 2, 3... usam a habilidade da posição correspondente. A Bordada liga o
    // Weapon.ReloadMultiplier (todas as armas recarregam mais rápido) e zera a
    // recarga de quem estava esperando; ao acabar, volta o multiplicador a 1.
    // Tudo volta a zero no começo e no fim de cada trecho.
    public class AbilityController : MonoBehaviour
    {
        [SerializeField] private ShipController _ship;
        [SerializeField] private LegManager _leg;
        [SerializeField] private List<AbilityDef> _abilities = new();

        private float[] _cooldowns;
        private float _broadsideTimer;

        public IReadOnlyList<AbilityDef> Abilities => _abilities;

        private void Awake()
        {
            _cooldowns = new float[_abilities.Count];
        }

        private void OnEnable()
        {
            _leg.Started += OnLegStarted;
            _leg.Ended += OnLegEnded;
        }

        private void OnDisable()
        {
            _leg.Started -= OnLegStarted;
            _leg.Ended -= OnLegEnded;
        }

        private void OnLegStarted(LegSettings settings)
        {
            for (int i = 0; i < _cooldowns.Length; i++) _cooldowns[i] = 0f;
            EndBroadside();
        }

        private void OnLegEnded(bool success) => EndBroadside();

        private void Update()
        {
            float dt = Time.deltaTime;
            for (int i = 0; i < _cooldowns.Length; i++) _cooldowns[i] = Mathf.Max(0f, _cooldowns[i] - dt);

            if (_broadsideTimer > 0f)
            {
                _broadsideTimer -= dt;
                if (_broadsideTimer <= 0f) EndBroadside();
            }

            Keyboard keyboard = Keyboard.current;
            if (keyboard == null) return;
            for (int i = 0; i < _abilities.Count && i < 9; i++)
                if (keyboard[Key.Digit1 + i].wasPressedThisFrame) TryUse(i);
        }

        // Fração do cooldown que ainda falta (1 = acabou de usar, 0 = pronta).
        public float Cooldown01(int index)
        {
            float total = _abilities[index].cooldown;
            return total <= 0f ? 0f : _cooldowns[index] / total;
        }

        // Usa a habilidade se o trecho estiver rolando e ela estiver pronta.
        public bool TryUse(int index)
        {
            if (!_leg.IsRunning || _cooldowns[index] > 0f) return false;

            AbilityDef ability = _abilities[index];
            switch (ability.kind)
            {
                case AbilityKind.PowderBarrels:
                    PowderBarrels barrels = Instantiate(ability.barrelsPrefab);
                    barrels.Init(ability, _ship.Ground + new Vector2(-ability.dropBehind, 0f));
                    break;

                case AbilityKind.Broadside:
                    _broadsideTimer = ability.duration;
                    Weapon.ReloadMultiplier = ability.magnitude;
                    // Quem estava recarregando atira na hora.
                    foreach (Gunport gunport in _ship.Gunports)
                        if (!gunport.IsEmpty) gunport.Installed.ReloadNow();
                    break;
            }

            _cooldowns[index] = ability.cooldown;
            return true;
        }

        private void EndBroadside()
        {
            _broadsideTimer = 0f;
            Weapon.ReloadMultiplier = 1f;
        }
    }
}
```

### 6.4 Os botões: `AbilityButton` e `AbilityBar`

```csharp
// Caminho: Assets/_Project/Scripts/UI/AbilityButton.cs
using System;
using SeaHauler.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SeaHauler.UI
{
    // POR QUE: o jogador precisa ver quando a habilidade volta.
    // ESTRATÉGIA: uma Image escura por cima do botão, com "Fill Method =
    // Radial 360", que vai se abrindo como um relógio conforme o cooldown acaba.
    public class AbilityButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private Image _icon;
        [SerializeField] private Image _cooldownOverlay;
        [SerializeField] private TMP_Text _label;

        public void Setup(AbilityDef ability, int hotkey, Action onClick)
        {
            _icon.sprite = ability.icon;
            _icon.enabled = ability.icon != null;
            _label.text = $"[{hotkey}] {ability.displayName}";
            _button.onClick.AddListener(() => onClick());
        }

        public void SetCooldown(float fraction)
        {
            _cooldownOverlay.fillAmount = fraction;
            _button.interactable = fraction <= 0f;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/AbilityBar.cs
using System.Collections.Generic;
using SeaHauler.Abilities;
using UnityEngine;

namespace SeaHauler.UI
{
    // POR QUE: um botão por habilidade, criado a partir da lista do controller.
    // ESTRATÉGIA: igual à barra de compra. O cooldown muda todo frame, então é
    // lido no Update.
    public class AbilityBar : MonoBehaviour
    {
        [SerializeField] private AbilityController _controller;
        [SerializeField] private AbilityButton _buttonPrefab;
        [SerializeField] private Transform _container;

        private readonly List<AbilityButton> _buttons = new();

        private void Start()
        {
            for (int i = 0; i < _controller.Abilities.Count; i++)
            {
                int index = i; // cópia para o "=>" abaixo lembrar deste índice
                AbilityButton button = Instantiate(_buttonPrefab, _container);
                button.Setup(_controller.Abilities[i], i + 1, () => _controller.TryUse(index));
                _buttons.Add(button);
            }
        }

        private void Update()
        {
            for (int i = 0; i < _buttons.Count; i++) _buttons[i].SetCooldown(_controller.Cooldown01(i));
        }
    }
}
```

### 6.5 Montar na cena

1. **Prefab `PowderBarrels`** (em `Prefabs/`): GameObject + **GroundBody** (`SortingGroup` na Sorting Layer **Mundo**) + **PowderBarrels** + alguns filhos sprite `Square` marrons (`#8A5A2A`, escala `0.2`) espalhados numa faixa de `(1.5, 1)`, para os barris aparecerem boiando, + filho `Blast` com um **Particle System** de explosão (Looping desligado, Play On Awake desligado, Burst de `20`, Start Lifetime `0.5`, Start Speed `3`, Start Size `0.2`, cor laranja, Sorting Layer `FX`) ligado em `Blast`.
2. **Assets** (em `ScriptableObjects/Abilities/`, **Create → Sea Hauler → Ability**), números da Parte 1 §17:

| Asset | Kind | Cooldown | Duration | Magnitude | Damage | Tear Seconds | Size | Drop Behind | Barrels Prefab |
|---|---|---|---|---|---|---|---|---|---|
| `Barrels` | PowderBarrels | 15 | 5 | — | 40 | 1.5 | 4 | 5 | PowderBarrels |
| `Broadside` | Broadside | 25 | 4 | 2 | — | — | — | — | — |

3. **Controller:** no objeto `Economy` (ou num novo `Abilities`), adicione **AbilityController** com `Ship`, `Leg` e `Abilities` = Barrels, Broadside (nessa ordem: tecla 1 e tecla 2).
4. **Prefab `AbilityButton`** (em `Prefabs/UI/`): Button `100 × 100` com filhos `Icon`, `Label` e, por último (para ficar por cima), `CooldownOverlay`: Image preta com alpha `0.6`, **Source Image** = `Square`, **Image Type = Filled**, **Fill Method = Radial 360**.
5. **Barra:** objeto `AbilityBar` no canto inferior esquerdo do Canvas (abaixo do `SailPanel`), com **HorizontalLayoutGroup** e o componente **AbilityBar**.

### ✅ Checkpoint da Fase 6
- Apertar `1` (ou clicar no botão) solta barris atrás do navio; escunas que passam por eles explodem um pouco (40 de dano) e param por 1,5 s. Piratas a bordo não são afetados.
- Num trecho de emboscada pela frente (arco `-110` a `110`), os barris quase não pegam ninguém: é o esperado, e é uma escolha de quando usar.
- Apertar `2` faz todos os canhões atirarem na hora e recarregarem em dobro por 4 s (a fumaça sai duas vezes mais). Os fuzileiros não mudam.
- Os botões escurecem e "abrem como relógio" até o fim do cooldown, e não funcionam antes disso.
- As habilidades não funcionam depois que o trecho acabou, e a Bordada não "vaza" para o trecho seguinte.

#### Problemas comuns
- **A tecla `1` do teclado numérico não funciona:** `Key.Digit1` é a tecla `1` acima das letras. Se quiser as duas, cheque também `Key.Numpad1 + i`.
- **As armas ficam aceleradas para sempre:** o trecho acabou durante a Bordada e o `ReloadMultiplier` não voltou a 1. Confira se o `AbilityController` assina o `Ended` do `LegManager` (o `OnLegEnded` chama `EndBroadside`).
- **A Bordada não faz ninguém atirar na hora:** só armas com recarga (canhão longo, carronada, bala encadeada) usam `ReloadNow`; os fuzileiros já atiram o tempo todo.

Próxima fase: **Run Roguelite, Porto e Save**, com mapa de rota por tipos de trecho, Porto, sequência de trechos, Galeão no fim e desbloqueios permanentes.

---

# Parte 10 — Implementação Unity: Fase 7 (Run Roguelite, Porto e Save)

## Fase 7 — Run Roguelite, Porto e Save

> Objetivo desta fase: o jogo completo de ponta a ponta. Menu → mapa de rota gerado (com tipos de trecho e Portos) → escolher nó → jogar o trecho ou reparar no Porto → voltar ao mapa → ... → Galeão → chegada ao porto de destino (ou derrota) → tela de resultado. E os desbloqueios permanentes salvos no navegador.

### 7.1 Um tipo de trecho: `LegTypeDef`

Os quatro tipos de trecho (Parte 1 §9) são dados: nome, risco, de que arco os piratas vêm, se há rochedos ou rajadas e quanto do orçamento de spawn vale. Num asset cada, dá para criar um tipo novo (ex.: "Neblina") sem código.

```csharp
// Caminho: Assets/_Project/Scripts/Data/LegTypeDef.cs
using UnityEngine;

namespace SeaHauler.Data
{
    // POR QUE: o tipo de trecho decide o padrão de ataque (Parte 1 §9), que é o
    // que faz "qual arma em qual portinhola" e "quanto pano içar" mudarem de um
    // trecho para o outro.
    // ESTRATÉGIA: um asset por tipo. O RouteGenerator sorteia entre eles, e o
    // RouteNode copia os valores para o LegSettings que o LegManager entende.
    [CreateAssetMenu(menuName = "Sea Hauler/Leg Type", fileName = "LegType")]
    public class LegTypeDef : ScriptableObject
    {
        public string displayName = "Mar aberto";
        public string shortDescription = "Perseguição por trás";
        public int risk;                     // 0..2: mais inimigos e mais ouro
        public float spawnArcMin = 145f;     // graus em volta do navio: 0 = frente, 180 = trás
        public float spawnArcMax = 215f;
        public float spawnMultiplier = 1f;   // Tempestade: 0.6
        public bool rocks;
        public bool squalls;
    }
}
```

### 7.2 Um nó do mapa: `RouteNode` e `RouteMap`

```csharp
// Caminho: Assets/_Project/Scripts/Run/RouteNode.cs
using System.Collections.Generic;
using SeaHauler.Data;
using SeaHauler.Leg;

namespace SeaHauler.Run
{
    // Os três jeitos de um nó: um trecho comum, um Porto ou o destino.
    public enum NodeKind { Leg, Port, Destination }

    // POR QUE: cada nó da rota é uma escolha do jogador (Parte 1 §9).
    // ESTRATÉGIA: classe C# pura (não é MonoBehaviour, não vai na cena). O mapa
    // é organizado em camadas: a camada 0 é o primeiro nó, a última é o destino.
    // "next" guarda para quais nós da camada seguinte dá para ir. Um nó de
    // trecho guarda o seu LegTypeDef; o Porto não tem tipo (não tem combate).
    public class RouteNode
    {
        public int layer;
        public int index;
        public NodeKind kind;
        public LegTypeDef type;   // trecho e destino; null no Porto
        public readonly List<int> next = new();

        public bool IsPort => kind == NodeKind.Port;
        public bool IsDestination => kind == NodeKind.Destination;
        public int Risk => kind == NodeKind.Leg && type != null ? type.risk : 0;

        // Nome curto do nó para a UI.
        public string Name => kind switch
        {
            NodeKind.Port => "Porto",
            NodeKind.Destination => "Porto de destino (B)",
            _ => type != null ? type.displayName : "Trecho",
        };

        // Converte o nó nas regras do trecho que o LegManager entende.
        // Não vale para o Porto (ele não vira trecho).
        public LegSettings ToSettings(GameConfig cfg)
        {
            return new LegSettings
            {
                label = IsDestination ? "Último trecho: a entrada do porto de destino" : $"{type.displayName} (risco {Risk})",
                difficulty = layer + 1 + Risk,
                hasBoss = IsDestination,
                goldMultiplier = 1f + Risk * cfg.goldBonusPerRisk,
                spawnArcMin = type.spawnArcMin,
                spawnArcMax = type.spawnArcMax,
                spawnMultiplier = type.spawnMultiplier,
                rocks = type.rocks,
                squalls = type.squalls,
            };
        }
    }

    // O mapa inteiro: uma lista de camadas, cada uma com seus nós.
    public class RouteMap
    {
        public readonly List<List<RouteNode>> layers = new();
    }
}
```

### 7.3 Gerar o mapa: `RouteGenerator`

```csharp
// Caminho: Assets/_Project/Scripts/Run/RouteGenerator.cs
using System.Collections.Generic;
using SeaHauler.Data;
using UnityEngine;

namespace SeaHauler.Run
{
    // POR QUE: a rota é gerada a cada run (Parte 1 §9), com tipos de trecho
    // misturados e, de vez em quando, um Porto (Parte 1 §10).
    // ESTRATÉGIA: cria as camadas com 2 a 3 nós (a última com só o destino).
    // Cada nó comum sorteia um tipo de trecho; nas camadas do meio, um nó pode
    // virar Porto (no máximo um por camada). As ligações entre camadas
    // vizinhas seguem a "posição relativa": um nó no alto da coluna liga com nós
    // no alto da próxima. Duas passadas garantem que todo nó tem pelo menos uma
    // saída e uma entrada; uma ligação extra sorteada cria as bifurcações.
    // System.Random (não o UnityEngine.Random) aceita uma semente, então o mesmo
    // número gera o mesmo mapa (útil para testar).
    public static class RouteGenerator
    {
        public static RouteMap Generate(GameConfig cfg, IReadOnlyList<LegTypeDef> legTypes,
                                        LegTypeDef destinationType, System.Random rng)
        {
            var map = new RouteMap();
            int layerCount = Mathf.Max(2, cfg.routeLayers);

            for (int l = 0; l < layerCount; l++)
            {
                bool last = l == layerCount - 1;
                int count = last ? 1 : rng.Next(cfg.minNodesPerLayer, cfg.maxNodesPerLayer + 1);
                bool middle = l > 0 && !last;
                int port = middle && rng.NextDouble() < cfg.portChance ? rng.Next(count) : -1;

                var layer = new List<RouteNode>();
                for (int i = 0; i < count; i++)
                {
                    var node = new RouteNode { layer = l, index = i };
                    if (last)
                    {
                        node.kind = NodeKind.Destination;
                        node.type = destinationType;
                    }
                    else if (i == port)
                    {
                        node.kind = NodeKind.Port;
                    }
                    else
                    {
                        node.kind = NodeKind.Leg;
                        node.type = legTypes[rng.Next(legTypes.Count)];
                    }
                    layer.Add(node);
                }
                map.layers.Add(layer);
            }

            for (int l = 0; l < layerCount - 1; l++) Connect(map.layers[l], map.layers[l + 1], rng);
            return map;
        }

        // Posição relativa (0..1) do nó i numa coluna de "count" nós.
        private static float RelativePos(int i, int count) => (i + 0.5f) / count;

        // Índice do nó, numa coluna de "count" nós, mais perto da posição relativa.
        private static int NearestIndex(float pos, int count) => Mathf.Clamp(Mathf.FloorToInt(pos * count), 0, count - 1);

        private static void Connect(List<RouteNode> from, List<RouteNode> to, System.Random rng)
        {
            // Toda origem tem pelo menos uma saída...
            foreach (RouteNode node in from)
            {
                int nearest = NearestIndex(RelativePos(node.index, from.Count), to.Count);
                AddEdge(node, nearest);

                // ...e às vezes uma segunda, para um vizinho (a bifurcação).
                if (rng.NextDouble() < 0.5)
                {
                    int neighbor = Mathf.Clamp(nearest + (rng.Next(2) == 0 ? -1 : 1), 0, to.Count - 1);
                    AddEdge(node, neighbor);
                }
            }

            // ...e todo destino tem pelo menos uma entrada.
            foreach (RouteNode target in to)
            {
                int source = NearestIndex(RelativePos(target.index, to.Count), from.Count);
                AddEdge(from[source], target.index);
            }
        }

        private static void AddEdge(RouteNode node, int nextIndex)
        {
            if (!node.next.Contains(nextIndex)) node.next.Add(nextIndex);
        }
    }
}
```

### 7.4 O save permanente: `MetaProgress`

```csharp
// Caminho: Assets/_Project/Scripts/Run/MetaProgress.cs
using System;
using UnityEngine;

namespace SeaHauler.Run
{
    // POR QUE: o que fica entre runs (Parte 1 §11) precisa sobreviver a fechar
    // o navegador. O jogo é offline (Parte 1 §16).
    // ESTRATÉGIA: um objeto simples convertido em JSON pelo JsonUtility e
    // guardado no PlayerPrefs. Na build Web, a Unity guarda o PlayerPrefs no
    // IndexedDB do navegador, mas só grava de fato quando PlayerPrefs.Save() é
    // chamado, por isso Save() sempre chama. A chave é própria deste jogo, para
    // não misturar com os saves do Fury Hauler e do Space Hauler.
    [Serializable]
    public class MetaProgress
    {
        private const string Key = "seahauler.meta";

        public int runsStarted;
        public int runsCompleted;
        public int bestLegs; // maior número de trechos concluídos numa run (Porto não conta)

        public static MetaProgress Load()
        {
            string json = PlayerPrefs.GetString(Key, "");
            if (string.IsNullOrEmpty(json)) return new MetaProgress();
            try
            {
                return JsonUtility.FromJson<MetaProgress>(json) ?? new MetaProgress();
            }
            catch (ArgumentException)
            {
                Debug.LogWarning("Save corrompido; começando do zero.");
                return new MetaProgress();
            }
        }

        public void Save()
        {
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(this));
            PlayerPrefs.Save();
        }
    }
}
```

### 7.5 Um botão do mapa: `RouteNodeButton`

```csharp
// Caminho: Assets/_Project/Scripts/UI/RouteNodeButton.cs
using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SeaHauler.UI
{
    // POR QUE: cada nó do mapa vira um botão clicável.
    // ESTRATÉGIA: o botão só exibe o texto e chama a ação recebida. Fica
    // clicável só se o nó for alcançável, e destacado se for o nó atual.
    public class RouteNodeButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private Image _currentFrame;

        public void Setup(string text, bool reachable, bool current, Action onClick)
        {
            _label.text = text;
            _button.interactable = reachable;
            _currentFrame.enabled = current;
            _button.onClick.AddListener(() => onClick());
        }
    }
}
```

### 7.6 O mapa na tela: `RouteMapView`

```csharp
// Caminho: Assets/_Project/Scripts/UI/RouteMapView.cs
using System.Text;
using SeaHauler.Data;
using SeaHauler.Run;
using UnityEngine;

namespace SeaHauler.UI
{
    // POR QUE: o jogador escolhe o próximo nó num mapa (Parte 1 §9), e precisa
    // ver o tipo de cada um para planejar as portinholas e as velas.
    // ESTRATÉGIA: uma coluna por camada (HorizontalLayoutGroup com colunas de
    // VerticalLayoutGroup). No MVP as ligações entre nós não são desenhadas como
    // linhas: cada botão diz em texto para onde ele segue ("Segue: A, B").
    // Desenhar as linhas (e o fundo de carta náutica) fica para depois (o
    // protótipo web desenha).
    public class RouteMapView : MonoBehaviour
    {
        [SerializeField] private RunManager _run;
        [SerializeField] private Transform _columnsContainer;
        [SerializeField] private Transform _columnPrefab;
        [SerializeField] private RouteNodeButton _nodePrefab;

        // Apaga e recria o mapa inteiro (é pequeno, não vale a pena reaproveitar).
        public void Build()
        {
            foreach (Transform child in _columnsContainer) Destroy(child.gameObject);

            foreach (var layer in _run.Route.layers)
            {
                Transform column = Instantiate(_columnPrefab, _columnsContainer);
                foreach (RouteNode node in layer)
                {
                    RouteNodeButton button = Instantiate(_nodePrefab, column);
                    RouteNode captured = node; // cópia para o "=>" abaixo lembrar deste nó
                    button.Setup(Describe(node), _run.CanChoose(node), node == _run.CurrentNode,
                        () => _run.ChooseNode(captured));
                }
            }
        }

        // Texto do botão: tipo, o que ele significa e para onde segue.
        private string Describe(RouteNode node)
        {
            if (node.IsDestination) return "PORTO DE DESTINO (B)\nGaleão pirata";

            var text = new StringBuilder();
            if (node.IsPort) text.Append("PORTO\nReparo, sem combate");
            else
            {
                LegTypeDef type = node.type;
                float bonus = node.Risk * GameConfig.I.goldBonusPerRisk * 100f;
                text.Append($"{type.displayName}\n{type.shortDescription}\nRisco {node.Risk}");
                if (bonus > 0f) text.Append($" (+{bonus:0}% ouro)");
            }
            text.Append("\nSegue: ");
            for (int i = 0; i < node.next.Count; i++)
            {
                if (i > 0) text.Append(", ");
                text.Append((char)('A' + node.next[i]));
            }
            return text.ToString();
        }
    }
}
```

### 7.7 O Porto: `PortPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/PortPanel.cs
using SeaHauler.Economy;
using SeaHauler.Run;
using SeaHauler.Ship;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SeaHauler.UI
{
    // POR QUE: o Porto (Parte 1 §10) é o lugar de recuperar muito casco de uma
    // vez. Ele não tem combate: é uma tela com reparo, as melhorias do navio e
    // "zarpar".
    // ESTRATÉGIA: a tela só mostra e chama o RunManager (reparo, zarpar). As
    // melhorias usam os mesmos UpgradeButton do HUD (Fase 5), colocados também
    // nesta tela: nada de código novo para elas. Redesenha quando o ouro ou o
    // casco mudam.
    public class PortPanel : MonoBehaviour
    {
        [SerializeField] private RunManager _run;
        [SerializeField] private ShipController _ship;
        [SerializeField] private TMP_Text _status;
        [SerializeField] private Button _repairStepButton;
        [SerializeField] private TMP_Text _repairStepLabel;
        [SerializeField] private Button _repairAllButton;
        [SerializeField] private TMP_Text _repairAllLabel;
        [SerializeField] private Button _leaveButton;
        [SerializeField] private int _repairStep = 50;

        private void Start()
        {
            _repairStepButton.onClick.AddListener(() => _run.Repair(_repairStep));
            _repairAllButton.onClick.AddListener(() => _run.Repair(float.MaxValue));
            _leaveButton.onClick.AddListener(_run.LeavePort);
            GoldWallet.Instance.Changed += _ => Refresh();
            _ship.Hull.Changed += Refresh;
        }

        // A tela liga sempre que o RunManager mostra o Porto.
        private void OnEnable() => Refresh();

        private void Refresh()
        {
            if (GoldWallet.Instance == null || _ship == null) return;
            ShipHull hull = _ship.Hull;
            _status.text = $"Casco {Mathf.CeilToInt(hull.Current)}/{Mathf.RoundToInt(hull.Max)}   Ouro {GoldWallet.Instance.Amount}";

            float step = _run.RepairableAmount(_repairStep);
            _repairStepLabel.text = $"Reparar {step:0} ({_run.RepairCost(step)} ouro)";
            _repairStepButton.interactable = step > 0f;

            float all = _run.RepairableAmount(float.MaxValue);
            _repairAllLabel.text = $"Reparar tudo: {all:0} ({_run.RepairCost(all)} ouro)";
            _repairAllButton.interactable = all > 0f;
        }
    }
}
```

### 7.8 A run: `RunManager`

```csharp
// Caminho: Assets/_Project/Scripts/Run/RunManager.cs
using System.Collections.Generic;
using SeaHauler.Data;
using SeaHauler.Economy;
using SeaHauler.Leg;
using SeaHauler.Ship;
using SeaHauler.UI;
using TMPro;
using UnityEngine;

namespace SeaHauler.Run
{
    // POR QUE: costura tudo numa run (Parte 1 §2): começa do zero, escolhe nós
    // no mapa, repara nos Portos, chega ao destino ou afunda, e guarda a
    // meta-progressão.
    // ESTRATÉGIA: uma única cena. Em vez de trocar de cena, liga e desliga
    // painéis (menu, mapa, Porto, resultado) por cima do jogo. O navio é o
    // mesmo objeto a run inteira: armas, portinholas abertas, melhorias, casco,
    // ouro e a posição das velas continuam de um nó para o outro naturalmente,
    // e o LegManager só o recoloca no começo da rota. O Porto não chama o
    // LegManager: é só uma tela. Fora do trecho, as teclas das velas ficam
    // desligadas, para Z/X/C não mexerem no navio atrás de um menu.
    public class RunManager : MonoBehaviour
    {
        [SerializeField] private LegManager _leg;
        [SerializeField] private ShipController _ship;
        [SerializeField] private ShipUpgrades _upgrades;
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private ShopBar _shop;
        [SerializeField] private List<WeaponDef> _allWeapons = new();
        [SerializeField] private List<LegTypeDef> _legTypes = new();   // Mar aberto, Recifes, Enseada, Tempestade
        [SerializeField] private LegTypeDef _destinationType;          // padrão do último trecho

        [Header("Telas")]
        [SerializeField] private GameObject _menuPanel;
        [SerializeField] private TMP_Text _menuStats;
        [SerializeField] private GameObject _routePanel;
        [SerializeField] private RouteMapView _routeView;
        [SerializeField] private GameObject _portPanel;
        [SerializeField] private GameObject _resultPanel;
        [SerializeField] private TMP_Text _resultText;

        private MetaProgress _meta;
        private int _legsDone;

        public RouteMap Route { get; private set; }
        public RouteNode CurrentNode { get; private set; } // null = ainda no porto de origem

        private void Start()
        {
            _meta = MetaProgress.Load();
            _leg.Ended += OnLegEnded;
            ShowOnly(_menuPanel);
            RefreshMenu();
        }

        // Botão "Zarpar" do menu e "Nova viagem" do resultado.
        public void NewRun()
        {
            GameConfig cfg = GameConfig.I;
            Route = RouteGenerator.Generate(cfg, _legTypes, _destinationType, new System.Random());
            CurrentNode = null;
            _legsDone = 0;

            _allocation.CancelAll();
            foreach (Gunport gunport in _ship.Gunports) gunport.ResetForRun();
            _upgrades.ResetLevels();
            _ship.Hull.ResetFull();   // depois das melhorias, para o máximo já ser o sem Forro de cobre
            _ship.Sails.Set(SailSetting.Half);
            GoldWallet.Instance.ResetTo(cfg.startingGold);
            _shop.SetWeapons(UnlockedWeapons());

            _meta.runsStarted++;
            _meta.Save();
            ShowRoute();
        }

        // Botão "Menu" do resultado.
        public void BackToMenu()
        {
            RefreshMenu();
            ShowOnly(_menuPanel);
        }

        // Pode ir para este nó? Da origem, qualquer nó da camada 0; depois, só os
        // ligados ao nó atual.
        public bool CanChoose(RouteNode node)
        {
            if (CurrentNode == null) return node.layer == 0;
            return node.layer == CurrentNode.layer + 1 && CurrentNode.next.Contains(node.index);
        }

        // Clique num nó do mapa: Porto abre a tela de reparo; trecho começa.
        public void ChooseNode(RouteNode node)
        {
            if (!CanChoose(node)) return;
            CurrentNode = node;
            if (node.IsPort)
            {
                ShowOnly(_portPanel);
                return;
            }
            ShowOnly(null);
            _leg.StartLeg(node.ToSettings(GameConfig.I));
        }

        // Quanto casco dá para reparar agora, até "wanted": limitado pelo que falta
        // e pelo ouro que o jogador tem.
        public float RepairableAmount(float wanted)
        {
            float missing = _ship.Hull.Max - _ship.Hull.Current;
            float affordable = GoldWallet.Instance.Amount * GameConfig.I.repairHullPerGold;
            return Mathf.Max(0f, Mathf.Min(wanted, missing, affordable));
        }

        // Ouro que um reparo de "amount" custa (arredonda para cima).
        public int RepairCost(float amount) => Mathf.CeilToInt(amount / GameConfig.I.repairHullPerGold);

        // Botões de reparo do Porto.
        public void Repair(float wanted)
        {
            float amount = RepairableAmount(wanted);
            if (amount <= 0f) return;
            if (!GoldWallet.Instance.TrySpend(RepairCost(amount))) return;
            _ship.Hull.Repair(amount);
        }

        // Botão "Zarpar" do Porto. O Porto não conta como trecho concluído.
        public void LeavePort()
        {
            ShowRoute();
        }

        private void OnLegEnded(bool success)
        {
            if (CurrentNode == null) return; // trecho de teste (Fases 2-6), fora de uma run

            if (success)
            {
                _legsDone++;
                _meta.bestLegs = Mathf.Max(_meta.bestLegs, _legsDone);
            }

            if (success && CurrentNode.IsDestination)
            {
                _meta.runsCompleted++;
                _meta.Save();
                ShowResult("Você chegou ao porto! A carga da Coroa chegou inteira.");
            }
            else if (success)
            {
                _meta.Save();
                ShowRoute();
            }
            else
            {
                _meta.Save();
                ShowResult($"O navio foi a pique em: {CurrentNode.Name}.\nTrechos concluídos: {_legsDone}");
            }
        }

        // Armas cujo requisito de desbloqueio já foi atingido (placeholder, Parte 1 §11).
        private List<WeaponDef> UnlockedWeapons()
        {
            var unlocked = new List<WeaponDef>();
            foreach (WeaponDef def in _allWeapons)
                if (def.unlockAtBestLegs <= _meta.bestLegs) unlocked.Add(def);
            return unlocked;
        }

        private void ShowRoute()
        {
            ShowOnly(_routePanel);
            _routeView.Build();
        }

        private void ShowResult(string text)
        {
            _resultText.text = text;
            ShowOnly(_resultPanel);
        }

        private void RefreshMenu()
        {
            _menuStats.text = $"Viagens: {_meta.runsStarted}   Chegadas ao porto: {_meta.runsCompleted}   Melhor run: {_meta.bestLegs} trechos";
        }

        // Liga um painel e desliga os outros (null = só o jogo). As teclas das
        // velas só valem com o jogo na tela.
        private void ShowOnly(GameObject panel)
        {
            _menuPanel.SetActive(panel == _menuPanel);
            _routePanel.SetActive(panel == _routePanel);
            _portPanel.SetActive(panel == _portPanel);
            _resultPanel.SetActive(panel == _resultPanel);
            _ship.Sails.InputEnabled = panel == null;
        }
    }
}
```

> A arma nova liberada só aparece na barra de compra na **próxima** run, porque `UnlockedWeapons()` é lido no `NewRun`. É uma escolha de simplicidade, não de design: se o jogo quiser liberar no meio da run, basta chamar `_shop.SetWeapons(UnlockedWeapons())` também no `OnLegEnded`.

### 7.9 Montar na cena

1. **LegManager:** desligue `Start On Play`. A partir de agora quem começa os trechos é a run.
2. **Portinholas:** confira que nenhum `Test Weapon` está preenchido.
3. **GameConfig:** volte `Leg Length` para `900`, se tinha diminuído na Fase 2.
4. **Tipos de trecho** (em `ScriptableObjects/LegTypes/`, **Create → Sea Hauler → Leg Type**), números da Parte 1 §17:

| Asset | Display Name | Short Description | Risk | Spawn Arc Min / Max | Spawn Multiplier | Rocks | Squalls |
|---|---|---|---|---|---|---|---|
| `OpenSea` | Mar aberto | Perseguição por trás | 0 | 145 / 215 | 1 | não | não |
| `Reefs` | Recifes | Emboscada pela frente, rochedos | 1 | -110 / 110 | 1 | **sim** | não |
| `PirateCove` | Enseada pirata | Cerco de todos os lados | 2 | 0 / 360 | 1 | não | não |
| `Storm` | Tempestade | Rajadas rasgam o Pano cheio | 1 | 100 / 260 | 0.6 | não | **sim** |
| `Destination` | Entrada do porto | Perseguição e Galeão | 0 | 145 / 215 | 1 | não | não |

5. **Run:** GameObject `Run` com **RunManager**: `Leg`, `Ship`, `Upgrades` = Ship, `Allocation`, `Shop`, `All Weapons` = os 4 assets de arma, `Leg Types` = OpenSea, Reefs, PirateCove, Storm, `Destination Type` = Destination.
6. **Painéis** (filhos do Canvas, cada um com uma Image de fundo escura cobrindo a tela inteira, para bloquear cliques no jogo por baixo):
   - `MenuPanel`: título "SEA HAULER", texto `MenuStats` e botão "Zarpar" → **On Click** = `Run` → `RunManager.NewRun`.
   - `RoutePanel`: título "Escolha o próximo trecho" e um objeto `Columns` com **HorizontalLayoutGroup** (Spacing `40`, Child Alignment `Middle Center`). Ligue **RouteMapView** no `RoutePanel`, com `Run` = `Run` e `Columns Container` = `Columns`.
   - `PortPanel`: título "Porto", texto `Status`, botões `RepairStep`, `RepairAll` e `Leave` ("Zarpar"), três botões de melhoria com **UpgradeButton** (os mesmos da Fase 5, duplicados para cá) e o componente **PortPanel** com tudo ligado (`Run`, `Ship`).
   - `ResultPanel`: texto `ResultText`, botão "Nova viagem" → `RunManager.NewRun` e botão "Menu" → `RunManager.BackToMenu`.
7. **Prefabs de UI** (em `Prefabs/UI/`):
   - `RouteColumn`: um RectTransform vazio com **VerticalLayoutGroup** (Spacing `20`, Child Alignment `Middle Center`) e **Content Size Fitter** (Vertical Fit = Preferred Size).
   - `RouteNodeButton`: um Button `180 × 110` com filhos `Label` (TextMeshPro) e `CurrentFrame` (Image só de borda, dourada).
8. Na `RouteMapView`, ligue `Column Prefab` = `RouteColumn` e `Node Prefab` = `RouteNodeButton`.

### ✅ Checkpoint da Fase 7
- O jogo abre no menu, com as estatísticas zeradas na primeira vez.
- "Zarpar" mostra o mapa: 6 colunas, a última só com "PORTO DE DESTINO (B)"; cada nó mostra o tipo ("Mar aberto", "Recifes", "Enseada pirata", "Tempestade") ou "PORTO"; só os nós da primeira coluna são clicáveis.
- Escolher um trecho esconde o mapa e começa o trecho **com o padrão do tipo**: nos Recifes, os piratas vêm pela frente e aparecem rochedos; na Enseada, de todo lado; na Tempestade, menos piratas e rajadas.
- Escolher um Porto abre a tela de reparo: "Reparar 50" cobra 25 de ouro; "Reparar tudo" para no casco máximo ou quando o ouro acaba; as melhorias funcionam ali também; "Zarpar" volta ao mapa, e o Porto **não** conta como trecho concluído.
- Armas, portinholas abertas, melhorias, ouro, casco e a posição das velas continuam de um nó para o outro.
- No mapa, apertar `C` não muda as velas (as teclas só valem no trecho).
- No último trecho aparece o Galeão; afundá-lo e chegar ao fim mostra "Você chegou ao porto!".
- Perder mostra a tela de resultado; "Nova viagem" recomeça com 100 de ouro, navio sem armas, 4 portinholas fechadas, melhorias no nível 0, Meio pano e casco cheio (500).
- Na primeira run só há canhão longo e fuzileiros na barra; depois de uma run em que concluiu pelo menos 1 trecho, a carronada aparece na próxima.
- Fechar e abrir o jogo de novo mantém as estatísticas do menu.

#### Problemas comuns
- **Clicar no mapa também clica no navio por trás:** o painel não tem uma Image de fundo com **Raycast Target** ligado, então o `EventSystem` não sabe que o mouse está sobre a UI.
- **O trecho começa sozinho ao abrir o jogo:** o `Start On Play` do `LegManager` ainda está ligado.
- **`NullReferenceException` no `RouteNode.ToSettings`:** o `Destination Type` do `RunManager` está vazio, ou a lista `Leg Types` está vazia.
- **"Nova viagem" começa com casco 750:** o `ResetFull` foi chamado antes do `ResetLevels` das melhorias. A ordem do `NewRun` importa.
- **"Nova viagem" começa com as 8 portinholas abertas:** o `NewRun` está chamando `Clear` em vez de `ResetForRun` nas portinholas.
- **As estatísticas zeram ao rodar de novo no Editor:** o PlayerPrefs do Editor é separado do da build, mas persiste entre Plays. Se zerar, confira se o `Save()` está sendo chamado. Para apagar de propósito: **Edit → Clear All PlayerPrefs**.

Próxima fase: **Build Web e Próximos Passos**.

---

# Parte 11 — Implementação Unity: Fase 8 (Build Web e Próximos Passos)

## Fase 8 — Build Web e Próximos Passos

> Objetivo desta fase: o MVP rodando num navegador, pronto para mandar o link para alguém testar.

### 8.1 Configurar a plataforma

1. **File → Build Profiles → Web → Switch Platform.**
2. Em **Player Settings → Resolution and Presentation**: resolução padrão `1280 × 720` e template `Default` (ou `Minimal`, sem a moldura da Unity).
3. Em **Player Settings → Publishing Settings**:
   - **Compression Format = Gzip**.
   - **Decompression Fallback** ligado. Sem isso, sites que não mandam o cabeçalho `Content-Encoding` certo (como o itch.io em alguns casos) mostram erro ao carregar.
4. **Run In Background** ligado (Resolution and Presentation), para o jogo não congelar quando outra aba ganha foco por um instante.

### 8.2 Gerar e testar

1. **Build And Run** em `Builds/Web/`. A Unity abre um servidor local e o navegador.
   - Abrir o `index.html` direto do disco (dando dois cliques) **não funciona**: navegadores bloqueiam o carregamento dos arquivos da build por `file://`.
2. Teste o roteiro inteiro do Checkpoint da Fase 7 no navegador, inclusive fechar a aba e abrir de novo para conferir o save.
3. **Publicar para teste:** no itch.io, crie um projeto **HTML**, envie a pasta da build compactada em `.zip` e marque **This file will be played in the browser**.

### ✅ Checkpoint da Fase 8
- A build abre no navegador sem erros no console do navegador (F12).
- Uma run inteira dá para ser jogada só com mouse (e as teclas `Z`, `X`, `C`, `F`, `G`, `T`, `1` e `2` opcionais).
- O save sobrevive a fechar e abrir a aba.

#### Problemas comuns
- **"Unable to parse Build/....framework.js.gz":** o servidor não está mandando os arquivos `.gz` com o cabeçalho certo. Ligue **Decompression Fallback** e gere de novo.
- **O save some no navegador:** abas anônimas apagam o IndexedDB ao fechar; teste numa aba normal. Na build, o save só é gravado quando `PlayerPrefs.Save()` roda (já está no `MetaProgress.Save`).

### 8.3 Próximos passos

Tudo abaixo depende de decisões que a Parte 1 ainda marca como **Em aberto**:

- **Arte final:** os sprites PixelLab do protótipo (`Sprites/SeaHauler/`) entram no lugar dos placeholders só arrastando sprites novos nos prefabs (o casco no `Body`, os três mastreames em `Rig Sprites`), sem mexer em código.
- **Efeitos da Tempestade:** chuva (um Particle System preso à câmera) e relâmpago (uma Image branca no Canvas que pisca no `SquallSystem.Hit`).
- **Áudio** (Parte 1 §15).
- **A troca "fuga custa saque"** (o maior risco da Parte 1 §18): jogar e conferir se correr de Pano cheio é uma escolha, e não a resposta certa sempre.
- **Indicador de inimigos fora da tela** (Parte 1 §14).
- **Mais tipos de trecho e de nó** (Parte 1 §9 e §10): ex.: neblina (alcance menor), loja, evento.
- **O que desbloquear e como** na meta-progressão (Parte 1 §11).
- **Coleta de ouro, pausa durante alocação e mover armas** (Parte 1 §6).
- **Mais habilidades, armas, inimigos e navios** (Parte 1 §3, §5, §7, §8).

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
