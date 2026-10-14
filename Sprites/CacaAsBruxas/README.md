# Caça às Bruxas — arte PixelLab

Pixel art gerada para o protótipo top-down em `prototipos/caca-as-bruxas/`. Os PNGs são carregados diretamente pelo jogo; nomes de arquivo fazem parte da integração.

| Arquivo | Uso | Tela original |
| --- | --- | --- |
| witch.png | Protagonista | 64 × 64 |
| guard.png | Guardas e habitantes hostis | 64 × 64 |
| demon.png | Primeiro chefe | 96 × 96 |
| inquisitor.png | Chefe da perseguição | 96 × 96 |
| ghost.png | Vozes das bruxas mortas | 64 × 64 |
| house.png | Casas da vila | 128 × 128 |
| tree.png | Árvores e cemitério | 96 × 96 |
| pyre.png | Fogueira e checkpoint | 96 × 96 |
| chest.png | Descoberta de magias | 64 × 64 |
| witch-walk/0.png … 7.png | Caminhada da protagonista, oito quadros | 64 × 64 |
| stone.png / grass.png | Texturas de rua e áreas verdes | 64 × 64 |

Perspectiva em 3/4, contornos escuros seletivos, luz superior esquerda, paleta de índigo, musgo, âmbar e violeta. Objetos têm fundo transparente e não incluem chão ou sombra projetada. Terreno, efeitos mágicos e indicadores de combate são desenhados pelo jogo.

`pixellab-assets.json` preserva IDs, prompts e SHA-256 abreviado dos arquivos para recuperação e novas gerações. `_preview/asset-sheet.png` mostra o lote; outras prévias documentam a validação no navegador. `_tools/` contém geração e recuperação pelo MCP do PixelLab, usando a conexão local configurada, sem credenciais no repositório.
