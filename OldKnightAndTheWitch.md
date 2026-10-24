# GDD — Old Knight and the Witch

> Documento vivo. Rascunho inicial, a refinar com o protótipo.
> O jogo parte do **Guerreiro da Masmorra (app)**, a versão do app Android (`prototipos/guerreiro-da-masmorra-app/`, em 3D em `prototipos/guerreiro-da-masmorra-app-3d/`), e muda três coisas: o elenco vira uma **dupla** (o Velho Cavaleiro e a Bruxa) que troca de lugar no meio da luta, a Bruxa joga com um **deck de cartas e mana**, e toda a arte é refeita. As regras do Guerreiro que continuam iguais não são copiadas aqui: cada seção aponta para a seção de `GuerreiroDaMasmorra.md` que vale e lista só o que muda.
> Números marcados como **proposta** são um ponto de partida para o protótipo. Eles continuam **Em aberto** até o playtest.
> **Protótipo jogável:** `prototipos/old-knight-and-the-witch/` (cópia do Guerreiro 3D do app, com a dupla, as cartas, o prólogo e a arte nova do PixelLab em `Sprites/OldKnightWitch/`).

**Gênero:** RPG por turnos com reações em tempo real (QTE) e deckbuilding · **Dimensão:** 3D com personagens em sprites 2D (HD-2D) · **Plataforma:** Android (protótipo web antes) · **Orientação:** retrato · **Engine:** Unity 6

## Índice

**Parte 1 — GDD**
1. [Visão Geral](#1-visão-geral)
2. [O que vem do Guerreiro da Masmorra (app)](#2-o-que-vem-do-guerreiro-da-masmorra-app)
3. [A Dupla](#3-a-dupla)
4. [Turnos, Iniciativa e Troca](#4-turnos-iniciativa-e-troca)
5. [Reações (QTE)](#5-reações-qte)
6. [O Velho Cavaleiro](#6-o-velho-cavaleiro)
7. [A Bruxa: deck e mana](#7-a-bruxa-deck-e-mana)
8. [Monstros](#8-monstros)
9. [Masmorras, Acampamento e Progressão](#9-masmorras-acampamento-e-progressão)
10. [Estilo Visual](#10-estilo-visual)
11. [Interface e Controles](#11-interface-e-controles)
12. [Áudio](#12-áudio)
13. [Persistência, Backend e Monetização](#13-persistência-backend-e-monetização)
14. [Escopo do MVP](#14-escopo-do-mvp)
15. [Em aberto](#15-em-aberto)

**Parte 2 — Guia de Implementação Unity**
- [Convenções, arquitetura e fases](#parte-2--guia-de-implementação-unity)
- Partes 3 a 11: Fases 0 a 8 (setup → motor do Guerreiro → palco HD-2D → dupla → Bruxa → acampamento → extras do app → testes → build)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Pitch:** um velho cavaleiro de barba branca, com uma espada enorme e meio quebrada, desce as masmorras ao lado de uma bruxa adolescente. Ele bate pouco e bate forte; ela age duas vezes por rodada e espalha magia pelo campo inteiro. Os dois aparam, pulam e esquivam dos golpes dos monstros em tempo real, e o jogador decide quem fica na frente a cada momento da luta.
- **Gênero — Definido:** RPG de turnos com reação em tempo real a cada golpe inimigo (o motor do Guerreiro da Masmorra), mais deckbuilding para a Bruxa.
- **Dimensão e câmera — Definido:** cenário 3D com personagens e objetos em **sprites 2D** sobre placas iluminadas (HD-2D), como no Guerreiro da Masmorra 3D (app): câmera fixa atrás e acima de quem está em campo, olhando o corredor da masmorra, com os monstros vindo do fundo.
- **Plataforma — Definido:** Android, em **retrato**, jogado com o polegar. Um protótipo web vem antes, para testar.
- **Pilar de design — Definido:** **dois ritmos na mesma luta.** O Cavaleiro é lento e pesado (poucas ações, golpes enormes de dano físico); a Bruxa é rápida e espalhada (mais ações, golpes menores e em área). Saber quem deixar na frente é a decisão central, por cima do reflexo do QTE que vem do Guerreiro.
- **Fantasia central:** o mestre velho e cansado e a aprendiz impaciente, que se protegem um ao outro trocando de lugar.
- **Referências:** Guerreiro da Masmorra 3D (app), a base de tudo; Slay the Spire (deck montado e mana por turno); Octopath Traveler (HD-2D); Final Fantasy X (troca de personagem no meio do turno).

### 1.1 Enredo

- **Definido:**
  - O jogo se passa na época da **caça às bruxas**.
  - A garota é condenada por ser acusada de bruxaria e foge para uma **floresta**.
  - Ela ainda não sabe usar bem os próprios poderes.
- **Definido:** o começo do jogo é o **treinamento dela na floresta**, enfrentando **gosmas**. É onde o jogador aprende as mecânicas básicas da Bruxa.
- **Definido:**
  - Na **terceira onda** da floresta ela não consegue vencer o chefe.
  - O velho, que estava **cortando lenha** naquela floresta, aparece com um **machado** e salva a Bruxa.
  - Depois desse treinamento o jogo continua como o Guerreiro da Masmorra 3D (app), já com a dupla.
- **Definido:** os inimigos seguem a temática da caça às bruxas (§8). No meio da batalha eles **falam sobre a bruxa**: dizem que ela merece morrer, que vai queimar e coisas assim.
- **Proposta (texto do protótipo):**
  - **A sentença:** na praça de "Vila Cinzenta", a garota ruiva de capa cinza é condenada à fogueira.
  - **A fuga:** uma faísca escapa da mão dela, queima as cordas, e ela foge para a "floresta proibida".
  - **Quem é o velho:** depois do resgate, ele conta que já foi cavaleiro da Ordem que caça bruxas e que largou a espada por causa das fogueiras.
  - **A espada:** ele entra na cabana e volta com a espada gigantesca, partida ao meio. Assim o machado do resgate e a espada da §3 são as duas armas do mesmo velho: a do lenhador e a do cavaleiro.
- **Em aberto:** os nomes da vila, da Ordem e dos dois personagens; o que acontece depois da masmorra 33 (o desfecho da história).

### 1.2 O prólogo na floresta

- **Definido:** o prólogo substitui o Campo de Treinamento do app. Tem 3 ondas, com a **Bruxa sozinha**:
  - **Onda 1:** 2 gosmas. Ensina a jogar cartas e as reações (parry, salto e esquiva lateral).
  - **Onda 2:** 3 gosmas. Ensina que defender bem dá mana.
  - **Onda 3:** a **Gosma Rainha**, que a Bruxa não consegue derrotar. Depois de alguns golpes, a Rainha a derruba, o lenhador chega com o machado e mata a gosma.
- **Proposta:**
  - As gosmas são lentas: o círculo de reação dura 1,25 s em vez de 0,9 s.
  - A Bruxa não morre no prólogo: o HP não cai abaixo de 1.
  - A Gosma Rainha não pode ser derrotada pela Bruxa.
  - O roteiro do resgate começa quando a Rainha ataca pela 2ª vez ou quando o HP da Bruxa cai a 35%.
  - O prólogo pode ser pulado.
- **Definido:** no fim do prólogo, o Velho Cavaleiro entra na dupla e o jogo segue o loop do app (§9).

## 2. O que vem do Guerreiro da Masmorra (app)

**Definido:** o jogo segue o Guerreiro da Masmorra (app) em tudo o que esta seção não muda. Fora do combate, o loop é o mesmo do app: acampamento, Tochas, ouro, Souls com árvore de habilidades, missões diárias, baú do dia, biomas e interiores, chefes, 33 masmorras e NG+.

| Sistema | Onde está a regra | O que muda neste jogo |
|---|---|---|
| Fila de iniciativa | `GuerreiroDaMasmorra.md` §4 | A vaga do herói vira a vaga **de quem está em campo**; a Bruxa tem 2 vagas por rodada (§4) |
| Reações (parry, salto, lateral) | `GuerreiroDaMasmorra.md` §5 | Valem para os dois personagens. Entram também as reações que o app acrescentou: **abaixar** e a lateral **com lado certo** (§5) |
| Ações do herói, Fúria, exaustão, cansaço | `GuerreiroDaMasmorra.md` §6 e §7 | São as regras do **Cavaleiro**. A Bruxa não usa Fúria (§7) |
| Especiais e minijogos | `GuerreiroDaMasmorra.md` §7.1 | Liberados pela **árvore de Souls** do app (§9.3), não pelo atributo Habilidade. A Fúria total usa a **barra de toques** do app |
| Monstros, golpes nomeados, chefes, mecânicas especiais | `GuerreiroDaMasmorra.md` §8 | Os comportamentos são os do app; os inimigos viram caçadores de bruxas, com nomes, arte e falas novos (§8) |
| Masmorras, escala, recompensas, derrota, NG+ | `GuerreiroDaMasmorra.md` §9 | Biomas e interiores do app; recompensa extra de carta para a Bruxa (§9.2) |
| Acampamento, mercado, gemas, Tochas, baú | `GuerreiroDaMasmorra.md` §10 | Atributos comprados **por personagem**; gemas só do Cavaleiro (§9.1) |
| Mago Arcanista e mapa-múndi | `GuerreiroDaMasmorra.md` §11 e §12 | **Fora.** A Bruxa substitui o Mago, com outra mecânica de cartas |

## 3. A Dupla

| Personagem | Aparência — Definido | Papel — Definido | HP | ATK | DEF | Velocidade | Vagas por rodada |
|---|---|---|---|---|---|---|---|
| **O Velho Cavaleiro** | velho, cabelos brancos e barba longa; carrega uma espada gigantesca, meio quebrada | golpes pesados de grande dano físico, lentos | 70 | 14 | 4 | 6 | 1 |
| **A Bruxa** | adolescente ruiva com uma capa cinza; ataca com uma varinha mágica | golpes rápidos e em área | 45 | 8 | 2 | 13 | 2 |

- HP, ATK, DEF, velocidade e vagas são **proposta**. Para comparar: o Guerreiro do app começa com 60 / 10 / 3 e velocidade 10.
- **Definido (enredo, §1.1):** a Bruxa começa sozinha, no prólogo da floresta. O Velho Cavaleiro entra na dupla quando a salva da Gosma Rainha.
- **Em aberto:** os nomes dos dois (hoje são "o Velho Cavaleiro" e "a Bruxa").

## 4. Turnos, Iniciativa e Troca

### 4.1 Só um em campo

- **Definido:** só **um** personagem fica em campo por vez. O outro fica na **reserva**.
- **Definido:** a reserva é segura: os monstros só atacam quem está em campo.
- **Definido:** trocar é um comando (**Trocar**) e **gasta o turno** de quem sai. Quem entra só age na próxima vaga do herói na fila.
- **Definido:** se quem está em campo cai, o outro entra sozinho, sem gastar nada, e a luta continua. A **derrota** só acontece quando os **dois** caem.
- **Proposta:**
  - Quem entra começa a luta "fria": a barra de guarda zera e a exaustão do especial (que tira a rodada seguinte) só vale para quem usou o especial.
  - Dinamites grudadas, maldição do Cultista e Selo da Fúria ficam com o personagem que os recebeu e continuam contando quando ele voltar a campo.
- **Em aberto:** se a troca deve ter um bônus (por exemplo, quem entra ganha +1 de Fúria ou +1 de mana) para incentivar trocas ofensivas e não só defensivas.

### 4.2 Lento e rápido na fila

A fila é a de `GuerreiroDaMasmorra.md` §4: cada vaga rola `velocidade + d(0..5)` e a fila sai do maior para o menor. O que muda:

- **Definido:** a velocidade da vaga do herói é a de **quem está em campo**. O Cavaleiro tem velocidade baixa e age menos; a Bruxa tem velocidade alta e age mais.
- **Proposta:**
  - O Cavaleiro tem **1 vaga** por rodada, com velocidade 6: quase sempre depois da maioria dos monstros (comuns de 7 a 12).
  - A Bruxa tem **2 vagas** por rodada, com velocidade 13; a segunda rola com −4.
- **Proposta:** a fila de uma rodada é montada no começo dela e não muda com uma troca. Se o jogador trocar no meio da rodada, as vagas do herói que sobraram nessa rodada são usadas por quem estiver em campo; a partir da rodada seguinte, a fila segue a velocidade e as vagas do novo personagem.
- **Em aberto:** se o Cavaleiro deve agir em rodadas alternadas (ainda mais lento) para compensar o tamanho do golpe. Isso só se decide no playtest.

### 4.3 Recursos da masmorra

- **Proposta:** Poções de Cura, Mapas e Souls são **da dupla**: qualquer um dos dois usa. A Poção de Adrenalina é do Cavaleiro (enche a Fúria). As quantidades são as do app (3 de cada por masmorra).
- **Proposta:** a **pedrada** (`GuerreiroDaMasmorra.md` §6) vale para os dois.
- **Proposta:** a Soul, usada quando os dois caem, levanta **quem caiu por último** com o HP cheio. O outro continua caído até o fim da masmorra.
- **Definido (herdado):** a run é **perfeita** se nenhum dos dois sofreu dano na masmorra inteira.

## 5. Reações (QTE)

- **Definido:** os dois personagens reagem com o **mesmo QTE** do Guerreiro (`GuerreiroDaMasmorra.md` §5): parry (tocar), salto (arrastar para cima) e esquiva lateral (deslizar), com os mesmos tempos e resultados.
- **Definido (herdado do app):** mais duas reações que o app acrescentou ao Guerreiro original:
  - **Abaixar:** arrastar para baixo (teclado: ↓). Esquiva do golpe alto: sucesso não leva dano e não dá Fúria, como a lateral.
  - **Lateral com lado:** alguns golpes pedem um lado (seta ⬅ ou ➡ no círculo). Deslizar para o lado errado conta como falha. No app, só o chefe Arqueiro Ancestral usa os dois.
- **Bruxa — Proposta:** o riposte do parry perfeito e o Ataque Aéreo dela usam o ATK dela. Toda vez que uma reação daria **Fúria** ao Cavaleiro, dá **+1 de mana** à Bruxa, até o teto de mana (§7.2).

## 6. O Velho Cavaleiro

- **Definido:** joga como o Guerreiro do app: menu com **Atacar**, **Especial** (Fúria, Combo, Lâmina Invisível, Sequência Mortal), **Poção** e **Fugir**, mais a pedrada; ganha Fúria com o ataque simples; todo especial o deixa exausto na rodada seguinte. As fórmulas são as de `GuerreiroDaMasmorra.md` §6 e §7.
- **Definido:** os especiais são liberados pela **árvore de Souls** do app (§9.3), e a Fúria total carrega o crítico com a **barra de toques** do app (martelar a tela; a barra vaza se parar, e cheia dá crítico garantido).
- **Novo — Definido:** o comando **Trocar** entra no menu (§4.1).
- **"Pesado e lento" — Proposta:** os números da §3 (ATK 14, velocidade 6, 1 vaga) já fazem o Cavaleiro agir menos e bater mais forte. **Em aberto:** se também precisa de um multiplicador próprio no ataque simples (por exemplo ×1,3) ou se o ATK alto basta.

## 7. A Bruxa: deck e mana

### 7.1 O turno

- **Definido:** a Bruxa joga com um **deck montado no acampamento** e **mana por turno**, no estilo Slay the Spire. Ela não usa Fúria.
- **Proposta:**
  - **Mão:** no começo de cada vaga dela, compra até ficar com **4 cartas**. Quando o monte de compra acaba, o descarte é embaralhado e vira o novo monte.
  - **Mana:** recebe **2** no começo de cada vaga, sem passar do teto de **4**. A mana que sobra passa para a próxima vaga.
  - **Jogar:** joga quantas cartas a mana pagar, uma de cada vez. Cada carta jogada vai para o descarte. **Encerrar** termina o turno.
  - **Ao sair da luta:** mão, descarte e mana voltam ao normal no começo de cada **masmorra**. Entre as ondas da mesma masmorra, nada muda.
- **Definido:** os comandos **Trocar**, **Poção** e **Fugir** também ficam no turno dela.

### 7.2 Cartas

O poder das cartas escala com o ATK da Bruxa. "Área" atinge todos os monstros vivos; "salto" atinge alvos sorteados, podendo repetir. **Proposta:** o dano de carta é magia e **ignora a DEF**, como o ataque simples do Mago Arcanista (`GuerreiroDaMasmorra.md` §11); sem isso, golpes de `ATK × 0,5` não passariam da DEF dos monstros mais duros. Toda carta de dano respeita os escudos arcanos (quebra 1 escudo por acerto) e causa pelo menos 1.

**Deck inicial — proposta (10 cartas):**

| Carta | Qtd. | Mana | Alvo | Efeito |
|---|---|---|---|---|
| Faísca | 4 | 0 | 1 | `ATK × 0,6` de dano |
| Chuva de Brasas | 3 | 1 | área | `ATK × 0,5` em todos |
| Véu Cinzento | 2 | 1 | ela | escudo que absorve `ATK × 1,0` do próximo dano (a Couraça Arcana do Mago) |
| Estalo Duplo | 1 | 1 | salto | 2 golpes de `ATK × 0,5` em alvos sorteados |

**Cartas de recompensa — proposta:**

| Carta | Mana | Alvo | Efeito |
|---|---|---|---|
| Raio em Cadeia | 1 | salto | 3 golpes de `ATK × 0,45` |
| Nevasca | 2 | área | `ATK × 0,7` em todos e +1 de cansaço em cada um |
| Explosão Arcana | 2 | área | `ATK × 1,1` em todos |
| Lança de Luz | 1 | 1 | `ATK × 1,4` de dano |
| Chá de Ervas | 1 | ela | cura `ATK × 1,5` |
| Bênção ao Mestre | 1 | o Cavaleiro (na reserva) | cura `ATK × 1,5` do Cavaleiro |
| Pressa | 0 | ela | +1 mana e compra 1 carta |
| Lembrança | 1 | ela | compra 2 cartas |
| Passo Trocado | 0 | — | troca com o Cavaleiro, e ele **age na hora**, nesta mesma vaga (o comando Trocar gasta a vaga) |

- **Em aberto:** a lista final de cartas, o número de cópias de cada uma, se existem cartas raras e se as cartas evoluem (por exemplo, Faísca+).

### 7.3 Montar o deck

- **Proposta:**
  - **Recompensa:** ao vencer uma masmorra, o jogador escolhe **1 entre 3** cartas sorteadas do conjunto de recompensas, ou pula a escolha.
  - **Mercado:** remover uma carta do deck custa ouro, `100 × 2^(remoções já feitas)`.
  - **Tamanho:** o deck tem no mínimo 8 cartas e no máximo 20.
- **Em aberto:** se a escolha de carta também aparece entre as ondas, e se cartas podem ser compradas no Mercado.

## 8. Monstros

- **Definido:** os inimigos seguem a temática da **caça às bruxas**: aldeões, caçadores, guardas e padres da Inquisição, carrascos e os chefes da Ordem. As regras de combate continuam as do app: cada inimigo novo usa o comportamento de um monstro do Guerreiro original (golpes nomeados, velocidade, ataque à distância, fogo, suporte), com nome e arte novos. Ver `GuerreiroDaMasmorra.md` §8.
- **Definido:** toda a arte é refeita (§10). A floresta do prólogo tem as **gosmas** (§1.2).
- **Proposta (elenco do protótipo):** 8 comuns e 4 chefes. A ordem das listas decide o grupo e o chefe fixo de cada masmorra, como no app.

| Comportamento (`kind` do app) | Inimigo | Papel | HP / ATK / DEF | A partir do nível |
|---|---|---|---|---|
| `pawn` | Aldeão Furioso (forcado) | rápido, golpes simples | 30 / 9 / 2 | 1 |
| `archer` | Caçador de Bruxas (besta) | à distância | 24 / 12 / 1 | 1 |
| `lancer` | Guarda da Inquisição (alabarda) | combos com salto | 40 / 11 / 4 | 1 |
| `monk` | Padre Inquisidor | suporte: cura os aliados e amaldiçoa | 26 / 10 / 2 | 1 |
| `thief` | Cão de Caça | rápido, esquiva lateral | 26 / 10 / 1 | 2 |
| `torch` | Aldeã com Tocha | fogo: gruda brasa (a "dinamite" do app) | 28 / 10 / 2 | 3 |
| `tnt` | Fanático do Piche | fogo à distância (jarros de piche) | 22 / 9 / 1 | 3 |
| `mino` | Carrasco (machado) | pesado | 46 / 13 / 3 | 4 |
| `boss` (chefe) | Capitão da Ordem | chefe de espada e escudo | 160 / 20 / 6 | 1 |
| `kingslime` (chefe) | Gosma Rainha | a chefe do prólogo, que volta nas masmorras | 200 / 18 / 4 | 1 |
| `archerlord` (chefe) | Caçador-Mor | só esquivas com lado e um salto (tabela abaixo) | 175 / 19 / 5 | 3 |
| `troll` (chefe) | Grande Inquisidor | lento e brutal, golpes de fogo sagrado | 230 / 21 / 7 | 6 |

- **Gosmas do prólogo — proposta:** a Gosma tem os golpes Gosmada (parry), Pulo Gosmento (salto) e Rolada Viscosa (lateral), velocidade 9, HP 14 a 18 e ATK 5. A Gosma Rainha do prólogo tem HP 400 e ATK 7 e não pode ser derrotada pela Bruxa (§1.2).
- **Falas — Definido:** no meio da batalha os inimigos falam contra a bruxa. **Proposta (protótipo):**
  - **Quando:** um balão sobre a cabeça do inimigo, por cerca de 2,4 s, quando a onda começa, antes de alguns golpes e quando a dupla troca de lugar.
  - **De quem:** cada tipo tem falas próprias. Exemplos:
    - Aldeão: "Minha vaca morreu por sua culpa!"
    - Padre: "Em nome do Tribunal, eu te condeno!"
    - Caçador-Mor: "Já cacei cem bruxas. Você é a próxima."
  - **Para todos:** há falas gerais, como "Queimem a bruxa!", "Bruxa maldita! Merece a morte!" e "A fogueira espera por você, menina!".
  - **Com o Cavaleiro em campo:** as falas viram contra ele: "Traidor da Ordem! Vai queimar junto com ela!" e "Saia da frente, velho! A bruxa é nossa!".
  - **Bichos:** cão e gosmas só rosnam ou borbulham.
- **Em aberto:**
  - o elenco completo (o app tem 19 comuns e 8 chefes);
  - os nomes definitivos;
  - uma rodada de falas própria para os chefes no começo da onda 3.
- **Nota para o guia Unity:** a Fase 1 ainda semeia o elenco com os nomes do app. Os `kind` e os golpes não mudam, então trocar o elenco é só trocar os nomes e os ids de sprite no seeder.

- **Caçador-Mor (o Arqueiro Ancestral do app) — Definido (herdado do app):** não tem parry. Todo golpe é uma sequência de esquivas com lado marcado que sempre termina num salto (que abre o Ataque Aéreo):

| Golpe | Hits (notação de `GuerreiroDaMasmorra.md` §8.3, com `A` = abaixar, `S<` / `S>` = lateral para a esquerda / direita) | Nível efetivo mínimo |
|---|---|---|
| Tiro Cruzado | `S<.85 S>.85 J.9` | 1 |
| Cerco de Flechas | `S>.8 A.8 S<.8 J.9` | 1 |
| Salva do Ancestral | `A.8 S<.8 S>.8a J.95` | 6 |

- **Ordem dos chefes — proposta (protótipo):** Capitão da Ordem, Gosma Rainha, Caçador-Mor, Grande Inquisidor.
- **Em aberto:** algum monstro novo que valorize a área da Bruxa, por exemplo enxames de 4 a 5 aldeões fracos.

## 9. Masmorras, Acampamento e Progressão

### 9.1 O que é de cada um

- **Definido (herdado do app):** cada herói tem progressão própria: atributos comprados no acampamento (Vida, Ataque, Defesa) com os custos de `GuerreiroDaMasmorra.md` §10.1.
- **Proposta:**
  - Ouro, Souls, Tochas e Mapas são da **dupla** (um saldo só).
  - As **gemas** (`GuerreiroDaMasmorra.md` §10.3) são **só do Cavaleiro**: elas mexem em pedrada, parry, ataque simples e escudo, que são o jogo dele.
  - O **deck** é só da Bruxa.
- **Em aberto:** se a Bruxa ganha gemas próprias no futuro.

### 9.2 Masmorras

- **Definido (herdado):** as regras de `GuerreiroDaMasmorra.md` §9 (3 ondas, escala, escolta, nível efetivo, cor, vitória, derrota, NG+ na masmorra 33).
- **Definido (herdado do app):** os biomas são os do app: 4 ao ar livre (Castelo, Floresta, Cemitério, Ruínas) e 3 interiores (Cripta, Igreja Profanada, Salão do Castelo), estes com paredes, teto e tochas.
- **Proposta:** a vitória dá também a escolha de carta da Bruxa (§7.3).

### 9.3 Árvore de Souls

- **Definido (herdado do app):** os especiais não vêm mais do atributo Habilidade. Cada personagem tem uma **árvore** de nós comprados com Souls. Cada nó tem 3 níveis; o custo é `custo do nó × (nível atual + 1)`; um nó só abre depois do anterior.
- **Árvore do Cavaleiro — Definido (é a do Guerreiro do app):**

| Nó | Custo | Requer | Efeito por nível `n` |
|---|---|---|---|
| Fúria | 1 | — | libera o especial; +10% × `n` de dano |
| Combo | 2 | Fúria | libera; até `1 + n` golpes |
| Lâmina Invisível | 3 | Combo | libera; +15% × `n` de dano |
| Sequência Mortal | 4 | Lâmina | libera; janela da barra +10% × `n` |

- **No app, o nível do nó só aparece no texto:** o combate só confere se o nó foi comprado (nível ≥ 1), e os bônus por nível não são aplicados.
- **Proposta:** neste jogo os bônus valem. O guia Unity aplica os de Fúria, Combo e Lâmina.
- **Em aberto:** como alargar a janela da Sequência Mortal.

- **Árvore da Bruxa — proposta:**

| Nó | Custo | Requer | Efeito por nível `n` |
|---|---|---|---|
| Fonte | 1 | — | teto de mana +1 × `n` (4 → 7) |
| Mão Leve | 2 | Fonte | mão inicial +1 no nível 2 e +1 no nível 3 (4 → 6) |
| Faísca Viva | 3 | Mão Leve | cartas de área +10% × `n` de dano |
| Coven | 4 | Faísca Viva | +1 de mana no começo de cada masmorra × `n` |

### 9.4 Outros sistemas do app

- **Definido (herdado do app):** missões diárias com recompensa em ouro (Caçador de Chefões, Intocável, Cofre Cheio, Ceifador de Almas, Impecável), zeradas na virada do dia; recorde de maior dano num golpe; Baú do Dia. O tutorial do app (Campo de Treinamento) é substituído pelo prólogo na floresta (§1.2).
- **Proposta:** uma missão diária nova para a dupla: "Troca Perfeita": troque de personagem 10 vezes e vença a masmorra.

## 10. Estilo Visual

- **Definido:** a mesma ideia do Guerreiro da Masmorra 3D (app): cenário 3D iluminado (estrada, margens, paredes e teto nos interiores, tochas com luz que tremula) e personagens em **sprites 2D** sobre placas viradas para a câmera.
- **Definido:** **todos os sprites são refeitos** em **pixel art gerada no PixelLab**: a dupla, todo o elenco de monstros e chefes, os objetos de cena e a interface.
- **A dupla — Definido:**
  - **Cavaleiro:** velho, cabelos brancos, barba longa, armadura gasta; a espada gigantesca, meio quebrada, é a silhueta dele.
  - **Bruxa:** adolescente ruiva, capa cinza; a varinha solta faíscas.
- **Animações — proposta:** os dois com idle, corrida, ataque, guarda (parry), pulo, esquiva lateral, abaixar, dano e queda. O Cavaleiro tem um ataque mais demorado, para "vender" o peso. A Bruxa tem um aceno de varinha curto e um lançamento em área (a varinha erguida com um círculo de luz).
- **Câmera — Definido (herdada do app 3D):** atrás e acima de quem está em campo, que aparece de costas; os monstros vêm do fundo e aparecem de frente. **Proposta:** o personagem da reserva aparece pequeno, atrás e a um lado, esmaecido, e na troca os dois correm cruzando de lugar.
- **Interface — Definido:** todos os elementos de interface seguem um padrão único, feito do zero para o tema da caça às bruxas.
  - **Materiais:** painéis de madeira escura com cantoneiras de ferro, botões de madeira com latão e o botão principal em couro vermelho.
  - **Ícones:** todos são pixel art do PixelLab; **nenhum emoji** aparece no jogo.
  - **Proposta (do protótipo):** a fonte Pixelify Sans, a mesma do Iso Cards.
- **Cartas da Bruxa — Definido:** no estilo das cartas do Iso Cards (`IsoCards.md`).
  - Cada carta tem uma ilustração em pixel art que ocupa a janela de cima, uma moldura na cor do tipo, uma gema com o custo de mana no canto e uma placa clara com o nome.
  - **Proposta:** as cores da moldura são vermelho para fogo e dano direto, preto para arcano, azul para gelo e vento, verde para cura, branco para luz e cinza para o resto.
- **Em aberto:** a paleta; o tamanho em pixels dos sprites (o app usa quadros de 192 px); a arte dos biomas (o 3D do app reaproveita texturas do V2 3D).

## 11. Interface e Controles

- **Definido (herdado):** a batalha do app, em retrato: chip da masmorra e fila de iniciativa no topo, campo no meio, comandos à direita, log e barras na base; botões de ação confirmados segurando 0,9 s; toque e gestos como entrada principal, teclado no navegador.
- **Novo — proposta:**
  - **Painel da dupla** no canto de baixo: retrato e HP dos dois, com destaque em quem está em campo. A barra de Fúria só aparece com o Cavaleiro em campo, e as **gemas de mana** só com a Bruxa.
  - **Mão da Bruxa** na base da tela, no lugar do menu de comandos: até 4 a 6 cartas em leque, com o custo de mana no canto. Tocar uma carta a seleciona e mostra o efeito; segurar 0,5 s a joga no alvo atual. Ao lado ficam os botões **Encerrar**, **Trocar**, **Poção** e **Fugir**.
  - **Acampamento:** abas com o Cavaleiro e a Bruxa para comprar atributos e abrir a árvore de cada um, e uma tela de **Deck**.
- **Definido:** a batalha tem uma interface **mais limpa** que a do app. O que o protótipo já faz:
  - Sem as setas de mira: o alvo se escolhe tocando ou deslizando sobre o inimigo.
  - O nome do inimigo aparece só no alvo atual, e o herói mostra só a vida.
  - A mana da Bruxa aparece em cristais.
  - Encerrar, Poção e Trocar são botões redondos só com ícone.
- **Em aberto:** se segurar 0,5 s é rápido o bastante para o ritmo "rápido" da Bruxa, ou se tocar duas vezes na carta é melhor. **O protótipo usa dois toques:** o 1º levanta a carta e mostra o efeito numa plaquinha acima da mão, e o 2º a lança.

## 12. Áudio

- **Em aberto:** a trilha e os efeitos. O app tem música de acampamento e de batalha e efeitos de golpe, parry, esquiva, moeda, magia e cura. Ainda não está decidido se o jogo reaproveita esses sons, se troca todos ou se mistura as duas coisas. A Bruxa precisa de sons próprios de varinha e de cartas.

## 13. Persistência, Backend e Monetização

- **Definido:** save local (como o app).
- **Definido:** anúncios como no app:
  - intersticial a cada 5 entradas em masmorra;
  - vídeo premiado opcional para dobrar o bônus de vitória e para abrir o Baú do Dia;
  - nenhum anúncio é obrigatório para progredir.
- **Em aberto:** login e save na nuvem (o app tem login Google com save no Firestore em `saves/{uid}`); leaderboard (hoje nenhum).

## 14. Escopo do MVP

**Dentro:**
- O enredo de abertura e o prólogo na floresta, com o resgate pelo lenhador (§1.1 e §1.2).
- Os inimigos da caça às bruxas e as falas deles (§8).
- A dupla com troca, iniciativa por velocidade e as duas vagas da Bruxa.
- O Cavaleiro completo (o motor do Guerreiro do app) e a Bruxa com deck inicial, mana, cartas de recompensa e tela de Deck.
- As 33 masmorras com NG+, o elenco do app com arte nova, os biomas e interiores, o acampamento, a árvore de Souls, as missões diárias, o Baú do Dia e o tutorial.
- O palco HD-2D, save local e anúncios.

**Fora (pós-MVP):**
- Nuvem e login.
- Mais personagens.
- Cartas raras e evolução de cartas.
- Gemas da Bruxa.

## 15. Em aberto

- Nomes dos personagens, da vila e da Ordem, e o desfecho da história (§1.1 e §3).
- Elenco completo da caça às bruxas e falas dos chefes (§8).
- Bônus de troca (§4.1) e se o Cavaleiro age em rodadas alternadas (§4.2).
- Todos os números marcados como proposta: atributos e velocidades (§3), mana, mão e cartas (§7), custos de remoção e tamanho do deck (§7.3), árvore da Bruxa (§9.3).
- Os bônus por nível da árvore do Cavaleiro e a janela da Sequência Mortal (§9.3).
- Se o teste na web é uma build WebGL do projeto Unity ou um protótipo HTML/JS no repositório (§1).
- Lista final de cartas, raridade e evolução (§7.2).
- Novos nomes e possíveis novos monstros (§8).
- Gemas para a Bruxa (§9.1).
- Paleta, tamanho dos sprites e arte dos biomas (§10).
- Como jogar uma carta: segurar 0,5 s ou dois toques (§11).
- Áudio (§12), nuvem e leaderboard (§13).

---

# Parte 2 — Guia de Implementação Unity

Este guia constrói o Old Knight and the Witch em Unity 6, do projeto vazio até a build de Android. O combate do Cavaleiro é o motor do Guerreiro da Masmorra, que **já tem um guia completo** em `GuerreiroDaMasmorra.md` (Partes 2 a 12). Este guia não reescreve aquele motor. A Fase 1 manda copiar as fases certas de lá, com uma lista exata do que trocar. As fases seguintes escrevem completo só o que é novo:

- as reações do app (abaixar e a lateral com lado);
- o palco 3D com sprites iluminados;
- a dupla com troca;
- a Bruxa com deck e mana;
- o acampamento da dupla;
- a árvore de Souls e as missões diárias do app.

## Como usar este guia

O formato é o do guia do Guerreiro (ver "Como usar este guia" e "Duas operações que se repetem no guia inteiro" em `GuerreiroDaMasmorra.md`, Parte 2):

- Etapas pequenas, cada uma com um **🧪 Teste rápido**.
- Passos no Editor clique a clique, no formato **Menu → Submenu → Item**.
- Um **✅ Checkpoint** no fim de cada fase.

Há dois tipos de listagem:

- **Script novo:** completo. Crie o arquivo, apague o que a Unity gerou e cole o script inteiro.
- **Mudança num script que veio do guia do Guerreiro:** a etapa diz o arquivo, o trecho a procurar e o que entra no lugar. Quando a mudança mexe em quase tudo, a listagem é o arquivo inteiro e diz isso.

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele, como no guia do Guerreiro.
- **Namespaces:** os do Guerreiro com outro prefixo. `GuerreiroDaMasmorra.Data` vira `OldKnight.Data`, e o mesmo vale para `Combat`, `Battle`, `Meta`, `Services`, `EditorTools` e `Tests`.
- **Menus do Editor:** `OKW/...` no lugar de `GDM/...`.
- **ids:** os ids de monstros do jogo original continuam iguais (`pawn`, `kingslime`...). Os heróis são `knight` e `witch`.
- **Enums novos vão no fim.** A Unity grava enums como número no asset; um valor inserido no meio mudaria o significado dos assets que já existem.
- **Textos na tela sem emoji**, pela mesma razão do guia do Guerreiro: a fonte do TextMeshPro não tem emojis.

## Arquitetura em uma página

```
 Dados (ScriptableObjects)            Regras (C# puro)                       Cena Battle (MonoBehaviours)
 ─────────────────────────            ────────────────                       ────────────────────────────
 GameBalance, GameDatabase            WaveFactory, Initiative (+ dupla)      BattleController (ondas, rodadas, troca forçada)
 MonsterDefinition (+golpes)          HitResolver (+ abaixar, lado)            ├─ WarriorTurn ── CommandMenu (+ Trocar)
 HeroDefinition (+velocidade, vagas)  PartyRun (quem está em campo)            ├─ WitchTurn ──── WitchHandView, CardView
 CardDefinition (cartas da Bruxa)     WitchDeck, WitchMath (mão, mana)         ├─ PartySwap (troca encenada)
 BiomeDefinition (corredor 3D)        SkillTree, QuestRules                    ├─ MonsterTurn, BoomResolver
                                                                               └─ BattleStage (3D) ── CombatantView (sprite iluminado)
                                                                                    └─ CorridorBuilder (estrada, paredes, tochas)
 Cena Camp: CampScreen (+ aba da dupla), DeckScreen, CardRewardPanel, SkillTreeScreen, QuestScreen ── GameSession ── PlayerPrefs
```

- **A regra de ouro do guia do Guerreiro continua:** fórmulas, sorteios e estado ficam em classes C# comuns, e os MonoBehaviours só animam, mostram e coletam o toque. A dupla (`PartyRun`) e o deck (`WitchDeck`) também são C# puro e têm testes na Fase 7.
- **A dupla entra por um ponto só.** O `BattleContext` do Guerreiro tem um campo `Hero`, e quase todo o combate usa `ctx.Hero`. Aqui `Hero` passa a ser "quem está em campo agora" (`Party.Active`). Assim o turno do monstro, o QTE e o HUD continuam funcionando sem saber que existe uma dupla.
- **A Bruxa é outro `IHeroTurnTaker`**, ao lado do `WarriorTurn`. O controlador escolhe o turno pela classe de quem está em campo.
- **O palco 3D troca só a aparência.** `BattleStage` e `CombatantView` mantêm os mesmos métodos públicos do guia do Guerreiro (`HeroApproach`, `Float`, `MonsterAt`...), mas passam a trabalhar no chão 3D (eixo X para os lados, Z para o fundo do corredor). Quem chama não muda.

## Mapa de sistemas

| Namespace | Script | Responsabilidade | Fase |
|---|---|---|---|
| todos | os scripts das Fases 1 a 7 de `GuerreiroDaMasmorra.md` | O motor do Guerreiro, renomeado | 1 |
| `Data`/`EditorTools`/`Combat`/`Battle` | `Enums`, `GameDataSeeder`, `HitResolver`, `GestureInput`, `QteController` (mudanças) | Elenco do app, abaixar e lateral com lado | 1 |
| `Data`/`Battle` | `BiomeDefinition`, `CorridorBuilder`, `TorchFlicker`, `SpriteBillboard` | Corredor 3D e luz | 2 |
| `Battle` | `CombatantView`, `BattleStage` (substituem os do Guerreiro) | Personagens em sprites iluminados no chão 3D | 2 |
| `Combat` | `PartyRun`, `HeroRun`/`HeroLoadout`/`Initiative` (mudanças) | A dupla e a fila por velocidade | 3 |
| `Battle` | `BattleContext`, `BattleController` (substituem), `PartySwap`, `PartyHud` | Troca, troca forçada, derrota da dupla | 3 |
| `Data`/`Combat` | `CardDefinition`, `WitchDeck`, `WitchMath` | Cartas, mão e mana | 4 |
| `Battle` | `CardView`, `WitchHandView`, `WitchTurn` | O turno da Bruxa | 4 |
| `Meta` | `PartyRules`, `SaveData`/`GameSession` (mudanças), `CardRewardPanel`, `DeckScreen` | Acampamento da dupla e deck | 5 |
| `Meta` | `SkillTree`, `SkillTreeScreen`, `QuestRules`, `QuestScreen` | Árvore de Souls e missões diárias | 6 |
| `Tests` | `PartyTests`, `WitchDeckTests` | Testes da dupla e do deck | 7 |

## Fases

| Fase | Parte | Conteúdo | Etapas |
|---|---|---|---|
| 0 | 3 | Setup do projeto (3D URP, retrato) | 0A projeto · 0B pastas e cenas |
| 1 | 4 | O motor do Guerreiro | 1A copiar e renomear · 1B elenco do app · 1C abaixar e lateral com lado |
| 2 | 5 | Palco HD-2D | 2A sprite iluminado · 2B corredor 3D · 2C personagens no 3D · 2D câmera e luz |
| 3 | 6 | A dupla | 3A estado da dupla · 3B fila · 3C controlador · 3D comando Trocar · 3E painel da dupla |
| 4 | 7 | A Bruxa | 4A cartas · 4B deck e mana · 4C mão na tela · 4D turno da Bruxa |
| 5 | 8 | Acampamento da dupla | 5A save e regras · 5B telas |
| 6 | 9 | Extras do app | 6A árvore de Souls · 6B missões diárias |
| 7 | 10 | Testes automáticos | — |
| 8 | 11 | Build, anúncios e próximos passos | — |

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

> Objetivo desta fase: um projeto Unity 6 **3D (URP)** vazio, em retrato, versionado no Git, com as pastas e as duas cenas do jogo.

**Conceitos novos** (os do Guerreiro valem; ver `GuerreiroDaMasmorra.md`, Fase 0):
- **Template Universal 3D:** projeto com o **URP** (Universal Render Pipeline) em modo 3D: câmera em perspectiva, luzes em tempo real, sombras e névoa. É o que dá o visual HD-2D: o cenário é 3D de verdade e os personagens são sprites 2D em pé dentro dele.
- **Sprite em cena 3D:** um `SpriteRenderer` funciona numa cena 3D como uma placa fina. Com o material certo (Fase 2), a placa recebe a luz das tochas e projeta sombra no chão.

### Etapa 0A — Projeto e repositório

1. Instale o **Unity 6 LTS** com **Android Build Support** (marque **OpenJDK** e **Android SDK & NDK Tools**) e **Web Build Support**, como na Etapa 0A do Guerreiro.
2. **Unity Hub → Projects → New project** → template **Universal 3D** → nome `OldKnightAndTheWitch` → **Create project**.
3. Repositório, `.gitignore`, Git LFS, **Visible Meta Files** e **Force Text**: igual à Etapa 0B do Guerreiro.
4. **Window → Package Manager → Unity Registry**, instale ou confira:
   - **Input System** (a Unity pede para reiniciar: aceite);
   - **Test Framework**;
   - **Shader Graph** (já vem com o URP).
   O TextMeshPro já vem no pacote **uGUI**; na primeira vez que criar um texto, aceite **Import TMP Essentials**.
5. **Edit → Project Settings → Player → Other Settings → Active Input Handling** = `Input System Package (New)`.

### Etapa 0B — Pastas, cenas e tela retrato

1. Crie em `Assets/` a mesma árvore do Guerreiro, com quatro pastas a mais:

   ```
   Assets/_Project/
     Art/
       Sprites/
       Textures/        (chão, margens, paredes)
       Materials/
       Shaders/
       Fonts/
     Data/
       Monsters/
       Heroes/
       Gems/
       Anims/
       Cards/
       Biomes/
     Prefabs/
     Scenes/
     Scripts/
       Data/
       Combat/
       Battle/
       Meta/
       Services/
       Editor/
     Tests/
   ```

2. Mova `Assets/Scenes/SampleScene` para `_Project/Scenes/` e renomeie para `Battle`. Crie `Camp`: **File → New Scene → Basic (URP) → Create**, salve em `_Project/Scenes/Camp`.
3. Na Game view, crie e selecione a resolução `Retrato 1080x1920` (**Fixed Resolution**). Em **Project Settings → Player → Resolution and Presentation**, **Default Orientation** = `Portrait`.
4. **Qualidade para celular:** **Project Settings → Quality**, selecione o nível **Mobile** e marque-o como padrão para Android (a seta verde na coluna do Android). No asset do URP desse nível (`Assets/Settings/Mobile_RPAsset`), confira **Lighting → Additional Lights** = `Per Pixel` e **Per Object Limit** = `4`: as tochas da Fase 2 precisam de luzes adicionais.

### 🧪 Teste rápido
Abra `Battle` e aperte ▶. A Game view mostra o céu padrão do URP num retângulo em pé, sem erros no Console.

### ✅ Checkpoint da Fase 0
- Projeto **Universal 3D** com Input System, Test Framework e Shader Graph.
- Cenas `Camp` e `Battle` em `_Project/Scenes/`; Game view em retrato.
- Commit: `chore: estrutura do projeto`.

Próxima fase: **Fase 1 — O motor do Guerreiro**.

---

# Parte 4 — Implementação Unity: Fase 1 (O motor do Guerreiro)

> Objetivo desta fase: o combate do Guerreiro da Masmorra rodando neste projeto, com o elenco do app e as duas reações que o app acrescentou (abaixar e lateral com lado). No fim, uma masmorra inteira se joga com o Cavaleiro sozinho, ainda no palco 2D do guia do Guerreiro.

**Conceitos novos:**
- **Renomear um namespace em massa:** o editor de código troca um texto em todos os arquivos de uma pasta (**Edit → Find and Replace → Replace in Files** no Visual Studio; **Ctrl+Shift+H** no VS Code e no Rider).
- **Palco provisório:** nesta fase a batalha usa o palco 2D do guia do Guerreiro (câmera ortográfica, sprites chapados). Um projeto URP 3D desenha sprites 2D sem problema. A Fase 2 troca esse palco pelo 3D.

### Etapa 1A — Copiar e renomear

Siga `GuerreiroDaMasmorra.md` e crie, **na mesma ordem**, todos os scripts das fases abaixo. Monte as cenas como aquele guia manda.

| Fase do guia do Guerreiro | O que fazer aqui |
|---|---|
| 1 — Dados | Tudo. O `GameDataSeeder` muda na Etapa 1B |
| 2 — Regras de combate | Tudo, e o `RulesSmokeTest` também |
| 3 — A batalha andando sozinha | Tudo. O `BattleStage` e o `CombatantView` são provisórios (a Fase 2 os substitui). No `BattleController`, deixe o campo **Mage Turn** vazio |
| 4 — Reações (QTE) | Tudo. A Etapa 1C muda o `GestureInput` e o `QteController` |
| 5 — Especiais e pedrada | Tudo |
| 6 — Fim de masmorra | Tudo |
| 7 — Acampamento, mercado e save | Tudo. A Fase 5 deste guia acrescenta a dupla |
| 8 — Testes automáticos | Tudo (a Fase 7 deste guia acrescenta os testes novos) |
| 9 — Build, anúncios e nuvem | **Ainda não.** Os anúncios entram na Fase 8 deste guia; a nuvem fica fora do MVP |
| 10 — Mago, heróis e duelos | **Não.** O Mago e o mapa-múndi não existem neste jogo; a Bruxa é a Fase 4 |

Depois de criar os scripts, troque os nomes do Guerreiro pelos deste jogo com **Replace in Files**, só dentro de `Assets/_Project`:

| Procurar | Trocar por | Por quê |
|---|---|---|
| `GuerreiroDaMasmorra.` | `OldKnight.` | namespaces e `using` |
| `namespace GuerreiroDaMasmorra` | `namespace OldKnight` | os poucos arquivos sem ponto depois do nome |
| `"GDM/` | `"OKW/` | menus do Editor e de criação de assets |
| `gdm.save.v1` | `okw.save.v1` | chave do save no `PlayerPrefs` (o jogo não lê o save do Guerreiro) |
| `GDM:` | `OKW:` | mensagens do Console |

Os três **Assembly Definitions** da Fase 8 do Guerreiro também mudam de nome: `OldKnight`, `OldKnight.Editor` e `OldKnight.Tests`, com as referências apontando para `OldKnight`.

### 🧪 Teste rápido
O Console compila sem erros. **OKW → Criar ou atualizar dados iniciais** cria os dados, e a cena `Battle` aberta direto joga uma masmorra (o `BattleTestStarter` do guia do Guerreiro).

### Etapa 1B — Elenco do app, os dois heróis e a velocidade

**`Enums.cs`**: acrescente `Witch` **no fim** do `HeroClass` e três reações **no fim** do `ReactionType`:

```csharp
    // POR QUE: as reações da Parte 1 §5. As três últimas vieram do app:
    // abaixar (golpe alto) e a lateral que exige um lado.
    public enum ReactionType
    {
        Parry,
        Jump,
        Side,
        Duck,
        SideLeft,
        SideRight,
    }
```

```csharp
    // POR QUE: o sistema de combate do herói. Mage fica no enum (o guia do
    // Guerreiro o usa) mas não é jogável neste jogo.
    public enum HeroClass
    {
        Warrior,
        Mage,
        Witch,
    }
```

**`HeroDefinition.cs`**: arquivo inteiro. Entram a velocidade e as vagas de cada personagem (Parte 1 §3 e §4.2):

```csharp
// Caminho: Assets/_Project/Scripts/Data/HeroDefinition.cs
using UnityEngine;

namespace OldKnight.Data
{
    // POR QUE: um personagem jogável (Parte 1 §3): atributos iniciais,
    // sistema de combate e o ritmo dele na fila de iniciativa.
    // ESTRATÉGIA: só o ponto de partida; o que o jogador comprou fica no
    // save. `speed` e `turnsPerRound` fazem o Cavaleiro ser lento e a Bruxa
    // rápida sem nenhuma regra especial no controlador: a fila só lê estes
    // números de quem está em campo.
    [CreateAssetMenu(fileName = "Hero", menuName = "OKW/Hero")]
    public class HeroDefinition : ScriptableObject
    {
        public string id;
        public string displayName;
        public HeroClass heroClass;
        public int maxHp;
        public int attack;
        public int defense;
        [Tooltip("Só o Cavaleiro ganha Fúria com o ataque simples.")]
        public bool furyOnAttack;
        [Tooltip("Mantido do guia do Guerreiro; não é usado (sem mapa-múndi).")]
        public int recruitCity = -1;

        [Header("Ritmo na fila (Parte 1 §4.2)")]
        [Tooltip("Velocidade-base da vaga do herói quando este personagem está em campo.")]
        public int speed = 10;
        [Tooltip("Quantas vagas por rodada.")]
        public int turnsPerRound = 1;
        [Tooltip("Quanto cada vaga extra perde na rolagem.")]
        public int extraTurnPenalty = 4;

        [Header("Só a Bruxa (Parte 1 §7.1)")]
        public int handSize = 4;
        public int manaPerTurn = 2;
        public int maxMana = 4;
    }
}
```

**`GameDataSeeder.cs`**, quatro mudanças:

1. A expressão dos hits aceita `A` (abaixar) e `S<` / `S>` (lateral com lado). Troque a linha do `HitToken`:

   ```csharp
        // P = parry, J = salto, S = lateral, S< / S> = lateral com lado, A = abaixar.
        private static readonly Regex HitToken = new Regex(@"^(P|J|S<|S>|S|A)([0-9]*\.?[0-9]*)([ad]?)$");
   ```

   E, dentro do método `M`, troque a atribuição de `type`:

   ```csharp
                    type = match.Groups[1].Value switch
                    {
                        "P" => ReactionType.Parry,
                        "J" => ReactionType.Jump,
                        "A" => ReactionType.Duck,
                        "S<" => ReactionType.SideLeft,
                        "S>" => ReactionType.SideRight,
                        _ => ReactionType.Side,
                    },
   ```

2. Os nomes dos comuns e do chefe que o app renomeou (Parte 1 §8). Só o texto entre aspas do nome muda:

   | id | Nome do guia do Guerreiro | Nome aqui |
   |---|---|---|
   | `pawn` | Servo | Cavaleiro Negro |
   | `archer` | Arqueiro | Arqueiro Espectral |
   | `lancer` | Lanceiro | Lanceiro Sepulcral |
   | `monk` | Monge | Cultista |
   | `gnome` | Gnomo Arruaceiro | Servo Deformado |
   | `thief` | Ladrão | Espectro Ladino |
   | `snake` | Cobra Venenosa | Serpente Podre |
   | `skull` | Caveira Amaldiçoada | Lich Amaldiçoado |
   | `shaman` | Xamã Selvagem | Necromante |
   | `panda` | Panda Guerreiro | Ogro Carrasco |

3. O chefe novo, **depois** do `panda` (a ordem dos chefes decide o chefe fixo de cada masmorra):

   ```csharp
            // Do app: o Arqueiro Ancestral não apara; só esquivas com lado e um salto no fim.
            Monster(true, "archerlord", "Arqueiro Ancestral", 175, 19, 5, 3, 8, "dist",
                M("Tiro Cruzado", "S<.85 S>.85 J.9"), M("Cerco de Flechas", "S>.8 A.8 S<.8 J.9"),
                M("Salva do Ancestral", "A.8 S<.8 S>.8a J.95", 6));
   ```

4. Os heróis. Troque o bloco `// §3 — heróis.` inteiro (a função local `Hero` e as cinco chamadas) por este:

   ```csharp
            // Parte 1 §3 — a dupla. Os números são a proposta do GDD.
            var heroes = new List<HeroDefinition>();
            HeroDefinition Hero(string id, string name, HeroClass cls, int hp, int atk, int def, bool furyOnAttack,
                int speed, int turns)
            {
                var h = LoadOrCreate<HeroDefinition>($"{Root}/Heroes/{id}.asset");
                h.id = id;
                h.displayName = name;
                h.heroClass = cls;
                h.maxHp = hp;
                h.attack = atk;
                h.defense = def;
                h.furyOnAttack = furyOnAttack;
                h.speed = speed;
                h.turnsPerRound = turns;
                EditorUtility.SetDirty(h);
                heroes.Add(h);
                return h;
            }

            Hero("knight", "Velho Cavaleiro", HeroClass.Warrior, 70, 14, 4, true, 6, 1);
            Hero("witch", "Bruxa", HeroClass.Witch, 45, 8, 2, false, 13, 2);
   ```

5. No `SaveData` (Fase 7 do Guerreiro), troque o padrão de `activeHero` de `"warrior"` para `"knight"`. O `MetaRules.NewGame` do Guerreiro cria a progressão de todos os heróis da lista, e os dois nascem liberados (`recruitCity` é `-1`).
6. O herói `warrior` deixou de existir, mas os testes do Guerreiro conferem números dele (HP 60, ATK 10). Para eles continuarem valendo, os testes passam a usar um Guerreiro criado só na memória. No `TestData`, acrescente:

   ```csharp
        // O Guerreiro do guia original, criado só na memória: os testes
        // herdados conferem os números dele (HP 60, ATK 10, DEF 3).
        public static HeroDefinition WarriorDef()
        {
            var h = ScriptableObject.CreateInstance<HeroDefinition>();
            h.id = "warrior";
            h.heroClass = HeroClass.Warrior;
            h.maxHp = 60;
            h.attack = 10;
            h.defense = 3;
            h.furyOnAttack = true;
            return h;
        }
   ```

   (com `using UnityEngine;` no topo, se ainda não houver). Depois troque `Db.Hero("warrior")` por `WarriorDef()` nos testes, e `"warrior"` por `"knight"` nas chamadas `MetaRules.Progress(save, "warrior")`, no `RulesSmokeTest` e no campo **Hero Id** do `BattleTestStarter`.

> O Guerreiro tinha `heroSpeed = 10` no `GameBalance`. Ele continua lá, mas só como reserva: a fila da Fase 3 lê a velocidade do `HeroDefinition`.

### 🧪 Teste rápido
**OKW → Criar ou atualizar dados iniciais**. O Console mostra `OKW: 19 comuns, 8 chefes, 2 heróis e 4 gemas prontos.` Abra `Data/Monsters/boss_archerlord`: **Cerco de Flechas** tem 4 hits (SideRight, Duck, SideLeft, Jump).

### Etapa 1C — Abaixar e lateral com lado

**`HitResolver.cs`**: as reações novas se resolvem como a lateral (esquivou: zero dano e nenhuma Fúria; errou: dano cheio). Troque o primeiro `if` de `Resolve`:

```csharp
            // Lateral, lateral com lado e abaixar: só evitam o dano (Parte 1 §5).
            if (type is ReactionType.Side or ReactionType.SideLeft or ReactionType.SideRight or ReactionType.Duck)
            {
                damage = result == QteResult.Dodge ? 0 : CombatMath.FullHit(attack, rng);
            }
```

**`GestureInput.cs`**: arquivo inteiro. Entram o deslize para baixo e o lado do deslize:

```csharp
// Caminho: Assets/_Project/Scripts/Battle/GestureInput.cs
using System;
using UnityEngine;
using UnityEngine.InputSystem;

namespace OldKnight.Battle
{
    // POR QUE: traduz toque, mouse e teclado nos gestos do jogo (Parte 1 §5):
    // tocar, arrastar para cima, arrastar para baixo e deslizar para um lado.
    // ESTRATÉGIA: o toque é anunciado no instante em que o dedo encosta (o
    // tempo do parry é medido aí); o deslize, quando o dedo anda mais que o
    // limite numa direção dominante, uma vez por toque. O deslize lateral
    // diz o lado: -1 esquerda, +1 direita. Teclado: Espaço ou Enter = toque,
    // ↑ = salto, ↓ = abaixar, ← → = lateral.
    public class GestureInput : MonoBehaviour
    {
        [SerializeField] private float _swipeInches = 0.2f;

        public event Action Tapped;
        public event Action SwipedUp;
        public event Action SwipedDown;
        public event Action<int> SwipedSide;

        private Vector2 _start;
        private bool _tracking;

        // Lê os dispositivos a cada quadro.
        private void Update()
        {
            var keyboard = Keyboard.current;
            if (keyboard != null)
            {
                if (keyboard.spaceKey.wasPressedThisFrame || keyboard.enterKey.wasPressedThisFrame) Tapped?.Invoke();
                if (keyboard.upArrowKey.wasPressedThisFrame) SwipedUp?.Invoke();
                if (keyboard.downArrowKey.wasPressedThisFrame) SwipedDown?.Invoke();
                if (keyboard.leftArrowKey.wasPressedThisFrame) SwipedSide?.Invoke(-1);
                if (keyboard.rightArrowKey.wasPressedThisFrame) SwipedSide?.Invoke(1);
            }

            var pointer = Pointer.current;
            if (pointer == null) return;
            Vector2 position = pointer.position.ReadValue();

            if (pointer.press.wasPressedThisFrame)
            {
                _start = position;
                _tracking = true;
                Tapped?.Invoke();
            }

            if (_tracking && pointer.press.isPressed)
            {
                Vector2 delta = position - _start;
                float limit = _swipeInches * (Screen.dpi > 0 ? Screen.dpi : 160f);
                bool vertical = Mathf.Abs(delta.y) > Mathf.Abs(delta.x);
                if (vertical && delta.y > limit)
                {
                    _tracking = false;
                    SwipedUp?.Invoke();
                }
                else if (vertical && delta.y < -limit)
                {
                    _tracking = false;
                    SwipedDown?.Invoke();
                }
                else if (!vertical && Mathf.Abs(delta.x) > limit)
                {
                    _tracking = false;
                    SwipedSide?.Invoke(delta.x > 0 ? 1 : -1);
                }
            }

            if (pointer.press.wasReleasedThisFrame) _tracking = false;
        }
    }
}
```

**`QteController.cs`**: o `SwipedSide` agora passa o lado, e o abaixar é novo. Troque o método `React` inteiro e as três funções do fim do arquivo (`ColorOf`, `IconOf`, `TipOf`):

```csharp
        // Abre o círculo para um golpe de monstro e devolve a reação.
        public async Awaitable<QteResult> React(ReactionType type, float seconds, QteCurve curve, string tag)
        {
            var result = QteResult.Miss;
            float start = Time.time;

            void OnTap()
            {
                if (type != ReactionType.Parry || result != QteResult.Miss) return;
                result = QteTiming.IsPerfect(Time.time - start, seconds, Balance) ? QteResult.Perfect : QteResult.Block;
                _tip.text = result == QteResult.Perfect ? "PERFEITO!" : "BLOQUEADO";
            }
            void OnUp()
            {
                if (type != ReactionType.Jump || result != QteResult.Miss) return;
                result = QteResult.Dodge;
                _tip.text = "ESQUIVA! ATAQUE NO AR!";
            }
            void OnDown()
            {
                if (type != ReactionType.Duck || result != QteResult.Miss) return;
                result = QteResult.Dodge;
                _tip.text = "ABAIXOU!";
            }
            void OnSide(int side)
            {
                if (result != QteResult.Miss) return;
                bool any = type == ReactionType.Side;
                bool left = type == ReactionType.SideLeft && side < 0;
                bool right = type == ReactionType.SideRight && side > 0;
                if (!any && !left && !right) return;   // lado errado: o golpe acerta (Parte 1 §5)
                result = QteResult.Dodge;
                _tip.text = "ESQUIVA LATERAL!";
            }

            _input.Tapped += OnTap;
            _input.SwipedUp += OnUp;
            _input.SwipedDown += OnDown;
            _input.SwipedSide += OnSide;
            try
            {
                Open(ColorOf(type), IconOf(type), Prefix(tag) + TipOf(type));
                await RunRing(seconds, curve, () => result == QteResult.Miss);
            }
            finally
            {
                _input.Tapped -= OnTap;
                _input.SwipedUp -= OnUp;
                _input.SwipedDown -= OnDown;
                _input.SwipedSide -= OnSide;
                _root.SetActive(false);
            }
            return result;
        }
```

```csharp
        private Color ColorOf(ReactionType type) => type switch
        {
            ReactionType.Jump => _jumpColor,
            ReactionType.Duck => _jumpColor,
            ReactionType.Side or ReactionType.SideLeft or ReactionType.SideRight => _sideColor,
            _ => _parryColor,
        };

        private static string IconOf(ReactionType type) => type switch
        {
            ReactionType.Jump => "PULE",
            ReactionType.Duck => "ABAIXE",
            ReactionType.SideLeft => "<< DESVIE",
            ReactionType.SideRight => "DESVIE >>",
            ReactionType.Side => "DESVIE",
            _ => "APARE",
        };

        private static string TipOf(ReactionType type) => type switch
        {
            ReactionType.Jump => "ARRASTE PARA CIMA!",
            ReactionType.Duck => "ARRASTE PARA BAIXO!",
            ReactionType.SideLeft => "DESLIZE PARA A ESQUERDA!",
            ReactionType.SideRight => "DESLIZE PARA A DIREITA!",
            ReactionType.Side => "DESLIZE PARA O LADO!",
            _ => "TOQUE QUANDO O CÍRCULO FECHAR!",
        };
```

Se algum outro script do guia do Guerreiro assina `_input.SwipedSide += ...` com um método sem parâmetro (por exemplo, o `MinigamePanel`), o Console acusa o erro na linha. Troque o método para receber `int side` e ignore o valor.

**`MonsterTurn.cs`**: a mensagem da esquiva. No método `Show`, troque o `ctx.Log` do caso `QteResult.Dodge`:

```csharp
                    ctx.Log(o.Type switch
                    {
                        ReactionType.Jump => $"Você saltou sobre o golpe rasteiro de {monster.Name} (+1 Fúria)!",
                        ReactionType.Duck => $"Você se abaixou e o golpe alto de {monster.Name} passou por cima!",
                        _ => $"Você deslizou para o lado e o golpe de {monster.Name} passou reto!",
                    });
```

O `AutoPlayer` não precisa mudar: para qualquer reação que não é parry, ele já devolve `Dodge` quando acerta.

### 🧪 Teste rápido
No `BattleTestStarter`, ponha **Level** `3` e escolha uma masmorra cujo chefe seja o Arqueiro Ancestral (com o `AutoPlayer` desligado, para reagir você mesmo). Na onda 3, o círculo pede **<< DESVIE**, **DESVIE >>** e **ABAIXE**. Com o teclado: ← e → no lado certo esquivam e no lado errado levam o dano; ↓ abaixa.

### ✅ Checkpoint da Fase 1
- Todos os scripts das Fases 1 a 8 do Guerreiro compilam com os namespaces `OldKnight.*`.
- O seeder cria 19 comuns, 8 chefes (com o Arqueiro Ancestral) e os dois heróis.
- Abaixar e lateral com lado funcionam no toque e no teclado.
- Os testes do Guerreiro passam (**Window → General → Test Runner → EditMode → Run All**).
- Commit: `feat: motor do Guerreiro com elenco e reações do app`.

#### Problemas comuns
- **`The type or namespace name 'GuerreiroDaMasmorra' could not be found`:** algum arquivo escapou do Replace in Files (geralmente um `using` em script de teste). Procure `GuerreiroDaMasmorra` em `Assets/_Project`.
- **`OKW` não aparece no menu:** o seeder não está numa pasta `Editor`, ou há erro de compilação em outro script. Corrija o Console primeiro.
- **O lado errado esquiva mesmo assim:** o golpe foi criado com `S` (qualquer lado) em vez de `S<` / `S>`. Confira a notação no seeder e rode o menu de novo.

Próxima fase: **Fase 2 — Palco HD-2D**.

---

# Parte 5 — Implementação Unity: Fase 2 (Palco HD-2D)

> Objetivo desta fase: a batalha sai do palco 2D e vai para um corredor 3D iluminado (estrada, margens ou paredes, tochas que tremulam, névoa no fundo), com os personagens em sprites 2D de pé no chão, recebendo luz e projetando sombra. As regras não mudam em nada.

**Conceitos novos:**
- **Shader Graph:** um editor visual de shaders. Aqui ele cria um material de sprite que **recebe luz 3D**. O material de sprite padrão é "unlit": ignora as tochas e deixaria os personagens chapados no meio do cenário iluminado.
- **Alpha Clipping:** pixels com transparência abaixo de um limite são descartados por inteiro. Para pixel art isso é perfeito (borda dura), e ainda deixa o sprite projetar uma sombra com o recorte certo.
- **Luz adicional (Point Light):** uma luz que irradia de um ponto, como uma tocha. O URP no celular aceita poucas por objeto (a Etapa 0B configurou 4).
- **Névoa (Fog):** o URP mistura uma cor com o que está longe da câmera. Esconde o fim do corredor e dá profundidade.
- **Billboard:** um objeto que gira para ficar de frente para a câmera.
- **Raycast:** um raio que sai da câmera pelo ponto tocado e diz em que collider bateu. Substitui o `Physics2D.OverlapPoint` do palco 2D.

### Etapa 2A — O material de sprite iluminado

1. Em `Art/Shaders`: botão direito → **Create → Shader Graph → URP → Lit Shader Graph**, nome `SpriteLit`. Duplo clique para abrir.
2. **Graph Inspector → Graph Settings** (a aba do painel da direita):
   - **Surface Type** `Opaque`;
   - **Alpha Clipping** marcado;
   - **Render Face** `Both`;
   - **Cast Shadows** marcado.
3. No **Blackboard** (painel da esquerda), **+ → Texture2D**, nome `MainTex`. No **Graph Inspector → Node Settings**, **Reference** = `_MainTex`. É o nome que o `SpriteRenderer` usa para mandar o quadro atual ao material.
4. Monte os nós (espaço no grafo → **Create Node**, digite o nome):
   - Arraste `MainTex` para o grafo → ligue em um **Sample Texture 2D** (entrada **Texture**).
   - **Vertex Color** (a cor do `SpriteRenderer`, usada no piscar de dano) → **Multiply** com a saída **RGBA** do Sample.
   - A saída do Multiply vai para **Base Color** do Fragment.
   - Um **Split** na saída do Multiply → a saída **A** vai para **Alpha** do Fragment.
   - **Alpha Clip Threshold** do Fragment = `0.5`.
5. **Normais.** O sprite não tem normais próprias, e sem elas a luz fica errada (o sprite aparece preto ou piscando). No contexto **Vertex**, ligue:
   - um **Vector 3** `(0, 0, -1)` em **Normal**;
   - um **Vector 3** `(1, 0, 0)` em **Tangent**.

   Nos dois, deixe o espaço em **Object**. Assim a placa "aponta" para a câmera.
6. **Save Asset**. Em `Art/Materials`: **Create → Material**, nome `M_SpriteLit`, **Shader** = `Shader Graphs/SpriteLit`.
7. **Material do chão:** **Create → Material**, nome `M_Ground`, **Shader** = `Universal Render Pipeline/Lit`, **Smoothness** `0`. Os materiais do corredor são cópias dele criadas por código.

**Importação da pixel art (PixelLab):** selecione os PNGs dos personagens → **Texture Type** `Sprite (2D and UI)`, **Sprite Mode** `Multiple`, **Pixels Per Unit** `100`, **Filter Mode** `Point (no filter)`, **Compression** `None` → **Apply**. No **Sprite Editor**, **Slice → Grid By Cell Size** com o tamanho do quadro e **Pivot** `Bottom`. As texturas de chão, margem e parede: **Texture Type** `Default`, **Wrap Mode** `Repeat`, **Filter Mode** `Point`, **Compression** `None`.

### 🧪 Teste rápido
Crie um **Point Light** e um objeto com **Sprite Renderer** usando qualquer sprite e o material `M_SpriteLit`. Mova a luz: o sprite clareia do lado da luz e escurece longe dela. Apague os dois objetos.

### Etapa 2B — O corredor 3D

Cada bioma (Parte 1 §9.2) vira um asset com as texturas e as cores dele.

```csharp
// Caminho: Assets/_Project/Scripts/Data/BiomeDefinition.cs
using UnityEngine;

namespace OldKnight.Data
{
    // POR QUE: um bioma da Parte 1 §9.2 (Castelo, Floresta, Cemitério,
    // Ruínas e os interiores Cripta, Igreja Profanada, Salão do Castelo).
    // ESTRATÉGIA: só aparência. Ao ar livre há margens com objetos de
    // cena, céu e lua; nos interiores, paredes, teto e tochas, sem céu. O
    // CorridorBuilder lê este asset e monta o corredor.
    [CreateAssetMenu(fileName = "Biome", menuName = "OKW/Biome")]
    public class BiomeDefinition : ScriptableObject
    {
        public string id;
        public string displayName;
        public bool interior;

        [Header("Texturas (Wrap Repeat, Filter Point)")]
        public Texture2D road;
        public Texture2D verge;
        public Texture2D wall;
        public Texture2D ceiling;

        [Header("Objetos de cena nas margens (só ao ar livre)")]
        public Sprite[] props;
        [Range(0f, 1f)] public float propChance = 0.35f;
        [Tooltip("Silhueta no horizonte (opcional).")]
        public Sprite skyline;

        [Header("Luz e névoa")]
        public Color sky = new Color(0.08f, 0.09f, 0.16f);
        public Color ambient = new Color(0.35f, 0.36f, 0.45f);
        public Color fog = new Color(0.07f, 0.08f, 0.14f);
        public float moonIntensity = 0.6f;
        [Tooltip("Uma tocha a cada N fileiras (0 = nenhuma).")]
        public int torchEvery = 4;
        public Color torchColor = new Color(1f, 0.62f, 0.3f);
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/TorchFlicker.cs
using UnityEngine;

namespace OldKnight.Battle
{
    // POR QUE: tocha parada parece lâmpada. A luz que tremula é o que vende
    // o corredor iluminado a fogo (Parte 1 §10).
    // ESTRATÉGIA: soma duas ondas de ruído de Perlin na intensidade; cada
    // tocha começa num ponto diferente do ruído para não piscarem juntas.
    [RequireComponent(typeof(Light))]
    public class TorchFlicker : MonoBehaviour
    {
        [SerializeField] private float _base = 2.2f;
        [SerializeField] private float _amount = 0.6f;
        [SerializeField] private float _speed = 3f;

        private Light _light;
        private float _seed;

        private void Awake()
        {
            _light = GetComponent<Light>();
            _seed = Random.value * 100f;
        }

        // Varia a intensidade a cada quadro.
        private void Update()
        {
            float t = Time.time * _speed + _seed;
            float noise = Mathf.PerlinNoise(t, 0f) * 0.7f + Mathf.PerlinNoise(t * 2.7f, 1f) * 0.3f;
            _light.intensity = _base + (noise - 0.5f) * 2f * _amount;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/SpriteBillboard.cs
using UnityEngine;

namespace OldKnight.Battle
{
    // POR QUE: um sprite de lado vira uma linha fina. Personagens, objetos
    // de cena e chamas ficam sempre de frente para a câmera.
    // ESTRATÉGIA: gira só em torno do eixo vertical (yaw), para o sprite
    // continuar em pé no chão quando a câmera olha um pouco para baixo.
    public class SpriteBillboard : MonoBehaviour
    {
        private Transform _camera;

        // Copia a direção da câmera, sem a inclinação.
        private void LateUpdate()
        {
            if (_camera == null)
            {
                if (Camera.main == null) return;
                _camera = Camera.main.transform;
            }
            Vector3 forward = _camera.forward;
            forward.y = 0f;
            if (forward.sqrMagnitude > 0.0001f) transform.rotation = Quaternion.LookRotation(forward);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/CorridorBuilder.cs
using System.Collections.Generic;
using OldKnight.Data;
using UnityEngine;
using UnityEngine.Rendering;

namespace OldKnight.Battle
{
    // POR QUE: o cenário 3D da Parte 1 §10: uma estrada que segue para o
    // fundo, margens com objetos ao ar livre ou paredes e teto nos
    // interiores, tochas e névoa. Entre as ondas, a marcha faz o chão andar
    // para trás (como no app).
    // ESTRATÉGIA: o corredor é uma fila de "fileiras" de 2 × 2 unidades ao
    // longo do eixo Z, cada uma com seus quads (estrada, margens ou paredes,
    // teto). Na marcha, as fileiras andam para −Z; a que passa da câmera
    // pula para o fim da fila. Nada é criado durante a marcha.
    public class CorridorBuilder : MonoBehaviour
    {
        [SerializeField] private Material _groundMaterial;
        [SerializeField] private Material _spriteMaterial;
        [SerializeField] private Light _moon;
        [SerializeField] private Camera _camera;
        [SerializeField] private float _tile = 2f;
        [SerializeField] private int _rows = 18;
        [SerializeField] private float _startZ = -6f;
        [SerializeField] private float _roadHalfWidth = 2f;
        [SerializeField] private float _vergeWidth = 6f;
        [SerializeField] private float _wallHeight = 4.5f;
        [SerializeField] private float _marchSpeed = 4f;

        private readonly List<Transform> _rowRoots = new List<Transform>();
        private readonly List<Material> _materials = new List<Material>();
        private bool _scrolling;

        // Monta o corredor de um bioma (apaga o anterior).
        public void Build(BiomeDefinition biome, System.Random rng)
        {
            Clear();
            var road = MaterialFor(biome.road);
            var verge = MaterialFor(biome.verge != null ? biome.verge : biome.road);
            var wall = MaterialFor(biome.wall != null ? biome.wall : biome.road);
            var ceiling = MaterialFor(biome.ceiling != null ? biome.ceiling : biome.wall);

            for (int i = 0; i < _rows; i++)
            {
                var row = new GameObject($"Row{i}").transform;
                row.SetParent(transform, false);
                row.localPosition = new Vector3(0f, 0f, _startZ + i * _tile);
                _rowRoots.Add(row);

                Quad(row, road, new Vector3(0f, 0f, 0f), new Vector3(90f, 0f, 0f), new Vector2(_roadHalfWidth * 2f, _tile));
                if (biome.interior)
                {
                    Quad(row, wall, new Vector3(-_roadHalfWidth - 0.5f, _wallHeight / 2f, 0f), new Vector3(0f, -90f, 0f), new Vector2(_tile, _wallHeight));
                    Quad(row, wall, new Vector3(_roadHalfWidth + 0.5f, _wallHeight / 2f, 0f), new Vector3(0f, 90f, 0f), new Vector2(_tile, _wallHeight));
                    Quad(row, ceiling, new Vector3(0f, _wallHeight, 0f), new Vector3(-90f, 0f, 0f), new Vector2(_roadHalfWidth * 2f + 1f, _tile));
                    if (biome.torchEvery > 0 && i % biome.torchEvery == 0) Torch(row, biome, i / biome.torchEvery % 2 == 0 ? -1 : 1);
                }
                else
                {
                    float x = _roadHalfWidth + _vergeWidth / 2f;
                    Quad(row, verge, new Vector3(-x, -0.01f, 0f), new Vector3(90f, 0f, 0f), new Vector2(_vergeWidth, _tile));
                    Quad(row, verge, new Vector3(x, -0.01f, 0f), new Vector3(90f, 0f, 0f), new Vector2(_vergeWidth, _tile));
                    for (int side = -1; side <= 1; side += 2)
                    {
                        if (biome.props == null || biome.props.Length == 0 || rng.NextDouble() > biome.propChance) continue;
                        var sprite = biome.props[rng.Next(biome.props.Length)];
                        float px = side * (_roadHalfWidth + 0.8f + (float)rng.NextDouble() * (_vergeWidth - 1.6f));
                        Prop(row, sprite, new Vector3(px, 0f, (float)rng.NextDouble() * _tile - _tile / 2f));
                    }
                }
            }

            if (biome.skyline != null && !biome.interior) Skyline(biome.skyline);
            ApplyAtmosphere(biome);
        }

        // Liga ou desliga a marcha (o chão anda para trás).
        public void SetScrolling(bool on) => _scrolling = on;

        // Anda as fileiras e recicla a que passou da câmera.
        private void Update()
        {
            if (!_scrolling) return;
            float step = _marchSpeed * Time.deltaTime;
            float length = _rows * _tile;
            foreach (var row in _rowRoots)
            {
                var p = row.localPosition;
                p.z -= step;
                if (p.z < _startZ - _tile) p.z += length;
                row.localPosition = p;
            }
        }

        // Céu, luz ambiente, lua e névoa do bioma.
        private void ApplyAtmosphere(BiomeDefinition biome)
        {
            _camera.clearFlags = CameraClearFlags.SolidColor;
            _camera.backgroundColor = biome.interior ? biome.fog : biome.sky;
            RenderSettings.ambientMode = AmbientMode.Flat;
            RenderSettings.ambientLight = biome.ambient;
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.Linear;
            RenderSettings.fogColor = biome.fog;
            RenderSettings.fogStartDistance = 8f;
            RenderSettings.fogEndDistance = _rows * _tile + _startZ;
            _moon.intensity = biome.interior ? 0f : biome.moonIntensity;
        }

        // Um quad com material, posição, rotação e tamanho; sem collider.
        private void Quad(Transform parent, Material material, Vector3 position, Vector3 euler, Vector2 size)
        {
            var quad = GameObject.CreatePrimitive(PrimitiveType.Quad);
            Destroy(quad.GetComponent<Collider>());
            quad.transform.SetParent(parent, false);
            quad.transform.localPosition = position;
            quad.transform.localEulerAngles = euler;
            quad.transform.localScale = new Vector3(size.x, size.y, 1f);
            var renderer = quad.GetComponent<MeshRenderer>();
            renderer.sharedMaterial = material;
            renderer.shadowCastingMode = ShadowCastingMode.Off;
        }

        // Um objeto de cena (árvore, lápide, coluna) em pé na margem.
        private void Prop(Transform parent, Sprite sprite, Vector3 position)
        {
            var go = new GameObject(sprite.name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            var renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            renderer.sharedMaterial = _spriteMaterial;
            renderer.shadowCastingMode = ShadowCastingMode.On;
            renderer.receiveShadows = true;
            go.AddComponent<SpriteBillboard>();
        }

        // Uma tocha na parede: chama em sprite (opcional) e a luz que tremula.
        private void Torch(Transform parent, BiomeDefinition biome, int side)
        {
            var go = new GameObject("Torch");
            go.transform.SetParent(parent, false);
            go.transform.localPosition = new Vector3(side * (_roadHalfWidth + 0.3f), 2.4f, 0f);
            var light = go.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = biome.torchColor;
            light.range = 7f;
            light.shadows = LightShadows.None;
            go.AddComponent<TorchFlicker>();
        }

        // A silhueta do horizonte, longe e grande, atrás da névoa.
        private void Skyline(Sprite sprite)
        {
            var go = new GameObject("Skyline");
            go.transform.SetParent(transform, false);
            go.transform.localPosition = new Vector3(0f, -1f, _startZ + _rows * _tile + 4f);
            go.transform.localScale = Vector3.one * 6f;
            go.AddComponent<SpriteRenderer>().sprite = sprite;
        }

        // Uma cópia do material de chão com a textura dada.
        private Material MaterialFor(Texture2D texture)
        {
            var material = new Material(_groundMaterial) { mainTexture = texture };
            _materials.Add(material);
            return material;
        }

        // Apaga o corredor anterior e os materiais criados para ele.
        private void Clear()
        {
            foreach (Transform child in transform) Destroy(child.gameObject);
            foreach (var material in _materials) Destroy(material);
            _rowRoots.Clear();
            _materials.Clear();
        }
    }
}
```

**Os assets de bioma:** em `Data/Biomes`, **Create → OKW → Biome** para cada um dos 7 biomas (`castle`, `forest`, `graveyard`, `ruins`, `crypt`, `church`, `hall`), com as texturas do PixelLab (Parte 1 §10). Os três interiores têm **Interior** marcado e **Moon Intensity** `0`. Sem textura nova ainda, um bioma pode usar qualquer textura de pedra como estrada, para testar.

### 🧪 Teste rápido
Numa cena vazia, um objeto `Corridor` com **Corridor Builder** (ligue **Ground Material** = `M_Ground`, **Sprite Material** = `M_SpriteLit`, **Moon** = a **Directional Light**, **Camera** = a **Main Camera**) e um script de teste de uma linha no `Start`: `GetComponent<CorridorBuilder>().Build(biome, new System.Random())`. Dê Play com um bioma interior: paredes, teto e tochas tremulando somem na névoa. Marque **Scrolling** chamando `SetScrolling(true)`: o chão anda sem buracos. Apague o script de teste.

### Etapa 2C — Personagens no chão 3D

O `CombatantView` e o `BattleStage` do guia do Guerreiro são **substituídos** pelos de baixo. Os métodos públicos são os mesmos, mais `SetDimmed` (o personagem da reserva, Fase 3), então nenhum outro script muda.

```csharp
// Caminho: Assets/_Project/Scripts/Battle/CombatantView.cs
using System.Threading;
using OldKnight.Combat;
using OldKnight.Data;
using TMPro;
using UnityEngine;
using UnityEngine.Rendering;

namespace OldKnight.Battle
{
    // POR QUE: um personagem na tela (herói ou monstro), agora de pé no chão
    // 3D: sprite iluminado com sombra, barra de HP, linha de status, marcador
    // de alvo e área de toque.
    // ESTRATÉGIA: só aparência, como no guia do Guerreiro. O objeto fica no
    // chão (y = 0) e gira para a câmera (SpriteBillboard). Os movimentos
    // são `async` e acontecem no plano XZ: X para os lados, Z para o fundo
    // do corredor. A área de toque é um BoxCollider 3D, para o raycast.
    [RequireComponent(typeof(BoxCollider))]
    public class CombatantView : MonoBehaviour
    {
        private static readonly Color HitTint = new Color(1f, 0.35f, 0.35f);
        private static readonly Color DimTint = new Color(0.55f, 0.55f, 0.6f);

        [SerializeField] private SpriteAnimPlayer _body;
        [SerializeField] private HpBar _hpBar;
        [SerializeField] private TextMeshPro _status;
        [SerializeField] private GameObject _targetMarker;
        [SerializeField] private Sprite _fallbackSprite;

        private SpriteAnimSet _anims;
        private Color _baseColor = Color.white;
        private float _flashUntil;
        private bool _dimmed;

        // Null quando a view é de um herói.
        public Monster Monster { get; private set; }
        public Vector3 Home { get; set; }
        public float Height { get; private set; }

        // Prepara a view; sem animações, usa o quadrado reserva tingido.
        public void Init(SpriteAnimSet anims, float height, bool faceLeft, Monster monster, Color fallbackTint)
        {
            Monster = monster;
            Height = height;
            _body.Configure(height, Random.value);
            _body.Renderer.flipX = faceLeft;
            _body.Renderer.shadowCastingMode = ShadowCastingMode.On;
            _body.Renderer.receiveShadows = true;

            bool hasArt = anims != null && anims.idle != null;
            _anims = hasArt ? anims : null;
            _baseColor = hasArt ? Color.white : fallbackTint;
            if (hasArt) _body.Play(anims.idle);
            else _body.ShowStatic(_fallbackSprite, fallbackTint);

            var hitbox = GetComponent<BoxCollider>();
            hitbox.size = new Vector3(height * 0.6f, height * 0.9f, 0.4f);
            hitbox.center = new Vector3(0f, height * 0.45f, 0f);
            _hpBar.SetSize(height * 0.6f, 0.12f);
            _hpBar.transform.localPosition = new Vector3(0f, height * 1.02f, 0f);
            _status.transform.localPosition = new Vector3(0f, height * 1.15f, 0f);
            SetTargeted(false);
        }

        // Vira para a esquerda ou para a direita.
        public void Face(bool left) => _body.Renderer.flipX = left;

        // Atualiza barra de HP e linha de status.
        public void SetBars(float hpFraction, string status)
        {
            _hpBar.SetFraction(hpFraction);
            _status.text = status;
        }

        // Liga ou desliga o marcador de alvo.
        public void SetTargeted(bool on)
        {
            if (_targetMarker != null) _targetMarker.SetActive(on);
        }

        // Esmaece o personagem da reserva (Parte 1 §10) e esconde a barra dele.
        public void SetDimmed(bool on)
        {
            _dimmed = on;
            _hpBar.gameObject.SetActive(!on);
        }

        // Pisca vermelho por um instante (levou dano).
        public void Flash() => _flashUntil = Time.time + 0.25f;

        // Corre até `target` em `seconds` segundos, com aceleração suave.
        public async Awaitable MoveTo(Vector3 target, float seconds, CancellationToken token)
        {
            if (_anims != null) _body.Play(_anims.run);
            // No corredor quase tudo é ida e volta em Z; só vira se o passo
            // para o lado for visível.
            float dx = target.x - transform.position.x;
            if (Mathf.Abs(dx) > 0.3f) Face(dx < 0f);
            Vector3 from = transform.position;
            for (float t = 0f; t < seconds; t += Time.deltaTime)
            {
                transform.position = Vector3.Lerp(from, target, Mathf.SmoothStep(0f, 1f, t / seconds));
                await Awaitable.NextFrameAsync(token);
            }
            transform.position = target;
            if (_anims != null) _body.Play(_anims.idle);
        }

        // Toca o golpe uma vez e volta a ficar parado.
        public Awaitable Strike(CancellationToken token) => PlayOnce(_anims?.attack, token);

        // Pose de defesa no parry (ou o golpe, se não houver pose de guarda).
        public Awaitable Guard(CancellationToken token) =>
            PlayOnce(_anims != null && _anims.guard != null ? _anims.guard : _anims?.attack, token);

        // Corre sem sair do lugar (marcha entre ondas).
        public void Run(bool on)
        {
            if (_anims != null) _body.Play(on ? _anims.run : _anims.idle);
        }

        // Toca uma animação uma vez e espera ela acabar.
        private async Awaitable PlayOnce(SpriteAnimation anim, CancellationToken token)
        {
            if (anim == null)
            {
                await Awaitable.WaitForSecondsAsync(0.3f, token);
                return;
            }
            _body.Play(anim, restart: true);
            await Awaitable.WaitForSecondsAsync(anim.Duration, token);
            if (_anims != null) _body.Play(_anims.idle);
        }

        // Aplica o piscar de dano e o esmaecido da reserva.
        private void Update()
        {
            var color = _dimmed ? _baseColor * DimTint : _baseColor;
            _body.Renderer.color = Time.time < _flashUntil ? HitTint : color;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BattleStage.cs
using System.Collections.Generic;
using System.Threading;
using OldKnight.Combat;
using OldKnight.Data;
using UnityEngine;

namespace OldKnight.Battle
{
    // POR QUE: o "palco" da batalha, agora no corredor 3D: cria as views,
    // sabe onde cada um fica, anima entradas, idas e voltas, mostra números
    // flutuantes e treme a câmera. O código dos turnos pede coisas ao palco
    // e nunca mexe em Transform diretamente.
    // ESTRATÉGIA: as posições vêm de objetos vazios no chão (spots). As
    // views de herói ficam num dicionário por HeroRun; `HeroView` é sempre a
    // de quem está em campo (ctx.Hero), então MonsterTurn e WarriorTurn não
    // sabem que existe uma dupla. Na Fase 3, Bind passa a criar as duas
    // views e SwapHeroes encena a troca. O toque vira um raycast da câmera.
    public class BattleStage : MonoBehaviour
    {
        public static readonly Color White = Color.white;
        public static readonly Color Gold = new Color(0.98f, 0.75f, 0.14f);
        public static readonly Color Red = new Color(0.97f, 0.44f, 0.44f);
        public static readonly Color Green = new Color(0.29f, 0.87f, 0.5f);
        public static readonly Color Blue = new Color(0.38f, 0.65f, 0.98f);
        public static readonly Color Purple = new Color(0.65f, 0.55f, 0.98f);
        public static readonly Color Orange = new Color(0.98f, 0.57f, 0.24f);
        public static readonly Color Cyan = new Color(0.38f, 0.84f, 1f);

        [SerializeField] private Camera _camera;
        [SerializeField] private VisualCatalog _catalog;
        [SerializeField] private CombatantView _viewPrefab;
        [SerializeField] private FloatingText _floatPrefab;
        [SerializeField] private CorridorBuilder _corridor;
        [SerializeField] private BiomeDefinition[] _biomes;
        [SerializeField] private Transform _heroSpot;
        [SerializeField] private Transform _reserveSpot;
        [SerializeField] private Transform[] _monsterSpots;
        [SerializeField] private Transform _monsterEntrance;
        [SerializeField] private float _reach = 1.3f;

        private readonly Dictionary<Monster, CombatantView> _monsters = new Dictionary<Monster, CombatantView>();
        private readonly Dictionary<HeroRun, CombatantView> _heroes = new Dictionary<HeroRun, CombatantView>();
        private BattleContext _context;
        private Vector3 _cameraHome;
        private float _shakeUntil;

        // A view de quem está em campo.
        public CombatantView HeroView => _context != null && _heroes.TryGetValue(_context.Hero, out var view) ? view : null;

        // Unity chama ao criar o objeto.
        private void Awake()
        {
            _cameraHome = _camera.transform.position;
        }

        // Liga o palco a uma masmorra: monta o corredor, cria o herói e escuta as mortes.
        public void Bind(BattleContext context)
        {
            _context = context;
            context.Slain += OnSlain;
            BuildCorridor(context);
            AddHero(context.Hero, _heroSpot.position, false);
        }

        // Sorteia o bioma da masmorra e monta o corredor (Parte 1 §9.2).
        private void BuildCorridor(BattleContext context)
        {
            if (_corridor == null || _biomes == null || _biomes.Length == 0) return;
            var rng = new System.Random(context.Request.Level * 7919 + context.Request.NgPlus);
            _corridor.Build(_biomes[rng.Next(_biomes.Length)], rng);
        }

        // Cria a view de um herói num lugar.
        private CombatantView AddHero(HeroRun hero, Vector3 position, bool dimmed)
        {
            var definition = hero.Loadout.Hero;
            var entry = _catalog.Find(definition.id, _context.Request.Color);
            var view = Instantiate(_viewPrefab, position, Quaternion.identity, transform);
            view.Init(entry?.anims, entry != null ? entry.height : 2.2f, false, null, Blue);
            view.Home = position;
            view.SetDimmed(dimmed);
            _heroes[hero] = view;
            return view;
        }

        // Os monstros de uma onda entram correndo do fundo do corredor.
        public async Awaitable SpawnWave(IReadOnlyList<Monster> monsters, CancellationToken token)
        {
            foreach (var view in _monsters.Values) Destroy(view.gameObject);
            _monsters.Clear();

            var entrances = new List<Awaitable>();
            for (int i = 0; i < monsters.Count; i++)
            {
                var monster = monsters[i];
                var entry = _catalog.Find(monster.Id, monster.Color);
                var view = Instantiate(_viewPrefab, _monsterEntrance.position + Vector3.right * ((i - 1) * 1.5f), Quaternion.identity, transform);
                view.Init(entry?.anims, entry != null ? entry.height : (monster.IsBoss ? 3.4f : 2.4f), false, monster,
                    monster.IsBoss ? Red : Orange);
                view.Home = _monsterSpots[Mathf.Min(i, _monsterSpots.Length - 1)].position;
                _monsters[monster] = view;
                entrances.Add(view.MoveTo(view.Home, 0.9f, token));
            }
            foreach (var entrance in entrances) await entrance;
        }

        // A view de um monstro (null se não existir).
        public CombatantView ViewOf(Monster monster) =>
            monster != null && _monsters.TryGetValue(monster, out var view) ? view : null;

        // O monstro vivo sob um ponto da tela (null se nenhum).
        public Monster MonsterAt(Vector2 screenPosition)
        {
            var view = ViewAt(screenPosition);
            return view != null && view.Monster != null && !view.Monster.Dead ? view.Monster : null;
        }

        // O dedo está em cima de quem está em campo?
        public bool IsHeroAt(Vector2 screenPosition)
        {
            var view = ViewAt(screenPosition);
            return view != null && view == HeroView;
        }

        // Converte um ponto da tela para o mundo, num plano de frente para a
        // câmera que passa pelo herói (é onde a pedrada desenha a mira).
        public Vector3 ScreenToWorld(Vector2 screenPosition)
        {
            var ray = _camera.ScreenPointToRay(screenPosition);
            var origin = HeroView != null ? HeroView.transform.position + Vector3.up : Vector3.up;
            var plane = new Plane(-_camera.transform.forward, origin);
            return plane.Raycast(ray, out float distance) ? ray.GetPoint(distance) : origin;
        }

        // O herói corre até ficar de frente para o monstro (do lado da câmera).
        public Awaitable HeroApproach(Monster target, CancellationToken token) =>
            HeroView.MoveTo(ViewOf(target).transform.position + Vector3.back * _reach, 0.34f, token);

        // O herói corre até o meio dos monstros (golpes em todos).
        public Awaitable HeroToCenter(CancellationToken token)
        {
            Vector3 sum = Vector3.zero;
            foreach (var spot in _monsterSpots) sum += spot.position;
            return HeroView.MoveTo(sum / _monsterSpots.Length + Vector3.back * (_reach + 0.3f), 0.3f, token);
        }

        // O herói volta para o seu lugar.
        public Awaitable HeroReturn(CancellationToken token) => HeroView.MoveTo(HeroView.Home, 0.34f, token);

        // O monstro corre até o herói.
        public Awaitable MonsterApproach(Monster monster, CancellationToken token) =>
            ViewOf(monster).MoveTo(HeroView.transform.position + Vector3.forward * _reach, 0.38f, token);

        // O monstro volta para o seu lugar.
        public Awaitable MonsterReturn(Monster monster, CancellationToken token)
        {
            var view = ViewOf(monster);
            return view.MoveTo(view.Home, 0.38f, token);
        }

        // Marcha entre ondas: o chão anda e quem está em campo corre no lugar.
        public async Awaitable March(float seconds, CancellationToken token)
        {
            foreach (var view in _heroes.Values) view.Run(true);
            if (_corridor != null) _corridor.SetScrolling(true);
            await Awaitable.WaitForSecondsAsync(seconds, token);
            if (_corridor != null) _corridor.SetScrolling(false);
            foreach (var view in _heroes.Values) view.Run(false);
        }

        // Texto flutuante sobre um monstro, ou sobre quem está em campo (monster null).
        public void Float(Monster monster, string text, Color color, bool big = false)
        {
            var view = monster == null ? HeroView : ViewOf(monster);
            if (view == null) return;
            var label = Instantiate(_floatPrefab, view.transform.position + Vector3.up * view.Height * 0.8f, _camera.transform.rotation);
            label.Show(text, color, big);
        }

        // Mostra o resultado de um golpe do herói: dano, escudos quebrados, perfuração.
        public void ShowStrike(Monster monster, StrikeOutcome strike, Color color, bool big)
        {
            ViewOf(monster)?.Flash();
            if (strike.ShieldsBroken > 0)
            {
                Float(monster, $"ESCUDO -{strike.ShieldsBroken}", Blue, big);
                if (strike.Pierced > 0) Float(monster, $"{strike.Pierced} PERFURA", Cyan);
            }
            else
            {
                Float(monster, strike.Damage.ToString(), color, big);
            }
        }

        // Treme a câmera por 0,4 s.
        public void Shake() => _shakeUntil = Time.time + 0.4f;

        // A view sob um ponto da tela, pelo raycast da câmera.
        private CombatantView ViewAt(Vector2 screenPosition)
        {
            var ray = _camera.ScreenPointToRay(screenPosition);
            return Physics.Raycast(ray, out var hit, 100f) ? hit.collider.GetComponent<CombatantView>() : null;
        }

        // Monstro morto: mostra o ouro.
        private void OnSlain(Monster monster)
        {
            Float(monster, $"+{monster.Gold} OURO", Gold);
            Shake();
        }

        // Todo quadro: barras, status, alvo e tremida.
        private void LateUpdate()
        {
            if (_context != null)
            {
                foreach (var pair in _monsters)
                {
                    var monster = pair.Key;
                    var view = pair.Value;
                    if (monster.Dead)
                    {
                        view.gameObject.SetActive(false);
                        continue;
                    }
                    view.SetBars((float)monster.Hp / monster.MaxHp, StatusOf(monster));
                    view.SetTargeted(_context.ShowTarget && monster == _context.Target);
                }
                foreach (var pair in _heroes) pair.Value.SetBars((float)pair.Key.Hp / pair.Key.MaxHp, "");
            }

            _camera.transform.position = Time.time < _shakeUntil
                ? _cameraHome + (Vector3)(Random.insideUnitCircle * 0.12f)
                : _cameraHome;
        }

        // "ESCUDO 4  FASE 2  CANSAÇO 3/5" ou "EXAUSTO".
        private string StatusOf(Monster monster)
        {
            string shield = monster.Shield > 0 ? $"ESCUDO {monster.Shield}  " : "";
            string rage = monster.Enraged ? "FASE 2  " : "";
            if (monster.Exhausted) return $"{shield}{rage}EXAUSTO";
            int cap = DungeonMath.FatigueCap(monster.IsBoss, _context.EffectiveLevel, _context.Balance);
            return $"{shield}{rage}CANSAÇO {monster.Fatigue}/{cap}";
        }
    }
}
```

**Mudanças nos prefabs** (os do guia do Guerreiro, Etapa 3B):

1. **`CombatantView`:** **Remove Component** no **Box Collider 2D** e **Add Component → Box Collider** (3D), com **Is Trigger** marcado. **Add Component → Sprite Billboard**. No filho `Body`, **Sprite Renderer → Material** = `M_SpriteLit`. O `TargetMarker` vira um anel no chão: rotação `(90, 0, 0)`, posição `(0, 0.02, 0)`, escala `(0.9, 0.9, 1)`.
2. **`FloatingText`:** nada muda (o palco o cria já virado para a câmera).

### Etapa 2D — Câmera, luz e cena

Na cena `Battle`:

1. **Main Camera:** **Projection** `Perspective`, **Field of View** `50`, **Position** `(0, 3.2, -5.2)`, **Rotation** `(18, 0, 0)`. Ela fica atrás e acima de quem está em campo, olhando o corredor (Parte 1 §10).
2. **Directional Light** (a lua): **Rotation** `(40, -30, 0)`, **Color** azulada `#9DB4FF`, **Shadow Type** `Soft Shadows`.
3. Apague o `[World]` 2D do guia do Guerreiro e crie um novo, com os spots **no chão** (y = 0):

   | Objeto | Posição |
   |---|---|
   | `HeroSpot` | `(0, 0, 0)` |
   | `ReserveSpot` | `(-1.6, 0, -1.3)` |
   | `MonsterSpot1` | `(-1.7, 0, 6.5)` |
   | `MonsterSpot2` | `(0, 0, 7.6)` |
   | `MonsterSpot3` | `(1.7, 0, 6.5)` |
   | `MonsterEntrance` | `(0, 0, 18)` |

4. Dentro de `[World]`: `Corridor` com o **Corridor Builder** (ligado como no teste da Etapa 2B) e `BattleStage` com o novo **Battle Stage**. Ligue **Camera**, **Catalog**, **View Prefab**, **Float Prefab**, **Corridor**, **Biomes** (os 7 assets), os spots e **Monster Entrance**.

### 🧪 Teste rápido
Abra `Battle` direto e dê Play. O Cavaleiro aparece de costas no primeiro plano, os monstros entram correndo do fundo do corredor e param em leque. Tocar num monstro o seleciona (o anel aparece no chão dele). Entre as ondas, o chão anda para trás enquanto o Cavaleiro corre no lugar. Num bioma interior, as tochas iluminam os sprites de um lado só.

### ✅ Checkpoint da Fase 2
- Personagens de pé no chão 3D, com luz das tochas e sombra.
- Toque no monstro funciona pelo raycast; a pedrada mira no plano do herói.
- Corredor dos 7 biomas, com névoa e marcha.
- Commit: `feat: palco HD-2D`.

#### Problemas comuns
- **Sprites pretos:** faltam as normais do contexto **Vertex** do `SpriteLit` (Etapa 2A, passo 5), ou o material do `Body` ainda é o padrão.
- **Sprite com franja cinza em volta:** o PNG está com **Filter Mode** `Bilinear`. Use `Point (no filter)` e **Compression** `None`.
- **Tocar no monstro não seleciona:** o prefab ainda tem o **Box Collider 2D**. O raycast 3D só vê o **Box Collider**.
- **O chão longe "cintila" na marcha:** é o filtro `Point` sem mipmaps. Nas texturas de chão, margem e parede (só nelas, não nos sprites), marque **Generate Mip Maps**.

Próxima fase: **Fase 3 — A dupla**.

---

# Parte 6 — Implementação Unity: Fase 3 (A dupla)

> Objetivo desta fase: o Cavaleiro e a Bruxa na mesma masmorra, um em campo e o outro na reserva (Parte 1 §4). A fila segue a velocidade e as vagas de quem está em campo; **Trocar** gasta o turno; quem cai é substituído na hora; a derrota só vem quando os dois caem. A Bruxa ainda joga com o motor do Guerreiro (ela ganha o turno de cartas na Fase 4).

**Conceitos novos:**
- **Propriedade que delega:** `Hero` deixa de ser um campo e vira `Party.Active`. Todo código que lê `ctx.Hero` passa a ler "quem está em campo agora" sem mudar uma linha.
- **Objeto compartilhado por referência:** as poções da dupla ficam num objeto `Supplies` que os dois `HeroRun` apontam. Gastar uma poção com um personagem tira do mesmo estoque do outro.

### Etapa 3A — O estado da dupla

**`HeroRun.cs`**: arquivo inteiro. Mudam três coisas em relação ao guia do Guerreiro: o `HeroLoadout` ganha os números da Bruxa, as poções passam a ser da dupla (`Supplies`) e a Fúria vira mana quando quem ganha é a Bruxa (Parte 1 §5).

```csharp
// Caminho: Assets/_Project/Scripts/Combat/HeroRun.cs
using System;
using OldKnight.Data;

namespace OldKnight.Combat
{
    // POR QUE: o que um personagem leva para a masmorra: atributos
    // comprados, Habilidade, gema equipada e, para a Bruxa, mão e mana.
    // ESTRATÉGIA: montado pelo acampamento a partir do save (Fase 5) ou à
    // mão nos testes. `UnlockAllSkills` serve ao treino e aos testes.
    public sealed class HeroLoadout
    {
        public HeroDefinition Hero;
        public int MaxHp;
        public int Attack;
        public int Defense;
        public int DefensePurchases;
        public int SkillLevel;
        public bool HasGem;
        public GemId Gem;
        public int GemLevelValue;
        public bool UnlockAllSkills;

        // Bruxa (Parte 1 §7.1). A árvore de Souls (Fase 6) mexe nestes números.
        public int HandSize;
        public int ManaPerTurn;
        public int MaxMana;
        public int StartMana;

        // Nível da gema em efeito: 0 se ela não for a equipada.
        public int GemLevel(GemId id) => HasGem && Gem == id ? GemLevelValue : 0;

        // Quantos especiais a Habilidade já liberou.
        public int SkillsUnlocked(int step) => UnlockAllSkills ? 99 : SkillLevel / step;

        // Loadout de um personagem novo, só com os atributos iniciais.
        public static HeroLoadout Fresh(HeroDefinition hero) => new HeroLoadout
        {
            Hero = hero,
            MaxHp = hero.maxHp,
            Attack = hero.attack,
            Defense = hero.defense,
            HandSize = hero.handSize,
            ManaPerTurn = hero.manaPerTurn,
            MaxMana = hero.maxMana,
        };
    }

    public enum CurseType
    {
        Drain,
        SealFury,
    }

    // POR QUE: encanto do Cultista sobre o herói (GuerreiroDaMasmorra.md §8.5).
    public sealed class Curse
    {
        public CurseType Type;
        public int Turns;
        public int Power;
    }

    // POR QUE: o que a dupla gasta junto (Parte 1 §4.3): Poções de Cura e
    // de Adrenalina.
    // ESTRATÉGIA: um objeto só, apontado pelos dois HeroRun. Fora da dupla
    // (testes do Guerreiro), cada HeroRun tem o seu.
    public sealed class Supplies
    {
        public int Potions;
        public int Adrenaline;
    }

    // POR QUE: o estado de um personagem durante uma masmorra: HP, Fúria (ou
    // mana), guarda, dinamites, maldição, ouro coletado e se a run segue
    // perfeita.
    // ESTRATÉGIA: nasce cheio a cada masmorra e morre com ela. As poções
    // moram no `Supplies` (da dupla); `Potions` e `Adrenaline` continuam
    // existindo como propriedades, para o código do Guerreiro não mudar.
    public sealed class HeroRun
    {
        public readonly HeroLoadout Loadout;

        public int Hp;
        public int Fury;
        public int Mana;
        public bool Exhausted;
        public bool GuardBroken;
        public double Stagger;
        public int Dynamite;
        public int DynamitePower;
        public Curse Curse;
        public bool Flawless = true;
        public int RunGold;
        public int RocksLeft;
        // Véu Cinzento da Bruxa (a Couraça Arcana do Mago): absorve dano do próximo golpe.
        public int Ward;
        public Supplies Supplies;

        // Começa a masmorra com HP cheio e as poções da Parte 1 §4.3.
        public HeroRun(HeroLoadout loadout, GameBalance balance)
        {
            Loadout = loadout;
            Hp = loadout.MaxHp;
            Mana = loadout.StartMana;
            Supplies = new Supplies { Potions = balance.potionsPerRun, Adrenaline = balance.adrenalinePerRun };
        }

        public int MaxHp => Loadout.MaxHp;
        public int Attack => Loadout.Attack;
        public int Defense => Loadout.Defense;
        public bool Dead => Hp <= 0;
        public bool IsWitch => Loadout.Hero.heroClass == HeroClass.Witch;
        public string Name => Loadout.Hero.displayName;

        public int Potions
        {
            get => Supplies.Potions;
            set => Supplies.Potions = value;
        }

        public int Adrenaline
        {
            get => Supplies.Adrenaline;
            set => Supplies.Adrenaline = value;
        }

        // Segmentos da barra de guarda: 5, +1 a cada 5 compras de Defesa, teto 20.
        public int StaggerCap => Math.Min(20, 5 + Loadout.DefensePurchases / 5);

        public bool FurySealed => Curse != null && Curse.Type == CurseType.SealFury;

        // +n de Fúria (teto 5), a menos que o Selo da Fúria esteja ativo. Na
        // Bruxa, o mesmo ganho vira mana (Parte 1 §5).
        public void GainFury(int amount = 1)
        {
            if (IsWitch)
            {
                GainMana(amount);
                return;
            }
            if (FurySealed) return;
            Fury = Math.Min(5, Fury + amount);
        }

        // Gasta só o que usou: a barra não zera.
        public void SpendFury(int amount)
        {
            Fury = Math.Max(0, Fury - amount);
        }

        // +n de mana, até o teto.
        public void GainMana(int amount)
        {
            Mana = Math.Min(Loadout.MaxMana, Mana + amount);
        }

        // Soma dano à barra de guarda. Devolve true se a guarda quebrou.
        public bool AddStagger(int damage, bool inCombo)
        {
            if (Stagger >= StaggerCap && inCombo)
            {
                Stagger = 0;
                Exhausted = true;
                GuardBroken = true;
                return true;
            }
            Stagger = Math.Min(StaggerCap, Stagger + Math.Max(0.3, damage * 7.0 / MaxHp));
            return false;
        }

        // Tira HP; qualquer dano acaba com a run perfeita.
        public void TakeDamage(int amount)
        {
            if (amount <= 0) return;
            Flawless = false;
            Hp = Math.Max(0, Hp - amount);
        }

        // Cura até o máximo e devolve quanto curou de fato.
        public int Heal(int amount)
        {
            int before = Hp;
            Hp = Math.Min(MaxHp, Hp + amount);
            return Hp - before;
        }

        // Gruda uma dinamite (teto `max`); a potência é a maior já registrada.
        public void AddDynamite(int monsterAttack, int max)
        {
            if (Dynamite >= max) return;
            Dynamite++;
            DynamitePower = Math.Max(DynamitePower, CombatMath.DynamitePower(monsterAttack));
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/PartyRun.cs
using System.Collections.Generic;

namespace OldKnight.Combat
{
    // POR QUE: a dupla durante uma masmorra (Parte 1 §4.1): quem está em
    // campo, quem está na reserva, a troca e a derrota só com os dois caídos.
    // ESTRATÉGIA: uma lista de 1 ou 2 HeroRun e o índice de quem está em
    // campo. As poções são as do líder (Supplies compartilhado). A troca
    // zera a barra de guarda de quem entra ("entra frio"); dinamites,
    // maldição e exaustão ficam com quem os recebeu. Quem cai por último é
    // sempre quem está em campo, então a Soul levanta o `Active`.
    public sealed class PartyRun
    {
        private readonly List<HeroRun> _members = new List<HeroRun>();

        public int ActiveIndex { get; private set; }
        public int Swaps { get; private set; }

        // Monta a dupla; `partner` null = herói sozinho (testes, treino).
        public PartyRun(HeroRun leader, HeroRun partner)
        {
            _members.Add(leader);
            if (partner == null) return;
            partner.Supplies = leader.Supplies;
            _members.Add(partner);
        }

        public IReadOnlyList<HeroRun> Members => _members;
        public HeroRun Active => _members[ActiveIndex];
        public HeroRun Reserve => _members.Count > 1 ? _members[1 - ActiveIndex] : null;
        public bool CanSwap => Reserve != null && !Reserve.Dead;
        public bool AllDead => _members.TrueForAll(m => m.Dead);

        // Ouro somado dos dois (cada um guarda o que matou).
        public int RunGold
        {
            get
            {
                int sum = 0;
                foreach (var member in _members) sum += member.RunGold;
                return sum;
            }
        }

        // Perfeita só se nenhum dos dois sofreu dano (Parte 1 §4.3).
        public bool Flawless => _members.TrueForAll(m => m.Flawless);

        // Troca quem está em campo. Devolve false se não há com quem trocar.
        public bool Swap()
        {
            if (!CanSwap) return false;
            ActiveIndex = 1 - ActiveIndex;
            Active.Stagger = 0;
            Active.GuardBroken = false;
            Swaps++;
            return true;
        }

        // A Soul: quem está em campo (o último a cair) volta com HP cheio.
        public void ReviveActive()
        {
            Active.Hp = Active.MaxHp;
        }
    }
}
```

**`BattleContext.cs`**: arquivo inteiro (`DungeonRequest` ganha `Partner`; o contexto ganha `Party`; `Hero` vira "quem está em campo").

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BattleContext.cs
using System;
using System.Collections.Generic;
using OldKnight.Combat;
using OldKnight.Data;

namespace OldKnight.Battle
{
    // POR QUE: o pedido de entrada numa masmorra: com que dupla, em que
    // nível e quantas Souls e Mapas o jogador tem para gastar lá dentro.
    // ESTRATÉGIA: `Loadout` é quem começa em campo e `Partner` quem começa
    // na reserva (null = herói sozinho). `GemsUnlocked` decide qual
    // Pergaminho de Gema cai. Os campos de duelo do guia do Guerreiro
    // ficaram: o fluxo deles não é usado, mas o ApplyOutcome ainda os lê.
    public sealed class DungeonRequest
    {
        public HeroLoadout Loadout;
        public HeroLoadout Partner;
        public int Level = 1;
        public int NgPlus;
        public DungeonColor Color;
        public int Souls;
        public int Maps;
        public bool Tutorial;
        public List<GemId> GemsUnlocked = new List<GemId>();
        public string DuelHeroId;
        public Func<IRandom, List<Monster>> ThirdWaveOverride;
    }

    public enum DungeonOutcomeKind
    {
        Victory,
        Defeat,
        Fled,
    }

    // POR QUE: como a masmorra terminou, para o painel de resultado e o
    // acampamento aplicarem ouro, Souls e Mapas.
    public sealed class BattleEnd
    {
        public DungeonOutcomeKind Kind;
        public DungeonRequest Request;
        public int RunGold;
        public bool Flawless;
        public int SoulsUsed;
        public int MapsUsed;
        public int Wave;
        public int Swaps;
    }

    // POR QUE: tudo o que os turnos compartilham durante uma masmorra: a
    // dupla, os monstros da onda, o alvo, o sorteio e as explosões pendentes.
    // ESTRATÉGIA: `Hero` é quem está em campo (`Party.Active`), então o
    // turno do monstro, o QTE e o HUD do Guerreiro funcionam sem saber da
    // dupla. `Slay` é o único jeito de matar um monstro: paga o ouro a quem
    // está em campo, enfileira a Explosão Final e avisa a tela.
    public sealed class BattleContext
    {
        public readonly GameDatabase Db;
        public readonly DungeonRequest Request;
        public readonly IRandom Rng;
        public readonly PartyRun Party;
        public readonly Queue<Monster> PendingBooms = new Queue<Monster>();

        public List<Monster> Monsters = new List<Monster>();
        public int Wave;
        public Monster Target;
        public bool ShowTarget;
        public int SoulsUsed;
        public int MapsUsed;

        public event Action<string> Logged;
        public event Action<Monster> Slain;

        // Começa uma masmorra com a dupla cheia.
        public BattleContext(GameDatabase db, DungeonRequest request, IRandom rng)
        {
            Db = db;
            Request = request;
            Rng = rng;
            var leader = new HeroRun(request.Loadout, db.balance);
            var partner = request.Partner != null ? new HeroRun(request.Partner, db.balance) : null;
            Party = new PartyRun(leader, partner);
        }

        public HeroRun Hero => Party.Active;
        public GameBalance Balance => Db.balance;
        public int NgPlus => Request.NgPlus;
        public int EffectiveLevel => DungeonMath.EffectiveLevel(Request.Level, Request.NgPlus, Balance);
        public bool WaveCleared => Monsters.TrueForAll(m => m.Dead);
        public int SoulsAvailable => Request.Souls - SoulsUsed;
        public int MapsAvailable => Request.Maps - MapsUsed;

        // Monstros vivos, na ordem da onda.
        public List<Monster> Alive() => Monsters.FindAll(m => !m.Dead);

        // Mostra uma mensagem na linha de log.
        public void Log(string message) => Logged?.Invoke(message);

        // Mata um monstro (uma vez só): ouro, explosão pendente e aviso à tela.
        public void Slay(Monster monster)
        {
            if (monster.Dead) return;
            monster.Dead = true;
            monster.Hp = 0;
            Hero.RunGold += monster.Gold;
            if (monster.Fire && !Request.Tutorial) PendingBooms.Enqueue(monster);
            Slain?.Invoke(monster);
        }

        // Garante um alvo vivo.
        public void EnsureTarget()
        {
            if (Target == null || Target.Dead) Target = Monsters.Find(m => !m.Dead);
        }

        // Troca de alvo para o próximo (+1) ou anterior (-1) vivo.
        public void CycleTarget(int direction)
        {
            var alive = Alive();
            if (alive.Count == 0) return;
            int index = alive.IndexOf(Target);
            index = ((index + direction) % alive.Count + alive.Count) % alive.Count;
            Target = alive[index];
        }
    }
}
```

**`BattleInterfaces.cs`**: acrescente `HandOff` **no fim** do `TurnResult`. É o que a carta Passo Trocado (Fase 4) devolve: "troquei, e quem entrou age agora".

```csharp
    public enum TurnResult
    {
        Done,
        Fled,
        HandOff,
    }
```

### 🧪 Teste rápido
O Console compila. Os testes do Guerreiro continuam passando: eles criam `HeroRun` sozinho, e `Potions` e `Adrenaline` ainda existem.

### Etapa 3B — A fila pela velocidade de quem está em campo

**`Initiative.cs`**: troque a classe `Initiative` (o `TurnSlot` fica igual) por esta. A versão antiga continua existindo, com a velocidade do `GameBalance`, para os testes do Guerreiro.

```csharp
    // POR QUE: a fila de iniciativa (GuerreiroDaMasmorra.md §4) com o ritmo
    // da dupla (Parte 1 §4.2): a vaga do herói usa a velocidade de quem está
    // em campo, e a Bruxa tem duas vagas.
    // ESTRATÉGIA: cada vaga rola velocidade + d(0..5); a vaga extra perde
    // `extraTurnPenalty` por vez. As vagas do herói entram primeiro na lista
    // e a ordenação é estável, então num empate o herói vai antes, como no
    // jogo original. Chefe em Fase 2 entra 2–3 vezes com +3.
    public static class Initiative
    {
        // A fila do guia do Guerreiro: uma vaga com a velocidade do GameBalance.
        public static List<TurnSlot> Roll(IReadOnlyList<Monster> monsters, IRandom rng, GameBalance b) =>
            Roll(monsters, null, rng, b);

        // A fila desta rodada, do mais rápido para o mais lento.
        public static List<TurnSlot> Roll(IReadOnlyList<Monster> monsters, HeroDefinition hero, IRandom rng, GameBalance b)
        {
            int speed = hero != null && hero.speed > 0 ? hero.speed : b.heroSpeed;
            int turns = hero != null ? System.Math.Max(1, hero.turnsPerRound) : 1;
            int penalty = hero != null ? hero.extraTurnPenalty : 0;

            var entries = new List<(TurnSlot slot, int roll)>();
            for (int t = 0; t < turns; t++)
                entries.Add((new TurnSlot(null), speed + rng.Range(0, 5) - t * penalty));

            foreach (var monster in monsters)
            {
                if (monster.Dead) continue;
                int times = monster.Enraged ? rng.Range(2, 3) : 1;
                for (int i = 0; i < times; i++)
                {
                    int roll = monster.Definition.speed + rng.Range(0, 5) + (monster.Enraged ? 3 : 0);
                    entries.Add((new TurnSlot(monster), roll));
                }
            }
            return entries.OrderByDescending(e => e.roll).Select(e => e.slot).ToList();
        }
    }
```

### Etapa 3C — O controlador com a dupla

```csharp
// Caminho: Assets/_Project/Scripts/Battle/PartySwap.cs
using OldKnight.Combat;
using UnityEngine;

namespace OldKnight.Battle
{
    // POR QUE: a troca encenada (Parte 1 §4.1), usada pelo comando Trocar,
    // pela carta Passo Trocado e pela troca forçada quando alguém cai.
    // ESTRATÉGIA: troca primeiro no estado (PartyRun) e depois anima: os
    // dois correm cruzando de lugar. O log diz por que a troca aconteceu.
    public class PartySwap : MonoBehaviour
    {
        [SerializeField] private BattleStage _stage;

        // Troca quem está em campo; `forced` = quem estava caiu.
        public async Awaitable Swap(BattleContext ctx, bool forced)
        {
            var leaving = ctx.Hero;
            if (!ctx.Party.Swap()) return;
            var entering = ctx.Hero;
            ctx.Log(forced
                ? $"{leaving.Name} caiu! {entering.Name} assume a frente!"
                : $"{entering.Name} troca de lugar com {leaving.Name}.");
            await _stage.SwapHeroes(leaving, entering, destroyCancellationToken);
        }
    }
}
```

**`BattleStage.cs`** (o da Fase 2): troque o método `Bind` e acrescente `SwapHeroes` logo depois dele.

```csharp
        // Liga o palco a uma masmorra: monta o corredor, cria a dupla (quem
        // está em campo no HeroSpot, o outro esmaecido no ReserveSpot) e
        // escuta as mortes.
        public void Bind(BattleContext context)
        {
            _context = context;
            context.Slain += OnSlain;
            BuildCorridor(context);
            foreach (var hero in context.Party.Members)
            {
                bool inField = hero == context.Hero;
                AddHero(hero, inField ? _heroSpot.position : _reserveSpot.position, !inField);
            }
        }

        // Os dois correm cruzando de lugar; quem sai fica esmaecido na reserva.
        public async Awaitable SwapHeroes(HeroRun leaving, HeroRun entering, CancellationToken token)
        {
            var outView = _heroes[leaving];
            var inView = _heroes[entering];
            outView.Home = _reserveSpot.position;
            inView.Home = _heroSpot.position;
            inView.SetDimmed(false);
            var goOut = outView.MoveTo(outView.Home, 0.35f, token);
            var goIn = inView.MoveTo(inView.Home, 0.35f, token);
            await goOut;
            await goIn;
            outView.SetDimmed(true);
        }
```

**`BattleController.cs`**: arquivo inteiro.

```csharp
// Caminho: Assets/_Project/Scripts/Battle/BattleController.cs
using System;
using System.Threading;
using OldKnight.Combat;
using OldKnight.Data;
using UnityEngine;

namespace OldKnight.Battle
{
    // POR QUE: o roteiro de uma masmorra (GuerreiroDaMasmorra.md §4 e §9)
    // com a dupla (Parte 1 §4): 3 ondas; em cada uma, rodadas com fila de
    // iniciativa até a onda cair, os dois caírem ou a dupla fugir.
    // ESTRATÉGIA: um único método async lido de cima para baixo, como no
    // guia do Guerreiro. As diferenças: a fila usa quem está em campo; o
    // turno do herói vai para o WarriorTurn ou o WitchTurn pela classe; se
    // quem está em campo cai e o outro está de pé, a troca é forçada e a
    // luta segue; só com os dois caídos vem a Soul ou a derrota.
    public class BattleController : MonoBehaviour
    {
        [SerializeField] private GameDatabase _database;
        [SerializeField] private BattleStage _stage;
        [SerializeField] private BattleHud _hud;
        [SerializeField] private PartyHud _partyHud;
        [SerializeField] private MonsterTurn _monsterTurn;
        [SerializeField] private BoomResolver _booms;
        [SerializeField] private PartySwap _swap;
        [SerializeField] private MonoBehaviour _warriorTurn;
        [SerializeField] private MonoBehaviour _witchTurn;
        [SerializeField] private MonoBehaviour _deathHandler;

        public BattleContext Context { get; private set; }

        // Disparado uma vez, quando a masmorra termina.
        public event Action<BattleEnd> Ended;

        // Ponto de entrada: roda a masmorra e avisa o fim.
        public async void Begin(DungeonRequest request)
        {
            try
            {
                var end = await RunDungeon(request, destroyCancellationToken);
                Ended?.Invoke(end);
            }
            catch (OperationCanceledException)
            {
                // A cena fechou no meio da luta: nada a fazer.
            }
        }

        // As 3 ondas.
        private async Awaitable<BattleEnd> RunDungeon(DungeonRequest request, CancellationToken token)
        {
            Context = new BattleContext(_database, request, new SystemRandom());
            _hud.Bind(Context);
            if (_partyHud != null) _partyHud.Bind(Context);
            _stage.Bind(Context);

            for (int wave = 1; wave <= 3; wave++)
            {
                Context.Wave = wave;
                Context.Monsters = wave == 3 && request.ThirdWaveOverride != null
                    ? request.ThirdWaveOverride(Context.Rng)
                    : WaveFactory.Make(wave, request.Level, request.NgPlus, request.Color, _database, Context.Rng);
                Context.Target = null;
                Context.EnsureTarget();
                Context.Log(wave == 3
                    ? $"{Context.Monsters[0].Name} surge das sombras{(Context.Monsters.Count > 1 ? " com sua escolta" : "")}!"
                    : $"Onda {wave}/3: monstros à vista!");
                await _stage.SpawnWave(Context.Monsters, token);

                var outcome = await FightWave(token);
                if (outcome.HasValue) return End(outcome.Value);

                if (wave < 3)
                {
                    Context.Log("Onda vencida! Avançando pelo corredor...");
                    await Awaitable.WaitForSecondsAsync(0.7f, token);
                    await _stage.March(2f, token);
                }
            }
            return End(DungeonOutcomeKind.Victory);
        }

        // Rodadas até a onda cair (null) ou a masmorra acabar (derrota/fuga).
        private async Awaitable<DungeonOutcomeKind?> FightWave(CancellationToken token)
        {
            while (true)
            {
                // A fila é montada com quem está em campo no começo da rodada
                // e não muda com uma troca (Parte 1 §4.2).
                var queue = Initiative.Roll(Context.Monsters, Context.Hero.Loadout.Hero, Context.Rng, Context.Balance);
                for (int i = 0; i < queue.Count; i++)
                {
                    if (Context.WaveCleared) return null;
                    var slot = queue[i];
                    _hud.ShowQueue(queue, i);

                    if (slot.IsHero)
                    {
                        if (await HeroTurn(token) == TurnResult.Fled) return DungeonOutcomeKind.Fled;
                    }
                    else if (!slot.Monster.Dead)
                    {
                        await _monsterTurn.TakeTurn(Context, slot.Monster);
                    }

                    await _booms.ProcessAll(Context);

                    if (Context.Hero.Dead)
                    {
                        if (Context.Party.CanSwap)
                        {
                            await _swap.Swap(Context, forced: true);   // o outro entra sozinho, sem gastar nada
                        }
                        else
                        {
                            if (await OfferRevive()) break;            // reviveu: nova rodada
                            return DungeonOutcomeKind.Defeat;
                        }
                    }
                    if (Context.WaveCleared) return null;
                }
            }
        }

        // Começo do turno de quem está em campo (dinamite, maldição, exaustão) e a ação.
        private async Awaitable<TurnResult> HeroTurn(CancellationToken token)
        {
            var hero = Context.Hero;

            if (hero.Dynamite > 0)
            {
                hero.Dynamite--;
                hero.TakeDamage(hero.DynamitePower);
                _stage.HeroView.Flash();
                _stage.Shake();
                _stage.Float(null, $"-{hero.DynamitePower} DINAMITE", BattleStage.Orange, true);
                Context.Log($"Uma dinamite explodiu em {hero.Name}! {hero.DynamitePower} de dano." +
                            (hero.Dynamite > 0 ? $" Restam {hero.Dynamite}!" : ""));
                if (hero.Dead) return TurnResult.Done;
                await Awaitable.WaitForSecondsAsync(0.6f, token);
            }
            else
            {
                hero.DynamitePower = 0;
            }

            if (hero.Curse != null)
            {
                if (hero.Curse.Type == CurseType.Drain)
                {
                    hero.TakeDamage(hero.Curse.Power);
                    _stage.Float(null, $"-{hero.Curse.Power} MALDIÇÃO", BattleStage.Purple, true);
                    Context.Log($"A maldição drena {hero.Curse.Power} de HP!");
                    if (hero.Dead) return TurnResult.Done;
                }
                if (--hero.Curse.Turns <= 0)
                {
                    hero.Curse = null;
                    _stage.Float(null, "encanto dissipado", BattleStage.White);
                }
            }

            if (hero.Exhausted)
            {
                hero.Exhausted = false;
                Context.Log($"Exausto pelo golpe especial, {hero.Name} não consegue agir!");
                _stage.Float(null, "EXAUSTO...", BattleStage.White, true);
                await Awaitable.WaitForSecondsAsync(1.1f, token);
                return TurnResult.Done;
            }

            hero.GuardBroken = false;
            hero.RocksLeft = CombatMath.RocksPerRound(hero.Loadout.GemLevel(GemId.Stone));
            Context.EnsureTarget();

            var result = await TakerFor(hero).TakeTurn(Context);
            // Passo Trocado: a troca já aconteceu e quem entrou age nesta mesma vaga.
            if (result == TurnResult.HandOff && !Context.Hero.Dead && !Context.WaveCleared) return await HeroTurn(token);
            return result == TurnResult.HandOff ? TurnResult.Done : result;
        }

        // O turno certo para a classe de quem está em campo.
        private IHeroTurnTaker TakerFor(HeroRun hero)
        {
            bool witch = hero.IsWitch && _witchTurn != null;
            return (witch ? _witchTurn : _warriorTurn) as IHeroTurnTaker;
        }

        // Os dois caídos: oferece Soul (se houver quem ofereça e Soul para gastar).
        private async Awaitable<bool> OfferRevive()
        {
            var handler = _deathHandler as IDeathHandler;
            if (handler == null || Context.SoulsAvailable <= 0) return false;
            if (!await handler.OfferRevive(Context)) return false;

            Context.SoulsUsed++;
            Context.Party.ReviveActive();
            _stage.Float(null, $"+{Context.Hero.MaxHp} SOUL", BattleStage.Cyan, true);
            Context.Log($"A Soul envolve {Context.Hero.Name} em luz... de pé, com a vida cheia!");
            return true;
        }

        // Monta o resumo do fim, com o ouro e a run perfeita da dupla.
        private BattleEnd End(DungeonOutcomeKind kind) => new BattleEnd
        {
            Kind = kind,
            Request = Context.Request,
            RunGold = Context.Party.RunGold,
            Flawless = Context.Party.Flawless,
            SoulsUsed = Context.SoulsUsed,
            MapsUsed = Context.MapsUsed,
            Wave = Context.Wave,
            Swaps = Context.Party.Swaps,
        };

        // Fase 2 dos chefes, conferida a todo quadro (GuerreiroDaMasmorra.md §8.4).
        private void Update()
        {
            if (Context == null) return;
            foreach (var monster in Context.Monsters)
            {
                if (!monster.ShouldEnrage) continue;
                monster.Enrage(CombatMath.EnrageAttackMult);
                _stage.Float(monster, "FASE 2!", BattleStage.Red, true);
                _stage.Shake();
                Context.Log($"{monster.Name} entra em FÚRIA! Golpes mais fortes, mais rápidos e turnos extras!");
            }
        }
    }
}
```

> O controlador já referencia o `PartyHud` (Etapa 3E). Crie o script da Etapa 3E antes de voltar para a Unity, ou o Console acusa erro até lá.

**`ResultPanel.cs`**: o painel de derrota diz "o herói caiu". Procure os textos com "herói" no método `OfferRevive` e troque por "a dupla caiu". O fluxo não muda.

### Etapa 3D — O comando Trocar

**`CommandMenu.cs`**, cinco mudanças:

1. `Swap` **no fim** do `HeroCommand` (depois de `Flee`).
2. Em `CommandOptions`, três campos:

   ```csharp
        public bool HasPartner;
        public bool CanSwap;
        public string SwapLabel;
   ```

3. Um campo: `[SerializeField] private HoldButton _swap;`
4. No `Awake`: `_swap.Held += () => Complete(HeroCommand.Swap);`
5. No `WaitForCommand`, antes de `_root.SetActive(true)`:

   ```csharp
            _swap.gameObject.SetActive(o.HasPartner);
            _swap.Interactable = o.CanSwap;
            _swap.SetLabel(o.SwapLabel);
   ```

**`WarriorTurn.cs`**, três mudanças:

1. Um campo: `[SerializeField] private PartySwap _swapper;`
2. No `Options`, dentro do `new CommandOptions { ... }`:

   ```csharp
                HasPartner = ctx.Party.Reserve != null,
                CanSwap = ctx.Party.CanSwap,
                SwapLabel = ctx.Party.Reserve != null ? $"TROCAR: {ctx.Party.Reserve.Name.ToUpperInvariant()}" : "",
   ```

3. No `switch` do `TakeTurn`, antes do `case HeroCommand.Flee:`:

   ```csharp
                case HeroCommand.Swap: await _swapper.Swap(ctx, forced: false); break;
   ```

**`BattleTestStarter.cs`**: um campo `[SerializeField] private string _partnerId = "witch";` e, no `new DungeonRequest { ... }`:

```csharp
                Partner = string.IsNullOrEmpty(_partnerId) ? null : HeroLoadout.Fresh(_database.Hero(_partnerId)),
```

**`BattleHud.cs`**: o HUD do Guerreiro mostra "VOCÊ" na fila e só a Fúria. No `ShowQueue`, troque `"VOCÊ"` por `_context.Hero.Name.ToUpperInvariant()`. No `LateUpdate`, troque as duas linhas da Fúria por:

```csharp
            _furyLabel.text = hero.IsWitch ? $"MANA {hero.Mana}/{hero.Loadout.MaxMana}"
                : hero.FurySealed ? "FÚRIA SELADA" : $"FÚRIA {hero.Fury}/5";
            _furyFill.fillAmount = hero.IsWitch ? (float)hero.Mana / Mathf.Max(1, hero.Loadout.MaxMana) : hero.Fury / 5f;
```

E o ouro do chip passa a ser o da dupla: troque `OURO {hero.RunGold}` por `OURO {_context.Party.RunGold}`.

### Etapa 3E — O painel da dupla

```csharp
// Caminho: Assets/_Project/Scripts/Battle/PartyHud.cs
using System;
using OldKnight.Combat;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace OldKnight.Battle
{
    // POR QUE: o painel da dupla na base da tela (Parte 1 §11): retrato,
    // nome e HP dos dois, com destaque em quem está em campo. É o que deixa
    // o jogador decidir a troca sem abrir menu nenhum.
    // ESTRATÉGIA: um "slot" de interface por membro da dupla, na ordem da
    // PartyRun; o LateUpdate copia HP e quem está em campo. Retratos vêm de
    // uma lista (id do herói → sprite), montada no Inspector.
    public class PartyHud : MonoBehaviour
    {
        [Serializable]
        private class Slot
        {
            public GameObject root;
            public Image portrait;
            public Image hpFill;
            public TMP_Text label;
            public GameObject activeFrame;
        }

        [Serializable]
        private class Portrait
        {
            public string heroId;
            public Sprite sprite;
        }

        [SerializeField] private Slot[] _slots = new Slot[2];
        [SerializeField] private Portrait[] _portraits;

        private BattleContext _context;

        // Liga o painel a uma masmorra.
        public void Bind(BattleContext context)
        {
            _context = context;
            var members = context.Party.Members;
            for (int i = 0; i < _slots.Length; i++)
            {
                bool used = i < members.Count;
                _slots[i].root.SetActive(used);
                if (used) _slots[i].portrait.sprite = PortraitOf(members[i].Loadout.Hero.id);
            }
        }

        // HP, quem está em campo e quem caiu.
        private void LateUpdate()
        {
            if (_context == null) return;
            var members = _context.Party.Members;
            for (int i = 0; i < members.Count && i < _slots.Length; i++)
            {
                var hero = members[i];
                var slot = _slots[i];
                slot.hpFill.fillAmount = (float)hero.Hp / hero.MaxHp;
                slot.label.text = hero.Dead ? $"{hero.Name}  CAÍDO" : $"{hero.Name}  {hero.Hp}/{hero.MaxHp}";
                slot.activeFrame.SetActive(hero == _context.Hero);
                slot.portrait.color = hero.Dead ? new Color(0.3f, 0.3f, 0.3f) : Color.white;
            }
        }

        // O retrato de um herói (null se não houver).
        private Sprite PortraitOf(string heroId)
        {
            foreach (var p in _portraits) if (p.heroId == heroId) return p.sprite;
            return null;
        }
    }
}
```

**Montar na cena `Battle`:**

1. No Canvas `[UI]`, no canto inferior esquerdo, `PartyHud` (**Add Component → Party Hud**) com um **Horizontal Layout Group** e dois filhos iguais, `Slot0` e `Slot1`, cada um `260 × 120`:
   - `Frame` (**UI → Image**, borda dourada, esticada; é o **Active Frame**);
   - `Portrait` (**UI → Image**, `96 × 96`, à esquerda);
   - `HpFill` (**UI → Image**, **Filled**, **Horizontal**, verde);
   - `Label` (texto `26`).
2. Ligue os dois slots e preencha **Portraits** com `knight` e `witch` (sprites de retrato do PixelLab, ou a pose parada por enquanto).
3. No `CommandMenu`, acrescente um HoldButton `Swap` ("TROCAR") ao **Vertical Layout Group** do `Root` e ligue em **Swap**.
4. Em `[Systems]`: objeto `PartySwap` (**Party Swap**, com **Stage**). No **Battle Controller**, ligue **Party Hud** e **Swap**. No **Warrior Turn**, ligue **Swapper**. O **Witch Turn** fica vazio até a Fase 4.

### 🧪 Teste rápido
Abra `Battle` direto (o starter manda a dupla). O Cavaleiro está em campo e a Bruxa esmaecida atrás, à esquerda.
- No turno do Cavaleiro, segure **TROCAR**: os dois cruzam de lugar e o turno acaba. Na rodada seguinte, a fila mostra **BRUXA** duas vezes.
- Os monstros só atacam quem está em campo: a barra de HP de quem está na reserva não muda.
- Deixe o AutoPlayer com **Skill** `0` até alguém cair: o outro entra sozinho ("caiu! ... assume a frente!"). A derrota só aparece quando os dois caem.

### ✅ Checkpoint da Fase 3
- A fila segue quem está em campo: 1 vaga lenta para o Cavaleiro e 2 rápidas para a Bruxa.
- Trocar gasta o turno; a troca forçada não gasta nada; derrota só com os dois caídos.
- Poções compartilhadas: a Bruxa bebe do mesmo estoque do Cavaleiro.
- Commit: `feat: dupla com troca`.

#### Problemas comuns
- **`NullReferenceException` em `HeroView` na troca:** o `BattleStage` ainda tem o `Bind` da Fase 2, que só cria quem está em campo. Use o `Bind` desta fase.
- **A Bruxa age uma vez só por rodada:** o asset `Data/Heroes/witch` ficou com **Turns Per Round** `1`. Rode **OKW → Criar ou atualizar dados iniciais** de novo.
- **A fila não muda depois da troca:** está certo. A fila da rodada é montada no começo dela (Parte 1 §4.2); a mudança aparece na rodada seguinte.

Próxima fase: **Fase 4 — A Bruxa**.

---

# Parte 7 — Implementação Unity: Fase 4 (A Bruxa)

> Objetivo desta fase: a Bruxa joga com o **deck e a mana** da Parte 1 §7. No turno dela, a mão aparece na base da tela: tocar numa carta mostra o efeito, segurar 0,5 s a joga no alvo atual, e ela joga quantas a mana pagar antes de **Encerrar**.

**Conceitos novos:**
- **Monte de compra, mão e descarte:** as três pilhas de um deckbuilder. Quando o monte de compra acaba, o descarte é embaralhado e vira o novo monte.
- **Embaralhar com Fisher-Yates:** percorre a lista do fim para o começo e troca cada carta com uma posição sorteada antes dela. Todas as ordens ficam igualmente prováveis, e com o `IRandom` roteirizado dos testes o resultado é previsível.
- **Uma carta = um asset:** cada carta é um `ScriptableObject`. O deck é uma lista de referências para esses assets; duas Faíscas são duas referências para o mesmo asset.

### Etapa 4A — As cartas como dados

```csharp
// Caminho: Assets/_Project/Scripts/Data/CardDefinition.cs
using UnityEngine;

namespace OldKnight.Data
{
    // POR QUE: em quem a carta age (Parte 1 §7.2). Bounce = golpes em alvos
    // sorteados entre os vivos, podendo repetir.
    public enum CardTarget
    {
        Single,
        All,
        Bounce,
        Self,
        Partner,
        None,
    }

    // POR QUE: o efeito principal da carta. Utility = só os extras (mana e
    // compra); HandOff = a troca do Passo Trocado.
    public enum CardEffect
    {
        Damage,
        Ward,
        Heal,
        Utility,
        HandOff,
    }

    // POR QUE: uma carta da Bruxa (Parte 1 §7.2).
    // ESTRATÉGIA: `power` multiplica o ATK da Bruxa (dano, escudo ou cura).
    // `manaGain` e `draw` são extras que qualquer carta pode ter (a Pressa
    // usa os dois). O turno lê só estes campos: carta nova não exige código
    // novo, desde que use estes efeitos.
    [CreateAssetMenu(fileName = "Card", menuName = "OKW/Card")]
    public class CardDefinition : ScriptableObject
    {
        public string id;
        public string displayName;
        [TextArea] public string description;
        public int cost;
        public CardTarget target;
        public CardEffect effect;
        [Tooltip("Multiplicador do ATK da Bruxa.")]
        public float power;
        public int hits = 1;
        [Tooltip("Cansaço extra em cada alvo atingido.")]
        public int fatigue;
        public int manaGain;
        public int draw;
        public Sprite art;
    }
}
```

**`GameDatabase.cs`**: acrescente as listas das cartas e a busca pelo id:

```csharp
        [Header("Cartas da Bruxa (Parte 1 §7.2)")]
        public List<CardDefinition> cards = new List<CardDefinition>();
        [Tooltip("O deck inicial, com as cópias repetidas.")]
        public List<CardDefinition> starterDeck = new List<CardDefinition>();
        [Tooltip("O conjunto de onde saem as recompensas.")]
        public List<CardDefinition> rewardPool = new List<CardDefinition>();

        // Carta pelo id gravado no save (null se não existir mais).
        public CardDefinition Card(string id) => cards.Find(c => c.id == id);
```

**`GameDataSeeder.cs`**: antes do bloco `var db = LoadOrCreate<GameDatabase>(...)`, acrescente as cartas da Parte 1 §7.2:

```csharp
            // Parte 1 §7.2 — as cartas da Bruxa (proposta do GDD).
            var cards = new List<CardDefinition>();
            CardDefinition Card(string id, string name, string description, int cost, CardTarget target,
                CardEffect effect, float power, int hits = 1, int fatigue = 0, int manaGain = 0, int draw = 0)
            {
                var c = LoadOrCreate<CardDefinition>($"{Root}/Cards/{id}.asset");
                c.id = id;
                c.displayName = name;
                c.description = description;
                c.cost = cost;
                c.target = target;
                c.effect = effect;
                c.power = power;
                c.hits = hits;
                c.fatigue = fatigue;
                c.manaGain = manaGain;
                c.draw = draw;
                EditorUtility.SetDirty(c);
                cards.Add(c);
                return c;
            }

            var spark = Card("spark", "Faísca", "ATK x0,6 em 1 alvo", 0, CardTarget.Single, CardEffect.Damage, 0.6f);
            var embers = Card("embers", "Chuva de Brasas", "ATK x0,5 em todos", 1, CardTarget.All, CardEffect.Damage, 0.5f);
            var veil = Card("veil", "Véu Cinzento", "Escudo de ATK x1,0", 1, CardTarget.Self, CardEffect.Ward, 1f);
            var snap = Card("snap", "Estalo Duplo", "2 golpes de ATK x0,5 em alvos sorteados", 1, CardTarget.Bounce, CardEffect.Damage, 0.5f, hits: 2);
            var rewards = new List<CardDefinition>
            {
                Card("chain", "Raio em Cadeia", "3 golpes de ATK x0,45 em alvos sorteados", 1, CardTarget.Bounce, CardEffect.Damage, 0.45f, hits: 3),
                Card("blizzard", "Nevasca", "ATK x0,7 em todos, +1 de cansaço", 2, CardTarget.All, CardEffect.Damage, 0.7f, fatigue: 1),
                Card("blast", "Explosão Arcana", "ATK x1,1 em todos", 2, CardTarget.All, CardEffect.Damage, 1.1f),
                Card("lance", "Lança de Luz", "ATK x1,4 em 1 alvo", 1, CardTarget.Single, CardEffect.Damage, 1.4f),
                Card("tea", "Chá de Ervas", "Cura ATK x1,5", 1, CardTarget.Self, CardEffect.Heal, 1.5f),
                Card("blessing", "Bênção ao Mestre", "Cura o parceiro na reserva em ATK x1,5", 1, CardTarget.Partner, CardEffect.Heal, 1.5f),
                Card("haste", "Pressa", "+1 mana e compra 1 carta", 0, CardTarget.None, CardEffect.Utility, 0f, manaGain: 1, draw: 1),
                Card("memory", "Lembrança", "Compra 2 cartas", 1, CardTarget.None, CardEffect.Utility, 0f, draw: 2),
                Card("swapstep", "Passo Trocado", "Troca com o parceiro, que age na hora", 0, CardTarget.None, CardEffect.HandOff, 0f),
            };
            var starter = new List<CardDefinition>
            {
                spark, spark, spark, spark, embers, embers, embers, veil, veil, snap,
            };
```

E, junto das outras atribuições ao `db`:

```csharp
            db.cards = cards;
            db.starterDeck = starter;
            db.rewardPool = rewards;
```

### 🧪 Teste rápido
**OKW → Criar ou atualizar dados iniciais**. A pasta `Data/Cards` tem 13 cartas, e o `GameDatabase` mostra **Starter Deck** com 10 itens (4 Faíscas).

### Etapa 4B — Deck e mana em C# puro

**`HeroRun.cs`**: o `HeroLoadout` ganha o deck. Acrescente no topo `using System.Collections.Generic;` e, nos campos da Bruxa:

```csharp
        public List<CardDefinition> Deck = new List<CardDefinition>();
```

```csharp
// Caminho: Assets/_Project/Scripts/Combat/WitchDeck.cs
using System.Collections.Generic;
using OldKnight.Data;

namespace OldKnight.Combat
{
    // POR QUE: as três pilhas da Bruxa (Parte 1 §7.1): monte de compra, mão
    // e descarte, durante uma masmorra inteira (passa de uma onda para a
    // outra).
    // ESTRATÉGIA: listas de referências para os assets de carta. Comprar com
    // o monte vazio embaralha o descarte e o transforma no monte. Jogar uma
    // carta a move da mão para o descarte pela posição na mão (há cópias
    // iguais). O embaralhar usa o IRandom, para os testes serem previsíveis.
    public sealed class WitchDeck
    {
        public readonly List<CardDefinition> DrawPile = new List<CardDefinition>();
        public readonly List<CardDefinition> Hand = new List<CardDefinition>();
        public readonly List<CardDefinition> Discard = new List<CardDefinition>();

        private readonly IRandom _rng;

        // Começa a masmorra com o deck inteiro embaralhado no monte.
        public WitchDeck(IEnumerable<CardDefinition> deck, IRandom rng)
        {
            _rng = rng;
            DrawPile.AddRange(deck);
            Shuffle(DrawPile, rng);
        }

        // Compra até a mão ter `handSize` cartas. Devolve quantas comprou.
        public int DrawUpTo(int handSize)
        {
            int drawn = 0;
            while (Hand.Count < handSize && Draw()) drawn++;
            return drawn;
        }

        // Compra uma carta (false se monte e descarte estão vazios).
        public bool Draw()
        {
            if (DrawPile.Count == 0)
            {
                if (Discard.Count == 0) return false;
                DrawPile.AddRange(Discard);
                Discard.Clear();
                Shuffle(DrawPile, _rng);
            }
            int last = DrawPile.Count - 1;
            Hand.Add(DrawPile[last]);
            DrawPile.RemoveAt(last);
            return true;
        }

        // Tira a carta da posição `index` da mão e a põe no descarte.
        public CardDefinition Play(int index)
        {
            var card = Hand[index];
            Hand.RemoveAt(index);
            Discard.Add(card);
            return card;
        }

        // Fisher-Yates: troca cada posição com uma sorteada antes dela.
        public static void Shuffle(List<CardDefinition> cards, IRandom rng)
        {
            for (int i = cards.Count - 1; i > 0; i--)
            {
                int j = rng.Range(0, i);
                (cards[i], cards[j]) = (cards[j], cards[i]);
            }
        }
    }

    // POR QUE: as contas das cartas (Parte 1 §7.2) num lugar só.
    // ESTRATÉGIA: funções puras. Dano de carta é magia: ignora a DEF e vale
    // pelo menos 1.
    public static class WitchMath
    {
        // Dano, escudo ou cura de uma carta: ATK × poder × bônus.
        public static int Amount(int attack, float power, double bonus = 1.0) =>
            System.Math.Max(1, MathUtil.RoundHalfUp(attack * power * bonus));

        // A carta pode ser jogada agora?
        public static bool CanPlay(CardDefinition card, int mana, bool canSwap, bool partnerAlive)
        {
            if (card.cost > mana) return false;
            if (card.effect == CardEffect.HandOff && !canSwap) return false;
            if (card.target == CardTarget.Partner && !partnerAlive) return false;
            return true;
        }
    }
}
```

### 🧪 Teste rápido
Os testes destas classes estão na Fase 7. Por enquanto, confira que compila.

### Etapa 4C — A mão na tela

```csharp
// Caminho: Assets/_Project/Scripts/Battle/CardView.cs
using System;
using OldKnight.Data;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace OldKnight.Battle
{
    // POR QUE: uma carta na mão da Bruxa (Parte 1 §11): tocar mostra o
    // efeito; segurar 0,5 s joga a carta.
    // ESTRATÉGIA: mede o tempo entre encostar e soltar o dedo. Se o dedo
    // fica até o limite, dispara `Played` uma vez (a barra enche enquanto
    // isso); se solta antes, é um toque: `Selected`. Carta sem mana fica
    // apagada e não dispara nada.
    public class CardView : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
    {
        [SerializeField] private Image _art;
        [SerializeField] private TMP_Text _name;
        [SerializeField] private TMP_Text _cost;
        [SerializeField] private Image _holdFill;
        [SerializeField] private CanvasGroup _group;
        [SerializeField] private float _holdSeconds = 0.5f;

        private float _pressedAt = -1f;
        private bool _fired;
        private bool _playable;

        public event Action Selected;
        public event Action Played;

        // Mostra uma carta (ou esconde, com null).
        public void Show(CardDefinition card, bool playable)
        {
            gameObject.SetActive(card != null);
            if (card == null) return;
            _playable = playable;
            _name.text = card.displayName;
            _cost.text = card.cost.ToString();
            if (_art != null) _art.sprite = card.art;
            _group.alpha = playable ? 1f : 0.45f;
            _holdFill.fillAmount = 0f;
            _pressedAt = -1f;
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            _pressedAt = Time.time;
            _fired = false;
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            if (_pressedAt >= 0f && !_fired) Selected?.Invoke();
            _pressedAt = -1f;
            _holdFill.fillAmount = 0f;
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            _pressedAt = -1f;
            _holdFill.fillAmount = 0f;
        }

        // Enche a barra enquanto o dedo está na carta e joga no limite.
        private void Update()
        {
            if (_pressedAt < 0f || _fired || !_playable) return;
            float k = (Time.time - _pressedAt) / _holdSeconds;
            _holdFill.fillAmount = Mathf.Clamp01(k);
            if (k < 1f) return;
            _fired = true;
            _holdFill.fillAmount = 0f;
            Played?.Invoke();
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Battle/WitchHandView.cs
using System.Collections.Generic;
using OldKnight.Data;
using TMPro;
using UnityEngine;

namespace OldKnight.Battle
{
    public enum WitchActionKind
    {
        None,
        Play,
        End,
        Swap,
        Potion,
        Flee,
    }

    // POR QUE: o que a Bruxa escolheu fazer.
    public struct WitchAction
    {
        public WitchActionKind Kind;
        public int HandIndex;
    }

    // POR QUE: o que a tela precisa mostrar neste momento do turno.
    public struct WitchHandState
    {
        public IReadOnlyList<CardDefinition> Hand;
        public bool[] Playable;
        public int Mana;
        public int MaxMana;
        public int DrawPile;
        public int Discard;
        public bool HasPartner;
        public bool CanSwap;
        public string SwapLabel;
        public int Potions;
        public bool CanPotion;
        public int Maps;
    }

    // POR QUE: a mão da Bruxa e os botões do turno dela (Parte 1 §11), no
    // lugar do menu de comandos do Cavaleiro.
    // ESTRATÉGIA: como o CommandMenu do Guerreiro, WaitForAction devolve uma
    // promessa que se cumpre com a ação escolhida. Tocar numa carta só mostra
    // a descrição; segurar a joga. O turno chama WaitForAction de novo depois
    // de cada carta, então a tela é sempre redesenhada com a mão e a mana
    // atuais.
    public class WitchHandView : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private CardView[] _cards = new CardView[6];
        [SerializeField] private TMP_Text _mana;
        [SerializeField] private TMP_Text _piles;
        [SerializeField] private TMP_Text _info;
        [SerializeField] private HoldButton _end;
        [SerializeField] private HoldButton _swap;
        [SerializeField] private HoldButton _potion;
        [SerializeField] private HoldButton _flee;

        private AwaitableCompletionSource<WitchAction> _pending;
        private IReadOnlyList<CardDefinition> _hand;

        // Liga cartas e botões às ações.
        private void Awake()
        {
            for (int i = 0; i < _cards.Length; i++)
            {
                int index = i;
                _cards[i].Selected += () => Describe(index);
                _cards[i].Played += () => Complete(new WitchAction { Kind = WitchActionKind.Play, HandIndex = index });
            }
            _end.Held += () => Complete(new WitchAction { Kind = WitchActionKind.End });
            _swap.Held += () => Complete(new WitchAction { Kind = WitchActionKind.Swap });
            _potion.Held += () => Complete(new WitchAction { Kind = WitchActionKind.Potion });
            _flee.Held += () => Complete(new WitchAction { Kind = WitchActionKind.Flee });
            _root.SetActive(false);
        }

        // Mostra a mão e espera uma ação.
        public Awaitable<WitchAction> WaitForAction(WitchHandState s)
        {
            _hand = s.Hand;
            for (int i = 0; i < _cards.Length; i++)
                _cards[i].Show(i < s.Hand.Count ? s.Hand[i] : null, i < s.Hand.Count && s.Playable[i]);
            _mana.text = $"MANA {s.Mana}/{s.MaxMana}";
            _piles.text = $"MONTE {s.DrawPile}  DESCARTE {s.Discard}";
            _info.text = "Toque numa carta para ver; segure para lançar.";
            _swap.gameObject.SetActive(s.HasPartner);
            _swap.Interactable = s.CanSwap;
            _swap.SetLabel(s.SwapLabel);
            _potion.Interactable = s.CanPotion;
            _potion.SetLabel($"CURA x{s.Potions}");
            _flee.Interactable = s.Maps > 0;
            _flee.SetLabel($"FUGIR x{s.Maps}");

            _root.SetActive(true);
            _pending = new AwaitableCompletionSource<WitchAction>();
            return _pending.Awaitable;
        }

        // Encerra a espera sem ação (a pedrada matou o último monstro).
        public void Cancel() => Complete(new WitchAction { Kind = WitchActionKind.None });

        // Mostra o efeito da carta tocada.
        private void Describe(int index)
        {
            if (_hand == null || index >= _hand.Count) return;
            var card = _hand[index];
            _info.text = $"{card.displayName} ({card.cost} de mana): {card.description}";
        }

        // Cumpre a promessa uma vez só e esconde a mão.
        private void Complete(WitchAction action)
        {
            if (_pending == null) return;
            var pending = _pending;
            _pending = null;
            _root.SetActive(false);
            pending.SetResult(action);
        }
    }
}
```

### Etapa 4D — O turno da Bruxa

```csharp
// Caminho: Assets/_Project/Scripts/Battle/WitchTurn.cs
using System.Collections.Generic;
using System.Threading;
using OldKnight.Combat;
using OldKnight.Data;
using UnityEngine;

namespace OldKnight.Battle
{
    // POR QUE: o turno da Bruxa (Parte 1 §7.1): recebe mana, compra até a
    // mão encher e joga cartas enquanto a mana pagar; Encerrar, Trocar, Poção
    // e Fugir terminam o turno.
    // ESTRATÉGIA: um WitchDeck por masmorra (criado na primeira vaga dela e
    // mantido entre as ondas). Cada carta é resolvida por efeito; os alvos
    // vêm do tipo de alvo da carta. A pedrada e a escolha de alvo ficam
    // ligadas o turno inteiro, como no turno do Cavaleiro. Passo Trocado
    // troca e devolve HandOff: o controlador dá a vaga a quem entrou.
    public class WitchTurn : MonoBehaviour, IHeroTurnTaker
    {
        [SerializeField] private BattleStage _stage;
        [SerializeField] private WitchHandView _view;
        [SerializeField] private TargetSelector _targets;
        [SerializeField] private MonoBehaviour _freeAction;
        [SerializeField] private PartySwap _swapper;

        private BattleContext _owner;
        private WitchDeck _deck;

        private CancellationToken Token => destroyCancellationToken;

        // A vaga da Bruxa.
        public async Awaitable<TurnResult> TakeTurn(BattleContext ctx)
        {
            var witch = ctx.Hero;
            if (_owner != ctx)
            {
                _owner = ctx;
                _deck = new WitchDeck(witch.Loadout.Deck, ctx.Rng);
            }
            witch.GainMana(witch.Loadout.ManaPerTurn);
            _deck.DrawUpTo(witch.Loadout.HandSize);

            ctx.ShowTarget = true;
            _targets.Begin(ctx);
            var free = _freeAction as IFreeAction;
            free?.Begin(ctx, _view.Cancel);
            try
            {
                while (true)
                {
                    ctx.EnsureTarget();
                    if (ctx.WaveCleared) return TurnResult.Done;
                    var action = await _view.WaitForAction(State(ctx));
                    switch (action.Kind)
                    {
                        case WitchActionKind.None:
                        case WitchActionKind.End:
                            return TurnResult.Done;
                        case WitchActionKind.Flee:
                            ctx.MapsUsed++;
                            ctx.Log("A Bruxa abriu o mapa e a dupla escapou pelo túnel secreto. O ouro foi mantido.");
                            return TurnResult.Fled;
                        case WitchActionKind.Potion:
                            DrinkPotion(ctx);
                            await Wait(0.65f);
                            return TurnResult.Done;
                        case WitchActionKind.Swap:
                            await _swapper.Swap(ctx, forced: false);
                            return TurnResult.Done;
                        case WitchActionKind.Play:
                            var card = _deck.Hand[action.HandIndex];
                            if (!WitchMath.CanPlay(card, witch.Mana, ctx.Party.CanSwap, PartnerAlive(ctx))) continue;
                            witch.Mana -= card.cost;
                            _deck.Play(action.HandIndex);
                            if (await Resolve(ctx, card)) return TurnResult.HandOff;
                            break;
                    }
                }
            }
            finally
            {
                free?.End();
                _targets.End();
                ctx.ShowTarget = false;
            }
        }

        // O que a mão mostra agora.
        private WitchHandState State(BattleContext ctx)
        {
            var witch = ctx.Hero;
            var playable = new bool[_deck.Hand.Count];
            for (int i = 0; i < playable.Length; i++)
                playable[i] = WitchMath.CanPlay(_deck.Hand[i], witch.Mana, ctx.Party.CanSwap, PartnerAlive(ctx));
            var reserve = ctx.Party.Reserve;
            return new WitchHandState
            {
                Hand = _deck.Hand,
                Playable = playable,
                Mana = witch.Mana,
                MaxMana = witch.Loadout.MaxMana,
                DrawPile = _deck.DrawPile.Count,
                Discard = _deck.Discard.Count,
                HasPartner = reserve != null,
                CanSwap = ctx.Party.CanSwap,
                SwapLabel = reserve != null ? $"TROCAR: {reserve.Name.ToUpperInvariant()}" : "",
                Potions = witch.Potions,
                CanPotion = witch.Potions > 0 && witch.Hp < witch.MaxHp,
                Maps = ctx.MapsAvailable,
            };
        }

        // Resolve uma carta. Devolve true se foi uma troca (HandOff).
        private async Awaitable<bool> Resolve(BattleContext ctx, CardDefinition card)
        {
            var witch = ctx.Hero;
            ctx.Log($"{card.displayName}!");
            var cast = _stage.HeroView.Strike(Token);
            await Wait(0.15f);

            switch (card.effect)
            {
                case CardEffect.Damage:
                    foreach (var target in Targets(ctx, card))
                    {
                        if (target.Dead) continue;
                        int damage = WitchMath.Amount(witch.Attack, card.power);
                        var strike = Strikes.Apply(target, damage, 1, damage, 0);
                        for (int f = 0; f < card.fatigue; f++)
                            if (CombatMath.AddFatigue(target, 1, ctx.EffectiveLevel, ctx.Balance))
                                _stage.Float(target, "EXAUSTO!", BattleStage.Cyan, true);
                        _stage.ShowStrike(target, strike, BattleStage.Purple, card.target == CardTarget.All);
                        if (strike.Killed) ctx.Slay(target);
                        if (card.target == CardTarget.Bounce) await Wait(0.12f);
                    }
                    if (card.target == CardTarget.All) _stage.Shake();
                    break;
                case CardEffect.Ward:
                    int ward = WitchMath.Amount(witch.Attack, card.power);
                    witch.Ward += ward;
                    _stage.Float(null, $"VÉU +{ward}", BattleStage.Blue, true);
                    break;
                case CardEffect.Heal:
                    var patient = card.target == CardTarget.Partner ? ctx.Party.Reserve : witch;
                    int healed = patient.Heal(WitchMath.Amount(witch.Attack, card.power));
                    if (patient == witch) _stage.Float(null, $"+{healed}", BattleStage.Green, true);
                    ctx.Log($"{patient.Name} recupera {healed} de HP.");
                    break;
                case CardEffect.HandOff:
                    await cast;
                    await _swapper.Swap(ctx, forced: false);
                    return true;
            }

            if (card.manaGain > 0) witch.GainMana(card.manaGain);
            for (int i = 0; i < card.draw; i++) _deck.Draw();
            await cast;
            await Awaitable.WaitForSecondsAsync(0.1f, Token);
            return false;
        }

        // Os alvos de uma carta de dano.
        private static IEnumerable<Monster> Targets(BattleContext ctx, CardDefinition card)
        {
            switch (card.target)
            {
                case CardTarget.All:
                    foreach (var m in ctx.Alive()) yield return m;
                    break;
                case CardTarget.Bounce:
                    for (int i = 0; i < card.hits; i++)
                    {
                        var alive = ctx.Alive();
                        if (alive.Count == 0) yield break;
                        yield return alive[ctx.Rng.Range(0, alive.Count - 1)];
                    }
                    break;
                default:
                    ctx.EnsureTarget();
                    for (int i = 0; i < card.hits && ctx.Target != null; i++) yield return ctx.Target;
                    break;
            }
        }

        // Poção de Cura da dupla: +40% do HP máximo de quem bebe.
        private void DrinkPotion(BattleContext ctx)
        {
            var witch = ctx.Hero;
            witch.Potions--;
            int healed = witch.Heal(MathUtil.RoundHalfUp(witch.MaxHp * CombatMath.HealPotionFraction));
            _stage.Float(null, $"+{healed}", BattleStage.Green, true);
            ctx.Log($"Poção de Cura! +{healed} de HP para a Bruxa.");
        }

        private static bool PartnerAlive(BattleContext ctx) => ctx.Party.Reserve != null && !ctx.Party.Reserve.Dead;

        private Awaitable Wait(float seconds) => Awaitable.WaitForSecondsAsync(seconds, Token);
    }
}
```

**`BattleTestStarter.cs`**: a Bruxa de teste precisa de um deck. Depois de montar o `Partner`, e também se o `_heroId` for `witch`, preencha o deck dos loadouts dela:

```csharp
            foreach (var l in new[] { loadout, partner })
                if (l != null && l.Hero.heroClass == HeroClass.Witch) l.Deck.AddRange(_database.starterDeck);
```

(com `partner` sendo uma variável local que você passa em `Partner = partner`).

**Montar na cena `Battle`:**

1. **Prefab `CardView`:** **UI → Image** `CardView`, `170 × 240`, com **Canvas Group** e **Add Component → Card View**. Filhos: `Art` (**Image**, `150 × 120`, no alto), `Name` (texto `24`), `Cost` (texto `34` num círculo azul no canto superior esquerdo), `HoldFill` (**Image**, **Filled**, **Vertical**, branco translúcido, esticado). Ligue os campos. Para `Prefabs/`.
2. No Canvas, `WitchHandView` (**Add Component → Witch Hand View**) com o filho `Root`, ancorado na base da tela:
   - `Cards`: **Horizontal Layout Group** com 6 `CardView`;
   - acima das cartas: `Mana` (texto `34`, azul), `Piles` (`24`) e `Info` (`26`, quebra de linha);
   - à direita: um **Vertical Layout Group** com 4 HoldButtons: `End` ("ENCERRAR"), `Swap`, `Potion` e `Flee`.
   Ligue tudo.
3. Em `[Systems]`, `WitchTurn` (**Witch Turn**): **Stage**, **View**, **Targets**, **Free Action** (o mesmo `RockThrower` do Cavaleiro) e **Swapper**. No **Battle Controller**, ligue **Witch Turn**.

### 🧪 Teste rápido
No `BattleTestStarter`, ponha **Hero Id** `witch` e **Partner Id** `knight`. Dê Play:
- A Bruxa começa em campo com 4 cartas e `MANA 2/4`. A fila mostra **BRUXA** duas vezes.
- Toque numa carta: a descrição aparece. Segure a Chuva de Brasas: todos os monstros levam dano roxo e a mana cai para 1.
- Jogue Faíscas (custo 0) até a mão esvaziar e segure **ENCERRAR**. Na vaga seguinte, a mão volta a 4 e a mana sobe 2.
- Faça um parry perfeito com a Bruxa em campo: a mana sobe 1, em vez da Fúria.
- Com uma carta Passo Trocado no deck (arraste o asset `swapstep` para o **Starter Deck** para testar), a troca acontece e o Cavaleiro age na hora.

### ✅ Checkpoint da Fase 4
- 13 cartas criadas pelo seeder; deck inicial de 10.
- Mão, monte e descarte funcionam; o descarte volta ao monte quando o monte acaba.
- Cartas de área atingem todos; as de salto sorteiam alvos; Véu absorve dano; Passo Trocado entrega a vaga.
- A Bruxa ganha mana onde o Cavaleiro ganharia Fúria.
- Commit: `feat: a Bruxa com deck e mana`.

#### Problemas comuns
- **A mão não aparece e o turno trava:** o `WitchTurn` não está ligado no **Battle Controller**, e o controlador mandou a Bruxa para o `WarriorTurn` (sem o menu certo). Ligue o campo.
- **Segurar a carta não faz nada:** o Canvas não tem **Graphic Raycaster**, ou o EventSystem usa o módulo antigo. Use o **InputSystemUIInputModule**.
- **A Bruxa não compra nada:** o deck do loadout está vazio. O acampamento (Fase 5) preenche pelo save; no teste direto, é o `BattleTestStarter`.

Próxima fase: **Fase 5 — Acampamento da dupla**.

---

# Parte 8 — Implementação Unity: Fase 5 (Acampamento da dupla)

> Objetivo desta fase: o acampamento do guia do Guerreiro passa a cuidar da dupla (Parte 1 §9.1): atributos comprados para cada um, ouro e Souls de um saldo só, gemas só do Cavaleiro, deck da Bruxa salvo, escolha de 1 entre 3 cartas depois de cada vitória e remoção de cartas por ouro.

**Conceitos novos:**
- **Salvar referências por id:** o save não guarda o asset da carta, guarda o `id` dela (`"spark"`). Ao montar o loadout, o id vira o asset de novo pelo `GameDatabase.Card(id)`. Um id que não existe mais (carta removida do jogo) é ignorado.
- **"Quem aparece no acampamento entra primeiro":** o `activeHero` do save, que no Guerreiro era o herói escolhido, aqui é **quem começa em campo**. Trocar o personagem mostrado no acampamento troca também quem abre a masmorra.

### Etapa 5A — Save e regras

**`SaveData.cs`**: acrescente ao `SaveData` (no fim da classe):

```csharp
        // A Bruxa (Parte 1 §7.3): o deck por id, quantas remoções já foram
        // feitas e a escolha de carta pendente depois de uma vitória.
        public List<string> deck = new List<string>();
        public int cardRemovals;
        public List<string> cardChoices = new List<string>();
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/PartyRules.cs
using System.Collections.Generic;
using OldKnight.Combat;
using OldKnight.Data;

namespace OldKnight.Meta
{
    // POR QUE: as regras do acampamento que o Guerreiro não tinha (Parte 1
    // §7.3 e §9.1): quem é o parceiro, o loadout de cada um com o deck, a
    // recompensa de carta e a remoção de cartas.
    // ESTRATÉGIA: funções sobre o SaveData, sem tela, como o MetaRules do
    // Guerreiro (que continua cuidando de atributos, Tochas, gemas e baú).
    // Os números são a proposta do GDD.
    public static class PartyRules
    {
        public const int DeckMin = 8;
        public const int DeckMax = 20;
        public const int RewardChoices = 3;
        public const int RemoveBaseCost = 100;
        public const string KnightId = "knight";
        public const string WitchId = "witch";

        // Save sem deck (jogo novo ou save antigo): recebe o deck inicial.
        public static void EnsureDeck(SaveData save, GameDatabase db)
        {
            if (save.deck.Count > 0) return;
            foreach (var card in db.starterDeck) save.deck.Add(card.id);
        }

        // O outro personagem da dupla.
        public static string PartnerId(SaveData save) => save.activeHero == KnightId ? WitchId : KnightId;

        // Loadout de um personagem: o do MetaRules mais os números e o deck da Bruxa.
        public static HeroLoadout Loadout(GameDatabase db, SaveData save, HeroProgress hero)
        {
            var loadout = MetaRules.Loadout(db, hero);
            var definition = loadout.Hero;
            loadout.HandSize = definition.handSize;
            loadout.ManaPerTurn = definition.manaPerTurn;
            loadout.MaxMana = definition.maxMana;
            if (definition.heroClass == HeroClass.Witch)
            {
                foreach (string id in save.deck)
                {
                    var card = db.Card(id);
                    if (card != null) loadout.Deck.Add(card);
                }
            }
            return loadout;
        }

        // Depois de uma vitória: sorteia 3 cartas diferentes do conjunto de recompensas.
        public static void RollCardReward(SaveData save, GameDatabase db, IRandom rng)
        {
            save.cardChoices.Clear();
            var pool = new List<CardDefinition>(db.rewardPool);
            for (int i = 0; i < RewardChoices && pool.Count > 0; i++)
            {
                int pick = rng.Range(0, pool.Count - 1);
                save.cardChoices.Add(pool[pick].id);
                pool.RemoveAt(pick);
            }
        }

        // Pega uma das cartas oferecidas. False se não era uma das opções ou o deck está cheio.
        public static bool TakeCard(SaveData save, string id)
        {
            if (!save.cardChoices.Contains(id) || save.deck.Count >= DeckMax) return false;
            save.deck.Add(id);
            save.cardChoices.Clear();
            return true;
        }

        // Pula a escolha.
        public static void SkipCard(SaveData save) => save.cardChoices.Clear();

        // Preço da próxima remoção: 100, 200, 400...
        public static int RemoveCost(SaveData save) => RemoveBaseCost << System.Math.Min(save.cardRemovals, 20);

        // Remove a carta da posição `index` do deck, se houver ouro e o deck passar do mínimo.
        public static bool TryRemoveCard(SaveData save, int index)
        {
            int cost = RemoveCost(save);
            if (index < 0 || index >= save.deck.Count) return false;
            if (save.deck.Count <= DeckMin || save.gold < cost) return false;
            save.gold -= cost;
            save.deck.RemoveAt(index);
            save.cardRemovals++;
            return true;
        }
    }
}
```

**`GameSession.cs`**, três mudanças:

1. No `Awake`, logo depois de `Save = SaveService.Load(_database);`:

   ```csharp
            PartyRules.EnsureDeck(Save, _database);
   ```

2. Troque o `EnterDungeon` inteiro:

   ```csharp
        // Entra na masmorra atual: quem aparece no acampamento começa em campo,
        // o outro na reserva. Os pergaminhos de gema são do Cavaleiro.
        public async void EnterDungeon()
        {
            var b = _database.balance;
            if (!MetaRules.TrySpendTorch(Save, DateTime.UtcNow, b)) return;
            Save.entries++;
            Persist();
            if (Save.entries % b.interstitialEvery == 0) await Ads.Current.ShowInterstitial();

            var leader = ActiveHero;
            var partner = MetaRules.Progress(Save, PartyRules.PartnerId(Save));
            var knight = MetaRules.Progress(Save, PartyRules.KnightId);
            PendingRequest = new DungeonRequest
            {
                Loadout = PartyRules.Loadout(_database, Save, leader),
                Partner = partner != null ? PartyRules.Loadout(_database, Save, partner) : null,
                Level = Save.dungeonLevel,
                NgPlus = Save.ngPlus,
                Color = Save.dungeonColor,
                Souls = Save.souls,
                Maps = Save.maps,
                GemsUnlocked = new List<GemId>(knight.gemsUnlocked),
            };
            SceneManager.LoadScene("Battle");
        }
   ```

3. Troque o `FinishDungeon` inteiro:

   ```csharp
        // Aplica o fim da masmorra (gemas no Cavaleiro), sorteia a carta da
        // vitória e volta ao acampamento.
        public void FinishDungeon(DungeonOutcome outcome)
        {
            var knight = MetaRules.Progress(Save, PartyRules.KnightId);
            MetaRules.ApplyOutcome(Save, knight, outcome, _database.balance, _rng);
            if (outcome.End.Kind == DungeonOutcomeKind.Victory) PartyRules.RollCardReward(Save, _database, _rng);
            Persist();
            PendingRequest = null;
            SceneManager.LoadScene("Camp");
        }
   ```

**`MarketScreen.cs`** e **`GemRow.cs`**: as gemas são só do Cavaleiro. Onde esses scripts usam `GameSession.Instance.ActiveHero`, troque por `MetaRules.Progress(GameSession.Instance.Save, PartyRules.KnightId)`.

### 🧪 Teste rápido
Apague o save antigo (**Edit → Clear All PlayerPrefs**). Dê Play na cena `Camp` e entre na masmorra: a Bruxa da reserva tem o deck inicial de 10 cartas. Vença (ou use o `AutoPlayer` com **Skill** `1`): de volta ao acampamento, o `SaveData` (no Inspector do `GameSession`, em modo **Debug**) tem 3 ids em **Card Choices**.

### Etapa 5B — As telas

```csharp
// Caminho: Assets/_Project/Scripts/Meta/CardRewardPanel.cs
using System;
using OldKnight.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace OldKnight.Meta
{
    // POR QUE: a escolha de 1 entre 3 cartas depois de uma vitória (Parte 1
    // §7.3), mostrada no acampamento.
    // ESTRATÉGIA: lê as opções pendentes no save; cada botão chama
    // PartyRules.TakeCard. Pular limpa as opções. Fechar avisa quem abriu,
    // para o acampamento se redesenhar.
    public class CardRewardPanel : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private Button[] _choices = new Button[3];
        [SerializeField] private TMP_Text[] _labels = new TMP_Text[3];
        [SerializeField] private Button _skip;
        [SerializeField] private TMP_Text _note;

        private Action _onClose;

        private void Awake()
        {
            _root.SetActive(false);
            for (int i = 0; i < _choices.Length; i++)
            {
                int index = i;
                _choices[i].onClick.AddListener(() => Take(index));
            }
            _skip.onClick.AddListener(Skip);
        }

        // Abre o painel se houver escolha pendente.
        public void Open(Action onClose)
        {
            var session = GameSession.Instance;
            var save = session.Save;
            if (save.cardChoices.Count == 0) return;
            _onClose = onClose;
            for (int i = 0; i < _choices.Length; i++)
            {
                bool used = i < save.cardChoices.Count;
                _choices[i].gameObject.SetActive(used);
                if (!used) continue;
                var card = session.Database.Card(save.cardChoices[i]);
                _labels[i].text = card != null ? $"{card.displayName}\n{card.cost} de mana\n{card.description}" : "?";
            }
            _note.text = save.deck.Count >= PartyRules.DeckMax
                ? $"O deck está cheio ({PartyRules.DeckMax}). Remova uma carta no Deck antes."
                : $"Escolha uma carta para o deck da Bruxa ({save.deck.Count} cartas).";
            _root.SetActive(true);
        }

        // Pega a carta da posição `index`.
        private void Take(int index)
        {
            var session = GameSession.Instance;
            var save = session.Save;
            if (index >= save.cardChoices.Count || !PartyRules.TakeCard(save, save.cardChoices[index])) return;
            session.Persist();
            Close();
        }

        // Pula a escolha.
        private void Skip()
        {
            PartyRules.SkipCard(GameSession.Instance.Save);
            GameSession.Instance.Persist();
            Close();
        }

        private void Close()
        {
            _root.SetActive(false);
            _onClose?.Invoke();
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/DeckScreen.cs
using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace OldKnight.Meta
{
    // POR QUE: a tela de Deck da Bruxa (Parte 1 §7.3 e §11): ver as cartas
    // e remover uma por ouro.
    // ESTRATÉGIA: uma linha por carta, criada a partir de um prefab (um
    // Button com um texto filho). Tocar numa linha remove a carta pelo
    // preço atual; a lista é refeita depois de cada remoção.
    public class DeckScreen : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private Transform _list;
        [SerializeField] private Button _rowPrefab;
        [SerializeField] private TMP_Text _header;
        [SerializeField] private Button _close;

        private readonly List<Button> _rows = new List<Button>();
        private Action _onClose;

        private void Awake()
        {
            _root.SetActive(false);
            _close.onClick.AddListener(() =>
            {
                _root.SetActive(false);
                _onClose?.Invoke();
            });
        }

        // Abre a tela.
        public void Open(Action onClose)
        {
            _onClose = onClose;
            _root.SetActive(true);
            Rebuild();
        }

        // Refaz a lista com o deck e o preço atuais.
        private void Rebuild()
        {
            foreach (var row in _rows) Destroy(row.gameObject);
            _rows.Clear();
            var session = GameSession.Instance;
            var save = session.Save;
            int cost = PartyRules.RemoveCost(save);
            bool canRemove = save.deck.Count > PartyRules.DeckMin;
            _header.text = $"DECK DA BRUXA: {save.deck.Count} cartas (mín. {PartyRules.DeckMin}, máx. {PartyRules.DeckMax})\n" +
                           (canRemove ? $"Toque numa carta para remover por {cost} de ouro (você tem {save.gold})."
                                      : "O deck está no mínimo.");
            for (int i = 0; i < save.deck.Count; i++)
            {
                int index = i;
                var card = session.Database.Card(save.deck[i]);
                var row = Instantiate(_rowPrefab, _list);
                row.GetComponentInChildren<TMP_Text>().text = card != null ? $"{card.displayName}  ({card.cost})  {card.description}" : save.deck[i];
                row.interactable = canRemove && save.gold >= cost;
                row.onClick.AddListener(() => Remove(index));
                _rows.Add(row);
            }
        }

        // Remove uma carta e redesenha.
        private void Remove(int index)
        {
            var session = GameSession.Instance;
            if (!PartyRules.TryRemoveCard(session.Save, index)) return;
            session.Persist();
            Rebuild();
        }
    }
}
```

**`CampScreen.cs`**, quatro mudanças:

1. Campos novos:

   ```csharp
        [SerializeField] private Button _switchHero;
        [SerializeField] private Button _deck;
        [SerializeField] private DeckScreen _deckScreen;
        [SerializeField] private CardRewardPanel _cardReward;
   ```

2. No fim do `Start`:

   ```csharp
            _switchHero.onClick.AddListener(SwitchHero);
            _deck.onClick.AddListener(() => _deckScreen.Open(Refresh));
            _cardReward.Open(Refresh);   // só aparece se a última masmorra deixou uma escolha
   ```

3. Um método novo:

   ```csharp
        // Mostra o outro personagem: ele passa a ser quem entra primeiro em campo.
        private void SwitchHero()
        {
            var session = GameSession.Instance;
            session.Save.activeHero = PartyRules.PartnerId(session.Save);
            session.Persist();
            Refresh();
        }
   ```

4. No `Refresh`, depois de preencher o nome do herói, mostre quem entra primeiro e esconda o Deck no Cavaleiro:

   ```csharp
            _heroName.text += "  (entra primeiro)";
            _deck.gameObject.SetActive(session.Save.activeHero == PartyRules.WitchId);
   ```

   (use a variável da sessão que o `Refresh` já tem; se ele a chama de outro nome, ajuste).

**Montar na cena `Camp`:**

1. Ao lado do nome do herói, um **Button** `SwitchHero` ("TROCAR PERSONAGEM").
2. Um **Button** `Deck` ("DECK") perto do Mercado.
3. `DeckScreen`: painel em tela cheia com **Scroll View** (o **Content** com **Vertical Layout Group** e **Content Size Fitter** em **Preferred Size** é a **List**), `Header` no alto e `Close` ("VOLTAR"). Prefab `DeckRow`: **UI → Button - TextMeshPro**, `900 × 90`, texto à esquerda `28`.
4. `CardRewardPanel`: painel centralizado com 3 botões grandes (`300 × 420`, texto `28`), o `Note` acima e `Skip` ("PULAR") abaixo.
5. Ligue os quatro campos novos no **Camp Screen**.

### 🧪 Teste rápido
- **TROCAR PERSONAGEM** alterna entre o Cavaleiro e a Bruxa: atributos e preços são de cada um, o ouro é o mesmo. O botão **DECK** só aparece com a Bruxa.
- Compre Ataque para a Bruxa e entre: as cartas dela batem mais forte (o dano usa o ATK dela).
- Vença uma masmorra: ao voltar, o painel oferece 3 cartas. Pegue uma: o deck vai a 11.
- No **DECK**, remova uma carta: o ouro cai 100 e a próxima remoção custa 200. Com 8 cartas, as linhas ficam apagadas.

### ✅ Checkpoint da Fase 5
- Progressão por personagem, saldo único, gemas só no Cavaleiro.
- Deck salvo por id; escolha de carta depois da vitória; remoção com preço dobrando.
- Quem aparece no acampamento começa em campo.
- Commit: `feat: acampamento da dupla e deck`.

Próxima fase: **Fase 6 — Extras do app**.

---

# Parte 9 — Implementação Unity: Fase 6 (Extras do app)

> Objetivo desta fase: os dois sistemas do app que o Guerreiro original não tinha (Parte 1 §9.3 e §9.4). A **árvore de Souls** substitui o atributo Habilidade: libera os especiais do Cavaleiro e melhora a Bruxa. As **missões diárias** dão ouro.

**Conceitos novos:**
- **Tabela no código em vez de asset:** a árvore tem 8 nós fixos. Uma tabela `static readonly` em C# é mais simples de ler e testar do que 8 assets, e nada nela precisa de arte.
- **Virada do dia local:** as missões zeram quando a data local muda (`DateTime.Now.ToString("yyyy-MM-dd")`), como o Baú do Dia do Guerreiro.

### Etapa 6A — Árvore de Souls

**`SaveData.cs`**: acrescente a classe e o campo:

```csharp
    // POR QUE: o nível de um nó da árvore de um personagem.
    [Serializable]
    public class TreeLevel
    {
        public string heroId;
        public string node;
        public int level;
    }
```

```csharp
        // Árvore de Souls (Parte 1 §9.3).
        public List<TreeLevel> tree = new List<TreeLevel>();
```

**`HeroRun.cs`**: no `HeroLoadout`, os bônus da árvore (com valores neutros por padrão):

```csharp
        // Árvore de Souls (Parte 1 §9.3). Valores neutros fora dela.
        public int TreeSkills = -1;            // especiais liberados; -1 = usa a Habilidade do Guerreiro
        public double FuryBonus = 1.0;
        public int ComboMaxHits = 4;
        public double BladeBonus = 1.0;
        public double AreaBonus = 1.0;
```

E troque o `SkillsUnlocked`:

```csharp
        // Quantos especiais estão liberados: pela árvore, se houver; senão, pela Habilidade.
        public int SkillsUnlocked(int step) => UnlockAllSkills ? 99 : TreeSkills >= 0 ? TreeSkills : SkillLevel / step;
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/SkillTree.cs
using System.Collections.Generic;
using OldKnight.Combat;

namespace OldKnight.Meta
{
    // POR QUE: um nó da árvore de Souls.
    public sealed class TreeNode
    {
        public string Id;
        public string Name;
        public int Cost;
        public string Requires;
        public string Description;
    }

    // POR QUE: a árvore de Souls da Parte 1 §9.3: a do Cavaleiro é a do
    // Guerreiro do app; a da Bruxa é a proposta do GDD.
    // ESTRATÉGIA: tabela fixa por herói + regras puras de custo e compra
    // sobre o SaveData. `Apply` traduz os níveis em números do HeroLoadout;
    // é o único lugar que sabe o que cada nó faz.
    public static class SkillTree
    {
        public const int MaxLevel = 3;

        public static readonly IReadOnlyList<TreeNode> Knight = new List<TreeNode>
        {
            new TreeNode { Id = "fury", Name = "Fúria", Cost = 1, Description = "Libera o especial. +10% de dano por nível" },
            new TreeNode { Id = "combo", Name = "Combo", Cost = 2, Requires = "fury", Description = "Libera. Até 1 + nível golpes" },
            new TreeNode { Id = "blade", Name = "Lâmina Invisível", Cost = 3, Requires = "combo", Description = "Libera. +15% de dano por nível" },
            new TreeNode { Id = "seq", Name = "Sequência Mortal", Cost = 4, Requires = "blade", Description = "Libera. Janela maior: Em aberto" },
        };

        public static readonly IReadOnlyList<TreeNode> Witch = new List<TreeNode>
        {
            new TreeNode { Id = "font", Name = "Fonte", Cost = 1, Description = "+1 de mana máxima por nível" },
            new TreeNode { Id = "hand", Name = "Mão Leve", Cost = 2, Requires = "font", Description = "+1 carta na mão nos níveis 2 e 3" },
            new TreeNode { Id = "spark", Name = "Faísca Viva", Cost = 3, Requires = "hand", Description = "Cartas de área +10% por nível" },
            new TreeNode { Id = "coven", Name = "Coven", Cost = 4, Requires = "spark", Description = "+1 de mana no início da masmorra por nível" },
        };

        // Os nós de um personagem.
        public static IReadOnlyList<TreeNode> For(string heroId) => heroId == PartyRules.WitchId ? Witch : Knight;

        // Nível atual de um nó.
        public static int Level(SaveData save, string heroId, string node)
        {
            var entry = save.tree.Find(t => t.heroId == heroId && t.node == node);
            return entry != null ? entry.level : 0;
        }

        // Custo do próximo nível: custo do nó × (nível atual + 1).
        public static int Cost(SaveData save, string heroId, TreeNode node) => node.Cost * (Level(save, heroId, node.Id) + 1);

        // Dá para comprar o próximo nível?
        public static bool CanBuy(SaveData save, string heroId, TreeNode node)
        {
            if (Level(save, heroId, node.Id) >= MaxLevel) return false;
            if (node.Requires != null && Level(save, heroId, node.Requires) == 0) return false;
            return save.souls >= Cost(save, heroId, node);
        }

        // Compra o próximo nível com Souls.
        public static bool TryBuy(SaveData save, string heroId, TreeNode node)
        {
            if (!CanBuy(save, heroId, node)) return false;
            save.souls -= Cost(save, heroId, node);
            var entry = save.tree.Find(t => t.heroId == heroId && t.node == node.Id);
            if (entry == null) save.tree.Add(entry = new TreeLevel { heroId = heroId, node = node.Id });
            entry.level++;
            return true;
        }

        // Aplica a árvore ao loadout de um personagem.
        public static void Apply(SaveData save, string heroId, HeroLoadout loadout)
        {
            int Lv(string node) => Level(save, heroId, node);
            if (heroId == PartyRules.WitchId)
            {
                loadout.MaxMana += Lv("font");
                loadout.HandSize += System.Math.Max(0, Lv("hand") - 1);
                loadout.AreaBonus = 1.0 + 0.1 * Lv("spark");
                loadout.StartMana = Lv("coven");
                return;
            }
            // A cadeia é linear (fury → combo → blade → seq), então contar os
            // nós comprados dá os especiais na ordem do guia do Guerreiro.
            int unlocked = 0;
            foreach (var node in Knight) if (Lv(node.Id) > 0) unlocked++;
            loadout.TreeSkills = unlocked;
            loadout.FuryBonus = 1.0 + 0.1 * Lv("fury");
            loadout.ComboMaxHits = 1 + Lv("combo");
            loadout.BladeBonus = 1.0 + 0.15 * Lv("blade");
        }
    }
}
```

**`PartyRules.Loadout`**: antes do `return loadout;`, aplique a árvore:

```csharp
            SkillTree.Apply(save, hero.heroId, loadout);
```

**`WarriorTurn.cs`**: os bônus da árvore (Parte 1 §9.3, proposta). Três trocas:

1. Em `FurySpecial`, depois de `double mult = tier.Mult;`: `mult *= hero.Loadout.FuryBonus;`
2. Em `Combo`, troque `int hits = CombatMath.ComboHits(hero.Fury);` por:

   ```csharp
            int hits = System.Math.Min(CombatMath.ComboHits(hero.Fury), hero.Loadout.ComboMaxHits);
   ```

3. Em `InvisibleBlade`, troque as duas ocorrências de `CombatMath.BladeMult` (no `HeroStrike` e no `Strikes.Apply`) por `CombatMath.BladeMult * hero.Loadout.BladeBonus`.

**`WitchTurn.cs`**: o bônus de área. No `Resolve`, troque a linha do dano:

```csharp
                        int damage = WitchMath.Amount(witch.Attack, card.power,
                            card.target == CardTarget.All ? witch.Loadout.AreaBonus : 1.0);
```

**`CampScreen.cs`**: o atributo Habilidade sai (a árvore o substitui). Esconda o quarto botão de atributo: no `Start`, `_upgradeButtons[3].gameObject.SetActive(false);`.

```csharp
// Caminho: Assets/_Project/Scripts/Meta/SkillTreeScreen.cs
using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace OldKnight.Meta
{
    // POR QUE: a tela da árvore de Souls do personagem mostrado no
    // acampamento (Parte 1 §9.3).
    // ESTRATÉGIA: 4 botões fixos, um por nó, na ordem da cadeia. Cada um
    // mostra nome, nível, efeito e custo; trancado, diz o que falta.
    public class SkillTreeScreen : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private Button[] _nodes = new Button[4];
        [SerializeField] private TMP_Text[] _labels = new TMP_Text[4];
        [SerializeField] private TMP_Text _souls;
        [SerializeField] private Button _close;

        private Action _onClose;

        private void Awake()
        {
            _root.SetActive(false);
            for (int i = 0; i < _nodes.Length; i++)
            {
                int index = i;
                _nodes[i].onClick.AddListener(() => Buy(index));
            }
            _close.onClick.AddListener(() =>
            {
                _root.SetActive(false);
                _onClose?.Invoke();
            });
        }

        // Abre a árvore de quem está no acampamento.
        public void Open(Action onClose)
        {
            _onClose = onClose;
            _root.SetActive(true);
            Refresh();
        }

        // Compra o próximo nível de um nó.
        private void Buy(int index)
        {
            var session = GameSession.Instance;
            string heroId = session.Save.activeHero;
            if (!SkillTree.TryBuy(session.Save, heroId, SkillTree.For(heroId)[index])) return;
            session.Persist();
            Refresh();
        }

        // Redesenha níveis, custos e trancas.
        private void Refresh()
        {
            var save = GameSession.Instance.Save;
            string heroId = save.activeHero;
            var nodes = SkillTree.For(heroId);
            _souls.text = $"SOULS {save.souls}";
            for (int i = 0; i < _nodes.Length; i++)
            {
                var node = nodes[i];
                int level = SkillTree.Level(save, heroId, node.Id);
                bool locked = node.Requires != null && SkillTree.Level(save, heroId, node.Requires) == 0;
                string price = level >= SkillTree.MaxLevel ? "MÁXIMO"
                    : locked ? "trancado" : $"{SkillTree.Cost(save, heroId, node)} Souls";
                _labels[i].text = $"{node.Name}  Nv.{level}/{SkillTree.MaxLevel}\n{node.Description}\n{price}";
                _nodes[i].interactable = SkillTree.CanBuy(save, heroId, node);
            }
        }
    }
}
```

**Montar:** na cena `Camp`, um **Button** `Tree` ("ÁRVORE") e o painel `SkillTreeScreen` (4 botões em coluna, `Souls` no alto, `Close`). No `CampScreen`, um campo `[SerializeField] private SkillTreeScreen _treeScreen;` e `[SerializeField] private Button _tree;`, e no `Start`: `_tree.onClick.AddListener(() => _treeScreen.Open(Refresh));`.

### 🧪 Teste rápido
Com Souls no save (ganhe uma masmorra, ou edite o save no modo **Debug** do Inspector):
- No Cavaleiro, compre **Fúria**: na masmorra, o botão ESPECIAL mostra só FÚRIA. Compre **Combo** e ele aparece também.
- Na Bruxa, **Fonte** Nv.1 muda a mana para `x/5`; **Coven** Nv.1 faz a primeira vaga começar com 1 de mana a mais.

### Etapa 6B — Missões diárias

**`SaveData.cs`**: acrescente:

```csharp
    // POR QUE: o progresso de uma missão diária no dia.
    [Serializable]
    public class QuestProgress
    {
        public string id;
        public int value;
        public bool claimed;
    }
```

```csharp
        // Missões diárias (Parte 1 §9.4): o dia e o progresso de cada uma.
        public string questDay = "";
        public List<QuestProgress> quests = new List<QuestProgress>();
```

**`BattleContext.cs`**: as missões precisam de dois números que o resumo da masmorra não tinha. No `BattleEnd`, acrescente `public int CleanKills;` e `public bool BossKilled;`. No `BattleContext`, acrescente `public int CleanKills;`.

**`BattleController.cs`**: conte os monstros mortos em ondas sem dano.

1. No `RunDungeon`, logo antes de `var outcome = await FightWave(token);`:

   ```csharp
                int hpBefore = PartyHp();
   ```

2. Logo depois de `if (outcome.HasValue) return End(outcome.Value);`:

   ```csharp
                // Missão "Intocável": monstros de uma onda vencida sem nenhum dano na dupla.
                if (PartyHp() >= hpBefore) Context.CleanKills += Context.Monsters.Count;
   ```

3. Um método novo:

   ```csharp
        // HP somado da dupla.
        private int PartyHp()
        {
            int sum = 0;
            foreach (var member in Context.Party.Members) sum += member.Hp;
            return sum;
        }
   ```

4. No `End`, acrescente `CleanKills = Context.CleanKills,` e `BossKilled = kind == DungeonOutcomeKind.Victory,`.

> Uma Poção de Cura no meio da onda pode esconder um dano. Está aceito: é uma aproximação, e no app a missão também é contada por onda.

```csharp
// Caminho: Assets/_Project/Scripts/Meta/QuestRules.cs
using System.Collections.Generic;
using OldKnight.Battle;

namespace OldKnight.Meta
{
    // POR QUE: uma missão diária.
    public sealed class QuestDefinition
    {
        public string Id;
        public string Name;
        public string Description;
        public int Goal;
        public int Gold;
    }

    // POR QUE: as missões diárias da Parte 1 §9.4 (as 5 do app e a da dupla).
    // ESTRATÉGIA: tabela fixa + regras puras sobre o SaveData. `Today` zera
    // tudo quando a data muda. `Record` soma o resultado de uma masmorra em
    // cada missão; `Claim` paga o ouro uma vez.
    public static class QuestRules
    {
        public static readonly IReadOnlyList<QuestDefinition> All = new List<QuestDefinition>
        {
            new QuestDefinition { Id = "bosses", Name = "Caçador de Chefões", Description = "Vença 5 chefões", Goal = 5, Gold = 600 },
            new QuestDefinition { Id = "slay", Name = "Intocável", Description = "Derrote 30 monstros sem levar dano na onda", Goal = 30, Gold = 800 },
            new QuestDefinition { Id = "gold", Name = "Cofre Cheio", Description = "Conquiste 10.000 moedas", Goal = 10000, Gold = 1000 },
            new QuestDefinition { Id = "souls", Name = "Ceifador de Almas", Description = "Conquiste 10 Souls", Goal = 10, Gold = 1200 },
            new QuestDefinition { Id = "perfect", Name = "Impecável", Description = "Vença 3 masmorras sem sofrer dano", Goal = 3, Gold = 1500 },
            new QuestDefinition { Id = "swaps", Name = "Troca Perfeita", Description = "Troque 10 vezes e vença a masmorra", Goal = 1, Gold = 800 },
        };

        // Garante que o progresso é de hoje (zera na virada do dia).
        public static void Today(SaveData save, string today)
        {
            if (save.questDay == today) return;
            save.questDay = today;
            save.quests.Clear();
            foreach (var quest in All) save.quests.Add(new QuestProgress { id = quest.Id });
        }

        // Soma uma masmorra terminada. `goldEarned` e `soulsEarned` vêm do acampamento.
        public static void Record(SaveData save, string today, BattleEnd end, int goldEarned, int soulsEarned)
        {
            Today(save, today);
            bool victory = end.Kind == DungeonOutcomeKind.Victory;
            Add(save, "bosses", end.BossKilled ? 1 : 0);
            Add(save, "slay", end.CleanKills);
            Add(save, "gold", goldEarned);
            Add(save, "souls", soulsEarned);
            Add(save, "perfect", victory && end.Flawless ? 1 : 0);
            Add(save, "swaps", victory && end.Swaps >= 10 ? 1 : 0);
        }

        // O progresso de uma missão (nunca passa da meta).
        public static int Progress(SaveData save, QuestDefinition quest)
        {
            var p = save.quests.Find(q => q.id == quest.Id);
            return p == null ? 0 : System.Math.Min(quest.Goal, p.value);
        }

        // Já foi paga hoje?
        public static bool Claimed(SaveData save, QuestDefinition quest)
        {
            var p = save.quests.Find(q => q.id == quest.Id);
            return p != null && p.claimed;
        }

        // Paga a missão cumprida. Devolve o ouro pago (0 se não deu).
        public static int Claim(SaveData save, string today, QuestDefinition quest)
        {
            Today(save, today);
            var p = save.quests.Find(q => q.id == quest.Id);
            if (p == null || p.claimed || p.value < quest.Goal) return 0;
            p.claimed = true;
            save.gold += quest.Gold;
            return quest.Gold;
        }

        // Soma `amount` numa missão.
        private static void Add(SaveData save, string id, int amount)
        {
            if (amount <= 0) return;
            var p = save.quests.Find(q => q.id == id);
            if (p != null) p.value += amount;
        }
    }
}
```

**`GameSession.FinishDungeon`**: registre a masmorra nas missões **antes** do `ApplyOutcome` mudar o ouro e as Souls. Troque o começo do método:

```csharp
            var knight = MetaRules.Progress(Save, PartyRules.KnightId);
            int goldBefore = Save.gold;
            int soulsBefore = Save.souls;
            MetaRules.ApplyOutcome(Save, knight, outcome, _database.balance, _rng);
            QuestRules.Record(Save, DateTime.Now.ToString("yyyy-MM-dd"), outcome.End,
                System.Math.Max(0, Save.gold - goldBefore), System.Math.Max(0, Save.souls - soulsBefore + outcome.End.SoulsUsed));
```

(As Souls gastas para reviver são somadas de volta, para a missão contar só as ganhas.)

```csharp
// Caminho: Assets/_Project/Scripts/Meta/QuestScreen.cs
using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace OldKnight.Meta
{
    // POR QUE: a lista de missões diárias no acampamento, com o botão de
    // resgatar (Parte 1 §9.4).
    // ESTRATÉGIA: 6 linhas fixas, uma por missão da tabela. O botão de cada
    // uma só acende com a meta cumprida e ainda não paga.
    public class QuestScreen : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private TMP_Text[] _labels = new TMP_Text[6];
        [SerializeField] private Button[] _claims = new Button[6];
        [SerializeField] private Button _close;

        private Action _onClose;

        private static string Today => DateTime.Now.ToString("yyyy-MM-dd");

        private void Awake()
        {
            _root.SetActive(false);
            for (int i = 0; i < _claims.Length; i++)
            {
                int index = i;
                _claims[i].onClick.AddListener(() => Claim(index));
            }
            _close.onClick.AddListener(() =>
            {
                _root.SetActive(false);
                _onClose?.Invoke();
            });
        }

        // Abre a lista.
        public void Open(Action onClose)
        {
            _onClose = onClose;
            QuestRules.Today(GameSession.Instance.Save, Today);
            _root.SetActive(true);
            Refresh();
        }

        // Resgata uma missão.
        private void Claim(int index)
        {
            var session = GameSession.Instance;
            if (QuestRules.Claim(session.Save, Today, QuestRules.All[index]) <= 0) return;
            session.Persist();
            Refresh();
        }

        // Redesenha progresso e botões.
        private void Refresh()
        {
            var save = GameSession.Instance.Save;
            for (int i = 0; i < _labels.Length && i < QuestRules.All.Count; i++)
            {
                var quest = QuestRules.All[i];
                int progress = QuestRules.Progress(save, quest);
                bool claimed = QuestRules.Claimed(save, quest);
                _labels[i].text = $"{quest.Name}: {quest.Description}\n{progress}/{quest.Goal}  ·  {quest.Gold} de ouro";
                _claims[i].interactable = progress >= quest.Goal && !claimed;
                _claims[i].GetComponentInChildren<TMP_Text>().text = claimed ? "PAGO" : "RESGATAR";
            }
        }
    }
}
```

**Montar:** na cena `Camp`, um **Button** `Quests` ("MISSÕES") e o painel `QuestScreen` (6 linhas com texto e botão "RESGATAR", e `Close`). No `CampScreen`, campos `_questScreen` e `_quests` e, no `Start`, `_quests.onClick.AddListener(() => _questScreen.Open(Refresh));`.

### 🧪 Teste rápido
Vença uma masmorra e abra **MISSÕES**: "Caçador de Chefões" está em 1/5, e "Cofre Cheio" somou o ouro da vitória. Troque a data do computador para o dia seguinte e abra de novo: tudo zerou.

### ✅ Checkpoint da Fase 6
- Árvore de Souls dos dois, com custo crescente e cadeia de pré-requisitos; Habilidade escondida.
- Bônus de Fúria, Combo, Lâmina e área aplicados; mana e mão da Bruxa crescendo com a árvore.
- Missões diárias com progresso, resgate e virada do dia.
- Commit: `feat: árvore de Souls e missões diárias`.

#### Problemas comuns
- **O ESPECIAL mostra os quatro especiais sem ter comprado nada:** o `BattleTestStarter` usa **Skill Level** `20`, que vale quando `TreeSkills` é `-1` (sem árvore). Pelo acampamento, a árvore manda.
- **A missão "Ceifador de Almas" não anda:** a vitória dá Souls dentro do `ApplyOutcome`; o `Record` precisa vir **depois** dele, como no código acima.

Próxima fase: **Fase 7 — Testes automáticos**.

---

# Parte 10 — Implementação Unity: Fase 7 (Testes automáticos)

> Objetivo desta fase: as regras novas (dupla, fila, deck, mana, acampamento, árvore e missões) cobertas por testes que rodam sem cena, ao lado dos testes herdados do Guerreiro.

Os assemblies e o `ScriptedRandom` são os da Fase 8 do Guerreiro (com os nomes trocados na Etapa 1A). Com a fila vazia, o `ScriptedRandom` devolve sempre o mínimo: o embaralhar do `WitchDeck` fica previsível, e as rolagens da fila ficam todas em `+0`.

```csharp
// Caminho: Assets/_Project/Tests/PartyTests.cs
using System.Collections.Generic;
using System.Linq;
using OldKnight.Combat;
using OldKnight.Data;
using NUnit.Framework;
using static OldKnight.Tests.TestData;

namespace OldKnight.Tests
{
    // POR QUE: a dupla (Parte 1 §4): troca, reserva caída, poções
    // compartilhadas, ouro somado, mana no lugar da Fúria e a fila de cada um.
    public class PartyTests
    {
        private static HeroRun Knight() => new HeroRun(HeroLoadout.Fresh(Db.Hero("knight")), B);
        private static HeroRun Witch() => new HeroRun(HeroLoadout.Fresh(Db.Hero("witch")), B);

        [Test]
        public void TrocaPoeOOutroEmCampoEZeraAGuardaDeQuemEntra()
        {
            var knight = Knight();
            var witch = Witch();
            witch.Stagger = 2;
            var party = new PartyRun(knight, witch);
            Assert.AreSame(knight, party.Active);
            Assert.IsTrue(party.Swap());
            Assert.AreSame(witch, party.Active);
            Assert.AreEqual(0, witch.Stagger);
            Assert.AreEqual(1, party.Swaps);
        }

        [Test]
        public void NaoTrocaComAReservaCaida()
        {
            var witch = Witch();
            witch.Hp = 0;
            var party = new PartyRun(Knight(), witch);
            Assert.IsFalse(party.CanSwap);
            Assert.IsFalse(party.Swap());
            Assert.IsFalse(party.AllDead);
        }

        [Test]
        public void PocoesSaoDaDupla()
        {
            var knight = Knight();
            var witch = Witch();
            var party = new PartyRun(knight, witch);
            knight.Potions--;
            Assert.AreEqual(knight.Potions, witch.Potions);
            Assert.AreEqual(B.potionsPerRun - 1, party.Reserve.Potions);
        }

        [Test]
        public void OuroSomaEPerfeitaPedeOsDois()
        {
            var knight = Knight();
            var witch = Witch();
            var party = new PartyRun(knight, witch);
            knight.RunGold = 10;
            witch.RunGold = 5;
            Assert.AreEqual(15, party.RunGold);
            witch.TakeDamage(1);
            Assert.IsFalse(party.Flawless);
        }

        [Test]
        public void NaBruxaFuriaViraMana()
        {
            var witch = Witch();
            for (int i = 0; i < 10; i++) witch.GainFury();
            Assert.AreEqual(0, witch.Fury);
            Assert.AreEqual(witch.Loadout.MaxMana, witch.Mana);
        }

        [Test]
        public void BruxaTemDuasVagasECavaleiroUma()
        {
            var none = new List<Monster>();
            var witchQueue = Initiative.Roll(none, Db.Hero("witch"), new ScriptedRandom(), B);
            var knightQueue = Initiative.Roll(none, Db.Hero("knight"), new ScriptedRandom(), B);
            Assert.AreEqual(2, witchQueue.Count(s => s.IsHero));
            Assert.AreEqual(1, knightQueue.Count(s => s.IsHero));
        }

        [Test]
        public void CavaleiroLentoAgeDepoisDoServo()
        {
            var monsters = new List<Monster> { Monster("pawn") };   // velocidade 12
            var queue = Initiative.Roll(monsters, Db.Hero("knight"), new ScriptedRandom(), B);
            Assert.IsFalse(queue[0].IsHero);
            Assert.IsTrue(queue[1].IsHero);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/WitchDeckTests.cs
using System.Collections.Generic;
using System.Linq;
using OldKnight.Combat;
using OldKnight.Data;
using OldKnight.Meta;
using NUnit.Framework;
using static OldKnight.Tests.TestData;

namespace OldKnight.Tests
{
    // POR QUE: o deck e a mana da Bruxa (Parte 1 §7) e as regras do
    // acampamento da dupla, da árvore e das missões (§7.3, §9.3, §9.4).
    public class WitchDeckTests
    {
        private static List<CardDefinition> Starter => Db.starterDeck;

        [Test]
        public void CompraAteAMaoEncher()
        {
            var deck = new WitchDeck(Starter, new ScriptedRandom());
            Assert.AreEqual(4, deck.DrawUpTo(4));
            Assert.AreEqual(4, deck.Hand.Count);
            Assert.AreEqual(Starter.Count - 4, deck.DrawPile.Count);
        }

        [Test]
        public void MonteVazioEmbaralhaODescarte()
        {
            var three = Starter.Take(3).ToList();
            var deck = new WitchDeck(three, new ScriptedRandom());
            deck.DrawUpTo(3);
            for (int i = 0; i < 3; i++) deck.Play(0);
            Assert.AreEqual(3, deck.Discard.Count);
            Assert.IsTrue(deck.Draw());
            Assert.AreEqual(0, deck.Discard.Count);
            Assert.AreEqual(2, deck.DrawPile.Count);
        }

        [Test]
        public void SemCartasNaoCompra()
        {
            var deck = new WitchDeck(new List<CardDefinition>(), new ScriptedRandom());
            Assert.IsFalse(deck.Draw());
        }

        [Test]
        public void ManaETrocaDecidemSeACartaSai()
        {
            var embers = Db.Card("embers");     // custo 1
            var swapstep = Db.Card("swapstep"); // troca
            Assert.IsFalse(WitchMath.CanPlay(embers, 0, true, true));
            Assert.IsTrue(WitchMath.CanPlay(embers, 1, true, true));
            Assert.IsFalse(WitchMath.CanPlay(swapstep, 4, false, false));
        }

        [Test]
        public void DanoDeCartaIgnoraDefEValePeloMenos1()
        {
            Assert.AreEqual(4, WitchMath.Amount(8, 0.5f));
            Assert.AreEqual(1, WitchMath.Amount(1, 0.1f));
            Assert.AreEqual(4, WitchMath.Amount(8, 0.5f, 1.1));   // 4,4 → 4
        }

        [Test]
        public void RemoverCartaDobraOPrecoEParaNoMinimo()
        {
            var save = MetaRules.NewGame(Db, new ScriptedRandom());
            PartyRules.EnsureDeck(save, Db);
            save.gold = 10000;
            Assert.AreEqual(100, PartyRules.RemoveCost(save));
            Assert.IsTrue(PartyRules.TryRemoveCard(save, 0));
            Assert.AreEqual(200, PartyRules.RemoveCost(save));
            Assert.IsTrue(PartyRules.TryRemoveCard(save, 0));
            Assert.AreEqual(PartyRules.DeckMin, save.deck.Count);
            Assert.IsFalse(PartyRules.TryRemoveCard(save, 0));
        }

        [Test]
        public void SoPegaCartaQueFoiOferecida()
        {
            var save = MetaRules.NewGame(Db, new ScriptedRandom());
            PartyRules.EnsureDeck(save, Db);
            PartyRules.RollCardReward(save, Db, new ScriptedRandom());
            Assert.AreEqual(3, save.cardChoices.Count);
            Assert.IsFalse(PartyRules.TakeCard(save, "nao-existe"));
            Assert.IsTrue(PartyRules.TakeCard(save, save.cardChoices[0]));
            Assert.AreEqual(11, save.deck.Count);
            Assert.AreEqual(0, save.cardChoices.Count);
        }

        [Test]
        public void ArvoreTemCustoCrescenteEPreRequisito()
        {
            var save = MetaRules.NewGame(Db, new ScriptedRandom());
            save.souls = 10;
            var fury = SkillTree.Knight[0];
            var combo = SkillTree.Knight[1];
            Assert.IsFalse(SkillTree.CanBuy(save, "knight", combo));
            Assert.IsTrue(SkillTree.TryBuy(save, "knight", fury));
            Assert.AreEqual(2, SkillTree.Cost(save, "knight", fury));
            Assert.IsTrue(SkillTree.CanBuy(save, "knight", combo));
            Assert.AreEqual(9, save.souls);
        }

        [Test]
        public void ArvoreDaBruxaMexeNaMana()
        {
            var save = MetaRules.NewGame(Db, new ScriptedRandom());
            save.souls = 10;
            SkillTree.TryBuy(save, "witch", SkillTree.Witch[0]);
            var loadout = HeroLoadout.Fresh(Db.Hero("witch"));
            SkillTree.Apply(save, "witch", loadout);
            Assert.AreEqual(Db.Hero("witch").maxMana + 1, loadout.MaxMana);
        }

        [Test]
        public void MissaoZeraNoDiaSeguinteEPagaUmaVez()
        {
            var save = MetaRules.NewGame(Db, new ScriptedRandom());
            var bosses = QuestRules.All[0];
            QuestRules.Today(save, "2026-01-01");
            for (int i = 0; i < 5; i++)
                QuestRules.Record(save, "2026-01-01", new Battle.BattleEnd { Kind = Battle.DungeonOutcomeKind.Victory, BossKilled = true }, 0, 0);
            int gold = save.gold;
            Assert.AreEqual(600, QuestRules.Claim(save, "2026-01-01", bosses));
            Assert.AreEqual(0, QuestRules.Claim(save, "2026-01-01", bosses));
            Assert.AreEqual(gold + 600, save.gold);
            QuestRules.Today(save, "2026-01-02");
            Assert.AreEqual(0, QuestRules.Progress(save, bosses));
        }
    }
}
```

### 🧪 Teste rápido
**Window → General → Test Runner → EditMode → Run All**. Todos verdes: os do Guerreiro e os 17 novos.

### ✅ Checkpoint da Fase 7
- `PartyTests` e `WitchDeckTests` passam.
- Os testes herdados continuam passando (eles usam o `WarriorDef()` da Etapa 1B).
- Commit: `test: dupla, deck, árvore e missões`.

#### Problemas comuns
- **`ArgumentException: Herói desconhecido: knight`:** os dados não foram recriados depois da Etapa 1B. Rode **OKW → Criar ou atualizar dados iniciais**.
- **`CavaleiroLentoAgeDepoisDoServo` falha:** o asset `knight` não tem **Speed** `6`. Rode o seeder de novo.

Próxima fase: **Fase 8 — Build, anúncios e próximos passos**.

---

# Parte 11 — Implementação Unity: Fase 8 (Build, anúncios e próximos passos)

> Objetivo desta fase: o jogo rodando no celular Android, em retrato, com os anúncios da Parte 1 §13.

### 8.1 Anúncios

Siga a Fase 9 do Guerreiro (`GuerreiroDaMasmorra.md`, Parte 12) só na parte dos **anúncios** (`ProviderAds`): intersticial a cada 5 entradas (o `GameSession` já chama), vídeo premiado para dobrar o bônus e para o Baú do Dia. A **nuvem** (`CloudSave`) fica de fora: login e save na nuvem estão **Em aberto** (Parte 1 §13).

### 8.2 Build de Android

1. **File → Build Profiles → Android → Switch Platform**.
2. **Player Settings:**
   - **Company Name** e **Product Name** (`Old Knight and the Witch`);
   - **Default Orientation** `Portrait`;
   - **Other Settings → Scripting Backend** `IL2CPP`, **Target Architectures** `ARM64`;
   - **Minimum API Level**: o que o pacote de anúncios pedir.
3. **Graphics:** o nível de qualidade **Mobile** (Etapa 0B). Se o celular de teste esquentar ou cair abaixo de 30 fps:
   - baixe **Shadow Resolution** no `Mobile_RPAsset` para `512`;
   - deixe **Per Object Limit** das luzes adicionais em `2`;
   - aumente o `torchEvery` dos biomas interiores.
4. **Build And Run** com o celular ligado por USB, com a depuração USB ativada.

### 🧪 Teste rápido
No celular: o acampamento abre em retrato; a masmorra mostra o corredor iluminado sem travar; os gestos (tocar, arrastar para cima e para baixo, deslizar para os lados) funcionam no QTE; segurar uma carta a joga.

### ✅ Checkpoint da Fase 8
- APK instalado e jogável do acampamento à masmorra 3.
- Intersticial na 5ª entrada; vídeo premiado no fim da masmorra e no baú.
- Commit: `chore: build Android`.

### 8.3 Próximos passos

- **Protótipo web antes do Android (Parte 1 §1):** o jogo pode ser testado primeiro no navegador. Há dois caminhos: a build **WebGL** deste projeto (o módulo instalado na Etapa 0A) ou um protótipo em HTML e JS no repositório de GDDs. O protótipo seria uma cópia do `prototipos/guerreiro-da-masmorra-app-3d/` com a dupla e as cartas; a decisão de qual usar está **Em aberto**.
- **Arte:** gerar no PixelLab a dupla, o elenco e os objetos de cena (Parte 1 §10) e preencher o `VisualCatalog`, os biomas e os retratos do `PartyHud`.
- **Balanceamento:** todos os números marcados como **proposta** na Parte 1 dependem do playtest. Isso vale principalmente para a velocidade do Cavaleiro, as 2 vagas da Bruxa, a mana e o custo das cartas.
- **Itens Em aberto da Parte 1 §15:** nomes e história, bônus de troca, cartas raras e evolução, gemas da Bruxa, áudio, nuvem.

---
*Versão: rascunho inicial. A refinar com o protótipo.*
