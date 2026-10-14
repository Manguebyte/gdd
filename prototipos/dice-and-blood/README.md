# DiceAndBlood — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`DiceAndBlood.md`](../../DiceAndBlood.md), com a pixel art do PixelLab em [`Sprites/DiceAndBlood/`](../../Sprites/DiceAndBlood/). Tela em retrato, tudo por toque ou clique. Abra `index.html` no navegador.

## O que tem
- **Tabuleiro (§2.1):** 8×8, pedras que bloqueiam a passagem, 1 herói (Cavaleiro).
- **Turno "mover e agir":** o dado de movimento rola na tela e as casas alcançáveis ficam em azul. O herói anda (se quiser) e depois pode atacar um monstro vizinho. O **Parry** continua ocupando o turno inteiro (§2.4: "no lugar de mover ou atacar") e dá +3 de Defesa até o próximo turno. "Esperar" passa a vez.
- **Ataque roll-under (§2.3):** 1d20 contra `Ataque − Defesa efetiva do alvo` (mínimo 1). A chance de acerto aparece em cima de cada alvo. **1 natural é crítico** (dano dobrado) e **20 natural é falha**.
- **Sangrar (candidato a pilar, §1):** pague vida para rolar de novo o dado de movimento (antes de andar) ou um ataque que errou. O custo começa em 1 e sobe 1 a cada uso no mesmo turno. Nunca mata, porque só aparece se sobrar vida.
- **IA por tipo (Parte 7 §5.1):** todos andam e atacam no mesmo turno.
  - **Esqueleto:** lento (d4) e resistente.
  - **Goblin:** foge quando fica com 2 de vida ou menos, e só ataca se ficar encurralado.
  - **Morcego:** voa por cima de pedras e unidades, ataca e recua 2 casas.
  - **Rei Esqueleto:** chefe da sala 7. Usa o sprite do esqueleto maior e tingido de vermelho, porque ainda não tem arte própria.
- **Run de 7 salas:** a vida passa de uma sala para a outra. Ao descer, o herói recupera 3 de vida e escolhe 1 de 3 recompensas. "Ataduras" (cura 8) sempre aparece; as outras duas são sorteadas entre +Ataque, +dano, +Defesa, +vida máxima, Parry mais forte, Sangrar sem custo crescente, movimento d8 e cura ao matar.
- **Sensação de impacto (§5, §6):** tela treme no acerto, manchas no chão (sangue vermelho, pó de osso, sangue verde de goblin) e sons sintetizados para dado, golpe, crítico, erro, morte, sangria e Parry. O botão ♪ no topo liga e desliga o som.
- **Ranking local** no `localStorage`, no lugar do Firebase da §7: ordenado por salas limpas e depois por menos turnos.

## Balanceamento
Os valores (herói 22 de vida, Ataque 14, Defesa 2, dano 4; monstros com Ataque 9–12 e dano 2–3) foram ajustados com uma simulação de um bot simples que anda até o monstro mais fraco e ataca:
- Com 22 de vida, o bot vence cerca de 47% das runs se sangra só para matar, 44% se nunca sangra e 37% se sangra sempre que pode. Um jogador humano deve ir melhor que o bot.
- As salas mais difíceis são a 6 (Salão da guarda) e a 7 (o chefe).
- **Custo do Sangrar:** com custo fixo de 2, sangrar sempre era pior que nunca sangrar. Com custo fixo de 1, sangrar sempre compensava. O custo crescente dentro do turno faz a escolha valer a pena só quando é bem pensada.

## O que ficou de fora
Geração procedural, grupo de heróis, meta-progressão entre runs, arte do chefe e dos dados d4/d8 (aparecem como dado de texto) e o Firebase real.

## Atalhos
Na URL:
- `#go` pula o título.
- `#god` dá 99 de vida ao herói.
- `#weak` deixa os monstros com 1 de vida.
- `#sala5` começa na sala 5 (vale de 1 a 7).

Os atalhos se combinam com vírgula: `#go,sala7,god`.
