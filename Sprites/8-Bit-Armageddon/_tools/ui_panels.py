# -*- coding: utf-8 -*-
# Painéis e botões 9-slice (metal cinza-escuro, bordas claras, detalhes laranja), células de 32x32.
# No Unity: Sprite Editor -> Border = 8 px em todos os lados; Image Type = Sliced.
# Uso: python ui_panels.py <pasta_saida>
import os, sys
from PIL import Image

K = (12, 10, 14, 255)
D0 = (38, 40, 46, 255); D1 = (58, 60, 66, 255); D2 = (78, 80, 88, 255)
L1 = (120, 122, 130, 255); L2 = (160, 162, 170, 255)
O = (242, 142, 23, 255); OD = (178, 84, 24, 255); OL = (255, 200, 90, 255)
G0 = (48, 48, 52, 255); G1 = (70, 70, 76, 255); G2 = (96, 96, 102, 255)   # desabilitado
T = (0, 0, 0, 0)


def panel(face, top, bottom, rivet, accent=None, pressed=False):
    """Retângulo 32x32 com contorno preto, bisel (claro em cima/esquerda, escuro embaixo/direita) e rebites."""
    im = Image.new('RGBA', (32, 32), T); p = im.load()
    for y in range(32):
        for x in range(32):
            corner = (x in (0, 31) and y in (0, 31))
            if corner:
                continue
            if x in (0, 31) or y in (0, 31):
                p[x, y] = K
            elif (y == 1 or x == 1):
                p[x, y] = bottom if pressed else top
            elif (y == 30 or x == 30):
                p[x, y] = top if pressed else bottom
            else:
                p[x, y] = face
    for (x, y) in ((3, 3), (28, 3), (3, 28), (28, 28)):   # rebites nos cantos (dentro da borda de 8 px)
        p[x, y] = rivet
    if accent:   # faixa laranja no topo, só nos cantos + meio (sobrevive ao 9-slice)
        for x in range(4, 28):
            p[x, 5] = accent
    return im


def drawer_strip():
    """Faixa da gaveta fechada: topo com linha laranja, corpo escuro."""
    im = Image.new('RGBA', (32, 32), T); p = im.load()
    for y in range(32):
        for x in range(32):
            if y == 0:
                p[x, y] = K
            elif y == 1:
                p[x, y] = O
            elif y == 2:
                p[x, y] = OD
            elif y == 3:
                p[x, y] = L1
            else:
                p[x, y] = D1 if y < 30 else D0
    return im


if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    panel(D1, L1, D0, D2, accent=O).save(os.path.join(out, 'SPR_UI_Panel.png'))
    btn = Image.new('RGBA', (96, 32), T)   # normal | pressionado | desabilitado
    btn.alpha_composite(panel(D2, L2, D0, OL), (0, 0))
    btn.alpha_composite(panel(D1, L1, D0, O, pressed=True), (32, 0))
    btn.alpha_composite(panel(G1, G2, G0, G2), (64, 0))
    btn.save(os.path.join(out, 'SPR_UI_Button.png'))
    drawer_strip().save(os.path.join(out, 'SPR_UI_DrawerStrip.png'))
    print('ok')
