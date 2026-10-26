# GDD — Paper Flight

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

> Documento vivo. Rascunho inicial — a refinar conforme prototipagem. O nome é provisório. Os números de balanceamento (velocidades, arrasto, custos, metas dos mapas) ainda não foram decididos: os valores da tabela §12 e do Guia de Implementação Unity (Parte 2 em diante) são **placeholders de MVP**, não decisões fechadas.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Unity](#parte-2--guia-de-implementação-unity)
3. [Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-3--implementação-unity-fase-0-setup-do-projeto)
4. [Parte 4 — Implementação Unity: Fase 1 (Dados e Configuração)](#parte-4--implementação-unity-fase-1-dados-e-configuração)
5. [Parte 5 — Implementação Unity: Fase 2 (Progresso e Save)](#parte-5--implementação-unity-fase-2-progresso-e-save)
6. [Parte 6 — Implementação Unity: Fase 3 (Cena, Câmera e Cenário)](#parte-6--implementação-unity-fase-3-cena-câmera-e-cenário)
7. [Parte 7 — Implementação Unity: Fase 4 (Avião e Planeio)](#parte-7--implementação-unity-fase-4-avião-e-planeio)
8. [Parte 8 — Implementação Unity: Fase 5 (Lançamento Estilingue)](#parte-8--implementação-unity-fase-5-lançamento-estilingue)
9. [Parte 9 — Implementação Unity: Fase 6 (Elementos do Mapa)](#parte-9--implementação-unity-fase-6-elementos-do-mapa)
10. [Parte 10 — Implementação Unity: Fase 7 (Rodada, HUD e Resultados)](#parte-10--implementação-unity-fase-7-rodada-hud-e-resultados)
11. [Parte 11 — Implementação Unity: Fase 8 (Hangar: Upgrades e Troca de Mapa)](#parte-11--implementação-unity-fase-8-hangar-upgrades-e-troca-de-mapa)
12. [Parte 12 — Implementação Unity: Fase 9 (Arte dos 5 Mapas)](#parte-12--implementação-unity-fase-9-arte-dos-5-mapas)
13. [Parte 13 — Implementação Unity: Fase 10 (Build e Próximos Passos)](#parte-13--implementação-unity-fase-10-build-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Nome:** **Definido** — Paper Flight (provisório).
- **Gênero:** **Definido** — incremental de upgrades com lançamento ("launch game"): cada rodada é um arremesso, e o dinheiro da rodada compra upgrades que fazem o próximo arremesso ir mais longe.
- **Dimensão:** **Definido** — 2D.
- **Câmera/perspectiva:** **Definido** — visão lateral (sidescroller), com a tela em **modo retrato (vertical)**.
- **Plataforma-alvo:** **Definido** — foco em mobile (toque); o mesmo controle funciona com mouse. **Em aberto:** quais lojas (Android, iOS) e se existe build de PC/Web como alvo ou só como ferramenta de teste.
- **Pilar de design:** **Em aberto**. Candidato para discussão (não aprovado): "velocidade é altitude — subir custa velocidade, e sem velocidade não se sobe".
- **Fantasia central:** **Em aberto**. Depende do pilar acima.
- **Referências/inspirações:** **Definido** — Sled Surfers (citado pelo usuário). Semelhança observada, só para orientar a conversa (não citada pelo usuário): a série Learn to Fly, que também alterna lançamento e loja de upgrades.

## 2. Loop Principal

1. **Definido:** o jogador lança o avião de papel com um gesto de estilingue (§3).
2. **Definido:** durante o voo, o avião **só plana**. O jogador toca na tela para soltar impulsos de vento e desliza o dedo para inclinar o nariz para cima ou para baixo (§4).
3. **Definido:** o voo termina quando o avião toca o chão. A distância horizontal percorrida é o resultado da rodada.
4. **Definido:** toda rodada paga dinheiro proporcional à distância, multiplicado pela Renda (§5.1).
5. **Definido:** com o dinheiro, o jogador compra upgrades em cinco trilhas: Papel, Dobra, Lançamento, Vento e Renda (§5.2).
6. **Definido:** cada mapa tem uma distância-alvo. Alcançá-la libera o próximo mapa (§6).
7. **Definido:** ao passar para o próximo mapa, **todos os upgrades são resetados** e o avião volta à estaca zero.

## 3. Lançamento (estilingue)

- **Definido:** o lançamento é de **puxar e soltar**, como um estilingue. O jogador encosta o dedo, arrasta para trás e solta.
  - A **direção** do arrasto define o ângulo do lançamento (arrastar para baixo e para a esquerda lança para cima e para a direita).
  - A **distância** do arrasto define a força, até um limite.
  - A trilha **Lançamento** (§5.2) aumenta a velocidade máxima do arremesso com força cheia.
- **Definido:** enquanto o jogador arrasta, o avião gira para o ângulo escolhido e uma linha mostra direção e força.
- **Em aberto:** quem ou o que lança o avião na cena (mão, criança, plataforma, mesa). Placeholder de MVP: o avião parte de um ponto fixo a 2 m do chão.
- **Em aberto:** se existe linha de trajetória prevista (pontilhada) ou só a linha de mira. Placeholder de MVP: só a linha de mira.
- **Em aberto:** ângulos mínimo e máximo. Placeholder de MVP: 0° a 75°.

## 4. Voo: Planeio, Vento e Controle

### 4.1 A regra do planeio

- **Definido:** o avião de papel **não tem motor, só plana**. Subir ou descer depende da velocidade do avião.
- **Definido:** com **pouca velocidade é impossível subir**. Se o jogador puxar o nariz para cima devagar demais, o avião não obedece.
- Modelo placeholder do MVP (como a regra acima vira física):
  - O avião sempre voa na direção para onde o nariz aponta.
  - Apontar para baixo troca altura por velocidade; apontar para cima troca velocidade por altura. O ar também freia o avião o tempo todo (arrasto).
  - Existe uma **velocidade de estol**. Abaixo dela o avião não sobe de jeito nenhum e embica para baixo até recuperar velocidade.
  - Entre a velocidade de estol e a **velocidade de subida plena**, o ângulo máximo de subida cresce aos poucos. Acima da velocidade de subida plena, o jogador tem o ângulo máximo inteiro.
  - Sem input, o nariz volta para um **ângulo neutro de planeio**, levemente para baixo.

### 4.2 Impulsos de vento (toque)

- **Definido:** tocar na tela solta um pequeno impulso de vento que empurra o avião para frente.
- **Definido:** os impulsos são **cargas por voo**. Cada voo começa com N cargas; acabou, acabou.
- **Definido:** a trilha **Vento** (§5.2) melhora os impulsos.
- **Em aberto:** se o upgrade de Vento aumenta o número de cargas, a força de cada impulso, ou as duas coisas. Placeholder de MVP: as duas (+1 carga e +10% de força por nível).
- **Em aberto:** se o impulso só dá velocidade ou também levanta o nariz. Placeholder de MVP: só velocidade.

### 4.3 Controle por deslize

- **Definido:** deslizar o dedo para cima ou para baixo inclina o nariz para cima ou para baixo, sempre limitado pela regra do planeio (§4.1).
- **Definido:** funciona com mouse (clicar e arrastar) além do toque.
- **Em aberto:** o gesto exato. Placeholder de MVP: o deslize é medido a partir do ponto onde o dedo encostou; arrastar 15% da altura da tela dá a inclinação máxima; soltar o dedo devolve o nariz ao ângulo neutro.
- **Em aberto:** como separar toque de deslize. Placeholder de MVP: o impulso de vento sai quando o dedo **solta** depois de um toque curto e quase parado (até 0,2 s, sem se mexer); qualquer coisa além disso é deslize. O custo é um atraso de até 0,2 s no impulso.

### 4.4 Fim do voo

- **Definido:** o voo termina quando o avião toca o chão.
- **Em aberto:** se o avião desliza/quica no chão antes de parar (somando distância) ou para na hora. Placeholder de MVP: para na hora.

## 5. Economia e Upgrades

### 5.1 Dinheiro por rodada

- **Definido:** **toda rodada paga**, não só as que batem o recorde: `dinheiro = distância × multiplicador de Renda`.
- **Definido:** existem moedas coletáveis no mapa (§7), que somam ao dinheiro da rodada.
- **Em aberto:** se a Renda também multiplica as moedas coletadas. Placeholder de MVP: não multiplica.
- **Em aberto:** se existe bônus por bater o recorde. Placeholder de MVP: não existe.
- **Em aberto:** se existe renda passiva fora das rodadas (estilo idle, inclusive offline). O usuário definiu Renda como "quanto você ganha por rodada", então o placeholder de MVP é **sem renda passiva**.
- **Em aberto:** nome da moeda do jogo.

### 5.2 Trilhas de upgrade

**Definido:** cinco trilhas.

| Trilha | O que melhora (**Definido**) | Efeito no modelo de voo (placeholder de MVP) |
|---|---|---|
| **Papel** | O tipo de papel usado: peso/resistência, afeta o planeio e a perda de velocidade. | Menos arrasto: o avião perde velocidade mais devagar. |
| **Dobra** | O modelo de dobra: sustentação/aerodinâmica, quanto o avião consegue subir. | Velocidade de estol menor e ângulo máximo de subida maior. |
| **Lançamento** | A velocidade inicial do arremesso. | Mais velocidade com força cheia no estilingue. |
| **Vento** | Os impulsos de vento por voo. | Mais cargas e impulsos mais fortes (ver §4.2). |
| **Renda** | Quanto o jogador ganha por rodada. | Multiplicador maior sobre o dinheiro da distância. |

- **Em aberto:** número de níveis por trilha e a curva de preço. Placeholder de MVP: 10 níveis, custo `20 × 1,5^nível`.
- **Em aberto:** a lista de tipos de papel e de dobras, e se cada nível é um tipo novo ou se os tipos aparecem como marcos a cada N níveis. O código do guia já aceita um nome por nível.
- **Em aberto:** se o visual do avião muda com os upgrades (ver §8).

## 6. Mapas e Progressão

- **Definido:** **5 mapas** no lançamento.
- **Definido:** cada mapa tem uma **distância-alvo**. Ao alcançá-la, o próximo mapa é liberado.
- **Definido:** ao passar para o próximo mapa, **todos os upgrades são resetados** e o avião volta à estaca zero.
- **Em aberto:** o que mais reseta junto: dinheiro guardado e recorde. Placeholder de MVP: os dois zeram (recorde vale por mapa).
- **Em aberto:** se o jogador é obrigado a avançar ao bater a meta ou escolhe quando avançar. Placeholder de MVP: o botão "Próximo mapa" aparece no hangar e o jogador escolhe quando apertar, com uma confirmação avisando do reset.
- **Em aberto:** se dá para voltar a um mapa anterior. Placeholder de MVP: não dá.
- **Em aberto:** o que acontece ao bater a meta do 5º mapa (fim de jogo, modo infinito, recomeço). Placeholder de MVP: uma mensagem de "último mapa completo" e o jogador segue jogando o mapa 5.
- **Em aberto (risco de design):** como o reset é total e não sobra nada permanente, a única recompensa de avançar é o mapa novo. Vale discutir se algum bônus permanente (estilo "prestígio") entra depois.
- **Definido:** tema de cada mapa, nesta ordem: 1. **Quintal**, 2. **Parque**, 3. **Praia**, 4. **Cidade**, 5. **Montanha**.
- **Em aberto:** metas de distância. Placeholder de MVP: 300 / 600 / 1000 / 1500 / 2500 m.
- **Em aberto:** se cada mapa é sempre igual (feito à mão ou com semente fixa) ou muda a cada rodada. Placeholder de MVP: os elementos do mapa são gerados a partir de uma **semente fixa por mapa**, então o mapa é igual em toda rodada e o jogador pode aprender o caminho.

## 7. Elementos do Mapa

- **Definido:** **correntes de ar** — zonas que empurram o avião (para cima ou para baixo).
- **Definido:** **coletáveis** — moedas no caminho, que somam dinheiro à rodada.
- **Definido:** **obstáculos** — coisas no caminho (ex.: árvores, prédios, pássaros).
- **Em aberto:** o que um obstáculo faz: só freia ou derruba o avião (fim do voo). Placeholder de MVP: freia, tirando 40% da velocidade.
- **Em aberto:** a lista de obstáculos e correntes de cada mapa, e quanto cada mapa fica mais difícil.

## 8. Estilo Visual

- **Definido:** tudo em **pixel art 2D**, gerado no **PixelLab**.
- **Definido:** tela em retrato (vertical), visão lateral.
- **Definido:** estilo aprovado no teste de 2026-10-06: pixel art casual de jogo mobile, cores claras e quentes, contorno escuro e sombreado suave. Não houve imagem de referência; o teste foi gerado por texto e o lote usou os assets aprovados como referência de estilo. Arte e receitas em `Sprites/PaperFlight/README.md`.
- **Em aberto:** resolução de referência e tamanho dos sprites. Placeholder de MVP: 180×320 px de referência (escala 6× em 1080×1920), 16 px por metro, avião em um quadro de 32 px.
- **Em aberto:** como o avião gira. Pixel art girado livremente fica "serrilhado"; a alternativa é ter de 8 a 16 sprites de ângulos prontos. Placeholder de MVP: rotação livre.
- **Definido:** cada mapa tem um **avião diferente**: 5 modelos de dobra com formatos distintos (um por mapa), cada um com sua cor/papel. Ao trocar de mapa, o avião novo aparece junto com o reset dos upgrades.
- **Em aberto:** como isso convive com a trilha **Dobra** (§5.2), que também fala em "modelo de dobra". Hoje o modelo visual é do mapa e a trilha Dobra só melhora números dentro do mapa. Falta decidir se os níveis de Dobra/Papel também mudam o sprite (detalhes, vincos, textura).
- **Em aberto:** paleta de cada mapa (os temas estão em §6).

## 9. HUD, UI e Controles

- **Controles (Definido):** mobile por toque, com mouse equivalente.
  - Hangar: botões de toque/clique.
  - Lançamento: arrastar e soltar (§3).
  - Voo: toque = vento (§4.2); deslize vertical = inclinação (§4.3).
- **HUD de voo (placeholder de MVP):** distância atual, meta e recorde do mapa, cargas de vento restantes e um velocímetro colorido que mostra a regra do planeio (vermelho = sem subida, amarelo = subida limitada, verde = subida plena).
- **Tela de resultado (placeholder de MVP):** distância, aviso de novo recorde, dinheiro da distância, moedas, total da rodada e aviso quando a meta do mapa é batida.
- **Hangar (placeholder de MVP):** dinheiro, mapa atual, recorde e meta, um botão por trilha de upgrade (nome, nível, preço), botão "Lançar" e botão "Próximo mapa" quando liberado.
- **Em aberto:** layout final das telas, marcador do recorde no cenário durante o voo, efeito visual de cada upgrade antes de comprar ("+x").

## 10. Áudio

- **Em aberto:** a direção sonora inteira.

## 11. Backend / Persistência

- **Definido:** **offline no MVP**: sem Firebase, sem login.
- **Definido:** save local do progresso (mapa atual, dinheiro, níveis de upgrade, recorde).
- **Em aberto:** leaderboard pós-MVP. Se entrar, a sugestão é seguir o padrão do estúdio (`/leaderboards/{jogo}/{pista}/{uid}`, ver `RallySurvive.md` Parte 1), mas isso não foi confirmado.
- **Em aberto:** monetização (anúncios, compras), comum em incrementais mobile, ainda não discutida.

## 12. Escopo do MVP

**Definido (entra no MVP):**

- Lançamento por estilingue.
- Voo com planeio dependente da velocidade, impulsos de vento por toque e controle por deslize.
- Cinco trilhas de upgrade e dinheiro por distância × Renda.
- Cinco mapas com distância-alvo e reset total ao avançar.
- Correntes de ar, moedas e obstáculos.
- Pixel art do PixelLab, tela em retrato.
- Toque e mouse.
- Save local, sem backend.

**Valores de partida (placeholders de MVP, só para o protótipo rodar):**

| Parâmetro | Placeholder |
|---|---|
| Escala | 1 unidade Unity = 1 m |
| Altura do lançamento | 2 m |
| Ângulo do lançamento | 0° a 75° |
| Velocidade de lançamento (força cheia) | 14 m/s, +2 m/s por nível de Lançamento |
| Arrasto | 0,012, ×0,9 por nível de Papel |
| Velocidade de estol | 7 m/s, −0,4 m/s por nível de Dobra (mínimo 3) |
| Velocidade de subida plena | estol + 6 m/s |
| Ângulo máximo de subida | 20°, +3° por nível de Dobra |
| Ângulo neutro de planeio | −8° |
| Cargas de vento | 1, +1 por nível de Vento |
| Força do impulso de vento | +3 m/s, +0,3 m/s por nível de Vento |
| Multiplicador de Renda | ×1,0, +0,25 por nível de Renda |
| Dinheiro por metro | 1 |
| Valor da moeda coletável | 5 |
| Perda de velocidade no obstáculo | 40% |
| Upgrades | 10 níveis por trilha, custo `20 × 1,5^nível` |
| Metas dos mapas | 300 / 600 / 1000 / 1500 / 2500 m |

**Fica para depois / Em aberto:** leaderboard, monetização, áudio, temas dos mapas, prestígio/bônus permanente, renda passiva.

## 13. Em aberto (consolidado)

- Pilar de design e fantasia central (§1).
- Lojas-alvo e se PC/Web é alvo (§1).
- Quem lança o avião, trajetória prevista, ângulos do lançamento (§3).
- Vento: cargas, força ou os dois; impulso levanta o nariz? (§4.2)
- Gesto exato do deslize (§4.3).
- Avião desliza no chão ou para na hora? (§4.4)
- Renda multiplica moedas? Bônus de recorde? Renda passiva? Nome da moeda (§5.1).
- Níveis e preços das trilhas; lista de papéis e dobras (§5.2).
- O que reseta além dos upgrades; avançar é obrigatório?; voltar a mapas antigos; o que vem depois do mapa 5; bônus permanente; metas dos mapas; mapa fixo ou variável (§6).
- Efeito dos obstáculos; conteúdo e dificuldade de cada mapa (§7).
- Resolução, rotação do sprite, Dobra/Papel mudam o sprite? (§8).
- Layout final das telas e marcador de recorde (§9).
- Áudio (§10).
- Leaderboard e monetização (§11).

## Histórico de versões

- **0.1.0** (2026-10-26): início do versionamento; marca o estado do GDD e do protótipo neste dia.

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para implementar o MVP do Paper Flight em Unity 6. Os números vêm da tabela de placeholders da Parte 1 §12 e ficam em assets (`GameConfig`, `UpgradeDefinition`, `MapDefinition`), para dar para balancear sem mexer no código.

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele.
- **Namespaces:**
  - `PaperFlight.Data`: ScriptableObjects e tipos de configuração.
  - `PaperFlight.Meta`: estado do jogador, save e regras de economia.
  - `PaperFlight.Flight`: avião, input de voo e estilingue.
  - `PaperFlight.World`: câmera, cenário e elementos do mapa.
  - `PaperFlight.Game`: o `RoundManager`, que amarra tudo.
  - `PaperFlight.UI`: HUD, resultado e hangar.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Uma cena só** (`Game`): o hangar e a tela de resultado são painéis de UI por cima da cena de voo.
- **Textos na tela sem emoji**, porque a fonte padrão do TextMeshPro não tem emojis.

## Arquitetura em uma página

```
                         ProgressManager (save, dinheiro, níveis, mapa atual)
                               ▲  RegisterRound / TryBuy / AdvanceMap
                               │
 HangarPanel ──Lançar──▶ RoundManager ──Prepare/Build──▶ PaperPlane + MapSpawner
 UpgradeButton           (Hangar → Aiming → Flying → Results)
                               │        ▲                 ▲
                LaunchController┘        │ Landed          │ AirCurrent / Collectible / Obstacle
                (estilingue)             │ CoinCollected   │ (triggers no mapa)
                                    FlightInput (toque = vento, deslize = nariz)
```

- **Regra de ouro:** a física do planeio fica toda em `PaperPlane`, e os números vêm de um `FlightStats` calculado pelo `GameConfig` a partir dos níveis de upgrade. Mudar o balanceamento é mexer em asset, não em código.

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, em retrato, organizado e com os pacotes certos, rodando no Play Mode.

### 0.1 Criar o projeto

1. No Unity Hub, instale o **Unity 6 LTS** com os módulos **Android Build Support** (e **iOS Build Support** se for publicar para iPhone).
2. **New project** → template **Universal 2D** → nome `PaperFlight`.
3. Abra o projeto e confira que a cena padrão roda (botão Play) sem erros no Console.

### 0.2 Estrutura de pastas

```
Assets/
  _Project/
    Scenes/            Game.unity
    Scripts/
      Data/            UpgradeTrack, FlightStats, UpgradeDefinition, MapDefinition, GameConfig
      Meta/            GameState, RoundResult, SaveSystem, ProgressManager
      Flight/          PaperPlane, FlightInput, LaunchController, FlightTestLauncher
      World/           CameraFollow, ParallaxLayer, GroundFollower, MapSpawner, AirCurrent, Collectible, Obstacle
      Game/            RoundManager
      UI/              HudView, ResultsPanel, UpgradeButton, HangarPanel, WindPuffEffect
    ScriptableObjects/
      Upgrades/
      Maps/
    Prefabs/
      Environment/     Env_Map1 ... Env_Map5
      MapElements/     AirCurrent_Up, Coin, Obstacle_*
    Art/               (sprites do jogo, copiados de Sprites/PaperFlight/, ver 0.5)
      Planes/  Backgrounds/  Ground/  Obstacles/  Common/  Icons/
    ArtUI/             (kit de UI, ver 0.5)
```

### 0.3 Pacotes e configurações

1. **Window → Package Manager**: confira que o **Input System** está instalado (vem no template). O **TextMeshPro** faz parte do pacote uGUI no Unity 6; na primeira vez que criar um texto, aceite **Import TMP Essentials**.
2. **Edit → Project Settings → Player → Other Settings → Active Input Handling**: `Input System Package (New)`.
3. **Player → Resolution and Presentation → Default Orientation**: `Portrait`.
4. Na aba **Game**, adicione uma resolução fixa `1080x1920` (retrato) para testar no Editor. A janela **Window → General → Device Simulator** também serve para ver em tamanho de celular.
5. **Edit → Project Settings → Tags and Layers**: crie a tag `Ground`.

### 0.4 Cena

1. Salve a cena atual como `Assets/_Project/Scenes/Game.unity` e coloque-a no índice 0 em **File → Build Profiles → Scene List**.

### 0.5 Importar a arte do PixelLab

A arte do MVP já está pronta em `Sprites/PaperFlight/`, neste repositório. A lista completa e os ids do PixelLab estão no `README.md` de lá, e `_preview/maps_all.png` mostra os 5 mapas montados. O guia usa esses sprites desde a Fase 3; não há fase de "arte provisória".

1. Copie só estes arquivos para o projeto. O resto da pasta (`_raw`, `_seam`, `_preview`, `_tools`, `_style-test`, `ui/_*_raw.png` e os tilesets completos `ground/<n>_<mapa>.png/.json`) é material de produção e não vai para a Unity.

| De `Sprites/PaperFlight/` | Para `Assets/_Project/` |
|---|---|
| `planes/*.png` | `Art/Planes/` |
| `backgrounds/*.png` (só os da raiz da pasta) | `Art/Backgrounds/` |
| `ground/*_surface.png` e `ground/*_fill.png` | `Art/Ground/` |
| `obstacles/*.png` | `Art/Obstacles/` |
| `common/*.png` | `Art/Common/` |
| `icons/upgrade_*.png` | `Art/Icons/` |
| `ui/panel.png`, `ui/button_blue.png`, `ui/button_yellow_square.png`, `ui/bar_frame.png`, `ui/bar_fill_white.png` | `ArtUI/` |

2. **Sprites do jogo** (tudo em `Art/`). Selecione todos de uma vez no Project e, no Inspector:
   - `Texture Type` = Sprite (2D and UI), `Sprite Mode` = Single;
   - `Pixels Per Unit` = 16 (a escala do jogo: 16 px = 1 m);
   - `Mesh Type` = Full Rect (o `Draw Mode` = Tiled da Fase 3 exige);
   - `Filter Mode` = Point (no filter), `Compression` = None;
   - **Apply**.

   Para não repetir isso a cada arquivo novo: com uma imagem já configurada, clique no ícone de ajustes no topo do Inspector → **Save current to...** → `PixelArt16`. Em **Edit → Project Settings → Preset Manager**, adicione o preset na linha `TextureImporter` com o filtro `glob:"Assets/_Project/Art/**"`. Todo PNG novo dentro de `Art/` já entra configurado.

3. **Kit de UI** (`ArtUI/`). Ele veio em resolução alta (traço fino), não em 16 px por metro, porque vive no Canvas:
   - `Texture Type` = Sprite (2D and UI), `Pixels Per Unit` = 100, `Mesh Type` = Full Rect, `Filter Mode` = Point, `Compression` = None.
   - Para o painel e os botões esticarem sem deformar os cantos (fatiamento "9-slice"), abra o **Sprite Editor** e preencha `Border` (L, T, R, B, em pixels). Os valores abaixo são de partida: ajuste arrastando as linhas verdes até os cantos arredondados e os parafusos do painel ficarem de fora do miolo.

| Sprite | Border (L, T, R, B) |
|---|---|
| `panel` | 20, 20, 20, 22 |
| `button_blue` | 14, 12, 14, 16 |
| `button_yellow_square` | 14, 12, 14, 16 |
| `bar_frame`, `bar_fill_white` | sem borda (são usados inteiros) |

4. **Pivôs.** O pivô é o ponto do sprite que fica na posição do GameObject. O padrão (Center) serve para os aviões, a moeda, a corrente de ar, a lufada, os obstáculos de ar e os ícones. Os sprites que ficam **apoiados no chão** vieram com linhas transparentes embaixo, então o pivô vai no pixel onde o desenho começa; senão eles flutuam. No **Sprite Editor**, `Pivot` = Custom e `Pivot Unit Mode` = Pixels (x a partir da esquerda, y a partir de baixo):

| Sprite | Pivot (x, y) em pixels |
|---|---|
| `1_quintal_ground_birdhouse` | 16, 7 |
| `2_parque_ground_tree` | 16, 6 |
| `3_praia_ground_palm` | 16, 14 |
| `4_cidade_ground_lamppost` | 16, 1 |
| `5_montanha_ground_pine` | 16, 10 |
| `goal_flag` | 8, 1 |
| `1_quintal_near` / `2_parque_near` / `3_praia_near` / `4_cidade_near` / `5_montanha_near` | x = largura ÷ 2; y = 1 / 1 / 2 / 0 / 3 |
| `<n>_<mapa>_far` | `Pivot` = Bottom (não precisa de pixels) |
| `<n>_<mapa>_surface` (topo do chão) | 8, 8 (Parque: 8, 9). É a linha onde a grama, a areia, a calçada ou a neve começa. |
| `<n>_<mapa>_fill` (terra embaixo) | `Pivot` = Top |

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros e a cena `Game` roda no Play Mode.
- A aba Game mostra uma tela em pé (1080×1920).
- A tag `Ground` existe.
- Arrastando `plane_1_quintal` do Project para a cena, ele aparece nítido (sem borrão) e com 2 × 2 unidades.

#### Problemas comuns
- **Erro "You are trying to read Input using the UnityEngine.Input class":** o Active Input Handling ficou em `Input Manager (Old)`. Troque para `Input System Package (New)` e reinicie o Editor.
- **Sprite borrado ou com cores "sujas":** `Filter Mode` ficou em Bilinear ou a `Compression` está ligada. Volte para Point e None.

Próxima fase: **Dados e Configuração** — os ScriptableObjects com todos os números do jogo.

---

# Parte 4 — Implementação Unity: Fase 1 (Dados e Configuração)

## Fase 1 — Dados e Configuração

> Objetivo desta fase: as trilhas de upgrade, os mapas e os números do voo existem como assets editáveis no Inspector.

### 1.1 `UpgradeTrack` e `FlightStats`

```csharp
// Caminho: Assets/_Project/Scripts/Data/UpgradeTrack.cs
namespace PaperFlight.Data
{
    // POR QUE: as cinco trilhas de upgrade (GDD §5.2) precisam de um nome fixo
    // no código para o save guardar o nível de cada uma.
    // ESTRATÉGIA: um enum com valores explícitos. O valor vira o índice do array
    // de níveis no save, então NUNCA reordene; trilhas novas entram no fim.
    public enum UpgradeTrack
    {
        Paper = 0,
        Fold = 1,
        Launch = 2,
        Wind = 3,
        Income = 4,
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/FlightStats.cs
namespace PaperFlight.Data
{
    // POR QUE: o avião não precisa saber de níveis de upgrade, só dos números
    // finais (velocidade de lançamento, arrasto...). Separar os dois deixa a
    // física simples e o balanceamento num lugar só (GameConfig).
    // ESTRATÉGIA: uma struct de dados puros, recalculada no começo de cada voo.
    [System.Serializable]
    public struct FlightStats
    {
        public float launchSpeed;      // m/s com força cheia no estilingue
        public float drag;             // arrasto: quanto o ar freia (por velocidade²)
        public float stallSpeed;       // abaixo disso o avião não sobe
        public float fullClimbSpeed;   // acima disso o avião tem o ângulo de subida inteiro
        public float maxClimbAngle;    // graus
        public int windCharges;        // impulsos de vento por voo
        public float windImpulse;      // m/s somados a cada impulso
        public float incomeMultiplier; // multiplica o dinheiro da distância
    }
}
```

### 1.2 `UpgradeDefinition`

```csharp
// Caminho: Assets/_Project/Scripts/Data/UpgradeDefinition.cs
using UnityEngine;

namespace PaperFlight.Data
{
    // POR QUE: cada trilha de upgrade tem nome, ícone, nível máximo e curva de
    // preço próprios, e queremos mudar isso sem recompilar.
    // ESTRATÉGIA: um ScriptableObject — um "arquivo de dados" que vive na pasta
    // Assets e aparece no Inspector. Criamos um asset por trilha. O efeito do
    // upgrade no voo NÃO fica aqui: fica no GameConfig, que junta todas as trilhas.
    [CreateAssetMenu(fileName = "Upgrade_", menuName = "Paper Flight/Upgrade")]
    public class UpgradeDefinition : ScriptableObject
    {
        public UpgradeTrack track;
        public string displayName = "Upgrade";
        public Sprite icon;
        [Min(1)] public int maxLevel = 10;
        [Min(1)] public int baseCost = 20;
        [Min(1f)] public float costGrowth = 1.5f;

        [Tooltip("Opcional: um nome por nível, começando no nível 0 (ex.: tipos de papel). " +
                 "Níveis sem nome mostram 'Nível N'.")]
        public string[] tierNames;

        // Já chegou no nível máximo?
        public bool IsMaxed(int level) => level >= maxLevel;

        // Preço para sair do nível atual para o próximo: baseCost × costGrowth^nível.
        public int CostForNextLevel(int currentLevel) =>
            Mathf.RoundToInt(baseCost * Mathf.Pow(costGrowth, currentLevel));

        // Texto do nível para a UI: o nome do tipo, se existir, ou "Nível N".
        public string LabelForLevel(int level)
        {
            if (tierNames != null && level < tierNames.Length && !string.IsNullOrEmpty(tierNames[level]))
                return tierNames[level];
            return $"Nível {level}";
        }
    }
}
```

### 1.3 `MapDefinition`

```csharp
// Caminho: Assets/_Project/Scripts/Data/MapDefinition.cs
using System;
using UnityEngine;

namespace PaperFlight.Data
{
    // POR QUE: cada um dos 5 mapas tem meta, cenário e elementos próprios
    // (correntes, moedas, obstáculos — GDD §6 e §7).
    // ESTRATÉGIA: um ScriptableObject por mapa. Os elementos são sorteados com
    // uma semente fixa (seed), então o mapa sai igual em toda rodada.
    [CreateAssetMenu(fileName = "Map_", menuName = "Paper Flight/Map")]
    public class MapDefinition : ScriptableObject
    {
        public string displayName = "Mapa";
        [Min(1f)] public float goalDistance = 300f;

        [Header("Visual")]
        [Tooltip("Prefab com chão e camadas de parallax deste mapa.")]
        public GameObject environmentPrefab;
        [Tooltip("Prefab colocado na distância da meta (ex.: uma bandeira).")]
        public GameObject goalMarkerPrefab;
        [Tooltip("Sprite do avião deste mapa (cada mapa tem um modelo de dobra, GDD §8).")]
        public Sprite planeSprite;
        [Tooltip("Cor do céu deste mapa. O céu não é sprite: é a cor de fundo da câmera.")]
        public Color skyColor = new Color(0.46f, 0.77f, 0.94f);

        [Header("Elementos sorteados")]
        public int seed = 1;
        [Min(0f)] public float firstSpawnDistance = 15f;
        [Min(1f)] public float minGap = 6f;
        [Min(1f)] public float maxGap = 14f;
        public SpawnEntry[] spawns;

        // Sorteia um elemento respeitando os pesos. Retorna null se a lista estiver vazia.
        public SpawnEntry PickEntry(System.Random rng)
        {
            float total = 0f;
            foreach (SpawnEntry entry in spawns)
                if (entry.prefab != null) total += entry.weight;
            if (total <= 0f) return null;

            double roll = rng.NextDouble() * total;
            SpawnEntry last = null;
            foreach (SpawnEntry entry in spawns)
            {
                if (entry.prefab == null) continue;
                last = entry;
                roll -= entry.weight;
                if (roll <= 0d) return entry;
            }
            return last; // proteção contra arredondamento
        }
    }

    // POR QUE: cada tipo de elemento tem sua chance e sua faixa de altura
    // (moeda no ar, árvore no chão...).
    // ESTRATÉGIA: [Serializable] faz a classe aparecer como uma lista editável
    // dentro do Inspector do MapDefinition.
    [Serializable]
    public class SpawnEntry
    {
        public GameObject prefab;
        [Min(0f)] public float weight = 1f;
        public float minHeight = 2f;
        public float maxHeight = 20f;
    }
}
```

### 1.4 `GameConfig`

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameConfig.cs
using System;
using UnityEngine;

namespace PaperFlight.Data
{
    // POR QUE: todos os números de balanceamento do voo (GDD §12) num asset só,
    // e a lista de upgrades e mapas do jogo.
    // ESTRATÉGIA: BuildStats() transforma "níveis de upgrade" em "números do voo"
    // (FlightStats). É o ÚNICO lugar que sabe o que cada trilha faz.
    [CreateAssetMenu(fileName = "GameConfig", menuName = "Paper Flight/Game Config")]
    public class GameConfig : ScriptableObject
    {
        [Header("Papel → arrasto")]
        public float baseDrag = 0.012f;
        [Range(0.5f, 1f)] public float dragMultiplierPerLevel = 0.9f;

        [Header("Dobra → sustentação")]
        public float baseStallSpeed = 7f;
        public float stallSpeedReductionPerLevel = 0.4f;
        public float minStallSpeed = 3f;
        [Tooltip("Velocidade de subida plena = estol + esta margem.")]
        public float fullClimbMargin = 6f;
        public float baseMaxClimbAngle = 20f;
        public float climbAnglePerLevel = 3f;

        [Header("Lançamento")]
        public float baseLaunchSpeed = 14f;
        public float launchSpeedPerLevel = 2f;

        [Header("Vento")]
        public int baseWindCharges = 1;
        public int windChargesPerLevel = 1;
        public float baseWindImpulse = 3f;
        public float windImpulsePerLevel = 0.3f;

        [Header("Renda e economia")]
        public float baseIncomeMultiplier = 1f;
        public float incomePerLevel = 0.25f;
        public float moneyPerMeter = 1f;

        [Header("Conteúdo")]
        public UpgradeDefinition[] upgrades;
        public MapDefinition[] maps;

        // Quantas trilhas existem (tamanho do array de níveis no save).
        public int TrackCount => Enum.GetValues(typeof(UpgradeTrack)).Length;

        // Converte os níveis de upgrade nos números que o avião usa no voo.
        public FlightStats BuildStats(int[] levels)
        {
            int paper = Level(levels, UpgradeTrack.Paper);
            int fold = Level(levels, UpgradeTrack.Fold);
            int launch = Level(levels, UpgradeTrack.Launch);
            int wind = Level(levels, UpgradeTrack.Wind);
            int income = Level(levels, UpgradeTrack.Income);

            float stall = Mathf.Max(minStallSpeed, baseStallSpeed - stallSpeedReductionPerLevel * fold);

            return new FlightStats
            {
                launchSpeed = baseLaunchSpeed + launchSpeedPerLevel * launch,
                drag = baseDrag * Mathf.Pow(dragMultiplierPerLevel, paper),
                stallSpeed = stall,
                fullClimbSpeed = stall + fullClimbMargin,
                maxClimbAngle = baseMaxClimbAngle + climbAnglePerLevel * fold,
                windCharges = baseWindCharges + windChargesPerLevel * wind,
                windImpulse = baseWindImpulse + windImpulsePerLevel * wind,
                incomeMultiplier = baseIncomeMultiplier + incomePerLevel * income,
            };
        }

        // Lê o nível de uma trilha com segurança (save antigo pode ter array menor).
        private static int Level(int[] levels, UpgradeTrack track)
        {
            int i = (int)track;
            return levels != null && i < levels.Length ? levels[i] : 0;
        }

        // [ContextMenu] cria uma opção no menu "⋮" do Inspector deste asset.
        // Útil para conferir os números sem dar Play.
        [ContextMenu("Debug: imprimir stats do nível 0 e do nível 10")]
        private void DebugPrintStats()
        {
            int[] zero = new int[TrackCount];
            int[] ten = new int[TrackCount];
            for (int i = 0; i < ten.Length; i++) ten[i] = 10;
            Debug.Log("Nível 0: " + JsonUtility.ToJson(BuildStats(zero), true));
            Debug.Log("Nível 10: " + JsonUtility.ToJson(BuildStats(ten), true));
        }
    }
}
```

### 1.5 Criar os assets

1. Em `ScriptableObjects/Upgrades`: **Create → Paper Flight → Upgrade** cinco vezes — `Upgrade_Paper`, `Upgrade_Fold`, `Upgrade_Launch`, `Upgrade_Wind`, `Upgrade_Income`. Em cada um, escolha o `Track` certo, um `Display Name` (Papel, Dobra, Lançamento, Vento, Renda) e o `Icon` de `Art/Icons/` (`upgrade_paper`, `upgrade_fold`, `upgrade_launch`, `upgrade_wind`, `upgrade_income`). Deixe `Tier Names` vazio por enquanto (os nomes de papéis e dobras estão **Em aberto**, GDD §5.2).
2. Em `ScriptableObjects/Maps`: cinco `MapDefinition` com os valores abaixo e `Seed` diferentes. Os campos de prefab (`Environment Prefab`, `Goal Marker Prefab`, `Spawns`) ficam vazios até as Fases 3, 6 e 9.

| Asset | Display Name | Goal Distance | Plane Sprite (`Art/Planes/`) | Sky Color (hex) |
|---|---|---|---|---|
| `Map_1` | Quintal | 300 | `plane_1_quintal` | `76C4F0` |
| `Map_2` | Parque | 600 | `plane_2_parque` | `6EBEEE` |
| `Map_3` | Praia | 1000 | `plane_3_praia` | `5ABAF0` |
| `Map_4` | Cidade | 1500 | `plane_4_cidade` | `82B8E2` |
| `Map_5` | Montanha | 2500 | `plane_5_montanha` | `78AAE1` |

   O hex vai no campo **Hexadecimal** do seletor de cor. As cores são o topo do céu das prévias; o horizonte, mais claro, fica para um degradê pós-MVP.
3. Em `ScriptableObjects`: **Create → Paper Flight → Game Config**. Arraste os 5 upgrades e os 5 mapas (na ordem) para as listas.

### ✅ Checkpoint da Fase 1
- O projeto compila sem erros.
- No `GameConfig`, **⋮ → Debug: imprimir stats...** mostra no Console os números do nível 0 (ex.: `launchSpeed: 14`, `stallSpeed: 7`) e do nível 10.

#### Problemas comuns
- **O menu "Paper Flight" não aparece em Create:** o script tem erro de compilação ou o nome do arquivo é diferente do nome da classe. Confira o Console.

Próxima fase: **Progresso e Save** — dinheiro, níveis e mapa atual que sobrevivem a fechar o jogo.

---

# Parte 5 — Implementação Unity: Fase 2 (Progresso e Save)

## Fase 2 — Progresso e Save

> Objetivo desta fase: um `ProgressManager` que guarda dinheiro, níveis, recorde e mapa atual, paga as rodadas, vende upgrades e reseta tudo ao trocar de mapa.

### 2.1 `GameState` e `RoundResult`

```csharp
// Caminho: Assets/_Project/Scripts/Meta/GameState.cs
using System;

namespace PaperFlight.Meta
{
    // POR QUE: tudo o que precisa sobreviver a fechar o app (GDD §11).
    // ESTRATÉGIA: uma classe só com campos simples, que o JsonUtility da Unity
    // sabe transformar em texto JSON e de volta.
    [Serializable]
    public class GameState
    {
        public int mapIndex;
        public long money;
        public int[] levels;       // índice = (int)UpgradeTrack
        public float bestDistance; // recorde do mapa atual
        public bool goalReached;   // a meta do mapa atual já foi batida?

        // Estado de quem nunca jogou.
        public static GameState CreateNew(int trackCount) => new GameState { levels = new int[trackCount] };

        // Corrige saves antigos que tinham menos trilhas.
        public void EnsureTrackCount(int trackCount)
        {
            if (levels == null) levels = new int[trackCount];
            else if (levels.Length < trackCount) Array.Resize(ref levels, trackCount);
        }

        // Reset total ao avançar de mapa (GDD §6). Dinheiro e recorde zerarem é placeholder.
        public void ResetForMap(int newMapIndex, int trackCount)
        {
            mapIndex = newMapIndex;
            money = 0;
            levels = new int[trackCount];
            bestDistance = 0f;
            goalReached = false;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Meta/RoundResult.cs
namespace PaperFlight.Meta
{
    // POR QUE: a tela de resultado precisa do "extrato" da rodada, não só do total.
    // ESTRATÉGIA: struct de dados puros devolvida pelo ProgressManager.RegisterRound.
    public struct RoundResult
    {
        public float distance;
        public long distanceMoney;
        public int coins;
        public long total;
        public bool newRecord;
        public bool goalJustReached;
    }
}
```

### 2.2 `SaveSystem`

```csharp
// Caminho: Assets/_Project/Scripts/Meta/SaveSystem.cs
using System;
using System.IO;
using UnityEngine;

namespace PaperFlight.Meta
{
    // POR QUE: o jogo é offline (GDD §11); o progresso fica num arquivo no aparelho.
    // ESTRATÉGIA: classe estática (não precisa estar na cena). Application.persistentDataPath
    // é a pasta que a Unity garante que dá para escrever em qualquer plataforma.
    public static class SaveSystem
    {
        private const string FileName = "paperflight_save.json";
        private static string FilePath => Path.Combine(Application.persistentDataPath, FileName);

        // Grava o estado em JSON.
        public static void Save(GameState state)
        {
            try { File.WriteAllText(FilePath, JsonUtility.ToJson(state)); }
            catch (Exception e) { Debug.LogWarning($"Falha ao salvar: {e.Message}"); }
        }

        // Lê o estado salvo. Retorna null se não existir ou estiver corrompido.
        public static GameState Load()
        {
            if (!File.Exists(FilePath)) return null;
            try { return JsonUtility.FromJson<GameState>(File.ReadAllText(FilePath)); }
            catch (Exception e)
            {
                Debug.LogWarning($"Save corrompido, começando do zero: {e.Message}");
                return null;
            }
        }

        // Apaga o save (usado pelo menu de debug).
        public static void Delete()
        {
            if (File.Exists(FilePath)) File.Delete(FilePath);
        }
    }
}
```

### 2.3 `ProgressManager`

```csharp
// Caminho: Assets/_Project/Scripts/Meta/ProgressManager.cs
using System;
using UnityEngine;
using PaperFlight.Data;

namespace PaperFlight.Meta
{
    // POR QUE: as regras de economia (pagar a rodada, comprar upgrade, trocar
    // de mapa) precisam morar num lugar só, e a UI precisa saber quando algo mudou.
    // ESTRATÉGIA: um MonoBehaviour único na cena, acessível por ProgressManager.Instance
    // (padrão "singleton"). Todo método que muda o estado termina em Commit(),
    // que salva e dispara o evento Changed para a UI se atualizar.
    // [DefaultExecutionOrder(-100)] faz o Awake deste script rodar antes dos
    // outros, para Instance já existir quando a UI ligar.
    [DefaultExecutionOrder(-100)]
    public class ProgressManager : MonoBehaviour
    {
        public static ProgressManager Instance { get; private set; }

        [SerializeField] private GameConfig _config;

        public GameConfig Config => _config;
        public GameState State { get; private set; }
        public event Action Changed;

        public MapDefinition CurrentMap => _config.maps[State.mapIndex];
        public bool IsLastMap => State.mapIndex >= _config.maps.Length - 1;
        public bool CanAdvanceMap => State.goalReached && !IsLastMap;
        public FlightStats CurrentStats => _config.BuildStats(State.levels);

        // Awake roda uma vez quando o objeto nasce, antes de Start. Aqui carregamos o save.
        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;

            State = SaveSystem.Load() ?? GameState.CreateNew(_config.TrackCount);
            State.EnsureTrackCount(_config.TrackCount);
            State.mapIndex = Mathf.Clamp(State.mapIndex, 0, _config.maps.Length - 1);
        }

        // Nível atual de uma trilha.
        public int LevelOf(UpgradeTrack track) => State.levels[(int)track];

        // Dá para comprar o próximo nível? (não está no máximo e tem dinheiro)
        public bool CanBuy(UpgradeDefinition upgrade)
        {
            int level = LevelOf(upgrade.track);
            return !upgrade.IsMaxed(level) && State.money >= upgrade.CostForNextLevel(level);
        }

        // Compra o próximo nível de uma trilha.
        public bool TryBuy(UpgradeDefinition upgrade)
        {
            if (!CanBuy(upgrade)) return false;
            State.money -= upgrade.CostForNextLevel(LevelOf(upgrade.track));
            State.levels[(int)upgrade.track]++;
            Commit();
            return true;
        }

        // Paga a rodada (distância × Renda + moedas), atualiza recorde e meta (GDD §5.1 e §6).
        public RoundResult RegisterRound(float distance, int coins)
        {
            var result = new RoundResult { distance = distance, coins = coins };
            result.distanceMoney = (long)Mathf.Floor(distance * _config.moneyPerMeter * CurrentStats.incomeMultiplier);
            result.total = result.distanceMoney + coins;
            State.money += result.total;

            if (distance > State.bestDistance)
            {
                result.newRecord = true;
                State.bestDistance = distance;
            }
            if (!State.goalReached && distance >= CurrentMap.goalDistance)
            {
                State.goalReached = true;
                result.goalJustReached = true;
            }

            Commit();
            return result;
        }

        // Vai para o próximo mapa e reseta todos os upgrades (GDD §6).
        public void AdvanceMap()
        {
            if (!CanAdvanceMap) return;
            State.ResetForMap(State.mapIndex + 1, _config.TrackCount);
            Commit();
        }

        // Salva e avisa a UI.
        private void Commit()
        {
            SaveSystem.Save(State);
            Changed?.Invoke();
        }

        // OnApplicationPause é chamado quando o app vai para segundo plano no celular.
        private void OnApplicationPause(bool paused)
        {
            if (paused && State != null) SaveSystem.Save(State);
        }

        [ContextMenu("Debug: apagar save")]
        private void DebugWipe()
        {
            SaveSystem.Delete();
            State = GameState.CreateNew(_config.TrackCount);
            Changed?.Invoke();
        }

        [ContextMenu("Debug: +1000 de dinheiro")]
        private void DebugAddMoney()
        {
            State.money += 1000;
            Commit();
        }

        [ContextMenu("Debug: simular rodada de 350 m")]
        private void DebugRound()
        {
            RoundResult r = RegisterRound(350f, 10);
            Debug.Log($"+{r.total} (distância {r.distanceMoney}, moedas {r.coins}) | recorde: {r.newRecord} | meta: {r.goalJustReached} | saldo: {State.money}");
        }
    }
}
```

### 2.4 Montar na cena

1. Na cena `Game`, crie um GameObject vazio `ProgressManager`, adicione o componente e arraste o `GameConfig` para o campo `Config`.

### ✅ Checkpoint da Fase 2
- No Play Mode, no componente `ProgressManager`, **⋮ → Debug: simular rodada de 350 m** imprime `+360 ... meta: True` no mapa 1 (meta 300 m).
- Pare e dê Play de novo: rodando a simulação outra vez, o saldo continua de onde parou (o save funcionou).
- **⋮ → Debug: apagar save** zera tudo.

#### Problemas comuns
- **`NullReferenceException` no Awake:** o campo `Config` está vazio ou a lista `Maps` do `GameConfig` está vazia.
- **Onde fica o arquivo?** No Windows, em `%USERPROFILE%\AppData\LocalLow\<Company>\PaperFlight\`. `Debug.Log(Application.persistentDataPath)` mostra o caminho.

Próxima fase: **Cena, Câmera e Cenário** — chão infinito, parallax e a câmera em retrato.

---

# Parte 6 — Implementação Unity: Fase 3 (Cena, Câmera e Cenário)

## Fase 3 — Cena, Câmera e Cenário

> Objetivo desta fase: uma câmera em retrato que segue um alvo, um chão que nunca acaba e um fundo com parallax, empacotados no prefab de ambiente do Mapa 1.

### 3.1 Câmera em pixel art

1. Selecione a **Main Camera**: `Projection` = Orthographic, posição `(0, 8, -10)`.
2. Adicione o componente **Pixel Perfect Camera** (do URP): `Assets Pixels Per Unit` = 16, `Reference Resolution` = 180 × 320 (placeholders da Parte 1 §8). Isso dá uma visão de 20 m de altura por 11,25 m de largura.
3. Na câmera, **Environment → Background Type** = Solid Color e `Background` = `#76C4F0` (o céu do Quintal). O céu não é sprite; a partir da Fase 7 o `RoundManager` troca essa cor pela do mapa atual.

### 3.2 `CameraFollow`

```csharp
// Caminho: Assets/_Project/Scripts/World/CameraFollow.cs
using UnityEngine;

namespace PaperFlight.World
{
    // POR QUE: o avião voa centenas de metros para a direita; a câmera precisa
    // acompanhar sem perder o chão de vista.
    // ESTRATÉGIA: LateUpdate roda depois de todos os Update, então a câmera se
    // move depois do avião no mesmo quadro. O avião fica à esquerda do centro
    // (offset) para o jogador ver o que vem pela frente na tela estreita do retrato.
    public class CameraFollow : MonoBehaviour
    {
        [SerializeField] private Transform _target;
        [SerializeField] private Vector2 _offset = new Vector2(3f, 1f);
        [SerializeField] private float _smoothTime = 0.12f;
        [Tooltip("Altura mínima da câmera, para o chão nunca sumir da tela.")]
        [SerializeField] private float _minY = 8f;

        private Vector3 _velocity;

        // Segue o alvo suavemente.
        private void LateUpdate()
        {
            transform.position = Vector3.SmoothDamp(transform.position, Goal(), ref _velocity, _smoothTime);
        }

        // Pula direto para o alvo (início de rodada), sem a suavização.
        public void SnapToTarget()
        {
            transform.position = Goal();
            _velocity = Vector3.zero;
        }

        // Para onde a câmera quer ir neste quadro.
        private Vector3 Goal()
        {
            Vector3 t = _target.position;
            return new Vector3(t.x + _offset.x, Mathf.Max(t.y + _offset.y, _minY), transform.position.z);
        }
    }
}
```

### 3.3 `GroundFollower` e `ParallaxLayer`

```csharp
// Caminho: Assets/_Project/Scripts/World/GroundFollower.cs
using UnityEngine;

namespace PaperFlight.World
{
    // POR QUE: um voo pode passar de 2 km; um sprite de chão desse tamanho é
    // desperdício.
    // ESTRATÉGIA: um pedaço de chão um pouco mais largo que a tela anda junto
    // com a câmera, mas "pulando" de tile em tile, então a textura parece parada.
    // DefaultExecutionOrder(100) faz este LateUpdate rodar depois do da câmera.
    [DefaultExecutionOrder(100)]
    public class GroundFollower : MonoBehaviour
    {
        [Tooltip("Largura de um tile do chão, em unidades.")]
        [SerializeField] private float _tileWidth = 1f;

        private Transform _camera;

        // Start roda uma vez, antes do primeiro quadro. Camera.main acha a câmera com a tag MainCamera.
        private void Start() => _camera = Camera.main.transform;

        // Encaixa o chão no tile mais próximo da câmera.
        private void LateUpdate()
        {
            Vector3 p = transform.position;
            p.x = Mathf.Floor(_camera.position.x / _tileWidth) * _tileWidth;
            transform.position = p;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/World/ParallaxLayer.cs
using UnityEngine;

namespace PaperFlight.World
{
    // POR QUE: camadas de fundo que andam mais devagar que o chão dão
    // profundidade e sensação de velocidade.
    // ESTRATÉGIA: factor 0 = a camada fica grudada na câmera (céu); factor 1 = anda
    // junto com o mundo (chão). A camada é um sprite repetido 3× na largura e
    // "dá a volta" (Mathf.Repeat) a cada tileWidth, então nunca acaba.
    [DefaultExecutionOrder(100)]
    public class ParallaxLayer : MonoBehaviour
    {
        [SerializeField, Range(0f, 1f)] private float _factorX = 0.3f;
        [SerializeField, Range(0f, 1f)] private float _factorY = 0.1f;
        [Tooltip("Largura de UMA repetição da imagem, em unidades.")]
        [SerializeField] private float _tileWidth = 20f;

        private Transform _camera;
        private Vector3 _start;

        // Guarda a posição inicial e acha a câmera.
        private void Start()
        {
            _camera = Camera.main.transform;
            _start = transform.position;
        }

        // Reposiciona a camada em relação à câmera.
        private void LateUpdate()
        {
            float camX = _camera.position.x;
            float x = camX - Mathf.Repeat(camX * _factorX, _tileWidth);
            float y = _start.y + _camera.position.y * (1f - _factorY);
            transform.position = new Vector3(x, y, _start.z);
        }
    }
}
```

### 3.4 Montar o prefab `Env_Map1` (Quintal)

O cenário de cada mapa é um prefab com o chão e as duas camadas de fundo (`far` e `near`). Os sprites vêm de `Art/` (Fase 0.5); os pivôs de lá fazem o topo do chão ficar exatamente em y = 0.

1. GameObject vazio `Env_Map1` em `(0, 0, 0)`.
2. Filho **`Ground`** em `(0, 0)`: tag `Ground`; `BoxCollider2D` com `Size` = (40, 10) e `Offset` = (0, -5), para o topo do collider ficar em y = 0; `Rigidbody2D` com `Body Type` = Kinematic (colliders que se movem precisam de Rigidbody); `GroundFollower` com `Tile Width` = 1.
   - Filho **`Surface`** em `(0, 0)`: `SpriteRenderer` com `1_quintal_surface`, `Draw Mode` = Tiled, `Size` = (40, 1). A grama ocupa de y = 0 até y = -0,5.
   - Filho **`Fill`** em `(0, -0.5)`: `SpriteRenderer` com `1_quintal_fill`, `Draw Mode` = Tiled, `Size` = (40, 10). A terra começa logo embaixo da grama.
3. Filho **`Near`** em `(0, 0)`: `SpriteRenderer` com `1_quintal_near`, `Draw Mode` = Tiled, `Size` = (47.8125, 8), `Order in Layer` = -10. Adicione `ParallaxLayer` com `Factor X` = 0.5, `Factor Y` = 1 (fica apoiado no chão) e `Tile Width` = 15.9375.
4. Filho **`Far`** em `(0, 3)`: `SpriteRenderer` com `1_quintal_far`, `Draw Mode` = Tiled, `Size` = (47.8125, 8), `Order in Layer` = -20. `ParallaxLayer` com `Factor X` = 0.2, `Factor Y` = 0.9 e `Tile Width` = 15.9375.
   - **Regra do `Tile Width`:** é a largura do PNG em pixels ÷ 16 (o Quintal tem 255 px). O `Size` X é 3 × `Tile Width`, para sempre cobrir a tela enquanto a camada "dá a volta". A tabela dos 5 mapas está na Fase 9.
5. Arraste `Env_Map1` para `Prefabs/Environment` e apague da cena. No asset `Map_1`, ponha o prefab em `Environment Prefab`. Os mapas 2 a 5 reusam este prefab até a Fase 9.
6. Para testar agora, coloque uma instância de `Env_Map1` na cena, crie um GameObject `TestTarget` com o sprite `plane_1_quintal` e ponha `CameraFollow` na Main Camera apontando para ele.

### ✅ Checkpoint da Fase 3
- No Play Mode, arrastando `TestTarget` para a direita na aba Scene, a câmera segue, o chão não acaba e as camadas de fundo andam em velocidades diferentes.
- O fundo do Quintal (cerca, varal, árvores) repete sem emenda visível, e a base dele encosta na grama, sem faixa de céu no meio.
- Subindo o alvo, a câmera sobe; descendo abaixo de y = 7, ela para em y = 8 e o chão continua visível.

#### Problemas comuns
- **O fundo "treme" quando a câmera anda:** a Pixel Perfect Camera arredonda a posição para o pixel. Se incomodar, desmarque **Pixel Snapping** ou teste **Upscale Render Texture**; vale testar no aparelho antes de decidir.
- **Faixa vazia entre repetições do fundo, ou o desenho "pula" ao dar a volta:** `Tile Width` diferente da largura real da imagem. Ele tem que ser exatamente largura em px ÷ 16 (15.9375 no Quintal, não 16).
- **Aviso "Sprite Tiling might not appear correctly because the Sprite used is not generated with Full Rect":** o sprite não está com `Mesh Type` = Full Rect (Fase 0.5).
- **Faixa de céu entre o fundo e o chão, ou grama "enterrada":** pivô errado no `*_near` ou no `*_surface`. Confira a tabela de pivôs da Fase 0.5.

Próxima fase: **Avião e Planeio** — a física do voo, o vento e o controle por deslize.

---

# Parte 7 — Implementação Unity: Fase 4 (Avião e Planeio)

## Fase 4 — Avião e Planeio

> Objetivo desta fase: o avião voa sozinho depois de um lançamento de teste, planeia, não consegue subir sem velocidade, recebe impulsos de vento por toque e aceita o controle de nariz por deslize.

### 4.1 `FlightInput`

```csharp
// Caminho: Assets/_Project/Scripts/Flight/FlightInput.cs
using UnityEngine;
using UnityEngine.InputSystem;

namespace PaperFlight.Flight
{
    // POR QUE: no voo, o mesmo dedo faz duas coisas: toque = vento, deslize =
    // inclinar o nariz (GDD §4.2 e §4.3). Precisamos separar uma da outra.
    // ESTRATÉGIA: Pointer.current (Input System) é "o dedo principal OU o mouse",
    // então o mesmo código serve para celular e PC. Um toque só vira vento ao
    // SOLTAR, se foi curto e quase parado; se o dedo andou, é deslize.
    public class FlightInput : MonoBehaviour
    {
        [SerializeField] private float _tapMaxDuration = 0.2f;
        [Tooltip("Quanto o dedo pode andar (fração da altura da tela) e ainda contar como toque.")]
        [SerializeField] private float _tapMaxMove = 0.02f;
        [Tooltip("Arrastar esta fração da altura da tela dá a inclinação máxima.")]
        [SerializeField] private float _fullPitchDrag = 0.15f;

        // -1 = nariz todo para baixo, 0 = neutro, +1 = nariz todo para cima.
        public float PitchInput { get; private set; }

        private bool _tracking;
        private bool _movedTooFar;
        private bool _tapPending;
        private Vector2 _startPos;
        private float _startTime;

        // OnEnable roda sempre que o componente é ligado. Limpamos o estado para
        // que o toque que soltou o estilingue não vire vento.
        private void OnEnable()
        {
            _tracking = false;
            _tapPending = false;
            PitchInput = 0f;
        }

        // Lê o ponteiro a cada quadro.
        private void Update()
        {
            Pointer pointer = Pointer.current;
            if (pointer == null) return;

            if (pointer.press.wasPressedThisFrame)
            {
                _tracking = true;
                _movedTooFar = false;
                _startPos = pointer.position.ReadValue();
                _startTime = Time.unscaledTime;
            }
            if (!_tracking) { PitchInput = 0f; return; }

            float screenH = Screen.height;
            Vector2 delta = pointer.position.ReadValue() - _startPos;
            if (delta.magnitude > _tapMaxMove * screenH) _movedTooFar = true;

            if (pointer.press.isPressed)
                PitchInput = _movedTooFar ? Mathf.Clamp(delta.y / (_fullPitchDrag * screenH), -1f, 1f) : 0f;

            if (pointer.press.wasReleasedThisFrame)
            {
                if (!_movedTooFar && Time.unscaledTime - _startTime <= _tapMaxDuration) _tapPending = true;
                _tracking = false;
                PitchInput = 0f;
            }
        }

        // Retorna true uma única vez por toque (quem chama "gasta" o toque).
        public bool ConsumeTap()
        {
            if (!_tapPending) return false;
            _tapPending = false;
            return true;
        }
    }
}
```

### 4.2 `PaperPlane`

```csharp
// Caminho: Assets/_Project/Scripts/Flight/PaperPlane.cs
using System;
using UnityEngine;
using PaperFlight.Data;

namespace PaperFlight.Flight
{
    // POR QUE: é o coração do jogo — o planeio em que subir custa velocidade e,
    // sem velocidade, não se sobe (GDD §4.1).
    // ESTRATÉGIA: em vez de deixar a gravidade da Unity agir, controlamos duas
    // variáveis — Speed (velocidade) e Pitch (ângulo do nariz) — e a cada passo
    // de física calculamos:
    //   1. o ângulo desejado (input do jogador, limitado pela velocidade);
    //   2. a aceleração ao longo do voo: -g·sen(ângulo) - arrasto·velocidade².
    //      Nariz para baixo ganha velocidade; nariz para cima perde.
    // Depois entregamos o resultado ao Rigidbody2D, que cuida das colisões.
    [RequireComponent(typeof(Rigidbody2D))]
    public class PaperPlane : MonoBehaviour
    {
        [SerializeField] private FlightInput _input;

        [Header("Atitude (graus)")]
        [SerializeField] private float _neutralPitch = -8f;
        [SerializeField] private float _maxDiveAngle = 60f;
        [Tooltip("Ângulo para onde o nariz cai quando o avião estola.")]
        [SerializeField] private float _stallDivePitch = -45f;
        [Tooltip("Quantos graus por segundo o nariz consegue girar.")]
        [SerializeField] private float _turnRate = 120f;

        [Header("Física")]
        [SerializeField] private float _gravity = 9.81f;
        [SerializeField] private float _minSpeed = 0.5f;

        public event Action Landed;
        public event Action<int> CoinCollected;
        public event Action WindUsed;

        public bool IsFlying { get; private set; }
        public float Speed { get; private set; }
        public float Pitch { get; private set; }
        public int WindChargesLeft { get; private set; }
        public FlightStats Stats => _stats;

        // 0 = sem subida (estol), 1 = subida plena. Usado também pelo velocímetro do HUD.
        public float ClimbAbility => Mathf.InverseLerp(_stats.stallSpeed, _stats.fullClimbSpeed, Speed);

        private Rigidbody2D _rb;
        private FlightStats _stats;
        private Vector2 _externalAcceleration;

        // Configura o Rigidbody2D: sem gravidade da Unity (a nossa é manual) e sem dormir.
        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _rb.gravityScale = 0f;
            _rb.sleepMode = RigidbodySleepMode2D.NeverSleep;
            _rb.interpolation = RigidbodyInterpolation2D.Interpolate;
        }

        // Coloca o avião parado no ponto de lançamento com os números do voo.
        public void Prepare(Vector2 position, FlightStats stats)
        {
            _stats = stats;
            IsFlying = false;
            Speed = 0f;
            Pitch = 0f;
            WindChargesLeft = stats.windCharges;
            _externalAcceleration = Vector2.zero;

            _rb.linearVelocity = Vector2.zero;
            _rb.angularVelocity = 0f;
            _rb.position = position;
            _rb.rotation = 0f;
            transform.SetPositionAndRotation(position, Quaternion.identity);
        }

        // Gira o avião parado enquanto o jogador mira o estilingue.
        public void Aim(float angleDeg)
        {
            if (IsFlying) return;
            Pitch = angleDeg;
            _rb.rotation = angleDeg;
            transform.rotation = Quaternion.Euler(0f, 0f, angleDeg);
        }

        // Solta o avião. power01 vem do estilingue (0 a 1).
        public void Launch(float angleDeg, float power01)
        {
            Pitch = angleDeg;
            Speed = Mathf.Max(_minSpeed, _stats.launchSpeed * Mathf.Clamp01(power01));
            IsFlying = true;
        }

        // Correntes de ar somam aceleração aqui; ela é aplicada no próximo passo de física.
        public void AddExternalAcceleration(Vector2 acceleration)
        {
            if (IsFlying) _externalAcceleration += acceleration;
        }

        // Obstáculo: perde uma fração da velocidade (placeholder do GDD §7).
        public void HitObstacle(float speedLoss01)
        {
            if (IsFlying) Speed *= 1f - Mathf.Clamp01(speedLoss01);
        }

        // Moeda coletada: só repassa o valor para quem conta o dinheiro da rodada.
        public void Collect(int value)
        {
            if (IsFlying) CoinCollected?.Invoke(value);
        }

        // Update roda a cada quadro (input); FixedUpdate roda em passos fixos (física).
        private void Update()
        {
            if (IsFlying && _input != null && _input.ConsumeTap()) UseWind();
        }

        // Gasta uma carga de vento e ganha velocidade (GDD §4.2).
        private void UseWind()
        {
            if (WindChargesLeft <= 0) return;
            WindChargesLeft--;
            Speed += _stats.windImpulse;
            WindUsed?.Invoke();
        }

        // Um passo da física do planeio.
        private void FixedUpdate()
        {
            if (!IsFlying)
            {
                _rb.linearVelocity = Vector2.zero;
                _rb.angularVelocity = 0f;
                return;
            }

            float dt = Time.fixedDeltaTime;

            // 1. O nariz gira em direção ao ângulo desejado, sem teleportar.
            Pitch = Mathf.MoveTowards(Pitch, TargetPitch(), _turnRate * dt);

            // 2. Troca de altura por velocidade, mais o arrasto do ar.
            float rad = Pitch * Mathf.Deg2Rad;
            float acceleration = -_gravity * Mathf.Sin(rad) - _stats.drag * Speed * Speed;
            Speed = Mathf.Max(_minSpeed, Speed + acceleration * dt);

            Vector2 velocity = new Vector2(Mathf.Cos(rad), Mathf.Sin(rad)) * Speed;

            // 3. Correntes de ar empurram o vetor de velocidade e mudam a direção do nariz.
            if (_externalAcceleration != Vector2.zero)
            {
                velocity += _externalAcceleration * dt;
                _externalAcceleration = Vector2.zero;
                Speed = Mathf.Max(_minSpeed, velocity.magnitude);
                Pitch = Mathf.Clamp(Mathf.Atan2(velocity.y, velocity.x) * Mathf.Rad2Deg, -80f, 80f);
            }

            _rb.linearVelocity = velocity;
            _rb.angularVelocity = 0f;
            _rb.MoveRotation(Pitch);
        }

        // O ângulo que o avião quer ter agora: a regra "sem velocidade não sobe".
        private float TargetPitch()
        {
            if (Speed <= _stats.stallSpeed) return _stallDivePitch; // estol: embica

            float maxUp = _stats.maxClimbAngle * ClimbAbility;
            float input = _input != null ? _input.PitchInput : 0f;
            return input >= 0f
                ? Mathf.Lerp(_neutralPitch, maxUp, input)
                : Mathf.Lerp(_neutralPitch, -_maxDiveAngle, -input);
        }

        // OnCollisionEnter2D é chamado pela Unity quando este collider bate em outro sólido.
        private void OnCollisionEnter2D(Collision2D collision)
        {
            if (!IsFlying || !collision.collider.CompareTag("Ground")) return;
            IsFlying = false;
            Speed = 0f;
            _rb.linearVelocity = Vector2.zero;
            Landed?.Invoke();
        }
    }
}
```

> ⚠️ Nota de versão: `rb.linearVelocity` é o nome usado no Unity 6 / 2023.x+. Se o projeto rodar em 2022 LTS, troque por `rb.velocity` (mesma coisa, nome antigo).

### 4.3 `FlightTestLauncher` (só para testar esta fase)

```csharp
// Caminho: Assets/_Project/Scripts/Flight/FlightTestLauncher.cs
using UnityEngine;
using UnityEngine.InputSystem;
using PaperFlight.Data;

namespace PaperFlight.Flight
{
    // POR QUE: o estilingue só chega na Fase 5, mas o voo precisa ser testado já.
    // ESTRATÉGIA: Espaço lança com força cheia num ângulo fixo; R volta ao início.
    // Usa os números do nível 0. Remova (ou desligue) este componente na Fase 7.
    public class FlightTestLauncher : MonoBehaviour
    {
        [SerializeField] private PaperPlane _plane;
        [SerializeField] private GameConfig _config;
        [SerializeField] private Transform _launchPoint;
        [SerializeField] private float _angle = 30f;

        // Começa com o avião pronto no ponto de lançamento.
        private void Start() => ResetPlane();

        // Lê o teclado do teste.
        private void Update()
        {
            Keyboard kb = Keyboard.current;
            if (kb == null) return;
            if (kb.spaceKey.wasPressedThisFrame && !_plane.IsFlying) _plane.Launch(_angle, 1f);
            if (kb.rKey.wasPressedThisFrame) ResetPlane();
        }

        // Volta o avião para o ponto de lançamento, mirando no ângulo de teste.
        private void ResetPlane()
        {
            _plane.Prepare(_launchPoint.position, _config.BuildStats(new int[_config.TrackCount]));
            _plane.Aim(_angle);
        }
    }
}
```

### 4.4 Montar o avião

1. GameObject `PaperPlane` com `SpriteRenderer` usando `plane_1_quintal` (2 × 2 unidades, nariz para a direita) e `Order in Layer` = 10, para ficar na frente de tudo. Na Fase 7 o `RoundManager` troca o sprite pelo avião do mapa atual.
2. Adicione `Rigidbody2D` (`Body Type` = Dynamic; os outros campos o script ajusta), `CapsuleCollider2D` (Direction = Horizontal, `Size` = (1.5, 1)) e `PaperPlane`. O desenho dos 5 aviões ocupa uns 25 × 17–20 px no quadro de 32 px, então o mesmo collider serve para todos.
3. No mesmo objeto, adicione `FlightInput` e arraste-o para o campo `Input` do `PaperPlane`.
4. GameObject vazio `LaunchPoint` em `(0, 2)`.
5. GameObject `FlightTest` com `FlightTestLauncher` (Plane, Config, Launch Point preenchidos).
6. Na Main Camera, troque o alvo do `CameraFollow` de `TestTarget` para `PaperPlane` (e apague o `TestTarget`).

### ✅ Checkpoint da Fase 4
- Play → Espaço: o avião sai a 30°, perde velocidade, inclina para baixo e planeia até o chão, onde para.
- Segurando o clique e arrastando para **cima** logo no começo do voo, o avião sobe; segurando para cima o tempo todo, ele vai perdendo velocidade, deixa de subir e embica (estol). Essa é a regra do GDD §4.1 funcionando.
- Um clique rápido no meio do voo dá um "empurrão" (1 carga no nível 0); o segundo clique não faz nada.
- R volta o avião ao ponto de lançamento.

#### Problemas comuns
- **O avião atravessa o chão:** o chão está sem a tag `Ground`, sem collider, ou o `BoxCollider2D` não está no topo do sprite. Em voos muito rápidos, ponha o `Collision Detection` do `Rigidbody2D` do avião em `Continuous`.
- **O nariz não gira no voo:** **Constraints → Freeze Rotation Z** está marcado no `Rigidbody2D`. Desmarque; o script já zera a rotação causada por física a cada passo.
- **O voo parece lento ou rápido demais:** ajuste o `GameConfig` (velocidade de lançamento, arrasto) e o `_neutralPitch`. Lembre que os números são placeholders.

Próxima fase: **Lançamento Estilingue** — puxar e soltar para lançar.

---

# Parte 8 — Implementação Unity: Fase 5 (Lançamento Estilingue)

## Fase 5 — Lançamento Estilingue

> Objetivo desta fase: o jogador lança o avião arrastando para trás e soltando, com força e ângulo definidos pelo arrasto (GDD §3).

### 5.1 `LaunchController`

```csharp
// Caminho: Assets/_Project/Scripts/Flight/LaunchController.cs
using System;
using UnityEngine;
using UnityEngine.InputSystem;

namespace PaperFlight.Flight
{
    // POR QUE: o lançamento é um gesto de estilingue: puxar para trás e soltar.
    // ESTRATÉGIA: guardamos onde o dedo encostou; o vetor "ponto inicial − ponto
    // atual" aponta para onde o avião vai. O tamanho desse vetor (em metros do
    // mundo) vira a força, de 0 a 1. Uma LineRenderer mostra a mira.
    public class LaunchController : MonoBehaviour
    {
        [SerializeField] private PaperPlane _plane;
        [SerializeField] private Camera _camera;
        [SerializeField] private LineRenderer _aimLine;

        [Header("Estilingue")]
        [Tooltip("Arrastar esta distância (em unidades do mundo) dá força cheia.")]
        [SerializeField] private float _maxPullDistance = 3f;
        [Tooltip("Abaixo desta força o lançamento é cancelado.")]
        [SerializeField, Range(0f, 1f)] private float _minPower = 0.15f;
        [SerializeField] private float _minAngle = 0f;
        [SerializeField] private float _maxAngle = 75f;
        [SerializeField] private float _aimLineMaxLength = 4f;

        public event Action Launched;

        private bool _dragging;
        private Vector2 _pressWorld;

        // Ao ligar ou desligar, cancela qualquer arrasto pela metade.
        private void OnEnable() { _dragging = false; SetLineVisible(false); }
        private void OnDisable() { _dragging = false; SetLineVisible(false); }

        // Acompanha o arrasto e lança ao soltar.
        private void Update()
        {
            Pointer pointer = Pointer.current;
            if (pointer == null) return;

            Vector2 world = ScreenToWorld(pointer.position.ReadValue());
            if (pointer.press.wasPressedThisFrame)
            {
                _dragging = true;
                _pressWorld = world;
            }
            if (!_dragging) return;

            Vector2 pull = _pressWorld - world;
            float power = Mathf.Clamp01(pull.magnitude / _maxPullDistance);
            float angle = pull.sqrMagnitude > 0.0001f
                ? Mathf.Clamp(Mathf.Atan2(pull.y, pull.x) * Mathf.Rad2Deg, _minAngle, _maxAngle)
                : _minAngle;

            _plane.Aim(angle);
            DrawAimLine(angle, power);

            if (pointer.press.wasReleasedThisFrame)
            {
                _dragging = false;
                SetLineVisible(false);
                if (power >= _minPower)
                {
                    _plane.Launch(angle, power);
                    Launched?.Invoke();
                }
            }
        }

        // Converte a posição na tela (pixels) para o mundo (metros).
        private Vector2 ScreenToWorld(Vector2 screen) =>
            _camera.ScreenToWorldPoint(new Vector3(screen.x, screen.y, -_camera.transform.position.z));

        // Desenha a mira saindo do avião: direção = ângulo, comprimento = força.
        private void DrawAimLine(float angle, float power)
        {
            SetLineVisible(power >= _minPower);
            float rad = angle * Mathf.Deg2Rad;
            Vector3 start = _plane.transform.position;
            Vector3 end = start + new Vector3(Mathf.Cos(rad), Mathf.Sin(rad), 0f) * (_aimLineMaxLength * power);
            _aimLine.positionCount = 2;
            _aimLine.SetPosition(0, start);
            _aimLine.SetPosition(1, end);
        }

        // Liga/desliga a linha com segurança (o campo pode estar vazio).
        private void SetLineVisible(bool visible)
        {
            if (_aimLine != null) _aimLine.enabled = visible;
        }
    }
}
```

### 5.2 Montar

1. GameObject `Launcher` com `LaunchController`. Crie um filho `AimLine` com `LineRenderer`: `Use World Space` marcado, `Width` 0,1, material `Sprite-Lit-Default`, cor branca. Preencha `Plane`, `Camera` e `Aim Line`.
2. Deixe o `FlightTestLauncher` ligado nesta fase só para preparar o avião (o `Start` dele chama `Prepare`; R reposiciona). Não use o Espaço: quem lança agora é o estilingue. A partir da Fase 7, o `RoundManager` assume o `Prepare`.

### ✅ Checkpoint da Fase 5
- Arrastando para baixo e para a esquerda, o avião gira para cima e a linha cresce com o arrasto.
- Soltando, o avião sai na direção da linha; um arrasto curtinho não lança.
- Arrastando para a direita (direção errada), o ângulo trava em 75°; para cima e para a esquerda, trava em 0°.

#### Problemas comuns
- **O voo começa e o avião logo recebe um impulso de vento:** o `FlightInput` estava ligado durante a mira e contou o soltar do estilingue como toque. Na Fase 7 o `RoundManager` só liga o `FlightInput` depois do lançamento; até lá, ignore.
- **A linha não aparece:** o `LineRenderer` está atrás do cenário. Ajuste `Order in Layer` (aba Additional Settings) para um valor alto.

Próxima fase: **Elementos do Mapa** — correntes de ar, moedas, obstáculos e a meta.

---

# Parte 9 — Implementação Unity: Fase 6 (Elementos do Mapa)

## Fase 6 — Elementos do Mapa

> Objetivo desta fase: correntes de ar, moedas e obstáculos aparecem à frente do avião sempre no mesmo lugar para cada mapa, e uma bandeira marca a meta.

### 6.1 `AirCurrent`, `Collectible`, `Obstacle`

```csharp
// Caminho: Assets/_Project/Scripts/World/AirCurrent.cs
using UnityEngine;
using PaperFlight.Flight;

namespace PaperFlight.World
{
    // POR QUE: zonas que empurram o avião para cima ou para baixo (GDD §7).
    // ESTRATÉGIA: um collider marcado como "Is Trigger" não bloqueia nada, só
    // avisa quem está dentro. OnTriggerStay2D é chamado a cada passo de física
    // enquanto o avião estiver na zona.
    [RequireComponent(typeof(Collider2D))]
    public class AirCurrent : MonoBehaviour
    {
        [Tooltip("Aceleração em m/s². (0, 12) empurra para cima; (0, -8) para baixo.")]
        [SerializeField] private Vector2 _acceleration = new Vector2(0f, 12f);

        // Empurra o avião enquanto ele estiver dentro.
        private void OnTriggerStay2D(Collider2D other)
        {
            if (other.attachedRigidbody != null && other.attachedRigidbody.TryGetComponent(out PaperPlane plane))
                plane.AddExternalAcceleration(_acceleration);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/World/Collectible.cs
using UnityEngine;
using PaperFlight.Flight;

namespace PaperFlight.World
{
    // POR QUE: moedas no caminho somam dinheiro à rodada (GDD §7).
    // ESTRATÉGIA: trigger; ao encostar, entrega o valor ao avião e se esconde.
    // O MapSpawner recria tudo na próxima rodada.
    [RequireComponent(typeof(Collider2D))]
    public class Collectible : MonoBehaviour
    {
        [SerializeField, Min(1)] private int _value = 5;

        // OnTriggerEnter2D: chamado uma vez quando algo entra no trigger.
        private void OnTriggerEnter2D(Collider2D other)
        {
            if (other.attachedRigidbody == null || !other.attachedRigidbody.TryGetComponent(out PaperPlane plane)) return;
            if (!plane.IsFlying) return;
            plane.Collect(_value);
            gameObject.SetActive(false);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/World/Obstacle.cs
using UnityEngine;
using PaperFlight.Flight;

namespace PaperFlight.World
{
    // POR QUE: árvores, prédios, pássaros no caminho (GDD §7). O efeito está
    // Em aberto; o placeholder é frear o avião.
    // ESTRATÉGIA: trigger que aplica a perda de velocidade uma única vez. Se a
    // decisão virar "derruba o avião", é só trocar HitObstacle por um fim de voo.
    [RequireComponent(typeof(Collider2D))]
    public class Obstacle : MonoBehaviour
    {
        [SerializeField, Range(0f, 1f)] private float _speedLoss = 0.4f;

        private bool _hit;

        // Freia o avião na primeira vez que ele encosta.
        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_hit) return;
            if (other.attachedRigidbody == null || !other.attachedRigidbody.TryGetComponent(out PaperPlane plane)) return;
            _hit = true;
            plane.HitObstacle(_speedLoss);
        }
    }
}
```

### 6.2 `MapSpawner`

```csharp
// Caminho: Assets/_Project/Scripts/World/MapSpawner.cs
using System.Collections.Generic;
using UnityEngine;
using PaperFlight.Data;

namespace PaperFlight.World
{
    // POR QUE: um mapa de 2,5 km com tudo instanciado de uma vez é pesado no
    // celular, e montar tudo à mão nos 5 mapas dá muito trabalho no MVP.
    // ESTRATÉGIA: criamos os elementos só um pouco à frente da câmera e
    // destruímos os que ficaram para trás. System.Random com a semente do mapa
    // sorteia sempre a mesma sequência, então o mapa é igual em toda rodada
    // (placeholder do GDD §6).
    public class MapSpawner : MonoBehaviour
    {
        [SerializeField] private Transform _camera;
        [SerializeField] private float _spawnAhead = 30f;
        [SerializeField] private float _despawnBehind = 15f;

        private readonly List<GameObject> _spawned = new List<GameObject>();
        private MapDefinition _map;
        private System.Random _rng;
        private float _nextX;
        private GameObject _goalMarker;

        // Recomeça o mapa do zero para uma rodada nova.
        public void Build(MapDefinition map, float startX)
        {
            Clear();
            _map = map;
            _rng = new System.Random(map.seed);
            _nextX = startX + map.firstSpawnDistance;

            if (map.goalMarkerPrefab != null)
                _goalMarker = Instantiate(map.goalMarkerPrefab, new Vector3(startX + map.goalDistance, 0f, 0f), Quaternion.identity, transform);
        }

        // Destrói tudo o que foi criado.
        public void Clear()
        {
            foreach (GameObject go in _spawned)
                if (go != null) Destroy(go);
            _spawned.Clear();
            if (_goalMarker != null) Destroy(_goalMarker);
            _map = null;
        }

        // Cria o que falta à frente e limpa o que ficou para trás.
        private void Update()
        {
            if (_map == null) return;
            float camX = _camera.position.x;

            while (_nextX < camX + _spawnAhead) SpawnNext();

            for (int i = _spawned.Count - 1; i >= 0; i--)
            {
                GameObject go = _spawned[i];
                if (go == null || go.transform.position.x < camX - _despawnBehind)
                {
                    if (go != null) Destroy(go);
                    _spawned.RemoveAt(i);
                }
            }
        }

        // Sorteia um elemento, sua altura e a distância até o próximo.
        private void SpawnNext()
        {
            SpawnEntry entry = _map.PickEntry(_rng);
            if (entry != null)
            {
                float height = Mathf.Lerp(entry.minHeight, entry.maxHeight, (float)_rng.NextDouble());
                _spawned.Add(Instantiate(entry.prefab, new Vector3(_nextX, height, 0f), Quaternion.identity, transform));
            }
            _nextX += Mathf.Max(1f, Mathf.Lerp(_map.minGap, _map.maxGap, (float)_rng.NextDouble()));
        }
    }
}
```

### 6.3 Prefabs

Todos em `Prefabs/MapElements`, com sprites de `Art/` (Fase 0.5). A ordem de desenho fica: fundo (-20, -10) → bandeira (3) → obstáculos (4) → corrente (5) → moeda (6) → avião (10).

1. **`AirCurrent_Up`** (comum a todos os mapas): `SpriteRenderer` com `air_current` (3 × 8 unidades), `Order in Layer` = 5 e `Color` com alfa 150 (o desenho é opaco demais para ficar por cima do cenário); `BoxCollider2D` com **Is Trigger** e `Size` = (2.2, 7) (o redemoinho ocupa ~35 × 111 px); `AirCurrent` com aceleração `(0, 12)`.
2. **`Coin`** (comum): `SpriteRenderer` com `coin` (1 × 1 unidade), `Order in Layer` = 6; `CircleCollider2D` com **Is Trigger** e `Radius` = 0.45; `Collectible`.
3. **`GoalFlag`** (comum): `SpriteRenderer` com `goal_flag`, `Order in Layer` = 3, sem collider. O pivô da Fase 0.5 apoia o mastro no chão.
4. **Obstáculos do Mapa 1:**
   - `Obstacle_Birdhouse`: `SpriteRenderer` com `1_quintal_ground_birdhouse`, `Order in Layer` = 4; `PolygonCollider2D` com **Is Trigger** (ele gera o contorno a partir do desenho, então o avião só bate onde há pixel); `Obstacle`.
   - `Obstacle_Sparrow`: igual, com `1_quintal_air_sparrow`.
   - Os obstáculos dos mapas 2 a 5 seguem o mesmo molde (Fase 9).
5. No `Map_1`: `Goal Marker Prefab` = `GoalFlag`; `Spawns`:

| Prefab | Peso | Altura mín. | Altura máx. |
|---|---|---|---|
| Coin | 3 | 2 | 15 |
| AirCurrent_Up | 1 | 4 | 4 |
| Obstacle_Birdhouse | 1 | 0 | 0 |
| Obstacle_Sparrow | 0,5 | 6 | 18 |

   Obstáculo de chão usa altura 0: o pivô (Fase 0.5) coloca a base no chão. A corrente tem o pivô no centro, então altura 4 faz ela ir do chão (0) até 8 m.

6. Na cena: GameObject `MapSpawner` com o componente, `Camera` = Main Camera. Quem chama `Build` é o `RoundManager` (Fase 7), então o teste desta fase acontece lá.

### ✅ Checkpoint da Fase 6
- (Conferido na Fase 7, quando o `RoundManager` chamar `Build`.) Moedas, correntes e obstáculos aparecem à frente e somem atrás; voltando ao início (nova rodada), aparecem nos mesmos lugares.
- Passando por uma corrente para cima, o avião ganha altura e velocidade.
- Encostando na casinha de passarinho, o avião perde velocidade uma vez só; passar perto, no vazio do desenho, não conta.
- A casinha e a bandeira ficam apoiadas no chão, sem flutuar.

#### Problemas comuns
- **O avião passa pela corrente e nada acontece:** um dos dois objetos precisa ter `Rigidbody2D` (o avião tem) e o collider da corrente precisa estar com **Is Trigger**. Confira também se o avião não "dormiu" — o script já põe `NeverSleep`.
- **O Editor trava ao dar Play:** `minGap`/`maxGap` em 0 fariam o loop do spawner nunca terminar; o código força pelo menos 1 m, mas confira os valores do mapa.

Próxima fase: **Rodada, HUD e Resultados** — o ciclo lançar → voar → receber.

---

# Parte 10 — Implementação Unity: Fase 7 (Rodada, HUD e Resultados)

## Fase 7 — Rodada, HUD e Resultados

> Objetivo desta fase: o jogo roda o ciclo completo — mirar, voar, pousar, ver o resultado e ganhar dinheiro — com HUD de voo.

### 7.1 `HudView`

```csharp
// Caminho: Assets/_Project/Scripts/UI/HudView.cs
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using PaperFlight.Flight;

namespace PaperFlight.UI
{
    // POR QUE: durante o voo o jogador precisa ver distância, meta, cargas de
    // vento e — principalmente — se tem velocidade para subir (GDD §9).
    // ESTRATÉGIA: só mostra; quem chama Refresh é o RoundManager. O velocímetro
    // muda de cor conforme a regra do planeio (vermelho/amarelo/verde).
    public class HudView : MonoBehaviour
    {
        [SerializeField] private TMP_Text _distanceText;
        [SerializeField] private TMP_Text _goalText;
        [SerializeField] private TMP_Text _windText;
        [SerializeField] private Image _speedFill;
        [SerializeField] private Color _stallColor = new Color(0.9f, 0.25f, 0.2f);
        [SerializeField] private Color _partialColor = new Color(0.95f, 0.8f, 0.2f);
        [SerializeField] private Color _fullColor = new Color(0.3f, 0.85f, 0.35f);

        // Liga o HUD com a meta e o recorde do mapa.
        public void Show(float goalDistance, float bestDistance)
        {
            gameObject.SetActive(true);
            _goalText.text = $"Meta {goalDistance:0} m  |  Recorde {bestDistance:0} m";
        }

        // Esconde o HUD.
        public void Hide() => gameObject.SetActive(false);

        // Atualiza os números do voo.
        public void Refresh(float distance, PaperPlane plane)
        {
            _distanceText.text = $"{Mathf.Max(0f, distance):0} m";
            _windText.text = $"Vento x{plane.WindChargesLeft}";

            float maxShown = plane.Stats.fullClimbSpeed * 1.5f;
            _speedFill.fillAmount = maxShown > 0f ? Mathf.Clamp01(plane.Speed / maxShown) : 0f;
            _speedFill.color = plane.Speed <= plane.Stats.stallSpeed ? _stallColor
                : plane.ClimbAbility >= 1f ? _fullColor
                : _partialColor;
        }
    }
}
```

### 7.2 `ResultsPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ResultsPanel.cs
using TMPro;
using UnityEngine;
using PaperFlight.Meta;

namespace PaperFlight.UI
{
    // POR QUE: depois do pouso o jogador vê o "extrato" da rodada (GDD §9).
    // ESTRATÉGIA: um painel que só preenche textos. O botão "Continuar" é ligado
    // no Inspector ao RoundManager.ShowHangar.
    public class ResultsPanel : MonoBehaviour
    {
        [SerializeField] private TMP_Text _distanceText;
        [SerializeField] private TMP_Text _moneyText;
        [SerializeField] private TMP_Text _extraText;

        // Mostra o resultado da rodada.
        public void Show(RoundResult result, float goalDistance, bool isLastMap)
        {
            gameObject.SetActive(true);
            _distanceText.text = $"{result.distance:0} m" + (result.newRecord ? "\nNOVO RECORDE!" : "");
            _moneyText.text = $"Distância: +{result.distanceMoney}\nMoedas: +{result.coins}\nTotal: +{result.total}";

            if (result.goalJustReached)
                _extraText.text = isLastMap
                    ? "Você completou o último mapa!"
                    : "Meta batida! O próximo mapa foi liberado no hangar.";
            else
                _extraText.text = $"Meta do mapa: {goalDistance:0} m";
        }

        // Esconde o painel.
        public void Hide() => gameObject.SetActive(false);
    }
}
```

### 7.3 `RoundManager`

```csharp
// Caminho: Assets/_Project/Scripts/Game/RoundManager.cs
using UnityEngine;
using PaperFlight.Data;
using PaperFlight.Flight;
using PaperFlight.Meta;
using PaperFlight.UI;
using PaperFlight.World;

namespace PaperFlight.Game
{
    // POR QUE: alguém precisa conduzir o ciclo da rodada (GDD §2) e ligar/desligar
    // cada peça na hora certa: o estilingue só na mira, o input de voo só no voo.
    // ESTRATÉGIA: uma máquina de estados simples (Phase). Cada transição é um
    // método público curto. O hangar é só um GameObject para esta classe — se
    // ainda não existir (antes da Fase 8), o jogo vai direto para a mira.
    public class RoundManager : MonoBehaviour
    {
        public enum Phase { Hangar, Aiming, Flying, Results }

        [Header("Voo")]
        [SerializeField] private PaperPlane _plane;
        [SerializeField] private SpriteRenderer _planeRenderer;
        [SerializeField] private FlightInput _flightInput;
        [SerializeField] private LaunchController _launch;
        [SerializeField] private Transform _launchPoint;

        [Header("Mundo")]
        [SerializeField] private CameraFollow _cameraFollow;
        [SerializeField] private Camera _camera;
        [SerializeField] private MapSpawner _spawner;
        [SerializeField] private Transform _environmentRoot;

        [Header("UI")]
        [SerializeField] private HudView _hud;
        [SerializeField] private ResultsPanel _results;
        [SerializeField] private GameObject _hangarRoot;

        public Phase CurrentPhase { get; private set; }

        private int _coins;
        private GameObject _environment;
        private MapDefinition _loadedMap;

        private ProgressManager Progress => ProgressManager.Instance;
        private float Distance => _plane.transform.position.x - _launchPoint.position.x;

        // Assina os eventos (+=) e abre o hangar.
        private void Start()
        {
            _plane.Landed += OnLanded;
            _plane.CoinCollected += OnCoinCollected;
            _launch.Launched += OnLaunched;
            LoadMapEnvironment();
            ShowHangar();
        }

        // Cancela as assinaturas (-=) quando o objeto é destruído.
        private void OnDestroy()
        {
            if (_plane != null) { _plane.Landed -= OnLanded; _plane.CoinCollected -= OnCoinCollected; }
            if (_launch != null) _launch.Launched -= OnLaunched;
        }

        // Atualiza o HUD durante o voo.
        private void Update()
        {
            if (CurrentPhase == Phase.Flying) _hud.Refresh(Distance, _plane);
        }

        // Volta ao hangar (também chamado pelo botão "Continuar" do resultado).
        public void ShowHangar()
        {
            CurrentPhase = Phase.Hangar;
            _results.Hide();
            _hud.Hide();
            _launch.enabled = false;
            _flightInput.enabled = false;
            ResetPlaneAndMap();

            if (_hangarRoot != null) _hangarRoot.SetActive(true);
            else StartAiming();
        }

        // Começa a mira (botão "Lançar" do hangar).
        public void StartAiming()
        {
            if (_hangarRoot != null) _hangarRoot.SetActive(false);
            _results.Hide();
            ResetPlaneAndMap();
            _hud.Show(Progress.CurrentMap.goalDistance, Progress.State.bestDistance);
            _hud.Refresh(0f, _plane);
            _launch.enabled = true;
            CurrentPhase = Phase.Aiming;
        }

        // Troca de mapa com reset total (botão "Próximo mapa" do hangar).
        public void AdvanceMap()
        {
            Progress.AdvanceMap();
            LoadMapEnvironment();
            ShowHangar();
        }

        // Avião no ponto de lançamento com os upgrades atuais; mapa recriado do zero.
        private void ResetPlaneAndMap()
        {
            _coins = 0;
            _plane.Prepare(_launchPoint.position, Progress.CurrentStats);
            _spawner.Build(Progress.CurrentMap, _launchPoint.position.x);
            _cameraFollow.SnapToTarget();
        }

        // Troca cenário, avião e cor do céu quando o mapa muda.
        private void LoadMapEnvironment()
        {
            if (_loadedMap == Progress.CurrentMap) return;
            if (_environment != null) Destroy(_environment);
            _loadedMap = Progress.CurrentMap;
            if (_loadedMap.environmentPrefab != null)
                _environment = Instantiate(_loadedMap.environmentPrefab, _environmentRoot);
            if (_loadedMap.planeSprite != null) _planeRenderer.sprite = _loadedMap.planeSprite;
            _camera.backgroundColor = _loadedMap.skyColor;
        }

        // O estilingue soltou: desliga a mira, liga o controle de voo.
        private void OnLaunched()
        {
            _launch.enabled = false;
            _flightInput.enabled = true;
            CurrentPhase = Phase.Flying;
        }

        // Soma moedas da rodada.
        private void OnCoinCollected(int value) => _coins += value;

        // Pousou: paga a rodada e mostra o resultado.
        private void OnLanded()
        {
            _flightInput.enabled = false;
            CurrentPhase = Phase.Results;

            float distance = Mathf.Max(0f, Distance);
            _hud.Refresh(distance, _plane);
            RoundResult result = Progress.RegisterRound(distance, _coins);
            _results.Show(result, Progress.CurrentMap.goalDistance, Progress.IsLastMap);
        }
    }
}
```

### 7.4 Montar a cena

1. **Apague** a instância de `Env_Map1` da cena (agora quem cria é o `RoundManager`) e o objeto `FlightTest`. Crie um GameObject vazio `Environment` em `(0, 0)`.
2. **Desligue** o componente `FlightInput` do avião e o `LaunchController` (o `RoundManager` liga cada um na hora certa).
3. Crie **UI → Canvas**: `Canvas Scaler` em `Scale With Screen Size`, referência 1080 × 1920, `Match` = 0,5.
   - **Regra de tamanho do kit de UI:** use tudo em **3×** o tamanho original (3 × 360 px de largura útil ≈ a tela de 1080). Nas `Image` fatiadas (`Image Type` = Sliced), ponha `Pixels Per Unit Multiplier` = 0.33, para as bordas também ficarem 3× maiores e na mesma escala do resto.
   - `Hud` (painel sem fundo): `DistanceText` grande no topo, `GoalText` abaixo, `WindText` no canto e o velocímetro:
     - `SpeedBar`: `Image` com `bar_frame`, `Image Type` = Simple, tamanho 963 × 99 (3 × 321 × 33).
     - Filho `Fill`: `Image` com `bar_fill_white`, `Image Type` = Filled, `Fill Method` = Horizontal, `Fill Origin` = Left. Âncoras esticadas nos dois eixos (preset "stretch" com Alt), com `Left`/`Right` = 42 e `Top`/`Bottom` = 24: o trilho da moldura começa 14 px dos lados e 8 px de cima e de baixo, × 3. O fill é branco de propósito: o `HudView` pinta de vermelho, amarelo ou verde.
     - Desmarque **Raycast Target** em tudo do HUD. Adicione `HudView` ao `Hud` e ligue `Speed Fill` ao `Fill`.
   - `Results`: `Image` com `panel`, Sliced, multiplier 0.33, centralizado (~900 × 700). Dentro, três textos e o botão **Continuar** (`Image` com `button_blue`, Sliced, multiplier 0.33, ~480 × 195). Adicione `ResultsPanel`. Use texto escuro (marrom ou preto) por cima do papel creme.
4. GameObject `RoundManager` com o componente; preencha todos os campos (`Camera` = Main Camera; `Plane Renderer` = o `SpriteRenderer` do avião). Deixe `Hangar Root` vazio por enquanto.
5. No botão **Continuar**: `On Click ()` → arraste o `RoundManager` → `RoundManager.ShowHangar`.

### ✅ Checkpoint da Fase 7
- Play: o avião aparece pronto no ponto de lançamento, com o HUD. Arraste e solte: o avião voa e o HUD mostra a distância subindo e o velocímetro mudando de cor.
- Puxando o nariz para cima, a barra fica amarela e depois vermelha, e o avião para de subir.
- Ao pousar: o painel de resultado mostra distância e dinheiro. "Continuar" volta à mira (sem hangar ainda) e os elementos do mapa reaparecem nos mesmos lugares.
- Parando e dando Play de novo, o recorde no HUD é o da rodada anterior (save funcionando).

#### Problemas comuns
- **O avião ganha um impulso de vento logo ao ser lançado:** o `FlightInput` ficou ligado no Inspector. Ele deve começar desligado.
- **Nada acontece ao arrastar:** o `LaunchController` não foi ligado — confira se `Hangar Root` está vazio (aí o `ShowHangar` chama `StartAiming`) e se o campo `Launch` do `RoundManager` está preenchido.
- **Distância negativa:** o `LaunchPoint` não está em x = 0 ou foi movido; a distância é medida a partir dele.

Próxima fase: **Hangar: Upgrades e Troca de Mapa** — gastar o dinheiro e avançar de mapa.

---

# Parte 11 — Implementação Unity: Fase 8 (Hangar: Upgrades e Troca de Mapa)

## Fase 8 — Hangar: Upgrades e Troca de Mapa

> Objetivo desta fase: entre uma rodada e outra o jogador compra upgrades nas cinco trilhas e, ao bater a meta, avança de mapa com reset total.

### 8.1 `UpgradeButton`

```csharp
// Caminho: Assets/_Project/Scripts/UI/UpgradeButton.cs
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using PaperFlight.Data;
using PaperFlight.Meta;

namespace PaperFlight.UI
{
    // POR QUE: cada trilha (GDD §5.2) precisa de um botão com nome, nível e preço.
    // ESTRATÉGIA: um prefab de botão reaproveitado 5 vezes, cada um apontando para
    // um UpgradeDefinition. Ele escuta ProgressManager.Changed para se atualizar
    // sempre que o dinheiro ou um nível muda.
    public class UpgradeButton : MonoBehaviour
    {
        [SerializeField] private UpgradeDefinition _upgrade;
        [SerializeField] private Button _button;
        [SerializeField] private Image _icon;
        [SerializeField] private TMP_Text _nameText;
        [SerializeField] private TMP_Text _levelText;
        [SerializeField] private TMP_Text _costText;

        // Liga o clique à compra e põe o ícone.
        private void Awake()
        {
            _button.onClick.AddListener(() => ProgressManager.Instance.TryBuy(_upgrade));
            if (_icon != null && _upgrade.icon != null) _icon.sprite = _upgrade.icon;
        }

        // Começa a escutar mudanças e já se desenha.
        private void OnEnable()
        {
            ProgressManager.Instance.Changed += Refresh;
            Refresh();
        }

        // Para de escutar (evita erro quando o objeto é desligado).
        private void OnDisable()
        {
            if (ProgressManager.Instance != null) ProgressManager.Instance.Changed -= Refresh;
        }

        // Atualiza textos e se o botão pode ser clicado.
        private void Refresh()
        {
            ProgressManager progress = ProgressManager.Instance;
            int level = progress.LevelOf(_upgrade.track);

            _nameText.text = _upgrade.displayName;
            _levelText.text = $"{_upgrade.LabelForLevel(level)} ({level}/{_upgrade.maxLevel})";

            if (_upgrade.IsMaxed(level))
            {
                _costText.text = "MÁX";
                _button.interactable = false;
            }
            else
            {
                _costText.text = $"$ {_upgrade.CostForNextLevel(level)}";
                _button.interactable = progress.CanBuy(_upgrade);
            }
        }
    }
}
```

### 8.2 `HangarPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/HangarPanel.cs
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using PaperFlight.Game;
using PaperFlight.Meta;

namespace PaperFlight.UI
{
    // POR QUE: a tela entre rodadas: dinheiro, mapa, meta, botão de lançar e o
    // botão de avançar de mapa, que só aparece depois da meta (GDD §6).
    // ESTRATÉGIA: como avançar de mapa apaga todos os upgrades, o botão abre uma
    // confirmação antes (placeholder do GDD §6).
    public class HangarPanel : MonoBehaviour
    {
        [SerializeField] private RoundManager _round;
        [SerializeField] private TMP_Text _moneyText;
        [SerializeField] private TMP_Text _mapText;
        [SerializeField] private TMP_Text _bestText;
        [SerializeField] private Button _launchButton;
        [SerializeField] private Button _nextMapButton;

        [Header("Confirmação de troca de mapa")]
        [SerializeField] private GameObject _confirmPanel;
        [SerializeField] private Button _confirmYes;
        [SerializeField] private Button _confirmNo;

        // Liga os botões aos métodos certos.
        private void Awake()
        {
            _launchButton.onClick.AddListener(_round.StartAiming);
            _nextMapButton.onClick.AddListener(() => _confirmPanel.SetActive(true));
            _confirmYes.onClick.AddListener(() =>
            {
                _confirmPanel.SetActive(false);
                _round.AdvanceMap();
            });
            _confirmNo.onClick.AddListener(() => _confirmPanel.SetActive(false));
        }

        // Começa a escutar mudanças e se desenha.
        private void OnEnable()
        {
            ProgressManager.Instance.Changed += Refresh;
            _confirmPanel.SetActive(false);
            Refresh();
        }

        // Para de escutar.
        private void OnDisable()
        {
            if (ProgressManager.Instance != null) ProgressManager.Instance.Changed -= Refresh;
        }

        // Atualiza os textos e a visibilidade do botão de próximo mapa.
        private void Refresh()
        {
            ProgressManager progress = ProgressManager.Instance;
            GameState state = progress.State;

            _moneyText.text = $"$ {state.money}";
            _mapText.text = $"Mapa {state.mapIndex + 1}/{progress.Config.maps.Length}: {progress.CurrentMap.displayName}";
            _bestText.text = $"Recorde {state.bestDistance:0} m / Meta {progress.CurrentMap.goalDistance:0} m";
            _nextMapButton.gameObject.SetActive(progress.CanAdvanceMap);
        }
    }
}
```

### 8.3 Montar o hangar

Mesma regra de tamanho da Fase 7.4: kit de UI em 3×, `Image` fatiadas com `Pixels Per Unit Multiplier` = 0.33.

1. No Canvas, crie `Hangar`: `Image` com `panel`, Sliced, esticado na tela com ~40 px de margem. Dentro: `MoneyText`, `MapText`, `BestText`, uma coluna (`Vertical Layout Group`, espaçamento ~24) para os upgrades, o botão **Lançar** grande embaixo (`button_blue`, Sliced, ~900 × 195) e o botão **Próximo mapa** (`button_yellow_square`, Sliced, ~900 × 160 — o amarelo destaca a ação rara).
2. Crie o prefab `UpgradeButton`: um `Button` com `Image` = `button_blue` (Sliced, ~900 × 200). Dentro:
   - `Icon`: `Image` com **Preserve Aspect** marcado, 96 × 96 (3 × 32), à esquerda. O `UpgradeButton` põe nele o `Icon` do `UpgradeDefinition` (preenchido na Fase 1.5 com `Art/Icons/upgrade_*`).
   - Três textos (nome, nível, preço), em branco ou creme sobre o azul.
   - O componente `UpgradeButton` com os campos preenchidos.
   Coloque 5 instâncias na coluna, cada uma com seu `UpgradeDefinition`. O botão sem dinheiro fica acinzentado pela `Disabled Color` do `Button` (padrão da Unity).
3. Dentro do `Hangar`, um `ConfirmPanel` (`panel`, Sliced, ~800 × 500) com o texto "Avançar de mapa reseta todos os upgrades. Continuar?" e os botões **Sim** (`button_yellow_square`) e **Não** (`button_blue`).
4. Adicione `HangarPanel` ao `Hangar` e preencha os campos. No `RoundManager`, preencha `Hangar Root` com o objeto `Hangar`.
5. A ordem dos filhos no Canvas define quem fica por cima: deixe `Hangar` e `Results` abaixo do `Hud` na Hierarchy.

### ✅ Checkpoint da Fase 8
- Play abre o hangar. Os botões de upgrade sem dinheiro ficam cinza.
- Use **⋮ → Debug: +1000 de dinheiro** no `ProgressManager`: os botões acendem; comprar Lançamento algumas vezes faz o próximo voo ir visivelmente mais longe.
- Ao bater 300 m no mapa 1, o resultado avisa e o hangar mostra **Próximo mapa**. Confirmando, o mapa vira 2/5, o dinheiro e os níveis zeram, e a meta passa a 600 m.

#### Problemas comuns
- **`NullReferenceException` em `OnEnable` do `UpgradeButton`:** o `ProgressManager` ainda não existia. Confira se ele está na cena e com o `[DefaultExecutionOrder(-100)]`.
- **Clicar em "Lançar" já lança o avião:** não deve acontecer, porque o estilingue só começa num toque novo (`wasPressedThisFrame`). Se acontecer, confira se o `LaunchController` não ficou ligado no Inspector.

Próxima fase: **Arte dos 5 Mapas** — cenário, chão, obstáculos e céu dos mapas 2 a 5, e a lufada de vento.

---

# Parte 12 — Implementação Unity: Fase 9 (Arte dos 5 Mapas)

## Fase 9 — Arte dos 5 Mapas

> Objetivo desta fase: os mapas 2 a 5 com cenário, chão, obstáculos, avião e céu próprios, e a lufada visual do vento. O Mapa 1 já foi montado nas Fases 3 e 6; aqui é repetir o molde com a arte de cada mapa.

### 9.1 A arte gerada

Toda a arte está em `Sprites/PaperFlight/` (gerada no PixelLab em 2026-10-06) e foi importada na Fase 0.5. O `README.md` daquela pasta tem os ids do PixelLab, as receitas e os scripts para regerar. A prévia `Sprites/PaperFlight/_preview/maps_all.png` mostra como cada mapa deve ficar.

| Asset | Arquivos em `Art/` | Tamanho | Onde entra |
|---|---|---|---|
| Aviões (um por mapa, GDD §8) | `Planes/plane_<n>_<mapa>` | 32 × 32 | `Map_N.planeSprite` (Fase 1.5) |
| Fundos (2 camadas por mapa, já repetem sem emenda) | `Backgrounds/<n>_<mapa>_near` e `_far` | ~250 × 128 | `Env_MapN` (Fases 3.4 e 9.2) |
| Chão | `Ground/<n>_<mapa>_surface` e `_fill` | 16 × 16 | `Env_MapN` (Fases 3.4 e 9.2) |
| Obstáculos (1 de chão + 1 de ar por mapa) | `Obstacles/<n>_<mapa>_ground_*` e `_air_*` | 32 × 96 / 32 × 32 (pipa 32 × 48) | prefabs `Obstacle_*` (Fases 6.3 e 9.3) |
| Moeda, bandeira, corrente de ar, lufada | `Common/coin`, `goal_flag`, `air_current`, `wind_puff` | 16, 16 × 48, 48 × 128, 32 | Fases 6.3 e 9.4 |
| Ícones das 5 trilhas | `Icons/upgrade_*` | 32 × 32 | `UpgradeDefinition.icon` (Fase 1.5) |
| Kit de UI | `ArtUI/panel`, `button_blue`, `button_yellow_square`, `bar_frame`, `bar_fill_white` | alta resolução | HUD, resultado e hangar (Fases 7.4 e 8.3) |
| Céu | não é sprite | — | `Map_N.skyColor` (Fase 1.5) |

### 9.2 Cenário dos mapas 2 a 5

1. No Project, selecione `Env_Map1` e duplique (Ctrl+D) quatro vezes: `Env_Map2` a `Env_Map5`.
2. Abra cada um (duplo clique) e troque os sprites e os números de `Surface`, `Fill`, `Near` e `Far` conforme a tabela. Posições, `Order in Layer`, `Factor X/Y` e o collider do `Ground` ficam iguais aos do Quintal.

| Prefab | `Surface` / `Fill` | `Near`: sprite, `Tile Width`, `Size` X | `Far`: sprite, `Tile Width`, `Size` X |
|---|---|---|---|
| `Env_Map1` | `1_quintal_surface` / `1_quintal_fill` | `1_quintal_near`, 15.9375, 47.8125 | `1_quintal_far`, 15.9375, 47.8125 |
| `Env_Map2` | `2_parque_surface` / `2_parque_fill` | `2_parque_near`, 16, 48 | `2_parque_far`, 15.75, 47.25 |
| `Env_Map3` | `3_praia_surface` / `3_praia_fill` | `3_praia_near`, 15.75, 47.25 | `3_praia_far`, 13.375, 40.125 |
| `Env_Map4` | `4_cidade_surface` / `4_cidade_fill` | `4_cidade_near`, 16, 48 | `4_cidade_far`, 15.625, 46.875 |
| `Env_Map5` | `5_montanha_surface` / `5_montanha_fill` | `5_montanha_near`, 15.75, 47.25 | `5_montanha_far`, 15.4375, 46.3125 |

3. Em cada `Map_N`, ponha o `Env_MapN` certo em `Environment Prefab`. Avião e céu já foram preenchidos na Fase 1.5.

### 9.3 Obstáculos dos mapas 2 a 5

1. Duplique `Obstacle_Birdhouse` e `Obstacle_Sparrow` para cada mapa e troque o sprite. Depois de trocar, **remova e adicione de novo** o `PolygonCollider2D`, para ele recalcular o contorno do desenho novo.

| Mapa | Obstáculo de chão (sprite) | Obstáculo de ar (sprite) |
|---|---|---|
| 1 Quintal | `Obstacle_Birdhouse` (`1_quintal_ground_birdhouse`) | `Obstacle_Sparrow` (`1_quintal_air_sparrow`) |
| 2 Parque | `Obstacle_ParkTree` (`2_parque_ground_tree`) | `Obstacle_Kite` (`2_parque_air_kite`) |
| 3 Praia | `Obstacle_Palm` (`3_praia_ground_palm`) | `Obstacle_Seagull` (`3_praia_air_seagull`) |
| 4 Cidade | `Obstacle_Lamppost` (`4_cidade_ground_lamppost`) | `Obstacle_Drone` (`4_cidade_air_drone`) |
| 5 Montanha | `Obstacle_Pine` (`5_montanha_ground_pine`) | `Obstacle_Eagle` (`5_montanha_air_eagle`) |

2. Em cada `Map_N`: `Goal Marker Prefab` = `GoalFlag` e `Spawns` com o mesmo molde do Mapa 1 (Fase 6.3): `Coin` (peso 3; altura 2–15), `AirCurrent_Up` (1; 4–4), o obstáculo de chão do mapa (1; 0–0) e o de ar (0,5; 6–18). A dificuldade de cada mapa (pesos, alturas, distância entre elementos) está **Em aberto** no GDD §7; mude só os números do `MapDefinition`.

### 9.4 Lufada do vento: `WindPuffEffect`

```csharp
// Caminho: Assets/_Project/Scripts/UI/WindPuffEffect.cs
using UnityEngine;
using PaperFlight.Flight;

namespace PaperFlight.UI
{
    // POR QUE: o toque de vento precisa de resposta visual imediata, senão o
    // jogador não sabe se gastou a carga.
    // ESTRATÉGIA: escuta o evento WindUsed do avião e toca um ParticleSystem
    // (ou animação) preso atrás dele. Fica separado do PaperPlane para a física
    // não depender de efeito visual.
    public class WindPuffEffect : MonoBehaviour
    {
        [SerializeField] private PaperPlane _plane;
        [SerializeField] private ParticleSystem _puff;

        // Começa a escutar o avião.
        private void OnEnable() => _plane.WindUsed += Play;

        // Para de escutar.
        private void OnDisable() => _plane.WindUsed -= Play;

        // Solta a lufada.
        private void Play() => _puff.Play();
    }
}
```

Monte o efeito assim:

1. Filho do `PaperPlane`: **Effects → Particle System**, nome `WindPuff`, posição `(-1, 0)` (atrás da cauda).
2. Módulo principal: `Looping` e `Play On Awake` desmarcados, `Start Lifetime` = 0.4, `Start Speed` = 0, `Start Size` = 2 (o sprite tem 32 px = 2 unidades), `Simulation Space` = World (a lufada fica para trás enquanto o avião segue), `Max Particles` = 5.
3. **Emission**: `Rate over Time` = 0 e um **Burst** com `Count` = 1 no tempo 0.
4. **Shape**: desmarcado (a lufada nasce exatamente no ponto).
5. **Color over Lifetime**: de branco opaco para branco transparente, para a lufada sumir aos poucos.
6. **Texture Sheet Animation**: `Mode` = Sprites, e adicione `Common/wind_puff` na lista.
7. **Renderer**: `Material` = `Sprite-Lit-Default`, `Order in Layer` = 9.
8. Adicione `WindPuffEffect` ao avião, com `Plane` = o próprio avião e `Puff` = `WindPuff`.

### 9.5 Ainda falta

- **Animações** (pássaros batendo asas, pipa, hélices do drone, moeda girando, corrente subindo, lufada abrindo). No MVP os sprites ficam parados. Quando existirem, cada uma vira um `Animator` no prefab; o código não muda.
- **Sprites de ângulo do avião**, se a rotação livre ficar serrilhada (GDD §8, **Em aberto**).
- **Quem lança o avião** (GDD §3, **Em aberto**).

### ✅ Checkpoint da Fase 9
- Avançando de mapa (use **⋮ → Debug: +1000 de dinheiro** e bata a meta), cada mapa mostra o seu cenário, chão, avião, obstáculos e cor de céu, igual à prévia `Sprites/PaperFlight/_preview/maps_all.png`.
- Em todos os mapas, o fundo repete sem emenda num voo longo e os obstáculos de chão ficam apoiados na grama, na areia, na calçada ou na neve.
- Cada toque de vento solta uma lufada que fica para trás e some.

#### Problemas comuns
- **Obstáculo flutuando ou enterrado:** o pivô do sprite não foi ajustado (tabela da Fase 0.5).
- **O avião bate "no ar" perto de um obstáculo novo:** o `PolygonCollider2D` ficou com o contorno do sprite antigo. Remova e adicione o collider de novo.
- **A lufada não aparece:** falta o Burst (com `Rate over Time` = 0 nada nasce) ou o material do Renderer está vazio (a partícula fica rosa).
- **O avião fica "serrilhado" ao girar:** é o efeito da rotação livre de pixel art (GDD §8, **Em aberto**). A alternativa é gerar de 8 a 16 sprites de ângulo e trocar o sprite conforme o `Pitch`, em vez de girar.

Próxima fase: **Build e Próximos Passos** — rodar no celular.

---

# Parte 13 — Implementação Unity: Fase 10 (Build e Próximos Passos)

## Fase 10 — Build e Próximos Passos

> Objetivo desta fase: o MVP roda num celular Android (e iOS, se houver Mac), em retrato, com save funcionando.

### 10.1 Android

1. **File → Build Profiles** → **Android** → **Switch Platform**.
2. **Player Settings → Other Settings**: `Scripting Backend` = IL2CPP, `Target Architectures` = ARM64 (exigido pela Play Store). `Package Name` = `com.manguebyte.paperflight` (sugestão; confirme o padrão do estúdio).
3. **Resolution and Presentation**: `Default Orientation` = Portrait (já feito na Fase 0).
4. Ative o modo desenvolvedor e a depuração USB no celular, conecte e use **Build And Run**.

### 10.2 iOS (opcional no MVP)

1. Precisa de um Mac com Xcode. **Build Profiles → iOS → Switch Platform → Build** gera um projeto Xcode; abra, escolha a equipe de assinatura e rode no aparelho.

### 10.3 PC/Web para testes com mouse

1. Um build **Windows** ou **Web** serve para testar com mouse sem celular. Se isso vira plataforma de lançamento está **Em aberto** (GDD §1).

### ✅ Checkpoint da Fase 10
- O jogo abre no celular em retrato, o estilingue e o voo respondem ao toque, e o toque curto dá vento sem atrapalhar o deslize.
- Fechando o app pelo multitarefa e abrindo de novo, dinheiro, níveis e mapa continuam lá.
- Rodando a 60 fps num aparelho intermediário durante um voo longo.

#### Problemas comuns
- **Toque e deslize se confundem no celular:** ajuste `_tapMaxMove` e `_tapMaxDuration` do `FlightInput`. Telas pequenas costumam pedir uma tolerância de movimento maior.
- **O jogo roda a 30 fps no Android:** a Unity limita a 30 por padrão no mobile. Ponha `Application.targetFrameRate = 60;` no `Awake` do `ProgressManager` ou de um script de boot.

### 10.4 Próximos passos

Decisões **Em aberto** que mais mexem no código (ver GDD §13 para a lista completa):

- **Efeito dos obstáculos** (frear vs. derrubar) — muda `Obstacle` e `PaperPlane.HitObstacle`.
- **O que reseta ao trocar de mapa** e **o que vem depois do mapa 5** — muda `GameState.ResetForMap` e `ProgressManager.AdvanceMap`.
- **Bônus permanente / prestígio** — exigiria um campo novo no `GameState` que `ResetForMap` não apaga.
- **Mapas feitos à mão vs. semente fixa** — trocaria o `MapSpawner` por elementos posicionados na cena de cada mapa.
- **Rotação do sprite do avião** (livre vs. sprites de ângulo).
- **Leaderboard** pós-MVP, seguindo o padrão Firebase do estúdio se confirmado.
- Balanceamento de todos os placeholders da Parte 1 §12 com playtest.

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
