"""Baixa a arte PixelLab do Iso Cards e gera prototipos/iso-cards/sprites.js.

Uso (na raiz do repositório):  python Sprites/IsoCards/_tools/baixar.py [chave ...]
Sem argumentos baixa tudo do pixellab-assets.json; com chaves, só esses personagens.

Personagens: só as diagonais sudeste (frente) e nordeste (costas); o jogo espelha
as outras duas, como no FFT. Animações de nome "parado" e "ataque" viram tiras
horizontais (quadros lado a lado). sprites.js guarda a caixa visível de cada PNG,
porque o protótipo roda em file:// e não pode ler pixels do canvas.
"""
import io
import json
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / 'Sprites' / 'IsoCards'
OUT_JS = ROOT / 'prototipos' / 'iso-cards' / 'sprites.js'
DIRS = {'south-east': 'se', 'north-east': 'ne'}
ANIMS = {'parado', 'ataque'}


def get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (iso-cards baixar.py)'})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception as e:  # o PixelLab devolve 5xx às vezes
            if i == tries - 1:
                raise
            print('  tentando de novo:', e)
            time.sleep(2 + i * 2)


def save_char(key, cid):
    z = zipfile.ZipFile(io.BytesIO(get(f'https://api.pixellab.ai/mcp/characters/{cid}/download')))
    meta = json.loads(z.read('metadata.json'))
    d = ART / 'personagens' / key
    d.mkdir(parents=True, exist_ok=True)
    state = meta['states'][0]
    frames = state['frames']
    for long, short in DIRS.items():
        z_path = frames['rotations'][long]
        Image.open(io.BytesIO(z.read(z_path))).save(d / f'{short}.png')
    for name, anim in (frames.get('animations') or {}).items():
        base = name.split('-')[0].lower()
        if base not in ANIMS:
            continue
        for long, short in DIRS.items():
            paths = anim.get(long)
            if not paths:
                print(f'  {key}: falta a direção {long} em {name}')
                continue
            imgs = [Image.open(io.BytesIO(z.read(p))).convert('RGBA') for p in paths]
            w, h = imgs[0].size
            strip = Image.new('RGBA', (w * len(imgs), h))
            for i, im in enumerate(imgs):
                strip.paste(im, (i * w, 0))
            strip.save(d / f'{base}-{short}.png')
    print('ok', key)


def save_tiles(key, tid):
    d = ART / 'tiles' / key
    d.mkdir(parents=True, exist_ok=True)
    for i in range(16):
        data = get(f'https://backblaze.pixellab.ai/file/pixellab-tiles/b6fbbf99-a093-4f32-b1d5-41913afcc286/{tid}/tile_{i}.png')
        (d / f'tile_{i}.png').write_bytes(data)
    print('ok tiles', key)


def save_props(key, props):
    d = ART / 'cenario' / key
    d.mkdir(parents=True, exist_ok=True)
    for name, job in props.items():
        (d / f'{name}.png').write_bytes(get(f'https://api.pixellab.ai/mcp/images/{job}/download'))
    print('ok cenario', key)


def write_meta():
    """Caixa visível [x0, y0, x1, y1] de cada PNG (de personagem, do 1º quadro)."""
    meta = {}
    for p in sorted(ART.glob('personagens/*/*.png')) + sorted(ART.glob('cenario/*/*.png')) + sorted(ART.glob('mapa/*.png')):
        im = Image.open(p).convert('RGBA')
        if '-' in p.stem:  # tira: mede o 1º quadro
            im = im.crop((0, 0, im.height, im.height))
        box = im.getbbox()
        if box:
            meta[p.relative_to(ART).as_posix()] = list(box)
    OUT_JS.write_text('// Gerado por Sprites/IsoCards/_tools/baixar.py: caixa visível [x0, y0, x1, y1] de cada sprite.\n'
                      'window.SPRITE_META = ' + json.dumps(meta, indent=0) + ';\n', encoding='utf-8')
    print('sprites.js:', len(meta), 'sprites')


def main():
    assets = json.loads((ART / 'pixellab-assets.json').read_text(encoding='utf-8'))
    only = set(sys.argv[1:])
    for key, cid in assets['personagens'].items():
        if not only or key in only:
            save_char(key, cid)
    if not only:
        for key, tid in assets['tiles'].items():
            save_tiles(key, tid)
        for key, props in assets['cenario'].items():
            save_props(key, props)
        save_props('../mapa', assets['mapa'])
    write_meta()


if __name__ == '__main__':
    main()
