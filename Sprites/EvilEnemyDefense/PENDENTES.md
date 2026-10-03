# Evil Enemy Defense — sprites PixelLab

Pixel art chibi na pegada **MapleStory** (cabeça grande, olhos grandes, cores vivas), em vista lateral, gerada no PixelLab (modo `v3`, `view` = `side`, `outline` = `selective outline`, `detail` = `low detail`), só na direção **east**: o Unity espelha quem precisa olhar para a esquerda. Como importar: `EvilEnemyDefense.md`, Etapas 4A e 4B.

## Pronto (2026-10-03, segunda versão: estilo MapleStory)

- **Pastas:**
  - `units/`: as 6 unidades;
  - `garrison/`: as 6 criaturas e as 5 construções;
  - `anims/`: 27 sheets.
- **Unidades (warrior, archer, bomber, pawn, lancer, thief):** `walk` (8 quadros) e `attack` (9).
- **Criaturas:**
  - todas as 6 (goblin, great-orc, lizard, bear, minotaur, troll) têm `idle` (4 quadros) e `attack` (9);
  - goblin, great-orc e minotaur também têm `walk` (8).
- **Construções (wood-tower, tower, tower-blue, tower-purple, castle):** imagem única.
- **`pixellab-assets.json`:** `character_id`/`object_id`, arquivos, quadros e tamanho do quadro de cada sheet.

Para baixar de novo ou depois de regerar algo: `python _tools/fetch_pixellab.py`, rodando dentro desta pasta.
- Baixa os zips do PixelLab.
- Monta as sheets e normaliza o quadro: todas as sheets de um personagem ficam com o mesmo quadro quadrado e os pés na última linha, porque o PixelLab aumenta a tela do ataque.
- Grava o manifesto.

Para conferir: `python _tools/contact_sheet.py units _preview/units.png`.

## Receita do estilo

Todo prompt de personagem termina com: `in MapleStory style, very big round head with friendly face and large shiny eyes, small body, bright pastel fantasy colors, soft light shading`; descrições de ataque usam palavras como "bouncy", "cartoon". Para animação de ataque, comece com "facing right the whole time" e termine com "returning to the exact starting pose": sem isso o v3 às vezes vira o personagem no meio do golpe (aconteceu com o Guerreiro, refeito).

## Melhorias possíveis

1. **Ataque do Goblin:** a adaga virou um porretinho e a estocada é discreta; vale regerar se incomodar.
2. **Caminhada de lizard, bear e troll**, se a `DefenderView` passar a usar `walk`: template `walking-8-frames`, east.
3. **Animações das construções** (fumaça do canhão, bandeira tremulando) com `animate_object`.
4. **Projéteis e efeitos** no mesmo estilo (flecha, bomba, gosma do lagarto, bala de canhão, "puf" de queda).

## Dica de produção

O limite é de 10 trabalhos simultâneos na conta, contando trabalhos de outras sessões. Envie em ondas e use `wait_for_jobs` entre elas. Custo observado:
- personagem v3: 2 a 4 gerações;
- animação de template: 1 geração;
- animação v3: 1 a 5 gerações, conforme o tamanho;
- construção: 20 gerações.

Cada versão do elenco inteiro custou cerca de 180 gerações.
