"""Baixa a arte PixelLab do Old Knight and the Witch e gera o units.js que o protótipo lê.

POR QUE: o protótipo (prototipos/old-knight-and-the-witch/) desenha cada personagem com o
mesmo esquema dos inimigos PixelLab do Guerreiro da Masmorra (app): uma tira horizontal
de quadros quadrados por animação (idle.png, run.png, attack.png) e um `cont` que diz
quanto do quadro o boneco ocupa e onde ficam os pés. Medir isso à mão quebra fácil.
ESTRATÉGIA:
  - Personagens (chars.json): baixa o ZIP do personagem e pega a direção que o jogo usa
    (heróis de costas, `north`, na batalha; inimigos de frente, `south`). Os heróis ganham
    também `camp.png` (idle de frente) para o acampamento e as cenas.
  - As animações v3 vêm num canvas maior que o idle (o boneco precisa de espaço para o
    golpe). Todos os quadros de um personagem são centralizados num quadrado do tamanho
    do maior, para o jogo usar um `fs` só.
  - O `cont` sai do primeiro quadro do idle: [altura do boneco ÷ quadro, pé ÷ quadro].
  - Objetos de 1 direção (as gosmas): imagem base + animações do get_object, salvas igual.

Uso: python baixar.py              (baixa tudo e regera o units.js)
     python baixar.py witch hound  (só esses)
     python baixar.py --local      (só regera o units.js com os PNGs que já existem)
"""
import io, json, pathlib, sys, urllib.error, urllib.request, zipfile

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOLS = ROOT / '_tools'
LOCAL = '--local' in sys.argv
ONLY = {a for a in sys.argv[1:] if not a.startswith('--')}
wanted = lambda name: not ONLY or name in ONLY

CHARS = {k: v for k, v in json.loads((TOOLS / 'chars.json').read_text(encoding='utf-8')).items() if not k.startswith('_')}
OBJECTS = json.loads((TOOLS / 'objects.json').read_text(encoding='utf-8')) if (TOOLS / 'objects.json').exists() else {}
HEROES = {'witch', 'oldknight', 'woodcutter'}
ANIMS = ['idle', 'run', 'attack']
# Nomes alternativos que o metadata.json pode usar para cada animação.
ALIAS = {
    'idle': ['idle', 'breathing-idle'],
    'run': ['run', 'running-6-frames', 'running-4-frames', 'walking'],
    'attack': ['attack', 'fireball', 'bark'],
}


def get(url):
    # O armazenamento recusa (403) pedidos sem User-Agent.
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'curl/8'})) as r:
        return r.read()


def square(frames, size):
    """Centraliza cada quadro num quadrado `size` × `size`."""
    out = []
    for im in frames:
        canvas = Image.new('RGBA', (size, size))
        canvas.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
        out.append(canvas)
    return out


def strip(frames):
    w, h = frames[0].size
    sheet = Image.new('RGBA', (w * len(frames), h))
    for i, im in enumerate(frames):
        sheet.alpha_composite(im, (i * w, 0))
    return sheet


def measure(im):
    """[altura opaca ÷ altura, linha do pé ÷ altura] do quadro."""
    box = im.split()[3].getbbox()
    if not box:
        return [1.0, 1.0]
    return [round((box[3] - box[1]) / im.height, 3), round(box[3] / im.height, 3)]


def find_anim(anims, name, direction):
    for key in ALIAS[name]:
        for k, dirs in anims.items():
            if (k == key or k.startswith(key)) and direction in dirs:
                return dirs[direction]
    return None


def save_char(cid, frames_by_anim, extra=None):
    folder = ROOT / cid
    folder.mkdir(parents=True, exist_ok=True)
    every = [im for fr in frames_by_anim.values() for im in fr] + [im for fr in (extra or {}).values() for im in fr]
    size = max(max(im.width, im.height) for im in every)
    for name, fr in {**frames_by_anim, **(extra or {})}.items():
        strip(square(fr, size)).save(folder / f'{name}.png')
    print('ok', cid, size, {k: len(v) for k, v in frames_by_anim.items()})


if not LOCAL:
    for cid, info in CHARS.items():
        if not wanted(cid):
            continue
        try:
            z = zipfile.ZipFile(io.BytesIO(get(f'https://api.pixellab.ai/mcp/characters/{info["id"]}/download')))
        except urllib.error.HTTPError as e:   # 423: ainda tem animação gerando
            print('pulei', cid, e.code)
            continue
        meta = json.loads(z.read('metadata.json'))
        state = meta['states'][0]['frames']
        anims = state.get('animations', {})
        game_dir = info['dirs'][0]
        load = lambda paths: [Image.open(io.BytesIO(z.read(p))).convert('RGBA') for p in paths]
        out = {}
        for name in ANIMS:
            paths = find_anim(anims, name, game_dir)
            if not paths:
                print('falta', cid, name, '| animações:', list(anims))
                continue
            out[name] = load(paths)
        if 'idle' not in out:
            out['idle'] = load([state['rotations'][game_dir]])
        if 'run' not in out:
            out['run'] = out['idle']
        if 'attack' not in out:   # sem golpe ainda: o jogo toca a pose parada no lugar
            out['attack'] = out['idle']
        extra = {}
        if cid in HEROES:
            paths = find_anim(anims, 'idle', 'south')
            extra['camp'] = load(paths) if paths else load([state['rotations']['south']])
        save_char(cid, out, extra)

    for cid, obj in OBJECTS.items():
        if cid.startswith('_') or not wanted(cid):
            continue
        out = {'idle': [Image.open(io.BytesIO(get(obj['base']))).convert('RGBA')]}
        for name, (pattern, n) in obj.get('anims', {}).items():
            out[name] = [Image.open(io.BytesIO(get(pattern.replace('{i}', str(i))))).convert('RGBA') for i in range(n)]
        out.setdefault('run', out['idle'])
        out.setdefault('attack', out['idle'])
        save_char(cid, out)

# units.js: o catálogo que o protótipo mistura no UNITS do jogo.
units = {}
for folder in sorted(p for p in ROOT.iterdir() if p.is_dir() and not p.name.startswith('_')):
    idle = folder / 'idle.png'
    if not idle.exists():
        continue
    im = Image.open(idle).convert('RGBA')
    fs = im.height
    anims = {n: f'{n}.png' for n in ANIMS + ['camp'] if (folder / f'{n}.png').exists()}
    # O motor do app toca 'attack2' no contra-ataque e alterna os golpes nos combos: sem
    # folha própria, repete o golpe (senão o boneco vira o emoji de reserva).
    if 'attack' in anims:
        anims['attack2'] = anims['attack']
    units[folder.name] = {
        'fs': fs,
        'cont': measure(im.crop((0, 0, fs, fs))),
        'vis': 0.95,
        'faceFront': True,
        'base': f'../../Sprites/OldKnightWitch/{folder.name}/',
        'dir': '',
        'fall': '?',
        'anims': anims,
    }
(ROOT / 'units.js').write_text(
    '// Gerado por _tools/baixar.py: não edite à mão.\nwindow.OKW_UNITS = ' + json.dumps(units, indent=1, ensure_ascii=False) + ';\n',
    encoding='utf-8')
print('units.js:', ', '.join(units))
