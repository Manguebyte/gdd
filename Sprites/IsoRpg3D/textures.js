// Texturas 3D do Iso RPG 3D, por bioma: quais variações de piso e de parede o jogo usa (índice do
// arquivo floor-NN.png / wall-NN.png) e qual bloco de parede é a tocha. Índice repetido = sai mais vezes.
// Ficaram de fora as que destoam: musgo verde demais (Orcs), raízes claras e piso preto (Floresta),
// tábuas de outro tom (Pântano), neve branca demais e paredes com moldura (Gelo), lava acesa demais
// (Vulcão), xadrez com borda (Academia), tochas com halo pintado ou chama branca.
// Bioma sem entrada usa os Orcs.
window.IR3D_TEX = {
  orcs: { floor: [0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15], wall: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], torch: [13] },
  forest: { floor: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15], wall: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11], torch: [12] },
  swamp: { floor: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 8, 10], wall: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 9, 10], torch: [12] },
  ice: { floor: [0, 1, 2, 3, 0, 1, 2, 3, 12, 13, 14, 15, 4, 5, 7, 8, 9], wall: [1, 2, 4, 5, 6, 7, 8, 9, 10], torch: [13] },
  volcano: { floor: [0, 1, 2, 3, 0, 1, 2, 3, 4, 6, 8, 9, 10, 13, 15], wall: [0, 1, 2, 3, 0, 1, 2, 3, 5, 7, 8, 9], torch: [13] },
  academy: { floor: [0, 1, 2, 3, 0, 1, 2, 3, 12, 13, 14, 15, 4, 6], wall: [0, 0, 6, 8, 9, 14, 1, 2, 4, 13, 5], torch: [7] },
};
