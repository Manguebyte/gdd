# DiceAndBlood — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`DiceAndBlood.md`](../../DiceAndBlood.md), com os placeholders de MVP do guia Unity e a pixel art do PixelLab em [`Sprites/DiceAndBlood/`](../../Sprites/DiceAndBlood/). Tela em retrato, tudo por toque ou clique. Abra `index.html` no navegador.

## O que tem
- **Tabuleiro (§2.1, §8):** 8×8 fixo, com pedras que bloqueiam a passagem; 1 herói (Cavaleiro) contra 3 monstros (Esqueleto, Goblin, Morcego).
- **Movimento por dado (§2.2, Parte 5):** no começo do turno o d6 rola na tela, e as casas alcançáveis com esse número de passos ortogonais (contornando pedras e unidades) ficam em azul. A unidade anda casa a casa.
- **Ataque roll-under (§2.3, Parte 6):** 1d20 contra `Ataque do atacante − Defesa efetiva do alvo` (mínimo 1), dano fixo de 3. O resultado aparece como no guia: "Rolou 14 (alvo ≤ 12) — Errou".
- **Parry (§2.4):** é a ação do turno e dá +3 de Defesa até o próximo turno do herói (escudo azul sobre ele).
- **Turnos (§3):** ordem fixa, o herói age e depois cada monstro. Cada turno tem uma ação: Mover, Atacar um vizinho ou Parry.
- **IA (Parte 7):** o monstro ataca se estiver ao lado do herói; senão rola o d6 e vai para a casa que mais o aproxima.
- **Fim da run:** vitória ao eliminar todos os monstros; a morte encerra a run (permadeath). O ranking local fica no `localStorage`, ordenado por turnos e depois por vida, no lugar do Firebase da §7.

## Escolhas do protótipo
- **Atributos:** o guia deixa todos em Vida 10 / Ataque 12 / Defesa 2 e manda variar por monstro. Aqui ficaram herói 18/14/2, Esqueleto 6/11/2, Goblin 5/12/1 e Morcego 3/10/4 (difícil de acertar, morre com um golpe). Uma simulação com um herói que só ataca ou avança venceu cerca de 60% das runs.
- Os 3 monstros usam a mesma IA, porque comportamento por tipo ainda está em aberto (Parte 7 §5.1).
- Tocar direto numa casa azul move, e tocar num monstro vermelho ao lado ataca, qualquer que seja o botão aceso. Os botões só trocam o destaque.
- O d20 não tem arte: é um hexágono na paleta do dado, e as faces do d6 vêm de `ui/dado_1..6.png`.

## O que ficou de fora
Áudio, crítico/fumble, geração procedural, grupo de heróis, meta-progressão e o Firebase real: tudo está "Em aberto" ou é pós-MVP no GDD.

## Atalhos
Na URL: `#go` (pula o título), `#god` (herói com 99 de vida), `#weak` (monstros com 1 de vida).
