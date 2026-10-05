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

# id do jogo -> (pasta, character_id PixelLab). Estilo Sea of Stars / Stardew Valley, 2026-10-03.
CHARACTERS = {
    "warrior": ("units", "f0eff875-bfd9-4615-aa1a-075c1aca7a1d"),
    "archer": ("units", "225c7dc4-3db4-42e0-9289-3a8cc42341c3"),
    "bomber": ("units", "a0476b73-c52b-478a-80c0-c909614683ca"),
    "pawn": ("units", "51958fad-085f-4b47-b57d-b5cab48e9382"),
    "lancer": ("units", "a6c34bdb-ac9e-48af-9211-17d22f9a92bd"),
    "thief": ("units", "6fb97aa5-493d-42e9-974d-1f0b5deeda73"),
    "goblin": ("garrison", "9f39185e-3e31-4627-b1cc-05cffb0acf49"),
    "great-orc": ("garrison", "fdaf6f1b-2c4d-4be6-85f3-1bbbf1478d76"),
    "lizard": ("garrison", "a4066995-6277-430b-b31d-1937b8e60f80"),
    "bear": ("garrison", "d3926c94-5f4d-4142-91f9-224ed2e26d89"),
    "minotaur": ("garrison", "c9ed0b33-5e2a-495c-acc1-11bdaff2084c"),
    "troll": ("garrison", "039f7f06-bf8c-46cf-aabf-29bead9db38b"),
}

# Construções: id do jogo -> object_id PixelLab (objeto de 1 direção, imagem única).
OBJECTS = {
    "wood-tower": "f7f5b73e-a29a-4179-824f-4de76e20d424",
    "tower": "953843b8-4eff-43d1-adb4-5110c8e6e821",
    "tower-blue": "e894ec26-1aef-42d6-9f1d-a06d08cbe500",
    "tower-purple": "1f5171d1-be90-42fe-b8b9-f56a09731028",
    "castle": "c2de499a-0fe4-4c11-900d-cf07c6305f1c",
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
