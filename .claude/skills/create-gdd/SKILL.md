---
name: create-gdd
description: Cria o Game Design Document (GDD) de um jogo novo do estúdio a partir de uma entrevista com o usuário, seguindo as convenções deste repositório (pt-BR, marcação "Definido:"/"Em aberto", estrutura por seções numeradas). Cobre jogos 2D e 3D de qualquer gênero (RPG, roguelike, corrida, plataforma, simulação/gerenciamento, etc.). Use quando o usuário pedir para criar/começar/redigir o GDD de um jogo novo, ou pedir "documento de design" para um conceito de jogo.
---

# Criar GDD de um jogo novo

Gera um documento de GDD standalone para um jogo do estúdio, em Markdown, seguindo as
mesmas convenções usadas em `RallySurvive.md` (ver `CLAUDE.md` na raiz do repo).

## Parâmetros reconhecidos via ARGUMENTS

Se a skill for chamada com argumentos (`/create-gdd <texto>`), procure primeiro por
sinais explícitos de **dimensão** ("2d", "3d", "topdown 2d", "em terceira pessoa 3D"...) e
de **gênero/tipo** ("rpg", "roguelike", "corrida"/"race", "puzzle", "simulação de
gerenciamento", etc.) no próprio texto. Se encontrados, trate como já respondidos e não
repita essas perguntas na entrevista abaixo — só confirme se o texto for ambíguo (ex.:
menciona "câmera livre" sem deixar claro se é 2D ou 3D). Os demais pontos da entrevista
seguem normalmente para o que não estiver coberto no texto do usuário. Ver
`reference/dimension_genre_reference.md` para a taxonomia usada para reconhecer esses
sinais e para o vocabulário a manter consistente entre os GDDs do estúdio.

## Antes de escrever: entrevistar o usuário

Não invente decisões de design. Se o usuário já deu detalhes suficientes na conversa (ou
via ARGUMENTS, ver acima), não repita perguntas — só pergunte o que falta. Cubra pelo
menos:

1. **Nome do jogo** (provisório é ok).
2. **Gênero/tipo do jogo** — categoria(s) que definem o jogo (RPG, roguelike/roguelite,
   corrida, plataforma, puzzle, simulação/gerenciamento, idle/incremental, ação/aventura,
   estratégia, sobrevivência, tower defense, card game, etc. — pode combinar mais de um,
   ex.: "RPG de gerenciamento com resolução idle"). Ver
   `reference/dimension_genre_reference.md` para a lista de referência e o que cada
   gênero costuma exigir de detalhamento extra na entrevista.
3. **Dimensão: 2D ou 3D** — pergunta separada de gênero e de câmera, porque muda a base
   técnica da Parte 2/Guia Unity (template de projeto, `Rigidbody2D` vs. `Rigidbody`,
   pacotes). Mesmo em jogos orientados a UI/menu sem cena de gameplay em tempo real
   (ex.: um simulador de gerenciamento), pergunte — pode ser relevante para a arte
   (ícones 2D vs. renders 3D) mesmo sem física de jogo. Ver
   `reference/dimension_genre_reference.md` para a tabela completa de diferenças, e a
   seção "Dimensões híbridas/ambíguas" lá para casos como 2.5D e isométrico.
4. **Câmera/perspectiva** (topdown, terceira pessoa, primeira pessoa, isométrica,
   lateral/side-scroller, fixa por tela, orientado a UI sem câmera de jogo, etc.).
5. **Plataforma-alvo.**
6. **Pilar de design central** — a frase de 1-2 linhas que resume a fantasia/sensação
   principal (o equivalente ao "controle tenso via distância do cursor" do Core da Rally).
7. **Mecânica principal** — como o jogador de fato controla o jogo (input, regras
   centrais de movimento/ação).
8. **Escopo do MVP** — o que precisa existir na primeira versão jogável vs. o que fica
   para depois.
9. **Este jogo compartilha sistemas com a franquia Rally** (RallySurvive/Navigation
   Expert/RaceLegenda/Street Legends — mouse-only, chevrons, formato de pista)? Se sim,
   pare e confirme com o usuário se ele não prefere que isso vire uma nova "Parte —
   Variante" dentro de `RallySurvive.md` em vez de um documento novo — essa skill é para
   jogos conceitualmente separados.
10. **Backend/serviços** — precisa de leaderboard, auth, multiplayer? Se o estúdio já usa
    Firebase (Firestore) nos outros jogos, pergunte se este jogo segue o mesmo padrão de
    dados (`/leaderboards/{jogo}/{pista}/{uid}`) por consistência, mas não assuma sem
    confirmar.
11. **Referências/inspirações** de outros jogos, se houver.

Para qualquer ponto que o usuário não souber responder ainda, **não invente** — marque
como `**Em aberto**` no documento em vez de decidir por ele. Só marque algo como
`**Definido:**` quando o usuário efetivamente confirmou.

## Estrutura do documento

Use `reference/template.md` como esqueleto. As seções da Parte GDD são um ponto de
partida, não uma grade fixa — remova/renomeie seções que não fazem sentido para o gênero
do jogo (ex.: um jogo sem carros não precisa de "Física do Carro"), e adicione seções
específicas do jogo quando necessário.

**A Parte 2 (Guia de Implementação Unity) é obrigatória em todo GDD gerado por esta
skill** — não é opcional mesmo que o usuário não peça explicitamente. Ver seção própria
abaixo.

## Guia de Implementação Unity (obrigatório)

Todo `.md` gerado por esta skill precisa terminar com um guia de implementação Unity
fase-a-fase, no mesmo formato usado em `RallySurvive.md` (Partes 7–13). Use
`reference/unity_phase_template.md` como esqueleto de cada fase.

Regras de formato (copiadas do padrão já usado no repo):

- Fases numeradas a partir de **Fase 0** (sempre "Setup do Projeto": instalar Unity,
  criar projeto, estrutura de pastas em `Assets/`, pacotes necessários no Package
  Manager). A última fase é sempre "Build e Próximos Passos".
- **Fase 0 é onde a dimensão (2D/3D) definida na entrevista vira decisão técnica**: template
  do projeto (`2D (Core)`/`2D (URP)` vs. `3D (Core)`/`3D (URP)`) e pacotes iniciais (ex.:
  `2D Pixel Perfect`/`2D Tilemap Editor` para 2D; `Cinemachine`/`AI Navigation` para 3D).
  Ver a tabela completa em `reference/dimension_genre_reference.md`. Se o jogo for
  orientado a UI/menu sem cena de gameplay em tempo real (ex.: `StarExpeditionCo.md`),
  diga isso explicitamente na Fase 0 e não force um template 2D/3D de física que o jogo
  não usa.
- As fases do meio **não são fixas** — derive-as do gênero e da mecânica principal
  descritos na entrevista (ex.: um jogo de plataforma tem uma fase de movimento/pulo em
  vez de "Movimento do Carro"; um roguelike provavelmente tem uma fase de geração
  procedural; um jogo sem leaderboard não tem fase de Firebase). Não copie as fases do
  RallySurvive nem do StarExpeditionCo se não fizerem sentido para este jogo — use-os como
  exemplo de formato, não de conteúdo.
- Cada fase é uma seção `# Parte N — Implementação Unity: Fase X (Nome)` com
  subseções numeradas (`### X.1`, `### X.2`, ...).
- Inclua trechos de código C# reais e completos quando a fase envolve um script (não
  pseudocódigo) — nomeie classes/arquivos de forma explícita. Em jogos 3D, use `Vector3`,
  `Rigidbody`/`Collider` (ou `CharacterController`) em vez dos equivalentes 2D.
- Toda fase termina com `### ✅ Checkpoint da Fase X` (lista de verificação objetiva de
  "como saber que funcionou") e uma linha `Próxima fase: **...**`.
- Quando fizer sentido, adicione `#### Problemas comuns` com 1-3 armadilhas prováveis e
  como resolvê-las (troubleshooting real, não genérico).
- Scripts C# alvo Unity 6 / 2023.x+ (`rb.linearVelocity`, válido tanto para `Rigidbody2D`
  quanto para `Rigidbody` 3D); se o jogo puder rodar em 2022 LTS, adicione a nota de
  fallback `rb.velocity` como já é feito no RallySurvive. Só inclua a nota em fases que
  de fato usam Rigidbody — não é necessária em jogos/fases 100% orientados a UI.
- Se este jogo reusa um sistema já implementado nos outros jogos da franquia (ex.:
  `ChevronGuide`), não reescreva o script do zero — referencie a fase equivalente em
  `RallySurvive.md` e descreva só o que muda.

## Convenções a seguir (herdadas de `CLAUDE.md`)

- **Idioma: pt-BR.**
- Decisões fechadas usam `**Definido:**`; perguntas em aberto usam `**Em aberto**` —
  nunca converta uma em outra silenciosamente.
- Sem comentários/preenchimento de seções que o usuário não discutiu — prefira deixar
  `**Em aberto**` a preencher com suposições.
- Não duplique o GDD Core da franquia Rally aqui. Se este jogo importar conceitos de lá
  (ex.: reusar `ChevronGuide`), linke/mencione a seção do Core em vez de colar o texto.

## Onde salvar

- Novo arquivo `<NomeDoJogo>.md` na raiz do repositório (mesmo nível de `RallySurvive.md`).
- Depois de criar o arquivo, pergunte ao usuário se quer que a seção "Repository nature"
  de `CLAUDE.md` seja atualizada para mencionar que agora há mais de um GDD no repo — não
  edite `CLAUDE.md` sem essa confirmação.

## Documentação da skill

Para entender o funcionamento interno da skill (fluxo de execução, arquivos, como
adicionar um novo gênero ou variante de dimensão à tabela de referência), ver
`README.md` nesta mesma pasta — é documentação para quem mantém a skill, não faz parte do
GDD gerado.
