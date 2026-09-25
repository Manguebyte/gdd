"""Pós-processamento da arte do SpriteCook para o catálogo do GDD §10.5.

Baixa cada asset, recorta pelo conteúdo, reduz com nearest neighbor (nunca amplia)
e salva com o nome final em Sprites/StarExpeditionCo/<grupo>/, atualizando
spritecook-assets.json (asset_id + sha12).

Uso:
  pipe.py add <name> <group> <kind> <W> <H> <asset_id> <url> [chave=valor...]
  pipe.py run            -> processa pendentes
  pipe.py sheet <group>  -> contact sheet para revisão (em tools/work/)

kinds: fit (ícones/sprites), frame (Equipment: moldura âmbar), rare (Rare Item: halo
violeta), cover (Planets/Store), bg (fundo empilhado com espelho vertical), bar
(barra 9-slice esticada; border=N), sheet (folha de animação; frames=N).
Opções: x8=N salva também uma cópia ampliada N× (ícone e feature da loja).

O registro de jobs e os downloads ficam em tools/work/ (fora do git: as URLs
assinadas do SpriteCook não devem ir para o repositório).
"""
import sys,os,json,hashlib,urllib.request
from PIL import Image,ImageDraw
import numpy as np
S=os.path.dirname(os.path.abspath(__file__))
REPO=os.path.dirname(S)  # Sprites/StarExpeditionCo
WORK=os.path.join(S,"work")
REG=os.path.join(WORK,"registry.json"); RAW=os.path.join(WORK,"raw"); os.makedirs(RAW,exist_ok=True)
MAN=os.path.join(REPO,"spritecook-assets.json")
AMBER=(242,163,58,255); OUT=(14,16,24,255)
def load(p,d):
    return json.load(open(p,encoding="utf-8")) if os.path.exists(p) else d
reg=load(REG,{})
def save(): json.dump(reg,open(REG,"w",encoding="utf-8"),indent=1)
def crop(im):
    bb=im.getbbox(); return im.crop(bb) if bb else im
def fit(im,W,H):
    im=crop(im); k=min(1,W/im.width,H/im.height)
    im=im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.NEAREST)
    c=Image.new("RGBA",(W,H),(0,0,0,0)); c.alpha_composite(im,((W-im.width)//2,(H-im.height)//2)); return c
def cover(im,W,H):
    k=max(W/im.width,H/im.height)
    im=im.resize((max(W,round(im.width*k)),max(H,round(im.height*k))),Image.NEAREST)
    x=(im.width-W)//2; y=(im.height-H)//2; return im.crop((x,y,x+W,y+H))
def process(name,e):
    raw=os.path.join(RAW,name+".png")
    if not os.path.exists(raw): urllib.request.urlretrieve(e["url"],raw)
    im=Image.open(raw).convert("RGBA"); W,H=e["w"],e["h"]; k=e["kind"]
    if k=="fit": out=fit(im,W,H)
    elif k=="frame":
        out=Image.new("RGBA",(W,H),(0,0,0,0)); out.alpha_composite(fit(im,W-4,H-4),(2,2))
        d=ImageDraw.Draw(out); d.rectangle((0,0,W-1,H-1),outline=AMBER)
    elif k=="rare":  # halo violeta de 1px em volta da silhueta (Rare Items)
        base=fit(im,W-2,H-2); out=Image.new("RGBA",(W,H),(0,0,0,0)); out.alpha_composite(base,(1,1))
        a=np.asarray(out)[:,:,3]>0; g=np.zeros_like(a)
        for dy,dx in((1,0),(-1,0),(0,1),(0,-1)): g|=np.roll(np.roll(a,dy,0),dx,1)
        g&=~a; arr=np.asarray(out).copy(); arr[g]=(176,124,255,255); out=Image.fromarray(arr)
    elif k=="cover": out=cover(im,W,H)
    elif k=="bg":  # largura W, altura H empilhando com espelho vertical (loop sem emenda)
        im=im.resize((W,round(im.height*W/im.width)),Image.NEAREST)
        out=Image.new("RGBA",(W,H)); y=0; flip=False
        while y<H:
            t=im.transpose(Image.FLIP_TOP_BOTTOM) if flip else im
            out.paste(t,(0,y)); y+=t.height; flip=not flip
        out=out.crop((0,0,W,H))
    elif k=="bar":  # 9-slice horizontal: altura H, pontas preservadas, meio esticado
        im=crop(im); im=im.resize((max(1,round(im.width*H/im.height)),H),Image.NEAREST)
        b=min(e.get("border",16),im.width//3); mid=im.crop((b,0,im.width-b,H)).resize((W-2*b,H),Image.NEAREST)
        out=Image.new("RGBA",(W,H)); out.paste(im.crop((0,0,b,H)),(0,0)); out.paste(mid,(b,0)); out.paste(im.crop((im.width-b,0,im.width,H)),(W-b,0))
    elif k=="sheet":  # spritesheet de animação: fatia em n quadros e remonta em W por quadro
        n=e["frames"]; fw=im.width//n; fr=[im.crop((i*fw,0,(i+1)*fw,im.height)) for i in range(n)]
        # bbox comum para não tremer
        bb=None
        for f in fr:
            b=f.getbbox()
            if b: bb=b if bb is None else (min(bb[0],b[0]),min(bb[1],b[1]),max(bb[2],b[2]),max(bb[3],b[3]))
        out=Image.new("RGBA",(W*n,H))
        for i,f in enumerate(fr):
            f=f.crop(bb); kk=min(W/f.width,H/f.height); f=f.resize((round(f.width*kk),round(f.height*kk)),Image.NEAREST)
            out.alpha_composite(f,(i*W+(W-f.width)//2,H-f.height))
    else: raise SystemExit("kind?"+k)
    path=os.path.join(REPO,e["group"],name+".png"); out.save(path)
    if e.get("x8"): out.resize((W*e["x8"],H*e["x8"]),Image.NEAREST).save(os.path.join(REPO,e["group"],name+f"_{W*e['x8']}x{H*e['x8']}.png"))
    sha=hashlib.sha256(open(path,"rb").read()).hexdigest()[:12]
    man=load(MAN,{"assets":[]}); man["assets"]=[a for a in man["assets"] if a.get("label")!=name]
    man["assets"].append({"asset_id":e["asset_id"],"sha12":sha,"label":name}); man["assets"].sort(key=lambda a:a["label"])
    json.dump(man,open(MAN,"w",encoding="utf-8"),indent=2,ensure_ascii=False)
    e["done"]=True; e["sha12"]=sha
cmd=sys.argv[1]
if cmd=="add":
    n,g,k,W,H,aid,url=sys.argv[2:9]; e={"group":g,"kind":k,"w":int(W),"h":int(H),"asset_id":aid,"url":url}
    for kv in sys.argv[9:]:
        a,b=kv.split("="); e[a]=int(b) if b.isdigit() else b
    reg[n]=e; save()
elif cmd=="run":
    for n,e in reg.items():
        if not e.get("done"):
            try: process(n,e); print("ok",n)
            except Exception as ex: print("FAIL",n,ex)
    save()
elif cmd=="sheet":
    g=sys.argv[2]; ns=[n for n,e in reg.items() if e["group"]==g and e.get("done")]
    C=int(sys.argv[3]) if len(sys.argv)>3 else 140; cols=max(1,min(len(ns),1100//C)); rows=(len(ns)+cols-1)//cols
    sh=Image.new("RGBA",(cols*C,rows*(C+12)),(27,32,48,255)); d=ImageDraw.Draw(sh)
    for i,n in enumerate(ns):
        im=Image.open(os.path.join(REPO,g,n+".png")).convert("RGBA"); kk=max(1,(C-6)//max(im.size))
        im=im.resize((im.width*kk,im.height*kk),Image.NEAREST)
        if max(im.size)>C: im.thumbnail((C-6,C-6),Image.NEAREST)
        x=(i%cols)*C; y=(i//cols)*(C+12); sh.alpha_composite(im,(x+(C-im.width)//2,y+12+(C-12-im.height)//2+6))
        d.text((x+2,y),n.replace("SPR_",""),fill=(255,210,122,255))
    p=os.path.join(WORK,f"sheet_{g}.png"); sh.save(p); print(p)
