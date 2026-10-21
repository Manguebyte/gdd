# Iso Cards — protótipo web (JavaScript)

Protótipo do loop inteiro do [`IsoCards.md`](../../IsoCards.md): **Mapa do mundo → Campo de batalha → Recompensas → Cidade (Forja, Loja, Classes, Montagem) → Mapa**. Abra `index.html` no navegador, sem build. O progresso fica no `localStorage` (chave `isocards-save-v1`) e é gravado ao entrar numa Cidade; perder uma batalha volta ao último save.

Arquivos: `data.js` (cartas, classes, monstros, mapas, regiões, receitas), `game.js` (regras, telas e desenho), `sprites.js` (gerado; âncoras da arte), `style.css`.

**Tudo é desenhado num canvas 16:9** de 640×360 pixels de jogo, ampliado em escala inteira (com barras pretas se a janela não for 16:9). Não há interface HTML: mapa, cidade, batalha, cartas, menus e avisos são do jogo, com janelas no estilo dos menus do FF9 e texto em Pixelify Sans. A interface é imediata: cada quadro redesenha tudo e registra as áreas clicáveis.

## O que dá para fazer
- **Mapa do mundo:** 5 regiões na ordem Pântano → Floresta → Deserto → Gelo → Fogo, com 4 nós cada: Cidade, 2 Campos de batalha (rotas alternativas até o chefe) e o Ponto de história. Chegar num Campo pela primeira vez inicia a batalha; depois, o botão "Lutar aqui de novo" faz o farm. Vencer o chefe abre a trilha para a próxima Cidade.
- **Cidade:** grava o jogo; o ferreiro ensina as 2 receitas da cor local na primeira visita. Abas:
  - **Grupo e classes:** escolha os 3 que lutam, troque de classe (5 esferas da cor; volta grátis para classe já tida) e recrute Escudeiros (60 ouro, até 6).
  - **Montagem:** baralho de exatamente 40 cartas por personagem, só com cartas que a classe pode usar; a coleção é compartilhada (uma cópia só fica num baralho).
  - **Loja de esferas:** cor local mais barata, cores vizinhas na trilha e incolores.
  - **Forja:** 1 item + esferas. Receita exata → 2 cópias da carta (e a receita entra no Livro); errado → Carta Rachada. Conversão 3 → 1.
  - **Livro de Receitas:** aprendidas e descobertas. A descrição de cada item dá a pista da receita escondida.
- **Cartas:** carta de 56×80 com ilustração PixelLab de 48×48 e moldura em pixel art feita por código, uma cor por moldura (bicolor dividida ao meio), gema do custo e nome na placa. Na mão ficam em leque; a carta sob o mouse sobe e aparece ampliada (2×) com o texto completo. Clique numa carta para escolher **Jogar** ou **Descartar** (e **Passar** se for roubada); botão direito ou Esc cancela.
- **Batalha:** a do protótipo anterior (Vigor 3, dois efeitos por carta, Ladrão rouba e passa cartas), agora com **altura** (subir no máximo 1 nível por passo; ataque à distância de cima ganha +1 de alcance), estados (preso, veneno, queimadura), cura, área de aliados e Fúria (PV por Vigor).

## Placeholders do protótipo (não estão no GDD)
- A forja rende **2 cópias** por receita, e a primeira vez numa classe traz **4 cópias de cada exclusiva** dela. Sem isso, montar 40 cartas de uma cor levaria horas de farm.
- Preços (esfera local 10, vizinha 18, incolor 8), recompensas e PV dos monstros são chutes para testar o loop.
- A **Ressonância** das cartas bicolores está implementada, mas só dispara com as classes híbridas, que ainda são expansão. Hoje toda classe tem uma cor só.
- Ordem dos turnos: fase de grupo (o GDD deixa em aberto).

## Arte
PixelLab em [`Sprites/IsoCards/`](../../Sprites/IsoCards/), no estilo da cena-referência `example/cena-A2.png` (FFT com a paleta do FF9). Os ids estão em `pixellab-assets.json`, e `python Sprites/IsoCards/_tools/baixar.py` baixa tudo e regera o `sprites.js`.
- **Personagens:** só as diagonais da frente (sudeste) e de costas (nordeste); o jogo espelha as outras duas, como no FFT. Animações `parado` e `ataque`; o andar é deslize por código.
- **Chão:** tileset de transição isométrico de 16 peças por bioma (chão ↔ líquido), desenhado em grid dual: um tile em cada vértice, com os cantos vindos das 4 casas em volta, para a borda da água cair na borda das casas. As casas elevadas esticam a lateral do bloco, coluna a coluna, sem emenda.
- **Cenário:** árvore, pedra e decoração por bioma (pedra e árvore bloqueiam a casa).
- Bioma sem arte cai no desenho por código (blocos coloridos e bonecos na cor da classe), então o jogo inteiro roda mesmo antes de todos os lotes.

## Atalhos de desenvolvimento
Na URL, separados por vírgula (ex.: `index.html#reset,rich,mapa`):

| Atalho | O que faz |
|---|---|
| `#reset` | Apaga o save. |
| `#mapa` | Abre direto no mapa do mundo. |
| `#rich` | +2000 de ouro, 30 esferas de cada cor e 3 de cada item. |
| `#open` | Todas as regiões abertas e todos os chefes vencidos. |
| `#fast` | Inimigos agem 6× mais rápido. |
| `#auto` | O grupo joga sozinho, com a IA dos inimigos (teste e miniatura do hub). |
| `#zoom` | Junto com um mapa: começa com a 1ª carta da mão escolhida. |
| `#grupo`, `#montagem`, `#loja`, `#forja`, `#livro` | Abre a cidade nessa aba. |
| `#mangueSombrio` (ou qualquer chave de `MAPS`) | Começa direto nessa batalha. |
