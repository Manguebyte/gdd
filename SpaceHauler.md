# GDD — Space Hauler

> Documento vivo. Rascunho inicial: o conceito está fechado nas linhas gerais (tower defense em que a "torre" é uma nave de carga que voa sozinha de um planeta a outro), mas os números de balanceamento ainda não foram decididos. Os valores da tabela §16 e do Guia de Implementação Unity (Parte 2 em diante) são **placeholders de MVP**, não decisões fechadas.
>
> **De onde vem este jogo.** **Definido:** o Space Hauler é um **jogo separado**, derivado do [Fury Hauler](FuryHauler.md): troca o caminhão de guerra no deserto por uma nave de carga no espaço. Ele tem GDD, glossário ([`contexts/space-hauler/CONTEXT.md`](contexts/space-hauler/CONTEXT.md)), protótipo e save próprios. Os dois documentos evoluem sozinhos: uma mudança num jogo não vale para o outro.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Unity](#parte-2--guia-de-implementação-unity)
3. [Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-3--implementação-unity-fase-0-setup-do-projeto)
4. [Parte 4 — Implementação Unity: Fase 1 (Espaço Isométrico)](#parte-4--implementação-unity-fase-1-espaço-isométrico)
5. [Parte 5 — Implementação Unity: Fase 2 (Nave e Trecho)](#parte-5--implementação-unity-fase-2-nave-e-trecho)
6. [Parte 6 — Implementação Unity: Fase 3 (Inimigos e Asteroides)](#parte-6--implementação-unity-fase-3-inimigos-e-asteroides)
7. [Parte 7 — Implementação Unity: Fase 4 (Defesas)](#parte-7--implementação-unity-fase-4-defesas)
8. [Parte 8 — Implementação Unity: Fase 5 (Sucata, Alocação e Carenagem)](#parte-8--implementação-unity-fase-5-sucata-alocação-e-carenagem)
9. [Parte 9 — Implementação Unity: Fase 6 (Habilidades Ativas)](#parte-9--implementação-unity-fase-6-habilidades-ativas)
10. [Parte 10 — Implementação Unity: Fase 7 (Run Roguelite, Estação e Save)](#parte-10--implementação-unity-fase-7-run-roguelite-estação-e-save)
11. [Parte 11 — Implementação Unity: Fase 8 (Build Web e Próximos Passos)](#parte-11--implementação-unity-fase-8-build-web-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Nome:** **Definido:** *Space Hauler* (nome de trabalho; pode mudar).
- **Gênero:** **Definido:** tower defense em movimento com estrutura **roguelite**. No lugar da torre fixa há uma **nave de carga**. O objetivo é levá-la inteira do **planeta de origem (A)** ao **planeta de destino (B)**.
- **Dimensão:** **Definido:** 2.5D. A lógica do jogo roda num plano 2D (o plano da rota, em metros) e a arte é desenhada em perspectiva isométrica. Não há física 3D. Ninguém sobe nem desce: todos voam no mesmo plano.
- **Câmera/perspectiva:** **Definido:** isométrica, seguindo a nave (a mesma do Fury Hauler).
- **Plataforma-alvo:** **Definido:** Web (navegador), jogado com mouse.
- **Referências:** **Definido:**
  - *Fury Hauler*: a estrutura inteira (nave que anda sozinha, defesas em pontos fixos, sucata em tempo real, mapa de rota).
  - *FTL*: cuidar de uma nave sob ataque e escolher a rota entre estações e setores perigosos.
  - *Kingdom Rush* / *Bloons TD*: comprar e melhorar defesas com moeda ganha na partida.
  - *Vampire Survivors*: armas que atiram sozinhas contra hordas.
- **Pilar de design:** **Em aberto**. Proposta para discutir, não decidida: *"Você não pilota, você arma: a nave segue de qualquer jeito, e cada sucata vira uma decisão de qual lado proteger."*
- **Fantasia central:** ser o artilheiro-chefe de uma nave de carga lenta, cercada por piratas, escolhendo em tempo real onde montar cada arma e quando reforçar o casco.
- **Em aberto:** a **especiaria** (uma carga preciosa, no espírito de *Duna*) ficou de fora por enquanto. Uma ideia para o futuro: a carga como pontuação e como moeda ao mesmo tempo, em que gastar para sobreviver diminui o que se entrega.

## 2. Loop Principal

**Definido:**

1. Uma **run** é uma viagem do planeta de origem ao planeta de destino, dividida em **trechos**.
2. Antes de cada trecho, o jogador escolhe o próximo nó num **mapa de rota com bifurcações** (§8). Cada nó é um **tipo de trecho** (com seu padrão de ataque) ou uma **Estação**.
3. Durante o trecho, a nave **voa sozinha**: o jogador **não controla** direção nem velocidade.
4. Piratas atacam. As defesas montadas nos **hardpoints** da nave **miram e atiram sozinhas**, cada uma só para o seu lado (§3, §4).
5. Inimigos derrubados soltam **sucata**, usada **em tempo real** para comprar, trocar e melhorar defesas e para comprar **Carenagem** (§5).
6. O jogador também tem **habilidades ativas com cooldown** (§6).
7. Se a nave chegar ao fim do último trecho, a run é vencida. Se for destruída, a run acaba e **recomeça do zero**, mantendo só os **desbloqueios permanentes** (§10).

## 3. A Nave

- **Definido:** a nave é a "torre" do tower defense. Ela voa sozinha pela rota, do começo ao fim do trecho, e o jogador não tem nenhum controle de movimento.
- **Definido:** a nave tem **casco** (os pontos de vida). Casco zero acaba a run.
- **Definido:** as defesas são montadas em **6 hardpoints fixos na própria nave** e viajam com ela: **1 na proa** (frente), **1 na popa** (trás), **2 a bombordo** (lado esquerdo) e **2 a estibordo** (lado direito). Os **casulos de armas** (anexos, abaixo) acrescentam mais hardpoints durante a run.
- **Definido:** cada hardpoint **só atira dentro do seu arco de tiro**: a proa para a frente, a popa para trás, e os laterais para o próprio lado. **Nenhum hardpoint cobre 360°.** Com ataques vindo de todos os lados (§8), o jogador sempre fica com um lado mais fraco, e a decisão "qual arma vai em qual hardpoint" é o centro do jogo. Placeholder: os 6 arcos têm 180°.
- **Definido:** o casco **não se recupera sozinho** entre trechos. Ele só é reparado na **Estação** (§9), pagando sucata.
- **Definido: Carenagem.** É um **upgrade da própria nave**, fora dos hardpoints, comprado **em níveis com sucata**, a qualquer momento da run (inclusive no meio de um trecho e na Estação). Cada nível **aumenta o casco máximo** e **reduz o dano de colisão** (asteroides e drones kamikaze). É a escolha "blindar" contra o "armar" dos hardpoints, e é o que torna o Cinturão de asteroides sobrevivível (§8).
- **Definido: Anexos.** São **módulos presos à nave**, fora dos hardpoints, comprados com sucata a qualquer momento da run (como a Carenagem) e mantidos até o fim dela. Os do MVP:
  - **Gerador de escudo:** um **escudo de energia** que absorve o dano **antes do casco**: tiros, drones e asteroides. Não segura os **piratas a bordo** (eles já estão dentro dele). Recarrega sozinho depois de alguns segundos sem levar dano e enche no começo de cada trecho. É comprado em níveis; cada nível aumenta o escudo.
  - **Casulos de armas:** cada casulo acrescenta **2 hardpoints** novos, um de cada lado da nave. O **dianteiro** fica nas diagonais da frente (atira para a frente e para o lado) e o **traseiro** nas diagonais de trás (para trás e para o lado). Os novos hardpoints seguem as mesmas regras dos outros: arco limitado, uma defesa cada, podem ser sabotados.
- **Definido: Piloto.** É um **upgrade da tripulação**, em níveis, comprado com sucata a qualquer momento da run. Cada nível faz a nave **voar mais rápido** e faz o piloto **desviar sozinho dos asteroides** que estão no caminho, deslizando para o lado. **O jogador continua sem controlar a nave**: quem desvia é o piloto. Voar mais rápido também tem um custo: o trecho acaba mais cedo, então aparecem menos inimigos e sobra menos sucata. Os piratas acompanham a nova velocidade de cruzeiro (§7).
- **Em aberto:**
  - O número de níveis e os valores de cada nível. Placeholder: 5 níveis; cada um custa 50 × nível, dá +50 de casco máximo (e cura os mesmos 50) e −12% de dano de colisão.
  - Números do escudo, dos casulos e do Piloto (placeholders em §16).
  - Se existem outros anexos (ex.: torre de reparo, sensor de inimigos fora da tela) e se algum anexo ocupa espaço (um limite de anexos por nave).
  - Se o Piloto também desvia de drones kamikaze ou só de asteroides (placeholder: só asteroides).
  - Se existem várias naves para escolher.
  - Se os arcos de tiro podem ter tamanhos diferentes por hardpoint (ex.: a proa com 120°).

## 4. Defesas

**Definido:** as defesas **miram e atiram sozinhas** no inimigo mais próximo que estiver ao alcance **e dentro do arco do hardpoint**. O papel do jogador é escolher **qual** defesa vai em **qual** hardpoint e **quando** melhorar.

**Definido:** defesas do MVP:

| Defesa | Papel |
|---|---|
| **Autocanhão** | Tiro rápido, dano baixo, um alvo por vez. A defesa "padrão". |
| **Canhão de plasma** | Cone curto com dano contínuo em todos dentro dele. Bom contra quem encosta na nave. |
| **Arpão magnético** | Tiro lento e forte que **prende** uma nave inimiga: ela fica atordoada, perde o embalo e fica para trás. Só acerta naves. |
| **Campo elétrico** | Passiva: dá choque contínuo em tudo que chega perto do hardpoint, inclusive nos **piratas a bordo**. Não reduz dano: quem protege o casco é a Carenagem e o escudo (§3). |
| **Laser de mineração** | Feixe contínuo feito para **quebrar asteroides**: mira primeiro na rocha que vai bater na nave. Sem rocha por perto, atira nas naves, com dano baixo. |
| **Canhão de fragmentação** | Tiro lento que **explode em área**: quebra asteroides e acerta todas as naves perto da explosão. |

- **Definido: defesas de mineração.** O laser de mineração e o canhão de fragmentação são as **únicas defesas que destroem asteroides** (§8). As outras quatro não acertam rochas. Montar uma delas na proa é a resposta "armada" ao Cinturão, ao lado da "blindada" (Carenagem e escudo) e da do Piloto (desviar).
- **Definido:** cada defesa pode ser **melhorada** com sucata.
- **Definido:** passar o mouse numa defesa (na barra de compra ou já montada num hardpoint) mostra **o que ela faz** e seus números (§13).
- **Em aberto:**
  - Números de cada defesa (dano, alcance, cadência, custo). Placeholders em §16.
  - Quantos níveis de upgrade e se o upgrade só aumenta números ou também muda o comportamento.
  - O que exatamente o arpão "prende" além de atordoar (puxar a nave inimiga para perto do plasma?).
  - Defesas pós-MVP.

## 5. Sucata e Alocação

- **Definido:** inimigos derrubados soltam **sucata**. A sucata é a **única moeda** da run.
- **Definido:** a sucata é gasta **em tempo real, durante a viagem**, para:
  - **comprar** uma defesa e montar num hardpoint vazio;
  - **melhorar** uma defesa já montada;
  - **trocar** uma defesa: vender a atual (recebendo parte do valor) e comprar outra no lugar;
  - **comprar um nível de Carenagem**, um **anexo** ou um nível de **Piloto** (§3).
- **Definido:** na **Estação** (§9), a sucata também paga o **reparo do casco**.
- **Definido:** a sucata continua de um trecho para o outro dentro da mesma run e zera quando a run acaba.
- **Em aberto** (com os placeholders do Fury Hauler):
  - Se a sucata é coletada automaticamente ou se o jogador precisa clicar nela (placeholder: entra direto na carteira).
  - Se o jogo pausa ou entra em câmera lenta enquanto o jogador aloca defesas (placeholder: não pausa).
  - Quanto a venda devolve (placeholder: 50% de tudo que foi gasto na defesa).
  - Se é possível mover uma defesa de um hardpoint para outro sem vender.
  - Sucata inicial da run (placeholder: 100).

## 6. Habilidades Ativas

- **Definido:** além de alocar, o jogador tem **habilidades ativas com cooldown**, usadas por botão (e atalho de teclado).
- **Em aberto:** a lista de habilidades. Placeholders do MVP:
  - **Pós-combustor:** a nave acelera por alguns segundos e deixa para trás quem está perseguindo (os piratas acompanham a velocidade de cruzeiro, não a do pós-combustor, §7).
  - **Nuvem de detritos:** solta uma nuvem de sucata atrás da nave; naves que atravessam ficam atordoadas.
- **Em aberto:** se as habilidades são fixas, desbloqueadas na meta-progressão ou escolhidas antes da run.

## 7. Inimigos

**Definido:** inimigos do MVP:

| Inimigo | Comportamento |
|---|---|
| **Caça pirata** | Rápido e frágil. Ronda a nave do lado de onde veio e atira. |
| **Nave de abordagem** | Encosta na nave e solta **piratas a bordo**. |
| **Drone kamikaze** | Vai direto na nave e explode ao bater (dano de colisão: a Carenagem reduz). Se for destruído antes, não causa dano. |
| **Chefe: Cruzador pirata** | Nave grande no último trecho, na órbita do planeta de destino. |

- **Definido:** os inimigos vêm **de qualquer direção**, conforme o **tipo de trecho** (§8): por trás, pela frente e pelos lados, ou de todos os lados.
- **Definido:** os piratas **acompanham a velocidade de cruzeiro da nave** e só se aproximam com uma sobra pequena. Sem isso, quem vem pela frente (e voa contra a nave) fecharia a distância rápido demais para qualquer defesa. Atordoados, perdem o embalo e ficam para trás. Quem se afasta demais da nave sai do jogo sem dar sucata.
- **Em aberto:**
  - O que o **pirata a bordo** faz. Placeholder: ele ocupa um hardpoint, **sabota a defesa daquele hardpoint** (ela para de funcionar) e causa dano contínuo ao casco até ser morto.
  - Quem consegue atirar no pirata a bordo. Placeholder: **qualquer defesa da nave**, sem olhar o arco de tiro (ele está no casco, não lá fora). Sem isso, um pirata na popa só morreria com Campo elétrico.
  - Comportamento do **Cruzador pirata**. Placeholder: ronda e atira como um caça muito resistente, e chama um caça de reforço de tempos em tempos.
  - Se o Cruzador precisa ser destruído para chegar ao destino (placeholder: sim, enquanto ele existir a nave não termina o trecho).
  - Ataques à distância visíveis (projéteis) ou instantâneos (placeholder: instantâneos, com a nave piscando ao levar dano).

## 8. A Viagem: Trechos, Tipos de Trecho e Rota

- **Definido:** a run é uma rota **gerada a cada run**, com **escolhas de caminho** entre trechos (mapa em camadas, no estilo FTL/Slay the Spire).
- **Definido:** cada trecho é um percurso reto pelo espaço, do começo ao fim. O trecho termina quando a nave chega ao fim dele. O último termina na órbita do planeta de destino e tem o Cruzador pirata.
- **Definido:** cada nó do mapa que não é Estação é um **tipo de trecho**, que define o **padrão de ataque**:

| Tipo de trecho | De onde vêm os piratas | Extra |
|---|---|---|
| **Espaço aberto** | Por trás (perseguição) | — |
| **Cinturão de asteroides** | Pela frente e pelos lados (emboscada) | **Asteroides** que batem no casco |
| **Rota pirata** | De todos os lados (cerco de 360°) | Mais risco e mais sucata |

- **Definido: asteroides.** No Cinturão de asteroides, rochas aparecem à frente da nave. As que estão no caminho **batem no casco e causam dano**. Há três jeitos de lidar com elas, e o Cinturão é o trecho que mais cobra escolher entre eles:
  - **Quebrar:** só as **defesas de mineração** (laser de mineração e canhão de fragmentação, §4) destroem asteroides. Cada rocha quebrada solta um pouco de sucata.
  - **Desviar:** o **Piloto** (§3) desvia sozinho das rochas no caminho.
  - **Aguentar:** a **Carenagem** reduz o dano de colisão e o **escudo** absorve parte dele (§3).
- **Em aberto:**
  - Quantos trechos por run (placeholder: 6 camadas, sendo 5 comuns e o do destino).
  - O risco de cada tipo de trecho. Placeholder: vem do tipo (Espaço aberto 0, Cinturão 1, Rota pirata 2), e cada ponto de risco dá mais inimigos e +25% de sucata.
  - O padrão do último trecho (placeholder: perseguição por trás, com o Cruzador).
  - Densidade e dano dos asteroides (placeholders em §16).
  - Duração de um trecho (placeholder: 900 m, ~90 s).

## 9. Estação

- **Definido:** a **Estação** é um tipo de nó do mapa de rota. Nela, o jogador **repara o casco pagando sucata**. É o **único jeito** de recuperar casco.
- **Em aberto:**
  - Se a Estação tem combate. Placeholder: **não**: é uma parada sem piratas, com uma tela de reparo, e não conta como trecho concluído.
  - Preço do reparo. Placeholder: 1 de sucata repara 2 de casco.
  - Quantas Estações aparecem. Placeholder: no máximo uma por camada, com 25% de chance nas camadas do meio (nunca na primeira nem na do destino).
  - Se a Estação vende outras coisas (defesas mais baratas, habilidades). Placeholder: reparo e os upgrades da nave (Carenagem, anexos e Piloto), pelo mesmo preço da viagem.

## 10. Progressão Permanente (Meta)

- **Definido:** quando a run acaba, o jogador recomeça do zero, mas mantém **desbloqueios permanentes**.
- **Em aberto:**
  - **O que** é desbloqueado (defesas, habilidades, naves, hardpoints, bônus iniciais).
  - **Como** se desbloqueia.
  - Placeholder do MVP (o mesmo do Fury Hauler): autocanhão, campo elétrico e laser de mineração começam liberados; o canhão de plasma libera depois de concluir 1 trecho em qualquer run, o canhão de fragmentação depois de concluir 2 trechos numa mesma run, e o arpão magnético depois de concluir 3. Anexos e Piloto começam liberados.

## 11. Condições de Vitória e Derrota

- **Definido:** **vitória** é chegar ao planeta de destino, ou seja, terminar o último trecho.
- **Definido:** **derrota** é o casco chegar a zero. A run acaba e recomeça do zero (§10).
- **Em aberto:** se existe pontuação ou ranking local (tempo, sucata, casco restante).

## 12. Estilo Visual

- **Definido:** isométrico, no espaço profundo: azul-noite com estrelas, nebulosas discretas e planetas grandes ao fundo. A nave do jogador é uma nave de carga industrial (casco branco-acinzentado, contêineres de carga laranja); os piratas são vermelho-escuro e preto, com luzes laranja.
- **Definido:** como o espaço não tem chão, a sensação de movimento e de profundidade vem de: **estrelas em 3 camadas de parallax**, **boias de sinalização** dos dois lados da rota a cada 100 m (com a distância até o fim) e **portais de salto** no começo e no fim de cada trecho.
- **Definido:** **pixel art do PixelLab, no estilo do Fury Hauler** (isométrico 2:1, contorno escuro seletivo, luz do alto à esquerda), feita como redesenho das formas vetoriais do protótipo. O estilo passa por um **teste com poucos sprites** antes do lote completo.
- **Em aberto:** paleta final; quantas direções cada nave inimiga precisa (no protótipo, um sprite só por inimigo).

## 13. HUD / UI

**Definido:** o que fica na tela durante o trecho é derivado das mecânicas:

- Sucata atual.
- Casco (atual / máximo) e o nível da Carenagem; o escudo (atual / máximo), quando há Gerador de escudo.
- Progresso do trecho e o tipo de trecho.
- Barra de compra com as defesas liberadas e seus custos, e o botão **Nave**, que abre o painel de upgrades da nave: Carenagem, anexos e Piloto, cada um com nível, custo e o efeito do próximo nível.
- Painel da defesa selecionada (nível, melhorar, vender).
- Botões das habilidades com cooldown visível.
- **Dicas ao passar o mouse:** em cada defesa da barra, em cada defesa montada (com o hardpoint, o nível atual e o que o próximo nível dá), em cada upgrade da nave e em cada habilidade, uma caixa diz **o que aquilo faz** e seus números. No toque, onde não existe "passar o mouse", a dica da defesa aparece enquanto ela está escolhida na barra.
- No mapa de rota: o tipo de cada nó (ícone e nome), o risco e o bônus de sucata.
- Na Estação: casco, sucata, botões de reparo e os upgrades da nave.

**Em aberto:** layout final, indicador de inimigos fora da tela (importante agora que eles vêm de qualquer lado).

## 14. Áudio

**Em aberto.** Nada decidido ainda.

## 15. Backend / Serviços

- **Definido:** **offline**, sem conta, sem servidor e sem leaderboard. O progresso permanente fica em **save local** no navegador, separado do save do Fury Hauler.
- **Em aberto:** leaderboard no padrão Firebase do estúdio, se um dia o jogo ganhar pontuação (§11).

## 16. Escopo do MVP

**Definido:** entra no MVP:

- Nave voando sozinha numa rota isométrica no espaço, com casco e 6 hardpoints de arco limitado.
- As 6 defesas da §4 (inclusive as 2 de mineração), com compra, upgrade e venda por sucata em tempo real.
- A Carenagem, os anexos (Gerador de escudo e os 2 casulos de armas) e o Piloto (§3).
- Dicas ao passar o mouse (§13).
- Os 4 inimigos da §7 (mais o pirata a bordo que a nave de abordagem solta).
- Os 3 tipos de trecho da §8, com asteroides no Cinturão.
- A Estação (§9).
- Habilidades ativas com cooldown (placeholders: pós-combustor e nuvem de detritos).
- Run roguelite: mapa de rota com bifurcações, trechos em sequência e Cruzador no fim.
- Desbloqueios permanentes simples e save local.
- Build Web.

**Fica para depois:**

- Arte final de todos os objetos e áudio.
- A especiaria (§1).
- Mais defesas, inimigos, habilidades e tipos de nó no mapa.
- Outras naves e outros anexos.
- Leaderboard.

### Placeholders de Balanceamento

> Todos os valores são **placeholders de MVP**. No guia Unity eles ficam em assets (`GameConfig`, `DefenseDef`, `EnemyDef`, `AbilityDef`), para ajustar sem mexer em código. Distâncias em metros no plano da rota. A primeira leitura de balanceamento (piloto automático no protótipo) está no README de `prototipos/space-hauler/`.

| Item | Valor placeholder |
|---|---|
| Nave | 500 de casco, 10 m/s, raio de colisão 1,6 m |
| Trecho | 900 m (~90 s) |
| Sucata inicial da run | 100 |
| Venda | devolve 50% do total gasto na defesa |
| Upgrade de defesa | +35% nos números por nível, até o nível 3 |
| Carenagem | 5 níveis; nível n custa 50 × n; cada nível +50 de casco máximo (e cura 50) e −12% de dano de colisão |
| Reparo na Estação | 1 de sucata = 2 de casco |

| Hardpoint | Posição (m, a partir do centro da nave) | Arco |
|---|---|---|
| Proa | (3, 0), virado para frente | 180° |
| Bombordo frente / trás | (1,2, 1,3) / (−1,2, 1,3), virados para a esquerda | 180° |
| Estibordo frente / trás | (1,2, −1,3) / (−1,2, −1,3), virados para a direita | 180° |
| Popa | (−3, 0), virado para trás | 180° |
| Casulo dianteiro (anexo): bombordo / estibordo | (2,2, 2,4) / (2,2, −2,4), virados a 45° / −45° (frente e lado) | 180° |
| Casulo traseiro (anexo): bombordo / estibordo | (−2,6, 2,4) / (−2,6, −2,4), virados a 135° / −135° (trás e lado) | 180° |

| Anexo / Piloto | Custo | Efeito |
|---|---|---|
| Gerador de escudo | 3 níveis; nível n custa 80 × n | +60 de escudo por nível; recarrega 12/s depois de 3 s sem levar dano; enche no começo de cada trecho |
| Casulo dianteiro | 120 (uma vez) | +2 hardpoints |
| Casulo traseiro | 120 (uma vez) | +2 hardpoints |
| Piloto | 3 níveis; nível n custa 60 × n | +10% de velocidade de cruzeiro por nível; desvia de asteroides deslizando para o lado a 1,5 × nível m/s; enxerga 16 m à frente; sai no máximo 5 m do centro da rota |

| Defesa | Custo (e custo de upgrade por nível) | Alcance | Efeito |
|---|---|---|---|
| Autocanhão | 40 | 9 | 6 de dano a cada 0,15 s |
| Canhão de plasma | 60 | 4,5 | 35 de dano/s em cone de 60° |
| Arpão magnético | 70 | 12 | 40 de dano a cada 3 s, atordoa 2,5 s, só naves |
| Campo elétrico | 50 | 2,5 | 15 de dano/s em quem estiver perto (inclusive piratas a bordo) |
| Laser de mineração | 55 | 14 | 60 de dano/s em asteroides, 8 de dano/s em naves; mira primeiro na rocha em rota de colisão |
| Canhão de fragmentação | 65 | 13 | 30 de dano em área (raio 2 m) a cada 1,2 s, em naves e asteroides |

| Inimigo | Vida | Aproximação (sobra sobre a velocidade de cruzeiro) | Ataque | Sucata | Custo de spawn | Dificuldade mínima |
|---|---|---|---|---|---|---|
| Caça pirata | 30 | 6 m/s | 4 a cada 1 s | 8 | 1 | 0 |
| Drone kamikaze | 50 | 8 m/s | 45 ao bater (colisão) | 12 | 2 | 1 |
| Nave de abordagem | 80 | 4 m/s | solta 2 piratas, 1 a cada 2 s | 15 | 3 | 2 |
| Pirata a bordo | 20 | — | 6/s no casco e sabota o hardpoint | 3 | — | — |
| Cruzador pirata | 1500 | 2 m/s | 15 a cada 1,5 s; chama 1 caça a cada 6 s | 150 | — | — |

| Spawn, rota e asteroides | Valor placeholder |
|---|---|
| Orçamento de spawn | 0,25 + 0,1 × dificuldade pontos/s |
| Dificuldade do trecho | número do trecho + risco do tipo |
| Distância de spawn | 20 a 26 m da nave, num ângulo dentro do arco do tipo de trecho |
| Arco de spawn | Espaço aberto: 145° a 215° (trás); Cinturão: −110° a 110° (frente e lados); Rota pirata: 0° a 360° |
| Inimigo sai do jogo | a mais de 40 m da nave |
| Camadas da rota | 6 (5 comuns + destino), 2 a 3 nós por camada |
| Estação | até 1 por camada do meio, 25% de chance |
| Risco | Espaço aberto 0, Cinturão 1, Rota pirata 2; cada ponto dá +25% de sucata |
| Cruzador aparece em | 30% do último trecho |
| Asteroides | 0,4 por segundo, 34 a 42 m à frente, até 16 m para cada lado; raio 0,8 a 2,2 m; dano = 16 × raio; vida = 30 × raio; quebrado, solta 2 × raio de sucata |

| Habilidade | Cooldown | Efeito |
|---|---|---|
| Pós-combustor | 20 s | velocidade ×1,6 por 4 s |
| Nuvem de detritos | 15 s | nuvem de 8 m de comprimento, 5 m atrás da nave, que dura 5 s e atordoa naves por 1,5 s |

## 17. Riscos / Em aberto (consolidado)

- **Pilar de design** (há uma proposta na §1).
- **Profundidade da decisão de hardpoint.** É o coração do jogo e o maior risco: os padrões de ataque por tipo de trecho (§8) existem para que "qual arma em qual lado" mude de um trecho para o outro. Se o jogador montar o mesmo plano em toda run, a decisão morreu.
- **Peso da Rota pirata.** Na primeira leitura do protótipo, ela custa tanto casco quanto o Espaço aberto e paga 50% a mais de sucata, o que a faz a melhor escolha sempre. O risco dela precisa subir.
- **Anexos podem matar o "lado mais fraco".** Com os dois casulos, a nave tem 10 hardpoints e cobre quase tudo, o que enfraquece a decisão central (§3). E o escudo, com os placeholders, é o upgrade que mais aumenta a chance de chegar ao destino na leitura do piloto automático. Os dois podem precisar ficar mais caros, ou o número de anexos ser limitado.
- **O Cinturão ficou fácil.** Com laser de mineração, Piloto e escudo, o piloto automático perde bem menos casco no Cinturão do que antes. Os números de vida dos asteroides e do laser vão precisar subir se o Cinturão deixar de ser o trecho que "cobra" (§8).
- Número de níveis e valores da Carenagem, do escudo, dos casulos e do Piloto; outros anexos; tamanho dos arcos por hardpoint (§3).
- Números, níveis e upgrades que mudam comportamento (§4).
- Coleta de sucata, pausa durante alocação, valor de venda, mover defesas (§5).
- Lista de habilidades (§6).
- Pirata a bordo, quem pode atirar nele, e o Cruzador (§7).
- Risco por tipo, número de trechos, asteroides (§8).
- Combate, preço e frequência da Estação (§9).
- O que e como desbloquear na meta-progressão (§10).
- Pontuação/ranking (§11).
- Paleta e direções dos sprites (§12).
- Layout do HUD e indicador de inimigos fora da tela (§13).
- Áudio (§14).
- A especiaria (§1).

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para implementar o MVP do Space Hauler em Unity 6, com build Web. Os números vêm dos placeholders da Parte 1 §16 e ficam em assets (`GameConfig` e os `...Def`), para dar para balancear sem mexer no código. As regras marcadas como **Em aberto** que o código precisa decidir de algum jeito viram opções do `GameConfig` ou ficam isoladas num lugar só, para trocar de ideia sem reescrever nada.
>
> **De onde vem este guia.** A estrutura é a do guia do [Fury Hauler](FuryHauler.md), porque o jogo nasceu dele: mesma projeção isométrica, mesmo jeito de montar defesas, mesma run. O que muda: não há estrada (a Fase 1 monta um fundo de estrelas), os hardpoints não cobrem 360°, os inimigos vêm de qualquer lado conforme o tipo de trecho (Fase 3), há asteroides (Fase 3), Carenagem (Fase 5) e Estação (Fase 7). O projeto Unity é outro, separado do Fury Hauler.
>
> **Ainda não está neste guia.** A Parte 1 ganhou depois dele: as **defesas de mineração** (laser de mineração e canhão de fragmentação) e, com elas, **asteroides que podem ser destruídos**; os **anexos** (Gerador de escudo e casulos de armas com mais hardpoints); o **Piloto** (mais velocidade e desvio de asteroides); e as **dicas ao passar o mouse**. O guia abaixo ainda monta a versão anterior (4 defesas, 6 hardpoints, asteroides indestrutíveis, só Carenagem). O protótipo em `prototipos/space-hauler/` já tem tudo isso e serve de referência de comportamento até o guia ser atualizado.

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele. Os termos seguem o [glossário](contexts/space-hauler/CONTEXT.md): hardpoint é `Hardpoint`, casco é `Hull`, Carenagem é `HullPlating`, Estação é `Station`.
- **Namespaces:**
  - `SpaceHauler.World`: projeção isométrica, posição no plano, fundo de estrelas e câmera.
  - `SpaceHauler.Data`: ScriptableObjects de configuração, defesas, inimigos e habilidades.
  - `SpaceHauler.Ship`: a nave, seu casco, sua Carenagem e seus hardpoints.
  - `SpaceHauler.Trip`: o trecho em andamento, o spawn de inimigos e os asteroides.
  - `SpaceHauler.Enemies`: os inimigos.
  - `SpaceHauler.Defenses`: as defesas.
  - `SpaceHauler.Economy`: sucata e alocação (comprar, melhorar, vender).
  - `SpaceHauler.Abilities`: habilidades ativas.
  - `SpaceHauler.Run`: rota, run, Estação e save da meta-progressão.
  - `SpaceHauler.UI`: HUD e painéis.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Textos na tela sem emoji**, porque a fonte padrão do TextMeshPro não tem emojis.

## Arquitetura em uma página

```
 Plano da rota (lógica 2D, metros)                 Tela (isométrico)
 ─────────────────────────────────                 ─────────────────
 x = distância percorrida, y = lado              GroundBody ── IsoProjection.ToScreen ──▶ transform.position
                                                                                          + ordem de desenho

 RunManager ──escolhe nó──▶ Estação (sem combate: reparo e Carenagem)
     │
     └──▶ TripManager.StartTrip ──Started──▶ EnemySpawner (orçamento por segundo, arco do tipo de trecho)
     ▲                           │           AsteroidField (só no Cinturão)
     │ Ended(sucesso?)           │ IsFlying                 │ instancia
     └───────────────────────────┤                          ▼
                                 ▼         Enemy (Fighter / Drone / Boarder / Pirate / Cruiser), Asteroid
                           ShipController ──Hardpoints──▶ Hardpoint ──▶ Defense ───┘ TakeDamage   │ Killed
                           ShipHull ◀──dano──── inimigos e asteroides   (mira sozinha)             ▼
                           HullPlating (Carenagem: + casco, − dano de colisão)                 ScrapWallet
                                                                                                    │
 Mouse ──▶ AllocationController (comprar / melhorar / vender) e Carenagem ◀─────────────────────────┘
 Teclas/botões ──▶ AbilityController (pós-combustor, nuvem de detritos)
```

- **Regra de ouro: toda a lógica acontece no plano da rota, nunca na tela.** Cada coisa do jogo tem uma posição `Ground` (um `Vector2` em metros): `x` é quanto já andou na rota e `y` é o desvio para o lado (positivo = bombordo, a esquerda da nave). Distância, alcance, arco de tiro e colisão são calculados ali. Só o `GroundBody` converte essa posição para a tela isométrica.
- **"Ground" no código, "plano" no texto.** O nome `Ground` vem do Fury Hauler, onde era o chão da estrada. No espaço não há chão: é o plano invisível onde a nave, os piratas e os asteroides voam. O nome ficou porque descreve bem a ideia (a posição "de verdade", antes da projeção).
- **Por que isso importa aqui:** no isométrico, "3 metros" na tela não têm o mesmo tamanho na horizontal e na vertical. Se o alcance do autocanhão fosse medido na tela, ele seria maior para os lados do que para frente. Medindo no plano, um círculo de alcance é um círculo de verdade, e o arco de tiro de um hardpoint é um leque de verdade.
- **Sem física.** Nada cai, quica ou empurra. Não há `Rigidbody2D` nem `Collider2D`: os inimigos se movem por `Vector2.MoveTowards` e os acertos (inclusive asteroides) são checagens de distância. Por isso a nota de `rb.linearVelocity`/`rb.velocity` não se aplica a este guia.

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, organizado, com os pacotes certos e pronto para build Web.

### 0.1 Criar o projeto

1. Instale o **Unity Hub** e uma versão **Unity 6 LTS** (6000.x) com o módulo **Web Build Support** (o alvo é navegador, Parte 1 §1).
2. No Hub, crie um projeto com **New project → Universal 2D** e o nome `SpaceHauler`. É outro projeto, separado do Fury Hauler.
   - É aqui que o "2.5D" definido na Parte 1 vira decisão técnica: **o projeto é 2D**. O template 2D já vem com URP 2D, sprites e câmera ortográfica.
   - **Isométrico não muda o template.** O "isométrico" vem de uma conta (`IsoProjection`, Fase 1) que converte a posição no plano em posição na tela, e da arte desenhada em perspectiva.
   - O **2D Tilemap Editor** não é usado: o espaço não tem chão, e o fundo de estrelas é desenhado na tela (Fase 1).

### 0.2 Estrutura de pastas

Crie dentro de `Assets/`:

```
Assets/_Project/
  Scripts/
    World/       (projeção isométrica, fundo de estrelas, boias, câmera)
    Data/        (GameConfig e os ...Def)
    Ship/        (nave, casco, Carenagem, hardpoints)
    Trip/        (trecho, spawn e asteroides)
    Enemies/
    Defenses/
    Economy/     (sucata e alocação)
    Abilities/
    Run/         (rota, run, Estação, save)
    UI/
  Resources/     (só o GameConfig)
  ScriptableObjects/
    Defenses/
    Enemies/
    Abilities/
  Prefabs/
    Enemies/
    Defenses/
    UI/
  Scenes/        (Game)
  Sprites/
```

### 0.3 Pacotes (Window → Package Manager)

| Pacote | Para quê |
|---|---|
| **Input System** (já vem no Unity 6) | Ler clique do mouse e teclas de atalho. |
| **2D Sprite** (vem com o template 2D) | Criar sprites placeholder pelo menu **Create → 2D → Sprites** (losango isométrico, círculo, quadrado). |
| **TextMeshPro** (parte do pacote uGUI no Unity 6) | Textos da UI. No primeiro uso, aceite **Import TMP Essentials**. |

### 0.4 Cena, camadas de desenho e input

1. Crie a cena `Game` em `Assets/_Project/Scenes/` e adicione-a em **File → Build Profiles → Scene List**.
2. **Sorting Layers** (Edit → Project Settings → Tags and Layers → Sorting Layers), nesta ordem:
   - `Fundo`: estrelas, nebulosas e planetas, sempre por baixo.
   - `Mundo`: nave, inimigos, asteroides, boias e nuvens de detritos.
   - `FX`: rastros de tiro e efeitos.
3. Em **Edit → Project Settings → Player → Other Settings → Active Input Handling**, deixe **Input System Package (New)** ou **Both**.
4. Na **Main Camera**: **Projection = Orthographic**, **Size = 7**, **Background** azul-noite (ex.: `#0E1430`). Sem estrelas por enquanto, o espaço é só essa cor.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- A cena `Game` está na Scene List do Build Profile.
- As 3 Sorting Layers existem na ordem `Fundo`, `Mundo`, `FX`.
- Apertar Play mostra a tela azul-noite, sem erros.

#### Problemas comuns
- **Não aparece a plataforma Web no Build Profiles:** o módulo **Web Build Support** não foi instalado. No Unity Hub, vá em **Installs → (sua versão) → Add modules**.
- **`InputSystem` não encontrado nos scripts:** o pacote Input System não está instalado, ou o Active Input Handling está em "Input Manager (Old)".

Próxima fase: **Espaço Isométrico**, com a conta plano → tela, o fundo de estrelas, as boias e a câmera.

---

# Parte 4 — Implementação Unity: Fase 1 (Espaço Isométrico)

## Fase 1 — Espaço Isométrico

> Objetivo desta fase: um objeto voando sozinho pelo espaço isométrico, com estrelas em parallax, boias de sinalização passando e a câmera seguindo.

### 1.1 A conta plano → tela: `IsoProjection`

```csharp
// Caminho: Assets/_Project/Scripts/World/IsoProjection.cs
using UnityEngine;

namespace SpaceHauler.World
{
    // POR QUE: toda a lógica do jogo acontece no plano da rota (metros, sem
    // perspectiva), mas a tela é isométrica. Esta classe é o único lugar que sabe
    // converter um no outro, então mudar o ângulo da câmera no futuro mexe só aqui.
    // ESTRATÉGIA: isométrico clássico 2:1 (o losango de um metro tem o dobro de
    // largura em relação à altura). O eixo x do plano (a rota) sobe para a
    // direita na tela, e o eixo y (bombordo, a esquerda da nave) sobe para a
    // esquerda. É uma classe "static": não vai em nenhum objeto da cena, é só um
    // conjunto de funções.
    public static class IsoProjection
    {
        // Metade da largura e metade da altura, na tela, de 1 metro do plano.
        public const float HalfWidth = 0.5f;
        public const float HalfHeight = 0.25f;

        // Converte um ponto do plano (com uma altura opcional, ex.: o convés da
        // nave) em posição na tela (coordenadas de mundo da Unity).
        public static Vector3 ToScreen(Vector2 ground, float height = 0f)
        {
            float x = (ground.x - ground.y) * HalfWidth;
            float y = (ground.x + ground.y) * HalfHeight + height;
            return new Vector3(x, y, 0f);
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

namespace SpaceHauler.World
{
    // POR QUE: nave, inimigos, asteroides e nuvens de detritos vivem no plano da
    // rota. Este componente guarda essa posição e, todo frame, coloca o objeto no
    // lugar certo da tela e na ordem certa de desenho (no isométrico, o que está
    // "mais perto" da câmera precisa ser desenhado por cima).
    // ESTRATÉGIA: a ordem de desenho vem de (x + y) no plano: quanto maior, mais
    // "para o fundo" da tela, então menor a ordem. Um SortingGroup faz o objeto
    // inteiro (com todos os sprites filhos) ser ordenado como um bloco só, o que
    // impede, por exemplo, que a asa de um caça apareça por cima da nave.
    [RequireComponent(typeof(SortingGroup))]
    public class GroundBody : MonoBehaviour
    {
        // Precisão da ordenação: 10 = diferenças de 10 cm já mudam a ordem.
        private const float SortPrecision = 10f;

        [SerializeField] private float _height;   // altura acima do plano, em unidades de tela
        [SerializeField] private int _sortBias;   // empurra a ordem para frente (ex.: pirata em cima da nave)

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

> A `sortingOrder` aceita valores de -32768 a 32767. Com precisão 10, isso cobre uns 3 km de rota, bem mais que um trecho (900 m, Parte 1 §16). Se um trecho ficar maior que isso, reduza `SortPrecision`.

### 1.3 O fundo de estrelas: `StarfieldView`

No Fury Hauler, a estrada e a areia passando davam a sensação de movimento. No espaço não há chão, então esse papel fica com as **estrelas em parallax** (Parte 1 §12): várias camadas que se movem mais devagar que a câmera, cada uma num ritmo. A do fundo quase não se mexe; a da frente corre mais. O olho lê isso como profundidade.

```csharp
// Caminho: Assets/_Project/Scripts/World/StarfieldView.cs
using System.Collections.Generic;
using UnityEngine;

namespace SpaceHauler.World
{
    // POR QUE: sem chão, a única pista de que a nave está andando é o fundo se
    // mexendo. Estrelas em camadas de parallax dão movimento e profundidade sem
    // nenhuma regra de jogo.
    // ESTRATÉGIA: cada camada é um punhado de estrelas (sprites pequenos) criadas
    // uma vez, numa área um pouco maior que a tela. A camada é filha da câmera e,
    // todo frame, desloca as estrelas na direção contrária ao movimento da câmera,
    // multiplicado pelo "fator" da camada (0 = parada, 1 = colada no mundo).
    // Estrela que sai de um lado da área reaparece do outro (Mathf.Repeat), então
    // nada é criado nem destruído durante o jogo.
    public class StarfieldView : MonoBehaviour
    {
        [System.Serializable]
        private class Layer
        {
            public float factor = 0.2f;   // quanto a camada acompanha o mundo (0 a 1)
            public int count = 60;
            public float size = 0.06f;    // escala do sprite de estrela
            public Color color = Color.white;
        }

        [SerializeField] private Camera _camera;
        [SerializeField] private Sprite _starSprite;   // um círculo ou quadrado pequeno
        [SerializeField] private Layer[] _layers =
        {
            new Layer { factor = 0.05f, count = 90, size = 0.04f, color = new Color(1f, 1f, 1f, 0.45f) },
            new Layer { factor = 0.2f, count = 60, size = 0.06f, color = new Color(0.85f, 0.92f, 1f, 0.75f) },
            new Layer { factor = 0.45f, count = 30, size = 0.09f, color = Color.white },
        };

        private readonly List<(Transform star, Vector2 home, Layer layer)> _stars = new();
        private Vector2 _area;   // tamanho da área coberta, um pouco maior que a tela

        private void Start()
        {
            float height = _camera.orthographicSize * 2f * 1.3f;
            _area = new Vector2(height * _camera.aspect, height);
            foreach (Layer layer in _layers)
            {
                for (int i = 0; i < layer.count; i++)
                {
                    var go = new GameObject("Star");
                    go.transform.SetParent(transform, false);
                    var sr = go.AddComponent<SpriteRenderer>();
                    sr.sprite = _starSprite;
                    sr.color = layer.color;
                    sr.sortingLayerName = "Fundo";
                    go.transform.localScale = Vector3.one * layer.size;
                    var home = new Vector2(Random.Range(0f, _area.x), Random.Range(0f, _area.y));
                    _stars.Add((go.transform, home, layer));
                }
            }
        }

        // Desloca cada estrela pelo movimento da câmera × fator da camada, dando
        // a volta na área quando sai dela.
        private void LateUpdate()
        {
            Vector2 cam = _camera.transform.position;
            foreach (var (star, home, layer) in _stars)
            {
                float x = Mathf.Repeat(home.x - cam.x * layer.factor, _area.x) - _area.x * 0.5f;
                float y = Mathf.Repeat(home.y - cam.y * layer.factor, _area.y) - _area.y * 0.5f;
                star.position = new Vector3(cam.x + x, cam.y + y, 0f);
            }
        }
    }
}
```

> As estrelas são posicionadas em volta da câmera, mas com o deslocamento "atrasado" pelo fator. Com `factor = 0`, elas ficariam presas à tela (como um adesivo); com `factor = 1`, presas ao mundo (passariam tão rápido quanto a nave). Os valores do meio são o parallax.

### 1.4 As boias da rota: `BuoyLine`

As estrelas dão movimento, mas não dão **distância**: a nave pode estar a 100 m ou a 800 m do fim e o céu parece igual. As boias de sinalização (Parte 1 §12) ficam nos dois lados da rota, a cada 100 m, com a distância até o fim escrita na de estibordo.

```csharp
// Caminho: Assets/_Project/Scripts/World/BuoyLine.cs
using System.Collections.Generic;
using TMPro;
using UnityEngine;

namespace SpaceHauler.World
{
    // POR QUE: dar referência de distância e de "por onde a rota passa" num
    // espaço sem chão.
    // ESTRATÉGIA: a mesma reciclagem da estrada do Fury Hauler: um número fixo de
    // pares de boias é criado uma vez e reposicionado conforme o objeto seguido
    // avança. Cada boia é um GroundBody (entra na ordem de desenho do mundo, então
    // um inimigo pode passar na frente ou atrás dela).
    public class BuoyLine : MonoBehaviour
    {
        [SerializeField] private GroundBody _follow;      // normalmente a nave
        [SerializeField] private GroundBody _buoyPrefab;  // boia com um TMP_Text filho (pode ficar vazio)
        [SerializeField] private float _spacing = 100f;   // metros entre pares
        [SerializeField] private float _sideOffset = 8f;  // metros para cada lado da rota
        [SerializeField] private int _pairsBehind = 1;
        [SerializeField] private int _pairsAhead = 2;

        private readonly List<(GroundBody port, GroundBody starboard)> _pairs = new();
        private int _firstIndex = int.MinValue;

        // Comprimento do trecho atual, para escrever "faltam X m". O TripManager
        // (Fase 2) atualiza este valor ao começar cada trecho.
        public float TripLength { get; set; } = 900f;

        private void Start()
        {
            for (int i = 0; i < _pairsBehind + _pairsAhead + 1; i++)
                _pairs.Add((Instantiate(_buoyPrefab, transform), Instantiate(_buoyPrefab, transform)));
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
                Place(_pairs[i].starboard, new Vector2(x, -_sideOffset), $"{Mathf.Max(0f, TripLength - x):0} m");
            }
        }

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

namespace SpaceHauler.World
{
    // POR QUE: a nave nunca para, então a câmera precisa ir junto, com um pouco
    // de folga à frente para o jogador ver quem está chegando.
    // ESTRATÉGIA: segue um ponto do plano um pouco à frente do alvo, com
    // suavização exponencial (chega rápido quando está longe e devagar quando
    // está perto, sem tremer). DefaultExecutionOrder(100) faz este LateUpdate
    // rodar depois do LateUpdate do GroundBody, que já posicionou o alvo.
    // O StarfieldView lê a posição da câmera, então ele precisa rodar depois
    // deste: dê a ele DefaultExecutionOrder maior, ou deixe as estrelas um
    // frame atrasadas (não dá para perceber).
    [DefaultExecutionOrder(100)]
    public class CameraFollow : MonoBehaviour
    {
        [SerializeField] private GroundBody _target;
        [SerializeField] private Vector2 _groundOffset = new Vector2(3f, 0f); // metros à frente
        [SerializeField] private float _sharpness = 6f;

        private void LateUpdate()
        {
            if (_target == null) return;

            Vector3 goal = IsoProjection.ToScreen(_target.Ground + _groundOffset);
            goal.z = transform.position.z; // a câmera 2D fica em z = -10; não mexer nisso
            float t = 1f - Mathf.Exp(-_sharpness * Time.deltaTime);
            transform.position = Vector3.Lerp(transform.position, goal, t);
        }
    }
}
```

### 1.6 Um teste que voa sozinho: `GroundDriverTest`

Script temporário, só para esta fase. Na Fase 2 o `ShipController` faz isso de verdade e este arquivo pode ser apagado.

```csharp
// Caminho: Assets/_Project/Scripts/World/GroundDriverTest.cs
using UnityEngine;

namespace SpaceHauler.World
{
    // POR QUE: testar estrelas, boias e câmera antes de existir a nave.
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
2. **Objeto de teste:** crie um GameObject vazio `Ship`, adicione **GroundBody** (o `SortingGroup` entra junto) e **GroundDriverTest**. No `SortingGroup`, **Sorting Layer = Mundo**. Como filho, adicione um sprite `Square` chamado `Body`, cor branco-acinzentada (`#C8CCD8`), escala `(1.6, 0.8, 1)`.
3. **Estrelas:** crie um GameObject vazio `Starfield` **como filho da Main Camera**, com **StarfieldView**: `Camera` = Main Camera, `Star Sprite` = `Circle`.
4. **Prefab da boia:** GameObject `Buoy` com **GroundBody** (`SortingGroup` em **Mundo**), um filho sprite `Square` amarelo (`#F2B632`, escala `(0.15, 0.4, 1)`) e um filho **TextMeshPro (3D, não o de UI)** chamado `Label`, com tamanho de fonte `2`, um pouco abaixo do sprite. Arraste para `Prefabs/` e apague da cena.
5. **Boias:** GameObject vazio `Buoys` com **BuoyLine**: `Follow` = `Ship`, `Buoy Prefab` = `Buoy`.
6. **Câmera:** adicione **CameraFollow** na `Main Camera`, com `Target` = `Ship`.

### ✅ Checkpoint da Fase 1
- No Play, o quadrado da nave anda na diagonal (subindo para a direita) e a câmera vai junto.
- As estrelas passam em três ritmos: as pequenas e apagadas quase paradas, as grandes mais rápidas. Nenhuma estrela "acaba": a tela nunca fica vazia.
- Pares de boias amarelas passam pelos dois lados a cada 100 m, e a de estibordo (a de baixo, à direita da nave) mostra quantos metros faltam para o fim.
- Na janela **Hierarchy**, o número de estrelas e de boias fica fixo durante o Play.

#### Problemas comuns
- **As estrelas correm junto com a nave, sem parallax:** o `Starfield` não é filho da câmera, ou os fatores das camadas estão em `1`.
- **As estrelas tremem:** o `StarfieldView` está rodando antes do `CameraFollow`. Dê a ele `[DefaultExecutionOrder(110)]` ou deixe como está (a diferença é de um frame).
- **O texto da boia aparece gigante ou some:** o `Label` precisa ser o **TextMeshPro** de mundo (menu **3D Object → Text - TextMeshPro**), não o de UI, e com fonte pequena (a unidade aqui é o metro da tela).

Próxima fase: **Nave e Trecho**, com a nave de verdade, casco, hardpoints e o fim do trecho.

---

# Parte 5 — Implementação Unity: Fase 2 (Nave e Trecho)

## Fase 2 — Nave e Trecho

> Objetivo desta fase: a nave voa sozinha do começo ao fim de um trecho de 900 m, tem casco e 6 hardpoints marcados (cada um com o seu arco de tiro), e o jogo sabe quando o trecho acabou.

### 2.1 Os números do jogo: `GameConfig`

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameConfig.cs
using UnityEngine;

namespace SpaceHauler.Data
{
    // POR QUE: os números do jogo ainda são placeholders (Parte 1 §16). Num
    // asset, dá para mudar no Inspector, até durante o Play, sem tocar em código.
    // ESTRATÉGIA: um ScriptableObject é um "arquivo de dados" da Unity, criado
    // pelo menu Create. Como existe um só, ele fica em Resources/ e é carregado
    // por nome na primeira vez que alguém pede GameConfig.I.
    [CreateAssetMenu(menuName = "Space Hauler/Game Config", fileName = "GameConfig")]
    public class GameConfig : ScriptableObject
    {
        [Header("Nave (Parte 1 §3)")]
        public float shipBaseHull = 500f;           // casco sem Carenagem
        public float shipSpeed = 10f;               // metros por segundo (velocidade de cruzeiro)
        public float shipRadius = 1.6f;             // raio de colisão com asteroides

        [Header("Carenagem (Parte 1 §3)")]
        public int platingMaxLevel = 5;
        public int platingCostPerLevel = 50;        // o nível n custa isto × n
        public float platingHullPerLevel = 50f;     // + casco máximo por nível
        [Range(0f, 0.2f)] public float platingCollisionReductionPerLevel = 0.12f;

        [Header("Trecho (Parte 1 §8)")]
        public float tripLength = 900f;             // metros
        public float laneHalfWidth = 6f;            // metros: largura da nuvem de detritos (não há estrada)
        public float enemyDespawnDistance = 40f;    // inimigo mais longe que isso da nave some sem dar sucata

        [Header("Spawn de inimigos (Parte 1 §16)")]
        public float spawnBudgetBase = 0.25f;       // pontos por segundo
        public float spawnBudgetPerDifficulty = 0.1f;
        public float spawnDistanceMin = 20f;        // metros da nave
        public float spawnDistanceMax = 26f;
        [Range(0f, 1f)] public float bossSpawnAtProgress = 0.3f;

        [Header("Asteroides (Parte 1 §8)")]
        public float asteroidsPerSecond = 0.4f;
        public float asteroidAheadMin = 34f;
        public float asteroidAheadMax = 42f;
        public float asteroidLateralSpread = 16f;
        public float asteroidRadiusMin = 0.8f;
        public float asteroidRadiusMax = 2.2f;
        public float asteroidDamagePerRadius = 16f;

        [Header("Sucata (Parte 1 §5)")]
        public int startingScrap = 100;
        [Range(0f, 1f)] public float sellRefund = 0.5f;

        [Header("Rota e Estação (Parte 1 §8 e §9)")]
        public int routeLayers = 6;                 // inclui o trecho do destino
        public int minNodesPerLayer = 2;
        public int maxNodesPerLayer = 3;
        [Range(0f, 1f)] public float stationChance = 0.25f;
        public float scrapBonusPerRisk = 0.25f;
        public float repairHullPerScrap = 2f;

        [Header("Regras Em aberto (placeholders)")]
        public bool bossBlocksArrival = true;        // Parte 1 §7
        public bool pirateIgnoresArcs = true;        // Parte 1 §7: qualquer defesa mira no pirata a bordo

        private static GameConfig _instance;

        // Acesso de qualquer script: GameConfig.I.shipSpeed
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

> No Fury Hauler havia uma opção para a vida do caminhão voltar entre trechos. Aqui não há: a Parte 1 §3 **definiu** que o casco só volta na Estação.

### 2.2 Um hardpoint na nave: `Hardpoint` (versão 1)

Esta versão só sabe **onde** o hardpoint fica e **para onde** ele pode atirar. Na Fase 4 ela é substituída pela versão final, que também guarda a defesa montada.

```csharp
// Caminho: Assets/_Project/Scripts/Ship/Hardpoint.cs
using SpaceHauler.World;
using UnityEngine;

namespace SpaceHauler.Ship
{
    // POR QUE: a decisão central do jogador é "qual defesa em qual hardpoint"
    // (Parte 1 §3). Cada hardpoint tem uma posição na nave e um arco de tiro, e
    // nenhum cobre 360°: com piratas vindo de todo lado, sempre sobra um lado fraco.
    // ESTRATÉGIA: o hardpoint guarda um deslocamento no plano em relação ao
    // centro da nave, então sua posição real é sempre "nave + deslocamento". O
    // arco é um leque: direção central + abertura. DefaultExecutionOrder(50) faz
    // o hardpoint se posicionar depois do GroundBody da nave, para não ficar um
    // frame atrasado.
    [DefaultExecutionOrder(50)]
    public class Hardpoint : MonoBehaviour
    {
        [SerializeField] private string _label = "Proa";
        [SerializeField] private Vector2 _offset;                 // metros a partir do centro da nave
        [SerializeField] private float _height = 0.6f;           // altura na tela (no convés da nave)
        [SerializeField] private float _facingDegrees;           // 0 proa, 90 bombordo, -90 estibordo, 180 popa
        [SerializeField, Range(10f, 359f)] private float _arcDegrees = 180f;
        [SerializeField] private SpriteRenderer _marker;
        [SerializeField] private Color _idleColor = new Color(0.6f, 0.85f, 1f, 0.4f);
        [SerializeField] private Color _sabotagedColor = Color.red;

        private int _saboteurs;

        public ShipController Ship { get; private set; }
        public string Label => _label;
        public float FacingDegrees => _facingDegrees;
        public float ArcDegrees => _arcDegrees;
        public bool Sabotaged => _saboteurs > 0;
        public Vector2 Ground => Ship.Body.Ground + _offset;

        // Chamado pela nave no Awake dela: o hardpoint passa a saber a quem pertence.
        public void Bind(ShipController ship)
        {
            Ship = ship;
        }

        // Diz se um ponto do plano está dentro do arco de tiro deste hardpoint.
        public bool CanTarget(Vector2 point)
        {
            Vector2 toPoint = point - Ground;
            if (toPoint.sqrMagnitude < 0.0001f) return true;   // em cima do hardpoint (pirata a bordo)
            float angle = Vector2.SignedAngle(IsoProjection.Dir(_facingDegrees), toPoint);
            return Mathf.Abs(angle) <= _arcDegrees * 0.5f;
        }

        // Piratas a bordo (Fase 3) avisam quando sobem e quando saem do hardpoint.
        public void AddSaboteur() => _saboteurs++;
        public void RemoveSaboteur() => _saboteurs = Mathf.Max(0, _saboteurs - 1);

        private void LateUpdate()
        {
            if (Ship == null) return;
            transform.position = IsoProjection.ToScreen(Ground, _height);
            if (_marker != null) _marker.color = Sabotaged ? _sabotagedColor : _idleColor;
        }
    }
}
```

> O `Range` do arco vai até 359, de propósito: 360 seria um hardpoint que atira para todo lado, e a Parte 1 §3 diz que nenhum faz isso.

### 2.3 O casco: `ShipHull`

```csharp
// Caminho: Assets/_Project/Scripts/Ship/ShipHull.cs
using System;
using SpaceHauler.Data;
using UnityEngine;

namespace SpaceHauler.Ship
{
    // POR QUE: casco zero acaba a run (Parte 1 §11). Todo dano (tiros, drones,
    // piratas a bordo, asteroides) passa por aqui, então a regra "a Carenagem
    // reduz só o dano de colisão" (Parte 1 §3) fica num lugar só.
    // ESTRATÉGIA: eventos C# (event Action) avisam a UI e o TripManager quando o
    // casco muda ou chega a zero, sem eles precisarem checar todo frame. O sprite
    // da nave pisca em vermelho ao levar dano, porque os tiros inimigos são
    // instantâneos (placeholder, Parte 1 §7) e o jogador precisa perceber.
    public class ShipHull : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _bodyRenderer;
        [SerializeField] private Color _hitColor = new Color(1f, 0.3f, 0.4f);

        private ShipController _ship;
        private Color _baseColor;
        private float _flashTimer;

        // Casco máximo. Na Fase 5 esta linha passa a somar a Carenagem.
        public float Max => GameConfig.I.shipBaseHull;

        // Quanto do dano de COLISÃO é ignorado (0 a 1). Na Fase 5 esta linha passa a ler a Carenagem.
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

        // Aplica dano. collision = true para asteroides e drones kamikaze: só esse
        // dano é reduzido pela Carenagem.
        public void TakeDamage(float amount, bool collision = false)
        {
            if (IsDead || amount <= 0f) return;

            float final = collision ? amount * (1f - CollisionReduction) : amount;
            Current = Mathf.Max(0f, Current - final);
            _flashTimer = 0.1f;
            Changed?.Invoke();
            if (IsDead) Died?.Invoke();
        }

        // Recupera casco, sem passar do máximo (reparo na Estação e nível novo de Carenagem).
        public void Repair(float amount)
        {
            if (amount <= 0f) return;
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

> O campo `_ship` ainda não é usado: ele entra na conta da Carenagem na Fase 5. A Unity mostra um aviso amarelo de "campo não usado", que pode ser ignorado até lá.

### 2.4 A nave: `ShipController`

```csharp
// Caminho: Assets/_Project/Scripts/Ship/ShipController.cs
using System.Collections.Generic;
using SpaceHauler.Data;
using SpaceHauler.World;
using UnityEngine;

namespace SpaceHauler.Ship
{
    // POR QUE: a nave voa sozinha e o jogador nunca a controla (Parte 1 §3).
    // Ela é o centro de tudo: inimigos a cercam, defesas montam nela e a câmera
    // a segue.
    // ESTRATÉGIA: velocidade constante no eixo x do plano. O multiplicador de
    // velocidade existe para o pós-combustor (Fase 6). CruiseSpeed (sem o
    // multiplicador) é a velocidade que os piratas acompanham (Fase 3). Os
    // hardpoints são encontrados automaticamente entre os filhos, então basta
    // arrastar hardpoints para dentro da nave na Hierarchy.
    [RequireComponent(typeof(GroundBody), typeof(ShipHull))]
    public class ShipController : MonoBehaviour
    {
        private readonly List<Hardpoint> _hardpoints = new();

        public GroundBody Body { get; private set; }
        public ShipHull Hull { get; private set; }
        public IReadOnlyList<Hardpoint> Hardpoints => _hardpoints;
        public bool IsFlying { get; set; }
        public float SpeedMultiplier { get; set; } = 1f;
        public float CruiseSpeed => GameConfig.I.shipSpeed;
        public float Speed => CruiseSpeed * SpeedMultiplier;
        public Vector2 Ground => Body.Ground;
        public float Distance => Body.Ground.x;

        private void Awake()
        {
            Body = GetComponent<GroundBody>();
            Hull = GetComponent<ShipHull>();
            GetComponentsInChildren(_hardpoints);
            foreach (Hardpoint hardpoint in _hardpoints) hardpoint.Bind(this);
        }

        // Voa para frente enquanto o trecho estiver rolando.
        private void Update()
        {
            if (!IsFlying) return;
            Body.Ground += new Vector2(Speed * Time.deltaTime, 0f);
        }

        // Volta para o começo da rota (início de cada trecho).
        public void ResetForTrip()
        {
            Body.Ground = Vector2.zero;
            SpeedMultiplier = 1f;
            Body.Apply();
        }
    }
}
```

### 2.5 O trecho: `TripManager`

O trecho agora carrega também o **padrão de ataque** do tipo de trecho (Parte 1 §8): de que arco os piratas nascem e se há asteroides. Quem preenche isso é o nó do mapa (Fase 7); até lá, as `Test Settings` do Inspector servem para testar cada tipo.

```csharp
// Caminho: Assets/_Project/Scripts/Trip/TripManager.cs
using System;
using SpaceHauler.Data;
using SpaceHauler.Ship;
using SpaceHauler.World;
using UnityEngine;

namespace SpaceHauler.Trip
{
    // Tudo que muda de um trecho para outro (vem do nó do mapa de rota, Fase 7).
    // [Serializable] faz a struct aparecer no Inspector.
    [Serializable]
    public struct TripSettings
    {
        public string label;
        public int difficulty;          // mais alto = mais inimigos por segundo
        public bool hasBoss;
        public float scrapMultiplier;   // trechos de mais risco pagam mais
        public float spawnArcMin;       // graus em volta da nave: 0 = frente, 180 = trás
        public float spawnArcMax;
        public bool asteroids;          // Cinturão de asteroides
    }

    // POR QUE: alguém precisa dizer "o trecho começou" e "o trecho acabou, com
    // sucesso ou não". Spawner, asteroides, sucata, habilidades e a run escutam isso.
    // ESTRATÉGIA: o trecho termina com sucesso quando a nave passa do comprimento
    // do trecho e nada está "segurando" a chegada. O Cruzador (Fase 3) segura a
    // chegada enquanto está vivo, através de um contador genérico de bloqueios,
    // para o TripManager não precisar conhecer o Cruzador. O campo _startOnPlay
    // permite testar as Fases 2 a 6 sem a run da Fase 7.
    public class TripManager : MonoBehaviour
    {
        public static TripManager Current { get; private set; }

        [SerializeField] private ShipController _ship;
        [SerializeField] private BuoyLine _buoys;           // opcional: para as boias saberem o comprimento
        [SerializeField] private bool _startOnPlay = true;  // desligar na Fase 7
        [SerializeField] private TripSettings _testSettings = new TripSettings
        {
            label = "Trecho de teste",
            difficulty = 2,
            hasBoss = false,
            scrapMultiplier = 1f,
            spawnArcMin = 145f,   // Espaço aberto: por trás
            spawnArcMax = 215f,
            asteroids = false,
        };

        private int _arrivalBlockers;

        public ShipController Ship => _ship;
        public TripSettings Settings { get; private set; }
        public bool IsRunning { get; private set; }
        public float Length => GameConfig.I.tripLength;
        public float Progress01 => Mathf.Clamp01(_ship.Distance / Length);

        public event Action<TripSettings> Started;
        public event Action<bool> Ended; // true = chegou ao fim do trecho

        private void Awake()
        {
            Current = this;
        }

        private void Start()
        {
            _ship.Hull.Died += OnShipDied;
            if (_startOnPlay) StartTrip(_testSettings);
        }

        // Começa um trecho: nave no início, voando, e todo mundo avisado.
        public void StartTrip(TripSettings settings)
        {
            Settings = settings;
            _arrivalBlockers = 0;
            _ship.ResetForTrip();
            _ship.IsFlying = true;
            if (_buoys != null) _buoys.TripLength = Length;
            IsRunning = true;
            Started?.Invoke(settings);
        }

        // Algo (o Cruzador) impede o trecho de terminar enquanto existir.
        public void AddArrivalBlocker() => _arrivalBlockers++;
        public void RemoveArrivalBlocker() => _arrivalBlockers = Mathf.Max(0, _arrivalBlockers - 1);

        // Checa a chegada todo frame.
        private void Update()
        {
            if (!IsRunning) return;
            if (_ship.Distance >= Length && _arrivalBlockers == 0) End(true);
        }

        private void OnShipDied()
        {
            if (IsRunning) End(false);
        }

        // Para a nave e avisa o resultado.
        private void End(bool success)
        {
            IsRunning = false;
            _ship.IsFlying = false;
            Debug.Log(success ? "Trecho concluído." : "Nave destruída.");
            Ended?.Invoke(success);
        }
    }
}
```

### 2.6 Montar na cena

1. **GameConfig:** em `Assets/_Project/Resources/`, **Create → Space Hauler → Game Config**, com o nome exato `GameConfig`.
2. **Nave:** no objeto `Ship` da Fase 1, remova o **GroundDriverTest** (pode apagar o script) e adicione **ShipController** (o `ShipHull` entra junto). Em **ShipHull**, `Body Renderer` = o sprite `Body`.
3. **Hardpoints:** crie 6 filhos vazios do `Ship`, cada um com **Hardpoint** e um filho sprite `Circle` (escala `0.3`, **Order in Layer = 5**) ligado em `Marker`. Valores placeholder (Parte 1 §16):

| Nome | Label | Offset | Facing | Arc |
|---|---|---|---|---|
| `HP_Proa` | Proa | (3, 0) | 0 | 180 |
| `HP_BombordoFrente` | Bombordo frente | (1.2, 1.3) | 90 | 180 |
| `HP_BombordoTras` | Bombordo trás | (-1.2, 1.3) | 90 | 180 |
| `HP_EstibordoFrente` | Estibordo frente | (1.2, -1.3) | -90 | 180 |
| `HP_EstibordoTras` | Estibordo trás | (-1.2, -1.3) | -90 | 180 |
| `HP_Popa` | Popa | (-3, 0) | 180 | 180 |

4. **Trecho:** GameObject vazio `Trip` com **TripManager**, `Ship` = `Ship`, `Buoys` = `Buoys`, `Start On Play` ligado. No `BuoyLine` da Fase 1, troque `Follow` para continuar apontando para o `Ship` (é o mesmo objeto).
5. Para testar rápido, diminua `Trip Length` no `GameConfig` para `100` durante o teste (e volte para `900` depois).

### ✅ Checkpoint da Fase 2
- No Play, a nave voa sozinha, e os 6 marcadores dos hardpoints vão junto, em volta dela.
- Com `Trip Length = 100`, depois de ~10 s a nave para e o Console mostra "Trecho concluído." A boia de estibordo mais próxima do fim mostra "0 m".
- O Console não mostra erros (o casco e os arcos só serão testados de verdade quando houver inimigos, na Fase 3).

#### Problemas comuns
- **`GameConfig não encontrado`:** o asset precisa estar numa pasta chamada exatamente `Resources` e se chamar exatamente `GameConfig`.
- **Os marcadores ficam parados no começo da rota:** o `Hardpoint` precisa ser **filho** do `Ship`; a nave só encontra os hardpoints que estão dentro dela.

Próxima fase: **Inimigos e Asteroides**, com caças, drones, naves de abordagem, piratas a bordo, o Cruzador, o spawn por tipo de trecho e os asteroides.

---

# Parte 6 — Implementação Unity: Fase 3 (Inimigos e Asteroides)

## Fase 3 — Inimigos e Asteroides

> Objetivo desta fase: piratas aparecendo em volta da nave, do lado que o tipo de trecho manda, cercando e atacando, cada tipo com seu comportamento; o Cruzador segurando a chegada ao destino; e asteroides batendo no casco no Cinturão.

Duas regras novas em relação ao Fury Hauler moram nesta fase:
- **Piratas acompanham a velocidade de cruzeiro da nave** (Parte 1 §7). A `speed` de um inimigo é só a **sobra** com que ele se aproxima. Sem isso, um drone que vem pela frente voaria contra a nave a 18 + 10 = 28 m/s e chegaria antes de qualquer defesa reagir. Atordoado, o inimigo perde o embalo e fica para trás.
- **O lado de onde o pirata vem vira o lado onde ele ronda.** Caças e naves de abordagem escolhem o "posto" em volta da nave na direção de onde nasceram. Num trecho de emboscada pela frente, eles ficam na frente, e só a proa e os hardpoints da frente os alcançam.

### 3.1 Dados de um inimigo: `EnemyDef`

```csharp
// Caminho: Assets/_Project/Scripts/Data/EnemyDef.cs
using SpaceHauler.Enemies;
using UnityEngine;

namespace SpaceHauler.Data
{
    // POR QUE: os números de cada inimigo são placeholders (Parte 1 §16).
    // Separar dados (este asset) de comportamento (a classe do inimigo) deixa
    // balancear sem abrir código e criar variações (ex.: "caça blindado") só
    // duplicando o asset.
    // ESTRATÉGIA: um campo genérico "spawnDef" serve tanto para a nave de
    // abordagem (que solta piratas) quanto para o Cruzador (que chama caças).
    [CreateAssetMenu(menuName = "Space Hauler/Enemy", fileName = "Enemy")]
    public class EnemyDef : ScriptableObject
    {
        public string displayName = "Caça pirata";
        public Enemy prefab;

        [Header("Status")]
        public float maxHp = 30f;
        public float speed = 6f;           // m/s de APROXIMAÇÃO, além da velocidade de cruzeiro da nave
        public float damage = 4f;          // por ataque (ou por segundo, no pirata a bordo)
        public float fireInterval = 1f;    // segundos entre ataques
        public float contactRadius = 1.8f; // drone: distância em que explode
        public float postDistance = 4.5f;  // caça, abordagem e Cruzador: a que distância ronda a nave
        public bool isShip = true;         // o arpão e a nuvem de detritos só afetam naves
        public bool stunnable = true;

        [Header("Reforços (nave de abordagem e Cruzador)")]
        public EnemyDef spawnDef;
        public int spawnCount = 2;
        public float spawnInterval = 2f;

        [Header("Recompensa e spawn")]
        public int scrapReward = 8;
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
using SpaceHauler.Data;
using SpaceHauler.Ship;
using SpaceHauler.World;
using UnityEngine;

namespace SpaceHauler.Enemies
{
    // POR QUE: todos os inimigos têm vida, levam dano, podem ser atordoados,
    // dão sucata ao morrer e somem se ficarem longe demais. Só o jeito de se
    // mover e atacar muda de um para outro.
    // ESTRATÉGIA: classe "abstract" com o comum; cada tipo herda dela e
    // implementa só o Tick (o comportamento). Antes do Tick, todo inimigo é
    // "carregado" junto com a nave na velocidade de cruzeiro (Parte 1 §7): assim
    // o Tick só cuida da aproximação. Uma lista estática All guarda os inimigos
    // vivos, para as defesas procurarem alvos sem usar física. Quem morre avisa
    // pelo evento estático Killed (a sucata da Fase 5 escuta).
    [RequireComponent(typeof(GroundBody))]
    public abstract class Enemy : MonoBehaviour
    {
        public static readonly List<Enemy> All = new();
        public static event Action<Enemy> Killed;

        [SerializeField] private SpriteRenderer _renderer;
        [SerializeField] private Color _hitColor = Color.white;

        private float _stunTimer;
        private float _flashTimer;
        private bool _removed;
        private Color _baseColor;

        public EnemyDef Def { get; private set; }
        public float Hp { get; private set; }
        public bool IsAlive => !_removed && Hp > 0f;
        public Vector2 Ground => Body.Ground;
        protected GroundBody Body { get; private set; }
        protected ShipController Ship { get; private set; }

        // Ângulo (graus, no plano) de onde o inimigo veio em relação à nave:
        // 0 = pela frente, 180 = por trás. Os tipos que rondam a nave usam para
        // escolher o posto.
        protected float ApproachDegrees { get; private set; }

        // Pirata a bordo anda com o hardpoint, não com a velocidade de cruzeiro.
        protected virtual bool DriftsWithShip => true;

        // Pirata a bordo pode ser alvo de qualquer defesa, sem olhar o arco (Fase 4).
        public virtual bool IsAboard => false;

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

            // Atordoado: perde o embalo (não acompanha a nave) e fica para trás.
            if (_stunTimer > 0f) _stunTimer -= dt;
            else
            {
                if (DriftsWithShip) Body.Ground += new Vector2(Ship.CruiseSpeed * dt, 0f);
                Tick(dt);
            }

            if (IsAlive && Vector2.Distance(Body.Ground, Ship.Ground) > GameConfig.I.enemyDespawnDistance) Remove(false);
        }

        // O comportamento de cada tipo de inimigo, rodado uma vez por frame.
        protected abstract void Tick(float dt);

        // Anda em linha reta até um ponto do plano (na sobra de velocidade dele)
        // e devolve a distância que falta.
        protected float MoveTowards(Vector2 target, float dt)
        {
            Body.Ground = Vector2.MoveTowards(Body.Ground, target, Def.speed * dt);
            return Vector2.Distance(Body.Ground, target);
        }

        // Um ponto em volta da nave, do lado de onde o inimigo veio, com uma folga
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

        // Atordoa (arpão, nuvem de detritos). Só funciona em quem pode ser atordoado.
        public void Stun(float seconds)
        {
            if (Def.stunnable) _stunTimer = Mathf.Max(_stunTimer, seconds);
        }

        // Some sem dar sucata (fim do trecho, ficou longe, explodiu sozinho).
        public void Despawn() => Remove(false);

        // Tira o inimigo do jogo. Só quem foi morto pelas defesas avisa Killed.
        protected void Remove(bool killedByPlayer)
        {
            if (_removed) return;
            _removed = true;
            if (killedByPlayer) Killed?.Invoke(this);
            OnRemoved();
            Destroy(gameObject);
        }

        // Gancho para os tipos que precisam limpar algo ao sair (pirata, Cruzador).
        protected virtual void OnRemoved() { }

        // Procura o inimigo vivo mais perto de um hardpoint, dentro do alcance e
        // do arco do hardpoint. Pirata a bordo ignora o arco se a regra estiver
        // ligada (GameConfig.pirateIgnoresArcs, Parte 1 §7).
        public static Enemy FindNearest(Hardpoint hardpoint, float range, bool shipsOnly)
        {
            Enemy best = null;
            float bestSqr = range * range;
            Vector2 from = hardpoint.Ground;
            bool aboardAnywhere = GameConfig.I.pirateIgnoresArcs;

            foreach (Enemy enemy in All)
            {
                if (!enemy.IsAlive || (shipsOnly && !enemy.Def.isShip)) continue;
                float sqr = (enemy.Ground - from).sqrMagnitude;
                if (sqr > bestSqr) continue;
                bool inArc = (enemy.IsAboard && aboardAnywhere) || hardpoint.CanTarget(enemy.Ground);
                if (!inArc) continue;
                best = enemy;
                bestSqr = sqr;
            }
            return best;
        }
    }
}
```

> `Destroy` não apaga o objeto na hora: ele some no fim do frame. Por isso existe o `_removed`, que impede o mesmo inimigo de morrer duas vezes no mesmo frame (por exemplo, atingido por dois autocanhões). Pelo mesmo motivo, as defesas podem percorrer `Enemy.All` com `foreach` e matar inimigos no meio do laço: a lista só muda no fim do frame.

### 3.3 Caça pirata: `FighterEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/FighterEnemy.cs
using SpaceHauler.Data;
using SpaceHauler.Ship;
using UnityEngine;

namespace SpaceHauler.Enemies
{
    // POR QUE: o inimigo básico (Parte 1 §7): ronda a nave do lado de onde veio
    // e atira.
    // ESTRATÉGIA: escolhe um "posto" em volta da nave (PickPost, do lado de onde
    // nasceu) e persegue esse posto. Como o posto anda junto com a nave e o caça
    // tem uma sobra de velocidade, ele chega e fica grudado. Só atira estando
    // perto do posto, então o pós-combustor (Fase 6) o faz parar de atirar.
    public class FighterEnemy : Enemy
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

### 3.4 Drone kamikaze: `DroneEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/DroneEnemy.cs
namespace SpaceHauler.Enemies
{
    // POR QUE: cria urgência (Parte 1 §7): se não for destruído a tempo, bate e
    // tira muito casco de uma vez.
    // ESTRATÉGIA: vai direto no centro da nave. Ao chegar perto o suficiente,
    // causa dano de COLISÃO (a Carenagem reduz, Fase 5) e some sem dar sucata.
    public class DroneEnemy : Enemy
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

### 3.5 Nave de abordagem: `BoarderEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/BoarderEnemy.cs
using SpaceHauler.Data;
using SpaceHauler.Ship;
using SpaceHauler.Trip;
using UnityEngine;

namespace SpaceHauler.Enemies
{
    // POR QUE: encosta e solta piratas que sobem na nave (Parte 1 §7).
    // ESTRATÉGIA: encosta bem perto, do lado de onde veio; parada ali, solta um
    // pirata a cada spawnInterval no hardpoint mais perto dela. Assim, quem
    // abordou pela proa sabota a proa. Quando acaba a "tripulação", ela vai
    // embora pelo mesmo lado até sumir.
    public class BoarderEnemy : Enemy
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
                Body.Ground += _post.normalized * Def.speed * dt;
                return;
            }

            if (MoveTowards(Ship.Ground + _post, dt) > 1f) return;

            _timer -= dt;
            if (_timer > 0f) return;
            _timer = Def.spawnInterval;
            _left--;
            DeployPirate();
        }

        // Cria um pirata já em cima do hardpoint mais perto da nave de abordagem.
        private void DeployPirate()
        {
            if (Def.spawnDef == null || Ship.Hardpoints.Count == 0) return;
            Hardpoint nearest = Ship.Hardpoints[0];
            float bestSqr = float.MaxValue;
            foreach (Hardpoint hardpoint in Ship.Hardpoints)
            {
                float sqr = (hardpoint.Ground - Ground).sqrMagnitude;
                if (sqr >= bestSqr) continue;
                nearest = hardpoint;
                bestSqr = sqr;
            }
            if (EnemySpawner.Current.Spawn(Def.spawnDef, nearest.Ground) is PirateEnemy pirate)
                pirate.Board(nearest);
        }
    }
}
```

### 3.6 Pirata a bordo: `PirateEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/PirateEnemy.cs
using SpaceHauler.Ship;

namespace SpaceHauler.Enemies
{
    // POR QUE: o comportamento do pirata a bordo está Em aberto (Parte 1 §7). O
    // placeholder: ele sabota a defesa do hardpoint onde subiu e machuca o casco
    // aos poucos até ser morto.
    // ESTRATÉGIA: fica "colado" na posição do hardpoint todo frame (por isso não
    // é carregado pela velocidade de cruzeiro: DriftsWithShip = false). Avisa o
    // hardpoint ao subir e ao sair (morto ou fim do trecho), para a sabotagem
    // nunca ficar presa. O dano é por segundo (Def.damage × dt).
    public class PirateEnemy : Enemy
    {
        private Hardpoint _hardpoint;

        protected override bool DriftsWithShip => false;
        public override bool IsAboard => _hardpoint != null;

        // Sobe no hardpoint. Chamado pela nave de abordagem logo depois de criar o pirata.
        public void Board(Hardpoint hardpoint)
        {
            _hardpoint = hardpoint;
            _hardpoint.AddSaboteur();
        }

        protected override void Tick(float dt)
        {
            if (_hardpoint == null) return;
            Body.Ground = _hardpoint.Ground;
            Ship.Hull.TakeDamage(Def.damage * dt);
        }

        protected override void OnRemoved()
        {
            if (_hardpoint != null) _hardpoint.RemoveSaboteur();
            _hardpoint = null;
        }
    }
}
```

### 3.7 Chefe: `CruiserEnemy`

```csharp
// Caminho: Assets/_Project/Scripts/Enemies/CruiserEnemy.cs
using SpaceHauler.Data;
using SpaceHauler.Ship;
using SpaceHauler.Trip;
using UnityEngine;

namespace SpaceHauler.Enemies
{
    // POR QUE: o último trecho tem o Cruzador pirata (Parte 1 §7). Placeholder:
    // ele ronda e atira como um caça muito resistente e chama reforços.
    // ESTRATÉGIA: herda do FighterEnemy (reaproveita "rondar e atirar") e soma um
    // timer de reforços. Enquanto existir, segura a chegada ao destino pelo
    // contador do TripManager, se a regra bossBlocksArrival estiver ligada.
    public class CruiserEnemy : FighterEnemy
    {
        private float _spawnTimer;
        private bool _blocking;

        public override void Init(EnemyDef def, ShipController ship, Vector2 ground)
        {
            base.Init(def, ship, ground);
            _spawnTimer = def.spawnInterval;
            if (GameConfig.I.bossBlocksArrival)
            {
                TripManager.Current.AddArrivalBlocker();
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
            if (_blocking) TripManager.Current.RemoveArrivalBlocker();
            _blocking = false;
        }
    }
}
```

### 3.8 Quem cria os inimigos: `EnemySpawner`

```csharp
// Caminho: Assets/_Project/Scripts/Trip/EnemySpawner.cs
using System.Collections.Generic;
using SpaceHauler.Data;
using SpaceHauler.Enemies;
using SpaceHauler.World;
using UnityEngine;

namespace SpaceHauler.Trip
{
    // POR QUE: a pressão de inimigos precisa crescer com a dificuldade do
    // trecho (Parte 1 §8), e o LADO de onde eles vêm depende do tipo de trecho,
    // sem ninguém escrever ondas à mão para cada trecho gerado.
    // ESTRATÉGIA: "orçamento de spawn". A cada segundo entram alguns pontos
    // (mais em trechos difíceis). O spawner sorteia o próximo inimigo entre os
    // permitidos na dificuldade e espera juntar pontos suficientes para ele.
    // Sortear antes de juntar evita que só os baratos apareçam. Cada inimigo
    // nasce num ângulo sorteado dentro do arco do trecho (TripSettings), a uma
    // distância fixa da nave. O Cruzador nasce uma vez, ao passar de certa
    // porcentagem do trecho.
    public class EnemySpawner : MonoBehaviour
    {
        public static EnemySpawner Current { get; private set; }

        [SerializeField] private TripManager _trip;
        [SerializeField] private List<EnemyDef> _pool = new(); // inimigos comuns
        [SerializeField] private EnemyDef _cruiser;

        private readonly List<EnemyDef> _eligible = new();
        private float _budget;
        private EnemyDef _next;
        private bool _cruiserSpawned;
        private bool _active;

        private void Awake()
        {
            Current = this;
        }

        // Assina os eventos do trecho enquanto o spawner estiver ativo.
        private void OnEnable()
        {
            _trip.Started += OnTripStarted;
            _trip.Ended += OnTripEnded;
        }

        private void OnDisable()
        {
            _trip.Started -= OnTripStarted;
            _trip.Ended -= OnTripEnded;
        }

        private void OnTripStarted(TripSettings settings)
        {
            ClearAll();
            _budget = 0f;
            _next = null;
            _cruiserSpawned = false;
            _active = true;
        }

        private void OnTripEnded(bool success)
        {
            _active = false;
            ClearAll();
        }

        private void Update()
        {
            if (!_active) return;
            GameConfig cfg = GameConfig.I;
            TripSettings settings = _trip.Settings;

            if (settings.hasBoss && !_cruiserSpawned && _cruiser != null && _trip.Progress01 >= cfg.bossSpawnAtProgress)
            {
                _cruiserSpawned = true;
                SpawnAround(_cruiser);
            }

            _budget += (cfg.spawnBudgetBase + cfg.spawnBudgetPerDifficulty * settings.difficulty) * Time.deltaTime;

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

        // Cria um inimigo em volta da nave, num ângulo dentro do arco do tipo de
        // trecho (ex.: 145° a 215° = por trás; 0° a 360° = de qualquer lado).
        public Enemy SpawnAround(EnemyDef def)
        {
            GameConfig cfg = GameConfig.I;
            TripSettings settings = _trip.Settings;
            float degrees = Random.Range(settings.spawnArcMin, settings.spawnArcMax);
            float distance = Random.Range(cfg.spawnDistanceMin, cfg.spawnDistanceMax);
            return Spawn(def, _trip.Ship.Ground + IsoProjection.Dir(degrees) * distance);
        }

        // Cria um inimigo num ponto exato do plano.
        public Enemy Spawn(EnemyDef def, Vector2 ground)
        {
            Enemy enemy = Instantiate(def.prefab, transform);
            enemy.Init(def, _trip.Ship, ground);
            return enemy;
        }

        // Tira todos os inimigos do jogo, sem dar sucata.
        public void ClearAll()
        {
            for (int i = Enemy.All.Count - 1; i >= 0; i--) Enemy.All[i].Despawn();
        }
    }
}
```

### 3.9 Asteroides: `Asteroid` e `AsteroidField`

Os asteroides (Parte 1 §8) não são inimigos: não têm vida, não dão sucata e as defesas não miram neles. Por isso não herdam de `Enemy` e não entram em `Enemy.All`.

```csharp
// Caminho: Assets/_Project/Scripts/Trip/Asteroid.cs
using SpaceHauler.World;
using UnityEngine;

namespace SpaceHauler.Trip
{
    // POR QUE: uma rocha parada no espaço, no caminho da nave. Não pode ser
    // destruída (Parte 1 §8): ou bate no casco, ou fica para trás.
    // ESTRATÉGIA: só guarda o raio e gira o sprite devagar, para dar vida. Quem
    // decide se bateu é o AsteroidField, que conhece a nave.
    [RequireComponent(typeof(GroundBody))]
    public class Asteroid : MonoBehaviour
    {
        [SerializeField] private Transform _visual;      // o sprite, para girar
        [SerializeField] private float _maxSpin = 40f;  // graus por segundo

        private float _spin;

        public GroundBody Body { get; private set; }
        public float Radius { get; private set; }

        private void Awake()
        {
            Body = GetComponent<GroundBody>();
        }

        // Chamado pelo AsteroidField logo depois de criar a rocha.
        public void Init(Vector2 ground, float radius)
        {
            Radius = radius;
            Body.Ground = ground;
            Body.Apply();
            _spin = Random.Range(-_maxSpin, _maxSpin);
            // O sprite placeholder tem 1 unidade de largura: escala = diâmetro na tela.
            if (_visual != null) _visual.localScale = Vector3.one * radius * 2f * IsoProjection.HalfWidth * 2f;
        }

        private void Update()
        {
            if (_visual != null) _visual.Rotate(0f, 0f, _spin * Time.deltaTime);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Trip/AsteroidField.cs
using System.Collections.Generic;
using SpaceHauler.Data;
using UnityEngine;

namespace SpaceHauler.Trip
{
    // POR QUE: o Cinturão de asteroides cobra Carenagem (Parte 1 §8): rochas no
    // caminho batem no casco e nenhuma defesa as destrói.
    // ESTRATÉGIA: só funciona em trechos com TripSettings.asteroids. Um
    // "orçamento" por segundo (como o do spawner, mas sem sorteio de tipo) cria
    // rochas à frente da nave, espalhadas para os lados. Todo frame, cada rocha
    // perto da nave vira colisão: dano proporcional ao raio, marcado como
    // colisão (a Carenagem reduz), e a rocha some. Rocha que ficou para trás
    // também some. Tudo por distância, sem física.
    public class AsteroidField : MonoBehaviour
    {
        [SerializeField] private TripManager _trip;
        [SerializeField] private Asteroid _prefab;

        private readonly List<Asteroid> _asteroids = new();
        private float _budget;
        private bool _active;

        private void OnEnable()
        {
            _trip.Started += OnTripStarted;
            _trip.Ended += OnTripEnded;
        }

        private void OnDisable()
        {
            _trip.Started -= OnTripStarted;
            _trip.Ended -= OnTripEnded;
        }

        private void OnTripStarted(TripSettings settings)
        {
            ClearAll();
            _budget = 0f;
            _active = settings.asteroids;
        }

        private void OnTripEnded(bool success)
        {
            _active = false;
            ClearAll();
        }

        private void Update()
        {
            if (!_active) return;
            GameConfig cfg = GameConfig.I;
            Vector2 ship = _trip.Ship.Ground;

            _budget += cfg.asteroidsPerSecond * Time.deltaTime;
            while (_budget >= 1f)
            {
                _budget -= 1f;
                Spawn(cfg, ship);
            }

            // De trás para frente: dá para tirar da lista no meio do laço.
            for (int i = _asteroids.Count - 1; i >= 0; i--)
            {
                Asteroid rock = _asteroids[i];
                Vector2 rockGround = rock.Body.Ground;
                if (Vector2.Distance(rockGround, ship) < rock.Radius + cfg.shipRadius)
                {
                    _trip.Ship.Hull.TakeDamage(cfg.asteroidDamagePerRadius * rock.Radius, collision: true);
                    RemoveAt(i);
                    if (!_trip.IsRunning) return;   // a batida destruiu a nave
                }
                else if (rockGround.x < ship.x - 20f) RemoveAt(i);
            }
        }

        // Cria uma rocha à frente da nave, num lado sorteado.
        private void Spawn(GameConfig cfg, Vector2 ship)
        {
            Asteroid rock = Instantiate(_prefab, transform);
            var ground = new Vector2(
                ship.x + Random.Range(cfg.asteroidAheadMin, cfg.asteroidAheadMax),
                Random.Range(-cfg.asteroidLateralSpread, cfg.asteroidLateralSpread));
            rock.Init(ground, Random.Range(cfg.asteroidRadiusMin, cfg.asteroidRadiusMax));
            _asteroids.Add(rock);
        }

        private void RemoveAt(int index)
        {
            Destroy(_asteroids[index].gameObject);
            _asteroids.RemoveAt(index);
        }

        private void ClearAll()
        {
            for (int i = _asteroids.Count - 1; i >= 0; i--) RemoveAt(i);
        }
    }
}
```

> Os asteroides ficam parados no plano: quem anda é a nave. Por isso eles não precisam de `Update` de movimento, e o `GroundBody` de cada um só os desenha.

### 3.10 Criar prefabs e assets

1. **Prefabs de inimigo** (em `Prefabs/Enemies/`), cada um: GameObject vazio + **GroundBody** (no `SortingGroup`, **Sorting Layer = Mundo**) + o script do tipo + um filho sprite `Circle` ligado no campo `Renderer` do script.

| Prefab | Script | Sprite (escala, cor) | GroundBody |
|---|---|---|---|
| `Fighter` | FighterEnemy | 0.5, vermelho | — |
| `Drone` | DroneEnemy | 0.6, cinza com contorno vermelho | — |
| `Boarder` | BoarderEnemy | 1.0, roxo | — |
| `Pirate` | PirateEnemy | 0.35, vermelho-claro | Height 0.6, Sort Bias 50 |
| `Cruiser` | CruiserEnemy | 2.0, vinho escuro | — |

2. **Prefab `Asteroid`** (em `Prefabs/`): GameObject vazio + **GroundBody** (`SortingGroup` em **Mundo**) + **Asteroid** + filho sprite `Circle` marrom-acinzentado (`#5A4E50`) ligado em `Visual`.
3. **Assets de inimigo** (em `ScriptableObjects/Enemies/`, **Create → Space Hauler → Enemy**), com os números da Parte 1 §16 (campos não listados ficam no padrão):

| Asset | Prefab | HP | Speed | Damage | Fire Int. | Contact | Post Dist. | Is Ship | Stunnable | Spawn Def / Count / Interval | Scrap | Cost | Min Diff. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `Fighter` | Fighter | 30 | 6 | 4 | 1 | — | 4.5 | sim | sim | — | 8 | 1 | 0 |
| `Drone` | Drone | 50 | 8 | 45 | — | 1.8 | — | sim | sim | — | 12 | 2 | 1 |
| `Boarder` | Boarder | 80 | 4 | — | — | — | 2.6 | sim | sim | Pirate / 2 / 2 | 15 | 3 | 2 |
| `Pirate` | Pirate | 20 | — | 6 | — | — | — | **não** | **não** | — | 3 | — | — |
| `Cruiser` | Cruiser | 1500 | 2 | 15 | 1.5 | — | 6 | sim | **não** | Fighter / — / 6 | 150 | — | — |

4. **Spawner:** GameObject `Enemies` com **EnemySpawner**: `Trip` = `Trip`, `Pool` = Fighter, Drone, Boarder, `Cruiser` = Cruiser.
5. **Asteroides:** GameObject `Asteroids` com **AsteroidField**: `Trip` = `Trip`, `Prefab` = `Asteroid`.

### ✅ Checkpoint da Fase 3
- No Play (dificuldade de teste 2, arco 145° a 215°), caças aparecem **atrás**, rondam a popa e os lados de trás, e a nave pisca vermelho a cada tiro.
- Troque as `Test Settings` do `TripManager` para o arco `-110` a `110`: agora eles chegam **pela frente e pelos lados**, e ficam rondando ali. Com `0` a `360`, chegam de todo lado.
- Drones vêm direto, somem ao encostar e a nave pisca. Nenhum inimigo vindo pela frente "atravessa" a nave em alta velocidade: todos chegam devagar, porque acompanham a velocidade de cruzeiro.
- Naves de abordagem encostam e soltam pontos vermelhos no hardpoint **mais perto delas**; o marcador do hardpoint fica vermelho (sabotado).
- Com `Asteroids` ligado nas `Test Settings`, rochas aparecem à frente; as que estão no caminho somem ao encostar e a nave pisca. As outras ficam para trás.
- Com `Has Boss` ligado, o Cruzador aparece em 30% do trecho e a nave **não** termina o trecho enquanto ele existir.
- Sem defesas, a nave acaba destruída, o Console mostra "Nave destruída." e todos os inimigos e asteroides somem.

#### Problemas comuns
- **`NullReferenceException` no `EnemySpawner.OnEnable` ou no `AsteroidField.OnEnable`:** o campo `Trip` está vazio.
- **Inimigos que vêm pela frente passam direto pela nave e somem:** o `Enemy.Update` não está somando a velocidade de cruzeiro (`DriftsWithShip`). Sem isso, eles ficam parados no plano e a nave passa por eles.
- **Os inimigos nunca alcançam a nave:** a `Speed` do asset é a **sobra** de aproximação; com `0`, eles só acompanham e nunca chegam.
- **Piratas a bordo deslizam para longe do hardpoint:** o `PirateEnemy` precisa de `DriftsWithShip => false`; senão ele é carregado para frente além de grudar no hardpoint.
- **Inimigos aparecem por cima da nave quando deveriam estar atrás (ou o contrário):** o `SortingGroup` do prefab está numa Sorting Layer diferente da da nave. Nave, inimigos e asteroides ficam todos em `Mundo`.

Próxima fase: **Defesas**, com as 4 defesas montadas nos hardpoints e mirando sozinhas dentro do arco.

---

# Parte 7 — Implementação Unity: Fase 4 (Defesas)

## Fase 4 — Defesas

> Objetivo desta fase: autocanhão, canhão de plasma, arpão magnético e campo elétrico montados nos hardpoints, cada um atacando sozinho do seu jeito e só dentro do arco do seu hardpoint.

### 4.1 Dados de uma defesa: `DefenseDef`

```csharp
// Caminho: Assets/_Project/Scripts/Data/DefenseDef.cs
using SpaceHauler.Defenses;
using UnityEngine;

namespace SpaceHauler.Data
{
    // POR QUE: preços e números das defesas são placeholders (Parte 1 §16).
    // ESTRATÉGIA: um asset por defesa, com todos os campos que qualquer defesa
    // pode precisar; cada tipo usa só os seus (ex.: só o arpão usa stunSeconds).
    [CreateAssetMenu(menuName = "Space Hauler/Defense", fileName = "Defense")]
    public class DefenseDef : ScriptableObject
    {
        public string displayName = "Autocanhão";
        public Sprite icon;
        public Defense prefab;

        [Header("Economia")]
        public int cost = 40;
        public int upgradeCostPerLevel = 40; // custo para subir = isto × nível atual
        public int maxLevel = 3;

        [Header("Combate")]
        public float range = 9f;             // metros
        public float damage = 6f;            // por tiro, ou por segundo (plasma, campo elétrico)
        public float fireInterval = 0.15f;
        public float bonusPerLevel = 0.35f;  // +35% por nível acima do 1
        public float stunSeconds;            // arpão magnético

        [Header("Desbloqueio (placeholder, Parte 1 §10)")]
        public int unlockAtBestTrips;        // trechos concluídos na melhor run para liberar
    }
}
```

> No Fury Hauler este asset tinha um campo `damageReduction`, usado pela blindagem com espinhos. Aqui ele não existe: nenhuma defesa reduz dano. Quem protege o casco é a Carenagem (Fase 5).

### 4.2 A base de toda defesa: `Defense`

```csharp
// Caminho: Assets/_Project/Scripts/Defenses/Defense.cs
using SpaceHauler.Data;
using SpaceHauler.Ship;
using SpaceHauler.Trip;
using UnityEngine;

namespace SpaceHauler.Defenses
{
    // POR QUE: toda defesa fica num hardpoint, tem nível, sabe quanto já custou
    // (para a venda, Fase 5) e para de funcionar se um pirata sabotar o hardpoint.
    // ESTRATÉGIA: classe abstract com o comum; cada tipo implementa só o Tick.
    // Um LineRenderer opcional desenha o rastro do tiro por uma fração de
    // segundo, já que os acertos são instantâneos (sem projéteis voando).
    public abstract class Defense : MonoBehaviour
    {
        [SerializeField] private LineRenderer _line;

        private float _lineTimer;

        public DefenseDef Def { get; private set; }
        public Hardpoint Hardpoint { get; private set; }
        public int Level { get; private set; } = 1;
        public int TotalSpent { get; private set; }
        public bool CanUpgrade => Level < Def.maxLevel;
        public int UpgradeCost => Def.upgradeCostPerLevel * Level;

        // Multiplicador dos números pelo nível: 1.0 no nível 1, 1.35 no 2, 1.7 no 3.
        protected float LevelMultiplier => 1f + Def.bonusPerLevel * (Level - 1);
        protected float Damage => Def.damage * LevelMultiplier;

        // Chamado pelo hardpoint logo depois de criar a defesa.
        public void Install(DefenseDef def, Hardpoint hardpoint)
        {
            Def = def;
            Hardpoint = hardpoint;
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

        private void Update()
        {
            UpdateLine(Time.deltaTime);
            if (Hardpoint == null) return;

            bool running = TripManager.Current != null && TripManager.Current.IsRunning;
            if (Hardpoint.Sabotaged || !running)
            {
                OnIdle();
                return;
            }
            Tick(Time.deltaTime);
        }

        // O comportamento da defesa, rodado uma vez por frame.
        protected abstract void Tick(float dt);

        // Chamado nos frames em que a defesa não pode agir (sabotada, trecho parado).
        protected virtual void OnIdle() { }

        // Mostra um rastro da defesa até um ponto da tela por alguns segundos.
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

### 4.3 Autocanhão: `AutocannonDefense`

```csharp
// Caminho: Assets/_Project/Scripts/Defenses/AutocannonDefense.cs
using SpaceHauler.Enemies;

namespace SpaceHauler.Defenses
{
    // POR QUE: a defesa padrão (Parte 1 §4): tiro rápido, um alvo por vez.
    // ESTRATÉGIA: a cada fireInterval, acerta o inimigo mais próximo dentro do
    // alcance e do arco do hardpoint. Piratas a bordo contam como alvo (e, com
    // a regra pirateIgnoresArcs, mesmo fora do arco).
    public class AutocannonDefense : Defense
    {
        private float _cooldown;

        protected override void Tick(float dt)
        {
            _cooldown -= dt;
            if (_cooldown > 0f) return;

            Enemy target = Enemy.FindNearest(Hardpoint, Def.range, shipsOnly: false);
            if (target == null) return;

            _cooldown = Def.fireInterval;
            target.TakeDamage(Damage);
            ShowLine(target.transform.position, 0.05f);
        }
    }
}
```

### 4.4 Canhão de plasma: `PlasmaDefense`

```csharp
// Caminho: Assets/_Project/Scripts/Defenses/PlasmaDefense.cs
using SpaceHauler.Enemies;
using SpaceHauler.World;
using UnityEngine;

namespace SpaceHauler.Defenses
{
    // POR QUE: dano em área de curto alcance (Parte 1 §4), bom contra naves de
    // abordagem encostadas e piratas a bordo.
    // ESTRATÉGIA: mira no inimigo mais próximo e queima todos que estiverem num
    // cone apontado para ele, com dano por segundo (Damage × dt). O efeito
    // visual é um ParticleSystem girado para a direção do cone na tela.
    public class PlasmaDefense : Defense
    {
        [SerializeField] private ParticleSystem _plasma;
        [SerializeField] private float _coneDegrees = 60f;

        protected override void Tick(float dt)
        {
            Enemy target = Enemy.FindNearest(Hardpoint, Def.range, shipsOnly: false);
            if (target == null)
            {
                SetPlasma(false, Vector2.zero);
                return;
            }

            Vector2 aim = target.Ground - Hardpoint.Ground;
            if (aim.sqrMagnitude < 0.01f) aim = IsoProjection.Dir(Hardpoint.FacingDegrees);
            aim.Normalize();

            float rangeSqr = Def.range * Def.range;
            foreach (Enemy enemy in Enemy.All)
            {
                if (!enemy.IsAlive) continue;
                Vector2 toEnemy = enemy.Ground - Hardpoint.Ground;
                if (toEnemy.sqrMagnitude > rangeSqr) continue;
                if (toEnemy.sqrMagnitude > 0.01f && Vector2.Angle(aim, toEnemy) > _coneDegrees * 0.5f) continue;
                enemy.TakeDamage(Damage * dt);
            }

            SetPlasma(true, aim);
        }

        protected override void OnIdle() => SetPlasma(false, Vector2.zero);

        // Liga/desliga as partículas e gira para a direção do cone na tela.
        private void SetPlasma(bool on, Vector2 groundAim)
        {
            if (_plasma == null) return;
            if (!on)
            {
                if (_plasma.isPlaying) _plasma.Stop();
                return;
            }

            Vector3 screenAim = IsoProjection.ToScreen(groundAim);
            float angle = Mathf.Atan2(screenAim.y, screenAim.x) * Mathf.Rad2Deg;
            _plasma.transform.rotation = Quaternion.Euler(0f, 0f, angle);
            if (!_plasma.isPlaying) _plasma.Play();
        }
    }
}
```

> O cone é calculado a partir do inimigo mais próximo **dentro do arco**, mas depois queima todo mundo no cone, mesmo quem está fora do arco do hardpoint. Num hardpoint lateral isso quase nunca acontece (o cone de 60° cabe no arco de 180°); é uma simplificação aceitável para o MVP.

### 4.5 Arpão magnético: `HarpoonDefense`

```csharp
// Caminho: Assets/_Project/Scripts/Defenses/HarpoonDefense.cs
using SpaceHauler.Enemies;

namespace SpaceHauler.Defenses
{
    // POR QUE: "prende" uma nave inimiga (Parte 1 §4): ela perde o embalo e fica
    // para trás. O efeito exato de "prender" ainda está Em aberto.
    // ESTRATÉGIA: tiro lento e forte, só em naves, que causa dano e atordoa.
    // Atordoado, o inimigo deixa de acompanhar a velocidade de cruzeiro (Fase 3),
    // então cai para trás sozinho e pode até sair do jogo.
    public class HarpoonDefense : Defense
    {
        private float _cooldown;

        protected override void Tick(float dt)
        {
            _cooldown -= dt;
            if (_cooldown > 0f) return;

            Enemy target = Enemy.FindNearest(Hardpoint, Def.range, shipsOnly: true);
            if (target == null) return;

            _cooldown = Def.fireInterval;
            target.TakeDamage(Damage);
            target.Stun(Def.stunSeconds * LevelMultiplier);
            ShowLine(target.transform.position, 0.2f);
        }
    }
}
```

### 4.6 Campo elétrico: `ElectricFieldDefense`

```csharp
// Caminho: Assets/_Project/Scripts/Defenses/ElectricFieldDefense.cs
using SpaceHauler.Enemies;
using UnityEngine;

namespace SpaceHauler.Defenses
{
    // POR QUE: defesa passiva (Parte 1 §4): dá choque em quem chega perto do
    // hardpoint, inclusive nos piratas a bordo. É a resposta "garantida" à
    // abordagem, porque não depende de mira nem de arco.
    // ESTRATÉGIA: dano por segundo a todos dentro do alcance (curto) do
    // hardpoint, sem olhar o arco. Não reduz dano do casco: isso é da Carenagem.
    // Um ParticleSystem opcional mostra as faíscas enquanto alguém está levando
    // choque.
    public class ElectricFieldDefense : Defense
    {
        [SerializeField] private ParticleSystem _sparks;

        protected override void Tick(float dt)
        {
            bool zapping = false;
            float rangeSqr = Def.range * Def.range;
            foreach (Enemy enemy in Enemy.All)
            {
                if (!enemy.IsAlive) continue;
                if ((enemy.Ground - Hardpoint.Ground).sqrMagnitude > rangeSqr) continue;
                enemy.TakeDamage(Damage * dt);
                zapping = true;
            }
            SetSparks(zapping);
        }

        protected override void OnIdle() => SetSparks(false);

        private void SetSparks(bool on)
        {
            if (_sparks == null) return;
            if (on && !_sparks.isPlaying) _sparks.Play();
            else if (!on && _sparks.isPlaying) _sparks.Stop();
        }
    }
}
```

### 4.7 `Hardpoint` (versão final)

Substitua o arquivo inteiro da Fase 2 por este. As novidades: guardar a defesa montada, montar/desmontar, uma defesa de teste e os destaques visuais que a alocação (Fase 5) vai usar.

```csharp
// Caminho: Assets/_Project/Scripts/Ship/Hardpoint.cs
using SpaceHauler.Data;
using SpaceHauler.Defenses;
using SpaceHauler.World;
using UnityEngine;

namespace SpaceHauler.Ship
{
    // POR QUE: a decisão central do jogador é "qual defesa em qual hardpoint"
    // (Parte 1 §3). Cada hardpoint tem uma posição na nave, um arco de tiro
    // (nunca 360°) e no máximo uma defesa montada.
    // ESTRATÉGIA: o hardpoint guarda um deslocamento no plano em relação ao
    // centro da nave, então sua posição real é sempre "nave + deslocamento". O
    // arco é um leque: direção central + abertura. O marcador colorido mostra o
    // estado: vazio, destacado para compra, selecionado ou sabotado.
    // DefaultExecutionOrder(50) faz o hardpoint se posicionar depois do
    // GroundBody da nave.
    [DefaultExecutionOrder(50)]
    public class Hardpoint : MonoBehaviour
    {
        [SerializeField] private string _label = "Proa";
        [SerializeField] private Vector2 _offset;                 // metros a partir do centro da nave
        [SerializeField] private float _height = 0.6f;           // altura na tela (no convés da nave)
        [SerializeField] private float _facingDegrees;           // 0 proa, 90 bombordo, -90 estibordo, 180 popa
        [SerializeField, Range(10f, 359f)] private float _arcDegrees = 180f;
        [SerializeField] private SpriteRenderer _marker;
        [SerializeField] private Color _idleColor = new Color(0.6f, 0.85f, 1f, 0.4f);
        [SerializeField] private Color _highlightColor = new Color(0.4f, 1f, 0.75f, 0.9f);
        [SerializeField] private Color _selectedColor = Color.yellow;
        [SerializeField] private Color _sabotagedColor = Color.red;
        [SerializeField] private DefenseDef _testDefense;        // só para teste; deixe vazio na Fase 7

        private int _saboteurs;

        public ShipController Ship { get; private set; }
        public Defense Installed { get; private set; }
        public bool IsEmpty => Installed == null;
        public string Label => _label;
        public float FacingDegrees => _facingDegrees;
        public float ArcDegrees => _arcDegrees;
        public bool Sabotaged => _saboteurs > 0;
        public bool Highlighted { get; set; } // hardpoint vazio onde dá para montar a defesa escolhida
        public bool Selected { get; set; }    // hardpoint aberto no painel de defesa
        public Vector2 Ground => Ship.Body.Ground + _offset;

        // Chamado pela nave no Awake dela: o hardpoint passa a saber a quem pertence.
        public void Bind(ShipController ship)
        {
            Ship = ship;
        }

        private void Start()
        {
            if (_testDefense != null) Install(_testDefense);
        }

        // Diz se um ponto do plano está dentro do arco de tiro deste hardpoint.
        public bool CanTarget(Vector2 point)
        {
            Vector2 toPoint = point - Ground;
            if (toPoint.sqrMagnitude < 0.0001f) return true;   // em cima do hardpoint (pirata a bordo)
            float angle = Vector2.SignedAngle(IsoProjection.Dir(_facingDegrees), toPoint);
            return Mathf.Abs(angle) <= _arcDegrees * 0.5f;
        }

        // Cria a defesa como filha do hardpoint. Não cobra nada: quem cobra é a alocação.
        public Defense Install(DefenseDef def)
        {
            if (!IsEmpty || def == null || def.prefab == null) return null;
            Installed = Instantiate(def.prefab, transform);
            Installed.transform.localPosition = Vector3.zero;
            Installed.Install(def, this);
            return Installed;
        }

        // Desmonta e destrói a defesa do hardpoint.
        public void Clear()
        {
            if (IsEmpty) return;
            Destroy(Installed.gameObject);
            Installed = null;
        }

        // Piratas a bordo (Fase 3) avisam quando sobem e quando saem do hardpoint.
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
            else if (Highlighted) _marker.color = _highlightColor;
            else _marker.color = _idleColor;

            // Hardpoint ocupado só mostra o marcador quando tem algo a dizer.
            _marker.enabled = IsEmpty || Selected || Sabotaged;
        }
    }
}
```

### 4.8 Criar prefabs e assets

1. **Material das linhas e partículas:** no URP 2D, use o material `Sprite-Unlit-Default` (procure por esse nome no Project, com o filtro **In Packages**).
2. **Prefabs** (em `Prefabs/Defenses/`), cada um com um filho sprite `Square` (escala `0.35`, **Order in Layer = 10**) para aparecer em cima da nave:
   - `Autocannon`: **AutocannonDefense** + **LineRenderer** (Width `0.05`, cor amarela, **Use World Space** ligado, material acima, Sorting Layer `FX`) ligado em `Line`.
   - `Plasma`: **PlasmaDefense** + filho `PlasmaFx` com **Particle System**:
     - **Looping** ligado, **Play On Awake** desligado, Start Lifetime `0.3`, Start Speed `12`, Start Size `0.3`, cor ciano (`#5AF0FF`);
     - módulo **Shape** com Shape `Cone`, Angle `20` e Rotation `(0, 90, 0)`, para emitir para a direita (o "zero grau" do script);
     - módulo **Renderer** com o material acima e Sorting Layer `FX`.

     Ligue `PlasmaFx` no campo `Plasma`.
   - `Harpoon`: **HarpoonDefense** + **LineRenderer** (Width `0.08`, cor lilás `#B06AFF`), como no autocanhão.
   - `ElectricField`: **ElectricFieldDefense** + filho `Sparks` com um **Particle System** curto (Start Lifetime `0.15`, Start Speed `3`, Start Size `0.08`, cor amarela, Shape `Circle` com Radius `0.4`, Sorting Layer `FX`), ligado em `Sparks`.
3. **Assets** (em `ScriptableObjects/Defenses/`, **Create → Space Hauler → Defense**), números da Parte 1 §16:

| Asset | Prefab | Cost / Upgrade | Range | Damage | Fire Int. | Stun | Unlock At Best Trips |
|---|---|---|---|---|---|---|---|
| `Autocannon` | Autocannon | 40 / 40 | 9 | 6 | 0.15 | — | 0 |
| `Plasma` | Plasma | 60 / 60 | 4.5 | 35 | — | — | 1 |
| `Harpoon` | Harpoon | 70 / 70 | 12 | 40 | 3 | 2.5 | 3 |
| `ElectricField` | ElectricField | 50 / 50 | 2.5 | 15 | — | — | 0 |

4. **Teste:** nos hardpoints da nave, preencha `Test Defense` conforme o arco das `Test Settings` do `TripManager`. Para o arco de trás (145° a 215°): autocanhão na popa e nos dois hardpoints de trás, plasma num lateral da frente, campo elétrico no outro, e arpão na proa (que, nesse trecho, quase não vai ter alvo).

### ✅ Checkpoint da Fase 4
- No Play, o autocanhão da popa desenha rastros amarelos curtos e caças caem.
- **Arco de tiro:** o autocanhão da **proa** não atira em quem está atrás da nave, e um autocanhão a **bombordo** não atira em quem está a estibordo. Troque o arco das `Test Settings` para `-110` a `110` (emboscada pela frente): agora a popa fica parada e a proa trabalha.
- O plasma solta partículas ciano na direção do inimigo próximo e queima vários de uma vez.
- O arpão acerta uma nave, que para de acompanhar e fica para trás.
- Um pirata no hardpoint de um autocanhão faz ele parar de atirar até ser morto: por qualquer outra defesa ao alcance (mesmo fora do arco dela, com `Pirate Ignores Arcs` ligado no `GameConfig`) ou pelo campo elétrico de um hardpoint vizinho.
- Com as 6 defesas de teste montadas do lado certo, a nave termina o trecho de dificuldade 2 com casco sobrando; sem nenhuma, ela é destruída.

#### Problemas comuns
- **Rastros ou partículas aparecem rosa:** o material não é compatível com o URP 2D. Troque para `Sprite-Unlit-Default`.
- **O plasma sai para o lado errado:** a rotação do módulo **Shape** não está em `(0, 90, 0)`, então o "zero grau" das partículas não é a direita.
- **Uma defesa atira para o lado que não devia:** o `Facing` do hardpoint está trocado. Bombordo é `90` (esquerda da nave, para cima e para a esquerda na tela) e estibordo é `-90`.
- **A defesa não aparece em cima da nave:** o sprite dela está com **Order in Layer** menor que o do corpo da nave; dentro do mesmo `SortingGroup` vale a ordem.

Próxima fase: **Sucata, Alocação e Carenagem**, para o jogador comprar, melhorar e vender defesas com o mouse e blindar a nave.

---

# Parte 8 — Implementação Unity: Fase 5 (Sucata, Alocação e Carenagem)

## Fase 5 — Sucata, Alocação e Carenagem

> Objetivo desta fase: inimigos mortos dão sucata, e o jogador usa o mouse para comprar defesas na barra de baixo e montá-las num hardpoint, melhorar e vender as montadas, e comprar níveis de **Carenagem**. Com o HUD mostrando sucata, casco e progresso.

### 5.1 A carteira: `ScrapWallet`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/ScrapWallet.cs
using System;
using SpaceHauler.Data;
using SpaceHauler.Enemies;
using SpaceHauler.Trip;
using UnityEngine;

namespace SpaceHauler.Economy
{
    // POR QUE: a sucata é a única moeda da run (Parte 1 §5): entra quando um
    // inimigo morre e sai quando o jogador compra, melhora, blinda ou repara.
    // ESTRATÉGIA: escuta o evento estático Enemy.Killed e soma a recompensa do
    // inimigo, multiplicada pelo bônus de risco do trecho. A coleta é automática
    // (placeholder: a Parte 1 §5 deixa Em aberto se o jogador precisa clicar na
    // sucata). Um evento Changed avisa a UI.
    public class ScrapWallet : MonoBehaviour
    {
        public static ScrapWallet Instance { get; private set; }

        public int Amount { get; private set; }
        public event Action<int> Changed;

        private void Awake()
        {
            Instance = this;
            Amount = GameConfig.I.startingScrap;
        }

        private void OnEnable() => Enemy.Killed += OnEnemyKilled;
        private void OnDisable() => Enemy.Killed -= OnEnemyKilled;

        private void OnEnemyKilled(Enemy enemy)
        {
            float multiplier = TripManager.Current != null ? TripManager.Current.Settings.scrapMultiplier : 1f;
            if (multiplier <= 0f) multiplier = 1f; // TripSettings sem multiplicador preenchido
            Add(Mathf.RoundToInt(enemy.Def.scrapReward * multiplier));
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

### 5.2 A Carenagem: `HullPlating`

A Carenagem (Parte 1 §3) é da **nave**, não de um hardpoint: ela não ocupa lugar de arma, e é comprada por um botão próprio. Cada nível aumenta o casco máximo e reduz o dano de colisão (asteroides e drones).

```csharp
// Caminho: Assets/_Project/Scripts/Ship/HullPlating.cs
using System;
using SpaceHauler.Data;
using UnityEngine;

namespace SpaceHauler.Ship
{
    // POR QUE: a escolha "blindar ou armar" (Parte 1 §3). Sem ela, o Cinturão de
    // asteroides seria só sorte, porque nenhuma defesa destrói uma rocha.
    // ESTRATÉGIA: guarda só o nível. Os efeitos são lidos pelo ShipHull (casco
    // máximo e redução de colisão), para a conta de dano continuar num lugar só.
    // Não cobra nada: quem cobra é a alocação, como nas defesas. Ao subir de
    // nível, o casco atual sobe junto (senão comprar Carenagem com o casco cheio
    // deixaria um "buraco" de casco vazio).
    [RequireComponent(typeof(ShipHull))]
    public class HullPlating : MonoBehaviour
    {
        private ShipHull _hull;

        public int Level { get; private set; }
        public bool IsMaxed => Level >= GameConfig.I.platingMaxLevel;
        public int NextCost => GameConfig.I.platingCostPerLevel * (Level + 1);
        public float BonusHull => GameConfig.I.platingHullPerLevel * Level;
        public float CollisionReduction => GameConfig.I.platingCollisionReductionPerLevel * Level;

        public event Action Changed;

        private void Awake()
        {
            _hull = GetComponent<ShipHull>();
        }

        // Sobe um nível e cura o casco no mesmo tanto que o máximo subiu.
        public void AddLevel()
        {
            if (IsMaxed) return;
            Level++;
            _hull.Repair(GameConfig.I.platingHullPerLevel);
            Changed?.Invoke();
        }

        // Volta ao nível 0 (começo de run, Fase 7).
        public void ResetLevel()
        {
            Level = 0;
            Changed?.Invoke();
        }
    }
}
```

Agora o casco passa a ler a Carenagem. No `ShipHull` da Fase 2, troque as duas linhas de `Max` e `CollisionReduction` por:

```csharp
        // Casco máximo: o da nave mais o da Carenagem (Parte 1 §3).
        public float Max => GameConfig.I.shipBaseHull + (_plating != null ? _plating.BonusHull : 0f);

        // Quanto do dano de COLISÃO é ignorado (0 a 1): o da Carenagem, com um teto
        // de 90% para a nave nunca ficar imune a asteroides.
        public float CollisionReduction => _plating != null ? Mathf.Min(0.9f, _plating.CollisionReduction) : 0f;
```

E troque o campo `_ship` (que até aqui não era usado) e o `Awake` por:

```csharp
        private HullPlating _plating;

        private void Awake()
        {
            _plating = GetComponent<HullPlating>();
            Current = Max;
            if (_bodyRenderer != null) _baseColor = _bodyRenderer.color;
        }
```

> `Repair` já existe desde a Fase 2 e já respeita o novo `Max`: como o `AddLevel` sobe o nível **antes** de chamar `Repair`, o máximo já cresceu quando a cura acontece.

### 5.3 Comprar, melhorar, vender e blindar: `AllocationController`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/AllocationController.cs
using System;
using SpaceHauler.Data;
using SpaceHauler.Defenses;
using SpaceHauler.Ship;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

namespace SpaceHauler.Economy
{
    // POR QUE: alocar defesas e blindar a nave é tudo que o jogador faz com o
    // mouse (Parte 1 §2): ele não pilota nem mira.
    // ESTRATÉGIA: "clique-clique". Clicar numa defesa da barra de compra a deixa
    // "pendente" e acende os hardpoints vazios; clicar num hardpoint vazio monta
    // e cobra. Clicar num hardpoint ocupado o seleciona e abre o painel de
    // melhorar e vender. Clique fora, botão direito ou Esc cancelam. Os
    // hardpoints são achados pela distância na tela até o marcador, sem
    // colliders. A Carenagem é um clique só (BuyPlating), sem escolher lugar.
    public class AllocationController : MonoBehaviour
    {
        [SerializeField] private Camera _camera;
        [SerializeField] private ShipController _ship;
        [SerializeField] private HullPlating _plating;
        [SerializeField] private float _pickRadius = 0.6f; // unidades de tela em volta do hardpoint

        public DefenseDef PendingBuy { get; private set; }
        public Hardpoint SelectedHardpoint { get; private set; }

        public event Action Changed;          // seleção mudou (barra e painel redesenham)
        public event Action<string> Message;  // aviso curto para o HUD

        // Chamado pelos botões da barra de compra. Clicar de novo na mesma cancela.
        public void SelectToBuy(DefenseDef def)
        {
            PendingBuy = PendingBuy == def ? null : def;
            SelectHardpoint(null);
            RefreshHighlights();
            Changed?.Invoke();
        }

        // Chamado pelo botão da Carenagem (e pela Estação, Fase 7).
        public void BuyPlating()
        {
            if (_plating.IsMaxed)
            {
                Message?.Invoke("Carenagem no nível máximo");
                return;
            }
            if (!ScrapWallet.Instance.TrySpend(_plating.NextCost))
            {
                Message?.Invoke("Sucata insuficiente");
                return;
            }
            _plating.AddLevel();
            Changed?.Invoke();
        }

        private void Update()
        {
            if (Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame) CancelAll();
            if (Keyboard.current != null && Keyboard.current.cKey.wasPressedThisFrame) BuyPlating();
            if (Mouse.current != null && Mouse.current.rightButton.wasPressedThisFrame) CancelAll();

            Pointer pointer = Pointer.current;
            if (pointer == null || !pointer.press.wasPressedThisFrame) return;

            // Clique em cima de um botão da UI não é clique no mundo.
            if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject()) return;

            Vector2 world = _camera.ScreenToWorldPoint(pointer.position.ReadValue());
            Hardpoint hardpoint = FindHardpoint(world);

            if (hardpoint == null) CancelAll();
            else if (PendingBuy != null && hardpoint.IsEmpty) TryBuy(hardpoint);
            else if (!hardpoint.IsEmpty) SelectHardpoint(hardpoint);
        }

        // Hardpoint mais perto do clique, dentro do raio, ou null.
        private Hardpoint FindHardpoint(Vector2 world)
        {
            Hardpoint best = null;
            float bestSqr = _pickRadius * _pickRadius;
            foreach (Hardpoint hardpoint in _ship.Hardpoints)
            {
                float sqr = ((Vector2)hardpoint.transform.position - world).sqrMagnitude;
                if (sqr >= bestSqr) continue;
                best = hardpoint;
                bestSqr = sqr;
            }
            return best;
        }

        // Cobra e monta a defesa pendente num hardpoint vazio.
        private void TryBuy(Hardpoint hardpoint)
        {
            if (!ScrapWallet.Instance.TrySpend(PendingBuy.cost))
            {
                Message?.Invoke("Sucata insuficiente");
                return;
            }
            hardpoint.Install(PendingBuy);
            PendingBuy = null;
            RefreshHighlights();
            Changed?.Invoke();
        }

        // Chamado pelo botão "Melhorar" do painel.
        public void UpgradeSelected()
        {
            Defense defense = SelectedHardpoint != null ? SelectedHardpoint.Installed : null;
            if (defense == null || !defense.CanUpgrade) return;
            if (!ScrapWallet.Instance.TrySpend(defense.UpgradeCost))
            {
                Message?.Invoke("Sucata insuficiente");
                return;
            }
            defense.Upgrade();
            Changed?.Invoke();
        }

        // Quanto a venda devolve (placeholder: 50% de tudo que foi gasto).
        public int SellValue(Defense defense)
        {
            return Mathf.RoundToInt(defense.TotalSpent * GameConfig.I.sellRefund);
        }

        // Chamado pelo botão "Vender" do painel. Vender e comprar outra é o "trocar" da Parte 1 §5.
        public void SellSelected()
        {
            Defense defense = SelectedHardpoint != null ? SelectedHardpoint.Installed : null;
            if (defense == null) return;
            ScrapWallet.Instance.Add(SellValue(defense));
            SelectedHardpoint.Clear();
            SelectHardpoint(null);
            Changed?.Invoke();
        }

        // Desfaz compra pendente e seleção.
        public void CancelAll()
        {
            PendingBuy = null;
            SelectHardpoint(null);
            RefreshHighlights();
            Changed?.Invoke();
        }

        private void SelectHardpoint(Hardpoint hardpoint)
        {
            if (SelectedHardpoint != null) SelectedHardpoint.Selected = false;
            SelectedHardpoint = hardpoint;
            if (SelectedHardpoint != null) SelectedHardpoint.Selected = true;
            Changed?.Invoke();
        }

        // Acende os hardpoints vazios enquanto houver uma compra pendente.
        private void RefreshHighlights()
        {
            foreach (Hardpoint hardpoint in _ship.Hardpoints)
                hardpoint.Highlighted = PendingBuy != null && hardpoint.IsEmpty;
        }
    }
}
```

### 5.4 Um botão da barra de compra: `ShopButton`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ShopButton.cs
using System;
using SpaceHauler.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SpaceHauler.UI
{
    // POR QUE: cada defesa liberada vira um botão com nome e preço.
    // ESTRATÉGIA: o botão não sabe nada de compra; recebe uma ação para chamar
    // no clique (quem cria decide o que acontece). Fica desabilitado quando
    // falta sucata e mostra uma moldura quando está escolhido.
    public class ShopButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private Image _icon;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private Image _selectedFrame;

        public DefenseDef Def { get; private set; }

        public void Setup(DefenseDef def, Action onClick)
        {
            Def = def;
            _icon.sprite = def.icon;
            _icon.enabled = def.icon != null;
            _label.text = $"{def.displayName}\n{def.cost}";
            _button.onClick.AddListener(() => onClick());
        }

        public void Refresh(int scrap, bool selected)
        {
            _button.interactable = scrap >= Def.cost;
            _selectedFrame.enabled = selected;
        }
    }
}
```

### 5.5 A barra de compra: `ShopBar`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ShopBar.cs
using System.Collections.Generic;
using SpaceHauler.Data;
using SpaceHauler.Economy;
using UnityEngine;

namespace SpaceHauler.UI
{
    // POR QUE: mostra as defesas que podem ser compradas agora.
    // ESTRATÉGIA: cria um ShopButton por defesa dentro de um container com
    // HorizontalLayoutGroup (a Unity alinha os botões sozinha). A lista começa
    // com todas as defesas do Inspector; na Fase 7 a run troca por só as
    // desbloqueadas, chamando SetDefenses. O botão da Carenagem não entra aqui:
    // ele é um PlatingButton fixo, ao lado da barra.
    public class ShopBar : MonoBehaviour
    {
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private ShopButton _buttonPrefab;
        [SerializeField] private Transform _container;
        [SerializeField] private List<DefenseDef> _defenses = new();

        private readonly List<ShopButton> _buttons = new();

        private void Start()
        {
            ScrapWallet.Instance.Changed += _ => Refresh();
            _allocation.Changed += Refresh;
            Rebuild();
        }

        // Troca as defesas mostradas (desbloqueios, Fase 7).
        public void SetDefenses(IEnumerable<DefenseDef> defenses)
        {
            _defenses = new List<DefenseDef>(defenses);
            Rebuild();
        }

        // Apaga e recria todos os botões.
        private void Rebuild()
        {
            foreach (ShopButton button in _buttons) Destroy(button.gameObject);
            _buttons.Clear();

            foreach (DefenseDef def in _defenses)
            {
                ShopButton button = Instantiate(_buttonPrefab, _container);
                DefenseDef captured = def; // cópia para o "=>" abaixo lembrar desta defesa
                button.Setup(def, () => _allocation.SelectToBuy(captured));
                _buttons.Add(button);
            }
            Refresh();
        }

        private void Refresh()
        {
            int scrap = ScrapWallet.Instance.Amount;
            foreach (ShopButton button in _buttons)
                button.Refresh(scrap, button.Def == _allocation.PendingBuy);
        }
    }
}
```

### 5.6 O botão da Carenagem: `PlatingButton`

```csharp
// Caminho: Assets/_Project/Scripts/UI/PlatingButton.cs
using SpaceHauler.Economy;
using SpaceHauler.Ship;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SpaceHauler.UI
{
    // POR QUE: a Carenagem precisa estar sempre à mão (Parte 1 §13): o momento
    // de blindar é quando o Cinturão de asteroides começa, no meio do trecho.
    // ESTRATÉGIA: um botão fixo, ao lado da barra de compra, que mostra o
    // próximo nível e o custo, e chama a alocação. Redesenha quando a sucata ou
    // a Carenagem mudam.
    public class PlatingButton : MonoBehaviour
    {
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private HullPlating _plating;
        [SerializeField] private Button _button;
        [SerializeField] private TMP_Text _label;

        private void Start()
        {
            _button.onClick.AddListener(_allocation.BuyPlating);
            ScrapWallet.Instance.Changed += _ => Refresh();
            _plating.Changed += Refresh;
            Refresh();
        }

        private void Refresh()
        {
            if (_plating.IsMaxed)
            {
                _label.text = "Carenagem\nNível máximo";
                _button.interactable = false;
                return;
            }
            _label.text = $"Carenagem [C]\nNv {_plating.Level + 1}: {_plating.NextCost}";
            _button.interactable = ScrapWallet.Instance.Amount >= _plating.NextCost;
        }
    }
}
```

### 5.7 O painel da defesa selecionada: `DefensePanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/DefensePanel.cs
using SpaceHauler.Defenses;
using SpaceHauler.Economy;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SpaceHauler.UI
{
    // POR QUE: melhorar e vender precisam de um lugar na tela (Parte 1 §13).
    // ESTRATÉGIA: o componente fica sempre ativo e liga/desliga só um filho
    // (_root). Assim ele continua escutando os eventos mesmo escondido, e se
    // redesenha sozinho quando a seleção ou a sucata mudam.
    public class DefensePanel : MonoBehaviour
    {
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private GameObject _root;
        [SerializeField] private TMP_Text _title;
        [SerializeField] private TMP_Text _info;
        [SerializeField] private Button _upgradeButton;
        [SerializeField] private TMP_Text _upgradeLabel;
        [SerializeField] private Button _sellButton;
        [SerializeField] private TMP_Text _sellLabel;

        private void Start()
        {
            _upgradeButton.onClick.AddListener(_allocation.UpgradeSelected);
            _sellButton.onClick.AddListener(_allocation.SellSelected);
            _allocation.Changed += Refresh;
            ScrapWallet.Instance.Changed += _ => Refresh();
            Refresh();
        }

        private void Refresh()
        {
            Defense defense = _allocation.SelectedHardpoint != null ? _allocation.SelectedHardpoint.Installed : null;
            _root.SetActive(defense != null);
            if (defense == null) return;

            _title.text = $"{defense.Def.displayName} (nível {defense.Level}/{defense.Def.maxLevel})";
            _info.text = $"Hardpoint: {defense.Hardpoint.Label}" + (defense.Hardpoint.Sabotaged ? "  [SABOTADO]" : "");

            if (defense.CanUpgrade)
            {
                _upgradeLabel.text = $"Melhorar ({defense.UpgradeCost})";
                _upgradeButton.interactable = ScrapWallet.Instance.Amount >= defense.UpgradeCost;
            }
            else
            {
                _upgradeLabel.text = "Nível máximo";
                _upgradeButton.interactable = false;
            }
            _sellLabel.text = $"Vender (+{_allocation.SellValue(defense)})";
        }
    }
}
```

### 5.8 O HUD: `HudView`

```csharp
// Caminho: Assets/_Project/Scripts/UI/HudView.cs
using SpaceHauler.Economy;
using SpaceHauler.Ship;
using SpaceHauler.Trip;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SpaceHauler.UI
{
    // POR QUE: sucata, casco e progresso precisam estar sempre à vista
    // (Parte 1 §13).
    // ESTRATÉGIA: sucata e nome do trecho mudam raramente, então são
    // atualizados por evento; casco e progresso mudam todo frame e são lidos no
    // Update. As barras são Images com "Image Type = Filled", em que fillAmount
    // (0 a 1) controla quanto aparece.
    public class HudView : MonoBehaviour
    {
        [SerializeField] private TripManager _trip;
        [SerializeField] private ShipController _ship;
        [SerializeField] private HullPlating _plating;
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private TMP_Text _scrapText;
        [SerializeField] private TMP_Text _tripLabel;
        [SerializeField] private TMP_Text _hullText;
        [SerializeField] private TMP_Text _messageText;
        [SerializeField] private Image _hullFill;
        [SerializeField] private Image _progressFill;
        [SerializeField] private float _messageSeconds = 1.5f;

        private float _messageTimer;

        private void Start()
        {
            ScrapWallet.Instance.Changed += OnScrapChanged;
            OnScrapChanged(ScrapWallet.Instance.Amount);
            _allocation.Message += ShowMessage;
            _trip.Started += settings => _tripLabel.text = settings.label;
            _messageText.text = "";
        }

        private void OnScrapChanged(int amount)
        {
            _scrapText.text = $"Sucata: {amount}";
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
            _hullText.text = $"Casco {Mathf.CeilToInt(hull.Current)}/{Mathf.RoundToInt(hull.Max)}" +
                             (_plating.Level > 0 ? $"  Carenagem {_plating.Level}" : "");
            _progressFill.fillAmount = _trip.Progress01;

            if (_messageTimer <= 0f) return;
            _messageTimer -= Time.deltaTime;
            if (_messageTimer <= 0f) _messageText.text = "";
        }
    }
}
```

> Montar o texto do casco todo frame cria uma string nova por frame. Para um MVP é irrelevante; se o profiler reclamar, guarde os últimos valores e só reescreva quando mudarem.

### 5.9 Montar na cena

1. **Carenagem:** no objeto `Ship`, adicione **HullPlating**. Faça as duas trocas no `ShipHull` (§5.2).
2. **Lógica:** GameObject `Economy` com **ScrapWallet** e **AllocationController** (`Camera` = Main Camera, `Ship` = Ship, `Plating` = Ship).
3. **Canvas:** **GameObject → UI → Canvas** (já cria o `EventSystem`). No Canvas: **UI Scale Mode = Scale With Screen Size**, referência `1280 × 720`. No `EventSystem`, se aparecer o aviso, clique em **Replace with InputSystemUIInputModule**.
4. **HUD** (filhos do Canvas, com **HudView** num objeto `Hud`):
   - `ScrapText` (TextMeshPro) no canto superior esquerdo.
   - `TripLabel` (TextMeshPro) no topo, centralizado.
   - `HullBar`: uma Image de fundo escura e, dentro, `HullFill`, uma Image ciano com **Source Image** = `Square`, **Image Type = Filled**, **Fill Method = Horizontal**; por cima, o texto `HullText`.
   - `ProgressBar`: igual, com `ProgressFill` amarelo, logo abaixo do título.
   - `MessageText` (TextMeshPro) no centro, um pouco acima da barra de compra.
5. **Barra de compra:** objeto `ShopBar` ancorado embaixo, com **HorizontalLayoutGroup** (Spacing `8`, Child Alignment `Middle Center`) e o componente **ShopBar** (`Container` = ele mesmo, `Defenses` = os 4 assets).
6. **Prefab `ShopButton`** (em `Prefabs/UI/`): um **Button** de `120 × 80` com filhos `Icon` (Image), `Label` (TextMeshPro) e `SelectedFrame` (Image com só a borda, amarela). Ligue os campos do **ShopButton**.
7. **Botão da Carenagem:** um **Button** `PlatingButton` de `120 × 80`, ancorado embaixo, logo à direita da barra de compra, com um `Label` (TextMeshPro) e o componente **PlatingButton** (`Allocation`, `Plating` = Ship, `Button`, `Label`).
8. **Painel:** objeto `DefensePanel` (sempre ativo) com o componente **DefensePanel** e um filho `Root` (o painel visível, no canto inferior direito) contendo `Title`, `Info` e os botões `Upgrade` e `Sell`, cada um com seu texto.
9. Apague os `Test Defense` dos hardpoints, para testar a compra de verdade.

### ✅ Checkpoint da Fase 5
- O HUD começa com "Sucata: 100" e "Casco 500/500", e a sucata sobe quando um inimigo morre por uma defesa (não quando um drone explode na nave).
- Clicar em "Autocanhão" acende os hardpoints vazios em verde; clicar num deles monta a arma e desconta 40.
- Botões caros demais ficam cinza; tentar comprar sem sucata mostra "Sucata insuficiente".
- Clicar numa defesa montada abre o painel; "Melhorar" sobe o nível e cobra; "Vender" remove a defesa e devolve metade do gasto.
- O botão da Carenagem (ou a tecla `C`) cobra 50, o HUD passa a mostrar "Casco 550/550  Carenagem 1", e o próximo nível custa 100.
- Com `Asteroids` ligado nas `Test Settings`, compare: sem Carenagem, uma rocha de raio 1,5 tira 24; com Carenagem 3, tira ~15 (24 × 0,64). Tiros de caça **não** mudam com a Carenagem.
- Esc ou botão direito cancela a compra pendente e fecha o painel.
- As barras de casco e de progresso andam durante o trecho.

#### Problemas comuns
- **Clicar num botão da barra também monta a defesa no hardpoint embaixo dele:** falta o `EventSystem` na cena, então `IsPointerOverGameObject` sempre devolve false.
- **Nenhum clique no mundo funciona:** o `Pick Radius` é pequeno demais para o zoom da câmera, ou a `Camera` do `AllocationController` está vazia.
- **A Carenagem cobra mas o casco máximo não muda:** o `ShipHull` ainda está com as linhas da Fase 2. Faça as trocas do §5.2.
- **As barras não mudam:** a Image está com **Image Type = Simple**. O `fillAmount` só funciona com **Filled**, e só se houver uma **Source Image**.

Próxima fase: **Habilidades Ativas**, com pós-combustor e nuvem de detritos.

---

# Parte 9 — Implementação Unity: Fase 6 (Habilidades Ativas)

## Fase 6 — Habilidades Ativas

> Objetivo desta fase: dois botões de habilidade (placeholders: pós-combustor e nuvem de detritos), com cooldown visível e atalhos `1` e `2`.

### 6.1 Dados de uma habilidade: `AbilityDef`

```csharp
// Caminho: Assets/_Project/Scripts/Data/AbilityDef.cs
using SpaceHauler.Abilities;
using UnityEngine;

namespace SpaceHauler.Data
{
    public enum AbilityKind
    {
        Afterburner,  // acelera a nave
        DebrisCloud,  // nuvem de detritos atrás da nave
    }

    // POR QUE: a lista de habilidades está Em aberto (Parte 1 §6); pós-combustor
    // e nuvem de detritos são placeholders. Um asset por habilidade deixa trocar
    // números e ícones sem código.
    // ESTRATÉGIA: um enum diz qual efeito aplicar, e os campos genéricos
    // (duração, intensidade, tamanho) são lidos por cada efeito do seu jeito.
    // Uma habilidade nova com efeito novo = um valor novo no enum + um case no
    // AbilityController.
    [CreateAssetMenu(menuName = "Space Hauler/Ability", fileName = "Ability")]
    public class AbilityDef : ScriptableObject
    {
        public string displayName = "Pós-combustor";
        public Sprite icon;
        public AbilityKind kind;
        public float cooldown = 20f;
        public float duration = 4f;     // pós-combustor: tempo acelerando; nuvem: tempo que ela fica no espaço
        public float magnitude = 1.6f;  // pós-combustor: multiplicador de velocidade; nuvem: segundos de atordoamento
        public float size = 4f;         // nuvem: meio comprimento, em metros
        public float dropBehind = 5f;   // nuvem: quantos metros atrás da nave ela é solta
        public DebrisCloud cloudPrefab;
    }
}
```

### 6.2 A nuvem de detritos: `DebrisCloud`

```csharp
// Caminho: Assets/_Project/Scripts/Abilities/DebrisCloud.cs
using System.Collections.Generic;
using SpaceHauler.Data;
using SpaceHauler.Enemies;
using SpaceHauler.World;
using UnityEngine;

namespace SpaceHauler.Abilities
{
    // POR QUE: placeholder da Parte 1 §6: naves que atravessam a nuvem ficam
    // atordoadas.
    // ESTRATÉGIA: a nuvem fica parada no plano (a nave segue e a deixa para trás,
    // bem no caminho de quem persegue). Ela cobre laneHalfWidth metros para cada
    // lado e "size" metros para frente e para trás. Cada nave só é atordoada uma
    // vez por nuvem (HashSet guarda quem já passou). É mais útil em trechos de
    // perseguição; numa emboscada pela frente, os piratas nunca passam por ela.
    [RequireComponent(typeof(GroundBody))]
    public class DebrisCloud : MonoBehaviour
    {
        [SerializeField] private ParticleSystem _debris;

        private readonly HashSet<Enemy> _hit = new();
        private GroundBody _body;
        private AbilityDef _def;
        private float _life;

        // Chamado pelo AbilityController logo depois de criar a nuvem.
        public void Init(AbilityDef def, Vector2 ground)
        {
            _def = def;
            _life = def.duration;
            _body = GetComponent<GroundBody>();
            _body.Ground = ground;
            _body.Apply();
            if (_debris != null) _debris.Play();
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
                enemy.Stun(_def.magnitude);
                _hit.Add(enemy);
            }
        }
    }
}
```

### 6.3 Quem usa as habilidades: `AbilityController`

```csharp
// Caminho: Assets/_Project/Scripts/Abilities/AbilityController.cs
using System.Collections.Generic;
using SpaceHauler.Data;
using SpaceHauler.Ship;
using SpaceHauler.Trip;
using UnityEngine;
using UnityEngine.InputSystem;

namespace SpaceHauler.Abilities
{
    // POR QUE: além de alocar, o jogador tem habilidades com cooldown
    // (Parte 1 §6). Este é o único lugar que sabe aplicar cada efeito.
    // ESTRATÉGIA: um cooldown por habilidade, na mesma ordem da lista. As teclas
    // 1, 2, 3... usam a habilidade da posição correspondente. Tudo volta a zero
    // no começo de cada trecho.
    public class AbilityController : MonoBehaviour
    {
        [SerializeField] private ShipController _ship;
        [SerializeField] private TripManager _trip;
        [SerializeField] private List<AbilityDef> _abilities = new();

        private float[] _cooldowns;
        private float _afterburnerTimer;

        public IReadOnlyList<AbilityDef> Abilities => _abilities;

        private void Awake()
        {
            _cooldowns = new float[_abilities.Count];
        }

        private void OnEnable() => _trip.Started += OnTripStarted;
        private void OnDisable() => _trip.Started -= OnTripStarted;

        private void OnTripStarted(TripSettings settings)
        {
            for (int i = 0; i < _cooldowns.Length; i++) _cooldowns[i] = 0f;
            _afterburnerTimer = 0f;
        }

        private void Update()
        {
            float dt = Time.deltaTime;
            for (int i = 0; i < _cooldowns.Length; i++) _cooldowns[i] = Mathf.Max(0f, _cooldowns[i] - dt);

            if (_afterburnerTimer > 0f)
            {
                _afterburnerTimer -= dt;
                if (_afterburnerTimer <= 0f) _ship.SpeedMultiplier = 1f;
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
            if (!_trip.IsRunning || _cooldowns[index] > 0f) return false;

            AbilityDef ability = _abilities[index];
            switch (ability.kind)
            {
                case AbilityKind.Afterburner:
                    // Só a velocidade da nave muda: os piratas acompanham a de
                    // CRUZEIRO (Fase 3), então ficam para trás.
                    _ship.SpeedMultiplier = ability.magnitude;
                    _afterburnerTimer = ability.duration;
                    break;

                case AbilityKind.DebrisCloud:
                    DebrisCloud cloud = Instantiate(ability.cloudPrefab);
                    cloud.Init(ability, _ship.Ground + new Vector2(-ability.dropBehind, 0f));
                    break;
            }

            _cooldowns[index] = ability.cooldown;
            return true;
        }
    }
}
```

### 6.4 Os botões: `AbilityButton` e `AbilityBar`

```csharp
// Caminho: Assets/_Project/Scripts/UI/AbilityButton.cs
using System;
using SpaceHauler.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SpaceHauler.UI
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
using SpaceHauler.Abilities;
using UnityEngine;

namespace SpaceHauler.UI
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

1. **Prefab `DebrisCloud`** (em `Prefabs/`): GameObject + **GroundBody** (`SortingGroup` na Sorting Layer **Mundo**) + **DebrisCloud** + filho `Debris` com um **Particle System** (Looping ligado, Play On Awake desligado, Start Lifetime `1`, Start Speed `0.5`, Start Size `0.15`, cor cinza `#6A7088`, Shape `Box` com Scale `(4, 2, 1)`, Sorting Layer `Mundo`) ligado em `Debris`.
2. **Assets** (em `ScriptableObjects/Abilities/`, **Create → Space Hauler → Ability**), números da Parte 1 §16:

| Asset | Kind | Cooldown | Duration | Magnitude | Size | Drop Behind | Cloud Prefab |
|---|---|---|---|---|---|---|---|
| `Afterburner` | Afterburner | 20 | 4 | 1.6 | — | — | — |
| `DebrisCloud` | DebrisCloud | 15 | 5 | 1.5 | 4 | 5 | DebrisCloud |

3. **Controller:** no objeto `Economy` (ou num novo `Abilities`), adicione **AbilityController** com `Ship`, `Trip` e `Abilities` = Afterburner, DebrisCloud (nessa ordem: tecla 1 e tecla 2).
4. **Prefab `AbilityButton`** (em `Prefabs/UI/`): Button `100 × 100` com filhos `Icon`, `Label` e, por último (para ficar por cima), `CooldownOverlay`: Image preta com alpha `0.6`, **Source Image** = `Square`, **Image Type = Filled**, **Fill Method = Radial 360**.
5. **Barra:** objeto `AbilityBar` no canto inferior esquerdo do Canvas, com **HorizontalLayoutGroup** e o componente **AbilityBar**.

### ✅ Checkpoint da Fase 6
- Apertar `1` (ou clicar no botão) acelera a nave por 4 s: caças que rondam ficam para trás e param de atirar, depois alcançam de novo.
- Apertar `2` solta uma nuvem cinza atrás da nave; naves que passam por ela param por 1,5 s. Piratas a bordo não são afetados.
- Num trecho de emboscada pela frente (arco `-110` a `110`), a nuvem quase não pega ninguém: é o esperado, e é uma escolha de quando usar.
- Os botões escurecem e "abrem como relógio" até o fim do cooldown, e não funcionam antes disso.
- As habilidades não funcionam depois que o trecho acabou.

#### Problemas comuns
- **A tecla `1` do teclado numérico não funciona:** `Key.Digit1` é a tecla `1` acima das letras. Se quiser as duas, cheque também `Key.Numpad1 + i`.
- **A nave fica acelerada para sempre:** o trecho acabou durante o pós-combustor e começou outro; o `OnTripStarted` zera o timer, mas o `ShipController.ResetForTrip` é quem volta o `SpeedMultiplier` para 1. Confira se o `ResetForTrip` está igual ao da Fase 2.
- **O pós-combustor não deixa ninguém para trás:** os inimigos estão acompanhando `Ship.Speed` em vez de `Ship.CruiseSpeed` no `Enemy.Update` (Fase 3).

Próxima fase: **Run Roguelite, Estação e Save**, com mapa de rota por tipos de trecho, Estação, sequência de trechos, Cruzador no fim e desbloqueios permanentes.

---

# Parte 10 — Implementação Unity: Fase 7 (Run Roguelite, Estação e Save)

## Fase 7 — Run Roguelite, Estação e Save

> Objetivo desta fase: o jogo completo de ponta a ponta. Menu → mapa de rota gerado (com tipos de trecho e Estações) → escolher nó → jogar o trecho ou reparar na Estação → voltar ao mapa → ... → Cruzador → chegada ao destino (ou derrota) → tela de resultado. E os desbloqueios permanentes salvos no navegador.

### 7.1 Um tipo de trecho: `TripTypeDef`

Os três tipos de trecho (Parte 1 §8) são dados: nome, risco, de que arco os piratas vêm e se há asteroides. Num asset cada, dá para criar um tipo novo (ex.: "Nebulosa") sem código.

```csharp
// Caminho: Assets/_Project/Scripts/Data/TripTypeDef.cs
using UnityEngine;

namespace SpaceHauler.Data
{
    // POR QUE: o tipo de trecho decide o padrão de ataque (Parte 1 §8), que é o
    // que faz "qual arma em qual hardpoint" mudar de um trecho para o outro.
    // ESTRATÉGIA: um asset por tipo. O RouteGenerator sorteia entre eles, e o
    // RouteNode copia os valores para o TripSettings que o TripManager entende.
    [CreateAssetMenu(menuName = "Space Hauler/Trip Type", fileName = "TripType")]
    public class TripTypeDef : ScriptableObject
    {
        public string displayName = "Espaço aberto";
        public string shortDescription = "Perseguição por trás";
        public int risk;                     // 0..2: mais inimigos e mais sucata
        public float spawnArcMin = 145f;     // graus em volta da nave: 0 = frente, 180 = trás
        public float spawnArcMax = 215f;
        public bool asteroids;
    }
}
```

### 7.2 Um nó do mapa: `RouteNode` e `RouteMap`

```csharp
// Caminho: Assets/_Project/Scripts/Run/RouteNode.cs
using System.Collections.Generic;
using SpaceHauler.Data;
using SpaceHauler.Trip;

namespace SpaceHauler.Run
{
    // Os três jeitos de um nó: um trecho comum, uma Estação ou o destino.
    public enum NodeKind { Trip, Station, Destination }

    // POR QUE: cada nó da rota é uma escolha do jogador (Parte 1 §8).
    // ESTRATÉGIA: classe C# pura (não é MonoBehaviour, não vai na cena). O mapa
    // é organizado em camadas: a camada 0 é o primeiro nó, a última é o destino.
    // "next" guarda para quais nós da camada seguinte dá para ir. Um nó de
    // trecho guarda o seu TripTypeDef; a Estação não tem tipo (não tem combate).
    public class RouteNode
    {
        public int layer;
        public int index;
        public NodeKind kind;
        public TripTypeDef type;   // trecho e destino; null na Estação
        public readonly List<int> next = new();

        public bool IsStation => kind == NodeKind.Station;
        public bool IsDestination => kind == NodeKind.Destination;
        public int Risk => kind == NodeKind.Trip && type != null ? type.risk : 0;

        // Nome curto do nó para a UI.
        public string Name => kind switch
        {
            NodeKind.Station => "Estação",
            NodeKind.Destination => "Destino (B)",
            _ => type != null ? type.displayName : "Trecho",
        };

        // Converte o nó nas regras do trecho que o TripManager entende.
        // Não vale para a Estação (ela não vira trecho).
        public TripSettings ToSettings(GameConfig cfg)
        {
            return new TripSettings
            {
                label = IsDestination ? "Último trecho: órbita do planeta de destino" : $"{type.displayName} (risco {Risk})",
                difficulty = layer + 1 + Risk,
                hasBoss = IsDestination,
                scrapMultiplier = 1f + Risk * cfg.scrapBonusPerRisk,
                spawnArcMin = type.spawnArcMin,
                spawnArcMax = type.spawnArcMax,
                asteroids = type.asteroids,
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
using SpaceHauler.Data;
using UnityEngine;

namespace SpaceHauler.Run
{
    // POR QUE: a rota é gerada a cada run (Parte 1 §8), com tipos de trecho
    // misturados e, de vez em quando, uma Estação (Parte 1 §9).
    // ESTRATÉGIA: cria as camadas com 2 a 3 nós (a última com só o destino).
    // Cada nó comum sorteia um tipo de trecho; nas camadas do meio, um nó pode
    // virar Estação (no máximo um por camada). As ligações entre camadas
    // vizinhas seguem a "posição relativa": um nó no alto da coluna liga com nós
    // no alto da próxima. Duas passadas garantem que todo nó tem pelo menos uma
    // saída e uma entrada; uma ligação extra sorteada cria as bifurcações.
    // System.Random (não o UnityEngine.Random) aceita uma semente, então o mesmo
    // número gera o mesmo mapa (útil para testar).
    public static class RouteGenerator
    {
        public static RouteMap Generate(GameConfig cfg, IReadOnlyList<TripTypeDef> tripTypes,
                                        TripTypeDef destinationType, System.Random rng)
        {
            var map = new RouteMap();
            int layerCount = Mathf.Max(2, cfg.routeLayers);

            for (int l = 0; l < layerCount; l++)
            {
                bool last = l == layerCount - 1;
                int count = last ? 1 : rng.Next(cfg.minNodesPerLayer, cfg.maxNodesPerLayer + 1);
                bool middle = l > 0 && !last;
                int station = middle && rng.NextDouble() < cfg.stationChance ? rng.Next(count) : -1;

                var layer = new List<RouteNode>();
                for (int i = 0; i < count; i++)
                {
                    var node = new RouteNode { layer = l, index = i };
                    if (last)
                    {
                        node.kind = NodeKind.Destination;
                        node.type = destinationType;
                    }
                    else if (i == station)
                    {
                        node.kind = NodeKind.Station;
                    }
                    else
                    {
                        node.kind = NodeKind.Trip;
                        node.type = tripTypes[rng.Next(tripTypes.Count)];
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

namespace SpaceHauler.Run
{
    // POR QUE: o que fica entre runs (Parte 1 §10) precisa sobreviver a fechar
    // o navegador. O jogo é offline (Parte 1 §15).
    // ESTRATÉGIA: um objeto simples convertido em JSON pelo JsonUtility e
    // guardado no PlayerPrefs. Na build Web, a Unity guarda o PlayerPrefs no
    // IndexedDB do navegador, mas só grava de fato quando PlayerPrefs.Save() é
    // chamado, por isso Save() sempre chama. A chave é própria deste jogo, para
    // não misturar com o save do Fury Hauler.
    [Serializable]
    public class MetaProgress
    {
        private const string Key = "spacehauler.meta";

        public int runsStarted;
        public int runsCompleted;
        public int bestTrips; // maior número de trechos concluídos numa run (Estação não conta)

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

namespace SpaceHauler.UI
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
using SpaceHauler.Data;
using SpaceHauler.Run;
using UnityEngine;

namespace SpaceHauler.UI
{
    // POR QUE: o jogador escolhe o próximo nó num mapa (Parte 1 §8), e precisa
    // ver o tipo de cada um para planejar os hardpoints.
    // ESTRATÉGIA: uma coluna por camada (HorizontalLayoutGroup com colunas de
    // VerticalLayoutGroup). No MVP as ligações entre nós não são desenhadas como
    // linhas: cada botão diz em texto para onde ele segue ("Segue: A, B").
    // Desenhar as linhas fica para depois (o protótipo web desenha).
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
            if (node.IsDestination) return "DESTINO (B)\nCruzador pirata";

            var text = new StringBuilder();
            if (node.IsStation) text.Append("ESTAÇÃO\nReparo, sem combate");
            else
            {
                TripTypeDef type = node.type;
                float bonus = node.Risk * GameConfig.I.scrapBonusPerRisk * 100f;
                text.Append($"{type.displayName}\n{type.shortDescription}\nRisco {node.Risk}");
                if (bonus > 0f) text.Append($" (+{bonus:0}% sucata)");
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

### 7.7 A Estação: `StationPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/StationPanel.cs
using SpaceHauler.Economy;
using SpaceHauler.Run;
using SpaceHauler.Ship;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SpaceHauler.UI
{
    // POR QUE: a Estação (Parte 1 §9) é o único lugar onde o casco volta. Ela não
    // tem combate: é uma tela com reparo, Carenagem e "seguir viagem".
    // ESTRATÉGIA: a tela só mostra e chama o RunManager (reparo, seguir) e a
    // alocação (Carenagem). Redesenha quando a sucata ou o casco mudam.
    public class StationPanel : MonoBehaviour
    {
        [SerializeField] private RunManager _run;
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private ShipController _ship;
        [SerializeField] private TMP_Text _status;
        [SerializeField] private Button _repairStepButton;
        [SerializeField] private TMP_Text _repairStepLabel;
        [SerializeField] private Button _repairAllButton;
        [SerializeField] private TMP_Text _repairAllLabel;
        [SerializeField] private Button _platingButton;
        [SerializeField] private Button _leaveButton;
        [SerializeField] private int _repairStep = 50;

        private void Start()
        {
            _repairStepButton.onClick.AddListener(() => _run.Repair(_repairStep));
            _repairAllButton.onClick.AddListener(() => _run.Repair(float.MaxValue));
            _platingButton.onClick.AddListener(_allocation.BuyPlating);
            _leaveButton.onClick.AddListener(_run.LeaveStation);
            ScrapWallet.Instance.Changed += _ => Refresh();
            _ship.Hull.Changed += Refresh;
        }

        // A tela liga sempre que o RunManager mostra a Estação.
        private void OnEnable() => Refresh();

        private void Refresh()
        {
            if (ScrapWallet.Instance == null || _ship == null) return;
            ShipHull hull = _ship.Hull;
            _status.text = $"Casco {Mathf.CeilToInt(hull.Current)}/{Mathf.RoundToInt(hull.Max)}   Sucata {ScrapWallet.Instance.Amount}";

            float step = _run.RepairableAmount(_repairStep);
            _repairStepLabel.text = $"Reparar {step:0} ({_run.RepairCost(step)} sucata)";
            _repairStepButton.interactable = step > 0f;

            float all = _run.RepairableAmount(float.MaxValue);
            _repairAllLabel.text = $"Reparar tudo: {all:0} ({_run.RepairCost(all)} sucata)";
            _repairAllButton.interactable = all > 0f;
        }
    }
}
```

### 7.8 A run: `RunManager`

```csharp
// Caminho: Assets/_Project/Scripts/Run/RunManager.cs
using System.Collections.Generic;
using SpaceHauler.Data;
using SpaceHauler.Economy;
using SpaceHauler.Ship;
using SpaceHauler.Trip;
using SpaceHauler.UI;
using TMPro;
using UnityEngine;

namespace SpaceHauler.Run
{
    // POR QUE: costura tudo numa run (Parte 1 §2): começa do zero, escolhe nós
    // no mapa, repara nas Estações, chega ao destino ou perde tudo, e guarda a
    // meta-progressão.
    // ESTRATÉGIA: uma única cena. Em vez de trocar de cena, liga e desliga
    // painéis (menu, mapa, Estação, resultado) por cima do jogo. A nave é o
    // mesmo objeto a run inteira: defesas, Carenagem, casco e sucata continuam de
    // um nó para o outro naturalmente, e o TripManager só a recoloca no começo da
    // rota. A Estação não chama o TripManager: é só uma tela.
    public class RunManager : MonoBehaviour
    {
        [SerializeField] private TripManager _trip;
        [SerializeField] private ShipController _ship;
        [SerializeField] private HullPlating _plating;
        [SerializeField] private AllocationController _allocation;
        [SerializeField] private ShopBar _shop;
        [SerializeField] private List<DefenseDef> _allDefenses = new();
        [SerializeField] private List<TripTypeDef> _tripTypes = new();   // Espaço aberto, Cinturão, Rota pirata
        [SerializeField] private TripTypeDef _destinationType;           // padrão do último trecho

        [Header("Telas")]
        [SerializeField] private GameObject _menuPanel;
        [SerializeField] private TMP_Text _menuStats;
        [SerializeField] private GameObject _routePanel;
        [SerializeField] private RouteMapView _routeView;
        [SerializeField] private GameObject _stationPanel;
        [SerializeField] private GameObject _resultPanel;
        [SerializeField] private TMP_Text _resultText;

        private MetaProgress _meta;
        private int _tripsDone;

        public RouteMap Route { get; private set; }
        public RouteNode CurrentNode { get; private set; } // null = ainda no planeta de origem

        private void Start()
        {
            _meta = MetaProgress.Load();
            _trip.Ended += OnTripEnded;
            ShowOnly(_menuPanel);
            RefreshMenu();
        }

        // Botão "Decolar" do menu e "Nova viagem" do resultado.
        public void NewRun()
        {
            GameConfig cfg = GameConfig.I;
            Route = RouteGenerator.Generate(cfg, _tripTypes, _destinationType, new System.Random());
            CurrentNode = null;
            _tripsDone = 0;

            _allocation.CancelAll();
            foreach (Hardpoint hardpoint in _ship.Hardpoints) hardpoint.Clear();
            _plating.ResetLevel();
            _ship.Hull.ResetFull();   // depois da Carenagem, para o máximo já ser o sem Carenagem
            ScrapWallet.Instance.ResetTo(cfg.startingScrap);
            _shop.SetDefenses(UnlockedDefenses());

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

        // Clique num nó do mapa: Estação abre a tela de reparo; trecho começa.
        public void ChooseNode(RouteNode node)
        {
            if (!CanChoose(node)) return;
            CurrentNode = node;
            if (node.IsStation)
            {
                ShowOnly(_stationPanel);
                return;
            }
            ShowOnly(null);
            _trip.StartTrip(node.ToSettings(GameConfig.I));
        }

        // Quanto casco dá para reparar agora, até "wanted": limitado pelo que falta
        // e pela sucata que o jogador tem.
        public float RepairableAmount(float wanted)
        {
            float missing = _ship.Hull.Max - _ship.Hull.Current;
            float affordable = ScrapWallet.Instance.Amount * GameConfig.I.repairHullPerScrap;
            return Mathf.Max(0f, Mathf.Min(wanted, missing, affordable));
        }

        // Sucata que um reparo de "amount" custa (arredonda para cima).
        public int RepairCost(float amount) => Mathf.CeilToInt(amount / GameConfig.I.repairHullPerScrap);

        // Botões de reparo da Estação.
        public void Repair(float wanted)
        {
            float amount = RepairableAmount(wanted);
            if (amount <= 0f) return;
            if (!ScrapWallet.Instance.TrySpend(RepairCost(amount))) return;
            _ship.Hull.Repair(amount);
        }

        // Botão "Seguir viagem" da Estação. A Estação não conta como trecho concluído.
        public void LeaveStation()
        {
            ShowRoute();
        }

        private void OnTripEnded(bool success)
        {
            if (CurrentNode == null) return; // trecho de teste (Fases 2-6), fora de uma run

            if (success)
            {
                _tripsDone++;
                _meta.bestTrips = Mathf.Max(_meta.bestTrips, _tripsDone);
            }

            if (success && CurrentNode.IsDestination)
            {
                _meta.runsCompleted++;
                _meta.Save();
                ShowResult("Você chegou ao destino!");
            }
            else if (success)
            {
                _meta.Save();
                ShowRoute();
            }
            else
            {
                _meta.Save();
                ShowResult($"A nave foi destruída em: {CurrentNode.Name}.\nTrechos concluídos: {_tripsDone}");
            }
        }

        // Defesas cujo requisito de desbloqueio já foi atingido (placeholder, Parte 1 §10).
        private List<DefenseDef> UnlockedDefenses()
        {
            var unlocked = new List<DefenseDef>();
            foreach (DefenseDef def in _allDefenses)
                if (def.unlockAtBestTrips <= _meta.bestTrips) unlocked.Add(def);
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
            _menuStats.text = $"Viagens: {_meta.runsStarted}   Chegadas ao destino: {_meta.runsCompleted}   Melhor run: {_meta.bestTrips} trechos";
        }

        // Liga um painel e desliga os outros (null = só o jogo).
        private void ShowOnly(GameObject panel)
        {
            _menuPanel.SetActive(panel == _menuPanel);
            _routePanel.SetActive(panel == _routePanel);
            _stationPanel.SetActive(panel == _stationPanel);
            _resultPanel.SetActive(panel == _resultPanel);
        }
    }
}
```

> A defesa nova liberada só aparece na barra de compra na **próxima** run, porque `UnlockedDefenses()` é lido no `NewRun`. É uma escolha de simplicidade, não de design: se o jogo quiser liberar no meio da run, basta chamar `_shop.SetDefenses(UnlockedDefenses())` também no `OnTripEnded`.

### 7.9 Montar na cena

1. **TripManager:** desligue `Start On Play`. A partir de agora quem começa os trechos é a run.
2. **Hardpoints:** confira que nenhum `Test Defense` está preenchido.
3. **GameConfig:** volte `Trip Length` para `900`, se tinha diminuído na Fase 2.
4. **Tipos de trecho** (em `ScriptableObjects/`, **Create → Space Hauler → Trip Type**), números da Parte 1 §16:

| Asset | Display Name | Short Description | Risk | Spawn Arc Min / Max | Asteroids |
|---|---|---|---|---|---|
| `OpenSpace` | Espaço aberto | Perseguição por trás | 0 | 145 / 215 | não |
| `AsteroidBelt` | Cinturão de asteroides | Emboscada pela frente | 1 | -110 / 110 | **sim** |
| `PirateRoute` | Rota pirata | Cerco de todos os lados | 2 | 0 / 360 | não |
| `Destination` | Órbita do destino | Perseguição e Cruzador | 0 | 145 / 215 | não |

5. **Run:** GameObject `Run` com **RunManager**: `Trip`, `Ship`, `Plating` = Ship, `Allocation`, `Shop`, `All Defenses` = os 4 assets de defesa, `Trip Types` = OpenSpace, AsteroidBelt, PirateRoute, `Destination Type` = Destination.
6. **Painéis** (filhos do Canvas, cada um com uma Image de fundo escura cobrindo a tela inteira, para bloquear cliques no jogo por baixo):
   - `MenuPanel`: título "SPACE HAULER", texto `MenuStats` e botão "Decolar" → **On Click** = `Run` → `RunManager.NewRun`.
   - `RoutePanel`: título "Escolha o próximo trecho" e um objeto `Columns` com **HorizontalLayoutGroup** (Spacing `40`, Child Alignment `Middle Center`). Ligue **RouteMapView** no `RoutePanel`, com `Run` = `Run` e `Columns Container` = `Columns`.
   - `StationPanel`: título "Estação", texto `Status`, botões `RepairStep`, `RepairAll`, `Plating` (texto "Carenagem") e `Leave` ("Seguir viagem"), e o componente **StationPanel** com tudo ligado (`Run`, `Allocation`, `Ship`).
   - `ResultPanel`: texto `ResultText`, botão "Nova viagem" → `RunManager.NewRun` e botão "Menu" → `RunManager.BackToMenu`.
7. **Prefabs de UI** (em `Prefabs/UI/`):
   - `RouteColumn`: um RectTransform vazio com **VerticalLayoutGroup** (Spacing `20`, Child Alignment `Middle Center`) e **Content Size Fitter** (Vertical Fit = Preferred Size).
   - `RouteNodeButton`: um Button `180 × 110` com filhos `Label` (TextMeshPro) e `CurrentFrame` (Image só de borda, amarela).
8. Na `RouteMapView`, ligue `Column Prefab` = `RouteColumn` e `Node Prefab` = `RouteNodeButton`.

### ✅ Checkpoint da Fase 7
- O jogo abre no menu, com as estatísticas zeradas na primeira vez.
- "Decolar" mostra o mapa: 6 colunas, a última só com "DESTINO (B)"; cada nó mostra o tipo ("Espaço aberto", "Cinturão de asteroides", "Rota pirata") ou "ESTAÇÃO"; só os nós da primeira coluna são clicáveis.
- Escolher um trecho esconde o mapa e começa o trecho **com o padrão do tipo**: no Cinturão, os piratas vêm pela frente e aparecem asteroides; na Rota pirata, de todo lado.
- Escolher uma Estação abre a tela de reparo: "Reparar 50" cobra 25 de sucata; "Reparar tudo" para no casco máximo ou quando a sucata acaba; "Seguir viagem" volta ao mapa, e a Estação **não** conta como trecho concluído.
- Defesas, Carenagem, sucata e casco continuam de um nó para o outro.
- No último trecho aparece o Cruzador; destruí-lo e chegar ao fim mostra "Você chegou ao destino!".
- Perder mostra a tela de resultado; "Nova viagem" recomeça com 100 de sucata, nave vazia, Carenagem 0 e casco cheio (500).
- Na primeira run só há autocanhão e campo elétrico na barra; depois de uma run em que concluiu pelo menos 1 trecho, o canhão de plasma aparece na próxima.
- Fechar e abrir o jogo de novo mantém as estatísticas do menu.

#### Problemas comuns
- **Clicar no mapa também clica na nave por trás:** o painel não tem uma Image de fundo com **Raycast Target** ligado, então o `EventSystem` não sabe que o mouse está sobre a UI.
- **O trecho começa sozinho ao abrir o jogo:** o `Start On Play` do `TripManager` ainda está ligado.
- **`NullReferenceException` no `RouteNode.ToSettings`:** o `Destination Type` do `RunManager` está vazio, ou a lista `Trip Types` está vazia.
- **"Nova viagem" começa com casco 750:** o `ResetFull` foi chamado antes do `ResetLevel` da Carenagem. A ordem do `NewRun` importa.
- **As estatísticas zeram ao rodar de novo no Editor:** o PlayerPrefs do Editor é separado do da build, mas persiste entre Plays. Se zerar, confira se o `Save()` está sendo chamado (um `Debug.Log` nele ajuda). Para apagar de propósito: **Edit → Clear All PlayerPrefs**.

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
- Uma run inteira dá para ser jogada só com mouse (e as teclas `1`, `2` e `C` opcionais).
- O save sobrevive a fechar e abrir a aba.

#### Problemas comuns
- **"Unable to parse Build/....framework.js.gz":** o servidor não está mandando os arquivos `.gz` com o cabeçalho certo. Ligue **Decompression Fallback** e gere de novo.
- **O save some no navegador:** abas anônimas apagam o IndexedDB ao fechar; teste numa aba normal. Na build, o save só é gravado quando `PlayerPrefs.Save()` roda (já está no `MetaProgress.Save`).

### 8.3 Próximos passos

Tudo abaixo depende de decisões que a Parte 1 ainda marca como **Em aberto**:

- **Arte final:** os sprites PixelLab do protótipo (`Sprites/SpaceHauler/`) entram no lugar dos placeholders só arrastando sprites novos nos prefabs, sem mexer em código.
- **Áudio** (Parte 1 §14).
- **Decisão de hardpoint** (o maior risco da Parte 1 §17): jogar e conferir se os tipos de trecho fazem o jogador remontar as defesas, e se a Rota pirata pesa o bastante.
- **Indicador de inimigos fora da tela** (Parte 1 §13): agora que eles vêm de qualquer lado, uma seta na borda da tela pode fazer falta.
- **Mais tipos de trecho e de nó** (Parte 1 §8 e §9): ex.: nebulosa (alcance menor), loja, evento.
- **O que desbloquear e como** na meta-progressão (Parte 1 §10).
- **Coleta de sucata, pausa durante alocação e mover defesas** (Parte 1 §5).
- **A especiaria** (Parte 1 §1).
- **Mais habilidades, defesas e inimigos** (Parte 1 §4, §6, §7).

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
