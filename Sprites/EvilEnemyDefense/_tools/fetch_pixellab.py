"""Baixa do PixelLab as poses e animações do Evil Enemy Defense.

POR QUE: o PixelLab guarda cada personagem como um zip (rotações + quadros
das animações). O jogo precisa de um PNG de pose por id e de uma sheet
horizontal por animação, com nomes previsíveis.

ESTRATÉGIA: para cada personagem, baixa o zip de `download`, pega a rotação
east e, para cada animação na direção east, cola os quadros lado a lado
numa sheet. O nome da animação vem do `animation_name` dado na geração
(walk, attack, idle). Construções (objetos 1 direção) vêm de uma URL de
imagem única. No fim, grava `pixellab-assets.json`.

Uso (na pasta Sprites/EvilEnemyDefense):
    python _tools/fetch_pixellab.py
"""
import io
import json
import re
import urllib.request
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

# id do jogo -> (pasta, character_id PixelLab). Estilo MapleStory (chibi), 2026-10-03.
CHARACTERS = {
    "warrior": ("units", "92e100d5-a863-460f-868c-234d5ba95978"),
    "archer": ("units", "7b7286b5-dfad-4e50-9425-2fef393f23b3"),
    "bomber": ("units", "0f4d305b-ac75-4460-8405-e35b8b0b16d2"),
    "pawn": ("units", "8a9c406b-463f-4b60-ba7b-0a2833d5bff5"),
    "lancer": ("units", "f4b7978d-4180-4945-af9f-76c80cbbeb29"),
    "thief": ("units", "de5e32c4-ab98-4dc4-912c-b766ba6a2220"),
    "goblin": ("garrison", "195c55c6-7fbd-4bbf-9f9b-867126a93a84"),
    "great-orc": ("garrison", "770ebbe1-3ed3-4009-937c-d117ecdb6636"),
    "lizard": ("garrison", "de041e09-1c95-4a18-9e95-961eb1f30406"),
    "bear": ("garrison", "99c6ff33-c7ef-47fc-b694-7c68e0e93a8a"),
    "minotaur": ("garrison", "29497012-06dd-4a27-8a9b-06c98d3aa2dd"),
    "troll": ("garrison", "9e15baab-ad37-4eeb-adb2-0f9106cdaa7c"),
}

# Construções: id do jogo -> object_id PixelLab (objeto de 1 direção, imagem única).
OBJECTS = {
    "wood-tower": "7b491480-81d8-4e2e-a5c7-8291963e4708",
    "tower": "d4388054-64e1-4785-ba66-f6c4ca3afe47",
    "tower-blue": "0412a253-3a53-46f2-a3ae-c49dc85bebb5",
    "tower-purple": "089b60e4-cdbf-4793-88db-142474a079df",
    "castle": "ed087600-f2c5-419d-8cb3-4cd3e0c2594f",
}

DOWNLOAD = "https://api.pixellab.ai/mcp/characters/{id}/download"
OBJECT_IMAGE = ("https://backblaze.pixellab.ai/file/pixellab-characters/objects/"
                "b6fbbf99-a093-4f32-b1d5-41913afcc286/{id}/rotations/unknown.png")


def fetch(url: str) -> bytes:
    """Baixa uma URL (o PixelLab exige um User-Agent)."""
    request = urllib.request.Request(url, headers={"User-Agent": "eed-fetch/1.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def main() -> None:
    (ROOT / "anims").mkdir(exist_ok=True)
    manifest = {"characters": {}, "objects": {}}
    for game_id, (folder, character_id) in CHARACTERS.items():
        (ROOT / folder).mkdir(exist_ok=True)
        archive = zipfile.ZipFile(io.BytesIO(fetch(DOWNLOAD.format(id=character_id))))
        names = archive.namelist()
        meta = json.loads(archive.read("metadata.json")) if "metadata.json" in names else {}

        pose = next(n for n in names if re.search(r"rotations/east\.png$", n))
        (ROOT / folder / f"{game_id}.png").write_bytes(archive.read(pose))
        entry = {"character_id": character_id, "pose": f"{folder}/{game_id}.png", "anims": {}}

        # Animações: .../animations/<pasta da animação>/east/frame_000.png
        groups = {}
        for name in names:
            match = re.search(r"animations/([^/]+)/east/[^/]*?(\d+)\.png$", name)
            if match:
                groups.setdefault(match.group(1), []).append((int(match.group(2)), name))
        labels = label_animations(meta, list(groups))
        for folder_name, frames in groups.items():
            frames.sort()
            images = [Image.open(io.BytesIO(archive.read(n))).convert("RGBA") for _, n in frames]
            w, h = images[0].size
            sheet = Image.new("RGBA", (w * len(images), h))
            for i, image in enumerate(images):
                sheet.paste(image, (i * w, 0))
            label = labels.get(folder_name, folder_name)
            out = f"anims/{game_id}_{label}.png"
            sheet.save(ROOT / out)
            entry["anims"][label] = {"file": out, "frames": len(images), "frame_size": [w, h]}
        normalize(entry)
        manifest["characters"][game_id] = entry
        print(game_id, sorted(entry["anims"]), entry["frame_size"])

    for game_id, object_id in OBJECTS.items():
        out = f"garrison/{game_id}.png"
        (ROOT / out).write_bytes(fetch(OBJECT_IMAGE.format(id=object_id)))
        manifest["objects"][game_id] = {"object_id": object_id, "pose": out}
        print(game_id, "(construção)")

    (ROOT / "pixellab-assets.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def normalize(entry: dict) -> None:
    """Deixa todas as sheets de um personagem com o mesmo quadro quadrado.

    POR QUE: o PixelLab aumenta a tela da animação de ataque para caber a
    arma (88 px contra 64 da caminhada). O Unity escala cada quadro pela
    altura do quadro; com tamanhos diferentes, o personagem encolheria ao
    atacar.
    ESTRATÉGIA: o quadro final é o maior entre as sheets. Cada quadro é
    centralizado na horizontal e descido até os pés (a linha mais baixa com
    pixel opaco da sheet) encostarem na última linha. Assim o pivot é
    simplesmente "Bottom" e a escala é a mesma em todas as animações.
    """
    size = max(max(d["frame_size"]) for d in entry["anims"].values())
    for anim in entry["anims"].values():
        path = ROOT / anim["file"]
        sheet = Image.open(path).convert("RGBA")
        w, h = anim["frame_size"]
        frames = [sheet.crop((i * w, 0, i * w + w, h)) for i in range(anim["frames"])]
        feet = max(f.getchannel("A").getbbox()[3] for f in frames if f.getchannel("A").getbbox())
        out = Image.new("RGBA", (size * len(frames), size))
        for i, frame in enumerate(frames):
            out.alpha_composite(frame, (i * size + (size - w) // 2, size - feet))
        out.save(path)
        anim["frame_size"] = [size, size]
    entry["frame_size"] = size


def label_animations(meta: dict, folders: list) -> dict:
    """Mapeia a pasta de cada animação para walk/attack/idle.

    Usa o display_name gravado no metadata quando existe; senão, deduz pelo
    nome da pasta (template "walking"/"running" = walk, "breathing" = idle,
    o resto = attack).
    """
    labels = {}
    text = json.dumps(meta)
    for folder in folders:
        lowered = folder.lower()
        if lowered in ("walk", "attack", "idle"):
            labels[folder] = lowered
        elif "walk" in lowered or "running" in lowered:
            labels[folder] = "walk"
        elif "breath" in lowered or "idle" in lowered:
            labels[folder] = "idle"
        else:
            labels[folder] = "attack"
    return labels


if __name__ == "__main__":
    main()
