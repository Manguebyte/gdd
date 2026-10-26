# Caderno de Aventuras — protótipo web

Protótipo jogável do [`CadernoDeAventuras.md`](../../CadernoDeAventuras.md): o RPG de caderno da escola. O herói anda pela folha pautada, o mestre desenha o mapa com canetas coloridas à medida que ele chega perto, e as lutas são decididas nos dados (cada item equipado dá dados; a soma é o dano). Cada monstro tem um rei no fundo da sua masmorra, personagens com "!" dão missões, à noite os monstros ficam mais fortes e o herói precisa de tocha para enxergar, e no lugar de vilas há fogueiras: descansar cura, mas os monstros voltam.

Abra [`index.html`](index.html) no navegador (sem build). Não usa pasta `Sprites/`: **toda a arte é gerada por código** em traço de caneta e lápis de cor.

## Arquivos

| Arquivo | O que tem |
| --- | --- |
| `sketch.js` | Biblioteca de traços à mão: linha tremida, círculo que não fecha, hachura de lápis em zigue-zague, desenho parcial (para animar o mestre desenhando). |
| `world.js` | Gera a ilha de uma semente: terrenos, regiões de perigo, 6 acampamentos com fogueira, covil do dragão, monstros, baús, 12 masmorras e personagens (6 com missões, 9 com dicas, a 5+ quadrados um do outro). Gera também o interior de cada masmorra. |
| `art.js` | Desenhos: 13 monstros e as 12 versões chefe (com coroa), herói, ícones, dados (silhueta por tipo) e cada quadrado do mapa e da masmorra. |
| `game.js` | Jogo: mapa em chunks, caneta do mestre, movimento, combate com dados, masmorras, missões, dia e noite com tochas, fogueiras (descanso, loja, monstros voltando), mochila, salvamento. |
| `verify-browser.cjs` | Teste no navegador com Playwright: joga um pouco e tira screenshots em `_preview/` (fora do git). |

## Controles

| Tecla ou toque | Ação |
| --- | --- |
| Setas / WASD / direcional na tela | Andar |
| Clique ou toque num quadrado desenhado | Ir até lá pelo caminho mais curto |
| B ou I | Mochila |
| M | Ver a ilha inteira |
| 1–9 | Botões das folhas (luta, diálogos) |

## Atalhos de desenvolvimento (URL)

| Parâmetro | Efeito |
| --- | --- |
| `?novo` | Ignora o save (não apaga até você começar outra aventura). |
| `?seed=N` | Começa direto uma aventura na ilha da semente N. |
| `?revelar` | Revela a ilha inteira. |
| `?ouro=N` | Começa com N moedas. |
| `?nivel=N` | Sobe até o nível N. |
| `?luta=orc` | Abre uma luta contra o monstro (`slime`, `rato`, `goblin`, `lobo`, `esqueleto`, `aranha`, `orc`, `bruxa`, `ogro`, `cavaleiro`, `troll`, `golem`, `dragao`) ou um chefe (`chefe_rato`, `chefe_golem`...). |
| `?noite` | Começa à noite (acende uma tocha se tiver). |
| `?tochas=N` | Começa com N tochas. |
| `?masmorra=N` | Começa dentro da masmorra N (0 a 11, na ordem das regiões). |

Exemplo: `index.html?novo&seed=7&revelar&ouro=2000`.

Save no `localStorage` em `caderno-aventuras-save-v2`. Um save antigo (`-v1`, de antes das masmorras) é convertido ao continuar: a ilha da mesma semente é a mesma, só ganhou masmorras e personagens novos.
