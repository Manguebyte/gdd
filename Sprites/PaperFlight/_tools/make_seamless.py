"""Monta as camadas de fundo do Paper Flight que repetem sem emenda.

POR QUE: o PixelLab não gera bordas que casam, e o ParallaxLayer do jogo
repete a camada lado a lado (PaperFlight.md, Fase 3).

ESTRATÉGIA: desloca a camada meia largura (a emenda vai para o meio e as
bordas novas, que eram pixels vizinhos, já casam) e cola por cima um
elemento alto do mesmo tema (`_seam/<nome>.png`), centralizado na emenda e
com a base alinhada à última linha opaca da camada. Depois confere, linha a
linha, se sobrou alguma linha opaca da emenda sem cobertura.

Uso (na pasta Sprites/PaperFlight):
    python _tools/make_seamless.py
"""
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "backgrounds" / "_raw"
SEAM = ROOT / "backgrounds" / "_seam"
OUT = ROOT / "backgrounds"


def bottom_row(img):
    """Última linha com pixel opaco."""
    return img.getbbox()[3] - 1


def build(name):
    layer = Image.open(RAW / f"{name}.png").convert("RGBA")
    # Corta as colunas transparentes das bordas (as camadas "longe" vêm com
    # alguns pixels vazios nas laterais, que virariam um buraco ao repetir).
    x0, _, x1, _ = layer.getbbox()
    layer = layer.crop((x0, 0, x1, layer.height))
    w, h = layer.size
    shifted = ImageChops.offset(layer, w // 2, 0)
    cover_path = SEAM / f"{name}.png"
    uncovered = 0
    if not cover_path.exists():
        # Sem capa: conta as linhas em que as bordas originais não casam.
        for y in range(h):
            l, r = layer.getpixel((w - 1, y)), layer.getpixel((0, y))
            if l != r and (l[3] or r[3]):
                uncovered += 1
    else:
        cover = Image.open(cover_path).convert("RGBA")
        box = cover.getbbox()
        cx = (box[0] + box[2]) // 2
        dx = w // 2 - cx
        dy = bottom_row(shifted) - (box[3] - 1)
        shifted.alpha_composite(cover, (dx, dy)) if dx >= 0 and dy >= 0 else shifted.paste(cover, (dx, dy), cover)
        # A emenda fica entre as colunas w/2-1 e w/2: conta linhas em que
        # as duas são diferentes e a capa não cobre nenhuma delas.
        a = cover.getchannel("A")
        for y in range(h):
            cy = y - dy
            covered = 0 <= cy < cover.height and all(
                0 <= x - dx < cover.width and a.getpixel((x - dx, cy)) > 0 for x in (w // 2 - 2, w // 2 - 1, w // 2, w // 2 + 1)
            )
            l, r = layer.getpixel((w - 1, y)), layer.getpixel((0, y))
            if l != r and not covered and (l[3] or r[3]):
                uncovered += 1
    shifted.save(OUT / f"{name}.png")
    return uncovered


def main():
    for raw in sorted(RAW.glob("*.png")):
        uncovered = build(raw.stem)
        width = Image.open(OUT / f"{raw.stem}.png").width
        print(f"{raw.stem}: largura {width} px, linhas da emenda sem cobertura = {uncovered}")


if __name__ == "__main__":
    main()
