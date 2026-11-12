# GDD — Bolsa de Heróis (nome de trabalho)

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

> Documento vivo. Rascunho inicial, a refinar com protótipo. Números marcados como "proposta" são pontos de partida para playtest, não decisões.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Unity](#parte-2--guia-de-implementação-unity)
3. [Parte 3 — Fase 0 (Setup do Projeto)](#parte-3--implementação-unity-fase-0-setup-do-projeto)
4. [Parte 4 — Fase 1 (Grid Isométrico e Unidades)](#parte-4--implementação-unity-fase-1-grid-isométrico-e-unidades)
5. [Parte 5 — Fase 2 (Fichas, Bag e Trilhas)](#parte-5--implementação-unity-fase-2-fichas-bag-e-trilhas)
6. [Parte 6 — Fase 3 (Livro de Habilidades e Efeitos)](#parte-6--implementação-unity-fase-3-livro-de-habilidades-e-efeitos)
7. [Parte 7 — Fase 4 (Mão, Reserva e Planejamento)](#parte-7--implementação-unity-fase-4-mão-reserva-e-planejamento)
8. [Parte 8 — Fase 5 (Rodada e Execução)](#parte-8--implementação-unity-fase-5-rodada-e-execução)
9. [Parte 9 — Fase 6 (Inimigos e Intenções)](#parte-9--implementação-unity-fase-6-inimigos-e-intenções)
10. [Parte 10 — Fase 7 (Run Roguelite e Save)](#parte-10--implementação-unity-fase-7-run-roguelite-e-save)
11. [Parte 11 — Fase 8 (Build e Próximos Passos)](#parte-11--implementação-unity-fase-8-build-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

| Item | Definição |
| --- | --- |
| Gênero | RPG tático por turnos + *bag building* (construção de bolsa), em estrutura roguelite de runs |
| Dimensão | 2D, pixel art em grid isométrico |
| Câmera | Isométrica fixa sobre o campo de batalha |
| Plataforma-alvo | PC: protótipo web e depois Unity para Steam |
| Input | Mouse (arrastar fichas, clicar em casas e botões) |
| Backend | Nenhum: offline, save local |
| Arte | Estilo e assets de `Sprites/IsoCards/` (PixelLab, estilo Final Fantasy Tactics, paleta FF9) |
| Protótipo | `prototipos/bolsa-de-herois/` (HTML/JS, arte de `Sprites/IsoCards/`) |

**Definido:** o jogador comanda um grupo fixo de três heróis, **Guerreiro**, **Mago** e **Arqueiro**. Cada herói tem a **sua própria bag de fichas**, o seu **livro de habilidades** e as suas duas **trilhas** (quantas fichas tira por rodada e quantas pode guardar entre rodadas). A mecânica central é emprestada do jogo de tabuleiro **Orléans**: a cada rodada cada herói tira fichas da sua bag, às cegas, e o jogador monta a estratégia colocando essas fichas nas páginas do livro; uma página completa vira uma ação no mapa.

**Pilar de design:** *você não escolhe o que sai da bag, escolhe o que fazer com isso.* Cada rodada é um pequeno quebra-cabeça montado com as fichas sorteadas, e ao longo da run o jogador molda a bag (e as trilhas) para que o sorteio trabalhe a seu favor.

**Fantasia central:** comandar um trio de aventureiros que se completa: o Guerreiro segura a linha de frente, o Arqueiro pune de longe e o Mago acumula energia por rodadas para soltar um feitiço devastador.

**Referências:**
- **Orléans** (Reiner Stockhausen): bag building, ficha volta para a bag no fim da rodada, trilhas que aumentam a compra, recrutar seguidores com ações, a peste (aqui, as fichas de Ferida e Medo) e prédios que dão ações novas (aqui, páginas novas do livro).
- **Slay the Spire**: estrutura de run com mapa de nós, recompensa "escolha 1 de 3" e intenções dos inimigos visíveis.
- **Into the Breach**: inimigos mostram o que vão fazer antes, e o jogador se posiciona em resposta.
- **Final Fantasy Tactics**: combate tático em grid isométrico.
- **Iso Cards** (`IsoCards.md`): só a arte e o estilo visual são reaproveitados; as regras são outras.

## 2. Pilares

1. **Sorte de entrada, habilidade de saída.** O sorteio decide o material; o jogador decide o plano. Nenhuma ação depende de sorte depois de montada (dano é fixo).
2. **A bag é o personagem.** O que um herói consegue fazer depende de quais fichas há na bag dele e em que proporção. Crescer a bag sem critério dilui o sorteio, como no Orléans.
3. **Simples todo turno, especial quando der.** Ataques simples custam 1 ficha e saem quase sempre; especiais pedem combinações de 3 a 5 fichas e muitas vezes exigem guardar fichas por mais de uma rodada.
4. **Posição importa.** O grid isométrico dá peso ao alcance do Arqueiro, à área do Mago e à linha de frente do Guerreiro.

## 3. Loop de Jogo

```
Início da run (3 heróis com bag, livro e trilhas iniciais)
  └─▶ Mapa de nós ──▶ escolhe um nó
         ├─ Combate / Elite / Chefe ──▶ combate tático ──▶ recompensa (1 de 3) + XP + ouro
         ├─ Acampamento ──▶ descansar, tratar Feridas ou treinar (tirar ficha da bag)
         └─ Mercador ──▶ comprar fichas, páginas, tratamento
  └─▶ ... até o Chefe ──▶ vitória da run
Todos os heróis caídos num combate ──▶ fim da run (tudo zera)
```

## 4. Heróis

**Definido:** três heróis jogáveis, todos no grupo desde o início: Guerreiro, Mago e Arqueiro. Cada um tem bag, livro e trilhas próprios; fichas de um herói nunca vão para outro.

Valores iniciais (proposta):

| Herói | PV | Bag inicial (8 fichas) | Papel |
| --- | --- | --- | --- |
| Guerreiro | 24 | Força ×4, Agilidade ×2, Foco ×2 | Linha de frente: dano corpo a corpo, escudos, área ao redor de si |
| Arqueiro | 18 | Agilidade ×4, Foco ×2, Força ×2 | Dano à distância, mobilidade |
| Mago | 16 | Mana ×4, Foco ×2, Agilidade ×2 | Área à distância, escudo arcano, feitiços caros que precisam de Reserva |

## 5. Fichas

**Definido:** as fichas são de atributos, mais duas fichas ruins que os inimigos colocam na bag (o papel da peste do Orléans).

| Ficha | Cor | Uso |
| --- | --- | --- |
| **Força** | Vermelha | Golpes corpo a corpo, escudos físicos |
| **Agilidade** | Verde | Tiros, movimento rápido, esquiva |
| **Mana** | Azul | Feitiços |
| **Foco** | Amarela | Precisão; quase todo especial pede pelo menos 1 Foco, e as páginas de recrutar também |
| **Ferida** | Cinza | Ruim. Não encaixa em nenhuma página nem na Reserva: só ocupa espaço no sorteio. Fica na bag pela run toda até ser tratada |
| **Medo** | Roxa | Ruim. Não encaixa em nada; enquanto houver Medo na mão do herói, ele não pode usar páginas **Especiais** naquela rodada. Some no fim do combate |

- **Definido:** algumas páginas pedem "**Qualquer**": aceita qualquer ficha boa (Força, Agilidade, Mana ou Foco), nunca Ferida ou Medo.
- Origem das fichas ruins (proposta):
  - **Ferida:** alguns ataques inimigos colocam 1 Ferida na bag do herói atingido; um herói que cai num combate volta com 2 Feridas.
  - **Medo:** alguns inimigos têm um grito/uivo que coloca Medo na bag dos heróis próximos, só durante aquele combate.
- **Em aberto:** se existem fichas raras/de classe além das quatro (ex.: uma ficha "Fúria" só do Guerreiro).

## 6. A Bag

**Definido:** uma bag por herói. Regras (proposta, no espírito do Orléans):

1. **Duas bags por herói, na prática.** A *bag da run* é o conteúdo permanente (o que entra e sai entre combates). No início de cada combate o jogo faz uma *cópia de combate*, de onde as fichas são sorteadas.
2. **Sorteio sem reposição.** No início de cada rodada o herói tira **N fichas** da bag de combate, onde N vem da Trilha de Fôlego. Se a bag tiver menos que N, ele tira o que houver.
3. **Tudo volta no fim da rodada.** Fichas usadas em páginas, fichas largadas em páginas incompletas e fichas soltas na mão voltam para a bag no fim da rodada. A única exceção são as fichas guardadas na **Reserva** (seção 8.2).
4. **A bag cresce e é podada.** Fichas novas entram:
   - **durante o combate**, por páginas de **Recrutar** (como recrutar seguidores no Orléans). A ficha recrutada vai para a bag de combate (pode sair já na rodada seguinte) e para a bag da run (fica pelo resto da run);
   - **entre combates**, como recompensa (escolher 1 entre 3) e no Mercador.

   Fichas saem no Acampamento (treinar) e no Mercador. Podar importa: uma bag grande com muitas fichas fracas sorteia pior.
5. O jogador sempre pode ver a composição da bag de cada herói (quantas de cada tipo), mas não a ordem.

## 7. Livro de Habilidades

**Definido:** cada herói tem o seu livro de habilidades; cada página é uma ação com **casas de fichas** (slots) que pedem tipos específicos. Uma página só pode ser usada quando todas as suas casas estão preenchidas; ao usar, as fichas da página são gastas (voltam para a bag só no fim da rodada).

Tipos de página:

| Tipo | Custo típico | Exemplo |
| --- | --- | --- |
| **Simples** (ataque simples) | 1 ficha | Golpe, Flecha, Faísca |
| **Especial** (ataque especial) | 3 a 5 fichas, combinação de tipos | Redemoinho, Tiro Certeiro, Meteoro |
| **Movimento** | 1 a 2 fichas | Passo, Corrida |
| **Suporte** | 2 fichas | Escudo, Barreira Arcana, Atadura |
| **Recrutar** | 2 fichas | Treino (+1 Força na bag) |

- Cada página pode ser usada **1 vez por rodada** (proposta; uma página pode ter um limite maior, ex.: Passo 2 vezes).
- O livro tem no máximo **8 páginas** (proposta). Páginas novas vêm de recompensas e do Mercador; com o livro cheio, a página nova substitui uma antiga.
- **Em aberto:** se páginas podem ser melhoradas (ex.: Flecha II com mais dano), e se existem páginas que combinam heróis (ex.: o Mago encanta a flecha do Arqueiro).

### 7.1 Livros iniciais (proposta)

Todo herói começa com **Passo**: [Qualquer] → anda até 2 casas.

**Guerreiro**

| Página | Tipo | Casas | Efeito |
| --- | --- | --- | --- |
| Passo | Movimento | Qualquer | Anda até 2 casas |
| Golpe | Simples | Força | 3 de dano num inimigo adjacente |
| Erguer Escudo | Suporte | Força, Foco | 5 de escudo em si ou num aliado adjacente |
| Redemoinho | Especial | Força, Força, Agilidade, Foco | 4 de dano em todos os inimigos adjacentes a ele |
| Treino | Recrutar | Foco, Qualquer | +1 Força na bag |

**Arqueiro**

| Página | Tipo | Casas | Efeito |
| --- | --- | --- | --- |
| Passo | Movimento | Qualquer | Anda até 2 casas |
| Flecha | Simples | Agilidade | 2 de dano, alcance 5 |
| Corrida | Movimento | Agilidade, Agilidade | Anda até 4 casas |
| Tiro Certeiro | Especial | Agilidade, Agilidade, Foco, Foco | 8 de dano, alcance 7 |
| Caçada | Recrutar | Foco, Qualquer | +1 Agilidade na bag |

**Mago**

| Página | Tipo | Casas | Efeito |
| --- | --- | --- | --- |
| Passo | Movimento | Qualquer | Anda até 2 casas |
| Faísca | Simples | Mana | 2 de dano, alcance 4 |
| Barreira Arcana | Suporte | Mana, Foco | 4 de escudo num aliado a até 3 casas |
| Bola de Fogo | Especial | Mana, Mana, Foco | 3 de dano numa área de raio 1, alcance 4 |
| Estudo | Recrutar | Foco, Qualquer | +1 Mana na bag |

### 7.2 Páginas de recompensa (proposta, lista inicial)

| Página | Herói | Casas | Efeito |
| --- | --- | --- | --- |
| Meteoro | Mago | Mana ×3, Foco ×2 | 7 de dano em área de raio 1, alcance 5. Com 5 casas, normalmente exige guardar fichas na Reserva |
| Investida | Guerreiro | Força, Agilidade, Agilidade | Anda até 3 casas e dá 4 de dano nos inimigos adjacentes ao destino (**Em aberto:** só um alvo) |
| Chuva de Flechas | Arqueiro | Agilidade ×3, Foco | 2 de dano em área de raio 1, alcance 6 |
| Atadura | Qualquer herói | Foco, Qualquer | Tira 1 Ferida da bag de um aliado adjacente (ou de si) |
| Grito de Guerra | Guerreiro | Força, Foco | Tira todo Medo da mão e da bag de combate dos aliados a até 3 casas |

## 8. Trilhas

**Definido:** cada herói tem duas trilhas, como as do Orléans.

### 8.1 Trilha de Fôlego (fichas por rodada)

| Nível | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| Fichas tiradas por rodada | 4 | 5 | 6 | 7 | 8 | 9 |

(proposta; todos começam no nível 0)

### 8.2 Trilha de Reserva (fichas guardadas entre rodadas)

| Nível | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| Casas da Reserva | 1 | 2 | 3 | 4 | 5 |

(proposta; todos começam no nível 0, com 1 casa)

- Durante o planejamento o jogador arrasta fichas boas para a Reserva do herói. No fim da rodada, as fichas da Reserva **não voltam para a bag**: no início da rodada seguinte entram na mão, **além** das N fichas tiradas.
- Ferida e Medo não podem ser guardadas.
- É a Reserva que torna possível o Meteoro (5 casas) com Fôlego baixo: guarda Mana nesta rodada, completa na próxima.

### 8.3 Como as trilhas sobem

- **Proposta:** com **XP** ganha nos combates. A cada nível de grupo o jogador escolhe 1 herói e sobe 1 casa numa das trilhas dele.
- **Em aberto:** a alternativa mais fiel ao Orléans, em que recrutar um tipo de ficha também avança uma trilha ligada a ele (ex.: recrutar Foco sobe o Fôlego). Decidir no playtest se as trilhas devem subir também dentro do combate.

## 9. Rodada de Combate

**Definido:** o combate é por rodadas; numa rodada os três heróis agem (na ordem que o jogador quiser) e depois os inimigos agem.

1. **Intenções.** Cada inimigo mostra sobre a cabeça o que vai fazer no turno dele (ex.: "ATQ 4 > Mago", "UIVO").
2. **Sorteio.** Cada herói de pé tira N fichas da sua bag (Trilha de Fôlego); as fichas da Reserva voltam para a mão.
3. **Planejar e agir.** O jogador arrasta fichas da mão de cada herói para as casas das páginas do livro dele, ou para a Reserva. Pode tirar fichas de volta enquanto a página não foi usada. Quando uma página está completa, o botão **Usar** acende: o jogador escolhe o alvo no mapa e a ação acontece na hora. Pode alternar entre heróis à vontade (ex.: o Guerreiro avança, o Mago solta a Bola de Fogo, o Guerreiro ataca).
4. **Fim do turno.** O jogador aperta **Encerrar turno**. Fichas soltas na mão e em páginas incompletas ficam onde estão até a limpeza.
5. **Turno dos inimigos.** Cada inimigo cumpre a intenção mostrada.
6. **Limpeza.** Todas as fichas voltam para a bag do herói, menos as da Reserva. Escudos acabam (proposta: o escudo dura até o fim do turno inimigo).

- **Em aberto:** se o planejamento deve ser "às cegas" como no Orléans (montar tudo e só então revelar/executar) em vez de "monta e usa" como acima. A versão acima é a proposta para o MVP por ser mais legível com três heróis.

## 10. Combate Tático em Grid

**Definido:** combate em grid isométrico; heróis e monstros andam pelo grid, e mover é uma ação do livro que gasta fichas.

Regras (proposta):

- Grid de **10 × 8** casas, com obstáculos (pedras, árvores) que bloqueiam passagem.
- Movimento em 4 direções (sem diagonal); não atravessa unidades nem obstáculos.
- **Alcance e área usam distância de Manhattan** (casas em 4 direções). "Raio 1" = a casa-alvo e as 4 vizinhas.
- Sem linha de visão no MVP (obstáculo não bloqueia tiro). **Em aberto:** cobertura e altura de terreno (o Iso Cards tem altura; aqui o MVP é plano).
- Dano é fixo, sem acerto/erro.
- **Escudo** absorve dano antes dos PV.
- **Herói caído** (0 PV) sai do mapa até o fim do combate. Se o grupo vencer, ele volta com 1 PV e 2 Feridas na bag. Se os três caírem, a run acaba.
- Heróis começam nas duas colunas da esquerda, inimigos nas duas da direita.

## 11. Inimigos e Intenções

**Definido:** inimigos agem depois dos heróis, cumprindo uma intenção que fica visível desde o início da rodada.

- **Proposta:** inimigos não têm bag no MVP; seguem regras simples: perseguem o herói-alvo da intenção, andam até `movimento` casas e atacam se ficarem no alcance. Se o alvo fugiu para longe, o ataque não acontece; se o alvo já caiu, o inimigo vai atrás do herói mais perto. Esse é o contra-jogo central: se mover, erguer escudo, matar antes.
- **Em aberto:** chefes com bag e livro próprios, jogando pelas mesmas regras dos heróis.

Inimigos do bioma Floresta para o MVP (proposta; sprites de `Sprites/IsoCards/personagens/`):

| Inimigo | PV | Movimento | Alcance | Dano | Especial |
| --- | --- | --- | --- | --- | --- |
| Lobo (`lobo`) | 8 | 4 | 1 | 3 | A cada 3 rodadas uiva no lugar de atacar: +1 Medo na bag dos heróis a até 3 casas |
| Javali (`javali`) | 12 | 3 | 1 | 4 | Acerto coloca 1 Ferida |
| Bandido (`bandido`) | 10 | 3 | 4 | 2 | Ataca de longe (facas) |
| Lodo (`lodo`) | 14 | 2 | 1 | 2 | Acerto coloca 1 Ferida |
| Chefe: Grifo (`grifo`) | 40 | 5 | 1 | 6 | Acerto coloca 1 Ferida; a cada 3 rodadas grita (+1 Medo em todos a até 3 casas) |

## 12. Run Roguelite

**Definido:** estrutura de roguelite em runs; a bag cresce durante a run e tudo zera quando a run acaba.

Mapa da run (proposta):

- Um bioma por run no MVP (Floresta), com **7 camadas** de nós: a última é o Chefe e a penúltima é sempre um Acampamento. As outras têm 2 ou 3 nós, ligados aos da camada seguinte; o jogador escolhe o caminho.
- Tipos de nó:

| Nó | O que acontece |
| --- | --- |
| Combate | Encontro comum. Recompensa: 1 de 3 + 4 XP + 10 ouro |
| Elite | Encontro difícil (a partir da 4ª camada). Recompensa: 1 de 3 + 7 XP + 20 ouro |
| Acampamento | Escolher 1: **Descansar** (cada herói recupera 30% dos PV), **Tratar** (tira até 2 Feridas de um herói) ou **Treinar** (tira 1 ficha qualquer da bag de um herói) |
| Mercador | Comprar ficha (15 ouro), página (40 ouro) ou tratamento de 1 Ferida (20 ouro) |
| Chefe | Último nó. Vencer termina a run com vitória |

- **Recompensa "1 de 3":** sorteia três opções entre: uma ficha nova para um herói (tipo puxado para a classe dele), uma página nova para um herói, ou ouro.
- **XP e níveis:** o grupo divide uma barra de XP; a cada 10 XP (proposta) o jogador sobe 1 casa numa trilha de 1 herói (ver 8.3).
- **Os PV não se recuperam sozinhos** entre combates; só no Acampamento, no Mercador (**Em aberto**) e por páginas de cura (**Em aberto**: o MVP não tem cura de PV no livro).
- **Em aberto:** progressão permanente entre runs (heróis/páginas desbloqueáveis, outros biomas). O Iso Cards já tem arte de 5 biomas (Floresta, Deserto, Gelo, Pântano, Fogo), o que dá espaço para runs de 3 biomas no futuro.

## 13. Estilo Visual

**Definido:** o jogo usa o estilo e os assets que já existem em `Sprites/IsoCards/` (pixel art PixelLab, estilo Final Fantasy Tactics, paleta Final Fantasy IX):

- Heróis: `Sprites/IsoCards/personagens/guerreiro/`, `mago/`, `arqueiro/`. Cada pasta tem `parado-ne.png`, `parado-se.png`, `ataque-ne.png`, `ataque-se.png` (folhas horizontais de 6 quadros de 48×48) e as poses `ne.png`/`se.png`. As direções noroeste/sudoeste saem espelhando.
- Monstros: as outras pastas de `personagens/` (`lobo`, `javali`, `bandido`, `lodo`, `grifo`...).
- Chão: `Sprites/IsoCards/tiles/<bioma>/tile_0..15.png` (blocos isométricos de 48×36: losango de 48×24 em cima e 12 px de lateral).
- Cenário: `Sprites/IsoCards/cenario/<bioma>/` (`arvore.png`, `pedra.png`, `deco.png`).
- **Ainda não existe arte para:** as fichas (6 tipos), o livro e as páginas, ícones de intenção, a moldura da Reserva e o mapa da run. Gerar no PixelLab com um sprite do Iso Cards como referência de estilo.

## 14. HUD / UI

Sempre visível no combate:

- **Mapa** (centro): grid, unidades, barras de PV/escudo, intenções dos inimigos.
- **Abas dos heróis** (embaixo à esquerda): retrato, PV, Fôlego e Reserva; clicar seleciona o herói.
- **Livro do herói selecionado** (embaixo): a mão (fichas tiradas), a Reserva (casas vazias e cheias) e as páginas, cada uma com suas casas e o botão Usar.
- **Composição da bag** do herói selecionado (quantas fichas de cada tipo ainda estão na bag).
- **Botão Encerrar turno** e um **log** curto das últimas ações.

**Em aberto:** layout final; se o livro é uma página de cada vez (folhear) ou uma lista.

## 15. Áudio

**Em aberto.**

## 16. Backend / Serviços

**Definido:** offline, sem Firebase. A run em andamento é salva localmente entre nós do mapa (sair no meio de um combate recomeça aquele combate).

## 17. Escopo do MVP

**MVP:**
- Três heróis com os livros iniciais da seção 7.1 e as 5 páginas de recompensa da 7.2.
- Fichas, bag por herói, Trilha de Fôlego e Trilha de Reserva.
- Combate tático em grid 10×8 com obstáculos, intenções e os 5 inimigos da Floresta.
- Run de 1 bioma (Floresta), mapa de 7 camadas, Combate/Elite/Acampamento/Mercador/Chefe.
- Recompensas, XP e níveis de trilha.
- Save local da run.

**Depois do MVP:**
- Mais biomas (os outros 4 do Iso Cards) e runs de vários biomas.
- Progressão permanente entre runs.
- Animações completas (andar, ataque, morte), efeitos e som.
- Chefes com bag própria.
- Steam (conquistas, nuvem).

## 18. Em aberto (resumo)

- Nome do jogo ("Bolsa de Heróis" é nome de trabalho).
- Fichas raras/de classe além das quatro (seção 5).
- Páginas melhoráveis e páginas que combinam heróis (seção 7).
- Investida com alvo único ou em área (seção 7.2).
- Trilhas subindo também dentro do combate, ao recrutar (seção 8.3).
- Planejamento "às cegas" como no Orléans vs. "monta e usa" (seção 9).
- Linha de visão, cobertura e altura de terreno (seção 10).
- Chefes com bag (seção 11).
- Cura de PV fora do Acampamento (seção 12).
- Progressão permanente e runs com mais biomas (seção 12).
- Layout final do HUD (seção 14).
- Áudio (seção 15).
- Todos os números marcados como "proposta".

## Histórico de versões

- **0.1.0** (2026-11-12): primeiro rascunho do GDD (bag por herói no estilo Orléans, trilhas de Fôlego e Reserva, combate tático em grid, run roguelite), guia Unity do MVP e protótipo web com o loop inteiro (`prototipos/bolsa-de-herois/`).

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para implementar o MVP da Bolsa de Heróis em Unity 6. Os números da Parte 1 marcados como "proposta" ficam em assets (`GameConfig`, páginas, heróis, inimigos), para balancear sem mexer no código.

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele. Conceitos de Unity são explicados no comentário da primeira vez que aparecem.
- **Namespaces** (troque `Bolsa` pelo nome do jogo quando ele for decidido):
  - `Bolsa.Core`: regras em C# puro (grid, unidades, bag, mão, contexto do combate). Não usa `MonoBehaviour`.
  - `Bolsa.Data`: `ScriptableObject`s (fichas, páginas, efeitos, heróis, inimigos, configuração).
  - `Bolsa.View`: o que aparece no mapa (grid, unidades, clique no mapa).
  - `Bolsa.UI`: livro, fichas arrastáveis, painéis.
  - `Bolsa.Battle`: o `BattleController`, que liga regras, mapa e UI.
  - `Bolsa.Meta`: mapa da run, recompensas, acampamento, mercador e save.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Textos na tela sem emoji**, porque a fonte padrão do TextMeshPro não tem emojis.

## Arquitetura em uma página

```
 Mouse                         BattleController (fases da rodada)                  Tela
 ─────                         ───────────────────────────────────                 ────
 CellPicker ──Clicked──▶  escolhe alvo ──▶ PageDef.effects[].Apply(ctx) ──▶ BattleContext ──eventos──▶ UnitView (andar, dano)
 HeroBookPanel ──Use──▶   valida (TargetRules)                                (grid + unidades)      GridView (destaque)
   ▲  TokenChip/DropZone ──▶ CombatHand (mão, páginas, Reserva, bag de combate)
   └──────────────── Changed ◀──────────────┘
                         EnemyAI (planeja intenção, persegue, ataca) ──▶ BattleContext
 RunSession (entre cenas) ── RunState (heróis, bag da run, trilhas, mapa) ── SaveSystem (JSON local)
```

- **Regra de ouro:** as regras moram em C# puro (`BattleContext`, `CombatHand`, `Bag`). A tela só escuta eventos e redesenha. Assim dá para testar uma regra sem abrir a cena e trocar a arte sem mexer na regra.
- **Bag da run vs. bag de combate:** `HeroRunState.bag` é a lista permanente; `CombatHand.Bag` é a cópia que se esvazia e enche durante o combate (Parte 1 §6).

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, organizado, com os pacotes certos e os sprites do Iso Cards importados.

### 0.1 Criar o projeto

1. Instale o **Unity Hub** e uma versão **Unity 6 LTS** (6000.x). Marque os módulos **Windows Build Support (IL2CPP)** e **Web Build Support**: o alvo é PC (Steam) e o teste é web (Parte 1 §1).
2. No Hub, crie um projeto com **New project → Universal 2D** e o nome `BolsaDeHerois`.
   - É aqui que a dimensão 2D da Parte 1 vira decisão técnica: o template 2D já vem com URP 2D, sprites e câmera ortográfica.
   - **Isométrico não muda o template.** A grade isométrica vem do componente `Grid` com **Cell Layout = Isometric** (Fase 1); os sprites já são desenhados em perspectiva.
   - **Física não é usada.** Ninguém cai nem colide por física: andar é seguir um caminho calculado no grid (BFS), e o clique no mapa é convertido em casa pela própria `Grid`. Por isso o guia não usa `Rigidbody2D` nem `Collider2D`.

### 0.2 Estrutura de pastas

Crie dentro de `Assets/`:

```
Assets/_Project/
  Scripts/
    Core/      (regras em C# puro)
    Data/      (ScriptableObjects)
    View/      (grid e unidades na tela)
    UI/        (livro, fichas, painéis)
    Battle/    (BattleController)
    Meta/      (mapa da run, save)
  Resources/   (GameConfig e GameDatabase, Fases 2 e 7)
  Data/
    Pages/
    Effects/
    Heroes/
    Enemies/
    Encounters/
  Prefabs/
    UI/
  Scenes/      (Battle, Run)
  Sprites/
    Heroes/  Enemies/  Tiles/  Scenery/  Tokens/
```

### 0.3 Pacotes (Window → Package Manager)

| Pacote | Para quê |
|---|---|
| **2D Tilemap Editor** (vem com o template 2D) | Desenhar o chão isométrico com `Tilemap` e criar `Tile`s a partir dos sprites. |
| **Input System** (já vem no Unity 6) | Ler o mouse (`Mouse.current`). |
| **TextMeshPro** (parte do pacote uGUI no Unity 6) | Textos da UI e dos PV sobre as unidades. No primeiro uso, aceite **Import TMP Essentials**. |
| **2D Sprite** (vem com o template 2D) | Fatiar as folhas de animação no Sprite Editor. |

### 0.4 Importar a arte do Iso Cards

1. Copie para `Assets/_Project/Sprites/`:
   - `Sprites/IsoCards/personagens/guerreiro`, `mago`, `arqueiro` → `Heroes/`
   - `Sprites/IsoCards/personagens/lobo`, `javali`, `bandido`, `lodo`, `grifo` → `Enemies/`
   - `Sprites/IsoCards/tiles/floresta` → `Tiles/floresta/`
   - `Sprites/IsoCards/cenario/floresta` → `Scenery/floresta/`
2. Selecione **todos** os PNGs copiados e, no Inspector:
   - **Texture Type:** Sprite (2D and UI)
   - **Pixels Per Unit:** `48` (um tile de 48 px de largura = 1 unidade do mundo)
   - **Filter Mode:** Point (no filter), para o pixel art não borrar
   - **Compression:** None
3. **Folhas de animação** (`parado-se.png`, `ataque-se.png`...): **Sprite Mode = Multiple** → **Sprite Editor → Slice → Grid By Cell Size 48×48**, **Pivot = Bottom** (os pés no chão).
4. **Tiles** (`tile_0..15.png`, 48×36): **Sprite Mode = Single**, **Pivot = Custom (0.5, 0.667)**. O losango de cima tem 24 px de altura; o centro dele fica a 24 px da base da imagem, e 24/36 = 0,667. Assim o centro do losango cai no centro da casa.

### 0.5 Cena e ordenação de sprites

1. Crie as cenas `Battle` e `Run` em `Assets/_Project/Scenes/` e adicione as duas em **File → Build Profiles → Scene List** (`Run` primeiro).
2. **Sorting Layers** (Edit → Project Settings → Tags and Layers → Sorting Layers), nesta ordem: `Floor`, `Highlight`, `Units`.
3. **Ordenar por altura na tela** é o truque clássico do isométrico: o que está mais embaixo na tela fica na frente.
   1. Abra o asset **Renderer 2D Data** do projeto (em `Assets/Settings/`).
   2. Em **Transparency Sort Mode**, escolha **Custom Axis** com **Transparency Sort Axis = (0, 1, 0)**.
4. **Active Input Handling** (Edit → Project Settings → Player → Other Settings): **Input System Package (New)** ou **Both**.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- As cenas `Run` e `Battle` aparecem na Scene List.
- Um sprite de herói arrastado para a cena aparece nítido (sem borrão) e com o tamanho de cerca de 1 unidade de largura.
- As 3 Sorting Layers existem na ordem certa.

#### Problemas comuns
- **Sprite borrado:** Filter Mode ficou em Bilinear. Volte para Point e confira que Compression está em None.
- **Não acho o Transparency Sort Mode:** ele fica no asset **Renderer 2D Data**, não na câmera. Busque `t:Renderer2DData` no Project.

Próxima fase: **Grid Isométrico e Unidades**.

---

# Parte 4 — Implementação Unity: Fase 1 (Grid Isométrico e Unidades)

## Fase 1 — Grid Isométrico e Unidades

> Objetivo desta fase: um campo de 10×8 casas no chão isométrico, unidades paradas nele e um clique que move uma unidade pelo menor caminho.

### 1.1 Unidade (regra pura)

```csharp
// Assets/_Project/Scripts/Core/Unit.cs
using UnityEngine;

namespace Bolsa.Core
{
    // Lado de cada unidade no combate.
    public enum Team { Heroes, Enemies }

    // POR QUE: o combate precisa saber, para cada herói ou monstro, onde ele está,
    // quanto de vida e de escudo tem e de que lado luta. Isso é regra, não desenho,
    // então fica numa classe C# comum (sem MonoBehaviour), fácil de testar.
    // ESTRATÉGIA: só dados e duas operações (tomar dano, curar). Heróis e inimigos
    // estendem esta classe (HeroUnit na Fase 4, EnemyUnit na Fase 6). Quem desenha a
    // unidade é o UnitView, que só lê estes campos.
    public class Unit
    {
        public string Name;
        public Team Team;
        public Vector2Int Cell;   // casa no grid (x = coluna, y = linha)
        public int MaxHp;
        public int Hp;
        public int Shield;

        public bool Alive => Hp > 0;

        // Construtor: cria a unidade já com vida atual (um herói pode entrar ferido).
        public Unit(string name, Team team, int maxHp, int hp)
        {
            Name = name;
            Team = team;
            MaxHp = maxHp;
            Hp = Mathf.Clamp(hp, 0, maxHp);
        }

        // Aplica dano: o escudo absorve primeiro. Devolve quanto chegou de fato aos PV,
        // para o jogo saber se o golpe "acertou" (ex.: Ferida só entra se feriu).
        public int TakeDamage(int amount)
        {
            int absorbed = Mathf.Min(Shield, amount);
            Shield -= absorbed;
            int real = Mathf.Min(Hp, amount - absorbed);
            Hp -= real;
            return real;
        }

        // Cura sem passar do máximo.
        public void Heal(int amount) => Hp = Mathf.Min(MaxHp, Hp + amount);
    }
}
```

### 1.2 O grid (regra pura)

```csharp
// Assets/_Project/Scripts/Core/BattleGrid.cs
using System.Collections.Generic;
using UnityEngine;

namespace Bolsa.Core
{
    // POR QUE: o combate é tático (Parte 1 §10): andar, alcance e área dependem de
    // casas. O Tilemap da Unity só sabe desenhar casas; quem está em cada casa, o que
    // bloqueia e qual o menor caminho é regra do jogo, então mora aqui.
    // ESTRATÉGIA: um retângulo Width × Height de casas. Obstáculos num bool[,];
    // unidades num dicionário casa → unidade. Caminhos por BFS (busca em largura):
    // como todo passo custa 1, o BFS já acha o menor caminho, sem precisar de A*.
    // Distância e área usam Manhattan (4 direções, sem diagonal).
    public class BattleGrid
    {
        public readonly int Width;
        public readonly int Height;

        readonly bool[,] _blocked;
        readonly Dictionary<Vector2Int, Unit> _occupants = new();

        static readonly Vector2Int[] Dirs =
            { Vector2Int.up, Vector2Int.right, Vector2Int.down, Vector2Int.left };

        // Cria um grid vazio, sem obstáculos.
        public BattleGrid(int width, int height)
        {
            Width = width;
            Height = height;
            _blocked = new bool[width, height];
        }

        // A casa existe dentro do retângulo?
        public bool InBounds(Vector2Int c) => c.x >= 0 && c.y >= 0 && c.x < Width && c.y < Height;

        // Marca/desmarca obstáculo (pedra, árvore).
        public void SetBlocked(Vector2Int c, bool blocked) => _blocked[c.x, c.y] = blocked;

        // Fora do grid conta como bloqueado: simplifica todas as checagens.
        public bool IsBlocked(Vector2Int c) => !InBounds(c) || _blocked[c.x, c.y];

        // Quem está nesta casa (ou null).
        public Unit UnitAt(Vector2Int c) => _occupants.TryGetValue(c, out var u) ? u : null;

        // Dá para entrar nesta casa? (sem obstáculo e sem unidade)
        public bool IsFree(Vector2Int c) => !IsBlocked(c) && UnitAt(c) == null;

        // Coloca (ou move) a unidade numa casa, tirando-a da casa antiga.
        public void Place(Unit u, Vector2Int c)
        {
            Remove(u);
            u.Cell = c;
            _occupants[c] = u;
        }

        // Tira a unidade do grid (morreu ou caiu). Só remove se a casa for mesmo dela.
        public void Remove(Unit u)
        {
            if (_occupants.TryGetValue(u.Cell, out var o) && o == u) _occupants.Remove(u.Cell);
        }

        // Distância de Manhattan: quantos passos em 4 direções, ignorando obstáculos.
        public static int Distance(Vector2Int a, Vector2Int b) =>
            Mathf.Abs(a.x - b.x) + Mathf.Abs(a.y - b.y);

        // Todas as casas dentro do grid a até 'radius' de distância (inclui o centro).
        public IEnumerable<Vector2Int> CellsInRadius(Vector2Int center, int radius)
        {
            for (int dx = -radius; dx <= radius; dx++)
            for (int dy = -radius; dy <= radius; dy++)
            {
                var c = new Vector2Int(center.x + dx, center.y + dy);
                if (Mathf.Abs(dx) + Mathf.Abs(dy) <= radius && InBounds(c)) yield return c;
            }
        }

        // BFS a partir de 'from', andando só por casas livres, até 'maxSteps' passos.
        // Devolve a distância de cada casa alcançada e, em 'parent', de onde se chegou nela
        // (para remontar o caminho depois).
        Dictionary<Vector2Int, int> Bfs(Vector2Int from, int maxSteps,
                                        out Dictionary<Vector2Int, Vector2Int> parent)
        {
            var dist = new Dictionary<Vector2Int, int> { [from] = 0 };
            parent = new Dictionary<Vector2Int, Vector2Int>();
            var queue = new Queue<Vector2Int>();
            queue.Enqueue(from);
            while (queue.Count > 0)
            {
                var cur = queue.Dequeue();
                if (dist[cur] >= maxSteps) continue;
                foreach (var d in Dirs)
                {
                    var next = cur + d;
                    if (dist.ContainsKey(next) || !IsFree(next)) continue;
                    dist[next] = dist[cur] + 1;
                    parent[next] = cur;
                    queue.Enqueue(next);
                }
            }
            return dist;
        }

        // Casas alcançáveis andando até 'steps' passos (inclui a própria casa, com 0).
        public Dictionary<Vector2Int, int> Reachable(Vector2Int from, int steps) =>
            Bfs(from, steps, out _);

        // Menor caminho de 'from' até 'to' (sem incluir 'from'), ou null se não der
        // para chegar em até 'maxSteps' passos.
        public List<Vector2Int> PathTo(Vector2Int from, Vector2Int to, int maxSteps)
        {
            var dist = Bfs(from, maxSteps, out var parent);
            if (!dist.ContainsKey(to) || to == from) return null;
            var path = new List<Vector2Int>();
            for (var c = to; c != from; c = parent[c]) path.Add(c);
            path.Reverse();
            return path;
        }
    }
}
```

### 1.3 O contexto do combate (regra pura com eventos)

```csharp
// Assets/_Project/Scripts/Core/BattleContext.cs
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace Bolsa.Core
{
    // POR QUE: todas as ações (golpe, flecha, passo, ataque de monstro) mexem nas mesmas
    // coisas: vida, escudo, posição. Se cada uma mexesse direto, a tela não saberia o que
    // animar. Aqui elas passam por um só lugar, que avisa a tela por eventos.
    // ESTRATÉGIA: o contexto guarda o grid, a lista de unidades e o gerador de números
    // aleatórios do combate. Métodos como DealDamage e MoveAlong mudam o estado e
    // disparam eventos (Damaged, Moved, Died, Log). Um "event" em C# é uma lista de
    // funções que serão chamadas quando algo acontecer; a tela se inscreve com +=.
    public class BattleContext
    {
        public readonly BattleGrid Grid;
        public readonly List<Unit> Units = new();
        public readonly System.Random Rng;

        public event Action<Unit, int> Damaged;              // unidade, dano real nos PV
        public event Action<Unit, List<Vector2Int>> Moved;   // unidade, caminho percorrido
        public event Action<Unit> Died;
        public event Action<Unit> Changed;                   // escudo, cura, etc.
        public event Action<string> Log;

        // Cria o contexto com uma semente: a mesma semente sorteia as mesmas fichas,
        // o que ajuda muito a reproduzir um bug.
        public BattleContext(BattleGrid grid, int seed)
        {
            Grid = grid;
            Rng = new System.Random(seed);
        }

        // Coloca uma unidade nova no combate.
        public void AddUnit(Unit u, Vector2Int cell)
        {
            Units.Add(u);
            Grid.Place(u, cell);
        }

        // Unidades vivas de um lado.
        public IEnumerable<Unit> Living(Team team) => Units.Where(u => u.Alive && u.Team == team);

        // Causa dano e avisa a tela; se a unidade morrer, tira do grid.
        public int DealDamage(Unit target, int amount, Unit source)
        {
            if (!target.Alive) return 0;
            int real = target.TakeDamage(amount);
            Say($"{source.Name} causa {amount} em {target.Name}" + (real < amount ? $" ({amount - real} no escudo)" : ""));
            Damaged?.Invoke(target, real);
            Changed?.Invoke(target);
            if (!target.Alive)
            {
                Grid.Remove(target);
                Say($"{target.Name} caiu.");
                Died?.Invoke(target);
            }
            return real;
        }

        // Move a unidade até o fim do caminho (a animação passo a passo é da tela).
        public void MoveAlong(Unit u, List<Vector2Int> path)
        {
            if (path == null || path.Count == 0) return;
            Grid.Place(u, path[^1]);
            Moved?.Invoke(u, path);
        }

        // Soma escudo.
        public void AddShield(Unit u, int amount)
        {
            u.Shield += amount;
            Say($"{u.Name} ganha {amount} de escudo.");
            Changed?.Invoke(u);
        }

        // Avisa a tela que algo nesta unidade mudou sem dano (ex.: escudo zerado).
        public void NotifyChanged(Unit u) => Changed?.Invoke(u);

        // Escreve uma linha no log do combate.
        public void Say(string message) => Log?.Invoke(message);
    }
}
```

### 1.4 Montar o chão isométrico na cena

1. Na cena `Battle`: **GameObject → 2D Object → Tilemap → Isometric**. A Unity cria um `Grid` com um `Tilemap` filho.
2. Selecione o `Grid`: **Cell Size = (1, 0.5, 1)**, **Cell Layout = Isometric**. Um losango de 48×24 px com PPU 48 tem 1 × 0,5 unidades, igual à casa.
3. Renomeie o Tilemap para `Floor`, **Sorting Layer = Floor**. Duplique-o, renomeie para `Highlight`, **Sorting Layer = Highlight**, e no `Tilemap` dele ponha **Color** com alfa 0,5.
4. **Tiles:** crie a pasta `Assets/_Project/Tiles/`. Abra **Window → 2D → Tile Palette**, crie uma paleta `Floresta`, e arraste os sprites `tile_*.png` para ela: a Unity cria um `Tile` asset por sprite. Para o destaque, crie um tile a partir de um losango branco (pode ser um `tile_0` com cor branca no Tile asset, campo **Color**).
5. Câmera: **Projection = Orthographic**, **Size ≈ 4**, posição perto do centro do grid (o `GridView` centraliza abaixo).

### 1.5 GridView: desenhar o grid e converter casa ↔ mundo

```csharp
// Assets/_Project/Scripts/View/GridView.cs
using System.Collections.Generic;
using Bolsa.Core;
using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bolsa.View
{
    // POR QUE: o BattleGrid sabe as regras; alguém precisa pintar o chão, mostrar as
    // casas válidas de um alvo e converter "casa (3,4)" em posição no mundo (e o clique
    // do mouse de volta em casa).
    // ESTRATÉGIA: usa o componente Grid da Unity com layout isométrico. Ele já faz as
    // contas de projeção: CellToWorld e WorldToCell. Um Tilemap pinta o chão, outro pinta
    // o destaque. Obstáculos são sprites soltos (pedra/árvore) na Sorting Layer "Units",
    // para ordenarem na frente/atrás das unidades pela altura na tela.
    public class GridView : MonoBehaviour
    {
        [SerializeField] private Grid _grid;
        [SerializeField] private Tilemap _floor;
        [SerializeField] private Tilemap _highlight;
        [SerializeField] private TileBase[] _floorTiles;     // variações do chão
        [SerializeField] private TileBase _highlightTile;
        [SerializeField] private Sprite[] _obstacleSprites;  // pedra, árvore
        [SerializeField] private Camera _camera;

        readonly List<GameObject> _obstacles = new();

        // Centro da casa em coordenadas do mundo (onde ficam os pés da unidade).
        public Vector3 CellToWorld(Vector2Int c) => _grid.GetCellCenterWorld(new Vector3Int(c.x, c.y, 0));

        // Casa sob um ponto do mundo (o clique do mouse já convertido para mundo).
        public Vector2Int WorldToCell(Vector3 world)
        {
            var c = _grid.WorldToCell(world);
            return new Vector2Int(c.x, c.y);
        }

        // Pinta o chão inteiro e cria os obstáculos. Chamado uma vez no início do combate.
        public void Build(BattleGrid grid, System.Random rng)
        {
            _floor.ClearAllTiles();
            foreach (var o in _obstacles) Destroy(o);
            _obstacles.Clear();

            for (int x = 0; x < grid.Width; x++)
            for (int y = 0; y < grid.Height; y++)
            {
                var cell = new Vector2Int(x, y);
                _floor.SetTile(new Vector3Int(x, y, 0), _floorTiles[rng.Next(_floorTiles.Length)]);
                if (grid.IsBlocked(cell)) SpawnObstacle(cell, rng);
            }
            CenterCamera(grid);
        }

        // Cria um sprite de pedra/árvore em pé sobre a casa bloqueada.
        void SpawnObstacle(Vector2Int cell, System.Random rng)
        {
            var go = new GameObject($"Obstacle {cell}");
            go.transform.SetParent(transform, false);
            go.transform.position = CellToWorld(cell);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = _obstacleSprites[rng.Next(_obstacleSprites.Length)];
            sr.sortingLayerName = "Units";
            _obstacles.Add(go);
        }

        // Põe a câmera no meio do grid.
        void CenterCamera(BattleGrid grid)
        {
            var a = CellToWorld(Vector2Int.zero);
            var b = CellToWorld(new Vector2Int(grid.Width - 1, grid.Height - 1));
            var mid = (a + b) / 2f;
            _camera.transform.position = new Vector3(mid.x, mid.y, -10f);
        }

        // Pinta as casas válidas de um alvo (ex.: até onde o Passo alcança).
        public void ShowHighlight(IEnumerable<Vector2Int> cells)
        {
            _highlight.ClearAllTiles();
            foreach (var c in cells) _highlight.SetTile(new Vector3Int(c.x, c.y, 0), _highlightTile);
        }

        // Apaga o destaque.
        public void ClearHighlight() => _highlight.ClearAllTiles();
    }
}
```

> **Os sprites de obstáculo** (`pedra.png`, `arvore.png`) precisam de **Pivot = Bottom** com a base um pouco acima do pé da imagem, para a pedra "pousar" no centro do losango. Ajuste no Sprite Editor olhando a cena.

### 1.6 UnitView: a unidade na tela

```csharp
// Assets/_Project/Scripts/View/UnitView.cs
using System.Collections;
using System.Collections.Generic;
using Bolsa.Core;
using TMPro;
using UnityEngine;

namespace Bolsa.View
{
    // POR QUE: a Unit é só dados; o jogador precisa ver o sprite, a vida, o escudo,
    // a intenção do inimigo e a unidade andando casa a casa.
    // ESTRATÉGIA: um prefab com SpriteRenderer (corpo) e dois textos TextMeshPro
    // "World Space" (PV em cima, intenção acima dele). As animações são corrotinas
    // (IEnumerator): funções que podem pausar com "yield return null" e continuar no
    // próximo quadro, o jeito mais simples de animar ao longo do tempo na Unity.
    public class UnitView : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _body;
        [SerializeField] private TMP_Text _hpText;
        [SerializeField] private TMP_Text _intentText;
        [SerializeField] private float _stepTime = 0.15f;

        public Unit Unit { get; private set; }
        GridView _gridView;

        // Liga esta view a uma unidade e a coloca na casa dela.
        public void Bind(Unit unit, GridView gridView, Sprite sprite, bool faceLeft)
        {
            Unit = unit;
            _gridView = gridView;
            _body.sprite = sprite;
            _body.flipX = faceLeft;
            transform.position = gridView.CellToWorld(unit.Cell);
            SetIntent("");
            Refresh();
        }

        // Atualiza o texto de vida e escudo.
        public void Refresh()
        {
            _hpText.text = Unit.Shield > 0
                ? $"{Unit.Hp}/{Unit.MaxHp} <color=#7fd3ff>+{Unit.Shield}</color>"
                : $"{Unit.Hp}/{Unit.MaxHp}";
        }

        // Mostra a intenção do inimigo (vazio esconde).
        public void SetIntent(string text) => _intentText.text = text;

        // Anda casa a casa pelo caminho, virando para o lado do passo.
        public IEnumerator WalkPath(List<Vector2Int> path)
        {
            foreach (var cell in path)
            {
                Vector3 a = transform.position, b = _gridView.CellToWorld(cell);
                if (Mathf.Abs(b.x - a.x) > 0.01f) _body.flipX = b.x < a.x;
                for (float t = 0; t < 1f; t += Time.deltaTime / _stepTime)
                {
                    transform.position = Vector3.Lerp(a, b, t);
                    yield return null;
                }
                transform.position = b;
            }
        }

        // Pisca em vermelho ao tomar dano.
        public IEnumerator HitFlash()
        {
            _body.color = new Color(1f, 0.4f, 0.4f);
            yield return new WaitForSeconds(0.15f);
            _body.color = Color.white;
            Refresh();
        }

        // Some aos poucos ao cair.
        public IEnumerator FadeOut()
        {
            for (float a = 1f; a > 0f; a -= Time.deltaTime * 3f)
            {
                _body.color = new Color(1f, 1f, 1f, a);
                yield return null;
            }
            gameObject.SetActive(false);
        }
    }
}
```

**Prefab `UnitView`:** GameObject vazio com o script; filho `Body` com `SpriteRenderer` (Sorting Layer `Units`); filhos `HP` e `Intent` com **3D Object → Text - TextMeshPro** (o de mundo, não o de UI), tamanho de fonte ~2, posicionados acima da cabeça (y ≈ 1,1 e 1,4). Ponha os textos numa Sorting Layer acima de `Units` (pelo `Sorting Group` ou pelo **Order in Layer** alto do `MeshRenderer` do texto) para não sumirem atrás de outros sprites.

### 1.7 CellPicker: clique no mapa

```csharp
// Assets/_Project/Scripts/View/CellPicker.cs
using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

namespace Bolsa.View
{
    // POR QUE: o jogador escolhe destinos e alvos clicando no chão. O clique vem em
    // pixels da tela; o jogo precisa da casa do grid.
    // ESTRATÉGIA: no Update (chamado pela Unity uma vez por quadro), lê o botão esquerdo
    // pelo Input System. Ignora o clique se o mouse estiver sobre a UI (o livro fica por
    // cima do mapa). Converte tela → mundo pela câmera e mundo → casa pelo GridView, e
    // avisa por evento. Botão direito avisa "Cancelled" (sair do modo de mira).
    public class CellPicker : MonoBehaviour
    {
        [SerializeField] private Camera _camera;
        [SerializeField] private GridView _gridView;

        public event Action<Vector2Int> Clicked;
        public event Action Cancelled;

        // Lê o mouse a cada quadro.
        void Update()
        {
            var mouse = Mouse.current;
            if (mouse == null) return;
            if (mouse.rightButton.wasPressedThisFrame) Cancelled?.Invoke();
            if (!mouse.leftButton.wasPressedThisFrame) return;
            if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject()) return;

            Vector3 world = _camera.ScreenToWorldPoint(mouse.position.ReadValue());
            world.z = 0f;
            Clicked?.Invoke(_gridView.WorldToCell(world));
        }
    }
}
```

### 1.8 Teste da fase: GridSandbox

Um script temporário só para ver a fase funcionando; ele sai da cena na Fase 5.

```csharp
// Assets/_Project/Scripts/Battle/GridSandbox.cs
using System.Collections.Generic;
using Bolsa.Core;
using Bolsa.View;
using UnityEngine;

namespace Bolsa.Battle
{
    // POR QUE: testar grid, BFS e animação antes de existir fichas e livro.
    // ESTRATÉGIA: cria um grid 10×8 com alguns obstáculos, uma unidade, e move a unidade
    // até a casa clicada se ela estiver a até 4 passos. Apague quando a Fase 5 existir.
    public class GridSandbox : MonoBehaviour
    {
        [SerializeField] private GridView _gridView;
        [SerializeField] private CellPicker _picker;
        [SerializeField] private UnitView _unitPrefab;
        [SerializeField] private Sprite _heroSprite;

        BattleContext _ctx;
        Unit _hero;
        UnitView _heroView;

        // Start roda uma vez quando a cena começa.
        void Start()
        {
            var grid = new BattleGrid(10, 8);
            var rng = new System.Random(1);
            for (int i = 0; i < 8; i++) grid.SetBlocked(new Vector2Int(rng.Next(2, 8), rng.Next(0, 8)), true);
            _ctx = new BattleContext(grid, 1);
            _gridView.Build(grid, rng);

            _hero = new Unit("Guerreiro", Team.Heroes, 24, 24);
            _ctx.AddUnit(_hero, new Vector2Int(0, 3));
            _heroView = Instantiate(_unitPrefab);
            _heroView.Bind(_hero, _gridView, _heroSprite, false);

            _gridView.ShowHighlight(grid.Reachable(_hero.Cell, 4).Keys);
            _picker.Clicked += OnClicked;
            _ctx.Moved += (u, path) => StartCoroutine(_heroView.WalkPath(path));
        }

        // Move até a casa clicada, se der.
        void OnClicked(Vector2Int cell)
        {
            List<Vector2Int> path = _ctx.Grid.PathTo(_hero.Cell, cell, 4);
            if (path == null) return;
            _ctx.MoveAlong(_hero, path);
            _gridView.ShowHighlight(_ctx.Grid.Reachable(_hero.Cell, 4).Keys);
        }
    }
}
```

Na cena: crie um GameObject `Battle` com `GridSandbox`, `CellPicker`; ponha o `GridView` no `Grid`; ligue as referências no Inspector. Crie também um **EventSystem** (GameObject → UI → Event System) e, se o Inspector pedir, clique em **Replace with InputSystemUIInputModule**.

### ✅ Checkpoint da Fase 1
- O chão de 10×8 losangos aparece, com pedras/árvores espalhadas.
- O Guerreiro aparece de pé no centro da casa (0,3), e as casas a até 4 passos ficam destacadas, contornando os obstáculos.
- Clicar numa casa destacada faz ele andar casa a casa até lá; clicar fora do destaque não faz nada.
- Uma unidade atrás de uma pedra (mais acima na tela) aparece atrás dela.

#### Problemas comuns
- **O clique cai na casa vizinha:** o pivô dos tiles não está no centro do losango (0.5, 0.667) ou o **Cell Size** do Grid não é (1, 0.5, 1). O `Grid` calcula a casa pela geometria da célula, não pelo desenho.
- **Unidade sempre na frente da pedra:** a pedra ficou na Sorting Layer `Floor`, ou o Transparency Sort Axis não é (0, 1, 0).
- **`IsPointerOverGameObject` sempre verdadeiro:** algum `Image` de UI cobre a tela inteira com **Raycast Target** ligado.

Próxima fase: **Fichas, Bag e Trilhas**.

---

# Parte 5 — Implementação Unity: Fase 2 (Fichas, Bag e Trilhas)

## Fase 2 — Fichas, Bag e Trilhas

> Objetivo desta fase: os tipos de ficha, a bag que sorteia sem reposição e os números das trilhas num asset de configuração.

### 2.1 Tipos de ficha e de casa

```csharp
// Assets/_Project/Scripts/Data/TokenType.cs
using UnityEngine;

namespace Bolsa.Data
{
    // As fichas da Parte 1 §5. Os números explícitos casam com SlotRequirement abaixo.
    public enum TokenType { Forca = 0, Agilidade = 1, Mana = 2, Foco = 3, Ferida = 10, Medo = 11 }

    // O que uma casa de página aceita. "Qualquer" = qualquer ficha boa.
    public enum SlotRequirement { Forca = 0, Agilidade = 1, Mana = 2, Foco = 3, Qualquer = 99 }

    // POR QUE: várias partes do jogo perguntam "essa ficha é ruim?", "essa casa aceita
    // essa ficha?", "que cor desenho?". Responder num lugar só evita regra duplicada.
    // ESTRATÉGIA: métodos de extensão (o "this" no primeiro parâmetro): permitem escrever
    // token.IsBad() como se fosse um método do próprio enum.
    public static class TokenRules
    {
        // Ferida e Medo não encaixam em nada.
        public static bool IsBad(this TokenType t) => t == TokenType.Ferida || t == TokenType.Medo;

        // A casa aceita a ficha? Mesmo tipo, ou "Qualquer" com ficha boa.
        public static bool Accepts(this SlotRequirement r, TokenType t) =>
            !t.IsBad() && (r == SlotRequirement.Qualquer || (int)r == (int)t);

        // Cor de placeholder enquanto não há arte de fichas.
        public static Color ColorOf(TokenType t) => t switch
        {
            TokenType.Forca => new Color(0.85f, 0.25f, 0.2f),
            TokenType.Agilidade => new Color(0.3f, 0.75f, 0.3f),
            TokenType.Mana => new Color(0.25f, 0.45f, 0.95f),
            TokenType.Foco => new Color(0.95f, 0.8f, 0.2f),
            TokenType.Ferida => new Color(0.45f, 0.45f, 0.45f),
            TokenType.Medo => new Color(0.55f, 0.25f, 0.7f),
            _ => Color.white,
        };

        // Rótulo curto para a ficha e para a casa.
        public static string ShortName(TokenType t) => t switch
        {
            TokenType.Forca => "FOR", TokenType.Agilidade => "AGI", TokenType.Mana => "MAN",
            TokenType.Foco => "FOC", TokenType.Ferida => "FER", TokenType.Medo => "MED", _ => "?",
        };

        public static string ShortName(SlotRequirement r) =>
            r == SlotRequirement.Qualquer ? "QQ" : ShortName((TokenType)(int)r);

        public static Color ColorOf(SlotRequirement r) =>
            r == SlotRequirement.Qualquer ? new Color(0.8f, 0.8f, 0.8f) : ColorOf((TokenType)(int)r);
    }
}
```

### 2.2 A bag

```csharp
// Assets/_Project/Scripts/Core/Bag.cs
using System.Collections.Generic;
using System.Linq;
using Bolsa.Data;

namespace Bolsa.Core
{
    // POR QUE: é o coração do jogo (Parte 1 §6): tirar N fichas às cegas, sem reposição,
    // e devolver tudo no fim da rodada.
    // ESTRATÉGIA: uma lista simples. Sortear = escolher um índice aleatório, trocar com o
    // último e remover o último (O(1), e a ordem da lista não importa numa bag). O
    // System.Random vem de fora para o sorteio ser reproduzível pela semente.
    public class Bag
    {
        readonly List<TokenType> _tokens;

        public IReadOnlyList<TokenType> Tokens => _tokens;
        public int Count => _tokens.Count;

        // Cria a bag com um conteúdo inicial (copiado, para não mexer na lista de origem).
        public Bag(IEnumerable<TokenType> contents) => _tokens = new List<TokenType>(contents);

        // Põe fichas na bag.
        public void Add(TokenType t, int count = 1)
        {
            for (int i = 0; i < count; i++) _tokens.Add(t);
        }

        // Devolve várias fichas de uma vez (limpeza da rodada).
        public void ReturnAll(IEnumerable<TokenType> tokens) => _tokens.AddRange(tokens);

        // Tira uma ficha de um tipo específico (tratar Ferida, podar a bag).
        public bool Remove(TokenType t) => _tokens.Remove(t);

        // Quantas fichas desse tipo estão na bag (para o painel de composição).
        public int CountOf(TokenType t) => _tokens.Count(x => x == t);

        // Sorteia até 'n' fichas sem reposição.
        public List<TokenType> Draw(int n, System.Random rng)
        {
            var drawn = new List<TokenType>(n);
            for (int i = 0; i < n && _tokens.Count > 0; i++)
            {
                int k = rng.Next(_tokens.Count);
                drawn.Add(_tokens[k]);
                _tokens[k] = _tokens[^1];
                _tokens.RemoveAt(_tokens.Count - 1);
            }
            return drawn;
        }
    }
}
```

### 2.3 GameConfig: os números das trilhas e da run

```csharp
// Assets/_Project/Scripts/Data/GameConfig.cs
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: os números da Parte 1 marcados "proposta" vão mudar no playtest. Num
    // ScriptableObject eles viram campos editáveis no Inspector, sem recompilar.
    // ESTRATÉGIA: um ScriptableObject é um arquivo de dados (.asset) que o código lê.
    // [CreateAssetMenu] põe a opção no menu Create. Fica em Resources/ para qualquer
    // script carregar com GameConfig.Get(), sem precisar arrastar referência.
    [CreateAssetMenu(menuName = "Bolsa/Game Config", fileName = "GameConfig")]
    public class GameConfig : ScriptableObject
    {
        [Header("Trilhas (Parte 1 §8)")]
        public int[] drawByBreathLevel = { 4, 5, 6, 7, 8, 9 };
        public int[] reserveByLevel = { 1, 2, 3, 4, 5 };

        [Header("Livro e combate")]
        public int maxPagesInBook = 8;
        public int knockoutHp = 1;
        public int woundsOnKnockout = 2;

        [Header("Run (Parte 1 §12)")]
        public int xpPerLevel = 10;
        public int mapLayers = 7;
        [Range(0f, 1f)] public float campHealFraction = 0.3f;
        public int tokenPrice = 15, pagePrice = 40, treatPrice = 20;

        // Fichas tiradas por rodada num nível da Trilha de Fôlego.
        public int DrawCount(int level) => drawByBreathLevel[Mathf.Clamp(level, 0, drawByBreathLevel.Length - 1)];

        // Casas da Reserva num nível da Trilha de Reserva.
        public int ReserveSlots(int level) => reserveByLevel[Mathf.Clamp(level, 0, reserveByLevel.Length - 1)];

        public int MaxBreathLevel => drawByBreathLevel.Length - 1;
        public int MaxReserveLevel => reserveByLevel.Length - 1;

        static GameConfig _cached;

        // Carrega (uma vez) o asset Resources/GameConfig.
        public static GameConfig Get() => _cached ??= Resources.Load<GameConfig>("GameConfig");
    }
}
```

Crie o asset: **Project → Create → Bolsa → Game Config**, em `Assets/_Project/Resources/`, com o nome exato `GameConfig`.

### 2.4 Teste da fase: BagSandbox

```csharp
// Assets/_Project/Scripts/Battle/BagSandbox.cs
using System.Linq;
using Bolsa.Core;
using Bolsa.Data;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Bolsa.Battle
{
    // POR QUE: ver o sorteio funcionando antes de existir UI de fichas.
    // ESTRATÉGIA: uma bag com a composição inicial do Mago. Espaço tira fichas pelo nível
    // de Fôlego e escreve no Console; R devolve tudo. Apague depois da fase.
    public class BagSandbox : MonoBehaviour
    {
        [SerializeField] private int _breathLevel;

        Bag _bag;
        System.Random _rng = new(42);
        System.Collections.Generic.List<TokenType> _hand = new();

        void Start()
        {
            _bag = new Bag(new[] { TokenType.Mana, TokenType.Mana, TokenType.Mana, TokenType.Mana,
                                   TokenType.Foco, TokenType.Foco, TokenType.Agilidade, TokenType.Agilidade });
        }

        // Espaço sorteia, R devolve.
        void Update()
        {
            var kb = Keyboard.current;
            if (kb == null) return;
            if (kb.spaceKey.wasPressedThisFrame)
            {
                _hand.AddRange(_bag.Draw(GameConfig.Get().DrawCount(_breathLevel), _rng));
                Debug.Log($"Mão: {string.Join(", ", _hand.Select(TokenRules.ShortName))} | na bag: {_bag.Count}");
            }
            if (kb.rKey.wasPressedThisFrame)
            {
                _bag.ReturnAll(_hand);
                _hand.Clear();
                Debug.Log($"Tudo de volta. Na bag: {_bag.Count}");
            }
        }
    }
}
```

### ✅ Checkpoint da Fase 2
- Com Fôlego 0, Espaço escreve 4 fichas e a bag cai de 8 para 4; Espaço de novo tira as 4 restantes; uma terceira vez não tira nada.
- R devolve tudo e a bag volta a 8.
- Mudar `_breathLevel` para 2 no Inspector faz sair 6 fichas.
- Rodar duas vezes com a mesma semente (42) dá a mesma sequência.

Próxima fase: **Livro de Habilidades e Efeitos**.

---

# Parte 6 — Implementação Unity: Fase 3 (Livro de Habilidades e Efeitos)

## Fase 3 — Livro de Habilidades e Efeitos

> Objetivo desta fase: páginas como assets (casas + efeitos), os efeitos básicos (dano, movimento, escudo), a regra de alvos válidos e os heróis com bag, livro e trilhas.

### 3.1 Efeitos

```csharp
// Assets/_Project/Scripts/Data/Effects/AbilityEffect.cs
using Bolsa.Core;
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: páginas diferentes fazem coisas parecidas (dano, área, andar, escudo).
    // Em vez de um script por página, cada página lista "efeitos" reutilizáveis.
    // ESTRATÉGIA: cada efeito é um ScriptableObject com um método Apply. Uma página
    // como Investida = [MoveEffect, DamageEffect]. Criar página nova vira montar assets
    // no Inspector, sem programar. "abstract" quer dizer que esta classe não existe
    // sozinha: só as filhas (DamageEffect etc.) viram assets.
    public abstract class AbilityEffect : ScriptableObject
    {
        // caster: quem usa a página. target: a casa escolhida (ou a do caster, se a
        // página não pede alvo).
        public abstract void Apply(BattleContext ctx, Unit caster, Vector2Int target);

        // Quantos passos este efeito anda. Só o MoveEffect devolve > 0; TargetRules usa
        // isso para saber até onde destacar as casas.
        public virtual int MoveSteps => 0;
    }
}
```

```csharp
// Assets/_Project/Scripts/Data/Effects/DamageEffect.cs
using Bolsa.Core;
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: Golpe, Flecha, Faísca, Bola de Fogo, Redemoinho são todos "X de dano em
    // inimigos numa área". Um só efeito cobre todos.
    // ESTRATÉGIA: radius 0 = só a casa-alvo; radius 1 = alvo + 4 vizinhas. Só acerta
    // unidades do outro time (sem fogo amigo no MVP).
    [CreateAssetMenu(menuName = "Bolsa/Effects/Damage")]
    public class DamageEffect : AbilityEffect
    {
        public int amount = 3;
        public int radius = 0;

        // Dá dano em cada inimigo na área.
        public override void Apply(BattleContext ctx, Unit caster, Vector2Int target)
        {
            foreach (var cell in ctx.Grid.CellsInRadius(target, radius))
            {
                var u = ctx.Grid.UnitAt(cell);
                if (u != null && u.Team != caster.Team) ctx.DealDamage(u, amount, caster);
            }
        }
    }
}
```

```csharp
// Assets/_Project/Scripts/Data/Effects/MoveEffect.cs
using Bolsa.Core;
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: mover é uma ação do livro que gasta fichas (Parte 1 §10).
    // ESTRATÉGIA: anda pelo menor caminho até a casa-alvo, se ela estiver a até 'steps'
    // passos. A casa já foi validada por TargetRules; o PathTo confirma de novo.
    [CreateAssetMenu(menuName = "Bolsa/Effects/Move")]
    public class MoveEffect : AbilityEffect
    {
        public int steps = 2;

        public override int MoveSteps => steps;

        // Anda até a casa escolhida.
        public override void Apply(BattleContext ctx, Unit caster, Vector2Int target)
        {
            ctx.MoveAlong(caster, ctx.Grid.PathTo(caster.Cell, target, steps));
        }
    }
}
```

```csharp
// Assets/_Project/Scripts/Data/Effects/ShieldEffect.cs
using Bolsa.Core;
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: Erguer Escudo e Barreira Arcana protegem a si ou a um aliado.
    // ESTRATÉGIA: se houver aliado na casa-alvo, ele recebe; senão, o próprio caster.
    [CreateAssetMenu(menuName = "Bolsa/Effects/Shield")]
    public class ShieldEffect : AbilityEffect
    {
        public int amount = 5;

        // Dá escudo ao aliado na casa (ou a si mesmo).
        public override void Apply(BattleContext ctx, Unit caster, Vector2Int target)
        {
            var u = ctx.Grid.UnitAt(target);
            ctx.AddShield(u != null && u.Team == caster.Team ? u : caster, amount);
        }
    }
}
```

> A Investida (Parte 1 §7.2) usa **Move** e depois **Damage** com alvo na casa de destino; para isso o `DamageEffect` dela tem `radius = 1` (acerta quem estiver adjacente ao destino). É um atalho de MVP: acerta todos os adjacentes, não um só. **Em aberto** na Parte 1 se a Investida deve ter alvo único.

### 3.2 Página

```csharp
// Assets/_Project/Scripts/Data/PageDef.cs
using System.Collections.Generic;
using UnityEngine;

namespace Bolsa.Data
{
    public enum PageKind { Simples, Especial, Movimento, Suporte, Recrutar }

    // Que tipo de alvo a página pede no mapa.
    public enum TargetMode
    {
        None,          // sem alvo: acontece na casa do próprio herói (Redemoinho, Treino)
        Enemy,         // um inimigo a até 'range' casas
        Ally,          // um aliado (ou si mesmo) a até 'range' casas
        Cell,          // qualquer casa sem obstáculo a até 'range' (áreas: Bola de Fogo)
        ReachableCell, // uma casa livre alcançável andando (Passo, Corrida, Investida)
    }

    // POR QUE: cada página do livro (Parte 1 §7) é um dado: nome, casas de fichas, tipo
    // de alvo, alcance e o que acontece. Como asset, o designer cria páginas no Inspector.
    // ESTRATÉGIA: 'slots' é a lista de casas (uma ficha por casa); 'effects' roda em ordem
    // quando a página é usada. 'id' é estável e é o que vai para o save (Fase 7).
    [CreateAssetMenu(menuName = "Bolsa/Page")]
    public class PageDef : ScriptableObject
    {
        public string id;
        public string displayName;
        [TextArea] public string description;
        public PageKind kind;
        public List<SlotRequirement> slots = new();
        public TargetMode target;
        public int range = 1;
        public int usesPerRound = 1;
        public List<AbilityEffect> effects = new();
    }
}
```

### 3.3 Alvos válidos

```csharp
// Assets/_Project/Scripts/Core/TargetRules.cs
using System.Collections.Generic;
using Bolsa.Data;
using UnityEngine;

namespace Bolsa.Core
{
    // POR QUE: antes de pedir o clique, o jogo precisa destacar onde dá para mirar, e
    // depois do clique precisa recusar uma casa inválida. As duas coisas usam a mesma
    // lista, calculada aqui.
    // ESTRATÉGIA: um switch por TargetMode. Movimento usa o BFS (contorna obstáculo);
    // o resto usa distância de Manhattan (sem linha de visão no MVP).
    public static class TargetRules
    {
        // Casas onde esta página pode ser usada agora.
        public static HashSet<Vector2Int> ValidCells(BattleContext ctx, Unit caster, PageDef page)
        {
            var result = new HashSet<Vector2Int>();
            var grid = ctx.Grid;

            if (page.target == TargetMode.None)
            {
                result.Add(caster.Cell);
                return result;
            }

            if (page.target == TargetMode.ReachableCell)
            {
                int steps = 0;
                foreach (var e in page.effects) steps = Mathf.Max(steps, e.MoveSteps);
                foreach (var cell in grid.Reachable(caster.Cell, steps).Keys)
                    if (cell != caster.Cell) result.Add(cell);
                return result;
            }

            foreach (var cell in grid.CellsInRadius(caster.Cell, page.range))
            {
                var u = grid.UnitAt(cell);
                bool ok = page.target switch
                {
                    TargetMode.Enemy => u != null && u.Team != caster.Team,
                    TargetMode.Ally => u != null && u.Team == caster.Team,
                    TargetMode.Cell => !grid.IsBlocked(cell),
                    _ => false,
                };
                if (ok) result.Add(cell);
            }
            return result;
        }
    }
}
```

### 3.4 Herói: definição e estado na run

```csharp
// Assets/_Project/Scripts/Data/HeroDef.cs
using System.Collections.Generic;
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: os valores iniciais de cada herói (Parte 1 §4 e §7.1) são dados fixos.
    // ESTRATÉGIA: um asset por herói. O estado que muda durante a run fica em
    // HeroRunState, nunca aqui (mudar um ScriptableObject em Play Mode altera o arquivo).
    [CreateAssetMenu(menuName = "Bolsa/Hero")]
    public class HeroDef : ScriptableObject
    {
        public string id;
        public string displayName;
        public Sprite battleSprite;   // primeiro quadro de parado-se
        public Sprite portrait;
        public int maxHp = 20;
        public List<TokenType> startingBag = new();
        public List<PageDef> startingPages = new();
        public List<TokenType> favoredTokens = new(); // tipos puxados na recompensa (§12)
        public List<PageDef> rewardPages = new();      // páginas que podem aparecer para ele
    }
}
```

```csharp
// Assets/_Project/Scripts/Core/HeroRunState.cs
using System.Collections.Generic;
using System.Linq;
using Bolsa.Data;

namespace Bolsa.Core
{
    // POR QUE: durante a run cada herói muda: perde vida, ganha fichas e páginas, sobe
    // trilhas (Parte 1 §6, §7, §8). Esse estado precisa sobreviver entre combates.
    // ESTRATÉGIA: uma classe comum que aponta para o HeroDef (os valores de fábrica) e
    // guarda o que mudou. 'bag' é a bag da run (a permanente); o combate faz uma cópia.
    public class HeroRunState
    {
        public HeroDef def;
        public int hp;
        public int breathLevel;   // Trilha de Fôlego
        public int reserveLevel;  // Trilha de Reserva
        public List<TokenType> bag = new();
        public List<PageDef> pages = new();

        // Herói novo, com os valores iniciais do asset.
        public static HeroRunState New(HeroDef def) => new()
        {
            def = def,
            hp = def.maxHp,
            bag = new List<TokenType>(def.startingBag),
            pages = new List<PageDef>(def.startingPages),
        };

        public int Wounds => bag.Count(t => t == TokenType.Ferida);
    }
}
```

### 3.5 Criar os assets

1. **Efeitos** (`Assets/_Project/Data/Effects/`), um asset por valor diferente. Nomeie pelo valor, para reaproveitar:
   - Damage: `Dmg3`, `Dmg2`, `Dmg8`, `Dmg4_R1` (raio 1), `Dmg3_R1`, `Dmg7_R1`, `Dmg2_R1`
   - Move: `Move2`, `Move3`, `Move4`
   - Shield: `Shield5`, `Shield4`
2. **Páginas** (`Assets/_Project/Data/Pages/`): uma por linha das tabelas da Parte 1 §7.1 e §7.2, menos as de Recrutar, Atadura e Grito de Guerra (os efeitos delas vêm na Fase 4). Exemplos:

| Asset | slots | target | range | effects |
| --- | --- | --- | --- | --- |
| `Passo` | Qualquer | ReachableCell | (ignorado) | Move2 |
| `Golpe` | Forca | Enemy | 1 | Dmg3 |
| `Flecha` | Agilidade | Enemy | 5 | Dmg2 |
| `Redemoinho` | Forca, Forca, Agilidade, Foco | None | 0 | Dmg4_R1 |
| `BolaDeFogo` | Mana, Mana, Foco | Cell | 4 | Dmg3_R1 |
| `ErguerEscudo` | Forca, Foco | Ally | 1 | Shield5 |
| `Investida` | Forca, Agilidade, Agilidade | ReachableCell | (ignorado) | Move3, Dmg4_R1 |

3. **Heróis** (`Assets/_Project/Data/Heroes/`): `Guerreiro`, `Arqueiro`, `Mago`, com PV e bag da Parte 1 §4, as páginas iniciais em `startingPages` e o primeiro quadro de `parado-se` em `battleSprite`. `favoredTokens`: Guerreiro = Força, Foco; Arqueiro = Agilidade, Foco; Mago = Mana, Foco.

### ✅ Checkpoint da Fase 3
- Todos os assets aparecem sem erro e os campos `effects` das páginas apontam para os efeitos certos.
- Um teste rápido no `GridSandbox` (troque o `OnClicked` para chamar `TargetRules.ValidCells(ctx, hero, passo)` e pintar o resultado) destaca as mesmas casas do teste da Fase 1 para `Passo` com `Move2`.

#### Problemas comuns
- **Mudei um valor em Play Mode e ele ficou salvo:** isso acontece com ScriptableObjects. Nunca altere `HeroDef`/`PageDef` por código; altere o `HeroRunState`.

Próxima fase: **Mão, Reserva e Planejamento**.

---

# Parte 7 — Implementação Unity: Fase 4 (Mão, Reserva e Planejamento)

## Fase 4 — Mão, Reserva e Planejamento

> Objetivo desta fase: o estado das fichas de um herói durante o combate (mão, páginas, Reserva, bag de combate) e o livro na tela, com fichas arrastáveis.

### 4.1 Progresso de uma página e a mão do herói

```csharp
// Assets/_Project/Scripts/Core/CombatHand.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Bolsa.Data;

namespace Bolsa.Core
{
    // POR QUE: no combate, uma página do livro tem casas que vão sendo preenchidas e um
    // limite de usos por rodada. Isso é estado de combate, não do asset PageDef.
    // ESTRATÉGIA: um array de "TokenType?" (o "?" permite null = casa vazia).
    public class PageProgress
    {
        public readonly PageDef Def;
        public readonly TokenType?[] Slots;
        public int UsesLeft;

        // Página com todas as casas vazias.
        public PageProgress(PageDef def)
        {
            Def = def;
            Slots = new TokenType?[def.slots.Count];
            UsesLeft = def.usesPerRound;
        }

        public bool IsComplete => Slots.All(s => s.HasValue);
    }

    // POR QUE: é aqui que mora a regra do Orléans (Parte 1 §6, §8, §9): tirar N fichas,
    // distribuir pelas páginas, guardar algumas na Reserva, gastar ao usar e devolver
    // tudo (menos a Reserva) no fim da rodada.
    // ESTRATÉGIA: toda ficha do herói está em exatamente um lugar: na Bag (de combate),
    // solta na mão (Loose), numa casa de página, na Reserva ou em "gastas" (_spent, usadas
    // nesta rodada). Cada operação tira de um lugar e põe em outro, então nenhuma ficha
    // some nem duplica. O evento Changed avisa a UI para redesenhar.
    public class CombatHand
    {
        public readonly Bag Bag;
        public readonly List<TokenType> Loose = new();
        public readonly List<TokenType> Reserve = new();
        public readonly List<PageProgress> Pages = new();
        public readonly int ReserveCapacity;

        readonly List<TokenType> _spent = new();

        public event Action Changed;

        // Começa o combate: copia a bag da run e cria o progresso de cada página.
        public CombatHand(IEnumerable<TokenType> runBag, IEnumerable<PageDef> pages, int reserveCapacity)
        {
            Bag = new Bag(runBag);
            foreach (var p in pages) Pages.Add(new PageProgress(p));
            ReserveCapacity = reserveCapacity;
        }

        // Medo na mão bloqueia páginas Especiais (Parte 1 §5).
        public bool HasFear => Loose.Contains(TokenType.Medo);

        // Início da rodada: a Reserva volta para a mão e o herói tira N fichas a mais.
        public void StartRound(int drawCount, Random rng)
        {
            foreach (var p in Pages) p.UsesLeft = p.Def.usesPerRound;
            Loose.AddRange(Reserve);
            Reserve.Clear();
            Loose.AddRange(Bag.Draw(drawCount, rng));
            Changed?.Invoke();
        }

        // Mão → casa de página. Falha se a casa estiver ocupada ou não aceitar a ficha.
        public bool TryPlace(int page, int slot, TokenType t)
        {
            var p = Pages[page];
            if (p.Slots[slot].HasValue || !p.Def.slots[slot].Accepts(t)) return false;
            if (!Loose.Remove(t)) return false;
            p.Slots[slot] = t;
            Changed?.Invoke();
            return true;
        }

        // Casa de página → mão.
        public bool TryUnplace(int page, int slot)
        {
            var s = Pages[page].Slots[slot];
            if (!s.HasValue) return false;
            Loose.Add(s.Value);
            Pages[page].Slots[slot] = null;
            Changed?.Invoke();
            return true;
        }

        // Mão → Reserva. Ficha ruim não entra; Reserva cheia não aceita.
        public bool TryReserve(TokenType t)
        {
            if (t.IsBad() || Reserve.Count >= ReserveCapacity || !Loose.Remove(t)) return false;
            Reserve.Add(t);
            Changed?.Invoke();
            return true;
        }

        // Reserva → mão.
        public bool TryUnreserve(int index)
        {
            if (index < 0 || index >= Reserve.Count) return false;
            Loose.Add(Reserve[index]);
            Reserve.RemoveAt(index);
            Changed?.Invoke();
            return true;
        }

        // A página pode ser usada agora? Completa, com uso sobrando, e sem Medo se for Especial.
        public bool CanActivate(int page)
        {
            var p = Pages[page];
            if (!p.IsComplete || p.UsesLeft <= 0) return false;
            return !(HasFear && p.Def.kind == PageKind.Especial);
        }

        // Usa a página: as fichas vão para "gastas" e as casas ficam livres de novo
        // (para uma página com mais de 1 uso por rodada).
        public void ConsumePage(int page)
        {
            var p = Pages[page];
            p.UsesLeft--;
            for (int i = 0; i < p.Slots.Length; i++)
            {
                if (p.Slots[i].HasValue) _spent.Add(p.Slots[i].Value);
                p.Slots[i] = null;
            }
            Changed?.Invoke();
        }

        // Fim da rodada: gastas, fichas largadas em páginas e a mão voltam para a bag.
        // A Reserva fica.
        public void EndRound()
        {
            Bag.ReturnAll(_spent);
            _spent.Clear();
            foreach (var p in Pages)
                for (int i = 0; i < p.Slots.Length; i++)
                {
                    if (p.Slots[i].HasValue) Bag.Add(p.Slots[i].Value);
                    p.Slots[i] = null;
                }
            Bag.ReturnAll(Loose);
            Loose.Clear();
            Changed?.Invoke();
        }

        // Ficha nova entra na bag de combate (sai a partir da próxima rodada).
        public void AddToBag(TokenType t, int count)
        {
            Bag.Add(t, count);
            Changed?.Invoke();
        }

        // Tira uma ficha do combate, procurando na mão e depois na bag (tratar Ferida).
        public bool RemoveFromCombat(TokenType t)
        {
            bool ok = Loose.Remove(t) || Bag.Remove(t);
            if (ok) Changed?.Invoke();
            return ok;
        }

        // Tira todas as fichas de um tipo da mão e da bag (Grito de Guerra tira o Medo).
        public int RemoveAll(TokenType t)
        {
            int n = Loose.RemoveAll(x => x == t);
            while (Bag.Remove(t)) n++;
            if (n > 0) Changed?.Invoke();
            return n;
        }
    }
}
```

### 4.2 HeroUnit: o herói no mapa

```csharp
// Assets/_Project/Scripts/Core/HeroUnit.cs
using Bolsa.Data;

namespace Bolsa.Core
{
    // POR QUE: um herói no combate é uma Unit (posição, vida) com uma mão de fichas, e
    // algumas coisas que acontecem com ele valem para a run toda (recrutar, Ferida).
    // ESTRATÉGIA: estende Unit e guarda o HeroRunState. Ficha recrutada e Ferida entram
    // nas duas bags (combate e run); Medo entra só na de combate, por isso some sozinho
    // quando o combate acaba (Parte 1 §5).
    public class HeroUnit : Unit
    {
        public readonly HeroRunState Run;
        public readonly CombatHand Hand;

        // Cria o herói do combate a partir do estado da run.
        public HeroUnit(HeroRunState run, GameConfig cfg)
            : base(run.def.displayName, Team.Heroes, run.def.maxHp, run.hp)
        {
            Run = run;
            Hand = new CombatHand(run.bag, run.pages, cfg.ReserveSlots(run.reserveLevel));
        }

        // Recrutar: a ficha vale para este combate e para o resto da run.
        public void Recruit(TokenType t, int count)
        {
            Hand.AddToBag(t, count);
            for (int i = 0; i < count; i++) Run.bag.Add(t);
        }

        // Ferida: também fica na run até ser tratada.
        public void AddWound(int count) => Recruit(TokenType.Ferida, count);

        // Medo: só neste combate.
        public void AddFear(int count) => Hand.AddToBag(TokenType.Medo, count);

        // Trata 1 Ferida (run e combate). Devolve false se não havia.
        public bool TreatWound()
        {
            if (!Run.bag.Remove(TokenType.Ferida)) return false;
            Hand.RemoveFromCombat(TokenType.Ferida);
            return true;
        }

        // Tira todo o Medo.
        public int ClearFear() => Hand.RemoveAll(TokenType.Medo);
    }
}
```

### 4.3 Efeitos que mexem na bag

```csharp
// Assets/_Project/Scripts/Data/Effects/RecruitEffect.cs
using Bolsa.Core;
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: as páginas de Recrutar (Treino, Caçada, Estudo) põem fichas novas na bag,
    // como recrutar seguidores no Orléans (Parte 1 §6).
    // ESTRATÉGIA: só funciona se quem usa é um herói (inimigos não têm bag no MVP).
    [CreateAssetMenu(menuName = "Bolsa/Effects/Recruit")]
    public class RecruitEffect : AbilityEffect
    {
        public TokenType token = TokenType.Forca;
        public int count = 1;

        // Adiciona as fichas na bag do herói.
        public override void Apply(BattleContext ctx, Unit caster, Vector2Int target)
        {
            if (caster is not HeroUnit hero) return;
            hero.Recruit(token, count);
            ctx.Say($"{hero.Name} recruta +{count} {TokenRules.ShortName(token)}.");
        }
    }
}
```

```csharp
// Assets/_Project/Scripts/Data/Effects/TreatWoundEffect.cs
using Bolsa.Core;
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: a Atadura (Parte 1 §7.2) tira Ferida da bag de um aliado.
    // ESTRATÉGIA: alvo = herói na casa escolhida (TargetMode.Ally); se não houver, o próprio.
    [CreateAssetMenu(menuName = "Bolsa/Effects/Treat Wound")]
    public class TreatWoundEffect : AbilityEffect
    {
        public int count = 1;

        // Trata até 'count' Feridas.
        public override void Apply(BattleContext ctx, Unit caster, Vector2Int target)
        {
            var hero = ctx.Grid.UnitAt(target) as HeroUnit ?? caster as HeroUnit;
            if (hero == null) return;
            int n = 0;
            for (int i = 0; i < count && hero.TreatWound(); i++) n++;
            ctx.Say(n > 0 ? $"{hero.Name}: {n} Ferida(s) tratada(s)." : $"{hero.Name} não tinha Ferida.");
        }
    }
}
```

```csharp
// Assets/_Project/Scripts/Data/Effects/ClearFearEffect.cs
using Bolsa.Core;
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: o Grito de Guerra tira o Medo dos aliados próximos (Parte 1 §7.2).
    // ESTRATÉGIA: página sem alvo (TargetMode.None): a área é centrada no próprio herói.
    [CreateAssetMenu(menuName = "Bolsa/Effects/Clear Fear")]
    public class ClearFearEffect : AbilityEffect
    {
        public int radius = 3;

        // Tira o Medo de cada herói na área.
        public override void Apply(BattleContext ctx, Unit caster, Vector2Int target)
        {
            foreach (var cell in ctx.Grid.CellsInRadius(target, radius))
                if (ctx.Grid.UnitAt(cell) is HeroUnit h && h.ClearFear() > 0)
                    ctx.Say($"{h.Name} perde o Medo.");
        }
    }
}
```

Crie agora os assets que faltaram na Fase 3: `Recruit_Forca`, `Recruit_Agilidade`, `Recruit_Mana` (Recruit, count 1), `Treat1`, `ClearFear3`, e as páginas `Treino`, `Cacada`, `Estudo` (slots Foco + Qualquer, target None), `Atadura` (Foco + Qualquer, target Ally, range 1, Treat1) e `GritoDeGuerra` (Força + Foco, target None, ClearFear3). Ponha as de Recrutar no `startingPages` de cada herói.

### 4.4 Fichas arrastáveis e zonas de soltar

O livro usa a UI clássica da Unity (uGUI). Arrastar e soltar vem pronto do `EventSystem` por interfaces: quem implementa `IBeginDragHandler`/`IDragHandler`/`IEndDragHandler` pode ser arrastado; quem implementa `IDropHandler` recebe o que foi solto em cima.

```csharp
// Assets/_Project/Scripts/UI/TokenChip.cs
using Bolsa.Data;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Bolsa.UI
{
    // De onde a ficha está saindo quando é arrastada.
    public enum ChipPlace { Hand, Slot, Reserve }

    // POR QUE: o jogador monta a estratégia arrastando fichas (Parte 1 §9, passo 3).
    // ESTRATÉGIA: a ficha na tela só sabe o tipo e de onde veio (mão, casa X da página Y,
    // casa Z da Reserva). Durante o arraste ela sobe para uma camada por cima de tudo
    // (DragLayer) e desliga blocksRaycasts, para o mouse "enxergar" a zona embaixo dela.
    // Quem decide se o movimento vale é o HeroBookPanel (via CombatHand). Ao soltar,
    // o painel redesenha tudo, e a ficha aparece no lugar certo (ou volta para onde estava).
    public class TokenChip : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler
    {
        [SerializeField] private Image _background;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private CanvasGroup _group;

        public TokenType Token { get; private set; }
        public ChipPlace Place { get; private set; }
        public int PageIndex { get; private set; }
        public int SlotIndex { get; private set; }   // casa da página, ou casa da Reserva

        HeroBookPanel _panel;

        // Preenche a ficha. 'page'/'slot' só valem para ChipPlace.Slot/Reserve.
        public void Setup(HeroBookPanel panel, TokenType token, ChipPlace place, int page = -1, int slot = -1)
        {
            _panel = panel;
            Token = token;
            Place = place;
            PageIndex = page;
            SlotIndex = slot;
            _background.color = TokenRules.ColorOf(token);
            _label.text = TokenRules.ShortName(token);
        }

        // Começo do arraste. Ficha ruim e livro travado (mirando, turno inimigo) não arrastam:
        // zerar pointerDrag cancela o arraste.
        public void OnBeginDrag(PointerEventData e)
        {
            if (!_panel.CanEdit || Token.IsBad()) { e.pointerDrag = null; return; }
            transform.SetParent(_panel.DragLayer, true);
            _group.blocksRaycasts = false;
        }

        // Segue o mouse (num Canvas "Screen Space - Overlay", posição de tela = posição do objeto).
        public void OnDrag(PointerEventData e) => transform.position = e.position;

        // Fim do arraste: se não caiu numa zona, redesenhar devolve a ficha ao lugar.
        public void OnEndDrag(PointerEventData e)
        {
            _group.blocksRaycasts = true;
            _panel.Rebuild();
        }
    }
}
```

```csharp
// Assets/_Project/Scripts/UI/DropZone.cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Bolsa.UI
{
    public enum DropKind { Hand, Slot, Reserve }

    // POR QUE: a mão, cada casa de página e cada casa da Reserva recebem fichas soltas.
    // ESTRATÉGIA: a zona só diz o que ela é e repassa para o painel. Precisa de um Image
    // com Raycast Target ligado, senão o mouse não a "vê". Se a ficha for solta em cima
    // de outra ficha que já está na casa, o EventSystem sobe na hierarquia até achar um
    // IDropHandler, então a casa recebe mesmo assim.
    public class DropZone : MonoBehaviour, IDropHandler
    {
        [SerializeField] private Image _background;
        [SerializeField] private TMP_Text _label;

        public DropKind Kind { get; private set; }
        public int PageIndex { get; private set; }
        public int SlotIndex { get; private set; }

        HeroBookPanel _panel;

        // Define o que esta zona é e como ela aparece vazia (rótulo e cor da exigência).
        public void Setup(HeroBookPanel panel, DropKind kind, int page = -1, int slot = -1,
                          string label = "", Color? color = null)
        {
            _panel = panel;
            Kind = kind;
            PageIndex = page;
            SlotIndex = slot;
            if (_label != null) _label.text = label;
            if (_background != null && color.HasValue)
                _background.color = new Color(color.Value.r, color.Value.g, color.Value.b, 0.35f);
        }

        // Recebe a ficha solta.
        public void OnDrop(PointerEventData e)
        {
            var chip = e.pointerDrag != null ? e.pointerDrag.GetComponent<TokenChip>() : null;
            if (chip != null) _panel.MoveChip(chip, this);
        }
    }
}
```

### 4.5 O livro na tela

```csharp
// Assets/_Project/Scripts/UI/PageRowView.cs
using Bolsa.Core;
using Bolsa.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Bolsa.UI
{
    // POR QUE: cada página do livro aparece como uma linha: nome, descrição, as casas e
    // o botão Usar (Parte 1 §14).
    // ESTRATÉGIA: a linha é recriada do zero a cada mudança (o painel destrói e
    // instancia de novo). Para poucas páginas isso é barato e evita bug de UI dessincronizada.
    public class PageRowView : MonoBehaviour
    {
        [SerializeField] private TMP_Text _title;
        [SerializeField] private TMP_Text _description;
        [SerializeField] private Transform _slotsRow;
        [SerializeField] private Button _useButton;

        // Monta a linha da página 'index'.
        public void Setup(HeroBookPanel panel, int index, PageProgress p, bool canUse,
                          DropZone slotPrefab, TokenChip chipPrefab)
        {
            _title.text = $"{p.Def.displayName}  <size=70%>[{p.Def.kind}]</size>" +
                          (p.UsesLeft <= 0 ? "  <color=#999>(usada)</color>" : "");
            _description.text = p.Def.description;

            for (int s = 0; s < p.Slots.Length; s++)
            {
                var req = p.Def.slots[s];
                var zone = Instantiate(slotPrefab, _slotsRow);
                zone.Setup(panel, DropKind.Slot, index, s, TokenRules.ShortName(req), TokenRules.ColorOf(req));
                if (p.Slots[s].HasValue)
                    Instantiate(chipPrefab, zone.transform).Setup(panel, p.Slots[s].Value, ChipPlace.Slot, index, s);
            }

            _useButton.interactable = canUse;
            _useButton.onClick.AddListener(() => panel.RequestUse(index));
        }
    }
}
```

```csharp
// Assets/_Project/Scripts/UI/HeroBookPanel.cs
using System;
using System.Linq;
using Bolsa.Core;
using Bolsa.Data;
using TMPro;
using UnityEngine;

namespace Bolsa.UI
{
    // POR QUE: o painel de baixo da tela mostra o livro do herói selecionado: dados do
    // herói, composição da bag, a mão, a Reserva e as páginas (Parte 1 §14).
    // ESTRATÉGIA: Bind() liga o painel a um HeroUnit e escuta o evento Changed da mão;
    // a cada mudança, Rebuild() apaga e recria fichas, casas e páginas. MoveChip() é a
    // única porta de entrada do arraste: primeiro devolve a ficha para a mão, depois
    // tenta pô-la no destino; se o destino recusar, ela fica na mão.
    public class HeroBookPanel : MonoBehaviour
    {
        [SerializeField] private TMP_Text _header;
        [SerializeField] private TMP_Text _bagInfo;
        [SerializeField] private DropZone _handZone;
        [SerializeField] private Transform _handRow;
        [SerializeField] private Transform _reserveRow;
        [SerializeField] private Transform _pagesList;
        [SerializeField] private Transform _dragLayer;
        [SerializeField] private TokenChip _chipPrefab;
        [SerializeField] private DropZone _slotPrefab;
        [SerializeField] private PageRowView _pagePrefab;

        public Transform DragLayer => _dragLayer;
        public HeroUnit Hero { get; private set; }

        // Desligado enquanto o jogador mira ou os inimigos agem.
        public bool CanEdit { get; set; } = true;

        // Avisa o BattleController: "o jogador quer usar a página i deste herói".
        public event Action<HeroUnit, int> UseRequested;

        // Mostra o livro deste herói.
        public void Bind(HeroUnit hero)
        {
            if (Hero != null) Hero.Hand.Changed -= Rebuild;
            Hero = hero;
            Hero.Hand.Changed += Rebuild;
            _handZone.Setup(this, DropKind.Hand);
            Rebuild();
        }

        // Se o painel for destruído, para de escutar a mão (evita erro de objeto destruído).
        void OnDestroy()
        {
            if (Hero != null) Hero.Hand.Changed -= Rebuild;
        }

        // Chamado pela linha da página quando o botão Usar é clicado.
        public void RequestUse(int pageIndex) => UseRequested?.Invoke(Hero, pageIndex);

        // Move a ficha arrastada para a zona onde foi solta.
        public void MoveChip(TokenChip chip, DropZone zone)
        {
            if (!CanEdit || Hero == null) return;
            var hand = Hero.Hand;

            if (chip.Place == ChipPlace.Slot) hand.TryUnplace(chip.PageIndex, chip.SlotIndex);
            else if (chip.Place == ChipPlace.Reserve) hand.TryUnreserve(chip.SlotIndex);

            if (zone.Kind == DropKind.Slot) hand.TryPlace(zone.PageIndex, zone.SlotIndex, chip.Token);
            else if (zone.Kind == DropKind.Reserve) hand.TryReserve(chip.Token);

            Rebuild();
        }

        // Apaga e recria tudo a partir do estado da mão.
        public void Rebuild()
        {
            if (Hero == null) return;
            var hand = Hero.Hand;
            var cfg = GameConfig.Get();

            _header.text = $"{Hero.Name}   PV {Hero.Hp}/{Hero.MaxHp}" +
                           $"   Fôlego {Hero.Run.breathLevel} ({cfg.DrawCount(Hero.Run.breathLevel)} fichas)" +
                           $"   Reserva {hand.ReserveCapacity}" +
                           (hand.HasFear ? "   <color=#c08cff>COM MEDO: sem Especiais</color>" : "");

            var types = (TokenType[])Enum.GetValues(typeof(TokenType));
            _bagInfo.text = "Na bag: " + string.Join("  ",
                types.Where(t => hand.Bag.CountOf(t) > 0).Select(t => $"{TokenRules.ShortName(t)} {hand.Bag.CountOf(t)}"));

            Clear(_handRow);
            Clear(_reserveRow);
            Clear(_pagesList);

            foreach (var t in hand.Loose)
                Instantiate(_chipPrefab, _handRow).Setup(this, t, ChipPlace.Hand);

            for (int i = 0; i < hand.ReserveCapacity; i++)
            {
                var zone = Instantiate(_slotPrefab, _reserveRow);
                zone.Setup(this, DropKind.Reserve, -1, i, "RES", Color.white);
                if (i < hand.Reserve.Count)
                    Instantiate(_chipPrefab, zone.transform).Setup(this, hand.Reserve[i], ChipPlace.Reserve, -1, i);
            }

            for (int i = 0; i < hand.Pages.Count; i++)
                Instantiate(_pagePrefab, _pagesList)
                    .Setup(this, i, hand.Pages[i], CanEdit && hand.CanActivate(i), _slotPrefab, _chipPrefab);
        }

        // Destrói todos os filhos de um container.
        static void Clear(Transform t)
        {
            for (int i = t.childCount - 1; i >= 0; i--) Destroy(t.GetChild(i).gameObject);
        }
    }
}
```

### 4.6 Montar a UI na cena `Battle`

1. **Canvas** (GameObject → UI → Canvas): **Render Mode = Screen Space - Overlay**; no **Canvas Scaler**, **Scale With Screen Size**, referência **1920 × 1080**, **Match = 0.5**.
2. **Prefabs** (em `Assets/_Project/Prefabs/UI/`):
   - `TokenChip`: `Image` 44×44 (fundo, Raycast Target ligado) + `CanvasGroup` + filho TMP com o rótulo; script `TokenChip`. Âncora e pivô no centro.
   - `Slot`: `Image` 50×50 (Raycast Target **ligado**) + filho TMP `Label` + script `DropZone`.
   - `PageRow`: `Horizontal Layout Group`; filhos: um bloco vertical com `Title` e `Description` (TMP), um `Slots` com `Horizontal Layout Group`, e um `Button` "Usar"; script `PageRowView`.
3. **BookPanel** (filho do Canvas, ancorado embaixo, ~1920 × 360) com o script `HeroBookPanel`:
   - `Header` e `BagInfo` (TMP).
   - `HandZone`: `Image` quase transparente (alfa 0,1, Raycast Target ligado) + `DropZone`; dentro, `HandRow` com `Horizontal Layout Group`.
   - `ReserveRow`: `Horizontal Layout Group`.
   - `Pages`: um **Scroll View**; o `Content` dele ganha `Vertical Layout Group` + `Content Size Fitter (Vertical Fit = Preferred)` e é o `_pagesList`.
4. **DragLayer**: um `RectTransform` vazio, **último filho do Canvas** (desenha por cima de tudo), esticado na tela inteira, sem `Image`.

### 4.7 Teste da fase: BookSandbox

```csharp
// Assets/_Project/Scripts/Battle/BookSandbox.cs
using Bolsa.Core;
using Bolsa.Data;
using Bolsa.UI;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Bolsa.Battle
{
    // POR QUE: testar a mão e o livro sem o mapa.
    // ESTRATÉGIA: cria um herói, começa uma rodada e liga o painel. Usar uma página só
    // gasta as fichas e escreve no Console. N encerra a rodada e começa outra. Apague
    // depois da fase.
    public class BookSandbox : MonoBehaviour
    {
        [SerializeField] private HeroDef _hero;
        [SerializeField] private HeroBookPanel _panel;

        HeroUnit _unit;
        readonly System.Random _rng = new(7);

        void Start()
        {
            _unit = new HeroUnit(HeroRunState.New(_hero), GameConfig.Get());
            _unit.Hand.StartRound(GameConfig.Get().DrawCount(0), _rng);
            _panel.Bind(_unit);
            _panel.UseRequested += (h, i) =>
            {
                Debug.Log($"Usou {h.Hand.Pages[i].Def.displayName}");
                h.Hand.ConsumePage(i);
            };
        }

        // N = nova rodada.
        void Update()
        {
            if (Keyboard.current == null || !Keyboard.current.nKey.wasPressedThisFrame) return;
            _unit.Hand.EndRound();
            _unit.Hand.StartRound(GameConfig.Get().DrawCount(0), _rng);
        }
    }
}
```

### ✅ Checkpoint da Fase 4
- O painel mostra 4 fichas na mão do Mago, 1 casa de Reserva e as 5 páginas.
- Arrastar Mana para a casa "MAN" da Faísca encaixa; arrastar Mana para uma casa "FOC" não encaixa (a ficha volta para a mão).
- Com a Faísca completa, o botão Usar acende; ao usar, as fichas somem da página e o Console escreve a página.
- Guardar 1 ficha na Reserva e apertar N: a ficha guardada aparece na mão **além** de 4 novas; "Na bag" soma de novo as fichas usadas.
- O total de fichas (bag + mão + páginas + Reserva) é sempre 8 + as recrutadas.

#### Problemas comuns
- **A ficha não "cai" na casa:** o `Image` da casa está com **Raycast Target** desligado, ou a ficha não desligou `blocksRaycasts` durante o arraste (falta o `CanvasGroup` no prefab).
- **A ficha some ao arrastar:** o `DragLayer` está atrás do painel na hierarquia. Ele precisa ser o último filho do Canvas.
- **O arraste não começa:** falta o **EventSystem** na cena, ou o módulo dele é o antigo (troque por `InputSystemUIInputModule`).

Próxima fase: **Rodada e Execução**.

---

# Parte 8 — Implementação Unity: Fase 5 (Rodada e Execução)

## Fase 5 — Rodada e Execução

> Objetivo desta fase: o combate jogável de ponta a ponta contra bonecos parados: sorteio, planejar, mirar no mapa, executar, encerrar turno e limpar.

### 5.1 BattleController

```csharp
// Assets/_Project/Scripts/Battle/BattleController.cs
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Bolsa.Core;
using Bolsa.Data;
using Bolsa.UI;
using Bolsa.View;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace Bolsa.Battle
{
    // POR QUE: alguém precisa conduzir a rodada da Parte 1 §9 e ligar as peças: regras
    // (BattleContext, CombatHand), mapa (GridView, UnitView, CellPicker) e UI (livro,
    // abas, botão Encerrar turno, log).
    // ESTRATÉGIA: uma pequena máquina de estados (Phase). Em Planning o jogador mexe nas
    // fichas e pede para usar páginas; se a página pede alvo, vai para Targeting e
    // destaca as casas válidas; o clique válido executa os efeitos (Busy). As regras
    // disparam eventos que viram animações numa fila (_anims), tocadas em ordem, para
    // que "anda e depois bate" apareça nessa ordem na tela. Os três métodos marcados
    // "Fase 6" e os dois marcados "Fase 7" são trocados nessas fases.
    public class BattleController : MonoBehaviour
    {
        enum Phase { Planning, Targeting, Busy, Over }

        [Header("Cena")]
        [SerializeField] private GridView _gridView;
        [SerializeField] private CellPicker _picker;
        [SerializeField] private UnitView _unitPrefab;
        [SerializeField] private HeroBookPanel _book;
        [SerializeField] private Button _endTurnButton;
        [SerializeField] private Button[] _heroTabs;
        [SerializeField] private TMP_Text _log;
        [SerializeField] private GameObject _resultPanel;
        [SerializeField] private TMP_Text _resultText;
        [SerializeField] private Button _resultButton;

        [Header("Campo")]
        [SerializeField] private int _width = 10;
        [SerializeField] private int _height = 8;
        [SerializeField] private int _obstacles = 8;

        [Header("Teste (cena aberta direto, sem run)")]
        [SerializeField] private HeroDef[] _testHeroes;
        [SerializeField] private Sprite _dummySprite;
        [SerializeField] private int _seed = 1;

        GameConfig _cfg;
        BattleContext _ctx;
        readonly List<HeroUnit> _heroes = new();
        readonly Dictionary<Unit, UnitView> _views = new();
        readonly Queue<IEnumerator> _anims = new();
        readonly List<string> _logLines = new();

        Phase _phase;
        int _round;
        HeroUnit _selected;
        HeroUnit _pendingHero;
        int _pendingPage;
        HashSet<Vector2Int> _pendingCells;

        // Start: monta o combate e começa a primeira rodada.
        void Start()
        {
            _cfg = GameConfig.Get();
            SetupBattle();
            BeginRound();
        }

        // ---------- Montagem ----------

        // Cria grid, obstáculos, heróis, inimigos e liga os eventos.
        void SetupBattle()
        {
            int seed = Seed();
            var grid = new BattleGrid(_width, _height);
            _ctx = new BattleContext(grid, seed);
            var rng = new System.Random(seed + 1);

            for (int i = 0; i < _obstacles; i++)
                grid.SetBlocked(new Vector2Int(rng.Next(2, _width - 2), rng.Next(0, _height)), true);
            _gridView.Build(grid, rng);

            foreach (var run in HeroRunStates())
            {
                var hero = new HeroUnit(run, _cfg);
                _heroes.Add(hero);
                _ctx.AddUnit(hero, FreeCell(0, 1, rng));
                SpawnView(hero, run.def.battleSprite, false);
            }
            SpawnEnemies(rng);

            _ctx.Moved += (u, path) => _anims.Enqueue(_views[u].WalkPath(path));
            _ctx.Damaged += (u, dmg) => _anims.Enqueue(_views[u].HitFlash());
            _ctx.Died += u => _anims.Enqueue(_views[u].FadeOut());
            _ctx.Changed += u => _views[u].Refresh();
            _ctx.Log += AddLog;

            _picker.Clicked += OnCellClicked;
            _picker.Cancelled += CancelTargeting;
            _book.UseRequested += OnUseRequested;
            _endTurnButton.onClick.AddListener(OnEndTurn);
            for (int i = 0; i < _heroTabs.Length && i < _heroes.Count; i++)
            {
                int k = i; // cópia local: o lambda guarda a variável, não o valor
                _heroTabs[i].onClick.AddListener(() => Select(_heroes[k]));
            }
            _resultPanel.SetActive(false);
            Select(_heroes[0]);
        }

        // Uma casa livre sorteada entre as colunas minX..maxX.
        Vector2Int FreeCell(int minX, int maxX, System.Random rng)
        {
            while (true)
            {
                var c = new Vector2Int(rng.Next(minX, maxX + 1), rng.Next(0, _height));
                if (_ctx.Grid.IsFree(c)) return c;
            }
        }

        // Instancia o prefab de unidade e guarda no dicionário unidade → view.
        void SpawnView(Unit u, Sprite sprite, bool faceLeft)
        {
            var view = Instantiate(_unitPrefab);
            view.Bind(u, _gridView, sprite, faceLeft);
            _views[u] = view;
        }

        // Fase 7 troca: os heróis vêm da run.
        List<HeroRunState> HeroRunStates() => _testHeroes.Select(HeroRunState.New).ToList();

        // Fase 7 troca: a semente vem da run.
        int Seed() => _seed;

        // Fase 6 troca: inimigos de verdade. Aqui, 3 bonecos que não fazem nada.
        void SpawnEnemies(System.Random rng)
        {
            for (int i = 0; i < 3; i++)
            {
                var dummy = new Unit($"Boneco {i + 1}", Team.Enemies, 10, 10);
                _ctx.AddUnit(dummy, FreeCell(_width - 2, _width - 1, rng));
                SpawnView(dummy, _dummySprite, true);
            }
        }

        // Fase 6 troca: cada inimigo escolhe a intenção da rodada.
        void PlanIntents() { }

        // Fase 6 troca: os inimigos agem.
        IEnumerator EnemyPhase() { yield break; }

        // ---------- Rodada ----------

        // Passo 1 e 2 da rodada: intenções e sorteio.
        void BeginRound()
        {
            _round++;
            AddLog($"--- Rodada {_round} ---");
            foreach (var h in _heroes.Where(h => h.Alive))
                h.Hand.StartRound(_cfg.DrawCount(h.Run.breathLevel), _ctx.Rng);
            PlanIntents();
            EnterPlanning();
        }

        // Volta para o planejamento (livro e botão liberados).
        void EnterPlanning()
        {
            _phase = Phase.Planning;
            _book.CanEdit = true;
            _endTurnButton.interactable = true;
            RefreshTabs();
            _book.Rebuild();
        }

        // Seleciona o herói cujo livro aparece embaixo.
        void Select(HeroUnit h)
        {
            if (h == null || !h.Alive || _phase == Phase.Targeting) return;
            _selected = h;
            _book.Bind(h);
            RefreshTabs();
        }

        // Atualiza o texto das abas (nome e PV; "*" no selecionado).
        void RefreshTabs()
        {
            for (int i = 0; i < _heroTabs.Length && i < _heroes.Count; i++)
            {
                var h = _heroes[i];
                _heroTabs[i].GetComponentInChildren<TMP_Text>().text =
                    (h == _selected ? "* " : "") + (h.Alive ? $"{h.Name} {h.Hp}/{h.MaxHp}" : $"{h.Name} (caído)");
                _heroTabs[i].interactable = h.Alive;
            }
        }

        // Passo 3: o jogador pediu para usar uma página completa.
        void OnUseRequested(HeroUnit hero, int page)
        {
            if (_phase != Phase.Planning || !hero.Hand.CanActivate(page)) return;
            var def = hero.Hand.Pages[page].Def;
            var cells = TargetRules.ValidCells(_ctx, hero, def);
            if (cells.Count == 0) { AddLog($"{def.displayName}: nenhum alvo válido."); return; }

            if (def.target == TargetMode.None)
            {
                StartCoroutine(Resolve(hero, page, hero.Cell));
                return;
            }
            _pendingHero = hero;
            _pendingPage = page;
            _pendingCells = cells;
            _gridView.ShowHighlight(cells);
            _phase = Phase.Targeting;
            _book.CanEdit = false;
            _book.Rebuild();
            AddLog($"{def.displayName}: escolha o alvo (botão direito cancela).");
        }

        // Clique no mapa: escolhe alvo (mirando) ou seleciona herói (planejando).
        void OnCellClicked(Vector2Int cell)
        {
            if (_phase == Phase.Targeting)
            {
                if (_pendingCells.Contains(cell))
                {
                    _gridView.ClearHighlight();
                    StartCoroutine(Resolve(_pendingHero, _pendingPage, cell));
                }
                else CancelTargeting();
                return;
            }
            if (_phase == Phase.Planning && _ctx.Grid.UnitAt(cell) is HeroUnit h) Select(h);
        }

        // Sai do modo de mira sem gastar nada.
        void CancelTargeting()
        {
            if (_phase != Phase.Targeting) return;
            _gridView.ClearHighlight();
            EnterPlanning();
        }

        // Executa a página: gasta as fichas, roda os efeitos e toca as animações.
        IEnumerator Resolve(HeroUnit hero, int page, Vector2Int cell)
        {
            _phase = Phase.Busy;
            _book.CanEdit = false;
            _endTurnButton.interactable = false;

            var def = hero.Hand.Pages[page].Def;
            hero.Hand.ConsumePage(page);
            AddLog($"{hero.Name} usa {def.displayName}.");
            foreach (var effect in def.effects) effect.Apply(_ctx, hero, cell);

            yield return PlayAnimations();
            if (CheckEnd()) yield break;
            EnterPlanning();
        }

        // Toca a fila de animações, uma depois da outra.
        IEnumerator PlayAnimations()
        {
            while (_anims.Count > 0) yield return StartCoroutine(_anims.Dequeue());
        }

        // Passos 4 a 6: encerrar turno, inimigos, limpeza e nova rodada.
        void OnEndTurn()
        {
            if (_phase == Phase.Planning) StartCoroutine(EndTurn());
        }

        IEnumerator EndTurn()
        {
            _phase = Phase.Busy;
            _book.CanEdit = false;
            _endTurnButton.interactable = false;
            _book.Rebuild();

            yield return EnemyPhase();
            yield return PlayAnimations();
            if (CheckEnd()) yield break;

            foreach (var h in _heroes.Where(h => h.Alive))
            {
                h.Hand.EndRound();
                h.Shield = 0; // o escudo dura até o fim do turno inimigo (Parte 1 §9)
                _ctx.NotifyChanged(h);
            }
            if (!_selected.Alive) Select(_heroes.First(h => h.Alive));
            BeginRound();
        }

        // ---------- Fim do combate ----------

        // Vitória (sem inimigos) ou derrota (sem heróis)?
        bool CheckEnd()
        {
            bool won = !_ctx.Living(Team.Enemies).Any();
            bool lost = !_ctx.Living(Team.Heroes).Any();
            if (!won && !lost) return false;

            _phase = Phase.Over;
            _book.CanEdit = false;
            _endTurnButton.interactable = false;
            if (won) WriteBackToRun();
            FinishBattle(won);
            return true;
        }

        // Leva vida e Feridas de volta para a run (Parte 1 §10: quem caiu volta com 1 PV e 2 Feridas).
        void WriteBackToRun()
        {
            foreach (var h in _heroes)
            {
                if (h.Alive) { h.Run.hp = h.Hp; continue; }
                h.Run.hp = _cfg.knockoutHp;
                for (int i = 0; i < _cfg.woundsOnKnockout; i++) h.Run.bag.Add(TokenType.Ferida);
            }
        }

        // Fase 7 troca: voltar para o mapa da run. Aqui, só mostra o resultado e reinicia.
        void FinishBattle(bool won)
        {
            _resultPanel.SetActive(true);
            _resultText.text = won ? "Vitória!" : "Derrota...";
            _resultButton.onClick.RemoveAllListeners();
            _resultButton.onClick.AddListener(() => SceneManager.LoadScene(SceneManager.GetActiveScene().name));
        }

        // Guarda as últimas 6 linhas do log.
        void AddLog(string line)
        {
            _logLines.Add(line);
            if (_logLines.Count > 6) _logLines.RemoveAt(0);
            _log.text = string.Join("\n", _logLines);
        }
    }
}
```

### 5.2 Montar a cena

1. Apague `GridSandbox` e `BookSandbox` da cena (os scripts podem ficar no projeto).
2. No GameObject `Battle`, adicione `BattleController` e ligue: `GridView`, `CellPicker`, prefab `UnitView`, `BookPanel`.
3. Crie no Canvas:
   - três **Buttons** de aba (Guerreiro, Arqueiro, Mago), na mesma ordem dos `_testHeroes`;
   - um **Button** "Encerrar turno";
   - um TMP `Log` no canto superior esquerdo;
   - um `ResultPanel` (desativado) com um TMP e um **Button** "Continuar".
4. Em `_testHeroes`, arraste os três `HeroDef`. Em `_dummySprite`, qualquer sprite de monstro (ex.: o primeiro quadro de `lodo/parado-se`).

### ✅ Checkpoint da Fase 5
- Ao dar Play, os três heróis aparecem à esquerda, três bonecos à direita, e o livro mostra o Guerreiro com 4 fichas.
- Montar o Passo do Arqueiro e clicar Usar destaca as casas a até 2 passos; clicar numa delas anda; botão direito cancela sem gastar fichas.
- Flecha só destaca casas com boneco a até 5; acertar tira 2 PV e o boneco pisca.
- Encerrar turno: tudo volta para a bag, menos a Reserva, e uma rodada nova sorteia fichas para os três.
- Derrubar os três bonecos mostra "Vitória!"; Continuar reinicia a cena.
- Recrutar (Treino) faz o "Na bag" do Guerreiro mostrar +1 Força; a ficha pode sair já na rodada seguinte.

#### Problemas comuns
- **`KeyNotFoundException` no `_views[u]`:** alguma unidade foi adicionada ao contexto sem `SpawnView`. Todo `AddUnit` precisa do seu `SpawnView`.
- **O clique em Usar também conta como clique no mapa:** o `CellPicker` precisa do teste `IsPointerOverGameObject` (Fase 1) e o painel precisa de um `Image` de fundo com Raycast Target ligado.
- **A animação de andar acontece depois do dano:** os efeitos precisam ser aplicados todos antes do `PlayAnimations`, e na ordem da lista `effects` da página (Move antes de Damage na Investida).

Próxima fase: **Inimigos e Intenções**.

---

# Parte 9 — Implementação Unity: Fase 6 (Inimigos e Intenções)

## Fase 6 — Inimigos e Intenções

> Objetivo desta fase: os monstros da Floresta (Parte 1 §11) com intenção visível, perseguição pelo grid, ataque, Ferida e Medo.

### 6.1 Dados de inimigo e de encontro

```csharp
// Assets/_Project/Scripts/Data/EnemyDef.cs
using System.Collections.Generic;
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: cada monstro da tabela da Parte 1 §11 é um conjunto de números.
    // ESTRATÉGIA: um asset por monstro. "shoutEveryNRounds" > 0 faz o monstro gritar
    // (Medo) nessas rodadas em vez de atacar; "woundOnHit" põe Ferida quando o golpe fere.
    [CreateAssetMenu(menuName = "Bolsa/Enemy")]
    public class EnemyDef : ScriptableObject
    {
        public string id;
        public string displayName;
        public Sprite sprite;
        public int maxHp = 10;
        public int move = 3;
        public int range = 1;
        public int damage = 3;
        public bool woundOnHit;
        public int shoutEveryNRounds;
        public int shoutRadius = 3;
        public int fearAmount = 1;
    }

    public enum EncounterTier { Normal, Elite, Boss }

    // POR QUE: um nó de combate do mapa (Fase 7) precisa saber quem aparece e quanto paga.
    // ESTRATÉGIA: um asset por encontro, com a lista de monstros e a recompensa.
    [CreateAssetMenu(menuName = "Bolsa/Encounter")]
    public class EncounterDef : ScriptableObject
    {
        public string id;
        public EncounterTier tier;
        public List<EnemyDef> enemies = new();
        public int xpReward = 4;
        public int goldReward = 10;
    }
}
```

> A Unity exige que um `ScriptableObject` fique num arquivo com o mesmo nome da classe para o asset funcionar. Separe `EncounterDef` (e o enum `EncounterTier`) em `EncounterDef.cs`.

### 6.2 O inimigo no combate

```csharp
// Assets/_Project/Scripts/Core/EnemyUnit.cs
using Bolsa.Data;

namespace Bolsa.Core
{
    public enum IntentKind { Attack, Shout }

    // POR QUE: o inimigo mostra a intenção no começo da rodada e a cumpre depois
    // (Parte 1 §9 e §11). A intenção precisa ficar guardada entre esses dois momentos.
    // ESTRATÉGIA: Unit + o asset + a intenção atual (tipo e herói-alvo).
    public class EnemyUnit : Unit
    {
        public readonly EnemyDef Def;
        public IntentKind Intent;
        public HeroUnit IntentTarget;

        public EnemyUnit(EnemyDef def) : base(def.displayName, Team.Enemies, def.maxHp, def.maxHp) => Def = def;

        // Texto sobre a cabeça (sem emoji: a fonte do TMP não tem).
        public string IntentLabel => Intent == IntentKind.Shout
            ? "GRITO (Medo)"
            : IntentTarget != null ? $"ATQ {Def.damage} > {IntentTarget.Name}" : "";
    }
}
```

### 6.3 A IA

```csharp
// Assets/_Project/Scripts/Core/EnemyAI.cs
using System.Linq;
using UnityEngine;

namespace Bolsa.Core
{
    // POR QUE: os inimigos do MVP não têm bag; seguem uma regra simples e previsível,
    // que o jogador lê pela intenção e contorna (Parte 1 §11).
    // ESTRATÉGIA: Plan escolhe a intenção (gritar nas rodadas múltiplas de N, senão atacar
    // o herói mais perto). Execute cumpre: se o alvo ainda está vivo, persegue e ataca;
    // se o alvo já caiu, escolhe o mais perto. Andar usa o mesmo BFS dos heróis: procura
    // a casa mais próxima (em passos) de onde o alvo fica no alcance, e anda até 'move'
    // passos nessa direção.
    public static class EnemyAI
    {
        // Escolhe a intenção da rodada.
        public static void Plan(BattleContext ctx, EnemyUnit e, int round)
        {
            if (e.Def.shoutEveryNRounds > 0 && round % e.Def.shoutEveryNRounds == 0)
            {
                e.Intent = IntentKind.Shout;
                e.IntentTarget = null;
                return;
            }
            e.Intent = IntentKind.Attack;
            e.IntentTarget = Nearest(ctx, e);
        }

        // Herói vivo mais perto (distância de Manhattan).
        static HeroUnit Nearest(BattleContext ctx, EnemyUnit e) =>
            ctx.Living(Team.Heroes).OfType<HeroUnit>()
               .OrderBy(h => BattleGrid.Distance(h.Cell, e.Cell))
               .FirstOrDefault();

        // Cumpre a intenção.
        public static void Execute(BattleContext ctx, EnemyUnit e)
        {
            if (!e.Alive) return;

            if (e.Intent == IntentKind.Shout)
            {
                ctx.Say($"{e.Name} grita!");
                foreach (var cell in ctx.Grid.CellsInRadius(e.Cell, e.Def.shoutRadius))
                    if (ctx.Grid.UnitAt(cell) is HeroUnit h)
                    {
                        h.AddFear(e.Def.fearAmount);
                        ctx.Say($"{h.Name} ganha {e.Def.fearAmount} Medo.");
                    }
                return;
            }

            var target = e.IntentTarget != null && e.IntentTarget.Alive ? e.IntentTarget : Nearest(ctx, e);
            if (target == null) return;

            if (BattleGrid.Distance(e.Cell, target.Cell) > e.Def.range) MoveToward(ctx, e, target);
            if (BattleGrid.Distance(e.Cell, target.Cell) > e.Def.range) return; // fugiu: sem ataque

            int real = ctx.DealDamage(target, e.Def.damage, e);
            if (real > 0 && e.Def.woundOnHit)
            {
                target.AddWound(1);
                ctx.Say($"{target.Name} ganha 1 Ferida.");
            }
        }

        // Anda até 'move' passos em direção a uma casa de onde o alvo fica no alcance.
        static void MoveToward(BattleContext ctx, EnemyUnit e, HeroUnit target)
        {
            var dist = ctx.Grid.Reachable(e.Cell, 99);
            Vector2Int best = e.Cell;
            int bestSteps = int.MaxValue;

            foreach (var kv in dist)
                if (BattleGrid.Distance(kv.Key, target.Cell) <= e.Def.range && kv.Value < bestSteps)
                {
                    best = kv.Key;
                    bestSteps = kv.Value;
                }

            if (bestSteps == int.MaxValue) // nenhuma casa no alcance: chega o mais perto possível
            {
                int bestGap = BattleGrid.Distance(e.Cell, target.Cell);
                foreach (var kv in dist)
                {
                    int gap = BattleGrid.Distance(kv.Key, target.Cell);
                    if (kv.Value <= e.Def.move && gap < bestGap) { best = kv.Key; bestGap = gap; }
                }
            }

            var path = ctx.Grid.PathTo(e.Cell, best, 99);
            if (path == null) return;
            if (path.Count > e.Def.move) path = path.GetRange(0, e.Def.move);
            ctx.MoveAlong(e, path);
        }
    }
}
```

### 6.4 Trocar os métodos da Fase 5 no BattleController

Adicione o campo e a lista:

```csharp
        [Header("Encontro de teste (Fase 6)")]
        [SerializeField] private EncounterDef _testEncounter;

        readonly List<EnemyUnit> _enemies = new();
```

E substitua `SpawnEnemies`, `PlanIntents` e `EnemyPhase` por:

```csharp
        // Fase 7 troca: o encontro vem do nó da run.
        EncounterDef CurrentEncounter() => _testEncounter;

        // Cria os monstros do encontro nas duas colunas da direita.
        void SpawnEnemies(System.Random rng)
        {
            foreach (var def in CurrentEncounter().enemies)
            {
                var e = new EnemyUnit(def);
                _enemies.Add(e);
                _ctx.AddUnit(e, FreeCell(_width - 2, _width - 1, rng));
                SpawnView(e, def.sprite, true);
            }
        }

        // Cada inimigo vivo escolhe a intenção e a mostra sobre a cabeça.
        void PlanIntents()
        {
            foreach (var e in _enemies.Where(e => e.Alive))
            {
                EnemyAI.Plan(_ctx, e, _round);
                _views[e].SetIntent(e.IntentLabel);
            }
        }

        // Um inimigo de cada vez: apaga a intenção, age, anima, e para se o grupo cair.
        IEnumerator EnemyPhase()
        {
            foreach (var e in _enemies)
            {
                if (!e.Alive) continue;
                _views[e].SetIntent("");
                EnemyAI.Execute(_ctx, e);
                yield return PlayAnimations();
                yield return new WaitForSeconds(0.2f);
                if (!_ctx.Living(Team.Heroes).Any()) yield break;
            }
        }
```

### 6.5 Criar os assets

1. **Inimigos** (`Assets/_Project/Data/Enemies/`): `Lobo`, `Javali`, `Bandido`, `Lodo`, `Grifo`, com os números da tabela da Parte 1 §11 e o primeiro quadro de `parado-se` de cada pasta em `sprite`. Lobo e Grifo: `shoutEveryNRounds = 3`.
2. **Encontros** (`Assets/_Project/Data/Encounters/`), proposta para começar:

| Asset | tier | enemies | xp | ouro |
| --- | --- | --- | --- | --- |
| `Floresta_Lobos` | Normal | Lobo, Lobo | 4 | 10 |
| `Floresta_Estrada` | Normal | Bandido, Javali | 4 | 10 |
| `Floresta_Brejo` | Normal | Lodo, Lodo, Lobo | 4 | 10 |
| `Floresta_Elite` | Elite | Javali, Javali, Bandido, Lobo | 7 | 20 |
| `Floresta_Chefe` | Boss | Grifo, Lobo | 10 | 40 |

3. Ligue `Floresta_Lobos` em `_testEncounter`.

### ✅ Checkpoint da Fase 6
- No começo da rodada, cada lobo mostra "ATQ 3 > (herói mais perto)"; na rodada 3, "GRITO (Medo)".
- Encerrar turno: o lobo anda contornando pedras até ficar adjacente e ataca; se o herói-alvo se afastou mais do que o lobo anda, o lobo só anda.
- Depois do grito, a próxima rodada de quem estava perto pode tirar fichas MED; com MED na mão, os botões Usar das Especiais ficam apagados e o cabeçalho avisa "COM MEDO".
- O javali que fere põe FER na bag; vencer o combate e abrir de novo mostra a Ferida ainda lá (Fase 7 confirma isso entre combates).
- Um herói que cai sai do mapa e a aba dele mostra "(caído)"; os três caídos mostram "Derrota...".

#### Problemas comuns
- **O inimigo fica parado atrás de outro inimigo:** o BFS trata unidades como bloqueio, então numa fila estreita o de trás não acha caminho até o alcance e cai no "o mais perto possível". É o esperado no MVP; abra mais espaço reduzindo `_obstacles`.
- **A intenção não some ao morrer:** o `FadeOut` desativa o objeto inteiro, inclusive o texto; se continuar aparecendo, o texto não é filho do prefab da unidade.

Próxima fase: **Run Roguelite e Save**.

---

# Parte 10 — Implementação Unity: Fase 7 (Run Roguelite e Save)

## Fase 7 — Run Roguelite e Save

> Objetivo desta fase: a run inteira (Parte 1 §12): mapa de nós, combate, recompensa 1 de 3, níveis de trilha, Acampamento, Mercador, Chefe, derrota e save local entre nós.

### 7.1 Banco de dados dos assets

```csharp
// Assets/_Project/Scripts/Data/GameDatabase.cs
using System.Collections.Generic;
using UnityEngine;

namespace Bolsa.Data
{
    // POR QUE: o save guarda textos ("mago", "meteoro"), não referências a assets. Ao
    // carregar, é preciso achar o asset pelo id.
    // ESTRATÉGIA: um asset em Resources/ com a lista de todos os heróis, páginas e
    // encontros, e buscas por id.
    [CreateAssetMenu(menuName = "Bolsa/Game Database", fileName = "GameDatabase")]
    public class GameDatabase : ScriptableObject
    {
        public List<HeroDef> heroes = new();
        public List<PageDef> pages = new();
        public List<EncounterDef> encounters = new();

        public HeroDef Hero(string id) => heroes.Find(h => h.id == id);
        public PageDef Page(string id) => pages.Find(p => p.id == id);
        public EncounterDef Encounter(string id) => encounters.Find(e => e.id == id);
        public List<EncounterDef> ByTier(EncounterTier t) => encounters.FindAll(e => e.tier == t);

        static GameDatabase _cached;

        // Carrega (uma vez) Resources/GameDatabase.
        public static GameDatabase Get() => _cached ??= Resources.Load<GameDatabase>("GameDatabase");
    }
}
```

### 7.2 Estado da run e mapa

```csharp
// Assets/_Project/Scripts/Meta/RunState.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Bolsa.Core;

namespace Bolsa.Meta
{
    public enum NodeType { Combat, Elite, Camp, Merchant, Boss }

    // POR QUE: um nó do mapa da run (Parte 1 §12).
    // ESTRATÉGIA: [Serializable] deixa o JsonUtility gravar a classe no save. 'next' são
    // os ids dos nós da camada de cima ligados a este.
    [Serializable]
    public class MapNode
    {
        public int id;
        public int layer;
        public NodeType type;
        public List<int> next = new();
        public string encounterId;
    }

    // POR QUE: tudo que dura a run inteira: heróis, ouro, XP, mapa, onde o grupo está.
    // ESTRATÉGIA: uma classe comum; o SaveSystem converte para um formato de save.
    // 'nodeDone' diz se o nó atual já foi resolvido (falso = sair e voltar recomeça o nó).
    // NextRng() dá um gerador novo e reproduzível a cada uso, contando quantos já deu.
    public class RunState
    {
        public int seed;
        public int gold;
        public int xp;
        public int rngCounter;
        public int currentNode = -1;
        public bool nodeDone = true;
        public List<HeroRunState> heroes = new();
        public List<MapNode> map = new();

        public MapNode Current => currentNode >= 0 ? map[currentNode] : null;

        // Nós que dá para escolher agora.
        public IEnumerable<MapNode> Available =>
            currentNode < 0 ? map.Where(n => n.layer == 0) : Current.next.Select(i => map[i]);

        public Random NextRng() => new(seed * 1000 + rngCounter++);
    }
}
```

```csharp
// Assets/_Project/Scripts/Meta/MapGenerator.cs
using System.Collections.Generic;
using System.Linq;
using Bolsa.Data;

namespace Bolsa.Meta
{
    // POR QUE: cada run tem um mapa diferente de caminhos (Parte 1 §12).
    // ESTRATÉGIA: camadas de 2 ou 3 nós (a última só com o Chefe, a penúltima só com
    // Acampamento). Cada nó liga ao nó "na mesma altura" da camada de cima e, às vezes,
    // ao vizinho; depois garante que todo nó de cima tenha alguém chegando nele.
    public static class MapGenerator
    {
        // Gera o mapa inteiro a partir da semente.
        public static List<MapNode> Generate(int seed, int layers, GameDatabase db)
        {
            var rng = new System.Random(seed);
            var map = new List<MapNode>();
            var rows = new List<List<MapNode>>();

            for (int l = 0; l < layers; l++)
            {
                bool last = l == layers - 1, camp = l == layers - 2;
                int count = last || camp ? 1 : rng.Next(2, 4);
                var row = new List<MapNode>();
                for (int i = 0; i < count; i++)
                {
                    var type = last ? NodeType.Boss : camp ? NodeType.Camp : PickType(l, rng);
                    var node = new MapNode { id = map.Count, layer = l, type = type };
                    node.encounterId = type switch
                    {
                        NodeType.Combat => Pick(db.ByTier(EncounterTier.Normal), rng),
                        NodeType.Elite => Pick(db.ByTier(EncounterTier.Elite), rng),
                        NodeType.Boss => Pick(db.ByTier(EncounterTier.Boss), rng),
                        _ => "",
                    };
                    map.Add(node);
                    row.Add(node);
                }
                rows.Add(row);
            }

            for (int l = 0; l < layers - 1; l++)
            {
                List<MapNode> a = rows[l], b = rows[l + 1];
                for (int i = 0; i < a.Count; i++)
                {
                    int j = a.Count == 1 ? 0 : (int)System.Math.Round(i * (b.Count - 1) / (double)(a.Count - 1));
                    a[i].next.Add(b[j].id);
                    if (j + 1 < b.Count && rng.NextDouble() < 0.5) a[i].next.Add(b[j + 1].id);
                }
                for (int j = 0; j < b.Count; j++)
                    if (!a.Any(n => n.next.Contains(b[j].id)))
                        a[System.Math.Min(j, a.Count - 1)].next.Add(b[j].id);
            }
            return map;
        }

        // Sorteia o tipo de um nó do meio (Elite só a partir da 4ª camada).
        static NodeType PickType(int layer, System.Random rng)
        {
            if (layer == 0) return NodeType.Combat;
            double r = rng.NextDouble();
            if (r < 0.50) return NodeType.Combat;
            if (r < 0.65) return layer >= 3 ? NodeType.Elite : NodeType.Combat;
            if (r < 0.85) return NodeType.Camp;
            return NodeType.Merchant;
        }

        // Id de um encontro aleatório da lista.
        static string Pick(List<EncounterDef> list, System.Random rng) =>
            list.Count == 0 ? "" : list[rng.Next(list.Count)].id;
    }
}
```

### 7.3 Save local

```csharp
// Assets/_Project/Scripts/Meta/SaveSystem.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Bolsa.Core;
using Bolsa.Data;
using UnityEngine;

namespace Bolsa.Meta
{
    // Formato do save: só tipos simples, que o JsonUtility sabe gravar.
    [Serializable]
    public class HeroSave
    {
        public string heroId;
        public int hp, breathLevel, reserveLevel;
        public List<TokenType> bag = new();
        public List<string> pageIds = new();
    }

    [Serializable]
    public class RunSave
    {
        public int seed, gold, xp, rngCounter, currentNode;
        public bool nodeDone;
        public List<HeroSave> heroes = new();
        public List<MapNode> map = new();
    }

    // POR QUE: a run é salva entre nós (Parte 1 §16), offline.
    // ESTRATÉGIA: RunState → RunSave (ids no lugar de assets) → JSON → PlayerPrefs.
    // PlayerPrefs funciona igual no Windows e no build Web (lá ele vai para o
    // armazenamento do navegador), então não é preciso lidar com caminho de arquivo.
    // A chave tem versão (v1): se o formato mudar, troca a chave e o save velho é ignorado.
    public static class SaveSystem
    {
        const string Key = "bolsa.run.v1";

        public static bool HasSave => PlayerPrefs.HasKey(Key);

        // Grava a run.
        public static void Save(RunState r)
        {
            var s = new RunSave
            {
                seed = r.seed, gold = r.gold, xp = r.xp, rngCounter = r.rngCounter,
                currentNode = r.currentNode, nodeDone = r.nodeDone, map = r.map,
                heroes = r.heroes.Select(h => new HeroSave
                {
                    heroId = h.def.id, hp = h.hp, breathLevel = h.breathLevel, reserveLevel = h.reserveLevel,
                    bag = new List<TokenType>(h.bag), pageIds = h.pages.Select(p => p.id).ToList(),
                }).ToList(),
            };
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(s));
            PlayerPrefs.Save();
        }

        // Lê a run, ou null se não houver ou estiver quebrada.
        public static RunState Load(GameDatabase db)
        {
            if (!HasSave) return null;
            try
            {
                var s = JsonUtility.FromJson<RunSave>(PlayerPrefs.GetString(Key));
                var r = new RunState
                {
                    seed = s.seed, gold = s.gold, xp = s.xp, rngCounter = s.rngCounter,
                    currentNode = s.currentNode, nodeDone = s.nodeDone, map = s.map,
                };
                foreach (var hs in s.heroes)
                {
                    var def = db.Hero(hs.heroId);
                    if (def == null) return null;
                    r.heroes.Add(new HeroRunState
                    {
                        def = def, hp = hs.hp, breathLevel = hs.breathLevel, reserveLevel = hs.reserveLevel,
                        bag = hs.bag, pages = hs.pageIds.Select(db.Page).Where(p => p != null).ToList(),
                    });
                }
                return r;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"Save inválido, ignorado: {e.Message}");
                return null;
            }
        }

        // Apaga o save (fim da run).
        public static void Delete()
        {
            PlayerPrefs.DeleteKey(Key);
            PlayerPrefs.Save();
        }
    }
}
```

### 7.4 RunSession: a run entre cenas

```csharp
// Assets/_Project/Scripts/Meta/RunSession.cs
using Bolsa.Core;
using Bolsa.Data;

namespace Bolsa.Meta
{
    public enum BattleOutcome { None, Won, Lost }

    // POR QUE: ao trocar de cena (Run → Battle → Run), a Unity destrói os objetos da cena
    // velha. A run precisa sobreviver a isso.
    // ESTRATÉGIA: uma classe "static": os campos dela existem uma vez só e não pertencem
    // a nenhuma cena. É a forma mais simples de passar dados entre cenas.
    public static class RunSession
    {
        public static RunState Current;
        public static BattleOutcome LastOutcome;

        // Encontro do nó atual (ou null, se a cena Battle foi aberta direto para teste).
        public static EncounterDef CurrentEncounter =>
            Current?.Current == null ? null : GameDatabase.Get().Encounter(Current.Current.encounterId);

        // Começa uma run nova com os três heróis do banco de dados.
        public static void NewRun(int seed)
        {
            var db = GameDatabase.Get();
            Current = new RunState { seed = seed };
            foreach (var h in db.heroes) Current.heroes.Add(HeroRunState.New(h));
            Current.map = MapGenerator.Generate(seed, GameConfig.Get().mapLayers, db);
            SaveSystem.Save(Current);
        }

        // Carrega a run salva. Devolve false se não houver.
        public static bool TryContinue()
        {
            Current = SaveSystem.Load(GameDatabase.Get());
            return Current != null;
        }

        // Entra num nó. Salva aqui: sair no meio do nó recomeça este nó (Parte 1 §16).
        public static void EnterNode(MapNode n)
        {
            Current.currentNode = n.id;
            Current.nodeDone = false;
            SaveSystem.Save(Current);
        }

        // Chamado pela cena Battle no fim do combate.
        public static void FinishBattle(bool won, EncounterDef enc)
        {
            if (!won)
            {
                SaveSystem.Delete();
                Current = null;
                LastOutcome = BattleOutcome.Lost;
                return;
            }
            Current.gold += enc.goldReward;
            Current.xp += enc.xpReward;
            LastOutcome = BattleOutcome.Won;
        }
    }
}
```

### 7.5 Ligar o BattleController à run

Troque os três métodos marcados "Fase 7" (e o `CurrentEncounter` da Fase 6) e adicione `using Bolsa.Meta;`:

```csharp
        // Heróis da run (ou os de teste, se a cena foi aberta direto).
        List<HeroRunState> HeroRunStates() =>
            RunSession.Current != null ? RunSession.Current.heroes : _testHeroes.Select(HeroRunState.New).ToList();

        // Semente por nó: recomeçar o mesmo nó sorteia as mesmas fichas.
        int Seed() => RunSession.Current != null
            ? RunSession.Current.seed * 31 + RunSession.Current.currentNode
            : _seed;

        EncounterDef CurrentEncounter() => RunSession.CurrentEncounter ?? _testEncounter;

        // Mostra o resultado; Continuar volta para o mapa da run.
        void FinishBattle(bool won)
        {
            _resultPanel.SetActive(true);
            _resultText.text = won ? "Vitória!" : "Derrota... A run acabou.";
            _resultButton.onClick.RemoveAllListeners();
            _resultButton.onClick.AddListener(() =>
            {
                if (RunSession.Current == null) { SceneManager.LoadScene(SceneManager.GetActiveScene().name); return; }
                RunSession.FinishBattle(won, CurrentEncounter());
                SceneManager.LoadScene("Run");
            });
        }
```

### 7.6 Painel de escolhas

Recompensa, nível, Acampamento, Mercador e o menu inicial são todos "um título e uma lista de botões". Um único painel serve para todos.

```csharp
// Assets/_Project/Scripts/UI/ChoicePanel.cs
using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Bolsa.UI
{
    // POR QUE: muitas telas da run são "escolha uma opção".
    // ESTRATÉGIA: Show recebe pares (texto, ação). Clicar esconde o painel e roda a
    // ação, que pode chamar Show de novo (ex.: escolher o herói depois de "Tratar").
    public class ChoicePanel : MonoBehaviour
    {
        [SerializeField] private TMP_Text _title;
        [SerializeField] private Transform _list;
        [SerializeField] private Button _optionPrefab;

        // Mostra o painel com as opções.
        public void Show(string title, IEnumerable<(string label, Action pick)> options)
        {
            gameObject.SetActive(true);
            _title.text = title;
            for (int i = _list.childCount - 1; i >= 0; i--) Destroy(_list.GetChild(i).gameObject);
            foreach (var (label, pick) in options)
            {
                var b = Instantiate(_optionPrefab, _list);
                b.GetComponentInChildren<TMP_Text>().text = label;
                b.onClick.AddListener(() => { Hide(); pick(); });
            }
        }

        // Esconde o painel.
        public void Hide() => gameObject.SetActive(false);
    }
}
```

### 7.7 Tela do mapa da run

```csharp
// Assets/_Project/Scripts/Meta/RunMapScreen.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Bolsa.Core;
using Bolsa.Data;
using Bolsa.UI;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using Opt = System.ValueTuple<string, System.Action>;

namespace Bolsa.Meta
{
    // POR QUE: a cena Run é tudo o que acontece fora do combate (Parte 1 §3 e §12).
    // ESTRATÉGIA: o mapa é uma coluna de camadas (Chefe em cima), cada camada uma linha de
    // botões; só os nós disponíveis ficam clicáveis. Combate abre a cena Battle; Acampamento
    // e Mercador abrem o ChoicePanel. Ao voltar de uma vitória: recompensa → níveis de
    // trilha → nó concluído (salva). "Opt" é um apelido para o par (texto, ação).
    public class RunMapScreen : MonoBehaviour
    {
        [SerializeField] private Transform _layersRoot;   // Vertical Layout Group
        [SerializeField] private Transform _rowPrefab;    // Horizontal Layout Group
        [SerializeField] private Button _nodePrefab;
        [SerializeField] private TMP_Text _status;
        [SerializeField] private ChoicePanel _choice;

        GameDatabase _db;
        GameConfig _cfg;
        RunState Run => RunSession.Current;

        // Decide o que mostrar ao abrir a cena.
        void Start()
        {
            _db = GameDatabase.Get();
            _cfg = GameConfig.Get();

            if (RunSession.LastOutcome == BattleOutcome.Lost)
            {
                RunSession.LastOutcome = BattleOutcome.None;
                _choice.Show("Derrota. A run acabou.", new[] { new Opt("Nova run", StartNewRun) });
                return;
            }
            if (Run == null)
            {
                var opts = new List<Opt> { new("Nova run", StartNewRun) };
                if (SaveSystem.HasSave) opts.Insert(0, new Opt("Continuar", ContinueRun));
                _choice.Show("Bolsa de Heróis", opts);
                return;
            }
            if (RunSession.LastOutcome == BattleOutcome.Won)
            {
                RunSession.LastOutcome = BattleOutcome.None;
                DrawMap();
                ShowReward();
                return;
            }
            Resume();
        }

        void StartNewRun()
        {
            RunSession.NewRun(Environment.TickCount);
            DrawMap();
        }

        void ContinueRun()
        {
            if (!RunSession.TryContinue()) { StartNewRun(); return; }
            Resume();
        }

        // Redesenha e, se o nó atual não terminou, reabre o nó.
        void Resume()
        {
            DrawMap();
            if (Run.Current != null && !Run.nodeDone) OpenNode(Run.Current);
        }

        // ---------- Mapa ----------

        // Uma linha de botões por camada, do Chefe (em cima) até a primeira.
        void DrawMap()
        {
            for (int i = _layersRoot.childCount - 1; i >= 0; i--) Destroy(_layersRoot.GetChild(i).gameObject);
            var available = Run.nodeDone ? Run.Available.ToHashSet() : new HashSet<MapNode>();
            int layers = Run.map.Max(n => n.layer) + 1;

            for (int l = layers - 1; l >= 0; l--)
            {
                var row = Instantiate(_rowPrefab, _layersRoot);
                foreach (var node in Run.map.Where(n => n.layer == l))
                {
                    var b = Instantiate(_nodePrefab, row);
                    b.GetComponentInChildren<TMP_Text>().text =
                        (node.id == Run.currentNode ? "> " : "") + Label(node.type);
                    b.interactable = available.Contains(node);
                    var n = node;
                    b.onClick.AddListener(() => { RunSession.EnterNode(n); DrawMap(); OpenNode(n); });
                }
            }

            _status.text = $"Ouro {Run.gold}   XP {Run.xp}/{_cfg.xpPerLevel}   |   " + string.Join("   ",
                Run.heroes.Select(h => $"{h.def.displayName} {h.hp}/{h.def.maxHp} ({h.bag.Count} fichas, {h.Wounds} FER)"));
        }

        static string Label(NodeType t) => t switch
        {
            NodeType.Combat => "Combate", NodeType.Elite => "Elite", NodeType.Camp => "Acampamento",
            NodeType.Merchant => "Mercador", NodeType.Boss => "CHEFE", _ => "?",
        };

        // Abre o nó escolhido.
        void OpenNode(MapNode n)
        {
            switch (n.type)
            {
                case NodeType.Camp: ShowCamp(); break;
                case NodeType.Merchant: ShowMerchant(BuildMerchantOffers()); break;
                default: SceneManager.LoadScene("Battle"); break;
            }
        }

        // Nó resolvido: salva, ou encerra a run se era o Chefe.
        void FinishNode()
        {
            Run.nodeDone = true;
            if (Run.Current.type == NodeType.Boss)
            {
                SaveSystem.Delete();
                RunSession.Current = null;
                _choice.Show("Vitória! A Floresta está livre.", new[] { new Opt("Nova run", StartNewRun) });
                return;
            }
            SaveSystem.Save(Run);
            DrawMap();
        }

        // ---------- Recompensa e níveis ----------

        // Três opções sorteadas (Parte 1 §12).
        void ShowReward()
        {
            var rng = Run.NextRng();
            var opts = new List<Opt>();
            for (int i = 0; i < 3; i++) opts.Add(RandomReward(rng));
            _choice.Show("Recompensa: escolha 1", opts);
        }

        // Uma opção: ficha (45%), página (40%) ou ouro.
        Opt RandomReward(System.Random rng)
        {
            var hero = Run.heroes[rng.Next(Run.heroes.Count)];
            double r = rng.NextDouble();
            if (r < 0.45 && hero.def.favoredTokens.Count > 0)
            {
                var t = hero.def.favoredTokens[rng.Next(hero.def.favoredTokens.Count)];
                return new($"+1 {TokenRules.ShortName(t)} na bag: {hero.def.displayName}",
                           () => { hero.bag.Add(t); AfterReward(); });
            }
            var pages = hero.def.rewardPages.Where(p => !hero.pages.Contains(p)).ToList();
            if (r < 0.85 && pages.Count > 0)
            {
                var p = pages[rng.Next(pages.Count)];
                return new($"Página {p.displayName}: {hero.def.displayName}", () => AddPage(hero, p, AfterReward));
            }
            int gold = 15;
            return new($"+{gold} ouro", () => { Run.gold += gold; AfterReward(); });
        }

        // Põe a página no livro; com o livro cheio, pergunta qual trocar.
        void AddPage(HeroRunState h, PageDef p, Action then)
        {
            if (h.pages.Count < _cfg.maxPagesInBook) { h.pages.Add(p); then(); return; }
            var opts = h.pages.Select((old, i) => new Opt($"Trocar {old.displayName}", () => { h.pages[i] = p; then(); }))
                              .ToList();
            opts.Add(new Opt("Recusar a página", then));
            _choice.Show($"Livro de {h.def.displayName} cheio: trocar qual página?", opts);
        }

        // Depois da recompensa: um nível por vez enquanto houver XP; depois conclui o nó.
        void AfterReward()
        {
            if (Run.xp < _cfg.xpPerLevel) { FinishNode(); return; }
            Run.xp -= _cfg.xpPerLevel;
            var opts = new List<Opt>();
            foreach (var h in Run.heroes)
            {
                if (h.breathLevel < _cfg.MaxBreathLevel)
                    opts.Add(new($"{h.def.displayName}: Fôlego {_cfg.DrawCount(h.breathLevel)} > {_cfg.DrawCount(h.breathLevel + 1)} fichas",
                                 () => { h.breathLevel++; AfterReward(); }));
                if (h.reserveLevel < _cfg.MaxReserveLevel)
                    opts.Add(new($"{h.def.displayName}: Reserva {_cfg.ReserveSlots(h.reserveLevel)} > {_cfg.ReserveSlots(h.reserveLevel + 1)}",
                                 () => { h.reserveLevel++; AfterReward(); }));
            }
            if (opts.Count == 0) { FinishNode(); return; }
            _choice.Show("Subiu de nível! Escolha uma trilha", opts);
        }

        // ---------- Acampamento ----------

        // Descansar, Tratar ou Treinar (Parte 1 §12).
        void ShowCamp()
        {
            var opts = new List<Opt>
            {
                new("Descansar (todos recuperam PV)", () =>
                {
                    foreach (var h in Run.heroes)
                        h.hp = Mathf.Min(h.def.maxHp, h.hp + Mathf.CeilToInt(h.def.maxHp * _cfg.campHealFraction));
                    FinishNode();
                }),
            };
            if (Run.heroes.Any(h => h.Wounds > 0))
                opts.Add(new("Tratar (tira até 2 Feridas de um herói)", () => PickHero("Tratar quem?", h => h.Wounds > 0, h =>
                {
                    for (int i = 0; i < 2; i++) h.bag.Remove(TokenType.Ferida);
                    FinishNode();
                })));
            opts.Add(new("Treinar (tira 1 ficha da bag de um herói)", () => PickHero("Treinar quem?", h => h.bag.Count > 1, h =>
            {
                var kinds = h.bag.Distinct().ToList();
                _choice.Show($"Tirar qual ficha de {h.def.displayName}?",
                    kinds.Select(t => new Opt($"{TokenRules.ShortName(t)} (tem {h.bag.Count(x => x == t)})",
                                              () => { h.bag.Remove(t); FinishNode(); })));
            })));
            _choice.Show("Acampamento: escolha 1", opts);
        }

        // Pergunta qual herói (entre os que passam no filtro).
        void PickHero(string title, Func<HeroRunState, bool> filter, Action<HeroRunState> then)
        {
            _choice.Show(title, Run.heroes.Where(filter).Select(h => new Opt(h.def.displayName, () => then(h))));
        }

        // ---------- Mercador ----------

        // Oferta do Mercador: texto, preço e o que acontece ao comprar.
        class Offer { public string label; public int price; public Action apply; }

        // Duas fichas, uma página e tratamento para quem tiver Ferida.
        List<Offer> BuildMerchantOffers()
        {
            var rng = Run.NextRng();
            var offers = new List<Offer>();
            for (int i = 0; i < 2; i++)
            {
                var h = Run.heroes[rng.Next(Run.heroes.Count)];
                if (h.def.favoredTokens.Count == 0) continue;
                var t = h.def.favoredTokens[rng.Next(h.def.favoredTokens.Count)];
                offers.Add(new Offer { label = $"+1 {TokenRules.ShortName(t)}: {h.def.displayName}", price = _cfg.tokenPrice, apply = () => h.bag.Add(t) });
            }
            var ph = Run.heroes[rng.Next(Run.heroes.Count)];
            var pages = ph.def.rewardPages.Where(p => !ph.pages.Contains(p)).ToList();
            if (pages.Count > 0)
            {
                var p = pages[rng.Next(pages.Count)];
                offers.Add(new Offer { label = $"Página {p.displayName}: {ph.def.displayName}", price = _cfg.pagePrice,
                                       apply = () => { if (ph.pages.Count < _cfg.maxPagesInBook) ph.pages.Add(p); } });
            }
            foreach (var h in Run.heroes.Where(h => h.Wounds > 0))
                offers.Add(new Offer { label = $"Tratar 1 Ferida: {h.def.displayName}", price = _cfg.treatPrice,
                                       apply = () => h.bag.Remove(TokenType.Ferida) });
            return offers;
        }

        // Mostra o que dá para pagar; comprar tira a oferta e mostra de novo.
        void ShowMerchant(List<Offer> offers)
        {
            var opts = offers.Where(o => o.price <= Run.gold).Select(o => new Opt($"{o.label} ({o.price} ouro)", () =>
            {
                Run.gold -= o.price;
                o.apply();
                offers.Remove(o);
                ShowMerchant(offers);
            })).ToList();
            opts.Add(new Opt("Sair", FinishNode));
            _choice.Show($"Mercador ({Run.gold} ouro)", opts);
        }
    }
}
```

> **Simplificação do MVP:** no Mercador, a página só entra se houver espaço no livro (sem a troca da recompensa). Ver "Próximos passos".

### 7.8 Montar a cena `Run` e os assets

1. **GameDatabase:** **Create → Bolsa → Game Database** em `Assets/_Project/Resources/` com o nome exato `GameDatabase`. Arraste os 3 heróis (na ordem Guerreiro, Arqueiro, Mago, a mesma das abas da cena Battle), **todas** as páginas e os 5 encontros.
2. **`id`s:** preencha o `id` de cada herói, página e encontro com texto simples e único (`guerreiro`, `meteoro`, `floresta_lobos`). O save guarda esses ids; mudar um id depois quebra saves antigos.
3. Em cada herói, preencha `rewardPages` com as páginas da Parte 1 §7.2 que servem para ele (Atadura nos três).
4. Cena `Run`: Canvas (mesmo Canvas Scaler da Battle) com:
   - `Status` (TMP) no topo;
   - `Layers` com `Vertical Layout Group` (o `_layersRoot`);
   - prefab `Row` (`Horizontal Layout Group`, `Child Alignment = Middle Center`) e prefab `NodeButton` (Button com TMP);
   - `ChoicePanel` por cima de tudo: fundo escuro, `Title` (TMP), `List` com `Vertical Layout Group`, prefab `OptionButton`.
   - Um GameObject com `RunMapScreen` ligado a tudo isso.
5. Na cena `Battle`, o `BattleController` continua com os `_testHeroes` e `_testEncounter` só para testar a cena sozinha.

### ✅ Checkpoint da Fase 7
- Abrir a cena `Run`: menu com "Nova run". O mapa aparece com o Chefe em cima, o Acampamento logo abaixo e só os nós da primeira camada clicáveis.
- Clicar num Combate abre a Battle com o encontro do nó; vencer e Continuar volta para o mapa com a recompensa 1 de 3.
- Com 10 XP acumulado, aparece "Subiu de nível!" e escolher Fôlego faz o próximo combate daquele herói tirar 5 fichas.
- Uma Ferida ganha no combate aparece no status ("1 FER") e o Acampamento → Tratar a remove.
- Fechar o Play no meio de um combate e abrir de novo → "Continuar" reabre aquele mesmo combate, com o mesmo sorteio.
- Perder todos os heróis: "Derrota. A run acabou." e o "Continuar" some do menu.
- Vencer o Chefe: "Vitória!" e a run termina.

#### Problemas comuns
- **`NullReferenceException` no `GameDatabase.Get()`:** o asset não está numa pasta chamada exatamente `Resources` ou não se chama `GameDatabase`.
- **Ao continuar, um herói está sem páginas:** os `id`s das páginas estão vazios ou repetidos; o `Load` descarta o que não acha.
- **Uma página nova aparece em todos os heróis:** `HeroRunState.New` copiou a lista (`new List<PageDef>(...)`); se você trocou por atribuição direta, todos os heróis passam a dividir a lista do asset.

Próxima fase: **Build e Próximos Passos**.

---

# Parte 11 — Implementação Unity: Fase 8 (Build e Próximos Passos)

## Fase 8 — Build e Próximos Passos

> Objetivo desta fase: gerar o jogo para Windows e para a Web e listar o que vem depois do MVP.

### 8.1 Build Windows (Steam)

1. **File → Build Profiles → Windows**. Confirme a Scene List com `Run` em primeiro (índice 0) e `Battle` em seguida.
2. **Player Settings:** Company/Product Name, ícone, **Resolution → Fullscreen Mode = Fullscreen Window**, e marque **Resizable Window** para jogar em janela.
3. **Scripting Backend = IL2CPP** (mais rápido e é o padrão para lojas).
4. **Build** numa pasta fora de `Assets/` (ex.: `Builds/Windows/`).

**Steam** (quando chegar a hora): integrar o **Steamworks.NET** (pacote via Git URL) só depois do MVP validado; conquistas e nuvem da Steam são "Depois do MVP" na Parte 1 §17. A resolução do Steam Deck (1280 × 800, 16:10) já funciona bem com o Canvas Scaler em **Match = 0.5**; teste nessa resolução no Game view.

### 8.2 Build Web (teste)

1. **Build Profiles → Web**, **Switch Platform**.
2. **Player Settings → Publishing Settings → Compression Format = Disabled** se for testar num servidor simples sem configurar cabeçalhos (ou deixe Brotli e configure o servidor).
3. Build e sirva a pasta com um servidor local (a página Web não abre direto do disco).

### ✅ Checkpoint da Fase 8
- O executável Windows abre no menu da run, joga um combate e salva: fechar e abrir de novo oferece "Continuar".
- O build Web roda no navegador, e recarregar a página mantém o save.

#### Problemas comuns
- **O build abre na cena errada:** a ordem da Scene List manda; `Run` precisa ser a primeira.
- **O pixel art borra no build:** confira **Filter Mode = Point** e, na câmera, ative o componente **Pixel Perfect Camera** (pacote 2D Pixel Perfect, já no template) com **Assets PPU = 48**.

### 8.3 Próximos passos

- **Arte das fichas, do livro e das intenções** no PixelLab, com um sprite do Iso Cards como referência de estilo (Parte 1 §13), no lugar das cores de placeholder.
- **Animações:** tocar `parado-*` em loop e `ataque-*` ao usar página, com `Animator` ou um player de quadros simples; virar para o alvo (`ne`/`se` + espelho).
- **Linhas entre os nós** do mapa da run (hoje só os nós disponíveis acendem).
- **Mercador com troca de página** quando o livro está cheio (reusar o `AddPage` da recompensa).
- **Calibrar no protótipo web** (`prototipos/bolsa-de-herois/`) os números das trilhas, das Feridas e dos inimigos antes de investir no Unity.
- Decidir os itens **Em aberto** da Parte 1 §18, principalmente: trilhas subindo dentro do combate (8.3), planejamento às cegas (9) e chefes com bag (11).
- Mais biomas (os outros 4 do Iso Cards), runs de vários biomas e progressão permanente.
- Som e música.

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
