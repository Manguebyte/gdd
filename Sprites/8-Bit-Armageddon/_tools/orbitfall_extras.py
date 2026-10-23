# -*- coding: utf-8 -*-
# Arte pequena do Orbitfall desenhada por script (regra do PROMPTS.md: sprites de até ~12 px saem
# melhor à mão do que pela IA): o Gunner Bolt, o tiro refletido, o Reflector e a bolha do Energy Shield.
# Uso: python orbitfall_extras.py <pasta Sprites/8-Bit-Armageddon>
import math, sys, os
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else '..'
K = (4, 2, 8, 255)   # preto do contorno, o mesmo do Grunt

def save(img, rel):
    path = os.path.join(OUT, rel)
    img.save(path)
    print('ok', rel, img.size)

def orb(sheet, ox, oy, tones, lit):
    """Bolinha de 4 px com contorno (mesmo desenho do projétil do Satellite), centrada na célula 32x32."""
    dark, mid, light, core = tones
    cx, cy = ox + 16, oy + 16
    shape = [".KK.", "KmmK", "KmmK", ".KK."]
    for y, row in enumerate(shape):
        for x, ch in enumerate(row):
            if ch == 'K': sheet.putpixel((cx - 2 + x, cy - 2 + y), K)
            elif ch == 'm': sheet.putpixel((cx - 2 + x, cy - 2 + y), mid)
    sheet.putpixel((cx - 1, cy - 1), core if lit else light)   # brilho em cima à esquerda
    sheet.putpixel((cx, cy), dark)
    if lit:   # frame aceso: um halo de 1 px nos 4 lados
        for x, y in ((cx - 1, cy - 3), (cx, cy - 3), (cx - 3, cy - 1), (cx - 3, cy),
                     (cx + 2, cy - 1), (cx + 2, cy), (cx - 1, cy + 2), (cx, cy + 2)):
            sheet.putpixel((x, y), light[:3] + (150,))

def projectile(tones, rel):
    sheet = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    orb(sheet, 0, 0, tones, True)
    orb(sheet, 32, 0, tones, False)
    save(sheet, rel)

MAGENTA = ((150, 30, 120, 255), (255, 90, 210, 255), (255, 170, 235, 255), (255, 255, 255, 255))
CYAN = ((40, 110, 170, 255), (110, 200, 255, 255), (190, 235, 255, 255), (255, 255, 255, 255))

# ---------------------------------------------------------------- Reflector (12x10, 2 frames)
# Um prisma azul-claro dentro de uma moldura cinza (a "família" do Satellite), com a luz piscando.
def reflector():
    G1, G2, G3 = (70, 72, 82, 255), (120, 122, 134, 255), (176, 178, 190, 255)   # cinzas do Satellite
    B1, B2, B3, W = CYAN
    art = [
        "....KKKK....",
        "...KggggK...",
        "..KgBbbbgK..",
        ".KgBbbbbbgK.",
        "KgBbbwbbbBgK",
        "KgBbbbbbbBgK",
        ".KgBbbbbBgK.",
        "..KgBBBBgK..",
        "...KddddK...",
        "....KKKK....",
    ]
    sheet = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    for f in range(2):
        for y, row in enumerate(art):
            for x, ch in enumerate(row):
                c = {'K': K, 'g': G2, 'd': G1, 'B': B1, 'b': B2, 'w': W if f == 0 else B3}.get(ch)
                if c: sheet.putpixel((f * 32 + 10 + x, 11 + y), c)
        sheet.putpixel((f * 32 + 14, 12), G3)   # brilho da moldura em cima à esquerda
    save(sheet, 'Satellites/SPR_Reflector.png')

# ---------------------------------------------------------------- Energy Shield (48x48)
# 3 linhas (1, 2 e 3 cargas) x 4 frames: um anel de 1 px por carga (raios 19, 21, 23 px, por fora do
# planeta de 32 px) e um trecho mais claro que dá a volta, para a bolha "brilhar" sem mudar de tamanho.
def ring_points(r):
    pts = set()
    for i in range(int(2 * math.pi * r * 3)):
        a = i / (r * 3)
        pts.add((round(24 + math.cos(a) * r - 0.5), round(24 + math.sin(a) * r - 0.5)))
    return pts

def shield():
    base = (110, 190, 255, 150); bright = (220, 240, 255, 235)
    sheet = Image.new('RGBA', (48 * 4, 48 * 3), (0, 0, 0, 0))
    for charges in range(1, 4):
        for f in range(4):
            for k in range(charges):
                r = 19 + 2 * k
                for (x, y) in ring_points(r):
                    a = math.degrees(math.atan2(y - 24, x - 24)) % 360
                    lit = ((a - f * 90 - k * 40) % 360) < 50
                    sheet.putpixel((f * 48 + x, (charges - 1) * 48 + y), bright if lit else base)
    save(sheet, 'VFX/SPR_VFX_EnergyShield.png')

    # Estouro da última carga: o anel cresce e se quebra em pontos que somem (5 frames, uma vez).
    pop = Image.new('RGBA', (48 * 5, 48), (0, 0, 0, 0))
    for f in range(5):
        r = 19 + f * 1.2
        alpha = int(255 * (1 - f / 5))
        for (x, y) in ring_points(r):
            a = math.degrees(math.atan2(y - 24, x - 24)) % 360
            if f >= 2 and (a // 12) % 2: continue   # do frame 3 em diante, o anel vira tracejado
            if 0 <= x < 48 and 0 <= y < 48:
                pop.putpixel((f * 48 + x, y), (220, 240, 255, alpha))
    save(pop, 'VFX/SPR_VFX_EnergyShield_Pop.png')

projectile(MAGENTA, 'Projectiles/SPR_Projectile_GunnerBolt.png')
projectile(CYAN, 'Projectiles/SPR_Projectile_Reflected.png')
reflector()
shield()
