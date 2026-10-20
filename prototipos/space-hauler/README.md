# Space Hauler — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`SpaceHauler.md`](../../SpaceHauler.md). Não precisa de build nem servidor: abra `index.html` no navegador. Joga-se no PC (mouse, teclado opcional) e no navegador do celular, deitado (toque).

Publicado em **https://manguebyte.github.io/gdd/prototipos/space-hauler/** a cada push na `main` (workflow `deploy-site.yml`).

## De onde veio
Começou como cópia de [`../fury-hauler/`](../fury-hauler/) (mesma estrutura: `data.js` com os números, `sim.js` com as regras sem tela, `game.js` com desenho, entrada e telas), mas é um **jogo separado**: os códigos evoluem cada um por si, e o save fica em `spacehauler.meta`.

## O que tem
- **Nave de carga** que voa sozinha pela rota, com **casco** de 500 e os **6 hardpoints**: proa, popa, 2 a bombordo e 2 a estibordo. Cada um só atira para o seu lado (arco de 180°); nenhum cobre 360°.
- **As 4 defesas**: autocanhão, canhão de plasma (cone curto), arpão magnético (atordoa naves) e campo elétrico (choque passivo em quem encosta, inclusive piratas a bordo). Cada uma tem 3 níveis.
- **Os 4 inimigos** e o pirata a bordo: caças que rondam a nave e atiram, drones kamikaze, naves de abordagem que soltam piratas (eles sabotam o hardpoint onde sobem) e o **cruzador pirata** no último trecho, que chama caças e bloqueia a chegada ao destino.
- **3 tipos de trecho** com padrões de ataque diferentes: **Espaço aberto** (perseguição por trás, risco 0), **Cinturão de asteroides** (emboscada pela frente e pelos lados, risco 1) e **Rota pirata** (cerco de todos os lados, risco 2). Cada ponto de risco dá +25% de sucata.
- **Asteroides** no Cinturão: aparecem à frente, batem no casco e **não podem ser destruídos**.
- **Carenagem** (botão ao lado da barra de compra, tecla C): 5 níveis, cada um com +50 de casco máximo e −12% de dano de colisão (asteroides e drones).
- **Estação**: nó do mapa sem combate, onde se repara o casco (2 de casco por 1 de sucata) e se compra Carenagem.
- **Habilidades**: pós-combustor e nuvem de detritos, com cooldown.
- **Run roguelite**: mapa de rota gerado com bifurcações, 6 camadas (5 trechos e o destino). Casco, defesas, Carenagem e sucata continuam de um trecho para o outro.
- **Desbloqueios permanentes** placeholder: plasma ao concluir 1 trecho numa run, arpão ao concluir 3. Save no `localStorage`.
- **Espaço isométrico** com a projeção do guia Unity: não há chão; a profundidade vem das estrelas em parallax, das boias da rota a cada 100 m e dos portais de salto no começo e no fim de cada trecho.

- **Arte PixelLab** em `Sprites/SpaceHauler/` (ver o `README.md` de lá): nave, inimigos, Cruzador, pirata a bordo, as 4 torres em 8 direções e 3 asteroides, no estilo do Fury Hauler. Cada sprite é um redesenho da forma vetorial do protótipo, então se um não carregar (ou com `#vector`) o objeto volta ao desenho por código. O fundo de estrelas, os planetas, as boias e os efeitos continuam desenhados por código.

## Controles
- **Mouse:** clique numa defesa da barra e depois num hardpoint vazio; clique numa defesa montada para melhorar ou vender. Botão direito cancela.
- **1 / 2:** pós-combustor / detritos. **Q W E R:** escolher defesa. **C:** Carenagem. **U / V:** melhorar / vender.
- **Shift + clique:** monta e mantém a mesma defesa escolhida.
- **Esc:** cancela. **P:** pausa (também pausa sozinho se a janela perder o foco).

## Atalhos de desenvolvimento
Junte quantos quiser depois do `#`, separados por vírgula (ex.: `index.html#unlock,rich,type=pirate`):

| Atalho | O que faz |
|---|---|
| `#short` | Trechos de 150 m em vez de 900 m. |
| `#rich` | Começa a run com 9999 de sucata. |
| `#unlock` | Todas as defesas liberadas. |
| `#type=open` / `asteroids` / `pirate` | O primeiro trecho da run é desse tipo. |
| `#boss` | Pula direto para o último trecho (o do cruzador). |
| `#route` / `#station` | Abre direto o mapa de rota / uma Estação (com o casco em 220). |
| `#auto` | Piloto automático: escolhe a rota, monta do lado do ataque, compra Carenagem, repara e usa habilidades (`autoPlay` em `sim.js`). |
| `#warp30` | Quando o primeiro trecho começa, simula 30 s de uma vez (para a miniatura do hub). |
| `#vector` | Ignora os sprites e usa só o desenho vetorial. |
| `#refs` | Exporta as referências vetoriais para o PixelLab. |

## Escolhas do protótipo onde o GDD diz "Em aberto"
Todas seguem os **placeholders** do próprio GDD:
- **Inimigos acompanham a velocidade de cruzeiro da nave** e se aproximam com uma sobra pequena (6, 8, 4 e 2 m/s, os relativos do Fury Hauler). Sem isso, quem vem pela frente fechava a 28 m/s e nenhuma defesa dava conta. Atordoados, perdem o embalo e ficam para trás. O pós-combustor não é acompanhado.
- **Pirata a bordo pode ser alvo de qualquer defesa**, sem olhar o arco (ele está no casco, não lá fora). Sem isso, um pirata na popa só morria com campo elétrico.
- **O risco vem do tipo de trecho** (aberto 0, asteroides 1, pirata 2), e o último trecho é perseguição por trás.
- **Estação** sem combate, no máximo uma por camada (25% de chance nas camadas do meio).
- **Saqueador/pirata**, **chefe**, **sucata automática**, **sem pausa na alocação** e **casco que não volta entre trechos**: como no Fury Hauler.

## Primeira leitura do balanceamento
Piloto automático no Node, 40 runs com sementes diferentes, com os números do GDD:

| Situação | Chegou ao destino | Trechos por run | Asteroides que bateram por run |
|---|---|---|---|
| Primeira run (autocanhão e campo elétrico) | 24/40 | 4,8 | 8,9 |
| Tudo liberado | 25/40 | 4,7 | 8,5 |

Casco perdido por trecho, em média: Espaço aberto ~60, Rota pirata ~57, **Cinturão de asteroides ~105**. O Cinturão é o trecho que mais pede Carenagem, que era a intenção. Mas a Rota pirata, que tem o maior risco, custa tanto quanto o Espaço aberto e dá 50% a mais de sucata: com estes números ela é a melhor escolha, e o risco dela precisa subir.

O dano vem principalmente de **drones** e **piratas a bordo**. Antes de mexer em números, vale jogar: o piloto automático monta sempre o mesmo plano e não reage ao meio do trecho.
