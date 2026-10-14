"""Baixa um tileset Wang do PixelLab e salva os dois tiles "puros" (os 4 cantos do mesmo terreno), que
repetem sem emenda e viram o padrão de chão dos protótipos. Guarda a folha inteira em _tileset_<nome>.png.
Uso: python tiles_puros.py <pasta_jogo> <tileset_id> <nome_inferior> <nome_superior>"""
import json, sys, pathlib, urllib.request
from PIL import Image
folder, tid, lower, upper = sys.argv[1:5]
folder = pathlib.Path(folder); (folder / 'tiles').mkdir(parents=True, exist_ok=True)
def get(path):
    req = urllib.request.Request(f'https://api.pixellab.ai/mcp/tilesets/{tid}/{path}', headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req).read()
sheet_path = folder / 'tiles' / f'_tileset_{lower}_{upper}.png'
sheet_path.write_bytes(get('image?inline=true'))
meta = json.loads(get('metadata'))
sheet = Image.open(sheet_path).convert('RGBA')
tiles = meta.get('tiles') or meta.get('tileset_data', {}).get('tiles') or meta
for t in tiles:
    c = t['corners']; vals = set(c.values()) if isinstance(c, dict) else set(c)
    if len(vals) == 1:
        b = t['bounding_box']; name = lower if 'lower' in vals else upper
        sheet.crop((b['x'], b['y'], b['x'] + b['width'], b['y'] + b['height'])).save(folder / 'tiles' / f'{name}.png')
        print('ok', name, b)
man = folder / 'pixellab-assets.json'
data = json.loads(man.read_text('utf-8')) if man.exists() else {}
data[f'tiles/{lower}+{upper}'] = {'tileset_id': tid, 'tipo': 'topdown_tileset'}
man.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', 'utf-8')
