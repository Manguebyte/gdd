# Terminal de Aventuras — protótipo web

Protótipo jogável do [`TerminalDeAventuras.md`](../../TerminalDeAventuras.md): o [Caderno de Aventuras](../caderno-de-aventuras/) num mundo de robôs, com visual de fliperama neon 8-bit. Um robô explorador anda por 5 zonas de máquinas, a IA do terminal traça o mapa em linhas de neon quando o scanner dele alcança, e as lutas contra os bots são decididas nos dados.

Abra [`index.html`](index.html) no navegador (sem build). Não usa pasta `Sprites/`: **toda a arte é gerada por código**.

## De onde veio

É uma **cópia** de [`../caderno-de-aventuras/`](../caderno-de-aventuras/) na versão 0.9.0. Os dois códigos evoluem cada um por si: correção num não passa para o outro. As regras, os números e a geração do mundo são os mesmos, e por dentro o código ainda usa os nomes do Caderno (`pagina`, `fogueira`, `masmorra`, `monstro`, `tocha`, `ouro`, `pocao`...). O glossário do GDD liga os nomes do código aos do jogo.

A geração do mundo (`world.js`) não mudou nenhum sorteio: **a mesma semente gera o mesmo mapa nos dois jogos.** Se mexer na geração, mantenha a ordem dos sorteios (a mesma regra do Caderno).

## O que mudou em relação ao Caderno

| Arquivo | Mudança |
| --- | --- |
| `sketch.js` | Mesma API. Paleta neon (os nomes `C.PAPER`, `C.INK`... ficaram; os valores são neon sobre preto). A "mão" quase não treme (`WOBBLE`), o círculo fecha certinho e a hachura de lápis virou linhas de varredura horizontais. Letra VT323. |
| `art.js` | Reescrito com a mesma API (`A.monster`, `A.tile`, `A.icon`...). Os 31 monstros viraram robôs, e o herói é um robô explorador. As fogueiras viraram postes de recarga, as masmorras casamatas e as escadas elevadores. Cada bioma ganhou o seu mapa. O terreno é desenhado com metade do brilho (`TERRAIN_DIM`) para os objetos saltarem aos olhos. |
| `world.js` | Só nomes: biomas e terrenos, estações, bases e chefes (agora com o artigo do chefe: `MASMORRAS[kind][2]`), guardiões, lendários e robôs de missão. |
| `game.js` | Tabelas e frases no tema (itens, programas, bots, golpes, duelistas, habilidades, peças, falas da IA). No desenho, o quadro é feito num canvas `PIX` vezes menor e ampliado sem suavizar (pixel 8-bit), depois ganha o brilho (`bloom()`). A grade do terminal, o laser da IA e a barra lateral substituem a pauta, a caneta e a margem. |
| `style.css` | As mesmas regras do Caderno, com um bloco "Tema neon" no fim: janelas pretas de borda acesa, botões neon, títulos em Press Start 2P e scanlines CRT (`body::after`). |
| `nuvem.js` | `FIREBASE_CONFIG = null`: conta, save na nuvem e arena PvP ficam desligados até o jogo ter um projeto Firebase próprio. As coleções já se chamam `terminal-saves`, `terminal-arena` e `terminal-lutas`. As regras de segurança são as do README do Caderno, trocando `caderno-` por `terminal-`. |
| `index.html`, `manifest.webmanifest`, `sw.js`, `icons/` | Nome, cores e ícones do Terminal. O cache do app é `terminal-v<versão>`, e o Google Analytics está desligado (`GA_ID` vazio). |

## Atalhos de desenvolvimento (URL)

Os mesmos do Caderno (ver o README dele), com os nomes de lá: `?novo`, `?seed=N`, `?revelar`, `?ouro=N` (créditos), `?nivel=N`, `?habilidades`, `?luta=<id>` (ids do Caderno: `rato`, `chefe_rato`, `guarda_0`, `lenda_2`, `duelo_0`, `dragao`...), `?grupo=2`, `?noite`, `?tochas=N` (lanternas), `?pagina=N` (zona 1 a 5), `?masmorra=N` (base), `?andar`, `?tempestade`, `?erupcao` (vazamento na Fundição), `?lenda`.

Só deste jogo:

| Parâmetro | Efeito |
| --- | --- |
| `?pix=N` | Tamanho do pixel na tela (1 a 4; padrão 2). `?pix=1` desliga o efeito 8-bit. |
| `?semglow` | Desliga o brilho (bloom). |

Exemplo: `index.html?novo&seed=7&revelar&ouro=2000`.

Save no `localStorage` em `terminal-aventuras-save-v1`; o som liga/desliga em `terminal-aventuras-som`.

`verify-browser.cjs` é o teste com Playwright do Caderno, apontado para esta pasta (screenshots em `_preview/`, fora do git).
