"""Baixa sprites do PixelLab para Sprites/<Jogo>/ e atualiza o manifesto pixellab-assets.json da pasta.

Uso:
  python baixar.py <pasta_destino> obj8 <object_id> <nome>     -> <pasta>/<nome>/<direcao>.png (8 rotações)
  python baixar.py <pasta_destino> obj1 <object_id> <nome>     -> <pasta>/<nome>.png (1 direção, arquivo "unknown" do PixelLab)
"""
import json, sys, time, urllib.request, urllib.error, pathlib

USER = 'b6fbbf99-a093-4f32-b1d5-41913afcc286'
BASE = f'https://backblaze.pixellab.ai/file/pixellab-characters/objects/{USER}'
DIRS = ['east', 'west', 'north', 'south', 'north-east', 'north-west', 'south-east', 'south-west']

def get(url, dest, tries=5):
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    for i in range(tries):
        try:
            with urllib.request.urlopen(req) as r:
                dest.write_bytes(r.read())
            return
        except urllib.error.HTTPError as e:
            if e.code < 500 or i == tries - 1:
                raise
            time.sleep(3 * (i + 1))

def main():
    folder, kind, oid, name = sys.argv[1:5]
    folder = pathlib.Path(folder)
    if kind == 'obj8':
        for d in DIRS:
            get(f'{BASE}/{oid}/rotations/{d}.png', folder / name / f'{d}.png')
    else:
        get(f'{BASE}/{oid}/rotations/unknown.png', folder / f'{name}.png')
    man = folder / 'pixellab-assets.json'
    data = json.loads(man.read_text('utf-8')) if man.exists() else {}
    data[name] = {'object_id': oid, 'tipo': kind}
    man.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', 'utf-8')
    print('ok', name)

main()
