# Deriva Pressed/Disabled a partir do Normal (mesmo tamanho e borda 9-slice).
import json,hashlib,os
from PIL import Image
import numpy as np
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Sprites/StarExpeditionCo
MAN=os.path.join(REPO,"spritecook-assets.json"); man=json.load(open(MAN,encoding="utf-8"))
ids={a["label"]:a["asset_id"] for a in man["assets"]}
OUT=np.array([14,16,24])
for kind in ("Primary","Secondary"):
    src=f"SPR_UI_Button_{kind}_Normal"; a=np.asarray(Image.open(os.path.join(REPO,"UI",src+".png")).convert("RGBA")).astype(float)
    op=a[...,3]>0; outline=(np.abs(a[...,:3]-OUT).sum(-1)<40)
    # Pressed: 1px mais baixo, face 20% mais escura
    p=a.copy(); m=op&~outline; p[m,:3]*=0.8
    p=np.roll(p,1,axis=0); p[0]=0
    # Disabled: dessatura e aproxima de Slate 500 (#4A5578)
    d=a.copy(); lum=(d[...,:3]@[0.299,0.587,0.114])[...,None]
    d[m,:3]=(lum[m]*0.5+np.array([74,85,120])*0.5)
    for st,arr in (("Pressed",p),("Disabled",d)):
        n=f"SPR_UI_Button_{kind}_{st}"; path=os.path.join(REPO,"UI",n+".png")
        Image.fromarray(arr.clip(0,255).astype("uint8")).save(path)
        sha=hashlib.sha256(open(path,"rb").read()).hexdigest()[:12]
        man["assets"]=[x for x in man["assets"] if x["label"]!=n]
        man["assets"].append({"asset_id":ids[src],"sha12":sha,"label":n,"derived_from":src})
man["assets"].sort(key=lambda x:x["label"]); json.dump(man,open(MAN,"w",encoding="utf-8"),indent=2,ensure_ascii=False)
print("ok")
