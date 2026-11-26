# Reino 8bit — protótipo web (JavaScript)

O [Reinos Hex](../reinos-hex/) com visual de fliperama neon 8-bit. GDD: [`Reino8bit.md`](../../Reino8bit.md). Abra `index.html` no navegador, sem build. Não tem save: recarregar a página volta ao menu.

Esta pasta é uma **cópia** de `../reinos-hex/`: as regras (`Rng`, `MapGenerator`, `validate`/`apply`/`preview`, IA) são as mesmas, linha por linha, e a mesma semente gera o mesmo mapa. Correção numa pasta não passa para a outra; se uma regra mudar no Reinos Hex, copie para cá.

Arquivos:
- `pixel.js`: os ícones 9 × 9 em código (`PIXEL.ICONES`), o desenho deles em pixel grande (`PIXEL.draw`), a versão `<img>` para o HUD (`PIXEL.img`) e o brilho (`PIXEL.bloom`).
- `game.js`: regras, IA e input iguais ao Reinos Hex; mudam a tabela de cores e ícones no topo e a seção "tela: câmera e desenho" (canvas de baixa resolução, ampliado sem suavizar, com brilho).
- `style.css`: painéis e botões neon, fontes VT323 e Press Start 2P (Google Fonts), scanlines e vinheta (`#crt`).
- `index.html`: o HTML do Reinos Hex, com título, fontes e textos sem emoji.

## Atalhos de desenvolvimento
Na URL, separados por vírgula (ex.: `index.html#ia,seed=7,pix=3`):

| Atalho | O que faz |
|---|---|
| `ia` | Começa direto contra a IA. |
| `hotseat` | Começa direto com dois jogadores. |
| `iaxia` | IA contra IA, para assistir. |
| `seed=N` | Usa a semente N (o console mostra a semente de cada partida). |
| `rapido` | A IA joga a cada 60 ms em vez de 450 ms. |
| `recursos` | +50 de cada recurso para os dois reinos no início. |
| `pix=N` | Tamanho do pixel 8-bit, de 1 (sem pixel) a 4. Padrão 2. |
| `sembrilho` | Desliga o brilho (bloom). |

No console: `Reino8bit.state()` devolve o estado da partida; `Reino8bit.preview({type:'atacar', from, to, count})` calcula uma batalha.

## Observação dos testes
- IA contra IA (semente 7) no Chrome headless: o tabuleiro desenha, as IAs jogam 36 rodadas em 4 s e o HUD mostra os ícones. Sem erros de script.
