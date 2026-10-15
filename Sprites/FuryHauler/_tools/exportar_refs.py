"""Exporta as formas vetoriais do protótipo como PNG de referência para o PixelLab.

POR QUE: cada sprite é um redesenho em pixel art da forma vetorial do
protótipo, no mesmo ângulo isométrico e no mesmo tamanho. Assim o sprite
encaixa na lógica do jogo sem ajuste à mão.
ESTRATÉGIA: abre o protótipo no Chrome headless com o atalho #refs, que
desenha cada objeto sozinho e escreve os PNGs (em base64) e as âncoras no DOM.

Uso: python exportar_refs.py   (grava em ../_refs/ e ../_refs/refs.json)
"""
import base64, json, pathlib, re, subprocess, html

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent.parent  # raiz do repositório
PAGE = ROOT / 'prototipos' / 'fury-hauler' / 'index.html'
OUT = HERE.parent / '_refs'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

dom = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--virtual-time-budget=3000',
                      '--dump-dom', PAGE.as_uri() + '#refs'], capture_output=True, text=True, encoding='utf-8').stdout
m = re.search(r'<pre id="REFS">(.*?)</pre>', dom, re.S)
if not m:
    raise SystemExit('Não achei o <pre id="REFS"> no DOM.')
refs = json.loads(html.unescape(m.group(1)))
OUT.mkdir(exist_ok=True)
anchors = {}
for name, r in refs.items():
    (OUT / f'{name}.png').write_bytes(base64.b64decode(r['png'].split(',', 1)[1]))
    anchors[name] = {'w': r['w'], 'h': r['h'], 'ax': r['ax'], 'ay': r['ay']}
    print(f"{name:16s} {r['w']}x{r['h']}  âncora ({r['ax']}, {r['ay']})")
(OUT / 'refs.json').write_text(json.dumps(anchors, indent=2), encoding='utf-8')
