"""Baixa do PixelLab os sprites do Paper Flight.

POR QUE: cada imagem gerada no PixelLab fica num job; o jogo precisa de PNGs
com nomes previsíveis em pastas fixas para importar no Unity.

ESTRATÉGIA: `pixellab-assets.json` mapeia o caminho final de cada PNG para o
job_id (download) e o source_image_id (reuso como referência de estilo), e
cada tileset de chão para o tileset_id.
O script baixa só o que falta (use --force para baixar tudo de novo).

Uso (na pasta Sprites/PaperFlight):
    python _tools/fetch_pixellab.py [--force]
"""
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = "https://api.pixellab.ai/mcp/images/{job}/download"
TILESET_URL = "https://api.pixellab.ai/mcp/sidescroller-tilesets/{id}/{kind}"


def fetch(url):
    """Baixa uma URL. O CDN dos tilesets (backblaze) recusa (403) o
    User-Agent padrão do Python, então mandamos um de navegador."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as r:
        return r.read()


def main():
    force = "--force" in sys.argv
    manifest = json.loads((ROOT / "pixellab-assets.json").read_text(encoding="utf-8"))
    for rel, info in manifest["images"].items():
        dest = ROOT / rel
        if dest.exists() and not force:
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(fetch(URL.format(job=info["job_id"])))
        print("ok", rel)
    # Tilesets laterais do chão: a sheet PNG (16 tiles de 16 px) e o JSON
    # com os encaixes de cada tile.
    for rel, info in manifest.get("tilesets", {}).items():
        for kind, ext in (("image", ".png"), ("metadata", ".json")):
            dest = ROOT / (rel + ext)
            if dest.exists() and not force:
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(fetch(TILESET_URL.format(id=info["tileset_id"], kind=kind)))
            print("ok", rel + ext)


if __name__ == "__main__":
    main()
