"""Folha de prévia: cada carro nas 8 direções, numa linha, sobre um chão neutro. Uso: python previa_carros.py saida.png pasta1 [pasta2 ...]"""
import sys, pathlib
from PIL import Image
DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']
out, folders = sys.argv[1], sys.argv[2:]
sheet = Image.new('RGBA', (128 * 8, 128 * len(folders)), (120, 112, 96, 255))
for r, f in enumerate(folders):
    for c, d in enumerate(DIRS):
        p = pathlib.Path(f) / f'{d}.png'
        if p.exists():
            im = Image.open(p).convert('RGBA')
            sheet.alpha_composite(im, (c * 128 + (128 - im.width) // 2, r * 128 + (128 - im.height) // 2))
sheet.save(out)
