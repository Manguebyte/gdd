"""Baixa a interface PixelLab do Old Knight and the Witch (ícones, ilustrações das cartas e molduras).

POR QUE: o protótipo troca os emojis herdados do app por ícones próprios (okw-ui.js) e desenha
as cartas da Bruxa no estilo do Iso Cards; tudo isso vem de gerações do PixelLab listadas em
ui.json. Este script refaz as pastas ui/ e cartas/ a partir dos ids, sem gerar nada de novo.
ESTRATÉGIA:
  - cards (48×48) e icons (32×32): download direto de cada job.
  - sheet: uma folha 4×4 de 128 px que saiu com outros desenhos; 7 células viram ícones
    (caveira, grimório, cristal, armas cruzadas...).
  - panels: o create_ui_asset devolve a moldura numa tela maior, às vezes com outras peças
    em volta (region recorta) e, nos botões, com a palavra "Button" desenhada no meio.
    'clean' = [x0, x1, ponta]: mantém as pontas e refaz o miolo repetindo a faixa x0..x1.

Uso: python baixar_ui.py
"""
import io, json, pathlib, urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / '_tools' / 'ui.json').read_text(encoding='utf-8'))


def get(url):
    # O armazenamento recusa (403) pedidos sem User-Agent.
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'curl/8'})) as r:
        return r.read()


def image(job):
    return Image.open(io.BytesIO(get(f'https://api.pixellab.ai/mcp/images/{job}/download'))).convert('RGBA')


def trim(im):
    return im.crop(im.split()[3].getbbox())


def clean_button(im, x0, x1, cap):
    """Pontas originais + miolo repetindo a faixa x0..x1 (some o texto desenhado)."""
    w, h = im.size
    out = Image.new('RGBA', (w, h))
    out.paste(im.crop((0, 0, cap, h)), (0, 0))
    out.paste(im.crop((w - cap, 0, w, h)), (w - cap, 0))
    strip, x = im.crop((x0, 0, x1, h)), cap
    while x < w - cap:
        piece = strip.crop((0, 0, min(strip.width, w - cap - x), h))
        out.paste(piece, (x, 0))
        x += piece.width
    return out


(ROOT / 'cartas').mkdir(exist_ok=True)
(ROOT / 'ui' / 'icons').mkdir(parents=True, exist_ok=True)
for cid, job in CFG['cards'].items():
    image(job).save(ROOT / 'cartas' / f'{cid}.png')
for name, job in CFG['icons'].items():
    image(job).save(ROOT / 'ui' / 'icons' / f'{name}.png')
sheet = image(CFG['sheet'])
for name, (c, r) in CFG['sheetCells'].items():
    sheet.crop((c * 32, r * 32, c * 32 + 32, r * 32 + 32)).save(ROOT / 'ui' / 'icons' / f'{name}.png')
for name, p in CFG['panels'].items():
    im = Image.open(io.BytesIO(get(f'https://api.pixellab.ai/mcp/ui-assets/{p["id"]}/download'))).convert('RGBA')
    if 'region' in p:
        im = im.crop(tuple(p['region']))
    im = trim(im)
    if 'clean' in p:
        im = clean_button(im, *p['clean'])
    im.save(ROOT / 'ui' / f'{name}.png')
print('ok:', len(CFG['cards']), 'cartas,', len(CFG['icons']) + len(CFG['sheetCells']), 'ícones,', len(CFG['panels']), 'molduras')
