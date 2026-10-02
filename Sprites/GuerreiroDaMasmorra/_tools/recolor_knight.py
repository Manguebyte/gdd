"""Gera o chefe "Cavaleiro [Cor]" recolorindo o azul do Guerreiro.

POR QUE: no jogo publicado o chefe genérico é o próprio sprite do Guerreiro
nas cores da masmorra (Parte 1 §8.2). Recolorir localmente sai de graça e
mantém as animações idênticas às do herói.

ESTRATÉGIA: só os pixels azuis (túnica e escudo) mudam de matiz; cinza da
armadura, pele, couro e contorno ficam como estão. Para "Negro", o azul vira
cinza-chumbo (saturação baixa) em vez de outro matiz.

Uso (na pasta Sprites/GuerreiroDaMasmorra):
    python _tools/recolor_knight.py
"""
import colorsys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

# Arquivo de origem do herói -> nome base de saída do chefe.
SOURCES = {
    "heroes/warrior.png": "boss_knight",
    "anims/warrior_idle_sheet.png": "boss_knight_idle_sheet",
    "anims/warrior_attack_sheet.png": "boss_knight_attack_sheet",
}

# Cor da masmorra -> (matiz alvo em graus, multiplicador de saturação, multiplicador de brilho).
COLORS = {
    "red": (356, 1.0, 0.95),
    "black": (230, 0.15, 0.55),
    "purple": (275, 0.95, 1.0),
    "yellow": (44, 1.0, 1.15),
}

# Faixa de matiz considerada "azul do herói", em graus, e saturação mínima.
BLUE_MIN, BLUE_MAX, MIN_SAT = 195, 250, 0.35


def recolor(image: Image.Image, hue: float, sat_mul: float, val_mul: float) -> Image.Image:
    """Devolve uma cópia com os pixels azuis levados ao novo matiz."""
    out = image.convert("RGBA").copy()
    pixels = out.load()
    width, height = out.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if not (BLUE_MIN <= h * 360 <= BLUE_MAX and s >= MIN_SAT):
                continue
            nr, ng, nb = colorsys.hsv_to_rgb(hue / 360, min(1.0, s * sat_mul), min(1.0, v * val_mul))
            pixels[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
    return out


def main() -> None:
    out_dir = ROOT / "bosses"
    out_dir.mkdir(exist_ok=True)
    for source, base in SOURCES.items():
        path = ROOT / source
        if not path.exists():
            print(f"pulando {source} (ainda não existe)")
            continue
        image = Image.open(path)
        for color, (hue, sat, val) in COLORS.items():
            target = out_dir / f"{base}_{color}.png"
            recolor(image, hue, sat, val).save(target)
            print(f"{target.relative_to(ROOT)}")
    print("azul (Cavaleiro Azul) = o próprio sprite do Guerreiro.")


if __name__ == "__main__":
    main()
