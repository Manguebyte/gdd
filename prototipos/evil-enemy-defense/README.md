# Evil Enemy Defense — protótipo web (JavaScript)

Reescrita em HTML/JS puro do protótipo original (`abraaovilanova/evil-enemy-defense`, TypeScript + Vite) com a **arte nova** do PixelLab em [`Sprites/EvilEnemyDefense/`](../../Sprites/EvilEnemyDefense/) (estilo Sea of Stars / Stardew), seguindo a Parte 1 do [`EvilEnemyDefense.md`](../../EvilEnemyDefense.md). Abra `index.html` no navegador.

## O que tem
- **Simulação (§4):** porte direto do `src/sim/battle.ts` original: campo contínuo, tick fixo de 20/s, determinística, Defensores agem antes das Unidades, Regras de Alvo `foremost`/`lowestHp`/`area`, Armadura `max(1, dano − armadura)`, Unidades que nunca recuam e trava de 12.000 ticks.
- **Conteúdo (§5–§7):** os 6 Tipos de Unidade, as 11 Formas e os 12 Estágios com os valores do GDD. Conferido: 6 Guerreiros numa Entrada vencem o Estágio 1, divididos 3+3 perdem, e não passam do Estágio 2.
- **Moedas e loja (§8–§9):** dano + tempo + sobreviventes + vitória (com bônus de Primeira Vitória), contador ao vivo na Run, desbloqueios, níveis `30 × 1,48^(n−1)` e Capacidade `50 × 1,15^(c−6)`.
- **Telas (§11):** Estágios, Loja, Montagem do Exército por Entrada (com atributos do tipo e a Guarnição por lado), Batalha (x1/x3 no Espaço) e Resumo, no estilo dos menus de Final Fantasy 1/2 do NES. Teclado primário (setas, Enter, Esc, ◀ ▶) e mouse.
- **Visual (§10):** 5 profundidades por id, animações desencontradas, piscar vermelho de 140 ms, ataque segurado inteiro, Unidades da direita espelhadas, criaturas encarando a Unidade mais próxima, Defensores maiores desenhados primeiro. Save em `eed.save.v1` com a última composição lembrada.

## Diferenças para o protótipo original
- Arte: a nova do PixelLab no lugar do pack Tiny Swords. O campo é 640×360 (o dobro dos 320×180 do GDD) para caber a arte nova sem perder detalhe; as alturas dos sprites seguem a tabela do original, dobradas.
- A interface é HTML com o visual FF, não desenhada no canvas (ADR 0002); o inspetor de sprites (tecla V) ficou de fora.

## Atalhos
Na URL: `#rich` (+20000 Moedas), `#unlock` (libera os 12 Estágios), `#reset` (apaga o save).
