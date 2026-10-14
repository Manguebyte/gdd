"""Generate and recover this prototype's PixelLab assets, without storing credentials."""
import concurrent.futures
import hashlib
import json
import pathlib
import re
import urllib.request
from pixellab import rpc

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'pixellab-assets.json'
STYLE = 'Dark fantasy SNES 16-bit pixel art, top-down 3/4 view, crisp single-pixel clusters, limited palette dark indigo charcoal muted moss green amber highlights violet magic, selective dark outline, upper-left light, no cast shadow, no ground, transparent background, centered isolated game sprite, readable at small sizes.'
PLAN = {
    'witch': (64, 'Young adult female witch, protagonist heroine, pale skin, short silver hair, worn deep violet hooded cloak and dark travelling dress, small amber pendant, empty hands holding a subtle violet magical orb. Whole standing body viewed from front 3/4, no broom, no oversized hat. Frame contains only this character.'),
    'guard': (64, 'Hostile town guard, whole standing body, worn iron helmet and dark red tabard over leather armor, holding a spear and small torch. Humanoid game enemy sprite.'),
    'demon': (96, 'Large hunched horned demon boss, coal-black hide with ember-red cracks, long clawed forearms, feral snarling head, whole body, intimidating broad silhouette. No flames outside silhouette.'),
    'inquisitor': (96, 'Tall sinister inquisitor boss, black iron armor and crimson clerical robe, narrow pointed helmet, holding an ornate golden reliquary staff and chained censer, whole body.'),
    'ghost': (64, 'Spectral spirit of a woman burned as a witch, soft turquoise translucent dress, gentle face, long pale hair, floating peacefully with hands held together, whole body, no horror gore.'),
    'house': (128, 'One medieval half-timbered town house, mossy dark slate roof, weathered cream plaster walls, timber beams, amber-lit windows, closed wooden front door, 3/4 top-down view, entire building, no ground, no other props.'),
    'tree': (96, 'One twisted dark oak tree, full rounded sparse moss-green foliage, gnarled trunk and visible roots, cemetery atmosphere, entire tree, isolated, no ground.'),
    'pyre': (96, 'Checkpoint execution pyre, a charred wooden stake wrapped in burned iron chains with a small amber fire at its base and a few blackened logs, respectful somber memorial, no body or victim. Entire isolated object.'),
    'chest': (64, 'Small old wooden witch grimoire chest, iron bands, slightly open lid, a violet glow from within, 3/4 top-down game prop, isolated.'),
}


def load():
    return json.loads(MANIFEST.read_text('utf-8')) if MANIFEST.exists() else {}


def save(data):
    MANIFEST.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', 'utf-8')


def text_response(result):
    return '\n'.join(c['text'] for c in result.get('content', []) if c.get('type') == 'text')


def create(name, reference=None):
    size, prompt = PLAN[name]
    arguments = {'description': prompt + ' ' + STYLE, 'name': 'CacaAsBruxas_' + name, 'width': size, 'height': size, 'n_directions': 1, 'view': 'low top-down'}
    if reference:
        arguments['style_image'] = {'url': reference, 'usage_description': 'Match the pixel scale, palette, dark selective outlines and shading; draw the requested new subject.'}
    result = rpc('tools/call', {'name': 'create_object_pro_flash', 'arguments': arguments})
    if result.get('isError'):
        raise RuntimeError(text_response(result))
    return result


def main():
    import sys
    command = sys.argv[1]
    data = load()
    if command == 'create':
        name = sys.argv[2]
        result = create(name, data.get('witch', {}).get('url'))
        data[name] = {'generation_response': result, 'prompt': PLAN[name][1] + ' ' + STYLE}
        save(data)
        print(text_response(result))
    elif command == 'batch':
        names = [name for name in PLAN if name not in data]
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            pending = {pool.submit(create, name, data.get('witch', {}).get('url')): name for name in names}
            for future in concurrent.futures.as_completed(pending):
                name = pending[future]
                try:
                    result = future.result()
                    data[name] = {'generation_response': result, 'prompt': PLAN[name][1] + ' ' + STYLE}
                    save(data)
                    print(name, text_response(result), flush=True)
                except Exception as error:
                    print(name, type(error).__name__, str(error)[:300], flush=True)
    elif command == 'poll':
        name = sys.argv[2]
        oid = sys.argv[3] if len(sys.argv) > 3 else data[name]['object_id']
        result = rpc('tools/call', {'name': 'get_object', 'arguments': {'object_id': oid, 'include_preview': False}})
        data[name]['object_id'] = oid
        data[name]['status_response'] = result
        save(data)
        print(text_response(result))
    elif command == 'sync':
        for name, entry in data.items():
            if name not in PLAN:
                continue
            source = text_response(entry.get('generation_response', {}))
            oid = entry.get('object_id') or re.search(r'"object_id":\s*"([a-f0-9-]+)"', source).group(1)
            entry['object_id'] = oid
            result = rpc('tools/call', {'name': 'get_object', 'arguments': {'object_id': oid, 'include_preview': False}})
            status = text_response(result)
            entry['status'] = status.splitlines()[0]
            match = re.search(r'unknown:\s*(https://\S+\.png)', status)
            if match:
                url = match.group(1)
                request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(request, timeout=50) as response:
                    content = response.read()
                (ROOT / (name + '.png')).write_bytes(content)
                entry.update(url=url, file=name + '.png', sha12=hashlib.sha256(content).hexdigest()[:12])
            save(data)
            print(name, entry['status'], 'downloaded' if match else '', flush=True)
    elif command == 'walk':
        url = 'https://backblaze.pixellab.ai/file/pixellab-characters/objects/b6fbbf99-a093-4f32-b1d5-41913afcc286/81bd1a08-2698-4eae-811e-12928c9e6545/animations/cb0efb21-bf10-4a29-9fdc-f4aa0540c802/unknown/{i}.png'
        folder = ROOT / 'witch-walk'
        folder.mkdir(exist_ok=True)
        frames = []
        for i in range(8):
            request = urllib.request.Request(url.format(i=i), headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(request, timeout=50) as response:
                content = response.read()
            (folder / f'{i}.png').write_bytes(content)
            frames.append({'file': f'witch-walk/{i}.png', 'sha12': hashlib.sha256(content).hexdigest()[:12]})
        data['witch']['walk'] = {'animation_group_id': '78ffa132-7b07-4f67-ba0f-e64e961d9def', 'url_pattern': url, 'frames': frames}
        save(data)
        print('Saved eight walking frames')
    elif command == 'download':
        name, url = sys.argv[2:4]
        data.setdefault(name, {})
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=50) as response:
            content = response.read()
        if not content.startswith(b'\x89PNG'):
            raise RuntimeError('Expected PNG image')
        (ROOT / (name + '.png')).write_bytes(content)
        data[name]['url'] = url
        data[name]['sha12'] = hashlib.sha256(content).hexdigest()[:12]
        data[name]['file'] = name + '.png'
        save(data)
        print('Saved', name, len(content), 'bytes')


if __name__ == '__main__':
    main()
