# Street Legends — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da variante Street Legends (Parte 5) do [`RallySurvive.md`](../../RallySurvive.md), sobre o Core da Parte 1 em [`../rally-core/`](../rally-core/). Arte em pixel art gerada no PixelLab, em [`Sprites/StreetLegends/`](../../Sprites/StreetLegends/). Abra `index.html` no navegador.

## O que tem
- **Rota aberta com checkpoints** numa cidade em grade (9 × 7 quarteirões), com minimapa e seta de 1,5 s iguais aos do Navigation Expert (Parte 5 §Estrutura da pista). Prédios bloqueiam; praças são grama (grip baixo); calçada agarra um pouco menos que a rua.
- **Noite:** a cena escurece e só os postes, os faróis (cone à frente do carro), os letreiros de neon, as sirenes e o checkpoint iluminam.
- **Polícia** (Parte 5 §Mecânica de Polícia):
  - **Detecção:** viatura a menos de **3 unidades** por **2 s seguidos** = pego. A barra "CERCO" mostra o tempo acumulado.
  - **Falha:** "A polícia te pegou!" — `ESC` volta ao grid, `R` tenta de novo (mesmo menu da batida do RallySurvive).
  - **Escalonamento pelo tempo de corrida:** quanto mais demora, mais viaturas; o HUD mostra uma ★ por viatura.
- **Garagem permanente** (Parte 5 §Carros Modificados): moeda por corrida (base + bônus por tempo abaixo do par + bônus por viatura despistada). Desempenho em 3 categorias × 3 níveis (motor/turbo → velocidade máxima, suspensão → aderência/resposta, freios → frenagem), que mudam o `CarController` de vez. Visual: 7 pinturas e neon embaixo do carro, só estética. Desbloqueios por marcos (ex.: nível 3 só depois de terminar a rota Porto; pintura preta depois de fugir de 3 viaturas).
- **Ranking** por rota com o nível de procurado atingido como dado secundário (Parte 5 §Leaderboard). Solo, como o GDD define para o MVP.

## Escolhas do protótipo onde o GDD diz "Em aberto"
- **Curva de escalonamento:** 1ª viatura aos 8 s, +1 a cada 25 s, no máximo 6. Viaturas nascem num cruzamento longe do jogador e ficam um pouco mais rápidas a cada nova (7,2 → 8,0 unidades/s; o carro de série anda 8).
- **IA:** andam pelas ruas de cruzamento em cruzamento rumo ao jogador; a menos de 13 unidades vão direto nele; acima de 20 perdem o rastro e voltam às ruas.
- **Faróis e visibilidade:** afetam o jogo — o escuro é de verdade e longe dos postes só se vê o que o farol ilumina.
- **Garagem:** tela própria a partir do menu; 3 categorias × 3 níveis no MVP.
- **Ranking:** local (`localStorage`), no lugar do Firebase.
- **Carros estacionados e pinturas:** o mesmo sprite do carro do jogador com a cor trocada no carregamento (`RC.recolor`). Aberto direto do disco (`file://`) o navegador não deixa ler os pixels e tudo fica roxo; pelo site ou por um servidor local (`python -m http.server`) as cores aparecem.
- **Arte:** pixel art 3/4 no estilo do `rally2d` (ver a nota "Em aberto" na Parte 1 §4). Os prédios são desenhados no código (telhado + fachada com janelas acesas), com props de telhado do PixelLab.

## Atalhos
Na URL: `#avenida`, `#centro` ou `#porto` (larga direto), `#sempolicia` (corre sem viaturas, para testar), `#rico` (carteira com $5000 a cada carregamento), `#reset` (apaga tudo: ranking, dinheiro e garagem). Na corrida: `ESC` volta ao menu, `Shift+R` reinicia.
