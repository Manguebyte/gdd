# Importa o jogo do repositório abraaovilanova/guerreiro-da-masmorra-v2 como protótipo deste repo.
#
# POR QUE: a v2 é um jogo pronto (um index.html só, com a arte em pastas soltas na raiz dela).
# Em vez de reescrever o jogo, o protótipo é o próprio index.html dela, com a arte morando em
# Sprites/GuerreiroDaMasmorraV2/ como todo protótipo daqui. Rodar este script de novo traz as
# mudanças que a v2 tiver ganhado desde a última importação.
#
# ESTRATÉGIA:
#   1. Copia só as pastas/arquivos de arte que o jogo carrega (a v2 tem ~97 MB, o jogo usa ~35),
#      mantendo o mesmo caminho relativo, para os caminhos do código continuarem valendo.
#   2. Gera prototipos/guerreiro-da-masmorra-v2/index.html a partir do index.html da v2:
#      - prefixa os caminhos de arte com ../../Sprites/GuerreiroDaMasmorraV2/;
#      - tira o AdSense (o site do GDD não é o site aprovado dos anúncios; sem ele o jogo cai
#        sozinho no anúncio simulado);
#      - tira a nuvem do Firebase (o login gravaria por cima da campanha real do jogador);
#      - troca a chave do save, para não misturar com outro protótipo no mesmo domínio.
#   Cada troca confere quantas vezes casou: se a v2 mudar o trecho, o script para com erro
#   em vez de gerar um protótipo quebrado em silêncio.
#
# Uso (com a v2 clonada em qualquer pasta):
#   py Sprites/GuerreiroDaMasmorraV2/_tools/importar.py <pasta do clone da v2>

import re
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
SPRITES = REPO / 'Sprites' / 'GuerreiroDaMasmorraV2'
PROTO = REPO / 'prototipos' / 'guerreiro-da-masmorra-v2'
PREFIX = '../../Sprites/GuerreiroDaMasmorraV2/'

# Tudo que o index.html da v2 carrega. Pastas entram inteiras (os nomes de arquivo são
# montados em tempo de execução, por cor e por animação); arquivos soltos entram um a um.
ARTE = [
    'Tiny Swords (Free Pack)/Units',
    'Tiny Swords (Free Pack)/Factions',
    'Tiny Swords (Free Pack)/UI Elements',
    'Tiny Swords (Free Pack)/Particle FX',
    'Tiny Swords (Free Pack)/Buildings',
    'Tiny Swords (Free Pack)/Terrain',
    'assets/THE PACK/Monsters/KING SLIME',
    'assets/THE PACK/Monsters/Tree',
    'assets/Tiny Swords (Enemy Pack)/Enemy Pack',
    'assets/Tiny Swords/Tiny Swords (Update 010)/Factions/Knights/Troops/Dead/Dead.png',
    'assets/Minotaur - Sprite Sheet.png',
    'assets/new-hero/atack-8-directions.png',
    'assets/new-hero/dodge-8-directions.png',
    'assets/new-hero/idle-8-directions.png',
    'assets/new-hero/idle-facing-camera.png',
    'assets/new-hero/jump-8-directions.png',
    'assets/new-hero/parry-8-directions.png',
    'assets/new-hero/walk-8-directions.png',
    'assets/biomas',
    'assets/chests',
    'assets/Texture/TX Plant.png',
    'assets/Texture/TX Props.png',
    'assets/mini-map/world-bg.png',
    'assets/mini-map/Forest Tiles + Animations/Animaed Grey Indicator-Sheet.png',
    'assets/mini-map/Tiles and Animations/Red Map Indicator-Sheet.png',
    'assets/mini-map/Tiles and Animations/Green Map Indicator-Sheet.png',
    'assets/Shields1.png',
    'assets/Shields2.png',
    'assets/Shields3.png',
    'assets/Shields4.png',
    'assets/soul.png',
    'assets/potion-heal.png',
    'assets/potion-adrenaline.png',
    'assets/icons/icon-16.png',
    'assets/icons/icon-32.png',
    'assets/icons/icon-180.png',
    'assets/audio',
    'assets/backgoundvideo.mp4',
]
# Só mídia que o navegador usa: fica de fora .DS_Store, .aseprite, .psd e afins.
MIDIA = {'.png', '.gif', '.jpg', '.mp3', '.mp4'}


def copiar_arte(v2: Path):
    for f in SPRITES.iterdir():                      # reimportação limpa (mantém só o _tools/)
        if f.name != '_tools':
            shutil.rmtree(f) if f.is_dir() else f.unlink()
    total = 0
    for rel in ARTE:
        src = v2 / rel
        if not src.exists():
            sys.exit(f'Faltou na v2: {rel}')
        arquivos = [src] if src.is_file() else [p for p in src.rglob('*') if p.is_file()]
        for p in arquivos:
            if p.suffix.lower() not in MIDIA or '__MACOSX' in p.parts:
                continue
            dst = SPRITES / p.relative_to(v2)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dst)
            total += p.stat().st_size
    print(f'Arte copiada: {total / 1e6:.1f} MB em {SPRITES.relative_to(REPO)}')


def trocar(html: str, antigo, novo, vezes: int, rotulo: str, regex=False) -> str:
    n = len(re.findall(antigo, html, re.S)) if regex else html.count(antigo)
    if n != vezes:
        sys.exit(f'"{rotulo}": esperava {vezes} ocorrência(s), achei {n}. A v2 mudou esse trecho?')
    return re.sub(antigo, novo, html, flags=re.S) if regex else html.replace(antigo, novo)


def gerar_html(v2: Path):
    html = (v2 / 'index.html').read_text(encoding='utf-8')

    # anúncios do AdSense: a meta de conta e o script (o jogo cai no anúncio simulado sozinho)
    html = trocar(html, r'<meta name="google-adsense-account"[^>]*>\n', '', 1, 'meta do AdSense', regex=True)
    html = trocar(html, r'<!-- AdSense H5 Games Ads.*?</script>\n', '', 1, 'script do AdSense', regex=True)
    # PWA: o manifest e os ícones grandes não vêm junto
    html = trocar(html, '<link rel="manifest" href="manifest.json">\n', '', 1, 'manifest')
    # nuvem: o módulo do Firebase sai inteiro e os botões de login/salvar somem
    html = trocar(html, r'<script type="module">.*?</script>\n', '', 1, 'módulo do Firebase', regex=True)
    html = trocar(html, '</style>',
                  '  /* protótipo do site dos GDDs: sem nuvem (ver prototipos/guerreiro-da-masmorra-v2/README.md) */\n'
                  '  #cloudStatus,#cloudLogin,#cloudSave{display:none!important}\n</style>', 1, 'fim do CSS')
    # save próprio: o site serve vários protótipos no mesmo domínio
    html = trocar(html, "const SAVE_KEY = 'rpg-guerreiro-v3';",
                  "const SAVE_KEY = 'guerreiro-v2-save-v1';", 1, 'chave do save')
    # caminhos de arte: todo texto que começa um caminho (logo depois de aspas ou parêntese)
    padrao = r"""(?<=['"(])(?=Tiny Swords \(Free Pack\)/|assets/)"""
    n = len(re.findall(padrao, html))
    if n < 40:                                       # a v2 tinha ~60 quando este script foi escrito
        sys.exit(f'Só {n} caminhos de arte encontrados; a v2 mudou a forma de carregar a arte?')
    html = re.sub(padrao, PREFIX, html)

    PROTO.mkdir(parents=True, exist_ok=True)
    (PROTO / 'index.html').write_text(html, encoding='utf-8', newline='\n')
    print(f'Protótipo gerado: {(PROTO / "index.html").relative_to(REPO)} ({n} caminhos prefixados)')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Uso: py Sprites/GuerreiroDaMasmorraV2/_tools/importar.py <pasta do clone da v2>')
    v2 = Path(sys.argv[1]).resolve()
    if not (v2 / 'index.html').exists():
        sys.exit(f'{v2} não parece o clone da guerreiro-da-masmorra-v2 (falta index.html).')
    SPRITES.mkdir(parents=True, exist_ok=True)
    copiar_arte(v2)
    gerar_html(v2)
