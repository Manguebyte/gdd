# Interceptor Neon — protótipo web (Three.js)

Caça a jato em missões, com três câmeras trocáveis a qualquer momento (de cima, perseguição, cabine) e visual de fliperama neon 8-bit em 3D. GDD: [`InterceptorNeon.md`](../../InterceptorNeon.md).

Abra `index.html` **por um servidor local** (ex.: `npx serve` ou `python -m http.server` na raiz do repositório). O Three.js vem do jsDelivr por `importmap`, sem build, e o navegador não carrega módulos abertos direto do disco (`file://`). Precisa de internet na primeira vez. Teclado ou controle de videogame; não tem controle por toque.

Save local: `interceptor-neon-save-v1` (missões liberadas, recordes, câmera, voo assistido por câmera, inverter eixo).

Arquivos:
- `game.js`: o jogo inteiro (módulo ES). Seções: renderizador e pós-processamento (canvas de baixa resolução + bloom), modelos em código (`jato()`), céu/chão/montanhas/cidade, `Aviao` e `voar()` (modelo de voo comum a jogador e IA), armas, IA, entrada, câmeras (`calcularPose`, `trocarCamera`), missões (`MISSOES`), HUD e som.
- `style.css`: telas de menu, briefing, pausa e fim; scanlines (`#crt`).
- `index.html`: canvas da cena e do HUD, telas e o `importmap`.

Sem pasta em `Sprites/`: tudo é desenhado em código.

## Atalhos de desenvolvimento

Na URL, separados por vírgula (ex.: `index.html#missao=3,cam=cabine,deus`):

| Atalho | O que faz |
|---|---|
| `missao=N` | Começa direto na missão N (1–4). |
| `cam=topo\|persegue\|cabine` | Câmera inicial. |
| `deus` | O jogador não leva dano. |
| `tudo` | Libera todas as missões no menu. |
| `pix=N` | Tamanho do pixel 8-bit (1 = sem pixel). Padrão: ~360 linhas na vertical. |
| `sembrilho` | Desliga o bloom. |

No console: `InterceptorNeon.jogador`, `InterceptorNeon.jogo.M` (estado da missão), `InterceptorNeon.trocarCamera('cabine')`, `InterceptorNeon.iniciarMissao(i)`.

## Observação dos testes

- Chrome headless (SwiftShader), dirigido pelo DevTools Protocol: as 4 missões chegam ao fim. Na missão 1 os 7 anéis concluem; na 2, a câmera de cima não identifica, a cabine identifica em ~2 s, voar ao lado completa o sinal e atirar no civil reprova; na 3, o míssil fica bloqueado antes de identificar, as escoltas viram hostis, a trava fecha e o míssil acerta o bombardeiro; na 4, os caças disparam mísseis. Sem erros de script.
- Não testado à mão ainda: sensação do voo, dificuldade das missões e controle de videogame real.
