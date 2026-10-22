# Iso RPG 3D — protótipo web (JavaScript + Three.js)

Teste do [Iso RPG](../iso-rpg/) em **3D no estilo HD-2D** (como Octopath Traveler): a masmorra é uma cena 3D de verdade e os personagens continuam sendo a pixel art do PixelLab. Não tem GDD próprio; as regras são as do [Guerreiro da Masmorra](../../GuerreiroDaMasmorra.md) com as mudanças do Iso RPG (biomas, 42 masmorras, Almas, gemas). Abra `index.html` por um servidor local (o Three.js vem do jsDelivr por `importmap`; sem build). Tela deitada, com mouse, teclado ou toque.

**Cópia separada:** o `game.js` daqui começou como cópia do `../iso-rpg/game.js` e não é compartilhado. Correções de regra feitas lá não chegam aqui sozinhas (e vice-versa). O save também é separado (`isorpg3d-save-v1`).

## O que muda em relação ao Iso RPG
- **Cena Three.js no lugar do canvas isométrico.** A lógica continua no chão (`gx`, `gy`, altura `h` em px de arte); o desenho converte com `x = gx`, `z = gy`, `y = h / 42`. Só a seção "desenho 3D" do `game.js` é nova.
- **Piso e paredes 3D** com texturas próprias por bioma em [`Sprites/IsoRpg3D/`](../../Sprites/IsoRpg3D/) (piso visto de cima, face de parede vista de frente). As paredes são blocos com volume, 2 de altura, com tocha a cada 5 tiles.
- **Personagens e objetos em placas:** os mesmos sprites do Iso RPG (`Sprites/IsoRpg/`), em pé no chão, virados para a câmera e **iluminados pelas luzes da cena**. Golpe recebido é uma piscada branca (emissivo); a gosma derrete achatando a placa.
- **Luz de verdade:** uma PointLight por tocha (tremulando), a fogueira (que projeta sombra dos personagens e objetos), uma luz no herói e uma em cada monstro (maior no chefe), e os projéteis mágicos brilham e iluminam o caminho.
- **Câmera em perspectiva** sempre no ângulo de onde os sprites foram desenhados (do sudeste, 45°, 33° de elevação). Ela não gira: os sprites só têm uma direção (herói para o nordeste, monstros para o sudoeste).
- **Pós-processamento HD-2D:** bloom nas chamas e magias, tilt-shift (borrão em cima e embaixo, cara de maquete) e vinheta.
- **HUD igual:** barras, nomes, números e o círculo de reação continuam numa camada 2D por cima; `P()` agora projeta pela câmera 3D, então tocar num monstro para escolher o alvo funciona igual. O anel do alvo é desenhado em perspectiva no chão. Neve, folhas e brasas do bioma caem na camada 2D, como antes.

## Se o HD-2D não convencer
O plano combinado é partir para um **3D low-poly** (personagens de primitivas, câmera livre). Como só a seção de desenho mudou, essa troca também fica restrita a ela.

## Controles e atalhos
Os mesmos do [Iso RPG](../iso-rpg/README.md#controles): reação com toque/arraste/deslize ou Espaço/↑/←→, comandos segurando 0,9 s, alvo tocando no monstro ou ←→. Na URL: `#go`, `#boss`, `#auto`, `#rich`, `#nv7` (qualquer número), `#reset`.
