# GDD — Marble Arena

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

> Documento vivo. Rascunho inicial a partir do briefing do usuário ("Project: Marble Arena — 3D Traditional Marble Game"). As regras, a pilha de tecnologia, a arquitetura e o roadmap vêm desse briefing e estão marcados como **Definido**. Os números (tamanhos, massas, atritos, impulso) e os detalhes que o briefing deixou abertos foram decididos para o protótipo do Marco 1 rodar: estão marcados como **placeholder** ou **Em aberto** e precisam de confirmação.
>
> O guia de implementação tem duas partes: a **versão web** (TypeScript, Three.js, Rapier — a do protótipo em [`prototipos/marble-arena/`](prototipos/marble-arena/)) e um **porte para Unity**, para referência futura.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Web](#parte-2--guia-de-implementação-web)
3. [Parte 3 — Implementação Web: Fase 0 (Setup do Projeto)](#parte-3--implementação-web-fase-0-setup-do-projeto)
4. [Parte 4 — Implementação Web: Fase 1 (Regras Puras e Testes)](#parte-4--implementação-web-fase-1-regras-puras-e-testes)
5. [Parte 5 — Implementação Web: Fase 2 (Física com Rapier)](#parte-5--implementação-web-fase-2-física-com-rapier)
6. [Parte 6 — Implementação Web: Fase 3 (Estado e GameManager)](#parte-6--implementação-web-fase-3-estado-e-gamemanager)
7. [Parte 7 — Implementação Web: Fase 4 (Cena 3D, Mira e Câmera)](#parte-7--implementação-web-fase-4-cena-3d-mira-e-câmera)
8. [Parte 8 — Implementação Web: Fase 5 (HUD)](#parte-8--implementação-web-fase-5-hud)
9. [Parte 9 — Implementação Web: Fase 6 (Build, Deploy e Próximos Passos)](#parte-9--implementação-web-fase-6-build-deploy-e-próximos-passos)
10. [Parte 10 — Guia de Implementação Unity (porte)](#parte-10--guia-de-implementação-unity-porte)
11. [Parte 11 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-11--implementação-unity-fase-0-setup-do-projeto)
12. [Parte 12 — Implementação Unity: Fase 1 (Configuração e Regras Puras)](#parte-12--implementação-unity-fase-1-configuração-e-regras-puras)
13. [Parte 13 — Implementação Unity: Fase 2 (Arena e Física)](#parte-13--implementação-unity-fase-2-arena-e-física)
14. [Parte 14 — Implementação Unity: Fase 3 (GameManager)](#parte-14--implementação-unity-fase-3-gamemanager)
15. [Parte 15 — Implementação Unity: Fase 4 (Mira e Tiro)](#parte-15--implementação-unity-fase-4-mira-e-tiro)
16. [Parte 16 — Implementação Unity: Fase 5 (Câmera)](#parte-16--implementação-unity-fase-5-câmera)
17. [Parte 17 — Implementação Unity: Fase 6 (HUD)](#parte-17--implementação-unity-fase-6-hud)
18. [Parte 18 — Implementação Unity: Fase 7 (Build e Próximos Passos)](#parte-18--implementação-unity-fase-7-build-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Nome:** **Definido** — Marble Arena.
- **Gênero:** **Definido** — jogo competitivo de habilidade por turnos, baseado em física (mira de precisão + decisão estratégica), inspirado na bolinha de gude de rua brasileira.
- **Dimensão:** **Definido** — 3D.
- **Câmera/perspectiva:** **Definido** — visão de cima inclinada (estilo isométrico), mostrando a arena inteira, com zoom e rotação (§7).
- **Plataforma-alvo:** **Definido** — navegador de desktop na primeira versão. A interface deve estar pronta para receber controles de toque depois. **Em aberto:** celular como alvo oficial e lojas.
- **Pilar de design:** **Definido** — "fácil de aprender, difícil de dominar": o jogador controla só direção, força e ângulo, e a física decide o resto.
- **Fantasia central:** **Em aberto** em palavras próprias. O briefing descreve a sensação de jogar triângulo num terreiro de terra com bolinhas de vidro coloridas; uma frase de fantasia ainda não foi escrita.
- **Referências/inspirações:** **Definido** — a bolinha de gude tradicional brasileira, em especial o jogo do triângulo com "casadas". Nenhum jogo comercial foi citado.

## 2. Loop da Partida

1. **Definido:** configurar a partida (2 a 4 jogadores, humanos ou IA).
2. **Definido:** rodada de abertura: cada um lança uma bolinha na direção da linha de referência; quem para mais perto começa (§4.1).
3. **Definido:** na sua vez, o jogador mira (direção, força, ângulo) e atira a sua bolinha de tiro (§5).
4. **Definido:** a física simula tudo até todas as bolinhas pararem. Então o jogo conta as capturas, as eliminações e checa a vitória.
5. **Definido:** a vez passa para o próximo jogador ativo.
6. **Definido:** a partida acaba quando alguém captura a última casada ou elimina todos os outros (§4.5).

## 3. Arena

- **Definido:** arena pequena ao ar livre, inspirada nos terreiros de terra das brincadeiras de rua, com:
  - chão plano de terra ou areia;
  - um triângulo riscado no chão, no centro, com as casadas dentro;
  - uma linha de referência bem visível para a rodada de abertura;
  - uma área de tiro definida;
  - limites físicos que impedem as bolinhas de sair da área jogável;
  - iluminação, sombras e detalhes do ambiente.
- **Placeholder de protótipo:** 1,8 m × 1,3 m de terra batida, cercada por tábuas baixas de 4 cm de altura. O jogador fica de um lado (o "lado de baixo" da tela); a área de tiro é uma faixa de 1,2 m × 14 cm perto da tábua desse lado; o triângulo fica no meio; a linha de referência atravessa a arena perto da tábua do fundo.
- **Placeholder de protótipo:** triângulo equilátero de 36 cm de lado, com a ponta para o fundo e a base virada para o jogador.
- **Em aberto:** tamanho e formato definitivos da arena e do triângulo; se existem arenas diferentes (terrenos, obstáculos, declives).
- **Em aberto:** os limites físicos são tábuas (placeholder) ou outra coisa (meio-fio, mureta, raiz de árvore)?

## 4. Regras

### 4.1 Rodada de abertura (quem começa)

- **Definido:** antes da partida, cada jogador lança uma bolinha na direção da linha de referência, um de cada vez, escolhendo direção e força.
- **Definido:** depois que todas as bolinhas param, mede-se a **distância perpendicular absoluta** de cada uma até a linha. Passar da linha é permitido.
- **Definido:** quem parou mais perto começa a partida principal; os outros jogam na ordem da distância.
- **Definido:** em caso de empate, os empatados repetem a rodada de abertura.
- **Em aberto:** de onde se lança na abertura. Placeholder: da área de tiro.
- **Em aberto:** a ordem de lançamento dentro da abertura. Placeholder: a ordem da configuração da partida.
- **Em aberto:** o que é empate com física contínua (duas distâncias quase nunca são idênticas). Placeholder: diferença menor que 0,1 cm.
- **Em aberto:** uma bolinha da abertura pode bater em outra já parada? Placeholder: pode, e vale onde ela parar.
- **Em aberto:** a bolinha da abertura vira a bolinha de tiro do jogador (começando dali) ou sai da arena? Placeholder: sai, e cada bolinha de tiro entra na área de tiro.
- **Em aberto:** o ângulo vertical vale na abertura? O briefing cita só direção e força. Placeholder: vale, como em qualquer tiro.

### 4.2 Partida principal

- **Definido:** no centro, o triângulo com um número predefinido de bolinhas, as **casadas** (bolinhas apostadas).
- **Definido:** cada jogador controla a sua **bolinha de tiro**.
- **Definido:** os jogadores se revezam atirando, com três objetivos possíveis: tirar casadas do triângulo, acertar e eliminar a bolinha de tiro de um adversário, ou posicionar a própria bolinha para os próximos turnos.
- **Definido:** depois de cada tiro, a vez passa para o próximo jogador ativo.
- **Em aberto:** número de casadas. Placeholder: 10, arrumadas num triângulo compacto (1, 2, 3, 4).
- **Em aberto:** as casadas são de cada jogador (cada um "casa" as suas) ou do jogo?
- **Em aberto:** onde a bolinha de tiro começa e de onde se atira depois. Placeholder: o primeiro tiro de cada um sai da área de tiro; os seguintes saem de onde a bolinha parou.
- **Em aberto:** a bolinha de tiro pode parar dentro do triângulo? Placeholder: pode, sem penalidade.

### 4.3 Captura

- **Definido:** uma casada que sai **inteira** do triângulo (o corpo físico todo atravessou a linha) é capturada: o jogador da vez ganha 1 ponto, o placar atualiza e a bolinha sai da arena depois que a simulação termina.
- **Definido:** se várias casadas saem no mesmo tiro, cada uma vale 1 ponto.
- **Definido:** a captura é avaliada com tudo parado, não durante o movimento.
- **Em aberto:** casada que é empurrada para fora por uma bolinha de outro jogador numa jogada anterior, mas que ninguém contou (não acontece hoje: toda casada fora no fim do tiro é contada para quem atirou).

### 4.4 Eliminação

- **Definido:** acertar diretamente a bolinha de tiro de um adversário elimina esse adversário.
- **Definido:** só vale o toque direto da bolinha do jogador da vez. Colisões indiretas (uma bolinha empurrada que bate em outra) não eliminam.
- **Definido:** jogadores eliminados não jogam mais; a bolinha de tiro deles sai da arena depois que o tiro termina.
- **Em aberto:** o que é uma colisão "válida". Placeholder: qualquer contato que começa durante o tiro entre a bolinha do jogador da vez e a de um adversário, inclusive depois de bater numa tábua.
- **Em aberto:** o que acontece com as capturas de quem foi eliminado.

### 4.5 Vitória

- **Definido:** vence quem capturar a **última** casada do triângulo, ou quem eliminar todos os outros jogadores ativos.
- **Definido:** a tela de vitória mostra o nome do vencedor, quantas casadas capturou, quantos adversários eliminou, o total de tiros e a duração da partida.
- **Em aberto:** pela regra acima, quem captura a última casada vence mesmo com menos pontos que outro jogador. Os pontos decidem algo (desempate, ranking) ou são só estatística? Placeholder: só estatística.

## 5. Tiro

O tiro é a mecânica mais importante do jogo.

- **Definido — direção:** girar a direção no plano do chão, com seta de mira mostrando a direção inicial exata do tiro; mirar com o mouse.
- **Definido — força:** de 0% a 100%, com medidor na tela. A força vira um impulso físico; mais força vai mais longe e bate mais forte.
- **Definido — ângulo vertical:** de 0° (rasteiro) a 45° no primeiro protótipo. Ângulos maiores fazem pequenas trajetórias no ar; a gravidade age naturalmente, e o impacto na aterrissagem influencia o movimento seguinte.
- **Definido — sequência:** escolher a direção → ajustar a força → ajustar o ângulo → confirmar → aplicar o impulso → simular → esperar tudo parar → avaliar capturas, eliminações e vitória → passar a vez.
- **Definido:** os controles de tiro ficam desligados enquanto há bolinhas em movimento.
- **Placeholder de protótipo (controles):** o mouse em cima do chão aponta a direção; clique trava a direção; A/D ajusta fino; W/S e um slider ajustam a força; Q/E e um slider ajustam o ângulo; Espaço ou o botão "Atirar" confirmam. A seta já mostra a inclinação do ângulo vertical e cresce e muda de cor (verde → vermelho) com a força. Uma linha fina no chão estende a direção.
- **Placeholder de protótipo:** o impulso é aplicado no centro da bolinha (sem efeito/giro inicial).
- **Em aberto:** controles de toque (celular); se existe efeito (bolinha "com veneno"); se existe previsão de trajetória.

## 6. Física

- **Definido:** Rapier, com corpos rígidos esféricos, colisão esfera-esfera, gravidade, atrito com o chão, resistência ao rolamento, restituição com perda de energia, velocidade angular e detecção de colisão.
- **Definido:** as bolinhas devem parecer pequenas esferas de vidro rolando em terra batida: sem quique exagerado nem deslize irreal.
- **Definido:** raio, massa, atrito, restituição e impulso máximo são parâmetros configuráveis.
- **Definido:** passo de física fixo; resolução do turno determinística onde for prático.
- **Placeholder de protótipo:** escala de 1 unidade = 1 cm, para a bolinha ter o tamanho real (1,6 cm de diâmetro) e a gravidade valer 981 cm/s².
- **Placeholder de protótipo:** o Rapier não tem atrito de rolamento; o jogo tira, a cada passo, `resistência × g × dt` da velocidade horizontal de cada bolinha apoiada no chão (e o mesmo tanto, em proporção, do giro).
- **Placeholder de protótipo:** restituição alta entre bolinhas (vidro com vidro) e baixa contra a terra, usando a regra de combinação "mínimo" no chão e nas tábuas, para a terra "engolir" o quique.
- **Placeholder de protótipo:** uma bolinha é considerada parada abaixo de 1 cm/s e 1,5 rad/s; o tiro termina com tudo parado por 30 passos seguidos (0,25 s), ou à força depois de 20 s.
- **Em aberto:** determinismo entre máquinas diferentes (importa para o multiplayer online, §9). O Rapier é determinístico na mesma máquina com passo fixo; entre plataformas, ver o build com "enhanced determinism" do Rapier.

## 7. Câmera

- **Definido:** câmera 3D suave, com visão geral estilo isométrico, zoom, rotação em volta da arena, transição suave entre jogadores, câmera opcional que acompanha o tiro e volta automática à visão geral quando tudo para.
- **Definido:** a câmera sempre mostra os elementos importantes da jogada.
- **Placeholder de protótipo:** botão direito (ou do meio) arrastando gira; roda do mouse dá zoom; C/Home volta à visão geral; F liga a câmera que acompanha. Mirando, o alvo da câmera fica entre o triângulo e a bolinha de tiro.
- **Em aberto:** transição entre jogadores (Marco 3): a câmera gira para trás da bolinha do próximo jogador ou só reenquadra?

## 8. HUD / UI

- **Definido:** interface limpa e moderna, com elementos animados simples, mostrando: jogador da vez e a cor dele, cores e placar de todos, casadas restantes no triângulo, força em %, direção horizontal, ângulo vertical, fase da partida, indicador de vez e as condições de vitória.
- **Definido:** funciona no navegador de desktop e é pensada para receber controles de celular depois.
- **Placeholder de protótipo:** painel de status no canto superior esquerdo, controles no canto superior direito, painel de mira embaixo no centro, aviso animado com o resultado de cada tiro.
- **Em aberto:** menu principal e tela de configuração da partida (Marco 4).

## 9. Modos de Jogo

- **Definido — multiplayer local:** 2 a 4 jogadores revezando no mesmo dispositivo.
- **Definido — um jogador:** contra adversários controlados pela IA, que mira nas casadas, escolhe uma força adequada, às vezes mira nas bolinhas dos adversários e tem níveis de dificuldade ajustáveis.
- **Definido — multiplayer online futuro:** a arquitetura deve se preparar para ele (regras, física, tela e input separados), mas a primeira versão não tem rede.
- **Em aberto:** quantos níveis de dificuldade e o que muda entre eles. Placeholder para o Marco 4: Fácil, Médio e Difícil, mudando o erro de mira e de força e a frequência de mirar nos adversários.
- **Em aberto:** a IA simula tiros (rodando a física sem tela, que o `PhysicsManager` já permite) ou usa só regras geométricas?

## 10. Estilo Visual

- **Definido:** 3D estilizado e charmoso com física realista: terreiro de terra brasileiro, bolinhas de vidro coloridas com reflexos, luz natural quente, sombras suaves, câmera suave, ambiente simples mas caprichado.
- **Definido:** bolinhas com cores distintas e padrões reconhecíveis.
- **Definido:** materiais procedurais e geometria primitiva no começo, sem assets externos pagos.
- **Placeholder de protótipo:** dois padrões de bolinha: **olho-de-gato** (vidro transparente com três pétalas coloridas cruzadas dentro) e **leitosa** (vidro opaco com espiral). Terra e espirais são texturas desenhadas em canvas; o reflexo vem de um ambiente gerado pelo próprio Three.js (`RoomEnvironment`). Em volta da arena: pedras, tufos de capim e folhas secas.
- **Em aberto:** mais padrões (bolinha de aço, "bolão" maior, bolinhas raras), personalização da bolinha do jogador.

## 11. Áudio

- **Definido:** efeitos sonoros entram no Marco 3.
- **Em aberto:** quais sons (clique de vidro com vidro, rolar na terra, batida na tábua, comemoração) e se tem música.

## 12. Backend / Serviços

- **Definido:** a primeira versão é offline, sem rede.
- **Em aberto:** tecnologia do multiplayer online futuro. Os outros jogos do estúdio usam Firebase (Firestore) para login anônimo e leaderboard (`/leaderboards/{jogo}/{pista}/{uid}`, ver `RallySurvive.md` Parte 1), mas isso não foi decidido para este jogo, e multiplayer em tempo real tem necessidades diferentes de um leaderboard.
- **Em aberto:** leaderboard, salvamento de estatísticas.

## 13. Arquitetura de Software

- **Definido — pilha da primeira versão:** TypeScript, Three.js, React, React Three Fiber, Rapier, Zustand e Vite.
- **Definido — sistemas independentes:** `GameManager`, `TurnManager`, `PhysicsManager`, `MarbleController`, `ShootingSystem`, `CollisionSystem`, `ScoringSystem`, `RulesEngine`, `CameraController`, `AIController`, `UIManager`, com interfaces TypeScript fortemente tipadas e regras desacopladas da parte visual.
- **Definido — máquina de estados:** `MAIN_MENU`, `MATCH_SETUP`, `OPENING_ROUND`, `MAIN_GAME`, `AIMING`, `SHOT_IN_PROGRESS`, `RESOLVING_TURN`, `GAME_OVER`.
- **Definido:** testes unitários para as regras, a ordem dos turnos, a detecção de captura e as condições de vitória.
- **Como o Marco 1 mapeia esses nomes** (placeholder; a divisão final vem no Marco 2):

| Sistema do briefing | No protótipo do Marco 1 |
|---|---|
| `GameManager` | `src/game/GameManager.ts` |
| `PhysicsManager` | `src/physics/PhysicsManager.ts` |
| `CollisionSystem` | `src/core/CollisionSystem.ts` (toques diretos da bolinha de tiro) |
| `ScoringSystem` | `src/core/ScoringSystem.ts` (captura) |
| `ShootingSystem` | `src/core/shot.ts` (impulso) + `src/input/keyboard.ts` e `src/render/AimArrow.tsx` (mira) |
| `MarbleController` | `src/render/Marble.tsx` (desenho; o corpo físico fica no `PhysicsManager`) |
| `CameraController` | `src/render/CameraController.tsx` |
| `UIManager` | `src/ui/Hud.tsx` + `src/game/store.ts` |
| `TurnManager`, `RulesEngine`, `AIController` | Marcos 2 e 4 |

- **Placeholder de protótipo:** no Marco 1, só os estados `AIMING`, `SHOT_IN_PROGRESS`, `RESOLVING_TURN` e `GAME_OVER` são usados (este último como "triângulo limpo" do modo treino).

## 14. Escopo do MVP e Roadmap

**Definido — o projeto é construído em marcos, um de cada vez:**

1. **Marco 1 — Protótipo 3D jogável:** arena de terra, triângulo, bolinhas de vidro, física, mira e tiro, e bolinhas saindo do triângulo. **Feito** em `prototipos/marble-arena/` (modo treino de um jogador).
2. **Marco 2 — Regras completas:** rodada de abertura, vez dos jogadores, captura, eliminação, placar e vitória.
3. **Marco 3 — Polimento:** animações de câmera, materiais e luz melhores, partículas, sons e interface melhorada.
4. **Marco 4 — IA e multiplayer local:** multiplayer local, adversários de IA, dificuldade e configuração da partida.

**Valores de partida (placeholders do protótipo, em `src/config/gameConfig.ts`):**

| Parâmetro | Placeholder |
|---|---|
| Escala | 1 unidade = 1 cm |
| Passo de física | 1/120 s, até 8 passos por quadro |
| Gravidade | 981 cm/s² |
| Raio da bolinha | 0,8 cm (todas iguais) |
| Densidade | 2,5 g/cm³ (vidro) → massa ≈ 5,4 g |
| Atrito bolinha / terra / tábua | 0,4 / 0,6 / 0,3 (média entre os dois corpos) |
| Restituição bolinha / terra / tábua | 0,9 / 0,15 / 0,45 (terra e tábua usam a regra "mínimo") |
| Resistência ao rolamento | 0,05 (≈ 49 cm/s² de desaceleração) |
| Amortecimento angular | 0,3 |
| Bolinha parada | < 1 cm/s e < 1,5 rad/s |
| Fim do tiro | 30 passos parados seguidos, ou 20 s |
| Arena | 180 × 130 cm, tábuas de 4 cm de altura e 3 cm de espessura |
| Triângulo | equilátero de 36 cm, centro 5 cm à frente do meio da arena |
| Casadas | 10, com 3 cm de folga entre elas |
| Área de tiro | faixa de 120 × 14 cm, a 46 cm do centro, do lado do jogador |
| Linha de referência | 48 cm atrás do centro |
| Impulso máximo | 1900 g·cm/s (≈ 3,5 m/s com força 100%) |
| Ângulo vertical | 0° a 45° |
| Força inicial | 50% |

Com esses números, um tiro rasteiro de 20% anda ≈ 25 cm, um de 40% anda ≈ 92 cm, e um tiro de 100% no triângulo costuma capturar 1 ou 2 casadas.

## 15. Em aberto (consolidado)

- Fantasia central em palavras próprias; celular como plataforma oficial (§1).
- Tamanho e formato da arena e do triângulo; tipo de limite físico; arenas diferentes (§3).
- Rodada de abertura: de onde se lança, ordem, tolerância de empate, colisão entre bolinhas da abertura, destino da bolinha da abertura, ângulo vertical na abertura (§4.1).
- Número e dono das casadas; de onde se atira depois do primeiro tiro; bolinha de tiro dentro do triângulo (§4.2).
- O que é colisão "válida" para eliminar; capturas de quem foi eliminado (§4.4).
- Os pontos decidem algo além da estatística? (§4.5)
- Controles de toque; efeito na bolinha; previsão de trajetória (§5).
- Determinismo entre máquinas para o online (§6).
- Transição de câmera entre jogadores (§7).
- Menu e configuração da partida (§8).
- Níveis de dificuldade da IA e como ela escolhe o tiro (§9).
- Padrões extras e personalização das bolinhas (§10).
- Sons e música (§11).
- Tecnologia do online, leaderboard, estatísticas (§12).
- Todos os valores da tabela do §14.

## Histórico de versões

- **0.1.0** (2026-10-26): início do versionamento; marca o estado do GDD e do protótipo neste dia.

---

# Parte 2 — Guia de Implementação Web

> Guia fase a fase da versão web (a primeira versão do jogo), na pilha definida no §13: TypeScript, Vite, React, React Three Fiber, Three.js, Rapier e Zustand. As fases 0 a 5 constroem o **Marco 1**; a Fase 6 publica e planeja os Marcos 2 a 4.
>
> O código completo e funcionando está em [`prototipos/marble-arena/`](prototipos/marble-arena/). As listagens das regras, da física e do `GameManager` abaixo são cópias desse código (são a especificação do comportamento). Os arquivos de tela e de HUD são descritos pelo que fazem, com os trechos que importam; o arquivo inteiro está no protótipo.

## Convenções

- **Nomes no código em inglês, comentários em português**, como nos outros jogos do estúdio.
- **Três camadas que não se misturam** (o requisito de separar regras, física, tela e input, §9 e §13):
  - `src/core/`: regras puras. Não importa Three.js, Rapier nem React; roda em teste, numa IA ou num servidor.
  - `src/physics/`: o mundo do Rapier. Não conhece regras nem tela.
  - `src/render/`, `src/ui/`, `src/input/`: tela, HUD e teclado. Só leem o estado e chamam o `GameManager`.
- **Posição de bolinha não mora no React.** A física é a única fonte de verdade; cada bolinha da tela copia a posição do corpo físico a cada quadro. O store do Zustand guarda só o que a interface mostra.
- **Todo número de jogo fica em `src/config/gameConfig.ts`.** Balancear é mexer ali.

## Arquitetura em uma página

```
           teclado / mouse / sliders
                    │  setYaw, setPower, setPitch, shoot()
                    ▼
   Zustand store ◀──────── GameManager ────────▶ PhysicsManager (Rapier)
   (fase, placar,   escreve  (fluxo do tiro)  update(dt)  passo fixo 1/120 s,
    mira, avisos)                 │                       rolamento, repouso
        │                         │ usa                        │ onContact
        │ lê                      ▼                            ▼
        ▼               core/: geometry, rack,          CollisionSystem
   HUD (React)          shot, ScoringSystem             (toques diretos)
   Cena 3D (R3F) ── lê posições a cada quadro ──▶ PhysicsManager
```

---

# Parte 3 — Implementação Web: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Vite + React + TypeScript que roda (`npm run dev`) e testa (`npm test`), com as dependências da pilha instaladas.

### 0.1 Pré-requisitos

1. Node 20 ou mais novo (`node --version`).
2. Um editor com suporte a TypeScript (VS Code serve).

### 0.2 Dependências

O `package.json` fixa versões exatas, para o build de hoje e o de daqui a seis meses darem o mesmo resultado:

```json
{
  "name": "marble-arena",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@dimforge/rapier3d-compat": "0.14.0",
    "@react-three/fiber": "8.18.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "three": "0.170.0",
    "zustand": "5.0.1"
  },
  "devDependencies": {
    "@types/react": "18.3.12",
    "@types/react-dom": "18.3.1",
    "@types/three": "0.170.0",
    "@vitejs/plugin-react": "4.3.4",
    "typescript": "5.6.3",
    "vite": "5.4.21",
    "vitest": "2.1.9"
  }
}
```

- **Por que `rapier3d-compat`:** é o pacote do Rapier que traz o WebAssembly embutido no JavaScript. Funciona igual no navegador e no Node (testes) sem configurar carregamento de `.wasm`. O custo é um pacote de ~3 MB.
- **Por que não `@react-three/rapier`:** ele prende a física aos componentes React. Aqui a física é uma classe comum, que roda sem tela (testes, IA, servidor futuro).
- **Por que não `@react-three/drei`:** a câmera e o ambiente de reflexo são poucas linhas feitas à mão; uma dependência a menos.

### 0.3 Configuração

`vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './': o build é servido em /gdd/prototipos/marble-arena/ no GitHub Pages,
// então todos os caminhos dos arquivos gerados precisam ser relativos.
export default defineConfig({
  base: './',
  plugins: [react()],
  // O WebAssembly do Rapier vem embutido no JS (~2 MB): o aviso de pacote grande é esperado.
  build: { chunkSizeWarningLimit: 4000 },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

`tsconfig.json` com `strict: true`, `jsx: "react-jsx"`, `moduleResolution: "bundler"` e `include` cobrindo `src`, `tests` e `vite.config.ts` (arquivo completo no protótipo). `.gitignore` com `node_modules/` e `dist/`.

### 0.4 Estrutura de pastas

```
prototipos/marble-arena/
├─ index.html            # só o <div id="root"> e o <script> de src/main.tsx
├─ src/
│  ├─ config/gameConfig.ts
│  ├─ core/               # regras puras: types, geometry, rack, shot, ScoringSystem, CollisionSystem
│  ├─ physics/PhysicsManager.ts
│  ├─ game/               # store (Zustand) e GameManager
│  ├─ input/keyboard.ts
│  ├─ render/             # Scene, Arena, Marble, AimArrow, CameraController, materials
│  ├─ ui/                 # Hud.tsx, hud.css
│  ├─ App.tsx
│  └─ main.tsx
└─ tests/                 # Vitest
```

### ✅ Checkpoint da Fase 0
- `npm install` termina sem erro.
- `npm run dev` abre uma página (ainda vazia) em `http://localhost:5173`.
- `npx tsc --noEmit` não acusa erro.

#### Problemas comuns
- **`npm install` avisa que o script do esbuild foi bloqueado (npm 11+):** o binário do esbuild vem num pacote opcional e funciona mesmo assim; confira com `npx esbuild --version`.

Próxima fase: **Regras Puras e Testes** — a geometria do triângulo, a captura e o impulso do tiro, testados sem tela.

---

# Parte 4 — Implementação Web: Fase 1 (Regras Puras e Testes)

## Fase 1 — Regras Puras e Testes

> Objetivo desta fase: as regras do Marco 1 (onde ficam as casadas, quando uma está capturada, como os controles viram impulso) existem como funções puras com testes passando.

### 1.1 Configuração do jogo

`src/config/gameConfig.ts` tem a interface `GameConfig` (cada campo comentado) e o objeto `GAME_CONFIG` com os valores da tabela do §14:

```ts
export const GAME_CONFIG: GameConfig = {
  physics: { timeStep: 1 / 120, maxStepsPerFrame: 8, gravity: 981 },
  marble: {
    radius: 0.8,
    density: 2.5,
    friction: 0.4,
    restitution: 0.9,
    rollingResistance: 0.05,
    angularDamping: 0.3,
    stopLinearSpeed: 1.0,
    stopAngularSpeed: 1.5,
  },
  ground: { friction: 0.6, restitution: 0.15 },
  wall: { friction: 0.3, restitution: 0.45, height: 4, thickness: 3 },
  arena: { width: 180, depth: 130 },
  triangle: { centerX: 0, centerZ: -5, side: 36 },
  stakes: { count: 10, gap: 3 },
  shootingArea: { centerZ: 46, depth: 14, width: 120 },
  referenceLine: { z: -48 },
  shooter: { startX: 0, startZ: 46 },
  shot: { maxImpulse: 1900, maxPitchDeg: 45, defaultPower: 0.5, defaultPitchDeg: 0 },
  turn: { settleSteps: 30, maxShotSeconds: 20 },
};
```

O eixo **+z aponta para o jogador** e o **−z para o fundo da arena**; o chão é o plano XZ, com o topo em y = 0.

### 1.2 Tipos

`src/core/types.ts` define `Vec2` (ponto no chão, `{x, z}`), `Vec3`, `Triangle`, `MarbleDef` (id, papel `'shooter' | 'stake'`, dono, cores, padrão), `ShotParams` (`yawDeg`, `power`, `pitchDeg`), `GamePhase` (os 8 estados do §13) e `ShotResult`. Convenção do ângulo horizontal: **yaw 0 = para o fundo (−z), yaw 90 = para a direita (+x)**.

### 1.3 Geometria: triângulo e captura

```ts
// src/core/geometry.ts
// Geometria do chão: triângulo, captura e distância até a linha de referência.
// Tudo em 2D (plano XZ), porque as regras só olham onde a bolinha parou no chão.

import type { Triangle, Vec2 } from './types';

/**
 * Triângulo equilátero com o centroide em `center`.
 * A ponta aponta para o fundo da arena (−z) e a base fica voltada para o jogador (+z).
 */
export function makeEquilateralTriangle(center: Vec2, side: number): Triangle {
  const h = (side * Math.sqrt(3)) / 2;
  return {
    a: { x: center.x, z: center.z - (2 * h) / 3 },
    b: { x: center.x - side / 2, z: center.z + h / 3 },
    c: { x: center.x + side / 2, z: center.z + h / 3 },
  };
}

function cross(o: Vec2, a: Vec2, b: Vec2): number {
  return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
}

/** Ponto dentro do triângulo (a borda conta como dentro). */
export function isPointInTriangle(p: Vec2, t: Triangle): boolean {
  const d1 = cross(t.a, t.b, p);
  const d2 = cross(t.b, t.c, p);
  const d3 = cross(t.c, t.a, p);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

export function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const lenSq = abx * abx + abz * abz;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / lenSq));
  return Math.hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t));
}

/** Menor distância do ponto até a borda do triângulo. */
export function distanceToTriangleEdges(p: Vec2, t: Triangle): number {
  return Math.min(distanceToSegment(p, t.a, t.b), distanceToSegment(p, t.b, t.c), distanceToSegment(p, t.c, t.a));
}

/**
 * Regra da captura (GDD §4.3): só vale quando o corpo inteiro da bolinha
 * saiu, ou seja, o centro está fora e a borda mais próxima está a pelo menos
 * um raio de distância.
 */
export function isFullyOutsideTriangle(center: Vec2, radius: number, t: Triangle): boolean {
  return !isPointInTriangle(center, t) && distanceToTriangleEdges(center, t) >= radius;
}

/** O contrário da captura: o corpo inteiro está dentro (usado para validar a arrumação). */
export function isFullyInsideTriangle(center: Vec2, radius: number, t: Triangle): boolean {
  return isPointInTriangle(center, t) && distanceToTriangleEdges(center, t) >= radius;
}

/**
 * Distância perpendicular absoluta até uma linha infinita que passa por `a` e `b`
 * (rodada de abertura, GDD §4.1: passar da linha é permitido).
 */
export function distanceToLine(p: Vec2, a: Vec2, b: Vec2): number {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  return Math.abs(cross(a, b, p)) / len;
}
```

### 1.4 Arrumação das casadas

```ts
// src/core/rack.ts
import type { Vec2 } from './types';

/**
 * Posições das casadas num triângulo compacto (1, 2, 3, 4... por fileira),
 * com a ponta para o fundo da arena e o conjunto centrado em `center`.
 * A última fileira pode ficar incompleta; ela é centralizada.
 * `spacing` é a distância entre centros vizinhos (2 × raio + folga).
 */
export function rackPositions(count: number, center: Vec2, spacing: number): Vec2[] {
  const rowStep = (spacing * Math.sqrt(3)) / 2;
  const points: Vec2[] = [];
  for (let row = 0; points.length < count; row++) {
    const inRow = Math.min(row + 1, count - points.length);
    for (let i = 0; i < inRow; i++) {
      points.push({ x: (i - (inRow - 1) / 2) * spacing, z: row * rowStep });
    }
  }
  const meanX = points.reduce((s, p) => s + p.x, 0) / points.length;
  const meanZ = points.reduce((s, p) => s + p.z, 0) / points.length;
  return points.map((p) => ({ x: p.x - meanX + center.x, z: p.z - meanZ + center.z }));
}
```

### 1.5 Do controle ao impulso

```ts
// src/core/shot.ts
import type { ShotParams, Vec2, Vec3 } from './types';

const DEG = Math.PI / 180;

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Normaliza um ângulo para o intervalo (−180, 180]. */
export function wrapDeg(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Vetor unitário da direção inicial do tiro (yaw 0 = −z, yaw 90 = +x; pitch sobe). */
export function shotDirection(yawDeg: number, pitchDeg: number): Vec3 {
  const yaw = yawDeg * DEG;
  const pitch = pitchDeg * DEG;
  return {
    x: Math.sin(yaw) * Math.cos(pitch),
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * Math.cos(pitch),
  };
}

/** Impulso do tiro: direção × força × impulso máximo. Força e ângulo fora da faixa são limitados. */
export function shotImpulse(params: ShotParams, maxImpulse: number, maxPitchDeg: number): Vec3 {
  const power = clamp(params.power, 0, 1);
  const dir = shotDirection(params.yawDeg, clamp(params.pitchDeg, 0, maxPitchDeg));
  const k = power * maxImpulse;
  return { x: dir.x * k, y: dir.y * k, z: dir.z * k };
}

/** Yaw que aponta de `from` para `to` no chão (usado pela mira do mouse e pela IA). */
export function yawTowards(from: Vec2, to: Vec2): number {
  return Math.atan2(to.x - from.x, -(to.z - from.z)) / DEG;
}
```

A força entra **linear no impulso**, então a velocidade inicial também é linear, e a distância percorrida cresce com o quadrado da força (com o dobro da força a bolinha vai quase 4 vezes mais longe). É o comportamento físico esperado; se ficar difícil de dosar tiros curtos, a curva de força pode mudar aqui sem mexer em mais nada.

### 1.6 Captura e toques diretos

```ts
// src/core/ScoringSystem.ts
import { isFullyOutsideTriangle } from './geometry';
import type { Triangle, Vec2 } from './types';

export interface StakeAtRest {
  id: string;
  position: Vec2;
}

export function findCapturedStakes(stakes: StakeAtRest[], triangle: Triangle, radius: number): string[] {
  return stakes.filter((s) => isFullyOutsideTriangle(s.position, radius, triangle)).map((s) => s.id);
}
```

```ts
// src/core/CollisionSystem.ts
// Registra os contatos de um tiro. A física avisa cada par que começou a se
// tocar; aqui só guardamos os toques DIRETOS da bolinha de tiro, porque a
// eliminação (GDD §4.4) não conta colisões indiretas.

export class CollisionSystem {
  private shooterId: string | null = null;
  private directHits = new Set<string>();

  /** Começa um tiro novo, esquecendo os contatos do anterior. */
  beginShot(shooterId: string): void {
    this.shooterId = shooterId;
    this.directHits.clear();
  }

  /** Chamado pela física para cada par de bolinhas que começou a se tocar. */
  onContact(a: string, b: string): void {
    if (this.shooterId === null) return;
    if (a === this.shooterId) this.directHits.add(b);
    else if (b === this.shooterId) this.directHits.add(a);
  }

  get directHitIds(): string[] {
    return [...this.directHits];
  }
}
```

### 1.7 Testes

Em `tests/`: `geometry.test.ts` (triângulo aponta para −z; captura só com um raio de folga; distância à linha é absoluta), `rack.test.ts` (de 1 a 15 casadas ficam inteiras dentro, sem se encostar) e `shot.test.ts` (direções, limites de força e ângulo, `yawTowards` inverte `shotDirection`). Exemplo do caso que define a regra de captura:

```ts
it('centro fora mas encostando na linha não é captura', () => {
  expect(isFullyOutsideTriangle({ x: 0, z: baseZ + r / 2 }, r, tri)).toBe(false);
});

it('a um raio da linha já é captura', () => {
  expect(isFullyOutsideTriangle({ x: 0, z: baseZ + r }, r, tri)).toBe(true);
});
```

### ✅ Checkpoint da Fase 1
- `npm test` passa os testes de `geometry`, `rack` e `shot`.
- Nenhum arquivo de `src/core/` importa `three`, `react` ou `@dimforge/rapier3d-compat`.

#### Problemas comuns
- **Captura conta bolinha "encostada" na linha:** confira se o teste usa `isFullyOutsideTriangle` (centro fora **e** distância ≥ raio), não `!isPointInTriangle`.

Próxima fase: **Física com Rapier** — o mundo físico, a resistência ao rolamento e a detecção de "tudo parou".

---

# Parte 5 — Implementação Web: Fase 2 (Física com Rapier)

## Fase 2 — Física com Rapier

> Objetivo desta fase: um `PhysicsManager` que cria chão, tábuas e bolinhas, dá passos fixos, faz a bolinha rolar e parar como vidro na terra, avisa os contatos e diz quando o tiro acabou. Tudo testado sem tela.

### 2.1 `PhysicsManager`

```ts
// src/physics/PhysicsManager.ts
// Dono do mundo do Rapier: chão, paredes e bolinhas.
//
// Não conhece regras nem tela. Recebe tempo, dá passos FIXOS de simulação
// (mesmo tiro = mesmo resultado na mesma máquina) e responde perguntas
// ("onde está a bolinha X?", "tudo parou?"). Isso deixa a mesma classe servir
// ao jogo, aos testes e, no futuro, à IA simulando tiros e a um servidor.

import RAPIER from '@dimforge/rapier3d-compat';
import type { GameConfig } from '../config/gameConfig';
import type { Vec2, Vec3 } from '../core/types';

let initPromise: Promise<void> | null = null;

/** Carrega o WebAssembly do Rapier uma vez só. Precisa terminar antes de criar um PhysicsManager. */
export function initPhysics(): Promise<void> {
  initPromise ??= RAPIER.init();
  return initPromise;
}

interface MarbleBody {
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
}

export class PhysicsManager {
  /** Avisado a cada par de bolinhas que começa a se tocar (ids das bolinhas). */
  onContact: ((a: string, b: string) => void) | null = null;

  private readonly world: RAPIER.World;
  private readonly events = new RAPIER.EventQueue(true);
  private readonly marbles = new Map<string, MarbleBody>();
  private readonly idByCollider = new Map<number, string>();
  private accumulator = 0;
  private stillSteps = 0;

  constructor(private readonly cfg: GameConfig) {
    this.world = new RAPIER.World({ x: 0, y: -cfg.physics.gravity, z: 0 });
    this.world.timestep = cfg.physics.timeStep;
    this.buildArena();
  }

  /** Chão de terra batida e as quatro tábuas em volta da área jogável. */
  private buildArena(): void {
    const { arena, ground, wall } = this.cfg;
    const Rule = RAPIER.CoefficientCombineRule;

    // Chão: uma caixa grossa com o topo em y = 0. Restituição com regra Min,
    // para a terra "engolir" o quique mesmo que a bolinha de vidro seja elástica.
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(arena.width, 5, arena.depth)
        .setTranslation(0, -5, 0)
        .setFriction(ground.friction)
        .setRestitution(ground.restitution)
        .setRestitutionCombineRule(Rule.Min),
    );

    const hw = arena.width / 2;
    const hd = arena.depth / 2;
    const t = wall.thickness / 2;
    const h = wall.height / 2;
    const walls: Array<[number, number, number, number]> = [
      // [centro x, centro z, meia largura x, meia profundidade z]
      [0, -hd - t, hw + wall.thickness, t],
      [0, hd + t, hw + wall.thickness, t],
      [-hw - t, 0, t, hd],
      [hw + t, 0, t, hd],
    ];
    for (const [x, z, hx, hz] of walls) {
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(hx, h, hz)
          .setTranslation(x, h, z)
          .setFriction(wall.friction)
          .setRestitution(wall.restitution)
          .setRestitutionCombineRule(Rule.Min),
      );
    }
  }

  /** Cria uma bolinha parada, apoiada no chão em `pos`. */
  addMarble(id: string, pos: Vec2): void {
    const m = this.cfg.marble;
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(pos.x, m.radius, pos.z)
        .setAngularDamping(m.angularDamping)
        .setCcdEnabled(true)
        .setCanSleep(true),
    );
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.ball(m.radius)
        .setDensity(m.density)
        .setFriction(m.friction)
        .setRestitution(m.restitution)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body,
    );
    this.marbles.set(id, { body, collider });
    this.idByCollider.set(collider.handle, id);
  }

  removeMarble(id: string): void {
    const m = this.marbles.get(id);
    if (!m) return;
    this.idByCollider.delete(m.collider.handle);
    this.world.removeRigidBody(m.body);
    this.marbles.delete(id);
  }

  hasMarble(id: string): boolean {
    return this.marbles.has(id);
  }

  /** Massa da bolinha em gramas (vem da densidade × volume). */
  marbleMass(): number {
    const first = this.marbles.values().next().value as MarbleBody | undefined;
    if (first) return first.body.mass();
    const r = this.cfg.marble.radius;
    return this.cfg.marble.density * (4 / 3) * Math.PI * r * r * r;
  }

  applyImpulse(id: string, impulse: Vec3): void {
    const m = this.marbles.get(id);
    if (!m) return;
    m.body.applyImpulse(impulse, true);
    this.stillSteps = 0;
  }

  /**
   * Avança a simulação por `dt` segundos de tempo real usando passos fixos.
   * O que sobra fica no acumulador para o próximo quadro. Devolve quantos passos deu.
   */
  advance(dt: number): number {
    const step = this.cfg.physics.timeStep;
    this.accumulator = Math.min(this.accumulator + dt, step * this.cfg.physics.maxStepsPerFrame);
    let steps = 0;
    while (this.accumulator >= step) {
      this.stepOnce();
      this.accumulator -= step;
      steps++;
    }
    return steps;
  }

  /** Um passo fixo: resistência ao rolamento, passo do Rapier, eventos de contato e checagem de repouso. */
  stepOnce(): void {
    this.applyRollingResistance();
    this.world.step(this.events);
    this.events.drainCollisionEvents((h1, h2, started) => {
      if (!started || !this.onContact) return;
      const a = this.idByCollider.get(h1);
      const b = this.idByCollider.get(h2);
      if (a !== undefined && b !== undefined) this.onContact(a, b);
    });
    this.stillSteps = this.allStill() ? this.stillSteps + 1 : 0;
  }

  /**
   * O Rapier não tem atrito de rolamento: uma esfera perfeita rolaria para sempre.
   * Aqui tiramos `rr × g × dt` da velocidade horizontal de toda bolinha apoiada
   * no chão, e o mesmo tanto (em proporção) da rotação, para ela continuar rolando
   * sem deslizar. Bolinha bem devagar é parada de vez e posta para dormir.
   */
  private applyRollingResistance(): void {
    const m = this.cfg.marble;
    const dt = this.cfg.physics.timeStep;
    const decel = m.rollingResistance * this.cfg.physics.gravity * dt;
    for (const { body } of this.marbles.values()) {
      if (body.isSleeping()) continue;
      const p = body.translation();
      if (p.y > m.radius + 0.05) continue; // no ar: só gravidade
      const v = body.linvel();
      const w = body.angvel();
      const hs = Math.hypot(v.x, v.z);
      const ws = Math.hypot(w.x, w.y, w.z);
      if (hs < m.stopLinearSpeed && Math.abs(v.y) < m.stopLinearSpeed && ws < m.stopAngularSpeed) {
        body.setLinvel({ x: 0, y: 0, z: 0 }, false);
        body.setAngvel({ x: 0, y: 0, z: 0 }, false);
        body.sleep();
        continue;
      }
      if (hs === 0) continue;
      const k = Math.max(0, hs - decel) / hs;
      body.setLinvel({ x: v.x * k, y: v.y, z: v.z * k }, true);
      body.setAngvel({ x: w.x * k, y: w.y * k, z: w.z * k }, true);
    }
  }

  private allStill(): boolean {
    const m = this.cfg.marble;
    for (const { body } of this.marbles.values()) {
      if (body.isSleeping()) continue;
      const v = body.linvel();
      const w = body.angvel();
      if (Math.hypot(v.x, v.y, v.z) >= m.stopLinearSpeed || Math.hypot(w.x, w.y, w.z) >= m.stopAngularSpeed) return false;
    }
    return true;
  }

  /** Tudo parado há `settleSteps` passos seguidos: o tiro acabou. */
  isSettled(): boolean {
    return this.stillSteps >= this.cfg.turn.settleSteps;
  }

  /** Para tudo na hora (tiro que estourou o tempo máximo). */
  freezeAll(): void {
    for (const { body } of this.marbles.values()) {
      body.setLinvel({ x: 0, y: 0, z: 0 }, false);
      body.setAngvel({ x: 0, y: 0, z: 0 }, false);
      body.sleep();
    }
    this.stillSteps = this.cfg.turn.settleSteps;
  }

  getPosition(id: string): Vec3 | null {
    const m = this.marbles.get(id);
    if (!m) return null;
    const p = m.body.translation();
    return { x: p.x, y: p.y, z: p.z };
  }

  /** Rotação como quatérnio {x, y, z, w}, para a tela girar a bolinha. */
  getRotation(id: string): { x: number; y: number; z: number; w: number } | null {
    const m = this.marbles.get(id);
    return m ? m.body.rotation() : null;
  }

  getGroundPosition(id: string): Vec2 | null {
    const p = this.getPosition(id);
    return p ? { x: p.x, z: p.z } : null;
  }

  getSpeed(id: string): number {
    const m = this.marbles.get(id);
    if (!m) return 0;
    const v = m.body.linvel();
    return Math.hypot(v.x, v.y, v.z);
  }

  /** Libera a memória do WebAssembly. O objeto não pode ser usado depois. */
  dispose(): void {
    this.events.free();
    this.world.free();
    this.marbles.clear();
    this.idByCollider.clear();
  }
}
```

**Decisões que valem explicar:**

- **Escala em centímetros.** Com 1 unidade = 1 m, a bolinha teria 0,008 de raio, pequeno demais para as tolerâncias padrão de um motor de física. Em centímetros ela tem 0,8, e basta usar a gravidade em cm/s² (981) para o movimento continuar real.
- **Passo de 1/120 s e CCD.** Uma bolinha a 350 cm/s anda ~3 cm por passo, quase dois diâmetros. O passo menor e o CCD (detecção contínua de colisão) evitam que ela atravesse outra bolinha ou uma tábua.
- **Regra de combinação "Min" no chão e nas tábuas.** O Rapier combina a restituição dos dois corpos de um contato. Com "Min" no chão, o contato bolinha-terra usa 0,15, mas bolinha-bolinha continua usando 0,9 (a média das duas). É o que faz o vidro "estalar" contra o vidro e morrer na terra.
- **Repouso em duas etapas.** Cada bolinha lenta é zerada e posta para dormir (senão ficaria tremendo para sempre). O tiro só termina depois de 30 passos seguidos com tudo parado, para não encerrar no instante em que duas bolinhas param de se tocar e uma terceira ainda vai ser atingida.

### 2.2 Testes com a física de verdade

`tests/physics.test.ts` roda o mesmo `PhysicsManager` no Node:

| Teste | O que prova |
|---|---|
| casadas paradas continuam paradas e dentro | a arrumação não "explode" nem conta captura sozinha |
| um tiro forte no triângulo tira casadas inteiras para fora | o item 9 da implementação do Marco 1: bolinhas saem do triângulo de verdade |
| nenhuma bolinha escapa da arena nem atravessa o chão | tábuas, chão e CCD funcionam, inclusive com tiro de 30° |
| tiro mais forte vai mais longe | força 40% anda bem mais que 20% |
| o mesmo tiro dá o mesmo resultado | passo fixo = resultado determinístico na mesma máquina |
| com ângulo vertical a bolinha sai do chão e volta | 40° e 50% sobem ~7 cm e pousam |

O teste do tiro forte, resumido:

```ts
it('um tiro forte no triângulo tira casadas inteiras para fora', () => {
  const { physics, stakeIds } = setup();
  settleRack(physics);
  const seconds = runShot(physics, aimAtRack); // força 100%, mirando no centro do triângulo
  expect(physics.isSettled()).toBe(true);
  expect(seconds).toBeLessThan(cfg.turn.maxShotSeconds);
  const stakes = stakeIds.map((id) => ({ id, position: physics.getGroundPosition(id)! }));
  const captured = findCapturedStakes(stakes, tri, cfg.marble.radius);
  expect(captured.length).toBeGreaterThan(0);
  physics.dispose();
});
```

### ✅ Checkpoint da Fase 2
- `npm test` passa os 6 testes de física (23 testes no total).
- O teste do tiro forte imprime algo como `tiro cheio: 1 capturadas em 1.5 s`.

#### Problemas comuns
- **`RAPIER.World is not a constructor` ou erro de WebAssembly:** `initPhysics()` precisa ter terminado (`await`) antes do `new PhysicsManager`.
- **Bolinha rola para sempre:** o Rapier não tem atrito de rolamento; confira se `stepOnce` chama `applyRollingResistance` antes do `world.step`.
- **Bolinha afunda ~1,5 mm no chão durante um deslize rápido:** é a tolerância do solver de contato e some quando a bolinha passa a rolar. Na distância da câmera não aparece; se aparecer, teste `world.integrationParameters.contact_natural_frequency` maior.

Próxima fase: **Estado e GameManager** — o fluxo mirar → atirar → esperar → contar.

---

# Parte 6 — Implementação Web: Fase 3 (Estado e GameManager)

## Fase 3 — Estado e GameManager

> Objetivo desta fase: um `GameManager` que monta a rodada, aplica o tiro, espera tudo parar, conta as capturas e devolve a vez, escrevendo num store do Zustand que a interface vai ler.

### 3.1 O store

`src/game/store.ts` usa o `createStore` de `zustand/vanilla` (store que não depende do React), para o `GameManager` escrever nele de fora do React. Os componentes leem com um hook:

```ts
export const gameStore = createStore<GameStore>()((set) => ({
  phase: 'AIMING',
  shots: 0,
  captured: 0,
  stakesTotal: 0,
  stakesRemaining: 0,
  marbleIds: [],
  aim: { yawDeg: 0, power: GAME_CONFIG.shot.defaultPower, pitchDeg: GAME_CONFIG.shot.defaultPitchDeg, locked: false },
  followCam: false,
  toast: null,

  setYaw: (deg) => set((s) => ({ aim: { ...s.aim, yawDeg: wrapDeg(deg) } })),
  rotateYaw: (delta) => set((s) => ({ aim: { ...s.aim, yawDeg: wrapDeg(s.aim.yawDeg + delta) } })),
  setPower: (power) => set((s) => ({ aim: { ...s.aim, power: clamp(power, 0, 1) } })),
  setPitch: (deg) => set((s) => ({ aim: { ...s.aim, pitchDeg: clamp(deg, 0, GAME_CONFIG.shot.maxPitchDeg) } })),
  setLocked: (locked) => set((s) => ({ aim: { ...s.aim, locked } })),
  toggleFollowCam: () => set((s) => ({ followCam: !s.followCam })),
  showToast: (text) => set({ toast: { id: ++toastId, text } }),
}));

/** Hook para os componentes React lerem um pedaço do estado. */
export function useGame<T>(selector: (s: GameStore) => T): T {
  return useStore(gameStore, selector);
}
```

Os limites de força (0–1) e de ângulo (0°–45°) ficam nos setters: nenhum controle consegue pôr um valor inválido no estado.

### 3.2 `GameManager`

```ts
// src/game/GameManager.ts
// Amarra física, regras e estado. No Marco 1 é um modo "treino" de um jogador:
// mirar → atirar → esperar tudo parar → contar capturas → mirar de novo.
//
// Não conhece React nem Three.js: quem desenha lê `physics` e o store.
// O Marco 2 acrescenta aqui o TurnManager (vez de cada jogador), a rodada de
// abertura e a eliminação, sem mexer na física nem na tela.

import type { GameConfig } from '../config/gameConfig';
import { CollisionSystem } from '../core/CollisionSystem';
import { makeEquilateralTriangle } from '../core/geometry';
import { rackPositions } from '../core/rack';
import { findCapturedStakes } from '../core/ScoringSystem';
import { shotImpulse, yawTowards } from '../core/shot';
import type { MarbleDef, MarblePattern, Triangle, Vec2 } from '../core/types';
import { PhysicsManager } from '../physics/PhysicsManager';
import type { GameStoreApi } from './store';

export const SHOOTER_ID = 'shooter-p1';

// Cores das casadas: uma por bolinha, repetindo se houver mais de 10.
const STAKE_LOOKS: Array<{ color: string; accent: string; pattern: MarblePattern }> = [
  { color: '#3fa7ff', accent: '#ffd23f', pattern: 'olho-de-gato' },
  // ... 10 combinações de cor, destaque e padrão (lista completa no protótipo)
];

export class GameManager {
  physics: PhysicsManager;
  readonly triangle: Triangle;
  private readonly collisions = new CollisionSystem();
  private readonly defs = new Map<string, MarbleDef>();
  private stakeIds: string[] = [];
  private shotTime = 0;

  constructor(
    readonly cfg: GameConfig,
    private readonly store: GameStoreApi,
  ) {
    this.triangle = makeEquilateralTriangle({ x: cfg.triangle.centerX, z: cfg.triangle.centerZ }, cfg.triangle.side);
    this.physics = this.createPhysics();
  }

  private createPhysics(): PhysicsManager {
    const physics = new PhysicsManager(this.cfg);
    physics.onContact = (a, b) => this.collisions.onContact(a, b);
    return physics;
  }

  get triangleCenter(): Vec2 {
    return { x: this.cfg.triangle.centerX, z: this.cfg.triangle.centerZ };
  }

  def(id: string): MarbleDef {
    const d = this.defs.get(id);
    if (!d) throw new Error(`Bolinha desconhecida: ${id}`);
    return d;
  }

  /** Monta uma rodada nova: mundo físico limpo, casadas no triângulo e a bolinha de tiro na área de tiro. */
  newRack(): void {
    this.physics.dispose();
    this.physics = this.createPhysics();
    this.defs.clear();

    const { cfg } = this;
    const spacing = cfg.marble.radius * 2 + cfg.stakes.gap;
    const positions = rackPositions(cfg.stakes.count, this.triangleCenter, spacing);
    this.stakeIds = positions.map((pos, i) => {
      const id = `stake-${i}`;
      this.defs.set(id, { id, role: 'stake', ...STAKE_LOOKS[i % STAKE_LOOKS.length] });
      this.physics.addMarble(id, pos);
      return id;
    });

    const start = { x: cfg.shooter.startX, z: cfg.shooter.startZ };
    this.defs.set(SHOOTER_ID, { id: SHOOTER_ID, role: 'shooter', ownerId: 'p1', color: '#d62828', accent: '#fdf0d5', pattern: 'leitosa' });
    this.physics.addMarble(SHOOTER_ID, start);

    this.shotTime = 0;
    this.store.setState((s) => ({
      phase: 'AIMING',
      shots: 0,
      captured: 0,
      stakesTotal: this.stakeIds.length,
      stakesRemaining: this.stakeIds.length,
      marbleIds: [...this.stakeIds, SHOOTER_ID],
      aim: { ...s.aim, yawDeg: yawTowards(start, this.triangleCenter), locked: false },
      toast: null,
    }));
  }

  /** Confirma o tiro com a mira atual. Ignorado se não for hora de mirar. */
  shoot(): void {
    const s = this.store.getState();
    if (s.phase !== 'AIMING' || s.aim.power <= 0) return;
    const { shot } = this.cfg;
    this.collisions.beginShot(SHOOTER_ID);
    this.physics.applyImpulse(SHOOTER_ID, shotImpulse(s.aim, shot.maxImpulse, shot.maxPitchDeg));
    this.shotTime = 0;
    this.store.setState({ phase: 'SHOT_IN_PROGRESS', shots: s.shots + 1 });
  }

  /** Chamado a cada quadro de tela com o tempo real que passou. */
  update(dt: number): void {
    this.physics.advance(dt);
    if (this.store.getState().phase !== 'SHOT_IN_PROGRESS') return;
    this.shotTime += dt;
    if (this.shotTime > this.cfg.turn.maxShotSeconds) this.physics.freezeAll();
    if (this.physics.isSettled()) this.resolveTurn();
  }

  /** Tudo parou: conta as casadas que saíram inteiras do triângulo, tira da arena e volta a mirar. */
  private resolveTurn(): void {
    this.store.setState({ phase: 'RESOLVING_TURN' });
    const stakes = this.stakeIds.map((id) => ({ id, position: this.physics.getGroundPosition(id)! }));
    const capturedIds = findCapturedStakes(stakes, this.triangle, this.cfg.marble.radius);
    for (const id of capturedIds) this.physics.removeMarble(id);
    this.stakeIds = this.stakeIds.filter((id) => !capturedIds.includes(id));

    const s = this.store.getState();
    const remaining = this.stakeIds.length;
    const hits = this.collisions.directHitIds.length;
    if (capturedIds.length > 0) s.showToast(capturedIds.length === 1 ? '+1 casada capturada!' : `+${capturedIds.length} casadas capturadas!`);
    else if (hits === 0) s.showToast('Não acertou nenhuma bolinha');
    else s.showToast('Nenhuma saiu inteira do triângulo');

    this.store.setState({
      phase: remaining === 0 ? 'GAME_OVER' : 'AIMING',
      captured: s.captured + capturedIds.length,
      stakesRemaining: remaining,
      marbleIds: [...this.stakeIds, SHOOTER_ID],
      aim: { ...s.aim, locked: false },
    });
  }
}
```

- **`newRack` recria o mundo físico inteiro** em vez de mover bolinhas de volta: garante um começo limpo (sem bolinha dormindo em estado estranho) e é o mesmo caminho que uma partida nova vai usar.
- **A física anda sempre**, não só durante o tiro, para as casadas assentarem logo depois de criadas.

### ✅ Checkpoint da Fase 3
- `npx tsc --noEmit` passa.
- (Opcional) num teste, `newRack()` → `shoot()` → chamar `update(1/60)` em loop até `phase` voltar a `AIMING`; `shots` vale 1.

Próxima fase: **Cena 3D, Mira e Câmera** — desenhar tudo e controlar com o mouse.

---

# Parte 7 — Implementação Web: Fase 4 (Cena 3D, Mira e Câmera)

## Fase 4 — Cena 3D, Mira e Câmera

> Objetivo desta fase: a arena aparece em 3D com sombras e reflexos, as bolinhas acompanham a física, a seta de mira segue o mouse e a câmera gira e dá zoom.

### 4.1 `App` e a ordem do quadro

`src/App.tsx` espera `initPhysics()`, cria o `GameManager`, chama `newRack()` e monta o `<Canvas shadows>` do React Three Fiber com o HUD por cima. Em `src/render/Scene.tsx`, o primeiro filho é o `GameLoop`:

```tsx
function GameLoop({ game }: { game: GameManager }) {
  // dt limitado: se a aba ficou em segundo plano, não tenta recuperar segundos de física.
  useFrame((_, dt) => game.update(Math.min(dt, 0.1)));
  return null;
}
```

O React Three Fiber chama os `useFrame` na ordem em que os componentes montaram. Com o `GameLoop` primeiro, a física anda antes de as bolinhas copiarem a posição, no mesmo quadro.

### 4.2 Arena e materiais (`Arena.tsx`, `materials.ts`)

- **Chão:** um plano com textura de terra desenhada num `<canvas>` (base areia, manchas, grãos e pedrinhas, com gerador aleatório de semente fixa). As manchas são desenhadas também do outro lado das bordas, para a textura repetir sem emenda.
- **Tábuas:** caixas marrons com exatamente as medidas das paredes da física.
- **Riscos no chão:** o triângulo, a linha de referência e o contorno da área de tiro são caixas finíssimas deitadas no chão (`GroundStrip`), sem colisão. Linhas do WebGL têm sempre 1 pixel de largura, por isso caixas.
- **Entorno:** 140 pedras, tufos de capim e folhas espalhados fora das tábuas, sempre nos mesmos lugares.
- **Bolinhas (`Marble.tsx`):** olho-de-gato = esfera de `MeshPhysicalMaterial` com `transmission: 1` (vidro) e três esferas achatadas coloridas cruzadas dentro; leitosa = vidro opaco com textura de espiral em canvas e `clearcoat`. Cada bolinha copia posição e rotação do corpo físico em `useFrame`.
- **Reflexo sem baixar HDR:** um `RoomEnvironment` do próprio Three.js vira o `scene.environment` via `PMREMGenerator`.
- **Luz:** `hemisphereLight` quente + `directionalLight` com sombra (mapa 2048, caixa de sombra cobrindo a arena).

### 4.3 Mira (`AimArrow.tsx`)

A seta lê o store direto em `useFrame` (`gameStore.getState()`), sem re-render do React. A rotação usa a ordem de Euler `YXZ`: primeiro inclina para cima (X = ângulo vertical), depois gira no chão (Y = −yaw), então a seta aponta exatamente para onde o impulso vai:

```tsx
pivot.current!.rotation.set(s.aim.pitchDeg * DEG, -s.aim.yawDeg * DEG, 0, 'YXZ');
const len = MIN_LEN + s.aim.power * (MAX_LEN - MIN_LEN);
shaft.current!.scale.set(1, len, 1);
// Verde (fraco) → amarelo → vermelho (forte)
color.current.setHSL(0.33 * (1 - s.aim.power), 0.85, 0.5);
```

`AimSurface` é um plano invisível no chão. Com o mouse em cima dele, a direção vira `yawTowards(bolinha de tiro, ponto do mouse)`; o clique trava ou destrava. O movimento é ignorado com o botão direito ou do meio apertado (`e.buttons & 6`), senão girar a câmera mexeria na mira.

### 4.4 Teclado (`input/keyboard.ts`)

Liga A/D e ←/→ (direção, Shift = fino), W/S e ↑/↓ (força), Q/E (ângulo), L (trava), F (câmera segue), Espaço/Enter (atirar). Tudo vira chamada no store ou `game.shoot()`: o Marco 4 troca por toque ou IA sem mexer no `GameManager`.

### 4.5 Câmera (`CameraController.tsx`)

Câmera orbital feita à mão: guarda um "desejado" (`yaw`, `elevation`, `distance`) que o mouse altera, e a câmera persegue o desejado com suavização independente do FPS (`1 - exp(-taxa × dt)`).

- Visão geral: yaw 0 (atrás do jogador), 50° de elevação, 175 cm de distância.
- Botão direito/do meio arrastando gira (elevação entre 22° e 85°); roda dá zoom (35 a 340 cm); C ou Home volta à visão geral.
- Mirando, o alvo fica a 35% do caminho entre o triângulo e a bolinha de tiro.
- Com "câmera segue" ligada, durante o tiro o alvo segue a bolinha de tiro e a distância encurta para 80 cm; quando tudo para, o alvo volta sozinho.

### ✅ Checkpoint da Fase 4
- A arena aparece com sombra das tábuas e das bolinhas; de perto, as olho-de-gato mostram vidro colorido com brilho e as leitosas mostram a espiral.
- Mexer o mouse no chão gira a seta; clicar trava; W/S faz a seta crescer e ficar vermelha; Q/E inclina a seta para cima.
- Espaço atira: a bolinha rola, bate nas casadas, as casadas espalham e param; a seta some enquanto rola e volta quando tudo para.
- Girar a câmera com o botão direito não muda a direção da mira.

#### Problemas comuns
- **Bolinhas "atrasadas" um quadro em relação à física:** o `GameLoop` precisa ser o primeiro filho da cena.
- **Tela preta nas bolinhas de vidro:** `transmission` precisa de um `scene.environment`; confira o `ReflectionEnvironment`.
- **Menu do botão direito aparece ao girar:** o `contextmenu` do canvas precisa de `preventDefault()` (feito no `CameraController`).

Próxima fase: **HUD** — placar, medidor de força e avisos.

---

# Parte 8 — Implementação Web: Fase 5 (HUD)

## Fase 5 — HUD

> Objetivo desta fase: a interface do §8 que o Marco 1 precisa, em React comum por cima do canvas.

### 5.1 Componentes (`ui/Hud.tsx`)

| Componente | Mostra | Lê do store |
|---|---|---|
| `StatusPanel` | título, fase (com cor por fase), jogador e cor, capturadas, casadas no triângulo, tiros, objetivo | `phase`, `captured`, `stakesRemaining`, `stakesTotal`, `shots` |
| `AimPanel` | direção (e se está travada), medidor de força com %, slider de força, slider de ângulo, botão "Atirar", botão "Câmera segue" | `aim`, `phase`, `followCam` |
| `Help` | lista de controles, recolhível | — |
| `ToastView` | aviso animado do resultado do tiro ("+2 casadas capturadas!") | `toast` |
| `ClearedOverlay` | "Triângulo limpo!" com tiros e botão de recomeçar | `phase`, `shots`, `captured` |

O botão "Atirar" fica desligado fora de `AIMING`, cumprindo "controles desligados enquanto as bolinhas se movem". Cada componente lê só o pedaço do estado que usa (`useGame((s) => s.shots)`), então mexer na força não re-renderiza o placar.

### 5.2 Estilo (`ui/hud.css`)

Painéis escuros translúcidos com `backdrop-filter`, cantos arredondados, números com `tabular-nums` (não "pulam" quando mudam), animações curtas (`pop` na troca de fase, aviso que sobe e some). Abaixo de 720 px de largura, a ajuda some e o painel de status estica: o ponto de partida para o celular.

### ✅ Checkpoint da Fase 5
- O medidor de força acompanha W/S e o slider, e muda de verde para vermelho.
- Durante o tiro, a fase mostra "Bolinhas rolando…" e o botão fica cinza.
- Depois do tiro, aparece o aviso com o resultado, e "Capturadas" e "No triângulo" atualizam.
- Ao capturar a última casada, aparece "Triângulo limpo!"; "Arrumar de novo" recomeça.

Próxima fase: **Build, Deploy e Próximos Passos**.

---

# Parte 9 — Implementação Web: Fase 6 (Build, Deploy e Próximos Passos)

## Fase 6 — Build, Deploy e Próximos Passos

> Objetivo desta fase: o Marco 1 publicado no site do estúdio, e o caminho dos Marcos 2 a 4 planejado.

### 6.1 Rodar localmente

```bash
cd prototipos/marble-arena
npm install
npm run dev        # http://localhost:5173
npm test
npm run build      # gera dist/
npm run preview    # serve o dist/ em http://localhost:4173
```

### 6.2 Deploy

O `.github/workflows/deploy-site.yml` copia `prototipos/` para o site e, num passo próprio, roda `npm ci`, `npm test` e `npm run build` dentro de `prototipos/marble-arena/` e troca a pasta copiada pelo `dist/`. Se um teste falhar, o site não é publicado. Como o `vite.config.ts` usa `base: './'`, o build funciona em `/gdd/prototipos/marble-arena/` sem configurar o caminho.

### 6.3 Marco 2 — Regras completas

1. **`Player` e `MatchState` em `src/core/`:** id, nome, cor, humano/IA, bolinha de tiro, capturas, eliminações, ativo/eliminado. Funções puras de transição (`applyShotResult(state, result) → state`), para testar sem física.
2. **`TurnManager` (puro):** a ordem vem da abertura; `nextActivePlayer` pula os eliminados. Testes: ordem pela distância, pular eliminado, último jogador ativo vence.
3. **Rodada de abertura:** fase `OPENING_ROUND`; cada jogador atira uma bolinha temporária da área de tiro; quando tudo para, `distanceToLine` (já pronta) ordena; empates (tolerância do §4.1) repetem só entre os empatados.
4. **Eliminação:** no fim do tiro, todo id em `CollisionSystem.directHitIds` que for bolinha de tiro de adversário ativo elimina o dono; a bolinha sai da arena.
5. **`RulesEngine` (puro):** recebe o resultado do tiro e devolve capturas, eliminações e vitória (última casada capturada pelo jogador da vez ou só um jogador ativo). Testes para cada condição de vitória.
6. **Tela de vitória:** vencedor, capturas, eliminações, total de tiros, duração (guardar o horário de início da partida).

### 6.4 Marco 3 — Polimento

Transição de câmera entre jogadores, partículas de poeira no impacto e no pouso (lendo os eventos de contato do `PhysicsManager`), sons de vidro e de terra com volume pela velocidade do impacto, materiais e luz melhores, animações de interface.

### 6.5 Marco 4 — IA e multiplayer local

- **Configuração da partida:** 2 a 4 jogadores, humano ou IA, nome e cor (`MATCH_SETUP`), e menu (`MAIN_MENU`).
- **`AIController`:** escolhe um alvo (a casada mais perto da borda do triângulo, ou às vezes a bolinha de um adversário), calcula `yawTowards`, escolhe a força pela distância e soma um erro aleatório de direção e de força que diminui com a dificuldade. O `PhysicsManager` roda sem tela, então a IA mais difícil pode simular alguns tiros candidatos num mundo copiado e escolher o melhor.

### 6.6 Preparação para o online

Já está pronto: regras puras, física sem tela e determinística na mesma máquina, input que vira chamadas simples. O que falta decidir está no §12 e no §6 (determinismo entre máquinas).

### ✅ Checkpoint da Fase 6
- `npm run build` termina sem erro e `npm run preview` joga igual ao `npm run dev`.
- Depois do push na `main`, o protótipo abre em `https://manguebyte.github.io/gdd/prototipos/marble-arena/` e aparece no hub de protótipos.

---

# Parte 10 — Guia de Implementação Unity (porte)

> Guia fase a fase para portar o **Marco 1** para Unity 6, para o caso de o jogo sair do navegador (lojas de celular, console) ou de o estúdio querer tudo na mesma engine. A versão web (Partes 2 a 9) continua sendo a primeira versão e a referência de comportamento: os nomes, os números e a separação em camadas são os mesmos, para os dois códigos poderem ser comparados linha a linha.
>
> **Em aberto:** se e quando o porte acontece. Este guia não substitui a versão web.

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele.
- **Escala: 1 unidade = 1 cm**, igual à versão web. A Unity assume metros por padrão, então a gravidade, os limites de velocidade e os limiares da física são ajustados na Fase 0.
- **Eixos:** o chão é o plano XZ com o topo em y = 0; o jogador fica do lado **+z** e o triângulo do lado **−z**. Nas regras puras, um ponto do chão é um `Vector2` em que **`.y` guarda o z do mundo** (comentado em cada uso).
- **Namespaces:**
  - `MarbleArena.Core`: regras puras (geometria, arrumação, tiro, captura, contatos). Não tem `MonoBehaviour`.
  - `MarbleArena.Config`: o `GameConfig` (ScriptableObject).
  - `MarbleArena.Physics`: arena, bolinhas e o `PhysicsManager`.
  - `MarbleArena.Game`: o `GameManager` e o estado da mira.
  - `MarbleArena.Input`, `MarbleArena.View`, `MarbleArena.UI`: input, desenho (seta, câmera) e HUD.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados do ScriptableObject:** campos públicos `camelCase`.
- **Uma cena só** (`Arena`), montada por código a partir do `GameConfig`.

## Arquitetura em uma página

```
 ShotInput (mouse/teclado) ──SetYaw/SetPower/SetPitch/Shoot──▶ GameManager ◀── HudController (lê e chama)
                                                                  │   (fase, placar, mira)
                                     Spawn/ApplyImpulse/IsSettled │
                                                                  ▼
 ArenaBuilder (chão, tábuas, riscos)       PhysicsManager ──▶ MarbleBody (Rigidbody + rolamento) × N
                                                 ▲ ReportContact        MarbleView (vidro/leitosa)
                                                 └──────────────── OnCollisionEnter
 MarbleArena.Core: MarbleGeometry, Rack, ShotMath, ScoringSystem, CollisionSystem (usados por todos acima)
 AimArrow e OrbitCamera leem GameManager + PhysicsManager a cada quadro.
```

---

# Parte 11 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 3D (URP) com a física configurada para a escala em centímetros e as pastas e pacotes do jogo.

### 0.1 Criar o projeto

1. Unity Hub → **New project** → template **Universal 3D** (URP), Unity 6 LTS.
2. Nome: `MarbleArena`.

### 0.2 Estrutura de pastas

```
Assets/_Project/
├─ Config/          # GameConfig.asset
├─ Materials/       # M_GlassTemplate, M_MilkyTemplate, M_Line, M_Wood
├─ Prefabs/         # Marble.prefab
├─ Scenes/          # Arena.unity
├─ Scripts/
│  ├─ Core/         # MarbleArena.Core.asmdef + regras puras
│  ├─ Config/
│  ├─ Physics/
│  ├─ Game/
│  ├─ Input/
│  ├─ View/
│  └─ UI/
└─ Tests/EditMode/  # testes das regras puras
```

**Assembly definitions** (botão direito → Create → Scripting → Assembly Definition) separam o código em "pacotes" que compilam sozinhos:

- `Scripts/Core/MarbleArena.Core.asmdef`: sem referências.
- `Scripts/MarbleArena.Runtime.asmdef` (na pasta `Scripts`, cobre tudo menos `Core`): referencia `MarbleArena.Core`, `Unity.InputSystem`, `Unity.TextMeshPro`, `UnityEngine.UI`.
- `Tests/EditMode/MarbleArena.Tests.asmdef`: referencia `MarbleArena.Core`; em **Platforms** marque só **Editor**; marque **Test Assemblies**.

Com isso, `Core` não consegue nem enxergar a física ou a tela, que é a garantia de que as regras ficam puras.

### 0.3 Pacotes

No **Package Manager**:

- **Input System** (aceite reiniciar o Editor; em **Project Settings → Player → Active Input Handling**, use **Input System Package**).
- **Test Framework** (já vem no template).
- **TextMeshPro** já vem com o uGUI no Unity 6; na primeira vez que criar um texto, aceite **Import TMP Essentials**.

Não usamos o Cinemachine: a câmera orbital é pequena e fica igual à da versão web (Fase 5).

### 0.4 Física na escala de centímetros

**Project Settings → Time:**
- **Fixed Timestep:** `0.0083333` (1/120 s, igual à web). É o "passo fixo": a Unity chama `FixedUpdate` e simula a física exatamente nesse intervalo, independentemente do FPS.

**Project Settings → Physics** (o `PhysicsManager` também aplica gravidade e passo por código, para não depender só desta tela):
- **Gravity:** `(0, -981, 0)`.
- **Bounce Threshold:** `20`. Abaixo dessa velocidade relativa (agora em cm/s) o contato não quica. O padrão (2) foi pensado para metros.
- **Sleep Threshold:** `1`. Energia por massa abaixo da qual o PhysX põe o corpo para dormir; o padrão (0,005) é minúsculo em centímetros.
- **Default Max Angular Speed:** `1000`. **Importante:** o padrão é 7 rad/s. Uma bolinha de 0,8 cm rolando a 350 cm/s gira a ~440 rad/s; com o limite padrão ela "patina" em vez de rolar.
- **Default Solver Iterations:** `8`.
- **Enhanced Determinism:** ligado (resultado igual para o mesmo tiro na mesma máquina, §6).

### 0.5 Cena

1. Crie `Scenes/Arena.unity` e apague o plano padrão, se houver.
2. **Main Camera:** Clipping Planes Near `1`, Far `3000` (em centímetros), Field of View `40`.
3. **Directional Light:** cor `#FFE0B0`, intensidade `2.4`, rotação `(50, -150, 0)`, Shadow Type **Soft Shadows**. No URP Asset (Settings → `PC_RPAsset`), **Max Distance** das sombras `600`.
4. **Lighting → Environment:** Environment Lighting Source **Gradient** (céu `#FFF1D6`, horizonte `#D9C7A8`, chão `#7A5A3A`). Adicione um **Reflection Probe** no centro da arena (Box Size `400 × 100 × 300`, Type **Baked**) e clique **Generate Lighting**: é o que reflete nas bolinhas.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console; as três assembly definitions aparecem no Project.
- **Edit → Project Settings → Physics** mostra gravidade `-981` e Max Angular Speed `1000`.

#### Problemas comuns
- **Erro "You are trying to read Input using the UnityEngine.Input class":** Active Input Handling está em "Input Manager (Old)". Troque para "Input System Package" ou "Both".

Próxima fase: **Configuração e Regras Puras**.

---

# Parte 12 — Implementação Unity: Fase 1 (Configuração e Regras Puras)

## Fase 1 — Configuração e Regras Puras

> Objetivo desta fase: o `GameConfig` com os números do §14 e as regras puras (triângulo, captura, arrumação, impulso, contatos) com testes passando no Test Runner.

### 1.1 `GameConfig`

```csharp
// Caminho: Assets/_Project/Scripts/Config/GameConfig.cs
using UnityEngine;

namespace MarbleArena.Config
{
    // POR QUE: todo número de jogo (tamanhos, atritos, impulso) num lugar só,
    // editável no Inspector sem mexer em código (GDD §14).
    // ESTRATÉGIA: um ScriptableObject é um "arquivo de dados" da Unity: um asset
    // no Project que guarda valores e pode ser arrastado para qualquer script.
    // Escala: 1 unidade = 1 cm. Pontos do chão são Vector2 com .y = z do mundo.
    [CreateAssetMenu(fileName = "GameConfig", menuName = "Marble Arena/Game Config")]
    public class GameConfig : ScriptableObject
    {
        [Header("Física")]
        public float timeStep = 1f / 120f;
        [Tooltip("Gravidade em cm/s².")]
        public float gravity = 981f;

        [Header("Bolinha")]
        public float marbleRadius = 0.8f;
        [Tooltip("g/cm³ — vidro ≈ 2,5. A massa sai do volume.")]
        public float marbleDensity = 2.5f;
        public float marbleFriction = 0.4f;
        public float marbleRestitution = 0.9f;
        [Tooltip("Desacelera rollingResistance × g cm/s² no chão.")]
        public float rollingResistance = 0.05f;
        public float angularDamping = 0.3f;
        public float stopLinearSpeed = 1f;
        public float stopAngularSpeed = 1.5f;

        [Header("Chão e tábuas")]
        public float groundFriction = 0.6f;
        public float groundRestitution = 0.15f;
        public float wallFriction = 0.3f;
        public float wallRestitution = 0.45f;
        public float wallHeight = 4f;
        public float wallThickness = 3f;

        [Header("Arena (o jogador fica do lado +z)")]
        public float arenaWidth = 180f;
        public float arenaDepth = 130f;
        [Tooltip("x, z do centro do triângulo.")]
        public Vector2 triangleCenter = new Vector2(0f, -5f);
        public float triangleSide = 36f;
        public int stakeCount = 10;
        public float stakeGap = 3f;
        public float shootingAreaCenterZ = 46f;
        public float shootingAreaDepth = 14f;
        public float shootingAreaWidth = 120f;
        public float referenceLineZ = -48f;
        [Tooltip("x, z de onde a bolinha de tiro começa.")]
        public Vector2 shooterStart = new Vector2(0f, 46f);

        [Header("Tiro")]
        [Tooltip("Impulso com força 100%, em g·cm/s.")]
        public float maxImpulse = 1900f;
        public float maxPitchDeg = 45f;
        [Range(0f, 1f)] public float defaultPower = 0.5f;
        public float defaultPitchDeg = 0f;

        [Header("Fim do tiro")]
        [Tooltip("Passos fixos seguidos com tudo parado para encerrar o tiro.")]
        public int settleSteps = 30;
        public float maxShotSeconds = 20f;

        // Massa de uma bolinha: densidade × volume da esfera (≈ 5,4 g).
        public float MarbleMass => marbleDensity * 4f / 3f * Mathf.PI * Mathf.Pow(marbleRadius, 3f);

        // Distância entre os centros de duas casadas vizinhas na arrumação.
        public float StakeSpacing => marbleRadius * 2f + stakeGap;
    }
}
```

Crie o asset: botão direito em `Config/` → **Create → Marble Arena → Game Config**.

### 1.2 `MarbleGeometry`

```csharp
// Caminho: Assets/_Project/Scripts/Core/MarbleGeometry.cs
using UnityEngine;

namespace MarbleArena.Core
{
    // Os três cantos do triângulo no chão (Vector2 com .y = z do mundo).
    public struct Triangle2
    {
        public Vector2 a, b, c;
    }

    // POR QUE: as regras de captura (GDD §4.3) e da rodada de abertura (§4.1)
    // são só geometria no chão; ficam aqui, sem física nem tela, para testar fácil.
    // ESTRATÉGIA: classe estática (não precisa de objeto na cena) com funções
    // puras: mesma entrada, mesma saída. Cópia fiel de src/core/geometry.ts.
    public static class MarbleGeometry
    {
        // Triângulo equilátero com o centroide em `center`, ponta para −z e base para o jogador (+z).
        public static Triangle2 EquilateralTriangle(Vector2 center, float side)
        {
            float h = side * Mathf.Sqrt(3f) / 2f;
            return new Triangle2
            {
                a = new Vector2(center.x, center.y - 2f * h / 3f),
                b = new Vector2(center.x - side / 2f, center.y + h / 3f),
                c = new Vector2(center.x + side / 2f, center.y + h / 3f),
            };
        }

        // Produto vetorial 2D: o sinal diz de que lado da reta o ponto está.
        private static float Cross(Vector2 o, Vector2 a, Vector2 b)
        {
            return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        }

        // Ponto dentro do triângulo (a borda conta como dentro): os três sinais não podem divergir.
        public static bool IsPointInTriangle(Vector2 p, Triangle2 t)
        {
            float d1 = Cross(t.a, t.b, p);
            float d2 = Cross(t.b, t.c, p);
            float d3 = Cross(t.c, t.a, p);
            bool hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
            bool hasPos = d1 > 0 || d2 > 0 || d3 > 0;
            return !(hasNeg && hasPos);
        }

        // Distância do ponto até o segmento a–b (projeta e limita a projeção ao segmento).
        public static float DistanceToSegment(Vector2 p, Vector2 a, Vector2 b)
        {
            Vector2 ab = b - a;
            float lenSq = ab.sqrMagnitude;
            float t = lenSq == 0f ? 0f : Mathf.Clamp01(Vector2.Dot(p - a, ab) / lenSq);
            return Vector2.Distance(p, a + ab * t);
        }

        // Menor distância do ponto até qualquer lado do triângulo.
        public static float DistanceToTriangleEdges(Vector2 p, Triangle2 t)
        {
            return Mathf.Min(DistanceToSegment(p, t.a, t.b),
                             Mathf.Min(DistanceToSegment(p, t.b, t.c), DistanceToSegment(p, t.c, t.a)));
        }

        // Captura: centro fora E a borda mais próxima a pelo menos um raio (o corpo inteiro saiu).
        public static bool IsFullyOutside(Vector2 center, float radius, Triangle2 t)
        {
            return !IsPointInTriangle(center, t) && DistanceToTriangleEdges(center, t) >= radius;
        }

        // O contrário: corpo inteiro dentro (valida a arrumação das casadas).
        public static bool IsFullyInside(Vector2 center, float radius, Triangle2 t)
        {
            return IsPointInTriangle(center, t) && DistanceToTriangleEdges(center, t) >= radius;
        }

        // Distância perpendicular absoluta até a reta infinita a–b (passar da linha vale).
        public static float DistanceToLine(Vector2 p, Vector2 a, Vector2 b)
        {
            return Mathf.Abs(Cross(a, b, p)) / Vector2.Distance(a, b);
        }
    }
}
```

### 1.3 `Rack` e `ShotMath`

```csharp
// Caminho: Assets/_Project/Scripts/Core/Rack.cs
using System.Collections.Generic;
using UnityEngine;

namespace MarbleArena.Core
{
    // POR QUE: as casadas começam arrumadas num triângulo compacto dentro do risco.
    // ESTRATÉGIA: fileiras de 1, 2, 3, 4... (a última pode ficar incompleta e é
    // centralizada); depois o conjunto inteiro é deslocado para o centro pedido.
    public static class Rack
    {
        // Posições das `count` casadas, com distância `spacing` entre centros vizinhos.
        public static List<Vector2> Positions(int count, Vector2 center, float spacing)
        {
            float rowStep = spacing * Mathf.Sqrt(3f) / 2f;
            var points = new List<Vector2>(count);
            for (int row = 0; points.Count < count; row++)
            {
                int inRow = Mathf.Min(row + 1, count - points.Count);
                for (int i = 0; i < inRow; i++)
                    points.Add(new Vector2((i - (inRow - 1) / 2f) * spacing, row * rowStep));
            }

            Vector2 mean = Vector2.zero;
            foreach (var p in points) mean += p;
            mean /= points.Count;
            for (int i = 0; i < points.Count; i++) points[i] = points[i] - mean + center;
            return points;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Core/ShotMath.cs
using UnityEngine;

namespace MarbleArena.Core
{
    // Os três controles do tiro (GDD §5).
    public struct ShotParams
    {
        public float yawDeg;   // 0 = para o fundo (−z), 90 = para a direita (+x)
        public float power;    // 0 a 1
        public float pitchDeg; // 0 (rasteiro) até maxPitchDeg
    }

    // POR QUE: transformar direção, força e ângulo em um impulso físico é regra
    // do jogo, não detalhe da tela; a IA do Marco 4 vai usar as mesmas funções.
    // ESTRATÉGIA: direção unitária × força × impulso máximo, com força e ângulo
    // limitados às faixas do jogo. Cópia fiel de src/core/shot.ts.
    public static class ShotMath
    {
        // Normaliza um ângulo para (−180, 180].
        public static float WrapDeg(float deg)
        {
            float d = deg % 360f;
            if (d > 180f) d -= 360f;
            if (d <= -180f) d += 360f;
            return d;
        }

        // Vetor unitário da direção inicial do tiro (inclui a subida do ângulo vertical).
        public static Vector3 Direction(float yawDeg, float pitchDeg)
        {
            float yaw = yawDeg * Mathf.Deg2Rad;
            float pitch = pitchDeg * Mathf.Deg2Rad;
            return new Vector3(Mathf.Sin(yaw) * Mathf.Cos(pitch), Mathf.Sin(pitch), -Mathf.Cos(yaw) * Mathf.Cos(pitch));
        }

        // Impulso do tiro em g·cm/s.
        public static Vector3 Impulse(ShotParams p, float maxImpulse, float maxPitchDeg)
        {
            float power = Mathf.Clamp01(p.power);
            float pitch = Mathf.Clamp(p.pitchDeg, 0f, maxPitchDeg);
            return Direction(p.yawDeg, pitch) * (power * maxImpulse);
        }

        // Yaw que aponta de `from` para `to` no chão (mira do mouse e IA).
        public static float YawTowards(Vector2 from, Vector2 to)
        {
            return Mathf.Atan2(to.x - from.x, -(to.y - from.y)) * Mathf.Rad2Deg;
        }
    }
}
```

### 1.4 `ScoringSystem` e `CollisionSystem`

```csharp
// Caminho: Assets/_Project/Scripts/Core/ScoringSystem.cs
using System.Collections.Generic;
using UnityEngine;

namespace MarbleArena.Core
{
    // POR QUE: decidir quais casadas foram capturadas (GDD §4.3) com tudo parado.
    // ESTRATÉGIA: recebe só ids e posições no chão; não sabe o que é Rigidbody.
    public static class ScoringSystem
    {
        // Ids das casadas que saíram inteiras do triângulo.
        public static List<string> FindCapturedStakes(IReadOnlyList<(string id, Vector2 position)> stakes, Triangle2 triangle, float radius)
        {
            var captured = new List<string>();
            foreach (var s in stakes)
                if (MarbleGeometry.IsFullyOutside(s.position, radius, triangle)) captured.Add(s.id);
            return captured;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Core/CollisionSystem.cs
using System.Collections.Generic;

namespace MarbleArena.Core
{
    // POR QUE: a eliminação (GDD §4.4) só conta toques DIRETOS da bolinha de tiro;
    // alguém precisa lembrar em quem ela encostou durante o tiro.
    // ESTRATÉGIA: a física avisa cada par que começou a se tocar; guardamos num
    // HashSet (sem repetição) só os pares em que um lado é a bolinha de tiro.
    public class CollisionSystem
    {
        private string _shooterId;
        private readonly HashSet<string> _directHits = new HashSet<string>();

        // Começa um tiro novo, esquecendo os contatos do anterior.
        public void BeginShot(string shooterId)
        {
            _shooterId = shooterId;
            _directHits.Clear();
        }

        // Chamado pela física para cada par de bolinhas que começou a se tocar.
        public void OnContact(string a, string b)
        {
            if (_shooterId == null) return;
            if (a == _shooterId) _directHits.Add(b);
            else if (b == _shooterId) _directHits.Add(a);
        }

        public IReadOnlyCollection<string> DirectHitIds => _directHits;
    }
}
```

### 1.5 Testes no Test Runner

```csharp
// Caminho: Assets/_Project/Tests/EditMode/RulesTests.cs
using MarbleArena.Core;
using NUnit.Framework;
using UnityEngine;

// POR QUE: as mesmas garantias dos testes da versão web (tests/*.test.ts).
// ESTRATÉGIA: testes "EditMode" rodam sem dar Play, em milissegundos
// (Window → General → Test Runner → EditMode → Run All).
public class RulesTests
{
    private const float R = 0.8f;
    private readonly Triangle2 _tri = MarbleGeometry.EquilateralTriangle(Vector2.zero, 30f);
    private float BaseZ => 30f * Mathf.Sqrt(3f) / 2f / 3f;

    // Encostando na linha (centro fora, mas a menos de um raio) não é captura.
    [Test]
    public void TouchingTheLineIsNotCaptured()
    {
        Assert.IsFalse(MarbleGeometry.IsFullyOutside(new Vector2(0f, BaseZ + R / 2f), R, _tri));
    }

    // A um raio da linha, o corpo inteiro saiu: é captura.
    [Test]
    public void OneRadiusOutsideIsCaptured()
    {
        Assert.IsTrue(MarbleGeometry.IsFullyOutside(new Vector2(0f, BaseZ + R), R, _tri));
    }

    // Distância à linha de referência é absoluta: antes ou depois dá o mesmo.
    [Test]
    public void DistanceToLineIsAbsolute()
    {
        var a = new Vector2(-100f, -60f);
        var b = new Vector2(100f, -60f);
        Assert.AreEqual(5f, MarbleGeometry.DistanceToLine(new Vector2(7f, -55f), a, b), 1e-4f);
        Assert.AreEqual(5f, MarbleGeometry.DistanceToLine(new Vector2(-40f, -65f), a, b), 1e-4f);
    }

    // De 1 a 15 casadas cabem inteiras no triângulo do jogo (36 cm, folga de 3 cm).
    [Test]
    public void RackFitsInsideTriangle([Values(1, 3, 6, 10, 15)] int count)
    {
        var tri = MarbleGeometry.EquilateralTriangle(new Vector2(0f, -5f), 36f);
        foreach (var p in Rack.Positions(count, new Vector2(0f, -5f), R * 2f + 3f))
            Assert.IsTrue(MarbleGeometry.IsFullyInside(p, R, tri));
    }

    // Força acima de 100% e ângulo acima do máximo são limitados.
    [Test]
    public void ImpulseIsClamped()
    {
        var i = ShotMath.Impulse(new ShotParams { yawDeg = 0f, power = 2f, pitchDeg = 80f }, 1000f, 45f);
        Assert.AreEqual(1000f, i.magnitude, 1e-2f);
        Assert.AreEqual(i.y, -i.z, 1e-2f);
    }

    // YawTowards desfaz Direction.
    [Test]
    public void YawTowardsInvertsDirection([Values(-170f, -90f, 0f, 45f, 180f)] float yaw)
    {
        Vector3 d = ShotMath.Direction(yaw, 0f);
        float back = ShotMath.YawTowards(Vector2.zero, new Vector2(d.x, d.z));
        Assert.AreEqual(0f, ShotMath.WrapDeg(back - yaw), 1e-3f);
    }
}
```

### ✅ Checkpoint da Fase 1
- **Test Runner → EditMode → Run All** fica todo verde.
- O asset `GameConfig` aparece no Inspector com os valores do §14.

#### Problemas comuns
- **Os testes não aparecem no Test Runner:** a asmdef de testes precisa de **Test Assemblies** marcado e da referência a `MarbleArena.Core`.

Próxima fase: **Arena e Física** — chão, tábuas, riscos e bolinhas com Rigidbody.

---

# Parte 13 — Implementação Unity: Fase 2 (Arena e Física)

## Fase 2 — Arena e Física

> Objetivo desta fase: a arena montada por código, bolinhas com `Rigidbody` que rolam e param como vidro na terra, e um `PhysicsManager` que cria, remove e diz quando tudo parou.

### 2.1 `ArenaBuilder`

```csharp
// Caminho: Assets/_Project/Scripts/Physics/ArenaBuilder.cs
using MarbleArena.Config;
using MarbleArena.Core;
using UnityEngine;

namespace MarbleArena.Physics
{
    // POR QUE: a arena tem que bater com o GameConfig ao centímetro (as tábuas da
    // tela são as paredes da física); montar à mão na cena desalinharia na
    // primeira mudança de número.
    // ESTRATÉGIA: no início do jogo, cria chão, quatro tábuas e os riscos com
    // primitivas da Unity. Um PhysicsMaterial diz o atrito e o quique de cada
    // superfície; os riscos não têm collider (são só desenho).
    public class ArenaBuilder : MonoBehaviour
    {
        [SerializeField] private Material _dirtMaterial;
        [SerializeField] private Material _woodMaterial;
        [SerializeField] private Material _grooveMaterial; // risco escuro do triângulo
        [SerializeField] private Material _chalkMaterial;  // linha de referência e área de tiro

        // Cria tudo como filhos deste objeto.
        public void Build(GameConfig cfg, Triangle2 triangle)
        {
            // Bounce combine "Minimum": no contato bolinha-terra vale o menor quique
            // (0,15), mas bolinha-bolinha continua 0,9. Mesma ideia da versão web.
            var groundMat = MakeMaterial("Terra", cfg.groundFriction, cfg.groundRestitution);
            var wallMat = MakeMaterial("Tábua", cfg.wallFriction, cfg.wallRestitution);

            // Chão: uma caixa grossa com o topo em y = 0.
            var ground = Box("Chão", new Vector3(0f, -5f, 0f), new Vector3(cfg.arenaWidth * 2f, 10f, cfg.arenaDepth * 2f), _dirtMaterial);
            ground.GetComponent<Collider>().sharedMaterial = groundMat;

            float hw = cfg.arenaWidth / 2f, hd = cfg.arenaDepth / 2f, th = cfg.wallThickness, h = cfg.wallHeight;
            Wall(new Vector3(0f, h / 2f, -hd - th / 2f), new Vector3(cfg.arenaWidth + th * 2f, h, th), wallMat);
            Wall(new Vector3(0f, h / 2f, hd + th / 2f), new Vector3(cfg.arenaWidth + th * 2f, h, th), wallMat);
            Wall(new Vector3(-hw - th / 2f, h / 2f, 0f), new Vector3(th, h, cfg.arenaDepth), wallMat);
            Wall(new Vector3(hw + th / 2f, h / 2f, 0f), new Vector3(th, h, cfg.arenaDepth), wallMat);

            // Riscos no chão.
            Strip(triangle.a, triangle.b, 0.7f, _grooveMaterial);
            Strip(triangle.b, triangle.c, 0.7f, _grooveMaterial);
            Strip(triangle.c, triangle.a, 0.7f, _grooveMaterial);
            Strip(new Vector2(-hw + 6f, cfg.referenceLineZ), new Vector2(hw - 6f, cfg.referenceLineZ), 0.8f, _chalkMaterial);
            float z0 = cfg.shootingAreaCenterZ - cfg.shootingAreaDepth / 2f;
            float z1 = cfg.shootingAreaCenterZ + cfg.shootingAreaDepth / 2f;
            float sx = cfg.shootingAreaWidth / 2f;
            Strip(new Vector2(-sx, z0), new Vector2(sx, z0), 0.5f, _chalkMaterial);
            Strip(new Vector2(-sx, z1), new Vector2(sx, z1), 0.5f, _chalkMaterial);
            Strip(new Vector2(-sx, z0), new Vector2(-sx, z1), 0.5f, _chalkMaterial);
            Strip(new Vector2(sx, z0), new Vector2(sx, z1), 0.5f, _chalkMaterial);
        }

        // PhysicsMaterial com o mesmo atrito parado e em movimento.
        private static PhysicsMaterial MakeMaterial(string name, float friction, float bounce)
        {
            return new PhysicsMaterial(name)
            {
                staticFriction = friction,
                dynamicFriction = friction,
                bounciness = bounce,
                frictionCombine = PhysicsMaterialCombine.Average,
                bounceCombine = PhysicsMaterialCombine.Minimum,
            };
        }

        // Cubo primitivo (já vem com BoxCollider) posicionado e escalado.
        private GameObject Box(string name, Vector3 center, Vector3 size, Material mat)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = name;
            go.transform.SetParent(transform, false);
            go.transform.localPosition = center;
            go.transform.localScale = size;
            go.GetComponent<Renderer>().sharedMaterial = mat;
            return go;
        }

        // Tábua: caixa de madeira com o PhysicsMaterial de tábua.
        private void Wall(Vector3 center, Vector3 size, PhysicsMaterial mat)
        {
            Box("Tábua", center, size, _woodMaterial).GetComponent<Collider>().sharedMaterial = mat;
        }

        // Faixa fina deitada no chão de `a` até `b` (pontos do chão: .y = z do mundo), sem colisão.
        private void Strip(Vector2 a, Vector2 b, float width, Material mat)
        {
            Vector3 from = new Vector3(a.x, 0f, a.y);
            Vector3 to = new Vector3(b.x, 0f, b.y);
            float len = Vector3.Distance(from, to) + width; // + largura para os cantos se fecharem
            var go = Box("Risco", (from + to) / 2f + Vector3.up * 0.015f, new Vector3(width, 0.03f, len), mat);
            go.transform.rotation = Quaternion.LookRotation(to - from);
            // Desligar já tira o collider da física neste mesmo quadro; Destroy só age no fim do quadro.
            var col = go.GetComponent<Collider>();
            col.enabled = false;
            Destroy(col);
        }
    }
}
```

> ⚠️ Nota de versão: no Unity 6 a classe se chama `PhysicsMaterial` (e `PhysicsMaterialCombine`). No 2022 LTS o nome antigo é `PhysicMaterial` (e `PhysicMaterialCombine`), sem o "s".

Materiais (URP/Lit): `M_Dirt` (cor `#B58A5C`, Smoothness 0; para a textura, ver 2.4), `M_Wood` (`#8A5A33`), `M_Groove` (`#5A3B22`), `M_Chalk` (`#F3EAD8`).

### 2.2 `MarbleBody`

```csharp
// Caminho: Assets/_Project/Scripts/Physics/MarbleBody.cs
using MarbleArena.Config;
using UnityEngine;

namespace MarbleArena.Physics
{
    // POR QUE: o PhysX (motor de física da Unity) não tem atrito de rolamento:
    // uma esfera perfeita rolaria para sempre. Cada bolinha precisa perder
    // velocidade como vidro em terra batida e parar de vez quando fica lenta.
    // ESTRATÉGIA: um Rigidbody (componente que entrega o objeto à física) com
    // CCD e giro máximo alto. Em FixedUpdate (chamado a cada passo fixo, antes da
    // simulação) tiramos rollingResistance × g × dt da velocidade horizontal e o
    // mesmo tanto, em proporção, do giro. Mesma lógica de PhysicsManager.ts.
    [RequireComponent(typeof(Rigidbody))]
    public class MarbleBody : MonoBehaviour
    {
        public string Id { get; private set; }
        public Rigidbody Body { get; private set; }

        private GameConfig _cfg;
        private PhysicsManager _owner;

        // Configura o Rigidbody a partir do GameConfig. Chamado pelo PhysicsManager ao criar a bolinha.
        public void Init(string id, GameConfig cfg, PhysicsManager owner, PhysicsMaterial material)
        {
            Id = id;
            _cfg = cfg;
            _owner = owner;
            Body = GetComponent<Rigidbody>();
            Body.mass = cfg.MarbleMass;
            Body.angularDamping = cfg.angularDamping;
            Body.linearDamping = 0f;
            Body.maxAngularVelocity = 1000f; // o padrão (7 rad/s) faz a bolinha patinar
            Body.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
            Body.interpolation = RigidbodyInterpolation.Interpolate; // movimento liso entre passos fixos
            GetComponent<Collider>().sharedMaterial = material;
        }

        // Resistência ao rolamento e parada, a cada passo fixo.
        private void FixedUpdate()
        {
            if (Body == null || Body.IsSleeping()) return;
            if (transform.position.y > _cfg.marbleRadius + 0.05f) return; // no ar: só gravidade

            Vector3 v = Body.linearVelocity;
            Vector3 w = Body.angularVelocity;
            float horizontal = new Vector2(v.x, v.z).magnitude;

            if (horizontal < _cfg.stopLinearSpeed && Mathf.Abs(v.y) < _cfg.stopLinearSpeed && w.magnitude < _cfg.stopAngularSpeed)
            {
                Body.linearVelocity = Vector3.zero;
                Body.angularVelocity = Vector3.zero;
                Body.Sleep();
                return;
            }
            if (horizontal == 0f) return;

            float decel = _cfg.rollingResistance * _cfg.gravity * Time.fixedDeltaTime;
            float k = Mathf.Max(0f, horizontal - decel) / horizontal;
            Body.linearVelocity = new Vector3(v.x * k, v.y, v.z * k);
            Body.angularVelocity = w * k;
        }

        // Parada para efeito de "fim do tiro": dormindo, ou abaixo dos limiares.
        public bool IsStill()
        {
            if (Body.IsSleeping()) return true;
            return Body.linearVelocity.magnitude < _cfg.stopLinearSpeed && Body.angularVelocity.magnitude < _cfg.stopAngularSpeed;
        }

        // A Unity chama isto quando dois colliders começam a se tocar.
        private void OnCollisionEnter(Collision collision)
        {
            var other = collision.collider.GetComponent<MarbleBody>();
            if (other != null) _owner.ReportContact(Id, other.Id);
        }
    }
}
```

> ⚠️ Nota de versão: `linearVelocity`, `linearDamping` e `angularDamping` são os nomes do Unity 6 / 2023.x+. No 2022 LTS use `velocity`, `drag` e `angularDrag` (mesma coisa, nomes antigos).

**Prefab `Marble`:** GameObject → 3D Object → **Sphere**; escala `1.6` (a esfera primitiva tem raio 0,5, então 1,6 = diâmetro de 1,6 cm); adicione **Rigidbody** e **MarbleBody** (e **MarbleView**, da seção 2.4). Arraste para `Prefabs/` e apague da cena.

### 2.3 `PhysicsManager`

```csharp
// Caminho: Assets/_Project/Scripts/Physics/PhysicsManager.cs
using System;
using System.Collections.Generic;
using MarbleArena.Config;
using MarbleArena.Core;
using UnityEngine;

namespace MarbleArena.Physics
{
    // POR QUE: alguém precisa ser o dono das bolinhas: criar, remover, achar pelo
    // id, dizer onde estão e responder "tudo parou?". As regras não podem mexer
    // em Rigidbody direto.
    // ESTRATÉGIA: um MonoBehaviour com um dicionário id → MarbleBody. Conta em
    // FixedUpdate quantos passos seguidos tudo ficou parado. DefaultExecutionOrder
    // negativo faz este FixedUpdate rodar antes do GameManager, que lê IsSettled.
    [DefaultExecutionOrder(-50)]
    public class PhysicsManager : MonoBehaviour
    {
        [SerializeField] private GameConfig _config;
        [SerializeField] private MarbleBody _marblePrefab;

        // Avisado a cada par de bolinhas que começa a se tocar (pode vir repetido, um aviso por lado).
        public event Action<string, string> Contact;

        private readonly Dictionary<string, MarbleBody> _marbles = new Dictionary<string, MarbleBody>();
        private PhysicsMaterial _marbleMaterial;
        private int _stillSteps;

        // Aplica gravidade e passo fixo por código, para não depender só do Project Settings.
        private void Awake()
        {
            UnityEngine.Physics.gravity = new Vector3(0f, -_config.gravity, 0f);
            Time.fixedDeltaTime = _config.timeStep;
            _marbleMaterial = new PhysicsMaterial("Vidro")
            {
                staticFriction = _config.marbleFriction,
                dynamicFriction = _config.marbleFriction,
                bounciness = _config.marbleRestitution,
                frictionCombine = PhysicsMaterialCombine.Average,
                bounceCombine = PhysicsMaterialCombine.Average,
            };
        }

        // Cria uma bolinha parada, apoiada no chão em `pos` (.y = z do mundo).
        public MarbleBody Spawn(string id, Vector2 pos)
        {
            var m = Instantiate(_marblePrefab, new Vector3(pos.x, _config.marbleRadius, pos.y), Quaternion.identity, transform);
            m.name = id;
            m.Init(id, _config, this, _marbleMaterial);
            _marbles[id] = m;
            return m;
        }

        // Remove uma bolinha. SetActive(false) tira da física na hora; Destroy só no fim do quadro.
        public void Remove(string id)
        {
            if (!_marbles.TryGetValue(id, out var m)) return;
            m.gameObject.SetActive(false);
            Destroy(m.gameObject);
            _marbles.Remove(id);
        }

        // Remove todas (rodada nova).
        public void Clear()
        {
            foreach (var id in new List<string>(_marbles.Keys)) Remove(id);
            _stillSteps = 0;
        }

        // Aplica o impulso do tiro (ForceMode.Impulse: muda a velocidade em impulso / massa, na hora).
        public void ApplyImpulse(string id, Vector3 impulse)
        {
            if (!_marbles.TryGetValue(id, out var m)) return;
            m.Body.WakeUp();
            m.Body.AddForce(impulse, ForceMode.Impulse);
            _stillSteps = 0;
        }

        // Conta passos seguidos com tudo parado.
        private void FixedUpdate()
        {
            bool allStill = true;
            foreach (var m in _marbles.Values)
            {
                if (!m.IsStill()) { allStill = false; break; }
            }
            _stillSteps = allStill ? _stillSteps + 1 : 0;
        }

        // Tudo parado há settleSteps passos: o tiro acabou.
        public bool IsSettled => _stillSteps >= _config.settleSteps;

        // Para tudo na hora (tiro que estourou o tempo máximo).
        public void FreezeAll()
        {
            foreach (var m in _marbles.Values)
            {
                m.Body.linearVelocity = Vector3.zero;
                m.Body.angularVelocity = Vector3.zero;
                m.Body.Sleep();
            }
            _stillSteps = _config.settleSteps;
        }

        // Chamado pelas bolinhas no OnCollisionEnter.
        public void ReportContact(string a, string b) => Contact?.Invoke(a, b);

        public bool TryGetPosition(string id, out Vector3 position)
        {
            position = default;
            if (!_marbles.TryGetValue(id, out var m)) return false;
            position = m.transform.position;
            return true;
        }

        // Posição no chão (.y = z do mundo), para as regras.
        public Vector2 GetGroundPosition(string id)
        {
            var p = _marbles[id].transform.position;
            return new Vector2(p.x, p.z);
        }

        public MarbleBody Get(string id) => _marbles[id];
    }
}
```

### 2.4 Aparência das bolinhas e da terra (`MarbleView`, `ProceduralTextures`)

```csharp
// Caminho: Assets/_Project/Scripts/View/ProceduralTextures.cs
using UnityEngine;

namespace MarbleArena.View
{
    // POR QUE: o GDD pede materiais procedurais, sem textura externa (§10).
    // ESTRATÉGIA: pinta pixels num Texture2D com um gerador aleatório de semente
    // fixa (System.Random), para sair igual toda vez. Mesmas ideias de materials.ts.
    public static class ProceduralTextures
    {
        // Terra batida: base areia com grãos claros e escuros. Repete sem emenda porque cada pixel é independente.
        public static Texture2D Dirt(Color baseColor, int seed, int size = 256)
        {
            var rand = new System.Random(seed);
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, true) { wrapMode = TextureWrapMode.Repeat };
            var px = new Color[size * size];
            for (int i = 0; i < px.Length; i++)
            {
                double r = rand.NextDouble();
                float n = (float)rand.NextDouble() * 0.06f - 0.03f;
                Color c = baseColor + new Color(n, n, n);
                if (r < 0.08) c = Color.Lerp(c, new Color(0.27f, 0.18f, 0.1f), 0.35f);       // grão escuro
                else if (r < 0.14) c = Color.Lerp(c, new Color(0.96f, 0.88f, 0.72f), 0.3f); // grão claro
                px[i] = c;
            }
            tex.SetPixels(px);
            tex.Apply();
            return tex;
        }

        // Espiral da bolinha leitosa: três faixas onduladas da cor de destaque sobre a cor base.
        public static Texture2D Swirl(Color baseColor, Color accent, int seed)
        {
            const int w = 256, h = 128;
            var rand = new System.Random(seed);
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, true) { wrapMode = TextureWrapMode.Repeat };
            var px = new Color[w * h];
            for (int i = 0; i < px.Length; i++) px[i] = baseColor;
            for (int band = 0; band < 3; band++)
            {
                double phase = rand.NextDouble() * Mathf.PI * 2;
                float amp = 18f + (float)rand.NextDouble() * 22f;
                float thick = 3f + (float)rand.NextDouble() * 4f;
                float yBase = 30f + band * 34f;
                for (int x = 0; x < w; x++)
                {
                    float yc = yBase + Mathf.Sin((float)(x / (float)w * Mathf.PI * 4 + phase)) * amp;
                    for (int y = Mathf.Max(0, (int)(yc - thick)); y < Mathf.Min(h, (int)(yc + thick)); y++)
                        px[y * w + x] = accent;
                }
            }
            tex.SetPixels(px);
            tex.Apply();
            return tex;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/View/MarbleView.cs
using UnityEngine;

namespace MarbleArena.View
{
    public enum MarblePattern { OlhoDeGato, Leitosa }

    // POR QUE: cada bolinha precisa de cor e padrão reconhecíveis (GDD §10).
    // ESTRATÉGIA: parte de dois materiais-modelo do Inspector (vidro transparente
    // e vidro opaco) e cria uma cópia por bolinha com a cor dela. Olho-de-gato
    // ganha três "pétalas" achatadas cruzadas dentro do vidro; leitosa ganha a
    // textura de espiral.
    public class MarbleView : MonoBehaviour
    {
        [SerializeField] private Material _glassTemplate; // URP/Lit, Surface Type Transparent, Smoothness 0.95
        [SerializeField] private Material _milkyTemplate; // URP/Lit, opaco, Smoothness 0.85

        // Pinta a bolinha. Chamado pelo GameManager logo depois de criar.
        public void Apply(Color color, Color accent, MarblePattern pattern, int seed)
        {
            var rend = GetComponent<Renderer>();
            if (pattern == MarblePattern.OlhoDeGato)
            {
                var glass = new Material(_glassTemplate);
                Color tint = Color.Lerp(Color.white, color, 0.4f);
                tint.a = 0.35f; // vidro: dá para ver as pétalas dentro
                glass.color = tint;
                rend.material = glass;

                var core = new Material(_milkyTemplate) { color = color };
                for (int k = 0; k < 3; k++)
                {
                    var petal = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                    // Só desenho: um collider filho viraria parte do corpo da bolinha.
                    // Desligar tira da física na hora; Destroy só age no fim do quadro.
                    var petalCollider = petal.GetComponent<Collider>();
                    petalCollider.enabled = false;
                    Destroy(petalCollider);
                    petal.transform.SetParent(transform, false);
                    petal.transform.localRotation = Quaternion.Euler(0f, k * 60f, 0f);
                    petal.transform.localScale = new Vector3(0.16f, 0.86f, 0.86f);
                    petal.GetComponent<Renderer>().sharedMaterial = core;
                }
            }
            else
            {
                var milky = new Material(_milkyTemplate) { mainTexture = ProceduralTextures.Swirl(color, accent, seed) };
                rend.material = milky;
            }
        }
    }
}
```

Para a terra: em `ArenaBuilder.Build`, antes de criar o chão, `_dirtMaterial.mainTexture = ProceduralTextures.Dirt(new Color(0.71f, 0.54f, 0.36f), 7);` e `_dirtMaterial.mainTextureScale = new Vector2(cfg.arenaWidth / 30f, cfg.arenaDepth / 30f);`.

### ✅ Checkpoint da Fase 2
- Com um script de teste temporário que chama `ArenaBuilder.Build` e `PhysicsManager.Spawn` em algumas posições, dando Play a arena aparece com as tábuas e os riscos, e as bolinhas ficam paradas no chão (sem afundar nem tremer).
- Um `ApplyImpulse` de `(0, 0, -1500)` numa bolinha faz ela rolar, girar visivelmente e parar sozinha em 1–3 s.

#### Problemas comuns
- **A bolinha desliza sem girar:** `maxAngularVelocity` ficou no padrão (7 rad/s). Confira `MarbleBody.Init` e o **Default Max Angular Speed** da Fase 0.
- **A bolinha atravessa outra ou uma tábua:** confira `ContinuousDynamic` e o Fixed Timestep de 1/120.
- **Quica demais na terra:** o `bounceCombine` do chão precisa ser `Minimum`; com `Average`, o vidro (0,9) puxa o quique para cima.

Próxima fase: **GameManager** — o fluxo do tiro.

---

# Parte 14 — Implementação Unity: Fase 3 (GameManager)

## Fase 3 — GameManager

> Objetivo desta fase: o modo treino do Marco 1 funcionando: casadas no triângulo, tiro, espera, contagem de capturas e volta à mira.

### 3.1 `AimState`

```csharp
// Caminho: Assets/_Project/Scripts/Game/AimState.cs
using MarbleArena.Core;
using UnityEngine;

namespace MarbleArena.Game
{
    // POR QUE: a mira é mexida por vários lugares (mouse, teclado, sliders do HUD)
    // e precisa ficar sempre dentro das faixas do jogo.
    // ESTRATÉGIA: propriedades com set privado e métodos que limitam o valor;
    // ninguém consegue pôr força 1,5 ou ângulo de 60°.
    public class AimState
    {
        public float YawDeg { get; private set; }
        public float Power { get; private set; }
        public float PitchDeg { get; private set; }
        public bool Locked { get; set; }

        private float _maxPitch;

        // Valores iniciais a partir do GameConfig.
        public void Init(float defaultPower, float defaultPitch, float maxPitch)
        {
            _maxPitch = maxPitch;
            Power = defaultPower;
            PitchDeg = defaultPitch;
        }

        public void SetYaw(float deg) => YawDeg = ShotMath.WrapDeg(deg);
        public void RotateYaw(float delta) => YawDeg = ShotMath.WrapDeg(YawDeg + delta);
        public void SetPower(float p) => Power = Mathf.Clamp01(p);
        public void SetPitch(float deg) => PitchDeg = Mathf.Clamp(deg, 0f, _maxPitch);

        // Os três controles no formato das regras.
        public ShotParams ToParams() => new ShotParams { yawDeg = YawDeg, power = Power, pitchDeg = PitchDeg };
    }
}
```

### 3.2 `GameManager`

```csharp
// Caminho: Assets/_Project/Scripts/Game/GameManager.cs
using System;
using System.Collections.Generic;
using MarbleArena.Config;
using MarbleArena.Core;
using MarbleArena.Physics;
using MarbleArena.View;
using UnityEngine;

namespace MarbleArena.Game
{
    // Os estados da partida (GDD §13). O Marco 1 usa Aiming, ShotInProgress, ResolvingTurn e GameOver.
    public enum GamePhase { MainMenu, MatchSetup, OpeningRound, MainGame, Aiming, ShotInProgress, ResolvingTurn, GameOver }

    // POR QUE: alguém amarra regras, física e estado: monta a rodada, aplica o
    // tiro, espera parar, conta as capturas e devolve a vez.
    // ESTRATÉGIA: máquina de estados simples numa variável Phase. O tiro começa
    // em Shoot(); FixedUpdate espera o PhysicsManager dizer que tudo parou e
    // chama ResolveTurn(). Avisos para a interface saem por eventos C#
    // (Action), assim o GameManager não conhece o HUD. Cópia de GameManager.ts.
    public class GameManager : MonoBehaviour
    {
        public const string ShooterId = "shooter-p1";

        [SerializeField] private GameConfig _config;
        [SerializeField] private PhysicsManager _physics;
        [SerializeField] private ArenaBuilder _arena;

        // Mensagem curta para o HUD mostrar ("+1 casada capturada!").
        public event Action<string> Toast;

        public GameConfig Config => _config;
        public PhysicsManager Physics => _physics;
        public GamePhase Phase { get; private set; }
        public int Shots { get; private set; }
        public int Captured { get; private set; }
        public int StakesTotal { get; private set; }
        public int StakesRemaining => _stakeIds.Count;
        public bool FollowCam { get; private set; }
        public AimState Aim { get; } = new AimState();
        public Triangle2 Triangle { get; private set; }
        public Vector2 TriangleCenter => _config.triangleCenter;

        private readonly CollisionSystem _collisions = new CollisionSystem();
        private readonly List<string> _stakeIds = new List<string>();
        private float _shotTime;

        // Cores das casadas (cor, destaque, padrão), repetindo se houver mais de 10.
        private static readonly (string color, string accent, MarblePattern pattern)[] StakeLooks =
        {
            ("#3fa7ff", "#ffd23f", MarblePattern.OlhoDeGato), ("#2ecc71", "#f4f4f4", MarblePattern.OlhoDeGato),
            ("#ff8a3d", "#7a2bd1", MarblePattern.OlhoDeGato), ("#f2f2f2", "#2f6bff", MarblePattern.Leitosa),
            ("#ff4f7b", "#ffe066", MarblePattern.OlhoDeGato), ("#9b5de5", "#00f5d4", MarblePattern.OlhoDeGato),
            ("#fff3c4", "#e85d04", MarblePattern.Leitosa), ("#00bbf9", "#f15bb5", MarblePattern.OlhoDeGato),
            ("#c7f464", "#1b4332", MarblePattern.OlhoDeGato), ("#e9ecef", "#2b9348", MarblePattern.Leitosa),
        };

        // Calcula o triângulo e liga os contatos da física ao CollisionSystem.
        private void Awake()
        {
            Triangle = MarbleGeometry.EquilateralTriangle(_config.triangleCenter, _config.triangleSide);
            Aim.Init(_config.defaultPower, _config.defaultPitchDeg, _config.maxPitchDeg);
            _physics.Contact += _collisions.OnContact;
        }

        // Start roda depois de todos os Awake: a arena e a primeira rodada.
        private void Start()
        {
            _arena.Build(_config, Triangle);
            NewRack();
        }

        // Rodada nova: tira tudo, arruma as casadas e põe a bolinha de tiro na área de tiro.
        public void NewRack()
        {
            _physics.Clear();
            _stakeIds.Clear();

            var positions = Rack.Positions(_config.stakeCount, _config.triangleCenter, _config.StakeSpacing);
            for (int i = 0; i < positions.Count; i++)
            {
                string id = "stake-" + i;
                var look = StakeLooks[i % StakeLooks.Length];
                Paint(_physics.Spawn(id, positions[i]), look.color, look.accent, look.pattern, i);
                _stakeIds.Add(id);
            }
            Paint(_physics.Spawn(ShooterId, _config.shooterStart), "#d62828", "#fdf0d5", MarblePattern.Leitosa, 99);

            StakesTotal = _stakeIds.Count;
            Shots = 0;
            Captured = 0;
            _shotTime = 0f;
            Aim.SetYaw(ShotMath.YawTowards(_config.shooterStart, _config.triangleCenter));
            Aim.Locked = false;
            Phase = GamePhase.Aiming;
        }

        // Converte as cores de texto (#rrggbb) e pinta a bolinha.
        private static void Paint(MarbleBody marble, string color, string accent, MarblePattern pattern, int seed)
        {
            ColorUtility.TryParseHtmlString(color, out var c);
            ColorUtility.TryParseHtmlString(accent, out var a);
            marble.GetComponent<MarbleView>().Apply(c, a, pattern, seed);
        }

        // Confirma o tiro com a mira atual. Ignorado fora da fase de mirar.
        public void Shoot()
        {
            if (Phase != GamePhase.Aiming || Aim.Power <= 0f) return;
            _collisions.BeginShot(ShooterId);
            _physics.ApplyImpulse(ShooterId, ShotMath.Impulse(Aim.ToParams(), _config.maxImpulse, _config.maxPitchDeg));
            _shotTime = 0f;
            Shots++;
            Phase = GamePhase.ShotInProgress;
        }

        public void ToggleFollowCam() => FollowCam = !FollowCam;

        // Durante o tiro: espera tudo parar (ou o tempo máximo) e resolve.
        private void FixedUpdate()
        {
            if (Phase != GamePhase.ShotInProgress) return;
            _shotTime += Time.fixedDeltaTime;
            if (_shotTime > _config.maxShotSeconds) _physics.FreezeAll();
            if (_physics.IsSettled) ResolveTurn();
        }

        // Tudo parou: conta as casadas que saíram inteiras, remove, avisa e volta a mirar.
        private void ResolveTurn()
        {
            Phase = GamePhase.ResolvingTurn;
            var stakes = new List<(string, Vector2)>();
            foreach (var id in _stakeIds) stakes.Add((id, _physics.GetGroundPosition(id)));
            var captured = ScoringSystem.FindCapturedStakes(stakes, Triangle, _config.marbleRadius);
            foreach (var id in captured)
            {
                _physics.Remove(id);
                _stakeIds.Remove(id);
            }
            Captured += captured.Count;

            if (captured.Count > 0) Toast?.Invoke(captured.Count == 1 ? "+1 casada capturada!" : $"+{captured.Count} casadas capturadas!");
            else if (_collisions.DirectHitIds.Count == 0) Toast?.Invoke("Não acertou nenhuma bolinha");
            else Toast?.Invoke("Nenhuma saiu inteira do triângulo");

            Aim.Locked = false;
            Phase = _stakeIds.Count == 0 ? GamePhase.GameOver : GamePhase.Aiming;
        }
    }
}
```

### 3.3 Montar na cena

1. GameObject vazio `Arena` com **ArenaBuilder** (arraste os 4 materiais).
2. GameObject vazio `Physics` com **PhysicsManager** (arraste o `GameConfig` e o prefab `Marble`).
3. GameObject vazio `Game` com **GameManager** (arraste `GameConfig`, `Physics` e `Arena`).
4. No prefab `Marble`, arraste `M_GlassTemplate` e `M_MilkyTemplate` no **MarbleView**.

### ✅ Checkpoint da Fase 3
- Dando Play, aparecem 10 casadas coloridas arrumadas no triângulo e a bolinha vermelha na área de tiro.
- Um teste rápido (botão temporário ou `[ContextMenu]` chamando `Shoot()`) atira na direção do triângulo; quando tudo para, o Console não acusa erro e `Phase` volta a `Aiming` (veja no Inspector em modo **Debug**).

#### Problemas comuns
- **`NullReferenceException` em `Awake`:** algum campo do Inspector ficou vazio (o `GameConfig` é o suspeito mais comum).
- **O tiro nunca termina:** uma bolinha está tremendo acima dos limiares; confira o Sleep Threshold e o `stopAngularSpeed` (o limite de 20 s encerra mesmo assim).

Próxima fase: **Mira e Tiro** — mouse, teclado e a seta.

---

# Parte 15 — Implementação Unity: Fase 4 (Mira e Tiro)

## Fase 4 — Mira e Tiro

> Objetivo desta fase: mirar com o mouse e o teclado e ver a seta apontando para onde o impulso vai.

### 4.1 `ShotInput`

```csharp
// Caminho: Assets/_Project/Scripts/Input/ShotInput.cs
using MarbleArena.Core;
using MarbleArena.Game;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

namespace MarbleArena.Input
{
    // POR QUE: o input fica separado do GameManager para o Marco 4 trocar por
    // toque ou pela IA sem mexer nas regras.
    // ESTRATÉGIA: lê o mouse e o teclado pelo Input System novo (Mouse.current,
    // Keyboard.current) a cada quadro. O ponto do chão sob o mouse sai de um raio
    // da câmera contra o plano y = 0 (Plane.Raycast, sem precisar de collider).
    public class ShotInput : MonoBehaviour
    {
        [SerializeField] private GameManager _game;
        [SerializeField] private Camera _camera;
        [Header("Velocidade das teclas (por segundo)")]
        [SerializeField] private float _yawRate = 30f;
        [SerializeField] private float _powerRate = 0.5f;
        [SerializeField] private float _pitchRate = 20f;

        private static readonly Plane Ground = new Plane(Vector3.up, Vector3.zero);

        // Lê o input e aplica na mira.
        private void Update()
        {
            var mouse = Mouse.current;
            var kb = Keyboard.current;
            if (mouse == null || kb == null) return;

            if (kb.fKey.wasPressedThisFrame) _game.ToggleFollowCam();
            if (_game.Phase != GamePhase.Aiming) return;

            var aim = _game.Aim;
            bool overUI = EventSystem.current != null && EventSystem.current.IsPointerOverGameObject();
            bool cameraDrag = mouse.rightButton.isPressed || mouse.middleButton.isPressed; // girando a câmera

            if (!overUI && !cameraDrag && !aim.Locked && TryGroundPoint(mouse.position.ReadValue(), out var point))
            {
                Vector2 shooter = _game.Physics.GetGroundPosition(GameManager.ShooterId);
                if (Vector2.Distance(point, shooter) > _game.Config.marbleRadius * 2f) // em cima da bolinha a direção pula
                    aim.SetYaw(ShotMath.YawTowards(shooter, point));
            }
            if (!overUI && mouse.leftButton.wasPressedThisFrame) aim.Locked = !aim.Locked;
            if (kb.lKey.wasPressedThisFrame) aim.Locked = !aim.Locked;

            float dt = Time.deltaTime * (kb.shiftKey.isPressed ? 0.2f : 1f);
            if (kb.aKey.isPressed || kb.leftArrowKey.isPressed) { aim.Locked = true; aim.RotateYaw(-_yawRate * dt); }
            if (kb.dKey.isPressed || kb.rightArrowKey.isPressed) { aim.Locked = true; aim.RotateYaw(_yawRate * dt); }
            if (kb.wKey.isPressed || kb.upArrowKey.isPressed) aim.SetPower(aim.Power + _powerRate * dt);
            if (kb.sKey.isPressed || kb.downArrowKey.isPressed) aim.SetPower(aim.Power - _powerRate * dt);
            if (kb.eKey.isPressed) aim.SetPitch(aim.PitchDeg + _pitchRate * dt);
            if (kb.qKey.isPressed) aim.SetPitch(aim.PitchDeg - _pitchRate * dt);

            if (kb.spaceKey.wasPressedThisFrame || kb.enterKey.wasPressedThisFrame) _game.Shoot();
        }

        // Ponto do chão (.y = z do mundo) sob a posição da tela, se o raio acertar o plano.
        private bool TryGroundPoint(Vector2 screen, out Vector2 point)
        {
            Ray ray = _camera.ScreenPointToRay(screen);
            if (Ground.Raycast(ray, out float dist))
            {
                Vector3 hit = ray.GetPoint(dist);
                point = new Vector2(hit.x, hit.z);
                return true;
            }
            point = default;
            return false;
        }
    }
}
```

Diferença da web: lá as teclas usam a repetição do teclado (um passo por repetição); aqui o ajuste é contínuo, em graus ou % por segundo enquanto a tecla está apertada.

### 4.2 `AimArrow`

```csharp
// Caminho: Assets/_Project/Scripts/View/AimArrow.cs
using MarbleArena.Core;
using MarbleArena.Game;
using UnityEngine;

namespace MarbleArena.View
{
    // POR QUE: o GDD pede uma seta que mostra a direção EXATA do tiro (§5),
    // incluindo o ângulo vertical, e que reflete a força.
    // ESTRATÉGIA: monta a seta com primitivas uma vez (cilindro = haste, cubo
    // achatado em pé = ponta, cubo fino = linha no chão) e, a cada quadro, só
    // reposiciona, gira com Quaternion.LookRotation na direção do impulso,
    // estica pela força e pinta de verde (fraco) a vermelho (forte).
    public class AimArrow : MonoBehaviour
    {
        [SerializeField] private GameManager _game;
        [SerializeField] private Material _arrowMaterial; // URP/Unlit, a cor é trocada por código
        [SerializeField] private Material _guideMaterial; // URP/Unlit transparente, branco com alpha 0.35
        [SerializeField] private float _minLength = 5f;
        [SerializeField] private float _maxLength = 36f;

        private Transform _pivot, _shaft, _head, _guide;
        private Material _mat;

        // Cria as peças da seta como filhas deste objeto.
        private void Awake()
        {
            _mat = new Material(_arrowMaterial);
            _pivot = new GameObject("Pivot").transform;
            _pivot.SetParent(transform, false);
            _shaft = Part(PrimitiveType.Cylinder, _pivot, _mat).transform;
            _shaft.localRotation = Quaternion.Euler(90f, 0f, 0f); // o cilindro nasce em pé (Y); deita para +Z
            _head = Part(PrimitiveType.Cube, _pivot, _mat).transform;
            _head.localRotation = Quaternion.Euler(0f, 0f, 45f); // losango visto de cima e de lado
            _head.localScale = new Vector3(1.6f, 1.6f, 2.4f);
            _guide = Part(PrimitiveType.Cube, transform, _guideMaterial).transform;
        }

        // Primitiva sem collider (só desenho).
        private static GameObject Part(PrimitiveType type, Transform parent, Material mat)
        {
            var go = GameObject.CreatePrimitive(type);
            var col = go.GetComponent<Collider>();
            col.enabled = false;
            Destroy(col);
            go.transform.SetParent(parent, false);
            go.GetComponent<Renderer>().sharedMaterial = mat;
            return go;
        }

        // LateUpdate roda depois de todos os Update: a bolinha já está na posição do quadro.
        private void LateUpdate()
        {
            bool visible = _game.Phase == GamePhase.Aiming && _game.Physics.TryGetPosition(GameManager.ShooterId, out _);
            _pivot.gameObject.SetActive(visible);
            _guide.gameObject.SetActive(visible);
            if (!visible) return;

            _game.Physics.TryGetPosition(GameManager.ShooterId, out var p);
            transform.position = p;
            float r = _game.Config.marbleRadius;
            var aim = _game.Aim;

            Vector3 dir = ShotMath.Direction(aim.YawDeg, aim.PitchDeg);
            _pivot.rotation = Quaternion.LookRotation(dir); // +Z do pivô = direção do impulso

            float len = Mathf.Lerp(_minLength, _maxLength, aim.Power);
            _shaft.localScale = new Vector3(0.7f, len / 2f, 0.7f); // cilindro primitivo tem 2 de altura
            _shaft.localPosition = new Vector3(0f, 0f, r + len / 2f);
            _head.localPosition = new Vector3(0f, 0f, r + len + 1.2f);
            _mat.color = Color.HSVToRGB(0.33f * (1f - aim.Power), 0.85f, 0.95f);

            // Linha no chão, só com a direção horizontal.
            Vector3 flat = new Vector3(dir.x, 0f, dir.z).normalized;
            _guide.rotation = Quaternion.LookRotation(flat);
            _guide.position = new Vector3(p.x, 0.03f, p.z) + flat * (r + 60f);
            _guide.localScale = new Vector3(0.18f, 0.02f, 120f);
        }
    }
}
```

### 4.3 Montar

1. GameObject vazio `Aim` com **ShotInput** (arraste `Game` e a `Main Camera`) e **AimArrow** (arraste `Game` e os dois materiais).
2. Para o `EventSystem.IsPointerOverGameObject` funcionar, a cena precisa de um **EventSystem** (criado junto com o primeiro Canvas, na Fase 6). Até lá, `EventSystem.current` é nulo e o código só ignora a checagem.

### ✅ Checkpoint da Fase 4
- Mexer o mouse no chão gira a seta em volta da bolinha vermelha; clicar trava; A/D gira devagar mesmo travado.
- W/S estica a seta e muda a cor de verde para vermelho; Q/E inclina a seta para cima.
- Espaço atira: as casadas espalham e, quando tudo para, a seta volta.
- Segurar o botão direito e mexer o mouse não muda a mira.

#### Problemas comuns
- **A seta aponta para o lado contrário do mouse:** o `Vector2` do chão usa `.y` para o z do mundo; confira `new Vector2(hit.x, hit.z)` em `TryGroundPoint`.

Próxima fase: **Câmera**.

---

# Parte 16 — Implementação Unity: Fase 5 (Câmera)

## Fase 5 — Câmera

> Objetivo desta fase: a câmera orbital do §7, igual à da versão web.

### 5.1 `OrbitCamera`

```csharp
// Caminho: Assets/_Project/Scripts/View/OrbitCamera.cs
using MarbleArena.Game;
using UnityEngine;
using UnityEngine.InputSystem;

namespace MarbleArena.View
{
    // POR QUE: o GDD pede visão de cima inclinada, zoom, rotação, transições
    // suaves e uma câmera que acompanha o tiro e volta sozinha (§7).
    // ESTRATÉGIA: a câmera fica numa "esfera" em volta de um alvo, descrita por
    // três números (giro, elevação, distância). O mouse muda o "desejado"; a cada
    // quadro a câmera persegue o desejado com 1 - exp(-taxa × dt), uma
    // suavização que fica igual em 30 ou 144 FPS. Cópia de CameraController.tsx.
    [RequireComponent(typeof(Camera))]
    public class OrbitCamera : MonoBehaviour
    {
        [SerializeField] private GameManager _game;
        [Header("Visão geral")]
        [SerializeField] private float _overviewYaw = 0f;
        [SerializeField] private float _overviewElevation = 50f;
        [SerializeField] private float _overviewDistance = 175f;
        [Header("Limites")]
        [SerializeField] private float _minElevation = 22f;
        [SerializeField] private float _maxElevation = 85f;
        [SerializeField] private float _minDistance = 35f;
        [SerializeField] private float _maxDistance = 340f;
        [SerializeField] private float _followDistance = 80f;

        private float _wantYaw, _wantElevation, _wantDistance;
        private float _yaw, _elevation, _distance;
        private Vector3 _target = new Vector3(0f, 0f, 10f);

        // Começa na visão geral.
        private void Awake()
        {
            ResetView();
            _yaw = _wantYaw;
            _elevation = _wantElevation;
            _distance = _wantDistance;
        }

        private void ResetView()
        {
            _wantYaw = _overviewYaw;
            _wantElevation = _overviewElevation;
            _wantDistance = _overviewDistance;
        }

        // Fração para aproximar atual do desejado, independente do FPS.
        private static float Damp(float rate, float dt) => 1f - Mathf.Exp(-rate * dt);

        // Input do mouse e posição da câmera (LateUpdate: depois de as bolinhas se moverem).
        private void LateUpdate()
        {
            var mouse = Mouse.current;
            var kb = Keyboard.current;
            float dt = Time.deltaTime;

            if (mouse != null)
            {
                if (mouse.rightButton.isPressed || mouse.middleButton.isPressed)
                {
                    Vector2 d = mouse.delta.ReadValue();
                    _wantYaw -= d.x * 0.35f;
                    _wantElevation = Mathf.Clamp(_wantElevation + d.y * -0.25f, _minElevation, _maxElevation);
                }
                float scroll = mouse.scroll.ReadValue().y; // ~120 por "clique" da roda no Windows
                if (scroll != 0f) _wantDistance = Mathf.Clamp(_wantDistance * Mathf.Exp(-scroll * 0.001f), _minDistance, _maxDistance);
            }
            if (kb != null && (kb.cKey.wasPressedThisFrame || kb.homeKey.wasPressedThisFrame)) ResetView();

            // Alvo: segue a bolinha no tiro; mirando, fica entre o triângulo e a bolinha de tiro.
            bool hasShooter = _game.Physics.TryGetPosition(GameManager.ShooterId, out var shooter);
            bool following = _game.FollowCam && _game.Phase == GamePhase.ShotInProgress && hasShooter;
            Vector3 center = new Vector3(_game.TriangleCenter.x, 0f, _game.TriangleCenter.y);
            Vector3 want = center;
            if (following) want = new Vector3(shooter.x, 0f, shooter.z);
            else if (hasShooter) want = Vector3.Lerp(center, new Vector3(shooter.x, 0f, shooter.z), 0.35f);
            _target = Vector3.Lerp(_target, want, Damp(following ? 6f : 2.5f, dt));

            float k = Damp(6f, dt);
            _yaw += (_wantYaw - _yaw) * k;
            _elevation += (_wantElevation - _elevation) * k;
            float wantDistance = following ? Mathf.Min(_wantDistance, _followDistance) : _wantDistance;
            _distance += (wantDistance - _distance) * Damp(3f, dt);

            float yaw = _yaw * Mathf.Deg2Rad;
            float el = _elevation * Mathf.Deg2Rad;
            float horizontal = Mathf.Cos(el) * _distance;
            transform.position = _target + new Vector3(Mathf.Sin(yaw) * horizontal, Mathf.Sin(el) * _distance, Mathf.Cos(yaw) * horizontal);
            transform.LookAt(_target);
        }
    }
}
```

Na web o giro está em radianos e a sensibilidade é por pixel; aqui está em graus, com sensibilidades equivalentes. Ajuste `0.35` e `-0.25` ao gosto.

### ✅ Checkpoint da Fase 5
- Dando Play, a câmera mostra a arena inteira de trás do jogador, inclinada.
- Botão direito arrastando gira em volta; a roda aproxima até ~35 cm das bolinhas; C volta à visão geral suavemente.
- Com F ligado, a câmera acompanha a bolinha vermelha no tiro e volta sozinha quando tudo para.

Próxima fase: **HUD**.

---

# Parte 17 — Implementação Unity: Fase 6 (HUD)

## Fase 6 — HUD

> Objetivo desta fase: a interface do §8 que o Marco 1 precisa, em uGUI com TextMeshPro.

### 6.1 Montar o Canvas

1. **GameObject → UI → Canvas** (cria também o **EventSystem**; no Inspector do EventSystem, clique **Replace with InputSystemUIInputModule**). No Canvas Scaler: **Scale With Screen Size**, 1920 × 1080, Match 0.5.
2. **Painel de status** (canto superior esquerdo): textos `Fase`, `Capturadas`, `No triângulo`, `Tiros`.
3. **Painel de mira** (embaixo, no centro): textos `Direção`, `Força %`, `Ângulo`; uma **Image** `PowerFill` com Image Type **Filled** / Horizontal; **Slider** `Power` (0–1); **Slider** `Pitch` (0–45); botões `Atirar`, `Travar`, `Câmera segue`.
4. **Aviso** (no alto, centro): um painel com **CanvasGroup** e um texto.
5. **Painel "Triângulo limpo!"** (centro, desligado): texto de resumo e botão `Arrumar de novo`.
6. Botão `Recomeçar` no canto inferior direito.

### 6.2 `HudController`

```csharp
// Caminho: Assets/_Project/Scripts/UI/HudController.cs
using MarbleArena.Game;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace MarbleArena.UI
{
    // POR QUE: mostrar o estado do jogo e dar botões e sliders para a mira (GDD §8).
    // ESTRATÉGIA: a cada quadro, lê o GameManager e atualiza os textos (é barato
    // para meia dúzia de campos e evita esquecer um evento). Os sliders usam
    // SetValueWithoutNotify para não disparar o próprio onValueChanged quando é
    // o teclado que mudou a força. O aviso some com um fade no CanvasGroup.
    public class HudController : MonoBehaviour
    {
        [SerializeField] private GameManager _game;
        [Header("Status")]
        [SerializeField] private TMP_Text _phaseText;
        [SerializeField] private TMP_Text _capturedText;
        [SerializeField] private TMP_Text _remainingText;
        [SerializeField] private TMP_Text _shotsText;
        [Header("Mira")]
        [SerializeField] private TMP_Text _yawText;
        [SerializeField] private TMP_Text _powerText;
        [SerializeField] private TMP_Text _pitchText;
        [SerializeField] private Image _powerFill;
        [SerializeField] private Slider _powerSlider;
        [SerializeField] private Slider _pitchSlider;
        [SerializeField] private Button _shootButton;
        [SerializeField] private Button _lockButton;
        [SerializeField] private TMP_Text _lockText;
        [SerializeField] private Button _followButton;
        [SerializeField] private Button _resetButton;
        [Header("Aviso e fim")]
        [SerializeField] private CanvasGroup _toastGroup;
        [SerializeField] private TMP_Text _toastText;
        [SerializeField] private GameObject _clearedPanel;
        [SerializeField] private TMP_Text _clearedText;
        [SerializeField] private Button _againButton;

        private float _toastTimer;

        // Liga botões e sliders às ações do jogo.
        private void Awake()
        {
            _powerSlider.onValueChanged.AddListener(v => _game.Aim.SetPower(v));
            _pitchSlider.maxValue = _game.Config.maxPitchDeg;
            _pitchSlider.onValueChanged.AddListener(v => _game.Aim.SetPitch(v));
            _shootButton.onClick.AddListener(_game.Shoot);
            _lockButton.onClick.AddListener(() => _game.Aim.Locked = !_game.Aim.Locked);
            _followButton.onClick.AddListener(_game.ToggleFollowCam);
            _resetButton.onClick.AddListener(_game.NewRack);
            _againButton.onClick.AddListener(_game.NewRack);
            _game.Toast += ShowToast;
            _toastGroup.alpha = 0f;
        }

        private void OnDestroy() => _game.Toast -= ShowToast;

        // Mostra o aviso por 1,8 s.
        private void ShowToast(string text)
        {
            _toastText.text = text;
            _toastTimer = 1.8f;
        }

        // Copia o estado para a tela.
        private void Update()
        {
            bool aiming = _game.Phase == GamePhase.Aiming;
            _phaseText.text = _game.Phase switch
            {
                GamePhase.Aiming => "Mirando",
                GamePhase.ShotInProgress => "Bolinhas rolando…",
                GamePhase.ResolvingTurn => "Contando…",
                GamePhase.GameOver => "Triângulo limpo!",
                _ => _game.Phase.ToString(),
            };
            _capturedText.text = _game.Captured.ToString();
            _remainingText.text = $"{_game.StakesRemaining}/{_game.StakesTotal}";
            _shotsText.text = _game.Shots.ToString();

            var aim = _game.Aim;
            _yawText.text = $"{aim.YawDeg:0.0}°";
            _powerText.text = $"{Mathf.RoundToInt(aim.Power * 100f)}%";
            _pitchText.text = $"{aim.PitchDeg:0.0}°";
            _powerFill.fillAmount = aim.Power;
            _powerFill.color = Color.HSVToRGB(0.33f * (1f - aim.Power), 0.8f, 0.85f);
            _powerSlider.SetValueWithoutNotify(aim.Power);
            _pitchSlider.SetValueWithoutNotify(aim.PitchDeg);
            _lockText.text = aim.Locked ? "Travada" : "Seguindo o mouse";

            // Controles desligados enquanto as bolinhas se movem (GDD §5).
            _shootButton.interactable = aiming && aim.Power > 0f;
            _powerSlider.interactable = aiming;
            _pitchSlider.interactable = aiming;
            _lockButton.interactable = aiming;

            _clearedPanel.SetActive(_game.Phase == GamePhase.GameOver);
            if (_game.Phase == GamePhase.GameOver)
                _clearedText.text = $"{_game.Captured} casadas capturadas em {_game.Shots} {(_game.Shots == 1 ? "tiro" : "tiros")}.";

            _toastTimer -= Time.deltaTime;
            _toastGroup.alpha = Mathf.Clamp01(_toastTimer / 0.25f); // some nos últimos 0,25 s
        }
    }
}
```

Arraste cada elemento no Inspector do `HudController` (num GameObject `HUD` filho do Canvas).

### ✅ Checkpoint da Fase 6
- A força acompanha W/S e o slider, nos dois sentidos, e a barra muda de verde para vermelho.
- Durante o tiro, a fase mostra "Bolinhas rolando…" e o botão Atirar fica desligado.
- Clicar num botão do HUD não trava/destrava a mira (o `IsPointerOverGameObject` está funcionando).
- Ao capturar a última casada, aparece "Triângulo limpo!"; "Arrumar de novo" recomeça.

#### Problemas comuns
- **Clicar nos botões não faz nada:** o EventSystem ainda usa o **StandaloneInputModule** (input antigo); troque para **InputSystemUIInputModule**.

Próxima fase: **Build e Próximos Passos**.

---

# Parte 18 — Implementação Unity: Fase 7 (Build e Próximos Passos)

## Fase 7 — Build e Próximos Passos

> Objetivo desta fase: um build jogável do Marco 1 em Unity e o caminho dos próximos marcos.

### 7.1 Build

1. **File → Build Profiles**, adicione a cena `Arena`.
2. **Windows/Mac** para testar fora do Editor, ou **Web** (WebGL) para comparar lado a lado com a versão web.
3. No build Web, confira se o Fixed Timestep (1/120) não pesa em máquinas fracas; se pesar, teste 1/90 e ajuste o `settleSteps` para manter ~0,25 s.

### 7.2 Comparar com a versão web

Os dois códigos usam os mesmos números do `GameConfig`, mas motores de física diferentes (PhysX × Rapier). Para conferir se a sensação é a mesma, repita os testes de `tests/physics.test.ts` à mão: tiro de 20% e de 40% em linha reta (≈ 25 cm e ≈ 92 cm na web) e tiro de 100% no triângulo (1 a 2 capturas). Diferenças pequenas são esperadas; diferenças grandes geralmente vêm do Max Angular Speed ou das regras de combinação dos materiais.

### 7.3 Próximos passos

Os Marcos 2 a 4 seguem o mesmo plano da versão web (Parte 9, §6.3 a §6.5), com as regras novas (`TurnManager`, `RulesEngine`, `Player`/`MatchState`) como classes puras em `MarbleArena.Core`, testadas no Test Runner, e o `GameManager` só orquestrando. Para o multiplayer online (§9 e §12), as regras puras podem ser compartilhadas entre cliente e servidor; a decisão de tecnologia está **Em aberto**.

### ✅ Checkpoint da Fase 7
- O build abre fora do Editor e joga igual ao Play Mode.
- As distâncias de 20% e 40% ficam na mesma ordem de grandeza da versão web.

---
*Versão: rascunho inicial — Marco 1 implementado na versão web; porte Unity documentado, não implementado.*
