# Guerreiro da Masmorra 3D (app) — protótipo web (JavaScript + Three.js)

A [versão do app](../guerreiro-da-masmorra-app/) (combate com Fúria, sem dados) com a batalha em **3D no estilo HD-2D**, pelo mesmo método do [Guerreiro V2 3D](../guerreiro-da-masmorra-v2-3d/): a câmera é calibrada sobre a estrada do jogo, e personagens, objetos e cenário viram placas iluminadas nas mesmas posições de tela. Tela em retrato. Abra por um servidor http (Three.js pelo `importmap`; sem build). Se o CDN falhar, o jogo continua em 2D.

**Cópia mantida à mão:** o `index.html` é uma cópia do `../guerreiro-da-masmorra-app/index.html` com os mesmos ganchos do V2 3D (`#cv3d` embaixo do `#cv`, `ctx` como `let`, `drawActor(a, t, mode)`, `draw()` delegando a `window.R3D`, efeitos de cima em `drawOverlay(t)`). Reimportar o APK **não** atualiza esta pasta. Save próprio: `guerreiro-app-3d-save-v1`.

## O que o `render3d.js` daqui faz a mais que o do V2
- **Interiores** (Cripta, Igreja Profanada, Salão do Castelo): paredes dos dois lados da estrada e teto, em tiles que deslizam na marcha como o chão; uma tocha a cada 4 fileiras, alternando o lado, com luz que tremula e brilho; sem céu e sem luar, com o fundo do corredor sumindo no breu (`interior.dark` do bioma). O teto fica acima da câmera, senão taparia a cena.
- **Céu ao ar livre** com a silhueta de cidade do horizonte, que o `drawSky` do app já desenha.
- **Texturas por manifesto** ([`Sprites/GuerreiroDaMasmorraApp-3D/textures.js`](../../Sprites/GuerreiroDaMasmorraApp-3D/textures.js)): cada bioma diz de que pasta vem a estrada, a margem e a parede. Os biomas ao ar livre e o chão dos interiores reaproveitam as texturas do V2 3D; só as paredes dos interiores são novas.

## Atalhos
`#batalha` entra direto na masmorra (num save novo, abre o Campo de Treinamento).
