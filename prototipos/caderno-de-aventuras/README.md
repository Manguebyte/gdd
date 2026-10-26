# Caderno de Aventuras — protótipo web

Protótipo jogável do [`CadernoDeAventuras.md`](../../CadernoDeAventuras.md): o RPG de caderno da escola. O herói anda pela folha pautada, o mestre desenha o mapa com canetas coloridas à medida que ele chega perto, e as lutas são decididas nos dados (cada item equipado dá dados; a soma é o dano). Cada monstro tem um rei no fundo da sua masmorra, personagens com "!" dão missões, à noite os monstros ficam mais fortes e o herói precisa de tocha para enxergar, e no lugar de vilas há fogueiras: descansar cura, mas os monstros voltam. O mundo são 5 páginas do caderno, uma por bioma (Campos, Deserto, Montanhas Geladas, Pântano Sombrio e Vulcão), e o dragão mora no fim da última.

Abra [`index.html`](index.html) no navegador (sem build). Não usa pasta `Sprites/`: **toda a arte é gerada por código** em traço de caneta e lápis de cor.

## Arquivos

| Arquivo | O que tem |
| --- | --- |
| `sketch.js` | Biblioteca de traços à mão: linha tremida, círculo que não fecha, hachura de lápis em zigue-zague, desenho parcial (para animar o mestre desenhando). |
| `world.js` | Gera as 5 páginas de uma semente. Cada página é uma ilha do seu bioma: terrenos, 3 regiões de perigo, 5 fogueiras, a passagem para a próxima página (ou o covil do dragão, na última), a seta de volta, monstros, baús, 6 masmorras e personagens (3 com missões, 4 com dicas, a 5+ quadrados um do outro). Gera também o interior de cada masmorra. |
| `art.js` | Desenhos: 31 monstros e as 30 versões chefe (com coroa), herói, ícones, dados (silhueta por tipo) e cada quadrado do mapa (com o desenho de cada bioma) e da masmorra. |
| `game.js` | Jogo: mapa em chunks, caneta do mestre, movimento, virar a página, combate com dados, masmorras, missões, dia e noite com tochas, fogueiras (descanso, loja, monstros voltando), mochila, salvamento. |
| `manifest.webmanifest`, `sw.js`, `icons/` | App instalável (PWA): nome, ícones (desenhados com a arte do jogo), tela cheia em qualquer orientação, e o service worker que guarda os arquivos para jogar sem internet. O cache leva a versão do jogo (de `../versao.js`). |
| `verify-browser.cjs` | Teste no navegador com Playwright: joga um pouco e tira screenshots em `_preview/` (fora do git). |

## Instalar no celular

Abra o protótipo publicado no site (https) pelo navegador do celular:

- **Android (Chrome):** toque em **Instalar no celular** na capa (ou no menu ⋮ → "Instalar app").
- **iPhone (Safari):** Compartilhar → **Adicionar à Tela de Início**.

O jogo ganha ícone, abre em tela cheia, gira junto com o celular (em pé ou deitado) e funciona sem internet. No Android o save é o mesmo do navegador; no iPhone o app instalado tem um save separado do Safari. O service worker só é registrado em https: abrindo o `index.html` do disco ou num servidor local, o jogo roda normal, sem ele.

## Controles

| Tecla ou toque | Ação |
| --- | --- |
| Setas / WASD / direcional na tela | Andar |
| Clique ou toque num quadrado desenhado | Ir até lá pelo caminho mais curto |
| B ou I | Mochila |
| M | Ver a página inteira |
| 1–9 | Botões das folhas (luta, diálogos) |

## Atalhos de desenvolvimento (URL)

| Parâmetro | Efeito |
| --- | --- |
| `?novo` | Ignora o save (não apaga até você começar outra aventura). |
| `?seed=N` | Começa direto uma aventura no mundo da semente N. |
| `?revelar` | Revela a página inteira. |
| `?ouro=N` | Começa com N moedas. |
| `?nivel=N` | Sobe até o nível N. |
| `?luta=orc` | Abre uma luta contra um monstro pelo id (a lista está em `POOLS`, no `world.js`: `slime`, `escorpiao`, `boneco_neve`, `fenix`...; ou `dragao`) ou um chefe (`chefe_rato`, `chefe_fenix`...). |
| `?noite` | Começa à noite (acende uma tocha se tiver). |
| `?tochas=N` | Começa com N tochas. |
| `?pagina=N` | Começa na primeira fogueira da página N (1 Campos, 2 Deserto, 3 Montanhas Geladas, 4 Pântano Sombrio, 5 Vulcão). |
| `?masmorra=N` | Começa dentro da masmorra N da página (0 a 5, na ordem das regiões). Junto com `?pagina`, é da página escolhida. |

Exemplo: `index.html?novo&seed=7&revelar&ouro=2000`.

Save no `localStorage` em `caderno-aventuras-save-v3`. Saves de antes das páginas (`-v1` e `-v2`) não são carregados: a mesma semente agora gera outro mundo.
