"""Registra vários assets de uma vez no pipe.py.

Uso: batch.py <arquivo.txt> <exp>
Cada linha: name group kind W H asset_id sig [chave=valor...]
(sig e exp vêm da sprite_url devolvida pelo SpriteCook; folhas de animação usam a URL raw.)
"""
import sys,subprocess,os
HERE=os.path.dirname(os.path.abspath(__file__))
f=sys.argv[1]; exp=sys.argv[2]
for ln in open(f):
    p=ln.split()
    if not p or p[0].startswith("#"): continue
    n,g,k,W,H,aid,sig=p[:7]
    url=f"https://api.spritecook.ai/v1/assets/{aid}/signed-content/{"raw" if k=="sheet" else "pixel"}?sig={sig}&exp={exp}"
    subprocess.run([sys.executable,os.path.join(HERE,"pipe.py"),"add",n,g,k,W,H,aid,url]+p[7:],check=True)
