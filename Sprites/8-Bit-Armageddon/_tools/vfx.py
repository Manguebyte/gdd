# -*- coding: utf-8 -*-
# VFX desenhados por script: explosões (pequena, grande, Mothership), laser (aviso, feixe, impacto)
# e as 6 setas do indicador de Spawn Sector.
# Uso: python vfx.py <pasta_saida>
import math, os, random, sys
from PIL import Image

K = (4, 2, 8, 255)
WHITE = (255, 255, 255, 255); PINK = (255, 170, 235, 255); MAG = (255, 120, 220, 255)
MAGD = (190, 80, 170, 255); PURP = (123, 94, 164, 255)
RED = (230, 30, 50, 255); REDL = (255, 110, 110, 255); REDD = (140, 10, 30, 255)
T = (0, 0, 0, 0)


def explosion(cell, radius, n_particles, frames=5, seed=1):
    """Núcleo branco que se abre em partículas magenta e some."""
    r = random.Random(seed)
    parts = []
    for _ in range(n_particles):
        a = r.uniform(0, 2 * math.pi); v = r.uniform(0.55, 1.0)
        parts.append((math.cos(a), math.sin(a), v, r.choice((1, 1, 2))))
    sheet = Image.new('RGBA', (cell * frames, cell), T)
    c = cell / 2 - 0.5
    for f in range(frames):
        im = Image.new('RGBA', (cell, cell), T); px = im.load()
        t = f / (frames - 1)
        # núcleo: cresce e some nos 3 primeiros frames
        core = ([radius * 0.35, radius * 0.5, radius * 0.3] + [0] * frames)[f]
        for y in range(cell):
            for x in range(cell):
                d = math.hypot(x - c, y - c)
                if d <= core:
                    px[x, y] = WHITE if d <= core * 0.55 else PINK
        # partículas: voam para fora, mudando de cor branco -> magenta -> roxo
        col = [WHITE, PINK, MAG, MAGD, PURP][min(f * 5 // frames, 4)]
        for dx, dy, v, sz in parts:
            if f == 0:
                continue
            dist = radius * v * (0.35 + 0.65 * t)
            x = round(c + dx * dist); y = round(c + dy * dist)
            s = sz if f < 3 else 1
            if f == frames - 1 and v < 0.8:
                continue
            for a in range(s):
                for b in range(s):
                    if 0 <= x + a < cell and 0 <= y + b < cell:
                        px[x + a, y + b] = col
        sheet.alpha_composite(im, (cell * f, 0))
    return sheet


def laser_tiles():
    """Aviso (2 frames), feixe (4 frames) e impacto (4 frames), horizontais, centralizados em y=16."""
    warn = Image.new('RGBA', (64, 32), T)
    for f in range(2):
        for x in range(32):
            if (x // 4) % 2 == 0:            # tracejado de 4 px
                warn.putpixel((32 * f + x, 16), RED if f == 0 else REDD)
    beam = Image.new('RGBA', (128, 32), T)
    r = random.Random(3)
    for f in range(4):
        for x in range(32):
            w = 1 if r.random() < 0.25 else 0   # tremulação: a borda às vezes engrossa
            for dy, col in ((-2 - w, REDD), (-1, RED), (0, WHITE), (1, RED), (2 + w, REDD)):
                if abs(dy) == 3 and w == 0:
                    continue
                beam.putpixel((32 * f + x, 16 + dy), col)
            beam.putpixel((32 * f + x, 16 - 1), REDL if (x + f) % 5 == 0 else RED)
    impact = Image.new('RGBA', (128, 32), T)
    for f in range(4):
        rad = [3.5, 5.0, 4.2, 5.5][f]
        for y in range(32):
            for x in range(32):
                d = math.hypot(x - 15.5, y - 15.5)
                if d <= rad:
                    impact.putpixel((32 * f + x, y), WHITE if d < rad * 0.45 else (REDL if d < rad * 0.75 else RED))
        # faíscas
        rr = random.Random(10 + f)
        for _ in range(5):
            a = rr.uniform(0, 2 * math.pi); d = rad + rr.uniform(1, 4)
            x = round(15.5 + math.cos(a) * d); y = round(15.5 + math.sin(a) * d)
            impact.putpixel((32 * f + x, y), REDL)
    return warn, beam, impact


def arrow(angle_deg, on):
    """Seta de 16 px apontando para dentro da tela (para o centro), vinda da direção do setor."""
    im = Image.new('RGBA', (32, 32), T); px = im.load()
    # a seta aponta PARA o planeta: direção oposta ao ângulo do setor
    a = math.radians(angle_deg + 180)
    ux, uy = math.cos(a), -math.sin(a)          # frente da seta (y da tela cresce para baixo)
    vx, vy = -uy, ux                            # lateral
    body = {}
    for y in range(32):
        for x in range(32):
            px_, py_ = x + 0.5 - 16, y + 0.5 - 16
            f = px_ * ux + py_ * uy            # ao longo da seta: -7 (cauda) .. +7 (ponta)
            s = abs(px_ * vx + py_ * vy)       # distância lateral
            head = 0 <= f <= 7 and s <= (7 - f) * 0.95
            shaft = -7 <= f < 0.5 and s <= 1.6
            if head or shaft:
                body[(x, y)] = MAG if on else MAGD
    for (x, y) in body:
        if (x + 0.5 - 16) * ux + (y + 0.5 - 16) * uy > 3 and on:
            px[x, y] = PINK
        else:
            px[x, y] = body[(x, y)]
    for (x, y) in list(body):
        for a2, b2 in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + a2, y + b2)
            if q not in body and 0 <= q[0] < 32 and 0 <= q[1] < 32:
                px[q] = K
    return im


if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    explosion(32, 9, 14, seed=1).save(os.path.join(out, 'SPR_VFX_Explosion_Small.png'))
    explosion(32, 14, 22, seed=2).save(os.path.join(out, 'SPR_VFX_Explosion_Big.png'))
    explosion(64, 28, 40, frames=6, seed=3).save(os.path.join(out, 'SPR_VFX_Explosion_Mothership.png'))
    w, b, i = laser_tiles()
    w.save(os.path.join(out, 'SPR_VFX_Laser_Warning.png'))
    b.save(os.path.join(out, 'SPR_VFX_Laser_Beam.png'))
    i.save(os.path.join(out, 'SPR_VFX_Laser_Impact.png'))
    sheet = Image.new('RGBA', (64, 32 * 6), T)   # linha = direção do setor; coluna = frame (aceso/apagado)
    for k, ang in enumerate((30, 90, 150, 210, 270, 330)):
        for f, on in enumerate((True, False)):
            sheet.alpha_composite(arrow(ang, on), (32 * f, 32 * k))
    sheet.save(os.path.join(out, 'SPR_UI_SpawnSectorArrow.png'))
    print('ok')
