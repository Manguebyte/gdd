# 8-Bit Armageddon — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`GDD_8-Bit_Armageddon.md`](../../GDD_8-Bit_Armageddon.md), usando a arte de [`Sprites/8-Bit-Armageddon/`](../../Sprites/8-Bit-Armageddon/) direto do lugar (sem cópias). Não precisa de build nem servidor: abra `index.html` no navegador.

Publicado em **https://manguebyte.github.io/gdd/prototipos/8-bit-armageddon/** a cada push na `main` (workflow `deploy-site.yml`). No celular, jogue com o aparelho deitado: o botão "Jogar" pede tela cheia e trava a paisagem onde o navegador permite (Android).

## O que tem
- Planeta girando (9 Skins), 1–4 Satellites em órbita (os extras comprados com Shards na aba Satellites), Quadrants com preenchimento até o Attack Range, Target Priority por Satellite.
- Waves com Spawn Sectors (setas na borda), timer, Wave Clear, limite de 150 inimigos; Grunt, Scout, Swarmer, Brute e Mothership (espiral, laser com aviso, cachos de Swarmers).
- 13 Stats em 3 Tracks na gaveta (x1 / x10 / Max), números de dano, críticos, Impetus, defesa absoluta/relativa.
- Results com recorde de Wave, 3 Planet Cores e 9 Skins, 15 conquistas, Settings, pausa (inclusive automática) e save no `localStorage`. Sem moeda permanente nem Perks: toda run começa do zero (Seção 5.1 do GDD).

## Diferenças do GDD (playtest)
Ajustes pedidos depois de jogar, ainda não levados à Parte 1 do GDD:
- A run começa com **10 Shards** (GDD: 5).
- Cada Wave dura **60 s** (Boss Wave: **120 s**), e os inimigos nascem ao longo de 40 s (GDD: 30 s / 60 s, nascendo em 20 s).
- Grunt, Scout, Swarmer e Brute são **20% mais lentos** (0,64 / 1,6 / 0,96 / 0,4 u/s). A Mothership não mudou.
- O canto superior direito mostra o HP e o ATK (já escalados pela Wave) de cada tipo de inimigo da Wave atual.
- A gaveta aberta é mais baixa (cards de 2 linhas, um botão só que alterna x1 / x10 / Max). Passar o mouse sobre um card, ou pressionar e segurar no celular, mostra o que o upgrade faz sem comprar.

## O que ficou de fora
- O anúncio do Revive: o protótipo se comporta como o build do itch.io, sem botões de anúncio.
- Áudio, idioma inglês, vibração, modo daltônico, consentimento e analytics.

## Atalhos de desenvolvimento
Na URL, depois de `index.html`: `#play` (começa uma run), `#play,offense` (abre a gaveta), `#play,rich` (5000 Shards), `#play,wave=10` (começa na Boss Wave), `#play,sim=40` (avança 40 s de simulação), `#cores`, `#achievements`, `#settings` (abre essa tela). Teclado: `Esc`/`P` pausa.

`ui/btn_*.png` são as 3 células de `SPR_UI_Button.png` recortadas, porque o `border-image` do CSS não recorta uma célula de uma spritesheet.
