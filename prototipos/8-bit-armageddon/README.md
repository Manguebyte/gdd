# Orbitfall (antes 8-Bit Armageddon) — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`GDD_8-Bit_Armageddon.md`](../../GDD_8-Bit_Armageddon.md), usando a arte de [`Sprites/8-Bit-Armageddon/`](../../Sprites/8-Bit-Armageddon/) direto do lugar (sem cópias). Não precisa de build nem servidor: abra `index.html` no navegador.

Publicado em **https://manguebyte.github.io/gdd/prototipos/8-bit-armageddon/** a cada push na `main` (workflow `deploy-site.yml`). No celular, jogue com o aparelho deitado: o botão "Jogar" pede tela cheia e trava a paisagem onde o navegador permite (Android).

## O que tem
- Planeta girando (9 Skins), 1–4 Satellites em órbita (os extras comprados com Shards na aba Satellites), Quadrants com preenchimento até o Attack Range, Target Priority por Satellite.
- Waves com Spawn Sectors (setas na borda), timer, Wave Clear, limite de 150 inimigos; Grunt, Scout, Swarmer, Brute e Mothership (espiral, laser com aviso, lança Grunts e Scouts e depois cachos de Swarmers).
- 13 Stats em 3 Tracks na gaveta (x1 / x10 / Max), números de dano, críticos, Impetus, defesa absoluta/relativa.
- Results com recorde de Wave, 3 Planet Cores e 9 Skins, 15 conquistas, Settings, pausa (inclusive automática) e save no `localStorage`. Sem moeda permanente nem Perks: toda run começa do zero (Seção 5.1 do GDD).

## Novidades da versão Orbitfall
- **Nome:** o jogo agora se chama **Orbitfall** (antes 8-Bit Armageddon). Pastas, arquivos e a chave do save continuam com o nome antigo.
- **Modo Invasion** (GDD §4.7), escolhido na Core Select e liberado pela conquista *Holding the Line* (Wave 10). Uma IA defende o planeta com as regras do Last Stand e compra Upgrades com Shards; o jogador lança naves com Plasma pela aba **Deploy** e compra **Fleet Upgrades**. Para escolher o Spawn Sector, toque no espaço em volta do planeta (ou use as teclas `1` a `6`). O painel do canto mostra a defesa do planeta. Recorde: **Best Planet**.
- **Stats novos:** Multishot Chance e Multishot Targets (Offense), Energy Shield (até 3 cargas, recarga de 12 s) e Reflect Shield (Defense). O Reflector é o arco azul em órbita: devolve os Gunner Bolts, bloqueia o laser e fere os kamikazes que passam por ele.
- **Gunner** (Wave 5+): para a 4,5 u do planeta e atira Bolts magenta.
- **Zoom:** botões `-` e `+` ao lado da pausa (também a roda do mouse e as teclas `+` e `-`), de 0,5× a 2×, centrado no planeta. O canvas agora desenha na resolução física da tela, para o zoom continuar pixel perfect.
- **Arte:** o Gunner foi gerado no PixelLab; o Gunner Bolt, o tiro refletido, o Reflector e a bolha do Energy Shield são desenhados por script (`Sprites/8-Bit-Armageddon/_tools/orbitfall_extras.py`); os ícones novos são as células 22 a 32 de `SPR_UI_Icons` (receita em `Sprites/8-Bit-Armageddon/PROMPTS.md`). Só o arco de 40° do Reflector continua desenhado por código.
- **Atalhos:** `#play,invasion` começa no Invasion (mesmo sem a conquista), `#play,invasion,planet=5` começa na Fortress, e `rich` também dá 5000 Plasma.

## Diferenças do GDD (playtest)
Ajustes pedidos depois de jogar, ainda não levados à Parte 1 do GDD:
- Cada Wave dura **60 s** (Boss Wave: **120 s**), e os inimigos nascem ao longo de 40 s (GDD: 30 s / 60 s, nascendo em 20 s).
- Grunt, Scout, Swarmer e Brute são **20% mais lentos** (0,64 / 1,6 / 0,96 / 0,4 u/s). A velocidade da Mothership não mudou.
- O laser da Mothership causa **30% menos** dano: 17,5 de base (GDD: 25), ainda multiplicado pela escalada de dano da Wave. Na Wave 10, ~30 por disparo em vez de ~42.
- Nas Waves 6 a 9, os Swarmers nascem em cachos de **4** (GDD: 8). Da Wave 10 em diante, voltam a 8.
- O canto superior direito mostra o HP e o ATK (já escalados pela Wave) de cada tipo de inimigo da Wave atual.
- A gaveta aberta é mais baixa (cards de 2 linhas, um botão só que alterna x1 / x10 / Max). Passar o mouse sobre um card, ou pressionar e segurar no celular, mostra o que o upgrade faz sem comprar.

## O que ficou de fora
- O anúncio do Revive: o protótipo se comporta como o build do itch.io, sem botões de anúncio.
- Áudio, idioma inglês, vibração, modo daltônico, consentimento e analytics.

## Atalhos de desenvolvimento
Na URL, depois de `index.html`: `#play` (começa uma run), `#play,offense` (abre a gaveta), `#play,rich` (5000 Shards), `#play,wave=10` (começa na Boss Wave), `#play,sim=40` (avança 40 s de simulação), `#cores`, `#achievements`, `#settings` (abre essa tela). Teclado: `Esc`/`P` pausa.

`ui/btn_*.png` são as 3 células de `SPR_UI_Button.png` recortadas, porque o `border-image` do CSS não recorta uma célula de uma spritesheet.
