"""Prévia de props soltos: todos os PNGs da pasta lado a lado, sobre um chão neutro, com o nome embaixo. Uso: python previa_props.py saida.png pasta"""
import sys, pathlib
from PIL import Image, ImageDraw
out, folder = sys.argv[1], pathlib.Path(sys.argv[2])
ims = [(p.stem, Image.open(p).convert('RGBA')) for p in sorted(folder.glob('*.png'))]
W = sum(im.width + 8 for _, im in ims) + 8; H = max(im.height for _, im in ims) + 24
sheet = Image.new('RGBA', (W, H), (120, 150, 90, 255)); d = ImageDraw.Draw(sheet); x = 8
for n, im in ims:
    sheet.alpha_composite(im, (x, H - 20 - im.height)); d.text((x, H - 16), n, fill=(0, 0, 0)); x += im.width + 8
sheet.save(out)
