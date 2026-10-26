# Caderno de Aventuras — protótipo web

Protótipo jogável do [`CadernoDeAventuras.md`](../../CadernoDeAventuras.md): o RPG de caderno da escola. O herói anda pela folha pautada, o mestre desenha o mapa com canetas coloridas à medida que ele chega perto, e as lutas são decididas nos dados (cada item equipado dá dados; a soma é o dano).

Abra [`index.html`](index.html) no navegador (sem build). Não usa pasta `Sprites/`: **toda a arte é gerada por código** em traço de caneta e lápis de cor.

## Arquivos

| Arquivo | O que tem |
| --- | --- |
| `sketch.js` | Biblioteca de traços à mão: linha tremida, círculo que não fecha, hachura de lápis em zigue-zague, desenho parcial (para animar o mestre desenhando). |
| `world.js` | Gera a ilha de uma semente: terrenos, regiões de perigo, 3 vilas, covil do dragão, monstros, baús e personagens. |
| `art.js` | Desenhos: 13 monstros, herói, ícones, dados (silhueta por tipo) e cada quadrado do mapa. |
| `game.js` | Jogo: mapa em chunks, caneta do mestre, movimento, combate com dados, vilas, mochila, salvamento. |
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
| `?luta=orc` | Abre uma luta contra o monstro (`slime`, `rato`, `goblin`, `lobo`, `esqueleto`, `aranha`, `orc`, `bruxa`, `ogro`, `cavaleiro`, `troll`, `golem`, `dragao`). |

Exemplo: `index.html?novo&seed=7&revelar&ouro=2000`.

Save no `localStorage` em `caderno-aventuras-save-v1`.
