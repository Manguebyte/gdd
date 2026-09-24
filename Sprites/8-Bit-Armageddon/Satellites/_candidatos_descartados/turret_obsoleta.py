# -*- coding: utf-8 -*-
# Desenha a Turret (emissor de energia): base 8 px + braço com cristal em 16 direções.
import math
from PIL import Image
K=(12,8,13,255); BR=(125,62,41,255); OR=(210,101,20,255); GO=(242,142,23,255); YE=(252,194,37,255); LT=(255,236,150,255); WH=(255,255,235,255)
T=(0,0,0,0)
# base: cúpula 8x6 vista em 3/4 (luz de cima à esquerda)
BASE=["..KKKK..",
      ".KYGGOK.",
      "KYGGOOBK",
      "KGOOOOBK",
      "KOOBBBBK",
      ".KKKKKK."]
cm={'K':K,'Y':YE,'G':GO,'O':OR,'B':BR,'.':T}
def base_img():
    im=Image.new('RGBA',(32,32),T)
    for j,r in enumerate(BASE):
        for i,c in enumerate(r): im.putpixel((12+i,13+j),cm[c])   # centro da cúpula em (16,16)
    return im
def arm_img(ang):
    im=Image.new('RGBA',(32,32),T); px=im.load()
    # direção na TELA: o plano lógico é achatado em y (isométrico falso, Seção 6.1)
    dx,dy=math.cos(ang),-math.sin(ang)*0.6
    n=math.hypot(dx,dy); dx,dy=dx/n,dy/n
    ox,oy=16,15            # o braço sai do topo da cúpula
    body={}
    L=5
    for s in range(0,L*4+1):
        t=s/4
        x=ox+dx*t; y=oy+dy*t
        body[(round(x),round(y))]=GO if t<2 else OR
        # 2 px de espessura: segundo pixel "abaixo" da linha (sombra)
        q=(round(x-dy*0.9),round(y+dx*0.9))
        if q not in body: body[q]=BR
    cx,cy=round(ox+dx*(L+1.5)),round(oy+dy*(L+1.5))
    body.update({(cx,cy):WH,(cx-1,cy):LT,(cx+1,cy):YE,(cx,cy-1):LT,(cx,cy+1):YE})
    for (x,y) in list(body):
        for a,b in((1,0),(-1,0),(0,1),(0,-1)):
            p=(x+a,y+b)
            if p not in body: px[p]=K
    for p,c in body.items(): px[p]=c
    return im
base_img().save('turret_base.png')
arms=Image.new('RGBA',(32*16,32),T)
for k in range(16):
    arms.alpha_composite(arm_img(2*math.pi*k/16),(32*k,0))   # k=0 aponta para a direita (leste), sentido anti-horário
arms.save('turret_arm16.png')
# preview: base + braço em cada direção, e 4 turrets sobre o planeta
bg=(20,18,65,255)
prev=Image.new('RGBA',(32*16,32),bg)
b=base_img()
for k in range(16):
    cell=Image.new('RGBA',(32,32),T); a=arms.crop((32*k,0,32*k+32,32))
    # braço atrás da base quando aponta para cima (y<0), na frente quando aponta para baixo
    ang=2*math.pi*k/16
    if math.sin(ang)>0: cell.alpha_composite(a); cell.alpha_composite(b)
    else: cell.alpha_composite(b); cell.alpha_composite(a)
    prev.alpha_composite(cell,(32*k,0))
prev.resize((32*16*4,128),Image.NEAREST).save('turret_preview_4x.png')
