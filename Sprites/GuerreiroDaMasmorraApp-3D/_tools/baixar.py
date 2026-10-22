"""Baixa as paredes 3D dos interiores do Guerreiro da Masmorra 3D (app) do PixelLab.

POR QUE: o jogo do app tem 3 biomas de interior (Cripta, Igreja Profanada, Salão do Castelo) que
no 3D viram corredores com paredes e teto de verdade. O chão deles e os biomas ao ar livre
reaproveitam as texturas de ../GuerreiroDaMasmorraV2-3D/; só as paredes são novas. Cada interior
tem um lote gerado com `create_tiles_pro` (square_topdown, vista top-down, 64 px, paleta da parede
de pedra do app em ../GuerreiroDaMasmorraApp/assets/biomas/wall_stone.png). Os ids estão em TILESETS.
ESTRATÉGIA: baixa as 16 variações de cada lote para <bioma>/wall-NN.png. Quais variações o jogo
usa, e qual é a tocha, fica à mão em ../textures.js.

Uso: python _tools/baixar.py           (todos)
     python _tools/baixar.py cripta    (só esse)
"""
import os
import sys
import urllib.request

BASE = 'https://backblaze.pixellab.ai/file/pixellab-tiles/b6fbbf99-a093-4f32-b1d5-41913afcc286'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TILESETS = {
    'cripta': '15a0daf7-b31b-4054-8540-75c562583596',
    'igreja': 'e5cfe40c-ceb2-4d13-8fee-e99f3dc3f843',
    'salao': 'daede70a-4fb2-44a7-8fc2-e0fbd2ac3790',
}


def baixar(bioma):
    pasta = os.path.join(ROOT, bioma)
    os.makedirs(pasta, exist_ok=True)
    for i in range(16):
        # Sem User-Agent o servidor de arquivos responde 403.
        req = urllib.request.Request(f'{BASE}/{TILESETS[bioma]}/tile_{i}.png', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as r, open(os.path.join(pasta, f'wall-{i:02d}.png'), 'wb') as f:
            f.write(r.read())
    print(f'{bioma}: 16 paredes')


if __name__ == '__main__':
    for b in sys.argv[1:] or TILESETS:
        baixar(b)
