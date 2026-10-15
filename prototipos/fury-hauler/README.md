# Fury Hauler — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`FuryHauler.md`](../../FuryHauler.md). Não precisa de build nem servidor: abra `index.html` no navegador. Joga-se com mouse (teclado opcional), em PC.

## O que tem
- **Estrada isométrica** com a mesma projeção do guia Unity (`IsoProjection`, Fase 1): toda a lógica acontece no "chão" em metros e só o desenho converte para a tela. Deserto com pedras, ossos, pneus e carcaças; placas de distância a cada 100 m; portais de partida (A) e de fim do trecho (B no último).
- **Caminhão** que anda sozinho, com 500 de vida e os 6 slots placeholder do GDD (teto 360°, laterais 180° para o próprio lado, traseira 180° para trás).
- **As 4 defesas** (metralhadora, lança-chamas, arpão, blindagem com espinhos), que miram sozinhas dentro do leque do slot. Cada uma tem 3 níveis.
- **Os 4 inimigos** e o saqueador: motoqueiros que emparelham e atiram, carros-bomba que explodem ao bater, buggies que soltam saqueadores (que sabotam o slot onde sobem), e o caminhão de guerra no último trecho, que chama reforços e bloqueia a chegada a B enquanto existir.
- **Sucata e alocação** (Fase 5): clique numa defesa da barra de baixo e depois num slot vazio (os vazios acendem em verde e o leque de alcance aparece ao passar o mouse). Clique numa defesa montada para melhorar ou vender (50% do gasto).
- **Habilidades** placeholder (Fase 6): nitro e mancha de óleo, com cooldown.
- **Run roguelite** (Fase 7): mapa de rota gerado com bifurcações, 6 camadas (5 trechos e o chefe), risco de 0 a 2 por nó (+25% de sucata por ponto). Vida, defesas e sucata continuam de um trecho para o outro.
- **Desbloqueios permanentes** placeholder: lança-chamas ao concluir 1 trecho numa run, arpão ao concluir 3. Save no `localStorage`.

As regras ficam em `sim.js`, um porte direto do guia Unity (`TruckController`, `TruckHealth`, `TripManager`, `EnemySpawner`, os `Enemy`, as `Defense`, `ScrapWallet`, `AllocationController`, `AbilityController`, `RouteGenerator`, `RunManager`), sem nada de tela; por isso a simulação também roda no Node. `data.js` tem os números (os placeholders da Parte 1 §15); `game.js` cuida do desenho, da entrada, do HUD e das telas.

## Controles
- **Mouse:** clique para comprar, montar, melhorar e vender. Botão direito cancela.
- **1 / 2:** nitro / óleo.
- **Q W E R:** escolher metralhadora, lança-chamas, arpão, blindagem na barra de compra.
- **U / V:** melhorar / vender a defesa selecionada.
- **Shift + clique** num slot: monta e mantém a mesma defesa escolhida, para montar várias seguidas.
- **Esc:** cancela. **P:** pausa (o jogo também pausa sozinho se a janela perder o foco).

## Atalhos de desenvolvimento
Junte quantos quiser depois do `#`, separados por vírgula (ex.: `index.html#unlock,rich,boss`):

| Atalho | O que faz |
|---|---|
| `#short` | Trechos de 150 m em vez de 900 m. |
| `#rich` | Começa a run com 9999 de sucata. |
| `#unlock` | Todas as defesas liberadas. |
| `#boss` | Pula direto para o último trecho (o do chefe). |
| `#auto` | Piloto automático: escolhe a rota, compra, melhora e usa habilidades sozinho (`autoPlay` em `sim.js`). |
| `#warp30` | Quando o primeiro trecho começa, simula 30 s de uma vez (usado para gerar a miniatura do hub). |

## Escolhas do protótipo onde o GDD diz "Em aberto"
Todas seguem os **placeholders** que o próprio GDD já propõe:
- **Saqueador** sabota o slot e causa dano contínuo (Parte 1 §7).
- **Chefe** emparelha e atira como um motoqueiro resistente, chama motoqueiros e bloqueia a chegada a B (§7).
- **Sucata** entra direto na carteira quando o inimigo morre, sem clicar (§5).
- **Sem pausa** durante a alocação (§5). A pausa do protótipo (P) é só conveniência de teste.
- **Vida do caminhão** não volta entre trechos (§3).
- **Tipos de nó** só variam o risco (§8).

E escolhas só do protótipo:
- **Arte provisória desenhada por código** (caixas isométricas). A arte final está Em aberto (§11).
- **Defesas bloqueadas aparecem na barra**, cinzas, com o requisito ("Concluir 1 trecho"). O guia Unity só mostra as liberadas.
- **Atalhos de teclado** Q/W/E/R e U/V, que o GDD não define.
- **As ligações do mapa de rota são desenhadas como linhas.** O guia Unity, para simplificar, só escreve "Segue: A, B" em cada nó.

## Primeira leitura do balanceamento
Rodando o piloto automático no Node, 40 runs com sementes diferentes, com os números do GDD sem mudança:

| Situação | Chegou a B | Vida após o 1º trecho (mediana) | Carros-bomba que bateram, por run |
|---|---|---|---|
| Primeira run (só metralhadora e blindagem) | 40/40 | 500 | 0,1 |
| Tudo liberado (o plano usa lança-chamas e arpão) | 30/40 | 440 | 5,6 |

- **A metralhadora domina.** Com 40 de dano/s e 9 m de alcance, ela é melhor que o lança-chamas (35/s, mas só 4,5 m) e o arpão (~13/s) em quase tudo. Liberar defesas novas **piora** o resultado do piloto automático, porque as de alcance curto deixam os carros-bomba chegarem. Desbloquear algo deveria ser um ganho, então os números dessas duas defesas (ou o papel delas) precisam ser revistos.
- **O começo é fácil demais:** a primeira run quase nunca perde vida no 1º trecho.
- Os dois pontos tocam o maior risco de design da Parte 1 §16 (a escolha de qual defesa vai em qual slot precisa importar). O piloto automático segue um plano fixo; um jogador humano pode ir melhor ou pior, então vale jogar antes de mexer nos números.
