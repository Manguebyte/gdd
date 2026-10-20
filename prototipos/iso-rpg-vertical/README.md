# Iso RPG Vertical — protótipo web (JavaScript)

O [Iso RPG](../iso-rpg/) com a **tela em pé**, para jogar no celular segurando com uma mão. Abra `index.html` no navegador, sem build (no computador, deixe a janela estreita ou use o modo celular do DevTools).

## Como é feito
- **Mesmo código:** a pasta só tem `index.html`, `style.css` e este README. O jogo é o `../iso-rpg/game.js`, carregado com `window.IR_PORTRAIT = true`. Regras, monstros, biomas, Almas, gemas e treinamento são os do Iso RPG; mudar o jogo é mudar aquele arquivo.
- **O que a flag muda no `game.js`:** tela lógica de 720 px de largura e 1280 a 1600 de altura (acompanha a proporção do celular); a câmera centraliza a sala (herói embaixo à esquerda, monstros no alto à direita) na metade de cima; os monstros ficam num leque mais fechado; o círculo de reação fica no meio da tela, entre a sala e o painel.
- **O que o `style.css` muda** (por cima do `../iso-rpg/style.css`): fila e indicador no topo; vida, Fúria e guarda numa faixa larga no meio; comandos embaixo, em botões maiores, ao alcance do polegar; no acampamento, a fogueira em cima e o painel embaixo. Com o celular deitado aparece o aviso para girar.
- **Mesmo save:** usa a mesma chave do Iso RPG (`isorpg-save-v1`), então o progresso é o mesmo nas duas versões no mesmo navegador.

## Controles
Os mesmos do Iso RPG: toque = parry (no fim do círculo = perfeito), arraste ↑ = salto, deslize ↔ = lateral; comandos: segure 0,9 s; toque num monstro para escolher o alvo.

## Atalhos de desenvolvimento
Os mesmos do [Iso RPG](../iso-rpg/README.md#atalhos-de-desenvolvimento) (`#go`, `#boss`, `#auto`, `#rich`, `#nvN`, `#reset`), ex.: `index.html#nv36,go`.
