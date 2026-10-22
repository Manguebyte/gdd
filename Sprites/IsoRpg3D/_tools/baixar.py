"""Baixa as texturas 3D do Iso RPG 3D (piso e parede por bioma) do PixelLab.

POR QUE: os tiles do Iso RPG 2D são losangos isométricos; o 3D precisa de texturas quadradas
(piso visto de cima, face de parede vista de frente). Cada bioma tem um lote de piso e um de
parede gerados com `create_tiles_pro` (square_topdown, vista top-down, 64 px, paleta extraída dos
tiles isométricos do mesmo bioma). Os ids estão em TILESETS.
ESTRATÉGIA: baixa as 16 variações de cada lote para <bioma>/floor-NN.png e wall-NN.png (os
arquivos brutos não precisam de tratamento). Quais variações o jogo usa, e qual parede é tocha,
fica à mão em ../textures.js, porque é escolha de olho (descartar as que destoam).

Uso: python _tools/baixar.py            (todos os biomas)
     python _tools/baixar.py ice volcano (só esses)
"""
import os
import sys
import urllib.request

BASE = 'https://backblaze.pixellab.ai/file/pixellab-tiles/b6fbbf99-a093-4f32-b1d5-41913afcc286'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# bioma: (lote de piso, lote de parede)
TILESETS = {
    'orcs': ('90ac24a1-5eaf-4a7e-8335-31689ed17d1f', 'd523c3dc-afb1-45d3-bb16-906aa27797d4'),
    'forest': ('848d12eb-3b0a-4610-8c6a-3ff6c028e57c', 'ed9315a3-7ce1-4878-ae99-eb7622984dd3'),
    'swamp': ('06c1aa98-0bdd-4937-a0e5-d50af14389e4', '03794524-704b-4623-b935-990495131023'),
    'ice': ('474c123c-26a6-45bf-9ba2-d949fc22ffe5', '03b16efb-b3ea-49df-9fd4-d90b813da267'),
    'volcano': ('c722f6b9-c5a2-4706-8c28-b4721b209e65', '8e5edb55-8bae-4ec8-b1ce-2d750dac46d5'),
    'academy': ('315ad297-1e40-440f-a80f-d03c7d14d669', '5b1a03a6-cec2-4d4c-9668-48aa537cd4c5'),
}


def baixar(bioma):
    pasta = os.path.join(ROOT, bioma)
    os.makedirs(pasta, exist_ok=True)
    for tipo, lote in zip(('floor', 'wall'), TILESETS[bioma]):
        for i in range(16):
            destino = os.path.join(pasta, f'{tipo}-{i:02d}.png')
            # Sem User-Agent o servidor de arquivos responde 403.
            req = urllib.request.Request(f'{BASE}/{lote}/tile_{i}.png', headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as r, open(destino, 'wb') as f:
                f.write(r.read())
    print(f'{bioma}: 16 pisos e 16 paredes')


if __name__ == '__main__':
    for b in sys.argv[1:] or TILESETS:
        baixar(b)
