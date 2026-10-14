# Guerreiro da Masmorra — protótipo web (JavaScript)

Reescrita em HTML/JS puro do núcleo do jogo publicado (`abraaovilanova/guerreiro-da-masmorra`) com a **arte nova** flat vector do SpriteCook em [`Sprites/GuerreiroDaMasmorra/`](../../Sprites/GuerreiroDaMasmorra/), seguindo a Parte 1 do [`GuerreiroDaMasmorra.md`](../../GuerreiroDaMasmorra.md) (que descreve o código do jogo). Tela em retrato. Abra `index.html` no navegador.

## O que tem
- **Fila de iniciativa (§4):** `velocidade + d(0..5)` por rodada, mostrada no topo; chefe em Fase 2 entra 2–3 vezes com +3.
- **Reações (§5):** círculo que fecha em 900 ms (a partir do nível 6, com o `m` e a curva de cada golpe); toque = parry (últimos 32% = **perfeito**, antes = bloqueio), arrastar ↑ = salto (abre o **Ataque Aéreo** por 1,1 s), deslizar ↔ = lateral. Riposte do parry perfeito, contra-ataque por defender o combo inteiro, dano de falha `ATK + d(0..3)`. O nome do golpe aparece antes.
- **Golpes nomeados (§8.3)** do Servo, do Arqueiro (à distância) e do Cavaleiro-chefe, com os liberados por nível.
- **Herói (§6, §7):** comandos que exigem segurar 0,9 s; Atacar (crítico 15%, +1 Fúria), Pedrada grátis (1 por rodada), Poções (cura 40% / Fúria 5, 3 de cada) e Fugir com Mapa. Os 4 especiais liberados pela Habilidade (5/10/15/20) com os minijogos: barra de carga da Fúria 5, círculos do Combo, Lâmina Invisível e a barra oscilante da Sequência Mortal. Todo especial deixa o herói exausto.
- **Exaustão da guarda (§7.2)** e **cansaço dos monstros (§7.3)**; **Fase 2** (ATK ×1,4, hit extra, círculo 25% mais rápido) e **Escudo Arcano** do chefe (§8.4).
- **Masmorras (§9):** 3 ondas (a 2ª 30% mais forte), escala por nível, escolta nas múltiplas de 5, bônus de vitória, Soul (dobro na run perfeita), vídeo simulado que dobra o bônus, derrota que perde metade do ouro ou revive com Soul, cor sorteada que troca o Cavaleiro (Vermelho, Negro, Púrpura, Dourado), NG+ depois da 33.
- **Acampamento (§10):** Vida, Ataque, Defesa e Habilidade com `base × 1,55^compras`; Tochas (5, +1 a cada 10 min reais), Souls compram Tocha ou Mapa. Save no `localStorage`.

## O que ficou de fora
- Só os monstros com arte nova aparecem: Servo, Arqueiro e o Cavaleiro-chefe. Os outros 23 monstros e chefes do §8 (e o Monge, os goblins de fogo e suas dinamites) esperam os sprites (`Sprites/GuerreiroDaMasmorra/PENDENTES.md`).
- Gemas, Mercado de gemas, Baú do Dia, tutorial, áudio, nuvem, anúncios reais, Mago e mapa-múndi.
- A pedrada é um botão (no jogo, arrasta-se do herói até o monstro). O layout é lateral, como o guia Unity sugere começar, não o corredor em perspectiva.

## Atalhos
Na URL: `#rich` (+5000 de ouro e 5 Souls), `#nv7` (qualquer número: começa nessa masmorra), `#go` (entra direto), `#boss` (começa na onda do chefe), `#reset` (apaga o save).
