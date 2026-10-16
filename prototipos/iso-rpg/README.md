# Iso RPG — protótipo web (JavaScript)

Versão do [Guerreiro da Masmorra](../guerreiro-da-masmorra/) com a **câmera isométrica do [Fury Hauler](../fury-hauler/)**. As regras são as mesmas do protótipo do Guerreiro (Parte 1 do [`GuerreiroDaMasmorra.md`](../../GuerreiroDaMasmorra.md)); o que muda é o palco e a arte. Não tem GDD próprio. Abra `index.html` no navegador, sem build. Tela deitada (16:9 a ~21:9), com mouse, teclado ou toque.

## O que muda em relação ao Guerreiro da Masmorra
- **Câmera isométrica 2:1**, com a mesma projeção do Fury Hauler: a lógica fica no chão (tiles `gx`, `gy`) e só o desenho converte para a tela. O mundo é desenhado num canvas de baixa resolução e ampliado 3× sem suavização; textos e barras ficam por cima, nítidos.
- **Corredor de masmorra**: acampamento na entrada (com fogueira) e uma sala por onda, 10 tiles à frente da anterior, separadas por pilares. Entre as ondas o herói **anda até a próxima sala** e a câmera vai junto; os monstros entram andando do escuro.
- **Luz**: tudo é escurecido e as tochas da parede, a fogueira e o herói abrem círculos de luz.
- **Arte PixelLab** em [`Sprites/IsoRpg/`](../../Sprites/IsoRpg/), no estilo da pixel art do Fury Hauler: herói (olhando para o nordeste) e 26 monstros e chefes (olhando para o sudoeste) com animações de parado, andar, atacar e morrer; o Cavaleiro nas 4 cores; piso, paredes e objetos de cenário de 6 biomas.
- **Tela deitada** em vez de retrato: comandos embaixo à direita, vida/Fúria/guarda embaixo à esquerda, fila de iniciativa no topo. O círculo de reação aparece ao lado do herói, sobre a parede, para não tampar quem ataca.
- **Golpe recebido** é piscada branca + empurrão por código (a animação de "dano" gerada saiu com defeito e não é usada). Salto e esquiva lateral também são por código (pulo em arco, passo para o lado).

## Biomas e as 42 masmorras
Diferente do Guerreiro (33 masmorras, bioma sorteado e só decorativo), aqui são **42 masmorras, 7 por bioma, numa ordem fixa**, e depois o NG+:

| Nv. | Bioma | Comuns | Chefe da 7ª | No ar |
|---|---|---|---|---|
| 1–7 | Masmorra dos Orcs | Servo, Arqueiro, Orc Brutamontes, Xamã Orc | Senhor da Guerra Orc | — |
| 8–14 | Floresta Amaldiçoada | Bandido, Espantalho, Dríade Sombria | Árvore Anciã | folhas secas |
| 15–21 | Pântano | Homem-Sapo, Zumbi do Pântano, Bruxa do Pântano | Rei Sapo | vaga-lumes |
| 22–28 | Montanha de Gelo | Yeti, Lobo de Gelo, Espírito do Gelo | Gigante de Gelo | neve |
| 29–35 | Vulcão | Goblin de Fogo, Salamandra, Golem de Magma | Demônio de Fogo | brasas |
| 36–42 | Academia de Magia | Aprendiz, Gárgula, Armadura Viva | Arquimago | faíscas |

- Cada bioma tem piso e parede próprios, objetos de cenário nos mesmos lugares do corredor (fogueira, caixas, pilares…), a cor do escuro e partículas no ar.
- Nas masmorras 1 a 6 de cada bioma o chefe da 3ª onda é o Cavaleiro (na cor sorteada); na 7ª é o chefe do bioma. Cada chefe de bioma tem a sua versão do Escudo Arcano (Grito de Guerra, Casca de Ferro, Muco Protetor, Armadura de Gelo, Escudo de Chamas, Barreira Arcana). O Arquimago é o único chefe que ataca de longe.
- Os monstros novos têm números no mesmo patamar do Servo e do Arqueiro (a escala por nível do Guerreiro faz o resto) e 3 golpes nomeados cada, em `MONSTERS` no `game.js`. Os que atacam de longe (Xamã, Dríade, Bruxa, Espírito, Goblin de Fogo, Aprendiz, Arquimago) têm projétil próprio: veneno, espinho, gelo, fogo ou arcano.
- Se os tiles de um bioma não carregarem, ele usa a arte e o elenco da Masmorra dos Orcs; monstro sem sprite sai do sorteio (e chefe sem sprite vira o Cavaleiro).
- O acampamento fica na porta da próxima masmorra, então já aparece no bioma dela.

## Masmorra 0: treinamento
Save novo começa no **treinamento** (nível 0), antes das 42: cenário da Masmorra dos Orcs e ondas fixas, **1 gosma, depois 2, depois só a Gosma Rainha**. Cada gosma ensina uma reação: a **Verde** ataca com toque e salto, a **Azul** com lateral, e a **Rainha** mistura as três (sem escudo e sem Fase 2). A Rainha solta a **Alma** do treinamento; vencendo, o jogo vai para a masmorra 1. Save antigo (já no nível 1 ou mais) não volta para o treinamento.

As gosmas não têm pernas, então não são "character" no PixelLab: pose do `create_image_pro_flash` e animações do `animate_image`. A Azul é a Verde recolorida pelo script, e a morte das três é um derretimento por código (as geradas não derretiam).

## Almas, habilidades e gemas
Também diferente do Guerreiro, onde os especiais vêm do atributo Habilidade (um a cada 5 pontos) e a Soul vem da vitória:

- **Almas 💠** caem dos chefes: todo chefe derrotado solta 1 (o Cavaleiro e os chefes de bioma). Ficam com você mesmo se o herói cair ou fugir depois. A run perfeita dobra só o ouro do bônus. Almas ainda compram Tocha, Mapa e o reviver.
- **Atributos** (ouro): só Vida, Ataque e Defesa. O atributo Habilidade saiu; save antigo ganha os especiais que já tinha liberado.
- **Habilidades** (Almas, aba Habilidades): Fúria 1, Combo 3, Lâmina Invisível 6, Sequência Mortal 8. Compra uma vez e fica. Na luta funcionam como antes (gastam Fúria e deixam o herói exausto).
- **Gemas** (Almas, aba Forja): forjadas uma vez cada; até 3 equipadas, trocadas só no acampamento. Os números são placeholders:

| Gema | 💠 | Efeito |
|---|---|---|
| 💚 da Vida | 3 | Parry perfeito recupera 5% do HP |
| ⚔ Gêmea | 5 | Ataque simples acerta 2 vezes (o 2º com 60%) |
| 🗡 Perfurante | 4 | Golpe em monstro com escudo ainda causa 40% do dano |
| 🪨 da Funda | 2 | 2 pedradas por rodada |
| 🛡 do Reflexo | 4 | Janela do parry perfeito 50% maior (últimos 48% do círculo em vez de 32%) |
| ✴ Afiada | 3 | Crítico 30% (era 15%) |
| 🔥 da Ira | 3 | Começa cada onda com 2 de Fúria |
| 🗿 de Pedra | 4 | Recebe 15% menos dano |
| 🪙 da Ganância | 2 | +25% de ouro dos monstros |
| 🧪 do Alquimista | 2 | +1 poção de cura e +1 de adrenalina |

Tudo junto custa 18 💠 (habilidades) + 32 💠 (gemas); com 1 chefe por masmorra, dá para ter tudo perto do fim das 42.

O resto (fila de iniciativa, reações e golpes nomeados, Fúria e os 4 especiais com minijogos, exaustão, cansaço, Fase 2, Escudo Arcano, 3 ondas, acampamento, Tochas, Mapas, NG+) é o mesmo código do Guerreiro. O que ficou de fora lá também ficou aqui (o resto do elenco, gemas, Mago, mapa-múndi etc.).

## Controles
- **Reação:** toque = parry (no fim do círculo = perfeito) · arraste ↑ = salto · deslize ↔ = lateral. Teclado: Espaço, ↑, ← →.
- **Comandos:** segure 0,9 s. A pedrada e o Ataque Aéreo são toques simples.
- **Alvo:** toque num monstro, ou ← → no teclado.

## Atalhos de desenvolvimento
Na URL, separados por vírgula (ex.: `index.html#rich,nv6,go`):

| Atalho | O que faz |
|---|---|
| `#go` | Entra direto na masmorra. |
| `#boss` | Começa na onda do chefe. |
| `#auto` | Piloto automático: ataca na sua vez e reage certo (usado para testar e para a miniatura do hub). |
| `#rich` | +5000 de ouro e 40 Almas (para testar habilidades e gemas). |
| `#nv7` | Qualquer número: começa nessa masmorra (`#nv0` = treinamento) (a partir da 6 os golpes têm ritmo próprio). `#nv8` Floresta, `#nv15` Pântano, `#nv22` Gelo, `#nv29` Vulcão, `#nv36` Academia; a 7ª de cada (`#nv7`, `#nv14`… `#nv42`) tem o chefe do bioma. |
| `#reset` | Apaga o save (que é separado do save do Guerreiro). |
