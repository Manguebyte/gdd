"""Deixa os pisos e as paredes do interior repetíveis sem emenda.

POR QUE: o PixelLab não gera bordas que casam, e o protótipo repete o piso em
grade e a parede na horizontal.

ESTRATÉGIA: desloca a imagem meia largura (e meia altura, no piso). A versão
deslocada casa nas bordas, porque as bordas novas eram pixels vizinhos.
Mistura as duas com um peso que vale 1 no centro e 0 nas bordas, e depois
devolve cada pixel à paleta original, para não criar cores novas.

Uso (na pasta Sprites/ProtocoloEctoplasma):
    python _tools/seamless.py
"""
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "interior" / "_raw"
OUT = ROOT / "interior"
JOBS = {"piso_madeira": "xy", "piso_concreto": "xy", "parede_sala": "x"}


def seamless(img, axes):
    w, h = img.size
    shifted = ImageChops.offset(img, w // 2 if "x" in axes else 0, h // 2 if "y" in axes else 0)
    mask = Image.new("L", img.size)
    px = mask.load()
    for y in range(h):
        for x in range(w):
            wx = 1 - abs(x - (w - 1) / 2) / ((w - 1) / 2) if "x" in axes else 1
            wy = 1 - abs(y - (h - 1) / 2) / ((h - 1) / 2) if "y" in axes else 1
            px[x, y] = int(255 * min(1, 2.2 * min(wx, wy)))
    mixed = Image.composite(img, shifted, mask)
    palette = img.convert("RGB").quantize(colors=48, method=Image.Quantize.MEDIANCUT)
    return mixed.convert("RGB").quantize(palette=palette, dither=Image.Dither.NONE).convert("RGBA")


for name, axes in JOBS.items():
    seamless(Image.open(RAW / f"{name}.png").convert("RGBA"), axes).save(OUT / f"{name}.png")
    print("ok", name)
