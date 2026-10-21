# GDD — Iso Cards (título provisório)

Atualizado em 21/10/2026 · Abe

## Visão geral

RPG tático em pixel art 2D isométrico, com batalhas por turno em que cada ação de um personagem é uma carta do seu próprio baralho. Entre as batalhas, o grupo viaja por um mapa do mundo de 5 regiões, troca de classe, monta os baralhos e forja cartas novas com esferas e itens obtidos em combate.

| Item | Definição |
| --- | --- |
| Gênero | RPG tático por turnos + construção de baralho |
| Estilo visual | Pixel art 2D, grid isométrico com altura |
| Grupo | Até 6 personagens; 3 entram em cada batalha |
| Engine | Unity (a confirmar) |
| Plataforma | A definir |
| Protótipo | `prototipos/iso-cards/` (HTML/JS, arte PixelLab em `Sprites/IsoCards/`) |

Referências: Final Fantasy Tactics (mapas de blocos isométricos com altura, sprites chibi, mapa do mundo de nós, troca de classe), Final Fantasy IX (paleta quente de fantasia e charme dos personagens e cidades), Card Hunter (baralho por personagem com cartas de movimento em grid), Gloomhaven (cartas que combinam movimento e ação), Slay the Spire (construção de baralho), Magic: The Gathering (5 cores) e Final Fantasy X (esferas como recurso de progressão).

## Pilares de design

1. **Toda ação é uma carta.** Mover, atacar e lançar feitiços gastam cartas, então posicionar-se e agir disputam o mesmo recurso.
2. **O baralho é o personagem.** Cada personagem tem mão e baralho próprios; a classe define que cartas ele pode usar.
3. **O baralho do inimigo também é alvo.** Algumas classes roubam, copiam ou destroem cartas dos inimigos.
4. **Onde lutar é uma escolha.** Cada bioma dá esferas e itens diferentes, e isso define o que o jogador consegue forjar e em que classes consegue trocar.

## Loop de jogo

Mapa do mundo → Campo de batalha (grid isométrico, por turnos) → Recompensas (Ouro + esferas + itens) → Cidade (Forja, loja de esferas, Recrutamento, Troca de classe, Montagem de baralhos) → Mapa do mundo.

O jogador escolhe onde lutar pensando no que quer forjar e em que classe quer trocar; as cartas novas entram nos baralhos antes da próxima batalha.

**Definido:** o jogo grava ao entrar numa Cidade. Perder uma batalha é game over e volta ao último save.

## Combate

As batalhas acontecem num grid isométrico, por turnos. Cada personagem compra e joga cartas apenas do seu próprio baralho; não existe mão compartilhada.

- **Mão e compra:** proposta inicial de 5 cartas na mão no início e 2 compradas por turno (valores a calibrar em playtest).
- **Movimento:** só acontece por cartas de movimento. Um personagem sem carta de movimento na mão fica parado.
- **Morte de personagem:** o baralho dele sai da batalha. Derrubar o curandeiro inimigo elimina todas as curas daquele lado.
- **Inimigos com baralho:** os inimigos também jogam cartas, o que torna possível roubar, copiar e destruir cartas deles.
- **Ordem dos turnos:** em aberto (fase de grupo ou iniciativa individual). O protótipo usa fase de grupo. Ver Questões em aberto.

### Altura

**Definido:** no estilo de Final Fantasy Tactics, cada casa do grid tem uma altura (0 a 2 níveis no protótipo).

- Um passo de movimento não sobe mais de 1 nível; descer não tem limite.
- Ataque à distância feito de uma casa mais alta que o alvo ganha +1 de alcance.

## Baralhos e tipos de carta

Cada personagem tem um baralho fixo de **40 cartas**, montado na Cidade, na tela de **Montagem de baralhos**. Por enquanto não há regras de composição (mínimo de cartas de classe ou limite de cópias); a única regra é que toda carta do baralho seja permitida pela classe atual do personagem.

| Tipo | Função |
| --- | --- |
| Movimento | Desloca o personagem no grid |
| Ataque básico | Dano físico simples |
| Feitiço | Efeitos mágicos: controle, cura, buffs, debuffs |
| Ataque mágico | Dano mágico direto |

Quanto a quem pode usá-las, as cartas se dividem em três grupos:

- **Cartas de classe:** exclusivas de uma classe e responsáveis pela identidade dela.
- **Cartas de cor:** usadas por todas as classes daquela cor (ver Sistema de cores).
- **Cartas incolores (neutras):** qualquer personagem usa.

Com 40 cartas, numa batalha típica o personagem não deve ver o baralho inteiro, o que valoriza cópias das cartas-chave e cartas de comprar mais.

**Definido (tamanho do protótipo):** cerca de 45 cartas: 6 incolores, 4 por cor (20), 2 exclusivas por classe (14) e as 3 bicolores, que só se obtêm forjando.

## Custo das cartas: Vigor

Cada personagem tem uma quantidade fixa de **Vigor** por turno (proposta: 3), e cada carta custa Vigor para ser jogada. Não há cartas de recurso no baralho, o que evita turnos travados por azar na compra.

- **Movimento barato, magia cara:** movimento custa 1; ataques e feitiços custam de 1 a 3. Posicionar-se e agir disputam o mesmo Vigor.
- **Vigor não acumula:** o que sobra no fim do turno se perde.

### Dois efeitos por carta

Inspirado nas ações de agente e revelação de Dune: Imperium, toda carta tem dois efeitos:

- **Efeito de jogo:** pago com Vigor; é o uso principal da carta.
- **Efeito de descarte:** a carta é descartada da mão sem custo para gerar Vigor naquele turno. O padrão é +1, mas cartas específicas dão +2, +3 ou um efeito extra.

Regra de equilíbrio: quanto mais forte o efeito de jogo, mais fraco o efeito de descarte. Cartas fracas de jogar viram "baterias" valiosas.

| Carta | Custo | Efeito de jogo | Efeito de descarte |
| --- | --- | --- | --- |
| Passo Rápido | 1 | Move 2 casas | +1 Vigor |
| Golpe Pesado | 2 | Ataque corpo a corpo forte | +1 Vigor |
| Meditar | 1 | Compra 1 carta | +3 Vigor |
| Recuo Tático | 1 | Move 1 casa e ganha defesa | +1 Vigor e move 1 casa |
| Bola de Fogo | 3 | Dano mágico em área | Nenhum (não pode ser descartada por Vigor) |

O Ladrão também pode descartar cartas roubadas pelo efeito de descarte delas, transformando cartas do inimigo em Vigor.

## Sistema de cores

**Definido:** são 5 cores, uma por bioma, no mesmo esquema das terras de Magic. Cada classe tem uma cor, e cada carta tem uma cor (ou nenhuma). Um personagem pode usar cartas da cor da sua classe, cartas incolores e as cartas exclusivas da classe. Uma classe nova herda todo o pool da sua cor.

| Cor | Bioma | Classes | Estilo |
| --- | --- | --- | --- |
| Branco | Deserto | Guerreiro, Paladino | Corpo a corpo, defesa |
| Preto | Pântano | Mago | Feitiços, ataque mágico |
| Azul | Gelo | Arqueiro, Ladrão | Alcance, posicionamento, roubo |
| Verde | Floresta | Druida | Cura, raízes que prendem, terreno |
| Vermelho | Fogo | Berserker | Dano alto, gasta PV para ganhar Vigor |
| Incolor | — | Escudeiro (e todas) | Movimento básico, ataque básico, utilitários |

### Cartas bicolores e Ressonância

Uma carta bicolor pode ser usada por quem tem **qualquer uma** das duas cores. Quando quem a joga tem **as duas** cores, ela ativa a **Ressonância**, um efeito extra.

| Carta | Cores | Efeito | Ressonância |
| --- | --- | --- | --- |
| Lâmina Encantada | Branco/Preto | Ataque corpo a corpo com dano mágico | Aplica queimadura |
| Flecha Arcana | Azul/Preto | Ataque à distância que ignora cobertura | Atravessa e atinge um segundo alvo em linha |
| Escudo Vigilante | Branco/Azul | Defesa + contra-ataque à distância no próximo inimigo que se aproximar | Protege também um aliado adjacente |

Isso abre espaço para classes híbridas: Cavaleiro Arcano (Branco/Preto), Patrulheiro Místico (Azul/Preto) e Sentinela (Branco/Azul).

## Classes

As classes base são Guerreiro, Paladino, Mago, Arqueiro, Ladrão, Druida e Berserker. As híbridas da seção anterior ficam como expansão.

### Escudeiro e Troca de classe

Inspirado no sistema de jobs de Final Fantasy Tactics.

- **Escudeiro:** classe Incolor com que todo personagem chega; só usa cartas incolores. **Definido:** o jogo começa com 3 Escudeiros e 5 esferas pretas, o suficiente para uma primeira troca para Mago.
- **Recrutamento:** toda Cidade recruta personagens novos, que sempre chegam como Escudeiros, pagando Ouro. O grupo tem no máximo 6 personagens.
- **Troca de classe:** na Cidade, qualquer personagem pode virar qualquer classe base desde o começo do jogo, pagando esferas da cor da classe nova (proposta: 5 para uma classe base). Voltar a uma classe que o personagem já teve é grátis.
- **Baralho na troca:** as cartas que o personagem deixa de poder usar voltam para a coleção, e ele só sai da Cidade com um baralho válido de 40 cartas.

### Ladrão

O Ladrão rouba cartas dos inimigos. Uma carta roubada vira um recurso com duas saídas:

- **Copiar:** o Ladrão consome a carta roubada para copiar a habilidade de uma carta jogada naquela rodada.
- **Compartilhar:** o Ladrão passa a carta para outro personagem do grupo, que pode usá-la.

A escolha entre usar agora ou entregar a quem aproveita melhor é o centro da classe. Roubar cartas de cores que o grupo não tem também dá acesso a efeitos novos.

### Druida e Berserker

- **Druida (Verde):** cura aliados, prende inimigos com raízes e muda o terreno.
- **Berserker (Vermelho):** causa muito dano e pode pagar PV no lugar de Vigor, ficando mais perigoso quanto mais ferido estiver.

### Outras classes que interagem com baralhos

Ideias iniciais, ainda sem nome definitivo:

- **Sabotador:** destrói cartas do topo do baralho inimigo.
- **Ilusionista:** insere cartas inúteis no baralho do inimigo.

## Forja

O jogador forja cartas neutras e de classe combinando esferas e itens, na Forja de qualquer Cidade. As esferas definem a cor e o poder base da carta; os itens definem o efeito especial.

### Esferas

Inspiradas em Final Fantasy X. Ao fim de cada batalha, o jogador ganha esferas com cores ligadas ao bioma e aos monstros enfrentados. As esferas servem para forjar cartas e para pagar a Troca de classe.

- **Esferas de cor:** cada bioma tem uma cor e cada monstro dropa esferas da própria cor.
- **Esferas incolores:** caem em menor quantidade em qualquer batalha e forjam cartas neutras.
- **Esferas especiais:** vêm dos chefes dos Pontos de história e são exigidas por cartas poderosas.
- **Conversão:** proposta de 3 esferas de uma cor viram 1 de outra, para o jogador não travar por azar nos drops.
- **Loja:** toda Cidade vende esferas da cor do seu bioma (mais baratas), das cores dos biomas vizinhos na trilha e incolores, pagas com Ouro (ver Mapa do mundo).

Uma carta custa esferas da sua cor, em quantidade proporcional à raridade. Uma carta bicolor exige esferas das duas cores.

### Itens

Partes de monstros, minérios do mapa e relíquias de chefes. Cada monstro comum dropa 1 item próprio, então caçar um monstro específico pelo material vira objetivo de batalha.

| Esferas | Item | Resultado |
| --- | --- | --- |
| 4 pretas | Presa de Serpente | Raio Sombrio com veneno |
| 3 azuis | Pena de Grifo | Flecha com movimento extra após o disparo |
| 3 brancas + 3 pretas | Núcleo de Golem | Lâmina Encantada com armadura temporária |

### Receitas

O sistema mistura receitas aprendidas e descobertas.

- **Aprendidas:** o ferreiro de cada Cidade ensina 2 receitas da cor do bioma local.
- **Descobertas:** cada região esconde mais 2 receitas. O jogador testa combinações livremente, e as válidas entram no **Livro de Receitas**.
- **Pistas:** a descrição dos itens dá dicas parciais das receitas escondidas.
- **Combinação que falha:** gera uma carta incolor fraca.

**Definido (tamanho do protótipo):** 20 receitas, 10 aprendidas e 10 descobertas.

## Mapa do mundo

Inspirado em Final Fantasy Tactics: o mundo é um mapa fixo de nós ligados por trilhas, e o grupo anda de nó em nó até o destino escolhido.

**Definido:** o mundo tem 5 **regiões**, cada uma de um bioma, atravessadas nesta ordem: **Pântano → Floresta → Deserto → Gelo → Fogo**. Cada região tem 4 nós, num total de 20:

| Tipo de nó | Por região | O que oferece |
| --- | --- | --- |
| Cidade | 1 | Nó seguro e ponto de save: Forja, loja de esferas, ferreiro, Recrutamento, Troca de classe e Montagem de baralhos |
| Campo de batalha | 2 | Mapa de grid fixo e monstros do bioma; chegar nele inicia uma batalha |
| Ponto de história | 1 | Batalha contra o chefe da região; vencê-la abre a trilha para a próxima região |

- **Encontros:** **Definido:** a batalha acontece ao chegar num Campo de batalha; não há encontros aleatórios nas trilhas.
- **Farm:** o jogador pode lutar de novo em qualquer Campo de batalha já visitado, quantas vezes quiser, inclusive em regiões já vencidas.
- **Cor do campo:** define as esferas que a batalha rende.
- **Monstros por região:** 3 monstros comuns (cada um com baralho e item próprios) e 1 chefe, ou seja, 20 monstros no total.
- **Mapas:** 1 mapa de grid fixo por Campo de batalha e por Ponto de história, ou seja, 15 mapas.
- **Primeiro campo:** o Mangue Sombrio, o primeiro mapa feito no protótipo, é o primeiro Campo de batalha do Pântano.

### Loja de esferas por Cidade

Cada Cidade vende esferas da cor do seu bioma, mais baratas, e das cores dos biomas vizinhos na trilha, além de incolores.

| Cidade | Esferas à venda |
| --- | --- |
| Pântano | Preto, Verde, Incolor |
| Floresta | Verde, Preto, Branco, Incolor |
| Deserto | Branco, Verde, Azul, Incolor |
| Gelo | Azul, Branco, Vermelho, Incolor |
| Fogo | Vermelho, Azul, Incolor |

## Arte

**Definido:** pixel art gerada no PixelLab, em `Sprites/IsoCards/`.

- **De Final Fantasy Tactics vêm:** mapas de batalha de blocos isométricos com altura, sprites chibi de personagens e monstros, e o mapa do mundo com nós ligados por trilhas.
- **De Final Fantasy IX vêm:** a paleta quente de fantasia, as proporções e o charme dos personagens, e a aparência das cidades no mapa.
- **Sprites:** como no FFT, cada personagem e monstro tem 2 direções desenhadas (frente e costas), espelhadas para as outras 2, com animações de parado e ataque. O movimento entre casas é um deslize feito em código.
- **Processo:** uma cena-referência aprovada serve de `style_image` para todo o lote, e um teste de 3 assets é aprovado antes do lote completo.
- **Cartas:** **Definido:** cada carta é uma carta de verdade em pixel art, vertical, de 56×80, com ilustração de 48×48 e moldura na cor da carta (a bicolor divide a moldura entre as duas cores), gema com o custo em Vigor e o nome na placa. Na mão, as cartas ficam em leque; a carta em foco aparece ampliada com o texto completo e o efeito de descarte.
- **Interface:** **Definido:** toda informação fica dentro da tela do jogo (16:9), inclusive mapa, cidade, menus e cartas, sem elementos de interface fora dela. Os menus seguem as janelas azuis de Final Fantasy IX.

## Questões em aberto

- [ ] Ordem dos turnos: fase de grupo ou iniciativa individual?
- [ ] Ao copiar, o Ladrão pode replicar cartas de aliados, de inimigos ou de qualquer um? Como funciona o timing se a carta for jogada depois dele na rodada?
- [ ] Valor definitivo de Vigor por turno e custo de cada tipo de carta.
- [ ] Tamanho de mão e compra por turno definitivos.
- [ ] Custo definitivo da Troca de classe e do Recrutamento, e preços da loja de esferas.
- [ ] As esferas e itens também melhoram cartas existentes, ou só criam cartas novas?
- [ ] Nome do jogo, cenário e história.
- [ ] Plataforma alvo.
