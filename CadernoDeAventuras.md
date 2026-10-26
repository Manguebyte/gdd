# Caderno de Aventuras — GDD inicial

Oct 26, 2026 · @Abraão Alves Vila NOVA

## Visão geral

Caderno de Aventuras recria o RPG que a gente jogava no caderno da escola. Um colega era o "mestre": o personagem ia andando e o mestre ia desenhando o mapa com canetas coloridas. Itens, feitiços, moedas e os ícones de ataque e defesa eram desenhados com lápis de cor. Quando aparecia um monstro, o jogador escolhia se enfrentava, e a luta era decidida nos dados: cada item dava dados, e a soma era o dano.

"Caderno de Aventuras" é nome de trabalho.

**Pilares**

- **O mundo é desenhado enquanto você anda.** O jogador nunca vê um mapa pronto: cada quadrado aparece quando ele chega perto, traçado à mão pela caneta do mestre.
- **Todo poder é um punhado de dados.** Equipamento não dá "+3 de ataque": dá dados. A espada inicial dá 1d6; a melhor arma do jogo dá 5d20.
- **Tudo parece feito à mão.** Folha pautada, margem vermelha, caneta para o mapa e lápis de cor para pintar. Nenhum gráfico "limpo".
- **A escolha de brigar é do jogador.** Monstros desenhados no mapa não perseguem ninguém; enfrentar ou dar a volta é decisão de quem joga.

**Plataforma:** o protótipo é web (HTML/JS, sem build) e funciona em desktop e celular. **Em aberto:** engine e plataforma da versão final.

**Protótipo:** [`prototipos/caderno-de-aventuras/`](prototipos/caderno-de-aventuras/). Os números deste documento são os do protótipo e valem como **proposta** de balanceamento.

## Estética: caderno, caneta e lápis de cor

**Definido**

- A tela é uma folha de caderno: papel creme, pauta azul, margem vermelha e furos de espiral à esquerda. A pauta acompanha o mapa (cada quadrado do mapa ocupa duas linhas).
- **Caneta** (traço cheio) desenha o mapa e os contornos: costa azul, árvores verdes, montanhas marrons, casinhas com telhado vermelho.
- **Lápis de cor** (hachura translúcida, em zigue-zague) pinta: água, copa das árvores, corpo dos monstros, ícones, dados.
- Letra de mão em tudo: títulos em Caveat, textos em Patrick Hand.
- Nenhuma imagem pronta. Mapa, monstros, herói, ícones e dados são gerados por código como listas de traços tremidos, com semente fixa, então o mesmo lugar sai igual ao recarregar.
- O herói é um boneco-palito de capa vermelha e espada.
- O que já foi resolvido (monstro vencido, baú aberto, dragão derrotado) ganha um **X de caneta vermelha** por cima, como o mestre fazia.
- O caminho que o herói percorreu fica marcado com um tracejado de lápis.
- Som sintetizado, sem arquivos: rabisco de caneta enquanto o mestre desenha, dados chacoalhando, moedas, golpe.

## O mestre

O mestre não aparece, mas está em todo lugar:

- **A caneta do mestre** aparece na ponta do traço enquanto um quadrado novo é desenhado, com a cor da tinta que está usando.
- **Narração:** um balão "Mestre:" comenta o que acontece. Na primeira vez em cada terreno ("Floresta! O mestre rabisca um monte de arvorezinhas"), ao entrar numa região mais perigosa, ao chegar numa vila, ao bater na água ou na montanha.
- **Personagens no caminho** (bonecos-palito com balão de "?") dão dicas das regras e às vezes um presente.

## Mundo

**Definido**

- O mundo é uma ilha de 48 × 34 quadrados, gerada de uma semente no começo da aventura e salva com ela. O mar cerca tudo.
- Terrenos: água e montanha (bloqueiam), praia, campo, floresta e pântano (andáveis).
- **Revelação:** ao chegar num quadrado, o mestre desenha todos os quadrados num raio de ~2,6 ao redor que ainda estavam em branco, do mais perto para o mais longe, um após o outro.
- **Regiões de perigo 1 a 6** pela distância a pé desde a vila inicial. Cada região tem seu par de monstros.
- **3 vilas** com nome de material escolar: Vila Apontador (início), Aldeia Borracha (1/3 do caminho) e Cidade Régua (2/3). Cada uma vende coisas melhores que a anterior.
- **Covil do Dragão** no ponto alcançável mais distante da vila inicial, cercado por monstros da região 6.
- Pelo mapa: monstros desenhados (~7,5% dos quadrados livres), baús (~2%) e 11 personagens com dicas.

**Em aberto**

- Mapa feito à mão em vez de gerado (o mestre do caderno inventava na hora, mas tinha um roteiro).
- Barcos, pontes ou atalhos para atravessar água e montanha.
- Masmorras: entrar num lugar e o mestre "virar a página" para desenhar o interior.

## Movimento

- Um quadrado por vez, nas 4 direções: setas ou WASD, direcional na tela no celular, ou tocando/clicando num quadrado já desenhado (o herói vai sozinho pelo caminho mais curto entre os quadrados conhecidos).
- Andar até um monstro, um personagem ou o covil abre o encontro sem entrar no quadrado.
- Entrar numa vila abre a vila; entrar num baú abre o baú.
- **Encontros surpresa:** fora das vilas e de quadrados com algo desenhado, cada passo pode trazer um monstro do mato: 4% na praia, 5% no campo, 8,5% na floresta e 9,5% no pântano. Vem um monstro da região (25% de chance de ser da região anterior).
- O botão de mapa afasta a câmera para ver a ilha inteira já desenhada.

## Combate

O coração do jogo. A luta acontece numa folha por cima do mapa: o mestre desenha o monstro grande à esquerda, e a bandeja de dados fica à direita.

**Regra base (definido)**

- Cada item equipado dá dados. **Arma** dá os dados de ataque; **escudo** e **armadura** dão os dados de defesa.
- **Atacar:** o herói rola os dados da arma; o monstro rola os dados de defesa dele. Dano = ataque − defesa (mínimo 0, "bloqueou!").
- **Turno do monstro:** do mesmo jeito, ele rola os dados de ataque e o herói rola escudo + armadura.
- Os dados rolam na tela (números trocando, dado tremendo) e param um de cada vez; depois aparece a conta, por exemplo "12 − 3 = 9 de dano!".
- Cada tipo de dado tem a silhueta que se desenhava no caderno: d4 triângulo, d6 quadrado, d8 losango, d10 pipa, d12 pentágono, d20 hexágono com triângulo dentro.
- Golpes deixam riscos de caneta por cima do monstro; ao vencer, o mestre faz um X nele.

**Ações do turno**

| Ação | O que faz |
| --- | --- |
| Atacar | Dados da arma contra a defesa do monstro. Sem arma, 1d2. |
| Feitiço | Gasta Magia (PM). Dano de feitiço **ignora a defesa**; Cura recupera vida. |
| Poção | Rola os dados da poção e recupera vida ou magia. |
| Fugir | Rola 1d20: precisa de 8+ no primeiro turno, 11+ depois e 15+ contra o dragão. Falhou, o monstro ataca. |

- **Antes da luta:** contra um monstro desenhado, o jogador vê vida e dados dele e escolhe "Enfrentar" ou "Deixar pra lá" (sem rolagem). Num encontro surpresa, pode tentar fugir antes (d20 ≥ 8); se falhar, o monstro ataca primeiro.
- **Vitória:** rola os dados de moedas do monstro e ganha a experiência dele. Monstros desenhados vencidos ficam com X e não voltam.
- **Derrota (desmaio):** o herói acorda na última vila por onde passou, com vida e magia cheias e **metade do ouro**. Nada mais se perde.

**Em aberto**

- Efeitos de status (veneno da aranha, maldição da bruxa).
- Dados de crítico (tirar o máximo em todos os dados).
- Grupo de heróis (vários jogadores, como na sala de aula).

## Personagem e progressão

- Começa com 20 de vida, 3 de Magia, 15 moedas, Espada de madeira (1d6) e 2 Poções de vida.
- Experiência para o próximo nível: 10 × nível^1,5 (10, 28, 52, 80...). Cada nível dá +6 de vida máxima, +1 de Magia máxima e enche as duas.
- Ouro compra equipamento, magias, poções e pousada.

## Itens (proposta)

| Item | Tipo | Dados | Preço | Vila |
| --- | --- | --- | --- | --- |
| Espada de madeira | arma | 1d6 | 10 | Apontador |
| Espada curta | arma | 1d8 | 30 | Apontador |
| Espada de ferro | arma | 2d6 | 70 | Apontador |
| Machado de guerra | arma | 2d8 | 140 | Borracha |
| Espada de prata | arma | 3d8 | 260 | Borracha |
| Montante | arma | 3d12 | 480 | Régua |
| Espada rúnica | arma | 4d12 | 800 | Régua |
| Lâmina do Dragão | arma | 5d20 | 1200 | Régua |
| Tampa de panela | escudo | 1d4 | 12 | Apontador |
| Escudo de madeira | escudo | 1d6 | 40 | Apontador |
| Escudo de ferro | escudo | 2d6 | 160 | Borracha |
| Escudo de torre | escudo | 3d6 | 420 | Régua |
| Roupa de couro | armadura | 1d4 | 25 | Apontador |
| Cota de malha | armadura | 2d4 | 110 | Borracha |
| Armadura de placas | armadura | 2d8 | 380 | Borracha |
| Armadura de dragão | armadura | 3d10 | 950 | Régua |
| Poção de vida | poção | 3d6 de vida | 12 | todas |
| Poção de magia | poção | 2d4 de Magia | 15 | todas |

- Comprar um equipamento já o equipa; o anterior vai para a mochila. Na mochila dá para trocar o equipado e, numa vila, vender por metade do preço.
- Cada item tem ícone desenhado em lápis de cor, com a cor do material (madeira marrom, ferro grafite, prata azul-claro, rúnica roxa, dragão vermelha).

## Feitiços (proposta)

Comprados uma vez nas vilas, como pergaminhos, e ficam para sempre.

| Feitiço | Magia | Efeito | Preço | Vila |
| --- | --- | --- | --- | --- |
| Faísca | 1 | 2d4 de dano | 30 | Apontador |
| Cura | 2 | 2d6 de vida (também fora da luta) | 45 | Apontador |
| Bola de fogo | 3 | 3d8 de dano | 150 | Borracha |
| Raio | 5 | 4d10 de dano | 420 | Régua |

## Monstros (proposta)

| Região | Monstro | Vida | Ataque | Defesa | Moedas | XP |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Slime | 8 | 1d4 | — | 2d4 | 3 |
| 1 | Rato gigante | 6 | 1d6 | — | 2d4 | 3 |
| 2 | Goblin | 14 | 2d4 | — | 3d6 | 7 |
| 2 | Lobo | 16 | 1d10 | — | 3d6 | 7 |
| 3 | Esqueleto | 24 | 2d6 | 1d4 | 4d6 | 12 |
| 3 | Aranha gigante | 22 | 2d6 | 1d4 | 4d6 | 12 |
| 4 | Orc | 38 | 2d8 | 1d6 | 4d10 | 20 |
| 4 | Bruxa do pântano | 32 | 3d6 | — | 4d10 | 20 |
| 5 | Ogro | 62 | 3d8 | 2d4 | 6d10 | 35 |
| 5 | Cavaleiro negro | 56 | 3d10 | 2d6 | 6d10 | 35 |
| 6 | Troll | 92 | 4d8 | 2d6 | 8d10 | 60 |
| 6 | Golem de pedra | 110 | 3d12 | 3d6 | 8d10 | 60 |
| Chefe | Dragão Vermelho | 240 | 5d12 | 2d6 | 10d20 | — |

Vencer o Dragão Vermelho termina a aventura: o mestre escreve "FIM" e mostra passos, monstros vencidos, nível e ouro. Dá para continuar explorando ou começar outra ilha.

## Vilas

- **Pousada:** enche vida e Magia. Custa 3 / 9 / 15 moedas (Apontador / Borracha / Régua).
- **Ferreiro, magias e poções:** vendem o que a tabela de itens lista até a vila atual.
- Entrar numa vila marca ali o lugar onde o herói acorda se desmaiar.

## Baús

Ao abrir, rola-se 1d20 de sorte:

- 1–13: moedas, (região + 1)d8.
- 14–18: uma poção (vida ou magia).
- 19–20: um equipamento de uma vila à frente da região, que vai para a mochila (nunca a Lâmina do Dragão).

## Salvamento

Salvo no navegador a cada passo e após cada painel (`caderno-aventuras-save-v1`): semente da ilha, personagem, quadrados revelados, monstros vencidos, baús abertos, personagens visitados e o rastro. Ao continuar, o mapa revelado é redesenhado de uma vez a partir da semente.

## Em aberto (geral)

- Nome definitivo.
- Engine e plataforma da versão final (web, Unity, celular).
- Balanceamento de toda a curva (protótipo ainda não foi jogado do começo ao fim por uma pessoa).
- Multijogador local "da sala de aula": vários heróis, um passa o turno para o outro.
- Modo mestre: um jogador desenha/posiciona o mapa e os monstros para outro jogar.
- Missões dos personagens do caminho.
