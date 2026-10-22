// Texturas 3D do Guerreiro da Masmorra 3D, por bioma do V2: quais variações de estrada e de margem
// o jogo usa (índice do arquivo road-NN.png / verge-NN.png). Índice repetido = sai mais vezes.
// Ficaram de fora as que destoam: lajes lisas de outro estilo (Castelo), raízes contornadas e
// bordas de grama (Floresta), pedras douradas (Cemitério), quadrados lisos e laranja chapado
// (Ruínas) e as margens quase pretas. Na Floresta a margem é quase só grama: samambaia e moita
// alternando com grama clara viravam um xadrez; o mesmo vale para a estrada da Floresta (só os
// tons médios) e a das Ruínas (quase só a pedra cinza). Bioma sem entrada usa o Castelo.
window.V2_3D_TEX = {
  castelo: { road: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], verge: [0, 1, 2, 0, 1, 2, 4, 5, 6, 7, 12, 13, 14, 15, 9] },
  floresta: { road: [0, 2, 0, 2, 8, 9, 10], verge: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 4, 6] },
  cemiterio: { road: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10], verge: [0, 3, 4, 5, 6, 7, 10, 11, 12, 14, 15, 0, 3] },
  ruinas: { road: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 8], verge: [0, 1, 12, 13, 14, 15, 0, 1, 8, 9, 10, 11, 4, 5, 6, 7] },
};
