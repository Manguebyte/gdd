"""Ajusta as cores dos tilesets de plataforma ao GDD (Direção de arte).

POR QUE: o PixelLab gerou a superfície com tijolo arroxeado e musgo verde, e o bunker com borda roxa.
O GDD pede cinza e ferrugem na superfície, e dourado, branco e mármore no bunker.

ESTRATÉGIA: trabalha em HSV pixel a pixel. Na superfície, tira quase toda a saturação, menos do
musgo e da ferrugem, e esquenta um pouco o cinza. No bunker, leva o roxo e o azul para o tom do
dourado. Os originais ficam em tiles/_raw/.

Uso (na pasta Sprites/UltimaEntrega):
    python _tools/recolor_tiles.py
"""
import colorsys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def recolor(name, fn):
    img = Image.open(ROOT / "tiles" / "_raw" / f"{name}.png").convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            h, s, v = fn(h, s, v)
            r2, g2, b2 = colorsys.hsv_to_rgb(h, s, v)
            px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    img.save(ROOT / "tiles" / f"{name}.png")
    print("ok", name)


def surface(h, s, v):
    deg = h * 360
    if 60 <= deg <= 150:             # musgo: verde doentio, mais apagado
        return h, s * 0.55, v * 0.9
    if deg < 40 or deg > 340:        # ferrugem e tijolo quente: mantém
        return h, s * 0.8, v
    return 30 / 360, s * 0.18, v * 0.92   # pedra roxa/azul vira cinza levemente quente


def bunker(h, s, v):
    deg = h * 360
    if 200 <= deg <= 320 and s > 0.15:    # roxo/azul da borda vira dourado
        return 43 / 360, min(1, 0.45 + s * 0.4), min(1, v * 1.15 + 0.1)
    return h, s, v


recolor("superficie", surface)
recolor("bunker", bunker)
