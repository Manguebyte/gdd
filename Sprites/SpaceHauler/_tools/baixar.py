"""Baixa sprites gerados no PixelLab, registra no pixellab-assets.json e gera o anchors.js.

POR QUE: o protótipo carrega os PNGs direto de Sprites/SpaceHauler/ e precisa
saber o ponto de apoio no plano (âncora) de cada um. A âncora vem da
referência exportada (_refs/refs.json), porque cada sprite é um redesenho
dela no mesmo tamanho.
ESTRATÉGIA:
  - <nome>=<job_id>       imagem de edit_image_pro_flash  -> <nome>.png
  - <nome>=obj8:<obj_id>  objeto de 8 direções            -> <nome>/<direção>.png
Depois de baixar, reescreve anchors.js com todos os PNGs que existem.

Uso: python baixar.py ship=<job> enemies/fighter=<job> turrets/cannon=obj8:<id> ...
     python baixar.py            (só regera o anchors.js)
"""
import io, json, pathlib, sys, urllib.request, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'pixellab-assets.json'
REFS = json.loads((ROOT / '_refs' / 'refs.json').read_text(encoding='utf-8'))
DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']
data = json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {}


def get(url):
    with urllib.request.urlopen(url) as r:
        return r.read()


for arg in sys.argv[1:]:
    name, src = arg.split('=', 1)
    if src.startswith('obj8:'):
        obj = src[5:]
        z = zipfile.ZipFile(io.BytesIO(get(f'https://api.pixellab.ai/mcp/objects/{obj}/download')))
        folder = ROOT / name
        folder.mkdir(parents=True, exist_ok=True)
        for member in z.namelist():
            stem = pathlib.PurePosixPath(member).stem
            if member.endswith('.png') and stem in DIRS:
                (folder / f'{stem}.png').write_bytes(z.read(member))
        data[name] = {'object_id': obj, 'tool': 'create_object_pro_flash (8 direções)'}
    else:
        dest = ROOT / f'{name}.png'
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(get(f'https://api.pixellab.ai/mcp/images/{src}/download'))
        data[name] = {'job_id': src, 'tool': 'edit_image_pro_flash', 'ref': f'_refs/{name.split("/")[-1]}.png'}
    print('ok', name)
MANIFEST.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')

# --- anchors.js -------------------------------------------------------------
from PIL import Image  # noqa: E402

FOLDER = {'ship': ''}
for n in ['fighter', 'drone', 'boarder', 'cruiser-bow', 'cruiser-hull', 'pirate']:
    FOLDER[n] = 'enemies/'
for n in ['asteroid-1', 'asteroid-2', 'asteroid-3']:
    FOLDER[n] = 'asteroids/'

sprites = {}
for ref, a in REFS.items():
    if ref.startswith('turret-'):
        tid = ref[len('turret-'):]
        for d in DIRS:
            png = ROOT / 'turrets' / tid / f'{d}.png'
            if not png.exists():
                continue
            w, h = Image.open(png).size
            # As 8 direções vêm num quadro quadrado, com o objeto centralizado.
            sprites[f'turret-{tid}-{d}'] = {'path': f'turrets/{tid}/{d}', 'ax': a['ax'] + (w - a['w']) // 2, 'ay': a['ay'] + (h - a['h']) // 2}
        continue
    path = FOLDER.get(ref, '') + ref
    if (ROOT / f'{path}.png').exists():
        sprites[ref] = {'path': path, 'ax': a['ax'], 'ay': a['ay']}

js = ('// Gerado por _tools/baixar.py: sprites PixelLab do Space Hauler e o ponto de apoio\n'
      '// no plano (âncora, em px do PNG) de cada um. Não edite à mão.\n'
      'window.SH_SPRITES = ' + json.dumps(sprites, indent=2, ensure_ascii=False) + ';\n')
(ROOT / 'anchors.js').write_text(js, encoding='utf-8')
print(len(sprites), 'sprites no anchors.js')
