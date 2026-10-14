"""Desenha a barra de velocidade da HUD do Rally 2D.

POR QUE: a barra usa uma `Image` com `Image Type = Filled` (RallySurvive.md,
Fase 4 §4.4). O preenchimento precisa encaixar exatamente dentro da moldura e
ter o tamanho justo do trilho, senão o `fillAmount` não bate com o que se vê.
Arte gerada por IA não garante esse encaixe, então a barra é desenhada aqui,
no estilo vetorial flat da franquia (cores chapadas, contorno marrom, brilho
mínimo, sombra suave; referência: `sheet_v1.png`).

ESTRATÉGIA: tudo é desenhado em 4x e reduzido com filtro LANCZOS, o que dá
bordas suaves como as de um vetor. Saem três arquivos em `ui/`:
- `speedbar_frame.png`: moldura com trilho escuro e sombra (fica atrás);
- `speedbar_fill.png`: preenchimento em degradê verde -> amarelo -> laranja ->
  vermelho, recortado justo no trilho (o Filled corta da esquerda pra direita,
  então a cor do fim da barra só aparece em velocidade alta);
- `speedbar_fill_white.png`: o mesmo formato em branco, para tingir pela cor
  da `Image` em código, se preferir uma cor só.

Uso (na pasta Sprites/Rally2D):
    python _tools/speed_bar.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SS = 4  # fator de supersampling

# Tamanho final (px) da moldura e posição do preenchimento dentro dela.
FRAME_W, FRAME_H = 640, 112
OUTER = (8, 8, 632, 96)       # contorno marrom
TRACK = (16, 16, 624, 88)     # trilho escuro
FILL = (20, 20, 620, 84)      # área do preenchimento (600 x 64)

OUTLINE = (91, 52, 24)        # marrom das bordas da folha de referência
TRACK_COLOR = (46, 32, 25)
SHADOW = (40, 20, 10, 70)
GRADIENT = [                  # (posição 0-1, cor)
    (0.00, (95, 179, 46)),    # verde das árvores
    (0.45, (254, 194, 26)),   # amarelo da areia
    (0.75, (252, 138, 8)),    # laranja
    (1.00, (226, 51, 43)),    # vermelho das barreiras
]


def scaled(box, dx=0, dy=0):
    """Converte um retângulo em px finais para a tela em 4x."""
    x0, y0, x1, y1 = box
    return ((x0 + dx) * SS, (y0 + dy) * SS, (x1 + dx) * SS, (y1 + dy) * SS)


def capsule(size, box, color):
    """Desenha uma cápsula (retângulo com pontas redondas) numa camada nova."""
    layer = Image.new("RGBA", size)
    x0, y0, x1, y1 = box
    ImageDraw.Draw(layer).rounded_rectangle(box, radius=(y1 - y0) // 2, fill=color)
    return layer


def gradient_color(t):
    """Cor do degradê na posição t (0 = esquerda, 1 = direita)."""
    for (t0, c0), (t1, c1) in zip(GRADIENT, GRADIENT[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(round(a + (b - a) * k) for a, b in zip(c0, c1))
    return GRADIENT[-1][1]


def frame():
    size = (FRAME_W * SS, FRAME_H * SS)
    out = Image.new("RGBA", size)
    shadow = capsule(size, scaled(OUTER, dy=6), SHADOW).filter(ImageFilter.GaussianBlur(6 * SS))
    out.alpha_composite(shadow)
    out.alpha_composite(capsule(size, scaled(OUTER), OUTLINE + (255,)))
    out.alpha_composite(capsule(size, scaled(TRACK), TRACK_COLOR + (255,)))
    return out.resize((FRAME_W, FRAME_H), Image.LANCZOS)


def fill(white=False):
    """Preenchimento do tamanho justo do trilho, com o brilho no topo."""
    w, h = (FILL[2] - FILL[0]) * SS, (FILL[3] - FILL[1]) * SS
    color = Image.new("RGBA", (w, h))
    px = color.load()
    for x in range(w):
        c = (255, 255, 255) if white else gradient_color(x / (w - 1))
        for y in range(h):
            px[x, y] = c + (255,)
    mask = capsule((w, h), (0, 0, w, h), (255, 255, 255, 255)).getchannel("A")
    out = Image.new("RGBA", (w, h))
    out.paste(color, mask=mask)
    # Brilho chapado no terço de cima, como o brilho mínimo da arte flat.
    shine = capsule((w, h), (10 * SS, 6 * SS, w - 10 * SS, 22 * SS), (255, 255, 255, 70))
    if not white:
        out.alpha_composite(shine)
    return out.resize((w // SS, h // SS), Image.LANCZOS)


def preview(frame_img, fill_img, amount, background=(252, 191, 18, 255)):
    """Monta a barra como o Unity mostraria com `fillAmount = amount`."""
    canvas = Image.new("RGBA", (FRAME_W + 40, FRAME_H + 40), background)
    canvas.alpha_composite(frame_img, (20, 20))
    cut = fill_img.crop((0, 0, round(fill_img.width * amount), fill_img.height))
    canvas.alpha_composite(cut, (20 + FILL[0], 20 + FILL[1]))
    return canvas


def main():
    (ROOT / "ui").mkdir(exist_ok=True)
    (ROOT / "_preview").mkdir(exist_ok=True)
    frame_img, fill_img = frame(), fill()
    frame_img.save(ROOT / "ui/speedbar_frame.png")
    fill_img.save(ROOT / "ui/speedbar_fill.png")
    fill(white=True).save(ROOT / "ui/speedbar_fill_white.png")
    rows = [preview(frame_img, fill_img, a) for a in (0.15, 0.5, 0.8, 1.0)]
    sheet = Image.new("RGBA", (rows[0].width, rows[0].height * len(rows)))
    for i, row in enumerate(rows):
        sheet.alpha_composite(row, (0, i * row.height))
    sheet.save(ROOT / "_preview/speedbar.png")
    print("ui/speedbar_frame.png", frame_img.size, "| ui/speedbar_fill.png", fill_img.size,
          "| preenchimento em", FILL[:2], "dentro da moldura")


if __name__ == "__main__":
    main()
