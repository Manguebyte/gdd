# Reinos Hex — protótipo web (JavaScript)

Protótipo das regras da Parte 1 do [`ReinosHex.md`](../../ReinosHex.md). Abra `index.html` no navegador, sem build. Não tem save: recarregar a página volta ao menu.

Arquivos: `game.js` (regras, IA, desenho e input), `style.css`, `index.html` (HUD, painéis e menu em HTML por cima do canvas).

**Modos:** contra a IA e dois jogadores no mesmo aparelho (com a tela "passe o aparelho" entre os turnos). O online do GDD existe só no guia Unity, porque precisa do Firebase.

As regras são as mesmas do guia Unity, linha por linha: `Rng` (xorshift32), `MapGenerator` (metade sorteada e metade espelhada, mesma ordem de sorteios), `Rules` (`validate`/`apply`/`preview`) e `AiPlayer`. A mesma semente gera o mesmo mapa aqui e no Unity. Se uma regra mudar, mude nos dois.

## Como se joga
- **Uma ação por turno** (comprar, recrutar, construir torre, mover ou atacar); a vez passa sozinha depois dela. O registro embaixo conta o que o jogador anterior fez.
- Cada hexágono seu produz o recurso dele no início do seu turno; a cidade produz 1 de cada.
- Hexágono **livre** com contorno verde tracejado = dá para comprar agora (vizinho do reino e recursos suficientes). Toque nele e pague.
- Toque na **cidade** ou numa **torre de vigia** 🗼 para recrutar ali; toque noutro hexágono seu para construir uma torre. Toque num hexágono seu com tropas (fica amarelo) e depois num vizinho aceso (branco) para **mover** ou **atacar**. O painel mostra a previsão da batalha enquanto você escolhe a quantidade.
- Arraste para mover o mapa; roda do mouse ou pinça para zoom. **E** passa a vez, **Esc** cancela a seleção.

## Placeholders
Todos os números vêm da tabela §15 do GDD (objeto `CONFIG` no topo do `game.js`). Ícones de terreno, monstros 👹 e saqueadores 🗡️ são emoji; a arte está Em aberto.

## Atalhos de desenvolvimento
Na URL, separados por vírgula (ex.: `index.html#ia,seed=7`):

| Atalho | O que faz |
|---|---|
| `ia` | Começa direto contra a IA. |
| `hotseat` | Começa direto com dois jogadores. |
| `iaxia` | IA contra IA, para assistir (e testar a IA). |
| `seed=N` | Usa a semente N (o console mostra a semente de cada partida). |
| `rapido` | A IA joga a cada 60 ms em vez de 450 ms. |
| `recursos` | +50 de cada recurso para os dois reinos no início. |

No console: `ReinosHex.state()` devolve o estado da partida; `ReinosHex.preview({type:'atacar', from, to, count})` calcula uma batalha.

## Observação dos testes
- 0.1.x (várias ordens por turno): IA contra IA (sementes 7, 42 e 1234) termina sempre com a cidade tomada, em 57 a 65 rodadas.
- 0.2.0 (uma ação por turno, torres de vigia): IA contra IA (sementes 5, 7, 31, 42, 99, 777, 1234 e 2026) termina sempre, em 27 a 71 rodadas, e as duas IAs constroem torres. Os recursos sobram muito (centenas no fim), porque só dá para gastar uma vez por turno. Vale medir no playtest com gente (GDD §16).
