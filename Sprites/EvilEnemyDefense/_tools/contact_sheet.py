"""Monta uma folha de pré-visualização com todos os sprites de uma pasta.

POR QUE: conferir de uma vez se o elenco gerado no PixelLab está coerente
(escala, contorno, paleta) antes de animar.

ESTRATÉGIA: cada PNG é ampliado em escala inteira (vizinho mais próximo,
sem borrar o pixel) e colado sobre fundo magenta, alinhado pela base, para
as alturas relativas ficarem visíveis.

Uso (na pasta Sprites/EvilEnemyDefense):
    python _tools/contact_sheet.py units _preview/units.png
"""
import sys
from pathlib import Path

from PIL import Image

SCALE = 3
GAP = 12


def main(folder: str, out: str) -> None:
    files = sorted(Path(folder).glob("*.png"))
    sprites = [Image.open(f).convert("RGBA") for f in files]
    width = sum(s.width * SCALE + GAP for s in sprites) + GAP
    height = max(s.height for s in sprites) * SCALE + 2 * GAP
    sheet = Image.new("RGBA", (width, height), (255, 0, 255, 255))
    x = GAP
    for sprite in sprites:
        big = sprite.resize((sprite.width * SCALE, sprite.height * SCALE), Image.NEAREST)
        sheet.alpha_composite(big, (x, height - GAP - big.height))
        x += big.width + GAP
    sheet.convert("RGB").save(out)
    print(out, [f.stem for f in files])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
