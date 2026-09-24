# -*- coding: utf-8 -*-
# Gera o loop de rotação de um planeta 32x32 (ver ../PROMPTS.md).
# Uso: python planet_rotation.py <frames> <seed> <limiar_terra>
#   ex.: python planet_rotation.py 32 1 0.55   -> SPR_Planet_Terra_Classic_Rotate (v1)
# Saída na pasta atual: rotn_<frames>_<seed>.png (faixa de células 32x32), _preview.png e .gif.
# Para outro Planet Core/Skin, trocar as paletas OCEAN/LAND/CLOUD (sombra, meio, luz).
import math, sys
from PIL import Image
N=int(sys.argv[1]); SEED=int(sys.argv[2]); LANDQ=float(sys.argv[3]) if len(sys.argv)>3 else 0.58
TILT=math.radians(20)
OUT=(3,4,7)
OCEAN=[(44,102,186),(62,135,228),(74,148,219)]
LAND=[(78,156,60),(96,166,55),(121,212,52)]
CLOUD=[(123,188,164),(225,242,227),(225,242,227)]
def h(i,j,k,s):
    n=(i*374761393+j*668265263+k*2147483647+s*1274126177)&0xffffffff
    n=(n^(n>>13))*1274126177&0xffffffff
    return ((n^(n>>16))&0xffff)/65535
def vnoise(x,y,z,s):
    i,j,k=math.floor(x),math.floor(y),math.floor(z); fx,fy,fz=x-i,y-j,z-k
    sm=lambda t:t*t*(3-2*t); fx,fy,fz=sm(fx),sm(fy),sm(fz)
    v=0
    for a in (0,1):
      for b in (0,1):
        for c in (0,1):
          w=(fx if a else 1-fx)*(fy if b else 1-fy)*(fz if c else 1-fz)
          v+=w*h(i+a,j+b,k+c,s)
    return v
def fbm(p,s,f=1.6,o=4):
    t=0;amp=1;norm=0
    for q in range(o):
        t+=amp*vnoise(p[0]*f+10,p[1]*f+10,p[2]*f+10,s+q); norm+=amp; amp*=0.5; f*=2
    return t/norm
C=15.5; R=15.5
mask=[(x,y) for y in range(32) for x in range(32) if math.hypot(x-C,y-C)<=15.6]
def edge(x,y): return any(math.hypot(x+dx-C,y+dy-C)>15.6 for dx,dy in((1,0),(-1,0),(0,1),(0,-1)))
L=(-0.55,-0.6,0.58); l=math.sqrt(sum(v*v for v in L)); L=tuple(v/l for v in L)
frames=[]
for k in range(N):
  rot=2*math.pi*k/N
  f=Image.new('RGBA',(32,32),(0,0,0,0)); fp=f.load(); mat={}
  for x,y in mask:
    if edge(x,y): fp[x,y]=OUT+(255,); continue
    nx=(x-C)/R; ny=(y-C)/R; nz=math.sqrt(max(0,1-nx*nx-ny*ny))
    # coordenadas no corpo do planeta: desfaz inclinaÃ§Ã£o, depois gira no eixo polar
    y2=ny*math.cos(TILT)-nz*math.sin(TILT); z2=ny*math.sin(TILT)+nz*math.cos(TILT)
    xb=nx*math.cos(rot)+z2*math.sin(rot); zb=-nx*math.sin(rot)+z2*math.cos(rot)
    p=(xb,y2,zb)
    land=fbm(p,SEED,f=1.1,o=2)>LANDQ
    cloud=fbm((p[0]*1.2,p[1]*2.4,p[2]*1.2),SEED+50,f=1.3,o=2)>0.70
    d=nx*L[0]+ny*L[1]+nz*L[2]
    t=0 if d<0.15 else (1 if d<0.75 else 2)
    mat[(x,y)]=('C' if cloud else ('L' if land else 'O'),t)
  # limpeza: pixel cujo material não aparece em nenhum vizinho vira o material da maioria
  for _ in range(2):
    new={}
    for (x,y),(m,t) in mat.items():
      nb=[mat[(x+dx,y+dy)][0] for dx,dy in((1,0),(-1,0),(0,1),(0,-1)) if (x+dx,y+dy) in mat]
      if nb and m not in nb: m=max(set(nb),key=nb.count)
      new[(x,y)]=(m,t)
    mat=new
  for (x,y),(m,t) in mat.items():
    fp[x,y]={'C':CLOUD,'L':LAND,'O':OCEAN}[m][t]+(255,)
  frames.append(f)
sheet=Image.new('RGBA',(32*N,32),(0,0,0,0))
for i,f in enumerate(frames): sheet.alpha_composite(f,(32*i,0))
tag=f'{N}_{SEED}'
sheet.save(f'rotn_{tag}.png')
bg=(20,18,65,255)
prev=Image.new('RGBA',(32*N*4+8,136),bg); prev.alpha_composite(sheet.resize((32*N*4,128),Image.NEAREST),(4,4)); prev.save(f'rotn_{tag}_preview.png')
g=[Image.alpha_composite(Image.new('RGBA',(32,32),bg),f).resize((192,192),Image.NEAREST).convert('P',palette=Image.ADAPTIVE) for f in frames]
g[0].save(f'rotn_{tag}.gif',save_all=True,append_images=g[1:],duration=int(8000/N),loop=0)
print(tag)
