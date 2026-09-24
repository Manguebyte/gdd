# -*- coding: utf-8 -*-
# Satellite em tons de cinza: 3 opções, 2 frames cada (luz laranja acesa/apagada).
from PIL import Image
cm={'.':(0,0,0,0),'K':(12,10,14,255),
    'W':(240,240,236,255),'L':(196,198,200,255),'M':(146,148,152,255),'D':(96,98,104,255),'E':(58,60,66,255),
    'o':(255,150,40,255),'x':(120,70,30,255)}
# o = luz laranja (acesa); vira x no frame apagado
OPTS={
 'A': ["....K.......",
       "...KoK......",
       "KKKKKLKKKKKK",
       "KDMDKWLKDMDK",
       "KMDMKLMKMDMK",
       "KDMDKMDKDMDK",
       "KKKKKKKKKKKK",
       "............"],
 'B': ["......K.......",
       ".....KoK......",
       "..K...K...K...",
       "...K.KKK.K....",
       "....KWLMK.....",
       "....KLMDK.....",
       "....KMDEK.....",
       "...K.KKK.K....",
       "..K.......K..."],
 'C': ["KKKKK....KKKKK",
       "KDLDK....KDLDK",
       "KMDMKKKKKKMDMK",
       "KDLDKWLMKKDLDK",
       "KMDMKLMDoKMDMK",
       "KDLDKMDEKKDLDK",
       "KMDMKKKKKKMDMK",
       "KKKKK....KKKKK"],
}
def render(art,on):
    h=len(art); w=max(len(r) for r in art)
    im=Image.new('RGBA',(32,32),(0,0,0,0)); ox=(32-w)//2; oy=(32-h)//2
    for j,row in enumerate(art):
        for i,c in enumerate(row):
            if c=='o' and not on: c='x'
            if cm[c][3]: im.putpixel((ox+i,oy+j),cm[c])
    return im
bg=(20,18,65,255)
g=Image.open('grunt_sheet.png').crop((0,0,32,32))
pv=Image.new('RGBA',(32*7,32),bg)
x=0
for k,art in OPTS.items():
    sh=Image.new('RGBA',(64,32)); sh.alpha_composite(render(art,True)); sh.alpha_composite(render(art,False),(32,0)); sh.save(f'satgray_{k}.png')
    pv.alpha_composite(render(art,True),(x,0)); x+=32
    pv.alpha_composite(g,(x,0)) if k!='C' else None; x+=32 if k!='C' else 0
pv.resize((pv.width*6,192),Image.NEAREST).save('satgray_opts_6x.png')
