# -*- coding: utf-8 -*-
# Gera os 9 planetas (3 Planet Cores x 3 Skins): loop de rotação de 32 frames (faixa de células 32x32)
# e o sprite estático (= frame 1). Mesma técnica de planet_rotation.py: ruído 3D na esfera,
# eixo inclinado 20°, luz de cima à esquerda, 3 tons por material, contorno preto.
# Uso: python planets.py <pasta_saida> [nome ...]   (sem nomes = todos)
import math, sys, os
from PIL import Image

TILT = math.radians(20)
OUT = (3, 4, 7)
N = 32


def hexc(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def ramp(*hs):
    return [hexc(h) for h in hs]   # sombra, meio, luz


def h(i, j, k, s):
    n = (i * 374761393 + j * 668265263 + k * 2147483647 + s * 1274126177) & 0xffffffff
    n = (n ^ (n >> 13)) * 1274126177 & 0xffffffff
    return ((n ^ (n >> 16)) & 0xffff) / 65535


def vnoise(x, y, z, s):
    i, j, k = math.floor(x), math.floor(y), math.floor(z)
    fx, fy, fz = x - i, y - j, z - k
    sm = lambda t: t * t * (3 - 2 * t)
    fx, fy, fz = sm(fx), sm(fy), sm(fz)
    v = 0
    for a in (0, 1):
        for b in (0, 1):
            for c in (0, 1):
                w = (fx if a else 1 - fx) * (fy if b else 1 - fy) * (fz if c else 1 - fz)
                v += w * h(i + a, j + b, k + c, s)
    return v


def fbm(p, s, f, o):
    t = 0; amp = 1; norm = 0
    for q in range(o):
        t += amp * vnoise(p[0] * f + 10, p[1] * f + 10, p[2] * f + 10, s + q); norm += amp; amp *= 0.5; f *= 2
    return t / norm


# Cada planeta: base (material de fundo), relief e detail, com a regra de onde cada um aparece.
#   relief: ('blob', limiar)  -> manchas (continentes, dunas, placas)
#           ('band', largura) -> linhas finas onde o ruído cruza 0,5 (rios de lava, rachaduras)
#   detail: ('blob', limiar, esticar_y) -> nuvens/lagos; ('polar', limiar) -> só perto dos polos (aurora)
PLANETS = {
    'Terra_Classic': None,  # já existe (planet_rotation.py seed 1); não é regerado aqui
    'Terra_Ocean': dict(seed=4, base=ramp('#2c66ba', '#3e87e4', '#4a94db'), rel=ramp('#4e9c38', '#60a637', '#79d434'),
                        relief=('blob', 0.64), det=ramp('#7bbca4', '#e1f2e3', '#ffffff'), detail=('blob', 0.67, 2.4)),
    'Terra_Desert': dict(seed=5, base=ramp('#c99458', '#e1af73', '#fdce98'), rel=ramp('#87552c', '#b17540', '#d2873a'),
                         relief=('blob', 0.52), det=ramp('#1275c5', '#31a8d8', '#7fdef2'), detail=('blob', 0.66, 1.0)),
    'Ice_Classic': dict(seed=6, base=ramp('#1275c5', '#31a8d8', '#7fdef2'), rel=ramp('#b0b7c2', '#dee2e7', '#ffffff'),
                        relief=('blob', 0.52), det=ramp('#cfd3dc', '#eef2f6', '#ffffff'), detail=('blob', 0.70, 2.4)),
    'Ice_Aurora': dict(seed=6, base=ramp('#1275c5', '#31a8d8', '#7fdef2'), rel=ramp('#b0b7c2', '#dee2e7', '#ffffff'),
                       relief=('blob', 0.52), det=ramp('#2fae74', '#5fe0a0', '#c8ffe0'), detail=('polar', 0.45)),
    'Ice_Crystal': dict(seed=7, base=ramp('#0e82c1', '#2cd3ff', '#97e0f2'), rel=ramp('#97e0f2', '#dff8ff', '#ffffff'),
                        relief=('blob', 0.50), rel_f=2.4, det=ramp('#ffffff', '#ffffff', '#ffffff'), detail=('blob', 0.80, 1.0)),
    'Magma_Classic': dict(seed=8, base=ramp('#3a1a14', '#5a2a1c', '#7a3a22'), rel=ramp('#cc3b07', '#db7803', '#fdd902'),
                          relief=('band', 0.05), det=ramp('#cc3b07', '#f7b404', '#fdd902'), detail=('blob', 0.80, 1.0)),
    'Magma_Obsidian': dict(seed=9, base=ramp('#120c14', '#1e1620', '#2e2430'), rel=ramp('#8d0710', '#ba1729', '#fe213b'),
                           relief=('band', 0.03), det=ramp('#3a3040', '#4a4058', '#6a6078'), detail=('blob', 0.76, 1.0)),
    'Magma_Solar': dict(seed=10, base=ramp('#f7b404', '#fdd902', '#fff4a0'), rel=ramp('#cc3b07', '#db7803', '#f7b404'),
                        relief=('blob', 0.60), det=ramp('#fff4a0', '#fffbe0', '#ffffff'), detail=('blob', 0.72, 1.0), glow=True),
}

C = 15.5; R = 15.5
MASK = [(x, y) for y in range(32) for x in range(32) if math.hypot(x - C, y - C) <= 15.6]
L = (-0.55, -0.6, 0.58); l = math.sqrt(sum(v * v for v in L)); L = tuple(v / l for v in L)


def edge(x, y):
    return any(math.hypot(x + dx - C, y + dy - C) > 15.6 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))


def render(cfg):
    frames = []
    S = cfg['seed']
    for k in range(N):
        rot = 2 * math.pi * k / N
        f = Image.new('RGBA', (32, 32), (0, 0, 0, 0)); fp = f.load(); mat = {}
        for x, y in MASK:
            if edge(x, y):
                fp[x, y] = OUT + (255,); continue
            nx = (x - C) / R; ny = (y - C) / R; nz = math.sqrt(max(0, 1 - nx * nx - ny * ny))
            y2 = ny * math.cos(TILT) - nz * math.sin(TILT); z2 = ny * math.sin(TILT) + nz * math.cos(TILT)
            xb = nx * math.cos(rot) + z2 * math.sin(rot); zb = -nx * math.sin(rot) + z2 * math.cos(rot)
            p = (xb, y2, zb)
            kind, par = cfg['relief'][0], cfg['relief'][1]
            v = fbm(p, S, cfg.get('rel_f', 1.1), 2 if kind == 'blob' else 3)
            rel = v > par if kind == 'blob' else abs(v - 0.5) < par
            dk = cfg['detail']
            if dk[0] == 'polar':
                w = fbm((p[0] * 2.0, p[1] * 6.0, p[2] * 2.0), S + 50, 1.3, 2)
                det = abs(y2) > 0.55 and w > dk[1]
            else:
                det = fbm((p[0] * 1.2, p[1] * dk[2], p[2] * 1.2), S + 50, 1.3, 2) > dk[1]
            d = nx * L[0] + ny * L[1] + nz * L[2]
            t = 0 if d < 0.15 else (1 if d < 0.75 else 2)
            if cfg.get('glow'):
                t = max(t, 1)     # estrela: sem lado escuro de verdade
            mat[(x, y)] = ('D' if det else ('R' if rel else 'B'), t)
        for _ in range(2):   # remove pixels isolados
            new = {}
            for (x, y), (m, t) in mat.items():
                nb = [mat[(x + dx, y + dy)][0] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if (x + dx, y + dy) in mat]
                if nb and m not in nb:
                    m = max(set(nb), key=nb.count)
                new[(x, y)] = (m, t)
            mat = new
        for (x, y), (m, t) in mat.items():
            fp[x, y] = {'B': cfg['base'], 'R': cfg['rel'], 'D': cfg['det']}[m][t] + (255,)
        frames.append(f)
    return frames


if __name__ == '__main__':
    out = sys.argv[1]
    names = sys.argv[2:] or [n for n, c in PLANETS.items() if c]
    os.makedirs(out, exist_ok=True)
    for n in names:
        fr = render(PLANETS[n])
        sheet = Image.new('RGBA', (32 * N, 32))
        for i, f in enumerate(fr):
            sheet.alpha_composite(f, (32 * i, 0))
        sheet.save(os.path.join(out, f'SPR_Planet_{n}_Rotate.png'))
        fr[0].save(os.path.join(out, f'SPR_Planet_{n}.png'))
        bg = (20, 18, 65, 255)
        g = [Image.alpha_composite(Image.new('RGBA', (32, 32), bg), f).resize((192, 192), Image.NEAREST).convert('P', palette=Image.ADAPTIVE) for f in fr]
        g[0].save(os.path.join(out, f'_preview_SPR_Planet_{n}_Rotate.gif'), save_all=True, append_images=g[1:], duration=250, loop=0)
        print(n)
