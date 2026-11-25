# Androide da Fábrica — protótipo web

Protótipo jogável do [`AndroideDaFabrica.md`](../../AndroideDaFabrica.md): o [Guerreiro da Masmorra (app)](../guerreiro-da-masmorra-app/) num mundo de robôs, em neon 8-bit. Tela em retrato. **Abra por um servidor http** (ex.: `python -m http.server` na raiz do repositório), como o app. Em `file://`, o navegador não deixa ler os pixels das imagens, e aí o filtro neon e a medida dos sprites não funcionam.

## De onde veio

O `index.html` é uma **cópia mantida à mão** de `../guerreiro-da-masmorra-app/index.html`, que é gerado do APK. Reimportar o APK **não** atualiza esta pasta. A cópia só mudou em:
- título, nome do app e cor do tema;
- ícone (desenhado pelo `neon-skin.js`);
- save próprio (`androide-fabrica-save-v1`);
- as fontes VT323 e Press Start 2P;
- três ligações: `neon-bots.js` antes do script do jogo, e `neon-skin.js` e `neon.css` depois.

O motor do jogo não mudou. A arte original continua vindo de [`Sprites/GuerreiroDaMasmorraApp/`](../../Sprites/GuerreiroDaMasmorraApp/): é dela que saem as medidas dos sprites e as imagens que passam pelo filtro.

## Como o neon é feito

| Arquivo | O que faz |
| --- | --- |
| `neon-bots.js` | Gera os robôs. Um robô é um rig de peças com poses por animação; cada corpo (humanoide, gosma, árvore, serpente, aranha, caveira, peixe, tartaruga, quadrúpede) fica em `BODY`, e qual unidade usa qual corpo fica em `SPECS`. `unitSheet` gera uma folha com o mesmo tamanho, número de quadros e caixa do corpo da original (`measure`). `heroSheet` e `campSheet` geram as folhas do herói (blocos 3×3 de 8 direções, 15 quadros) e a de frente do hangar. |
| `neon-skin.js` | Instala tudo por cima do jogo. 1) Cada `IMGS['unidade.anim']` vira um getter que gera a folha de robô quando é pedida. 2) `heroSheet` e `tinted` devolvem as folhas do herói. 3) `drawSky`, `drawSkyline`, `drawVerges`, `drawGround`, `drawInterior`, `drawSideProps`... desenham o corredor de grade neon (`THEME` por bioma). 4) `draw` e `drawMap` ganham o brilho. 5) `drawImage` passa toda imagem de `Sprites/GuerreiroDaMasmorraApp/` pelo filtro neon (`filterImage`, com ícones próprios em `ICON_DRAW`); os `<img>`, os fundos, as `border-image` e as variáveis `--ui-*` do CSS recebem a versão neon. 6) O tradutor (`DICT`) troca as palavras do tema no texto da página e do canvas. |
| `neon.css` | Cores, letra de terminal, fundo synthwave do hangar (sem o vídeo da fogueira), letra acesa nos comandos de batalha e scanlines. |

Para dar nome novo a algo, ponha a frase no `DICT` do `neon-skin.js` (frases antes das palavras soltas). Para mudar um robô, mude o `SPECS` do `neon-bots.js`.

## Atalhos

Os do app: `#batalha` entra direto na fábrica (num save novo, abre o Simulador de Treino), `#mago` testa o Hacker. Para zerar, use "zerar progresso" no hangar.
