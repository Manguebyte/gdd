# -*- coding: utf-8 -*-
# Gunner: candidato 6 do create_image_pro 16x16 (seed 17, guia de estilo = Grunt). Vira 4 frames de
# 32x32 em que os pixels magenta (a lente do canhão) pulsam: apagado, médio, aceso, médio.
import colorsys
from PIL import Image
src = Image.open('gunner_c06.png').convert('RGBA')
def is_magenta(c):
    r, g, b, a = c
    if not a: return False
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return 0.80 < h < 0.95 and s > 0.45
LEVEL = [0.75, 1.0, 1.3, 1.0]   # brilho da lente em cada frame
sheet = Image.new('RGBA', (32 * 4, 32), (0, 0, 0, 0))
for f, k in enumerate(LEVEL):
    im = src.copy(); p = im.load()
    for y in range(16):
        for x in range(16):
            if is_magenta(p[x, y]):
                r, g, b, a = p[x, y]
                h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
                r, g, b = colorsys.hls_to_rgb(h, min(0.92, l * k), s)
                p[x, y] = (int(r * 255), int(g * 255), int(b * 255), a)
    sheet.alpha_composite(im, (32 * f + 8, 8))   # desenho de 16x16 centralizado na célula de 32x32
sheet.save('../Enemies/SPR_Enemy_Gunner.png')
print('ok', sheet.size)
