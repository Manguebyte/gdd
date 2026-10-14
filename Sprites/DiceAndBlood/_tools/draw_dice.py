# Desenha as faces 1–6 do d6 de frente, com a paleta do dado aprovado (ui/dado_icone.png).
from PIL import Image
from collections import Counter
src = Image.open('ui/dado_icone.png').convert('RGBA')
px = [src.getpixel((x, y)) for y in range(32) for x in range(32) if src.getpixel((x, y))[3] > 200]
def pick(cond): return Counter(p for p in px if cond(p)).most_common(1)[0][0]
OUT = pick(lambda p: sum(p[:3]) < 200)
HI = pick(lambda p: sum(p[:3]) > 600)
MID = pick(lambda p: 420 < sum(p[:3]) <= 600)
RED = pick(lambda p: p[0] > p[1] + 80)
DARKRED = tuple(max(0, int(c * 0.6)) for c in RED[:3]) + (255,)
PIPS = {1: [(1, 1)], 2: [(0, 0), (2, 2)], 3: [(0, 0), (1, 1), (2, 2)], 4: [(0, 0), (2, 0), (0, 2), (2, 2)],
        5: [(0, 0), (2, 0), (1, 1), (0, 2), (2, 2)], 6: [(0, 0), (2, 0), (0, 1), (2, 1), (0, 2), (2, 2)]}
for n, pips in PIPS.items():
    im = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    def rect(x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): im.putpixel((x, y), c)
    # corpo: face 24x22 + 3 px de espessura embaixo, cantos arredondados
    rect(4, 4, 27, 29, OUT)
    for x, y in [(4, 4), (27, 4), (4, 29), (27, 29)]: im.putpixel((x, y), (0, 0, 0, 0))
    rect(5, 26, 26, 28, MID)
    rect(5, 5, 26, 25, HI)
    for x, y in [(5, 5), (26, 5)]: im.putpixel((x, y), OUT)
    rect(5, 25, 26, 25, MID)
    for gx, gy in pips:
        cx, cy = 9 + gx * 6, 8 + gy * 6
        rect(cx, cy, cx + 2, cy + 2, RED); rect(cx, cy + 2, cx + 2, cy + 2, DARKRED); im.putpixel((cx, cy), HI)
    # gota de sangue escorrendo num canto, como no ícone aprovado
    rect(25, 26, 25, 28, RED)
    im.save(f'ui/dado_{n}.png')
    im.resize((96, 96), Image.NEAREST).save(f'_preview/dado_{n}_x3.png')
print('ok', OUT, HI, MID, RED)
