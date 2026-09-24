# -*- coding: utf-8 -*-
# Scout (estrela de 4 pontas girando, 16 px, 4 frames) e Swarmer (orbe 8 px, 2 frames).
# Paleta = a do Grunt. Cada desenho fica centralizado numa célula de 32x32.
import math
from PIL import Image
K=(4,2,8,255)
DARK=(81,53,113,255); MIDD=(123,94,164,255); MID=(154,124,202,255); LITE=(189,169,230,255); HI=(219,198,241,255)
MAG=(255,120,220,255); MAGD=(190,80,170,255)
LX,LY=-0.7071,-0.7071   # luz de cima à esquerda
def outline(px,cells):
    for (x,y) in list(cells):
        for a,b in((1,0),(-1,0),(0,1),(0,-1)):
            if (x+a,y+b) not in cells: px[x+a,y+b]=K
def star(rot):
    cells={}
    R,r=7.8,3.3
    pts=[]
    for k in range(8):
        ang=rot+k*math.pi/4
        rad=R if k%2==0 else r
        pts.append((rad*math.cos(ang),rad*math.sin(ang)))
    def inside(x,y):
        c=False
        for i in range(8):
            x1,y1=pts[i]; x2,y2=pts[(i+1)%8]
            if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1: c=not c
        return c
    for j in range(-8,8):
        for i in range(-8,8):
            x,y=i+0.5,j+0.5
            if not inside(x,y): continue
            d=math.hypot(x,y)
            if d<1.6: cells[(i,j)]=MAG; continue
            # bisel: cada ponta tem uma metade clara e uma escura (gira junto com a estrela)
            a=math.atan2(y,x)-rot; side=math.sin(4*a)
            light=(x*LX+y*LY)/max(d,0.01)
            t=light*0.8+(0.5 if side>0 else -0.5)
            c=HI if t>0.8 else LITE if t>0.2 else MID if t>-0.4 else MIDD
            cells[(i,j)]=c
    return cells
def orb(on):
    cells={}
    for j in range(-4,4):
        for i in range(-4,4):
            x,y=i+0.5,j+0.5; d=math.hypot(x,y)
            if d>3.6: continue
            if d<1.2: cells[(i,j)]=MAG if on else MAGD; continue
            t=(x*LX+y*LY)/max(d,0.01)
            cells[(i,j)]=LITE if t>0.4 else MID if t>-0.3 else DARK
    return cells
def put(sheet,cells,cx,cy):
    px=sheet.load(); sub={(cx+x,cy+y):c for (x,y),c in cells.items()}
    for p,c in sub.items(): px[p]=c
    outline(px,sub)
scout=Image.new('RGBA',(128,32),(0,0,0,0))
for k in range(4): put(scout,star(k*math.pi/8),32*k+16,16)
scout.save('scout_sheet.png')
sw=Image.new('RGBA',(64,32),(0,0,0,0))
for k,on in enumerate((True,False)): put(sw,orb(on),32*k+16,16)
sw.save('swarmer_sheet.png')
bg=(20,18,65,255)
pv=Image.new('RGBA',(192,32),bg); pv.alpha_composite(scout,(0,0)); pv.alpha_composite(sw,(128,0))
pv.resize((192*6,192),Image.NEAREST).save('small_enemies_6x.png')
print('ok')
