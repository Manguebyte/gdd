# 8-Bit Armageddon — Prompts do PixelLab

Prompts usados para gerar os sprites do jogo. Direção de arte, paleta e tamanhos: GDD §6.2. Referências visuais: `_referencia/ref1.png` (inimigos, projéteis, efeitos) e `_referencia/ref2.png` (planetas). As referências são arte de banco de imagens com marca d'água: servem só de guia de estilo e nunca entram no build.

## Bloco de estilo (vale para todo asset)

Colar no prompt de qualquer asset novo:

```
Classic colorful pixel art game sprite, soft shading with 3-5 tones per color, bright highlight
at the top-left (light from top-left), darker shade on the bottom-right. Crisp 1px black outline.
Seen from above (top-down) with a slight sense of volume. Centered, transparent background.
```

Para inimigos, somar: `cool lavender and purple palette, no blue`.

## Pipeline

1. **Guia de estilo:** recortar o objeto mais parecido da referência (`ref2` para planetas, `ref1` para inimigos) e reduzir para o tamanho nativo dele (os pixels das refs estão ampliados ~3×). Mandar como `style_image_base64` com `style_copy: ["color_palette", "detail", "shading"]`, sem `outline`, porque as refs não têm o contorno preto que o jogo usa.
2. **Gerar** com `create_image_pro` num canvas de **32×32** (a célula da grade, GDD §6.2), com `no_background: true`. Com 32 px, uma chamada devolve 64 candidatos (20 gerações).
3. **Tamanho do desenho:** o planeta ocupa a célula toda. Os outros sprites são desenhados no tamanho da tabela da §6.2 e centralizados numa célula de 32×32 transparente.
4. **Candidatos:** ficam em `<Pasta>/_candidatos/` até a aprovação. O escolhido vira `SPR_<Tipo>_<Nome>.png`, e os outros vão para `_candidatos_descartados/`.

## Assets

### SPR_Planet_Terra_Classic (32×32)

- **Arquivo final = 1º frame de `SPR_Planet_Terra_Classic_Rotate`**, para o planeta ter o mesmo mapa em todo o jogo. O candidato 13 abaixo definiu a paleta, a luz e o contorno, e está em `_candidatos_descartados/SPR_Planet_Terra_Classic_c13_estatico.png`.

- Ferramenta: `create_image_pro`, 32×32, seed 7, guia de estilo = planeta-Terra da `ref2` reduzido para 32×32.
- Prompt:

```
Earth-like planet pixel art sprite, round sphere filling the whole 32x32 canvas. Blue oceans with
bright green continents, a few small white clouds. Classic colorful pixel art with soft shading in
3-5 tones per color, bright highlight at the top-left (light from top-left), darker blue shade on
the bottom-right. Crisp 1px black outline around the sphere. Seen from slightly above (3/4 view).
Game asset, centered, transparent background.
```

- Pós-processamento: o candidato 13 (de 64) foi escolhido. A silhueta octogonal virou um círculo que ocupa a célula toda, com contorno preto de 1 px contínuo, e a paleta foi reduzida para 12 cores (quantização median cut).

### SPR_Planet_Terra_Classic_Rotate (32 frames × 32×32)

- **Sem IA:** gerado por `_tools/planet_rotation.py 32 1 0.55`. A superfície (terra, oceano, nuvens) é um ruído 3D aplicado à esfera, girando no eixo polar inclinado 20° para o jogador. Por isso a volta fecha sem emenda e os continentes não "tremem" entre frames.
- Usa a paleta de 12 cores do `SPR_Planet_Terra_Classic`, com 3 tons por material (sombra, meio, luz), luz vinda de cima à esquerda e contorno preto.
- Animação: 32 frames a 4 fps = 8 s por volta.
- Tentativas descartadas:
  - desenrolar o sprite 13 num mapa e girar: com só 32 px, o lado de trás precisou ser inventado e ficou uma emenda visível;
  - 16 frames: a superfície andava ~6 px por frame e parecia pular.

### SPR_Enemy_Grunt (2 variações × 4 frames, células de 32×32)

- Ferramenta: `create_image_pro`, **16×16**, seed 5. Guia de estilo = o disco voador da `ref1`, reduzido para o tamanho nativo (18×12).
- Prompt:

```
Tiny alien flying saucer UFO enemy sprite, about 12x12 pixels centered in a 16x16 canvas, radially
symmetric round disc seen from slightly above (3/4 view) with a small glass dome on top and a ring of
small lights around the rim. Cool lavender and purple palette, no blue. Classic colorful pixel art,
soft shading 3-4 tones, highlight at top-left. Crisp 1px black outline. Game asset, transparent background.
```

- Escolhidos: os candidatos **63** (linha 1 da spritesheet) e **28** (linha 2). Os dois saíram com 16 px de largura, e a tabela da §6.2 foi ajustada para isso.
- Pós-processamento (`_tools/grunt.py`): verde-água/azul trocado por magenta, cinza puxado para lavanda, paleta compartilhada de 9 cores, e 3 luzes magenta andando pela linha da borda (4 frames). O desenho de 16×16 fica centralizado na célula de 32×32.

### ~~SPR_Turret_Base / SPR_Turret_Arm~~ (obsoleto)

- **A Turret saiu do jogo** e foi substituída pelos Satellites (GDD §4.1). Os arquivos e o script foram para `Satellites/_candidatos_descartados/`. O registro abaixo fica só como histórico.

- **A IA falhou.** O `create_image_pro` 16×16 devolveu 64 variações quase iguais, borradas e sem contorno (estão em `Turrets/_candidatos_descartados/`).
- **Desenhados por script** (`_tools/turret.py`): cúpula de 8×6 px e braço dourado de 2 px de espessura com um cristal na ponta, em 16 direções. O ângulo é achatado (y × 0,6) para o isométrico falso. O frame 0 aponta para a direita, e os seguintes giram no sentido anti-horário, de 22,5° em 22,5°.
- Ordem de desenho: se o braço aponta para cima na tela, ele vai atrás da base; se aponta para baixo, na frente.

### SPR_Projectile_Satellite, SPR_Background_Space, SPR_Background_StarTwinkle

- Desenhados pixel a pixel por script (ver o histórico da sessão), sem IA:
  - projétil: bolinha de 4 px, com 2 frames;
  - fundo: 4 tiles azul-marinho de 32×32 com estrelinhas;
  - estrela grande: 4 frames, no formato das estrelas da `ref1`.

### SPR_Satellite (2 frames, células de 32×32)

- **A IA falhou de novo em sprite pequeno.** O `create_image_pro` 16×16 (seed 9, guia de estilo = o planeta) devolveu discos borrados, sem contorno e muitos na diagonal (estão em `Satellites/_candidatos_descartados/`).
- **Desenhado à mão por script** (`_tools/satellite.py`): corpo dourado de 4 px com antena, e 2 painéis solares laranja na horizontal. Ocupa 12×8 px, centralizado na célula de 32×32. Frame 1 = luz da antena acesa; frame 2 = apagada.
- **Regra prática:** para sprites de até ~12 px (Satellite, projéteis, ícones pequenos), desenhar à mão por script. A IA funciona bem a partir de ~16 px (Grunt) e no planeta de 32 px.
