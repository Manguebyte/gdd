"""Baixa do PixelLab os sprites do Craft Dice.

POR QUE: o PixelLab guarda cada personagem como um zip (rotações + quadros
das animações), cada tileset como uma imagem + metadados de cantos e cada
prop como uma imagem solta. O jogo precisa de arquivos com nomes
previsíveis, numa pasta só, para importar no Unity.

ESTRATÉGIA:
- Personagens (4 direções): para cada um, baixa o zip de `download`, grava a
  pose de cada direção em `chars/` e monta uma sheet por animação em `anims/`,
  com uma LINHA por direção (south, east, north, west) e uma coluna por
  quadro. Todas as sheets de um personagem ficam com o mesmo quadro quadrado
  e os pés na última linha (ver `normalize`).
- Tilesets (Wang 4x4, autotile por cantos): grava a sheet PNG e o JSON de
  metadados (cantos de cada tile) em `tiles/`.
- Props (objetos de 1 direção): uma imagem cada, em `props/`.
- Dados (ver `build_dice`): um corpo de dado vermelho e 9 ícones de face
  viram corpos nas 3 cores, as 10 faces prontas e a animação de girar de cada
  tipo, em `dice/` e `anims/`.
No fim, grava `pixellab-assets.json` com os ids do PixelLab e os arquivos.

Uso (na pasta Sprites/CraftDice):
    python _tools/fetch_pixellab.py
"""
import colorsys
import io
import json
import re
import time
import urllib.request
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DIRECTIONS = ["south", "east", "north", "west"]

# id do jogo -> character_id PixelLab. Estilo v2 (2026-10-05), copiado do
# exemplo em `example/`: chibi minúsculo (uns 20 px de altura num quadro de
# 32), cabeça redonda, pouco detalhe, contorno escuro. Gerados no PixelLab Pro
# Flash a partir de uma imagem aprovada; o PixelLab cria 8 direções, mas o
# jogo só usa 4.
CHARACTERS = {
    "player": "7f1fbf6a-de0c-460d-a73b-61866765d55d",
    "skeleton": "7d5749ee-cc21-4ac4-8afe-9f92b741900c",
    "shadow-hound": "c783525c-f02c-4199-a59b-c42e4a23d0f2",
    "fallen-knight": "f33c5c28-0729-498e-a9f4-4e06c7f67250",
}

# id do jogo -> tileset_id PixelLab (Wang 4x4, tiles de 32 px): a "ilha" de
# chão carmesim sobre o fundo roxo-vazio, como no exemplo.
TILESETS = {
    "area1-void-ground": "0e268927-6164-4a44-959f-ba0e1ee49349",
}

# id do jogo -> object_id PixelLab (prop de 1 direção). Tela de 64 px, menos
# stump, tombstone e crystal (32 px), que são pequenos no exemplo.
PROPS = {
    "bonfire": "a3a59885-1b58-462d-8f80-fb3d9ac2a895",
    "bonfire-unlit": "4d5f0f1a-93f5-4de8-a9ff-c37a5e40afc8",
    "anvil": "66ce1831-05b2-4ee1-9ddd-901d64040a52",
    "rune-stone": "e9bbbda3-4783-45eb-b361-9354493293f1",
    "pillar": "d40da670-7ceb-4baf-8491-7831dd2636d9",
    "broken-pillar": "c3a0bb31-83da-4c39-9e93-928cdfa49096",
    "cyan-tree": "2242b324-c523-44bf-84fa-a0b14049888c",
    "dead-tree": "3bb4f037-434f-402f-9c09-a13ce682853f",
    "stump": "68d105bf-6311-40cf-a0f5-5c282f6e540e",
    "boulders": "e7d07cc5-c2de-4625-a5b6-3a9a11f42103",
    "chest": "38008f0c-a186-4ec5-bcef-b9b32a5c40ee",
    "tombstone": "2d6f4728-b516-45c6-a97b-a288a390ea9a",
    "boss-gate": "5f3dbb97-5330-4f69-a006-e9f6a913df45",
    "crystal": "811758c2-3ca7-4629-91f2-d4ae24730122",
    "skull-pile": "188ddd91-1742-4a43-b729-e03ad78ce213",
}

# Animações de props: id do jogo -> (object_id, animation_id, quadros). Viram
# uma sheet horizontal em `anims/<id>_<nome>.png`.
PROP_ANIMS = {
    "bonfire_burn": ("a3a59885-1b58-462d-8f80-fb3d9ac2a895", "1ceca209-b5d7-4cbc-a099-483e331d05d1", 8),
}

# Dados. Imagens Pro Flash (job id do PixelLab): o corpo do dado vermelho e um
# ícone por face. O corpo é gerado uma vez só e recolorido para os outros
# tipos, para os três dados terem exatamente o mesmo formato.
DIE_BODY = "9fbf12c4-8345-443b-999e-3307cb0e4b8a"
DIE_ICONS = {
    "attack1": "22578608-0019-4f78-a469-9f0d79f91076",
    "attack2": "970675bf-e1a5-4124-a763-016f71a85b6e",
    "critical": "2ed213e0-7669-482c-baa7-afe51ad1da7f",
    "miss": "19d7f7bb-1b87-478b-9cc5-a52df98f50fa",
    "parry": "d8c01f29-a23b-4c24-bddf-e2edeaf6d069",
    "dodge": "de450d4e-751d-4578-8319-498afb25c42e",
    "spell0": "ea14395b-01e3-42e6-945a-9a3c880891dd",
    "spell1": "7e4283ab-ce0c-4a24-8556-257665bdc2a7",
    "spell2": "25b11acc-c7a4-485f-a1d0-876c45a836fe",
}
# Animação de girar, montada aqui com os próprios corpos e ícones (o PixelLab
# desenhava um dado comum, com pontos, e não o dado do jogo). Um quadro por
# passo: giro de 90° (só giros de 90° mantêm o pixel art nítido) e a altura do
# pulinho, em px.
ROLL_HOP = [0, 3, 5, 6, 6, 5, 3, 1]
ROLL_TURNS = [None, Image.Transpose.ROTATE_90, Image.Transpose.ROTATE_180, Image.Transpose.ROTATE_270]

# Tipo de dado -> (cor, faces), seguindo o GDD §3.1. A cor é a do pedido do
# design: Ataque vermelho, Defesa cinza, Feitiço azul.
DIE_TYPES = {
    "attack": ("red", ["attack1", "attack2", "critical", "miss"]),
    "defense": ("grey", ["parry", "dodge", "miss"]),
    "spell": ("blue", ["spell0", "spell1", "spell2"]),
}

# Centro da face da frente no corpo de 48 px (a faixa de lado e de topo do
# cubo fica à direita e em cima, então o centro não é o centro da tela).
DIE_FACE_CENTER = (22, 24)

IMAGE_DOWNLOAD = "https://api.pixellab.ai/mcp/images/{id}/download"
DOWNLOAD = "https://api.pixellab.ai/mcp/characters/{id}/download"
TILESET_IMAGE = "https://api.pixellab.ai/mcp/tilesets/{id}/image?inline=true"
TILESET_META = "https://api.pixellab.ai/mcp/tilesets/{id}/metadata"
OBJECTS_URL = ("https://backblaze.pixellab.ai/file/pixellab-characters/objects/"
               "b6fbbf99-a093-4f32-b1d5-41913afcc286/{id}/")
OBJECT_IMAGE = OBJECTS_URL + "rotations/unknown.png"
OBJECT_FRAME = OBJECTS_URL + "animations/{anim}/unknown/{i}.png"


def fetch(url: str) -> bytes:
    """Baixa uma URL. O PixelLab exige User-Agent e às vezes devolve 5xx
    passageiro, então tenta de novo algumas vezes antes de desistir."""
    request = urllib.request.Request(url, headers={"User-Agent": "craftdice-fetch/1.0"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read()
        except Exception:
            if attempt == 4:
                raise
            time.sleep(2 * (attempt + 1))


def main() -> None:
    for folder in ("chars", "anims", "tiles", "props"):
        (ROOT / folder).mkdir(exist_ok=True)
    manifest = {"characters": {}, "tilesets": {}, "props": {}}

    for game_id, character_id in CHARACTERS.items():
        archive = zipfile.ZipFile(io.BytesIO(fetch(DOWNLOAD.format(id=character_id))))
        names = archive.namelist()
        entry = {"character_id": character_id, "poses": {}, "anims": {}}

        for direction in DIRECTIONS:
            pose = next(n for n in names if re.search(rf"rotations/{direction}\.png$", n))
            out = f"chars/{game_id}_{direction}.png"
            (ROOT / out).write_bytes(archive.read(pose))
            entry["poses"][direction] = out

        # Animações: .../animations/<pasta da animação>/<direção>/frame_000.png
        groups = {}
        for name in names:
            match = re.search(r"animations/([^/]+)/([a-z-]+)/[^/]*?(\d+)\.png$", name)
            if match and match.group(2) in DIRECTIONS:
                anim = groups.setdefault(label_of(match.group(1)), {})
                anim.setdefault(match.group(2), []).append((int(match.group(3)), name))
        for label, by_direction in groups.items():
            rows = []
            for direction in DIRECTIONS:
                frames = sorted(by_direction.get(direction, []))
                rows.append([Image.open(io.BytesIO(archive.read(n))).convert("RGBA") for _, n in frames])
            missing = [d for d, row in zip(DIRECTIONS, rows) if not row]
            if missing:
                print(f"  AVISO {game_id}/{label}: faltam as direções {missing}")
            out = f"anims/{game_id}_{label}.png"
            entry["anims"][label] = {"file": out, "rows": DIRECTIONS, "frames": max(len(r) for r in rows)}
            entry["anims"][label]["_rows"] = rows
        normalize(entry)
        manifest["characters"][game_id] = entry
        print(game_id, sorted(entry["anims"]), entry["frame_size"])

    for game_id, tileset_id in TILESETS.items():
        (ROOT / f"tiles/{game_id}.png").write_bytes(fetch(TILESET_IMAGE.format(id=tileset_id)))
        (ROOT / f"tiles/{game_id}.json").write_bytes(fetch(TILESET_META.format(id=tileset_id)))
        manifest["tilesets"][game_id] = {
            "tileset_id": tileset_id,
            "sheet": f"tiles/{game_id}.png",
            "metadata": f"tiles/{game_id}.json",
        }
        print(game_id, "(tileset)")

    for game_id, object_id in PROPS.items():
        out = f"props/{game_id}.png"
        (ROOT / out).write_bytes(fetch(OBJECT_IMAGE.format(id=object_id)))
        manifest["props"][game_id] = {"object_id": object_id, "file": out}
    print(len(PROPS), "props")

    for name, (object_id, anim_id, count) in PROP_ANIMS.items():
        frames = [Image.open(io.BytesIO(fetch(OBJECT_FRAME.format(id=object_id, anim=anim_id, i=i)))).convert("RGBA")
                  for i in range(count)]
        w, h = frames[0].size
        sheet = Image.new("RGBA", (w * count, h))
        for i, frame in enumerate(frames):
            sheet.paste(frame, (i * w, 0))
        out = f"anims/{name}.png"
        sheet.save(ROOT / out)
        manifest["props"].setdefault(name.split("_")[0], {})["anims"] = {
            name.split("_", 1)[1]: {"file": out, "frames": count, "frame_size": [w, h]}
        }
        print(name, "(animação de prop)")

    manifest["dice"] = build_dice()

    (ROOT / "pixellab-assets.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def normalize(entry: dict) -> None:
    """Monta as sheets com o mesmo quadro quadrado em todas as animações.

    POR QUE: o PixelLab pode gerar animações com telas de tamanhos diferentes
    da pose. O Unity fatia a sheet por tamanho de quadro e escala pelo PPU; com
    quadros diferentes o personagem mudaria de tamanho ou "pularia" ao trocar
    de animação.
    ESTRATÉGIA: o quadro final é o maior lado entre todas as animações. Cada
    quadro é centralizado na horizontal e descido até os pés (a linha mais
    baixa com pixel opaco da animação inteira) encostarem na última linha.
    Assim o pivot é "Bottom" em todas as sheets.
    """
    anims = entry["anims"].values()
    size = max(max(f.size) for a in anims for row in a["_rows"] for f in row)
    for anim in anims:
        rows = anim.pop("_rows")
        frames = [f for row in rows for f in row]
        boxes = [f.getchannel("A").getbbox() for f in frames]
        feet = max(b[3] for b in boxes if b)
        sheet = Image.new("RGBA", (size * anim["frames"], size * len(rows)))
        for y, row in enumerate(rows):
            for x, frame in enumerate(row):
                sheet.alpha_composite(frame, (x * size + (size - frame.width) // 2, y * size + size - feet))
        sheet.save(ROOT / anim["file"])
        anim["frame_size"] = [size, size]
    entry["frame_size"] = size


def label_of(folder: str) -> str:
    """Traduz a pasta da animação no zip para walk/idle.

    Usa o nome da pasta: os templates "walking"/"walk" viram walk e
    "breathing"/"idle" viram idle. Qualquer outro nome passa como está.
    """
    lowered = folder.lower()
    if "walk" in lowered or "running" in lowered:
        return "walk"
    if "breath" in lowered or "idle" in lowered:
        return "idle"
    return lowered


def build_dice() -> dict:
    """Monta os sprites dos dados a partir do corpo vermelho e dos ícones.

    POR QUE: na forja o jogador escolhe as faces de cada dado (GDD §3.3), então
    o Unity precisa do corpo e do ícone separados (`dice/bodies`, `dice/icons`)
    para montar qualquer combinação. As faces prontas (`dice/faces`) cobrem os
    dados padrão e servem de prévia.
    ESTRATÉGIA: o corpo é gerado só em vermelho e recolorido por matiz
    (`recolor`), para os três tipos terem o mesmo formato. Cada ícone é
    centralizado na face da frente (`DIE_FACE_CENTER`) pelo centro do seu
    retângulo visível. A animação de girar (`build_roll`) usa essas faces.
    """
    for folder in ("dice/bodies", "dice/icons", "dice/faces"):
        (ROOT / folder).mkdir(parents=True, exist_ok=True)
    body = Image.open(io.BytesIO(fetch(IMAGE_DOWNLOAD.format(id=DIE_BODY)))).convert("RGBA")
    icons = {}
    for name, job_id in DIE_ICONS.items():
        icons[name] = Image.open(io.BytesIO(fetch(IMAGE_DOWNLOAD.format(id=job_id)))).convert("RGBA")
        icons[name].save(ROOT / f"dice/icons/{name}.png")

    entry = {"body_job": DIE_BODY, "types": {}}
    for die_type, (color, faces) in DIE_TYPES.items():
        tinted = recolor(body, color)
        tinted.save(ROOT / f"dice/bodies/{die_type}.png")
        face_files = {}
        for face in faces:
            out = compose_face(tinted, icons[face])
            path = f"dice/faces/{die_type}_{face}.png"
            out.save(ROOT / path)
            face_files[face] = path
        sheet = build_roll(tinted, [icons[face] for face in faces])
        roll_path = f"anims/die-{die_type}_roll.png"
        sheet.save(ROOT / roll_path)
        size = tinted.height
        entry["types"][die_type] = {
            "color": color,
            "body": f"dice/bodies/{die_type}.png",
            "faces": face_files,
            "roll": {"file": roll_path, "frames": len(ROLL_HOP), "frame_size": [size, size]},
        }
    print("dados:", {t: len(e["faces"]) for t, e in entry["types"].items()}, "faces + animação de girar")
    return entry


def build_roll(body: Image.Image, face_icons: list) -> Image.Image:
    """Monta a sheet do dado girando com os ícones das faces do próprio tipo.

    POR QUE: o dado rolando tem que mostrar as faces que ele tem de verdade
    (espadas no de Ataque, escudo no de Defesa, orbes no de Feitiço), não os
    pontos de um dado comum.
    ESTRATÉGIA: o quadro i mostra a face `face_icons[i % n]`, girada
    `ROLL_TURNS[i % 4]` e erguida `ROLL_HOP[i]` px. Como são 8 quadros, o giro
    dá duas voltas completas e o último quadro volta quase ao chão; no fim da
    rolagem o jogo troca pela face sorteada, de frente. Para um dado forjado
    com outras faces, o Unity pode fazer o mesmo em tempo de execução: girar o
    dado 90° por quadro e trocar o sprite do ícone.
    """
    size = body.width
    sheet = Image.new("RGBA", (size * len(ROLL_HOP), size))
    for i, hop in enumerate(ROLL_HOP):
        frame = compose_face(body, face_icons[i % len(face_icons)])
        turn = ROLL_TURNS[i % len(ROLL_TURNS)]
        if turn:
            frame = frame.transpose(turn)
        sheet.alpha_composite(frame.crop((0, hop, size, size)), (i * size, 0))
    return sheet


def recolor(image: Image.Image, color: str) -> Image.Image:
    """Troca o vermelho do dado pela cor do tipo, pixel a pixel.

    Só mexe em pixels avermelhados e saturados; contorno escuro e os pontos
    brancos da animação ficam como estão. "grey" tira a saturação, "blue"
    gira a matiz para azul. "red" devolve uma cópia.
    """
    out = image.copy()
    if color == "red":
        return out
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.3 or v < 0.15 or not (h < 0.06 or h > 0.9):
                continue
            if color == "grey":
                s, v = 0.06, v * 0.62 + 0.08
            else:
                h = 0.6
            r, g, b = (round(c * 255) for c in colorsys.hsv_to_rgb(h, s, v))
            px[x, y] = (r, g, b, a)
    return out


def compose_face(body: Image.Image, icon: Image.Image) -> Image.Image:
    """Cola o ícone no centro da face da frente do corpo."""
    left, top, right, bottom = icon.getbbox()
    x = DIE_FACE_CENTER[0] - (left + right) // 2
    y = DIE_FACE_CENTER[1] - (top + bottom) // 2
    out = body.copy()
    out.alpha_composite(icon, (x, y))
    return out


if __name__ == "__main__":
    main()
