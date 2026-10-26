# Caça às Bruxas — GDD inicial

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

Oct 5, 2026 · @Abraão Alves Vila NOVA

## Visão geral

Caça às Bruxas é um souls-like em que a jogadora controla uma bruxa caçada durante o período da caça às bruxas. É o primeiro jogo com enredo da Manguebyte. O nome ainda é provisório.

A inversão central: nos souls-likes o jogador costuma ser o caçador; aqui ele é a caça.

**Pilares**

- **Poder tem preço.** Cada magia aprendida fortalece a bruxa e aumenta a Suspeita sobre ela.
- **As mortas sustentam a luta.** Os checkpoints são locais de execução, e as bruxas queimadas ali guiam e fortalecem a protagonista.
- **Combate só com magia.** Ataques, defesa e parry são todos mágicos.
- **História contada dentro do jogo.** Sem cutscenes; toda narrativa vem de NPCs, itens e cenário.

**Engine:** Unity.

## Premissa e narrativa

Uma bruxa persegue um demônio que assombra uma cidade. Ao derrotá-lo, a cidade se volta contra ela: na cabeça dos moradores, ela é o demônio. A partir daí, ela passa a ser caçada.

O tema central é fazer o bem e ser tratada como o mal.

**Narrativa sem cutscenes.** Todo diálogo acontece com NPCs dentro do jogo. A história é contada por:

- **Bruxas das fogueiras**, as principais narradoras (ver Fogueiras).
- **NPCs vivos**, como aldeões que escondem ou denunciam a protagonista.
- **Descrições de itens** dropados por pessoas mortas no caminho.
- **Cenário**, como cartazes de procura-se, estacas e casas marcadas.

NPCs vivos podem reagir à Suspeita: com ela baixa, um mercador negocia; com ela alta, ele foge ou chama os guardas.

**Nota de ambientação.** O auge histórico da caça às bruxas foi entre cerca de 1450 e 1700, no início da Idade Moderna. O jogo pode usar uma estética de medieval sombrio por ser ficção.

## Fogueiras

A fogueira de checkpoint é o local onde bruxas foram executadas. As bruxas mortas ali dão força para a protagonista continuar a luta.

**Decidido**

- Cada fogueira tem uma bruxa com nome e história próprios.
- Ela conta o motivo pelo qual morreu.
- Ela aponta o caminho que a protagonista deve seguir, servindo como guia orgânico no lugar de marcadores no mapa.

**Propostas a validar**

- **Dons por bruxa:** cada morta concede um dom ligado à sua vida (uma curandeira fortalece a cura, uma parteira dá resistência).
- **Equipar magias:** a protagonista escolhe quais quatro magias leva nos atalhos ao descansar.
- **Cinzas como moeda:** a protagonista coleta cinzas ou memórias para evoluir; ao morrer, perde-as no local e precisa recuperá-las.
- **Fogueiras purificadas:** inquisidores podem apagar ou consagrar fogueiras, cortando o acesso até que sejam recuperadas.
- **Arco narrativo:** juntar os relatos das bruxas revela uma verdade maior e pode definir finais diferentes.

**Direção de arte:** estacas, correntes queimadas e objetos pessoais das vítimas ao redor do fogo. É o lugar mais seguro para a protagonista e o mais terrível da história do mundo.

## Sistema de Suspeita

Quanto mais magias a bruxa aprende, maior é sua Suspeita. A Suspeita alta deixa os inimigos mais agressivos, faz surgir novos inimigos (como caçadores especializados) e dá acesso a novas áreas do mapa.

O risco de design é o jogador evitar aprender magias. Para equilibrar, as áreas liberadas pela Suspeita devem guardar recompensas exclusivas: chefes, bruxas de fogueira e dons raros.

**Faixas propostas**

| Faixa | Efeito no mundo |
| --- | --- |
| Desconfiança | Aldeões observam e evitam a bruxa |
| Denúncia | Guardas atacam ao ver; patrulhas aumentam |
| Perseguição | Caçadores especializados surgem no mapa; novas áreas abrem |
| Inquisição | Inimigos mais agressivos; fogueiras podem ser purificadas |

**Ideias adicionais**

- Áreas antigas ficam mais perigosas com a Suspeita alta, tornando o backtracking uma escolha tensa.
- Na Suspeita alta, a regeneração de MP pode ficar mais lenta.
- Usar magias fortes perto de NPCs pode aumentar a Suspeita além do aprendizado.

## Combate

A bruxa luta só com magia: ataque rápido, ataque carregado, escudo mágico e magias aprendidas. O escudo é uma bola de energia circulando a bruxa.

**Escudo e parry (decidido)**

- Segurar o escudo bloqueia, mas gasta MP, o mesmo recurso das outras magias.
- O parry no momento exato tem custo zero e quebra a postura do inimigo.

**MP (decidido):** regeneração passiva.

**Propostas a validar**

- **Pausa antes de regenerar:** o MP volta só após 1 a 2 segundos sem gastar, para que bloquear e regenerar não se anulem.
- **Velocidade de regeneração:** barra cheia em cerca de 8 a 12 segundos como ponto de partida para playtest.
- **Escudo quebrado:** se o MP zera enquanto o escudo está ativo, ele estoura e a bruxa fica atordoada.
- **Parry devolve MP:** bônus pequeno para recompensar o jogo preciso.
- **Barra de postura:** cheia, deixa o inimigo vulnerável a um golpe crítico; a de chefes regenera.
- **Ataques não aparáveis:** agarrões, fogo de tochas e redes, com sinal visual claro, forçam a esquiva.
- **Refletir projéteis:** parry perfeito devolve flechas e magias inimigas.
- **Janela de parry variável:** mais generosa contra aldeões, mais apertada contra caçadores e chefes.
- **Recursos separados:** R1 e R2 gastam stamina; magias aprendidas gastam MP.

## Controles

Todo o combate fica nos gatilhos; L2 funciona como modificador para as magias aprendidas. Layout de referência do controle de PlayStation.

| Botão | Ação | Status |
| --- | --- | --- |
| R1 | Ataque rápido de magia | Decidido |
| R2 | Magia carregada (ataque forte) | Decidido |
| L1 | Escudo mágico: segurar bloqueia, tocar no tempo faz parry | Decidido |
| L2 + X / O / △ / □ | Magias aprendidas equipadas | Decidido |
| O | Esquiva / correr | Proposto |
| X | Interagir | Proposto |
| □ | Usar item | Proposto |
| △ | Trocar item | Proposto |
| R3 | Travar alvo | Proposto |
| D-pad | Trocar itens e ferramentas | Proposto |

Enquanto L2 está pressionado, o polegar direito sai do analógico, então o travamento de alvo é essencial para lançar magias sem perder o inimigo.

## Progressão e exploração

A bruxa aprende magias explorando o mapa. Elas aparecem em baús e em itens dropados por pessoas mortas no caminho.

Cada magia aprendida aumenta a Suspeita, e a Suspeita abre novas áreas. Assim, a exploração alimenta a progressão, que por sua vez reabre o mapa.

**Propostas a validar**

- A bruxa pode conhecer muitas magias, mas equipa quatro por vez nos atalhos de L2, escolhidas na fogueira. Isso cria decisões de build.
- Dons das bruxas das fogueiras podem acelerar a regeneração de MP ou reduzir a pausa antes dela, abrindo um caminho de build defensivo.

## Tutorial

Todo o plot inicial funciona como tutorial. O primeiro chefe é o demônio que a bruxa persegue; ao derrotá-lo, a cidade se volta contra ela.

**Sequência proposta**, cada bloco ensinando um sistema:

1. **Entrada na cidade** — movimento, interação e leitura de itens. Aldeões desconfiados, mas neutros, comentam os ataques do demônio.
2. **Primeiros inimigos** — ataque, esquiva e stamina contra criaturas ligadas ao demônio, não contra humanos.
3. **Primeira magia** — encontrada num corpo ou baú, ensinando o sistema de magia antes de mostrar seu custo.
4. **Chefe: o demônio** — padrões bem telegrafados e uma fase que exige a magia recém-aprendida.
5. **A virada** — a cidade vê a bruxa sobre o corpo usando magia. A barra de Suspeita aparece já alta, e a fuga ensina a evitar combate.
6. **Primeira fogueira** — a primeira bruxa morta explica o descanso e aponta o caminho; ela foi queimada pela mesma cidade.

**Comunicar a virada sem cutscene:** sino da cidade tocando, um NPC gritando a acusação, portas se fechando e a trilha mudando de tom quando o demônio cai.

## Inimigos

Os inimigos são majoritariamente humanos que caçam a bruxa, e a variedade cresce com a Suspeita. Todos abaixo são propostas.

| Categoria | Exemplos | Papel |
| --- | --- | --- |
| Criaturas do demônio | Crias menores | Tutorial de combate antes da virada |
| Aldeões | Moradores com forcados e tochas | Inimigos comuns, janela de parry generosa |
| Guardas | Soldados da cidade | Patrulhas que crescem com a Suspeita |
| Caçadores especializados | Resistente a fogo, com cães farejadores, silenciador de feitiços | Contra-magia; surgem em Suspeita alta |
| Inquisidores | Purificadores de fogueiras | Elite; ameaçam os checkpoints |
| Chefes | O demônio, juiz, inquisidor-mor, padre da vila | Figuras de autoridade da perseguição |

Cada caçador especializado responde a uma escola de magia, para que a Suspeita aumente a variedade do combate e não só o dano.

## Questões em aberto

- [ ] A bruxa tem poderes sobrenaturais reais, ou é uma mulher acusada e o sobrenatural fica ambíguo?
- [ ] Qual é a relação da protagonista com as bruxas mortas: sobrevivente de um coven, filha de uma delas ou um vínculo descoberto ao longo do jogo?
- [ ] O demônio volta na história (vítima transformada, invocação de alguém da cidade) ou fecha seu papel no tutorial?
- [ ] Ambientação: Europa histórica, Portugal e Brasil colonial com a Inquisição, ou fantasia inspirada no período?
- [ ] Qual é a moeda de evolução e o que se perde ao morrer?
- [ ] Quantas faixas de Suspeita e o que exatamente muda em cada uma?
- [ ] Qual é o golpe crítico após quebrar a postura do inimigo?
- [ ] Nome definitivo do jogo.

## Histórico de versões

- **0.1.0** (2026-10-26): início do versionamento; marca o estado do GDD e do protótipo neste dia.
