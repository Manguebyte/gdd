# -*- coding: utf-8 -*-
# Grunt: limpa os candidatos 63 e 28, troca azul/verde-água por magenta e cinza por lavanda,
# reduz para uma paleta compartilhada e gera 4 frames de luzes girando na borda.
import colorsys
from PIL import Image
K=(4,2,8)
LIGHT=(255,120,220); LIGHT_DIM=(190,80,170)
def fix(c):
    r,g,b=c; h,l,s=colorsys.rgb_to_hls(r/255,g/255,b/255)
    if max(c)<20: return K
    if 0.30<h<0.62 and s>0.15:                 # verde-água/azul -> magenta
        return tuple(int(v*255) for v in colorsys.hls_to_rgb(0.88,min(.75,l+.1),.75))
    if s<0.18:                                 # cinza -> lavanda
        return tuple(int(v*255) for v in colorsys.hls_to_rgb(0.72,l,.35))
    return c
srcs=[Image.open(f'grunt_c{i}.png').convert('RGBA') for i in (63,28)]
fixed=[]
for f in srcs:
    g=f.copy(); p=g.load()
    for y in range(16):
        for x in range(16):
            if p[x,y][3]: p[x,y]=fix(p[x,y][:3])+(255,)
    fixed.append(g)
# paleta compartilhada: quantiza as duas juntas (8 cores + preto)
strip=Image.new('RGB',(32,16),K)
for n,g in enumerate(fixed):
    for y in range(16):
        for x in range(16):
            if g.getpixel((x,y))[3]: strip.putpixel((16*n+x,y),g.getpixel((x,y))[:3])
q=strip.quantize(9,method=Image.Quantize.MEDIANCUT).convert('RGB')
out=[]
for n,g in enumerate(fixed):
    p=g.load()
    for y in range(16):
        for x in range(16):
            if p[x,y][3]:
                c=q.getpixel((16*n+x,y)); p[x,y]=(K if max(c)<30 else c)+(255,)
    out.append(g)
# 4 frames: 3 luzes na faixa da borda (linha 8), andando 1 px por frame, período 4
RIM_Y=8
sheet=Image.new('RGBA',(32*4,32*2),(0,0,0,0))
for v,g in enumerate(out):
    xs=[x for x in range(16) if g.getpixel((x,RIM_Y))[3] and g.getpixel((x,RIM_Y))[:3]!=K]
    for fr in range(4):
        f=g.copy(); p=f.load()
        for x in xs[1:-1]:
            k=(x-xs[0]-fr)%4
            if k==0: p[x,RIM_Y]=LIGHT+(255,)
            elif k==1: p[x,RIM_Y]=LIGHT_DIM+(255,)
        sheet.alpha_composite(f,(32*fr+8,32*v+8))       # desenho 16x16 centralizado na célula 32x32
sheet.save('grunt_sheet.png')
bg=(20,18,65,255); prev=Image.new('RGBA',sheet.size,bg); prev.alpha_composite(sheet)
prev.resize((sheet.width*6,sheet.height*6),Image.NEAREST).save('grunt_sheet_6x.png')
fr=[Image.alpha_composite(Image.new('RGBA',(64,32),bg),Image.new('RGBA',(64,32))) for _ in range(4)]
g=[]
for k in range(4):
    c=Image.new('RGBA',(64,32),bg); c.alpha_composite(sheet.crop((32*k,0,32*k+32,32)),(0,0)); c.alpha_composite(sheet.crop((32*k,32,32*k+32,64)),(32,0))
    g.append(c.resize((384,192),Image.NEAREST).convert('P',palette=Image.ADAPTIVE))
g[0].save('grunt_anim.gif',save_all=True,append_images=g[1:],duration=150,loop=0)
