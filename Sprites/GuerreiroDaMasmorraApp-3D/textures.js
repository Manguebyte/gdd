// Texturas 3D do Guerreiro da Masmorra 3D (app), por bioma: de que pasta (dentro de Sprites/) vem
// cada tipo de tile e quais variações o jogo usa. Índice repetido = sai mais vezes.
// Os 4 biomas ao ar livre são os mesmos do V2 e reaproveitam ../GuerreiroDaMasmorraV2-3D/ (mesma
// escolha do textures.js de lá). Os 3 interiores têm parede própria (esta pasta) e reaproveitam
// estradas do V2 3D como chão. Ficaram de fora as paredes que destoam: musgo verde demais e teias
// claras (Cripta) e as tochas com halo laranja pintado na parede (a luz vem da PointLight do jogo).
const V2 = 'GuerreiroDaMasmorraV2-3D/', APP = 'GuerreiroDaMasmorraApp-3D/';
window.APP_3D_TEX = {
  castelo: { road: { dir: V2 + 'castelo', ids: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
             verge: { dir: V2 + 'castelo', ids: [0, 1, 2, 0, 1, 2, 4, 5, 6, 7, 12, 13, 14, 15, 9] } },
  floresta: { road: { dir: V2 + 'floresta', ids: [0, 2, 0, 2, 8, 9, 10] },
              verge: { dir: V2 + 'floresta', ids: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 4, 6] } },
  cemiterio: { road: { dir: V2 + 'cemiterio', ids: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10] },
               verge: { dir: V2 + 'cemiterio', ids: [0, 3, 4, 5, 6, 7, 10, 11, 12, 14, 15, 0, 3] } },
  ruinas: { road: { dir: V2 + 'ruinas', ids: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 8] },
            verge: { dir: V2 + 'ruinas', ids: [0, 1, 12, 13, 14, 15, 0, 1, 8, 9, 10, 11, 4, 5, 6, 7] } },
  cripta: { road: { dir: V2 + 'ruinas', ids: [0, 1, 2, 3] },
            wall: { dir: APP + 'cripta', ids: [0, 1, 2, 0, 1, 2, 4, 6, 8, 9], torch: [12] } },
  igreja: { road: { dir: V2 + 'cemiterio', ids: [0, 1, 2, 3] },
            wall: { dir: APP + 'igreja', ids: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10], torch: [12] } },
  salao: { road: { dir: V2 + 'castelo', ids: [12, 13, 14, 15] },
           wall: { dir: APP + 'salao', ids: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], torch: [13] } },
};
