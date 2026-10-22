# Importa o jogo do app Android do Guerreiro da Masmorra (o APK) como protótipo deste repo.
#
# POR QUE: o app publicado (com.guerreirodamasmorra.app, Capacitor) tem a versão do jogo ANTERIOR
# à mecânica de dados do V2: combate com Fúria, a reação de abaixar, a barra de toques, a árvore
# de habilidades, missões diárias, cenários de interior e monstros que o V2 não tem. Em vez de
# reescrever o jogo, o protótipo é o próprio index.html de dentro do APK, com a arte morando em
# Sprites/GuerreiroDaMasmorraApp/ como todo protótipo daqui.
#
# ESTRATÉGIA (a mesma do importar.py do V2, lendo direto do APK, que é um zip):
#   1. Copia a mídia de assets/public/ (png, jpg, mp3, mp4) mantendo o caminho relativo, para os
#      caminhos do código continuarem valendo. Ficam de fora .aseprite, .psd, .import e afins.
#      A arte não é dividida com a pasta do V2: o áudio mudou quase todo, e o jogo testa
#      caminhos com f.startsWith('assets/'), que exige um prefixo único.
#   2. Gera prototipos/guerreiro-da-masmorra-app/index.html a partir do index.html do APK:
#      - prefixa os caminhos de arte com ../../Sprites/GuerreiroDaMasmorraApp/;
#      - tira o AdSense (sem ele o jogo cai sozinho no anúncio simulado);
#      - tira a nuvem do Firebase (o login gravaria por cima da campanha real do jogador);
#      - troca a chave do save, para não misturar com os outros protótipos no mesmo domínio.
#   O AdMob e o login nativo do app só rodam com window.Capacitor, então no navegador ficam
#   desligados sozinhos. Cada troca confere quantas vezes casou: se o app mudar o trecho, o
#   script para com erro em vez de gerar um protótipo quebrado em silêncio.
#
# Uso: py Sprites/GuerreiroDaMasmorraApp/_tools/importar_apk.py <caminho do .apk>

import re
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
SPRITES = REPO / 'Sprites' / 'GuerreiroDaMasmorraApp'
PROTO = REPO / 'prototipos' / 'guerreiro-da-masmorra-app'
PREFIX = '../../Sprites/GuerreiroDaMasmorraApp/'
PUBLIC = 'assets/public/'
MIDIA = {'.png', '.gif', '.jpg', '.jpeg', '.mp3', '.mp4'}


def copiar_arte(apk: zipfile.ZipFile):
    for f in sorted(SPRITES.rglob('*'), reverse=True):   # reimportação limpa (mantém só o _tools/)
        if '_tools' in f.relative_to(SPRITES).parts:
            continue
        f.rmdir() if f.is_dir() else f.unlink()
    total = 0
    for info in apk.infolist():
        nome = info.filename
        if info.is_dir() or not nome.startswith(PUBLIC) or Path(nome).suffix.lower() not in MIDIA:
            continue
        rel = nome[len(PUBLIC):]
        if '__MACOSX' in rel:
            continue
        dst = SPRITES / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(apk.read(info))
        total += info.file_size
    print(f'Arte copiada: {total / 1e6:.1f} MB em {SPRITES.relative_to(REPO)}')


def trocar(html: str, antigo, novo, vezes: int, rotulo: str, regex=False) -> str:
    n = len(re.findall(antigo, html, re.S)) if regex else html.count(antigo)
    if n != vezes:
        sys.exit(f'"{rotulo}": esperava {vezes} ocorrência(s), achei {n}. O app mudou esse trecho?')
    return re.sub(antigo, novo, html, flags=re.S) if regex else html.replace(antigo, novo)


def gerar_html(apk: zipfile.ZipFile):
    html = apk.read(PUBLIC + 'index.html').decode('utf-8')

    # anúncios do AdSense: a meta de conta e o comentário + script do <head>
    html = trocar(html, r'<meta name="google-adsense-account"[^>]*>\n', '', 1, 'meta do AdSense', regex=True)
    html = trocar(html, r'<!-- AdSense H5 Games Ads \(Ad Placement API\) — versão web\..*?</script>\n', '', 1,
                  'script do AdSense', regex=True)
    # PWA: o manifest não vem junto
    html = trocar(html, '<link rel="manifest" href="manifest.json">\n', '', 1, 'manifest')
    # nuvem: o módulo do Firebase sai inteiro e os botões de login/salvar somem
    html = trocar(html, r'<script type="module">.*?</script>\n', '', 1, 'módulo do Firebase', regex=True)
    html = trocar(html, '</style>',
                  '  /* protótipo do site dos GDDs: sem nuvem (ver prototipos/guerreiro-da-masmorra-app/README.md) */\n'
                  '  #cloudStatus,#cloudLogin,#cloudSave{display:none!important}\n</style>', 1, 'fim do CSS')
    # save próprio: o site serve vários protótipos no mesmo domínio
    html = trocar(html, "const SAVE_KEY = 'rpg-guerreiro-v3';",
                  "const SAVE_KEY = 'guerreiro-app-save-v1';", 1, 'chave do save')
    # caminhos de arte: todo texto que começa um caminho (logo depois de aspas, crase ou parêntese)
    padrao = r"""(?<=['"(`])(?=Tiny Swords \(Free Pack\)/|assets/)"""
    n = len(re.findall(padrao, html))
    if n < 60:                                       # o app tinha ~116 quando este script foi escrito
        sys.exit(f'Só {n} caminhos de arte encontrados; o app mudou a forma de carregar a arte?')
    html = re.sub(padrao, PREFIX, html)

    PROTO.mkdir(parents=True, exist_ok=True)
    (PROTO / 'index.html').write_text(html, encoding='utf-8', newline='\n')
    print(f'Protótipo gerado: {(PROTO / "index.html").relative_to(REPO)} ({n} caminhos prefixados)')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Uso: py Sprites/GuerreiroDaMasmorraApp/_tools/importar_apk.py <caminho do .apk>')
    caminho = Path(sys.argv[1]).resolve()
    with zipfile.ZipFile(caminho) as apk:
        if PUBLIC + 'index.html' not in apk.namelist():
            sys.exit(f'{caminho} não tem {PUBLIC}index.html: é o APK completo (não o "arquivado")?')
        SPRITES.mkdir(parents=True, exist_ok=True)
        copiar_arte(apk)
        gerar_html(apk)
