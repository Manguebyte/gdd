# 8-Bit Armageddon Iso — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`GDD_8-Bit_Armageddon_Iso.md`](../../GDD_8-Bit_Armageddon_Iso.md). Não precisa de build nem servidor: abra `index.html` no navegador.

Publicado em **https://manguebyte.github.io/gdd/prototipos/8-bit-armageddon-iso/** a cada push na `main` (workflow `deploy-site.yml`).

## De onde veio
Começou como cópia de [`../8-bit-armageddon/`](../8-bit-armageddon/), mas é um **jogo separado**: os dois códigos evoluem cada um por si, e o save fica numa chave própria do `localStorage` (`armageddonIso.save.v1`). As regras são as mesmas; o que muda é o render:

- **Projeção isométrica 2:1.** A simulação continua no plano 2D do chão (círculos, órbita, Quadrants, Spawn Sectors iguais aos do original). Só o desenho passa pela projeção `W(x, y)` em `render()`: 1 u no eixo x do chão vira (+12, −6) px, e no eixo y vira (−12, −6) px.
- **Grid isométrico** como chão, 16 px abaixo do plano de voo, só visual. Os eixos pontilhados e a cunha do Quadrant coberto são desenhados nele.
- **Sombras** no chão embaixo do planeta, dos inimigos e dos Satellites: mostram em qual Quadrant cada coisa está.
- **Ordem de desenho por profundidade:** inimigos, planeta, Satellites e projéteis são ordenados pelo y na tela, então um Satellite passa por trás do planeta na metade de cima da órbita.
- **Setas dos Spawn Sectors:** a direção do setor no chão é projetada na tela, e a seta usada é a pré-desenhada mais próxima.

## Arte
Quase toda a arte é a do 8-Bit Armageddon, lida direto de [`Sprites/8-Bit-Armageddon/`](../../Sprites/8-Bit-Armageddon/): os discos voadores já são vistos em 3/4 e o planeta é uma esfera, então funcionam em iso sem redesenho. A única arte nova é o chão do grid, em [`Sprites/8-Bit-Armageddon-Iso/Grid/`](../../Sprites/8-Bit-Armageddon-Iso/Grid/). Os dois caminhos precisam ir para o site (`deploy-site.yml`).

## O que ficou de fora
- Anúncios e Revive: não existem neste jogo (GDD §4.6).
- Áudio, idioma inglês, vibração, modo daltônico.

## Atalhos de desenvolvimento
Na URL, depois de `index.html`: `#play` (começa uma run), `#play,offense` (abre a gaveta), `#play,rich` (5000 Shards), `#play,sats` (já com 4 Satellites), `#play,wave=10` (começa na Boss Wave), `#play,sim=40` (avança 40 s de simulação), `#cores`, `#achievements`, `#settings` (abre essa tela). Teclado: `Esc`/`P` pausa.
