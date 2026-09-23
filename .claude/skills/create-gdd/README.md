# create-gdd — Documentação da Skill

> Este arquivo é documentação **para quem mantém a skill** (o estúdio), não faz parte do
> GDD gerado por ela. Se você só quer usar a skill, leia `SKILL.md`; se quer entender ou
> alterar como ela funciona, comece aqui.

## Para que serve

Gera o GDD de um jogo novo do estúdio, em Markdown, a partir de uma entrevista com o
usuário — cobrindo qualquer gênero (RPG, roguelike, corrida, plataforma, simulação, etc.)
e qualquer dimensão (2D ou 3D). Sempre termina em um guia de implementação Unity
fase-a-fase, seguindo as mesmas convenções usadas em `RallySurvive.md` (ver `CLAUDE.md`
na raiz do repo).

## Arquivos da skill

```
.claude/skills/create-gdd/
  SKILL.md                              # instruções carregadas pelo Claude ao invocar a skill
  README.md                             # este arquivo — documentação de manutenção
  reference/
    template.md                         # esqueleto da Parte 1 (GDD) de um novo documento
    unity_phase_template.md             # esqueleto de UMA fase da Parte 2 (Guia Unity)
    dimension_genre_reference.md        # tabela de apoio: 2D vs 3D, e taxonomia de gêneros
```

- **`SKILL.md`** é o único arquivo lido automaticamente pelo Claude Code ao rodar
  `/create-gdd` — os arquivos em `reference/` só são lidos quando `SKILL.md` manda lê-los.
  Qualquer regra que precise valer sempre tem que estar (ou ser referenciada) em
  `SKILL.md`, não só em `reference/`.
- **`reference/template.md`** é o esqueleto da Parte 1 — seções da Visão Geral, Mecânica
  Principal, etc. Não é uma grade fixa: seções são adicionadas/removidas/renomeadas
  conforme o gênero do jogo (ex.: um jogo sem veículo não precisa de "Física do Carro").
- **`reference/unity_phase_template.md`** é o esqueleto de **uma** fase do guia Unity
  (usado repetidamente, uma vez por fase gerada).
- **`reference/dimension_genre_reference.md`** é a tabela de apoio adicionada para
  padronizar como a skill trata **dimensão (2D/3D)** e **gênero/tipo de jogo** entre
  documentos — ver seção própria abaixo.

## Fluxo de execução (o que o Claude faz ao rodar `/create-gdd`)

1. Lê `ARGUMENTS` (texto passado junto com `/create-gdd`, se houver) e tenta reconhecer
   sinais de **dimensão** e **gênero** nele (ver `reference/dimension_genre_reference.md`)
   — o que já estiver coberto não é perguntado de novo na entrevista.
2. Entrevista o usuário pelos pontos que faltam (lista numerada em `SKILL.md` →
   "Antes de escrever: entrevistar o usuário"). Tudo que o usuário não souber/confirmar
   vira `**Em aberto**` no documento — a skill nunca inventa decisão de design.
3. Gera `<NomeDoJogo>.md` na raiz do repositório:
   - Parte 1 (GDD) usando `reference/template.md` como esqueleto, adaptado ao gênero.
   - Parte 2+ (Guia Unity), uma seção "Fase X" por sistema principal do jogo, cada uma
     usando `reference/unity_phase_template.md` como esqueleto — a Fase 0 (Setup) decide o
     template de projeto Unity e os pacotes a partir da dimensão (2D/3D) definida na
     entrevista.
4. Pergunta se o usuário quer que a seção "Repository nature" de `CLAUDE.md` seja
   atualizada para citar o novo GDD — nunca edita `CLAUDE.md` sem confirmação.

## Parâmetros reconhecidos

| Parâmetro | Onde é definido | Efeito |
|---|---|---|
| **Dimensão** (2D/3D) | Pergunta própria na entrevista (separada de gênero e câmera); pode vir via `ARGUMENTS` | Decide o template de projeto Unity, física (`Rigidbody2D` vs. `Rigidbody`), pacotes iniciais e convenções de código (`Vector2` vs. `Vector3`) na Fase 0+ do guia Unity |
| **Gênero/tipo** | Pergunta própria na entrevista; pode vir via `ARGUMENTS`; pode combinar mais de um | Sinaliza quais sistemas a entrevista deve aprofundar (ex.: RPG → atributos/progressão; roguelike → geração procedural/permadeath) e quais fases intermediárias do guia Unity fazem sentido |
| Demais pontos (nome, câmera, plataforma, pilar de design, mecânica, MVP, backend, referências) | Entrevista — ver lista numerada em `SKILL.md` | Preenchem as seções correspondentes da Parte 1 |

A tabela de referência para os dois primeiros parâmetros vive em
`reference/dimension_genre_reference.md` — é uma lista viva, pensada para crescer (ver
próxima seção).

## Como estender a skill

- **Novo gênero na lista de referência:** adicionar uma linha na tabela "Gênero / tipo de
  jogo" em `reference/dimension_genre_reference.md`, com o que esse gênero costuma exigir
  detalhar na entrevista. Gêneros fora da lista não são bloqueados — a skill já entrevista
  normalmente; a tabela é só para manter vocabulário e profundidade de entrevista
  consistentes entre os GDDs do estúdio.
- **Nova variante de dimensão (ex.: "2.5D", VR):** adicionar uma entrada na seção
  "Dimensões híbridas/ambíguas" da mesma tabela, decidindo a que base técnica (2D ou 3D)
  ela mais se aproxima para fins de template/física do guia Unity.
- **Mudança de convenção de formatação do GDD** (ex.: novo marcador além de
  `Definido`/`Em aberto`): editar `reference/template.md` **e** o bloco "Convenções" em
  `SKILL.md` juntos — os dois precisam ficar em sincronia, já que `SKILL.md` é o que o
  Claude de fato segue e `template.md` é só o esqueleto.
- **Mudança no formato de fase do guia Unity:** editar
  `reference/unity_phase_template.md` e a lista "Regras de formato" em `SKILL.md` →
  "Guia de Implementação Unity (obrigatório)" juntos, pelo mesmo motivo.

## Exemplos de uso

- `/create-gdd` — sem argumentos, entrevista completa do zero.
- `/create-gdd jogo 2d roguelike topdown, ainda sem nome definido` — a skill já entende
  dimensão (2D) e gênero (roguelike) a partir do texto, e não repete essas duas perguntas
  na entrevista; segue perguntando o resto (nome, pilar de design, mecânica, MVP, etc.).
- `/create-gdd quero um RPG de gerenciamento de equipe no espaço...` (descrição livre e
  detalhada) — a skill extrai o que já dá pra inferir do texto e só pergunta o que
  realmente falta (foi assim que `StarExpeditionCo.md` foi gerado).

## GDDs já gerados (referência de formato)

- `RallySurvive.md` — não foi gerado por esta skill (é o documento original do repo, que
  serviu de modelo para `reference/template.md` e `reference/unity_phase_template.md`).
  Franquia de corrida 2D, 4 variantes compartilhando um Core.
- `StarExpeditionCo.md` — primeiro GDD gerado por esta skill. RPG de gerenciamento de
  equipe espacial com resolução por timer real (idle), mobile, sem backend. Bom exemplo de
  jogo orientado a UI/menu sem cena de gameplay em tempo real, e do padrão de timer real
  (`ActiveExpedition`, `DateTime.UtcNow`) referenciado em
  `reference/dimension_genre_reference.md` para o gênero idle/incremental.

## Histórico

- **2026-09-14** — Skill criada; gerou `StarExpeditionCo.md` (primeiro uso real).
  Em seguida, adicionados os parâmetros explícitos de **dimensão (2D/3D)** e
  **gênero/tipo de jogo** à entrevista e ao guia Unity (`reference/dimension_genre_reference.md`
  novo; `SKILL.md` e `reference/template.md` atualizados), e criada esta documentação de
  manutenção.
