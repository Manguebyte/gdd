# RallySurvive: Navigation Expert — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da variante Navigation Expert (Parte 3) do [`RallySurvive.md`](../../RallySurvive.md), sobre o Core da Parte 1, que mora em [`../rally-core/`](../rally-core/) e é o mesmo nos três protótipos novos da franquia. Arte em pixel art gerada no PixelLab, em [`Sprites/NavigationExpert/`](../../Sprites/NavigationExpert/). Abra `index.html` no navegador.

## O que tem
- **Movimento, grip e `ChevronGuide`** do Core (mesmos números do protótipo do RallySurvive: `maxSpeed` 8, zona morta 0,3, velocidade máxima a 6 unidades, curva `t²`).
- **Mapa aberto com checkpoints em ordem** (Parte 3 §Regra específica): não existe "sair da pista" nem penalidade; errar a rota só custa tempo.
- **Minimapa** no canto inferior com a estrada, as lagoas, o carro e só o **próximo** checkpoint (piscando).
- **Seta direcional** por **1,5 s** após cada checkpoint (e na largada); se o jogador passar **8 s** sem se aproximar do próximo, ela volta por 1,5 s (Parte 3 §Guia direcional — timing).
- **No mundo**, o anel amarelo marca o próximo checkpoint e um anel branco apagado o seguinte.
- **Colisão** com árvores, pedras, fardos, cercas, casas e celeiros: reduz a velocidade bruscamente, sem frear o carro de vez (Core §2).
- **Chegada:** tempo, nome de até 5 caracteres, ranking por percurso, "Repetir" e "Voltar ao Menu". Menu com "segurar para largar" (o mesmo gesto do RallySurvive).

## Escolhas do protótipo onde o GDD diz "Em aberto"
- **Quantos mapas/checkpoints:** 1 mapa (Vale Verde, 180 × 130 unidades) com 3 percursos: 6, 8 e 11 checkpoints.
- **Chão:** a estrada de terra tem grip 1,0; o pasto tem grip 0,55 e teto de 82% da velocidade; a lagoa grip 0,3 e teto de 45%. É o que faz a estrada valer a pena e o atalho pelo pasto ser uma aposta, sem penalidade artificial.
- **Ranking:** local (`localStorage`, top 10 por percurso), no lugar do Firebase. Nome vazio vira `PLAYR`.
- **Arte:** pixel art 3/4 no estilo do repositório `rally2d` (carro em 8 direções, objetos em pé com sombra desenhada pelo jogo). O Core (Parte 1 §4) define vetorial flat para a franquia; essa divergência está registrada como "Em aberto" lá.

## Atalhos
Na URL: `#curto`, `#medio` ou `#longo` (larga direto), `#reset` (apaga o ranking). Na corrida: `ESC` volta ao menu, `Shift+R` reinicia.
