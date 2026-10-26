# GDD — Capibaribe Vivo

> Documento vivo. Rascunho inicial, a refinar conforme prototipagem e conversa com educadores.
>
> "Capibaribe Vivo" é o nome provisório. Os números marcados como **proposta** são pontos de partida para o primeiro protótipo, não decisões. Os fatos sobre o rio, os bairros e a fauna estão marcados **(a validar)** quando ainda precisam ser conferidos com pesquisa ou com um(a) educador(a) antes de irem para o jogo: como o jogo é educativo, um fato errado é um defeito.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Unity](#parte-2--guia-de-implementação-unity)
3. [Parte 3 — Fase 0 (Setup do Projeto)](#parte-3--implementação-unity-fase-0-setup-do-projeto)
4. [Parte 4 — Fase 1 (O Rio e o Barco)](#parte-4--implementação-unity-fase-1-o-rio-e-o-barco)
5. [Parte 5 — Fase 2 (Lixo e Coleta)](#parte-5--implementação-unity-fase-2-lixo-e-coleta)
6. [Parte 6 — Fase 3 (Ecoponto e Separação)](#parte-6--implementação-unity-fase-3-ecoponto-e-separação)
7. [Parte 7 — Fase 4 (Rio Vivo, Fauna e Álbum)](#parte-7--implementação-unity-fase-4-rio-vivo-fauna-e-álbum)
8. [Parte 8 — Fase 5 (Fontes de Poluição)](#parte-8--implementação-unity-fase-5-fontes-de-poluição)
9. [Parte 9 — Fase 6 (Trechos, Mapa e Postal)](#parte-9--implementação-unity-fase-6-trechos-mapa-e-postal)
10. [Parte 10 — Fase 7 (Personagem e Narração)](#parte-10--implementação-unity-fase-7-personagem-e-narração)
11. [Parte 11 — Fase 8 (Build Web e Próximos Passos)](#parte-11--implementação-unity-fase-8-build-web-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Gênero:** educativo; aventura casual de coleta, com um minijogo de separação de lixo.
- **Dimensão:** **Definido:** 2D.
- **Câmera/perspectiva:** **Definido:** topdown (o rio visto de cima). A câmera segue o barco dentro dos limites do trecho.
- **Plataforma-alvo:** **Definido:** web (navegador), pensando nos computadores de laboratório das escolas, com mouse. Tablet/toque fica para depois (§19), mas o controle já é escolhido para funcionar com toque também (§4).
- **Público:** **Definido:** crianças de 6 a 10 anos.
- **Pilar de design:** *cada lixo que sai do rio traz a vida de volta.* A criança vê o Capibaribe mudar de cor e se encher de bichos por causa do que ela fez, e entende por que ele estava sujo.
- **Fantasia central:** ser a pessoa que cuida do rio da própria cidade, num barquinho, passando pelos lugares de verdade do Recife.

## 2. O rio de verdade: contexto e objetivos educativos

O jogo se passa no **rio Capibaribe**, que atravessa o Recife (Pernambuco) até o mar. Tudo que aparece no jogo sobre o rio deve ser verdadeiro, na linguagem de uma criança.

Fatos de partida **(a validar)**:
- O nome vem do tupi e costuma ser traduzido como "rio das capivaras".
- O rio nasce no Agreste de Pernambuco, passa por várias cidades e entra no Recife pelo oeste (Várzea), cruzando a cidade até encontrar o rio Beberibe perto do Marco Zero e chegar ao mar.
- O Recife é chamado de "Veneza brasileira" por causa dos rios e das muitas pontes.
- As **baronesas** (aguapés) que cobrem trechos do rio crescem demais quando há muito esgoto na água: elas são um sinal de poluição, não a causa.
- O mangue, na foz, é o "berçário" de muitos animais do mar (caranguejos, peixes, cavalos-marinhos).

**Definido:** o jogo ensina quatro coisas, cada uma ligada a um sistema (para que o aprendizado venha de jogar, não de ler):

| Objetivo | Onde aparece no jogo |
|---|---|
| **Reciclagem:** separar o lixo pelo tipo | Ecoponto e separação (§6) |
| **Fauna e mangue:** os bichos do rio e por que a poluição os afasta | A fauna volta conforme o Rio Vivo sobe (§8) e cada bicho ganha um cartão no Álbum (§12) |
| **História e lugares do Recife** | Cada trecho é um lugar de verdade, com seus marcos na margem e um postal no fim (§10) |
| **Causas da poluição** e o que a criança pode fazer em casa | Fontes de poluição: canais e esgoto que continuam sujando até serem resolvidos (§9) |

**Em aberto:** alinhar os objetivos com a BNCC (Ciências e Geografia dos anos iniciais) junto com um(a) educador(a).

## 3. Loop principal

1. A criança escolhe um **trecho** do rio no mapa (§10).
2. No trecho, navega com o barquinho e **recolhe o lixo** que boia (§4, §5).
3. Quando o **porão** enche, leva o barco ao **Ecoponto** da margem e **separa** o lixo nas lixeiras certas (§6).
4. Recolher e separar fazem o **Rio Vivo** subir (§7): a água clareia e os **bichos voltam** (§8).
5. Enquanto houver **fontes de poluição** abertas (um canal trazendo lixo da rua, um cano de esgoto), lixo novo continua chegando e o Rio Vivo não passa de um limite. A criança vai até a fonte, um(a) morador(a) explica a causa e ela resolve (§9).
6. Com o Rio Vivo em 100%, o trecho está limpo: aparece o **postal** do lugar (§10), e o próximo trecho abre no mapa.

**Definido:** o jogo não tem derrota (§13).

## 4. O barco e o controle

- **Definido:** controle **clicar para ir**: a criança clica num ponto da água e o barco vai até lá. Segurar o botão faz o barco seguir o cursor.
- **Definido:** o mesmo controle funciona com toque (dedo no lugar do mouse), para facilitar a versão de tablet depois.
- O barco acelera e desacelera suave, vira de frente para onde está indo e para ao chegar. **Proposta:** velocidade máxima 3 m/s.
- O barco não sai da água: as margens o seguram. **Proposta:** clicar em terra não faz nada (não há caminho automático contornando as margens). **Em aberto:** se o teste com crianças mostrar que elas clicam muito em terra, trocar por "vai até o ponto de água mais perto".
- Clicar em algo **da margem** que dá para usar (o Ecoponto, uma fonte de poluição) faz o barco ir até lá e usar (§6, §9). Clicar num bicho mostra o cartão dele (§8).
- **Coleta:** o barco tem um puçá (rede de pesca de cabo) que recolhe sozinho o lixo que passa perto. **Proposta:** raio de coleta de 0,6 m.
- **Porão:** guarda o lixo recolhido até a separação. **Proposta:** capacidade de 8 itens. Com o porão cheio, o lixo não entra mais, aparece um aviso "Porão cheio! Leve ao Ecoponto" e uma seta acima do barco aponta para o Ecoponto mais perto.
- **Definido (pela regra sem falha):** o barco não tem combustível, vida nem dano.
- **Em aberto:** melhorias do barco (porão maior, puçá maior) como recompensa entre trechos.

## 5. O lixo

- O lixo boia na água e deriva devagar rio abaixo, balançando. **Proposta:** a correnteza é fraca o bastante para a criança nunca "perder" um item.
- Cada item tem um tipo, que decide a lixeira na separação (§6), e uma frase curta "Você sabia?".
- Um trecho começa com uma quantidade de lixo espalhada; as fontes de poluição abertas trazem mais (§9).

**Proposta** de itens por tipo (as cores são as da coleta seletiva, Resolução CONAMA 275/2001):

| Tipo | Cor da lixeira | Itens |
|---|---|---|
| Papel | Azul | jornal, caixa de papelão |
| Plástico | Vermelho | garrafa PET, sacola, tampinha, canudo, isopor |
| Vidro | Verde | garrafa de vidro, pote |
| Metal | Amarelo | latinha, tampa de metal |
| Orgânico | Marrom | casca de banana, coco verde, **baronesa** (§9) |
| Não reciclável | Cinza | fralda, chinelo velho |

- **Em aberto:** 6 lixeiras pode ser muito para as crianças de 6 anos. Alternativa: um modo de 3 lixeiras (reciclável, orgânico, rejeito). O código suporta os dois (Parte 6 §3.3).
- **Em aberto:** itens de descarte especial (pneu, pilha, sofá, geladeira), que não vão em lixeira nenhuma e ensinam que existem pontos de entrega próprios.
- **Em aberto:** como a coleta seletiva do Recife separa o lixo hoje, para que o jogo não ensine um jeito diferente do que a criança vê na rua (a validar).

## 6. Ecoponto e separação

- Cada trecho tem pelo menos um **Ecoponto** na margem (um pier com as lixeiras coloridas).
- Encostar o barco no Ecoponto (ou clicar nele) abre a **tela de separação**, com o jogo pausado: o lixo do porão aparece numa bandeja, e a criança **arrasta** cada item para a lixeira certa.
- **Acerto:** o item some, a lixeira pula, o Rio Vivo sobe, e a frase "Você sabia?" do item aparece num balão dentro da tela (sem pausar a separação).
- **Erro:** o item volta para a bandeja, aparece um cartão "Ops! A garrafa PET vai na lixeira vermelha, do plástico" com a frase do item, e a lixeira certa pisca. Não há punição além de o item valer menos quando for acertado depois.
- **Proposta:** recolher vale 1 ponto, separar certo na primeira vez vale 2, separar certo depois de errar vale 1.
- Quando a bandeja esvazia, aparece o botão "Voltar ao rio".

## 7. Rio Vivo

- É a barra principal do jogo: quanto do trecho já está limpo (0 a 100%).
- Sobe com os pontos de recolher e separar (§6) e com fontes de poluição resolvidas (§9). **Nunca desce** (não há falha, §13).
- **Proposta:** a meta de cada trecho é 100 pontos. Resolver uma fonte vale 15 pontos.
- **Proposta: o teto das fontes.** Enquanto houver fontes abertas, o Rio Vivo para num limite: cada fonte aberta tira uma parte do teto (com todas abertas, o teto é 60%). Os pontos ganhos acima do teto não se perdem: ao resolver a fonte, a barra pula de uma vez. A barra mostra o teto com um cadeado. É assim que o jogo ensina, jogando, que *não adianta só limpar se a sujeira continuar chegando*.
- A cor da água acompanha o Rio Vivo: de marrom-acinzentado (com manchas e espuma) a verde-azulado limpo.

## 8. A fauna volta

- Cada trecho tem uma lista de bichos, cada um com um limite de Rio Vivo. Quando a barra passa do limite, o bicho aparece (alguns de cada espécie) e passeia: os peixes nadam, as aves voam ou pousam na margem, os caranguejos andam na lama.
- Na primeira vez que uma espécie aparece no jogo, abre o cartão dela (imagem, nome, uma ou duas frases narradas) e ela entra no Álbum (§12). Nas outras vezes, só um aviso "A garça voltou!".
- Clicar num bicho abre o cartão dele de novo.
- **Proposta** de fauna (a validar com biólogo(a), tanto se o bicho vive mesmo ali quanto o que dizer sobre ele): garça-branca, socó, martim-pescador, capivara, tainha, camurim, siri, aratu, caranguejo-uçá, guaiamum, cavalo-marinho.
- **Em aberto:** peixe-boi e jacaré, que são chamativos para crianças, mas talvez não sejam do rio.

## 9. Fontes de poluição

- São os lugares da margem de onde a sujeira vem. Enquanto abertas, mandam lixo novo para o rio de tempos em tempos (**proposta:** a cada 6 s, até 6 itens boiando de cada fonte) e seguram o teto do Rio Vivo (§7).
- A criança leva o barco até a fonte (ou clica nela). Um(a) morador(a) da margem conversa com ela em 2 a 4 falas curtas, narradas: o que está acontecendo, por que é ruim para o rio e o que dá para fazer em casa. A última fala tem o botão da ação, e a fonte fecha.
- O lixo que a fonte já mandou continua no rio, para recolher.
- Cada fonte resolvida entra no Álbum como uma **dica** (§12).

**Proposta** de tipos de fonte:

| Fonte | O que manda | Ação | O que ensina |
|---|---|---|---|
| **Canal da rua** (galeria de chuva) | lixo seco (garrafas, sacolas, latas) | "Instalar ecobarreira" | o lixo jogado na rua desce pelo bueiro e vai parar no rio |
| **Esgoto** | baronesas e lixo orgânico | "Chamar a equipe de saneamento" | o esgoto sem tratamento suja a água e faz as baronesas crescerem demais |

- **Em aberto:** as falas não citam empresa nem órgão público pelo nome, para não ensinar algo que muda com o tempo. Confirmar com o estúdio.
- **Em aberto:** um terceiro tipo para o trecho do Agreste (lavanderias de jeans, §10).

## 10. Trechos do rio

- **Definido:** cada fase é um trecho de verdade do Capibaribe. Limpar um trecho abre o próximo.
- **Definido:** o MVP tem 5 ou mais trechos.
- **Proposta:** 6 trechos no Recife, na ordem em que a água corre, do oeste até o mar. O mapa é o desenho do rio atravessando a cidade, com um botão em cada trecho.
- Cada trecho tem seus marcos desenhados na margem (prédios, pontes, igrejas), que a criança vê passando, e termina com um **postal**: uma ilustração do lugar com uma ou duas frases narradas, que entra no Álbum.

**Proposta** (todos os marcos e fatos **a validar**):

| # | Trecho | Marcos na margem | Fontes | Fauna que volta | O postal ensina |
|---|---|---|---|---|---|
| 1 | Várzea | Oficina Francisco Brennand | 1 canal | garça-branca, capivara | o nome do rio ("rio das capivaras") |
| 2 | Apipucos e Poço da Panela | casa de Gilberto Freyre, igreja do Poço da Panela | 1 esgoto | socó, tainha | por que as baronesas aparecem |
| 3 | Casa Forte, Jaqueira e Torre | Parque da Jaqueira, Ponte da Torre | 1 canal, 1 esgoto | martim-pescador, camurim | o lixo da rua chega ao rio pelos canais |
| 4 | Boa Vista e Rua da Aurora | Rua da Aurora, Ponte Duarte Coelho, Ponte da Boa Vista | 2 canais | garça-branca, tainha, siri | o Recife das pontes ("Veneza brasileira") |
| 5 | Santo Antônio e São José | Casa da Cultura (antiga Casa de Detenção), Ponte Maurício de Nassau | 1 canal, 1 esgoto | siri, camurim | a história do centro do Recife |
| 6 | Marco Zero e o mangue | Marco Zero, encontro com o Beberibe, Parque das Esculturas | 1 esgoto, 1 canal | caranguejo-uçá, aratu, guaiamum, cavalo-marinho | o mangue é o berçário do mar; o manguebeat e os "caranguejos com cérebro" |

- **Proposta:** cada trecho leva uns 8 a 12 minutos, para caber num pedaço da aula.
- **Em aberto:** trechos fora do Recife: a nascente (o rio ali seca em parte do ano) e o Agreste (Toritama e Santa Cruz do Capibaribe, com a poluição das lavanderias de jeans).
- **Em aberto:** uma história ligando os trechos (ex.: a viagem do barco até o mar) ou só o mapa.

## 11. Personagens

- **Definido:** a criança escolhe quem rema o barco entre alguns personagens. A escolha é só visual (todos jogam igual).
- **Proposta:** 4 personagens, com meninos e meninas de aparências diferentes, crianças do Recife.
- **Em aberto:** quantos personagens, e se dá para mudar a roupa ou a cor do barco.
- Os moradores das fontes (§9) são personagens fixos do trecho, com retrato no diálogo.
- **Em aberto:** um mascote que acompanha e narra (ex.: uma capivara, por causa do nome do rio).

## 12. Álbum do Capibaribe

- É a coleção do que a criança descobriu, aberta pelo mapa, em três abas:
  - **Bichos:** cada espécie que já voltou (§8).
  - **Lugares:** o postal de cada trecho limpo (§10).
  - **Dicas:** o que fazer em casa, uma por fonte resolvida (§9).
- O que ainda não foi descoberto aparece como silhueta com "?".
- Abrir um cartão mostra a imagem e o texto e toca a narração.
- **Em aberto:** uma versão imprimível do álbum para o professor.

## 13. Condições de vitória e falha

- **Definido:** não há falha nem game over. A criança sempre termina o trecho.
- Vitória do trecho: Rio Vivo em 100%.
- Errar a separação não tira pontos; só faz o item valer menos (§6).
- **Em aberto:** estrelas ou medalhas por trecho. Hoje a única recompensa é ver o rio, a fauna, o postal e o álbum.

## 14. Estilo visual

- **Definido:** vetor flat colorido, com traço limpo de livro infantil (como a arte vetorial da Rally, `Sprites/Rally2D/`).
- O rio é o protagonista: a água muda de cor com o Rio Vivo (§7), com manchas de óleo e espuma sumindo conforme limpa.
- Os marcos do Recife são reconhecíveis, mas simplificados.
- **Proposta:** paleta quente nas margens (casarões coloridos, verde do mangue) contra a água, que vai do marrom ao verde-azulado.
- **Em aberto:** ferramenta de arte (SpriteCook, como na Rally, ou ilustrador(a)) e a direção de arte dos personagens.

## 15. HUD / UI

- Sempre visíveis no trecho:
  - **Barra do Rio Vivo** no topo, com o cadeado do teto das fontes (§7).
  - **Porão:** os itens recolhidos como ícones (ex.: 3 de 8).
  - Botão **ouvir de novo** (repete a última narração).
  - Botão **mapa** (volta ao mapa; o progresso do trecho não é guardado, §18).
- Avisos curtos no meio da tela ("Porão cheio!", "A garça voltou!").
- **Definido (pelo público de 6 anos):** pouco texto. Todo texto importante é narrado (§16), os botões são grandes e com ícone.

## 16. Áudio e narração

- **Proposta:** toda frase do jogo (cartões, falas dos moradores, avisos importantes) tem narração em voz, em português, para quem ainda lê devagar.
- **Proposta:** música leve inspirada em ritmos de Pernambuco (frevo, maracatu, manguebeat), mais alegre conforme o Rio Vivo sobe.
- Sons de água, remo, puçá recolhendo e o "pulo" da lixeira no acerto.
- **Em aberto:** quem grava a narração, o sotaque (pernambucano?) e as licenças das músicas.

## 17. Uso em sala de aula e acessibilidade

- Pensado para o laboratório da escola: abre no navegador, sem instalar, sem login.
- **Definido (pelo backend):** sem anúncios, sem compras e sem coletar dados das crianças.
- Botões e alvos de clique grandes, para quem ainda não tem precisão no mouse.
- **Em aberto:** um guia para o professor (objetivos de cada trecho, perguntas para a turma depois da aula).
- **Em aberto:** legendas e tamanho de fonte ajustável.

## 18. Backend / Serviços

- **Definido:** salvar só local, no navegador. Sem login, sem servidor, sem coleta de dados.
- O que é salvo: o personagem escolhido, os trechos limpos e os cartões do Álbum. **Proposta:** o progresso *dentro* de um trecho não é salvo (sair no meio recomeça aquele trecho), porque um trecho é curto.
- **Risco:** nos computadores da escola, o navegador pode ser limpo entre as aulas, e várias crianças usam o mesmo computador. **Em aberto:** perfis locais por nome no mesmo computador, ou um "código do progresso" que a criança anota e digita na aula seguinte.
- **Em aberto:** contas de turma para o professor (exigiria servidor e cuidado com a LGPD).

## 19. Escopo do MVP

**Dentro do MVP:**
- Controle clicar para ir, barco com puçá e porão (§4).
- Lixo dos 6 tipos com a frase de cada item (§5).
- Ecoponto e separação por arrastar (§6).
- Rio Vivo com o teto das fontes e a água mudando de cor (§7).
- Fauna voltando por limite de Rio Vivo (§8).
- Os 2 tipos de fonte de poluição, com diálogo (§9).
- 6 trechos do Recife, mapa e postais (§10).
- Escolha de personagem (§11).
- Álbum com as 3 abas (§12).
- Narração das frases (§16).
- Save local (§18).
- Build web.

**Depois do MVP (Em aberto):**
- Versão para tablet/celular (toque).
- Trechos do Agreste e da nascente.
- Modo de 3 lixeiras para os menores.
- Itens de descarte especial.
- Melhorias do barco.
- Guia do professor e álbum imprimível.
- Perfis ou código de progresso.
- Mascote narrador.

## 20. Riscos / Em aberto (consolidado)

- **Fatos:** todo marco, fauna e frase educativa precisa ser validado antes de entrar no jogo (§2, §8, §10).
- **BNCC:** alinhar os objetivos com um(a) educador(a) (§2).
- **Separação:** 6 ou 3 lixeiras para 6 anos; como a coleta seletiva do Recife separa hoje; descarte especial (§5).
- **Controle:** o que fazer quando a criança clica em terra (§4).
- **Fontes:** citar ou não órgãos públicos nas falas; fonte das lavanderias de jeans (§9).
- **Trechos:** trechos fora do Recife; história ligando os trechos (§10).
- **Personagens:** quantos, customização, mascote (§11).
- **Recompensas:** estrelas por trecho, melhorias do barco (§4, §13).
- **Arte:** ferramenta e direção de arte (§14).
- **Áudio:** quem narra, sotaque, licenças das músicas (§16).
- **Sala de aula:** guia do professor, legendas, fonte ajustável (§17).
- **Save:** navegador limpo e computador compartilhado na escola; contas de turma (§18).
- **Números de proposta:** velocidade do barco, raio do puçá, porão de 8, pontos (1/2/1/15), teto de 60%, intervalo das fontes, duração dos trechos.

---

# Parte 2 — Guia de Implementação Unity

> Guia fase a fase para implementar o MVP do Capibaribe Vivo em Unity 6, com build Web (o jogo roda no navegador da escola, Parte 1 §1). Os números de **proposta** da Parte 1 ficam num asset (`GameConfig`) e nos `...Def`, para balancear sem mexer no código.
>
> Cada fase termina com algo que dá para jogar no Play Mode. Ao fim da Fase 5, um trecho inteiro funciona; as Fases 6 e 7 transformam esse trecho em jogo (mapa, vários trechos, personagem, narração).

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele. Glossário: trecho é `Stretch`, Rio Vivo é `RiverHealth`, porão é `Cargo`, puçá é `Net`, Ecoponto é `Ecopoint`, lixeira é `RecycleBin`, fonte de poluição é `PollutionSource`, Álbum é `Album`.
- **Namespaces:**
  - `CapibaribeVivo.Core`: pausa, save, narração e interfaces comuns.
  - `CapibaribeVivo.Data`: ScriptableObjects (configuração, itens de lixo, fauna, trechos, personagens, cartões do álbum).
  - `CapibaribeVivo.River`: o rio, a correnteza, a cor da água e o Rio Vivo.
  - `CapibaribeVivo.Boat`: o barco, o controle, o puçá e o porão.
  - `CapibaribeVivo.Trash`: o lixo boiando e o espalhamento inicial.
  - `CapibaribeVivo.Sorting`: o Ecoponto e a tela de separação.
  - `CapibaribeVivo.Fauna`: os bichos.
  - `CapibaribeVivo.Sources`: as fontes de poluição.
  - `CapibaribeVivo.Progress`: trechos, mapa, álbum e personagens.
  - `CapibaribeVivo.UI`: HUD, cartões, diálogos e avisos.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject e de save:** campos públicos `camelCase`.
- **Textos na tela sem emoji**, porque a fonte padrão do TextMeshPro não tem emojis.

## Arquitetura em uma página

```
 Menu (personagem) ──▶ Map (trechos + Álbum) ──▶ Stretch_XX (um trecho jogável) ──postal──▶ Map

 Dentro de um trecho:

 Clique/toque ──▶ ClickToMoveInput ──alvo──▶ BoatController (Rigidbody2D) ── margens (colliders) seguram
                     │ clicou em algo usável                  │
                     ▼                                         ▼ filho
                 IClickable: Ecopoint / PollutionSource /   BoatNet ──recolhe──▶ BoatCargo ──cheio──▶ CargoFullHint
                             FaunaAnimal                                            │
                                                                                    ▼ TakeAll
 TrashScatter (lixo inicial) ─┐                                Ecopoint ──▶ SortingPanel (arrastar ▶ RecycleBin)
 PollutionSource (aberta) ────┴──▶ FloatingTrash (deriva com RiverFlow)                │ pontos
                                                                                        ▼
 PollutionSource.Close ──pontos e teto──▶ RiverHealth (0..1, com teto) ──Changed──▶ WaterTint, RiverHealthBar,
                                                    │                               FaunaSpawner (bichos + Álbum)
                                                    └──Completed──▶ StretchManager ──▶ postal, save, volta ao mapa

 Sempre vivos: SaveSystem (PlayerPrefs, JSON), AlbumService, Narrator (voz), GamePause (Time.timeScale)
```

- **Uma cena por trecho.** Cada trecho tem um rio desenhado à mão (margens, marcos, Ecoponto e fontes no lugar certo), então é uma cena própria (`Stretch_01_Varzea`, ...), montada a partir de um modelo (Fase 6).
- **Física 2D só para o barco, o lixo e as margens.** O barco é um `Rigidbody2D` empurrado para o alvo; as margens são colliders estáticos; o lixo boia com `Rigidbody2D` e bate nas margens. Todo o resto (bichos, fontes, Ecoponto) usa colliders só como área de clique ou de chegada.
- **Pausa por `Time.timeScale`.** Toda tela que cobre o jogo (separação, cartão, diálogo) pausa com `GamePause`, e a UI usa tempo "unscaled" para continuar animando.

---

# Parte 3 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D vazio, organizado, com os pacotes certos e pronto para build Web.

### 0.1 Criar o projeto

1. Instale o **Unity Hub** e uma versão **Unity 6 LTS** (6000.x) com o módulo **Web Build Support** (o alvo é navegador, Parte 1 §1).
2. No Hub, crie um projeto com **New project → Universal 2D** e o nome `CapibaribeVivo`.
   - É aqui que o "2D topdown" da Parte 1 vira decisão técnica: **o projeto é 2D**. O template já vem com URP 2D, sprites, física 2D e câmera ortográfica.
   - **Topdown não muda o template.** Em 2D, "topdown" é só não usar gravidade: o eixo Y da tela é "rio acima/rio abaixo", não "para cima/para baixo". Por isso todo `Rigidbody2D` do jogo terá **Gravity Scale = 0**.

### 0.2 Estrutura de pastas

Crie dentro de `Assets/`:

```
Assets/_Project/
  Scripts/
    Core/        (pausa, save, narração, IClickable)
    Data/        (GameConfig e os ...Def)
    River/       (correnteza, cor da água, Rio Vivo)
    Boat/        (barco, controle, puçá, porão)
    Trash/
    Sorting/     (Ecoponto e separação)
    Fauna/
    Sources/     (fontes de poluição)
    Progress/    (trechos, mapa, álbum, personagens)
    UI/
  Resources/     (GameConfig e a pasta Album/)
  ScriptableObjects/
    Trash/
    Stretches/
    Characters/
  Prefabs/
    UI/
  Scenes/        (Menu, Map, Stretch_01_Varzea, ...)
  Sprites/
  Audio/
    Narration/
```

### 0.3 Pacotes (Window → Package Manager)

| Pacote | Para quê |
|---|---|
| **Input System** (já vem no Unity 6) | Ler clique do mouse e toque com a mesma conta (`Pointer`). |
| **2D Sprite** (vem com o template 2D) | Sprites placeholder pelo menu **Create → 2D → Sprites** (círculo, quadrado). |
| **2D SpriteShape** | Desenhar as margens do rio como curvas, com o collider gerado sozinho (Fase 1). Combina com a arte vetorial. |
| **TextMeshPro** (parte do pacote uGUI no Unity 6) | Textos da UI. No primeiro uso, aceite **Import TMP Essentials**. |

### 0.4 Camadas, física e input

1. **Layers** (Edit → Project Settings → Tags and Layers → Layers): crie `Land`, `Boat`, `Trash` e `Interact`.
2. **Matriz de colisão** (Project Settings → Physics 2D → Layer Collision Matrix): deixe ligado só:
   - `Boat` × `Land`, `Boat` × `Trash`, `Boat` × `Interact`, `Trash` × `Land`.
   - Desligue o resto (principalmente `Trash` × `Trash`, para o lixo não se amontoar em pilhas, e `Trash` × `Interact`).
3. **Physics 2D → Gravity:** deixe como está; cada `Rigidbody2D` usa Gravity Scale 0.
4. **Sorting Layers:** `Water`, `Banks`, `World`, `FX`, nessa ordem.
5. **Project Settings → Player → Other Settings → Active Input Handling:** **Input System Package (New)** ou **Both**.
6. Crie as cenas `Menu`, `Map` e `Stretch_01_Varzea` em `Assets/_Project/Scenes/` e adicione as três em **File → Build Profiles → Scene List**, com `Menu` em primeiro.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- As três cenas estão na Scene List, com `Menu` no topo.
- As 4 layers existem e a matriz de colisão só tem as 4 combinações ligadas.
- **Create → 2D → Sprite Shape** aparece no menu (o pacote SpriteShape está instalado).

#### Problemas comuns
- **Não aparece a plataforma Web no Build Profiles:** o módulo **Web Build Support** não foi instalado. No Unity Hub: **Installs → (sua versão) → Add modules**.
- **`UnityEngine.InputSystem` não encontrado nos scripts:** o pacote Input System não está instalado, ou o Active Input Handling está em "Input Manager (Old)".

Próxima fase: **O Rio e o Barco**, com as margens, a água, o barco indo para onde se clica e a câmera seguindo.

---

# Parte 4 — Implementação Unity: Fase 1 (O Rio e o Barco)

## Fase 1 — O Rio e o Barco

> Objetivo desta fase: no trecho `Stretch_01_Varzea`, clicar na água faz o barco ir até lá, as margens o seguram e a câmera o segue.

### 1.1 Peças comuns: `IClickable` e `GamePause`

Duas peças pequenas usadas no jogo inteiro. A primeira diz "dá para clicar em mim"; a segunda pausa o jogo sem que uma tela desfaça a pausa da outra.

```csharp
// Caminho: Assets/_Project/Scripts/Core/IClickable.cs
namespace CapibaribeVivo.Core
{
    // POR QUE: o clique na tela pode cair na água (o barco vai até lá) ou em
    // algo usável (Ecoponto, fonte de poluição, um bicho). O controle do barco
    // não deve conhecer cada uma dessas coisas.
    // ESTRATÉGIA: uma "interface" é um contrato: qualquer componente que
    // escreva ": IClickable" promete ter o método OnClicked. O controle só
    // procura "alguém com IClickable" debaixo do clique e chama o método.
    public interface IClickable
    {
        // Chamado quando a criança clica no objeto. Recebe o barco porque
        // quase sempre a resposta é "barco, venha até aqui".
        void OnClicked(Boat.BoatController boat);
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Core/GamePause.cs
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CapibaribeVivo.Core
{
    // POR QUE: várias telas pausam o jogo (separação, cartão de um bicho,
    // diálogo) e às vezes uma abre por cima da outra. Se cada uma fizesse
    // "timeScale = 1" ao fechar, a primeira a fechar despausaria o jogo com a
    // outra ainda aberta.
    // ESTRATÉGIA: um contador. Cada tela que abre faz Push (+1) e cada uma que
    // fecha faz Pop (-1); o jogo só volta quando o contador chega a zero.
    // Time.timeScale = 0 para a física e tudo que usa Time.deltaTime; a UI
    // continua funcionando porque cliques não dependem do tempo.
    public static class GamePause
    {
        private static int _count;

        public static bool IsPaused => _count > 0;

        // Uma tela abriu: pausa (ou continua pausado).
        public static void Push()
        {
            _count++;
            Apply();
        }

        // Uma tela fechou: só despausa se ela era a última.
        public static void Pop()
        {
            _count = Mathf.Max(0, _count - 1);
            Apply();
        }

        // Zera tudo. Usado ao trocar de cena, para nunca começar uma cena pausada.
        public static void Reset()
        {
            _count = 0;
            Apply();
        }

        private static void Apply() => Time.timeScale = _count > 0 ? 0f : 1f;

        // [RuntimeInitializeOnLoadMethod] faz a Unity chamar este método sozinha
        // ao apertar Play, sem precisar de um objeto na cena.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void Init()
        {
            _count = 0;
            SceneManager.sceneLoaded += (_, _) => Reset();
        }
    }
}
```

### 1.2 Desenhar o rio

O rio é o espaço entre duas margens. A água é só um fundo atrás de tudo; quem segura o barco são as margens.

1. **Água:** crie **2D Object → Sprites → Square**, nome `Water`, Sorting Layer `Water`, escala grande o bastante para cobrir o trecho inteiro (ex.: 80 × 30). Cor marrom-acinzentado (`#6B6650`) por enquanto: a Fase 4 faz ela clarear.
2. **Margens:** crie **2D Object → Sprite Shape → Closed Shape**, nome `Bank_North`, layer `Land`, Sorting Layer `Banks`.
   - Edite os pontos (botão **Edit Spline** no Inspector) para formar a margem de cima do rio, com o lado de dentro sendo a terra. Faça curvas: o Capibaribe é cheio delas.
   - Adicione um **Polygon Collider 2D**. O `SpriteShapeController` atualiza esse collider sozinho a partir da curva (no Inspector dele, em **Collider**, deixe **Update Collider** ligado).
   - Duplique para `Bank_South`, a margem de baixo.
3. **Fim do trecho:** feche as duas pontas do rio (rio acima e rio abaixo) com mais duas formas na layer `Land`, para o barco e o lixo não saírem do trecho.

> Dica: comece com um rio de uns 60 m de comprimento e 6 a 10 m de largura. Largo demais deixa a coleta fácil e sem graça; estreito demais faz a criança bater nas margens o tempo todo.

### 1.3 O barco: `BoatController`

```csharp
// Caminho: Assets/_Project/Scripts/Boat/BoatController.cs
using UnityEngine;

namespace CapibaribeVivo.Boat
{
    // POR QUE: o barco precisa ir até o ponto clicado de um jeito suave (acelera,
    // desacelera ao chegar, vira de frente) e ser segurado pelas margens.
    // ESTRATÉGIA: um Rigidbody2D (o componente que faz a Unity cuidar de
    // colisão e movimento físico) que nunca recebe "teletransporte": a cada passo
    // da física calculamos a velocidade desejada (em direção ao alvo, menor
    // perto dele) e aproximamos a velocidade atual dela aos poucos. Como quem
    // move é a física, as margens seguram o barco sozinhas.
    [RequireComponent(typeof(Rigidbody2D))]
    public class BoatController : MonoBehaviour
    {
        [SerializeField] private float _maxSpeed = 3f;       // Parte 1 §4 (proposta)
        [SerializeField] private float _acceleration = 6f;   // m/s ganhos por segundo
        [SerializeField] private float _slowRadius = 1.5f;   // começa a frear a esta distância
        [SerializeField] private float _arriveRadius = 0.25f;
        [SerializeField] private float _turnSpeed = 360f;    // graus por segundo

        private Rigidbody2D _rb;
        private Vector2? _target; // "Vector2?" pode ser nulo: sem alvo, o barco para.

        public bool HasTarget => _target.HasValue;

        // Awake roda uma vez, quando o objeto nasce, antes de qualquer Start.
        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _rb.gravityScale = 0f; // topdown: nada "cai" para baixo da tela
        }

        // Define para onde o barco vai.
        public void SetTarget(Vector2 point) => _target = point;

        // Para o barco na hora (ex.: ao encostar no Ecoponto).
        public void Stop()
        {
            _target = null;
            _rb.linearVelocity = Vector2.zero;
        }

        // FixedUpdate roda no ritmo da física (50 vezes por segundo), o lugar
        // certo para mexer em Rigidbody.
        private void FixedUpdate()
        {
            Vector2 desired = Vector2.zero;

            if (_target.HasValue)
            {
                Vector2 toTarget = _target.Value - _rb.position;
                float distance = toTarget.magnitude;

                if (distance < _arriveRadius)
                {
                    _target = null; // chegou
                }
                else
                {
                    // Longe: velocidade máxima. Dentro do _slowRadius: cai até zero.
                    float speed = _maxSpeed * Mathf.Clamp01(distance / _slowRadius);
                    desired = toTarget / distance * speed;
                }
            }

            _rb.linearVelocity = Vector2.MoveTowards(
                _rb.linearVelocity, desired, _acceleration * Time.fixedDeltaTime);

            TurnTowardsVelocity();
        }

        // Gira o barco para a direção em que ele está andando. O sprite do barco
        // é desenhado com a proa para cima, por isso o "- 90".
        private void TurnTowardsVelocity()
        {
            Vector2 v = _rb.linearVelocity;
            if (v.sqrMagnitude < 0.01f) return; // parado: mantém o ângulo

            float targetAngle = Mathf.Atan2(v.y, v.x) * Mathf.Rad2Deg - 90f;
            float angle = Mathf.MoveTowardsAngle(
                _rb.rotation, targetAngle, _turnSpeed * Time.fixedDeltaTime);
            _rb.MoveRotation(angle);
        }
    }
}
```

> ⚠️ Nota de versão: `rb.linearVelocity` é o nome usado no Unity 6 / 2023.x+. Se o projeto rodar em 2022 LTS, troque por `rb.velocity` (mesma coisa, nome antigo). O mesmo vale para o campo **Linear Damping** do Inspector, que em 2022 LTS se chama **Linear Drag**.

### 1.4 O controle: `ClickToMoveInput`

```csharp
// Caminho: Assets/_Project/Scripts/Boat/ClickToMoveInput.cs
using CapibaribeVivo.Core;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

namespace CapibaribeVivo.Boat
{
    // POR QUE: o controle definido é "clicar para ir" (Parte 1 §4), que tem que
    // funcionar com mouse agora e com toque depois.
    // ESTRATÉGIA: Pointer.current é o "ponteiro" do Input System: o mouse no PC
    // e o dedo no tablet, com a mesma API. No começo do clique decidimos o que
    // ele é: um botão da UI (ignora), algo usável (chama OnClicked), terra
    // (ignora) ou água (vira alvo do barco). Enquanto o botão segue apertado
    // sobre a água, o alvo acompanha o cursor.
    public class ClickToMoveInput : MonoBehaviour
    {
        [SerializeField] private BoatController _boat;
        [SerializeField] private LayerMask _landMask;      // layer Land
        [SerializeField] private LayerMask _clickableMask; // layer Interact
        [SerializeField] private Transform _targetMarker;  // círculo na água (opcional)

        private Camera _cam;
        private bool _followingHold; // o clique atual começou na água?

        private void Awake() => _cam = Camera.main;

        // Update roda uma vez por quadro: o lugar certo para ler input.
        private void Update()
        {
            var pointer = Pointer.current;
            if (pointer == null || GamePause.IsPaused) return;

            if (pointer.press.wasPressedThisFrame)
                _followingHold = HandlePress(pointer);

            if (!pointer.press.isPressed) _followingHold = false;

            if (_followingHold)
            {
                Vector2 world = ToWorld(pointer);
                if (!IsLand(world)) MoveTo(world);
            }
        }

        // Decide o que o clique é. Devolve true se começou na água (aí segurar
        // o botão continua guiando o barco).
        private bool HandlePress(Pointer pointer)
        {
            // Clique em cima de um botão ou painel da UI: não é para o barco.
            if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject())
                return false;

            Vector2 world = ToWorld(pointer);

            Collider2D hit = Physics2D.OverlapPoint(world, _clickableMask);
            if (hit != null)
            {
                // GetComponentInParent aceita interfaces: acha o IClickable no
                // objeto do collider ou em algum pai dele.
                var clickable = hit.GetComponentInParent<IClickable>();
                if (clickable != null)
                {
                    clickable.OnClicked(_boat);
                    return false;
                }
            }

            if (IsLand(world)) return false; // Parte 1 §4: clicar em terra não faz nada

            MoveTo(world);
            return true;
        }

        private void MoveTo(Vector2 world)
        {
            _boat.SetTarget(world);
            if (_targetMarker != null) _targetMarker.position = world;
        }

        private bool IsLand(Vector2 world) => Physics2D.OverlapPoint(world, _landMask) != null;

        // Converte a posição do ponteiro (em pixels da tela) para o mundo do jogo.
        private Vector2 ToWorld(Pointer pointer)
        {
            Vector2 screen = pointer.position.ReadValue();
            return _cam.ScreenToWorldPoint(screen);
        }
    }
}
```

### 1.5 A câmera: `CameraFollow2D`

```csharp
// Caminho: Assets/_Project/Scripts/River/CameraFollow2D.cs
using UnityEngine;

namespace CapibaribeVivo.River
{
    // POR QUE: o trecho é maior que a tela, então a câmera segue o barco, mas
    // não pode mostrar o "fora do mapa" depois do fim do rio.
    // ESTRATÉGIA: a cada quadro, depois que tudo se moveu (LateUpdate), a
    // câmera desliza suave (SmoothDamp) até o barco e é presa dentro de um
    // retângulo. Se o retângulo for menor que a tela num eixo, centraliza.
    [RequireComponent(typeof(Camera))]
    public class CameraFollow2D : MonoBehaviour
    {
        [SerializeField] private Transform _target;
        [SerializeField] private float _smoothTime = 0.3f;
        [SerializeField] private Rect _bounds = new Rect(-30f, -12f, 60f, 24f);

        private Camera _cam;
        private Vector3 _velocity; // usado pelo SmoothDamp para lembrar a velocidade

        private void Awake() => _cam = GetComponent<Camera>();

        private void LateUpdate()
        {
            if (_target == null) return;

            Vector3 goal = _target.position;
            goal.z = transform.position.z; // a câmera 2D fica sempre no mesmo Z

            float halfH = _cam.orthographicSize;
            float halfW = halfH * _cam.aspect;
            goal.x = ClampAxis(goal.x, _bounds.xMin, _bounds.xMax, halfW);
            goal.y = ClampAxis(goal.y, _bounds.yMin, _bounds.yMax, halfH);

            transform.position = Vector3.SmoothDamp(transform.position, goal, ref _velocity, _smoothTime);
        }

        // Prende um eixo entre min e max, contando a metade da tela.
        private static float ClampAxis(float value, float min, float max, float half)
        {
            if (max - min < half * 2f) return (min + max) * 0.5f;
            return Mathf.Clamp(value, min + half, max - half);
        }

        // Desenha o retângulo na janela Scene, para ajustar à mão.
        private void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireCube(_bounds.center, _bounds.size);
        }
    }
}
```

### 1.6 A correnteza: `RiverFlow`

O lixo da Fase 2 deriva rio abaixo. A correnteza fica num componente da cena, porque cada trecho corre para um lado.

```csharp
// Caminho: Assets/_Project/Scripts/River/RiverFlow.cs
using UnityEngine;

namespace CapibaribeVivo.River
{
    // POR QUE: o lixo deriva devagar rio abaixo (Parte 1 §5), e cada trecho tem
    // a sua direção de correnteza.
    // ESTRATÉGIA: uma correnteza única por trecho, guardada num campo
    // "static" (que pertence à classe, não a um objeto) para qualquer lixo ler
    // sem precisar procurar o componente. É uma simplificação: o rio faz curvas
    // e a correnteza não. As margens seguram o lixo nas curvas.
    public class RiverFlow : MonoBehaviour
    {
        public static Vector2 Current { get; private set; }

        [SerializeField] private Vector2 _direction = Vector2.right; // para onde a água corre
        [SerializeField] private float _strength = 0.15f;            // fraca de propósito

        private void OnEnable() => Current = _direction.normalized * _strength;
        private void OnDisable() => Current = Vector2.zero;
    }
}
```

### 1.7 Montar a cena

1. **Barco:** crie um objeto `Boat`, layer `Boat`, Sorting Layer `World`, com:
   - **Sprite Renderer** com um placeholder (um retângulo alongado, proa para cima).
   - **Rigidbody2D:** Body Type **Dynamic**, Gravity Scale **0**, **Linear Damping 1**, **Angular Damping 5**, Collision Detection **Continuous**, Interpolate **Interpolate** (deixa o movimento liso entre os passos da física).
   - **Capsule Collider 2D** (vertical) do tamanho do casco.
   - `BoatController`.
2. **Câmera:** na Main Camera, **Projection = Orthographic**, **Size = 6**, e adicione `CameraFollow2D` com o `Boat` como alvo. Ajuste o retângulo para cobrir o trecho (o gizmo ciano mostra).
3. **Controle:** crie um objeto vazio `Input` com `ClickToMoveInput`: arraste o `Boat`, marque `Land` em **Land Mask** e `Interact` em **Clickable Mask**. Para o marcador, um círculo pequeno e semitransparente.
4. **EventSystem:** **GameObject → UI → Event System** (o `IsPointerOverGameObject` precisa dele). Se aparecer o aviso de módulo antigo, clique em **Replace with InputSystemUIInputModule**.
5. **Correnteza:** um objeto vazio `River` com `RiverFlow`, direção apontando rio abaixo.

### ✅ Checkpoint da Fase 1
- Clicar na água faz o barco ir até o ponto, frear e parar nele, virado para onde andava.
- Segurar o botão e arrastar faz o barco seguir o cursor.
- Clicar em terra não faz nada; o barco não atravessa as margens nem sai pelas pontas do trecho.
- A câmera segue o barco e nunca mostra a área fora do retângulo.

#### Problemas comuns
- **O barco atravessa a margem:** o Polygon Collider 2D da Sprite Shape não foi gerado (veja **Update Collider** no `SpriteShapeController`) ou a margem não está na layer `Land`. Com o barco rápido, confirme **Collision Detection = Continuous**.
- **O barco gira sozinho ao bater na margem:** aumente o **Angular Damping**, ou marque **Constraints → Freeze Rotation Z** (o `MoveRotation` continua girando o barco).
- **Clicar na água não faz nada:** a água (`Water`) tem um collider na layer `Land`? Ela não deve ter collider nenhum.

Próxima fase: **Lixo e Coleta**, com o lixo boiando, o puçá recolhendo e o porão.

---

# Parte 5 — Implementação Unity: Fase 2 (Lixo e Coleta)

## Fase 2 — Lixo e Coleta

> Objetivo desta fase: o rio começa sujo, o barco recolhe o lixo ao passar perto e o porão enche até 8, com aviso e seta para o Ecoponto.

### 2.1 Os dados: `GameConfig` e `TrashItemDef`

Um **ScriptableObject** é um arquivo de dados que vive na pasta do projeto (não na cena) e aparece no Inspector. É onde ficam os números de proposta da Parte 1 e cada item de lixo.

```csharp
// Caminho: Assets/_Project/Scripts/Data/TrashItemDef.cs
using UnityEngine;

namespace CapibaribeVivo.Data
{
    // Os 6 tipos de lixo da Parte 1 §5 (cada um vai numa cor de lixeira).
    public enum TrashCategory { Paper, Plastic, Glass, Metal, Organic, NonRecyclable }

    // POR QUE: cada item de lixo (garrafa PET, latinha, baronesa...) tem nome,
    // ícone, tipo e a frase "Você sabia?". Isso é dado, não comportamento, e o
    // time de conteúdo precisa editar sem mexer em código.
    // ESTRATÉGIA: um ScriptableObject por item. [CreateAssetMenu] cria a opção
    // no menu Create do Project, então criar um item novo é clicar e preencher.
    [CreateAssetMenu(menuName = "Capibaribe Vivo/Trash Item", fileName = "Trash_")]
    public class TrashItemDef : ScriptableObject
    {
        public string displayName = "Garrafa PET";
        public Sprite icon;
        public TrashCategory category;
        [TextArea(2, 5)] public string fact = "Uma garrafa PET pode virar fio para fazer roupa.";
        public AudioClip factNarration; // a mesma frase, falada (Parte 1 §16)
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameConfig.cs
using System.Collections.Generic;
using UnityEngine;

namespace CapibaribeVivo.Data
{
    // POR QUE: os números de proposta da Parte 1 (porão, pontos, teto das
    // fontes) vão mudar muito no teste com crianças. Ficando num lugar só, o
    // balanceamento é editar um asset.
    // ESTRATÉGIA: um único asset chamado "GameConfig" dentro de uma pasta
    // "Resources". Tudo que fica em Resources pode ser carregado pelo nome com
    // Resources.Load, então qualquer script acha a configuração sem precisar
    // arrastar referência no Inspector.
    [CreateAssetMenu(menuName = "Capibaribe Vivo/Game Config", fileName = "GameConfig")]
    public class GameConfig : ScriptableObject
    {
        [Header("Barco (Parte 1 §4)")]
        public int cargoCapacity = 8;

        [Header("Pontos do Rio Vivo (Parte 1 §6, §7)")]
        public int pointsPerPickup = 1;
        public int pointsPerCorrectSort = 2;  // acertou na primeira vez
        public int pointsPerLateSort = 1;     // acertou depois de errar
        public int pointsPerSourceClosed = 15;
        [Range(0f, 1f)] public float openSourcesCeilingPenalty = 0.4f; // todas abertas = teto de 60%

        [Header("Cenas")]
        public string menuScene = "Menu";
        public string mapScene = "Map";

        [Header("Conteúdo (preenchido nas Fases 6 e 7)")]
        public List<StretchDef> stretches = new();      // na ordem do mapa
        public List<CharacterDef> characters = new();

        private static GameConfig _instance;

        // Acha o asset na primeira vez que alguém pede e guarda para as próximas.
        public static GameConfig Instance
        {
            get
            {
                if (_instance == null) _instance = Resources.Load<GameConfig>("GameConfig");
                return _instance;
            }
        }
    }
}
```

> `StretchDef` e `CharacterDef` só são escritos nas Fases 6 e 7. Até lá, para compilar, crie os dois como classes vazias (`public class StretchDef : ScriptableObject {}` e `public class CharacterDef : ScriptableObject {}`, no namespace `CapibaribeVivo.Data`) e substitua depois.

Crie o asset em `Assets/_Project/Resources/` com **Create → Capibaribe Vivo → Game Config**, com o nome exato `GameConfig`. Crie também os itens da tabela da Parte 1 §5 em `ScriptableObjects/Trash/` (pode começar com um de cada tipo).

### 2.2 O lixo boiando: `FloatingTrash`

```csharp
// Caminho: Assets/_Project/Scripts/Trash/FloatingTrash.cs
using System.Collections.Generic;
using CapibaribeVivo.Data;
using CapibaribeVivo.River;
using UnityEngine;

namespace CapibaribeVivo.Trash
{
    // POR QUE: o lixo precisa boiar (balançar), derivar rio abaixo e bater nas
    // margens, e precisa lembrar que item é e de qual fonte veio (a fonte só
    // manda lixo novo se tiver pouco do dela no rio, Fase 5).
    // ESTRATÉGIA: um Rigidbody2D leve empurrado pela correnteza com AddForce,
    // com "damping" alto para nunca ganhar velocidade. O balanço é só visual:
    // um filho com o sprite sobe e desce, sem mexer na física. Uma lista
    // estática "All" guarda todo lixo vivo, para contar sem procurar na cena.
    [RequireComponent(typeof(Rigidbody2D))]
    public class FloatingTrash : MonoBehaviour
    {
        public static readonly List<FloatingTrash> All = new();

        [SerializeField] private TrashItemDef _item;      // para lixo colocado à mão na cena
        [SerializeField] private SpriteRenderer _visual;  // filho com o sprite
        [SerializeField] private float _bobHeight = 0.05f;
        [SerializeField] private float _wobble = 0.05f;   // empurrãozinho aleatório

        private Rigidbody2D _rb;
        private float _phase;

        public TrashItemDef Item => _item;
        public Object Source { get; private set; } // a PollutionSource de origem (ou nada)

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _rb.gravityScale = 0f;
            _phase = Random.value * 10f; // cada lixo balança num ritmo diferente
        }

        // Chamado por quem cria o lixo (espalhamento inicial ou fonte).
        public void Init(TrashItemDef item, Object source)
        {
            _item = item;
            Source = source;
            ApplyVisual();
        }

        private void Start()
        {
            ApplyVisual();
            _visual.transform.localRotation = Quaternion.Euler(0, 0, Random.Range(0f, 360f));
        }

        // OnEnable/OnDisable rodam quando o objeto liga/desliga (e ao ser destruído).
        private void OnEnable() => All.Add(this);
        private void OnDisable() => All.Remove(this);

        private void ApplyVisual()
        {
            if (_item != null && _visual != null) _visual.sprite = _item.icon;
        }

        private void FixedUpdate()
        {
            Vector2 wobble = Random.insideUnitCircle * _wobble;
            _rb.AddForce(RiverFlow.Current + wobble);
        }

        private void Update()
        {
            // Sobe e desce devagar, só o desenho.
            float y = Mathf.Sin(Time.time * 2f + _phase) * _bobHeight;
            _visual.transform.localPosition = new Vector3(0f, y, 0f);
        }
    }
}
```

### 2.3 O rio começa sujo: `TrashScatter`

```csharp
// Caminho: Assets/_Project/Scripts/Trash/TrashScatter.cs
using CapibaribeVivo.Data;
using UnityEngine;

namespace CapibaribeVivo.Trash
{
    // POR QUE: colocar 30 lixos à mão em cada trecho é lento e chato de ajustar.
    // ESTRATÉGIA: sorteia posições dentro de um retângulo e descarta as que
    // caem em terra (Physics2D.OverlapCircle na layer Land). Com uma "semente"
    // (seed) diferente de zero, o sorteio é sempre o mesmo, o que ajuda a
    // testar; com zero, muda a cada partida.
    public class TrashScatter : MonoBehaviour
    {
        [SerializeField] private FloatingTrash _prefab;
        [SerializeField] private TrashItemDef[] _pool;
        [SerializeField] private int _count = 30;
        [SerializeField] private Rect _area = new Rect(-28f, -5f, 56f, 10f);
        [SerializeField] private LayerMask _landMask;
        [SerializeField] private float _clearance = 0.4f; // distância mínima da margem
        [SerializeField] private int _seed;

        public int Count => _count;

        private void Start()
        {
            var rng = _seed == 0 ? new System.Random() : new System.Random(_seed);
            int placed = 0;
            int tries = 0;

            while (placed < _count && tries < _count * 30)
            {
                tries++;
                var p = new Vector2(
                    Mathf.Lerp(_area.xMin, _area.xMax, (float)rng.NextDouble()),
                    Mathf.Lerp(_area.yMin, _area.yMax, (float)rng.NextDouble()));

                if (Physics2D.OverlapCircle(p, _clearance, _landMask) != null) continue;

                FloatingTrash trash = Instantiate(_prefab, p, Quaternion.identity, transform);
                trash.Init(_pool[rng.Next(_pool.Length)], null);
                placed++;
            }

            if (placed < _count)
                Debug.LogWarning($"TrashScatter: só coube {placed} de {_count}. Aumente a área.", this);
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = new Color(1f, 0.6f, 0f);
            Gizmos.DrawWireCube(_area.center, _area.size);
        }
    }
}
```

### 2.4 O porão e o puçá: `BoatCargo` e `BoatNet`

```csharp
// Caminho: Assets/_Project/Scripts/Boat/BoatCargo.cs
using System;
using System.Collections.Generic;
using CapibaribeVivo.Data;
using UnityEngine;

namespace CapibaribeVivo.Boat
{
    // POR QUE: o lixo recolhido fica guardado até a separação (Parte 1 §4), e o
    // HUD, a seta e o Ecoponto precisam saber o que tem lá.
    // ESTRATÉGIA: uma lista de TrashItemDef (o dado do item, não o objeto da
    // cena, que é destruído ao recolher). Quem quiser saber de mudanças assina
    // o evento Changed (um "evento" é uma lista de funções chamadas juntas).
    public class BoatCargo : MonoBehaviour
    {
        public event Action Changed;
        public event Action BumpedWhileFull; // tentou recolher com o porão cheio

        private readonly List<TrashItemDef> _items = new();
        private float _lastBump = -10f;

        public IReadOnlyList<TrashItemDef> Items => _items;
        public int Capacity => GameConfig.Instance.cargoCapacity;
        public bool IsFull => _items.Count >= Capacity;

        // Tenta guardar um item. Devolve false se o porão está cheio.
        public bool TryAdd(TrashItemDef item)
        {
            if (IsFull)
            {
                // Avisa no máximo a cada 3 s, senão o aviso pisca sem parar.
                if (Time.time - _lastBump > 3f)
                {
                    _lastBump = Time.time;
                    BumpedWhileFull?.Invoke();
                }
                return false;
            }

            _items.Add(item);
            Changed?.Invoke();
            return true;
        }

        // Esvazia o porão e entrega tudo (o Ecoponto chama isto).
        public List<TrashItemDef> TakeAll()
        {
            var all = new List<TrashItemDef>(_items);
            _items.Clear();
            Changed?.Invoke();
            return all;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Boat/BoatNet.cs
using CapibaribeVivo.Data;
using CapibaribeVivo.River;
using CapibaribeVivo.Trash;
using UnityEngine;

namespace CapibaribeVivo.Boat
{
    // POR QUE: o puçá recolhe sozinho o lixo que passa perto (Parte 1 §4), sem a
    // criança precisar mirar.
    // ESTRATÉGIA: um collider "trigger" (que não bate, só avisa quando algo
    // entra nele) num filho do barco. OnTriggerStay2D é chamado enquanto o lixo
    // está dentro, então, se o porão esvaziar com o barco em cima do lixo, ele
    // é recolhido na hora.
    public class BoatNet : MonoBehaviour
    {
        [SerializeField] private BoatCargo _cargo;

        private void OnTriggerStay2D(Collider2D other)
        {
            var trash = other.GetComponentInParent<FloatingTrash>();
            if (trash == null || trash.Item == null) return;

            if (_cargo.TryAdd(trash.Item))
            {
                // RiverHealth vem na Fase 4. O "?." pula a chamada se ainda não existir.
                RiverHealth.Instance?.AddPoints(GameConfig.Instance.pointsPerPickup);
                Destroy(trash.gameObject);
            }
        }
    }
}
```

> `RiverHealth` só é escrito na Fase 4. Até lá, comente a linha do `RiverHealth` para compilar.

### 2.5 Avisos e HUD do porão: `Toast`, `CargoHud` e `CargoFullHint`

```csharp
// Caminho: Assets/_Project/Scripts/UI/Toast.cs
using System.Collections;
using TMPro;
using UnityEngine;

namespace CapibaribeVivo.UI
{
    // POR QUE: avisos curtos ("Porão cheio!", "A garça voltou!") precisam
    // aparecer sem pausar nem exigir clique.
    // ESTRATÉGIA: um texto com CanvasGroup (que controla a transparência de um
    // pedaço da UI) que aparece, espera e some. Usa tempo "unscaled" para
    // funcionar mesmo com o jogo pausado. Um aviso novo substitui o anterior.
    [RequireComponent(typeof(CanvasGroup))]
    public class Toast : MonoBehaviour
    {
        public static Toast Instance { get; private set; }

        [SerializeField] private TMP_Text _text;
        [SerializeField] private float _duration = 2.5f;

        private CanvasGroup _group;
        private Coroutine _routine;

        private void Awake()
        {
            Instance = this;
            _group = GetComponent<CanvasGroup>();
            _group.alpha = 0f;
            _group.blocksRaycasts = false; // nunca atrapalha cliques
        }

        // Atalho para qualquer script: Toast.Show("...").
        public static void Show(string message)
        {
            if (Instance != null) Instance.ShowInternal(message);
        }

        private void ShowInternal(string message)
        {
            _text.text = message;
            if (_routine != null) StopCoroutine(_routine);
            _routine = StartCoroutine(Run());
        }

        // Uma "coroutine" é uma função que pode esperar no meio (yield) sem travar o jogo.
        private IEnumerator Run()
        {
            yield return Fade(0f, 1f, 0.2f);
            yield return new WaitForSecondsRealtime(_duration);
            yield return Fade(1f, 0f, 0.4f);
        }

        private IEnumerator Fade(float from, float to, float time)
        {
            for (float t = 0f; t < time; t += Time.unscaledDeltaTime)
            {
                _group.alpha = Mathf.Lerp(from, to, t / time);
                yield return null; // espera o próximo quadro
            }
            _group.alpha = to;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/CargoHud.cs
using CapibaribeVivo.Boat;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CapibaribeVivo.UI
{
    // POR QUE: a criança precisa ver o porão enchendo, com os ícones do que
    // recolheu (Parte 1 §15), e ser avisada quando encher.
    // ESTRATÉGIA: uma fileira fixa de Images (uma por vaga do porão). A cada
    // mudança, as primeiras recebem o ícone e as outras ficam vazias.
    public class CargoHud : MonoBehaviour
    {
        [SerializeField] private BoatCargo _cargo;
        [SerializeField] private Image[] _slots;   // tantas quanto o porão (8)
        [SerializeField] private Sprite _emptySlot;
        [SerializeField] private TMP_Text _count;  // "3/8"

        private void OnEnable()
        {
            _cargo.Changed += Refresh;
            _cargo.BumpedWhileFull += OnFull;
        }

        private void OnDisable()
        {
            _cargo.Changed -= Refresh;
            _cargo.BumpedWhileFull -= OnFull;
        }

        private void Start() => Refresh();

        private void Refresh()
        {
            var items = _cargo.Items;
            for (int i = 0; i < _slots.Length; i++)
                _slots[i].sprite = i < items.Count ? items[i].icon : _emptySlot;
            _count.text = $"{items.Count}/{_cargo.Capacity}";
        }

        private void OnFull() => Toast.Show("Porão cheio! Leve ao Ecoponto.");
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Boat/CargoFullHint.cs
using UnityEngine;

namespace CapibaribeVivo.Boat
{
    // POR QUE: com o porão cheio, uma seta perto do barco aponta para o
    // Ecoponto mais perto (Parte 1 §4), para a criança não ficar perdida.
    // ESTRATÉGIA: o Ecoponto ainda não existe (Fase 3), então a seta aponta
    // para qualquer Transform marcado como destino. Na Fase 3, os Ecopontos se
    // registram aqui. A seta é reposicionada em LateUpdate, em coordenadas do
    // mundo, para não girar junto com o barco.
    public class CargoFullHint : MonoBehaviour
    {
        public static readonly System.Collections.Generic.List<Transform> Targets = new();

        [SerializeField] private BoatCargo _cargo;
        [SerializeField] private Transform _arrow;
        [SerializeField] private float _distance = 1.2f;

        private void LateUpdate()
        {
            Transform nearest = FindNearest();
            bool show = _cargo.IsFull && nearest != null;
            _arrow.gameObject.SetActive(show);
            if (!show) return;

            Vector2 dir = ((Vector2)nearest.position - (Vector2)transform.position).normalized;
            _arrow.position = (Vector2)transform.position + dir * _distance;
            _arrow.rotation = Quaternion.FromToRotation(Vector3.up, dir); // sprite da seta aponta para cima
        }

        private Transform FindNearest()
        {
            Transform best = null;
            float bestSq = float.MaxValue;
            foreach (var t in Targets)
            {
                float sq = ((Vector2)(t.position - transform.position)).sqrMagnitude;
                if (sq < bestSq) { bestSq = sq; best = t; }
            }
            return best;
        }
    }
}
```

### 2.6 Montar a cena

1. **Prefab do lixo** (`Prefabs/FloatingTrash`): objeto na layer `Trash` com **Rigidbody2D** (Dynamic, Gravity Scale 0, **Linear Damping 3**, **Angular Damping 3**, Mass 0.2), **Circle Collider 2D** (raio 0.2) e `FloatingTrash`. Um filho `Visual` com o **Sprite Renderer** (Sorting Layer `World`), arrastado em **Visual**.
2. **Espalhamento:** objeto `TrashScatter` com o prefab, a lista de itens, a área cobrindo o rio (gizmo laranja) e **Land Mask** = `Land`.
3. **Puçá:** filho `Net` do `Boat`, na layer `Boat`, com **Circle Collider 2D** marcado **Is Trigger** (raio 0.6, Parte 1 §4) e `BoatNet` apontando para o `BoatCargo`.
4. **Porão:** `BoatCargo` no `Boat`. `CargoFullHint` também no `Boat`, com um filho `Arrow` (uma seta, Sorting Layer `FX`). Para testar sem Ecoponto, crie um objeto vazio na margem e, num script de teste, adicione-o em `CargoFullHint.Targets`.
5. **HUD:** **GameObject → UI → Canvas** (`HUD`), **Canvas Scaler → Scale With Screen Size**, referência 1920 × 1080. Dentro:
   - `Cargo`: um painel com 8 Images e um texto, com `CargoHud`.
   - `Toast`: um texto grande no meio da tela com **CanvasGroup** e `Toast`.

### ✅ Checkpoint da Fase 2
- O rio começa com uns 30 lixos espalhados na água, nenhum em terra, todos balançando e derivando devagar.
- Passar perto de um lixo recolhe e o ícone dele aparece no HUD do porão ("1/8").
- Com 8 itens, o lixo para de ser recolhido (o barco empurra), aparece "Porão cheio! Leve ao Ecoponto." e a seta aparece.
- O lixo bate nas margens e não sai do trecho.

#### Problemas comuns
- **O puçá não recolhe nada:** a matriz de colisão está com `Boat` × `Trash` desligado, ou o collider do `Net` não está como **Is Trigger**.
- **O lixo dispara para longe ao nascer:** dois lixos nasceram um em cima do outro com `Trash` × `Trash` ligado. Desligue na matriz (Fase 0 §0.4).
- **`GameConfig.Instance` é nulo:** o asset não está em uma pasta chamada `Resources`, ou não se chama exatamente `GameConfig`.

Próxima fase: **Ecoponto e Separação**, onde o lixo do porão é arrastado para as lixeiras.

---

# Parte 6 — Implementação Unity: Fase 3 (Ecoponto e Separação)

## Fase 3 — Ecoponto e Separação

> Objetivo desta fase: encostar no Ecoponto abre a tela de separação, com o jogo pausado; cada item arrastado para a lixeira certa some, e o errado volta com um cartão explicando.

### 3.1 A voz: `Narrator`

A separação já precisa tocar a frase de cada item, então a narração entra aqui.

```csharp
// Caminho: Assets/_Project/Scripts/Core/Narrator.cs
using UnityEngine;

namespace CapibaribeVivo.Core
{
    // POR QUE: toda frase importante é narrada (Parte 1 §16), e uma narração
    // nova deve cortar a anterior (não duas vozes ao mesmo tempo). O botão
    // "ouvir de novo" precisa lembrar a última.
    // ESTRATÉGIA: um único objeto que sobrevive à troca de cenas
    // (DontDestroyOnLoad), criado sozinho quando o jogo começa. Ninguém precisa
    // colocá-lo em cena nenhuma.
    public class Narrator : MonoBehaviour
    {
        public static Narrator Instance { get; private set; }

        private AudioSource _source;
        private AudioClip _last;

        // Cria o narrador ao apertar Play, antes da primeira cena rodar.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void Create()
        {
            var go = new GameObject("Narrator");
            go.AddComponent<Narrator>();
        }

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            _source = gameObject.AddComponent<AudioSource>();
            _source.playOnAwake = false;
            _source.ignoreListenerPause = true;
        }

        // Toca uma narração, cortando a que estiver tocando. Sem clip, não faz nada.
        public void Play(AudioClip clip)
        {
            if (clip == null) return;
            _last = clip;
            _source.Stop();
            _source.clip = clip;
            _source.Play();
        }

        public void RepeatLast() => Play(_last);

        public void Stop() => _source.Stop();
    }
}
```

### 3.2 O cartão: `InfoCardPanel`

Um cartão com imagem, título, texto e um botão, usado para o erro da separação, os bichos, o postal e o Álbum. Como dois cartões podem ser pedidos ao mesmo tempo (um erro e um bicho que acabou de voltar), ele tem fila.

```csharp
// Caminho: Assets/_Project/Scripts/UI/InfoCardPanel.cs
using System;
using System.Collections.Generic;
using CapibaribeVivo.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CapibaribeVivo.UI
{
    // POR QUE: o jogo mostra o mesmo tipo de cartão em muitos lugares (erro,
    // fauna, postal, Álbum). Um só painel evita quatro telas quase iguais.
    // ESTRATÉGIA: pedidos vão para uma fila (Queue); o painel mostra um de cada
    // vez e só despausa o jogo quando a fila esvazia. O painel tem um fundo
    // escuro de tela inteira que bloqueia cliques no jogo atrás.
    public class InfoCardPanel : MonoBehaviour
    {
        public static InfoCardPanel Instance { get; private set; }

        [SerializeField] private GameObject _root;
        [SerializeField] private TMP_Text _title;
        [SerializeField] private TMP_Text _body;
        [SerializeField] private Image _image;
        [SerializeField] private Button _button;
        [SerializeField] private TMP_Text _buttonLabel;

        // Um pedido de cartão: o que mostrar e o que fazer ao fechar.
        private struct Request
        {
            public string title, body, buttonLabel;
            public Sprite image;
            public AudioClip narration;
            public Action onClose;
        }

        private readonly Queue<Request> _queue = new();
        private Request _current;
        private bool _showing;

        public bool IsOpen => _showing;

        private void Awake()
        {
            Instance = this;
            _root.SetActive(false);
            _button.onClick.AddListener(CloseCurrent);
        }

        // Pede um cartão. Se já houver um aberto, entra na fila.
        public void Show(string title, string body, Sprite image, AudioClip narration,
                         string buttonLabel = "OK", Action onClose = null)
        {
            _queue.Enqueue(new Request
            {
                title = title, body = body, image = image, narration = narration,
                buttonLabel = buttonLabel, onClose = onClose,
            });
            if (!_showing) ShowNext();
        }

        private void ShowNext()
        {
            if (_queue.Count == 0)
            {
                _showing = false;
                _root.SetActive(false);
                GamePause.Pop();
                return;
            }

            if (!_showing) GamePause.Push(); // pausa uma vez para a fila inteira
            _showing = true;

            _current = _queue.Dequeue();
            _title.text = _current.title;
            _body.text = _current.body;
            _image.sprite = _current.image;
            _image.gameObject.SetActive(_current.image != null);
            _buttonLabel.text = _current.buttonLabel;
            _root.SetActive(true);
            transform.SetAsLastSibling(); // o painel inteiro passa para o fim do Canvas: fica por cima da separação
            Narrator.Instance?.Play(_current.narration);
        }

        private void CloseCurrent()
        {
            Narrator.Instance?.Stop();
            Action callback = _current.onClose;
            ShowNext();
            callback?.Invoke();
        }
    }
}
```

### 3.3 A tela de separação: `SortingPanel`, `TrashCard` e `RecycleBin`

A Unity tem um sistema pronto de arrastar na UI: um componente que implementa `IBeginDragHandler`, `IDragHandler` e `IEndDragHandler` recebe o arraste, e um que implementa `IDropHandler` recebe o "soltei em cima de você". A ordem é: `OnDrop` na lixeira primeiro, `OnEndDrag` no item depois.

```csharp
// Caminho: Assets/_Project/Scripts/Sorting/TrashCard.cs
using CapibaribeVivo.Data;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace CapibaribeVivo.Sorting
{
    // POR QUE: cada item do porão vira uma carta arrastável na bandeja.
    // ESTRATÉGIA: ao começar o arraste, a carta sai da bandeja e vai para a raiz
    // do Canvas (para ficar por cima de tudo) e para de bloquear cliques
    // (blocksRaycasts = false), senão a lixeira embaixo dela nunca receberia o
    // OnDrop. Se ninguém a aceitar, ela volta para a bandeja e o Layout Group
    // da bandeja a coloca no lugar.
    [RequireComponent(typeof(CanvasGroup))]
    public class TrashCard : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler
    {
        [SerializeField] private Image _icon;
        [SerializeField] private TMP_Text _label;

        private SortingPanel _panel;
        private CanvasGroup _group;
        private RectTransform _rect;
        private bool _consumed;

        public TrashItemDef Item { get; private set; }
        public bool HadMistake { get; private set; }

        public void Init(TrashItemDef item, SortingPanel panel)
        {
            Item = item;
            _panel = panel;
            _group = GetComponent<CanvasGroup>();
            _rect = (RectTransform)transform;
            _icon.sprite = item.icon;
            _label.text = item.displayName;
        }

        public void OnBeginDrag(PointerEventData eventData)
        {
            _group.blocksRaycasts = false;
            transform.SetParent(_panel.DragLayer, true);
            transform.SetAsLastSibling();
        }

        public void OnDrag(PointerEventData eventData)
        {
            // eventData.delta vem em pixels da tela; o Canvas Scaler muda a escala.
            _rect.anchoredPosition += eventData.delta / _panel.Canvas.scaleFactor;
        }

        public void OnEndDrag(PointerEventData eventData)
        {
            if (_consumed) return; // foi aceita por uma lixeira e vai sumir
            _group.blocksRaycasts = true;
            transform.SetParent(_panel.Tray, false);
        }

        public void Consume() => _consumed = true;
        public void MarkMistake() => HadMistake = true;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Sorting/RecycleBin.cs
using System;
using System.Collections;
using CapibaribeVivo.Data;
using UnityEngine;
using UnityEngine.EventSystems;

namespace CapibaribeVivo.Sorting
{
    // POR QUE: cada lixeira colorida aceita um ou mais tipos de lixo.
    // ESTRATÉGIA: a lixeira guarda uma LISTA de tipos aceitos em vez de um só.
    // Assim o modo de 3 lixeiras (Parte 1 §5, em aberto) é só montar 3 lixeiras
    // com listas maiores (ex.: "reciclável" aceita papel, plástico, vidro e
    // metal), sem mudar código.
    public class RecycleBin : MonoBehaviour, IDropHandler
    {
        [SerializeField] private string _label = "lixeira vermelha, do plástico";
        [SerializeField] private TrashCategory[] _accepts = { TrashCategory.Plastic };
        [SerializeField] private SortingPanel _panel;

        private Coroutine _pulse;

        public string Label => _label;

        public bool Accepts(TrashCategory category) => Array.IndexOf(_accepts, category) >= 0;

        // A Unity chama isto quando algo é solto em cima da lixeira.
        public void OnDrop(PointerEventData eventData)
        {
            var card = eventData.pointerDrag != null ? eventData.pointerDrag.GetComponent<TrashCard>() : null;
            if (card != null) _panel.HandleDrop(card, this);
        }

        // Pulinho de acerto.
        public void PlayCorrect() => Pulse(1.15f, 1);

        // Pisca três vezes: "o certo era aqui".
        public void Highlight() => Pulse(1.3f, 3);

        private void Pulse(float scale, int times)
        {
            if (_pulse != null) StopCoroutine(_pulse);
            _pulse = StartCoroutine(PulseRoutine(scale, times));
        }

        private IEnumerator PulseRoutine(float scale, int times)
        {
            const float half = 0.12f;
            for (int i = 0; i < times; i++)
            {
                for (float t = 0f; t < half * 2f; t += Time.unscaledDeltaTime)
                {
                    float k = 1f - Mathf.Abs(t / half - 1f); // sobe e desce: 0 → 1 → 0
                    transform.localScale = Vector3.one * Mathf.Lerp(1f, scale, k);
                    yield return null;
                }
            }
            transform.localScale = Vector3.one;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Sorting/SortingPanel.cs
using System;
using System.Collections.Generic;
using CapibaribeVivo.Core;
using CapibaribeVivo.Data;
using CapibaribeVivo.River;
using CapibaribeVivo.UI;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CapibaribeVivo.Sorting
{
    // POR QUE: é aqui que a reciclagem é ensinada (Parte 1 §6): arrastar cada
    // item para a lixeira certa, com explicação quando erra e sem punição.
    // ESTRATÉGIA: o painel cria uma TrashCard por item do porão e decide cada
    // soltura. Acerto: pontos, pulinho e a frase "Você sabia?" num balão (sem
    // pausar). Erro: cartão explicando (InfoCardPanel) e a lixeira certa pisca.
    // O jogo fica pausado do abrir ao fechar.
    public class SortingPanel : MonoBehaviour
    {
        public static SortingPanel Instance { get; private set; }

        [SerializeField] private GameObject _root;
        [SerializeField] private Canvas _canvas;
        [SerializeField] private RectTransform _tray;      // tem um Grid Layout Group
        [SerializeField] private RectTransform _dragLayer; // filho do painel, por cima de tudo
        [SerializeField] private TrashCard _cardPrefab;
        [SerializeField] private RecycleBin[] _bins;
        [SerializeField] private TMP_Text _factText;       // balão "Você sabia?"
        [SerializeField] private Button _doneButton;       // "Voltar ao rio"

        private readonly List<TrashCard> _cards = new();
        private Action _onClosed;

        public Canvas Canvas => _canvas;
        public RectTransform Tray => _tray;
        public RectTransform DragLayer => _dragLayer;
        public bool IsOpen => _root.activeSelf;

        private void Awake()
        {
            Instance = this;
            _root.SetActive(false);
            _doneButton.onClick.AddListener(Close);
        }

        // Abre a separação com os itens do porão.
        public void Open(List<TrashItemDef> items, Action onClosed = null)
        {
            _onClosed = onClosed;
            _root.SetActive(true);
            GamePause.Push();

            foreach (var item in items)
            {
                TrashCard card = Instantiate(_cardPrefab, _tray);
                card.Init(item, this);
                _cards.Add(card);
            }

            _factText.text = "Arraste cada lixo para a lixeira certa!";
            _doneButton.gameObject.SetActive(false);
        }

        // Chamado pela lixeira quando uma carta é solta nela.
        public void HandleDrop(TrashCard card, RecycleBin bin)
        {
            var config = GameConfig.Instance;

            if (bin.Accepts(card.Item.category))
            {
                int points = card.HadMistake ? config.pointsPerLateSort : config.pointsPerCorrectSort;
                RiverHealth.Instance?.AddPoints(points);
                bin.PlayCorrect();
                _factText.text = card.Item.fact;
                Narrator.Instance?.Play(card.Item.factNarration);

                card.Consume();
                _cards.Remove(card);
                Destroy(card.gameObject);

                if (_cards.Count == 0)
                {
                    _factText.text = "Tudo separado! O rio agradece.";
                    _doneButton.gameObject.SetActive(true);
                }
                return;
            }

            card.MarkMistake();
            RecycleBin right = FindBinFor(card.Item.category);
            right?.Highlight();
            string where = right != null ? right.Label : "outra lixeira";
            InfoCardPanel.Instance.Show(
                "Ops!",
                $"{card.Item.displayName} vai na {where}.\n\n{card.Item.fact}",
                card.Item.icon,
                card.Item.factNarration);
        }

        private RecycleBin FindBinFor(TrashCategory category)
        {
            foreach (var bin in _bins)
                if (bin.Accepts(category)) return bin;
            return null;
        }

        private void Close()
        {
            _root.SetActive(false);
            GamePause.Pop();
            Action callback = _onClosed;
            _onClosed = null;
            callback?.Invoke();
        }
    }
}
```

> `RiverHealth` vem na Fase 4: até lá, comente a linha dele também aqui.

### 3.4 O Ecoponto: `Ecopoint`

```csharp
// Caminho: Assets/_Project/Scripts/Sorting/Ecopoint.cs
using CapibaribeVivo.Boat;
using CapibaribeVivo.Core;
using CapibaribeVivo.UI;
using UnityEngine;

namespace CapibaribeVivo.Sorting
{
    // POR QUE: o Ecoponto é o pier da margem onde o lixo é separado (Parte 1
    // §6). Encostar o barco nele, ou clicar nele, abre a separação.
    // ESTRATÉGIA: um collider trigger que entra um pouco na água. Só o casco do
    // barco conta (o puçá também é trigger e entraria junto, abrindo a tela
    // duas vezes). Clicar com o barco longe manda o barco ao "dock", um ponto
    // na água em frente ao pier.
    public class Ecopoint : MonoBehaviour, IClickable
    {
        [SerializeField] private Transform _dock;

        private bool _boatInside;

        private void OnEnable() => CargoFullHint.Targets.Add(_dock);
        private void OnDisable() => CargoFullHint.Targets.Remove(_dock);

        private void OnTriggerEnter2D(Collider2D other)
        {
            var boat = HullOf(other);
            if (boat == null) return;
            _boatInside = true;
            TryOpen(boat);
        }

        private void OnTriggerExit2D(Collider2D other)
        {
            if (HullOf(other) != null) _boatInside = false;
        }

        public void OnClicked(BoatController boat)
        {
            if (_boatInside) TryOpen(boat);
            else boat.SetTarget(_dock.position);
        }

        // Devolve o barco se o collider for o casco (não o puçá, que é trigger).
        private static BoatController HullOf(Collider2D other)
        {
            if (other.isTrigger) return null;
            return other.GetComponentInParent<BoatController>();
        }

        private void TryOpen(BoatController boat)
        {
            if (SortingPanel.Instance.IsOpen) return;

            var cargo = boat.GetComponent<BoatCargo>();
            if (cargo.Items.Count == 0)
            {
                Toast.Show("O porão está vazio. Recolha lixo no rio!");
                return;
            }

            boat.Stop();
            SortingPanel.Instance.Open(cargo.TakeAll());
        }
    }
}
```

### 3.5 Montar a cena

1. **Ecoponto:** um objeto `Ecopoint` na margem, layer `Interact`, com o sprite do pier e das 6 lixeiras, um **Box Collider 2D** **Is Trigger** que avança uns 1,5 m sobre a água, e `Ecopoint`. Um filho vazio `Dock` na água, em frente ao pier.
2. **Painel de separação** (no Canvas `HUD`): `Sorting`, com o `SortingPanel` nele e um filho `Root` (o que liga e desliga) contendo:
   - Um fundo escuro de tela inteira (Image com **Raycast Target** ligado, para bloquear cliques no jogo).
   - `Tray`: um painel com **Grid Layout Group** (células de 140 × 160).
   - 6 lixeiras (Images grandes nas cores da Parte 1 §5) com `RecycleBin`, cada uma com seu rótulo (ex.: "lixeira azul, do papel") e tipos aceitos.
   - `FactText` (balão) e `DoneButton` ("Voltar ao rio").
   - `DragLayer`: um RectTransform vazio de tela inteira, **último filho** do `Root`, onde a carta fica durante o arraste.
3. **Prefab da carta** (`Prefabs/UI/TrashCard`): Image de fundo, Image do ícone, texto do nome, **CanvasGroup** e `TrashCard`.
4. **Cartão** (no Canvas `HUD`, **depois** do `Sorting` na Hierarchy, para ficar por cima): `InfoCard` com `InfoCardPanel` e o `Root` com fundo escuro, Image, título, texto e botão.

### ✅ Checkpoint da Fase 3
- Com lixo no porão, encostar no Ecoponto para o barco, pausa o jogo (o lixo do rio para de balançar) e mostra as cartas na bandeja.
- Encostar com o porão vazio mostra "O porão está vazio".
- Arrastar para a lixeira certa: a carta some, a lixeira pula e o balão mostra a frase do item.
- Arrastar para a errada: a carta volta, abre o cartão "Ops!" dizendo a lixeira certa, e ela pisca.
- Separar tudo mostra "Voltar ao rio"; ao clicar, o jogo volta a andar e o HUD do porão está vazio.
- Com o porão cheio, a seta aponta para o Ecoponto.

#### Problemas comuns
- **A carta não solta na lixeira (sempre volta):** o `blocksRaycasts` da carta não foi desligado, ou a Image da lixeira está com **Raycast Target** desligado.
- **A tela abre duas vezes:** a checagem `other.isTrigger` foi removida, e o puçá entrou junto com o casco.
- **A carta fica atrás das lixeiras durante o arraste:** o `DragLayer` não é o último filho do `Root`.

Próxima fase: **Rio Vivo, Fauna e Álbum**, onde os pontos viram a barra, a água clareia e os bichos voltam.

---

# Parte 7 — Implementação Unity: Fase 4 (Rio Vivo, Fauna e Álbum)

## Fase 4 — Rio Vivo, Fauna e Álbum

> Objetivo desta fase: recolher e separar enchem a barra do Rio Vivo; a água clareia; ao passar de cada limite, uma espécie aparece, abre o cartão dela na primeira vez e entra no Álbum salvo no navegador.

### 4.1 O Rio Vivo: `RiverHealth`

```csharp
// Caminho: Assets/_Project/Scripts/River/RiverHealth.cs
using System;
using System.Collections.Generic;
using CapibaribeVivo.Data;
using UnityEngine;

namespace CapibaribeVivo.River
{
    // POR QUE: o Rio Vivo é a barra principal (Parte 1 §7): sobe com pontos,
    // nunca desce, e fica presa num teto enquanto houver fontes de poluição
    // abertas.
    // ESTRATÉGIA: guarda os pontos brutos e calcula Value = mínimo entre
    // (pontos / meta) e o teto. Os pontos acima do teto não se perdem: quando
    // uma fonte fecha, o teto sobe e a barra pula. As fontes se registram aqui
    // pela interface IPollutionSource (definida abaixo), para o Rio Vivo não
    // depender do código das fontes, que só vem na Fase 5.
    public class RiverHealth : MonoBehaviour
    {
        public static RiverHealth Instance { get; private set; }

        public event Action<float> Changed; // novo valor, de 0 a 1
        public event Action Completed;      // chegou a 100%, uma vez só

        [SerializeField] private int _goalPoints = 100; // Parte 1 §7 (proposta)

        private readonly List<IPollutionSource> _sources = new();
        private int _points;
        private bool _completed;

        public float Value { get; private set; }
        public float Ceiling { get; private set; } = 1f;

        private void Awake() => Instance = this;

        // Uma fonte nova no trecho (ela chama isto no Start dela).
        public void Register(IPollutionSource source)
        {
            _sources.Add(source);
            Recalculate();
        }

        public void AddPoints(int points)
        {
            _points += points;
            Recalculate();
        }

        // Refaz a conta (as fontes chamam quando fecham).
        public void Recalculate()
        {
            int open = 0;
            foreach (var s in _sources) if (s.IsOpen) open++;
            float openFraction = _sources.Count == 0 ? 0f : open / (float)_sources.Count;

            Ceiling = 1f - GameConfig.Instance.openSourcesCeilingPenalty * openFraction;
            float raw = Mathf.Clamp01(_points / (float)_goalPoints);
            Value = Mathf.Max(Value, Mathf.Min(raw, Ceiling)); // Max: nunca desce

            Changed?.Invoke(Value);

            if (!_completed && Value >= 1f)
            {
                _completed = true;
                Completed?.Invoke();
            }
        }
    }

    // POR QUE: o contrato mínimo que o Rio Vivo precisa de uma fonte.
    public interface IPollutionSource
    {
        bool IsOpen { get; }
    }
}
```

Agora descomente as linhas do `RiverHealth` em `BoatNet` (Fase 2) e `SortingPanel` (Fase 3).

### 4.2 Mostrar o Rio Vivo: `RiverHealthBar` e `WaterTint`

```csharp
// Caminho: Assets/_Project/Scripts/UI/RiverHealthBar.cs
using CapibaribeVivo.River;
using UnityEngine;
using UnityEngine.UI;

namespace CapibaribeVivo.UI
{
    // POR QUE: a barra do topo da tela (Parte 1 §15), com o cadeado no teto das
    // fontes, para a criança ver que "não sobe mais" enquanto a fonte estiver aberta.
    // ESTRATÉGIA: uma Image do tipo "Filled" (a Unity corta a imagem conforme o
    // fillAmount, de 0 a 1). O enchimento anima até o valor novo. O cadeado é
    // posicionado mexendo nas âncoras: âncora X = teto, então ele fica na
    // fração certa da barra, qualquer que seja a largura dela.
    public class RiverHealthBar : MonoBehaviour
    {
        [SerializeField] private Image _fill;
        [SerializeField] private RectTransform _lock; // ícone de cadeado
        [SerializeField] private float _speed = 0.5f;  // fração da barra por segundo

        private float _target;

        private void Start()
        {
            RiverHealth.Instance.Changed += OnChanged;
            OnChanged(RiverHealth.Instance.Value);
            _fill.fillAmount = _target;
        }

        private void OnDestroy()
        {
            if (RiverHealth.Instance != null) RiverHealth.Instance.Changed -= OnChanged;
        }

        private void OnChanged(float value)
        {
            _target = value;
            float ceiling = RiverHealth.Instance.Ceiling;
            _lock.gameObject.SetActive(ceiling < 1f);
            _lock.anchorMin = new Vector2(ceiling, _lock.anchorMin.y);
            _lock.anchorMax = new Vector2(ceiling, _lock.anchorMax.y);
        }

        private void Update()
        {
            _fill.fillAmount = Mathf.MoveTowards(_fill.fillAmount, _target, _speed * Time.unscaledDeltaTime);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/River/WaterTint.cs
using UnityEngine;

namespace CapibaribeVivo.River
{
    // POR QUE: a água muda de cor com o Rio Vivo (Parte 1 §7). É a recompensa
    // mais visível do pilar "cada lixo traz o rio de volta".
    // ESTRATÉGIA: um Gradient (faixa de cores editável no Inspector) indo do
    // marrom ao verde-azulado. A cor muda devagar, para a criança perceber.
    // Manchas de óleo e espuma são sprites que somem por limite.
    public class WaterTint : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _water;
        [SerializeField] private Gradient _gradient;
        [SerializeField] private float _speed = 0.3f;
        [SerializeField] private SpriteRenderer[] _stains;      // manchas e espuma
        [SerializeField, Range(0f, 1f)] private float _stainsGoneAt = 0.6f;

        private float _shown;

        private void Update()
        {
            if (RiverHealth.Instance == null) return;

            _shown = Mathf.MoveTowards(_shown, RiverHealth.Instance.Value, _speed * Time.deltaTime);
            _water.color = _gradient.Evaluate(_shown);

            // As manchas vão ficando transparentes até sumir no limite.
            float stainAlpha = 1f - Mathf.Clamp01(_shown / _stainsGoneAt);
            foreach (var stain in _stains)
            {
                Color c = stain.color;
                c.a = stainAlpha;
                stain.color = c;
            }
        }
    }
}
```

### 4.3 Guardar o que a criança descobriu: `SaveSystem` e `AlbumService`

O Álbum precisa ser salvo desde o primeiro bicho, então o save entra aqui.

```csharp
// Caminho: Assets/_Project/Scripts/Data/AlbumEntryDef.cs
using UnityEngine;

namespace CapibaribeVivo.Data
{
    // As três abas do Álbum (Parte 1 §12).
    public enum AlbumSection { Fauna, Places, Tips }

    // POR QUE: bichos, postais e dicas são todos "um cartão do Álbum": imagem,
    // título, texto e narração.
    // ESTRATÉGIA: uma classe base. FaunaDef herda dela (é um cartão com dados a
    // mais); postais e dicas usam esta classe direto. Todos ficam em
    // Resources/Album, para a tela do Álbum achar todos sem lista manual (Fase 6).
    [CreateAssetMenu(menuName = "Capibaribe Vivo/Album Entry", fileName = "Album_")]
    public class AlbumEntryDef : ScriptableObject
    {
        public string id = "dica-canal";  // não mude depois de publicado: o save usa o id
        public AlbumSection section;
        public int order;                 // posição dentro da aba
        public string title = "Lixo no chão vai parar no rio";
        public Sprite image;
        [TextArea(3, 8)] public string text;
        public AudioClip narration;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Core/SaveSystem.cs
using System;
using System.Collections.Generic;
using CapibaribeVivo.Data;
using UnityEngine;

namespace CapibaribeVivo.Core
{
    // O que vai para o disco (Parte 1 §18). [Serializable] deixa o JsonUtility
    // transformar isto em texto JSON.
    [Serializable]
    public class SaveData
    {
        public int version = 1;
        public string characterId = "";
        public List<string> completedStretches = new();
        public List<string> album = new();
    }

    // POR QUE: o save é só local (Parte 1 §18): personagem, trechos limpos e
    // Álbum. No build Web, o PlayerPrefs da Unity guarda no próprio navegador.
    // ESTRATÉGIA: o SaveData inteiro vira um texto JSON numa chave do
    // PlayerPrefs. É carregado na primeira vez que alguém pede. Um save
    // corrompido não trava o jogo: vira um save novo.
    public static class SaveSystem
    {
        private const string Key = "capibaribevivo-save-v1";
        private static SaveData _data;

        public static SaveData Data
        {
            get
            {
                if (_data == null) Load();
                return _data;
            }
        }

        public static void Load()
        {
            string json = PlayerPrefs.GetString(Key, "");
            try
            {
                _data = string.IsNullOrEmpty(json) ? new SaveData() : JsonUtility.FromJson<SaveData>(json);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"Save inválido, começando do zero: {e.Message}");
                _data = null;
            }
            _data ??= new SaveData();
        }

        public static void Save()
        {
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(Data));
            PlayerPrefs.Save(); // no navegador, é isto que grava de fato
        }

        // Apaga tudo (botão escondido para o professor, ou para testar).
        public static void ResetAll()
        {
            _data = new SaveData();
            Save();
        }

        // Sem "domain reload" no Play Mode, campos static sobrevivem entre Plays;
        // isto garante que cada Play leia o save de novo.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetStatics() => _data = null;
    }

    // POR QUE: desbloquear um cartão do Álbum acontece em três lugares
    // (fauna, fonte, postal) e precisa sempre salvar.
    // ESTRATÉGIA: uma função que adiciona o id ao save, salva e diz se era novo
    // (para o jogo decidir entre "Novo no Álbum!" e "voltou").
    public static class AlbumService
    {
        public static event Action<AlbumEntryDef> Unlocked;

        public static bool IsUnlocked(AlbumEntryDef entry) =>
            entry != null && SaveSystem.Data.album.Contains(entry.id);

        public static bool Unlock(AlbumEntryDef entry)
        {
            if (entry == null || IsUnlocked(entry)) return false;
            SaveSystem.Data.album.Add(entry.id);
            SaveSystem.Save();
            Unlocked?.Invoke(entry);
            return true;
        }
    }
}
```

### 4.4 Os bichos: `FaunaDef`, `FaunaSpawnPoint`, `FaunaAnimal` e `FaunaSpawner`

```csharp
// Caminho: Assets/_Project/Scripts/Data/FaunaDef.cs
using UnityEngine;

namespace CapibaribeVivo.Data
{
    // Onde o bicho vive: decide onde ele aparece e como se mexe.
    public enum FaunaHabitat { Water, Bank, Air }

    // POR QUE: cada espécie (Parte 1 §8) é um cartão do Álbum com dados a mais:
    // o limite de Rio Vivo em que volta, o habitat e o prefab que anda na cena.
    [CreateAssetMenu(menuName = "Capibaribe Vivo/Fauna", fileName = "Fauna_")]
    public class FaunaDef : AlbumEntryDef
    {
        [Range(0f, 1f)] public float healthThreshold = 0.3f;
        public FaunaHabitat habitat;
        public Fauna.FaunaAnimal prefab;
        public int count = 3; // quantos aparecem no trecho
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Fauna/FaunaSpawnPoint.cs
using CapibaribeVivo.Data;
using UnityEngine;

namespace CapibaribeVivo.Fauna
{
    // POR QUE: os bichos não podem nascer em qualquer lugar: peixe na água,
    // caranguejo na lama da margem, garça no céu ou pousada.
    // ESTRATÉGIA: pontos vazios espalhados à mão no trecho, cada um com um
    // habitat. O spawner sorteia entre os pontos do habitat certo.
    public class FaunaSpawnPoint : MonoBehaviour
    {
        [SerializeField] private FaunaHabitat _habitat;
        [SerializeField] private float _wanderRadius = 1.5f;

        public FaunaHabitat Habitat => _habitat;
        public float WanderRadius => _wanderRadius;

        private void OnDrawGizmos()
        {
            Gizmos.color = _habitat switch
            {
                FaunaHabitat.Water => Color.blue,
                FaunaHabitat.Bank => new Color(0.5f, 0.3f, 0.1f),
                _ => Color.white,
            };
            Gizmos.DrawWireSphere(transform.position, _wanderRadius);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Fauna/FaunaAnimal.cs
using System.Collections;
using CapibaribeVivo.Boat;
using CapibaribeVivo.Core;
using CapibaribeVivo.Data;
using CapibaribeVivo.UI;
using UnityEngine;

namespace CapibaribeVivo.Fauna
{
    // POR QUE: um bicho que voltou precisa parecer vivo (passear) e ensinar
    // (clicar mostra o cartão dele, Parte 1 §8).
    // ESTRATÉGIA: "andar à toa" simples: sorteia um ponto dentro de um círculo
    // em volta de casa, vai até ele, espera um pouco e sorteia outro. O sprite
    // vira para o lado em que anda. Nasce crescendo de 0 até o tamanho normal.
    public class FaunaAnimal : MonoBehaviour, IClickable
    {
        [SerializeField] private SpriteRenderer _sprite;
        [SerializeField] private float _speed = 0.8f;
        [SerializeField] private Vector2 _pause = new Vector2(0.5f, 2f); // espera entre passeios

        private FaunaDef _def;
        private Vector2 _home;
        private float _radius;
        private Vector2 _goal;
        private float _waitUntil;

        public void Init(FaunaDef def, Vector2 home, float radius)
        {
            _def = def;
            _home = home;
            _radius = radius;
            _goal = home;
            StartCoroutine(Appear());
        }

        private IEnumerator Appear()
        {
            Vector3 full = transform.localScale;
            for (float t = 0f; t < 0.5f; t += Time.deltaTime)
            {
                transform.localScale = full * Mathf.SmoothStep(0f, 1f, t / 0.5f);
                yield return null;
            }
            transform.localScale = full;
        }

        private void Update()
        {
            if (Time.time < _waitUntil) return;

            Vector2 pos = transform.position;
            if ((pos - _goal).sqrMagnitude < 0.01f)
            {
                _goal = _home + Random.insideUnitCircle * _radius;
                _waitUntil = Time.time + Random.Range(_pause.x, _pause.y);
                return;
            }

            Vector2 next = Vector2.MoveTowards(pos, _goal, _speed * Time.deltaTime);
            if (Mathf.Abs(next.x - pos.x) > 0.0001f) _sprite.flipX = next.x < pos.x;
            transform.position = next;
        }

        public void OnClicked(BoatController boat)
        {
            if (_def != null)
                InfoCardPanel.Instance.Show(_def.title, _def.text, _def.image, _def.narration);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Fauna/FaunaSpawner.cs
using System.Collections.Generic;
using CapibaribeVivo.Core;
using CapibaribeVivo.Data;
using CapibaribeVivo.River;
using CapibaribeVivo.UI;
using UnityEngine;

namespace CapibaribeVivo.Fauna
{
    // POR QUE: os bichos voltam quando o Rio Vivo passa do limite de cada um
    // (Parte 1 §8); na primeira vez no jogo, abre o cartão e entra no Álbum.
    // ESTRATÉGIA: escuta o evento Changed do Rio Vivo. Para cada espécie do
    // trecho que ainda não apareceu e cujo limite foi passado, cria os bichos
    // nos pontos do habitat dela. AlbumService.Unlock diz se é novidade.
    public class FaunaSpawner : MonoBehaviour
    {
        [SerializeField] private FaunaDef[] _fauna; // as espécies deste trecho

        private readonly HashSet<FaunaDef> _spawned = new();
        private FaunaSpawnPoint[] _points;

        private void Start()
        {
            _points = FindObjectsByType<FaunaSpawnPoint>(FindObjectsSortMode.None);
            RiverHealth.Instance.Changed += OnHealthChanged;
        }

        private void OnDestroy()
        {
            if (RiverHealth.Instance != null) RiverHealth.Instance.Changed -= OnHealthChanged;
        }

        private void OnHealthChanged(float value)
        {
            foreach (var def in _fauna)
            {
                if (_spawned.Contains(def) || value < def.healthThreshold) continue;
                _spawned.Add(def);
                Spawn(def);

                if (AlbumService.Unlock(def))
                    InfoCardPanel.Instance.Show($"Novo no Álbum: {def.title}!", def.text, def.image, def.narration);
                else
                    Toast.Show($"{def.title} voltou!");
            }
        }

        private void Spawn(FaunaDef def)
        {
            var candidates = new List<FaunaSpawnPoint>();
            foreach (var p in _points)
                if (p.Habitat == def.habitat) candidates.Add(p);

            if (candidates.Count == 0)
            {
                Debug.LogWarning($"Nenhum FaunaSpawnPoint de {def.habitat} para {def.title}.", this);
                return;
            }

            for (int i = 0; i < def.count; i++)
            {
                FaunaSpawnPoint point = candidates[Random.Range(0, candidates.Count)];
                Vector2 pos = (Vector2)point.transform.position + Random.insideUnitCircle * point.WanderRadius;
                FaunaAnimal animal = Instantiate(def.prefab, pos, Quaternion.identity, transform);
                animal.Init(def, point.transform.position, point.WanderRadius);
            }
        }
    }
}
```

### 4.5 Montar a cena

1. **Rio Vivo:** no objeto `River`, adicione `RiverHealth` (meta 100) e `WaterTint` (arraste o `Water`; no Gradient, marrom-acinzentado `#6B6650` em 0 e verde-azulado `#3FA7A0` em 1).
2. **Barra:** no `HUD`, uma barra no topo com uma Image de fundo e uma Image `Fill` (**Image Type = Filled**, **Fill Method = Horizontal**) e um ícone de cadeado como filho da barra. `RiverHealthBar` com os dois.
3. **Fauna:** crie a pasta `Resources/Album/` e, nela, os `FaunaDef` do trecho (ex.: garça-branca em 0.3, capivara em 0.6), cada um com um prefab: sprite, **Circle Collider 2D** **Is Trigger** na layer `Interact` (para o clique) e `FaunaAnimal`.
4. Espalhe `FaunaSpawnPoint`s: alguns na água, alguns na margem, alguns no ar sobre o rio.
5. Um objeto `Fauna` com `FaunaSpawner` e a lista de espécies do trecho.

### ✅ Checkpoint da Fase 4
- Recolher e separar enchem a barra do topo; ela nunca desce.
- A água muda de marrom para verde-azulado aos poucos, e as manchas somem.
- Ao passar de 30%, as garças aparecem crescendo e abre o cartão "Novo no Álbum: Garça-branca!", com o jogo pausado.
- Sair do Play e entrar de novo: ao passar de 30%, aparece só o aviso "Garça-branca voltou!" (o Álbum foi salvo).
- Clicar numa garça abre o cartão dela.

#### Problemas comuns
- **Os bichos não aparecem:** o `FaunaSpawner` ligou o evento no `Start` depois da barra já ter mudado? Não é o caso aqui (a barra começa em 0), mas, se um dia o trecho começar com Rio Vivo acima de 0, chame `OnHealthChanged(RiverHealth.Instance.Value)` no fim do `Start`.
- **Para testar o Álbum de novo do zero:** chame `SaveSystem.ResetAll()` (ex.: um botão de debug) ou, no Editor, **Edit → Clear All PlayerPrefs**.
- **A barra fica parada em 60%:** é o teto das fontes, funcionando. Só que, sem fontes na cena, o teto é 100%: se parar antes, confira a meta de pontos.

Próxima fase: **Fontes de Poluição**, os canais e esgotos que seguram o teto do Rio Vivo.

---

# Parte 8 — Implementação Unity: Fase 5 (Fontes de Poluição)

## Fase 5 — Fontes de Poluição

> Objetivo desta fase: canais e esgotos mandam lixo novo e prendem o Rio Vivo no teto; levar o barco até eles abre uma conversa com um(a) morador(a) e, no fim, a fonte fecha e a barra pula.

### 5.1 A conversa: `DialoguePanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/DialoguePanel.cs
using System;
using CapibaribeVivo.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CapibaribeVivo.UI
{
    // POR QUE: cada fonte tem 2 a 4 falas curtas de um(a) morador(a), narradas,
    // e a última tem o botão da ação (Parte 1 §9).
    // ESTRATÉGIA: um painel com retrato, nome e fala. O botão diz "Próximo"
    // até a última fala, onde vira o texto da ação ("Instalar ecobarreira").
    // Clicar nele na última fala fecha o painel e chama a ação.
    public class DialoguePanel : MonoBehaviour
    {
        public static DialoguePanel Instance { get; private set; }

        [SerializeField] private GameObject _root;
        [SerializeField] private Image _portrait;
        [SerializeField] private TMP_Text _speaker;
        [SerializeField] private TMP_Text _line;
        [SerializeField] private Button _next;
        [SerializeField] private TMP_Text _nextLabel;

        private string[] _lines;
        private AudioClip[] _audio;
        private string _actionLabel;
        private Action _onAction;
        private int _index;

        private void Awake()
        {
            Instance = this;
            _root.SetActive(false);
            _next.onClick.AddListener(Advance);
        }

        public void Show(string speaker, Sprite portrait, string[] lines, AudioClip[] audio,
                         string actionLabel, Action onAction)
        {
            _speaker.text = speaker;
            _portrait.sprite = portrait;
            _lines = lines;
            _audio = audio;
            _actionLabel = actionLabel;
            _onAction = onAction;
            _index = 0;
            _root.SetActive(true);
            GamePause.Push();
            ShowLine();
        }

        private void ShowLine()
        {
            _line.text = _lines[_index];
            bool last = _index == _lines.Length - 1;
            _nextLabel.text = last ? _actionLabel : "Próximo";
            AudioClip clip = _audio != null && _index < _audio.Length ? _audio[_index] : null;
            Narrator.Instance?.Play(clip);
        }

        private void Advance()
        {
            if (_index < _lines.Length - 1)
            {
                _index++;
                ShowLine();
                return;
            }

            _root.SetActive(false);
            Narrator.Instance?.Stop();
            GamePause.Pop();
            Action action = _onAction;
            _onAction = null;
            action?.Invoke();
        }
    }
}
```

### 5.2 A fonte: `PollutionSource`

```csharp
// Caminho: Assets/_Project/Scripts/Sources/PollutionSource.cs
using CapibaribeVivo.Boat;
using CapibaribeVivo.Core;
using CapibaribeVivo.Data;
using CapibaribeVivo.River;
using CapibaribeVivo.Trash;
using CapibaribeVivo.UI;
using UnityEngine;

namespace CapibaribeVivo.Sources
{
    public enum SourceKind { StormDrain, Sewage } // canal da rua, esgoto (Parte 1 §9)

    // POR QUE: as fontes ensinam a causa da poluição (Parte 1 §9): enquanto
    // abertas, mandam lixo novo e seguram o teto do Rio Vivo; para fechar, a
    // criança vai até lá e ouve um(a) morador(a).
    // ESTRATÉGIA: um timer manda um item do "pool" da fonte a cada intervalo,
    // se houver pouco lixo dela no rio (conta no FloatingTrash.All). Clicar com
    // o barco longe manda o barco ao "dock" e lembra que a conversa está
    // pendente; ao chegar perto, a conversa abre sozinha. A fonte de esgoto
    // manda baronesas porque elas estão no pool dela (são um TrashItemDef do
    // tipo Orgânico): não precisa de código a mais.
    public class PollutionSource : MonoBehaviour, IClickable, IPollutionSource
    {
        [Header("O que manda")]
        [SerializeField] private SourceKind _kind;
        [SerializeField] private FloatingTrash _trashPrefab;
        [SerializeField] private TrashItemDef[] _pool;
        [SerializeField] private float _interval = 6f;  // Parte 1 §9 (proposta)
        [SerializeField] private int _maxFloating = 6;
        [SerializeField] private Transform _spawnPoint; // na água, na boca do canal

        [Header("Conversa")]
        [SerializeField] private Transform _dock;       // na água, em frente à fonte
        [SerializeField] private float _talkRadius = 1.5f;
        [SerializeField] private string _speaker = "Dona Cida";
        [SerializeField] private Sprite _portrait;
        [SerializeField, TextArea(2, 4)] private string[] _lines;
        [SerializeField] private AudioClip[] _linesAudio;
        [SerializeField] private string _actionLabel = "Instalar ecobarreira";
        [SerializeField] private AlbumEntryDef _tip;    // a dica que entra no Álbum

        [Header("Visual")]
        [SerializeField] private GameObject _openVisual;   // água suja saindo
        [SerializeField] private GameObject _closedVisual; // ecobarreira / cano consertado

        private float _timer;
        private BoatController _pendingBoat;

        public bool IsOpen { get; private set; } = true;
        public SourceKind Kind => _kind;

        private void Start()
        {
            RiverHealth.Instance.Register(this);
            ApplyVisual();
        }

        private void Update()
        {
            if (!IsOpen) return;

            _timer += Time.deltaTime;
            if (_timer >= _interval)
            {
                _timer = 0f;
                if (CountMine() < _maxFloating) SpawnOne();
            }

            // O barco foi mandado para cá e chegou: abre a conversa.
            if (_pendingBoat != null && IsNear(_pendingBoat))
            {
                BoatController boat = _pendingBoat;
                _pendingBoat = null;
                StartTalk(boat);
            }
        }

        public void OnClicked(BoatController boat)
        {
            if (!IsOpen) return;
            if (IsNear(boat)) StartTalk(boat);
            else
            {
                boat.SetTarget(_dock.position);
                _pendingBoat = boat;
            }
        }

        private bool IsNear(BoatController boat) =>
            Vector2.Distance(boat.transform.position, _dock.position) <= _talkRadius;

        private void StartTalk(BoatController boat)
        {
            boat.Stop();
            DialoguePanel.Instance.Show(_speaker, _portrait, _lines, _linesAudio, _actionLabel, Close);
        }

        // A ação da última fala: a fonte para de sujar o rio.
        private void Close()
        {
            IsOpen = false;
            ApplyVisual();
            RiverHealth.Instance.AddPoints(GameConfig.Instance.pointsPerSourceClosed); // também refaz o teto

            if (AlbumService.Unlock(_tip)) Toast.Show($"Nova dica no Álbum: {_tip.title}");
        }

        private int CountMine()
        {
            int n = 0;
            foreach (var t in FloatingTrash.All) if (t.Source == this) n++;
            return n;
        }

        private void SpawnOne()
        {
            Vector2 pos = (Vector2)_spawnPoint.position + Random.insideUnitCircle * 0.3f;
            FloatingTrash trash = Instantiate(_trashPrefab, pos, Quaternion.identity);
            trash.Init(_pool[Random.Range(0, _pool.Length)], this);
        }

        private void ApplyVisual()
        {
            if (_openVisual != null) _openVisual.SetActive(IsOpen);
            if (_closedVisual != null) _closedVisual.SetActive(!IsOpen);
        }

        private void OnDrawGizmosSelected()
        {
            if (_dock == null) return;
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(_dock.position, _talkRadius);
        }
    }
}
```

### 5.3 Montar a cena

1. **Baronesa:** crie o item `Trash_Baronesa` (tipo **Organic**), com uma frase como "A baronesa cresce demais quando a água tem muito esgoto." (a validar, Parte 1 §2).
2. **Fonte de canal:** na margem, um objeto `Source_Canal`, layer `Interact`, com o sprite da boca do canal, um **Box Collider 2D** **Is Trigger** (área de clique) e `PollutionSource`:
   - **Kind** `StormDrain`, pool com garrafa PET, sacola e latinha, e os filhos `SpawnPoint` (na água, na boca do canal) e `Dock`.
   - 2 a 4 falas (exemplo, a revisar com educador(a)): "Oi! Esse canal traz a água da chuva da rua para o rio." / "Quando alguém joga lixo no chão, a chuva leva ele pelo bueiro até aqui." / "Uma ecobarreira segura o lixo antes de ele chegar no rio. Me ajuda a instalar?". Ação: "Instalar ecobarreira".
   - Um `AlbumEntryDef` de dica (aba **Tips**) em `Resources/Album/`: "Lixo no chão vai parar no rio".
   - `OpenVisual` (água escura saindo) e `ClosedVisual` (uma boia de ecobarreira atravessando a boca).
3. **Fonte de esgoto:** igual, com **Kind** `Sewage`, pool com baronesas e casca de banana, e falas sobre o esgoto. Ação: "Chamar a equipe de saneamento".
4. **Conversa:** no `HUD`, `Dialogue` com `DialoguePanel` (retrato à esquerda, nome, fala, botão), entre o `Sorting` e o `InfoCard` na Hierarchy.

### ✅ Checkpoint da Fase 5
- Com as duas fontes abertas, a barra para em 60% com o cadeado, mesmo recolhendo mais.
- A cada 6 s aparece um lixo novo na boca de cada fonte, até 6 de cada uma no rio.
- Clicar na fonte com o barco longe leva o barco até ela, e a conversa abre sozinha ao chegar.
- As falas avançam com "Próximo" e a narração de cada uma; a última mostra a ação.
- Ao fazer a ação: o visual da fonte muda, ela para de mandar lixo, a barra pula (o cadeado vai para 80%) e aparece "Nova dica no Álbum".
- Com as duas fechadas, o cadeado some e a barra chega a 100%.

#### Problemas comuns
- **O trecho nunca chega a 100%:** não há lixo suficiente. Conta rápida: (lixo inicial × 3) + (fontes × 15) precisa passar da meta, com folga, porque a criança erra a separação. Com 30 lixos e 2 fontes: 90 + 30 = 120, mais o lixo que as fontes mandarem.
- **Clicar na fonte move o barco para dentro da terra:** o `Dock` está em terra. Ele tem que ficar na água.
- **A conversa abre duas vezes:** clicar de novo na fonte enquanto o barco ainda vai até ela é ok (só troca o pendente), mas abrir a conversa e clicar fora não deve acontecer: o fundo do `DialoguePanel` precisa bloquear cliques (Image com **Raycast Target**).

Próxima fase: **Trechos, Mapa e Postal**, transformando este trecho num jogo de 6 trechos.

---

# Parte 9 — Implementação Unity: Fase 6 (Trechos, Mapa e Postal)

## Fase 6 — Trechos, Mapa e Postal

> Objetivo desta fase: limpar um trecho mostra o postal e volta ao mapa, onde o próximo trecho abriu; o mapa também abre o Álbum. Os outros 5 trechos são montados a partir do primeiro.

### 6.1 O dado do trecho: `StretchDef`

Substitua a classe vazia da Fase 2 por esta:

```csharp
// Caminho: Assets/_Project/Scripts/Data/StretchDef.cs
using UnityEngine;

namespace CapibaribeVivo.Data
{
    // POR QUE: cada trecho do rio (Parte 1 §10) tem nome, cena, posição no
    // mapa e o postal que entra no Álbum.
    // ESTRATÉGIA: um asset por trecho, listados em ordem no GameConfig. A
    // posição no mapa é uma fração (0 a 1) da imagem do mapa, para o botão
    // ficar no lugar certo em qualquer tamanho de tela.
    [CreateAssetMenu(menuName = "Capibaribe Vivo/Stretch", fileName = "Stretch_")]
    public class StretchDef : ScriptableObject
    {
        public string id = "varzea";         // não mude depois de publicado: o save usa o id
        public string displayName = "Várzea";
        public string sceneName = "Stretch_01_Varzea";
        public Vector2 mapPosition = new Vector2(0.1f, 0.5f);
        public AlbumEntryDef postcard;       // aba Places
    }
}
```

### 6.2 Fim do trecho: `StretchManager`

```csharp
// Caminho: Assets/_Project/Scripts/Progress/StretchManager.cs
using System.Collections;
using CapibaribeVivo.Core;
using CapibaribeVivo.Data;
using CapibaribeVivo.River;
using CapibaribeVivo.UI;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CapibaribeVivo.Progress
{
    // POR QUE: com o Rio Vivo em 100%, o trecho acaba (Parte 1 §3): salva que
    // foi limpo, mostra o postal e volta ao mapa.
    // ESTRATÉGIA: espera uns segundos depois do 100% (a criança merece ver o
    // rio limpo e os bichos passeando antes do postal) e usa o InfoCardPanel
    // com o botão "Voltar ao mapa". Também guarda os botões do HUD.
    public class StretchManager : MonoBehaviour
    {
        [SerializeField] private StretchDef _stretch;
        [SerializeField] private float _postcardDelay = 3f;

        private void Start() => RiverHealth.Instance.Completed += OnCompleted;

        private void OnDestroy()
        {
            if (RiverHealth.Instance != null) RiverHealth.Instance.Completed -= OnCompleted;
        }

        private void OnCompleted() => StartCoroutine(Finish());

        private IEnumerator Finish()
        {
            Toast.Show("O rio está limpo!");
            yield return new WaitForSecondsRealtime(_postcardDelay);

            var save = SaveSystem.Data;
            if (!save.completedStretches.Contains(_stretch.id))
            {
                save.completedStretches.Add(_stretch.id);
                SaveSystem.Save();
            }
            AlbumService.Unlock(_stretch.postcard);

            AlbumEntryDef card = _stretch.postcard;
            InfoCardPanel.Instance.Show(card.title, card.text, card.image, card.narration,
                                        "Voltar ao mapa", BackToMap);
        }

        // Ligado ao botão "mapa" do HUD (Parte 1 §15) e ao fim do postal.
        public void BackToMap() => SceneManager.LoadScene(GameConfig.Instance.mapScene);

        // Ligado ao botão "ouvir de novo" do HUD.
        public void RepeatNarration() => Narrator.Instance?.RepeatLast();
    }
}
```

### 6.3 O mapa: `MapScreen` e `StretchButton`

```csharp
// Caminho: Assets/_Project/Scripts/Progress/StretchButton.cs
using System;
using CapibaribeVivo.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CapibaribeVivo.Progress
{
    // POR QUE: um botão no mapa por trecho, com três estados: trancado, aberto
    // e limpo (Parte 1 §10).
    // ESTRATÉGIA: o MapScreen decide o estado; o botão só mostra (cadeado,
    // visto) e avisa quando é clicado.
    public class StretchButton : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private GameObject _lockIcon;
        [SerializeField] private GameObject _doneIcon;

        public void Setup(StretchDef def, bool unlocked, bool done, Action<StretchDef> onClick)
        {
            _label.text = def.displayName;
            _button.interactable = unlocked;
            _lockIcon.SetActive(!unlocked);
            _doneIcon.SetActive(done);
            _button.onClick.RemoveAllListeners();
            _button.onClick.AddListener(() => onClick(def));
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Progress/MapScreen.cs
using System.Collections.Generic;
using CapibaribeVivo.Core;
using CapibaribeVivo.Data;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CapibaribeVivo.Progress
{
    // POR QUE: o mapa é o desenho do rio atravessando o Recife, com um botão
    // por trecho; limpar um trecho abre o próximo (Parte 1 §10).
    // ESTRATÉGIA: cria um StretchButton por trecho do GameConfig, posicionado
    // pelas âncoras (mapPosition) sobre a imagem do mapa. O trecho i está aberto
    // se for o primeiro ou se o anterior estiver limpo.
    public class MapScreen : MonoBehaviour
    {
        [SerializeField] private RectTransform _mapImage;
        [SerializeField] private StretchButton _buttonPrefab;
        [SerializeField] private string _menuScene = "Menu";

        private void Start()
        {
            List<StretchDef> stretches = GameConfig.Instance.stretches;
            var done = SaveSystem.Data.completedStretches;

            for (int i = 0; i < stretches.Count; i++)
            {
                StretchDef def = stretches[i];
                bool isDone = done.Contains(def.id);
                bool unlocked = i == 0 || done.Contains(stretches[i - 1].id);

                StretchButton button = Instantiate(_buttonPrefab, _mapImage);
                var rect = (RectTransform)button.transform;
                rect.anchorMin = rect.anchorMax = def.mapPosition;
                rect.anchoredPosition = Vector2.zero;
                button.Setup(def, unlocked, isDone, Play);
            }
        }

        private void Play(StretchDef def) => SceneManager.LoadScene(def.sceneName);

        // Ligado ao botão "Trocar personagem".
        public void BackToMenu() => SceneManager.LoadScene(_menuScene);
    }
}
```

### 6.4 O Álbum: `AlbumScreen` e `AlbumSlot`

```csharp
// Caminho: Assets/_Project/Scripts/Progress/AlbumSlot.cs
using System;
using CapibaribeVivo.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CapibaribeVivo.Progress
{
    // POR QUE: uma figurinha do Álbum: a imagem e o nome, ou a silhueta com "?"
    // se ainda não foi descoberta (Parte 1 §12).
    // ESTRATÉGIA: a silhueta é a mesma imagem pintada de preto (Image.color),
    // sem precisar de arte a mais.
    public class AlbumSlot : MonoBehaviour
    {
        [SerializeField] private Image _image;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private Button _button;

        public void Setup(AlbumEntryDef entry, bool unlocked, Action<AlbumEntryDef> onClick)
        {
            _image.sprite = entry.image;
            _image.color = unlocked ? Color.white : Color.black;
            _label.text = unlocked ? entry.title : "?";
            _button.interactable = unlocked;
            _button.onClick.RemoveAllListeners();
            _button.onClick.AddListener(() => onClick(entry));
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Progress/AlbumScreen.cs
using System.Collections.Generic;
using System.Linq;
using CapibaribeVivo.Core;
using CapibaribeVivo.Data;
using CapibaribeVivo.UI;
using UnityEngine;

namespace CapibaribeVivo.Progress
{
    // POR QUE: o Álbum mostra o que a criança já descobriu, em três abas
    // (Parte 1 §12).
    // ESTRATÉGIA: Resources.LoadAll acha todos os cartões da pasta
    // Resources/Album (bichos, postais, dicas), sem lista manual: criar um
    // cartão novo já o põe no Álbum. Trocar de aba apaga as figurinhas e cria
    // as da aba nova, em ordem.
    public class AlbumScreen : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private Transform _grid; // tem um Grid Layout Group
        [SerializeField] private AlbumSlot _slotPrefab;

        private AlbumEntryDef[] _all;

        private void Awake()
        {
            _all = Resources.LoadAll<AlbumEntryDef>("Album");
            _root.SetActive(false);
        }

        // Ligados aos botões: abrir, fechar e as três abas (0 Bichos, 1 Lugares, 2 Dicas).
        public void Open()
        {
            _root.SetActive(true);
            ShowSection(0);
        }

        public void Close() => _root.SetActive(false);

        public void ShowSection(int section)
        {
            foreach (Transform child in _grid) Destroy(child.gameObject);

            IEnumerable<AlbumEntryDef> entries = _all
                .Where(e => (int)e.section == section)
                .OrderBy(e => e.order);

            foreach (var entry in entries)
            {
                AlbumSlot slot = Instantiate(_slotPrefab, _grid);
                slot.Setup(entry, AlbumService.IsUnlocked(entry), ShowCard);
            }
        }

        private void ShowCard(AlbumEntryDef e) =>
            InfoCardPanel.Instance.Show(e.title, e.text, e.image, e.narration);
    }
}
```

### 6.5 Montar a cena `Map`

1. Um Canvas com a imagem do mapa (o rio do oeste ao leste, Parte 1 §10) e um objeto `MapScreen`.
2. Prefab `StretchButton`: botão redondo com nome, cadeado e visto.
3. Crie os 6 `StretchDef` em `ScriptableObjects/Stretches/` com os dados da tabela da Parte 1 §10, um postal (`AlbumEntryDef`, aba **Places**) para cada, em `Resources/Album/`, e liste os trechos em ordem no `GameConfig`.
4. O `AlbumScreen` (com o `Root`, as 3 abas e o grid) e um `InfoCardPanel` também no Canvas do mapa, para abrir os cartões do Álbum.
5. Botões: **Álbum** (`AlbumScreen.Open`) e **Trocar personagem** (`MapScreen.BackToMenu`).

### 6.6 Montar os outros trechos a partir do primeiro

Cada trecho é uma cena, mas quase tudo nela é igual: barco, câmera, input, HUD, Rio Vivo, Ecoponto. Só mudam o rio desenhado, os marcos, as fontes, a fauna e o `StretchDef`.

1. Em `Stretch_01_Varzea`, coloque `StretchManager` no objeto `River` (com o `StretchDef` da Várzea) e ligue os botões do HUD: **mapa** em `BackToMap` e **ouvir de novo** em `RepeatNarration`.
2. Transforme em prefabs o que é igual em todo trecho: `Boat` (com `Net` e `Arrow`), `Input`, `HUD` (com `Sorting`, `Dialogue`, `InfoCard`, `Toast`) e `Ecopoint`.
3. Com a cena da Várzea aberta: **File → Save As Scene Template**, nome `StretchTemplate`.
4. Para cada trecho novo: **File → New Scene → StretchTemplate**, salve como `Stretch_02_Apipucos` (etc.), adicione à Scene List e mude:
   - as margens (Sprite Shape) e os marcos da margem;
   - a direção do `RiverFlow` e o retângulo da câmera e do `TrashScatter`;
   - as fontes (tipo, falas e dica, Parte 1 §10) e a meta de pontos do `RiverHealth`;
   - as espécies do `FaunaSpawner` e os `FaunaSpawnPoint`s;
   - o `StretchDef` do `StretchManager`.

### ✅ Checkpoint da Fase 6
- Chegar a 100% na Várzea mostra "O rio está limpo!", e, 3 s depois, o postal com "Voltar ao mapa".
- No mapa, a Várzea tem o visto e Apipucos abriu; os outros continuam com cadeado.
- Recarregar a página (ou sair e entrar no Play) mantém o progresso.
- O Álbum mostra os bichos já vistos, o postal da Várzea e as dicas das fontes fechadas; o resto aparece como silhueta com "?".
- Os 6 trechos abrem do mapa e cada um tem o seu postal.

#### Problemas comuns
- **O jogo fica pausado depois de voltar ao mapa:** algum painel fez `Push` sem `Pop`. O `GamePause` zera ao trocar de cena, mas, se acontecer dentro do trecho, procure um painel fechado sem `GamePause.Pop()`.
- **Um trecho não abre:** o `sceneName` do `StretchDef` está diferente do nome da cena, ou a cena não está na Scene List.
- **O Álbum está vazio:** os cartões não estão em `Resources/Album/` (precisa ser exatamente uma pasta `Album` dentro de uma pasta `Resources`).

Próxima fase: **Personagem e Narração**, com a escolha de quem rema e a gravação das vozes.

---

# Parte 10 — Implementação Unity: Fase 7 (Personagem e Narração)

## Fase 7 — Personagem e Narração

> Objetivo desta fase: a criança escolhe quem rema no menu, o barco aparece com esse personagem em todos os trechos, e todas as frases do jogo têm voz.

### 7.1 Os personagens: `CharacterDef`, `CharacterSelectScreen` e `BoatSkin`

Substitua a classe vazia da Fase 2 por esta:

```csharp
// Caminho: Assets/_Project/Scripts/Data/CharacterDef.cs
using UnityEngine;

namespace CapibaribeVivo.Data
{
    // POR QUE: a criança escolhe quem rema (Parte 1 §11); a escolha é só visual.
    // ESTRATÉGIA: um asset por personagem, com o retrato do menu e o sprite do
    // barco visto de cima com o personagem dentro.
    [CreateAssetMenu(menuName = "Capibaribe Vivo/Character", fileName = "Character_")]
    public class CharacterDef : ScriptableObject
    {
        public string id = "ana";
        public string displayName = "Ana";
        public Sprite portrait;
        public Sprite boatSprite;
        public AudioClip nameNarration; // "Ana!", tocado ao escolher
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Progress/CharacterSelectScreen.cs
using CapibaribeVivo.Core;
using CapibaribeVivo.Data;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace CapibaribeVivo.Progress
{
    // POR QUE: a primeira tela do jogo: escolher o personagem e entrar no mapa.
    // Também serve de "toque para começar": no navegador, o som só pode tocar
    // depois do primeiro clique da pessoa, e esta tela garante esse clique.
    // ESTRATÉGIA: cria um botão com o retrato de cada personagem do GameConfig.
    // Escolher salva o id e abre o mapa.
    public class CharacterSelectScreen : MonoBehaviour
    {
        [SerializeField] private Transform _grid;
        [SerializeField] private Button _portraitPrefab; // botão com uma Image

        private void Start()
        {
            foreach (CharacterDef character in GameConfig.Instance.characters)
            {
                Button button = Instantiate(_portraitPrefab, _grid);
                button.image.sprite = character.portrait;
                button.onClick.AddListener(() => Pick(character));
            }
        }

        private void Pick(CharacterDef character)
        {
            Narrator.Instance?.Play(character.nameNarration);
            SaveSystem.Data.characterId = character.id;
            SaveSystem.Save();
            SceneManager.LoadScene(GameConfig.Instance.mapScene);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Boat/BoatSkin.cs
using CapibaribeVivo.Core;
using CapibaribeVivo.Data;
using UnityEngine;

namespace CapibaribeVivo.Boat
{
    // POR QUE: o barco de todos os trechos mostra o personagem escolhido.
    // ESTRATÉGIA: no Start, procura no GameConfig o personagem com o id salvo e
    // troca o sprite. Sem escolha salva (ex.: abrindo um trecho direto no
    // Editor), fica o sprite padrão do prefab.
    public class BoatSkin : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _renderer;

        private void Start()
        {
            string id = SaveSystem.Data.characterId;
            foreach (CharacterDef character in GameConfig.Instance.characters)
            {
                if (character.id == id)
                {
                    _renderer.sprite = character.boatSprite;
                    return;
                }
            }
        }
    }
}
```

### 7.2 Montar o menu

1. Na cena `Menu`, um Canvas com o título "Capibaribe Vivo", a pergunta "Quem vai remar?" (com narração) e o grid de retratos, com `CharacterSelectScreen`.
2. Crie os personagens em `ScriptableObjects/Characters/` e liste-os no `GameConfig`.
3. No prefab `Boat`, adicione `BoatSkin` apontando para o Sprite Renderer.

### 7.3 Gravar a narração

O código já toca narração em todo lugar (`TrashItemDef.factNarration`, `AlbumEntryDef.narration`, falas das fontes, nome dos personagens). Esta parte é conteúdo:

1. **Lista de falas:** monte uma planilha com toda frase do jogo (frases dos itens, cartões, falas das fontes, avisos) e o arquivo de áudio de cada uma. Revise os textos com o(a) educador(a) antes de gravar (Parte 1 §2).
2. **Gravação:** um arquivo por frase, em `Assets/_Project/Audio/Narration/`, com nomes que batem com a planilha (ex.: `trash_pet.wav`, `fauna_garca.wav`).
3. **Importação** (selecione todos os arquivos no Project): **Force To Mono** ligado, **Load Type = Compressed In Memory**, **Compression Format = Vorbis**, **Quality** 50%. Voz não precisa de estéreo, e o tamanho do build Web importa (Fase 8).
4. Arraste cada áudio no campo do asset certo.
5. Os avisos curtos do `Toast` ficam sem voz no MVP; se o teste mostrar que as crianças não os leem, adicione um `AudioClip` ao `Toast.Show`.

### ✅ Checkpoint da Fase 7
- Abrir o jogo mostra o menu com os retratos; escolher um diz o nome e abre o mapa.
- Em qualquer trecho, o barco mostra o personagem escolhido.
- "Trocar personagem" no mapa volta ao menu, e a escolha nova vale nos trechos.
- Cartões, falas e frases dos itens tocam a voz; uma voz nova corta a anterior; "ouvir de novo" repete a última.

#### Problemas comuns
- **No build Web, a primeira narração não toca:** o navegador bloqueia som antes do primeiro clique. A tela de personagem existe para isso: não toque narração sozinha no menu antes do primeiro clique.
- **A voz fica baixa perto da música:** use um **Audio Mixer** com dois grupos (Voz e Música) e abaixe a música enquanto o `Narrator` toca.

Próxima fase: **Build Web e Próximos Passos**.

---

# Parte 11 — Implementação Unity: Fase 8 (Build Web e Próximos Passos)

## Fase 8 — Build Web e Próximos Passos

> Objetivo desta fase: o jogo rodando no navegador, leve o bastante para os computadores da escola, e a lista do que vem depois do MVP.

### 8.1 Configurar o build Web

1. **File → Build Profiles → Web → Switch Platform.** Confira a Scene List: `Menu`, `Map` e os 6 trechos, com `Menu` em primeiro.
2. **Player Settings → Resolution and Presentation:** tamanho padrão 1280 × 720, **Run In Background** desligado.
3. **Player Settings → Publishing Settings:**
   - **Compression Format = Gzip**, com **Decompression Fallback** ligado. Os servidores das escolas (e muitos hospedeiros simples) não enviam os cabeçalhos que o Brotli/Gzip precisam; com o fallback, o jogo abre em qualquer lugar, só um pouco mais devagar na primeira vez.
4. **Player Settings → Other Settings:** **Managed Stripping Level = Medium** (diminui o build). Se algo quebrar só no build, volte para **Low**.
5. **Build Profiles → Build** numa pasta `Build/Web/`. Para testar, use **Build And Run**: a Unity sobe um servidor local. Abrir o `index.html` direto do disco não funciona.

### 8.2 Testar como na escola

- Teste num computador fraco (ou com a CPU limitada pelas ferramentas do navegador): o trecho precisa rodar liso com 30 lixos, 2 fontes e os bichos.
- Teste com mouse de verdade e com uma criança: o tamanho dos alvos de clique, a velocidade do barco e o porão de 8 vêm daí (Parte 1 §20, números de proposta).
- Teste o save: jogue um trecho, feche a aba e abra de novo; depois teste em janela anônima (o save some, o que é o comportamento esperado e o risco anotado na Parte 1 §18).
- Meça o tamanho do build: a narração é o que mais pesa. Se passar de uns 50 MB, reduza a qualidade do Vorbis.

### 8.3 Publicar

- **Em aberto:** onde hospedar (o GitHub Pages do estúdio, um portal de jogos educativos, o site da escola). Qualquer hospedagem de arquivos estáticos funciona, por causa do Decompression Fallback.

### ✅ Checkpoint da Fase 8
- O build abre no Chrome, Firefox e Edge, no endereço publicado, sem erros no console do navegador.
- O jogo inteiro funciona do menu ao 6º trecho, com som e narração.
- O progresso continua depois de fechar e abrir a aba.
- O trecho roda liso num computador fraco.

#### Problemas comuns
- **Tela com "Unable to parse Build/....framework.js.gz":** o servidor não manda o cabeçalho `Content-Encoding`. Ligue **Decompression Fallback** (§8.1) e faça o build de novo.
- **O progresso some entre as aulas:** o navegador da escola limpa os dados ao fechar. Não há conserto no código; é o "código do progresso" em aberto (Parte 1 §18).

### 8.4 Próximos passos (depois do MVP)

Na ordem sugerida, todos **Em aberto** na Parte 1:
1. **Validação dos fatos e textos** com educador(a) e biólogo(a), antes de qualquer teste em escola.
2. **Modo de 3 lixeiras** para os menores (só montar lixeiras com listas maiores, Fase 3 §3.3).
3. **Perfis locais ou código do progresso**, para o computador compartilhado da escola.
4. **Versão para tablet:** o controle já usa `Pointer` (mouse e toque); falta o layout da UI em telas menores e o build Android/iOS.
5. **Trechos do Agreste e da nascente**, com a fonte das lavanderias de jeans.
6. **Guia do professor** e Álbum imprimível.
7. **Melhorias do barco** e estrelas por trecho, se os testes mostrarem que falta motivação para continuar.

---
*Versão: rascunho inicial — a refinar conforme prototipagem e validação com educadores.*
