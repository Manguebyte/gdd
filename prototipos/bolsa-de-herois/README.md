# Bolsa de Heróis — protótipo web (JavaScript)

Protótipo do loop inteiro do [`BolsaDeHerois.md`](../../BolsaDeHerois.md) (Parte 1): **Título → Mapa da run → Combate tático → Recompensa → Mapa**, até o Grifo. Abra `index.html` no navegador, sem build. A run fica no `localStorage` (chave `bolsa-de-herois-save-v1`) e é gravada ao entrar num nó e ao concluí-lo; recarregar no meio de um nó recomeça aquele nó.

Arquivos: `data.js` (fichas, páginas, heróis, inimigos, encontros e números da `CONFIG`), `game.js` (regras, telas e desenho), `style.css`.

**Tudo é desenhado num canvas de 640×360** pixels de jogo, ampliado. A interface é imediata: cada quadro redesenha tudo e registra as áreas clicáveis.

## Como se joga
- **Combate:** no início da rodada cada herói tira fichas da **sua** bag (Trilha de Fôlego) e os inimigos mostram a intenção sobre a cabeça.
  - Arraste fichas da **Mão** para as casas das páginas do livro (ou clique numa ficha: ela vai para a primeira casa que aceita; clicar numa ficha encaixada devolve para a mão).
  - Página completa acende **Usar**: escolha a casa amarela no mapa. Botão direito ou Esc cancela.
  - Arraste fichas para a **Reserva** para guardá-las para a próxima rodada.
  - **Encerrar turno** (tecla E): os inimigos agem, e todas as fichas voltam para a bag, menos as da Reserva.
  - Abas ou teclas 1–3 trocam o herói; clicar num herói no mapa também.
- **Ferida** (cinza) fica na bag pela run toda; **Medo** (roxo) some no fim do combate, mas enquanto estiver na mão bloqueia as páginas Especiais.
- **Run:** 7 camadas (Combate, Elite, Acampamento, Mercador; Acampamento antes do Chefe). Vitória dá ouro, XP e uma recompensa 1 de 3; a cada 10 XP uma trilha de um herói sobe.

## Placeholders do protótipo (não estão no GDD)
- O campo tem 9 obstáculos sorteados nas linhas do meio; os heróis começam nas duas linhas de baixo e os inimigos nas duas de cima (o GDD fala em colunas; aqui a câmera mostra os heróis de costas e os monstros de frente).
- Recompensa de ouro: 15. Sorteios com `Math.random` (recomeçar um nó sorteia de novo).

## Arte
Do Iso Cards, em [`Sprites/IsoCards/`](../../Sprites/IsoCards/): personagens (`guerreiro`, `arqueiro`, `mago`, `lobo`, `javali`, `bandido`, `lodo`, `grifo`), o chão da floresta (`tiles/floresta/tile_15.png`, a peça só de chão do tileset de transição) e o cenário (`cenario/floresta/`). As âncoras vêm de `../iso-cards/sprites.js`. Sem arte, cai em blocos e bonecos desenhados por código. Fichas, livro e intenções são desenhados por código (ainda não há arte, ver Parte 1 §13).

## Atalhos de desenvolvimento
Na URL, separados por vírgula (ex.: `index.html#reset,combate`):

| Atalho | O que faz |
|---|---|
| `#reset` | Apaga o save. |
| `#mapa` | Começa uma run nova direto no mapa. |
| `#combate` | Começa uma run nova direto num combate (Lobos). |
| `#chefe` | Com `#combate`, o combate é o do Grifo. |
| `#win` | Inimigos com 1 PV. |
| `#rich` | Run nova com 300 de ouro e 30 XP. |
| `#fast` | Animações 6× mais rápidas. |
