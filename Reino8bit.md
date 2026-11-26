# Reino 8bit — GDD inicial

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

## Visão geral

Reino 8bit é o [Reinos Hex](ReinosHex.md) com cara de fliperama neon 8-bit. Dois reinos disputam um tabuleiro de hexágonos por turnos: compram hexágonos livres, vencem monstros e saqueadores para engrossar o exército e tentam tomar a cidade rival. Tudo isso agora acontece numa tela preta, com hexágonos de linha acesa, ícones de pixel grande e brilho em volta de tudo.

As regras, os números e a geração do mapa são **os mesmos do Reinos Hex 0.2.0**. Este documento define só o que muda (o visual) e aponta para a Parte 1 do [`ReinosHex.md`](ReinosHex.md) nas regras. Uma regra nova ou um número novo deste jogo é escrito aqui, não no GDD do Reinos Hex.

O tema continua o mesmo: reinos medievais, floresta, pedreira, mina de ouro, pasto, cidade, torre de vigia, monstros e saqueadores. Só a aparência é de fliperama. **Em aberto:** se o jogo ganha um tema próprio (por exemplo, reinos digitais ou robôs, como o [Terminal de Aventuras](TerminalDeAventuras.md)) ou fica medieval em neon.

"Reino 8bit" é nome de trabalho.

**Pilares**

- **Cada hexágono é uma escolha** (o pilar proposto do Reinos Hex): pagar pelo livre ou lutar pelo ocupado, e todo monstro vencido vira soldado seu.
- **Fliperama neon.** Fundo preto, linhas finas acesas com brilho, poucas cores saturadas, pixel grande e scanlines de monitor CRT. Nenhuma imagem pronta: todo ícone é desenhado em código.
- **Leitura em um olhar.** Cada cor quer dizer uma coisa: ciano é o seu reino (jogador 1), magenta é o rival, roxo são monstros, laranja são saqueadores, verde é "dá para comprar".

**Plataforma:** o protótipo é web (HTML/JS, sem build) e roda em desktop e celular, como o do Reinos Hex. **Em aberto:** plataformas da versão final e se o jogo terá um guia de implementação próprio (hoje só tem este GDD; o guia Unity do Reinos Hex vale para as regras).

**Protótipo:** [`prototipos/reino-8bit/`](prototipos/reino-8bit/). Os números são os do Reinos Hex (§15 do GDD dele) e valem como **proposta** de balanceamento.

## Estética: fliperama neon 8-bit

**Definido**

- **Fundo:** preto azulado (`#05060f`) com uma grade azul-escura presa ao mapa (anda junto quando o jogador arrasta).
- **Hexágonos de linha acesa:** cada hexágono tem um preenchimento bem fraco e uma borda fina na cor do terreno. O dono pinta o hexágono de leve e acende uma borda grossa na cor dele.
- **Pixel 8-bit:** o tabuleiro inteiro é desenhado num canvas 2 vezes menor que a tela e ampliado sem suavizar.
- **Brilho (bloom):** depois de ampliado, o quadro ganha duas cópias borradas somadas à luz, uma larga e fraca e outra curta e forte.
- **Scanlines e vinheta** de monitor CRT por cima de tudo (CSS).
- **Letra de terminal:** textos em VT323; títulos, botões e cabeçalhos dos painéis em Press Start 2P.
- **Painéis e botões:** fundo preto, borda acesa, cantos retos. O botão de confirmar é verde; "Passar a vez" é magenta.

**Cores**

| O quê | Cor | Hex |
| --- | --- | --- |
| Jogador 1 (azul no Reinos Hex) | ciano | `#22e6ff` |
| Jogador 2 (vermelho no Reinos Hex) | magenta | `#ff3b8d` |
| Floresta | verde neon | `#39ff6a` |
| Pedreira | ciano claro | `#7fdcff` |
| Mina de ouro | amarelo | `#ffd23f` |
| Pasto | verde-limão | `#c6ff3d` |
| Cidade | branco aceso | `#f4f4ff` |
| Monstros | roxo-magenta | `#e04bff` |
| Saqueadores | laranja | `#ff9a3c` |
| Dá para comprar / ganho | verde | `#39ff6a` |
| Perda | vermelho | `#ff3b5c` |
| Selecionado | amarelo | `#ffe14d` |

**Ícones (pixel art 9 × 9 em código)**

| Reinos Hex (emoji) | Reino 8bit |
| --- | --- |
| 🌲 Floresta | pinheiro verde de tronco laranja |
| ⛰️ Pedreira | montanha ciano de pico branco |
| ⛏️ Mina de ouro | picareta amarela de cabo laranja |
| 🐑 Pasto | ovelha branca de cara verde-limão |
| 🏰 Cidade | castelo branco com ameias |
| 🗼 Torre de vigia | torre amarela com ameias |
| 👹 Monstros | cara de demônio roxa de chifres e olhos vermelhos |
| 🗡️ Saqueadores | espada laranja |
| 🪵 🪨 🪙 🌾 (recursos no HUD) | tronco, montanha, moeda, trigo |
| ⬡ ⚔️ (hexágonos e tropas no HUD) | hexágono ciano, espada branca |

**Tabuleiro**

- O ícone do terreno fica no centro do hexágono e sobe quando há tropas ou custo embaixo, como no Reinos Hex.
- **Tropas:** caixa quadrada preta com borda na cor do dono e o número em branco. Monstros e saqueadores mostram o ícone deles antes do número, e o número na cor deles.
- **Custo de compra:** caixa preta com ícone e número de cada recurso. Onde dá para comprar agora, a borda e o texto são verdes e o hexágono tem um tracejado verde que anda; no resto, tudo apagado.
- **Seleção:** borda amarela grossa. **Alvos** (vizinhos onde dá para mover ou atacar): borda branca piscando.
- **Números flutuantes** (+N, −N, torre construída, tropas que entraram no exército) sobem e somem, com contorno preto e o ícone quando há.

**Em aberto**

- Som (bipes de fliperama ao comprar, recrutar e na batalha). O protótipo é mudo, como o do Reinos Hex.
- Se o pixel 2× fica legível em celulares pequenos. O protótipo aceita `#pix=1` (sem pixel) até `#pix=4`.

## Regras

**Definido:** valem as seções da Parte 1 do [`ReinosHex.md`](ReinosHex.md), sem mudança: mapa e geração (mesma semente, mesmo mapa nos dois jogos), recursos e produção, uma ação por turno, compra de hexágono livre, recrutamento na cidade e nas torres de vigia, torre de vigia, movimento, batalha determinística, monstros e saqueadores que entram no exército, vitória ao tomar a cidade rival, IA e modos (contra a IA e dois jogadores no mesmo aparelho; o online existe só no guia Unity do Reinos Hex).

**Diferenças do protótipo:**

- O nome salvo do jogador usa a chave `reino-8bit-nome`, separada da do Reinos Hex.
- O console expõe `Reino8bit.state()` (no Reinos Hex é `ReinosHex.state()`).
- Atalhos novos na URL: `pix=N` (tamanho do pixel, 1 a 4) e `sembrilho` (desliga o bloom). Os outros são os do Reinos Hex.

## Em aberto (geral)

- Nome definitivo.
- Tema: medieval em neon (como está) ou um tema próprio.
- Plataformas da versão final e se o jogo ganha um guia de implementação próprio.
- Som.

## Histórico de versões

- **0.1.0** (2026-11-25): primeira versão. É o Reinos Hex 0.2.0 com visual de fliperama neon 8-bit: fundo preto com grade, hexágonos de linha acesa, ícones de pixel art 9 × 9 desenhados em código no lugar dos emoji, pixel 2×, brilho (bloom), scanlines e letras VT323 e Press Start 2P. As regras, os números e a geração do mapa são os do Reinos Hex.
