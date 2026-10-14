# Caça às Bruxas — protótipo web

Vertical slice em HTML/JavaScript do [`CacaAsBruxas.md`](../../CacaAsBruxas.md), com visão superior 2D e pixel art gerada pelo PixelLab em [`Sprites/CacaAsBruxas/`](../../Sprites/CacaAsBruxas/). Os sprites são carregados de `../../Sprites/CacaAsBruxas/`, sem build. Abra [`index.html`](index.html) no navegador, ou sirva a raiz do repositório por HTTP e acesse `/prototipos/caca-as-bruxas/`.

## Recorte jogável

- Uma vila de 1600 × 1100 unidades: entrada, praça, cemitério e acesso à Inquisição.
- O tutorial começa contra criaturas do demônio. Derrotar o demônio inicia a perseguição: a Suspeita vai a 60 e os humanos passam a atacar a protagonista.
- A exploração revela magias em baús. O portão da Inquisição abre com Suspeita igual ou superior a 70; encontrar a cura do cemitério após a virada eleva o valor de 60 para 75. Derrotar o segundo chefe, o inquisidor, conclui esta demonstração.
- O combate usa ataque mágico rápido ou carregado, esquiva e escudo. Ativar o escudo no instante do golpe faz parry e quebra a postura do inimigo.
- As fogueiras contam a história das bruxas executadas e servem de descanso e checkpoint. Descansar restaura vida, MP e fôlego e faz os inimigos comuns renascerem. A morte deixa as cinzas no local para recuperação; morrer de novo substitui o montante anterior.
- O progresso é salvo no navegador: magias, Suspeita, chefes derrotados, cinzas e checkpoint. Continuar a jornada retorna à última fogueira, com os recursos restaurados.

## Controles

| Tecla ou botão | Ação |
| --- | --- |
| WASD / setas | Mover |
| Mouse | Mirar |
| Clique esquerdo / J | Ataque mágico rápido |
| K, segurar e soltar | Ataque carregado |
| Clique direito / Q, segurar | Escudo mágico; ativação precisa faz parry |
| Espaço | Esquivar |
| E | Interagir com pessoas, baús, cinzas e fogueiras |
| 1–4 | Usar as magias aprendidas nos atalhos |

No toque, os botões na tela permitem mover, atacar, usar escudo, esquivar, interagir e lançar as magias. Os ataques sem mira do mouse selecionam um inimigo próximo.

| Atalho | Memória | Efeito | Custo |
| --- | --- | --- | --- |
| 1 | Fagulha ancestral | Projétil que atravessa inimigos | 22 MP |
| 2 | Sopro das mortas | Recupera 38 de vida | 36 MP |
| 3 | Passo espectral | Esquiva longa, invulnerabilidade e atordoamento próximo | 24 MP |
| 4 | Lua morta | Onda de dano ao redor da bruxa | 44 MP |

## Decisões para playtest

O GDD é inicial e mantém várias propostas em aberto. Este protótipo escolhe regras concretas para permitir o teste do ciclo de exploração, poder e perseguição; elas não transformam as propostas em decisões definitivas do jogo.

Cinzas recuperáveis após a morte, pausa antes da regeneração de MP, escudo quebrável, parry que devolve MP e vulnerabilidade após quebrar a postura são decisões desta demonstração. Ataques rápidos, carregados e esquivas gastam fôlego; as quatro memórias e o escudo mantido gastam MP. As cinzas registram a recompensa dos combates, sem árvore de evolução nesta versão.

O MP volta após 1,35 segundo sem gasto, a 11 pontos por segundo; em Suspeita 90 ou maior, a regeneração cai para 8,8 por segundo. A janela inicial de parry é 0,23 segundo. Esses números, a virada em Suspeita 60, o portão em 70, o tamanho da vila, os custos e os danos são parâmetros de protótipo a ajustar após jogar.

## Limites

Uma área e dois chefes representam o arco tutorial e uma amostra da perseguição, sem campanha completa, finais alternativos, todas as categorias de caçadores, dons próprios das bruxas de fogueira ou sistema completo de equipamento de magias. As quatro memórias ocupam atalhos fixos conforme são encontradas. Multiplayer e suporte a controle não estão implementados. Esta pasta é um protótipo para navegador; não é um projeto Unity nem um guia de implementação Unity.

A arte PixelLab e suas referências ficam na pasta de sprites. O GDD original continua sendo a fonte das decisões de design e das questões em aberto.

## Verificação

`node smoke-test.cjs` valida combate, recursos, parry, morte, recuperação de cinzas, salvamento e progressão até a conclusão, usando a lógica real do jogo com DOM/canvas simulados.

`node verify-browser.cjs` abre Edge headless com Playwright, confere carregamento da arte e movimento, e gera capturas de computador/celular em `Sprites/CacaAsBruxas/_preview/`. Precisa de Playwright instalado ou do runtime empacotado no Codex desktop.

O fragmento `#debug` expõe controles de teste (teleporte, dano e recursos) para reprodução de cenários. A API normal não inclui esses controles. As capturas e ferramentas não são necessárias para jogar.
