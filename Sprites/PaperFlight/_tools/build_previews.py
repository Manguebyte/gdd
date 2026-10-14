"""Exporta os tiles de chão e monta uma cena de prova por mapa do Paper Flight.

POR QUE: o jogo só usa um chão plano (PaperFlight.md, Fase 3: GroundFollower),
então de cada tileset lateral do PixelLab bastam dois tiles: a superfície
(grama/areia/calçada/neve por cima) e o preenchimento. A cena de prova junta
todos os assets de um mapa numa tela 180x320 para conferir escala e estilo.

ESTRATÉGIA: os tiles vêm na mesma ordem da folha 4x4 (conferido pelos cantos
transparentes); `corners` diz onde há terreno ("lower"). Superfície = cantos
de baixo com terreno e os de cima vazios; preenchimento = os quatro com terreno.

Também gera `icons/upgrade_launch.png` a partir da versão com fundo magenta.

Uso (na pasta Sprites/PaperFlight):
    python _tools/build_previews.py
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
MAPS = {
    # nome: (cor do céu no topo, cor do céu no horizonte, obstáculo de chão, obstáculo de ar)
    "1_quintal": ((118, 196, 240), (214, 238, 250), "ground_birdhouse", "air_sparrow"),
    "2_parque": ((110, 190, 238), (206, 236, 246), "ground_tree", "air_kite"),
    "3_praia": ((90, 186, 240), (200, 240, 250), "ground_palm", "air_seagull"),
    "4_cidade": ((130, 184, 226), (222, 230, 240), "ground_lamppost", "air_drone"),
    "5_montanha": ((120, 170, 225), (226, 236, 248), "ground_pine", "air_eagle"),
}
SURFACE = {"NW": "upper", "NE": "upper", "SW": "lower", "SE": "lower"}
FILL = {"NW": "lower", "NE": "lower", "SW": "lower", "SE": "lower"}
GROUND_TOP = 288  # linha do topo do chão na cena de 320 px


def tile(name, corners):
    """Recorta da folha 4x4 o tile com estes cantos."""
    data = json.loads((ROOT / "ground" / f"{name}.json").read_text(encoding="utf-8"))["tileset_data"]
    sheet = Image.open(ROOT / "ground" / f"{name}.png").convert("RGBA")
    for i, t in enumerate(data["tiles"]):
        if t["corners"] == corners:
            return sheet.crop(((i % 4) * 16, (i // 4) * 16, (i % 4) * 16 + 16, (i // 4) * 16 + 16))
    raise ValueError(f"{name}: tile {corners} não encontrado")


def tiled(scene, layer, y_bottom, x_offset):
    """Repete uma camada na horizontal com a base em y_bottom."""
    y = y_bottom - layer.height + 1
    x = -x_offset
    while x < scene.width:
        scene.alpha_composite(layer.crop((max(0, -x), 0, layer.width, layer.height)), (max(0, x), y))
        x += layer.width


def scene_for(name, sky_top, sky_bottom, ground_obstacle, air_obstacle, index):
    s = Image.new("RGBA", (180, 320))
    d = ImageDraw.Draw(s)
    for y in range(320):
        t = y / 319
        d.line([(0, y), (179, y)], fill=tuple(int(sky_top[i] + (sky_bottom[i] - sky_top[i]) * t) for i in range(3)) + (255,))
    tiled(s, Image.open(ROOT / "backgrounds" / f"{name}_far.png").convert("RGBA"), GROUND_TOP - 50, 30)
    tiled(s, Image.open(ROOT / "backgrounds" / f"{name}_near.png").convert("RGBA"), GROUND_TOP - 1, 70)
    surface, fill = tile(name, SURFACE), tile(name, FILL)
    # A metade de cima do tile de superfície é transparente: alinha a
    # primeira linha opaca com o topo do chão.
    lift = surface.getbbox()[1]
    for x in range(0, 180, 16):
        s.alpha_composite(surface, (x, GROUND_TOP - lift))
        for y in range(GROUND_TOP - lift + 16, 320, 16):
            s.alpha_composite(fill, (x, y))
    obstacles = ROOT / "obstacles"
    g = Image.open(obstacles / f"{name}_{ground_obstacle}.png").convert("RGBA")
    s.alpha_composite(g, (128, GROUND_TOP - g.getbbox()[3] + 2))
    s.alpha_composite(Image.open(obstacles / f"{name}_{air_obstacle}.png").convert("RGBA"), (130, 70))
    s.alpha_composite(Image.open(ROOT / "common" / "air_current.png").convert("RGBA"), (14, 150))
    coin = Image.open(ROOT / "common" / "coin.png").convert("RGBA")
    for x, y in ((84, 132), (102, 124), (120, 118)):
        s.alpha_composite(coin, (x, y))
    flag = Image.open(ROOT / "common" / "goal_flag.png").convert("RGBA")
    s.alpha_composite(flag, (100, GROUND_TOP - flag.getbbox()[3] + 1))
    plane = Image.open(ROOT / "planes" / f"plane_{index}_{name.split('_', 1)[1]}.png").convert("RGBA")
    s.alpha_composite(plane.rotate(6, resample=Image.NEAREST), (44, 128))
    return s, surface, fill


def remove_magenta(src, dest):
    """Tira o fundo magenta de um sprite gerado com fundo (quando a remoção de
    fundo do PixelLab apagou o desenho): flood fill a partir dos cantos e
    limpeza dos pixels magenta que sobram na borda."""
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    bg = im.getpixel((0, 0))
    seen, stack = set(), [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        seen.add((x, y))
        if sum(abs(im.getpixel((x, y))[i] - bg[i]) for i in range(3)) < 60:
            im.putpixel((x, y), (0, 0, 0, 0))
            stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = im.getpixel((x, y))
            if a and r > 150 and b > 90 and g < 120 and r - g > 80 and b - g > 40:
                im.putpixel((x, y), (0, 0, 0, 0))
    im.save(dest)


def main():
    remove_magenta(ROOT / "icons" / "_upgrade_launch_bg.png", ROOT / "icons" / "upgrade_launch.png")
    shots = []
    for index, (name, (top, bottom, g, a)) in enumerate(MAPS.items(), start=1):
        scene, surface, fill = scene_for(name, top, bottom, g, a, index)
        surface.save(ROOT / "ground" / f"{name}_surface.png")
        fill.save(ROOT / "ground" / f"{name}_fill.png")
        shots.append(scene)
    sheet = Image.new("RGBA", (len(shots) * 184, 320), (40, 40, 40, 255))
    for i, shot in enumerate(shots):
        sheet.paste(shot, (i * 184, 0))
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(ROOT / "_preview" / "maps_all.png")
    print("ok _preview/maps_all.png")


if __name__ == "__main__":
    main()
