# -*- coding: utf-8 -*-
# Satellite: corpo dourado redondo + 2 painéis solares na horizontal, 12x8 px, orientação fixa.
# 2 frames: luz da antena acesa/apagada. Desenho centralizado numa célula de 32x32.
from PIL import Image
cm={'.':(0,0,0,0),'K':(12,8,13,255),
    'W':(255,244,190,255),'Y':(252,194,37,255),'G':(242,142,23,255),'O':(210,101,20,255),'B':(125,62,41,255),
    'P':(178,84,24,255),'p':(232,122,30,255),'L':(255,90,70,255),'l':(125,62,41,255)}
# P = painel escuro, p = painel claro (reflexo), L = luz acesa, l = luz apagada
ART=["....KK......",
     ".....KLK....",
     "KKKKKYWGKKKK",
     "KppPKYGOKpPK",
     "KpPPKGOBKPPK",
     "KKKKKOBBKKKK",
     "....KKKK....",
     "............"]
def render(art,light):
    im=Image.new('RGBA',(32,32),(0,0,0,0))
    for j,row in enumerate(art):
        for i,c in enumerate(row):
            if c=='L' and not light: c='l'
            im.putpixel((10+i,12+j),cm[c])
    return im
sheet=Image.new('RGBA',(64,32),(0,0,0,0))
sheet.alpha_composite(render(ART,True),(0,0)); sheet.alpha_composite(render(ART,False),(32,0))
sheet.save('satellite_sheet.png'); render(ART,True).save('satellite_f1.png')
bg=(20,18,65,255); pv=Image.new('RGBA',(64,32),bg); pv.alpha_composite(sheet); pv.resize((512,256),Image.NEAREST).save('satellite_8x.png')
