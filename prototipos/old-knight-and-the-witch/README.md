# Old Knight and the Witch — protótipo web (JavaScript + Three.js)

Protótipo do [GDD](../../OldKnightAndTheWitch.md). É uma **cópia mantida à mão** do [Guerreiro da Masmorra 3D (app)](../guerreiro-da-masmorra-app-3d/), com o mesmo combate (iniciativa, círculo de reação, Fúria, especiais, pedrada, poções) e o mesmo palco HD-2D. Tela em retrato. Abra por um servidor http (o Three.js vem pelo `importmap`; sem build). Save próprio: `okw-save-v1`.

## O que muda em relação ao Guerreiro 3D (app)
- **Enredo e prólogo:**
  - A primeira entrada abre a história, em páginas de texto: a garota é condenada por bruxaria e foge para a floresta.
  - Depois vem o **prólogo na Floresta Proibida**, no lugar do Campo de Treinamento. A Bruxa luta sozinha contra gosmas e aprende as cartas e as reações.
  - Na onda 3 ela não consegue vencer a **Gosma Rainha**. O lenhador chega com o machado e a salva.
  - No fim do prólogo o Velho Cavaleiro entra na dupla.
- **A dupla:** só um personagem fica em campo; o outro espera atrás, à esquerda.
  - **🔁 Trocar** está no menu do Cavaleiro e na barra da Bruxa, e gasta a vez.
  - Quem cai é substituído na hora, e a derrota só vem quando os dois caem.
  - A fila de iniciativa segue quem está em campo: a Bruxa age 2 vezes por rodada (velocidade 13) e o Cavaleiro 1 vez (velocidade 6, ATK 14).
  - Ao trocar, os campos "vivos" do motor (HP, Fúria, guarda, dinamites, maldição) são guardados no registro de quem sai e carregados de quem entra (`stash`/`unstash`). Por isso o resto do código do app não mudou.
- **A Bruxa joga com cartas:** substitui o Mago Arcanista do app.
  - O deck é salvo no acampamento. Ela tem mana por turno: +2 por vaga, teto 4.
  - Tocar numa carta mostra o efeito, e tocar de novo a lança.
  - Onde o Cavaleiro ganharia Fúria, ela ganha mana.
  - Depois de cada vitória, escolhe 1 entre 3 cartas novas.
  - No acampamento há a tela **🃏 Deck**, para remover cartas por ouro.
  - A árvore de Habilidades dela tem os nós Fonte, Mão Leve, Faísca Viva e Coven.
- **Inimigos da caça às bruxas:**
  - **Comuns:** Aldeão Furioso, Caçador de Bruxas, Guarda da Inquisição, Padre Inquisidor, Cão de Caça, Aldeã com Tocha, Fanático do Piche e Carrasco.
  - **Chefes:** Capitão da Ordem, Gosma Rainha, Caçador-Mor e Grande Inquisidor.
  - Cada um usa o comportamento de um monstro do app.
  - Eles **falam** contra a bruxa (balões sobre a cabeça), e contra o velho quando ele está em campo.
- **Acampamento:** as setas no retrato escolhem quem entra primeiro em campo. As gemas são só do Cavaleiro.

## Arte
- **De onde vem:** pixel art do PixelLab em [`Sprites/OldKnightWitch/`](../../Sprites/OldKnightWitch/).
  - Os ids estão em `_tools/chars.json` (personagens) e `_tools/objects.json` (as gosmas).
  - O script [`_tools/baixar.py`](../../Sprites/OldKnightWitch/_tools/baixar.py) baixa as animações, monta uma tira por animação (`idle`, `run`, `attack` e, nos heróis, `camp`) e gera o `units.js`, que o jogo mistura no catálogo de unidades.
- **Direções:** os heróis aparecem de costas na batalha e de frente no acampamento; os inimigos aparecem de frente.
- **Sem folha ainda:** um personagem cuja folha ainda não existe usa um sprite parecido do app (`OKW_FALLBACK`).
- **Cenário:** é o do Guerreiro 3D (app). O prólogo usa o bioma Floresta.

## Atalhos
- `#dupla`: pula o prólogo e entra numa masmorra com a dupla.
- `#prologo`: revê o prólogo.
- `#batalha`: entra direto na masmorra.
- `#rico`: +99999 de ouro e +50 Souls.
