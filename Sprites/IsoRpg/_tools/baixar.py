"""Baixa a arte PixelLab do Iso RPG e gera o sprites.js que o protótipo lê.

POR QUE: o protótipo (prototipos/iso-rpg/) carrega os PNGs direto desta pasta
e precisa saber o tamanho de cada quadro e o ponto de apoio no chão (âncora,
os pés) de cada personagem. Fazer isso à mão quebra fácil; aqui sai sempre igual.
ESTRATÉGIA:
  - Personagens: baixa o ZIP do personagem, pega só a direção que o jogo usa
    (herói olha para o nordeste, monstros para o sudoeste) e junta os quadros
    de cada animação numa folha horizontal <id>/<animação>.png. A âncora vem dos
    pés no primeiro quadro da animação "idle" (o mesmo pé em todas as animações,
    alinhado pelo centro do quadro, porque o v3 às vezes aumenta o canvas).
  - Chefe: além da folha vermelha original, gera as cores Negra, Púrpura e
    Dourada trocando o matiz dos pixels vermelhos (no jogo a cor da masmorra
    troca o Cavaleiro). Fica pronto em PNG porque recolorir no navegador quebra
    ao abrir o index.html direto do disco (canvas "tainted").
  - Tiles: um conjunto de piso e um de parede por bioma, em tiles/<bioma>/.
  - Objetos de cenário: _tools/decor.json (nome -> job). Cada bioma escolhe os seus no jogo.

Uso: python baixar.py                (baixa tudo e regera o sprites.js)
     python baixar.py yeti ice ...    (só esses personagens/biomas; objetos que faltam sempre baixam)
     python baixar.py --local         (só regera o sprites.js com os PNGs que já existem)
"""
import colorsys, io, json, pathlib, sys, urllib.error, urllib.request, zipfile

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOCAL = '--local' in sys.argv
ONLY = {a for a in sys.argv[1:] if not a.startswith('--')}
wanted = lambda name: not ONLY or name in ONLY

# Personagens: id do jogo -> (character_id do PixelLab, direção usada no jogo).
CHARS = {
    'hero':   ('8e931a51-629e-4c7f-8ddf-f52a09358e58', 'north-east'),
    'pawn':   ('363aa266-7f7f-490c-ae26-54fbb3dc6147', 'south-west'),
    'archer': ('c3b7aedb-0db7-4185-aa0d-3ced438a163e', 'south-west'),
    'boss':   ('210966c1-5abf-4200-b723-c5a8bf21e9cf', 'south-west'),
    # Montanha de Gelo (o lobo é quadrúpede: template "dog")
    'yeti':   ('d94c7ea4-eb86-4034-be2b-061c804da979', 'south-west'),
    'wolf':   ('f4cc9ace-e7b8-4137-a616-2b653defe378', 'south-west'),
    'spirit': ('21614f5b-430c-4973-b775-aa2098af699a', 'south-west'),
    'giant':  ('6f674885-bf0e-43f3-bc55-58bc07c6daf2', 'south-west'),
    # Masmorra dos Orcs
    'orc':        ('e3c6ac8d-8b3a-43cc-a36f-a54a93459c6e', 'south-west'),
    'shaman':     ('122722c7-f89a-4290-9445-8c0dac91b162', 'south-west'),
    'warlord':    ('26ccbeaf-ffcb-47e5-a703-5a9c7b86f285', 'south-west'),
    # Floresta Amaldiçoada
    'thief':      ('7933b626-fe7a-404a-98d7-a3a2f01cdd86', 'south-west'),
    'scarecrow':  ('bcf85a81-1d58-4cf7-a88d-9599fd06d579', 'south-west'),
    'dryad':      ('185bac27-2bcc-4ac5-bc4a-5d5bf6f617a6', 'south-west'),
    'tree':       ('314bf742-a822-402d-a1f5-41e32c37ffb9', 'south-west'),
    # Pântano
    'frogman':    ('6ead9fe2-2394-48ea-aacc-a8cfd104127e', 'south-west'),
    'zombie':     ('721695e8-2c38-4865-aee3-dba0fbee2f95', 'south-west'),
    'witch':      ('68b49aaa-8086-408e-909e-b09df103c182', 'south-west'),
    'frogking':   ('195950c1-f1ef-4227-8f06-9eef013a1199', 'south-west'),
    # Vulcão
    'firegob':    ('582c7b87-2b6d-4b77-b95b-265f8b64a357', 'south-west'),
    'salamander': ('c1fb031b-a9c9-4e33-8119-ead7f2719af4', 'south-west'),
    'golem':      ('bc29c30d-5449-42e3-9158-13fe0157c4cc', 'south-west'),
    'demon':      ('dd37e054-51a4-4a45-9d00-dd7be6beb8fb', 'south-west'),
    # Academia de Magia
    'apprentice': ('17d91441-7d56-48f7-9f2d-47b2c90f3e21', 'south-west'),
    'gargoyle':   ('1f5a2edf-70a7-4b73-8239-26fe1d1019ac', 'south-west'),
    'armor':      ('338e4c61-41d4-46ab-8b0b-295b0c7b29e8', 'south-west'),
    'archmage':   ('8707b52c-5071-477b-aefb-edc9aab3de26', 'south-west'),
}
ANIMS = ['idle', 'walk', 'attack', 'death']
# Gosmas do treinamento: sem pernas, então não viram "character". A pose vem do create_image_pro_flash e
# cada animação do animate_image (quadro 0 = a própria pose). Sem "walk": no jogo a gosma desliza no idle.
# As mortes geradas (e18a21d5, abd7f9ba) não derretiam a gosma; o jogo derrete por código (def.melt).
IMAGE_CHARS = {
    'slime': {'pose': '868c5592-e294-424c-abe4-d172acd97f02', 'idle': 'e1212093-fd06-4b16-91a0-2754cdbfe926',
              'attack': '8e0596cc-a1f9-4887-812c-c10af12fe195'},
    'slimeking': {'pose': 'c15572e8-7b93-45f5-853a-8d98d4d50d28', 'idle': '6fe48fba-3876-4fae-a0b5-491ef2ddaf74',
                  'attack': '2610c293-aea3-46c5-9711-25da7c5db68c'},
}
# Personagens que são outro recolorido: id -> (origem, (matiz de/até em graus), matiz de destino).
RECOLOR_CHARS = {'slime2': ('slime', (60, 170), 205)}   # Gosma Azul = a Verde com o verde virando azul
# Animação refeita com outro nome no PixelLab: (personagem, animação do jogo) -> nome no PixelLab.
# O primeiro ataque do Arqueiro mirava para a direita; o "shoot" mira para o herói (embaixo à esquerda).
ALIAS = {('archer', 'attack'): 'shoot'}
# Mesmo assim o arco aponta para a direita da tela; espelhada, a folha mira no herói (o corpo gira no tiro).
MIRROR = {('archer', 'attack')}
# Matiz de destino (graus) e ajustes de saturação/brilho de cada cor do chefe.
BOSS_COLORS = {'red': None, 'black': (0, 0.08, 0.55), 'purple': (282, 1.0, 0.95), 'yellow': (46, 1.05, 1.25)}

# Bioma -> (piso, parede), ids do create_tiles_pro. O piso e a parede da Masmorra dos Orcs usaram como
# estilo os tiles avulsos 95939ddc e 8b59bdf7; os outros biomas usam os da Masmorra dos Orcs (forma e
# contorno) com paleta própria.
TILESETS = {
    'orcs': ('8bb8f1f4-9838-4e05-b357-9589b19d84eb', '460103f9-8979-4641-8105-a30a4c45ddc9'),
    'ice': ('d4045f41-1ba3-431a-8760-aecd02834c34', 'a34f4f7a-8d4b-410e-9709-91d87ca0fc3f'),
    'forest': ('61715483-3fe6-4438-8d2e-6d3f165a109d', 'aac0b01f-c507-48bb-8eba-4f123785d449'),
    'swamp': ('189f9721-9412-4c85-8ed8-af755f695dca', '111207bc-e022-47b4-b190-7270d2a9fb69'),
    'volcano': ('84036d80-9fec-495f-a16b-00ebff0bf0c7', 'df2d14a3-39f2-4cf0-9be0-2e102067889b'),
    'academy': ('20b2d58f-32db-44f0-b87e-b8f845e85a49', '3325f74f-0422-4426-a05d-f8e21a47c3ad'),
}
# No Vulcão (lava) e na Academia (dourado, madeira) outras paredes também passam por chama: lá, só estes blocos contam como tocha.
TORCH_ONLY = {'volcano': {8, 9, 10, 11}, 'academy': {8, 9, 10, 11}}
TILE_URL = 'https://backblaze.pixellab.ai/file/pixellab-tiles/b6fbbf99-a093-4f32-b1d5-41913afcc286/{}/tile_{}.png'
# Objetos de cenário: nome -> job_id do create_image_pro_flash.
DECOR = json.loads((ROOT / '_tools' / 'decor.json').read_text(encoding='utf-8')) if (ROOT / '_tools' / 'decor.json').exists() else {}


def get(url):
    # O armazenamento dos tiles recusa (403) pedidos sem User-Agent.
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'curl/8'})) as r:
        return r.read()


def feet(im):
    """Pés = linha opaca mais baixa; x = centro dos pixels opacos das 3 últimas linhas."""
    a = im.split()[3]
    w, h = im.size
    for y in range(h - 1, -1, -1):
        xs = [x for yy in range(max(0, y - 2), y + 1) for x in range(w) if a.getpixel((x, yy)) > 0]
        if xs:
            return (min(xs) + max(xs)) // 2, y
    return w // 2, h - 1


def recolor(im, target):
    """Troca o matiz dos pixels avermelhados (capa e tabardo) pelo da cor pedida."""
    hue, sat_k, val_k = target
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.35 and (h < 0.06 or h > 0.93):
                r2, g2, b2 = colorsys.hsv_to_rgb(hue / 360, min(1, s * sat_k), min(1, v * val_k))
                px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    return im


manifest = {}
if not LOCAL:
    old = json.loads((ROOT / 'pixellab-assets.json').read_text(encoding='utf-8')) if (ROOT / 'pixellab-assets.json').exists() else {}
    for cid, (pid, d) in CHARS.items():
        if not wanted(cid):
            if cid in old:
                manifest[cid] = old[cid]
            continue
        try:
            z = zipfile.ZipFile(io.BytesIO(get(f'https://api.pixellab.ai/mcp/characters/{pid}/download')))
        except urllib.error.HTTPError as e:   # 423: ainda tem animação gerando; mantém os PNGs que já existem
            print('pulei', cid, e.code)
            if cid in old:
                manifest[cid] = old[cid]
            continue
        frames = json.loads(z.read('metadata.json'))['states'][0]['frames']
        folder = ROOT / cid
        folder.mkdir(parents=True, exist_ok=True)
        Image.open(io.BytesIO(z.read(frames['rotations'][d]))).save(folder / 'pose.png')
        for anim in ANIMS:
            paths = frames['animations'].get(ALIAS.get((cid, anim), anim), {}).get(d)
            if not paths:
                print('falta', cid, anim)
                continue
            imgs = [Image.open(io.BytesIO(z.read(p))).convert('RGBA') for p in paths]
            if (cid, anim) in MIRROR:
                imgs = [im.transpose(Image.FLIP_LEFT_RIGHT) for im in imgs]
            w, h = imgs[0].size
            sheet = Image.new('RGBA', (w * len(imgs), h))
            for i, im in enumerate(imgs):
                sheet.alpha_composite(im, (i * w, 0))
            sheet.save(folder / f'{anim}.png')
        manifest[cid] = {'character_id': pid, 'direction': d, 'tool': 'create_character v3 (referência) + animate_character'}
        print('ok', cid)
    for cid, jobs in IMAGE_CHARS.items():
        if not wanted(cid):
            if cid in old:
                manifest[cid] = old[cid]
            continue
        folder = ROOT / cid
        folder.mkdir(parents=True, exist_ok=True)
        (folder / 'pose.png').write_bytes(get(f'https://api.pixellab.ai/mcp/images/{jobs["pose"]}/download'))
        for anim in ANIMS:
            if anim not in jobs:
                continue
            imgs = []
            for i in range(40):   # quadros até o servidor dizer que acabou
                try:
                    imgs.append(Image.open(io.BytesIO(get(f'https://api.pixellab.ai/mcp/images/{jobs[anim]}/download?index={i}'))).convert('RGBA'))
                except urllib.error.HTTPError:
                    break
            w, h = imgs[0].size
            sheet = Image.new('RGBA', (w * len(imgs), h))
            for i, im in enumerate(imgs):
                sheet.alpha_composite(im, (i * w, 0))
            sheet.save(folder / f'{anim}.png')
        manifest[cid] = {**jobs, 'tool': 'create_image_pro_flash + animate_image'}
        print('ok', cid)
    for biome, (floor_id, wall_id) in TILESETS.items():
        manifest[f'tiles/{biome}'] = {'floor_tiles_pro_id': floor_id, 'wall_tiles_pro_id': wall_id}
        if not wanted(biome):
            continue
        folder = ROOT / 'tiles' / biome
        folder.mkdir(parents=True, exist_ok=True)
        for i in range(16):
            (folder / f'floor-{i:02}.png').write_bytes(get(TILE_URL.format(floor_id, i)))
            (folder / f'wall-{i:02}.png').write_bytes(get(TILE_URL.format(wall_id, i)))
    (ROOT / 'decor').mkdir(exist_ok=True)
    for name, job in DECOR.items():
        manifest[f'decor/{name}'] = {'job_id': job, 'tool': 'create_image_pro_flash'}
        if not (ROOT / 'decor' / f'{name}.png').exists() or '--force' in sys.argv:
            (ROOT / 'decor' / f'{name}.png').write_bytes(get(f'https://api.pixellab.ai/mcp/images/{job}/download'))
    print('ok tiles e cenário')
    (ROOT / 'pixellab-assets.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')

# --- personagens recoloridos -----------------------------------------------------
def shift_hue(im, lo, hi, target):
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s_, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s_ > 0.2 and lo <= h * 360 <= hi:
                r2, g2, b2 = colorsys.hsv_to_rgb(target / 360, s_, v)
                px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    return im


for cid, (src, (lo, hi), target) in RECOLOR_CHARS.items():
    if not (ROOT / src / 'idle.png').exists():
        continue
    (ROOT / cid).mkdir(exist_ok=True)
    for f in (ROOT / cid).glob('*.png'):   # recomeça do zero: não sobra folha que a origem já não tem
        f.unlink()
    for f in (ROOT / src).glob('*.png'):
        shift_hue(Image.open(f).convert('RGBA'), lo, hi, target).save(ROOT / cid / f.name)

# --- cores do chefe ------------------------------------------------------------
for anim in ANIMS:
    src = ROOT / 'boss' / f'{anim}.png'
    if not src.exists():
        continue
    for color, target in BOSS_COLORS.items():
        out = ROOT / 'boss' / f'{anim}-{color}.png'
        if target is None:
            Image.open(src).save(out)
        elif LOCAL and out.exists() and out.stat().st_mtime > src.stat().st_mtime:
            continue
        else:
            recolor(Image.open(src).convert('RGBA'), target).save(out)

# --- sprites.js ----------------------------------------------------------------
sprites = {}
for cid in [*CHARS, *IMAGE_CHARS, *RECOLOR_CHARS]:
    folder = ROOT / cid
    if not (folder / 'idle.png').exists():
        continue
    idle = Image.open(folder / 'idle.png').convert('RGBA')
    ih = idle.height
    first = idle.crop((0, 0, ih, ih))
    fx, fy = feet(first)
    entry = {'top': fy - first.getbbox()[1], 'anims': {}}   # top: altura da cabeça acima dos pés
    for anim in ANIMS:
        p = folder / f'{anim}.png'
        if not p.exists():
            continue
        sh = Image.open(p)
        fw = sh.height   # quadros quadrados
        off = (fw - ih) // 2   # o v3 aumenta o canvas em volta do mesmo centro
        ax = fw - 1 - (fx + off) if (cid, anim) in MIRROR else fx + off
        entry['anims'][anim] = {'n': sh.width // fw, 'w': fw, 'ax': ax, 'ay': fy + off}
    sprites[cid] = entry

tiles = {}
for folder in sorted(p for p in (ROOT / 'tiles').iterdir() if p.is_dir()):
    t = tiles[folder.name] = {'floor': len(list(folder.glob('floor-*.png'))), 'wall': len(list(folder.glob('wall-*.png'))), 'torch': {}}
    # Blocos de parede com tocha: o centro da chama (px do PNG), para o jogo acender a luz ali.
    for p in sorted(folder.glob('wall-*.png')):
        if folder.name in TORCH_ONLY and int(p.stem.split('-')[1]) not in TORCH_ONLY[folder.name]:
            continue
        im = Image.open(p).convert('RGBA')
        fire = [(x, y) for y in range(im.height) for x in range(im.width)
                if (lambda c: c[3] and c[0] > 210 and c[1] > 110 and c[2] < 110 and c[0] - c[2] > 120)(im.getpixel((x, y)))]
        if len(fire) >= 4:
            cx, cy = sum(f[0] for f in fire) // len(fire), sum(f[1] for f in fire) // len(fire)
            # Tocha na face esquerda fica escondida atrás do bloco vizinho na parede do fundo:
            # espelhado, o bloco continua certo e a tocha vai para a face que olha para o corredor.
            if cx < 32:
                im.transpose(Image.FLIP_LEFT_RIGHT).save(p)
                cx = im.width - 1 - cx
            t['torch'][int(p.stem.split('-')[1])] = [cx, cy]
decor = {}
for p in sorted((ROOT / 'decor').glob('*.png')) if (ROOT / 'decor').exists() else []:
    im = Image.open(p).convert('RGBA')
    ax, ay = feet(im)
    decor[p.stem] = {'ax': ax, 'ay': ay}

js = ('// Gerado por _tools/baixar.py: tamanho dos quadros e ponto de apoio no chão\n'
      '// (âncora, os pés, em px do PNG) da arte PixelLab do Iso RPG. Não edite à mão.\n'
      'window.IR_SPRITES = ' + json.dumps({'chars': sprites, 'tiles': tiles, 'decor': decor}, indent=1, ensure_ascii=False) + ';\n')
(ROOT / 'sprites.js').write_text(js, encoding='utf-8')
print('sprites.js:', ', '.join(sprites), '| decor:', ', '.join(decor))
