"""Gera as linhas de upgrade do Túnel de vento e da Ultrapassagem a partir da linha de Engenharia.

POR QUE: o kit de UI do SpriteCook só tem linhas para as 4 áreas do MVP; as duas áreas novas
(GDD §4) precisam da mesma moldura com outro ícone.

ESTRATÉGIA: copia upgrade_row_engineering.png, cobre a engrenagem com a cor do fundo da moldura
e desenha um ícone simples em traço grosso na mesma cor de tinta: linhas de vento para o túnel e
duas setas para a ultrapassagem.

Uso (na pasta Sprites/PaddockBoss):
    python _tools/upgrade_rows_extra.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROWS = Path(__file__).resolve().parent.parent / "ui" / "components" / "upgrade_rows"
SS = 4  # desenha em 4× e reduz, para o traço sair suave como no resto do kit


def base():
    row = Image.open(ROWS / "upgrade_row_engineering.png").convert("RGBA")
    ink = row.getpixel((62, 35))
    bg = row.getpixel((96, 12))
    big = row.resize((row.width * SS, row.height * SS), Image.LANCZOS)
    d = ImageDraw.Draw(big)
    d.rectangle((14 * SS, 8 * SS, 86 * SS, 62 * SS), fill=bg)
    return big, d, ink


def wind():
    big, d, ink = base()
    w = 5 * SS
    for y, x0, x1 in [(22, 20, 70), (35, 14, 78), (48, 22, 66)]:
        d.line((x0 * SS, y * SS, (x1 - 8) * SS, y * SS), fill=ink, width=w)
        d.arc(((x1 - 16) * SS, (y - 8) * SS, x1 * SS, (y + 8) * SS), 270, 90, fill=ink, width=w)
    return big


def overtake():
    big, d, ink = base()
    w = 6 * SS
    for x in (22, 42):
        d.line((x * SS, 18 * SS, (x + 18) * SS, 35 * SS, x * SS, 52 * SS), fill=ink, width=w, joint="curve")
    d.ellipse((66 * SS, 30 * SS, 76 * SS, 40 * SS), fill=ink)
    return big


for name, fn in [("upgrade_row_aero", wind), ("upgrade_row_overtake", overtake)]:
    img = fn()
    img.resize((img.width // SS, img.height // SS), Image.LANCZOS).save(ROWS / f"{name}.png")
    print("ok", name)
