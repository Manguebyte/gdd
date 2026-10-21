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

## Diferenças do GDD (playtest)
Ajustes pedidos depois de jogar, ainda não levados à Parte 1 do GDD:
- A run começa com **10 Shards** (GDD: 5).
- Cada Wave dura **60 s** (Boss Wave: **120 s**), e os inimigos nascem ao longo de 40 s (GDD: 30 s / 60 s, nascendo em 20 s).
- Grunt, Scout, Swarmer e Brute são **20% mais lentos** (0,64 / 1,6 / 0,96 / 0,4 u/s). A Mothership não mudou.
- Nas Waves 6 a 9, os Swarmers nascem em cachos de **4** (GDD: 8). Da Wave 10 em diante, voltam a 8.
- O canto superior direito mostra o HP e o ATK (já escalados pela Wave) de cada tipo de inimigo da Wave atual.
- A gaveta aberta é mais baixa (cards de 2 linhas, um botão só que alterna x1 / x10 / Max). Passar o mouse sobre um card, ou pressionar e segurar no celular, mostra o que o upgrade faz sem comprar.

## O que ficou de fora
- Anúncios e Revive: não existem neste jogo (GDD §4.6).
- Áudio, idioma inglês, vibração, modo daltônico.

## Atalhos de desenvolvimento
Na URL, depois de `index.html`: `#play` (começa uma run), `#play,offense` (abre a gaveta), `#play,rich` (5000 Shards), `#play,sats` (já com 4 Satellites), `#play,wave=10` (começa na Boss Wave), `#play,sim=40` (avança 40 s de simulação), `#cores`, `#achievements`, `#settings` (abre essa tela). Teclado: `Esc`/`P` pausa.
