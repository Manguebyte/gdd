# Referência — Dimensão (2D/3D) e Gênero

> Apoio para a entrevista e para a Parte 2 (Guia Unity) da skill `create-gdd`. Não é para
> copiar literalmente para o GDD gerado — é uma referência de **qual pergunta fazer** e
> **qual base técnica usar**, conforme a resposta do usuário. Decisões concretas do jogo
> continuam vindo da entrevista, nunca desta tabela.

## Dimensão: 2D vs 3D

Pergunte sempre como um campo **separado** de gênero e de câmera/perspectiva — dois jogos
do mesmo gênero podem ter dimensões diferentes (ex.: um roguelike topdown 2D vs. um
roguelike em terceira pessoa 3D), e a base técnica do guia Unity muda bastante entre os
dois.

| | 2D | 3D |
|---|---|---|
| Template Unity (Fase 0) | `2D (Core)` ou `2D (URP)` | `3D (Core)`, `3D (URP)` ou `3D Sample Scene (URP)` |
| Física | `Rigidbody2D` + `Collider2D` (`Box`/`Circle`/`PolygonCollider2D`) | `Rigidbody` + `Collider` (`Box`/`Sphere`/`CapsuleCollider`) ou `CharacterController` para movimento sem física |
| Vetores de movimento | `Vector2`, posição em XY (Z fixo) | `Vector3`, atenção ao eixo Y (altura/gravidade) |
| Propriedade de velocidade (Unity 6 / 2023.x+) | `rb.linearVelocity` (`Rigidbody2D`) | `rb.linearVelocity` (`Rigidbody` 3D) — mesmo nome novo, componente diferente |
| Fallback 2022 LTS | `rb.velocity` | `rb.velocity` |
| Câmera | Geralmente `Orthographic`, fixa ou seguindo um alvo | Geralmente `Perspective`; considerar **Cinemachine** para 3ª/1ª pessoa |
| Pacotes extras comuns | `2D Pixel Perfect`, `2D Tilemap Editor`, `2D Animation` | `Cinemachine`, `AI Navigation` (NavMesh) se houver IA/pathfinding |
| Assets | Pixel art / vetor 2D | Modelos 3D (FBX), materiais, iluminação |

**Jogos orientados a UI/menu** (sem cena de gameplay em tempo real — ex. simuladores de
gerenciamento como `StarExpeditionCo.md`): a dimensão ainda importa para a arte
(ícones/ilustrações 2D vs. renders/portraits 3D) mesmo sem física de jogo. Pergunte mesmo
assim; uma resposta válida é "N/A para gameplay, mas a arte é 2D/3D".

Ao escrever a Fase 0 do guia Unity, use esta tabela para decidir o template do projeto e
os pacotes a instalar. Mantenha a nota de versão (`rb.linearVelocity`/`rb.velocity`)
independente da dimensão — ela vale tanto para `Rigidbody2D` quanto para `Rigidbody` 3D.

### Dimensões híbridas/ambíguas

- **2.5D** (visual 3D, jogabilidade restrita a um plano): trate como **3D** para fins de
  template/física (Rigidbody 3D, câmera perspectiva ou ortográfica), mas confirme com o
  usuário se o movimento é restrito a 2 eixos — isso é uma decisão de mecânica, não de
  dimensão, então não assuma.
- **Isométrico**: é uma escolha de **câmera**, não de dimensão — pode ser feito tanto com
  assets 2D (sprites em perspectiva isométrica) quanto com assets 3D e câmera ortográfica
  angulada. Pergunte as duas coisas separadamente.

## Gênero / tipo de jogo

Lista de referência para manter vocabulário consistente entre os GDDs do estúdio (campo
**Gênero:** da Visão Geral, Parte 1 §1). Um jogo pode combinar mais de um gênero — ex.:
"RPG de gerenciamento com resolução idle" (`StarExpeditionCo.md`), "Corrida / Rally"
(`RallySurvive.md`).

| Gênero | O que costuma exigir detalhamento extra na entrevista |
|---|---|
| Corrida / Race | Física de veículo, pistas/waypoints, tempo/posição, condições de falha |
| RPG | Atributos, progressão/nível, classes, equipamento, narrativa (se houver) |
| Roguelike / Roguelite | Geração procedural, permadeath ou penalidade de morte, meta-progressão entre runs |
| Plataforma | Física de pulo, colisão com terreno, checkpoints |
| Puzzle | Regras de vitória por nível, sistema de dicas, editor/gerador de níveis |
| Simulação / Gerenciamento | Loop de recursos, economia interna, condições de progresso/falha de longo prazo |
| Idle / Incremental | Resolução por tempo real (ver padrão `ActiveExpedition`/timer real em `StarExpeditionCo.md`), progressão offline |
| Ação / Aventura | Combate, inventário, exploração de mapa |
| Estratégia | IA de oponentes, turnos ou tempo real, gerenciamento de recursos |
| Sobrevivência | Necessidades (fome/energia), crafting, ameaças ambientais |
| Tower Defense | Ondas de inimigos, posicionamento, economia de torres |
| Card game | Deck building, regras de mesa, aleatoriedade controlada |

Esta tabela é ponto de partida para saber **o que perguntar**, nunca para preencher o GDD
com suposições — se o usuário não confirmar um desses pontos, marque `**Em aberto**` como
de costume. Gêneros que não aparecem na lista não são bloqueados — pergunte normalmente e,
se fizer sentido, adicione uma linha nova aqui para reuso futuro (ver
`../README.md` → "Como estender a skill").
