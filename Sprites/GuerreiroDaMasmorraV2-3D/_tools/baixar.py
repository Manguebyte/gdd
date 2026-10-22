"""Baixa as texturas 3D do Guerreiro da Masmorra 3D (estrada e margem por bioma) do PixelLab.

POR QUE: no V2 a estrada é desenhada em fatias de um trapézio; no 3D ela é chão de verdade e
precisa de texturas quadradas vistas de cima, para a estrada e para as margens (que no V2 eram
só uma faixa de cor). Cada bioma tem um lote de estrada e um de margem gerados com
`create_tiles_pro` (square_topdown, vista top-down, 64 px, paleta tirada das folhas de chão do V2
em ../GuerreiroDaMasmorraV2/assets/biomas/). Os ids estão em TILESETS.
ESTRATÉGIA: baixa as 16 variações de cada lote para <bioma>/road-NN.png e verge-NN.png. Quais
variações o jogo usa fica à mão em ../textures.js (escolha de olho).

Uso: python _tools/baixar.py              (todos os biomas)
     python _tools/baixar.py floresta     (só esse)
"""
import os
import sys
import urllib.request

BASE = 'https://backblaze.pixellab.ai/file/pixellab-tiles/b6fbbf99-a093-4f32-b1d5-41913afcc286'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# bioma do V2: (lote da estrada, lote da margem)
TILESETS = {
    'castelo': ('b0c9fdb9-c35b-4b25-87c3-d1a6211d129f', '488e9484-2714-4809-b293-3fb2c8b12f2f'),
    'floresta': ('3c432585-e61f-4930-9d36-265afaca923b', '212f31b5-2328-4c49-a194-1ec741ef5a89'),
    'cemiterio': ('4cd082eb-9e32-426a-9f9c-8dc6159b62dd', '60ff56bb-13dd-40c5-af09-5948344aec4d'),
    'ruinas': ('6913c6f2-7150-4b37-8274-66516b1e7394', 'ccc32dbb-8790-4315-b286-986c0329b763'),
}


def baixar(bioma):
    pasta = os.path.join(ROOT, bioma)
    os.makedirs(pasta, exist_ok=True)
    for tipo, lote in zip(('road', 'verge'), TILESETS[bioma]):
        for i in range(16):
            destino = os.path.join(pasta, f'{tipo}-{i:02d}.png')
            # Sem User-Agent o servidor de arquivos responde 403.
            req = urllib.request.Request(f'{BASE}/{lote}/tile_{i}.png', headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as r, open(destino, 'wb') as f:
                f.write(r.read())
    print(f'{bioma}: 16 estradas e 16 margens')


if __name__ == '__main__':
    for b in sys.argv[1:] or TILESETS:
        baixar(b)
