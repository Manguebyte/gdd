---
name: create-gdd
description: Cria o Game Design Document (GDD) de um jogo novo do estúdio a partir de uma entrevista com o usuário, seguindo as convenções deste repositório (pt-BR, marcação "Definido:"/"Em aberto", estrutura por seções numeradas). Use quando o usuário pedir para criar/começar/redigir o GDD de um jogo novo, ou pedir "documento de design" para um conceito de jogo.
---

# Criar GDD de um jogo novo

Gera um documento de GDD standalone para um jogo do estúdio, em Markdown, seguindo as
mesmas convenções usadas em `RallySurvive.md` (ver `CLAUDE.md` na raiz do repo).

## Antes de escrever: entrevistar o usuário

Não invente decisões de design. Se o usuário já deu detalhes suficientes na conversa,
não repita perguntas — só pergunte o que falta. Cubra pelo menos:

1. **Nome do jogo** (provisório é ok).
2. **Gênero, câmera/perspectiva, plataforma-alvo.**
3. **Pilar de design central** — a frase de 1-2 linhas que resume a fantasia/sensação
   principal (o equivalente ao "controle tenso via distância do cursor" do Core da Rally).
4. **Mecânica principal** — como o jogador de fato controla o jogo (input, regras
   centrais de movimento/ação).
5. **Escopo do MVP** — o que precisa existir na primeira versão jogável vs. o que fica
   para depois.
6. **Este jogo compartilha sistemas com a franquia Rally** (RallySurvive/Navigation
   Expert/RaceLegenda/Street Legends — mouse-only, chevrons, formato de pista)? Se sim,
   pare e confirme com o usuário se ele não prefere que isso vire uma nova "Parte —
   Variante" dentro de `RallySurvive.md` em vez de um documento novo — essa skill é para
   jogos conceitualmente separados.
7. **Backend/serviços** — precisa de leaderboard, auth, multiplayer? Se o estúdio já usa
   Firebase (Firestore) nos outros jogos, pergunte se este jogo segue o mesmo padrão de
   dados (`/leaderboards/{jogo}/{pista}/{uid}`) por consistência, mas não assuma sem
   confirmar.
8. **Referências/inspirações** de outros jogos, se houver.

Para qualquer ponto que o usuário não souber responder ainda, **não invente** — marque
como `**Em aberto**` no documento em vez de decidir por ele. Só marque algo como
`**Definido:**` quando o usuário efetivamente confirmou.

## Estrutura do documento

Use `reference/template.md` como esqueleto. As seções são um ponto de partida, não uma
grade fixa — remova/renomeie seções que não fazem sentido para o gênero do jogo (ex.: um
jogo sem carros não precisa de "Física do Carro"), e adicione seções específicas do jogo
quando necessário.

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
